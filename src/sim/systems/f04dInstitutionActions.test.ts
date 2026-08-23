import { describe, expect, it } from "vitest";

import { createEventStore } from "../events/eventStore";
import {
  cloneRunRecordViaSnapshot,
  commitSimulationStep,
  deserializeSimulationSnapshot,
  serializeSimulationSnapshotJson,
} from "../core/persistence";
import type { RunRecord } from "../core/step";
import { runSimulationStep } from "../core/tick";
import {
  acceptActionProposal,
  createStartInterventionActionProposal,
} from "../state/action";
import {
  createF04DValidationScenario,
  F04D_VALIDATION_INTERVENTION_IDS,
} from "../state/gate1fValidationFixture";
import { POLITICAL_CRISIS_FIXTURE_FACTION_IDS } from "../state/politicalCrisisFixture";
import { deriveRegimeClassification } from "../state/government";
import { createInitialWorldState } from "../state/world";
import {
  deriveCommittedAdministrativeLoad,
  evaluateInterventionFeasibility,
} from "../state/intervention";
import { createInterventionPhaseHooks } from "./interventionHooks";
import { deriveFactionObservation } from "./factionPressure";

const scenario = createF04DValidationScenario();
const countryId = scenario.playerCountryId!;
const rebellionFactionId = POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion;

function createRecord(seed = 40404): RunRecord {
  return cloneRunRecordViaSnapshot(scenario, {
    world: createInitialWorldState(scenario, seed),
    eventStore: createEventStore(),
  });
}

