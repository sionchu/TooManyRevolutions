import { createSimDate } from "../core/clock";
import type { SimulationPhaseHook, SimulationPhaseHooks } from "../core/step";
import { runSimulationStep } from "../core/tick";
import {
  CONTACT_FIXTURE_COUNTRY_IDS,
  CONTACT_FIXTURE_EDGE_IDS,
  CONTACT_FIXTURE_REGION_IDS,
  createContactFixtureScenario,
} from "../state/contactFixture";
import type { Country } from "../state/country";
import { asContactEdgeId, asEventId } from "../state/ids";
import type { ScenarioDefinition } from "../state/scenario";
import { createInitialWorldState, type WorldState } from "../state/world";
import {
  acceptDiplomacyActionProposal,
  chooseForeignActionProposal,
  deriveForeignStateObservation,
  deriveForeignStateObservations,
  runDiplomacyPhase,
} from "../systems/diplomacy";

export interface T019InspectionCheck {
  readonly id: string;
  readonly passed: boolean;
  readonly detail: string;
}

export interface T019InspectionCase {
  readonly label: string;
  readonly actorCountryId: string;
  readonly decision: string;
  readonly targetCountryId?: string;
}

export interface T019DiplomacyInspectionReport {
  readonly scenarioId: string;
  readonly foreignCountryIds: readonly string[];
  readonly cadence: string;
  readonly cases: readonly T019InspectionCase[];
  readonly directedChecks: {
    readonly actorToTargetClosed: boolean;
    readonly reverseEdgeChanged: boolean;
    readonly staticTopologyChanged: boolean;
  };
  readonly actionPipelinePassed: boolean;
  readonly foreignToForeignPassed: boolean;
  readonly stableOrderingPassed: boolean;
  readonly t020IdeologyMotiveUsed: boolean;
  readonly foreignFactionSupportMutated: boolean;
  readonly territorialMutation: boolean;
  readonly terminalPassed: boolean;
  readonly checks: readonly T019InspectionCheck[];
}

const NOOP_PHASE: SimulationPhaseHook = (context) => ({
  nextWorld: context.world,
  emittedEvents: [],
  nextEventSequence: context.nextEventSequence,
});

const DIPLOMACY_ONLY_HOOKS: SimulationPhaseHooks = {
  applyScheduledEffects: NOOP_PHASE,
  resolveValidatedActions: NOOP_PHASE,
  economy: NOOP_PHASE,
  resources: NOOP_PHASE,
  ideologyDiffusion: NOOP_PHASE,
  factionPressure: NOOP_PHASE,
  instability: NOOP_PHASE,
  diplomacy: runDiplomacyPhase,
  conflict: NOOP_PHASE,
  evaluateOrderConsolidationAndDissolution: NOOP_PHASE,
  eventFinalization: NOOP_PHASE,
  snapshotHook: NOOP_PHASE,
};

function createInspectionScenario(): ScenarioDefinition {
  return {
    ...createContactFixtureScenario(),
    initialDate: createSimDate(1, 1, 1),
  };
}

function createMonthlyInspectionScenario(): ScenarioDefinition {
  return {
    ...createInspectionScenario(),
    initialDate: createSimDate(1, 1, 30),
  };
}

function addForeignToForeignBorder(
  scenario: ScenarioDefinition,
): ScenarioDefinition {
  return {
    ...scenario,
    mapContactTopology: {
      ...scenario.mapContactTopology,
      contactEdges: [
        ...scenario.mapContactTopology.contactEdges,
        {
          id: asContactEdgeId("t019.merchant-to-monarchy-border"),
          fromRegionId: CONTACT_FIXTURE_REGION_IDS.merchantPort,
          toRegionId: CONTACT_FIXTURE_REGION_IDS.monarchyBorder,
          channel: "border",
          baseStrength: 0.5,
        },
      ],
    },
  };
}

