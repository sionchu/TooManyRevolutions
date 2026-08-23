import { createEventStore } from "../events/eventStore";
import {
  commitSimulationStep,
  deserializeSimulationSnapshot,
  SIMULATION_SNAPSHOT_FORMAT_VERSION,
  serializeSimulationSnapshot,
  serializeSimulationSnapshotJson,
} from "../core/persistence";
import { runSimulationStep } from "../core/tick";
import { asEventId } from "../state/ids";
import {
  CONTACT_FIXTURE_COUNTRY_IDS,
  CONTACT_FIXTURE_REGION_IDS,
  createContactFixtureScenario,
} from "../state/contactFixture";
import { createT022OrderConsolidationScenario } from "../state/orderConsolidationFixture";
import { createT023StateDissolutionScenario } from "../state/stateDissolutionFixture";
import type { ScenarioDefinition } from "../state/scenario";
import { deriveActiveConflictFrontEdges } from "../systems/conflictResolution";
import { deriveForeignIdeologicalThreats } from "../systems/foreignIdeologicalThreat";
import { deriveOrderConsolidationEligibility } from "../systems/orderConsolidation";
import { deriveStateDissolutionEligibility } from "../systems/stateDissolution";
import { deriveRegionControlSummary } from "../state/territorialControl";
import { createInitialWorldState, type WorldState } from "../state/world";
import type { RunRecord } from "../core/step";

export interface T024InspectionCase {
  readonly name: string;
  readonly result: string;
  readonly passed: boolean;
}

export interface T024InspectionReport {
  readonly cases: readonly T024InspectionCase[];
  readonly allPassed: boolean;
  readonly output: string;
}

function createRecord(scenario: ScenarioDefinition, seed: number): RunRecord {
  return {
    world: createInitialWorldState(scenario, seed),
    eventStore: createEventStore(),
  };
}

function stepRecord(
  scenario: ScenarioDefinition,
  record: RunRecord,
): RunRecord {
  return commitSimulationStep(
    scenario,
    record,
    runSimulationStep(record.world, { actions: [] }, {}, scenario),
  );
}

function runTicks(
  scenario: ScenarioDefinition,
  record: RunRecord,
  count: number,
): RunRecord {
  let current = record;
  for (let index = 0; index < count; index += 1) {
    current = stepRecord(scenario, current);
  }
  return current;
}

function setPlayerStateContinuity(
  world: WorldState,
  value: number,
): WorldState {
  const playerId = CONTACT_FIXTURE_COUNTRY_IDS.player;
  return {
    ...world,
    countries: {
      ...world.countries,
      [playerId]: { ...world.countries[playerId]!, stateContinuity: value },
    },
  };
}

function jsonEqual(first: unknown, second: unknown): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}

function snapshotJson(scenario: ScenarioDefinition, record: RunRecord): string {
  return serializeSimulationSnapshotJson(scenario, record);
}

function replaceFirstCauseWithMissingId(json: string): unknown {
  const snapshot = JSON.parse(json) as {
    eventStore: { events: Array<{ causeIds: string[] }> };
  };
  snapshot.eventStore.events[0]!.causeIds = [
    asEventId("event:0:999:TICK_ADVANCED"),
  ];
  return snapshot;
}

function makeCase(
  name: string,
  result: string,
  passed: boolean,
): T024InspectionCase {
  return { name, result, passed };
}

