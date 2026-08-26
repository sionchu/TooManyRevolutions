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
  className,
  label,
  value,
  tone,
}: {
  readonly className?: string;
  readonly label: string;
  readonly value: string;
  readonly tone?: string;
}) {
  return (
    <div
      className={`metric metric-qualitative ${tone ?? ""} ${className ?? ""}`}
    >
      <span className="metric-label">{label}</span>
      <span className="metric-signal" aria-hidden="true" />
      <strong>{value}</strong>
    </div>
  );
}

export function MetricStrip({
  playerCountry,
  isPlaying,
  speed,
  autoSlowCrises,
  flowNotice,
  onTogglePlaying,
  onSetSpeed,
  onSetAutoSlow,
  onAdvance,
}: {
  readonly playerCountry: Country | undefined;
  readonly isPlaying: boolean;
  readonly speed: DemoSpeed;
  readonly autoSlowCrises: boolean;
  readonly flowNotice: string;
  readonly onTogglePlaying: () => void;
  readonly onSetSpeed: (speed: DemoSpeed) => void;
  readonly onSetAutoSlow: (enabled: boolean) => void;
  readonly onAdvance: (days: number) => void;
}) {
  const treasury = playerCountry?.treasury ?? 0;
  const legitimacy = playerCountry?.legitimacy ?? 0;
  const capacity = playerCountry?.stateCapacity ?? 0;
  const instability = playerCountry?.instability ?? 0;
  const continuity = playerCountry?.stateContinuity ?? 0;
  return (
    <section className="metric-strip" aria-label="국가 상태와 시간 HUD">
      <div className="state-signal-group" aria-label="현재 국가 상태">
        <Metric
          label="재정"
          value={qualitativeStatus(treasury, [0, "압박", 70, "여유", "제한"])}
          tone="metric-gold"
        />
        <Metric
          label={PLAYER_COPY.metrics.legitimacy}
          value={qualitativeStatus(legitimacy, [
            35,
            "취약",
            70,
            "안정",
            "경합",
          ])}
        />
        <Metric
          label={PLAYER_COPY.metrics.stateCapacity}
          value={qualitativeStatus(capacity, [35, "병목", 70, "여력", "가동"])}
        />
        <Metric
          label={PLAYER_COPY.metrics.instability}
          value={qualitativeStatus(instability, [
            35,
            "낮음",
            70,
            "고조",
            "상승",
          ])}
          tone="metric-danger"
        />
      </div>
      <details className="metric-details" data-exact-number-details>
        <summary>상세 수치</summary>
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
        autoSlowCrises={autoSlowCrises}
        flowNotice={flowNotice}
        onTogglePlaying={onTogglePlaying}
        onSetSpeed={onSetSpeed}
        onSetAutoSlow={onSetAutoSlow}
        onAdvance={onAdvance}
      />
    </section>
  );
}
