import { describe, expect, it } from "vitest";

import { createSeedState, nextInt, nextRandom } from "./rng";

function sequence(seed: number, count: number): readonly number[] {
  let state = createSeedState(seed);
  const values: number[] = [];

  for (let index = 0; index < count; index += 1) {
    const [value, nextState] = nextRandom(state);
    values.push(value);
    state = nextState;
  }

  return values;
}

describe("seeded RNG", () => {
  it("produces the same sequence for the same seed", () => {
    expect(sequence(42, 8)).toEqual(sequence(42, 8));
  });

  it("separates different seeds", () => {
    expect(sequence(42, 4)).not.toEqual(sequence(43, 4));
  });

  it("keeps its state serializable", () => {
    let state = createSeedState(7);
    const [, nextState] = nextRandom(state);
    state = nextState;

    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });

  it("generates integers within the requested half-open range", () => {
    let state = createSeedState(99);

    for (let index = 0; index < 32; index += 1) {
      const [value, nextState] = nextInt(state, 3, 8);
      expect(value).toBeGreaterThanOrEqual(3);
      expect(value).toBeLessThan(8);
      state = nextState;
    }
  });
});
