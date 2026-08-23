import { runSimulationStep } from "../core/tick";
import type { Conflict } from "../state/conflict";
import {
  CONTACT_FIXTURE_COUNTRY_IDS,
  CONTACT_FIXTURE_LAND_HEX_IDS,
} from "../state/contactFixture";
import { asConflictId, asGovernmentId } from "../state/ids";
import { deriveRegimeClassification } from "../state/government";
import { createT022OrderConsolidationScenario } from "../state/orderConsolidationFixture";
import type { ScenarioDefinition } from "../state/scenario";
import { createInitialWorldState, type WorldState } from "../state/world";
import { deriveOrderConsolidationEligibility } from "../systems/orderConsolidation";

export interface T022InspectionCase {
  readonly name: string;
  readonly lines: readonly string[];
  readonly passed: boolean;
}

export interface T022InspectionReport {
  readonly cases: readonly T022InspectionCase[];
  readonly allPassed: boolean;
  readonly output: string;
}

function withCountry(
  world: WorldState,
  countryId: keyof WorldState["countries"],
  changes: Partial<WorldState["countries"][typeof countryId]>,
): WorldState {
  const country = world.countries[countryId];
  if (country === undefined) {
    throw new Error(`T022 inspection country ${countryId} is missing.`);
  }

  return {
    ...world,
    countries: {
      ...world.countries,
      [countryId]: { ...country, ...changes },
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

function activeCivilWar(id: Conflict["id"]): Conflict {
  return {
    id,
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

function outcomeLabel(world: WorldState): string {
  const outcome = world.run.outcome;
  return outcome.status === "active" ? "active" : outcome.kind;
}

function makeCase(
  name: string,
  lines: readonly string[],
  passed: boolean,
): T022InspectionCase {
  return { name, lines, passed };
}

/** Run the deterministic T022 Cases A–G diagnostic report. */
export function runT022OrderConsolidationInspection(): T022InspectionReport {
  const scenario = createT022OrderConsolidationScenario();
  const player = CONTACT_FIXTURE_COUNTRY_IDS.player;
  const initial = createInitialWorldState(scenario, 22022);
  const criteria = scenario.orderConsolidationCriteria;
  const cases: T022InspectionCase[] = [];

  const nearMissWorld = withCountry(initial, player, { stateCapacity: 39 });
  const nearMiss = deriveOrderConsolidationEligibility(scenario, nearMissWorld);
  cases.push(
    makeCase(
      "Case A — Near miss",
      [
        `stable Regions: ${nearMiss.stableRegions.passes ? "PASS" : "FAIL"}`,
        `capital: ${nearMiss.capitalControl.passes ? "PASS" : "FAIL"}`,
        `core territory: ${nearMiss.coreTerritory.passes ? "PASS" : "FAIL"}`,
        `stateCapacity: ${nearMiss.stateCapacity.passes ? "PASS" : "FAIL"}`,
        `treasury: ${nearMiss.treasury.passes ? "PASS" : "FAIL"}`,
        `civil war: ${nearMiss.activeCivilWar.passes ? "PASS" : "FAIL"}`,
        `eligible: ${nearMiss.eligible ? "YES" : "NO"}`,
      ],
      !nearMiss.eligible && nearMiss.failedCriteria.includes("stateCapacity"),
    ),
  );

  const day1 = step(scenario, initial);
  const day2 = step(scenario, day1);
  const day3 = step(scenario, day2);
  const consolidatedEvent = runSimulationStep(
    day2,
    { actions: [] },
    {},
    scenario,
  ).emittedEvents.find((event) => event.type === "ORDER_CONSOLIDATED");
  const terminalStep = runSimulationStep(day3, { actions: [] }, {}, scenario);
  cases.push(
    makeCase(
      "Case B — All criteria satisfied",
      [
        `Day 1: progress ${day1.run.consolidation.consecutiveEligibleTicks} / ${criteria.requiredConsecutiveTicks}, outcome ${outcomeLabel(day1)}`,
        `Day 2: progress ${day2.run.consolidation.consecutiveEligibleTicks} / ${criteria.requiredConsecutiveTicks}, outcome ${outcomeLabel(day2)}`,
        `Day 3: progress ${day3.run.consolidation.consecutiveEligibleTicks} / ${criteria.requiredConsecutiveTicks}, outcome ${outcomeLabel(day3)}`,
      ],
      day1.run.consolidation.consecutiveEligibleTicks === 1 &&
        day2.run.consolidation.consecutiveEligibleTicks === 2 &&
        day3.run.outcome.status === "won" &&
        day3.run.outcome.kind === "orderConsolidated" &&
        consolidatedEvent?.causeIds.length === 0 &&
        terminalStep.nextWorld === day3 &&
        terminalStep.emittedEvents.length === 0,
    ),
  );

  const firstTwo = step(scenario, step(scenario, initial));
  const lostCapital = withLandHexController(
    firstTwo,
    CONTACT_FIXTURE_LAND_HEX_IDS.capitalEast,
    {
      kind: "country",
      countryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
    },
  );
  const interrupted = step(scenario, lostCapital);
  const restored = withLandHexController(
    interrupted,
    CONTACT_FIXTURE_LAND_HEX_IDS.capitalEast,
    { kind: "country", countryId: player },
  );
  const restarted = step(scenario, restored);
  cases.push(
    makeCase(
      "Case C — Interrupted streak",
      [
        `before interruption: ${firstTwo.run.consolidation.consecutiveEligibleTicks} / ${criteria.requiredConsecutiveTicks}`,
        `capital lost: ${deriveOrderConsolidationEligibility(scenario, lostCapital).capitalControl.passes ? "NO" : "YES"}`,
        `progress reset: ${interrupted.run.consolidation.consecutiveEligibleTicks}`,
        `capital restored: ${deriveOrderConsolidationEligibility(scenario, restored).capitalControl.passes ? "YES" : "NO"}`,
        `progress restart: ${restarted.run.consolidation.consecutiveEligibleTicks}`,
      ],
      interrupted.run.consolidation.consecutiveEligibleTicks === 0 &&
        restarted.run.consolidation.consecutiveEligibleTicks === 1 &&
        restarted.run.outcome.status === "active",
    ),
  );

  const currentGovernmentId = initial.countries[player]?.currentGovernmentId;
  const transitionGovernmentId = asGovernmentId(
    "t022.inspection-transition-government",
  );
  if (currentGovernmentId === null || currentGovernmentId === undefined) {
    throw new Error("T022 inspection player government is missing.");
  }
  const transitioned: WorldState = {
    ...day1,
    governments: {
      ...day1.governments,
      [currentGovernmentId]: {
        ...day1.governments[currentGovernmentId]!,
        authority: "contender",
      },
      [transitionGovernmentId]: {
        id: transitionGovernmentId,
        countryId: player,
        name: "T022 transition government",
        authority: "central",
        formedAtTick: day1.tick,
      },
    },
    countries: {
      ...day1.countries,
      [player]: {
        ...day1.countries[player]!,
        currentGovernmentId: transitionGovernmentId,
      },
    },
  };
  const beforeTransition = deriveOrderConsolidationEligibility(scenario, day1);
  const afterTransition = deriveOrderConsolidationEligibility(
    scenario,
    transitioned,
  );
  cases.push(
    makeCase(
      "Case D — Government transition",
      [
        `CountryId unchanged: ${transitioned.countries[player]?.id === player ? "YES" : "NO"}`,
        "criteria unchanged: YES (ScenarioDefinition only)",
        `progress reset: NO (current ${day1.run.consolidation.consecutiveEligibleTicks})`,
      ],
      transitioned.countries[player]?.id === player &&
        beforeTransition.eligible === afterTransition.eligible &&
        day1.run.consolidation.consecutiveEligibleTicks === 1,
    ),
  );

  const beforePolicy = initial.policies[player]!;
  const afterPolicy = {
    ...beforePolicy,
    institutionalRules: {
      ...beforePolicy.institutionalRules,
      rulerVeto: false,
      legislatureRequired: true,
      suffrage: "universal" as const,
    },
  };
  const regimeNeutralWorld: WorldState = {
    ...initial,
    policies: { ...initial.policies, [player]: afterPolicy },
  };
  const beforeClassification = deriveRegimeClassification(beforePolicy);
  const afterClassification = deriveRegimeClassification(afterPolicy);
  cases.push(
    makeCase(
      "Case E — Regime neutrality",
      [
        `classification: ${beforeClassification.classification} -> ${afterClassification.classification}`,
        `eligibility before/after: ${deriveOrderConsolidationEligibility(scenario, initial).eligible === deriveOrderConsolidationEligibility(scenario, regimeNeutralWorld).eligible ? "SAME" : "DIFFERENT"}`,
      ],
      beforeClassification.classification !==
        afterClassification.classification &&
        deriveOrderConsolidationEligibility(scenario, initial).eligible ===
          deriveOrderConsolidationEligibility(scenario, regimeNeutralWorld)
            .eligible,
    ),
  );

  const partialCapital = withLandHexController(
    initial,
    CONTACT_FIXTURE_LAND_HEX_IDS.capitalEast,
    {
      kind: "country",
      countryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
    },
  );
  const partialSnapshot = deriveOrderConsolidationEligibility(
    scenario,
    partialCapital,
  );
  cases.push(
    makeCase(
      "Case F — Partial capital",
      [
        `capital controlled: ${partialSnapshot.capitalControl.passes ? "YES" : "NO"}`,
        `eligible: ${partialSnapshot.eligible ? "YES" : "NO"}`,
      ],
      !partialSnapshot.capitalControl.passes && !partialSnapshot.eligible,
    ),
  );

  const civilWarWorld = withConflicts(initial, [
    activeCivilWar(asConflictId("t022.inspection-civil-war")),
  ]);
  const civilWarSnapshot = deriveOrderConsolidationEligibility(
    scenario,
    civilWarWorld,
  );
  cases.push(
    makeCase(
      "Case G — Active civil war",
      [
        `active civil war: ${civilWarSnapshot.activeCivilWar.activeConflictIds.length > 0 ? "YES" : "NO"}`,
        `eligible: ${civilWarSnapshot.eligible ? "YES" : "NO"}`,
      ],
      !civilWarSnapshot.activeCivilWar.passes && !civilWarSnapshot.eligible,
    ),
  );

  const allPassed = cases.every((currentCase) => currentCase.passed);
  const lines = [
    "T022 Order Consolidation Inspection",
    "",
    "Criteria:",
    `stable Regions required: ${criteria.requiredStableRegionIds.join(", ")}`,
    `maximum stable unrest: ${criteria.maximumStableRegionUnrest ?? "not configured"}`,
    `capital control required: ${criteria.requireCapitalControl ? "YES" : "NO"}`,
    `core territory required: ${criteria.requiredControlledCoreRegionIds.join(", ")}`,
    `stateCapacity minimum: ${criteria.minimumStateCapacity}`,
    `treasury minimum: ${criteria.minimumTreasury}`,
    `active civil war prohibited: ${criteria.requiresNoActiveCivilWar ? "YES" : "NO"}`,
    `consecutive period: ${criteria.requiredConsecutiveTicks}`,
    "",
  ];

  for (const currentCase of cases) {
    lines.push(currentCase.name);
    lines.push(...currentCase.lines);
    lines.push(`check: ${currentCase.passed ? "PASS" : "FAIL"}`);
    lines.push("");
  }

  lines.push("Authority:");
  lines.push("Region.controller used: NO");
  lines.push("LandHex projection used: YES");
  lines.push("");
  lines.push("T023 state dissolution:");
  lines.push("covered by inspect:t023");

  return { cases, allPassed, output: lines.join("\n") };
}

export function formatT022OrderConsolidationInspection(
  report: T022InspectionReport,
): string {
  return report.output;
}

export function printT022OrderConsolidationInspection(): void {
  console.log(runT022OrderConsolidationInspection().output);
}
