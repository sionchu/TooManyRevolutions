import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PLAYER_COPY } from "../presentation/design/copyRegistry.ko";
import { derivePresentationState } from "../presentation/presentationState";
import { deriveEventPresentation } from "../presentation/eventPresentation";
import { deriveNationalAgendas } from "../sim/readModels/agenda";
import { deriveContextualDecisionSurface } from "../sim/readModels/contextualDecisions";
import type { ConflictKind } from "../sim/state/conflict";
import type { InterventionDefinition } from "../sim/state/intervention";
import type { PolicyDefinition } from "../sim/state/policy";
import type {
  CountryId,
  PoliticalProposalId,
  RegionId,
} from "../sim/state/ids";
import type { PoliticalProposalResponse } from "../sim/state/action";
import { GAMEBUILDERS_DEMO_SCENARIO } from "../sim/state/gameBuildersDemoScenario";
import { GAMEBUILDERS_PRODUCTION_CONTEXTUAL_CATALOG } from "../sim/state/gameBuildersDecisionCatalog";
import { deriveOrderConsolidationEligibility } from "../sim/systems/orderConsolidation";
import { ContentStudio } from "./ContentStudio";
import { MapStudio } from "./MapStudio";
import {
  advanceDemoRuntime,
  createDemoRuntimeState,
  submitRuntimeIntervention,
  submitRuntimePolicy,
  submitRuntimePoliticalProposalResponse,
} from "./demoGame";
import type { DemoRuntimeState } from "./demoGame";
import { AgendaPanel } from "./AgendaPanel";
import { ContextualDock, type ContextPanel } from "./ContextualDock";
import { DecisionPanel } from "./DecisionPanel";
import { EventPresentationOverlay } from "./EventPresentationOverlay";
import { GameHeader } from "./GameHeader";
import { MetricStrip } from "./MetricStrip";
import { OpeningBriefing } from "./OpeningBriefing";
import { PoliticalAtlas } from "./PoliticalAtlas";
import { RegionInspector } from "./RegionInspector";
import { ChroniclePanel } from "./ChroniclePanel";
import { SPEED_INTERVAL_MS, type DemoSpeed } from "./demoSpeed";
import { deriveChronicleDigest } from "./chronicleDigest";
import type { GameEvent } from "../sim/events/event";
import {
  eventLabel,
  formatDate,
  isSignificantEvent,
  selectSignificantEvents,
} from "./gamePresentation";
import { deriveInstitutionalRoadmap } from "./institutionalRoadmap";
import {
  deriveEventTimeReaction,
  deriveTimeReaction,
  nextSpeedAfterTimeReaction,
} from "./autoPause";
import { deriveStateProjectPresentations } from "./stateProjects";
import {
  deriveWorldVisualDeltas,
  type WorldVisualDelta,
} from "./worldVisualDelta";
import { TitleScreen } from "./TitleScreen";
import { transitionProductScreen, type ProductScreen } from "./screenFlow";
import {
  AudioManager,
  createSoundCueResolverState,
  resolveAmbientCue,
  resolveSoundCues,
  type AudioAvailabilityStatus,
  type SoundCueResolverInput,
} from "../presentation/audioSystem";

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
  const [autoSlowCrises, setAutoSlowCrises] = useState(true);
  const [flowNotice, setFlowNotice] = useState(
    "일시정지 · 재생을 누르면 하루씩 진행합니다.",
  );
  const audioManager = useMemo(() => new AudioManager(), []);
  const audioResolverStateRef = useRef(createSoundCueResolverState());
  const [audioStatus, setAudioStatus] = useState<
    AudioAvailabilityStatus | "idle"
  >("idle");
  const [soundEnabled, setSoundEnabled] = useState(
    () => !audioManager.getPreferences().muted,
  );
  const soundEnabledRef = useRef(soundEnabled);
  const recordRef = useRef(record);
  const intervalRef = useRef<number | null>(null);
  const stepLockRef = useRef(false);
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
  const [dismissedEventIds, setDismissedEventIds] = useState<
    ReadonlySet<string>
  >(() => new Set());

  useEffect(() => {
    recordRef.current = record;
  }, [record]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(
    () => () => {
      audioManager.dispose();
    },
    [audioManager],
  );

  const clearClock = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const activateAudioFromGesture = useCallback(async () => {
    if (!soundEnabledRef.current) return;
    const availability = await audioManager.startFromUserGesture();
    setAudioStatus(availability.status);
    if (availability.status !== "ready") return;
    await audioManager.startAmbience(resolveAmbientCue("map"), {
      fadeMs: 250,
      replaceExisting: true,
    });
  }, [audioManager]);

  const playResolvedAudio = useCallback(
    (input: SoundCueResolverInput) => {
      const resolution = resolveSoundCues(input, audioResolverStateRef.current);
      audioResolverStateRef.current = resolution.nextState;
      for (const cue of resolution.cues) {
        void audioManager.playCue(cue.cueId).then((result) => {
          if (result.status === "autoplay-blocked") {
            setAudioStatus("autoplay-blocked");
          }
        });
      }
    },
    [audioManager],
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
      playResolvedAudio({
        events: newEvents,
        visualDeltas: deltas,
        world: next.world,
        currentTick: next.world.tick,
      });
      const focusRegionId = deltas.flatMap((delta) => delta.regionIds)[0];
      if (focusRegionId !== undefined) {
        setMapFocusRegionId(focusRegionId as RegionId);
      }
      recordRef.current = next;
      setRecord(next);
      return newEvents;
    },
    [playResolvedAudio],
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
  const decisionSurface = useMemo(
    () =>
      deriveContextualDecisionSurface({
        scenario: GAMEBUILDERS_DEMO_SCENARIO,
        world: record.world,
        playerCountryId: PLAYER_ID,
        catalog: GAMEBUILDERS_PRODUCTION_CONTEXTUAL_CATALOG,
        agendas,
        recentEvents: record.eventStore.events,
      }),
    [agendas, record],
  );
  const eventPresentation = useMemo(
    () =>
      deriveEventPresentation({
        eventStore: record.eventStore,
        politicalProposals: record.world.politicalProposals,
        playerCountryId: PLAYER_ID,
        playerGovernmentId: playerCountry?.currentGovernmentId ?? null,
      }),
    [playerCountry?.currentGovernmentId, record],
  );
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
  const visibleEvents = selectSignificantEvents(record.eventStore.events, 10);
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

  const applyTimeReaction = useCallback(
    (next: DemoRuntimeState, newEvents: readonly GameEvent[]) => {
      const reaction =
        next.world.run.outcome.status === "active"
          ? deriveTimeReaction(newEvents)
          : "STOP";
      const reactionEvent = newEvents.find(
        (event) => deriveEventTimeReaction(event) === reaction,
      );

      if (reaction === "STOP") {
        clearClock();
        setIsPlaying(false);
        if (reactionEvent !== undefined) {
          const mapped = eventLabel(reactionEvent, GAMEBUILDERS_DEMO_SCENARIO);
          setFlowNotice(
            `${mapped.title} · ${next.world.tick}일차 · 시간이 멈췄습니다.`,
          );
        } else {
          setFlowNotice("실행 결과가 확정되어 시간이 멈췄습니다.");
        }
      } else if (reaction === "SLOW" && reactionEvent !== undefined) {
        const mapped = eventLabel(reactionEvent, GAMEBUILDERS_DEMO_SCENARIO);
        const nextSpeed = nextSpeedAfterTimeReaction(
          speed,
          reaction,
          autoSlowCrises,
        );
        if (nextSpeed !== speed) setSpeed(nextSpeed);
        setFlowNotice(
          autoSlowCrises
            ? `${mapped.title} · ${next.world.tick}일차 · ${nextSpeed}x로 자동 감속`
            : `${mapped.title} · ${next.world.tick}일차 · 현재 ${speed}x 유지`,
        );
      }

      return reaction;
    },
    [autoSlowCrises, clearClock, speed],
  );

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
      const timeReaction = applyTimeReaction(next, newEvents);
      const significantEvent = newEvents.find(isSignificantEvent);

      if (timeReaction !== "NONE") return;
      if (significantEvent !== undefined) {
        const mapped = eventLabel(significantEvent, GAMEBUILDERS_DEMO_SCENARIO);
        setFlowNotice(`${mapped.title} · ${next.world.tick}일차`);
      } else {
        setFlowNotice(`${speed}x 재생 중 · ${next.world.tick}일차`);
      }
    } finally {
      stepLockRef.current = false;
    }
  }, [applyTimeReaction, clearClock, commitRuntimeTransition, speed]);

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
    void activateAudioFromGesture();
    playResolvedAudio({
      interactionCues: [
        {
          cueId: "ui.confirm",
          dedupeKey: `interaction:playback:${nextPlaying}:${recordRef.current.world.tick}`,
          sourceId: `playback:${nextPlaying}:${recordRef.current.world.tick}`,
        },
      ],
      currentTick: recordRef.current.world.tick,
    });
    setIsPlaying(nextPlaying);
    setFlowNotice(
      nextPlaying ? `${speed}x 재생 시작 · 하루씩 진행합니다.` : "일시정지됨",
    );
  };

  const advance = (days: number) => {
    void activateAudioFromGesture();
    clearClock();
    setIsPlaying(false);
    const current = recordRef.current;
    const next = advanceDemoRuntime(current, days);
    commitRuntimeTransition(current, next);
    setFlowNotice(`수동 보조 진행 · ${next.world.tick}일차`);
    playResolvedAudio({
      interactionCues: [
        {
          cueId: "ui.confirm",
          dedupeKey: `interaction:advance:${days}:${current.world.tick}`,
          sourceId: `advance:${days}:${current.world.tick}`,
        },
      ],
      currentTick: current.world.tick,
    });
  };

  const submitAction = (interventionId: InterventionDefinition["id"]) => {
    void activateAudioFromGesture();
    const current = recordRef.current;
    const next = submitRuntimeIntervention(current, interventionId);
    const newEvents = commitRuntimeTransition(current, next);
    const timeReaction = applyTimeReaction(next, newEvents);
    if (timeReaction === "NONE") {
      setFlowNotice(
        `행동 제출 완료 · ${isPlaying ? "재생을 계속합니다." : "일시정지 상태를 유지합니다."}`,
      );
    }
    playResolvedAudio({
      interactionCues: [
        {
          cueId: "ui.confirm",
          dedupeKey: `interaction:submit:${interventionId}:${current.world.tick}`,
          sourceId: `submit:${interventionId}:${current.world.tick}`,
        },
      ],
      currentTick: current.world.tick,
    });
  };

  const submitPolicy = (policyId: PolicyDefinition["id"]) => {
    void activateAudioFromGesture();
    const current = recordRef.current;
    const next = submitRuntimePolicy(current, policyId);
    const newEvents = commitRuntimeTransition(current, next);
    const timeReaction = applyTimeReaction(next, newEvents);
    if (timeReaction === "NONE") {
      setFlowNotice(
        `정책 제출 완료 · 제도 기록을 갱신했습니다. · ${isPlaying ? "재생 계속" : "일시정지 유지"}`,
      );
    }
    playResolvedAudio({
      interactionCues: [
        {
          cueId: "ui.confirm",
          dedupeKey: `interaction:policy:${policyId}:${current.world.tick}`,
          sourceId: `policy:${policyId}:${current.world.tick}`,
        },
      ],
      currentTick: current.world.tick,
    });
  };

  const respondPoliticalProposal = (
    proposalId: PoliticalProposalId,
    response: PoliticalProposalResponse,
  ) => {
    void activateAudioFromGesture();
    const current = recordRef.current;
    const next = submitRuntimePoliticalProposalResponse(
      current,
      proposalId,
      response,
    );
    const newEvents = commitRuntimeTransition(current, next);
    const timeReaction = applyTimeReaction(next, newEvents);
    if (timeReaction === "NONE") {
      setFlowNotice(
        `정치 제안 ${response === "accept" ? "수락" : "거절"} · ${isPlaying ? "재생 계속" : "일시정지 유지"}`,
      );
    }
    playResolvedAudio({
      interactionCues: [
        {
          cueId: "ui.confirm",
          dedupeKey: `interaction:proposal:${proposalId}:${response}:${current.world.tick}`,
          sourceId: `proposal:${proposalId}:${current.world.tick}`,
        },
      ],
      currentTick: current.world.tick,
    });
  };

  const focusRegion = (regionId: RegionId) => {
    void activateAudioFromGesture();
    playResolvedAudio({
      interactionCues: [
        {
          cueId: "ui.select",
          dedupeKey: `interaction:region:${regionId}:${recordRef.current.world.tick}`,
          sourceId: `region:${regionId}:${recordRef.current.world.tick}`,
        },
      ],
      currentTick: recordRef.current.world.tick,
    });
    setSelectedRegionId(regionId);
    setMapFocusRegionId(regionId);
    setActivePanel("region");
  };

  const toggleSound = () => {
    const nextEnabled = !soundEnabled;
    audioManager.setMuted(!nextEnabled);
    soundEnabledRef.current = nextEnabled;
    setSoundEnabled(nextEnabled);
    if (nextEnabled) void activateAudioFromGesture();
  };

  return (
    <main
      className="game-shell map-first-shell"
      data-audio-status={audioStatus}
      data-audio-enabled={soundEnabled ? "true" : "false"}
      data-audio-ambient-cue={resolveAmbientCue("map")}
      data-demo-speed={speed}
      data-demo-is-playing={isPlaying ? "true" : "false"}
      data-contextual-shortlist-order={decisionSurface.primaryShortlist
        .map((candidate) => `${candidate.kind}:${candidate.id}`)
        .join(",")}
      data-event-presentation-kinds={eventPresentation
        .filter((item) => item.kind !== "CHRONICLE_ONLY")
        .map((item) => `${item.kind}:${item.eventType}`)
        .join(",")}
      data-open-political-proposal-count={
        Object.values(record.world.politicalProposals ?? {}).filter(
          (proposal) => proposal.status === "open",
        ).length
      }
    >
      <GameHeader
        playerCountry={playerCountry}
        date={record.world.date}
        tick={record.world.tick}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onReset={onReset}
      />

      <MetricStrip
        playerCountry={playerCountry}
        isPlaying={isPlaying}
        speed={speed}
        autoSlowCrises={autoSlowCrises}
        flowNotice={flowNotice}
        onTogglePlaying={togglePlaying}
        onSetSpeed={(nextSpeed) => {
          setSpeed(nextSpeed);
          setFlowNotice(`${nextSpeed}x 속도 선택`);
        }}
        onSetAutoSlow={setAutoSlowCrises}
        onAdvance={advance}
      />

      <section className="world-stage" aria-label="정치 세계 지도">
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
          <EventPresentationOverlay
            items={eventPresentation}
            dismissedEventIds={dismissedEventIds}
            scenario={GAMEBUILDERS_DEMO_SCENARIO}
            world={record.world}
            events={record.eventStore.events}
            onDismiss={(eventId) =>
              setDismissedEventIds((current) => {
                const next = new Set(current);
                next.add(eventId);
                return next;
              })
            }
            onRespond={respondPoliticalProposal}
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
              primaryShortlist={decisionSurface.primaryShortlist}
              agendas={agendas}
              scenario={GAMEBUILDERS_DEMO_SCENARIO}
              world={record.world}
              policyState={policyState}
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
  if (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("mapStudio") === "1"
  ) {
    return <MapStudio />;
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
