import type { DesignLayerId } from "./layerRegistry";

export type AssetType = "svg" | "png" | "webp" | "css" | "procedural";
export type AssetSource =
  "generated" | "hand-authored" | "procedural" | "third-party-reference-only";

export interface AssetManifestEntry {
  readonly id: string;
  /** A stable logical path. It is not the asset identity. */
  readonly path: string;
  readonly type: AssetType;
  readonly role: string;
  readonly layerId: DesignLayerId;
  readonly version: string;
  readonly source: AssetSource;
  readonly licenseOrProvenance: string;
  readonly styleFamily: "tmr-royal-revolution";
  readonly promptRecipeId?: string;
  readonly transparentBackground: boolean;
  readonly aspectRatio: string;
  readonly cropPolicy: "contain" | "cover" | "none";
  readonly responsiveUsage: string;
  readonly replaceable: true;
}

const handAuthored = {
  source: "hand-authored" as const,
  licenseOrProvenance:
    "TooManyRevolutions project-authored vector; no external art copied.",
  styleFamily: "tmr-royal-revolution" as const,
  transparentBackground: true,
  cropPolicy: "contain" as const,
  replaceable: true as const,
};

const procedural = {
  source: "procedural" as const,
  licenseOrProvenance:
    "Runtime CSS/SVG primitive authored in this repository; no external asset.",
  styleFamily: "tmr-royal-revolution" as const,
  transparentBackground: true,
  cropPolicy: "none" as const,
  replaceable: true as const,
};

/**
 * A small, coherent asset package. The manifest is deliberately data-shaped
 * so a single crest or hero variant can be replaced without changing screen
 * composition or stable IDs.
 */
export const TMR_ASSET_MANIFEST: readonly AssetManifestEntry[] = [
  {
    ...handAuthored,
    id: "tmr.brand.logo.primary",
    path: "/assets/tmr/brand/arken-crest.svg",
    type: "svg",
    role: "primary political crest",
    layerId: "tmr.layer.ui.chrome",
    version: "v1",
    aspectRatio: "1:1",
    responsiveUsage: "Title and compact header; preserve the complete seal.",
  },
  {
    ...handAuthored,
    id: "tmr.asset.country.arken.crest",
    path: "/assets/tmr/crests/arken.svg",
    type: "svg",
    role: "player country crest",
    layerId: "tmr.layer.map.labels",
    version: "v1",
    aspectRatio: "1:1",
    responsiveUsage: "Country label and title; scale down without cropping.",
  },
  {
    ...handAuthored,
    id: "tmr.asset.country.veloria.crest",
    path: "/assets/tmr/crests/veloria.svg",
    type: "svg",
    role: "neighbor country crest",
    layerId: "tmr.layer.map.labels",
    version: "v1",
    aspectRatio: "1:1",
    responsiveUsage: "Map atlas label and foreign-powers strip.",
  },
  {
    ...handAuthored,
    id: "tmr.asset.country.karsen.crest",
    path: "/assets/tmr/crests/karsen.svg",
    type: "svg",
    role: "neighbor country crest",
    layerId: "tmr.layer.map.labels",
    version: "v1",
    aspectRatio: "1:1",
    responsiveUsage: "Map atlas label and foreign-powers strip.",
  },
  {
    ...handAuthored,
    id: "tmr.asset.faction.defenders.emblem",
    path: "/assets/tmr/factions/defenders.svg",
    type: "svg",
    role: "state faction emblem",
    layerId: "tmr.layer.map.pressure",
    version: "v1",
    aspectRatio: "1:1",
    responsiveUsage: "Crisis and faction pressure chips.",
  },
  {
    ...handAuthored,
    id: "tmr.asset.faction.workers.emblem",
    path: "/assets/tmr/factions/workers.svg",
    type: "svg",
    role: "industrial faction emblem",
    layerId: "tmr.layer.map.pressure",
    version: "v1",
    aspectRatio: "1:1",
    responsiveUsage: "Crisis and faction pressure chips.",
  },
  {
    ...procedural,
    id: "tmr.asset.title.hero.arken-crisis.v1",
    path: "procedural://tmr/title/arken-crisis-v1",
    type: "procedural",
    role: "layered title vignette",
    layerId: "tmr.layer.map.atmosphere",
    version: "v1",
    aspectRatio: "16:9",
    responsiveUsage:
      "CSS vignette behind DOM title copy; never contains UI text.",
  },
  {
    ...procedural,
    id: "tmr.asset.map.terrain.mountains.01",
    path: "procedural://tmr/map/terrain/mountains-01",
    type: "procedural",
    role: "mountain hatching",
    layerId: "tmr.layer.map.terrain",
    version: "v1",
    aspectRatio: "1:1",
    responsiveUsage: "Subtle map texture; hidden when clutter is high.",
  },
  {
    ...procedural,
    id: "tmr.asset.map.terrain.forest.01",
    path: "procedural://tmr/map/terrain/forest-01",
    type: "procedural",
    role: "forest hatching",
    layerId: "tmr.layer.map.terrain",
    version: "v1",
    aspectRatio: "1:1",
    responsiveUsage: "Subtle map texture; hidden when clutter is high.",
  },
  {
    ...procedural,
    id: "tmr.asset.map.terrain.field.01",
    path: "procedural://tmr/map/terrain/field-01",
    type: "procedural",
    role: "field wash",
    layerId: "tmr.layer.map.terrain",
    version: "v1",
    aspectRatio: "1:1",
    responsiveUsage: "Flat atlas wash behind political tint.",
  },
  {
    ...procedural,
    id: "tmr.asset.map.terrain.coast.01",
    path: "procedural://tmr/map/terrain/coast-01",
    type: "procedural",
    role: "coastal wash",
    layerId: "tmr.layer.map.terrain",
    version: "v1",
    aspectRatio: "1:1",
    responsiveUsage: "Water edge accent; does not invent topology.",
  },
  {
    ...procedural,
    id: "tmr.asset.ui.divider.engraved",
    path: "procedural://tmr/ui/divider/engraved",
    type: "css",
    role: "engraved section divider",
    layerId: "tmr.layer.ui.chrome",
    version: "v1",
    aspectRatio: "8:1",
    responsiveUsage: "Collapses to a short rule on narrow screens.",
  },
  {
    ...procedural,
    id: "tmr.asset.ui.warning.seal",
    path: "procedural://tmr/ui/warning/seal",
    type: "css",
    role: "crisis seal",
    layerId: "tmr.layer.ui.fx",
    version: "v1",
    aspectRatio: "1:1",
    responsiveUsage: "Accessible text remains adjacent in DOM.",
  },
];

export const TMR_ASSETS_BY_ID = new Map(
  TMR_ASSET_MANIFEST.map((asset) => [asset.id, asset]),
);

export const COUNTRY_CREST_ASSET_IDS = {
  arken: "tmr.asset.country.arken.crest",
  veloria: "tmr.asset.country.veloria.crest",
  karsen: "tmr.asset.country.karsen.crest",
} as const;

export const FACTION_EMBLEM_ASSET_IDS = {
  defenders: "tmr.asset.faction.defenders.emblem",
  workers: "tmr.asset.faction.workers.emblem",
} as const;
