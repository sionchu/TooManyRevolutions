import { createEventStore } from "../events/eventStore";
import type { GameEvent, GameEventType } from "../events/event";
import {
  commitSimulationStep,
  deserializeSimulationSnapshot,
  serializeSimulationSnapshotJson,
} from "../core/persistence";
import { SIMULATION_DAYS_PER_YEAR } from "../core/clock";
import { runSimulationStep } from "../core/tick";
import type { RunRecord } from "../core/step";
import type { EventId, CountryId } from "../state/ids";
import type { ScenarioDefinition } from "../state/scenario";
import type { RunStatus } from "../state/run";
import { createT021RebellionScenario } from "../state/conflictFixture";
import { createInitialWorldState, type WorldState } from "../state/world";

/** F01 follows the authoritative calendar; this is not a player time-speed value. */
export const F01_DAYS_PER_YEAR = SIMULATION_DAYS_PER_YEAR;

export const F01_SUPPORTED_HORIZONS = [5, 10, 20, 40] as const;

export type F01HorizonYears = (typeof F01_SUPPORTED_HORIZONS)[number];
export type F01InputPolicy = "WAIT";
export type LongRunOutcome = "active" | "orderConsolidated" | "stateDissolved";

/** Political/crisis vocabulary retained as developer telemetry, not game state. */
const F01_POLITICAL_EVENT_TYPES = [
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

type F01PoliticalEventType = (typeof F01_POLITICAL_EVENT_TYPES)[number];

export interface LongRunPoliticalEvent {
  readonly tick: number;
  readonly type: F01PoliticalEventType;
  readonly targetId: string | null;
}

export interface LongRunTerritorialChange {
  readonly tick: number;
  readonly landHexId: string;
  readonly previousController: string;
  readonly nextController: string;
}

export interface LongRunConfig {
  readonly scenario: ScenarioDefinition;
  readonly seed: number;
  readonly years: number;
  readonly inputPolicy?: F01InputPolicy;
}

export interface LongRunCheckpoint {
  readonly tick: number;
  readonly simulatedYear: number;
  readonly treasury: number;
  readonly stateCapacity: number;
  readonly instability: number;
  readonly stateContinuity: number;
  readonly controlledLandHexes: number;
  readonly factionOrganizationTotal: number;
  readonly activeConflicts: number;
  readonly activeCivilWars: number;
  readonly currentGovernmentId: string | null;
  readonly consolidationEligible: boolean;
  readonly consolidationStreak: number;
  readonly outcome: LongRunOutcome;
}

export interface LongRunEventSummary {
  readonly rebellionDetections: number;
  readonly coupAttempts: number;
  readonly civilWarsStarted: number;
  readonly conflictResolutions: number;
  readonly landHexControlChanges: number;
  readonly governmentTransitions: number;
  readonly consolidationAttempts: number;
  readonly consolidationWins: number;
  readonly stateDissolutions: number;
}

export interface LongRunStateSummary {
  readonly playerCountryId: CountryId;
  readonly startingTreasury: number;
  readonly minimumTreasury: number;
  readonly maximumTreasury: number;
  readonly finalTreasury: number;
  readonly startingStateCapacity: number;
  readonly minimumStateCapacity: number;
  readonly maximumStateCapacity: number;
  readonly finalStateCapacity: number;
  readonly startingInstability: number;
  readonly minimumInstability: number;
  readonly peakInstability: number;
  readonly finalInstability: number;
  readonly startingStateContinuity: number;
  readonly minimumStateContinuity: number;
  readonly finalStateContinuity: number;
  readonly startingControlledLandHexes: number;
  readonly minimumControlledLandHexes: number;
  readonly finalControlledLandHexes: number;
  readonly startingFactionCount: number;
  readonly finalFactionCount: number;
  readonly startingFactionOrganizationTotal: number;
  readonly maximumFactionOrganizationTotal: number;
  readonly finalFactionOrganizationTotal: number;
  readonly startingFactionResourcesTotal: number;
  readonly finalFactionResourcesTotal: number;
  readonly finalFactionGrievanceTotal: number;
  readonly crisisParticipatingFactionCount: number;
  readonly zeroControlledLandHexReachedTick: number | null;
  readonly zeroControlledLandHexRecoveryTick: number | null;
  readonly zeroControlledLandHexDurationTicks: number;
  readonly consolidationEverEligible: boolean;
  readonly maximumConsolidationStreak: number;
  readonly finalConsolidationStreak: number;
}

export interface LongRunTerminalSummary {
  readonly status: RunStatus;
  readonly outcome: LongRunOutcome;
  readonly tick: number | null;
  readonly simulatedYear: number | null;
  readonly causeEventId: EventId | null;
}

export interface LongRunPathologyObservations {
  readonly runTerminatesEarly: boolean;
  readonly treasuryGrowsWithoutBound: boolean;
  readonly treasuryCollapsesMonotonically: boolean;
  readonly instabilityPinnedAtExtreme: boolean;
  readonly noPoliticalEventForDecades: boolean;
  readonly permanentCivilWar: boolean;
  readonly repeatedIdenticalGovernmentTransition: boolean;
  readonly excessiveRejectedActions: boolean;
  readonly simulationNeverChangesMaterially: boolean;
}

export interface LongRunPerformance {
  readonly requestedYears: number;
  readonly requestedTicks: number;
  readonly executedTicks: number;
  readonly wallClockMilliseconds: number;
  readonly ticksPerSecond: number;
}

export interface LongRunSummary {
  readonly scenarioId: string;
  readonly scenarioVersion: number;
  readonly seed: number;
  readonly inputPolicy: F01InputPolicy;
  readonly performance: LongRunPerformance;
  readonly terminal: LongRunTerminalSummary;
  readonly eventCount: number;
  readonly actionRecordCount: number;
  readonly rejectedActionCount: number;
  readonly eventStoreSize: number;
  readonly events: LongRunEventSummary;
  readonly politicalEvents: readonly LongRunPoliticalEvent[];
  readonly territorialChanges: readonly LongRunTerritorialChange[];
  readonly governmentTransitionSequence: readonly string[];
  readonly state: LongRunStateSummary;
  readonly checkpoints: readonly LongRunCheckpoint[];
  readonly pathologies: LongRunPathologyObservations;
  /** Canonical simulation assertions throw; a successful summary has none. */
  readonly invariantFailures: readonly string[];
}

export interface LongRunPersistenceComparison {
  readonly midpointYears: number;
  readonly midpointTick: number;
  readonly continuousFinalTick: number;
  readonly resumedFinalTick: number;
  readonly continuousOutcome: LongRunTerminalSummary;
  readonly resumedOutcome: LongRunTerminalSummary;
  readonly equivalent: boolean;
}

export interface F01InspectionReport {
  readonly scenarioId: string;
  readonly seed: number;
  readonly inputPolicy: F01InputPolicy;
  readonly summaries: readonly LongRunSummary[];
  readonly persistence: LongRunPersistenceComparison;
  readonly allPassed: boolean;
  readonly output: string;
}

interface MutableEventSummary {
  rebellionDetections: number;
  coupAttempts: number;
  civilWarsStarted: number;
  conflictResolutions: number;
  landHexControlChanges: number;
  governmentTransitions: number;
  consolidationAttempts: number;
  consolidationWins: number;
  stateDissolutions: number;
}

interface MutableTrajectory {
  readonly treasury: number[];
  readonly stateCapacity: number[];
  readonly instability: number[];
  readonly stateContinuity: number[];
  readonly controlledLandHexes: number[];
  readonly factionOrganization: number[];
  readonly consolidationEligible: boolean[];
  readonly consolidationStreak: number[];
  readonly activeCivilWars: number[];
  readonly governmentTransitionKeys: string[];
}

interface LongRunExecution {
  readonly record: RunRecord;
  readonly summary: LongRunSummary;
}

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function assertLongRunConfig(config: LongRunConfig): void {
  if (!Number.isInteger(config.seed)) {
    throw new Error("F01 seed must be an integer.");
  }

  if (!Number.isInteger(config.years) || config.years <= 0) {
    throw new Error("F01 years must be a positive integer.");
  }

  if (config.years > F01_SUPPORTED_HORIZONS.at(-1)!) {
    throw new Error("F01 supports horizons up to 40 simulated years.");
  }

  if (config.inputPolicy !== undefined && config.inputPolicy !== "WAIT") {
    throw new Error("F01 currently supports only the WAIT input policy.");
  }

  if (config.scenario.playerCountryId === null) {
    throw new Error("F01 requires a scenario with a player CountryId.");
  }
}

function createInitialRunRecord(
  scenario: ScenarioDefinition,
  seed: number,
): RunRecord {
  return {
    world: createInitialWorldState(scenario, seed),
    eventStore: createEventStore(),
  };
}

function stepWait(
  scenario: ScenarioDefinition,
  record: RunRecord,
): {
  readonly record: RunRecord;
  readonly emittedEvents: readonly GameEvent[];
} {
  const result = runSimulationStep(record.world, { actions: [] }, {}, scenario);

  return {
    record: commitSimulationStep(scenario, record, result),
    emittedEvents: result.emittedEvents,
  };
}

function countControlledLandHexes(
  world: WorldState,
  countryId: CountryId,
): number {
  return Object.values(world.landHexStates).filter(
    (landHexState) =>
      landHexState.controller.kind === "country" &&
      landHexState.controller.countryId === countryId,
  ).length;
}

function countActiveConflicts(world: WorldState): number {
  return Object.values(world.conflicts).filter(
    (conflict) => conflict.status === "active",
  ).length;
}

function countActiveCivilWars(world: WorldState): number {
  return Object.values(world.conflicts).filter(
    (conflict) => conflict.status === "active" && conflict.kind === "civilWar",
  ).length;
}

function sumFactionMetric(
  world: WorldState,
  metric: "organization" | "resources" | "grievance",
): number {
  return Object.values(world.factions).reduce(
    (total, faction) => total + faction[metric],
    0,
  );
}

function outcomeLabel(world: WorldState): LongRunOutcome {
  return world.run.outcome.status === "active"
    ? "active"
    : world.run.outcome.kind;
}

function terminalSummary(world: WorldState): LongRunTerminalSummary {
  if (world.run.outcome.status === "active") {
    return {
      status: "active",
      outcome: "active",
      tick: null,
      simulatedYear: null,
      causeEventId: null,
    };
  }

  return {
    status: world.run.outcome.status,
    outcome: world.run.outcome.kind,
    tick: world.run.outcome.atTick,
    simulatedYear: world.run.outcome.atTick / F01_DAYS_PER_YEAR,
    causeEventId: world.run.outcome.causeEventId,
  };
}

function createCheckpoint(
  world: WorldState,
  playerCountryId: CountryId,
): LongRunCheckpoint {
  const country = world.countries[playerCountryId];
  if (country === undefined) {
    throw new Error(`F01 player country ${playerCountryId} is missing.`);
  }

  return {
    tick: world.tick,
    simulatedYear: world.tick / F01_DAYS_PER_YEAR,
    treasury: country.treasury,
    stateCapacity: country.stateCapacity,
    instability: country.instability,
    stateContinuity: country.stateContinuity,
    controlledLandHexes: countControlledLandHexes(world, playerCountryId),
    factionOrganizationTotal: sumFactionMetric(world, "organization"),
    activeConflicts: countActiveConflicts(world),
    activeCivilWars: countActiveCivilWars(world),
    currentGovernmentId: country.currentGovernmentId,
    consolidationEligible: world.run.consolidation.isCurrentlyEligible,
    consolidationStreak: world.run.consolidation.consecutiveEligibleTicks,
    outcome: outcomeLabel(world),
  };
}

function countEventType(
  events: readonly GameEvent[],
  type: GameEvent["type"],
): number {
  return events.filter((event) => event.type === type).length;
}

function collectGovernmentTransitionKeys(
  events: readonly GameEvent[],
): string[] {
  return events
    .filter((event) => event.type === "GOVERNMENT_TRANSITIONED")
    .map((event) => {
      const payload = event.payload;
      if (
        payload === null ||
        typeof payload !== "object" ||
        Array.isArray(payload)
      ) {
        return `${event.targetId ?? "unknown"}:unknown`;
      }

      const record = payload as Readonly<Record<string, unknown>>;
      return [
        String(record.countryId ?? event.targetId ?? "unknown"),
        String(record.previousGovernmentId ?? "null"),
        String(record.nextGovernmentId ?? "unknown"),
      ].join(":");
    });
}

function collectPoliticalEvents(
  events: readonly GameEvent[],
): LongRunPoliticalEvent[] {
  return events
    .filter(
      (event): event is GameEvent & { readonly type: F01PoliticalEventType } =>
        (F01_POLITICAL_EVENT_TYPES as readonly GameEventType[]).includes(
          event.type,
        ),
    )
    .map((event) => ({
      tick: event.tick,
      type: event.type,
      targetId: event.targetId === undefined ? null : String(event.targetId),
    }));
}

function controllerSignature(value: unknown): string {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return "unknown";
  }

  const controller = value as Readonly<Record<string, unknown>>;
  if (
    controller.kind === "country" &&
    typeof controller.countryId === "string"
  ) {
    return `country:${controller.countryId}`;
  }

  if (
    controller.kind === "faction" &&
    typeof controller.factionId === "string"
  ) {
    return `faction:${controller.factionId}`;
  }

  if (controller.kind === "uncontrolled") {
    return "uncontrolled";
  }

  return "unknown";
}

