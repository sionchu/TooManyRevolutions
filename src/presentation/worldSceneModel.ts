import type {
  PresentationConflict,
  PresentationCountry,
  PresentationLandHex,
  PresentationRegion,
  PresentationState,
} from "./presentationState";
import type { LandHexTerrain } from "../sim/state/territorialTopology";
import {
  authoredWorldSceneContentForScenario,
  type AuthoredWorldSceneContent,
  type AuthoredWorldSceneInstitutionDefinition,
  type AuthoredWorldScenePoiDefinition,
  type WorldSceneInstitutionKind,
  type WorldScenePoiKind,
} from "./worldSceneContent";

export type WorldSceneTruthClass =
  "AUTHORITATIVE_PROJECTION" | "DERIVED_PRESENTATION" | "DECORATIVE_SUBSTRATE";

export type WorldSceneObjectFamily =
  | "SettlementVisual"
  | "PoiVisual"
  | "StateProjectVisual"
  | "FactionActivityVisual"
  | "ConflictActivityVisual"
  | "RouteActivityVisual"
  | "InstitutionLandmarkVisual"
  | "DecorativeTerrainVisual";

export type WorldSceneRouteVisualKind =
  | "trade-warm-flow"
  | "information-signal"
  | "migration-direction"
  | "border-gate";

export type WorldSceneFactionVisualKind = "banner" | "occupied-site";

export type WorldSceneConflictVisualKind =
  "rebellion-camp" | "coup-beacon" | "armed-conflict-front";

export type WorldSceneProjectSilhouette =
  "granary" | "assembly-hall" | "workshop";

export type WorldSceneProjectStatus =
  "not-started" | "implementing" | "completed";

export type WorldScenePoint = readonly [x: number, y: number, z: number];

export interface WorldSceneProjectInput {
  readonly id: string;
  readonly name: string;
  readonly anchorRegionId: PresentationRegion["regionId"];
  readonly landmarkKind: "food" | "civic" | "industrial";
  readonly status: WorldSceneProjectStatus;
  readonly progress: number;
  readonly sourceEventIds: readonly string[];
}

export interface WorldSceneHex {
  readonly id: PresentationLandHex["landHexId"];
  readonly regionId: PresentationLandHex["regionId"];
  /** Axial topology retained for renderer geometry; no topology is authored here. */
  readonly coordinate: PresentationLandHex["coordinate"];
  readonly terrain: LandHexTerrain;
  readonly controller: PresentationLandHex["controller"];
  readonly ownerCountryId: PresentationRegion["ownerCountryId"];
  readonly position: WorldScenePoint;
  readonly height: number;
  readonly objectFamily: "DecorativeTerrainVisual";
  readonly truthClass: "AUTHORITATIVE_PROJECTION";
}

export interface WorldSceneCountryLabel {
  readonly id: string;
  readonly countryId: PresentationCountry["countryId"];
  readonly name: string;
  readonly position: WorldScenePoint;
  readonly isPlayer: boolean;
  readonly truthClass: "AUTHORITATIVE_PROJECTION";
}

export interface WorldSceneSettlement {
  readonly id: string;
  readonly countryId: PresentationCountry["countryId"];
  readonly regionId: PresentationRegion["regionId"];
  readonly name: string;
  readonly kind: "capital";
  readonly objectFamily: "SettlementVisual";
  readonly visualKind: "capital-palace";
  readonly position: WorldScenePoint;
  readonly truthClass: "AUTHORITATIVE_PROJECTION";
}

export interface WorldScenePoi {
  readonly id: string;
  readonly countryId: PresentationCountry["countryId"];
  readonly regionId: PresentationRegion["regionId"];
  readonly anchorLandHexId: PresentationLandHex["landHexId"];
  readonly name: string;
  readonly kind: WorldScenePoiKind;
  readonly objectFamily: "PoiVisual";
  readonly position: WorldScenePoint;
  readonly truthClass: "AUTHORITATIVE_PROJECTION";
}

export interface WorldSceneInstitutionLandmark {
  readonly id: string;
  readonly countryId: PresentationCountry["countryId"];
  readonly regionId: PresentationRegion["regionId"];
  readonly anchorLandHexId: PresentationLandHex["landHexId"];
  readonly name: string;
  readonly kind: WorldSceneInstitutionKind;
  readonly objectFamily: "InstitutionLandmarkVisual";
  readonly position: WorldScenePoint;
  readonly truthClass: "AUTHORITATIVE_PROJECTION";
}

