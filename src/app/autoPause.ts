import type { GameEvent } from "../sim/events/event";

export const AUTO_PAUSE_EVENT_TYPES = [
  "COUP_ATTEMPT_STARTED",
  "REBELLION_STARTED",
  "CIVIL_WAR_STARTED",
  "GOVERNMENT_TRANSITIONED",
  "ORDER_CONSOLIDATED",
  "STATE_DISSOLVED",
] as const satisfies readonly GameEvent["type"][];

const AUTO_PAUSE_TYPES = new Set<GameEvent["type"]>(AUTO_PAUSE_EVENT_TYPES);

/** Routine feedback remains observable; only consequential transitions pause. */
export function isAutoPauseWorthyEvent(event: GameEvent): boolean {
  return AUTO_PAUSE_TYPES.has(event.type);
}
