import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  AUDIO_ASSET_GENERATOR_VERSION,
  AUDIO_ASSET_PROVENANCE,
  TMR_AUDIO_ASSET_MANIFEST,
  type AudioAssetManifestEntry,
} from "../src/presentation/audio/audioAssetManifest";
import {
  parsePcmWav,
  validatePcmWav,
  type PcmWavMetrics,
} from "../src/presentation/audio/audioAssetValidation";

export const AUDIO_SAMPLE_RATE = 22_050;
export const AUDIO_CHANNELS = 1;
export const AUDIO_OUTPUT_DIR = resolve(
  fileURLToPath(new URL("../public/assets/tmr/audio/", import.meta.url)),
);

const TAU = Math.PI * 2;

type ImpactMaterial = "wood" | "metal" | "stone";
type NoiseFilter = "low" | "high";

export interface GeneratedAudioAsset {
  readonly entry: AudioAssetManifestEntry;
  readonly metrics: PcmWavMetrics;
  readonly byteLength: number;
}

class DeterministicNoise {
  private state: number;

  public constructor(seed: number) {
    this.state = seed >>> 0 || 1;
  }

  public next(): number {
    this.state = (Math.imul(this.state, 1_664_525) + 1_013_904_223) >>> 0;
    return (this.state / 4_294_967_295) * 2 - 1;
  }
}

function seedFor(cueId: string): number {
  let seed = 2_166_136_261;
  for (const character of cueId) {
    seed = Math.imul(seed ^ character.charCodeAt(0), 16_777_619);
  }
  return seed >>> 0;
}

function sampleIndex(seconds: number): number {
  return Math.max(0, Math.floor(seconds * AUDIO_SAMPLE_RATE));
}

function addFilteredNoise(
  samples: Float32Array,
  startSeconds: number,
  durationSeconds: number,
  amplitude: number,
  cutoffHz: number,
  seed: number,
  filter: NoiseFilter,
): void {
  const start = sampleIndex(startSeconds);
  const end = Math.min(
    samples.length,
    sampleIndex(startSeconds + durationSeconds),
  );
  if (end <= start) return;

  const noise = new DeterministicNoise(seed);
  const alpha = Math.min(
    1,
    1 - Math.exp((-TAU * Math.max(20, cutoffHz)) / AUDIO_SAMPLE_RATE),
  );
  const attackSamples = Math.max(
    1,
    sampleIndex(Math.min(0.018, durationSeconds * 0.2)),
  );
  const releaseSamples = Math.max(
    1,
    sampleIndex(Math.min(0.05, durationSeconds * 0.35)),
  );
  let low = 0;

  for (let index = start; index < end; index += 1) {
    const localIndex = index - start;
    const remaining = end - index;
    const envelope = Math.min(
      1,
      localIndex / attackSamples,
      remaining / releaseSamples,
    );
    const raw = noise.next();
    low += alpha * (raw - low);
    const filtered = filter === "low" ? low : raw - low;
    samples[index] += filtered * amplitude * envelope;
  }
}

function addResonance(
  samples: Float32Array,
  startSeconds: number,
  durationSeconds: number,
  amplitude: number,
  startFrequencyHz: number,
  endFrequencyHz: number,
  decaySeconds: number,
  harmonicMix = 0.2,
): void {
  const start = sampleIndex(startSeconds);
  const end = Math.min(
    samples.length,
    sampleIndex(startSeconds + durationSeconds),
  );
  if (end <= start) return;

  for (let index = start; index < end; index += 1) {
    const time = (index - start) / AUDIO_SAMPLE_RATE;
    const progress = Math.min(1, time / Math.max(0.001, durationSeconds));
    const frequency =
      startFrequencyHz + (endFrequencyHz - startFrequencyHz) * progress;
    const envelope = Math.exp(-time / Math.max(0.01, decaySeconds));
    const fundamental = Math.sin(TAU * frequency * time);
    const harmonic = Math.sin(TAU * frequency * 1.96 * time + 0.31);
    samples[index] +=
      amplitude *
      envelope *
      (fundamental * (1 - harmonicMix) + harmonic * harmonicMix);
  }
}

