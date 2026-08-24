import type { GameEvent, GameEventType } from "../events/event";
import {
  acceptActionProposal,
  createRespondPoliticalProposalActionProposal,
  type ValidatedActionRecord,
} from "../state/action";
import {
  cloneRunRecordViaSnapshot,
  commitSimulationStep,
  serializeSimulationSnapshotJson,
} from "../core/persistence";
import { runSimulationStep } from "../core/tick";
import { createEventStore } from "../events/eventStore";
import type { RunRecord } from "../core/step";
import {
  deriveAdministrativeHeadroom,
  deriveCommittedAdministrativeLoad,
  evaluateInterventionFeasibility,
} from "../state/intervention";
import { F04D_VALIDATION_INTERVENTION_IDS } from "../state/gate1fValidationFixture";
import { POLITICAL_CRISIS_FIXTURE_FACTION_IDS } from "../state/politicalCrisisFixture";
import { createF05Fix6PoliticalInteractionScenario } from "../state/politicalInteractionFixture";
import type { CountryId, FactionId, PoliticalProposalId } from "../state/ids";
import type { ScenarioDefinition } from "../state/scenario";
import { createInitialWorldState, type WorldState } from "../state/world";
import { deriveNationalAgendas } from "../readModels/agenda";
import { deriveFactionObservation } from "../systems/factionPressure";
import { derivePoliticalCrisisPrerequisites } from "../systems/politicalCrisis";
import { createInterventionPhaseHooks } from "../systems/interventionHooks";

export const F05_FIX6_DEFAULT_SEED = 56006 as const;
export const F05_FIX6_HORIZON_DAYS = 8 as const;

const FACTION_ID = POLITICAL_CRISIS_FIXTURE_FACTION_IDS.coup;
const AFFECTED_FACTION_ID = POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion;
const REQUESTED_INTERVENTION_ID =
  F04D_VALIDATION_INTERVENTION_IDS.coerciveRestriction;

export const F05_FIX6_BRANCHES = [
  "NO_PROPOSAL",
  "PROPOSAL_IGNORE",
  "PROPOSAL_REJECT",
  "PROPOSAL_ACCEPT",
] as const;

export type F05Fix6Branch = (typeof F05_FIX6_BRANCHES)[number];

interface FactionStateSummary {
  readonly grievance: number;
  readonly organization: number;
  readonly resources: number;
}

interface CrisisEligibilitySummary {
  readonly coup: boolean;
  readonly rebellion: boolean;
}

interface ResponseFeasibilitySummary {
  readonly accept: boolean;
  readonly reject: boolean;
  readonly interventionReasons: readonly string[];
}

