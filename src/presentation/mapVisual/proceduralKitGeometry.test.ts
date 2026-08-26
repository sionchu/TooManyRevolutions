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
  "water-shelf",
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
      expect(
        new Set(kit.primitives.map((primitive) => primitive.id)).size,
      ).toBe(kit.primitives.length);
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

  it("encodes the P0 geography and identity silhouettes in authored primitives", () => {
    const waterShelf = getProceduralWorldArtKit("water-shelf");
    const portDock = getProceduralWorldArtKit("port-dock");
    const field = getProceduralWorldArtKit("field-plot");
    const distribution = getProceduralWorldArtKit("distribution-yard");
    const fort = getProceduralWorldArtKit("fort");
    const checkpoint = getProceduralWorldArtKit("checkpoint-gate");
    expect(waterShelf?.instancing).toBe("instance-friendly");
    expect(waterShelf?.primitives.map((primitive) => primitive.id)).toEqual(
      expect.arrayContaining([
        "water-plane",
        "shoreline-band",
        "shoreline-edge",
      ]),
    );
    const waterPlane = waterShelf?.primitives.find(
      (primitive) => primitive.id === "water-plane",
    );
    const shorelineEdge = waterShelf?.primitives.find(
      (primitive) => primitive.id === "shoreline-edge",
    );
    const pier = portDock?.primitives.find(
      (primitive) => primitive.id === "pier",
    );
    expect(waterPlane?.materialFamily).toBe("terrain-water");
    expect(waterPlane?.size[0]).toBeGreaterThan(pier?.size[0] ?? 0);
    expect(shorelineEdge).toBeDefined();
    expect(pier).toBeDefined();
    if (pier !== undefined && shorelineEdge !== undefined) {
      const pierStart = pier.position[2] - pier.size[2] / 2;
      const pierEnd = pier.position[2] + pier.size[2] / 2;
      expect(pierStart).toBeLessThan(shorelineEdge.position[2]);
      expect(pierEnd).toBeGreaterThan(shorelineEdge.position[2]);
    }

    const fieldGround = field?.primitives.find(
      (primitive) => primitive.id === "field-ground",
    );
    const furrow = field?.primitives.find(
      (primitive) => primitive.id === "furrow-a",
    );
    expect(fieldGround?.size[0]).toBeGreaterThanOrEqual(2.5);
    expect(furrow?.size[2]).toBeGreaterThanOrEqual(1.5);
    expect(distribution?.silhouetteTags).toEqual(
      expect.arrayContaining([
        "canopy",
        "loading-platform",
        "lanes",
        "open-yard",
      ]),
    );
    expect(fort?.primitives.map((primitive) => primitive.id)).toEqual(
      expect.arrayContaining(["south-wall-left", "south-wall-right", "gate"]),
    );
    const gate = fort?.primitives.find((primitive) => primitive.id === "gate");
    expect(gate?.position[1]).toBeGreaterThan(0.6);
    expect(checkpoint?.silhouetteTags).toEqual(
      expect.arrayContaining(["gate-posts", "lintel", "guard-booth"]),
    );
  });
});
