import type { GameEvent } from "../events/event";
import {
  createRespondPoliticalProposalActionProposal,
  type ActionProposal,
  type ActionRecord,
} from "../state/action";
import type { InterventionId } from "../state/ids";
import {
  createF04DValidationScenario,
  F04D_VALIDATION_INTERVENTION_IDS,
} from "../state/gate1fValidationFixture";
import { createF05Fix7PoliticalInteractionScenario } from "../state/politicalInteractionFixture";
import type { ScenarioDefinition } from "../state/scenario";
import type { WorldState } from "../state/world";
import { deriveNationalAgendas } from "../readModels/agenda";
import { evaluateInterventionFeasibility } from "../state/intervention";
import {
  createF03StartingRecord,
  runF03StrategyFromRecord,
  type F03StrategyRunResult,
} from "./f03InterventionCounterfactuals";
import {
  F05_CONTEXTS,
  F05_PACING_EVENT_TYPES,
  F05_STRATEGY_IDS,
  runF05PacingFunDecision,
  type F05BranchMeasurement,
  type F05ContextDefinition,
  type F05StrategyId,
} from "./f05PacingFunDecision";
import {
  runF05Fix7InteractionIntegration,
  type F05Fix7BranchSummary,
} from "./f05Fix7InteractionIntegration";

export const F05_FIX8_AUDIT_SEED = 40103 as const;
export const F05_FIX8_AUDIT_HORIZON_DAYS = 1_800 as const;

const PROPOSAL_EVENT_TYPES = new Set([
  "POLITICAL_PROPOSAL_OPENED",
  "POLITICAL_PROPOSAL_ACCEPTED",
  "POLITICAL_PROPOSAL_REJECTED",
  "POLITICAL_PROPOSAL_RESPONSE_REJECTED",
]);

const FACTION_ACTION_TYPES = new Set([
  "LOBBY",
  "BARGAIN",
  "ORGANIZE",
  "FUND_MOVEMENT",
  "ACCEPT",
]);

const RESPONSE_INTERVENTIONS: Readonly<
  Record<F05StrategyId, InterventionId | null>
> = {
  [F05_STRATEGY_IDS.wait]: null,
  [F05_STRATEGY_IDS.materialRelief]:
    F04D_VALIDATION_INTERVENTION_IDS.materialRelief,
  [F05_STRATEGY_IDS.politicalAccommodation]:
    F04D_VALIDATION_INTERVENTION_IDS.politicalAccommodation,
  [F05_STRATEGY_IDS.oppositionLegalization]:
    F04D_VALIDATION_INTERVENTION_IDS.oppositionLegalization,
  [F05_STRATEGY_IDS.coerciveRestriction]:
    F04D_VALIDATION_INTERVENTION_IDS.coerciveRestriction,
  [F05_STRATEGY_IDS.repeatedAccommodation]:
    F04D_VALIDATION_INTERVENTION_IDS.politicalAccommodation,
};

type AuditMode =
  | "HISTORICAL_NO_TEMPLATE"
  | "INTEGRATION_NO_TEMPLATE"
  | "PROPOSAL_IGNORE"
  | "PROPOSAL_REJECT";

type DivergenceClassification =
  | "ORCHESTRATION_ORDER_EFFECT"
  | "RUNNER_IMPLEMENTATION_ARTIFACT"
  | "PROPOSAL_STATE_HAS_REAL_EXISTING_CONSUMER"
  | "MEASUREMENT_SIGNATURE_ARTIFACT"
  | "EXPECTED_EXISTING_SYSTEM_INTERACTION"
  | "UNRESOLVED";

interface PreFixObservedDivergence {
  readonly contextId: string;
  readonly strategyId: F05StrategyId;
  readonly mode: "PROPOSAL_IGNORE" | "PROPOSAL_REJECT";
  readonly firstRelativeTick: number;
  readonly firstAbsoluteTick: number;
  readonly f05Fix7SilenceDays: number;
  readonly historicalF05SilenceDays: number;
  readonly classification: "MEASUREMENT_SIGNATURE_ARTIFACT";
}

/** Captured during the first Phase-A probe, before the developer measurement
 * seam was aligned with the official F05 event-cluster contract. */
