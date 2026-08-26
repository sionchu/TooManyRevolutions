import type { WorldSceneModel, WorldScenePoint } from "../worldSceneModel";

export interface MapRuntimeBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minZ: number;
  readonly maxZ: number;
}

export interface MapRuntimePolygon {
  readonly id: string;
  readonly semanticKey: string;
  readonly terrain?: WorldSceneModel["hexes"][number]["terrain"];
  readonly points: readonly WorldScenePoint[];
  readonly triangles: readonly [a: number, b: number, c: number][];
  readonly bounds: MapRuntimeBounds;
}

export interface MapRuntimeTerrainMesh {
  readonly vertices: readonly WorldScenePoint[];
  readonly colors: readonly [r: number, g: number, b: number][];
  readonly triangles: readonly [a: number, b: number, c: number][];
  readonly polygonCount: number;
  readonly logicalLandHexCount: number;
  readonly sharedVertexCount: number;
  readonly terrainKinds: readonly WorldSceneModel["hexes"][number]["terrain"][];
  readonly minHeight: number;
  readonly maxHeight: number;
}

export interface MapRuntimeGeometry {
  readonly terrainMesh: MapRuntimeTerrainMesh;
  readonly regionSurfaces: readonly MapRuntimePolygon[];
  readonly factionSurfaces: readonly MapRuntimePolygon[];
  readonly renderBounds: MapRuntimeBounds;
}

type RuntimeTerrain = WorldSceneModel["hexes"][number]["terrain"];

interface RuntimeEdge {
  readonly key: string;
  readonly fromKey: string;
  readonly toKey: string;
  readonly from: WorldScenePoint;
  readonly to: WorldScenePoint;
  readonly hexId: string;
}

interface RuntimeTopology {
  readonly edges: readonly RuntimeEdge[];
  readonly edgesByKey: ReadonlyMap<string, readonly RuntimeEdge[]>;
  readonly hexesById: ReadonlyMap<string, WorldSceneModel["hexes"][number]>;
  readonly cornerSampleCount: ReadonlyMap<string, number>;
}

interface TerrainVertexSample {
  readonly terrain: RuntimeTerrain;
  readonly height: number;
}

interface TerrainVertexAccumulator {
  readonly x: number;
  readonly z: number;
  readonly samples: TerrainVertexSample[];
}

const HEX_RADIUS = 1.01;
const SNAP_DIGITS = 2;

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function round(value: number): number {
  return Number(value.toFixed(SNAP_DIGITS));
}

function pointKey(x: number, z: number): string {
  return `${round(x)},${round(z)}`;
}

function terrainColor(terrain: RuntimeTerrain): [number, number, number] {
  const palette: Record<RuntimeTerrain, string> = {
    plains: "#c8b982",
    coast: "#6e9ea1",
    wetlands: "#819879",
    forest: "#5d8168",
    hills: "#a0805e",
    mountains: "#73707a",
  };
  const value = Number.parseInt(palette[terrain].slice(1), 16);
  const raw: [number, number, number] = [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
  const base: [number, number, number] = [0.51, 0.55, 0.45];
  const blend = 0.26;
  return [
    base[0] * (1 - blend) + raw[0] * blend,
    base[1] * (1 - blend) + raw[1] * blend,
    base[2] * (1 - blend) + raw[2] * blend,
  ];
}

function averageTerrainColor(
  samples: readonly TerrainVertexSample[],
): [number, number, number] {
  if (samples.length === 0) return terrainColor("plains");
  const colors = samples.map((sample) => terrainColor(sample.terrain));
  return [
    colors.reduce((total, color) => total + color[0], 0) / colors.length,
    colors.reduce((total, color) => total + color[1], 0) / colors.length,
    colors.reduce((total, color) => total + color[2], 0) / colors.length,
  ];
}

function hexCorners(
  hex: WorldSceneModel["hexes"][number],
  cornerY: ReadonlyMap<string, number>,
): readonly WorldScenePoint[] {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (60 * index + 30);
    const x = hex.position[0] + HEX_RADIUS * Math.cos(angle);
    const z = hex.position[2] + HEX_RADIUS * Math.sin(angle);
    return [
      round(x),
      cornerY.get(pointKey(x, z)) ?? hex.position[1] + hex.height + 0.025,
      round(z),
    ] as WorldScenePoint;
  });
}

