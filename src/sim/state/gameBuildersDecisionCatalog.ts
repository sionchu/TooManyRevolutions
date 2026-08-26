import type {
  ContextualDecisionCatalog,
  ContextualDecisionMetadata,
} from "../readModels/contextualDecisions";
import {
  asInterventionId,
  asPolicyId,
  type FactionId,
  type InterventionId,
  type PolicyId,
  type RegionId,
} from "./ids";
import type { InterventionDefinition } from "./intervention";
import type { PolicyDefinition } from "./policy";

/** Production decision identities for the GameBuilders scenario. */
export const GAMEBUILDERS_PRODUCTION_POLICY_IDS = {
  legislativeOversight: asPolicyId("gamebuilders.policy.legislative-oversight"),
  royalVetoRestoration: asPolicyId(
    "gamebuilders.policy.royal-veto-restoration",
  ),
  limitedSuffrageRestoration: asPolicyId(
    "gamebuilders.policy.limited-suffrage-restoration",
  ),
  propertySuffrage: asPolicyId("gamebuilders.policy.property-suffrage"),
  broadSuffrage: asPolicyId("gamebuilders.policy.broad-suffrage"),
  universalSuffrage: asPolicyId("gamebuilders.policy.universal-suffrage"),
  productivePropertyMixed: asPolicyId(
    "gamebuilders.policy.productive-property-mixed",
  ),
  publicProductiveProperty: asPolicyId(
    "gamebuilders.policy.public-productive-property",
  ),
  privateProductiveProperty: asPolicyId(
    "gamebuilders.policy.private-productive-property",
  ),
  privateLandOwnership: asPolicyId(
    "gamebuilders.policy.private-land-ownership",
  ),
  communalLandOwnership: asPolicyId(
    "gamebuilders.policy.communal-land-ownership",
  ),
  stateLandAdministration: asPolicyId(
    "gamebuilders.policy.state-land-administration",
  ),
  laborOrganizationOpening: asPolicyId(
    "gamebuilders.policy.labor-organization-opening",
  ),
  laborOrganizationSupervisedOpening: asPolicyId(
    "gamebuilders.policy.labor-organization-supervised-opening",
  ),
  laborOrganizationRestriction: asPolicyId(
    "gamebuilders.policy.labor-organization-restriction",
  ),
  laborOrganizationBan: asPolicyId(
    "gamebuilders.policy.labor-organization-ban",
  ),
  pressFreedomOpening: asPolicyId("gamebuilders.policy.press-freedom-opening"),
  pressRestrictionRestoration: asPolicyId(
    "gamebuilders.policy.press-restriction-restoration",
  ),
  pressCensorshipRollback: asPolicyId(
    "gamebuilders.policy.press-censorship-rollback",
  ),
  pressCensorship: asPolicyId("gamebuilders.policy.press-censorship"),
  oppositionPluralism: asPolicyId("gamebuilders.policy.opposition-pluralism"),
  oppositionRestriction: asPolicyId(
    "gamebuilders.policy.opposition-restriction",
  ),
  oppositionRestrictionRestoration: asPolicyId(
    "gamebuilders.policy.opposition-restriction-restoration",
  ),
  oppositionBan: asPolicyId("gamebuilders.policy.opposition-ban"),
} as const;

export const GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS = {
  emergencyFoodDistribution: asInterventionId(
    "gamebuilders.intervention.emergency-food-distribution",
  ),
  capitalGranaryExpansion: asInterventionId(
    "gamebuilders.intervention.capital-granary-expansion",
  ),
  industrialMaterialAllocation: asInterventionId(
    "gamebuilders.intervention.industrial-material-allocation",
  ),
  politicalAccommodation: asInterventionId(
    "gamebuilders.intervention.political-accommodation",
  ),
  oppositionLegalization: asInterventionId(
    "gamebuilders.intervention.opposition-legalization",
  ),
  laborOrganizationOpening: asInterventionId(
    "gamebuilders.intervention.labor-organization-opening",
  ),
  laborOrganizationRestriction: asInterventionId(
    "gamebuilders.intervention.labor-organization-restriction",
  ),
  coercivePoliticalRestriction: asInterventionId(
    "gamebuilders.intervention.coercive-political-restriction",
  ),
} as const;

const POLICY_IDS = GAMEBUILDERS_PRODUCTION_POLICY_IDS;

/**
 * Production policy content. It is intentionally a separate catalog from the
 * T012 policy fixture and records only the institutional rule mutations that
 * the current simulation can authoritatively write.
 */
