import { describe, expect, it } from "vitest";

import {
  advanceDemoRecord,
  createDemoRunRecord,
  submitIntervention,
} from "./demoGame";
import { F04D_VALIDATION_INTERVENTION_IDS } from "../sim/state/gate1fValidationFixture";

describe("GameBuilders demo runtime boundary", () => {
  it("starts from a deterministic named run", () => {
    expect(createDemoRunRecord()).toEqual(createDemoRunRecord());
    expect(createDemoRunRecord().world.tick).toBe(0);
    expect(createDemoRunRecord().world.run.seed).toBe(18970401);
  });

  it("advances through real ticks and the accepted intervention pipeline", () => {
    const initial = createDemoRunRecord();
    const started = submitIntervention(
      initial,
      F04D_VALIDATION_INTERVENTION_IDS.materialRelief,
    );

    expect(started.world.tick).toBe(1);
    expect(
      started.eventStore.events.some(
        (event) => event.type === "INTERVENTION_STARTED",
      ),
    ).toBe(true);

    const completed = advanceDemoRecord(started, 1);
    expect(completed.world.tick).toBe(2);
    expect(
      completed.eventStore.events.some(
        (event) => event.type === "INTERVENTION_COMPLETED",
      ),
    ).toBe(true);
  });

  it("uses the same daily pipeline for grouped time controls", () => {
    const record = advanceDemoRecord(createDemoRunRecord(), 7);

    expect(record.world.tick).toBe(7);
    expect(
      record.eventStore.events.filter(
        (event) => event.type === "TICK_ADVANCED",
      ),
    ).toHaveLength(7);
  });
});
