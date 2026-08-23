import { advanceSimDate, isClockRunning, type SimulationClock } from "./clock";
import {
  assertWorldStateInvariants,
  assertWorldStateInvariantsIncremental,
} from "./invariants";
import {
  SIMULATION_PHASE_ORDER,
  type SimulationPhaseContext,
  type SimulationPhaseHook,
  type SimulationPhaseHooks,
  type SimulationPhaseResult,
  type SimulationStepInput,
  type SimulationStepResult,
} from "./step";
import { freezeCanonicalGraph } from "./canonicalFreeze";
import { assertActionRecordDelta } from "./runtimeClosure";
import {
  createDeterministicEventId,
  createGameEvent,
  type GameEvent,
} from "../events/event";
import type { ActionProposal } from "../state/action";
import type { ScenarioDefinition } from "../state/scenario";
import type { WorldState } from "../state/world";
import { runEconomyPhase } from "../systems/economy";
import { runFactionPressurePhase } from "../systems/factionPressure";
import { runInstabilityPhase } from "../systems/instability";
import { runResourcesPhase } from "../systems/resources";
import { runConflictPhase } from "../systems/conflict";
import { runDiplomacyPhase } from "../systems/diplomacy";
import { runOrderConsolidationAndDissolutionPhase } from "../systems/stateDissolution";

/** Compatibility alias for callers that still use the Gate 0 name. */
export type TickResult = SimulationStepResult;

const DEFAULT_PHASE_HOOKS: SimulationPhaseHooks = {
  economy: (context) => runEconomyPhase(context, context.scenario),
  factionPressure: runFactionPressurePhase,
  instability: runInstabilityPhase,
  resources: runResourcesPhase,
  diplomacy: runDiplomacyPhase,
  conflict: runConflictPhase,
  evaluateOrderConsolidationAndDissolution:
    runOrderConsolidationAndDissolutionPhase,
};

const trustedSimulationWorlds = new WeakMap<WorldState, ScenarioDefinition>();
const trustedStepResults = new WeakMap<
  SimulationStepResult,
  {
    readonly scenario: ScenarioDefinition;
    readonly sourceWorld: WorldState;
  }
>();
const consumedStepResults = new WeakSet<SimulationStepResult>();

function isTrustedSimulationWorldForScenario(
  world: WorldState,
  scenario: ScenarioDefinition,
): boolean {
  return trustedSimulationWorlds.get(world) === scenario;
}

/** Register only results produced by this module's simulation-step seam. */
function registerProducedSimulationStepResult<T extends SimulationStepResult>(
  result: T,
  scenario: ScenarioDefinition | undefined,
  sourceWorld: WorldState,
): T {
  if (scenario === undefined) {
    return result;
  }

  freezeCanonicalGraph(result);
  trustedStepResults.set(result, { scenario, sourceWorld });
  trustedSimulationWorlds.set(result.nextWorld, scenario);
  return result;
}

/**
 * Consume the process-local step capability before any commit validation.
 * An unmarked result remains on the full-validation path.
 */
export function claimCanonicalSimulationStepResult(
  result: SimulationStepResult,
  scenario: ScenarioDefinition,
  sourceWorld: WorldState,
): boolean {
  const metadata = trustedStepResults.get(result);
  if (metadata === undefined) {
    return false;
  }

  if (consumedStepResults.has(result)) {
    throw new Error("SimulationStepResult has already been consumed.");
  }

  // Consume before checking parent/scenario and before delta validation. A
  // failed commit must not leave a trusted transition reusable.
  consumedStepResults.add(result);

  if (metadata.scenario !== scenario) {
    throw new Error(
      "SimulationStepResult scenario does not match the commit scenario.",
    );
  }

  if (metadata.sourceWorld !== sourceWorld) {
    throw new Error(
      "SimulationStepResult source WorldState does not match the commit parent.",
    );
  }

  return true;
}

function createNoopPhaseResult(
  context: SimulationPhaseContext,
): SimulationPhaseResult {
  return {
    nextWorld: context.world,
    emittedEvents: [],
    nextEventSequence: context.nextEventSequence,
  };
}

