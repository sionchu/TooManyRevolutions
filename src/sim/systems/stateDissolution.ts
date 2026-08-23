import type { JsonValue } from "../core/serialization";
import type {
  SimulationPhaseContext,
  SimulationPhaseResult,
} from "../core/step";
import { createGameEvent, type GameEvent } from "../events/event";
import type { CountryId } from "../state/ids";
import type {
  DissolutionCriteria,
  ScenarioDefinition,
} from "../state/scenario";
import type { SovereignFunction, StateDissolutionReason } from "../state/run";
import type { WorldState } from "../state/world";
import { runOrderConsolidationPhase } from "./orderConsolidation";

export type StateDissolutionCriterion =
  | "stateContinuityThreshold"
  | "fullAnnexation"
  | "permanentFragmentation"
  | "lossOfSovereignFunctions";

export type StateDissolutionCriterionStatus =
  "satisfied" | "notSatisfied" | "deferred" | "notConfigured";

interface BaseCriterionEvaluation {
  readonly criterion: StateDissolutionCriterion;
  readonly configured: boolean;
  readonly supported: boolean;
  readonly satisfied: boolean;
  readonly status: StateDissolutionCriterionStatus;
}

export interface StateContinuityCriterionEvaluation extends BaseCriterionEvaluation {
  readonly criterion: "stateContinuityThreshold";
  readonly configured: true;
  readonly actual: number | null;
  readonly threshold: number;
  readonly comparison: "lessThanOrEqual";
}

export interface UnsupportedDissolutionCriterionEvaluation extends BaseCriterionEvaluation {
  readonly criterion:
    "fullAnnexation" | "permanentFragmentation" | "lossOfSovereignFunctions";
  readonly configured: boolean;
  readonly supported: false;
  readonly evidence: "notImplemented";
  readonly requiredFunctions?: readonly SovereignFunction[];
}

export interface StateDissolutionEligibilitySnapshot {
  readonly countryId: CountryId | null;
  readonly stateContinuity: StateContinuityCriterionEvaluation;
  readonly fullAnnexation: UnsupportedDissolutionCriterionEvaluation;
  readonly permanentFragmentation: UnsupportedDissolutionCriterionEvaluation;
  readonly sovereignFunctions: UnsupportedDissolutionCriterionEvaluation;
  readonly terminalConditionEvaluations: {
    readonly stateContinuity: StateContinuityCriterionEvaluation;
    readonly fullAnnexation: UnsupportedDissolutionCriterionEvaluation;
    readonly permanentFragmentation: UnsupportedDissolutionCriterionEvaluation;
    readonly sovereignFunctions: UnsupportedDissolutionCriterionEvaluation;
  };
  /** Criteria whose current authoritative evidence can be evaluated. */
  readonly supportedCriteria: readonly StateDissolutionCriterion[];
  /** Criteria actually satisfied by the current authoritative state. */
  readonly satisfiedCriteria: readonly StateDissolutionCriterion[];
  /** Configured criteria that lack an authoritative evidence source. */
  readonly deferredCriteria: readonly StateDissolutionCriterion[];
  readonly dissolved: boolean;
  readonly reason: StateDissolutionReason | null;
}

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function sortedUnique<T extends string>(values: readonly T[]): readonly T[] {
  return [...new Set(values)].sort(compareStableText) as T[];
}

function assertStateContinuityThreshold(criteria: DissolutionCriteria): void {
  if (
    !Number.isFinite(criteria.stateContinuityAtOrBelow) ||
    criteria.stateContinuityAtOrBelow < 0 ||
    criteria.stateContinuityAtOrBelow > 100
  ) {
    throw new Error(
      "DissolutionCriteria.stateContinuityAtOrBelow must be between 0 and 100.",
    );
  }
}

