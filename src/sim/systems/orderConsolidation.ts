import type { JsonValue } from "../core/serialization";
import type {
  SimulationPhaseContext,
  SimulationPhaseResult,
} from "../core/step";
import { createGameEvent, type GameEvent } from "../events/event";
import type { ConflictId, CountryId, FactionId, RegionId } from "../state/ids";
import type {
  OrderConsolidationCriteria,
  ScenarioDefinition,
} from "../state/scenario";
import { isRegionFullyControlledByCountry } from "../state/territorialControl";
import type { WorldState } from "../state/world";

export type OrderConsolidationCriterion =
  | "playerCountry"
  | "stableRegions"
  | "capitalControl"
  | "coreTerritory"
  | "stateCapacity"
  | "treasury"
  | "noActiveCivilWar";

export interface StableRegionEvidence {
  readonly regionId: RegionId;
  readonly unrest: number | null;
  readonly fullyControlled: boolean;
  readonly stabilityThreshold: number | null;
  readonly stabilitySatisfied: boolean;
  readonly satisfied: boolean;
}

export interface OrderConsolidationEligibilitySnapshot {
  readonly countryId: CountryId | null;
  readonly stableRegions: {
    readonly requiredRegionIds: readonly RegionId[];
    readonly satisfiedRegionIds: readonly RegionId[];
    readonly missingRegionIds: readonly RegionId[];
    readonly maximumUnrest: number | null;
    readonly evidence: readonly StableRegionEvidence[];
    readonly passes: boolean;
  };
  readonly capitalControl: {
    readonly required: boolean;
    readonly regionId: RegionId | null;
    readonly fullyControlled: boolean;
    readonly passes: boolean;
  };
  readonly coreTerritory: {
    readonly requiredRegionIds: readonly RegionId[];
    readonly controlledRegionIds: readonly RegionId[];
    readonly missingRegionIds: readonly RegionId[];
    readonly passes: boolean;
  };
  readonly stateCapacity: {
    readonly actual: number | null;
    readonly minimum: number;
    readonly passes: boolean;
  };
  readonly treasury: {
    readonly actual: number | null;
    readonly minimum: number;
    readonly passes: boolean;
  };
  readonly activeCivilWar: {
    readonly required: boolean;
    readonly activeConflictIds: readonly ConflictId[];
    readonly passes: boolean;
  };
  readonly eligible: boolean;
  readonly failedCriteria: readonly OrderConsolidationCriterion[];
}

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function sortedUniqueIds<T extends string>(ids: readonly T[]): readonly T[] {
  return [...new Set(ids)].sort(compareStableText);
}

function resolveMaximumStableRegionUnrest(
  criteria: OrderConsolidationCriteria,
): number | null {
  const threshold = criteria.maximumStableRegionUnrest;
  if (threshold === undefined) {
    return null;
  }

  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
    throw new Error(
      "OrderConsolidationCriteria.maximumStableRegionUnrest must be between 0 and 1.",
    );
  }

  return threshold;
}

function isRelevantCivilWar(
  world: WorldState,
  countryId: CountryId,
  participantCountryIds: readonly CountryId[],
  participantFactionIds: readonly FactionId[],
): boolean {
  if (participantCountryIds.includes(countryId)) {
    return true;
  }

  return participantFactionIds.some(
    (factionId) => world.factions[factionId]?.countryId === countryId,
  );
}

function deriveStableRegionEvidence(
  world: WorldState,
  scenario: ScenarioDefinition,
  countryId: CountryId | null,
  regionId: RegionId,
  maximumUnrest: number | null,
): StableRegionEvidence {
  const region = world.regions[regionId];
  const fullyControlled =
    countryId !== null &&
    region !== undefined &&
    isRegionFullyControlledByCountry(scenario, world, regionId, countryId);
  const unrest = region?.unrest ?? null;
  const stabilitySatisfied =
    maximumUnrest === null || (unrest !== null && unrest <= maximumUnrest);

  return {
    regionId,
    unrest,
    fullyControlled,
    stabilityThreshold: maximumUnrest,
    stabilitySatisfied,
    satisfied: fullyControlled && stabilitySatisfied,
  };
}

/**
 * Pure, explainable eligibility projection for the configured player country.
 * It reads current LandHex-derived control and never writes WorldState/events.
 */
