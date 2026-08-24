import type { JsonValue } from "../core/serialization";
import {
  asPoliticalProposalId,
  type ActionId,
  type CountryId,
  type EventId,
  type FactionId,
  type GovernmentId,
  type InterventionId,
  type PoliticalProposalId,
  type PolicyId,
} from "./ids";
import type { InstitutionalRuleKey, PolicyPrerequisite } from "./policy";
import type { InterventionFeasibilityResult } from "./intervention";

export const POLITICAL_PROPOSAL_SUBJECT_KINDS = [
  "interventionRequest",
] as const;

export type PoliticalProposalSubjectKind =
  (typeof POLITICAL_PROPOSAL_SUBJECT_KINDS)[number];

export const POLITICAL_PROPOSAL_STATUSES = [
  "open",
  "accepted",
  "rejected",
] as const;

export type PoliticalProposalStatus =
  (typeof POLITICAL_PROPOSAL_STATUSES)[number];

export const POLITICAL_PROPOSAL_RESOLUTION_REASONS = [
  "accepted",
  "explicitReject",
  "staleTargetGovernment",
] as const;

export type PoliticalProposalResolutionReason =
  (typeof POLITICAL_PROPOSAL_RESOLUTION_REASONS)[number];

export const POLITICAL_PROPOSAL_FAILURE_KINDS = [
  "TERMINAL_RUN",
  "UNKNOWN_INTERVENTION",
  "MISSING_COUNTRY",
  "MISSING_POLICY_STATE",
  "INSUFFICIENT_TREASURY",
  "INSUFFICIENT_ADMINISTRATIVE_HEADROOM",
  "PREREQUISITE_NOT_MET",
  "NO_COMPLETION_EFFECT_CHANGE",
] as const;

export const POLITICAL_PROPOSAL_PREREQUISITE_KINDS = [
  "policyActive",
  "policyInactive",
  "ruleEquals",
  "ruleNotEquals",
] as const;

/** Discrete prerequisite identity retained in an explicit-reject basis. */
export type PoliticalProposalPrerequisiteClass =
  | {
      readonly kind: "PREREQUISITE_NOT_MET";
      readonly prerequisiteIndex: number;
      readonly prerequisiteKind: "policyActive" | "policyInactive";
      readonly policyId: PolicyId;
    }
  | {
      readonly kind: "PREREQUISITE_NOT_MET";
      readonly prerequisiteIndex: number;
      readonly prerequisiteKind: "ruleEquals" | "ruleNotEquals";
      readonly rule: InstitutionalRuleKey;
    };

/** Stable failure classes; continuously drifting scalar values are omitted. */
export type PoliticalProposalFailureClass =
  | { readonly kind: "TERMINAL_RUN" }
  | { readonly kind: "UNKNOWN_INTERVENTION" }
  | { readonly kind: "MISSING_COUNTRY" }
  | { readonly kind: "MISSING_POLICY_STATE" }
  | { readonly kind: "INSUFFICIENT_TREASURY" }
  | { readonly kind: "INSUFFICIENT_ADMINISTRATIVE_HEADROOM" }
  | PoliticalProposalPrerequisiteClass
  | { readonly kind: "NO_COMPLETION_EFFECT_CHANGE" };

/** Authoritative state used to decide whether an explicit rejection may reopen. */
export interface PoliticalProposalReconsiderationBasis {
  readonly targetGovernmentId: GovernmentId;
  readonly feasible: boolean;
  readonly failureClasses: readonly PoliticalProposalFailureClass[];
}

/** Explicit authoritative state for one faction-to-government proposal. */
export interface PoliticalProposal {
  readonly id: PoliticalProposalId;
  readonly proposerFactionId: FactionId;
  readonly countryId: CountryId;
  readonly targetGovernmentId: GovernmentId;
  readonly subjectKind: PoliticalProposalSubjectKind;
  readonly interventionId: InterventionId;
  readonly status: PoliticalProposalStatus;
  readonly createdAtTick: number;
  readonly openingActionId: ActionId;
  readonly openingEventId: EventId;
  readonly resolvedAtTick?: number;
  readonly responseActionId?: ActionId;
  readonly resolutionReason?: PoliticalProposalResolutionReason;
  /** Present only for an explicit REJECT; absent for ACCEPT/stale rejection. */
  readonly reconsiderationBasis?: PoliticalProposalReconsiderationBasis;
}

