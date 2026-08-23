import type { GameEvent, GameEventType } from "../events/event";
import {
  cloneRunRecordViaSnapshot,
  deserializeSimulationSnapshot,
  serializeSimulationSnapshotJson,
} from "../core/persistence";
import type { RunRecord } from "../core/step";
import {
  createF03StartingRecord,
  F03_DEFAULT_SEED,
  runF03StrategyFromRecord,
  type F03StrategyRunResult,
} from "./f03InterventionCounterfactuals";
import {
  createF04DValidationScenario,
  F04D_VALIDATION_INTERVENTION_IDS,
} from "../state/gate1fValidationFixture";
import type { InterventionId } from "../state/ids";
import { POLITICAL_CRISIS_FIXTURE_FACTION_IDS } from "../state/politicalCrisisFixture";
import type { PoliticalCompetition } from "../state/policy";
import type { ScenarioDefinition } from "../state/scenario";
import {
  deriveAdministrativeHeadroom,
  deriveCommittedAdministrativeLoad,
  evaluateInterventionFeasibility,
} from "../state/intervention";
import { deriveFactionObservation } from "../systems/factionPressure";
import { derivePoliticalCrisisPrerequisites } from "../systems/politicalCrisis";

export const F04D_DEFAULT_SEED = F03_DEFAULT_SEED;
export const F04D_HORIZON_YEARS = 2 as const;

export const F04D_STRATEGY_IDS = {
  wait: "WAIT",
  materialRelief: "MATERIAL_RELIEF",
  politicalAccommodation: "POLITICAL_ACCOMMODATION",
  oppositionLegalization: "OPPOSITION_LEGALIZATION",
  coerciveRestriction: "COERCIVE_RESTRICTION",
} as const;

export type F04DStrategyId =
  (typeof F04D_STRATEGY_IDS)[keyof typeof F04D_STRATEGY_IDS];

const RESPONSE_INTERVENTIONS: Readonly<
  Record<F04DStrategyId, InterventionId | null>
> = {
  [F04D_STRATEGY_IDS.wait]: null,
  [F04D_STRATEGY_IDS.materialRelief]:
    F04D_VALIDATION_INTERVENTION_IDS.materialRelief,
  [F04D_STRATEGY_IDS.politicalAccommodation]:
    F04D_VALIDATION_INTERVENTION_IDS.politicalAccommodation,
  [F04D_STRATEGY_IDS.oppositionLegalization]:
    F04D_VALIDATION_INTERVENTION_IDS.oppositionLegalization,
  [F04D_STRATEGY_IDS.coerciveRestriction]:
    F04D_VALIDATION_INTERVENTION_IDS.coerciveRestriction,
};

