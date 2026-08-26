import type { Country } from "../sim/state/country";
import { PLAYER_COPY } from "../presentation/design/copyRegistry.ko";
import type { DemoSpeed } from "./demoSpeed";
import { TimeControls } from "./TimeControls";
import { formatAmount } from "./gamePresentation";

function qualitativeStatus(
  value: number,
  thresholds: readonly [number, string, number, string, string],
): string {
  const [low, lowLabel, high, highLabel, stableLabel] = thresholds;
  if (value <= low) return lowLabel;
  if (value >= high) return highLabel;
  return stableLabel;
}

function Metric({
  label,
  value,
  tone,
}: {
  readonly label: string;
  readonly value: string;
  readonly tone?: string;
}) {
  return (
    <div className={`metric metric-qualitative ${tone ?? ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function MetricStrip({
  playerCountry,
  isPlaying,
  speed,
  autoPauseMajorEvents,
  flowNotice,
  onTogglePlaying,
  onSetSpeed,
  onSetAutoPause,
  onAdvance,
}: {
  readonly playerCountry: Country | undefined;
  readonly isPlaying: boolean;
  readonly speed: DemoSpeed;
  readonly autoPauseMajorEvents: boolean;
  readonly flowNotice: string;
  readonly onTogglePlaying: () => void;
  readonly onSetSpeed: (speed: DemoSpeed) => void;
  readonly onSetAutoPause: (enabled: boolean) => void;
  readonly onAdvance: (days: number) => void;
}) {
  const treasury = playerCountry?.treasury ?? 0;
  const legitimacy = playerCountry?.legitimacy ?? 0;
  const capacity = playerCountry?.stateCapacity ?? 0;
  const instability = playerCountry?.instability ?? 0;
  const continuity = playerCountry?.stateContinuity ?? 0;
  return (
    <section className="metric-strip" aria-label="국가 상태 HUD">
      <Metric
        label={PLAYER_COPY.metrics.treasury}
        value={qualitativeStatus(treasury, [
          0,
          "재정 압박",
          70,
          "재정 여유",
          "여유 제한",
        ])}
        tone="metric-gold"
      />
      <Metric
        label={PLAYER_COPY.metrics.legitimacy}
        value={qualitativeStatus(legitimacy, [
          35,
          "정통성 취약",
          70,
          "정통성 안정",
          "정통성 경합",
        ])}
      />
      <Metric
        label={PLAYER_COPY.metrics.stateCapacity}
        value={qualitativeStatus(capacity, [
          35,
          "행정 병목",
          70,
          "행정 여력",
          "행정 가동",
        ])}
      />
      <Metric
        label={PLAYER_COPY.metrics.instability}
        value={qualitativeStatus(instability, [
          35,
          "불안 낮음",
          70,
          "불안 고조",
          "불안 상승",
        ])}
        tone="metric-danger"
      />
      <Metric
        label={PLAYER_COPY.metrics.stateContinuity}
        value={qualitativeStatus(continuity, [
          35,
          "존속 위험",
          70,
          "존속 유지",
          "존속 경합",
        ])}
      />
      <details className="metric-details" data-exact-number-details>
        <summary>수치</summary>
        <div>
          <span>국고 {formatAmount(treasury)}</span>
          <span>정통성 {formatAmount(legitimacy)}</span>
          <span>국가역량 {formatAmount(capacity)}</span>
          <span>불안 {formatAmount(instability)}</span>
          <span>국가 존속 {formatAmount(continuity)}</span>
        </div>
      </details>
      <TimeControls
        isPlaying={isPlaying}
        speed={speed}
        autoPauseMajorEvents={autoPauseMajorEvents}
        flowNotice={flowNotice}
        onTogglePlaying={onTogglePlaying}
        onSetSpeed={onSetSpeed}
        onSetAutoPause={onSetAutoPause}
        onAdvance={onAdvance}
      />
    </section>
  );
}
