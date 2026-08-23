import type { CountryId, GovernmentId, PolicyId } from "./ids";
import type { PolicyState } from "./policy";

/** The authority relation of a government, independent of state continuity. */
export type GovernmentAuthority = "central" | "contender" | "exile";

export interface Government {
  readonly id: GovernmentId;
  readonly countryId: CountryId;
  readonly name: string;
  readonly authority: GovernmentAuthority;
  readonly formedAtTick: number;
}

/**
 * Presentation/history classification derived from institutional policy state.
 * It is deliberately not stored as authoritative WorldState data.
 */
export type RegimeClassification =
  | "monarchy"
  | "republic"
  | "democracy"
  | "communism"
  | "dictatorship"
  | "theocracy"
  | "other";

export interface DerivedRegimeClassification {
  readonly classification: RegimeClassification;
  readonly institutionPolicyIds: readonly PolicyId[];
}

/**
 * Derive a coarse historical label from the resolved institutional state.
 * The label is presentation/history data; it is never written to WorldState.
 */
export function deriveRegimeClassification(
  policyState: Pick<PolicyState, "activePolicyIds" | "institutionalRules">,
): DerivedRegimeClassification {
  const { institutionalRules: rules } = policyState;
  let classification: RegimeClassification = "other";

  if (
    rules.productiveProperty === "publicOnly" &&
    (rules.landOwnership === "state" || rules.landOwnership === "communal")
  ) {
    classification = "communism";
  } else if (rules.rulerVeto && !rules.legislatureRequired) {
    classification = "monarchy";
  } else if (
    !rules.rulerVeto &&
    rules.legislatureRequired &&
    (rules.suffrage === "broad" || rules.suffrage === "universal")
  ) {
    classification = "democracy";
  } else if (!rules.rulerVeto && rules.legislatureRequired) {
    classification = "republic";
  }

  return {
    classification,
    institutionPolicyIds: [...policyState.activePolicyIds],
  };
}
