import type { MapArchitecture, MapLodTier } from "./mapArchitecture";
import type { MapObjectFamily, MapScaleRole } from "./mapVisual/worldArt";
import type { WorldSceneModel, WorldScenePoint } from "./worldSceneModel";

export type MapVisualScale = "macro" | "meso" | "micro";

export interface MapIntegratedPlacementLodMetadata {
  readonly family: MapObjectFamily;
  readonly scaleRole: MapScaleRole;
  readonly visibleAt: readonly MapVisualScale[];
}

const DEFAULT_FAR_LANDMARK_FAMILIES: ReadonlySet<MapObjectFamily> = new Set([
  "palace",
  "factory-iron-works",
  "fort",
]);

const DEFAULT_MEDIUM_LANDMARK_FAMILIES: ReadonlySet<MapObjectFamily> = new Set([
  "palace",
  "factory-iron-works",
  "fort",
]);

export type MapVisualAssetId =
  | "asset.capital.palace"
  | "asset.settlement.urban-cluster"
  | "asset.institution.assembly"
  | "asset.industry.works"
  | "asset.poi.mine"
  | "asset.poi.port"
  | "asset.frontier.fort-gate"
  | "asset.agriculture.fields"
  | "asset.project.granary"
  | "asset.project.works"
  | "asset.activity.crisis-beacon"
  | "asset.activity.faction-standard"
  | "asset.terrain.forest-cluster"
  | "asset.terrain.ridge"
  | "asset.infrastructure.route-corridor";

export interface MapVisualAssetDefinition {
  readonly id: MapVisualAssetId;
  readonly family:
    | "capital"
    | "settlement"
    | "institution"
    | "industry"
    | "frontier"
    | "agriculture"
    | "activity"
    | "terrain"
    | "infrastructure";
  readonly visualScale: MapVisualScale;
  readonly relativeScale: number;
  readonly geometry: "TMR_PROCEDURAL_LOW_POLY_KIT";
  readonly source: "TMR-authored-procedural";
  readonly license: "PROJECT_AUTHORED_NO_THIRD_PARTY_ASSET";
  readonly materialPreset:
    "earth-ochre" | "stone-slate" | "civic-cream" | "crisis-iron";
  readonly lod: readonly MapVisualScale[];
}