export interface F05Fix6BranchSummary {
  readonly branch: F05Fix6Branch;
  readonly scenarioId: string;
  readonly seed: number;
  readonly horizonDays: number;
  readonly proposalId: PoliticalProposalId | null;
  readonly proposalOpenedTick: number | null;
  readonly proposalResolvedTick: number | null;
  readonly proposalStatus: "open" | "accepted" | "rejected" | null;
  readonly targetGovernmentId: string | null;
  readonly countryId: CountryId;
  readonly countryIdPreserved: boolean;
  readonly currentGovernmentIdStart: string | null;
  readonly currentGovernmentIdFinal: string | null;
  readonly requestedInterventionId: string | null;
  readonly responseTick: number | null;
  readonly responseFeasibility: ResponseFeasibilitySummary | null;
  readonly interventionStartTick: number | null;
  readonly interventionCompletionTick: number | null;
  readonly treasuryStart: number;
  readonly treasuryAtResponse: number | null;
  readonly treasuryFinal: number;
  readonly administrativeLoadAtResponse: number | null;
  readonly administrativeHeadroomAtResponse: number | null;
  readonly administrativeLoadFinal: number;
  readonly administrativeHeadroomFinal: number;
  readonly institutionalRulesStart: Readonly<Record<string, string | boolean>>;
  readonly institutionalRulesFinal: Readonly<Record<string, string | boolean>>;
  readonly institutionalRuleChanges: readonly string[];
  readonly affectedFactionStart: FactionStateSummary;
  readonly affectedFactionFinal: FactionStateSummary;
  readonly agendaIdsStart: readonly string[];
  readonly agendaIdsFinal: readonly string[];
  readonly agendaChanged: boolean;
  readonly legalActionsStart: readonly string[];
  readonly legalActionsFinal: readonly string[];
  readonly legalActionsChanged: boolean;
  readonly crisisEligibilityStart: CrisisEligibilitySummary;
  readonly crisisEligibilityFinal: CrisisEligibilitySummary;
  readonly crisisEvents: readonly GameEventType[];
  readonly conflictSignatureStart: string;
  readonly conflictSignatureFinal: string;
  readonly conflictEvents: readonly GameEventType[];
  readonly territorySignatureStart: string;
  readonly territorySignatureFinal: string;
  readonly territoryChanged: boolean;
  readonly territorialEvents: readonly GameEventType[];
  readonly playerResponseFeasibility: ResponseFeasibilitySummary | null;
  readonly terminalOutcome: string;
  readonly consolidationEligible: boolean;
  readonly genuineReassessmentSignals: readonly GameEventType[];
  readonly reassessmentSilenceAfterOpeningDays: number | null;
  readonly proposalEffectsAbsentBeforeAccept: boolean;
  readonly snapshotReplayEquivalent: boolean;
}

export interface F05Fix6InteractionResult {
  readonly scenarioId: string;
  readonly seed: number;
  readonly horizonDays: number;
  readonly branches: readonly F05Fix6BranchSummary[];
  readonly rejectPreservesStatusQuo: boolean;
  readonly ignorePreservesStatusQuo: boolean;
  readonly acceptMeaningfulDownstreamChange: boolean;
  readonly acceptDifferenceUsesExistingIntervention: boolean;
  readonly persistenceReplayEquivalent: boolean;
  readonly landHexUnchangedByKernel: boolean;
  readonly pass: boolean;
}

interface BranchRun {
  readonly initial: RunRecord;
  readonly final: RunRecord;
  readonly responseInputRecord: RunRecord | null;
  readonly responseRecord: RunRecord | null;
  readonly proposalId: PoliticalProposalId | null;
}

