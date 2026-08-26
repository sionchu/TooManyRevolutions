import { describe, expect, it } from "vitest";

import { deriveNationalAgendas } from "../sim/readModels/agenda";
import type { GameEvent } from "../sim/events/event";
import { evaluateInterventionFeasibility } from "../sim/state/intervention";
import type { Faction } from "../sim/state/faction";
import type { CountryId, InterventionId } from "../sim/state/ids";
import { GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS } from "../sim/state/gameBuildersDecisionCatalog";
import { GAMEBUILDERS_DEMO_SCENARIO } from "../sim/state/gameBuildersDemoScenario";
import {
  advanceDemoRecord,
  createDemoRunRecord,
  submitIntervention,
} from "./demoGame";
import type { RunRecord } from "../sim/core/step";

const CHECKPOINTS = [0, 90, 180, 360, 720, 1080, 1800, 3600, 7200] as const;
const ROUTINE_EVENT_TYPES = new Set([
  "TICK_ADVANCED",
  "RESOURCE_PRODUCED",
  "TREASURY_CHANGED",
  "NATIONAL_PRODUCTION_CHANGED",
]);
const POLITICAL_REASSESSMENT_TYPES = new Set([
  "FACTION_STRATEGY_CHANGED",
  "IDEOLOGY_SUPPORT_CHANGED",
  "IDEOLOGY_RADICALISM_CHANGED",
  "IDEOLOGY_ORGANIZATION_CHANGED",
  "POLITICAL_PROPOSAL_OPENED",
  "POLITICAL_PROPOSAL_ACCEPTED",
  "POLITICAL_PROPOSAL_REJECTED",
  "POLITICAL_PROPOSAL_RESPONSE_REJECTED",
  "INTERVENTION_STARTED",
  "INTERVENTION_REJECTED",
  "INTERVENTION_COMPLETED",
  "COUP_ATTEMPT_STARTED",
  "REBELLION_STARTED",
  "CONFLICT_RESOLVED",
  "GOVERNMENT_TRANSITIONED",
  "LAND_HEX_CONTROL_CHANGED",
  "REGION_UNREST_BAND_CHANGED",
  "NATIONAL_INSTABILITY_BAND_CHANGED",
  "STRIKE_STARTED",
  "TRADE_DISRUPTED",
  "CIVIL_WAR_STARTED",
  "ORDER_CONSOLIDATION_STARTED",
  "ORDER_CONSOLIDATED",
  "STATE_DISSOLVED",
]);

const TRAJECTORIES: ReadonlyArray<{
  readonly id: string;
  readonly actionId?: InterventionId;
  readonly description: string;
}> = [
  { id: "A-no-action", description: "no player action" },
  {
    id: "B-material-relief",
    actionId:
      GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS.emergencyFoodDistribution,
    description: "material/economic relief-oriented response",
  },
  {
    id: "C-political-accommodation",
    actionId: GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS.politicalAccommodation,
    description: "political accommodation response",
  },
  {
    id: "D-legalization",
    actionId: GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS.oppositionLegalization,
    description: "legalization-oriented response",
  },
  {
    id: "E-coercive-restriction",
    actionId:
      GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS.coercivePoliticalRestriction,
    description: "coercive/restrictive response",
  },
];

type HorizonCheckpoint = {
  readonly requestedDay: number;
  readonly actualDay: number;
  readonly runOutcome: string;
  readonly activeConflicts: readonly string[];
  readonly agendas: {
    readonly count: number;
    readonly highestSeverity: number;
    readonly highestSeverityBand: string | null;
  };
  readonly actionAvailability: {
    readonly availableCount: number;
    readonly availableIds: readonly string[];
  };
  readonly meaningfulEventDensitySincePrevious: number;
  readonly lastMeaningfulPoliticalEventTick: number | null;
  readonly country: {
    readonly treasury: number;
    readonly legitimacy: number;
    readonly stateCapacity: number;
    readonly instability: number;
    readonly stateContinuity: number;
  } | null;
  readonly factions: readonly {
    readonly id: string;
    readonly grievance: number;
    readonly organization: number;
    readonly currentStrategy: Faction["currentStrategy"];
  }[];
  readonly territorialControl: Readonly<Record<string, number>>;
  readonly activeConflictFronts: readonly string[];
  readonly interactionState:
    | "interactive alive"
    | "temporarily quiet"
    | "structurally stalled"
    | "terminal";
};