export function deriveOrderConsolidationEligibility(
  scenario: ScenarioDefinition,
  world: WorldState,
): OrderConsolidationEligibilitySnapshot {
  const criteria = scenario.orderConsolidationCriteria;
  const countryId = scenario.playerCountryId;
  const country = countryId === null ? undefined : world.countries[countryId];
  const hasPlayerCountry = countryId !== null && country !== undefined;
  const maximumUnrest = resolveMaximumStableRegionUnrest(criteria);

  const requiredStableRegionIds = sortedUniqueIds(
    criteria.requiredStableRegionIds,
  );
  const stableEvidence = requiredStableRegionIds.map((regionId) =>
    deriveStableRegionEvidence(
      world,
      scenario,
      hasPlayerCountry ? countryId : null,
      regionId,
      maximumUnrest,
    ),
  );
  const satisfiedStableRegionIds = stableEvidence
    .filter((evidence) => evidence.satisfied)
    .map((evidence) => evidence.regionId);
  const missingStableRegionIds = stableEvidence
    .filter((evidence) => !evidence.satisfied)
    .map((evidence) => evidence.regionId);
  const stableRegionsPass =
    hasPlayerCountry && missingStableRegionIds.length === 0;

  const capitalRegionId = country?.capitalRegionId ?? null;
  const capitalFullyControlled =
    hasPlayerCountry &&
    capitalRegionId !== null &&
    isRegionFullyControlledByCountry(
      scenario,
      world,
      capitalRegionId,
      countryId,
    );
  const capitalPasses =
    !criteria.requireCapitalControl || capitalFullyControlled;

  const requiredCoreRegionIds = sortedUniqueIds(
    criteria.requiredControlledCoreRegionIds,
  );
  const controlledCoreRegionIds = requiredCoreRegionIds.filter(
    (regionId) =>
      hasPlayerCountry &&
      isRegionFullyControlledByCountry(scenario, world, regionId, countryId),
  );
  const missingCoreRegionIds = requiredCoreRegionIds.filter(
    (regionId) => !controlledCoreRegionIds.includes(regionId),
  );
  const coreTerritoryPasses =
    hasPlayerCountry && missingCoreRegionIds.length === 0;

  const stateCapacityPasses =
    hasPlayerCountry && country.stateCapacity >= criteria.minimumStateCapacity;
  const treasuryPasses =
    hasPlayerCountry && country.treasury >= criteria.minimumTreasury;

  const activeCivilWarIds = sortedUniqueIds(
    Object.values(world.conflicts)
      .filter(
        (conflict) =>
          conflict.status === "active" &&
          conflict.kind === "civilWar" &&
          countryId !== null &&
          isRelevantCivilWar(
            world,
            countryId,
            conflict.participantCountryIds,
            conflict.participantFactionIds,
          ),
      )
      .map((conflict) => conflict.id),
  );
  const activeCivilWarPasses =
    !criteria.requiresNoActiveCivilWar || activeCivilWarIds.length === 0;

  const failedCriteria: OrderConsolidationCriterion[] = [];
  if (!hasPlayerCountry) {
    failedCriteria.push("playerCountry");
  }
  if (!stableRegionsPass) {
    failedCriteria.push("stableRegions");
  }
  if (!capitalPasses) {
    failedCriteria.push("capitalControl");
  }
  if (!coreTerritoryPasses) {
    failedCriteria.push("coreTerritory");
  }
  if (!stateCapacityPasses) {
    failedCriteria.push("stateCapacity");
  }
  if (!treasuryPasses) {
    failedCriteria.push("treasury");
  }
  if (!activeCivilWarPasses) {
    failedCriteria.push("noActiveCivilWar");
  }

  return {
    countryId,
    stableRegions: {
      requiredRegionIds: requiredStableRegionIds,
      satisfiedRegionIds: satisfiedStableRegionIds,
      missingRegionIds: missingStableRegionIds,
      maximumUnrest,
      evidence: stableEvidence,
      passes: stableRegionsPass,
    },
    capitalControl: {
      required: criteria.requireCapitalControl,
      regionId: capitalRegionId,
      fullyControlled: capitalFullyControlled,
      passes: capitalPasses,
    },
    coreTerritory: {
      requiredRegionIds: requiredCoreRegionIds,
      controlledRegionIds: controlledCoreRegionIds,
      missingRegionIds: missingCoreRegionIds,
      passes: coreTerritoryPasses,
    },
    stateCapacity: {
      actual: country?.stateCapacity ?? null,
      minimum: criteria.minimumStateCapacity,
      passes: stateCapacityPasses,
    },
    treasury: {
      actual: country?.treasury ?? null,
      minimum: criteria.minimumTreasury,
      passes: treasuryPasses,
    },
    activeCivilWar: {
      required: criteria.requiresNoActiveCivilWar,
      activeConflictIds: activeCivilWarIds,
      passes: activeCivilWarPasses,
    },
    eligible: hasPlayerCountry && failedCriteria.length === 0,
    failedCriteria,
  };
}

