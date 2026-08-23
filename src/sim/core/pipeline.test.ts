import { describe, expect, it } from "vitest";

import { appendEvent, createEventStore } from "../events/eventStore";
import { createDeterministicActionId } from "../state/action";
import { asEventId } from "../state/ids";
import { FOUNDATION_SCENARIO } from "../state/scenario";
import type { ValidatedActionRecord } from "../state/action";
import { createInitialWorldState } from "../state/world";
import { runSimulationStep } from "./tick";
import {
  SIMULATION_PHASE_ORDER,
  type SimulationPhaseContext,
  type SimulationPhaseHooks,
} from "./step";

function acceptedAction(sequence: number, tick: number): ValidatedActionRecord {
  return {
    id: createDeterministicActionId(
      tick,
      sequence,
      "player",
      "FOUNDATION_NOOP_ACTION",
    ),
    tick,
    sequence,
    source: "player",
    actionType: "FOUNDATION_NOOP_ACTION",
    payload: { sequence },
    schemaVersion: 1,
    validationOutcome: { kind: "accepted" },
  };
}

function recordingNoopHooks(observed: string[]): SimulationPhaseHooks {
  return Object.fromEntries(
    SIMULATION_PHASE_ORDER.map((phase) => [
      phase,
      (context: SimulationPhaseContext) => {
        observed.push(context.phase);
        return {
          nextWorld: context.world,
          emittedEvents: [],
          nextEventSequence: context.nextEventSequence,
        };
      },
    ]),
  ) as SimulationPhaseHooks;
}

const EXPECTED_PHASE_ORDER = [
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

describe("authoritative T010 simulation pipeline", () => {
  it("produces the same result for the same world and ordered actions", () => {
    const world = createInitialWorldState(FOUNDATION_SCENARIO, 42);
    const input = {
      actions: [acceptedAction(0, 1), acceptedAction(1, 1)],
    };

    expect(runSimulationStep(world, input)).toEqual(
      runSimulationStep(world, input),
    );
  });

  it("executes every phase in the locked order", () => {
    const observed: string[] = [];
    const world = createInitialWorldState(FOUNDATION_SCENARIO, 42);

    const result = runSimulationStep(
      world,
      { actions: [] },
      recordingNoopHooks(observed),
    );

    expect(SIMULATION_PHASE_ORDER).toEqual(EXPECTED_PHASE_ORDER);
    expect(observed).toEqual(EXPECTED_PHASE_ORDER);
    expect(result.nextWorld.tick).toBe(1);
  });

  it("advances exactly one authoritative day and emits one tick event", () => {
    const world = createInitialWorldState(FOUNDATION_SCENARIO, 42);
    const result = runSimulationStep(world, { actions: [] });

    expect(result.nextWorld.tick).toBe(world.tick + 1);
    expect(result.nextWorld.date).toEqual({ year: 1, month: 1, day: 2 });
    expect(result.emittedEvents).toHaveLength(1);
    expect(result.emittedEvents[0]).toMatchObject({
      id: "event:1:0:TICK_ADVANCED",
      sequence: 0,
      tick: 1,
    });
  });

  it("does not execute phases or mutate a terminal world", () => {
    const world = createInitialWorldState(FOUNDATION_SCENARIO, 42);
    const terminalWorld = {
      ...world,
      run: {
        ...world.run,
        outcome: {
          status: "won" as const,
          kind: "orderConsolidated" as const,
          atTick: 0,
          causeEventId: asEventId("event:0:0:ORDER_CONSOLIDATED"),
        },
      },
    };
    const observed: string[] = [];

    const result = runSimulationStep(
      terminalWorld,
      { actions: [acceptedAction(0, 1)] },
      recordingNoopHooks(observed),
    );

    expect(result.nextWorld).toBe(terminalWorld);
    expect(result.emittedEvents).toEqual([]);
    expect(observed).toEqual([]);
    expect(result.nextWorld.date).toEqual(terminalWorld.date);
    expect(result.nextWorld.rngState).toBe(terminalWorld.rngState);
  });

  it("keeps default no-op phases from changing domain state", () => {
    const world = createInitialWorldState(FOUNDATION_SCENARIO, 42);
    const result = runSimulationStep(world, { actions: [] });

    expect(result.nextWorld.countries).toBe(world.countries);
    expect(result.nextWorld.regions).toBe(world.regions);
    expect(result.nextWorld.governments).toBe(world.governments);
    expect(result.nextWorld.factions).toBe(world.factions);
    expect(result.nextWorld.conflicts).toBe(world.conflicts);
    expect(result.nextWorld.policies).toBe(world.policies);
    expect(result.nextWorld.rngState).toBe(world.rngState);
    expect(result.nextWorld.run.actionLog).toBe(world.run.actionLog);
    expect(result.nextWorld.run.consolidation).toBe(world.run.consolidation);
  });

  it("preserves input action order and rejects out-of-order records", () => {
    const world = createInitialWorldState(FOUNDATION_SCENARIO, 42);
    const actions = [acceptedAction(0, 1), acceptedAction(1, 1)];
    const result = runSimulationStep(world, { actions });

    expect(result.nextWorld.run.actionLog).toEqual(actions);
    expect(result.nextWorld.run.nextActionSequence).toBe(2);
    expect(() =>
      runSimulationStep(world, { actions: [actions[1], actions[0]] }),
    ).toThrow("not the next global action sequence");
  });

  it("keeps event finalization and snapshot hooks read-only", () => {
    const world = createInitialWorldState(FOUNDATION_SCENARIO, 42);

    for (const phase of ["eventFinalization", "snapshotHook"] as const) {
      const hooks: SimulationPhaseHooks = {
        [phase]: (context: SimulationPhaseContext) => ({
          nextWorld: { ...context.world },
          emittedEvents: [],
          nextEventSequence: context.nextEventSequence,
        }),
      };

      expect(() => runSimulationStep(world, { actions: [] }, hooks)).toThrow(
        `${phase} cannot mutate WorldState`,
      );
    }
  });

  it("keeps event sequence and IDs deterministic across days", () => {
    const initial = createInitialWorldState(FOUNDATION_SCENARIO, 42);
    const first = runSimulationStep(initial, { actions: [] });
    const second = runSimulationStep(first.nextWorld, { actions: [] });

    expect(first.emittedEvents[0]?.sequence).toBe(0);
    expect(second.emittedEvents[0]?.sequence).toBe(1);
    expect(first.emittedEvents[0]?.id).toBe("event:1:0:TICK_ADVANCED");
    expect(second.emittedEvents[0]?.id).toBe("event:2:1:TICK_ADVANCED");
    expect(() =>
      appendEvent(
        appendEvent(createEventStore(), first.emittedEvents[0]),
        second.emittedEvents[0],
      ),
    ).not.toThrow();
  });

  it("does not mutate the input WorldState in place", () => {
    const world = createInitialWorldState(FOUNDATION_SCENARIO, 42);
    const before = JSON.parse(JSON.stringify(world));

    runSimulationStep(world, {
      actions: [acceptedAction(0, 1)],
    });

    expect(world).toEqual(before);
  });
});
