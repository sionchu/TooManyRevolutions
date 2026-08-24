import { createEventStore } from "../events/eventStore";
import type { GameEvent, GameEventType } from "../events/event";
import {
  cloneRunRecordViaSnapshot,
  commitSimulationStep,
} from "../core/persistence";
import { SIMULATION_DAYS_PER_YEAR } from "../core/clock";
import type { RunRecord } from "../core/step";
import { runSimulationStep } from "../core/tick";
import {
  acceptActionProposal,
  createStartInterventionActionProposal,
  decodeFactionAction,
  type ActionProposal,
  type FactionActionType,
} from "../state/action";
import {
  deriveAdministrativeHeadroom,
  deriveCommittedAdministrativeLoad,
  evaluateInterventionFeasibility,
  type InterventionEffect,
  type InterventionFeasibilityResult,
} from "../state/intervention";
import type { CountryId, InterventionId } from "../state/ids";
import type { ScenarioDefinition } from "../state/scenario";
import type { WorldState } from "../state/world";
import { createInitialWorldState } from "../state/world";
import { derivePoliticalCrisisPrerequisites } from "../systems/politicalCrisis";
import { createT021RebellionScenario } from "../state/conflictFixture";
import {
  createGate1FValidationScenario,
  GATE1F_VALIDATION_INTERVENTION_IDS,
} from "../state/gate1fValidationFixture";
import { createInterventionPhaseHooks } from "../systems/interventionHooks";
import {
  getFactionActorProposalDetails,
  intakeFactionHeuristicProposals,
  type FactionActorLoopMode,
} from "./factionActorLoop";

export const F03_DAYS_PER_YEAR = SIMULATION_DAYS_PER_YEAR;
export const F03_HORIZON_YEARS = 10 as const;
export const F03_DEFAULT_SEED = 40103 as const;
export const F03_STARTING_CHECKPOINT_TICKS = [0, 90, 180] as const;
export const F03_CHECKPOINT_OFFSETS = [
  0, 1, 30, 180, 360, 1_800, 3_600,
] as const;

export const F03_BRANCH_IDS = {
  wait: "WAIT",
  short: "INTERVENTION_SHORT",
  long: "INTERVENTION_LONG",
  prerequisite: "INTERVENTION_PREREQUISITE",
} as const;

export type F03BranchId = (typeof F03_BRANCH_IDS)[keyof typeof F03_BRANCH_IDS];
export type F03PlayerAgencyClassification =
  | "PLAYER_AGENCY_OBSERVED"
  | "PLAYER_AGENCY_WEAK"
  | "PLAYER_AGENCY_NOT_OBSERVED";

const F03_POLITICAL_EVENT_TYPES = [
  "COUP_ATTEMPT_STARTED",
  "REBELLION_STARTED",
  "CIVIL_WAR_STARTED",
  "CONFLICT_RESOLVED",
  "LAND_HEX_CONTROL_CHANGED",
  "GOVERNMENT_TRANSITIONED",
  "ORDER_CONSOLIDATION_STARTED",
  "ORDER_CONSOLIDATED",
  "STATE_DISSOLVED",
] as const satisfies readonly GameEventType[];

const F03_BRANCH_DEFINITIONS: Readonly<
  Record<F03BranchId, { readonly interventionId: InterventionId | null }>
> = {
  [F03_BRANCH_IDS.wait]: { interventionId: null },
  [F03_BRANCH_IDS.short]: {
    interventionId: GATE1F_VALIDATION_INTERVENTION_IDS.short,
  },
  [F03_BRANCH_IDS.long]: {
    interventionId: GATE1F_VALIDATION_INTERVENTION_IDS.long,
  },
  [F03_BRANCH_IDS.prerequisite]: {
    interventionId: GATE1F_VALIDATION_INTERVENTION_IDS.prerequisite,
  },
};

export interface F03SurveyOptions {
  readonly startingCheckpointTicks?: readonly number[];
  readonly branchOrder?: readonly F03BranchId[];
  /** Developer-only observer; it receives read-only post-step branch state. */
  readonly onBranchObservation?: F03BranchObservationListener;
}

/**
 * A transient observation seam for F03 diagnostics. The WorldState is never
 * retained by the simulation as telemetry; callers may read it while building
 * their own compact developer report.
 */
export interface F03BranchObservation {
  readonly startingStateId: string;
  readonly branchId: F03BranchId;
  readonly relativeTick: number;
  readonly world: WorldState;
  readonly events: readonly GameEvent[];
}

export type F03BranchObservationListener = (
  observation: F03BranchObservation,
) => void;

/** Developer-only observation seam shared by later strategy diagnostics. */
export interface F03StrategyObservation {
  readonly startingStateId: string;
  readonly strategyId: string;
  readonly relativeTick: number;
  readonly world: WorldState;
  readonly events: readonly GameEvent[];
}

export type F03StrategyObservationListener = (
  observation: F03StrategyObservation,
) => void;

/** One bounded intervention choice is evaluated before each canonical tick. */
export interface F03StrategyPolicyContext {
  readonly scenario: ScenarioDefinition;
  readonly startingStateId: string;
  readonly strategyId: string;
  readonly relativeTick: number;
  readonly world: WorldState;
  readonly lastStepEvents: readonly GameEvent[];
}

export type F03StrategyPolicy = (
  context: F03StrategyPolicyContext,
) => InterventionId | null;

export interface F03StrategyRunOptions {
  readonly checkpointOffsets?: readonly number[];
  readonly onObservation?: F03StrategyObservationListener;
  /** Historical F03/F04 behavior is detached; F05 opts into the actor loop. */
  readonly factionActorLoop?: FactionActorLoopMode;
}

export interface F03FactionActorTrace {
  /** Relative target/execution tick from the strategy checkpoint. */
  readonly relativeTick: number;
  readonly factionId: string;
  readonly actionType: FactionActionType;
}

/** Generic developer strategy result; it is not gameplay state or authority. */
export interface F03StrategyRunResult {
  readonly startingStateId: string;
  readonly strategyId: string;
  readonly checkpointTick: number;
  readonly startingRecord: RunRecord;
  readonly finalRecord: RunRecord;
  readonly startSnapshot: F03MetricSnapshot;
  readonly checkpoints: readonly F03MetricSnapshot[];
  readonly final: F03MetricSnapshot;
  readonly executedTicks: number;
  readonly actionIds: readonly string[];
  readonly eventSummary: F03EventSummary;
  readonly stepEvents: readonly GameEvent[];
  readonly politicalEventSequence: readonly string[];
  readonly semanticEventSequence: readonly string[];
  readonly factionActorLoop: FactionActorLoopMode;
  readonly factionProposalsGenerated: number;
  readonly factionProposalsAccepted: number;
  readonly factionProposalsDropped: number;
  readonly factionStrategyChanges: number;
  readonly factionProposalSequence: readonly F03FactionActorTrace[];
  readonly factionActionSequence: readonly F03FactionActorTrace[];
  readonly finalFactionStrategies: Readonly<Record<string, string>>;
  readonly terminal: F03BranchResult["terminal"];
}

export interface F03ScenarioSuitability {
  readonly scenarioId: string;
  readonly interventionCount: number;
  readonly feasibleInterventionCount: number;
  readonly feasibleInterventionIds: readonly string[];
  readonly playerTreasury: number | null;
  readonly stateCapacity: number | null;
  readonly factionCount: number;
  readonly nonTrivialRegionCount: number;
  readonly contactEdgeCount: number;
  readonly consolidationCriteriaConfigured: boolean;
  readonly suitableForCounterfactuals: boolean;
  readonly findings: readonly string[];
}

export interface F03RegionMetric {
  readonly regionId: string;
  readonly unrest: number;
  readonly scarcity: number;
}

export interface F03MetricSnapshot {
  readonly relativeTick: number;
  readonly absoluteTick: number;
  readonly simulatedYear: number;
  readonly treasury: number;
  readonly stateCapacity: number;
  readonly administrativeLoad: number;
  readonly administrativeHeadroom: number;
  readonly instability: number;
  readonly stateContinuity: number;
  readonly maxRegionUnrest: number;
  readonly maxRegionScarcity: number;
  readonly regions: readonly F03RegionMetric[];
  readonly factionOrganization: number;
  readonly factionGrievance: number;
  readonly factionResources: number;
  readonly coupEligibleCount: number;
  readonly rebellionEligibleCount: number;
  readonly controlledLandHexes: number;
  readonly activeConflicts: number;
  readonly activeCivilWars: number;
  readonly currentGovernmentId: string | null;
  readonly consolidationEligible: boolean;
  readonly consolidationStreak: number;
  readonly outcome: "active" | "orderConsolidated" | "stateDissolved";
}