const PRE_FIX_OBSERVED_DIVERGENCES: readonly PreFixObservedDivergence[] = [
  ...(["PROPOSAL_IGNORE", "PROPOSAL_REJECT"] as const).flatMap((mode) => [
    {
      contextId: "EARLY_PREVENTIVE_T0",
      strategyId: F05_STRATEGY_IDS.repeatedAccommodation,
      mode,
      firstRelativeTick: 31,
      firstAbsoluteTick: 31,
      f05Fix7SilenceDays: 83,
      historicalF05SilenceDays: 112,
      classification: "MEASUREMENT_SIGNATURE_ARTIFACT" as const,
    },
    {
      contextId: "EARLY_PREVENTIVE_T1",
      strategyId: F05_STRATEGY_IDS.repeatedAccommodation,
      mode,
      firstRelativeTick: 30,
      firstAbsoluteTick: 31,
      f05Fix7SilenceDays: 83,
      historicalF05SilenceDays: 111,
      classification: "MEASUREMENT_SIGNATURE_ARTIFACT" as const,
    },
    {
      contextId: "NEAR_CRISIS_T18",
      strategyId: F05_STRATEGY_IDS.repeatedAccommodation,
      mode,
      firstRelativeTick: 13,
      firstAbsoluteTick: 31,
      f05Fix7SilenceDays: 83,
      historicalF05SilenceDays: 94,
      classification: "MEASUREMENT_SIGNATURE_ARTIFACT" as const,
    },
    {
      contextId: "NEAR_CRISIS_T19",
      strategyId: F05_STRATEGY_IDS.repeatedAccommodation,
      mode,
      firstRelativeTick: 12,
      firstAbsoluteTick: 31,
      f05Fix7SilenceDays: 83,
      historicalF05SilenceDays: 93,
      classification: "MEASUREMENT_SIGNATURE_ARTIFACT" as const,
    },
  ]),
];

interface TraceObservation {
  readonly relativeTick: number;
  readonly actions: readonly Record<string, unknown>[];
  readonly carriedFactionActions: readonly Record<string, unknown>[];
  readonly events: readonly Record<string, unknown>[];
  readonly nonProposalEvents: readonly Record<string, unknown>[];
  readonly worldCore: unknown;
  readonly interventionState: unknown;
  readonly proposalState: unknown;
  readonly agendaInput: unknown;
  readonly measurementInput: unknown;
}

interface BranchTrace {
  readonly mode: AuditMode;
  readonly contextId: string;
  readonly strategyId: F05StrategyId;
  readonly scenarioId: string;
  readonly run: F03StrategyRunResult;
  readonly observations: readonly TraceObservation[];
}

export interface F05Fix8DivergenceEvidence {
  readonly contextId: string;
  readonly strategyId: F05StrategyId;
  readonly matchingF05Fix7Branch: F05Fix7BranchSummary;
  readonly historicalF05Branch: F05BranchMeasurement;
  readonly firstDivergenceRelativeTick: number | null;
  readonly firstDivergenceAbsoluteTick: number | null;
  readonly firstDivergenceCategories: readonly string[];
  readonly firstDivergenceActionRecords: readonly Record<string, unknown>[];
  readonly firstDivergenceCarriedFactionActions: readonly Record<
    string,
    unknown
  >[];
  readonly firstDivergenceEvents: readonly Record<string, unknown>[];
  readonly firstDivergenceNonProposalEvents: readonly Record<string, unknown>[];
  readonly firstDivergenceWorldCoreChanged: boolean;
  readonly firstDivergenceInterventionStateChanged: boolean;
  readonly firstDivergenceProposalStateChanged: boolean;
  readonly firstDivergenceAgendaInputChanged: boolean;
  readonly firstDivergenceMeasurementInputChanged: boolean;
  readonly nonProposalStateEqualThroughHorizon: boolean;
  readonly rawControlStateGroundedSilenceDays: number;
  readonly rawCandidateStateGroundedSilenceDays: number;
  readonly rawStateGroundedMetricEqual: boolean;
  readonly historicalVsIntegrationRunnerEqualThroughFirstDivergence: boolean;
  readonly classification: DivergenceClassification;
  readonly pairedControlConclusion: string;
}

export interface F05Fix8NonAcceptDivergenceAuditResult {
  readonly seed: number;
  readonly horizonDays: number;
  readonly historicalF05Baseline: ReturnType<typeof runF05PacingFunDecision>;
  readonly historicalBaselineUnchanged: boolean;
  readonly nonAcceptDivergenceCount: number;
  readonly preFixObservedDivergenceCount: number;
  readonly preFixObservedDivergences: readonly PreFixObservedDivergence[];
  readonly ignoreDivergenceCount: number;
  readonly rejectDivergenceCount: number;
  readonly divergences: readonly F05Fix8DivergenceEvidence[];
  readonly classificationCounts: Readonly<
    Record<DivergenceClassification, number>
  >;
  readonly allResolved: boolean;
  readonly phaseAClassification:
    | "ORCHESTRATION_ARTIFACT_FIXED"
    | "EXPECTED_CAUSAL"
    | "MIXED_EXPLAINED"
    | "UNRESOLVED";
  readonly output: string;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([first], [second]) =>
        first < second ? -1 : first > second ? 1 : 0,
      )
      .map(([key, nested]) => [key, stableValue(nested)]),
  );
}

