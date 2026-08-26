import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TMR_ICON_IDS } from "../presentation/design/iconRegistry";
import { derivePresentationState } from "../presentation/presentationState";
import { createGameEvent, type GameEvent } from "../sim/events/event";
import {
  deriveNationalAgendas,
  type PrimaryAgenda,
} from "../sim/readModels/agenda";
import { GAMEBUILDERS_DEMO_SCENARIO } from "../sim/state/gameBuildersDemoScenario";
import { createInitialWorldState } from "../sim/state/world";
import { deriveOrderConsolidationEligibility } from "../sim/systems/orderConsolidation";
import { AgendaPanel } from "./AgendaPanel";
import { ChroniclePanel } from "./ChroniclePanel";
import { ContextualDock } from "./ContextualDock";
import { CrisisBanner } from "./CrisisBanner";
import { DecisionCard } from "./DecisionCard";
import { DecisionPanel } from "./DecisionPanel";
import { deriveChronicleDigest } from "./chronicleDigest";
import { policyIconId, PolicyCard } from "./PolicyCard";
import { RegionInspector } from "./RegionInspector";

function event(type: GameEvent["type"]): GameEvent {
  return createGameEvent({
    tick: 4,
    sequence: 0,
    type,
    causeIds: [],
    payload: {},
    visibility: "important",
  });
}

