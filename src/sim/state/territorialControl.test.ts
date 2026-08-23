import { describe, expect, it } from "vitest";

import { createEventStore, appendEvent } from "../events/eventStore";
import {
  CONTACT_FIXTURE_COUNTRY_IDS,
  CONTACT_FIXTURE_LAND_HEX_IDS,
  CONTACT_FIXTURE_REGION_IDS,
  createContactFixtureScenario,
} from "./contactFixture";
import { asEventId, asFactionId } from "./ids";
import type { TerritorialController } from "./region";
import {
  assertLandHexRuntimeStateInvariants,
  changeLandHexController,
  deriveCountryTerritorialProjection,
  deriveRegionControlSummary,
  getFullyControlledRegionIds,
  getPartiallyControlledRegionIds,
} from "./territorialControl";
import { getLandHexesForRegion } from "./territorialTopology";
import { createInitialWorldState, type WorldState } from "./world";

function createFixture() {
  const scenario = createContactFixtureScenario();
  return { scenario, world: createInitialWorldState(scenario, 17017) };
}

function withRegionController(
  scenario: ReturnType<typeof createContactFixtureScenario>,
  world: WorldState,
  regionId: (typeof CONTACT_FIXTURE_REGION_IDS)[keyof typeof CONTACT_FIXTURE_REGION_IDS],
  controller: TerritorialController,
): WorldState {
  const landHexStates = { ...world.landHexStates };
  for (const landHex of getLandHexesForRegion(scenario, regionId)) {
    landHexStates[landHex.id] = { controller: { ...controller } };
  }

  return { ...world, landHexStates };
}

