import type { PolicyDefinition } from "./policy";
import { createDefaultInstitutionalRuleState } from "./policy";
import type { ScenarioDefinition } from "./scenario";
import { FOUNDATION_SCENARIO } from "./scenario";
import {
  asCountryId,
  asGovernmentId,
  asLandHexId,
  asPolicyId,
  asRegionId,
  asScenarioId,
  type PolicyId,
} from "./ids";

export const POLICY_FIXTURE_IDS = {
  kingVeto: asPolicyId("fixture.king-veto"),
  abolishRoyalVeto: asPolicyId("fixture.abolish-royal-veto"),
  aristocraticSuffrage: asPolicyId("fixture.aristocratic-suffrage"),
  universalSuffrage: asPolicyId("fixture.universal-suffrage"),
  privateProductiveProperty: asPolicyId("fixture.private-property"),
  nationalizeProductiveProperty: asPolicyId("fixture.nationalize-property"),
} as const;

/** Small declarative catalog used by T012 tests and headless contract checks. */
export const POLICY_FIXTURE_CATALOG = {
  [POLICY_FIXTURE_IDS.kingVeto]: {
    id: POLICY_FIXTURE_IDS.kingVeto,
    name: "왕의 거부권",
    description: "왕이 의회의 법률을 거부할 수 있습니다.",
    domain: "authority",
    ruleMutations: { rulerVeto: true },
  },
  [POLICY_FIXTURE_IDS.abolishRoyalVeto]: {
    id: POLICY_FIXTURE_IDS.abolishRoyalVeto,
    name: "왕의 거부권 폐지",
    description: "왕의 법률 거부권을 폐지하고 의회 입법을 요구합니다.",
    domain: "authority",
    prerequisites: [{ kind: "ruleEquals", rule: "rulerVeto", value: true }],
    ruleMutations: { rulerVeto: false, legislatureRequired: true },
  },
  [POLICY_FIXTURE_IDS.aristocraticSuffrage]: {
    id: POLICY_FIXTURE_IDS.aristocraticSuffrage,
    name: "귀족 선거권",
    description: "귀족에게 제한된 선거권을 부여합니다.",
    domain: "authority",
    ruleMutations: { suffrage: "elite" },
    incompatiblePolicyIds: [POLICY_FIXTURE_IDS.universalSuffrage],
  },
  [POLICY_FIXTURE_IDS.universalSuffrage]: {
    id: POLICY_FIXTURE_IDS.universalSuffrage,
    name: "보통선거",
    description: "모든 성인 시민에게 선거권을 부여합니다.",
    domain: "authority",
    prerequisites: [
      {
        kind: "policyActive",
        policyId: POLICY_FIXTURE_IDS.abolishRoyalVeto,
      },
    ],
    ruleMutations: { suffrage: "universal" },
    incompatiblePolicyIds: [POLICY_FIXTURE_IDS.aristocraticSuffrage],
  },
  [POLICY_FIXTURE_IDS.privateProductiveProperty]: {
    id: POLICY_FIXTURE_IDS.privateProductiveProperty,
    name: "생산수단 사유 허용",
    description: "생산수단의 사적 소유를 허용합니다.",
    domain: "property",
    ruleMutations: { productiveProperty: "privateAllowed" },
    incompatiblePolicyIds: [POLICY_FIXTURE_IDS.nationalizeProductiveProperty],
  },
  [POLICY_FIXTURE_IDS.nationalizeProductiveProperty]: {
    id: POLICY_FIXTURE_IDS.nationalizeProductiveProperty,
    name: "생산수단 국유화",
    description: "생산수단을 공공 소유로 전환합니다.",
    domain: "property",
    prerequisites: [
      {
        kind: "ruleEquals",
        rule: "productiveProperty",
        value: "privateAllowed",
      },
    ],
    ruleMutations: { productiveProperty: "publicOnly" },
    incompatiblePolicyIds: [POLICY_FIXTURE_IDS.privateProductiveProperty],
  },
} as const satisfies Readonly<Record<PolicyId, PolicyDefinition>>;

const POLICY_FIXTURE_COUNTRY_ID = asCountryId("policy-fixture.country");
const POLICY_FIXTURE_GOVERNMENT_ID = asGovernmentId(
  "policy-fixture.government",
);
const POLICY_FIXTURE_CAPITAL_ID = asRegionId("policy-fixture.capital");

/** A small valid ScenarioDefinition containing the T012 catalog. */
export function createPolicyFixtureScenario(): ScenarioDefinition {
  return {
    ...FOUNDATION_SCENARIO,
    id: asScenarioId("policy-fixture"),
    playerCountryId: POLICY_FIXTURE_COUNTRY_ID,
    initialCountries: [
      {
        id: POLICY_FIXTURE_COUNTRY_ID,
        name: "정책 실험국",
        currentGovernmentId: POLICY_FIXTURE_GOVERNMENT_ID,
        treasury: 0,
        dailyIncome: 0,
        dailyExpenditure: 0,
        legitimacy: 50,
        stateCapacity: 50,
        production: 0,
        militaryPower: 50,
        instability: 0,
        stateContinuity: 100,
        capitalRegionId: POLICY_FIXTURE_CAPITAL_ID,
        diplomacy: {},
      },
    ],
    initialRegions: [
      {
        id: POLICY_FIXTURE_CAPITAL_ID,
        name: "정책 실험 수도",
        ownerCountryId: POLICY_FIXTURE_COUNTRY_ID,
        initialController: {
          kind: "country",
          countryId: POLICY_FIXTURE_COUNTRY_ID,
        },
        population: 1,
        urbanization: 0,
        accessibility: 0,
        resources: {},
        resourceProductionCapacity: {},
        resourceProduction: {},
        resourceDemand: {},
        production: 0,
        stateControl: 1,
        infrastructure: 0,
        scarcity: 0,
        unrest: 0,
        ideology: {},
      },
    ],
    initialGovernments: [
      {
        id: POLICY_FIXTURE_GOVERNMENT_ID,
        countryId: POLICY_FIXTURE_COUNTRY_ID,
        name: "정책 실험 정부",
        authority: "central",
        formedAtTick: 0,
      },
    ],
    initialCountryPolicies: {
      [POLICY_FIXTURE_COUNTRY_ID]: {
        activePolicyIds: [],
        enactedAtTick: {},
        institutionalRules: createDefaultInstitutionalRuleState(),
      },
    },
    policyCatalog: POLICY_FIXTURE_CATALOG,
    mapContactTopology: {
      regionIds: [POLICY_FIXTURE_CAPITAL_ID],
      contactEdges: [],
    },
    mapTerritorialTopology: {
      landHexes: [
        {
          id: asLandHexId("policy-fixture.capital-hex"),
          regionId: POLICY_FIXTURE_CAPITAL_ID,
          coordinate: { q: 0, r: 0 },
          terrain: "plains",
        },
      ],
    },
  };
}
