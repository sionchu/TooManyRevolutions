import { describe, expect, it } from "vitest";

import { GAMEBUILDERS_DEMO_SCENARIO } from "../sim/state/gameBuildersDemoScenario";
import { createInitialWorldState } from "../sim/state/world";
import { derivePresentationState } from "./presentationState";
import {
  authoredWorldSceneContentForScenario,
  GAMEBUILDERS_DEMO_WORLD_SCENE_CONTENT,
} from "./worldSceneContent";
import { deriveWorldSceneModel } from "./worldSceneModel";

describe("semantic world scene content", () => {
  it("binds authored POIs to existing Region/LandHex identity", () => {
    const regionIds = new Set(
      GAMEBUILDERS_DEMO_SCENARIO.initialRegions.map((region) => region.id),
    );
    const landHexes = new Map(
      GAMEBUILDERS_DEMO_SCENARIO.mapTerritorialTopology.landHexes.map((hex) => [
        hex.id,
        hex,
      ]),
    );

    for (const poi of GAMEBUILDERS_DEMO_WORLD_SCENE_CONTENT.pois) {
      expect(regionIds.has(poi.regionId)).toBe(true);
      expect(landHexes.get(poi.anchorLandHexId)?.regionId).toBe(poi.regionId);
    }
    for (const landmark of GAMEBUILDERS_DEMO_WORLD_SCENE_CONTENT.institutions) {
      expect(regionIds.has(landmark.regionId)).toBe(true);
      expect(landHexes.get(landmark.anchorLandHexId)?.regionId).toBe(
        landmark.regionId,
      );
    }
  });

  it("does not invent authored objects for another scenario", () => {
    const world = createInitialWorldState(GAMEBUILDERS_DEMO_SCENARIO, 18970401);
    const presentation = derivePresentationState(
      GAMEBUILDERS_DEMO_SCENARIO,
      world,
    );
    const otherPresentation = {
      ...presentation,
      scenarioId: "other.scenario" as typeof presentation.scenarioId,
    };

    expect(
      authoredWorldSceneContentForScenario(otherPresentation.scenarioId),
    ).toEqual({
      pois: [],
      institutions: [],
    });
    expect(deriveWorldSceneModel(otherPresentation).pois).toEqual([]);
    expect(deriveWorldSceneModel(otherPresentation).institutions).toEqual([]);
  });
});
