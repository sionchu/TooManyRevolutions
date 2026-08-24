import type {
  F05Fix9BranchAudit,
  F05Fix9AuditResult,
} from "./f05Fix9LateSteadyStateAudit";
import {
  F05_FIX9_DEFAULT_SEED,
  runF05Fix9LateSteadyStateAudit,
} from "./f05Fix9LateSteadyStateAudit";
import {
  deriveFactionObservation,
  FACTION_HEURISTIC_THRESHOLDS,
  chooseFactionActionType,
  type FactionObservation,
} from "../systems/factionPressure";
import {
  type FactionActionType,
  type FactionActionPayload,
} from "../state/action";
import { asFactionId } from "../state/ids";
import { createF05Fix7PoliticalInteractionScenario } from "../state/politicalInteractionFixture";

export type F05Fix10Reachability =
  "REACHABLE" | "PARTIALLY_REACHABLE" | "NOT_REACHABLE";

export type F05Fix10PrimaryClassification =
  | "COVERAGE_NEXT_SLICE_FUND_MOVEMENT_INTERNAL_COMMITMENT"
  | "COVERAGE_NEXT_SLICE_ORGANIZE_INTERNAL_COMMITMENT"
  | "SECOND_LOBBY_REACHABLE_AND_SUFFICIENT"
  | "COVERAGE_REQUIRES_ACTION_SCHEMA_TARGETING"
  | "COVERAGE_INSUFFICIENT_GROUNDING";

export type F05Fix10GateStatus = "PASS" | "FAIL" | "BLOCKED";

export interface F05Fix10GuardResult {
  readonly winner: FactionActionType;
  readonly reason: string;
}

export interface F05Fix10MonthlyBoundary {
  readonly branchKey: string;
  readonly contextId: string;
  readonly strategyId: string;
  readonly relativeTick: number;
  readonly activeConflictCount: number;
  readonly countryLandHexCount: number;
  readonly blockerState: boolean;
  readonly factionId: string;
  readonly factionName: string;
  readonly grievance: number;
  readonly resources: number;
  readonly organization: number;
  readonly influence: number;
  readonly legalActions: Readonly<Record<FactionActionType, boolean>>;
  readonly selectedAction: FactionActionType;
  readonly firstWinningGuard: F05Fix10GuardResult;
  readonly secondLobbyWouldBeSelected: boolean;
  readonly existingLobbyTemplate: boolean;
  readonly relevantRegionIds: readonly string[];
}

export interface F05Fix10BranchSummary {
  readonly branchKey: string;
  readonly contextId: string;
  readonly strategyId: string;
  readonly lateInterval: {
    readonly startTick: number;
    readonly endTick: number;
    readonly durationDays: number;
  };
  readonly monthlyBoundaryCount: number;
  readonly blockerBoundaryCount: number;
  readonly actionCounts: Readonly<Record<FactionActionType, number>>;
  readonly guardCounts: Readonly<Record<FactionActionType, number>>;
  readonly lobbySelectionCount: number;
  readonly fundMovementSelectionCount: number;
  readonly organizeSelectionCount: number;
}

export interface F05Fix10FactionFrequency {
  readonly factionId: string;
  readonly factionName: string;
  readonly boundaryCount: number;
  readonly blockerBoundaryCount: number;
  readonly selectedActionCounts: Readonly<Record<FactionActionType, number>>;
  readonly firstGuardCounts: Readonly<Record<FactionActionType, number>>;
  readonly secondLobbySelectionCount: number;
}

export interface F05Fix10GateAudit {
  readonly naturalReachability: F05Fix10GateStatus;
  readonly actionObject: F05Fix10GateStatus;
  readonly target: F05Fix10GateStatus;
  readonly commitment: F05Fix10GateStatus;
  readonly costOpportunityCost: F05Fix10GateStatus;
  readonly boundedConsequence: F05Fix10GateStatus;
  readonly magnitudeGrounding: F05Fix10GateStatus;
  readonly naturalRepeatLimit: F05Fix10GateStatus;
  readonly causalVisibility: F05Fix10GateStatus;
  readonly persistenceReplay: F05Fix10GateStatus;
  readonly noImplementationKnowledgeChooser: F05Fix10GateStatus;
  readonly referenceGrounding: F05Fix10GateStatus;
}

