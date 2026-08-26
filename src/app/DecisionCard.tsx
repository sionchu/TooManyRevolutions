import { PLAYER_COPY } from "../presentation/design/copyRegistry.ko";
import { TMR_ICON_IDS } from "../presentation/design/iconRegistry";
import type {
  InterventionDefinition,
  InterventionEffect,
  InterventionFeasibilityResult,
} from "../sim/state/intervention";
import type { PolicyState } from "../sim/state/policy";
import type { ScenarioDefinition } from "../sim/state/scenario";
import type { WorldState } from "../sim/state/world";
import type { PrimaryAgenda } from "../sim/readModels/agenda";
import type { RegionId } from "../sim/state/ids";
import {
  effectLabel,
  formatAmount,
  formatFailure,
  RULE_LABELS,
  RULE_VALUE_LABELS,
} from "./gamePresentation";
import { TmrIcon } from "./icons/TmrIcon";

function currentObservation(
  effect: InterventionEffect,
  world: WorldState,
  policyState: PolicyState | undefined,
): string {
  switch (effect.kind) {
    case "regionResourceProductionCapacityDelta": {
      const region = world.regions[effect.regionId];
      return region === undefined
        ? "현재 지역 기록을 읽을 수 없습니다."
        : `${region.name}: 희소성 ${formatAmount(region.scarcity)} · 불안 ${formatAmount(region.unrest)}`;
    }
    case "factionGrievanceDelta": {
      const faction = world.factions[effect.factionId];
      return faction === undefined
        ? "현재 세력 기록을 읽을 수 없습니다."
        : `${faction.name}: 불만 ${formatAmount(faction.grievance)} · 조직도 ${formatAmount(faction.organization)}`;
    }
    case "factionOrganizationDelta": {
      const faction = world.factions[effect.factionId];
      return faction === undefined
        ? "현재 세력 기록을 읽을 수 없습니다."
        : `${faction.name}: 조직도 ${formatAmount(faction.organization)} · 불만 ${formatAmount(faction.grievance)}`;
    }
    case "institutionalRuleSet": {
      const current = policyState?.institutionalRules[effect.rule];
      return `${RULE_LABELS[effect.rule] ?? "제도"}: ${RULE_VALUE_LABELS[String(current)] ?? String(current ?? "기록 없음")}`;
    }
  }
}

function observedTargets(
  definition: InterventionDefinition,
  world: WorldState,
  policyState: PolicyState | undefined,
): readonly string[] {
  return (definition.completionEffects ?? []).map((effect) =>
    currentObservation(effect, world, policyState),
  );
}

function effectSummaryLabel(effect: InterventionEffect): string {
  switch (effect.kind) {
    case "regionResourceProductionCapacityDelta":
      return "지역 생산능력 변화";
    case "factionGrievanceDelta":
      return "세력 불만 변화";
    case "factionOrganizationDelta":
      return "세력 조직 변화";
    case "institutionalRuleSet":
      return "제도 규칙 변화";
  }
}

