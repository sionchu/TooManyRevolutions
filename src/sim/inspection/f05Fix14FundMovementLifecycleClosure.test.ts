import { describe, expect, it } from "vitest";

import {
  commitSimulationStep,
  deserializeSimulationSnapshot,
  serializeSimulationSnapshot,
} from "../core/persistence";
import type { RunRecord, SimulationStepInput } from "../core/step";
import { runSimulationStep } from "../core/tick";
import { createEventStore } from "../events/eventStore";
import {
  acceptActionProposal,
  acceptActionProposals,
  TARGETED_FUND_MOVEMENT_ACTION_SCHEMA_VERSION,
  type ActionProposal,
} from "../state/action";
import { createF05Fix13TargetedCommitmentScenario } from "../state/f05Fix13Fixture";
import {
  deriveActiveFactionFundMovementCommitments,
  deriveFactionAvailableResources,
} from "../state/factionFundMovement";
import {
  asCountryId,
  asEventId,
  asRegionId,
  type FactionId,
  type RegionId,
} from "../state/ids";
import { createF05Fix7PoliticalInteractionScenario } from "../state/politicalInteractionFixture";
import { POLITICAL_CRISIS_FIXTURE_FACTION_IDS } from "../state/politicalCrisisFixture";
import type { ScenarioDefinition } from "../state/scenario";
import { createInitialWorldState, type WorldState } from "../state/world";
import {
  applyFactionFundMovementLifecycle,
  chooseFactionActionProposal,
  wouldFactionRenewFundMovementCommitment,
} from "../systems/factionPressure";
import { detectFactionPressureAgendas } from "../readModels/agenda";
import { runF05Fix14ProfilePath } from "./f05Fix14FundMovementLifecycleClosure";

const COUP_FACTION_ID = POLITICAL_CRISIS_FIXTURE_FACTION_IDS.coup;
const REBELLION_FACTION_ID = POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion;

function templateFor(scenario: ScenarioDefinition, factionId: FactionId) {
  const template = scenario.factionFundMovementTemplates?.find(
    (candidate) => candidate.factionId === factionId,
  );
  if (template === undefined) {
    throw new Error(`Missing FUND_MOVEMENT template for ${factionId}.`);
  }
  return template;
}

function targetedAction(
  scenario: ScenarioDefinition,
  world: WorldState,
  factionId: FactionId = COUP_FACTION_ID,
  targetRegionId: RegionId = templateFor(scenario, factionId).targetRegionId,
  resourceAmount = templateFor(scenario, factionId).resourceAmount,
) {
  return acceptActionProposal(
    {
      tick: world.tick + 1,
      source: "heuristic",
      actionType: "FUND_MOVEMENT",
      payload: { factionId, targetRegionId, resourceAmount },
      schemaVersion: TARGETED_FUND_MOVEMENT_ACTION_SCHEMA_VERSION,
    },
    world.run.nextActionSequence,
  );
}

function applyTargeted(
  scenario: ScenarioDefinition,
  world: WorldState,
  factionId: FactionId = COUP_FACTION_ID,
) {
  return runSimulationStep(
    world,
    { actions: [targetedAction(scenario, world, factionId)] },
    {},
    scenario,
  );
}

function withFaction(
  world: WorldState,
  factionId: FactionId,
  updates: Partial<WorldState["factions"][FactionId]>,
): WorldState {
  return {
    ...world,
    factions: {
      ...world.factions,
      [factionId]: { ...world.factions[factionId]!, ...updates },
    },
  };
}

function initialRecord(world: WorldState): RunRecord {
  return { world, eventStore: createEventStore() };
}

function commitStep(
  scenario: ScenarioDefinition,
  record: RunRecord,
  input: SimulationStepInput = { actions: [] },
): RunRecord {
  const step = runSimulationStep(record.world, input, {}, scenario);
  return commitSimulationStep(scenario, record, step);
}

function advanceRecordTo(
  scenario: ScenarioDefinition,
  start: RunRecord,
  targetTick: number,
): RunRecord {
  let record = start;
  while (record.world.tick < targetTick) {
    record = commitStep(scenario, record);
  }
  return record;
}