export interface F05Fix10AuditResult {
  readonly scenarioId: string;
  readonly seed: number;
  readonly sourceF05Fix9LateBranchCount: number;
  readonly exactLateSilencePopulation: number;
  readonly lateMonthlyBoundaryCount: number;
  readonly blockerMonthlyBoundaryCount: number;
  readonly monthlyBoundaries: readonly F05Fix10MonthlyBoundary[];
  readonly branchSummaries: readonly F05Fix10BranchSummary[];
  readonly factionFrequencies: readonly F05Fix10FactionFrequency[];
  readonly actionFrequency: Readonly<Record<FactionActionType, number>>;
  readonly firstGuardFrequency: Readonly<Record<FactionActionType, number>>;
  readonly secondLobbyReachability: F05Fix10Reachability;
  readonly secondLobbySelectionCount: number;
  readonly fundMovementReachability: F05Fix10Reachability;
  readonly fundMovementSelectionCount: number;
  readonly organizeReachability: F05Fix10Reachability;
  readonly organizeSelectionCount: number;
  readonly activeConflictTrack: "DEFERRED_BY_GROUNDING_GATE";
  readonly outcomeTrack: "DEFERRED_BY_CONTINUITY_EVIDENCE";
  readonly fundMovementGates: F05Fix10GateAudit;
  readonly organizeGates: F05Fix10GateAudit;
  readonly targetObjectRequired: "YES" | "NO";
  readonly actionSchemaChangeRequired: "YES" | "NO";
  readonly commitmentModelStatus:
    "NOT_DESIGNABLE" | "DESIGNABLE_AFTER_ACTION_SCHEMA_TARGETING";
  readonly magnitudeGroundingStatus:
    "GROUNDED" | "BLOCKED_NO_AUTHORED_MAGNITUDE";
  readonly persistenceImplication:
    | "V4_UNCHANGED_NO_PRODUCTION_STATE"
    | "FUTURE_VERSION_REQUIRED_IF_COMMITMENT_STATE_IS_ADDED";
  readonly selectedAction: "FUND_MOVEMENT" | "ORGANIZE" | "LOBBY" | "NONE";
  readonly primaryClassification: F05Fix10PrimaryClassification;
  readonly productionGameplayChange: "NONE";
  readonly historicalF05Baseline: "UNCHANGED";
  readonly f05Fix9Diagnosis: "UNCHANGED";
  readonly gate1fRecommendation: "NOT_READY";
  readonly v02: "NOT_STARTED";
}

const ACTION_TYPES: readonly FactionActionType[] = [
  "LOBBY",
  "BARGAIN",
  "ORGANIZE",
  "FUND_MOVEMENT",
  "ACCEPT",
  "WAIT",
];

function emptyActionCounts(): Record<FactionActionType, number> {
  return {
    LOBBY: 0,
    BARGAIN: 0,
    ORGANIZE: 0,
    FUND_MOVEMENT: 0,
    ACCEPT: 0,
    WAIT: 0,
  };
}

function increment(
  counts: Record<FactionActionType, number>,
  action: FactionActionType,
): void {
  counts[action] = (counts[action] ?? 0) + 1;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}