describe("player-facing TMR icon integration", () => {
  it("renders the four contextual tabs with labels and stable icon IDs", () => {
    const markup = renderToStaticMarkup(
      <ContextualDock
        activePanel="map"
        onSelectPanel={() => undefined}
        onClose={() => undefined}
      />,
    );

    expect(markup).toContain('data-icon-id="tmr.icon.ui.map"');
    expect(markup).toContain('data-icon-id="tmr.icon.ui.governance"');
    expect(markup).toContain('data-icon-id="tmr.icon.ui.decision"');
    expect(markup).toContain('data-icon-id="tmr.icon.ui.chronicle"');
    expect(markup).toContain(">지도<");
    expect(markup).toContain(">제도<");
    expect(markup).toContain(">결정<");
    expect(markup).toContain(">연대기<");
  });

  it("uses the actual crisis event silhouette in the banner and chronicle row", () => {
    const crisisEvent = event("CIVIL_WAR_STARTED");
    const banner = renderToStaticMarkup(
      <CrisisBanner
        event={crisisEvent}
        activeConflicts={[]}
        scenario={GAMEBUILDERS_DEMO_SCENARIO}
      />,
    );
    const digest = deriveChronicleDigest(
      [crisisEvent],
      GAMEBUILDERS_DEMO_SCENARIO,
    );
    const chronicle = renderToStaticMarkup(
      <ChroniclePanel
        events={[crisisEvent]}
        digest={digest}
        scenario={GAMEBUILDERS_DEMO_SCENARIO}
      />,
    );

    expect(banner).toContain(
      'data-crisis-icon-id="tmr.icon.crisis.civil-conflict"',
    );
    expect(banner).toContain('data-icon-tone="crisis"');
    expect(chronicle).toContain(
      'data-icon-id="tmr.icon.crisis.civil-conflict"',
    );
    expect(chronicle).toContain("내전 시작");
  });

  it("keeps navigation/action labels alongside icons across panels and cards", () => {
    const scenario = GAMEBUILDERS_DEMO_SCENARIO;
    const world = createInitialWorldState(scenario, 1);
    const countryId = scenario.playerCountryId;
    if (countryId === null)
      throw new Error("Demo scenario needs a player country.");
    const regionId = scenario.initialRegions[0]?.id;
    const intervention = Object.values(scenario.interventionCatalog)[0];
    const policy = Object.values(scenario.policyCatalog)[0];
    if (
      regionId === undefined ||
      intervention === undefined ||
      policy === undefined
    ) {
      throw new Error("Demo scenario needs component fixtures.");
    }

    const agenda: PrimaryAgenda = {
      id: "icon-integration-agenda",
      kind: "fiscalPressure",
      title: "아이콘 통합용 의제",
      affectedRegionIds: [regionId],
      severity: 0.5,
      severityBand: "medium",
      trend: "stable",
      keyCauses: [],
      involvedFactionIds: [],
      interventionCategories: ["treasury"],
      causeEventIds: [],
    };
    const consolidation = deriveOrderConsolidationEligibility(scenario, world);
    const markup = renderToStaticMarkup(
      <>
        <AgendaPanel
          agendas={[agenda]}
          scenario={scenario}
          consolidation={consolidation}
          onFocusRegion={() => undefined}
        />
        <DecisionCard
          definition={intervention}
          feasibility={{
            feasible: true,
            interventionId: intervention.id,
            countryId,
            definition: intervention,
            treasuryAvailable: 100,
            committedAdministrativeLoad: 0,
            administrativeHeadroom: 100,
            reasons: [],
          }}
          scenario={scenario}
          world={world}
          agendas={deriveNationalAgendas({ scenario, world })}
          whyNow="현재 상황에서 선택할 수 있는 행동입니다."
          onPreviewRegions={() => undefined}
          onClearPreview={() => undefined}
          onSubmit={() => undefined}
        />
        <PolicyCard
          definition={policy}
          availability={{ feasible: true, reasons: [] }}
          policyState={world.policies[countryId]!}
          affectedRegionIds={[]}
          whyNow="현재 상황에서 선택할 수 있는 정책입니다."
          onPreviewRegions={() => undefined}
          onClearPreview={() => undefined}
          onSubmit={() => undefined}
        />
      </>,
    );

    expect(markup).toContain('data-icon-id="tmr.icon.ui.map"');
    expect(markup).toContain('data-icon-id="tmr.icon.ui.decision"');
    expect(markup).toContain('data-icon-id="tmr.icon.politics.veto"');
    expect(markup).toContain("지도에서 보기");
    expect(markup).toContain("이 선택을 실행");
    expect(markup).toContain("이 정책을 시행");
    expect(markup).not.toContain("↗");
  });

  it("renders decision and region heading companions without removing text", () => {
    const scenario = GAMEBUILDERS_DEMO_SCENARIO;
    const world = createInitialWorldState(scenario, 1);
    const countryId = scenario.playerCountryId;
    if (countryId === null)
      throw new Error("Demo scenario needs a player country.");
    const presentation = derivePresentationState(scenario, world);
    const region = presentation.regions[0] ?? null;
    const markup = renderToStaticMarkup(
      <>
        <DecisionPanel
          primaryShortlist={[]}
          agendas={[]}
          scenario={scenario}
          world={world}
          policyState={world.policies[countryId]}
          projects={[]}
          onFocusProject={() => undefined}
          policyRegionIds={[]}
          onPreviewRegions={() => undefined}
          onClearPreview={() => undefined}
          onSubmit={() => undefined}
          onSubmitPolicy={() => undefined}
        />
        {region === null ? null : (
          <RegionInspector region={region} scenario={scenario} />
        )}
      </>,
    );

    expect(markup).toContain('data-icon-id="tmr.icon.ui.decision"');
    expect(markup).toContain('data-icon-id="tmr.icon.politics.parliament"');
    expect(markup).toContain('data-icon-id="tmr.icon.ui.governance"');
    expect(markup).toContain('data-icon-id="tmr.icon.ui.details"');
    expect(markup).toContain("상황별 우선순위");
    expect(markup).toContain("지금 결정할 일");
    expect(markup).toContain("현재 제도");
  });

  it("selects policy icons from mutation semantics with a parliament fallback", () => {
    const policies = Object.values(GAMEBUILDERS_DEMO_SCENARIO.policyCatalog);
    const veto = policies.find((definition) =>
      Object.hasOwn(definition.ruleMutations, "rulerVeto"),
    );
    const suffrage = policies.find((definition) =>
      Object.hasOwn(definition.ruleMutations, "suffrage"),
    );
    const property = policies.find((definition) =>
      Object.hasOwn(definition.ruleMutations, "productiveProperty"),
    );
    if (
      veto === undefined ||
      suffrage === undefined ||
      property === undefined
    ) {
      throw new Error("Demo scenario needs policy mutation fixtures.");
    }

    expect(policyIconId(veto)).toBe(TMR_ICON_IDS.politics.veto);
    expect(policyIconId(suffrage)).toBe(TMR_ICON_IDS.politics.suffrage);
    expect(policyIconId(property)).toBe(TMR_ICON_IDS.politics.property);
    expect(
      policyIconId({
        ...property,
        ruleMutations: { legislatureRequired: true },
      }),
    ).toBe(TMR_ICON_IDS.politics.parliament);
  });

  it("keeps exact agenda and intervention evidence behind collapsed why details", () => {
    const scenario = GAMEBUILDERS_DEMO_SCENARIO;
    const world = createInitialWorldState(scenario, 1);
    const countryId = scenario.playerCountryId;
    const regionId = scenario.initialRegions[0]?.id;
    const intervention = Object.values(scenario.interventionCatalog)[0];
    if (
      countryId === null ||
      regionId === undefined ||
      intervention === undefined
    ) {
      throw new Error("Demo scenario needs UI polish fixtures.");
    }

    const agenda: PrimaryAgenda = {
      id: "ui-polish-agenda",
      kind: "fiscalPressure",
      title: "UI 밀도 확인용 의제",
      affectedRegionIds: [regionId],
      severity: 0.7,
      severityBand: "high",
      trend: "rising",
      keyCauses: [
        { key: "grievance", label: "세력 불만", value: 0.6 },
        { key: "organization", label: "조직 역량", value: 0.4 },
      ],
      involvedFactionIds: [],
      interventionCategories: ["treasury"],
      causeEventIds: [],
    };
    const agendaMarkup = renderToStaticMarkup(
      <AgendaPanel
        agendas={[agenda]}
        scenario={scenario}
        consolidation={deriveOrderConsolidationEligibility(scenario, world)}
      />,
    );
    const agendaSummary = agendaMarkup.match(
      /<details class="agenda-why"><summary>([\s\S]*?)<\/summary>/,
    )?.[1];
    expect(agendaSummary).toContain("왜 그런가");
    expect(agendaSummary).not.toContain("0.6");
    expect(agendaMarkup).toContain("0.6");
    expect(agendaMarkup).toContain('class="agenda-support-details"');

    const decisionMarkup = renderToStaticMarkup(
      <DecisionCard
        definition={intervention}
        feasibility={{
          feasible: true,
          interventionId: intervention.id,
          countryId,
          definition: intervention,
          treasuryAvailable: 100,
          committedAdministrativeLoad: 0,
          administrativeHeadroom: 100,
          reasons: [],
        }}
        scenario={scenario}
        world={world}
        agendas={[agenda]}
        whyNow="현재 상황에서 선택할 수 있는 행동입니다."
        onPreviewRegions={() => undefined}
        onClearPreview={() => undefined}
        onSubmit={() => undefined}
      />,
    );
    const decisionSummary = decisionMarkup.match(
      /<div class="decision-summary">([\s\S]*?)<\/div>/,
    )?.[1];
    expect(decisionSummary).toContain("국고·행정 여력");
    expect(decisionSummary).not.toContain(String(intervention.treasuryCost));
    expect(decisionMarkup).toContain("왜 그런가 · 세부 조건");
    expect(decisionMarkup).toContain(
      `국고 <b>${intervention.treasuryCost}</b>`,
    );
  });
});
