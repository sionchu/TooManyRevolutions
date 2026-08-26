import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  getResolvedWorldAssetEntries,
  getWorldAssetEntry,
  getWorldAssetSlot,
  WORLD_ASSET_ENTRIES,
  WORLD_ASSET_MANIFEST,
  WORLD_ASSET_SLOTS,
} from "./worldAssetManifest";

const EXPECTED_SLOT_IDS = [
  "capitalHero",
  "industrialHero",
  "portHero",
  "frontierHero",
  "houseA",
  "houseB",
  "mountainA",
  "mountainB",
  "treeClusterA",
  "treeClusterB",
  "rockCluster",
  "roadStraight",
  "roadCurve",
  "riverStraight",
  "riverCurve",
  "coast",
  "water",
] as const;

function publicFilePath(publicUrl: string): string {
  return resolve(
    process.cwd(),
    "public",
    publicUrl.slice(1).split("/").join("\\"),
  );
}

describe("WORLD_ASSET_MANIFEST", () => {
  it("contains the curated 17-model KayKit set and no unsupported pack files", () => {
    expect(WORLD_ASSET_ENTRIES).toHaveLength(17);
    expect(
      new Set(WORLD_ASSET_ENTRIES.map((entry) => entry.assetId)).size,
    ).toBe(WORLD_ASSET_ENTRIES.length);
    expect(
      WORLD_ASSET_ENTRIES.every((entry) => entry.license === "CC0-1.0"),
    ).toBe(true);
    expect(
      WORLD_ASSET_ENTRIES.every((entry) => entry.publicUrl.endsWith(".gltf")),
    ).toBe(true);
    expect(
      WORLD_ASSET_MANIFEST.sourcePacks["kaykit-medieval-hexagon"].license,
    ).toBe("CC0-1.0");
    expect(
      WORLD_ASSET_MANIFEST.sourcePacks["kaykit-forest-nature"].license,
    ).toBe("CC0-1.0");
    for (const sourcePack of Object.values(WORLD_ASSET_MANIFEST.sourcePacks)) {
      expect(sourcePack.sourceTier).toBe("free");
      expect(sourcePack.sourceDownloadSha256).toMatch(/^[A-F0-9]{64}$/);
      expect(existsSync(publicFilePath(sourcePack.licenseFile))).toBe(true);
    }
    expect(getWorldAssetSlot("portHero")).toMatchObject({
      status: "unresolved",
      assetIds: [],
    });
  });

  it("keeps every selected GLTF dependency beside its original model", () => {
    for (const entry of WORLD_ASSET_ENTRIES) {
      const modelPath = publicFilePath(entry.publicUrl);
      expect(existsSync(modelPath), entry.publicUrl).toBe(true);
      const document = JSON.parse(readFileSync(modelPath, "utf8")) as {
        readonly buffers?: readonly { readonly uri?: string }[];
        readonly images?: readonly { readonly uri?: string }[];
      };
      const dependencies = [
        ...(document.buffers ?? []).flatMap((buffer) =>
          buffer.uri === undefined ? [] : [buffer.uri],
        ),
        ...(document.images ?? []).flatMap((image) =>
          image.uri === undefined ? [] : [image.uri],
        ),
      ];
      for (const dependency of dependencies) {
        expect(
          existsSync(resolve(dirname(modelPath), dependency)),
          `${entry.publicUrl} -> ${dependency}`,
        ).toBe(true);
      }
    }
  });

  it("exposes every requested slot exactly once and preserves deterministic order", () => {
    expect(WORLD_ASSET_SLOTS.map((slot) => slot.slotId)).toEqual(
      EXPECTED_SLOT_IDS,
    );
    expect(new Set(WORLD_ASSET_SLOTS.map((slot) => slot.slotId)).size).toBe(
      EXPECTED_SLOT_IDS.length,
    );
    expect(
      getResolvedWorldAssetEntries("industrialHero").map(
        (asset) => asset.assetId,
      ),
    ).toEqual([
      "tmr.demo.asset.kaykit.mine.blue",
      "tmr.demo.asset.kaykit.blacksmith.blue",
    ]);
    for (const slot of WORLD_ASSET_SLOTS) {
      for (const assetId of slot.assetIds) {
        expect(getWorldAssetEntry(assetId)).toBeDefined();
      }
    }
  });

  it("uses positive scale normalization and an explicit shared ground origin", () => {
    for (const entry of WORLD_ASSET_ENTRIES) {
      expect(entry.normalization.scale).toBeGreaterThan(0);
      expect(entry.normalization.groundOrigin).toBe("shared-y-zero");
      expect(entry.normalization.rotation).toHaveLength(3);
      expect(entry.normalization.translation).toHaveLength(3);
      expect(entry.sourceFilename.startsWith("Assets/gltf/")).toBe(true);
    }
  });
});
