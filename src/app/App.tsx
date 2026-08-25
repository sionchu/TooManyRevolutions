import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  derivePresentationState,
  type PresentationLandHex,
  type PresentationRegion,
  type PresentationState,
} from "../presentation/presentationState";
import {
  deriveNationalAgendas,
  type AgendaSeverityBand,
  type PrimaryAgenda,
} from "../sim/readModels/agenda";
import type { GameEvent } from "../sim/events/event";
import { type RunRecord } from "../sim/core/step";
import {
  evaluateInterventionFeasibility,
  type InterventionEffect,
} from "../sim/state/intervention";
import {
  deriveRegimeClassification,
  type RegimeClassification,
} from "../sim/state/government";
import type { CountryId, InterventionId, RegionId } from "../sim/state/ids";
import { GAMEBUILDERS_DEMO_SCENARIO } from "../sim/state/gameBuildersDemoScenario";
import {
  advanceDemoRecord,
  createDemoRunRecord,
  submitIntervention,
} from "./demoGame";

const PLAYER_COUNTRY_ID = GAMEBUILDERS_DEMO_SCENARIO.playerCountryId;

if (PLAYER_COUNTRY_ID === null) {
  throw new Error("GameBuilders demo requires a player CountryId.");
}

const PLAYER_ID: CountryId = PLAYER_COUNTRY_ID;

type DemoSpeed = 1 | 2 | 4;

const SPEED_INTERVAL_MS: Readonly<Record<DemoSpeed, number>> = {
  1: 900,
  2: 450,
  4: 225,
};

const MAJOR_EVENT_TYPES = new Set([
  "COUP_ATTEMPT_STARTED",
  "REBELLION_STARTED",
  "CONFLICT_RESOLVED",
  "CIVIL_WAR_STARTED",
  "GOVERNMENT_TRANSITIONED",
  "ORDER_CONSOLIDATION_STARTED",
  "ORDER_CONSOLIDATED",
  "STATE_DISSOLVED",
]);

const REGIME_LABELS: Readonly<Record<RegimeClassification, string>> = {
  monarchy: "왕정",
  republic: "공화정",
  democracy: "민주주의",
  communism: "공산주의",
  dictatorship: "독재정",
  theocracy: "신정",
  other: "혼합 제도",
};

const RULE_LABELS: Readonly<Record<string, string>> = {
  rulerVeto: "군주 거부권",
  legislatureRequired: "입법부 승인",
  suffrage: "참정권",
  landOwnership: "토지 소유",
  productiveProperty: "생산수단 소유",
  laborOrganization: "노동조합",
  pressFreedom: "언론 자유",
  politicalCompetition: "정치 경쟁",
};

const RULE_VALUE_LABELS: Readonly<Record<string, string>> = {
  true: "있음",
  false: "없음",
  none: "없음",
  elite: "엘리트",
  property: "재산 보유자",
  broad: "광범위",
  universal: "보통 선거",
  feudal: "봉건",
  private: "사유",
  communal: "공동",
  state: "국유",
  illegal: "불법",
  restricted: "제한",
  legal: "합법",
  censored: "검열",
  free: "자유",
  banned: "금지",
  plural: "다원",
  mixed: "혼합",
  publicOnly: "공공 소유",
};

function asObject(value: unknown): Readonly<Record<string, unknown>> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : null;
}

function payloadString(event: GameEvent, key: string): string | null {
  const payload = asObject(event.payload);
  const value = payload?.[key];
  return typeof value === "string" ? value : null;
}

function payloadNumber(event: GameEvent, key: string): number | null {
  const payload = asObject(event.payload);
  const value = payload?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(
    value,
  );
}

function formatDate(date: RunRecord["world"]["date"]): string {
  return `${date.year}.${String(date.month).padStart(2, "0")}.${String(date.day).padStart(2, "0")}`;
}

