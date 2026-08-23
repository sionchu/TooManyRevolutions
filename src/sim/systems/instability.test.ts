import { describe, expect, it } from "vitest";

import { runSimulationStep } from "../core/tick";
import type { SimulationPhaseHook, SimulationPhaseHooks } from "../core/step";
import { appendEvent, createEventStore } from "../events/eventStore";
import { createDeterministicEventId } from "../events/event";
import {
  asActionId,
  asEventId,
  asFactionId,
  asInterventionCommitmentId,
  asInterventionId,
  asLandHexId,
  asRegionId,
  type CountryId,
} from "../state/ids";
import { IDEOLOGY_FIXTURE_IDS } from "../state/ideologyFixture";
import { createIdeologyFixtureScenario } from "../state/ideologyFixture";
import type { Faction } from "../state/faction";
import type { Region, ScenarioRegion } from "../state/region";
import type { TerritorialController } from "../state/region";
import type { ScenarioDefinition } from "../state/scenario";
import { getLandHexesForRegion } from "../state/territorialTopology";
import { createInitialWorldState, type WorldState } from "../state/world";
import {
  combinePressureComponents,
  createInstabilityPhaseHook,
  DEFAULT_INSTABILITY_CONFIG,
  deriveCountryInstability as deriveCountryInstabilityImpl,
  deriveRegionalPressureSnapshot as deriveRegionalPressureSnapshotImpl,
  deriveRegionalPressureSnapshots as deriveRegionalPressureSnapshotsImpl,
} from "./instability";

const REGION_IDS = {
  capital: asRegionId("t017.capital"),
  industrial: asRegionId("t017.industrial"),
  farmland: asRegionId("t017.farmland"),
} as const;

const FACTION_ID = asFactionId("t017.workers");

function cloneIdeology(region: Region): Region["ideology"] {
  return Object.fromEntries(
    Object.entries(region.ideology).map(([ideologyId, state]) => [
      ideologyId,
      { ...state },
    ]),
  ) as Region["ideology"];
}

function createT017Scenario(): ScenarioDefinition {
  const base = createIdeologyFixtureScenario();
  const country = base.initialCountries[0];
  const capital = base.initialRegions[0];
  const industrial = base.initialRegions[1];

  if (
    country === undefined ||
    capital === undefined ||
    industrial === undefined
  ) {
    throw new Error("T017 fixture base is incomplete.");
  }

  const farmland: ScenarioRegion = {
    ...industrial,
    id: REGION_IDS.farmland,
    name: "이념 실험 농지",
    population: 600,
    stateControl: 0.8,
    ideology: cloneIdeology(industrial),
  };

  return {
    ...base,
    initialCountries: [
      {
        ...country,
        name: "불안 실험국",
        capitalRegionId: REGION_IDS.capital,
        stateCapacity: 50,
      },
    ],
    initialRegions: [
      { ...capital, id: REGION_IDS.capital, name: "불안 실험 수도" },
      {
        ...industrial,
        id: REGION_IDS.industrial,
        name: "불안 실험 공업지대",
        ideology: cloneIdeology(industrial),
      },
      farmland,
    ],
    initialFactions: [
      {
        id: FACTION_ID,
        name: "노동자회",
        countryId: country.id,
        interests: ["labor" as const],
        resources: 0.5,
        organization: 0.1,
        influence: 0.1,
        grievance: 0.1,
        ideologyAffinity: { [IDEOLOGY_FIXTURE_IDS.communism]: 1 },
        foreignLinks: {},
        currentStrategy: "wait" as const,
      },
    ],
    mapContactTopology: {
      ...base.mapContactTopology,
      regionIds: [
        REGION_IDS.capital,
        REGION_IDS.industrial,
        REGION_IDS.farmland,
      ],
    },
    mapTerritorialTopology: {
      landHexes: [
        ...base.mapTerritorialTopology.landHexes.map((landHex) =>
          landHex.regionId === industrial.id
            ? { ...landHex, regionId: REGION_IDS.industrial }
            : landHex.regionId === capital.id
              ? { ...landHex, regionId: REGION_IDS.capital }
              : landHex,
        ),
        {
          id: asLandHexId("t017.farmland-hex"),
          regionId: REGION_IDS.farmland,
          coordinate: { q: 2, r: 0 },
          terrain: "plains" as const,
        },
      ],
    },
  };
}

const T017_SCENARIO = createT017Scenario();

function deriveCountryInstability(world: WorldState, countryId: CountryId) {
  return deriveCountryInstabilityImpl(world, countryId, T017_SCENARIO);
}

