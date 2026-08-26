import {
  getWorldObjectVisualDefinition,
  MAP_SCALE_HIERARCHY,
  type MapMaterialFamilyId,
  type MapObjectAssetId,
  type MapObjectFamily,
  type MapScaleRole,
} from "../mapVisual/worldArt";
import type { WorldSceneModel } from "../worldSceneModel";

export type RegionCompositionRole =
  "capital" | "industrial" | "port" | "frontier" | "agrarian-distribution";

export type CompositionObjectRequirement =
  | "DECORATIVE_SUBSTRATE"
  | "AUTHORED_STATIC_POI"
  | "AUTHORED_SETTLEMENT"
  | "RECORDED_INSTITUTION"
  | "RECORDED_PROJECT"
  | "RECORDED_FACTION"
  | "RECORDED_CONFLICT"
  | "RECORDED_ROUTE";

export type CompositionVisibility = "macro" | "meso" | "micro";

export type RegionCompositionSettlementEvidence = Pick<
  WorldSceneModel["settlements"][number],
  "id" | "regionId" | "kind" | "truthClass"
>;

export type RegionCompositionPoiEvidence = Pick<
  WorldSceneModel["pois"][number],
  "id" | "regionId" | "kind" | "truthClass"
>;

export type RegionCompositionInstitutionEvidence = Pick<
  WorldSceneModel["institutions"][number],
  "id" | "regionId" | "kind" | "truthClass"
>;

export type RegionCompositionProjectEvidence = Pick<
  WorldSceneModel["projects"][number],
  | "id"
  | "regionId"
  | "landmarkKind"
  | "status"
  | "sourceEventIds"
  | "truthClass"
>;

export type RegionCompositionFactionEvidence = Pick<
  WorldSceneModel["factionPresence"][number],
  "id" | "factionId" | "regionId" | "truthClass"
>;

export type RegionCompositionConflictEvidence = Pick<
  WorldSceneModel["conflicts"][number],
  "id" | "conflictId" | "regionIds" | "truthClass"
>;

export type RegionCompositionRouteEvidence = Pick<
  WorldSceneModel["routes"][number],
  "id" | "sourceRegionId" | "targetRegionId" | "active" | "truthClass"
>;

/**
 * The adapter receives only the presentation facts needed to authorize art.
 * It never receives or mutates WorldState.
 */
export interface RegionCompositionEvidence {
  readonly settlements: readonly RegionCompositionSettlementEvidence[];
  readonly pois: readonly RegionCompositionPoiEvidence[];
  readonly institutions: readonly RegionCompositionInstitutionEvidence[];
  readonly projects: readonly RegionCompositionProjectEvidence[];
  readonly factionPresence: readonly RegionCompositionFactionEvidence[];
  readonly conflicts: readonly RegionCompositionConflictEvidence[];
  readonly routes: readonly RegionCompositionRouteEvidence[];
}

export interface RegionCompositionObjectPlacement {
  readonly assetId: MapObjectAssetId;
  readonly family: MapObjectFamily;
  readonly scaleRole: MapScaleRole;
  readonly scaleRank: number;
  readonly offset: readonly [x: number, z: number];
  readonly visibleAt: readonly CompositionVisibility[];
  readonly requirement: CompositionObjectRequirement;
}

export interface RegionCompositionTemplate {
  readonly compositionId: string;
  readonly role: RegionCompositionRole;
  readonly displayName: string;
  readonly silhouetteCue: string;
  readonly terrainSignatures: readonly string[];
  readonly density: "clustered" | "linear" | "open" | "fortified";
  readonly groundingMaterial: MapMaterialFamilyId;
  readonly readingOrder: readonly MapObjectFamily[];
  readonly objects: readonly RegionCompositionObjectPlacement[];
  readonly source: "TMR-authored-region-template";
}

export interface RegionCompositionRequest {
  readonly regionId: string;
  readonly role: RegionCompositionRole;
  readonly anchor: readonly [x: number, z: number];
  readonly evidence: RegionCompositionEvidence;
}

export interface RegionCompositionDefinition extends RegionCompositionTemplate {
  readonly regionId: string;
  readonly anchor: readonly [x: number, z: number];
  readonly evidence: RegionCompositionEvidence;
  readonly binding: "renderer-neutral-presentation-template";
}

function placement(
  family: MapObjectFamily,
  offset: readonly [x: number, z: number],
  visibleAt: readonly CompositionVisibility[],
  requirement: CompositionObjectRequirement,
): RegionCompositionObjectPlacement {
  const visual = getWorldObjectVisualDefinition(family);
  if (visual === undefined) {
    throw new Error(`Missing world-art manifest entry for ${family}.`);
  }
  return {
    assetId: visual.assetId,
    family,
    scaleRole: visual.scaleRole,
    scaleRank: MAP_SCALE_HIERARCHY[visual.scaleRole].rank,
    offset,
    visibleAt,
    requirement,
  };
}