export interface WorldSceneRegionLabel {
  readonly id: string;
  readonly regionId: PresentationRegion["regionId"];
  readonly ownerCountryId: PresentationRegion["ownerCountryId"];
  readonly name: string;
  readonly unrest: number;
  readonly scarcity: number;
  readonly position: WorldScenePoint;
  readonly truthClass: "AUTHORITATIVE_PROJECTION";
}

export interface WorldSceneInfluence {
  readonly id: string;
  readonly regionId: PresentationRegion["regionId"];
  readonly ideologyId: string;
  readonly support: number;
  readonly radicalism: number;
  readonly organization: number;
  readonly position: WorldScenePoint;
  readonly truthClass: "AUTHORITATIVE_PROJECTION";
}

export interface WorldSceneRoute {
  readonly id: string;
  readonly sourceRegionId: PresentationRegion["regionId"];
  readonly targetRegionId: PresentationRegion["regionId"];
  readonly channel: PresentationState["contactRoutes"][number]["channel"];
  readonly active: boolean;
  readonly strength: number;
  readonly objectFamily: "RouteActivityVisual";
  readonly visualKind: WorldSceneRouteVisualKind;
  readonly start: WorldScenePoint;
  readonly end: WorldScenePoint;
  readonly truthClass: "AUTHORITATIVE_PROJECTION";
}

export interface WorldSceneFactionPresence {
  readonly id: string;
  readonly factionId: string;
  readonly regionId: PresentationRegion["regionId"];
  readonly controlledLandHexIds: readonly string[];
  readonly position: WorldScenePoint;
  readonly organization: number;
  readonly objectFamily: "FactionActivityVisual";
  readonly visualKind: WorldSceneFactionVisualKind;
  readonly truthClass: "AUTHORITATIVE_PROJECTION";
}

export interface WorldSceneConflictMarker {
  readonly id: string;
  readonly conflictId: PresentationConflict["conflictId"];
  readonly kind: PresentationConflict["kind"];
  readonly regionIds: readonly PresentationRegion["regionId"][];
  readonly position: WorldScenePoint;
  readonly objectFamily: "ConflictActivityVisual";
  readonly visualKind: WorldSceneConflictVisualKind;
  readonly truthClass: "AUTHORITATIVE_PROJECTION";
}

export interface WorldSceneFront {
  readonly id: string;
  readonly conflictId: string;
  readonly firstLandHexId: string;
  readonly secondLandHexId: string;
  readonly start: WorldScenePoint;
  readonly end: WorldScenePoint;
  readonly truthClass: "DERIVED_PRESENTATION";
}

export interface WorldSceneProjectLandmark {
  readonly id: string;
  readonly name: string;
  readonly regionId: PresentationRegion["regionId"];
  readonly landmarkKind: WorldSceneProjectInput["landmarkKind"];
  readonly silhouette: WorldSceneProjectSilhouette;
  readonly status: WorldSceneProjectStatus;
  readonly progress: number;
  readonly sourceEventIds: readonly string[];
  readonly position: WorldScenePoint;
  readonly objectFamily: "StateProjectVisual";
  readonly truthClass: "DERIVED_PRESENTATION";
}

export interface WorldSceneModel {
  readonly scenarioId: PresentationState["scenarioId"];
  readonly tick: number;
  readonly date: PresentationState["date"];
  readonly hexes: readonly WorldSceneHex[];
  readonly countries: readonly WorldSceneCountryLabel[];
  readonly regions: readonly WorldSceneRegionLabel[];
  readonly influences: readonly WorldSceneInfluence[];
  readonly settlements: readonly WorldSceneSettlement[];
  readonly pois: readonly WorldScenePoi[];
  readonly institutions: readonly WorldSceneInstitutionLandmark[];
  readonly routes: readonly WorldSceneRoute[];
  readonly factionPresence: readonly WorldSceneFactionPresence[];
  readonly conflicts: readonly WorldSceneConflictMarker[];
  readonly fronts: readonly WorldSceneFront[];
  readonly projects: readonly WorldSceneProjectLandmark[];
  readonly bounds: {
    readonly minX: number;
    readonly maxX: number;
    readonly minZ: number;
    readonly maxZ: number;
  };
}

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function hashColorIndex(value: string, length: number): number {
  let hash = 0;
  for (const character of value)
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return hash % length;
}

export function worldPositionForAxial(q: number, r: number): WorldScenePoint {
  return [1.74 * (q + r / 2), 0, 1.52 * r];
}

