import { shouldRunPoliticalUpdate } from "../core/politicalCadence";
import {
  F03_BRANCH_IDS,
  F03_DAYS_PER_YEAR,
  F03_DEFAULT_SEED,
  F03_HORIZON_YEARS,
  runF03Survey,
  type F03BranchId,
  type F03BranchObservation,
  type F03BranchResult,
  type F03SurveyResult,
} from "./f03InterventionCounterfactuals";
import {
  createGate1FValidationScenario,
  GATE1F_VALIDATION_INTERVENTION_IDS,
} from "../state/gate1fValidationFixture";
import type {
  CoupPrerequisiteSnapshot,
  CrisisGate,
  PoliticalCrisisPrerequisiteSnapshots,
  RebellionPrerequisiteSnapshot,
} from "../systems/politicalCrisis";
import { derivePoliticalCrisisPrerequisites } from "../systems/politicalCrisis";
import {
  deriveFactionObservation,
  type FactionObservation,
} from "../systems/factionPressure";
import { deriveRegionalPressureSnapshot } from "../systems/instability";
import {
  deriveAdministrativeHeadroom,
  deriveCommittedAdministrativeLoad,
} from "../state/intervention";
import {
  deriveOrderConsolidationEligibility,
  type OrderConsolidationEligibilitySnapshot,
} from "../systems/orderConsolidation";
import { isConflictResolutionBoundary } from "../systems/conflictResolution";
import type { FactionId, RegionId } from "../state/ids";
import type { ResourceType } from "../state/region";
import { asScenarioId } from "../state/ids";
import type { InterventionEffect } from "../state/intervention";
import type { ScenarioDefinition } from "../state/scenario";
import type { WorldState } from "../state/world";

const F03B_POLITICAL_EVENT_TYPES = new Set([
  "COUP_ATTEMPT_STARTED",
  "REBELLION_STARTED",
  "CIVIL_WAR_STARTED",
  "CONFLICT_RESOLVED",
  "LAND_HEX_CONTROL_CHANGED",
  "GOVERNMENT_TRANSITIONED",
  "ORDER_CONSOLIDATION_STARTED",
  "ORDER_CONSOLIDATED",
  "STATE_DISSOLVED",
]);

const F03B_TIMELINE_OFFSETS = new Set([0, 1, 30, 180, 360, 1_800, 3_600]);

export type F03BLeverage = "STRONG" | "MODERATE" | "WEAK" | "NOT_OBSERVABLE";

export type F03BPrimaryChokePoint =
  | "EFFECT_TOO_SMALL"
  | "EFFECT_TOO_LATE"
  | "EFFECT_DECAYS_OR_IS_OVERWRITTEN"
  | "OTHER_PREREQUISITE_DOMINATES"
  | "DETECTOR_CADENCE_MISSES_WINDOW"
  | "CONFLICT_DEDUP_OR_ACTIVE_STATE_BLOCKS_DIFFERENCE"
  | "CURRENT_FIXTURE_TOO_FAR_FROM_DECISION_BOUNDARY"
  | "DOWNSTREAM_EVENT_OUTCOME_SYSTEM_NOT_IMPLEMENTED"
  | "TRAJECTORY_RECONVERGES"
  | "NO_POLITICAL_DECISION_OPPORTUNITY"
  | "NO_PROBLEM"
  | "NONE";

export interface F03BThresholdMargin {
  readonly id: string;
  readonly status: "pass" | "fail";
  readonly value: number | boolean;
  readonly threshold: number | null;
  readonly margin: number | null;
  readonly direction: "atLeast" | null;
}

export interface F03BCrisisCandidateDiagnostic {
  readonly kind: "coup" | "rebellion";
  readonly factionId: string;
  readonly eligible: boolean;
  readonly gates: readonly F03BThresholdMargin[];
  readonly failedGateIds: readonly string[];
}

export interface F03BActiveConflictDiagnostic {
  readonly id: string;
  readonly kind: string;
  readonly participantFactionIds: readonly string[];
  readonly participantCountryIds: readonly string[];
}

export interface F03BConsolidationDiagnostic {
  readonly eligible: boolean;
  readonly failedCriteria: readonly string[];
  readonly stableRegionFailures: readonly string[];
  readonly stateCapacityMargin: number | null;
  readonly treasuryMargin: number | null;
  readonly activeCivilWarCount: number;
}

export interface F03BTargetStateDiagnostic {
  readonly regionId: string | null;
  readonly scarcity: number | null;
  readonly materialPressure: number | null;
  readonly combinedPressure: number | null;
  readonly unrest: number | null;
  readonly resourceCapacity: number | null;
  readonly factionId: string | null;
  readonly factionOrganization: number | null;
  readonly factionGrievance: number | null;
  readonly factionResources: number | null;
  readonly factionAverageUnrest: number | null;
  readonly factionAverageScarcity: number | null;
  readonly factionStateWeakness: number | null;
  readonly countryInstability: number | null;
}

export interface F03BTimelinePoint {
  readonly relativeTick: number;
  readonly absoluteTick: number;
  readonly t018Evaluated: boolean;
  readonly t016MonthlyBoundary: boolean;
  readonly t021WeeklyBoundary: boolean;
  readonly annualCheckpoint: boolean;
  readonly eventTypes: readonly string[];
  readonly politicalEventTypes: readonly string[];
  readonly crisisCandidates: readonly F03BCrisisCandidateDiagnostic[];
  readonly activeConflicts: readonly F03BActiveConflictDiagnostic[];
  readonly target: F03BTargetStateDiagnostic;
  readonly consolidation: F03BConsolidationDiagnostic;
  readonly treasury: number;
  readonly stateCapacity: number;
  readonly administrativeLoad: number;
  readonly administrativeHeadroom: number;
  readonly instability: number;
  readonly stateContinuity: number;
  readonly controlledLandHexes: number;
}

export interface F03BEligibilityWindow {
  readonly candidate: string;
  readonly firstDifferingTick: number;
  readonly lastDifferingTick: number;
  readonly durationTicks: number;
  readonly detectorEvaluationCount: number;
}

export interface F03BMetricDelta {
  readonly relativeTick: number;
  readonly scarcity: number | null;
  readonly materialPressure: number | null;
  readonly unrest: number | null;
  readonly instability: number;
  readonly resourceCapacity: number | null;
  readonly factionOrganization: number | null;
  readonly factionGrievance: number | null;
  readonly factionAverageUnrest: number | null;
  readonly factionAverageScarcity: number | null;
  readonly factionStateWeakness: number | null;
  readonly controlledLandHexes: number;
}

export interface F03BNaturalDrift {
  readonly waitRegionUnrestRange: readonly [number, number] | null;
  readonly waitScarcityRange: readonly [number, number] | null;
  readonly waitMaterialPressureRange: readonly [number, number] | null;
  readonly waitInstabilityRange: readonly [number, number];
  readonly waitFactionOrganizationRange: readonly [number, number] | null;
  readonly waitFactionGrievanceRange: readonly [number, number] | null;
}

