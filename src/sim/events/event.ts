import type { JsonValue } from "../core/serialization";
import { asEventId, type EntityId, type EventId } from "../state/ids";

export const GAME_EVENT_TYPES = [
  "TICK_ADVANCED",
  "POLICY_ENACTED",
  "POLICY_REJECTED",
  "INSTITUTION_RULE_CHANGED",
  "INTERVENTION_STARTED",
  "INTERVENTION_REJECTED",
  "INTERVENTION_COMPLETED",
  "IDEOLOGY_DIFFUSED",
  "IDEOLOGY_SUPPORT_CHANGED",
  "IDEOLOGY_RADICALISM_CHANGED",
  "IDEOLOGY_ORGANIZATION_CHANGED",
  "FACTION_STRATEGY_CHANGED",
  "FACTION_FUND_MOVEMENT_COMMITTED",
  "FACTION_FUND_MOVEMENT_RESOLVED",
  "POLITICAL_PROPOSAL_OPENED",
  "POLITICAL_PROPOSAL_ACCEPTED",
  "POLITICAL_PROPOSAL_REJECTED",
  "POLITICAL_PROPOSAL_RESPONSE_REJECTED",
  "COUP_COORDINATION_NODE_RESPONDED",
  "REGION_UNREST_BAND_CHANGED",
  "NATIONAL_INSTABILITY_BAND_CHANGED",
  "SUPPORT_SHIFTED",
  "ORGANIZATION_INCREASED",
  "STRIKE_STARTED",
  "TRADE_DISRUPTED",
  "FOREIGN_SUPPORT_SENT",
  "RESOURCE_PRODUCED",
  "RESOURCE_SHORTAGE_CHANGED",
  "TREASURY_CHANGED",
  "NATIONAL_PRODUCTION_CHANGED",
  "LAND_HEX_CONTROL_CHANGED",
  "COUP_ATTEMPT_STARTED",
  "REBELLION_STARTED",
  "BORDER_CLOSED",
  "BORDER_REOPENED",
  "FOREIGN_ACTION_REJECTED",
  "CONFLICT_RESOLVED",
  "GOVERNMENT_TRANSITIONED",
  "CIVIL_WAR_STARTED",
  "ORDER_CONSOLIDATION_STARTED",
  "ORDER_CONSOLIDATED",
  "STATE_DISSOLVED",
] as const;

export type GameEventType = (typeof GAME_EVENT_TYPES)[number];

export type EventVisibility = "hidden" | "world" | "important";

/** Deterministic and collision-safe within a run when sequence is globally unique. */
export function createDeterministicEventId(
  tick: number,
  sequence: number,
  type: GameEventType,
): EventId {
  if (
    !Number.isInteger(tick) ||
    tick < 0 ||
    !Number.isInteger(sequence) ||
    sequence < 0
  ) {
    throw new Error("Event tick and sequence must be non-negative integers.");
  }

  return asEventId(`event:${tick}:${sequence}:${type}`);
}

export interface GameEvent<TPayload extends JsonValue = JsonValue> {
  readonly id: EventId;
  readonly tick: number;
  /** Globally increasing emitted-event order for this run. */
  readonly sequence: number;
  readonly type: GameEventType;
  readonly actorId?: EntityId;
  readonly targetId?: EntityId;
  readonly causeIds: readonly EventId[];
  readonly payload: TPayload;
  readonly visibility: EventVisibility;
}

export interface CreateGameEventInput<TPayload extends JsonValue = JsonValue> {
  readonly tick: number;
  readonly sequence: number;
  readonly type: GameEventType;
  readonly actorId?: EntityId;
  readonly targetId?: EntityId;
  readonly causeIds: readonly EventId[];
  readonly payload: TPayload;
  readonly visibility: EventVisibility;
}

export function createGameEvent<TPayload extends JsonValue>(
  input: CreateGameEventInput<TPayload>,
): GameEvent<TPayload> {
  return {
    ...input,
    id: createDeterministicEventId(input.tick, input.sequence, input.type),
    causeIds: [...input.causeIds],
  };
}
