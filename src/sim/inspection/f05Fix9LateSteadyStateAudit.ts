import type { GameEvent, GameEventType } from "../events/event";
import { runSimulationStep } from "../core/tick";
import {
  asActionId,
  asGovernmentId,
  asInterventionCommitmentId,
  type CountryId,
  type FactionId,
  type InterventionId,
  type LandHexId,
} from "../state/ids";
import {
  createRespondPoliticalProposalActionProposal,
  type ActionProposal,
} from "../state/action";
import {
  deriveAdministrativeHeadroom,
  deriveCommittedAdministrativeLoad,
  evaluateInterventionFeasibility,
} from "../state/intervention";
import { createF05Fix7PoliticalInteractionScenario } from "../state/politicalInteractionFixture";
import type { Conflict } from "../state/conflict";
import type { PoliticalProposal } from "../state/politicalProposal";
import type { ScenarioDefinition } from "../state/scenario";
import type { TerritorialController } from "../state/region";
import type { WorldState } from "../state/world";
import { deriveNationalAgendas } from "../readModels/agenda";
import {
  chooseFactionActionType,
  deriveFactionDynamicsSnapshot,
  deriveFactionObservation,
} from "../systems/factionPressure";
import {
  derivePoliticalCrisisPrerequisites,
  type CrisisGate,
} from "../systems/politicalCrisis";
import {
  deriveActiveConflictFrontEdges,
  deriveConflictIntents,
  type TerritorialControlIntent,
} from "../systems/conflictResolution";
import { deriveOrderConsolidationEligibility } from "../systems/orderConsolidation";
import { deriveStateDissolutionEligibility } from "../systems/stateDissolution";
import { F04D_VALIDATION_INTERVENTION_IDS } from "../state/gate1fValidationFixture";
import {
  createF03StartingRecord,
  runF03StrategyFromRecord,
  type F03StrategyRunResult,
} from "./f03InterventionCounterfactuals";
import {
  F05_CONTEXTS,
  F05_PACING_EVENT_TYPES,
  F05_STRATEGY_IDS,
  type F05ContextDefinition,
  type F05PacingFunResult,
  type F05StrategyId,
} from "./f05PacingFunDecision";
import {
  runF05Fix7InteractionIntegration,
  type F05Fix7ProposalMode,
} from "./f05Fix7InteractionIntegration";
import { runF05Fix8ProposalLifecycleInspection } from "./f05Fix8ProposalLifecycle";

export const F05_FIX9_DEFAULT_SEED = 40103 as const;
export const F05_FIX9_HORIZON_DAYS = 1_800 as const;
export const F05_FIX9_LATE_SILENCE_THRESHOLD_DAYS = 720 as const;

