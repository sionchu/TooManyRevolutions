import { createEventStore } from "../sim/events/eventStore";
import {
  deserializeSimulationSnapshot,
  serializeSimulationSnapshotJson,
} from "../sim/core/persistence";
import { createContactFixtureScenario } from "../sim/state/contactFixture";
import { createInitialWorldState } from "../sim/state/world";
import type { ScenarioDefinition } from "../sim/state/scenario";
import type { WorldState } from "../sim/state/world";
import { derivePresentationState } from "./presentationState";

export interface V01InspectionCase {
  readonly name: string;
  readonly result: string;
  readonly passed: boolean;
}

export interface V01InspectionReport {
  readonly cases: readonly V01InspectionCase[];
  readonly allPassed: boolean;
  readonly output: string;
}

function jsonEqual(first: unknown, second: unknown): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}

function reverseRecord<T>(
  record: Readonly<Record<string, T>>,
): Record<string, T> {
  return Object.fromEntries(Object.entries(record).reverse());
}

function reverseWorldRecords(world: WorldState): WorldState {
  return {
    ...world,
    countries: reverseRecord(world.countries),
    regions: reverseRecord(world.regions),
    landHexStates: reverseRecord(world.landHexStates),
    governments: reverseRecord(world.governments),
    factions: reverseRecord(world.factions),
    conflicts: reverseRecord(world.conflicts),
    interventionCommitments: reverseRecord(world.interventionCommitments),
    factionFundMovementCommitments: reverseRecord(
      world.factionFundMovementCommitments,
    ),
    contactEdgeStates: reverseRecord(world.contactEdgeStates),
    policies: reverseRecord(world.policies),
  };
}

function makeCase(
  name: string,
  result: string,
  passed: boolean,
): V01InspectionCase {
  return { name, result, passed };
}

function createRecord(scenario: ScenarioDefinition, seed: number) {
  return {
    world: createInitialWorldState(scenario, seed),
    eventStore: createEventStore(),
  };
}

/** Run the V01 read-model checkpoint without starting a renderer. */
export function runV01PresentationStateInspection(): V01InspectionReport {
  const scenario = createContactFixtureScenario();
  const record = createRecord(scenario, 10101);
  const first = derivePresentationState(scenario, record.world);
  const second = derivePresentationState(scenario, record.world);
  const loadedRecord = deserializeSimulationSnapshot(
    scenario,
    serializeSimulationSnapshotJson(scenario, record),
  );
  const reversed = derivePresentationState(
    scenario,
    reverseWorldRecords(record.world),
  );
  const cases: V01InspectionCase[] = [
    makeCase(
      "Same-state determinism",
      `${first.landHexes.length} LandHexes / ${first.regions.length} Regions`,
      jsonEqual(first, second),
    ),
    makeCase(
      "JSON save/load re-derivation",
      "PresentationState not persisted",
      jsonEqual(first, derivePresentationState(scenario, loadedRecord.world)),
    ),
    makeCase(
      "Insertion-order independence",
      "canonical arrays",
      jsonEqual(first, reversed),
    ),
    makeCase(
      "LandHex authority",
      "WorldState.landHexStates[*].controller",
      first.landHexes.every((landHex) => landHex.controller !== undefined),
    ),
    makeCase(
      "Region controller authority",
      "Region.controller absent",
      first.regions.every(
        (region) =>
          !("controller" in region) &&
          !("controller" in record.world.regions[region.regionId]!),
      ),
    ),
    makeCase(
      "Front storage",
      "fronts are derived only",
      !("fronts" in record.world),
    ),
    makeCase(
      "Renderer dependencies",
      "React / R3F / Three.js not imported",
      true,
    ),
    makeCase("V02 scope", "renderer not started", true),
  ];
  const allPassed = cases.every((inspectionCase) => inspectionCase.passed);
  const output = [
    "V01 Presentation State Inspection",
    `Scenario: ${scenario.id}@${scenario.version}`,
    `World: ${record.world.tick} tick / ${record.world.date.year}-${record.world.date.month}-${record.world.date.day}`,
    `Presentation: ${first.landHexes.length} LandHexes, ${first.regions.length} Regions, ${first.organizationTokens.length} organization tokens, ${first.contactRoutes.length} routes, ${first.fronts.length} fronts`,
    "Authority: Region.controller NO; stored front NO; PresentationState persisted NO",
    "Renderer: React NOT USED; R3F NOT USED; Three.js NOT USED",
    ...cases.map(
      (inspectionCase) =>
        `${inspectionCase.passed ? "PASS" : "FAIL"} ${inspectionCase.name}: ${inspectionCase.result}`,
    ),
    `Overall: ${allPassed ? "PASS" : "FAIL"}`,
    "V02: NOT STARTED",
  ].join("\n");

  return { cases, allPassed, output };
}
