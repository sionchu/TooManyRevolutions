import { describe, expect, it } from "vitest";

import {
  advanceDemoRecord,
  createDemoRunRecord,
  submitIntervention,
} from "./demoGame";
import { F04D_VALIDATION_INTERVENTION_IDS } from "../sim/state/gate1fValidationFixture";
import { GAMEBUILDERS_DEMO_SCENARIO } from "../sim/state/gameBuildersDemoScenario";
import { INTERVENTION_FIXTURE_IDS } from "../sim/state/interventionFixture";

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

  it("keeps inspection-only intervention fixtures out of the player catalog", () => {
    const interventionIds = Object.keys(
      GAMEBUILDERS_DEMO_SCENARIO.interventionCatalog,
    );

    expect(interventionIds).toHaveLength(4);
    expect(interventionIds).not.toContain(INTERVENTION_FIXTURE_IDS.long);
    expect(interventionIds).not.toContain(
      INTERVENTION_FIXTURE_IDS.prerequisite,
    );
    expect(
      Object.values(GAMEBUILDERS_DEMO_SCENARIO.interventionCatalog).map(
        (definition) => definition.name,
      ),
    ).not.toContain("T016B 장기 행정 프로그램 fixture");
  });

  it("keeps action submission inside the common intake and records rejection honestly", () => {
    const initial = createDemoRunRecord();
    const afterFirstAction = submitIntervention(
      initial,
      F04D_VALIDATION_INTERVENTION_IDS.oppositionLegalization,
    );
    const matured = advanceDemoRecord(afterFirstAction, 15);
    const afterRejectedAction = submitIntervention(
      matured,
      F04D_VALIDATION_INTERVENTION_IDS.oppositionLegalization,
    );

    expect(
      afterRejectedAction.eventStore.events.some(
        (event) => event.type === "INTERVENTION_REJECTED",
      ),
    ).toBe(true);
  });
});