function deriveRegionalPressureSnapshot(
  world: WorldState,
  regionId: Region["id"],
  config = {},
) {
  return deriveRegionalPressureSnapshotImpl(
    world,
    regionId,
    config,
    T017_SCENARIO,
  );
}

function deriveRegionalPressureSnapshots(world: WorldState, config = {}) {
  return deriveRegionalPressureSnapshotsImpl(world, config, T017_SCENARIO);
}

function createWorld(): WorldState {
  return createInitialWorldState(T017_SCENARIO, 17017);
}

function withRegionController(
  scenario: ReturnType<typeof createT017Scenario>,
  world: WorldState,
  regionId: Region["id"],
  controller: TerritorialController,
): WorldState {
  const landHexStates = { ...world.landHexStates };
  for (const landHex of getLandHexesForRegion(scenario, regionId)) {
    landHexStates[landHex.id] = { controller: { ...controller } };
  }

  return { ...world, landHexStates };
}

function getCountryId(world: WorldState): CountryId {
  const countryId = Object.keys(world.countries)[0];
  if (countryId === undefined) {
    throw new Error("T017 country is missing.");
  }

  return countryId as CountryId;
}

function setRegion(
  world: WorldState,
  regionId: Region["id"],
  changes: Partial<Region>,
): WorldState {
  const region = world.regions[regionId];
  if (region === undefined) {
    throw new Error("T017 region is missing.");
  }

  return {
    ...world,
    regions: {
      ...world.regions,
      [regionId]: { ...region, ...changes },
    },
  };
}

function setFaction(world: WorldState, changes: Partial<Faction>): WorldState {
  const faction = world.factions[FACTION_ID];
  if (faction === undefined) {
    throw new Error("T017 faction is missing.");
  }

  return {
    ...world,
    factions: {
      ...world.factions,
      [FACTION_ID]: { ...faction, ...changes },
    },
  };
}

function createCalmWorld(): WorldState {
  return setFaction(createWorld(), {
    grievance: 0,
    organization: 0,
    influence: 0,
  });
}

const noOpPhase: SimulationPhaseHook = (context) => ({
  nextWorld: context.world,
  emittedEvents: [],
  nextEventSequence: context.nextEventSequence,
});

function instabilityHooks(
  config = DEFAULT_INSTABILITY_CONFIG,
): SimulationPhaseHooks {
  return {
    economy: noOpPhase,
    resources: noOpPhase,
    factionPressure: noOpPhase,
    instability: createInstabilityPhaseHook(config),
  };
}

function runDays(
  initialWorld: WorldState,
  days: number,
  config = DEFAULT_INSTABILITY_CONFIG,
): WorldState {
  let world = initialWorld;
  const hooks = instabilityHooks(config);

  for (let day = 0; day < days; day += 1) {
    world = runSimulationStep(
      world,
      { actions: [] },
      hooks,
      T017_SCENARIO,
    ).nextWorld;
  }

  return world;
}

function withCommitments(world: WorldState, load: number): WorldState {
  const countryId = getCountryId(world);
  const commitmentId = asInterventionCommitmentId("t017.commitment");

  return {
    ...world,
    interventionCommitments: {
      [commitmentId]: {
        id: commitmentId,
        interventionId: asInterventionId("t017.intervention"),
        countryId,
        sourceActionId: asActionId("t017.action"),
        startedTick: 0,
        firstOccupiedTick: 0,
        completionTick: 1000,
        administrativeLoad: load,
      },
    },
  };
}

