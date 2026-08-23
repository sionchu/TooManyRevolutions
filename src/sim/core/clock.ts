export const CLOCK_SPEEDS = [0, 1, 3, 8] as const;

export type ClockSpeed = (typeof CLOCK_SPEEDS)[number];

export interface SimulationClock {
  readonly speed: ClockSpeed;
}

export interface SimDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

const DAYS_PER_MONTH = 30;
const MONTHS_PER_YEAR = 12;

/** Authoritative simulation calendar horizon used by headless tooling. */
export const SIMULATION_DAYS_PER_YEAR = DAYS_PER_MONTH * MONTHS_PER_YEAR;

export function createSimulationClock(speed: ClockSpeed = 1): SimulationClock {
  return { speed };
}

export function setClockSpeed(
  _clock: SimulationClock,
  speed: ClockSpeed,
): SimulationClock {
  return { speed };
}

export function isClockRunning(clock: SimulationClock): boolean {
  return clock.speed > 0;
}

export function createSimDate(year = 1, month = 1, day = 1): SimDate {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > MONTHS_PER_YEAR ||
    day < 1 ||
    day > DAYS_PER_MONTH
  ) {
    throw new Error("A simulation date must use a 12-month, 30-day calendar.");
  }

  return { year, month, day };
}

export function advanceSimDate(date: SimDate, days = 1): SimDate {
  if (!Number.isInteger(days) || days < 0) {
    throw new Error(
      "Simulation date advancement must be a non-negative integer.",
    );
  }

  let year = date.year;
  let month = date.month;
  let day = date.day + days;

  while (day > DAYS_PER_MONTH) {
    day -= DAYS_PER_MONTH;
    month += 1;

    if (month > MONTHS_PER_YEAR) {
      month = 1;
      year += 1;
    }
  }

  return { year, month, day };
}