export interface F03BBranchDiagnosis {
  readonly startingStateId: string;
  readonly checkpointTick: number;
  readonly branchId: F03BranchId;
  readonly interventionId: string | null;
  readonly accepted: boolean;
  readonly startTick: number | null;
  readonly completionTick: number | null;
  readonly monthlyFactionBoundaryCount: number;
  readonly t018EvaluationCount: number;
  readonly t021WeeklyBoundaryCount: number;
  readonly timeline: readonly F03BTimelinePoint[];
  readonly prerequisiteCheckpoints: readonly {
    readonly label: string;
    readonly relativeTick: number;
    readonly candidates: readonly F03BCrisisCandidateDiagnostic[];
  }[];
  readonly eligibilityWindows: readonly F03BEligibilityWindow[];
  readonly metricDeltas: readonly F03BMetricDelta[];
  readonly consolidationAtOneYear: F03BConsolidationDiagnostic | null;
  readonly naturalDrift: F03BNaturalDrift;
  readonly futurePoliticalEventCountAfterCompletion: number;
  readonly futurePoliticalEventTypesAfterCompletion: readonly string[];
  readonly activeConflictAtStart: boolean;
  readonly activeConflictAtCompletion: boolean;
  readonly politicalHistoryDivergence: boolean;
  readonly historyDivergence: boolean;
  readonly stateReConvergedAtHorizon: boolean;
  readonly effectPersistence: "PERSISTENT" | "DECAYS" | "NOT_OBSERVABLE";
  readonly leverage: F03BLeverage;
  readonly historyOpportunity: "PRESENT" | "ABSENT";
  readonly primaryChokePoints: readonly F03BPrimaryChokePoint[];
  readonly evidence: readonly string[];
}

export interface F03BSensitivityProbeRow {
  readonly scale: number;
  readonly accepted: boolean;
  readonly coupEligibilityDeltaAtOneYear: number;
  readonly rebellionEligibilityDeltaAtOneYear: number;
  readonly politicalHistoryDivergence: boolean;
  readonly stateDivergenceAtOneYear: boolean;
}

export interface F03BSensitivityProbe {
  readonly branchId: F03BranchId;
  readonly rows: readonly F03BSensitivityProbeRow[];
}

export interface F03BCheckpointDiagnosis {
  readonly stateId: string;
  readonly checkpointTick: number;
  readonly label: string;
  readonly branches: readonly F03BBranchDiagnosis[];
}

export interface F03BDiagnosisResult {
  readonly scenarioId: string;
  readonly scenarioVersion: number;
  readonly seed: number;
  readonly horizonYears: number;
  readonly f03: F03SurveyResult;
  readonly checkpoints: readonly F03BCheckpointDiagnosis[];
  readonly sensitivityProbes: readonly F03BSensitivityProbe[];
  readonly dominantBlockers: readonly string[];
  readonly f04Readiness: "READY" | "NOT_READY";
  readonly f04ReadinessEvidence: readonly string[];
  readonly deterministicSignature: string;
}

export interface F03BInspectionReport {
  readonly result: F03BDiagnosisResult;
  readonly allPassed: boolean;
  readonly output: string;
}

interface F03BTarget {
  readonly regionId: RegionId | null;
  readonly resourceType: ResourceType | null;
  readonly factionId: FactionId | null;
}

interface F03BInternalObservation extends F03BTimelinePoint {
  readonly candidateByKey: ReadonlyMap<string, F03BCrisisCandidateDiagnostic>;
  readonly targetStates: ReadonlyMap<string, F03BTargetStateDiagnostic>;
}

interface NumericRange {
  min: number;
  max: number;
}

interface MutableTargetRanges {
  regionUnrest?: NumericRange;
  scarcity?: NumericRange;
  materialPressure?: NumericRange;
  factionOrganization?: NumericRange;
  factionGrievance?: NumericRange;
}

interface MutableCapture {
  readonly startingStateId: string;
  readonly branchId: F03BranchId;
  readonly target: F03BTarget;
  readonly byTick: Map<number, F03BInternalObservation>;
  readonly points: F03BTimelinePoint[];
  readonly politicalEvents: Array<{
    readonly tick: number;
    readonly type: string;
  }>;
  readonly interventionStartTicks: number[];
  readonly completionTicks: number[];
  readonly detectorEvaluationTicks: number[];
  readonly monthlyFactionBoundaryTicks: number[];
  readonly weeklyConflictBoundaryTicks: number[];
  readonly targetRanges: Map<string, MutableTargetRanges>;
  regionUnrest?: NumericRange;
  scarcity?: NumericRange;
  materialPressure?: NumericRange;
  instability: NumericRange;
  factionOrganization?: NumericRange;
  factionGrievance?: NumericRange;
  previousEligibility: Map<string, boolean>;
}

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function compareNumbers(first: number, second: number): number {
  return first - second;
}

function addRange(
  range: NumericRange | undefined,
  value: number,
): NumericRange {
  return range === undefined
    ? { min: value, max: value }
    : { min: Math.min(range.min, value), max: Math.max(range.max, value) };
}

function targetForBranch(
  scenario: ScenarioDefinition,
  branchId: F03BranchId,
): F03BTarget {
  const interventionId =
    branchId === F03_BRANCH_IDS.short
      ? GATE1F_VALIDATION_INTERVENTION_IDS.short
      : branchId === F03_BRANCH_IDS.long
        ? GATE1F_VALIDATION_INTERVENTION_IDS.long
        : branchId === F03_BRANCH_IDS.prerequisite
          ? GATE1F_VALIDATION_INTERVENTION_IDS.prerequisite
          : null;
  const effects =
    interventionId === null
      ? []
      : (scenario.interventionCatalog[interventionId]?.completionEffects ?? []);
  const regionEffect = effects.find(
    (
      effect,
    ): effect is Extract<
      InterventionEffect,
      { readonly kind: "regionResourceProductionCapacityDelta" }
    > => effect.kind === "regionResourceProductionCapacityDelta",
  );
  const factionEffect = effects.find(
    (
      effect,
    ): effect is Extract<
      InterventionEffect,
      { readonly kind: "factionGrievanceDelta" | "factionOrganizationDelta" }
    > =>
      effect.kind === "factionGrievanceDelta" ||
      effect.kind === "factionOrganizationDelta",
  );

  return {
    regionId: regionEffect?.regionId ?? scenario.initialRegions[1]?.id ?? null,
    resourceType: regionEffect?.resourceType ?? null,
    factionId: factionEffect?.factionId ?? null,
  };
}

function targetKey(target: F03BTarget): string {
  return `${target.regionId ?? "none"}|${target.resourceType ?? "none"}|${target.factionId ?? "none"}`;
}

function diagnosticTargets(
  scenario: ScenarioDefinition,
): readonly F03BTarget[] {
  const targets = [
    targetForBranch(scenario, F03_BRANCH_IDS.wait),
    targetForBranch(scenario, F03_BRANCH_IDS.short),
    targetForBranch(scenario, F03_BRANCH_IDS.long),
    targetForBranch(scenario, F03_BRANCH_IDS.prerequisite),
  ];
  const unique = new Map<string, F03BTarget>();
  for (const target of targets) {
    unique.set(targetKey(target), target);
  }
  return [...unique.values()];
}

function gateDiagnostic(gate: CrisisGate): F03BThresholdMargin {
  const numeric =
    typeof gate.value === "number" && gate.threshold !== undefined;
  return {
    id: gate.id,
    status: gate.status,
    value: gate.value,
    threshold: gate.threshold ?? null,
    margin: numeric ? (gate.value as number) - gate.threshold! : null,
    direction: numeric ? "atLeast" : null,
  };
}

function candidateDiagnostic(
  snapshot: CoupPrerequisiteSnapshot | RebellionPrerequisiteSnapshot,
): F03BCrisisCandidateDiagnostic {
  const gates = snapshot.gates.map(gateDiagnostic);
  return {
    kind: snapshot.kind,
    factionId: snapshot.factionId,
    eligible: snapshot.eligible,
    gates,
    failedGateIds: gates
      .filter((gate) => gate.status === "fail")
      .map((gate) => gate.id),
  };
}

