import { runF05Fix9LateSteadyStateAudit } from "./f05Fix9LateSteadyStateAudit";
import { detectFactionPressureAgendas } from "../readModels/agenda";
import { acceptActionProposals, type ActionProposal } from "../state/action";
import {
  deriveActiveFactionFundMovementCommitments,
  deriveFactionAvailableResources,
} from "../state/factionFundMovement";
import { createF05Fix13TargetedCommitmentScenario } from "../state/f05Fix13Fixture";
import { createInitialWorldState, type WorldState } from "../state/world";
import { runSimulationStep } from "../core/tick";
import type { ScenarioDefinition } from "../state/scenario";
import { asFactionId } from "../state/ids";

export const F05_FIX13_DEFAULT_SEED = 51313 as const;
export const F05_FIX13_HORIZON_DAYS = 1200 as const;

export type F05Fix13PrimaryClassification =
  | "TARGETED_COMMITMENT_VERTICAL_SLICE_MEANINGFUL"
  | "TARGETED_COMMITMENT_KERNEL_IMPLEMENTED_BUT_LATE_REASSESSMENT_UNCHANGED"
  | "TARGETED_COMMITMENT_KERNEL_BLOCKED";

export type F05Fix13Readiness =
  "COMMITMENT_CONSEQUENCE_OR_LIFECYCLE_REVIEW" | "NONE";

export interface F05Fix13LongHorizonReport {
  readonly scenarioId: string;
  readonly seed: number;
  readonly horizonDays: number;
  readonly executedDays: number;
  readonly terminal: boolean;
  readonly profileEnabledCommitmentCount: number;
  readonly firstCommitmentTick: number | null;
  readonly commitmentsPerFaction: Readonly<Record<string, number>>;
  readonly duplicateCommitmentSuccessEventCount: number;
  readonly chooserFundMovementAfterActiveCount: number;
  readonly availableResourceProjections: readonly number[];
  readonly agendaExposureCount: number;
  readonly resourceDebitObserved: boolean;
  readonly forbiddenEffectEventTypes: readonly string[];
  readonly activeBeforeHistoricalLateReference: boolean;
  readonly historicalReference: {
    readonly checkedTicks: readonly [1110, 1200];
    readonly branchesWithTick1110: number;
    readonly branchesWithTick1200: number;
    readonly lateSilencePopulation: number;
    readonly historicalBaseline: "UNCHANGED" | "CHANGED";
  };
  readonly lateReassessmentChanged: false;
  readonly primaryClassification: F05Fix13PrimaryClassification;
  readonly readiness: F05Fix13Readiness;
  readonly gate1f: "NOT_READY";
  readonly v02: "NOT_STARTED";
}

function sortedCommitments(world: WorldState) {
  return Object.values(world.factionFundMovementCommitments).sort(
    (first, second) =>
      first.id < second.id ? -1 : first.id > second.id ? 1 : 0,
  );
}

