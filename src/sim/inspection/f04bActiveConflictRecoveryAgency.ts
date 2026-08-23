import {
  cloneRunRecordViaSnapshot,
  commitSimulationStep,
  serializeSimulationSnapshotJson,
} from "../core/persistence";
import { runSimulationStep } from "../core/tick";
import type { RunRecord } from "../core/step";
import { createEventStore } from "../events/eventStore";
import type { Conflict } from "../state/conflict";
import {
  CONTACT_FIXTURE_COUNTRY_IDS,
  createContactFixtureScenario,
} from "../state/contactFixture";
import { POLITICAL_CRISIS_FIXTURE_FACTION_IDS } from "../state/politicalCrisisFixture";
import type {
  CountryId,
  FactionId,
  InterventionId,
  LandHexId,
  RegionId,
} from "../state/ids";
import {
  createGate1FValidationScenario,
  GATE1F_VALIDATION_INTERVENTION_IDS,
} from "../state/gate1fValidationFixture";
import { createT021RebellionScenario } from "../state/conflictFixture";
import type { ScenarioDefinition } from "../state/scenario";
import {
  deriveConflictIntents,
  type TerritorialControlIntent,
} from "../systems/conflictResolution";
import type { LandHexRuntimeState } from "../state/territorialControl";
import { createInitialWorldState, type WorldState } from "../state/world";
import {
  F03_DEFAULT_SEED,
  createF03StartingRecord,
  runF03StrategyFromRecord,
  type F03StrategyRunResult,
} from "./f03InterventionCounterfactuals";

export const F04B_DEFAULT_SEED = F03_DEFAULT_SEED;
export const F04B_DEFAULT_HORIZON_YEARS = 1 as const;

type RecoveryStatus = "RECOVERY" | "STALEMATE";

export interface F04BIntentObservation {
  readonly tick: number;
  readonly conflictId: string;
  readonly reason: string;
  readonly actingController: string;
  readonly opposingController: string;
  readonly actingStrength: number;
  readonly opposingStrength: number;
  readonly targetHexId: string;
}

export interface F04BActiveConflictResponse {
  readonly currentOrganizationResourcesReread: boolean;
  readonly strongIntent: F04BIntentObservation | null;
  readonly weakIntent: F04BIntentObservation | null;
  readonly responseDivergence: boolean;
  readonly postConflictLongAccepted: boolean;
  readonly postConflictLongOperationalDivergence: boolean;
  readonly postConflictLong: F04BIntentObservation | null;
  readonly postConflictWait: F04BIntentObservation | null;
  readonly grievanceDoesNotDeleteOccupiedRebellion: boolean;
}

export interface F04BRecoveryCase {
  readonly stateControl: number;
  readonly countryMilitaryPower: number;
  readonly governmentRecoveryStrength: number;
  readonly factionOperationalStrength: number;
  readonly targetRegionId: RegionId | null;
  readonly targetHexId: LandHexId | null;
  readonly status: RecoveryStatus;
  readonly changedLandHexCount: number;
  readonly conflictRemainsActive: boolean;
}

export interface F04BDiagnosisResult {
  readonly scenarioId: string;
  readonly scenarioVersion: number;
  readonly seed: number;
  readonly horizonYears: number;
  readonly activeConflictResponse: F04BActiveConflictResponse;
  readonly strongRecovery: F04BRecoveryCase;
  readonly weakRecovery: F04BRecoveryCase;
  readonly foreignWarRecoveryApplied: boolean;
  readonly coupRecoveryApplied: boolean;
  readonly oneHexPerConflict: boolean;
  readonly insertionOrderIndependent: boolean;
  readonly saveLoadEquivalence: boolean;
  readonly concerns: readonly string[];
  readonly deterministicSignature: string;
}

export interface F04BInspectionReport {
  readonly result: F04BDiagnosisResult;
  readonly allPassed: boolean;
  readonly output: string;
}

function controllerKey(controller: {
  readonly kind: "country" | "faction" | "uncontrolled";
  readonly countryId?: CountryId;
  readonly factionId?: FactionId;
}): string {
  switch (controller.kind) {
    case "country":
      return `country:${controller.countryId}`;
    case "faction":
      return `faction:${controller.factionId}`;
    case "uncontrolled":
      return "uncontrolled";
  }
}

