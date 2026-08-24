import { runF05Fix13TargetedCommitmentInspection } from "./f05Fix13TargetedCommitmentVerticalSlice";
import { detectFactionPressureAgendas } from "../readModels/agenda";
import {
  acceptActionProposals,
  createStartInterventionActionProposal,
  type ActionProposal,
} from "../state/action";
import { createF05Fix13TargetedCommitmentScenario } from "../state/f05Fix13Fixture";
import {
  deriveActiveFactionFundMovementCommitments,
  deriveFactionAvailableResources,
} from "../state/factionFundMovement";
import { F04D_VALIDATION_INTERVENTION_IDS } from "../state/gate1fValidationFixture";
import type { FactionId } from "../state/ids";
import type { ScenarioDefinition } from "../state/scenario";
import { createInitialWorldState, type WorldState } from "../state/world";
import { runSimulationStep } from "../core/tick";
import { createInterventionPhaseHooks } from "../systems/interventionHooks";

export const F05_FIX14_DEFAULT_SEED = 51414 as const;
export const F05_FIX14_HORIZON_DAYS = 1200 as const;

export type F05Fix14PrimaryClassification =
  | "FUND_MOVEMENT_LIFECYCLE_IMPLEMENTED_REASSESSMENT_IMPROVED"
  | "FUND_MOVEMENT_LIFECYCLE_IMPLEMENTED_LATE_SILENCE_PERSISTS"
  | "FUND_MOVEMENT_ROUTE_EXHAUSTED_NO_HONEST_LIFECYCLE";

export type F05Fix14Readiness =
  "PROFILE_ENABLED_F05_REMEASUREMENT" | "PIVOT_FROM_FUND_MOVEMENT";

interface ResolutionObservation {
  readonly commitmentId: string;
  readonly factionId: string;
  readonly createdAtTick: number;
  readonly resolvedAtTick: number;
  readonly resolutionReason: "actorIntentCeased";
  readonly observedActiveDuration: number;
  readonly availableResourcesBefore: number;
  readonly availableResourcesAfter: number;
  readonly agendaEvidenceBefore: boolean;
  readonly agendaEvidenceAfter: boolean;
}

export interface F05Fix14ProfilePathReport {
  readonly executedDays: number;
  readonly terminal: boolean;
  readonly playerResponseSubmittedTick: number | null;
  readonly commitmentCreationTicks: readonly number[];
  readonly resolutionObservations: readonly ResolutionObservation[];
  readonly activeCommitmentsAtEnd: number;
  readonly totalCommitmentsAtEnd: number;
  readonly laterRecommitmentCount: number;
  readonly duplicateOrChurnCount: number;
  readonly resourceDebitObserved: boolean;
  readonly forbiddenWriterEventTypes: readonly string[];
}

export interface F05Fix14LifecycleClosureReport {
  readonly scenarioId: string;
  readonly seed: number;
  readonly horizonDays: number;
  readonly lifecycleGrounded: boolean;
  readonly chooserThresholdsChanged: false;
  readonly chooserPriorityChanged: false;
  readonly currentStrategyUsedForLifecycle: false;
  readonly timerCooldownCountdownUsed: false;
  readonly noResponse: F05Fix14ProfilePathReport;
  readonly existingResponse: F05Fix14ProfilePathReport;
  readonly noResponseLateSilenceChanged: boolean;
  readonly responseCreatedStateGroundedDifference: boolean;
  readonly historicalF05Baseline: "UNCHANGED" | "CHANGED";
  readonly historicalF05Fix9References: {
    readonly checkedTicks: readonly [1110, 1200];
    readonly branchesAt1110: number;
    readonly branchesAt1200: number;
    readonly lateSilencePopulation: number;
  };
  readonly historicalF05Fix13Baseline: "UNCHANGED" | "CHANGED";
  readonly primaryClassification: F05Fix14PrimaryClassification;
  readonly nextImplementationReadiness: F05Fix14Readiness;
  readonly gate1f: "NOT_READY";
  readonly v02: "NOT_STARTED";
  readonly f05Fix15: "NOT_AUTHORIZED";
}

function eventPayload(event: {
  readonly payload: unknown;
}): Readonly<Record<string, unknown>> | null {
  return typeof event.payload === "object" &&
    event.payload !== null &&
    !Array.isArray(event.payload)
    ? (event.payload as Readonly<Record<string, unknown>>)
    : null;
}