function createTopology(model: WorldSceneModel): RuntimeTopology {
  const hexes = [...model.hexes].sort((first, second) =>
    compareStableText(first.id, second.id),
  );
  const hexesById = new Map(hexes.map((hex) => [hex.id, hex]));
  const cornerSamples = new Map<string, number[]>();
  for (const hex of hexes) {
    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI / 180) * (60 * index + 30);
      const x = hex.position[0] + HEX_RADIUS * Math.cos(angle);
      const z = hex.position[2] + HEX_RADIUS * Math.sin(angle);
      const key = pointKey(x, z);
      const samples = cornerSamples.get(key) ?? [];
      samples.push(hex.position[1] + hex.height + 0.025);
      cornerSamples.set(key, samples);
    }
  }
  const cornerY = new Map(
    [...cornerSamples.entries()].map(([key, samples]) => [
      key,
      samples.reduce((total, value) => total + value, 0) / samples.length,
    ]),
  );
  const edges: RuntimeEdge[] = [];
  const edgesByKey = new Map<string, RuntimeEdge[]>();
  for (const hex of hexes) {
    const corners = hexCorners(hex, cornerY);
    for (let index = 0; index < corners.length; index += 1) {
      const from = corners[index]!;
      const to = corners[(index + 1) % corners.length]!;
      const fromKey = pointKey(from[0], from[2]);
      const toKey = pointKey(to[0], to[2]);
      const key = [fromKey, toKey].sort(compareStableText).join("|");
      const edge = { key, fromKey, toKey, from, to, hexId: hex.id };
      edges.push(edge);
      const entries = edgesByKey.get(key) ?? [];
      entries.push(edge);
      edgesByKey.set(key, entries);
    }
  }
  return {
    edges,
    edgesByKey,
    hexesById,
    cornerSampleCount: new Map(
      [...cornerSamples.entries()].map(([key, samples]) => [
        key,
        samples.length,
      ]),
    ),
  };
}

function semanticKeyForHex(
  hex: WorldSceneModel["hexes"][number],
  kind: "world" | "terrain" | "region" | "faction",
): string | null {
  if (kind === "world") return "world";
  if (kind === "terrain") return `terrain:${hex.terrain}`;
  if (kind === "region") return `region:${hex.regionId}`;
  return hex.controller.kind === "faction"
    ? `faction:${hex.controller.factionId}`
    : null;
}

function connectedComponents(
  topology: RuntimeTopology,
  kind: "world" | "terrain" | "region" | "faction",
): readonly { readonly key: string; readonly hexIds: readonly string[] }[] {
  const semanticKeys = new Map<string, string>();
  for (const hex of topology.hexesById.values()) {
    const key = semanticKeyForHex(hex, kind);
    if (key !== null) semanticKeys.set(hex.id, key);
  }
  const neighbors = new Map<string, Set<string>>();
  for (const entries of topology.edgesByKey.values()) {
    if (entries.length < 2) continue;
    for (const first of entries) {
      for (const second of entries) {
        if (
          first.hexId !== second.hexId &&
          semanticKeys.get(first.hexId) !== undefined &&
          semanticKeys.get(first.hexId) === semanticKeys.get(second.hexId)
        ) {
          const set = neighbors.get(first.hexId) ?? new Set<string>();
          set.add(second.hexId);
          neighbors.set(first.hexId, set);
        }
      }
    }
  }
  const unvisited = new Set(semanticKeys.keys());
  const components: { key: string; hexIds: string[] }[] = [];
  while (unvisited.size > 0) {
    const firstId = [...unvisited].sort(compareStableText)[0]!;
    const key = semanticKeys.get(firstId)!;
    const queue = [firstId];
    const ids: string[] = [];
    unvisited.delete(firstId);
    while (queue.length > 0) {
      const id = queue.shift()!;
      ids.push(id);
      for (const neighbor of [...(neighbors.get(id) ?? [])].sort(
        compareStableText,
      )) {
        if (semanticKeys.get(neighbor) !== key || !unvisited.has(neighbor))
          continue;
        unvisited.delete(neighbor);
        queue.push(neighbor);
      }
    }
    components.push({ key, hexIds: ids.sort(compareStableText) });
  }
  return components.sort(
    (first, second) =>
      compareStableText(first.key, second.key) ||
      compareStableText(first.hexIds[0]!, second.hexIds[0]!),
  );
}

function cross(
  first: WorldScenePoint,
  second: WorldScenePoint,
  third: WorldScenePoint,
): number {
  return (
    (second[0] - first[0]) * (third[2] - second[2]) -
    (second[2] - first[2]) * (third[0] - second[0])
  );
}

function polygonArea(points: readonly WorldScenePoint[]): number {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const first = points[index]!;
    const second = points[(index + 1) % points.length]!;
    area += first[0] * second[2] - second[0] * first[2];
  }
  return area / 2;
}

