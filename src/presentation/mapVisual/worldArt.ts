export type MapScaleRole =
  | "signature-capital"
  | "major-project"
  | "poi"
  | "settlement"
  | "decorative-prop";

export const MAP_SCALE_HIERARCHY = {
  "signature-capital": {
    rank: 5,
    relativeScale: 1,
    description: "국가의 시그니처 수도와 최고위 권력 중심",
  },
  "major-project": {
    rank: 4,
    relativeScale: 0.82,
    description: "국가 사업 또는 대형 제도·생산 거점",
  },
  poi: {
    rank: 3,
    relativeScale: 0.66,
    description: "지역의 주요 POI와 경계 거점",
  },
  settlement: {
    rank: 2,
    relativeScale: 0.54,
    description: "도시·마을의 생활 밀도",
  },
  "decorative-prop": {
    rank: 1,
    relativeScale: 0.3,
    description: "지형·식생·현장 분위기를 보강하는 장식",
  },
} as const satisfies Record<
  MapScaleRole,
  {
    readonly rank: number;
    readonly relativeScale: number;
    readonly description: string;
  }
>;

export type MapMaterialFamilyId =
  | "terrain-earth"
  | "terrain-stone"
  | "terrain-water"
  | "civic-plaster"
  | "industrial-iron"
  | "frontier-timber"
  | "vegetation"
  | "signal-ochre";

export interface MapMaterialFamilyDefinition {
  readonly id: MapMaterialFamilyId;
  readonly baseColor: string;
  readonly shadowColor: string;
  readonly accentColor: string;
  readonly roughness: number;
  readonly metalness: number;
  readonly contactShadowOpacity: number;
  readonly terrainBlend: "flush" | "raised" | "coastal";
  readonly notes: string;
}

export const MAP_MATERIAL_FAMILIES: Readonly<
  Record<MapMaterialFamilyId, MapMaterialFamilyDefinition>
> = {
  "terrain-earth": {
    id: "terrain-earth",
    baseColor: "#a88d62",
    shadowColor: "#5e5543",
    accentColor: "#d1b477",
    roughness: 0.96,
    metalness: 0,
    contactShadowOpacity: 0.28,
    terrainBlend: "flush",
    notes: "마른 흙과 경작지에 공통으로 쓰는 저채도 지면 계열",
  },
  "terrain-stone": {
    id: "terrain-stone",
    baseColor: "#777b7a",
    shadowColor: "#3f4748",
    accentColor: "#b0aaa0",
    roughness: 0.94,
    metalness: 0.03,
    contactShadowOpacity: 0.34,
    terrainBlend: "raised",
    notes: "산악·요새·광산의 무광 석재 계열",
  },
  "terrain-water": {
    id: "terrain-water",
    baseColor: "#5e7d82",
    shadowColor: "#30464a",
    accentColor: "#91a8a1",
    roughness: 0.98,
    metalness: 0,
    contactShadowOpacity: 0.16,
    terrainBlend: "coastal",
    notes: "항구 수면과 물가를 구분하는 저채도 청록 지형 계열",
  },
  "civic-plaster": {
    id: "civic-plaster",
    baseColor: "#d5c394",
    shadowColor: "#77664f",
    accentColor: "#eee0b9",
    roughness: 0.88,
    metalness: 0.01,
    contactShadowOpacity: 0.32,
    terrainBlend: "raised",
    notes: "왕궁·의회·공공 건축을 묶는 밝은 무광 외장",
  },
  "industrial-iron": {
    id: "industrial-iron",
    baseColor: "#646d70",
    shadowColor: "#333b3e",
    accentColor: "#b28a5e",
    roughness: 0.91,
    metalness: 0.12,
    contactShadowOpacity: 0.38,
    terrainBlend: "raised",
    notes: "철산·공장·창고를 구분하는 낮은 반사율의 금속·석재 계열",
  },
  "frontier-timber": {
    id: "frontier-timber",
    baseColor: "#795c48",
    shadowColor: "#44362e",
    accentColor: "#c3915d",
    roughness: 0.97,
    metalness: 0,
    contactShadowOpacity: 0.36,
    terrainBlend: "raised",
    notes: "변경의 목책·관문·임시 거점에 쓰는 거친 목재 계열",
  },
  vegetation: {
    id: "vegetation",
    baseColor: "#56715a",
    shadowColor: "#2f493a",
    accentColor: "#8ea36c",
    roughness: 1,
    metalness: 0,
    contactShadowOpacity: 0.22,
    terrainBlend: "flush",
    notes: "숲·초지·완충 식생에 쓰는 자연색 계열",
  },
  "signal-ochre": {
    id: "signal-ochre",
    baseColor: "#b7784b",
    shadowColor: "#653f35",
    accentColor: "#e3c072",
    roughness: 0.84,
    metalness: 0.02,
    contactShadowOpacity: 0.3,
    terrainBlend: "raised",
    notes: "공사·경보·봉쇄처럼 실제 상태 변화가 있을 때만 쓰는 제한 색",
  },
} as const;