export interface F03EventSummary {
  readonly interventionStarted: number;
  readonly interventionCompleted: number;
  readonly interventionRejected: number;
  readonly rebellions: number;
  readonly coups: number;
  readonly civilWars: number;
  readonly conflictResolutions: number;
  readonly territorialChanges: number;
  readonly governmentTransitions: number;
  readonly consolidationAttempts: number;
  readonly consolidations: number;
  readonly dissolutions: number;
  readonly treasuryChanges: number;
  readonly regionUnrestChanges: number;
  readonly interventionEffectsApplied: number;
}

export interface F03BranchResult {
  readonly startingStateId: string;
  readonly branchId: F03BranchId;
  readonly interventionId: string | null;
  readonly accepted: boolean;
  readonly feasibility: InterventionFeasibilityResult | null;
  readonly actionId: string | null;
  readonly executedTicks: number;
  readonly immediate: F03MetricSnapshot;
  readonly checkpoints: readonly F03MetricSnapshot[];
  readonly final: F03MetricSnapshot;
  readonly events: F03EventSummary;
  readonly politicalEventSequence: readonly string[];
  readonly semanticEventSequence: readonly string[];
  readonly terminal: {
    readonly outcome: "active" | "orderConsolidated" | "stateDissolved";
    readonly tick: number | null;
    readonly simulatedYear: number | null;
  };
}

export interface F03MetricDelta {
  readonly treasury: number;
  readonly stateCapacity: number;
  readonly administrativeLoad: number;
  readonly administrativeHeadroom: number;
  readonly instability: number;
  readonly maxRegionUnrest: number;
  readonly maxRegionScarcity: number;
  readonly factionOrganization: number;
  readonly factionGrievance: number;
  readonly factionResources: number;
  readonly coupEligibleCount: number;
  readonly rebellionEligibleCount: number;
  readonly controlledLandHexes: number;
  readonly activeConflicts: number;
  readonly activeCivilWars: number;
  readonly consolidationStreak: number;
}

export interface F03CounterfactualComparison {
  readonly startingStateId: string;
  readonly interventionBranchId: F03BranchId;
  readonly interventionId: string;
  readonly accepted: boolean;
  readonly firstMeaningfulDivergenceTick: number | null;
  readonly immediateStateDivergence: boolean;
  readonly oneYearStateDivergence: boolean;
  readonly fiveYearStateDivergence: boolean;
  readonly horizonStateDivergence: boolean;
  readonly politicalHistoryDivergence: boolean;
  readonly historyDivergence: boolean;
  readonly outcomeDivergence: boolean;
  readonly stateReConvergedAtHorizon: boolean;
  readonly deltas: Readonly<{
    readonly day1: F03MetricDelta;
    readonly day180: F03MetricDelta;
    readonly oneYear: F03MetricDelta;
    readonly fiveYear: F03MetricDelta;
    readonly horizon: F03MetricDelta;
  }>;
}

export interface F03DownstreamAudit {
  readonly actualStatePath: readonly string[];
  readonly observedConsumers: readonly string[];
  readonly missingOrDeferredConsumers: readonly string[];
  readonly deadEndInterventionBranches: readonly F03BranchId[];
}

export interface F03InterventionCausalAudit {
  readonly startingStateId: string;
  readonly branchId: F03BranchId;
  readonly interventionId: string;
  readonly completionEffectKinds: readonly InterventionEffect["kind"][];
  readonly completionEffectsApplied: number;
  readonly nonCostAuthoritativeStateChanged: boolean;
  readonly t017DownstreamDifference: boolean;
  readonly t018DownstreamDifference: boolean;
  readonly existingDownstreamConsumerObserved: boolean;
  readonly politicalHistoryDivergence: boolean;
  readonly deadEnd: boolean;
}

export interface F03StartingStateResult {
  readonly id: string;
  readonly checkpointTick: number;
  readonly label: string;
  readonly snapshot: F03MetricSnapshot;
  readonly branches: readonly F03BranchResult[];
}

export interface F03SurveyResult {
  readonly scenarioId: string;
  readonly scenarioVersion: number;
  readonly seed: number;
  readonly policy: "WAIT plus one legal intervention";
  readonly horizonYears: number;
  readonly requestedTicksPerBranch: number;
  readonly totalExecutedTicks: number;
  readonly wallClockMilliseconds: number;
  readonly ticksPerSecond: number;
  readonly t021Suitability: F03ScenarioSuitability;
  readonly usedScenarioSuitability: F03ScenarioSuitability;
  readonly startingStates: readonly F03StartingStateResult[];
  readonly comparisons: readonly F03CounterfactualComparison[];
  readonly causalAudits: readonly F03InterventionCausalAudit[];
  readonly tradeoffObservations: readonly string[];
  readonly downstream: F03DownstreamAudit;
  readonly playerAgency: F03PlayerAgencyClassification;
  readonly concerns: readonly string[];
  readonly deterministicSignature: string;
}

export interface F03InspectionReport {
  readonly result: F03SurveyResult;
  readonly allPassed: boolean;
  readonly output: string;
}

interface MutableEventSummary {
  interventionStarted: number;
  interventionCompleted: number;
  interventionRejected: number;
  rebellions: number;
  coups: number;
  civilWars: number;
  conflictResolutions: number;
  territorialChanges: number;
  governmentTransitions: number;
  consolidationAttempts: number;
  consolidations: number;
  dissolutions: number;
  treasuryChanges: number;
  regionUnrestChanges: number;
  interventionEffectsApplied: number;
}

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function compareNumbers(first: number, second: number): number {
  return first - second;
}

function initialEventSummary(): MutableEventSummary {
  return {
    interventionStarted: 0,
    interventionCompleted: 0,
    interventionRejected: 0,
    rebellions: 0,
    coups: 0,
    civilWars: 0,
    conflictResolutions: 0,
    territorialChanges: 0,
    governmentTransitions: 0,
    consolidationAttempts: 0,
    consolidations: 0,
    dissolutions: 0,
    treasuryChanges: 0,
    regionUnrestChanges: 0,
    interventionEffectsApplied: 0,
  };
}

function eventCountType(
  events: readonly GameEvent[],
  type: GameEventType,
): number {
  return events.filter((event) => event.type === type).length;
}

function countControlledLandHexes(
  world: WorldState,
  countryId: CountryId,
): number {
  return Object.values(world.landHexStates).filter(
    (state) =>
      state.controller.kind === "country" &&
      state.controller.countryId === countryId,
  ).length;
}

function sumFactionMetric(
  world: WorldState,
  metric: "organization" | "grievance" | "resources",
): number {
  return Object.values(world.factions).reduce(
    (total, faction) => total + faction[metric],
    0,
  );
}

function countCompletionEffects(events: readonly GameEvent[]): number {
  return events.reduce((total, event) => {
    if (event.type !== "INTERVENTION_COMPLETED") {
      return total;
    }

    if (
      typeof event.payload !== "object" ||
      event.payload === null ||
      Array.isArray(event.payload)
    ) {
      return total;
    }

    const effects = (event.payload as { readonly effects?: readonly unknown[] })
      .effects;
    return total + (Array.isArray(effects) ? effects.length : 0);
  }, 0);
}

function outcomeLabel(
  world: WorldState,
): "active" | "orderConsolidated" | "stateDissolved" {
  return world.run.outcome.status === "active"
    ? "active"
    : world.run.outcome.kind;
}

function terminalSummary(world: WorldState): F03BranchResult["terminal"] {
  if (world.run.outcome.status === "active") {
    return { outcome: "active", tick: null, simulatedYear: null };
  }

  return {
    outcome: world.run.outcome.kind,
    tick: world.run.outcome.atTick,
    simulatedYear: world.run.outcome.atTick / F03_DAYS_PER_YEAR,
  };
}

