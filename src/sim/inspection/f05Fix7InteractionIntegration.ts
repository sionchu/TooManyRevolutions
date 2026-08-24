import type { GameEvent, GameEventType } from "../events/event";
import { createRespondPoliticalProposalActionProposal } from "../state/action";
import { evaluateInterventionFeasibility } from "../state/intervention";
import {
  asActionId,
  asInterventionCommitmentId,
  type InterventionId,
} from "../state/ids";
import { createF05Fix7PoliticalInteractionScenario } from "../state/politicalInteractionFixture";
import type { ScenarioDefinition } from "../state/scenario";
import type { WorldState } from "../state/world";
import { deriveNationalAgendas } from "../readModels/agenda";
import {
  createF03StartingRecord,
  runF03StrategyFromRecord,
  type F03MetricSnapshot,
  type F03StrategyRunResult,
} from "./f03InterventionCounterfactuals";
import {
  F05_CONTEXTS,
  F05_PACING_EVENT_TYPES,
  F05_STRATEGY_IDS,
  runF05PacingFunDecision,
  type F05BranchMeasurement,
  type F05ContextDefinition,
  type F05PacingFunResult,
  type F05StrategyId,
} from "./f05PacingFunDecision";
import { F04D_VALIDATION_INTERVENTION_IDS } from "../state/gate1fValidationFixture";
import {
  politicalProposalReconsiderationBasisEqual,
  type PoliticalProposal,
} from "../state/politicalProposal";

export const F05_FIX7_DEFAULT_SEED = 40103 as const;
export const F05_FIX7_HORIZON_DAYS = 1_800 as const;

export const F05_FIX7_RESPONSE_MODES = [
  "NO_TEMPLATE",
  "PROPOSAL_IGNORE",
  "PROPOSAL_REJECT",
  "PROPOSAL_ACCEPT_IF_FEASIBLE",
] as const;

export type F05Fix7ResponseMode = (typeof F05_FIX7_RESPONSE_MODES)[number];
export type F05Fix7ProposalMode = Exclude<F05Fix7ResponseMode, "NO_TEMPLATE">;

const PROPOSAL_EVENT_TYPES = new Set<GameEventType>([
  "POLITICAL_PROPOSAL_OPENED",
  "POLITICAL_PROPOSAL_ACCEPTED",
  "POLITICAL_PROPOSAL_REJECTED",
  "POLITICAL_PROPOSAL_RESPONSE_REJECTED",
]);

const CRISIS_EVENT_TYPES = new Set<GameEventType>([
  "COUP_ATTEMPT_STARTED",
  "REBELLION_STARTED",
  "CIVIL_WAR_STARTED",
]);

const REQUIRED_RESPONSE_INTERVENTIONS: Readonly<
  Record<
    Exclude<F05StrategyId, "WAIT" | "REPEATED_POLITICAL_ACCOMMODATION">,
    InterventionId
  >
> = {
  [F05_STRATEGY_IDS.materialRelief]:
    F04D_VALIDATION_INTERVENTION_IDS.materialRelief,
  [F05_STRATEGY_IDS.politicalAccommodation]:
    F04D_VALIDATION_INTERVENTION_IDS.politicalAccommodation,
  [F05_STRATEGY_IDS.oppositionLegalization]:
    F04D_VALIDATION_INTERVENTION_IDS.oppositionLegalization,
  [F05_STRATEGY_IDS.coerciveRestriction]:
    F04D_VALIDATION_INTERVENTION_IDS.coerciveRestriction,
};

const ALL_STRATEGIES = Object.values(
  F05_STRATEGY_IDS,
) as readonly F05StrategyId[];

interface ProposalLifecycleTelemetry {
  readonly opened: number;
  readonly accepted: number;
  readonly explicitRejected: number;
  readonly staleTargetRejected: number;
  readonly responseRejected: number;
  readonly responseNotFeasible: number;
  readonly responseActionCount: number;
  readonly responseFeasibilityChanges: number;
  readonly firstOpenedRelativeTick: number | null;
  readonly lastDecisionRelativeTick: number | null;
  readonly reopenedIdenticalProposalCount: number;
  readonly legitimateReopenCount: number;
  readonly legitimateReopenBasisTransitions: readonly string[];
  readonly maximumConcurrentOpenMatchingProposals: number;
  readonly requestedInterventionsStarted: number;
  readonly requestedInterventionsCompleted: number;
  readonly requestedInterventionsRejected: number;
  readonly firstRequestedInterventionStartRelativeTick: number | null;
  readonly firstRequestedInterventionCompletionRelativeTick: number | null;
  readonly responseActionSequenceExamples: readonly string[];
}

export interface F05Fix7BranchSummary {
  readonly mode: F05Fix7ResponseMode;
  readonly contextId: string;
  readonly contextFamily: F05ContextDefinition["family"];
  readonly strategyId: F05StrategyId;
  readonly checkpointTick: number;
  readonly executedTicks: number;
  readonly historicalControl: boolean;
  readonly requestedInterventionId: string | null;
  readonly firstCrisisRelativeTick: number | null;
  readonly finalTreasury: number;
  readonly finalInstability: number;
  readonly finalFactionGrievance: number;
  readonly finalFactionOrganization: number;
  readonly finalPoliticalCompetition: string;
  readonly finalPressFreedom: string;
  readonly finalActiveConflicts: number;
  readonly finalControlledLandHexes: number;
  readonly finalOutcome: F03MetricSnapshot["outcome"];
  readonly firstProposalOpenedRelativeTick: number | null;
  readonly lastProposalDecisionRelativeTick: number | null;
  readonly firstRequestedInterventionStartRelativeTick: number | null;
  readonly firstRequestedInterventionCompletionRelativeTick: number | null;
  readonly proposalOpenedCount: number;
  readonly proposalAcceptedCount: number;
  readonly proposalExplicitRejectCount: number;
  readonly staleTargetRejectCount: number;
  readonly proposalResponseRejectedCount: number;
  readonly proposalResponseNotFeasibleCount: number;
  readonly responseActionCount: number;
  readonly responseFeasibilityChanges: number;
  readonly reopenedIdenticalProposalCount: number;
  readonly legitimateReopenCount: number;
  readonly legitimateReopenBasisTransitions: readonly string[];
  readonly maximumConcurrentOpenMatchingProposals: number;
  readonly requestedInterventionsStarted: number;
  readonly requestedInterventionsCompleted: number;
  readonly requestedInterventionsRejected: number;
  readonly stateGroundedLongestReassessmentSilenceDays: number;
  readonly proposalDecisionLongestSilenceDays: number | null;
  readonly postInterventionStateGroundedLongestSilenceDays: number | null;
  readonly oldF05LongestPoliticalSilenceDays: number;
  readonly trajectorySignature: string;
  readonly responseActionSequenceExamples: readonly string[];
}

