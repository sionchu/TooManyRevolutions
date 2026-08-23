import {
  CONTACT_FIXTURE_EDGE_IDS,
  CONTACT_FIXTURE_REGION_IDS,
  createContactFixtureScenario,
} from "./contactFixture";
import type { IdeologyState } from "./ideology";
import {
  IDEOLOGY_FIXTURE_CATALOG,
  IDEOLOGY_FIXTURE_IDS,
} from "./ideologyFixture";
import { asScenarioId, type IdeologyId } from "./ids";
import type { ScenarioDefinition } from "./scenario";

function createRegionIdeology(
  republicanSupport: number,
): Readonly<Record<IdeologyId, IdeologyState>> {
  return {
    [IDEOLOGY_FIXTURE_IDS.monarchy]: {
      support: 0,
      radicalism: 0.1,
      organization: 0.1,
    },
    [IDEOLOGY_FIXTURE_IDS.republicanism]: {
      support: republicanSupport,
      radicalism: 0.1,
      organization: 0.1,
    },
    [IDEOLOGY_FIXTURE_IDS.democracy]: {
      support: 0,
      radicalism: 0.1,
      organization: 0.1,
    },
    [IDEOLOGY_FIXTURE_IDS.communism]: {
      support: 0,
      radicalism: 0.1,
      organization: 0.1,
    },
  };
}

/**
 * T015's multi-day route: merchant port -> player port -> player capital.
 * The mine is deliberately disconnected so a global influence shortcut would
 * be visible in the test result.
 */
export function createIdeologyDiffusionFixtureScenario(): ScenarioDefinition {
  const baseScenario = createContactFixtureScenario();
  const republicanSupportByRegion = {
    [CONTACT_FIXTURE_REGION_IDS.capital]: 0.01,
    [CONTACT_FIXTURE_REGION_IDS.port]: 0.05,
    [CONTACT_FIXTURE_REGION_IDS.farmland]: 0.01,
    [CONTACT_FIXTURE_REGION_IDS.mine]: 0.01,
    [CONTACT_FIXTURE_REGION_IDS.border]: 0.01,
    [CONTACT_FIXTURE_REGION_IDS.merchantPort]: 0.9,
    [CONTACT_FIXTURE_REGION_IDS.monarchyBorder]: 0.01,
  } as const;

  return {
    ...baseScenario,
    id: asScenarioId("ideology-diffusion-fixture"),
    ideologyCatalog: IDEOLOGY_FIXTURE_CATALOG,
    initialRegions: baseScenario.initialRegions.map((region) => ({
      ...region,
      ideology: createRegionIdeology(republicanSupportByRegion[region.id]),
    })),
    mapContactTopology: {
      regionIds: baseScenario.mapContactTopology.regionIds,
      contactEdges: baseScenario.mapContactTopology.contactEdges
        .filter(
          (edge) =>
            edge.id !== CONTACT_FIXTURE_EDGE_IDS.capitalToMine &&
            edge.id !== CONTACT_FIXTURE_EDGE_IDS.mineToCapital,
        )
        .map((edge) =>
          edge.id === CONTACT_FIXTURE_EDGE_IDS.portToCapital
            ? { ...edge, channel: "information" as const }
            : edge,
        ),
    },
  };
}