function pointInsideTriangle(
  point: WorldScenePoint,
  first: WorldScenePoint,
  second: WorldScenePoint,
  third: WorldScenePoint,
): boolean {
  const firstCross = cross(first, second, point);
  const secondCross = cross(second, third, point);
  const thirdCross = cross(third, first, point);
  return (
    firstCross >= -0.0001 && secondCross >= -0.0001 && thirdCross >= -0.0001
  );
}

function triangulate(
  points: readonly WorldScenePoint[],
): readonly [number, number, number][] {
  const cleaned = points.filter(
    (point, index) =>
      index === 0 ||
      pointKey(point[0], point[2]) !==
        pointKey(points[index - 1]![0], points[index - 1]![2]),
  );
  if (cleaned.length < 3) return [];
  const ordered =
    polygonArea(cleaned) < 0 ? [...cleaned].reverse() : [...cleaned];
  const remaining = ordered.map((_, index) => index);
  const triangles: [number, number, number][] = [];
  let guard = 0;
  while (remaining.length > 3 && guard < ordered.length * ordered.length) {
    guard += 1;
    let clipped = false;
    for (let index = 0; index < remaining.length; index += 1) {
      const previous =
        remaining[(index + remaining.length - 1) % remaining.length]!;
      const current = remaining[index]!;
      const next = remaining[(index + 1) % remaining.length]!;
      if (
        cross(ordered[previous]!, ordered[current]!, ordered[next]!) <= 0.0001
      )
        continue;
      const containsPoint = remaining.some((candidate) => {
        if (
          candidate === previous ||
          candidate === current ||
          candidate === next
        )
          return false;
        return pointInsideTriangle(
          ordered[candidate]!,
          ordered[previous]!,
          ordered[current]!,
          ordered[next]!,
        );
      });
      if (containsPoint) continue;
      triangles.push([previous, current, next]);
      remaining.splice(index, 1);
      clipped = true;
      break;
    }
    if (!clipped) break;
  }
  if (remaining.length === 3) {
    triangles.push([remaining[0]!, remaining[1]!, remaining[2]!]);
  }
  if (triangles.length === 0 && ordered.length >= 3) {
    for (let index = 1; index < ordered.length - 1; index += 1) {
      triangles.push([0, index, index + 1]);
    }
  }
  return triangles;
}

function chooseNextEdge(
  current: RuntimeEdge,
  candidates: readonly RuntimeEdge[],
  startKey: string,
): RuntimeEdge | undefined {
  const incoming = Math.atan2(
    current.to[2] - current.from[2],
    current.to[0] - current.from[0],
  );
  return [...candidates].sort((first, second) => {
    const turn = (edge: RuntimeEdge): number => {
      const outgoing = Math.atan2(
        edge.to[2] - edge.from[2],
        edge.to[0] - edge.from[0],
      );
      let value = outgoing - incoming;
      while (value < 0) value += Math.PI * 2;
      while (value >= Math.PI * 2) value -= Math.PI * 2;
      return value;
    };
    const firstCloses = first.toKey === startKey ? 0 : 1;
    const secondCloses = second.toKey === startKey ? 0 : 1;
    return (
      firstCloses - secondCloses ||
      turn(first) - turn(second) ||
      compareStableText(first.hexId, second.hexId)
    );
  })[0];
}

function traceBoundaryLoops(
  edges: readonly RuntimeEdge[],
): readonly WorldScenePoint[][] {
  const unused = new Set(edges.map((_, index) => index));
  const outgoing = new Map<string, number[]>();
  edges.forEach((edge, index) => {
    const indices = outgoing.get(edge.fromKey) ?? [];
    indices.push(index);
    outgoing.set(edge.fromKey, indices);
  });
  const loops: WorldScenePoint[][] = [];
  while (unused.size > 0) {
    const startIndex = [...unused].sort((first, second) => first - second)[0]!;
    const start = edges[startIndex]!;
    const points: WorldScenePoint[] = [];
    let current = start;
    let closed = false;
    for (let guard = 0; guard < edges.length + 2; guard += 1) {
      const currentIndex = edges.indexOf(current);
      if (currentIndex < 0 || !unused.has(currentIndex)) break;
      unused.delete(currentIndex);
      points.push(current.from);
      const nextCandidates = (outgoing.get(current.toKey) ?? [])
        .filter((index) => unused.has(index))
        .map((index) => edges[index]!);
      if (current.toKey === start.fromKey) {
        closed = true;
        break;
      }
      const next = chooseNextEdge(current, nextCandidates, start.fromKey);
      if (next === undefined) break;
      current = next;
    }
    if (closed && points.length >= 3 && Math.abs(polygonArea(points)) > 0.02) {
      loops.push(points);
    }
  }
  return loops;
}