const macroMesoMicro: readonly CompositionVisibility[] = [
  "macro",
  "meso",
  "micro",
];
const mesoMicro: readonly CompositionVisibility[] = ["meso", "micro"];
const micro: readonly CompositionVisibility[] = ["micro"];

export const REGION_COMPOSITION_TEMPLATES: Readonly<
  Record<RegionCompositionRole, RegionCompositionTemplate>
> = {
  capital: {
    compositionId: "tmr.map.composition.capital",
    role: "capital",
    displayName: "수도·시민 권력 중심",
    silhouetteCue:
      "높은 궁전 축, 낮은 공회당, 조밀한 시가지가 한 공공 테라스에 모임",
    terrainSignatures: ["civic-terrace", "managed-grove", "broad-approach"],
    density: "clustered",
    groundingMaterial: "civic-plaster",
    readingOrder: [
      "palace",
      "assembly-parliament",
      "dense-town",
      "forest-cluster",
    ],
    objects: [
      placement("palace", [0, 0], macroMesoMicro, "AUTHORED_SETTLEMENT"),
      placement(
        "assembly-parliament",
        [-0.62, 0.2],
        mesoMicro,
        "RECORDED_INSTITUTION",
      ),
      placement("dense-town", [0.55, 0.28], mesoMicro, "AUTHORED_SETTLEMENT"),
      placement(
        "forest-cluster",
        [0.4, -0.58],
        mesoMicro,
        "DECORATIVE_SUBSTRATE",
      ),
    ],
    source: "TMR-authored-region-template",
  },
  industrial: {
    compositionId: "tmr.map.composition.industrial",
    role: "industrial",
    displayName: "산업·철산 생산 중심",
    silhouetteCue:
      "넓은 작업동과 연통, 원료 산지, 도시 노동권이 하나의 생산 축을 이룸",
    terrainSignatures: ["ore-ridge", "works-yard", "haul-approach"],
    density: "linear",
    groundingMaterial: "industrial-iron",
    readingOrder: [
      "factory-iron-works",
      "mine",
      "dense-town",
      "mountain-cluster",
      "road-corridor",
    ],
    objects: [
      placement("factory-iron-works", [0, 0], mesoMicro, "RECORDED_PROJECT"),
      placement("mine", [-0.6, -0.24], micro, "AUTHORED_STATIC_POI"),
      placement("dense-town", [0.5, 0.28], mesoMicro, "AUTHORED_SETTLEMENT"),
      placement(
        "mountain-cluster",
        [0.52, -0.56],
        macroMesoMicro,
        "DECORATIVE_SUBSTRATE",
      ),
      placement(
        "road-corridor",
        [0.02, 0.58],
        macroMesoMicro,
        "RECORDED_ROUTE",
      ),
    ],
    source: "TMR-authored-region-template",
  },
  port: {
    compositionId: "tmr.map.composition.port",
    role: "port",
    displayName: "항구·교역 관문",
    silhouetteCue:
      "수면을 향한 선형 부두, 돛대, 배후 상업 도시가 한 해안 접점으로 읽힘",
    terrainSignatures: ["water-shelf", "tidal-edge", "trade-approach"],
    density: "linear",
    groundingMaterial: "terrain-earth",
    readingOrder: [
      "water-shelf",
      "port-dock",
      "dense-town",
      "small-settlement",
      "road-corridor",
      "field-plot",
    ],
    objects: [
      placement(
        "water-shelf",
        [0, 0.24],
        macroMesoMicro,
        "DECORATIVE_SUBSTRATE",
      ),
      placement("port-dock", [0, 0], mesoMicro, "AUTHORED_STATIC_POI"),
      placement("dense-town", [-0.48, 0.28], mesoMicro, "AUTHORED_SETTLEMENT"),
      placement("small-settlement", [0.5, -0.3], micro, "AUTHORED_SETTLEMENT"),
      placement(
        "road-corridor",
        [-0.04, 0.58],
        macroMesoMicro,
        "RECORDED_ROUTE",
      ),
      placement("field-plot", [0.52, 0.48], mesoMicro, "DECORATIVE_SUBSTRATE"),
    ],
    source: "TMR-authored-region-template",
  },
  frontier: {
    compositionId: "tmr.map.composition.frontier",
    role: "frontier",
    displayName: "변경·국경 방어선",
    silhouetteCue:
      "성벽 요새와 통과구, 작은 취락이 능선과 봉쇄 동선에 걸쳐 있음",
    terrainSignatures: ["watch-ridge", "border-approach", "rough-ground"],
    density: "fortified",
    groundingMaterial: "frontier-timber",
    readingOrder: [
      "fort",
      "checkpoint-gate",
      "small-settlement",
      "mountain-cluster",
      "barricade",
      "faction-banner",
    ],
    objects: [
      placement("fort", [0, 0], mesoMicro, "AUTHORED_STATIC_POI"),
      placement(
        "checkpoint-gate",
        [0.58, 0.08],
        mesoMicro,
        "AUTHORED_STATIC_POI",
      ),
      placement("small-settlement", [-0.48, 0.3], micro, "AUTHORED_SETTLEMENT"),
      placement(
        "mountain-cluster",
        [0.3, -0.58],
        macroMesoMicro,
        "DECORATIVE_SUBSTRATE",
      ),
      placement("barricade", [0.7, -0.32], micro, "RECORDED_CONFLICT"),
      placement("faction-banner", [-0.2, 0.56], micro, "RECORDED_FACTION"),
    ],
    source: "TMR-authored-region-template",
  },
  "agrarian-distribution": {
    compositionId: "tmr.map.composition.agrarian-distribution",
    role: "agrarian-distribution",
    displayName: "곡창·배급 생활권",
    silhouetteCue:
      "열린 밭과 저장고, 배급 야드, 작은 취락이 넓은 생산 면을 구성함",
    terrainSignatures: ["open-field", "water-runoff", "distribution-approach"],
    density: "open",
    groundingMaterial: "terrain-cultivated",
    readingOrder: [
      "field-plot",
      "granary-storehouse",
      "distribution-yard",
      "small-settlement",
      "road-corridor",
    ],
    objects: [
      placement("field-plot", [0, 0], mesoMicro, "DECORATIVE_SUBSTRATE"),
      placement(
        "granary-storehouse",
        [0.48, -0.08],
        mesoMicro,
        "RECORDED_PROJECT",
      ),
      placement(
        "distribution-yard",
        [-0.5, 0.26],
        mesoMicro,
        "RECORDED_PROJECT",
      ),
      placement("small-settlement", [0.3, 0.48], micro, "AUTHORED_SETTLEMENT"),
      placement(
        "road-corridor",
        [0.02, -0.58],
        macroMesoMicro,
        "RECORDED_ROUTE",
      ),
    ],
    source: "TMR-authored-region-template",
  },
} as const;