function addImpact(
  samples: Float32Array,
  startSeconds: number,
  durationSeconds: number,
  amplitude: number,
  fundamentalHz: number,
  material: ImpactMaterial,
  seed: number,
): void {
  const start = sampleIndex(startSeconds);
  const end = Math.min(
    samples.length,
    sampleIndex(startSeconds + durationSeconds),
  );
  if (end <= start) return;

  const noise = new DeterministicNoise(seed);
  const noiseAlpha = Math.min(
    1,
    1 -
      Math.exp(
        (-TAU * (material === "metal" ? 2_400 : 1_200)) / AUDIO_SAMPLE_RATE,
      ),
  );
  let lowNoise = 0;

  for (let index = start; index < end; index += 1) {
    const time = (index - start) / AUDIO_SAMPLE_RATE;
    const progress = Math.min(1, time / Math.max(0.001, durationSeconds));
    const envelope = Math.exp(-time / Math.max(0.018, durationSeconds * 0.34));
    const pitch =
      fundamentalHz *
      (1 - 0.38 * Math.min(1, time / Math.max(0.035, durationSeconds * 0.4)));
    const body = Math.sin(TAU * pitch * time);
    const rawNoise = noise.next();
    lowNoise += noiseAlpha * (rawNoise - lowNoise);
    const highNoise = rawNoise - lowNoise;
    const transient = Math.exp(-time / 0.014);

    let resonance = body;
    let materialNoise = highNoise * transient;
    if (material === "wood") {
      resonance +=
        Math.sin(TAU * fundamentalHz * 1.48 * time + 0.12) * 0.33 +
        Math.sin(TAU * fundamentalHz * 2.18 * time + 0.39) * 0.18;
      materialNoise *= 0.45;
    } else if (material === "metal") {
      resonance +=
        Math.sin(TAU * fundamentalHz * 1.9 * time + 0.24) * 0.27 +
        Math.sin(TAU * fundamentalHz * 3.08 * time + 0.51) * 0.16;
      materialNoise *= 0.7;
    } else {
      resonance +=
        Math.sin(TAU * fundamentalHz * 0.76 * time + 0.18) * 0.38 +
        Math.sin(TAU * fundamentalHz * 1.67 * time + 0.43) * 0.16;
      materialNoise *= 0.25;
    }

    const onset = Math.min(
      1,
      (index - start) / Math.max(1, sampleIndex(0.004)),
    );
    samples[index] +=
      amplitude *
      onset *
      (resonance * envelope * (0.58 - progress * 0.08) + materialNoise * 0.32);
  }
}

function addPaperBurst(
  samples: Float32Array,
  startSeconds: number,
  durationSeconds: number,
  amplitude: number,
  seed: number,
): void {
  addFilteredNoise(
    samples,
    startSeconds,
    durationSeconds,
    amplitude,
    1_900,
    seed,
    "high",
  );
  addResonance(
    samples,
    startSeconds + 0.012,
    Math.min(0.18, durationSeconds),
    amplitude * 0.24,
    420,
    275,
    0.09,
    0.12,
  );
}

