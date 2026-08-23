import { describe, expect, it } from "vitest";

import { appendEvent, createEventStore } from "../events/eventStore";
import { assertWorldStateInvariants } from "../core/invariants";
import {
  asCountryId,
  asEventId,
  asGovernmentId,
  asLandHexId,
  asRegionId,
  asScenarioId,
} from "../state/ids";
import {
  FOUNDATION_SCENARIO,
  type ScenarioDefinition,
} from "../state/scenario";
import { createDefaultInstitutionalRuleState } from "../state/policy";
import { createInitialWorldState, type WorldState } from "../state/world";
import { runSimulationStep } from "../core/tick";
import { calculateTreasuryPressure, isTreasurySolvent } from "./economy";

const countryId = asCountryId("economy-country");
const governmentId = asGovernmentId("economy-government");
const capitalId = asRegionId("economy-capital");
const farmlandId = asRegionId("economy-farmland");
const mineId = asRegionId("economy-mine");

function createRegion(
  id: ReturnType<typeof asRegionId>,
  name: string,
  resourceProductionCapacity: Record<string, number>,
  resourceDemand: Record<string, number>,
  resources: Record<string, number> = {},
) {
  return {
    id,
    name,
    ownerCountryId: countryId,
    initialController: { kind: "country" as const, countryId },
    population: 100,
    urbanization: 0.5,
    accessibility: 0.8,
    resources,
    resourceProductionCapacity,
    resourceProduction: {},
    resourceDemand,
    production: 0,
    stateControl: 0.8,
    infrastructure: 0.8,
    scarcity: 0,
    unrest: 0,
    ideology: {},
  };
}

function createEconomyScenario(
  farmlandDemand: Record<string, number> = { food: 4 },
): ScenarioDefinition {
  return {
    ...FOUNDATION_SCENARIO,
    id: asScenarioId("economy-scenario"),
    playerCountryId: countryId,
    initialCountries: [
      {
        id: countryId,
        name: "Economy State",
        currentGovernmentId: governmentId,
        treasury: 100,
        dailyIncome: 0,
        dailyExpenditure: 8,
        legitimacy: 50,
        stateCapacity: 50,
        production: 0,
        militaryPower: 50,
        instability: 0,
        stateContinuity: 100,
        capitalRegionId: capitalId,
        diplomacy: {},
      },
    ],
    initialRegions: [
      createRegion(capitalId, "Capital", {}, {}, { food: 2 }),
      createRegion(farmlandId, "Farmland", { food: 10 }, farmlandDemand),
      createRegion(mineId, "Mine", { material: 4, mana: 2 }, {}),
    ],
    initialGovernments: [
      {
        id: governmentId,
        countryId,
        name: "Economy Government",
        authority: "central",
        formedAtTick: 0,
      },
    ],
    initialCountryPolicies: {
      [countryId]: {
        activePolicyIds: [],
        enactedAtTick: {},
        institutionalRules: createDefaultInstitutionalRuleState(),
      },
    },
    mapContactTopology: {
      regionIds: [capitalId, farmlandId, mineId],
      contactEdges: [],
    },
    mapTerritorialTopology: {
      landHexes: [
        {
          id: asLandHexId("economy-capital-hex"),
          regionId: capitalId,
          coordinate: { q: 0, r: 0 },
          terrain: "plains",
        },
        {
          id: asLandHexId("economy-farmland-hex"),
          regionId: farmlandId,
          coordinate: { q: 1, r: 0 },
          terrain: "plains",
        },
        {
          id: asLandHexId("economy-mine-hex"),
          regionId: mineId,
          coordinate: { q: 2, r: 0 },
          terrain: "mountains",
        },
      ],
    },
  };
}

const ECONOMY_SCENARIO = createEconomyScenario();

function runEconomyStep(
  world: WorldState,
  hooks: Parameters<typeof runSimulationStep>[2] = {},
) {
  return runSimulationStep(world, { actions: [] }, hooks, ECONOMY_SCENARIO);
}

function createEconomyWorld(
  farmlandDemand?: Record<string, number>,
  seed = 123,
): WorldState {
  return createInitialWorldState(createEconomyScenario(farmlandDemand), seed);
}

