export type DemoSpeed = 1 | 2 | 3;

export const SPEED_INTERVAL_MS: Readonly<Record<DemoSpeed, number>> = {
  1: 900,
  2: 450,
  3: 300,
};