function createMetricSnapshot(
  scenario: ScenarioDefinition,
  world: WorldState,
  playerCountryId: CountryId,
  relativeTick: number,
): F03MetricSnapshot {
  const country = world.countries[playerCountryId];
  if (country === undefined) {
    throw new Error(`F03 player country ${playerCountryId} is missing.`);
  }

  const regions = Object.values(world.regions)
    .sort((first, second) => compareStableText(first.id, second.id))
    .map<F03RegionMetric>((region) => ({
      regionId: region.id,
      unrest: region.unrest,
      scarcity: region.scarcity,
    }));
  const crisisPrerequisites = derivePoliticalCrisisPrerequisites(
    scenario,
    world,
  );

  return {
    relativeTick,
    absoluteTick: world.tick,
    simulatedYear: world.tick / F03_DAYS_PER_YEAR,
    treasury: country.treasury,
    stateCapacity: country.stateCapacity,
    administrativeLoad: deriveCommittedAdministrativeLoad(
      world,
      playerCountryId,
    ),
    administrativeHeadroom: deriveAdministrativeHeadroom(
      world,
      playerCountryId,
    ),
    instability: country.instability,
    stateContinuity: country.stateContinuity,
    maxRegionUnrest: Math.max(...regions.map((region) => region.unrest), 0),
    maxRegionScarcity: Math.max(...regions.map((region) => region.scarcity), 0),
    regions,
    factionOrganization: sumFactionMetric(world, "organization"),
    factionGrievance: sumFactionMetric(world, "grievance"),
    factionResources: sumFactionMetric(world, "resources"),
    coupEligibleCount: crisisPrerequisites.coups.filter(
      (candidate) => candidate.eligible,
    ).length,
    rebellionEligibleCount: crisisPrerequisites.rebellions.filter(
      (candidate) => candidate.eligible,
    ).length,
    controlledLandHexes: countControlledLandHexes(world, playerCountryId),
    activeConflicts: Object.values(world.conflicts).filter(
      (conflict) => conflict.status === "active",
    ).length,
    activeCivilWars: Object.values(world.conflicts).filter(
      (conflict) =>
        conflict.status === "active" && conflict.kind === "civilWar",
    ).length,
    currentGovernmentId: country.currentGovernmentId,
    consolidationEligible: world.run.consolidation.isCurrentlyEligible,
    consolidationStreak: world.run.consolidation.consecutiveEligibleTicks,
    outcome: outcomeLabel(world),
  };
}

/** Shared compact metric projection for developer strategy diagnostics. */
export const deriveF03MetricSnapshot = createMetricSnapshot;

function addEvents(
  summary: MutableEventSummary,
  events: readonly GameEvent[],
): void {
  summary.interventionStarted += eventCountType(events, "INTERVENTION_STARTED");
  summary.interventionCompleted += eventCountType(
    events,
    "INTERVENTION_COMPLETED",
  );
  summary.interventionRejected += eventCountType(
    events,
    "INTERVENTION_REJECTED",
  );
  summary.rebellions += eventCountType(events, "REBELLION_STARTED");
  summary.coups += eventCountType(events, "COUP_ATTEMPT_STARTED");
  summary.civilWars += eventCountType(events, "CIVIL_WAR_STARTED");
  summary.conflictResolutions += eventCountType(events, "CONFLICT_RESOLVED");
  summary.territorialChanges += eventCountType(
    events,
    "LAND_HEX_CONTROL_CHANGED",
  );
  summary.governmentTransitions += eventCountType(
    events,
    "GOVERNMENT_TRANSITIONED",
  );
  summary.consolidationAttempts += eventCountType(
    events,
    "ORDER_CONSOLIDATION_STARTED",
  );
  summary.consolidations += eventCountType(events, "ORDER_CONSOLIDATED");
  summary.dissolutions += eventCountType(events, "STATE_DISSOLVED");
  summary.treasuryChanges += eventCountType(events, "TREASURY_CHANGED");
  summary.regionUnrestChanges += eventCountType(
    events,
    "REGION_UNREST_BAND_CHANGED",
  );
  summary.interventionEffectsApplied += countCompletionEffects(events);
}

function eventTarget(event: GameEvent): string {
  return event.targetId === undefined ? "none" : String(event.targetId);
}

function semanticEventKey(event: GameEvent, relativeStartTick: number): string {
  return `${event.tick - relativeStartTick}:${event.type}:${eventTarget(event)}`;
}

function politicalEventKey(
  event: GameEvent,
  relativeStartTick: number,
): string {
  return semanticEventKey(event, relativeStartTick);
}

function isPoliticalEvent(event: GameEvent): boolean {
  return (F03_POLITICAL_EVENT_TYPES as readonly GameEventType[]).includes(
    event.type,
  );
}

function createEmptyEventSummary(): F03EventSummary {
  return { ...initialEventSummary() };
}

function terminalAtHorizon(world: WorldState): F03BranchResult["terminal"] {
  return terminalSummary(world);
}

function runRecordStep(
  scenario: ScenarioDefinition,
  record: RunRecord,
  actions: Parameters<typeof runSimulationStep>[1]["actions"],
  hooks: Parameters<typeof runSimulationStep>[2],
): {
  readonly record: RunRecord;
  readonly events: readonly GameEvent[];
  readonly actionProposals: readonly ActionProposal[];
} {
  const result = runSimulationStep(record.world, { actions }, hooks, scenario);
  return {
    record: commitSimulationStep(scenario, record, result),
    events: result.emittedEvents,
    actionProposals: result.actionProposals,
  };
}

function createCanonicalInitialRecord(
  scenario: ScenarioDefinition,
  seed: number,
): RunRecord {
  const rawRecord: RunRecord = {
    world: createInitialWorldState(scenario, seed),
    eventStore: createEventStore(),
  };

  return cloneRunRecordViaSnapshot(scenario, rawRecord);
}

function runWaitToTick(
  scenario: ScenarioDefinition,
  initial: RunRecord,
  targetTick: number,
): RunRecord {
  const hooks = createInterventionPhaseHooks(scenario);
  let record = initial;

  while (
    record.world.tick < targetTick &&
    record.world.run.outcome.status === "active"
  ) {
    record = runRecordStep(scenario, record, [], hooks).record;
  }

  return record;
}

/** Build one canonical natural checkpoint for developer counterfactuals. */
export function createF03StartingRecord(
  scenario: ScenarioDefinition,
  seed: number,
  checkpointTick: number,
): RunRecord {
  if (!Number.isSafeInteger(seed)) {
    throw new Error("F03 seed must be a safe integer.");
  }
  if (!Number.isInteger(checkpointTick) || checkpointTick < 0) {
    throw new Error("F03 checkpoint tick must be a non-negative integer.");
  }

  return runWaitToTick(
    scenario,
    createCanonicalInitialRecord(scenario, seed),
    checkpointTick,
  );
}

/**
 * Run a deterministic developer strategy from one canonical F03 checkpoint.
 * The policy can request at most one START_INTERVENTION per authoritative tick;
 * all legality, cost, commitment, and completion behavior remains in the
 * normal action/step/commit pipeline.
 */
