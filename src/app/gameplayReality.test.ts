import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { createGameEvent } from "../sim/events/event";
import { derivePresentationState } from "../presentation/presentationState";
import { selectSignificantEvents } from "./gamePresentation";
import { PoliticalAtlas } from "./PoliticalAtlas";
import { DecisionPanel } from "./DecisionPanel";
import { TimeControls } from "./TimeControls";
import { ConsolidationChecklist } from "./ConsolidationChecklist";
import { deriveContextualDecisionSurface } from "../sim/readModels/contextualDecisions";
import {
  GAMEBUILDERS_DEMO_COUNTRY_IDS,
  GAMEBUILDERS_DEMO_REGION_IDS,
  GAMEBUILDERS_DEMO_SCENARIO,
} from "../sim/state/gameBuildersDemoScenario";
import {
  GAMEBUILDERS_PRODUCTION_CONTEXTUAL_CATALOG,
  GAMEBUILDERS_PRODUCTION_POLICY_IDS,
} from "../sim/state/gameBuildersDecisionCatalog";
import { asConflictId } from "../sim/state/ids";
import { IDEOLOGY_FIXTURE_IDS } from "../sim/state/ideologyFixture";
import { createInitialWorldState } from "../sim/state/world";
import { deriveOrderConsolidationEligibility } from "../sim/systems/orderConsolidation";
import { deriveStateProjectPresentations } from "./stateProjects";

