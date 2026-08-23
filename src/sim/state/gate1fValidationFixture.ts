import { asContactEdgeId, asInterventionId, asScenarioId } from "./ids";
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

export const F04D_VALIDATION_INTERVENTION_IDS = {
  materialRelief: GATE1F_VALIDATION_INTERVENTION_IDS.short,
  politicalAccommodation: asInterventionId(
    "gate1f.f04d.political-accommodation",
  ),
  oppositionLegalization: asInterventionId(
    "gate1f.f04d.opposition-legalization",
  ),
  coerciveRestriction: asInterventionId("gate1f.f04d.coercive-restriction"),
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

/**
 * Developer-only F04D pressure fixture. It keeps the Gate 1F topology and
 * authoritative consumers while authoring only the four response definitions
 * required for the institution/action counterfactual.
 */
export function createF04DValidationScenario(): ScenarioDefinition {
  const baseScenario = createGate1FValidationScenario();
  const playerCountry = baseScenario.initialCountries[0];
  const capital = baseScenario.initialRegions[0];
  const industrial = baseScenario.initialRegions[1];

  if (
    playerCountry === undefined ||
    capital === undefined ||
    industrial === undefined
  ) {
    throw new Error("F04D validation fixture is incomplete.");
  }

  const materialRelief: InterventionDefinition = {
    id: F04D_VALIDATION_INTERVENTION_IDS.materialRelief,
    name: "공업지대 긴급 식량 공급 확대",
    category: "administrative",
    treasuryCost: 90,
    administrativeLoad: 35,
    durationDays: 1,
    requireCompletionEffectChange: true,
    completionEffects: [
      {
        kind: "regionResourceProductionCapacityDelta",
        regionId: industrial.id,
        resourceType: "food",
        delta: 6,
      },
    ],
  };
  const politicalAccommodation: InterventionDefinition = {
    id: F04D_VALIDATION_INTERVENTION_IDS.politicalAccommodation,
    name: "공업 노동자회 제한적 정치 타협",
    category: "administrative",
    treasuryCost: 70,
    administrativeLoad: 35,
    durationDays: 7,
    prerequisites: [
      { kind: "ruleEquals", rule: "legislatureRequired", value: true },
    ],
    requireCompletionEffectChange: true,
    completionEffects: [
      {
        kind: "factionGrievanceDelta",
        factionId: POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion,
        delta: -0.25,
      },
    ],
  };
  const oppositionLegalization: InterventionDefinition = {
    id: F04D_VALIDATION_INTERVENTION_IDS.oppositionLegalization,
    name: "독립 야권 합법화",
    category: "administrative",
    treasuryCost: 100,
    administrativeLoad: 40,
    durationDays: 12,
    prerequisites: [
      {
        kind: "ruleNotEquals",
        rule: "politicalCompetition",
        value: "plural",
      },
    ],
    requireCompletionEffectChange: true,
    completionEffects: [
      {
        kind: "institutionalRuleSet",
        rule: "politicalCompetition",
        value: "plural",
      },
      {
        kind: "factionGrievanceDelta",
        factionId: POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion,
        delta: -0.1,
      },
      {
        kind: "factionGrievanceDelta",
        factionId: POLITICAL_CRISIS_FIXTURE_FACTION_IDS.coup,
        delta: 0.2,
      },
    ],
  };
  const coerciveRestriction: InterventionDefinition = {
    id: F04D_VALIDATION_INTERVENTION_IDS.coerciveRestriction,
    name: "야권 집회·언론 활동 제한",
    category: "administrative",
    treasuryCost: 75,
    administrativeLoad: 45,
    durationDays: 5,
    prerequisites: [
      {
        kind: "ruleNotEquals",
        rule: "pressFreedom",
        value: "censored",
      },
    ],
    requireCompletionEffectChange: true,
    completionEffects: [
      {
        kind: "institutionalRuleSet",
        rule: "pressFreedom",
        value: "censored",
      },
      {
        kind: "institutionalRuleSet",
        rule: "politicalCompetition",
        value: "banned",
      },
      {
        kind: "factionOrganizationDelta",
        factionId: POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion,
        delta: -0.12,
      },
      {
        kind: "factionGrievanceDelta",
        factionId: POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion,
        delta: 0.1,
      },
    ],
  };

  return {
    ...baseScenario,
    id: asScenarioId("gate1f.f04d.validation"),
    initialCountries: [
      {
        ...playerCountry,
        treasury: 500,
        legitimacy: 70,
        stateCapacity: 55,
        instability: 20,
      },
    ],
    initialRegions: [
      { ...capital, unrest: 0.05 },
      { ...industrial, unrest: 0.2 },
    ],
    initialFactions: baseScenario.initialFactions.map((faction) =>
      faction.id === POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion
        ? {
            ...faction,
            organization: 0.6,
            grievance: 0.6,
          }
        : faction.id === POLITICAL_CRISIS_FIXTURE_FACTION_IDS.coup
          ? { ...faction, grievance: 0.4 }
          : faction,
    ),
    initialCountryPolicies: {
      ...baseScenario.initialCountryPolicies,
      [playerCountry.id]: {
        ...baseScenario.initialCountryPolicies[playerCountry.id]!,
        institutionalRules: {
          ...baseScenario.initialCountryPolicies[playerCountry.id]!
            .institutionalRules,
          legislatureRequired: true,
          pressFreedom: "restricted",
          laborOrganization: "restricted",
          politicalCompetition: "restricted",
        },
      },
    },
    interventionCatalog: {
      ...baseScenario.interventionCatalog,
      [materialRelief.id]: materialRelief,
      [politicalAccommodation.id]: politicalAccommodation,
      [oppositionLegalization.id]: oppositionLegalization,
      [coerciveRestriction.id]: coerciveRestriction,
    },
    orderConsolidationCriteria: {
      ...baseScenario.orderConsolidationCriteria,
      // Keep the two-year F04D causal horizon open without changing the
      // production outcome system or treating a rebellion/coup as defeat.
      requiredConsecutiveTicks: 900,
    },
  };
}
