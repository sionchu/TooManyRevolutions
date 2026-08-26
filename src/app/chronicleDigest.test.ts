import { describe, expect, it } from "vitest";

import { createGameEvent } from "../sim/events/event";
import {
  GAMEBUILDERS_DEMO_REGION_IDS,
  GAMEBUILDERS_DEMO_SCENARIO,
} from "../sim/state/gameBuildersDemoScenario";
import { IDEOLOGY_FIXTURE_IDS } from "../sim/state/ideologyFixture";
import { deriveChronicleDigest } from "./chronicleDigest";

describe("ChronicleDigest", () => {
  it("groups routine political drift while retaining exact source EventIds", () => {
    const regionId = GAMEBUILDERS_DEMO_REGION_IDS.veloriaPort;
    const events = [
      createGameEvent({
        tick: 30,
        sequence: 4,
        type: "IDEOLOGY_SUPPORT_CHANGED",
        causeIds: [],
        payload: {
          regionId,
          ideologyId: IDEOLOGY_FIXTURE_IDS.republicanism,
          previousSupport: 0.2,
          support: 0.3,
        },
        visibility: "world",
      }),
      createGameEvent({
        tick: 30,
        sequence: 5,
        type: "IDEOLOGY_RADICALISM_CHANGED",
        causeIds: [],
        payload: {
          regionId,
          ideologyId: IDEOLOGY_FIXTURE_IDS.republicanism,
          previousRadicalism: 0.2,
          radicalism: 0.4,
        },
        visibility: "world",
      }),
      createGameEvent({
        tick: 31,
        sequence: 6,
        type: "POLICY_ENACTED",
        causeIds: [],
        payload: { policyId: "fixture.abolish-royal-veto" },
        visibility: "important",
      }),
    ];

    const digest = deriveChronicleDigest(events, GAMEBUILDERS_DEMO_SCENARIO);
    expect(digest[0]?.level).toBe(1);
    expect(digest[1]?.level).toBe(3);
    expect(digest[1]?.sourceEventIds).toHaveLength(2);
    expect(digest[1]?.sourceEventIds).toEqual([events[0]!.id, events[1]!.id]);
    expect(
      deriveChronicleDigest([...events].reverse(), GAMEBUILDERS_DEMO_SCENARIO),
    ).toEqual(digest);
    expect(events).toHaveLength(3);
  });
});
