import type { GameEvent, GameEventType } from "../events/event";
import type { RunRecord } from "../core/step";
import {
  createF03StartingRecord,
  deriveF03MetricSnapshot,
  F03_DAYS_PER_YEAR,
  runF03StrategyFromRecord,
  type F03MetricSnapshot,
  type F03StrategyRunResult,
} from "./f03InterventionCounterfactuals";
import {
  createF04DValidationScenario,
  F04D_VALIDATION_INTERVENTION_IDS,
} from "../state/gate1fValidationFixture";
import { deriveNationalAgendas } from "../readModels/agenda";
import type { InstitutionalRuleState } from "../state/policy";
import {
  evaluateInterventionFeasibility,
  type InterventionDefinition,
  type InterventionFeasibilityResult,
} from "../state/intervention";
import type { CountryId, InterventionId } from "../state/ids";
import type { ScenarioDefinition } from "../state/scenario";
import type { TerritorialController } from "../state/region";
import { deriveRegionControlSummary } from "../state/territorialControl";
import type { WorldState } from "../state/world";
import {
  F05_CONTEXTS,
  F05_DECISION_SAMPLE_DAYS,
  F05_DEFAULT_SEED,
  F05_HORIZON_YEARS,
  F05_PACING_EVENT_TYPES,
  F05_STRATEGY_IDS,
  runF05PacingFunDecision,
  type F05ContextDefinition,
  type F05PacingFunResult,
  type F05StrategyId,
} from "./f05PacingFunDecision";

export const GATE1F_DIAGNOSIS_CHECKPOINTS = [
  0, 1, 90, 180, 360, 720, 1_080, 1_800,
] as const;

export const GATE1F_RECONVERGENCE_CHECKPOINTS = [
  180, 360, 720, 1_080, 1_800,
] as const;

// Keep the alias local so the response map reads as a data table while the
// public F05 strategy identifiers remain the source of truth.
const F05_STRATEGIES = F05_STRATEGY_IDS;

const REQUIRED_RESPONSE_STRATEGIES = [
  F05_STRATEGY_IDS.materialRelief,
  F05_STRATEGY_IDS.politicalAccommodation,
  F05_STRATEGY_IDS.oppositionLegalization,
  F05_STRATEGY_IDS.coerciveRestriction,
] as const;

const RESPONSE_INTERVENTIONS: Readonly<
  Record<F05StrategyId, InterventionId | null>
> = {
  [F05_STRATEGY_IDS.wait]: null,
  [F05_STRATEGIES.materialRelief]:
    F04D_VALIDATION_INTERVENTION_IDS.materialRelief,
  [F05_STRATEGIES.politicalAccommodation]:
    F04D_VALIDATION_INTERVENTION_IDS.politicalAccommodation,
  [F05_STRATEGIES.oppositionLegalization]:
    F04D_VALIDATION_INTERVENTION_IDS.oppositionLegalization,
  [F05_STRATEGIES.coerciveRestriction]:
    F04D_VALIDATION_INTERVENTION_IDS.coerciveRestriction,
  [F05_STRATEGIES.repeatedAccommodation]:
    F04D_VALIDATION_INTERVENTION_IDS.politicalAccommodation,
};

type DiagnosticChannel =
  | "meaningfulDecisionOpportunities"
  | "majorEventClusters"
  | "mapVisibleStateChanges"
  | "actionAvailabilityChanges";

const DIAGNOSTIC_CHANNELS: readonly DiagnosticChannel[] = [
  "meaningfulDecisionOpportunities",
  "majorEventClusters",
  "mapVisibleStateChanges",
  "actionAvailabilityChanges",
];

export interface Gate1FControllerCount {
  readonly controller: string;
  readonly landHexCount: number;
}

export interface Gate1FRegionControllerSnapshot {
  readonly regionId: string;
  readonly kind: string;
  readonly controllers: readonly Gate1FControllerCount[];
}

export interface Gate1FControllerSnapshot {
  readonly counts: Readonly<Record<string, number>>;
  readonly playerControlledLandHexes: number;
  readonly factionControlledLandHexes: number;
  readonly uncontrolledLandHexes: number;
  readonly regions: readonly Gate1FRegionControllerSnapshot[];
  readonly signature: string;
}

export interface Gate1FInstitutionSnapshot extends InstitutionalRuleState {
  readonly signature: string;
}

export interface Gate1FActiveConflictSnapshot {
  readonly id: string;
  readonly kind: string;
  readonly status: "active";
  readonly participantCountryIds: readonly string[];
  readonly participantFactionIds: readonly string[];
  readonly contestedRegionIds: readonly string[];
}

export interface Gate1FMetricDelta {
  readonly treasury: number;
  readonly instability: number;
  readonly maxRegionUnrest: number;
  readonly maxRegionScarcity: number;
  readonly factionOrganization: number;
  readonly factionGrievance: number;
  readonly factionResources: number;
  readonly controlledLandHexes: number;
  readonly activeConflicts: number;
}

export interface Gate1FCheckpointMeasurement {
  readonly targetRelativeTick: number;
  readonly actualRelativeTick: number;
  readonly exact: boolean;
  readonly metrics: F03MetricSnapshot;
  readonly controller: Gate1FControllerSnapshot;
  readonly institution: Gate1FInstitutionSnapshot;
  readonly activeConflicts: readonly Gate1FActiveConflictSnapshot[];
  readonly eventTypesSincePreviousCheckpoint: readonly GameEventType[];
  readonly trajectorySignature: string;
}

export interface Gate1FAvailabilitySample {
  readonly relativeTick: number;
  readonly feasibleResponses: readonly F05StrategyId[];
  readonly reasons: Readonly<Record<string, readonly string[]>>;
  readonly signature: string;
}

export interface Gate1FEventCluster {
  readonly startRelativeTick: number;
  readonly endRelativeTick: number;
  readonly eventCount: number;
  readonly eventTypes: readonly GameEventType[];
}

export interface Gate1FGapStatistics {
  readonly signalTicks: readonly number[];
  readonly gaps: readonly number[];
  readonly maximumDays: number;
  readonly medianDays: number;
  readonly p90Days: number;
  readonly distribution: Readonly<Record<string, number>>;
}

export interface Gate1FSilenceMetrics {
  readonly horizonDays: number;
  readonly meaningfulDecisionOpportunityTicks: readonly number[];
  readonly majorPacingEventTicks: readonly number[];
  readonly majorEventClusterTicks: readonly number[];
  readonly mapVisibleStateChangeTicks: readonly number[];
  readonly actionAvailabilityChangeTicks: readonly number[];
  readonly channels: Readonly<Record<DiagnosticChannel, Gate1FGapStatistics>>;
  /** Exact legacy F05 event-tick metric used for baseline reproduction. */
  readonly legacyMajorEventSilenceDays: number;
  readonly combinedSignalTicks: readonly number[];
  readonly combined: Gate1FGapStatistics;
}

export interface Gate1FBranchCost {
  readonly treasuryCost: number;
  readonly administrativeLoad: number;
  readonly durationDays: number;
  readonly treasuryDeltaAtDay1: number;
  readonly treasuryDeltaAtDay90: number;
  readonly treasuryDeltaAtDay360: number;
  readonly treasuryDeltaAtHorizon: number;
}

export interface Gate1FConsequenceMeasurement {
  readonly checkpoint: Gate1FCheckpointMeasurement;
  readonly deltaFromStart: Gate1FMetricDelta;
  readonly controllerSignature: string;
  readonly institutionalRuleChanges: readonly string[];
  readonly eventTrace: readonly string[];
}

export type Gate1FRecoveryClassification =
  | "WAIT_BASELINE"
  | "USEFUL_TRADEOFF"
  | "HARMFUL_TRADEOFF"
  | "COST_ONLY"
  | "UNAVAILABLE";

export interface Gate1FRecoveryChoiceMeasurement {
  readonly strategyId: F05StrategyId;
  readonly interventionId: InterventionId | null;
  readonly definition: Gate1FInterventionDefinition | null;
  readonly feasibleAtStart: boolean;
  readonly startFeasibilityReasons: readonly string[];
  readonly actions: Gate1FActionCounts;
  readonly cost: Gate1FBranchCost;
  readonly immediate: Gate1FConsequenceMeasurement;
  readonly day90: Gate1FConsequenceMeasurement;
  readonly day360: Gate1FConsequenceMeasurement;
  readonly final: Gate1FConsequenceMeasurement;
  readonly territoryControllerConsequence: Gate1FTerritoryConsequence;
  readonly institutionalConsequence: Gate1FInstitutionalConsequence;
  readonly instabilityConsequence: Gate1FMetricPath;
  readonly treasuryConsequence: Gate1FMetricPath;
  readonly conflictConsequence: Gate1FMetricPath;
  readonly availability: Gate1FAvailabilityConsequence;
  readonly eventClusters: readonly Gate1FEventCluster[];
  readonly causalChain: readonly string[];
  readonly classification: Gate1FRecoveryClassification;
  readonly explanation: string;
}

export interface Gate1FInterventionDefinition {
  readonly id: string;
  readonly name: string;
  readonly treasuryCost: number;
  readonly administrativeLoad: number;
  readonly durationDays: number;
}

export interface Gate1FActionCounts {
  readonly attempts: number;
  readonly starts: number;
  readonly completions: number;
  readonly rejections: number;
}