function controllerLabel(
  controller: PresentationLandHex["controller"],
): string {
  switch (controller.kind) {
    case "country":
      return "국가 통제";
    case "faction":
      return "세력 통제";
    case "uncontrolled":
      return "무주지";
  }
}

function controllerClass(
  controller: PresentationLandHex["controller"],
): string {
  return `hex-${controller.kind}`;
}

function severityClass(band: AgendaSeverityBand | undefined): string {
  return `severity-${band ?? "low"}`;
}

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

function eventLabel(
  event: GameEvent,
  scenario: typeof GAMEBUILDERS_DEMO_SCENARIO,
): {
  readonly title: string;
  readonly detail: string;
  readonly crisis: boolean;
} {
  const interventionId = payloadString(
    event,
    "interventionId",
  ) as InterventionId | null;
  const interventionName =
    interventionId === null
      ? null
      : (scenario.interventionCatalog[interventionId]?.name ?? interventionId);

  switch (event.type) {
    case "TICK_ADVANCED":
      return {
        title: "하루가 지났습니다",
        detail: `시뮬레이션 ${payloadNumber(event, "nextTick") ?? event.tick}일차`,
        crisis: false,
      };
    case "INTERVENTION_STARTED":
      return {
        title: `${interventionName ?? "정책 개입"} 시작`,
        detail: `국고 ${formatAmount(payloadNumber(event, "treasuryCost") ?? 0)} 사용 · ${payloadNumber(event, "durationDays") ?? 0}일 후 완료`,
        crisis: false,
      };
    case "INTERVENTION_COMPLETED":
      return {
        title: `${interventionName ?? "정책 개입"} 완료`,
        detail: "선언된 완료 효과가 국가 상태에 반영되었습니다.",
        crisis: false,
      };
    case "INTERVENTION_REJECTED":
      return {
        title: `${interventionName ?? "정책 개입"} 거부`,
        detail: "현재 국고·행정 여력·제도 조건 중 하나를 충족하지 못했습니다.",
        crisis: false,
      };
    case "TREASURY_CHANGED": {
      const delta = payloadNumber(event, "delta") ?? 0;
      return {
        title: delta < 0 ? "국고 감소" : "국고 증가",
        detail: `변동 ${delta >= 0 ? "+" : ""}${formatAmount(delta)}`,
        crisis: false,
      };
    }
    case "RESOURCE_SHORTAGE_CHANGED":
      return {
        title: "지역 자원 부족 변화",
        detail: `희소성 ${formatAmount(payloadNumber(event, "nextScarcity") ?? 0)}`,
        crisis: false,
      };
    case "FACTION_STRATEGY_CHANGED":
      return {
        title: "세력 전략 변화",
        detail: "EventStore에 기록된 세력 행동입니다.",
        crisis: false,
      };
    case "COUP_ATTEMPT_STARTED":
      return {
        title: "쿠데타 시도 발생",
        detail: "실제 T018 조건이 충족되어 정치 위기가 시작되었습니다.",
        crisis: true,
      };
    case "REBELLION_STARTED":
      return {
        title: "반란 발생",
        detail: "실제 T018 조건이 충족되어 반란 Conflict가 시작되었습니다.",
        crisis: true,
      };
    case "LAND_HEX_CONTROL_CHANGED":
      return {
        title: "영토 통제 변화",
        detail: "LandHex controller projection이 실제로 바뀌었습니다.",
        crisis: false,
      };
    case "CONFLICT_RESOLVED":
      return {
        title: "Conflict 해결",
        detail: "EventStore에 기록된 실제 Conflict 결과입니다.",
        crisis: true,
      };
    case "ORDER_CONSOLIDATED":
      return {
        title: "새 질서가 공고해졌습니다",
        detail: "authoritative RunOutcome의 승리 조건이 충족되었습니다.",
        crisis: true,
      };
    case "STATE_DISSOLVED":
      return {
        title: "국가 기능이 해체되었습니다",
        detail: "authoritative RunOutcome의 패배 조건이 충족되었습니다.",
        crisis: true,
      };
    default:
      return {
        title: event.type.replaceAll("_", " "),
        detail: "EventStore에 기록된 상태 변화",
        crisis: false,
      };
  }
}

