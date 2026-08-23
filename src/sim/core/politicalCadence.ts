import type { SimDate } from "./clock";

/** Political systems may update on a slower calendar boundary than the daily tick. */
export type PoliticalCadence = "daily" | "weekly" | "monthly";

/** The foundation calendar uses seven-day weeks for political cadence checks. */
export const DAYS_PER_POLITICAL_WEEK = 7;

/**
 * Return whether a political phase should resolve for the next authoritative
 * tick. The caller supplies the date that the tick will close on, so monthly
 * cadence follows the 30-day calendar boundary rather than wall-clock time.
 */
export function shouldRunPoliticalUpdate(
  nextTick: number,
  nextDate: SimDate,
  cadence: PoliticalCadence,
): boolean {
  if (!Number.isInteger(nextTick) || nextTick <= 0) {
    throw new Error("Political cadence checks require a positive next tick.");
  }

  switch (cadence) {
    case "daily":
      return true;
    case "weekly":
      return nextTick % DAYS_PER_POLITICAL_WEEK === 0;
    case "monthly":
      return nextDate.day === 1;
    default:
      throw new Error(`Unsupported political cadence: ${String(cadence)}.`);
  }
}
