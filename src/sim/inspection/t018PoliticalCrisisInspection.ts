import type { SimulationPhaseHook, SimulationPhaseHooks } from "../core/step";
import { runSimulationStep } from "../core/tick";
import type { Faction } from "../state/faction";
import { IDEOLOGY_FIXTURE_IDS } from "../state/ideologyFixture";
import {
  POLITICAL_CRISIS_FIXTURE_FACTION_IDS,
  createPoliticalCrisisFixtureScenario,
} from "../state/politicalCrisisFixture";
import type { FactionId } from "../state/ids";
import type { ScenarioDefinition } from "../state/scenario";
import { createInitialWorldState, type WorldState } from "../state/world";
import { runConflictPhase } from "../systems/conflict";
import {
  deriveCoupPrerequisites,
  deriveRebellionPrerequisites,
  type CrisisGate,
  type CoupPrerequisiteSnapshot,
  type RebellionPrerequisiteSnapshot,
} from "../systems/politicalCrisis";

export interface T018InspectionCheck {
  readonly id: string;
  readonly passed: boolean;
  readonly detail: string;
}

export interface T018InspectionCase {
  readonly label: string;
  readonly coupEligible: boolean;
  readonly rebellionEligible: boolean;
  readonly coupGateSummary: string;
  readonly rebellionGateSummary: string;
}

export interface T018PoliticalCrisisInspectionReport {
  readonly scenarioId: string;
  readonly cases: readonly T018InspectionCase[];
  readonly authorityChecks: {
    readonly regionControllerUsage: boolean;
    readonly landHexMutationOnDetection: boolean;
  };
  readonly futureEvidence: {
    readonly foreignSupportInvented: boolean;
    readonly militarySympathyInvented: boolean;
  };
  readonly duplicateDetectionPassed: boolean;
  readonly stableOrderingPassed: boolean;
  readonly checks: readonly T018InspectionCheck[];
}

const { coup: COUP_FACTION_ID, rebellion: REBELLION_FACTION_ID } =
  POLITICAL_CRISIS_FIXTURE_FACTION_IDS;

const NOOP_PHASE: SimulationPhaseHook = (context) => ({
  nextWorld: context.world,
  emittedEvents: [],
  nextEventSequence: context.nextEventSequence,
});

const CONFLICT_ONLY_HOOKS: SimulationPhaseHooks = {
  economy: NOOP_PHASE,
  resources: NOOP_PHASE,
  ideologyDiffusion: NOOP_PHASE,
  factionPressure: NOOP_PHASE,
  instability: NOOP_PHASE,
  diplomacy: NOOP_PHASE,
  conflict: runConflictPhase,
  evaluateOrderConsolidationAndDissolution: NOOP_PHASE,
};

function updateFaction(
  world: WorldState,
  factionId: FactionId,
  patch: Partial<Faction>,
): WorldState {
  const faction = world.factions[factionId];
  if (faction === undefined) {
    throw new Error(`T018 inspection faction ${factionId} is missing.`);
  }

  return {
    ...world,
    factions: {
      ...world.factions,
      [factionId]: { ...faction, ...patch },
    },
  };
}

function updateCountryHealth(world: WorldState, healthy: boolean): WorldState {
  const country = Object.values(world.countries)[0];
  if (country === undefined) {
    throw new Error("T018 inspection country is missing.");
  }

  return {
    ...world,
    countries: {
      ...world.countries,
      [country.id]: {
        ...country,
        legitimacy: healthy ? 80 : 20,
        stateCapacity: healthy ? 80 : 20,
        instability: healthy ? 0 : 80,
      },
    },
  };
}

function updateRegionalSignals(
  world: WorldState,
  values: {
    readonly capitalUnrest: number;
    readonly industrialUnrest: number;
    readonly industrialSupport: number;
    readonly industrialRadicalism: number;
    readonly industrialOrganization: number;
  },
): WorldState {
  const regions = Object.values(world.regions);
  const capital = regions[0];
  const industrial = regions[1];
  if (capital === undefined || industrial === undefined) {
    throw new Error("T018 inspection regions are incomplete.");
  }

  return {
    ...world,
    regions: {
      ...world.regions,
      [capital.id]: { ...capital, unrest: values.capitalUnrest },
      [industrial.id]: {
        ...industrial,
        unrest: values.industrialUnrest,
        ideology: {
          ...industrial.ideology,
          [IDEOLOGY_FIXTURE_IDS.communism]: {
            ...industrial.ideology[IDEOLOGY_FIXTURE_IDS.communism],
            support: values.industrialSupport,
            radicalism: values.industrialRadicalism,
            organization: values.industrialOrganization,
          },
        },
      },
    },
  };
}

