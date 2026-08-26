import { describe, expect, it } from "vitest";

import {
  createWorldArtGallerySnapshot,
  WORLD_ART_GALLERY_ROLES,
} from "./worldArtGalleryModel";
import { getProceduralWorldArtKit } from "../../presentation/mapVisual";

describe("WORLD_ART_GALLERY", () => {
  it("provides all five comparison panels as labels-off authoring preview", () => {
    const snapshot = createWorldArtGallerySnapshot();
    expect(snapshot.map((panel) => panel.role)).toEqual([
      "capital",
      "industrial",
      "port",
      "frontier",
      "agrarian-distribution",
    ]);
    expect(WORLD_ART_GALLERY_ROLES).toEqual(
      snapshot.map((panel) => panel.role),
    );
    for (const panel of snapshot) {
      expect(panel.previewOnly).toBe(true);
      expect(panel.labelsVisible).toBe(false);
      expect(panel.placements.length).toBeGreaterThanOrEqual(3);
      for (const placement of panel.placements) {
        const kit = getProceduralWorldArtKit(placement.family);
        expect(kit?.kitId).toBe(placement.kitId);
        expect(kit?.primitives.length).toBeGreaterThanOrEqual(3);
      }
    }
    expect(snapshot.find((panel) => panel.role === "port")?.placements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ family: "water-shelf" }),
        expect.objectContaining({ family: "port-dock" }),
      ]),
    );
  });
});
