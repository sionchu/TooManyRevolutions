import { describe, expect, it } from "vitest";

import { assertWorldStateInvariants } from "../core/invariants";
import { runSimulationStep } from "../core/tick";
import {
  asContactEdgeId,
  asFactionId,
  asIdeologyId,
  asRegionId,
  type ContactEdgeId,
} from "../state/ids";
import {
  assertScenarioContactTopology,
  type ContactChannel,
  type ScenarioDefinition,
} from "../state/scenario";
import {
  CONTACT_FIXTURE_EDGE_IDS,
  CONTACT_FIXTURE_COUNTRY_IDS,
  CONTACT_FIXTURE_REGION_IDS,
  createContactFixtureScenario,
} from "../state/contactFixture";
import type { Faction } from "../state/faction";
import type { TerritorialController } from "../state/region";
import { getLandHexesForRegion } from "../state/territorialTopology";
import { createInitialWorldState, type WorldState } from "../state/world";
import {
  deriveCountryContacts,
  getContactsByChannel,
  getEffectiveContactStrength,
  getIncomingContacts,
  getOutgoingContacts,
} from "./contactGraph";

function createFixtureWorld(): {
  readonly scenario: ReturnType<typeof createContactFixtureScenario>;
  readonly world: WorldState;
} {
  const scenario = createContactFixtureScenario();
  return {
    scenario,
    world: createInitialWorldState(scenario, 19),
  };
}

function withContactEdges(
  scenario: ScenarioDefinition,
  contactEdges: ScenarioDefinition["mapContactTopology"]["contactEdges"],
): ScenarioDefinition {
  return {
    ...scenario,
    mapContactTopology: {
      ...scenario.mapContactTopology,
      contactEdges,
    },
  };
}

function withRuntimeState(
  world: WorldState,
  edgeId: ContactEdgeId,
  state: WorldState["contactEdgeStates"][ContactEdgeId],
): WorldState {
  return {
    ...world,
    contactEdgeStates: {
      ...world.contactEdgeStates,
      [edgeId]: state,
    },
  };
}

function withRegionController(
  scenario: ScenarioDefinition,
  world: WorldState,
  regionId: ReturnType<typeof asRegionId>,
  controller: TerritorialController,
): WorldState {
  const landHexStates = { ...world.landHexStates };
  for (const landHex of getLandHexesForRegion(scenario, regionId)) {
    landHexStates[landHex.id] = { controller: { ...controller } };
  }

  return { ...world, landHexStates };
}

