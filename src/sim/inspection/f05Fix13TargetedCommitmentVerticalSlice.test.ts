import { describe, expect, it } from "vitest";

import { createEventStore } from "../events/eventStore";
import type { JsonValue } from "../core/serialization";
import {
  commitSimulationStep,
  deserializeSimulationSnapshot,
  serializeSimulationSnapshot,
} from "../core/persistence";
import { runSimulationStep } from "../core/tick";
import {
  acceptActionProposal,
  TARGETED_FUND_MOVEMENT_ACTION_SCHEMA_VERSION,
} from "../state/action";
import {
  deriveActiveFactionFundMovementCommitments,
  deriveFactionAvailableResources,
  hasActiveFactionFundMovementCommitment,
  createDeterministicFactionFundMovementCommitmentId,
} from "../state/factionFundMovement";
import { POLITICAL_CRISIS_FIXTURE_FACTION_IDS } from "../state/politicalCrisisFixture";
import { createF05Fix7PoliticalInteractionScenario } from "../state/politicalInteractionFixture";
import { createF05Fix13TargetedCommitmentScenario } from "../state/f05Fix13Fixture";
import { detectFactionPressureAgendas } from "../readModels/agenda";
import {
  acceptFactionActionProposal,
  chooseFactionActionProposal,
  deriveFactionObservation,
} from "../systems/factionPressure";
import { asRegionId, type FactionId } from "../state/ids";
import type { ScenarioDefinition } from "../state/scenario";
import { createInitialWorldState, type WorldState } from "../state/world";

const TARGET_FACTION_ID = POLITICAL_CRISIS_FIXTURE_FACTION_IDS.coup;

function initialTargetedWorld(): {
  readonly scenario: ScenarioDefinition;
  readonly world: WorldState;
} {
  const scenario = createF05Fix13TargetedCommitmentScenario();
  return {
    scenario,
    world: createInitialWorldState(scenario, 51313),
  };
}

function targetedAction(
  scenario: ScenarioDefinition,
  factionId: FactionId,
  sequence: number,
  tick: number,
  targetRegionId = scenario.initialRegions[0]!.id,
  resourceAmount = scenario.factionFundMovementTemplates![0]!.resourceAmount,
) {
  return acceptActionProposal(
    {
      tick,
      source: "heuristic",
      actionType: "FUND_MOVEMENT",
      payload: { factionId, targetRegionId, resourceAmount },
      schemaVersion: TARGETED_FUND_MOVEMENT_ACTION_SCHEMA_VERSION,
    },
    sequence,
  );
}

function applyTargeted(
  scenario: ScenarioDefinition,
  world: WorldState,
  action = targetedAction(scenario, TARGET_FACTION_ID, 0, world.tick + 1),
) {
  return runSimulationStep(world, { actions: [action] }, {}, scenario);
}

