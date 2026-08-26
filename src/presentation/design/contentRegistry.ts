import { PRODUCT_IDENTITY, PLAYER_COPY } from "./copyRegistry.ko";
import type { InterventionDefinition } from "../../sim/state/intervention";
import type { PolicyDefinition } from "../../sim/state/policy";
import type { ScenarioDefinition } from "../../sim/state/scenario";

export type ContentCategory =
  | "title"
  | "briefing"
  | "hud"
  | "event"
  | "agenda"
  | "policy"
  | "intervention"
  | "project"
  | "country"
  | "faction"
  | "region"
  | "entity"
  | "outcome";

export interface ContentRecord {
  readonly id: string;
  readonly locale: "ko-KR" | "en-US";
  readonly category: ContentCategory;
  readonly screen: "title" | "briefing" | "main" | "studio";
  readonly entityType?: string;
  readonly entityId?: string;
  readonly branchOrVariantId: string;
  readonly conditionLabel: string;
  readonly text: string;
  readonly allowedVariables: readonly string[];
  readonly maxRecommendedLength: number;
  readonly notes: string;
  readonly tags: readonly string[];
  readonly baselineRevision: string;
}

export interface ContentPatchChange {
  readonly id: string;
  readonly text: string;
}

export interface ContentPatch {
  readonly version: 1;
  readonly changes: readonly ContentPatchChange[];
}

const BASELINE_REVISION = "p0-2026-08-26";

function record(
  value: Omit<
    ContentRecord,
    "locale" | "allowedVariables" | "baselineRevision"
  > &
    Partial<
      Pick<ContentRecord, "locale" | "allowedVariables" | "baselineRevision">
    >,
): ContentRecord {
  return {
    locale: "ko-KR",
    allowedVariables: [],
    baselineRevision: BASELINE_REVISION,
    ...value,
  };
}