export function terrainHeight(terrain: LandHexTerrain): number {
  switch (terrain) {
    case "coast":
      return 0.08;
    case "wetlands":
      return 0.1;
    case "plains":
      return 0.12;
    case "forest":
      return 0.18;
    case "hills":
      return 0.28;
    case "mountains":
      return 0.38;
  }
}

function routeVisualKind(
  channel: PresentationState["contactRoutes"][number]["channel"],
): WorldSceneRouteVisualKind {
  switch (channel) {
    case "trade":
      return "trade-warm-flow";
    case "information":
      return "information-signal";
    case "migration":
      return "migration-direction";
    case "border":
      return "border-gate";
  }
}

function projectSilhouette(
  landmarkKind: WorldSceneProjectInput["landmarkKind"],
): WorldSceneProjectSilhouette {
  switch (landmarkKind) {
    case "food":
      return "granary";
    case "civic":
      return "assembly-hall";
    case "industrial":
      return "workshop";
  }
}

function factionVisualKind(
  controlledLandHexIds: readonly string[],
): WorldSceneFactionVisualKind {
  return controlledLandHexIds.length > 0 ? "occupied-site" : "banner";
}

function conflictVisualKind(
  kind: PresentationConflict["kind"],
): WorldSceneConflictVisualKind {
  switch (kind) {
    case "rebellion":
      return "rebellion-camp";
    case "coup":
      return "coup-beacon";
    default:
      return "armed-conflict-front";
  }
}

function averagePosition(points: readonly WorldScenePoint[]): WorldScenePoint {
  if (points.length === 0) return [0, 0, 0];
  const ordered = [...points].sort(
    (first, second) =>
      first[0] - second[0] || first[1] - second[1] || first[2] - second[2],
  );
  return [
    ordered.reduce((total, point) => total + point[0], 0) / ordered.length,
    ordered.reduce((total, point) => total + point[1], 0) / ordered.length,
    ordered.reduce((total, point) => total + point[2], 0) / ordered.length,
  ];
}

function regionPositions(
  hexes: readonly WorldSceneHex[],
): ReadonlyMap<string, WorldScenePoint> {
  const grouped = new Map<string, WorldScenePoint[]>();
  for (const hex of hexes) {
    const current = grouped.get(hex.regionId) ?? [];
    current.push([hex.position[0], hex.height, hex.position[2]]);
    grouped.set(hex.regionId, current);
  }
  return new Map(
    [...grouped.entries()].map(([regionId, points]) => [
      regionId,
      averagePosition(points),
    ]),
  );
}

function createHexes(
  presentation: PresentationState,
): readonly WorldSceneHex[] {
  const regions = new Map(
    presentation.regions.map((region) => [region.regionId, region]),
  );
  return [...presentation.landHexes]
    .sort((first, second) =>
      compareStableText(first.landHexId, second.landHexId),
    )
    .map((hex) => {
      const region = regions.get(hex.regionId);
      if (region === undefined) {
        throw new Error(`WorldSceneModel is missing Region ${hex.regionId}.`);
      }
      return {
        id: hex.landHexId,
        regionId: hex.regionId,
        coordinate: { ...hex.coordinate },
        terrain: hex.terrain,
        controller: hex.controller,
        ownerCountryId: region.ownerCountryId,
        position: worldPositionForAxial(hex.coordinate.q, hex.coordinate.r),
        height: terrainHeight(hex.terrain),
        objectFamily: "DecorativeTerrainVisual" as const,
        truthClass: "AUTHORITATIVE_PROJECTION" as const,
      };
    });
}

function createCountryLabels(
  presentation: PresentationState,
  regionCenters: ReadonlyMap<string, WorldScenePoint>,
): readonly WorldSceneCountryLabel[] {
  const regionsByCountry = new Map<string, WorldScenePoint[]>();
  for (const region of presentation.regions) {
    const center = regionCenters.get(region.regionId);
    if (center === undefined) continue;
    const points = regionsByCountry.get(region.ownerCountryId) ?? [];
    points.push(center);
    regionsByCountry.set(region.ownerCountryId, points);
  }
  return [...presentation.countries]
    .sort((first, second) =>
      compareStableText(first.countryId, second.countryId),
    )
    .flatMap((country) => {
      const points = regionsByCountry.get(country.countryId);
      if (points === undefined) return [];
      const center = averagePosition(points);
      return center === undefined
        ? []
        : [
            {
              id: `country-label:${country.countryId}`,
              countryId: country.countryId,
              name: country.name,
              position: [center[0], 0.8, center[2]] as WorldScenePoint,
              isPlayer: country.isPlayer,
              truthClass: "AUTHORITATIVE_PROJECTION" as const,
            },
          ];
    });
}

