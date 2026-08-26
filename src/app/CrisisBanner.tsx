import type { GameEvent } from "../sim/events/event";
import type { PresentationConflict } from "../presentation/presentationState";
import type { ScenarioDefinition } from "../sim/state/scenario";
import { eventLabel } from "./gamePresentation";

function conflictKindLabel(kind: PresentationConflict["kind"]): string {
  switch (kind) {
    case "rebellion":
      return "반란";
    case "coup":
      return "쿠데타";
    case "civilWar":
      return "내전";
    case "war":
      return "전쟁";
  }
}

function conflictDetail(
  conflict: PresentationConflict,
  scenario: ScenarioDefinition,
): string {
  const regionNames = [
    ...conflict.affectedRegionIds,
    ...conflict.contestedRegionIds,
  ]
    .map(
      (regionId) =>
        scenario.initialRegions.find((region) => region.id === regionId)?.name,
    )
    .filter((name): name is string => name !== undefined);
  return `${regionNames.length > 0 ? regionNames.join(" · ") : "정치적 영향권"} · ${conflict.participantFactionIds.length}개 세력 관여 · ${conflict.startedAtTick}일차 시작`;
}

export function CrisisBanner({
  event,
  activeConflicts,
  scenario,
  onFocusMap,
}: {
  readonly event: GameEvent | undefined;
  readonly activeConflicts: readonly PresentationConflict[];
  readonly scenario: ScenarioDefinition;
  readonly onFocusMap?: () => void;
}) {
  const activeConflict = activeConflicts[0];
  if (activeConflict === undefined && event === undefined) return null;
  const mapped = event === undefined ? null : eventLabel(event, scenario);
  const title =
    activeConflict === undefined
      ? (mapped?.title ?? "현재 사건")
      : `${conflictKindLabel(activeConflict.kind)} 진행 중`;
  const detail =
    activeConflict === undefined
      ? (mapped?.detail ?? "현재 국가 기록에 새로운 변동이 있습니다.")
      : conflictDetail(activeConflict, scenario);
  return (
    <section
      className="crisis-banner"
      role="status"
      aria-live="assertive"
      data-active-conflict-count={activeConflicts.length}
    >
      <span className="crisis-stamp">현재 사건</span>
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      {onFocusMap === undefined ? null : (
        <button
          className="crisis-focus-button"
          type="button"
          onClick={onFocusMap}
        >
          지도에서 보기
        </button>
      )}
      <small>정권의 위기와 국가의 존속은 별개의 기록입니다.</small>
    </section>
  );
}
