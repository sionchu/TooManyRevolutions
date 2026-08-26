export const TMR_ICON_SIZES = [16, 20, 24, 32, 48] as const;

export type TmrIconSize = (typeof TMR_ICON_SIZES)[number];
export type TmrIconLod = "far" | "mid" | "near" | "any";
export type TmrIconSemanticRole =
  "map-place" | "politics" | "crisis" | "activity" | "ui";

export const TMR_ICON_IDS = {
  map: {
    capital: "tmr.icon.map.capital",
    city: "tmr.icon.map.city",
    port: "tmr.icon.map.port",
    mine: "tmr.icon.map.mine",
    factory: "tmr.icon.map.factory",
    fort: "tmr.icon.map.fort",
    checkpoint: "tmr.icon.map.checkpoint",
    granary: "tmr.icon.map.granary",
    assembly: "tmr.icon.map.assembly",
    road: "tmr.icon.map.road",
    tradeRoute: "tmr.icon.map.trade-route",
  },
  politics: {
    monarchy: "tmr.icon.politics.monarchy",
    parliament: "tmr.icon.politics.parliament",
    election: "tmr.icon.politics.election",
    suffrage: "tmr.icon.politics.suffrage",
    veto: "tmr.icon.politics.veto",
    press: "tmr.icon.politics.press",
    censorship: "tmr.icon.politics.censorship",
    laborOrganization: "tmr.icon.politics.labor-organization",
    property: "tmr.icon.politics.property",
    landReform: "tmr.icon.politics.land-reform",
  },
  crisis: {
    rebellion: "tmr.icon.crisis.rebellion",
    coup: "tmr.icon.crisis.coup",
    civilConflict: "tmr.icon.crisis.civil-conflict",
    territoryLost: "tmr.icon.crisis.territory-lost",
    capitalThreatened: "tmr.icon.crisis.capital-threatened",
    stateDissolutionWarning: "tmr.icon.crisis.state-dissolution-warning",
  },
  activity: {
    trade: "tmr.icon.activity.trade",
    information: "tmr.icon.activity.information",
    migration: "tmr.icon.activity.migration",
    borderClosed: "tmr.icon.activity.border-closed",
    borderReopened: "tmr.icon.activity.border-reopened",
    projectStart: "tmr.icon.activity.project-start",
    projectComplete: "tmr.icon.activity.project-complete",
  },
  ui: {
    map: "tmr.icon.ui.map",
    governance: "tmr.icon.ui.governance",
    decision: "tmr.icon.ui.decision",
    chronicle: "tmr.icon.ui.chronicle",
    details: "tmr.icon.ui.details",
    why: "tmr.icon.ui.why",
    settings: "tmr.icon.ui.settings",
    audio: "tmr.icon.ui.audio",
  },
} as const;

type NestedIconIdValues<T> =
  T extends Record<string, infer V>
    ? V extends string
      ? V
      : NestedIconIdValues<V>
    : never;

export type TmrIconId = NestedIconIdValues<typeof TMR_ICON_IDS>;

export interface IconProvenance {
  readonly sourceType: "CUSTOM_SVG";
  readonly author: "TooManyRevolutions design system";
  readonly license: "Project-authored vector; no external asset copied.";
  readonly note: "Original monochrome SVG silhouette for TMR semantic iconography.";
}

export interface IconDefinition {
  readonly id: TmrIconId;
  readonly semanticRole: TmrIconSemanticRole;
  readonly assetPath: string;
  readonly defaultSize: TmrIconSize;
  readonly mapAllowed: boolean;
  readonly uiAllowed: boolean;
  readonly lod: TmrIconLod;
  readonly ariaLabel: string;
  readonly tags: readonly string[];
  readonly provenance: IconProvenance;
}

const PROVENANCE: IconProvenance = {
  sourceType: "CUSTOM_SVG",
  author: "TooManyRevolutions design system",
  license: "Project-authored vector; no external asset copied.",
  note: "Original monochrome SVG silhouette for TMR semantic iconography.",
};

function defineIcon(
  id: TmrIconId,
  semanticRole: TmrIconSemanticRole,
  fileName: string,
  defaultSize: TmrIconSize,
  mapAllowed: boolean,
  uiAllowed: boolean,
  lod: TmrIconLod,
  ariaLabel: string,
  tags: readonly string[],
): IconDefinition {
  return {
    id,
    semanticRole,
    assetPath: `/assets/tmr/icons/${fileName}.svg`,
    defaultSize,
    mapAllowed,
    uiAllowed,
    lod,
    ariaLabel,
    tags,
    provenance: PROVENANCE,
  };
}

