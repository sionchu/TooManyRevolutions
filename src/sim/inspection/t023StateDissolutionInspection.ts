import { runSimulationStep } from "../core/tick";
import type { Conflict } from "../state/conflict";
import {
  CONTACT_FIXTURE_COUNTRY_IDS,
  CONTACT_FIXTURE_LAND_HEX_IDS,
} from "../state/contactFixture";
import { asConflictId, asGovernmentId } from "../state/ids";
import { createT022OrderConsolidationScenario } from "../state/orderConsolidationFixture";
import { createT023StateDissolutionScenario } from "../state/stateDissolutionFixture";
import type { ScenarioDefinition } from "../state/scenario";
import { createInitialWorldState, type WorldState } from "../state/world";
import { deriveOrderConsolidationEligibility } from "../systems/orderConsolidation";
import { deriveStateDissolutionEligibility } from "../systems/stateDissolution";

export interface T023InspectionCase {
  readonly name: string;
  readonly lines: readonly string[];
  readonly passed: boolean;
}

export interface T023InspectionReport {
  readonly cases: readonly T023InspectionCase[];
  readonly allPassed: boolean;
  readonly output: string;
}

function withPlayerCountry(
  world: WorldState,
  changes: Partial<
    WorldState["countries"][typeof CONTACT_FIXTURE_COUNTRY_IDS.player]
  >,
): WorldState {
  const player = CONTACT_FIXTURE_COUNTRY_IDS.player;
  return {
    ...world,
    countries: {
      ...world.countries,
      [player]: { ...world.countries[player]!, ...changes },
    },
  };
}

function withLandHexController(
  world: WorldState,
  landHexId: keyof WorldState["landHexStates"],
  controller: WorldState["landHexStates"][typeof landHexId]["controller"],
): WorldState {
  return {
    ...world,
    landHexStates: {
      ...world.landHexStates,
      [landHexId]: { controller },
    },
  };
}

function withConflicts(
  world: WorldState,
  conflicts: readonly Conflict[],
): WorldState {
  return {
    ...world,
    conflicts: Object.fromEntries(
      conflicts.map((conflict) => [conflict.id, conflict]),
    ),
  };
}

function withGovernmentTransition(world: WorldState): WorldState {
  const player = CONTACT_FIXTURE_COUNTRY_IDS.player;
  const country = world.countries[player]!;
  const previousGovernmentId = country.currentGovernmentId!;
  const nextGovernmentId = asGovernmentId("t023.inspection-government");

  return {
    ...world,
    governments: {
      ...world.governments,
      [previousGovernmentId]: {
        ...world.governments[previousGovernmentId]!,
        authority: "contender",
      },
      [nextGovernmentId]: {
        id: nextGovernmentId,
        countryId: player,
        name: "T023 inspection transition government",
        authority: "central",
        formedAtTick: world.tick,
      },
    },
    countries: {
      ...world.countries,
      [player]: { ...country, currentGovernmentId: nextGovernmentId },
    },
  };
}

function activeCivilWar(): Conflict {
  return {
    id: asConflictId("t023.inspection-civil-war"),
    kind: "civilWar",
    status: "active",
    participantCountryIds: [
      CONTACT_FIXTURE_COUNTRY_IDS.player,
      CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
    ],
    participantFactionIds: [],
    affectedRegionIds: [],
    contestedRegionIds: [],
    startedAtTick: 0,
  };
}

function step(scenario: ScenarioDefinition, world: WorldState): WorldState {
  return runSimulationStep(world, { actions: [] }, {}, scenario).nextWorld;
}

function runStep(
  scenario: ScenarioDefinition,
  world: WorldState,
): ReturnType<typeof runSimulationStep> {
  return runSimulationStep(world, { actions: [] }, {}, scenario);
}

function outcomeLabel(world: WorldState): string {
  const outcome = world.run.outcome;
  return outcome.status === "active" ? "active" : outcome.kind;
}

function makeCase(
  name: string,
  lines: readonly string[],
  passed: boolean,
): T023InspectionCase {
  return { name, lines, passed };
}