function guardForObservation(
  observation: FactionObservation,
): F05Fix10GuardResult {
  const { faction, regional, availableActions } = observation;
  const thresholds = FACTION_HEURISTIC_THRESHOLDS;
  const regionalPressure = Math.max(
    regional.averageScarcity,
    regional.averageUnrest,
    observation.country.instability / 100,
  );
  const organizingCapacity = Math.max(
    faction.organization,
    regional.affinityWeightedIdeologyOrganization,
  );

  if (
    faction.grievance >= thresholds.fundGrievance &&
    faction.resources >= thresholds.minimumFundResources &&
    faction.organization >= thresholds.minimumOrganizingCapacity &&
    availableActions.FUND_MOVEMENT
  ) {
    return {
      winner: "FUND_MOVEMENT",
      reason:
        "fundGrievance + minimumFundResources + minimumOrganizingCapacity + legal FUND_MOVEMENT",
    };
  }

  if (
    faction.grievance >= thresholds.organizeGrievance &&
    organizingCapacity >= thresholds.minimumOrganizingCapacity &&
    availableActions.ORGANIZE
  ) {
    return {
      winner: "ORGANIZE",
      reason:
        "organizeGrievance + organizingCapacity + legal ORGANIZE (FUND_MOVEMENT guard did not win)",
    };
  }

  if (
    faction.grievance >= thresholds.lobbyGrievance &&
    faction.influence >= thresholds.minimumLobbyInfluence &&
    availableActions.LOBBY
  ) {
    return {
      winner: "LOBBY",
      reason:
        "lobbyGrievance + minimumLobbyInfluence + legal LOBBY (higher guards did not win)",
    };
  }

  if (
    faction.grievance >= thresholds.bargainGrievance &&
    (faction.influence >= 0.2 ||
      faction.resources >= 0.2 ||
      observation.stateWeakness >= 0.5) &&
    availableActions.BARGAIN
  ) {
    return {
      winner: "BARGAIN",
      reason:
        "bargainGrievance + leverage/stateWeakness + legal BARGAIN (higher guards did not win)",
    };
  }

  if (
    faction.grievance <= thresholds.lowGrievance &&
    regionalPressure <= 0.25 &&
    availableActions.ACCEPT
  ) {
    return {
      winner: "ACCEPT",
      reason: "lowGrievance + low regional pressure + legal ACCEPT",
    };
  }

  return {
    winner: "WAIT",
    reason: "no higher action guard passed",
  };
}

function classifyReachability(
  selectedCount: number,
  branchCount: number,
  branchesWithSelection: number,
): F05Fix10Reachability {
  if (selectedCount === 0) return "NOT_REACHABLE";
  return branchesWithSelection === branchCount
    ? "REACHABLE"
    : "PARTIALLY_REACHABLE";
}

function branchMonthlyTicks(branch: F05Fix9BranchAudit): readonly number[] {
  const late = branch.lateInterval;
  if (late === null) return [];

  return [...branch.trace.snapshots.keys()]
    .filter(
      (relativeTick) =>
        relativeTick >= late.startTick &&
        relativeTick < late.endTick &&
        relativeTick % 30 === 0,
    )
    .sort((first, second) => first - second);
}

function branchSummary(
  branch: F05Fix9BranchAudit,
  rows: readonly F05Fix10MonthlyBoundary[],
): F05Fix10BranchSummary {
  const actionCounts = emptyActionCounts();
  const guardCounts = emptyActionCounts();
  for (const row of rows) {
    increment(actionCounts, row.selectedAction);
    increment(guardCounts, row.firstWinningGuard.winner);
  }
  const late = branch.lateInterval;
  if (late === null) {
    throw new Error(
      `F05_FIX10 branch ${branch.contextId} has no late interval.`,
    );
  }
  return {
    branchKey: `${branch.mode}:${branch.contextId}:${branch.strategyId}`,
    contextId: branch.contextId,
    strategyId: branch.strategyId,
    lateInterval: {
      startTick: late.startTick,
      endTick: late.endTick,
      durationDays: late.durationDays,
    },
    monthlyBoundaryCount: rows.length,
    blockerBoundaryCount: rows.filter((row) => row.blockerState).length,
    actionCounts,
    guardCounts,
    lobbySelectionCount: actionCounts.LOBBY,
    fundMovementSelectionCount: actionCounts.FUND_MOVEMENT,
    organizeSelectionCount: actionCounts.ORGANIZE,
  };
}

