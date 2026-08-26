import type { DemoSpeed } from "./demoSpeed";

export function TimeControls({
  isPlaying,
  speed,
  autoSlowCrises,
  flowNotice,
  onTogglePlaying,
  onSetSpeed,
  onSetAutoSlow,
  onAdvance,
}: {
  readonly isPlaying: boolean;
  readonly speed: DemoSpeed;
  readonly autoSlowCrises: boolean;
  readonly flowNotice: string;
  readonly onTogglePlaying: () => void;
  readonly onSetSpeed: (speed: DemoSpeed) => void;
  readonly onSetAutoSlow: (enabled: boolean) => void;
  readonly onAdvance: (days: number) => void;
}) {
  return (
    <div className="time-controls" aria-label="시간 진행">
      <div className="playback-buttons">
        <button
          className="play-button"
          type="button"
          aria-pressed={isPlaying}
          onClick={onTogglePlaying}
        >
          {isPlaying ? "일시정지" : "재생"}
        </button>
        {([1, 2, 3] as const).map((preset) => (
          <button
            className={
              speed === preset ? "speed-button active" : "speed-button"
            }
            key={preset}
            type="button"
            aria-pressed={speed === preset}
            onClick={() => onSetSpeed(preset)}
          >
            {preset}x
          </button>
        ))}
      </div>
      <label className="auto-slow-toggle" data-auto-slow-scope="crises">
        <input
          type="checkbox"
          checked={autoSlowCrises}
          onChange={(event) => onSetAutoSlow(event.target.checked)}
        />
        위기 발생 시 자동 감속
      </label>
      <span className="time-status" role="status" aria-live="polite">
        {flowNotice}
      </span>
      <div className="manual-jumps manual-jumps-desktop">
        <span>보조 진행</span>
        <button type="button" onClick={() => onAdvance(1)}>
          +1일
        </button>
        <button type="button" onClick={() => onAdvance(7)}>
          +7일
        </button>
        <button type="button" onClick={() => onAdvance(30)}>
          +30일
        </button>
      </div>
      <details className="manual-jumps-mobile">
        <summary>보조 진행</summary>
        <div>
          <button type="button" onClick={() => onAdvance(1)}>
            +1일
          </button>
          <button type="button" onClick={() => onAdvance(7)}>
            +7일
          </button>
          <button type="button" onClick={() => onAdvance(30)}>
            +30일
          </button>
        </div>
      </details>
    </div>
  );
}
