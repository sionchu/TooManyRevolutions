import { describe, expect, it } from "vitest";

import { assertWorldStateInvariants } from "../core/invariants";
import { runSimulationStep } from "../core/tick";
import { createDeterministicActionId } from "../state/action";
import { createGameEvent } from "../events/event";
import { appendEvent, createEventStore } from "../events/eventStore";
import type { ValidatedActionRecord } from "../state/action";
import {
  applyIdeologyAdjustment,
  deriveCountryIdeology,
  deriveDominantTendencies,
  deriveIdeologySusceptibilityInputs,
  type IdeologyAdjustment,
} from "../state/ideology";
import {
  createIdeologyFixtureScenario,
  IDEOLOGY_FIXTURE_IDS,
} from "../state/ideologyFixture";
import {
  asEventId,
  asFactionId,
  type CountryId,
  type RegionId,
} from "../state/ids";
import { createPolicyPhaseHook } from "./policy";
import { POLICY_FIXTURE_IDS } from "../state/policyFixture";
import { createInitialWorldState, type WorldState } from "../state/world";
import { getLandHexesForRegion } from "../state/territorialTopology";
import type { Faction } from "../state/faction";
import type { TerritorialController } from "../state/region";
import { createIdeologyAdjustmentPhaseHook } from "./ideologyState";

function createFixtureWorld(): {
  readonly scenario: ReturnType<typeof createIdeologyFixtureScenario>;
  readonly world: WorldState;
  readonly countryId: CountryId;
} {
  const scenario = createIdeologyFixtureScenario();
  const countryId = scenario.playerCountryId;

  if (countryId === null) {
    throw new Error("Ideology fixture must have a player country.");
  }

  return {
    scenario,
    world: createInitialWorldState(scenario, 31),
    countryId,
  };
}

function withRegionController(
  scenario: ReturnType<typeof createIdeologyFixtureScenario>,
  world: WorldState,
  regionId: RegionId,
  controller: TerritorialController,
): WorldState {
  const landHexStates = { ...world.landHexStates };
  for (const landHex of getLandHexesForRegion(scenario, regionId)) {
    landHexStates[landHex.id] = { controller: { ...controller } };
  }

  return { ...world, landHexStates };
}

function createCauseEvent() {
  return createGameEvent({
    tick: 1,
    sequence: 0,
    type: "TRADE_DISRUPTED",
    causeIds: [],
    payload: { source: "t013-test" },
    visibility: "hidden",
  });
}

function createAdjustment(
  regionId: RegionId,
  dimension: IdeologyAdjustment["dimension"],
  delta: number,
  causeId = asEventId("event:1:0:TRADE_DISRUPTED"),
): IdeologyAdjustment {
  return {
    regionId,
    ideologyId: IDEOLOGY_FIXTURE_IDS.republicanism,
    dimension,
    delta,
    causeIds: [causeId],
  };
}

function runAdjustmentStep(
  world: WorldState,
  adjustments: readonly IdeologyAdjustment[],
) {
  const causeEvent = createCauseEvent();

  return runSimulationStep(
    world,
    { actions: [] },
    {
      applyScheduledEffects: (context) => ({
        nextWorld: context.world,
        emittedEvents: [causeEvent],
        nextEventSequence: context.nextEventSequence + 1,
      }),
      ideologyDiffusion: createIdeologyAdjustmentPhaseHook(adjustments),
    },
  );
}

function createPolicyAction(
  sequence: number,
  policyId = POLICY_FIXTURE_IDS.abolishRoyalVeto,
): ValidatedActionRecord {
  return {
    id: createDeterministicActionId(1, sequence, "player", "ENACT_POLICY"),
    tick: 1,
    sequence,
    source: "player",
    actionType: "ENACT_POLICY",
    payload: { policyId },
    schemaVersion: 1,
    validationOutcome: { kind: "accepted" },
  };
}