function updateCountry(
  world: WorldState,
  countryId: Country["id"],
  patch: Partial<Country>,
): WorldState {
  const country = world.countries[countryId];
  if (country === undefined) {
    throw new Error(`T019 inspection country ${countryId} is missing.`);
  }

  return {
    ...world,
    countries: {
      ...world.countries,
      [countryId]: { ...country, ...patch },
    },
  };
}

function runDiplomacyStep(
  scenario: ScenarioDefinition,
  world: WorldState,
  actions: Parameters<typeof runSimulationStep>[1]["actions"] = [],
) {
  return runSimulationStep(world, { actions }, DIPLOMACY_ONLY_HOOKS, scenario);
}

function check(
  id: string,
  passed: boolean,
  detail: string,
): T019InspectionCheck {
  return { id, passed, detail };
}

export function runT019DiplomacyInspection(): T019DiplomacyInspectionReport {
  const scenario = createInspectionScenario();
  const initialWorld = createInitialWorldState(scenario, 19019);
  const stableProposal = chooseForeignActionProposal(
    scenario,
    initialWorld,
    CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
    1,
  );

  const weakWorld = updateCountry(
    initialWorld,
    CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
    { instability: 80 },
  );
  const closeProposal = chooseForeignActionProposal(
    scenario,
    weakWorld,
    CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
    1,
  );
  const closeAction = acceptDiplomacyActionProposal(closeProposal, 1, 0);
  const closedResult = runDiplomacyStep(scenario, weakWorld, [closeAction]);

  const recoveredWorld = updateCountry(
    closedResult.nextWorld,
    CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
    { instability: 0, legitimacy: 80, stateCapacity: 80 },
  );
  const reopenProposal = chooseForeignActionProposal(
    scenario,
    recoveredWorld,
    CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
    2,
  );

  const foreignScenario = addForeignToForeignBorder(scenario);
  const foreignWorld = updateCountry(
    createInitialWorldState(foreignScenario, 19019),
    CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
    { instability: 80 },
  );
  const foreignProposal = chooseForeignActionProposal(
    foreignScenario,
    foreignWorld,
    CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
    1,
  );
  const foreignAction = acceptDiplomacyActionProposal(foreignProposal, 1, 0);
  const foreignResult = runDiplomacyStep(foreignScenario, foreignWorld, [
    foreignAction,
  ]);

  const monthlyScenario = createMonthlyInspectionScenario();
  const monthlyWorld = createInitialWorldState(monthlyScenario, 19019);
  const monthlyResult = runDiplomacyStep(monthlyScenario, monthlyWorld);
  const reversedScenario: ScenarioDefinition = {
    ...monthlyScenario,
    initialCountries: [...monthlyScenario.initialCountries].reverse(),
    mapContactTopology: {
      ...monthlyScenario.mapContactTopology,
      contactEdges: [
        ...monthlyScenario.mapContactTopology.contactEdges,
      ].reverse(),
    },
  };
  const reversedWorld = createInitialWorldState(reversedScenario, 19019);
  const reversedResult = runDiplomacyStep(reversedScenario, reversedWorld);

  const topologyBefore = JSON.stringify(scenario.mapContactTopology);
  const landHexBefore = JSON.stringify(weakWorld.landHexStates);
  const regionsBefore = JSON.stringify(weakWorld.regions);
  const factionsBefore = JSON.stringify(weakWorld.factions);
  const staticWorldAfterClose = closedResult.nextWorld;
  const directedChecks = {
    actorToTargetClosed:
      staticWorldAfterClose.contactEdgeStates[
        CONTACT_FIXTURE_EDGE_IDS.monarchyToBorder
      ]?.enabled === false,
    reverseEdgeChanged:
      staticWorldAfterClose.contactEdgeStates[
        CONTACT_FIXTURE_EDGE_IDS.borderToMonarchy
      ] !== undefined,
    staticTopologyChanged:
      JSON.stringify(scenario.mapContactTopology) !== topologyBefore,
  };

  const actionPipelinePassed =
    closedResult.nextWorld.run.actionLog.length === 1 &&
    closedResult.nextWorld.run.actionLog[0]?.id === closeAction.id &&
    closeAction.source === "heuristic" &&
    closedResult.emittedEvents.some(
      (event) => event.type === "BORDER_CLOSED" && event.causeIds.length === 0,
    );
  const foreignToForeignPassed =
    foreignProposal.actionType === "CLOSE_BORDER" &&
    foreignProposal.payload.targetCountryId ===
      CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy &&
    foreignResult.nextWorld.contactEdgeStates[
      asContactEdgeId("t019.merchant-to-monarchy-border")
    ]?.enabled === false;
  const stableOrderingPassed =
    JSON.stringify(monthlyResult.actionProposals) ===
    JSON.stringify(reversedResult.actionProposals);
  const absoluteObservation = deriveForeignStateObservation(
    scenario,
    initialWorld,
    CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
  );
  const t020IdeologyMotiveUsed = Object.prototype.hasOwnProperty.call(
    absoluteObservation,
    "ideology",
  );
  const terminalWorld: WorldState = {
    ...initialWorld,
    run: {
      ...initialWorld.run,
      outcome: {
        status: "won",
        kind: "orderConsolidated",
        atTick: 0,
        causeEventId: asEventId("event:0:0:ORDER_CONSOLIDATED"),
      },
    },
  };
  const terminalResult = runDiplomacyStep(scenario, terminalWorld);
  const terminalPassed =
    terminalResult.nextWorld === terminalWorld &&
    terminalResult.emittedEvents.length === 0 &&
    terminalResult.actionProposals.length === 0;

  const checks = [
    check(
      "A stable baseline",
      stableProposal.actionType === "WAIT",
      "안정적이고 열린 국경이 있어도 자동 외교 행동을 만들지 않는다.",
    ),
    check(
      "B domestic weakness",
      closeProposal.actionType === "CLOSE_BORDER" &&
        closeProposal.payload.targetCountryId ===
          CONTACT_FIXTURE_COUNTRY_IDS.player,
      "국내 불안과 실제 directed border route가 함께 있을 때만 국경 폐쇄를 제안한다.",
    ),
    check(
      "C recovered reopening",
      reopenProposal.actionType === "REOPEN_BORDER" &&
        reopenProposal.payload.targetCountryId ===
          CONTACT_FIXTURE_COUNTRY_IDS.player,
      "외교로 닫은 경로를 국가 상태 회복 후 다시 열 수 있다.",
    ),
    check(
      "D directed semantics",
      directedChecks.actorToTargetClosed &&
        !directedChecks.reverseEdgeChanged &&
        !directedChecks.staticTopologyChanged,
      "actor→target edge만 닫고 reverse edge와 static topology는 유지한다.",
    ),
    check(
      "E common action pipeline",
      actionPipelinePassed,
      "Foreign ActionProposal은 heuristic ActionRecord와 global sequence를 사용한다.",
    ),
    check(
      "F foreign-to-foreign",
      foreignToForeignPassed,
      "playerCountry를 hardcode하지 않고 foreign→foreign target을 처리한다.",
    ),
    check(
      "G stable order",
      stableOrderingPassed,
      "Country와 ContactEdge 삽입 순서가 proposal 순서를 바꾸지 않는다.",
    ),
    check(
      "H T020 separation",
      !t020IdeologyMotiveUsed,
      "T019 observation과 heuristic에 ideology/regime 이름 기반 motive가 없다.",
    ),
    check(
      "I authority boundary",
      JSON.stringify(staticWorldAfterClose.landHexStates) === landHexBefore &&
        JSON.stringify(staticWorldAfterClose.regions) === regionsBefore &&
        JSON.stringify(staticWorldAfterClose.factions) === factionsBefore,
      "diplomacy는 LandHex, Region, Faction state를 변경하지 않는다.",
    ),
    check(
      "J terminal behavior",
      terminalPassed,
      "terminal run은 proposal, mutation, event, clock advancement가 없다.",
    ),
  ];

  return {
    scenarioId: scenario.id,
    foreignCountryIds: deriveForeignStateObservations(
      scenario,
      initialWorld,
    ).map((observation) => observation.actorCountryId),
    cadence: "monthly",
    cases: [
      {
        label: "Case A — Stable state",
        actorCountryId: stableProposal.actorCountryId,
        decision: stableProposal.actionType,
      },
      {
        label: "Case B — Domestic instability + open border",
        actorCountryId: closeProposal.actorCountryId,
        decision: closeProposal.actionType,
        targetCountryId: closeProposal.payload.targetCountryId,
      },
      {
        label: "Case C — Recovered state",
        actorCountryId: reopenProposal.actorCountryId,
        decision: reopenProposal.actionType,
        targetCountryId: reopenProposal.payload.targetCountryId,
      },
      {
        label: "Case D — Foreign-to-foreign",
        actorCountryId: foreignProposal.actorCountryId,
        decision: foreignProposal.actionType,
        targetCountryId: foreignProposal.payload.targetCountryId,
      },
    ],
    directedChecks,
    actionPipelinePassed,
    foreignToForeignPassed,
    stableOrderingPassed,
    t020IdeologyMotiveUsed,
    foreignFactionSupportMutated:
      JSON.stringify(staticWorldAfterClose.factions) !== factionsBefore,
    territorialMutation:
      JSON.stringify(staticWorldAfterClose.landHexStates) !== landHexBefore,
    terminalPassed,
    checks,
  };
}

