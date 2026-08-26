import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";

import { AudioManager, type AudioPlaybackResult } from "./audio/audioManager";
import {
  TMR_AUDIO_ASSET_MANIFEST,
  type AudioAssetManifestEntry,
} from "./audio/audioAssetManifest";
import {
  getSoundCueDefinition,
  type SoundCueId,
} from "./audio/soundCueRegistry";

export interface AudioGalleryProps {
  /** Inject a screen-owned manager for integration tests or a future game screen. */
  readonly audioManager?: AudioManager;
  readonly className?: string;
}

const CATEGORY_LABELS: Readonly<
  Record<AudioAssetManifestEntry["category"], string>
> = {
  ui: "UI",
  policy: "정책",
  institution: "제도",
  project: "사업",
  crisis: "위기",
  territory: "영토",
  capital: "수도",
  border: "국경",
  chronicle: "연대기",
  ambience: "분위기",
};

function formatDuration(duration: number): string {
  return `${duration.toFixed(2)}초`;
}

function playbackStatusMessage(result: AudioPlaybackResult): string {
  switch (result.status) {
    case "played":
      return result.fallbackUsed === true
        ? "재생됨 · procedural fallback"
        : "재생됨 · WAV asset";
    case "muted":
      return "음소거 상태입니다.";
    case "disabled":
      return "오디오가 비활성화되어 있습니다.";
    case "unavailable":
      return "이 브라우저에서 오디오를 사용할 수 없습니다.";
    case "autoplay-blocked":
      return "브라우저가 오디오를 차단했습니다. 클릭으로 다시 시도하세요.";
    case "missing-asset":
      return "asset을 불러오지 못했습니다.";
    case "already-playing":
      return "이미 재생 중입니다.";
    case "not-ambience":
      return "분위기 cue가 아닙니다.";
    case "unknown-cue":
      return "등록되지 않은 cue입니다.";
    default:
      return "재생 상태를 확인할 수 없습니다.";
  }
}

function startupStatusMessage(status: string): string {
  switch (status) {
    case "ready":
      return "오디오 준비 완료. 각 cue의 재생 버튼을 눌러 확인하세요.";
    case "disabled":
      return "오디오가 비활성화되어 있습니다.";
    case "autoplay-blocked":
      return "브라우저가 오디오를 차단했습니다. 다시 클릭하세요.";
    case "unavailable":
      return "이 브라우저에서 오디오를 사용할 수 없습니다.";
    default:
      return "이 브라우저에서 오디오를 사용할 수 없습니다.";
  }
}

/** Standalone QA surface; it is intentionally not mounted by App.tsx yet. */
export function AudioGallery({
  audioManager: suppliedAudioManager,
  className,
}: AudioGalleryProps): JSX.Element {
  const managerRef = useRef<AudioManager | null>(null);
  const ownsManagerRef = useRef(false);
  const disposeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  if (managerRef.current === null) {
    managerRef.current = suppliedAudioManager ?? new AudioManager();
    ownsManagerRef.current = suppliedAudioManager === undefined;
  }
  const manager = managerRef.current;
  const [status, setStatus] = useState(
    "오디오 시작 버튼을 눌러 브라우저 오디오를 허용하세요.",
  );
  const [playingCueId, setPlayingCueId] = useState<SoundCueId | null>(null);

  useEffect(() => {
    if (disposeTimerRef.current !== null) {
      clearTimeout(disposeTimerRef.current);
      disposeTimerRef.current = null;
    }
    return () => {
      if (!ownsManagerRef.current) return;
      disposeTimerRef.current = setTimeout(() => {
        if (managerRef.current === manager) {
          manager.dispose();
          managerRef.current = null;
          ownsManagerRef.current = false;
        }
        disposeTimerRef.current = null;
      }, 0);
    };
  }, [manager]);

  const startAudio = async (): Promise<void> => {
    const result = await manager.startFromUserGesture();
    setStatus(startupStatusMessage(result.status));
  };

  const playEntry = async (entry: AudioAssetManifestEntry): Promise<void> => {
    if (entry.loop && playingCueId === entry.cueId) {
      manager.stopAmbience(entry.cueId, 0);
      setPlayingCueId(null);
      setStatus(`${entry.cueId} 정지`);
      return;
    }

    const startup = await manager.startFromUserGesture();
    if (startup.status !== "ready") {
      setPlayingCueId(null);
      setStatus(startupStatusMessage(startup.status));
      return;
    }

    setPlayingCueId(entry.cueId);
    const result = entry.loop
      ? await manager.startAmbience(entry.cueId, { fadeMs: 180 })
      : await manager.playCue(entry.cueId);
    setStatus(`${entry.cueId}: ${playbackStatusMessage(result)}`);
    if (!entry.loop || result.status !== "played") setPlayingCueId(null);
  };

  return (
    <section className={className} aria-label="Audio Gallery">
      <header>
        <h2>Audio Gallery</h2>
        <p>
          project-authored WAV 18개 · file primary · procedural fallback 보존
        </p>
        <button type="button" onClick={startAudio}>
          오디오 시작
        </button>
        <p role="status" aria-live="polite">
          {status}
        </p>
      </header>
      <ul>
        {TMR_AUDIO_ASSET_MANIFEST.map((entry) => {
          const definition = getSoundCueDefinition(entry.cueId);
          const filePrimary = definition?.asset.kind === "file";
          const isPlaying = playingCueId === entry.cueId;
          return (
            <li key={entry.cueId}>
              <div>
                <strong>{definition?.label ?? entry.cueId}</strong>
                <span>{entry.cueId}</span>
              </div>
              <dl>
                <div>
                  <dt>category</dt>
                  <dd>{CATEGORY_LABELS[entry.category]}</dd>
                </div>
                <div>
                  <dt>duration</dt>
                  <dd>{formatDuration(entry.duration)}</dd>
                </div>
                <div>
                  <dt>asset</dt>
                  <dd>
                    {filePrimary
                      ? `file: ${entry.file} · procedural fallback`
                      : "procedural"}
                  </dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => playEntry(entry)}
                aria-pressed={entry.loop ? isPlaying : undefined}
              >
                {entry.loop && isPlaying ? "정지" : "재생"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