export function runF03StrategyFromRecord(
  scenario: ScenarioDefinition,
  startingStateId: string,
  strategyId: string,
  startingRecord: RunRecord,
  horizonYears: number,
  policy: F03StrategyPolicy,
  options: F03StrategyRunOptions = {},
): F03StrategyRunResult {
  if (startingStateId.length === 0 || strategyId.length === 0) {
    throw new Error("F03 strategy identity must be non-empty.");
  }
  if (
    !Number.isInteger(horizonYears) ||
    horizonYears <= 0 ||
    horizonYears > 20
  ) {
    throw new Error("F03 strategy horizon must be 1–20 simulated years.");
  }

  const playerCountryId = scenario.playerCountryId;
  if (playerCountryId === null) {
    throw new Error("F03 strategy requires a player CountryId.");
  }

  const recordAtStart = cloneRunRecordViaSnapshot(scenario, startingRecord);
  const startingTick = recordAtStart.world.tick;
  const horizonTicks = horizonYears * F03_DAYS_PER_YEAR;
  const targetTick = startingTick + horizonTicks;
  const checkpointOffsets = new Set<number>(
    (options.checkpointOffsets ?? F03_CHECKPOINT_OFFSETS).filter(
      (offset) =>
        Number.isInteger(offset) && offset >= 0 && offset <= horizonTicks,
    ),
  );
  const startSnapshot = createMetricSnapshot(
    scenario,
    recordAtStart.world,
    playerCountryId,
    0,
  );
  const checkpoints: F03MetricSnapshot[] = [startSnapshot];
  const eventSummary = initialEventSummary();
  const actionIds: string[] = [];
  const stepEvents: GameEvent[] = [];
  const politicalEventSequence: string[] = [];
  const semanticEventSequence: string[] = [];
  const factionActorLoop = options.factionActorLoop ?? "off";
  let factionProposalsGenerated = 0;
  let factionProposalsAccepted = 0;
  let factionProposalsDropped = 0;
  let factionStrategyChanges = 0;
  const factionProposalSequence: F03FactionActorTrace[] = [];
  const factionActionSequence: F03FactionActorTrace[] = [];
  let pendingFactionProposals: readonly ActionProposal[] = [];
  const hooks = createInterventionPhaseHooks(scenario);
  let record = recordAtStart;
  let lastStepEvents: readonly GameEvent[] = [];

  options.onObservation?.({
    startingStateId,
    strategyId,
    relativeTick: 0,
    world: recordAtStart.world,
    events: [],
  });

  while (
    record.world.tick < targetTick &&
    record.world.run.outcome.status === "active"
  ) {
    const relativeTick = record.world.tick - startingTick;
    const interventionId = policy({
      scenario,
      startingStateId,
      strategyId,
      relativeTick,
      world: record.world,
      lastStepEvents,
    });
    const actions =
      interventionId === null
        ? []
        : [
            acceptActionProposal(
              createStartInterventionActionProposal(
                record.world.tick + 1,
                "player",
                interventionId,
                playerCountryId,
              ),
              record.world.run.nextActionSequence,
            ),
          ];

    const factionIntake =
      factionActorLoop === "on"
        ? intakeFactionHeuristicProposals(
            record.world,
            pendingFactionProposals,
            record.world.run.nextActionSequence + actions.length,
          )
        : {
            acceptedActions: [],
            acceptedProposals: [],
            droppedProposals: [],
          };
    factionProposalsAccepted += factionIntake.acceptedActions.length;
    factionProposalsDropped += factionIntake.droppedProposals.length;
    for (const action of factionIntake.acceptedActions) {
      if (action.source !== "heuristic") continue;
      const factionAction = decodeFactionAction(action);
      if (factionAction === null) continue;
      factionActionSequence.push({
        relativeTick: action.tick - startingTick,
        factionId: String(factionAction.factionId),
        actionType: action.actionType as FactionActionType,
      });
    }

    // Player actions receive the first sequence values for the shared target
    // tick; carried faction records follow in canonical FactionId order. This
    // is an explicit log order, not a phase-priority rule: factionPressure
    // resolves the complete accepted input in one normal simulation phase.
    const stepActions = [...actions, ...factionIntake.acceptedActions];

    if (actions.length > 0) {
      actionIds.push(actions[0]!.id);
    }

    const step = runRecordStep(scenario, record, stepActions, hooks);
    record = step.record;
    lastStepEvents = step.events;
    stepEvents.push(...step.events);
    addEvents(eventSummary, step.events);
    factionStrategyChanges += step.events.filter(
      (event) => event.type === "FACTION_STRATEGY_CHANGED",
    ).length;

    for (const proposal of step.actionProposals) {
      const details = getFactionActorProposalDetails(proposal);
      if (details === null) continue;
      factionProposalsGenerated += 1;
      factionProposalSequence.push({
        relativeTick: proposal.tick - startingTick,
        factionId: details.factionId,
        actionType: details.actionType,
      });
    }
    // The buffer is intentionally transient. OFF drops the output for the
    // historical detached runner; ON carries only this step's output once.
    pendingFactionProposals =
      factionActorLoop === "on" ? step.actionProposals : [];

    const nextRelativeTick = record.world.tick - startingTick;
    options.onObservation?.({
      startingStateId,
      strategyId,
      relativeTick: nextRelativeTick,
      world: record.world,
      events: step.events,
    });

    for (const event of step.events) {
      semanticEventSequence.push(semanticEventKey(event, startingTick));
      if (isPoliticalEvent(event)) {
        politicalEventSequence.push(politicalEventKey(event, startingTick));
      }
    }

    if (checkpointOffsets.has(nextRelativeTick)) {
      checkpoints.push(
        createMetricSnapshot(
          scenario,
          record.world,
          playerCountryId,
          nextRelativeTick,
        ),
      );
    }
  }

  const final = createMetricSnapshot(
    scenario,
    record.world,
    playerCountryId,
    record.world.tick - startingTick,
  );
  const finalFactionStrategies = Object.fromEntries(
    Object.values(record.world.factions)
      .sort((first, second) =>
        String(first.id) < String(second.id)
          ? -1
          : String(first.id) > String(second.id)
            ? 1
            : 0,
      )
      .map((faction) => [String(faction.id), faction.currentStrategy]),
  );

  return {
    startingStateId,
    strategyId,
    checkpointTick: startingTick,
    startingRecord: recordAtStart,
    finalRecord: record,
    startSnapshot,
    checkpoints,
    final,
    executedTicks: record.world.tick - startingTick,
    actionIds,
    eventSummary: { ...eventSummary },
    stepEvents,
    politicalEventSequence,
    semanticEventSequence,
    factionActorLoop,
    factionProposalsGenerated,
    factionProposalsAccepted,
    factionProposalsDropped,
    factionStrategyChanges,
    factionProposalSequence,
    factionActionSequence,
    finalFactionStrategies,
    terminal: terminalAtHorizon(record.world),
  };
}

function defaultBranchOrder(): readonly F03BranchId[] {
  return [
    F03_BRANCH_IDS.wait,
    F03_BRANCH_IDS.short,
    F03_BRANCH_IDS.long,
    F03_BRANCH_IDS.prerequisite,
  ];
}

function validateBranchOrder(
  branchOrder: readonly F03BranchId[],
): readonly F03BranchId[] {
  const known = new Set<F03BranchId>(defaultBranchOrder());
  const seen = new Set<F03BranchId>();

  for (const branchId of branchOrder) {
    if (!known.has(branchId)) {
      throw new Error(`F03 unknown branch ${branchId}.`);
    }
    if (seen.has(branchId)) {
      throw new Error(`F03 repeats branch ${branchId}.`);
    }
    seen.add(branchId);
  }

  if (!seen.has(F03_BRANCH_IDS.wait)) {
    throw new Error("F03 branch order must include WAIT.");
  }

  return [...branchOrder];
}

function checkpointForOffset(
  result: F03BranchResult,
  offset: number,
): F03MetricSnapshot {
  const exact = result.checkpoints.find(
    (checkpoint) => checkpoint.relativeTick === offset,
  );
  return exact ?? result.final;
}

function metricComparableValue(snapshot: F03MetricSnapshot): unknown {
  return {
    treasury: snapshot.treasury,
    stateCapacity: snapshot.stateCapacity,
    administrativeLoad: snapshot.administrativeLoad,
    administrativeHeadroom: snapshot.administrativeHeadroom,
    instability: snapshot.instability,
    stateContinuity: snapshot.stateContinuity,
    maxRegionUnrest: snapshot.maxRegionUnrest,
    maxRegionScarcity: snapshot.maxRegionScarcity,
    regions: snapshot.regions,
    factionOrganization: snapshot.factionOrganization,
    factionGrievance: snapshot.factionGrievance,
    factionResources: snapshot.factionResources,
    coupEligibleCount: snapshot.coupEligibleCount,
    rebellionEligibleCount: snapshot.rebellionEligibleCount,
    controlledLandHexes: snapshot.controlledLandHexes,
    activeConflicts: snapshot.activeConflicts,
    activeCivilWars: snapshot.activeCivilWars,
    currentGovernmentId: snapshot.currentGovernmentId,
    consolidationEligible: snapshot.consolidationEligible,
    consolidationStreak: snapshot.consolidationStreak,
    outcome: snapshot.outcome,
  };
}

function snapshotsDiffer(
  first: F03MetricSnapshot,
  second: F03MetricSnapshot,
): boolean {
  return (
    JSON.stringify(metricComparableValue(first)) !==
    JSON.stringify(metricComparableValue(second))
  );
}

function snapshotDelta(
  branch: F03MetricSnapshot,
  wait: F03MetricSnapshot,
): F03MetricDelta {
  return {
    treasury: branch.treasury - wait.treasury,
    stateCapacity: branch.stateCapacity - wait.stateCapacity,
    administrativeLoad: branch.administrativeLoad - wait.administrativeLoad,
    administrativeHeadroom:
      branch.administrativeHeadroom - wait.administrativeHeadroom,
    instability: branch.instability - wait.instability,
    maxRegionUnrest: branch.maxRegionUnrest - wait.maxRegionUnrest,
    maxRegionScarcity: branch.maxRegionScarcity - wait.maxRegionScarcity,
    factionOrganization: branch.factionOrganization - wait.factionOrganization,
    factionGrievance: branch.factionGrievance - wait.factionGrievance,
    factionResources: branch.factionResources - wait.factionResources,
    coupEligibleCount: branch.coupEligibleCount - wait.coupEligibleCount,
    rebellionEligibleCount:
      branch.rebellionEligibleCount - wait.rebellionEligibleCount,
    controlledLandHexes: branch.controlledLandHexes - wait.controlledLandHexes,
    activeConflicts: branch.activeConflicts - wait.activeConflicts,
    activeCivilWars: branch.activeCivilWars - wait.activeCivilWars,
    consolidationStreak: branch.consolidationStreak - wait.consolidationStreak,
  };
}

