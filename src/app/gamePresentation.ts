import type { GameEvent } from "../sim/events/event";
import type {
  InterventionEffect,
  InterventionFeasibilityFailure,
} from "../sim/state/intervention";
import type { RegimeClassification } from "../sim/state/government";
import type { Region } from "../sim/state/region";
import type { ScenarioDefinition } from "../sim/state/scenario";
import type { RunRecord } from "../sim/core/step";

export const REGIME_LABELS: Readonly<Record<RegimeClassification, string>> = {
  monarchy: "왕정",
  republic: "공화정",
  democracy: "민주주의",
  communism: "공산주의",
  dictatorship: "독재정",
  theocracy: "신정",
  other: "혼합 제도",
};

export const RULE_LABELS: Readonly<Record<string, string>> = {
  rulerVeto: "군주 거부권",
  legislatureRequired: "입법부 승인",
  suffrage: "참정권",
  landOwnership: "토지 소유",
  productiveProperty: "생산수단 소유",
  laborOrganization: "노동조합",
  pressFreedom: "언론 자유",
  politicalCompetition: "정치 경쟁",
};

export const RULE_VALUE_LABELS: Readonly<Record<string, string>> = {
  true: "있음",
  false: "없음",
  none: "없음",
  elite: "엘리트",
  property: "재산 보유자",
  broad: "광범위",
  universal: "보통 선거",
  feudal: "봉건",
  private: "사유",
  communal: "공동",
  state: "국유",
  illegal: "불법",
  restricted: "제한",
  legal: "합법",
  censored: "검열",
  free: "자유",
  banned: "금지",
  plural: "다원",
  mixed: "혼합",
  publicOnly: "공공 소유",
};

const RESOURCE_LABELS: Readonly<Record<string, string>> = {
  food: "식량",
  material: "자재",
  mana: "마력",
  arms: "무기",
};

const FACTION_STRATEGY_LABELS: Readonly<Record<string, string>> = {
  wait: "관망",
  accept: "수용",
  protest: "항의",
  strike: "파업",
  bargain: "협상",
  lobby: "청원",
  organize: "조직화",
  hoard: "비축",
  fundMovement: "운동 지원",
  supportCoup: "쿠데타 지지",
  compromise: "타협",
  defect: "이탈",
};

function asObject(value: unknown): Readonly<Record<string, unknown>> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : null;
}

function payloadString(event: GameEvent, key: string): string | null {
  const payload = asObject(event.payload);
  const value = payload?.[key];
  return typeof value === "string" ? value : null;
}

