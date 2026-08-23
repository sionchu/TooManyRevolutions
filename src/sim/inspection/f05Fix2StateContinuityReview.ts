import { runSimulationStep } from "../core/tick";
import type { Conflict } from "../state/conflict";
import {
  CONTACT_FIXTURE_COUNTRY_IDS,
  createContactFixtureScenario,
} from "../state/contactFixture";
import { POLITICAL_CRISIS_FIXTURE_FACTION_IDS } from "../state/politicalCrisisFixture";
import {
  asConflictId,
  asGovernmentId,
  type CountryId,
  type FactionId,
  type LandHexId,
  type RegionId,
} from "../state/ids";
import { createT021RebellionScenario } from "../state/conflictFixture";
import type { ScenarioDefinition } from "../state/scenario";
import type { LandHexRuntimeState } from "../state/territorialControl";
import { createInitialWorldState, type WorldState } from "../state/world";
import {
  applyConflictOutcome,
  CONFLICT_RESOLUTION_CONFIG,
} from "../systems/conflictResolution";

export interface F05ContinuityCountdownCase {
  readonly initialContinuity: number;
  readonly terminalTick: number | null;
  readonly terminalOutcome: string;
  readonly qualifyingBoundaryCount: number;
  readonly politicalPrefixStable: boolean;
}

export interface F05ContinuityRatchetProbe {
  readonly continuityAfterInitialDisplacement: number;
  readonly recoveredCountryLandHexes: number;
  readonly continuityAfterLegitimateRecovery: number;
  readonly continuityAfterSecondDisplacement: number;
  readonly secondDisplacementOutcome: string;
  readonly restorationObserved: boolean;
}

export interface F05ContinuityExclusionProbe {
  readonly internalRebellionContinuityAfterBoundary: number;
  readonly foreignOccupationContinuityAfterBoundary: number;
  readonly coupOnlyContinuityAfterBoundary: number;
}

export interface F05GovernmentTransitionProbe {
  readonly countryIdPreserved: boolean;
  readonly governmentChanged: boolean;
  readonly landHexStatePreserved: boolean;
  readonly runOutcomeRemainsActive: boolean;
  readonly eventType: string | null;
}

export interface F05Fix2StateContinuityReviewResult {
  readonly cadenceDays: number;
  readonly continuityLossPerBoundary: number;
  readonly dissolutionThreshold: number;
  readonly countdown: readonly F05ContinuityCountdownCase[];
  readonly ratchet: F05ContinuityRatchetProbe;
  readonly exclusions: F05ContinuityExclusionProbe;
  readonly governmentTransition: F05GovernmentTransitionProbe;
  readonly allPassed: boolean;
  readonly output: string;
}

interface DisplacedRebellionFixture {
  readonly scenario: ReturnType<typeof createT021RebellionScenario>;
  readonly world: WorldState;
  readonly countryId: CountryId;
  readonly factionId: FactionId;
  readonly regionId: RegionId;
}

