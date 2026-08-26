import { PLAYER_COPY } from "../presentation/design/copyRegistry.ko";
import { deriveRegimeClassification } from "../sim/state/government";
import type {
  InterventionDefinition,
  InterventionFeasibilityResult,
} from "../sim/state/intervention";
import type { PolicyState } from "../sim/state/policy";
import {
  type PolicyAvailabilityResult,
  type PolicyDefinition,
} from "../sim/state/policy";
import type { ScenarioDefinition } from "../sim/state/scenario";
import type { WorldState } from "../sim/state/world";
import type { RegionId } from "../sim/state/ids";
import type { PrimaryAgenda } from "../sim/readModels/agenda";
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

export interface DecisionCandidate {
  readonly definition: InterventionDefinition;
  readonly feasibility: InterventionFeasibilityResult;
}

export interface PolicyCandidate {
  readonly definition: PolicyDefinition;
  readonly availability: PolicyAvailabilityResult;
}

export function DecisionPanel({
  candidates,
  agendas,
  scenario,
  world,
  policyState,
  policyCandidates,
  roadmap,
  projects,
  onFocusProject,
  policyRegionIds,
  onPreviewRegions,
  onClearPreview,
  onSubmit,
  onSubmitPolicy,
}: {
  readonly candidates: readonly DecisionCandidate[];
  readonly agendas: readonly PrimaryAgenda[];
  readonly scenario: ScenarioDefinition;
  readonly world: WorldState;
  readonly policyState: PolicyState | undefined;
  readonly policyCandidates: readonly PolicyCandidate[];
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
  const availableCount =
    candidates.filter((candidate) => candidate.feasibility.feasible).length +
    policyCandidates.filter((candidate) => candidate.availability.feasible)
      .length;

  return (
    <aside className="panel actions-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{PLAYER_COPY.main.actionsEyebrow}</span>
          <h2>{PLAYER_COPY.main.actionsTitle}</h2>
        </div>
        <span className="panel-count">{availableCount}개 가능</span>
      </div>
      <p className="panel-intro">
        정책과 개입은 공통 action pipeline으로 다음 tick에 반영됩니다. 카드는
        확정 변화만 먼저 보여주고, 세부 조건은 접어 둡니다.
      </p>
      <InstitutionalRoadmapPanel roadmap={roadmap} />
      <StateProjectPanel projects={projects} onFocusRegion={onFocusProject} />
      <div className="decision-group">
        <div className="decision-group-heading">
          <span className="eyebrow">법과 제도</span>
          <strong>실제 정책</strong>
        </div>
        <div className="action-list">
          {policyState === undefined
            ? null
            : policyCandidates.map(({ definition, availability }) => (
                <PolicyCard
                  key={definition.id}
                  definition={definition}
                  availability={availability}
                  policyState={policyState}
                  affectedRegionIds={policyRegionIds}
                  onPreviewRegions={onPreviewRegions}
                  onClearPreview={onClearPreview}
                  onSubmit={onSubmitPolicy}
                />
              ))}
        </div>
      </div>
      <div className="decision-group">
        <div className="decision-group-heading">
          <span className="eyebrow">국가 집행</span>
          <strong>행정 개입</strong>
        </div>
        <div className="action-list">
          {candidates.map(({ definition, feasibility }) => (
            <DecisionCard
              key={definition.id}
              definition={definition}
              feasibility={feasibility}
              scenario={scenario}
              world={world}
              agendas={agendas}
              onPreviewRegions={onPreviewRegions}
              onClearPreview={onClearPreview}
              onSubmit={onSubmit}
            />
          ))}
        </div>
      </div>
      <div className="institution-box">
        <div className="panel-heading compact-heading">
          <h2>현재 제도</h2>
          {regime ? (
            <span className="derived-label">
              현재 읽기 · {REGIME_LABELS[regime.classification]}
            </span>
          ) : null}
        </div>
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
      </div>
    </aside>
  );
}