export function formatT019DiplomacyInspection(
  report: T019DiplomacyInspectionReport,
): string {
  const lines = [
    "T019 Foreign State Baseline Inspection",
    "",
    `Scenario: ${report.scenarioId}`,
    `Foreign countries: ${report.foreignCountryIds.join(", ")}`,
    `Cadence: ${report.cadence}`,
    "",
    "Cases:",
    "| Case | Actor | Decision | Target |",
    "|---|---|---|---|",
  ];

  for (const currentCase of report.cases) {
    lines.push(
      `| ${currentCase.label} | ${currentCase.actorCountryId} | ${currentCase.decision} | ${currentCase.targetCountryId ?? "—"} |`,
    );
  }

  lines.push(
    "",
    "Directed contact checks:",
    `actor→target closed: ${report.directedChecks.actorToTargetClosed ? "YES" : "NO"}`,
    `reverse edge changed: ${report.directedChecks.reverseEdgeChanged ? "YES" : "NO"}`,
    `static topology changed: ${report.directedChecks.staticTopologyChanged ? "YES" : "NO"}`,
    "",
    "Action pipeline:",
    `ActionProposal → heuristic ActionRecord → diplomacy resolution: ${report.actionPipelinePassed ? "PASS" : "FAIL"}`,
    `Foreign-to-foreign action: ${report.foreignToForeignPassed ? "PASS" : "FAIL"}`,
    `Stable ordering: ${report.stableOrderingPassed ? "PASS" : "FAIL"}`,
    "",
    "Scope checks:",
    `T020 ideology motive used: ${report.t020IdeologyMotiveUsed ? "YES" : "NO"}`,
    `foreign faction support mutation: ${report.foreignFactionSupportMutated ? "YES" : "NO"}`,
    `territorial mutation: ${report.territorialMutation ? "YES" : "NO"}`,
    `terminal behavior: ${report.terminalPassed ? "PASS" : "FAIL"}`,
    "",
    "Checks:",
    ...report.checks.map(
      (currentCheck) =>
        `- ${currentCheck.id}: ${currentCheck.passed ? "PASS" : "FAIL"} — ${currentCheck.detail}`,
    ),
  );

  return lines.join("\n");
}
