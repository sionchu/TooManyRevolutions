import type { ActionId } from "./ids";
import {
  asFactionFundMovementCommitmentId,
  type FactionFundMovementCommitmentId,
  type FactionId,
  type RegionId,
} from "./ids";
import type { WorldState } from "./world";

/** The targeted payload is deliberately separate from the legacy T016 v1 payload. */
export interface TargetedFactionFundMovementActionPayload {
  readonly factionId: FactionId;
  readonly targetRegionId: RegionId;
  readonly resourceAmount: number;
}

export const FACTION_FUND_MOVEMENT_COMMITMENT_STATUSES = [
  "active",
  "resolved",
] as const;

export const FACTION_FUND_MOVEMENT_RESOLUTION_REASONS = [
  "actorIntentCeased",
] as const;

export type FactionFundMovementCommitmentStatus =
  (typeof FACTION_FUND_MOVEMENT_COMMITMENT_STATUSES)[number];

export type FactionFundMovementResolutionReason =
  (typeof FACTION_FUND_MOVEMENT_RESOLUTION_REASONS)[number];

/** Authoritative actor-owned earmark; it has no completion timer or payoff. */
interface FactionFundMovementCommitmentBase {
  readonly id: FactionFundMovementCommitmentId;
  readonly sourceActionId: ActionId;
  readonly factionId: FactionId;
  readonly targetRegionId: RegionId;
  readonly resourceAmount: number;
  readonly createdAtTick: number;
}

export type FactionFundMovementCommitment =
  | (FactionFundMovementCommitmentBase & {
      readonly status: "active";
    })
  | (FactionFundMovementCommitmentBase & {
      readonly status: "resolved";
      readonly resolvedAtTick: number;
      readonly resolutionReason: FactionFundMovementResolutionReason;
    });

export function createDeterministicFactionFundMovementCommitmentId(
  actionId: ActionId,
): FactionFundMovementCommitmentId {
  return asFactionFundMovementCommitmentId(`fund-movement:${actionId}`);
}

export function deriveActiveFactionFundMovementCommitments(
  world: WorldState,
  factionId?: FactionId,
): readonly FactionFundMovementCommitment[] {
  return Object.values(world.factionFundMovementCommitments)
    .filter(
      (commitment) =>
        commitment.status === "active" &&
        (factionId === undefined || commitment.factionId === factionId),
    )
    .sort((first, second) =>
      first.id < second.id ? -1 : first.id > second.id ? 1 : 0,
    );
}

export function hasActiveFactionFundMovementCommitment(
  world: WorldState,
  factionId: FactionId,
  targetRegionId: RegionId,
  excludedCommitmentId?: FactionFundMovementCommitmentId,
): boolean {
  return deriveActiveFactionFundMovementCommitments(world, factionId).some(
    (commitment) =>
      commitment.id !== excludedCommitmentId &&
      commitment.targetRegionId === targetRegionId,
  );
}

/**
 * Available resources are a derived feasibility view. The faction stock is
 * never debited; active authored earmarks only reduce this projection.
 */
export function deriveFactionAvailableResources(
  world: WorldState,
  factionId: FactionId,
  excludedCommitmentId?: FactionFundMovementCommitmentId,
): number {
  const faction = world.factions[factionId];
  if (faction === undefined) {
    return 0;
  }

  const activeEarmark = deriveActiveFactionFundMovementCommitments(
    world,
    factionId,
  )
    .filter((commitment) => commitment.id !== excludedCommitmentId)
    .reduce((total, commitment) => total + commitment.resourceAmount, 0);

  return Math.max(0, faction.resources - activeEarmark);
}
