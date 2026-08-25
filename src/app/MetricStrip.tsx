import type { Country } from "../sim/state/country";
import { PLAYER_COPY } from "../presentation/design/copyRegistry.ko";
import type { DemoSpeed } from "./demoSpeed";
import { TimeControls } from "./TimeControls";
import { formatAmount } from "./gamePresentation";

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
    <div className={`metric ${tone ?? ""}`}>
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
  return (
    <section className="metric-strip" aria-label="국가 핵심 지표">
      <Metric
        label={PLAYER_COPY.metrics.treasury}
        value={formatAmount(playerCountry?.treasury ?? 0)}
        tone="metric-gold"
      />
      <Metric
        label={PLAYER_COPY.metrics.legitimacy}
        value={formatAmount(playerCountry?.legitimacy ?? 0)}
      />
      <Metric
        label={PLAYER_COPY.metrics.stateCapacity}
        value={formatAmount(playerCountry?.stateCapacity ?? 0)}
      />
      <Metric
        label={PLAYER_COPY.metrics.instability}
        value={formatAmount(playerCountry?.instability ?? 0)}
        tone="metric-danger"
      />
      <Metric
        label={PLAYER_COPY.metrics.stateContinuity}
        value={formatAmount(playerCountry?.stateContinuity ?? 0)}
      />
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
