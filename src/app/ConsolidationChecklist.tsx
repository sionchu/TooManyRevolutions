import type { OrderConsolidationEligibilitySnapshot } from "../sim/systems/orderConsolidation";
import type { ScenarioDefinition } from "../sim/state/scenario";
import { countryName, formatAmount, regionName } from "./gamePresentation";

interface ChecklistRow {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
  readonly passes: boolean;
}

export function ConsolidationChecklist({
  snapshot,
  scenario,
}: {
  readonly snapshot: OrderConsolidationEligibilitySnapshot;
  readonly scenario: ScenarioDefinition;
}) {
  const countryLabel = countryName(scenario, snapshot.countryId);
  const rows: readonly ChecklistRow[] = [
    {
      id: "stableRegions",
      label: "안정 지역",
      detail: `${snapshot.stableRegions.satisfiedRegionIds.length}/${snapshot.stableRegions.requiredRegionIds.length} 충족`,
      passes: snapshot.stableRegions.passes,
    },
    {
      id: "capitalControl",
      label: "수도 통제",
      detail:
        snapshot.capitalControl.regionId === null
          ? "수도 기록 없음"
          : regionName(scenario, snapshot.capitalControl.regionId),
      passes: snapshot.capitalControl.passes,
    },
    {
      id: "coreTerritory",
      label: "핵심 영토",
      detail: `${snapshot.coreTerritory.controlledRegionIds.length}/${snapshot.coreTerritory.requiredRegionIds.length} 통제`,
      passes: snapshot.coreTerritory.passes,
    },
    {
      id: "stateCapacity",
      label: "국가역량",
      detail: `${formatAmount(snapshot.stateCapacity.actual ?? 0)} / ${formatAmount(snapshot.stateCapacity.minimum)}`,
      passes: snapshot.stateCapacity.passes,
    },
    {
      id: "treasury",
      label: "국고",
      detail: `${formatAmount(snapshot.treasury.actual ?? 0)} / ${formatAmount(snapshot.treasury.minimum)}`,
      passes: snapshot.treasury.passes,
    },
    {
      id: "noActiveCivilWar",
      label: "활성 내전 없음",
      detail:
        snapshot.activeCivilWar.activeConflictIds.length === 0
          ? "현재 없음"
          : `${snapshot.activeCivilWar.activeConflictIds.length}건 진행 중`,
      passes: snapshot.activeCivilWar.passes,
    },
  ];

  return (
    <section className="consolidation-box" aria-label="새 질서 정착 조건">
      <div className="panel-heading compact-heading">
        <div>
          <span className="eyebrow">장기 목표</span>
          <h2>새 질서 정착</h2>
        </div>
        <span className="derived-label">
          {snapshot.eligible ? "조건 충족" : "막힌 조건"}
        </span>
      </div>
      <p className="consolidation-intro">
        {countryLabel}의 현재 사실에서만 계산한 체크리스트입니다. 점수나 예측은
        사용하지 않습니다.
      </p>
      <ul className="consolidation-list">
        {rows.map((row) => (
          <li
            key={row.id}
            className={row.passes ? "criterion-pass" : "criterion-blocked"}
          >
            <span aria-hidden="true">{row.passes ? "✓" : "·"}</span>
            <strong>{row.label}</strong>
            <small>{row.detail}</small>
          </li>
        ))}
      </ul>
      {snapshot.failedCriteria.length === 0 ? (
        <p className="consolidation-progress">
          연속 유지 {snapshot.eligible ? "진행 중" : "대기"}
        </p>
      ) : (
        <p className="consolidation-progress" role="status">
          다음 blocker: {rows.find((row) => !row.passes)?.label ?? "조건"}
        </p>
      )}
    </section>
  );
}
