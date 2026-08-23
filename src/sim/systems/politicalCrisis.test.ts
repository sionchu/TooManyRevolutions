import { describe, expect, it } from "vitest";

import type { SimulationPhaseHook, SimulationPhaseHooks } from "../core/step";
import { runSimulationStep } from "../core/tick";
import { asFactionId, type FactionId } from "../state/ids";
import { IDEOLOGY_FIXTURE_IDS } from "../state/ideologyFixture";
import {
  createPoliticalCrisisFixtureScenario,
  POLITICAL_CRISIS_FIXTURE_FACTION_IDS,
} from "../state/politicalCrisisFixture";
import type { Faction } from "../state/faction";
import type { Country } from "../state/country";
import type { ScenarioDefinition } from "../state/scenario";
import { createInitialWorldState, type WorldState } from "../state/world";
import { runConflictPhase } from "./conflict";
import {
  deriveCrisisStateWeakness,
  deriveCoupPrerequisites,
  deriveRebellionPrerequisites,
} from "./politicalCrisis";

const { coup: COUP_FACTION_ID, rebellion: REBELLION_FACTION_ID } =
  POLITICAL_CRISIS_FIXTURE_FACTION_IDS;

const NOOP_PHASE: SimulationPhaseHook = (context) => ({
  nextWorld: context.world,
  emittedEvents: [],
  nextEventSequence: context.nextEventSequence,
});

const CONFLICT_ONLY_HOOKS: SimulationPhaseHooks = {
  economy: NOOP_PHASE,
  resources: NOOP_PHASE,
  ideologyDiffusion: NOOP_PHASE,
  factionPressure: NOOP_PHASE,
  instability: NOOP_PHASE,
  diplomacy: NOOP_PHASE,
  conflict: runConflictPhase,
  evaluateOrderConsolidationAndDissolution: NOOP_PHASE,
};

function createFixtureScenario(): ScenarioDefinition {
  return createPoliticalCrisisFixtureScenario();
}

function createFixtureWorld(
  scenario: ScenarioDefinition = createFixtureScenario(),
): WorldState {
  return createInitialWorldState(scenario, 18018);
}

function withFaction(
  world: WorldState,
  factionId: FactionId,
  patch: Partial<Faction>,
): WorldState {
  const faction = world.factions[factionId];
  if (faction === undefined) {
    throw new Error(`Missing fixture faction ${factionId}.`);
  }

  return {
    ...world,
    factions: {
      ...world.factions,
      [factionId]: { ...faction, ...patch },
    },
  };
}

function withCountry(world: WorldState, patch: Partial<Country>): WorldState {
  const country = Object.values(world.countries)[0];
  if (country === undefined) {
    throw new Error("Fixture country is missing.");
  }

  return {
    ...world,
    countries: {
      ...world.countries,
      [country.id]: { ...country, ...patch },
    },
  };
}

function withRegionalPolitics(
  world: WorldState,
  values: {
    readonly capitalUnrest?: number;
    readonly industrialUnrest?: number;
    readonly industrialSupport?: number;
    readonly industrialRadicalism?: number;
    readonly industrialOrganization?: number;
  },
): WorldState {
  const regions = Object.values(world.regions);
  const capital = regions[0];
  const industrial = regions[1];
  if (capital === undefined || industrial === undefined) {
    throw new Error("Political crisis fixture regions are incomplete.");
  }

  return {
    ...world,
    regions: {
      ...world.regions,
      [capital.id]: {
        ...capital,
        ...(values.capitalUnrest === undefined
          ? {}
          : { unrest: values.capitalUnrest }),
      },
      [industrial.id]: {
        ...industrial,
        ...(values.industrialUnrest === undefined
          ? {}
          : { unrest: values.industrialUnrest }),
        ideology: {
          ...industrial.ideology,
          [IDEOLOGY_FIXTURE_IDS.communism]: {
            ...industrial.ideology[IDEOLOGY_FIXTURE_IDS.communism],
            ...(values.industrialSupport === undefined
              ? {}
              : { support: values.industrialSupport }),
            ...(values.industrialRadicalism === undefined
              ? {}
              : { radicalism: values.industrialRadicalism }),
            ...(values.industrialOrganization === undefined
              ? {}
              : { organization: values.industrialOrganization }),
          },
        },
      },
    },
  };
}

