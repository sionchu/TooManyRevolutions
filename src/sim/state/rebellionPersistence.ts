import type {
  ConflictId,
  CountryId,
  EventId,
  FactionId,
  RebellionOperationalChannelId,
  RebellionPersistenceProfileId,
} from "./ids";

/** Closed static vocabulary for future operational evidence allow-lists. */
export const REBELLION_OPERATIONAL_CHANNEL_KINDS = [
  "organizationalContinuity",
  "commandContinuity",
  "logisticsAccess",
  "externalSupport",
] as const;

export type RebellionOperationalChannelKind =
  (typeof REBELLION_OPERATIONAL_CHANNEL_KINDS)[number];

/** Static scenario-owned channel contract; this is not runtime evidence. */
export interface RebellionOperationalChannelDefinition {
  readonly id: RebellionOperationalChannelId;
  readonly countryId: CountryId;
  readonly kind: RebellionOperationalChannelKind;
  /** Authoring/presentation text only; never a simulation branch key. */
  readonly name: string;
}

/** Identity-scoped allow-list of channels for one Country/Faction pair. */
export interface RebellionPersistenceProfile {
  readonly id: RebellionPersistenceProfileId;
  readonly countryId: CountryId;
  readonly factionId: FactionId;
  /** Non-empty set; array order has no gameplay semantics. */
  readonly channelIds: readonly RebellionOperationalChannelId[];
}

/**
 * Conflict-scoped runtime identity for a T018-created rebellion. This is
 * provenance only; it is not operational evidence or a persistence score.
 */
export interface RebellionOperationalPersistenceEpisode {
  readonly conflictId: ConflictId;
  readonly profileId: RebellionPersistenceProfileId;
  readonly countryId: CountryId;
  readonly factionId: FactionId;
  readonly bootstrappedAtTick: number;
  readonly sourceEventId: EventId;
}
