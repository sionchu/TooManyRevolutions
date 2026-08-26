import { PLAYER_COPY } from "../presentation/design/copyRegistry.ko";
import { TMR_ICON_IDS } from "../presentation/design/iconRegistry";
import type {
  PrimaryAgenda,
  AgendaSeverityBand,
} from "../sim/readModels/agenda";
import type { RegionId } from "../sim/state/ids";
import type { ScenarioDefinition } from "../sim/state/scenario";
import { formatAmount } from "./gamePresentation";
import { ConsolidationChecklist } from "./ConsolidationChecklist";
import { TmrIcon } from "./icons/TmrIcon";
import type { OrderConsolidationEligibilitySnapshot } from "../sim/systems/orderConsolidation";

const SEVERITY_LABELS: Readonly<Record<AgendaSeverityBand, string>> = {
  low: "낮음",
  medium: "중간",
  high: "높음",
  critical: "임계",
};

function trendLabel(trend: PrimaryAgenda["trend"]): string {
  switch (trend) {
    case "rising":
      return "상승 중";
    case "falling":
      return "완화 중";
    case "stable":
      return "혼조";
    case "unknown":
      return "추세 미확인";
  }
}

function AgendaCard({
  agenda,
  scenario,
  onFocusRegion,
}: {
  readonly agenda: PrimaryAgenda;
  readonly scenario: ScenarioDefinition;
  readonly onFocusRegion?: (regionId: RegionId) => void;
}) {
  const regionNames = new Map(
    scenario.initialRegions.map((region) => [region.id, region.name]),
  );
  const factionNames = new Map(
    scenario.initialFactions.map((faction) => [faction.id, faction.name]),
  );
  const severity = agenda.severityBand ?? "low";
  const focusRegionId = agenda.affectedRegionIds[0];

  return (
    <article className={`agenda-card severity-${severity}`}>
      <div className="agenda-card-head">
        <span className="agenda-kind">{SEVERITY_LABELS[severity]}</span>
        <span className="agenda-trend">{trendLabel(agenda.trend)}</span>
      </div>
      <h3>{agenda.title}</h3>
      <p className="agenda-meta">
        {agenda.affectedRegionIds
          .map((id) => regionNames.get(id) ?? "지역")
          .join(" · ") || "전국"}
        {agenda.involvedFactionIds.length > 0
          ? ` · ${agenda.involvedFactionIds.map((id) => factionNames.get(id) ?? "세력").join(" · ")}`
          : ""}
      </p>
      {focusRegionId === undefined ? null : (
        <button
          className="agenda-focus-button"
          type="button"
          onClick={() => onFocusRegion?.(focusRegionId)}
        >
          <TmrIcon
            className="agenda-focus-icon"
            iconId={TMR_ICON_IDS.ui.map}
            size={16}
            decorative
            tone="accent"
          />
          <span>지도에서 보기</span>
        </button>
      )}
      <ul className="cause-list">
        {agenda.keyCauses.slice(0, 3).map((cause) => (
          <li key={cause.key}>
            <span>{cause.label}</span>
            {cause.value === undefined ? null : (
              <b>{formatAmount(cause.value)}</b>
            )}
          </li>
        ))}
      </ul>
    </article>
  );
}

export function AgendaPanel({
  agendas,
  scenario,
  consolidation,
  onFocusRegion,
}: {
  readonly agendas: readonly PrimaryAgenda[];
  readonly scenario: ScenarioDefinition;
  readonly consolidation: OrderConsolidationEligibilitySnapshot;
  readonly onFocusRegion?: (regionId: RegionId) => void;
}) {
  return (
    <aside className="panel agenda-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{PLAYER_COPY.main.agendasEyebrow}</span>
          <h2>{PLAYER_COPY.main.agendasTitle}</h2>
        </div>
        <span className="panel-count">{agendas.length}/4</span>
      </div>
      <p className="panel-intro">현재 조건에서 감지된 압력만 표시합니다.</p>
      <div className="agenda-list">
        {agendas.length === 0 ? (
          <p className="empty-state">지금은 감지된 주요 의제가 없습니다.</p>
        ) : (
          agendas.map((agenda) => (
            <AgendaCard
              key={agenda.id}
              agenda={agenda}
              scenario={scenario}
              onFocusRegion={onFocusRegion}
            />
          ))
        )}
      </div>
      <ConsolidationChecklist snapshot={consolidation} scenario={scenario} />
      <div className="thesis-note">
        <span className="eyebrow">플레이 원칙</span>
        <p>
          정권이 바뀌어도 국가의 역사는 계속됩니다. 먼저 무엇이 흔들리는지
          읽으세요.
        </p>
      </div>
    </aside>
  );
}