function intentObservation(
  tick: number,
  intent: TerritorialControlIntent | undefined,
): F04BIntentObservation | null {
  if (intent === undefined) {
    return null;
  }

  return {
    tick,
    conflictId: intent.conflictId,
    reason: intent.reason,
    actingController: controllerKey(intent.actingController),
    opposingController: controllerKey(intent.opposingController),
    actingStrength: intent.actingStrength.strength,
    opposingStrength: intent.opposingStrength.strength,
    targetHexId: intent.targetHexId,
  };
}

function activeRebellionIntent(
  scenario: ScenarioDefinition,
  world: WorldState,
): TerritorialControlIntent | undefined {
  return deriveConflictIntents(scenario, world).find(
    (intent) =>
      world.conflicts[intent.conflictId]?.kind === "rebellion" &&
      world.conflicts[intent.conflictId]?.status === "active",
  );
}

function activeConflict(
  id: Conflict["id"],
  kind: Conflict["kind"],
  participantCountryIds: readonly CountryId[],
  participantFactionIds: readonly FactionId[] = [],
  affectedRegionIds: readonly RegionId[] = [],
): Conflict {
  return {
    id,
    kind,
    status: "active",
    participantCountryIds: [...participantCountryIds],
    participantFactionIds: [...participantFactionIds],
    affectedRegionIds: [...affectedRegionIds],
    contestedRegionIds: [],
    startedAtTick: 0,
  };
}

function withConflicts(
  world: WorldState,
  conflicts: readonly Conflict[],
): WorldState {
  return {
    ...world,
    conflicts: Object.fromEntries(
      conflicts.map((conflict) => [conflict.id, conflict]),
    ),
  };
}

interface ZeroTerritoryFixture {
  readonly scenario: ReturnType<typeof createT021RebellionScenario>;
  readonly world: WorldState;
  readonly countryId: CountryId;
  readonly factionId: FactionId;
  readonly regionId: RegionId;
}

function createZeroTerritoryFixture(options: {
  readonly countryMilitaryPower: number;
  readonly stateControl: number;
}): ZeroTerritoryFixture {
  const scenario = createT021RebellionScenario();
  const baseWorld = createInitialWorldState(scenario, F04B_DEFAULT_SEED);
  const country = scenario.initialCountries[0];
  const region = scenario.initialRegions[1];
  const faction =
    baseWorld.factions[POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion];
  if (country === undefined || region === undefined || faction === undefined) {
    throw new Error("F04B zero-territory fixture is incomplete.");
  }

  const landHexStates = Object.fromEntries(
    Object.keys(baseWorld.landHexStates).map((landHexId) => [
      landHexId,
      { controller: { kind: "faction", factionId: faction.id } },
    ]),
  ) as Readonly<Record<LandHexId, LandHexRuntimeState>>;

  return {
    scenario,
    world: {
      ...withConflicts(baseWorld, [
        activeConflict(
          "f04b.zero-territory-rebellion" as Conflict["id"],
          "rebellion",
          [country.id],
          [faction.id],
          [region.id],
        ),
      ]),
      countries: {
        ...baseWorld.countries,
        [country.id]: {
          ...baseWorld.countries[country.id]!,
          militaryPower: options.countryMilitaryPower,
        },
      },
      regions: {
        ...baseWorld.regions,
        [region.id]: {
          ...baseWorld.regions[region.id]!,
          stateControl: options.stateControl,
        },
      },
      landHexStates,
    },
    countryId: country.id,
    factionId: faction.id,
    regionId: region.id,
  };
}

function runDays(
  scenario: ScenarioDefinition,
  startingWorld: WorldState,
  count: number,
): {
  readonly world: WorldState;
  readonly events: readonly { readonly type: string }[];
} {
  let world = startingWorld;
  const events: { readonly type: string }[] = [];
  for (let index = 0; index < count; index += 1) {
    const result = runSimulationStep(world, { actions: [] }, {}, scenario);
    world = result.nextWorld;
    events.push(...result.emittedEvents);
  }
  return { world, events };
}

