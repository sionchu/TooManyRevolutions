import { describe, expect, it } from "vitest";

import { createGameEvent } from "../sim/events/event";
import { GAMEBUILDERS_DEMO_SCENARIO } from "../sim/state/gameBuildersDemoScenario";
import { eventLabel } from "./gamePresentation";

describe("player event presentation", () => {
  it("reads the produced scarcity field instead of a nonexistent next value", () => {
    const region = GAMEBUILDERS_DEMO_SCENARIO.initialRegions[1]!;
    const event = createGameEvent({
      tick: 4,
      sequence: 0,
      type: "RESOURCE_SHORTAGE_CHANGED",
      causeIds: [],
      payload: {
        regionId: region.id,
        previousScarcity: 0.02,
        scarcity: 0.73,
        totalDemand: 12,
        totalShortage: 8.76,
      },
      visibility: "world",
    });

    const presentation = eventLabel(event, GAMEBUILDERS_DEMO_SCENARIO);
    expect(presentation.title).toContain(region.name);
    expect(presentation.detail).toContain("0.7");
    expect(presentation.detail).not.toContain("nextScarcity");
  });

  it("does not expose implementation vocabulary in generic player history", () => {
    const event = createGameEvent({
      tick: 1,
      sequence: 0,
      type: "NATIONAL_PRODUCTION_CHANGED",
      causeIds: [],
      payload: { value: 10 },
      visibility: "world",
    });

    const presentation = eventLabel(event, GAMEBUILDERS_DEMO_SCENARIO);
    expect(`${presentation.title} ${presentation.detail}`).not.toMatch(
      /Renderer|LandHex|ActionRecord|EventStore|T018|RunOutcome|fixture/i,
    );
  });
});