export const MAP_VISUAL_ASSET_KIT: readonly MapVisualAssetDefinition[] = [
  {
    id: "asset.capital.palace",
    family: "capital",
    visualScale: "macro",
    relativeScale: 1,
    geometry: "TMR_PROCEDURAL_LOW_POLY_KIT",
    source: "TMR-authored-procedural",
    license: "PROJECT_AUTHORED_NO_THIRD_PARTY_ASSET",
    materialPreset: "civic-cream",
    lod: ["macro", "meso", "micro"],
  },
  {
    id: "asset.settlement.urban-cluster",
    family: "settlement",
    visualScale: "meso",
    relativeScale: 0.72,
    geometry: "TMR_PROCEDURAL_LOW_POLY_KIT",
    source: "TMR-authored-procedural",
    license: "PROJECT_AUTHORED_NO_THIRD_PARTY_ASSET",
    materialPreset: "earth-ochre",
    lod: ["meso", "micro"],
  },
  {
    id: "asset.institution.assembly",
    family: "institution",
    visualScale: "meso",
    relativeScale: 0.7,
    geometry: "TMR_PROCEDURAL_LOW_POLY_KIT",
    source: "TMR-authored-procedural",
    license: "PROJECT_AUTHORED_NO_THIRD_PARTY_ASSET",
    materialPreset: "civic-cream",
    lod: ["meso", "micro"],
  },
  {
    id: "asset.industry.works",
    family: "industry",
    visualScale: "meso",
    relativeScale: 0.74,
    geometry: "TMR_PROCEDURAL_LOW_POLY_KIT",
    source: "TMR-authored-procedural",
    license: "PROJECT_AUTHORED_NO_THIRD_PARTY_ASSET",
    materialPreset: "stone-slate",
    lod: ["meso", "micro"],
  },
  {
    id: "asset.poi.mine",
    family: "industry",
    visualScale: "micro",
    relativeScale: 0.62,
    geometry: "TMR_PROCEDURAL_LOW_POLY_KIT",
    source: "TMR-authored-procedural",
    license: "PROJECT_AUTHORED_NO_THIRD_PARTY_ASSET",
    materialPreset: "stone-slate",
    lod: ["micro"],
  },
  {
    id: "asset.poi.port",
    family: "settlement",
    visualScale: "meso",
    relativeScale: 0.68,
    geometry: "TMR_PROCEDURAL_LOW_POLY_KIT",
    source: "TMR-authored-procedural",
    license: "PROJECT_AUTHORED_NO_THIRD_PARTY_ASSET",
    materialPreset: "earth-ochre",
    lod: ["meso", "micro"],
  },
  {
    id: "asset.frontier.fort-gate",
    family: "frontier",
    visualScale: "meso",
    relativeScale: 0.68,
    geometry: "TMR_PROCEDURAL_LOW_POLY_KIT",
    source: "TMR-authored-procedural",
    license: "PROJECT_AUTHORED_NO_THIRD_PARTY_ASSET",
    materialPreset: "stone-slate",
    lod: ["meso", "micro"],
  },
  {
    id: "asset.agriculture.fields",
    family: "agriculture",
    visualScale: "meso",
    relativeScale: 0.6,
    geometry: "TMR_PROCEDURAL_LOW_POLY_KIT",
    source: "TMR-authored-procedural",
    license: "PROJECT_AUTHORED_NO_THIRD_PARTY_ASSET",
    materialPreset: "earth-ochre",
    lod: ["meso", "micro"],
  },
  {
    id: "asset.project.granary",
    family: "agriculture",
    visualScale: "meso",
    relativeScale: 0.85,
    geometry: "TMR_PROCEDURAL_LOW_POLY_KIT",
    source: "TMR-authored-procedural",
    license: "PROJECT_AUTHORED_NO_THIRD_PARTY_ASSET",
    materialPreset: "civic-cream",
    lod: ["meso", "micro"],
  },
  {
    id: "asset.project.works",
    family: "industry",
    visualScale: "meso",
    relativeScale: 0.85,
    geometry: "TMR_PROCEDURAL_LOW_POLY_KIT",
    source: "TMR-authored-procedural",
    license: "PROJECT_AUTHORED_NO_THIRD_PARTY_ASSET",
    materialPreset: "stone-slate",
    lod: ["meso", "micro"],
  },
  {
    id: "asset.activity.crisis-beacon",
    family: "activity",
    visualScale: "macro",
    relativeScale: 0.45,
    geometry: "TMR_PROCEDURAL_LOW_POLY_KIT",
    source: "TMR-authored-procedural",
    license: "PROJECT_AUTHORED_NO_THIRD_PARTY_ASSET",
    materialPreset: "crisis-iron",
    lod: ["macro", "meso", "micro"],
  },
  {
    id: "asset.activity.faction-standard",
    family: "activity",
    visualScale: "micro",
    relativeScale: 0.42,
    geometry: "TMR_PROCEDURAL_LOW_POLY_KIT",
    source: "TMR-authored-procedural",
    license: "PROJECT_AUTHORED_NO_THIRD_PARTY_ASSET",
    materialPreset: "crisis-iron",
    lod: ["micro"],
  },
  {
    id: "asset.terrain.forest-cluster",
    family: "terrain",
    visualScale: "meso",
    relativeScale: 0.28,
    geometry: "TMR_PROCEDURAL_LOW_POLY_KIT",
    source: "TMR-authored-procedural",
    license: "PROJECT_AUTHORED_NO_THIRD_PARTY_ASSET",
    materialPreset: "earth-ochre",
    lod: ["meso", "micro"],
  },
  {
    id: "asset.terrain.ridge",
    family: "terrain",
    visualScale: "macro",
    relativeScale: 0.38,
    geometry: "TMR_PROCEDURAL_LOW_POLY_KIT",
    source: "TMR-authored-procedural",
    license: "PROJECT_AUTHORED_NO_THIRD_PARTY_ASSET",
    materialPreset: "stone-slate",
    lod: ["macro", "meso", "micro"],
  },
  {
    id: "asset.infrastructure.route-corridor",
    family: "infrastructure",
    visualScale: "macro",
    relativeScale: 0.35,
    geometry: "TMR_PROCEDURAL_LOW_POLY_KIT",
    source: "TMR-authored-procedural",
    license: "PROJECT_AUTHORED_NO_THIRD_PARTY_ASSET",
    materialPreset: "earth-ochre",
    lod: ["macro", "meso", "micro"],
  },
] as const;

