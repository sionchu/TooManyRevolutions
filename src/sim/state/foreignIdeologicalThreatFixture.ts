import { createSimDate } from "../core/clock";
import { asContactEdgeId, asFactionId, asIdeologyId } from "./ids";
import {
  CONTACT_FIXTURE_COUNTRY_IDS,
  CONTACT_FIXTURE_REGION_IDS,
  createContactFixtureScenario,
} from "./contactFixture";
import type { IdeologyState } from "./ideology";
import type { ScenarioDefinition } from "./scenario";
import { createInitialWorldState, type WorldState } from "./world";

export const T020_IDEOLOGY_IDS = {
  republicanism: asIdeologyId("t020.republicanism"),
  monarchism: asIdeologyId("t020.monarchism"),
} as const;

export const T020_FACTION_IDS = {
  playerRepublicans: asFactionId("t020.player-republican-faction"),
  monarchyRepublicans: asFactionId("t020.monarchy-republican-faction"),
} as const;

export const T020_EDGE_IDS = {
  merchantToPortBorder: asContactEdgeId("t020.merchant-to-port-border"),
  portToMerchantBorder: asContactEdgeId("t020.port-to-merchant-border"),
  merchantToMonarchyBorder: asContactEdgeId("t020.merchant-to-monarchy-border"),
  monarchyToMerchantBorder: asContactEdgeId("t020.monarchy-to-merchant-border"),
} as const;

function ideologyState(
  support: number,
  radicalism: number,
  organization: number,
): IdeologyState {
  return { support, radicalism, organization };
}

function ideologyForRegion(
  regionId: string,
): Readonly<Record<string, IdeologyState>> {
  const isMerchantPort = regionId === CONTACT_FIXTURE_REGION_IDS.merchantPort;
  const isPlayerPort = regionId === CONTACT_FIXTURE_REGION_IDS.port;
  const isPlayerBorder = regionId === CONTACT_FIXTURE_REGION_IDS.border;
  const isMonarchyBorder =
    regionId === CONTACT_FIXTURE_REGION_IDS.monarchyBorder;

  return {
    [T020_IDEOLOGY_IDS.republicanism]: ideologyState(
      isMerchantPort ? 0.9 : isMonarchyBorder ? 0.02 : 0.05,
      isPlayerPort || isMonarchyBorder ? 0.8 : 0.05,
      isPlayerPort || isMonarchyBorder ? 0.8 : 0.05,
    ),
    [T020_IDEOLOGY_IDS.monarchism]: ideologyState(
      isMonarchyBorder ? 0.9 : isPlayerBorder ? 0.04 : 0.05,
      isPlayerBorder ? 0.75 : 0.05,
      isPlayerBorder ? 0.75 : 0.05,
    ),
  };
}

/** Diagnostic-only T020 topology; it does not add production gameplay content. */
export function createT020ForeignIdeologicalThreatScenario(): ScenarioDefinition {
  const base = createContactFixtureScenario();
  const player = CONTACT_FIXTURE_COUNTRY_IDS.player;
  const absoluteMonarchy = CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy;

  return {
    ...base,
    initialDate: createSimDate(1, 1, 1),
    initialRegions: base.initialRegions.map((region) => ({
      ...region,
      ideology: ideologyForRegion(region.id),
    })),
    initialFactions: [
      {
        id: T020_FACTION_IDS.playerRepublicans,
        name: "항구 공화파",
        countryId: player,
        interests: ["trade", "authority"],
        resources: 0.6,
        organization: 0.8,
        influence: 0.5,
        grievance: 0.8,
        ideologyAffinity: { [T020_IDEOLOGY_IDS.republicanism]: 0.95 },
        foreignLinks: {},
        currentStrategy: "wait",
      },
      {
        id: T020_FACTION_IDS.monarchyRepublicans,
        name: "왕정의 공화파",
        countryId: absoluteMonarchy,
        interests: ["authority", "trade"],
        resources: 0.6,
        organization: 0.8,
        influence: 0.5,
        grievance: 0.8,
        ideologyAffinity: { [T020_IDEOLOGY_IDS.republicanism]: 0.95 },
        foreignLinks: {},
        currentStrategy: "wait",
      },
    ],
    ideologyCatalog: {
      [T020_IDEOLOGY_IDS.republicanism]: {
        id: T020_IDEOLOGY_IDS.republicanism,
        name: "공화주의",
        category: "regime",
      },
      [T020_IDEOLOGY_IDS.monarchism]: {
        id: T020_IDEOLOGY_IDS.monarchism,
        name: "왕정주의",
        category: "regime",
      },
    },
    mapContactTopology: {
      ...base.mapContactTopology,
      contactEdges: [
        ...base.mapContactTopology.contactEdges,
        {
          id: T020_EDGE_IDS.merchantToPortBorder,
          fromRegionId: CONTACT_FIXTURE_REGION_IDS.merchantPort,
          toRegionId: CONTACT_FIXTURE_REGION_IDS.port,
          channel: "border",
          baseStrength: 0.7,
        },
        {
          id: T020_EDGE_IDS.portToMerchantBorder,
          fromRegionId: CONTACT_FIXTURE_REGION_IDS.port,
          toRegionId: CONTACT_FIXTURE_REGION_IDS.merchantPort,
          channel: "border",
          baseStrength: 0.65,
        },
        {
          id: T020_EDGE_IDS.merchantToMonarchyBorder,
          fromRegionId: CONTACT_FIXTURE_REGION_IDS.merchantPort,
          toRegionId: CONTACT_FIXTURE_REGION_IDS.monarchyBorder,
          channel: "border",
          baseStrength: 0.65,
        },
        {
          id: T020_EDGE_IDS.monarchyToMerchantBorder,
          fromRegionId: CONTACT_FIXTURE_REGION_IDS.monarchyBorder,
          toRegionId: CONTACT_FIXTURE_REGION_IDS.merchantPort,
          channel: "border",
          baseStrength: 0.4,
        },
      ],
    },
  };
}

export function createT020ForeignIdeologicalThreatWorld(
  scenario = createT020ForeignIdeologicalThreatScenario(),
  seed = 20260822,
): WorldState {
  return createInitialWorldState(scenario, seed);
}