describe("T017 instability pressure and aggregation", () => {
  it("derives the same pure pressure snapshot for the same WorldState", () => {
    const world = createWorld();

    expect(
      deriveRegionalPressureSnapshot(world, REGION_IDS.industrial),
    ).toEqual(deriveRegionalPressureSnapshot(world, REGION_IDS.industrial));
  });

  it("does not mutate WorldState and does not persist pressure snapshots", () => {
    const world = setRegion(createWorld(), REGION_IDS.industrial, {
      scarcity: 0.8,
    });
    const before = JSON.parse(JSON.stringify(world));

    deriveRegionalPressureSnapshots(world);

    expect(world).toEqual(before);
    expect("regionalPressureSnapshots" in world).toBe(false);
  });

  it("keeps all components and their compound result in the 0–1 range", () => {
    const world = setRegion(createWorld(), REGION_IDS.industrial, {
      scarcity: 0.8,
    });
    const snapshot = deriveRegionalPressureSnapshot(
      world,
      REGION_IDS.industrial,
    );

    expect(snapshot.material.severity).toBeGreaterThanOrEqual(0);
    expect(snapshot.political.severity).toBeLessThanOrEqual(1);
    expect(snapshot.administrative.severity).toBeLessThanOrEqual(1);
    expect(snapshot.combinedPressure).toBeLessThanOrEqual(1);
  });

  it("uses the saturating combination rule", () => {
    expect(combinePressureComponents([])).toBe(0);
    expect(combinePressureComponents([0.4, 0.4, 0.4])).toBeCloseTo(0.784);
    expect(combinePressureComponents([0.4, 0.4, 0.4])).toBeLessThanOrEqual(1);
  });

  it("does not treat ideology support alone as political pressure", () => {
    let world = createWorld();
    world = setRegion(world, REGION_IDS.industrial, {
      ideology: {
        ...world.regions[REGION_IDS.industrial]!.ideology,
        [IDEOLOGY_FIXTURE_IDS.communism]: {
          support: 0.95,
          radicalism: 0.02,
          organization: 0.02,
        },
      },
    });
    world = setFaction(world, {
      grievance: 0,
      organization: 0,
      influence: 0,
      currentStrategy: "organize",
    });
    const snapshot = deriveRegionalPressureSnapshot(
      world,
      REGION_IDS.industrial,
    );

    expect(snapshot.political.severity).toBe(0);
  });

  it("recognizes organized radical minority pressure without requiring high support", () => {
    let world = setFaction(createWorld(), {
      grievance: 0.8,
      organization: 0.8,
      influence: 0.6,
    });
    world = setRegion(world, REGION_IDS.industrial, {
      ideology: {
        ...world.regions[REGION_IDS.industrial]!.ideology,
        [IDEOLOGY_FIXTURE_IDS.communism]: {
          support: 0.2,
          radicalism: 0.8,
          organization: 0.8,
        },
      },
    });

    const snapshot = deriveRegionalPressureSnapshot(
      world,
      REGION_IDS.industrial,
    );

    expect(snapshot.political.severity).toBeGreaterThan(0.7);
    expect(snapshot.involvedFactionIds).toContain(FACTION_ID);
    expect(snapshot.involvedIdeologyIds).toContain(
      IDEOLOGY_FIXTURE_IDS.communism,
    );
  });

  it("does not let currentStrategy alone create political pressure", () => {
    const world = setFaction(createWorld(), {
      grievance: 0,
      organization: 0,
      influence: 0,
      currentStrategy: "organize",
    });

    expect(
      deriveRegionalPressureSnapshot(world, REGION_IDS.industrial).political
        .severity,
    ).toBe(0);
  });

  it("keeps material pressure separate from negative treasury pressure", () => {
    let world = createCalmWorld();
    const countryId = getCountryId(world);
    world = setRegion(world, REGION_IDS.industrial, { scarcity: 0 });
    world = {
      ...world,
      countries: {
        ...world.countries,
        [countryId]: { ...world.countries[countryId]!, treasury: -100 },
      },
    };
    const snapshot = deriveRegionalPressureSnapshot(
      world,
      REGION_IDS.industrial,
    );

    expect(snapshot.material.severity).toBe(0);
    expect(snapshot.combinedPressure).toBe(0);
  });

  it("requires overload before weak stateControl can create administrative pressure", () => {
    const calm = setRegion(createWorld(), REGION_IDS.industrial, {
      stateControl: 0.1,
    });
    const overloaded = withCommitments(calm, 55);
    const snapshot = deriveRegionalPressureSnapshot(
      overloaded,
      REGION_IDS.industrial,
    );

    expect(
      deriveRegionalPressureSnapshot(calm, REGION_IDS.industrial).administrative
        .severity,
    ).toBe(0);
    expect(snapshot.administrative.severity).toBeGreaterThan(0);
  });

  it("makes the same overload less harmful under stronger regional administration", () => {
    const overloaded = withCommitments(
      setRegion(createWorld(), REGION_IDS.industrial, { stateControl: 0.2 }),
      55,
    );
    const strong = setRegion(overloaded, REGION_IDS.industrial, {
      stateControl: 0.8,
    });

    expect(
      deriveRegionalPressureSnapshot(overloaded, REGION_IDS.industrial)
        .administrative.severity,
    ).toBeGreaterThan(
      deriveRegionalPressureSnapshot(strong, REGION_IDS.industrial)
        .administrative.severity,
    );
  });

  it("keeps Faction.organization and ideology organization as distinct gates", () => {
    let world = createWorld();
    world = setFaction(world, {
      grievance: 0.8,
      organization: 0,
      influence: 0.8,
    });
    world = setRegion(world, REGION_IDS.industrial, {
      ideology: {
        ...world.regions[REGION_IDS.industrial]!.ideology,
        [IDEOLOGY_FIXTURE_IDS.communism]: {
          support: 0.2,
          radicalism: 0.8,
          organization: 0.8,
        },
      },
    });
    expect(
      deriveRegionalPressureSnapshot(world, REGION_IDS.industrial).political
        .severity,
    ).toBe(0);

    world = setFaction(world, { organization: 0.8 });
    world = setRegion(world, REGION_IDS.industrial, {
      ideology: {
        ...world.regions[REGION_IDS.industrial]!.ideology,
        [IDEOLOGY_FIXTURE_IDS.communism]: {
          support: 0.2,
          radicalism: 0.8,
          organization: 0,
        },
      },
    });
    expect(
      deriveRegionalPressureSnapshot(world, REGION_IDS.industrial).political
        .severity,
    ).toBe(0);
  });

  it("accumulates unrest gradually and recovers gradually after pressure removal", () => {
    const pressured = setRegion(createCalmWorld(), REGION_IDS.industrial, {
      scarcity: 0.8,
    });
    const after30 = runDays(pressured, 30);
    const after90 = runDays(pressured, 90);
    const after180 = runDays(pressured, 180);
    const recovery30 = runDays(
      setRegion(after180, REGION_IDS.industrial, { scarcity: 0 }),
      30,
    );
    const recovery90 = runDays(
      setRegion(after180, REGION_IDS.industrial, { scarcity: 0 }),
      90,
    );

    expect(after30.regions[REGION_IDS.industrial]?.unrest).toBeGreaterThan(0);
    expect(after30.regions[REGION_IDS.industrial]?.unrest).toBeLessThan(0.8);
    expect(after90.regions[REGION_IDS.industrial]?.unrest).toBeGreaterThan(
      after30.regions[REGION_IDS.industrial]?.unrest ?? 0,
    );
    expect(after180.regions[REGION_IDS.industrial]?.unrest).toBeGreaterThan(
      after90.regions[REGION_IDS.industrial]?.unrest ?? 0,
    );
    expect(recovery30.regions[REGION_IDS.industrial]?.unrest).toBeGreaterThan(
      recovery90.regions[REGION_IDS.industrial]?.unrest ?? 0,
    );
    expect(recovery90.regions[REGION_IDS.industrial]?.unrest).toBeGreaterThan(
      0,
    );
  });

  it("does not pin unrest high after a one-day pressure pulse", () => {
    const pressured = setRegion(createCalmWorld(), REGION_IDS.industrial, {
      scarcity: 1,
    });
    const afterPulse = runDays(pressured, 1);
    const afterRecovery = runDays(
      setRegion(afterPulse, REGION_IDS.industrial, { scarcity: 0 }),
      180,
    );

    expect(afterPulse.regions[REGION_IDS.industrial]?.unrest).toBeLessThan(0.1);
    expect(afterRecovery.regions[REGION_IDS.industrial]?.unrest).toBeLessThan(
      afterPulse.regions[REGION_IDS.industrial]?.unrest ?? 1,
    );
  });

  it("updates only unrest and instability, leaving legitimacy and other T016B state intact", () => {
    const world = setRegion(createWorld(), REGION_IDS.industrial, {
      scarcity: 0.8,
    });
    const result = runSimulationStep(
      world,
      { actions: [] },
      instabilityHooks(),
      T017_SCENARIO,
    );
    const countryId = getCountryId(world);

    expect(result.nextWorld.countries[countryId]?.legitimacy).toBe(
      world.countries[countryId]?.legitimacy,
    );
    expect(result.nextWorld.countries[countryId]?.treasury).toBe(
      world.countries[countryId]?.treasury,
    );
    expect(result.nextWorld.factions).toBe(world.factions);
    expect(result.nextWorld.interventionCommitments).toBe(
      world.interventionCommitments,
    );
    expect(result.nextWorld.regions[REGION_IDS.industrial]?.unrest).not.toBe(
      world.regions[REGION_IDS.industrial]?.unrest,
    );
  });

  it("aggregates population-weighted unrest from controlled Regions only", () => {
    const world = createWorld();
    const regions = {
      ...world.regions,
      [REGION_IDS.capital]: {
        ...world.regions[REGION_IDS.capital]!,
        population: 100,
        unrest: 0.2,
      },
      [REGION_IDS.industrial]: {
        ...world.regions[REGION_IDS.industrial]!,
        population: 300,
        unrest: 0.5,
      },
      [REGION_IDS.farmland]: {
        ...world.regions[REGION_IDS.farmland]!,
        population: 600,
        unrest: 0.8,
      },
    };
    const aggregateWorld: WorldState = { ...world, regions };
    const countryId = getCountryId(world);

    expect(deriveCountryInstability(aggregateWorld, countryId)).toBe(65);

    const excluded = withRegionController(
      T017_SCENARIO,
      aggregateWorld,
      REGION_IDS.farmland,
      { kind: "uncontrolled" },
    );
    expect(deriveCountryInstability(excluded, countryId)).toBeCloseTo(
      ((0.2 * 100 + 0.5 * 300) / 400) * 100,
    );
  });

  it("returns deterministic zero when no Region is country-controlled", () => {
    const world = createWorld();
    const countryId = getCountryId(world);
    const uncontrolled = Object.values(world.regions).reduce(
      (currentWorld, region) =>
        withRegionController(T017_SCENARIO, currentWorld, region.id, {
          kind: "uncontrolled",
        }),
      world,
    );

    expect(deriveCountryInstability(uncontrolled, countryId)).toBe(0);
  });

  it("is independent of Region object insertion order", () => {
    const world = createWorld();
    const countryId = getCountryId(world);
    const reversed = Object.fromEntries(
      Object.entries(world.regions).reverse(),
    ) as WorldState["regions"];

    expect(
      deriveCountryInstability({ ...world, regions: reversed }, countryId),
    ).toBe(deriveCountryInstability(world, countryId));
  });

  it("does not double-count administrative overload at national aggregation", () => {
    const world = createWorld();
    const countryId = getCountryId(world);
    const overloaded = withCommitments(world, 55);

    expect(deriveCountryInstability(overloaded, countryId)).toBe(
      deriveCountryInstability(world, countryId),
    );
  });

  it("emits sparse deterministic band events with valid existing causes only", () => {
    let world = createCalmWorld();
    for (const regionId of Object.values(REGION_IDS)) {
      world = setRegion(world, regionId, { scarcity: 1, unrest: 0.249 });
    }
    const first = runSimulationStep(
      world,
      { actions: [] },
      instabilityHooks(),
      T017_SCENARIO,
    );
    const second = runSimulationStep(
      first.nextWorld,
      { actions: [] },
      instabilityHooks(),
      T017_SCENARIO,
    );
    const firstEvents = first.emittedEvents.filter((event) =>
      event.type.endsWith("_BAND_CHANGED"),
    );
    const store = firstEvents.reduce(
      (current, event) => appendEvent(current, event),
      createEventStore(),
    );

    expect(firstEvents.map((event) => event.type)).toContain(
      "REGION_UNREST_BAND_CHANGED",
    );
    expect(firstEvents.map((event) => event.type)).toContain(
      "NATIONAL_INSTABILITY_BAND_CHANGED",
    );
    expect(
      second.emittedEvents.some((event) =>
        event.type.endsWith("_BAND_CHANGED"),
      ),
    ).toBe(false);
    expect(
      firstEvents.every((event) =>
        event.causeIds.every((causeId) =>
          store.events.some((item) => item.id === causeId),
        ),
      ),
    ).toBe(true);
    expect(
      firstEvents.every(
        (event, index) =>
          event.id ===
            createDeterministicEventId(
              event.tick,
              event.sequence,
              event.type,
            ) &&
          (index === 0 || event.sequence > firstEvents[index - 1]!.sequence),
      ),
    ).toBe(true);
  });

  it("does not emit rebellion, coup, revolution, civil-war, or scheduled-crisis events", () => {
    const world = setRegion(createWorld(), REGION_IDS.industrial, {
      scarcity: 1,
    });
    const result = runSimulationStep(
      world,
      { actions: [] },
      instabilityHooks(),
      T017_SCENARIO,
    );
    const forbidden = [
      "REBELLION",
      "COUP",
      "REVOLUTION",
      "CIVIL_WAR_STARTED",
      "STRIKE_STARTED",
    ];

    expect(
      result.emittedEvents.some((event) => forbidden.includes(event.type)),
    ).toBe(false);
    expect(result.actionProposals).toEqual([]);
  });

  it("does not advance or update a terminal run", () => {
    const world = createWorld();
    const terminalWorld: WorldState = {
      ...world,
      run: {
        ...world.run,
        outcome: {
          status: "won",
          kind: "orderConsolidated",
          atTick: 0,
          causeEventId: asEventId("event:0:0:ORDER_CONSOLIDATED"),
        },
      },
    };

    const result = runSimulationStep(
      terminalWorld,
      { actions: [] },
      {
        instability: () => {
          throw new Error("terminal run must not execute instability");
        },
      },
    );

    expect(result.nextWorld).toBe(terminalWorld);
    expect(result.emittedEvents).toEqual([]);
  });
});
