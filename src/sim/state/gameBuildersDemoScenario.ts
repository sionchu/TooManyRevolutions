import { createF04DValidationScenario } from "./gate1fValidationFixture";
import {
  createGameBuildersProductionInterventionCatalog,
  GAMEBUILDERS_PRODUCTION_POLICY_CATALOG,
} from "./gameBuildersDecisionCatalog";
import {
  asContactEdgeId,
  asCountryId,
  asGovernmentId,
  asLandHexId,
  asRegionId,
  asScenarioId,
  type CountryId,
  type IdeologyId,
  type RegionId,
} from "./ids";
import type { Country, DiplomaticRelation } from "./country";
import type { Government } from "./government";
import type { ScenarioRegion } from "./region";
import type { ScenarioDefinition } from "./scenario";
import type { LandHexDefinition } from "./territorialTopology";
import type { IdeologyState } from "./ideology";
import { IDEOLOGY_FIXTURE_IDS } from "./ideologyFixture";

export const GAMEBUILDERS_DEMO_COUNTRY_IDS = {
  arken: asCountryId("policy-fixture.country"),
  veloria: asCountryId("gamebuilders.veloria"),
  karsen: asCountryId("gamebuilders.karsen"),
} as const;

export const GAMEBUILDERS_DEMO_REGION_IDS = {
  veloriaPort: asRegionId("gamebuilders.veloria.port"),
  veloriaInland: asRegionId("gamebuilders.veloria.inland"),
  veloriaBorder: asRegionId("gamebuilders.veloria.border"),
  veloriaHighlands: asRegionId("gamebuilders.veloria.highlands"),
  karsenFrontier: asRegionId("gamebuilders.karsen.frontier"),
  karsenGate: asRegionId("gamebuilders.karsen.gate"),
  karsenForest: asRegionId("gamebuilders.karsen.forest"),
  karsenMountains: asRegionId("gamebuilders.karsen.mountains"),
} as const;

const DEMO_GOVERNMENT_IDS = {
  veloria: asGovernmentId("gamebuilders.veloria.government"),
  karsen: asGovernmentId("gamebuilders.karsen.government"),
} as const;

const DEMO_CONTACT_EDGE_IDS = {
  arkenToVeloria: asContactEdgeId("gamebuilders.arken-to-veloria"),
  veloriaToArken: asContactEdgeId("gamebuilders.veloria-to-arken"),
  arkenToKarsen: asContactEdgeId("gamebuilders.arken-to-karsen"),
  karsenToArken: asContactEdgeId("gamebuilders.karsen-to-arken"),
} as const;

const DEMO_LAND_HEXES: readonly LandHexDefinition[] = [
  {
    id: asLandHexId("gamebuilders.veloria.port"),
    regionId: GAMEBUILDERS_DEMO_REGION_IDS.veloriaPort,
    coordinate: { q: -1, r: 0 },
    terrain: "coast",
  },
  {
    id: asLandHexId("gamebuilders.veloria.inland"),
    regionId: GAMEBUILDERS_DEMO_REGION_IDS.veloriaInland,
    coordinate: { q: -2, r: 0 },
    terrain: "plains",
  },
  {
    id: asLandHexId("gamebuilders.veloria.border"),
    regionId: GAMEBUILDERS_DEMO_REGION_IDS.veloriaBorder,
    coordinate: { q: -1, r: 1 },
    terrain: "hills",
  },
  {
    id: asLandHexId("gamebuilders.veloria.highlands"),
    regionId: GAMEBUILDERS_DEMO_REGION_IDS.veloriaHighlands,
    coordinate: { q: -2, r: 1 },
    terrain: "mountains",
  },
  {
    id: asLandHexId("gamebuilders.karsen.frontier"),
    regionId: GAMEBUILDERS_DEMO_REGION_IDS.karsenFrontier,
    coordinate: { q: 3, r: 0 },
    terrain: "hills",
  },
  {
    id: asLandHexId("gamebuilders.karsen.gate"),
    regionId: GAMEBUILDERS_DEMO_REGION_IDS.karsenGate,
    coordinate: { q: 4, r: 0 },
    terrain: "plains",
  },
  {
    id: asLandHexId("gamebuilders.karsen.forest"),
    regionId: GAMEBUILDERS_DEMO_REGION_IDS.karsenForest,
    coordinate: { q: 3, r: 1 },
    terrain: "forest",
  },
  {
    id: asLandHexId("gamebuilders.karsen.mountains"),
    regionId: GAMEBUILDERS_DEMO_REGION_IDS.karsenMountains,
    coordinate: { q: 4, r: 1 },
    terrain: "mountains",
  },
];

