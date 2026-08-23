import type {
  ConflictId,
  CountryId,
  FactionId,
  GovernmentId,
  RegionId,
} from "./ids";
import type { StateDissolutionReason } from "./run";

export type ConflictKind = "rebellion" | "coup" | "civilWar" | "war";
export type ConflictStatus = "active" | "resolved";

export type ConflictWinner =
  | { readonly kind: "country"; readonly countryId: CountryId }
  | { readonly kind: "faction"; readonly factionId: FactionId };

/**
 * Resolving a conflict can change government without changing CountryId.
 * Physical territorial authority is WorldState.landHexStates[*].controller;
 * Region control is derived from LandHex state. Conflict outcomes do not
 * resolve territorial control here; future conflict resolution must use the
 * typed LandHex controller mutation seam (T021).
 */
export type ConflictOutcome =
  | { readonly kind: "statusQuo"; readonly winner?: ConflictWinner }
  | {
      readonly kind: "governmentTransition";
      readonly countryId: CountryId;
      readonly previousGovernmentId: GovernmentId | null;
      readonly nextGovernmentId: GovernmentId;
      readonly winner: ConflictWinner;
    }
  | {
      readonly kind: "stateDissolved";
      readonly countryId: CountryId;
      readonly reason: StateDissolutionReason;
      readonly winner?: ConflictWinner;
    };

export interface Conflict {
  readonly id: ConflictId;
  readonly kind: ConflictKind;
  readonly status: ConflictStatus;
  readonly participantCountryIds: readonly CountryId[];
  readonly participantFactionIds: readonly FactionId[];
  /** Political impact set; this does not imply physical LandHex contest. */
  readonly affectedRegionIds?: readonly RegionId[];
  /** Physical contest set, reserved for conflict resolution semantics. */
  readonly contestedRegionIds: readonly RegionId[];
  readonly startedAtTick: number;
  readonly resolvedAtTick?: number;
  readonly outcome?: ConflictOutcome;
}
