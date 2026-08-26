import type { PresentationRegion } from "../presentation/presentationState";
import { TMR_ICON_IDS } from "../presentation/design/iconRegistry";
import type { ScenarioDefinition } from "../sim/state/scenario";
import { countryName, formatAmount } from "./gamePresentation";
import { TmrIcon } from "./icons/TmrIcon";

function controllerLabel(kind: PresentationRegion["control"]["kind"]): string {
  switch (kind) {
    case "fullyControlled":
      return "단일 국가 통제";
    case "partial":
      return "부분 통제";
    case "contested":
      return "경합 중";
    case "factionPresence":
      return "세력 존재";
    case "uncontrolled":
      return "통제 공백";
  }
}

export function RegionInspector({
  region,
  scenario,
}: {
  readonly region: PresentationRegion | null;
  readonly scenario: ScenarioDefinition;
}) {
  if (region === null) {
    return <p className="muted">지도를 클릭하면 지역 정보가 나타납니다.</p>;
  }

  return (
    <div className="region-inspector" aria-live="polite">
      <div className="inspector-title">
        <div className="inspector-heading-row">
          <TmrIcon
            iconId={TMR_ICON_IDS.ui.details}
            size={20}
            decorative
            tone="neutral"
          />
          <div>
            <span className="eyebrow">선택 지역</span>
            <h3>{region.name}</h3>
          </div>
        </div>
        <p className="inspector-owner">
          소유: {countryName(scenario, region.ownerCountryId)} · 물리 통제:{" "}
          {controllerLabel(region.control.kind)}
        </p>
      </div>
      <div className="region-stats">
        <span>
          <b>불안</b>
          {formatAmount(region.unrest)}
        </span>
        <span>
          <b>희소성</b>
          {formatAmount(region.scarcity)}
        </span>
        <span>
          <b>통제 중인 칸</b>
          {region.control.landHexCount -
            region.control.uncontrolledLandHexCount}
          /{region.control.landHexCount}
        </span>
      </div>
      <div className="ideology-list">
        {region.politicalInfluence.slice(0, 3).map((ideology) => (
          <div key={ideology.ideologyId}>
            <span>
              {scenario.ideologyCatalog[ideology.ideologyId]?.name ??
                "정치 흐름"}
            </span>
            <small>
              지지 {formatAmount(ideology.support)} · 조직{" "}
              {formatAmount(ideology.organization)}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}