export const TMR_ICON_REGISTRY: readonly IconDefinition[] = [
  defineIcon(
    TMR_ICON_IDS.map.capital,
    "map-place",
    "capital",
    32,
    true,
    true,
    "far",
    "수도",
    ["place", "capital", "seat-of-power"],
  ),
  defineIcon(
    TMR_ICON_IDS.map.city,
    "map-place",
    "city",
    24,
    true,
    true,
    "mid",
    "도시",
    ["place", "settlement", "urban"],
  ),
  defineIcon(
    TMR_ICON_IDS.map.port,
    "map-place",
    "port",
    24,
    true,
    true,
    "mid",
    "항구",
    ["place", "coast", "trade"],
  ),
  defineIcon(
    TMR_ICON_IDS.map.mine,
    "map-place",
    "mine",
    24,
    true,
    true,
    "mid",
    "광산",
    ["place", "resource", "industry"],
  ),
  defineIcon(
    TMR_ICON_IDS.map.factory,
    "map-place",
    "factory",
    24,
    true,
    true,
    "mid",
    "공장",
    ["place", "industry", "production"],
  ),
  defineIcon(
    TMR_ICON_IDS.map.fort,
    "map-place",
    "fort",
    24,
    true,
    true,
    "mid",
    "요새",
    ["place", "defense", "frontier"],
  ),
  defineIcon(
    TMR_ICON_IDS.map.checkpoint,
    "map-place",
    "checkpoint",
    20,
    true,
    true,
    "near",
    "검문소",
    ["place", "border", "control"],
  ),
  defineIcon(
    TMR_ICON_IDS.map.granary,
    "map-place",
    "granary",
    24,
    true,
    true,
    "mid",
    "곡창",
    ["place", "food", "distribution"],
  ),
  defineIcon(
    TMR_ICON_IDS.map.assembly,
    "map-place",
    "assembly",
    24,
    true,
    true,
    "mid",
    "의회당",
    ["place", "institution", "civic"],
  ),
  defineIcon(
    TMR_ICON_IDS.map.road,
    "map-place",
    "road",
    16,
    true,
    true,
    "far",
    "도로",
    ["infrastructure", "route", "land"],
  ),
  defineIcon(
    TMR_ICON_IDS.map.tradeRoute,
    "map-place",
    "trade-route",
    16,
    true,
    true,
    "far",
    "무역로",
    ["infrastructure", "route", "trade"],
  ),
  defineIcon(
    TMR_ICON_IDS.politics.monarchy,
    "politics",
    "monarchy",
    24,
    true,
    true,
    "far",
    "왕정",
    ["institution", "crown", "regime"],
  ),
  defineIcon(
    TMR_ICON_IDS.politics.parliament,
    "politics",
    "parliament",
    24,
    true,
    true,
    "mid",
    "의회",
    ["institution", "representation", "legislature"],
  ),
  defineIcon(
    TMR_ICON_IDS.politics.election,
    "politics",
    "election",
    20,
    false,
    true,
    "any",
    "선거",
    ["institution", "vote", "choice"],
  ),
  defineIcon(
    TMR_ICON_IDS.politics.suffrage,
    "politics",
    "suffrage",
    20,
    false,
    true,
    "any",
    "선거권",
    ["institution", "vote", "access"],
  ),
  defineIcon(
    TMR_ICON_IDS.politics.veto,
    "politics",
    "veto",
    20,
    false,
    true,
    "any",
    "거부권",
    ["institution", "authority", "block"],
  ),
  defineIcon(
    TMR_ICON_IDS.politics.press,
    "politics",
    "press",
    20,
    true,
    true,
    "mid",
    "언론",
    ["institution", "information", "publication"],
  ),
  defineIcon(
    TMR_ICON_IDS.politics.censorship,
    "politics",
    "censorship",
    20,
    true,
    true,
    "mid",
    "검열",
    ["institution", "information", "restriction"],
  ),
  defineIcon(
    TMR_ICON_IDS.politics.laborOrganization,
    "politics",
    "labor-organization",
    24,
    true,
    true,
    "mid",
    "노동 조직",
    ["institution", "labor", "organization"],
  ),
  defineIcon(
    TMR_ICON_IDS.politics.property,
    "politics",
    "property",
    20,
    false,
    true,
    "any",
    "재산",
    ["institution", "ownership", "law"],
  ),
  defineIcon(
    TMR_ICON_IDS.politics.landReform,
    "politics",
    "land-reform",
    24,
    true,
    true,
    "mid",
    "토지 개혁",
    ["institution", "land", "reform"],
  ),
  defineIcon(
    TMR_ICON_IDS.crisis.rebellion,
    "crisis",
    "rebellion",
    32,
    true,
    true,
    "far",
    "반란",
    ["crisis", "faction", "uprising"],
  ),
  defineIcon(
    TMR_ICON_IDS.crisis.coup,
    "crisis",
    "coup",
    32,
    true,
    true,
    "far",
    "쿠데타",
    ["crisis", "power", "takeover"],
  ),
  defineIcon(
    TMR_ICON_IDS.crisis.civilConflict,
    "crisis",
    "civil-conflict",
    32,
    true,
    true,
    "far",
    "내전",
    ["crisis", "conflict", "front"],
  ),
  defineIcon(
    TMR_ICON_IDS.crisis.territoryLost,
    "crisis",
    "territory-lost",
    24,
    true,
    true,
    "mid",
    "영토 상실",
    ["crisis", "territory", "loss"],
  ),
  defineIcon(
    TMR_ICON_IDS.crisis.capitalThreatened,
    "crisis",
    "capital-threatened",
    32,
    true,
    true,
    "far",
    "수도 위협",
    ["crisis", "capital", "warning"],
  ),
  defineIcon(
    TMR_ICON_IDS.crisis.stateDissolutionWarning,
    "crisis",
    "state-dissolution-warning",
    32,
    false,
    true,
    "any",
    "국가 소멸 경고",
    ["crisis", "state", "warning"],
  ),
  defineIcon(
    TMR_ICON_IDS.activity.trade,
    "activity",
    "trade",
    20,
    true,
    true,
    "mid",
    "무역 활동",
    ["activity", "route", "exchange"],
  ),
  defineIcon(
    TMR_ICON_IDS.activity.information,
    "activity",
    "information",
    20,
    true,
    true,
    "mid",
    "정보 흐름",
    ["activity", "route", "press"],
  ),
  defineIcon(
    TMR_ICON_IDS.activity.migration,
    "activity",
    "migration",
    20,
    true,
    true,
    "mid",
    "이주 흐름",
    ["activity", "route", "movement"],
  ),
  defineIcon(
    TMR_ICON_IDS.activity.borderClosed,
    "activity",
    "border-closed",
    20,
    true,
    true,
    "mid",
    "국경 폐쇄",
    ["activity", "border", "closed"],
  ),
  defineIcon(
    TMR_ICON_IDS.activity.borderReopened,
    "activity",
    "border-reopened",
    20,
    true,
    true,
    "mid",
    "국경 재개방",
    ["activity", "border", "open"],
  ),
  defineIcon(
    TMR_ICON_IDS.activity.projectStart,
    "activity",
    "project-start",
    20,
    true,
    true,
    "near",
    "사업 시작",
    ["activity", "project", "start"],
  ),
  defineIcon(
    TMR_ICON_IDS.activity.projectComplete,
    "activity",
    "project-complete",
    20,
    true,
    true,
    "near",
    "사업 완료",
    ["activity", "project", "complete"],
  ),
  defineIcon(TMR_ICON_IDS.ui.map, "ui", "map", 24, true, true, "any", "지도", [
    "ui",
    "navigation",
    "world",
  ]),
  defineIcon(
    TMR_ICON_IDS.ui.governance,
    "ui",
    "governance",
    24,
    false,
    true,
    "any",
    "국정",
    ["ui", "government", "state"],
  ),
  defineIcon(
    TMR_ICON_IDS.ui.decision,
    "ui",
    "decision",
    24,
    false,
    true,
    "any",
    "결정",
    ["ui", "choice", "action"],
  ),
  defineIcon(
    TMR_ICON_IDS.ui.chronicle,
    "ui",
    "chronicle",
    24,
    false,
    true,
    "any",
    "연대기",
    ["ui", "history", "record"],
  ),
  defineIcon(
    TMR_ICON_IDS.ui.details,
    "ui",
    "details",
    20,
    false,
    true,
    "any",
    "상세",
    ["ui", "inspector", "detail"],
  ),
  defineIcon(
    TMR_ICON_IDS.ui.why,
    "ui",
    "why",
    20,
    false,
    true,
    "any",
    "왜 그런가",
    ["ui", "causality", "explain"],
  ),
  defineIcon(
    TMR_ICON_IDS.ui.settings,
    "ui",
    "settings",
    20,
    false,
    true,
    "any",
    "설정",
    ["ui", "options", "control"],
  ),
  defineIcon(
    TMR_ICON_IDS.ui.audio,
    "ui",
    "audio",
    20,
    false,
    true,
    "any",
    "소리",
    ["ui", "sound", "accessibility"],
  ),
] as const;

