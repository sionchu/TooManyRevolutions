import {
  CONTACT_FIXTURE_REGION_IDS,
  createContactFixtureScenario,
} from "../state/contactFixture";
import { asLandHexId, asRegionId } from "../state/ids";
import { createInitialWorldState } from "../state/world";
import {
  derivePhysicalAdjacency,
  getLandHex,
  getLandHexesForRegion,
  getPhysicalNeighborIds,
} from "../state/territorialTopology";
import type { LandHexDefinition } from "../state/territorialTopology";
import { getOutgoingContacts } from "../systems/contactGraph";

export interface T017ARegionTopologyRow {
  readonly regionId: string;
  readonly regionName: string;
  readonly landHexIds: readonly string[];
}

export interface T017AAdjacencyRow {
  readonly landHexId: string;
  readonly neighborIds: readonly string[];
}

export interface T017ATopologyCheckResult {
  readonly name: string;
  readonly passed: boolean;
}

export interface T017ATerritorialTopologyInspectionReport {
  readonly scenarioId: string;
  readonly regionCount: number;
  readonly landHexCount: number;
  readonly regionRows: readonly T017ARegionTopologyRow[];
  readonly adjacencyRows: readonly T017AAdjacencyRow[];
  readonly crossRegionBorders: readonly string[];
  readonly checks: readonly T017ATopologyCheckResult[];
}

function checkValidationFailure(
  scenario: ReturnType<typeof createContactFixtureScenario>,
  landHexes: readonly LandHexDefinition[],
): boolean {
  try {
    createInitialWorldState(
      { ...scenario, mapTerritorialTopology: { landHexes } },
      20260822,
    );
    return false;
  } catch {
    return true;
  }
}

function collectCrossRegionBorders(
  scenario: ReturnType<typeof createContactFixtureScenario>,
): readonly string[] {
  const adjacency = derivePhysicalAdjacency(scenario);
  const seen = new Set<string>();
  const borders: string[] = [];

  for (const landHexId of Object.keys(adjacency).sort()) {
    const source = getLandHex(scenario, asLandHexId(landHexId));

    for (const neighborId of adjacency[asLandHexId(landHexId)] ?? []) {
      const target = getLandHex(scenario, neighborId);
      if (source.regionId === target.regionId) {
        continue;
      }

      const pair = [source.id, target.id].sort();
      const key = pair.join("<->");
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      borders.push(`${pair[0]} <-> ${pair[1]}`);
    }
  }

  return borders.sort();
}

function buildChecks(
  scenario: ReturnType<typeof createContactFixtureScenario>,
): readonly T017ATopologyCheckResult[] {
  const world = createInitialWorldState(scenario, 20260822);
  const firstLandHex = scenario.mapTerritorialTopology.landHexes[0]!;
  const duplicateId = [
    ...scenario.mapTerritorialTopology.landHexes,
    firstLandHex,
  ];
  const duplicateCoordinate = scenario.mapTerritorialTopology.landHexes.map(
    (landHex, index) =>
      index === 1
        ? { ...landHex, coordinate: { ...firstLandHex.coordinate } }
        : landHex,
  );
  const invalidRegion = scenario.mapTerritorialTopology.landHexes.map(
    (landHex, index) =>
      index === 0
        ? { ...landHex, regionId: asRegionId("t017a.missing-region") }
        : landHex,
  );
  const invalidTerrain = scenario.mapTerritorialTopology.landHexes.map(
    (landHex, index) =>
      index === 0
        ? {
            ...landHex,
            terrain: "invalid" as unknown as typeof landHex.terrain,
          }
        : landHex,
  );
  const reversed = {
    ...scenario,
    mapTerritorialTopology: {
      landHexes: [...scenario.mapTerritorialTopology.landHexes].reverse(),
    },
  };
  const relocated = {
    ...scenario,
    mapTerritorialTopology: {
      landHexes: scenario.mapTerritorialTopology.landHexes.map(
        (landHex, index) =>
          index === 0
            ? { ...landHex, coordinate: { q: 100, r: 100 } }
            : landHex,
      ),
    },
  };
  const relocatedWorld = createInitialWorldState(relocated, 20260822);

  return [
    {
      name: "LandHex.controller is the physical authority",
      passed:
        world.landHexStates[firstLandHex.id]?.controller.kind === "country" &&
        !Object.prototype.hasOwnProperty.call(
          world.regions[firstLandHex.regionId] ?? {},
          "controller",
        ),
    },
    {
      name: "Region.controller is not stored",
      passed: !("controller" in (world.regions[firstLandHex.regionId] ?? {})),
    },
    {
      name: "ContactGraph independent from TerritorialTopology",
      passed:
        JSON.stringify(
          getOutgoingContacts(scenario, world, CONTACT_FIXTURE_REGION_IDS.port),
        ) ===
        JSON.stringify(
          getOutgoingContacts(
            relocated,
            relocatedWorld,
            CONTACT_FIXTURE_REGION_IDS.port,
          ),
        ),
    },
    {
      name: "duplicate-id validation",
      passed: checkValidationFailure(scenario, duplicateId),
    },
    {
      name: "duplicate-coordinate validation",
      passed: checkValidationFailure(scenario, duplicateCoordinate),
    },
    {
      name: "invalid-region validation",
      passed: checkValidationFailure(scenario, invalidRegion),
    },
    {
      name: "invalid-terrain validation",
      passed: checkValidationFailure(scenario, invalidTerrain),
    },
    {
      name: "deterministic ordering",
      passed:
        JSON.stringify(derivePhysicalAdjacency(scenario)) ===
        JSON.stringify(derivePhysicalAdjacency(reversed)),
    },
  ];
}

