import { describe, expect, it } from "vitest";

import type { JsonValue } from "../core/serialization";
import { appendEvent, createEventStore } from "../events/eventStore";
import type { SimulationStepResult } from "../core/step";
import { runSimulationStep } from "../core/tick";
import {
  asFactionId,
  asScenarioId,
  type ContactEdgeId,
  type IdeologyId,
  type RegionId,
} from "../state/ids";
import {
  CONTACT_FIXTURE_COUNTRY_IDS,
  CONTACT_FIXTURE_EDGE_IDS,
  CONTACT_FIXTURE_REGION_IDS,
} from "../state/contactFixture";
import { IDEOLOGY_FIXTURE_IDS } from "../state/ideologyFixture";
import { createIdeologyDiffusionFixtureScenario } from "../state/ideologyDiffusionFixture";
import { deriveCountryIdeology } from "../state/ideology";
import type { Faction } from "../state/faction";
import type { TerritorialController } from "../state/region";
import type { ScenarioDefinition } from "../state/scenario";
import { getLandHexesForRegion } from "../state/territorialTopology";
import { createInitialWorldState, type WorldState } from "../state/world";
import {
  createIdeologyDiffusionPhaseHook,
  DEFAULT_IDEOLOGY_DIFFUSION_CHANNEL_WEIGHTS,
  type IdeologyDiffusionConfig,
} from "./ideologyDiffusion";

const REPUBLICANISM = IDEOLOGY_FIXTURE_IDS.republicanism;
const PLAYER_PORT = CONTACT_FIXTURE_REGION_IDS.port;
const PLAYER_CAPITAL = CONTACT_FIXTURE_REGION_IDS.capital;
const MERCHANT_PORT = CONTACT_FIXTURE_REGION_IDS.merchantPort;
const MINE = CONTACT_FIXTURE_REGION_IDS.mine;

function createScenarioWithEdges(
  name: string,
  edgeIds: readonly ContactEdgeId[],
): ScenarioDefinition {
  const baseScenario = createIdeologyDiffusionFixtureScenario();
  const selected = new Set(edgeIds);

  return {
    ...baseScenario,
    id: asScenarioId(`ideology-diffusion-test-${name}`),
    mapContactTopology: {
      ...baseScenario.mapContactTopology,
      contactEdges: baseScenario.mapContactTopology.contactEdges.filter(
        (edge) => selected.has(edge.id),
      ),
    },
  };
}

function createWorldForScenario(scenario: ScenarioDefinition): WorldState {
  return createInitialWorldState(scenario, 20260821);
}

function runDiffusion(
  scenario: ScenarioDefinition,
  world: WorldState = createWorldForScenario(scenario),
  config: IdeologyDiffusionConfig = {},
): SimulationStepResult {
  return runSimulationStep(
    world,
    { actions: [] },
    {
      ideologyDiffusion: createIdeologyDiffusionPhaseHook(scenario, {
        cadence: "daily",
        ...config,
      }),
    },
    scenario,
  );
}