function formatFailure(reason: {
  readonly kind: string;
  readonly required?: number;
}): string {
  switch (reason.kind) {
    case "INSUFFICIENT_TREASURY":
      return `국고 부족 (필요 ${formatAmount(reason.required ?? 0)})`;
    case "INSUFFICIENT_ADMINISTRATIVE_HEADROOM":
      return `행정 여력 부족 (필요 ${formatAmount(reason.required ?? 0)})`;
    case "PREREQUISITE_NOT_MET":
      return "제도 선행 조건 미충족";
    case "NO_COMPLETION_EFFECT_CHANGE":
      return "현재 상태에서 바뀌는 완료 효과 없음";
    case "TERMINAL_RUN":
      return "이미 종료된 게임";
    default:
      return "현재 조건에서 사용할 수 없음";
  }
}

function effectLabel(effect: InterventionEffect): string {
  if (effect.kind === "regionResourceProductionCapacityDelta") {
    return `지역 생산능력 ${effect.delta >= 0 ? "+" : ""}${effect.delta}`;
  }
  if (effect.kind === "factionGrievanceDelta") {
    return `세력 불만 ${effect.delta >= 0 ? "+" : ""}${effect.delta}`;
  }
  if (effect.kind === "factionOrganizationDelta") {
    return `세력 조직 ${effect.delta >= 0 ? "+" : ""}${effect.delta}`;
  }
  return `${RULE_LABELS[effect.rule] ?? effect.rule} 변경`;
}

