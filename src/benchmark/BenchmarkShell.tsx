import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";

import { FROZEN_WORLD_SCENE_BENCHMARK } from "./frozenWorldSceneSnapshot";
import type { WorldSceneModel } from "../presentation/worldSceneModel";

export interface BenchmarkCameraState {
  readonly x: number;
  readonly z: number;
  readonly zoom: number;
}

export interface BenchmarkRendererProps {
  readonly model: WorldSceneModel;
  readonly camera: BenchmarkCameraState;
  readonly onReady: (details: string) => void;
}

function useFrameMeter(renderer: string): string {
  const [summary, setSummary] = useState("측정 중…");
  useEffect(() => {
    let active = true;
    let last = performance.now();
    const samples: number[] = [];
    let frameHandle = 0;
    const sample = (now: number) => {
      if (!active) return;
      samples.push(now - last);
      last = now;
      if (samples.length >= 120) {
        const sorted = [...samples].sort((first, second) => first - second);
        const average =
          samples.reduce((total, value) => total + value, 0) / samples.length;
        const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? average;
        setSummary(
          `평균 ${Math.round(1000 / Math.max(average, 0.1))} FPS · p95 ${p95.toFixed(1)} ms`,
        );
        active = false;
        return;
      }
      frameHandle = requestAnimationFrame(sample);
    };
    frameHandle = requestAnimationFrame(sample);
    return () => {
      active = false;
      cancelAnimationFrame(frameHandle);
    };
  }, [renderer]);
  return summary;
}

function usePointerCamera(
  camera: BenchmarkCameraState,
  onChange: (next: BenchmarkCameraState) => void,
) {
  const pointerRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerRef.current;
    if (start === null || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    pointerRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    onChange({ ...camera, x: camera.x - dx * 0.018, z: camera.z + dy * 0.018 });
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerRef.current?.id === event.pointerId) pointerRef.current = null;
  };
  return { onPointerDown, onPointerMove, onPointerUp };
}

export function BenchmarkShell({
  renderer,
  render,
}: {
  readonly renderer: string;
  readonly render: (props: BenchmarkRendererProps) => ReactNode;
}) {
  const [camera, setCamera] = useState<BenchmarkCameraState>({
    x: 0,
    z: 0,
    zoom: 1,
  });
  const [ready, setReady] = useState("초기화 중…");
  const pointerHandlers = usePointerCamera(camera, setCamera);
  const fpsSummary = useFrameMeter(renderer);
  const model = FROZEN_WORLD_SCENE_BENCHMARK.after;
  const counts = useMemo(
    () => ({
      hexes: model.hexes.length,
      settlements: model.settlements.length,
      routes: model.routes.filter((route) => route.active).length,
      factions: model.factionPresence.length,
      conflicts: model.conflicts.length,
      projects: model.projects.length,
    }),
    [model],
  );
  return (
    <main className="benchmark-page">
      <header className="benchmark-header">
        <div>
          <p className="eyebrow">
            TMR renderer spike · frozen authoritative snapshot
          </p>
          <h1>
            {renderer === "r3f" ? "Three.js + React Three Fiber" : "PixiJS v8"}
          </h1>
          <p>
            Day {model.tick} · 동일한 LandHex / Conflict / route / project
            projection
          </p>
        </div>
        <div className="benchmark-metrics" aria-label="benchmark metrics">
          <span data-benchmark-ready={ready}>{ready}</span>
          <span data-benchmark-fps>{fpsSummary}</span>
          <span data-benchmark-counts>
            {counts.hexes} hex · {counts.settlements} 수도 · {counts.routes}{" "}
            경로 · {counts.factions} 조직 · {counts.conflicts} 충돌 ·{" "}
            {counts.projects} 프로젝트
          </span>
        </div>
      </header>
      <section
        className="benchmark-viewport"
        data-renderer={renderer}
        data-camera-x={camera.x.toFixed(2)}
        data-camera-z={camera.z.toFixed(2)}
        data-camera-zoom={camera.zoom.toFixed(2)}
        onPointerDown={pointerHandlers.onPointerDown}
        onPointerMove={pointerHandlers.onPointerMove}
        onPointerUp={pointerHandlers.onPointerUp}
        onWheel={(event) => {
          event.preventDefault();
          setCamera((current) => ({
            ...current,
            zoom: Math.max(
              0.75,
              Math.min(1.5, current.zoom * (event.deltaY < 0 ? 1.08 : 0.93)),
            ),
          }));
        }}
      >
        {render({ model, camera, onReady: setReady })}
        <div className="benchmark-input-hint">드래그: 이동 · 휠/핀치: 확대</div>
      </section>
      <footer className="benchmark-footnote">
        <span>
          동일 snapshot 전후 factual change:{" "}
          {FROZEN_WORLD_SCENE_BENCHMARK.changedLandHexIds.length} LandHex ·{" "}
          {FROZEN_WORLD_SCENE_BENCHMARK.changedRegionIds.length} Region
        </span>
        <span>WorldState를 renderer가 변경하지 않는 bounded spike</span>
      </footer>
    </main>
  );
}
