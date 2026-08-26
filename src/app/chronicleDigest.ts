import type { GameEvent } from "../sim/events/event";
import type { ScenarioDefinition } from "../sim/state/scenario";
import { eventLabel, isSignificantEvent, regionName } from "./gamePresentation";

export type ChronicleDigestLevel = 1 | 2 | 3;

export interface ChronicleDigestItem {
  readonly id: string;
  readonly tick: number;
  readonly level: ChronicleDigestLevel;
  readonly title: string;
  readonly detail: string;
  readonly crisis: boolean;
  readonly regionIds: readonly string[];
  readonly sourceEventIds: readonly string[];
}

const MAJOR_HISTORY_TYPES = new Set<GameEvent["type"]>([
  "REBELLION_STARTED",
  "COUP_ATTEMPT_STARTED",
  "CIVIL_WAR_STARTED",
  "CONFLICT_RESOLVED",
  "LAND_HEX_CONTROL_CHANGED",
  "GOVERNMENT_TRANSITIONED",
  "POLICY_ENACTED",
  "INSTITUTION_RULE_CHANGED",
  "INTERVENTION_COMPLETED",
  "ORDER_CONSOLIDATED",
  "STATE_DISSOLVED",
]);

const STRATEGIC_HISTORY_TYPES = new Set<GameEvent["type"]>([
  "INTERVENTION_STARTED",
  "BORDER_CLOSED",
  "BORDER_REOPENED",
  "FACTION_STRATEGY_CHANGED",
  "POLITICAL_PROPOSAL_OPENED",
  "POLITICAL_PROPOSAL_ACCEPTED",
  "POLITICAL_PROPOSAL_REJECTED",
  "FOREIGN_SUPPORT_SENT",
  "TRADE_DISRUPTED",
  "ORDER_CONSOLIDATION_STARTED",
]);

function asObject(value: unknown): Readonly<Record<string, unknown>> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : null;
}

function eventRegionIds(event: GameEvent): readonly string[] {
  const payload = asObject(event.payload);
  const ids = new Set<string>();
  const direct = ["regionId", "targetRegionId", "sourceRegionId"];
  for (const key of direct) {
    const value = payload?.[key];
    if (typeof value === "string") ids.add(value);
  }
  const affected = payload?.affectedRegionIds;
  if (Array.isArray(affected)) {
    for (const value of affected) {
      if (typeof value === "string") ids.add(value);
    }
  }
  return [...ids].sort();
}

function levelFor(event: GameEvent): ChronicleDigestLevel {
  if (MAJOR_HISTORY_TYPES.has(event.type)) return 1;
  if (STRATEGIC_HISTORY_TYPES.has(event.type)) return 2;
  return 3;
}

function familyFor(event: GameEvent): string {
  if (
    event.type === "IDEOLOGY_SUPPORT_CHANGED" ||
    event.type === "IDEOLOGY_RADICALISM_CHANGED" ||
    event.type === "IDEOLOGY_ORGANIZATION_CHANGED"
  ) {
    return "ideology";
  }
  if (
    event.type === "FACTION_STRATEGY_CHANGED" ||
    event.type === "FACTION_FUND_MOVEMENT_COMMITTED" ||
    event.type === "FACTION_FUND_MOVEMENT_RESOLVED"
  ) {
    return "faction";
  }
  if (
    event.type === "RESOURCE_SHORTAGE_CHANGED" ||
    event.type === "REGION_UNREST_BAND_CHANGED" ||
    event.type === "NATIONAL_INSTABILITY_BAND_CHANGED"
  ) {
    return "material";
  }
  return event.type;
}

function groupKey(event: GameEvent, level: ChronicleDigestLevel): string {
  if (level < 3) return `event:${event.id}`;
  const regionId = eventRegionIds(event)[0] ?? "national";
  return `${event.tick}:${familyFor(event)}:${regionId}`;
}

function compareEvents(first: GameEvent, second: GameEvent): number {
  return first.tick - second.tick || first.sequence - second.sequence;
}

interface MutableDigestGroup {
  readonly key: string;
  readonly level: ChronicleDigestLevel;
  readonly tick: number;
  readonly events: GameEvent[];
  readonly regionIds: Set<string>;
}

function groupedTitle(
  group: ChronicleDigestGroup,
  scenario: ScenarioDefinition,
): string {
  const first = group.events[0];
  if (first === undefined) return "국가 기록";
  if (group.events.length === 1) return eventLabel(first, scenario).title;
  if (group.family === "ideology") {
    const region = regionName(scenario, [...group.regionIds][0]);
    return `${region} 정치 지형 변화`;
  }
  if (group.family === "faction") return "세력 움직임 묶음";
  if (group.family === "material") return "물자·불안 추세 묶음";
  return `${eventLabel(first, scenario).title} 외 ${group.events.length - 1}건`;
}

function groupedDetail(
  group: MutableDigestGroup,
  scenario: ScenarioDefinition,
): string {
  const first = group.events[0];
  if (first === undefined) return "기록된 사실이 없습니다.";
  if (group.events.length === 1) return eventLabel(first, scenario).detail;
  const places = [...group.regionIds]
    .map((regionId) => regionName(scenario, regionId))
    .join(" · ");
  return `${group.events.length}건의 기록을 한 흐름으로 묶었습니다${places.length > 0 ? ` · ${places}` : ""}. 원문 기록에서 각 EventId를 확인할 수 있습니다.`;
}

export interface ChronicleDigestGroup extends MutableDigestGroup {
  readonly family: string;
}

/**
 * Groups only presentation rows. The input EventStore is never changed and
 * every digest item retains the exact source event IDs for drill-down.
 */
export function deriveChronicleDigest(
  events: readonly GameEvent[],
  scenario: ScenarioDefinition,
  limit = 12,
): readonly ChronicleDigestItem[] {
  if (!Number.isInteger(limit) || limit < 0) {
    throw new Error("Chronicle digest limit must be a non-negative integer.");
  }

  const groups = new Map<string, ChronicleDigestGroup>();
  for (const event of [...events].sort(compareEvents)) {
    if (!isSignificantEvent(event)) continue;
    const level = levelFor(event);
    const key = groupKey(event, level);
    const existing = groups.get(key);
    if (existing !== undefined) {
      existing.events.push(event);
      for (const regionId of eventRegionIds(event)) {
        existing.regionIds.add(regionId);
      }
      continue;
    }
    const group: ChronicleDigestGroup = {
      key,
      family: familyFor(event),
      level,
      tick: event.tick,
      events: [event],
      regionIds: new Set(eventRegionIds(event)),
    };
    groups.set(key, group);
  }

  return [...groups.values()]
    .sort(
      (first, second) =>
        second.tick - first.tick ||
        first.level - second.level ||
        (first.events[0]?.sequence ?? 0) - (second.events[0]?.sequence ?? 0) ||
        first.key.localeCompare(second.key),
    )
    .slice(0, limit)
    .map((group) => {
      const sourceEventIds = group.events
        .slice()
        .sort(compareEvents)
        .map((event) => event.id);
      const regionIds = [...group.regionIds].sort();
      return {
        id: `chronicle:${group.key}`,
        tick: group.tick,
        level: group.level,
        title: groupedTitle(group, scenario),
        detail: groupedDetail(group, scenario),
        crisis: group.events.some(
          (event) => eventLabel(event, scenario).crisis,
        ),
        regionIds,
        sourceEventIds,
      };
    });
}
