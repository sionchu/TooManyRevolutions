import { describe, expect, it } from "vitest";

import { runSimulationStep } from "../core/tick";
import {
  CONTACT_FIXTURE_LAND_HEX_IDS,
  CONTACT_FIXTURE_REGION_IDS,
  createContactFixtureScenario,
} from "./contactFixture";
import { asRegionId } from "./ids";
import {
  derivePhysicalAdjacency,
  getLandHex,
  getLandHexesForRegion,
  getPhysicalNeighborIds,
  getPhysicalNeighbors,
} from "./territorialTopology";
import { getOutgoingContacts } from "../systems/contactGraph";
import type { LandHexDefinition } from "./territorialTopology";
import { createInitialWorldState } from "./world";

function withLandHexes(
  scenario: ReturnType<typeof createContactFixtureScenario>,
  landHexes: readonly LandHexDefinition[],
): ReturnType<typeof createContactFixtureScenario> {
  return {
    ...scenario,
    mapTerritorialTopology: { landHexes },
  };
}

describe("T017A static territorial topology", () => {
  it("supports multiple LandHex definitions in one Region", () => {
    const scenario = createContactFixtureScenario();

    expect(
      getLandHexesForRegion(scenario, CONTACT_FIXTURE_REGION_IDS.capital).map(
        (landHex) => landHex.id,
      ),
    ).toEqual([
      CONTACT_FIXTURE_LAND_HEX_IDS.capitalEast,
      CONTACT_FIXTURE_LAND_HEX_IDS.capitalWest,
    ]);
    expect(
      getLandHexesForRegion(scenario, CONTACT_FIXTURE_REGION_IDS.merchantPort),
    ).toHaveLength(2);
  });

  it("derives cross-Region physical neighbors from axial coordinates", () => {
    const scenario = createContactFixtureScenario();
    const neighbors = getPhysicalNeighbors(
      scenario,
      CONTACT_FIXTURE_LAND_HEX_IDS.capitalWest,
    );

    expect(neighbors.map((neighbor) => neighbor.regionId)).toEqual(
      expect.arrayContaining([
        CONTACT_FIXTURE_REGION_IDS.port,
        CONTACT_FIXTURE_REGION_IDS.border,
      ]),
    );
    expect(
      getPhysicalNeighborIds(
        scenario,
        CONTACT_FIXTURE_LAND_HEX_IDS.merchantQuays,
      ),
    ).toContain(CONTACT_FIXTURE_LAND_HEX_IDS.monarchyBorder);
  });

  it("rejects duplicate LandHex IDs, coordinates, and invalid Region membership", () => {
    const scenario = createContactFixtureScenario();
    const first = scenario.mapTerritorialTopology.landHexes[0]!;

    expect(() =>
      createInitialWorldState(
        withLandHexes(scenario, [
          ...scenario.mapTerritorialTopology.landHexes,
          first,
        ]),
        1,
      ),
    ).toThrow("repeats LandHex");

    const duplicateCoordinate = scenario.mapTerritorialTopology.landHexes.map(
      (landHex, index) =>
        index === 1
          ? { ...landHex, coordinate: { ...first.coordinate } }
          : landHex,
    );
    expect(() =>
      createInitialWorldState(withLandHexes(scenario, duplicateCoordinate), 1),
    ).toThrow("repeats coordinate");

    const invalidRegion = scenario.mapTerritorialTopology.landHexes.map(
      (landHex, index) =>
        index === 0
          ? { ...landHex, regionId: asRegionId("missing-region") }
          : landHex,
    );
    expect(() =>
      createInitialWorldState(withLandHexes(scenario, invalidRegion), 1),
    ).toThrow("references missing region");

    const nonIntegerCoordinate = scenario.mapTerritorialTopology.landHexes.map(
      (landHex, index) =>
        index === 0
          ? { ...landHex, coordinate: { q: 0.5, r: landHex.coordinate.r } }
          : landHex,
    );
    expect(() =>
      createInitialWorldState(withLandHexes(scenario, nonIntegerCoordinate), 1),
    ).toThrow("integer axial values");

    const invalidTerrain = scenario.mapTerritorialTopology.landHexes.map(
      (landHex, index) =>
        index === 0
          ? {
              ...landHex,
              terrain: "invalid" as unknown as typeof landHex.terrain,
            }
          : landHex,
    );
    expect(() =>
      createInitialWorldState(withLandHexes(scenario, invalidTerrain), 1),
    ).toThrow("invalid terrain");
  });

  it("returns the same adjacency regardless of definition insertion order", () => {
    const scenario = createContactFixtureScenario();
    const reversed = withLandHexes(
      scenario,
      [...scenario.mapTerritorialTopology.landHexes].reverse(),
    );

    expect(derivePhysicalAdjacency(reversed)).toEqual(
      derivePhysicalAdjacency(scenario),
    );
    expect(
      getLandHexesForRegion(reversed, CONTACT_FIXTURE_REGION_IDS.capital),
    ).toEqual(
      getLandHexesForRegion(scenario, CONTACT_FIXTURE_REGION_IDS.capital),
    );
  });

  it("keeps static topology out of WorldState and initializes LandHex controllers", () => {
    const scenario = createContactFixtureScenario();
    const world = createInitialWorldState(scenario, 1);
    const landHex = getLandHex(
      scenario,
      CONTACT_FIXTURE_LAND_HEX_IDS.capitalWest,
    );

    expect(world).not.toHaveProperty("mapTerritorialTopology");
    expect(world).toHaveProperty("landHexStates");
    expect("controller" in landHex).toBe(false);
    expect(
      world.regions[CONTACT_FIXTURE_REGION_IDS.capital],
    ).not.toHaveProperty("controller");
    expect(world.landHexStates[landHex.id]?.controller).toEqual({
      kind: "country",
      countryId: scenario.playerCountryId,
    });
  });

  it("does not derive or mutate ContactGraph routes from physical topology", () => {
    const scenario = createContactFixtureScenario();
    const relocated = withLandHexes(
      scenario,
      scenario.mapTerritorialTopology.landHexes.map((landHex, index) =>
        index === 0 ? { ...landHex, coordinate: { q: 100, r: 100 } } : landHex,
      ),
    );
    const world = createInitialWorldState(scenario, 1);
    const relocatedWorld = createInitialWorldState(relocated, 1);

    expect(
      getOutgoingContacts(scenario, world, CONTACT_FIXTURE_REGION_IDS.port),
    ).toEqual(
      getOutgoingContacts(
        relocated,
        relocatedWorld,
        CONTACT_FIXTURE_REGION_IDS.port,
      ),
    );
  });

  it("seeds runtime territorial state from static topology without changing the clock", () => {
    const scenario = createContactFixtureScenario();
    const withoutTopology = withLandHexes(scenario, []);
    const withTopologyWorld = createInitialWorldState(scenario, 7);
    const withoutTopologyWorld = createInitialWorldState(withoutTopology, 7);

    const withTopologyResult = runSimulationStep(withTopologyWorld, {
      actions: [],
    });
    const withoutTopologyResult = runSimulationStep(withoutTopologyWorld, {
      actions: [],
    });

    expect(withTopologyWorld.landHexStates).not.toEqual(
      withoutTopologyWorld.landHexStates,
    );
    expect(withTopologyResult.nextWorld.tick).toBe(
      withoutTopologyResult.nextWorld.tick,
    );
    expect(withTopologyResult.nextWorld.date).toEqual(
      withoutTopologyResult.nextWorld.date,
    );
  });
});
