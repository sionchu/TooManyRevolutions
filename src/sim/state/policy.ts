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
export const POLITICAL_COMPETITIONS = [
  "banned",
  "restricted",
  "plural",
] as const;
export type PoliticalCompetition = (typeof POLITICAL_COMPETITIONS)[number];

/** The single resolved institutional state used by future systems. */
export interface InstitutionalRuleState {
  readonly rulerVeto: boolean;
  readonly legislatureRequired: boolean;
  readonly suffrage: Suffrage;
  readonly productiveProperty: ProductiveProperty;
  readonly landOwnership: LandOwnership;
  readonly laborOrganization: LaborOrganization;
  readonly pressFreedom: PressFreedom;
  /** Legal scope for independent political organizations to contest authority. */
  readonly politicalCompetition: PoliticalCompetition;
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
  "politicalCompetition",
] as const satisfies readonly (keyof InstitutionalRuleState)[];

export type InstitutionalRuleKey = (typeof INSTITUTIONAL_RULE_KEYS)[number];
export type InstitutionalRuleMutation = Partial<InstitutionalRuleState>;

/** Runtime validator shared by authored catalogs and persistence boundaries. */
export function isInstitutionalRuleValue(
  rule: InstitutionalRuleKey,
  value: unknown,
): boolean {
  switch (rule) {
    case "rulerVeto":
    case "legislatureRequired":
      return typeof value === "boolean";
    case "suffrage":
      return ["none", "elite", "property", "broad", "universal"].includes(
        value as string,
      );
    case "productiveProperty":
      return ["privateAllowed", "mixed", "publicOnly"].includes(
        value as string,
      );
    case "landOwnership":
      return ["feudal", "private", "communal", "state"].includes(
        value as string,
      );
    case "laborOrganization":
      return ["illegal", "restricted", "legal"].includes(value as string);
    case "pressFreedom":
      return ["censored", "restricted", "free"].includes(value as string);
    case "politicalCompetition":
      return POLITICAL_COMPETITIONS.includes(value as PoliticalCompetition);
  }
}

/** Short name retained for callers that describe definition mutations as rules. */
export type PolicyRuleSet = InstitutionalRuleMutation;

type InstitutionalRuleEqualsPrerequisite = {
  [Key in InstitutionalRuleKey]: {
    readonly kind: "ruleEquals";
    readonly rule: Key;
    readonly value: InstitutionalRuleState[Key];
  };
}[InstitutionalRuleKey];

type InstitutionalRuleNotEqualsPrerequisite = {
  [Key in InstitutionalRuleKey]: {
    readonly kind: "ruleNotEquals";
    readonly rule: Key;
    readonly value: InstitutionalRuleState[Key];
  };
}[InstitutionalRuleKey];

export type PolicyPrerequisite =
  | { readonly kind: "policyActive"; readonly policyId: PolicyId }
  | { readonly kind: "policyInactive"; readonly policyId: PolicyId }
  | InstitutionalRuleEqualsPrerequisite
  | InstitutionalRuleNotEqualsPrerequisite;

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

export type PolicyAvailabilityFailure =
  "ALREADY_ACTIVE" | "PREREQUISITE_NOT_MET" | "INCOMPATIBLE_POLICY";

export interface PolicyAvailabilityResult {
  readonly feasible: boolean;
  readonly reasons: readonly PolicyAvailabilityFailure[];
}

export function policyPrerequisitesAreMet(
  policyState: PolicyState,
  prerequisites: readonly PolicyPrerequisite[] | undefined,
): boolean {
  for (const prerequisite of prerequisites ?? []) {
    switch (prerequisite.kind) {
      case "policyActive":
        if (!policyState.activePolicyIds.includes(prerequisite.policyId)) {
          return false;
        }
        break;
      case "policyInactive":
        if (policyState.activePolicyIds.includes(prerequisite.policyId)) {
          return false;
        }
        break;
      case "ruleEquals":
        if (
          policyState.institutionalRules[prerequisite.rule] !==
          prerequisite.value
        ) {
          return false;
        }
        break;
      case "ruleNotEquals":
        if (
          policyState.institutionalRules[prerequisite.rule] ===
          prerequisite.value
        ) {
          return false;
        }
        break;
    }
  }

  return true;
}

export function findIncompatiblePolicyId(
  activePolicyIds: readonly PolicyId[],
  definition: PolicyDefinition,
  catalog: Readonly<Record<PolicyId, PolicyDefinition>>,
): PolicyId | undefined {
  const declaredIncompatibilities = new Set(
    definition.incompatiblePolicyIds ?? [],
  );

  for (const activePolicyId of activePolicyIds) {
    if (declaredIncompatibilities.has(activePolicyId)) {
      return activePolicyId;
    }
  }

  for (const activePolicyId of activePolicyIds) {
    const activeDefinition = catalog[activePolicyId];
    if (activeDefinition?.incompatiblePolicyIds?.includes(definition.id)) {
      return activePolicyId;
    }
  }

  return undefined;
}

/** Presentation-only eligibility read model; the policy phase remains authoritative. */
export function evaluatePolicyAvailability(
  policyState: PolicyState,
  definition: PolicyDefinition,
  catalog: Readonly<Record<PolicyId, PolicyDefinition>>,
): PolicyAvailabilityResult {
  const reasons: PolicyAvailabilityFailure[] = [];
  if (policyState.activePolicyIds.includes(definition.id)) {
    reasons.push("ALREADY_ACTIVE");
  }
  if (!policyPrerequisitesAreMet(policyState, definition.prerequisites)) {
    reasons.push("PREREQUISITE_NOT_MET");
  }
  if (
    findIncompatiblePolicyId(
      policyState.activePolicyIds,
      definition,
      catalog,
    ) !== undefined
  ) {
    reasons.push("INCOMPATIBLE_POLICY");
  }
  return { feasible: reasons.length === 0, reasons };
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
    politicalCompetition: "restricted",
  };
}