export type MapObjectFamily =
  | "palace"
  | "assembly-parliament"
  | "dense-town"
  | "small-settlement"
  | "port-dock"
  | "water-shelf"
  | "mine"
  | "factory-iron-works"
  | "fort"
  | "checkpoint-gate"
  | "granary-storehouse"
  | "distribution-yard"
  | "barricade"
  | "faction-banner"
  | "mountain-cluster"
  | "forest-cluster"
  | "field-plot"
  | "road-corridor";

export type MapObjectCategory =
  | "civic-landmark"
  | "settlement"
  | "economic-poi"
  | "border-poi"
  | "state-project"
  | "activity-marker"
  | "terrain"
  | "infrastructure";

export type MapObjectAssetId = `tmr.map.object.${MapObjectFamily}`;

export interface MapAssetReplacementSeam {
  readonly preferredFormat: "glb" | "gltf";
  readonly slotId: string;
  readonly fallback: "procedural-low-poly";
  readonly normalization: "shared-ground-origin-and-unit-scale";
  readonly loadPolicy: "lazy-replace-without-layout-change";
}

export interface MapAssetProvenance {
  readonly source: "TMR-authored-procedural";
  readonly license: "PROJECT_AUTHORED_NO_THIRD_PARTY_ASSET";
  readonly rightsStatus: "cleared-for-project-candidate";
  readonly productionStatus: "candidate-definition-only";
}

export interface MapObjectGroundingContract {
  readonly footprint: "compact" | "clustered" | "linear" | "organic";
  readonly contactShadow: "soft" | "tight" | "none";
  readonly terrainBlend: "flush" | "raised" | "coastal";
  readonly acceptsTerrainHeight: boolean;
}

export interface MapObjectVisualDefinition {
  readonly assetId: MapObjectAssetId;
  readonly family: MapObjectFamily;
  readonly category: MapObjectCategory;
  readonly displayName: string;
  readonly silhouetteCue: string;
  readonly scaleRole: MapScaleRole;
  readonly relativeScale: number;
  readonly materialFamily: MapMaterialFamilyId;
  readonly grounding: MapObjectGroundingContract;
  readonly visibleAt: readonly ("macro" | "meso" | "micro")[];
  readonly replacementSeam: MapAssetReplacementSeam;
  readonly provenance: MapAssetProvenance;
}

const MAP_ASSET_PROVENANCE: MapAssetProvenance = {
  source: "TMR-authored-procedural",
  license: "PROJECT_AUTHORED_NO_THIRD_PARTY_ASSET",
  rightsStatus: "cleared-for-project-candidate",
  productionStatus: "candidate-definition-only",
};

function assetId(family: MapObjectFamily): MapObjectAssetId {
  return `tmr.map.object.${family}`;
}

function replacementSeam(family: MapObjectFamily): MapAssetReplacementSeam {
  return {
    preferredFormat: "glb",
    slotId: `tmr/map/objects/${family}`,
    fallback: "procedural-low-poly",
    normalization: "shared-ground-origin-and-unit-scale",
    loadPolicy: "lazy-replace-without-layout-change",
  };
}