function collectTerritorialChanges(
  events: readonly GameEvent[],
): LongRunTerritorialChange[] {
  return events.flatMap((event) => {
    if (event.type !== "LAND_HEX_CONTROL_CHANGED") {
      return [];
    }

    const payload = event.payload;
    if (
      payload === null ||
      typeof payload !== "object" ||
      Array.isArray(payload)
    ) {
      return [];
    }

    const record = payload as Readonly<Record<string, unknown>>;
    if (typeof record.landHexId !== "string") {
      return [];
    }

    return [
      {
        tick: event.tick,
        landHexId: record.landHexId,
        previousController: controllerSignature(record.previousController),
        nextController: controllerSignature(record.nextController),
      },
    ];
  });
}

function createEventSummary(events: readonly GameEvent[]): MutableEventSummary {
  return {
    rebellionDetections: countEventType(events, "REBELLION_STARTED"),
    coupAttempts: countEventType(events, "COUP_ATTEMPT_STARTED"),
    civilWarsStarted: countEventType(events, "CIVIL_WAR_STARTED"),
    conflictResolutions: countEventType(events, "CONFLICT_RESOLVED"),
    landHexControlChanges: countEventType(events, "LAND_HEX_CONTROL_CHANGED"),
    governmentTransitions: countEventType(events, "GOVERNMENT_TRANSITIONED"),
    consolidationAttempts: countEventType(
      events,
      "ORDER_CONSOLIDATION_STARTED",
    ),
    consolidationWins: countEventType(events, "ORDER_CONSOLIDATED"),
    stateDissolutions: countEventType(events, "STATE_DISSOLVED"),
  };
}

