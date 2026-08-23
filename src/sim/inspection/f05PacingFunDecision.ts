import type { GameEvent, GameEventType } from "../events/event";
import type { RunRecord } from "../core/step";
import {
  createF03StartingRecord,
  F03_DEFAULT_SEED,
  F03_DAYS_PER_YEAR,
  runF03StrategyFromRecord,
  type F03MetricSnapshot,
  type F03StrategyRunResult,
} from "./f03InterventionCounterfactuals";
import {
  createF04DValidationScenario,
  F04D_VALIDATION_INTERVENTION_IDS,
} from "../state/gate1fValidationFixture";
import { POLITICAL_CRISIS_FIXTURE_FACTION_IDS } from "../state/politicalCrisisFixture";
import type { InterventionId } from "../state/ids";
import {
  evaluateInterventionFeasibility,
  type InterventionFeasibilityResult,
} from "../state/intervention";
import type { ScenarioDefinition } from "../state/scenario";
import type { WorldState } from "../state/world";
import {
  deriveNationalAgendas,
  type AgendaKind,
  type AgendaSeverityBand,
} from "../readModels/agenda";

export const F05_DEFAULT_SEED = F03_DEFAULT_SEED;
export const F05_HORIZON_YEARS = 5 as const;
export const F05_DECISION_SAMPLE_DAYS = 90 as const;
export const F05_AGENDA_SAMPLE_DAYS = 30 as const;

export const F05_STRATEGY_IDS = {
  wait: "WAIT",
  materialRelief: "MATERIAL_RELIEF",
  politicalAccommodation: "POLITICAL_ACCOMMODATION",
  oppositionLegalization: "OPPOSITION_LEGALIZATION",
  coerciveRestriction: "COERCIVE_RESTRICTION",
  repeatedAccommodation: "REPEATED_POLITICAL_ACCOMMODATION",
} as const;

export type F05StrategyId =
  (typeof F05_STRATEGY_IDS)[keyof typeof F05_STRATEGY_IDS];

export type F05ContextFamily =
  "EARLY_PREVENTIVE" | "NEAR_CRISIS" | "ACTIVE_CONFLICT_RECOVERY";

export interface F05ContextDefinition {
  readonly id: string;
  readonly family: F05ContextFamily;
  readonly checkpointTick: number;
  readonly primary: boolean;
  readonly neighboringContextId: string;
}

export const F05_CONTEXTS: readonly F05ContextDefinition[] = [
  {
    id: "EARLY_PREVENTIVE_T0",
    family: "EARLY_PREVENTIVE",
    checkpointTick: 0,
    primary: true,
    neighboringContextId: "EARLY_PREVENTIVE_T1",
  },
  {
    id: "EARLY_PREVENTIVE_T1",
    family: "EARLY_PREVENTIVE",
    checkpointTick: 1,
    primary: false,
    neighboringContextId: "EARLY_PREVENTIVE_T0",
  },
  {
    id: "NEAR_CRISIS_T18",
    family: "NEAR_CRISIS",
    checkpointTick: 18,
    primary: true,
    neighboringContextId: "NEAR_CRISIS_T19",
  },
  {
    id: "NEAR_CRISIS_T19",
    family: "NEAR_CRISIS",
    checkpointTick: 19,
    primary: false,
    neighboringContextId: "NEAR_CRISIS_T18",
  },
  {
    id: "ACTIVE_CONFLICT_RECOVERY_T180",
    family: "ACTIVE_CONFLICT_RECOVERY",
    checkpointTick: 180,
    primary: true,
    neighboringContextId: "ACTIVE_CONFLICT_RECOVERY_T181",
  },
  {
    id: "ACTIVE_CONFLICT_RECOVERY_T181",
    family: "ACTIVE_CONFLICT_RECOVERY",
    checkpointTick: 181,
    primary: false,
    neighboringContextId: "ACTIVE_CONFLICT_RECOVERY_T180",
  },
] as const;

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

const REQUIRED_RESPONSE_IDS = [
  F05_STRATEGY_IDS.materialRelief,
  F05_STRATEGY_IDS.politicalAccommodation,
  F05_STRATEGY_IDS.oppositionLegalization,
  F05_STRATEGY_IDS.coerciveRestriction,
] as const;

const CRISIS_EVENT_TYPES = new Set<GameEventType>([
  "COUP_ATTEMPT_STARTED",
  "REBELLION_STARTED",
  "CIVIL_WAR_STARTED",
]);