function factionFrequency(
  factionId: string,
  rows: readonly F05Fix10MonthlyBoundary[],
): F05Fix10FactionFrequency {
  const selectedActionCounts = emptyActionCounts();
  const firstGuardCounts = emptyActionCounts();
  const factionRows = rows.filter((row) => row.factionId === factionId);
  for (const row of factionRows) {
    increment(selectedActionCounts, row.selectedAction);
    increment(firstGuardCounts, row.firstWinningGuard.winner);
  }
  return {
    factionId,
    factionName: factionRows[0]?.factionName ?? factionId,
    boundaryCount: factionRows.length,
    blockerBoundaryCount: factionRows.filter((row) => row.blockerState).length,
    selectedActionCounts,
    firstGuardCounts,
    secondLobbySelectionCount: factionRows.filter(
      (row) => row.secondLobbyWouldBeSelected,
    ).length,
  };
}

function targetRequired(
  rows: readonly F05Fix10MonthlyBoundary[],
): "YES" | "NO" {
  // T021 consumes affected/relevant Regions, while the current action payload
  // carries only factionId. Do not silently choose a Region from that set.
  return rows.some((row) => row.relevantRegionIds.length > 0) ? "YES" : "NO";
}

function buildFundMovementGates(
  rows: readonly F05Fix10MonthlyBoundary[],
  targetObjectRequired: "YES" | "NO",
): F05Fix10GateAudit {
  const naturallySelected = rows.some(
    (row) => row.selectedAction === "FUND_MOVEMENT",
  );
  const currentPayloadKeys = [
    "factionId",
  ] satisfies readonly (keyof FactionActionPayload)[];
  const noActionSpecificPayload = currentPayloadKeys.length === 1;
  return {
    naturalReachability: naturallySelected ? "PASS" : "FAIL",
    actionObject: noActionSpecificPayload ? "FAIL" : "PASS",
    target: targetObjectRequired === "YES" ? "FAIL" : "BLOCKED",
    commitment: "FAIL",
    costOpportunityCost: "FAIL",
    boundedConsequence: "PASS",
    magnitudeGrounding: "FAIL",
    naturalRepeatLimit: "FAIL",
    causalVisibility: "PASS",
    persistenceReplay: "FAIL",
    noImplementationKnowledgeChooser: "PASS",
    referenceGrounding: "PASS",
  };
}

function buildOrganizeGates(
  rows: readonly F05Fix10MonthlyBoundary[],
): F05Fix10GateAudit {
  const naturallySelected = rows.some(
    (row) => row.selectedAction === "ORGANIZE",
  );
  return {
    naturalReachability: naturallySelected ? "PASS" : "FAIL",
    actionObject: "FAIL",
    target: "FAIL",
    commitment: "FAIL",
    costOpportunityCost: "FAIL",
    boundedConsequence: "PASS",
    magnitudeGrounding: "FAIL",
    naturalRepeatLimit: "FAIL",
    causalVisibility: "PASS",
    persistenceReplay: "FAIL",
    noImplementationKnowledgeChooser: "PASS",
    referenceGrounding: "PASS",
  };
}

function selectPrimaryClassification(
  secondLobbyReachability: F05Fix10Reachability,
  fundMovementReachability: F05Fix10Reachability,
  organizeReachability: F05Fix10Reachability,
  fundMovementGates: F05Fix10GateAudit,
  targetObjectRequired: "YES" | "NO",
): F05Fix10PrimaryClassification {
  if (
    secondLobbyReachability === "REACHABLE" &&
    fundMovementReachability === "NOT_REACHABLE" &&
    organizeReachability === "NOT_REACHABLE"
  ) {
    return "SECOND_LOBBY_REACHABLE_AND_SUFFICIENT";
  }

  if (
    fundMovementReachability !== "NOT_REACHABLE" &&
    targetObjectRequired === "YES" &&
    fundMovementGates.actionObject === "FAIL"
  ) {
    return "COVERAGE_REQUIRES_ACTION_SCHEMA_TARGETING";
  }

  if (
    fundMovementReachability !== "NOT_REACHABLE" &&
    fundMovementGates.commitment === "PASS" &&
    fundMovementGates.magnitudeGrounding === "PASS"
  ) {
    return "COVERAGE_NEXT_SLICE_FUND_MOVEMENT_INTERNAL_COMMITMENT";
  }

  if (organizeReachability !== "NOT_REACHABLE") {
    return "COVERAGE_NEXT_SLICE_ORGANIZE_INTERNAL_COMMITMENT";
  }

  return "COVERAGE_INSUFFICIENT_GROUNDING";
}