describe("T014 contact graph", () => {
  it("keeps static topology in ScenarioDefinition and only runtime overlays in WorldState", () => {
    const { scenario, world } = createFixtureWorld();

    expect(scenario.mapContactTopology.contactEdges.length).toBeGreaterThan(0);
    expect(world).not.toHaveProperty("mapContactTopology");
    expect(world.contactEdgeStates).toEqual({});
  });

  it("accepts a valid topology and validates every endpoint against a Region", () => {
    const { scenario, world } = createFixtureWorld();
    const regionIds = new Set(
      scenario.initialRegions.map((region) => region.id),
    );

    expect(() => assertScenarioContactTopology(scenario)).not.toThrow();
    expect(() => assertWorldStateInvariants(world)).not.toThrow();
    expect(
      scenario.mapContactTopology.contactEdges.every(
        (edge) =>
          regionIds.has(edge.fromRegionId) && regionIds.has(edge.toRegionId),
      ),
    ).toBe(true);
  });

  it("rejects missing endpoint RegionIds", () => {
    const { scenario } = createFixtureWorld();
    const edge = scenario.mapContactTopology.contactEdges[0];

    if (edge === undefined) {
      throw new Error("Contact fixture edge is missing.");
    }

    const invalidScenario = withContactEdges(scenario, [
      { ...edge, toRegionId: asRegionId("contact.missing-region") },
    ]);

    expect(() => createInitialWorldState(invalidScenario, 19)).toThrow(
      "missing target region",
    );
  });

  it("rejects duplicate edge IDs, invalid channels, and out-of-range strength", () => {
    const { scenario } = createFixtureWorld();
    const edge = scenario.mapContactTopology.contactEdges[0];

    if (edge === undefined) {
      throw new Error("Contact fixture edge is missing.");
    }

    expect(() =>
      createInitialWorldState(withContactEdges(scenario, [edge, edge]), 19),
    ).toThrow("repeats edge");

    expect(() =>
      createInitialWorldState(
        withContactEdges(scenario, [
          { ...edge, channel: "invalid" as ContactChannel },
        ]),
        19,
      ),
    ).toThrow("invalid channel");

    expect(() =>
      createInitialWorldState(
        withContactEdges(scenario, [{ ...edge, baseStrength: 1.01 }]),
        19,
      ),
    ).toThrow("baseStrength");
  });

  it("uses explicit directed edges and represents reverse contact separately", () => {
    const { scenario } = createFixtureWorld();
    const forward = scenario.mapContactTopology.contactEdges.find(
      (edge) => edge.id === CONTACT_FIXTURE_EDGE_IDS.portToMerchantTrade,
    );
    const reverse = scenario.mapContactTopology.contactEdges.find(
      (edge) => edge.id === CONTACT_FIXTURE_EDGE_IDS.merchantToPortInformation,
    );

    expect(forward).toMatchObject({
      fromRegionId: CONTACT_FIXTURE_REGION_IDS.port,
      toRegionId: CONTACT_FIXTURE_REGION_IDS.merchantPort,
    });
    expect(reverse).toMatchObject({
      fromRegionId: CONTACT_FIXTURE_REGION_IDS.merchantPort,
      toRegionId: CONTACT_FIXTURE_REGION_IDS.port,
    });
    expect(forward).not.toHaveProperty("direction");
  });

  it("allows multiple channels on the same ordered pair", () => {
    const { scenario, world } = createFixtureWorld();
    const channels = getOutgoingContacts(
      scenario,
      world,
      CONTACT_FIXTURE_REGION_IDS.port,
    )
      .filter(
        (edge) => edge.toRegionId === CONTACT_FIXTURE_REGION_IDS.merchantPort,
      )
      .map((edge) => edge.channel);

    expect(channels).toEqual(["migration", "trade"]);
  });

  it("keeps base contact strength in the documented 0–1 range", () => {
    const { scenario, world } = createFixtureWorld();
    const views = getContactsByChannel(scenario, world, "trade");

    expect(views.length).toBeGreaterThan(0);
    expect(
      views.every((edge) => edge.baseStrength >= 0 && edge.baseStrength <= 1),
    ).toBe(true);
    expect(
      views.every(
        (edge) => edge.effectiveStrength >= 0 && edge.effectiveStrength <= 1,
      ),
    ).toBe(true);
  });

  it("returns zero effective strength for a disabled runtime edge", () => {
    const { scenario, world } = createFixtureWorld();
    const edgeId = CONTACT_FIXTURE_EDGE_IDS.portToMerchantTrade;
    const disabledWorld = withRuntimeState(world, edgeId, {
      enabled: false,
      multiplier: 1,
      blockedReason: "tradeSuspension",
    });

    expect(getEffectiveContactStrength(scenario, disabledWorld, edgeId)).toBe(
      0,
    );
    expect(
      getOutgoingContacts(
        scenario,
        disabledWorld,
        CONTACT_FIXTURE_REGION_IDS.port,
      ).find((edge) => edge.id === edgeId)?.effectiveStrength,
    ).toBe(0);
  });

  it("applies runtime multipliers deterministically and clamps effective strength", () => {
    const { scenario, world } = createFixtureWorld();
    const edgeId = CONTACT_FIXTURE_EDGE_IDS.portToMerchantTrade;
    const halfStrengthWorld = withRuntimeState(world, edgeId, {
      enabled: true,
      multiplier: 0.5,
    });
    const amplifiedWorld = withRuntimeState(world, edgeId, {
      enabled: true,
      multiplier: 2,
    });

    expect(getEffectiveContactStrength(scenario, world, edgeId)).toBe(0.8);
    expect(
      getEffectiveContactStrength(scenario, halfStrengthWorld, edgeId),
    ).toBe(0.4);
    expect(
      getEffectiveContactStrength(scenario, halfStrengthWorld, edgeId),
    ).toBe(0.4);
    expect(getEffectiveContactStrength(scenario, amplifiedWorld, edgeId)).toBe(
      1,
    );
  });

  it("returns outgoing, incoming, and channel queries in stable edge-ID order", () => {
    const { scenario, world } = createFixtureWorld();
    const outgoing = getOutgoingContacts(
      scenario,
      world,
      CONTACT_FIXTURE_REGION_IDS.port,
    );
    const incoming = getIncomingContacts(
      scenario,
      world,
      CONTACT_FIXTURE_REGION_IDS.port,
    );
    const trade = getContactsByChannel(scenario, world, "trade");

    expect(outgoing.map((edge) => edge.id)).toEqual(
      [...outgoing.map((edge) => edge.id)].sort(),
    );
    expect(incoming.map((edge) => edge.id)).toEqual(
      [...incoming.map((edge) => edge.id)].sort(),
    );
    expect(trade.map((edge) => edge.id)).toEqual(
      [...trade.map((edge) => edge.id)].sort(),
    );
  });

  it("derives foreign country contacts from fully controlled Region projections", () => {
    const { scenario, world } = createFixtureWorld();
    const contacts = deriveCountryContacts(scenario, world);
    const merchantTrade = contacts.find(
      (contact) =>
        contact.edgeId === CONTACT_FIXTURE_EDGE_IDS.portToMerchantTrade,
    );

    expect(merchantTrade).toMatchObject({
      fromCountryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
      toCountryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
      fromRegionId: CONTACT_FIXTURE_REGION_IDS.port,
      toRegionId: CONTACT_FIXTURE_REGION_IDS.merchantPort,
      channel: "trade",
      effectiveStrength: 0.8,
    });
    expect(
      contacts.every(
        (contact) => contact.fromCountryId !== contact.toCountryId,
      ),
    ).toBe(true);
  });

  it("changes derived country contacts when control changes without changing topology", () => {
    const { scenario, world } = createFixtureWorld();
    const topologyBefore = JSON.parse(
      JSON.stringify(scenario.mapContactTopology),
    );
    const beforeIds = deriveCountryContacts(scenario, world).map(
      (contact) => contact.edgeId,
    );
    const occupiedWorld = withRegionController(
      scenario,
      world,
      CONTACT_FIXTURE_REGION_IDS.port,
      {
        kind: "country",
        countryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
      },
    );
    const afterIds = deriveCountryContacts(scenario, occupiedWorld).map(
      (contact) => contact.edgeId,
    );

    expect(scenario.mapContactTopology).toEqual(topologyBefore);
    expect(beforeIds).toContain(CONTACT_FIXTURE_EDGE_IDS.portToMerchantTrade);
    expect(afterIds).not.toContain(
      CONTACT_FIXTURE_EDGE_IDS.portToMerchantTrade,
    );
    expect(afterIds).toContain(CONTACT_FIXTURE_EDGE_IDS.portToCapital);
  });

  it("excludes uncontrolled and faction-controlled endpoints from country projection", () => {
    const { scenario, world } = createFixtureWorld();
    const port = world.regions[CONTACT_FIXTURE_REGION_IDS.port];

    if (port === undefined) {
      throw new Error("Contact fixture port is missing.");
    }

    const uncontrolledWorld = withRegionController(scenario, world, port.id, {
      kind: "uncontrolled",
    });
    const factionId = asFactionId("contact.test-faction");
    const faction: Faction = {
      id: factionId,
      name: "연락망 시험 세력",
      countryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
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
      port.id,
      { kind: "faction", factionId },
    );

    expect(
      deriveCountryContacts(scenario, uncontrolledWorld).some(
        (contact) =>
          contact.fromRegionId === port.id || contact.toRegionId === port.id,
      ),
    ).toBe(false);
    expect(
      deriveCountryContacts(scenario, factionWorld).some(
        (contact) =>
          contact.fromRegionId === port.id || contact.toRegionId === port.id,
      ),
    ).toBe(false);
    expect(
      getOutgoingContacts(scenario, uncontrolledWorld, port.id).length,
    ).toBeGreaterThan(0);
  });

  it("rejects runtime state for an edge outside the static topology", () => {
    const { scenario, world } = createFixtureWorld();
    const invalidWorld = withRuntimeState(
      world,
      asContactEdgeId("contact.unknown-edge"),
      { enabled: true, multiplier: 1 },
    );

    expect(() => getContactsByChannel(scenario, invalidWorld, "trade")).toThrow(
      "unknown edge",
    );
  });

  it("does not mutate ScenarioDefinition or WorldState during queries", () => {
    const { scenario, world } = createFixtureWorld();
    const scenarioBefore = JSON.parse(JSON.stringify(scenario));
    const worldBefore = JSON.parse(JSON.stringify(world));

    getOutgoingContacts(scenario, world, CONTACT_FIXTURE_REGION_IDS.port);
    getIncomingContacts(scenario, world, CONTACT_FIXTURE_REGION_IDS.port);
    getContactsByChannel(scenario, world, "information");
    deriveCountryContacts(scenario, world);

    expect(scenario).toEqual(scenarioBefore);
    expect(world).toEqual(worldBefore);
  });

  it("does not change ideology state while exposing a later diffusion path", () => {
    const { scenario, world } = createFixtureWorld();
    const port = world.regions[CONTACT_FIXTURE_REGION_IDS.port];
    const republicanism = asIdeologyId("fixture.republicanism");

    if (port === undefined) {
      throw new Error("Contact fixture port is missing.");
    }

    const worldWithIdeology: WorldState = {
      ...world,
      regions: {
        ...world.regions,
        [port.id]: {
          ...port,
          ideology: {
            [republicanism]: {
              support: 0.42,
              radicalism: 0.2,
              organization: 0.1,
            },
          },
        },
      },
    };
    const beforeSupport =
      worldWithIdeology.regions[port.id]?.ideology[republicanism]?.support;

    const path = getOutgoingContacts(
      scenario,
      worldWithIdeology,
      CONTACT_FIXTURE_REGION_IDS.port,
    ).find(
      (edge) =>
        edge.toRegionId === CONTACT_FIXTURE_REGION_IDS.merchantPort &&
        edge.channel === "trade",
    );

    expect(path).toMatchObject({
      fromRegionId: CONTACT_FIXTURE_REGION_IDS.port,
      toRegionId: CONTACT_FIXTURE_REGION_IDS.merchantPort,
      channel: "trade",
    });
    expect(
      worldWithIdeology.regions[port.id]?.ideology[republicanism]?.support,
    ).toBe(beforeSupport);
  });

  it("returns the same result for the same graph and runtime state", () => {
    const { scenario, world } = createFixtureWorld();
    const runtimeWorld = withRuntimeState(
      world,
      CONTACT_FIXTURE_EDGE_IDS.portToMerchantTrade,
      { enabled: true, multiplier: 0.75 },
    );

    expect(
      getOutgoingContacts(
        scenario,
        runtimeWorld,
        CONTACT_FIXTURE_REGION_IDS.port,
      ),
    ).toEqual(
      getOutgoingContacts(
        scenario,
        runtimeWorld,
        CONTACT_FIXTURE_REGION_IDS.port,
      ),
    );
    expect(deriveCountryContacts(scenario, runtimeWorld)).toEqual(
      deriveCountryContacts(scenario, runtimeWorld),
    );
  });

  it("does not emit contact gameplay events or ideology changes during T014", () => {
    const { world } = createFixtureWorld();
    const before = JSON.parse(JSON.stringify(world));
    const result = runSimulationStep(world, { actions: [] });

    expect(result.emittedEvents.map((event) => event.type)).toEqual([
      "TICK_ADVANCED",
    ]);
    expect(
      result.emittedEvents.some((event) => event.type.startsWith("CONTACT_")),
    ).toBe(false);
    expect(world).toEqual(before);
    expect(result.nextWorld.regions).toEqual(world.regions);
  });
});