function datesEqual(
  first: WorldState["date"],
  second: WorldState["date"],
): boolean {
  return (
    first.year === second.year &&
    first.month === second.month &&
    first.day === second.day
  );
}

function assertInputActionsAreOrdered(
  world: WorldState,
  input: SimulationStepInput,
  nextTick: number,
  trustCanonicalHistory: boolean,
): void {
  let expectedSequence = world.run.nextActionSequence;
  const knownActionIds = trustCanonicalHistory
    ? undefined
    : new Set(world.run.actionLog.map((action) => action.id));

  for (const action of input.actions) {
    if (action.validationOutcome.kind !== "accepted") {
      throw new Error(
        `SimulationStep received a non-validated action ${action.id}.`,
      );
    }

    if (action.sequence !== expectedSequence) {
      throw new Error(
        `Action ${action.id} is not the next global action sequence.`,
      );
    }

    if (action.tick !== nextTick) {
      throw new Error(
        `Action ${action.id} must target the next simulation tick.`,
      );
    }

    if (knownActionIds?.has(action.id)) {
      throw new Error(`Action ${action.id} already exists in the run log.`);
    }

    knownActionIds?.add(action.id);
    expectedSequence += 1;
  }
}

function appendValidatedActions(
  world: WorldState,
  input: SimulationStepInput,
): WorldState {
  if (input.actions.length === 0) {
    return world;
  }

  return {
    ...world,
    run: {
      ...world.run,
      actionLog: [...world.run.actionLog, ...input.actions],
      nextActionSequence: world.run.nextActionSequence + input.actions.length,
    },
  };
}

function assertPhaseResult(
  context: SimulationPhaseContext,
  result: SimulationPhaseResult,
): void {
  if (
    (context.phase === "eventFinalization" ||
      context.phase === "snapshotHook") &&
    result.nextWorld !== context.world
  ) {
    throw new Error(`${context.phase} cannot mutate WorldState.`);
  }

  if (
    result.nextWorld.tick !== context.world.tick ||
    !datesEqual(result.nextWorld.date, context.world.date)
  ) {
    throw new Error(
      `${context.phase} cannot advance the authoritative clock directly.`,
    );
  }

  let expectedSequence = context.nextEventSequence;

  for (const event of result.emittedEvents) {
    if (event.sequence !== expectedSequence) {
      throw new Error(
        `${context.phase} emitted an event out of global sequence order.`,
      );
    }

    if (event.tick !== context.nextTick) {
      throw new Error(
        `${context.phase} emitted an event for the wrong simulation tick.`,
      );
    }

    if (
      event.id !==
      createDeterministicEventId(event.tick, event.sequence, event.type)
    ) {
      throw new Error(
        `${context.phase} emitted an event with a non-deterministic ID.`,
      );
    }

    expectedSequence += 1;
  }

  if (result.nextEventSequence !== expectedSequence) {
    throw new Error(
      `${context.phase} returned an invalid next event sequence.`,
    );
  }

  if (
    (context.phase === "eventFinalization" ||
      context.phase === "snapshotHook") &&
    result.emittedEvents.length > 0
  ) {
    throw new Error(`${context.phase} cannot create new events.`);
  }

  for (const proposal of result.actionProposals ?? []) {
    if (proposal.tick !== context.nextTick + 1) {
      throw new Error(
        `${context.phase} proposals must target the following simulation tick.`,
      );
    }

    if (
      !Number.isInteger(proposal.schemaVersion) ||
      proposal.schemaVersion < 1
    ) {
      throw new Error(`${context.phase} returned an invalid action proposal.`);
    }
  }
}

function advanceDay(
  world: WorldState,
  nextTick: number,
  eventSequence: number,
): SimulationPhaseResult {
  const event = createGameEvent({
    tick: nextTick,
    sequence: eventSequence,
    type: "TICK_ADVANCED",
    causeIds: [],
    payload: {
      previousTick: world.tick,
      nextTick,
    },
    visibility: "hidden",
  });

  return {
    nextWorld: {
      ...world,
      tick: nextTick,
      date: advanceSimDate(world.date),
      run: {
        ...world.run,
        nextEventSequence: eventSequence + 1,
      },
    },
    emittedEvents: [event],
    nextEventSequence: eventSequence + 1,
  };
}

