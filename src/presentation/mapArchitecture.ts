import type { LandHexTerrain } from "../sim/state/territorialTopology";
import {
  terrainHeight,
  worldPositionForAxial,
  type WorldSceneModel,
  type WorldScenePoint,
} from "./worldSceneModel";

export type MapTruthClass =
  "AUTHORITATIVE_PROJECTION" | "DERIVED_PRESENTATION" | "DECORATIVE_SUBSTRATE";

export type MapBoundaryKind =
  "legal-owner-boundary" | "physical-controller-boundary" | "front-boundary";

export type MapPoint2 = readonly [x: number, z: number];

export interface MapWorldBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minZ: number;
  readonly maxZ: number;
}

export interface MapTerrainZone {
  readonly id: string;
  readonly terrain: LandHexTerrain;
  readonly landHexIds: readonly string[];
  readonly truthClass: "AUTHORITATIVE_PROJECTION";
}

export interface MapHeightAnchor {
  readonly id: string;
  readonly landHexId: string;
  readonly position: WorldScenePoint;
  readonly height: number;
  readonly truthClass: "AUTHORITATIVE_PROJECTION";
}

export interface MapPathDefinition {
  readonly id: string;
  readonly kind: "coastline" | "river" | "road" | "ridge";
  readonly points: readonly WorldScenePoint[];
  readonly sourceRouteId?: string;
  readonly truthClass: MapTruthClass;
}

export interface MapRegionSurfaceHint {
  readonly regionId: string;
  readonly landHexIds: readonly string[];
  readonly center: WorldScenePoint;
  readonly truthClass: "AUTHORITATIVE_PROJECTION";
}

export interface MapGeographyDefinition {
  readonly scenarioId: string;
  readonly worldBounds: MapWorldBounds;
  readonly terrainZones: readonly MapTerrainZone[];
  readonly heightAnchors: readonly MapHeightAnchor[];
  readonly coastlinePaths: readonly MapPathDefinition[];
  readonly riverPaths: readonly MapPathDefinition[];
  readonly roadPaths: readonly MapPathDefinition[];
  readonly ridgePaths: readonly MapPathDefinition[];
  readonly vegetationZones: readonly MapTerrainZone[];
  readonly regionSurfaceHints: readonly MapRegionSurfaceHint[];
}

export interface MapSemanticContent {
  readonly settlements: WorldSceneModel["settlements"];
  readonly pois: WorldSceneModel["pois"];
  readonly institutions: WorldSceneModel["institutions"];
  readonly projects: WorldSceneModel["projects"];
  readonly labelAnchors: WorldSceneModel["regions"];
  readonly truthClass: "AUTHORITATIVE_PROJECTION";
}

export interface MapBoundarySegment {
  readonly id: string;
  readonly kind: MapBoundaryKind;
  readonly firstLandHexId: string;
  readonly secondLandHexId: string | null;
  readonly from: WorldScenePoint;
  readonly to: WorldScenePoint;
  readonly semanticKey: string;
  readonly truthClass: "DERIVED_PRESENTATION";
}

export interface MapFactionTerritoryProjection {
  readonly factionId: string;
  readonly landHexIds: readonly string[];
  readonly outerBoundarySegmentIds: readonly string[];
  readonly truthClass: "AUTHORITATIVE_PROJECTION";
}

export interface MapIdeologySurface {
  readonly id: string;
  readonly regionId: string;
  readonly ideologyId: string;
  readonly support: number;
  readonly radicalism: number;
  readonly organization: number;
  readonly landHexIds: readonly string[];
  readonly truthClass: "AUTHORITATIVE_PROJECTION";
}

export interface MapPoliticalProjection {
  readonly legalOwnerBoundarySegments: readonly MapBoundarySegment[];
  readonly physicalControllerBoundarySegments: readonly MapBoundarySegment[];
  readonly frontBoundarySegments: readonly MapBoundarySegment[];
  readonly factionTerritories: readonly MapFactionTerritoryProjection[];
  readonly ideologySurfaces: readonly MapIdeologySurface[];
  readonly truthClass: "DERIVED_PRESENTATION";
}

export interface MapActivityProjection {
  readonly routes: WorldSceneModel["routes"];
  readonly conflicts: WorldSceneModel["conflicts"];
  readonly projects: WorldSceneModel["projects"];
  readonly factionPresence: WorldSceneModel["factionPresence"];
  readonly truthClass: "AUTHORITATIVE_PROJECTION";
}

export type MapViewPresetId =
  | "desktop.global"
  | "mobile.player-theater"
  | `region.focus.${string}`
  | "crisis.focus"
  | "project.focus"
  | "full-world";

export interface MapViewPreset {
  readonly id: MapViewPresetId;
  readonly label: string;
  readonly x: number;
  readonly z: number;
  readonly zoom: number;
  readonly minZoom: number;
  readonly maxZoom: number;
  readonly targetRegionId?: string;
  readonly truthClass: "DERIVED_PRESENTATION";
}

export type MapLodTier = "far" | "medium" | "near";

export interface MapStyleDefinition {
  readonly terrainPalette: Readonly<Record<LandHexTerrain, string>>;
  readonly politicalOpacity: number;
  readonly ownerBoundaryColor: string;
  readonly controllerBoundaryColor: string;
  readonly frontBoundaryColor: string;
  readonly ownerBoundaryWidth: number;
  readonly controllerBoundaryWidth: number;
  readonly frontBoundaryWidth: number;
  readonly objectScale: number;
  readonly labelScale: Readonly<Record<MapLodTier, number>>;
  readonly ideologySurfaceOpacity: number;
  readonly routeOpacity: Readonly<Record<MapLodTier, number>>;
  readonly selectedCellOpacity: number;
}

export interface MapSharedTerrainMeshData {
  readonly vertices: readonly WorldScenePoint[];
  readonly colors: readonly [r: number, g: number, b: number][];
  readonly triangles: readonly [a: number, b: number, c: number][];
  readonly sharedVertexCount: number;
  readonly logicalLandHexCount: number;
}

export interface MapArchitecture {
  readonly layerOrder: readonly string[];
  readonly geography: MapGeographyDefinition;
  readonly semanticContent: MapSemanticContent;
  readonly political: MapPoliticalProjection;
  readonly activity: MapActivityProjection;
  readonly viewPresets: readonly MapViewPreset[];
  readonly style: MapStyleDefinition;
  readonly contentBounds: MapWorldBounds;
  readonly sharedTerrainMesh: MapSharedTerrainMeshData;
}