export function DecisionCard({
  definition,
  whyNow,
  feasibility,
  scenario,
  world,
  agendas,
  onPreviewRegions,
  onClearPreview,
  onSubmit,
}: {
  readonly definition: InterventionDefinition;
  readonly whyNow: string;
  readonly feasibility: InterventionFeasibilityResult;
  readonly scenario: ScenarioDefinition;
  readonly world: WorldState;
  readonly agendas: readonly PrimaryAgenda[];
  readonly onPreviewRegions: (regionIds: readonly RegionId[]) => void;
  readonly onClearPreview: () => void;
  readonly onSubmit: (interventionId: InterventionDefinition["id"]) => void;
}) {
  const policyState =
    scenario.playerCountryId === null
      ? undefined
      : world.policies[scenario.playerCountryId];
  const effects = definition.completionEffects ?? [];
  const observations = observedTargets(definition, world, policyState);
  const firstAgenda = agendas[0];
  const adminRoom = feasibility.administrativeHeadroom;
  const affectedRegionIds = [
    ...new Set(
      effects.flatMap((effect) =>
        effect.kind === "regionResourceProductionCapacityDelta"
          ? [effect.regionId]
          : [],
      ),
    ),
    ...(firstAgenda?.affectedRegionIds ?? []),
  ];

  return (
    <article
      className={`action-card decision-card${feasibility.feasible ? " action-available" : " action-locked"}`}
      data-intervention-id={definition.id}
      onMouseEnter={() => onPreviewRegions(affectedRegionIds)}
      onMouseLeave={onClearPreview}
      onFocus={() => onPreviewRegions(affectedRegionIds)}
      onBlur={onClearPreview}
    >
      <div className="action-card-top">
        <span className="action-category">행정 결정</span>
        <span className="action-status">
          {feasibility.feasible ? "실행 가능" : "현재는 대기"}
        </span>
      </div>
      <h3>{definition.name}</h3>
      <p className="decision-why-now">{whyNow}</p>
      <div className="decision-summary">
        <span className="decision-badge badge-confirmed">결과를 관측</span>
        <span className="decision-badge badge-current">
          {effects[0] === undefined
            ? "확정 변화 없음"
            : effectSummaryLabel(effects[0])}
        </span>
        <span className="decision-badge badge-tradeoff">국고·행정 여력</span>
      </div>
      <details className="decision-details">
        <summary>
          <TmrIcon
            iconId={TMR_ICON_IDS.ui.why}
            size={16}
            decorative
            tone="accent"
          />
          <span>왜 그런가 · 세부 조건</span>
        </summary>
        <div className="decision-sections">
          <section className="decision-section decision-cost">
            <h4>{PLAYER_COPY.main.certainty} 비용</h4>
            <p>
              국고 <b>{formatAmount(definition.treasuryCost)}</b> · 행정 여력{" "}
              <b>{formatAmount(definition.administrativeLoad)}</b> · 기간{" "}
              <b>{definition.durationDays}일</b>
            </p>
          </section>
          <section className="decision-section decision-change">
            <h4>{PLAYER_COPY.main.certainty} 변화</h4>
            {effects.length === 0 ? (
              <p>선언된 완료 효과가 없습니다.</p>
            ) : (
              <ul>
                {effects.map((effect, index) => (
                  <li key={`${definition.id}-effect-${index}`}>
                    {effectLabel(effect, scenario)}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="decision-section decision-observation">
            <h4>{PLAYER_COPY.main.observation}</h4>
            {observations.length === 0 ? (
              <p>현재 대상에 대한 추가 관측이 없습니다.</p>
            ) : (
              <ul>
                {observations.map((observation, index) => (
                  <li key={`${definition.id}-observation-${index}`}>
                    {observation}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="decision-section decision-response">
            <h4>{PLAYER_COPY.main.uncertain}</h4>
            <p>선언된 효과 밖의 정치적 반응은 현재 상태에서 다시 관측합니다.</p>
          </section>
        </div>
        <div className="decision-tradeoffs">
          <div>
            <span>{PLAYER_COPY.main.opportunityCost}</span>
            <p>
              국고 {formatAmount(definition.treasuryCost)}와 행정 여력{" "}
              {formatAmount(definition.administrativeLoad)}을 이 선택에
              묶습니다.
              {adminRoom === null
                ? ""
                : ` 제출 후 남는 행정 여력은 ${formatAmount(Math.max(0, adminRoom - definition.administrativeLoad))}입니다.`}
            </p>
          </div>
          <div>
            <span>{PLAYER_COPY.main.waitingCost}</span>
            <p>
              {firstAgenda === undefined
                ? "현재 주요 의제가 없습니다. 다음 상태는 미리 약속하지 않습니다."
                : `${firstAgenda.title}의 ${firstAgenda.severityBand ?? "현재"} 압력이 관측됩니다. 시간을 보내면 조건이 달라질 수 있습니다.`}
            </p>
          </div>
        </div>
      </details>
      {feasibility.feasible ? (
        <button
          className="action-button"
          type="button"
          onClick={() => onSubmit(definition.id)}
        >
          <TmrIcon
            className="action-button-icon"
            iconId={TMR_ICON_IDS.ui.decision}
            size={20}
            decorative
            tone="accent"
          />
          <span>이 선택을 실행</span>
        </button>
      ) : (
        <p className="locked-reason" role="status">
          {feasibility.reasons.map(formatFailure).join(" · ")}
        </p>
      )}
    </article>
  );
}
