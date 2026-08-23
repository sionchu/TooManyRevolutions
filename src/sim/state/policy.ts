import type { PolicyId } from "./ids";

export type PolicyDomain =
  | "authority"
  | "property"
  | "labor"
  | "information"
  | "taxation"
  | "localGovernment";

export type Suffrage = "none" | "elite" | "property" | "broad" | "universal";
export type ProductiveProperty = "privateAllowed" | "mixed" | "publicOnly";
export type LandOwnership = "feudal" | "private" | "communal" | "state";
export type LaborOrganization = "illegal" | "restricted" | "legal";
export type PressFreedom = "censored" | "restricted" | "free";

/** The single resolved institutional state used by future systems. */
export interface InstitutionalRuleState {
  readonly rulerVeto: boolean;
  readonly legislatureRequired: boolean;
  readonly suffrage: Suffrage;
  readonly productiveProperty: ProductiveProperty;
  readonly landOwnership: LandOwnership;
  readonly laborOrganization: LaborOrganization;
  readonly pressFreedom: PressFreedom;
}

/** Stable key order for validation, mutation, and event emission. */
export const INSTITUTIONAL_RULE_KEYS = [
  "rulerVeto",
  "legislatureRequired",
  "suffrage",
  "productiveProperty",
  "landOwnership",
  "laborOrganization",
  "pressFreedom",
] as const satisfies readonly (keyof InstitutionalRuleState)[];

export type InstitutionalRuleKey = (typeof INSTITUTIONAL_RULE_KEYS)[number];
export type InstitutionalRuleMutation = Partial<InstitutionalRuleState>;

/** Short name retained for callers that describe definition mutations as rules. */
export type PolicyRuleSet = InstitutionalRuleMutation;

type InstitutionalRulePrerequisite = {
  [Key in InstitutionalRuleKey]: {
    readonly kind: "ruleEquals";
    readonly rule: Key;
    readonly value: InstitutionalRuleState[Key];
  };
}[InstitutionalRuleKey];

export type PolicyPrerequisite =
  | { readonly kind: "policyActive"; readonly policyId: PolicyId }
  | { readonly kind: "policyInactive"; readonly policyId: PolicyId }
  | InstitutionalRulePrerequisite;

/** Static, serializable policy input owned by ScenarioDefinition. */
export interface PolicyDefinition {
  readonly id: PolicyId;
  readonly name: string;
  readonly description: string;
  readonly domain: PolicyDomain;
  readonly ruleMutations: InstitutionalRuleMutation;
  readonly prerequisites?: readonly PolicyPrerequisite[];
  readonly incompatiblePolicyIds?: readonly PolicyId[];
}

/** Existing callers may use the shorter historical name. */
export type Policy = PolicyDefinition;

/** Mutable policy and institutional state for one country in one run. */
export interface PolicyState {
  readonly activePolicyIds: readonly PolicyId[];
  readonly enactedAtTick: Readonly<Record<PolicyId, number>>;
  readonly institutionalRules: InstitutionalRuleState;
}

/** Baseline used by small fixtures; scenarios remain free to choose their own rules. */
export function createDefaultInstitutionalRuleState(): InstitutionalRuleState {
  return {
    rulerVeto: true,
    legislatureRequired: false,
    suffrage: "elite",
    productiveProperty: "privateAllowed",
    landOwnership: "feudal",
    laborOrganization: "restricted",
    pressFreedom: "restricted",
  };
}