export interface MapMaterialSystem {
  readonly terrainBase: string;
  readonly terrainSecondary: string;
  readonly terrainShadow: string;
  readonly palette: Readonly<
    Record<
      "earth-ochre" | "stone-slate" | "civic-cream" | "crisis-iron",
      string
    >
  >;
  readonly roughness: number;
  readonly metalness: number;
  readonly ambientFill: number;
  readonly keyLight: number;
  readonly fogColor: string;
  readonly fogNear: number;
  readonly fogFar: number;
  readonly contactShadowColor: string;
  readonly contactShadowOpacity: number;
}

export const MAP_MATERIAL_SYSTEM: MapMaterialSystem = {
  terrainBase: "#72765b",
  terrainSecondary: "#8a8060",
  terrainShadow: "#263b3c",
  palette: {
    "earth-ochre": "#a18a61",
    "stone-slate": "#666761",
    "civic-cream": "#d8c7a2",
    "crisis-iron": "#b84f45",
  },
  roughness: 0.92,
  metalness: 0,
  ambientFill: 0.84,
  keyLight: 1.85,
  fogColor: "#263b3c",
  fogNear: 24,
  fogFar: 52,
  contactShadowColor: "#313a31",
  contactShadowOpacity: 0.28,
};

export type MapRegionCompositionRole =
  "capital" | "industrial" | "agricultural" | "frontier" | "settlement";

export interface MapRegionComposition {
  readonly regionId: string;
  readonly role: MapRegionCompositionRole;
  readonly anchor: WorldScenePoint;
  readonly assetIds: readonly MapVisualAssetId[];
  readonly evidenceIds: readonly string[];
  readonly density: "clustered" | "linear" | "open" | "fortified";
  readonly dominantScale: number;
  readonly truthClass: "DERIVED_PRESENTATION";
}

export type MapLabelKind =
  "country" | "capital" | "crisis" | "region" | "major-poi" | "project";

export interface MapVisualLabel {
  readonly id: string;
  readonly text: string;
  readonly kind: MapLabelKind;
  readonly priority: number;
  readonly position: WorldScenePoint;
  readonly scale: number;
  readonly visibleAt: readonly MapVisualScale[];
  readonly truthClass: "AUTHORITATIVE_PROJECTION" | "DERIVED_PRESENTATION";
}

export interface MapVisualLabelPolicy {
  readonly priority: readonly MapLabelKind[];
  readonly hiddenAtMacro: readonly MapLabelKind[];
  readonly collisionGap: number;
  readonly labelHalo: string;
}

export interface MapVisualSystem {
  readonly visualScale: MapVisualScale;
  readonly assets: readonly MapVisualAssetDefinition[];
  readonly compositions: readonly MapRegionComposition[];
  readonly labels: readonly MapVisualLabel[];
  readonly material: MapMaterialSystem;
  readonly labelPolicy: MapVisualLabelPolicy;
  readonly truthClass: "DERIVED_PRESENTATION";
}

