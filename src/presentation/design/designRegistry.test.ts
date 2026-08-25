import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import {
  COUNTRY_CREST_ASSET_IDS,
  TMR_ASSET_MANIFEST,
  TMR_ASSETS_BY_ID,
} from "./assetManifest";
import {
  assertDesignRegistryIntegrity,
  TMR_COMPONENT_REGISTRY,
} from "./designRegistry";
import { TMR_LAYER_REGISTRY } from "./layerRegistry";

const availableAssetPaths = new Set(
  TMR_ASSET_MANIFEST.map((asset) => asset.path).filter(
    (path) =>
      path.startsWith("/") &&
      existsSync(resolve(process.cwd(), "public", path.slice(1))),
  ),
);

describe("TMR design registry", () => {
  it("has unique stable IDs, valid layers, and closed file references", () => {
    assertDesignRegistryIntegrity({ availableAssetPaths });
    expect(TMR_ASSETS_BY_ID.size).toBe(TMR_ASSET_MANIFEST.length);
    expect(TMR_LAYER_REGISTRY.map((layer) => layer.zIndex)).toEqual([
      0, 10, 20, 30, 40, 50, 60, 70, 80, 90,
    ]);
  });

  it("keeps country crests registered independently from their file names", () => {
    for (const assetId of Object.values(COUNTRY_CREST_ASSET_IDS)) {
      expect(TMR_ASSETS_BY_ID.get(assetId)?.replaceable).toBe(true);
    }
  });

  it("rejects duplicate design IDs", () => {
    expect(() =>
      assertDesignRegistryIntegrity({
        components: [TMR_COMPONENT_REGISTRY[0]!, TMR_COMPONENT_REGISTRY[0]!],
      }),
    ).toThrow("Component repeats");
  });

  it("rejects missing asset files and invalid layer references", () => {
    expect(() =>
      assertDesignRegistryIntegrity({
        availableAssetPaths: new Set(),
        assets: [TMR_ASSET_MANIFEST[0]!],
        requiredAssetIds: [],
      }),
    ).toThrow("file is missing");

    expect(() =>
      assertDesignRegistryIntegrity({
        assets: [
          {
            ...TMR_ASSET_MANIFEST[0]!,
            layerId: "tmr.layer.ui.fx" as never,
          },
        ],
        layers: TMR_LAYER_REGISTRY.filter(
          (layer) => layer.id !== "tmr.layer.ui.fx",
        ),
        requiredAssetIds: [],
      }),
    ).toThrow("missing layer");
  });

  it("requires provenance for generated assets and registration for production art", () => {
    expect(() =>
      assertDesignRegistryIntegrity({
        assets: [
          {
            ...TMR_ASSET_MANIFEST[0]!,
            source: "generated",
            promptRecipeId: undefined,
          },
        ],
        requiredAssetIds: [],
      }),
    ).toThrow("prompt recipe");

    expect(() =>
      assertDesignRegistryIntegrity({
        productionArtPaths: ["/assets/tmr/unregistered.svg"],
        requiredAssetIds: [],
      }),
    ).toThrow("not registered");

    expect(() =>
      assertDesignRegistryIntegrity({
        requiredAssetIds: ["tmr.asset.country.missing.crest"],
      }),
    ).toThrow("Required asset reference is missing");
  });
});