export const GAMEBUILDERS_PRODUCTION_POLICY_CATALOG = {
  [POLICY_IDS.legislativeOversight]: {
    id: POLICY_IDS.legislativeOversight,
    name: "의회 입법 심사",
    description:
      "왕실 거부권을 폐지하고 의회 심사를 입법의 필수 절차로 둡니다.",
    domain: "authority",
    prerequisites: [{ kind: "ruleEquals", rule: "rulerVeto", value: true }],
    ruleMutations: { rulerVeto: false, legislatureRequired: true },
  },
  [POLICY_IDS.royalVetoRestoration]: {
    id: POLICY_IDS.royalVetoRestoration,
    name: "왕실 거부권 복원",
    description: "왕실이 의회 입법을 다시 거부할 수 있도록 권한을 복원합니다.",
    domain: "authority",
    prerequisites: [{ kind: "ruleEquals", rule: "rulerVeto", value: false }],
    ruleMutations: { rulerVeto: true, legislatureRequired: false },
  },
  [POLICY_IDS.limitedSuffrageRestoration]: {
    id: POLICY_IDS.limitedSuffrageRestoration,
    name: "제한 선거권 복원",
    description:
      "대표 참여가 금지된 상태에서 제한된 시민층의 선거권을 복원합니다.",
    domain: "authority",
    prerequisites: [{ kind: "ruleEquals", rule: "suffrage", value: "none" }],
    ruleMutations: { suffrage: "elite" },
  },
  [POLICY_IDS.propertySuffrage]: {
    id: POLICY_IDS.propertySuffrage,
    name: "재산 기준 선거권",
    description:
      "일정한 재산 기준을 충족한 시민에게 제한된 선거권을 부여합니다.",
    domain: "authority",
    prerequisites: [{ kind: "ruleEquals", rule: "suffrage", value: "elite" }],
    ruleMutations: { suffrage: "property" },
  },
  [POLICY_IDS.broadSuffrage]: {
    id: POLICY_IDS.broadSuffrage,
    name: "확대 선거권",
    description: "재산 기준을 완화해 더 넓은 시민층의 대표 참여를 허용합니다.",
    domain: "authority",
    prerequisites: [
      { kind: "ruleEquals", rule: "suffrage", value: "property" },
      {
        kind: "policyActive",
        policyId: POLICY_IDS.propertySuffrage,
      },
    ],
    ruleMutations: { suffrage: "broad" },
  },
  [POLICY_IDS.universalSuffrage]: {
    id: POLICY_IDS.universalSuffrage,
    name: "보편 선거권",
    description: "성인 시민 전체의 대표 참여를 제도적으로 허용합니다.",
    domain: "authority",
    prerequisites: [
      { kind: "ruleEquals", rule: "suffrage", value: "broad" },
      {
        kind: "policyActive",
        policyId: POLICY_IDS.broadSuffrage,
      },
    ],
    ruleMutations: { suffrage: "universal" },
  },
  [POLICY_IDS.productivePropertyMixed]: {
    id: POLICY_IDS.productivePropertyMixed,
    name: "생산수단 혼합 소유",
    description:
      "사적 소유를 유지하면서 공공 소유가 공존할 수 있도록 허용합니다.",
    domain: "property",
    prerequisites: [
      {
        kind: "ruleEquals",
        rule: "productiveProperty",
        value: "privateAllowed",
      },
    ],
    ruleMutations: { productiveProperty: "mixed" },
  },
  [POLICY_IDS.publicProductiveProperty]: {
    id: POLICY_IDS.publicProductiveProperty,
    name: "생산수단 공공 소유",
    description: "주요 생산수단을 공공 소유 체계로 전환합니다.",
    domain: "property",
    prerequisites: [
      { kind: "ruleEquals", rule: "productiveProperty", value: "mixed" },
    ],
    ruleMutations: { productiveProperty: "publicOnly" },
  },
  [POLICY_IDS.privateProductiveProperty]: {
    id: POLICY_IDS.privateProductiveProperty,
    name: "생산수단 사적 소유 복원",
    description:
      "공공 중심의 생산수단 소유를 사적 소유가 가능한 체계로 되돌립니다.",
    domain: "property",
    prerequisites: [
      {
        kind: "ruleNotEquals",
        rule: "productiveProperty",
        value: "privateAllowed",
      },
    ],
    ruleMutations: { productiveProperty: "privateAllowed" },
  },
  [POLICY_IDS.privateLandOwnership]: {
    id: POLICY_IDS.privateLandOwnership,
    name: "사적 토지 소유",
    description: "봉건적 토지 보유를 사적 토지 소유권으로 전환합니다.",
    domain: "property",
    prerequisites: [
      { kind: "ruleEquals", rule: "landOwnership", value: "feudal" },
    ],
    ruleMutations: { landOwnership: "private" },
  },
  [POLICY_IDS.communalLandOwnership]: {
    id: POLICY_IDS.communalLandOwnership,
    name: "공동 토지 관리",
    description: "사적 토지 소유를 공동 관리 체계로 조정합니다.",
    domain: "property",
    prerequisites: [
      { kind: "ruleEquals", rule: "landOwnership", value: "private" },
    ],
    ruleMutations: { landOwnership: "communal" },
  },
  [POLICY_IDS.stateLandAdministration]: {
    id: POLICY_IDS.stateLandAdministration,
    name: "국가 토지 행정",
    description: "토지의 관리 책임을 국가 행정 체계로 이관합니다.",
    domain: "property",
    prerequisites: [
      { kind: "ruleEquals", rule: "landOwnership", value: "communal" },
    ],
    ruleMutations: { landOwnership: "state" },
  },
  [POLICY_IDS.laborOrganizationOpening]: {
    id: POLICY_IDS.laborOrganizationOpening,
    name: "노동 조직 합법화",
    description: "노동 조직의 합법적 결성과 공개 활동을 허용합니다.",
    domain: "labor",
    prerequisites: [
      {
        kind: "ruleEquals",
        rule: "laborOrganization",
        value: "restricted",
      },
    ],
    ruleMutations: { laborOrganization: "legal" },
  },
  [POLICY_IDS.laborOrganizationSupervisedOpening]: {
    id: POLICY_IDS.laborOrganizationSupervisedOpening,
    name: "노동 조직 제한 허가",
    description:
      "금지된 노동 조직에 허가된 제한적 공개 활동 공간을 부여합니다.",
    domain: "labor",
    prerequisites: [
      { kind: "ruleEquals", rule: "laborOrganization", value: "illegal" },
    ],
    ruleMutations: { laborOrganization: "restricted" },
  },
  [POLICY_IDS.laborOrganizationRestriction]: {
    id: POLICY_IDS.laborOrganizationRestriction,
    name: "노동 조직 감독",
    description: "합법 노동 조직의 활동을 허가와 감독 아래로 제한합니다.",
    domain: "labor",
    prerequisites: [
      { kind: "ruleEquals", rule: "laborOrganization", value: "legal" },
    ],
    ruleMutations: { laborOrganization: "restricted" },
  },
  [POLICY_IDS.laborOrganizationBan]: {
    id: POLICY_IDS.laborOrganizationBan,
    name: "노동 조직 금지",
    description: "노동 조직의 공개 결성과 활동을 금지합니다.",
    domain: "labor",
    prerequisites: [
      {
        kind: "ruleNotEquals",
        rule: "laborOrganization",
        value: "illegal",
      },
    ],
    ruleMutations: { laborOrganization: "illegal" },
  },
  [POLICY_IDS.pressFreedomOpening]: {
    id: POLICY_IDS.pressFreedomOpening,
    name: "언론 자유 확대",
    description: "제한된 언론 환경에서 독립적인 보도와 공개 비판을 허용합니다.",
    domain: "information",
    prerequisites: [
      { kind: "ruleEquals", rule: "pressFreedom", value: "restricted" },
    ],
    ruleMutations: { pressFreedom: "free" },
  },
  [POLICY_IDS.pressRestrictionRestoration]: {
    id: POLICY_IDS.pressRestrictionRestoration,
    name: "언론 감독 복원",
    description: "자유 언론의 활동을 제한된 허가 체계로 되돌립니다.",
    domain: "information",
    prerequisites: [
      { kind: "ruleEquals", rule: "pressFreedom", value: "free" },
    ],
    ruleMutations: { pressFreedom: "restricted" },
  },
  [POLICY_IDS.pressCensorshipRollback]: {
    id: POLICY_IDS.pressCensorshipRollback,
    name: "검열 완화",
    description: "전면 검열을 제한된 언론 감독 체계로 완화합니다.",
    domain: "information",
    prerequisites: [
      { kind: "ruleEquals", rule: "pressFreedom", value: "censored" },
    ],
    ruleMutations: { pressFreedom: "restricted" },
  },
  [POLICY_IDS.pressCensorship]: {
    id: POLICY_IDS.pressCensorship,
    name: "언론 검열",
    description: "언론의 공개 비판과 조직 확산을 국가 검열 아래 둡니다.",
    domain: "information",
    prerequisites: [
      {
        kind: "ruleNotEquals",
        rule: "pressFreedom",
        value: "censored",
      },
    ],
    ruleMutations: { pressFreedom: "censored" },
  },
  [POLICY_IDS.oppositionPluralism]: {
    id: POLICY_IDS.oppositionPluralism,
    name: "독립 정치 경쟁 허용",
    description:
      "독립 정치 조직이 공개적으로 권력 경쟁에 참여할 수 있도록 허용합니다.",
    domain: "authority",
    prerequisites: [
      {
        kind: "ruleEquals",
        rule: "politicalCompetition",
        value: "restricted",
      },
    ],
    ruleMutations: { politicalCompetition: "plural" },
  },
  [POLICY_IDS.oppositionRestriction]: {
    id: POLICY_IDS.oppositionRestriction,
    name: "정치 경쟁 제한",
    description: "독립 정치 조직의 경쟁을 제한된 허가 범위로 되돌립니다.",
    domain: "authority",
    prerequisites: [
      {
        kind: "ruleEquals",
        rule: "politicalCompetition",
        value: "plural",
      },
    ],
    ruleMutations: { politicalCompetition: "restricted" },
  },
  [POLICY_IDS.oppositionRestrictionRestoration]: {
    id: POLICY_IDS.oppositionRestrictionRestoration,
    name: "정치 경쟁 제한 복원",
    description: "금지된 독립 정치 경쟁을 제한된 허가 범위로 되돌립니다.",
    domain: "authority",
    prerequisites: [
      { kind: "ruleEquals", rule: "politicalCompetition", value: "banned" },
    ],
    ruleMutations: { politicalCompetition: "restricted" },
  },
  [POLICY_IDS.oppositionBan]: {
    id: POLICY_IDS.oppositionBan,
    name: "정치 경쟁 금지",
    description: "독립 정치 조직의 공개적인 권력 경쟁을 금지합니다.",
    domain: "authority",
    prerequisites: [
      {
        kind: "ruleNotEquals",
        rule: "politicalCompetition",
        value: "banned",
      },
    ],
    ruleMutations: { politicalCompetition: "banned" },
  },
} as const satisfies Readonly<Record<PolicyId, PolicyDefinition>>;

