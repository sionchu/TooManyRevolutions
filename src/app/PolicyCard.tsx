import type {
  PolicyAvailabilityFailure,
  PolicyAvailabilityResult,
  PolicyDefinition,
  PolicyState,
} from "../sim/state/policy";
import {
  TMR_ICON_IDS,
  type TmrIconId,
} from "../presentation/design/iconRegistry";
import type { RegionId } from "../sim/state/ids";
import { RULE_LABELS, RULE_VALUE_LABELS } from "./gamePresentation";
import { TmrIcon } from "./icons/TmrIcon";

function failureLabel(reason: PolicyAvailabilityFailure): string {
  switch (reason) {
    case "ALREADY_ACTIVE":
      return "이미 시행 중";
    case "PREREQUISITE_NOT_MET":
      return "선행 조건 미충족";
    case "INCOMPATIBLE_POLICY":
      return "현재 제도와 충돌";
  }
}

function policyChangeLabel(definition: PolicyDefinition): readonly string[] {
  return Object.entries(definition.ruleMutations).map(
    ([rule, value]) =>
      `${RULE_LABELS[rule] ?? "제도"} → ${RULE_VALUE_LABELS[String(value)] ?? String(value)}`,
  );
}

export function policyIconId(definition: PolicyDefinition): TmrIconId {
  const mutationRules = Object.keys(definition.ruleMutations);
  if (mutationRules.includes("rulerVeto")) {
    return TMR_ICON_IDS.politics.veto;
  }
  if (mutationRules.includes("suffrage")) {
    return TMR_ICON_IDS.politics.suffrage;
  }
  if (
    mutationRules.includes("productiveProperty") ||
    mutationRules.includes("landOwnership")
  ) {
    return TMR_ICON_IDS.politics.property;
  }
  return TMR_ICON_IDS.politics.parliament;
}

export function PolicyCard({
  definition,
  availability,
  policyState,
  affectedRegionIds,
  onPreviewRegions,
  onClearPreview,
  onSubmit,
}: {
  readonly definition: PolicyDefinition;
  readonly availability: PolicyAvailabilityResult;
  readonly policyState: PolicyState;
  readonly affectedRegionIds: readonly RegionId[];
  readonly onPreviewRegions: (regionIds: readonly RegionId[]) => void;
  readonly onClearPreview: () => void;
  readonly onSubmit: (policyId: PolicyDefinition["id"]) => void;
}) {
  const changes = policyChangeLabel(definition);
  const iconId = policyIconId(definition);
  const status = availability.feasible ? "확정 가능" : "현재 보류";

  return (
    <article
      className={`action-card policy-card${availability.feasible ? " action-available" : " action-locked"}`}
      data-policy-id={definition.id}
      onMouseEnter={() => onPreviewRegions(affectedRegionIds)}
      onMouseLeave={onClearPreview}
      onFocus={() => onPreviewRegions(affectedRegionIds)}
      onBlur={onClearPreview}
    >
      <div className="action-card-top">
        <span className="action-category">실제 정책</span>
        <span className="action-status">{status}</span>
      </div>
      <h3>{definition.name}</h3>
      <div className="decision-summary">
        <span className="decision-badge badge-confirmed">제도 변경</span>
        <span className="decision-badge badge-current">
          {changes[0] ?? "규칙 기록"}
        </span>
      </div>
      <details className="decision-details">
        <summary>
          <TmrIcon
            iconId={TMR_ICON_IDS.ui.why}
            size={16}
            decorative
            tone="accent"
          />
          <span>왜 그런가 · 변화 보기</span>
        </summary>
        <div className="decision-sections">
          <section className="decision-section decision-change">
            <h4>확정 변화</h4>
            <p>{changes.join(" · ") || "선언된 규칙 변화 없음"}</p>
          </section>
          <section className="decision-section decision-observation">
            <h4>현재 제도</h4>
            <p>
              시행 중 {policyState.activePolicyIds.length}개 · 제출하면 다음
              authoritative tick에서 판정합니다.
            </p>
          </section>
          <section className="decision-section decision-response">
            <h4>반응은 미확정</h4>
            <p>{definition.description}</p>
          </section>
        </div>
      </details>
      {availability.feasible ? (
        <button
          className="action-button"
          type="button"
          onClick={() => onSubmit(definition.id)}
        >
          <TmrIcon
            className="action-button-icon"
            iconId={iconId}
            size={20}
            decorative
            tone="accent"
          />
          <span>이 정책을 시행</span>
        </button>
      ) : (
        <p className="locked-reason" role="status">
          {availability.reasons.map(failureLabel).join(" · ")}
        </p>
      )}
    </article>
  );
}