function runProfileEnabledHorizon(
  scenario: ScenarioDefinition,
  seed: number,
  horizonDays: number,
): {
  readonly world: WorldState;
  readonly executedDays: number;
  readonly firstCommitmentTick: number | null;
  readonly chooserFundMovementAfterActiveCount: number;
  readonly commitmentSuccessEventCount: number;
  readonly agendaExposureCount: number;
  readonly resourceDebitObserved: boolean;
  readonly forbiddenEffectEventTypes: readonly string[];
  readonly availableResourceProjections: readonly number[];
} {
  let world = createInitialWorldState(scenario, seed);
  let pendingProposals: readonly ActionProposal[] = [];
  let firstCommitmentTick: number | null = null;
  let chooserFundMovementAfterActiveCount = 0;
  let commitmentSuccessEventCount = 0;
  let agendaExposureCount = 0;
  let resourceDebitObserved = false;
  const forbiddenEffectEventTypes = new Set<string>();
  const fundMovementSourceActionIds = new Set<string>();
  const commitmentEventIds = new Set<string>();
  const availableResourceProjections: number[] = [];
  let executedDays = 0;

  for (let day = 0; day < horizonDays; day += 1) {
    const actions = acceptActionProposals(
      pendingProposals,
      world.run.nextActionSequence,
    );
    const previousWorld = world;
    const result = runSimulationStep(world, { actions }, {}, scenario);
    world = result.nextWorld;
    executedDays += 1;

    const newCommitmentEvents = result.emittedEvents.filter(
      (event) => event.type === "FACTION_FUND_MOVEMENT_COMMITTED",
    );
    if (newCommitmentEvents.length > 0 && firstCommitmentTick === null) {
      firstCommitmentTick = newCommitmentEvents[0]!.tick;
    }
    commitmentSuccessEventCount += newCommitmentEvents.length;
    for (const event of newCommitmentEvents) {
      commitmentEventIds.add(event.id);
      if (
        typeof event.payload === "object" &&
        event.payload !== null &&
        !Array.isArray(event.payload) &&
        typeof (event.payload as Readonly<Record<string, unknown>>).actionId ===
          "string"
      ) {
        fundMovementSourceActionIds.add(
          (event.payload as Readonly<Record<string, unknown>>)
            .actionId as string,
        );
      }
    }

    for (const action of actions) {
      if (action.actionType !== "FUND_MOVEMENT" || action.schemaVersion !== 2) {
        continue;
      }
      const payload =
        typeof action.payload === "object" &&
        action.payload !== null &&
        !Array.isArray(action.payload) &&
        typeof (action.payload as Readonly<Record<string, unknown>>)
          .factionId === "string"
          ? (action.payload as Readonly<Record<string, unknown>>)
          : null;
      const factionId =
        payload === null || typeof payload.factionId !== "string"
          ? null
          : payload.factionId;
      if (factionId === null) continue;
      const before = previousWorld.factions[asFactionId(factionId)];
      const after = world.factions[asFactionId(factionId)];
      if (
        before !== undefined &&
        after !== undefined &&
        after.resources < before.resources
      ) {
        resourceDebitObserved = true;
      }
    }

    for (const event of result.emittedEvents) {
      const directlyCausedByFundMovement =
        event.causeIds.some((causeId) => commitmentEventIds.has(causeId)) ||
        (typeof event.payload === "object" &&
          event.payload !== null &&
          !Array.isArray(event.payload) &&
          typeof (event.payload as Readonly<Record<string, unknown>>)
            .actionId === "string" &&
          fundMovementSourceActionIds.has(
            (event.payload as Readonly<Record<string, unknown>>)
              .actionId as string,
          ));
      if (!directlyCausedByFundMovement) continue;
      if (
        event.type === "ORGANIZATION_INCREASED" ||
        event.type === "STRIKE_STARTED" ||
        event.type === "REBELLION_STARTED" ||
        event.type === "COUP_ATTEMPT_STARTED" ||
        event.type === "CONFLICT_RESOLVED" ||
        event.type === "STATE_DISSOLVED"
      ) {
        forbiddenEffectEventTypes.add(event.type);
      }
    }

    for (const faction of Object.values(world.factions)) {
      const active = deriveActiveFactionFundMovementCommitments(
        world,
        faction.id,
      );
      if (active.length > 0) {
        availableResourceProjections.push(
          deriveFactionAvailableResources(world, faction.id),
        );
      }
    }

    if (firstCommitmentTick !== null && result.actionProposals.length > 0) {
      chooserFundMovementAfterActiveCount += result.actionProposals.filter(
        (proposal) => proposal.actionType === "FUND_MOVEMENT",
      ).length;
    }

    if (sortedCommitments(world).length > 0) {
      const agendas = detectFactionPressureAgendas({
        scenario,
        world,
        recentEvents: result.emittedEvents,
      });
      if (
        agendas.some((agenda) =>
          agenda.keyCauses.some((cause) =>
            cause.key.startsWith("factionFundMovementCommitment:"),
          ),
        )
      ) {
        agendaExposureCount += 1;
      }
    }

    pendingProposals = result.actionProposals;
    if (world.run.outcome.status !== "active") break;
  }

  return {
    world,
    executedDays,
    firstCommitmentTick,
    chooserFundMovementAfterActiveCount,
    commitmentSuccessEventCount,
    agendaExposureCount,
    resourceDebitObserved,
    forbiddenEffectEventTypes: [...forbiddenEffectEventTypes].sort(),
    availableResourceProjections,
  };
}