function createSettlements(
  presentation: PresentationState,
  regionCenters: ReadonlyMap<string, WorldScenePoint>,
): readonly WorldSceneSettlement[] {
  const countriesById = new Map(
    presentation.countries.map((country) => [country.countryId, country]),
  );
  return [...presentation.countries]
    .sort((first, second) =>
      compareStableText(first.countryId, second.countryId),
    )
    .flatMap((country) => {
      if (country.capitalRegionId === null) return [];
      const center = regionCenters.get(country.capitalRegionId);
      if (
        center === undefined ||
        countriesById.get(country.countryId) === undefined
      ) {
        return [];
      }
      return [
        {
          id: `settlement:capital:${country.countryId}`,
          countryId: country.countryId,
          regionId: country.capitalRegionId,
          name: `${country.name} 수도`,
          kind: "capital" as const,
          objectFamily: "SettlementVisual" as const,
          visualKind: "capital-palace" as const,
          position: [center[0], 0.62, center[2]] as WorldScenePoint,
          truthClass: "AUTHORITATIVE_PROJECTION" as const,
        },
      ];
    });
}

function authoredObjectPosition(
  definition: {
    readonly anchorLandHexId: string;
    readonly regionId: string;
    readonly offsetX: number;
    readonly offsetZ: number;
  },
  hexesById: ReadonlyMap<string, WorldSceneHex>,
): WorldScenePoint | null {
  const hex = hexesById.get(definition.anchorLandHexId);
  if (hex === undefined || hex.regionId !== definition.regionId) return null;
  return [
    hex.position[0] + definition.offsetX,
    hex.height + 0.04,
    hex.position[2] + definition.offsetZ,
  ];
}

function createPois(
  presentation: PresentationState,
  content: AuthoredWorldSceneContent,
  hexesById: ReadonlyMap<string, WorldSceneHex>,
): readonly WorldScenePoi[] {
  const regions = new Map(
    presentation.regions.map((region) => [region.regionId, region]),
  );
  return [...content.pois]
    .sort((first, second) => compareStableText(first.id, second.id))
    .flatMap((definition: AuthoredWorldScenePoiDefinition) => {
      const region = regions.get(definition.regionId);
      const position = authoredObjectPosition(definition, hexesById);
      return region === undefined || position === null
        ? []
        : [
            {
              id: definition.id,
              countryId: region.ownerCountryId,
              regionId: definition.regionId,
              anchorLandHexId: definition.anchorLandHexId,
              name: definition.name,
              kind: definition.kind,
              objectFamily: "PoiVisual" as const,
              position,
              truthClass: "AUTHORITATIVE_PROJECTION" as const,
            },
          ];
    });
}

function createInstitutionLandmarks(
  presentation: PresentationState,
  content: AuthoredWorldSceneContent,
  hexesById: ReadonlyMap<string, WorldSceneHex>,
): readonly WorldSceneInstitutionLandmark[] {
  const regions = new Map(
    presentation.regions.map((region) => [region.regionId, region]),
  );
  return [...content.institutions]
    .sort((first, second) => compareStableText(first.id, second.id))
    .flatMap((definition: AuthoredWorldSceneInstitutionDefinition) => {
      const region = regions.get(definition.regionId);
      const position = authoredObjectPosition(definition, hexesById);
      return region === undefined || position === null
        ? []
        : [
            {
              id: definition.id,
              countryId: region.ownerCountryId,
              regionId: definition.regionId,
              anchorLandHexId: definition.anchorLandHexId,
              name: definition.name,
              kind: definition.kind,
              objectFamily: "InstitutionLandmarkVisual" as const,
              position,
              truthClass: "AUTHORITATIVE_PROJECTION" as const,
            },
          ];
    });
}

function createRegionLabels(
  presentation: PresentationState,
  regionCenters: ReadonlyMap<string, WorldScenePoint>,
): readonly WorldSceneRegionLabel[] {
  return [...presentation.regions]
    .sort((first, second) => compareStableText(first.regionId, second.regionId))
    .flatMap((region) => {
      const center = regionCenters.get(region.regionId);
      return center === undefined
        ? []
        : [
            {
              id: `region-label:${region.regionId}`,
              regionId: region.regionId,
              ownerCountryId: region.ownerCountryId,
              name: region.name,
              unrest: region.unrest,
              scarcity: region.scarcity,
              position: [center[0], 0.42, center[2]] as WorldScenePoint,
              truthClass: "AUTHORITATIVE_PROJECTION" as const,
            },
          ];
    });
}

