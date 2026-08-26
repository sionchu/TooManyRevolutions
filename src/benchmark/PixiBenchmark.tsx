import { Application, Container, Graphics, type Ticker } from "pixi.js";
import { useEffect, useRef, useState } from "react";

import type {
  BenchmarkCameraState,
  BenchmarkRendererProps,
} from "./BenchmarkShell";
import { BenchmarkShell } from "./BenchmarkShell";
import type { WorldSceneModel } from "../presentation/worldSceneModel";

const COUNTRY_COLORS = [0xa9694b, 0x3f7880, 0x6c5c83] as const;
const TERRAIN_COLORS: Record<
  WorldSceneModel["hexes"][number]["terrain"],
  number
> = {
  plains: 0xb7a777,
  coast: 0x6b9da0,
  wetlands: 0x829777,
  forest: 0x5b8065,
  hills: 0x9b8060,
  mountains: 0x706d73,
};

function drawHex(
  graphics: Graphics,
  x: number,
  y: number,
  radius: number,
  fill: number,
  depth: number,
) {
  const points = Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (60 * index - 30);
    return [x + radius * Math.cos(angle), y + radius * Math.sin(angle)];
  });
  graphics
    .poly(points.flat())
    .fill(fill)
    .stroke({ color: 0x332c25, width: 1, alpha: 0.75 });
  graphics
    .poly(points.map(([pointX, pointY]) => [pointX, pointY + depth]).flat())
    .fill(0x514a40)
    .stroke({ color: 0x332c25, width: 1, alpha: 0.7 });
}

function isoPoint(
  point: readonly [number, number, number],
  scale: number,
  offsetX: number,
  offsetY: number,
): [number, number] {
  return [
    offsetX + point[0] * scale,
    offsetY + point[2] * scale - point[1] * scale * 0.85,
  ];
}