function candidateKey(
  candidate: Pick<F03BCrisisCandidateDiagnostic, "kind" | "factionId">,
): string {
  return `${candidate.kind}:${candidate.factionId}`;
}

function candidateDiagnostics(
  prerequisites: PoliticalCrisisPrerequisiteSnapshots,
): readonly F03BCrisisCandidateDiagnostic[] {
  return [
    ...prerequisites.coups.map(candidateDiagnostic),
    ...prerequisites.rebellions.map(candidateDiagnostic),
  ].sort(
    (first, second) =>
      compareStableText(first.kind, second.kind) ||
      compareStableText(first.factionId, second.factionId),
  );
}

function activeConflictDiagnostics(
  world: WorldState,
): readonly F03BActiveConflictDiagnostic[] {
  return Object.values(world.conflicts)
    .filter((conflict) => conflict.status === "active")
    .sort((first, second) => compareStableText(first.id, second.id))
    .map((conflict) => ({
      id: conflict.id,
      kind: conflict.kind,
      participantFactionIds: [...conflict.participantFactionIds].sort(
        compareStableText,
      ),
      participantCountryIds: [...conflict.participantCountryIds].sort(
        compareStableText,
      ),
    }));
}

function compactConsolidation(
  snapshot: OrderConsolidationEligibilitySnapshot,
): F03BConsolidationDiagnostic {
  return {
    eligible: snapshot.eligible,
    failedCriteria: [...snapshot.failedCriteria],
    stableRegionFailures: [...snapshot.stableRegions.missingRegionIds],
    stateCapacityMargin:
      snapshot.stateCapacity.actual === null
        ? null
        : snapshot.stateCapacity.actual - snapshot.stateCapacity.minimum,
    treasuryMargin:
      snapshot.treasury.actual === null
        ? null
        : snapshot.treasury.actual - snapshot.treasury.minimum,
    activeCivilWarCount: snapshot.activeCivilWar.activeConflictIds.length,
  };
}

function targetState(
  scenario: ScenarioDefinition,
  world: WorldState,
  target: F03BTarget,
): F03BTargetStateDiagnostic {
  const countryId = scenario.playerCountryId;
  const country = countryId === null ? undefined : world.countries[countryId];
  const region =
    target.regionId === null ? undefined : world.regions[target.regionId];
  const pressure =
    region === undefined
      ? null
      : deriveRegionalPressureSnapshot(world, region.id, {}, scenario);
  const faction =
    target.factionId === null ? undefined : world.factions[target.factionId];
  let factionObservation: FactionObservation | null = null;
  if (faction !== undefined) {
    factionObservation = deriveFactionObservation(world, faction.id, scenario);
  }

  return {
    regionId: region?.id ?? null,
    scarcity: region?.scarcity ?? null,
    materialPressure: pressure?.material.severity ?? null,
    combinedPressure: pressure?.combinedPressure ?? null,
    unrest: region?.unrest ?? null,
    resourceCapacity:
      region === undefined || target.resourceType === null
        ? null
        : (region.resourceProductionCapacity[target.resourceType] ?? 0),
    factionId: faction?.id ?? null,
    factionOrganization: faction?.organization ?? null,
    factionGrievance: faction?.grievance ?? null,
    factionResources: faction?.resources ?? null,
    factionAverageUnrest: factionObservation?.regional.averageUnrest ?? null,
    factionAverageScarcity:
      factionObservation?.regional.averageScarcity ?? null,
    factionStateWeakness: factionObservation?.stateWeakness ?? null,
    countryInstability: country?.instability ?? null,
  };
}

function makeTimelinePoint(
  scenario: ScenarioDefinition,
  observation: F03BranchObservation,
  target: F03BTarget,
  allTargets: readonly F03BTarget[],
): F03BInternalObservation {
  const prerequisites = derivePoliticalCrisisPrerequisites(
    scenario,
    observation.world,
  );
  const candidates = candidateDiagnostics(prerequisites);
  const candidateByKey = new Map(
    candidates.map((candidate) => [candidateKey(candidate), candidate]),
  );
  const t016MonthlyBoundary =
    observation.relativeTick > 0 &&
    shouldRunPoliticalUpdate(
      observation.world.tick,
      observation.world.date,
      "monthly",
    );
  const t021WeeklyBoundary =
    observation.relativeTick > 0 &&
    isConflictResolutionBoundary(
      observation.world.tick,
      observation.world.date,
    );
  const eventTypes = observation.events.map((event) => event.type);
  const politicalEventTypes = eventTypes.filter((type) =>
    F03B_POLITICAL_EVENT_TYPES.has(type),
  );
  const countryId = scenario.playerCountryId;
  const consolidation = deriveOrderConsolidationEligibility(
    scenario,
    observation.world,
  );
  const targetStates = new Map(
    allTargets.map((candidateTarget) => [
      targetKey(candidateTarget),
      targetState(scenario, observation.world, candidateTarget),
    ]),
  );

  return {
    relativeTick: observation.relativeTick,
    absoluteTick: observation.world.tick,
    t018Evaluated: observation.relativeTick > 0,
    t016MonthlyBoundary,
    t021WeeklyBoundary,
    annualCheckpoint:
      observation.relativeTick > 0 &&
      observation.relativeTick % F03_DAYS_PER_YEAR === 0,
    eventTypes,
    politicalEventTypes,
    crisisCandidates: candidates,
    activeConflicts: activeConflictDiagnostics(observation.world),
    target: targetStates.get(targetKey(target))!,
    consolidation: compactConsolidation(consolidation),
    treasury:
      countryId === null
        ? 0
        : (observation.world.countries[countryId]?.treasury ?? 0),
    stateCapacity:
      countryId === null
        ? 0
        : (observation.world.countries[countryId]?.stateCapacity ?? 0),
    administrativeLoad:
      countryId === null
        ? 0
        : deriveCommittedAdministrativeLoad(observation.world, countryId),
    administrativeHeadroom:
      countryId === null
        ? 0
        : deriveAdministrativeHeadroom(observation.world, countryId),
    instability:
      countryId === null
        ? 0
        : (observation.world.countries[countryId]?.instability ?? 0),
    stateContinuity:
      countryId === null
        ? 0
        : (observation.world.countries[countryId]?.stateContinuity ?? 0),
    controlledLandHexes:
      countryId === null
        ? 0
        : Object.values(observation.world.landHexStates).filter(
            (state) =>
              state.controller.kind === "country" &&
              state.controller.countryId === countryId,
          ).length,
    candidateByKey,
    targetStates,
  };
}

function observationIsInteresting(
  point: F03BInternalObservation,
  previousEligibility: ReadonlyMap<string, boolean>,
): boolean {
  const eligibilityChanged = [...point.candidateByKey.entries()].some(
    ([key, candidate]) => previousEligibility.get(key) !== candidate.eligible,
  );
  return (
    F03B_TIMELINE_OFFSETS.has(point.relativeTick) ||
    point.t016MonthlyBoundary ||
    point.annualCheckpoint ||
    point.eventTypes.length > 0 ||
    eligibilityChanged
  );
}