function buildMonthlyRows(
  audit: F05Fix9AuditResult,
): readonly F05Fix10MonthlyBoundary[] {
  const scenario = createF05Fix7PoliticalInteractionScenario();
  const rows: F05Fix10MonthlyBoundary[] = [];
  for (const branch of audit.lateSilenceBranches) {
    const late = branch.lateInterval;
    if (late === null) continue;
    for (const relativeTick of branchMonthlyTicks(branch)) {
      const world = branch.trace.worlds.get(relativeTick);
      const snapshot = branch.trace.snapshots.get(relativeTick);
      if (world === undefined || snapshot === undefined) {
        throw new Error(
          `F05_FIX10 missing monthly snapshot/world ${branch.contextId}:${relativeTick}.`,
        );
      }
      const activeConflictCount = snapshot.conflicts.filter(
        (conflict) => conflict.status === "active",
      ).length;
      const countryLandHexCount = snapshot.countryControlledLandHexIds.length;
      for (const factionSnapshot of snapshot.factions) {
        const factionId = asFactionId(factionSnapshot.factionId);
        const observation = deriveFactionObservation(
          world,
          factionId,
          scenario,
        );
        const firstWinningGuard = guardForObservation(observation);
        const selectedAction = chooseFactionActionType(observation);
        if (selectedAction !== factionSnapshot.selectedAction) {
          throw new Error(
            `F05_FIX10 chooser mismatch ${branch.contextId}:${relativeTick}:${factionId}: ${selectedAction} != ${factionSnapshot.selectedAction}.`,
          );
        }
        const existingLobbyTemplate =
          scenario.factionProposalTemplates?.some(
            (template) =>
              template.factionId === factionId &&
              template.triggerAction === "LOBBY",
          ) ?? false;
        rows.push({
          branchKey: `${branch.mode}:${branch.contextId}:${branch.strategyId}`,
          contextId: branch.contextId,
          strategyId: branch.strategyId,
          relativeTick,
          activeConflictCount,
          countryLandHexCount,
          blockerState: activeConflictCount > 0 && countryLandHexCount === 0,
          factionId: String(factionId),
          factionName: factionSnapshot.name,
          grievance: observation.faction.grievance,
          resources: observation.faction.resources,
          organization: observation.faction.organization,
          influence: observation.faction.influence,
          legalActions: { ...observation.availableActions },
          selectedAction,
          firstWinningGuard,
          secondLobbyWouldBeSelected:
            selectedAction === "LOBBY" && observation.availableActions.LOBBY,
          existingLobbyTemplate,
          relevantRegionIds: observation.regional.regionIds.map(String),
        });
      }
    }
  }
  return rows;
}

function branchesWithSelection(
  summaries: readonly F05Fix10BranchSummary[],
  action: FactionActionType,
): number {
  return summaries.filter((summary) => summary.actionCounts[action] > 0).length;
}

function branchesWithHypotheticalLobbySelection(
  branches: readonly F05Fix9BranchAudit[],
  rows: readonly F05Fix10MonthlyBoundary[],
): number {
  return branches.filter((branch) =>
    rows.some(
      (row) =>
        row.branchKey ===
          `${branch.mode}:${branch.contextId}:${branch.strategyId}` &&
        row.secondLobbyWouldBeSelected,
    ),
  ).length;
}

