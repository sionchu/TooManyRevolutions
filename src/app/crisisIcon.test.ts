import { describe, expect, it } from "vitest";

import { TMR_ICON_IDS } from "../presentation/design/iconRegistry";
import { createGameEvent, type GameEvent } from "../sim/events/event";
import {
  crisisIconIdForConflictKind,
  crisisIconIdForEvent,
} from "./crisisIcon";

function event(type: GameEvent["type"]): GameEvent {
  return createGameEvent({
    tick: 4,
    sequence: 0,
    type,
    causeIds: [],
    payload: {},
    visibility: "important",
  });
}

describe("TMR crisis icon mapping", () => {
  it("keeps conflict silhouettes tied to the actual conflict kind", () => {
    expect(crisisIconIdForConflictKind("rebellion")).toBe(
      TMR_ICON_IDS.crisis.rebellion,
    );
    expect(crisisIconIdForConflictKind("coup")).toBe(TMR_ICON_IDS.crisis.coup);
    expect(crisisIconIdForConflictKind("civilWar")).toBe(
      TMR_ICON_IDS.crisis.civilConflict,
    );
    expect(crisisIconIdForConflictKind("war")).toBe(
      TMR_ICON_IDS.crisis.civilConflict,
    );
  });

  it("does not assign a crisis silhouette to unrelated event types", () => {
    expect(crisisIconIdForEvent(event("REBELLION_STARTED"))).toBe(
      TMR_ICON_IDS.crisis.rebellion,
    );
    expect(crisisIconIdForEvent(event("COUP_ATTEMPT_STARTED"))).toBe(
      TMR_ICON_IDS.crisis.coup,
    );
    expect(crisisIconIdForEvent(event("CIVIL_WAR_STARTED"))).toBe(
      TMR_ICON_IDS.crisis.civilConflict,
    );
    expect(crisisIconIdForEvent(event("STATE_DISSOLVED"))).toBe(
      TMR_ICON_IDS.crisis.stateDissolutionWarning,
    );
    expect(crisisIconIdForEvent(event("GOVERNMENT_TRANSITIONED"))).toBeNull();
    expect(crisisIconIdForEvent(event("POLICY_ENACTED"))).toBeNull();
  });
});