type HorizonTrajectory = {
  readonly id: string;
  readonly description: string;
  readonly submittedAction: string | null;
  readonly actionResult: string | null;
  readonly checkpoints: readonly HorizonCheckpoint[];
};

function isMeaningfulEvent(event: GameEvent): boolean {
  return !ROUTINE_EVENT_TYPES.has(event.type);
}

function deriveCheckpoint(
  record: RunRecord,
  requestedDay: number,
  previousDay: number,
): HorizonCheckpoint {
  const playerCountryId =
    GAMEBUILDERS_DEMO_SCENARIO.playerCountryId as CountryId;
  const country = record.world.countries[playerCountryId];
  const agendas = deriveNationalAgendas({
    scenario: GAMEBUILDERS_DEMO_SCENARIO,
    world: record.world,
    recentEvents: record.eventStore.events,
  });
  const availableIds = Object.values(
    GAMEBUILDERS_DEMO_SCENARIO.interventionCatalog,
  )
    .filter(
      (definition) =>
        evaluateInterventionFeasibility({
          scenario: GAMEBUILDERS_DEMO_SCENARIO,
          world: record.world,
          interventionId: definition.id,
          countryId: playerCountryId,
        }).feasible,
    )
    .map((definition) => definition.id)
    .sort();
  const activeConflicts = Object.values(record.world.conflicts)
    .filter((conflict) => conflict.status === "active")
    .sort((first, second) => first.id.localeCompare(second.id));
  const meaningfulEvents = record.eventStore.events.filter(
    (event) =>
      event.tick > previousDay &&
      event.tick <= record.world.tick &&
      isMeaningfulEvent(event),
  );
  const politicalEvents = record.eventStore.events.filter(
    (event) =>
      event.tick <= record.world.tick &&
      POLITICAL_REASSESSMENT_TYPES.has(event.type),
  );
  const territorialControl = Object.values(record.world.landHexStates).reduce(
    (counts, state) => {
      counts[state.controller.kind] = (counts[state.controller.kind] ?? 0) + 1;
      return counts;
    },
    {} as Record<string, number>,
  );
  const activeConflictFronts = activeConflicts.flatMap((conflict) =>
    conflict.contestedRegionIds.map(
      (regionId) => `${conflict.kind}:${regionId}`,
    ),
  );
  const highestAgenda = agendas.reduce<{
    readonly severity: number;
    readonly severityBand: string | undefined;
  }>(
    (highest, agenda) =>
      agenda.severity > highest.severity
        ? { severity: agenda.severity, severityBand: agenda.severityBand }
        : highest,
    { severity: 0, severityBand: undefined as string | undefined },
  );
  const activeOrTerminal = record.world.run.outcome.status;
  const interactionState =
    activeOrTerminal !== "active"
      ? "terminal"
      : meaningfulEvents.length > 0 || availableIds.length > 0
        ? "interactive alive"
        : record.world.tick >= 1800
          ? "structurally stalled"
          : "temporarily quiet";

  return {
    requestedDay,
    actualDay: record.world.tick,
    runOutcome: activeOrTerminal,
    activeConflicts: activeConflicts.map(
      (conflict) => `${conflict.kind}:${conflict.status}`,
    ),
    agendas: {
      count: agendas.length,
      highestSeverity: highestAgenda.severity,
      highestSeverityBand: highestAgenda.severityBand ?? null,
    },
    actionAvailability: {
      availableCount: availableIds.length,
      availableIds,
    },
    meaningfulEventDensitySincePrevious: meaningfulEvents.length,
    lastMeaningfulPoliticalEventTick:
      politicalEvents.length === 0
        ? null
        : (politicalEvents[politicalEvents.length - 1]?.tick ?? null),
    country:
      country === undefined
        ? null
        : {
            treasury: country.treasury,
            legitimacy: country.legitimacy,
            stateCapacity: country.stateCapacity,
            instability: country.instability,
            stateContinuity: country.stateContinuity,
          },
    factions: Object.values(record.world.factions)
      .filter((faction) => faction.countryId === playerCountryId)
      .sort((first, second) => first.id.localeCompare(second.id))
      .map((faction) => ({
        id: faction.id,
        grievance: faction.grievance,
        organization: faction.organization,
        currentStrategy: faction.currentStrategy,
      })),
    territorialControl,
    activeConflictFronts,
    interactionState,
  };
}