function observeBranch(
  scenario: ScenarioDefinition,
  observation: F03BranchObservation,
  captures: Map<string, MutableCapture>,
): void {
  const key = `${observation.startingStateId}:${observation.branchId}`;
  let capture = captures.get(key);
  if (capture === undefined) {
    const target = targetForBranch(scenario, observation.branchId);
    capture = {
      startingStateId: observation.startingStateId,
      branchId: observation.branchId,
      target,
      byTick: new Map(),
      points: [],
      politicalEvents: [],
      interventionStartTicks: [],
      completionTicks: [],
      detectorEvaluationTicks: [],
      monthlyFactionBoundaryTicks: [],
      weeklyConflictBoundaryTicks: [],
      targetRanges: new Map(),
      instability: {
        min: Number.POSITIVE_INFINITY,
        max: Number.NEGATIVE_INFINITY,
      },
      previousEligibility: new Map(),
    };
    captures.set(key, capture);
  }

  const point = makeTimelinePoint(
    scenario,
    observation,
    capture.target,
    diagnosticTargets(scenario),
  );
  capture.byTick.set(point.relativeTick, point);
  if (point.t018Evaluated) {
    capture.detectorEvaluationTicks.push(point.relativeTick);
  }
  if (point.t016MonthlyBoundary) {
    capture.monthlyFactionBoundaryTicks.push(point.relativeTick);
  }
  if (point.t021WeeklyBoundary) {
    capture.weeklyConflictBoundaryTicks.push(point.relativeTick);
  }
  for (const event of observation.events) {
    if (event.type === "INTERVENTION_STARTED") {
      capture.interventionStartTicks.push(point.relativeTick);
    }
    if (event.type === "INTERVENTION_COMPLETED") {
      capture.completionTicks.push(point.relativeTick);
    }
    if (F03B_POLITICAL_EVENT_TYPES.has(event.type)) {
      capture.politicalEvents.push({
        tick: point.relativeTick,
        type: event.type,
      });
    }
  }

  const target = point.target;
  if (target.unrest !== null) {
    capture.regionUnrest = addRange(capture.regionUnrest, target.unrest);
  }
  if (target.scarcity !== null) {
    capture.scarcity = addRange(capture.scarcity, target.scarcity);
  }
  if (target.materialPressure !== null) {
    capture.materialPressure = addRange(
      capture.materialPressure,
      target.materialPressure,
    );
  }
  capture.instability = addRange(capture.instability, point.instability);
  if (target.factionOrganization !== null) {
    capture.factionOrganization = addRange(
      capture.factionOrganization,
      target.factionOrganization,
    );
  }
  if (target.factionGrievance !== null) {
    capture.factionGrievance = addRange(
      capture.factionGrievance,
      target.factionGrievance,
    );
  }

  for (const [targetKeyValue, targetStateValue] of point.targetStates) {
    const ranges = capture.targetRanges.get(targetKeyValue) ?? {};
    if (targetStateValue.unrest !== null) {
      ranges.regionUnrest = addRange(
        ranges.regionUnrest,
        targetStateValue.unrest,
      );
    }
    if (targetStateValue.scarcity !== null) {
      ranges.scarcity = addRange(ranges.scarcity, targetStateValue.scarcity);
    }
    if (targetStateValue.materialPressure !== null) {
      ranges.materialPressure = addRange(
        ranges.materialPressure,
        targetStateValue.materialPressure,
      );
    }
    if (targetStateValue.factionOrganization !== null) {
      ranges.factionOrganization = addRange(
        ranges.factionOrganization,
        targetStateValue.factionOrganization,
      );
    }
    if (targetStateValue.factionGrievance !== null) {
      ranges.factionGrievance = addRange(
        ranges.factionGrievance,
        targetStateValue.factionGrievance,
      );
    }
    capture.targetRanges.set(targetKeyValue, ranges);
  }

  if (observationIsInteresting(point, capture.previousEligibility)) {
    capture.points.push(point);
  }
  capture.previousEligibility = new Map(
    [...point.candidateByKey.entries()].map(
      ([candidateKeyValue, candidate]) => [
        candidateKeyValue,
        candidate.eligible,
      ],
    ),
  );
}

function branchCaptureKey(stateId: string, branchId: F03BranchId): string {
  return `${stateId}:${branchId}`;
}

function getCapture(
  captures: ReadonlyMap<string, MutableCapture>,
  stateId: string,
  branchId: F03BranchId,
): MutableCapture {
  const capture = captures.get(branchCaptureKey(stateId, branchId));
  if (capture === undefined) {
    throw new Error(`F03B missing capture for ${stateId}/${branchId}.`);
  }
  return capture;
}

function getCandidate(
  capture: MutableCapture,
  relativeTick: number,
  key: string,
): F03BCrisisCandidateDiagnostic | undefined {
  return capture.byTick.get(relativeTick)?.candidateByKey.get(key);
}

function comparableTick(
  capture: MutableCapture,
  requestedTick: number,
): number | null {
  if (capture.byTick.has(requestedTick)) {
    return requestedTick;
  }
  const available = [...capture.byTick.keys()]
    .filter((tick) => tick <= requestedTick)
    .sort(compareNumbers);
  return available.at(-1) ?? null;
}

function pointAt(
  capture: MutableCapture,
  requestedTick: number,
): F03BInternalObservation | null {
  const tick = comparableTick(capture, requestedTick);
  return tick === null ? null : (capture.byTick.get(tick) ?? null);
}

function metricDeltaAt(
  branch: MutableCapture,
  wait: MutableCapture,
  requestedTick: number,
  target: F03BTarget,
): F03BMetricDelta {
  const branchPoint = pointAt(branch, requestedTick);
  const waitPoint = pointAt(wait, requestedTick);
  if (branchPoint === null || waitPoint === null) {
    return {
      relativeTick: requestedTick,
      scarcity: null,
      materialPressure: null,
      unrest: null,
      instability: 0,
      resourceCapacity: null,
      factionOrganization: null,
      factionGrievance: null,
      factionAverageUnrest: null,
      factionAverageScarcity: null,
      factionStateWeakness: null,
      controlledLandHexes: 0,
    };
  }
  const branchTarget =
    branchPoint.targetStates.get(targetKey(target)) ?? branchPoint.target;
  const waitTarget =
    waitPoint.targetStates.get(targetKey(target)) ?? waitPoint.target;
  const difference = (
    first: number | null,
    second: number | null,
  ): number | null =>
    first === null || second === null ? null : first - second;
  return {
    relativeTick: requestedTick,
    scarcity: difference(branchTarget.scarcity, waitTarget.scarcity),
    materialPressure: difference(
      branchTarget.materialPressure,
      waitTarget.materialPressure,
    ),
    unrest: difference(branchTarget.unrest, waitTarget.unrest),
    instability: branchPoint.instability - waitPoint.instability,
    resourceCapacity: difference(
      branchTarget.resourceCapacity,
      waitTarget.resourceCapacity,
    ),
    factionOrganization: difference(
      branchTarget.factionOrganization,
      waitTarget.factionOrganization,
    ),
    factionGrievance: difference(
      branchTarget.factionGrievance,
      waitTarget.factionGrievance,
    ),
    factionAverageUnrest: difference(
      branchTarget.factionAverageUnrest,
      waitTarget.factionAverageUnrest,
    ),
    factionAverageScarcity: difference(
      branchTarget.factionAverageScarcity,
      waitTarget.factionAverageScarcity,
    ),
    factionStateWeakness: difference(
      branchTarget.factionStateWeakness,
      waitTarget.factionStateWeakness,
    ),
    controlledLandHexes:
      branchPoint.controlledLandHexes - waitPoint.controlledLandHexes,
  };
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return [...new Set(values)].sort(compareStableText);
}

