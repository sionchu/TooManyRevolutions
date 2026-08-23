import type { ScenarioDefinition } from "./scenario";
import type { LandHexId, RegionId } from "./ids";

/** Minimal static terrain vocabulary for T017A; these values have no modifiers yet. */
export type LandHexTerrain =
  "plains" | "forest" | "hills" | "mountains" | "coast" | "wetlands";

/** Integer axial coordinate used for deterministic physical adjacency. */
export interface LandHexCoordinate {
  readonly q: number;
  readonly r: number;
}

/** Static identity and Region membership; no runtime controller is stored here. */
export interface LandHexDefinition {
  readonly id: LandHexId;
  readonly regionId: RegionId;
  readonly coordinate: LandHexCoordinate;
  readonly terrain: LandHexTerrain;
}

/** Scenario-owned physical topology. Runtime territorial state is intentionally absent. */
export interface TerritorialTopology {
  readonly landHexes: readonly LandHexDefinition[];
}

/** Descriptive alias matching the ScenarioDefinition field naming convention. */
export type TerritorialTopologyDefinition = TerritorialTopology;

const LAND_HEX_TERRAINS: readonly LandHexTerrain[] = [
  "plains",
  "forest",
  "hills",
  "mountains",
  "coast",
  "wetlands",
] as const;

const AXIAL_NEIGHBOR_OFFSETS: readonly LandHexCoordinate[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
] as const;

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function coordinateKey(coordinate: LandHexCoordinate): string {
  return `${coordinate.q},${coordinate.r}`;
}

function assertValidCoordinate(
  coordinate: LandHexCoordinate,
  landHexId: LandHexId,
): void {
  if (!Number.isInteger(coordinate.q) || !Number.isInteger(coordinate.r)) {
    throw new Error(
      `LandHex ${landHexId} coordinate must use integer axial values.`,
    );
  }
}

/** Validate one scenario's static physical topology without changing it. */
export function assertScenarioTerritorialTopology(
  scenario: Pick<
    ScenarioDefinition,
    "initialRegions" | "mapTerritorialTopology"
  >,
): void {
  const regionIds = new Set<RegionId>(
    scenario.initialRegions.map((region) => region.id),
  );
  const landHexIds = new Set<LandHexId>();
  const coordinates = new Set<string>();

  for (const landHex of scenario.mapTerritorialTopology.landHexes) {
    if (landHex.id.length === 0) {
      throw new Error("LandHex identity must not be empty.");
    }

    if (landHexIds.has(landHex.id)) {
      throw new Error(`Territorial topology repeats LandHex ${landHex.id}.`);
    }

    if (!regionIds.has(landHex.regionId)) {
      throw new Error(
        `LandHex ${landHex.id} references missing region ${landHex.regionId}.`,
      );
    }

    assertValidCoordinate(landHex.coordinate, landHex.id);

    const key = coordinateKey(landHex.coordinate);
    if (coordinates.has(key)) {
      throw new Error(
        `Territorial topology repeats coordinate ${key} for LandHex ${landHex.id}.`,
      );
    }

    if (!LAND_HEX_TERRAINS.includes(landHex.terrain)) {
      throw new Error(`LandHex ${landHex.id} has an invalid terrain.`);
    }

    landHexIds.add(landHex.id);
    coordinates.add(key);
  }
}

function getLandHexMap(
  scenario: Pick<
    ScenarioDefinition,
    "initialRegions" | "mapTerritorialTopology"
  >,
): ReadonlyMap<LandHexId, LandHexDefinition> {
  assertScenarioTerritorialTopology(scenario);

  return new Map(
    scenario.mapTerritorialTopology.landHexes.map((landHex) => [
      landHex.id,
      landHex,
    ]),
  );
}

/** Return one static LandHex definition by stable ID. */
export function getLandHex(
  scenario: Pick<
    ScenarioDefinition,
    "initialRegions" | "mapTerritorialTopology"
  >,
  landHexId: LandHexId,
): LandHexDefinition {
  const landHex = getLandHexMap(scenario).get(landHexId);

  if (landHex === undefined) {
    throw new Error(`LandHex ${landHexId} does not exist in the scenario.`);
  }

  return landHex;
}

/** Return all static LandHexes belonging to one Region in canonical ID order. */
export function getLandHexesForRegion(
  scenario: Pick<
    ScenarioDefinition,
    "initialRegions" | "mapTerritorialTopology"
  >,
  regionId: RegionId,
): readonly LandHexDefinition[] {
  const regionExists = scenario.initialRegions.some(
    (region) => region.id === regionId,
  );

  if (!regionExists) {
    throw new Error(`Region ${regionId} does not exist in the scenario.`);
  }

  return [...getLandHexMap(scenario).values()]
    .filter((landHex) => landHex.regionId === regionId)
    .sort((first, second) => compareStableText(first.id, second.id));
}

/** Return physical neighbor IDs derived from axial coordinates in canonical ID order. */
export function getPhysicalNeighborIds(
  scenario: Pick<
    ScenarioDefinition,
    "initialRegions" | "mapTerritorialTopology"
  >,
  landHexId: LandHexId,
): readonly LandHexId[] {
  const landHexMap = getLandHexMap(scenario);
  const landHex = getLandHex(scenario, landHexId);
  const byCoordinate = new Map<string, LandHexId>();

  for (const candidate of landHexMap.values()) {
    byCoordinate.set(coordinateKey(candidate.coordinate), candidate.id);
  }

  return AXIAL_NEIGHBOR_OFFSETS.map((offset) =>
    byCoordinate.get(
      coordinateKey({
        q: landHex.coordinate.q + offset.q,
        r: landHex.coordinate.r + offset.r,
      }),
    ),
  )
    .filter((neighborId): neighborId is LandHexId => neighborId !== undefined)
    .sort(compareStableText);
}

/** Return physical neighbor definitions in the same stable order as their IDs. */
export function getPhysicalNeighbors(
  scenario: Pick<
    ScenarioDefinition,
    "initialRegions" | "mapTerritorialTopology"
  >,
  landHexId: LandHexId,
): readonly LandHexDefinition[] {
  return getPhysicalNeighborIds(scenario, landHexId).map((neighborId) =>
    getLandHex(scenario, neighborId),
  );
}

/** Derive the complete symmetric physical adjacency projection without storing it. */
export function derivePhysicalAdjacency(
  scenario: Pick<
    ScenarioDefinition,
    "initialRegions" | "mapTerritorialTopology"
  >,
): Readonly<Record<LandHexId, readonly LandHexId[]>> {
  const landHexMap = getLandHexMap(scenario);
  const adjacency = {} as Record<LandHexId, readonly LandHexId[]>;

  for (const landHexId of [...landHexMap.keys()].sort(compareStableText)) {
    adjacency[landHexId] = getPhysicalNeighborIds(scenario, landHexId);
  }

  return adjacency;
}
