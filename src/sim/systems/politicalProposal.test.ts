import { describe, expect, it } from "vitest";

import {
  acceptActionProposal,
  createRespondPoliticalProposalActionProposal,
  type ValidatedActionRecord,
} from "../state/action";
import {
  cloneRunRecordViaSnapshot,
  commitSimulationStep,
  serializeSimulationSnapshot,
} from "../core/persistence";
import { runSimulationStep } from "../core/tick";
import { createEventStore } from "../events/eventStore";
import { POLITICAL_CRISIS_FIXTURE_FACTION_IDS } from "../state/politicalCrisisFixture";
import { createF04DValidationScenario } from "../state/gate1fValidationFixture";
import { createF05Fix6PoliticalInteractionScenario } from "../state/politicalInteractionFixture";
import { asGovernmentId, type PoliticalProposalId } from "../state/ids";
import type { ScenarioDefinition } from "../state/scenario";
import type { RunRecord } from "../core/step";
import { createInitialWorldState, type WorldState } from "../state/world";
import { createInterventionPhaseHooks } from "./interventionHooks";

const FACTION_ID = POLITICAL_CRISIS_FIXTURE_FACTION_IDS.coup;
const AFFECTED_FACTION_ID = POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion;

function createRecord(scenario: ScenarioDefinition): RunRecord {
  return {
    world: createInitialWorldState(scenario, 56006),
    eventStore: createEventStore(),
  };
}

function step(
  scenario: ScenarioDefinition,
  record: RunRecord,
  actions: readonly ValidatedActionRecord[] = [],
): RunRecord {
  return commitSimulationStep(
    scenario,
    record,
    runSimulationStep(
      record.world,
      { actions },
      createInterventionPhaseHooks(scenario),
      scenario,
    ),
  );
}

function acceptedLobby(
  record: RunRecord,
  source: "heuristic" | "player" = "heuristic",
): ValidatedActionRecord {
  return acceptActionProposal(
    {
      tick: record.world.tick + 1,
      source,
      actionType: "LOBBY",
      payload: { factionId: FACTION_ID },
      schemaVersion: 1,
    },
    record.world.run.nextActionSequence,
  );
}

function openProposal(scenario: ScenarioDefinition): {
  readonly record: RunRecord;
  readonly proposalId: PoliticalProposalId;
} {
  const initial = createRecord(scenario);
  const opened = step(scenario, initial, [acceptedLobby(initial)]);
  const proposals = Object.values(opened.world.politicalProposals ?? {});
  expect(proposals).toHaveLength(1);
  return { record: opened, proposalId: proposals[0]!.id };
}

function acceptedResponse(
  record: RunRecord,
  proposalId: PoliticalProposalId,
  response: "accept" | "reject",
): ValidatedActionRecord {
  return acceptActionProposal(
    createRespondPoliticalProposalActionProposal(
      record.world.tick + 1,
      proposalId,
      response,
    ),
    record.world.run.nextActionSequence,
  );
}

function eventTypes(record: RunRecord): readonly string[] {
  return record.eventStore.events.map((event) => event.type);
}

