import type { PresentationConflict } from "../presentation/presentationState";
import {
  TMR_ICON_IDS,
  type TmrIconId,
} from "../presentation/design/iconRegistry";
import type { GameEvent } from "../sim/events/event";

export function crisisIconIdForConflictKind(
  kind: PresentationConflict["kind"],
): TmrIconId {
  switch (kind) {
    case "rebellion":
      return TMR_ICON_IDS.crisis.rebellion;
    case "coup":
      return TMR_ICON_IDS.crisis.coup;
    case "civilWar":
    case "war":
      return TMR_ICON_IDS.crisis.civilConflict;
  }
}

/**
 * Maps only event types with a stable crisis silhouette. A generic crisis
 * flag is not enough to invent a more specific icon for another event.
 */
export function crisisIconIdForEvent(
  event: GameEvent | undefined,
): TmrIconId | null {
  switch (event?.type) {
    case "COUP_ATTEMPT_STARTED":
      return TMR_ICON_IDS.crisis.coup;
    case "REBELLION_STARTED":
      return TMR_ICON_IDS.crisis.rebellion;
    case "CIVIL_WAR_STARTED":
      return TMR_ICON_IDS.crisis.civilConflict;
    case "STATE_DISSOLVED":
      return TMR_ICON_IDS.crisis.stateDissolutionWarning;
    default:
      return null;
  }
}
