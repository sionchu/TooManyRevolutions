import type { GameEvent } from "../events/event";
import type { EventStore } from "../events/eventStore";
import type {
  ActionProposal,
  ActionRecord,
  ValidatedActionRecord,
} from "../state/action";
import type { ScenarioDefinition } from "../state/scenario";
import type { WorldState } from "../state/world";

/** The only authoritative input accepted by the simulation step. */
export interface SimulationStepInput {
  /** Records must already be accepted and ordered by global sequence. */
  readonly actions: readonly ValidatedActionRecord[];
}

/** Pure result before the persistence boundary commits it. */
export interface SimulationStepResult {
  readonly nextWorld: WorldState;
  readonly emittedEvents: readonly GameEvent[];
  /** Proposals are output, not committed input; callers intake them explicitly. */
  readonly actionProposals: readonly ActionProposal[];
}

/**
 * Changing this tuple is an explicit simulation design change. The
 * orchestrator and its order test both consume this one source of truth.
 */
export const SIMULATION_PHASE_ORDER = [
  "applyScheduledEffects",
  "resolveValidatedActions",
  "economy",
  "resources",
  "ideologyDiffusion",
  "factionPressure",
  "instability",
  "diplomacy",
  "conflict",
  "evaluateOrderConsolidationAndDissolution",
  "closeDay",
  "eventFinalization",
  "snapshotHook",
] as const;

export type SimulationPhase = (typeof SIMULATION_PHASE_ORDER)[number];

export interface SimulationPhaseContext {
  readonly phase: SimulationPhase;
  readonly world: WorldState;
  readonly input: SimulationStepInput;
  readonly nextTick: number;
  readonly emittedEvents: readonly GameEvent[];
  readonly nextEventSequence: number;
  /** Static scenario is injected; it is never copied into WorldState. */
  readonly scenario?: ScenarioDefinition;
}

export interface SimulationPhaseResult {
  readonly nextWorld: WorldState;
  readonly emittedEvents: readonly GameEvent[];
  readonly nextEventSequence: number;
  /** Only decision phases may return proposals; they never mutate WorldState. */
  readonly actionProposals?: readonly ActionProposal[];
}

/**
 * Hooks are extension points for future systems. Unimplemented phases use
 * no-op defaults; hooks return data and cannot mutate the input WorldState in place.
 */
export type SimulationPhaseHook = (
  context: SimulationPhaseContext,
) => SimulationPhaseResult;

export type SimulationPhaseHooks = Readonly<
  Partial<Record<SimulationPhase, SimulationPhaseHook>>
>;

/** Serializable state and causal log committed together at the run boundary. */
export interface RunRecord {
  readonly world: WorldState;
  readonly eventStore: EventStore;
}

/** Contract shape for the atomic commit boundary; persistence remains T024. */
export interface SimulationStepCommit {
  readonly record: RunRecord;
  readonly appendedActions: readonly ActionRecord[];
  readonly emittedEvents: readonly GameEvent[];
}
