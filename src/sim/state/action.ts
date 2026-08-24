import type { JsonValue } from "../core/serialization";
import {
  asActionId,
  asCountryId,
  asFactionId,
  asInterventionId,
  asPolicyId,
  asPoliticalProposalId,
  type ActionId,
  type CountryId,
  type FactionId,
  type InterventionId,
  type PolicyId,
  type PoliticalProposalId,
} from "./ids";

export type ActionSource = "player" | "heuristic" | "llm";

export type ActionValidationOutcome =
  | { readonly kind: "accepted" }
  | { readonly kind: "rejected"; readonly reason: string };

/**
 * Append-only, globally ordered input envelope. Rejected inputs stay in the
 * log; only accepted records enter a SimulationStep.
 */
export interface ActionRecord {
  readonly id: ActionId;
  readonly tick: number;
  readonly sequence: number;
  readonly source: ActionSource;
  readonly actionType: string;
  readonly payload: JsonValue;
  readonly schemaVersion: number;
  readonly validationOutcome: ActionValidationOutcome;
}

/**
 * A proposal is not yet a committed input. It is the bounded hand-off from a
 * player/heuristic/LLM decision maker to the common ActionRecord intake.
 */
export interface ActionProposal {
  readonly tick: number;
  readonly source: ActionSource;
  readonly actionType: string;
  readonly payload: JsonValue;
  readonly schemaVersion: number;
}

export type ValidatedActionRecord = ActionRecord & {
  readonly validationOutcome: { readonly kind: "accepted" };
};

/** Stable, small T016 vocabulary. Crisis and military actions are later work. */
export const FACTION_ACTION_TYPES = [
  "LOBBY",
  "BARGAIN",
  "ORGANIZE",
  "FUND_MOVEMENT",
  "ACCEPT",
  "WAIT",
] as const;

export type FactionActionType = (typeof FACTION_ACTION_TYPES)[number];

export const FACTION_ACTION_SCHEMA_VERSION = 1 as const;

export interface FactionActionPayload {
  readonly factionId: FactionId;
}

/**
 * Bounded T019/T020 vocabulary. T019's CLOSE/REOPEN semantics are outgoing
 * actor -> target border controls. T020 adds explicitly incoming controls;
 * sanctions, trade, and military actions remain later work.
 */
export const DIPLOMACY_ACTION_TYPES = [
  "CLOSE_BORDER",
  "REOPEN_BORDER",
  "RESTRICT_INCOMING_BORDER",
  "RESTORE_INCOMING_BORDER",
  "WAIT",
] as const;

export type DiplomacyActionType = (typeof DIPLOMACY_ACTION_TYPES)[number];

export const DIPLOMACY_ACTION_SCHEMA_VERSION = 1 as const;

/** Bounded payload shared by foreign heuristic and future diplomatic actors. */
export interface DiplomacyActionPayload {
  readonly actorCountryId: CountryId;
  readonly targetCountryId?: CountryId;
}

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
}

/** Sequence makes action IDs collision-safe within one run. */
export function createDeterministicActionId(
  tick: number,
  sequence: number,
  source: ActionSource,
  actionType: string,
): ActionId {
  assertNonNegativeInteger(tick, "Action tick");
  assertNonNegativeInteger(sequence, "Action sequence");

  return asActionId(`action:${tick}:${sequence}:${source}:${actionType}`);
}

/** Accept a structured proposal without giving it a second mutation path. */
export function acceptActionProposal(
  proposal: ActionProposal,
  sequence: number,
): ValidatedActionRecord {
  assertNonNegativeInteger(proposal.tick, "Action proposal tick");
  assertNonNegativeInteger(sequence, "Action proposal sequence");

  if (!Number.isInteger(proposal.schemaVersion) || proposal.schemaVersion < 1) {
    throw new Error(
      "Action proposal schemaVersion must be a positive integer.",
    );
  }

  return {
    ...proposal,
    id: createDeterministicActionId(
      proposal.tick,
      sequence,
      proposal.source,
      proposal.actionType,
    ),
    sequence,
    validationOutcome: { kind: "accepted" },
  };
}