function defineAsset(
  family: MapObjectFamily,
  definition: Omit<
    MapObjectVisualDefinition,
    "assetId" | "family" | "relativeScale" | "replacementSeam" | "provenance"
  >,
): MapObjectVisualDefinition {
  return {
    ...definition,
    assetId: assetId(family),
    family,
    relativeScale: MAP_SCALE_HIERARCHY[definition.scaleRole].relativeScale,
    replacementSeam: replacementSeam(family),
    provenance: MAP_ASSET_PROVENANCE,
  };
}

export const MAP_OBJECT_ASSET_MANIFEST: readonly MapObjectVisualDefinition[] = [
  defineAsset("palace", {
    category: "civic-landmark",
    displayName: "왕궁·수도 궁전",
    silhouetteCue:
      "넓은 공공 테라스 위에 중앙 지붕과 좌우 civic tower가 선 대표 축",
    scaleRole: "signature-capital",
    materialFamily: "civic-plaster",
    grounding: {
      footprint: "clustered",
      contactShadow: "soft",
      terrainBlend: "raised",
      acceptsTerrainHeight: true,
    },
    visibleAt: ["macro", "meso", "micro"],
  }),
  defineAsset("assembly-parliament", {
    category: "civic-landmark",
    displayName: "의회·공회당",
    silhouetteCue: "낮은 hall body와 넓은 지붕선, 왕궁보다 낮은 공공축",
    scaleRole: "major-project",
    materialFamily: "civic-plaster",
    grounding: {
      footprint: "compact",
      contactShadow: "tight",
      terrainBlend: "raised",
      acceptsTerrainHeight: true,
    },
    visibleAt: ["meso", "micro"],
  }),
  defineAsset("dense-town", {
    category: "settlement",
    displayName: "밀집 도시",
    silhouetteCue: "서로 다른 높이의 작은 건물 군집과 생활 밀도",
    scaleRole: "settlement",
    materialFamily: "terrain-earth",
    grounding: {
      footprint: "clustered",
      contactShadow: "soft",
      terrainBlend: "flush",
      acceptsTerrainHeight: true,
    },
    visibleAt: ["meso", "micro"],
  }),
  defineAsset("small-settlement", {
    category: "settlement",
    displayName: "소규모 취락",
    silhouetteCue: "낮은 지붕 몇 채와 작은 공터가 있는 분산 취락",
    scaleRole: "settlement",
    materialFamily: "frontier-timber",
    grounding: {
      footprint: "clustered",
      contactShadow: "tight",
      terrainBlend: "flush",
      acceptsTerrainHeight: true,
    },
    visibleAt: ["micro"],
  }),
  defineAsset("port-dock", {
    category: "economic-poi",
    displayName: "항구·부두",
    silhouetteCue: "물가 띠를 가로질러 수면 쪽으로 뻗은 선형 부두와 돛대",
    scaleRole: "poi",
    materialFamily: "terrain-earth",
    grounding: {
      footprint: "linear",
      contactShadow: "soft",
      terrainBlend: "coastal",
      acceptsTerrainHeight: true,
    },
    visibleAt: ["meso", "micro"],
  }),
  defineAsset("water-shelf", {
    category: "terrain",
    displayName: "해안 수면·물가 단",
    silhouetteCue:
      "넓은 낮은 수면판과 대비되는 물가 띠가 부두의 바깥 경계를 만듦",
    scaleRole: "decorative-prop",
    materialFamily: "terrain-water",
    grounding: {
      footprint: "linear",
      contactShadow: "soft",
      terrainBlend: "coastal",
      acceptsTerrainHeight: true,
    },
    visibleAt: ["macro", "meso", "micro"],
  }),
  defineAsset("mine", {
    category: "economic-poi",
    displayName: "광산·제련 갱구",
    silhouetteCue: "어두운 갱구와 두 개의 낮은 굴뚝",
    scaleRole: "poi",
    materialFamily: "industrial-iron",
    grounding: {
      footprint: "compact",
      contactShadow: "tight",
      terrainBlend: "raised",
      acceptsTerrainHeight: true,
    },
    visibleAt: ["micro"],
  }),
  defineAsset("factory-iron-works", {
    category: "economic-poi",
    displayName: "철산 공장·제철소",
    silhouetteCue: "넓은 작업동, 낮고 다른 높이의 연통, 분리된 작업 야드",
    scaleRole: "major-project",
    materialFamily: "industrial-iron",
    grounding: {
      footprint: "clustered",
      contactShadow: "soft",
      terrainBlend: "raised",
      acceptsTerrainHeight: true,
    },
    visibleAt: ["meso", "micro"],
  }),
  defineAsset("fort", {
    category: "border-poi",
    displayName: "변경 요새",
    silhouetteCue: "열린 통과구가 있는 낮은 성벽과 네 모서리의 망루",
    scaleRole: "poi",
    materialFamily: "terrain-stone",
    grounding: {
      footprint: "compact",
      contactShadow: "soft",
      terrainBlend: "raised",
      acceptsTerrainHeight: true,
    },
    visibleAt: ["meso", "micro"],
  }),
  defineAsset("checkpoint-gate", {
    category: "border-poi",
    displayName: "국경 관문",
    silhouetteCue: "양쪽 기둥과 중앙 통과구가 읽히는 선형 문",
    scaleRole: "poi",
    materialFamily: "frontier-timber",
    grounding: {
      footprint: "linear",
      contactShadow: "tight",
      terrainBlend: "raised",
      acceptsTerrainHeight: true,
    },
    visibleAt: ["meso", "micro"],
  }),
  defineAsset("granary-storehouse", {
    category: "state-project",
    displayName: "곡창·저장고",
    silhouetteCue: "넓은 저장고와 두 개의 저장 사일로가 만드는 식량 비축 윤곽",
    scaleRole: "major-project",
    materialFamily: "civic-plaster",
    grounding: {
      footprint: "clustered",
      contactShadow: "soft",
      terrainBlend: "raised",
      acceptsTerrainHeight: true,
    },
    visibleAt: ["meso", "micro"],
  }),
  defineAsset("distribution-yard", {
    category: "state-project",
    displayName: "배급·물류 야드",
    silhouetteCue: "낮은 창고, 덮개, 병렬 적재 동선이 드러나는 열린 마당",
    scaleRole: "major-project",
    materialFamily: "terrain-earth",
    grounding: {
      footprint: "linear",
      contactShadow: "soft",
      terrainBlend: "flush",
      acceptsTerrainHeight: true,
    },
    visibleAt: ["meso", "micro"],
  }),
  defineAsset("barricade", {
    category: "activity-marker",
    displayName: "봉쇄·바리케이드",
    silhouetteCue: "낮은 교차 구조물과 막힌 통로",
    scaleRole: "decorative-prop",
    materialFamily: "signal-ochre",
    grounding: {
      footprint: "linear",
      contactShadow: "tight",
      terrainBlend: "raised",
      acceptsTerrainHeight: true,
    },
    visibleAt: ["micro"],
  }),
  defineAsset("faction-banner", {
    category: "activity-marker",
    displayName: "세력 깃발",
    silhouetteCue: "하나의 깃대와 작은 천 깃발",
    scaleRole: "decorative-prop",
    materialFamily: "signal-ochre",
    grounding: {
      footprint: "compact",
      contactShadow: "tight",
      terrainBlend: "raised",
      acceptsTerrainHeight: true,
    },
    visibleAt: ["micro"],
  }),
  defineAsset("mountain-cluster", {
    category: "terrain",
    displayName: "산악 능선",
    silhouetteCue: "서로 다른 높이의 봉우리 2~3개",
    scaleRole: "decorative-prop",
    materialFamily: "terrain-stone",
    grounding: {
      footprint: "organic",
      contactShadow: "soft",
      terrainBlend: "raised",
      acceptsTerrainHeight: true,
    },
    visibleAt: ["macro", "meso", "micro"],
  }),
  defineAsset("forest-cluster", {
    category: "terrain",
    displayName: "숲 군락",
    silhouetteCue: "낮은 수관이 겹치는 삼각 수목 군락",
    scaleRole: "decorative-prop",
    materialFamily: "vegetation",
    grounding: {
      footprint: "organic",
      contactShadow: "soft",
      terrainBlend: "flush",
      acceptsTerrainHeight: true,
    },
    visibleAt: ["meso", "micro"],
  }),
  defineAsset("field-plot", {
    category: "terrain",
    displayName: "경작지·밭",
    silhouetteCue: "넓은 수평 경작면과 반복되는 밭고랑·배수 둑",
    scaleRole: "decorative-prop",
    materialFamily: "terrain-earth",
    grounding: {
      footprint: "linear",
      contactShadow: "soft",
      terrainBlend: "flush",
      acceptsTerrainHeight: true,
    },
    visibleAt: ["meso", "micro"],
  }),
  defineAsset("road-corridor", {
    category: "infrastructure",
    displayName: "도로 회랑",
    silhouetteCue: "거점 사이를 잇는 낮은 선형 통로",
    scaleRole: "decorative-prop",
    materialFamily: "terrain-earth",
    grounding: {
      footprint: "linear",
      contactShadow: "none",
      terrainBlend: "flush",
      acceptsTerrainHeight: true,
    },
    visibleAt: ["macro", "meso", "micro"],
  }),
] as const;