const BASE_CONTENT_RECORDS: readonly ContentRecord[] = [
  record({
    id: "tmr.copy.title.ko",
    category: "title",
    screen: "title",
    branchOrVariantId: "default",
    conditionLabel: "기본 타이틀",
    text: PRODUCT_IDENTITY.koTitle,
    maxRecommendedLength: 32,
    notes: "제품 정체성의 한국어 제목",
    tags: ["identity", "title"],
  }),
  record({
    id: "tmr.copy.title.en",
    locale: "en-US",
    category: "title",
    screen: "title",
    branchOrVariantId: "default",
    conditionLabel: "영문 표시",
    text: PRODUCT_IDENTITY.enTitle,
    maxRecommendedLength: 40,
    notes: "제품 정체성의 영문 제목",
    tags: ["identity", "title"],
  }),
  record({
    id: "tmr.copy.title.tagline",
    category: "title",
    screen: "title",
    branchOrVariantId: "default",
    conditionLabel: "기본 태그라인",
    text: PRODUCT_IDENTITY.tagline,
    maxRecommendedLength: 60,
    notes: "국가 연속성 fantasy hook",
    tags: ["identity", "hook"],
  }),
  record({
    id: "tmr.copy.title.eyebrow",
    category: "title",
    screen: "title",
    branchOrVariantId: "default",
    conditionLabel: "타이틀 상단 문구",
    text: PLAYER_COPY.title.eyebrow,
    maxRecommendedLength: 48,
    notes: "authoring-time generated title draft",
    tags: ["title", "eyebrow", "draft"],
  }),
  record({
    id: "tmr.copy.title.hook",
    category: "title",
    screen: "title",
    branchOrVariantId: "default",
    conditionLabel: "타이틀 hook",
    text: PLAYER_COPY.title.hook,
    maxRecommendedLength: 80,
    notes: "authoring-time generated title draft",
    tags: ["title", "hook", "draft"],
  }),
  record({
    id: "tmr.copy.title.action",
    category: "title",
    screen: "title",
    branchOrVariantId: "default",
    conditionLabel: "새 게임 action",
    text: PLAYER_COPY.title.action,
    maxRecommendedLength: 24,
    notes: "title action label",
    tags: ["title", "action"],
  }),
  record({
    id: "tmr.copy.title.secondary",
    category: "title",
    screen: "title",
    branchOrVariantId: "default",
    conditionLabel: "세계 설명 toggle",
    text: PLAYER_COPY.title.secondary,
    maxRecommendedLength: 24,
    notes: "title secondary action label",
    tags: ["title", "action"],
  }),
  record({
    id: "tmr.copy.title.world-note-title",
    category: "title",
    screen: "title",
    branchOrVariantId: "default",
    conditionLabel: "세계 설명 제목",
    text: PLAYER_COPY.title.worldNoteTitle,
    maxRecommendedLength: 32,
    notes: "title optional world note heading",
    tags: ["title", "world-note"],
  }),
  record({
    id: "tmr.copy.title.world-note",
    category: "title",
    screen: "title",
    branchOrVariantId: "default",
    conditionLabel: "세계 설명 본문",
    text: PLAYER_COPY.title.worldNote,
    maxRecommendedLength: 180,
    notes: "authoring-time generated title draft",
    tags: ["title", "world-note", "draft"],
  }),
  record({
    id: "tmr.copy.title.footer",
    category: "title",
    screen: "title",
    branchOrVariantId: "default",
    conditionLabel: "타이틀 footer",
    text: PLAYER_COPY.title.footer,
    maxRecommendedLength: 100,
    notes: "authoring-time generated title draft",
    tags: ["title", "footer", "draft"],
  }),
  record({
    id: "tmr.copy.title.asset-note",
    category: "title",
    screen: "title",
    branchOrVariantId: "default",
    conditionLabel: "타이틀 기록 표기",
    text: "1897 · 헌정 위기 기록 제1호",
    maxRecommendedLength: 48,
    notes: "reviewed static title art note",
    tags: ["title", "asset-note"],
  }),
  record({
    id: "tmr.copy.briefing.label",
    category: "briefing",
    screen: "briefing",
    branchOrVariantId: "default",
    conditionLabel: "브리핑 masthead",
    text: PLAYER_COPY.briefing.label,
    maxRecommendedLength: 60,
    notes: "authoring-time generated opening briefing draft",
    tags: ["opening", "masthead", "draft"],
  }),
  record({
    id: "tmr.copy.briefing.skip",
    category: "briefing",
    screen: "briefing",
    branchOrVariantId: "default",
    conditionLabel: "브리핑 skip action",
    text: PLAYER_COPY.briefing.skip,
    maxRecommendedLength: 24,
    notes: "opening briefing action label",
    tags: ["opening", "action"],
  }),
  record({
    id: "tmr.copy.briefing.next",
    category: "briefing",
    screen: "briefing",
    branchOrVariantId: "default",
    conditionLabel: "브리핑 next action",
    text: PLAYER_COPY.briefing.next,
    maxRecommendedLength: 24,
    notes: "opening briefing action label",
    tags: ["opening", "action"],
  }),
  record({
    id: "tmr.copy.briefing.finish",
    category: "briefing",
    screen: "briefing",
    branchOrVariantId: "default",
    conditionLabel: "브리핑 finish action",
    text: PLAYER_COPY.briefing.finish,
    maxRecommendedLength: 24,
    notes: "opening briefing action label",
    tags: ["opening", "action"],
  }),
  record({
    id: "tmr.copy.briefing.remember",
    category: "briefing",
    screen: "briefing",
    branchOrVariantId: "default",
    conditionLabel: "브리핑 remember option",
    text: PLAYER_COPY.briefing.remember,
    maxRecommendedLength: 24,
    notes: "reserved opening briefing option label",
    tags: ["opening", "action"],
  }),
  ...PLAYER_COPY.briefing.beats.flatMap((beat, index) => [
    record({
      id: `tmr.copy.briefing.beat-${index + 1}.eyebrow`,
      category: "briefing",
      screen: "briefing",
      branchOrVariantId: `briefing-beat-${index + 1}`,
      conditionLabel: `브리핑 ${index + 1} 상단 문구`,
      text: beat.eyebrow,
      maxRecommendedLength: 32,
      notes: "authoring-time generated opening briefing draft",
      tags: ["opening", "eyebrow", "variant", "draft"],
    }),
    record({
      id: `tmr.copy.briefing.beat-${index + 1}.title`,
      category: "briefing",
      screen: "briefing",
      branchOrVariantId: `briefing-beat-${index + 1}`,
      conditionLabel: `브리핑 ${index + 1} 제목`,
      text: beat.title,
      maxRecommendedLength: 70,
      notes: "authoring-time generated opening briefing draft",
      tags: ["opening", "title", "variant", "draft"],
    }),
    record({
      id: `tmr.copy.briefing.beat-${index + 1}.body`,
      category: "briefing",
      screen: "briefing",
      branchOrVariantId: `briefing-beat-${index + 1}`,
      conditionLabel: `브리핑 ${index + 1} 설명`,
      text: beat.body,
      maxRecommendedLength: 160,
      notes: "authoring-time generated opening briefing draft",
      tags: ["opening", "body", "variant", "draft"],
    }),
  ]),
  ...Object.entries(PLAYER_COPY.main).flatMap(([key, text]) =>
    typeof text === "string"
      ? [
          record({
            id: `tmr.copy.main.${key}`,
            category: "hud",
            screen: "main",
            branchOrVariantId: "default",
            conditionLabel: "기본 국정 표면",
            text,
            maxRecommendedLength: 80,
            notes: "정상 gameplay copy",
            tags: ["hud", "main"],
          }),
        ]
      : [],
  ),
];