export interface MapScreenSpaceRect {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

export interface MapScreenSpaceOccupancy {
  /** Stage/container share of the browser viewport. */
  readonly stage: {
    readonly width: number;
    readonly height: number;
  };
  /** Meaningful projected world share of the actual canvas viewport. */
  readonly projectedWorld: {
    readonly width: number;
    readonly height: number;
  };
  /** Visible meaningful world height in the first browser viewport. */
  readonly firstMobileViewportWorldShare: number;
}

export interface MapScreenSpaceOccupancyInput {
  readonly viewport: {
    readonly width: number;
    readonly height: number;
  };
  readonly stageBounds: MapScreenSpaceRect;
  readonly canvasBounds: MapScreenSpaceRect;
  readonly projectedWorldBounds: MapScreenSpaceRect;
}

export interface MapPatchV1 {
  readonly version: 1;
  readonly scenarioId: string;
  readonly geographyChanges: readonly unknown[];
  readonly poiChanges: readonly unknown[];
  readonly cameraPresetChanges: readonly unknown[];
  readonly styleChanges: readonly unknown[];
  readonly visualChanges: readonly unknown[];
}

export interface MapValidationIssue {
  readonly code: string;
  readonly message: string;
  readonly severity: "error" | "warning";
}

export const MAP_ARCHITECTURE_LAYER_ORDER = [
  "MapTopologyDefinition",
  "MapGeographyDefinition",
  "MapSemanticContent",
  "MapPoliticalProjection",
  "MapActivityProjection",
  "MapViewPreset",
  "MapStyleDefinition",
  "R3F",
] as const;

export const DEFAULT_MAP_STYLE: MapStyleDefinition = {
  terrainPalette: {
    plains: "#9b9b7d",
    coast: "#78979a",
    wetlands: "#879678",
    forest: "#708670",
    hills: "#8e896f",
    mountains: "#7b7d77",
  },
  politicalOpacity: 0.2,
  ownerBoundaryColor: "#f0d9a1",
  controllerBoundaryColor: "#e5b75f",
  frontBoundaryColor: "#f0524d",
  ownerBoundaryWidth: 1,
  controllerBoundaryWidth: 1.4,
  frontBoundaryWidth: 2.6,
  objectScale: 1.24,
  labelScale: { far: 0.86, medium: 1, near: 1.12 },
  ideologySurfaceOpacity: 0.08,
  routeOpacity: { far: 0.22, medium: 0.48, near: 0.78 },
  selectedCellOpacity: 0.96,
};

const HEX_RADIUS = 1.01;
const SNAP_DIGITS = 2;

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function round(value: number): number {
  return Number(value.toFixed(SNAP_DIGITS));
}

function pointKey(point: MapPoint2): string {
  return `${round(point[0])},${round(point[1])}`;
}

function edgeKey(first: MapPoint2, second: MapPoint2): string {
  return [pointKey(first), pointKey(second)].sort(compareStableText).join("|");
}

function controllerKey(
  controller: WorldSceneModel["hexes"][number]["controller"],
): string {
  switch (controller.kind) {
    case "country":
      return `country:${controller.countryId}`;
    case "faction":
      return `faction:${controller.factionId}`;
    case "uncontrolled":
      return "uncontrolled";
  }
}

function hexCorners(
  hex: WorldSceneModel["hexes"][number],
  radius = HEX_RADIUS,
): WorldScenePoint[] {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (60 * index + 30);
    return [
      hex.position[0] + radius * Math.cos(angle),
      hex.position[1] + hex.height + 0.025,
      hex.position[2] + radius * Math.sin(angle),
    ];
  });
}

function hexEdges(hex: WorldSceneModel["hexes"][number]): readonly {
  readonly key: string;
  readonly from: WorldScenePoint;
  readonly to: WorldScenePoint;
}[] {
  const corners = hexCorners(hex);
  return corners.map((from, index) => {
    const to = corners[(index + 1) % corners.length]!;
    return { key: edgeKey([from[0], from[2]], [to[0], to[2]]), from, to };
  });
}

function segmentId(
  kind: MapBoundaryKind,
  firstLandHexId: string,
  secondLandHexId: string | null,
  edge: string,
): string {
  return `map-${kind}:${firstLandHexId}:${secondLandHexId ?? "outer"}:${edge}`;
}

function toBoundarySegment(
  kind: MapBoundaryKind,
  first: WorldSceneModel["hexes"][number],
  second: WorldSceneModel["hexes"][number] | null,
  edge: {
    readonly from: WorldScenePoint;
    readonly to: WorldScenePoint;
    readonly key: string;
  },
): MapBoundarySegment {
  const firstId =
    first.id < (second?.id ?? "") ? first.id : (second?.id ?? first.id);
  const secondId =
    second === null ? null : first.id < second.id ? second.id : first.id;
  const semanticKey =
    kind === "legal-owner-boundary"
      ? `owner:${first.ownerCountryId}:${second?.ownerCountryId ?? "outer"}`
      : `controller:${controllerKey(first.controller)}:${second === null ? "outer" : controllerKey(second.controller)}`;
  return {
    id: segmentId(kind, firstId, secondId, edge.key),
    kind,
    firstLandHexId: firstId,
    secondLandHexId: secondId,
    from: edge.from,
    to: edge.to,
    semanticKey,
    truthClass: "DERIVED_PRESENTATION",
  };
}

function mergeConnectedSegments(
  segments: readonly MapBoundarySegment[],
): readonly MapBoundarySegment[] {
  const merged: MapBoundarySegment[] = [];
  for (const source of [...segments].sort((first, second) =>
    compareStableText(first.id, second.id),
  )) {
    let current = source;
    let mergedIntoExisting = true;
    while (mergedIntoExisting) {
      mergedIntoExisting = false;
      for (let index = 0; index < merged.length; index += 1) {
        const candidate = merged[index]!;
        if (
          candidate.kind !== current.kind ||
          candidate.semanticKey !== current.semanticKey
        ) {
          continue;
        }
        const matches = (
          first: WorldScenePoint,
          second: WorldScenePoint,
        ): boolean =>
          Math.abs(first[0] - second[0]) < 0.035 &&
          Math.abs(first[2] - second[2]) < 0.035;
        const collinear = (
          first: WorldScenePoint,
          second: WorldScenePoint,
          third: WorldScenePoint,
        ): boolean =>
          Math.abs(
            (second[0] - first[0]) * (third[2] - second[2]) -
              (second[2] - first[2]) * (third[0] - second[0]),
          ) < 0.06;
        if (
          matches(candidate.to, current.from) &&
          collinear(candidate.from, candidate.to, current.to)
        ) {
          current = { ...candidate, to: current.to };
        } else if (
          matches(candidate.from, current.to) &&
          collinear(candidate.to, candidate.from, current.from)
        ) {
          current = { ...candidate, from: current.from };
        } else if (
          matches(candidate.from, current.from) &&
          collinear(candidate.to, candidate.from, current.to)
        ) {
          current = { ...candidate, from: current.to };
        } else if (
          matches(candidate.to, current.to) &&
          collinear(candidate.from, candidate.to, current.from)
        ) {
          current = { ...candidate, to: current.from };
        } else {
          continue;
        }
        merged.splice(index, 1);
        mergedIntoExisting = true;
        break;
      }
    }
    merged.push(current);
  }
  return merged.sort((first, second) => compareStableText(first.id, second.id));
}

