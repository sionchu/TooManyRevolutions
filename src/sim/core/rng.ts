export interface SeedState {
  readonly seed: number;
  readonly state: number;
  readonly calls: number;
}

const UINT32_RANGE = 4_294_967_296;

export function createSeedState(seed: number): SeedState {
  if (!Number.isSafeInteger(seed)) {
    throw new Error("A simulation seed must be a safe integer.");
  }

  const normalizedSeed = seed >>> 0;

  return {
    seed: normalizedSeed,
    state: normalizedSeed,
    calls: 0,
  };
}

export function nextRandom(seedState: SeedState): readonly [number, SeedState] {
  const nextState = (seedState.state + 0x6d2b79f5) >>> 0;
  let valueState = nextState;

  valueState = Math.imul(valueState ^ (valueState >>> 15), valueState | 1);
  valueState ^=
    valueState + Math.imul(valueState ^ (valueState >>> 7), valueState | 61);

  const value = ((valueState ^ (valueState >>> 14)) >>> 0) / UINT32_RANGE;

  return [
    value,
    {
      seed: seedState.seed,
      state: nextState,
      calls: seedState.calls + 1,
    },
  ];
}

export function nextInt(
  seedState: SeedState,
  minInclusive: number,
  maxExclusive: number,
): readonly [number, SeedState] {
  if (!Number.isInteger(minInclusive) || !Number.isInteger(maxExclusive)) {
    throw new Error("Random integer bounds must be integers.");
  }

  if (maxExclusive <= minInclusive) {
    throw new Error(
      "The random integer upper bound must exceed the lower bound.",
    );
  }

  const [value, nextState] = nextRandom(seedState);
  const result =
    minInclusive + Math.floor(value * (maxExclusive - minInclusive));

  return [result, nextState];
}