export interface Gate1FTerritoryConsequence {
  readonly start: Gate1FControllerSnapshot;
  readonly day1: Gate1FControllerSnapshot;
  readonly day90: Gate1FControllerSnapshot;
  readonly day360: Gate1FControllerSnapshot;
  readonly final: Gate1FControllerSnapshot;
}

export interface Gate1FInstitutionalConsequence {
  readonly start: Gate1FInstitutionSnapshot;
  readonly day1: Gate1FInstitutionSnapshot;
  readonly day90: Gate1FInstitutionSnapshot;
  readonly day360: Gate1FInstitutionSnapshot;
  readonly final: Gate1FInstitutionSnapshot;
  readonly changedRules: readonly string[];
}

export interface Gate1FMetricPath {
  readonly start: number;
  readonly day1: number;
  readonly day90: number;
  readonly day360: number;
  readonly final: number;
}

export interface Gate1FAvailabilityConsequence {
  readonly atStart: Gate1FAvailabilitySample;
  readonly day1: Gate1FAvailabilitySample;
  readonly day90: Gate1FAvailabilitySample;
  readonly day360: Gate1FAvailabilitySample;
  readonly changeTicks: readonly number[];
  readonly reasonChanges: readonly string[];
}

export interface Gate1FBranchSilence {
  readonly contextId: string;
  readonly strategyId: F05StrategyId;
  readonly metrics: Gate1FSilenceMetrics;
}

export interface Gate1FContextSilence {
  readonly contextId: string;
  readonly family: F05ContextDefinition["family"];
  readonly checkpointTick: number;
  readonly branches: readonly Gate1FBranchSilence[];
  readonly channelMaximumDays: Readonly<Record<DiagnosticChannel, number>>;
  readonly channelMedianDays: Readonly<Record<DiagnosticChannel, number>>;
  readonly channelP90Days: Readonly<Record<DiagnosticChannel, number>>;
  readonly channelDistributions: Readonly<
    Record<DiagnosticChannel, Readonly<Record<string, number>>>
  >;
}

export interface Gate1FReconvergenceDifference {
  readonly strategyId: F05StrategyId;
  readonly branchTrajectorySignature: string;
  readonly waitTrajectorySignature: string;
  readonly exactCheckpoint: boolean;
  readonly differentFromWait: boolean;
  readonly differenceDimensionCount: number;
  readonly differingDimensions: readonly string[];
}

export interface Gate1FReconvergenceCheckpoint {
  readonly relativeTick: number;
  readonly waitTrajectorySignature: string;
  readonly branches: readonly Gate1FReconvergenceDifference[];
}

export interface Gate1FReconvergenceBranchSummary {
  readonly strategyId: F05StrategyId;
  readonly firstDivergentCheckpoint: number | null;
  readonly reconvergedAtHorizon: boolean;
  readonly persistentDimensionsAtHorizon: readonly string[];
  readonly divergentCheckpointCount: number;
}

export interface Gate1FReconvergenceMetrics {
  readonly contextId: string;
  readonly checkpoints: readonly Gate1FReconvergenceCheckpoint[];
  readonly branches: readonly Gate1FReconvergenceBranchSummary[];
}

export interface Gate1FBaselineComparison {
  readonly existingRecommendation: F05PacingFunResult["recommendation"];
  readonly existingScenarioId: string;
  readonly existingSeed: number;
  readonly existingHorizonYears: number;
  readonly existingContextCount: number;
  readonly existingBranchCount: number;
  readonly comparedBranchCount: number;
  readonly trajectorySignatureMismatches: readonly string[];
  readonly actionCountMismatches: readonly string[];
  readonly silenceMismatches: readonly string[];
  readonly reproduced: boolean;
}

export interface Gate1FRepairCandidate {
  readonly id: string;
  readonly title: string;
  readonly reusedSystems: readonly string[];
  readonly expectedTradeoff: string;
  readonly recoveryMeaning: string;
  readonly silenceEffect: string;
  readonly exploitRisk: string;
  readonly regressionRisk: string;
  readonly expectedChangedFiles: readonly string[];
  readonly exactAuthorizationRequired: string;
}

export interface Gate1FDiagnosisV2Result {
  readonly scenarioId: string;
  readonly seed: number;
  readonly horizonYears: number;
  readonly horizonDays: number;
  readonly factionActorLoop: "on";
  readonly baselineReproduced: boolean;
  readonly baselineComparison: Gate1FBaselineComparison;
  readonly branches: readonly Gate1FBranchMeasurement[];
  readonly recoveryChoiceMatrix: readonly Gate1FRecoveryChoiceMeasurement[];
  readonly silence: readonly Gate1FContextSilence[];
  readonly reconvergence: readonly Gate1FReconvergenceMetrics[];
  readonly repairCandidates: readonly Gate1FRepairCandidate[];
  readonly recommendedRepairId: string;
  readonly designOnly: true;
}

export interface Gate1FDiagnosisV2Options {
  /** Optional developer observer for long-running matrix execution. */
  readonly onBranchComplete?: (
    contextId: string,
    strategyId: F05StrategyId,
  ) => void;
  /** Bounded context selection for focused inspection tests. */
  readonly contextIds?: readonly string[];
  /** Defaults to true for the full matrix and false for a context subset. */
  readonly compareExistingBaseline?: boolean;
  /** Developer-only scenario override for bounded R1 counterfactuals. */
  readonly scenario?: ScenarioDefinition;
}

export interface Gate1FBranchMeasurement {
  readonly contextId: string;
  readonly family: F05ContextDefinition["family"];
  readonly checkpointTick: number;
  readonly strategyId: F05StrategyId;
  readonly interventionId: InterventionId | null;
  readonly executedTicks: number;
  readonly terminal: F03StrategyRunResult["terminal"];
  readonly feasibleAtStart: boolean;
  readonly startFeasibilityReasons: readonly string[];
  readonly definition: Gate1FInterventionDefinition | null;
  readonly actions: Gate1FActionCounts;
  readonly checkpoints: readonly Gate1FCheckpointMeasurement[];
  readonly availabilitySamples: readonly Gate1FAvailabilitySample[];
  readonly eventClusters: readonly Gate1FEventCluster[];
  readonly meaningfulEventTrace: readonly string[];
  readonly agendaChangeTicks: readonly number[];
  readonly decisionOpportunityTicks: readonly number[];
  readonly mapVisibleStateChangeTicks: readonly number[];
  readonly actionAvailabilityChangeTicks: readonly number[];
  readonly silence: Gate1FSilenceMetrics;
  readonly trajectorySignature: string;
  readonly final: F03MetricSnapshot;
  readonly causalTraceExamples: readonly string[];
}

interface ObservedWorld {
  readonly relativeTick: number;
  readonly world: WorldState;
  readonly events: readonly GameEvent[];
}

interface Gate1FAgendaSample {
  readonly relativeTick: number;
  readonly signature: string;
}

interface StateDimensions {
  readonly treasury: number;
  readonly stateCapacity: number;
  readonly administrativeLoad: number;
  readonly administrativeHeadroom: number;
  readonly instability: number;
  readonly stateContinuity: number;
  readonly maxRegionUnrest: number;
  readonly maxRegionScarcity: number;
  readonly factionOrganization: number;
  readonly factionGrievance: number;
  readonly factionResources: number;
  readonly controlledLandHexes: number;
  readonly activeConflicts: number;
  readonly activeCivilWars: number;
  readonly controller: string;
  readonly institution: string;
  readonly currentGovernmentId: string;
  readonly outcome: string;
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableJson(entry)).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([first], [second]) => first.localeCompare(second),
  );
  return `{${entries
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
    .join(",")}}`;
}

function compareText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function uniqueSortedNumbers(values: readonly number[]): readonly number[] {
  return [...new Set(values.filter((value) => Number.isFinite(value)))].sort(
    (first, second) => first - second,
  );
}

function controllerKey(controller: TerritorialController): string {
  switch (controller.kind) {
    case "country":
      return `country:${String(controller.countryId)}`;
    case "faction":
      return `faction:${String(controller.factionId)}`;
    case "uncontrolled":
      return "uncontrolled";
  }
}

