import { describe, expect, it } from "vitest";

import {
  getStateProjectArtDefinition,
  getWorldObjectVisualDefinition,
  MAP_MATERIAL_FAMILIES,
  MAP_OBJECT_ASSET_MANIFEST,
  MAP_SCALE_HIERARCHY,
  STATE_PROJECT_ART_GRAMMAR,
  type MapObjectFamily,
} from "./worldArt";
import {
  getRegionComposition,
  type RegionCompositionEvidence,
  regionCompositionRoles,
} from "../mapContent/regionComposition";

const EMPTY_EVIDENCE: RegionCompositionEvidence = {
  settlements: [],
  pois: [],
  institutions: [],
  projects: [],
  factionPresence: [],
  conflicts: [],
  routes: [],
};

const EXPECTED_OBJECT_FAMILIES: readonly MapObjectFamily[] = [
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

describe("WORLD_ART_SYSTEM", () => {
  it("registers each semantic object family with scale, grounding, provenance, and a GLB seam", () => {
    expect(MAP_OBJECT_ASSET_MANIFEST.map((asset) => asset.family)).toEqual(
      EXPECTED_OBJECT_FAMILIES,
    );
    for (const asset of MAP_OBJECT_ASSET_MANIFEST) {
      expect(asset.relativeScale).toBe(
        MAP_SCALE_HIERARCHY[asset.scaleRole].relativeScale,
      );
      expect(asset.provenance).toMatchObject({
        source: "TMR-authored-procedural",
        license: "PROJECT_AUTHORED_NO_THIRD_PARTY_ASSET",
        rightsStatus: "cleared-for-project-candidate",
      });
      expect(asset.replacementSeam).toMatchObject({
        preferredFormat: "glb",
        fallback: "procedural-low-poly",
        normalization: "shared-ground-origin-and-unit-scale",
      });
      expect(asset.grounding.acceptsTerrainHeight).toBe(true);
      expect(
        MAP_MATERIAL_FAMILIES[asset.materialFamily].roughness,
      ).toBeGreaterThanOrEqual(0.84);
      expect(getWorldObjectVisualDefinition(asset.assetId)).toEqual(asset);
    }
  });

  it("provides five label-independent region compositions with ordered silhouettes", () => {
    expect(regionCompositionRoles()).toEqual([
      "capital",
      "industrial",
      "port",
      "frontier",
      "agrarian-distribution",
    ]);
    for (const role of regionCompositionRoles()) {
      const template = getRegionComposition(role);
      expect(template.objects.length).toBeGreaterThanOrEqual(3);
      expect(template.silhouetteCue.length).toBeGreaterThan(12);
      expect(template.readingOrder[0]).toBe(template.objects[0]?.family);
      expect(template.objects.every((object) => object.scaleRank > 0)).toBe(
        true,
      );
    }
    const capital = getRegionComposition("capital");
    const industrial = getRegionComposition("industrial");
    const port = getRegionComposition("port");
    const frontier = getRegionComposition("frontier");
    const agrarian = getRegionComposition("agrarian-distribution");
    expect(capital.objects.map((object) => object.family)).toEqual(
      expect.arrayContaining(["palace", "assembly-parliament", "dense-town"]),
    );
    expect(industrial.objects.map((object) => object.family)).toEqual(
      expect.arrayContaining(["factory-iron-works", "mine"]),
    );
    expect(port.objects.map((object) => object.family)).toEqual(
      expect.arrayContaining(["port-dock", "dense-town"]),
    );
    expect(frontier.objects.map((object) => object.family)).toEqual(
      expect.arrayContaining(["fort", "checkpoint-gate"]),
    );
    expect(agrarian.objects.map((object) => object.family)).toEqual(
      expect.arrayContaining([
        "field-plot",
        "granary-storehouse",
        "distribution-yard",
      ]),
    );
    expect(
      port.objects.find((object) => object.family === "water-shelf")?.offset,
    ).toEqual([0, 0.24]);
    expect(agrarian.groundingMaterial).toBe("terrain-cultivated");
    expect(getWorldObjectVisualDefinition("field-plot")?.materialFamily).toBe(
      "terrain-cultivated",
    );
  });

  it("binds a composition to a region without owning simulation state", () => {
    const bound = getRegionComposition({
      regionId: "fixture.region",
      role: "frontier",
      anchor: [2.5, -1.25],
      evidence: EMPTY_EVIDENCE,
    });
    expect(bound.regionId).toBe("fixture.region");
    expect(bound.anchor).toEqual([2.5, -1.25]);
    expect(bound.evidence).toEqual(EMPTY_EVIDENCE);
    expect(bound.binding).toBe("renderer-neutral-presentation-template");
    expect(
      bound.objects.some(
        (object) => object.requirement === "DECORATIVE_SUBSTRATE",
      ),
    ).toBe(true);
    expect(
      bound.objects.some((object) => object.requirement === "RECORDED_FACTION"),
    ).toBe(true);
  });

  it("keeps project art stateful and visually distinct without timers or mana", () => {
    const kinds = ["food", "civic", "industrial"] as const;
    const statuses = ["not-started", "implementing", "completed"] as const;
    for (const kind of kinds) {
      const variants = STATE_PROJECT_ART_GRAMMAR[kind];
      expect(Object.keys(variants)).toEqual(statuses);
      expect(
        getStateProjectArtDefinition(kind, "not-started").primaryAssetId,
      ).toBe(null);
      expect(
        getStateProjectArtDefinition(kind, "implementing").primaryAssetId,
      ).not.toBeNull();
      expect(
        getStateProjectArtDefinition(kind, "completed").primaryAssetId,
      ).not.toBeNull();
      expect(variants.implementing.stateCue).not.toBe(
        variants.completed.stateCue,
      );
      expect(JSON.stringify(variants)).not.toMatch(
        /timer|countdown|mana|cooldown/i,
      );
      expect(
        statuses.every(
          (status) => variants[status].requiresRecordedLifecycleState,
        ),
      ).toBe(true);
    }
  });
});
