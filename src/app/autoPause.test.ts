import { describe, expect, it } from "vitest";

import { createGameEvent } from "../sim/events/event";
import {
  deriveEventTimeReaction,
  deriveTimeReaction,
  nextSpeedAfterTimeReaction,
} from "./autoPause";

function event(type: Parameters<typeof createGameEvent>[0]["type"]) {
  return createGameEvent({
    tick: 1,
    sequence: 0,
    type,
    causeIds: [],
    payload: {},
    visibility: "world",
  });
}

describe("player-facing time reactions", () => {
  it("keeps routine and non-terminal transitions flowing", () => {
    expect(deriveEventTimeReaction(event("POLICY_ENACTED"))).toBe("NONE");
    expect(deriveEventTimeReaction(event("INTERVENTION_COMPLETED"))).toBe(
      "NONE",
    );
    expect(deriveEventTimeReaction(event("BORDER_CLOSED"))).toBe("NONE");
    expect(deriveEventTimeReaction(event("GOVERNMENT_TRANSITIONED"))).toBe(
      "NONE",
    );
  });

  it("slows rebellion, coup, and civil war without stopping playback", () => {
    expect(deriveEventTimeReaction(event("REBELLION_STARTED"))).toBe("SLOW");
    expect(deriveEventTimeReaction(event("COUP_ATTEMPT_STARTED"))).toBe("SLOW");
    expect(deriveEventTimeReaction(event("CIVIL_WAR_STARTED"))).toBe("SLOW");
  });

  it("stops only for terminal outcomes", () => {
    expect(deriveEventTimeReaction(event("ORDER_CONSOLIDATED"))).toBe("STOP");
    expect(deriveEventTimeReaction(event("STATE_DISSOLVED"))).toBe("STOP");
  });

  it("uses STOP > SLOW > NONE precedence for one tick", () => {
    expect(
      deriveTimeReaction([
        event("POLICY_ENACTED"),
        event("REBELLION_STARTED"),
        event("STATE_DISSOLVED"),
      ]),
    ).toBe("STOP");
    expect(
      deriveTimeReaction([
        event("POLICY_ENACTED"),
        event("COUP_ATTEMPT_STARTED"),
      ]),
    ).toBe("SLOW");
    expect(deriveTimeReaction([event("POLICY_ENACTED")])).toBe("NONE");
  });

  it("moves an enabled crisis from 3x or 2x to 1x and preserves 1x", () => {
    expect(nextSpeedAfterTimeReaction(3, "SLOW", true)).toBe(1);
    expect(nextSpeedAfterTimeReaction(2, "SLOW", true)).toBe(1);
    expect(nextSpeedAfterTimeReaction(1, "SLOW", true)).toBe(1);
  });

  it("keeps the current speed when auto-slow is disabled", () => {
    expect(nextSpeedAfterTimeReaction(3, "SLOW", false)).toBe(3);
    expect(nextSpeedAfterTimeReaction(2, "SLOW", false)).toBe(2);
  });
});