function createEligibilityWindows(
  branch: MutableCapture,
  wait: MutableCapture,
): readonly F03BEligibilityWindow[] {
  const keys = uniqueSorted([
    ...[...branch.byTick.values()].flatMap((point) => [
      ...point.candidateByKey.keys(),
    ]),
    ...[...wait.byTick.values()].flatMap((point) => [
      ...point.candidateByKey.keys(),
    ]),
  ]);
  const windows: F03BEligibilityWindow[] = [];
  for (const key of keys) {
    const ticks = [...new Set([...branch.byTick.keys(), ...wait.byTick.keys()])]
      .sort(compareNumbers)
      .filter((tick) => {
        const branchCandidate = getCandidate(branch, tick, key);
        const waitCandidate = getCandidate(wait, tick, key);
        return (
          branchCandidate !== undefined &&
          waitCandidate !== undefined &&
          branchCandidate.eligible !== waitCandidate.eligible
        );
      });
    if (ticks.length === 0) {
      continue;
    }

    let start = ticks[0]!;
    let previous = start;
    let count = 0;
    const flush = (end: number) => {
      windows.push({
        candidate: key,
        firstDifferingTick: start,
        lastDifferingTick: end,
        durationTicks: end - start + 1,
        detectorEvaluationCount: count,
      });
    };

    for (const tick of ticks) {
      if (tick !== previous && tick !== previous + 1) {
        flush(previous);
        start = tick;
        count = 0;
      }
      count +=
        branch.detectorEvaluationTicks.includes(tick) &&
        wait.detectorEvaluationTicks.includes(tick)
          ? 1
          : 0;
      previous = tick;
    }
    flush(previous);
  }
  return windows.sort(
    (first, second) =>
      first.firstDifferingTick - second.firstDifferingTick ||
      compareStableText(first.candidate, second.candidate),
  );
}

function naturalDrift(
  capture: MutableCapture,
  target: F03BTarget,
): F03BNaturalDrift {
  const range = (
    value: NumericRange | undefined,
  ): readonly [number, number] | null =>
    value === undefined ? null : [value.min, value.max];
  const targetRange = capture.targetRanges.get(targetKey(target));
  return {
    waitRegionUnrestRange: range(targetRange?.regionUnrest),
    waitScarcityRange: range(targetRange?.scarcity),
    waitMaterialPressureRange: range(targetRange?.materialPressure),
    waitInstabilityRange: [capture.instability.min, capture.instability.max],
    waitFactionOrganizationRange: range(targetRange?.factionOrganization),
    waitFactionGrievanceRange: range(targetRange?.factionGrievance),
  };
}

function candidateAtCompletion(
  capture: MutableCapture,
  key: string,
): F03BCrisisCandidateDiagnostic | undefined {
  const completion = capture.completionTicks[0];
  return completion === undefined
    ? undefined
    : getCandidate(capture, completion, key);
}

function targetGateId(branchId: F03BranchId): string | null {
  if (branchId === F03_BRANCH_IDS.long) {
    return "organization";
  }
  if (branchId === F03_BRANCH_IDS.prerequisite) {
    return "grievance";
  }
  return null;
}

function hasOtherPrerequisiteDominance(
  branch: MutableCapture,
  wait: MutableCapture,
): boolean {
  const gateId = targetGateId(branch.branchId);
  if (gateId === null) {
    return false;
  }
  const candidateKind =
    branch.branchId === F03_BRANCH_IDS.long ? "coup" : "rebellion";
  const target = branch.target.factionId;
  if (target === null) {
    return false;
  }
  const key = `${candidateKind}:${target}`;
  const branchCandidate = candidateAtCompletion(branch, key);
  const waitCandidate = candidateAtCompletion(wait, key);
  if (branchCandidate === undefined || waitCandidate === undefined) {
    return false;
  }
  const branchTargetGate = branchCandidate.gates.find(
    (gate) => gate.id === gateId,
  );
  const waitTargetGate = waitCandidate.gates.find((gate) => gate.id === gateId);
  const targetImproved =
    branchTargetGate !== undefined &&
    waitTargetGate !== undefined &&
    ((branchTargetGate.margin ?? 0) > (waitTargetGate.margin ?? 0) ||
      branchTargetGate.status !== waitTargetGate.status);
  return (
    targetImproved &&
    !branchCandidate.eligible &&
    branchCandidate.failedGateIds.some((failedGate) => failedGate !== gateId)
  );
}

function targetStateChanged(delta: F03BMetricDelta): boolean {
  return [
    delta.scarcity,
    delta.materialPressure,
    delta.unrest,
    delta.resourceCapacity,
    delta.factionOrganization,
    delta.factionGrievance,
    delta.factionAverageUnrest,
    delta.factionAverageScarcity,
    delta.factionStateWeakness,
  ].some((value) => value !== null && Math.abs(value) > 1e-9);
}

function effectPersistence(
  metricDeltas: readonly F03BMetricDelta[],
): F03BBranchDiagnosis["effectPersistence"] {
  const completion = metricDeltas.find(
    (delta) => delta.relativeTick === metricDeltas[0]?.relativeTick,
  );
  const horizon = metricDeltas.at(-1);
  if (
    completion === undefined ||
    horizon === undefined ||
    !targetStateChanged(completion)
  ) {
    return "NOT_OBSERVABLE";
  }
  return targetStateChanged(horizon) ? "PERSISTENT" : "DECAYS";
}

function activeConflictForCandidate(
  capture: MutableCapture,
  relativeTick: number,
  candidate: string,
): boolean {
  const point = pointAt(capture, relativeTick);
  if (point === null) {
    return false;
  }
  const [, factionId] = candidate.split(":");
  const kind = candidate.split(":")[0];
  return point.activeConflicts.some(
    (conflict) =>
      conflict.kind === kind &&
      conflict.participantFactionIds.includes(factionId ?? ""),
  );
}

function activeConflictAtBoundary(
  capture: MutableCapture,
  relativeTick: number,
  candidates: readonly string[],
): boolean {
  if (candidates.length > 0) {
    return candidates.some((candidate) =>
      activeConflictForCandidate(capture, relativeTick, candidate),
    );
  }
  return (pointAt(capture, relativeTick)?.activeConflicts.length ?? 0) > 0;
}

function checkpointCandidates(
  capture: MutableCapture,
  requestedTick: number,
): readonly F03BCrisisCandidateDiagnostic[] {
  return pointAt(capture, requestedTick)?.crisisCandidates ?? [];
}

