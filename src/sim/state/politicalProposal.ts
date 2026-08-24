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
} from "./ids";

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
  };
}
