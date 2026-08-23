import {
  CONTACT_FIXTURE_COUNTRY_IDS,
  CONTACT_FIXTURE_REGION_IDS,
  createContactFixtureScenario,
} from "./contactFixture";
import type { ScenarioDefinition } from "./scenario";

/** Diagnostic-only T022 criteria; not production balance or T025 content. */
export const T022_ORDER_CONSOLIDATION_CRITERIA = {
  requiredStableRegionIds: [
    CONTACT_FIXTURE_REGION_IDS.border,
    CONTACT_FIXTURE_REGION_IDS.capital,
    CONTACT_FIXTURE_REGION_IDS.farmland,
    CONTACT_FIXTURE_REGION_IDS.mine,
    CONTACT_FIXTURE_REGION_IDS.port,
  ],
  maximumStableRegionUnrest: 0.25,
  requiredControlledCoreRegionIds: [
    CONTACT_FIXTURE_REGION_IDS.capital,
    CONTACT_FIXTURE_REGION_IDS.farmland,
  ],
  requireCapitalControl: true,
  minimumStateCapacity: 40,
  minimumTreasury: 0,
  requiresNoActiveCivilWar: true,
  requiredConsecutiveTicks: 3,
} as const;

/** Small existing topology with explicit T022 diagnostic criteria. */
export function createT022OrderConsolidationScenario(): ScenarioDefinition {
  const base = createContactFixtureScenario();

  return {
    ...base,
    playerCountryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
    orderConsolidationCriteria: T022_ORDER_CONSOLIDATION_CRITERIA,
  };
}