function boundaryCandidates(model: WorldSceneModel): ReadonlyMap<
  string,
  readonly {
    readonly hex: WorldSceneModel["hexes"][number];
    readonly edge: ReturnType<typeof hexEdges>[number];
  }[]
> {
  const byEdge = new Map<
    string,
    {
      readonly hex: WorldSceneModel["hexes"][number];
      readonly edge: ReturnType<typeof hexEdges>[number];
    }[]
  >();
  for (const hex of [...model.hexes].sort((first, second) =>
    compareStableText(first.id, second.id),
  )) {
    for (const edge of hexEdges(hex)) {
      const entries = byEdge.get(edge.key) ?? [];
      entries.push({ hex, edge });
      byEdge.set(edge.key, entries);
    }
  }
  return byEdge;
}

function deriveBoundarySegments(model: WorldSceneModel): {
  readonly legalOwner: readonly MapBoundarySegment[];
  readonly controller: readonly MapBoundarySegment[];
  readonly byHexPair: ReadonlyMap<string, MapBoundarySegment>;
} {
  const candidates = boundaryCandidates(model);
  const legal: MapBoundarySegment[] = [];
  const controller: MapBoundarySegment[] = [];
  const byHexPair = new Map<string, MapBoundarySegment>();
  for (const [key, entries] of candidates) {
    const firstEntry = entries[0];
    const secondEntry = entries[1];
    if (firstEntry === undefined) continue;
    const first = firstEntry.hex;
    const second = secondEntry?.hex ?? null;
    if (second !== null && first.id > second.id) continue;
    const edge = firstEntry.edge;
    if (second !== null) {
      const pairKey = [first.id, second.id].sort(compareStableText).join("|");
      if (first.ownerCountryId !== second.ownerCountryId) {
        const segment = toBoundarySegment(
          "legal-owner-boundary",
          first,
          second,
          edge,
        );
        legal.push(segment);
      }
      if (
        controllerKey(first.controller) !== controllerKey(second.controller)
      ) {
        const segment = toBoundarySegment(
          "physical-controller-boundary",
          first,
          second,
          edge,
        );
        controller.push(segment);
        byHexPair.set(pairKey, segment);
      }
    } else if (first.controller.kind === "faction") {
      // A faction patch also needs its map-edge perimeter. Country outer
      // edges are intentionally omitted: this is a territory affordance, not
      // a decorative frame around the whole world.
      controller.push(
        toBoundarySegment("physical-controller-boundary", first, null, edge),
      );
    }
    void key;
  }
  return {
    legalOwner: mergeConnectedSegments(legal),
    controller: mergeConnectedSegments(controller),
    byHexPair,
  };
}

function deriveFrontBoundarySegments(
  model: WorldSceneModel,
  byHexPair: ReadonlyMap<string, MapBoundarySegment>,
): readonly MapBoundarySegment[] {
  const direct = model.fronts.flatMap((front) => {
    const pairKey = [front.firstLandHexId, front.secondLandHexId]
      .sort(compareStableText)
      .join("|");
    const segment = byHexPair.get(pairKey);
    if (segment === undefined) return [];
    return [
      {
        ...segment,
        id: `map-front:${front.id}`,
        kind: "front-boundary" as const,
      },
    ];
  });
  if (direct.length > 0) return mergeConnectedSegments(direct);
  // A front is an active-conflict projection, not a synonym for every
  // controller edge. In particular, outer faction perimeters and quiet
  // country borders must never become a fake red front.
  return [];
}

function ideologyColorIndex(ideologyId: string): number {
  let hash = 0;
  for (const character of ideologyId)
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return hash % 5;
}

function derivePoliticalProjection(
  model: WorldSceneModel,
): MapPoliticalProjection {
  const boundaries = deriveBoundarySegments(model);
  const modelHexesById = new Map(model.hexes.map((hex) => [hex.id, hex]));
  const factionGroups = new Map<string, string[]>();
  for (const hex of model.hexes) {
    if (hex.controller.kind !== "faction") continue;
    const ids = factionGroups.get(hex.controller.factionId) ?? [];
    ids.push(hex.id);
    factionGroups.set(hex.controller.factionId, ids);
  }
  const factionTerritories = [...factionGroups.entries()]
    .sort(([first], [second]) => compareStableText(first, second))
    .map(([factionId, landHexIds]) => {
      const factionHexIds = new Set(landHexIds);
      return {
        factionId,
        landHexIds: [...landHexIds].sort(compareStableText),
        outerBoundarySegmentIds: boundaries.controller
          .filter((segment) => {
            const firstIsFaction = factionHexIds.has(segment.firstLandHexId);
            const secondIsFaction =
              segment.secondLandHexId !== null &&
              factionHexIds.has(segment.secondLandHexId);
            return firstIsFaction || secondIsFaction;
          })
          .map((segment) => segment.id)
          .sort(compareStableText),
        truthClass: "AUTHORITATIVE_PROJECTION" as const,
      };
    });
  const regionHexIds = new Map<string, string[]>();
  for (const hex of model.hexes) {
    const ids = regionHexIds.get(hex.regionId) ?? [];
    ids.push(hex.id);
    regionHexIds.set(hex.regionId, ids);
  }
  const ideologyByRegion = new Map<
    string,
    WorldSceneModel["influences"][number]
  >(
    model.influences.map((influence) => [
      String(influence.regionId),
      influence,
    ]),
  );
  const ideologySurfaces = [...regionHexIds.entries()]
    .sort(([first], [second]) => compareStableText(first, second))
    .flatMap(([regionId, landHexIds]) => {
      const influence = ideologyByRegion.get(regionId);
      return influence === undefined
        ? []
        : [
            {
              id: `map-ideology-surface:${regionId}`,
              regionId,
              ideologyId: influence.ideologyId,
              support: influence.support,
              radicalism: influence.radicalism,
              organization: influence.organization,
              landHexIds: [...landHexIds].sort(compareStableText),
              truthClass: "AUTHORITATIVE_PROJECTION" as const,
            },
          ];
    });
  void modelHexesById;
  return {
    legalOwnerBoundarySegments: boundaries.legalOwner,
    physicalControllerBoundarySegments: boundaries.controller,
    frontBoundarySegments: deriveFrontBoundarySegments(
      model,
      boundaries.byHexPair,
    ),
    factionTerritories,
    ideologySurfaces,
    truthClass: "DERIVED_PRESENTATION",
  };
}

