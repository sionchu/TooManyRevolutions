import type { CountryId, GovernmentId, RegionId } from "./ids";

export interface DiplomaticRelation {
  readonly opinion: number;
  readonly tradeDependence: number;
  readonly borderThreat: number;
  readonly ideologicalThreat: number;
}

export interface Country {
  /** Stable historical continuity of a state, not its current government. */
  readonly id: CountryId;
  readonly name: string;
  readonly currentGovernmentId: GovernmentId | null;
  readonly treasury: number;
  /** Realized currency income from the most recently completed day. */
  readonly dailyIncome: number;
  /** Configured state expenditure paid each simulation day. */
  readonly dailyExpenditure: number;
  readonly legitimacy: number;
  readonly stateCapacity: number;
  readonly production: number;
  readonly militaryPower: number;
  readonly instability: number;
  readonly stateContinuity: number;
  readonly capitalRegionId: RegionId | null;
  readonly diplomacy: Readonly<Record<CountryId, DiplomaticRelation>>;
}