describe("F05_FIX14 FUND_MOVEMENT lifecycle closure", () => {
  it("keeps targeted-v2 business-invalid applications semantically atomic", () => {
    const scenario = createF05Fix13TargetedCommitmentScenario();
    const initial = withFaction(
      createInitialWorldState(scenario, 51401),
      COUP_FACTION_ID,
      { currentStrategy: "wait" },
    );
    const template = templateFor(scenario, COUP_FACTION_ID);
    const foreignRegion = scenario.initialRegions[1]!;
    const foreignCountryId = asCountryId("f05.fix14.foreign-country");
    const playerCountry = Object.values(initial.countries)[0]!;
    const foreignWorld: WorldState = {
      ...initial,
      countries: {
        ...initial.countries,
        [foreignCountryId]: {
          ...playerCountry,
          id: foreignCountryId,
          name: "F05_FIX14 foreign validation country",
          currentGovernmentId: null,
          capitalRegionId: null,
          diplomacy: {},
        },
      },
      regions: {
        ...initial.regions,
        [foreignRegion.id]: {
          ...initial.regions[foreignRegion.id]!,
          ownerCountryId: foreignCountryId,
        },
      },
    };

    const cases: readonly {
      readonly name: string;
      readonly world: WorldState;
      readonly targetRegionId: RegionId;
      readonly amount: number;
    }[] = [
      {
        name: "profile target mismatch",
        world: initial,
        targetRegionId: scenario.initialRegions[1]!.id,
        amount: template.resourceAmount,
      },
      {
        name: "profile amount mismatch",
        world: initial,
        targetRegionId: template.targetRegionId,
        amount: template.resourceAmount + 0.05,
      },
      {
        name: "missing target",
        world: initial,
        targetRegionId: asRegionId("f05.fix14.missing-region"),
        amount: template.resourceAmount,
      },
      {
        name: "foreign target",
        world: foreignWorld,
        targetRegionId: foreignRegion.id,
        amount: template.resourceAmount,
      },
      {
        name: "insufficient resources",
        world: withFaction(initial, COUP_FACTION_ID, { resources: 0.1 }),
        targetRegionId: template.targetRegionId,
        amount: template.resourceAmount,
      },
    ];

    for (const candidate of cases) {
      const action = targetedAction(
        scenario,
        candidate.world,
        COUP_FACTION_ID,
        candidate.targetRegionId,
        candidate.amount,
      );
      const result = runSimulationStep(
        candidate.world,
        { actions: [action] },
        {},
        scenario,
      );

      expect(result.nextWorld.factions[COUP_FACTION_ID]!.currentStrategy).toBe(
        "wait",
      );
      expect(result.nextWorld.factionFundMovementCommitments).toEqual({});
      expect(
        result.emittedEvents.filter(
          (event) =>
            event.type === "FACTION_STRATEGY_CHANGED" ||
            event.type === "FACTION_FUND_MOVEMENT_COMMITTED",
        ),
        candidate.name,
      ).toEqual([]);
    }
  });

  it("keeps duplicate and terminal targeted-v2 applications atomic", () => {
    const scenario = createF05Fix13TargetedCommitmentScenario();
    const initial = withFaction(
      createInitialWorldState(scenario, 51402),
      COUP_FACTION_ID,
      { currentStrategy: "wait" },
    );
    const first = applyTargeted(scenario, initial);
    const duplicateWorld = withFaction(first.nextWorld, COUP_FACTION_ID, {
      currentStrategy: "wait",
    });
    const duplicate = applyTargeted(scenario, duplicateWorld);

    expect(duplicate.nextWorld.factions[COUP_FACTION_ID]!.currentStrategy).toBe(
      "wait",
    );
    expect(
      deriveActiveFactionFundMovementCommitments(
        duplicate.nextWorld,
        COUP_FACTION_ID,
      ),
    ).toHaveLength(1);
    expect(
      duplicate.emittedEvents.filter(
        (event) =>
          event.type === "FACTION_STRATEGY_CHANGED" ||
          event.type === "FACTION_FUND_MOVEMENT_COMMITTED",
      ),
    ).toEqual([]);

    const terminalWorld: WorldState = {
      ...initial,
      run: {
        ...initial.run,
        outcome: {
          status: "defeated",
          kind: "stateDissolved",
          countryId: initial.factions[COUP_FACTION_ID]!.countryId,
          reason: "stateContinuityThreshold",
          atTick: 0,
          causeEventId: asEventId("f05.fix14.terminal"),
        },
      },
    };
    const terminalAction = targetedAction(scenario, terminalWorld);
    const terminal = runSimulationStep(
      terminalWorld,
      { actions: [terminalAction] },
      {},
      scenario,
    );
    expect(terminal.nextWorld).toBe(terminalWorld);
    expect(terminal.emittedEvents).toEqual([]);
  });

  it("preserves legacy v1 strategy-only behavior", () => {
    const scenario = createF05Fix7PoliticalInteractionScenario();
    const initial = withFaction(
      createInitialWorldState(scenario, 51403),
      COUP_FACTION_ID,
      {
        currentStrategy: "wait",
        grievance: 0.8,
        organization: 0.8,
        resources: 0.8,
      },
    );
    const proposal = chooseFactionActionProposal(
      initial,
      COUP_FACTION_ID,
      1,
      scenario,
    );
    const action = acceptActionProposal(
      {
        tick: 1,
        source: "heuristic",
        actionType: proposal.actionType,
        payload: { ...proposal.payload },
        schemaVersion: proposal.schemaVersion,
      },
      0,
    );
    const result = runSimulationStep(
      initial,
      { actions: [action] },
      {},
      scenario,
    );

    expect(proposal.actionType).toBe("FUND_MOVEMENT");
    expect(proposal.schemaVersion).toBe(1);
    expect(result.nextWorld.factions[COUP_FACTION_ID]!.currentStrategy).toBe(
      "fundMovement",
    );
    expect(result.nextWorld.factionFundMovementCommitments).toEqual({});
  });

  it("keeps intent active without consulting strategy or elapsed time", () => {
    const scenario = createF05Fix13TargetedCommitmentScenario();
    const first = applyTargeted(
      scenario,
      createInitialWorldState(scenario, 51404),
    );
    const active = deriveActiveFactionFundMovementCommitments(
      first.nextWorld,
      COUP_FACTION_ID,
    )[0]!;
    const strategyChanged = withFaction(first.nextWorld, COUP_FACTION_ID, {
      currentStrategy: "accept",
    });

    expect(
      wouldFactionRenewFundMovementCommitment(
        strategyChanged,
        active,
        scenario,
      ),
    ).toBe(true);

    for (const boundary of [
      { tick: 29, date: { year: 1, month: 1, day: 30 }, nextTick: 30 },
      { tick: 299, date: { year: 1, month: 10, day: 30 }, nextTick: 300 },
    ]) {
      const world = {
        ...strategyChanged,
        tick: boundary.tick,
        date: boundary.date,
      };
      const lifecycle = applyFactionFundMovementLifecycle(
        world,
        boundary.nextTick,
        world.run.nextEventSequence,
        scenario,
      );
      expect(
        deriveActiveFactionFundMovementCommitments(
          lifecycle.world,
          COUP_FACTION_ID,
        ),
      ).toHaveLength(1);
      expect(lifecycle.emittedEvents).toEqual([]);
    }
  });

  it("resolves from authoritative intent, releases resources, and removes active Agenda evidence", () => {
    const scenario = createF05Fix13TargetedCommitmentScenario();
    const first = applyTargeted(
      scenario,
      createInitialWorldState(scenario, 51405),
    );
    const lowIntent = withFaction(
      { ...first.nextWorld, tick: 29, date: { year: 1, month: 1, day: 30 } },
      COUP_FACTION_ID,
      { grievance: 0.55, currentStrategy: "fundMovement" },
    );
    const availableBefore = deriveFactionAvailableResources(
      lowIntent,
      COUP_FACTION_ID,
    );
    const agendaBefore = detectFactionPressureAgendas({
      scenario,
      world: lowIntent,
      recentEvents: [],
    }).find((agenda) => agenda.involvedFactionIds[0] === COUP_FACTION_ID);
    const lifecycle = applyFactionFundMovementLifecycle(
      lowIntent,
      30,
      lowIntent.run.nextEventSequence,
      scenario,
    );
    const commitment = Object.values(
      lifecycle.world.factionFundMovementCommitments,
    )[0]!;
    const agendaAfter = detectFactionPressureAgendas({
      scenario,
      world: lifecycle.world,
      recentEvents: lifecycle.emittedEvents,
    }).find((agenda) => agenda.involvedFactionIds[0] === COUP_FACTION_ID);

    expect(commitment).toMatchObject({
      status: "resolved",
      resolvedAtTick: 30,
      resolutionReason: "actorIntentCeased",
    });
    expect(lifecycle.emittedEvents).toHaveLength(1);
    expect(lifecycle.emittedEvents[0]).toMatchObject({
      type: "FACTION_FUND_MOVEMENT_RESOLVED",
      actorId: COUP_FACTION_ID,
      targetId: templateFor(scenario, COUP_FACTION_ID).targetRegionId,
    });
    expect(availableBefore).toBe(0.55);
    expect(
      deriveFactionAvailableResources(lifecycle.world, COUP_FACTION_ID),
    ).toBe(0.8);
    expect(lifecycle.world.factions[COUP_FACTION_ID]!.resources).toBe(0.8);
    expect(
      agendaBefore?.keyCauses.some((cause) =>
        cause.key.startsWith("factionFundMovementCommitment:"),
      ),
    ).toBe(true);
    expect(
      agendaAfter?.keyCauses.some((cause) =>
        cause.key.startsWith("factionFundMovementCommitment:"),
      ),
    ).toBe(false);
    expect(agendaAfter?.severity).toBe(agendaBefore?.severity);
  });

  it("allows state-grounded re-entry once and blocks a new active duplicate", () => {
    const scenario = createF05Fix13TargetedCommitmentScenario();
    const first = applyTargeted(
      scenario,
      createInitialWorldState(scenario, 51406),
    );
    const lowIntent = withFaction(
      { ...first.nextWorld, tick: 29, date: { year: 1, month: 1, day: 30 } },
      COUP_FACTION_ID,
      { grievance: 0.55 },
    );
    const resolved = applyFactionFundMovementLifecycle(
      lowIntent,
      30,
      lowIntent.run.nextEventSequence,
      scenario,
    );
    const eligibleAgain = withFaction(
      { ...resolved.world, tick: 30, date: { year: 1, month: 2, day: 1 } },
      COUP_FACTION_ID,
      { grievance: 0.8, organization: 0.8, resources: 0.8 },
    );
    const proposal = chooseFactionActionProposal(
      eligibleAgain,
      COUP_FACTION_ID,
      31,
      scenario,
    );
    const reopened = applyTargeted(scenario, eligibleAgain);
    const duplicateWorld = withFaction(reopened.nextWorld, COUP_FACTION_ID, {
      currentStrategy: "wait",
    });
    const duplicate = applyTargeted(scenario, duplicateWorld);
    const commitments = Object.values(
      duplicate.nextWorld.factionFundMovementCommitments,
    );

    expect(proposal.actionType).toBe("FUND_MOVEMENT");
    expect(commitments).toHaveLength(2);
    expect(
      commitments.filter((commitment) => commitment.status === "resolved"),
    ).toHaveLength(1);
    expect(
      commitments.filter((commitment) => commitment.status === "active"),
    ).toHaveLength(1);
    expect(
      new Set(commitments.map((commitment) => commitment.sourceActionId)).size,
    ).toBe(2);
    expect(
      duplicate.emittedEvents.filter(
        (event) => event.type === "FACTION_FUND_MOVEMENT_COMMITTED",
      ),
    ).toHaveLength(0);
    expect(duplicate.nextWorld.factions[COUP_FACTION_ID]!.currentStrategy).toBe(
      "wait",
    );
  });

  it("uses the existing political-accommodation response to create a real lifecycle difference", () => {
    const scenario = createF05Fix13TargetedCommitmentScenario();
    const noResponse = runF05Fix14ProfilePath(scenario, 51408, 120, false);
    const existingResponse = runF05Fix14ProfilePath(scenario, 51408, 120, true);
    const resolution = existingResponse.resolutionObservations[0];

    expect(noResponse.commitmentCreationTicks[0]).toBe(31);
    expect(noResponse.resolutionObservations).toEqual([]);
    expect(noResponse.activeCommitmentsAtEnd).toBe(2);
    expect(existingResponse.playerResponseSubmittedTick).toBe(32);
    expect(resolution).toMatchObject({
      factionId: REBELLION_FACTION_ID,
      createdAtTick: 31,
      resolvedAtTick: 60,
      resolutionReason: "actorIntentCeased",
      availableResourcesBefore: 0.5,
      availableResourcesAfter: 0.8,
      agendaEvidenceBefore: true,
      agendaEvidenceAfter: false,
    });
    expect(existingResponse.duplicateOrChurnCount).toBe(0);
    expect(existingResponse.resourceDebitObserved).toBe(false);
    expect(existingResponse.forbiddenWriterEventTypes).toEqual([]);
  });

  it("round-trips resolved V6 state with uninterrupted and insertion-order-equal replay", () => {
    const scenario = createF05Fix13TargetedCommitmentScenario();
    let world = createInitialWorldState(scenario, 51407);
    world = withFaction(world, COUP_FACTION_ID, { grievance: 0.55 });
    world = withFaction(world, REBELLION_FACTION_ID, { grievance: 0.55 });
    const proposals: readonly ActionProposal[] = [
      {
        tick: 1,
        source: "heuristic",
        actionType: "FUND_MOVEMENT",
        payload: { ...templateFor(scenario, COUP_FACTION_ID) },
        schemaVersion: TARGETED_FUND_MOVEMENT_ACTION_SCHEMA_VERSION,
      },
      {
        tick: 1,
        source: "heuristic",
        actionType: "FUND_MOVEMENT",
        payload: { ...templateFor(scenario, REBELLION_FACTION_ID) },
        schemaVersion: TARGETED_FUND_MOVEMENT_ACTION_SCHEMA_VERSION,
      },
    ];
    const actions = acceptActionProposals(proposals, 0);
    const firstStep = runSimulationStep(world, { actions }, {}, scenario);
    let continuous = commitSimulationStep(
      scenario,
      initialRecord(world),
      firstStep,
    );
    continuous = advanceRecordTo(scenario, continuous, 15);
    const checkpoint = serializeSimulationSnapshot(scenario, continuous);
    const reversed = JSON.parse(JSON.stringify(checkpoint)) as {
      formatVersion: number;
      world: { factionFundMovementCommitments: Record<string, unknown> };
    };
    reversed.world.factionFundMovementCommitments = Object.fromEntries(
      Object.entries(reversed.world.factionFundMovementCommitments).reverse(),
    );
    let loaded = deserializeSimulationSnapshot(scenario, reversed);

    continuous = advanceRecordTo(scenario, continuous, 31);
    loaded = advanceRecordTo(scenario, loaded, 31);
    const continuousSnapshot = serializeSimulationSnapshot(
      scenario,
      continuous,
    );
    const loadedSnapshot = serializeSimulationSnapshot(scenario, loaded);

    expect(continuousSnapshot).toEqual(loadedSnapshot);
    expect(continuousSnapshot.formatVersion).toBe(6);
    expect(
      Object.values(continuous.world.factionFundMovementCommitments).every(
        (commitment) => commitment.status === "resolved",
      ),
    ).toBe(true);
    expect(
      continuous.eventStore.events.filter(
        (event) => event.type === "FACTION_FUND_MOVEMENT_RESOLVED",
      ),
    ).toHaveLength(2);
    expect(() =>
      deserializeSimulationSnapshot(scenario, {
        ...continuousSnapshot,
        formatVersion: 5,
      }),
    ).toThrow("Unsupported simulation snapshot version 5");

    const invalidReason = JSON.parse(JSON.stringify(continuousSnapshot)) as {
      world: {
        factionFundMovementCommitments: Record<
          string,
          { resolutionReason?: string }
        >;
      };
    };
    Object.values(
      invalidReason.world.factionFundMovementCommitments,
    )[0]!.resolutionReason = "timerExpired";
    expect(() =>
      deserializeSimulationSnapshot(scenario, invalidReason),
    ).toThrow("resolutionReason has an invalid value");

    const missingResolutionEvent = JSON.parse(
      JSON.stringify(continuousSnapshot),
    ) as {
      eventStore: {
        events: { type: string }[];
      };
    };
    missingResolutionEvent.eventStore.events =
      missingResolutionEvent.eventStore.events.filter(
        (event) => event.type !== "FACTION_FUND_MOVEMENT_RESOLVED",
      );
    expect(() =>
      deserializeSimulationSnapshot(scenario, missingResolutionEvent),
    ).toThrow("must have exactly one resolution event");
  });
});