function PixiWorld({
  model,
  camera,
  host,
  onReady,
}: {
  model: WorldSceneModel;
  camera: BenchmarkCameraState;
  host: HTMLDivElement;
  onReady: (details: string) => void;
}) {
  const appRef = useRef<Application | null>(null);
  const rootRef = useRef<Container | null>(null);
  const routePulsesRef = useRef<
    Array<{ graphic: Graphics; start: [number, number]; end: [number, number] }>
  >([]);
  const [ticker, setTicker] = useState<Ticker | null>(null);
  useEffect(() => {
    let disposed = false;
    const app = new Application();
    appRef.current = app;
    void app
      .init({
        resizeTo: host,
        background: 0x25241f,
        antialias: true,
        autoStart: true,
      })
      .then(() => {
        if (disposed) {
          app.destroy(true);
          return;
        }
        host.appendChild(app.canvas);
        const root = new Container();
        rootRef.current = root;
        app.stage.addChild(root);
        root.position.set(camera.x * 48, camera.z * 48);
        root.scale.set(camera.zoom);
        const scale = 64;
        const offsetX = 0;
        const offsetY = Math.max(180, host.clientHeight * 0.48);
        const regionCountryIndex = new Map(
          model.countries.map((country, index) => [country.countryId, index]),
        );
        for (const hex of model.hexes) {
          const [x, y] = isoPoint(hex.position, scale, offsetX, offsetY);
          const countryIndex = regionCountryIndex.get(hex.ownerCountryId) ?? 0;
          const graphics = new Graphics();
          drawHex(
            graphics,
            x,
            y,
            34,
            COUNTRY_COLORS[countryIndex % COUNTRY_COLORS.length]!,
            hex.height * 18,
          );
          graphics
            .rect(x - 22, y - 8, 44, 16)
            .fill(TERRAIN_COLORS[hex.terrain]);
          graphics.eventMode = "static";
          graphics.cursor = "pointer";
          graphics.label = hex.id;
          root.addChild(graphics);
        }
        for (const route of model.routes.filter(
          (candidate) => candidate.active,
        )) {
          const start = isoPoint(route.start, scale, offsetX, offsetY);
          const end = isoPoint(route.end, scale, offsetX, offsetY);
          const line = new Graphics()
            .moveTo(...start)
            .lineTo(...end)
            .stroke({ color: 0xe6c887, width: 3, alpha: 0.85 });
          root.addChild(line);
          const pulse = new Graphics()
            .circle(start[0], start[1], 6)
            .fill(0xedc56c);
          root.addChild(pulse);
          routePulsesRef.current.push({ graphic: pulse, start, end });
        }
        for (const settlement of model.settlements) {
          const [x, y] = isoPoint(settlement.position, scale, offsetX, offsetY);
          root.addChild(
            new Graphics()
              .circle(x, y - 16, 13)
              .fill(0xd7c18d)
              .stroke({ color: 0x5b342f, width: 3 }),
          );
          root.addChild(
            new Graphics()
              .poly([x - 13, y - 20, x, y - 40, x + 13, y - 20])
              .fill(0x5b342f),
          );
        }
        for (const project of model.projects) {
          const [x, y] = isoPoint(project.position, scale, offsetX, offsetY);
          const color =
            project.status === "completed"
              ? 0xe3c56e
              : project.status === "implementing"
                ? 0xd98755
                : 0x7c8580;
          root.addChild(
            new Graphics()
              .rect(x - 13, y - 14, 26, 20)
              .fill(color)
              .stroke({ color: 0x2f2b26, width: 2 }),
          );
          root.addChild(new Graphics().rect(x - 5, y - 34, 10, 20).fill(color));
        }
        for (const faction of model.factionPresence) {
          const [x, y] = isoPoint(faction.position, scale, offsetX, offsetY);
          root.addChild(
            new Graphics()
              .circle(x, y - 12, 15)
              .stroke({ color: 0xe49a75, width: 4 }),
          );
          root.addChild(new Graphics().circle(x, y - 12, 7).fill(0x8b3d36));
        }
        for (const conflict of model.conflicts) {
          const [x, y] = isoPoint(conflict.position, scale, offsetX, offsetY);
          root.addChild(
            new Graphics()
              .circle(x, y - 15, 22)
              .stroke({ color: 0xd84e4e, width: 4 }),
          );
          root.addChild(
            new Graphics().star(x, y - 15, 4, 11, 4).fill(0xf0c36a),
          );
        }
        for (const front of model.fronts) {
          const start = isoPoint(front.start, scale, offsetX, offsetY);
          const end = isoPoint(front.end, scale, offsetX, offsetY);
          root.addChild(
            new Graphics()
              .moveTo(...start)
              .lineTo(...end)
              .stroke({ color: 0xe0504c, width: 6, alpha: 0.95 }),
          );
        }
        setTicker(app.ticker);
        onReady("PixiJS v8 WebGL/Canvas 준비됨");
      })
      .catch((error: unknown) => onReady(`Pixi 초기화 실패: ${String(error)}`));
    return () => {
      disposed = true;
      routePulsesRef.current = [];
      rootRef.current = null;
      setTicker(null);
      if (appRef.current !== null) {
        appRef.current.destroy(true, {
          children: true,
          texture: true,
          textureSource: true,
        });
        appRef.current = null;
      }
    };
  }, [host, model, onReady]);
  useEffect(() => {
    const root = rootRef.current;
    if (root === null) return;
    root.position.set(camera.x * 48, camera.z * 48);
    root.scale.set(camera.zoom);
  }, [camera]);
  useEffect(() => {
    if (ticker === null) return;
    const update = () => {
      for (const pulse of routePulsesRef.current) {
        const t = (performance.now() / 4200) % 1;
        pulse.graphic.position.set(
          pulse.start[0] + (pulse.end[0] - pulse.start[0]) * t,
          pulse.start[1] + (pulse.end[1] - pulse.start[1]) * t,
        );
      }
    };
    ticker.add(update);
    return () => {
      ticker.remove(update);
    };
  }, [ticker]);
  return null;
}

function PixiCanvas({ model, camera, onReady }: BenchmarkRendererProps) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  return (
    <div className="pixi-host" ref={setHost}>
      {host === null ? null : (
        <PixiWorld
          model={model}
          camera={camera}
          host={host}
          onReady={onReady}
        />
      )}
    </div>
  );
}

export function PixiBenchmark() {
  return (
    <BenchmarkShell
      renderer="pixi"
      render={(props) => <PixiCanvas {...props} />}
    />
  );
}
