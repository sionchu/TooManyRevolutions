import { describe, expect, it } from "vitest";

import {
  createSharedTerrainMeshData,
  deriveMapArchitecture,
  deriveMapLodTier,
  deriveMapViewPresets,
  estimateMapOccupancy,
  emptyMapPatchV1,
  parseMapPatchV1,
  validateMapArchitecture,
  validateMapPatchV1,
} from "./mapArchitecture";
import { derivePresentationState } from "./presentationState";
import { deriveWorldSceneModel } from "./worldSceneModel";
import { GAMEBUILDERS_DEMO_SCENARIO } from "../sim/state/gameBuildersDemoScenario";
import { advanceDemoRuntime, createDemoRuntimeState } from "../app/demoGame";

function createFixture() {
  const record = createDemoRuntimeState();
  const presentation = derivePresentationState(
    GAMEBUILDERS_DEMO_SCENARIO,
    record.world,
  );
  const model = deriveWorldSceneModel(presentation);
  return { model, presentation };
}

describe("MAP_WORLD_ARCHITECTURE_AND_AUTHORING", () => {
  it("keeps the authoritative LandHex count while sharing adjacent terrain vertices", () => {
    const { model } = createFixture();
    const mesh = createSharedTerrainMeshData(model);

    expect(mesh.logicalLandHexCount).toBe(
      GAMEBUILDERS_DEMO_SCENARIO.mapTerritorialTopology.landHexes.length,
    );
    expect(mesh.triangles).toHaveLength(model.hexes.length * 6);
    expect(mesh.sharedVertexCount).toBeGreaterThan(model.hexes.length);
    expect(model.hexes).toHaveLength(
      GAMEBUILDERS_DEMO_SCENARIO.mapTerritorialTopology.landHexes.length,
    );
  });

  it("derives owner/controller boundaries from adjacency instead of drawing an interior grid", () => {
    const { model } = createFixture();
    const architecture = deriveMapArchitecture(model);
    const byId = new Map<string, (typeof model.hexes)[number]>(
      model.hexes.map((hex) => [hex.id, hex]),
    );

    for (const segment of architecture.political
      .physicalControllerBoundarySegments) {
      if (segment.secondLandHexId === null) continue;
      const first = byId.get(segment.firstLandHexId);
      const second = byId.get(segment.secondLandHexId);
      expect(first).toBeDefined();
      expect(second).toBeDefined();
      expect(first!.controller).not.toEqual(second!.controller);
    }
    for (const segment of architecture.political.legalOwnerBoundarySegments) {
      if (segment.secondLandHexId === null) continue;
      const first = byId.get(segment.firstLandHexId);
      const second = byId.get(segment.secondLandHexId);
      expect(first?.ownerCountryId).not.toBe(second?.ownerCountryId);
    }
    expect(
      architecture.political.frontBoundarySegments.every((front) =>
        architecture.political.physicalControllerBoundarySegments.some(
          (boundary) =>
            Math.abs(boundary.from[0] - front.from[0]) < 0.035 &&
            Math.abs(boundary.to[0] - front.to[0]) < 0.035 &&
            Math.abs(boundary.from[2] - front.from[2]) < 0.035 &&
            Math.abs(boundary.to[2] - front.to[2]) < 0.035,
        ),
      ),
    ).toBe(true);
  });

  it("renders faction territory as a merged perimeter and keeps fronts on controller edges", () => {
    const record = advanceDemoRuntime(createDemoRuntimeState(), 90);
    const presentation = derivePresentationState(
      GAMEBUILDERS_DEMO_SCENARIO,
      record.world,
    );
    const model = deriveWorldSceneModel(presentation);
    const architecture = deriveMapArchitecture(model);

    expect(architecture.political.factionTerritories.length).toBeGreaterThan(0);
    expect(
      architecture.political.physicalControllerBoundarySegments.some(
        (segment) => segment.secondLandHexId === null,
      ),
    ).toBe(true);
    for (const territory of architecture.political.factionTerritories) {
      expect(
        territory.outerBoundarySegmentIds.every((segmentId) =>
          architecture.political.physicalControllerBoundarySegments.some(
            (segment) => segment.id === segmentId,
          ),
        ),
      ).toBe(true);
    }
  });

  it("provides ideology surfaces, camera presets, LOD, and occupancy signals", () => {
    const { model } = createFixture();
    const architecture = deriveMapArchitecture(model);
    const presets = deriveMapViewPresets(model);
    const desktop = presets.find((preset) => preset.id === "desktop.global");
    const mobile = presets.find(
      (preset) => preset.id === "mobile.player-theater",
    );

    expect(architecture.political.ideologySurfaces.length).toBeGreaterThan(0);
    expect(presets.map((preset) => preset.id)).toEqual(
      expect.arrayContaining([
        "desktop.global",
        "mobile.player-theater",
        "crisis.focus",
        "project.focus",
        "full-world",
      ]),
    );
    expect(desktop).toBeDefined();
    expect(mobile).toBeDefined();
    expect(estimateMapOccupancy(model, desktop!).width).toBeGreaterThanOrEqual(
      0.75,
    );
    expect(estimateMapOccupancy(model, desktop!).height).toBeGreaterThanOrEqual(
      0.55,
    );
    expect(estimateMapOccupancy(model, mobile!).width).toBeGreaterThanOrEqual(
      0.88,
    );
    expect(deriveMapLodTier(0.9)).toBe("far");
    expect(deriveMapLodTier(1.25)).toBe("medium");
    expect(deriveMapLodTier(1.8)).toBe("near");
    expect(
      validateMapArchitecture(model, architecture).filter(
        (issue) => issue.severity === "error",
      ),
    ).toEqual([]);
  });

  it("is deterministic under insertion-order changes", () => {
    const { model } = createFixture();
    const reversed = {
      ...model,
      hexes: [...model.hexes].reverse(),
      regions: [...model.regions].reverse(),
      countries: [...model.countries].reverse(),
      routes: [...model.routes].reverse(),
      conflicts: [...model.conflicts].reverse(),
      projects: [...model.projects].reverse(),
    };
    expect(deriveMapArchitecture(reversed)).toEqual(
      deriveMapArchitecture(model),
    );
  });

  it("validates and round-trips MapPatch v1 without authoring runtime state", () => {
    const patch = emptyMapPatchV1(GAMEBUILDERS_DEMO_SCENARIO.id);
    expect(validateMapPatchV1(patch, GAMEBUILDERS_DEMO_SCENARIO.id)).toEqual(
      [],
    );
    expect(
      parseMapPatchV1(JSON.stringify(patch), GAMEBUILDERS_DEMO_SCENARIO.id)
        .patch,
    ).toEqual(patch);
    expect(
      validateMapPatchV1(
        { ...patch, version: 2 },
        GAMEBUILDERS_DEMO_SCENARIO.id,
      ).some((issue) => issue.code === "PATCH_VERSION"),
    ).toBe(true);
    expect(
      parseMapPatchV1("{not-json", GAMEBUILDERS_DEMO_SCENARIO.id).patch,
    ).toBeNull();
  });

  it("reports the Map Studio structural validation failures", () => {
    const { model } = createFixture();
    const architecture = deriveMapArchitecture(model);
    const duplicate = {
      ...model,
      hexes: [...model.hexes, { ...model.hexes[0]!, id: "duplicate-land-hex" }],
    } as unknown as typeof model;
    expect(
      validateMapArchitecture(duplicate, deriveMapArchitecture(duplicate)).some(
        (issue) => issue.code === "DUPLICATE_AXIAL_POSITION",
      ),
    ).toBe(true);

    const orphan = {
      ...model,
      hexes: [
        { ...model.hexes[0]!, regionId: "missing-region" },
        ...model.hexes.slice(1),
      ],
    } as typeof model;
    expect(
      validateMapArchitecture(orphan, deriveMapArchitecture(orphan)).some(
        (issue) => issue.code === "ORPHAN_LAND_HEX",
      ),
    ).toBe(true);

    const disconnected = {
      ...model,
      hexes: model.hexes.map((hex, index) =>
        index === 0
          ? { ...hex, position: [100, hex.position[1], 100] as const }
          : hex,
      ),
    } as typeof model;
    expect(
      validateMapArchitecture(
        disconnected,
        deriveMapArchitecture(disconnected),
      ).some((issue) => issue.code === "DISCONNECTED_REGION_TOPOLOGY"),
    ).toBe(true);

    const invalidAnchor = {
      ...model,
      pois: model.pois.length
        ? [{ ...model.pois[0]!, anchorLandHexId: "missing-land-hex" }]
        : [
            {
              id: "invalid-poi",
              countryId: model.countries[0]!.countryId,
              regionId: model.regions[0]!.regionId,
              anchorLandHexId: "missing-land-hex",
              name: "invalid",
              kind: "port",
              objectFamily: "PoiVisual",
              position: model.regions[0]!.position,
              truthClass: "AUTHORITATIVE_PROJECTION",
            },
          ],
    } as unknown as typeof model;
    expect(
      validateMapArchitecture(
        invalidAnchor,
        deriveMapArchitecture(invalidAnchor),
      ).some((issue) => issue.code === "INVALID_POI_ANCHOR"),
    ).toBe(true);

    const outOfBounds = {
      ...architecture,
      viewPresets: architecture.viewPresets.map((preset, index) =>
        index === 0 ? { ...preset, x: 999 } : preset,
      ),
    } as typeof architecture;
    expect(
      validateMapArchitecture(model, outOfBounds).some(
        (issue) => issue.code === "CAMERA_PRESET_OUT_OF_BOUNDS",
      ),
    ).toBe(true);
  });
});