/** Stable bulk intake for proposals emitted by one deterministic phase. */
export function acceptActionProposals(
  proposals: readonly ActionProposal[],
  firstSequence: number,
): readonly ValidatedActionRecord[] {
  return proposals.map((proposal, index) =>
    acceptActionProposal(proposal, firstSequence + index),
  );
}

export const ENACT_POLICY_ACTION_TYPE = "ENACT_POLICY" as const;
export const ENACT_POLICY_ACTION_SCHEMA_VERSION = 1 as const;

export const START_INTERVENTION_ACTION_TYPE = "START_INTERVENTION" as const;
export const START_INTERVENTION_ACTION_SCHEMA_VERSION = 1 as const;

/** Typed payload for the T016B intervention action. */
export interface StartInterventionActionPayload {
  readonly interventionId: InterventionId;
  readonly countryId?: CountryId;
}

export const RESPOND_POLITICAL_PROPOSAL_ACTION_TYPE =
  "RESPOND_POLITICAL_PROPOSAL" as const;
export const RESPOND_POLITICAL_PROPOSAL_ACTION_SCHEMA_VERSION = 1 as const;

export const POLITICAL_PROPOSAL_RESPONSES = ["accept", "reject"] as const;
export type PoliticalProposalResponse =
  (typeof POLITICAL_PROPOSAL_RESPONSES)[number];

export interface RespondPoliticalProposalActionPayload {
  readonly proposalId: PoliticalProposalId;
  readonly response: PoliticalProposalResponse;
}

/** Typed payload for the policy action; absent countryId means the player state. */
export interface EnactPolicyActionPayload {
  readonly policyId: PolicyId;
  readonly countryId?: CountryId;
}

function isFactionActionType(value: string): value is FactionActionType {
  return FACTION_ACTION_TYPES.includes(value as FactionActionType);
}

