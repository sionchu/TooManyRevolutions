import { createPoliticalCrisisFixtureScenario } from "./politicalCrisisFixture";
import { asConflictId, asFactionId, asLandHexId, asScenarioId } from "./ids";
import type { ScenarioDefinition } from "./scenario";

export const T021_CONFLICT_IDS = {
  rebellion: asConflictId("t021.rebellion"),
  coup: asConflictId("t021.coup"),
  countryWar: asConflictId("t021.country-war"),
  countryWarSecond: asConflictId("t021.country-war-second"),
  collisionFirst: asConflictId("t021.collision-first"),
  collisionSecond: asConflictId("t021.collision-second"),
} as const;

export const T021_FACTION_IDS = {
  rebellion: asFactionId("t021.rebellion-faction"),
  collisionSecond: asFactionId("t021.collision-second-faction"),
} as const;

/**
 * T021 diagnostic scenario: the T018 political crisis fixture with a second
 * LandHex in the affected Region so a rebellion cannot flip a whole Region.
 */
export function createT021RebellionScenario(): ScenarioDefinition {
  const baseScenario = createPoliticalCrisisFixtureScenario();
  const industrialHex = baseScenario.mapTerritorialTopology.landHexes.find(
    (landHex) => landHex.regionId === baseScenario.initialRegions[1]?.id,
  );

  if (industrialHex === undefined) {
    throw new Error(
      "T021 rebellion fixture is missing its industrial LandHex.",
    );
  }

  return {
    ...baseScenario,
    id: asScenarioId("t021.rebellion-fixture"),
    mapTerritorialTopology: {
      landHexes: [
        ...baseScenario.mapTerritorialTopology.landHexes,
        {
          ...industrialHex,
          id: asLandHexId("t021.industrial-extra-hex"),
          coordinate: {
            q: industrialHex.coordinate.q + 1,
            r: industrialHex.coordinate.r,
          },
        },
      ],
    },
  };
}