function createMetricDeltaMap(
  branch: F03BranchResult,
  wait: F03BranchResult,
): F03CounterfactualComparison["deltas"] {
  const delta = (offset: number): F03MetricDelta =>
    snapshotDelta(
      checkpointForOffset(branch, offset),
      checkpointForOffset(wait, offset),
    );

  return {
    day1: delta(1),
    day180: delta(180),
    oneYear: delta(F03_DAYS_PER_YEAR),
    fiveYear: delta(5 * F03_DAYS_PER_YEAR),
    horizon: delta(branch.final.relativeTick),
  };
}

function compareBranches(
  wait: F03BranchResult,
  branch: F03BranchResult,
): F03CounterfactualComparison {
  if (branch.interventionId === null) {
    throw new Error("F03 cannot compare WAIT as an intervention branch.");
  }

  if (!branch.accepted) {
    const zero = snapshotDelta(branch.final, branch.final);
    return {
      startingStateId: branch.startingStateId,
      interventionBranchId: branch.branchId,
      interventionId: branch.interventionId,
      accepted: false,
      firstMeaningfulDivergenceTick: null,
      immediateStateDivergence: false,
      oneYearStateDivergence: false,
      fiveYearStateDivergence: false,
      horizonStateDivergence: false,
      politicalHistoryDivergence: false,
      historyDivergence: false,
      outcomeDivergence: false,
      stateReConvergedAtHorizon: true,
      deltas: {
        day1: zero,
        day180: zero,
        oneYear: zero,
        fiveYear: zero,
        horizon: zero,
      },
    };
  }

  const offsets = [
    ...new Set([
      ...wait.checkpoints.map((checkpoint) => checkpoint.relativeTick),
      ...branch.checkpoints.map((checkpoint) => checkpoint.relativeTick),
    ]),
  ].sort(compareNumbers);
  const firstDivergence = offsets.find((offset) =>
    snapshotsDiffer(
      checkpointForOffset(branch, offset),
      checkpointForOffset(wait, offset),
    ),
  );
  const deltas = createMetricDeltaMap(branch, wait);
  const politicalHistoryDivergence =
    branch.politicalEventSequence.join("|") !==
    wait.politicalEventSequence.join("|");
  const historyDivergence =
    branch.semanticEventSequence.join("|") !==
    wait.semanticEventSequence.join("|");
  const stateReConvergedAtHorizon = !snapshotsDiffer(branch.final, wait.final);

  return {
    startingStateId: branch.startingStateId,
    interventionBranchId: branch.branchId,
    interventionId: branch.interventionId,
    accepted: branch.accepted,
    firstMeaningfulDivergenceTick:
      firstDivergence === undefined ? null : firstDivergence,
    immediateStateDivergence: snapshotsDiffer(branch.immediate, wait.immediate),
    oneYearStateDivergence: snapshotsDiffer(
      checkpointForOffset(branch, F03_DAYS_PER_YEAR),
      checkpointForOffset(wait, F03_DAYS_PER_YEAR),
    ),
    fiveYearStateDivergence: snapshotsDiffer(
      checkpointForOffset(branch, 5 * F03_DAYS_PER_YEAR),
      checkpointForOffset(wait, 5 * F03_DAYS_PER_YEAR),
    ),
    horizonStateDivergence: !stateReConvergedAtHorizon,
    politicalHistoryDivergence,
    historyDivergence,
    outcomeDivergence: branch.final.outcome !== wait.final.outcome,
    stateReConvergedAtHorizon,
    deltas,
  };
}

function createBranchResult(
  scenario: ScenarioDefinition,
  startStateId: string,
  startingRecord: RunRecord,
  branchId: F03BranchId,
  horizonYears: number,
  onBranchObservation?: F03BranchObservationListener,
): F03BranchResult {
  const branchDefinition = F03_BRANCH_DEFINITIONS[branchId];
  const playerCountryId = scenario.playerCountryId;
  if (playerCountryId === null) {
    throw new Error("F03 requires a player CountryId.");
  }

  const recordAtStart = cloneRunRecordViaSnapshot(scenario, startingRecord);
  onBranchObservation?.({
    startingStateId: startStateId,
    branchId,
    relativeTick: 0,
    world: recordAtStart.world,
    events: [],
  });
  const startSnapshot = createMetricSnapshot(
    scenario,
    recordAtStart.world,
    playerCountryId,
    0,
  );
  const feasibility =
    branchDefinition.interventionId === null
      ? null
      : evaluateInterventionFeasibility({
          scenario,
          world: recordAtStart.world,
          interventionId: branchDefinition.interventionId,
          countryId: playerCountryId,
        });

  if (feasibility !== null && !feasibility.feasible) {
    return {
      startingStateId: startStateId,
      branchId,
      interventionId: branchDefinition.interventionId,
      accepted: false,
      feasibility,
      actionId: null,
      executedTicks: 0,
      immediate: startSnapshot,
      checkpoints: [startSnapshot],
      final: startSnapshot,
      events: createEmptyEventSummary(),
      politicalEventSequence: [],
      semanticEventSequence: [],
      terminal: terminalAtHorizon(recordAtStart.world),
    };
  }

  const hooks = createInterventionPhaseHooks(scenario);
  const targetTick =
    recordAtStart.world.tick + horizonYears * F03_DAYS_PER_YEAR;
  const checkpointOffsets = new Set<number>(
    F03_CHECKPOINT_OFFSETS.filter(
      (offset) => offset <= horizonYears * F03_DAYS_PER_YEAR,
    ),
  );
  const checkpoints: F03MetricSnapshot[] = [startSnapshot];
  const eventSummary = initialEventSummary();
  const politicalEventSequence: string[] = [];
  const semanticEventSequence: string[] = [];
  let record = recordAtStart;
  let actionId: string | null = null;
  let immediate = startSnapshot;
  let executedTicks = 0;
  let firstStep = true;

  while (
    record.world.tick < targetTick &&
    record.world.run.outcome.status === "active"
  ) {
    const actions =
      firstStep && branchDefinition.interventionId !== null
        ? [
            acceptActionProposal(
              createStartInterventionActionProposal(
                record.world.tick + 1,
                "player",
                branchDefinition.interventionId,
                playerCountryId,
              ),
              record.world.run.nextActionSequence,
            ),
          ]
        : [];
    const step = runRecordStep(scenario, record, actions, hooks);
    record = step.record;
    const relativeTick = record.world.tick - recordAtStart.world.tick;
    onBranchObservation?.({
      startingStateId: startStateId,
      branchId,
      relativeTick,
      world: record.world,
      events: step.events,
    });
    executedTicks = record.world.tick - recordAtStart.world.tick;
    addEvents(eventSummary, step.events);

    for (const event of step.events) {
      semanticEventSequence.push(
        semanticEventKey(event, recordAtStart.world.tick),
      );
      if (isPoliticalEvent(event)) {
        politicalEventSequence.push(
          politicalEventKey(event, recordAtStart.world.tick),
        );
      }
    }

    if (firstStep) {
      actionId = record.world.run.actionLog.at(-1)?.id ?? null;
      immediate = createMetricSnapshot(
        scenario,
        record.world,
        playerCountryId,
        record.world.tick - recordAtStart.world.tick,
      );
    }

    if (checkpointOffsets.has(relativeTick)) {
      checkpoints.push(
        createMetricSnapshot(
          scenario,
          record.world,
          playerCountryId,
          relativeTick,
        ),
      );
    }

    firstStep = false;
  }

  const final = createMetricSnapshot(
    scenario,
    record.world,
    playerCountryId,
    record.world.tick - recordAtStart.world.tick,
  );

  return {
    startingStateId: startStateId,
    branchId,
    interventionId: branchDefinition.interventionId,
    accepted:
      branchDefinition.interventionId === null ||
      eventSummary.interventionStarted > 0,
    feasibility,
    actionId,
    executedTicks,
    immediate,
    checkpoints,
    final,
    events: { ...eventSummary },
    politicalEventSequence,
    semanticEventSequence,
    terminal: terminalAtHorizon(record.world),
  };
}

