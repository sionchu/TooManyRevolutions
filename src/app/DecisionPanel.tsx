import { PLAYER_COPY } from "../presentation/design/copyRegistry.ko";
import { TMR_ICON_IDS } from "../presentation/design/iconRegistry";
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
import { TmrIcon } from "./icons/TmrIcon";

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
        현재 압력에 대응하는 정책과 행정 결정을 한 순서로 제시합니다. 확정
        변화가 먼저 보이고, 세부 조건은 선택해서 펼칠 수 있습니다.
      </p>
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
          <span className="eyebrow">현재 압력</span>
          <strong>지금 필요한 선택</strong>
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
      <details className="decision-project-details">
        <summary>
          <span className="decision-support-summary-label">
            <TmrIcon
              iconId={TMR_ICON_IDS.ui.details}
              size={16}
              decorative
              tone="neutral"
            />
            <span>국가 사업 기록</span>
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
    </aside>
  );
}
