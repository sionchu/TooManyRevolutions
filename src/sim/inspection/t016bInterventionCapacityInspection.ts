import { runSimulationStep } from "../core/tick";
import {
  acceptActionProposal,
  createStartInterventionActionProposal,
} from "../state/action";
import {
  deriveAdministrativeHeadroom,
  deriveAdministrativeOverload,
  deriveCommittedAdministrativeLoad,
  evaluateInterventionFeasibility,
  type InterventionCommitment,
  type InterventionFeasibilityResult,
} from "../state/intervention";
import {
  INTERVENTION_FIXTURE_IDS,
  createInterventionFixtureScenario,
} from "../state/interventionFixture";
import {
  asActionId,
  asInterventionCommitmentId,
  type CountryId,
  type InterventionId,
} from "../state/ids";
import type { ScenarioDefinition } from "../state/scenario";
import { createInitialWorldState, type WorldState } from "../state/world";
import { createInterventionPhaseHooks } from "../systems/interventionHooks";

function requirePlayerCountryId(scenario: ScenarioDefinition): CountryId {
  if (scenario.playerCountryId === null) {
    throw new Error("T016B fixture must define a player country.");
  }

  return scenario.playerCountryId;
}

const PLAYER_COUNTRY_ID = requirePlayerCountryId(
  createInterventionFixtureScenario(),
);

function createActiveCommitment(
  id: string,
  interventionId: InterventionId,
  administrativeLoad: number,
  completionTick: number,
): InterventionCommitment {
  const commitmentId = asInterventionCommitmentId(id);
  return {
    id: commitmentId,
    interventionId,
    countryId: PLAYER_COUNTRY_ID,
    sourceActionId: asActionId(`t016b-inspection:${id}`),
    startedTick: 0,
    firstOccupiedTick: 0,
    completionTick,
    administrativeLoad,
  };
}

function withCommitments(
  world: WorldState,
  commitments: readonly InterventionCommitment[],
): WorldState {
  return {
    ...world,
    interventionCommitments: Object.fromEntries(
      commitments.map((commitment) => [commitment.id, commitment]),
    ),
  } as WorldState;
}

function withLegislatureRequired(world: WorldState): WorldState {
  const policyState = world.policies[PLAYER_COUNTRY_ID];
  if (policyState === undefined) {
    throw new Error("T016B fixture policy state is missing.");
  }

  return {
    ...world,
    policies: {
      ...world.policies,
      [PLAYER_COUNTRY_ID]: {
        ...policyState,
        institutionalRules: {
          ...policyState.institutionalRules,
          legislatureRequired: true,
        },
      },
    },
  };
}

function startAction(world: WorldState, interventionId: InterventionId) {
  return acceptActionProposal(
    createStartInterventionActionProposal(
      world.tick + 1,
      "player",
      interventionId,
      PLAYER_COUNTRY_ID,
    ),
    world.run.nextActionSequence,
  );
}

function metricRow(world: WorldState): T016BInterventionMetricRow {
  return {
    tick: world.tick,
    treasury: world.countries[PLAYER_COUNTRY_ID]?.treasury ?? 0,
    stateCapacity: world.countries[PLAYER_COUNTRY_ID]?.stateCapacity ?? 0,
    committedAdministrativeLoad: deriveCommittedAdministrativeLoad(
      world,
      PLAYER_COUNTRY_ID,
    ),
    administrativeHeadroom: deriveAdministrativeHeadroom(
      world,
      PLAYER_COUNTRY_ID,
    ),
    administrativeOverload: deriveAdministrativeOverload(
      world,
      PLAYER_COUNTRY_ID,
    ),
    activeCommitmentIds: Object.values(world.interventionCommitments)
      .filter((commitment) => commitment.countryId === PLAYER_COUNTRY_ID)
      .map((commitment) => commitment.id)
      .sort(),
  };
}

export interface T016BInterventionMetricRow {
  readonly tick: number;
  readonly treasury: number;
  readonly stateCapacity: number;
  readonly committedAdministrativeLoad: number;
  readonly administrativeHeadroom: number;
  readonly administrativeOverload: number;
  readonly activeCommitmentIds: readonly string[];
}

export interface T016BInterventionCapacityInspectionReport {
  readonly scenario: ScenarioDefinition;
  readonly initial: T016BInterventionMetricRow;
  readonly afterLongStart: T016BInterventionMetricRow;
  readonly afterRejectedRequest: T016BInterventionMetricRow;
  readonly afterLongCompletion: T016BInterventionMetricRow;
  readonly longFeasibility: InterventionFeasibilityResult;
  readonly rejectedFeasibility: InterventionFeasibilityResult;
  readonly counterexample: {
    readonly metrics: T016BInterventionMetricRow;
    readonly feasibility: InterventionFeasibilityResult;
    readonly eventTypes: readonly string[];
  };
  readonly eventTypes: readonly string[];
}

