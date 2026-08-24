import {
  acceptActionProposals,
  FACTION_ACTION_SCHEMA_VERSION,
  FACTION_ACTION_TYPES,
  type ActionProposal,
  type FactionActionType,
  type ValidatedActionRecord,
} from "../state/action";
import { asFactionId } from "../state/ids";
import type { WorldState } from "../state/world";

/** Developer-runner switch; the authoritative simulation remains unchanged. */
export type FactionActorLoopMode = "off" | "on";

export type FactionActorProposalDropReason =
  | "STALE_TICK"
  | "WRONG_SOURCE"
  | "UNSUPPORTED_ACTION"
  | "WRONG_SCHEMA"
  | "MALFORMED_PAYLOAD"
  | "UNKNOWN_FACTION"
  | "DUPLICATE";

export interface FactionActorProposalDetails {
  readonly factionId: string;
  readonly actionType: FactionActionType;
}

export interface FactionActorDroppedProposal {
  readonly proposal: ActionProposal;
  readonly reason: FactionActorProposalDropReason;
}

export interface FactionActorIntakeResult {
  /** Accepted records are the only values that may enter SimulationStepInput. */
  readonly acceptedActions: readonly ValidatedActionRecord[];
  readonly acceptedProposals: readonly ActionProposal[];
  readonly droppedProposals: readonly FactionActorDroppedProposal[];
}

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function isFactionActionType(value: string): value is FactionActionType {
  return FACTION_ACTION_TYPES.includes(value as FactionActionType);
}

/**
 * Read the intentionally narrow T016 heuristic proposal domain without
 * mutating state or accepting the proposal. This is also used for diagnostics.
 */
export function getFactionActorProposalDetails(
  proposal: ActionProposal,
): FactionActorProposalDetails | null {
  if (
    proposal.source !== "heuristic" ||
    !isFactionActionType(proposal.actionType) ||
    proposal.schemaVersion !== FACTION_ACTION_SCHEMA_VERSION
  ) {
    return null;
  }

  const payload = proposal.payload;
  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    return null;
  }
  const objectPayload = payload as { readonly [key: string]: unknown };

  const keys = Object.keys(objectPayload).sort(compareStableText);
  if (keys.length !== 1 || keys[0] !== "factionId") {
    return null;
  }

  const factionId = objectPayload.factionId;
  if (typeof factionId !== "string" || factionId.length === 0) {
    return null;
  }

  return { factionId, actionType: proposal.actionType };
}

function proposalKey(
  proposal: ActionProposal,
  details: FactionActorProposalDetails,
): string {
  return `${proposal.tick}:${proposal.source}:${proposal.schemaVersion}:${details.factionId}:${details.actionType}`;
}

/**
 * Intake only T016 heuristic faction proposals for the immediately following
 * tick. The caller owns the pending array and must clear it after this call;
 * no pending proposal is stored in WorldState or the persistence record.
 */
export function intakeFactionHeuristicProposals(
  world: WorldState,
  pendingProposals: readonly ActionProposal[],
  firstSequence: number,
): FactionActorIntakeResult {
  const targetTick = world.tick + 1;
  const valid: Array<{
    readonly proposal: ActionProposal;
    readonly details: FactionActorProposalDetails;
  }> = [];
  const dropped: FactionActorDroppedProposal[] = [];
  const seen = new Set<string>();

  for (const proposal of pendingProposals) {
    if (proposal.tick !== targetTick) {
      dropped.push({ proposal, reason: "STALE_TICK" });
      continue;
    }
    if (proposal.source !== "heuristic") {
      dropped.push({ proposal, reason: "WRONG_SOURCE" });
      continue;
    }
    if (!isFactionActionType(proposal.actionType)) {
      dropped.push({ proposal, reason: "UNSUPPORTED_ACTION" });
      continue;
    }
    if (proposal.schemaVersion !== FACTION_ACTION_SCHEMA_VERSION) {
      dropped.push({ proposal, reason: "WRONG_SCHEMA" });
      continue;
    }

    const details = getFactionActorProposalDetails(proposal);
    if (details === null) {
      dropped.push({ proposal, reason: "MALFORMED_PAYLOAD" });
      continue;
    }
    if (world.factions[asFactionId(details.factionId)] === undefined) {
      dropped.push({ proposal, reason: "UNKNOWN_FACTION" });
      continue;
    }

    const key = proposalKey(proposal, details);
    if (seen.has(key)) {
      dropped.push({ proposal, reason: "DUPLICATE" });
      continue;
    }
    seen.add(key);
    valid.push({ proposal, details });
  }

  valid.sort(
    (first, second) =>
      compareStableText(first.details.factionId, second.details.factionId) ||
      compareStableText(first.details.actionType, second.details.actionType) ||
      first.proposal.tick - second.proposal.tick,
  );

  const acceptedProposals = valid.map(({ proposal }) => proposal);
  return {
    acceptedProposals,
    acceptedActions: acceptActionProposals(acceptedProposals, firstSequence),
    droppedProposals: dropped,
  };
}