function applyPhaseResult(
  context: SimulationPhaseContext,
  result: SimulationPhaseResult,
): { readonly world: WorldState; readonly nextEventSequence: number } {
  assertPhaseResult(context, result);

  const nextWorld =
    result.nextWorld.run.nextEventSequence === result.nextEventSequence
      ? result.nextWorld
      : {
          ...result.nextWorld,
          run: {
            ...result.nextWorld.run,
            nextEventSequence: result.nextEventSequence,
          },
        };

  return {
    world: nextWorld,
    nextEventSequence: result.nextEventSequence,
  };
}

function getPhaseHook(
  hooks: SimulationPhaseHooks,
  phase: SimulationPhaseContext["phase"],
): SimulationPhaseHook | undefined {
  return hooks[phase] ?? DEFAULT_PHASE_HOOKS[phase];
}

/**
 * Run exactly one authoritative day. Gameplay systems are extension hooks;
 * unimplemented phases use immutable no-op defaults.
 */
export function runSimulationStep(
  world: WorldState,
  input: SimulationStepInput,
  hooks: SimulationPhaseHooks = {},
  scenario?: ScenarioDefinition,
): SimulationStepResult {
  const trustCanonicalHistory =
    scenario !== undefined &&
    isTrustedSimulationWorldForScenario(world, scenario);

  if (trustCanonicalHistory) {
    assertWorldStateInvariantsIncremental(world);
  } else {
    assertWorldStateInvariants(world);
  }

  if (world.run.outcome.status !== "active") {
    return registerProducedSimulationStepResult(
      {
        nextWorld: world,
        emittedEvents: [],
        actionProposals: [],
      },
      scenario,
      world,
    );
  }

  const nextTick = world.tick + 1;
  assertInputActionsAreOrdered(world, input, nextTick, trustCanonicalHistory);

  let currentWorld = appendValidatedActions(world, input);
  let nextEventSequence = world.run.nextEventSequence;
  let emittedEvents: readonly GameEvent[] = [];
  let actionProposals: readonly ActionProposal[] = [];

  for (const phase of SIMULATION_PHASE_ORDER) {
    const context: SimulationPhaseContext = {
      phase,
      world: currentWorld,
      input,
      nextTick,
      emittedEvents,
      nextEventSequence,
      scenario,
    };
    const hookResult =
      getPhaseHook(hooks, phase)?.(context) ?? createNoopPhaseResult(context);
    const applied = applyPhaseResult(context, hookResult);

    currentWorld = applied.world;
    nextEventSequence = applied.nextEventSequence;
    emittedEvents = [...emittedEvents, ...hookResult.emittedEvents];
    actionProposals = [
      ...actionProposals,
      ...(hookResult.actionProposals ?? []),
    ];

    if (phase === "closeDay") {
      const closedDay = advanceDay(currentWorld, nextTick, nextEventSequence);
      currentWorld = closedDay.nextWorld;
      nextEventSequence = closedDay.nextEventSequence;
      emittedEvents = [...emittedEvents, ...closedDay.emittedEvents];
    }
  }

  const nextWorld = {
    ...currentWorld,
    run: {
      ...currentWorld.run,
      nextEventSequence,
    },
  };

  if (trustCanonicalHistory) {
    assertWorldStateInvariantsIncremental(nextWorld);
    assertActionRecordDelta(world, nextWorld);
  } else {
    assertWorldStateInvariants(nextWorld);
  }

  return registerProducedSimulationStepResult(
    {
      nextWorld,
      emittedEvents,
      actionProposals,
    },
    scenario,
    world,
  );
}

/** Gate 0 compatibility entry point with no player actions. */
export function advanceTick(world: WorldState): TickResult {
  return runSimulationStep(world, { actions: [] });
}

export function advanceIfRunning(
  clock: SimulationClock,
  world: WorldState,
): TickResult | null {
  return isClockRunning(clock) ? advanceTick(world) : null;
}
