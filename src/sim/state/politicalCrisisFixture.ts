import { createIdeologyFixtureScenario } from "./ideologyFixture";
import { asFactionId, asScenarioId } from "./ids";
import { IDEOLOGY_FIXTURE_IDS } from "./ideologyFixture";
import type { ScenarioDefinition } from "./scenario";

export const POLITICAL_CRISIS_FIXTURE_FACTION_IDS = {
  coup: asFactionId("t018.fixture.coup-faction"),
  rebellion: asFactionId("t018.fixture.rebellion-faction"),
} as const;

/** Small two-region fixture for T018 prerequisite and detector checks. */
export function createPoliticalCrisisFixtureScenario(): ScenarioDefinition {
  const baseScenario = createIdeologyFixtureScenario();
  const country = baseScenario.initialCountries[0];
  const capital = baseScenario.initialRegions[0];
  const industrial = baseScenario.initialRegions[1];

  if (
    country === undefined ||
    capital === undefined ||
    industrial === undefined
  ) {
    throw new Error("Political crisis fixture base scenario is incomplete.");
  }

  return {
    ...baseScenario,
    id: asScenarioId("political-crisis-fixture"),
    initialCountries: [
      {
        ...country,
        legitimacy: 20,
        stateCapacity: 20,
        instability: 80,
      },
    ],
    initialRegions: [
      {
        ...capital,
        unrest: 0.05,
      },
      {
        ...industrial,
        unrest: 0.8,
        ideology: {
          ...industrial.ideology,
          [IDEOLOGY_FIXTURE_IDS.communism]: {
            ...industrial.ideology[IDEOLOGY_FIXTURE_IDS.communism],
            support: 0.45,
            radicalism: 0.8,
            organization: 0.8,
          },
        },
      },
    ],
    initialFactions: [
      {
        id: POLITICAL_CRISIS_FIXTURE_FACTION_IDS.coup,
        name: "국가 수비 평의회",
        countryId: country.id,
        interests: ["security", "authority"],
        resources: 0.8,
        organization: 0.8,
        influence: 0.8,
        grievance: 0.8,
        ideologyAffinity: {
          [IDEOLOGY_FIXTURE_IDS.monarchy]: 0.8,
        },
        foreignLinks: {},
        currentStrategy: "wait",
      },
      {
        id: POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion,
        name: "공업 노동자회",
        countryId: country.id,
        interests: ["labor"],
        resources: 0.8,
        organization: 0.8,
        influence: 0.2,
        grievance: 0.8,
        ideologyAffinity: {
          [IDEOLOGY_FIXTURE_IDS.communism]: 0.9,
        },
        foreignLinks: {},
        currentStrategy: "wait",
      },
    ],
    factionCapabilities: {
      [POLITICAL_CRISIS_FIXTURE_FACTION_IDS.coup]: ["coup"],
      [POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion]: ["rebellion"],
    },
  };
}