export interface F05Fix7RepresentativeComparison {
  readonly contextId: string;
  readonly strategyId: F05StrategyId;
  readonly branches: readonly F05Fix7BranchSummary[];
}

export type F05Fix7PrimaryClassification =
  | "INTERACTION_INTEGRATION_MEANINGFUL_PACING_IMPROVED"
  | "INTERACTION_INTEGRATION_MEANINGFUL_PACING_STILL_BLOCKED"
  | "PROPOSAL_RESPONSE_DOMINANCE_OR_CHURN"
  | "INTERACTION_INTEGRATION_NO_MEANINGFUL_LONG_HORIZON_EFFECT"
  | "INTEGRATION_BLOCKED_BY_ORCHESTRATION_CONTRACT";

export interface F05Fix7InteractionIntegrationResult {
  readonly scenarioId: string;
  readonly seed: number;
  readonly horizonDays: number;
  readonly historicalF05Baseline: F05PacingFunResult;
  readonly historicalF05BaselineRegression: boolean;
  readonly historicalF05BranchCount: number;
  readonly proposalBranchCount: number;
  readonly expectedBranchCount: number;
  readonly branches: readonly F05Fix7BranchSummary[];
  readonly representativeComparisons: readonly F05Fix7RepresentativeComparison[];
  readonly stateGroundedMaxReassessmentSilenceDays: number;
  readonly proposalDecisionMaxSilenceDays: number;
  readonly postInterventionLateSilenceMaximumDays: number | null;
  readonly legitimateReopenCount: number;
  readonly legitimateReopenBasisTransitions: readonly string[];
  readonly proposalResponseModeEffect: Readonly<
    Record<F05Fix7ProposalMode, number>
  >;
  readonly reopenChurn: "NONE" | "PRESENT";
  readonly responseDominance: "NONE" | "IGNORE" | "REJECT" | "ACCEPT" | "MIXED";
  readonly primaryClassification: F05Fix7PrimaryClassification;
  readonly historicalF05BaselineStatus: "UNCHANGED" | "CHANGED";
  readonly v1TriggerContract: "CLOSED" | "OPEN";
  readonly readyForF05Promotion: "YES" | "NO";
  readonly gate1fRecommendation: "PASS" | "PASS_WITH_NOTES" | "NOT_READY";
  readonly v02: "NOT_STARTED";
  readonly pass: boolean;
}

interface ObservationAccumulator {
  readonly agendaSamples: {
    readonly tick: number;
    readonly signature: string;
  }[];
  readonly decisionSamples: {
    readonly tick: number;
    readonly signature: string;
  }[];
  readonly pacingEventTicks: number[];
  readonly agendaChangeTicks: number[];
  readonly decisionChangeTicks: number[];
  readonly proposalDecisionTicks: number[];
  readonly proposalFeasibilitySignatures: string[];
  readonly proposalFeasibilityTicks: number[];
  maximumConcurrentOpenMatchingProposals: number;
}

interface ActionEventPayload {
  readonly actionId?: unknown;
  readonly proposalId?: unknown;
  readonly interventionId?: unknown;
  readonly reason?: unknown;
  readonly sourceActionId?: unknown;
  readonly proposerFactionId?: unknown;
  readonly countryId?: unknown;
  readonly targetGovernmentId?: unknown;
  readonly subjectKind?: unknown;
}

function asPayload(event: GameEvent): ActionEventPayload {
  if (
    typeof event.payload !== "object" ||
    event.payload === null ||
    Array.isArray(event.payload)
  ) {
    return {};
  }
  return event.payload as ActionEventPayload;
}

function payloadString(
  event: GameEvent,
  key: keyof ActionEventPayload,
): string | null {
  const value = asPayload(event)[key];
  return typeof value === "string" ? value : null;
}

function proposalOpenSignature(world: WorldState): string {
  return Object.values(world.politicalProposals ?? {})
    .filter((proposal) => proposal.status === "open")
    .sort((first, second) => String(first.id).localeCompare(String(second.id)))
    .map(
      (proposal) =>
        `${proposal.id}:${proposal.targetGovernmentId}:${proposal.interventionId}`,
    )
    .join(",");
}

function proposalFeasibilitySignature(
  scenario: ScenarioDefinition,
  world: WorldState,
  primaryInterventionId: InterventionId | null,
): string {
  return Object.values(world.politicalProposals ?? {})
    .filter((proposal) => proposal.status === "open")
    .sort((first, second) => String(first.id).localeCompare(String(second.id)))
    .map((proposal) => {
      const feasibility = evaluateResponseFeasibility(
        scenario,
        world,
        proposal.interventionId,
        proposal.countryId,
        primaryInterventionId,
      );
      return `${proposal.id}:${feasibility.feasible ? "feasible" : "blocked"}:${feasibility.reasons.map((reason) => reason.kind).join(",")}`;
    })
    .join("|");
}

function responseAvailabilitySignature(
  scenario: ScenarioDefinition,
  world: WorldState,
): string {
  const countryId = scenario.playerCountryId;
  if (countryId === null) return "NONE";

  return Object.values(REQUIRED_RESPONSE_INTERVENTIONS)
    .filter(
      (interventionId) =>
        evaluateInterventionFeasibility({
          scenario,
          world,
          interventionId,
          countryId,
        }).feasible,
    )
    .sort()
    .join(",");
}

function agendaSignature(
  scenario: ScenarioDefinition,
  world: WorldState,
  recentEvents: readonly GameEvent[],
): string {
  return (
    deriveNationalAgendas({ scenario, world, recentEvents })
      .map((agenda) => `${agenda.id}:${agenda.severityBand ?? "unknown"}`)
      .join(",") || "NONE"
  );
}

function longestSilence(
  ticks: readonly number[],
  executedTicks: number,
): number {
  const sorted = [0, ...new Set(ticks), executedTicks].sort(
    (first, second) => first - second,
  );
  let longest = 0;
  for (let index = 1; index < sorted.length; index += 1) {
    longest = Math.max(longest, sorted[index]! - sorted[index - 1]!);
  }
  return longest;
}

/** Match the official F05 reassessment contract: pacing events within 30 days
 * form one readable cluster, while Agenda/decision signature changes remain
 * individual state-grounded signals. Proposal lifecycle events are excluded. */
function stateGroundedReassessmentTicks(
  accumulator: ObservationAccumulator,
): readonly number[] {
  const pacingTicks = [...new Set(accumulator.pacingEventTicks)].sort(
    (first, second) => first - second,
  );
  const clusterEnds: number[] = [];
  for (const tick of pacingTicks) {
    const previous = clusterEnds.at(-1);
    if (previous === undefined || tick - previous > 30) {
      clusterEnds.push(tick);
    } else {
      clusterEnds[clusterEnds.length - 1] = tick;
    }
  }
  return [
    ...clusterEnds,
    ...accumulator.agendaChangeTicks,
    ...accumulator.decisionChangeTicks,
  ];
}