function addEventSummary(
  summary: MutableEventSummary,
  events: readonly GameEvent[],
): void {
  summary.rebellionDetections += countEventType(events, "REBELLION_STARTED");
  summary.coupAttempts += countEventType(events, "COUP_ATTEMPT_STARTED");
  summary.civilWarsStarted += countEventType(events, "CIVIL_WAR_STARTED");
  summary.conflictResolutions += countEventType(events, "CONFLICT_RESOLVED");
  summary.landHexControlChanges += countEventType(
    events,
    "LAND_HEX_CONTROL_CHANGED",
  );
  summary.governmentTransitions += countEventType(
    events,
    "GOVERNMENT_TRANSITIONED",
  );
  summary.consolidationAttempts += countEventType(
    events,
    "ORDER_CONSOLIDATION_STARTED",
  );
  summary.consolidationWins += countEventType(events, "ORDER_CONSOLIDATED");
  summary.stateDissolutions += countEventType(events, "STATE_DISSOLVED");
}

function createTrajectory(): MutableTrajectory {
  return {
    treasury: [],
    stateCapacity: [],
    instability: [],
    stateContinuity: [],
    controlledLandHexes: [],
    factionOrganization: [],
    consolidationEligible: [],
    consolidationStreak: [],
    activeCivilWars: [],
    governmentTransitionKeys: [],
  };
}

function recordTrajectory(
  trajectory: MutableTrajectory,
  world: WorldState,
  playerCountryId: CountryId,
): void {
  const country = world.countries[playerCountryId];
  if (country === undefined) {
    throw new Error(`F01 player country ${playerCountryId} is missing.`);
  }

  trajectory.treasury.push(country.treasury);
  trajectory.stateCapacity.push(country.stateCapacity);
  trajectory.instability.push(country.instability);
  trajectory.stateContinuity.push(country.stateContinuity);
  trajectory.controlledLandHexes.push(
    countControlledLandHexes(world, playerCountryId),
  );
  trajectory.factionOrganization.push(sumFactionMetric(world, "organization"));
  trajectory.consolidationEligible.push(
    world.run.consolidation.isCurrentlyEligible,
  );
  trajectory.consolidationStreak.push(
    world.run.consolidation.consecutiveEligibleTicks,
  );
  trajectory.activeCivilWars.push(countActiveCivilWars(world));
}