export function runF05Fix13TargetedCommitmentInspection(
  seed = F05_FIX13_DEFAULT_SEED,
  horizonDays = F05_FIX13_HORIZON_DAYS,
): F05Fix13LongHorizonReport {
  const scenario = createF05Fix13TargetedCommitmentScenario();
  const profileRun = runProfileEnabledHorizon(scenario, seed, horizonDays);
  const historical = runF05Fix9LateSteadyStateAudit();
  const commitments = sortedCommitments(profileRun.world);
  const commitmentsPerFaction = Object.fromEntries(
    Object.values(profileRun.world.factions)
      .sort((first, second) => (first.id < second.id ? -1 : 1))
      .map((faction) => [
        faction.id,
        commitments.filter((commitment) => commitment.factionId === faction.id)
          .length,
      ]),
  );
  const branchesWithTick1110 = historical.branches.filter((branch) =>
    branch.trace.snapshots.has(1110),
  ).length;
  const branchesWithTick1200 = historical.branches.filter((branch) =>
    branch.trace.snapshots.has(1200),
  ).length;
  const activeBeforeHistoricalLateReference =
    profileRun.firstCommitmentTick !== null &&
    profileRun.firstCommitmentTick < 1110;
  const blocked =
    commitments.length === 0 ||
    profileRun.resourceDebitObserved ||
    profileRun.forbiddenEffectEventTypes.length > 0 ||
    profileRun.availableResourceProjections.some((value) => value < 0) ||
    historical.historicalF05Regression !== "UNCHANGED";

  return {
    scenarioId: String(scenario.id),
    seed,
    horizonDays,
    executedDays: profileRun.executedDays,
    terminal: profileRun.world.run.outcome.status !== "active",
    profileEnabledCommitmentCount: commitments.length,
    firstCommitmentTick: profileRun.firstCommitmentTick,
    commitmentsPerFaction,
    duplicateCommitmentSuccessEventCount: Math.max(
      0,
      profileRun.commitmentSuccessEventCount - commitments.length,
    ),
    chooserFundMovementAfterActiveCount:
      profileRun.chooserFundMovementAfterActiveCount,
    availableResourceProjections: profileRun.availableResourceProjections,
    agendaExposureCount: profileRun.agendaExposureCount,
    resourceDebitObserved: profileRun.resourceDebitObserved,
    forbiddenEffectEventTypes: profileRun.forbiddenEffectEventTypes,
    activeBeforeHistoricalLateReference,
    historicalReference: {
      checkedTicks: [1110, 1200],
      branchesWithTick1110,
      branchesWithTick1200,
      lateSilencePopulation: historical.exactLateSilencePopulation,
      historicalBaseline: historical.historicalF05Regression,
    },
    lateReassessmentChanged: false,
    primaryClassification: blocked
      ? "TARGETED_COMMITMENT_KERNEL_BLOCKED"
      : "TARGETED_COMMITMENT_KERNEL_IMPLEMENTED_BUT_LATE_REASSESSMENT_UNCHANGED",
    readiness: blocked ? "NONE" : "COMMITMENT_CONSEQUENCE_OR_LIFECYCLE_REVIEW",
    gate1f: "NOT_READY",
    v02: "NOT_STARTED",
  };
}

export function formatF05Fix13TargetedCommitmentInspection(
  report: F05Fix13LongHorizonReport,
): string {
  return [
    "F05_FIX13 TARGETED FUND_MOVEMENT COMMITMENT VERTICAL SLICE",
    `scenario=${report.scenarioId} seed=${report.seed} horizon=${report.horizonDays}d executed=${report.executedDays}d terminal=${report.terminal}`,
    `commitments=${report.profileEnabledCommitmentCount} firstCommitmentTick=${report.firstCommitmentTick ?? "none"} perFaction=${JSON.stringify(report.commitmentsPerFaction)}`,
    `availableResourceProjectionMin=${Math.min(...report.availableResourceProjections, 0)} resourceDebitObserved=${report.resourceDebitObserved}`,
    `duplicateCommitmentSuccessEvents=${report.duplicateCommitmentSuccessEventCount} chooserFundMovementAfterActive=${report.chooserFundMovementAfterActiveCount} agendaExposureTicks=${report.agendaExposureCount}`,
    `forbiddenEffectEvents=${report.forbiddenEffectEventTypes.join(",") || "none"}`,
    `historicalReferenceTicks=1110/1200 branches=${report.historicalReference.branchesWithTick1110}/${report.historicalReference.branchesWithTick1200} lateSilencePopulation=${report.historicalReference.lateSilencePopulation} baseline=${report.historicalReference.historicalBaseline}`,
    `activeBeforeHistoricalLateReference=${report.activeBeforeHistoricalLateReference} lateReassessmentChanged=${report.lateReassessmentChanged}`,
    `PRIMARY_CLASSIFICATION=${report.primaryClassification}`,
    `READINESS=${report.readiness} GATE1F=${report.gate1f} V02=${report.v02}`,
  ].join("\n");
}

export function printF05Fix13TargetedCommitmentInspection(): void {
  console.log(
    formatF05Fix13TargetedCommitmentInspection(
      runF05Fix13TargetedCommitmentInspection(),
    ),
  );
}