// The inherited pressure fixture starts with only three player LandHexes.
// Keep the same authored regions and current runtime rules, but give the
// product slice enough contiguous territory for controller changes to remain
// legible across the long no-action audit horizon.
const DEMO_ARKEN_LAND_HEXES: readonly LandHexDefinition[] = [
  {
    id: asLandHexId("gamebuilders.arken.capital-south"),
    regionId: asRegionId("ideology-fixture.capital"),
    coordinate: { q: 0, r: 1 },
    terrain: "plains",
  },
  {
    id: asLandHexId("gamebuilders.arken.industrial-west"),
    regionId: asRegionId("ideology-fixture.industrial"),
    coordinate: { q: 1, r: 1 },
    terrain: "forest",
  },
  {
    id: asLandHexId("gamebuilders.arken.industrial-east"),
    regionId: asRegionId("ideology-fixture.industrial"),
    coordinate: { q: 2, r: 1 },
    terrain: "hills",
  },
  {
    id: asLandHexId("gamebuilders.arken.capital-north"),
    regionId: asRegionId("ideology-fixture.capital"),
    coordinate: { q: 0, r: -1 },
    terrain: "hills",
  },
  {
    id: asLandHexId("gamebuilders.arken.industrial-north-west"),
    regionId: asRegionId("ideology-fixture.industrial"),
    coordinate: { q: 1, r: -1 },
    terrain: "forest",
  },
  {
    id: asLandHexId("gamebuilders.arken.industrial-north-east"),
    regionId: asRegionId("ideology-fixture.industrial"),
    coordinate: { q: 2, r: -1 },
    terrain: "mountains",
  },
  {
    id: asLandHexId("gamebuilders.arken.capital-south-east"),
    regionId: asRegionId("ideology-fixture.capital"),
    coordinate: { q: 0, r: 2 },
    terrain: "coast",
  },
  {
    id: asLandHexId("gamebuilders.arken.industrial-south-west"),
    regionId: asRegionId("ideology-fixture.industrial"),
    coordinate: { q: 1, r: 2 },
    terrain: "plains",
  },
  {
    id: asLandHexId("gamebuilders.arken.industrial-south-east"),
    regionId: asRegionId("ideology-fixture.industrial"),
    coordinate: { q: 2, r: 2 },
    terrain: "hills",
  },
];

function cloneDiplomacy(
  diplomacy: Readonly<Record<CountryId, DiplomaticRelation>>,
): Readonly<Record<CountryId, DiplomaticRelation>> {
  return Object.fromEntries(
    Object.entries(diplomacy).map(([countryId, relation]) => [
      countryId,
      { ...relation },
    ]),
  ) as Readonly<Record<CountryId, DiplomaticRelation>>;
}

function cloneCountry(
  base: Country,
  input: Pick<
    Country,
    "id" | "name" | "currentGovernmentId" | "capitalRegionId"
  >,
): Country {
  return {
    ...base,
    ...input,
    diplomacy: cloneDiplomacy(base.diplomacy),
  };
}

function cloneGovernment(
  base: Government,
  input: Pick<Government, "id" | "countryId" | "name">,
): Government {
  return { ...base, ...input };
}

