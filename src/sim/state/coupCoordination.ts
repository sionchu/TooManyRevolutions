import type {
  ActionId,
  ConflictId,
  CoupCoordinationNodeId,
  CountryId,
  EventId,
  FactionId,
  GovernmentId,
} from "./ids";
import type { Conflict } from "./conflict";
import type { ScenarioDefinition } from "./scenario";

/** Static, scenario-authored identity for one decisive coup coordination grouping. */
export interface CoupCoordinationNodeDefinition {
  readonly id: CoupCoordinationNodeId;
  readonly countryId: CountryId;
  /** Authoring/presentation label only; never a simulation branch key. */
  readonly name: string;
}

/** Static mapping from one coup candidate to its authored necessary node set. */
export interface CoupCoordinationProfile {
  readonly countryId: CountryId;
  readonly coupFactionId: FactionId;
  /** Must be a non-empty, unique necessary set; array order has no meaning. */
  readonly requiredNodeIds: readonly CoupCoordinationNodeId[];
  readonly successorGovernmentId: GovernmentId;
}

export const COUP_COORDINATION_ALIGNMENTS = ["incumbent", "coup"] as const;
export type CoupCoordinationAlignment =
  (typeof COUP_COORDINATION_ALIGNMENTS)[number];

/** Bounded provenance vocabulary for explicit response attempts that no-op. */
export const COUP_COORDINATION_RESPONSE_REJECTION_REASONS = [
  "invalidPayload",
  "unsupportedSchemaVersion",
  "missingConflict",
  "conflictResolved",
  "nonCoupConflict",
  "missingOrAmbiguousProfile",
  "invalidProfileReferences",
  "nonRequiredNode",
  "duplicateResponse",
  "staleSuccessorGovernment",
] as const;
export type CoupCoordinationResponseRejectionReason =
  (typeof COUP_COORDINATION_RESPONSE_REJECTION_REASONS)[number];

/**
 * One accepted, decisive response. Absence from the response map is the only
 * representation of an uncommitted node; no third alignment is persisted.
 */
export interface CoupCoordinationResponseState {
  readonly conflictId: ConflictId;
  readonly nodeId: CoupCoordinationNodeId;
  readonly alignment: CoupCoordinationAlignment;
  readonly actionId: ActionId;
  readonly eventId: EventId;
  readonly respondedAtTick: number;
}

export type CoupCoordinationResponsesByNode = Readonly<
  Record<CoupCoordinationNodeId, CoupCoordinationResponseState>
>;

/** Sparse decisive responses, indexed by coup ConflictId then node ID. */
export type CoupCoordinationResponseStateMap = Readonly<
  Record<ConflictId, CoupCoordinationResponsesByNode>
>;

/** Return all authored profiles whose country/faction pair participates. */
export function findCoupCoordinationProfilesForConflict(
  scenario: Pick<ScenarioDefinition, "coupCoordinationProfiles">,
  conflict: Pick<Conflict, "participantCountryIds" | "participantFactionIds">,
): readonly CoupCoordinationProfile[] {
  const countryIds = new Set(conflict.participantCountryIds);
  const factionIds = new Set(conflict.participantFactionIds);

  return (scenario.coupCoordinationProfiles ?? []).filter(
    (profile) =>
      countryIds.has(profile.countryId) &&
      factionIds.has(profile.coupFactionId),
  );
}