function deriveContentBounds(model: WorldSceneModel): MapWorldBounds {
  const points: WorldScenePoint[] = [
    ...model.hexes.map((hex) => hex.position),
    ...model.countries.map((country) => country.position),
    ...model.regions.map((region) => region.position),
    ...model.settlements.map((settlement) => settlement.position),
    ...model.pois.map((poi) => poi.position),
    ...model.institutions.map((institution) => institution.position),
    ...model.projects.map((project) => project.position),
    ...model.routes.flatMap((route) => [route.start, route.end]),
    ...model.conflicts.map((conflict) => conflict.position),
  ];
  const withHexRadius = [
    ...points,
    ...model.hexes.flatMap((hex) => hexCorners(hex)),
  ];
  return {
    minX: Math.min(...withHexRadius.map((point) => point[0])) - 0.35,
    maxX: Math.max(...withHexRadius.map((point) => point[0])) + 0.35,
    minZ: Math.min(...withHexRadius.map((point) => point[2])) - 0.35,
    maxZ: Math.max(...withHexRadius.map((point) => point[2])) + 0.35,
  };
}

function pointDistance(
  first: WorldScenePoint,
  second: WorldScenePoint,
): number {
  return Math.hypot(first[0] - second[0], first[2] - second[2]);
}

function landHexesTouch(
  first: WorldSceneModel["hexes"][number],
  second: WorldSceneModel["hexes"][number],
): boolean {
  const dq = first.coordinate.q - second.coordinate.q;
  const dr = first.coordinate.r - second.coordinate.r;
  return (
    (dq === 1 && dr === 0) ||
    (dq === -1 && dr === 0) ||
    (dq === 0 && dr === 1) ||
    (dq === 0 && dr === -1) ||
    (dq === 1 && dr === -1) ||
    (dq === -1 && dr === 1)
  );
}

/**
 * Faction territory and surfaces carry the primary political signal. This
 * helper keeps near-LOD banners as a small set of strong spatial anchors:
 * one representative per connected faction cluster, capped at two overall.
 */
export function deriveFactionPresenceAnchors(
  model: WorldSceneModel,
  maxAnchors = 2,
): readonly WorldSceneModel["factionPresence"][number][] {
  if (maxAnchors <= 0 || model.factionPresence.length === 0) return [];
  const hexesById = new Map<string, WorldSceneModel["hexes"][number]>(
    model.hexes.map((hex) => [hex.id, hex]),
  );
  const presences = [...model.factionPresence].sort((first, second) =>
    compareStableText(first.id, second.id),
  );
  const clusters: WorldSceneModel["factionPresence"][number][][] = [];
  const unvisited = new Set(presences.map((presence) => presence.id));
  while (unvisited.size > 0) {
    const firstId = [...unvisited].sort(compareStableText)[0]!;
    const first = presences.find((presence) => presence.id === firstId)!;
    const queue = [first];
    const cluster: WorldSceneModel["factionPresence"][number][] = [];
    unvisited.delete(first.id);
    while (queue.length > 0) {
      const current = queue.shift()!;
      cluster.push(current);
      for (const candidate of presences) {
        if (
          !unvisited.has(candidate.id) ||
          candidate.factionId !== current.factionId
        )
          continue;
        const touches = candidate.controlledLandHexIds.some((firstId) =>
          current.controlledLandHexIds.some((secondId) => {
            const firstHex = hexesById.get(firstId);
            const secondHex = hexesById.get(secondId);
            return (
              firstId === secondId ||
              (firstHex !== undefined &&
                secondHex !== undefined &&
                landHexesTouch(firstHex, secondHex))
            );
          }),
        );
        if (!touches) continue;
        unvisited.delete(candidate.id);
        queue.push(candidate);
      }
    }
    clusters.push(cluster);
  }
  return clusters
    .map(
      (cluster) =>
        [...cluster].sort(
          (first, second) =>
            second.organization - first.organization ||
            second.controlledLandHexIds.length -
              first.controlledLandHexIds.length ||
            compareStableText(first.id, second.id),
        )[0]!,
    )
    .sort(
      (first, second) =>
        second.organization - first.organization ||
        compareStableText(first.factionId, second.factionId) ||
        compareStableText(first.id, second.id),
    )
    .slice(0, maxAnchors);
}

function boundsForPoints(points: readonly WorldScenePoint[]): MapWorldBounds {
  return {
    minX: Math.min(...points.map((point) => point[0])) - 0.35,
    maxX: Math.max(...points.map((point) => point[0])) + 0.35,
    minZ: Math.min(...points.map((point) => point[2])) - 0.35,
    maxZ: Math.max(...points.map((point) => point[2])) + 0.35,
  };
}

function boundsForHexes(
  model: WorldSceneModel,
  hexes: readonly WorldSceneModel["hexes"][number][],
): MapWorldBounds {
  const points = hexes.flatMap((hex) => hexCorners(hex));
  return points.length === 0
    ? deriveContentBounds(model)
    : boundsForPoints(points);
}

function contextHexes(
  model: WorldSceneModel,
  anchors: readonly WorldScenePoint[],
  radius: number,
): readonly WorldSceneModel["hexes"][number][] {
  const selected = model.hexes.filter((hex) =>
    anchors.some((anchor) => pointDistance(anchor, hex.position) <= radius),
  );
  return selected.length > 0 ? selected : model.hexes;
}

/** Bounds of the actual terrain context intentionally framed by a preset. */
export function deriveMapViewportBounds(
  model: WorldSceneModel,
  preset: Pick<MapViewPreset, "id">,
): MapWorldBounds {
  if (preset.id === "desktop.global" || preset.id === "full-world") {
    return deriveContentBounds(model);
  }
  if (preset.id === "mobile.player-theater") {
    const player = model.countries.find((country) => country.isPlayer);
    const core =
      player === undefined
        ? []
        : model.hexes.filter((hex) => hex.ownerCountryId === player.countryId);
    const anchors =
      core.length > 0
        ? core.map((hex) => hex.position)
        : player === undefined
          ? []
          : [player.position];
    return boundsForHexes(model, contextHexes(model, anchors, 2.75));
  }
  if (preset.id.startsWith("region.focus.")) {
    const regionId = preset.id.slice("region.focus.".length);
    const region = model.regions.find(
      (candidate) => candidate.regionId === regionId,
    );
    return boundsForHexes(
      model,
      contextHexes(model, region === undefined ? [] : [region.position], 2.75),
    );
  }
  if (preset.id === "crisis.focus") {
    return boundsForHexes(
      model,
      contextHexes(
        model,
        model.conflicts.map((conflict) => conflict.position),
        3.1,
      ),
    );
  }
  if (preset.id === "project.focus") {
    return boundsForHexes(
      model,
      contextHexes(
        model,
        model.projects.map((project) => project.position),
        3.1,
      ),
    );
  }
  return deriveContentBounds(model);
}