function cloneRegion(
  base: ScenarioRegion,
  input: {
    readonly id: RegionId;
    readonly name: string;
    readonly ownerCountryId: CountryId;
    readonly population: number;
    readonly terrainResource: "food" | "material";
    readonly ideology?: Readonly<Record<IdeologyId, IdeologyState>>;
  },
): ScenarioRegion {
  return {
    ...base,
    id: input.id,
    name: input.name,
    ownerCountryId: input.ownerCountryId,
    initialController: {
      kind: "country",
      countryId: input.ownerCountryId,
    },
    population: input.population,
    resources: { [input.terrainResource]: input.population / 20 },
    resourceProductionCapacity: {
      [input.terrainResource]: input.population / 30,
    },
    resourceProduction: {},
    resourceDemand: { food: input.population / 35 },
    production: input.population / 10,
    stateControl: 0.72,
    infrastructure: 0.42,
    scarcity: 0.04,
    unrest: 0.08,
    ideology:
      input.ideology ??
      (Object.fromEntries(
        Object.entries(base.ideology).map(([ideologyId, state]) => [
          ideologyId,
          { ...state },
        ]),
      ) as Readonly<Record<IdeologyId, IdeologyState>>),
  };
}

function regionalIdeology(
  monarchy: number,
  republicanism: number,
  democracy: number,
  communism: number,
): Readonly<Record<IdeologyId, IdeologyState>> {
  const values = {
    [IDEOLOGY_FIXTURE_IDS.monarchy]: {
      support: monarchy,
      radicalism: Math.min(1, monarchy * 0.24),
      organization: Math.min(1, monarchy * 0.42),
    },
    [IDEOLOGY_FIXTURE_IDS.republicanism]: {
      support: republicanism,
      radicalism: Math.min(1, republicanism * 0.3),
      organization: Math.min(1, republicanism * 0.38),
    },
    [IDEOLOGY_FIXTURE_IDS.democracy]: {
      support: democracy,
      radicalism: Math.min(1, democracy * 0.28),
      organization: Math.min(1, democracy * 0.34),
    },
    [IDEOLOGY_FIXTURE_IDS.communism]: {
      support: communism,
      radicalism: Math.min(1, communism * 0.46),
      organization: Math.min(1, communism * 0.5),
    },
  } satisfies Readonly<Record<IdeologyId, IdeologyState>>;
  return values;
}

function clonePolicy(
  policy: ScenarioDefinition["initialCountryPolicies"][CountryId],
): ScenarioDefinition["initialCountryPolicies"][CountryId] {
  return {
    ...policy,
    activePolicyIds: [...policy.activePolicyIds],
    enactedAtTick: { ...policy.enactedAtTick },
    institutionalRules: { ...policy.institutionalRules },
  };
}

/**
 * The GameBuilders slice composes accepted fixture rules into one named demo
 * scenario. It owns initial content only; all runtime behavior remains in the
 * existing simulation pipeline.
 */