function longestSilenceAfter(
  ticks: readonly number[],
  startTick: number,
  executedTicks: number,
): number {
  return longestSilence(
    [startTick, ...ticks.filter((tick) => tick > startTick)],
    executedTicks,
  );
}

function interventionForStrategy(
  strategyId: F05StrategyId,
): InterventionId | null {
  switch (strategyId) {
    case F05_STRATEGY_IDS.wait:
      return null;
    case F05_STRATEGY_IDS.materialRelief:
      return F04D_VALIDATION_INTERVENTION_IDS.materialRelief;
    case F05_STRATEGY_IDS.politicalAccommodation:
    case F05_STRATEGY_IDS.repeatedAccommodation:
      return F04D_VALIDATION_INTERVENTION_IDS.politicalAccommodation;
    case F05_STRATEGY_IDS.oppositionLegalization:
      return F04D_VALIDATION_INTERVENTION_IDS.oppositionLegalization;
    case F05_STRATEGY_IDS.coerciveRestriction:
      return F04D_VALIDATION_INTERVENTION_IDS.coerciveRestriction;
  }
}

function strategyPolicy(
  strategyId: F05StrategyId,
): (context: { readonly relativeTick: number }) => InterventionId | null {
  const interventionId = interventionForStrategy(strategyId);
  return ({ relativeTick }) => {
    if (interventionId === null) return null;
    if (strategyId === F05_STRATEGY_IDS.repeatedAccommodation) {
      return relativeTick % 90 === 0 ? interventionId : null;
    }
    return relativeTick === 0 ? interventionId : null;
  };
}

function evaluateResponseFeasibility(
  scenario: ScenarioDefinition,
  world: WorldState,
  interventionId: InterventionId,
  countryId: Parameters<typeof evaluateInterventionFeasibility>[0]["countryId"],
  primaryInterventionId: InterventionId | null,
) {
  const country = world.countries[countryId];
  let projectedWorld = world;
  let treasuryAvailable = country?.treasury;

  if (primaryInterventionId !== null && country !== undefined) {
    const primary = evaluateInterventionFeasibility({
      scenario,
      world,
      interventionId: primaryInterventionId,
      countryId,
    });
    if (primary.feasible && primary.definition !== undefined) {
      const projectionActionId = asActionId(
        `f05fix7-projection:${world.tick}:${primaryInterventionId}`,
      );
      const projectionCommitment = {
        id: asInterventionCommitmentId(`projection:${projectionActionId}`),
        interventionId: primary.definition.id,
        countryId,
        sourceActionId: projectionActionId,
        startedTick: world.tick + 1,
        firstOccupiedTick: world.tick + 1,
        completionTick: world.tick + 1 + primary.definition.durationDays,
        administrativeLoad: primary.definition.administrativeLoad,
      };
      projectedWorld = {
        ...world,
        interventionCommitments: {
          ...world.interventionCommitments,
          [projectionCommitment.id]: projectionCommitment,
        },
      };
      treasuryAvailable =
        (treasuryAvailable ?? 0) - primary.definition.treasuryCost;
    }
  }

  return evaluateInterventionFeasibility({
    scenario,
    world: projectedWorld,
    interventionId,
    countryId,
    options:
      treasuryAvailable === undefined ? undefined : { treasuryAvailable },
  });
}

function responsePolicy(
  mode: F05Fix7ProposalMode,
): NonNullable<
  Parameters<typeof runF03StrategyFromRecord>[6]
>["additionalActionPolicy"] {
  return ({ scenario, world, interventionId }) => {
    if (mode === "PROPOSAL_IGNORE") return [];

    return Object.values(world.politicalProposals ?? {})
      .filter((proposal) => proposal.status === "open")
      .sort((first, second) =>
        String(first.id).localeCompare(String(second.id)),
      )
      .flatMap((proposal) => {
        if (mode === "PROPOSAL_REJECT") {
          return [
            createRespondPoliticalProposalActionProposal(
              world.tick + 1,
              proposal.id,
              "reject",
            ),
          ];
        }

        const feasibility = evaluateResponseFeasibility(
          scenario,
          world,
          proposal.interventionId,
          proposal.countryId,
          interventionId,
        );
        return feasibility.feasible
          ? [
              createRespondPoliticalProposalActionProposal(
                world.tick + 1,
                proposal.id,
                "accept",
              ),
            ]
          : [];
      });
  };
}

function collectObservation(
  accumulator: ObservationAccumulator,
  scenario: ScenarioDefinition,
  relativeTick: number,
  world: WorldState,
  events: readonly GameEvent[],
  primaryInterventionId: InterventionId | null,
): void {
  for (const event of events) {
    if (F05_PACING_EVENT_TYPES.has(event.type)) {
      accumulator.pacingEventTicks.push(
        event.tick - (world.tick - relativeTick),
      );
    }
    if (PROPOSAL_EVENT_TYPES.has(event.type)) {
      accumulator.proposalDecisionTicks.push(
        event.tick - (world.tick - relativeTick),
      );
    }
  }

  const openProposals = Object.values(world.politicalProposals ?? {}).filter(
    (proposal) => proposal.status === "open",
  );
  accumulator.maximumConcurrentOpenMatchingProposals = Math.max(
    accumulator.maximumConcurrentOpenMatchingProposals,
    openProposals.length,
  );

  const openSignature = proposalOpenSignature(world);
  const previousOpenSignature =
    accumulator.proposalFeasibilitySignatures.at(-1)?.split("@@")[0] ?? "";
  if (relativeTick === 0 || openSignature !== previousOpenSignature) {
    accumulator.proposalDecisionTicks.push(relativeTick);
  }

  const feasibilitySignature = proposalFeasibilitySignature(
    scenario,
    world,
    primaryInterventionId,
  );
  const combinedFeasibility = `${openSignature}@@${feasibilitySignature}`;
  const previousCombined = accumulator.proposalFeasibilitySignatures.at(-1);
  if (
    previousCombined !== undefined &&
    previousCombined !== combinedFeasibility
  ) {
    accumulator.proposalFeasibilityTicks.push(relativeTick);
    accumulator.proposalDecisionTicks.push(relativeTick);
  }
  accumulator.proposalFeasibilitySignatures.push(combinedFeasibility);

  if (relativeTick % 30 === 0) {
    // Match the historical F05 observer contract: agenda read-model samples
    // receive the current step's recent event window, not proposal telemetry
    // accumulated by this integration report.
    const signature = agendaSignature(scenario, world, events);
    accumulator.agendaSamples.push({ tick: relativeTick, signature });
    if (
      accumulator.agendaSamples.length > 1 &&
      accumulator.agendaSamples.at(-2)!.signature !== signature
    ) {
      accumulator.agendaChangeTicks.push(relativeTick);
    }
  }

  if (relativeTick % 90 === 0) {
    const signature = responseAvailabilitySignature(scenario, world);
    accumulator.decisionSamples.push({ tick: relativeTick, signature });
    if (
      accumulator.decisionSamples.length > 1 &&
      accumulator.decisionSamples.at(-2)!.signature !== signature
    ) {
      accumulator.decisionChangeTicks.push(relativeTick);
    }
  }
}