function renderOneShot(cueId: string, durationSeconds: number): Float32Array {
  const samples = new Float32Array(
    Math.max(2, Math.round(durationSeconds * AUDIO_SAMPLE_RATE)),
  );
  const seed = seedFor(cueId);
  const impact = (
    start: number,
    duration: number,
    amplitude: number,
    frequency: number,
    material: ImpactMaterial,
    salt: number,
  ) =>
    addImpact(
      samples,
      start,
      duration,
      amplitude,
      frequency,
      material,
      seed + salt,
    );
  const paper = (
    start: number,
    duration: number,
    amplitude: number,
    salt: number,
  ) => addPaperBurst(samples, start, duration, amplitude, seed + salt);
  const noise = (
    start: number,
    duration: number,
    amplitude: number,
    cutoff: number,
    filter: NoiseFilter,
    salt: number,
  ) =>
    addFilteredNoise(
      samples,
      start,
      duration,
      amplitude,
      cutoff,
      seed + salt,
      filter,
    );
  const resonance = (
    start: number,
    duration: number,
    amplitude: number,
    from: number,
    to: number,
    decay: number,
  ) => addResonance(samples, start, duration, amplitude, from, to, decay, 0.2);

  switch (cueId) {
    case "ui.select":
      paper(0.018, 0.11, 0.34, 11);
      impact(0.13, 0.1, 0.42, 1_150, "wood", 17);
      resonance(0.135, 0.085, 0.06, 610, 430, 0.045);
      break;
    case "ui.confirm":
      paper(0.01, 0.12, 0.15, 23);
      impact(0.018, 0.2, 0.64, 105, "stone", 29);
      resonance(0.035, 0.24, 0.14, 235, 170, 0.15);
      break;
    case "ui.blocked":
      impact(0.012, 0.25, 0.55, 96, "wood", 31);
      resonance(0.035, 0.27, 0.11, 70, 55, 0.18);
      noise(0.018, 0.08, 0.1, 1_300, "high", 37);
      break;
    case "policy.enacted":
      paper(0.01, 0.16, 0.22, 41);
      impact(0.115, 0.25, 0.52, 91, "stone", 43);
      resonance(0.15, 0.28, 0.1, 225, 165, 0.17);
      break;
    case "institution.changed":
      paper(0.005, 0.17, 0.23, 47);
      impact(0.105, 0.24, 0.42, 142, "metal", 53);
      resonance(0.12, 0.25, 0.1, 315, 230, 0.13);
      break;
    case "project.started":
      impact(0.014, 0.22, 0.46, 126, "wood", 59);
      paper(0.08, 0.12, 0.13, 61);
      resonance(0.05, 0.22, 0.08, 205, 145, 0.12);
      break;
    case "project.completed":
      paper(0.008, 0.15, 0.18, 67);
      impact(0.1, 0.29, 0.56, 112, "stone", 71);
      impact(0.2, 0.23, 0.23, 218, "wood", 73);
      resonance(0.135, 0.35, 0.1, 270, 190, 0.18);
      break;
    case "crisis.rebellion":
      noise(0, 0.64, 0.3, 620, "low", 79);
      impact(0.02, 0.4, 0.58, 72, "stone", 83);
      impact(0.24, 0.3, 0.24, 94, "wood", 89);
      resonance(0.04, 0.55, 0.12, 58, 44, 0.28);
      break;
    case "crisis.coup":
      impact(0.012, 0.25, 0.54, 124, "stone", 97);
      noise(0.018, 0.18, 0.2, 1_550, "high", 101);
      resonance(0.07, 0.38, 0.11, 290, 205, 0.12);
      break;
    case "crisis.civilWar":
      noise(0, 0.78, 0.34, 500, "low", 107);
      impact(0.016, 0.52, 0.67, 58, "stone", 109);
      impact(0.3, 0.35, 0.27, 70, "wood", 113);
      resonance(0.04, 0.72, 0.13, 45, 35, 0.34);
      break;
    case "territory.controllerChanged":
      impact(0.01, 0.17, 0.4, 148, "wood", 127);
      noise(0.022, 0.11, 0.1, 1_400, "high", 131);
      resonance(0.04, 0.17, 0.06, 235, 170, 0.09);
      break;
    case "capital.threatened":
      impact(0.014, 0.32, 0.48, 78, "stone", 137);
      noise(0.01, 0.26, 0.1, 260, "low", 139);
      resonance(0.045, 0.44, 0.17, 102, 76, 0.25);
      break;
    case "border.closed":
      impact(0.01, 0.32, 0.56, 82, "wood", 149);
      impact(0.045, 0.2, 0.23, 176, "metal", 151);
      resonance(0.08, 0.31, 0.1, 210, 145, 0.16);
      break;
    case "border.reopened":
      noise(0.012, 0.2, 0.15, 1_700, "high", 157);
      impact(0.1, 0.29, 0.39, 124, "metal", 163);
      resonance(0.12, 0.34, 0.1, 145, 245, 0.15);
      break;
    case "chronicle.majorEvent":
      paper(0.006, 0.17, 0.25, 167);
      impact(0.14, 0.3, 0.4, 182, "wood", 173);
      resonance(0.16, 0.31, 0.12, 270, 205, 0.17);
      break;
    default:
      throw new Error(`No one-shot renderer for ${cueId}`);
  }

  applyOneShotFade(samples);
  normalize(samples, 0.78);
  return samples;
}