export interface MapVisualValidationIssue {
  readonly code: string;
  readonly message: string;
  readonly severity: "error" | "warning";
}

const LABEL_POLICY: MapVisualLabelPolicy = {
  priority: ["country", "capital", "crisis", "region", "project", "major-poi"],
  hiddenAtMacro: ["region", "major-poi", "project"],
  collisionGap: 0.34,
  labelHalo: "rgba(244, 234, 210, 0.92)",
};

export type MapPresentationMode = "world" | "pressure" | "crisis";

export interface MapVisibilityBudget {
  readonly mode: MapPresentationMode;
  readonly showIdeology: boolean;
  readonly showFactionPresence: boolean;
  readonly showMinorObjects: boolean;
  readonly showRouteDetails: boolean;
  readonly desktopLabelLimit: number;
}

export function deriveMapPresentationMode(
  model: WorldSceneModel,
): MapPresentationMode {
  if (model.conflicts.length > 0) return "crisis";
  const organizedPressure = model.influences.some(
    (influence) =>
      influence.organization >= 0.55 &&
      (influence.support >= 0.5 || influence.radicalism >= 0.45),
  );
  const factionPressure = model.factionPresence.some(
    (presence) => presence.organization >= 0.55,
  );
  return organizedPressure || factionPressure ? "pressure" : "world";
}

export function deriveMapVisibilityBudget(
  model: WorldSceneModel,
  lodTier: MapLodTier,
): MapVisibilityBudget {
  const mode = deriveMapPresentationMode(model);
  const crisis = mode === "crisis";
  const near = lodTier === "near";
  return {
    mode,
    showIdeology: near && mode === "pressure",
    showFactionPresence: near && mode !== "world",
    showMinorObjects: near && !crisis,
    showRouteDetails: near && !crisis,
    desktopLabelLimit: crisis ? 5 : 4,
  };
}

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function visualScaleForLod(lodTier: MapLodTier): MapVisualScale {
  if (lodTier === "far") return "macro";
  if (lodTier === "medium") return "meso";
  return "micro";
}

/**
 * Keep the authored composition plan intact while selecting only strategic
 * silhouettes for the default map read. Terrain substrates, fields, roads,
 * docks, and other small composition members remain data for focused views;
 * they are not default map art.
 */
export function selectIntegratedLandmarksForLod<
  T extends MapIntegratedPlacementLodMetadata,
>(placements: readonly T[], lodTier: MapLodTier): readonly T[] {
  const visualScale = visualScaleForLod(lodTier);
  const allowedFamilies =
    lodTier === "far"
      ? DEFAULT_FAR_LANDMARK_FAMILIES
      : lodTier === "medium"
        ? DEFAULT_MEDIUM_LANDMARK_FAMILIES
        : null;
  return placements.filter((placement) => {
    // Faction presence is represented by the connected-cluster anchor
    // helper in mapArchitecture. Never let a per-region composition
    // placement bypass that cap at near LOD.
    if (placement.family === "faction-banner") return false;
    return (
      placement.visibleAt.includes(visualScale) &&
      (allowedFamilies === null || allowedFamilies.has(placement.family))
    );
  });
}

function countryForRegion(
  model: WorldSceneModel,
  regionId: string,
): WorldSceneModel["countries"][number] | undefined {
  const region = model.regions.find(
    (candidate) => candidate.regionId === regionId,
  );
  return model.countries.find(
    (country) => country.countryId === region?.ownerCountryId,
  );
}