function createUnsupportedEvaluation(
  criterion:
    "fullAnnexation" | "permanentFragmentation" | "lossOfSovereignFunctions",
  configured: boolean,
  requiredFunctions?: readonly SovereignFunction[],
): UnsupportedDissolutionCriterionEvaluation {
  return {
    criterion,
    configured,
    supported: false,
    satisfied: false,
    status: configured ? "deferred" : "notConfigured",
    evidence: "notImplemented",
    ...(requiredFunctions === undefined ? {} : { requiredFunctions }),
  };
}

/**
 * Pure T023 read model. Current authoritative dissolution evidence is limited
 * to the scenario-owned state-continuity threshold. Occupation, regime labels,
 * government identity, and political pressure are intentionally not inferred
 * as annexation or sovereign-function loss.
 */
export function deriveStateDissolutionEligibility(
  scenario: ScenarioDefinition,
  world: WorldState,
): StateDissolutionEligibilitySnapshot {
  const criteria = scenario.dissolutionCriteria;
  assertStateContinuityThreshold(criteria);

  const countryId = scenario.playerCountryId;
  const country = countryId === null ? undefined : world.countries[countryId];
  const stateContinuitySupported = country !== undefined;
  const stateContinuitySatisfied =
    stateContinuitySupported &&
    country.stateContinuity <= criteria.stateContinuityAtOrBelow;
  const stateContinuity: StateContinuityCriterionEvaluation = {
    criterion: "stateContinuityThreshold",
    configured: true,
    supported: stateContinuitySupported,
    actual: country?.stateContinuity ?? null,
    threshold: criteria.stateContinuityAtOrBelow,
    comparison: "lessThanOrEqual",
    satisfied: stateContinuitySatisfied,
    status: !stateContinuitySupported
      ? "deferred"
      : stateContinuitySatisfied
        ? "satisfied"
        : "notSatisfied",
  };

  const fullAnnexation = createUnsupportedEvaluation(
    "fullAnnexation",
    criteria.fullAnnexationIsTerminal,
  );
  const permanentFragmentation = createUnsupportedEvaluation(
    "permanentFragmentation",
    criteria.permanentFragmentationIsTerminal,
  );
  const requiredFunctions = sortedUnique(
    criteria.sovereignFunctionsRequiredForContinuity,
  );
  const sovereignFunctions = createUnsupportedEvaluation(
    "lossOfSovereignFunctions",
    requiredFunctions.length > 0,
    requiredFunctions,
  );

  const terminalConditionEvaluations = {
    stateContinuity,
    fullAnnexation,
    permanentFragmentation,
    sovereignFunctions,
  } as const;
  const supportedCriteria = stateContinuitySupported
    ? (["stateContinuityThreshold"] as const)
    : ([] as const);
  const satisfiedCriteria = stateContinuitySatisfied
    ? (["stateContinuityThreshold"] as const)
    : ([] as const);
  const deferredCriteria = [
    ...(stateContinuitySupported ? [] : ["stateContinuityThreshold"]),
    ...(fullAnnexation.configured ? ["fullAnnexation"] : []),
    ...(permanentFragmentation.configured ? ["permanentFragmentation"] : []),
    ...(sovereignFunctions.configured ? ["lossOfSovereignFunctions"] : []),
  ] as StateDissolutionCriterion[];

  return {
    countryId,
    stateContinuity,
    fullAnnexation,
    permanentFragmentation,
    sovereignFunctions,
    terminalConditionEvaluations,
    supportedCriteria,
    satisfiedCriteria,
    deferredCriteria,
    dissolved: stateContinuitySatisfied,
    reason: stateContinuitySatisfied ? "stateContinuityThreshold" : null,
  };
}

function toEventCriterion(
  evaluation:
    | StateContinuityCriterionEvaluation
    | UnsupportedDissolutionCriterionEvaluation,
): JsonValue {
  return {
    criterion: evaluation.criterion,
    configured: evaluation.configured,
    supported: evaluation.supported,
    satisfied: evaluation.satisfied,
    status: evaluation.status,
    ...(evaluation.criterion === "stateContinuityThreshold"
      ? {
          actual: evaluation.actual,
          threshold: evaluation.threshold,
          comparison: evaluation.comparison,
        }
      : {
          evidence: evaluation.evidence,
          ...(evaluation.requiredFunctions === undefined
            ? {}
            : { requiredFunctions: evaluation.requiredFunctions }),
        }),
  };
}