describe("T017B LandHex territorial authority", () => {
  it("migrates every initial controller and removes runtime Region.controller", () => {
    const { scenario, world } = createFixture();

    for (const landHex of scenario.mapTerritorialTopology.landHexes) {
      const region = scenario.initialRegions.find(
        (candidate) => candidate.id === landHex.regionId,
      );
      expect(world.landHexStates[landHex.id]?.controller).toEqual(
        region?.initialController,
      );
      expect(world.regions[landHex.regionId]).not.toHaveProperty("controller");
    }

    expect(() =>
      assertLandHexRuntimeStateInvariants(scenario, world),
    ).not.toThrow();
  });

  it("derives full, partial, contested, faction, and uncontrolled summaries", () => {
    const { scenario, world } = createFixture();
    const capital = CONTACT_FIXTURE_REGION_IDS.capital;
    const capitalEast = CONTACT_FIXTURE_LAND_HEX_IDS.capitalEast;

    expect(deriveRegionControlSummary(scenario, world, capital).kind).toBe(
      "fullyControlled",
    );
    expect(
      deriveRegionControlSummary(
        scenario,
        withRegionController(scenario, world, capital, {
          kind: "uncontrolled",
        }),
        capital,
      ).kind,
    ).toBe("uncontrolled");

    const partial = {
      ...world,
      landHexStates: {
        ...world.landHexStates,
        [capitalEast]: { controller: { kind: "uncontrolled" as const } },
      },
    };
    expect(deriveRegionControlSummary(scenario, partial, capital).kind).toBe(
      "partial",
    );

    const contested = {
      ...world,
      landHexStates: {
        ...world.landHexStates,
        [capitalEast]: {
          controller: {
            kind: "country" as const,
            countryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
          },
        },
      },
    };
    expect(deriveRegionControlSummary(scenario, contested, capital).kind).toBe(
      "contested",
    );

    const factionId = asFactionId("t017b.test-faction");
    const factionWorld = withRegionController(
      scenario,
      {
        ...world,
        factions: {
          [factionId]: {
            id: factionId,
            name: "시험 세력",
            countryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
            interests: [],
            resources: 0,
            organization: 0.5,
            influence: 0.5,
            grievance: 0.5,
            ideologyAffinity: {},
            foreignLinks: {},
            currentStrategy: "wait",
          },
        },
      },
      capital,
      { kind: "faction", factionId },
    );
    expect(
      deriveRegionControlSummary(scenario, factionWorld, capital).factionIds,
    ).toEqual([factionId]);
  });

  it("derives country LandHex/Region projections without a stored country list", () => {
    const { scenario, world } = createFixture();
    const projection = deriveCountryTerritorialProjection(
      scenario,
      world,
      CONTACT_FIXTURE_COUNTRY_IDS.player,
    );

    expect(projection.controlledLandHexIds).toHaveLength(6);
    expect(projection.fullyControlledRegionIds).toEqual([
      CONTACT_FIXTURE_REGION_IDS.border,
      CONTACT_FIXTURE_REGION_IDS.capital,
      CONTACT_FIXTURE_REGION_IDS.farmland,
      CONTACT_FIXTURE_REGION_IDS.mine,
      CONTACT_FIXTURE_REGION_IDS.port,
    ]);
    expect(
      getPartiallyControlledRegionIds(
        scenario,
        world,
        CONTACT_FIXTURE_COUNTRY_IDS.player,
      ),
    ).toEqual([]);
    expect(
      getFullyControlledRegionIds(
        scenario,
        world,
        CONTACT_FIXTURE_COUNTRY_IDS.player,
      ),
    ).toEqual(projection.fullyControlledRegionIds);
  });

  it("keeps stateControl and legal ownership independent from physical control", () => {
    const { scenario, world } = createFixture();
    const regionId = CONTACT_FIXTURE_REGION_IDS.capital;
    const region = world.regions[regionId]!;
    const changedWorld: WorldState = {
      ...world,
      regions: {
        ...world.regions,
        [regionId]: {
          ...region,
          ownerCountryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
          stateControl: 0.1,
        },
      },
    };

    expect(
      deriveRegionControlSummary(scenario, changedWorld, regionId).kind,
    ).toBe("fullyControlled");
    expect(
      deriveRegionControlSummary(scenario, changedWorld, regionId)
        .fullyControlledByCountryId,
    ).toBe(CONTACT_FIXTURE_COUNTRY_IDS.player);
  });

  it("mutates one LandHex immutably with deterministic events and no-op silence", () => {
    const { scenario, world } = createFixture();
    const before = JSON.parse(JSON.stringify(world));
    const changed = changeLandHexController(scenario, world, {
      landHexId: CONTACT_FIXTURE_LAND_HEX_IDS.port,
      nextController: {
        kind: "country",
        countryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
      },
      tick: 1,
    });

    expect(world).toEqual(before);
    expect(changed.nextWorld).not.toBe(world);
    expect(changed.emittedEvents[0]).toMatchObject({
      id: "event:1:0:LAND_HEX_CONTROL_CHANGED",
      sequence: 0,
      type: "LAND_HEX_CONTROL_CHANGED",
    });

    const noOp = changeLandHexController(scenario, world, {
      landHexId: CONTACT_FIXTURE_LAND_HEX_IDS.port,
      nextController: {
        kind: "country",
        countryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
      },
      tick: 1,
    });
    expect(noOp.nextWorld).toBe(world);
    expect(noOp.emittedEvents).toEqual([]);

    const repeated = changeLandHexController(scenario, world, {
      landHexId: CONTACT_FIXTURE_LAND_HEX_IDS.port,
      nextController: {
        kind: "country",
        countryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
      },
      tick: 1,
    });
    expect(repeated).toEqual(changed);
  });

  it("rejects invalid controller references and unknown causes", () => {
    const { scenario, world } = createFixture();

    expect(() =>
      changeLandHexController(scenario, world, {
        landHexId: CONTACT_FIXTURE_LAND_HEX_IDS.port,
        nextController: {
          kind: "country",
          countryId:
            "missing-country" as typeof CONTACT_FIXTURE_COUNTRY_IDS.player,
        },
      }),
    ).toThrow("missing country");

    const causeId = asEventId("event:0:0:TICK_ADVANCED");
    expect(() =>
      changeLandHexController(scenario, world, {
        landHexId: CONTACT_FIXTURE_LAND_HEX_IDS.port,
        nextController: { kind: "uncontrolled" },
        causeIds: [causeId],
      }),
    ).toThrow("not already known");

    const accepted = changeLandHexController(scenario, world, {
      landHexId: CONTACT_FIXTURE_LAND_HEX_IDS.port,
      nextController: { kind: "uncontrolled" },
      causeIds: [causeId],
      knownCauseIds: [causeId],
    });
    expect(accepted.emittedEvents[0]?.causeIds).toEqual([causeId]);
  });

  it("preserves append-only event ordering across sequential cell changes", () => {
    const { scenario, world } = createFixture();
    const first = changeLandHexController(scenario, world, {
      landHexId: CONTACT_FIXTURE_LAND_HEX_IDS.port,
      nextController: { kind: "uncontrolled" },
      tick: 1,
    });
    const second = changeLandHexController(scenario, first.nextWorld, {
      landHexId: CONTACT_FIXTURE_LAND_HEX_IDS.capitalWest,
      nextController: { kind: "uncontrolled" },
      tick: 1,
    });
    const store = [...first.emittedEvents, ...second.emittedEvents].reduce(
      (currentStore, event) => appendEvent(currentStore, event),
      createEventStore(),
    );

    expect(store.events.map((event) => event.sequence)).toEqual([0, 1]);
  });
});