export function getWorldObjectVisualDefinition(
  query: MapObjectAssetId | MapObjectFamily,
): MapObjectVisualDefinition | undefined {
  return MAP_OBJECT_ASSET_MANIFEST.find(
    (definition) => definition.assetId === query || definition.family === query,
  );
}

export type StateProjectArtKind = "food" | "civic" | "industrial";
export type StateProjectArtStatus =
  "not-started" | "implementing" | "completed";

export interface StateProjectArtVariant {
  readonly kind: StateProjectArtKind;
  readonly status: StateProjectArtStatus;
  readonly primaryAssetId: MapObjectAssetId | null;
  readonly supportingAssetIds: readonly MapObjectAssetId[];
  readonly stateCue: "site" | "scaffold" | "operational";
  readonly visualRead: string;
  readonly requiresRecordedLifecycleState: boolean;
}

const PROJECT_ART_ASSETS: Readonly<
  Record<
    StateProjectArtKind,
    {
      readonly primary: MapObjectAssetId;
      readonly supporting: readonly MapObjectAssetId[];
      readonly visualNoun: string;
    }
  >
> = {
  food: {
    primary: assetId("granary-storehouse"),
    supporting: [assetId("distribution-yard"), assetId("field-plot")],
    visualNoun: "곡물 저장과 배급 동선",
  },
  civic: {
    primary: assetId("assembly-parliament"),
    supporting: [assetId("dense-town")],
    visualNoun: "공회당과 시민 집회 공간",
  },
  industrial: {
    primary: assetId("factory-iron-works"),
    supporting: [assetId("mine"), assetId("road-corridor")],
    visualNoun: "작업동과 원료 반입 회랑",
  },
};