function hasActiveAgendaEvidence(
  scenario: ScenarioDefinition,
  world: WorldState,
  factionId: FactionId,
): boolean {
  return (
    detectFactionPressureAgendas({ scenario, world, recentEvents: [] })
      .find((agenda) => agenda.involvedFactionIds[0] === factionId)
      ?.keyCauses.some((cause) =>
        cause.key.startsWith("factionFundMovementCommitment:"),
      ) ?? false
  );
}

export function runF05Fix14ProfilePath(
  scenario: ScenarioDefinition,
  seed: number,
  horizonDays: number,
  useExistingResponse: boolean,
): F05Fix14ProfilePathReport {
  let world = createInitialWorldState(scenario, seed);
  let pendingProposals: readonly ActionProposal[] = [];
  let playerResponseSubmittedTick: number | null = null;
  const commitmentCreationTicks: number[] = [];
  const resolutionObservations: ResolutionObservation[] = [];
  const resolvedFactions = new Set<string>();
  const forbiddenWriterEventTypes = new Set<string>();
  let laterRecommitmentCount = 0;
  let duplicateOrChurnCount = 0;
  let resourceDebitObserved = false;
  let executedDays = 0;

  for (let day = 0; day < horizonDays; day += 1) {
    const nextTick = world.tick + 1;
    const submittedProposals: ActionProposal[] = [];
    if (
      useExistingResponse &&
      playerResponseSubmittedTick === null &&
      commitmentCreationTicks.length > 0
    ) {
      submittedProposals.push(
        createStartInterventionActionProposal(
          nextTick,
          "player",
          F04D_VALIDATION_INTERVENTION_IDS.politicalAccommodation,
          scenario.playerCountryId ?? undefined,
        ),
      );
      playerResponseSubmittedTick = nextTick;
    }
    submittedProposals.push(...pendingProposals);

    const actions = acceptActionProposals(
      submittedProposals,
      world.run.nextActionSequence,
    );
    const previousWorld = world;
    const activeBefore =
      deriveActiveFactionFundMovementCommitments(previousWorld);
    const result = runSimulationStep(
      previousWorld,
      { actions },
      createInterventionPhaseHooks(scenario),
      scenario,
    );
    world = result.nextWorld;
    executedDays += 1;

    const creationEvents = result.emittedEvents.filter(
      (event) => event.type === "FACTION_FUND_MOVEMENT_COMMITTED",
    );
    for (const event of creationEvents) {
      commitmentCreationTicks.push(event.tick);
      if (event.actorId !== undefined && resolvedFactions.has(event.actorId)) {
        laterRecommitmentCount += 1;
      }
      const payload = eventPayload(event);
      const targetRegionId = payload?.targetRegionId;
      if (
        event.actorId !== undefined &&
        typeof targetRegionId === "string" &&
        activeBefore.some(
          (commitment) =>
            commitment.factionId === event.actorId &&
            commitment.targetRegionId === targetRegionId,
        )
      ) {
        duplicateOrChurnCount += 1;
      }
    }

    const resolutionEvents = result.emittedEvents.filter(
      (event) => event.type === "FACTION_FUND_MOVEMENT_RESOLVED",
    );
    for (const event of resolutionEvents) {
      const payload = eventPayload(event);
      const commitmentId = payload?.commitmentId;
      const factionId = payload?.factionId;
      if (typeof commitmentId !== "string" || typeof factionId !== "string") {
        duplicateOrChurnCount += 1;
        continue;
      }
      const typedFactionId = factionId as FactionId;
      const before = activeBefore.find(
        (commitment) => commitment.id === commitmentId,
      );
      const after = Object.values(world.factionFundMovementCommitments).find(
        (commitment) => commitment.id === commitmentId,
      );
      if (before === undefined || after?.status !== "resolved") {
        duplicateOrChurnCount += 1;
        continue;
      }
      resolvedFactions.add(factionId);
      resolutionObservations.push({
        commitmentId,
        factionId,
        createdAtTick: before.createdAtTick,
        resolvedAtTick: after.resolvedAtTick,
        resolutionReason: after.resolutionReason,
        observedActiveDuration: after.resolvedAtTick - before.createdAtTick,
        availableResourcesBefore: deriveFactionAvailableResources(
          previousWorld,
          typedFactionId,
        ),
        availableResourcesAfter: deriveFactionAvailableResources(
          world,
          typedFactionId,
        ),
        agendaEvidenceBefore: hasActiveAgendaEvidence(
          scenario,
          previousWorld,
          typedFactionId,
        ),
        agendaEvidenceAfter: hasActiveAgendaEvidence(
          scenario,
          world,
          typedFactionId,
        ),
      });
    }

    for (const faction of Object.values(previousWorld.factions)) {
      const nextFaction = world.factions[faction.id];
      const commitmentTransition = result.emittedEvents.some(
        (event) =>
          (event.type === "FACTION_FUND_MOVEMENT_COMMITTED" ||
            event.type === "FACTION_FUND_MOVEMENT_RESOLVED") &&
          event.actorId === faction.id,
      );
      if (
        commitmentTransition &&
        nextFaction !== undefined &&
        nextFaction.resources !== faction.resources
      ) {
        resourceDebitObserved = true;
      }
    }

    for (const event of result.emittedEvents) {
      const payload = eventPayload(event);
      if (
        typeof payload?.commitmentId !== "string" ||
        (event.type !== "ORGANIZATION_INCREASED" &&
          event.type !== "STRIKE_STARTED" &&
          event.type !== "REBELLION_STARTED" &&
          event.type !== "COUP_ATTEMPT_STARTED" &&
          event.type !== "CONFLICT_RESOLVED" &&
          event.type !== "LAND_HEX_CONTROL_CHANGED" &&
          event.type !== "STATE_DISSOLVED")
      ) {
        continue;
      }
      forbiddenWriterEventTypes.add(event.type);
    }

    pendingProposals = result.actionProposals;
    if (world.run.outcome.status !== "active") {
      break;
    }
  }

  return {
    executedDays,
    terminal: world.run.outcome.status !== "active",
    playerResponseSubmittedTick,
    commitmentCreationTicks,
    resolutionObservations,
    activeCommitmentsAtEnd:
      deriveActiveFactionFundMovementCommitments(world).length,
    totalCommitmentsAtEnd: Object.keys(world.factionFundMovementCommitments)
      .length,
    laterRecommitmentCount,
    duplicateOrChurnCount,
    resourceDebitObserved,
    forbiddenWriterEventTypes: [...forbiddenWriterEventTypes].sort(),
  };
}