export const TMR_ICONS_BY_ID = new Map<TmrIconId, IconDefinition>(
  TMR_ICON_REGISTRY.map((icon) => [icon.id, icon]),
);

const VALID_SIZES = new Set<number>(TMR_ICON_SIZES);

export interface IconRegistryIntegrityOptions {
  readonly icons?: readonly IconDefinition[];
  readonly availableAssetPaths?: ReadonlySet<string>;
}

function assertUnique(label: string, values: readonly string[]): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`${label} repeats ${value}.`);
    seen.add(value);
  }
}

function assertIconDefinition(icon: IconDefinition): void {
  if (!icon.id.startsWith("tmr.icon.")) {
    throw new Error(`Icon ${icon.id} must use the tmr.icon namespace.`);
  }
  if (
    !icon.assetPath.startsWith("/assets/tmr/icons/") ||
    !icon.assetPath.endsWith(".svg")
  ) {
    throw new Error(`Icon ${icon.id} has an invalid SVG asset path.`);
  }
  if (!VALID_SIZES.has(icon.defaultSize)) {
    throw new Error(`Icon ${icon.id} has an unsupported default size.`);
  }
  if (!icon.mapAllowed && !icon.uiAllowed) {
    throw new Error(`Icon ${icon.id} is not allowed on any surface.`);
  }
  if (icon.ariaLabel.trim().length === 0) {
    throw new Error(`Icon ${icon.id} is missing an accessible label.`);
  }
  if (
    icon.tags.length < 2 ||
    icon.tags.some((tag) => tag.trim().length === 0)
  ) {
    throw new Error(`Icon ${icon.id} must have at least two non-empty tags.`);
  }
  if (icon.provenance.sourceType !== "CUSTOM_SVG") {
    throw new Error(`Icon ${icon.id} has invalid provenance.`);
  }
}

