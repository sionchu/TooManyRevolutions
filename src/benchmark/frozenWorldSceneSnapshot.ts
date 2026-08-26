import { deriveStateProjectPresentations } from "../app/stateProjects";
import {
  advanceDemoRuntime,
  createDemoRuntimeState,
  submitRuntimeIntervention,
} from "../app/demoGame";
import { GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS } from "../sim/state/gameBuildersDecisionCatalog";
import { GAMEBUILDERS_DEMO_SCENARIO } from "../sim/state/gameBuildersDemoScenario";
import { derivePresentationState } from "../presentation/presentationState";
import {
  deriveWorldSceneModel,
  type WorldSceneModel,
} from "../presentation/worldSceneModel";

export interface FrozenWorldSceneBenchmarkSnapshot {
  readonly before: WorldSceneModel;
  readonly after: WorldSceneModel;
  readonly changedLandHexIds: readonly string[];
  readonly changedRegionIds: readonly string[];
}

const initialRuntime = createDemoRuntimeState();
const actionRuntime = submitRuntimeIntervention(
  initialRuntime,
  GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS.emergencyFoodDistribution,
);
const lateRuntime = advanceDemoRuntime(actionRuntime, 89);
const beforePresentation = derivePresentationState(
  GAMEBUILDERS_DEMO_SCENARIO,
  initialRuntime.world,
);
const afterPresentation = derivePresentationState(
  GAMEBUILDERS_DEMO_SCENARIO,
  lateRuntime.world,
);
const afterProjects = deriveStateProjectPresentations(
  GAMEBUILDERS_DEMO_SCENARIO,
  lateRuntime.world,
  lateRuntime.eventStore.events,
);

export const FROZEN_WORLD_SCENE_BENCHMARK: FrozenWorldSceneBenchmarkSnapshot = {
  before: deriveWorldSceneModel(beforePresentation),
  after: deriveWorldSceneModel(afterPresentation, afterProjects),
  changedLandHexIds: afterPresentation.landHexes
    .filter((afterHex) => {
      const beforeHex = beforePresentation.landHexes.find(
        (candidate) => candidate.landHexId === afterHex.landHexId,
      );
      return (
        JSON.stringify(beforeHex?.controller) !==
        JSON.stringify(afterHex.controller)
      );
    })
    .map((hex) => hex.landHexId),
  changedRegionIds: afterPresentation.regions
    .filter((afterRegion) => {
      const beforeRegion = beforePresentation.regions.find(
        (candidate) => candidate.regionId === afterRegion.regionId,
      );
      return (
        JSON.stringify(beforeRegion?.politicalInfluence) !==
        JSON.stringify(afterRegion.politicalInfluence)
      );
    })
    .map((region) => region.regionId),
};