function withRegionController(
  scenario: ScenarioDefinition,
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

function support(
  world: WorldState,
  regionId: RegionId,
  ideologyId: IdeologyId = REPUBLICANISM,
): number {
  const state = world.regions[regionId]?.ideology[ideologyId];
  if (state === undefined) {
    throw new Error(`Missing ideology state ${ideologyId} in ${regionId}.`);
  }

  return state.support;
}

function ideologyEvents(result: SimulationStepResult) {
  return result.emittedEvents.filter(
    (event) =>
      event.type === "IDEOLOGY_DIFFUSED" ||
      event.type === "IDEOLOGY_SUPPORT_CHANGED",
  );
}

function supportEventFor(
  result: SimulationStepResult,
  regionId: RegionId,
): NonNullable<SimulationStepResult["emittedEvents"][number] | undefined> {
  const event = result.emittedEvents.find(
    (candidate) =>
      candidate.type === "IDEOLOGY_SUPPORT_CHANGED" &&
      candidate.targetId === regionId &&
      candidate.actorId === REPUBLICANISM,
  );

  if (event === undefined) {
    throw new Error(`No support event for ${regionId}.`);
  }

  return event;
}

function payloadObject(event: SimulationStepResult["emittedEvents"][number]) {
  if (
    typeof event.payload !== "object" ||
    event.payload === null ||
    Array.isArray(event.payload)
  ) {
    throw new Error(`Event ${event.id} does not have an object payload.`);
  }

  return event.payload as Readonly<Record<string, JsonValue>>;
}

function setRegionIdeologyState(
  world: WorldState,
  regionId: RegionId,
  ideologyId: IdeologyId,
  patch: Partial<WorldState["regions"][RegionId]["ideology"][IdeologyId]>,
): WorldState {
  const region = world.regions[regionId];
  if (region === undefined) {
    throw new Error(`Missing region ${regionId}.`);
  }

  const ideologyState = region.ideology[ideologyId];
  if (ideologyState === undefined) {
    throw new Error(`Missing ideology state ${ideologyId}.`);
  }

  return {
    ...world,
    regions: {
      ...world.regions,
      [regionId]: {
        ...region,
        ideology: {
          ...region.ideology,
          [ideologyId]: { ...ideologyState, ...patch },
        },
      },
    },
  };
}

function withContactRuntimeStates(
  world: WorldState,
  states: Readonly<
    Record<ContactEdgeId, { enabled: boolean; multiplier: number }>
  >,
): WorldState {
  return {
    ...world,
    contactEdgeStates: states,
  };
}

const MERCHANT_TO_PORT_EDGES = [
  CONTACT_FIXTURE_EDGE_IDS.merchantToPortInformation,
  CONTACT_FIXTURE_EDGE_IDS.merchantToPortTrade,
] as const;

const CHAIN_EDGES = [
  ...MERCHANT_TO_PORT_EDGES,
  CONTACT_FIXTURE_EDGE_IDS.portToCapital,
] as const;

describe("T015 deterministic ideology diffusion", () => {
  it("diffuses support along a directed region edge", () => {
    const scenario = createScenarioWithEdges("directed", [
      CONTACT_FIXTURE_EDGE_IDS.merchantToPortInformation,
    ]);
    const world = createWorldForScenario(scenario);

    const result = runDiffusion(scenario, world);

    expect(support(result.nextWorld, PLAYER_PORT)).toBeGreaterThan(
      support(world, PLAYER_PORT),
    );
    expect(support(result.nextWorld, MERCHANT_PORT)).toBe(
      support(world, MERCHANT_PORT),
    );
  });

  it("produces zero diffusion when source and destination support are equal", () => {
    const scenario = createScenarioWithEdges("equal-gradient", [
      CONTACT_FIXTURE_EDGE_IDS.merchantToPortInformation,
    ]);
    const world = setRegionIdeologyState(
      createWorldForScenario(scenario),
      PLAYER_PORT,
      REPUBLICANISM,
      { support: 0.9 },
    );

    const result = runDiffusion(scenario, world);

    expect(support(result.nextWorld, PLAYER_PORT)).toBe(0.9);
    expect(ideologyEvents(result)).toEqual([]);
  });

  it("does not diffuse positively when the destination is above the source", () => {
    const scenario = createScenarioWithEdges("destination-above-source", [
      CONTACT_FIXTURE_EDGE_IDS.merchantToPortInformation,
    ]);
    const world = setRegionIdeologyState(
      setRegionIdeologyState(
        createWorldForScenario(scenario),
        MERCHANT_PORT,
        REPUBLICANISM,
        { support: 0.2 },
      ),
      PLAYER_PORT,
      REPUBLICANISM,
      { support: 0.5 },
    );

    const result = runDiffusion(scenario, world);

    expect(support(result.nextWorld, PLAYER_PORT)).toBe(0.5);
    expect(ideologyEvents(result)).toEqual([]);
  });

  it("keeps a lower source from mechanically saturating a connected destination", () => {
    const scenario = createScenarioWithEdges("long-run-gradient", [
      CONTACT_FIXTURE_EDGE_IDS.merchantToPortInformation,
    ]);
    let world = setRegionIdeologyState(
      createWorldForScenario(scenario),
      MERCHANT_PORT,
      REPUBLICANISM,
      { support: 0.6 },
    );
    const initialPortSupport = support(world, PLAYER_PORT);

    for (let day = 0; day < 240; day += 1) {
      world = runDiffusion(scenario, world).nextWorld;
    }

    expect(support(world, PLAYER_PORT)).toBeGreaterThan(initialPortSupport);
    expect(support(world, PLAYER_PORT)).toBeLessThan(0.9);
  });

  it("diffuses through an internal same-country Region edge", () => {
    const scenario = createScenarioWithEdges("internal", [
      CONTACT_FIXTURE_EDGE_IDS.capitalToPort,
    ]);
    const world = setRegionIdeologyState(
      createWorldForScenario(scenario),
      PLAYER_CAPITAL,
      REPUBLICANISM,
      { support: 0.9 },
    );

    const result = runDiffusion(scenario, world);

    expect(support(result.nextWorld, PLAYER_PORT)).toBeGreaterThan(
      support(world, PLAYER_PORT),
    );
  });

  it("does not diffuse when no contact edge exists", () => {
    const scenario = createScenarioWithEdges("no-edge", []);
    const world = createWorldForScenario(scenario);

    const result = runDiffusion(scenario, world);

    expect(result.nextWorld.regions).toEqual(world.regions);
    expect(ideologyEvents(result)).toEqual([]);
  });

  it("does not diffuse through a disabled edge", () => {
    const edgeId = CONTACT_FIXTURE_EDGE_IDS.merchantToPortInformation;
    const scenario = createScenarioWithEdges("disabled", [edgeId]);
    const world = withContactRuntimeStates(createWorldForScenario(scenario), {
      [edgeId]: { enabled: false, multiplier: 1 },
    });

    const result = runDiffusion(scenario, world);

    expect(result.nextWorld.regions).toEqual(world.regions);
    expect(ideologyEvents(result)).toEqual([]);
  });

  it("produces a larger change from a stronger effective contact", () => {
    const edgeId = CONTACT_FIXTURE_EDGE_IDS.merchantToPortInformation;
    const scenario = createScenarioWithEdges("strength", [edgeId]);
    const lowWorld = withContactRuntimeStates(
      createWorldForScenario(scenario),
      {
        [edgeId]: { enabled: true, multiplier: 0.5 },
      },
    );
    const highWorld = withContactRuntimeStates(
      createWorldForScenario(scenario),
      {
        [edgeId]: { enabled: true, multiplier: 1 },
      },
    );

    const lowResult = runDiffusion(scenario, lowWorld);
    const highResult = runDiffusion(scenario, highWorld);

    expect(support(highResult.nextWorld, PLAYER_PORT)).toBeGreaterThan(
      support(lowResult.nextWorld, PLAYER_PORT),
    );
  });

  it("honors a directed reverse edge without inferring its opposite", () => {
    const scenario = createScenarioWithEdges("no-reverse", [
      CONTACT_FIXTURE_EDGE_IDS.portToMerchantMigration,
      CONTACT_FIXTURE_EDGE_IDS.portToMerchantTrade,
    ]);
    const world = setRegionIdeologyState(
      setRegionIdeologyState(
        createWorldForScenario(scenario),
        MERCHANT_PORT,
        REPUBLICANISM,
        { support: 0.01 },
      ),
      PLAYER_PORT,
      REPUBLICANISM,
      { support: 0.9 },
    );

    const result = runDiffusion(scenario, world);

    expect(support(result.nextWorld, MERCHANT_PORT)).toBeGreaterThan(
      support(world, MERCHANT_PORT),
    );
    expect(support(result.nextWorld, PLAYER_PORT)).toBe(
      support(world, PLAYER_PORT),
    );
  });

  it("aggregates multiple incoming edge contributions deterministically", () => {
    const scenario = createScenarioWithEdges(
      "aggregate",
      MERCHANT_TO_PORT_EDGES,
    );
    const result = runDiffusion(scenario);
    const event = supportEventFor(result, PLAYER_PORT);
    const payload = payloadObject(event);

    expect(payload.sourceContributions).toHaveLength(2);
    expect(payload.previousSupport).toBe(0.05);
    expect(payload.nextSupport).toBeGreaterThan(0.05);
  });

  it("is invariant to static contact-edge iteration order", () => {
    const firstScenario = createScenarioWithEdges("order-first", CHAIN_EDGES);
    const secondScenario: ScenarioDefinition = {
      ...firstScenario,
      mapContactTopology: {
        ...firstScenario.mapContactTopology,
        contactEdges: [
          ...firstScenario.mapContactTopology.contactEdges,
        ].reverse(),
      },
    };

    const first = runDiffusion(firstScenario);
    const second = runDiffusion(secondScenario);

    expect(second).toEqual(first);
  });

  it("returns the same result for the same state and inputs", () => {
    const scenario = createScenarioWithEdges("repeat", CHAIN_EDGES);
    const world = createWorldForScenario(scenario);

    expect(runDiffusion(scenario, world)).toEqual(
      runDiffusion(scenario, world),
    );
  });

  it("uses the start-of-phase source snapshot, preventing same-tick cascades", () => {
    const scenario = createScenarioWithEdges("snapshot", CHAIN_EDGES);
    const result = runDiffusion(scenario);
    const capitalEvent = result.emittedEvents.find(
      (event) =>
        event.type === "IDEOLOGY_DIFFUSED" &&
        event.targetId === PLAYER_CAPITAL &&
        event.actorId === REPUBLICANISM,
    );

    expect(capitalEvent).toBeDefined();
    expect(
      payloadObject(capitalEvent as NonNullable<typeof capitalEvent>),
    ).toMatchObject({
      sourceRegionId: PLAYER_PORT,
      sourceSupport: 0.05,
    });
  });

  it("allows the intermediate region to affect the next day", () => {
    const scenario = createScenarioWithEdges("next-day", CHAIN_EDGES);
    const initial = createWorldForScenario(scenario);
    const first = runDiffusion(scenario, initial);
    const second = runDiffusion(scenario, first.nextWorld);

    expect(support(first.nextWorld, PLAYER_PORT)).toBeGreaterThan(
      support(initial, PLAYER_PORT),
    );
    expect(support(second.nextWorld, PLAYER_CAPITAL)).toBeGreaterThan(
      support(first.nextWorld, PLAYER_CAPITAL),
    );
  });

  it("keeps the unconnected mine unchanged across the multi-day route", () => {
    const scenario = createScenarioWithEdges("multi-day-route", CHAIN_EDGES);
    const initial = createWorldForScenario(scenario);
    const first = runDiffusion(scenario, initial);
    const second = runDiffusion(scenario, first.nextWorld);

    expect(support(first.nextWorld, PLAYER_PORT)).toBeGreaterThan(
      support(initial, PLAYER_PORT),
    );
    expect(support(second.nextWorld, PLAYER_CAPITAL)).toBeGreaterThan(
      support(first.nextWorld, PLAYER_CAPITAL),
    );
    expect(support(second.nextWorld, MINE)).toBe(support(initial, MINE));
  });

  it("keeps support bounded at one", () => {
    const edgeId = CONTACT_FIXTURE_EDGE_IDS.merchantToPortInformation;
    const scenario = createScenarioWithEdges("bounded", [edgeId]);
    const world = setRegionIdeologyState(
      createWorldForScenario(scenario),
      PLAYER_PORT,
      REPUBLICANISM,
      { support: 0.999 },
    );
    const result = runDiffusion(scenario, world, {
      diffusionRate: 1,
      channelWeights: { information: 10 },
    });

    expect(support(result.nextWorld, PLAYER_PORT)).toBeLessThanOrEqual(1);
  });

  it("does not normalize or subtract other ideology support", () => {
    const scenario = createScenarioWithEdges(
      "nonexclusive",
      MERCHANT_TO_PORT_EDGES,
    );
    const world = setRegionIdeologyState(
      createWorldForScenario(scenario),
      PLAYER_PORT,
      IDEOLOGY_FIXTURE_IDS.monarchy,
      { support: 0.4 },
    );

    const result = runDiffusion(scenario, world);

    expect(
      support(result.nextWorld, PLAYER_PORT, IDEOLOGY_FIXTURE_IDS.monarchy),
    ).toBe(0.4);
    expect(support(result.nextWorld, PLAYER_PORT)).toBeGreaterThan(0.05);
  });

  it("leaves radicalism unchanged", () => {
    const scenario = createScenarioWithEdges("radicalism", [
      CONTACT_FIXTURE_EDGE_IDS.merchantToPortInformation,
    ]);
    const world = createWorldForScenario(scenario);
    const before =
      world.regions[PLAYER_PORT]?.ideology[REPUBLICANISM]?.radicalism;
    const result = runDiffusion(scenario, world);

    expect(
      result.nextWorld.regions[PLAYER_PORT]?.ideology[REPUBLICANISM]
        ?.radicalism,
    ).toBe(before);
  });

  it("leaves organization unchanged", () => {
    const scenario = createScenarioWithEdges("organization", [
      CONTACT_FIXTURE_EDGE_IDS.merchantToPortInformation,
    ]);
    const world = createWorldForScenario(scenario);
    const before =
      world.regions[PLAYER_PORT]?.ideology[REPUBLICANISM]?.organization;
    const result = runDiffusion(scenario, world);

    expect(
      result.nextWorld.regions[PLAYER_PORT]?.ideology[REPUBLICANISM]
        ?.organization,
    ).toBe(before);
  });

  it("derives country aggregates from changed controlled regions only", () => {
    const scenario = createScenarioWithEdges("aggregate-country", CHAIN_EDGES);
    const world = createWorldForScenario(scenario);
    const beforePlayer = deriveCountryIdeology(
      scenario,
      world,
      Object.values(world.countries).find(
        (country) => country.name === "플레이어 국가",
      )!.id,
    );
    const beforeMerchant = deriveCountryIdeology(
      scenario,
      world,
      Object.values(world.countries).find(
        (country) => country.name === "상인공화국",
      )!.id,
    );
    const result = runDiffusion(scenario, world);
    const playerId = Object.values(world.countries).find(
      (country) => country.name === "플레이어 국가",
    )!.id;
    const merchantId = Object.values(world.countries).find(
      (country) => country.name === "상인공화국",
    )!.id;
    const afterPlayer = deriveCountryIdeology(
      scenario,
      result.nextWorld,
      playerId,
    );
    const afterMerchant = deriveCountryIdeology(
      scenario,
      result.nextWorld,
      merchantId,
    );

    expect(afterPlayer[REPUBLICANISM]?.support).toBeGreaterThan(
      beforePlayer[REPUBLICANISM]?.support ?? 0,
    );
    expect(afterMerchant).toEqual(beforeMerchant);
  });

  it("changes country aggregates when controllers change without changing topology", () => {
    const scenario = createScenarioWithEdges("controller", CHAIN_EDGES);
    const world = createWorldForScenario(scenario);
    const playerId = Object.values(world.countries).find(
      (country) => country.name === "플레이어 국가",
    )!.id;
    const before = deriveCountryIdeology(scenario, world, playerId);
    const changedControllerWorld = withRegionController(
      scenario,
      world,
      PLAYER_PORT,
      {
        kind: "country",
        countryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
      },
    );

    expect(changedControllerWorld.landHexStates).not.toEqual(
      world.landHexStates,
    );
    expect(changedControllerWorld.run.scenarioId).toBe(world.run.scenarioId);
    expect(changedControllerWorld.regions[PLAYER_PORT]?.id).toBe(PLAYER_PORT);
    expect(
      deriveCountryIdeology(scenario, changedControllerWorld, playerId)[
        REPUBLICANISM
      ]?.support,
    ).not.toBe(before[REPUBLICANISM]?.support);
    expect(changedControllerWorld.regions).toHaveProperty(PLAYER_PORT);
    expect(scenario.mapContactTopology.contactEdges).toEqual(
      createIdeologyDiffusionFixtureScenario().mapContactTopology.contactEdges.filter(
        (edge) => CHAIN_EDGES.includes(edge.id as (typeof CHAIN_EDGES)[number]),
      ),
    );
  });

  it("diffuses through uncontrolled and faction-controlled regions without country projection", () => {
    const edgeId = CONTACT_FIXTURE_EDGE_IDS.merchantToPortInformation;
    const scenario = createScenarioWithEdges("controllers", [edgeId]);
    const factionId = asFactionId("ideology-diffusion-test-faction");
    const faction: Faction = {
      id: factionId,
      name: "항구 평의회",
      countryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
      interests: [],
      resources: 0,
      organization: 0.5,
      influence: 0.5,
      grievance: 0.5,
      ideologyAffinity: { [REPUBLICANISM]: 0.5 },
      foreignLinks: {},
      currentStrategy: "wait",
    };
    const baseWorld = createWorldForScenario(scenario);
    const world = withRegionController(
      scenario,
      withRegionController(
        scenario,
        { ...baseWorld, factions: { [factionId]: faction } },
        MERCHANT_PORT,
        {
          kind: "uncontrolled",
        },
      ),
      PLAYER_PORT,
      { kind: "faction", factionId },
    );

    const result = runDiffusion(scenario, world);

    expect(support(result.nextWorld, PLAYER_PORT)).toBeGreaterThan(
      support(world, PLAYER_PORT),
    );
  });

  it("does not mutate the input WorldState", () => {
    const scenario = createScenarioWithEdges("immutable", CHAIN_EDGES);
    const world = createWorldForScenario(scenario);
    const before = JSON.parse(JSON.stringify(world));

    runDiffusion(scenario, world);

    expect(world).toEqual(before);
  });

  it("does not emit ideology events for a zero delta", () => {
    const scenario = createScenarioWithEdges("zero", [
      CONTACT_FIXTURE_EDGE_IDS.merchantToPortInformation,
    ]);
    const result = runDiffusion(scenario, undefined, { diffusionRate: 0 });

    expect(ideologyEvents(result)).toEqual([]);
    expect(result.emittedEvents.map((event) => event.type)).toEqual([
      "TICK_ADVANCED",
    ]);
  });

  it("emits deterministic IDs and ordering for diffusion events", () => {
    const scenario = createScenarioWithEdges("events", CHAIN_EDGES);
    const result = runDiffusion(scenario);
    const eventSequences = result.emittedEvents.map((event) => event.sequence);
    const eventIds = result.emittedEvents.map((event) => event.id);

    expect(eventSequences).toEqual(
      [...eventSequences].sort((first, second) => first - second),
    );
    expect(eventIds).toEqual(
      result.emittedEvents.map(
        (event) => `event:${event.tick}:${event.sequence}:${event.type}`,
      ),
    );
    expect(result.emittedEvents.at(-1)?.type).toBe("TICK_ADVANCED");
  });

  it("keeps every event cause reference valid in append order", () => {
    const scenario = createScenarioWithEdges("causes", CHAIN_EDGES);
    const result = runDiffusion(scenario);

    expect(() =>
      result.emittedEvents.reduce(
        (store, event) => appendEvent(store, event),
        createEventStore(),
      ),
    ).not.toThrow();

    const supportEvents = result.emittedEvents.filter(
      (event) => event.type === "IDEOLOGY_SUPPORT_CHANGED",
    );
    for (const event of supportEvents) {
      expect(event.causeIds.length).toBeGreaterThan(0);
      expect(
        event.causeIds.every((causeId) =>
          result.emittedEvents.some((candidate) => candidate.id === causeId),
        ),
      ).toBe(true);
    }
  });

  it("keeps cross-tick diffusion causes within the current event buffer", () => {
    const scenario = createScenarioWithEdges("cross-tick-causes", CHAIN_EDGES);
    const first = runDiffusion(scenario);
    const second = runDiffusion(scenario, first.nextWorld);
    const firstStore = first.emittedEvents.reduce(
      (store, event) => appendEvent(store, event),
      createEventStore(),
    );
    const combinedStore = second.emittedEvents.reduce(
      (store, event) => appendEvent(store, event),
      firstStore,
    );
    const secondCapitalSupportEvent = second.emittedEvents.find(
      (event) =>
        event.type === "IDEOLOGY_SUPPORT_CHANGED" &&
        event.targetId === PLAYER_CAPITAL,
    );

    expect(secondCapitalSupportEvent).toBeDefined();
    expect(
      secondCapitalSupportEvent!.causeIds.every((causeId) =>
        second.emittedEvents.some((event) => event.id === causeId),
      ),
    ).toBe(true);
    expect(combinedStore.events.length).toBe(
      first.emittedEvents.length + second.emittedEvents.length,
    );
  });

  it("uses explicit channel weights from one central configuration", () => {
    const edgeId = CONTACT_FIXTURE_EDGE_IDS.merchantToPortInformation;
    const scenario = createScenarioWithEdges("weights", [edgeId]);
    const world = createWorldForScenario(scenario);
    const baseline = runDiffusion(scenario, world);
    const weighted = runDiffusion(scenario, world, {
      channelWeights: { information: 0.5 },
    });

    expect(DEFAULT_IDEOLOGY_DIFFUSION_CHANNEL_WEIGHTS.information).toBe(1.2);
    expect(support(weighted.nextWorld, PLAYER_PORT)).toBeLessThan(
      support(baseline.nextWorld, PLAYER_PORT),
    );
  });

  it("does not use a global source-country aggregate as the diffusion signal", () => {
    const scenario = createScenarioWithEdges("regional-source", [
      CONTACT_FIXTURE_EDGE_IDS.merchantToPortInformation,
    ]);
    const world = createWorldForScenario(scenario);
    const merchantId = Object.values(world.countries).find(
      (country) => country.name === "상인공화국",
    )!.id;
    const changedWorld = setRegionIdeologyState(
      world,
      MERCHANT_PORT,
      REPUBLICANISM,
      { support: 0.2 },
    );
    const result = runDiffusion(scenario, changedWorld);
    const sourceEvent = result.emittedEvents.find(
      (event) => event.type === "IDEOLOGY_DIFFUSED",
    );

    expect(sourceEvent).toBeDefined();
    expect(
      payloadObject(sourceEvent as NonNullable<typeof sourceEvent>),
    ).toMatchObject({
      sourceRegionId: MERCHANT_PORT,
      sourceSupport: 0.2,
    });
    expect(
      deriveCountryIdeology(scenario, changedWorld, merchantId)[REPUBLICANISM]
        ?.support,
    ).toBe(0.2);
  });
});