/**
 * Production interventions use the existing administrative completion seam.
 * Target identities are passed by the scenario so the definitions remain
 * valid against the actual GameBuilders regions and faction.
 */
export function createGameBuildersProductionInterventionCatalog(input: {
  readonly capitalRegionId: RegionId;
  readonly industrialRegionId: RegionId;
  readonly laborFactionId: FactionId;
}): Readonly<Record<InterventionId, InterventionDefinition>> {
  const ids = GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS;
  return {
    [ids.emergencyFoodDistribution]: {
      id: ids.emergencyFoodDistribution,
      name: "철산 공업주 식량 생산능력 보강",
      category: "administrative",
      treasuryCost: 90,
      administrativeLoad: 35,
      durationDays: 1,
      requireCompletionEffectChange: true,
      completionEffects: [
        {
          kind: "regionResourceProductionCapacityDelta",
          regionId: input.industrialRegionId,
          resourceType: "food",
          delta: 6,
        },
      ],
    },
    [ids.capitalGranaryExpansion]: {
      id: ids.capitalGranaryExpansion,
      name: "왕도권 곡물 생산능력 보강",
      category: "administrative",
      treasuryCost: 65,
      administrativeLoad: 25,
      durationDays: 3,
      requireCompletionEffectChange: true,
      completionEffects: [
        {
          kind: "regionResourceProductionCapacityDelta",
          regionId: input.capitalRegionId,
          resourceType: "food",
          delta: 4,
        },
      ],
    },
    [ids.industrialMaterialAllocation]: {
      id: ids.industrialMaterialAllocation,
      name: "철산 공업재 생산능력 보강",
      category: "administrative",
      treasuryCost: 80,
      administrativeLoad: 30,
      durationDays: 4,
      requireCompletionEffectChange: true,
      completionEffects: [
        {
          kind: "regionResourceProductionCapacityDelta",
          regionId: input.industrialRegionId,
          resourceType: "material",
          delta: 4,
        },
      ],
    },
    [ids.politicalAccommodation]: {
      id: ids.politicalAccommodation,
      name: "노동자회 제한적 정치 타협",
      category: "administrative",
      treasuryCost: 70,
      administrativeLoad: 35,
      durationDays: 7,
      prerequisites: [
        { kind: "ruleEquals", rule: "legislatureRequired", value: true },
      ],
      requireCompletionEffectChange: true,
      completionEffects: [
        {
          kind: "factionGrievanceDelta",
          factionId: input.laborFactionId,
          delta: -0.25,
        },
      ],
    },
    [ids.oppositionLegalization]: {
      id: ids.oppositionLegalization,
      name: "독립 야권 합법화",
      category: "administrative",
      treasuryCost: 100,
      administrativeLoad: 40,
      durationDays: 12,
      prerequisites: [
        {
          kind: "ruleNotEquals",
          rule: "politicalCompetition",
          value: "plural",
        },
      ],
      requireCompletionEffectChange: true,
      completionEffects: [
        {
          kind: "institutionalRuleSet",
          rule: "politicalCompetition",
          value: "plural",
        },
        {
          kind: "factionGrievanceDelta",
          factionId: input.laborFactionId,
          delta: -0.1,
        },
      ],
    },
    [ids.laborOrganizationOpening]: {
      id: ids.laborOrganizationOpening,
      name: "노동 조직 공개 활동 허가",
      category: "administrative",
      treasuryCost: 85,
      administrativeLoad: 32,
      durationDays: 10,
      prerequisites: [
        {
          kind: "ruleNotEquals",
          rule: "laborOrganization",
          value: "legal",
        },
      ],
      requireCompletionEffectChange: true,
      completionEffects: [
        {
          kind: "institutionalRuleSet",
          rule: "laborOrganization",
          value: "legal",
        },
        {
          kind: "factionGrievanceDelta",
          factionId: input.laborFactionId,
          delta: -0.12,
        },
      ],
    },
    [ids.laborOrganizationRestriction]: {
      id: ids.laborOrganizationRestriction,
      name: "노동 조직 감독 복원",
      category: "administrative",
      treasuryCost: 60,
      administrativeLoad: 25,
      durationDays: 5,
      prerequisites: [
        {
          kind: "ruleEquals",
          rule: "laborOrganization",
          value: "legal",
        },
      ],
      requireCompletionEffectChange: true,
      completionEffects: [
        {
          kind: "institutionalRuleSet",
          rule: "laborOrganization",
          value: "restricted",
        },
        {
          kind: "factionOrganizationDelta",
          factionId: input.laborFactionId,
          delta: -0.08,
        },
        {
          kind: "factionGrievanceDelta",
          factionId: input.laborFactionId,
          delta: 0.06,
        },
      ],
    },
    [ids.coercivePoliticalRestriction]: {
      id: ids.coercivePoliticalRestriction,
      name: "야권·언론 활동 제한",
      category: "administrative",
      treasuryCost: 75,
      administrativeLoad: 45,
      durationDays: 5,
      prerequisites: [
        {
          kind: "ruleNotEquals",
          rule: "pressFreedom",
          value: "censored",
        },
      ],
      requireCompletionEffectChange: true,
      completionEffects: [
        {
          kind: "institutionalRuleSet",
          rule: "pressFreedom",
          value: "censored",
        },
        {
          kind: "institutionalRuleSet",
          rule: "politicalCompetition",
          value: "banned",
        },
        {
          kind: "factionOrganizationDelta",
          factionId: input.laborFactionId,
          delta: -0.12,
        },
        {
          kind: "factionGrievanceDelta",
          factionId: input.laborFactionId,
          delta: 0.1,
        },
      ],
    },
  } as const satisfies Readonly<Record<InterventionId, InterventionDefinition>>;
}