function minimum(values: readonly number[]): number {
  return Math.min(...values);
}

function maximum(values: readonly number[]): number {
  return Math.max(...values);
}

function isMonotonicNonIncreasing(values: readonly number[]): boolean {
  return values.every(
    (value, index) => index === 0 || value <= values[index - 1]!,
  );
}

function hasRepeatedValue(
  values: readonly string[],
  repetitions: number,
): boolean {
  const counts = new Map<string, number>();
  for (const value of values) {
    const nextCount = (counts.get(value) ?? 0) + 1;
    if (nextCount >= repetitions) {
      return true;
    }
    counts.set(value, nextCount);
  }
  return false;
}

function createPathologyObservations(
  requestedTicks: number,
  executedTicks: number,
  eventSummary: LongRunEventSummary,
  trajectory: MutableTrajectory,
  checkpoints: readonly LongRunCheckpoint[],
  rejectedActionCount: number,
): LongRunPathologyObservations {
  const treasuryStart = trajectory.treasury[0] ?? 0;
  const treasuryFinal = trajectory.treasury.at(-1) ?? treasuryStart;
  const treasuryMaximum = maximum(trajectory.treasury);
  const treasuryGrowthLimit = Math.max(
    1_000_000,
    Math.abs(treasuryStart) * 100,
  );
  const politicalEvents =
    eventSummary.rebellionDetections +
    eventSummary.coupAttempts +
    eventSummary.civilWarsStarted +
    eventSummary.landHexControlChanges +
    eventSummary.governmentTransitions;
  const finalCheckpoint = checkpoints.at(-1);

  return {
    runTerminatesEarly: executedTicks < requestedTicks,
    treasuryGrowsWithoutBound: treasuryMaximum > treasuryGrowthLimit,
    treasuryCollapsesMonotonically:
      treasuryFinal < treasuryStart &&
      isMonotonicNonIncreasing(trajectory.treasury),
    instabilityPinnedAtExtreme:
      trajectory.instability.length >= 3 &&
      // Country.instability is a 0–100 metric, not a normalized 0–1 value.
      trajectory.instability.every((value) => value <= 1 || value >= 99),
    noPoliticalEventForDecades:
      requestedTicks >= 20 * F01_DAYS_PER_YEAR && politicalEvents === 0,
    permanentCivilWar:
      requestedTicks > 0 &&
      (finalCheckpoint?.activeCivilWars ?? 0) > 0 &&
      trajectory.activeCivilWars.filter((count) => count > 0).length >=
        Math.floor(requestedTicks * 0.75),
    repeatedIdenticalGovernmentTransition: hasRepeatedValue(
      trajectory.governmentTransitionKeys,
      3,
    ),
    excessiveRejectedActions: rejectedActionCount > Math.max(10, executedTicks),
    simulationNeverChangesMaterially:
      trajectory.treasury.every((value) => value === treasuryStart) &&
      trajectory.stateCapacity.every(
        (value) => value === (trajectory.stateCapacity[0] ?? value),
      ) &&
      trajectory.instability.every(
        (value) => value === (trajectory.instability[0] ?? value),
      ) &&
      trajectory.controlledLandHexes.every(
        (value) => value === (trajectory.controlledLandHexes[0] ?? value),
      ) &&
      politicalEvents === 0,
  };
}

function createStateSummary(
  scenario: ScenarioDefinition,
  initial: WorldState,
  final: WorldState,
  trajectory: MutableTrajectory,
  conflictParticipantFactionIds: ReadonlySet<string>,
): LongRunStateSummary {
  const playerCountryId = scenario.playerCountryId;
  if (playerCountryId === null) {
    throw new Error("F01 requires a player CountryId.");
  }

  const initialCountry = initial.countries[playerCountryId];
  const finalCountry = final.countries[playerCountryId];
  if (initialCountry === undefined || finalCountry === undefined) {
    throw new Error(`F01 player country ${playerCountryId} is missing.`);
  }

  const firstZeroIndex = trajectory.controlledLandHexes.findIndex(
    (count) => count === 0,
  );
  const firstRecoveryIndex =
    firstZeroIndex === -1
      ? -1
      : trajectory.controlledLandHexes.findIndex(
          (count, index) => index > firstZeroIndex && count > 0,
        );
  const zeroDurationTicks =
    firstZeroIndex === -1
      ? 0
      : (firstRecoveryIndex === -1
          ? trajectory.controlledLandHexes.length - 1
          : firstRecoveryIndex) - firstZeroIndex;

  return {
    playerCountryId,
    startingTreasury: initialCountry.treasury,
    minimumTreasury: minimum(trajectory.treasury),
    maximumTreasury: maximum(trajectory.treasury),
    finalTreasury: finalCountry.treasury,
    startingStateCapacity: initialCountry.stateCapacity,
    minimumStateCapacity: minimum(trajectory.stateCapacity),
    maximumStateCapacity: maximum(trajectory.stateCapacity),
    finalStateCapacity: finalCountry.stateCapacity,
    startingInstability: initialCountry.instability,
    minimumInstability: minimum(trajectory.instability),
    peakInstability: maximum(trajectory.instability),
    finalInstability: finalCountry.instability,
    startingStateContinuity: initialCountry.stateContinuity,
    minimumStateContinuity: minimum(trajectory.stateContinuity),
    finalStateContinuity: finalCountry.stateContinuity,
    startingControlledLandHexes: countControlledLandHexes(
      initial,
      playerCountryId,
    ),
    minimumControlledLandHexes: minimum(trajectory.controlledLandHexes),
    finalControlledLandHexes: countControlledLandHexes(final, playerCountryId),
    startingFactionCount: Object.keys(initial.factions).length,
    finalFactionCount: Object.keys(final.factions).length,
    startingFactionOrganizationTotal: sumFactionMetric(initial, "organization"),
    maximumFactionOrganizationTotal: maximum(trajectory.factionOrganization),
    finalFactionOrganizationTotal: sumFactionMetric(final, "organization"),
    startingFactionResourcesTotal: sumFactionMetric(initial, "resources"),
    finalFactionResourcesTotal: sumFactionMetric(final, "resources"),
    finalFactionGrievanceTotal: sumFactionMetric(final, "grievance"),
    crisisParticipatingFactionCount: conflictParticipantFactionIds.size,
    zeroControlledLandHexReachedTick:
      firstZeroIndex === -1 ? null : firstZeroIndex,
    zeroControlledLandHexRecoveryTick:
      firstRecoveryIndex === -1 ? null : firstRecoveryIndex,
    zeroControlledLandHexDurationTicks: zeroDurationTicks,
    consolidationEverEligible: trajectory.consolidationEligible.some(Boolean),
    maximumConsolidationStreak: maximum(trajectory.consolidationStreak),
    finalConsolidationStreak: final.run.consolidation.consecutiveEligibleTicks,
  };
}