const POLITICAL_EVENT_TYPES = new Set<GameEventType>([
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

export interface F04DFactionState {
  readonly grievance: number;
  readonly organization: number;
  readonly resources: number;
}

export interface F04DBranchSummary {
  readonly strategyId:
    F04DStrategyId | "INSTITUTION_BANNED" | "INSTITUTION_PLURAL";
  readonly interventionId: InterventionId | null;
  readonly feasible: boolean;
  readonly feasibilityReasons: readonly string[];
  readonly actionAttempted: boolean;
  readonly startedTick: number | null;
  readonly completionTick: number | null;
  readonly treasuryCost: number;
  readonly administrativeLoad: number;
  readonly durationDays: number;
  readonly ruleChanges: readonly string[];
  readonly startPoliticalCompetition: PoliticalCompetition;
  readonly finalPoliticalCompetition: PoliticalCompetition;
  readonly startPressFreedom: string;
  readonly finalPressFreedom: string;
  readonly treasuryStart: number;
  readonly treasuryFinal: number;
  readonly administrativeLoadStart: number;
  readonly administrativeHeadroomStart: number;
  readonly peakAdministrativeLoad: number;
  readonly minimumAdministrativeHeadroom: number;
  readonly industrialScarcityStart: number;
  readonly industrialScarcityFinal: number;
  readonly industrialUnrestStart: number;
  readonly industrialUnrestFinal: number;
  readonly rebellionStart: F04DFactionState;
  readonly rebellionAtCompletion: F04DFactionState | null;
  readonly rebellionFinal: F04DFactionState;
  readonly coupStart: F04DFactionState;
  readonly coupFinal: F04DFactionState;
  readonly rebellionEligibleStart: boolean;
  readonly rebellionEligibleFinal: boolean;
  readonly coupEligibleStart: boolean;
  readonly coupEligibleFinal: boolean;
  readonly crisisEvents: readonly string[];
  readonly conflictEvents: readonly string[];
  readonly territorialEvents: readonly string[];
  readonly governmentEvents: readonly string[];
  readonly consolidationEvents: readonly string[];
  readonly finalGovernmentId: string | null;
  readonly controlledLandHexesFinal: number;
  readonly consolidationEligibleFinal: boolean;
  readonly outcome: string;
  readonly trajectorySignature: string;
}

export interface F04DInstitutionComparison {
  readonly checkpoint: string;
  readonly seed: number;
  readonly bannedBargainAvailable: boolean;
  readonly pluralBargainAvailable: boolean;
  readonly bannedLegalizationFeasible: boolean;
  readonly pluralLegalizationFeasible: boolean;
  readonly banned: F04DBranchSummary;
  readonly plural: F04DBranchSummary;
  readonly actionAvailabilityDiffers: boolean;
  readonly downstreamTrajectoryDiffers: boolean;
}

export interface F04DExploitRecheck {
  readonly waitDominance: "NOT_OBSERVED" | "OBSERVED";
  readonly cheapPermanentGateShutoff: "NOT_OBSERVED" | "OBSERVED";
  readonly oneWayRatchet: "NOT_OBSERVED" | "OBSERVED";
  readonly timingCliff: "NOT_OBSERVED" | "OBSERVED";
  readonly postConflictFutility: "NOT_APPLICABLE";
  readonly meaninglessRepeat: "BLOCKED_OR_PAID" | "OBSERVED";
  readonly interventionSpam: "CAPACITY_BOUNDED" | "OBSERVED";
}

export interface F04DDiagnosisResult {
  readonly scenarioId: string;
  readonly checkpoint: string;
  readonly seed: number;
  readonly horizonYears: number;
  readonly institutionComparison: F04DInstitutionComparison;
  readonly responses: readonly F04DBranchSummary[];
  readonly meaningfulTrajectoryDivergence: boolean;
  readonly divergentResponseCount: number;
  readonly persistenceReplayEquivalent: boolean;
  readonly insertionOrderEquivalent: boolean;
  readonly exploitRecheck: F04DExploitRecheck;
  readonly pass: boolean;
}

export interface F04DInspectionReport {
  readonly result: F04DDiagnosisResult;
  readonly output: string;
}

interface CompletionCapture {
  rebellion: F04DFactionState | null;
}

function eventPayloadString(event: GameEvent, key: string): string | null {
  if (
    typeof event.payload !== "object" ||
    event.payload === null ||
    Array.isArray(event.payload)
  ) {
    return null;
  }
  const value = (event.payload as Readonly<Record<string, unknown>>)[key];
  return typeof value === "string" ? value : null;
}

function factionState(
  record: RunRecord,
  factionId: typeof POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion,
): F04DFactionState {
  const faction = record.world.factions[factionId];
  if (faction === undefined) {
    throw new Error(`F04D faction ${factionId} is missing.`);
  }
  return {
    grievance: faction.grievance,
    organization: faction.organization,
    resources: faction.resources,
  };
}

function crisisEligibility(
  scenario: ScenarioDefinition,
  record: RunRecord,
): {
  readonly rebellion: boolean;
  readonly coup: boolean;
} {
  const snapshot = derivePoliticalCrisisPrerequisites(scenario, record.world);
  return {
    rebellion:
      snapshot.rebellions.find(
        (candidate) =>
          candidate.factionId ===
          POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion,
      )?.eligible ?? false,
    coup:
      snapshot.coups.find(
        (candidate) =>
          candidate.factionId === POLITICAL_CRISIS_FIXTURE_FACTION_IDS.coup,
      )?.eligible ?? false,
  };
}

function controlledLandHexCount(
  scenario: ScenarioDefinition,
  record: RunRecord,
): number {
  const countryId = scenario.playerCountryId;
  if (countryId === null) {
    return 0;
  }
  return Object.values(record.world.landHexStates).filter(
    (state) =>
      state.controller.kind === "country" &&
      state.controller.countryId === countryId,
  ).length;
}

function relativeEvent(event: GameEvent, startTick: number): string {
  const target = event.targetId === undefined ? "-" : event.targetId;
  return `${event.type}@${event.tick - startTick}:${target}`;
}

function summarizeBranch(
  scenario: ScenarioDefinition,
  strategyId: F04DBranchSummary["strategyId"],
  interventionId: InterventionId | null,
  startingRecord: RunRecord,
  run: F03StrategyRunResult,
  completionCapture: CompletionCapture,
): F04DBranchSummary {
  const countryId = scenario.playerCountryId;
  const industrialId = scenario.initialRegions[1]?.id;
  if (countryId === null || industrialId === undefined) {
    throw new Error("F04D scenario boundary is incomplete.");
  }
  const feasibility =
    interventionId === null
      ? null
      : evaluateInterventionFeasibility({
          scenario,
          world: startingRecord.world,
          interventionId,
          countryId,
        });
  const started = run.stepEvents.find(
    (event) =>
      event.type === "INTERVENTION_STARTED" &&
      eventPayloadString(event, "interventionId") === interventionId,
  );
  const completed = run.stepEvents.find(
    (event) =>
      event.type === "INTERVENTION_COMPLETED" &&
      eventPayloadString(event, "interventionId") === interventionId,
  );
  const startRules =
    startingRecord.world.policies[countryId]!.institutionalRules;
  const finalRules =
    run.finalRecord.world.policies[countryId]!.institutionalRules;
  const startEligibility = crisisEligibility(scenario, startingRecord);
  const finalEligibility = crisisEligibility(scenario, run.finalRecord);
  const politicalEvents = run.stepEvents.filter((event) =>
    POLITICAL_EVENT_TYPES.has(event.type),
  );
  const crisisEvents = politicalEvents
    .filter((event) =>
      [
        "COUP_ATTEMPT_STARTED",
        "REBELLION_STARTED",
        "CIVIL_WAR_STARTED",
      ].includes(event.type),
    )
    .map((event) => relativeEvent(event, startingRecord.world.tick));
  const conflictEvents = politicalEvents
    .filter((event) => event.type === "CONFLICT_RESOLVED")
    .map((event) => relativeEvent(event, startingRecord.world.tick));
  const territorialEvents = politicalEvents
    .filter((event) => event.type === "LAND_HEX_CONTROL_CHANGED")
    .map((event) => relativeEvent(event, startingRecord.world.tick));
  const governmentEvents = politicalEvents
    .filter((event) => event.type === "GOVERNMENT_TRANSITIONED")
    .map((event) => relativeEvent(event, startingRecord.world.tick));
  const consolidationEvents = politicalEvents
    .filter((event) =>
      ["ORDER_CONSOLIDATION_STARTED", "ORDER_CONSOLIDATED"].includes(
        event.type,
      ),
    )
    .map((event) => relativeEvent(event, startingRecord.world.tick));
  const country = run.finalRecord.world.countries[countryId]!;
  const definition =
    interventionId === null
      ? null
      : (scenario.interventionCatalog[interventionId] ?? null);
  const peakAdministrativeLoad = Math.max(
    ...run.checkpoints.map((point) => point.administrativeLoad),
    deriveCommittedAdministrativeLoad(startingRecord.world, countryId),
  );
  const minimumAdministrativeHeadroom = Math.min(
    ...run.checkpoints.map((point) => point.administrativeHeadroom),
    deriveAdministrativeHeadroom(startingRecord.world, countryId),
  );
  const trajectorySignature =
    politicalEvents.length === 0
      ? "NONE"
      : politicalEvents
          .map((event) => relativeEvent(event, startingRecord.world.tick))
          .join("|");

  return {
    strategyId,
    interventionId,
    feasible: feasibility?.feasible ?? true,
    feasibilityReasons: feasibility?.reasons.map((reason) => reason.kind) ?? [],
    actionAttempted: interventionId !== null,
    startedTick:
      started === undefined ? null : started.tick - startingRecord.world.tick,
    completionTick:
      completed === undefined
        ? null
        : completed.tick - startingRecord.world.tick,
    treasuryCost: definition?.treasuryCost ?? 0,
    administrativeLoad: definition?.administrativeLoad ?? 0,
    durationDays: definition?.durationDays ?? 0,
    ruleChanges: run.stepEvents
      .filter((event) => event.type === "INSTITUTION_RULE_CHANGED")
      .map(
        (event) =>
          `${eventPayloadString(event, "rule")}:${eventPayloadString(event, "previousValue")}→${eventPayloadString(event, "value")}`,
      ),
    startPoliticalCompetition: startRules.politicalCompetition,
    finalPoliticalCompetition: finalRules.politicalCompetition,
    startPressFreedom: startRules.pressFreedom,
    finalPressFreedom: finalRules.pressFreedom,
    treasuryStart: startingRecord.world.countries[countryId]!.treasury,
    treasuryFinal: country.treasury,
    administrativeLoadStart: deriveCommittedAdministrativeLoad(
      startingRecord.world,
      countryId,
    ),
    administrativeHeadroomStart: deriveAdministrativeHeadroom(
      startingRecord.world,
      countryId,
    ),
    peakAdministrativeLoad,
    minimumAdministrativeHeadroom,
    industrialScarcityStart:
      startingRecord.world.regions[industrialId]!.scarcity,
    industrialScarcityFinal:
      run.finalRecord.world.regions[industrialId]!.scarcity,
    industrialUnrestStart: startingRecord.world.regions[industrialId]!.unrest,
    industrialUnrestFinal: run.finalRecord.world.regions[industrialId]!.unrest,
    rebellionStart: factionState(
      startingRecord,
      POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion,
    ),
    rebellionAtCompletion: completionCapture.rebellion,
    rebellionFinal: factionState(
      run.finalRecord,
      POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion,
    ),
    coupStart: factionState(
      startingRecord,
      POLITICAL_CRISIS_FIXTURE_FACTION_IDS.coup,
    ),
    coupFinal: factionState(
      run.finalRecord,
      POLITICAL_CRISIS_FIXTURE_FACTION_IDS.coup,
    ),
    rebellionEligibleStart: startEligibility.rebellion,
    rebellionEligibleFinal: finalEligibility.rebellion,
    coupEligibleStart: startEligibility.coup,
    coupEligibleFinal: finalEligibility.coup,
    crisisEvents,
    conflictEvents,
    territorialEvents,
    governmentEvents,
    consolidationEvents,
    finalGovernmentId: country.currentGovernmentId,
    controlledLandHexesFinal: controlledLandHexCount(scenario, run.finalRecord),
    consolidationEligibleFinal: run.final.consolidationEligible,
    outcome: run.final.outcome,
    trajectorySignature,
  };
}

function runBranch(
  scenario: ScenarioDefinition,
  strategyId: F04DBranchSummary["strategyId"],
  interventionId: InterventionId | null,
  startingRecord: RunRecord,
  horizonYears: number = F04D_HORIZON_YEARS,
): {
  readonly run: F03StrategyRunResult;
  readonly summary: F04DBranchSummary;
} {
  const completionCapture: CompletionCapture = { rebellion: null };
  const run = runF03StrategyFromRecord(
    scenario,
    "F04D_DECISION_BOUNDARY",
    strategyId,
    startingRecord,
    horizonYears,
    ({ relativeTick }) => (relativeTick === 0 ? interventionId : null),
    {
      checkpointOffsets: [0, 1, 5, 6, 8, 13, 30, 90, 360, 720],
      onObservation: ({ world, events }) => {
        if (
          events.some(
            (event) =>
              event.type === "INTERVENTION_COMPLETED" &&
              eventPayloadString(event, "interventionId") === interventionId,
          )
        ) {
          const faction =
            world.factions[POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion];
          if (faction !== undefined) {
            completionCapture.rebellion = {
              grievance: faction.grievance,
              organization: faction.organization,
              resources: faction.resources,
            };
          }
        }
      },
    },
  );
  return {
    run,
    summary: summarizeBranch(
      scenario,
      strategyId,
      interventionId,
      startingRecord,
      run,
      completionCapture,
    ),
  };
}

function withPoliticalCompetition(
  scenario: ScenarioDefinition,
  record: RunRecord,
  politicalCompetition: PoliticalCompetition,
): RunRecord {
  const countryId = scenario.playerCountryId;
  if (countryId === null) {
    throw new Error("F04D requires a player country.");
  }
  const policyState = record.world.policies[countryId];
  if (policyState === undefined) {
    throw new Error("F04D player policy state is missing.");
  }
  return cloneRunRecordViaSnapshot(scenario, {
    world: {
      ...record.world,
      policies: {
        ...record.world.policies,
        [countryId]: {
          ...policyState,
          institutionalRules: {
            ...policyState.institutionalRules,
            politicalCompetition,
          },
        },
      },
    },
    eventStore: record.eventStore,
  });
}

function insertionOrderVariant(
  scenario: ScenarioDefinition,
  record: RunRecord,
): RunRecord {
  return cloneRunRecordViaSnapshot(scenario, {
    world: {
      ...record.world,
      factions: Object.fromEntries(
        Object.entries(record.world.factions).reverse(),
      ),
      regions: Object.fromEntries(
        Object.entries(record.world.regions).reverse(),
      ),
      policies: Object.fromEntries(
        Object.entries(record.world.policies).reverse(),
      ),
    },
    eventStore: record.eventStore,
  });
}

function canonicalJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalJsonValue);
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([first], [second]) =>
          first < second ? -1 : first > second ? 1 : 0,
        )
        .map(([key, entry]) => [key, canonicalJsonValue(entry)]),
    );
  }
  return value;
}