describe("T013 ideology state", () => {
  it("keeps the canonical ideology catalog in ScenarioDefinition", () => {
    const { scenario, world } = createFixtureWorld();

    expect(Object.keys(scenario.ideologyCatalog)).toEqual([
      IDEOLOGY_FIXTURE_IDS.monarchy,
      IDEOLOGY_FIXTURE_IDS.republicanism,
      IDEOLOGY_FIXTURE_IDS.democracy,
      IDEOLOGY_FIXTURE_IDS.communism,
    ]);
    expect(
      scenario.ideologyCatalog[IDEOLOGY_FIXTURE_IDS.republicanism],
    ).toMatchObject({
      name: "공화주의",
      category: "regime",
    });
    expect(world).not.toHaveProperty("ideologyCatalog");
  });

  it("requires every initial region to cover exactly the catalog IDs", () => {
    const scenario = createIdeologyFixtureScenario();
    const region = scenario.initialRegions[0];

    if (region === undefined) {
      throw new Error("Ideology fixture region is missing.");
    }

    const missingIdeology = Object.fromEntries(
      Object.entries(region.ideology).filter(
        ([ideologyId]) => ideologyId !== IDEOLOGY_FIXTURE_IDS.monarchy,
      ),
    ) as typeof region.ideology;
    const incompleteScenario = {
      ...scenario,
      initialRegions: scenario.initialRegions.map((candidate) =>
        candidate.id === region.id
          ? { ...candidate, ideology: missingIdeology }
          : candidate,
      ),
    };

    expect(() => createInitialWorldState(incompleteScenario, 31)).toThrow(
      "missing ideology state",
    );
  });

  it("keeps each region ideology dimension independently bounded", () => {
    const { world } = createFixtureWorld();

    expect(() => assertWorldStateInvariants(world)).not.toThrow();
    const capital = Object.values(world.regions)[0];

    if (capital === undefined) {
      throw new Error("Ideology fixture capital is missing.");
    }

    const republicanSupport =
      capital.ideology[IDEOLOGY_FIXTURE_IDS.republicanism]?.support ?? 0;
    const monarchistSupport =
      capital.ideology[IDEOLOGY_FIXTURE_IDS.monarchy]?.support ?? 0;

    expect(republicanSupport + monarchistSupport).toBeGreaterThan(1);
  });

  it("does not normalize or force support totals to one", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const aggregate = deriveCountryIdeology(scenario, world, countryId);

    expect(aggregate).toBeDefined();
    expect(
      Object.values(aggregate).reduce(
        (total, state) => total + state.support,
        0,
      ),
    ).toBeGreaterThan(1);
  });

  it("changes only the requested ideology dimension", () => {
    const { world } = createFixtureWorld();
    const region = Object.values(world.regions)[0];

    if (region === undefined) {
      throw new Error("Ideology fixture region is missing.");
    }

    const before = region.ideology[IDEOLOGY_FIXTURE_IDS.republicanism];
    if (before === undefined) {
      throw new Error("Republican ideology state is missing.");
    }

    const result = applyIdeologyAdjustment(
      region,
      createAdjustment(region.id, "radicalism", 0.25),
    );
    const after =
      result.nextRegion.ideology[IDEOLOGY_FIXTURE_IDS.republicanism];

    expect(after).toEqual({
      support: before.support,
      radicalism: before.radicalism + 0.25,
      organization: before.organization,
    });
    expect(result.changed).toBe(true);
  });

  it("clamps bounded adjustments and rejects non-finite deltas", () => {
    const { world } = createFixtureWorld();
    const region = Object.values(world.regions)[0];

    if (region === undefined) {
      throw new Error("Ideology fixture region is missing.");
    }

    const upper = applyIdeologyAdjustment(
      region,
      createAdjustment(region.id, "support", 10),
    );
    const lower = applyIdeologyAdjustment(
      region,
      createAdjustment(region.id, "organization", -10),
    );

    expect(
      upper.nextRegion.ideology[IDEOLOGY_FIXTURE_IDS.republicanism]?.support,
    ).toBe(1);
    expect(
      lower.nextRegion.ideology[IDEOLOGY_FIXTURE_IDS.republicanism]
        ?.organization,
    ).toBe(0);
    expect(() =>
      applyIdeologyAdjustment(
        region,
        createAdjustment(region.id, "support", Number.NaN),
      ),
    ).toThrow("finite");
  });

  it("keeps high-support/low-organization distinct from low-support/high-organization", () => {
    const { world } = createFixtureWorld();
    const [capital, industrial] = Object.values(world.regions);

    if (capital === undefined || industrial === undefined) {
      throw new Error("Ideology fixture regions are incomplete.");
    }

    const capitalState = capital.ideology[IDEOLOGY_FIXTURE_IDS.republicanism];
    const industrialState =
      industrial.ideology[IDEOLOGY_FIXTURE_IDS.republicanism];

    expect(capitalState?.support).toBeGreaterThan(
      industrialState?.support ?? 1,
    );
    expect(capitalState?.organization).toBeLessThan(
      industrialState?.organization ?? 0,
    );
    expect(capitalState?.radicalism).toBeLessThan(
      industrialState?.radicalism ?? 0,
    );
  });

  it("derives population-weighted country ideology from controlled regions", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const aggregate = deriveCountryIdeology(scenario, world, countryId);
    const republicanism = aggregate[IDEOLOGY_FIXTURE_IDS.republicanism];

    expect(republicanism).toEqual({
      support: 0.35,
      radicalism: 0.625,
      organization: 0.7,
    });
  });

  it("uses stable ordering for deterministic aggregates and dominant tendencies", () => {
    const first = createFixtureWorld();
    const second = createFixtureWorld();
    const firstAggregate = deriveCountryIdeology(
      first.scenario,
      first.world,
      first.countryId,
    );
    const secondAggregate = deriveCountryIdeology(
      second.scenario,
      second.world,
      second.countryId,
    );

    expect(firstAggregate).toEqual(secondAggregate);
    expect(deriveDominantTendencies(firstAggregate)).toEqual([
      IDEOLOGY_FIXTURE_IDS.monarchy,
      IDEOLOGY_FIXTURE_IDS.communism,
      IDEOLOGY_FIXTURE_IDS.democracy,
      IDEOLOGY_FIXTURE_IDS.republicanism,
    ]);
  });

  it("excludes uncontrolled and faction-controlled regions from country aggregation", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const regions = Object.values(world.regions);
    const capital = regions[0];
    const industrial = regions[1];

    if (capital === undefined || industrial === undefined) {
      throw new Error("Ideology fixture regions are incomplete.");
    }

    const uncontrolledWorld = withRegionController(
      scenario,
      world,
      industrial.id,
      { kind: "uncontrolled" },
    );
    const factionId = asFactionId("t013.faction");
    const faction: Faction = {
      id: factionId,
      name: "시험 세력",
      countryId,
      interests: [],
      resources: 0,
      organization: 0.5,
      influence: 0.5,
      grievance: 0.5,
      ideologyAffinity: {},
      foreignLinks: {},
      currentStrategy: "wait",
    };
    const factionWorld = withRegionController(
      scenario,
      { ...world, factions: { [factionId]: faction } },
      industrial.id,
      {
        kind: "faction",
        factionId,
      },
    );

    expect(
      deriveCountryIdeology(scenario, uncontrolledWorld, countryId),
    ).toEqual({
      [IDEOLOGY_FIXTURE_IDS.monarchy]:
        capital.ideology[IDEOLOGY_FIXTURE_IDS.monarchy],
      [IDEOLOGY_FIXTURE_IDS.republicanism]:
        capital.ideology[IDEOLOGY_FIXTURE_IDS.republicanism],
      [IDEOLOGY_FIXTURE_IDS.democracy]:
        capital.ideology[IDEOLOGY_FIXTURE_IDS.democracy],
      [IDEOLOGY_FIXTURE_IDS.communism]:
        capital.ideology[IDEOLOGY_FIXTURE_IDS.communism],
    });
    expect(deriveCountryIdeology(scenario, factionWorld, countryId)).toEqual(
      deriveCountryIdeology(scenario, uncontrolledWorld, countryId),
    );
  });

  it("returns no aggregate when the country controls no populated region", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const noControlWorld = Object.values(world.regions).reduce(
      (currentWorld, region) =>
        withRegionController(scenario, currentWorld, region.id, {
          kind: "uncontrolled",
        }),
      world,
    );

    expect(deriveCountryIdeology(scenario, noControlWorld, countryId)).toEqual(
      {},
    );
  });

  it("does not persist a duplicate country ideology aggregate", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const before = JSON.parse(JSON.stringify(world));

    deriveCountryIdeology(scenario, world, countryId);

    expect(world).toEqual(before);
    expect(world).not.toHaveProperty("countryIdeology");
    expect(world.countries[countryId]).not.toHaveProperty("ideology");
  });

  it("produces the same step result for the same state and adjustment list", () => {
    const first = createFixtureWorld();
    const second = createFixtureWorld();
    const regionId = first.scenario.initialRegions[0]?.id;

    if (regionId === undefined) {
      throw new Error("Ideology fixture region is missing.");
    }

    const adjustments = [createAdjustment(regionId, "support", 0.1)];
    expect(runAdjustmentStep(first.world, adjustments)).toEqual(
      runAdjustmentStep(second.world, adjustments),
    );
  });

  it("does not mutate the input WorldState in place", () => {
    const { world, scenario } = createFixtureWorld();
    const before = JSON.parse(JSON.stringify(world));
    const regionId = scenario.initialRegions[0]?.id;

    if (regionId === undefined) {
      throw new Error("Ideology fixture region is missing.");
    }

    const result = runAdjustmentStep(world, [
      createAdjustment(regionId, "support", 0.1),
    ]);

    expect(world).toEqual(before);
    expect(result.nextWorld).not.toBe(world);
    expect(result.nextWorld.regions[regionId]).not.toBe(
      world.regions[regionId],
    );
  });

  it("emits ordered dimension-specific events with valid existing causes", () => {
    const { world, scenario } = createFixtureWorld();
    const regionId = scenario.initialRegions[0]?.id;

    if (regionId === undefined) {
      throw new Error("Ideology fixture region is missing.");
    }

    const result = runAdjustmentStep(world, [
      createAdjustment(regionId, "support", 0.1),
      createAdjustment(regionId, "radicalism", 0.1),
      createAdjustment(regionId, "organization", 0.1),
    ]);
    const ideologyEvents = result.emittedEvents.filter((event) =>
      event.type.startsWith("IDEOLOGY_"),
    );
    const store = result.emittedEvents.reduce(
      (currentStore, event) => appendEvent(currentStore, event),
      createEventStore(),
    );

    expect(ideologyEvents.map((event) => event.type)).toEqual([
      "IDEOLOGY_SUPPORT_CHANGED",
      "IDEOLOGY_RADICALISM_CHANGED",
      "IDEOLOGY_ORGANIZATION_CHANGED",
    ]);
    expect(ideologyEvents.map((event) => event.id)).toEqual([
      "event:1:1:IDEOLOGY_SUPPORT_CHANGED",
      "event:1:2:IDEOLOGY_RADICALISM_CHANGED",
      "event:1:3:IDEOLOGY_ORGANIZATION_CHANGED",
    ]);
    expect(
      ideologyEvents.every(
        (event) => event.causeIds[0] === store.events[0]?.id,
      ),
    ).toBe(true);
    expect(result.emittedEvents.at(-1)?.type).toBe("TICK_ADVANCED");
  });

  it("does not emit an ideology event for a zero-effective adjustment", () => {
    const { world, scenario } = createFixtureWorld();
    const regionId = scenario.initialRegions[0]?.id;

    if (regionId === undefined) {
      throw new Error("Ideology fixture region is missing.");
    }

    const beforeRegion = world.regions[regionId];
    const result = runAdjustmentStep(world, [
      createAdjustment(regionId, "support", 0),
    ]);

    expect(result.emittedEvents.map((event) => event.type)).toEqual([
      "TRADE_DISRUPTED",
      "TICK_ADVANCED",
    ]);
    expect(result.nextWorld.regions[regionId]).toBe(beforeRegion);
  });

  it("rejects a cause ID that is not already emitted", () => {
    const { world, scenario } = createFixtureWorld();
    const regionId = scenario.initialRegions[0]?.id;

    if (regionId === undefined) {
      throw new Error("Ideology fixture region is missing.");
    }

    expect(() =>
      runAdjustmentStep(world, [
        createAdjustment(
          regionId,
          "support",
          0.1,
          asEventId("event:1:99:TRADE_DISRUPTED"),
        ),
      ]),
    ).toThrow("not yet emitted");
  });

  it("does not let policy enactment automatically change ideology", () => {
    const { scenario, world } = createFixtureWorld();
    const beforeIdeology = JSON.parse(JSON.stringify(world.regions));

    const result = runSimulationStep(
      world,
      { actions: [createPolicyAction(0)] },
      { resolveValidatedActions: createPolicyPhaseHook(scenario) },
    );

    expect(result.nextWorld.regions).toEqual(beforeIdeology);
  });

  it("does not execute political hooks or mutate a terminal run", () => {
    const { world, scenario } = createFixtureWorld();
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
    let ideologyHookCalled = false;

    const result = runSimulationStep(
      terminalWorld,
      { actions: [createPolicyAction(0)] },
      {
        resolveValidatedActions: createPolicyPhaseHook(scenario),
        ideologyDiffusion: () => {
          ideologyHookCalled = true;
          throw new Error("Terminal ideology hook must not run.");
        },
      },
    );

    expect(ideologyHookCalled).toBe(false);
    expect(result.nextWorld).toBe(terminalWorld);
    expect(result.emittedEvents).toEqual([]);
  });

  it("exposes susceptibility context without calculating ideology change", () => {
    const { world } = createFixtureWorld();
    const region = Object.values(world.regions)[0];

    if (region === undefined) {
      throw new Error("Ideology fixture region is missing.");
    }

    expect(
      deriveIdeologySusceptibilityInputs(region, {
        pressFreedom: "free",
        laborOrganization: "legal",
      }),
    ).toEqual({
      scarcity: region.scarcity,
      stateControl: region.stateControl,
      urbanization: region.urbanization,
      pressFreedom: "free",
      laborOrganization: "legal",
      factionPresence: false,
    });
  });
});
