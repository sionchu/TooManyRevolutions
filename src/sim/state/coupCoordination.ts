import type {
  CoupCoordinationNodeId,
  CountryId,
  FactionId,
  GovernmentId,
} from "./ids";

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