function deriveGeography(
  model: WorldSceneModel,
  contentBounds: MapWorldBounds,
): MapGeographyDefinition {
  const terrainGroups = new Map<LandHexTerrain, string[]>();
  for (const hex of model.hexes) {
    const ids = terrainGroups.get(hex.terrain) ?? [];
    ids.push(hex.id);
    terrainGroups.set(hex.terrain, ids);
  }
  const terrainZones = [...terrainGroups.entries()]
    .sort(([first], [second]) => compareStableText(first, second))
    .map(([terrain, landHexIds]) => ({
      id: `terrain-zone:${terrain}`,
      terrain,
      landHexIds: [...landHexIds].sort(compareStableText),
      truthClass: "AUTHORITATIVE_PROJECTION" as const,
    }));
  const regionGroups = new Map<string, string[]>();
  for (const hex of model.hexes) {
    const ids = regionGroups.get(hex.regionId) ?? [];
    ids.push(hex.id);
    regionGroups.set(hex.regionId, ids);
  }
  const centers = new Map<string, WorldScenePoint>(
    model.regions.map((region) => [String(region.regionId), region.position]),
  );
  const heightAnchors = [...model.hexes]
    .sort((first, second) => compareStableText(first.id, second.id))
    .map((hex) => ({
      id: `height:${hex.id}`,
      landHexId: hex.id,
      position: hex.position,
      height: terrainHeight(hex.terrain),
      truthClass: "AUTHORITATIVE_PROJECTION" as const,
    }));
  const coastPoints = model.hexes
    .filter((hex) => hex.terrain === "coast")
    .sort(
      (first, second) =>
        first.position[0] - second.position[0] ||
        first.position[2] - second.position[2],
    )
    .map(
      (hex) =>
        [
          hex.position[0],
          hex.position[1] + 0.05,
          hex.position[2],
        ] as WorldScenePoint,
    );
  const highlandPoints = model.hexes
    .filter((hex) => hex.terrain === "hills" || hex.terrain === "mountains")
    .sort(
      (first, second) =>
        first.position[0] - second.position[0] ||
        first.position[2] - second.position[2],
    )
    .map(
      (hex) =>
        [
          hex.position[0],
          hex.position[1] + hex.height + 0.06,
          hex.position[2],
        ] as WorldScenePoint,
    );
  return {
    scenarioId: model.scenarioId,
    worldBounds: contentBounds,
    terrainZones,
    heightAnchors,
    coastlinePaths:
      coastPoints.length < 2
        ? []
        : [
            {
              id: "geography:coastline:authored",
              kind: "coastline",
              points: coastPoints,
              truthClass: "DECORATIVE_SUBSTRATE",
            },
          ],
    riverPaths: [],
    roadPaths: [...model.routes]
      .sort((first, second) => compareStableText(first.id, second.id))
      .map((route) => ({
        id: `route-path:${route.id}`,
        kind: "road" as const,
        points: [route.start, route.end],
        sourceRouteId: route.id,
        truthClass: "AUTHORITATIVE_PROJECTION" as const,
      })),
    ridgePaths:
      highlandPoints.length < 2
        ? []
        : [
            {
              id: "geography:ridge:authored",
              kind: "ridge",
              points: highlandPoints,
              truthClass: "DECORATIVE_SUBSTRATE",
            },
          ],
    vegetationZones: terrainZones.filter(
      (zone) => zone.terrain === "forest" || zone.terrain === "wetlands",
    ),
    regionSurfaceHints: [...regionGroups.entries()]
      .sort(([first], [second]) => compareStableText(first, second))
      .flatMap(([regionId, landHexIds]) => {
        const center = centers.get(regionId);
        return center === undefined
          ? []
          : [
              {
                regionId,
                landHexIds: [...landHexIds].sort(compareStableText),
                center,
                truthClass: "AUTHORITATIVE_PROJECTION" as const,
              },
            ];
      }),
  };
}