export function assertIconRegistryIntegrity(
  options: IconRegistryIntegrityOptions = {},
): void {
  const icons = options.icons ?? TMR_ICON_REGISTRY;
  assertUnique(
    "Icon ID",
    icons.map((icon) => icon.id),
  );
  assertUnique(
    "Icon asset path",
    icons.map((icon) => icon.assetPath),
  );
  for (const icon of icons) {
    assertIconDefinition(icon);
    if (
      options.availableAssetPaths !== undefined &&
      !options.availableAssetPaths.has(icon.assetPath)
    ) {
      throw new Error(`Icon ${icon.id} file is missing at ${icon.assetPath}.`);
    }
  }
}

export function getIconDefinition(iconId: TmrIconId): IconDefinition {
  const icon = TMR_ICONS_BY_ID.get(iconId);
  if (icon === undefined) throw new Error(`Icon ${iconId} is not registered.`);
  return icon;
}

/**
 * Lightweight, dependency-free SVG contract check for the hand-authored icon
 * assets. It intentionally rejects text/script content so icons stay vectors,
 * monochrome, and safe to reuse in map and UI surfaces.
 */
export function validateIconSvgAsset(markup: string): readonly string[] {
  const errors: string[] = [];
  if (!/^\s*<svg\b/i.test(markup) || !/<\/svg>\s*$/i.test(markup)) {
    errors.push("SVG root is not closed.");
  }
  if (!/\bviewBox\s*=\s*["']0 0 24 24["']/i.test(markup)) {
    errors.push("SVG must use the 24 by 24 viewBox.");
  }
  if (/<(?:script|text|foreignObject)\b/i.test(markup)) {
    errors.push("SVG contains disallowed text or executable content.");
  }
  if (/\b(?:href|xlink:href)\s*=/i.test(markup)) {
    errors.push("SVG must not reference external content.");
  }
  const geometryTags = markup.match(
    /<(?:path|circle|rect|line|polyline|polygon|ellipse)\b[^>]*\/?\s*>/gi,
  );
  if (geometryTags === null || geometryTags.length === 0) {
    errors.push("SVG has no vector geometry.");
  }
  for (const pathTag of markup.matchAll(/<path\b([^>]*)\/?\s*>/gi)) {
    if (!/\bd\s*=\s*["'][^"']+["']/i.test(pathTag[0])) {
      errors.push("Every path must contain a non-empty d attribute.");
      break;
    }
  }
  return errors;
}