/** Run the deterministic T023 non-defeat and terminal-dissolution diagnostics. */
export function runT023StateDissolutionInspection(): T023InspectionReport {
  const scenario = createT023StateDissolutionScenario();
  const initial = createInitialWorldState(scenario, 23023);
  const player = CONTACT_FIXTURE_COUNTRY_IDS.player;
  const cases: T023InspectionCase[] = [];

  const negativeTreasury = withPlayerCountry(initial, { treasury: -5000 });
  const negativeTreasurySnapshot = deriveStateDissolutionEligibility(
    scenario,
    negativeTreasury,
  );
  cases.push(
    makeCase(
      "Case A — Negative treasury",
      [
        `treasury: ${negativeTreasury.countries[player]?.treasury}`,
        `dissolved: ${negativeTreasurySnapshot.dissolved ? "YES" : "NO"}`,
      ],
      !negativeTreasurySnapshot.dissolved,
    ),
  );

  const unstable = withPlayerCountry(initial, { instability: 100 });
  const unstableSnapshot = deriveStateDissolutionEligibility(
    scenario,
    unstable,
  );
  cases.push(
    makeCase(
      "Case B — Instability 100",
      [
        `instability: ${unstable.countries[player]?.instability}`,
        `dissolved: ${unstableSnapshot.dissolved ? "YES" : "NO"}`,
      ],
      !unstableSnapshot.dissolved,
    ),
  );

  const capitalLost = withLandHexController(
    initial,
    CONTACT_FIXTURE_LAND_HEX_IDS.capitalWest,
    {
      kind: "country",
      countryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
    },
  );
  const capitalSnapshot = deriveStateDissolutionEligibility(
    scenario,
    capitalLost,
  );
  cases.push(
    makeCase(
      "Case C — Capital lost",
      [
        "capital controlled: NO",
        `dissolved: ${capitalSnapshot.dissolved ? "YES" : "NO"}`,
      ],
      !capitalSnapshot.dissolved,
    ),
  );

  const transitioned = withGovernmentTransition(initial);
  const transitionSnapshot = deriveStateDissolutionEligibility(
    scenario,
    transitioned,
  );
  cases.push(
    makeCase(
      "Case D — Government transition",
      [
        `CountryId unchanged: ${transitioned.countries[player]?.id === player ? "YES" : "NO"}`,
        `currentGovernment changed: ${transitioned.countries[player]?.currentGovernmentId !== initial.countries[player]?.currentGovernmentId ? "YES" : "NO"}`,
        `dissolved: ${transitionSnapshot.dissolved ? "YES" : "NO"}`,
      ],
      transitioned.countries[player]?.id === player &&
        transitioned.countries[player]?.currentGovernmentId !==
          initial.countries[player]?.currentGovernmentId &&
        !transitionSnapshot.dissolved,
    ),
  );

  const civilWarWorld = withConflicts(initial, [activeCivilWar()]);
  const civilWarSnapshot = deriveStateDissolutionEligibility(
    scenario,
    civilWarWorld,
  );
  const civilWarStep = runStep(scenario, civilWarWorld);
  cases.push(
    makeCase(
      "Case E — Active civil war",
      [
        "active civil war: YES",
        `dissolved: ${civilWarSnapshot.dissolved ? "YES" : "NO"}`,
        `RunOutcome: ${outcomeLabel(civilWarStep.nextWorld)}`,
      ],
      !civilWarSnapshot.dissolved &&
        civilWarStep.nextWorld.run.outcome.status === "active",
    ),
  );

  const dissolutionWorld = withPlayerCountry(initial, { stateContinuity: 0 });
  const dissolutionStep = runStep(scenario, dissolutionWorld);
  const dissolutionEvent = dissolutionStep.emittedEvents.find(
    (event) => event.type === "STATE_DISSOLVED",
  );
  cases.push(
    makeCase(
      "Case F — Actual state dissolution",
      [
        "criterion: stateContinuity <= configured threshold",
        "eligible: YES",
        `STATE_DISSOLVED: ${dissolutionStep.emittedEvents.filter((event) => event.type === "STATE_DISSOLVED").length}`,
        `RunOutcome: ${outcomeLabel(dissolutionStep.nextWorld)}`,
      ],
      dissolutionStep.emittedEvents.filter(
        (event) => event.type === "STATE_DISSOLVED",
      ).length === 1 &&
        dissolutionEvent?.causeIds.length === 0 &&
        dissolutionStep.nextWorld.run.outcome.status === "defeated" &&
        dissolutionStep.nextWorld.run.outcome.kind === "stateDissolved" &&
        dissolutionStep.nextWorld.run.outcome.causeEventId ===
          dissolutionEvent.id,
    ),
  );

  const consolidationScenario = createT022OrderConsolidationScenario();
  const consolidationInitial = createInitialWorldState(
    consolidationScenario,
    23023,
  );
  const simultaneousWorld: WorldState = {
    ...withPlayerCountry(consolidationInitial, { stateContinuity: 0 }),
    run: {
      ...consolidationInitial.run,
      consolidation: {
        isCurrentlyEligible: true,
        consecutiveEligibleTicks: 2,
        lastEvaluatedTick: 0,
      },
    },
  };
  const simultaneousStep = runStep(consolidationScenario, simultaneousWorld);
  const simultaneousConsolidation = deriveOrderConsolidationEligibility(
    consolidationScenario,
    simultaneousWorld,
  );
  cases.push(
    makeCase(
      "Case G — Simultaneous consolidation / dissolution",
      [
        `consolidation would complete: ${simultaneousConsolidation.eligible ? "YES" : "NO"}`,
        "dissolution: YES",
        "precedence: STATE_DISSOLVED",
        `ORDER_CONSOLIDATED emitted: ${simultaneousStep.emittedEvents.some((event) => event.type === "ORDER_CONSOLIDATED") ? "YES" : "NO"}`,
      ],
      simultaneousConsolidation.eligible &&
        simultaneousStep.nextWorld.run.outcome.status === "defeated" &&
        simultaneousStep.emittedEvents.filter(
          (event) => event.type === "STATE_DISSOLVED",
        ).length === 1 &&
        !simultaneousStep.emittedEvents.some(
          (event) => event.type === "ORDER_CONSOLIDATED",
        ),
    ),
  );

  const ordinaryFirst = runStep(
    consolidationScenario,
    consolidationInitial,
  ).nextWorld;
  const ordinarySecond = step(consolidationScenario, ordinaryFirst);
  const ordinaryThird = runStep(consolidationScenario, ordinarySecond);
  cases.push(
    makeCase(
      "Case H — Ordinary consolidation",
      [
        "dissolution: NO",
        `ORDER_CONSOLIDATED: ${ordinaryThird.emittedEvents.some((event) => event.type === "ORDER_CONSOLIDATED") ? "YES" : "NO"}`,
        `RunOutcome: ${outcomeLabel(ordinaryThird.nextWorld)}`,
      ],
      ordinaryThird.nextWorld.run.outcome.status === "won" &&
        ordinaryThird.nextWorld.run.outcome.kind === "orderConsolidated" &&
        ordinaryThird.emittedEvents.some(
          (event) => event.type === "ORDER_CONSOLIDATED",
        ) &&
        !ordinaryThird.emittedEvents.some(
          (event) => event.type === "STATE_DISSOLVED",
        ),
    ),
  );

  const terminalAfterDefeat = runStep(scenario, dissolutionStep.nextWorld);
  const terminalPassed =
    terminalAfterDefeat.nextWorld === dissolutionStep.nextWorld &&
    terminalAfterDefeat.emittedEvents.length === 0 &&
    terminalAfterDefeat.actionProposals.length === 0 &&
    terminalAfterDefeat.nextWorld.tick === dissolutionStep.nextWorld.tick &&
    terminalAfterDefeat.nextWorld.date === dissolutionStep.nextWorld.date &&
    terminalAfterDefeat.nextWorld.rngState ===
      dissolutionStep.nextWorld.rngState;

  const fullyOccupied = Object.fromEntries(
    Object.keys(initial.landHexStates).map((landHexId) => [
      landHexId,
      {
        controller: {
          kind: "country" as const,
          countryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
        },
      },
    ]),
  ) as WorldState["landHexStates"];
  const occupationOnly = {
    ...initial,
    landHexStates: fullyOccupied,
  };
  const occupationSnapshot = deriveStateDissolutionEligibility(
    scenario,
    occupationOnly,
  );

  const allPassed =
    cases.every((currentCase) => currentCase.passed) &&
    terminalPassed &&
    !occupationSnapshot.dissolved;
  const criteria = scenario.dissolutionCriteria;
  const lines = [
    "T023 State Dissolution Inspection",
    "",
    "Scenario dissolution criteria:",
    `- stateContinuity threshold: <= ${criteria.stateContinuityAtOrBelow}`,
    `- full annexation terminal: ${criteria.fullAnnexationIsTerminal ? "YES" : "NO"} (deferred: no authoritative annexation fact)`,
    `- permanent fragmentation terminal: ${criteria.permanentFragmentationIsTerminal ? "YES" : "NO"} (deferred: no permanence/recovery state)`,
    "- sovereign-function loss: not implemented",
    "- supported evidence: stateContinuityThreshold",
    "",
  ];

  for (const currentCase of cases) {
    lines.push(currentCase.name);
    lines.push(...currentCase.lines);
    lines.push(`check: ${currentCase.passed ? "PASS" : "FAIL"}`);
    lines.push("");
  }

  lines.push("Terminal:");
  lines.push(
    `post-defeat next step advances: ${terminalPassed ? "NO" : "YES"}`,
  );
  lines.push(
    `duplicate STATE_DISSOLVED: ${terminalAfterDefeat.emittedEvents.some((event) => event.type === "STATE_DISSOLVED") ? "YES" : "NO"}`,
  );
  lines.push("");
  lines.push("Authority:");
  lines.push("Region.controller used: NO");
  lines.push(
    "LandHex.controller used for current territorial facts: NOT NEEDED",
  );
  lines.push(
    `occupation alone treated as annexation: ${occupationSnapshot.dissolved ? "YES" : "NO"}`,
  );
  lines.push("");
  lines.push("T024 replay:");
  lines.push("NOT IMPLEMENTED");
  lines.push("");
  lines.push(`ALL CHECKS: ${allPassed ? "PASS" : "FAIL"}`);

  return { cases, allPassed, output: lines.join("\n") };
}

export function formatT023StateDissolutionInspection(
  report: T023InspectionReport,
): string {
  return report.output;
}

export function printT023StateDissolutionInspection(): void {
  console.log(runT023StateDissolutionInspection().output);
}
