import { describe, expect, it } from "vitest";

import { createGameEvent } from "../sim/events/event";
import { isAutoPauseWorthyEvent } from "./autoPause";

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

describe("consequential auto-pause scope", () => {
  it("does not pause on routine feedback but does pause on state transitions", () => {
    expect(isAutoPauseWorthyEvent(event("POLICY_ENACTED"))).toBe(false);
    expect(isAutoPauseWorthyEvent(event("INTERVENTION_COMPLETED"))).toBe(false);
    expect(isAutoPauseWorthyEvent(event("BORDER_CLOSED"))).toBe(false);
    expect(isAutoPauseWorthyEvent(event("REBELLION_STARTED"))).toBe(true);
    expect(isAutoPauseWorthyEvent(event("GOVERNMENT_TRANSITIONED"))).toBe(true);
  });
});