function toEventSnapshot(
  snapshot: OrderConsolidationEligibilitySnapshot,
): JsonValue {
  return {
    countryId: snapshot.countryId,
    stableRegions: {
      requiredRegionIds: snapshot.stableRegions.requiredRegionIds,
      satisfiedRegionIds: snapshot.stableRegions.satisfiedRegionIds,
      missingRegionIds: snapshot.stableRegions.missingRegionIds,
      maximumUnrest: snapshot.stableRegions.maximumUnrest,
      evidence: snapshot.stableRegions.evidence.map((evidence) => ({
        regionId: evidence.regionId,
        unrest: evidence.unrest,
        fullyControlled: evidence.fullyControlled,
        stabilityThreshold: evidence.stabilityThreshold,
        stabilitySatisfied: evidence.stabilitySatisfied,
        satisfied: evidence.satisfied,
      })),
      passes: snapshot.stableRegions.passes,
    },
    capitalControl: snapshot.capitalControl,
    coreTerritory: snapshot.coreTerritory,
    stateCapacity: snapshot.stateCapacity,
    treasury: snapshot.treasury,
    activeCivilWar: snapshot.activeCivilWar,
    eligible: snapshot.eligible,
    failedCriteria: snapshot.failedCriteria,
  };
}

function createOrderConsolidationEvent(
  type: "ORDER_CONSOLIDATION_STARTED" | "ORDER_CONSOLIDATED",
  context: SimulationPhaseContext,
  sequence: number,
  countryId: CountryId,
  requiredConsecutiveTicks: number,
  consecutiveEligibleTicks: number,
  snapshot: OrderConsolidationEligibilitySnapshot,
): GameEvent {
  return createGameEvent({
    tick: context.nextTick,
    sequence,
    type,
    actorId: countryId,
    targetId: countryId,
    causeIds: [],
    payload: {
      countryId,
      requiredConsecutiveTicks,
      consecutiveEligibleTicks,
      eligibility: toEventSnapshot(snapshot),
    },
    visibility: "important",
  });
}

/** Evaluate and commit only RunState consolidation progress/outcome. */
export function runOrderConsolidationPhase(
  context: SimulationPhaseContext,
): SimulationPhaseResult {
  const scenario = context.scenario;
  const criteria = scenario?.orderConsolidationCriteria;

  if (
    criteria !== undefined &&
    !Number.isInteger(criteria.requiredConsecutiveTicks)
  ) {
    throw new Error(
      "OrderConsolidationCriteria.requiredConsecutiveTicks must be an integer.",
    );
  }

  if (criteria !== undefined && criteria.requiredConsecutiveTicks < 0) {
    throw new Error(
      "OrderConsolidationCriteria.requiredConsecutiveTicks must not be negative.",
    );
  }

  // Foundation and pre-T022 fixtures use zero as an explicit disabled period.
  if (
    scenario === undefined ||
    scenario.playerCountryId === null ||
    criteria === undefined ||
    criteria.requiredConsecutiveTicks <= 0
  ) {
    return {
      nextWorld: context.world,
      emittedEvents: [],
      nextEventSequence: context.nextEventSequence,
    };
  }

  const snapshot = deriveOrderConsolidationEligibility(scenario, context.world);
  const previousProgress = context.world.run.consolidation;
  const consecutiveEligibleTicks = snapshot.eligible
    ? previousProgress.consecutiveEligibleTicks + 1
    : 0;
  const nextProgress = {
    isCurrentlyEligible: snapshot.eligible,
    consecutiveEligibleTicks,
    lastEvaluatedTick: context.nextTick,
  } as const;

  let nextEventSequence = context.nextEventSequence;
  const emittedEvents: GameEvent[] = [];
  let nextOutcome = context.world.run.outcome;

  if (snapshot.eligible && previousProgress.consecutiveEligibleTicks === 0) {
    emittedEvents.push(
      createOrderConsolidationEvent(
        "ORDER_CONSOLIDATION_STARTED",
        context,
        nextEventSequence,
        scenario.playerCountryId,
        criteria.requiredConsecutiveTicks,
        consecutiveEligibleTicks,
        snapshot,
      ),
    );
    nextEventSequence += 1;
  }

  if (
    snapshot.eligible &&
    consecutiveEligibleTicks >= criteria.requiredConsecutiveTicks &&
    context.world.run.outcome.status === "active"
  ) {
    const consolidatedEvent = createOrderConsolidationEvent(
      "ORDER_CONSOLIDATED",
      context,
      nextEventSequence,
      scenario.playerCountryId,
      criteria.requiredConsecutiveTicks,
      consecutiveEligibleTicks,
      snapshot,
    );
    emittedEvents.push(consolidatedEvent);
    nextEventSequence += 1;
    nextOutcome = {
      status: "won",
      kind: "orderConsolidated",
      atTick: context.nextTick,
      causeEventId: consolidatedEvent.id,
    };
  }

  return {
    nextWorld: {
      ...context.world,
      run: {
        ...context.world.run,
        outcome: nextOutcome,
        consolidation: nextProgress,
        nextEventSequence,
      },
    },
    emittedEvents,
    nextEventSequence,
  };
}