export interface ResolvedTitleContent {
  readonly eyebrow: string;
  readonly koTitle: string;
  readonly enTitle: string;
  readonly tagline: string;
  readonly hook: string;
  readonly action: string;
  readonly secondary: string;
  readonly worldNoteTitle: string;
  readonly worldNote: string;
  readonly footer: string;
  readonly assetNote: string;
}

export interface ResolvedBriefingBeat {
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
  readonly eyebrowId: string;
  readonly titleId: string;
  readonly bodyId: string;
}

export interface ResolvedOpeningBriefingContent {
  readonly label: string;
  readonly skip: string;
  readonly next: string;
  readonly finish: string;
  readonly remember: string;
  readonly beats: readonly ResolvedBriefingBeat[];
}

function textById(records: readonly ContentRecord[], id: string): string {
  const item = records.find((record) => record.id === id);
  if (item === undefined) throw new Error(`Missing player content ID: ${id}`);
  return item.text;
}

export function resolveTitleContent(
  records: readonly ContentRecord[],
): ResolvedTitleContent {
  return {
    eyebrow: textById(records, "tmr.copy.title.eyebrow"),
    koTitle: textById(records, "tmr.copy.title.ko"),
    enTitle: textById(records, "tmr.copy.title.en"),
    tagline: textById(records, "tmr.copy.title.tagline"),
    hook: textById(records, "tmr.copy.title.hook"),
    action: textById(records, "tmr.copy.title.action"),
    secondary: textById(records, "tmr.copy.title.secondary"),
    worldNoteTitle: textById(records, "tmr.copy.title.world-note-title"),
    worldNote: textById(records, "tmr.copy.title.world-note"),
    footer: textById(records, "tmr.copy.title.footer"),
    assetNote: textById(records, "tmr.copy.title.asset-note"),
  };
}

export function resolveOpeningBriefingContent(
  records: readonly ContentRecord[],
): ResolvedOpeningBriefingContent {
  const beatIndexes = records
    .map((record) => /^tmr\.copy\.briefing\.beat-(\d+)\.title$/.exec(record.id))
    .flatMap((match) => (match === null ? [] : [Number(match[1])]));
  const beats = [...new Set(beatIndexes)].sort(
    (first, second) => first - second,
  );
  return {
    label: textById(records, "tmr.copy.briefing.label"),
    skip: textById(records, "tmr.copy.briefing.skip"),
    next: textById(records, "tmr.copy.briefing.next"),
    finish: textById(records, "tmr.copy.briefing.finish"),
    remember: textById(records, "tmr.copy.briefing.remember"),
    beats: beats.map((index) => {
      const eyebrowId = `tmr.copy.briefing.beat-${index}.eyebrow`;
      const titleId = `tmr.copy.briefing.beat-${index}.title`;
      const bodyId = `tmr.copy.briefing.beat-${index}.body`;
      return {
        eyebrow: textById(records, eyebrowId),
        title: textById(records, titleId),
        body: textById(records, bodyId),
        eyebrowId,
        titleId,
        bodyId,
      };
    }),
  };
}