/** Run the T016B capacity scenario through the real authoritative pipeline. */
export function runT016BInterventionCapacityInspection(): T016BInterventionCapacityInspectionReport {
  const scenario = createInterventionFixtureScenario();
  let initialWorld = createInitialWorldState(scenario, 20260822);
  initialWorld = withLegislatureRequired(initialWorld);
  initialWorld = withCommitments(initialWorld, [
    createActiveCommitment(
      "t016b-active-short",
      INTERVENTION_FIXTURE_IDS.short,
      12,
      1000,
    ),
    createActiveCommitment(
      "t016b-active-long",
      INTERVENTION_FIXTURE_IDS.long,
      15,
      1000,
    ),
  ]);

  const hooks = createInterventionPhaseHooks(scenario);
  const longAction = startAction(
    initialWorld,
    INTERVENTION_FIXTURE_IDS.prerequisite,
  );
  const afterLongStartResult = runSimulationStep(
    initialWorld,
    { actions: [longAction] },
    hooks,
  );
  const afterLongStart = afterLongStartResult.nextWorld;

  const rejectedAction = startAction(
    afterLongStart,
    INTERVENTION_FIXTURE_IDS.long,
  );
  const rejectedFeasibility = evaluateInterventionFeasibility({
    scenario,
    world: afterLongStart,
    interventionId: INTERVENTION_FIXTURE_IDS.long,
    countryId: PLAYER_COUNTRY_ID,
  });
  const afterRejectedRequestResult = runSimulationStep(
    afterLongStart,
    { actions: [rejectedAction] },
    hooks,
  );
  const afterRejectedRequest = afterRejectedRequestResult.nextWorld;

  let afterLongCompletion = afterRejectedRequest;
  let completionEvents = afterRejectedRequestResult.emittedEvents;
  while (afterLongCompletion.tick < 181) {
    const result = runSimulationStep(
      afterLongCompletion,
      { actions: [] },
      hooks,
    );
    afterLongCompletion = result.nextWorld;
    completionEvents = result.emittedEvents;
  }

  const counterexampleWorld = withCommitments(
    {
      ...initialWorld,
      countries: {
        ...initialWorld.countries,
        [PLAYER_COUNTRY_ID]: {
          ...initialWorld.countries[PLAYER_COUNTRY_ID]!,
          stateCapacity: 40,
        },
      },
    },
    [
      createActiveCommitment(
        "t016b-overloaded-a",
        INTERVENTION_FIXTURE_IDS.short,
        25,
        1000,
      ),
      createActiveCommitment(
        "t016b-overloaded-b",
        INTERVENTION_FIXTURE_IDS.long,
        25,
        1000,
      ),
    ],
  );
  const counterexampleAction = startAction(
    counterexampleWorld,
    INTERVENTION_FIXTURE_IDS.short,
  );
  const counterexampleResult = runSimulationStep(
    counterexampleWorld,
    { actions: [counterexampleAction] },
    hooks,
  );
  const counterexampleFeasibility = evaluateInterventionFeasibility({
    scenario,
    world: counterexampleWorld,
    interventionId: INTERVENTION_FIXTURE_IDS.short,
    countryId: PLAYER_COUNTRY_ID,
  });

  return {
    scenario,
    initial: metricRow(initialWorld),
    afterLongStart: metricRow(afterLongStart),
    afterRejectedRequest: metricRow(afterRejectedRequest),
    afterLongCompletion: metricRow(afterLongCompletion),
    longFeasibility: evaluateInterventionFeasibility({
      scenario,
      world: initialWorld,
      interventionId: INTERVENTION_FIXTURE_IDS.prerequisite,
      countryId: PLAYER_COUNTRY_ID,
    }),
    rejectedFeasibility,
    counterexample: {
      metrics: metricRow(counterexampleWorld),
      feasibility: counterexampleFeasibility,
      eventTypes: counterexampleResult.emittedEvents.map((event) => event.type),
    },
    eventTypes: [
      ...afterLongStartResult.emittedEvents,
      ...afterRejectedRequestResult.emittedEvents,
      ...completionEvents,
    ].map((event) => event.type),
  };
}

function formatMetrics(row: T016BInterventionMetricRow): string {
  return `| Day ${row.tick} | ${row.treasury.toFixed(0)} | ${row.stateCapacity.toFixed(0)} | ${row.committedAdministrativeLoad.toFixed(0)} | ${row.administrativeHeadroom.toFixed(0)} | ${row.administrativeOverload.toFixed(0)} | ${row.activeCommitmentIds.join(", ") || "없음"} |`;
}

function reasonLabels(result: InterventionFeasibilityResult): string {
  return result.feasible
    ? "가능"
    : result.reasons.map((reason) => reason.kind).join(", ");
}

/** Compact Korean inspection output for the T016B checkpoint. */
export function formatT016BInterventionCapacityInspection(
  report: T016BInterventionCapacityInspectionReport,
): string {
  const lines = [
    "# T016B Intervention Capacity Inspection Output",
    "",
    "- Scenario: fixture-only administrative interventions; no production gameplay content",
    "- Calendar: one authoritative tick = one day",
    "",
    "## Capacity / treasury timeline",
    "",
    "| 시점 | 국고 | 국가역량 | committed load | headroom | overload | active commitments |",
    "|---|---:|---:|---:|---:|---:|---|",
    formatMetrics(report.initial),
    formatMetrics(report.afterLongStart),
    formatMetrics(report.afterRejectedRequest),
    formatMetrics(report.afterLongCompletion),
    "",
    "## Requests",
    "",
    "| request | feasibility | result |",
    "|---|---|---|",
    `| C prerequisite / long program | ${reasonLabels(report.longFeasibility)} | accepted; load occupies until completion |`,
    `| D long program while headroom is 13 | ${reasonLabels(report.rejectedFeasibility)} | rejected; no commitment and no cost |`,
    `| overload counterexample | ${reasonLabels(report.counterexample.feasibility)} | existing commitments persist; new start rejected |`,
    "",
    "## Intervention-related events",
    "",
    `- ${report.eventTypes.join(" → ")}`,
    `- counterexample: ${report.counterexample.eventTypes.join(" → ")}`,
  ];

  return lines.join("\n");
}