function projectArtVariants(
  kind: StateProjectArtKind,
): Readonly<Record<StateProjectArtStatus, StateProjectArtVariant>> {
  const assets = PROJECT_ART_ASSETS[kind];
  return {
    "not-started": {
      kind,
      status: "not-started",
      primaryAssetId: null,
      supportingAssetIds: [],
      stateCue: "site",
      visualRead: `${assets.visualNoun}가 놓일 부지만 표시`,
      requiresRecordedLifecycleState: true,
    },
    implementing: {
      kind,
      status: "implementing",
      primaryAssetId: assets.primary,
      supportingAssetIds: assets.supporting,
      stateCue: "scaffold",
      visualRead: `${assets.visualNoun}의 골조와 공사 자재가 함께 보임`,
      requiresRecordedLifecycleState: true,
    },
    completed: {
      kind,
      status: "completed",
      primaryAssetId: assets.primary,
      supportingAssetIds: assets.supporting,
      stateCue: "operational",
      visualRead: `${assets.visualNoun}가 완성된 운영 거점으로 읽힘`,
      requiresRecordedLifecycleState: true,
    },
  };
}

export const STATE_PROJECT_ART_GRAMMAR = {
  food: projectArtVariants("food"),
  civic: projectArtVariants("civic"),
  industrial: projectArtVariants("industrial"),
} as const satisfies Readonly<
  Record<
    StateProjectArtKind,
    Readonly<Record<StateProjectArtStatus, StateProjectArtVariant>>
  >
>;

export function getStateProjectArtDefinition(
  kind: StateProjectArtKind,
  status: StateProjectArtStatus,
): StateProjectArtVariant {
  return STATE_PROJECT_ART_GRAMMAR[kind][status];
}