describe("F05_FIX13 targeted FUND_MOVEMENT commitment vertical slice", () => {
  it("preserves the legacy no-profile v1 path without target inference", () => {
    const scenario = createF05Fix7PoliticalInteractionScenario();
    const initialWorld = createInitialWorldState(scenario, 51314);
    const world: WorldState = {
      ...initialWorld,
      factions: {
        ...initialWorld.factions,
        [TARGET_FACTION_ID]: {
          ...initialWorld.factions[TARGET_FACTION_ID]!,
          grievance: 0.8,
          organization: 0.8,
        },
      },
    };
    const proposal = chooseFactionActionProposal(
      world,
      TARGET_FACTION_ID,
      1,
      scenario,
    );

    expect(proposal.actionType).toBe("FUND_MOVEMENT");
    expect(proposal.schemaVersion).toBe(1);
    expect(proposal.payload).toEqual({ factionId: TARGET_FACTION_ID });

    const action = acceptFactionActionProposal(proposal, 1, 0);
    const result = runSimulationStep(
      world,
      { actions: [action] },
      {},
      scenario,
    );
    expect(result.nextWorld.factionFundMovementCommitments).toEqual({});
  });

  it("chooses the authored target and amount and creates one commitment", () => {
    const { scenario, world } = initialTargetedWorld();
    const faction = world.factions[TARGET_FACTION_ID]!;
    const proposal = chooseFactionActionProposal(
      world,
      TARGET_FACTION_ID,
      1,
      scenario,
    );
    const action = acceptFactionActionProposal(proposal, 1, 0);
    const result = applyTargeted(scenario, world, action);
    const baseline = runSimulationStep(world, { actions: [] }, {}, scenario);
    const commitments = deriveActiveFactionFundMovementCommitments(
      result.nextWorld,
      TARGET_FACTION_ID,
    );
    const commitment = commitments[0];

    expect(proposal.schemaVersion).toBe(
      TARGETED_FUND_MOVEMENT_ACTION_SCHEMA_VERSION,
    );
    expect(proposal.payload).toEqual({
      factionId: TARGET_FACTION_ID,
      targetRegionId: scenario.initialRegions[0]!.id,
      resourceAmount: 0.25,
    });
    expect(commitments).toHaveLength(1);
    expect(commitment).toMatchObject({
      id: createDeterministicFactionFundMovementCommitmentId(action.id),
      sourceActionId: action.id,
      factionId: TARGET_FACTION_ID,
      targetRegionId: scenario.initialRegions[0]!.id,
      resourceAmount: 0.25,
      createdAtTick: 1,
      status: "active",
    });
    expect(
      result.emittedEvents.filter(
        (event) => event.type === "FACTION_FUND_MOVEMENT_COMMITTED",
      ),
    ).toHaveLength(1);
    expect(result.nextWorld.factions[TARGET_FACTION_ID]!.resources).toBe(
      faction.resources,
    );
    expect(result.nextWorld.factions[TARGET_FACTION_ID]!.organization).toBe(
      faction.organization,
    );
    expect(result.nextWorld.factions[TARGET_FACTION_ID]!.grievance).toBe(
      faction.grievance,
    );
    expect(result.nextWorld.factions[TARGET_FACTION_ID]!.influence).toBe(
      faction.influence,
    );
    expect(result.nextWorld.countries).toEqual(baseline.nextWorld.countries);
    expect(result.nextWorld.regions).toEqual(baseline.nextWorld.regions);
    expect(result.nextWorld.conflicts).toEqual(baseline.nextWorld.conflicts);
    expect(result.nextWorld.landHexStates).toEqual(
      baseline.nextWorld.landHexStates,
    );
    expect(result.nextWorld.interventionCommitments).toEqual(
      baseline.nextWorld.interventionCommitments,
    );
  });

  it("requires exact profile provenance and rejects a target or amount mismatch", () => {
    const { scenario, world } = initialTargetedWorld();
    const wrongTarget = scenario.initialRegions[1]!.id;
    const wrongTargetResult = applyTargeted(
      scenario,
      world,
      targetedAction(scenario, TARGET_FACTION_ID, 0, 1, wrongTarget),
    );
    const wrongAmountResult = applyTargeted(
      scenario,
      world,
      targetedAction(
        scenario,
        TARGET_FACTION_ID,
        0,
        1,
        scenario.initialRegions[0]!.id,
        0.3,
      ),
    );
    const missingTargetResult = applyTargeted(
      scenario,
      world,
      targetedAction(
        scenario,
        TARGET_FACTION_ID,
        0,
        1,
        asRegionId("missing.region"),
      ),
    );

    expect(wrongTargetResult.nextWorld.factionFundMovementCommitments).toEqual(
      {},
    );
    expect(wrongAmountResult.nextWorld.factionFundMovementCommitments).toEqual(
      {},
    );
    expect(
      missingTargetResult.nextWorld.factionFundMovementCommitments,
    ).toEqual({});
  });

  it("rejects missing and extra targeted payload fields instead of inferring them", () => {
    const { scenario, world } = initialTargetedWorld();
    const malformedPayloads: readonly JsonValue[] = [
      { factionId: TARGET_FACTION_ID },
      {
        factionId: TARGET_FACTION_ID,
        targetRegionId: scenario.initialRegions[0]!.id,
        resourceAmount: 0.25,
        inferred: "no",
      },
    ];

    for (const payload of malformedPayloads) {
      const action = acceptActionProposal(
        {
          tick: 1,
          source: "heuristic",
          actionType: "FUND_MOVEMENT",
          payload,
          schemaVersion: TARGETED_FUND_MOVEMENT_ACTION_SCHEMA_VERSION,
        },
        0,
      );
      const result = applyTargeted(scenario, world, action);
      expect(result.nextWorld.factionFundMovementCommitments).toEqual({});
    }
  });

  it("blocks insufficient current resources without mutating stock or creating a negative projection", () => {
    const { scenario, world } = initialTargetedWorld();
    const poorWorld: WorldState = {
      ...world,
      factions: {
        ...world.factions,
        [TARGET_FACTION_ID]: {
          ...world.factions[TARGET_FACTION_ID]!,
          resources: 0.1,
        },
      },
    };
    const result = applyTargeted(scenario, poorWorld);

    expect(result.nextWorld.factions[TARGET_FACTION_ID]!.resources).toBe(0.1);
    expect(
      deriveFactionAvailableResources(result.nextWorld, TARGET_FACTION_ID),
    ).toBe(0.1);
    expect(result.nextWorld.factionFundMovementCommitments).toEqual({});
  });

  it("uses active earmarks for chooser feasibility while keeping priority order", () => {
    const { scenario, world } = initialTargetedWorld();
    const first = applyTargeted(scenario, world);
    const activeObservation = chooseFactionActionProposal(
      first.nextWorld,
      TARGET_FACTION_ID,
      2,
      scenario,
    );
    const poorWorld: WorldState = {
      ...world,
      factions: {
        ...world.factions,
        [TARGET_FACTION_ID]: {
          ...world.factions[TARGET_FACTION_ID]!,
          resources: 0.1,
        },
      },
    };
    const poorObservation = chooseFactionActionProposal(
      poorWorld,
      TARGET_FACTION_ID,
      1,
      scenario,
    );
    const activeAvailability = deriveFactionObservation(
      first.nextWorld,
      TARGET_FACTION_ID,
      scenario,
    );
    const poorAvailability = deriveFactionObservation(
      poorWorld,
      TARGET_FACTION_ID,
      scenario,
    );

    expect(
      hasActiveFactionFundMovementCommitment(
        first.nextWorld,
        TARGET_FACTION_ID,
        scenario.initialRegions[0]!.id,
      ),
    ).toBe(true);
    expect(activeObservation.actionType).not.toBe("FUND_MOVEMENT");
    expect(poorObservation.actionType).not.toBe("FUND_MOVEMENT");
    expect(activeAvailability.availableActions.FUND_MOVEMENT).toBe(false);
    expect(poorAvailability.availableActions.FUND_MOVEMENT).toBe(false);
  });

  it("rejects a second same-actor/same-target commitment and emits no second success event", () => {
    const { scenario, world } = initialTargetedWorld();
    const first = applyTargeted(scenario, world);
    const secondAction = targetedAction(
      scenario,
      TARGET_FACTION_ID,
      first.nextWorld.run.nextActionSequence,
      first.nextWorld.tick + 1,
    );
    const second = applyTargeted(scenario, first.nextWorld, secondAction);

    expect(
      deriveActiveFactionFundMovementCommitments(
        second.nextWorld,
        TARGET_FACTION_ID,
      ),
    ).toHaveLength(1);
    expect(
      second.emittedEvents.filter(
        (event) => event.type === "FACTION_FUND_MOVEMENT_COMMITTED",
      ),
    ).toHaveLength(0);
  });

  it("exposes the exact target and amount through Agenda evidence without changing severity", () => {
    const { scenario, world } = initialTargetedWorld();
    const first = applyTargeted(scenario, world);
    const withCommitment = detectFactionPressureAgendas({
      scenario,
      world: first.nextWorld,
      recentEvents: first.emittedEvents,
    }).find((agenda) => agenda.involvedFactionIds[0] === TARGET_FACTION_ID);
    const withoutCommitment = detectFactionPressureAgendas({
      scenario,
      world: { ...first.nextWorld, factionFundMovementCommitments: {} },
      recentEvents: [],
    }).find((agenda) => agenda.involvedFactionIds[0] === TARGET_FACTION_ID);

    expect(withCommitment).toBeDefined();
    expect(withCommitment?.affectedRegionIds).toContain(
      scenario.initialRegions[0]!.id,
    );
    expect(withCommitment?.keyCauses).toContainEqual(
      expect.objectContaining({ value: 0.25, unit: "currency" }),
    );
    expect(withCommitment?.severity).toBe(withoutCommitment?.severity);
  });

  it("round-trips V8 commitment state, replay, and deterministic insertion order while rejecting V6", () => {
    const { scenario, world } = initialTargetedWorld();
    const secondFaction = POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion;
    const actions = [
      targetedAction(scenario, TARGET_FACTION_ID, 0, 1),
      targetedAction(
        scenario,
        secondFaction as typeof TARGET_FACTION_ID,
        1,
        1,
        scenario.initialRegions[1]!.id,
        0.3,
      ),
    ];
    const step = runSimulationStep(world, { actions }, {}, scenario);
    const record = commitSimulationStep(
      scenario,
      {
        world,
        eventStore: createEventStore(),
      },
      step,
    );
    const snapshot = serializeSimulationSnapshot(scenario, record);
    const reversed = JSON.parse(JSON.stringify(snapshot)) as {
      formatVersion: number;
      world: {
        factionFundMovementCommitments: Record<string, unknown>;
      };
    };
    reversed.world.factionFundMovementCommitments = Object.fromEntries(
      Object.entries(reversed.world.factionFundMovementCommitments).reverse(),
    );
    const loaded = deserializeSimulationSnapshot(scenario, reversed);

    expect(snapshot.formatVersion).toBe(8);
    expect(serializeSimulationSnapshot(scenario, loaded)).toEqual(snapshot);
    expect(() =>
      deserializeSimulationSnapshot(scenario, {
        ...snapshot,
        formatVersion: 6,
      }),
    ).toThrow("Unsupported simulation snapshot version 6");

    const next = runSimulationStep(loaded.world, { actions: [] }, {}, scenario);
    const nextRecord = commitSimulationStep(scenario, loaded, next);
    const continuousNext = runSimulationStep(
      record.world,
      { actions: [] },
      {},
      scenario,
    );
    const continuousNextRecord = commitSimulationStep(
      scenario,
      record,
      continuousNext,
    );
    expect(serializeSimulationSnapshot(scenario, nextRecord)).toEqual(
      serializeSimulationSnapshot(scenario, continuousNextRecord),
    );
  });
});