const POLICY_METADATA = {
  [POLICY_IDS.legislativeOversight]: {
    priority: 58,
    channels: ["authority"],
    backgroundEligible: true,
  },
  [POLICY_IDS.royalVetoRestoration]: {
    priority: 22,
    channels: ["authority", "coercive"],
    backgroundEligible: true,
  },
  [POLICY_IDS.limitedSuffrageRestoration]: {
    priority: 24,
    channels: ["authority", "representation"],
    backgroundEligible: true,
  },
  [POLICY_IDS.propertySuffrage]: {
    priority: 52,
    channels: ["representation"],
    backgroundEligible: true,
  },
  [POLICY_IDS.broadSuffrage]: {
    priority: 49,
    channels: ["representation"],
    backgroundEligible: true,
  },
  [POLICY_IDS.universalSuffrage]: {
    priority: 46,
    channels: ["representation"],
    backgroundEligible: true,
  },
  [POLICY_IDS.productivePropertyMixed]: {
    priority: 44,
    channels: ["property", "material"],
    backgroundEligible: true,
  },
  [POLICY_IDS.publicProductiveProperty]: {
    priority: 36,
    channels: ["property", "material"],
    backgroundEligible: true,
  },
  [POLICY_IDS.privateProductiveProperty]: {
    priority: 28,
    channels: ["property", "material"],
    backgroundEligible: true,
  },
  [POLICY_IDS.privateLandOwnership]: {
    priority: 42,
    channels: ["land", "material"],
    backgroundEligible: true,
  },
  [POLICY_IDS.communalLandOwnership]: {
    priority: 34,
    channels: ["land", "material"],
    backgroundEligible: true,
  },
  [POLICY_IDS.stateLandAdministration]: {
    priority: 26,
    channels: ["land", "material"],
    backgroundEligible: true,
  },
  [POLICY_IDS.laborOrganizationOpening]: {
    priority: 55,
    channels: ["labor", "representation", "recovery"],
    backgroundEligible: true,
  },
  [POLICY_IDS.laborOrganizationSupervisedOpening]: {
    priority: 86,
    channels: ["labor", "recovery"],
    backgroundEligible: true,
  },
  [POLICY_IDS.laborOrganizationRestriction]: {
    priority: 31,
    channels: ["labor", "coercive"],
    backgroundEligible: true,
  },
  [POLICY_IDS.laborOrganizationBan]: {
    priority: 24,
    channels: ["labor", "coercive"],
    backgroundEligible: true,
  },
  [POLICY_IDS.pressFreedomOpening]: {
    priority: 53,
    channels: ["opposition", "representation", "recovery"],
    backgroundEligible: true,
  },
  [POLICY_IDS.pressRestrictionRestoration]: {
    priority: 29,
    channels: ["opposition", "coercive"],
    backgroundEligible: true,
  },
  [POLICY_IDS.pressCensorshipRollback]: {
    priority: 84,
    channels: ["opposition", "recovery"],
    backgroundEligible: true,
  },
  [POLICY_IDS.pressCensorship]: {
    priority: 20,
    channels: ["opposition", "coercive"],
    backgroundEligible: true,
  },
  [POLICY_IDS.oppositionPluralism]: {
    priority: 57,
    channels: ["opposition", "representation", "recovery"],
    backgroundEligible: true,
  },
  [POLICY_IDS.oppositionRestriction]: {
    priority: 30,
    channels: ["opposition", "coercive"],
    backgroundEligible: true,
  },
  [POLICY_IDS.oppositionRestrictionRestoration]: {
    priority: 82,
    channels: ["opposition", "recovery"],
    backgroundEligible: true,
  },
  [POLICY_IDS.oppositionBan]: {
    priority: 18,
    channels: ["opposition", "coercive"],
    backgroundEligible: true,
  },
} as const satisfies Readonly<Record<PolicyId, ContextualDecisionMetadata>>;