function renderAmbience(cueId: string, durationSeconds: number): Float32Array {
  const samples = new Float32Array(
    Math.max(2, Math.round(durationSeconds * AUDIO_SAMPLE_RATE)),
  );
  const noise = new DeterministicNoise(seedFor(cueId));
  let low = 0;
  let mid = 0;
  const lowAlpha = 1 - Math.exp((-TAU * 170) / AUDIO_SAMPLE_RATE);
  const midAlpha = 1 - Math.exp((-TAU * 1_050) / AUDIO_SAMPLE_RATE);

  for (let index = 0; index < samples.length; index += 1) {
    const time = index / AUDIO_SAMPLE_RATE;
    const raw = noise.next();
    low += lowAlpha * (raw - low);
    mid += midAlpha * (low - mid);
    const high = raw - low;
    let value: number;

    if (cueId === "map.ambient") {
      const windPulse = Math.sin(TAU * 0.7 * time + 0.5) * 0.05;
      const distantAir = Math.sin(TAU * 1.4 * time + 1.1) * 0.022;
      value = low * 0.23 + mid * 0.07 + high * 0.026 + windPulse + distantAir;
    } else if (cueId === "capital.ambient") {
      const roomBed = Math.sin(TAU * 1.1 * time + 0.2) * 0.038;
      const roomReflection = Math.sin(TAU * 2.2 * time + 1.7) * 0.018;
      value = low * 0.17 + mid * 0.08 + high * 0.014 + roomBed + roomReflection;
    } else if (cueId === "industrial.ambient") {
      const machineCycle = (0.5 + 0.5 * Math.sin(TAU * 0.4 * time - 0.7)) ** 2;
      const drone =
        Math.sin(TAU * 58 * time + 0.6) * (0.035 + machineCycle * 0.022);
      const overtone = Math.sin(TAU * 116 * time + 1.2) * 0.014;
      value = low * 0.2 + mid * 0.1 + high * 0.018 + drone + overtone;
    } else {
      throw new Error(`No ambience renderer for ${cueId}`);
    }

    samples[index] = value;
  }

  makeLoopSeamless(samples);
  normalize(samples, 0.36);
  samples[samples.length - 1] = samples[0] ?? 0;
  return samples;
}

function applyOneShotFade(samples: Float32Array): void {
  const fadeSamples = Math.max(
    1,
    Math.min(sampleIndex(0.008), Math.floor(samples.length / 8)),
  );
  for (let index = 0; index < fadeSamples; index += 1) {
    const fadeIn = index / fadeSamples;
    const fadeOut = (fadeSamples - index) / fadeSamples;
    const endIndex = samples.length - 1 - index;
    samples[index] = (samples[index] ?? 0) * fadeIn;
    if (endIndex >= 0) samples[endIndex] = (samples[endIndex] ?? 0) * fadeOut;
  }
}

function makeLoopSeamless(samples: Float32Array): void {
  const crossfadeSamples = Math.max(
    1,
    Math.min(2_048, Math.floor(samples.length / 4)),
  );
  const firstSample = samples[0] ?? 0;
  for (let index = 0; index < crossfadeSamples; index += 1) {
    const tailIndex = samples.length - crossfadeSamples + index;
    const blend = index / Math.max(1, crossfadeSamples - 1);
    samples[tailIndex] =
      (samples[tailIndex] ?? 0) * (1 - blend) + firstSample * blend;
  }
}

function normalize(samples: Float32Array, targetPeak: number): void {
  let peak = 0;
  for (const sample of samples) {
    if (!Number.isFinite(sample))
      throw new Error("Synthesis produced a non-finite sample");
    peak = Math.max(peak, Math.abs(sample));
  }
  if (peak <= 0) throw new Error("Synthesis produced silence");
  const gain = targetPeak / peak;
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = (samples[index] ?? 0) * gain;
  }
}

function clampSample(sample: number): number {
  if (!Number.isFinite(sample))
    throw new Error("Cannot encode a non-finite sample");
  return Math.max(-0.9, Math.min(0.9, sample));
}