function boundsForPoints(points: readonly WorldScenePoint[]): MapRuntimeBounds {
  return {
    minX: Math.min(...points.map((point) => point[0])),
    maxX: Math.max(...points.map((point) => point[0])),
    minZ: Math.min(...points.map((point) => point[2])),
    maxZ: Math.max(...points.map((point) => point[2])),
  };
}

function polygonsForComponents(
  topology: RuntimeTopology,
  components: readonly {
    readonly key: string;
    readonly hexIds: readonly string[];
  }[],
  kind: "world" | "terrain" | "region" | "faction",
): readonly MapRuntimePolygon[] {
  return components.flatMap((component, componentIndex) => {
    const componentIds = new Set(component.hexIds);
    const boundaryEdges = topology.edges.filter((edge) => {
      if (!componentIds.has(edge.hexId)) return false;
      const adjacent = topology.edgesByKey.get(edge.key) ?? [];
      return !adjacent.some(
        (candidate) =>
          candidate.hexId !== edge.hexId && componentIds.has(candidate.hexId),
      );
    });
    const loops = traceBoundaryLoops(boundaryEdges);
    const usableLoops = [...loops]
      .filter((loop) => polygonArea(loop) > 0.02)
      .sort(
        (first, second) =>
          Math.abs(polygonArea(second)) - Math.abs(polygonArea(first)),
      );
    const terrain =
      kind === "terrain"
        ? topology.hexesById.get(component.hexIds[0]!)?.terrain
        : kind === "world"
          ? "plains"
          : undefined;
    return usableLoops.flatMap((points, loopIndex) => {
      const triangles = triangulate(points);
      return triangles.length === 0
        ? []
        : [
            {
              id: `runtime-${kind}:${component.key}:${componentIndex}:${loopIndex}`,
              semanticKey: component.key,
              terrain,
              points,
              triangles,
              bounds: boundsForPoints(points),
            },
          ];
    });
  });
}

function fallbackPolygons(
  topology: RuntimeTopology,
  kind: "world" | "terrain" | "region" | "faction",
): readonly MapRuntimePolygon[] {
  return [...topology.hexesById.values()]
    .sort((first, second) => compareStableText(first.id, second.id))
    .flatMap((hex) => {
      const semanticKey = semanticKeyForHex(hex, kind);
      if (semanticKey === null) return [];
      const corners = hexCorners(hex, new Map());
      return [
        {
          id: `runtime-fallback:${kind}:${hex.id}`,
          semanticKey,
          terrain:
            kind === "terrain"
              ? hex.terrain
              : kind === "world"
                ? "plains"
                : undefined,
          points: corners,
          triangles: triangulate(corners),
          bounds: boundsForPoints(corners),
        },
      ];
    });
}

function dominantTerrainForRegion(
  topology: RuntimeTopology,
  regionKey: string,
): RuntimeTerrain {
  const counts = new Map<RuntimeTerrain, number>();
  for (const hex of topology.hexesById.values()) {
    if (`region:${hex.regionId}` !== regionKey) continue;
    counts.set(hex.terrain, (counts.get(hex.terrain) ?? 0) + 1);
  }
  return (
    [...counts.entries()].sort(
      (first, second) =>
        second[1] - first[1] || compareStableText(first[0], second[0]),
    )[0]?.[0] ?? "plains"
  );
}

