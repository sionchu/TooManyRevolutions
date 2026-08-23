import type { JsonValue } from "../core/serialization";
import {
  asInterventionCommitmentId,
  type ActionId,
  type CountryId,
  type FactionId,
  type InterventionCommitmentId,
  type InterventionId,
  type RegionId,
} from "./ids";
import {
  INSTITUTIONAL_RULE_KEYS,
  isInstitutionalRuleValue,
  type InstitutionalRuleKey,
  type InstitutionalRuleState,
  type PolicyPrerequisite,
} from "./policy";
import { RESOURCE_TYPES, type ResourceType } from "./region";
import type { ScenarioDefinition } from "./scenario";
import type { WorldState } from "./world";

/** T016B deliberately exposes one honest fixture category, not a mana type. */
export type InterventionDefinitionCategory = "administrative";

export const INTERVENTION_CATEGORIES: readonly InterventionDefinitionCategory[] =
  ["administrative"] as const;

/**
 * Small, scenario-owned completion effects. These are concrete state deltas,
 * not a general scripting or modifier language.
 */
type InstitutionalRuleSetEffect = {
  [Key in InstitutionalRuleKey]: {
    readonly kind: "institutionalRuleSet";
    readonly rule: Key;
    readonly value: InstitutionalRuleState[Key];
  };
}[InstitutionalRuleKey];

export type InterventionEffect =
  | {
      readonly kind: "regionResourceProductionCapacityDelta";
      readonly regionId: RegionId;
      readonly resourceType: ResourceType;
      readonly delta: number;
    }
  | {
      readonly kind: "factionGrievanceDelta";
      readonly factionId: FactionId;
      readonly delta: number;
    }
  | {
      readonly kind: "factionOrganizationDelta";
      readonly factionId: FactionId;
      readonly delta: number;
    }
  | InstitutionalRuleSetEffect;

/** Static content owned by ScenarioDefinition. */
export interface InterventionDefinition {
  readonly id: InterventionId;
  readonly name: string;
  readonly category: InterventionDefinitionCategory;
  readonly treasuryCost: number;
  readonly administrativeLoad: number;
  /** One occupied day begins at the start tick; release occurs at this tick. */
  readonly durationDays: number;
  readonly prerequisites?: readonly PolicyPrerequisite[];
  /** Applied exactly once when the active commitment reaches completionTick. */
  readonly completionEffects?: readonly InterventionEffect[];
  /** Reject starts that cannot change any declared completion target. */
  readonly requireCompletionEffectChange?: boolean;
}

/** Minimal mutable runtime state for an active intervention. */
export interface InterventionCommitment {
  readonly id: InterventionCommitmentId;
  readonly interventionId: InterventionId;
  readonly countryId: CountryId;
  readonly sourceActionId: ActionId;
  readonly startedTick: number;
  readonly firstOccupiedTick: number;
  readonly completionTick: number;
  readonly administrativeLoad: number;
}

export type InterventionFeasibilityFailure =
  | { readonly kind: "TERMINAL_RUN" }
  | {
      readonly kind: "UNKNOWN_INTERVENTION";
      readonly interventionId: InterventionId;
    }
  | { readonly kind: "MISSING_COUNTRY"; readonly countryId: CountryId }
  | {
      readonly kind: "MISSING_POLICY_STATE";
      readonly countryId: CountryId;
    }
  | {
      readonly kind: "INSUFFICIENT_TREASURY";
      readonly required: number;
      readonly available: number;
    }
  | {
      readonly kind: "INSUFFICIENT_ADMINISTRATIVE_HEADROOM";
      readonly required: number;
      readonly available: number;
      readonly committed: number;
      readonly capacity: number;
    }
  | {
      readonly kind: "PREREQUISITE_NOT_MET";
      readonly prerequisiteIndex: number;
      readonly prerequisite: PolicyPrerequisite;
    }
  | { readonly kind: "NO_COMPLETION_EFFECT_CHANGE" };

