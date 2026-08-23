import { describe, expect, it } from "vitest";

import { createEventStore } from "../events/eventStore";
import {
  cloneRunRecordViaSnapshot,
  commitSimulationStep,
} from "../core/persistence";
import type { RunRecord } from "../core/step";
import { runSimulationStep } from "../core/tick";
import {
  acceptActionProposal,
  createStartInterventionActionProposal,
} from "../state/action";
import { GATE1F_VALIDATION_INTERVENTION_IDS } from "../state/gate1fValidationFixture";
import { createGate1FValidationScenario } from "../state/gate1fValidationFixture";
import type { InterventionId } from "../state/ids";
import { createInitialWorldState } from "../state/world";
import { createInterventionPhaseHooks } from "../systems/interventionHooks";

function createCanonicalInitialRecord(): RunRecord {
  const scenario = createGate1FValidationScenario();
  return cloneRunRecordViaSnapshot(scenario, {
    world: createInitialWorldState(scenario, 40108),
    eventStore: createEventStore(),
  });
}

function step(
  scenario: ReturnType<typeof createGate1FValidationScenario>,
  record: RunRecord,
  interventionId?: InterventionId,
): {
  readonly record: RunRecord;
  readonly events: RunRecord["eventStore"]["events"];
} {
  const actions =
    interventionId === undefined
      ? []
      : [
          acceptActionProposal(
            createStartInterventionActionProposal(
              record.world.tick + 1,
              "player",
              interventionId,
              scenario.playerCountryId!,
            ),
            record.world.run.nextActionSequence,
          ),
        ];
  const result = runSimulationStep(
    record.world,
    { actions },
    createInterventionPhaseHooks(scenario),
    scenario,
  );
  return {
    record: commitSimulationStep(scenario, record, result),
    events: result.emittedEvents,
  };
}

function runUntil(
  scenario: ReturnType<typeof createGate1FValidationScenario>,
  record: RunRecord,
  targetTick: number,
): RunRecord {
  let current = record;
  while (current.world.tick < targetTick) {
    current = step(scenario, current).record;
  }
  return current;
}

describe("F03A intervention downstream integration", () => {
  it("applies the material completion effect once and preserves causal events", () => {
    const scenario = createGate1FValidationScenario();
    let record = createCanonicalInitialRecord();
    const industrialId = scenario.initialRegions[1]!.id;

    const started = step(
      scenario,
      record,
      GATE1F_VALIDATION_INTERVENTION_IDS.short,
    );
    record = started.record;
    const completed = step(scenario, record);
    record = completed.record;

    const completion = completed.events.find(
      (event) => event.type === "INTERVENTION_COMPLETED",
    );
    const produced = completed.events.find(
      (event) =>
        event.type === "RESOURCE_PRODUCED" && event.targetId === industrialId,
    );
    const shortage = completed.events.find(
      (event) =>
        event.type === "RESOURCE_SHORTAGE_CHANGED" &&
        event.targetId === industrialId,
    );

    expect(completion).toBeDefined();
    expect(produced).toBeDefined();
    expect(shortage).toBeDefined();
    expect(produced?.causeIds).toContain(completion!.id);
    expect(shortage?.causeIds).toContain(produced!.id);
    expect(
      record.world.regions[industrialId]!.resourceProductionCapacity.food,
    ).toBe(6);
    expect(
      record.eventStore.events.filter(
        (event) => event.type === "INTERVENTION_COMPLETED",
      ),
    ).toHaveLength(1);
  });

  it("keeps completion effects identical across a mid-commitment save/load", () => {
    const scenario = createGate1FValidationScenario();
    const initial = createCanonicalInitialRecord();
    const started = step(
      scenario,
      initial,
      GATE1F_VALIDATION_INTERVENTION_IDS.long,
    ).record;
    const resumedStart = cloneRunRecordViaSnapshot(scenario, started);

    const continuous = runUntil(scenario, started, 182);
    const resumed = runUntil(scenario, resumedStart, 182);

    expect(resumed).toEqual(continuous);
    expect(
      continuous.eventStore.events.filter(
        (event) => event.type === "INTERVENTION_COMPLETED",
      ),
    ).toHaveLength(1);
    expect(continuous.world.factions).toMatchObject({
      "t018.fixture.coup-faction": { organization: 0.5 },
    });
    expect(
      continuous.eventStore.events.filter(
        (event) =>
          event.type === "REBELLION_STARTED" ||
          event.type === "COUP_ATTEMPT_STARTED",
      ),
    ).toHaveLength(2);
  });
});