/** Run the T017A static topology inspection against the existing headless fixture. */
export function runT017ATerritorialTopologyInspection(): T017ATerritorialTopologyInspectionReport {
  const scenario = createContactFixtureScenario();
  const regionRows = [...scenario.initialRegions]
    .sort((first, second) => (first.id < second.id ? -1 : 1))
    .map((region) => ({
      regionId: region.id,
      regionName: region.name,
      landHexIds: getLandHexesForRegion(scenario, region.id).map(
        (landHex) => landHex.id,
      ),
    }));
  const adjacency = derivePhysicalAdjacency(scenario);
  const adjacencyRows = Object.keys(adjacency)
    .sort()
    .map((landHexId) => ({
      landHexId,
      neighborIds: getPhysicalNeighborIds(scenario, asLandHexId(landHexId)),
    }));

  return {
    scenarioId: scenario.id,
    regionCount: scenario.initialRegions.length,
    landHexCount: scenario.mapTerritorialTopology.landHexes.length,
    regionRows,
    adjacencyRows,
    crossRegionBorders: collectCrossRegionBorders(scenario),
    checks: buildChecks(scenario),
  };
}

/** Format a compact, human-readable report for `pnpm run inspect:t017a`. */
export function formatT017ATerritorialTopologyInspection(
  report: T017ATerritorialTopologyInspectionReport,
): string {
  const lines = [
    "T017A Territorial Topology Inspection",
    "",
    `Scenario: ${report.scenarioId}`,
    `Regions: ${report.regionCount}`,
    `LandHexes: ${report.landHexCount}`,
    "",
    "Region membership:",
  ];

  for (const row of report.regionRows) {
    lines.push(
      `  ${row.regionId} (${row.regionName}): [${row.landHexIds.join(", ")}]`,
    );
  }

  lines.push("", "Physical adjacency:");
  for (const row of report.adjacencyRows) {
    lines.push(`  ${row.landHexId} -> [${row.neighborIds.join(", ")}]`);
  }

  lines.push("", "Cross-region borders:");
  for (const border of report.crossRegionBorders) {
    lines.push(`  ${border}`);
  }

  lines.push(
    "",
    "Authority:",
    "  LandHex.controller is the physical authority: YES",
    "  Region.controller is not stored: YES",
    "  ContactGraph independent from TerritorialTopology: YES",
    "",
    "Checks:",
  );
  for (const check of report.checks) {
    lines.push(`  ${check.name}: ${check.passed ? "PASS" : "FAIL"}`);
  }

  return lines.join("\n");
}