const STATIC_CONTENT_RECORDS: readonly ContentRecord[] = [
  record({
    id: "tmr.copy.event.rebellion-started",
    category: "event",
    screen: "main",
    entityType: "event",
    entityId: "REBELLION_STARTED",
    branchOrVariantId: "event-rebellion",
    conditionLabel: "활성 반란",
    text: "반란 발생",
    maxRecommendedLength: 44,
    notes: "실제 EventStore event type의 player-facing 제목",
    tags: ["event", "crisis", "variant"],
  }),
  record({
    id: "tmr.copy.event.coup-started",
    category: "event",
    screen: "main",
    entityType: "event",
    entityId: "COUP_ATTEMPT_STARTED",
    branchOrVariantId: "event-coup",
    conditionLabel: "활성 쿠데타",
    text: "쿠데타 시도 발생",
    maxRecommendedLength: 44,
    notes: "실제 EventStore event type의 player-facing 제목",
    tags: ["event", "crisis", "variant"],
  }),
  record({
    id: "tmr.copy.agenda.pressure",
    category: "agenda",
    screen: "main",
    entityType: "agenda",
    entityId: "current-pressure",
    branchOrVariantId: "agenda-current-pressure",
    conditionLabel: "현재 압력이 감지될 때",
    text: "현재 압력",
    maxRecommendedLength: 32,
    notes: "현재 상태에서 파생된 Agenda 표면의 공통 문구",
    tags: ["agenda", "hud", "variant"],
  }),
  record({
    id: "tmr.copy.agenda.consolidation",
    category: "agenda",
    screen: "main",
    entityType: "agenda",
    entityId: "order-consolidation",
    branchOrVariantId: "agenda-consolidation",
    conditionLabel: "국가 정착 목표",
    text: "새 질서 정착",
    maxRecommendedLength: 32,
    notes: "실제 Order Consolidation eligibility의 목표 표면",
    tags: ["agenda", "objective", "variant"],
  }),
  record({
    id: "tmr.copy.project.granary-network.name",
    category: "project",
    screen: "main",
    entityType: "project",
    entityId: "tmr.project.arken.granary-network",
    branchOrVariantId: "project-granary-network",
    conditionLabel: "식량 공급 개입 사업",
    text: "왕실 배급망",
    maxRecommendedLength: 44,
    notes: "기존 식량 공급 개입 lifecycle을 투영하는 landmark 표기",
    tags: ["project", "landmark", "variant"],
  }),
  record({
    id: "tmr.copy.project.industrial-council.name",
    category: "project",
    screen: "main",
    entityType: "project",
    entityId: "tmr.project.arken.industrial-council",
    branchOrVariantId: "project-industrial-council",
    conditionLabel: "정치 타협 개입 사업",
    text: "산업 협의회",
    maxRecommendedLength: 44,
    notes: "기존 정치 타협 개입 lifecycle을 투영하는 landmark 표기",
    tags: ["project", "landmark", "variant"],
  }),
  record({
    id: "tmr.copy.project.constitutional-assembly.name",
    category: "project",
    screen: "main",
    entityType: "project",
    entityId: "tmr.project.arken.constitutional-assembly",
    branchOrVariantId: "project-constitutional-assembly",
    conditionLabel: "야권 합법화 개입 사업",
    text: "헌정 회의소",
    maxRecommendedLength: 44,
    notes: "기존 야권 합법화 개입 lifecycle을 투영하는 landmark 표기",
    tags: ["project", "landmark", "variant"],
  }),
  record({
    id: "tmr.copy.outcome.state-continuity",
    category: "outcome",
    screen: "main",
    entityType: "outcome",
    entityId: "state-continuity",
    branchOrVariantId: "outcome-continuity",
    conditionLabel: "국가 연속성 지표",
    text: "국가 존속",
    maxRecommendedLength: 32,
    notes: "정권 교체와 분리된 국가 연속성 표시",
    tags: ["outcome", "hud", "variant"],
  }),
];

function entityRecord(
  category: "policy" | "intervention",
  definition: PolicyDefinition | InterventionDefinition,
): ContentRecord {
  return record({
    id: `tmr.copy.${category}.${definition.id}.name`,
    category,
    screen: "main",
    entityType: category,
    entityId: definition.id,
    branchOrVariantId: `${category}-${definition.id}`,
    conditionLabel: `${definition.name} 기본 표기`,
    text: definition.name,
    maxRecommendedLength: 44,
    notes: `${category} catalog source`,
    tags: [category, "entity", "variant"],
  });
}