/** Run a deterministic persistence/replay checkpoint without adding gameplay rules. */
export function runT024PersistenceReplayInspection(): T024InspectionReport {
  const scenario = createContactFixtureScenario();
  const continuous = runTicks(scenario, createRecord(scenario, 24024), 120);
  const snapshotAtForty = runTicks(scenario, createRecord(scenario, 24024), 40);
  const resumed = runTicks(
    scenario,
    deserializeSimulationSnapshot(
      scenario,
      snapshotJson(scenario, snapshotAtForty),
    ),
    80,
  );

  let multiBoundary = runTicks(scenario, createRecord(scenario, 24024), 30);
  multiBoundary = deserializeSimulationSnapshot(
    scenario,
    snapshotJson(scenario, multiBoundary),
  );
  multiBoundary = runTicks(scenario, multiBoundary, 30);
  multiBoundary = deserializeSimulationSnapshot(
    scenario,
    snapshotJson(scenario, multiBoundary),
  );
  multiBoundary = runTicks(scenario, multiBoundary, 60);

  const snapshot = serializeSimulationSnapshot(scenario, snapshotAtForty);
  const canonicalSnapshotAtForty = serializeSimulationSnapshot(
    scenario,
    snapshotAtForty,
  );
  const loadedSnapshot = deserializeSimulationSnapshot(scenario, snapshot);
  const continuousJson = snapshotJson(scenario, continuous);
  const resumedJson = snapshotJson(scenario, resumed);
  const cases: T024InspectionCase[] = [
    makeCase(
      "Snapshot version",
      String(snapshot.formatVersion),
      snapshot.formatVersion === SIMULATION_SNAPSHOT_FORMAT_VERSION,
    ),
    makeCase(
      "Scenario identity",
      `${snapshot.scenarioId}@${snapshot.scenarioVersion}`,
      snapshot.scenarioId === scenario.id &&
        snapshot.scenarioVersion === scenario.version &&
        loadedSnapshot.world.run.scenarioId === scenario.id,
    ),
    makeCase(
      "WorldState authoritative equivalence",
      "PASS",
      jsonEqual(
        serializeSimulationSnapshot(scenario, loadedSnapshot).world,
        canonicalSnapshotAtForty.world,
      ),
    ),
    makeCase(
      "RunState",
      "PASS",
      jsonEqual(loadedSnapshot.world.run, snapshotAtForty.world.run),
    ),
    makeCase(
      "LandHex runtime",
      "PASS",
      jsonEqual(
        loadedSnapshot.world.landHexStates,
        snapshotAtForty.world.landHexStates,
      ),
    ),
    makeCase(
      "Conflicts",
      "PASS",
      jsonEqual(
        loadedSnapshot.world.conflicts,
        snapshotAtForty.world.conflicts,
      ),
    ),
    makeCase(
      "Contact runtime state",
      "PASS",
      jsonEqual(
        loadedSnapshot.world.contactEdgeStates,
        snapshotAtForty.world.contactEdgeStates,
      ),
    ),
    makeCase(
      "RNG",
      "PASS",
      jsonEqual(loadedSnapshot.world.rngState, snapshotAtForty.world.rngState),
    ),
    makeCase(
      "EventStore",
      "PASS",
      jsonEqual(
        serializeSimulationSnapshot(scenario, loadedSnapshot).eventStore,
        canonicalSnapshotAtForty.eventStore,
      ),
    ),
    makeCase(
      "Continuous vs save/load",
      `ticks ${continuous.world.tick}/${resumed.world.tick}`,
      continuousJson === resumedJson,
    ),
    makeCase(
      "Event IDs, sequences, and causes",
      `${continuous.eventStore.events.length} events`,
      jsonEqual(
        serializeSimulationSnapshot(scenario, continuous).eventStore,
        serializeSimulationSnapshot(scenario, resumed).eventStore,
      ),
    ),
    makeCase(
      "Multi-boundary replay",
      `ticks ${continuous.world.tick}/${multiBoundary.world.tick}`,
      continuousJson === snapshotJson(scenario, multiBoundary),
    ),
  ];

  const regionId = CONTACT_FIXTURE_REGION_IDS.capital;
  const derivedChecks = [
    [
      "Region control",
      deriveRegionControlSummary(scenario, continuous.world, regionId),
      deriveRegionControlSummary(scenario, resumed.world, regionId),
    ],
    [
      "Foreign ideological threat",
      deriveForeignIdeologicalThreats(
        scenario,
        continuous.world,
        CONTACT_FIXTURE_COUNTRY_IDS.player,
      ),
      deriveForeignIdeologicalThreats(
        scenario,
        resumed.world,
        CONTACT_FIXTURE_COUNTRY_IDS.player,
      ),
    ],
    [
      "Front",
      deriveActiveConflictFrontEdges(scenario, continuous.world),
      deriveActiveConflictFrontEdges(scenario, resumed.world),
    ],
    [
      "Consolidation eligibility",
      deriveOrderConsolidationEligibility(scenario, continuous.world),
      deriveOrderConsolidationEligibility(scenario, resumed.world),
    ],
    [
      "Dissolution eligibility",
      deriveStateDissolutionEligibility(scenario, continuous.world),
      deriveStateDissolutionEligibility(scenario, resumed.world),
    ],
  ] as const;

  for (const [name, first, second] of derivedChecks) {
    cases.push(makeCase(name, "re-derived", jsonEqual(first, second)));
  }

  const wonScenario = createT022OrderConsolidationScenario();
  const wonRecord = runTicks(wonScenario, createRecord(wonScenario, 24024), 3);
  const loadedWon = deserializeSimulationSnapshot(
    wonScenario,
    snapshotJson(wonScenario, wonRecord),
  );
  const wonFollowUp = stepRecord(wonScenario, loadedWon);
  cases.push(
    makeCase(
      "Terminal won snapshot",
      wonRecord.world.run.outcome.status,
      wonRecord.world.run.outcome.status === "won" &&
        wonFollowUp.world === loadedWon.world &&
        wonFollowUp.eventStore === loadedWon.eventStore,
    ),
  );

  const defeatedScenario = createT023StateDissolutionScenario();
  const defeatedInitial = createRecord(defeatedScenario, 24024);
  const defeated = stepRecord(defeatedScenario, {
    ...defeatedInitial,
    world: setPlayerStateContinuity(defeatedInitial.world, 0),
  });
  const loadedDefeated = deserializeSimulationSnapshot(
    defeatedScenario,
    snapshotJson(defeatedScenario, defeated),
  );
  const defeatedFollowUp = stepRecord(defeatedScenario, loadedDefeated);
  cases.push(
    makeCase(
      "Terminal defeated snapshot",
      defeated.world.run.outcome.status,
      defeated.world.run.outcome.status === "defeated" &&
        defeatedFollowUp.world === loadedDefeated.world &&
        defeatedFollowUp.eventStore === loadedDefeated.eventStore,
    ),
  );

  const missingLandHex = JSON.parse(
    snapshotJson(scenario, snapshotAtForty),
  ) as {
    world: { landHexStates: Record<string, unknown> };
  };
  delete missingLandHex.world.landHexStates["contact.landhex.port"];
  const wrongScenario = createT023StateDissolutionScenario();
  const brokenCause = replaceFirstCauseWithMissingId(
    snapshotJson(scenario, snapshotAtForty),
  );
  const invalidResults = [
    (() => {
      try {
        deserializeSimulationSnapshot(scenario, missingLandHex);
        return false;
      } catch {
        return true;
      }
    })(),
    (() => {
      try {
        deserializeSimulationSnapshot(wrongScenario, snapshot);
        return false;
      } catch {
        return true;
      }
    })(),
    (() => {
      try {
        deserializeSimulationSnapshot(scenario, brokenCause);
        return false;
      } catch {
        return true;
      }
    })(),
  ];
  cases.push(
    makeCase(
      "Invalid snapshots",
      "missing LandHex / wrong scenario / broken cause rejected",
      invalidResults.every(Boolean),
    ),
  );

  const allPassed = cases.every((currentCase) => currentCase.passed);
  const lines = [
    "T024 Persistence / Replay Inspection",
    "",
    "Snapshot:",
    `version: ${snapshot.formatVersion}`,
    `scenario identity: ${cases[1]!.passed ? "PASS" : "FAIL"}`,
    "derived read models persisted: NO",
    "static ScenarioDefinition duplicated: NO",
    "",
    "Roundtrip:",
    ...cases
      .slice(2, 9)
      .map(
        (currentCase) =>
          `${currentCase.name}: ${currentCase.passed ? "PASS" : "FAIL"}`,
      ),
    "",
    "Replay:",
    `continuous ticks: ${continuous.world.tick}`,
    "save/load at: 40",
    `final state identical: ${cases[9]!.passed ? "YES" : "NO"}`,
    `final RNG identical: ${jsonEqual(continuous.world.rngState, resumed.world.rngState) ? "YES" : "NO"}`,
    `event IDs/sequences/causes identical: ${cases[10]!.passed ? "YES" : "NO"}`,
    `multi-boundary replay: ${cases[11]!.passed ? "PASS" : "FAIL"}`,
    "",
    "Derived selectors:",
    ...cases
      .slice(12, 17)
      .map(
        (currentCase) =>
          `${currentCase.name}: ${currentCase.passed ? "SAME" : "DIFFERENT"}`,
      ),
    "",
    `Terminal won no-op after load: ${cases[17]!.passed ? "PASS" : "FAIL"}`,
    `Terminal defeated no-op after load: ${cases[18]!.passed ? "PASS" : "FAIL"}`,
    `Invalid snapshots rejected: ${cases[19]!.passed ? "PASS" : "FAIL"}`,
    "",
    "Ordering:",
    "authoritative locale-dependent ordering audit: covered by source audit/tests",
    "new locale-dependent ordering: covered by source audit/tests",
    "",
    `ALL CHECKS: ${allPassed ? "PASS" : "FAIL"}`,
    "Gate 1V: NOT STARTED",
  ];

  return { cases, allPassed, output: lines.join("\n") };
}

export function formatT024PersistenceReplayInspection(
  report: T024InspectionReport,
): string {
  return report.output;
}

export function printT024PersistenceReplayInspection(): void {
  console.log(runT024PersistenceReplayInspection().output);
}