function diagnosisChokePoints(
  branch: MutableCapture,
  wait: MutableCapture,
  branchResult: F03BranchResult,
  comparison: F03SurveyResult["comparisons"][number] | undefined,
  metricDeltas: readonly F03BMetricDelta[],
  windows: readonly F03BEligibilityWindow[],
): {
  readonly points: readonly F03BPrimaryChokePoint[];
  readonly evidence: readonly string[];
} {
  const points: F03BPrimaryChokePoint[] = [];
  const evidence: string[] = [];
  const completionTick = branch.completionTicks[0] ?? null;
  const futureEvents = wait.politicalEvents.filter(
    (event) => completionTick === null || event.tick > completionTick,
  );
  const firstPoliticalEvent = wait.politicalEvents[0]?.tick ?? null;
  const candidates = windows.map((window) => window.candidate);
  const activeAtStart = activeConflictAtBoundary(branch, 0, candidates);
  const activeAtCompletion =
    completionTick !== null &&
    activeConflictAtBoundary(branch, completionTick, candidates);

  if (
    completionTick !== null &&
    firstPoliticalEvent !== null &&
    firstPoliticalEvent < completionTick
  ) {
    points.push("EFFECT_TOO_LATE");
    evidence.push(
      `completion day ${completionTick} follows the first political event at day ${firstPoliticalEvent}`,
    );
  }
  if (hasOtherPrerequisiteDominance(branch, wait)) {
    points.push("OTHER_PREREQUISITE_DOMINATES");
    evidence.push(
      "the intervention-targeted gate improved, but another T018 gate remained failed",
    );
  }
  if (
    windows.length > 0 &&
    windows.every((window) => window.detectorEvaluationCount === 0)
  ) {
    points.push("DETECTOR_CADENCE_MISSES_WINDOW");
    evidence.push(
      "eligibility differed without a T018 evaluation inside the differing window",
    );
  }
  if (activeAtStart || activeAtCompletion) {
    points.push("CONFLICT_DEDUP_OR_ACTIVE_STATE_BLOCKS_DIFFERENCE");
    evidence.push(
      "an active conflict was present at the relevant branch boundary",
    );
  }
  if (futureEvents.length === 0 && windows.length === 0) {
    points.push("NO_POLITICAL_DECISION_OPPORTUNITY");
    points.push("CURRENT_FIXTURE_TOO_FAR_FROM_DECISION_BOUNDARY");
    evidence.push(
      "WAIT produced no future political event after completion and no eligibility window opened",
    );
  }
  if (
    windows.length === 0 &&
    targetStateChanged(
      metricDeltas[0] ??
        metricDeltas.at(-1) ?? {
          relativeTick: 0,
          scarcity: null,
          materialPressure: null,
          unrest: null,
          instability: 0,
          resourceCapacity: null,
          factionOrganization: null,
          factionGrievance: null,
          factionAverageUnrest: null,
          factionAverageScarcity: null,
          factionStateWeakness: null,
          controlledLandHexes: 0,
        },
    )
  ) {
    if (branch.branchId === F03_BRANCH_IDS.short) {
      points.push("NO_PROBLEM");
      evidence.push(
        "the material intervention changes a T017 input but does not directly target a T018 prerequisite gate",
      );
    } else if (
      !points.includes("OTHER_PREREQUISITE_DOMINATES") &&
      futureEvents.length > 0
    ) {
      points.push("EFFECT_TOO_SMALL");
      evidence.push(
        "authoritative state diverged but no T018 eligibility window opened",
      );
    }
  }
  if (comparison?.stateReConvergedAtHorizon === true) {
    points.push("TRAJECTORY_RECONVERGES");
    evidence.push("state metrics had re-converged at the requested horizon");
  }
  if (
    branchResult.events.conflictResolutions === 0 &&
    branchResult.events.governmentTransitions === 0 &&
    branchResult.events.territorialChanges === 0 &&
    futureEvents.length === 0 &&
    !activeAtStart &&
    !activeAtCompletion &&
    windows.length === 0
  ) {
    points.push("DOWNSTREAM_EVENT_OUTCOME_SYSTEM_NOT_IMPLEMENTED");
    evidence.push(
      "no conflict/outcome consumer produced a political event in this checkpoint horizon",
    );
  }
  const unique = [...new Set(points)];
  return {
    points: unique.length === 0 ? ["NONE"] : unique,
    evidence: [...new Set(evidence)],
  };
}

function leverageFor(
  metricDeltas: readonly F03BMetricDelta[],
  windows: readonly F03BEligibilityWindow[],
): F03BLeverage {
  const changed = metricDeltas.some(targetStateChanged);
  if (!changed) {
    return "NOT_OBSERVABLE";
  }
  if (windows.some((window) => window.durationTicks >= 30)) {
    return "STRONG";
  }
  if (windows.length > 0) {
    return "MODERATE";
  }
  return "WEAK";
}

function createBranchDiagnosis(
  stateId: string,
  checkpointTick: number,
  branch: MutableCapture,
  wait: MutableCapture,
  branchResult: F03BranchResult,
  comparison: F03SurveyResult["comparisons"][number] | undefined,
): F03BBranchDiagnosis {
  const completionTick = branch.completionTicks[0] ?? null;
  const offsets = [
    completionTick ?? 1,
    30,
    180,
    F03_DAYS_PER_YEAR,
    5 * F03_DAYS_PER_YEAR,
    branchResult.final.relativeTick,
  ];
  const metricDeltas = [...new Set(offsets)].map((tick) =>
    metricDeltaAt(branch, wait, tick, branch.target),
  );
  const windows = createEligibilityWindows(branch, wait);
  const choke = diagnosisChokePoints(
    branch,
    wait,
    branchResult,
    comparison,
    metricDeltas,
    windows,
  );
  const futureEvents = wait.politicalEvents.filter(
    (event) => completionTick === null || event.tick > completionTick,
  );
  const targetCandidateKeys = windows.map((window) => window.candidate);
  const activeConflictAtStart = activeConflictAtBoundary(
    branch,
    0,
    targetCandidateKeys,
  );
  const activeConflictAtCompletion =
    completionTick === null
      ? false
      : activeConflictAtBoundary(branch, completionTick, targetCandidateKeys);
  return {
    startingStateId: stateId,
    checkpointTick,
    branchId: branch.branchId,
    interventionId: branchResult.interventionId,
    accepted: branchResult.accepted,
    startTick: branch.interventionStartTicks[0] ?? null,
    completionTick,
    monthlyFactionBoundaryCount: branch.monthlyFactionBoundaryTicks.length,
    t018EvaluationCount: branch.detectorEvaluationTicks.length,
    t021WeeklyBoundaryCount: branch.weeklyConflictBoundaryTicks.length,
    timeline: branch.points,
    prerequisiteCheckpoints: [
      {
        label: "start",
        relativeTick: 0,
        candidates: checkpointCandidates(branch, 0),
      },
      ...(completionTick === null
        ? []
        : [
            {
              label: "completion",
              relativeTick: completionTick,
              candidates: checkpointCandidates(branch, completionTick),
            },
          ]),
      {
        label: "30d",
        relativeTick: 30,
        candidates: checkpointCandidates(branch, 30),
      },
      {
        label: "180d",
        relativeTick: 180,
        candidates: checkpointCandidates(branch, 180),
      },
      {
        label: "1y",
        relativeTick: F03_DAYS_PER_YEAR,
        candidates: checkpointCandidates(branch, F03_DAYS_PER_YEAR),
      },
    ],
    eligibilityWindows: windows,
    metricDeltas,
    consolidationAtOneYear:
      pointAt(branch, F03_DAYS_PER_YEAR)?.consolidation ?? null,
    naturalDrift: naturalDrift(wait, branch.target),
    futurePoliticalEventCountAfterCompletion: futureEvents.length,
    futurePoliticalEventTypesAfterCompletion: uniqueSorted(
      futureEvents.map((event) => event.type),
    ),
    activeConflictAtStart,
    activeConflictAtCompletion,
    politicalHistoryDivergence: comparison?.politicalHistoryDivergence ?? false,
    historyDivergence: comparison?.historyDivergence ?? false,
    stateReConvergedAtHorizon: comparison?.stateReConvergedAtHorizon ?? false,
    effectPersistence: effectPersistence(metricDeltas),
    leverage: leverageFor(metricDeltas, windows),
    historyOpportunity:
      futureEvents.length > 0 || windows.length > 0 ? "PRESENT" : "ABSENT",
    primaryChokePoints: choke.points,
    evidence: choke.evidence,
  };
}