export function runF05Fix14FundMovementLifecycleInspection(
  seed = F05_FIX14_DEFAULT_SEED,
  horizonDays = F05_FIX14_HORIZON_DAYS,
): F05Fix14LifecycleClosureReport {
  const scenario = createF05Fix13TargetedCommitmentScenario();
  const noResponse = runF05Fix14ProfilePath(scenario, seed, horizonDays, false);
  const existingResponse = runF05Fix14ProfilePath(
    scenario,
    seed,
    horizonDays,
    true,
  );
  const historical = runF05Fix13TargetedCommitmentInspection(51313, 1200);
  const historicalF05Fix13Baseline =
    historical.profileEnabledCommitmentCount === 2 &&
    historical.firstCommitmentTick === 31 &&
    historical.duplicateCommitmentSuccessEventCount === 0 &&
    historical.chooserFundMovementAfterActiveCount === 0 &&
    historical.resourceDebitObserved === false &&
    historical.forbiddenEffectEventTypes.length === 0 &&
    historical.lateReassessmentChanged === false
      ? "UNCHANGED"
      : "CHANGED";
  const noResponseLateSilenceChanged =
    noResponse.resolutionObservations.length > 0 ||
    noResponse.activeCommitmentsAtEnd < 2;
  const responseCreatedStateGroundedDifference =
    existingResponse.resolutionObservations.some(
      (resolution) =>
        resolution.resolutionReason === "actorIntentCeased" &&
        resolution.availableResourcesAfter >
          resolution.availableResourcesBefore &&
        resolution.agendaEvidenceBefore &&
        !resolution.agendaEvidenceAfter,
    );
  const lifecycleGrounded =
    noResponse.resolutionObservations.length === 0 &&
    responseCreatedStateGroundedDifference &&
    existingResponse.duplicateOrChurnCount === 0 &&
    !noResponse.resourceDebitObserved &&
    !existingResponse.resourceDebitObserved &&
    noResponse.forbiddenWriterEventTypes.length === 0 &&
    existingResponse.forbiddenWriterEventTypes.length === 0;
  const primaryClassification: F05Fix14PrimaryClassification =
    !lifecycleGrounded
      ? "FUND_MOVEMENT_ROUTE_EXHAUSTED_NO_HONEST_LIFECYCLE"
      : noResponseLateSilenceChanged
        ? "FUND_MOVEMENT_LIFECYCLE_IMPLEMENTED_REASSESSMENT_IMPROVED"
        : "FUND_MOVEMENT_LIFECYCLE_IMPLEMENTED_LATE_SILENCE_PERSISTS";

  return {
    scenarioId: String(scenario.id),
    seed,
    horizonDays,
    lifecycleGrounded,
    chooserThresholdsChanged: false,
    chooserPriorityChanged: false,
    currentStrategyUsedForLifecycle: false,
    timerCooldownCountdownUsed: false,
    noResponse,
    existingResponse,
    noResponseLateSilenceChanged,
    responseCreatedStateGroundedDifference,
    historicalF05Baseline: historical.historicalReference.historicalBaseline,
    historicalF05Fix9References: {
      checkedTicks: [1110, 1200],
      branchesAt1110: historical.historicalReference.branchesWithTick1110,
      branchesAt1200: historical.historicalReference.branchesWithTick1200,
      lateSilencePopulation:
        historical.historicalReference.lateSilencePopulation,
    },
    historicalF05Fix13Baseline,
    primaryClassification,
    nextImplementationReadiness:
      primaryClassification ===
      "FUND_MOVEMENT_LIFECYCLE_IMPLEMENTED_REASSESSMENT_IMPROVED"
        ? "PROFILE_ENABLED_F05_REMEASUREMENT"
        : "PIVOT_FROM_FUND_MOVEMENT",
    gate1f: "NOT_READY",
    v02: "NOT_STARTED",
    f05Fix15: "NOT_AUTHORIZED",
  };
}