function auditScenarioSuitability(
  scenario: ScenarioDefinition,
  seed: number,
): F03ScenarioSuitability {
  const world = createInitialWorldState(scenario, seed);
  const playerCountryId = scenario.playerCountryId;
  const playerCountry =
    playerCountryId === null ? undefined : world.countries[playerCountryId];
  const feasible =
    playerCountryId === null
      ? []
      : Object.keys(scenario.interventionCatalog)
          .sort(compareStableText)
          .filter(
            (interventionId) =>
              evaluateInterventionFeasibility({
                scenario,
                world,
                interventionId: interventionId as InterventionId,
                countryId: playerCountryId,
              }).feasible,
          );
  const nonTrivialRegionCount = Object.values(world.regions).filter(
    (region) =>
      region.unrest > 0 ||
      region.scarcity > 0 ||
      Object.values(region.ideology).some(
        (state) =>
          state.support > 0 || state.radicalism > 0 || state.organization > 0,
      ),
  ).length;
  const findings: string[] = [];

  if (Object.keys(scenario.interventionCatalog).length === 0) {
    findings.push("intervention catalog is empty");
  }
  if ((playerCountry?.treasury ?? 0) <= 0) {
    findings.push(
      "player treasury does not provide a positive starting buffer",
    );
  }
  if (feasible.length < 2) {
    findings.push("fewer than two feasible intervention candidates");
  }
  if (nonTrivialRegionCount === 0) {
    findings.push(
      "regions do not expose non-trivial pressure or ideology state",
    );
  }
  if (Object.keys(world.factions).length === 0) {
    findings.push("no faction state is present");
  }
  if (scenario.mapContactTopology.contactEdges.length === 0) {
    findings.push("ContactGraph has no directed edges");
  }

  return {
    scenarioId: scenario.id,
    interventionCount: Object.keys(scenario.interventionCatalog).length,
    feasibleInterventionCount: feasible.length,
    feasibleInterventionIds: feasible,
    playerTreasury: playerCountry?.treasury ?? null,
    stateCapacity: playerCountry?.stateCapacity ?? null,
    factionCount: Object.keys(world.factions).length,
    nonTrivialRegionCount,
    contactEdgeCount: scenario.mapContactTopology.contactEdges.length,
    consolidationCriteriaConfigured:
      scenario.orderConsolidationCriteria.requiredConsecutiveTicks > 0 ||
      scenario.orderConsolidationCriteria.requiredStableRegionIds.length > 0,
    suitableForCounterfactuals: findings.length === 0,
    findings,
  };
}

function createComparison(
  wait: F03BranchResult,
  branch: F03BranchResult,
): F03CounterfactualComparison | null {
  if (branch.interventionId === null) {
    return null;
  }

  return compareBranches(wait, branch);
}

function observedTradeoffs(
  scenario: ScenarioDefinition,
  startingStates: readonly F03StartingStateResult[],
): readonly string[] {
  const observations: string[] = [];
  const shortDefinition =
    scenario.interventionCatalog[GATE1F_VALIDATION_INTERVENTION_IDS.short];
  const longDefinition =
    scenario.interventionCatalog[GATE1F_VALIDATION_INTERVENTION_IDS.long];
  const prerequisiteDefinition =
    scenario.interventionCatalog[
      GATE1F_VALIDATION_INTERVENTION_IDS.prerequisite
    ];

  if (shortDefinition !== undefined && longDefinition !== undefined) {
    observations.push(
      `short vs long: treasury cost ${shortDefinition.treasuryCost} vs ${longDefinition.treasuryCost}, administrative load ${shortDefinition.administrativeLoad} vs ${longDefinition.administrativeLoad}, duration ${shortDefinition.durationDays}d vs ${longDefinition.durationDays}d`,
    );
  }
  if (shortDefinition !== undefined && prerequisiteDefinition !== undefined) {
    observations.push(
      `short vs prerequisite: treasury cost ${shortDefinition.treasuryCost} vs ${prerequisiteDefinition.treasuryCost}, administrative load ${shortDefinition.administrativeLoad} vs ${prerequisiteDefinition.administrativeLoad}, duration ${shortDefinition.durationDays}d vs ${prerequisiteDefinition.durationDays}d`,
    );
  }

  const observedBranchIds = new Set<F03BranchId>();
  for (const state of startingStates) {
    for (const branch of state.branches) {
      if (
        branch.branchId !== F03_BRANCH_IDS.wait &&
        branch.accepted &&
        branch.immediate.administrativeLoad > 0
      ) {
        observedBranchIds.add(branch.branchId);
      }
    }
  }
  if (observedBranchIds.size > 0) {
    observations.push(
      "accepted interventions create distinct immediate treasury/commitment/headroom states; no morality label is assigned",
    );
  }

  return observations;
}

function createDownstreamAudit(
  scenario: ScenarioDefinition,
  causalAudits: readonly F03InterventionCausalAudit[],
): F03DownstreamAudit {
  const deadEnd = causalAudits
    .filter((audit) => audit.deadEnd)
    .map((audit) => audit.branchId);
  const observedConsumers = [
    "START_INTERVENTION ActionRecord → interventionCommitments + INTERVENTION_STARTED",
    "intervention commitment → economy treasury charge",
    "intervention commitment → administrative load/headroom feasibility read model",
    "administrative overload can feed the existing instability pressure selector when overload and weak state control coexist",
  ];
  const missingOrDeferredConsumers: string[] = [];

  if (causalAudits.some((audit) => audit.t017DownstreamDifference)) {
    observedConsumers.push(
      "completion effect → Region.resourceProductionCapacity → resources/scarcity → T017 material pressure",
    );
  }
  if (causalAudits.some((audit) => audit.t018DownstreamDifference)) {
    observedConsumers.push(
      "completion effect → Faction grievance/organization → T016 observations and T018 prerequisite read model",
    );
    observedConsumers.push(
      "Faction.organization → T021 operational-strength derivation when an active armed conflict reads the faction",
    );
  }
  if (deadEnd.length > 0) {
    missingOrDeferredConsumers.push(
      "some intervention definitions still have no observed non-cost downstream consumer",
    );
  }
  missingOrDeferredConsumers.push(
    "intervention-specific Government, LandHex, consolidation, or dissolution effects remain deferred",
  );

  return {
    actualStatePath: [
      "validated START_INTERVENTION action",
      "authoritative commitment",
      "economy treasury settlement",
      "administrative headroom/pressure selectors",
      ...(Object.values(scenario.interventionCatalog).some(
        (definition) => (definition.completionEffects?.length ?? 0) > 0,
      )
        ? ["completionTick → scenario-owned typed completion effect"]
        : []),
    ],
    observedConsumers,
    missingOrDeferredConsumers,
    deadEndInterventionBranches: [...new Set(deadEnd)].sort(
      compareStableText,
    ) as F03BranchId[],
  };
}

function comparisonDeltaSnapshots(
  comparison: F03CounterfactualComparison,
): readonly F03MetricDelta[] {
  return [
    comparison.deltas.day1,
    comparison.deltas.day180,
    comparison.deltas.oneYear,
    comparison.deltas.fiveYear,
    comparison.deltas.horizon,
  ];
}

function anyMetricDelta(
  comparison: F03CounterfactualComparison,
  predicate: (delta: F03MetricDelta) => boolean,
): boolean {
  return (
    comparison.accepted && comparisonDeltaSnapshots(comparison).some(predicate)
  );
}

function createCausalAudits(
  scenario: ScenarioDefinition,
  startingStates: readonly F03StartingStateResult[],
  comparisons: readonly F03CounterfactualComparison[],
): readonly F03InterventionCausalAudit[] {
  const branches = new Map(
    startingStates.flatMap((state) =>
      state.branches.map(
        (branch) => [`${state.id}:${branch.branchId}`, branch] as const,
      ),
    ),
  );

  return comparisons.map((comparison) => {
    const branch = branches.get(
      `${comparison.startingStateId}:${comparison.interventionBranchId}`,
    );
    if (branch === undefined) {
      throw new Error(
        `F03 missing branch for ${comparison.startingStateId}/${comparison.interventionBranchId}.`,
      );
    }

    const definition =
      scenario.interventionCatalog[comparison.interventionId as InterventionId];
    const completionEffectKinds = (definition?.completionEffects ?? []).map(
      (effect) => effect.kind,
    );
    const t017DownstreamDifference = anyMetricDelta(
      comparison,
      (delta) =>
        delta.maxRegionScarcity !== 0 ||
        delta.maxRegionUnrest !== 0 ||
        delta.instability !== 0,
    );
    const t018DownstreamDifference = anyMetricDelta(
      comparison,
      (delta) =>
        delta.factionOrganization !== 0 ||
        delta.factionGrievance !== 0 ||
        delta.coupEligibleCount !== 0 ||
        delta.rebellionEligibleCount !== 0,
    );

    return {
      startingStateId: comparison.startingStateId,
      branchId: comparison.interventionBranchId,
      interventionId: comparison.interventionId,
      completionEffectKinds,
      completionEffectsApplied: branch.events.interventionEffectsApplied,
      nonCostAuthoritativeStateChanged:
        t017DownstreamDifference || t018DownstreamDifference,
      t017DownstreamDifference,
      t018DownstreamDifference,
      existingDownstreamConsumerObserved:
        t017DownstreamDifference || t018DownstreamDifference,
      politicalHistoryDivergence: comparison.politicalHistoryDivergence,
      deadEnd: !(t017DownstreamDifference || t018DownstreamDifference),
    };
  });
}