function regionComposition(
  model: WorldSceneModel,
  architecture: MapArchitecture,
  region: WorldSceneModel["regions"][number],
): MapRegionComposition {
  const regionHexIds = new Set<string>(
    model.hexes
      .filter((hex) => hex.regionId === region.regionId)
      .map((hex) => hex.id),
  );
  const settlement = model.settlements.find(
    (candidate) => candidate.regionId === region.regionId,
  );
  const institution = model.institutions.find(
    (candidate) => candidate.regionId === region.regionId,
  );
  const pois = model.pois.filter(
    (candidate) => candidate.regionId === region.regionId,
  );
  const projects = model.projects.filter(
    (candidate) => candidate.regionId === region.regionId,
  );
  const conflict = model.conflicts.find((candidate) =>
    candidate.regionIds.includes(region.regionId),
  );
  const frontier =
    architecture.political.legalOwnerBoundarySegments.some(
      (segment) =>
        regionHexIds.has(segment.firstLandHexId) ||
        (segment.secondLandHexId !== null &&
          regionHexIds.has(segment.secondLandHexId)),
    ) ||
    architecture.political.frontBoundarySegments.some(
      (segment) =>
        regionHexIds.has(segment.firstLandHexId) ||
        (segment.secondLandHexId !== null &&
          regionHexIds.has(segment.secondLandHexId)),
    );
  const hasIndustrial =
    pois.some((poi) => poi.kind === "mine") ||
    projects.some((project) => project.landmarkKind === "industrial");
  const hasAgriculture =
    pois.some((poi) => poi.kind === "granary") ||
    projects.some((project) => project.landmarkKind === "food");
  const isCapital =
    settlement !== undefined ||
    institution?.kind === "capital-seat" ||
    countryForRegion(model, region.regionId)?.isPlayer === true;
  let role: MapRegionCompositionRole = "settlement";
  if (isCapital) role = "capital";
  else if (hasIndustrial) role = "industrial";
  else if (hasAgriculture) role = "agricultural";
  else if (frontier || conflict !== undefined) role = "frontier";
  const evidenceIds = [
    ...(settlement === undefined ? [] : [settlement.id]),
    ...(institution === undefined ? [] : [institution.id]),
    ...pois.map((poi) => poi.id),
    ...projects.map((project) => project.id),
    ...(conflict === undefined ? [] : [conflict.id]),
  ].sort(compareStableText);
  const assets: MapVisualAssetId[] = [];
  if (
    settlement !== undefined ||
    institution !== undefined ||
    pois.length > 0 ||
    projects.length > 0
  ) {
    assets.push("asset.settlement.urban-cluster");
  }
  if (role === "capital") {
    assets.unshift("asset.capital.palace");
    if (institution !== undefined && institution.kind !== "capital-seat")
      assets.push("asset.institution.assembly");
  }
  if (role === "industrial") {
    assets.push("asset.industry.works");
    if (pois.some((poi) => poi.kind === "mine")) assets.push("asset.poi.mine");
  }
  if (role === "agricultural") {
    assets.push("asset.agriculture.fields");
    if (pois.some((poi) => poi.kind === "granary"))
      assets.push("asset.project.granary");
  }
  if (role === "frontier") assets.push("asset.frontier.fort-gate");
  if (pois.some((poi) => poi.kind === "port")) assets.push("asset.poi.port");
  if (projects.some((project) => project.landmarkKind === "industrial")) {
    assets.push("asset.project.works");
  }
  if (
    model.routes.some(
      (route) =>
        route.sourceRegionId === region.regionId ||
        route.targetRegionId === region.regionId,
    )
  ) {
    assets.push("asset.infrastructure.route-corridor");
  }
  if (conflict !== undefined) assets.push("asset.activity.crisis-beacon");
  return {
    regionId: region.regionId,
    role,
    anchor: region.position,
    assetIds: [...new Set(assets)],
    evidenceIds,
    density:
      role === "frontier"
        ? "fortified"
        : role === "agricultural"
          ? "open"
          : "clustered",
    dominantScale:
      role === "capital"
        ? 1
        : role === "industrial" || role === "agricultural"
          ? 0.85
          : 0.72,
    truthClass: "DERIVED_PRESENTATION",
  };
}