function cloneScenarioWithEffectScale(
  scenario: ScenarioDefinition,
  branchId: F03BranchId,
  scale: number,
): ScenarioDefinition {
  const interventionId =
    branchId === F03_BRANCH_IDS.short
      ? GATE1F_VALIDATION_INTERVENTION_IDS.short
      : branchId === F03_BRANCH_IDS.long
        ? GATE1F_VALIDATION_INTERVENTION_IDS.long
        : GATE1F_VALIDATION_INTERVENTION_IDS.prerequisite;
  const definition = scenario.interventionCatalog[interventionId];
  if (definition === undefined) {
    throw new Error(
      `F03B sensitivity intervention ${interventionId} is missing.`,
    );
  }
  return {
    ...scenario,
    id: asScenarioId(`${scenario.id}.f03b-${branchId.toLowerCase()}-${scale}x`),
    interventionCatalog: {
      ...scenario.interventionCatalog,
      [interventionId]: {
        ...definition,
        completionEffects: definition.completionEffects?.map((effect) => ({
          ...effect,
          delta: effect.delta * scale,
        })),
      },
    },
  };
}

function runSensitivityProbe(
  scenario: ScenarioDefinition,
  seed: number,
  branchId: F03BranchId,
): F03BSensitivityProbe {
  const rows = [0.5, 1, 2, 4].map((scale) => {
    const scaledScenario = cloneScenarioWithEffectScale(
      scenario,
      branchId,
      scale,
    );
    const survey = runF03Survey(scaledScenario, seed, 2, {
      startingCheckpointTicks: [0],
      branchOrder: [F03_BRANCH_IDS.wait, branchId],
    });
    const state = survey.startingStates[0];
    const wait = state?.branches.find(
      (branch) => branch.branchId === F03_BRANCH_IDS.wait,
    );
    const branch = state?.branches.find(
      (candidate) => candidate.branchId === branchId,
    );
    if (wait === undefined || branch === undefined) {
      throw new Error(
        `F03B sensitivity probe is missing ${branchId} at scale ${scale}.`,
      );
    }
    const oneYear =
      branch.checkpoints.find(
        (checkpoint) => checkpoint.relativeTick === F03_DAYS_PER_YEAR,
      ) ?? branch.final;
    const waitOneYear =
      wait.checkpoints.find(
        (checkpoint) => checkpoint.relativeTick === F03_DAYS_PER_YEAR,
      ) ?? wait.final;
    return {
      scale,
      accepted: branch.accepted,
      coupEligibilityDeltaAtOneYear:
        oneYear.coupEligibleCount - waitOneYear.coupEligibleCount,
      rebellionEligibilityDeltaAtOneYear:
        oneYear.rebellionEligibleCount - waitOneYear.rebellionEligibleCount,
      politicalHistoryDivergence:
        branch.politicalEventSequence.join("|") !==
        wait.politicalEventSequence.join("|"),
      stateDivergenceAtOneYear:
        JSON.stringify(oneYear) !== JSON.stringify(waitOneYear),
    };
  });
  return { branchId, rows };
}

function diagnosisSignature(
  result: Omit<F03BDiagnosisResult, "deterministicSignature" | "f03">,
): string {
  return JSON.stringify({
    scenarioId: result.scenarioId,
    scenarioVersion: result.scenarioVersion,
    seed: result.seed,
    horizonYears: result.horizonYears,
    checkpoints: result.checkpoints,
    sensitivityProbes: result.sensitivityProbes,
    dominantBlockers: result.dominantBlockers,
    f04Readiness: result.f04Readiness,
    f04ReadinessEvidence: result.f04ReadinessEvidence,
  });
}

function compareBranchDiagnosis(
  first: F03BBranchDiagnosis,
  second: F03BBranchDiagnosis,
): number {
  return (
    compareStableText(first.startingStateId, second.startingStateId) ||
    compareStableText(first.branchId, second.branchId)
  );
}

function createDiagnosisResult(
  scenario: ScenarioDefinition,
  seed: number,
  horizonYears: number,
  f03: F03SurveyResult,
  captures: ReadonlyMap<string, MutableCapture>,
): F03BDiagnosisResult {
  const checkpoints: F03BCheckpointDiagnosis[] = f03.startingStates.map(
    (state) => {
      const wait = getCapture(captures, state.id, F03_BRANCH_IDS.wait);
      const branches = state.branches
        .filter((branch) => branch.branchId !== F03_BRANCH_IDS.wait)
        .map((branch) =>
          createBranchDiagnosis(
            state.id,
            state.checkpointTick,
            getCapture(captures, state.id, branch.branchId),
            wait,
            branch,
            f03.comparisons.find(
              (comparison) =>
                comparison.startingStateId === state.id &&
                comparison.interventionBranchId === branch.branchId,
            ),
          ),
        )
        .sort(compareBranchDiagnosis);
      return {
        stateId: state.id,
        checkpointTick: state.checkpointTick,
        label: state.label,
        branches,
      };
    },
  );

  const sensitivityProbes = [
    F03_BRANCH_IDS.long,
    F03_BRANCH_IDS.prerequisite,
  ].map((branchId) => runSensitivityProbe(scenario, seed, branchId));
  const allBranches = checkpoints.flatMap((checkpoint) => checkpoint.branches);
  const dominantBlockers = uniqueSorted(
    allBranches.flatMap((branch) => branch.primaryChokePoints),
  );
  const f04ReadinessEvidence: string[] = [];
  if (allBranches.some((branch) => branch.eligibilityWindows.length > 0)) {
    f04ReadinessEvidence.push(
      "at least one intervention changed a T018 eligibility window",
    );
  }
  if (
    allBranches.some(
      (branch) =>
        branch.leverage === "STRONG" ||
        (branch.leverage === "MODERATE" &&
          branch.historyOpportunity === "PRESENT"),
    )
  ) {
    f04ReadinessEvidence.push(
      "a persistent downstream leverage difference exists near a decision opportunity",
    );
  }
  if (f04ReadinessEvidence.length === 0) {
    f04ReadinessEvidence.push(
      "no branch changed a political decision boundary in the current validation checkpoints",
    );
  }
  const f04Readiness: F03BDiagnosisResult["f04Readiness"] =
    f04ReadinessEvidence.length > 0 &&
    !f04ReadinessEvidence.every((evidence) => evidence.startsWith("no branch"))
      ? "READY"
      : "NOT_READY";
  const withoutSignature = {
    scenarioId: scenario.id,
    scenarioVersion: scenario.version,
    seed,
    horizonYears,
    checkpoints,
    sensitivityProbes,
    dominantBlockers,
    f04Readiness,
    f04ReadinessEvidence,
  };
  return {
    ...withoutSignature,
    f03,
    deterministicSignature: diagnosisSignature({ ...withoutSignature }),
  };
}

export function runF03BDiagnosis(
  scenario: ScenarioDefinition = createGate1FValidationScenario(),
  seed: number = F03_DEFAULT_SEED,
  horizonYears: number = F03_HORIZON_YEARS,
): F03BDiagnosisResult {
  const captures = new Map<string, MutableCapture>();
  const f03 = runF03Survey(scenario, seed, horizonYears, {
    onBranchObservation: (observation) =>
      observeBranch(scenario, observation, captures),
  });
  return createDiagnosisResult(scenario, seed, horizonYears, f03, captures);
}

function formatNumber(value: number | null): string {
  return value === null
    ? "—"
    : Number.isInteger(value)
      ? String(value)
      : value.toFixed(3);
}

function formatGateSummary(candidate: F03BCrisisCandidateDiagnostic): string {
  return `${candidate.kind}/${candidate.factionId} ${candidate.eligible ? "eligible" : "ineligible"} [${candidate.gates
    .map((gate) => `${gate.id}:${formatNumber(gate.margin)}`)
    .join(", ")}]`;
}