function createConcerns(
  result: Pick<F03SurveyResult, "comparisons" | "downstream" | "playerAgency">,
): readonly string[] {
  const concerns: string[] = [];
  if (result.playerAgency === "PLAYER_AGENCY_NOT_OBSERVED") {
    concerns.push("PLAYER_AGENCY_CONCERN");
  } else if (result.playerAgency === "PLAYER_AGENCY_WEAK") {
    concerns.push("SHORT_LIVED_OR_ADMINISTRATIVE_ONLY_DIVERGENCE");
  }
  if (result.downstream.deadEndInterventionBranches.length > 0) {
    concerns.push("INTERVENTION_DOWNSTREAM_INTEGRATION_GAP");
  }
  if (
    result.comparisons.length > 0 &&
    result.comparisons.every(
      (comparison) => !comparison.politicalHistoryDivergence,
    )
  ) {
    concerns.push("NO_POLITICAL_HISTORY_DIVERGENCE_OBSERVED");
  }
  return concerns;
}

function classifyPlayerAgency(
  comparisons: readonly F03CounterfactualComparison[],
): F03PlayerAgencyClassification {
  const accepted = comparisons.filter((comparison) => comparison.accepted);
  const persistentPolitical = accepted.filter(
    (comparison) =>
      comparison.politicalHistoryDivergence &&
      (comparison.oneYearStateDivergence ||
        comparison.fiveYearStateDivergence ||
        comparison.outcomeDivergence),
  );
  const immediateOrMedium = accepted.filter(
    (comparison) =>
      comparison.immediateStateDivergence ||
      comparison.oneYearStateDivergence ||
      comparison.historyDivergence,
  );

  if (persistentPolitical.length >= 2) {
    return "PLAYER_AGENCY_OBSERVED";
  }
  if (immediateOrMedium.length > 0) {
    return "PLAYER_AGENCY_WEAK";
  }
  return "PLAYER_AGENCY_NOT_OBSERVED";
}

function surveySignature(
  result: Omit<
    F03SurveyResult,
    "deterministicSignature" | "wallClockMilliseconds" | "ticksPerSecond"
  >,
): string {
  return JSON.stringify({
    scenarioId: result.scenarioId,
    scenarioVersion: result.scenarioVersion,
    seed: result.seed,
    policy: result.policy,
    horizonYears: result.horizonYears,
    requestedTicksPerBranch: result.requestedTicksPerBranch,
    totalExecutedTicks: result.totalExecutedTicks,
    t021Suitability: result.t021Suitability,
    usedScenarioSuitability: result.usedScenarioSuitability,
    startingStates: result.startingStates,
    comparisons: result.comparisons,
    causalAudits: result.causalAudits,
    tradeoffObservations: result.tradeoffObservations,
    downstream: result.downstream,
    playerAgency: result.playerAgency,
    concerns: result.concerns,
  });
}

function assertF03Config(
  scenario: ScenarioDefinition,
  seed: number,
  horizonYears: number,
  options: F03SurveyOptions,
): void {
  if (scenario.playerCountryId === null) {
    throw new Error("F03 requires a scenario with a player CountryId.");
  }
  if (!Number.isSafeInteger(seed)) {
    throw new Error("F03 seed must be a safe integer.");
  }
  if (
    !Number.isInteger(horizonYears) ||
    horizonYears <= 0 ||
    horizonYears > 20
  ) {
    throw new Error("F03 supports a horizon from 1 to 20 simulated years.");
  }

  const checkpoints =
    options.startingCheckpointTicks ?? F03_STARTING_CHECKPOINT_TICKS;
  if (
    checkpoints.length === 0 ||
    checkpoints.some((tick) => !Number.isInteger(tick) || tick < 0)
  ) {
    throw new Error(
      "F03 starting checkpoints must be non-negative integer ticks.",
    );
  }
  if (options.branchOrder !== undefined) {
    validateBranchOrder(options.branchOrder);
  }
}

/** Run F03 from one identical authoritative snapshot per branch. */
export function runF03Survey(
  scenario: ScenarioDefinition,
  seed: number,
  horizonYears: number = F03_HORIZON_YEARS,
  options: F03SurveyOptions = {},
): F03SurveyResult {
  assertF03Config(scenario, seed, horizonYears, options);
  const start = globalThis.performance?.now() ?? Date.now();
  const playerCountryId = scenario.playerCountryId!;
  const branchOrder = validateBranchOrder(
    options.branchOrder ?? defaultBranchOrder(),
  );
  const checkpointTicks: number[] = [
    ...new Set(
      [
        ...(options.startingCheckpointTicks ?? F03_STARTING_CHECKPOINT_TICKS),
      ].sort(compareNumbers),
    ),
  ];
  const initial = createCanonicalInitialRecord(scenario, seed);
  const checkpointRecords = new Map<number, RunRecord>();
  let waitRecord = initial;
  for (const checkpointTick of checkpointTicks) {
    waitRecord = runWaitToTick(scenario, waitRecord, checkpointTick);
    checkpointRecords.set(checkpointTick, waitRecord);
  }

  const startingStates: F03StartingStateResult[] = [];
  for (const checkpointTick of checkpointTicks) {
    const checkpointRecord = checkpointRecords.get(checkpointTick)!;
    const branchResults = branchOrder
      .map((branchId) =>
        createBranchResult(
          scenario,
          `STATE_${String.fromCharCode(65 + startingStates.length)}`,
          checkpointRecord,
          branchId,
          horizonYears,
          options.onBranchObservation,
        ),
      )
      .sort((first, second) =>
        compareStableText(first.branchId, second.branchId),
      );
    const stateId = `STATE_${String.fromCharCode(65 + startingStates.length)}`;
    startingStates.push({
      id: stateId,
      checkpointTick,
      label:
        checkpointTick === 0
          ? "initial pressure state"
          : `natural WAIT checkpoint at day ${checkpointTick}`,
      snapshot: createMetricSnapshot(
        scenario,
        checkpointRecord.world,
        playerCountryId,
        0,
      ),
      branches: branchResults.map((branch) => ({
        ...branch,
        startingStateId: stateId,
      })),
    });
  }

  const comparisons: F03CounterfactualComparison[] = [];
  for (const state of startingStates) {
    const wait = state.branches.find(
      (branch) => branch.branchId === F03_BRANCH_IDS.wait,
    );
    if (wait === undefined) {
      throw new Error(`F03 ${state.id} is missing WAIT branch.`);
    }
    for (const branch of state.branches) {
      const comparison = createComparison(wait, branch);
      if (comparison !== null) {
        comparisons.push(comparison);
      }
    }
  }

  const tradeoffObservations = observedTradeoffs(scenario, startingStates);
  const causalAudits = createCausalAudits(
    scenario,
    startingStates,
    comparisons,
  );
  const downstream = createDownstreamAudit(scenario, causalAudits);
  const playerAgency = classifyPlayerAgency(comparisons);
  const concerns = createConcerns({
    comparisons,
    downstream,
    playerAgency,
  });
  const totalExecutedTicks = startingStates.reduce(
    (total, state) =>
      total +
      state.branches.reduce(
        (stateTotal, branch) => stateTotal + branch.executedTicks,
        0,
      ),
    0,
  );
  const elapsed = (globalThis.performance?.now() ?? Date.now()) - start;
  const t021Suitability = auditScenarioSuitability(
    createT021AuditScenario(),
    seed,
  );
  const usedScenarioSuitability = auditScenarioSuitability(scenario, seed);
  const withoutSignature = {
    scenarioId: scenario.id,
    scenarioVersion: scenario.version,
    seed,
    policy: "WAIT plus one legal intervention" as const,
    horizonYears,
    requestedTicksPerBranch: horizonYears * F03_DAYS_PER_YEAR,
    totalExecutedTicks,
    t021Suitability,
    usedScenarioSuitability,
    startingStates,
    comparisons,
    causalAudits,
    tradeoffObservations,
    downstream,
    playerAgency,
    concerns,
  };
  return {
    ...withoutSignature,
    wallClockMilliseconds: elapsed,
    ticksPerSecond: elapsed > 0 ? (totalExecutedTicks / elapsed) * 1000 : 0,
    deterministicSignature: surveySignature(withoutSignature),
  };
}