describe("F05_FIX6 political interaction kernel", () => {
  it("keeps an accepted LOBBY strategy-only when no template is authored", () => {
    const scenario = createF04DValidationScenario();
    const initial = createRecord(scenario);
    const result = step(scenario, initial, [acceptedLobby(initial)]);

    expect(result.world.politicalProposals).toEqual({});
    expect(result.world.factions[FACTION_ID]?.currentStrategy).toBe("lobby");
    expect(eventTypes(result)).not.toContain("POLITICAL_PROPOSAL_OPENED");
  });

  it("opens one deterministic proposal against the current Government", () => {
    const scenario = createF05Fix6PoliticalInteractionScenario();
    const initial = createRecord(scenario);
    const lobby = acceptedLobby(initial);
    const result = step(scenario, initial, [lobby]);
    const proposal = Object.values(result.world.politicalProposals ?? {})[0];
    const country = result.world.countries[scenario.playerCountryId!];

    expect(proposal).toMatchObject({
      status: "open",
      proposerFactionId: FACTION_ID,
      countryId: country!.id,
      targetGovernmentId: country!.currentGovernmentId,
      subjectKind: "interventionRequest",
      interventionId: "gate1f.f04d.coercive-restriction",
      createdAtTick: 1,
      openingActionId: lobby.id,
    });
    expect(proposal?.openingEventId).toBe(
      result.eventStore.events.find(
        (event) => event.type === "POLITICAL_PROPOSAL_OPENED",
      )?.id,
    );
    expect(result.world.interventionCommitments).toEqual({});
  });

  it("does not duplicate an open proposal on repeated LOBBY intake", () => {
    const scenario = createF05Fix6PoliticalInteractionScenario();
    const { record } = openProposal(scenario);
    const repeated = step(scenario, record, [acceptedLobby(record)]);

    expect(Object.values(repeated.world.politicalProposals ?? {})).toHaveLength(
      1,
    );
    expect(
      repeated.eventStore.events.filter(
        (event) => event.type === "POLITICAL_PROPOSAL_OPENED",
      ),
    ).toHaveLength(1);
  });

  it("keeps IGNORE open and REJECT at status quo", () => {
    const scenario = createF05Fix6PoliticalInteractionScenario();
    const opened = openProposal(scenario);
    const ignored = step(scenario, opened.record);
    const rejected = step(scenario, opened.record, [
      acceptedResponse(opened.record, opened.proposalId, "reject"),
    ]);
    const ignoredProposal =
      ignored.world.politicalProposals![opened.proposalId];
    const rejectedProposal =
      rejected.world.politicalProposals![opened.proposalId];

    expect(ignoredProposal?.status).toBe("open");
    expect(ignored.world.interventionCommitments).toEqual({});
    expect(rejectedProposal).toMatchObject({
      status: "rejected",
      resolutionReason: "explicitReject",
    });
    expect(rejected.world.interventionCommitments).toEqual({});
    expect(eventTypes(rejected)).not.toContain("INTERVENTION_STARTED");
  });

  it("routes ACCEPT through the existing intervention commitment and effects", () => {
    const scenario = createF05Fix6PoliticalInteractionScenario();
    const opened = openProposal(scenario);
    const accepted = step(scenario, opened.record, [
      acceptedResponse(opened.record, opened.proposalId, "accept"),
    ]);
    const proposal = accepted.world.politicalProposals![opened.proposalId];
    const acceptedEvent = accepted.eventStore.events.find(
      (event) => event.type === "POLITICAL_PROPOSAL_ACCEPTED",
    );
    const startedEvent = accepted.eventStore.events.find(
      (event) => event.type === "INTERVENTION_STARTED",
    );

    expect(proposal).toMatchObject({
      status: "accepted",
      resolutionReason: "accepted",
      resolvedAtTick: accepted.world.tick,
    });
    expect(Object.keys(accepted.world.interventionCommitments)).toHaveLength(1);
    expect(acceptedEvent).toBeDefined();
    expect(startedEvent?.causeIds).toEqual([acceptedEvent!.id]);
    expect(startedEvent?.payload).toMatchObject({
      interventionId: proposal!.interventionId,
      actionId: proposal!.responseActionId,
    });

    let completed = accepted;
    while (
      completed.world.interventionCommitments !== undefined &&
      Object.keys(completed.world.interventionCommitments).length > 0
    ) {
      completed = step(scenario, completed);
    }
    const rules =
      completed.world.policies[scenario.playerCountryId!]?.institutionalRules;
    const faction = completed.world.factions[AFFECTED_FACTION_ID]!;
    expect(rules?.pressFreedom).toBe("censored");
    expect(rules?.politicalCompetition).toBe("banned");
    expect(faction.organization).toBeLessThan(
      accepted.world.factions[AFFECTED_FACTION_ID]!.organization,
    );
    expect(faction.grievance).toBeGreaterThan(
      accepted.world.factions[AFFECTED_FACTION_ID]!.grievance,
    );
    expect(completed.world.countries[scenario.playerCountryId!]?.id).toBe(
      scenario.playerCountryId,
    );
  });

  it("leaves an infeasible ACCEPT open without intervention effects", () => {
    const scenario = createF05Fix6PoliticalInteractionScenario();
    const opened = openProposal(scenario);
    const countryId = scenario.playerCountryId!;
    const poorWorld: WorldState = {
      ...opened.record.world,
      countries: {
        ...opened.record.world.countries,
        [countryId]: {
          ...opened.record.world.countries[countryId]!,
          treasury: 0,
        },
      },
    };
    const poorRecord = { ...opened.record, world: poorWorld };
    const result = step(scenario, poorRecord, [
      acceptedResponse(poorRecord, opened.proposalId, "accept"),
    ]);
    const proposal = result.world.politicalProposals![opened.proposalId];

    expect(proposal?.status).toBe("open");
    expect(result.world.interventionCommitments).toEqual({});
    expect(eventTypes(result)).toContain(
      "POLITICAL_PROPOSAL_RESPONSE_REJECTED",
    );
    expect(eventTypes(result)).not.toContain("POLITICAL_PROPOSAL_ACCEPTED");
  });

  it("does not retarget a stale Government", () => {
    const scenario = createF05Fix6PoliticalInteractionScenario();
    const opened = openProposal(scenario);
    const countryId = scenario.playerCountryId!;
    const oldGovernmentId =
      opened.record.world.countries[countryId]!.currentGovernmentId!;
    const replacementGovernmentId = asGovernmentId(
      "f05.fix6.replacement-government",
    );
    const staleWorld: WorldState = {
      ...opened.record.world,
      governments: {
        ...opened.record.world.governments,
        [oldGovernmentId]: {
          ...opened.record.world.governments[oldGovernmentId]!,
          authority: "contender",
        },
        [replacementGovernmentId]: {
          id: replacementGovernmentId,
          countryId,
          name: "대체 정부 fixture",
          authority: "central",
          formedAtTick: opened.record.world.tick,
        },
      },
      countries: {
        ...opened.record.world.countries,
        [countryId]: {
          ...opened.record.world.countries[countryId]!,
          currentGovernmentId: replacementGovernmentId,
        },
      },
    };
    const staleRecord = { ...opened.record, world: staleWorld };
    const result = step(scenario, staleRecord, [
      acceptedResponse(staleRecord, opened.proposalId, "accept"),
    ]);
    const proposal = result.world.politicalProposals![opened.proposalId];

    expect(proposal).toMatchObject({
      status: "rejected",
      resolutionReason: "staleTargetGovernment",
      targetGovernmentId: oldGovernmentId,
    });
    expect(result.world.interventionCommitments).toEqual({});
    expect(result.world.countries[countryId]?.currentGovernmentId).toBe(
      replacementGovernmentId,
    );
  });

  it("round-trips open, rejected, and accepted proposal state", () => {
    const scenario = createF05Fix6PoliticalInteractionScenario();
    const opened = openProposal(scenario);
    const rejected = step(scenario, opened.record, [
      acceptedResponse(opened.record, opened.proposalId, "reject"),
    ]);
    const accepted = step(scenario, opened.record, [
      acceptedResponse(opened.record, opened.proposalId, "accept"),
    ]);

    for (const record of [opened.record, rejected, accepted]) {
      const restored = cloneRunRecordViaSnapshot(scenario, record);
      expect(
        JSON.stringify(serializeSimulationSnapshot(scenario, restored)),
      ).toBe(JSON.stringify(serializeSimulationSnapshot(scenario, record)));
      expect(restored.world.politicalProposals).toEqual(
        record.world.politicalProposals,
      );
    }
  });

  it("keeps proposal object insertion order out of the next state", () => {
    const scenario = createF05Fix6PoliticalInteractionScenario();
    const opened = openProposal(scenario);
    const proposals = Object.entries(
      opened.record.world.politicalProposals ?? {},
    );
    const reordered: RunRecord = {
      ...opened.record,
      world: {
        ...opened.record.world,
        politicalProposals: Object.fromEntries(proposals.reverse()),
      },
    };
    const normalNext = step(scenario, opened.record);
    const reorderedNext = step(scenario, reordered);
    expect(serializeSimulationSnapshot(scenario, reorderedNext)).toEqual(
      serializeSimulationSnapshot(scenario, normalNext),
    );
  });

  it("resolves same-tick responses in accepted ActionRecord sequence order", () => {
    const scenario = createF05Fix6PoliticalInteractionScenario();
    const opened = openProposal(scenario);
    const accept = acceptedResponse(opened.record, opened.proposalId, "accept");
    const reject = acceptActionProposal(
      createRespondPoliticalProposalActionProposal(
        opened.record.world.tick + 1,
        opened.proposalId,
        "reject",
      ),
      accept.sequence + 1,
    );
    const rejectFirstAction = acceptedResponse(
      opened.record,
      opened.proposalId,
      "reject",
    );
    const acceptAfterReject = acceptActionProposal(
      createRespondPoliticalProposalActionProposal(
        opened.record.world.tick + 1,
        opened.proposalId,
        "accept",
      ),
      rejectFirstAction.sequence + 1,
    );

    const acceptFirst = step(scenario, opened.record, [accept, reject]);
    const rejectFirst = step(scenario, opened.record, [
      rejectFirstAction,
      acceptAfterReject,
    ]);

    expect(
      acceptFirst.world.politicalProposals![opened.proposalId]?.status,
    ).toBe("accepted");
    expect(Object.keys(acceptFirst.world.interventionCommitments)).toHaveLength(
      1,
    );
    expect(
      rejectFirst.world.politicalProposals![opened.proposalId]?.status,
    ).toBe("rejected");
    expect(rejectFirst.world.interventionCommitments).toEqual({});
  });
});
