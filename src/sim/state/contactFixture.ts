import { createDefaultInstitutionalRuleState } from "./policy";
import {
  asContactEdgeId,
  asCountryId,
  asGovernmentId,
  asLandHexId,
  asRegionId,
  asScenarioId,
} from "./ids";
import { FOUNDATION_SCENARIO, type ScenarioDefinition } from "./scenario";
import type { ScenarioRegion, TerritorialController } from "./region";
import type { LandHexDefinition } from "./territorialTopology";

export const CONTACT_FIXTURE_COUNTRY_IDS = {
  player: asCountryId("contact.player-country"),
  merchantRepublic: asCountryId("contact.merchant-republic"),
  absoluteMonarchy: asCountryId("contact.absolute-monarchy"),
} as const;

export const CONTACT_FIXTURE_REGION_IDS = {
  capital: asRegionId("contact.capital"),
  port: asRegionId("contact.port"),
  farmland: asRegionId("contact.farmland"),
  mine: asRegionId("contact.mine"),
  border: asRegionId("contact.border"),
  merchantPort: asRegionId("contact.merchant-port"),
  monarchyBorder: asRegionId("contact.monarchy-border"),
} as const;

export const CONTACT_FIXTURE_EDGE_IDS = {
  capitalToFarmland: asContactEdgeId("contact.capital-to-farmland"),
  capitalToMine: asContactEdgeId("contact.capital-to-mine"),
  capitalToPort: asContactEdgeId("contact.capital-to-port"),
  farmlandToCapital: asContactEdgeId("contact.farmland-to-capital"),
  merchantToPortInformation: asContactEdgeId(
    "contact.merchant-to-port-information",
  ),
  merchantToPortTrade: asContactEdgeId("contact.merchant-to-port-trade"),
  borderToMonarchy: asContactEdgeId("contact.border-to-monarchy"),
  monarchyToBorder: asContactEdgeId("contact.monarchy-to-border"),
  mineToCapital: asContactEdgeId("contact.mine-to-capital"),
  portToMerchantMigration: asContactEdgeId(
    "contact.port-to-merchant-migration",
  ),
  portToMerchantTrade: asContactEdgeId("contact.port-to-merchant-trade"),
  portToCapital: asContactEdgeId("contact.port-to-capital"),
} as const;

export const CONTACT_FIXTURE_LAND_HEX_IDS = {
  capitalWest: asLandHexId("contact.landhex.capital-west"),
  capitalEast: asLandHexId("contact.landhex.capital-east"),
  port: asLandHexId("contact.landhex.port"),
  farmland: asLandHexId("contact.landhex.farmland"),
  mine: asLandHexId("contact.landhex.mine"),
  border: asLandHexId("contact.landhex.border"),
  merchantPort: asLandHexId("contact.landhex.merchant-port"),
  merchantQuays: asLandHexId("contact.landhex.merchant-quays"),
  monarchyBorder: asLandHexId("contact.landhex.monarchy-border"),
} as const;

/** Static T017A substrate for the seven-region headless fixture. */
export const CONTACT_FIXTURE_LAND_HEXES = [
  {
    id: CONTACT_FIXTURE_LAND_HEX_IDS.capitalWest,
    regionId: CONTACT_FIXTURE_REGION_IDS.capital,
    coordinate: { q: 0, r: 0 },
    terrain: "plains",
  },
  {
    id: CONTACT_FIXTURE_LAND_HEX_IDS.capitalEast,
    regionId: CONTACT_FIXTURE_REGION_IDS.capital,
    coordinate: { q: 1, r: 0 },
    terrain: "hills",
  },
  {
    id: CONTACT_FIXTURE_LAND_HEX_IDS.port,
    regionId: CONTACT_FIXTURE_REGION_IDS.port,
    coordinate: { q: 0, r: -1 },
    terrain: "coast",
  },
  {
    id: CONTACT_FIXTURE_LAND_HEX_IDS.farmland,
    regionId: CONTACT_FIXTURE_REGION_IDS.farmland,
    coordinate: { q: 1, r: 1 },
    terrain: "plains",
  },
  {
    id: CONTACT_FIXTURE_LAND_HEX_IDS.mine,
    regionId: CONTACT_FIXTURE_REGION_IDS.mine,
    coordinate: { q: 2, r: 0 },
    terrain: "mountains",
  },
  {
    id: CONTACT_FIXTURE_LAND_HEX_IDS.border,
    regionId: CONTACT_FIXTURE_REGION_IDS.border,
    coordinate: { q: -1, r: 1 },
    terrain: "hills",
  },
  {
    id: CONTACT_FIXTURE_LAND_HEX_IDS.merchantPort,
    regionId: CONTACT_FIXTURE_REGION_IDS.merchantPort,
    coordinate: { q: -1, r: 0 },
    terrain: "coast",
  },
  {
    id: CONTACT_FIXTURE_LAND_HEX_IDS.merchantQuays,
    regionId: CONTACT_FIXTURE_REGION_IDS.merchantPort,
    coordinate: { q: -2, r: 0 },
    terrain: "plains",
  },
  {
    id: CONTACT_FIXTURE_LAND_HEX_IDS.monarchyBorder,
    regionId: CONTACT_FIXTURE_REGION_IDS.monarchyBorder,
    coordinate: { q: -2, r: 1 },
    terrain: "hills",
  },
] as const satisfies readonly LandHexDefinition[];

