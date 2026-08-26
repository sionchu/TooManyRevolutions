import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PLAYER_COPY } from "../presentation/design/copyRegistry.ko";
import { derivePresentationState } from "../presentation/presentationState";
import { deriveNationalAgendas } from "../sim/readModels/agenda";
import type { ConflictKind } from "../sim/state/conflict";
import {
  evaluateInterventionFeasibility,
  type InterventionDefinition,
} from "../sim/state/intervention";
import {
  evaluatePolicyAvailability,
  type PolicyDefinition,
} from "../sim/state/policy";
import type { CountryId, RegionId } from "../sim/state/ids";
import { GAMEBUILDERS_DEMO_SCENARIO } from "../sim/state/gameBuildersDemoScenario";
import { POLICY_FIXTURE_IDS } from "../sim/state/policyFixture";
import { deriveOrderConsolidationEligibility } from "../sim/systems/orderConsolidation";
import { ContentStudio } from "./ContentStudio";
import {
  advanceDemoRuntime,
  createDemoRuntimeState,
  submitRuntimeIntervention,
  submitRuntimePolicy,
} from "./demoGame";
import type { DemoRuntimeState } from "./demoGame";
import { AgendaPanel } from "./AgendaPanel";
import { CrisisBanner } from "./CrisisBanner";
import { ContextualDock, type ContextPanel } from "./ContextualDock";
import { DecisionPanel } from "./DecisionPanel";
import { GameHeader } from "./GameHeader";
import { MetricStrip } from "./MetricStrip";
import { OpeningBriefing } from "./OpeningBriefing";
import { PoliticalAtlas } from "./PoliticalAtlas";
import { RegionInspector } from "./RegionInspector";
import { ChroniclePanel } from "./ChroniclePanel";
import { SPEED_INTERVAL_MS, type DemoSpeed } from "./demoSpeed";
import { deriveChronicleDigest } from "./chronicleDigest";
import {
  eventLabel,
  formatDate,
  isSignificantEvent,
  selectSignificantEvents,
} from "./gamePresentation";
import { deriveInstitutionalRoadmap } from "./institutionalRoadmap";
import { isAutoPauseWorthyEvent } from "./autoPause";
import { deriveStateProjectPresentations } from "./stateProjects";
import {
  deriveWorldVisualDeltas,
  type WorldVisualDelta,
} from "./worldVisualDelta";
import { TitleScreen } from "./TitleScreen";
import { transitionProductScreen, type ProductScreen } from "./screenFlow";

const PLAYER_COUNTRY_ID = GAMEBUILDERS_DEMO_SCENARIO.playerCountryId;

if (PLAYER_COUNTRY_ID === null) {
  throw new Error("GameBuilders demo requires a player CountryId.");
}

const PLAYER_ID: CountryId = PLAYER_COUNTRY_ID;

function conflictKindLabel(kind: ConflictKind): string {
  switch (kind) {
    case "rebellion":
      return "반란";
    case "coup":
      return "쿠데타";
    case "civilWar":
      return "내전";
    case "war":
      return "전쟁";
  }
}

