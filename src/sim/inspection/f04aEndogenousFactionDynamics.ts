import {
  F03_BRANCH_IDS,
  F03_DEFAULT_SEED,
  F03_DAYS_PER_YEAR,
  runF03Survey,
  type F03BranchId,
  type F03BranchResult,
  type F03StartingStateResult,
  type F03SurveyResult,
} from "./f03InterventionCounterfactuals";
import { createGate1FValidationScenario } from "../state/gate1fValidationFixture";
import { FACTION_DYNAMICS_CONFIG } from "../systems/factionPressure";
import type { ScenarioDefinition } from "../state/scenario";

export const F04A_DEFAULT_HORIZON_YEARS = 10 as const;

const F04A_TRACKED_BRANCHES = [
  F03_BRANCH_IDS.short,
  F03_BRANCH_IDS.long,
  F03_BRANCH_IDS.prerequisite,
] as const satisfies readonly F03BranchId[];

export interface F04AFactionPathSummary {
  readonly startingStateId: string;
  readonly branchId: F03BranchId;
  readonly interventionId: string;
  readonly accepted: boolean;
  readonly completionTick: number | null;
  readonly startOrganization: number;
  readonly oneYearOrganization: number;
  readonly finalOrganization: number;
  readonly startGrievance: number;
  readonly oneYearGrievance: number;
  readonly finalGrievance: number;
  readonly organizationRecoveredByHorizon: boolean;
  readonly grievanceRecoveredByHorizon: boolean;
  readonly persistentStateDifference: boolean;
  readonly politicalHistoryDivergence: boolean;
}

export interface F04ADiagnosisResult {
  readonly scenarioId: string;
  readonly scenarioVersion: number;
  readonly seed: number;
  readonly horizonYears: number;
  readonly f03: F03SurveyResult;
  readonly factionPaths: readonly F04AFactionPathSummary[];
  readonly oneWayRatchetPaths: readonly string[];
  readonly deterministicSignature: string;
}

export interface F04AInspectionReport {
  readonly result: F04ADiagnosisResult;
  readonly allPassed: boolean;
  readonly output: string;
}

interface CompletionTickMap {
  [key: string]: number | undefined;
}

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}

function branchKey(startingStateId: string, branchId: F03BranchId): string {
  return `${startingStateId}/${branchId}`;
}

function checkpointOrFinal(
  branch: F03BranchResult,
  relativeTick: number,
): F03BranchResult["final"] {
  return (
    branch.checkpoints.find(
      (checkpoint) => checkpoint.relativeTick === relativeTick,
    ) ?? branch.final
  );
}

function trackedBranches(
  state: F03StartingStateResult,
): readonly F03BranchResult[] {
  return F04A_TRACKED_BRANCHES.map((branchId) => {
    const branch = state.branches.find(
      (candidate) => candidate.branchId === branchId,
    );
    if (branch === undefined) {
      throw new Error(`${state.id} is missing F04A branch ${branchId}.`);
    }
    return branch;
  });
}

function createFactionPathSummaries(
  survey: F03SurveyResult,
  completionTicks: CompletionTickMap,
): readonly F04AFactionPathSummary[] {
  return survey.startingStates.flatMap((state) =>
    trackedBranches(state).map((branch) => {
      const oneYear = checkpointOrFinal(branch, F03_DAYS_PER_YEAR);
      const completionTick =
        completionTicks[branchKey(state.id, branch.branchId)];
      return {
        startingStateId: state.id,
        branchId: branch.branchId,
        interventionId: branch.interventionId ?? "",
        accepted: branch.accepted,
        completionTick: completionTick ?? null,
        startOrganization: branch.immediate.factionOrganization,
        oneYearOrganization: oneYear.factionOrganization,
        finalOrganization: branch.final.factionOrganization,
        startGrievance: branch.immediate.factionGrievance,
        oneYearGrievance: oneYear.factionGrievance,
        finalGrievance: branch.final.factionGrievance,
        organizationRecoveredByHorizon:
          branch.final.factionOrganization >=
          branch.immediate.factionOrganization,
        grievanceRecoveredByHorizon:
          branch.final.factionGrievance >= branch.immediate.factionGrievance,
        persistentStateDifference:
          survey.comparisons.find(
            (comparison) =>
              comparison.startingStateId === state.id &&
              comparison.interventionBranchId === branch.branchId,
          )?.horizonStateDivergence ?? false,
        politicalHistoryDivergence:
          survey.comparisons.find(
            (comparison) =>
              comparison.startingStateId === state.id &&
              comparison.interventionBranchId === branch.branchId,
          )?.politicalHistoryDivergence ?? false,
      };
    }),
  );
}