function auditTrajectory(
  trajectory: (typeof TRAJECTORIES)[number],
): HorizonTrajectory {
  let record = createDemoRunRecord();
  let previousDay = 0;
  let submittedAction: string | null = null;
  let actionResult: string | null = null;
  const checkpoints: HorizonCheckpoint[] = [];

  for (const checkpoint of CHECKPOINTS) {
    while (
      record.world.tick < checkpoint &&
      record.world.run.outcome.status === "active"
    ) {
      if (record.world.tick === 0 && trajectory.actionId !== undefined) {
        const beforeEventCount = record.eventStore.events.length;
        record = submitIntervention(record, trajectory.actionId);
        submittedAction = trajectory.actionId;
        const actionEvents = record.eventStore.events.slice(beforeEventCount);
        actionResult = actionEvents.some(
          (event) => event.type === "INTERVENTION_STARTED",
        )
          ? "accepted / INTERVENTION_STARTED"
          : actionEvents.some((event) => event.type === "INTERVENTION_REJECTED")
            ? "rejected / INTERVENTION_REJECTED"
            : "no explicit intervention result";
      } else {
        record = advanceDemoRecord(record, 1);
      }
    }
    checkpoints.push(deriveCheckpoint(record, checkpoint, previousDay));
    previousDay = record.world.tick;
  }

  return {
    id: trajectory.id,
    description: trajectory.description,
    submittedAction,
    actionResult,
    checkpoints,
  };
}

describe("GameBuilders deterministic horizon audit", () => {
  it.each(TRAJECTORIES)(
    "records $id through every required 20-year checkpoint",
    (trajectory) => {
      const report = auditTrajectory(trajectory);

      expect(report.checkpoints).toHaveLength(CHECKPOINTS.length);
      expect(
        report.checkpoints.map((checkpoint) => checkpoint.actualDay),
      ).toEqual([...CHECKPOINTS]);
      if (trajectory.id === TRAJECTORIES[0]!.id) {
        expect(auditTrajectory(trajectory)).toEqual(report);
      }
      console.log(
        "GAMEBUILDERS_HORIZON_AUDIT_TRAJECTORY",
        JSON.stringify({
          id: report.id,
          submittedAction: report.submittedAction,
          actionResult: report.actionResult,
          checkpoints: report.checkpoints.map((checkpoint) => ({
            day: checkpoint.actualDay,
            outcome: checkpoint.runOutcome,
            conflicts: checkpoint.activeConflicts,
            agendas: `${checkpoint.agendas.count}/${checkpoint.agendas.highestSeverityBand ?? "none"}/${checkpoint.agendas.highestSeverity.toFixed(3)}`,
            availableActions: checkpoint.actionAvailability.availableCount,
            eventDensity: checkpoint.meaningfulEventDensitySincePrevious,
            control: checkpoint.territorialControl,
            fronts: checkpoint.activeConflictFronts,
            state: checkpoint.interactionState,
          })),
        }),
      );
    },
    240_000,
  );
});
