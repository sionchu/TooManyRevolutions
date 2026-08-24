import { describe, expect, it } from "vitest";

import { cloneRunRecordViaSnapshot } from "../core/persistence";
import { runSimulationStep } from "../core/tick";
import {
  acceptActionProposal,
  createStartInterventionActionProposal,
  decodeFactionAction,
} from "../state/action";
import {
  createF04DValidationScenario,
  F04D_VALIDATION_INTERVENTION_IDS,
} from "../state/gate1fValidationFixture";
import {
  createF03StartingRecord,
  runF03StrategyFromRecord,
} from "./f03InterventionCounterfactuals";
import { intakeFactionHeuristicProposals } from "./factionActorLoop";

function stepToMonthlyProposal(
  initialWorld: Parameters<typeof runSimulationStep>[0],
) {
  let world = initialWorld;
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const result = runSimulationStep(world, { actions: [] });
    if (result.actionProposals.length > 0) {
      return result;
    }
    world = result.nextWorld;
  }
  throw new Error("Fixture did not emit a monthly faction proposal.");
}

describe("deterministic faction actor loop", () => {
  it("accepts a monthly proposal exactly once for the following tick", () => {
    const scenario = createF04DValidationScenario();
    const initial = createF03StartingRecord(scenario, 40103, 0);
    const first = stepToMonthlyProposal(initial.world);

    expect(first.actionProposals.length).toBeGreaterThan(0);
    expect(
      new Set(first.actionProposals.map((proposal) => proposal.tick)),
    ).toEqual(new Set([first.nextWorld.tick + 1]));

    const intake = intakeFactionHeuristicProposals(
      first.nextWorld,
      [...first.actionProposals, ...first.actionProposals],
      first.nextWorld.run.nextActionSequence,
    );
    expect(intake.acceptedActions).toHaveLength(first.actionProposals.length);
    expect(intake.droppedProposals).toHaveLength(first.actionProposals.length);
    expect(
      intake.droppedProposals.every(({ reason }) => reason === "DUPLICATE"),
    ).toBe(true);

    const second = runSimulationStep(first.nextWorld, {
      actions: intake.acceptedActions,
    });
    expect(second.nextWorld.run.actionLog).toEqual(intake.acceptedActions);
    expect(
      second.emittedEvents.filter(
        (event) => event.type === "FACTION_STRATEGY_CHANGED",
      ),
    ).toHaveLength(intake.acceptedActions.length);
  });

  it("uses canonical FactionId order independent of proposal insertion order", () => {
    const scenario = createF04DValidationScenario();
    const initial = createF03StartingRecord(scenario, 40103, 0);
    const first = stepToMonthlyProposal(initial.world);
    const intake = intakeFactionHeuristicProposals(
      first.nextWorld,
      [...first.actionProposals].reverse(),
      first.nextWorld.run.nextActionSequence,
    );

    const factionIds = intake.acceptedActions.map((action) => {
      const decoded = decodeFactionAction(action);
      if (decoded === null) throw new Error("Expected faction action.");
      return String(decoded.factionId);
    });
    expect(factionIds).toEqual([...factionIds].sort());
  });

  it("drops stale proposals without retargeting and avoids sequence collisions", () => {
    const scenario = createF04DValidationScenario();
    const initial = createF03StartingRecord(scenario, 40103, 0);
    const first = stepToMonthlyProposal(initial.world);
    const stale = first.actionProposals.map((proposal) => ({
      ...proposal,
      tick: proposal.tick - 1,
    }));
    const staleIntake = intakeFactionHeuristicProposals(
      first.nextWorld,
      stale,
      first.nextWorld.run.nextActionSequence,
    );
    expect(staleIntake.acceptedActions).toEqual([]);
    expect(staleIntake.droppedProposals).toHaveLength(stale.length);
    expect(
      staleIntake.droppedProposals.every(
        ({ reason }) => reason === "STALE_TICK",
      ),
    ).toBe(true);

    const playerCountryId = scenario.playerCountryId;
    if (playerCountryId === null) throw new Error("Player country is missing.");
    const player = acceptActionProposal(
      createStartInterventionActionProposal(
        first.nextWorld.tick + 1,
        "player",
        F04D_VALIDATION_INTERVENTION_IDS.materialRelief,
        playerCountryId,
      ),
      first.nextWorld.run.nextActionSequence,
    );
    const factionIntake = intakeFactionHeuristicProposals(
      first.nextWorld,
      first.actionProposals,
      first.nextWorld.run.nextActionSequence + 1,
    );
    expect(
      factionIntake.acceptedActions.map((action) => action.sequence),
    ).toEqual(
      factionIntake.acceptedActions.map(
        (_, index) => player.sequence + 1 + index,
      ),
    );
    expect(
      new Set([
        player.id,
        ...factionIntake.acceptedActions.map((action) => action.id),
      ]).size,
    ).toBe(factionIntake.acceptedActions.length + 1);
  });

  it("keeps the historical detached mode and exposes the authoritative actor path", () => {
    const scenario = createF04DValidationScenario();
    const startingRecord = createF03StartingRecord(scenario, 40103, 0);
    const policy = () => null;
    const detached = runF03StrategyFromRecord(
      scenario,
      "F05_OFF",
      "WAIT",
      startingRecord,
      1,
      policy,
      { factionActorLoop: "off", checkpointOffsets: [0, 360] },
    );
    const connected = runF03StrategyFromRecord(
      scenario,
      "F05_ON",
      "WAIT",
      startingRecord,
      1,
      policy,
      { factionActorLoop: "on", checkpointOffsets: [0, 360] },
    );

    expect(detached.factionProposalsGenerated).toBeGreaterThan(0);
    expect(detached.factionProposalsAccepted).toBe(0);
    expect(detached.factionStrategyChanges).toBe(0);
    expect(connected.factionProposalsAccepted).toBeGreaterThan(0);
    expect(connected.factionStrategyChanges).toBeGreaterThan(0);
    expect(
      connected.finalRecord.world.run.actionLog.every(
        (action) => action.source === "heuristic",
      ),
    ).toBe(true);
  }, 30_000);

  it("preserves action-log determinism through snapshot load and replay", () => {
    const scenario = createF04DValidationScenario();
    const startingRecord = createF03StartingRecord(scenario, 40103, 0);
    const first = runF03StrategyFromRecord(
      scenario,
      "F05_REPLAY",
      "WAIT",
      startingRecord,
      1,
      () => null,
      { factionActorLoop: "on", checkpointOffsets: [0, 360] },
    );
    const loaded = cloneRunRecordViaSnapshot(scenario, first.finalRecord);
    const replay = runF03StrategyFromRecord(
      scenario,
      "F05_REPLAY",
      "WAIT",
      loaded,
      1,
      () => null,
      { factionActorLoop: "on", checkpointOffsets: [0, 360] },
    );
    const direct = runF03StrategyFromRecord(
      scenario,
      "F05_REPLAY",
      "WAIT",
      first.finalRecord,
      1,
      () => null,
      { factionActorLoop: "on", checkpointOffsets: [0, 360] },
    );

    expect(loaded.world.run.actionLog).toEqual(
      first.finalRecord.world.run.actionLog,
    );
    expect(replay.finalRecord.world.run.actionLog).toEqual(
      direct.finalRecord.world.run.actionLog,
    );
    expect(replay.finalRecord.world).toEqual(direct.finalRecord.world);
  }, 30_000);
});