function deterministicSignature(
  result: Omit<F04ADiagnosisResult, "deterministicSignature" | "f03"> & {
    readonly factionPaths: readonly F04AFactionPathSummary[];
  },
): string {
  return JSON.stringify({
    scenarioId: result.scenarioId,
    scenarioVersion: result.scenarioVersion,
    seed: result.seed,
    horizonYears: result.horizonYears,
    factionPaths: result.factionPaths
      .slice()
      .sort(
        (first, second) =>
          compareStableText(first.startingStateId, second.startingStateId) ||
          compareStableText(first.branchId, second.branchId),
      )
      .map((path) => ({
        state: path.startingStateId,
        branch: path.branchId,
        accepted: path.accepted,
        completionTick: path.completionTick,
        startOrganization: path.startOrganization,
        oneYearOrganization: path.oneYearOrganization,
        finalOrganization: path.finalOrganization,
        startGrievance: path.startGrievance,
        oneYearGrievance: path.oneYearGrievance,
        finalGrievance: path.finalGrievance,
        organizationRecoveredByHorizon: path.organizationRecoveredByHorizon,
        grievanceRecoveredByHorizon: path.grievanceRecoveredByHorizon,
        persistentStateDifference: path.persistentStateDifference,
        politicalHistoryDivergence: path.politicalHistoryDivergence,
      })),
  });
}

export function runF04ADiagnosis(
  scenario: ScenarioDefinition = createGate1FValidationScenario(),
  seed: number = F03_DEFAULT_SEED,
  horizonYears: number = F04A_DEFAULT_HORIZON_YEARS,
): F04ADiagnosisResult {
  const completionTicks: CompletionTickMap = {};
  const survey = runF03Survey(scenario, seed, horizonYears, {
    onBranchObservation: (observation) => {
      if (
        !F04A_TRACKED_BRANCHES.includes(
          observation.branchId as (typeof F04A_TRACKED_BRANCHES)[number],
        )
      ) {
        return;
      }

      if (
        observation.events.some(
          (event) => event.type === "INTERVENTION_COMPLETED",
        )
      ) {
        const key = branchKey(
          observation.startingStateId,
          observation.branchId as F03BranchId,
        );
        if (completionTicks[key] === undefined) {
          completionTicks[key] = observation.relativeTick;
        }
      }
    },
  });
  const factionPaths = createFactionPathSummaries(survey, completionTicks);
  const oneWayRatchetPaths = factionPaths
    .filter(
      (path) =>
        path.accepted &&
        (path.branchId === F03_BRANCH_IDS.long ||
          path.branchId === F03_BRANCH_IDS.prerequisite) &&
        !path.organizationRecoveredByHorizon &&
        !path.grievanceRecoveredByHorizon,
    )
    .map((path) => branchKey(path.startingStateId, path.branchId));
  const withoutSignature = {
    scenarioId: survey.scenarioId,
    scenarioVersion: survey.scenarioVersion,
    seed,
    horizonYears,
    factionPaths,
    oneWayRatchetPaths,
  };

  return {
    ...withoutSignature,
    f03: survey,
    deterministicSignature: deterministicSignature(withoutSignature),
  };
}

function pathFor(
  result: F04ADiagnosisResult,
  stateId: string,
  branchId: F03BranchId,
): F04AFactionPathSummary {
  const path = result.factionPaths.find(
    (candidate) =>
      candidate.startingStateId === stateId && candidate.branchId === branchId,
  );
  if (path === undefined) {
    throw new Error(`F04A path ${stateId}/${branchId} is missing.`);
  }
  return path;
}