function payloadNumber(event: GameEvent, key: string): number | null {
  const payload = asObject(event.payload);
  const value = payload?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function formatAmount(value: number): string {
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(
    value,
  );
}

export function formatDate(date: RunRecord["world"]["date"]): string {
  return `${date.year}.${String(date.month).padStart(2, "0")}.${String(date.day).padStart(2, "0")}`;
}

export function regionName(
  scenario: ScenarioDefinition,
  regionId: string | null | undefined,
): string {
  if (regionId === null || regionId === undefined) return "지역";
  return (
    scenario.initialRegions.find((region) => region.id === regionId)?.name ??
    "지역"
  );
}

export function factionName(
  scenario: ScenarioDefinition,
  factionId: string | null | undefined,
): string {
  if (factionId === null || factionId === undefined) return "세력";
  return (
    scenario.initialFactions.find((faction) => faction.id === factionId)
      ?.name ?? "세력"
  );
}

export function countryName(
  scenario: ScenarioDefinition,
  countryId: string | null | undefined,
): string {
  if (countryId === null || countryId === undefined) return "국가";
  return (
    scenario.initialCountries.find((country) => country.id === countryId)
      ?.name ?? "국가"
  );
}

function interventionName(
  scenario: ScenarioDefinition,
  event: GameEvent,
): string {
  const id = payloadString(event, "interventionId");
  if (id === null) return "정책 개입";
  return (
    Object.values(scenario.interventionCatalog).find(
      (definition) => definition.id === id,
    )?.name ?? "정책 개입"
  );
}

export interface EventPresentation {
  readonly title: string;
  readonly detail: string;
  readonly crisis: boolean;
}

export function eventLabel(
  event: GameEvent,
  scenario: ScenarioDefinition,
): EventPresentation {
  switch (event.type) {
    case "TICK_ADVANCED":
      return {
        title: "하루가 지났습니다",
        detail: `국가 기록 ${payloadNumber(event, "nextTick") ?? event.tick}일차`,
        crisis: false,
      };
    case "INTERVENTION_STARTED":
      return {
        title: `${interventionName(scenario, event)} 시작`,
        detail: `국고 ${formatAmount(payloadNumber(event, "treasuryCost") ?? 0)} 사용 · ${payloadNumber(event, "durationDays") ?? 0}일 후 완료`,
        crisis: false,
      };
    case "INTERVENTION_COMPLETED":
      return {
        title: `${interventionName(scenario, event)} 완료`,
        detail: "선언된 완료 효과가 국가 상태에 반영되었습니다.",
        crisis: false,
      };
    case "INTERVENTION_REJECTED":
      return {
        title: `${interventionName(scenario, event)} 거부`,
        detail: "현재 국고·행정 여력·제도 조건 중 하나를 충족하지 못했습니다.",
        crisis: false,
      };
    case "TREASURY_CHANGED": {
      const delta = payloadNumber(event, "delta") ?? 0;
      return {
        title: delta < 0 ? "국고 감소" : "국고 증가",
        detail: `변동 ${delta >= 0 ? "+" : ""}${formatAmount(delta)}`,
        crisis: false,
      };
    }
    case "RESOURCE_SHORTAGE_CHANGED":
      return {
        title: `${regionName(scenario, payloadString(event, "regionId"))} 자원 부족 변화`,
        detail: `희소성 ${formatAmount(payloadNumber(event, "scarcity") ?? 0)}`,
        crisis: false,
      };
    case "FACTION_STRATEGY_CHANGED": {
      const strategy = payloadString(event, "strategy");
      return {
        title: `${factionName(scenario, payloadString(event, "factionId"))}의 움직임`,
        detail: `현재 선택 ${FACTION_STRATEGY_LABELS[strategy ?? ""] ?? "조정"}`,
        crisis: false,
      };
    }
    case "COUP_ATTEMPT_STARTED":
      return {
        title: "쿠데타 시도 발생",
        detail: "현재 정치 조건이 충족되어 정권의 위기가 시작되었습니다.",
        crisis: true,
      };
    case "REBELLION_STARTED":
      return {
        title: "반란 발생",
        detail: "현재 정치 조건이 충족되어 반란이 시작되었습니다.",
        crisis: true,
      };
    case "LAND_HEX_CONTROL_CHANGED":
      return {
        title: `${regionName(scenario, payloadString(event, "regionId"))} 통제 변화`,
        detail: "해당 지역의 물리적 통제가 바뀌었습니다.",
        crisis: false,
      };
    case "CONFLICT_RESOLVED":
      return {
        title: "충돌 해결",
        detail: "국가 연대기에 충돌 결과가 기록되었습니다.",
        crisis: true,
      };
    case "ORDER_CONSOLIDATED":
      return {
        title: "새 질서가 공고해졌습니다",
        detail: "국가의 공고화 조건이 충족되었습니다.",
        crisis: true,
      };
    case "STATE_DISSOLVED":
      return {
        title: "국가 기능이 해체되었습니다",
        detail: "국가의 존속 조건이 더 이상 충족되지 않습니다.",
        crisis: true,
      };
    default:
      return {
        title: "기록된 국가 변화",
        detail: "국가 연대기에 새로운 변동이 기록되었습니다.",
        crisis: false,
      };
  }
}

export function formatFailure(reason: InterventionFeasibilityFailure): string {
  switch (reason.kind) {
    case "INSUFFICIENT_TREASURY":
      return `국고 부족 (필요 ${formatAmount(reason.required)})`;
    case "INSUFFICIENT_ADMINISTRATIVE_HEADROOM":
      return `행정 여력 부족 (필요 ${formatAmount(reason.required)})`;
    case "PREREQUISITE_NOT_MET":
      return "제도 선행 조건 미충족";
    case "NO_COMPLETION_EFFECT_CHANGE":
      return "현재 상태에서 바뀌는 완료 효과 없음";
    case "TERMINAL_RUN":
      return "이미 종료된 게임";
    case "MISSING_COUNTRY":
    case "MISSING_POLICY_STATE":
    case "UNKNOWN_INTERVENTION":
      return "현재 국가 기록과 연결되지 않음";
  }
}

export function effectLabel(
  effect: InterventionEffect,
  scenario: ScenarioDefinition,
): string {
  if (effect.kind === "regionResourceProductionCapacityDelta") {
    return `${regionName(scenario, effect.regionId)} ${RESOURCE_LABELS[effect.resourceType] ?? "자원"} 생산능력 ${effect.delta >= 0 ? "+" : ""}${formatAmount(effect.delta)}`;
  }
  if (effect.kind === "factionGrievanceDelta") {
    return `${factionName(scenario, effect.factionId)} 불만 ${effect.delta >= 0 ? "+" : ""}${formatAmount(effect.delta)}`;
  }
  if (effect.kind === "factionOrganizationDelta") {
    return `${factionName(scenario, effect.factionId)} 조직도 ${effect.delta >= 0 ? "+" : ""}${formatAmount(effect.delta)}`;
  }
  return `${RULE_LABELS[effect.rule] ?? "제도"} 변경`;
}

export function regionForEffect(
  effect: InterventionEffect,
  regions: Readonly<Record<string, Region>>,
): Region | null {
  if (effect.kind !== "regionResourceProductionCapacityDelta") return null;
  return regions[effect.regionId] ?? null;
}