function runPersistenceReplayCheck(
  scenario: ScenarioDefinition,
  startingRecord: RunRecord,
): boolean {
  const interventionId =
    F04D_VALIDATION_INTERVENTION_IDS.oppositionLegalization;
  const continuous = runBranch(
    scenario,
    F04D_STRATEGY_IDS.oppositionLegalization,
    interventionId,
    startingRecord,
    2,
  ).run.finalRecord;
  const firstYear = runBranch(
    scenario,
    F04D_STRATEGY_IDS.oppositionLegalization,
    interventionId,
    startingRecord,
    1,
  ).run.finalRecord;
  const loaded = deserializeSimulationSnapshot(
    scenario,
    serializeSimulationSnapshotJson(scenario, firstYear),
  );
  const resumed = runF03StrategyFromRecord(
    scenario,
    "F04D_RESUME",
    "RESUME_WAIT",
    loaded,
    1,
    () => null,
  ).finalRecord;
  const resumedJson = serializeSimulationSnapshotJson(scenario, resumed);
  const continuousJson = serializeSimulationSnapshotJson(scenario, continuous);
  return (
    JSON.stringify(canonicalJsonValue(JSON.parse(resumedJson))) ===
    JSON.stringify(canonicalJsonValue(JSON.parse(continuousJson)))
  );
}