export function formatF04AInspection(result: F04ADiagnosisResult): string {
  const stateA = result.f03.startingStates.find(
    (state) => state.id === "STATE_A",
  );
  if (stateA === undefined) {
    throw new Error("F04A survey is missing STATE_A.");
  }

  const lines = [
    "F04A Endogenous Faction Dynamics / One-Way Ratchet Repair",
    "",
    `Scenario: ${result.scenarioId} v${result.scenarioVersion}`,
    `Seed: ${result.seed}`,
    `Horizon: ${result.horizonYears} years / ${result.horizonYears * F03_DAYS_PER_YEAR} ticks per branch`,
    "",
    "Writer audit:",
    "- grievance before: initialization + F03A completion decrease; endogenous upward writer NONE",
    "- grievance after: T016 monthly phase bounded writer; downward movement follows the same current drivers",
    "- organization before: initialization + F03A completion decrease; endogenous upward writer NONE",
    "- organization after: T016 monthly phase bounded writer; weak base decays/stalls and strong base rebuilds",
    "- monthly state events: NONE (diagnostic projection is pure; no delta event spam)",
    "",
    "Dynamics:",
    `- cadence: existing T016 political boundary (${"monthly"})`,
    `- grievance step: ${formatNumber(FACTION_DYNAMICS_CONFIG.grievanceStep)} toward max(current scarcity, unrest, weak state control, national weakness)`,
    `- organization step: ${formatNumber(FACTION_DYNAMICS_CONFIG.organizationStep)} toward resource-capped influence/local activation`,
    "- currentStrategy/support are not drivers; intervention IDs are not read",
    "- authoritative writer: immutable Faction replacement in factionPressure phase",
    "",
    "State A counterfactual path:",
    "| branch | accepted | completion | organization start/1y/final | grievance start/1y/final | recovered | political history |",
    "| --- | --- | ---: | --- | --- | --- | --- |",
    ...F04A_TRACKED_BRANCHES.map((branchId) => {
      const path = pathFor(result, "STATE_A", branchId);
      return `| ${path.branchId} | ${path.accepted ? "YES" : "NO"} | ${path.completionTick ?? "—"} | ${formatNumber(path.startOrganization)} / ${formatNumber(path.oneYearOrganization)} / ${formatNumber(path.finalOrganization)} | ${formatNumber(path.startGrievance)} / ${formatNumber(path.oneYearGrievance)} / ${formatNumber(path.finalGrievance)} | ${path.organizationRecoveredByHorizon || path.grievanceRecoveredByHorizon ? "YES" : "NO"} | ${path.politicalHistoryDivergence ? "YES" : "NO"} |`;
    }),
    "",
    "Integration:",
    "- T016: current Faction values continue to feed observations/proposals",
    "- T017: Region scarcity/unrest/stateControl remain existing pressure inputs",
    "- T018: current grievance/organization are read without new gates or thresholds",
    "- T021: existing organization is read by operational-strength derivation when applicable",
    "- T022/T023: no direct consolidation or dissolution writer added",
    "",
    "F03/F04 diagnosis:",
    `- accepted tracked paths: ${result.factionPaths.filter((path) => path.accepted).length}/${result.factionPaths.length}`,
    `- horizon state differences retained where current downstream state differs: ${result.factionPaths.filter((path) => path.persistentStateDifference).length}`,
    `- political history divergences: ${result.factionPaths.filter((path) => path.politicalHistoryDivergence).length}`,
    `- one-way ratchet paths remaining: ${result.oneWayRatchetPaths.join(", ") || "NONE"}`,
    "- active-conflict futility / zero-territory recovery remain outside F04A scope",
    "",
    "F02 WAIT:",
    "- no-intervention branch remains available in the reused F03 harness; full multi-seed rerun is reported separately by inspect:f02",
    "",
    "Production changes: gameplay/balance/thresholds/duration/cadence/RNG NONE",
    "F04B: COMPLETE / Terra targeted review pending",
    "F05: NOT STARTED",
    "V02: NOT STARTED",
  ];

  return lines.join("\n");
}

export function runF04AInspection(): F04AInspectionReport {
  const result = runF04ADiagnosis();
  const accepted = result.factionPaths.filter((path) => path.accepted);
  const allPassed =
    result.f03.usedScenarioSuitability.suitableForCounterfactuals &&
    accepted.length === result.factionPaths.length &&
    result.oneWayRatchetPaths.length === 0;
  return {
    result,
    allPassed,
    output: formatF04AInspection(result),
  };
}

export function printF04AInspection(): void {
  const report = runF04AInspection();
  console.log(report.output);
}
