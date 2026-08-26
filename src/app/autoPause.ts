import type { GameEvent } from "../sim/events/event";
import type { DemoSpeed } from "./demoSpeed";

export type TimeReaction = "NONE" | "SLOW" | "STOP";

const TIME_REACTION_PRIORITY: Readonly<Record<TimeReaction, number>> = {
  NONE: 0,
  SLOW: 1,
  STOP: 2,
};

/** Map one recorded event to its player-facing time reaction. */
export function deriveEventTimeReaction(event: GameEvent): TimeReaction {
  switch (event.type) {
    case "COUP_ATTEMPT_STARTED":
    case "REBELLION_STARTED":
    case "CIVIL_WAR_STARTED":
      return "SLOW";
    case "ORDER_CONSOLIDATED":
    case "STATE_DISSOLVED":
      return "STOP";
    default:
      return "NONE";
  }
}

/** Apply STOP > SLOW > NONE deterministically to one simulation tick. */
export function deriveTimeReaction(events: readonly GameEvent[]): TimeReaction {
  let reaction: TimeReaction = "NONE";
  for (const event of events) {
    const candidate = deriveEventTimeReaction(event);
    if (TIME_REACTION_PRIORITY[candidate] > TIME_REACTION_PRIORITY[reaction]) {
      reaction = candidate;
    }
  }
  return reaction;
}

/** Auto-slow crises to 1x without changing speed for routine or disabled cases. */
export function nextSpeedAfterTimeReaction(
  speed: DemoSpeed,
  reaction: TimeReaction,
  autoSlowCrises: boolean,
): DemoSpeed {
  return reaction === "SLOW" && autoSlowCrises ? 1 : speed;
}
