import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  AUDIO_ASSET_GENERATOR_VERSION,
  AUDIO_ASSET_PROVENANCE,
  TMR_AUDIO_ASSET_MANIFEST,
} from "./audio/audioAssetManifest";
import { parsePcmWav, validatePcmWav } from "./audio/audioAssetValidation";
import { SOUND_CUE_IDS, SOUND_CUE_REGISTRY } from "./audio/soundCueRegistry";

const AUDIO_DIRECTORY = resolve(process.cwd(), "public/assets/tmr/audio");

interface GeneratedManifestJson {
  readonly assets: readonly Readonly<Record<string, unknown>>[];
  readonly generatorVersion: unknown;
  readonly provenance: unknown;
}

describe("generated project audio assets", () => {
  it("contains one validated PCM WAV for every registered cue", () => {
    expect(TMR_AUDIO_ASSET_MANIFEST).toHaveLength(SOUND_CUE_IDS.length);
    expect(
      new Set(TMR_AUDIO_ASSET_MANIFEST.map((entry) => entry.cueId)).size,
    ).toBe(TMR_AUDIO_ASSET_MANIFEST.length);
    expect(
      new Set(TMR_AUDIO_ASSET_MANIFEST.map((entry) => entry.file)).size,
    ).toBe(TMR_AUDIO_ASSET_MANIFEST.length);

    for (const entry of TMR_AUDIO_ASSET_MANIFEST) {
      const bytes = new Uint8Array(
        readFileSync(join(AUDIO_DIRECTORY, entry.file)),
      );
      const metrics = parsePcmWav(bytes);
      expect(validatePcmWav(entry, metrics)).toEqual([]);
      expect(metrics.duration).toBeCloseTo(entry.duration, 4);
      expect(metrics.sampleRate).toBe(22_050);
      expect(metrics.channels).toBe(1);
      expect(metrics.bitsPerSample).toBe(16);
      expect(metrics.peak).toBeGreaterThan(0.005);
      expect(metrics.peak).toBeLessThanOrEqual(0.95);
      expect(metrics.rms).toBeGreaterThan(0.0005);
      if (entry.loop) expect(metrics.seamDelta).toBeLessThanOrEqual(0.02);

      const definition = SOUND_CUE_REGISTRY[entry.cueId];
      expect(definition?.asset.kind).toBe("file");
      expect(definition?.asset.url).toBe(`/assets/tmr/audio/${entry.file}`);
      expect(definition?.asset.provenance).toBe(AUDIO_ASSET_PROVENANCE);
      expect(definition?.asset.procedural).toBeDefined();
    }
  });

  it("publishes stable metadata and measured metrics in the generated manifest", () => {
    const manifest = JSON.parse(
      readFileSync(join(AUDIO_DIRECTORY, "manifest.json"), "utf8"),
    ) as GeneratedManifestJson;
    expect(manifest.provenance).toBe(AUDIO_ASSET_PROVENANCE);
    expect(manifest.generatorVersion).toBe(AUDIO_ASSET_GENERATOR_VERSION);
    expect(manifest.assets).toHaveLength(TMR_AUDIO_ASSET_MANIFEST.length);

    for (const entry of TMR_AUDIO_ASSET_MANIFEST) {
      const generated = manifest.assets.find(
        (candidate) => candidate.cueId === entry.cueId,
      );
      expect(generated).toBeDefined();
      expect(generated?.id).toBe(entry.id);
      expect(generated?.file).toBe(entry.file);
      expect(generated?.category).toBe(entry.category);
      expect(generated?.materialLanguage).toBe(entry.materialLanguage);
      expect(generated?.loop).toBe(entry.loop);
      expect(generated?.provenance).toBe(AUDIO_ASSET_PROVENANCE);
      expect(generated?.generatorVersion).toBe(AUDIO_ASSET_GENERATOR_VERSION);
      expect(generated?.sampleRate).toBe(22_050);
      expect(generated?.channels).toBe(1);
      expect(generated?.peak).toEqual(expect.any(Number));
      expect(generated?.rms).toEqual(expect.any(Number));
    }
  });
});
