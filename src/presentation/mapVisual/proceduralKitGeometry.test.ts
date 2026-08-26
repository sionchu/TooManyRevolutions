import { describe, expect, it } from "vitest";

import {
  getProceduralWorldArtKit,
  PROCEDURAL_WORLD_ART_KITS,
} from "./proceduralKitGeometry";
import {
  MAP_MATERIAL_FAMILIES,
  MAP_OBJECT_ASSET_MANIFEST,
  MAP_SCALE_HIERARCHY,
  type MapObjectFamily,
} from "./worldArt";

const EXPECTED_KIT_FAMILIES: readonly MapObjectFamily[] = [
  "palace",
  "assembly-parliament",
  "dense-town",
  "small-settlement",
  "port-dock",
  "mine",
  "factory-iron-works",
  "fort",
  "checkpoint-gate",
  "granary-storehouse",
  "distribution-yard",
  "barricade",
  "faction-banner",
  "mountain-cluster",
  "forest-cluster",
  "field-plot",
  "road-corridor",
];

describe("PROCEDURAL_WORLD_ART_KITS", () => {
  it("provides renderable multi-primitive geometry for every semantic family", () => {
    expect(Object.keys(PROCEDURAL_WORLD_ART_KITS)).toEqual(
      EXPECTED_KIT_FAMILIES,
    );
    const signatures = new Set<string>();
    for (const family of EXPECTED_KIT_FAMILIES) {
      const kit = getProceduralWorldArtKit(family);
      const manifest = MAP_OBJECT_ASSET_MANIFEST.find(
        (asset) => asset.family === family,
      );
      expect(kit).toBeDefined();
      expect(manifest).toBeDefined();
      if (kit === undefined || manifest === undefined) continue;
      expect(kit.primitiveCount).toBe(kit.primitives.length);
      expect(kit.primitiveCount).toBeGreaterThanOrEqual(3);
      expect(kit.primitiveCount).toBeLessThanOrEqual(10);
      expect(kit.relativeScale).toBe(
        MAP_SCALE_HIERARCHY[kit.scaleRole].relativeScale,
      );
      expect(kit.relativeScale).toBe(manifest.relativeScale);
      expect(kit.assetId).toBe(manifest.assetId);
      expect(kit.replacementSeam).toEqual(manifest.replacementSeam);
      expect(kit.provenance).toEqual(manifest.provenance);
      expect(kit.origin).toBe("ground-center");
      expect(kit.unitScale).toBe(1);
      expect(kit.scaleConvention).toBe("MAP_SCALE_HIERARCHY_RELATIVE_SCALE");
      expect(kit.primitives.map((primitive) => primitive.id)).toEqual(
        expect.arrayContaining(kit.primitives.map((primitive) => primitive.id)),
      );
      for (const primitive of kit.primitives) {
        expect(primitive.size.every((value) => value > 0)).toBe(true);
        expect(
          [...primitive.position, ...primitive.rotation].every((value) =>
            Number.isFinite(value),
          ),
        ).toBe(true);
        expect(MAP_MATERIAL_FAMILIES[primitive.materialFamily]).toBeDefined();
      }
      const signature = kit.primitives
        .map(
          (primitive) =>
            `${primitive.kind}:${primitive.size.join(",")}:${primitive.position.join(",")}`,
        )
        .join("|");
      expect(signatures.has(signature)).toBe(false);
      signatures.add(signature);
    }
  });

  it("marks repeatable terrain kits as instance-friendly", () => {
    expect(
      ["mountain-cluster", "forest-cluster", "field-plot"].map(
        (family) =>
          getProceduralWorldArtKit(family as MapObjectFamily)?.instancing,
      ),
    ).toEqual(["instance-friendly", "instance-friendly", "instance-friendly"]);
    expect(getProceduralWorldArtKit("palace")?.instancing).toBe(
      "single-placement",
    );
  });
});