function actionSequenceExamples(run: F03StrategyRunResult): readonly string[] {
  const startTick = run.checkpointTick;
  return run.finalRecord.world.run.actionLog
    .filter(
      (action) =>
        action.actionType === "START_INTERVENTION" ||
        action.actionType === "RESPOND_POLITICAL_PROPOSAL",
    )
    .slice(0, 8)
    .map(
      (action) =>
        `${action.tick - startTick}:${action.sequence}:${action.actionType}:${JSON.stringify(action.payload)}`,
    );
}

function proposalDemandKey(proposal: {
  readonly proposerFactionId: unknown;
  readonly countryId: unknown;
  readonly subjectKind: unknown;
  readonly interventionId: unknown;
}): string {
  return [
    proposal.proposerFactionId,
    proposal.countryId,
    proposal.subjectKind,
    proposal.interventionId,
  ]
    .map(String)
    .join("|");
}

function basisLabel(basis: {
  readonly targetGovernmentId: unknown;
  readonly feasible: boolean;
  readonly failureClasses: readonly unknown[];
}): string {
  return `${String(basis.targetGovernmentId)}:${basis.feasible ? "feasible" : "blocked"}:${basis.failureClasses
    .map((failure) => JSON.stringify(failure))
    .join(",")}`;
}

function proposalTelemetry(
  run: F03StrategyRunResult,
  startTick: number,
  accumulator: ObservationAccumulator,
): ProposalLifecycleTelemetry {
  const events = run.stepEvents;
  const episodesByDemand = new Map<string, PoliticalProposal[]>();
  for (const proposal of Object.values(
    run.finalRecord.world.politicalProposals ?? {},
  )) {
    const demandKey = proposalDemandKey(proposal);
    const episodes = episodesByDemand.get(demandKey) ?? [];
    episodes.push(proposal);
    episodesByDemand.set(demandKey, episodes);
  }
  let reopenedIdenticalProposalCount = 0;
  let legitimateReopenCount = 0;
  const legitimateReopenBasisTransitions: string[] = [];
  for (const episodes of episodesByDemand.values()) {
    episodes.sort(
      (first, second) =>
        first.createdAtTick - second.createdAtTick ||
        String(first.id).localeCompare(String(second.id)),
    );
    for (let index = 1; index < episodes.length; index += 1) {
      const previous = episodes[index - 1]!;
      const current = episodes[index]!;
      if (
        previous.status !== "rejected" ||
        previous.resolutionReason !== "explicitReject" ||
        current.status !== "rejected" ||
        current.resolutionReason !== "explicitReject" ||
        previous.reconsiderationBasis === undefined ||
        current.reconsiderationBasis === undefined
      ) {
        continue;
      }
      if (
        politicalProposalReconsiderationBasisEqual(
          previous.reconsiderationBasis,
          current.reconsiderationBasis,
        )
      ) {
        reopenedIdenticalProposalCount += 1;
      } else {
        legitimateReopenCount += 1;
        legitimateReopenBasisTransitions.push(
          `${String(previous.id)} -> ${String(current.id)}: ${basisLabel(previous.reconsiderationBasis)} => ${basisLabel(current.reconsiderationBasis)}`,
        );
      }
    }
  }

  const responseActionIds = new Set(
    run.finalRecord.world.run.actionLog
      .filter((action) => action.actionType === "RESPOND_POLITICAL_PROPOSAL")
      .map((action) => String(action.id)),
  );
  const responseActionTicks = run.finalRecord.world.run.actionLog
    .filter((action) => action.actionType === "RESPOND_POLITICAL_PROPOSAL")
    .map((action) => action.tick - startTick);

  const startedThroughResponse = events.filter(
    (event) =>
      event.type === "INTERVENTION_STARTED" &&
      responseActionIds.has(payloadString(event, "actionId") ?? ""),
  );
  const completedThroughResponse = events.filter(
    (event) =>
      event.type === "INTERVENTION_COMPLETED" &&
      responseActionIds.has(payloadString(event, "sourceActionId") ?? ""),
  );
  const rejectedThroughResponse = events.filter(
    (event) =>
      event.type === "INTERVENTION_REJECTED" &&
      responseActionIds.has(payloadString(event, "actionId") ?? ""),
  );
  const responseRejectedEvents = events.filter(
    (event) => event.type === "POLITICAL_PROPOSAL_RESPONSE_REJECTED",
  );
  const proposalOpenEvents = events.filter(
    (event) => event.type === "POLITICAL_PROPOSAL_OPENED",
  );
  const acceptedEvents = events.filter(
    (event) => event.type === "POLITICAL_PROPOSAL_ACCEPTED",
  );
  const rejectedEvents = events.filter(
    (event) => event.type === "POLITICAL_PROPOSAL_REJECTED",
  );
  const relativeProposalTicks = events
    .filter((event) => PROPOSAL_EVENT_TYPES.has(event.type))
    .map((event) => event.tick - startTick);
  const starts = startedThroughResponse.map((event) => event.tick - startTick);
  const completions = completedThroughResponse.map(
    (event) => event.tick - startTick,
  );

  return {
    opened: proposalOpenEvents.length,
    accepted: acceptedEvents.length,
    explicitRejected: rejectedEvents.filter(
      (event) => payloadString(event, "reason") === "explicitReject",
    ).length,
    staleTargetRejected: rejectedEvents.filter(
      (event) => payloadString(event, "reason") === "staleTargetGovernment",
    ).length,
    responseRejected: responseRejectedEvents.length,
    responseNotFeasible: responseRejectedEvents.filter(
      (event) => payloadString(event, "reason") === "notFeasible",
    ).length,
    responseActionCount: responseActionIds.size,
    responseFeasibilityChanges: accumulator.proposalFeasibilityTicks.length,
    firstOpenedRelativeTick:
      proposalOpenEvents.length === 0
        ? null
        : Math.min(
            ...proposalOpenEvents.map((event) => event.tick - startTick),
          ),
    lastDecisionRelativeTick:
      relativeProposalTicks.length === 0
        ? null
        : Math.max(...relativeProposalTicks.concat(responseActionTicks)),
    reopenedIdenticalProposalCount,
    legitimateReopenCount,
    legitimateReopenBasisTransitions,
    maximumConcurrentOpenMatchingProposals:
      accumulator.maximumConcurrentOpenMatchingProposals,
    requestedInterventionsStarted: startedThroughResponse.length,
    requestedInterventionsCompleted: completedThroughResponse.length,
    requestedInterventionsRejected:
      rejectedThroughResponse.length +
      responseRejectedEvents.filter(
        (event) =>
          payloadString(event, "reason") === "notFeasible" ||
          payloadString(event, "reason") === "staleTargetGovernment",
      ).length,
    firstRequestedInterventionStartRelativeTick:
      starts.length === 0 ? null : Math.min(...starts),
    firstRequestedInterventionCompletionRelativeTick:
      completions.length === 0 ? null : Math.min(...completions),
    responseActionSequenceExamples: actionSequenceExamples(run),
  };
}