const PACING_EVENT_TYPES = new Set<GameEventType>([
  "INTERVENTION_STARTED",
  "INTERVENTION_COMPLETED",
  "INSTITUTION_RULE_CHANGED",
  "RESOURCE_SHORTAGE_CHANGED",
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

export type F05WaitClassification =
  "WAIT_WORSE" | "TRADEOFF" | "WAIT_WEAKLY_DOMINANT" | "WAIT_STRONGLY_DOMINANT";

export type F05AccommodationClassification =
  | "NOT_DOMINANT"
  | "CONDITIONALLY_STRONG"
  | "DOMINANCE_CANDIDATE"
  | "CLEARLY_DOMINANT";

export type F05ActionStrength =
  | "UNAVAILABLE"
  | "INEFFECTIVE_OR_COST_ONLY"
  | "MEANINGFUL_TRADEOFF"
  | "STRONG_IMPROVEMENT";

export type F05Recommendation = "PASS" | "PASS_WITH_NOTES" | "NOT_READY";

export type F05SilenceDiagnosis =
  "MEASUREMENT_GAP" | "SIMULATION_GAP" | "MIXED_GAP";

export interface F05DecisionSample {
  readonly relativeTick: number;
  readonly feasibleResponses: readonly F05StrategyId[];
  readonly signature: string;
}

export interface F05AgendaEntry {
  readonly id: string;
  readonly kind: AgendaKind;
  readonly severity: number;
  readonly severityBand: AgendaSeverityBand | "unknown";
  readonly involvedFactionIds: readonly string[];
}

export interface F05AgendaSample {
  readonly relativeTick: number;
  readonly agendas: readonly F05AgendaEntry[];
  readonly signature: string;
}

export interface F05ReassessmentSignal {
  readonly relativeTick: number;
  readonly kind: "PACING_EVENT" | "AGENDA_CHANGE" | "DECISION_CHANGE";
  readonly detail: string;
}

export interface F05SilenceRange {
  readonly minimumDays: number;
  readonly maximumDays: number;
}

export interface F05EventCluster {
  readonly startRelativeTick: number;
  readonly endRelativeTick: number;
  readonly eventCount: number;
  readonly eventTypes: readonly GameEventType[];
}

export interface F05BranchMeasurement {
  readonly contextId: string;
  readonly strategyId: F05StrategyId;
  readonly interventionId: InterventionId | null;
  readonly horizonYears: number;
  readonly executedTicks: number;
  readonly feasibleAtStart: boolean;
  readonly startFeasibilityReasons: readonly string[];
  readonly actionAttempts: number;
  readonly actionStarts: number;
  readonly actionCompletions: number;
  readonly actionRejections: number;
  readonly firstCrisisRelativeTick: number | null;
  readonly lastPacingEventRelativeTick: number | null;
  readonly longestPoliticalSilenceDays: number;
  readonly longestReassessmentSilenceDays: number;
  readonly eventClusters: readonly F05EventCluster[];
  readonly decisionSamples: readonly F05DecisionSample[];
  readonly decisionWindowChanges: number;
  readonly agendaSamples: readonly F05AgendaSample[];
  readonly agendaChangeTicks: readonly number[];
  readonly firstCriticalRebellionAgendaRelativeTick: number | null;
  readonly firstCriticalCoupAgendaRelativeTick: number | null;
  readonly reassessmentSignals: readonly F05ReassessmentSignal[];
  readonly causedPacingEventCount: number;
  readonly causalTraceExamples: readonly string[];
  readonly finalPoliticalCompetition: string;
  readonly finalPressFreedom: string;
  readonly yearlyArc: readonly F03MetricSnapshot[];
  readonly start: F03MetricSnapshot;
  readonly final: F03MetricSnapshot;
  readonly trajectorySignature: string;
  readonly actionStrength: F05ActionStrength;
  readonly benefitsVersusWait: readonly string[];
  readonly tradeoffsVersusWait: readonly string[];
}

export interface F05ContextAssessment {
  readonly context: F05ContextDefinition;
  readonly start: F03MetricSnapshot;
  readonly branches: readonly F05BranchMeasurement[];
  readonly waitClassification: F05WaitClassification;
  readonly distinctHistoryCount: number;
  readonly activeHistoriesDifferentFromWait: number;
  readonly meaningfulResponseCount: number;
  readonly choiceDrivenHistory: boolean;
  readonly readableArc: boolean;
  readonly visibleCausality: boolean;
  readonly longestPoliticalSilenceDays: number;
  readonly longestReassessmentSilenceDays: number;
}

export interface F05AdjacentTimingAssessment {
  readonly family: F05ContextFamily;
  readonly primaryContextId: string;
  readonly neighborContextId: string;
  readonly divergentStrategyCount: number;
  readonly terminalOutcomeChangeCount: number;
  readonly firstCrisisTimingChangeCount: number;
  readonly classification: "STABLE" | "MEANINGFUL_TIMING" | "CLIFF_CANDIDATE";
}

export interface F05PacingFunResult {
  readonly scenarioId: string;
  readonly seed: number;
  readonly horizonYears: number;
  readonly contexts: readonly F05ContextAssessment[];
  readonly adjacentTiming: readonly F05AdjacentTimingAssessment[];
  readonly accommodationClassification: F05AccommodationClassification;
  readonly representativeWaitClassifications: Readonly<
    Record<F05ContextFamily, F05WaitClassification>
  >;
  readonly choiceDrivenHistories: boolean;
  readonly actionTradeoffsPresent: boolean;
  readonly pacingArcReadable: boolean;
  readonly causalHistoriesVisible: boolean;
  readonly silenceDiagnosis: F05SilenceDiagnosis;
  readonly previousMajorEventSilence: F05SilenceRange;
  readonly repairedReassessmentSilence: F05SilenceRange;
  readonly recommendation: F05Recommendation;
  readonly findings: readonly string[];
  readonly exactFixesIfNotReady: readonly string[];
}

export interface F05InspectionReport {
  readonly result: F05PacingFunResult;
  readonly output: string;
}

interface BranchVector {
  readonly treasury: number;
  readonly instability: number;
  readonly unrest: number;
  readonly scarcity: number;
  readonly grievance: number;
  readonly organization: number;
  readonly controlledLandHexes: number;
  readonly activeConflicts: number;
  readonly crisisDelay: number;
  readonly rebellionPressureDelay: number;
  readonly coupPressureDelay: number;
  readonly outcomeRank: number;
}

function feasibilityReason(
  reason: InterventionFeasibilityResult["reasons"][number],
): string {
  return reason.kind;
}

function responseAvailability(
  scenario: ScenarioDefinition,
  world: WorldState,
): readonly F05StrategyId[] {
  const countryId = scenario.playerCountryId;
  if (countryId === null) {
    throw new Error("F05 requires a player country.");
  }

  return REQUIRED_RESPONSE_IDS.filter(
    (strategyId) =>
      evaluateInterventionFeasibility({
        scenario,
        world,
        interventionId: RESPONSE_INTERVENTIONS[strategyId]!,
        countryId,
      }).feasible,
  );
}

function eventRelativeTick(event: GameEvent, startTick: number): number {
  return event.tick - startTick;
}

function eventTrace(event: GameEvent, startTick: number): string {
  const causes = event.causeIds.map(String).join(",") || "state-threshold";
  return `${eventRelativeTick(event, startTick)}:${event.type}:${String(event.targetId ?? "none")}<-${causes}`;
}

function buildEventClusters(
  events: readonly GameEvent[],
  startTick: number,
): readonly F05EventCluster[] {
  const pacingEvents = events
    .filter((event) => PACING_EVENT_TYPES.has(event.type))
    .sort(
      (first, second) =>
        first.tick - second.tick || first.sequence - second.sequence,
    );
  const clusters: F05EventCluster[] = [];

  for (const event of pacingEvents) {
    const relativeTick = eventRelativeTick(event, startTick);
    const previous = clusters.at(-1);
    if (
      previous === undefined ||
      relativeTick - previous.endRelativeTick > 30
    ) {
      clusters.push({
        startRelativeTick: relativeTick,
        endRelativeTick: relativeTick,
        eventCount: 1,
        eventTypes: [event.type],
      });
      continue;
    }
    clusters[clusters.length - 1] = {
      startRelativeTick: previous.startRelativeTick,
      endRelativeTick: relativeTick,
      eventCount: previous.eventCount + 1,
      eventTypes: [...new Set([...previous.eventTypes, event.type])],
    };
  }

  return clusters;
}

function longestSilenceDays(
  events: readonly GameEvent[],
  startTick: number,
  executedTicks: number,
): number {
  const ticks = [
    0,
    ...events
      .filter((event) => PACING_EVENT_TYPES.has(event.type))
      .map((event) => eventRelativeTick(event, startTick)),
    executedTicks,
  ].sort((first, second) => first - second);
  let longest = 0;
  for (let index = 1; index < ticks.length; index += 1) {
    longest = Math.max(longest, ticks[index]! - ticks[index - 1]!);
  }
  return longest;
}

function agendaSample(
  scenario: ScenarioDefinition,
  world: WorldState,
  events: readonly GameEvent[],
  relativeTick: number,
): F05AgendaSample {
  const agendas = deriveNationalAgendas({
    scenario,
    world,
    recentEvents: events,
  }).map((agenda): F05AgendaEntry => ({
    id: agenda.id,
    kind: agenda.kind,
    severity: agenda.severity,
    severityBand: agenda.severityBand ?? "unknown",
    involvedFactionIds: agenda.involvedFactionIds.map(String),
  }));
  return {
    relativeTick,
    agendas,
    // Agenda order is itself meaningful because the read model is prioritized.
    signature:
      agendas
        .map((agenda) => `${agenda.id}:${agenda.severityBand}`)
        .join(",") || "NONE",
  };
}

function changedSampleTicks(
  samples: readonly {
    readonly relativeTick: number;
    readonly signature: string;
  }[],
): readonly number[] {
  return samples.flatMap((sample, index) =>
    index > 0 && sample.signature !== samples[index - 1]!.signature
      ? [sample.relativeTick]
      : [],
  );
}

function firstCriticalFactionAgendaTick(
  samples: readonly F05AgendaSample[],
  factionId: string,
): number | null {
  return (
    samples.find((sample) =>
      sample.agendas.some(
        (agenda) =>
          agenda.kind === "factionPressure" &&
          agenda.severityBand === "critical" &&
          agenda.involvedFactionIds.includes(factionId),
      ),
    )?.relativeTick ?? null
  );
}

function buildReassessmentSignals(
  eventClusters: readonly F05EventCluster[],
  agendaSamples: readonly F05AgendaSample[],
  decisionSamples: readonly F05DecisionSample[],
): readonly F05ReassessmentSignal[] {
  const signals: F05ReassessmentSignal[] = eventClusters.map((cluster) => ({
    relativeTick: cluster.endRelativeTick,
    kind: "PACING_EVENT",
    detail: cluster.eventTypes.join(","),
  }));
  for (let index = 1; index < agendaSamples.length; index += 1) {
    const current = agendaSamples[index]!;
    const previous = agendaSamples[index - 1]!;
    if (current.signature !== previous.signature) {
      signals.push({
        relativeTick: current.relativeTick,
        kind: "AGENDA_CHANGE",
        detail: `${previous.signature}->${current.signature}`,
      });
    }
  }
  for (let index = 1; index < decisionSamples.length; index += 1) {
    const current = decisionSamples[index]!;
    const previous = decisionSamples[index - 1]!;
    if (current.signature !== previous.signature) {
      signals.push({
        relativeTick: current.relativeTick,
        kind: "DECISION_CHANGE",
        detail: `${previous.signature}->${current.signature}`,
      });
    }
  }
  return signals.sort(
    (first, second) =>
      first.relativeTick - second.relativeTick ||
      first.kind.localeCompare(second.kind) ||
      first.detail.localeCompare(second.detail),
  );
}

function longestReassessmentSilenceDays(
  signals: readonly F05ReassessmentSignal[],
  executedTicks: number,
): number {
  const ticks = [
    0,
    ...new Set(signals.map((signal) => signal.relativeTick)),
    executedTicks,
  ].sort((first, second) => first - second);
  let longest = 0;
  for (let index = 1; index < ticks.length; index += 1) {
    longest = Math.max(longest, ticks[index]! - ticks[index - 1]!);
  }
  return longest;
}

function outcomeRank(outcome: F03MetricSnapshot["outcome"]): number {
  switch (outcome) {
    case "orderConsolidated":
      return 2;
    case "active":
      return 1;
    case "stateDissolved":
      return 0;
  }
}

function branchVector(branch: F05BranchMeasurement): BranchVector {
  return {
    treasury: branch.final.treasury,
    instability: branch.final.instability,
    unrest: branch.final.maxRegionUnrest,
    scarcity: branch.final.maxRegionScarcity,
    grievance: branch.final.factionGrievance,
    organization: branch.final.factionOrganization,
    controlledLandHexes: branch.final.controlledLandHexes,
    activeConflicts: branch.final.activeConflicts,
    crisisDelay: branch.firstCrisisRelativeTick ?? branch.executedTicks + 1,
    rebellionPressureDelay:
      branch.firstCriticalRebellionAgendaRelativeTick ??
      branch.executedTicks + 1,
    coupPressureDelay:
      branch.firstCriticalCoupAgendaRelativeTick ?? branch.executedTicks + 1,
    outcomeRank: outcomeRank(branch.final.outcome),
  };
}

function compareVectors(
  candidate: BranchVector,
  reference: BranchVector,
): { readonly better: readonly string[]; readonly worse: readonly string[] } {
  const better: string[] = [];
  const worse: string[] = [];
  const compareHigher = (label: string, first: number, second: number) => {
    if (first > second + 1e-9) better.push(label);
    if (first < second - 1e-9) worse.push(label);
  };
  const compareLower = (label: string, first: number, second: number) => {
    if (first < second - 1e-9) better.push(label);
    if (first > second + 1e-9) worse.push(label);
  };

  compareHigher("treasury", candidate.treasury, reference.treasury);
  compareLower("instability", candidate.instability, reference.instability);
  compareLower("regional unrest", candidate.unrest, reference.unrest);
  compareLower("scarcity", candidate.scarcity, reference.scarcity);
  compareLower("faction grievance", candidate.grievance, reference.grievance);
  compareLower(
    "faction organization",
    candidate.organization,
    reference.organization,
  );
  compareHigher(
    "territorial control",
    candidate.controlledLandHexes,
    reference.controlledLandHexes,
  );
  compareLower(
    "active conflicts",
    candidate.activeConflicts,
    reference.activeConflicts,
  );
  compareHigher(
    "time before crisis",
    candidate.crisisDelay,
    reference.crisisDelay,
  );
  compareHigher(
    "time before critical rebellion pressure",
    candidate.rebellionPressureDelay,
    reference.rebellionPressureDelay,
  );
  compareHigher(
    "time before critical coup pressure",
    candidate.coupPressureDelay,
    reference.coupPressureDelay,
  );
  compareHigher(
    "terminal outcome",
    candidate.outcomeRank,
    reference.outcomeRank,
  );
  return { better, worse };
}

function dominates(
  candidate: F05BranchMeasurement,
  reference: F05BranchMeasurement,
): boolean {
  const comparison = compareVectors(
    branchVector(candidate),
    branchVector(reference),
  );
  return comparison.better.length > 0 && comparison.worse.length === 0;
}

function classifyStrength(
  branch: F05BranchMeasurement,
  wait: F05BranchMeasurement,
): Pick<
  F05BranchMeasurement,
  "actionStrength" | "benefitsVersusWait" | "tradeoffsVersusWait"
> {
  if (!branch.feasibleAtStart && branch.actionStarts === 0) {
    return {
      actionStrength: "UNAVAILABLE",
      benefitsVersusWait: [],
      tradeoffsVersusWait: [],
    };
  }
  const comparison = compareVectors(branchVector(branch), branchVector(wait));
  return {
    actionStrength:
      comparison.better.length === 0
        ? "INEFFECTIVE_OR_COST_ONLY"
        : comparison.worse.length === 0
          ? "STRONG_IMPROVEMENT"
          : "MEANINGFUL_TRADEOFF",
    benefitsVersusWait: comparison.better,
    tradeoffsVersusWait: comparison.worse,
  };
}

function startFeasibility(
  scenario: ScenarioDefinition,
  startingRecord: RunRecord,
  interventionId: InterventionId | null,
): InterventionFeasibilityResult | null {
  const countryId = scenario.playerCountryId;
  if (countryId === null || interventionId === null) return null;
  return evaluateInterventionFeasibility({
    scenario,
    world: startingRecord.world,
    interventionId,
    countryId,
  });
}

function trajectorySignature(
  run: F03StrategyRunResult,
  meaningfulEvents: readonly GameEvent[],
  agendaSamples: readonly F05AgendaSample[],
  finalPoliticalCompetition: string,
  finalPressFreedom: string,
): string {
  const history = meaningfulEvents
    .map(
      (event) =>
        `${eventRelativeTick(event, run.checkpointTick)}:${event.type}`,
    )
    .join(">");
  const agendaHistory = agendaSamples
    .filter(
      (sample, index) =>
        index === 0 || sample.signature !== agendaSamples[index - 1]!.signature,
    )
    .map((sample) => `${sample.relativeTick}:${sample.signature}`)
    .join(">");
  const final = run.final;
  return [
    history,
    agendaHistory,
    final.outcome,
    final.controlledLandHexes,
    final.activeConflicts,
    final.currentGovernmentId ?? "none",
    finalPoliticalCompetition,
    finalPressFreedom,
    final.factionGrievance.toFixed(3),
    final.factionOrganization.toFixed(3),
    final.maxRegionScarcity.toFixed(3),
  ].join("|");
}

function runBranch(
  scenario: ScenarioDefinition,
  context: F05ContextDefinition,
  startingRecord: RunRecord,
  strategyId: F05StrategyId,
): F05BranchMeasurement {
  const interventionId = RESPONSE_INTERVENTIONS[strategyId];
  const feasibility = startFeasibility(
    scenario,
    startingRecord,
    interventionId,
  );
  const decisionSamples: F05DecisionSample[] = [];
  const agendaSamples: F05AgendaSample[] = [];
  const run = runF03StrategyFromRecord(
    scenario,
    context.id,
    strategyId,
    startingRecord,
    F05_HORIZON_YEARS,
    ({ relativeTick }) => {
      if (strategyId === F05_STRATEGY_IDS.wait) return null;
      if (strategyId === F05_STRATEGY_IDS.repeatedAccommodation) {
        return relativeTick % F05_DECISION_SAMPLE_DAYS === 0
          ? interventionId
          : null;
      }
      return relativeTick === 0 ? interventionId : null;
    },
    {
      checkpointOffsets: [
        0,
        F03_DAYS_PER_YEAR,
        F03_DAYS_PER_YEAR * 2,
        F03_DAYS_PER_YEAR * 3,
        F03_DAYS_PER_YEAR * 4,
        F03_DAYS_PER_YEAR * 5,
      ],
      onObservation: ({ relativeTick, world, events }) => {
        if (relativeTick % F05_AGENDA_SAMPLE_DAYS === 0) {
          agendaSamples.push(
            agendaSample(scenario, world, events, relativeTick),
          );
        }
        if (relativeTick % F05_DECISION_SAMPLE_DAYS === 0) {
          const feasibleResponses = responseAvailability(scenario, world);
          decisionSamples.push({
            relativeTick,
            feasibleResponses,
            signature: feasibleResponses.join(",") || "NONE",
          });
        }
      },
    },
  );
  const meaningfulEvents = run.stepEvents.filter((event) =>
    PACING_EVENT_TYPES.has(event.type),
  );
  const pacingTicks = meaningfulEvents.map((event) =>
    eventRelativeTick(event, run.checkpointTick),
  );
  const eventClusters = buildEventClusters(run.stepEvents, run.checkpointTick);
  const agendaChangeTicks = changedSampleTicks(agendaSamples);
  const reassessmentSignals = buildReassessmentSignals(
    eventClusters,
    agendaSamples,
    decisionSamples,
  );
  const firstCrisis = run.stepEvents.find((event) =>
    CRISIS_EVENT_TYPES.has(event.type),
  );
  const countryId = scenario.playerCountryId!;
  const finalPolicy = run.finalRecord.world.policies[countryId];
  if (finalPolicy === undefined) {
    throw new Error("F05 final player policy state is missing.");
  }
  const actionAttempts = run.actionIds.length;
  const branch: F05BranchMeasurement = {
    contextId: context.id,
    strategyId,
    interventionId,
    horizonYears: F05_HORIZON_YEARS,
    executedTicks: run.executedTicks,
    feasibleAtStart: feasibility?.feasible ?? true,
    startFeasibilityReasons: feasibility?.reasons.map(feasibilityReason) ?? [],
    actionAttempts,
    actionStarts: run.eventSummary.interventionStarted,
    actionCompletions: run.eventSummary.interventionCompleted,
    actionRejections: run.eventSummary.interventionRejected,
    firstCrisisRelativeTick:
      firstCrisis === undefined
        ? null
        : eventRelativeTick(firstCrisis, run.checkpointTick),
    lastPacingEventRelativeTick: pacingTicks.at(-1) ?? null,
    longestPoliticalSilenceDays: longestSilenceDays(
      run.stepEvents,
      run.checkpointTick,
      run.executedTicks,
    ),
    longestReassessmentSilenceDays: longestReassessmentSilenceDays(
      reassessmentSignals,
      run.executedTicks,
    ),
    eventClusters,
    decisionSamples,
    decisionWindowChanges: decisionSamples.reduce(
      (changes, sample, index) =>
        index > 0 && sample.signature !== decisionSamples[index - 1]!.signature
          ? changes + 1
          : changes,
      0,
    ),
    agendaSamples,
    agendaChangeTicks,
    firstCriticalRebellionAgendaRelativeTick: firstCriticalFactionAgendaTick(
      agendaSamples,
      POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion,
    ),
    firstCriticalCoupAgendaRelativeTick: firstCriticalFactionAgendaTick(
      agendaSamples,
      POLITICAL_CRISIS_FIXTURE_FACTION_IDS.coup,
    ),
    reassessmentSignals,
    causedPacingEventCount: meaningfulEvents.filter(
      (event) =>
        event.causeIds.length > 0 ||
        event.type === "INTERVENTION_STARTED" ||
        event.type === "INTERVENTION_COMPLETED",
    ).length,
    causalTraceExamples: meaningfulEvents
      .slice(0, 8)
      .map((event) => eventTrace(event, run.checkpointTick)),
    finalPoliticalCompetition:
      finalPolicy.institutionalRules.politicalCompetition,
    finalPressFreedom: finalPolicy.institutionalRules.pressFreedom,
    yearlyArc: run.checkpoints,
    start: run.startSnapshot,
    final: run.final,
    trajectorySignature: trajectorySignature(
      run,
      meaningfulEvents,
      agendaSamples,
      finalPolicy.institutionalRules.politicalCompetition,
      finalPolicy.institutionalRules.pressFreedom,
    ),
    actionStrength: "INEFFECTIVE_OR_COST_ONLY",
    benefitsVersusWait: [],
    tradeoffsVersusWait: [],
  };
  return branch;
}

function requireBranch(
  branches: readonly F05BranchMeasurement[],
  strategyId: F05StrategyId,
): F05BranchMeasurement {
  const branch = branches.find(
    (candidate) => candidate.strategyId === strategyId,
  );
  if (branch === undefined)
    throw new Error(`Missing F05 branch ${strategyId}.`);
  return branch;
}

function classifyWait(
  branches: readonly F05BranchMeasurement[],
): F05WaitClassification {
  const wait = requireBranch(branches, F05_STRATEGY_IDS.wait);
  const active = branches.filter(
    (branch) =>
      branch.strategyId !== F05_STRATEGY_IDS.wait &&
      branch.strategyId !== F05_STRATEGY_IDS.repeatedAccommodation &&
      (branch.feasibleAtStart || branch.actionStarts > 0),
  );
  if (active.some((branch) => dominates(branch, wait))) return "WAIT_WORSE";
  const dominatedByWait = active.filter((branch) =>
    dominates(wait, branch),
  ).length;
  if (active.length > 0 && dominatedByWait === active.length) {
    return "WAIT_STRONGLY_DOMINANT";
  }
  if (dominatedByWait >= Math.ceil(active.length / 2)) {
    return "WAIT_WEAKLY_DOMINANT";
  }
  return "TRADEOFF";
}

function assessContext(
  scenario: ScenarioDefinition,
  context: F05ContextDefinition,
  startingRecord: RunRecord,
): F05ContextAssessment {
  const rawBranches = Object.values(F05_STRATEGY_IDS).map((strategyId) =>
    runBranch(scenario, context, startingRecord, strategyId),
  );
  const wait = requireBranch(rawBranches, F05_STRATEGY_IDS.wait);
  const branches = rawBranches.map((branch) =>
    branch.strategyId === F05_STRATEGY_IDS.wait
      ? branch
      : { ...branch, ...classifyStrength(branch, wait) },
  );
  const waitSignature = wait.trajectorySignature;
  const activeBranches = branches.filter(
    (branch) =>
      branch.strategyId !== F05_STRATEGY_IDS.wait &&
      branch.strategyId !== F05_STRATEGY_IDS.repeatedAccommodation,
  );
  const meaningfulResponseCount = activeBranches.filter(
    (branch) =>
      branch.actionStrength === "MEANINGFUL_TRADEOFF" ||
      branch.actionStrength === "STRONG_IMPROVEMENT",
  ).length;
  const distinctHistoryCount = new Set(
    branches.map((branch) => branch.trajectorySignature),
  ).size;
  const activeHistoriesDifferentFromWait = activeBranches.filter(
    (branch) => branch.trajectorySignature !== waitSignature,
  ).length;
  const longestPoliticalSilence = Math.max(
    ...branches.map((branch) => branch.longestPoliticalSilenceDays),
  );
  const longestReassessmentSilence = Math.max(
    ...branches.map((branch) => branch.longestReassessmentSilenceDays),
  );
  const boundedSingleResponseBranches = branches.filter(
    (branch) => branch.strategyId !== F05_STRATEGY_IDS.repeatedAccommodation,
  );

  return {
    context,
    start: wait.start,
    branches,
    waitClassification: classifyWait(branches),
    distinctHistoryCount,
    activeHistoriesDifferentFromWait,
    meaningfulResponseCount,
    choiceDrivenHistory:
      distinctHistoryCount >= 3 && activeHistoriesDifferentFromWait >= 2,
    readableArc: boundedSingleResponseBranches.every(
      (branch) =>
        new Set(branch.reassessmentSignals.map((signal) => signal.relativeTick))
          .size >= 3 &&
        branch.longestReassessmentSilenceDays <= F03_DAYS_PER_YEAR * 2,
    ),
    visibleCausality:
      activeBranches.filter((branch) => branch.causedPacingEventCount > 0)
        .length >= 2,
    longestPoliticalSilenceDays: longestPoliticalSilence,
    longestReassessmentSilenceDays: longestReassessmentSilence,
  };
}

function assessAdjacentTiming(
  contexts: readonly F05ContextAssessment[],
): readonly F05AdjacentTimingAssessment[] {
  return contexts
    .filter((context) => context.context.primary)
    .map((primary) => {
      const neighbor = contexts.find(
        (candidate) =>
          candidate.context.id === primary.context.neighboringContextId,
      );
      if (neighbor === undefined) {
        throw new Error(
          `Missing neighboring context for ${primary.context.id}.`,
        );
      }
      let divergentStrategyCount = 0;
      let terminalOutcomeChangeCount = 0;
      let firstCrisisTimingChangeCount = 0;
      for (const strategyId of Object.values(F05_STRATEGY_IDS)) {
        const first = requireBranch(primary.branches, strategyId);
        const second = requireBranch(neighbor.branches, strategyId);
        const structuralSignature = (branch: F05BranchMeasurement) =>
          [
            branch.eventClusters
              .map((cluster) => cluster.eventTypes.join(","))
              .join(">"),
            branch.final.outcome,
            branch.final.controlledLandHexes,
            branch.final.activeConflicts,
            branch.final.currentGovernmentId ?? "none",
            branch.finalPoliticalCompetition,
            branch.finalPressFreedom,
            branch.final.factionGrievance.toFixed(3),
            branch.final.factionOrganization.toFixed(3),
            branch.final.maxRegionScarcity.toFixed(3),
            branch.final.maxRegionUnrest.toFixed(3),
          ].join("|");
        if (structuralSignature(first) !== structuralSignature(second)) {
          divergentStrategyCount += 1;
        }
        if (first.final.outcome !== second.final.outcome) {
          terminalOutcomeChangeCount += 1;
        }
        const firstAbsoluteCrisis =
          first.firstCrisisRelativeTick === null
            ? null
            : primary.context.checkpointTick + first.firstCrisisRelativeTick;
        const secondAbsoluteCrisis =
          second.firstCrisisRelativeTick === null
            ? null
            : neighbor.context.checkpointTick + second.firstCrisisRelativeTick;
        if (
          firstAbsoluteCrisis === null || secondAbsoluteCrisis === null
            ? firstAbsoluteCrisis !== secondAbsoluteCrisis
            : Math.abs(firstAbsoluteCrisis - secondAbsoluteCrisis) > 1
        ) {
          firstCrisisTimingChangeCount += 1;
        }
      }
      return {
        family: primary.context.family,
        primaryContextId: primary.context.id,
        neighborContextId: neighbor.context.id,
        divergentStrategyCount,
        terminalOutcomeChangeCount,
        firstCrisisTimingChangeCount,
        classification:
          terminalOutcomeChangeCount > 0
            ? "CLIFF_CANDIDATE"
            : divergentStrategyCount > 0 || firstCrisisTimingChangeCount > 0
              ? "MEANINGFUL_TIMING"
              : "STABLE",
      };
    });
}

function classifyAccommodation(
  primaryContexts: readonly F05ContextAssessment[],
): F05AccommodationClassification {
  let dominatesEveryBranchContexts = 0;
  let dominatesActiveAlternativesContexts = 0;
  let benefitVersusWaitContexts = 0;
  let tradeoffVersusWaitContexts = 0;

  for (const context of primaryContexts) {
    const accommodation = requireBranch(
      context.branches,
      F05_STRATEGY_IDS.politicalAccommodation,
    );
    const repeatedAccommodation = requireBranch(
      context.branches,
      F05_STRATEGY_IDS.repeatedAccommodation,
    );
    const wait = requireBranch(context.branches, F05_STRATEGY_IDS.wait);
    const activeAlternatives = context.branches.filter(
      (branch) =>
        branch.strategyId !== F05_STRATEGY_IDS.wait &&
        branch.strategyId !== F05_STRATEGY_IDS.politicalAccommodation &&
        branch.strategyId !== F05_STRATEGY_IDS.repeatedAccommodation,
    );
    if (
      context.branches
        .filter(
          (branch) =>
            branch.strategyId !== F05_STRATEGY_IDS.politicalAccommodation &&
            branch.strategyId !== F05_STRATEGY_IDS.repeatedAccommodation,
        )
        .every((branch) => dominates(accommodation, branch))
    ) {
      dominatesEveryBranchContexts += 1;
    }
    if (
      activeAlternatives.every((branch) => dominates(accommodation, branch))
    ) {
      dominatesActiveAlternativesContexts += 1;
    }
    const singleComparison = compareVectors(
      branchVector(accommodation),
      branchVector(wait),
    );
    const repeatedComparison = compareVectors(
      branchVector(repeatedAccommodation),
      branchVector(wait),
    );
    const strongestComparison =
      repeatedComparison.better.length > singleComparison.better.length
        ? repeatedComparison
        : singleComparison;
    if (strongestComparison.better.length > 0) benefitVersusWaitContexts += 1;
    if (strongestComparison.worse.length > 0) tradeoffVersusWaitContexts += 1;
  }

  if (dominatesEveryBranchContexts === primaryContexts.length) {
    return "CLEARLY_DOMINANT";
  }
  if (
    dominatesActiveAlternativesContexts >= 2 &&
    benefitVersusWaitContexts === primaryContexts.length
  ) {
    return "DOMINANCE_CANDIDATE";
  }
  if (benefitVersusWaitContexts >= 2 && tradeoffVersusWaitContexts >= 1) {
    return "CONDITIONALLY_STRONG";
  }
  return "NOT_DOMINANT";
}

function buildFindings(
  primaryContexts: readonly F05ContextAssessment[],
  adjacentTiming: readonly F05AdjacentTimingAssessment[],
  accommodation: F05AccommodationClassification,
): readonly string[] {
  const findings: string[] = [
    "Silence diagnosis: MIXED_GAP repaired; unresolved full territorial displacement under an active internal rebellion now reaches the existing state-continuity dissolution consumer instead of remaining inert.",
    `Accommodation classification: ${accommodation}.`,
    `Representative WAIT classes: ${primaryContexts
      .map(
        (context) => `${context.context.family}=${context.waitClassification}`,
      )
      .join(", ")}.`,
    `Distinct representative histories: ${primaryContexts
      .map(
        (context) =>
          `${context.context.family}=${context.distinctHistoryCount}`,
      )
      .join(", ")}.`,
    `Previous major-event-only silence: ${Math.max(
      ...primaryContexts.map((context) => context.longestPoliticalSilenceDays),
    )} days.`,
    `Longest repaired reassessment silence: ${Math.max(
      ...primaryContexts.map(
        (context) => context.longestReassessmentSilenceDays,
      ),
    )} days.`,
    `One-day neighboring timing: ${adjacentTiming
      .map((assessment) => `${assessment.family}=${assessment.classification}`)
      .join(", ")}.`,
    `Repeated accommodation starts: ${primaryContexts
      .map((context) => {
        const branch = requireBranch(
          context.branches,
          F05_STRATEGY_IDS.repeatedAccommodation,
        );
        return `${context.context.family}=${branch.actionStarts}/${branch.actionAttempts}, strength=${branch.actionStrength}`;
      })
      .join("; ")}.`,
  ];
  return findings;
}

function chooseRecommendation(
  primaryContexts: readonly F05ContextAssessment[],
  adjacentTiming: readonly F05AdjacentTimingAssessment[],
  accommodation: F05AccommodationClassification,
): {
  readonly recommendation: F05Recommendation;
  readonly exactFixesIfNotReady: readonly string[];
} {
  const fixes: string[] = [];
  if (
    accommodation === "CLEARLY_DOMINANT" ||
    accommodation === "DOMINANCE_CANDIDATE"
  ) {
    fixes.push(
      "Narrow political accommodation's benefit, increase its concrete opportunity cost, or strengthen a context-specific alternative; then rerun the same F05 matrix.",
    );
  }
  const strongWait = primaryContexts.filter(
    (context) => context.waitClassification === "WAIT_STRONGLY_DOMINANT",
  );
  if (strongWait.length > 0) {
    fixes.push(
      `Add a measured cost of inaction or a worthwhile response in ${strongWait
        .map((context) => context.context.family)
        .join(", ")}; do not add a generic meter.`,
    );
  }
  const thinResponses = primaryContexts.filter(
    (context) => context.meaningfulResponseCount < 2,
  );
  if (thinResponses.length > 0) {
    fixes.push(
      `Make at least one additional existing response produce a distinct paid benefit in ${thinResponses
        .map((context) => context.context.family)
        .join(", ")}; preserve explicit treasury or institutional costs.`,
    );
  }
  const weakChoice = primaryContexts.filter(
    (context) => !context.choiceDrivenHistory,
  );
  if (weakChoice.length > 0) {
    fixes.push(
      `Create at least two causally distinct, paid response trajectories in ${weakChoice
        .map((context) => context.context.family)
        .join(", ")}.`,
    );
  }
  const unreadable = primaryContexts.filter((context) => !context.readableArc);
  if (unreadable.length > 0) {
    fixes.push(
      `Shorten the longest reassessment silence or expose another existing-system decision/consequence in ${unreadable
        .map((context) => context.context.family)
        .join(", ")}; retain the five-year horizon.`,
    );
  }
  const hiddenCausality = primaryContexts.filter(
    (context) => !context.visibleCausality,
  );
  if (hiddenCausality.length > 0) {
    fixes.push(
      `Expose existing event causes or completion-to-crisis traces in ${hiddenCausality
        .map((context) => context.context.family)
        .join(", ")}.`,
    );
  }
  if (fixes.length > 0) {
    return { recommendation: "NOT_READY", exactFixesIfNotReady: fixes };
  }
  if (
    accommodation === "CONDITIONALLY_STRONG" ||
    adjacentTiming.some(
      (assessment) => assessment.classification !== "STABLE",
    ) ||
    primaryContexts.some(
      (context) => context.longestReassessmentSilenceDays > F03_DAYS_PER_YEAR,
    )
  ) {
    return { recommendation: "PASS_WITH_NOTES", exactFixesIfNotReady: [] };
  }
  return { recommendation: "PASS", exactFixesIfNotReady: [] };
}

function silenceRange(values: readonly number[]): F05SilenceRange {
  return {
    minimumDays: Math.min(...values),
    maximumDays: Math.max(...values),
  };
}

export function runF05PacingFunDecision(
  seed = F05_DEFAULT_SEED,
): F05PacingFunResult {
  const scenario = createF04DValidationScenario();
  const contexts = F05_CONTEXTS.map((context) => {
    const startingRecord = createF03StartingRecord(
      scenario,
      seed,
      context.checkpointTick,
    );
    return assessContext(scenario, context, startingRecord);
  });
  const primaryContexts = contexts.filter((context) => context.context.primary);
  const adjacentTiming = assessAdjacentTiming(contexts);
  const accommodationClassification = classifyAccommodation(primaryContexts);
  const choiceDrivenHistories = primaryContexts.every(
    (context) => context.choiceDrivenHistory,
  );
  const actionTradeoffsPresent = primaryContexts.every(
    (context) => context.meaningfulResponseCount >= 2,
  );
  const pacingArcReadable = primaryContexts.every(
    (context) => context.readableArc,
  );
  const causalHistoriesVisible = primaryContexts.every(
    (context) => context.visibleCausality,
  );
  const judgment = chooseRecommendation(
    primaryContexts,
    adjacentTiming,
    accommodationClassification,
  );

  return {
    scenarioId: scenario.id,
    seed,
    horizonYears: F05_HORIZON_YEARS,
    contexts,
    adjacentTiming,
    accommodationClassification,
    representativeWaitClassifications: Object.fromEntries(
      primaryContexts.map((context) => [
        context.context.family,
        context.waitClassification,
      ]),
    ) as Readonly<Record<F05ContextFamily, F05WaitClassification>>,
    choiceDrivenHistories,
    actionTradeoffsPresent,
    pacingArcReadable,
    causalHistoriesVisible,
    silenceDiagnosis: "MIXED_GAP",
    previousMajorEventSilence: silenceRange(
      primaryContexts.map((context) => context.longestPoliticalSilenceDays),
    ),
    repairedReassessmentSilence: silenceRange(
      primaryContexts.map((context) => context.longestReassessmentSilenceDays),
    ),
    recommendation: judgment.recommendation,
    findings: buildFindings(
      primaryContexts,
      adjacentTiming,
      accommodationClassification,
    ),
    exactFixesIfNotReady: judgment.exactFixesIfNotReady,
  };
}

function formatMetric(snapshot: F03MetricSnapshot): string {
  return `Y${snapshot.simulatedYear.toFixed(1)} T=${snapshot.treasury.toFixed(0)} I=${snapshot.instability.toFixed(3)} U=${snapshot.maxRegionUnrest.toFixed(3)} S=${snapshot.maxRegionScarcity.toFixed(3)} G=${snapshot.factionGrievance.toFixed(3)} O=${snapshot.factionOrganization.toFixed(3)} H=${snapshot.controlledLandHexes} C=${snapshot.activeConflicts} ${snapshot.outcome}`;
}

function formatArcPoint(snapshot: F03MetricSnapshot): string {
  return `Y${snapshot.simulatedYear.toFixed(1)}[T${snapshot.treasury.toFixed(0)},I${snapshot.instability.toFixed(1)},U${snapshot.maxRegionUnrest.toFixed(2)},S${snapshot.maxRegionScarcity.toFixed(2)},H${snapshot.controlledLandHexes},C${snapshot.activeConflicts}]`;
}

export function formatF05Inspection(result: F05PacingFunResult): string {
  const lines: string[] = [
    "F05 HEADLESS PACING / FUN DECISION",
    `scenario=${result.scenarioId} seed=${result.seed} horizon=${result.horizonYears}y`,
    `silence diagnosis=${result.silenceDiagnosis}`,
    `old major-event silence=${result.previousMajorEventSilence.minimumDays}-${result.previousMajorEventSilence.maximumDays}d`,
    `repaired reassessment silence=${result.repairedReassessmentSilence.minimumDays}-${result.repairedReassessmentSilence.maximumDays}d`,
    "",
    "Representative context judgment",
    "| context | start | WAIT | histories | meaningful responses | old major-event silence | reassessment silence | readable arc | causal |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |",
  ];
  for (const context of result.contexts.filter(
    (candidate) => candidate.context.primary,
  )) {
    lines.push(
      `| ${context.context.id} | ${formatMetric(context.start)} | ${context.waitClassification} | ${context.distinctHistoryCount} | ${context.meaningfulResponseCount} | ${context.longestPoliticalSilenceDays}d | ${context.longestReassessmentSilenceDays}d | ${context.readableArc ? "YES" : "NO"} | ${context.visibleCausality ? "YES" : "NO"} |`,
    );
  }
  lines.push(
    "",
    "Branch evidence",
    "| context | strategy | feasible | attempts/start/complete/reject | crisis day | critical pressure R/C | agenda changes | old/new silence | strength | benefits | tradeoffs | final arc |",
    "| --- | --- | --- | --- | ---: | --- | ---: | --- | --- | --- | --- | --- |",
  );
  for (const context of result.contexts) {
    for (const branch of context.branches) {
      lines.push(
        `| ${context.context.id} | ${branch.strategyId} | ${branch.feasibleAtStart ? "YES" : `NO:${branch.startFeasibilityReasons.join(",")}`} | ${branch.actionAttempts}/${branch.actionStarts}/${branch.actionCompletions}/${branch.actionRejections} | ${branch.firstCrisisRelativeTick ?? "none"} | ${branch.firstCriticalRebellionAgendaRelativeTick ?? "none"}/${branch.firstCriticalCoupAgendaRelativeTick ?? "none"} | ${branch.agendaChangeTicks.length} | ${branch.longestPoliticalSilenceDays}d/${branch.longestReassessmentSilenceDays}d | ${branch.actionStrength} | ${branch.benefitsVersusWait.join(", ") || "none"} | ${branch.tradeoffsVersusWait.join(", ") || "none"} | ${formatMetric(branch.final)} |`,
      );
    }
  }
  lines.push(
    "",
    "Neighbor timing",
    "| family | checkpoints | divergent strategies | terminal changes | crisis timing changes | classification |",
    "| --- | --- | ---: | ---: | ---: | --- |",
  );
  for (const timing of result.adjacentTiming) {
    lines.push(
      `| ${timing.family} | ${timing.primaryContextId} vs ${timing.neighborContextId} | ${timing.divergentStrategyCount} | ${timing.terminalOutcomeChangeCount} | ${timing.firstCrisisTimingChangeCount} | ${timing.classification} |`,
    );
  }
  lines.push(
    "",
    "Representative five-year arcs and causal traces",
    "| context | strategy | yearly arc | event clusters | decision-window changes | Agenda band changes | reassessment trace sample | causal trace sample |",
    "| --- | --- | --- | --- | ---: | --- | --- | --- |",
  );
  for (const context of result.contexts.filter(
    (candidate) => candidate.context.primary,
  )) {
    for (const branch of context.branches) {
      lines.push(
        `| ${context.context.id} | ${branch.strategyId} | ${branch.yearlyArc.map(formatArcPoint).join(" → ")} | ${branch.eventClusters.map((cluster) => `${cluster.startRelativeTick}-${cluster.endRelativeTick}(${cluster.eventCount}:${cluster.eventTypes.join(",")})`).join("; ") || "none"} | ${branch.decisionWindowChanges} | ${branch.agendaChangeTicks.join(",") || "none"} | ${
          branch.reassessmentSignals
            .slice(0, 6)
            .map((signal) => `${signal.relativeTick}:${signal.kind}`)
            .join("; ") || "none"
        } | ${branch.causalTraceExamples.slice(0, 4).join("; ") || "none"} |`,
      );
    }
  }
  lines.push(
    "",
    `Silence diagnosis: ${result.silenceDiagnosis}`,
    `Accommodation: ${result.accommodationClassification}`,
    `Choice-driven histories: ${result.choiceDrivenHistories ? "YES" : "NO"}`,
    `Action tradeoffs: ${result.actionTradeoffsPresent ? "YES" : "NO"}`,
    `Readable pacing arc: ${result.pacingArcReadable ? "YES" : "NO"}`,
    `Visible causal histories: ${result.causalHistoriesVisible ? "YES" : "NO"}`,
    ...result.findings.map((finding) => `- ${finding}`),
  );
  if (result.exactFixesIfNotReady.length > 0) {
    lines.push(
      "Exact fixes required before remeasurement:",
      ...result.exactFixesIfNotReady.map((fix) => `- ${fix}`),
    );
  }
  lines.push(`F05 RECOMMENDATION: ${result.recommendation}`);
  return lines.join("\n");
}

export function runF05Inspection(): F05InspectionReport {
  const result = runF05PacingFunDecision();
  return { result, output: formatF05Inspection(result) };
}

export function printF05Inspection(): void {
  console.log(runF05Inspection().output);
}