describe("T011 country and region economy", () => {
  it("produces the same economic result for the same seed, state, and actions", () => {
    const first = runEconomyStep(createEconomyWorld());
    const second = runEconomyStep(createEconomyWorld());

    expect(first).toEqual(second);
  });

  it("aggregates national production only from country-controlled regions", () => {
    const world = createEconomyWorld();
    const result = runEconomyStep(world);

    expect(result.nextWorld.countries[countryId]?.production).toBe(16);
    expect(result.nextWorld.regions[mineId]?.production).toBe(6);
  });

  it("reduces national production when a productive region loses control", () => {
    const world = createEconomyWorld();
    const region = world.regions[mineId];

    if (region === undefined) {
      throw new Error("Economy fixture mine is missing.");
    }

    const territoryLost: WorldState = {
      ...world,
      landHexStates: {
        ...world.landHexStates,
        [asLandHexId("economy-mine-hex")]: {
          controller: { kind: "uncontrolled" },
        },
      },
    };
    const result = runEconomyStep(territoryLost);

    expect(result.nextWorld.countries[countryId]?.production).toBe(10);
    expect(result.nextWorld.regions[mineId]?.production).toBe(6);
  });

  it("materializes deterministic resource production and consumption", () => {
    const first = runEconomyStep(createEconomyWorld());
    const second = runEconomyStep(first.nextWorld);

    expect(first.nextWorld.regions[farmlandId]?.resourceProduction).toEqual({
      food: 10,
    });
    expect(first.nextWorld.regions[farmlandId]?.resources).toEqual({
      food: 6,
    });
    expect(second.nextWorld.regions[farmlandId]?.resources).toEqual({
      food: 12,
    });
    expect(first.nextWorld.regions[mineId]?.resources).toEqual({
      material: 4,
      mana: 2,
    });
  });

  it("creates scarcity when demand exceeds available supply", () => {
    const result = runEconomyStep(createEconomyWorld({ food: 12 }));
    const farmland = result.nextWorld.regions[farmlandId];

    expect(farmland?.resources).toEqual({});
    expect(farmland?.scarcity).toBeCloseTo(1 / 6);
    expect(
      result.emittedEvents.some(
        (event) => event.type === "RESOURCE_SHORTAGE_CHANGED",
      ),
    ).toBe(true);
  });

  it("does not create false scarcity when available supply meets demand", () => {
    const result = runEconomyStep(createEconomyWorld());

    expect(result.nextWorld.regions[farmlandId]?.scarcity).toBe(0);
  });

  it("settles treasury from daily income and expenditure, including negative treasury", () => {
    const result = runEconomyStep(createEconomyWorld());
    const country = result.nextWorld.countries[countryId];

    expect(country?.dailyIncome).toBe(16);
    expect(country?.dailyExpenditure).toBe(8);
    expect(country?.treasury).toBe(108);
    expect(
      country === undefined ? undefined : calculateTreasuryPressure(country),
    ).toBe(0);
    expect(country === undefined ? undefined : isTreasurySolvent(country)).toBe(
      true,
    );

    const poorWorld: WorldState = createEconomyWorld();
    const poorCountry = poorWorld.countries[countryId];

    if (poorCountry === undefined) {
      throw new Error("Economy fixture country is missing.");
    }

    const deficitWorld: WorldState = {
      ...poorWorld,
      countries: {
        ...poorWorld.countries,
        [countryId]: {
          ...poorCountry,
          treasury: 0,
          dailyExpenditure: 20,
        },
      },
    };
    const deficitResult = runEconomyStep(deficitWorld);

    expect(deficitResult.nextWorld.countries[countryId]?.treasury).toBe(-4);
    const deficitCountry = deficitResult.nextWorld.countries[countryId];

    if (deficitCountry === undefined) {
      throw new Error("Deficit economy country is missing.");
    }

    expect(calculateTreasuryPressure(deficitCountry)).toBe(4);
    expect(isTreasurySolvent(deficitCountry)).toBe(false);
    assertWorldStateInvariants(deficitResult.nextWorld);
  });

  it("emits ordered economic events with only existing causal references", () => {
    const result = runEconomyStep(createEconomyWorld({ food: 12 }));
    const store = result.emittedEvents.reduce(
      (currentStore, event) => appendEvent(currentStore, event),
      createEventStore(),
    );

    expect(store.events.map((event) => event.type)).toContain(
      "NATIONAL_PRODUCTION_CHANGED",
    );
    expect(store.events.map((event) => event.type)).toContain(
      "TREASURY_CHANGED",
    );
    expect(store.events.map((event) => event.type)).toContain(
      "RESOURCE_PRODUCED",
    );
    expect(store.events.map((event) => event.type)).toContain(
      "RESOURCE_SHORTAGE_CHANGED",
    );
  });

  it("keeps metrics valid and does not mutate the input world", () => {
    const world = createEconomyWorld();
    const before = JSON.parse(JSON.stringify(world));
    const result = runEconomyStep(world);

    assertWorldStateInvariants(result.nextWorld);
    expect(world).toEqual(before);
  });

  it("does not execute economy in a terminal run", () => {
    const world = createEconomyWorld();
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
    let economyCalled = false;

    const result = runEconomyStep(terminalWorld, {
      economy: () => {
        economyCalled = true;
        throw new Error("terminal economy must not run");
      },
    });

    expect(economyCalled).toBe(false);
    expect(result.nextWorld).toBe(terminalWorld);
    expect(result.emittedEvents).toEqual([]);
  });
});
