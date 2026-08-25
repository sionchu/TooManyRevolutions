import { PLAYER_COPY } from "../presentation/design/copyRegistry.ko";
import { deriveRegimeClassification } from "../sim/state/government";
import type {
  InterventionDefinition,
  InterventionFeasibilityResult,
} from "../sim/state/intervention";
import type { PolicyState } from "../sim/state/policy";
import type { ScenarioDefinition } from "../sim/state/scenario";
import type { WorldState } from "../sim/state/world";
import type { PrimaryAgenda } from "../sim/readModels/agenda";
import { DecisionCard } from "./DecisionCard";
import {
  REGIME_LABELS,
  RULE_LABELS,
  RULE_VALUE_LABELS,
} from "./gamePresentation";

export interface DecisionCandidate {
  readonly definition: InterventionDefinition;
  readonly feasibility: InterventionFeasibilityResult;
}

export function DecisionPanel({
  candidates,
  agendas,
  scenario,
  world,
  policyState,
  onSubmit,
}: {
  readonly candidates: readonly DecisionCandidate[];
  readonly agendas: readonly PrimaryAgenda[];
  readonly scenario: ScenarioDefinition;
  readonly world: WorldState;
  readonly policyState: PolicyState | undefined;
  readonly onSubmit: (interventionId: InterventionDefinition["id"]) => void;
}) {
  const regime =
    policyState === undefined ? null : deriveRegimeClassification(policyState);
  const availableCount = candidates.filter(
    (candidate) => candidate.feasibility.feasible,
  ).length;

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
        각 카드는 확정 비용과 확정 효과를 먼저 보여줍니다. 외부 반응은 현재 국가
        기록에서 다시 읽습니다.
      </p>
      <div className="action-list">
        {candidates.map(({ definition, feasibility }) => (
          <DecisionCard
            key={definition.id}
            definition={definition}
            feasibility={feasibility}
            scenario={scenario}
            world={world}
            agendas={agendas}
            onSubmit={onSubmit}
          />
        ))}
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
