import { describe, expect, it } from "vitest";

import {
  advanceSimDate,
  createSimDate,
  createSimulationClock,
  isClockRunning,
  setClockSpeed,
} from "./clock";

describe("simulation clock", () => {
  it("advances through the foundation calendar", () => {
    expect(advanceSimDate(createSimDate(3, 12, 30))).toEqual({
      year: 4,
      month: 1,
      day: 1,
    });
  });

  it("supports pause and documented acceleration speeds", () => {
    const paused = createSimulationClock(0);
    const accelerated = setClockSpeed(paused, 8);

    expect(isClockRunning(paused)).toBe(false);
    expect(accelerated.speed).toBe(8);
    expect(isClockRunning(accelerated)).toBe(true);
  });
});
