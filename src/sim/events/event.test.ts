import { describe, expect, it } from "vitest";

import {
  appendEvent,
  assertEventStoreInvariants,
  createEventStore,
} from "./eventStore";
import { createGameEvent } from "./event";
import { asEventId } from "../state/ids";

describe("serializable event model", () => {
  it("preserves cause IDs and round-trips through JSON", () => {
    const root = createGameEvent({
      tick: 1,
      sequence: 0,
      type: "POLICY_ENACTED",
      causeIds: [],
      payload: {
        policyId: "council-rights",
      },
      visibility: "world",
    });
    const consequence = createGameEvent({
      tick: 2,
      sequence: 1,
      type: "SUPPORT_SHIFTED",
      causeIds: [root.id],
      payload: {
        ideologyId: "republicanism",
        delta: 0.05,
      },
      visibility: "important",
    });
    const store = appendEvent(
      appendEvent(createEventStore(), root),
      consequence,
    );

    expect(consequence.causeIds).toEqual([root.id]);
    expect(JSON.parse(JSON.stringify(store))).toEqual(store);
  });

  it("rejects causal references that do not exist yet", () => {
    const event = createGameEvent({
      tick: 1,
      sequence: 0,
      type: "SUPPORT_SHIFTED",
      causeIds: [asEventId("missing:0")],
      payload: {},
      visibility: "hidden",
    });

    expect(() => appendEvent(createEventStore(), event)).toThrow(
      "references missing cause missing:0",
    );
  });

  it("requires globally increasing event sequence order", () => {
    const first = createGameEvent({
      tick: 1,
      sequence: 1,
      type: "TICK_ADVANCED",
      causeIds: [],
      payload: {},
      visibility: "hidden",
    });
    const outOfOrder = createGameEvent({
      tick: 1,
      sequence: 0,
      type: "POLICY_ENACTED",
      causeIds: [],
      payload: {},
      visibility: "hidden",
    });

    expect(() => appendEvent(createEventStore([first]), outOfOrder)).toThrow(
      "not in global emission order",
    );
  });

  it("validates a complete persisted history in one pass", () => {
    const first = createGameEvent({
      tick: 0,
      sequence: 0,
      type: "TICK_ADVANCED",
      causeIds: [],
      payload: {},
      visibility: "hidden",
    });
    const later = createGameEvent({
      tick: 1,
      sequence: 2,
      type: "TICK_ADVANCED",
      causeIds: [],
      payload: {},
      visibility: "hidden",
    });
    const gapThenRewind = createGameEvent({
      tick: 1,
      sequence: 1,
      type: "TREASURY_CHANGED",
      causeIds: [],
      payload: {},
      visibility: "hidden",
    });

    expect(() =>
      assertEventStoreInvariants({ events: [first, first] }),
    ).toThrow("already exists");
    expect(() =>
      assertEventStoreInvariants({ events: [first, later, gapThenRewind] }),
    ).toThrow("global emission order");
  });
});
