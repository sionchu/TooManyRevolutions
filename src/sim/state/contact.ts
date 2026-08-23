import type { ContactEdgeId, CountryId } from "./ids";

/** Mutable run-time overlay for one scenario-owned contact edge. */
export interface ContactEdgeRuntimeState {
  readonly enabled: boolean;
  /** Non-negative finite multiplier; effective strength is clamped to 0–1. */
  readonly multiplier: number;
  /** Optional causal/debug label for a later blocking system. */
  readonly blockedReason?: string;
  /** Country that owns a diplomatic closure, when applicable. */
  readonly blockedByCountryId?: CountryId;
}

export type ContactEdgeRuntimeStateMap = Readonly<
  Record<ContactEdgeId, ContactEdgeRuntimeState>
>;
