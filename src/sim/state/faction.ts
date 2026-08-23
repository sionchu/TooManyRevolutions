import type { CountryId, FactionId, IdeologyId } from "./ids";

export type FactionInterest =
  | "land"
  | "trade"
  | "labor"
  | "taxation"
  | "authority"
  | "religion"
  | "security";

/** Static scenario capability used by the T018 political-crisis detector. */
export const POLITICAL_CRISIS_CAPABILITIES = ["coup", "rebellion"] as const;

export type PoliticalCrisisCapability =
  (typeof POLITICAL_CRISIS_CAPABILITIES)[number];

export type FactionStrategy =
  | "wait"
  | "accept"
  | "protest"
  | "strike"
  | "bargain"
  | "lobby"
  | "organize"
  | "hoard"
  | "fundMovement"
  | "supportCoup"
  | "compromise"
  | "defect";

export interface Faction {
  readonly id: FactionId;
  readonly name: string;
  readonly countryId: CountryId;
  readonly interests: readonly FactionInterest[];
  readonly resources: number;
  readonly organization: number;
  readonly influence: number;
  readonly grievance: number;
  readonly ideologyAffinity: Readonly<Record<IdeologyId, number>>;
  readonly foreignLinks: Readonly<Record<CountryId, number>>;
  readonly currentStrategy: FactionStrategy;
}
