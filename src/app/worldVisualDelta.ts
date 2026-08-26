import type { GameEvent } from "../sim/events/event";
import type {
  PresentationState,
  PresentationRegion,
} from "../presentation/presentationState";
import type { PolicyState } from "../sim/state/policy";

export type WorldVisualDeltaKind =
  "controller" | "ideology" | "conflict" | "route" | "institution" | "project";

export interface WorldVisualDelta {
  readonly id: string;
  readonly kind: WorldVisualDeltaKind;
  readonly label: string;
  readonly regionIds: readonly string[];
  readonly sourceEventIds: readonly string[];
  readonly emphasis: "high" | "medium";
}

function stableJson(value: unknown): string {
  return JSON.stringify(value);
}

function changedRegionIds(
  previous: readonly PresentationRegion[],
  next: readonly PresentationRegion[],
  selector: (region: PresentationRegion) => unknown,
): readonly string[] {
  const previousById = new Map(
    previous.map((region) => [region.regionId, selector(region)]),
  );
  return next
    .filter(
      (region) =>
        stableJson(previousById.get(region.regionId)) !==
        stableJson(selector(region)),
    )
    .map((region) => region.regionId)
    .sort();
}

function eventIds(
  events: readonly GameEvent[],
  types: readonly GameEvent["type"][],
  regionIds: readonly string[] = [],
): readonly string[] {
  const regionSet = new Set(regionIds);
  return events
    .filter((event) => {
      if (!types.includes(event.type)) return false;
      if (regionSet.size === 0) return true;
      const payload = event.payload;
      if (typeof payload !== "object" || payload === null) return false;
      const value = (payload as { regionId?: unknown }).regionId;
      const affected = (payload as { affectedRegionIds?: unknown })
        .affectedRegionIds;
      return (
        (typeof value === "string" && regionSet.has(value)) ||
        (Array.isArray(affected) &&
          affected.some(
            (entry) => typeof entry === "string" && regionSet.has(entry),
          ))
      );
    })
    .map((event) => event.id)
    .sort();
}

function makeDelta(
  kind: WorldVisualDeltaKind,
  label: string,
  regionIds: readonly string[],
  sourceEventIds: readonly string[],
  emphasis: WorldVisualDelta["emphasis"] = "medium",
): WorldVisualDelta {
  const scope = regionIds.join(",") || "national";
  const eventScope = sourceEventIds.join(",") || "state";
  return {
    id: `visual-delta:${kind}:${scope}:${eventScope}`,
    kind,
    label,
    regionIds: [...regionIds].sort(),
    sourceEventIds: [...sourceEventIds].sort(),
    emphasis,
  };
}

/**
 * Derives short-lived map feedback from two authoritative projections. It is
 * intentionally not stored in WorldState, EventStore or persistence.
 */
export function deriveWorldVisualDeltas(input: {
  readonly previous: PresentationState;
  readonly next: PresentationState;
  readonly events: readonly GameEvent[];
  readonly previousPolicy?: PolicyState;
  readonly nextPolicy?: PolicyState;
}): readonly WorldVisualDelta[] {
  const deltas: WorldVisualDelta[] = [];
  const previousHexes = new Map(
    input.previous.landHexes.map((hex) => [hex.landHexId, hex.controller]),
  );
  const changedHexes = input.next.landHexes.filter(
    (hex) =>
      stableJson(previousHexes.get(hex.landHexId)) !==
      stableJson(hex.controller),
  );
  if (changedHexes.length > 0) {
    const regionIds = changedHexes.map((hex) => hex.regionId).sort();
    deltas.push(
      makeDelta(
        "controller",
        "물리 영토 통제가 이동했습니다",
        regionIds,
        eventIds(input.events, ["LAND_HEX_CONTROL_CHANGED"], regionIds),
        "high",
      ),
    );
  }

  const ideologyRegions = changedRegionIds(
    input.previous.regions,
    input.next.regions,
    (region) => region.politicalInfluence,
  );
  if (ideologyRegions.length > 0) {
    deltas.push(
      makeDelta(
        "ideology",
        "지역 정치 흐름이 변했습니다",
        ideologyRegions,
        eventIds(
          input.events,
          [
            "IDEOLOGY_SUPPORT_CHANGED",
            "IDEOLOGY_RADICALISM_CHANGED",
            "IDEOLOGY_ORGANIZATION_CHANGED",
          ],
          ideologyRegions,
        ),
      ),
    );
  }

  const previousConflicts = new Set(
    input.previous.activeConflicts.map((conflict) => conflict.conflictId),
  );
  const conflictRegions = input.next.activeConflicts
    .filter((conflict) => !previousConflicts.has(conflict.conflictId))
    .flatMap((conflict) => [
      ...conflict.affectedRegionIds,
      ...conflict.contestedRegionIds,
    ])
    .sort();
  if (conflictRegions.length > 0) {
    deltas.push(
      makeDelta(
        "conflict",
        "활성 충돌이 지도에 나타났습니다",
        conflictRegions,
        eventIds(
          input.events,
          ["REBELLION_STARTED", "COUP_ATTEMPT_STARTED", "CIVIL_WAR_STARTED"],
          conflictRegions,
        ),
        "high",
      ),
    );
  }

  const previousRoutes = new Map(
    input.previous.contactRoutes.map((route) => [route.routeId, route]),
  );
  const changedRoutes = input.next.contactRoutes.filter((route) => {
    const previous = previousRoutes.get(route.routeId);
    return (
      previous !== undefined &&
      stableJson([previous.enabled, previous.multiplier, previous.active]) !==
        stableJson([route.enabled, route.multiplier, route.active])
    );
  });
  if (changedRoutes.length > 0) {
    deltas.push(
      makeDelta(
        "route",
        "실제 접촉 경로가 바뀌었습니다",
        changedRoutes.flatMap((route) => [
          route.sourceRegionId,
          route.targetRegionId,
        ]),
        eventIds(input.events, ["BORDER_CLOSED", "BORDER_REOPENED"]),
      ),
    );
  }

  if (
    input.previousPolicy !== undefined &&
    input.nextPolicy !== undefined &&
    stableJson(input.previousPolicy) !== stableJson(input.nextPolicy)
  ) {
    deltas.push(
      makeDelta(
        "institution",
        "제도 경로가 갱신되었습니다",
        [],
        eventIds(input.events, ["POLICY_ENACTED", "INSTITUTION_RULE_CHANGED"]),
        "high",
      ),
    );
  }

  const projectEvents = eventIds(input.events, [
    "INTERVENTION_STARTED",
    "INTERVENTION_COMPLETED",
  ]);
  if (projectEvents.length > 0) {
    deltas.push(
      makeDelta(
        "project",
        "국가 사업의 구현 단계가 바뀌었습니다",
        [],
        projectEvents,
      ),
    );
  }

  return deltas.sort(
    (first, second) =>
      first.kind.localeCompare(second.kind) ||
      first.id.localeCompare(second.id),
  );
}