function formatDiagnosisLine(branch: F03BBranchDiagnosis): string {
  const lastDelta = branch.metricDeltas.at(-1);
  return `| ${branch.startingStateId} | ${branch.branchId} | ${branch.accepted ? "YES" : "NO"} | ${branch.completionTick ?? "—"} | ${branch.leverage} | ${branch.historyOpportunity} | ${branch.eligibilityWindows.length > 0 ? "YES" : "NO"} | ${branch.politicalHistoryDivergence ? "YES" : "NO"} | ${branch.primaryChokePoints.join(", ")} | Δscarcity ${formatNumber(lastDelta?.scarcity ?? null)} / Δunrest ${formatNumber(lastDelta?.unrest ?? null)} / Δorg ${formatNumber(lastDelta?.factionOrganization ?? null)} / Δgrievance ${formatNumber(lastDelta?.factionGrievance ?? null)} |`;
}

function formatSensitivityProbe(
  probe: F03BSensitivityProbe,
): readonly string[] {
  return [
    `${probe.branchId}:`,
    "| scale | accepted | 1y coup eligibility Δ | 1y rebellion eligibility Δ | 1y state diff | political history diff |",
    "| ---: | --- | ---: | ---: | --- | --- |",
    ...probe.rows.map(
      (row) =>
        `| ${row.scale}x | ${row.accepted ? "YES" : "NO"} | ${row.coupEligibilityDeltaAtOneYear} | ${row.rebellionEligibilityDeltaAtOneYear} | ${row.stateDivergenceAtOneYear ? "YES" : "NO"} | ${row.politicalHistoryDivergence ? "YES" : "NO"} |`,
    ),
  ];
}

function formatMetricDelta(delta: F03BMetricDelta): string {
  return `day ${delta.relativeTick}: scarcity ${formatNumber(delta.scarcity)}, material ${formatNumber(delta.materialPressure)}, unrest ${formatNumber(delta.unrest)}, instability ${formatNumber(delta.instability)}, org ${formatNumber(delta.factionOrganization)}, grievance ${formatNumber(delta.factionGrievance)}`;
}

export function formatF03BInspection(report: F03BInspectionReport): string {
  const result = report.result;
  const lines = [
    "F03B Agency Leverage / Threshold Sensitivity Diagnosis",
    "",
    `Scenario: ${result.scenarioId} v${result.scenarioVersion}`,
    `Policy: WAIT plus one legal intervention`,
    `Seed: ${result.seed}`,
    `Horizon: ${result.horizonYears} years`,
    "",
    "Production changes: NO (measurement only)",
    "",
    "Branch diagnosis:",
    "| state | branch | accepted | completion | leverage | history opportunity | eligibility window | history divergence | primary choke point | terminal delta |",
    "| --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- |",
    ...result.checkpoints.flatMap((checkpoint) => [
      `### ${checkpoint.stateId} — checkpoint day ${checkpoint.checkpointTick} (${checkpoint.label})`,
      ...checkpoint.branches.map(formatDiagnosisLine),
      ...checkpoint.branches.flatMap((branch) => [
        `- ${branch.branchId}: T018 evaluations ${branch.t018EvaluationCount}, T016 monthly boundaries ${branch.monthlyFactionBoundaryCount}, T021 weekly boundaries ${branch.t021WeeklyBoundaryCount}, completion ${branch.completionTick ?? "none"}`,
        `  eligibility windows: ${branch.eligibilityWindows.map((window) => `${window.candidate} ${window.firstDifferingTick}–${window.lastDifferingTick} (${window.durationTicks}d; detector ${window.detectorEvaluationCount})`).join("; ") || "none"}`,
        `  future political events after completion: ${branch.futurePoliticalEventCountAfterCompletion} [${branch.futurePoliticalEventTypesAfterCompletion.join(", ") || "none"}]`,
        `  effect persistence: ${branch.effectPersistence}; natural WAIT ranges unrest ${branch.naturalDrift.waitRegionUnrestRange?.map(formatNumber).join("–") ?? "—"}, scarcity ${branch.naturalDrift.waitScarcityRange?.map(formatNumber).join("–") ?? "—"}, material ${branch.naturalDrift.waitMaterialPressureRange?.map(formatNumber).join("–") ?? "—"}, instability ${branch.naturalDrift.waitInstabilityRange.map(formatNumber).join("–")}, org ${branch.naturalDrift.waitFactionOrganizationRange?.map(formatNumber).join("–") ?? "—"}, grievance ${branch.naturalDrift.waitFactionGrievanceRange?.map(formatNumber).join("–") ?? "—"}`,
        `  target: region ${branch.timeline[0]?.target.regionId ?? "none"}, faction ${branch.timeline[0]?.target.factionId ?? "none"}`,
        `  target completion values: org ${formatNumber(branch.timeline.find((point) => point.relativeTick === branch.completionTick)?.target.factionOrganization ?? null)}, grievance ${formatNumber(branch.timeline.find((point) => point.relativeTick === branch.completionTick)?.target.factionGrievance ?? null)}`,
        `  active conflict at start/completion: ${branch.activeConflictAtStart ? "YES" : "NO"}/${branch.activeConflictAtCompletion ? "YES" : "NO"}`,
        `  downstream deltas: ${branch.metricDeltas.map(formatMetricDelta).join("; ")}`,
        `  T022 at 1y: ${branch.consolidationAtOneYear === null ? "not observed" : `${branch.consolidationAtOneYear.eligible ? "eligible" : "ineligible"}; failed ${branch.consolidationAtOneYear.failedCriteria.join(", ") || "none"}; stateCapacity margin ${formatNumber(branch.consolidationAtOneYear.stateCapacityMargin)}, treasury margin ${formatNumber(branch.consolidationAtOneYear.treasuryMargin)}, active civil wars ${branch.consolidationAtOneYear.activeCivilWarCount}`}`,
        `  T018 at start: ${branch.prerequisiteCheckpoints[0]?.candidates.map(formatGateSummary).join("; ") || "none"}`,
        `  T018 at completion: ${
          branch.prerequisiteCheckpoints
            .find((entry) => entry.label === "completion")
            ?.candidates.map(formatGateSummary)
            .join("; ") || "none"
        }`,
        `  evidence: ${branch.evidence.join("; ") || "none"}`,
      ]),
    ]),
    "",
    "Optional developer-only sensitivity probes (production values unchanged):",
    ...result.sensitivityProbes.flatMap(formatSensitivityProbe),
    "",
    "Dominant blockers:",
    ...result.dominantBlockers.map((blocker) => `- ${blocker}`),
    "",
    `F04 readiness: ${result.f04Readiness}`,
    ...result.f04ReadinessEvidence.map((evidence) => `- ${evidence}`),
    "",
    "F02/F03A regression: preserved by separate WAIT/no-intervention path",
    "Threshold/effect/cost/duration/cadence changes: NONE",
    "F04: COMPLETE / F05 NOT_READY",
    "V02: NOT STARTED",
    `Inspection invariants: ${report.allPassed ? "PASS" : "FAIL"}`,
  ];
  return lines.join("\n");
}

export function runF03BInspection(): F03BInspectionReport {
  const result = runF03BDiagnosis();
  const allBranches = result.checkpoints.flatMap(
    (checkpoint) => checkpoint.branches,
  );
  const allPassed =
    result.f03.usedScenarioSuitability.suitableForCounterfactuals &&
    allBranches.every((branch) => branch.accepted) &&
    result.sensitivityProbes.every((probe) =>
      probe.rows.every((row) => row.accepted),
    );
  const report: F03BInspectionReport = { result, allPassed, output: "" };
  return { ...report, output: formatF03BInspection(report) };
}

export function getF03BDiagnosisDeterministicSignature(
  result: F03BDiagnosisResult,
): string {
  return result.deterministicSignature;
}

export function printF03BInspection(): void {
  console.log(formatF03BInspection(runF03BInspection()));
}
