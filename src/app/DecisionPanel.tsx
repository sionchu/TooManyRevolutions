import { PLAYER_COPY } from "../presentation/design/copyRegistry.ko";
import { TMR_ICON_IDS } from "../presentation/design/iconRegistry";
import { deriveRegimeClassification } from "../sim/state/government";
import type { InterventionDefinition } from "../sim/state/intervention";
import type { PolicyState } from "../sim/state/policy";
import type { PolicyDefinition } from "../sim/state/policy";
import type { ScenarioDefinition } from "../sim/state/scenario";
import type { WorldState } from "../sim/state/world";
import type { RegionId } from "../sim/state/ids";
import type { PrimaryAgenda } from "../sim/readModels/agenda";
import type { ContextualDecisionCandidate } from "../sim/readModels/contextualDecisions";
import { DecisionCard } from "./DecisionCard";
import { PolicyCard } from "./PolicyCard";
import { StateProjectPanel } from "./StateProjectPanel";
import type { StateProjectPresentation } from "./stateProjects";
import {
  REGIME_LABELS,
  RULE_LABELS,
  RULE_VALUE_LABELS,
} from "./gamePresentation";
import { TmrIcon } from "./icons/TmrIcon";

function whyNowFor(candidate: ContextualDecisionCandidate): string {
  const reason = candidate.relevanceReasons[0]?.code;
  switch (reason) {
    case "MATERIAL_SCARCITY":
      return "물자 부족이 커져 지금 생산과 공급을 건드려야 합니다.";
    case "LABOR_ORGANIZATION_PRESSURE":
      return "노동 세력의 압력이 올라 지금 공개적인 타협 창구가 필요합니다.";
    case "POLITICAL_OPPOSITION_PRESSURE":
      return "정치적 반대가 조직되고 있어 권력 경쟁의 규칙을 정해야 합니다.";
    case "ACTIVE_REBELLION_RECOVERY":
      return "현재 충돌의 여파가 남아 먼저 회복의 방향을 선택해야 합니다.";
    case "INSTITUTIONAL_CONTRADICTION":
      return "현재 제도 사이의 모순이 드러나 다음 규칙을 정리해야 합니다.";
    case "PROPERTY_LAND_ORDER":
      return "재산·토지 질서가 흔들려 지금 소유 규칙을 선택해야 합니다.";
    case "COERCIVE_RESPONSE_WINDOW":
      return "통제 창구가 열려 있지만, 억압의 대가도 함께 감수해야 합니다.";
    case "FISCAL_PRESSURE":
      return "국고 압박이 커져 이 선택의 비용과 대안을 함께 봐야 합니다.";
    case "BACKGROUND_STRUCTURAL_OPTION":
      return "당장의 불보다 다음 정치 질서를 준비하는 선택입니다.";
    default:
      return candidate.tier === "crisis"
        ? "지금 벌어진 위기에 직접 반응합니다."
        : "현재 국가 조건에서 열려 있는 선택입니다.";
  }
}