function prerequisiteClass(
  failure: Extract<
    InterventionFeasibilityResult["reasons"][number],
    { readonly kind: "PREREQUISITE_NOT_MET" }
  >,
): PoliticalProposalPrerequisiteClass {
  const prerequisite: PolicyPrerequisite = failure.prerequisite;
  switch (prerequisite.kind) {
    case "policyActive":
    case "policyInactive":
      return {
        kind: "PREREQUISITE_NOT_MET",
        prerequisiteIndex: failure.prerequisiteIndex,
        prerequisiteKind: prerequisite.kind,
        policyId: prerequisite.policyId,
      };
    case "ruleEquals":
    case "ruleNotEquals":
      return {
        kind: "PREREQUISITE_NOT_MET",
        prerequisiteIndex: failure.prerequisiteIndex,
        prerequisiteKind: prerequisite.kind,
        rule: prerequisite.rule,
      };
  }
}

/** Convert a feasibility result into the persisted, scalar-free basis. */
export function createPoliticalProposalReconsiderationBasis(
  targetGovernmentId: GovernmentId,
  feasibility: InterventionFeasibilityResult,
): PoliticalProposalReconsiderationBasis {
  const failureClasses = feasibility.reasons
    .map((failure): PoliticalProposalFailureClass => {
      switch (failure.kind) {
        case "PREREQUISITE_NOT_MET":
          return prerequisiteClass(failure);
        case "UNKNOWN_INTERVENTION":
          return { kind: failure.kind };
        case "MISSING_COUNTRY":
          return { kind: failure.kind };
        case "MISSING_POLICY_STATE":
          return { kind: failure.kind };
        case "INSUFFICIENT_TREASURY":
        case "INSUFFICIENT_ADMINISTRATIVE_HEADROOM":
        case "TERMINAL_RUN":
        case "NO_COMPLETION_EFFECT_CHANGE":
          return { kind: failure.kind };
      }
    })
    .sort(compareFailureClasses);

  return {
    targetGovernmentId,
    feasible: feasibility.feasible,
    failureClasses,
  };
}

function failureClassKey(failure: PoliticalProposalFailureClass): string {
  switch (failure.kind) {
    case "PREREQUISITE_NOT_MET":
      return [
        failure.kind,
        failure.prerequisiteIndex,
        failure.prerequisiteKind,
        "policyId" in failure ? failure.policyId : failure.rule,
      ].join(":");
    default:
      return failure.kind;
  }
}

function compareFailureClasses(
  first: PoliticalProposalFailureClass,
  second: PoliticalProposalFailureClass,
): number {
  const firstKey = failureClassKey(first);
  const secondKey = failureClassKey(second);
  return firstKey < secondKey ? -1 : firstKey > secondKey ? 1 : 0;
}

/** Field-by-field equality for authoritative reconsideration eligibility. */
export function politicalProposalReconsiderationBasisEqual(
  first: PoliticalProposalReconsiderationBasis | undefined,
  second: PoliticalProposalReconsiderationBasis | undefined,
): boolean {
  if (first === undefined || second === undefined) return first === second;
  if (
    first.targetGovernmentId !== second.targetGovernmentId ||
    first.feasible !== second.feasible ||
    first.failureClasses.length !== second.failureClasses.length
  ) {
    return false;
  }
  const firstClasses = [...first.failureClasses].sort(compareFailureClasses);
  const secondClasses = [...second.failureClasses].sort(compareFailureClasses);
  return firstClasses.every(
    (failure, index) =>
      failureClassKey(failure) === failureClassKey(secondClasses[index]!),
  );
}

export function politicalProposalReconsiderationBasisToJson(
  basis: PoliticalProposalReconsiderationBasis,
): JsonValue {
  return {
    targetGovernmentId: basis.targetGovernmentId,
    feasible: basis.feasible,
    failureClasses: basis.failureClasses.map((failure) => ({ ...failure })),
  };
}

export function createDeterministicPoliticalProposalId(
  openingActionId: ActionId,
): PoliticalProposalId {
  return asPoliticalProposalId(`political-proposal:${openingActionId}`);
}

export function politicalProposalToJson(
  proposal: PoliticalProposal,
): JsonValue {
  return {
    id: proposal.id,
    proposerFactionId: proposal.proposerFactionId,
    countryId: proposal.countryId,
    targetGovernmentId: proposal.targetGovernmentId,
    subjectKind: proposal.subjectKind,
    interventionId: proposal.interventionId,
    status: proposal.status,
    createdAtTick: proposal.createdAtTick,
    openingActionId: proposal.openingActionId,
    openingEventId: proposal.openingEventId,
    ...(proposal.resolvedAtTick === undefined
      ? {}
      : { resolvedAtTick: proposal.resolvedAtTick }),
    ...(proposal.responseActionId === undefined
      ? {}
      : { responseActionId: proposal.responseActionId }),
    ...(proposal.resolutionReason === undefined
      ? {}
      : { resolutionReason: proposal.resolutionReason }),
    ...(proposal.reconsiderationBasis === undefined
      ? {}
      : {
          reconsiderationBasis: politicalProposalReconsiderationBasisToJson(
            proposal.reconsiderationBasis,
          ),
        }),
  };
}
