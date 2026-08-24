import {
  acceptActionProposal,
  createRespondPoliticalProposalActionProposal,
  type ValidatedActionRecord,
} from "../state/action";
import {
  commitSimulationStep,
  deserializeSimulationSnapshot,
  serializeSimulationSnapshot,
} from "../core/persistence";
import { runSimulationStep } from "../core/tick";
import { createEventStore } from "../events/eventStore";
import { asGovernmentId, type PoliticalProposalId } from "../state/ids";
import { createF05Fix6PoliticalInteractionScenario } from "../state/politicalInteractionFixture";
import { POLITICAL_CRISIS_FIXTURE_FACTION_IDS } from "../state/politicalCrisisFixture";
import type { ScenarioDefinition } from "../state/scenario";
import type { RunRecord } from "../core/step";
import { createInitialWorldState } from "../state/world";
import { createInterventionPhaseHooks } from "../systems/interventionHooks";

export interface F05Fix8ProposalLifecycleInspectionResult {
  readonly unchangedBasisNoReopen: boolean;
  readonly governmentChangeReopens: boolean;
  readonly feasibilityChangeReopens: boolean;
  readonly unrelatedScalarDriftNoReopen: boolean;
  readonly ignoreOneOpenMaximum: boolean;
  readonly acceptProvenanceUnchanged: boolean;
  readonly insertionOrderDeterministic: boolean;
  readonly saveLoadPreservesBasis: boolean;
  readonly v3Rejected: boolean;
  readonly pass: boolean;
  readonly output: string;
}

