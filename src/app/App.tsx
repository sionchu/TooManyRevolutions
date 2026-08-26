import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PLAYER_COPY } from "../presentation/design/copyRegistry.ko";
import { derivePresentationState } from "../presentation/presentationState";
import { deriveNationalAgendas } from "../sim/readModels/agenda";
import type { GameEvent } from "../sim/events/event";
import type { RunRecord } from "../sim/core/step";
import {
  evaluateInterventionFeasibility,
  type InterventionDefinition,
} from "../sim/state/intervention";
import type { CountryId, RegionId } from "../sim/state/ids";
import { GAMEBUILDERS_DEMO_SCENARIO } from "../sim/state/gameBuildersDemoScenario";
import {
  advanceDemoRecord,
  createDemoRunRecord,
  submitIntervention,
} from "./demoGame";
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
import { eventLabel, formatDate } from "./gamePresentation";
import { TitleScreen } from "./TitleScreen";
import { transitionProductScreen, type ProductScreen } from "./screenFlow";

const PLAYER_COUNTRY_ID = GAMEBUILDERS_DEMO_SCENARIO.playerCountryId;

if (PLAYER_COUNTRY_ID === null) {
  throw new Error("GameBuilders demo requires a player CountryId.");
}

const PLAYER_ID: CountryId = PLAYER_COUNTRY_ID;

const MAJOR_EVENT_TYPES = new Set<GameEvent["type"]>([
  "COUP_ATTEMPT_STARTED",
  "REBELLION_STARTED",
  "CONFLICT_RESOLVED",
  "CIVIL_WAR_STARTED",
  "GOVERNMENT_TRANSITIONED",
  "ORDER_CONSOLIDATION_STARTED",
  "ORDER_CONSOLIDATED",
  "STATE_DISSOLVED",
]);

function GameScreen({ onReset }: { readonly onReset: () => void }) {
  const [record, setRecord] = useState<RunRecord>(() => createDemoRunRecord());
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
  const visibleEvents = [...record.eventStore.events].reverse().slice(0, 10);
  const crisisEvent = visibleEvents.find(
    (event) =>
      event.type === "COUP_ATTEMPT_STARTED" ||
      event.type === "REBELLION_STARTED",
  );
  const leadAgenda = agendas[0] ?? null;
  const crisisFocusRegionId = (() => {
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
      const previousEventIds = new Set(
        current.eventStore.events.map((event) => event.id),
      );
      const next = advanceDemoRecord(current, 1);
      const newEvents = next.eventStore.events.filter(
        (event) => !previousEventIds.has(event.id),
      );
      const majorEvent = newEvents.find((event) =>
        MAJOR_EVENT_TYPES.has(event.type),
      );
      recordRef.current = next;
      setRecord(next);

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
      } else {
        setFlowNotice(`${speed}x 재생 중 · ${next.world.tick}일차`);
      }
    } finally {
      stepLockRef.current = false;
    }
  }, [autoPauseMajorEvents, clearClock, playTone, speed]);

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
    const next = advanceDemoRecord(recordRef.current, days);
    recordRef.current = next;
    setRecord(next);
    setFlowNotice(`수동 보조 진행 · ${next.world.tick}일차`);
    playTone("confirm");
  };

  const submitAction = (interventionId: InterventionDefinition["id"]) => {
    clearClock();
    setIsPlaying(false);
    const next = submitIntervention(recordRef.current, interventionId);
    recordRef.current = next;
    setRecord(next);
    setFlowNotice("행동 제출 완료 · 시간이 일시정지되었습니다.");
    playTone("confirm");
  };

  const focusRegion = (regionId: RegionId) => {
    setSelectedRegionId(regionId);
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

      <CrisisBanner
        event={crisisEvent}
        scenario={GAMEBUILDERS_DEMO_SCENARIO}
        onFocusMap={
          crisisFocusRegionId === null
            ? undefined
            : () => focusRegion(crisisFocusRegionId)
        }
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
          />
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
              onFocusRegion={focusRegion}
            />
          ) : activePanel === "decisions" ? (
            <DecisionPanel
              candidates={candidates}
              agendas={agendas}
              scenario={GAMEBUILDERS_DEMO_SCENARIO}
              world={record.world}
              policyState={policyState}
              onSubmit={submitAction}
            />
          ) : activePanel === "region" ? (
            <RegionInspector
              region={selectedRegion}
              scenario={GAMEBUILDERS_DEMO_SCENARIO}
            />
          ) : activePanel === "chronicle" ? (
            <ChroniclePanel
              events={visibleEvents}
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