function recoveryCase(fixture: ZeroTerritoryFixture): F04BRecoveryCase {
  const country = fixture.world.countries[fixture.countryId]!;
  const region = fixture.world.regions[fixture.regionId]!;
  const intent = deriveConflictIntents(fixture.scenario, fixture.world)[0];
  const result = runDays(fixture.scenario, fixture.world, 7);
  const changedLandHexCount = result.events.filter(
    (event) => event.type === "LAND_HEX_CONTROL_CHANGED",
  ).length;
  const targetHexId = intent?.targetHexId ?? null;

  return {
    stateControl: region.stateControl,
    countryMilitaryPower: country.militaryPower,
    governmentRecoveryStrength:
      intent?.actingStrength.source === "country.militaryPowerWithStateControl"
        ? intent.actingStrength.strength
        : country.militaryPower * region.stateControl,
    factionOperationalStrength:
      intent?.opposingStrength.source === "faction.operationalCapacity"
        ? intent.opposingStrength.strength
        : 0,
    targetRegionId: targetHexId
      ? (fixture.scenario.mapTerritorialTopology.landHexes.find(
          (landHex) => landHex.id === targetHexId,
        )?.regionId ?? null)
      : null,
    targetHexId,
    status: changedLandHexCount > 0 ? "RECOVERY" : "STALEMATE",
    changedLandHexCount,
    conflictRemainsActive: Object.values(result.world.conflicts).some(
      (conflict) =>
        conflict.status === "active" && conflict.kind === "rebellion",
    ),
  };
}

function runRecordDays(
  scenario: ScenarioDefinition,
  startingRecord: RunRecord,
  count: number,
): RunRecord {
  let record = startingRecord;
  for (let index = 0; index < count; index += 1) {
    const result = runSimulationStep(
      record.world,
      { actions: [] },
      {},
      scenario,
    );
    record = commitSimulationStep(scenario, record, result);
  }
  return record;
}

function recoverySaveLoadEquivalence(fixture: ZeroTerritoryFixture): boolean {
  const initialRecord = cloneRunRecordViaSnapshot(fixture.scenario, {
    world: fixture.world,
    eventStore: createEventStore(),
  });
  const continuous = runRecordDays(fixture.scenario, initialRecord, 7);
  const firstHalf = runRecordDays(fixture.scenario, initialRecord, 3);
  const resumed = runRecordDays(
    fixture.scenario,
    cloneRunRecordViaSnapshot(fixture.scenario, firstHalf),
    4,
  );
  return (
    serializeSimulationSnapshotJson(fixture.scenario, continuous) ===
    serializeSimulationSnapshotJson(fixture.scenario, resumed)
  );
}

function tracePostConflictBranch(
  scenario: ScenarioDefinition,
  seed: number,
  interventionId: InterventionId | null,
): {
  readonly run: F03StrategyRunResult;
  readonly latestIntent: F04BIntentObservation | null;
} {
  const startingRecord = createF03StartingRecord(scenario, seed, 90);
  let latestIntent: F04BIntentObservation | null = null;
  const run = runF03StrategyFromRecord(
    scenario,
    "F04B_POST_CONFLICT",
    interventionId === null ? "WAIT" : "LONG",
    startingRecord,
    F04B_DEFAULT_HORIZON_YEARS,
    (context) => (context.relativeTick === 0 ? interventionId : null),
    {
      checkpointOffsets: [0, 30, 90, 180, 360],
      onObservation: (observation) => {
        if (
          observation.relativeTick === 0 ||
          observation.relativeTick % 7 === 0
        ) {
          latestIntent = intentObservation(
            observation.relativeTick,
            activeRebellionIntent(scenario, observation.world),
          );
        }
      },
    },
  );
  return { run, latestIntent };
}

