import { describe, expect, it } from "vitest";

import {
  advanceDemoRuntime,
  advanceDemoRecord,
  createDemoRuntimeState,
  createDemoRuntimeStateFromRecord,
  createDemoRunRecord,
  submitRuntimePolicy,
  submitIntervention,
} from "./demoGame";
import {
  deserializeSimulationSnapshot,
  serializeSimulationSnapshotJson,
} from "../sim/core/persistence";
import {
  GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS,
  GAMEBUILDERS_PRODUCTION_POLICY_IDS,
} from "../sim/state/gameBuildersDecisionCatalog";
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
      GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS.emergencyFoodDistribution,
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

    expect(interventionIds).toHaveLength(8);
    expect(
      interventionIds.every((id) =>
        id.startsWith("gamebuilders.intervention."),
      ),
    ).toBe(true);
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
      GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS.oppositionLegalization,
    );
    const matured = advanceDemoRecord(afterFirstAction, 15);
    const afterRejectedAction = submitIntervention(
      matured,
      GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS.oppositionLegalization,
    );

    expect(
      afterRejectedAction.eventStore.events.some(
        (event) => event.type === "INTERVENTION_REJECTED",
      ),
    ).toBe(true);
  });

  it("carries valid system proposals into the next common intake after player actions", () => {
    const afterPoliticalCheckpoint = advanceDemoRuntime(
      createDemoRuntimeState(),
      30,
    );

    expect(
      afterPoliticalCheckpoint.pendingSystemProposals.length,
    ).toBeGreaterThan(0);
    expect(
      afterPoliticalCheckpoint.pendingSystemProposals.every(
        (proposal) => proposal.tick === afterPoliticalCheckpoint.world.tick + 1,
      ),
    ).toBe(true);

    const pending = [...afterPoliticalCheckpoint.pendingSystemProposals];
    const playerFirst = submitRuntimePolicy(
      afterPoliticalCheckpoint,
      GAMEBUILDERS_PRODUCTION_POLICY_IDS.legislativeOversight,
    );
    const acceptedAtNextTick = playerFirst.world.run.actionLog.filter(
      (action) => action.tick === afterPoliticalCheckpoint.world.tick + 1,
    );

    expect(acceptedAtNextTick[0]?.source).toBe("player");
    expect(
      acceptedAtNextTick
        .slice(1)
        .map((action) => [action.source, action.actionType, action.payload]),
    ).toEqual(
      pending.map((proposal) => [
        proposal.source,
        proposal.actionType,
        proposal.payload,
      ]),
    );
  });

  it("runs real policy actions and the existing ideology diffusion hook", () => {
    const policyRun = submitRuntimePolicy(
      createDemoRuntimeState(),
      GAMEBUILDERS_PRODUCTION_POLICY_IDS.legislativeOversight,
    );
    expect(
      policyRun.eventStore.events.some(
        (event) => event.type === "POLICY_ENACTED",
      ),
    ).toBe(true);
    expect(
      policyRun.world.policies[GAMEBUILDERS_DEMO_SCENARIO.playerCountryId!]
        ?.institutionalRules,
    ).toMatchObject({
      rulerVeto: false,
      legislatureRequired: true,
    });

    const diffusionRun = advanceDemoRuntime(createDemoRuntimeState(), 30);
    expect(
      diffusionRun.eventStore.events.some(
        (event) => event.type === "IDEOLOGY_SUPPORT_CHANGED",
      ),
    ).toBe(true);
  });

  it("keeps uninterrupted and V8 save/load replay equal at an intake boundary", () => {
    const prefix = advanceDemoRuntime(createDemoRuntimeState(), 31);
    const uninterrupted = advanceDemoRuntime(prefix, 59);
    const loadedRecord = deserializeSimulationSnapshot(
      GAMEBUILDERS_DEMO_SCENARIO,
      serializeSimulationSnapshotJson(GAMEBUILDERS_DEMO_SCENARIO, prefix),
    );
    const loaded = createDemoRuntimeStateFromRecord(loadedRecord);

    expect(advanceDemoRuntime(loaded, 59)).toEqual(uninterrupted);
  });
});