function trajectorySignature(
  scenario: ScenarioDefinition,
  run: F03StrategyRunResult,
  stateEvents: readonly GameEvent[],
  agendaSamples: readonly {
    readonly tick: number;
    readonly signature: string;
  }[],
): string {
  const eventHistory = stateEvents
    .filter((event) => F05_PACING_EVENT_TYPES.has(event.type))
    .map(
      (event) =>
        `${event.tick - run.checkpointTick}:${event.type}:${String(event.targetId ?? "none")}`,
    )
    .join(">");
  const agendaHistory = agendaSamples
    .filter(
      (sample, index) =>
        index === 0 || sample.signature !== agendaSamples[index - 1]!.signature,
    )
    .map((sample) => `${sample.tick}:${sample.signature}`)
    .join(">");
  return [
    eventHistory,
    agendaHistory,
    run.final.outcome,
    run.final.controlledLandHexes,
    run.final.activeConflicts,
    run.final.currentGovernmentId ?? "none",
    scenario.playerCountryId === null
      ? "none"
      : (run.finalRecord.world.policies[scenario.playerCountryId]
          ?.institutionalRules.politicalCompetition ?? "unknown"),
    scenario.playerCountryId === null
      ? "none"
      : (run.finalRecord.world.policies[scenario.playerCountryId]
          ?.institutionalRules.pressFreedom ?? "unknown"),
    run.final.factionGrievance.toFixed(3),
    run.final.factionOrganization.toFixed(3),
    run.final.maxRegionScarcity.toFixed(3),
  ].join("|");
}

function runProposalBranch(
  scenario: ScenarioDefinition,
  context: F05ContextDefinition,
  strategyId: F05StrategyId,
  mode: F05Fix7ProposalMode,
  startingRecord = createF03StartingRecord(
    scenario,
    F05_FIX7_DEFAULT_SEED,
    context.checkpointTick,
  ),
): F05Fix7BranchSummary {
  const accumulator: ObservationAccumulator = {
    agendaSamples: [],
    decisionSamples: [],
    pacingEventTicks: [],
    agendaChangeTicks: [],
    decisionChangeTicks: [],
    proposalDecisionTicks: [],
    proposalFeasibilitySignatures: [],
    proposalFeasibilityTicks: [],
    maximumConcurrentOpenMatchingProposals: 0,
  };
  const primaryInterventionId = interventionForStrategy(strategyId);
  const run = runF03StrategyFromRecord(
    scenario,
    context.id,
    `${strategyId}:${mode}`,
    startingRecord,
    5,
    strategyPolicy(strategyId),
    {
      checkpointOffsets: [0, 360, 720, 1080, 1440, 1800],
      factionActorLoop: "on",
      additionalActionPolicy: responsePolicy(mode),
      onObservation: ({ relativeTick, world, events }) => {
        collectObservation(
          accumulator,
          scenario,
          relativeTick,
          world,
          events,
          primaryInterventionId,
        );
      },
    },
  );
  const telemetry = proposalTelemetry(run, run.checkpointTick, accumulator);
  const stateGroundedTicks = stateGroundedReassessmentTicks(accumulator);
  const stateGroundedLongestReassessmentSilenceDays = longestSilence(
    stateGroundedTicks,
    run.executedTicks,
  );
  const completionTick =
    telemetry.firstRequestedInterventionCompletionRelativeTick;
  const postInterventionStateGroundedLongestSilenceDays =
    completionTick === null
      ? null
      : longestSilenceAfter(
          stateGroundedTicks,
          completionTick,
          run.executedTicks,
        );
  const policyState = scenario.playerCountryId
    ? run.finalRecord.world.policies[scenario.playerCountryId]
    : undefined;

  return {
    mode,
    contextId: context.id,
    contextFamily: context.family,
    strategyId,
    checkpointTick: context.checkpointTick,
    executedTicks: run.executedTicks,
    historicalControl: false,
    requestedInterventionId: primaryInterventionId,
    firstCrisisRelativeTick:
      run.stepEvents.find((event) => CRISIS_EVENT_TYPES.has(event.type)) ===
      undefined
        ? null
        : run.stepEvents.find((event) => CRISIS_EVENT_TYPES.has(event.type))!
            .tick - run.checkpointTick,
    finalTreasury: run.final.treasury,
    finalInstability: run.final.instability,
    finalFactionGrievance: run.final.factionGrievance,
    finalFactionOrganization: run.final.factionOrganization,
    finalPoliticalCompetition:
      policyState?.institutionalRules.politicalCompetition ?? "unknown",
    finalPressFreedom:
      policyState?.institutionalRules.pressFreedom ?? "unknown",
    finalActiveConflicts: run.final.activeConflicts,
    finalControlledLandHexes: run.final.controlledLandHexes,
    finalOutcome: run.final.outcome,
    firstProposalOpenedRelativeTick: telemetry.firstOpenedRelativeTick,
    lastProposalDecisionRelativeTick: telemetry.lastDecisionRelativeTick,
    firstRequestedInterventionStartRelativeTick:
      telemetry.firstRequestedInterventionStartRelativeTick,
    firstRequestedInterventionCompletionRelativeTick:
      telemetry.firstRequestedInterventionCompletionRelativeTick,
    proposalOpenedCount: telemetry.opened,
    proposalAcceptedCount: telemetry.accepted,
    proposalExplicitRejectCount: telemetry.explicitRejected,
    staleTargetRejectCount: telemetry.staleTargetRejected,
    proposalResponseRejectedCount: telemetry.responseRejected,
    proposalResponseNotFeasibleCount: telemetry.responseNotFeasible,
    responseActionCount: telemetry.responseActionCount,
    responseFeasibilityChanges: telemetry.responseFeasibilityChanges,
    reopenedIdenticalProposalCount: telemetry.reopenedIdenticalProposalCount,
    legitimateReopenCount: telemetry.legitimateReopenCount,
    legitimateReopenBasisTransitions:
      telemetry.legitimateReopenBasisTransitions,
    maximumConcurrentOpenMatchingProposals:
      telemetry.maximumConcurrentOpenMatchingProposals,
    requestedInterventionsStarted: telemetry.requestedInterventionsStarted,
    requestedInterventionsCompleted: telemetry.requestedInterventionsCompleted,
    requestedInterventionsRejected: telemetry.requestedInterventionsRejected,
    stateGroundedLongestReassessmentSilenceDays,
    proposalDecisionLongestSilenceDays:
      accumulator.proposalDecisionTicks.length === 0
        ? null
        : longestSilence(accumulator.proposalDecisionTicks, run.executedTicks),
    postInterventionStateGroundedLongestSilenceDays,
    oldF05LongestPoliticalSilenceDays: longestSilence(
      run.stepEvents
        .filter((event) => F05_PACING_EVENT_TYPES.has(event.type))
        .map((event) => event.tick - run.checkpointTick),
      run.executedTicks,
    ),
    trajectorySignature: trajectorySignature(
      scenario,
      run,
      run.stepEvents,
      accumulator.agendaSamples,
    ),
    responseActionSequenceExamples: telemetry.responseActionSequenceExamples,
  };
}