function updateCapabilities(
  scenario: ScenarioDefinition,
  overrides: Readonly<Record<FactionId, readonly ("coup" | "rebellion")[]>>,
): ScenarioDefinition {
  return {
    ...scenario,
    factionCapabilities: {
      ...(scenario.factionCapabilities ?? {}),
      ...overrides,
    },
  };
}

function gateStatus<TId extends string>(
  gates: readonly CrisisGate<TId>[],
  id: TId,
): string {
  return gates.find((gate) => gate.id === id)?.status.toUpperCase() ?? "N/A";
}

function coupSummary(snapshot: CoupPrerequisiteSnapshot | undefined): string {
  if (snapshot === undefined) {
    return "no candidate";
  }

  return [
    `capability ${gateStatus(snapshot.gates, "capability")}`,
    `grievance ${gateStatus(snapshot.gates, "grievance")}`,
    `organization ${gateStatus(snapshot.gates, "organization")}`,
    `influence ${gateStatus(snapshot.gates, "influence")}`,
    `resources ${gateStatus(snapshot.gates, "resources")}`,
    `state weakness ${gateStatus(snapshot.gates, "stateWeakness")}`,
  ].join("; ");
}

function rebellionSummary(
  snapshot: RebellionPrerequisiteSnapshot | undefined,
): string {
  if (snapshot === undefined) {
    return "no candidate";
  }

  return [
    `capability ${gateStatus(snapshot.gates, "capability")}`,
    `local radicalism ${gateStatus(snapshot.gates, "localRadicalism")}`,
    `local organization ${gateStatus(snapshot.gates, "localIdeologyOrganization")}`,
    `faction organization ${gateStatus(snapshot.gates, "factionOrganization")}`,
    `resources ${gateStatus(snapshot.gates, "resources")}`,
    `concentration ${gateStatus(snapshot.gates, "geographicConcentration")}`,
    `state weakness ${gateStatus(snapshot.gates, "stateWeakness")}`,
  ].join("; ");
}

function makeCase(
  label: string,
  scenario: ScenarioDefinition,
  world: WorldState,
): T018InspectionCase {
  const coup = deriveCoupPrerequisites(scenario, world)[0];
  const rebellion = deriveRebellionPrerequisites(scenario, world)[0];
  return {
    label,
    coupEligible: coup?.eligible ?? false,
    rebellionEligible: rebellion?.eligible ?? false,
    coupGateSummary: coupSummary(coup),
    rebellionGateSummary: rebellionSummary(rebellion),
  };
}

function check(
  id: string,
  passed: boolean,
  detail: string,
): T018InspectionCheck {
  return { id, passed, detail };
}