function GameScreen({ onReset }: { readonly onReset: () => void }) {
  const [record, setRecord] = useState<DemoRuntimeState>(() =>
    createDemoRuntimeState(),
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<DemoSpeed>(1);
  const [autoPauseMajorEvents, setAutoPauseMajorEvents] = useState(true);
  const [flowNotice, setFlowNotice] = useState(
    "일시정지 · 재생을 누르면 하루씩 진행합니다.",
  );
  const [soundEnabled, setSoundEnabled] = useState(true);
  const recordRef = useRef(record);
  const intervalRef = useRef<number | null>(null);
  const stepLockRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<RegionId | null>(
    GAMEBUILDERS_DEMO_SCENARIO.initialRegions[0]?.id ?? null,
  );
  const [activePanel, setActivePanel] = useState<ContextPanel>("map");
  const [visualDeltas, setVisualDeltas] = useState<readonly WorldVisualDelta[]>(
    [],
  );
  const [mapFocusRegionId, setMapFocusRegionId] = useState<RegionId | null>(
    null,
  );
  const [previewRegionIds, setPreviewRegionIds] = useState<readonly RegionId[]>(
    [],
  );

  useEffect(() => {
    recordRef.current = record;
  }, [record]);

  const clearClock = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const playTone = useCallback(
    (tone: "confirm" | "crisis") => {
      if (!soundEnabled || typeof window === "undefined") return;
      const AudioContextConstructor =
        window.AudioContext ??
        (
          window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;
      if (AudioContextConstructor === undefined) return;

      const context =
        audioContextRef.current ??
        (audioContextRef.current = new AudioContextConstructor());
      void context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime;
      const duration = tone === "crisis" ? 0.28 : 0.12;
      oscillator.type = tone === "crisis" ? "sawtooth" : "triangle";
      oscillator.frequency.setValueAtTime(tone === "crisis" ? 150 : 520, start);
      if (tone === "crisis") {
        oscillator.frequency.exponentialRampToValueAtTime(90, start + duration);
      }
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.045, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    },
    [soundEnabled],
  );

  const presentation = useMemo(
    () => derivePresentationState(GAMEBUILDERS_DEMO_SCENARIO, record.world),
    [record],
  );
  const commitRuntimeTransition = useCallback(
    (previous: DemoRuntimeState, next: DemoRuntimeState) => {
      const previousEventIds = new Set(
        previous.eventStore.events.map((event) => event.id),
      );
      const newEvents = next.eventStore.events.filter(
        (event) => !previousEventIds.has(event.id),
      );
      const deltas = deriveWorldVisualDeltas({
        previous: derivePresentationState(
          GAMEBUILDERS_DEMO_SCENARIO,
          previous.world,
        ),
        next: derivePresentationState(GAMEBUILDERS_DEMO_SCENARIO, next.world),
        events: newEvents,
        previousPolicy: previous.world.policies[PLAYER_ID],
        nextPolicy: next.world.policies[PLAYER_ID],
      });
      setVisualDeltas(deltas);
      const focusRegionId = deltas.flatMap((delta) => delta.regionIds)[0];
      if (focusRegionId !== undefined) {
        setMapFocusRegionId(focusRegionId as RegionId);
      }
      recordRef.current = next;
      setRecord(next);
      return newEvents;
    },
    [],
  );
  const agendas = useMemo(
    () =>
      deriveNationalAgendas({
        scenario: GAMEBUILDERS_DEMO_SCENARIO,
        world: record.world,
        recentEvents: record.eventStore.events,
      }),
    [record],
  );
  const playerCountry = record.world.countries[PLAYER_ID];
  const policyState = record.world.policies[PLAYER_ID];
  const consolidation = useMemo(
    () =>
      deriveOrderConsolidationEligibility(
        GAMEBUILDERS_DEMO_SCENARIO,
        record.world,
      ),
    [record],
  );
  const roadmap = useMemo(
    () =>
      policyState === undefined
        ? { nodes: [], edges: [] }
        : deriveInstitutionalRoadmap(
            policyState,
            GAMEBUILDERS_DEMO_SCENARIO.policyCatalog,
          ),
    [policyState],
  );
  const projects = useMemo(
    () =>
      deriveStateProjectPresentations(
        GAMEBUILDERS_DEMO_SCENARIO,
        record.world,
        record.eventStore.events,
      ),
    [record],
  );
  const chronicleDigest = useMemo(
    () =>
      deriveChronicleDigest(
        record.eventStore.events,
        GAMEBUILDERS_DEMO_SCENARIO,
        12,
      ),
    [record],
  );
  const selectedRegion =
    presentation.regions.find(
      (region) => region.regionId === selectedRegionId,
    ) ??
    presentation.regions[0] ??
    null;
  const candidates = Object.values(
    GAMEBUILDERS_DEMO_SCENARIO.interventionCatalog,
  )
    .sort((first, second) => first.id.localeCompare(second.id))
    .map((definition) => ({
      definition,
      feasibility: evaluateInterventionFeasibility({
        scenario: GAMEBUILDERS_DEMO_SCENARIO,
        world: record.world,
        interventionId: definition.id,
        countryId: PLAYER_ID,
      }),
    }));
  const policySurfaceIds: readonly PolicyDefinition["id"][] = [
    POLICY_FIXTURE_IDS.abolishRoyalVeto,
    POLICY_FIXTURE_IDS.universalSuffrage,
    POLICY_FIXTURE_IDS.nationalizeProductiveProperty,
  ];
  const policyCandidates = policySurfaceIds.flatMap((policyId) => {
    const definition = GAMEBUILDERS_DEMO_SCENARIO.policyCatalog[policyId];
    if (definition === undefined || policyState === undefined) return [];
    return [
      {
        definition,
        availability: evaluatePolicyAvailability(
          policyState,
          definition,
          GAMEBUILDERS_DEMO_SCENARIO.policyCatalog,
        ),
      },
    ];
  });
  const visibleEvents = selectSignificantEvents(record.eventStore.events, 10);
  const crisisEvent = visibleEvents.find(
    (event) =>
      event.type === "COUP_ATTEMPT_STARTED" ||
      event.type === "REBELLION_STARTED",
  );
  const activeConflicts = presentation.activeConflicts;
  const playerControlledLandHexCount = presentation.landHexes.filter(
    (hex) =>
      hex.controller.kind === "country" &&
      hex.controller.countryId === PLAYER_ID,
  ).length;
  const legalPlayerLandHexCount = presentation.landHexes.filter(
    (hex) =>
      presentation.regions.find((region) => region.regionId === hex.regionId)
        ?.ownerCountryId === PLAYER_ID,
  ).length;
  const capitalRegionId = playerCountry?.capitalRegionId ?? null;
  const playerRegionIds = GAMEBUILDERS_DEMO_SCENARIO.initialRegions
    .filter((region) => region.ownerCountryId === PLAYER_ID)
    .map((region) => region.id);
  const capitalControlled =
    capitalRegionId !== null &&
    presentation.regions.find((region) => region.regionId === capitalRegionId)
      ?.control.fullyControlledByCountryId === PLAYER_ID;
  const factionActionCount = record.world.run.actionLog.filter((action) =>
    [
      "LOBBY",
      "BARGAIN",
      "ORGANIZE",
      "FUND_MOVEMENT",
      "ACCEPT",
      "WAIT",
    ].includes(action.actionType),
  ).length;
  const foreignActionCount = record.world.run.actionLog.filter((action) =>
    [
      "CLOSE_BORDER",
      "REOPEN_BORDER",
      "RESTRICT_INCOMING_BORDER",
      "RESTORE_INCOMING_BORDER",
    ].includes(action.actionType),
  ).length;
  const leadAgenda = agendas[0] ?? null;
  const crisisFocusRegionId = (() => {
    const conflictRegion =
      activeConflicts[0]?.affectedRegionIds[0] ??
      activeConflicts[0]?.contestedRegionIds[0];
    if (conflictRegion !== undefined) return conflictRegion;
    const payload = crisisEvent?.payload;
    if (typeof payload === "object" && payload !== null) {
      const affectedRegionIds = (payload as { affectedRegionIds?: unknown })
        .affectedRegionIds;
      if (Array.isArray(affectedRegionIds)) {
        const affectedRegion = presentation.regions.find((region) =>
          affectedRegionIds.some((regionId) => regionId === region.regionId),
        );
        if (affectedRegion !== undefined) return affectedRegion.regionId;
      }
    }
    return presentation.regions[0]?.regionId ?? null;
  })();

  const advanceOneDay = useCallback(() => {
    if (stepLockRef.current) return;
    const current = recordRef.current;
    if (current.world.run.outcome.status !== "active") {
      clearClock();
      setIsPlaying(false);
      setFlowNotice("종료된 실행은 더 진행되지 않습니다.");
      return;
    }

    stepLockRef.current = true;
    try {
      const next = advanceDemoRuntime(current, 1);
      const newEvents = commitRuntimeTransition(current, next);
      const majorEvent = newEvents.find(isAutoPauseWorthyEvent);
      const significantEvent = newEvents.find(isSignificantEvent);

      if (majorEvent !== undefined) {
        const mapped = eventLabel(majorEvent, GAMEBUILDERS_DEMO_SCENARIO);
        setFlowNotice(
          `${mapped.title} · ${next.world.tick}일차${autoPauseMajorEvents ? " · 자동 일시정지" : " · 계속 진행"}`,
        );
        playTone("crisis");
        if (autoPauseMajorEvents) setIsPlaying(false);
      } else if (next.world.run.outcome.status !== "active") {
        setFlowNotice("실행 결과가 확정되어 시간이 멈췄습니다.");
        setIsPlaying(false);
      } else if (significantEvent !== undefined) {
        const mapped = eventLabel(significantEvent, GAMEBUILDERS_DEMO_SCENARIO);
        setFlowNotice(`${mapped.title} · ${next.world.tick}일차`);
        playTone("confirm");
      } else {
        setFlowNotice(`${speed}x 재생 중 · ${next.world.tick}일차`);
      }
    } finally {
      stepLockRef.current = false;
    }
  }, [
    autoPauseMajorEvents,
    clearClock,
    commitRuntimeTransition,
    playTone,
    speed,
  ]);

  useEffect(() => {
    clearClock();
    if (!isPlaying) return;
    intervalRef.current = window.setInterval(
      advanceOneDay,
      SPEED_INTERVAL_MS[speed],
    );
    return clearClock;
  }, [advanceOneDay, clearClock, isPlaying, speed]);

  const togglePlaying = () => {
    if (recordRef.current.world.run.outcome.status !== "active") {
      setFlowNotice("종료된 실행은 더 진행되지 않습니다.");
      return;
    }
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);
    setFlowNotice(
      nextPlaying ? `${speed}x 재생 시작 · 하루씩 진행합니다.` : "일시정지됨",
    );
    playTone("confirm");
  };

  const advance = (days: number) => {
    clearClock();
    setIsPlaying(false);
    const current = recordRef.current;
    const next = advanceDemoRuntime(current, days);
    commitRuntimeTransition(current, next);
    setFlowNotice(`수동 보조 진행 · ${next.world.tick}일차`);
    playTone("confirm");
  };

  const submitAction = (interventionId: InterventionDefinition["id"]) => {
    clearClock();
    setIsPlaying(false);
    const current = recordRef.current;
    const next = submitRuntimeIntervention(current, interventionId);
    commitRuntimeTransition(current, next);
    setFlowNotice("행동 제출 완료 · 시간이 일시정지되었습니다.");
    playTone("confirm");
  };

  const submitPolicy = (policyId: PolicyDefinition["id"]) => {
    clearClock();
    setIsPlaying(false);
    const current = recordRef.current;
    const next = submitRuntimePolicy(current, policyId);
    commitRuntimeTransition(current, next);
    setFlowNotice("정책 제출 완료 · 제도 기록을 갱신했습니다.");
    playTone("confirm");
  };

  const focusRegion = (regionId: RegionId) => {
    setSelectedRegionId(regionId);
    setMapFocusRegionId(regionId);
    setActivePanel("region");
  };

  return (
    <main className="game-shell map-first-shell">
      <GameHeader
        playerCountry={playerCountry}
        date={record.world.date}
        tick={record.world.tick}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((enabled) => !enabled)}
        onReset={onReset}
      />

      <MetricStrip
        playerCountry={playerCountry}
        isPlaying={isPlaying}
        speed={speed}
        autoPauseMajorEvents={autoPauseMajorEvents}
        flowNotice={flowNotice}
        onTogglePlaying={togglePlaying}
        onSetSpeed={(nextSpeed) => {
          setSpeed(nextSpeed);
          setFlowNotice(`${nextSpeed}x 속도 선택`);
        }}
        onSetAutoPause={setAutoPauseMajorEvents}
        onAdvance={advance}
      />

      <section className="world-stage" aria-label="정치 세계 지도">
        <CrisisBanner
          event={crisisEvent}
          activeConflicts={activeConflicts}
          scenario={GAMEBUILDERS_DEMO_SCENARIO}
          onFocusMap={
            crisisFocusRegionId === null
              ? undefined
              : () => focusRegion(crisisFocusRegionId)
          }
        />
        <div className="world-map-surface">
          <div className="map-surface-heading">
            <div>
              <span className="eyebrow">{PLAYER_COPY.main.mapEyebrow}</span>
              <h2>{PLAYER_COPY.main.mapTitle}</h2>
            </div>
            <span className="map-date">{formatDate(record.world.date)}</span>
          </div>
          <PoliticalAtlas
            presentation={presentation}
            selectedRegionId={selectedRegionId}
            onSelectRegion={focusRegion}
            onClearFocus={() => {
              setMapFocusRegionId(null);
              setActivePanel("map");
            }}
            projects={projects}
            visualDeltas={visualDeltas}
            focusRegionId={mapFocusRegionId}
            previewRegionIds={previewRegionIds}
          />
          <div className="map-fact-strip" aria-label="현재 세계 사실">
            <span>
              <b>
                {playerControlledLandHexCount === legalPlayerLandHexCount
                  ? "정렬"
                  : "이탈"}
              </b>{" "}
              물리 통제와 법적 소유
            </span>
            <span>
              활성 충돌 ·{" "}
              <b>
                {activeConflicts.length === 0
                  ? "없음"
                  : activeConflicts
                      .map((conflict) => conflictKindLabel(conflict.kind))
                      .join(" · ")}
              </b>
            </span>
            <span>
              수도 <b>{capitalControlled ? "통제 중" : "통제 이탈"}</b>
            </span>
            <span>
              세력 움직임{" "}
              <b>{factionActionCount > 0 ? "관측됨" : "현재 없음"}</b>
            </span>
            <span>
              외국 접촉{" "}
              <b>{foreignActionCount > 0 ? "변화 관측됨" : "현재 없음"}</b>
            </span>
          </div>
          {leadAgenda === null ? null : (
            <div className="map-issue-chip" role="status">
              <span className="eyebrow">현재 압력</span>
              <strong>{leadAgenda.title}</strong>
              <span>
                {leadAgenda.affectedRegionIds
                  .map(
                    (regionId) =>
                      presentation.regions.find(
                        (region) => region.regionId === regionId,
                      )?.name,
                  )
                  .filter((name): name is string => name !== undefined)
                  .join(" · ") || "전국"}
              </span>
              {leadAgenda.affectedRegionIds[0] === undefined ? null : (
                <button
                  className="map-issue-button"
                  type="button"
                  onClick={() => focusRegion(leadAgenda.affectedRegionIds[0]!)}
                >
                  지도에서 보기
                </button>
              )}
            </div>
          )}
          <details className="map-fact-details">
            <summary>지도 사실 수치</summary>
            <div>
              <span>
                물리 통제 {playerControlledLandHexCount} · 법적 소유{" "}
                {legalPlayerLandHexCount}
              </span>
              <span>
                활성 충돌 {activeConflicts.length} · 세력 행동{" "}
                {factionActionCount} · 외국 행동 {foreignActionCount}
              </span>
            </div>
          </details>
        </div>

        <ContextualDock
          activePanel={activePanel}
          onSelectPanel={setActivePanel}
          onClose={() => setActivePanel("map")}
        >
          {activePanel === "agenda" ? (
            <AgendaPanel
              agendas={agendas}
              scenario={GAMEBUILDERS_DEMO_SCENARIO}
              consolidation={consolidation}
              onFocusRegion={focusRegion}
            />
          ) : activePanel === "decisions" ? (
            <DecisionPanel
              candidates={candidates}
              agendas={agendas}
              scenario={GAMEBUILDERS_DEMO_SCENARIO}
              world={record.world}
              policyState={policyState}
              policyCandidates={policyCandidates}
              roadmap={roadmap}
              projects={projects}
              onFocusProject={focusRegion}
              policyRegionIds={playerRegionIds}
              onPreviewRegions={setPreviewRegionIds}
              onClearPreview={() => setPreviewRegionIds([])}
              onSubmit={submitAction}
              onSubmitPolicy={submitPolicy}
            />
          ) : activePanel === "region" ? (
            <RegionInspector
              region={selectedRegion}
              scenario={GAMEBUILDERS_DEMO_SCENARIO}
            />
          ) : activePanel === "chronicle" ? (
            <ChroniclePanel
              events={visibleEvents}
              digest={chronicleDigest}
              scenario={GAMEBUILDERS_DEMO_SCENARIO}
            />
          ) : null}
        </ContextualDock>
      </section>
    </main>
  );
}

export function App() {
  const [screen, setScreen] = useState<ProductScreen>("title");
  if (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("contentStudio") === "1"
  ) {
    return <ContentStudio />;
  }
  if (screen === "title") {
    return (
      <TitleScreen
        onStart={() =>
          setScreen((current) =>
            transitionProductScreen(current, "start-new-game"),
          )
        }
      />
    );
  }
  if (screen === "opening-briefing") {
    return (
      <OpeningBriefing
        onComplete={() =>
          setScreen((current) =>
            transitionProductScreen(current, "finish-opening"),
          )
        }
      />
    );
  }
  return (
    <GameScreen
      onReset={() =>
        setScreen((current) =>
          transitionProductScreen(current, "return-to-title"),
        )
      }
    />
  );
}