function exploitRecheck(
  responses: readonly F04DBranchSummary[],
  divergentResponseCount: number,
  meaninglessRepeatBlocked: boolean,
  spamCapacityBounded: boolean,
): F04DExploitRecheck {
  const coercion = responses.find(
    (branch) => branch.strategyId === F04D_STRATEGY_IDS.coerciveRestriction,
  )!;
  const accommodation = responses.find(
    (branch) => branch.strategyId === F04D_STRATEGY_IDS.politicalAccommodation,
  )!;
  const responseCostsAreMaterial = responses
    .filter((branch) => branch.interventionId !== null)
    .every(
      (branch) =>
        branch.treasuryCost > 0 &&
        branch.administrativeLoad > 0 &&
        branch.durationDays > 0,
    );
  const coercionRecovered =
    coercion.rebellionAtCompletion !== null &&
    coercion.rebellionFinal.organization >
      coercion.rebellionAtCompletion.organization;
  const accommodationRecovered =
    accommodation.rebellionAtCompletion !== null &&
    accommodation.rebellionFinal.grievance >
      accommodation.rebellionAtCompletion.grievance;

  return {
    waitDominance: divergentResponseCount >= 2 ? "NOT_OBSERVED" : "OBSERVED",
    cheapPermanentGateShutoff:
      responseCostsAreMaterial && coercionRecovered
        ? "NOT_OBSERVED"
        : "OBSERVED",
    oneWayRatchet:
      coercionRecovered && accommodationRecovered ? "NOT_OBSERVED" : "OBSERVED",
    timingCliff: divergentResponseCount >= 2 ? "NOT_OBSERVED" : "OBSERVED",
    postConflictFutility: "NOT_APPLICABLE",
    meaninglessRepeat: meaninglessRepeatBlocked
      ? "BLOCKED_OR_PAID"
      : "OBSERVED",
    interventionSpam: spamCapacityBounded ? "CAPACITY_BOUNDED" : "OBSERVED",
  };
}