describe("GAMEBUILDERS gameplay reality read models", () => {
  it("keeps current LandHex control and active Conflict in the presentation state", () => {
    const faction = GAMEBUILDERS_DEMO_SCENARIO.initialFactions[0]!;
    const landHex =
      GAMEBUILDERS_DEMO_SCENARIO.mapTerritorialTopology.landHexes[0]!;
    const regionId = GAMEBUILDERS_DEMO_SCENARIO.initialRegions[0]!.id;
    const world = createInitialWorldState(GAMEBUILDERS_DEMO_SCENARIO, 18970401);
    const presented = derivePresentationState(GAMEBUILDERS_DEMO_SCENARIO, {
      ...world,
      landHexStates: {
        ...world.landHexStates,
        [landHex.id]: {
          controller: { kind: "faction", factionId: faction.id },
        },
      },
      conflicts: {
        [asConflictId("gamebuilders.test.active-rebellion")]: {
          id: asConflictId("gamebuilders.test.active-rebellion"),
          kind: "rebellion",
          status: "active",
          participantCountryIds: [GAMEBUILDERS_DEMO_COUNTRY_IDS.arken],
          participantFactionIds: [faction.id],
          affectedRegionIds: [regionId],
          contestedRegionIds: [regionId],
          startedAtTick: 12,
        },
      },
    });

    expect(
      presented.landHexes.find((hex) => hex.landHexId === landHex.id)
        ?.controller,
    ).toEqual({
      kind: "faction",
      factionId: faction.id,
    });
    expect(presented.activeConflicts).toHaveLength(1);
    expect(presented.activeConflicts[0]).toMatchObject({
      kind: "rebellion",
      affectedRegionIds: [regionId],
    });
    const mapMarkup = renderToStaticMarkup(
      createElement(PoliticalAtlas, {
        presentation: presented,
        selectedRegionId: null,
        onSelectRegion: () => undefined,
        onClearFocus: () => undefined,
        projects: [],
        visualDeltas: [],
        focusRegionId: null,
        previewRegionIds: [],
      }),
    );
    expect(mapMarkup).toContain('data-controller-kind="faction"');
    expect(mapMarkup).toContain("atlas-controller-overlay");
    expect(mapMarkup).toContain('data-map-renderer="r3f"');
  });

  it("filters routine ticks while retaining policy and material state changes", () => {
    const events = [
      createGameEvent({
        tick: 1,
        sequence: 0,
        type: "TICK_ADVANCED",
        causeIds: [],
        payload: { previousTick: 0, nextTick: 1 },
        visibility: "hidden",
      }),
      createGameEvent({
        tick: 2,
        sequence: 1,
        type: "POLICY_ENACTED",
        causeIds: [],
        payload: {
          policyId: GAMEBUILDERS_PRODUCTION_POLICY_IDS.legislativeOversight,
        },
        visibility: "world",
      }),
      createGameEvent({
        tick: 3,
        sequence: 2,
        type: "RESOURCE_SHORTAGE_CHANGED",
        causeIds: [],
        payload: {
          regionId: GAMEBUILDERS_DEMO_REGION_IDS.veloriaPort,
          previousScarcity: 0.1,
          scarcity: 0.72,
          totalDemand: 10,
          totalShortage: 7,
        },
        visibility: "world",
      }),
    ];

    const significant = selectSignificantEvents(events);
    expect(significant.map((event) => event.type)).toEqual([
      "RESOURCE_SHORTAGE_CHANGED",
      "POLICY_ENACTED",
    ]);
    expect(selectSignificantEvents([...events].reverse())).toEqual(significant);
  });

  it("authors distinct neighboring ideology gradients on real contact regions", () => {
    const veloria = GAMEBUILDERS_DEMO_SCENARIO.initialRegions.find(
      (region) => region.id === GAMEBUILDERS_DEMO_REGION_IDS.veloriaPort,
    )!;
    const karsen = GAMEBUILDERS_DEMO_SCENARIO.initialRegions.find(
      (region) => region.id === GAMEBUILDERS_DEMO_REGION_IDS.karsenFrontier,
    )!;
    expect(
      veloria.ideology[IDEOLOGY_FIXTURE_IDS.republicanism]?.support,
    ).not.toBe(karsen.ideology[IDEOLOGY_FIXTURE_IDS.republicanism]?.support);
    expect(veloria.ideology[IDEOLOGY_FIXTURE_IDS.communism]?.support).not.toBe(
      karsen.ideology[IDEOLOGY_FIXTURE_IDS.communism]?.support,
    );
  });

  it("renders real policy choices and observable map overlays", () => {
    const world = createInitialWorldState(GAMEBUILDERS_DEMO_SCENARIO, 18970401);
    const presentation = derivePresentationState(
      GAMEBUILDERS_DEMO_SCENARIO,
      world,
    );
    const policyState =
      world.policies[GAMEBUILDERS_DEMO_SCENARIO.playerCountryId!];
    const decisionSurface = deriveContextualDecisionSurface({
      scenario: GAMEBUILDERS_DEMO_SCENARIO,
      world,
      playerCountryId: GAMEBUILDERS_DEMO_SCENARIO.playerCountryId!,
      catalog: GAMEBUILDERS_PRODUCTION_CONTEXTUAL_CATALOG,
      agendas: [],
      recentEvents: [],
    });
    const decisionMarkup = renderToStaticMarkup(
      createElement(DecisionPanel, {
        primaryShortlist: decisionSurface.primaryShortlist,
        agendas: [],
        scenario: GAMEBUILDERS_DEMO_SCENARIO,
        world,
        policyState,
        projects: deriveStateProjectPresentations(
          GAMEBUILDERS_DEMO_SCENARIO,
          world,
          [],
        ),
        onFocusProject: () => undefined,
        policyRegionIds: [],
        onPreviewRegions: () => undefined,
        onClearPreview: () => undefined,
        onSubmit: () => undefined,
        onSubmitPolicy: () => undefined,
      }),
    );
    const mapMarkup = renderToStaticMarkup(
      createElement(PoliticalAtlas, {
        presentation,
        selectedRegionId: null,
        onSelectRegion: () => undefined,
        onClearFocus: () => undefined,
        projects: [],
        visualDeltas: [],
        focusRegionId: null,
        previewRegionIds: [],
      }),
    );

    expect(decisionMarkup).toContain("data-policy-id");
    expect(decisionMarkup).toContain("지금 필요한 선택");
    expect(decisionMarkup).toContain("data-contextual-shortlist-order");
    expect(
      new Set(decisionSurface.primaryShortlist.map((entry) => entry.kind)),
    ).toEqual(new Set(["policy", "intervention"]));
    expect(decisionMarkup).toContain(
      `data-contextual-shortlist-order="${decisionSurface.primaryShortlist
        .map((entry) => `${entry.kind}:${entry.id}`)
        .join(",")}"`,
    );
    const timeControlsMarkup = renderToStaticMarkup(
      createElement(TimeControls, {
        isPlaying: false,
        speed: 1,
        autoSlowCrises: true,
        flowNotice: "일시정지",
        onTogglePlaying: () => undefined,
        onSetSpeed: () => undefined,
        onSetAutoSlow: () => undefined,
        onAdvance: () => undefined,
      }),
    );
    expect(timeControlsMarkup).toContain("manual-jumps-mobile");
    expect(timeControlsMarkup).toContain("+30일");
    expect(timeControlsMarkup).toContain("위기 발생 시 자동 감속");
    expect(timeControlsMarkup).toContain('data-auto-slow-scope="crises"');
    expect(mapMarkup).toContain("atlas-controller-overlay");
    expect(mapMarkup).toContain("atlas-ideology-overlay");
    expect(mapMarkup).toContain("atlas-pressure-pulse");

    const blockedWorld = {
      ...world,
      landHexStates: {
        ...world.landHexStates,
        [GAMEBUILDERS_DEMO_SCENARIO.mapTerritorialTopology.landHexes[0]!.id]: {
          controller: { kind: "uncontrolled" as const },
        },
      },
    };
    const consolidationMarkup = renderToStaticMarkup(
      createElement(ConsolidationChecklist, {
        snapshot: deriveOrderConsolidationEligibility(
          GAMEBUILDERS_DEMO_SCENARIO,
          blockedWorld,
        ),
        scenario: GAMEBUILDERS_DEMO_SCENARIO,
      }),
    );
    expect(consolidationMarkup).toContain("새 질서 정착");
    expect(consolidationMarkup).toContain("다음 blocker:");
  });
});