function formatPath(label: string, path: F05Fix14ProfilePathReport): string {
  const firstResolution = path.resolutionObservations[0];
  return [
    `${label} executed=${path.executedDays}d terminal=${path.terminal} playerResponseTick=${path.playerResponseSubmittedTick ?? "none"}`,
    `${label} creationTicks=${path.commitmentCreationTicks.join(",") || "none"} activeAtEnd=${path.activeCommitmentsAtEnd} totalAtEnd=${path.totalCommitmentsAtEnd}`,
    `${label} resolution=${firstResolution === undefined ? "none" : `${firstResolution.resolvedAtTick}:${firstResolution.resolutionReason}:durationObserved=${firstResolution.observedActiveDuration}`}`,
    `${label} availableBeforeAfter=${firstResolution === undefined ? "n/a" : `${firstResolution.availableResourcesBefore}/${firstResolution.availableResourcesAfter}`} agendaBeforeAfter=${firstResolution === undefined ? "n/a" : `${firstResolution.agendaEvidenceBefore}/${firstResolution.agendaEvidenceAfter}`}`,
    `${label} laterRecommitments=${path.laterRecommitmentCount} duplicateOrChurn=${path.duplicateOrChurnCount} resourceDebit=${path.resourceDebitObserved} forbiddenWriters=${path.forbiddenWriterEventTypes.join(",") || "none"}`,
  ].join("\n");
}

export function formatF05Fix14FundMovementLifecycleInspection(
  report: F05Fix14LifecycleClosureReport,
): string {
  return [
    "F05_FIX14 FUND_MOVEMENT COMMITMENT LIFECYCLE CLOSURE",
    `scenario=${report.scenarioId} seed=${report.seed} horizon=${report.horizonDays}d lifecycleGrounded=${report.lifecycleGrounded}`,
    `chooserThresholdsChanged=${report.chooserThresholdsChanged} chooserPriorityChanged=${report.chooserPriorityChanged} currentStrategyUsed=${report.currentStrategyUsedForLifecycle} timerCooldownCountdownUsed=${report.timerCooldownCountdownUsed}`,
    formatPath("NO_RESPONSE", report.noResponse),
    formatPath("EXISTING_RESPONSE", report.existingResponse),
    `noResponseLateSilenceChanged=${report.noResponseLateSilenceChanged} responseStateGroundedDifference=${report.responseCreatedStateGroundedDifference}`,
    `historicalF05=${report.historicalF05Baseline} historicalF05Fix9=1110/1200:${report.historicalF05Fix9References.branchesAt1110}/${report.historicalF05Fix9References.branchesAt1200}:latePopulation=${report.historicalF05Fix9References.lateSilencePopulation} historicalF05Fix13=${report.historicalF05Fix13Baseline}`,
    `PRIMARY_CLASSIFICATION=${report.primaryClassification}`,
    `NEXT_IMPLEMENTATION_READINESS=${report.nextImplementationReadiness} GATE1F=${report.gate1f} V02=${report.v02} F05_FIX15=${report.f05Fix15}`,
  ].join("\n");
}

export function printF05Fix14FundMovementLifecycleInspection(): void {
  console.log(
    formatF05Fix14FundMovementLifecycleInspection(
      runF05Fix14FundMovementLifecycleInspection(),
    ),
  );
}