function eventHasFailureKind(event: GameEvent, failureKind: string): boolean {
  if (
    event.type !== "INTERVENTION_REJECTED" ||
    typeof event.payload !== "object" ||
    event.payload === null ||
    Array.isArray(event.payload)
  ) {
    return false;
  }
  const reasons = (event.payload as Readonly<Record<string, unknown>>)[
    "reasons"
  ];
  return (
    Array.isArray(reasons) &&
    reasons.some(
      (reason) =>
        typeof reason === "object" &&
        reason !== null &&
        !Array.isArray(reason) &&
        (reason as Readonly<Record<string, unknown>>)["kind"] === failureKind,
    )
  );
}

function runExploitProbes(
  scenario: ScenarioDefinition,
  startingRecord: RunRecord,
): {
  readonly meaninglessRepeatBlocked: boolean;
  readonly spamCapacityBounded: boolean;
} {
  const countryId = scenario.playerCountryId!;
  const legalizationId =
    F04D_VALIDATION_INTERVENTION_IDS.oppositionLegalization;
  const legalized = runBranch(
    scenario,
    F04D_STRATEGY_IDS.oppositionLegalization,
    legalizationId,
    startingRecord,
    1,
  ).run.finalRecord;
  const repeatFeasibility = evaluateInterventionFeasibility({
    scenario,
    world: legalized.world,
    interventionId: legalizationId,
    countryId,
  });
  const meaninglessRepeatBlocked =
    !repeatFeasibility.feasible &&
    repeatFeasibility.reasons.some(
      (reason) =>
        reason.kind === "PREREQUISITE_NOT_MET" ||
        reason.kind === "NO_COMPLETION_EFFECT_CHANGE",
    );

  const accommodationId =
    F04D_VALIDATION_INTERVENTION_IDS.politicalAccommodation;
  const spamRun = runF03StrategyFromRecord(
    scenario,
    "F04D_CAPACITY_PROBE",
    "ACCOMMODATION_SPAM",
    startingRecord,
    1,
    ({ relativeTick }) => (relativeTick <= 1 ? accommodationId : null),
  );
  const started = spamRun.stepEvents.some(
    (event) =>
      event.type === "INTERVENTION_STARTED" &&
      eventPayloadString(event, "interventionId") === accommodationId,
  );
  const capacityRejected = spamRun.stepEvents.some((event) =>
    eventHasFailureKind(event, "INSUFFICIENT_ADMINISTRATIVE_HEADROOM"),
  );
  const withinCapacity = spamRun.checkpoints.every(
    (point) => point.administrativeLoad <= point.stateCapacity,
  );

  return {
    meaninglessRepeatBlocked,
    spamCapacityBounded: started && capacityRejected && withinCapacity,
  };
}