function stableJson(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

function actionView(action: ActionRecord): Record<string, unknown> {
  return {
    id: String(action.id),
    tick: action.tick,
    sequence: action.sequence,
    source: action.source,
    actionType: action.actionType,
    payload: action.payload,
    schemaVersion: action.schemaVersion,
    validationOutcome: action.validationOutcome,
  };
}

function eventView(event: GameEvent): Record<string, unknown> {
  return {
    id: String(event.id),
    tick: event.tick,
    sequence: event.sequence,
    type: event.type,
    actorId: event.actorId === undefined ? null : String(event.actorId),
    targetId: event.targetId === undefined ? null : String(event.targetId),
    causeIds: event.causeIds.map(String),
    payload: event.payload,
  };
}

function semanticEventView(event: GameEvent): Record<string, unknown> {
  return {
    tick: event.tick,
    type: event.type,
    actorId: event.actorId === undefined ? null : String(event.actorId),
    targetId: event.targetId === undefined ? null : String(event.targetId),
    payload: event.payload,
  };
}

function actionLogAtTick(
  world: WorldState,
  tick: number,
): readonly Record<string, unknown>[] {
  return world.run.actionLog
    .filter((action) => action.tick === tick)
    .map(actionView);
}

function carriedFactionActionsAtTick(
  world: WorldState,
  tick: number,
): readonly Record<string, unknown>[] {
  return world.run.actionLog
    .filter(
      (action) =>
        action.tick === tick &&
        action.source === "heuristic" &&
        FACTION_ACTION_TYPES.has(action.actionType),
    )
    .map(actionView);
}

function worldCoreView(world: WorldState): unknown {
  return {
    tick: world.tick,
    date: world.date,
    countries: world.countries,
    regions: world.regions,
    landHexStates: world.landHexStates,
    governments: world.governments,
    factions: world.factions,
    conflicts: world.conflicts,
    interventionCommitments: world.interventionCommitments,
    contactEdgeStates: world.contactEdgeStates,
    policies: world.policies,
    rngState: world.rngState,
    run: {
      simulationVersion: world.run.simulationVersion,
      scenarioVersion: world.run.scenarioVersion,
      seed: world.run.seed,
      outcome: world.run.outcome,
      consolidation: world.run.consolidation,
      nextActionSequence: world.run.nextActionSequence,
    },
  };
}

function interventionStateView(world: WorldState): unknown {
  return {
    countries: Object.fromEntries(
      Object.entries(world.countries).map(([id, country]) => [
        id,
        {
          treasury: country.treasury,
          stateCapacity: country.stateCapacity,
        },
      ]),
    ),
    interventionCommitments: world.interventionCommitments,
  };
}

function proposalStateView(world: WorldState): unknown {
  return world.politicalProposals ?? {};
}

function agendaInputView(
  scenario: ScenarioDefinition,
  world: WorldState,
  events: readonly GameEvent[],
): unknown {
  return deriveNationalAgendas({ scenario, world, recentEvents: events }).map(
    (agenda) => ({
      id: agenda.id,
      kind: agenda.kind,
      severityBand: agenda.severityBand ?? "unknown",
      causeEventIds: agenda.causeEventIds.map(String),
      involvedFactionIds: agenda.involvedFactionIds.map(String),
    }),
  );
}

function measurementInputView(
  scenario: ScenarioDefinition,
  world: WorldState,
  events: readonly GameEvent[],
): unknown {
  const countryId = scenario.playerCountryId;
  const feasible =
    countryId === null
      ? []
      : Object.values(F04D_VALIDATION_INTERVENTION_IDS)
          .filter(
            (interventionId) =>
              evaluateInterventionFeasibility({
                scenario,
                world,
                interventionId,
                countryId,
              }).feasible,
          )
          .sort();
  return {
    pacingEvents: events
      .filter((event) => F05_PACING_EVENT_TYPES.has(event.type))
      .map(
        (event) =>
          `${event.tick}:${event.type}:${String(event.targetId ?? "none")}`,
      ),
    agenda: agendaInputView(scenario, world, events),
    feasibleResponses: feasible,
  };
}

function interventionForStrategy(
  strategyId: F05StrategyId,
): InterventionId | null {
  return RESPONSE_INTERVENTIONS[strategyId];
}

function strategyPolicy(
  strategyId: F05StrategyId,
): ({
  relativeTick,
}: {
  readonly relativeTick: number;
}) => InterventionId | null {
  const interventionId = interventionForStrategy(strategyId);
  return ({ relativeTick }) => {
    if (interventionId === null) return null;
    if (strategyId === F05_STRATEGY_IDS.repeatedAccommodation) {
      return relativeTick % 90 === 0 ? interventionId : null;
    }
    return relativeTick === 0 ? interventionId : null;
  };
}

function responsePolicy(
  mode: AuditMode,
): NonNullable<
  Parameters<typeof runF03StrategyFromRecord>[6]
>["additionalActionPolicy"] {
  return ({ world }) => {
    if (mode !== "PROPOSAL_REJECT") return [];
    return Object.values(world.politicalProposals ?? {})
      .filter((proposal) => proposal.status === "open")
      .sort((first, second) =>
        String(first.id).localeCompare(String(second.id)),
      )
      .map((proposal): ActionProposal =>
        createRespondPoliticalProposalActionProposal(
          world.tick + 1,
          proposal.id,
          "reject",
        ),
      );
  };
}

function runTrace(
  scenario: ScenarioDefinition,
  context: F05ContextDefinition,
  strategyId: F05StrategyId,
  mode: AuditMode,
): BranchTrace {
  const observations: TraceObservation[] = [];
  const startingRecord = createF03StartingRecord(
    scenario,
    F05_FIX8_AUDIT_SEED,
    context.checkpointTick,
  );
  const run = runF03StrategyFromRecord(
    scenario,
    context.id,
    `F05_FIX8:${mode}:${strategyId}`,
    startingRecord,
    5,
    strategyPolicy(strategyId),
    {
      factionActorLoop: "on",
      additionalActionPolicy:
        mode === "PROPOSAL_IGNORE" || mode === "PROPOSAL_REJECT"
          ? responsePolicy(mode)
          : undefined,
      onObservation: ({ relativeTick, world, events }) => {
        observations.push({
          relativeTick,
          actions: actionLogAtTick(world, world.tick),
          carriedFactionActions: carriedFactionActionsAtTick(world, world.tick),
          events: events.map(eventView),
          nonProposalEvents: events
            .filter((event) => !PROPOSAL_EVENT_TYPES.has(event.type))
            .map(semanticEventView),
          worldCore: worldCoreView(world),
          interventionState: interventionStateView(world),
          proposalState: proposalStateView(world),
          agendaInput: agendaInputView(scenario, world, events),
          measurementInput: measurementInputView(scenario, world, events),
        });
      },
    },
  );
  return {
    mode,
    contextId: context.id,
    strategyId,
    scenarioId: String(scenario.id),
    run,
    observations,
  };
}

function firstChangedObservation(
  baseline: BranchTrace,
  candidate: BranchTrace,
): {
  readonly relativeTick: number | null;
  readonly baseline: TraceObservation | null;
  readonly candidate: TraceObservation | null;
} {
  const count = Math.max(
    baseline.observations.length,
    candidate.observations.length,
  );
  for (let index = 0; index < count; index += 1) {
    const first = baseline.observations[index];
    const second = candidate.observations[index];
    if (first === undefined || second === undefined) {
      return {
        relativeTick: first?.relativeTick ?? second?.relativeTick ?? null,
        baseline: first ?? null,
        candidate: second ?? null,
      };
    }
    if (
      stableJson(first.actions) !== stableJson(second.actions) ||
      stableJson(first.carriedFactionActions) !==
        stableJson(second.carriedFactionActions) ||
      stableJson(first.events) !== stableJson(second.events) ||
      stableJson(first.worldCore) !== stableJson(second.worldCore) ||
      stableJson(first.interventionState) !==
        stableJson(second.interventionState) ||
      stableJson(first.proposalState) !== stableJson(second.proposalState) ||
      stableJson(first.agendaInput) !== stableJson(second.agendaInput) ||
      stableJson(first.measurementInput) !== stableJson(second.measurementInput)
    ) {
      return {
        relativeTick: first.relativeTick,
        baseline: first,
        candidate: second,
      };
    }
  }
  return { relativeTick: null, baseline: null, candidate: null };
}

function eventListsDifferIgnoringProposalLifecycle(
  first: TraceObservation,
  second: TraceObservation,
): boolean {
  return (
    stableJson(first.nonProposalEvents) !== stableJson(second.nonProposalEvents)
  );
}

function longestSilence(
  ticks: readonly number[],
  executedTicks: number,
): number {
  const sorted = [0, ...new Set([...ticks, executedTicks])].sort(
    (first, second) => first - second,
  );
  let longest = 0;
  for (let index = 1; index < sorted.length; index += 1) {
    longest = Math.max(longest, sorted[index]! - sorted[index - 1]!);
  }
  return longest;
}

function rawStateGroundedTicks(trace: BranchTrace): readonly number[] {
  const pacingTicks: number[] = [];
  const signalTicks: number[] = [];
  let previousAgenda: string | null = null;
  let previousFeasible: string | null = null;
  for (const observation of trace.observations) {
    pacingTicks.push(
      ...observation.events
        .filter((event) =>
          F05_PACING_EVENT_TYPES.has(String(event.type) as never),
        )
        .map((event) => Number(event.tick) - trace.run.checkpointTick),
    );

    const measurement = observation.measurementInput as {
      readonly agenda?: unknown;
      readonly feasibleResponses?: unknown;
    };
    const agenda = stableJson(measurement.agenda);
    const feasible = stableJson(measurement.feasibleResponses);
    if (observation.relativeTick % 30 === 0) {
      if (previousAgenda !== null && previousAgenda !== agenda) {
        signalTicks.push(observation.relativeTick);
      }
      previousAgenda = agenda;
    }
    if (observation.relativeTick % 90 === 0) {
      if (previousFeasible !== null && previousFeasible !== feasible) {
        signalTicks.push(observation.relativeTick);
      }
      previousFeasible = feasible;
    }
  }
  const clusterEnds: number[] = [];
  for (const tick of [...new Set(pacingTicks)].sort(
    (first, second) => first - second,
  )) {
    const previous = clusterEnds.at(-1);
    if (previous === undefined || tick - previous > 30) {
      clusterEnds.push(tick);
    } else {
      clusterEnds[clusterEnds.length - 1] = tick;
    }
  }
  return [...clusterEnds, ...signalTicks];
}

function nonProposalStateEqualThroughHorizon(
  first: BranchTrace,
  second: BranchTrace,
): boolean {
  if (first.observations.length !== second.observations.length) return false;
  return first.observations.every((observation, index) => {
    const candidate = second.observations[index];
    if (candidate === undefined) return false;
    return (
      observation.relativeTick === candidate.relativeTick &&
      stableJson(observation.actions) === stableJson(candidate.actions) &&
      stableJson(observation.carriedFactionActions) ===
        stableJson(candidate.carriedFactionActions) &&
      stableJson(observation.nonProposalEvents) ===
        stableJson(candidate.nonProposalEvents) &&
      stableJson(observation.worldCore) === stableJson(candidate.worldCore) &&
      stableJson(observation.interventionState) ===
        stableJson(candidate.interventionState)
    );
  });
}

function classifyDivergence(
  baseline: TraceObservation,
  candidate: TraceObservation,
  historicalVsIntegrationEqual: boolean,
  sameNonProposalStateThroughHorizon: boolean,
  rawStateGroundedMetricEqual: boolean,
  branchStateGroundedDifference: boolean,
): DivergenceClassification {
  const actionChanged =
    stableJson(baseline.actions) !== stableJson(candidate.actions);
  const factionActionChanged =
    stableJson(baseline.carriedFactionActions) !==
    stableJson(candidate.carriedFactionActions);
  const nonProposalEventsChanged = eventListsDifferIgnoringProposalLifecycle(
    baseline,
    candidate,
  );
  const coreChanged =
    stableJson(baseline.worldCore) !== stableJson(candidate.worldCore);
  const interventionChanged =
    stableJson(baseline.interventionState) !==
    stableJson(candidate.interventionState);
  const proposalChanged =
    stableJson(baseline.proposalState) !== stableJson(candidate.proposalState);
  const agendaChanged =
    stableJson(baseline.agendaInput) !== stableJson(candidate.agendaInput);
  const measurementChanged =
    stableJson(baseline.measurementInput) !==
    stableJson(candidate.measurementInput);

  if (actionChanged || factionActionChanged)
    return "ORCHESTRATION_ORDER_EFFECT";
  if (!historicalVsIntegrationEqual) return "RUNNER_IMPLEMENTATION_ARTIFACT";
  if (
    sameNonProposalStateThroughHorizon &&
    rawStateGroundedMetricEqual &&
    branchStateGroundedDifference
  ) {
    return "MEASUREMENT_SIGNATURE_ARTIFACT";
  }
  if (nonProposalEventsChanged || coreChanged || interventionChanged) {
    return proposalChanged
      ? "PROPOSAL_STATE_HAS_REAL_EXISTING_CONSUMER"
      : "EXPECTED_EXISTING_SYSTEM_INTERACTION";
  }
  if (agendaChanged || measurementChanged)
    return "MEASUREMENT_SIGNATURE_ARTIFACT";
  return "UNRESOLVED";
}

function stateGroundedDifference(
  first: F05Fix7BranchSummary,
  second: F05Fix7BranchSummary,
): boolean {
  return (
    stableJson({
      firstCrisisRelativeTick: first.firstCrisisRelativeTick,
      finalTreasury: first.finalTreasury,
      finalInstability: first.finalInstability,
      finalFactionGrievance: first.finalFactionGrievance,
      finalFactionOrganization: first.finalFactionOrganization,
      finalPoliticalCompetition: first.finalPoliticalCompetition,
      finalPressFreedom: first.finalPressFreedom,
      finalActiveConflicts: first.finalActiveConflicts,
      finalControlledLandHexes: first.finalControlledLandHexes,
      finalOutcome: first.finalOutcome,
      stateGroundedLongestReassessmentSilenceDays:
        first.stateGroundedLongestReassessmentSilenceDays,
    }) !==
    stableJson({
      firstCrisisRelativeTick: second.firstCrisisRelativeTick,
      finalTreasury: second.finalTreasury,
      finalInstability: second.finalInstability,
      finalFactionGrievance: second.finalFactionGrievance,
      finalFactionOrganization: second.finalFactionOrganization,
      finalPoliticalCompetition: second.finalPoliticalCompetition,
      finalPressFreedom: second.finalPressFreedom,
      finalActiveConflicts: second.finalActiveConflicts,
      finalControlledLandHexes: second.finalControlledLandHexes,
      finalOutcome: second.finalOutcome,
      stateGroundedLongestReassessmentSilenceDays:
        second.stateGroundedLongestReassessmentSilenceDays,
    })
  );
}

function branchKey(contextId: string, strategyId: F05StrategyId): string {
  return `${contextId}:${strategyId}`;
}

function findHistoricalBranch(
  historical: ReturnType<typeof runF05PacingFunDecision>,
  contextId: string,
  strategyId: F05StrategyId,
): F05BranchMeasurement {
  const context = historical.contexts.find(
    (candidate) => candidate.context.id === contextId,
  );
  const branch = context?.branches.find(
    (candidate) => candidate.strategyId === strategyId,
  );
  if (branch === undefined)
    throw new Error(
      `Missing historical branch ${branchKey(contextId, strategyId)}.`,
    );
  return branch;
}

function collectTargetBranches(
  integration: ReturnType<typeof runF05Fix7InteractionIntegration>,
): readonly F05Fix7BranchSummary[] {
  const controls = new Map(
    integration.branches
      .filter((branch) => branch.mode === "NO_TEMPLATE")
      .map((branch) => [
        branchKey(branch.contextId, branch.strategyId),
        branch,
      ]),
  );
  return integration.branches.filter((branch) => {
    if (branch.mode !== "PROPOSAL_IGNORE" && branch.mode !== "PROPOSAL_REJECT")
      return false;
    const control = controls.get(
      branchKey(branch.contextId, branch.strategyId),
    );
    return control !== undefined && stateGroundedDifference(control, branch);
  });
}

function buildEvidence(
  historical: ReturnType<typeof runF05PacingFunDecision>,
  branch: F05Fix7BranchSummary,
): F05Fix8DivergenceEvidence {
  const context = F05_CONTEXTS.find(
    (candidate) => candidate.id === branch.contextId,
  );
  if (context === undefined)
    throw new Error(`Missing context ${branch.contextId}.`);
  const historicalBranch = findHistoricalBranch(
    historical,
    branch.contextId,
    branch.strategyId,
  );
  const integrationControl = runTrace(
    createF04DValidationScenario(),
    context,
    branch.strategyId,
    "INTEGRATION_NO_TEMPLATE",
  );
  const historicalRunner = runTrace(
    createF04DValidationScenario(),
    context,
    branch.strategyId,
    "HISTORICAL_NO_TEMPLATE",
  );
  const candidate = runTrace(
    createF05Fix7PoliticalInteractionScenario(),
    context,
    branch.strategyId,
    branch.mode === "PROPOSAL_IGNORE" || branch.mode === "PROPOSAL_REJECT"
      ? branch.mode
      : (() => {
          throw new Error(`Unexpected non-accept mode ${branch.mode}.`);
        })(),
  );
  const first = firstChangedObservation(integrationControl, candidate);
  const historicalFirst = firstChangedObservation(
    historicalRunner,
    integrationControl,
  );
  const sameNonProposalStateThroughHorizon =
    nonProposalStateEqualThroughHorizon(integrationControl, candidate);
  const rawControlStateGroundedSilenceDays = longestSilence(
    rawStateGroundedTicks(integrationControl),
    integrationControl.run.executedTicks,
  );
  const rawCandidateStateGroundedSilenceDays = longestSilence(
    rawStateGroundedTicks(candidate),
    candidate.run.executedTicks,
  );
  const rawStateGroundedMetricEqual =
    rawControlStateGroundedSilenceDays === rawCandidateStateGroundedSilenceDays;
  const historicalVsIntegrationEqualThroughFirstDivergence =
    historicalFirst.relativeTick === null ||
    historicalFirst.relativeTick === first.relativeTick;
  if (
    first.baseline === null ||
    first.candidate === null ||
    first.relativeTick === null
  ) {
    throw new Error(
      `Expected a raw divergence for ${branchKey(branch.contextId, branch.strategyId)}.`,
    );
  }
  const categories = [
    stableJson(first.baseline.actions) !== stableJson(first.candidate.actions)
      ? "accepted ActionRecord stream differs"
      : "accepted ActionRecord stream equal",
    stableJson(first.baseline.carriedFactionActions) !==
    stableJson(first.candidate.carriedFactionActions)
      ? "carried faction actions differ"
      : "carried faction actions equal",
    stableJson(first.baseline.events) !== stableJson(first.candidate.events)
      ? "phase output events differ"
      : "phase output events equal",
    stableJson(first.baseline.worldCore) !==
    stableJson(first.candidate.worldCore)
      ? "authoritative WorldState core differs"
      : "authoritative WorldState core equal",
    stableJson(first.baseline.interventionState) !==
    stableJson(first.candidate.interventionState)
      ? "intervention feasibility/commitment differs"
      : "intervention feasibility/commitment equal",
    stableJson(first.baseline.proposalState) !==
    stableJson(first.candidate.proposalState)
      ? "proposal state differs"
      : "proposal state equal",
    stableJson(first.baseline.agendaInput) !==
    stableJson(first.candidate.agendaInput)
      ? "Agenda inputs differ"
      : "Agenda inputs equal",
    stableJson(first.baseline.measurementInput) !==
    stableJson(first.candidate.measurementInput)
      ? "reassessment measurement inputs differ"
      : "reassessment measurement inputs equal",
  ];
  return {
    contextId: branch.contextId,
    strategyId: branch.strategyId,
    matchingF05Fix7Branch: branch,
    historicalF05Branch: historicalBranch,
    firstDivergenceRelativeTick: first.relativeTick,
    firstDivergenceAbsoluteTick: context.checkpointTick + first.relativeTick,
    firstDivergenceCategories: categories,
    firstDivergenceActionRecords: first.candidate.actions,
    firstDivergenceCarriedFactionActions: first.candidate.carriedFactionActions,
    firstDivergenceEvents: first.candidate.events,
    firstDivergenceNonProposalEvents: first.candidate.nonProposalEvents,
    firstDivergenceWorldCoreChanged:
      stableJson(first.baseline.worldCore) !==
      stableJson(first.candidate.worldCore),
    firstDivergenceInterventionStateChanged:
      stableJson(first.baseline.interventionState) !==
      stableJson(first.candidate.interventionState),
    firstDivergenceProposalStateChanged:
      stableJson(first.baseline.proposalState) !==
      stableJson(first.candidate.proposalState),
    firstDivergenceAgendaInputChanged:
      stableJson(first.baseline.agendaInput) !==
      stableJson(first.candidate.agendaInput),
    firstDivergenceMeasurementInputChanged:
      stableJson(first.baseline.measurementInput) !==
      stableJson(first.candidate.measurementInput),
    nonProposalStateEqualThroughHorizon: sameNonProposalStateThroughHorizon,
    rawControlStateGroundedSilenceDays,
    rawCandidateStateGroundedSilenceDays,
    rawStateGroundedMetricEqual,
    historicalVsIntegrationRunnerEqualThroughFirstDivergence:
      historicalVsIntegrationEqualThroughFirstDivergence,
    classification: classifyDivergence(
      first.baseline,
      first.candidate,
      historicalVsIntegrationEqualThroughFirstDivergence,
      sameNonProposalStateThroughHorizon,
      rawStateGroundedMetricEqual,
      true,
    ),
    pairedControlConclusion:
      historicalFirst.relativeTick === null
        ? "historical F05 runner and integration no-template runner stayed equal"
        : `historical F05 runner vs integration runner first differs at relative tick ${historicalFirst.relativeTick}`,
  };
}

function classificationCounts(
  divergences: readonly F05Fix8DivergenceEvidence[],
): Readonly<Record<DivergenceClassification, number>> {
  const counts: Record<DivergenceClassification, number> = {
    ORCHESTRATION_ORDER_EFFECT: 0,
    RUNNER_IMPLEMENTATION_ARTIFACT: 0,
    PROPOSAL_STATE_HAS_REAL_EXISTING_CONSUMER: 0,
    MEASUREMENT_SIGNATURE_ARTIFACT: 0,
    EXPECTED_EXISTING_SYSTEM_INTERACTION: 0,
    UNRESOLVED: 0,
  };
  for (const divergence of divergences) counts[divergence.classification] += 1;
  return counts;
}

function formatEvidence(evidence: F05Fix8DivergenceEvidence): string {
  const branch = evidence.matchingF05Fix7Branch;
  return [
    `${evidence.contextId} | ${evidence.strategyId} | ${branch.mode}`,
    `first=${evidence.firstDivergenceRelativeTick} (absolute ${evidence.firstDivergenceAbsoluteTick})`,
    `classification=${evidence.classification}`,
    `core=${evidence.firstDivergenceWorldCoreChanged ? "DIFF" : "SAME"}`,
    `intervention=${evidence.firstDivergenceInterventionStateChanged ? "DIFF" : "SAME"}`,
    `proposal=${evidence.firstDivergenceProposalStateChanged ? "DIFF" : "SAME"}`,
    `agenda=${evidence.firstDivergenceAgendaInputChanged ? "DIFF" : "SAME"}`,
    `measurement=${evidence.firstDivergenceMeasurementInputChanged ? "DIFF" : "SAME"}`,
    `nonProposalHorizon=${evidence.nonProposalStateEqualThroughHorizon ? "SAME" : "DIFF"}`,
    `rawStateSilence=${evidence.rawControlStateGroundedSilenceDays}/${evidence.rawCandidateStateGroundedSilenceDays}d`,
    `fix7VsF05Silence=${evidence.matchingF05Fix7Branch.stateGroundedLongestReassessmentSilenceDays}/${evidence.historicalF05Branch.longestReassessmentSilenceDays}d`,
    `actions=${evidence.firstDivergenceActionRecords.map((action) => `${String(action.sequence)}:${String(action.actionType)}`).join(",") || "none"}`,
    `events=${evidence.firstDivergenceEvents.map((event) => `${String(event.sequence)}:${String(event.type)}`).join(",") || "none"}`,
    evidence.pairedControlConclusion,
  ].join(" | ");
}

export function runF05Fix8NonAcceptDivergenceAudit(
  seed = F05_FIX8_AUDIT_SEED,
): F05Fix8NonAcceptDivergenceAuditResult {
  const historicalF05Baseline = runF05PacingFunDecision(seed);
  const integration = runF05Fix7InteractionIntegration(seed);
  const targets = collectTargetBranches(integration);
  const divergences = targets.map((branch) =>
    buildEvidence(historicalF05Baseline, branch),
  );
  const counts = classificationCounts(divergences);
  const allResolved = divergences.every(
    (divergence) => divergence.classification !== "UNRESOLVED",
  );
  const phaseAClassification: F05Fix8NonAcceptDivergenceAuditResult["phaseAClassification"] =
    allResolved && targets.length === 0
      ? "ORCHESTRATION_ARTIFACT_FIXED"
      : !allResolved
        ? "UNRESOLVED"
        : counts.RUNNER_IMPLEMENTATION_ARTIFACT > 0
          ? "ORCHESTRATION_ARTIFACT_FIXED"
          : counts.MEASUREMENT_SIGNATURE_ARTIFACT > 0 &&
              counts.EXPECTED_EXISTING_SYSTEM_INTERACTION > 0
            ? "MIXED_EXPLAINED"
            : counts.EXPECTED_EXISTING_SYSTEM_INTERACTION > 0
              ? "EXPECTED_CAUSAL"
              : "MIXED_EXPLAINED";
  const output = [
    "F05_FIX8 NON-ACCEPT DIVERGENCE AUDIT",
    `seed=${seed} horizon=${F05_FIX8_AUDIT_HORIZON_DAYS}d`,
    `historical baseline=${historicalF05Baseline.recommendation} branches=${historicalF05Baseline.contexts.flatMap((context) => context.branches).length}`,
    `pre-fix observed divergences=${PRE_FIX_OBSERVED_DIVERGENCES.length} ignore=4 reject=4`,
    `post-fix divergences=${divergences.length} ignore=${divergences.filter((item) => item.matchingF05Fix7Branch.mode === "PROPOSAL_IGNORE").length} reject=${divergences.filter((item) => item.matchingF05Fix7Branch.mode === "PROPOSAL_REJECT").length}`,
    `classification counts=${Object.entries(counts)
      .map(([key, value]) => `${key}=${value}`)
      .join(" ")}`,
    `PHASE_A=${phaseAClassification}`,
    ...PRE_FIX_OBSERVED_DIVERGENCES.map(
      (item) =>
        `PRE_FIX ${item.contextId} | ${item.strategyId} | ${item.mode} | first=${item.firstRelativeTick} (absolute ${item.firstAbsoluteTick}) | fix7Silence=${item.f05Fix7SilenceDays}d historical=${item.historicalF05SilenceDays}d | classification=${item.classification}`,
    ),
    ...divergences.map(formatEvidence),
  ].join("\n");
  return {
    seed,
    horizonDays: F05_FIX8_AUDIT_HORIZON_DAYS,
    historicalF05Baseline,
    historicalBaselineUnchanged:
      historicalF05Baseline.recommendation === "NOT_READY" &&
      historicalF05Baseline.contexts.flatMap((context) => context.branches)
        .length === 36,
    nonAcceptDivergenceCount: divergences.length,
    preFixObservedDivergenceCount: PRE_FIX_OBSERVED_DIVERGENCES.length,
    preFixObservedDivergences: PRE_FIX_OBSERVED_DIVERGENCES,
    ignoreDivergenceCount: divergences.filter(
      (item) => item.matchingF05Fix7Branch.mode === "PROPOSAL_IGNORE",
    ).length,
    rejectDivergenceCount: divergences.filter(
      (item) => item.matchingF05Fix7Branch.mode === "PROPOSAL_REJECT",
    ).length,
    divergences,
    classificationCounts: counts,
    allResolved,
    phaseAClassification,
    output,
  };
}

export function printF05Fix8NonAcceptDivergenceAudit(): void {
  console.log(runF05Fix8NonAcceptDivergenceAudit().output);
}