function encodePcmWav(samples: Float32Array): Uint8Array {
  const dataBytes = samples.length * 2;
  const bytes = Buffer.alloc(44 + dataBytes);
  bytes.write("RIFF", 0, "ascii");
  bytes.writeUInt32LE(36 + dataBytes, 4);
  bytes.write("WAVE", 8, "ascii");
  bytes.write("fmt ", 12, "ascii");
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(AUDIO_CHANNELS, 22);
  bytes.writeUInt32LE(AUDIO_SAMPLE_RATE, 24);
  bytes.writeUInt32LE(AUDIO_SAMPLE_RATE * AUDIO_CHANNELS * 2, 28);
  bytes.writeUInt16LE(AUDIO_CHANNELS * 2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36, "ascii");
  bytes.writeUInt32LE(dataBytes, 40);

  for (let index = 0; index < samples.length; index += 1) {
    const pcm = Math.round(clampSample(samples[index] ?? 0) * 32_767);
    bytes.writeInt16LE(pcm, 44 + index * 2);
  }
  return bytes;
}

function renderEntry(entry: AudioAssetManifestEntry): Float32Array {
  return entry.loop
    ? renderAmbience(entry.cueId, entry.duration)
    : renderOneShot(entry.cueId, entry.duration);
}

function manifestJsonEntry(
  entry: AudioAssetManifestEntry,
  metrics: PcmWavMetrics,
): AudioAssetManifestEntry &
  Pick<
    PcmWavMetrics,
    | "sampleRate"
    | "channels"
    | "peak"
    | "rms"
    | "bitsPerSample"
    | "frameCount"
    | "dataBytes"
    | "seamDelta"
  > {
  return {
    ...entry,
    duration: Number(metrics.duration.toFixed(6)),
    sampleRate: metrics.sampleRate,
    channels: metrics.channels,
    peak: Number(metrics.peak.toFixed(6)),
    rms: Number(metrics.rms.toFixed(6)),
    bitsPerSample: metrics.bitsPerSample,
    frameCount: metrics.frameCount,
    dataBytes: metrics.dataBytes,
    seamDelta: Number(metrics.seamDelta.toFixed(6)),
  };
}

export function generateAudioAssets(
  outputDirectory = AUDIO_OUTPUT_DIR,
): readonly GeneratedAudioAsset[] {
  mkdirSync(outputDirectory, { recursive: true });
  const generated: GeneratedAudioAsset[] = [];

  for (const entry of TMR_AUDIO_ASSET_MANIFEST) {
    const samples = renderEntry(entry);
    const wav = encodePcmWav(samples);
    const metrics = parsePcmWav(wav);
    const validationErrors = validatePcmWav(entry, metrics);
    if (validationErrors.length > 0) {
      throw new Error(`${entry.file}: ${validationErrors.join(", ")}`);
    }
    writeFileSync(join(outputDirectory, entry.file), wav);
    generated.push({ entry, metrics, byteLength: wav.byteLength });
  }

  const manifest = {
    schemaVersion: 1,
    provenance: AUDIO_ASSET_PROVENANCE,
    generatorVersion: AUDIO_ASSET_GENERATOR_VERSION,
    sampleRate: AUDIO_SAMPLE_RATE,
    channels: AUDIO_CHANNELS,
    assets: generated.map(({ entry, metrics }) =>
      manifestJsonEntry(entry, metrics),
    ),
  };
  writeFileSync(
    join(outputDirectory, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  return generated;
}

const invokedScript = process.argv[1]?.replaceAll("\\", "/");
if (
  process.argv.includes("--write") ||
  invokedScript?.endsWith("/generateAudioAssets.ts")
) {
  const generated = generateAudioAssets();
  for (const asset of generated) {
    console.log(
      `${asset.entry.cueId}\t${asset.entry.file}\t${asset.metrics.duration.toFixed(5)}s\t` +
        `${asset.metrics.sampleRate}Hz\t${asset.metrics.channels}ch\t` +
        `peak=${asset.metrics.peak.toFixed(5)}\trms=${asset.metrics.rms.toFixed(5)}\t` +
        `loop=${asset.entry.loop}`,
    );
  }
  console.log(`Generated ${generated.length} project-authored WAV assets.`);
}
