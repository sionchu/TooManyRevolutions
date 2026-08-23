import { describe, expect, it } from "vitest";

import { createSimulationClock } from "./clock";
import { advanceIfRunning, advanceTick } from "./tick";
import { assertWorldStateInvariants } from "./invariants";
import { FOUNDATION_SCENARIO } from "../state/scenario";
import { createInitialWorldState } from "../state/world";

describe("simulation tick skeleton", () => {
  it("advances a copy of the world and emits a causal-ready event", () => {
    const initialState = createInitialWorldState(FOUNDATION_SCENARIO, 123);
    const result = advanceTick(initialState);

    expect(initialState.tick).toBe(0);
    expect(result.nextWorld.tick).toBe(1);
    expect(result.nextWorld.date).toEqual({ year: 1, month: 1, day: 2 });
    expect(result.emittedEvents).toHaveLength(1);
    expect(result.emittedEvents[0]).toMatchObject({
      id: "event:1:0:TICK_ADVANCED",
      sequence: 0,
      type: "TICK_ADVANCED",
      causeIds: [],
    });
    assertWorldStateInvariants(result.nextWorld);
  });

  it("does not advance while paused", () => {
    const state = createInitialWorldState(FOUNDATION_SCENARIO, 123);

    expect(advanceIfRunning(createSimulationClock(0), state)).toBeNull();
  });

  it("is deterministic for repeated ticks", () => {
    function run(seed: number) {
      let state = createInitialWorldState(FOUNDATION_SCENARIO, seed);
      const events: unknown[] = [];

      for (let index = 0; index < 5; index += 1) {
        const result = advanceTick(state);
        state = result.nextWorld;
        events.push(result.emittedEvents[0]);
      }

      return { state, events };
    }

    expect(run(88)).toEqual(run(88));
  });
});