export function runT018PoliticalCrisisInspection(): T018PoliticalCrisisInspectionReport {
  const baseScenario = createPoliticalCrisisFixtureScenario();
  const baseWorld = createInitialWorldState(baseScenario, 18018);

  let highUnrestOnlyWorld = updateCountryHealth(baseWorld, false);
  highUnrestOnlyWorld = updateFaction(highUnrestOnlyWorld, COUP_FACTION_ID, {
    organization: 0.1,
    grievance: 0.9,
    influence: 0.9,
    resources: 0.9,
  });
  highUnrestOnlyWorld = updateFaction(
    highUnrestOnlyWorld,
    REBELLION_FACTION_ID,
    { organization: 0.1, grievance: 0.9, resources: 0.9 },
  );
  highUnrestOnlyWorld = updateRegionalSignals(highUnrestOnlyWorld, {
    capitalUnrest: 1,
    industrialUnrest: 1,
    industrialSupport: 0.45,
    industrialRadicalism: 0.8,
    industrialOrganization: 0.8,
  });

  const coupScenario = updateCapabilities(baseScenario, {
    [REBELLION_FACTION_ID]: [],
  });
  const coupWorld = baseWorld;

  const rebellionScenario = updateCapabilities(baseScenario, {
    [COUP_FACTION_ID]: [],
  });
  const rebellionWorld = baseWorld;

  let highSupportWorld = updateCountryHealth(baseWorld, false);
  highSupportWorld = updateFaction(highSupportWorld, COUP_FACTION_ID, {
    organization: 0.1,
    grievance: 0.1,
    influence: 0.1,
    resources: 0.1,
  });
  highSupportWorld = updateFaction(highSupportWorld, REBELLION_FACTION_ID, {
    organization: 0.1,
    grievance: 0.9,
    resources: 0.9,
  });
  highSupportWorld = updateRegionalSignals(highSupportWorld, {
    capitalUnrest: 0.1,
    industrialUnrest: 0.8,
    industrialSupport: 1,
    industrialRadicalism: 0.1,
    industrialOrganization: 0.1,
  });

  let strategyOnlyWorld = updateCountryHealth(baseWorld, true);
  strategyOnlyWorld = updateFaction(strategyOnlyWorld, COUP_FACTION_ID, {
    currentStrategy: "fundMovement",
    grievance: 0.1,
    organization: 0.1,
    influence: 0.1,
    resources: 0.1,
  });
  strategyOnlyWorld = updateFaction(strategyOnlyWorld, REBELLION_FACTION_ID, {
    currentStrategy: "organize",
    grievance: 0.1,
    organization: 0.1,
    resources: 0.1,
  });
  strategyOnlyWorld = updateRegionalSignals(strategyOnlyWorld, {
    capitalUnrest: 0.1,
    industrialUnrest: 0.1,
    industrialSupport: 1,
    industrialRadicalism: 0.1,
    industrialOrganization: 0.1,
  });

  const cases = [
    makeCase("Case A — High unrest only", baseScenario, highUnrestOnlyWorld),
    makeCase("Case B — Organized military elite", coupScenario, coupWorld),
    makeCase(
      "Case C — Concentrated radical labor movement",
      rebellionScenario,
      rebellionWorld,
    ),
    makeCase(
      "Case D — High support, no organization",
      baseScenario,
      highSupportWorld,
    ),
    makeCase("Case E — Strategy only", baseScenario, strategyOnlyWorld),
  ];

  const duplicateFirst = runSimulationStep(
    coupWorld,
    { actions: [] },
    CONFLICT_ONLY_HOOKS,
    coupScenario,
  );
  const duplicateSecond = runSimulationStep(
    duplicateFirst.nextWorld,
    { actions: [] },
    CONFLICT_ONLY_HOOKS,
    coupScenario,
  );
  const duplicateDetectionPassed =
    duplicateFirst.emittedEvents.some(
      (event) => event.type === "COUP_ATTEMPT_STARTED",
    ) &&
    !duplicateSecond.emittedEvents.some(
      (event) => event.type === "COUP_ATTEMPT_STARTED",
    ) &&
    Object.keys(duplicateSecond.nextWorld.conflicts).length ===
      Object.keys(duplicateFirst.nextWorld.conflicts).length;

  const reversedScenario: ScenarioDefinition = {
    ...baseScenario,
    initialFactions: [...baseScenario.initialFactions].reverse(),
  };
  const firstOrderingRun = runSimulationStep(
    baseWorld,
    { actions: [] },
    CONFLICT_ONLY_HOOKS,
    baseScenario,
  );
  const secondOrderingRun = runSimulationStep(
    createInitialWorldState(reversedScenario, 18018),
    { actions: [] },
    CONFLICT_ONLY_HOOKS,
    reversedScenario,
  );
  const stableOrderingPassed =
    firstOrderingRun.emittedEvents.map((event) => event.id).join("|") ===
    secondOrderingRun.emittedEvents.map((event) => event.id).join("|");

  const futureSnapshot = deriveCoupPrerequisites(baseScenario, baseWorld)[0];
  const allFutureEvidenceNotImplemented =
    futureSnapshot?.futureEvidence.every(
      (evidence) => evidence.status === "notImplemented",
    ) ?? false;
  const authorityBefore = JSON.stringify(baseWorld.landHexStates);
  const authorityRun = runSimulationStep(
    baseWorld,
    { actions: [] },
    CONFLICT_ONLY_HOOKS,
    baseScenario,
  );
  const authorityChecks = {
    regionControllerUsage: Object.values(baseWorld.regions).some((region) =>
      Object.prototype.hasOwnProperty.call(region, "controller"),
    ),
    landHexMutationOnDetection:
      JSON.stringify(authorityRun.nextWorld.landHexStates) !== authorityBefore,
  };

  const checks = [
    check(
      "A high unrest alone",
      cases[0]!.coupEligible === false && cases[0]!.rebellionEligible === false,
      "불안과 국가 instability만으로는 조직된 crisis가 생성되지 않는다.",
    ),
    check(
      "B coup distinction",
      cases[1]!.coupEligible && !cases[1]!.rebellionEligible,
      "쿠데타 capability와 중앙 권력 장악 gate는 반란 gate와 분리된다.",
    ),
    check(
      "C rebellion concentration",
      !cases[2]!.coupEligible && cases[2]!.rebellionEligible,
      "지역 radicalism·조직·unrest가 한 Region에 집중될 때만 반란이 eligible이다.",
    ),
    check(
      "D support separation",
      cases[3]!.rebellionEligible === false,
      "ideology support만으로는 반란 eligibility가 생기지 않는다.",
    ),
    check(
      "E strategy separation",
      cases[4]!.coupEligible === false && cases[4]!.rebellionEligible === false,
      "currentStrategy는 detector trigger가 아니다.",
    ),
    check(
      "F future evidence honesty",
      allFutureEvidenceNotImplemented,
      "foreign support·military sympathy·weapons·leadership를 fake 값으로 만들지 않는다.",
    ),
    check(
      "G duplicate detection",
      duplicateDetectionPassed,
      "같은 country/faction/kind의 active Conflict를 다음 날 중복 생성하지 않는다.",
    ),
    check(
      "H stable ordering",
      stableOrderingPassed,
      "Faction 배열 삽입 순서가 crisis event 순서를 바꾸지 않는다.",
    ),
    check(
      "I territorial authority",
      !authorityChecks.regionControllerUsage &&
        !authorityChecks.landHexMutationOnDetection,
      "detector는 Region.controller를 사용하지 않고 LandHex controller를 변경하지 않는다.",
    ),
  ];

  return {
    scenarioId: baseScenario.id,
    cases,
    authorityChecks,
    futureEvidence: {
      foreignSupportInvented: !allFutureEvidenceNotImplemented,
      militarySympathyInvented: !allFutureEvidenceNotImplemented,
    },
    duplicateDetectionPassed,
    stableOrderingPassed,
    checks,
  };
}