export function getRegionComposition(
  role: RegionCompositionRole,
): RegionCompositionTemplate;
export function getRegionComposition(
  request: RegionCompositionRequest,
): RegionCompositionDefinition;
export function getRegionComposition(
  input: RegionCompositionRole | RegionCompositionRequest,
): RegionCompositionTemplate | RegionCompositionDefinition {
  const role = typeof input === "string" ? input : input.role;
  const template = REGION_COMPOSITION_TEMPLATES[role];
  if (template === undefined) {
    throw new Error(`Unknown region composition role: ${role}.`);
  }
  if (typeof input === "string") return template;
  return {
    ...template,
    regionId: input.regionId,
    anchor: input.anchor,
    evidence: input.evidence,
    binding: "renderer-neutral-presentation-template",
  };
}

export function regionCompositionEvidenceFromWorldSceneModel(
  model: WorldSceneModel,
): RegionCompositionEvidence {
  return {
    settlements: model.settlements.map(
      ({ id, regionId, kind, truthClass }) => ({
        id,
        regionId,
        kind,
        truthClass,
      }),
    ),
    pois: model.pois.map(({ id, regionId, kind, truthClass }) => ({
      id,
      regionId,
      kind,
      truthClass,
    })),
    institutions: model.institutions.map(
      ({ id, regionId, kind, truthClass }) => ({
        id,
        regionId,
        kind,
        truthClass,
      }),
    ),
    projects: model.projects.map(
      ({ id, regionId, landmarkKind, status, sourceEventIds, truthClass }) => ({
        id,
        regionId,
        landmarkKind,
        status,
        sourceEventIds: [...sourceEventIds],
        truthClass,
      }),
    ),
    factionPresence: model.factionPresence.map(
      ({ id, factionId, regionId, truthClass }) => ({
        id,
        factionId,
        regionId,
        truthClass,
      }),
    ),
    conflicts: model.conflicts.map(
      ({ id, conflictId, regionIds, truthClass }) => ({
        id,
        conflictId,
        regionIds: [...regionIds],
        truthClass,
      }),
    ),
    routes: model.routes.map(
      ({ id, sourceRegionId, targetRegionId, active, truthClass }) => ({
        id,
        sourceRegionId,
        targetRegionId,
        active,
        truthClass,
      }),
    ),
  };
}

export function regionCompositionRoles(): readonly RegionCompositionRole[] {
  return ["capital", "industrial", "port", "frontier", "agrarian-distribution"];
}