function activeConflictResponse(
  scenario: ScenarioDefinition,
  seed: number,
): F04BActiveConflictResponse {
  const baseWorld = createInitialWorldState(scenario, seed);
  const country = scenario.initialCountries[0];
  const region = scenario.initialRegions[1];
  const faction =
    baseWorld.factions[POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion];
  if (country === undefined || region === undefined || faction === undefined) {
    throw new Error("F04B active-conflict fixture is incomplete.");
  }

  const occupiedWorld = withConflicts(baseWorld, [
    activeConflict(
      "f04b.occupied-rebellion" as Conflict["id"],
      "rebellion",
      [country.id],
      [faction.id],
      [region.id],
    ),
  ]);
  const occupiedLandHexStates = Object.fromEntries(
    Object.entries(occupiedWorld.landHexStates).map(([landHexId, state]) => {
      const landHex = scenario.mapTerritorialTopology.landHexes.find(
        (candidate) => candidate.id === landHexId,
      );
      return landHex?.regionId === region.id
        ? [
            landHexId,
            { controller: { kind: "faction", factionId: faction.id } },
          ]
        : [landHexId, state];
    }),
  ) as Readonly<Record<LandHexId, LandHexRuntimeState>>;
  const occupiedStateWorld: WorldState = {
    ...occupiedWorld,
    landHexStates: occupiedLandHexStates,
  };
  const strongIntent = intentObservation(
    0,
    activeRebellionIntent(scenario, occupiedStateWorld),
  );
  const weakWorld: WorldState = {
    ...occupiedStateWorld,
    factions: {
      ...occupiedStateWorld.factions,
      [faction.id]: { ...faction, organization: 0.1, resources: 0.1 },
    },
  };
  const weakIntent = intentObservation(
    0,
    activeRebellionIntent(scenario, weakWorld),
  );
  const occupiedAfterGrievanceDrop: WorldState = {
    ...occupiedStateWorld,
    factions: {
      ...occupiedStateWorld.factions,
      [faction.id]: { ...faction, grievance: 0 },
    },
  };
  const grievanceStep = runSimulationStep(
    occupiedAfterGrievanceDrop,
    { actions: [] },
    {},
    scenario,
  );
  const grievanceDoesNotDeleteOccupiedRebellion = Object.values(
    grievanceStep.nextWorld.conflicts,
  ).some(
    (conflict) => conflict.kind === "rebellion" && conflict.status === "active",
  );

  const wait = tracePostConflictBranch(scenario, seed, null);
  const long = tracePostConflictBranch(
    scenario,
    seed,
    GATE1F_VALIDATION_INTERVENTION_IDS.long,
  );
  const postConflictLongOperationalDivergence =
    JSON.stringify(wait.latestIntent) !== JSON.stringify(long.latestIntent) ||
    wait.run.final.factionOrganization !== long.run.final.factionOrganization;

  return {
    currentOrganizationResourcesReread:
      strongIntent?.actingController.startsWith("faction:") === true &&
      weakIntent?.actingController.startsWith("country:") === true,
    strongIntent,
    weakIntent,
    responseDivergence:
      JSON.stringify(strongIntent) !== JSON.stringify(weakIntent),
    postConflictLongAccepted: long.run.eventSummary.interventionStarted > 0,
    postConflictLongOperationalDivergence,
    postConflictLong: long.latestIntent,
    postConflictWait: wait.latestIntent,
    grievanceDoesNotDeleteOccupiedRebellion,
  };
}

function foreignAndCoupChecks(seed: number): {
  readonly foreignWarRecoveryApplied: boolean;
  readonly coupRecoveryApplied: boolean;
} {
  const foreignScenario = createContactFixtureScenario();
  const foreignWorld = createInitialWorldState(foreignScenario, seed);
  const foreignConflict = activeConflict(
    "f04b.foreign-war" as Conflict["id"],
    "war",
    [
      CONTACT_FIXTURE_COUNTRY_IDS.player,
      CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
    ],
  );
  const foreignIntents = deriveConflictIntents(
    foreignScenario,
    withConflicts(foreignWorld, [foreignConflict]),
  );
  const politicalScenario = createT021RebellionScenario();
  const politicalWorld = createInitialWorldState(politicalScenario, seed);
  const coupFaction = POLITICAL_CRISIS_FIXTURE_FACTION_IDS.coup;
  const countryId = politicalScenario.initialCountries[0]!.id;
  const coupConflict = activeConflict(
    "f04b.coup" as Conflict["id"],
    "coup",
    [countryId],
    [coupFaction],
    [politicalScenario.initialRegions[1]!.id],
  );
  const coupIntents = deriveConflictIntents(
    politicalScenario,
    withConflicts(politicalWorld, [coupConflict]),
  );
  return {
    foreignWarRecoveryApplied: foreignIntents.some(
      (intent) => intent.reason === "governmentRecovery",
    ),
    coupRecoveryApplied: coupIntents.some(
      (intent) => intent.reason === "governmentRecovery",
    ),
  };
}

function insertionOrderCheck(fixture: ZeroTerritoryFixture): boolean {
  const reversed: WorldState = {
    ...fixture.world,
    conflicts: Object.fromEntries(
      Object.entries(fixture.world.conflicts).reverse(),
    ),
    regions: Object.fromEntries(
      Object.entries(fixture.world.regions).reverse(),
    ),
    landHexStates: Object.fromEntries(
      Object.entries(fixture.world.landHexStates).reverse(),
    ),
  };
  return (
    JSON.stringify(deriveConflictIntents(fixture.scenario, fixture.world)) ===
    JSON.stringify(deriveConflictIntents(fixture.scenario, reversed))
  );
}