const INTERVENTION_METADATA = {
  [GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS.emergencyFoodDistribution]: {
    priority: 100,
    channels: ["material", "recovery"],
  },
  [GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS.capitalGranaryExpansion]: {
    priority: 90,
    channels: ["material", "recovery"],
  },
  [GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS.industrialMaterialAllocation]: {
    priority: 80,
    channels: ["material", "recovery"],
  },
  [GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS.politicalAccommodation]: {
    priority: 72,
    channels: ["opposition", "representation", "recovery"],
  },
  [GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS.oppositionLegalization]: {
    priority: 70,
    channels: ["opposition", "representation", "recovery"],
  },
  [GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS.laborOrganizationOpening]: {
    priority: 68,
    channels: ["labor", "representation", "recovery"],
  },
  [GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS.laborOrganizationRestriction]: {
    priority: 40,
    channels: ["labor", "coercive"],
  },
  [GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS.coercivePoliticalRestriction]: {
    priority: 35,
    channels: ["coercive", "opposition"],
  },
} as const satisfies Readonly<
  Record<InterventionId, ContextualDecisionMetadata>
>;

/** Context metadata is separate from definitions so chooser policy is visible and reviewable. */
export const GAMEBUILDERS_PRODUCTION_CONTEXTUAL_CATALOG: ContextualDecisionCatalog =
  {
    policies: POLICY_METADATA,
    interventions: INTERVENTION_METADATA,
  };
