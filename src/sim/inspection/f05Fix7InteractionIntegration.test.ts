import { describe, expect, it } from "vitest";

import {
  acceptActionProposal,
  createRespondPoliticalProposalActionProposal,
  type ValidatedActionRecord,
} from "../state/action";
import { commitSimulationStep } from "../core/persistence";
import { runSimulationStep } from "../core/tick";
import { createInterventionPhaseHooks } from "../systems/interventionHooks";
import {
  createF03StartingRecord,
  runF03StrategyFromRecord,
} from "./f03InterventionCounterfactuals";
import {
  F05_FIX7_RESPONSE_MODES,
  runF05Fix7InteractionIntegration,
} from "./f05Fix7InteractionIntegration";
import { createF05Fix7PoliticalInteractionScenario } from "../state/politicalInteractionFixture";
import { POLITICAL_CRISIS_FIXTURE_FACTION_IDS } from "../state/politicalCrisisFixture";
import { F04D_VALIDATION_INTERVENTION_IDS } from "../state/gate1fValidationFixture";

function acceptedLobby(
  record: ReturnType<typeof createF03StartingRecord>,
): ValidatedActionRecord {
  return acceptActionProposal(
    {
      tick: record.world.tick + 1,
      source: "heuristic",
      actionType: "LOBBY",
      payload: { factionId: POLITICAL_CRISIS_FIXTURE_FACTION_IDS.coup },
      schemaVersion: 1,
    },
    record.world.run.nextActionSequence,
  );
}

describe("F05_FIX7 political interaction integration", () => {
  it("covers the historical 36 branches plus the 108 proposal branches and diagnoses churn", () => {
    const result = runF05Fix7InteractionIntegration();

    expect(F05_FIX7_RESPONSE_MODES).toEqual([
      "NO_TEMPLATE",
      "PROPOSAL_IGNORE",
      "PROPOSAL_REJECT",
      "PROPOSAL_ACCEPT_IF_FEASIBLE",
    ]);
    expect(result.historicalF05BranchCount).toBe(36);
    expect(result.proposalBranchCount).toBe(108);
    expect(result.branches).toHaveLength(144);
    expect(result.historicalF05BaselineRegression).toBe(true);
    expect(result.v1TriggerContract).toBe("CLOSED");
    expect(result.reopenChurn).toBe("PRESENT");
    expect(result.responseDominance).toBe("MIXED");
    expect(result.primaryClassification).toBe(
      "PROPOSAL_RESPONSE_DOMINANCE_OR_CHURN",
    );
    expect(result.gate1fRecommendation).toBe("NOT_READY");
    expect(result.v02).toBe("NOT_STARTED");
    expect(result.pass).toBe(true);

    const acceptBranches = result.branches.filter(
      (branch) => branch.mode === "PROPOSAL_ACCEPT_IF_FEASIBLE",
    );
    expect(
      acceptBranches.reduce(
        (total, branch) => total + branch.proposalResponseNotFeasibleCount,
        0,
      ),
    ).toBe(0);
  }, 180_000);

  it("orders same-tick strategy and proposal response records deterministically", () => {
    const scenario = createF05Fix7PoliticalInteractionScenario();
    const initial = createF03StartingRecord(scenario, 40103, 0);
    const opened = commitSimulationStep(
      scenario,
      initial,
      runSimulationStep(
        initial.world,
        { actions: [acceptedLobby(initial)] },
        createInterventionPhaseHooks(scenario),
        scenario,
      ),
    );
    const proposal = Object.values(opened.world.politicalProposals ?? {})[0];
    if (proposal === undefined) throw new Error("Expected an open proposal.");

    const result = runF03StrategyFromRecord(
      scenario,
      "F05_FIX7_ORDER",
      "MATERIAL_RELIEF",
      opened,
      1,
      () => F04D_VALIDATION_INTERVENTION_IDS.materialRelief,
      {
        factionActorLoop: "off",
        additionalActionPolicy: ({ world }) => [
          createRespondPoliticalProposalActionProposal(
            world.tick + 1,
            proposal.id,
            "reject",
          ),
        ],
      },
    );
    const sameTick = result.finalRecord.world.run.actionLog.filter(
      (action) => action.tick === opened.world.tick + 1,
    );

    expect(sameTick.map((action) => action.actionType)).toEqual([
      "START_INTERVENTION",
      "RESPOND_POLITICAL_PROPOSAL",
    ]);
    expect(sameTick.map((action) => action.sequence)).toEqual([
      sameTick[0]!.sequence,
      sameTick[0]!.sequence + 1,
    ]);
  });
});