function labelCandidate(
  id: string,
  text: string,
  kind: MapLabelKind,
  position: WorldScenePoint,
  priority: number,
  scale: number,
  visibleAt: readonly MapVisualScale[],
  truthClass: MapVisualLabel["truthClass"],
): MapVisualLabel {
  return { id, text, kind, priority, position, scale, visibleAt, truthClass };
}

function candidateLabelWidth(label: MapVisualLabel): number {
  return Math.max(0.8, [...label.text].length * 0.24 * label.scale);
}

function labelCollides(first: MapVisualLabel, second: MapVisualLabel): boolean {
  return (
    Math.abs(first.position[0] - second.position[0]) <
      (candidateLabelWidth(first) + candidateLabelWidth(second)) / 2 +
        LABEL_POLICY.collisionGap &&
    Math.abs(first.position[2] - second.position[2]) <
      0.52 * Math.max(first.scale, second.scale)
  );
}

function layoutLabels(
  candidates: readonly MapVisualLabel[],
  scale: MapVisualScale,
): readonly MapVisualLabel[] {
  const order = new Map(
    LABEL_POLICY.priority.map((kind, index) => [kind, index]),
  );
  const offsets: readonly [number, number][] = [
    [0, 0.55],
    [0.95, 0.58],
    [-0.95, 0.58],
    [1.08, -0.62],
    [-1.08, -0.62],
  ];
  const occupied: MapVisualLabel[] = [];
  for (const candidate of [...candidates]
    .filter((label) => label.visibleAt.includes(scale))
    .sort(
      (first, second) =>
        (order.get(first.kind) ?? 99) - (order.get(second.kind) ?? 99) ||
        second.priority - first.priority ||
        compareStableText(first.id, second.id),
    )) {
    for (const [offsetX, offsetZ] of offsets) {
      const placed = {
        ...candidate,
        position: [
          candidate.position[0] + offsetX,
          candidate.position[1] + 0.02,
          candidate.position[2] + offsetZ,
        ] as WorldScenePoint,
      };
      if (occupied.every((other) => !labelCollides(placed, other))) {
        occupied.push(placed);
        break;
      }
    }
  }
  return occupied;
}

export function deriveMapVisualSystem(
  model: WorldSceneModel,
  architecture: MapArchitecture,
  lodTier: MapLodTier,
): MapVisualSystem {
  const visualScale = visualScaleForLod(lodTier);
  const compositions = model.regions
    .map((region) => regionComposition(model, architecture, region))
    .sort((first, second) =>
      compareStableText(first.regionId, second.regionId),
    );
  const labels: MapVisualLabel[] = [];
  for (const country of model.countries) {
    labels.push(
      labelCandidate(
        country.id,
        country.name,
        "country",
        country.position,
        country.isPlayer ? 110 : 100,
        country.isPlayer ? 1.12 : 1,
        ["macro", "meso", "micro"],
        "AUTHORITATIVE_PROJECTION",
      ),
    );
  }
  const playerCountryId = model.countries.find(
    (country) => country.isPlayer,
  )?.countryId;
  for (const settlement of model.settlements) {
    const isPlayerCapital = settlement.countryId === playerCountryId;
    labels.push(
      labelCandidate(
        settlement.id,
        settlement.name,
        "capital",
        settlement.position,
        isPlayerCapital ? 98 : 86,
        isPlayerCapital ? 0.98 : 0.84,
        isPlayerCapital ? ["meso", "micro"] : ["micro"],
        "AUTHORITATIVE_PROJECTION",
      ),
    );
  }
  for (const conflict of model.conflicts) {
    labels.push(
      labelCandidate(
        conflict.id,
        conflict.kind === "rebellion"
          ? "반란"
          : conflict.kind === "coup"
            ? "쿠데타"
            : "충돌",
        "crisis",
        conflict.position,
        140,
        0.86,
        ["macro", "meso", "micro"],
        "AUTHORITATIVE_PROJECTION",
      ),
    );
  }
  for (const region of model.regions) {
    labels.push(
      labelCandidate(
        region.id,
        region.name,
        "region",
        region.position,
        70,
        0.82,
        ["micro"],
        "AUTHORITATIVE_PROJECTION",
      ),
    );
  }
  for (const project of model.projects) {
    labels.push(
      labelCandidate(
        project.id,
        project.name,
        "project",
        project.position,
        64,
        0.74,
        ["micro"],
        "DERIVED_PRESENTATION",
      ),
    );
  }
  for (const poi of model.pois) {
    labels.push(
      labelCandidate(
        poi.id,
        poi.name,
        "major-poi",
        poi.position,
        poi.kind === "port" || poi.kind === "mine" || poi.kind === "fort"
          ? 58
          : 48,
        0.7,
        ["micro"],
        "AUTHORITATIVE_PROJECTION",
      ),
    );
  }
  return {
    visualScale,
    assets: MAP_VISUAL_ASSET_KIT,
    compositions,
    labels: layoutLabels(labels, visualScale),
    material: MAP_MATERIAL_SYSTEM,
    labelPolicy: LABEL_POLICY,
    truthClass: "DERIVED_PRESENTATION",
  };
}