export function runF04DDiagnosis(
  seed = F04D_DEFAULT_SEED,
): F04DDiagnosisResult {
  const scenario = createF04DValidationScenario();
  const base = createF03StartingRecord(scenario, seed, 0);
  const countryId = scenario.playerCountryId!;
  const factionId = POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion;
  const bannedRecord = withPoliticalCompetition(scenario, base, "banned");
  const pluralRecord = withPoliticalCompetition(scenario, base, "plural");
  const bannedObservation = deriveFactionObservation(
    bannedRecord.world,
    factionId,
    scenario,
  );
  const pluralObservation = deriveFactionObservation(
    pluralRecord.world,
    factionId,
    scenario,
  );
  const legalizationId =
    F04D_VALIDATION_INTERVENTION_IDS.oppositionLegalization;
  const bannedFeasibility = evaluateInterventionFeasibility({
    scenario,
    world: bannedRecord.world,
    interventionId: legalizationId,
    countryId,
  });
  const pluralFeasibility = evaluateInterventionFeasibility({
    scenario,
    world: pluralRecord.world,
    interventionId: legalizationId,
    countryId,
  });
  const bannedBranch = runBranch(
    scenario,
    "INSTITUTION_BANNED",
    legalizationId,
    bannedRecord,
  ).summary;
  const pluralBranch = runBranch(
    scenario,
    "INSTITUTION_PLURAL",
    legalizationId,
    pluralRecord,
  ).summary;
  const institutionComparison: F04DInstitutionComparison = {
    checkpoint: `${scenario.id}@tick:${base.world.tick}`,
    seed,
    bannedBargainAvailable: bannedObservation.availableActions.BARGAIN,
    pluralBargainAvailable: pluralObservation.availableActions.BARGAIN,
    bannedLegalizationFeasible: bannedFeasibility.feasible,
    pluralLegalizationFeasible: pluralFeasibility.feasible,
    banned: bannedBranch,
    plural: pluralBranch,
    actionAvailabilityDiffers:
      bannedObservation.availableActions.BARGAIN !==
        pluralObservation.availableActions.BARGAIN &&
      bannedFeasibility.feasible !== pluralFeasibility.feasible,
    downstreamTrajectoryDiffers:
      bannedBranch.trajectorySignature !== pluralBranch.trajectorySignature,
  };

  const responses = Object.values(F04D_STRATEGY_IDS).map(
    (strategyId) =>
      runBranch(scenario, strategyId, RESPONSE_INTERVENTIONS[strategyId], base)
        .summary,
  );
  const waitSignature = responses.find(
    (branch) => branch.strategyId === F04D_STRATEGY_IDS.wait,
  )!.trajectorySignature;
  const divergentResponseCount = responses.filter(
    (branch) =>
      branch.strategyId !== F04D_STRATEGY_IDS.wait &&
      branch.trajectorySignature !== waitSignature,
  ).length;
  const meaningfulTrajectoryDivergence = divergentResponseCount >= 2;
  const ordered = runBranch(
    scenario,
    F04D_STRATEGY_IDS.oppositionLegalization,
    legalizationId,
    base,
  ).summary;
  const reordered = runBranch(
    scenario,
    F04D_STRATEGY_IDS.oppositionLegalization,
    legalizationId,
    insertionOrderVariant(scenario, base),
  ).summary;
  const insertionOrderEquivalent =
    ordered.trajectorySignature === reordered.trajectorySignature &&
    ordered.outcome === reordered.outcome &&
    ordered.finalPoliticalCompetition === reordered.finalPoliticalCompetition;
  const persistenceReplayEquivalent = runPersistenceReplayCheck(scenario, base);
  const exploitProbes = runExploitProbes(scenario, base);
  const recheck = exploitRecheck(
    responses,
    divergentResponseCount,
    exploitProbes.meaninglessRepeatBlocked,
    exploitProbes.spamCapacityBounded,
  );
  const pass =
    institutionComparison.actionAvailabilityDiffers &&
    institutionComparison.downstreamTrajectoryDiffers &&
    meaningfulTrajectoryDivergence &&
    persistenceReplayEquivalent &&
    insertionOrderEquivalent &&
    recheck.cheapPermanentGateShutoff === "NOT_OBSERVED" &&
    recheck.oneWayRatchet === "NOT_OBSERVED" &&
    recheck.meaninglessRepeat === "BLOCKED_OR_PAID" &&
    recheck.interventionSpam === "CAPACITY_BOUNDED";

  return {
    scenarioId: scenario.id,
    checkpoint: institutionComparison.checkpoint,
    seed,
    horizonYears: F04D_HORIZON_YEARS,
    institutionComparison,
    responses,
    meaningfulTrajectoryDivergence,
    divergentResponseCount,
    persistenceReplayEquivalent,
    insertionOrderEquivalent,
    exploitRecheck: recheck,
    pass,
  };
}