function withoutCapability(
  scenario: ScenarioDefinition,
  factionId: FactionId,
  capabilities: readonly ("coup" | "rebellion")[],
): ScenarioDefinition {
  return {
    ...scenario,
    factionCapabilities: {
      ...(scenario.factionCapabilities ?? {}),
      [factionId]: capabilities,
    },
  };
}

function firstCoup(scenario: ScenarioDefinition, world: WorldState) {
  const snapshot = deriveCoupPrerequisites(scenario, world)[0];
  if (snapshot === undefined) {
    throw new Error("Fixture coup candidate is missing.");
  }
  return snapshot;
}

function firstRebellion(scenario: ScenarioDefinition, world: WorldState) {
  const snapshot = deriveRebellionPrerequisites(scenario, world)[0];
  if (snapshot === undefined) {
    throw new Error("Fixture rebellion candidate is missing.");
  }
  return snapshot;
}

describe("T018 political crisis prerequisites", () => {
  it("does not trigger from high unrest or instability without organized actors", () => {
    const scenario = createFixtureScenario();
    let world = createFixtureWorld(scenario);
    world = withCountry(world, {
      legitimacy: 5,
      stateCapacity: 5,
      instability: 100,
    });
    world = withFaction(world, COUP_FACTION_ID, {
      organization: 0.1,
      grievance: 0.9,
      influence: 0.9,
      resources: 0.9,
    });
    world = withFaction(world, REBELLION_FACTION_ID, {
      organization: 0.1,
      grievance: 0.9,
      resources: 0.9,
    });
    world = withRegionalPolitics(world, {
      capitalUnrest: 1,
      industrialUnrest: 1,
    });

    expect(firstCoup(scenario, world).eligible).toBe(false);
    expect(firstRebellion(scenario, world).eligible).toBe(false);
  });

  it("does not trigger rebellion from high support when radicalism and organization are low", () => {
    const scenario = createFixtureScenario();
    let world = createFixtureWorld(scenario);
    world = withFaction(world, REBELLION_FACTION_ID, {
      grievance: 0.9,
      resources: 0.9,
      organization: 0.1,
    });
    world = withRegionalPolitics(world, {
      industrialSupport: 1,
      industrialRadicalism: 0.1,
      industrialOrganization: 0.1,
      industrialUnrest: 0.9,
    });

    const snapshot = firstRebellion(scenario, world);
    expect(snapshot.supportingSignals.maximumAffinityWeightedSupport).toBe(1);
    expect(snapshot.eligible).toBe(false);
    expect(
      snapshot.gates.find((gate) => gate.id === "localRadicalism")?.status,
    ).toBe("fail");
    expect(
      snapshot.gates.find((gate) => gate.id === "localIdeologyOrganization")
        ?.status,
    ).toBe("fail");
  });

  it("does not use currentStrategy as a crisis trigger", () => {
    const scenario = createFixtureScenario();
    let world = createFixtureWorld(scenario);
    world = withCountry(world, {
      legitimacy: 80,
      stateCapacity: 80,
      instability: 0,
    });
    world = withFaction(world, COUP_FACTION_ID, {
      currentStrategy: "fundMovement",
      grievance: 0.1,
      organization: 0.1,
      influence: 0.1,
      resources: 0.1,
    });
    world = withFaction(world, REBELLION_FACTION_ID, {
      currentStrategy: "organize",
      grievance: 0.1,
      organization: 0.1,
      resources: 0.1,
    });
    world = withRegionalPolitics(world, {
      capitalUnrest: 0.1,
      industrialUnrest: 0.1,
      industrialSupport: 1,
      industrialRadicalism: 0.1,
      industrialOrganization: 0.1,
    });

    expect(firstCoup(scenario, world).eligible).toBe(false);
    expect(firstRebellion(scenario, world).eligible).toBe(false);
  });

  it("keeps coup and rebellion as distinct capability-gated models", () => {
    const scenario = createFixtureScenario();
    const world = createFixtureWorld(scenario);
    const coupOnlyScenario = withoutCapability(
      withoutCapability(scenario, REBELLION_FACTION_ID, []),
      COUP_FACTION_ID,
      ["coup"],
    );
    const rebellionOnlyScenario = withoutCapability(
      withoutCapability(scenario, COUP_FACTION_ID, []),
      REBELLION_FACTION_ID,
      ["rebellion"],
    );

    expect(firstCoup(coupOnlyScenario, world).eligible).toBe(true);
    expect(deriveRebellionPrerequisites(coupOnlyScenario, world)).toEqual([]);
    expect(firstRebellion(rebellionOnlyScenario, world).eligible).toBe(true);
    expect(deriveCoupPrerequisites(rebellionOnlyScenario, world)).toEqual([]);
  });

  it("treats concentrated regional mobilization differently from diffuse averages", () => {
    const scenario = createFixtureScenario();
    const baseWorld = createFixtureWorld(scenario);
    const concentrated = withRegionalPolitics(baseWorld, {
      capitalUnrest: 0.1,
      industrialUnrest: 0.9,
      industrialRadicalism: 0.9,
      industrialOrganization: 0.9,
    });
    const diffuse = withRegionalPolitics(baseWorld, {
      capitalUnrest: 0.5,
      industrialUnrest: 0.5,
      industrialRadicalism: 0.5,
      industrialOrganization: 0.5,
    });

    const concentratedSnapshot = firstRebellion(scenario, concentrated);
    const diffuseSnapshot = firstRebellion(scenario, diffuse);
    expect(concentratedSnapshot.geographicConcentration).toBeGreaterThan(
      diffuseSnapshot.geographicConcentration,
    );
    expect(concentratedSnapshot.eligible).toBe(true);
    expect(diffuseSnapshot.eligible).toBe(false);
  });

  it("reports future evidence as not implemented and does not use it", () => {
    const scenario = createFixtureScenario();
    const world = createFixtureWorld(scenario);
    const coup = firstCoup(scenario, world);
    const rebellion = firstRebellion(scenario, world);

    expect(coup.futureEvidence).toEqual([
      { id: "foreignSupport", status: "notImplemented" },
      { id: "leadership", status: "notImplemented" },
      { id: "militarySympathy", status: "notImplemented" },
      { id: "weapons", status: "notImplemented" },
    ]);
    expect(rebellion.futureEvidence).toEqual(coup.futureEvidence);
  });

  it("uses LandHex projection for weakness but never mutates territorial state", () => {
    const scenario = createFixtureScenario();
    const world = createFixtureWorld(scenario);
    const before = JSON.stringify(world);
    const result = runSimulationStep(
      world,
      { actions: [] },
      CONFLICT_ONLY_HOOKS,
      scenario,
    );

    expect(JSON.stringify(world)).toBe(before);
    expect(result.nextWorld.landHexStates).toBe(world.landHexStates);
    expect(result.nextWorld.regions).toBe(world.regions);
    expect(result.nextWorld.governments).toBe(world.governments);
    expect(result.nextWorld.run.outcome).toEqual({ status: "active" });
    expect(
      Object.values(world.regions).every(
        (region) => !Object.prototype.hasOwnProperty.call(region, "controller"),
      ),
    ).toBe(true);

    const countryId = Object.values(world.countries)[0]!.id;
    const baselineWeakness = deriveCrisisStateWeakness(
      scenario,
      world,
      countryId,
    );
    const factionControlledWorld: WorldState = {
      ...world,
      landHexStates: {
        ...world.landHexStates,
        [scenario.mapTerritorialTopology.landHexes[0]!.id]: {
          controller: { kind: "faction", factionId: COUP_FACTION_ID },
        },
      },
    };
    const projectedWeakness = deriveCrisisStateWeakness(
      scenario,
      factionControlledWorld,
      countryId,
    );
    expect(projectedWeakness.territorialWeakness).toBeGreaterThan(
      baselineWeakness.territorialWeakness,
    );
  });

  it("does not create duplicate active crises on the following day", () => {
    const fullScenario = createFixtureScenario();
    const scenario = withoutCapability(fullScenario, REBELLION_FACTION_ID, []);
    const world = createFixtureWorld(scenario);
    const first = runSimulationStep(
      world,
      { actions: [] },
      CONFLICT_ONLY_HOOKS,
      scenario,
    );
    const second = runSimulationStep(
      first.nextWorld,
      { actions: [] },
      CONFLICT_ONLY_HOOKS,
      scenario,
    );

    expect(
      first.emittedEvents.some(
        (event) => event.type === "COUP_ATTEMPT_STARTED",
      ),
    ).toBe(true);
    expect(
      second.emittedEvents.some(
        (event) => event.type === "COUP_ATTEMPT_STARTED",
      ),
    ).toBe(false);
    expect(Object.keys(second.nextWorld.conflicts)).toHaveLength(
      Object.keys(first.nextWorld.conflicts).length,
    );
  });

  it("orders multiple eligible candidates independently of insertion order", () => {
    const base = createFixtureScenario();
    const firstCoup = base.initialFactions.find(
      (faction) => faction.id === COUP_FACTION_ID,
    );
    if (firstCoup === undefined) {
      throw new Error("Fixture coup faction is missing.");
    }
    const secondCoupId = asFactionId("t018.fixture.coup-alpha");
    const secondCoup = { ...firstCoup, id: secondCoupId };
    const capabilities = {
      [COUP_FACTION_ID]: ["coup" as const],
      [secondCoupId]: ["coup" as const],
      [REBELLION_FACTION_ID]: [],
    };
    const firstScenario: ScenarioDefinition = {
      ...base,
      initialFactions: [...base.initialFactions, secondCoup],
      factionCapabilities: capabilities,
    };
    const secondScenario: ScenarioDefinition = {
      ...firstScenario,
      initialFactions: [...firstScenario.initialFactions].reverse(),
    };
    const first = runSimulationStep(
      createFixtureWorld(firstScenario),
      { actions: [] },
      CONFLICT_ONLY_HOOKS,
      firstScenario,
    );
    const second = runSimulationStep(
      createFixtureWorld(secondScenario),
      { actions: [] },
      CONFLICT_ONLY_HOOKS,
      secondScenario,
    );

    expect(first.emittedEvents.map((event) => event.id)).toEqual(
      second.emittedEvents.map((event) => event.id),
    );
    expect(first.emittedEvents.map((event) => event.type)).toEqual([
      "COUP_ATTEMPT_STARTED",
      "COUP_ATTEMPT_STARTED",
      "TICK_ADVANCED",
    ]);
  });

  it("preserves CountryId continuity and does not resolve Government at detection", () => {
    const scenario = createFixtureScenario();
    const world = createFixtureWorld(scenario);
    const result = runSimulationStep(
      world,
      { actions: [] },
      CONFLICT_ONLY_HOOKS,
      scenario,
    );
    const conflict = Object.values(result.nextWorld.conflicts)[0];
    const country = Object.values(world.countries)[0]!;

    expect(conflict?.participantCountryIds).toEqual([country.id]);
    expect(result.nextWorld.governments).toBe(world.governments);
    expect(result.nextWorld.countries[country.id]).toBe(
      world.countries[country.id],
    );
    expect(result.nextWorld.run.outcome).toEqual({ status: "active" });
    expect(result.actionProposals).toEqual([]);
  });

  it("is pure and deterministic for the same scenario and WorldState", () => {
    const scenario = createFixtureScenario();
    const world = createFixtureWorld(scenario);
    const before = JSON.stringify(world);
    const first = runSimulationStep(
      world,
      { actions: [] },
      CONFLICT_ONLY_HOOKS,
      scenario,
    );
    const second = runSimulationStep(
      world,
      { actions: [] },
      CONFLICT_ONLY_HOOKS,
      scenario,
    );

    expect(second).toEqual(first);
    expect(JSON.stringify(world)).toBe(before);
    expect(first.nextWorld.rngState).toBe(world.rngState);
  });

  it("validates scenario-owned capability references before run creation", () => {
    const scenario = createFixtureScenario();
    const invalidScenario: ScenarioDefinition = {
      ...scenario,
      factionCapabilities: {
        ...(scenario.factionCapabilities ?? {}),
        [asFactionId("t018.fixture.missing")]: ["coup"],
      },
    };

    expect(() => createFixtureWorld(invalidScenario)).toThrow(
      "missing faction",
    );
  });
});
