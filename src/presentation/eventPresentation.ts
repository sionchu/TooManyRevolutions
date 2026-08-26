import type { GameEvent, GameEventType } from "../sim/events/event";
import type { EventStore } from "../sim/events/eventStore";
import type {
  CountryId,
  EventId,
  GovernmentId,
  PoliticalProposalId,
} from "../sim/state/ids";
import type { PoliticalProposal } from "../sim/state/politicalProposal";

export const EVENT_PRESENTATION_KINDS = [
  "TOAST",
  "NEWS",
  "DECISION_REQUIRED",
  "CHRONICLE_ONLY",
] as const;

export type EventPresentationKind = (typeof EVENT_PRESENTATION_KINDS)[number];

/** Explicit ordering metadata for later UI consumers. It does not classify events. */
export type EventPresentationPriority = 1 | 2 | 3 | 4;

export interface EventPresentationItem {
  readonly id: string;
  readonly kind: EventPresentationKind;
  readonly priority: EventPresentationPriority;
  readonly eventId: EventId;
  readonly sourceEventIds: readonly EventId[];
  readonly tick: number;
  readonly eventType: GameEventType;
  readonly regionIds: readonly string[];
  readonly factionIds: readonly string[];
  readonly countryIds: readonly string[];
  readonly governmentIds: readonly string[];
  readonly proposalId?: PoliticalProposalId;
  readonly requiresResponse?: true;
  readonly terminal?: true;
}

export type PoliticalProposalSource =
  readonly PoliticalProposal[] | Readonly<Record<string, PoliticalProposal>>;

export interface EventPresentationInput {
  readonly eventStore: Pick<EventStore, "events">;
  readonly politicalProposals?: PoliticalProposalSource;
  /** Omit a filter for a caller that is presenting all countries. Use null when no player country exists. */
  readonly playerCountryId?: CountryId | null;
  /** Omit a filter for a caller that is presenting all governments. Use null when no player government exists. */
  readonly playerGovernmentId?: GovernmentId | null;
}

const NEWS_EVENT_TYPES = new Set<GameEventType>([
  "REBELLION_STARTED",
  "COUP_ATTEMPT_STARTED",
  "CIVIL_WAR_STARTED",
  "GOVERNMENT_TRANSITIONED",
  "ORDER_CONSOLIDATED",
  "STATE_DISSOLVED",
]);

const TOAST_EVENT_TYPES = new Set<GameEventType>([
  "POLICY_ENACTED",
  "POLICY_REJECTED",
  "INSTITUTION_RULE_CHANGED",
  "INTERVENTION_STARTED",
  "INTERVENTION_REJECTED",
  "INTERVENTION_COMPLETED",
  "POLITICAL_PROPOSAL_ACCEPTED",
  "POLITICAL_PROPOSAL_REJECTED",
  "POLITICAL_PROPOSAL_RESPONSE_REJECTED",
  "REGION_UNREST_BAND_CHANGED",
  "NATIONAL_INSTABILITY_BAND_CHANGED",
  "LAND_HEX_CONTROL_CHANGED",
  "BORDER_CLOSED",
  "BORDER_REOPENED",
]);

const PRESENTATION_PRIORITIES: Readonly<
  Record<EventPresentationKind, EventPresentationPriority>
> = {
  CHRONICLE_ONLY: 1,
  TOAST: 2,
  NEWS: 3,
  DECISION_REQUIRED: 4,
};

const REGION_ID_KEYS = [
  "regionId",
  "sourceRegionId",
  "targetRegionId",
  "affectedRegionIds",
  "controlledRegionIds",
  "contestedRegionIds",
  "regionIds",
] as const;

const FACTION_ID_KEYS = [
  "factionId",
  "actorFactionId",
  "targetFactionId",
  "proposerFactionId",
  "participantFactionIds",
  "affectedFactionIds",
  "factionIds",
] as const;

const COUNTRY_ID_KEYS = [
  "countryId",
  "actorCountryId",
  "targetCountryId",
  "sourceCountryId",
  "participantCountryIds",
  "affectedCountryIds",
  "countryIds",
] as const;

const GOVERNMENT_ID_KEYS = [
  "governmentId",
  "previousGovernmentId",
  "nextGovernmentId",
  "targetGovernmentId",
  "participantGovernmentIds",
  "affectedGovernmentIds",
  "governmentIds",
] as const;