function controllerSnapshot(
  scenario: ScenarioDefinition,
  world: WorldState,
  playerCountryId: CountryId,
): Gate1FControllerSnapshot {
  const counts = new Map<string, number>();
  for (const [, state] of Object.entries(world.landHexStates).sort(
    ([first], [second]) => compareText(first, second),
  )) {
    const key = controllerKey(state.controller);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const regions = scenario.initialRegions
    .map((region) => {
      const summary = deriveRegionControlSummary(scenario, world, region.id);
      return {
        regionId: String(region.id),
        kind: summary.kind,
        controllers: summary.controllerCounts.map((entry) => ({
          controller: controllerKey(entry.controller),
          landHexCount: entry.landHexCount,
        })),
      } satisfies Gate1FRegionControllerSnapshot;
    })
    .sort((first, second) => compareText(first.regionId, second.regionId));

  const countRecord = Object.fromEntries(
    [...counts.entries()].sort(([first], [second]) =>
      compareText(first, second),
    ),
  ) as Readonly<Record<string, number>>;
  const playerKey = `country:${playerCountryId}`;
  const playerControlledLandHexes = countRecord[playerKey] ?? 0;
  const factionControlledLandHexes = Object.entries(countRecord)
    .filter(([key]) => key.startsWith("faction:"))
    .reduce((total, [, count]) => total + count, 0);
  const uncontrolledLandHexes = countRecord.uncontrolled ?? 0;

  return {
    counts: countRecord,
    playerControlledLandHexes,
    factionControlledLandHexes,
    uncontrolledLandHexes,
    regions,
    signature: stableJson({ counts: countRecord, regions }),
  };
}

function institutionSnapshot(
  world: WorldState,
  playerCountryId: CountryId,
): Gate1FInstitutionSnapshot {
  const policy = world.policies[playerCountryId];
  if (policy === undefined) {
    throw new Error(`Gate1F player policy ${playerCountryId} is missing.`);
  }
  return {
    ...policy.institutionalRules,
    signature: stableJson(policy.institutionalRules),
  };
}

function activeConflictSnapshots(
  world: WorldState,
): readonly Gate1FActiveConflictSnapshot[] {
  return Object.values(world.conflicts)
    .filter((conflict) => conflict.status === "active")
    .sort((first, second) => compareText(String(first.id), String(second.id)))
    .map((conflict) => ({
      id: String(conflict.id),
      kind: conflict.kind,
      status: "active",
      participantCountryIds: conflict.participantCountryIds
        .map(String)
        .sort(compareText),
      participantFactionIds: conflict.participantFactionIds
        .map(String)
        .sort(compareText),
      contestedRegionIds: conflict.contestedRegionIds
        .map(String)
        .sort(compareText),
    }));
}

function activeConflictSignature(
  conflicts: readonly Gate1FActiveConflictSnapshot[],
): string {
  return (
    conflicts
      .map(
        (conflict) =>
          `${conflict.id}:${conflict.kind}:${conflict.participantCountryIds.join(",")}:${conflict.participantFactionIds.join(",")}:${conflict.contestedRegionIds.join(",")}`,
      )
      .join(">") || "NONE"
  );
}

function stateDimensions(
  checkpoint: Pick<
    Gate1FCheckpointMeasurement,
    "metrics" | "controller" | "institution" | "activeConflicts"
  >,
): StateDimensions {
  const metrics = checkpoint.metrics;
  return {
    treasury: metrics.treasury,
    stateCapacity: metrics.stateCapacity,
    administrativeLoad: metrics.administrativeLoad,
    administrativeHeadroom: metrics.administrativeHeadroom,
    instability: metrics.instability,
    stateContinuity: metrics.stateContinuity,
    maxRegionUnrest: metrics.maxRegionUnrest,
    maxRegionScarcity: metrics.maxRegionScarcity,
    factionOrganization: metrics.factionOrganization,
    factionGrievance: metrics.factionGrievance,
    factionResources: metrics.factionResources,
    controlledLandHexes: metrics.controlledLandHexes,
    activeConflicts: metrics.activeConflicts,
    activeCivilWars: metrics.activeCivilWars,
    controller: checkpoint.controller.signature,
    institution: checkpoint.institution.signature,
    currentGovernmentId: metrics.currentGovernmentId ?? "none",
    outcome: metrics.outcome,
  };
}

function trajectorySignatureAtCheckpoint(
  checkpoint: Pick<
    Gate1FCheckpointMeasurement,
    "metrics" | "controller" | "institution" | "activeConflicts"
  >,
): string {
  const dimensions = stateDimensions(checkpoint);
  return stableJson({
    ...dimensions,
    values: Object.fromEntries(
      Object.entries(dimensions).map(([key, value]) => [
        key,
        typeof value === "number" ? Number(value.toFixed(6)) : value,
      ]),
    ),
    activeConflictSignature: activeConflictSignature(
      checkpoint.activeConflicts,
    ),
  });
}

function differs(first: number, second: number): boolean {
  return Math.abs(first - second) > 1e-6;
}

function differenceDimensions(
  first: Gate1FCheckpointMeasurement,
  second: Gate1FCheckpointMeasurement,
): readonly string[] {
  const left = stateDimensions(first);
  const right = stateDimensions(second);
  const labels: string[] = [];
  const numericKeys: readonly (keyof StateDimensions)[] = [
    "treasury",
    "stateCapacity",
    "administrativeLoad",
    "administrativeHeadroom",
    "instability",
    "stateContinuity",
    "maxRegionUnrest",
    "maxRegionScarcity",
    "factionOrganization",
    "factionGrievance",
    "factionResources",
    "controlledLandHexes",
    "activeConflicts",
    "activeCivilWars",
  ];
  for (const key of numericKeys) {
    const leftValue = left[key];
    const rightValue = right[key];
    if (
      typeof leftValue === "number" &&
      typeof rightValue === "number" &&
      differs(leftValue, rightValue)
    ) {
      labels.push(key);
    }
  }
  for (const key of [
    "controller",
    "institution",
    "currentGovernmentId",
    "outcome",
  ] as const) {
    if (left[key] !== right[key]) labels.push(key);
  }
  return labels;
}

function metricDelta(
  first: F03MetricSnapshot,
  second: F03MetricSnapshot,
): Gate1FMetricDelta {
  return {
    treasury: second.treasury - first.treasury,
    instability: second.instability - first.instability,
    maxRegionUnrest: second.maxRegionUnrest - first.maxRegionUnrest,
    maxRegionScarcity: second.maxRegionScarcity - first.maxRegionScarcity,
    factionOrganization: second.factionOrganization - first.factionOrganization,
    factionGrievance: second.factionGrievance - first.factionGrievance,
    factionResources: second.factionResources - first.factionResources,
    controlledLandHexes: second.controlledLandHexes - first.controlledLandHexes,
    activeConflicts: second.activeConflicts - first.activeConflicts,
  };
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
): readonly Gate1FEventCluster[] {
  const pacingEvents = events
    .filter((event) => F05_PACING_EVENT_TYPES.has(event.type))
    .sort(
      (first, second) =>
        first.tick - second.tick || first.sequence - second.sequence,
    );
  const clusters: Gate1FEventCluster[] = [];
  for (const event of pacingEvents) {
    const relativeTick = eventRelativeTick(event, startTick);
    const previous = clusters.at(-1);
    if (
      previous === undefined ||
      relativeTick - previous.endRelativeTick > F05_DECISION_SAMPLE_DAYS / 3
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

function availabilitySample(
  scenario: ScenarioDefinition,
  world: WorldState,
  relativeTick: number,
): Gate1FAvailabilitySample {
  const countryId = scenario.playerCountryId;
  if (countryId === null) {
    throw new Error("Gate1F requires a player country.");
  }
  const evaluations = REQUIRED_RESPONSE_STRATEGIES.map((strategyId) => {
    const interventionId = RESPONSE_INTERVENTIONS[strategyId];
    if (interventionId === null) {
      throw new Error(`Gate1F response ${strategyId} has no intervention.`);
    }
    return [
      strategyId,
      evaluateInterventionFeasibility({
        scenario,
        world,
        interventionId,
        countryId,
      }),
    ] as const;
  });
  const feasibleResponses = evaluations
    .filter(([, evaluation]) => evaluation.feasible)
    .map(([strategyId]) => strategyId);
  const reasons = Object.fromEntries(
    evaluations.map(([strategyId, evaluation]) => [
      strategyId,
      evaluation.reasons.map((reason) => reason.kind),
    ]),
  ) as Readonly<Record<string, readonly string[]>>;
  return {
    relativeTick,
    feasibleResponses,
    reasons,
    signature: feasibleResponses.join(",") || "NONE",
  };
}

function agendaSample(
  scenario: ScenarioDefinition,
  world: WorldState,
  events: readonly GameEvent[],
  relativeTick: number,
): Gate1FAgendaSample {
  const agendas = deriveNationalAgendas({
    scenario,
    world,
    recentEvents: events,
  }).map((agenda) => `${agenda.id}:${agenda.severityBand ?? "unknown"}`);
  return { relativeTick, signature: agendas.join(",") || "NONE" };
}

function checkpointAt(
  checkpoints: readonly Gate1FCheckpointMeasurement[],
  targetRelativeTick: number,
): Gate1FCheckpointMeasurement {
  const checkpoint = checkpoints.find(
    (candidate) => candidate.targetRelativeTick === targetRelativeTick,
  );
  if (checkpoint === undefined) {
    throw new Error(`Missing Gate1F checkpoint ${targetRelativeTick}.`);
  }
  return checkpoint;
}

function sampleAt(
  samples: readonly Gate1FAvailabilitySample[],
  targetRelativeTick: number,
): Gate1FAvailabilitySample {
  const exact = samples.find(
    (sample) => sample.relativeTick === targetRelativeTick,
  );
  if (exact !== undefined) return exact;
  const fallback = samples.at(-1);
  if (fallback === undefined) {
    throw new Error("Gate1F availability samples are empty.");
  }
  return fallback;
}

function agendaChanges(
  samples: readonly Gate1FAgendaSample[],
): readonly number[] {
  return samples.flatMap((sample, index) =>
    index > 0 && sample.signature !== samples[index - 1]!.signature
      ? [sample.relativeTick]
      : [],
  );
}

function gapDistribution(
  gaps: readonly number[],
): Readonly<Record<string, number>> {
  const bins = [
    "0-30",
    "31-90",
    "91-180",
    "181-360",
    "361-720",
    "721-1080",
    "1081+",
  ];
  const distribution = Object.fromEntries(
    bins.map((bin) => [bin, 0]),
  ) as Record<string, number>;
  for (const gap of gaps) {
    const bin =
      gap <= 30
        ? "0-30"
        : gap <= 90
          ? "31-90"
          : gap <= 180
            ? "91-180"
            : gap <= 360
              ? "181-360"
              : gap <= 720
                ? "361-720"
                : gap <= 1_080
                  ? "721-1080"
                  : "1081+";
    distribution[bin] = (distribution[bin] ?? 0) + 1;
  }
  return distribution;
}

function percentile(sortedValues: readonly number[], fraction: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil(sortedValues.length * fraction) - 1),
  );
  return sortedValues[index]!;
}

function gapStatistics(
  signalTicks: readonly number[],
  horizonDays: number,
): Gate1FGapStatistics {
  const ticks = uniqueSortedNumbers([0, ...signalTicks, horizonDays]);
  const gaps = ticks.slice(1).map((tick, index) => tick - ticks[index]!);
  const sortedGaps = [...gaps].sort((first, second) => first - second);
  return {
    signalTicks: ticks,
    gaps,
    maximumDays: Math.max(...gaps, 0),
    medianDays: percentile(sortedGaps, 0.5),
    p90Days: percentile(sortedGaps, 0.9),
    distribution: gapDistribution(gaps),
  };
}

function stateChangeTicks(
  observations: readonly ObservedWorld[],
  playerCountryId: CountryId,
): readonly number[] {
  let previousSignature: string | null = null;
  const changes: number[] = [];
  for (const observation of observations) {
    const controller = Object.entries(observation.world.landHexStates)
      .sort(([first], [second]) => compareText(first, second))
      .map(
        ([landHexId, state]) =>
          `${landHexId}:${controllerKey(state.controller)}`,
      )
      .join(",");
    const conflicts = activeConflictSnapshots(observation.world);
    const country = observation.world.countries[playerCountryId];
    const signature = [
      controller,
      activeConflictSignature(conflicts),
      country?.currentGovernmentId ?? "none",
      observation.world.run.outcome.status,
    ].join("|");
    if (previousSignature !== null && signature !== previousSignature) {
      changes.push(observation.relativeTick);
    }
    previousSignature = signature;
  }
  return uniqueSortedNumbers(changes);
}

function availabilityChangeTicks(
  samples: readonly Gate1FAvailabilitySample[],
): readonly number[] {
  return uniqueSortedNumbers(
    samples.flatMap((sample, index) =>
      index > 0 && sample.signature !== samples[index - 1]!.signature
        ? [sample.relativeTick]
        : [],
    ),
  );
}

function buildSilenceMetrics(
  executedTicks: number,
  decisionOpportunityTicks: readonly number[],
  majorPacingEventTicks: readonly number[],
  eventClusters: readonly Gate1FEventCluster[],
  mapVisibleStateChangeTicks: readonly number[],
  actionAvailabilityChangeTicks: readonly number[],
): Gate1FSilenceMetrics {
  const majorEventClusterTicks = uniqueSortedNumbers(
    eventClusters.map((cluster) => cluster.endRelativeTick),
  );
  const channelTicks: Readonly<Record<DiagnosticChannel, readonly number[]>> = {
    meaningfulDecisionOpportunities: decisionOpportunityTicks,
    majorEventClusters: majorEventClusterTicks,
    mapVisibleStateChanges: mapVisibleStateChangeTicks,
    actionAvailabilityChanges: actionAvailabilityChangeTicks,
  };
  const channels = Object.fromEntries(
    DIAGNOSTIC_CHANNELS.map((channel) => [
      channel,
      gapStatistics(channelTicks[channel], executedTicks),
    ]),
  ) as Readonly<Record<DiagnosticChannel, Gate1FGapStatistics>>;
  const combinedSignalTicks = uniqueSortedNumbers(
    DIAGNOSTIC_CHANNELS.flatMap((channel) => channelTicks[channel]),
  );
  return {
    horizonDays: executedTicks,
    meaningfulDecisionOpportunityTicks: uniqueSortedNumbers(
      decisionOpportunityTicks,
    ),
    majorPacingEventTicks: uniqueSortedNumbers(majorPacingEventTicks),
    majorEventClusterTicks,
    mapVisibleStateChangeTicks,
    actionAvailabilityChangeTicks,
    channels,
    legacyMajorEventSilenceDays: gapStatistics(
      majorPacingEventTicks,
      executedTicks,
    ).maximumDays,
    combinedSignalTicks,
    combined: gapStatistics(combinedSignalTicks, executedTicks),
  };
}

function definitionFor(
  scenario: ScenarioDefinition,
  interventionId: InterventionId | null,
): Gate1FInterventionDefinition | null {
  if (interventionId === null) return null;
  const definition: InterventionDefinition | undefined =
    scenario.interventionCatalog[interventionId];
  if (definition === undefined) {
    throw new Error(
      `Missing Gate1F intervention definition ${interventionId}.`,
    );
  }
  return {
    id: String(definition.id),
    name: definition.name,
    treasuryCost: definition.treasuryCost,
    administrativeLoad: definition.administrativeLoad,
    durationDays: definition.durationDays,
  };
}

function feasibilityReasons(
  scenario: ScenarioDefinition,
  record: RunRecord,
  interventionId: InterventionId | null,
): InterventionFeasibilityResult | null {
  const countryId = scenario.playerCountryId;
  if (countryId === null || interventionId === null) return null;
  return evaluateInterventionFeasibility({
    scenario,
    world: record.world,
    interventionId,
    countryId,
  });
}

function checkpointMeasurement(
  scenario: ScenarioDefinition,
  playerCountryId: CountryId,
  startTick: number,
  targetRelativeTick: number,
  observations: readonly ObservedWorld[],
  run: F03StrategyRunResult,
  previousActualRelativeTick: number,
): Gate1FCheckpointMeasurement {
  const exactObservation = observations.find(
    (observation) => observation.relativeTick === targetRelativeTick,
  );
  const fallbackObservation = [...observations]
    .filter((observation) => observation.relativeTick <= targetRelativeTick)
    .at(-1);
  const observation =
    exactObservation ?? fallbackObservation ?? observations[0];
  if (observation === undefined) {
    throw new Error("Gate1F branch emitted no observations.");
  }
  const actualRelativeTick = observation.relativeTick;
  const exact = actualRelativeTick === targetRelativeTick;
  const metric =
    run.checkpoints.find(
      (checkpoint) => checkpoint.relativeTick === actualRelativeTick,
    ) ??
    (actualRelativeTick === run.final.relativeTick
      ? run.final
      : deriveF03MetricSnapshot(
          scenario,
          observation.world,
          playerCountryId,
          actualRelativeTick,
        ));
  const controller = controllerSnapshot(
    scenario,
    observation.world,
    playerCountryId,
  );
  const institution = institutionSnapshot(observation.world, playerCountryId);
  const activeConflicts = activeConflictSnapshots(observation.world);
  const eventsSincePrevious = run.stepEvents
    .filter(
      (event) =>
        event.tick > startTick + previousActualRelativeTick &&
        event.tick <= startTick + actualRelativeTick,
    )
    .sort(
      (first, second) =>
        first.tick - second.tick || first.sequence - second.sequence,
    )
    .map((event) => event.type)
    .filter((eventType, index, values) => values.indexOf(eventType) === index);
  const checkpoint = {
    targetRelativeTick,
    actualRelativeTick,
    exact,
    metrics: metric,
    controller,
    institution,
    activeConflicts,
    eventTypesSincePreviousCheckpoint: eventsSincePrevious,
    trajectorySignature: "",
  } satisfies Omit<Gate1FCheckpointMeasurement, "trajectorySignature"> & {
    trajectorySignature: string;
  };
  return {
    ...checkpoint,
    trajectorySignature: trajectorySignatureAtCheckpoint(checkpoint),
  };
}

function branchTrajectorySignature(
  run: F03StrategyRunResult,
  meaningfulEvents: readonly GameEvent[],
  agendaSamples: readonly Gate1FAgendaSample[],
  finalInstitution: Gate1FInstitutionSnapshot,
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
    finalInstitution.politicalCompetition,
    finalInstitution.pressFreedom,
    final.factionGrievance.toFixed(3),
    final.factionOrganization.toFixed(3),
    final.maxRegionScarcity.toFixed(3),
  ].join("|");
}

function strategyPolicy(
  strategyId: F05StrategyId,
  interventionId: InterventionId | null,
): (relativeTick: number) => InterventionId | null {
  return (relativeTick) => {
    if (strategyId === F05_STRATEGIES.wait || interventionId === null)
      return null;
    if (strategyId === F05_STRATEGIES.repeatedAccommodation) {
      return relativeTick % F05_DECISION_SAMPLE_DAYS === 0
        ? interventionId
        : null;
    }
    return relativeTick === 0 ? interventionId : null;
  };
}

function eventTraceExamples(
  events: readonly GameEvent[],
  startTick: number,
): readonly string[] {
  return events
    .filter((event) => F05_PACING_EVENT_TYPES.has(event.type))
    .slice(0, 12)
    .map((event) => eventTrace(event, startTick));
}

function runDetailedBranch(
  scenario: ScenarioDefinition,
  context: F05ContextDefinition,
  startingRecord: RunRecord,
  strategyId: F05StrategyId,
): Gate1FBranchMeasurement {
  const interventionId = RESPONSE_INTERVENTIONS[strategyId];
  const feasibility = feasibilityReasons(
    scenario,
    startingRecord,
    interventionId,
  );
  const playerCountryId = scenario.playerCountryId;
  if (playerCountryId === null) {
    throw new Error("Gate1F requires a player country.");
  }
  const observations: ObservedWorld[] = [];
  const agendaSamples: Gate1FAgendaSample[] = [];
  const availabilitySamples: Gate1FAvailabilitySample[] = [];
  const run = runF03StrategyFromRecord(
    scenario,
    context.id,
    strategyId,
    startingRecord,
    F05_HORIZON_YEARS,
    ({ relativeTick }) =>
      strategyPolicy(strategyId, interventionId)(relativeTick),
    {
      checkpointOffsets: GATE1F_DIAGNOSIS_CHECKPOINTS,
      factionActorLoop: "on",
      onObservation: ({ relativeTick, world, events }) => {
        observations.push({ relativeTick, world, events });
        availabilitySamples.push(
          availabilitySample(scenario, world, relativeTick),
        );
        if (relativeTick % 30 === 0) {
          agendaSamples.push(
            agendaSample(scenario, world, events, relativeTick),
          );
        }
      },
    },
  );
  const sortedObservations = [...observations].sort(
    (first, second) => first.relativeTick - second.relativeTick,
  );
  const checkpoints: Gate1FCheckpointMeasurement[] = [];
  let previousActualRelativeTick = 0;
  for (const targetRelativeTick of GATE1F_DIAGNOSIS_CHECKPOINTS) {
    const checkpoint = checkpointMeasurement(
      scenario,
      playerCountryId,
      context.checkpointTick,
      targetRelativeTick,
      sortedObservations,
      run,
      previousActualRelativeTick,
    );
    checkpoints.push(checkpoint);
    previousActualRelativeTick = checkpoint.actualRelativeTick;
  }
  const meaningfulEvents = run.stepEvents.filter((event) =>
    F05_PACING_EVENT_TYPES.has(event.type),
  );
  const eventClusters = buildEventClusters(
    run.stepEvents,
    context.checkpointTick,
  );
  const decisionOpportunityTicks = availabilitySamples
    .filter(
      (sample) =>
        sample.relativeTick % F05_DECISION_SAMPLE_DAYS === 0 &&
        sample.feasibleResponses.length > 0,
    )
    .map((sample) => sample.relativeTick);
  const mapVisibleStateChangeTicks = stateChangeTicks(
    sortedObservations,
    playerCountryId,
  );
  const actionAvailabilityChangeTicks =
    availabilityChangeTicks(availabilitySamples);
  const silence = buildSilenceMetrics(
    run.executedTicks,
    decisionOpportunityTicks,
    meaningfulEvents.map((event) =>
      eventRelativeTick(event, context.checkpointTick),
    ),
    eventClusters,
    mapVisibleStateChangeTicks,
    actionAvailabilityChangeTicks,
  );
  const finalCheckpoint = checkpoints.at(-1)!;
  return {
    contextId: context.id,
    family: context.family,
    checkpointTick: context.checkpointTick,
    strategyId,
    interventionId,
    executedTicks: run.executedTicks,
    terminal: run.terminal,
    feasibleAtStart: feasibility?.feasible ?? true,
    startFeasibilityReasons:
      feasibility?.reasons.map((reason) => reason.kind) ?? [],
    definition: definitionFor(scenario, interventionId),
    actions: {
      attempts: run.actionIds.length,
      starts: run.eventSummary.interventionStarted,
      completions: run.eventSummary.interventionCompleted,
      rejections: run.eventSummary.interventionRejected,
    },
    checkpoints,
    availabilitySamples,
    eventClusters,
    meaningfulEventTrace: meaningfulEvents.map((event) =>
      eventTrace(event, context.checkpointTick),
    ),
    agendaChangeTicks: agendaChanges(agendaSamples),
    decisionOpportunityTicks,
    mapVisibleStateChangeTicks,
    actionAvailabilityChangeTicks,
    silence,
    trajectorySignature: branchTrajectorySignature(
      run,
      meaningfulEvents,
      agendaSamples,
      finalCheckpoint.institution,
    ),
    final: run.final,
    causalTraceExamples: eventTraceExamples(
      run.stepEvents,
      context.checkpointTick,
    ),
  };
}

function actionCountsEqual(
  first: Gate1FBranchMeasurement["actions"],
  second: Gate1FBranchMeasurement["actions"],
): boolean {
  return (
    first.attempts === second.attempts &&
    first.starts === second.starts &&
    first.completions === second.completions &&
    first.rejections === second.rejections
  );
}

function compareWithExistingF05(
  existing: F05PacingFunResult,
  branches: readonly Gate1FBranchMeasurement[],
): Gate1FBaselineComparison {
  const trajectorySignatureMismatches: string[] = [];
  const actionCountMismatches: string[] = [];
  const silenceMismatches: string[] = [];
  let comparedBranchCount = 0;
  for (const context of existing.contexts) {
    for (const existingBranch of context.branches) {
      const detailed = branches.find(
        (branch) =>
          branch.contextId === context.context.id &&
          branch.strategyId === existingBranch.strategyId,
      );
      if (detailed === undefined) {
        trajectorySignatureMismatches.push(
          `${context.context.id}/${existingBranch.strategyId}:missing`,
        );
        continue;
      }
      comparedBranchCount += 1;
      if (detailed.trajectorySignature !== existingBranch.trajectorySignature) {
        trajectorySignatureMismatches.push(
          `${context.context.id}/${existingBranch.strategyId}:trajectory`,
        );
      }
      if (
        !actionCountsEqual(detailed.actions, {
          attempts: existingBranch.actionAttempts,
          starts: existingBranch.actionStarts,
          completions: existingBranch.actionCompletions,
          rejections: existingBranch.actionRejections,
        })
      ) {
        actionCountMismatches.push(
          `${context.context.id}/${existingBranch.strategyId}:actions`,
        );
      }
      if (
        detailed.silence.legacyMajorEventSilenceDays !==
        existingBranch.longestPoliticalSilenceDays
      ) {
        silenceMismatches.push(
          `${context.context.id}/${existingBranch.strategyId}:major-event:${detailed.silence.legacyMajorEventSilenceDays}/${existingBranch.longestPoliticalSilenceDays}`,
        );
      }
    }
  }
  const existingBranchCount = existing.contexts.reduce(
    (total, context) => total + context.branches.length,
    0,
  );
  return {
    existingRecommendation: existing.recommendation,
    existingScenarioId: existing.scenarioId,
    existingSeed: existing.seed,
    existingHorizonYears: existing.horizonYears,
    existingContextCount: existing.contexts.length,
    existingBranchCount,
    comparedBranchCount,
    trajectorySignatureMismatches,
    actionCountMismatches,
    silenceMismatches,
    reproduced:
      existing.contexts.length === F05_CONTEXTS.length &&
      existingBranchCount === branches.length &&
      comparedBranchCount === existingBranchCount &&
      trajectorySignatureMismatches.length === 0 &&
      actionCountMismatches.length === 0 &&
      silenceMismatches.length === 0,
  };
}

function recoveryConsequence(
  branch: Gate1FBranchMeasurement,
  targetRelativeTick: number,
  start: Gate1FCheckpointMeasurement,
): Gate1FConsequenceMeasurement {
  const checkpoint = checkpointAt(branch.checkpoints, targetRelativeTick);
  const eventTraceEntries = branch.meaningfulEventTrace.filter((entry) => {
    const tick = Number(entry.split(":", 1)[0]);
    return tick > 0 && tick <= checkpoint.actualRelativeTick;
  });
  return {
    checkpoint,
    deltaFromStart: metricDelta(start.metrics, checkpoint.metrics),
    controllerSignature: checkpoint.controller.signature,
    institutionalRuleChanges:
      checkpoint.eventTypesSincePreviousCheckpoint.filter(
        (eventType) => eventType === "INSTITUTION_RULE_CHANGED",
      ),
    eventTrace: eventTraceEntries.slice(-8),
  };
}

function actionAvailabilityConsequence(
  branch: Gate1FBranchMeasurement,
): Gate1FAvailabilityConsequence {
  const samples = branch.availabilitySamples;
  const atStart = sampleAt(samples, 0);
  const day1 = sampleAt(samples, 1);
  const day90 = sampleAt(samples, 90);
  const day360 = sampleAt(samples, 360);
  const reasonChanges = uniqueSortedNumbers(
    samples.flatMap((sample, index) =>
      index > 0 &&
      stableJson(sample.reasons) !== stableJson(samples[index - 1]!.reasons)
        ? [sample.relativeTick]
        : [],
    ),
  ).map((tick) => String(tick));
  return {
    atStart,
    day1,
    day90,
    day360,
    changeTicks: branch.actionAvailabilityChangeTicks,
    reasonChanges,
  };
}

function ruleChanges(
  start: Gate1FInstitutionSnapshot,
  final: Gate1FInstitutionSnapshot,
): readonly string[] {
  return Object.keys(start)
    .filter((key) => key !== "signature")
    .sort(compareText)
    .filter((key) => {
      const typedKey = key as keyof InstitutionalRuleState;
      return start[typedKey] !== final[typedKey];
    });
}

function metricPath(
  branch: Gate1FBranchMeasurement,
  selector: (metrics: F03MetricSnapshot) => number,
): Gate1FMetricPath {
  const start = checkpointAt(branch.checkpoints, 0);
  const day1 = checkpointAt(branch.checkpoints, 1);
  const day90 = checkpointAt(branch.checkpoints, 90);
  const day360 = checkpointAt(branch.checkpoints, 360);
  const final = branch.checkpoints.at(-1)!;
  return {
    start: selector(start.metrics),
    day1: selector(day1.metrics),
    day90: selector(day90.metrics),
    day360: selector(day360.metrics),
    final: selector(final.metrics),
  };
}

function hasRecoveryBenefit(
  branch: Gate1FBranchMeasurement,
  wait: Gate1FBranchMeasurement,
): boolean {
  const branchCheckpoints = new Map(
    branch.checkpoints.map((checkpoint) => [
      checkpoint.targetRelativeTick,
      checkpoint,
    ]),
  );
  const waitCheckpoints = new Map(
    wait.checkpoints.map((checkpoint) => [
      checkpoint.targetRelativeTick,
      checkpoint,
    ]),
  );
  for (const target of [1, 90, 360, 1_800]) {
    const first = branchCheckpoints.get(target);
    const second = waitCheckpoints.get(target);
    if (first === undefined || second === undefined) continue;
    const delta = metricDelta(second.metrics, first.metrics);
    if (
      delta.controlledLandHexes > 0 ||
      delta.activeConflicts < 0 ||
      delta.maxRegionUnrest < -1e-6 ||
      delta.maxRegionScarcity < -1e-6 ||
      delta.instability < -1e-6 ||
      delta.treasury > 1e-6
    ) {
      return true;
    }
  }
  return false;
}

function hasRecoveryHarm(
  branch: Gate1FBranchMeasurement,
  wait: Gate1FBranchMeasurement,
): boolean {
  for (const target of [1, 90, 360, 1_800]) {
    const branchCheckpoint = checkpointAt(branch.checkpoints, target);
    const waitCheckpoint = checkpointAt(wait.checkpoints, target);
    const delta = metricDelta(waitCheckpoint.metrics, branchCheckpoint.metrics);
    if (
      delta.controlledLandHexes < 0 ||
      delta.activeConflicts > 0 ||
      delta.maxRegionUnrest > 1e-6 ||
      delta.maxRegionScarcity > 1e-6 ||
      delta.instability > 1e-6
    ) {
      return true;
    }
  }
  return false;
}

function classifyRecovery(
  branch: Gate1FBranchMeasurement,
  wait: Gate1FBranchMeasurement,
): Gate1FRecoveryClassification {
  if (branch.strategyId === F05_STRATEGIES.wait) return "WAIT_BASELINE";
  if (!branch.feasibleAtStart && branch.actions.starts === 0) {
    return "UNAVAILABLE";
  }
  const benefit = hasRecoveryBenefit(branch, wait);
  const harm = hasRecoveryHarm(branch, wait);
  if (benefit && harm) return "USEFUL_TRADEOFF";
  if (benefit) return "USEFUL_TRADEOFF";
  if (harm) return "HARMFUL_TRADEOFF";
  return "COST_ONLY";
}

function explainRecovery(
  branch: Gate1FBranchMeasurement,
  wait: Gate1FBranchMeasurement,
  classification: Gate1FRecoveryClassification,
): string {
  if (classification === "UNAVAILABLE") {
    return `시작 거부(${branch.startFeasibilityReasons.join(",") || "reason-unreported"})로 비용·완료 효과 없이 WAIT와 같은 경로를 측정했다.`;
  }
  const start = branch.checkpoints[0]!;
  const day90 = checkpointAt(branch.checkpoints, 90);
  const wait90 = checkpointAt(wait.checkpoints, 90);
  const parts = [
    `시작 ${branch.actions.attempts}/${branch.actions.starts}/${branch.actions.completions}/${branch.actions.rejections}`,
    `90일 treasury Δ=${(day90.metrics.treasury - wait90.metrics.treasury).toFixed(0)}`,
    `territory Δ=${(day90.metrics.controlledLandHexes - wait90.metrics.controlledLandHexes).toFixed(0)}`,
    `conflicts Δ=${(day90.metrics.activeConflicts - wait90.metrics.activeConflicts).toFixed(0)}`,
  ];
  const eventTypes = [
    ...new Set(branch.meaningfulEventTrace.map((entry) => entry.split(":")[1])),
  ];
  if (eventTypes.length > 0)
    parts.push(`events=${eventTypes.slice(0, 5).join(",")}`);
  if (
    start.institution.politicalCompetition !==
    day90.institution.politicalCompetition
  ) {
    parts.push(
      `politicalCompetition ${start.institution.politicalCompetition}->${day90.institution.politicalCompetition}`,
    );
  }
  return `${parts.join("; ")}이므로 ${classification}으로 분류했다.`;
}

function recoveryMatrix(
  branches: readonly Gate1FBranchMeasurement[],
): readonly Gate1FRecoveryChoiceMeasurement[] {
  const recoveryBranches = branches.filter(
    (branch) => branch.contextId === "ACTIVE_CONFLICT_RECOVERY_T180",
  );
  const wait = recoveryBranches.find(
    (branch) => branch.strategyId === F05_STRATEGIES.wait,
  );
  if (wait === undefined)
    throw new Error("Gate1F recovery WAIT branch is missing.");
  const results: Gate1FRecoveryChoiceMeasurement[] = [];
  for (const branch of recoveryBranches) {
    const start = checkpointAt(branch.checkpoints, 0);
    const day1 = checkpointAt(branch.checkpoints, 1);
    const day90 = checkpointAt(branch.checkpoints, 90);
    const day360 = checkpointAt(branch.checkpoints, 360);
    const final = branch.checkpoints.at(-1)!;
    const classification = classifyRecovery(branch, wait);
    const definition = branch.definition;
    const definitionCost = definition ?? {
      id: "WAIT",
      name: "WAIT",
      treasuryCost: 0,
      administrativeLoad: 0,
      durationDays: 0,
    };
    const startTreasury = start.metrics.treasury;
    results.push({
      strategyId: branch.strategyId,
      interventionId: branch.interventionId,
      definition,
      feasibleAtStart: branch.feasibleAtStart,
      startFeasibilityReasons: branch.startFeasibilityReasons,
      actions: branch.actions,
      cost: {
        treasuryCost: definitionCost.treasuryCost,
        administrativeLoad: definitionCost.administrativeLoad,
        durationDays: definitionCost.durationDays,
        treasuryDeltaAtDay1: day1.metrics.treasury - startTreasury,
        treasuryDeltaAtDay90: day90.metrics.treasury - startTreasury,
        treasuryDeltaAtDay360: day360.metrics.treasury - startTreasury,
        treasuryDeltaAtHorizon: final.metrics.treasury - startTreasury,
      },
      immediate: recoveryConsequence(branch, 1, start),
      day90: recoveryConsequence(branch, 90, start),
      day360: recoveryConsequence(branch, 360, start),
      final: recoveryConsequence(branch, 1_800, start),
      territoryControllerConsequence: {
        start: start.controller,
        day1: day1.controller,
        day90: day90.controller,
        day360: day360.controller,
        final: final.controller,
      },
      institutionalConsequence: {
        start: start.institution,
        day1: day1.institution,
        day90: day90.institution,
        day360: day360.institution,
        final: final.institution,
        changedRules: ruleChanges(start.institution, final.institution),
      },
      instabilityConsequence: metricPath(
        branch,
        (metrics) => metrics.instability,
      ),
      treasuryConsequence: metricPath(branch, (metrics) => metrics.treasury),
      conflictConsequence: metricPath(
        branch,
        (metrics) => metrics.activeConflicts,
      ),
      availability: actionAvailabilityConsequence(branch),
      eventClusters: branch.eventClusters,
      causalChain: branch.causalTraceExamples,
      classification,
      explanation: explainRecovery(branch, wait, classification),
    });
  }
  return results;
}

function contextSilence(
  branches: readonly Gate1FBranchMeasurement[],
  context: F05ContextDefinition,
): Gate1FContextSilence {
  const contextBranches = branches
    .filter((branch) => branch.contextId === context.id)
    .map((branch) => ({
      contextId: context.id,
      strategyId: branch.strategyId,
      metrics: branch.silence,
    }));
  const channelMaximumDays = Object.fromEntries(
    DIAGNOSTIC_CHANNELS.map((channel) => [
      channel,
      Math.max(
        ...contextBranches.map(
          (branch) => branch.metrics.channels[channel].maximumDays,
        ),
        0,
      ),
    ]),
  ) as Readonly<Record<DiagnosticChannel, number>>;
  const channelMedianDays = Object.fromEntries(
    DIAGNOSTIC_CHANNELS.map((channel) => [
      channel,
      percentile(
        contextBranches
          .map((branch) => branch.metrics.channels[channel].medianDays)
          .sort((first, second) => first - second),
        0.5,
      ),
    ]),
  ) as Readonly<Record<DiagnosticChannel, number>>;
  const channelP90Days = Object.fromEntries(
    DIAGNOSTIC_CHANNELS.map((channel) => [
      channel,
      percentile(
        contextBranches
          .map((branch) => branch.metrics.channels[channel].p90Days)
          .sort((first, second) => first - second),
        0.9,
      ),
    ]),
  ) as Readonly<Record<DiagnosticChannel, number>>;
  const channelDistributions = Object.fromEntries(
    DIAGNOSTIC_CHANNELS.map((channel) => {
      const distribution = Object.fromEntries(
        Object.keys(
          contextBranches[0]?.metrics.channels[channel].distribution ?? {},
        ).map((bin) => [bin, 0]),
      ) as Record<string, number>;
      for (const branch of contextBranches) {
        for (const [bin, count] of Object.entries(
          branch.metrics.channels[channel].distribution,
        )) {
          distribution[bin] = (distribution[bin] ?? 0) + count;
        }
      }
      return [channel, distribution];
    }),
  ) as Readonly<Record<DiagnosticChannel, Readonly<Record<string, number>>>>;
  return {
    contextId: context.id,
    family: context.family,
    checkpointTick: context.checkpointTick,
    branches: contextBranches,
    channelMaximumDays,
    channelMedianDays,
    channelP90Days,
    channelDistributions,
  };
}

function reconvergence(
  branches: readonly Gate1FBranchMeasurement[],
  contexts: readonly F05ContextDefinition[] = F05_CONTEXTS,
): readonly Gate1FReconvergenceMetrics[] {
  return contexts
    .filter((context) => context.primary)
    .map((context) => {
      const contextBranches = branches.filter(
        (branch) => branch.contextId === context.id,
      );
      const wait = contextBranches.find(
        (branch) => branch.strategyId === F05_STRATEGIES.wait,
      );
      if (wait === undefined)
        throw new Error(`Missing WAIT for ${context.id}.`);
      const checkpoints = GATE1F_RECONVERGENCE_CHECKPOINTS.map(
        (relativeTick) => {
          const waitCheckpoint = checkpointAt(wait.checkpoints, relativeTick);
          return {
            relativeTick,
            waitTrajectorySignature: waitCheckpoint.trajectorySignature,
            branches: contextBranches.map((branch) => {
              const branchCheckpoint = checkpointAt(
                branch.checkpoints,
                relativeTick,
              );
              const dimensions = differenceDimensions(
                branchCheckpoint,
                waitCheckpoint,
              );
              return {
                strategyId: branch.strategyId,
                branchTrajectorySignature: branchCheckpoint.trajectorySignature,
                waitTrajectorySignature: waitCheckpoint.trajectorySignature,
                exactCheckpoint: branchCheckpoint.exact && waitCheckpoint.exact,
                differentFromWait: dimensions.length > 0,
                differenceDimensionCount: dimensions.length,
                differingDimensions: dimensions,
              } satisfies Gate1FReconvergenceDifference;
            }),
          } satisfies Gate1FReconvergenceCheckpoint;
        },
      );
      const branchSummaries = contextBranches.map((branch) => {
        const differences = checkpoints
          .map((checkpoint) =>
            checkpoint.branches.find(
              (candidate) => candidate.strategyId === branch.strategyId,
            )!,
          )
          .filter((candidate) => candidate.differentFromWait);
        const horizon = checkpoints
          .at(-1)!
          .branches.find(
            (candidate) => candidate.strategyId === branch.strategyId,
          )!;
        return {
          strategyId: branch.strategyId,
          firstDivergentCheckpoint: differences[0]
            ? checkpoints.find((checkpoint) =>
                checkpoint.branches.some(
                  (candidate) =>
                    candidate.strategyId === branch.strategyId &&
                    candidate.differentFromWait,
                ),
              )!.relativeTick
            : null,
          reconvergedAtHorizon: !horizon.differentFromWait,
          persistentDimensionsAtHorizon: horizon.differingDimensions,
          divergentCheckpointCount: differences.length,
        } satisfies Gate1FReconvergenceBranchSummary;
      });
      return {
        contextId: context.id,
        checkpoints,
        branches: branchSummaries,
      };
    });
}

function repairCandidates(): readonly Gate1FRepairCandidate[] {
  return [
    {
      id: "R1_RECOVERY_RESPONSE_RECOMPOSITION",
      title: "회복 국면의 기존 institution/intervention downstream 재조합",
      reusedSystems: [
        "F04D administrative intervention feasibility/cost/load",
        "politicalCompetition 및 faction grievance consumers",
        "LandHex/conflict read models",
      ],
      expectedTradeoff:
        "비용·행정 점유·정치 규칙 변화는 유지하고, 완료 이후 기존 faction/territory/conflict 소비자에 측정 가능한 회복 결과를 연결한다.",
      recoveryMeaning:
        "영토를 모두 잃은 뒤에도 적어도 하나의 유료 응답이 제어권·갈등·불안정 중 하나에 상태 차이를 만들 수 있다.",
      silenceEffect:
        "완료→기존 downstream 변화가 발생하는 시점에 한정해 map/event signal을 추가할 수 있으나, 별도 반복 스케줄러는 사용하지 않는다.",
      exploitRisk:
        "회복 응답 반복으로 treasury·controller를 동시에 누적시키는 조합.",
      regressionRisk:
        "pre-collapse intervention timing, institution prerequisites, F04D causal trace가 변할 위험.",
      expectedChangedFiles: [
        "src/sim/state/gate1fValidationFixture.ts 또는 해당 intervention consumer",
        "src/sim/systems/* 관련 기존 consumer",
        "src/sim/inspection/f04dInstitutionActionCounterfactuals*",
      ],
      exactAuthorizationRequired:
        "Gate1F recovery response repair 권한과 F04D fixture/authoritative consumer 변경 범위, pre/post-collapse 회귀 테스트 승인.",
    },
    {
      id: "R2_RECOVERY_CONFLICT_ACTION_RECOMPOSITION",
      title: "기존 conflict/faction action의 회복 선택지 재조합",
      reusedSystems: [
        "active conflict participant/controller state",
        "faction action intake 및 political agenda read model",
        "existing territorial conflict resolution seam",
      ],
      expectedTradeoff:
        "행동에는 기존 자원·행정·불안정 비용을 남기고, conflict participant와 controller 조건에 따라 기존 resolution 경로의 결과만 다르게 관측한다.",
      recoveryMeaning:
        "재정만 소모하는 단일 intervention보다, 충돌 상태와 연결된 선택이 회복 경로를 분기한다.",
      silenceEffect:
        "새로운 시간 기반 이벤트를 만들지 않고 기존 conflict/faction action 또는 agenda 변화가 발생한 때만 신호를 늘린다.",
      exploitRisk:
        "갈등이 활성화된 동안 동일 action을 반복해 controller transition을 과도하게 유도하는 문제.",
      regressionRisk:
        "actor loop proposal order, conflict resolution, neighboring checkpoint timing이 함께 달라질 위험.",
      expectedChangedFiles: [
        "src/sim/state/action.ts 또는 기존 faction action intake",
        "src/sim/systems/*conflict* 또는 기존 territorial consumer",
        "src/sim/inspection/f04bActiveConflictRecoveryAgency*",
      ],
      exactAuthorizationRequired:
        "conflict/faction action 소비자와 회복 조건을 변경하는 별도 Gate1F repair 권한, action-loop/territory regression 승인.",
    },
    {
      id: "R3_RESPONSE_COVERAGE_REMEASUREMENT",
      title: "기존 response feasibility와 회복 coverage의 좁은 보강",
      reusedSystems: [
        "evaluateInterventionFeasibility",
        "administrative headroom/treasury commitment",
        "F04D response catalog 및 existing downstream event chain",
      ],
      expectedTradeoff:
        "추가 응답은 무료가 아니며 treasury·administrativeLoad·완료 지연·정치적 부작용 중 명시된 비용을 가진다.",
      recoveryMeaning:
        "현재 회복에서 3개 응답이 cost-only로 남는 이유를 먼저 좁은 coverage 변경으로 해결하고, 각 응답의 rejection/availability를 보존한다.",
      silenceEffect:
        "availability 변화 또는 완료 효과가 기존 event/map 신호를 만들 때만 개선되며, generic meter나 scheduler는 추가하지 않는다.",
      exploitRisk:
        "treasury가 충분한 branch에서 반복 응답이 availability와 회복 효과를 누적하는 문제.",
      regressionRisk:
        "기존 feasible response 수, prerequisite rejection, WAIT 비교 벡터의 변경.",
      expectedChangedFiles: [
        "src/sim/state/gate1fValidationFixture.ts",
        "src/sim/state/intervention.ts의 기존 소비자 경계(필요한 경우에만)",
        "src/sim/inspection/f04dInstitutionActionCounterfactuals*",
      ],
      exactAuthorizationRequired:
        "F05 diagnosis 후속 repair 권한, 허용할 기존 response/consumer 파일 목록, repeated accommodation 및 no-persistence 회귀 테스트 승인.",
    },
  ] as const;
}

export function runGate1FDiagnosisV2(
  seed: number = F05_DEFAULT_SEED,
  options: Gate1FDiagnosisV2Options = {},
): Gate1FDiagnosisV2Result {
  const scenario = options.scenario ?? createF04DValidationScenario();
  const selectedContexts =
    options.contextIds === undefined
      ? F05_CONTEXTS
      : F05_CONTEXTS.filter((context) =>
          options.contextIds!.includes(context.id),
        );
  if (selectedContexts.length === 0) {
    throw new Error("Gate1F diagnosis context selection is empty.");
  }
  const branches: Gate1FBranchMeasurement[] = [];
  for (const context of selectedContexts) {
    const startingRecord = createF03StartingRecord(
      scenario,
      seed,
      context.checkpointTick,
    );
    for (const strategyId of Object.values(F05_STRATEGIES)) {
      branches.push(
        runDetailedBranch(scenario, context, startingRecord, strategyId),
      );
      options.onBranchComplete?.(context.id, strategyId);
    }
  }
  // Run the unmodified F05 baseline after the detailed loop so long-running
  // callers can receive branch progress while the canonical comparison runs.
  const shouldCompareBaseline =
    options.compareExistingBaseline ?? options.contextIds === undefined;
  const baselineComparison = shouldCompareBaseline
    ? compareWithExistingF05(
        runF05PacingFunDecision(seed, { factionActorLoop: "on" }),
        branches,
      )
    : ({
        existingRecommendation: "NOT_READY" as const,
        existingScenarioId: scenario.id,
        existingSeed: seed,
        existingHorizonYears: F05_HORIZON_YEARS,
        existingContextCount: F05_CONTEXTS.length,
        existingBranchCount:
          F05_CONTEXTS.length * Object.values(F05_STRATEGIES).length,
        comparedBranchCount: 0,
        trajectorySignatureMismatches: [],
        actionCountMismatches: [],
        silenceMismatches: [],
        reproduced: false,
      } satisfies Gate1FBaselineComparison);
  const silence = selectedContexts.map((context) =>
    contextSilence(branches, context),
  );
  return {
    scenarioId: scenario.id,
    seed,
    horizonYears: F05_HORIZON_YEARS,
    horizonDays: F05_HORIZON_YEARS * F03_DAYS_PER_YEAR,
    factionActorLoop: "on",
    baselineReproduced: baselineComparison.reproduced,
    baselineComparison,
    branches,
    recoveryChoiceMatrix: recoveryMatrix(branches),
    silence,
    reconvergence: reconvergence(branches, selectedContexts),
    repairCandidates: repairCandidates(),
    recommendedRepairId: "R1_RECOVERY_RESPONSE_RECOMPOSITION",
    designOnly: true,
  };
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}

function formatAvailability(sample: Gate1FAvailabilitySample): string {
  return sample.feasibleResponses.join(",") || "NONE";
}

function formatDistribution(
  distribution: Readonly<Record<string, number>>,
): string {
  return (
    Object.entries(distribution)
      .filter(([, count]) => count > 0)
      .map(([bin, count]) => `${bin}:${count}`)
      .join(" ") || "none"
  );
}

export function formatGate1FDiagnosisV2(
  result: Gate1FDiagnosisV2Result,
): string {
  const lines = [
    "GATE1F DIAGNOSIS V2 (DIAGNOSTIC ONLY)",
    `scenario=${result.scenarioId} seed=${result.seed} horizon=${result.horizonDays}d actorLoop=${result.factionActorLoop.toUpperCase()}`,
    `baselineReproduced=${result.baselineReproduced} existingRecommendation=${result.baselineComparison.existingRecommendation}`,
    `branches=${result.branches.length} compared=${result.baselineComparison.comparedBranchCount} trajectoryMismatches=${result.baselineComparison.trajectorySignatureMismatches.length} actionMismatches=${result.baselineComparison.actionCountMismatches.length} silenceMismatches=${result.baselineComparison.silenceMismatches.length}`,
    "",
    "Recovery choice matrix: ACTIVE_CONFLICT_RECOVERY_T180",
    "| strategy | cost/load/days | feasible | attempts/start/complete/reject | immediate H/U/T/C | 90d H/U/T/C | 360d H/U/T/C | final H/U/T/C | institution | availability | classification |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const row of result.recoveryChoiceMatrix) {
    const compact = (consequence: Gate1FConsequenceMeasurement) =>
      `${formatNumber(consequence.checkpoint.metrics.controlledLandHexes)}/${formatNumber(consequence.checkpoint.metrics.maxRegionUnrest)}/${formatNumber(consequence.checkpoint.metrics.treasury)}/${formatNumber(consequence.checkpoint.metrics.activeConflicts)}`;
    const definition = row.definition;
    lines.push(
      `| ${row.strategyId} | ${definition ? `${definition.treasuryCost}/${definition.administrativeLoad}/${definition.durationDays}` : "0/0/0"} | ${row.feasibleAtStart ? "YES" : `NO:${row.startFeasibilityReasons.join(",")}`} | ${row.actions.attempts}/${row.actions.starts}/${row.actions.completions}/${row.actions.rejections} | ${compact(row.immediate)} | ${compact(row.day90)} | ${compact(row.day360)} | ${compact(row.final)} | ${row.institutionalConsequence.changedRules.join(",") || "none"} | ${formatAvailability(row.availability.atStart)} -> ${formatAvailability(row.availability.day90)} | ${row.classification} |`,
    );
  }
  lines.push(
    "",
    "Recovery detailed deltas (T=treasury, I=instability, U=unrest, S=scarcity, G=grievance, O=organization, H=player Hexes, C=active conflicts)",
    "| strategy | Δ day1 | Δ day90 | Δ day360 | Δ horizon | territory controller counts start/90/360/final | institution start -> final | availability day1/90/360 | causal chain sample |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  );
  for (const row of result.recoveryChoiceMatrix) {
    const delta = (consequence: Gate1FConsequenceMeasurement) => {
      const value = consequence.deltaFromStart;
      return `T${value.treasury.toFixed(0)} I${value.instability.toFixed(3)} U${value.maxRegionUnrest.toFixed(3)} S${value.maxRegionScarcity.toFixed(3)} G${value.factionGrievance.toFixed(3)} O${value.factionOrganization.toFixed(3)} H${value.controlledLandHexes} C${value.activeConflicts}`;
    };
    const counts = (snapshot: Gate1FControllerSnapshot) =>
      Object.entries(snapshot.counts)
        .map(([key, count]) => `${key}=${count}`)
        .join(",") || "none";
    const institution = row.institutionalConsequence;
    lines.push(
      `| ${row.strategyId} | ${delta(row.immediate)} | ${delta(row.day90)} | ${delta(row.day360)} | ${delta(row.final)} | ${counts(row.territoryControllerConsequence.start)} / ${counts(row.territoryControllerConsequence.day90)} / ${counts(row.territoryControllerConsequence.day360)} / ${counts(row.territoryControllerConsequence.final)} | ${institution.start.politicalCompetition}/${institution.start.pressFreedom} -> ${institution.final.politicalCompetition}/${institution.final.pressFreedom} (${institution.changedRules.join(",") || "none"}) | ${formatAvailability(row.availability.day1)} / ${formatAvailability(row.availability.day90)} / ${formatAvailability(row.availability.day360)} | ${row.causalChain.slice(0, 4).join("; ") || "none"} |`,
    );
  }
  lines.push(
    "",
    "Political silence by context (max / median / p90 days; branch aggregate)",
    "| context | decision opportunities | major event clusters | map-visible changes | availability changes |",
    "| --- | --- | --- | --- | --- |",
  );
  for (const context of result.silence) {
    const formatChannel = (channel: DiagnosticChannel) =>
      `${context.channelMaximumDays[channel]}/${context.channelMedianDays[channel]}/${context.channelP90Days[channel]}`;
    lines.push(
      `| ${context.contextId} | ${formatChannel("meaningfulDecisionOpportunities")} | ${formatChannel("majorEventClusters")} | ${formatChannel("mapVisibleStateChanges")} | ${formatChannel("actionAvailabilityChanges")} |`,
    );
  }
  lines.push(
    "",
    "Silence distributions for representative primary contexts",
    "| context | channel | distributions |",
    "| --- | --- | --- |",
  );
  for (const context of result.silence.filter(
    (candidate) =>
      F05_CONTEXTS.find((definition) => definition.id === candidate.contextId)
        ?.primary,
  )) {
    for (const channel of DIAGNOSTIC_CHANNELS) {
      lines.push(
        `| ${context.contextId} | ${channel} | ${formatDistribution(context.channelDistributions[channel])} |`,
      );
    }
  }
  lines.push(
    "",
    "Reconvergence at relative branch ticks",
    "| context | strategy | first divergent checkpoint | divergent checkpoints | horizon reconverged | horizon dimensions |",
    "| --- | --- | ---: | ---: | --- | --- |",
  );
  for (const context of result.reconvergence) {
    for (const branch of context.branches) {
      lines.push(
        `| ${context.contextId} | ${branch.strategyId} | ${branch.firstDivergentCheckpoint ?? "none"} | ${branch.divergentCheckpointCount} | ${branch.reconvergedAtHorizon ? "YES" : "NO"} | ${branch.persistentDimensionsAtHorizon.join(",") || "none"} |`,
      );
    }
  }
  lines.push(
    "",
    "Reconvergence differences at each required checkpoint (strategy:dimension count[labels])",
    "| context | relative tick | non-WAIT differences |",
    "| --- | ---: | --- |",
  );
  for (const context of result.reconvergence) {
    for (const checkpoint of context.checkpoints) {
      const differences = checkpoint.branches
        .filter(
          (branch) =>
            branch.strategyId !== F05_STRATEGIES.wait &&
            branch.differentFromWait,
        )
        .map(
          (branch) =>
            `${branch.strategyId}:${branch.differenceDimensionCount}[${branch.differingDimensions.join(",")}]`,
        )
        .join("; ");
      lines.push(
        `| ${context.contextId} | ${checkpoint.relativeTick} | ${differences || "none"} |`,
      );
    }
  }
  lines.push(
    "",
    `Recommended design-only candidate: ${result.recommendedRepairId}`,
    "No Gate1F pass judgment is produced by this runner.",
  );
  return lines.join("\n");
}