function toEventSnapshot(
  snapshot: StateDissolutionEligibilitySnapshot,
): JsonValue {
  return {
    countryId: snapshot.countryId,
    terminalConditionEvaluations: {
      stateContinuity: toEventCriterion(snapshot.stateContinuity),
      fullAnnexation: toEventCriterion(snapshot.fullAnnexation),
      permanentFragmentation: toEventCriterion(snapshot.permanentFragmentation),
      sovereignFunctions: toEventCriterion(snapshot.sovereignFunctions),
    },
    supportedCriteria: snapshot.supportedCriteria,
    satisfiedCriteria: snapshot.satisfiedCriteria,
    deferredCriteria: snapshot.deferredCriteria,
    dissolved: snapshot.dissolved,
    reason: snapshot.reason,
  };
}

function createStateDissolvedEvent(
  context: SimulationPhaseContext,
  sequence: number,
  snapshot: StateDissolutionEligibilitySnapshot,
): GameEvent {
  if (snapshot.countryId === null || snapshot.reason === null) {
    throw new Error("A dissolved state must have a country and reason.");
  }

  return createGameEvent({
    tick: context.nextTick,
    sequence,
    type: "STATE_DISSOLVED",
    actorId: snapshot.countryId,
    targetId: snapshot.countryId,
    causeIds: [],
    payload: {
      countryId: snapshot.countryId,
      reason: snapshot.reason,
      evaluatedAtTick: context.nextTick,
      evaluatedAtDate: {
        year: context.world.date.year,
        month: context.world.date.month,
        day: context.world.date.day,
      },
      sourceState: {
        stateContinuity: snapshot.stateContinuity.actual,
        stateContinuityThreshold: snapshot.stateContinuity.threshold,
      },
      criteriaEvidence: toEventSnapshot(snapshot),
    },
    visibility: "important",
  });
}

function noOp(context: SimulationPhaseContext): SimulationPhaseResult {
  return {
    nextWorld: context.world,
    emittedEvents: [],
    nextEventSequence: context.nextEventSequence,
  };
}

/** Commit the one currently supported terminal dissolution condition. */
export function runStateDissolutionPhase(
  context: SimulationPhaseContext,
): SimulationPhaseResult {
  if (
    context.world.run.outcome.status !== "active" ||
    context.scenario === undefined ||
    context.scenario.playerCountryId === null
  ) {
    return noOp(context);
  }

  const snapshot = deriveStateDissolutionEligibility(
    context.scenario,
    context.world,
  );
  if (
    !snapshot.dissolved ||
    snapshot.countryId === null ||
    snapshot.reason === null
  ) {
    return noOp(context);
  }

  const dissolvedEvent = createStateDissolvedEvent(
    context,
    context.nextEventSequence,
    snapshot,
  );
  const nextEventSequence = context.nextEventSequence + 1;

  return {
    nextWorld: {
      ...context.world,
      run: {
        ...context.world.run,
        outcome: {
          status: "defeated",
          kind: "stateDissolved",
          countryId: snapshot.countryId,
          reason: snapshot.reason,
          atTick: context.nextTick,
          causeEventId: dissolvedEvent.id,
        },
        nextEventSequence,
      },
    },
    emittedEvents: [dissolvedEvent],
    nextEventSequence,
  };
}

/**
 * Combined terminal evaluation. Dissolution is checked first because a state
 * that no longer exists cannot complete a new-order consolidation on the same
 * authoritative post-conflict state.
 */
export function runOrderConsolidationAndDissolutionPhase(
  context: SimulationPhaseContext,
): SimulationPhaseResult {
  const dissolution = runStateDissolutionPhase(context);
  if (dissolution.emittedEvents.length > 0) {
    return dissolution;
  }

  return runOrderConsolidationPhase(context);
}