function createT021AuditScenario(): ScenarioDefinition {
  // Kept local so the suitability audit stays explicit and cannot silently
  // turn the T021 fixture into the F03 execution scenario.
  return createT021RebellionScenario();
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}

function formatDelta(delta: F03MetricDelta): string {
  return `treasury ${formatNumber(delta.treasury)}, scarcity ${formatNumber(delta.maxRegionScarcity)}, unrest ${formatNumber(delta.maxRegionUnrest)}, factionOrg ${formatNumber(delta.factionOrganization)}, grievance ${formatNumber(delta.factionGrievance)}, crisisEligibility coup/rebellion ${formatNumber(delta.coupEligibleCount)}/${formatNumber(delta.rebellionEligibleCount)}, adminLoad ${formatNumber(delta.administrativeLoad)}, headroom ${formatNumber(delta.administrativeHeadroom)}, territory ${formatNumber(delta.controlledLandHexes)}, consolidation ${formatNumber(delta.consolidationStreak)}`;
}

function formatBranchLine(stateId: string, branch: F03BranchResult): string {
  const feasibility =
    branch.feasibility === null
      ? "n/a"
      : branch.feasibility.feasible
        ? "feasible"
        : `INFEASIBLE (${branch.feasibility.reasons.map((reason) => reason.kind).join(", ")})`;
  return `| ${stateId} | ${branch.branchId} | ${branch.accepted ? "YES" : "NO"} | ${feasibility} | ${branch.executedTicks} | ${formatNumber(branch.final.treasury)} | ${formatNumber(branch.final.instability)} | ${branch.final.controlledLandHexes} | ${branch.events.rebellions}/${branch.events.coups}/${branch.events.civilWars} | ${branch.events.interventionEffectsApplied} |`;
}

function formatComparisonLine(comparison: F03CounterfactualComparison): string {
  return `| ${comparison.startingStateId} | ${comparison.interventionBranchId} | ${comparison.accepted ? "YES" : "NO"} | ${comparison.firstMeaningfulDivergenceTick ?? "none"} | ${comparison.oneYearStateDivergence ? "YES" : "NO"} | ${comparison.fiveYearStateDivergence ? "YES" : "NO"} | ${comparison.politicalHistoryDivergence ? "YES" : "NO"} | ${comparison.stateReConvergedAtHorizon ? "YES" : "NO"} |`;
}

/** Compact Korean developer report; no opaque agency score is produced. */
export function formatF03Inspection(report: F03InspectionReport): string {
  const lines = [
    "F03 Intervention Counterfactuals",
    "",
    `Scenario: ${report.result.scenarioId} v${report.result.scenarioVersion}`,
    `Policy: WAIT plus one legal intervention`,
    `Seed: ${report.result.seed}`,
    `Horizon: ${report.result.horizonYears} years / ${report.result.requestedTicksPerBranch} ticks per branch`,
    `Branches: ${report.result.startingStates.length} starting states × 4 branches`,
    "",
    "Scenario suitability:",
    `T021 fixture: ${report.result.t021Suitability.suitableForCounterfactuals ? "SUITABLE" : "UNSUITABLE"} — ${report.result.t021Suitability.findings.join("; ") || "none"}`,
    `Gate1F fixture: ${report.result.usedScenarioSuitability.suitableForCounterfactuals ? "SUITABLE" : "UNSUITABLE"} — feasible interventions ${report.result.usedScenarioSuitability.feasibleInterventionCount}/${report.result.usedScenarioSuitability.interventionCount}`,
    "",
    "Branch summary:",
    "| state | branch | accepted | feasibility | ticks | final treasury | final instability | final Hex | political events R/Coup/CW | effects |",
    "| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...report.result.startingStates.flatMap((state) => [
      `| ${state.id} | checkpoint day ${state.checkpointTick} | — | — | — | start ${formatNumber(state.snapshot.treasury)} | start ${formatNumber(state.snapshot.instability)} | start ${state.snapshot.controlledLandHexes} | — |`,
      ...state.branches.map((branch) => formatBranchLine(state.id, branch)),
    ]),
    "",
    "Counterfactual divergence vs WAIT:",
    "| state | intervention | accepted | first divergence day | +1y state | +5y state | political history | state reconverged |",
    "| --- | --- | --- | ---: | --- | --- | --- | --- |",
    ...report.result.comparisons.map(formatComparisonLine),
    "",
    "Representative deltas:",
    ...report.result.comparisons.map(
      (comparison) =>
        `- ${comparison.startingStateId}/${comparison.interventionBranchId} day180: ${formatDelta(comparison.deltas.day180)}; 1y: ${formatDelta(comparison.deltas.oneYear)}; horizon: ${formatDelta(comparison.deltas.horizon)}`,
    ),
    "",
    "Causal effect audit:",
    "| state | branch | completion effects | applied | non-cost state | T017 consumer | T018 consumer | political history | dead-end |",
    "| --- | --- | --- | ---: | --- | --- | --- | --- | --- |",
    ...report.result.causalAudits.map(
      (audit) =>
        `| ${audit.startingStateId} | ${audit.branchId} | ${audit.completionEffectKinds.join(", ") || "none"} | ${audit.completionEffectsApplied} | ${audit.nonCostAuthoritativeStateChanged ? "YES" : "NO"} | ${audit.t017DownstreamDifference ? "YES" : "NO"} | ${audit.t018DownstreamDifference ? "YES" : "NO"} | ${audit.politicalHistoryDivergence ? "YES" : "NO"} | ${audit.deadEnd ? "YES" : "NO"} |`,
    ),
    "",
    "Downstream integration:",
    ...report.result.downstream.actualStatePath.map((path) => `- ${path}`),
    "Observed consumers:",
    ...report.result.downstream.observedConsumers.map(
      (consumer) => `- ${consumer}`,
    ),
    "Missing/deferred consumers:",
    ...report.result.downstream.missingOrDeferredConsumers.map(
      (consumer) => `- ${consumer}`,
    ),
    `Dead-end candidate branches: ${report.result.downstream.deadEndInterventionBranches.join(", ") || "none"}`,
    "",
    "Trade-offs:",
    ...report.result.tradeoffObservations.map(
      (observation) => `- ${observation}`,
    ),
    "",
    `Player agency: ${report.result.playerAgency}`,
    `Concerns: ${report.result.concerns.join(", ") || "none"}`,
    "",
    "Performance:",
    `total executed ticks: ${report.result.totalExecutedTicks}`,
    `runtime: ${report.result.wallClockMilliseconds.toFixed(2)} ms`,
    `effective ticks/sec: ${formatNumber(report.result.ticksPerSecond)}`,
    "",
    "Balance changes: NONE",
    "New gameplay system: NO",
    "Existing intervention downstream integration: YES",
    "F04: COMPLETE / F05 NOT_READY",
    "V02: NOT STARTED",
    `Inspection invariants: ${report.allPassed ? "PASS" : "FAIL"}`,
  ];

  return lines.join("\n");
}

export function runF03Inspection(): F03InspectionReport {
  const scenario = createGate1FValidationScenario();
  const result = runF03Survey(scenario, F03_DEFAULT_SEED, F03_HORIZON_YEARS);
  const acceptedAudits = result.causalAudits.filter((audit) => {
    const branch = result.startingStates
      .find((state) => state.id === audit.startingStateId)
      ?.branches.find((candidate) => candidate.branchId === audit.branchId);
    return branch?.accepted === true;
  });
  const downstreamIntegrationObserved =
    acceptedAudits.filter((audit) => audit.existingDownstreamConsumerObserved)
      .length >= 2;
  const report: F03InspectionReport = {
    result,
    allPassed:
      result.usedScenarioSuitability.suitableForCounterfactuals &&
      result.startingStates.every((state) =>
        state.branches.every((branch) => branch.final.outcome !== undefined),
      ) &&
      downstreamIntegrationObserved,
    output: "",
  };
  return { ...report, output: formatF03Inspection(report) };
}

export function getF03SurveyDeterministicSignature(
  result: F03SurveyResult,
): string {
  return result.deterministicSignature;
}

export function printF03Inspection(): void {
  const report = runF03Inspection();
  console.log(report.output);
}
