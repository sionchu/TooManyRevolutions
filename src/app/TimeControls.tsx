import type { DemoSpeed } from "./demoSpeed";

export function TimeControls({
  isPlaying,
  speed,
  autoPauseMajorEvents,
  flowNotice,
  onTogglePlaying,
  onSetSpeed,
  onSetAutoPause,
  onAdvance,
}: {
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
      <label className="auto-pause-toggle">
        <input
          type="checkbox"
          checked={autoPauseMajorEvents}
          onChange={(event) => onSetAutoPause(event.target.checked)}
        />
        중요 사건 시 자동 일시정지
      </label>
      <span className="time-status" role="status" aria-live="polite">
        {flowNotice}
      </span>
      <div className="manual-jumps">
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
    </div>
  );
}