function formatFaction(state: F04DFactionState): string {
  return `g=${state.grievance.toFixed(3)}, o=${state.organization.toFixed(3)}, r=${state.resources.toFixed(3)}`;
}

function formatBranch(branch: F04DBranchSummary): string {
  return `| ${[
    branch.strategyId,
    `${branch.feasible ? "YES" : "NO"}`,
    `${branch.startedTick ?? "-"}/${branch.completionTick ?? "-"}`,
    `${branch.treasuryCost}/${branch.administrativeLoad}/${branch.durationDays}`,
    `${branch.ruleChanges.join(", ") || `${branch.startPoliticalCompetition}→${branch.finalPoliticalCompetition}`}`,
    `${branch.treasuryStart.toFixed(0)}→${branch.treasuryFinal.toFixed(0)}`,
    `${branch.industrialScarcityStart.toFixed(3)}→${branch.industrialScarcityFinal.toFixed(3)}`,
    `${branch.industrialUnrestStart.toFixed(3)}→${branch.industrialUnrestFinal.toFixed(3)}`,
    `${formatFaction(branch.rebellionStart)}→${formatFaction(branch.rebellionFinal)}`,
    `R:${branch.rebellionEligibleStart ? "Y" : "N"}→${branch.rebellionEligibleFinal ? "Y" : "N"}, C:${branch.coupEligibleStart ? "Y" : "N"}→${branch.coupEligibleFinal ? "Y" : "N"}`,
    `${[...branch.crisisEvents, ...branch.conflictEvents].join(", ") || "none"}`,
    `${branch.territorialEvents.join(", ") || "none"}`,
    `${branch.governmentEvents.join(", ") || branch.finalGovernmentId || "none"}`,
    `${branch.consolidationEvents.join(", ") || "none"}; eligible=${branch.consolidationEligibleFinal ? "YES" : "NO"}`,
    `${branch.outcome}`,
  ].join(" | ")} |`;
}