function createInfluences(
  presentation: PresentationState,
  regionCenters: ReadonlyMap<string, WorldScenePoint>,
): readonly WorldSceneInfluence[] {
  return [...presentation.regions]
    .sort((first, second) => compareStableText(first.regionId, second.regionId))
    .flatMap((region) => {
      const strongest = [...region.politicalInfluence].sort(
        (first, second) =>
          second.support - first.support ||
          compareStableText(first.ideologyId, second.ideologyId),
      )[0];
      const center = regionCenters.get(region.regionId);
      return strongest === undefined || center === undefined
        ? []
        : [
            {
              id: `influence:${region.regionId}:${strongest.ideologyId}`,
              regionId: region.regionId,
              ideologyId: strongest.ideologyId,
              support: strongest.support,
              radicalism: strongest.radicalism,
              organization: strongest.organization,
              position: [center[0], 0.54, center[2]] as WorldScenePoint,
              truthClass: "AUTHORITATIVE_PROJECTION" as const,
            },
          ];
    });
}

function createRoutes(
  presentation: PresentationState,
  regionCenters: ReadonlyMap<string, WorldScenePoint>,
): readonly WorldSceneRoute[] {
  return [...presentation.contactRoutes]
    .sort((first, second) => compareStableText(first.routeId, second.routeId))
    .flatMap((route) => {
      const start = regionCenters.get(route.sourceRegionId);
      const end = regionCenters.get(route.targetRegionId);
      return start === undefined || end === undefined
        ? []
        : [
            {
              id: route.routeId,
              sourceRegionId: route.sourceRegionId,
              targetRegionId: route.targetRegionId,
              channel: route.channel,
              active: route.active,
              strength: route.effectiveStrength,
              objectFamily: "RouteActivityVisual" as const,
              visualKind: routeVisualKind(route.channel),
              start: [start[0], 0.18, start[2]] as WorldScenePoint,
              end: [end[0], 0.18, end[2]] as WorldScenePoint,
              truthClass: "AUTHORITATIVE_PROJECTION" as const,
            },
          ];
    });
}

function createFactionPresence(
  presentation: PresentationState,
  hexesById: ReadonlyMap<string, WorldSceneHex>,
): readonly WorldSceneFactionPresence[] {
  return [...presentation.organizationTokens]
    .sort((first, second) => compareStableText(first.tokenId, second.tokenId))
    .flatMap((token) => {
      const positions = token.controlledLandHexIds.flatMap((id) => {
        const hex = hexesById.get(id);
        return hex === undefined
          ? []
          : [[hex.position[0], hex.height, hex.position[2]] as WorldScenePoint];
      });
      return positions.length === 0
        ? []
        : [
            {
              id: token.tokenId,
              factionId: token.factionId,
              regionId: token.regionId,
              controlledLandHexIds: [...token.controlledLandHexIds].sort(
                compareStableText,
              ),
              position: averagePosition(positions),
              organization: token.organization,
              objectFamily: "FactionActivityVisual" as const,
              visualKind: factionVisualKind(token.controlledLandHexIds),
              truthClass: "AUTHORITATIVE_PROJECTION" as const,
            },
          ];
    });
}

function createConflicts(
  presentation: PresentationState,
  regionCenters: ReadonlyMap<string, WorldScenePoint>,
): readonly WorldSceneConflictMarker[] {
  return [...presentation.activeConflicts]
    .sort((first, second) =>
      compareStableText(first.conflictId, second.conflictId),
    )
    .flatMap((conflict) => {
      const regionIds = [
        ...new Set([
          ...conflict.affectedRegionIds,
          ...conflict.contestedRegionIds,
        ]),
      ].sort(compareStableText);
      const points = regionIds.flatMap((regionId) => {
        const center = regionCenters.get(regionId);
        return center === undefined
          ? []
          : [[center[0], 1.02, center[2]] as WorldScenePoint];
      });
      return points.length === 0
        ? []
        : [
            {
              id: `conflict:${conflict.conflictId}`,
              conflictId: conflict.conflictId,
              kind: conflict.kind,
              regionIds,
              position: averagePosition(points),
              objectFamily: "ConflictActivityVisual" as const,
              visualKind: conflictVisualKind(conflict.kind),
              truthClass: "AUTHORITATIVE_PROJECTION" as const,
            },
          ];
    });
}