function colorForTerrain(terrain: LandHexTerrain): [number, number, number] {
  const color = DEFAULT_MAP_STYLE.terrainPalette[terrain].slice(1);
  const value = Number.parseInt(color, 16);
  const base: [number, number, number] = [0.49, 0.54, 0.45];
  const blend = 0.2;
  const raw: [number, number, number] = [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
  return [
    base[0] * (1 - blend) + raw[0] * blend,
    base[1] * (1 - blend) + raw[1] * blend,
    base[2] * (1 - blend) + raw[2] * blend,
  ];
}

export function createSharedTerrainMeshData(
  model: WorldSceneModel,
): MapSharedTerrainMeshData {
  const canonicalHexes = [...model.hexes].sort((first, second) =>
    compareStableText(first.id, second.id),
  );
  const vertexIndex = new Map<string, number>();
  const vertices: WorldScenePoint[] = [];
  const colors: [number, number, number][] = [];
  const triangleList: [number, number, number][] = [];
  const cornerSamples = new Map<
    string,
    {
      readonly x: number;
      readonly z: number;
      readonly y: number;
      readonly color: [number, number, number];
    }[]
  >();
  const centerIndex = (hex: WorldSceneModel["hexes"][number]): number => {
    const key = `center:${hex.id}`;
    const existing = vertexIndex.get(key);
    if (existing !== undefined) return existing;
    const next = vertices.length;
    vertexIndex.set(key, next);
    const adjacentSamples = hexCorners(hex).flatMap(
      (corner) => cornerSamples.get(pointKey([corner[0], corner[2]])) ?? [],
    );
    const centerSamples =
      adjacentSamples.length === 0
        ? [{ y: hex.position[1] + hex.height + 0.025 }]
        : adjacentSamples;
    vertices.push([
      hex.position[0],
      centerSamples.reduce((total, sample) => total + sample.y, 0) /
        centerSamples.length,
      hex.position[2],
    ]);
    colors.push(
      adjacentSamples.length === 0
        ? colorForTerrain(hex.terrain)
        : [
            adjacentSamples.reduce(
              (total, sample) => total + sample.color[0],
              0,
            ) / adjacentSamples.length,
            adjacentSamples.reduce(
              (total, sample) => total + sample.color[1],
              0,
            ) / adjacentSamples.length,
            adjacentSamples.reduce(
              (total, sample) => total + sample.color[2],
              0,
            ) / adjacentSamples.length,
          ],
    );
    return next;
  };
  for (const hex of canonicalHexes) {
    const color = colorForTerrain(hex.terrain);
    for (const corner of hexCorners(hex)) {
      const key = pointKey([corner[0], corner[2]]);
      const samples = cornerSamples.get(key) ?? [];
      samples.push({ x: corner[0], y: corner[1], z: corner[2], color });
      cornerSamples.set(key, samples);
    }
  }
  for (const [key, samples] of [...cornerSamples.entries()].sort(
    ([first], [second]) => compareStableText(first, second),
  )) {
    const next = vertices.length;
    vertexIndex.set(`corner:${key}`, next);
    const y =
      samples.reduce((total, sample) => total + sample.y, 0) / samples.length;
    const color: [number, number, number] = [
      samples.reduce((total, sample) => total + sample.color[0], 0) /
        samples.length,
      samples.reduce((total, sample) => total + sample.color[1], 0) /
        samples.length,
      samples.reduce((total, sample) => total + sample.color[2], 0) /
        samples.length,
    ];
    vertices.push([samples[0]!.x, y, samples[0]!.z]);
    colors.push(color);
  }
  for (const hex of canonicalHexes) {
    const corners = hexCorners(hex);
    const center = centerIndex(hex);
    for (let index = 0; index < corners.length; index += 1) {
      const first = corners[index]!;
      const second = corners[(index + 1) % corners.length]!;
      const firstIndex = vertexIndex.get(
        `corner:${pointKey([first[0], first[2]])}`,
      );
      const secondIndex = vertexIndex.get(
        `corner:${pointKey([second[0], second[2]])}`,
      );
      if (firstIndex === undefined || secondIndex === undefined)
        throw new Error(`Shared terrain corner missing for ${hex.id}.`);
      triangleList.push([center, firstIndex, secondIndex]);
    }
  }
  return {
    vertices,
    colors,
    triangles: triangleList,
    sharedVertexCount: [...cornerSamples.values()].filter(
      (samples) => samples.length > 1,
    ).length,
    logicalLandHexCount: canonicalHexes.length,
  };
}

function deriveSemanticContent(model: WorldSceneModel): MapSemanticContent {
  const stable = <T extends { readonly id: string }>(items: readonly T[]) =>
    [...items].sort((first, second) => compareStableText(first.id, second.id));
  return {
    settlements: stable(model.settlements),
    pois: stable(model.pois),
    institutions: stable(model.institutions),
    projects: stable(model.projects),
    labelAnchors: stable(model.regions),
    truthClass: "AUTHORITATIVE_PROJECTION",
  };
}

function playerCenter(model: WorldSceneModel): WorldScenePoint {
  return (
    model.countries.find((country) => country.isPlayer)?.position ?? [0, 0, 0]
  );
}

function crisisCenter(model: WorldSceneModel): WorldScenePoint {
  const conflict = [...model.conflicts].sort((first, second) =>
    compareStableText(first.id, second.id),
  )[0];
  return conflict?.position ?? playerCenter(model);
}

function projectCenter(model: WorldSceneModel): WorldScenePoint {
  const project = [...model.projects].sort((first, second) =>
    compareStableText(first.id, second.id),
  )[0];
  return project?.position ?? playerCenter(model);
}

export function deriveMapViewPresets(
  model: WorldSceneModel,
): readonly MapViewPreset[] {
  const centerX = (model.bounds.minX + model.bounds.maxX) / 2;
  const centerZ = (model.bounds.minZ + model.bounds.maxZ) / 2;
  const player = playerCenter(model);
  const presets: MapViewPreset[] = [
    {
      id: "desktop.global",
      label: "데스크톱 세계",
      x: centerX,
      z: centerZ,
      zoom: 1.12,
      minZoom: 0.78,
      maxZoom: 2.2,
      truthClass: "DERIVED_PRESENTATION",
    },
    {
      id: "mobile.player-theater",
      label: "모바일 플레이어 극장",
      x: player[0],
      z: player[2],
      // The player theatre is intentionally tighter than the desktop world
      // fit so the first narrow viewport is occupied by actual geography,
      // while the separate full-world action remains available.
      zoom: 2.15,
      minZoom: 0.95,
      maxZoom: 2.35,
      truthClass: "DERIVED_PRESENTATION",
    },
    {
      id: "crisis.focus",
      label: "위기 중심",
      x: crisisCenter(model)[0],
      z: crisisCenter(model)[2],
      zoom: 1.34,
      minZoom: 0.95,
      maxZoom: 2.35,
      truthClass: "DERIVED_PRESENTATION",
    },
    {
      id: "project.focus",
      label: "사업 중심",
      x: projectCenter(model)[0],
      z: projectCenter(model)[2],
      zoom: 1.3,
      minZoom: 0.95,
      maxZoom: 2.35,
      truthClass: "DERIVED_PRESENTATION",
    },
    {
      id: "full-world",
      label: "전체 보기",
      x: centerX,
      z: centerZ,
      zoom: 0.9,
      minZoom: 0.72,
      maxZoom: 2.2,
      truthClass: "DERIVED_PRESENTATION",
    },
  ];
  return [
    ...presets,
    ...[...model.regions]
      .sort((first, second) =>
        compareStableText(first.regionId, second.regionId),
      )
      .map((region) => ({
        id: `region.focus.${region.regionId}` as const,
        label: `${region.name} 중심`,
        x: region.position[0],
        z: region.position[2],
        zoom: 1.42,
        minZoom: 0.95,
        maxZoom: 2.4,
        targetRegionId: region.regionId,
        truthClass: "DERIVED_PRESENTATION" as const,
      })),
  ];
}

export function deriveMapLodTier(zoom: number): MapLodTier {
  if (zoom < 1.08) return "far";
  if (zoom < 1.58) return "medium";
  return "near";
}

function intersectScreenRects(
  first: MapScreenSpaceRect,
  second: MapScreenSpaceRect,
): MapScreenSpaceRect {
  return {
    minX: Math.max(first.minX, second.minX),
    maxX: Math.min(first.maxX, second.maxX),
    minY: Math.max(first.minY, second.minY),
    maxY: Math.min(first.maxY, second.maxY),
  };
}

function rectWidth(rect: MapScreenSpaceRect): number {
  return Math.max(0, rect.maxX - rect.minX);
}

function rectHeight(rect: MapScreenSpaceRect): number {
  return Math.max(0, rect.maxY - rect.minY);
}

function safeRatio(value: number, denominator: number): number {
  return denominator <= 0 ? 0 : value / denominator;
}

/**
 * Measures rendered screen-space evidence. Inputs are browser-pixel rectangles
 * produced after the renderer has projected meaningful terrain vertices; this
 * helper intentionally has no synthetic world-unit padding or 1.0 clamp.
 */
export function inspectMapScreenSpaceOccupancy(
  input: MapScreenSpaceOccupancyInput,
): MapScreenSpaceOccupancy {
  const viewportBounds: MapScreenSpaceRect = {
    minX: 0,
    maxX: input.viewport.width,
    minY: 0,
    maxY: input.viewport.height,
  };
  const visibleStage = intersectScreenRects(input.stageBounds, viewportBounds);
  const projectedInCanvas = intersectScreenRects(
    input.projectedWorldBounds,
    input.canvasBounds,
  );
  const projectedInViewport = intersectScreenRects(
    input.projectedWorldBounds,
    viewportBounds,
  );
  return {
    stage: {
      width: safeRatio(rectWidth(visibleStage), input.viewport.width),
      height: safeRatio(rectHeight(visibleStage), input.viewport.height),
    },
    projectedWorld: {
      width: safeRatio(
        rectWidth(projectedInCanvas),
        rectWidth(input.canvasBounds),
      ),
      height: safeRatio(
        rectHeight(projectedInCanvas),
        rectHeight(input.canvasBounds),
      ),
    },
    firstMobileViewportWorldShare: safeRatio(
      rectHeight(projectedInViewport),
      input.viewport.height,
    ),
  };
}

export function deriveMapArchitecture(model: WorldSceneModel): MapArchitecture {
  const contentBounds = deriveContentBounds(model);
  const boundaries = derivePoliticalProjection(model);
  return {
    layerOrder: MAP_ARCHITECTURE_LAYER_ORDER,
    geography: deriveGeography(model, contentBounds),
    semanticContent: deriveSemanticContent(model),
    political: boundaries,
    activity: {
      routes: [...model.routes].sort((first, second) =>
        compareStableText(first.id, second.id),
      ),
      conflicts: [...model.conflicts].sort((first, second) =>
        compareStableText(first.id, second.id),
      ),
      projects: [...model.projects].sort((first, second) =>
        compareStableText(first.id, second.id),
      ),
      factionPresence: [...model.factionPresence].sort((first, second) =>
        compareStableText(first.id, second.id),
      ),
      truthClass: "AUTHORITATIVE_PROJECTION",
    },
    viewPresets: deriveMapViewPresets(model),
    style: DEFAULT_MAP_STYLE,
    contentBounds,
    sharedTerrainMesh: createSharedTerrainMeshData(model),
  };
}

export function validateMapPatchV1(
  value: unknown,
  scenarioId: string,
): readonly MapValidationIssue[] {
  if (typeof value !== "object" || value === null) {
    return [
      {
        code: "PATCH_NOT_OBJECT",
        message: "MapPatch v1은 객체여야 합니다.",
        severity: "error",
      },
    ];
  }
  const candidate = value as Record<string, unknown>;
  const issues: MapValidationIssue[] = [];
  if (candidate.version !== 1)
    issues.push({
      code: "PATCH_VERSION",
      message: "MapPatch version은 1이어야 합니다.",
      severity: "error",
    });
  if (candidate.scenarioId !== scenarioId)
    issues.push({
      code: "PATCH_SCENARIO",
      message: "MapPatch scenarioId가 현재 scenario와 다릅니다.",
      severity: "error",
    });
  for (const key of [
    "geographyChanges",
    "poiChanges",
    "cameraPresetChanges",
    "styleChanges",
    "visualChanges",
  ] as const) {
    if (!Array.isArray(candidate[key]))
      issues.push({
        code: `PATCH_${key.toUpperCase()}`,
        message: `${key}는 배열이어야 합니다.`,
        severity: "error",
      });
  }
  return issues;
}

export function parseMapPatchV1(
  input: string,
  scenarioId: string,
): {
  readonly patch: MapPatchV1 | null;
  readonly issues: readonly MapValidationIssue[];
} {
  try {
    const parsed: unknown = JSON.parse(input);
    const issues = validateMapPatchV1(parsed, scenarioId);
    return issues.some((issue) => issue.severity === "error")
      ? { patch: null, issues }
      : { patch: parsed as MapPatchV1, issues };
  } catch (error) {
    return {
      patch: null,
      issues: [
        {
          code: "PATCH_JSON",
          message: `JSON을 읽지 못했습니다: ${String(error)}`,
          severity: "error",
        },
      ],
    };
  }
}

export function emptyMapPatchV1(scenarioId: string): MapPatchV1 {
  return {
    version: 1,
    scenarioId,
    geographyChanges: [],
    poiChanges: [],
    cameraPresetChanges: [],
    styleChanges: [],
    visualChanges: [],
  };
}

function sameWorldPoint(
  first: WorldScenePoint,
  second: WorldScenePoint,
  tolerance = 0.04,
): boolean {
  return (
    Math.abs(first[0] - second[0]) <= tolerance &&
    Math.abs(first[2] - second[2]) <= tolerance
  );
}

function sameBoundaryGeometry(
  first: MapBoundarySegment,
  second: MapBoundarySegment,
): boolean {
  return (
    (sameWorldPoint(first.from, second.from) &&
      sameWorldPoint(first.to, second.to)) ||
    (sameWorldPoint(first.from, second.to) &&
      sameWorldPoint(first.to, second.from))
  );
}

function finiteWorldPoint(point: WorldScenePoint): boolean {
  return point.every((value) => Number.isFinite(value));
}

function pointInsideBounds(
  point: WorldScenePoint,
  bounds: MapWorldBounds,
  padding = 0.08,
): boolean {
  return (
    point[0] >= bounds.minX - padding &&
    point[0] <= bounds.maxX + padding &&
    point[2] >= bounds.minZ - padding &&
    point[2] <= bounds.maxZ + padding
  );
}

function hexAdjacency(
  model: WorldSceneModel,
): ReadonlyMap<string, readonly string[]> {
  const adjacency = new Map<string, Set<string>>();
  for (const hex of model.hexes) adjacency.set(hex.id, new Set());
  for (let firstIndex = 0; firstIndex < model.hexes.length; firstIndex += 1) {
    const first = model.hexes[firstIndex]!;
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < model.hexes.length;
      secondIndex += 1
    ) {
      const second = model.hexes[secondIndex]!;
      const distance = Math.hypot(
        first.position[0] - second.position[0],
        first.position[2] - second.position[2],
      );
      if (distance <= HEX_RADIUS * 2 * 0.94) {
        adjacency.get(first.id)?.add(second.id);
        adjacency.get(second.id)?.add(first.id);
      }
    }
  }
  return new Map(
    [...adjacency.entries()].map(([id, neighbors]) => [
      id,
      [...neighbors].sort(compareStableText),
    ]),
  );
}

