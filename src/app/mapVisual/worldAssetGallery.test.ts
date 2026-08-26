import { describe, expect, it } from "vitest";

import {
  createWorldAssetGallerySnapshot,
  WORLD_ASSET_GALLERY_SLOTS,
} from "./worldAssetGalleryModel";
import { WORLD_ASSET_ENTRIES } from "../../presentation/modelAssets/worldAssetManifest";

describe("WORLD_ASSET_GALLERY", () => {
  it("lays out all requested slots without inventing a port asset", () => {
    const snapshot = createWorldAssetGallerySnapshot();
    expect(snapshot.map((panel) => panel.slotId)).toEqual(
      WORLD_ASSET_GALLERY_SLOTS,
    );
    expect(snapshot).toHaveLength(17);
    expect(snapshot.every((panel) => panel.previewOnly)).toBe(true);
    expect(snapshot.find((panel) => panel.slotId === "portHero")).toMatchObject(
      {
        status: "unresolved",
        assets: [],
      },
    );
    expect(snapshot.flatMap((panel) => panel.assets)).toHaveLength(
      WORLD_ASSET_ENTRIES.length,
    );
    expect(
      snapshot
        .flatMap((panel) => panel.assets)
        .map((asset) => asset.assetId)
        .sort(),
    ).toEqual(WORLD_ASSET_ENTRIES.map((asset) => asset.assetId).sort());
  });
});