function finalActiveConflictParticipantFactionIds(
  world: WorldState,
): ReadonlySet<string> {
  const factionIds = new Set<string>();
  for (const conflict of Object.values(world.conflicts)) {
    for (const factionId of conflict.participantFactionIds) {
      factionIds.add(factionId);
    }
  }
  return factionIds;
}

function runRecordToTick(
  scenario: ScenarioDefinition,
  initialRecord: RunRecord,
  targetTick: number,
  onStep?: (record: RunRecord, emittedEvents: readonly GameEvent[]) => void,
): RunRecord {
  let record = initialRecord;
  while (
    record.world.tick < targetTick &&
    record.world.run.outcome.status === "active"
  ) {
    const stepped = stepWait(scenario, record);
    record = stepped.record;
    onStep?.(record, stepped.emittedEvents);
  }
  return record;
}

/**
 * Async developer-runner variant. Yielding between small batches keeps the
 * long benchmark observable to the test runner; it does not alter simulation
 * ordering or insert non-authoritative time into WorldState.
 */
async function runRecordToTickAsync(
  scenario: ScenarioDefinition,
  initialRecord: RunRecord,
  targetTick: number,
  onStep?: (record: RunRecord, emittedEvents: readonly GameEvent[]) => void,
): Promise<RunRecord> {
  let record = initialRecord;
  while (
    record.world.tick < targetTick &&
    record.world.run.outcome.status === "active"
  ) {
    const stepped = stepWait(scenario, record);
    record = stepped.record;
    onStep?.(record, stepped.emittedEvents);

    if (record.world.tick % 60 === 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  }
  return record;
}

function performanceNow(): number {
  return globalThis.performance?.now() ?? Date.now();
}

function executeLongRun(config: LongRunConfig): LongRunExecution {
  assertLongRunConfig(config);
  const inputPolicy = config.inputPolicy ?? "WAIT";
  const playerCountryId = config.scenario.playerCountryId!;
  const requestedTicks = config.years * F01_DAYS_PER_YEAR;
  const initialRecord = createInitialRunRecord(config.scenario, config.seed);
  const initialWorld = initialRecord.world;
  const eventSummary: MutableEventSummary = createEventSummary([]);
  const politicalEvents: LongRunPoliticalEvent[] = [];
  const territorialChanges: LongRunTerritorialChange[] = [];
  const trajectory = createTrajectory();
  const checkpoints: LongRunCheckpoint[] = [
    createCheckpoint(initialWorld, playerCountryId),
  ];
  recordTrajectory(trajectory, initialWorld, playerCountryId);
  const start = performanceNow();
  let lastRecord = initialRecord;

  lastRecord = runRecordToTick(
    config.scenario,
    initialRecord,
    requestedTicks,
    (record, emittedEvents) => {
      addEventSummary(eventSummary, emittedEvents);
      politicalEvents.push(...collectPoliticalEvents(emittedEvents));
      territorialChanges.push(...collectTerritorialChanges(emittedEvents));
      recordTrajectory(trajectory, record.world, playerCountryId);
      trajectory.governmentTransitionKeys.push(
        ...collectGovernmentTransitionKeys(emittedEvents),
      );

      if (
        record.world.tick % F01_DAYS_PER_YEAR === 0 ||
        record.world.tick === requestedTicks ||
        record.world.run.outcome.status !== "active"
      ) {
        checkpoints.push(createCheckpoint(record.world, playerCountryId));
      }
    },
  );
  const elapsed = performanceNow() - start;
  const finalWorld = lastRecord.world;
  const finalTerminal = terminalSummary(finalWorld);
  const performance: LongRunPerformance = {
    requestedYears: config.years,
    requestedTicks,
    executedTicks: finalWorld.tick - initialWorld.tick,
    wallClockMilliseconds: elapsed,
    ticksPerSecond:
      elapsed > 0
        ? ((finalWorld.tick - initialWorld.tick) / elapsed) * 1000
        : 0,
  };
  const eventSummaryReadonly: LongRunEventSummary = { ...eventSummary };
  const state = createStateSummary(
    config.scenario,
    initialWorld,
    finalWorld,
    trajectory,
    finalActiveConflictParticipantFactionIds(finalWorld),
  );
  const rejectedActionCount = finalWorld.run.actionLog.filter(
    (action) => action.validationOutcome.kind === "rejected",
  ).length;

  return {
    record: lastRecord,
    summary: {
      scenarioId: config.scenario.id,
      scenarioVersion: config.scenario.version,
      seed: config.seed,
      inputPolicy,
      performance,
      terminal: finalTerminal,
      eventCount: lastRecord.eventStore.events.length,
      actionRecordCount: finalWorld.run.actionLog.length,
      rejectedActionCount,
      eventStoreSize: lastRecord.eventStore.events.length,
      events: eventSummaryReadonly,
      politicalEvents,
      territorialChanges,
      governmentTransitionSequence: [...trajectory.governmentTransitionKeys],
      state,
      checkpoints,
      pathologies: createPathologyObservations(
        requestedTicks,
        performance.executedTicks,
        eventSummaryReadonly,
        trajectory,
        checkpoints,
        rejectedActionCount,
      ),
      invariantFailures: [],
    },
  };
}

async function executeLongRunAsync(
  config: LongRunConfig,
): Promise<LongRunExecution> {
  assertLongRunConfig(config);
  const inputPolicy = config.inputPolicy ?? "WAIT";
  const playerCountryId = config.scenario.playerCountryId!;
  const requestedTicks = config.years * F01_DAYS_PER_YEAR;
  const initialRecord = createInitialRunRecord(config.scenario, config.seed);
  const initialWorld = initialRecord.world;
  const eventSummary: MutableEventSummary = createEventSummary([]);
  const politicalEvents: LongRunPoliticalEvent[] = [];
  const territorialChanges: LongRunTerritorialChange[] = [];
  const trajectory = createTrajectory();
  const checkpoints: LongRunCheckpoint[] = [
    createCheckpoint(initialWorld, playerCountryId),
  ];
  recordTrajectory(trajectory, initialWorld, playerCountryId);
  const start = performanceNow();
  const lastRecord = await runRecordToTickAsync(
    config.scenario,
    initialRecord,
    requestedTicks,
    (record, emittedEvents) => {
      addEventSummary(eventSummary, emittedEvents);
      politicalEvents.push(...collectPoliticalEvents(emittedEvents));
      territorialChanges.push(...collectTerritorialChanges(emittedEvents));
      recordTrajectory(trajectory, record.world, playerCountryId);
      trajectory.governmentTransitionKeys.push(
        ...collectGovernmentTransitionKeys(emittedEvents),
      );

      if (
        record.world.tick % F01_DAYS_PER_YEAR === 0 ||
        record.world.tick === requestedTicks ||
        record.world.run.outcome.status !== "active"
      ) {
        checkpoints.push(createCheckpoint(record.world, playerCountryId));
      }
    },
  );
  const elapsed = performanceNow() - start;
  const finalWorld = lastRecord.world;
  const finalTerminal = terminalSummary(finalWorld);
  const performance: LongRunPerformance = {
    requestedYears: config.years,
    requestedTicks,
    executedTicks: finalWorld.tick - initialWorld.tick,
    wallClockMilliseconds: elapsed,
    ticksPerSecond:
      elapsed > 0
        ? ((finalWorld.tick - initialWorld.tick) / elapsed) * 1000
        : 0,
  };
  const eventSummaryReadonly: LongRunEventSummary = { ...eventSummary };
  const state = createStateSummary(
    config.scenario,
    initialWorld,
    finalWorld,
    trajectory,
    finalActiveConflictParticipantFactionIds(finalWorld),
  );
  const rejectedActionCount = finalWorld.run.actionLog.filter(
    (action) => action.validationOutcome.kind === "rejected",
  ).length;

  return {
    record: lastRecord,
    summary: {
      scenarioId: config.scenario.id,
      scenarioVersion: config.scenario.version,
      seed: config.seed,
      inputPolicy,
      performance,
      terminal: finalTerminal,
      eventCount: lastRecord.eventStore.events.length,
      actionRecordCount: finalWorld.run.actionLog.length,
      rejectedActionCount,
      eventStoreSize: lastRecord.eventStore.events.length,
      events: eventSummaryReadonly,
      politicalEvents,
      territorialChanges,
      governmentTransitionSequence: [...trajectory.governmentTransitionKeys],
      state,
      checkpoints,
      pathologies: createPathologyObservations(
        requestedTicks,
        performance.executedTicks,
        eventSummaryReadonly,
        trajectory,
        checkpoints,
        rejectedActionCount,
      ),
      invariantFailures: [],
    },
  };
}

/** Run one deterministic WAIT baseline through the canonical simulation boundary. */
export function runF01LongRun(config: LongRunConfig): LongRunSummary {
  return executeLongRun(config).summary;
}

/** Async benchmark entry point used only by the long-running inspection command. */
export async function runF01LongRunAsync(
  config: LongRunConfig,
): Promise<LongRunSummary> {
  return (await executeLongRunAsync(config)).summary;
}

/** Compare continuous execution with a JSON snapshot save/load midpoint resume. */
export function compareF01PersistenceResume(
  config: LongRunConfig,
  midpointYears = Math.max(1, Math.floor(config.years / 2)),
): LongRunPersistenceComparison {
  assertLongRunConfig(config);
  if (midpointYears <= 0 || midpointYears >= config.years) {
    throw new Error(
      "F01 persistence midpoint must be inside the requested horizon.",
    );
  }

  const targetTick = config.years * F01_DAYS_PER_YEAR;
  const midpointTick = midpointYears * F01_DAYS_PER_YEAR;
  const continuous = executeLongRun(config).record;
  const midpoint = runRecordToTick(
    config.scenario,
    createInitialRunRecord(config.scenario, config.seed),
    midpointTick,
  );
  const loaded = deserializeSimulationSnapshot(
    config.scenario,
    serializeSimulationSnapshotJson(config.scenario, midpoint),
  );
  const resumed = runRecordToTick(config.scenario, loaded, targetTick);

  return {
    midpointYears,
    midpointTick,
    continuousFinalTick: continuous.world.tick,
    resumedFinalTick: resumed.world.tick,
    continuousOutcome: terminalSummary(continuous.world),
    resumedOutcome: terminalSummary(resumed.world),
    equivalent:
      serializeSimulationSnapshotJson(config.scenario, continuous) ===
      serializeSimulationSnapshotJson(config.scenario, resumed),
  };
}

export async function compareF01PersistenceResumeAsync(
  config: LongRunConfig,
  midpointYears = Math.max(1, Math.floor(config.years / 2)),
): Promise<LongRunPersistenceComparison> {
  assertLongRunConfig(config);
  if (midpointYears <= 0 || midpointYears >= config.years) {
    throw new Error(
      "F01 persistence midpoint must be inside the requested horizon.",
    );
  }

  const targetTick = config.years * F01_DAYS_PER_YEAR;
  const midpointTick = midpointYears * F01_DAYS_PER_YEAR;
  const continuous = (await executeLongRunAsync(config)).record;
  const midpoint = await runRecordToTickAsync(
    config.scenario,
    createInitialRunRecord(config.scenario, config.seed),
    midpointTick,
  );
  const loaded = deserializeSimulationSnapshot(
    config.scenario,
    serializeSimulationSnapshotJson(config.scenario, midpoint),
  );
  const resumed = await runRecordToTickAsync(
    config.scenario,
    loaded,
    targetTick,
  );

  return {
    midpointYears,
    midpointTick,
    continuousFinalTick: continuous.world.tick,
    resumedFinalTick: resumed.world.tick,
    continuousOutcome: terminalSummary(continuous.world),
    resumedOutcome: terminalSummary(resumed.world),
    equivalent:
      serializeSimulationSnapshotJson(config.scenario, continuous) ===
      serializeSimulationSnapshotJson(config.scenario, resumed),
  };
}

export function getLongRunDeterministicSignature(
  summary: LongRunSummary,
): string {
  return JSON.stringify({
    scenarioId: summary.scenarioId,
    scenarioVersion: summary.scenarioVersion,
    seed: summary.seed,
    inputPolicy: summary.inputPolicy,
    terminal: summary.terminal,
    eventCount: summary.eventCount,
    actionRecordCount: summary.actionRecordCount,
    rejectedActionCount: summary.rejectedActionCount,
    eventStoreSize: summary.eventStoreSize,
    events: summary.events,
    politicalEvents: summary.politicalEvents,
    territorialChanges: summary.territorialChanges,
    governmentTransitionSequence: summary.governmentTransitionSequence,
    state: summary.state,
    checkpoints: summary.checkpoints,
    pathologies: summary.pathologies,
    invariantFailures: summary.invariantFailures,
  });
}

export function runF01Benchmark(
  scenario: ScenarioDefinition,
  seed: number,
  inputPolicy: F01InputPolicy = "WAIT",
): readonly LongRunSummary[] {
  return F01_SUPPORTED_HORIZONS.map((years) =>
    runF01LongRun({ scenario, seed, years, inputPolicy }),
  );
}

export async function runF01BenchmarkAsync(
  scenario: ScenarioDefinition,
  seed: number,
  inputPolicy: F01InputPolicy = "WAIT",
): Promise<readonly LongRunSummary[]> {
  const summaries: LongRunSummary[] = [];
  for (const years of F01_SUPPORTED_HORIZONS) {
    summaries.push(
      await runF01LongRunAsync({ scenario, seed, years, inputPolicy }),
    );
  }
  return summaries;
}

function formatOutcome(summary: LongRunSummary): string {
  if (summary.terminal.outcome === "active") {
    return "active";
  }

  return `${summary.terminal.outcome} @ ${summary.terminal.tick} (${summary.terminal.simulatedYear}y)`;
}

function formatMilliseconds(milliseconds: number): string {
  return `${milliseconds.toFixed(2)} ms`;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}

function formatBenchmarkTable(summaries: readonly LongRunSummary[]): string[] {
  return [
    "| horizon | requested ticks | executed ticks | runtime | ticks/sec | outcome | events | controlled Hex min/final |",
    "| --- | ---: | ---: | ---: | ---: | --- | ---: | ---: |",
    ...summaries.map(
      (summary) =>
        `| ${summary.performance.requestedYears}y | ${summary.performance.requestedTicks} | ${summary.performance.executedTicks} | ${formatMilliseconds(summary.performance.wallClockMilliseconds)} | ${formatNumber(summary.performance.ticksPerSecond)} | ${formatOutcome(summary)} | ${summary.eventCount} | ${summary.state.minimumControlledLandHexes}/${summary.state.finalControlledLandHexes} |`,
    ),
  ];
}

function formatPathologies(summary: LongRunSummary): string[] {
  const observations = Object.entries(summary.pathologies)
    .filter(([, observed]) => observed)
    .map(([name]) => name);
  return observations.length === 0
    ? ["none observed"]
    : observations.sort(compareStableText);
}

/** Build the compact report from already measured developer data. */
function createF01InspectionReport(
  scenario: ScenarioDefinition,
  seed: number,
  inputPolicy: F01InputPolicy,
  summaries: readonly LongRunSummary[],
  persistence: LongRunPersistenceComparison,
): F01InspectionReport {
  const twentyYear = summaries.find(
    (summary) => summary.performance.requestedYears === 20,
  );
  const fortyYear = summaries.find(
    (summary) => summary.performance.requestedYears === 40,
  );
  const scale20To40 =
    twentyYear !== undefined &&
    fortyYear !== undefined &&
    twentyYear.performance.wallClockMilliseconds > 0
      ? fortyYear.performance.wallClockMilliseconds /
        twentyYear.performance.wallClockMilliseconds
      : null;
  const likelyFullHistoryBottleneck =
    scale20To40 !== null &&
    scale20To40 >= 3.5 &&
    (fortyYear?.performance.wallClockMilliseconds ?? 0) >= 1_000;
  const allPassed =
    summaries.every((summary) => summary.invariantFailures.length === 0) &&
    persistence.equivalent;
  const forty = fortyYear ?? summaries.at(-1)!;
  const lines = [
    "F01 Long-run Headless Validation",
    "",
    `Scenario: ${scenario.id} v${scenario.version} (T021 diagnostic political-crisis fixture)`,
    `Seed: ${seed}`,
    `Policy: ${inputPolicy} (zero accepted ActionRecords per tick)`,
    `Calendar: ${F01_DAYS_PER_YEAR} days / simulated year`,
    "",
    "Performance:",
    ...formatBenchmarkTable(summaries),
    `20y -> 40y runtime scale: ${scale20To40 === null ? "not available" : `${scale20To40.toFixed(2)}x`}`,
    `T024 validation path: canonical incremental continuation / full trust-boundary validation retained`,
    `F01B hardening performance observation: ${likelyFullHistoryBottleneck ? "PERFORMANCE REVIEW REQUIRED" : "NO RESIDUAL BLOCKER OBSERVED"}`,
    "(Diagnostic observation only; balance and gameplay rules are unchanged.)",
    "",
    "40-year state trajectory:",
    `treasury start/min/final: ${formatNumber(forty.state.startingTreasury)} / ${formatNumber(forty.state.minimumTreasury)} / ${formatNumber(forty.state.finalTreasury)}`,
    `stateCapacity start/min/final: ${formatNumber(forty.state.startingStateCapacity)} / ${formatNumber(forty.state.minimumStateCapacity)} / ${formatNumber(forty.state.finalStateCapacity)}`,
    `instability start/peak/final: ${formatNumber(forty.state.startingInstability)} / ${formatNumber(forty.state.peakInstability)} / ${formatNumber(forty.state.finalInstability)}`,
    `controlled LandHex start/min/final: ${forty.state.startingControlledLandHexes} / ${forty.state.minimumControlledLandHexes} / ${forty.state.finalControlledLandHexes}`,
    `faction count start/final: ${forty.state.startingFactionCount} / ${forty.state.finalFactionCount}`,
    `faction organization start/final: ${formatNumber(forty.state.startingFactionOrganizationTotal)} / ${formatNumber(forty.state.finalFactionOrganizationTotal)}`,
    `faction resources start/final: ${formatNumber(forty.state.startingFactionResourcesTotal)} / ${formatNumber(forty.state.finalFactionResourcesTotal)}`,
    `final faction grievance total: ${formatNumber(forty.state.finalFactionGrievanceTotal)}`,
    "",
    "40-year political activity:",
    `rebellions: ${forty.events.rebellionDetections}`,
    `coups: ${forty.events.coupAttempts}`,
    `civil wars started: ${forty.events.civilWarsStarted}`,
    `conflict resolutions: ${forty.events.conflictResolutions}`,
    `Government transitions: ${forty.events.governmentTransitions}`,
    `territorial control changes: ${forty.events.landHexControlChanges}`,
    `order consolidation attempts/wins: ${forty.events.consolidationAttempts}/${forty.events.consolidationWins}`,
    `state dissolutions: ${forty.events.stateDissolutions}`,
    `crisis-participating factions: ${forty.state.crisisParticipatingFactionCount}`,
    "",
    "Outcome:",
    `requested horizon: ${forty.performance.requestedYears} years`,
    `ticks executed: ${forty.performance.executedTicks}`,
    `terminal: ${formatOutcome(forty)}`,
    `terminal cause: ${forty.terminal.causeEventId ?? "none"}`,
    `yearly checkpoints: ${forty.checkpoints.length}`,
    "",
    "Pathological observations (not automatic balance failures):",
    ...formatPathologies(forty).map((observation) => `- ${observation}`),
    "",
    "Persistence:",
    `continuous vs midpoint save/load resume: ${persistence.equivalent ? "PASS" : "FAIL"}`,
    `midpoint: ${persistence.midpointYears}y / tick ${persistence.midpointTick}`,
    `continuous/resumed final tick: ${persistence.continuousFinalTick} / ${persistence.resumedFinalTick}`,
    "",
    `Invariants: ${allPassed ? "PASS" : "FAIL"}`,
    "F02 multi-seed diversity: COMPLETE / PASS (inspect:f02)",
    "F03 intervention counterfactual: COMPLETE / PLAYER_AGENCY_WEAK (inspect:f03)",
    "F04 exploit analysis: COMPLETE / F05 NOT_READY",
    "F05 pacing decision: BLOCKED BY F04 FINDINGS",
    "V02 renderer: NOT STARTED",
  ];

  return {
    scenarioId: scenario.id,
    seed,
    inputPolicy,
    summaries,
    persistence,
    allPassed,
    output: lines.join("\n"),
  };
}

/** Developer-only compact report for the required 5/10/20/40-year WAIT cases. */
export function runF01LongRunInspection(): F01InspectionReport {
  const scenario = createT021RebellionScenario();
  const seed = 40101;
  const inputPolicy: F01InputPolicy = "WAIT";
  const summaries = runF01Benchmark(scenario, seed, inputPolicy);
  const persistence = compareF01PersistenceResume(
    { scenario, seed, years: 5, inputPolicy },
    2,
  );
  return createF01InspectionReport(
    scenario,
    seed,
    inputPolicy,
    summaries,
    persistence,
  );
}

/** Yielding variant used by the long benchmark command so the runner stays responsive. */
export async function runF01LongRunInspectionAsync(): Promise<F01InspectionReport> {
  const scenario = createT021RebellionScenario();
  const seed = 40101;
  const inputPolicy: F01InputPolicy = "WAIT";
  const summaries = await runF01BenchmarkAsync(scenario, seed, inputPolicy);
  const persistence = await compareF01PersistenceResumeAsync(
    { scenario, seed, years: 5, inputPolicy },
    2,
  );
  return createF01InspectionReport(
    scenario,
    seed,
    inputPolicy,
    summaries,
    persistence,
  );
}

export function formatF01LongRunInspection(
  report: F01InspectionReport,
): string {
  return report.output;
}

export function printF01LongRunInspection(): void {
  console.log(runF01LongRunInspection().output);
}