const PROPOSAL_EVENT_TYPES = new Set<GameEventType>([
  "POLITICAL_PROPOSAL_OPENED",
  "POLITICAL_PROPOSAL_ACCEPTED",
  "POLITICAL_PROPOSAL_REJECTED",
  "POLITICAL_PROPOSAL_RESPONSE_REJECTED",
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

export type F05Fix9Classification =
  | "MEASUREMENT_ARTIFACT"
  | "EXISTING_CONSUMER_OR_WRITER_BUG"
  | "ACTIVE_CONFLICT_EQUILIBRIUM"
  | "OUTCOME_ELIGIBILITY_STALEMATE"
  | "INTERACTION_COVERAGE_EXHAUSTED"
  | "PLAYER_RESPONSE_SET_SATURATED"
  | "MIXED_CAUSE";

export type F05Fix9OverallClassification =
  | "LATE_STEADY_STATE_EXISTING_BUG_FOUND"
  | "LATE_STEADY_STATE_MODEL_EQUILIBRIUM"
  | "LATE_STEADY_STATE_INTERACTION_COVERAGE_EXHAUSTED"
  | "LATE_STEADY_STATE_OUTCOME_GAP"
  | "LATE_STEADY_STATE_MIXED_CAUSE"
  | "LATE_STEADY_STATE_MEASUREMENT_ARTIFACT";

export interface F05Fix9AgendaSnapshot {
  readonly id: string;
  readonly kind: string;
  readonly severity: number;
  readonly severityBand: string;
  readonly involvedFactionIds: readonly string[];
}

export interface F05Fix9FeasibilitySnapshot {
  readonly interventionId: string;
  readonly feasible: boolean;
  readonly reasons: readonly string[];
}

export interface F05Fix9FactionSnapshot {
  readonly factionId: string;
  readonly name: string;
  readonly grievance: number;
  readonly organization: number;
  readonly resources: number;
  readonly influence: number;
  readonly currentStrategy: string;
  readonly availableActions: Readonly<Record<string, boolean>>;
  readonly selectedAction: string;
  readonly grievanceTarget: number;
  readonly organizationTarget: number;
  readonly grievanceDelta: number;
  readonly organizationDelta: number;
}

export interface F05Fix9ConflictSnapshot {
  readonly conflictId: string;
  readonly kind: string;
  readonly status: string;
  readonly participantCountryIds: readonly string[];
  readonly participantFactionIds: readonly string[];
  readonly affectedRegionIds: readonly string[];
  readonly frontEdgeCount: number;
  readonly intent: F05Fix9IntentSnapshot | null;
  readonly noOpReason: string;
}

export interface F05Fix9IntentSnapshot {
  readonly reason: string;
  readonly actingController: string;
  readonly opposingController: string;
  readonly actingStrength: number;
  readonly opposingStrength: number;
  readonly targetHexId: string;
}

export interface F05Fix9ProposalSnapshot {
  readonly id: string;
  readonly demandKey: string;
  readonly status: string;
  readonly targetGovernmentId: string;
  readonly interventionId: string;
  readonly createdAtTick: number;
  readonly resolutionReason: string | null;
  readonly reconsiderationBasis: string | null;
}

export interface F05Fix9StateSnapshot {
  readonly relativeTick: number;
  readonly absoluteTick: number;
  readonly date: {
    readonly year: number;
    readonly month: number;
    readonly day: number;
  };
  readonly country: {
    readonly id: string;
    readonly treasury: number;
    readonly legitimacy: number;
    readonly stateCapacity: number;
    readonly militaryPower: number;
    readonly instability: number;
    readonly stateContinuity: number;
    readonly currentGovernmentId: string | null;
  };
  readonly institutions: Readonly<Record<string, string | boolean>>;
  readonly administrativeLoad: number;
  readonly administrativeHeadroom: number;
  readonly countryControlledLandHexIds: readonly string[];
  readonly factionControlledLandHexIds: Readonly<
    Record<string, readonly string[]>
  >;
  readonly factions: readonly F05Fix9FactionSnapshot[];
  readonly conflicts: readonly F05Fix9ConflictSnapshot[];
  readonly proposals: readonly F05Fix9ProposalSnapshot[];
  readonly feasibilities: readonly F05Fix9FeasibilitySnapshot[];
  readonly agendas: readonly F05Fix9AgendaSnapshot[];
  readonly agendaSignature: string;
  readonly crises: {
    readonly coups: readonly {
      readonly factionId: string;
      readonly eligible: boolean;
      readonly failedGates: readonly string[];
    }[];
    readonly rebellions: readonly {
      readonly factionId: string;
      readonly eligible: boolean;
      readonly failedGates: readonly string[];
    }[];
  };
  readonly consolidation: {
    readonly eligible: boolean;
    readonly failedCriteria: readonly string[];
    readonly consecutiveEligibleTicks: number;
  };
  readonly dissolution: {
    readonly dissolved: boolean;
    readonly satisfiedCriteria: readonly string[];
    readonly deferredCriteria: readonly string[];
  };
  readonly outcome: string;
}

interface F05Fix9Signal {
  readonly tick: number;
  readonly kind: "PACING_EVENT" | "AGENDA_CHANGE" | "DECISION_CHANGE";
  readonly detail: string;
}

interface F05Fix9LateInterval {
  readonly startTick: number;
  readonly endTick: number;
  readonly durationDays: number;
  readonly lastSignalTick: number;
}

interface F05Fix9BranchTrace {
  readonly run: F03StrategyRunResult;
  readonly snapshots: ReadonlyMap<number, F05Fix9StateSnapshot>;
  readonly worlds: ReadonlyMap<number, WorldState>;
  readonly eventsByTick: ReadonlyMap<number, readonly GameEvent[]>;
  readonly stateGroundedSignals: readonly F05Fix9Signal[];
  readonly proposalDecisionTicks: readonly number[];
  readonly agendaChangeTicks: readonly number[];
  readonly decisionChangeTicks: readonly number[];
  readonly completionTick: number | null;
  readonly proposalOpenedTick: number | null;
  readonly responseTick: number | null;
  readonly requestedStartTick: number | null;
  readonly requestedCompletionTick: number | null;
  readonly requestedRejectionCount: number;
  readonly proposalCount: number;
  readonly acceptedProposalCount: number;
  readonly explicitRejectCount: number;
  readonly responseRejectedCount: number;
  readonly lateInterval: F05Fix9LateInterval | null;
  readonly proposalDecisionLongestSilenceDays: number;
}

export interface F05Fix9ProbeResult {
  readonly input: string;
  readonly firstDownstreamConsumer: string;
  readonly changed: boolean;
  readonly realStateGroundedReassessment: boolean;
  readonly baseline: string;
  readonly perturbed: string;
  readonly emittedEvents: readonly string[];
  readonly conclusion: string;
}

export interface F05Fix9CausalGraph {
  readonly lastMeaningfulStateChange: string;
  readonly monthlyEvaluation: string;
  readonly weeklyEvaluation: string;
  readonly outcomeEvaluation: string;
  readonly agendaAndPlayerEvaluation: string;
  readonly freezeChain: readonly string[];
}

export interface F05Fix9BranchAudit {
  readonly mode: F05Fix7ProposalMode;
  readonly contextId: string;
  readonly contextFamily: F05ContextDefinition["family"];
  readonly strategyId: F05StrategyId;
  readonly checkpointTick: number;
  readonly executedTicks: number;
  readonly proposalOpenedTick: number | null;
  readonly responseTick: number | null;
  readonly requestedInterventionStartTick: number | null;
  readonly requestedInterventionCompletionTick: number | null;
  readonly completionTick: number | null;
  readonly lateInterval: F05Fix9LateInterval | null;
  readonly stateGroundedSignalTicks: readonly number[];
  readonly proposalDecisionLongestSilenceDays: number;
  readonly finalSnapshot: F05Fix9StateSnapshot;
  readonly classifications: readonly F05Fix9Classification[];
  readonly implementationGate: "NOT_MET" | "MET";
  readonly trace: F05Fix9BranchTrace;
}

export interface F05Fix9RepresentativeAudit {
  readonly label: "EARLY" | "NEAR_CRISIS" | "RECOVERY" | "ABSOLUTE_WORST";
  readonly branchKey: string;
  readonly completionSnapshot: F05Fix9StateSnapshot | null;
  readonly freezeStartSnapshot: F05Fix9StateSnapshot;
  readonly monthlyBoundarySnapshot: F05Fix9StateSnapshot | null;
  readonly weeklyConflictBoundarySnapshot: F05Fix9StateSnapshot | null;
  readonly finalSnapshot: F05Fix9StateSnapshot;
  readonly causalGraph: F05Fix9CausalGraph;
  readonly perturbationProbes: readonly F05Fix9ProbeResult[];
  readonly classifications: readonly F05Fix9Classification[];
}

export interface F05Fix9AuditResult {
  readonly scenarioId: string;
  readonly seed: number;
  readonly horizonDays: number;
  readonly historicalF05Baseline: F05PacingFunResult;
  readonly historicalF05BaselineUnchanged: boolean;
  readonly proposalBranchCount: number;
  readonly expectedProposalBranchCount: number;
  readonly allProposalBranchesPresent: boolean;
  readonly exactLateSilencePopulation: number;
  readonly lateSilenceBranches: readonly F05Fix9BranchAudit[];
  readonly branches: readonly F05Fix9BranchAudit[];
  readonly representatives: readonly F05Fix9RepresentativeAudit[];
  readonly postInterventionLateSilenceMaximumDays: number | null;
  readonly stateGroundedMaxReassessmentSilenceDays: number;
  readonly proposalDecisionMaxSilenceDays: number;
  readonly nonAcceptDivergences: number;
  readonly identicalReopenChurn: number;
  readonly legitimateReopens: number;
  readonly f05Fix8LifecyclePass: boolean;
  readonly primaryClassification: F05Fix9OverallClassification;
  readonly existingBugFound: "YES" | "NO";
  readonly interactionCoverageExhausted: "YES" | "NO" | "MIXED";
  readonly activeConflictEquilibrium: "YES" | "NO" | "MIXED";
  readonly outcomeGap: "YES" | "NO" | "MIXED";
  readonly playerResponseSetSaturated: "YES" | "NO" | "MIXED";
  readonly implementation: "NONE" | string;
  readonly historicalF05Regression: "UNCHANGED" | "CHANGED";
  readonly persistenceFormat: "V4_UNCHANGED";
  readonly readyForF05Promotion: "YES" | "NO";
  readonly gate1fRecommendation: "PASS" | "PASS_WITH_NOTES" | "NOT_READY";
  readonly v02: "NOT_STARTED";
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`)
    .join(",")}}`;
}

function payloadRecord(event: GameEvent): Readonly<Record<string, unknown>> {
  return typeof event.payload === "object" &&
    event.payload !== null &&
    !Array.isArray(event.payload)
    ? (event.payload as Readonly<Record<string, unknown>>)
    : {};
}

function payloadString(event: GameEvent, key: string): string | null {
  const value = payloadRecord(event)[key];
  return typeof value === "string" ? value : null;
}

function controllerLabel(controller: TerritorialController): string {
  switch (controller.kind) {
    case "country":
      return `country:${controller.countryId}`;
    case "faction":
      return `faction:${controller.factionId}`;
    case "uncontrolled":
      return "uncontrolled";
  }
}

function demandKey(
  proposal: Pick<
    PoliticalProposal,
    "proposerFactionId" | "countryId" | "subjectKind" | "interventionId"
  >,
): string {
  return [
    proposal.proposerFactionId,
    proposal.countryId,
    proposal.subjectKind,
    proposal.interventionId,
  ]
    .map(String)
    .join("|");
}

function failureClassLabel(value: unknown): string {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return String(value);
  const record = value as Record<string, unknown>;
  return typeof record.kind === "string" ? record.kind : stableJson(value);
}

function basisLabel(proposal: PoliticalProposal): string | null {
  const basis = proposal.reconsiderationBasis;
  if (basis === undefined) return null;
  return `${basis.targetGovernmentId}:${basis.feasible ? "feasible" : "blocked"}:${basis.failureClasses
    .map(failureClassLabel)
    .join(",")}`;
}

function maxSilence(ticks: readonly number[], executedTicks: number): number {
  const sorted = [...new Set([0, ...ticks, executedTicks])].sort(
    (first, second) => first - second,
  );
  let longest = 0;
  for (let index = 1; index < sorted.length; index += 1) {
    longest = Math.max(longest, sorted[index]! - sorted[index - 1]!);
  }
  return longest;
}

function interventionForStrategy(
  strategyId: F05StrategyId,
): InterventionId | null {
  return RESPONSE_INTERVENTIONS[strategyId];
}

function strategyPolicy(
  strategyId: F05StrategyId,
): (context: { readonly relativeTick: number }) => InterventionId | null {
  const interventionId = interventionForStrategy(strategyId);
  return ({ relativeTick: _relativeTick }) => {
    const relativeTick = _relativeTick;
    if (interventionId === null) return null;
    if (strategyId === F05_STRATEGY_IDS.repeatedAccommodation) {
      return relativeTick % 90 === 0 ? interventionId : null;
    }
    return relativeTick === 0 ? interventionId : null;
  };
}

function responseFeasibility(
  scenario: ScenarioDefinition,
  world: WorldState,
  interventionId: InterventionId,
  countryId: CountryId,
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
        `f05fix9-projection:${world.tick}:${primaryInterventionId}`,
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
      .flatMap((proposal): readonly ActionProposal[] => {
        if (mode === "PROPOSAL_REJECT") {
          return [
            createRespondPoliticalProposalActionProposal(
              world.tick + 1,
              proposal.id,
              "reject",
            ),
          ];
        }
        const countryId = scenario.playerCountryId;
        if (countryId === null) return [];
        const feasibility = responseFeasibility(
          scenario,
          world,
          proposal.interventionId,
          countryId,
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

function agendaSignature(
  scenario: ScenarioDefinition,
  world: WorldState,
  events: readonly GameEvent[],
): string {
  return (
    deriveNationalAgendas({ scenario, world, recentEvents: events })
      .map((agenda) => `${agenda.id}:${agenda.severityBand ?? "unknown"}`)
      .join(",") || "NONE"
  );
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

function responseAvailabilitySignature(
  scenario: ScenarioDefinition,
  world: WorldState,
): string {
  const countryId = scenario.playerCountryId;
  if (countryId === null) return "NONE";
  return [...new Set(Object.values(F04D_VALIDATION_INTERVENTION_IDS))]
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

function proposalFeasibilitySignature(
  scenario: ScenarioDefinition,
  world: WorldState,
): string {
  const countryId = scenario.playerCountryId;
  if (countryId === null) return "NONE";
  return Object.values(world.politicalProposals ?? {})
    .filter((proposal) => proposal.status === "open")
    .sort((first, second) => String(first.id).localeCompare(String(second.id)))
    .map((proposal) => {
      const feasibility = evaluateInterventionFeasibility({
        scenario,
        world,
        interventionId: proposal.interventionId,
        countryId: proposal.countryId,
      });
      return `${proposal.id}:${feasibility.feasible ? "feasible" : "blocked"}:${feasibility.reasons.map((reason) => reason.kind).join(",")}`;
    })
    .join("|");
}

function snapshotIntent(
  intent: TerritorialControlIntent,
): F05Fix9IntentSnapshot {
  return {
    reason: intent.reason,
    actingController: controllerLabel(intent.actingController),
    opposingController: controllerLabel(intent.opposingController),
    actingStrength: intent.actingStrength.strength,
    opposingStrength: intent.opposingStrength.strength,
    targetHexId: String(intent.targetHexId),
  };
}

function conflictNoOpReason(
  scenario: ScenarioDefinition,
  world: WorldState,
  conflict: Conflict,
  frontEdgeCount: number,
  intent: TerritorialControlIntent | undefined,
): string {
  if (intent !== undefined) return "INTENT_READY";
  if (conflict.kind === "coup") return "COUP_HAS_NO_TERRITORIAL_WRITER";
  if (frontEdgeCount === 0) return "NO_ACTIVE_FRONT_EDGE";
  const derived = deriveConflictIntents(scenario, world).some(
    (candidate) => candidate.conflictId === conflict.id,
  );
  return derived
    ? "INTENT_SUPPRESSED_AFTER_DERIVATION"
    : "ADVANTAGE_MARGIN_OR_TARGET_GUARD";
}

function crisisGateFailures(gates: readonly CrisisGate[]): readonly string[] {
  return gates
    .filter((gate) => gate.status === "fail")
    .map((gate) => `${gate.id}:${gate.reason}`);
}

function makeStateSnapshot(
  scenario: ScenarioDefinition,
  world: WorldState,
  relativeTick: number,
  recentEvents: readonly GameEvent[],
): F05Fix9StateSnapshot {
  const countryId = scenario.playerCountryId;
  if (countryId === null)
    throw new Error("F05_FIX9 requires a player country.");
  const country = world.countries[countryId];
  if (country === undefined)
    throw new Error(`Missing player country ${countryId}.`);
  const policy = world.policies[countryId];
  const agendas = deriveNationalAgendas({ scenario, world, recentEvents });
  const crisis = derivePoliticalCrisisPrerequisites(scenario, world);
  const consolidation = deriveOrderConsolidationEligibility(scenario, world);
  const dissolution = deriveStateDissolutionEligibility(scenario, world);
  const factions = Object.values(world.factions)
    .filter((faction) => faction.countryId === countryId)
    .sort((first, second) => String(first.id).localeCompare(String(second.id)))
    .map((faction): F05Fix9FactionSnapshot => {
      const observation = deriveFactionObservation(world, faction.id, scenario);
      const dynamics = deriveFactionDynamicsSnapshot(
        world,
        faction.id,
        scenario,
      );
      return {
        factionId: String(faction.id),
        name: faction.name,
        grievance: faction.grievance,
        organization: faction.organization,
        resources: faction.resources,
        influence: faction.influence,
        currentStrategy: faction.currentStrategy,
        availableActions: observation.availableActions,
        selectedAction: chooseFactionActionType(observation),
        grievanceTarget: dynamics.grievanceTarget,
        organizationTarget: dynamics.organizationTarget,
        grievanceDelta: dynamics.grievanceDelta,
        organizationDelta: dynamics.organizationDelta,
      };
    });
  const intents = deriveConflictIntents(scenario, world);
  const conflicts = Object.values(world.conflicts)
    .sort((first, second) => String(first.id).localeCompare(String(second.id)))
    .map((conflict): F05Fix9ConflictSnapshot => {
      const edges =
        conflict.status === "active"
          ? deriveActiveConflictFrontEdges(scenario, world).filter(
              (edge) => edge.conflictId === conflict.id,
            )
          : [];
      const intent = intents.find(
        (candidate) => candidate.conflictId === conflict.id,
      );
      return {
        conflictId: String(conflict.id),
        kind: conflict.kind,
        status: conflict.status,
        participantCountryIds: conflict.participantCountryIds.map(String),
        participantFactionIds: conflict.participantFactionIds.map(String),
        affectedRegionIds: (conflict.affectedRegionIds ?? []).map(String),
        frontEdgeCount: edges.length,
        intent: intent === undefined ? null : snapshotIntent(intent),
        noOpReason: conflictNoOpReason(
          scenario,
          world,
          conflict,
          edges.length,
          intent,
        ),
      };
    });
  const countryControlledLandHexIds = Object.entries(world.landHexStates)
    .filter(
      ([, state]) =>
        state.controller.kind === "country" &&
        state.controller.countryId === countryId,
    )
    .map(([landHexId]) => landHexId)
    .sort();
  const factionControlledLandHexIds = Object.fromEntries(
    factions.map((faction) => [
      faction.factionId,
      Object.entries(world.landHexStates)
        .filter(
          ([, state]) =>
            state.controller.kind === "faction" &&
            state.controller.factionId === faction.factionId,
        )
        .map(([landHexId]) => landHexId)
        .sort(),
    ]),
  );
  const proposals = Object.values(world.politicalProposals ?? {})
    .sort((first, second) => String(first.id).localeCompare(String(second.id)))
    .map((proposal): F05Fix9ProposalSnapshot => ({
      id: String(proposal.id),
      demandKey: demandKey(proposal),
      status: proposal.status,
      targetGovernmentId: String(proposal.targetGovernmentId),
      interventionId: String(proposal.interventionId),
      createdAtTick: proposal.createdAtTick,
      resolutionReason: proposal.resolutionReason ?? null,
      reconsiderationBasis: basisLabel(proposal),
    }));
  const interventionIds = [
    ...new Set([
      ...Object.values(F04D_VALIDATION_INTERVENTION_IDS),
      ...proposals.map((proposal) => proposal.interventionId as InterventionId),
    ]),
  ].sort();
  const feasibilities = interventionIds.map(
    (interventionId): F05Fix9FeasibilitySnapshot => {
      const result = evaluateInterventionFeasibility({
        scenario,
        world,
        interventionId: interventionId as InterventionId,
        countryId,
      });
      return {
        interventionId,
        feasible: result.feasible,
        reasons: result.reasons.map((reason) => reason.kind),
      };
    },
  );
  return {
    relativeTick,
    absoluteTick: world.tick,
    date: { ...world.date },
    country: {
      id: String(country.id),
      treasury: country.treasury,
      legitimacy: country.legitimacy,
      stateCapacity: country.stateCapacity,
      militaryPower: country.militaryPower,
      instability: country.instability,
      stateContinuity: country.stateContinuity,
      currentGovernmentId:
        country.currentGovernmentId === null
          ? null
          : String(country.currentGovernmentId),
    },
    institutions: policy === undefined ? {} : { ...policy.institutionalRules },
    administrativeLoad: deriveCommittedAdministrativeLoad(world, countryId),
    administrativeHeadroom: deriveAdministrativeHeadroom(world, countryId),
    countryControlledLandHexIds,
    factionControlledLandHexIds,
    factions,
    conflicts,
    proposals,
    feasibilities,
    agendas: agendas.map((agenda): F05Fix9AgendaSnapshot => ({
      id: agenda.id,
      kind: agenda.kind,
      severity: agenda.severity,
      severityBand: agenda.severityBand ?? "unknown",
      involvedFactionIds: agenda.involvedFactionIds.map(String),
    })),
    agendaSignature:
      agendas
        .map((agenda) => `${agenda.id}:${agenda.severityBand ?? "unknown"}`)
        .join(",") || "NONE",
    crises: {
      coups: crisis.coups.map((candidate) => ({
        factionId: String(candidate.factionId),
        eligible: candidate.eligible,
        failedGates: crisisGateFailures(candidate.gates),
      })),
      rebellions: crisis.rebellions.map((candidate) => ({
        factionId: String(candidate.factionId),
        eligible: candidate.eligible,
        failedGates: crisisGateFailures(candidate.gates),
      })),
    },
    consolidation: {
      eligible: consolidation.eligible,
      failedCriteria: consolidation.failedCriteria,
      consecutiveEligibleTicks:
        world.run.consolidation.consecutiveEligibleTicks,
    },
    dissolution: {
      dissolved: dissolution.dissolved,
      satisfiedCriteria: dissolution.satisfiedCriteria,
      deferredCriteria: dissolution.deferredCriteria,
    },
    outcome:
      world.run.outcome.status === "active" ? "active" : world.run.outcome.kind,
  };
}

function pacingTicks(
  events: readonly GameEvent[],
  startTick: number,
): readonly number[] {
  return events
    .filter((event) => F05_PACING_EVENT_TYPES.has(event.type))
    .map((event) => event.tick - startTick);
}

function clusterPacingSignals(
  events: readonly GameEvent[],
  startTick: number,
): readonly F05Fix9Signal[] {
  const ordered = events
    .filter((event) => F05_PACING_EVENT_TYPES.has(event.type))
    .sort(
      (first, second) =>
        first.tick - second.tick || first.sequence - second.sequence,
    );
  const clusters: { start: number; end: number; types: Set<GameEventType> }[] =
    [];
  for (const event of ordered) {
    const tick = event.tick - startTick;
    const previous = clusters.at(-1);
    if (previous === undefined || tick - previous.end > 30) {
      clusters.push({ start: tick, end: tick, types: new Set([event.type]) });
    } else {
      previous.end = tick;
      previous.types.add(event.type);
    }
  }
  return clusters.map((cluster) => ({
    tick: cluster.end,
    kind: "PACING_EVENT",
    detail: `${cluster.start}-${cluster.end}:${[...cluster.types].sort().join(",")}`,
  }));
}

function proposalTelemetry(
  run: F03StrategyRunResult,
  startTick: number,
): {
  readonly completionTick: number | null;
  readonly proposalOpenedTick: number | null;
  readonly responseTick: number | null;
  readonly requestedStartTick: number | null;
  readonly requestedCompletionTick: number | null;
  readonly requestedRejectionCount: number;
  readonly proposalCount: number;
  readonly acceptedProposalCount: number;
  readonly explicitRejectCount: number;
  readonly responseRejectedCount: number;
} {
  const events = run.stepEvents;
  const responseActionIds = new Set(
    run.finalRecord.world.run.actionLog
      .filter((action) => action.actionType === "RESPOND_POLITICAL_PROPOSAL")
      .map((action) => String(action.id)),
  );
  const responseActionTicks = run.finalRecord.world.run.actionLog
    .filter((action) => action.actionType === "RESPOND_POLITICAL_PROPOSAL")
    .map((action) => action.tick - startTick);
  const opened = events.filter(
    (event) => event.type === "POLITICAL_PROPOSAL_OPENED",
  );
  const accepted = events.filter(
    (event) => event.type === "POLITICAL_PROPOSAL_ACCEPTED",
  );
  const explicitRejected = events.filter(
    (event) =>
      event.type === "POLITICAL_PROPOSAL_REJECTED" &&
      payloadString(event, "reason") === "explicitReject",
  );
  const responseRejected = events.filter(
    (event) => event.type === "POLITICAL_PROPOSAL_RESPONSE_REJECTED",
  );
  const starts = events.filter(
    (event) =>
      event.type === "INTERVENTION_STARTED" &&
      responseActionIds.has(payloadString(event, "actionId") ?? ""),
  );
  const completions = events.filter(
    (event) =>
      event.type === "INTERVENTION_COMPLETED" &&
      responseActionIds.has(payloadString(event, "sourceActionId") ?? ""),
  );
  const rejected = events.filter(
    (event) =>
      event.type === "INTERVENTION_REJECTED" &&
      responseActionIds.has(payloadString(event, "actionId") ?? ""),
  );
  const allProposalTicks = events
    .filter((event) => PROPOSAL_EVENT_TYPES.has(event.type))
    .map((event) => event.tick - startTick);
  const completionTick =
    completions.length === 0
      ? null
      : Math.min(...completions.map((event) => event.tick - startTick));
  return {
    completionTick,
    proposalOpenedTick:
      opened.length === 0
        ? null
        : Math.min(...opened.map((event) => event.tick - startTick)),
    responseTick:
      allProposalTicks.length === 0 && responseActionTicks.length === 0
        ? null
        : Math.max(...allProposalTicks.concat(responseActionTicks)),
    requestedStartTick:
      starts.length === 0
        ? null
        : Math.min(...starts.map((event) => event.tick - startTick)),
    requestedCompletionTick:
      completions.length === 0
        ? null
        : Math.min(...completions.map((event) => event.tick - startTick)),
    requestedRejectionCount:
      rejected.length +
      responseRejected.filter((event) =>
        ["notFeasible", "staleTargetGovernment"].includes(
          payloadString(event, "reason") ?? "",
        ),
      ).length,
    proposalCount: opened.length,
    acceptedProposalCount: accepted.length,
    explicitRejectCount: explicitRejected.length,
    responseRejectedCount: responseRejected.length,
  };
}

function lateIntervals(
  completionTick: number | null,
  signals: readonly F05Fix9Signal[],
  executedTicks: number,
): readonly F05Fix9LateInterval[] {
  if (completionTick === null) return [];
  const signalTicks = [
    ...new Set(
      signals
        .map((signal) => signal.tick)
        .filter((tick) => tick > completionTick),
    ),
  ].sort((first, second) => first - second);
  const points = [completionTick, ...signalTicks, executedTicks];
  const intervals: F05Fix9LateInterval[] = [];
  for (let index = 1; index < points.length; index += 1) {
    const startTick = points[index - 1]!;
    const endTick = points[index]!;
    intervals.push({
      startTick,
      endTick,
      durationDays: endTick - startTick,
      lastSignalTick: startTick,
    });
  }
  return intervals;
}

function runDetailedBranch(
  scenario: ScenarioDefinition,
  context: F05ContextDefinition,
  strategyId: F05StrategyId,
  mode: F05Fix7ProposalMode,
  seed: number,
): F05Fix9BranchTrace {
  const snapshots = new Map<number, F05Fix9StateSnapshot>();
  const worlds = new Map<number, WorldState>();
  const eventsByTick = new Map<number, readonly GameEvent[]>();
  const pacingTickList: number[] = [];
  const proposalDecisionTicks: number[] = [];
  const agendaChangeTicks: number[] = [];
  const decisionChangeTicks: number[] = [];
  const agendaSamples: { readonly tick: number; readonly signature: string }[] =
    [];
  const decisionSamples: {
    readonly tick: number;
    readonly signature: string;
  }[] = [];
  const proposalSignatures: string[] = [];
  let previousAgenda: string | null = null;
  let previousDecision: string | null = null;
  const startingRecord = createF03StartingRecord(
    scenario,
    seed,
    context.checkpointTick,
  );
  const run = runF03StrategyFromRecord(
    scenario,
    context.id,
    `F05_FIX9:${mode}:${strategyId}`,
    startingRecord,
    5,
    strategyPolicy(strategyId),
    {
      factionActorLoop: "on",
      additionalActionPolicy: responsePolicy(mode),
      onObservation: ({ relativeTick, world, events }) => {
        pacingTickList.push(...pacingTicks(events, startingRecord.world.tick));
        const open = proposalOpenSignature(world);
        const feasibility = proposalFeasibilitySignature(scenario, world);
        const combined = `${open}@@${feasibility}`;
        if (
          relativeTick === 0 ||
          open !== (proposalSignatures.at(-1)?.split("@@")[0] ?? "")
        )
          proposalDecisionTicks.push(relativeTick);
        if (
          proposalSignatures.length > 0 &&
          combined !== proposalSignatures.at(-1)
        )
          proposalDecisionTicks.push(relativeTick);
        proposalSignatures.push(combined);
        if (relativeTick % 30 === 0) {
          const signature = agendaSignature(scenario, world, events);
          agendaSamples.push({ tick: relativeTick, signature });
          if (previousAgenda !== null && previousAgenda !== signature)
            agendaChangeTicks.push(relativeTick);
          previousAgenda = signature;
        }
        if (relativeTick % 90 === 0) {
          const signature = responseAvailabilitySignature(scenario, world);
          decisionSamples.push({ tick: relativeTick, signature });
          if (previousDecision !== null && previousDecision !== signature)
            decisionChangeTicks.push(relativeTick);
          previousDecision = signature;
        }
        const keep =
          relativeTick === 0 ||
          relativeTick % 30 === 0 ||
          (relativeTick % 7 === 0 &&
            Object.values(world.conflicts).some(
              (conflict) => conflict.status === "active",
            )) ||
          events.some(
            (event) =>
              F05_PACING_EVENT_TYPES.has(event.type) ||
              PROPOSAL_EVENT_TYPES.has(event.type),
          );
        if (keep) {
          snapshots.set(
            relativeTick,
            makeStateSnapshot(scenario, world, relativeTick, events),
          );
          worlds.set(relativeTick, world);
          eventsByTick.set(relativeTick, events);
        }
      },
    },
  );
  const telemetry = proposalTelemetry(run, run.checkpointTick);
  const allSignals = [
    ...clusterPacingSignals(run.stepEvents, run.checkpointTick),
    ...agendaChangeTicks.map((tick) => ({
      tick,
      kind: "AGENDA_CHANGE" as const,
      detail: "Agenda signature changed",
    })),
    ...decisionChangeTicks.map((tick) => ({
      tick,
      kind: "DECISION_CHANGE" as const,
      detail: "feasible response set changed",
    })),
  ].sort(
    (first, second) =>
      first.tick - second.tick || first.kind.localeCompare(second.kind),
  );
  const intervals = lateIntervals(
    telemetry.completionTick,
    allSignals,
    run.executedTicks,
  );
  const lateInterval =
    [...intervals].sort(
      (first, second) =>
        second.durationDays - first.durationDays ||
        first.startTick - second.startTick,
    )[0] ?? null;
  return {
    run,
    snapshots,
    worlds,
    eventsByTick,
    stateGroundedSignals: allSignals,
    proposalDecisionTicks: [...new Set(proposalDecisionTicks)].sort(
      (first, second) => first - second,
    ),
    agendaChangeTicks,
    decisionChangeTicks,
    completionTick: telemetry.completionTick,
    proposalOpenedTick: telemetry.proposalOpenedTick,
    responseTick: telemetry.responseTick,
    requestedStartTick: telemetry.requestedStartTick,
    requestedCompletionTick: telemetry.requestedCompletionTick,
    requestedRejectionCount: telemetry.requestedRejectionCount,
    proposalCount: telemetry.proposalCount,
    acceptedProposalCount: telemetry.acceptedProposalCount,
    explicitRejectCount: telemetry.explicitRejectCount,
    responseRejectedCount: telemetry.responseRejectedCount,
    lateInterval,
    proposalDecisionLongestSilenceDays: maxSilence(
      proposalDecisionTicks,
      run.executedTicks,
    ),
  };
}

function branchKey(
  mode: F05Fix7ProposalMode,
  contextId: string,
  strategyId: F05StrategyId,
): string {
  return `${mode}:${contextId}:${strategyId}`;
}

function snapshotAt(
  trace: F05Fix9BranchTrace,
  tick: number | null,
): F05Fix9StateSnapshot | null {
  return tick === null ? null : (trace.snapshots.get(tick) ?? null);
}

function requiredSnapshot(
  trace: F05Fix9BranchTrace,
  tick: number,
  label: string,
): F05Fix9StateSnapshot {
  const snapshot = trace.snapshots.get(tick);
  if (snapshot === undefined)
    throw new Error(`F05_FIX9 missing ${label} snapshot at ${tick}.`);
  return snapshot;
}

function conflictSummary(snapshot: F05Fix9StateSnapshot | null): string {
  if (snapshot === null) return "none";
  return (
    snapshot.conflicts
      .filter((conflict) => conflict.status === "active")
      .map(
        (conflict) =>
          `${conflict.kind}:${conflict.conflictId}:${conflict.frontEdgeCount}front:${conflict.intent === null ? conflict.noOpReason : `${conflict.intent.reason}:${conflict.intent.actingStrength.toFixed(2)}>${conflict.intent.opposingStrength.toFixed(2)}`}`,
      )
      .join("; ") || "none"
  );
}

function factionSummary(snapshot: F05Fix9StateSnapshot): string {
  return (
    snapshot.factions
      .map(
        (faction) =>
          `${faction.factionId} G=${faction.grievance.toFixed(3)} O=${faction.organization.toFixed(3)} R=${faction.resources.toFixed(3)} I=${faction.influence.toFixed(3)} strategy=${faction.currentStrategy} choose=${faction.selectedAction} ΔG=${faction.grievanceDelta.toFixed(3)} ΔO=${faction.organizationDelta.toFixed(3)}`,
      )
      .join("; ") || "none"
  );
}

function outcomeSummary(snapshot: F05Fix9StateSnapshot): string {
  return `consolidation=${snapshot.consolidation.eligible ? "eligible" : `blocked:${snapshot.consolidation.failedCriteria.join(",") || "none"}`} dissolution=${snapshot.dissolution.dissolved ? "eligible" : `not-dissolved:${snapshot.dissolution.satisfiedCriteria.join(",") || "none"};deferred=${snapshot.dissolution.deferredCriteria.join(",") || "none"}`}`;
}

function runProbeStep(
  scenario: ScenarioDefinition,
  world: WorldState,
): readonly string[] {
  try {
    return runSimulationStep(
      world,
      { actions: [] },
      {},
      scenario,
    ).emittedEvents.map((event) => event.type);
  } catch (error) {
    return [
      `PROBE_ERROR:${error instanceof Error ? error.message : String(error)}`,
    ];
  }
}

function intentSummary(
  scenario: ScenarioDefinition,
  world: WorldState,
): string {
  const intents = deriveConflictIntents(scenario, world);
  return (
    intents
      .map(
        (intent) =>
          `${intent.conflictId}:${intent.reason}:${controllerLabel(intent.actingController)}>${controllerLabel(intent.opposingController)}:${intent.actingStrength.strength.toFixed(2)}>${intent.opposingStrength.strength.toFixed(2)}:${intent.targetHexId}`,
      )
      .join(";") || "none"
  );
}

function firstPlayerFaction(
  world: WorldState,
  countryId: CountryId,
): FactionId | null {
  return (
    Object.values(world.factions)
      .filter((faction) => faction.countryId === countryId)
      .sort((first, second) =>
        String(first.id).localeCompare(String(second.id)),
      )[0]?.id ?? null
  );
}

function factionProbe(
  scenario: ScenarioDefinition,
  world: WorldState,
  field: "organization" | "resources",
): F05Fix9ProbeResult {
  const countryId = scenario.playerCountryId!;
  const factionId =
    Object.values(world.conflicts).find(
      (conflict) =>
        conflict.status === "active" &&
        conflict.participantFactionIds[0] !== undefined,
    )?.participantFactionIds[0] ?? firstPlayerFaction(world, countryId);
  if (factionId === null)
    return {
      input: `faction.${field}=1`,
      firstDownstreamConsumer: "T016/T021",
      changed: false,
      realStateGroundedReassessment: false,
      baseline: "no relevant faction",
      perturbed: "no relevant faction",
      emittedEvents: [],
      conclusion: "No relevant faction exists in the freeze state.",
    };
  const faction = world.factions[factionId];
  if (faction === undefined)
    throw new Error(`Missing probe faction ${factionId}.`);
  const baseline = intentSummary(scenario, world);
  const perturbedWorld: WorldState = {
    ...world,
    factions: { ...world.factions, [factionId]: { ...faction, [field]: 1 } },
  };
  const perturbed = intentSummary(scenario, perturbedWorld);
  const emittedEvents = runProbeStep(scenario, perturbedWorld);
  const changed = baseline !== perturbed;
  return {
    input: `faction.${field}=${faction[field].toFixed(3)} -> 1.000`,
    firstDownstreamConsumer: "T021 deriveConflictIntents / T016 F04A dynamics",
    changed,
    realStateGroundedReassessment:
      changed ||
      emittedEvents.some(
        (type) =>
          type === "LAND_HEX_CONTROL_CHANGED" || type === "REBELLION_STARTED",
      ),
    baseline,
    perturbed,
    emittedEvents,
    conclusion: changed
      ? "Existing operational-strength consumer reacts; the original freeze is an equilibrium/limiter, not an omitted writer."
      : "Existing consumer remains inert for this single input at the freeze state.",
  };
}

function feasibilityProbe(
  scenario: ScenarioDefinition,
  world: WorldState,
  interventionId: InterventionId,
): readonly F05Fix9ProbeResult[] {
  const countryId = scenario.playerCountryId!;
  const country = world.countries[countryId];
  const definition = scenario.interventionCatalog[interventionId];
  if (country === undefined || definition === undefined) return [];
  const baseline = evaluateInterventionFeasibility({
    scenario,
    world,
    interventionId,
    countryId,
  });
  const treasuryWorld: WorldState = {
    ...world,
    countries: {
      ...world.countries,
      [countryId]: {
        ...country,
        treasury: Math.max(country.treasury, definition.treasuryCost + 1),
      },
    },
  };
  const treasury = evaluateInterventionFeasibility({
    scenario,
    world: treasuryWorld,
    interventionId,
    countryId,
  });
  const headroomWorld: WorldState = {
    ...world,
    countries: {
      ...world.countries,
      [countryId]: {
        ...country,
        stateCapacity: Math.max(
          country.stateCapacity,
          deriveCommittedAdministrativeLoad(world, countryId) +
            definition.administrativeLoad +
            1,
        ),
      },
    },
  };
  const headroom = evaluateInterventionFeasibility({
    scenario,
    world: headroomWorld,
    interventionId,
    countryId,
  });
  return [
    {
      input: `country.treasury -> ${treasuryWorld.countries[countryId]!.treasury.toFixed(0)}`,
      firstDownstreamConsumer:
        "T016B evaluateInterventionFeasibility / proposal response guard",
      changed:
        baseline.feasible !== treasury.feasible ||
        stableJson(baseline.reasons.map((reason) => reason.kind)) !==
          stableJson(treasury.reasons.map((reason) => reason.kind)),
      realStateGroundedReassessment: baseline.feasible !== treasury.feasible,
      baseline: `${baseline.feasible ? "feasible" : "blocked"}:${baseline.reasons.map((reason) => reason.kind).join(",") || "none"}`,
      perturbed: `${treasury.feasible ? "feasible" : "blocked"}:${treasury.reasons.map((reason) => reason.kind).join(",") || "none"}`,
      emittedEvents: [],
      conclusion:
        baseline.feasible !== treasury.feasible
          ? "Treasury is an existing feasibility input; no missing consumer was found."
          : "Treasury perturbation did not cross the existing feasibility guard.",
    },
    {
      input: `country.stateCapacity -> ${headroomWorld.countries[countryId]!.stateCapacity.toFixed(0)}`,
      firstDownstreamConsumer:
        "T016B deriveAdministrativeHeadroom / proposal response guard",
      changed:
        baseline.feasible !== headroom.feasible ||
        stableJson(baseline.reasons.map((reason) => reason.kind)) !==
          stableJson(headroom.reasons.map((reason) => reason.kind)),
      realStateGroundedReassessment: baseline.feasible !== headroom.feasible,
      baseline: `${baseline.feasible ? "feasible" : "blocked"}:${baseline.reasons.map((reason) => reason.kind).join(",") || "none"}`,
      perturbed: `${headroom.feasible ? "feasible" : "blocked"}:${headroom.reasons.map((reason) => reason.kind).join(",") || "none"}`,
      emittedEvents: [],
      conclusion:
        baseline.feasible !== headroom.feasible
          ? "Administrative headroom is an existing feasibility input; no missing consumer was found."
          : "Administrative headroom perturbation did not cross the existing feasibility guard.",
    },
  ];
}

function institutionProbe(
  scenario: ScenarioDefinition,
  world: WorldState,
): F05Fix9ProbeResult {
  const countryId = scenario.playerCountryId!;
  const policy = world.policies[countryId];
  const factionId = firstPlayerFaction(world, countryId);
  if (policy === undefined || factionId === null)
    return {
      input: "institutionalRules.politicalCompetition",
      firstDownstreamConsumer: "T016 faction action legality",
      changed: false,
      realStateGroundedReassessment: false,
      baseline: "not applicable",
      perturbed: "not applicable",
      emittedEvents: [],
      conclusion: "No applicable policy/faction.",
    };
  const baselineObservation = deriveFactionObservation(
    world,
    factionId,
    scenario,
  );
  const nextCompetition =
    policy.institutionalRules.politicalCompetition === "plural"
      ? "banned"
      : "plural";
  const perturbedWorld: WorldState = {
    ...world,
    policies: {
      ...world.policies,
      [countryId]: {
        ...policy,
        institutionalRules: {
          ...policy.institutionalRules,
          politicalCompetition: nextCompetition,
        },
      },
    },
  };
  const perturbedObservation = deriveFactionObservation(
    perturbedWorld,
    factionId,
    scenario,
  );
  const baseline = `${chooseFactionActionType(baselineObservation)}:${Object.entries(
    baselineObservation.availableActions,
  )
    .filter(([, enabled]) => enabled)
    .map(([action]) => action)
    .join(",")}`;
  const perturbed = `${chooseFactionActionType(perturbedObservation)}:${Object.entries(
    perturbedObservation.availableActions,
  )
    .filter(([, enabled]) => enabled)
    .map(([action]) => action)
    .join(",")}`;
  const changed = baseline !== perturbed;
  return {
    input: `institutionalRules.politicalCompetition -> ${nextCompetition}`,
    firstDownstreamConsumer:
      "T016 faction action legality / BARGAIN availability",
    changed,
    realStateGroundedReassessment: changed,
    baseline,
    perturbed,
    emittedEvents: [],
    conclusion: changed
      ? "The existing institutional legality consumer responds; this is not a missing writer."
      : "The rule change did not alter the current heuristic action set.",
  };
}

function governmentProbe(
  scenario: ScenarioDefinition,
  world: WorldState,
): F05Fix9ProbeResult {
  const countryId = scenario.playerCountryId!;
  const country = world.countries[countryId];
  const currentGovernmentId = country?.currentGovernmentId;
  if (currentGovernmentId === null || currentGovernmentId === undefined)
    return {
      input: "currentGovernmentId -> replacement",
      firstDownstreamConsumer: "proposal lifecycle target guard",
      changed: false,
      realStateGroundedReassessment: false,
      baseline: "no current Government",
      perturbed: "no current Government",
      emittedEvents: [],
      conclusion: "No Government target is available in the freeze state.",
    };
  const replacementId = asGovernmentId(
    `f05.fix9.probe.government:${world.tick}`,
  );
  const currentGovernment = world.governments[currentGovernmentId];
  if (currentGovernment === undefined)
    throw new Error(`Missing Government ${currentGovernmentId}.`);
  const perturbedWorld: WorldState = {
    ...world,
    governments: {
      ...world.governments,
      [replacementId]: {
        ...currentGovernment,
        id: replacementId,
        formedAtTick: world.tick,
      },
    },
    countries: {
      ...world.countries,
      [countryId]: { ...country, currentGovernmentId: replacementId },
    },
  };
  const baseline =
    Object.values(world.politicalProposals ?? {})
      .map((proposal) => `${proposal.id}:${proposal.targetGovernmentId}`)
      .join(",") || "no proposals";
  const perturbed =
    Object.values(perturbedWorld.politicalProposals ?? {})
      .map((proposal) => `${proposal.id}:${proposal.targetGovernmentId}`)
      .join(",") || "no proposals";
  return {
    input: `currentGovernmentId ${currentGovernmentId} -> ${replacementId}`,
    firstDownstreamConsumer:
      "political proposal lifecycle target/reconsideration guard",
    changed: baseline !== perturbed,
    realStateGroundedReassessment: false,
    baseline,
    perturbed,
    emittedEvents: [],
    conclusion:
      "Government identity changes the authored lifecycle basis only when a later LOBBY/response consumer runs; no automatic retargeting writer exists.",
  };
}

function landHexProbe(
  scenario: ScenarioDefinition,
  world: WorldState,
): F05Fix9ProbeResult {
  const activeConflict = Object.values(world.conflicts).find(
    (conflict) => conflict.status === "active" && conflict.kind !== "coup",
  );
  if (activeConflict === undefined)
    return {
      input: "one existing LandHex controller",
      firstDownstreamConsumer: "T021 deriveConflictIntents",
      changed: false,
      realStateGroundedReassessment: false,
      baseline: "no armed conflict",
      perturbed: "no armed conflict",
      emittedEvents: [],
      conclusion:
        "No applicable active armed conflict exists at this freeze point.",
    };
  const edges = deriveActiveConflictFrontEdges(scenario, world).filter(
    (edge) => edge.conflictId === activeConflict.id,
  );
  const edge = edges[0];
  if (edge === undefined)
    return {
      input: "one existing LandHex controller",
      firstDownstreamConsumer: "T021 deriveConflictIntents",
      changed: false,
      realStateGroundedReassessment: false,
      baseline: "no front edge",
      perturbed: "no front edge",
      emittedEvents: [],
      conclusion:
        "The existing conflict has no physical front edge, so no territorial writer has an eligible target.",
    };
  const targetHexId = edge.secondLandHexId as LandHexId;
  const targetState = world.landHexStates[targetHexId];
  if (targetState === undefined)
    throw new Error(`Missing LandHex ${targetHexId}.`);
  const replacement: TerritorialController =
    targetState.controller.kind === "faction"
      ? { kind: "country", countryId: activeConflict.participantCountryIds[0]! }
      : activeConflict.participantFactionIds[0] === undefined
        ? { kind: "uncontrolled" }
        : {
            kind: "faction",
            factionId: activeConflict.participantFactionIds[0],
          };
  const perturbedWorld: WorldState = {
    ...world,
    landHexStates: {
      ...world.landHexStates,
      [targetHexId]: { ...targetState, controller: replacement },
    },
  };
  const baseline = intentSummary(scenario, world);
  const perturbed = intentSummary(scenario, perturbedWorld);
  const emittedEvents = runProbeStep(scenario, perturbedWorld);
  const changed = baseline !== perturbed;
  return {
    input: `landHexStates.${targetHexId}.controller -> ${controllerLabel(replacement)}`,
    firstDownstreamConsumer:
      "T021 deriveConflictIntents / LandHex controller writer",
    changed,
    realStateGroundedReassessment:
      changed || emittedEvents.includes("LAND_HEX_CONTROL_CHANGED"),
    baseline,
    perturbed,
    emittedEvents,
    conclusion: changed
      ? "Physical adjacency/controller input is consumed by the existing conflict writer; the original freeze is not an omitted LandHex consumer."
      : "The controller perturbation did not produce a different existing intent.",
  };
}

function freezeGraph(
  trace: F05Fix9BranchTrace,
  freezeStart: F05Fix9StateSnapshot,
  monthly: F05Fix9StateSnapshot | null,
  weekly: F05Fix9StateSnapshot | null,
  final: F05Fix9StateSnapshot,
): F05Fix9CausalGraph {
  const lastEvent = trace.run.stepEvents
    .filter(
      (event) =>
        F05_PACING_EVENT_TYPES.has(event.type) &&
        event.tick - trace.run.checkpointTick <= freezeStart.relativeTick,
    )
    .at(-1);
  const meaningful =
    lastEvent === undefined
      ? "none before freeze"
      : `${lastEvent.tick - trace.run.checkpointTick}:${lastEvent.type}:${String(lastEvent.targetId ?? "none")}`;
  const monthlyText =
    monthly === null
      ? "no monthly boundary captured"
      : `T016/F04A target ΔG/ΔO=${factionSummary(monthly)}; heuristic selected action(s) remain derived from current observation; no proposal writer runs unless the next accepted faction action is LOBBY with the authored template.`;
  const weeklyText =
    weekly === null
      ? "no active-conflict weekly boundary in the silent interval"
      : `T021 weekly boundary: ${conflictSummary(weekly)}; deriveConflictIntents is the only territorial candidate writer and no-op reasons are recorded above.`;
  const outcomeText = `T022 ${outcomeSummary(freezeStart)}; T023 dissolution=${freezeStart.dissolution.dissolved ? "eligible" : "not eligible"}; no continuity writer/countdown is present.`;
  const agendaText = `T016A Agenda=${freezeStart.agendaSignature}; feasible response set=${
    freezeStart.feasibilities
      .filter((item) => item.feasible)
      .map((item) => item.interventionId)
      .join(",") || "none"
  }; final Agenda=${final.agendaSignature}; final response set=${
    final.feasibilities
      .filter((item) => item.feasible)
      .map((item) => item.interventionId)
      .join(",") || "none"
  }.`;
  const chain = [
    `${meaningful} -> authoritative state at ${freezeStart.relativeTick}: country treasury=${freezeStart.country.treasury.toFixed(0)}, admin=${freezeStart.administrativeHeadroom.toFixed(2)}, landHex=${freezeStart.countryControlledLandHexIds.length}, conflicts=${freezeStart.conflicts.filter((conflict) => conflict.status === "active").length}`,
    `monthly T016/F04A -> ${monthlyText}`,
    `weekly T021 -> ${weeklyText}`,
    `T017/T018 crisis gates -> ${freezeStart.crises.rebellions.map((candidate) => `${candidate.factionId}:${candidate.eligible ? "eligible" : candidate.failedGates.join("|")}`).join("; ") || "none"}`,
    `T022/T023 outcome -> ${outcomeText}`,
    `Agenda/player read model -> ${agendaText}`,
    `next unchanged state -> final tick ${final.relativeTick}, outcome=${final.outcome}`,
  ];
  return {
    lastMeaningfulStateChange: meaningful,
    monthlyEvaluation: monthlyText,
    weeklyEvaluation: weeklyText,
    outcomeEvaluation: outcomeText,
    agendaAndPlayerEvaluation: agendaText,
    freezeChain: chain,
  };
}

function branchClassifications(
  freezeStart: F05Fix9StateSnapshot | null,
  final: F05Fix9StateSnapshot,
): readonly F05Fix9Classification[] {
  if (freezeStart === null) return ["INTERACTION_COVERAGE_EXHAUSTED"];
  const labels: F05Fix9Classification[] = [];
  if (
    freezeStart.conflicts.some(
      (conflict) =>
        conflict.status === "active" && conflict.noOpReason !== "INTENT_READY",
    )
  )
    labels.push("ACTIVE_CONFLICT_EQUILIBRIUM");
  if (
    !freezeStart.consolidation.eligible ||
    !final.consolidation.eligible ||
    final.dissolution.deferredCriteria.length > 0
  )
    labels.push("OUTCOME_ELIGIBILITY_STALEMATE");
  const feasibleAtFreeze = freezeStart.feasibilities.filter(
    (item) => item.feasible,
  ).length;
  const feasibleAtFinal = final.feasibilities.filter(
    (item) => item.feasible,
  ).length;
  if (
    feasibleAtFreeze === feasibleAtFinal &&
    freezeStart.agendaSignature === final.agendaSignature
  )
    labels.push("PLAYER_RESPONSE_SET_SATURATED");
  if (
    freezeStart.proposals.length === 0 ||
    freezeStart.proposals.every((proposal) => proposal.status !== "open")
  )
    labels.push("INTERACTION_COVERAGE_EXHAUSTED");
  return labels.length > 1
    ? labels
    : labels.length === 1
      ? labels
      : ["MIXED_CAUSE"];
}

function buildBranchAudit(
  context: F05ContextDefinition,
  strategyId: F05StrategyId,
  mode: F05Fix7ProposalMode,
  trace: F05Fix9BranchTrace,
): F05Fix9BranchAudit {
  const late = trace.lateInterval;
  const freezeStart = snapshotAt(trace, late?.startTick ?? null);
  const finalSnapshot = requiredSnapshot(
    trace,
    trace.run.executedTicks,
    "final",
  );
  return {
    mode,
    contextId: context.id,
    contextFamily: context.family,
    strategyId,
    checkpointTick: context.checkpointTick,
    executedTicks: trace.run.executedTicks,
    proposalOpenedTick: trace.proposalOpenedTick,
    responseTick: trace.responseTick,
    requestedInterventionStartTick: trace.requestedStartTick,
    requestedInterventionCompletionTick: trace.requestedCompletionTick,
    completionTick: trace.completionTick,
    lateInterval: late,
    stateGroundedSignalTicks: trace.stateGroundedSignals.map(
      (signal) => signal.tick,
    ),
    proposalDecisionLongestSilenceDays:
      trace.proposalDecisionLongestSilenceDays,
    finalSnapshot,
    classifications: branchClassifications(freezeStart, finalSnapshot),
    implementationGate: "NOT_MET",
    trace,
  };
}

function representativeSnapshot(
  trace: F05Fix9BranchTrace,
  tick: number | null,
  label: string,
): F05Fix9StateSnapshot | null {
  if (tick === null) return null;
  const exact = trace.snapshots.get(tick);
  if (exact !== undefined) return exact;
  if (label === "monthly" || label === "weekly") return null;
  return null;
}

function representativeAudit(
  scenario: ScenarioDefinition,
  branch: F05Fix9BranchAudit,
  label: F05Fix9RepresentativeAudit["label"],
): F05Fix9RepresentativeAudit {
  const trace = branch.trace;
  const late = branch.lateInterval;
  if (late === null)
    throw new Error(
      `Representative ${branchKey(branch.mode, branch.contextId, branch.strategyId)} has no late interval.`,
    );
  const freezeStart = requiredSnapshot(trace, late.startTick, "freeze start");
  const monthlyTick =
    [...trace.snapshots.keys()]
      .filter(
        (tick) =>
          tick > late.startTick && tick < late.endTick && tick % 30 === 0,
      )
      .sort((first, second) => first - second)[0] ?? null;
  const weeklyTick =
    [...trace.snapshots.keys()]
      .filter(
        (tick) =>
          tick > late.startTick &&
          tick < late.endTick &&
          tick % 7 === 0 &&
          (trace.snapshots
            .get(tick)
            ?.conflicts.some((conflict) => conflict.status === "active") ??
            false),
      )
      .sort((first, second) => first - second)[0] ?? null;
  const monthly = representativeSnapshot(trace, monthlyTick, "monthly");
  const weekly = representativeSnapshot(trace, weeklyTick, "weekly");
  const completion = snapshotAt(trace, branch.completionTick);
  const probeWorld = trace.worlds.get(late.startTick);
  if (probeWorld === undefined)
    throw new Error(
      `Representative ${branchKey(branch.mode, branch.contextId, branch.strategyId)} has no freeze world at ${late.startTick}.`,
    );
  const requestedIntervention =
    interventionForStrategy(branch.strategyId) ??
    F04D_VALIDATION_INTERVENTION_IDS.coerciveRestriction;
  const probes = [
    factionProbe(scenario, probeWorld, "organization"),
    factionProbe(scenario, probeWorld, "resources"),
    ...feasibilityProbe(scenario, probeWorld, requestedIntervention),
    institutionProbe(scenario, probeWorld),
    governmentProbe(scenario, probeWorld),
    landHexProbe(scenario, probeWorld),
  ];
  return {
    label,
    branchKey: branchKey(branch.mode, branch.contextId, branch.strategyId),
    completionSnapshot: completion,
    freezeStartSnapshot: freezeStart,
    monthlyBoundarySnapshot: monthly,
    weeklyConflictBoundarySnapshot: weekly,
    finalSnapshot: branch.finalSnapshot,
    causalGraph: freezeGraph(
      trace,
      freezeStart,
      monthly,
      weekly,
      branch.finalSnapshot,
    ),
    perturbationProbes: probes,
    classifications: branch.classifications,
  };
}

function classifyOverall(
  representatives: readonly F05Fix9RepresentativeAudit[],
  existingBugFound: boolean,
): F05Fix9OverallClassification {
  if (existingBugFound) return "LATE_STEADY_STATE_EXISTING_BUG_FOUND";
  const labels = new Set(
    representatives.flatMap((representative) => representative.classifications),
  );
  if (labels.size === 1 && labels.has("ACTIVE_CONFLICT_EQUILIBRIUM"))
    return "LATE_STEADY_STATE_MODEL_EQUILIBRIUM";
  if (labels.size === 1 && labels.has("INTERACTION_COVERAGE_EXHAUSTED"))
    return "LATE_STEADY_STATE_INTERACTION_COVERAGE_EXHAUSTED";
  if (labels.size === 1 && labels.has("OUTCOME_ELIGIBILITY_STALEMATE"))
    return "LATE_STEADY_STATE_OUTCOME_GAP";
  if (labels.size === 1 && labels.has("MEASUREMENT_ARTIFACT"))
    return "LATE_STEADY_STATE_MEASUREMENT_ARTIFACT";
  return "LATE_STEADY_STATE_MIXED_CAUSE";
}

function triState(values: readonly boolean[]): "YES" | "NO" | "MIXED" {
  if (values.every(Boolean)) return "YES";
  if (values.every((value) => !value)) return "NO";
  return "MIXED";
}

export function runF05Fix9LateSteadyStateAudit(
  seed = F05_FIX9_DEFAULT_SEED,
): F05Fix9AuditResult {
  const scenario = createF05Fix7PoliticalInteractionScenario();
  const integration = runF05Fix7InteractionIntegration(seed);
  const historical = integration.historicalF05Baseline;
  const branchAudits: F05Fix9BranchAudit[] = [];
  for (const context of F05_CONTEXTS) {
    for (const strategyId of Object.values(
      F05_STRATEGY_IDS,
    ) as readonly F05StrategyId[]) {
      for (const mode of [
        "PROPOSAL_IGNORE",
        "PROPOSAL_REJECT",
        "PROPOSAL_ACCEPT_IF_FEASIBLE",
      ] as const) {
        const trace = runDetailedBranch(
          scenario,
          context,
          strategyId,
          mode,
          seed,
        );
        const summary = integration.branches.find(
          (branch) =>
            branch.mode === mode &&
            branch.contextId === context.id &&
            branch.strategyId === strategyId,
        );
        if (summary === undefined)
          throw new Error(
            `Missing F05_FIX7 summary for ${branchKey(mode, context.id, strategyId)}.`,
          );
        if (
          (trace.lateInterval?.durationDays ?? null) !==
          summary.postInterventionStateGroundedLongestSilenceDays
        ) {
          throw new Error(
            `F05_FIX9 late-silence mismatch for ${branchKey(mode, context.id, strategyId)}: detailed=${trace.lateInterval?.durationDays ?? null} summary=${summary.postInterventionStateGroundedLongestSilenceDays}`,
          );
        }
        branchAudits.push(buildBranchAudit(context, strategyId, mode, trace));
      }
    }
  }
  const lateBranches = branchAudits.filter(
    (branch) =>
      (branch.lateInterval?.durationDays ?? 0) >
      F05_FIX9_LATE_SILENCE_THRESHOLD_DAYS,
  );
  const byFamily = (
    family: F05ContextDefinition["family"],
  ): F05Fix9BranchAudit | null =>
    lateBranches
      .filter((branch) => branch.contextFamily === family)
      .sort(
        (first, second) =>
          (second.lateInterval?.durationDays ?? 0) -
            (first.lateInterval?.durationDays ?? 0) ||
          branchKey(
            first.mode,
            first.contextId,
            first.strategyId,
          ).localeCompare(
            branchKey(second.mode, second.contextId, second.strategyId),
          ),
      )[0] ?? null;
  const worst =
    [...lateBranches].sort(
      (first, second) =>
        (second.lateInterval?.durationDays ?? 0) -
          (first.lateInterval?.durationDays ?? 0) ||
        branchKey(first.mode, first.contextId, first.strategyId).localeCompare(
          branchKey(second.mode, second.contextId, second.strategyId),
        ),
    )[0] ?? null;
  const selected: {
    readonly label: F05Fix9RepresentativeAudit["label"];
    readonly branch: F05Fix9BranchAudit;
  }[] = [];
  for (const candidate of [
    { label: "EARLY" as const, branch: byFamily("EARLY_PREVENTIVE") },
    { label: "NEAR_CRISIS" as const, branch: byFamily("NEAR_CRISIS") },
    {
      label: "RECOVERY" as const,
      branch: byFamily("ACTIVE_CONFLICT_RECOVERY"),
    },
    { label: "ABSOLUTE_WORST" as const, branch: worst },
  ]) {
    const branch = candidate.branch;
    if (branch === null) continue;
    if (
      !selected.some(
        (item) =>
          branchKey(
            item.branch.mode,
            item.branch.contextId,
            item.branch.strategyId,
          ) === branchKey(branch.mode, branch.contextId, branch.strategyId),
      )
    )
      selected.push({ label: candidate.label, branch });
  }
  const representatives = selected.map((item) =>
    representativeAudit(scenario, item.branch, item.label),
  );
  // A probe can demonstrate an existing seam only when its explicitly tested
  // consumer reacts inconsistently with the authoritative baseline.  Do not
  // infer this from prose: several valid conclusions intentionally contain
  // phrases such as "no missing consumer" or "no omitted writer".
  const existingBugFound = representatives.some((representative) =>
    representative.perturbationProbes.some(
      (probe) =>
        probe.realStateGroundedReassessment &&
        probe.conclusion.startsWith("Existing consumer is unexpectedly inert"),
    ),
  );
  const f05Fix8LifecyclePass = runF05Fix8ProposalLifecycleInspection().pass;
  const classification = classifyOverall(representatives, existingBugFound);
  const allPostValues = branchAudits
    .map((branch) => branch.lateInterval?.durationDays)
    .filter((value): value is number => value !== undefined && value !== null);
  const nonAcceptDivergences =
    integration.proposalResponseModeEffect.PROPOSAL_IGNORE +
    integration.proposalResponseModeEffect.PROPOSAL_REJECT;
  return {
    scenarioId: String(scenario.id),
    seed,
    horizonDays: F05_FIX9_HORIZON_DAYS,
    historicalF05Baseline: historical,
    historicalF05BaselineUnchanged:
      integration.historicalF05BaselineStatus === "UNCHANGED" &&
      historical.contexts.flatMap((context) => context.branches).length === 36,
    proposalBranchCount: branchAudits.length,
    expectedProposalBranchCount: 108,
    allProposalBranchesPresent:
      branchAudits.length === 108 && integration.proposalBranchCount === 108,
    exactLateSilencePopulation: lateBranches.length,
    lateSilenceBranches: lateBranches,
    branches: branchAudits,
    representatives,
    postInterventionLateSilenceMaximumDays:
      allPostValues.length === 0 ? null : Math.max(...allPostValues),
    stateGroundedMaxReassessmentSilenceDays:
      integration.stateGroundedMaxReassessmentSilenceDays,
    proposalDecisionMaxSilenceDays: integration.proposalDecisionMaxSilenceDays,
    nonAcceptDivergences,
    identicalReopenChurn:
      integration.reopenChurn === "NONE"
        ? 0
        : branchAudits.reduce(
            (total, branch) =>
              total + (branch.trace.explicitRejectCount > 0 ? 1 : 0),
            0,
          ),
    legitimateReopens: integration.legitimateReopenCount,
    f05Fix8LifecyclePass,
    primaryClassification: classification,
    existingBugFound: existingBugFound ? "YES" : "NO",
    interactionCoverageExhausted: triState(
      representatives.map((representative) =>
        representative.classifications.includes(
          "INTERACTION_COVERAGE_EXHAUSTED",
        ),
      ),
    ),
    activeConflictEquilibrium: triState(
      representatives.map((representative) =>
        representative.classifications.includes("ACTIVE_CONFLICT_EQUILIBRIUM"),
      ),
    ),
    outcomeGap: triState(
      representatives.map((representative) =>
        representative.classifications.includes(
          "OUTCOME_ELIGIBILITY_STALEMATE",
        ),
      ),
    ),
    playerResponseSetSaturated: triState(
      representatives.map((representative) =>
        representative.classifications.includes(
          "PLAYER_RESPONSE_SET_SATURATED",
        ),
      ),
    ),
    implementation: "NONE",
    historicalF05Regression: integration.historicalF05BaselineStatus,
    persistenceFormat: "V4_UNCHANGED",
    readyForF05Promotion: "NO",
    gate1fRecommendation: "NOT_READY",
    v02: "NOT_STARTED",
  };
}

function formatSnapshot(snapshot: F05Fix9StateSnapshot | null): string {
  if (snapshot === null) return "none";
  return `t=${snapshot.relativeTick} treasury=${snapshot.country.treasury.toFixed(0)} admin=${snapshot.administrativeHeadroom.toFixed(2)}/${snapshot.administrativeLoad.toFixed(2)} institutions=${stableJson(snapshot.institutions)} land=${snapshot.countryControlledLandHexIds.length} conflicts=${snapshot.conflicts.filter((conflict) => conflict.status === "active").length} agendas=${snapshot.agendaSignature} proposals=${snapshot.proposals.map((proposal) => `${proposal.status}:${proposal.interventionId}`).join(",") || "none"}`;
}

export function formatF05Fix9LateSteadyStateAudit(
  result: F05Fix9AuditResult,
): string {
  const lines = [
    "F05_FIX9 POST-INTERACTION LATE STEADY-STATE ROOT-CAUSE AUDIT",
    `scenario=${result.scenarioId} seed=${result.seed} horizon=${result.horizonDays}d`,
    `population=36 historical + ${result.proposalBranchCount} proposal = ${result.proposalBranchCount + 36}/144`,
    `exact >${F05_FIX9_LATE_SILENCE_THRESHOLD_DAYS}d post-intervention late-silence population=${result.exactLateSilencePopulation}`,
    `state-grounded max reassessment silence=${result.stateGroundedMaxReassessmentSilenceDays}d`,
    `post-intervention late state-grounded silence=${result.postInterventionLateSilenceMaximumDays ?? "none"}d`,
    `proposal-decision max silence=${result.proposalDecisionMaxSilenceDays}d`,
    `historical F05 baseline=${result.historicalF05Regression} lifecycle=${result.f05Fix8LifecyclePass ? "PASS" : "FAIL"}`,
    `non-accept divergences=${result.nonAcceptDivergences} identical reopen churn=${result.identicalReopenChurn} legitimate reopens=${result.legitimateReopens}`,
    `PRIMARY_CLASSIFICATION=${result.primaryClassification}`,
    `EXISTING_BUG_FOUND=${result.existingBugFound} INTERACTION_COVERAGE_EXHAUSTED=${result.interactionCoverageExhausted} ACTIVE_CONFLICT_EQUILIBRIUM=${result.activeConflictEquilibrium} OUTCOME_GAP=${result.outcomeGap} PLAYER_RESPONSE_SET_SATURATED=${result.playerResponseSetSaturated}`,
    `IMPLEMENTATION=${result.implementation} READY_FOR_F05_PROMOTION=${result.readyForF05Promotion} GATE1F_RECOMMENDATION=${result.gate1fRecommendation} V02=${result.v02}`,
    "",
    "Late-silence population",
    "mode | context | strategy | open/response | requested start/complete | late interval | final country/land/conflicts/outcome | agenda",
  ];
  for (const branch of result.lateSilenceBranches) {
    const late = branch.lateInterval;
    lines.push(
      `${branch.mode} | ${branch.contextId} | ${branch.strategyId} | ${branch.proposalOpenedTick ?? "-"}/${branch.responseTick ?? "-"} | ${branch.requestedInterventionStartTick ?? "-"}/${branch.requestedInterventionCompletionTick ?? "-"} | ${late === null ? "-" : `${late.startTick}-${late.endTick} (${late.durationDays}d)`} | ${branch.finalSnapshot.country.currentGovernmentId ?? "none"}/${branch.finalSnapshot.countryControlledLandHexIds.length}/${branch.finalSnapshot.conflicts.filter((conflict) => conflict.status === "active").length}/${branch.finalSnapshot.outcome} | ${branch.finalSnapshot.agendaSignature}`,
    );
  }
  lines.push("", "Representative freeze graphs");
  for (const representative of result.representatives) {
    lines.push(
      `${representative.label}: ${representative.branchKey} classifications=${representative.classifications.join(",")}`,
    );
    lines.push(
      `completion: ${formatSnapshot(representative.completionSnapshot)}`,
    );
    lines.push(`freeze: ${formatSnapshot(representative.freezeStartSnapshot)}`);
    lines.push(
      `monthly: ${formatSnapshot(representative.monthlyBoundarySnapshot)}`,
    );
    lines.push(
      `weekly: ${formatSnapshot(representative.weeklyConflictBoundarySnapshot)}`,
    );
    lines.push(`final: ${formatSnapshot(representative.finalSnapshot)}`);
    lines.push(
      ...representative.causalGraph.freezeChain.map((step) => `  ${step}`),
    );
    lines.push("  perturbations:");
    lines.push(
      ...representative.perturbationProbes.map(
        (probe) =>
          `  - ${probe.input} | consumer=${probe.firstDownstreamConsumer} | changed=${probe.changed ? "YES" : "NO"} | reassessment=${probe.realStateGroundedReassessment ? "YES" : "NO"} | baseline=${probe.baseline} | perturbed=${probe.perturbed} | events=${probe.emittedEvents.join(",") || "none"}`,
      ),
    );
  }
  lines.push(
    "",
    "Required output fields",
    `PRIMARY_CLASSIFICATION: ${result.primaryClassification}`,
    `REPRESENTATIVE_BRANCH_CLASSIFICATIONS: ${result.representatives.map((representative) => `${representative.branchKey}->${representative.classifications.join("+")}`).join("; ")}`,
    `EXISTING_BUG_FOUND: ${result.existingBugFound}`,
    `INTERACTION_COVERAGE_EXHAUSTED: ${result.interactionCoverageExhausted}`,
    `ACTIVE_CONFLICT_EQUILIBRIUM: ${result.activeConflictEquilibrium}`,
    `OUTCOME_GAP: ${result.outcomeGap}`,
    `PLAYER_RESPONSE_SET_SATURATED: ${result.playerResponseSetSaturated}`,
    `IMPLEMENTATION: ${result.implementation}`,
    `HISTORICAL_F05_BASELINE: ${result.historicalF05Regression}`,
    `PERSISTENCE_FORMAT: ${result.persistenceFormat}`,
    `STATE_GROUNDED_MAX_REASSESSMENT_SILENCE: ${result.stateGroundedMaxReassessmentSilenceDays}`,
    `POST_INTERVENTION_LATE_SILENCE: ${result.postInterventionLateSilenceMaximumDays ?? "none"}`,
    `NON_ACCEPT_DIVERGENCES: ${result.nonAcceptDivergences}`,
    `IDENTICAL_REOPEN_CHURN: ${result.identicalReopenChurn}`,
    `LEGITIMATE_REOPENS: ${result.legitimateReopens}`,
    `READY_FOR_F05_PROMOTION: ${result.readyForF05Promotion}`,
    `GATE1F_RECOMMENDATION: ${result.gate1fRecommendation}`,
    `V02: ${result.v02}`,
  );
  return lines.join("\n");
}

export function runF05Fix9Inspection(): {
  readonly result: F05Fix9AuditResult;
  readonly allPassed: boolean;
  readonly output: string;
} {
  const result = runF05Fix9LateSteadyStateAudit();
  const allPassed =
    result.historicalF05BaselineUnchanged &&
    result.allProposalBranchesPresent &&
    result.f05Fix8LifecyclePass &&
    result.nonAcceptDivergences === 0 &&
    result.identicalReopenChurn === 0 &&
    result.implementation === "NONE" &&
    result.gate1fRecommendation === "NOT_READY" &&
    result.v02 === "NOT_STARTED";
  return {
    result,
    allPassed,
    output: formatF05Fix9LateSteadyStateAudit(result),
  };
}

export function printF05Fix9Inspection(): void {
  console.log(
    formatF05Fix9LateSteadyStateAudit(runF05Fix9LateSteadyStateAudit()),
  );
}
