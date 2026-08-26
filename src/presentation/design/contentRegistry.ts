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
  ...PLAYER_COPY.briefing.beats.map((beat, index) =>
    record({
      id: `tmr.copy.briefing.beat-${index + 1}.title`,
      category: "briefing",
      screen: "briefing",
      branchOrVariantId: `briefing-beat-${index + 1}`,
      conditionLabel: `브리핑 ${index + 1}`,
      text: beat.title,
      maxRecommendedLength: 70,
      notes: "실제 authored opening briefing beat",
      tags: ["opening", "variant"],
    }),
  ),
  ...PLAYER_COPY.briefing.beats.map((beat, index) =>
    record({
      id: `tmr.copy.briefing.beat-${index + 1}.body`,
      category: "briefing",
      screen: "briefing",
      branchOrVariantId: `briefing-beat-${index + 1}`,
      conditionLabel: `브리핑 ${index + 1} 설명`,
      text: beat.body,
      maxRecommendedLength: 160,
      notes: "실제 authored opening briefing support copy",
      tags: ["opening", "body", "variant"],
    }),
  ),
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
  const entityRecords = [
    ...Object.values(scenario.policyCatalog).map((definition) =>
      entityRecord("policy", definition),
    ),
    ...Object.values(scenario.interventionCatalog).map((definition) =>
      entityRecord("intervention", definition),
    ),
  ].sort((first, second) => first.id.localeCompare(second.id));
  return [...BASE_CONTENT_RECORDS, ...entityRecords];
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