function createRecord(scenario: ScenarioDefinition): RunRecord {
  return {
    world: createInitialWorldState(scenario, 56008),
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

function lobby(record: RunRecord): ValidatedActionRecord {
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

function response(
  record: RunRecord,
  proposalId: PoliticalProposalId,
  responseValue: "accept" | "reject",
): ValidatedActionRecord {
  return acceptActionProposal(
    createRespondPoliticalProposalActionProposal(
      record.world.tick + 1,
      proposalId,
      responseValue,
    ),
    record.world.run.nextActionSequence,
  );
}

function openProposal(scenario: ScenarioDefinition): {
  readonly record: RunRecord;
  readonly proposalId: PoliticalProposalId;
} {
  const initial = createRecord(scenario);
  const opened = step(scenario, initial, [lobby(initial)]);
  const proposal = Object.values(opened.world.politicalProposals ?? {})[0];
  if (proposal === undefined)
    throw new Error("Lifecycle fixture did not open.");
  return { record: opened, proposalId: proposal.id };
}

function rejectedRecord(
  scenario: ScenarioDefinition,
  opened: {
    readonly record: RunRecord;
    readonly proposalId: PoliticalProposalId;
  },
): RunRecord {
  return step(scenario, opened.record, [
    response(opened.record, opened.proposalId, "reject"),
  ]);
}

export function runF05Fix8ProposalLifecycleInspection(): F05Fix8ProposalLifecycleInspectionResult {
  const scenario = createF05Fix6PoliticalInteractionScenario();
  const opened = openProposal(scenario);
  const rejected = rejectedRecord(scenario, opened);
  const countryId = scenario.playerCountryId!;

  const unchanged = step(scenario, rejected, [lobby(rejected)]);
  const unchangedBasisNoReopen =
    Object.values(unchanged.world.politicalProposals ?? {}).length === 1;

  const oldGovernmentId =
    rejected.world.countries[countryId]!.currentGovernmentId!;
  const replacementGovernmentId = asGovernmentId(
    "f05.fix8.inspection-government",
  );
  const governmentChanged: RunRecord = {
    ...rejected,
    world: {
      ...rejected.world,
      governments: {
        ...rejected.world.governments,
        [oldGovernmentId]: {
          ...rejected.world.governments[oldGovernmentId]!,
          authority: "contender",
        },
        [replacementGovernmentId]: {
          id: replacementGovernmentId,
          countryId,
          name: "F05_FIX8 inspection Government",
          authority: "central",
          formedAtTick: rejected.world.tick,
        },
      },
      countries: {
        ...rejected.world.countries,
        [countryId]: {
          ...rejected.world.countries[countryId]!,
          currentGovernmentId: replacementGovernmentId,
        },
      },
    },
  };
  const governmentReopened = step(scenario, governmentChanged, [
    lobby(governmentChanged),
  ]);
  const governmentChangeReopens =
    Object.values(governmentReopened.world.politicalProposals ?? {}).length ===
      2 &&
    Object.values(governmentReopened.world.politicalProposals ?? {}).some(
      (proposal) =>
        proposal.status === "open" &&
        proposal.targetGovernmentId === replacementGovernmentId,
    );

  const poorRecord: RunRecord = {
    ...opened.record,
    world: {
      ...opened.record.world,
      countries: {
        ...opened.record.world.countries,
        [countryId]: {
          ...opened.record.world.countries[countryId]!,
          treasury: 0,
        },
      },
    },
  };
  const poorRejected = step(scenario, poorRecord, [
    response(poorRecord, opened.proposalId, "reject"),
  ]);
  const recovered: RunRecord = {
    ...poorRejected,
    world: {
      ...poorRejected.world,
      countries: {
        ...poorRejected.world.countries,
        [countryId]: {
          ...poorRejected.world.countries[countryId]!,
          treasury: 500,
        },
      },
    },
  };
  const feasibilityReopened = step(scenario, recovered, [lobby(recovered)]);
  const feasibilityChangeReopens =
    Object.values(feasibilityReopened.world.politicalProposals ?? {}).length ===
    2;

  const scalarDrift: RunRecord = {
    ...rejected,
    world: {
      ...rejected.world,
      countries: {
        ...rejected.world.countries,
        [countryId]: {
          ...rejected.world.countries[countryId]!,
          legitimacy: rejected.world.countries[countryId]!.legitimacy - 1,
        },
      },
    },
  };
  const scalarRepeated = step(scenario, scalarDrift, [lobby(scalarDrift)]);
  const unrelatedScalarDriftNoReopen =
    Object.values(scalarRepeated.world.politicalProposals ?? {}).length === 1;

  const ignored = step(scenario, opened.record);
  const ignoreOneOpenMaximum =
    Object.values(ignored.world.politicalProposals ?? {}).filter(
      (proposal) => proposal.status === "open",
    ).length === 1;

  const accepted = step(scenario, opened.record, [
    response(opened.record, opened.proposalId, "accept"),
  ]);
  const acceptedProposal =
    accepted.world.politicalProposals![opened.proposalId];
  const acceptedEvent = accepted.eventStore.events.find(
    (event) => event.type === "POLITICAL_PROPOSAL_ACCEPTED",
  );
  const acceptProvenanceUnchanged =
    acceptedProposal?.status === "accepted" &&
    acceptedProposal.resolutionReason === "accepted" &&
    Object.keys(accepted.world.interventionCommitments).length === 1 &&
    acceptedEvent !== undefined &&
    accepted.eventStore.events.some(
      (event) =>
        event.type === "INTERVENTION_STARTED" &&
        event.causeIds.includes(acceptedEvent.id),
    );

  const reordered: RunRecord = {
    ...opened.record,
    world: {
      ...opened.record.world,
      politicalProposals: Object.fromEntries(
        Object.entries(opened.record.world.politicalProposals ?? {}).reverse(),
      ),
    },
  };
  const normalNext = step(scenario, opened.record);
  const reorderedNext = step(scenario, reordered);
  const insertionOrderDeterministic =
    JSON.stringify(serializeSimulationSnapshot(scenario, normalNext)) ===
    JSON.stringify(serializeSimulationSnapshot(scenario, reorderedNext));

  const rejectedSnapshot = serializeSimulationSnapshot(scenario, rejected);
  const restored = deserializeSimulationSnapshot(scenario, rejectedSnapshot);
  const saveLoadPreservesBasis =
    JSON.stringify(restored.world.politicalProposals) ===
    JSON.stringify(rejected.world.politicalProposals);
  const v3Rejected = (() => {
    try {
      deserializeSimulationSnapshot(scenario, {
        ...rejectedSnapshot,
        formatVersion: 3,
      });
      return false;
    } catch {
      return true;
    }
  })();

  const checks = {
    unchangedBasisNoReopen,
    governmentChangeReopens,
    feasibilityChangeReopens,
    unrelatedScalarDriftNoReopen,
    ignoreOneOpenMaximum,
    acceptProvenanceUnchanged,
    insertionOrderDeterministic,
    saveLoadPreservesBasis,
    v3Rejected,
  };
  const pass = Object.values(checks).every(Boolean);
  const output = [
    "F05_FIX8 PROPOSAL LIFECYCLE COUNTERFACTUALS",
    ...Object.entries(checks).map(
      ([key, value]) => `${key}=${value ? "PASS" : "FAIL"}`,
    ),
    `RESULT=${pass ? "PASS" : "FAIL"}`,
  ].join("\n");
  return { ...checks, pass, output };
}

export function printF05Fix8ProposalLifecycleInspection(): void {
  console.log(runF05Fix8ProposalLifecycleInspection().output);
}