function historicalControlBranch(
  context: F05ContextDefinition,
  branch: F05BranchMeasurement,
): F05Fix7BranchSummary {
  return {
    mode: "NO_TEMPLATE",
    contextId: context.id,
    contextFamily: context.family,
    strategyId: branch.strategyId,
    checkpointTick: context.checkpointTick,
    executedTicks: branch.executedTicks,
    historicalControl: true,
    requestedInterventionId: branch.interventionId,
    firstCrisisRelativeTick: branch.firstCrisisRelativeTick,
    finalTreasury: branch.final.treasury,
    finalInstability: branch.final.instability,
    finalFactionGrievance: branch.final.factionGrievance,
    finalFactionOrganization: branch.final.factionOrganization,
    finalPoliticalCompetition: branch.finalPoliticalCompetition,
    finalPressFreedom: branch.finalPressFreedom,
    finalActiveConflicts: branch.final.activeConflicts,
    finalControlledLandHexes: branch.final.controlledLandHexes,
    finalOutcome: branch.final.outcome,
    firstProposalOpenedRelativeTick: null,
    lastProposalDecisionRelativeTick: null,
    firstRequestedInterventionStartRelativeTick: null,
    firstRequestedInterventionCompletionRelativeTick: null,
    proposalOpenedCount: 0,
    proposalAcceptedCount: 0,
    proposalExplicitRejectCount: 0,
    staleTargetRejectCount: 0,
    proposalResponseRejectedCount: 0,
    proposalResponseNotFeasibleCount: 0,
    responseActionCount: 0,
    responseFeasibilityChanges: 0,
    reopenedIdenticalProposalCount: 0,
    legitimateReopenCount: 0,
    legitimateReopenBasisTransitions: [],
    maximumConcurrentOpenMatchingProposals: 0,
    requestedInterventionsStarted: 0,
    requestedInterventionsCompleted: 0,
    requestedInterventionsRejected: 0,
    stateGroundedLongestReassessmentSilenceDays:
      branch.longestReassessmentSilenceDays,
    proposalDecisionLongestSilenceDays: null,
    postInterventionStateGroundedLongestSilenceDays: null,
    oldF05LongestPoliticalSilenceDays: branch.longestPoliticalSilenceDays,
    trajectorySignature: branch.trajectorySignature,
    responseActionSequenceExamples: [],
  };
}

function historicalBaselineRegression(result: F05PacingFunResult): boolean {
  const allBranches = result.contexts.flatMap((context) => context.branches);
  return (
    result.scenarioId === "gate1f.f04d.validation" &&
    result.seed === F05_FIX7_DEFAULT_SEED &&
    result.horizonYears === 5 &&
    result.factionActorLoop === "on" &&
    allBranches.length === 36 &&
    result.previousMajorEventSilence.maximumDays === 1787 &&
    result.repairedReassessmentSilence.maximumDays === 1200 &&
    result.recommendation === "NOT_READY" &&
    result.contexts.every(
      (context) => context.branches.length === ALL_STRATEGIES.length,
    )
  );
}

function matrixComplete(branches: readonly F05Fix7BranchSummary[]): boolean {
  const expected = new Set<string>();
  for (const mode of F05_FIX7_RESPONSE_MODES) {
    for (const context of F05_CONTEXTS) {
      for (const strategyId of ALL_STRATEGIES) {
        expected.add(`${mode}:${context.id}:${strategyId}`);
      }
    }
  }
  const actual = new Set(
    branches.map(
      (branch) => `${branch.mode}:${branch.contextId}:${branch.strategyId}`,
    ),
  );
  return (
    expected.size === actual.size &&
    [...expected].every((key) => actual.has(key))
  );
}

function modeEffectCounts(
  branches: readonly F05Fix7BranchSummary[],
): Readonly<Record<F05Fix7ProposalMode, number>> {
  const controls = new Map(
    branches
      .filter((branch) => branch.mode === "NO_TEMPLATE")
      .map((branch) => [`${branch.contextId}:${branch.strategyId}`, branch]),
  );
  const counts = {
    PROPOSAL_IGNORE: 0,
    PROPOSAL_REJECT: 0,
    PROPOSAL_ACCEPT_IF_FEASIBLE: 0,
  } as Record<F05Fix7ProposalMode, number>;
  for (const branch of branches) {
    if (branch.mode === "NO_TEMPLATE") continue;
    const control = controls.get(`${branch.contextId}:${branch.strategyId}`);
    if (control !== undefined && stateGroundedDifference(control, branch)) {
      counts[branch.mode] += 1;
    }
  }
  return counts;
}