function regionIsDisconnected(
  regionHexIds: readonly string[],
  adjacency: ReadonlyMap<string, readonly string[]>,
): boolean {
  if (regionHexIds.length < 2) return false;
  const members = new Set(regionHexIds);
  const pending = [regionHexIds[0]!];
  const visited = new Set<string>();
  while (pending.length > 0) {
    const id = pending.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const neighbor of adjacency.get(id) ?? []) {
      if (members.has(neighbor) && !visited.has(neighbor))
        pending.push(neighbor);
    }
  }
  return visited.size !== members.size;
}

export function validateMapArchitecture(
  model: WorldSceneModel,
  architecture: MapArchitecture,
): readonly MapValidationIssue[] {
  const issues: MapValidationIssue[] = [];
  const regionIds = new Set(model.regions.map((region) => region.regionId));
  const countryIds = new Set(
    model.countries.map((country) => country.countryId),
  );
  const hexesById = new Map<string, WorldSceneModel["hexes"][number]>(
    model.hexes.map((hex) => [hex.id, hex]),
  );
  const adjacency = hexAdjacency(model);

  const duplicateHexPositions = new Map<string, string[]>();
  for (const hex of model.hexes) {
    const key = pointKey([hex.position[0], hex.position[2]]);
    const ids = duplicateHexPositions.get(key) ?? [];
    ids.push(hex.id);
    duplicateHexPositions.set(key, ids);
  }
  for (const [key, ids] of duplicateHexPositions) {
    if (ids.length < 2) continue;
    issues.push({
      code: "DUPLICATE_AXIAL_POSITION",
      message: `LandHex 위치 ${key}가 중복됩니다: ${ids.sort(compareStableText).join(", ")}.`,
      severity: "error",
    });
  }

  for (const hex of model.hexes) {
    if (!regionIds.has(hex.regionId)) {
      issues.push({
        code: "ORPHAN_LAND_HEX",
        message: `LandHex ${hex.id}가 존재하지 않는 Region ${hex.regionId}를 가리킵니다.`,
        severity: "error",
      });
    }
  }

  const hexesByRegion = new Map<string, string[]>();
  for (const hex of model.hexes) {
    const ids = hexesByRegion.get(hex.regionId) ?? [];
    ids.push(hex.id);
    hexesByRegion.set(hex.regionId, ids);
  }
  for (const region of model.regions) {
    const ids = hexesByRegion.get(region.regionId) ?? [];
    if (ids.length === 0) {
      issues.push({
        code: "REGION_WITHOUT_VISUAL_CENTER",
        message: `Region ${region.regionId}에 시각 중심을 만들 LandHex가 없습니다.`,
        severity: "error",
      });
    } else if (regionIsDisconnected(ids, adjacency)) {
      issues.push({
        code: "DISCONNECTED_REGION_TOPOLOGY",
        message: `Region ${region.regionId}의 LandHex가 연결되지 않았습니다.`,
        severity: "error",
      });
    }
  }

  for (const object of [...model.pois, ...model.institutions]) {
    const anchor = hexesById.get(object.anchorLandHexId);
    if (anchor === undefined || anchor.regionId !== object.regionId) {
      issues.push({
        code: "INVALID_POI_ANCHOR",
        message: `${object.id}의 Region/LandHex anchor가 일치하지 않습니다.`,
        severity: "error",
      });
    }
  }

  for (const route of model.routes) {
    if (
      !regionIds.has(route.sourceRegionId) ||
      !regionIds.has(route.targetRegionId) ||
      !finiteWorldPoint(route.start) ||
      !finiteWorldPoint(route.end)
    ) {
      issues.push({
        code: "MISSING_ROUTE_ENDPOINT",
        message: `Route ${route.id}의 Region 또는 endpoint가 유효하지 않습니다.`,
        severity: "error",
      });
    }
  }

  for (const settlement of model.settlements) {
    if (
      !regionIds.has(settlement.regionId) ||
      !countryIds.has(settlement.countryId)
    ) {
      issues.push({
        code: "INVALID_SETTLEMENT_ANCHOR",
        message: `${settlement.id}의 Region/Country anchor가 유효하지 않습니다.`,
        severity: "error",
      });
    }
  }

  const criticalObjects = [
    ...model.settlements,
    ...model.pois,
    ...model.institutions,
    ...model.projects,
  ];
  for (
    let firstIndex = 0;
    firstIndex < criticalObjects.length;
    firstIndex += 1
  ) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < criticalObjects.length;
      secondIndex += 1
    ) {
      const first = criticalObjects[firstIndex]!;
      const second = criticalObjects[secondIndex]!;
      if (sameWorldPoint(first.position, second.position, 0.1)) {
        issues.push({
          code: "CRITICAL_POI_OVERLAP",
          message: `기본 카메라에서 ${first.id}와 ${second.id}가 겹칩니다.`,
          severity: "error",
        });
      }
    }
  }
  if (
    architecture.sharedTerrainMesh.logicalLandHexCount !== model.hexes.length
  ) {
    issues.push({
      code: "TOPOLOGY_COUNT_CHANGED",
      message: "렌더 데이터의 LandHex 수가 authoritative topology와 다릅니다.",
      severity: "error",
    });
  }
  if (architecture.sharedTerrainMesh.sharedVertexCount <= 0) {
    issues.push({
      code: "TERRAIN_NOT_SHARED",
      message: "인접 terrain vertex가 공유되지 않았습니다.",
      severity: "error",
    });
  }
  for (const segment of architecture.political
    .physicalControllerBoundarySegments) {
    if (segment.secondLandHexId === null) continue;
    const first = hexesById.get(segment.firstLandHexId);
    const second = hexesById.get(segment.secondLandHexId);
    if (
      first !== undefined &&
      second !== undefined &&
      controllerKey(first.controller) === controllerKey(second.controller)
    ) {
      issues.push({
        code: "INTERNAL_CONTROLLER_GRID",
        message: `동일 controller 사이의 내부 경계 ${segment.id}가 노출됩니다.`,
        severity: "error",
      });
    }
  }
  if (
    architecture.political.frontBoundarySegments.some(
      (segment) =>
        !architecture.political.physicalControllerBoundarySegments.some(
          (candidate) => sameBoundaryGeometry(candidate, segment),
        ),
    )
  ) {
    issues.push({
      code: "FRONT_NOT_CONTROLLER_BOUNDARY",
      message: "front가 물리 통제 경계에서 파생되지 않았습니다.",
      severity: "error",
    });
  }
  if (
    !architecture.viewPresets.every((preset) =>
      pointInsideBounds([preset.x, 0, preset.z], architecture.contentBounds),
    )
  ) {
    issues.push({
      code: "CAMERA_PRESET_OUT_OF_BOUNDS",
      message: "하나 이상의 camera preset이 world bounds 밖에 있습니다.",
      severity: "error",
    });
  }
  for (const label of [...model.countries, ...model.regions]) {
    if (!pointInsideBounds(label.position, architecture.contentBounds)) {
      issues.push({
        code: "LABEL_HORIZONTAL_OVERFLOW",
        message: `${label.id} label anchor가 world bounds 밖에 있습니다.`,
        severity: "error",
      });
    }
  }
  const player = model.countries.find((country) => country.isPlayer);
  if (
    player === undefined ||
    !pointInsideBounds(player.position, architecture.contentBounds)
  ) {
    issues.push({
      code: "MOBILE_PLAYER_NOT_VISIBLE",
      message: "player country label이 모바일 시작 bounds 밖에 있습니다.",
      severity: "error",
    });
  }
  for (const path of [
    ...architecture.geography.coastlinePaths,
    ...architecture.geography.riverPaths,
    ...architecture.geography.roadPaths,
    ...architecture.geography.ridgePaths,
  ]) {
    if (
      path.truthClass === "DECORATIVE_SUBSTRATE" &&
      path.sourceRouteId !== undefined
    ) {
      issues.push({
        code: "DECORATIVE_MECHANIC_IMPLICATION",
        message: `${path.id} 장식 path가 authoritative route를 가장합니다.`,
        severity: "error",
      });
    }
  }
  return issues;
}

export function ideologySurfacePaletteIndex(ideologyId: string): number {
  return ideologyColorIndex(ideologyId);
}

export function mapWorldPointFromAxial(q: number, r: number): WorldScenePoint {
  return worldPositionForAxial(q, r);
}