function stableSignature(
  result: Omit<F04BDiagnosisResult, "deterministicSignature">,
): string {
  return JSON.stringify({
    scenarioId: result.scenarioId,
    scenarioVersion: result.scenarioVersion,
    seed: result.seed,
    horizonYears: result.horizonYears,
    activeConflictResponse: result.activeConflictResponse,
    strongRecovery: result.strongRecovery,
    weakRecovery: result.weakRecovery,
    foreignWarRecoveryApplied: result.foreignWarRecoveryApplied,
    coupRecoveryApplied: result.coupRecoveryApplied,
    oneHexPerConflict: result.oneHexPerConflict,
    insertionOrderIndependent: result.insertionOrderIndependent,
    saveLoadEquivalence: result.saveLoadEquivalence,
    concerns: result.concerns,
  });
}

export function runF04BDiagnosis(
  scenario: ScenarioDefinition = createGate1FValidationScenario(),
  seed: number = F04B_DEFAULT_SEED,
  horizonYears: number = F04B_DEFAULT_HORIZON_YEARS,
): F04BDiagnosisResult {
  const strongFixture = createZeroTerritoryFixture({
    countryMilitaryPower: 100,
    stateControl: 0.8,
  });
  const weakFixture = createZeroTerritoryFixture({
    countryMilitaryPower: 100,
    stateControl: 0.1,
  });
  const strongRecovery = recoveryCase(strongFixture);
  const weakRecovery = recoveryCase(weakFixture);
  const foreignAndCoup = foreignAndCoupChecks(seed);
  const concerns = [
    "POST_CONFLICT_INTERVENTION_FUTILITY: REDUCED when current operational response is observed; political history may still converge",
    `NO_RECOVERY_PATH: ${strongRecovery.status === "RECOVERY" && weakRecovery.status === "STALEMATE" ? "REDUCED for supported internal residual-state cases; weak-state stalemate remains valid" : "REMAINS"}`,
    "WAIT_DOMINANCE_CANDIDATE: REMAINS; F04B does not tune costs or effects",
    "PRE_CRISIS_TIMING_CLIFF: REMAINS; F04B does not change timing/cadence",
    "ONE_WAY_RATCHET: RESOLVED by F04A regression; no writer change here",
  ];
  const withoutSignature = {
    scenarioId: scenario.id,
    scenarioVersion: scenario.version,
    seed,
    horizonYears,
    activeConflictResponse: activeConflictResponse(scenario, seed),
    strongRecovery,
    weakRecovery,
    foreignWarRecoveryApplied: foreignAndCoup.foreignWarRecoveryApplied,
    coupRecoveryApplied: foreignAndCoup.coupRecoveryApplied,
    oneHexPerConflict: strongRecovery.changedLandHexCount <= 1,
    insertionOrderIndependent: insertionOrderCheck(strongFixture),
    saveLoadEquivalence: recoverySaveLoadEquivalence(strongFixture),
    concerns,
  };
  return {
    ...withoutSignature,
    deterministicSignature: stableSignature(withoutSignature),
    // Keep the scenario parameter explicit in the inspection result; the
    // recovery cases intentionally use the T021 territorial fixture.
    scenarioId: scenario.id,
  };
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}

function formatIntent(intent: F04BIntentObservation | null): string {
  return intent === null
    ? "none"
    : `${intent.reason} ${intent.actingController} ${formatNumber(intent.actingStrength)} vs ${formatNumber(intent.opposingStrength)} → ${intent.targetHexId}`;
}

