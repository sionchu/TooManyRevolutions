import { describe, expect, it } from "vitest";

import { deriveMapArchitecture } from "../mapArchitecture";
import { derivePresentationState } from "../presentationState";
import { deriveWorldSceneModel } from "../worldSceneModel";
import {
  GAMEBUILDERS_DEMO_REGION_IDS,
  GAMEBUILDERS_DEMO_SCENARIO,
} from "../../sim/state/gameBuildersDemoScenario";
import { createDemoRuntimeState } from "../../app/demoGame";
import {
  deriveIntegratedRegionArtPlan,
  isEvidenceCoveredByRegionComposition,
} from "./regionCompositionIntegration";

function createFixture() {
  const record = createDemoRuntimeState();
  const presentation = derivePresentationState(
    GAMEBUILDERS_DEMO_SCENARIO,
    record.world,
  );
  const model = deriveWorldSceneModel(presentation);
  const architecture = deriveMapArchitecture(model);
  return { model, architecture };
}

describe("REGION_COMPOSITION_INTEGRATION", () => {
  it("resolves only evidence-backed region art and keeps stable anchors", () => {
    const { model, architecture } = createFixture();
    const plan = deriveIntegratedRegionArtPlan(model, architecture);

    expect(plan.placements.length).toBeGreaterThan(0);
    expect(
      plan.placements.every((placement) =>
        placement.worldPosition.every((value) => Number.isFinite(value)),
      ),
    ).toBe(true);
    expect(
      new Set(plan.placements.map((placement) => placement.regionId)).size,
    ).toBe(plan.composedRegionIds.length);
    expect(
      plan.placements.some((placement) => placement.family === "palace"),
    ).toBe(true);
  });

  it("marks covered evidence so legacy object consumers can be suppressed", () => {
    const { model, architecture } = createFixture();
    const plan = deriveIntegratedRegionArtPlan(model, architecture);
    const covered = plan.placements.find(
      (placement) => placement.matchedEvidenceIds[0] !== undefined,
    );
    expect(covered).toBeDefined();
    if (covered === undefined) return;
    expect(
      isEvidenceCoveredByRegionComposition(
        plan,
        covered.regionId,
        covered.matchedEvidenceIds[0]!,
      ),
    ).toBe(true);
    expect(
      isEvidenceCoveredByRegionComposition(plan, covered.regionId, "missing"),
    ).toBe(false);
  });

  it("anchors port composition to its authored shoreline fact", () => {
    const { model, architecture } = createFixture();
    const port = model.pois.find((poi) => poi.kind === "port");
    expect(port).toBeDefined();
    if (port === undefined) return;
    const plan = deriveIntegratedRegionArtPlan(model, architecture);
    const portPlacements = plan.placements.filter(
      (placement) => placement.regionId === port.regionId,
    );
    const water = portPlacements.find(
      (placement) => placement.family === "water-shelf",
    );
    const dock = portPlacements.find(
      (placement) => placement.family === "port-dock",
    );
    const route = portPlacements.find(
      (placement) => placement.family === "road-corridor",
    );
    expect(water).toBeDefined();
    expect(dock).toBeDefined();
    expect(route).toBeDefined();
    if (water === undefined || dock === undefined || route === undefined)
      return;
    expect(water.worldPosition[0]).toBeCloseTo(port.position[0]);
    expect(water.worldPosition[1]).toBeCloseTo(port.position[1]);
    expect(water.worldPosition[2]).toBeGreaterThan(dock.worldPosition[2]);
    expect(route.worldPosition[2]).toBeLessThan(dock.worldPosition[2]);
  });

  it("keeps agrarian art open around a recorded food project", () => {
    const record = createDemoRuntimeState();
    const presentation = derivePresentationState(
      GAMEBUILDERS_DEMO_SCENARIO,
      record.world,
    );
    const model = deriveWorldSceneModel(presentation, [
      {
        id: "project:food",
        name: "내륙 곡창 확장",
        anchorRegionId: GAMEBUILDERS_DEMO_REGION_IDS.veloriaInland,
        landmarkKind: "food",
        status: "implementing",
        progress: 0.4,
        sourceEventIds: ["event:food-project"],
      },
    ]);
    const architecture = deriveMapArchitecture(model);
    const plan = deriveIntegratedRegionArtPlan(model, architecture);
    const placements = plan.placements.filter(
      (placement) =>
        placement.regionId === GAMEBUILDERS_DEMO_REGION_IDS.veloriaInland,
    );
    const project = model.projects.find(
      (candidate) => candidate.id === "project:food",
    );
    expect(project).toBeDefined();
    expect(placements.map((placement) => placement.family)).toEqual(
      expect.arrayContaining([
        "field-plot",
        "granary-storehouse",
        "distribution-yard",
      ]),
    );
    if (project === undefined) return;
    const field = placements.find(
      (placement) => placement.family === "field-plot",
    );
    expect(field?.worldPosition[0]).toBeCloseTo(project.position[0]);
    expect(field?.worldPosition[1]).toBeCloseTo(project.position[1]);
  });
});