interface EventEntityIds {
  readonly regionIds: readonly string[];
  readonly factionIds: readonly string[];
  readonly countryIds: readonly string[];
  readonly governmentIds: readonly string[];
}

function asRecord(value: unknown): Readonly<Record<string, unknown>> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : null;
}

function payloadRecord(
  event: GameEvent,
): Readonly<Record<string, unknown>> | null {
  return asRecord(event.payload);
}

function payloadString(event: GameEvent, key: string): string | null {
  const value = payloadRecord(event)?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function stringValues(value: unknown): readonly string[] {
  if (typeof value === "string" && value.length > 0) return [value];
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is string => typeof entry === "string" && entry.length > 0,
  );
}

function collectPayloadIds(
  event: GameEvent,
  keys: readonly string[],
): readonly string[] {
  const payload = payloadRecord(event);
  if (payload === null) return [];

  const ids = new Set<string>();
  for (const key of keys) {
    for (const value of stringValues(payload[key])) ids.add(value);
  }
  return [...ids].sort();
}

function collectWinnerId(
  event: GameEvent,
  entity: "country" | "faction",
): string | null {
  const winner = asRecord(payloadRecord(event)?.winner);
  if (winner?.kind !== entity) return null;
  const key = `${entity}Id`;
  const value = winner[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function eventEntityIds(event: GameEvent): EventEntityIds {
  const countryIds = new Set(collectPayloadIds(event, COUNTRY_ID_KEYS));
  const factionIds = new Set(collectPayloadIds(event, FACTION_ID_KEYS));
  const regionIds = collectPayloadIds(event, REGION_ID_KEYS);
  const governmentIds = collectPayloadIds(event, GOVERNMENT_ID_KEYS);

  const winnerCountryId = collectWinnerId(event, "country");
  if (winnerCountryId !== null) countryIds.add(winnerCountryId);
  const winnerFactionId = collectWinnerId(event, "faction");
  if (winnerFactionId !== null) factionIds.add(winnerFactionId);

  return {
    regionIds,
    factionIds: [...factionIds].sort(),
    countryIds: [...countryIds].sort(),
    governmentIds,
  };
}

function mergeIds(
  existing: readonly string[],
  ...additional: readonly (string | undefined)[]
): readonly string[] {
  const ids = new Set(existing);
  for (const id of additional) {
    if (id !== undefined && id.length > 0) ids.add(id);
  }
  return [...ids].sort();
}

function proposalValues(
  source: PoliticalProposalSource | undefined,
): readonly PoliticalProposal[] {
  if (source === undefined) return [];
  return Array.isArray(source) ? [...source] : Object.values(source);
}

function compareProposals(
  first: PoliticalProposal,
  second: PoliticalProposal,
): number {
  return (
    first.id.localeCompare(second.id) ||
    first.openingEventId.localeCompare(second.openingEventId) ||
    first.createdAtTick - second.createdAtTick
  );
}

function compareEvents(first: GameEvent, second: GameEvent): number {
  return (
    first.tick - second.tick ||
    first.sequence - second.sequence ||
    first.id.localeCompare(second.id)
  );
}

function proposalsByOpeningEvent(
  source: PoliticalProposalSource | undefined,
): ReadonlyMap<EventId, readonly PoliticalProposal[]> {
  const grouped = new Map<EventId, PoliticalProposal[]>();
  const seenProposalIds = new Set<PoliticalProposalId>();

  for (const proposal of [...proposalValues(source)].sort(compareProposals)) {
    if (seenProposalIds.has(proposal.id)) continue;
    seenProposalIds.add(proposal.id);
    const proposals = grouped.get(proposal.openingEventId) ?? [];
    proposals.push(proposal);
    grouped.set(proposal.openingEventId, proposals);
  }

  return grouped;
}

function proposalIdFromEvent(event: GameEvent): string | null {
  return payloadString(event, "proposalId");
}

function isRelevantProposal(
  proposal: PoliticalProposal,
  input: EventPresentationInput,
): boolean {
  if (
    input.playerCountryId !== undefined &&
    proposal.countryId !== input.playerCountryId
  ) {
    return false;
  }
  if (
    input.playerGovernmentId !== undefined &&
    proposal.targetGovernmentId !== input.playerGovernmentId
  ) {
    return false;
  }
  return true;
}

interface MatchingProposal {
  readonly proposal?: PoliticalProposal;
  readonly openProposal?: PoliticalProposal;
}

function matchingProposal(
  event: GameEvent,
  proposals: ReadonlyMap<EventId, readonly PoliticalProposal[]>,
  input: EventPresentationInput,
): MatchingProposal {
  if (event.type !== "POLITICAL_PROPOSAL_OPENED") return {};

  const candidates = proposals.get(event.id) ?? [];
  const eventProposalId = proposalIdFromEvent(event);
  const withMatchingId = candidates.filter(
    (proposal) => eventProposalId === null || proposal.id === eventProposalId,
  );

  return {
    proposal: withMatchingId[0],
    openProposal: withMatchingId.find(
      (proposal) =>
        proposal.status === "open" && isRelevantProposal(proposal, input),
    ),
  };
}

function scarcityBand(value: number): 0 | 1 | 2 {
  return value >= 0.6 ? 2 : value >= 0.3 ? 1 : 0;
}

function meaningfulShortageChange(event: GameEvent): boolean {
  const payload = payloadRecord(event);
  const current = payload?.scarcity;
  if (typeof current !== "number" || !Number.isFinite(current)) return false;

  const previous = payload?.previousScarcity;
  if (typeof previous !== "number" || !Number.isFinite(previous)) return true;

  return (
    scarcityBand(previous) !== scarcityBand(current) ||
    Math.abs(previous - current) >= 0.08
  );
}

function kindFor(
  event: GameEvent,
  openProposal: PoliticalProposal | undefined,
): EventPresentationKind {
  if (
    event.type === "POLITICAL_PROPOSAL_OPENED" &&
    openProposal !== undefined
  ) {
    return "DECISION_REQUIRED";
  }
  if (NEWS_EVENT_TYPES.has(event.type)) return "NEWS";
  if (
    event.type === "RESOURCE_SHORTAGE_CHANGED" &&
    meaningfulShortageChange(event)
  ) {
    return "TOAST";
  }
  if (TOAST_EVENT_TYPES.has(event.type)) return "TOAST";
  return "CHRONICLE_ONLY";
}

function itemFor(
  event: GameEvent,
  kind: EventPresentationKind,
  proposal: PoliticalProposal | undefined,
): EventPresentationItem {
  const eventIds = eventEntityIds(event);
  const regionIds = mergeIds(eventIds.regionIds);
  const factionIds = mergeIds(eventIds.factionIds, proposal?.proposerFactionId);
  const countryIds = mergeIds(eventIds.countryIds, proposal?.countryId);
  const governmentIds = mergeIds(
    eventIds.governmentIds,
    proposal?.targetGovernmentId,
  );

  return {
    id: `event-presentation:${event.id}`,
    kind,
    priority: PRESENTATION_PRIORITIES[kind],
    eventId: event.id,
    sourceEventIds: [event.id],
    tick: event.tick,
    eventType: event.type,
    regionIds,
    factionIds,
    countryIds,
    governmentIds,
    ...(proposal === undefined ? {} : { proposalId: proposal.id }),
    ...(kind === "DECISION_REQUIRED"
      ? { requiresResponse: true as const }
      : {}),
    ...(event.type === "ORDER_CONSOLIDATED" || event.type === "STATE_DISSOLVED"
      ? { terminal: true as const }
      : {}),
  };
}

/**
 * Classify canonical EventStore facts without writing to the simulation or
 * creating a second event/proposal lifecycle.
 */
export function deriveEventPresentation(
  input: EventPresentationInput,
): readonly EventPresentationItem[] {
  const proposals = proposalsByOpeningEvent(input.politicalProposals);
  const seenEventIds = new Set<EventId>();
  const items: EventPresentationItem[] = [];

  for (const event of [...input.eventStore.events].sort(compareEvents)) {
    if (seenEventIds.has(event.id)) continue;
    seenEventIds.add(event.id);

    const match = matchingProposal(event, proposals, input);
    const kind = kindFor(event, match.openProposal);
    items.push(itemFor(event, kind, match.proposal));
  }

  return items;
}