export function validateMapVisualSystem(
  model: WorldSceneModel,
  architecture: MapArchitecture,
  visualSystem: MapVisualSystem,
): readonly MapVisualValidationIssue[] {
  const issues: MapVisualValidationIssue[] = [];
  const assets = new Set(MAP_VISUAL_ASSET_KIT.map((asset) => asset.id));
  if (visualSystem.compositions.length !== model.regions.length) {
    issues.push({
      code: "REGION_COMPOSITION_MISSING",
      message: "모든 Region에 authored visual composition이 없습니다.",
      severity: "error",
    });
  }
  for (const composition of visualSystem.compositions) {
    if (composition.assetIds.some((assetId) => !assets.has(assetId))) {
      issues.push({
        code: "UNKNOWN_VISUAL_ASSET",
        message: `${composition.regionId} composition이 등록되지 않은 asset을 사용합니다.`,
        severity: "error",
      });
    }
  }
  if (
    visualSystem.assets.some(
      (asset) =>
        asset.geometry !== "TMR_PROCEDURAL_LOW_POLY_KIT" ||
        asset.license !== "PROJECT_AUTHORED_NO_THIRD_PARTY_ASSET",
    )
  ) {
    issues.push({
      code: "ASSET_PROVENANCE",
      message: "visual asset kit에 provenance/license 기록이 없습니다.",
      severity: "error",
    });
  }
  if (
    visualSystem.material.roughness < 0.75 ||
    visualSystem.material.contactShadowOpacity <= 0
  ) {
    issues.push({
      code: "MATERIAL_GROUNDING",
      message: "material roughness/contact grounding 규칙이 부족합니다.",
      severity: "error",
    });
  }
  for (
    let firstIndex = 0;
    firstIndex < visualSystem.labels.length;
    firstIndex += 1
  ) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < visualSystem.labels.length;
      secondIndex += 1
    ) {
      if (
        labelCollides(
          visualSystem.labels[firstIndex]!,
          visualSystem.labels[secondIndex]!,
        )
      ) {
        issues.push({
          code: "LABEL_COLLISION",
          message: `${visualSystem.labels[firstIndex]!.id}와 ${visualSystem.labels[secondIndex]!.id} label이 겹칩니다.`,
          severity: "error",
        });
      }
    }
  }
  if (
    architecture.sharedTerrainMesh.logicalLandHexCount !== model.hexes.length
  ) {
    issues.push({
      code: "VISUAL_TOPOLOGY_DRIFT",
      message: "visual system이 authoritative LandHex count와 어긋납니다.",
      severity: "error",
    });
  }
  return issues;
}

export function mapVisualScaleForLod(lodTier: MapLodTier): MapVisualScale {
  return visualScaleForLod(lodTier);
}
