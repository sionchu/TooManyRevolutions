import { describe, expect, it } from "vitest";

import {
  advanceSimDate,
  createSimDate,
  createSimulationClock,
  isClockRunning,
  type ClockSpeed,
} from "./clock";
import {
  shouldRunPoliticalUpdate,
  type PoliticalCadence,
} from "./politicalCadence";
import { runSimulationStep } from "./tick";
import { CONTACT_FIXTURE_REGION_IDS } from "../state/contactFixture";
import { createT015DiffusionInspectionScenario } from "../inspection/t015DiffusionInspection";
import { createIdeologyDiffusionPhaseHook } from "../systems/ideologyDiffusion";
import { IDEOLOGY_FIXTURE_IDS } from "../state/ideologyFixture";
import { createInitialWorldState, type WorldState } from "../state/world";
import { asEventId } from "../state/ids";

const REPUBLICANISM = IDEOLOGY_FIXTURE_IDS.republicanism;

function runDays(
  initialWorld: WorldState,
  scenario: ReturnType<typeof createT015DiffusionInspectionScenario>,
  days: number,
  cadence: PoliticalCadence,
  clockSpeed: ClockSpeed = 1,
): WorldState {
  let world = initialWorld;
  const clock = createSimulationClock(clockSpeed);

  if (!isClockRunning(clock)) {
    return world;
  }

  for (let day = 0; day < days; day += 1) {
    world = runSimulationStep(
      world,
      { actions: [] },
      {
        ideologyDiffusion: createIdeologyDiffusionPhaseHook(scenario, {
          cadence,
        }),
      },
    ).nextWorld;
  }

  return world;
}

function republicanPortSupport(world: WorldState): number {
  const support =
    world.regions[CONTACT_FIXTURE_REGION_IDS.port]?.ideology[REPUBLICANISM]
      ?.support;
  if (support === undefined) {
    throw new Error("T015C fixture is missing port republican support.");
  }

  return support;
}

describe("political cadence contract", () => {
  it("uses the 360-day calendar boundaries without scattered tick arithmetic", () => {
    expect(shouldRunPoliticalUpdate(1, createSimDate(1, 1, 2), "daily")).toBe(
      true,
    );
    expect(shouldRunPoliticalUpdate(6, createSimDate(1, 1, 7), "weekly")).toBe(
      false,
    );
    expect(shouldRunPoliticalUpdate(7, createSimDate(1, 1, 8), "weekly")).toBe(
      true,
    );
    expect(
      shouldRunPoliticalUpdate(29, createSimDate(1, 1, 30), "monthly"),
    ).toBe(false);
    expect(
      shouldRunPoliticalUpdate(30, createSimDate(1, 2, 1), "monthly"),
    ).toBe(true);
    expect(advanceSimDate(createSimDate(1, 1, 1), 360)).toEqual({
      year: 2,
      month: 1,
      day: 1,
    });
  });

  it("leaves ideology unchanged on non-update days", () => {
    const scenario = createT015DiffusionInspectionScenario();
    const world = createInitialWorldState(scenario, 20260821);
    const result = runSimulationStep(
      world,
      { actions: [] },
      {
        ideologyDiffusion: createIdeologyDiffusionPhaseHook(scenario, {
          cadence: "monthly",
        }),
      },
    );

    expect(result.nextWorld.tick).toBe(1);
    expect(result.nextWorld.regions).toBe(world.regions);
    expect(
      result.emittedEvents.some(
        (event) => event.type === "IDEOLOGY_SUPPORT_CHANGED",
      ),
    ).toBe(false);
  });

  it("changes ideology at a monthly update boundary", () => {
    const scenario = createT015DiffusionInspectionScenario();
    const initialWorld = createInitialWorldState(scenario, 20260821);
    const world = runDays(initialWorld, scenario, 30, "monthly");

    expect(world.tick).toBe(30);
    expect(world.date).toEqual({ year: 1, month: 2, day: 1 });
    expect(republicanPortSupport(world)).toBeGreaterThan(
      republicanPortSupport(initialWorld),
    );
  });

  it("keeps the authoritative daily tick independent of political cadence", () => {
    const scenario = createT015DiffusionInspectionScenario();
    const world = createInitialWorldState(scenario, 20260821);
    const result = runSimulationStep(
      world,
      { actions: [] },
      {
        ideologyDiffusion: createIdeologyDiffusionPhaseHook(scenario, {
          cadence: "monthly",
        }),
      },
    );

    expect(result.nextWorld.tick).toBe(1);
    expect(result.nextWorld.date).toEqual({ year: 1, month: 1, day: 2 });
  });

  it("is deterministic for the same world, cadence, and simulated days", () => {
    const scenario = createT015DiffusionInspectionScenario();
    const first = runDays(
      createInitialWorldState(scenario, 20260821),
      scenario,
      360,
      "monthly",
    );
    const second = runDays(
      createInitialWorldState(scenario, 20260821),
      scenario,
      360,
      "monthly",
    );

    expect(second).toEqual(first);
  });

  it("does not let a future wall-clock speed choice change political results", () => {
    const scenario = createT015DiffusionInspectionScenario();
    const initial = createInitialWorldState(scenario, 20260821);
    const oneX = createSimulationClock(1);
    const highSpeed = createSimulationClock(8);

    expect(isClockRunning(oneX)).toBe(true);
    expect(isClockRunning(highSpeed)).toBe(true);
    expect(runDays(initial, scenario, 720, "monthly", oneX.speed)).toEqual(
      runDays(initial, scenario, 720, "monthly", highSpeed.speed),
    );
  });

  it("does not execute a cadence hook for a terminal run", () => {
    const scenario = createT015DiffusionInspectionScenario();
    const world = createInitialWorldState(scenario, 20260821);
    const terminalWorld: WorldState = {
      ...world,
      run: {
        ...world.run,
        outcome: {
          status: "won",
          kind: "orderConsolidated",
          atTick: 0,
          causeEventId: asEventId("event:0:0:ORDER_CONSOLIDATED"),
        },
      },
    };

    const result = runSimulationStep(
      terminalWorld,
      { actions: [] },
      {
        ideologyDiffusion: () => {
          throw new Error("terminal runs must not execute political phases");
        },
      },
    );

    expect(result.nextWorld).toBe(terminalWorld);
    expect(result.emittedEvents).toEqual([]);
  });
});