function createFronts(
  presentation: PresentationState,
  hexesById: ReadonlyMap<string, WorldSceneHex>,
): readonly WorldSceneFront[] {
  return [...presentation.fronts]
    .sort((first, second) => compareStableText(first.frontId, second.frontId))
    .flatMap((front) => {
      const start = hexesById.get(front.firstLandHexId);
      const end = hexesById.get(front.secondLandHexId);
      return start === undefined || end === undefined
        ? []
        : [
            {
              id: front.frontId,
              conflictId: front.conflictId,
              firstLandHexId: front.firstLandHexId,
              secondLandHexId: front.secondLandHexId,
              start: [
                start.position[0],
                start.height + 0.05,
                start.position[2],
              ] as WorldScenePoint,
              end: [
                end.position[0],
                end.height + 0.05,
                end.position[2],
              ] as WorldScenePoint,
              truthClass: "DERIVED_PRESENTATION" as const,
            },
          ];
    });
}

function createProjects(
  projects: readonly WorldSceneProjectInput[],
  regionCenters: ReadonlyMap<string, WorldScenePoint>,
): readonly WorldSceneProjectLandmark[] {
  const slotsByRegion = new Map<string, number>();
  const offsets: readonly [number, number][] = [
    [0.36, -0.34],
    [-0.42, -0.18],
    [0.38, 0.34],
    [-0.38, 0.36],
  ];
  return [...projects]
    .sort((first, second) => compareStableText(first.id, second.id))
    .flatMap((project) => {
      const center = regionCenters.get(project.anchorRegionId);
      return center === undefined
        ? []
        : (() => {
            const slot = slotsByRegion.get(project.anchorRegionId) ?? 0;
            slotsByRegion.set(project.anchorRegionId, slot + 1);
            const [offsetX, offsetZ] = offsets[slot % offsets.length]!;
            return [
              {
                id: project.id,
                name: project.name,
                regionId: project.anchorRegionId,
                landmarkKind: project.landmarkKind,
                silhouette: projectSilhouette(project.landmarkKind),
                status: project.status,
                progress: project.progress,
                sourceEventIds: [...project.sourceEventIds].sort(
                  compareStableText,
                ),
                position: [
                  center[0] + offsetX,
                  0.96,
                  center[2] + offsetZ,
                ] as WorldScenePoint,
                objectFamily: "StateProjectVisual" as const,
                truthClass: "DERIVED_PRESENTATION" as const,
              },
            ];
          })();
    });
}

export function deriveWorldSceneModel(
  presentation: PresentationState,
  projects: readonly WorldSceneProjectInput[] = [],
): WorldSceneModel {
  const hexes = createHexes(presentation);
  const regionCenters = regionPositions(hexes);
  const hexesById = new Map(hexes.map((hex) => [hex.id, hex]));
  const authoredContent = authoredWorldSceneContentForScenario(
    presentation.scenarioId,
  );
  const allPoints = hexes.map((hex) => hex.position);
  if (allPoints.length === 0) {
    throw new Error("WorldSceneModel requires at least one LandHex.");
  }
  return {
    scenarioId: presentation.scenarioId,
    tick: presentation.tick,
    date: { ...presentation.date },
    hexes,
    countries: createCountryLabels(presentation, regionCenters),
    regions: createRegionLabels(presentation, regionCenters),
    influences: createInfluences(presentation, regionCenters),
    settlements: createSettlements(presentation, regionCenters),
    pois: createPois(presentation, authoredContent, hexesById),
    institutions: createInstitutionLandmarks(
      presentation,
      authoredContent,
      hexesById,
    ),
    routes: createRoutes(presentation, regionCenters),
    factionPresence: createFactionPresence(presentation, hexesById),
    conflicts: createConflicts(presentation, regionCenters),
    fronts: createFronts(presentation, hexesById),
    projects: createProjects(projects, regionCenters),
    bounds: {
      minX: Math.min(...allPoints.map((point) => point[0])),
      maxX: Math.max(...allPoints.map((point) => point[0])),
      minZ: Math.min(...allPoints.map((point) => point[2])),
      maxZ: Math.max(...allPoints.map((point) => point[2])),
    },
  };
}

export function controllerFamily(
  controller: PresentationLandHex["controller"],
): "country" | "faction" | "uncontrolled" {
  return controller.kind;
}

export function countryAccentIndex(countryId: string): number {
  return hashColorIndex(countryId, 3);
}