export interface InterventionFeasibilityResult {
  readonly feasible: boolean;
  readonly interventionId: InterventionId;
  readonly countryId: CountryId;
  readonly definition?: InterventionDefinition;
  readonly treasuryAvailable: number | null;
  readonly committedAdministrativeLoad: number | null;
  readonly administrativeHeadroom: number | null;
  readonly reasons: readonly InterventionFeasibilityFailure[];
}

export interface InterventionFeasibilityOptions {
  /** Same-tick reservation view; does not mutate Country.treasury. */
  readonly treasuryAvailable?: number;
}

function compareIds(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function assertFiniteNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be finite and non-negative.`);
  }
}

/** Validate static intervention content before it enters a run. */
export function assertScenarioInterventionCatalog(
  scenario: Pick<
    ScenarioDefinition,
    "interventionCatalog" | "initialRegions" | "initialFactions"
  >,
): void {
  const regionIds = new Set(scenario.initialRegions.map((region) => region.id));
  const factionIds = new Set(
    scenario.initialFactions.map((faction) => faction.id),
  );

  for (const [catalogId, definition] of Object.entries(
    scenario.interventionCatalog,
  )) {
    if (catalogId !== definition.id) {
      throw new Error(
        `Intervention catalog key ${catalogId} does not match ${definition.id}.`,
      );
    }

    if (definition.name.length === 0) {
      throw new Error(`Intervention ${definition.id} needs a name.`);
    }

    if (!INTERVENTION_CATEGORIES.includes(definition.category)) {
      throw new Error(`Intervention ${definition.id} has an invalid category.`);
    }

    assertFiniteNonNegative(
      definition.treasuryCost,
      `${definition.id}.treasuryCost`,
    );
    assertFiniteNonNegative(
      definition.administrativeLoad,
      `${definition.id}.administrativeLoad`,
    );

    if (
      !Number.isInteger(definition.durationDays) ||
      definition.durationDays < 1
    ) {
      throw new Error(
        `${definition.id}.durationDays must be a positive integer.`,
      );
    }

    for (const prerequisite of definition.prerequisites ?? []) {
      if (
        (prerequisite.kind === "ruleEquals" ||
          prerequisite.kind === "ruleNotEquals") &&
        !INSTITUTIONAL_RULE_KEYS.includes(prerequisite.rule)
      ) {
        throw new Error(
          `${definition.id} contains an invalid institutional prerequisite.`,
        );
      }
    }

    for (const effect of definition.completionEffects ?? []) {
      if (
        effect.kind !== "institutionalRuleSet" &&
        !Number.isFinite(effect.delta)
      ) {
        throw new Error(
          `${definition.id} contains a non-finite completion effect delta.`,
        );
      }

      switch (effect.kind) {
        case "regionResourceProductionCapacityDelta":
          if (!regionIds.has(effect.regionId)) {
            throw new Error(
              `${definition.id} references missing effect Region ${effect.regionId}.`,
            );
          }
          if (!RESOURCE_TYPES.includes(effect.resourceType)) {
            throw new Error(
              `${definition.id} contains an invalid effect resource type.`,
            );
          }
          break;
        case "factionGrievanceDelta":
        case "factionOrganizationDelta":
          if (!factionIds.has(effect.factionId)) {
            throw new Error(
              `${definition.id} references missing effect Faction ${effect.factionId}.`,
            );
          }
          break;
        case "institutionalRuleSet":
          if (
            !INSTITUTIONAL_RULE_KEYS.includes(effect.rule) ||
            !isInstitutionalRuleValue(effect.rule, effect.value)
          ) {
            throw new Error(
              `${definition.id} contains an invalid institutional rule effect.`,
            );
          }
          break;
      }
    }
  }
}

export function createDeterministicInterventionCommitmentId(
  actionId: ActionId,
): InterventionCommitmentId {
  return asInterventionCommitmentId(`commitment:${actionId}`);
}

export function deriveActiveInterventionCommitments(
  world: WorldState,
  countryId: CountryId,
): readonly InterventionCommitment[] {
  return Object.values(world.interventionCommitments)
    .filter((commitment) => commitment.countryId === countryId)
    .sort((first, second) => compareIds(first.id, second.id));
}

/** Sum active runtime loads; stateCapacity is never changed by this query. */
export function deriveCommittedAdministrativeLoad(
  world: WorldState,
  countryId: CountryId,
): number {
  return deriveActiveInterventionCommitments(world, countryId).reduce(
    (total, commitment) => total + commitment.administrativeLoad,
    0,
  );
}

export function deriveAdministrativeHeadroom(
  world: WorldState,
  countryId: CountryId,
): number {
  const country = world.countries[countryId];
  if (country === undefined) {
    return 0;
  }

  return Math.max(
    0,
    country.stateCapacity - deriveCommittedAdministrativeLoad(world, countryId),
  );
}

export function deriveAdministrativeOverload(
  world: WorldState,
  countryId: CountryId,
): number {
  const country = world.countries[countryId];
  if (country === undefined) {
    return 0;
  }

  return Math.max(
    0,
    deriveCommittedAdministrativeLoad(world, countryId) - country.stateCapacity,
  );
}

function prerequisiteIsMet(
  world: WorldState,
  countryId: CountryId,
  prerequisite: PolicyPrerequisite,
): boolean {
  const policyState = world.policies[countryId];
  if (policyState === undefined) {
    return false;
  }

  switch (prerequisite.kind) {
    case "policyActive":
      return policyState.activePolicyIds.includes(prerequisite.policyId);
    case "policyInactive":
      return !policyState.activePolicyIds.includes(prerequisite.policyId);
    case "ruleEquals":
      return (
        policyState.institutionalRules[prerequisite.rule] === prerequisite.value
      );
    case "ruleNotEquals":
      return (
        policyState.institutionalRules[prerequisite.rule] !== prerequisite.value
      );
  }
}

function completionEffectWouldChange(
  world: WorldState,
  countryId: CountryId,
  effect: InterventionEffect,
): boolean {
  switch (effect.kind) {
    case "regionResourceProductionCapacityDelta": {
      const previous =
        world.regions[effect.regionId]?.resourceProductionCapacity[
          effect.resourceType
        ] ?? 0;
      return Math.max(0, previous + effect.delta) !== previous;
    }
    case "factionGrievanceDelta": {
      const previous = world.factions[effect.factionId]?.grievance;
      return (
        previous !== undefined &&
        Math.min(1, Math.max(0, previous + effect.delta)) !== previous
      );
    }
    case "factionOrganizationDelta": {
      const previous = world.factions[effect.factionId]?.organization;
      return (
        previous !== undefined &&
        Math.min(1, Math.max(0, previous + effect.delta)) !== previous
      );
    }
    case "institutionalRuleSet":
      return (
        world.policies[countryId]?.institutionalRules[effect.rule] !==
        effect.value
      );
  }
}

/** Pure feasibility query used by action resolution and future selectors. */
export function evaluateInterventionFeasibility(input: {
  readonly scenario: ScenarioDefinition;
  readonly world: WorldState;
  readonly interventionId: InterventionId;
  readonly countryId: CountryId;
  readonly options?: InterventionFeasibilityOptions;
}): InterventionFeasibilityResult {
  const { scenario, world, interventionId, countryId } = input;
  assertScenarioInterventionCatalog(scenario);

  const definition = scenario.interventionCatalog[interventionId];
  if (definition === undefined) {
    return {
      feasible: false,
      interventionId,
      countryId,
      treasuryAvailable: null,
      committedAdministrativeLoad: null,
      administrativeHeadroom: null,
      reasons: [{ kind: "UNKNOWN_INTERVENTION", interventionId }],
    };
  }

  if (world.run.outcome.status !== "active") {
    return {
      feasible: false,
      interventionId,
      countryId,
      definition,
      treasuryAvailable: null,
      committedAdministrativeLoad: null,
      administrativeHeadroom: null,
      reasons: [{ kind: "TERMINAL_RUN" }],
    };
  }

  const country = world.countries[countryId];
  if (country === undefined) {
    return {
      feasible: false,
      interventionId,
      countryId,
      definition,
      treasuryAvailable: null,
      committedAdministrativeLoad: null,
      administrativeHeadroom: null,
      reasons: [{ kind: "MISSING_COUNTRY", countryId }],
    };
  }

  const committedAdministrativeLoad = deriveCommittedAdministrativeLoad(
    world,
    countryId,
  );
  const administrativeHeadroom = deriveAdministrativeHeadroom(world, countryId);
  const treasuryAvailable =
    input.options?.treasuryAvailable ?? country.treasury;
  const reasons: InterventionFeasibilityFailure[] = [];

  if (treasuryAvailable < definition.treasuryCost) {
    reasons.push({
      kind: "INSUFFICIENT_TREASURY",
      required: definition.treasuryCost,
      available: treasuryAvailable,
    });
  }

  if (administrativeHeadroom < definition.administrativeLoad) {
    reasons.push({
      kind: "INSUFFICIENT_ADMINISTRATIVE_HEADROOM",
      required: definition.administrativeLoad,
      available: administrativeHeadroom,
      committed: committedAdministrativeLoad,
      capacity: country.stateCapacity,
    });
  }

  if (world.policies[countryId] === undefined) {
    reasons.push({ kind: "MISSING_POLICY_STATE", countryId });
  } else {
    (definition.prerequisites ?? []).forEach(
      (prerequisite, prerequisiteIndex) => {
        if (!prerequisiteIsMet(world, countryId, prerequisite)) {
          reasons.push({
            kind: "PREREQUISITE_NOT_MET",
            prerequisiteIndex,
            prerequisite,
          });
        }
      },
    );

    if (
      definition.requireCompletionEffectChange === true &&
      !(definition.completionEffects ?? []).some((effect) =>
        completionEffectWouldChange(world, countryId, effect),
      )
    ) {
      reasons.push({ kind: "NO_COMPLETION_EFFECT_CHANGE" });
    }
  }

  return {
    feasible: reasons.length === 0,
    interventionId,
    countryId,
    definition,
    treasuryAvailable,
    committedAdministrativeLoad,
    administrativeHeadroom,
    reasons,
  };
}

/** Convert a feasibility failure to serializable event payload data. */
export function interventionFailureToJson(
  failure: InterventionFeasibilityFailure,
): JsonValue {
  switch (failure.kind) {
    case "TERMINAL_RUN":
      return { kind: failure.kind };
    case "UNKNOWN_INTERVENTION":
      return { kind: failure.kind, interventionId: failure.interventionId };
    case "MISSING_COUNTRY":
    case "MISSING_POLICY_STATE":
      return { kind: failure.kind, countryId: failure.countryId };
    case "INSUFFICIENT_TREASURY":
      return {
        kind: failure.kind,
        required: failure.required,
        available: failure.available,
      };
    case "INSUFFICIENT_ADMINISTRATIVE_HEADROOM":
      return {
        kind: failure.kind,
        required: failure.required,
        available: failure.available,
        committed: failure.committed,
        capacity: failure.capacity,
      };
    case "PREREQUISITE_NOT_MET":
      return {
        kind: failure.kind,
        prerequisiteIndex: failure.prerequisiteIndex,
        prerequisite: prerequisiteToJson(failure.prerequisite),
      };
    case "NO_COMPLETION_EFFECT_CHANGE":
      return { kind: failure.kind };
  }
}

function prerequisiteToJson(prerequisite: PolicyPrerequisite): JsonValue {
  switch (prerequisite.kind) {
    case "policyActive":
    case "policyInactive":
      return { kind: prerequisite.kind, policyId: prerequisite.policyId };
    case "ruleEquals":
    case "ruleNotEquals":
      return {
        kind: prerequisite.kind,
        rule: prerequisite.rule,
        value: prerequisite.value as JsonValue,
      };
  }
}