export function runF05Fix10StructuralRemedySelection(
  seed: typeof F05_FIX9_DEFAULT_SEED = F05_FIX9_DEFAULT_SEED,
): F05Fix10AuditResult {
  const f05Fix9 = runF05Fix9LateSteadyStateAudit(seed);
  const monthlyBoundaries = buildMonthlyRows(f05Fix9);
  const branchSummaries = f05Fix9.lateSilenceBranches.map((branch) =>
    branchSummary(
      branch,
      monthlyBoundaries.filter(
        (row) =>
          row.branchKey ===
          `${branch.mode}:${branch.contextId}:${branch.strategyId}`,
      ),
    ),
  );
  const actionFrequency = emptyActionCounts();
  const firstGuardFrequency = emptyActionCounts();
  for (const row of monthlyBoundaries) {
    increment(actionFrequency, row.selectedAction);
    increment(firstGuardFrequency, row.firstWinningGuard.winner);
  }
  const factionIds = [
    ...new Set(monthlyBoundaries.map((row) => row.factionId)),
  ].sort();
  const factionFrequencies = factionIds.map((factionId) =>
    factionFrequency(factionId, monthlyBoundaries),
  );
  const secondLobbySelectionCount = monthlyBoundaries.filter(
    (row) => row.secondLobbyWouldBeSelected,
  ).length;
  const fundMovementSelectionCount = actionFrequency.FUND_MOVEMENT;
  const organizeSelectionCount = actionFrequency.ORGANIZE;
  const secondLobbyReachability = classifyReachability(
    secondLobbySelectionCount,
    branchSummaries.length,
    branchesWithHypotheticalLobbySelection(
      f05Fix9.lateSilenceBranches,
      monthlyBoundaries,
    ),
  );
  const fundMovementReachability = classifyReachability(
    fundMovementSelectionCount,
    branchSummaries.length,
    branchesWithSelection(branchSummaries, "FUND_MOVEMENT"),
  );
  const organizeReachability = classifyReachability(
    organizeSelectionCount,
    branchSummaries.length,
    branchesWithSelection(branchSummaries, "ORGANIZE"),
  );
  const targetObjectRequired = targetRequired(monthlyBoundaries);
  const fundMovementGates = buildFundMovementGates(
    monthlyBoundaries,
    targetObjectRequired,
  );
  const organizeGates = buildOrganizeGates(monthlyBoundaries);
  const primaryClassification = selectPrimaryClassification(
    secondLobbyReachability,
    fundMovementReachability,
    organizeReachability,
    fundMovementGates,
    targetObjectRequired,
  );
  const selectedAction =
    primaryClassification ===
      "COVERAGE_NEXT_SLICE_FUND_MOVEMENT_INTERNAL_COMMITMENT" ||
    primaryClassification === "COVERAGE_REQUIRES_ACTION_SCHEMA_TARGETING"
      ? "FUND_MOVEMENT"
      : primaryClassification ===
          "COVERAGE_NEXT_SLICE_ORGANIZE_INTERNAL_COMMITMENT"
        ? "ORGANIZE"
        : primaryClassification === "SECOND_LOBBY_REACHABLE_AND_SUFFICIENT"
          ? "LOBBY"
          : "NONE";
  return {
    scenarioId: "gate1f.f05.fix7.political-interaction",
    seed,
    sourceF05Fix9LateBranchCount: f05Fix9.lateSilenceBranches.length,
    exactLateSilencePopulation: f05Fix9.exactLateSilencePopulation,
    lateMonthlyBoundaryCount: monthlyBoundaries.length,
    blockerMonthlyBoundaryCount: monthlyBoundaries.filter(
      (row) => row.blockerState,
    ).length,
    monthlyBoundaries,
    branchSummaries,
    factionFrequencies,
    actionFrequency,
    firstGuardFrequency,
    secondLobbyReachability,
    secondLobbySelectionCount,
    fundMovementReachability,
    fundMovementSelectionCount,
    organizeReachability,
    organizeSelectionCount,
    activeConflictTrack: "DEFERRED_BY_GROUNDING_GATE",
    outcomeTrack: "DEFERRED_BY_CONTINUITY_EVIDENCE",
    fundMovementGates,
    organizeGates,
    targetObjectRequired,
    actionSchemaChangeRequired: "YES",
    commitmentModelStatus:
      primaryClassification === "COVERAGE_REQUIRES_ACTION_SCHEMA_TARGETING"
        ? "DESIGNABLE_AFTER_ACTION_SCHEMA_TARGETING"
        : "NOT_DESIGNABLE",
    magnitudeGroundingStatus: "BLOCKED_NO_AUTHORED_MAGNITUDE",
    persistenceImplication:
      "FUTURE_VERSION_REQUIRED_IF_COMMITMENT_STATE_IS_ADDED",
    selectedAction,
    primaryClassification,
    productionGameplayChange: "NONE",
    historicalF05Baseline: "UNCHANGED",
    f05Fix9Diagnosis: "UNCHANGED",
    gate1fRecommendation: "NOT_READY",
    v02: "NOT_STARTED",
  };
}