function HexMap({
  presentation,
  selectedRegionId,
  onSelectRegion,
}: {
  readonly presentation: PresentationState;
  readonly selectedRegionId: RegionId | null;
  readonly onSelectRegion: (regionId: RegionId) => void;
}) {
  const size = 38;
  const pointsFor = (q: number, r: number): string => {
    const x = size * Math.sqrt(3) * (q + r / 2) + 210;
    const y = size * 1.5 * r + 150;
    return Array.from({ length: 6 }, (_, index) => {
      const angle = (Math.PI / 180) * (60 * index - 30);
      return `${x + size * Math.cos(angle)},${y + size * Math.sin(angle)}`;
    }).join(" ");
  };
  const regionNames = new Map(
    presentation.regions.map((region) => [region.regionId, region.name]),
  );

  return (
    <div className="map-wrap">
      <svg
        className="hex-map"
        viewBox="0 0 520 360"
        role="img"
        aria-label="아르켄 왕국 LandHex 전략 지도"
      >
        <rect
          className="map-paper"
          x="0"
          y="0"
          width="520"
          height="360"
          rx="18"
        />
        {presentation.landHexes.map((hex) => (
          <g key={hex.landHexId}>
            <polygon
              className={`hex ${controllerClass(hex.controller)}${selectedRegionId === hex.regionId ? " hex-selected" : ""}`}
              points={pointsFor(hex.coordinate.q, hex.coordinate.r)}
              tabIndex={0}
              role="button"
              aria-label={`${regionNames.get(hex.regionId) ?? hex.regionId} · ${controllerLabel(hex.controller)}`}
              onClick={() => onSelectRegion(hex.regionId)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectRegion(hex.regionId);
                }
              }}
            />
            <text
              className="hex-label"
              x={
                size *
                  Math.sqrt(3) *
                  (hex.coordinate.q + hex.coordinate.r / 2) +
                210
              }
              y={size * 1.5 * hex.coordinate.r + 155}
            >
              {regionNames.get(hex.regionId)?.slice(0, 3) ?? "지역"}
            </text>
          </g>
        ))}
      </svg>
      <div className="map-legend" aria-label="지도 범례">
        <span>
          <i className="legend-swatch swatch-country" /> 국가
        </span>
        <span>
          <i className="legend-swatch swatch-faction" /> 세력
        </span>
        <span>
          <i className="legend-swatch swatch-uncontrolled" /> 무주지
        </span>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className={`metric ${tone ?? ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AgendaCard({
  agenda,
  scenario,
}: {
  readonly agenda: PrimaryAgenda;
  readonly scenario: typeof GAMEBUILDERS_DEMO_SCENARIO;
}) {
  const regionNames = new Map(
    scenario.initialRegions.map((region) => [region.id, region.name]),
  );
  const factionNames = new Map(
    scenario.initialFactions.map((faction) => [faction.id, faction.name]),
  );

  return (
    <article className={`agenda-card ${severityClass(agenda.severityBand)}`}>
      <div className="agenda-card-head">
        <span className="agenda-kind">{agenda.severityBand ?? "low"}</span>
        <span className="agenda-trend">{trendLabel(agenda.trend)}</span>
      </div>
      <h3>{agenda.title}</h3>
      <p className="agenda-meta">
        {agenda.affectedRegionIds
          .map((id) => regionNames.get(id) ?? id)
          .join(" · ") || "전국"}
        {agenda.involvedFactionIds.length > 0
          ? ` · ${agenda.involvedFactionIds.map((id) => factionNames.get(id) ?? id).join(" · ")}`
          : ""}
      </p>
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

function RegionInspector({
  region,
}: {
  readonly region: PresentationRegion | null;
}) {
  if (region === null)
    return <p className="muted">지도를 클릭하면 지역 정보가 나타납니다.</p>;

  return (
    <div className="region-inspector">
      <div className="inspector-title">
        <span className="eyebrow">선택 지역</span>
        <h3>{region.name}</h3>
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
          <b>물리 통제</b>
          {region.control.kind}
        </span>
      </div>
      <div className="ideology-list">
        {region.politicalInfluence.slice(0, 3).map((ideology) => (
          <div key={ideology.ideologyId}>
            <span>{ideology.ideologyId}</span>
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

function TitleScreen({ onStart }: { readonly onStart: () => void }) {
  return (
    <main className="title-shell">
      <div className="title-ornament" aria-hidden="true">
        ✦
      </div>
      <p className="eyebrow">아르켄 왕국 · 1897년</p>
      <h1>
        내 왕국에
        <br />
        혁명이 너무 많다
      </h1>
      <p className="title-tagline">정권은 무너져도, 국가는 계속된다.</p>
      <p className="title-copy">
        국고는 줄고, 철산 공업주는 흔들립니다. 법과 제도를 바꾸고 시간을
        진행하며, 실제 세력과 국가의 반응을 지켜보세요.
      </p>
      <button
        className="primary-button title-start"
        type="button"
        onClick={onStart}
      >
        새 게임 시작 <span aria-hidden="true">→</span>
      </button>
      <div className="title-rule" />
      <p className="title-footnote">
        결정은 행동으로 기록되고, 위기는 조건에서 발생합니다.
      </p>
    </main>
  );
}

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
  const regime =
    policyState === undefined ? null : deriveRegimeClassification(policyState);
  const selectedRegion =
    presentation.regions.find(
      (region) => region.regionId === selectedRegionId,
    ) ??
    presentation.regions[0] ??
    null;
  const interventions = Object.values(
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
    if (recordRef.current.world.run.outcome.status !== "active") return;
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
    const next = advanceDemoRecord(current, days);
    recordRef.current = next;
    setRecord(next);
    setFlowNotice(`수동 보조 진행 · ${next.world.tick}일차`);
    playTone("confirm");
  };

  const submitAction = (interventionId: InterventionId) => {
    clearClock();
    setIsPlaying(false);
    const next = submitIntervention(recordRef.current, interventionId);
    recordRef.current = next;
    setRecord(next);
    setFlowNotice("행동 제출 완료 · 안전을 위해 시간이 일시정지되었습니다.");
    playTone("confirm");
  };

  return (
    <main className="game-shell">
      <header className="game-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            ✦
          </span>
          <div>
            <p className="eyebrow">국가 연속성 기록</p>
            <h1>내 왕국에 혁명이 너무 많다</h1>
          </div>
        </div>
        <div className="run-meta">
          <strong>{playerCountry?.name ?? "아르켄 왕국"}</strong>
          <span>
            {formatDate(record.world.date)} · {record.world.tick}일차
          </span>
        </div>
        <div className="header-actions">
          <button
            className="quiet-button"
            type="button"
            aria-pressed={soundEnabled}
            onClick={() => setSoundEnabled((enabled) => !enabled)}
          >
            소리 {soundEnabled ? "켜짐" : "꺼짐"}
          </button>
          <button className="quiet-button" type="button" onClick={onReset}>
            타이틀로
          </button>
        </div>
      </header>

      <section className="metric-strip" aria-label="국가 핵심 지표">
        <Metric
          label="국고"
          value={formatAmount(playerCountry?.treasury ?? 0)}
          tone="metric-gold"
        />
        <Metric
          label="정통성"
          value={formatAmount(playerCountry?.legitimacy ?? 0)}
        />
        <Metric
          label="국가역량"
          value={formatAmount(playerCountry?.stateCapacity ?? 0)}
        />
        <Metric
          label="불안"
          value={formatAmount(playerCountry?.instability ?? 0)}
          tone="metric-danger"
        />
        <Metric
          label="국가 존속"
          value={formatAmount(playerCountry?.stateContinuity ?? 0)}
        />
        <div className="time-controls" aria-label="시간 진행">
          <div className="playback-buttons">
            <button
              className="play-button"
              type="button"
              aria-pressed={isPlaying}
              onClick={togglePlaying}
            >
              {isPlaying ? "일시정지" : "재생"}
            </button>
            {([1, 2, 4] as const).map((preset) => (
              <button
                className={
                  speed === preset ? "speed-button active" : "speed-button"
                }
                key={preset}
                type="button"
                aria-pressed={speed === preset}
                onClick={() => {
                  setSpeed(preset);
                  setFlowNotice(`${preset}x 속도 선택`);
                }}
              >
                {preset}x
              </button>
            ))}
          </div>
          <label className="auto-pause-toggle">
            <input
              type="checkbox"
              checked={autoPauseMajorEvents}
              onChange={(event) =>
                setAutoPauseMajorEvents(event.target.checked)
              }
            />
            중요 사건 시 자동 일시정지
          </label>
          <span className="time-status" role="status">
            {flowNotice}
          </span>
          <div className="manual-jumps">
            <span>보조</span>
            <button type="button" onClick={() => advance(1)}>
              +1일
            </button>
            <button type="button" onClick={() => advance(7)}>
              +7일
            </button>
            <button type="button" onClick={() => advance(30)}>
              +30일
            </button>
          </div>
        </div>
      </section>

      {crisisEvent === undefined ? null : (
        <section className="crisis-banner" role="status">
          <span className="crisis-stamp">실제 사건</span>
          <div>
            <strong>
              {eventLabel(crisisEvent, GAMEBUILDERS_DEMO_SCENARIO).title}
            </strong>
            <span>
              {eventLabel(crisisEvent, GAMEBUILDERS_DEMO_SCENARIO).detail}
            </span>
          </div>
          <small>정권의 위기 ≠ 국가의 자동 종료</small>
        </section>
      )}

      <div className="game-grid">
        <aside className="panel actions-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">정책 서류</span>
              <h2>지금 할 수 있는 일</h2>
            </div>
            <span className="panel-count">
              {interventions.filter((item) => item.feasibility.feasible).length}{" "}
              가능
            </span>
          </div>
          <p className="panel-intro">
            행동은 다음 날짜의 공통 ActionRecord로 제출됩니다.
          </p>
          <div className="action-list">
            {interventions.map(({ definition, feasibility }) => (
              <article
                className={`action-card${feasibility.feasible ? " action-available" : " action-locked"}`}
                key={definition.id}
              >
                <div className="action-card-top">
                  <span className="action-category">행정 개입</span>
                  <span className="action-status">
                    {feasibility.feasible ? "가능" : "대기"}
                  </span>
                </div>
                <h3>{definition.name}</h3>
                <div className="action-facts">
                  <span>
                    국고 <b>{formatAmount(definition.treasuryCost)}</b>
                  </span>
                  <span>
                    행정 <b>{formatAmount(definition.administrativeLoad)}</b>
                  </span>
                  <span>
                    기간 <b>{definition.durationDays}일</b>
                  </span>
                </div>
                {definition.completionEffects?.length ? (
                  <p className="action-effect">
                    완료 효과 ·{" "}
                    {definition.completionEffects.map(effectLabel).join(" · ")}
                  </p>
                ) : null}
                {feasibility.feasible ? (
                  <button
                    className="action-button"
                    type="button"
                    onClick={() => submitAction(definition.id)}
                  >
                    실행 기록 <span aria-hidden="true">↗</span>
                  </button>
                ) : (
                  <p className="locked-reason">
                    {feasibility.reasons.map(formatFailure).join(" · ")}
                  </p>
                )}
              </article>
            ))}
          </div>
          <div className="institution-box">
            <div className="panel-heading compact-heading">
              <h2>현재 제도</h2>
              {regime ? (
                <span className="derived-label">
                  파생 · {REGIME_LABELS[regime.classification]}
                </span>
              ) : null}
            </div>
            <div className="rule-list">
              {policyState === undefined
                ? null
                : Object.entries(policyState.institutionalRules).map(
                    ([rule, value]) => (
                      <div key={rule}>
                        <span>{RULE_LABELS[rule] ?? rule}</span>
                        <b>
                          {RULE_VALUE_LABELS[String(value)] ?? String(value)}
                        </b>
                      </div>
                    ),
                  )}
            </div>
          </div>
        </aside>

        <section className="panel map-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">실제 LandHex projection</span>
              <h2>왕국의 표면</h2>
            </div>
            <span className="map-date">{formatDate(record.world.date)}</span>
          </div>
          <HexMap
            presentation={presentation}
            selectedRegionId={selectedRegionId}
            onSelectRegion={setSelectedRegionId}
          />
          <RegionInspector region={selectedRegion} />
        </section>

        <aside className="panel agenda-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Renderer-neutral read model</span>
              <h2>국가 의제</h2>
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
                  scenario={GAMEBUILDERS_DEMO_SCENARIO}
                />
              ))
            )}
          </div>
          <div className="thesis-note">
            <span className="eyebrow">플레이 원칙</span>
            <p>
              정권이 바뀌어도 국가의 역사는 계속됩니다. 먼저 무엇이 흔들리는지
              읽으세요.
            </p>
          </div>
        </aside>
      </div>

      <section className="panel event-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">authoritative history</span>
            <h2>최근 기록</h2>
          </div>
          <span className="panel-count">
            EventStore {record.eventStore.events.length}
          </span>
        </div>
        <div className="event-list">
          {visibleEvents.length === 0 ? (
            <p className="empty-state">아직 기록된 사건이 없습니다.</p>
          ) : (
            visibleEvents.map((event) => {
              const mapped = eventLabel(event, GAMEBUILDERS_DEMO_SCENARIO);
              return (
                <article
                  className={`event-row${mapped.crisis ? " event-crisis" : ""}`}
                  key={event.id}
                >
                  <time>{event.tick}일</time>
                  <div>
                    <strong>{mapped.title}</strong>
                    <span>{mapped.detail}</span>
                  </div>
                  <small>
                    {event.visibility === "important" ? "중요" : event.type}
                  </small>
                </article>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}

export function App() {
  const [started, setStarted] = useState(false);
  return started ? (
    <GameScreen onReset={() => setStarted(false)} />
  ) : (
    <TitleScreen onStart={() => setStarted(true)} />
  );
}