function isJsonObject(
  value: JsonValue,
): value is { readonly [key: string]: JsonValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Decode only the bounded T012 policy payload; arbitrary objects are rejected. */
export function decodeEnactPolicyAction(
  action: ValidatedActionRecord,
): EnactPolicyActionPayload | null {
  if (
    action.actionType !== ENACT_POLICY_ACTION_TYPE ||
    action.schemaVersion !== ENACT_POLICY_ACTION_SCHEMA_VERSION ||
    !isJsonObject(action.payload)
  ) {
    return null;
  }

  const keys = Object.keys(action.payload).sort();
  if (
    (keys.length !== 1 && keys.length !== 2) ||
    !keys.includes("policyId") ||
    (keys.length === 2 && !keys.includes("countryId"))
  ) {
    return null;
  }

  const policyId = action.payload.policyId;
  if (typeof policyId !== "string" || policyId.length === 0) {
    return null;
  }

  const countryId = action.payload.countryId;
  if (countryId !== undefined && typeof countryId !== "string") {
    return null;
  }

  return {
    policyId: asPolicyId(policyId),
    ...(countryId === undefined ? {} : { countryId: asCountryId(countryId) }),
  };
}

/** Decode only the bounded T016B intervention payload. */
export function decodeStartInterventionAction(
  action: ValidatedActionRecord,
): StartInterventionActionPayload | null {
  if (
    action.actionType !== START_INTERVENTION_ACTION_TYPE ||
    action.schemaVersion !== START_INTERVENTION_ACTION_SCHEMA_VERSION ||
    !isJsonObject(action.payload)
  ) {
    return null;
  }

  const keys = Object.keys(action.payload).sort();
  if (
    (keys.length !== 1 && keys.length !== 2) ||
    !keys.includes("interventionId") ||
    (keys.length === 2 && !keys.includes("countryId"))
  ) {
    return null;
  }

  const interventionId = action.payload.interventionId;
  if (typeof interventionId !== "string" || interventionId.length === 0) {
    return null;
  }

  const countryId = action.payload.countryId;
  if (countryId !== undefined && typeof countryId !== "string") {
    return null;
  }

  return {
    interventionId: asInterventionId(interventionId),
    ...(countryId === undefined ? {} : { countryId: asCountryId(countryId) }),
  };
}

/** Decode the explicit player response for an authoritative proposal. */
export function decodeRespondPoliticalProposalAction(
  action: ValidatedActionRecord,
): RespondPoliticalProposalActionPayload | null {
  if (
    action.actionType !== RESPOND_POLITICAL_PROPOSAL_ACTION_TYPE ||
    action.schemaVersion !== RESPOND_POLITICAL_PROPOSAL_ACTION_SCHEMA_VERSION ||
    !isJsonObject(action.payload)
  ) {
    return null;
  }

  const keys = Object.keys(action.payload).sort();
  if (keys.length !== 2 || keys[0] !== "proposalId" || keys[1] !== "response") {
    return null;
  }

  const proposalId = action.payload.proposalId;
  const response = action.payload.response;
  if (
    typeof proposalId !== "string" ||
    proposalId.length === 0 ||
    typeof response !== "string" ||
    !POLITICAL_PROPOSAL_RESPONSES.includes(
      response as PoliticalProposalResponse,
    )
  ) {
    return null;
  }

  return {
    proposalId: asPoliticalProposalId(proposalId),
    response: response as PoliticalProposalResponse,
  };
}

export function createRespondPoliticalProposalActionProposal(
  tick: number,
  proposalId: PoliticalProposalId,
  response: PoliticalProposalResponse,
): ActionProposal {
  return {
    tick,
    source: "player",
    actionType: RESPOND_POLITICAL_PROPOSAL_ACTION_TYPE,
    payload: { proposalId, response },
    schemaVersion: RESPOND_POLITICAL_PROPOSAL_ACTION_SCHEMA_VERSION,
  };
}

/** Convenience constructor for bounded player/heuristic/LLM proposals. */
export function createStartInterventionActionProposal(
  tick: number,
  source: ActionSource,
  interventionId: InterventionId,
  countryId?: CountryId,
): ActionProposal {
  return {
    tick,
    source,
    actionType: START_INTERVENTION_ACTION_TYPE,
    payload:
      countryId === undefined
        ? { interventionId }
        : { interventionId, countryId },
    schemaVersion: START_INTERVENTION_ACTION_SCHEMA_VERSION,
  };
}

/** Decode only the bounded T016 faction-action payload. */
export function decodeFactionAction(
  action: ValidatedActionRecord,
): FactionActionPayload | null {
  if (
    !isFactionActionType(action.actionType) ||
    action.schemaVersion !== FACTION_ACTION_SCHEMA_VERSION ||
    !isJsonObject(action.payload)
  ) {
    return null;
  }

  const keys = Object.keys(action.payload).sort();
  if (keys.length !== 1 || keys[0] !== "factionId") {
    return null;
  }

  const factionId = action.payload.factionId;
  if (typeof factionId !== "string" || factionId.length === 0) {
    return null;
  }

  return { factionId: asFactionId(factionId) };
}

function isDiplomacyActionType(value: string): value is DiplomacyActionType {
  return DIPLOMACY_ACTION_TYPES.includes(value as DiplomacyActionType);
}

/** Decode only the bounded T019 diplomatic action payload. */
export function decodeDiplomacyAction(
  action: ValidatedActionRecord,
): DiplomacyActionPayload | null {
  if (
    !isDiplomacyActionType(action.actionType) ||
    action.schemaVersion !== DIPLOMACY_ACTION_SCHEMA_VERSION ||
    !isJsonObject(action.payload)
  ) {
    return null;
  }

  const keys = Object.keys(action.payload).sort();
  const expectedKeys =
    action.actionType === "WAIT"
      ? ["actorCountryId"]
      : ["actorCountryId", "targetCountryId"];

  if (
    keys.length !== expectedKeys.length ||
    keys.some((key, index) => key !== expectedKeys[index])
  ) {
    return null;
  }

  const actorCountryId = action.payload.actorCountryId;
  const targetCountryId = action.payload.targetCountryId;

  if (
    typeof actorCountryId !== "string" ||
    actorCountryId.length === 0 ||
    (action.actionType !== "WAIT" &&
      (typeof targetCountryId !== "string" || targetCountryId.length === 0))
  ) {
    return null;
  }

  return {
    actorCountryId: asCountryId(actorCountryId),
    ...(typeof targetCountryId === "string"
      ? { targetCountryId: asCountryId(targetCountryId) }
      : {}),
  };
}
