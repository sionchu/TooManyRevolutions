import type { IdeologyDefinition, IdeologyState } from "./ideology";
import { createPolicyFixtureScenario } from "./policyFixture";
import {
  asIdeologyId,
  asLandHexId,
  asRegionId,
  asScenarioId,
  type IdeologyId,
} from "./ids";
import type { ScenarioDefinition } from "./scenario";

export const IDEOLOGY_FIXTURE_IDS = {
  monarchy: asIdeologyId("fixture.monarchy"),
  republicanism: asIdeologyId("fixture.republicanism"),
  democracy: asIdeologyId("fixture.democracy"),
  communism: asIdeologyId("fixture.communism"),
} as const;

/** Small static catalog with identity only; it has no simulation modifiers. */
export const IDEOLOGY_FIXTURE_CATALOG = {
  [IDEOLOGY_FIXTURE_IDS.monarchy]: {
    id: IDEOLOGY_FIXTURE_IDS.monarchy,
    name: "왕정주의",
    category: "regime",
    description: "왕을 국가 통치의 정당한 중심으로 보는 경향입니다.",
    tags: ["왕정", "세습"],
  },
  [IDEOLOGY_FIXTURE_IDS.republicanism]: {
    id: IDEOLOGY_FIXTURE_IDS.republicanism,
    name: "공화주의",
    category: "regime",
    description: "세습 군주가 아닌 공적 제도를 중시하는 경향입니다.",
    tags: ["공화정", "시민권"],
  },
  [IDEOLOGY_FIXTURE_IDS.democracy]: {
    id: IDEOLOGY_FIXTURE_IDS.democracy,
    name: "민주주의",
    category: "regime",
    description: "폭넓은 시민 참여와 선거를 중시하는 경향입니다.",
    tags: ["보통선거", "대표제"],
  },
  [IDEOLOGY_FIXTURE_IDS.communism]: {
    id: IDEOLOGY_FIXTURE_IDS.communism,
    name: "공산주의",
    category: "economic",
    description: "생산수단의 공동 소유와 계급 폐지를 중시하는 경향입니다.",
    tags: ["공산주의", "공동소유"],
  },
} as const satisfies Readonly<Record<IdeologyId, IdeologyDefinition>>;

const IDEOLOGY_FIXTURE_CAPITAL_ID = asRegionId("ideology-fixture.capital");
const IDEOLOGY_FIXTURE_INDUSTRIAL_ID = asRegionId(
  "ideology-fixture.industrial",
);

function createRegionIdeology(
  values: Readonly<Record<IdeologyId, IdeologyState>>,
): Readonly<Record<IdeologyId, IdeologyState>> {
  return Object.fromEntries(
    Object.entries(values).map(([ideologyId, state]) => [
      ideologyId,
      { ...state },
    ]),
  ) as Readonly<Record<IdeologyId, IdeologyState>>;
}

const CAPITAL_IDEOLOGY = createRegionIdeology({
  [IDEOLOGY_FIXTURE_IDS.monarchy]: {
    support: 0.75,
    radicalism: 0.1,
    organization: 0.4,
  },
  [IDEOLOGY_FIXTURE_IDS.republicanism]: {
    support: 0.8,
    radicalism: 0.1,
    organization: 0.1,
  },
  [IDEOLOGY_FIXTURE_IDS.democracy]: {
    support: 0.4,
    radicalism: 0.1,
    organization: 0.2,
  },
  [IDEOLOGY_FIXTURE_IDS.communism]: {
    support: 0.2,
    radicalism: 0.2,
    organization: 0.1,
  },
});

const INDUSTRIAL_IDEOLOGY = createRegionIdeology({
  [IDEOLOGY_FIXTURE_IDS.monarchy]: {
    support: 0.3,
    radicalism: 0.2,
    organization: 0.2,
  },
  [IDEOLOGY_FIXTURE_IDS.republicanism]: {
    support: 0.2,
    radicalism: 0.8,
    organization: 0.9,
  },
  [IDEOLOGY_FIXTURE_IDS.democracy]: {
    support: 0.35,
    radicalism: 0.5,
    organization: 0.7,
  },
  [IDEOLOGY_FIXTURE_IDS.communism]: {
    support: 0.45,
    radicalism: 0.7,
    organization: 0.8,
  },
});

/**
 * Two-region fixture for T013. The capital has high republican support but
 * low organization; the industrial region has lower support but high
 * radicalism and organization.
 */
export function createIdeologyFixtureScenario(): ScenarioDefinition {
  const baseScenario = createPolicyFixtureScenario();
  const baseCountry = baseScenario.initialCountries[0];
  const baseRegion = baseScenario.initialRegions[0];

  if (baseCountry === undefined || baseRegion === undefined) {
    throw new Error("Ideology fixture base scenario is incomplete.");
  }

  return {
    ...baseScenario,
    id: asScenarioId("ideology-fixture"),
    initialCountries: [
      {
        ...baseCountry,
        name: "이념 실험국",
        capitalRegionId: IDEOLOGY_FIXTURE_CAPITAL_ID,
      },
    ],
    initialRegions: [
      {
        ...baseRegion,
        id: IDEOLOGY_FIXTURE_CAPITAL_ID,
        name: "이념 실험 수도",
        population: 100,
        ideology: CAPITAL_IDEOLOGY,
      },
      {
        ...baseRegion,
        id: IDEOLOGY_FIXTURE_INDUSTRIAL_ID,
        name: "이념 실험 공업지대",
        population: 300,
        urbanization: 0.8,
        accessibility: 0.7,
        ideology: INDUSTRIAL_IDEOLOGY,
      },
    ],
    ideologyCatalog: IDEOLOGY_FIXTURE_CATALOG,
    mapContactTopology: {
      regionIds: [IDEOLOGY_FIXTURE_CAPITAL_ID, IDEOLOGY_FIXTURE_INDUSTRIAL_ID],
      contactEdges: [],
    },
    mapTerritorialTopology: {
      landHexes: [
        {
          id: asLandHexId("ideology-fixture.capital-hex"),
          regionId: IDEOLOGY_FIXTURE_CAPITAL_ID,
          coordinate: { q: 0, r: 0 },
          terrain: "plains",
        },
        {
          id: asLandHexId("ideology-fixture.industrial-hex"),
          regionId: IDEOLOGY_FIXTURE_INDUSTRIAL_ID,
          coordinate: { q: 1, r: 0 },
          terrain: "hills",
        },
      ],
    },
  };
}
