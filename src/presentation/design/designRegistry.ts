import { PROHIBITED_PLAYER_COPY, PLAYER_COPY } from "./copyRegistry.ko";
import {
  COUNTRY_CREST_ASSET_IDS,
  TMR_ASSET_MANIFEST,
  type AssetManifestEntry,
} from "./assetManifest";
import {
  TMR_LAYER_REGISTRY,
  TMR_LAYER_IDS,
  type DesignLayerDefinition,
} from "./layerRegistry";
import { TMR_SCREEN_REGISTRY } from "./screenRegistry";

export interface DesignComponentDefinition {
  readonly id: string;
  readonly name: string;
  readonly surface: "title" | "briefing" | "main" | "shared";
  readonly replaceable: true;
}

export const TMR_COMPONENT_REGISTRY: readonly DesignComponentDefinition[] = [
  {
    id: "tmr.component.brand.lockup",
    name: "브랜드 락업",
    surface: "shared",
    replaceable: true,
  },
  {
    id: "tmr.component.title.hero",
    name: "타이틀 영웅 구성",
    surface: "title",
    replaceable: true,
  },
  {
    id: "tmr.component.opening.dossier",
    name: "개막 서류",
    surface: "briefing",
    replaceable: true,
  },
  {
    id: "tmr.component.map.political-atlas",
    name: "정치 지도",
    surface: "main",
    replaceable: true,
  },
  {
    id: "tmr.component.hud.metric-strip",
    name: "국가 지표 띠",
    surface: "main",
    replaceable: true,
  },
  {
    id: "tmr.component.council.action-card",
    name: "국정 결정 카드",
    surface: "main",
    replaceable: true,
  },
  {
    id: "tmr.component.crisis.agenda-card",
    name: "위기 의제 카드",
    surface: "main",
    replaceable: true,
  },
  {
    id: "tmr.component.chronicle.event-row",
    name: "연대기 사건 행",
    surface: "main",
    replaceable: true,
  },
] as const;

export interface DesignRegistryIntegrityOptions {
  readonly assets?: readonly AssetManifestEntry[];
  readonly layers?: readonly DesignLayerDefinition[];
  readonly components?: readonly DesignComponentDefinition[];
  readonly availableAssetPaths?: ReadonlySet<string>;
  readonly productionArtPaths?: readonly string[];
  readonly requiredAssetIds?: readonly string[];
}

function assertUnique(label: string, ids: readonly string[]): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) throw new Error(`${label} repeats ${id}.`);
    seen.add(id);
  }
}

function assertManifestEntry(entry: AssetManifestEntry): void {
  if (entry.replaceable !== true) {
    throw new Error(`Asset ${entry.id} must be replaceable.`);
  }
  if (entry.styleFamily !== "tmr-royal-revolution") {
    throw new Error(`Asset ${entry.id} has an invalid style family.`);
  }
  if (!TMR_LAYER_IDS.has(entry.layerId)) {
    throw new Error(
      `Asset ${entry.id} references an invalid layer ${entry.layerId}.`,
    );
  }
  if (entry.source === "generated" && entry.promptRecipeId === undefined) {
    throw new Error(`Generated asset ${entry.id} is missing a prompt recipe.`);
  }
  if (entry.id.length === 0 || entry.path.length === 0) {
    throw new Error("Asset identity and path must not be empty.");
  }
}

export function assertDesignRegistryIntegrity(
  options: DesignRegistryIntegrityOptions = {},
): void {
  const assets = options.assets ?? TMR_ASSET_MANIFEST;
  const layers = options.layers ?? TMR_LAYER_REGISTRY;
  const components = options.components ?? TMR_COMPONENT_REGISTRY;

  assertUnique(
    "Asset",
    assets.map((asset) => asset.id),
  );
  assertUnique(
    "Layer",
    layers.map((layer) => layer.id),
  );
  assertUnique(
    "Component",
    components.map((component) => component.id),
  );
  assertUnique(
    "Screen",
    TMR_SCREEN_REGISTRY.map((screen) => screen.id),
  );

  const assetIds = new Set(assets.map((asset) => asset.id));
  for (const requiredAssetId of options.requiredAssetIds ?? [
    ...Object.values(COUNTRY_CREST_ASSET_IDS),
  ]) {
    if (!assetIds.has(requiredAssetId)) {
      throw new Error(
        `Required asset reference is missing: ${requiredAssetId}.`,
      );
    }
  }

  const layerIds = new Set(layers.map((layer) => layer.id));
  const zIndexes = new Set<number>();
  for (const layer of layers) {
    if (zIndexes.has(layer.zIndex)) {
      throw new Error(`Layer z-index repeats ${layer.zIndex}.`);
    }
    zIndexes.add(layer.zIndex);
  }

  for (const asset of assets) {
    assertManifestEntry(asset);
    if (!layerIds.has(asset.layerId)) {
      throw new Error(
        `Asset ${asset.id} references a missing layer ${asset.layerId}.`,
      );
    }
    if (
      options.availableAssetPaths !== undefined &&
      asset.path.startsWith("/") &&
      !options.availableAssetPaths.has(asset.path)
    ) {
      throw new Error(`Asset ${asset.id} file is missing at ${asset.path}.`);
    }
  }

  const registeredFilePaths = new Set(
    assets.map((asset) => asset.path).filter((path) => path.startsWith("/")),
  );
  for (const productionArtPath of options.productionArtPaths ?? []) {
    if (!registeredFilePaths.has(productionArtPath)) {
      throw new Error(
        `Production art file is not registered: ${productionArtPath}.`,
      );
    }
  }

  for (const screen of TMR_SCREEN_REGISTRY) {
    if (!layerIds.has(screen.primaryLayerId)) {
      throw new Error(
        `Screen ${screen.id} references a missing layer ${screen.primaryLayerId}.`,
      );
    }
  }

  const copyText = JSON.stringify(PLAYER_COPY);
  for (const prohibited of PROHIBITED_PLAYER_COPY) {
    if (copyText.includes(prohibited)) {
      throw new Error(
        `Player copy contains prohibited developer jargon: ${prohibited}.`,
      );
    }
  }
}