export function DecisionPanel({
  primaryShortlist,
  agendas,
  scenario,
  world,
  policyState,
  projects,
  onFocusProject,
  policyRegionIds,
  onPreviewRegions,
  onClearPreview,
  onSubmit,
  onSubmitPolicy,
}: {
  readonly primaryShortlist: readonly ContextualDecisionCandidate[];
  readonly agendas: readonly PrimaryAgenda[];
  readonly scenario: ScenarioDefinition;
  readonly world: WorldState;
  readonly policyState: PolicyState | undefined;
  readonly projects: readonly StateProjectPresentation[];
  readonly onFocusProject: (
    regionId: StateProjectPresentation["anchorRegionId"],
  ) => void;
  readonly policyRegionIds: readonly RegionId[];
  readonly onPreviewRegions: (regionIds: readonly RegionId[]) => void;
  readonly onClearPreview: () => void;
  readonly onSubmit: (interventionId: InterventionDefinition["id"]) => void;
  readonly onSubmitPolicy: (policyId: PolicyDefinition["id"]) => void;
}) {
  const regime =
    policyState === undefined ? null : deriveRegimeClassification(policyState);
  const availableCount = primaryShortlist.filter(
    (candidate) => candidate.availability === "AVAILABLE",
  ).length;

  return (
    <aside className="panel actions-panel">
      <div className="panel-heading">
        <div className="panel-heading-title">
          <TmrIcon
            iconId={TMR_ICON_IDS.ui.decision}
            size={20}
            decorative
            tone="neutral"
          />
          <div>
            <span className="eyebrow">{PLAYER_COPY.main.actionsEyebrow}</span>
            <h2>{PLAYER_COPY.main.actionsTitle}</h2>
          </div>
        </div>
        <span className="panel-count">{availableCount}개 가능</span>
      </div>
      <p className="panel-intro">
        현재 압력과 위기에 맞는 정책·개입을 한 순서로 제시합니다. 카드는 확정
        변화만 먼저 보여주고, 세부 조건은 접어 둡니다.
      </p>
      <details className="decision-support-details">
        <summary>
          <span className="decision-support-summary-label">
            <TmrIcon
              iconId={TMR_ICON_IDS.ui.details}
              size={16}
              decorative
              tone="neutral"
            />
            <span>지도에 남는 사업 기록</span>
          </span>
          <span className="decision-support-summary-meta">선택 사항</span>
        </summary>
        <div className="decision-support-content">
          <StateProjectPanel
            projects={projects}
            onFocusRegion={onFocusProject}
          />
        </div>
      </details>
      <div
        className="decision-group"
        data-contextual-shortlist-count={primaryShortlist.length}
        data-contextual-shortlist-order={primaryShortlist
          .map((candidate) => `${candidate.kind}:${candidate.id}`)
          .join(",")}
      >
        <div className="decision-group-heading">
          <TmrIcon
            className="decision-heading-icon"
            iconId={TMR_ICON_IDS.politics.parliament}
            size={20}
            decorative
            tone="neutral"
          />
          <span className="eyebrow">상황별 우선순위</span>
          <strong>지금 결정할 일</strong>
        </div>
        <div className="action-list">
          {primaryShortlist.map((candidate) =>
            candidate.kind === "policy" ? (
              policyState === undefined ? null : (
                <PolicyCard
                  key={`policy:${candidate.id}`}
                  definition={candidate.definition}
                  whyNow={whyNowFor(candidate)}
                  availability={candidate.feasibility}
                  policyState={policyState}
                  affectedRegionIds={
                    candidate.affectedRegionIds.length > 0
                      ? candidate.affectedRegionIds
                      : policyRegionIds
                  }
                  onPreviewRegions={onPreviewRegions}
                  onClearPreview={onClearPreview}
                  onSubmit={onSubmitPolicy}
                />
              )
            ) : (
              <DecisionCard
                key={`intervention:${candidate.id}`}
                definition={candidate.definition}
                whyNow={whyNowFor(candidate)}
                feasibility={candidate.feasibility}
                scenario={scenario}
                world={world}
                agendas={agendas}
                onPreviewRegions={onPreviewRegions}
                onClearPreview={onClearPreview}
                onSubmit={onSubmit}
              />
            ),
          )}
        </div>
      </div>
      <div className="institution-box">
        <div className="panel-heading compact-heading">
          <div className="panel-heading-title">
            <TmrIcon
              iconId={TMR_ICON_IDS.ui.governance}
              size={20}
              decorative
              tone="neutral"
            />
            <h2>현재 제도</h2>
          </div>
          {regime ? (
            <span className="derived-label">
              현재 읽기 · {REGIME_LABELS[regime.classification]}
            </span>
          ) : null}
        </div>
        <details className="institution-details">
          <summary>
            <TmrIcon
              iconId={TMR_ICON_IDS.ui.details}
              size={16}
              decorative
              tone="neutral"
            />
            <span>현재 규칙 자세히 보기</span>
          </summary>
          <div className="rule-list">
            {policyState === undefined
              ? null
              : Object.entries(policyState.institutionalRules).map(
                  ([rule, value]) => (
                    <div key={rule}>
                      <span>{RULE_LABELS[rule] ?? "제도"}</span>
                      <b>{RULE_VALUE_LABELS[String(value)] ?? String(value)}</b>
                    </div>
                  ),
                )}
          </div>
        </details>
      </div>
    </aside>
  );
}