export function formatF04BInspection(result: F04BDiagnosisResult): string {
  const response = result.activeConflictResponse;
  const lines = [
    "F04B Active Conflict Response / Internal Recovery Agency",
    "",
    `Scenario: ${result.scenarioId} v${result.scenarioVersion}`,
    `Seed: ${result.seed}`,
    `Diagnostic horizon: ${result.horizonYears} year; production gameplay/balance changes: NONE`,
    "",
    "Audit:",
    `- active conflict reads current organization/resources: ${response.currentOrganizationResourcesReread ? "PASS" : "FAIL"}`,
    `- occupied rebellion survives grievance reduction: ${response.grievanceDoesNotDeleteOccupiedRebellion ? "PASS" : "FAIL"}`,
    "- active-conflict dedup remains duplicate prevention, not conflict immunity",
    "- zero-territory deadlock cause: government front derivation had no country-controlled source/front edge",
    "",
    "Active conflict response:",
    `- strong current faction state: ${formatIntent(response.strongIntent)}`,
    `- weak current faction state: ${formatIntent(response.weakIntent)}`,
    `- organization/resources response divergence: ${response.responseDivergence ? "YES" : "NO"}`,
    `- post-conflict WAIT: ${formatIntent(response.postConflictWait)}`,
    `- post-conflict LONG: ${formatIntent(response.postConflictLong)}`,
    `- post-conflict LONG accepted: ${response.postConflictLongAccepted ? "YES" : "NO"}`,
    `- post-conflict operational divergence: ${response.postConflictLongOperationalDivergence ? "YES" : "NO"}`,
    "",
    "Internal zero-territory recovery:",
    `- strong residual state: ${result.strongRecovery.status}; stateControl ${formatNumber(result.strongRecovery.stateControl)}; government strength ${formatNumber(result.strongRecovery.governmentRecoveryStrength)} vs faction ${formatNumber(result.strongRecovery.factionOperationalStrength)}; target ${result.strongRecovery.targetHexId ?? "none"}`,
    `- weak residual state: ${result.weakRecovery.status}; stateControl ${formatNumber(result.weakRecovery.stateControl)}; government strength ${formatNumber(result.weakRecovery.governmentRecoveryStrength)} vs faction ${formatNumber(result.weakRecovery.factionOperationalStrength)}; target ${result.weakRecovery.targetHexId ?? "none"}`,
    `- strong recovery changed Hexes: ${result.strongRecovery.changedLandHexCount}; conflict remains active: ${result.strongRecovery.conflictRemainsActive ? "YES" : "NO"}`,
    `- weak recovery changed Hexes: ${result.weakRecovery.changedLandHexCount}`,
    "- recovery strength: Country.militaryPower × Region.stateControl vs current faction operational strength",
    "- ownerCountryId used as physical controller: NO; mutation seam: changeLandHexController()",
    `- maximum one recovery Hex per conflict boundary: ${result.oneHexPerConflict ? "PASS" : "FAIL"}`,
    `- foreign-war recovery: ${result.foreignWarRecoveryApplied ? "UNEXPECTED" : "NO"}`,
    `- coup recovery: ${result.coupRecoveryApplied ? "UNEXPECTED" : "NO"}`,
    `- insertion-order independence: ${result.insertionOrderIndependent ? "PASS" : "FAIL"}`,
    `- save/load recovery equivalence: ${result.saveLoadEquivalence ? "PASS" : "FAIL"}`,
    "",
    "F04 concern re-evaluation:",
    ...result.concerns.map((concern) => `- ${concern}`),
    "",
    "F02 WAIT regression: run separately with inspect:f02; no-intervention recovery path is not an intervention writer",
    "F05: NOT STARTED",
    "V02: NOT STARTED",
    `Inspection invariants: ${
      result.activeConflictResponse.currentOrganizationResourcesReread &&
      result.activeConflictResponse.grievanceDoesNotDeleteOccupiedRebellion &&
      result.strongRecovery.status === "RECOVERY" &&
      result.weakRecovery.status === "STALEMATE" &&
      !result.foreignWarRecoveryApplied &&
      !result.coupRecoveryApplied &&
      result.oneHexPerConflict &&
      result.insertionOrderIndependent &&
      result.saveLoadEquivalence
        ? "PASS"
        : "FAIL"
    }`,
  ];
  return lines.join("\n");
}

export function runF04BInspection(): F04BInspectionReport {
  const result = runF04BDiagnosis();
  const allPassed =
    result.activeConflictResponse.currentOrganizationResourcesReread &&
    result.activeConflictResponse.grievanceDoesNotDeleteOccupiedRebellion &&
    result.strongRecovery.status === "RECOVERY" &&
    result.weakRecovery.status === "STALEMATE" &&
    !result.foreignWarRecoveryApplied &&
    !result.coupRecoveryApplied &&
    result.oneHexPerConflict &&
    result.insertionOrderIndependent &&
    result.saveLoadEquivalence;
  return { result, allPassed, output: formatF04BInspection(result) };
}

export function printF04BInspection(): void {
  console.log(formatF04BInspection(runF04BDiagnosis()));
}