export function formatT018PoliticalCrisisInspection(
  report: T018PoliticalCrisisInspectionReport,
): string {
  const lines = [
    "T018 Political Crisis Prerequisite Inspection",
    "",
    `Scenario: ${report.scenarioId}`,
    "",
    "Cases:",
    "| Case | Coup eligible | Rebellion eligible | Coup gates | Rebellion gates |",
    "|---|---:|---:|---|---|",
  ];

  for (const currentCase of report.cases) {
    lines.push(
      `| ${currentCase.label} | ${currentCase.coupEligible ? "YES" : "NO"} | ${currentCase.rebellionEligible ? "YES" : "NO"} | ${currentCase.coupGateSummary} | ${currentCase.rebellionGateSummary} |`,
    );
  }

  lines.push(
    "",
    "Authority checks:",
    `Region.controller usage: ${report.authorityChecks.regionControllerUsage ? "YES" : "NO"}`,
    `LandHex controller mutation on detection: ${report.authorityChecks.landHexMutationOnDetection ? "YES" : "NO"}`,
    "",
    "Future evidence:",
    `foreign support invented: ${report.futureEvidence.foreignSupportInvented ? "YES" : "NO"}`,
    `military sympathy invented: ${report.futureEvidence.militarySympathyInvented ? "YES" : "NO"}`,
    "",
    "Duplicate detection:",
    `PASS: ${report.duplicateDetectionPassed ? "YES" : "NO"}`,
    "Stable ordering:",
    `PASS: ${report.stableOrderingPassed ? "YES" : "NO"}`,
    "",
    "Checks:",
    ...report.checks.map(
      (currentCheck) =>
        `- ${currentCheck.id}: ${currentCheck.passed ? "PASS" : "FAIL"} — ${currentCheck.detail}`,
    ),
  );

  return lines.join("\n");
}