function createRecord(scenario: ScenarioDefinition): RunRecord {
  return {
    world: createInitialWorldState(scenario, F05_FIX6_DEFAULT_SEED),
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

function acceptedLobby(record: RunRecord): ValidatedActionRecord {
  return acceptActionProposal(
    {
      tick: record.world.tick + 1,
      source: "heuristic",
      actionType: "LOBBY",
      payload: { factionId: FACTION_ID },
      schemaVersion: 1,
    },
    record.world.run.nextActionSequence,
  );
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

function firstProposal(world: WorldState): {
  readonly id: PoliticalProposalId;
  readonly interventionId: string;
} | null {
  const proposal = Object.values(world.politicalProposals ?? {})[0];
  return proposal === undefined
    ? null
    : { id: proposal.id, interventionId: proposal.interventionId };
}

function advanceToHorizon(
  scenario: ScenarioDefinition,
  record: RunRecord,
): RunRecord {
  let current = record;
  while (current.world.tick < F05_FIX6_HORIZON_DAYS) {
    current = step(scenario, current);
  }
  return current;
}

function runBranch(
  scenario: ScenarioDefinition,
  branch: F05Fix6Branch,
): BranchRun {
  const initial = createRecord(scenario);
  if (branch === "NO_PROPOSAL") {
    return {
      initial,
      final: advanceToHorizon(scenario, initial),
      responseInputRecord: null,
      responseRecord: null,
      proposalId: null,
    };
  }

  const opened = step(scenario, initial, [acceptedLobby(initial)]);
  const proposal = firstProposal(opened.world);
  if (proposal === null) {
    throw new Error(`${branch} did not open the authored proposal.`);
  }

  if (branch === "PROPOSAL_IGNORE") {
    return {
      initial,
      final: advanceToHorizon(scenario, opened),
      responseInputRecord: null,
      responseRecord: null,
      proposalId: proposal.id,
    };
  }

  const response = step(scenario, opened, [
    acceptedResponse(
      opened,
      proposal.id,
      branch === "PROPOSAL_ACCEPT" ? "accept" : "reject",
    ),
  ]);
  return {
    initial,
    final: advanceToHorizon(scenario, response),
    responseInputRecord: opened,
    responseRecord: response,
    proposalId: proposal.id,
  };
}

function eventPayloadString(event: GameEvent, key: string): string | null {
  if (
    typeof event.payload !== "object" ||
    event.payload === null ||
    Array.isArray(event.payload)
  ) {
    return null;
  }
  const value = (event.payload as Readonly<Record<string, unknown>>)[key];
  return typeof value === "string" ? value : null;
}

function eventTickForIntervention(
  events: readonly GameEvent[],
  type: "INTERVENTION_STARTED" | "INTERVENTION_COMPLETED",
  interventionId: string,
): number | null {
  return (
    events.find(
      (event) =>
        event.type === type &&
        eventPayloadString(event, "interventionId") === interventionId,
    )?.tick ?? null
  );
}

function factionState(
  world: WorldState,
  factionId: FactionId,
): FactionStateSummary {
  const faction = world.factions[factionId];
  if (faction === undefined) {
    throw new Error(`Missing faction ${factionId}.`);
  }
  return {
    grievance: faction.grievance,
    organization: faction.organization,
    resources: faction.resources,
  };
}

function agendaIds(
  scenario: ScenarioDefinition,
  record: RunRecord,
): readonly string[] {
  return deriveNationalAgendas({
    scenario,
    world: record.world,
    recentEvents: record.eventStore.events,
  }).map((agenda) => agenda.id);
}

function legalActions(
  scenario: ScenarioDefinition,
  world: WorldState,
): readonly string[] {
  return Object.entries(
    deriveFactionObservation(world, FACTION_ID, scenario).availableActions,
  )
    .filter(([, available]) => available)
    .map(([action]) => action)
    .sort();
}

function crisisEligibility(
  scenario: ScenarioDefinition,
  world: WorldState,
): CrisisEligibilitySummary {
  const prerequisites = derivePoliticalCrisisPrerequisites(scenario, world);
  return {
    coup: prerequisites.coups.some((snapshot) => snapshot.eligible),
    rebellion: prerequisites.rebellions.some((snapshot) => snapshot.eligible),
  };
}

function conflictSignature(world: WorldState): string {
  return Object.values(world.conflicts)
    .sort((first, second) => first.id.localeCompare(second.id))
    .map(
      (conflict) =>
        `${conflict.id}:${conflict.kind}:${conflict.status}:${conflict.startedAtTick}:${conflict.resolvedAtTick ?? "-"}`,
    )
    .join("|");
}

function territorySignature(world: WorldState): string {
  return Object.entries(world.landHexStates)
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([id, state]) => `${id}:${JSON.stringify(state.controller)}`)
    .join("|");
}

function rules(
  world: WorldState,
  countryId: CountryId,
): Readonly<Record<string, string | boolean>> {
  return { ...(world.policies[countryId]?.institutionalRules ?? {}) };
}

function ruleChanges(
  start: Readonly<Record<string, string | boolean>>,
  final: Readonly<Record<string, string | boolean>>,
): readonly string[] {
  return Object.keys({ ...start, ...final })
    .sort()
    .filter((key) => start[key] !== final[key])
    .map((key) => `${key}:${start[key] ?? "-"}->${final[key] ?? "-"}`);
}

const CRISIS_EVENT_TYPES = new Set<GameEventType>([
  "COUP_ATTEMPT_STARTED",
  "REBELLION_STARTED",
  "CIVIL_WAR_STARTED",
]);
const CONFLICT_EVENT_TYPES = new Set<GameEventType>([
  "CONFLICT_RESOLVED",
  "GOVERNMENT_TRANSITIONED",
]);
const TERRITORIAL_EVENT_TYPES = new Set<GameEventType>([
  "LAND_HEX_CONTROL_CHANGED",
]);
const REASSESSMENT_EVENT_TYPES = new Set<GameEventType>([
  "INTERVENTION_STARTED",
  "INTERVENTION_COMPLETED",
  "INSTITUTION_RULE_CHANGED",
  "REGION_UNREST_BAND_CHANGED",
  "NATIONAL_INSTABILITY_BAND_CHANGED",
  "COUP_ATTEMPT_STARTED",
  "REBELLION_STARTED",
  "CIVIL_WAR_STARTED",
  "LAND_HEX_CONTROL_CHANGED",
  "CONFLICT_RESOLVED",
  "GOVERNMENT_TRANSITIONED",
  "ORDER_CONSOLIDATION_STARTED",
  "ORDER_CONSOLIDATED",
  "STATE_DISSOLVED",
]);

function summarizeBranch(
  scenario: ScenarioDefinition,
  run: BranchRun,
  branch: F05Fix6Branch,
): F05Fix6BranchSummary {
  const countryId = scenario.playerCountryId!;
  const initialCountry = run.initial.world.countries[countryId]!;
  const finalCountry = run.final.world.countries[countryId]!;
  const initialProposal =
    run.proposalId === null
      ? null
      : (run.initial.world.politicalProposals?.[run.proposalId] ?? null);
  const finalProposal =
    run.proposalId === null
      ? null
      : (run.final.world.politicalProposals?.[run.proposalId] ?? null);
  const responseInputWorld = run.responseInputRecord?.world ?? null;
  const requestedInterventionId =
    finalProposal?.interventionId ?? initialProposal?.interventionId ?? null;
  const feasibility =
    responseInputWorld === null || requestedInterventionId === null
      ? null
      : evaluateInterventionFeasibility({
          scenario,
          world: responseInputWorld,
          interventionId: requestedInterventionId,
          countryId,
        });
  const responseFeasibility =
    feasibility === null
      ? null
      : {
          accept: feasibility.feasible,
          reject: true,
          interventionReasons: feasibility.reasons.map((reason) => reason.kind),
        };
  const events = run.final.eventStore.events;
  const crisisEvents = events
    .filter((event) => CRISIS_EVENT_TYPES.has(event.type))
    .map((event) => event.type);
  const conflictEvents = events
    .filter((event) => CONFLICT_EVENT_TYPES.has(event.type))
    .map((event) => event.type);
  const territorialEvents = events
    .filter((event) => TERRITORIAL_EVENT_TYPES.has(event.type))
    .map((event) => event.type);
  const allReassessmentEvents = events.filter((event) =>
    REASSESSMENT_EVENT_TYPES.has(event.type),
  );
  const proposalOpenEvent = events.find(
    (event) => event.type === "POLITICAL_PROPOSAL_OPENED",
  );
  const reassessmentEvents =
    proposalOpenEvent === undefined
      ? allReassessmentEvents
      : allReassessmentEvents.filter(
          (event) => event.tick > proposalOpenEvent.tick,
        );
  const firstReassessment = reassessmentEvents[0];
  const institutionalRulesStart = rules(run.initial.world, countryId);
  const institutionalRulesFinal = rules(run.final.world, countryId);
  const crisisStart = crisisEligibility(scenario, run.initial.world);
  const crisisFinal = crisisEligibility(scenario, run.final.world);
  const agendaStart = agendaIds(scenario, run.initial);
  const agendaFinal = agendaIds(scenario, run.final);
  const territoryStart = territorySignature(run.initial.world);
  const territoryFinal = territorySignature(run.final.world);
  const replay = cloneRunRecordViaSnapshot(scenario, run.final);
  const responseTick = run.responseRecord?.world.tick ?? null;
  const playerResponseFeasibility =
    finalProposal === null && initialProposal === null
      ? null
      : {
          accept: feasibility?.feasible ?? true,
          reject:
            finalProposal?.status === "open" ||
            finalProposal?.status === "rejected" ||
            finalProposal?.status === "accepted",
          interventionReasons:
            feasibility?.reasons.map((reason) => reason.kind) ?? [],
        };

  return {
    branch,
    scenarioId: scenario.id,
    seed: F05_FIX6_DEFAULT_SEED,
    horizonDays: F05_FIX6_HORIZON_DAYS,
    proposalId: run.proposalId,
    proposalOpenedTick: proposalOpenEvent?.tick ?? null,
    proposalResolvedTick: finalProposal?.resolvedAtTick ?? null,
    proposalStatus: finalProposal?.status ?? null,
    targetGovernmentId:
      finalProposal?.targetGovernmentId ??
      initialProposal?.targetGovernmentId ??
      null,
    countryId,
    countryIdPreserved: finalCountry.id === countryId,
    currentGovernmentIdStart: initialCountry.currentGovernmentId,
    currentGovernmentIdFinal: finalCountry.currentGovernmentId,
    requestedInterventionId,
    responseTick,
    responseFeasibility,
    interventionStartTick:
      requestedInterventionId === null
        ? null
        : eventTickForIntervention(
            events,
            "INTERVENTION_STARTED",
            requestedInterventionId,
          ),
    interventionCompletionTick:
      requestedInterventionId === null
        ? null
        : eventTickForIntervention(
            events,
            "INTERVENTION_COMPLETED",
            requestedInterventionId,
          ),
    treasuryStart: initialCountry.treasury,
    treasuryAtResponse:
      responseInputWorld?.countries[countryId]?.treasury ?? null,
    treasuryFinal: finalCountry.treasury,
    administrativeLoadAtResponse:
      responseInputWorld === null
        ? null
        : deriveCommittedAdministrativeLoad(responseInputWorld, countryId),
    administrativeHeadroomAtResponse:
      responseInputWorld === null
        ? null
        : deriveAdministrativeHeadroom(responseInputWorld, countryId),
    administrativeLoadFinal: deriveCommittedAdministrativeLoad(
      run.final.world,
      countryId,
    ),
    administrativeHeadroomFinal: deriveAdministrativeHeadroom(
      run.final.world,
      countryId,
    ),
    institutionalRulesStart,
    institutionalRulesFinal,
    institutionalRuleChanges: ruleChanges(
      institutionalRulesStart,
      institutionalRulesFinal,
    ),
    affectedFactionStart: factionState(run.initial.world, AFFECTED_FACTION_ID),
    affectedFactionFinal: factionState(run.final.world, AFFECTED_FACTION_ID),
    agendaIdsStart: agendaStart,
    agendaIdsFinal: agendaFinal,
    agendaChanged: JSON.stringify(agendaStart) !== JSON.stringify(agendaFinal),
    legalActionsStart: legalActions(scenario, run.initial.world),
    legalActionsFinal: legalActions(scenario, run.final.world),
    legalActionsChanged:
      JSON.stringify(legalActions(scenario, run.initial.world)) !==
      JSON.stringify(legalActions(scenario, run.final.world)),
    crisisEligibilityStart: crisisStart,
    crisisEligibilityFinal: crisisFinal,
    crisisEvents,
    conflictSignatureStart: conflictSignature(run.initial.world),
    conflictSignatureFinal: conflictSignature(run.final.world),
    conflictEvents,
    territorySignatureStart: territoryStart,
    territorySignatureFinal: territoryFinal,
    territoryChanged: territoryStart !== territoryFinal,
    territorialEvents,
    playerResponseFeasibility,
    terminalOutcome: run.final.world.run.outcome.status,
    consolidationEligible:
      run.final.world.run.consolidation.isCurrentlyEligible,
    genuineReassessmentSignals: reassessmentEvents.map((event) => event.type),
    reassessmentSilenceAfterOpeningDays:
      proposalOpenEvent === undefined
        ? null
        : firstReassessment === undefined
          ? F05_FIX6_HORIZON_DAYS - proposalOpenEvent.tick
          : Math.max(0, firstReassessment.tick - proposalOpenEvent.tick),
    proposalEffectsAbsentBeforeAccept:
      branch === "PROPOSAL_IGNORE" || branch === "PROPOSAL_REJECT"
        ? eventTickForIntervention(
            events,
            "INTERVENTION_STARTED",
            REQUESTED_INTERVENTION_ID,
          ) === null &&
          ruleChanges(institutionalRulesStart, institutionalRulesFinal)
            .length === 0
        : true,
    snapshotReplayEquivalent:
      serializeSimulationSnapshotJson(scenario, replay) ===
      serializeSimulationSnapshotJson(scenario, run.final),
  };
}

function stateDifferenceUsesIntervention(
  accepted: F05Fix6BranchSummary,
  statusQuo: F05Fix6BranchSummary,
): boolean {
  return (
    accepted.interventionStartTick !== null &&
    accepted.interventionCompletionTick !== null &&
    accepted.institutionalRuleChanges.length > 0 &&
    (JSON.stringify(accepted.institutionalRulesFinal) !==
      JSON.stringify(statusQuo.institutionalRulesFinal) ||
      JSON.stringify(accepted.affectedFactionFinal) !==
        JSON.stringify(statusQuo.affectedFactionFinal))
  );
}

export function runF05Fix6PoliticalInteraction(): F05Fix6InteractionResult {
  const scenario = createF05Fix6PoliticalInteractionScenario();
  const branches = F05_FIX6_BRANCHES.map((branch) =>
    summarizeBranch(scenario, runBranch(scenario, branch), branch),
  );
  const baseline = branches[0]!;
  const ignore = branches[1]!;
  const reject = branches[2]!;
  const accepted = branches[3]!;
  const rejectPreservesStatusQuo =
    reject.proposalStatus === "rejected" &&
    reject.interventionStartTick === null &&
    JSON.stringify(reject.institutionalRulesFinal) ===
      JSON.stringify(ignore.institutionalRulesFinal) &&
    JSON.stringify(reject.affectedFactionFinal) ===
      JSON.stringify(ignore.affectedFactionFinal);
  const ignorePreservesStatusQuo =
    ignore.proposalStatus === "open" &&
    ignore.interventionStartTick === null &&
    ignore.institutionalRuleChanges.length === 0;
  const acceptMeaningfulDownstreamChange = stateDifferenceUsesIntervention(
    accepted,
    reject,
  );
  const acceptDifferenceUsesExistingIntervention =
    accepted.requestedInterventionId === REQUESTED_INTERVENTION_ID &&
    accepted.proposalStatus === "accepted" &&
    accepted.interventionStartTick !== null &&
    accepted.interventionCompletionTick !== null &&
    accepted.genuineReassessmentSignals.includes("INTERVENTION_COMPLETED");
  const persistenceReplayEquivalent = branches.every(
    (branch) => branch.snapshotReplayEquivalent,
  );
  const landHexUnchangedByKernel = branches.every(
    (branch) =>
      !branch.territoryChanged && branch.territorialEvents.length === 0,
  );

  return {
    scenarioId: scenario.id,
    seed: F05_FIX6_DEFAULT_SEED,
    horizonDays: F05_FIX6_HORIZON_DAYS,
    branches,
    rejectPreservesStatusQuo,
    ignorePreservesStatusQuo,
    acceptMeaningfulDownstreamChange,
    acceptDifferenceUsesExistingIntervention,
    persistenceReplayEquivalent,
    landHexUnchangedByKernel,
    pass:
      baseline.proposalStatus === null &&
      rejectPreservesStatusQuo &&
      ignorePreservesStatusQuo &&
      acceptMeaningfulDownstreamChange &&
      acceptDifferenceUsesExistingIntervention &&
      persistenceReplayEquivalent &&
      landHexUnchangedByKernel,
  };
}

function formatBranch(branch: F05Fix6BranchSummary): string {
  return [
    `### ${branch.branch}`,
    `proposal=${branch.proposalStatus ?? "none"} open@${branch.proposalOpenedTick ?? "-"} resolve@${branch.proposalResolvedTick ?? "-"} targetGovernment=${branch.targetGovernmentId ?? "-"}`,
    `response=${branch.responseTick ?? "-"} feasibleAccept=${branch.responseFeasibility?.accept ?? "-"} feasibleReject=${branch.responseFeasibility?.reject ?? "-"} intervention=${branch.requestedInterventionId ?? "-"}`,
    `interventionStart=${branch.interventionStartTick ?? "-"} completion=${branch.interventionCompletionTick ?? "-"} treasury=${branch.treasuryStart.toFixed(0)}->${branch.treasuryFinal.toFixed(0)} adminLoad=${branch.administrativeLoadAtResponse ?? "-"}->${branch.administrativeLoadFinal}`,
    `rules=${branch.institutionalRuleChanges.join(", ") || "none"} affectedFaction grievance=${branch.affectedFactionStart.grievance.toFixed(3)}->${branch.affectedFactionFinal.grievance.toFixed(3)} organization=${branch.affectedFactionStart.organization.toFixed(3)}->${branch.affectedFactionFinal.organization.toFixed(3)}`,
    `agenda=${branch.agendaIdsStart.join(",") || "none"}->${branch.agendaIdsFinal.join(",") || "none"} legalActionsChanged=${branch.legalActionsChanged} crisis=${branch.crisisEvents.join(",") || "none"} conflict=${branch.conflictEvents.join(",") || "none"} territoryChanged=${branch.territoryChanged}`,
    `reassessment=${branch.genuineReassessmentSignals.join(",") || "none"} silenceAfterOpeningDays=${branch.reassessmentSilenceAfterOpeningDays ?? "-"} terminal=${branch.terminalOutcome} consolidationEligible=${branch.consolidationEligible} replay=${branch.snapshotReplayEquivalent}`,
  ].join("\n");
}

export function formatF05Fix6PoliticalInteraction(
  result: F05Fix6InteractionResult,
): string {
  return [
    "# F05_FIX6 Political Interaction Counterfactual",
    "",
    `Scenario: ${result.scenarioId}`,
    `Seed: ${result.seed}`,
    `Horizon: ${result.horizonDays} days`,
    "",
    ...result.branches.map(formatBranch),
    "",
    `REJECT preserves status quo: ${result.rejectPreservesStatusQuo ? "PASS" : "FAIL"}`,
    `IGNORE preserves status quo: ${result.ignorePreservesStatusQuo ? "PASS" : "FAIL"}`,
    `ACCEPT meaningful downstream change: ${result.acceptMeaningfulDownstreamChange ? "PASS" : "FAIL"}`,
    `ACCEPT uses existing intervention path: ${result.acceptDifferenceUsesExistingIntervention ? "PASS" : "FAIL"}`,
    `Persistence/replay: ${result.persistenceReplayEquivalent ? "PASS" : "FAIL"}`,
    `LandHex unchanged by kernel: ${result.landHexUnchangedByKernel ? "PASS" : "FAIL"}`,
    `F05_FIX6 INSPECTION: ${result.pass ? "PASS" : "NOT PASS"}`,
  ].join("\n");
}

export function printF05Fix6PoliticalInteraction(): void {
  console.log(
    formatF05Fix6PoliticalInteraction(runF05Fix6PoliticalInteraction()),
  );
}