export function formatF04DInspection(result: F04DDiagnosisResult): string {
  const institution = result.institutionComparison;
  const baseline = result.responses.find(
    (branch) => branch.strategyId === F04D_STRATEGY_IDS.wait,
  )!;
  return [
    "# F04D Institution / Action Counterfactual",
    "",
    `Scenario: ${result.scenarioId}`,
    `Checkpoint: ${result.checkpoint}`,
    `Seed: ${result.seed}`,
    `Horizon: ${result.horizonYears} years`,
    `Baseline: competition=${baseline.startPoliticalCompetition}; treasury=${baseline.treasuryStart.toFixed(0)}; admin load/headroom=${baseline.administrativeLoadStart}/${baseline.administrativeHeadroomStart}; scarcity=${baseline.industrialScarcityStart.toFixed(3)}; unrest=${baseline.industrialUnrestStart.toFixed(3)}; rebellion ${formatFaction(baseline.rebellionStart)}`,
    "",
    "## Same state / different institution",
    "",
    `- banned: BARGAIN=${institution.bannedBargainAvailable}, legalization feasible=${institution.bannedLegalizationFeasible}, trajectory=${institution.banned.trajectorySignature}`,
    `- plural: BARGAIN=${institution.pluralBargainAvailable}, legalization feasible=${institution.pluralLegalizationFeasible}, trajectory=${institution.plural.trajectorySignature}`,
    `- action availability differs: ${institution.actionAvailabilityDiffers ? "YES" : "NO"}`,
    `- downstream trajectory differs: ${institution.downstreamTrajectoryDiffers ? "YES" : "NO"}`,
    "",
    "## Response counterfactual",
    "",
    "| Strategy | Feasible | start/complete | cost/load/days | rule changes | treasury | scarcity | unrest | rebellion g/o/r | eligibility R/C | crisis/conflict | territory | government | consolidation | outcome |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...result.responses.map(formatBranch),
    "",
    "Administrative capacity:",
    ...result.responses.map(
      (branch) =>
        `- ${branch.strategyId}: peak load=${branch.peakAdministrativeLoad}; minimum headroom=${branch.minimumAdministrativeHeadroom}`,
    ),
    "",
    `Meaningful trajectory divergence: ${result.meaningfulTrajectoryDivergence ? "YES" : "NO"} (${result.divergentResponseCount} response branches differ from WAIT)`,
    `Persistence replay: ${result.persistenceReplayEquivalent ? "PASS" : "FAIL"}`,
    `Insertion order: ${result.insertionOrderEquivalent ? "PASS" : "FAIL"}`,
    `WAIT dominance: ${result.exploitRecheck.waitDominance}`,
    `Cheap permanent gate shutoff: ${result.exploitRecheck.cheapPermanentGateShutoff}`,
    `One-way ratchet: ${result.exploitRecheck.oneWayRatchet}`,
    `Timing cliff: ${result.exploitRecheck.timingCliff}`,
    `Post-conflict futility: ${result.exploitRecheck.postConflictFutility}`,
    `Meaningless repeat: ${result.exploitRecheck.meaninglessRepeat}`,
    `Intervention spam: ${result.exploitRecheck.interventionSpam}`,
    "",
    `F04D RESULT: ${result.pass ? "PASS" : "NOT PASS"}`,
  ].join("\n");
}

export function runF04DInspection(): F04DInspectionReport {
  const result = runF04DDiagnosis();
  return { result, output: formatF04DInspection(result) };
}

export function printF04DInspection(): void {
  console.log(runF04DInspection().output);
}
