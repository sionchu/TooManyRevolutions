import type { ActionRecord } from "./action";
import type { CountryId, EventId, ScenarioId } from "./ids";

export type SovereignFunction =
  | "civilAdministration"
  | "fiscalAuthority"
  | "externalDiplomacy"
  | "securityCommand";

export type StateDissolutionReason =
  | "fullAnnexation"
  | "permanentFragmentation"
  | "lossOfSovereignFunctions"
  | "stateContinuityThreshold";

/** Only a state dissolution can represent a terminal defeat. */
export type RunOutcome =
  | { readonly status: "active" }
  | {
      readonly status: "won";
      readonly kind: "orderConsolidated";
      readonly atTick: number;
      readonly causeEventId: EventId;
    }
  | {
      readonly status: "defeated";
      readonly kind: "stateDissolved";
      readonly countryId: CountryId;
      readonly reason: StateDissolutionReason;
      readonly atTick: number;
      readonly causeEventId: EventId;
    };

export type RunStatus = RunOutcome["status"];

/** Current evaluation only; ScenarioDefinition owns the criteria themselves. */
export interface OrderConsolidationProgress {
  readonly isCurrentlyEligible: boolean;
  readonly consecutiveEligibleTicks: number;
  readonly lastEvaluatedTick: number | null;
}

export interface RunState {
  readonly scenarioId: ScenarioId;
  readonly scenarioVersion: number;
  readonly simulationVersion: number;
  readonly seed: number;
  readonly outcome: RunOutcome;
  readonly consolidation: OrderConsolidationProgress;
  readonly actionLog: readonly ActionRecord[];
  /** Next globally unique append-only action order in this run. */
  readonly nextActionSequence: number;
  /** Next globally unique emitted-event order in this run. */
  readonly nextEventSequence: number;
}
