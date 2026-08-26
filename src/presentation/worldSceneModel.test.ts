import { describe, expect, it } from "vitest";

import { FROZEN_WORLD_SCENE_BENCHMARK } from "../benchmark/frozenWorldSceneSnapshot";
import { GAMEBUILDERS_DEMO_SCENARIO } from "../sim/state/gameBuildersDemoScenario";
import { createInitialWorldState } from "../sim/state/world";
import { derivePresentationState } from "./presentationState";
import { deriveWorldSceneModel } from "./worldSceneModel";

describe("renderer-neutral WorldSceneModel", () => {
  it("projects real map, route, conflict, settlement, influence, and project facts", () => {
    const model = FROZEN_WORLD_SCENE_BENCHMARK.after;

    expect(model.hexes).toHaveLength(
      GAMEBUILDERS_DEMO_SCENARIO.mapTerritorialTopology.landHexes.length,
    );
    expect(model.countries).toHaveLength(3);
    expect(model.settlements).toHaveLength(3);
    expect(model.pois.map((poi) => poi.kind)).toEqual([
      "mine",
      "fort",
      "fort",
      "port",
    ]);
    expect(model.institutions.map((landmark) => landmark.kind)).toEqual([
      "assembly-hall",
      "capital-seat",
    ]);
    expect(model.routes.filter((route) => route.active).length).toBeGreaterThan(
      0,
    );
    expect(model.factionPresence.length).toBeGreaterThan(0);
    expect(model.conflicts).toHaveLength(1);
    expect(model.fronts.length).toBeGreaterThan(0);
    expect(model.projects).toHaveLength(3);
    expect(model.projects.map((project) => project.silhouette)).toEqual([
      "assembly-hall",
      "granary",
      "workshop",
    ]);
    expect(new Set(model.routes.map((route) => route.visualKind)).size).toBe(3);
    expect(
      model.factionPresence.every(
        (presence) => presence.objectFamily === "FactionActivityVisual",
      ),
    ).toBe(true);
    expect(
      model.conflicts.every(
        (conflict) => conflict.objectFamily === "ConflictActivityVisual",
      ),
    ).toBe(true);
    expect(
      model.hexes.every((hex) => hex.truthClass === "AUTHORITATIVE_PROJECTION"),
    ).toBe(true);
    expect(
      model.projects.every(
        (project) => project.truthClass === "DERIVED_PRESENTATION",
      ),
    ).toBe(true);
  });

  it("is deterministic under presentation insertion-order changes", () => {
    const world = createInitialWorldState(GAMEBUILDERS_DEMO_SCENARIO, 18970401);
    const presentation = derivePresentationState(
      GAMEBUILDERS_DEMO_SCENARIO,
      world,
    );
    const permuted = {
      ...presentation,
      countries: [...presentation.countries].reverse(),
      landHexes: [...presentation.landHexes].reverse(),
      regions: [...presentation.regions].reverse(),
      organizationTokens: [...presentation.organizationTokens]
        .reverse()
        .map((token) => ({
          ...token,
          controlledLandHexIds: [...token.controlledLandHexIds].reverse(),
        })),
      contactRoutes: [...presentation.contactRoutes].reverse(),
      fronts: [...presentation.fronts].reverse(),
      activeConflicts: [...presentation.activeConflicts].reverse(),
    };

    expect(deriveWorldSceneModel(presentation)).toEqual(
      deriveWorldSceneModel(permuted),
    );
  });

  it("does not mutate the authoritative presentation while deriving", () => {
    const world = createInitialWorldState(GAMEBUILDERS_DEMO_SCENARIO, 18970401);
    const presentation = derivePresentationState(
      GAMEBUILDERS_DEMO_SCENARIO,
      world,
    );
    const before = JSON.stringify(presentation);

    deriveWorldSceneModel(presentation, [
      {
        id: "test.project",
        name: "테스트 사업",
        anchorRegionId: presentation.regions[0]!.regionId,
        landmarkKind: "civic",
        status: "implementing",
        progress: 0.4,
        sourceEventIds: ["event.b", "event.a"],
      },
    ]);

    expect(JSON.stringify(presentation)).toBe(before);
  });
});