const GOVERNMENT_IDS = {
  player: asGovernmentId("contact.player-government"),
  merchantRepublic: asGovernmentId("contact.merchant-government"),
  absoluteMonarchy: asGovernmentId("contact.monarchy-government"),
} as const;

function createRegion(
  id: ReturnType<typeof asRegionId>,
  name: string,
  ownerCountryId: ReturnType<typeof asCountryId>,
  initialController: TerritorialController,
  population: number,
): ScenarioRegion {
  return {
    id,
    name,
    ownerCountryId,
    initialController,
    population,
    urbanization: 0.5,
    accessibility: 0.7,
    resources: {},
    resourceProductionCapacity: {},
    resourceProduction: {},
    resourceDemand: {},
    production: 0,
    stateControl: 0.8,
    infrastructure: 0.6,
    scarcity: 0,
    unrest: 0,
    ideology: {},
  };
}

/** Small seven-region topology for T014/T015 path and controller tests. */
export function createContactFixtureScenario(): ScenarioDefinition {
  const player = CONTACT_FIXTURE_COUNTRY_IDS.player;
  const merchantRepublic = CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic;
  const absoluteMonarchy = CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy;

  return {
    ...FOUNDATION_SCENARIO,
    id: asScenarioId("contact-fixture"),
    playerCountryId: player,
    initialCountries: [
      {
        id: player,
        name: "플레이어 국가",
        currentGovernmentId: GOVERNMENT_IDS.player,
        treasury: 0,
        dailyIncome: 0,
        dailyExpenditure: 0,
        legitimacy: 50,
        stateCapacity: 50,
        production: 0,
        militaryPower: 50,
        instability: 0,
        stateContinuity: 100,
        capitalRegionId: CONTACT_FIXTURE_REGION_IDS.capital,
        diplomacy: {},
      },
      {
        id: merchantRepublic,
        name: "상인공화국",
        currentGovernmentId: GOVERNMENT_IDS.merchantRepublic,
        treasury: 0,
        dailyIncome: 0,
        dailyExpenditure: 0,
        legitimacy: 50,
        stateCapacity: 50,
        production: 0,
        militaryPower: 50,
        instability: 0,
        stateContinuity: 100,
        capitalRegionId: CONTACT_FIXTURE_REGION_IDS.merchantPort,
        diplomacy: {},
      },
      {
        id: absoluteMonarchy,
        name: "절대왕정",
        currentGovernmentId: GOVERNMENT_IDS.absoluteMonarchy,
        treasury: 0,
        dailyIncome: 0,
        dailyExpenditure: 0,
        legitimacy: 50,
        stateCapacity: 50,
        production: 0,
        militaryPower: 50,
        instability: 0,
        stateContinuity: 100,
        capitalRegionId: CONTACT_FIXTURE_REGION_IDS.monarchyBorder,
        diplomacy: {},
      },
    ],
    initialRegions: [
      createRegion(
        CONTACT_FIXTURE_REGION_IDS.capital,
        "플레이어 수도",
        player,
        { kind: "country", countryId: player },
        200,
      ),
      createRegion(
        CONTACT_FIXTURE_REGION_IDS.port,
        "플레이어 항구",
        player,
        { kind: "country", countryId: player },
        150,
      ),
      createRegion(
        CONTACT_FIXTURE_REGION_IDS.farmland,
        "플레이어 농지",
        player,
        { kind: "country", countryId: player },
        300,
      ),
      createRegion(
        CONTACT_FIXTURE_REGION_IDS.mine,
        "플레이어 광산",
        player,
        { kind: "country", countryId: player },
        100,
      ),
      createRegion(
        CONTACT_FIXTURE_REGION_IDS.border,
        "플레이어 국경",
        player,
        { kind: "country", countryId: player },
        120,
      ),
      createRegion(
        CONTACT_FIXTURE_REGION_IDS.merchantPort,
        "상인공화국 항구",
        merchantRepublic,
        { kind: "country", countryId: merchantRepublic },
        180,
      ),
      createRegion(
        CONTACT_FIXTURE_REGION_IDS.monarchyBorder,
        "절대왕정 국경지대",
        absoluteMonarchy,
        { kind: "country", countryId: absoluteMonarchy },
        140,
      ),
    ],
    initialGovernments: [
      {
        id: GOVERNMENT_IDS.player,
        countryId: player,
        name: "플레이어 정부",
        authority: "central",
        formedAtTick: 0,
      },
      {
        id: GOVERNMENT_IDS.merchantRepublic,
        countryId: merchantRepublic,
        name: "상인공화국 정부",
        authority: "central",
        formedAtTick: 0,
      },
      {
        id: GOVERNMENT_IDS.absoluteMonarchy,
        countryId: absoluteMonarchy,
        name: "절대왕정 정부",
        authority: "central",
        formedAtTick: 0,
      },
    ],
    initialCountryPolicies: {
      [player]: {
        activePolicyIds: [],
        enactedAtTick: {},
        institutionalRules: createDefaultInstitutionalRuleState(),
      },
      [merchantRepublic]: {
        activePolicyIds: [],
        enactedAtTick: {},
        institutionalRules: createDefaultInstitutionalRuleState(),
      },
      [absoluteMonarchy]: {
        activePolicyIds: [],
        enactedAtTick: {},
        institutionalRules: createDefaultInstitutionalRuleState(),
      },
    },
    mapContactTopology: {
      regionIds: Object.values(CONTACT_FIXTURE_REGION_IDS),
      contactEdges: [
        {
          id: CONTACT_FIXTURE_EDGE_IDS.merchantToPortInformation,
          fromRegionId: CONTACT_FIXTURE_REGION_IDS.merchantPort,
          toRegionId: CONTACT_FIXTURE_REGION_IDS.port,
          channel: "information",
          baseStrength: 0.6,
        },
        {
          id: CONTACT_FIXTURE_EDGE_IDS.portToMerchantTrade,
          fromRegionId: CONTACT_FIXTURE_REGION_IDS.port,
          toRegionId: CONTACT_FIXTURE_REGION_IDS.merchantPort,
          channel: "trade",
          baseStrength: 0.8,
        },
        {
          id: CONTACT_FIXTURE_EDGE_IDS.capitalToPort,
          fromRegionId: CONTACT_FIXTURE_REGION_IDS.capital,
          toRegionId: CONTACT_FIXTURE_REGION_IDS.port,
          channel: "border",
          baseStrength: 0.8,
        },
        {
          id: CONTACT_FIXTURE_EDGE_IDS.portToMerchantMigration,
          fromRegionId: CONTACT_FIXTURE_REGION_IDS.port,
          toRegionId: CONTACT_FIXTURE_REGION_IDS.merchantPort,
          channel: "migration",
          baseStrength: 0.3,
        },
        {
          id: CONTACT_FIXTURE_EDGE_IDS.merchantToPortTrade,
          fromRegionId: CONTACT_FIXTURE_REGION_IDS.merchantPort,
          toRegionId: CONTACT_FIXTURE_REGION_IDS.port,
          channel: "trade",
          baseStrength: 0.4,
        },
        {
          id: CONTACT_FIXTURE_EDGE_IDS.portToCapital,
          fromRegionId: CONTACT_FIXTURE_REGION_IDS.port,
          toRegionId: CONTACT_FIXTURE_REGION_IDS.capital,
          channel: "border",
          baseStrength: 0.7,
        },
        {
          id: CONTACT_FIXTURE_EDGE_IDS.capitalToFarmland,
          fromRegionId: CONTACT_FIXTURE_REGION_IDS.capital,
          toRegionId: CONTACT_FIXTURE_REGION_IDS.farmland,
          channel: "border",
          baseStrength: 0.6,
        },
        {
          id: CONTACT_FIXTURE_EDGE_IDS.farmlandToCapital,
          fromRegionId: CONTACT_FIXTURE_REGION_IDS.farmland,
          toRegionId: CONTACT_FIXTURE_REGION_IDS.capital,
          channel: "border",
          baseStrength: 0.6,
        },
        {
          id: CONTACT_FIXTURE_EDGE_IDS.capitalToMine,
          fromRegionId: CONTACT_FIXTURE_REGION_IDS.capital,
          toRegionId: CONTACT_FIXTURE_REGION_IDS.mine,
          channel: "border",
          baseStrength: 0.5,
        },
        {
          id: CONTACT_FIXTURE_EDGE_IDS.mineToCapital,
          fromRegionId: CONTACT_FIXTURE_REGION_IDS.mine,
          toRegionId: CONTACT_FIXTURE_REGION_IDS.capital,
          channel: "border",
          baseStrength: 0.4,
        },
        {
          id: CONTACT_FIXTURE_EDGE_IDS.borderToMonarchy,
          fromRegionId: CONTACT_FIXTURE_REGION_IDS.border,
          toRegionId: CONTACT_FIXTURE_REGION_IDS.monarchyBorder,
          channel: "border",
          baseStrength: 0.9,
        },
        {
          id: CONTACT_FIXTURE_EDGE_IDS.monarchyToBorder,
          fromRegionId: CONTACT_FIXTURE_REGION_IDS.monarchyBorder,
          toRegionId: CONTACT_FIXTURE_REGION_IDS.border,
          channel: "border",
          baseStrength: 0.7,
        },
      ],
    },
    mapTerritorialTopology: {
      landHexes: CONTACT_FIXTURE_LAND_HEXES,
    },
  };
}
