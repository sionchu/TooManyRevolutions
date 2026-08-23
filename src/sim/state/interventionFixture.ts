import { createContactFixtureScenario } from "./contactFixture";
import type { InterventionDefinition } from "./intervention";
import { asInterventionId, asScenarioId, type InterventionId } from "./ids";
import type { ScenarioDefinition } from "./scenario";
import { CONTACT_FIXTURE_COUNTRY_IDS } from "./contactFixture";

export const INTERVENTION_FIXTURE_IDS = {
  short: asInterventionId("t016b.fixture.short-action"),
  long: asInterventionId("t016b.fixture.long-program"),
  prerequisite: asInterventionId("t016b.fixture.prerequisite-program"),
} as const;

/**
 * Inspection-only definitions. They intentionally describe framework
 * capacity, not production game content such as military or food policy.
 */
export const INTERVENTION_FIXTURE_CATALOG = {
  [INTERVENTION_FIXTURE_IDS.short]: {
    id: INTERVENTION_FIXTURE_IDS.short,
    name: "T016B 단기 행정 fixture",
    category: "administrative",
    treasuryCost: 8,
    administrativeLoad: 12,
    durationDays: 1,
  },
  [INTERVENTION_FIXTURE_IDS.long]: {
    id: INTERVENTION_FIXTURE_IDS.long,
    name: "T016B 장기 행정 프로그램 fixture",
    category: "administrative",
    treasuryCost: 20,
    administrativeLoad: 15,
    durationDays: 180,
  },
  [INTERVENTION_FIXTURE_IDS.prerequisite]: {
    id: INTERVENTION_FIXTURE_IDS.prerequisite,
    name: "T016B 제도 prerequisite fixture",
    category: "administrative",
    treasuryCost: 12,
    administrativeLoad: 20,
    durationDays: 180,
    prerequisites: [
      {
        kind: "ruleEquals",
        rule: "legislatureRequired",
        value: true,
      },
    ],
  },
} as const satisfies Readonly<Record<InterventionId, InterventionDefinition>>;

/** Scenario used only by T016B tests and the headless capacity inspection. */
export function createInterventionFixtureScenario(): ScenarioDefinition {
  const baseScenario = createContactFixtureScenario();
  const playerCountryId = CONTACT_FIXTURE_COUNTRY_IDS.player;

  return {
    ...baseScenario,
    id: asScenarioId("t016b-intervention-fixture"),
    interventionCatalog: INTERVENTION_FIXTURE_CATALOG,
    initialCountries: baseScenario.initialCountries.map((country) =>
      country.id === playerCountryId
        ? {
            ...country,
            treasury: 100,
            stateCapacity: 60,
          }
        : country,
    ),
  };
}