function legalActionLabel(
  legalActions: Readonly<Record<FactionActionType, boolean>>,
): string {
  return ACTION_TYPES.filter((action) => legalActions[action]).join(",");
}

function countsLabel(
  counts: Readonly<Record<FactionActionType, number>>,
): string {
  return ACTION_TYPES.map((action) => `${action}=${counts[action]}`).join(" ");
}

function gateLabel(gates: F05Fix10GateAudit): string {
  return [
    `natural=${gates.naturalReachability}`,
    `object=${gates.actionObject}`,
    `target=${gates.target}`,
    `commitment=${gates.commitment}`,
    `cost=${gates.costOpportunityCost}`,
    `bounded=${gates.boundedConsequence}`,
    `magnitude=${gates.magnitudeGrounding}`,
    `repeat=${gates.naturalRepeatLimit}`,
    `causal=${gates.causalVisibility}`,
    `persistence=${gates.persistenceReplay}`,
    `chooser=${gates.noImplementationKnowledgeChooser}`,
    `reference=${gates.referenceGrounding}`,
  ].join(" ");
}

export function formatF05Fix10StructuralRemedySelection(
  result: F05Fix10AuditResult,
  includeBoundaryLedger = true,
): string {
  const lines = [
    "F05_FIX10 INTERACTION-COVERAGE STRUCTURAL REMEDY SELECTION",
    `scenario=${result.scenarioId} seed=${result.seed}`,
    `late population=${result.exactLateSilencePopulation} branches monthlyBoundaries=${result.lateMonthlyBoundaryCount} blockerBoundaries=${result.blockerMonthlyBoundaryCount}`,
    `selected action frequency: ${countsLabel(result.actionFrequency)}`,
    `first winning guard frequency: ${countsLabel(result.firstGuardFrequency)}`,
    `SECOND_LOBBY_REACHABILITY=${result.secondLobbyReachability} selected=${result.secondLobbySelectionCount}`,
    `FUND_MOVEMENT_REACHABILITY=${result.fundMovementReachability} selected=${result.fundMovementSelectionCount}`,
    `ORGANIZE_REACHABILITY=${result.organizeReachability} selected=${result.organizeSelectionCount}`,
    `ACTIVE_CONFLICT_TRACK=${result.activeConflictTrack}`,
    `OUTCOME_TRACK=${result.outcomeTrack}`,
    `FUND_MOVEMENT_GATES ${gateLabel(result.fundMovementGates)}`,
    `ORGANIZE_GATES ${gateLabel(result.organizeGates)}`,
    `TARGET_OBJECT_REQUIRED=${result.targetObjectRequired} ACTION_SCHEMA_CHANGE_REQUIRED=${result.actionSchemaChangeRequired}`,
    `COMMITMENT_MODEL_STATUS=${result.commitmentModelStatus}`,
    `MAGNITUDE_GROUNDING_STATUS=${result.magnitudeGroundingStatus}`,
    `PERSISTENCE_IMPLICATION=${result.persistenceImplication}`,
    `SELECTED_ACTION=${result.selectedAction}`,
    `PRIMARY_CLASSIFICATION=${result.primaryClassification}`,
    `PRODUCTION_GAMEPLAY_CHANGE=${result.productionGameplayChange} HISTORICAL_F05_BASELINE=${result.historicalF05Baseline} F05_FIX9_DIAGNOSIS=${result.f05Fix9Diagnosis}`,
    `GATE1F_RECOMMENDATION=${result.gate1fRecommendation} V02=${result.v02}`,
    "",
    "Branch summaries",
  ];
  for (const summary of result.branchSummaries) {
    lines.push(
      `${summary.branchKey} late=${summary.lateInterval.startTick}-${summary.lateInterval.endTick} (${summary.lateInterval.durationDays}d) monthly=${summary.monthlyBoundaryCount} blocker=${summary.blockerBoundaryCount} selected=${countsLabel(summary.actionCounts)} guards=${countsLabel(summary.guardCounts)}`,
    );
  }
  lines.push("", "Faction frequencies");
  for (const frequency of result.factionFrequencies) {
    lines.push(
      `${frequency.factionId} (${frequency.factionName}) boundaries=${frequency.boundaryCount} blocker=${frequency.blockerBoundaryCount} selected=${countsLabel(frequency.selectedActionCounts)} guards=${countsLabel(frequency.firstGuardCounts)} secondLobby=${frequency.secondLobbySelectionCount}`,
    );
  }
  if (includeBoundaryLedger) {
    lines.push(
      "",
      "Monthly boundary ledger",
      "branch | tick | faction | G/R/O/I | legal actions | selected | first winning guard | hypothetical second LOBBY | target Regions | blocker",
    );
    for (const row of result.monthlyBoundaries) {
      lines.push(
        `${row.branchKey} | ${row.relativeTick} | ${row.factionId} | ${formatNumber(row.grievance)}/${formatNumber(row.resources)}/${formatNumber(row.organization)}/${formatNumber(row.influence)} | ${legalActionLabel(row.legalActions)} | ${row.selectedAction} | ${row.firstWinningGuard.winner} (${row.firstWinningGuard.reason}) | ${row.secondLobbyWouldBeSelected ? "YES" : "NO"} | ${row.relevantRegionIds.join(",") || "none"} | ${row.blockerState ? "YES" : "NO"}`,
      );
    }
  }
  lines.push(
    "",
    "Required result fields",
    `PRIMARY_CLASSIFICATION: ${result.primaryClassification}`,
    `ACTIVE_CONFLICT_TRACK: ${result.activeConflictTrack}`,
    `OUTCOME_TRACK: ${result.outcomeTrack}`,
    `SECOND_LOBBY_REACHABILITY: ${result.secondLobbyReachability}`,
    `FUND_MOVEMENT_REACHABILITY: ${result.fundMovementReachability}`,
    `ORGANIZE_REACHABILITY: ${result.organizeReachability}`,
    `SELECTED_ACTION: ${result.selectedAction}`,
    `TARGET_OBJECT_REQUIRED: ${result.targetObjectRequired}`,
    `ACTION_SCHEMA_CHANGE_REQUIRED: ${result.actionSchemaChangeRequired}`,
    `COMMITMENT_MODEL_STATUS: ${result.commitmentModelStatus}`,
    `MAGNITUDE_GROUNDING_STATUS: ${result.magnitudeGroundingStatus}`,
    `PERSISTENCE_IMPLICATION: ${result.persistenceImplication}`,
    `PRODUCTION_GAMEPLAY_CHANGE: ${result.productionGameplayChange}`,
    `HISTORICAL_F05_BASELINE: ${result.historicalF05Baseline}`,
    `F05_FIX9_DIAGNOSIS: ${result.f05Fix9Diagnosis}`,
    "VITEST_RUNNER_STATUS: RECORDED_SEPARATELY_IN_RESULT",
    `GATE1F_RECOMMENDATION: ${result.gate1fRecommendation}`,
    `V02: ${result.v02}`,
  );
  return lines.join("\n");
}

export function runF05Fix10Inspection(): {
  readonly result: F05Fix10AuditResult;
  readonly allPassed: boolean;
  readonly output: string;
} {
  const result = runF05Fix10StructuralRemedySelection();
  const allPassed =
    result.sourceF05Fix9LateBranchCount === 6 &&
    result.exactLateSilencePopulation === 6 &&
    result.monthlyBoundaries.length > 0 &&
    result.productionGameplayChange === "NONE" &&
    result.historicalF05Baseline === "UNCHANGED" &&
    result.f05Fix9Diagnosis === "UNCHANGED" &&
    result.gate1fRecommendation === "NOT_READY" &&
    result.v02 === "NOT_STARTED";
  return {
    result,
    allPassed,
    output: formatF05Fix10StructuralRemedySelection(result),
  };
}
