import { asContactEdgeId, asScenarioId } from "./ids";
import {
  INTERVENTION_FIXTURE_CATALOG,
  INTERVENTION_FIXTURE_IDS,
} from "./interventionFixture";
import { createT021RebellionScenario } from "./conflictFixture";
import { POLITICAL_CRISIS_FIXTURE_FACTION_IDS } from "./politicalCrisisFixture";
import type { InterventionDefinition } from "./intervention";
import type { ScenarioDefinition } from "./scenario";

/**
 * Developer-only Gate 1F composition fixture.
 *
 * This deliberately reuses the T021 political-crisis state and the existing
 * T016B administrative intervention catalog. It is not production scenario
 * content and does not add a new intervention or a new gameplay rule.
 */
export const GATE1F_VALIDATION_CONTACT_EDGE_IDS = {
  capitalToIndustrial: asContactEdgeId(
    "gate1f.validation.capital-to-industrial",
  ),
  industrialToCapital: asContactEdgeId(
    "gate1f.validation.industrial-to-capital",
  ),
} as const;

export const GATE1F_VALIDATION_INTERVENTION_IDS = {
  short: INTERVENTION_FIXTURE_IDS.short,
  long: INTERVENTION_FIXTURE_IDS.long,
  prerequisite: INTERVENTION_FIXTURE_IDS.prerequisite,
} as const;

function createGate1FValidationInterventionCatalog(
  baseScenario: ScenarioDefinition,
): Readonly<Record<string, InterventionDefinition>> {
  const industrial = baseScenario.initialRegions[1];
  if (industrial === undefined) {
    throw new Error("Gate 1F industrial Region is missing.");
  }

  return {
    ...INTERVENTION_FIXTURE_CATALOG,
    [INTERVENTION_FIXTURE_IDS.short]: {
      ...INTERVENTION_FIXTURE_CATALOG[INTERVENTION_FIXTURE_IDS.short],
      completionEffects: [
        {
          kind: "regionResourceProductionCapacityDelta",
          regionId: industrial.id,
          resourceType: "food",
          delta: 6,
        },
      ],
    },
    [INTERVENTION_FIXTURE_IDS.long]: {
      ...INTERVENTION_FIXTURE_CATALOG[INTERVENTION_FIXTURE_IDS.long],
      completionEffects: [
        {
          kind: "factionOrganizationDelta",
          factionId: POLITICAL_CRISIS_FIXTURE_FACTION_IDS.coup,
          delta: -0.3,
        },
      ],
    },
    [INTERVENTION_FIXTURE_IDS.prerequisite]: {
      ...INTERVENTION_FIXTURE_CATALOG[INTERVENTION_FIXTURE_IDS.prerequisite],
      completionEffects: [
        {
          kind: "factionGrievanceDelta",
          factionId: POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion,
          delta: -0.3,
        },
      ],
    },
  };
}

/**
 * A representative pressure sandbox for F03 counterfactuals.
 *
 * T021 remains unchanged: this wrapper only composes existing fixture data so
 * the intervention seam can be observed alongside economy, factions, crisis,
 * LandHex, and directed ContactGraph state.
 */
export function createGate1FValidationScenario(): ScenarioDefinition {
  const baseScenario = createT021RebellionScenario();
  const playerCountry = baseScenario.initialCountries[0];
  const capital = baseScenario.initialRegions[0];
  const industrial = baseScenario.initialRegions[1];

  if (
    playerCountry === undefined ||
    capital === undefined ||
    industrial === undefined
  ) {
    throw new Error("Gate 1F validation fixture is incomplete.");
  }

  return {
    ...baseScenario,
    id: asScenarioId("gate1f.validation"),
    interventionCatalog:
      createGate1FValidationInterventionCatalog(baseScenario),
    initialCountries: [
      {
        ...playerCountry,
        // Keep the validation sandbox solvent long enough to expose the
        // legal-action matrix at natural pressure checkpoints. This is
        // authored fixture input, not a production balance change.
        treasury: 500,
        dailyExpenditure: 1,
        stateCapacity: 60,
      },
    ],
    initialRegions: [
      {
        ...capital,
        stateControl: 0.8,
        resourceProductionCapacity: { food: 4 },
        resourceDemand: { food: 2 },
      },
      {
        ...industrial,
        stateControl: 0.55,
        resourceProductionCapacity: { material: 5 },
        resourceDemand: { food: 12 },
      },
    ],
    initialCountryPolicies: {
      ...baseScenario.initialCountryPolicies,
      [playerCountry.id]: {
        ...baseScenario.initialCountryPolicies[playerCountry.id]!,
        institutionalRules: {
          ...baseScenario.initialCountryPolicies[playerCountry.id]!
            .institutionalRules,
          legislatureRequired: true,
        },
      },
    },
    mapContactTopology: {
      regionIds: [capital.id, industrial.id],
      contactEdges: [
        {
          id: GATE1F_VALIDATION_CONTACT_EDGE_IDS.capitalToIndustrial,
          fromRegionId: capital.id,
          toRegionId: industrial.id,
          channel: "information",
          baseStrength: 0.7,
        },
        {
          id: GATE1F_VALIDATION_CONTACT_EDGE_IDS.industrialToCapital,
          fromRegionId: industrial.id,
          toRegionId: capital.id,
          channel: "trade",
          baseStrength: 0.5,
        },
      ],
    },
    orderConsolidationCriteria: {
      requiredStableRegionIds: [capital.id, industrial.id],
      maximumStableRegionUnrest: 0.9,
      requiredControlledCoreRegionIds: [capital.id],
      requireCapitalControl: true,
      minimumStateCapacity: 40,
      minimumTreasury: 0,
      requiresNoActiveCivilWar: true,
      requiredConsecutiveTicks: 30,
    },
  };
}
