import {
  asLandHexId,
  asRegionId,
  asScenarioId,
  type LandHexId,
  type RegionId,
  type ScenarioId,
} from "../sim/state/ids";

export type WorldScenePoiKind =
  "port" | "mine" | "fort" | "granary" | "assembly";

export type WorldSceneInstitutionKind = "capital-seat" | "assembly-hall";

export interface AuthoredWorldScenePoiDefinition {
  readonly id: string;
  readonly name: string;
  readonly regionId: RegionId;
  readonly anchorLandHexId: LandHexId;
  readonly kind: WorldScenePoiKind;
  readonly offsetX: number;
  readonly offsetZ: number;
}

export interface AuthoredWorldSceneInstitutionDefinition {
  readonly id: string;
  readonly name: string;
  readonly regionId: RegionId;
  readonly anchorLandHexId: LandHexId;
  readonly kind: WorldSceneInstitutionKind;
  readonly offsetX: number;
  readonly offsetZ: number;
}

export interface AuthoredWorldSceneContent {
  readonly pois: readonly AuthoredWorldScenePoiDefinition[];
  readonly institutions: readonly AuthoredWorldSceneInstitutionDefinition[];
}

const GAMEBUILDERS_DEMO_SCENARIO_ID = asScenarioId("gamebuilders.demo");
const ARKEN_CAPITAL_REGION_ID = asRegionId("ideology-fixture.capital");
const ARKEN_INDUSTRIAL_REGION_ID = asRegionId("ideology-fixture.industrial");

/**
 * Stable, authored presentation content for the GameBuilders demo.
 *
 * These records identify existing ScenarioDefinition Regions/LandHexes. They
 * are not WorldState, do not add simulation entities, and do not infer a POI
 * from a color or terrain alone.
 */
export const GAMEBUILDERS_DEMO_WORLD_SCENE_CONTENT: AuthoredWorldSceneContent =
  {
    pois: [
      {
        id: "tmr.poi.arken.iron-works",
        name: "철산 제련소",
        regionId: ARKEN_INDUSTRIAL_REGION_ID,
        anchorLandHexId: asLandHexId("gamebuilders.arken.industrial-west"),
        kind: "mine",
        offsetX: -0.28,
        offsetZ: 0.24,
      },
      {
        id: "tmr.poi.veloria.port",
        name: "벨로리아 항구",
        regionId: asRegionId("gamebuilders.veloria.port"),
        anchorLandHexId: asLandHexId("gamebuilders.veloria.port"),
        kind: "port",
        offsetX: 0.18,
        offsetZ: 0.2,
      },
      {
        id: "tmr.poi.karsen.frontier-fort",
        name: "카르센 국경 요새",
        regionId: asRegionId("gamebuilders.karsen.frontier"),
        anchorLandHexId: asLandHexId("gamebuilders.karsen.frontier"),
        kind: "fort",
        offsetX: -0.22,
        offsetZ: -0.2,
      },
      {
        id: "tmr.poi.karsen.gate-checkpoint",
        name: "카르센 관문",
        regionId: asRegionId("gamebuilders.karsen.gate"),
        anchorLandHexId: asLandHexId("gamebuilders.karsen.gate"),
        kind: "fort",
        offsetX: 0.22,
        offsetZ: 0.2,
      },
    ],
    institutions: [
      {
        id: "tmr.institution.arken.capital-seat",
        name: "아르켄 왕궁",
        regionId: ARKEN_CAPITAL_REGION_ID,
        anchorLandHexId: asLandHexId("ideology-fixture.capital-hex"),
        kind: "capital-seat",
        offsetX: -0.28,
        offsetZ: -0.22,
      },
      {
        id: "tmr.institution.arken.assembly-hall",
        name: "왕도 의회당",
        regionId: ARKEN_CAPITAL_REGION_ID,
        anchorLandHexId: asLandHexId("ideology-fixture.capital-hex"),
        kind: "assembly-hall",
        offsetX: 0.3,
        offsetZ: 0.22,
      },
    ],
  };

const EMPTY_WORLD_SCENE_CONTENT: AuthoredWorldSceneContent = {
  pois: [],
  institutions: [],
};

export function authoredWorldSceneContentForScenario(
  scenarioId: ScenarioId,
): AuthoredWorldSceneContent {
  return scenarioId === GAMEBUILDERS_DEMO_SCENARIO_ID
    ? GAMEBUILDERS_DEMO_WORLD_SCENE_CONTENT
    : EMPTY_WORLD_SCENE_CONTENT;
}
