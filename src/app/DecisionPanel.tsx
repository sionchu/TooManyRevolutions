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
import { InstitutionalRoadmapPanel } from "./InstitutionalRoadmapPanel";
import type { InstitutionalRoadmap } from "./institutionalRoadmap";
import { StateProjectPanel } from "./StateProjectPanel";
import type { StateProjectPresentation } from "./stateProjects";
import {
  REGIME_LABELS,
  RULE_LABELS,
  RULE_VALUE_LABELS,
} from "./gamePresentation";
import { TmrIcon } from "./icons/TmrIcon";

export function DecisionPanel({
  primaryShortlist,
  agendas,
  scenario,
  world,
  policyState,
  roadmap,
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
  readonly roadmap: InstitutionalRoadmap;
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
            <span>중기 계획·사업 기록</span>
          </span>
          <span className="decision-support-summary-meta">선택 사항</span>
        </summary>
        <div className="decision-support-content">
          <InstitutionalRoadmapPanel roadmap={roadmap} />
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