/** Build stable content records from the authored scenario catalog. */
export function buildContentRegistry(
  scenario: ScenarioDefinition,
): readonly ContentRecord[] {
  const worldEntityRecords = [
    ...scenario.initialCountries.map((country) =>
      record({
        id: `tmr.copy.country.${country.id}.name`,
        category: "country",
        screen: "main",
        entityType: "country",
        entityId: country.id,
        branchOrVariantId: `country-${country.id}`,
        conditionLabel: "실제 국가 표기",
        text: country.name,
        maxRecommendedLength: 44,
        notes: "authored ScenarioDefinition Country source",
        tags: ["country", "map", "variant"],
      }),
    ),
    ...scenario.initialFactions.map((faction) =>
      record({
        id: `tmr.copy.faction.${faction.id}.name`,
        category: "faction",
        screen: "main",
        entityType: "faction",
        entityId: faction.id,
        branchOrVariantId: `faction-${faction.id}`,
        conditionLabel: "실제 조직 표기",
        text: faction.name,
        maxRecommendedLength: 44,
        notes: "authored ScenarioDefinition Faction source",
        tags: ["faction", "agenda", "variant"],
      }),
    ),
    ...scenario.initialRegions.map((region) =>
      record({
        id: `tmr.copy.region.${region.id}.name`,
        category: "region",
        screen: "main",
        entityType: "region",
        entityId: region.id,
        branchOrVariantId: `region-${region.id}`,
        conditionLabel: "실제 지도 지역 표기",
        text: region.name,
        maxRecommendedLength: 44,
        notes: "authored ScenarioDefinition Region source",
        tags: ["region", "map", "variant"],
      }),
    ),
  ];
  const entityRecords = [
    ...Object.values(scenario.policyCatalog).map((definition) =>
      entityRecord("policy", definition),
    ),
    ...Object.values(scenario.interventionCatalog).map((definition) =>
      entityRecord("intervention", definition),
    ),
  ].sort((first, second) => first.id.localeCompare(second.id));
  return [
    ...BASE_CONTENT_RECORDS,
    ...STATIC_CONTENT_RECORDS,
    ...worldEntityRecords,
    ...entityRecords,
  ];
}

export function assertContentRegistry(records: readonly ContentRecord[]): void {
  const ids = new Set<string>();
  for (const item of records) {
    if (ids.has(item.id)) throw new Error(`Content ID repeats: ${item.id}`);
    ids.add(item.id);
    if (item.text.trim().length === 0) {
      throw new Error(`Content ${item.id} is empty.`);
    }
    const placeholders = [...item.text.matchAll(/\{\{([^}]+)\}\}/g)].map(
      (match) => match[1],
    );
    for (const placeholder of placeholders) {
      if (!item.allowedVariables.includes(placeholder ?? "")) {
        throw new Error(`Content ${item.id} has an undeclared variable.`);
      }
    }
  }
}

export function contentLengthWarning(
  item: ContentRecord,
  text: string,
): string | null {
  return text.length > item.maxRecommendedLength
    ? `권장 길이 ${item.maxRecommendedLength}자를 넘었습니다 (${text.length}자).`
    : null;
}

export function validateContentPatch(
  patch: ContentPatch,
  records: readonly ContentRecord[],
): readonly string[] {
  if (patch.version !== 1) return ["지원하지 않는 patch version입니다."];
  const knownIds = new Set(records.map((item) => item.id));
  const seen = new Set<string>();
  const errors: string[] = [];
  for (const change of patch.changes) {
    if (!knownIds.has(change.id))
      errors.push(`알 수 없는 content ID: ${change.id}`);
    if (seen.has(change.id)) errors.push(`중복 content ID: ${change.id}`);
    seen.add(change.id);
    if (change.text.trim().length === 0) {
      errors.push(`빈 text: ${change.id}`);
    }
  }
  return errors;
}

export function parseContentPatch(
  json: string,
  records: readonly ContentRecord[],
): ContentPatch {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    throw new Error("JSON patch를 읽을 수 없습니다.");
  }
  if (typeof value !== "object" || value === null) {
    throw new Error("JSON patch object가 필요합니다.");
  }
  const candidate = value as { version?: unknown; changes?: unknown };
  if (candidate.version !== 1 || !Array.isArray(candidate.changes)) {
    throw new Error("patch version 1과 changes 배열이 필요합니다.");
  }
  const changes = candidate.changes.map((change) => {
    if (
      typeof change !== "object" ||
      change === null ||
      typeof (change as { id?: unknown }).id !== "string" ||
      typeof (change as { text?: unknown }).text !== "string"
    ) {
      throw new Error("patch change는 id/text 문자열이어야 합니다.");
    }
    return {
      id: (change as { id: string }).id,
      text: (change as { text: string }).text,
    };
  });
  const patch: ContentPatch = { version: 1, changes };
  const errors = validateContentPatch(patch, records);
  if (errors.length > 0) throw new Error(errors.join(" "));
  return patch;
}

export function applyContentPatch(
  records: readonly ContentRecord[],
  patch: ContentPatch,
): readonly ContentRecord[] {
  const changes = new Map(
    patch.changes.map((change) => [change.id, change.text]),
  );
  return records.map((item) => {
    const text = changes.get(item.id);
    return text === undefined ? item : { ...item, text };
  });
}