interface RuntimeRun {
  readonly world: WorldState;
  readonly events: readonly {
    readonly tick: number;
    readonly type: string;
    readonly actorId?: string;
    readonly targetId?: string;
    readonly payload?: unknown;
  }[];
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

function allLandHexesControlledBy(
  scenario: ScenarioDefinition,
  controller:
    | { readonly kind: "country"; readonly countryId: CountryId }
    | { readonly kind: "faction"; readonly factionId: FactionId },
): Readonly<Record<LandHexId, LandHexRuntimeState>> {
  return Object.fromEntries(
    scenario.mapTerritorialTopology.landHexes.map((landHex) => [
      landHex.id,
      { controller },
    ]),
  ) as Readonly<Record<LandHexId, LandHexRuntimeState>>;
}

function countryControlledLandHexes(
  scenario: ScenarioDefinition,
  world: WorldState,
  countryId: CountryId,
): number {
  return scenario.mapTerritorialTopology.landHexes.filter((landHex) => {
    const controller = world.landHexStates[landHex.id]?.controller;
    return controller?.kind === "country" && controller.countryId === countryId;
  }).length;
}

function displacedRebellionFixture(options: {
  readonly stateContinuity: number;
  readonly stateControl: number;
}): DisplacedRebellionFixture {
  const scenario = createT021RebellionScenario();
  const baseWorld = createInitialWorldState(scenario, 21021);
  const country = scenario.initialCountries[0];
  const region = scenario.initialRegions[1];
  const faction =
    baseWorld.factions[POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion];
  if (country === undefined || region === undefined || faction === undefined) {
    throw new Error("F05_FIX2_R rebellion fixture is incomplete.");
  }

  return {
    scenario,
    world: {
      ...withConflicts(baseWorld, [
        activeConflict(
          asConflictId("f05.fix2r.internal-rebellion"),
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
          militaryPower: 100,
          stateContinuity: options.stateContinuity,
        },
      },
      regions: {
        ...baseWorld.regions,
        [region.id]: {
          ...baseWorld.regions[region.id]!,
          stateControl: options.stateControl,
        },
      },
      landHexStates: allLandHexesControlledBy(scenario, {
        kind: "faction",
        factionId: faction.id,
      }),
    },
    countryId: country.id,
    factionId: faction.id,
    regionId: region.id,
  };
}

function withRegionStateControl(
  world: WorldState,
  regionId: RegionId,
  stateControl: number,
): WorldState {
  return {
    ...world,
    regions: {
      ...world.regions,
      [regionId]: { ...world.regions[regionId]!, stateControl },
    },
  };
}

function runDays(
  scenario: ScenarioDefinition,
  startingWorld: WorldState,
  count: number,
): RuntimeRun {
  let world = startingWorld;
  const events: RuntimeRun["events"][number][] = [];
  for (let index = 0; index < count; index += 1) {
    const result = runSimulationStep(world, { actions: [] }, {}, scenario);
    world = result.nextWorld;
    events.push(...result.emittedEvents);
  }
  return { world, events };
}

function runUntilTerminal(
  scenario: ScenarioDefinition,
  startingWorld: WorldState,
  countryId: CountryId,
  maximumDays: number,
): RuntimeRun {
  let world = startingWorld;
  const events: RuntimeRun["events"][number][] = [];
  for (let index = 0; index < maximumDays; index += 1) {
    if (world.run.outcome.status !== "active") {
      break;
    }
    const result = runSimulationStep(world, { actions: [] }, {}, scenario);
    world = result.nextWorld;
    events.push(...result.emittedEvents);
    if (world.countries[countryId] === undefined) {
      throw new Error(`Country ${countryId} disappeared from WorldState.`);
    }
  }
  return { world, events };
}

function outcomeLabel(world: WorldState): string {
  return world.run.outcome.status === "active"
    ? "active"
    : world.run.outcome.kind;
}

function eventSignature(event: RuntimeRun["events"][number]): string {
  return JSON.stringify({
    tick: event.tick,
    type: event.type,
    actorId: event.actorId ?? null,
    targetId: event.targetId ?? null,
    payload: event.payload ?? null,
  });
}

function politicalPrefix(
  events: RuntimeRun["events"],
  beforeTick: number,
): readonly string[] {
  return events
    .filter(
      (event) =>
        event.tick < beforeTick &&
        event.type !== "TICK_ADVANCED" &&
        event.type !== "STATE_DISSOLVED",
    )
    .map(eventSignature);
}

function runCountdownProbe(): readonly F05ContinuityCountdownCase[] {
  const initialValues = [100, 50, 10] as const;
  const runs = initialValues.map((initialContinuity) => {
    const fixture = displacedRebellionFixture({
      stateContinuity: initialContinuity,
      stateControl: 0.1,
    });
    return {
      initialContinuity,
      fixture,
      run: runUntilTerminal(
        fixture.scenario,
        fixture.world,
        fixture.countryId,
        900,
      ),
    };
  });
  const earliestTerminalTick = Math.min(
    ...runs.map((entry) => entry.run.world.tick),
  );

  return runs.map(({ initialContinuity, fixture, run }) => {
    const terminalTick =
      run.world.run.outcome.status === "active" ? null : run.world.tick;
    const qualifyingBoundaryCount =
      terminalTick === null
        ? 0
        : Math.round(
            (initialContinuity -
              run.world.countries[fixture.countryId]!.stateContinuity) /
              CONFLICT_RESOLUTION_CONFIG.unresolvedInternalRebellionContinuityLoss,
          );
    const politicalPrefixStable = runs.every(
      ({ run: otherRun }) =>
        JSON.stringify(politicalPrefix(run.events, earliestTerminalTick)) ===
        JSON.stringify(politicalPrefix(otherRun.events, earliestTerminalTick)),
    );
    return {
      initialContinuity,
      terminalTick,
      terminalOutcome: outcomeLabel(run.world),
      qualifyingBoundaryCount,
      politicalPrefixStable,
    };
  });
}

function runRatchetProbe(): F05ContinuityRatchetProbe {
  const fixture = displacedRebellionFixture({
    stateContinuity: 100,
    stateControl: 0.1,
  });
  const initiallyDisplaced = runDays(fixture.scenario, fixture.world, 21);
  const continuityAfterInitialDisplacement =
    initiallyDisplaced.world.countries[fixture.countryId]!.stateContinuity;

  const recoveryStart = withRegionStateControl(
    initiallyDisplaced.world,
    fixture.regionId,
    0.8,
  );
  const recovered = runDays(fixture.scenario, recoveryStart, 7);
  const recoveredCountryLandHexes = countryControlledLandHexes(
    fixture.scenario,
    recovered.world,
    fixture.countryId,
  );
  const continuityAfterLegitimateRecovery =
    recovered.world.countries[fixture.countryId]!.stateContinuity;

  const redisplaced = {
    ...withRegionStateControl(recovered.world, fixture.regionId, 0.1),
    landHexStates: allLandHexesControlledBy(fixture.scenario, {
      kind: "faction",
      factionId: fixture.factionId,
    }),
  };
  const secondDisplacement = runDays(fixture.scenario, redisplaced, 7);

  return {
    continuityAfterInitialDisplacement,
    recoveredCountryLandHexes,
    continuityAfterLegitimateRecovery,
    continuityAfterSecondDisplacement:
      secondDisplacement.world.countries[fixture.countryId]!.stateContinuity,
    secondDisplacementOutcome: outcomeLabel(secondDisplacement.world),
    restorationObserved:
      continuityAfterLegitimateRecovery > continuityAfterInitialDisplacement,
  };
}

function runExclusionProbe(): F05ContinuityExclusionProbe {
  const internal = displacedRebellionFixture({
    stateContinuity: 100,
    stateControl: 0.1,
  });
  const internalResult = runDays(internal.scenario, internal.world, 7);

  const foreignScenario = createContactFixtureScenario();
  const foreignBase = createInitialWorldState(foreignScenario, 21021);
  const foreignWorld = withConflicts(foreignBase, [
    activeConflict(asConflictId("f05.fix2r.foreign-occupation"), "war", [
      CONTACT_FIXTURE_COUNTRY_IDS.player,
      CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
    ]),
  ]);
  const foreignOccupiedWorld: WorldState = {
    ...foreignWorld,
    landHexStates: allLandHexesControlledBy(foreignScenario, {
      kind: "country",
      countryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
    }),
  };
  const foreignResult = runDays(foreignScenario, foreignOccupiedWorld, 7);

  const coupScenario = createT021RebellionScenario();
  const coupBase = createInitialWorldState(coupScenario, 21021);
  const coupCountry = coupScenario.initialCountries[0]!;
  const coupFactionId = POLITICAL_CRISIS_FIXTURE_FACTION_IDS.coup;
  const coupWorld = withConflicts(coupBase, [
    activeConflict(
      asConflictId("f05.fix2r.coup-only"),
      "coup",
      [coupCountry.id],
      [coupFactionId],
      [coupScenario.initialRegions[1]!.id],
    ),
  ]);
  const coupOccupiedWorld: WorldState = {
    ...coupWorld,
    landHexStates: allLandHexesControlledBy(coupScenario, {
      kind: "faction",
      factionId: coupFactionId,
    }),
  };
  const coupResult = runDays(coupScenario, coupOccupiedWorld, 7);

  return {
    internalRebellionContinuityAfterBoundary:
      internalResult.world.countries[internal.countryId]!.stateContinuity,
    foreignOccupationContinuityAfterBoundary:
      foreignResult.world.countries[CONTACT_FIXTURE_COUNTRY_IDS.player]!
        .stateContinuity,
    coupOnlyContinuityAfterBoundary:
      coupResult.world.countries[coupCountry.id]!.stateContinuity,
  };
}

function runGovernmentTransitionProbe(): F05GovernmentTransitionProbe {
  const scenario = createContactFixtureScenario();
  const baseWorld = createInitialWorldState(scenario, 21021);
  const country = baseWorld.countries[CONTACT_FIXTURE_COUNTRY_IDS.player]!;
  const previousGovernmentId = country.currentGovernmentId;
  if (previousGovernmentId === null) {
    throw new Error("Government transition fixture has no current government.");
  }
  const nextGovernmentId = asGovernmentId("f05.fix2r.successor-government");
  const conflict = activeConflict(
    asConflictId("f05.fix2r.government-transition"),
    "coup",
    [country.id],
  );
  const world = {
    ...withConflicts(baseWorld, [conflict]),
    governments: {
      ...baseWorld.governments,
      [nextGovernmentId]: {
        id: nextGovernmentId,
        countryId: country.id,
        name: "F05_FIX2_R successor fixture government",
        authority: "contender" as const,
        formedAtTick: baseWorld.tick,
      },
    },
  };
  const result = applyConflictOutcome(world, {
    conflictId: conflict.id,
    outcome: {
      kind: "governmentTransition",
      countryId: country.id,
      previousGovernmentId,
      nextGovernmentId,
      winner: { kind: "country", countryId: country.id },
    },
  });

  return {
    countryIdPreserved:
      result.nextWorld.countries[country.id]?.id === country.id,
    governmentChanged:
      result.nextWorld.countries[country.id]?.currentGovernmentId ===
      nextGovernmentId,
    landHexStatePreserved:
      JSON.stringify(result.nextWorld.landHexStates) ===
      JSON.stringify(world.landHexStates),
    runOutcomeRemainsActive: result.nextWorld.run.outcome.status === "active",
    eventType: result.emittedEvents[0]?.type ?? null,
  };
}

function formatCase(entry: F05ContinuityCountdownCase): string {
  return `continuity ${entry.initialContinuity}: terminal tick ${entry.terminalTick ?? "none"}; boundaries ${entry.qualifyingBoundaryCount}; outcome ${entry.terminalOutcome}; political prefix stable ${entry.politicalPrefixStable ? "YES" : "NO"}`;
}

export function runF05Fix2StateContinuityReview(): F05Fix2StateContinuityReviewResult {
  const countdown = runCountdownProbe();
  const ratchet = runRatchetProbe();
  const exclusions = runExclusionProbe();
  const governmentTransition = runGovernmentTransitionProbe();
  const allPassed =
    countdown.length === 3 &&
    countdown.every(
      (entry) =>
        entry.terminalOutcome === "stateDissolved" &&
        entry.terminalTick !== null &&
        entry.qualifyingBoundaryCount === entry.initialContinuity &&
        entry.politicalPrefixStable,
    ) &&
    ratchet.continuityAfterInitialDisplacement === 97 &&
    ratchet.recoveredCountryLandHexes === 1 &&
    ratchet.continuityAfterLegitimateRecovery === 97 &&
    ratchet.continuityAfterSecondDisplacement === 96 &&
    ratchet.secondDisplacementOutcome === "active" &&
    !ratchet.restorationObserved &&
    exclusions.internalRebellionContinuityAfterBoundary === 99 &&
    exclusions.foreignOccupationContinuityAfterBoundary === 100 &&
    exclusions.coupOnlyContinuityAfterBoundary === 100 &&
    governmentTransition.countryIdPreserved &&
    governmentTransition.governmentChanged &&
    governmentTransition.landHexStatePreserved &&
    governmentTransition.runOutcomeRemainsActive &&
    governmentTransition.eventType === "GOVERNMENT_TRANSITIONED";

  const output = [
    "F05_FIX2_R State Continuity / Dissolution Architecture Probe",
    `cadence: ${CONFLICT_RESOLUTION_CONFIG.cadence} (${CONFLICT_RESOLUTION_CONFIG.unresolvedInternalRebellionContinuityLoss} continuity per boundary)`,
    "",
    "Countdown probe:",
    ...countdown.map((entry) => `- ${formatCase(entry)}`),
    "",
    "Ratchet probe:",
    `- after initial displacement: ${ratchet.continuityAfterInitialDisplacement}`,
    `- Country Hexes after real recovery: ${ratchet.recoveredCountryLandHexes}`,
    `- continuity after real recovery: ${ratchet.continuityAfterLegitimateRecovery}`,
    `- continuity after second displacement: ${ratchet.continuityAfterSecondDisplacement}`,
    `- second displacement outcome: ${ratchet.secondDisplacementOutcome}`,
    `- continuity restoration observed: ${ratchet.restorationObserved ? "YES" : "NO"}`,
    "",
    "Exclusion probe:",
    `- qualifying internal rebellion: ${exclusions.internalRebellionContinuityAfterBoundary}`,
    `- foreign occupation: ${exclusions.foreignOccupationContinuityAfterBoundary}`,
    `- coup-only physical faction control: ${exclusions.coupOnlyContinuityAfterBoundary}`,
    "",
    "Government transition seam:",
    `- CountryId preserved: ${governmentTransition.countryIdPreserved ? "YES" : "NO"}`,
    `- current Government changed: ${governmentTransition.governmentChanged ? "YES" : "NO"}`,
    `- LandHex state preserved: ${governmentTransition.landHexStatePreserved ? "YES" : "NO"}`,
    `- RunOutcome active: ${governmentTransition.runOutcomeRemainsActive ? "YES" : "NO"}`,
    `- event: ${governmentTransition.eventType ?? "none"}`,
    "",
    `probe invariants: ${allPassed ? "PASS" : "FAIL"}`,
  ].join("\n");

  return {
    cadenceDays: 7,
    continuityLossPerBoundary:
      CONFLICT_RESOLUTION_CONFIG.unresolvedInternalRebellionContinuityLoss,
    dissolutionThreshold: 0,
    countdown,
    ratchet,
    exclusions,
    governmentTransition,
    allPassed,
    output,
  };
}
