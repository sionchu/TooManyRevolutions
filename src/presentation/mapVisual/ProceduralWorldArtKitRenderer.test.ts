import { describe, expect, it } from "vitest";

import {
  createProceduralPrimitiveRenderDescriptor,
  createProceduralWorldArtKitRenderDescriptor,
} from "./ProceduralWorldArtKitRenderer";
import {
  getProceduralWorldArtKit,
  PROCEDURAL_WORLD_ART_KITS,
} from "./proceduralKitGeometry";
import type { MapObjectFamily } from "./worldArt";

const KIT_FAMILIES = Object.keys(
  PROCEDURAL_WORLD_ART_KITS,
) as MapObjectFamily[];

describe("PROCEDURAL_WORLD_ART_KIT_RENDERER", () => {
  it("preserves width/height/depth through unit geometry and mesh scale", () => {
    const samples = KIT_FAMILIES.flatMap((family) => {
      const kit = getProceduralWorldArtKit(family);
      return kit === undefined ? [] : [...kit.primitives];
    });
    const box = samples.find((primitive) => primitive.kind === "box");
    const cylinder = samples.find((primitive) => primitive.kind === "cylinder");
    const cone = samples.find((primitive) => primitive.kind === "cone");
    expect(box).toBeDefined();
    expect(cylinder).toBeDefined();
    expect(cone).toBeDefined();
    if (box === undefined || cylinder === undefined || cone === undefined) {
      return;
    }

    expect(createProceduralPrimitiveRenderDescriptor(box)).toEqual({
      kind: "box",
      geometryArgs: [1, 1, 1],
      meshScale: box.size,
    });
    expect(createProceduralPrimitiveRenderDescriptor(cylinder)).toEqual({
      kind: "cylinder",
      geometryArgs: [0.5, 0.5, 1, cylinder.sides],
      meshScale: cylinder.size,
    });
    expect(createProceduralPrimitiveRenderDescriptor(cone)).toEqual({
      kind: "cone",
      geometryArgs: [0.5, 1, cone.sides],
      meshScale: cone.size,
    });
    expect(createProceduralPrimitiveRenderDescriptor(cone).meshScale).toEqual(
      cone.size,
    );
    expect(cone.size[2]).not.toBe(cone.size[1]);
  });

  it("creates a render descriptor for every Kit with stable IDs and grounding", () => {
    for (const family of KIT_FAMILIES) {
      const kit = getProceduralWorldArtKit(family);
      expect(kit).toBeDefined();
      if (kit === undefined) continue;
      const descriptor = createProceduralWorldArtKitRenderDescriptor({
        family,
        position: [2.5, 7.25, -1.5],
        scale: 1.2,
      });
      expect(descriptor.family).toBe(family);
      expect(descriptor.assetId).toBe(kit.assetId);
      expect(descriptor.kitId).toBe(kit.kitId);
      expect(descriptor.position).toEqual([2.5, 7.25, -1.5]);
      expect(descriptor.scale).toBe(kit.relativeScale * 1.2);
      expect(descriptor.primitives).toHaveLength(kit.primitives.length);
      expect(descriptor.grounding).toMatchObject({
        contactShadow: kit.grounding.contactShadow,
        terrainBlend: kit.grounding.terrainBlend,
        acceptsTerrainHeight: kit.grounding.acceptsTerrainHeight,
        terrainHeight: 7.25,
        terrainHeightSource: "integrator-position",
      });
    }
  });

  it("uses visibleAt without fabricating terrain height", () => {
    const hidden = createProceduralWorldArtKitRenderDescriptor({
      family: "mine",
      position: [0, 4.5, 0],
      lod: "macro",
    });
    expect(hidden.visible).toBe(false);
    expect(hidden.position[1]).toBe(4.5);

    const visible = createProceduralWorldArtKitRenderDescriptor({
      family: "mine",
      position: [0, -0.25, 0],
      lod: "micro",
    });
    expect(visible.visible).toBe(true);
    expect(visible.position[1]).toBe(-0.25);
    expect(visible.grounding.terrainHeight).toBe(-0.25);
  });
});