/** Compare only state-grounded history, excluding proposal lifecycle prompts. */
function stateGroundedDifference(
  first: F05Fix7BranchSummary,
  second: F05Fix7BranchSummary,
): boolean {
  return (
    JSON.stringify({
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
    JSON.stringify({
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

function classifyResponseDominance(
  effectCounts: Readonly<Record<F05Fix7ProposalMode, number>>,
): "NONE" | "IGNORE" | "REJECT" | "ACCEPT" | "MIXED" {
  const entries = Object.entries(effectCounts) as [
    F05Fix7ProposalMode,
    number,
  ][];
  const fullEffect = entries.filter(([, count]) => count === 36);
  if (
    fullEffect.length === 1 &&
    entries.every(([mode, count]) => mode === fullEffect[0]![0] || count === 0)
  ) {
    return fullEffect[0]![0] === "PROPOSAL_ACCEPT_IF_FEASIBLE"
      ? "ACCEPT"
      : fullEffect[0]![0] === "PROPOSAL_REJECT"
        ? "REJECT"
        : "IGNORE";
  }
  if (
    entries.some(([, count]) => count > 0) &&
    new Set(entries.map(([, count]) => count)).size > 1
  ) {
    return "MIXED";
  }
  return "NONE";
}

function classifyPrimary(
  baseline: F05PacingFunResult,
  branches: readonly F05Fix7BranchSummary[],
  matrixIsComplete: boolean,
  churn: "NONE" | "PRESENT",
  dominance: "NONE" | "IGNORE" | "REJECT" | "ACCEPT" | "MIXED",
): F05Fix7PrimaryClassification {
  if (!matrixIsComplete) return "INTEGRATION_BLOCKED_BY_ORCHESTRATION_CONTRACT";
  if (churn === "PRESENT" || dominance !== "NONE") {
    return "PROPOSAL_RESPONSE_DOMINANCE_OR_CHURN";
  }

  const controlSilence = baseline.repairedReassessmentSilence.maximumDays;
  const proposalBranches = branches.filter(
    (branch) => !branch.historicalControl,
  );
  const stateMeaningful = proposalBranches.some((branch) => {
    const control = branches.find(
      (candidate) =>
        candidate.mode === "NO_TEMPLATE" &&
        candidate.contextId === branch.contextId &&
        candidate.strategyId === branch.strategyId,
    );
    return control !== undefined && stateGroundedDifference(control, branch);
  });
  const postCompletion = proposalBranches.filter(
    (branch) => branch.postInterventionStateGroundedLongestSilenceDays !== null,
  );
  const durableImprovement =
    postCompletion.length > 0 &&
    postCompletion.every(
      (branch) =>
        branch.postInterventionStateGroundedLongestSilenceDays! <
        controlSilence,
    );

  if (!stateMeaningful) {
    return "INTERACTION_INTEGRATION_NO_MEANINGFUL_LONG_HORIZON_EFFECT";
  }
  return durableImprovement
    ? "INTERACTION_INTEGRATION_MEANINGFUL_PACING_IMPROVED"
    : "INTERACTION_INTEGRATION_MEANINGFUL_PACING_STILL_BLOCKED";
}

function representativeComparisons(
  branches: readonly F05Fix7BranchSummary[],
): readonly F05Fix7RepresentativeComparison[] {
  const representativeContexts = F05_CONTEXTS.filter(
    (context) => context.primary,
  );
  // WAIT leaves the authored LOBBY template available, so this comparison
  // measures the response seam rather than pre-empting it with the same
  // direct coercive intervention.
  const strategyId = F05_STRATEGY_IDS.wait;
  return representativeContexts.map((context) => ({
    contextId: context.id,
    strategyId,
    branches: branches.filter(
      (branch) =>
        branch.contextId === context.id && branch.strategyId === strategyId,
    ),
  }));
}

export function runF05Fix7InteractionIntegration(
  seed = F05_FIX7_DEFAULT_SEED,
): F05Fix7InteractionIntegrationResult {
  const historical = runF05PacingFunDecision(seed);
  const historicalBranches = historical.contexts.flatMap((assessment) =>
    assessment.branches.map((branch) =>
      historicalControlBranch(assessment.context, branch),
    ),
  );
  const scenario = createF05Fix7PoliticalInteractionScenario();
  const proposalBranches: F05Fix7BranchSummary[] = [];

  for (const context of F05_CONTEXTS) {
    const startingRecord = createF03StartingRecord(
      scenario,
      seed,
      context.checkpointTick,
    );
    for (const strategyId of ALL_STRATEGIES) {
      for (const mode of [
        "PROPOSAL_IGNORE",
        "PROPOSAL_REJECT",
        "PROPOSAL_ACCEPT_IF_FEASIBLE",
      ] as const) {
        proposalBranches.push(
          runProposalBranch(
            scenario,
            context,
            strategyId,
            mode,
            startingRecord,
          ),
        );
      }
    }
  }

  const branches = [...historicalBranches, ...proposalBranches];
  const stateGroundedMaxReassessmentSilenceDays = Math.max(
    ...proposalBranches.map(
      (branch) => branch.stateGroundedLongestReassessmentSilenceDays,
    ),
  );
  const proposalDecisionMaxSilenceDays = Math.max(
    ...proposalBranches.map(
      (branch) => branch.proposalDecisionLongestSilenceDays ?? 0,
    ),
  );
  const postCompletionValues = proposalBranches
    .map((branch) => branch.postInterventionStateGroundedLongestSilenceDays)
    .filter((value): value is number => value !== null);
  const postInterventionLateSilenceMaximumDays =
    postCompletionValues.length === 0
      ? null
      : Math.max(...postCompletionValues);
  const proposalResponseModeEffect = modeEffectCounts(branches);
  const legitimateReopenCount = proposalBranches.reduce(
    (sum, branch) => sum + branch.legitimateReopenCount,
    0,
  );
  const legitimateReopenBasisTransitions = proposalBranches.flatMap(
    (branch) => branch.legitimateReopenBasisTransitions,
  );
  const reopenChurn = proposalBranches.some(
    (branch) => branch.reopenedIdenticalProposalCount > 0,
  )
    ? "PRESENT"
    : "NONE";
  const responseDominance = classifyResponseDominance(
    proposalResponseModeEffect,
  );
  const isComplete =
    branches.length ===
      F05_FIX7_RESPONSE_MODES.length *
        F05_CONTEXTS.length *
        ALL_STRATEGIES.length && matrixComplete(branches);
  const triggerContractClosed =
    scenario.factionProposalTemplates?.length === 1 &&
    scenario.factionProposalTemplates[0]?.triggerAction === "LOBBY";
  const primaryClassification = classifyPrimary(
    historical,
    branches,
    isComplete,
    reopenChurn,
    responseDominance,
  );
  const historicalRegression = historicalBaselineRegression(historical);
  const readyForPromotion =
    primaryClassification ===
      "INTERACTION_INTEGRATION_MEANINGFUL_PACING_IMPROVED" &&
    reopenChurn === "NONE" &&
    responseDominance === "NONE";

  return {
    scenarioId: scenario.id,
    seed,
    horizonDays: F05_FIX7_HORIZON_DAYS,
    historicalF05Baseline: historical,
    historicalF05BaselineRegression: historicalRegression,
    historicalF05BranchCount: historicalBranches.length,
    proposalBranchCount: proposalBranches.length,
    expectedBranchCount: 144,
    branches,
    representativeComparisons: representativeComparisons(branches),
    stateGroundedMaxReassessmentSilenceDays,
    proposalDecisionMaxSilenceDays,
    postInterventionLateSilenceMaximumDays,
    legitimateReopenCount,
    legitimateReopenBasisTransitions,
    proposalResponseModeEffect,
    reopenChurn,
    responseDominance,
    primaryClassification,
    historicalF05BaselineStatus: historicalRegression ? "UNCHANGED" : "CHANGED",
    v1TriggerContract: triggerContractClosed ? "CLOSED" : "OPEN",
    readyForF05Promotion: readyForPromotion ? "YES" : "NO",
    gate1fRecommendation: "NOT_READY",
    v02: "NOT_STARTED",
    pass: historicalRegression && isComplete && triggerContractClosed,
  };
}

function formatBranch(branch: F05Fix7BranchSummary): string {
  return [
    branch.mode,
    branch.contextId,
    branch.strategyId,
    `proposal=${branch.proposalOpenedCount}/${branch.proposalAcceptedCount}/${branch.proposalExplicitRejectCount}`,
    `response=${branch.responseActionCount}`,
    `requested=${branch.requestedInterventionsStarted}/${branch.requestedInterventionsCompleted}/${branch.requestedInterventionsRejected}`,
    `open@${branch.firstProposalOpenedRelativeTick ?? "-"}`,
    `decision@${branch.lastProposalDecisionRelativeTick ?? "-"}`,
    `start@${branch.firstRequestedInterventionStartRelativeTick ?? "-"}`,
    `complete@${branch.firstRequestedInterventionCompletionRelativeTick ?? "-"}`,
    `stateSilence=${branch.stateGroundedLongestReassessmentSilenceDays}d`,
    `decisionSilence=${branch.proposalDecisionLongestSilenceDays ?? "-"}d`,
    `postComplete=${branch.postInterventionStateGroundedLongestSilenceDays ?? "-"}d`,
    `reopen=${branch.reopenedIdenticalProposalCount}`,
    `final=T${branch.finalTreasury.toFixed(0)}/I${branch.finalInstability.toFixed(1)}/G${branch.finalFactionGrievance.toFixed(3)}/O${branch.finalFactionOrganization.toFixed(3)}/C${branch.finalActiveConflicts}/H${branch.finalControlledLandHexes}/${branch.finalOutcome}`,
  ].join(" | ");
}

export function formatF05Fix7InteractionIntegration(
  result: F05Fix7InteractionIntegrationResult,
): string {
  const lines = [
    "F05_FIX7 POLITICAL INTERACTION LONG-HORIZON INTEGRATION",
    `scenario=${result.scenarioId} seed=${result.seed} horizon=${result.horizonDays}d`,
    `population=${result.historicalF05BranchCount} historical + ${result.proposalBranchCount} proposal = ${result.branches.length}/${result.expectedBranchCount}`,
    `historical baseline=${result.historicalF05BaselineStatus} regression=${result.historicalF05BaselineRegression ? "PASS" : "FAIL"} oldSilence=${result.historicalF05Baseline.previousMajorEventSilence.maximumDays}d stateSilence=${result.historicalF05Baseline.repairedReassessmentSilence.maximumDays}d recommendation=${result.historicalF05Baseline.recommendation}`,
    `state-grounded max reassessment silence=${result.stateGroundedMaxReassessmentSilenceDays}d`,
    `proposal-decision max silence=${result.proposalDecisionMaxSilenceDays}d`,
    `post-intervention late state-grounded silence=${result.postInterventionLateSilenceMaximumDays ?? "none"}d`,
    `proposal mode effect count IGNORE=${result.proposalResponseModeEffect.PROPOSAL_IGNORE} REJECT=${result.proposalResponseModeEffect.PROPOSAL_REJECT} ACCEPT=${result.proposalResponseModeEffect.PROPOSAL_ACCEPT_IF_FEASIBLE}`,
    `reopen churn=${result.reopenChurn} response dominance=${result.responseDominance}`,
    `legitimate reopens=${result.legitimateReopenCount}`,
    `classification=${result.primaryClassification}`,
    `V1_TRIGGER_CONTRACT=${result.v1TriggerContract} READY_FOR_F05_PROMOTION=${result.readyForF05Promotion} GATE1F_RECOMMENDATION=${result.gate1fRecommendation} V02=${result.v02}`,
    "Representative WAIT / authored coercive-restriction proposal comparison",
    "mode | context | strategy | proposal | response | requested | timing | silence | reopen | final",
  ];
  for (const comparison of result.representativeComparisons) {
    for (const branch of comparison.branches) {
      lines.push(formatBranch(branch));
      if (branch.responseActionSequenceExamples.length > 0) {
        lines.push(
          `sequence ${branch.mode} ${branch.contextId}: ${branch.responseActionSequenceExamples.join(" ; ")}`,
        );
      }
    }
  }
  lines.push("Integration matrix checks");
  for (const mode of F05_FIX7_RESPONSE_MODES) {
    const modeBranches = result.branches.filter(
      (branch) => branch.mode === mode,
    );
    const opened = modeBranches.reduce(
      (sum, branch) => sum + branch.proposalOpenedCount,
      0,
    );
    const accepted = modeBranches.reduce(
      (sum, branch) => sum + branch.proposalAcceptedCount,
      0,
    );
    const rejected = modeBranches.reduce(
      (sum, branch) => sum + branch.proposalExplicitRejectCount,
      0,
    );
    const reopened = modeBranches.reduce(
      (sum, branch) => sum + branch.reopenedIdenticalProposalCount,
      0,
    );
    const legitimateReopened = modeBranches.reduce(
      (sum, branch) => sum + branch.legitimateReopenCount,
      0,
    );
    const responses = modeBranches.reduce(
      (sum, branch) => sum + branch.responseActionCount,
      0,
    );
    const feasibilityChanges = modeBranches.reduce(
      (sum, branch) => sum + branch.responseFeasibilityChanges,
      0,
    );
    const requestedStarted = modeBranches.reduce(
      (sum, branch) => sum + branch.requestedInterventionsStarted,
      0,
    );
    const requestedCompleted = modeBranches.reduce(
      (sum, branch) => sum + branch.requestedInterventionsCompleted,
      0,
    );
    lines.push(
      `${mode}: branches=${modeBranches.length} opened=${opened} accepted=${accepted} rejected=${rejected} responses=${responses} feasibilityChanges=${feasibilityChanges} requestedStart/complete=${requestedStarted}/${requestedCompleted} reopened=${reopened} legitimateReopened=${legitimateReopened}`,
    );
  }
  for (const transition of result.legitimateReopenBasisTransitions) {
    lines.push(`legitimate transition ${transition}`);
  }
  lines.push(`F05_FIX7 INSPECTION: ${result.pass ? "PASS" : "FAIL"}`);
  return lines.join("\n");
}

export function printF05Fix7InteractionIntegration(): void {
  console.log(
    formatF05Fix7InteractionIntegration(runF05Fix7InteractionIntegration()),
  );
}