function createContinuousTerrainMesh(
  topology: RuntimeTopology,
  polygonCount: number,
  logicalLandHexCount: number,
): MapRuntimeTerrainMesh {
  const cornerSamples = new Map<string, TerrainVertexAccumulator>();
  const centerSamples = new Map<string, TerrainVertexAccumulator>();
  const addSample = (
    target: Map<string, TerrainVertexAccumulator>,
    key: string,
    x: number,
    z: number,
    sample: TerrainVertexSample,
  ) => {
    const current = target.get(key);
    if (current === undefined) {
      target.set(key, { x: round(x), z: round(z), samples: [sample] });
    } else {
      current.samples.push(sample);
    }
  };
  for (const hex of topology.hexesById.values()) {
    const height = hex.position[1] + hex.height + 0.025;
    const sample = { terrain: hex.terrain, height };
    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI / 180) * (60 * index + 30);
      const x = hex.position[0] + HEX_RADIUS * Math.cos(angle);
      const z = hex.position[2] + HEX_RADIUS * Math.sin(angle);
      addSample(cornerSamples, pointKey(x, z), x, z, sample);
    }
    addSample(
      centerSamples,
      `center:${hex.id}`,
      hex.position[0],
      hex.position[2],
      sample,
    );
  }
  const vertices: WorldScenePoint[] = [];
  const colors: [number, number, number][] = [];
  const triangles: [number, number, number][] = [];
  const vertexIndexes = new Map<string, number>();
  const addVertex = (
    key: string,
    accumulator: TerrainVertexAccumulator,
  ): number => {
    const existing = vertexIndexes.get(key);
    if (existing !== undefined) return existing;
    const index = vertices.length;
    const height =
      accumulator.samples.reduce((total, sample) => total + sample.height, 0) /
      accumulator.samples.length;
    vertices.push([accumulator.x, height, accumulator.z]);
    colors.push(averageTerrainColor(accumulator.samples));
    vertexIndexes.set(key, index);
    return index;
  };
  const cornersForHex = (hex: WorldSceneModel["hexes"][number]) =>
    Array.from({ length: 6 }, (_, index) => {
      const angle = (Math.PI / 180) * (60 * index + 30);
      const x = hex.position[0] + HEX_RADIUS * Math.cos(angle);
      const z = hex.position[2] + HEX_RADIUS * Math.sin(angle);
      return pointKey(x, z);
    });
  for (const hex of [...topology.hexesById.values()].sort((first, second) =>
    compareStableText(first.id, second.id),
  )) {
    const center = centerSamples.get(`center:${hex.id}`);
    if (center === undefined) continue;
    const centerIndex = addVertex(`center:${hex.id}`, center);
    const cornerKeys = cornersForHex(hex);
    for (let index = 0; index < cornerKeys.length; index += 1) {
      const first = cornerSamples.get(cornerKeys[index]!);
      const second = cornerSamples.get(cornerKeys[(index + 1) % 6]!);
      if (first === undefined || second === undefined) continue;
      const firstIndex = addVertex(cornerKeys[index]!, first);
      const secondIndex = addVertex(cornerKeys[(index + 1) % 6]!, second);
      triangles.push([centerIndex, firstIndex, secondIndex]);
    }
  }
  const heights = vertices.map((vertex) => vertex[1]);
  const terrainKinds = [
    ...new Set([...topology.hexesById.values()].map((hex) => hex.terrain)),
  ].sort(compareStableText);
  return {
    vertices,
    colors,
    triangles,
    polygonCount,
    logicalLandHexCount,
    sharedVertexCount: [...cornerSamples.values()].filter(
      (sample) => sample.samples.length > 1,
    ).length,
    terrainKinds,
    minHeight: Math.min(...heights),
    maxHeight: Math.max(...heights),
  };
}

export function deriveMapRuntimeGeometry(
  model: WorldSceneModel,
): MapRuntimeGeometry {
  const topology = createTopology(model);
  const worldPolygons = polygonsForComponents(
    topology,
    connectedComponents(topology, "world"),
    "world",
  );
  const terrainComponents = connectedComponents(topology, "terrain");
  const terrainPolygons = polygonsForComponents(
    topology,
    terrainComponents,
    "terrain",
  );
  const regionPolygons = polygonsForComponents(
    topology,
    connectedComponents(topology, "region"),
    "region",
  );
  const factionPolygons = polygonsForComponents(
    topology,
    connectedComponents(topology, "faction"),
    "faction",
  );
  const finalRegionPolygons =
    regionPolygons.length > 0
      ? regionPolygons
      : fallbackPolygons(topology, "region");
  // Regions form the macro landmasses. Their outer polygons are retained for
  // political surfaces, while terrain uses a shared corner/center mesh below
  // so the logical Hex boundary stays invisible without discarding terrain or
  // elevation information.
  const macroTerrainPolygons = finalRegionPolygons.map((polygon) => ({
    ...polygon,
    terrain: dominantTerrainForRegion(topology, polygon.semanticKey),
  }));
  const finalTerrainPolygons =
    worldPolygons.length > 0
      ? worldPolygons
      : macroTerrainPolygons.length > 0
        ? macroTerrainPolygons
        : terrainPolygons.length > 0
          ? terrainPolygons
          : fallbackPolygons(topology, "terrain");
  const finalFactionPolygons = factionPolygons;
  const terrainMesh = createContinuousTerrainMesh(
    topology,
    finalTerrainPolygons.length,
    model.hexes.length,
  );
  const allPoints = [
    ...terrainMesh.vertices,
    ...model.settlements.map((item) => item.position),
    ...model.conflicts.map((item) => item.position),
    ...model.projects.map((item) => item.position),
  ];
  return {
    terrainMesh,
    regionSurfaces: finalRegionPolygons,
    factionSurfaces: finalFactionPolygons,
    renderBounds: boundsForPoints(allPoints),
  };
}