function step(
  record: RunRecord,
  interventionId:
    | (typeof F04D_VALIDATION_INTERVENTION_IDS)[keyof typeof F04D_VALIDATION_INTERVENTION_IDS]
    | null,
): RunRecord {
  const actions =
    interventionId === null
      ? []
      : [
          acceptActionProposal(
            createStartInterventionActionProposal(
              record.world.tick + 1,
              "player",
              interventionId,
              countryId,
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
  return commitSimulationStep(scenario, record, result);
}

function complete(
  interventionId: (typeof F04D_VALIDATION_INTERVENTION_IDS)[keyof typeof F04D_VALIDATION_INTERVENTION_IDS],
): { readonly started: RunRecord; readonly completed: RunRecord } {
  const started = step(createRecord(), interventionId);
  let completed = started;
  while (
    Object.values(completed.world.interventionCommitments).some(
      (commitment) => commitment.interventionId === interventionId,
    )
  ) {
    completed = step(completed, null);
  }
  return { started, completed };
}

describe("F04D institution-mediated response actions", () => {
  it("exposes exactly four F04D response paths through normal feasibility", () => {
    const record = createRecord();
    const ids = Object.values(F04D_VALIDATION_INTERVENTION_IDS);

    expect(new Set(ids)).toHaveLength(4);
    for (const interventionId of ids) {
      expect(
        evaluateInterventionFeasibility({
          scenario,
          world: record.world,
          interventionId,
          countryId,
        }).feasible,
      ).toBe(true);
    }
  });

  it("routes material relief through capacity, cost, and bounded commitment load", () => {
    const initial = createRecord();
    const wait = step(initial, null);
    const { started, completed } = complete(
      F04D_VALIDATION_INTERVENTION_IDS.materialRelief,
    );
    const industrialId = scenario.initialRegions[1]!.id;
    const definition =
      scenario.interventionCatalog[
        F04D_VALIDATION_INTERVENTION_IDS.materialRelief
      ]!;

    expect(
      wait.world.countries[countryId]!.treasury -
        started.world.countries[countryId]!.treasury,
    ).toBe(definition.treasuryCost);
    expect(deriveCommittedAdministrativeLoad(started.world, countryId)).toBe(
      definition.administrativeLoad,
    );
    expect(
      completed.world.regions[industrialId]!.resourceProductionCapacity.food,
    ).toBe(
      (initial.world.regions[industrialId]!.resourceProductionCapacity.food ??
        0) + 6,
    );
    expect(completed.world.factions[rebellionFactionId]!.organization).toBe(
      initial.world.factions[rebellionFactionId]!.organization,
    );
    expect(
      evaluateInterventionFeasibility({
        scenario,
        world: started.world,
        interventionId: F04D_VALIDATION_INTERVENTION_IDS.materialRelief,
        countryId,
      }).reasons,
    ).toContainEqual(
      expect.objectContaining({
        kind: "INSUFFICIENT_ADMINISTRATIVE_HEADROOM",
      }),
    );
  });

  it("completes political accommodation without deleting organization or opening competition", () => {
    const initial = createRecord();
    const { completed } = complete(
      F04D_VALIDATION_INTERVENTION_IDS.politicalAccommodation,
    );

    expect(completed.world.factions[rebellionFactionId]!.grievance).toBeCloseTo(
      initial.world.factions[rebellionFactionId]!.grievance - 0.25,
    );
    expect(completed.world.factions[rebellionFactionId]!.organization).toBe(
      initial.world.factions[rebellionFactionId]!.organization,
    );
    expect(
      completed.world.policies[countryId]!.institutionalRules
        .politicalCompetition,
    ).toBe("restricted");
  });

  it("legalizes opposition, opens public bargaining, and emits the canonical rule event", () => {
    const initial = createRecord();
    const { completed } = complete(
      F04D_VALIDATION_INTERVENTION_IDS.oppositionLegalization,
    );
    const before = deriveFactionObservation(
      initial.world,
      rebellionFactionId,
      scenario,
    );
    const after = deriveFactionObservation(
      completed.world,
      rebellionFactionId,
      scenario,
    );
    const ruleEvent = completed.eventStore.events.find(
      (event) =>
        event.type === "INSTITUTION_RULE_CHANGED" &&
        typeof event.payload === "object" &&
        event.payload !== null &&
        !Array.isArray(event.payload) &&
        (event.payload as Readonly<Record<string, unknown>>)["rule"] ===
          "politicalCompetition",
    );

    expect(before.availableActions.BARGAIN).toBe(false);
    expect(after.availableActions.BARGAIN).toBe(true);
    expect(after.availableActions.LOBBY).toBe(before.availableActions.LOBBY);
    expect(after.availableActions.ORGANIZE).toBe(
      before.availableActions.ORGANIZE,
    );
    expect(completed.world.factions[rebellionFactionId]!.organization).toBe(
      initial.world.factions[rebellionFactionId]!.organization,
    );
    expect(ruleEvent).toMatchObject({
      payload: {
        previousValue: "restricted",
        value: "plural",
      },
    });
    expect(ruleEvent?.causeIds).toHaveLength(1);
    expect(
      completed.eventStore.events.find(
        (event) => event.id === ruleEvent?.causeIds[0],
      )?.type,
    ).toBe("INTERVENTION_COMPLETED");
    expect(
      deriveRegimeClassification(initial.world.policies[countryId]!)
        .classification,
    ).toBe(
      deriveRegimeClassification(completed.world.policies[countryId]!)
        .classification,
    );
    const loaded = deserializeSimulationSnapshot(
      scenario,
      serializeSimulationSnapshotJson(scenario, completed),
    );
    expect(loaded.world.policies[countryId]!.institutionalRules).toEqual(
      completed.world.policies[countryId]!.institutionalRules,
    );
    expect(
      completed.eventStore.events.some(
        (event) => event.type === "GOVERNMENT_TRANSITIONED",
      ),
    ).toBe(false);
    expect(completed.world.countries[countryId]!.currentGovernmentId).toBe(
      initial.world.countries[countryId]!.currentGovernmentId,
    );
    expect(
      evaluateInterventionFeasibility({
        scenario,
        world: completed.world,
        interventionId: F04D_VALIDATION_INTERVENTION_IDS.oppositionLegalization,
        countryId,
      }).feasible,
    ).toBe(false);
  });

  it("uses coercion to narrow legal action while leaving organization recoverable", () => {
    const initial = createRecord();
    const { completed } = complete(
      F04D_VALIDATION_INTERVENTION_IDS.coerciveRestriction,
    );
    const after = deriveFactionObservation(
      completed.world,
      rebellionFactionId,
      scenario,
    );

    expect(
      completed.world.policies[countryId]!.institutionalRules,
    ).toMatchObject({
      politicalCompetition: "banned",
      pressFreedom: "censored",
    });
    expect(after.availableActions.BARGAIN).toBe(false);
    expect(after.availableActions.LOBBY).toBe(false);
    expect(completed.world.factions[rebellionFactionId]!.organization).toBe(
      initial.world.factions[rebellionFactionId]!.organization - 0.12,
    );
    expect(
      completed.world.factions[rebellionFactionId]!.organization,
    ).toBeGreaterThan(0);
    expect(completed.world.factions[rebellionFactionId]!.grievance).toBe(
      initial.world.factions[rebellionFactionId]!.grievance + 0.1,
    );
    expect(
      Object.values(completed.world.conflicts).filter(
        (conflict) => conflict.status === "active",
      ),
    ).toHaveLength(0);
    expect(
      evaluateInterventionFeasibility({
        scenario,
        world: completed.world,
        interventionId: F04D_VALIDATION_INTERVENTION_IDS.coerciveRestriction,
        countryId,
      }).feasible,
    ).toBe(false);
  });
});