export function createGameBuildersDemoScenario(): ScenarioDefinition {
  const base = createF04DValidationScenario();
  const playerCountry = base.initialCountries[0];
  const capital = base.initialRegions[0];
  const industrial = base.initialRegions[1];
  const baseGovernment = base.initialGovernments[0];
  const laborFaction = base.initialFactions.find((faction) =>
    faction.interests.includes("labor"),
  );
  const basePolicy = playerCountry
    ? base.initialCountryPolicies[playerCountry.id]
    : undefined;

  if (
    playerCountry === undefined ||
    capital === undefined ||
    industrial === undefined ||
    baseGovernment === undefined ||
    laborFaction === undefined ||
    basePolicy === undefined
  ) {
    throw new Error("GameBuilders demo base scenario is incomplete.");
  }

  const arkenId = playerCountry.id;
  if (arkenId !== GAMEBUILDERS_DEMO_COUNTRY_IDS.arken) {
    throw new Error("GameBuilders demo player country identity drifted.");
  }

  const veloriaId = GAMEBUILDERS_DEMO_COUNTRY_IDS.veloria;
  const karsenId = GAMEBUILDERS_DEMO_COUNTRY_IDS.karsen;
  const veloriaCapital = GAMEBUILDERS_DEMO_REGION_IDS.veloriaPort;
  const karsenCapital = GAMEBUILDERS_DEMO_REGION_IDS.karsenFrontier;
  const veloria = cloneCountry(playerCountry, {
    id: veloriaId,
    name: "벨로리아 공화국",
    currentGovernmentId: DEMO_GOVERNMENT_IDS.veloria,
    capitalRegionId: veloriaCapital,
  });
  const karsen = cloneCountry(playerCountry, {
    id: karsenId,
    name: "카르센 변경백령",
    currentGovernmentId: DEMO_GOVERNMENT_IDS.karsen,
    capitalRegionId: karsenCapital,
  });

  const arkenDiplomacy = {
    [veloriaId]: {
      opinion: 28,
      tradeDependence: 0.62,
      borderThreat: 0.24,
      ideologicalThreat: 0.14,
    },
    [karsenId]: {
      opinion: -12,
      tradeDependence: 0.31,
      borderThreat: 0.68,
      ideologicalThreat: 0.2,
    },
  } satisfies Readonly<Record<CountryId, DiplomaticRelation>>;

  const countries: readonly Country[] = [
    {
      ...playerCountry,
      name: "아르켄 왕국",
      diplomacy: arkenDiplomacy,
    },
    {
      ...veloria,
      treasury: 340,
      dailyIncome: 12,
      dailyExpenditure: 4,
      legitimacy: 64,
      stateCapacity: 68,
      production: 46,
      militaryPower: 55,
      instability: 18,
      stateContinuity: 86,
      diplomacy: {
        [arkenId]: {
          opinion: 36,
          tradeDependence: 0.58,
          borderThreat: 0.18,
          ideologicalThreat: 0.08,
        },
      },
    },
    {
      ...karsen,
      treasury: 280,
      dailyIncome: 10,
      dailyExpenditure: 5,
      legitimacy: 57,
      stateCapacity: 59,
      production: 52,
      militaryPower: 72,
      instability: 24,
      stateContinuity: 81,
      diplomacy: {
        [arkenId]: {
          opinion: -18,
          tradeDependence: 0.28,
          borderThreat: 0.71,
          ideologicalThreat: 0.24,
        },
      },
    },
  ];

  const neighborRegions: readonly ScenarioRegion[] = [
    cloneRegion(base.initialRegions[0]!, {
      id: GAMEBUILDERS_DEMO_REGION_IDS.veloriaPort,
      name: "벨로리아 항구",
      ownerCountryId: veloriaId,
      population: 210,
      terrainResource: "food",
      ideology: regionalIdeology(0.32, 0.58, 0.46, 0.16),
    }),
    cloneRegion(base.initialRegions[0]!, {
      id: GAMEBUILDERS_DEMO_REGION_IDS.veloriaInland,
      name: "벨로리아 내륙 평야",
      ownerCountryId: veloriaId,
      population: 180,
      terrainResource: "food",
      ideology: regionalIdeology(0.48, 0.3, 0.24, 0.18),
    }),
    cloneRegion(base.initialRegions[0]!, {
      id: GAMEBUILDERS_DEMO_REGION_IDS.veloriaBorder,
      name: "벨로리아 국경주",
      ownerCountryId: veloriaId,
      population: 130,
      terrainResource: "material",
      ideology: regionalIdeology(0.25, 0.36, 0.42, 0.31),
    }),
    cloneRegion(base.initialRegions[0]!, {
      id: GAMEBUILDERS_DEMO_REGION_IDS.veloriaHighlands,
      name: "벨로리아 고지대",
      ownerCountryId: veloriaId,
      population: 95,
      terrainResource: "material",
      ideology: regionalIdeology(0.62, 0.2, 0.17, 0.12),
    }),
    cloneRegion(base.initialRegions[0]!, {
      id: GAMEBUILDERS_DEMO_REGION_IDS.karsenFrontier,
      name: "카르센 전초지",
      ownerCountryId: karsenId,
      population: 120,
      terrainResource: "material",
      ideology: regionalIdeology(0.2, 0.18, 0.27, 0.58),
    }),
    cloneRegion(base.initialRegions[0]!, {
      id: GAMEBUILDERS_DEMO_REGION_IDS.karsenGate,
      name: "카르센 관문",
      ownerCountryId: karsenId,
      population: 145,
      terrainResource: "food",
      ideology: regionalIdeology(0.38, 0.22, 0.2, 0.43),
    }),
    cloneRegion(base.initialRegions[0]!, {
      id: GAMEBUILDERS_DEMO_REGION_IDS.karsenForest,
      name: "카르센 삼림",
      ownerCountryId: karsenId,
      population: 105,
      terrainResource: "material",
      ideology: regionalIdeology(0.28, 0.16, 0.2, 0.51),
    }),
    cloneRegion(base.initialRegions[0]!, {
      id: GAMEBUILDERS_DEMO_REGION_IDS.karsenMountains,
      name: "카르센 산악령",
      ownerCountryId: karsenId,
      population: 80,
      terrainResource: "material",
      ideology: regionalIdeology(0.55, 0.12, 0.14, 0.29),
    }),
  ];

  const governments: readonly Government[] = [
    ...base.initialGovernments,
    cloneGovernment(baseGovernment, {
      id: DEMO_GOVERNMENT_IDS.veloria,
      countryId: veloriaId,
      name: "벨로리아 의회 정부",
    }),
    cloneGovernment(baseGovernment, {
      id: DEMO_GOVERNMENT_IDS.karsen,
      countryId: karsenId,
      name: "카르센 변경 정부",
    }),
  ];

  const baseRegionIds = base.mapContactTopology.regionIds;
  const neighborRegionIds = neighborRegions.map((region) => region.id);
  const neighborPolicies = {
    ...base.initialCountryPolicies,
    [veloriaId]: clonePolicy(basePolicy),
    [karsenId]: clonePolicy(basePolicy),
  };

  return {
    ...base,
    id: asScenarioId("gamebuilders.demo"),
    version: 1,
    initialDate: { year: 1897, month: 4, day: 1 },
    initialCountries: countries,
    initialRegions: [
      ...base.initialRegions.map((region, index) => ({
        ...region,
        name: index === 0 ? "왕도권" : "철산 공업주",
      })),
      ...neighborRegions,
    ],
    initialGovernments: governments.map((government) => ({
      ...government,
      name:
        government.id === DEMO_GOVERNMENT_IDS.veloria
          ? "벨로리아 의회 정부"
          : government.id === DEMO_GOVERNMENT_IDS.karsen
            ? "카르센 변경 정부"
            : government.authority === "central"
              ? "아르켄 왕실 내각"
              : "국가 비상 평의회",
    })),
    initialFactions: base.initialFactions.map((faction, index) => ({
      ...faction,
      name: index === 0 ? "국가 수비 평의회" : "철산 노동자회",
    })),
    initialCountryPolicies: neighborPolicies,
    policyCatalog: GAMEBUILDERS_PRODUCTION_POLICY_CATALOG,
    mapContactTopology: {
      regionIds: [...baseRegionIds, ...neighborRegionIds],
      contactEdges: [
        ...base.mapContactTopology.contactEdges,
        {
          id: DEMO_CONTACT_EDGE_IDS.arkenToVeloria,
          fromRegionId: capital.id,
          toRegionId: veloriaCapital,
          channel: "trade",
          baseStrength: 0.72,
        },
        {
          id: DEMO_CONTACT_EDGE_IDS.veloriaToArken,
          fromRegionId: veloriaCapital,
          toRegionId: capital.id,
          channel: "information",
          baseStrength: 0.58,
        },
        {
          id: DEMO_CONTACT_EDGE_IDS.arkenToKarsen,
          fromRegionId: industrial.id,
          toRegionId: karsenCapital,
          channel: "border",
          baseStrength: 0.64,
        },
        {
          id: DEMO_CONTACT_EDGE_IDS.karsenToArken,
          fromRegionId: karsenCapital,
          toRegionId: industrial.id,
          channel: "border",
          baseStrength: 0.68,
        },
      ],
    },
    mapTerritorialTopology: {
      landHexes: [
        ...base.mapTerritorialTopology.landHexes,
        ...DEMO_ARKEN_LAND_HEXES,
        ...DEMO_LAND_HEXES,
      ],
    },
    interventionCatalog: createGameBuildersProductionInterventionCatalog({
      capitalRegionId: capital.id,
      industrialRegionId: industrial.id,
      laborFactionId: laborFaction.id,
    }),
  };
}

export const GAMEBUILDERS_DEMO_SCENARIO = createGameBuildersDemoScenario();
