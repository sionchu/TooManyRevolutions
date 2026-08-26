import { describe, expect, it } from "vitest";

import { derivePresentationState } from "../../presentation/presentationState";
import { advanceDemoRecord, createDemoRunRecord } from "../../app/demoGame";
import { createInitialWorldState } from "./world";
import {
  GAMEBUILDERS_DEMO_COUNTRY_IDS,
  GAMEBUILDERS_DEMO_REGION_IDS,
  createGameBuildersDemoScenario,
} from "./gameBuildersDemoScenario";
import { assertScenarioDefinition } from "./scenario";

describe("GameBuilders product map authoring", () => {
  it("authors three countries with real regions, hexes, and contact routes", () => {
    const scenario = createGameBuildersDemoScenario();

    expect(() => assertScenarioDefinition(scenario)).not.toThrow();
    expect(scenario.initialCountries.map((country) => country.id)).toEqual([
      GAMEBUILDERS_DEMO_COUNTRY_IDS.arken,
      GAMEBUILDERS_DEMO_COUNTRY_IDS.veloria,
      GAMEBUILDERS_DEMO_COUNTRY_IDS.karsen,
    ]);
    expect(scenario.initialRegions).toHaveLength(10);
    expect(scenario.mapTerritorialTopology.landHexes).toHaveLength(20);
    expect(
      scenario.mapContactTopology.contactEdges.some(
        (edge) =>
          edge.fromRegionId === scenario.initialRegions[0]!.id &&
          edge.toRegionId === GAMEBUILDERS_DEMO_REGION_IDS.veloriaPort,
      ),
    ).toBe(true);
    expect(
      scenario.mapContactTopology.contactEdges.some(
        (edge) =>
          edge.fromRegionId === scenario.initialRegions[1]!.id &&
          edge.toRegionId === GAMEBUILDERS_DEMO_REGION_IDS.karsenFrontier,
      ),
    ).toBe(true);

    const world = createInitialWorldState(scenario, 18970401);
    const presentation = derivePresentationState(scenario, world);
    expect(presentation.regions).toHaveLength(10);
    expect(presentation.landHexes).toHaveLength(20);
    expect(
      presentation.regions.filter(
        (region) =>
          region.ownerCountryId !== GAMEBUILDERS_DEMO_COUNTRY_IDS.arken,
      ),
    ).toHaveLength(8);
    expect(
      presentation.contactRoutes.some(
        (route) =>
          route.targetRegionId === GAMEBUILDERS_DEMO_REGION_IDS.veloriaPort,
      ),
    ).toBe(true);
  });

  it("keeps initial world and first runtime steps deterministic", () => {
    const scenario = createGameBuildersDemoScenario();
    const first = createInitialWorldState(scenario, 18970401);
    const second = createInitialWorldState(scenario, 18970401);

    expect(second).toEqual(first);
    expect(advanceDemoRecord(createDemoRunRecord(), 3).world.tick).toBe(3);
  });

  it("does not make insertion order part of the product map", () => {
    const scenario = createGameBuildersDemoScenario();
    const reversed: typeof scenario = {
      ...scenario,
      initialCountries: [...scenario.initialCountries].reverse(),
      initialRegions: [...scenario.initialRegions].reverse(),
      initialGovernments: [...scenario.initialGovernments].reverse(),
      initialFactions: [...scenario.initialFactions].reverse(),
      mapContactTopology: {
        ...scenario.mapContactTopology,
        regionIds: [...scenario.mapContactTopology.regionIds].reverse(),
        contactEdges: [...scenario.mapContactTopology.contactEdges].reverse(),
      },
      mapTerritorialTopology: {
        landHexes: [...scenario.mapTerritorialTopology.landHexes].reverse(),
      },
    };

    assertScenarioDefinition(reversed);
    expect(createInitialWorldState(reversed, 18970401)).toEqual(
      createInitialWorldState(scenario, 18970401),
    );
  });
});
