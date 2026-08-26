import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";

import { TMR_LAYER_REGISTRY } from "../presentation/design/layerRegistry";
import {
  deriveWorldSceneModel,
  type WorldSceneModel,
  type WorldScenePoint,
} from "../presentation/worldSceneModel";
import type { PresentationState } from "../presentation/presentationState";
import type { RegionId } from "../sim/state/ids";
import type { StateProjectPresentation } from "./stateProjects";
import type { WorldVisualDelta } from "./worldVisualDelta";

const COUNTRY_COLORS = ["#a9694b", "#3f7880", "#6c5c83"] as const;
const TERRAIN_COLORS: Record<
  WorldSceneModel["hexes"][number]["terrain"],
  string
> = {
  plains: "#c5ae78",
  coast: "#6e9ea1",
  wetlands: "#829777",
  forest: "#5d8168",
  hills: "#a0805e",
  mountains: "#73707a",
};
const CONTROLLER_COLORS = {
  country: "#ead8a4",
  faction: "#e0524f",
  uncontrolled: "#d2d0bd",
} as const;

interface CameraState {
  readonly x: number;
  readonly z: number;
  readonly zoom: number;
}

function countryColor(model: WorldSceneModel, countryId: string): string {
  const index = model.countries.findIndex(
    (country) => country.countryId === countryId,
  );
  return COUNTRY_COLORS[(index < 0 ? 0 : index) % COUNTRY_COLORS.length]!;
}

function pointsForHex(point: WorldScenePoint, radius = 0.93): THREE.Vector3[] {
  return Array.from({ length: 7 }, (_, index) => {
    const angle = (Math.PI / 180) * (60 * (index % 6) + 30);
    return new THREE.Vector3(
      point[0] + radius * Math.cos(angle),
      point[1],
      point[2] + radius * Math.sin(angle),
    );
  });
}

function SceneLine({
  points,
  color,
  opacity = 1,
  width = 1,
}: {
  readonly points: readonly THREE.Vector3[];
  readonly color: string;
  readonly opacity?: number;
  readonly width?: number;
}) {
  const geometry = useMemo(
    () => new THREE.BufferGeometry().setFromPoints([...points]),
    [points],
  );
  const line = useMemo(
    () =>
      new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({
          color,
          transparent: opacity < 1,
          opacity,
          linewidth: width,
        }),
      ),
    [color, geometry, opacity, width],
  );
  useEffect(
    () => () => {
      geometry.dispose();
      line.material.dispose();
    },
    [geometry, line],
  );
  return <primitive object={line} />;
}

function SpriteLabel({
  label,
  position,
  color,
  scale,
}: {
  readonly label: string;
  readonly position: WorldScenePoint;
  readonly color: string;
  readonly scale: number;
}) {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 96;
    const context = canvas.getContext("2d");
    if (context === null) return null;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = "700 34px Noto Serif KR, Georgia, serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineJoin = "round";
    context.lineWidth = 10;
    context.strokeStyle = "rgba(244, 234, 210, 0.92)";
    context.strokeText(label, canvas.width / 2, canvas.height / 2);
    context.fillStyle = color;
    context.fillText(label, canvas.width / 2, canvas.height / 2);
    const nextTexture = new THREE.CanvasTexture(canvas);
    nextTexture.colorSpace = THREE.SRGBColorSpace;
    return nextTexture;
  }, [color, label]);
  useEffect(
    () => () => {
      texture?.dispose();
    },
    [texture],
  );
  if (texture === null) return null;
  return (
    <sprite position={position} scale={[scale, scale * 0.19, 1]}>
      <spriteMaterial
        map={texture}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </sprite>
  );
}

function TerrainDetail({
  terrain,
  height,
}: {
  readonly terrain: WorldSceneModel["hexes"][number]["terrain"];
  readonly height: number;
}) {
  if (terrain === "mountains") {
    return (
      <group position={[0, height + 0.11, 0]}>
        <mesh position={[-0.2, 0.18, 0]}>
          <coneGeometry args={[0.2, 0.38, 5]} />
          <meshStandardMaterial color="#5f6068" roughness={1} />
        </mesh>
        <mesh position={[0.18, 0.12, 0.08]}>
          <coneGeometry args={[0.15, 0.26, 5]} />
          <meshStandardMaterial color="#85818a" roughness={1} />
        </mesh>
      </group>
    );
  }
  if (terrain === "forest") {
    return (
      <group position={[0, height + 0.1, 0]}>
        {[-0.22, 0, 0.22].map((x) => (
          <mesh key={x} position={[x, 0.16, (x * 1.7) % 0.18]}>
            <coneGeometry args={[0.15, 0.34, 6]} />
            <meshStandardMaterial color="#3f694f" roughness={1} />
          </mesh>
        ))}
      </group>
    );
  }
  if (terrain === "coast") {
    return (
      <mesh
        position={[0.2, height + 0.025, 0.1]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[0.28, 12]} />
        <meshBasicMaterial color="#c4e2dc" transparent opacity={0.75} />
      </mesh>
    );
  }
  return null;
}

function WorldTile({
  model,
  hex,
  highlighted,
  onSelectRegion,
}: {
  readonly model: WorldSceneModel;
  readonly hex: WorldSceneModel["hexes"][number];
  readonly highlighted: boolean;
  readonly onSelectRegion: (regionId: RegionId) => void;
}) {
  const ownerColor = countryColor(model, hex.ownerCountryId);
  const controllerColor = CONTROLLER_COLORS[hex.controller.kind];
  const top = hex.position[1] + hex.height + 0.015;
  return (
    <group
      position={hex.position}
      userData={{ truthClass: hex.truthClass }}
      onClick={(event) => {
        event.stopPropagation();
        onSelectRegion(hex.regionId);
      }}
    >
      <mesh position={[0, hex.height / 2, 0]}>
        <cylinderGeometry args={[0.97, 1.02, hex.height, 6]} />
        <meshStandardMaterial color={ownerColor} roughness={0.94} />
      </mesh>
      <mesh
        position={[0, hex.height + 0.012, 0]}
        rotation={[0, Math.PI / 6, 0]}
      >
        <cylinderGeometry args={[0.86, 0.86, 0.04, 6]} />
        <meshStandardMaterial
          color={TERRAIN_COLORS[hex.terrain]}
          roughness={0.98}
        />
      </mesh>
      <TerrainDetail terrain={hex.terrain} height={hex.height} />
      <mesh
        position={[0, top + 0.02, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={highlighted ? 1.08 : 1}
      >
        <torusGeometry args={[0.7, highlighted ? 0.055 : 0.035, 6, 6]} />
        <meshBasicMaterial
          color={highlighted ? "#f9dfa1" : controllerColor}
          transparent
          opacity={hex.controller.kind === "country" ? 0.65 : 0.95}
        />
      </mesh>
      <SceneLine
        points={pointsForHex([0, top + 0.035, 0], 0.88)}
        color={highlighted ? "#f8dfa2" : "#443b32"}
        opacity={highlighted ? 0.95 : 0.6}
        width={highlighted ? 2 : 1}
      />
    </group>
  );
}

function RoutePulse({
  start,
  end,
}: {
  readonly start: WorldScenePoint;
  readonly end: WorldScenePoint;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const startVector = useMemo(() => new THREE.Vector3(...start), [start]);
  const endVector = useMemo(() => new THREE.Vector3(...end), [end]);
  useFrame(({ clock }) => {
    if (ref.current === null) return;
    const t = (clock.getElapsedTime() * 0.22) % 1;
    ref.current.position.lerpVectors(startVector, endVector, t);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshBasicMaterial color="#f1ce79" />
    </mesh>
  );
}

function Settlement({
  settlement,
}: {
  readonly settlement: WorldSceneModel["settlements"][number];
}) {
  return (
    <group position={settlement.position}>
      <mesh>
        <cylinderGeometry args={[0.27, 0.34, 0.18, 8]} />
        <meshStandardMaterial color="#e4ce99" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <coneGeometry args={[0.28, 0.42, 6]} />
        <meshStandardMaterial color="#633a34" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.52, 0]}>
        <boxGeometry args={[0.07, 0.26, 0.07]} />
        <meshStandardMaterial color="#f1ddaa" />
      </mesh>
    </group>
  );
}

function ProjectLandmark({
  project,
}: {
  readonly project: WorldSceneModel["projects"][number];
}) {
  const color =
    project.status === "completed"
      ? "#e6c66d"
      : project.status === "implementing"
        ? "#d98755"
        : "#8b9185";
  return (
    <group position={project.position}>
      <mesh>
        <boxGeometry args={[0.34, 0.18, 0.34]} />
        <meshStandardMaterial color={color} roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 0.42, 6]} />
        <meshStandardMaterial color={color} roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <coneGeometry args={[0.18, 0.2, 6]} />
        <meshStandardMaterial color="#f5e3ae" roughness={0.8} />
      </mesh>
    </group>
  );
}

function WorldScene({
  model,
  cameraState,
  highlightedRegionIds,
  onSelectRegion,
}: {
  readonly model: WorldSceneModel;
  readonly cameraState: CameraState;
  readonly highlightedRegionIds: ReadonlySet<string>;
  readonly onSelectRegion: (regionId: RegionId) => void;
}) {
  const { camera, size } = useThree();
  const fitZoom = Math.min(
    size.width / Math.max(model.bounds.maxX - model.bounds.minX + 3, 1),
    size.height / Math.max(model.bounds.maxZ - model.bounds.minZ + 4, 1),
  );
  useEffect(() => {
    camera.position.set(cameraState.x, 10, cameraState.z + 14);
    camera.lookAt(cameraState.x, 0, cameraState.z);
    camera.zoom = Math.max(12, fitZoom * cameraState.zoom * 1.45);
    camera.updateProjectionMatrix();
  }, [camera, cameraState, fitZoom]);

  const regionsById = useMemo(
    () => new Map(model.regions.map((region) => [region.regionId, region])),
    [model.regions],
  );
  return (
    <>
      <ambientLight intensity={1.55} />
      <directionalLight position={[-5, 12, 7]} intensity={2.4} />
      <directionalLight
        position={[7, 7, -5]}
        intensity={0.65}
        color="#e6c79b"
      />
      <group>
        {model.hexes.map((hex) => (
          <WorldTile
            key={hex.id}
            model={model}
            hex={hex}
            highlighted={highlightedRegionIds.has(hex.regionId)}
            onSelectRegion={onSelectRegion}
          />
        ))}
        {model.routes.map((route) => (
          <group key={route.id}>
            <SceneLine
              points={[
                new THREE.Vector3(...route.start),
                new THREE.Vector3(...route.end),
              ]}
              color={route.active ? "#f0cf83" : "#8a7557"}
              opacity={route.active ? 0.9 : 0.25}
              width={route.active ? 2 : 1}
            />
            {route.active ? (
              <RoutePulse start={route.start} end={route.end} />
            ) : null}
          </group>
        ))}
        {model.fronts.map((front) => (
          <SceneLine
            key={front.id}
            points={[
              new THREE.Vector3(...front.start),
              new THREE.Vector3(...front.end),
            ]}
            color="#e5524d"
            opacity={0.95}
            width={2}
          />
        ))}
        {model.settlements.map((settlement) => (
          <Settlement key={settlement.id} settlement={settlement} />
        ))}
        {model.projects.map((project) => (
          <ProjectLandmark key={project.id} project={project} />
        ))}
        {model.influences.map((influence) => (
          <mesh
            key={influence.id}
            position={influence.position}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry
              args={[0.42 + influence.support * 0.24, 0.035, 6, 18]}
            />
            <meshBasicMaterial
              color="#d7a74f"
              transparent
              opacity={0.3 + influence.support * 0.4}
            />
          </mesh>
        ))}
        {model.regions.map((region) => {
          const pressure = Math.max(region.unrest, region.scarcity);
          return (
            <mesh
              key={`pressure:${region.id}`}
              position={[region.position[0], 0.5, region.position[2]]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <torusGeometry args={[0.56 + pressure * 0.2, 0.025, 6, 18]} />
              <meshBasicMaterial
                color="#b74b43"
                transparent
                opacity={0.14 + pressure * 0.42}
              />
            </mesh>
          );
        })}
        {model.factionPresence.map((presence) => (
          <group key={presence.id} position={presence.position}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.26, 0.06, 6, 14]} />
              <meshBasicMaterial color="#e45f55" />
            </mesh>
            <mesh position={[0, 0.24, 0]}>
              <sphereGeometry args={[0.12, 8, 8]} />
              <meshStandardMaterial color="#9b3e38" />
            </mesh>
          </group>
        ))}
        {model.conflicts.map((conflict) => (
          <group key={conflict.id} position={conflict.position}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.38, 0.06, 6, 18]} />
              <meshBasicMaterial color="#f0524d" />
            </mesh>
            <mesh position={[0, 0.22, 0]}>
              <octahedronGeometry args={[0.16, 0]} />
              <meshBasicMaterial color="#f3c66c" />
            </mesh>
          </group>
        ))}
        {model.regions
          .filter((region) => highlightedRegionIds.has(region.regionId))
          .map((region) => (
            <SpriteLabel
              key={region.id}
              label={region.name}
              position={[region.position[0], 0.88, region.position[2]]}
              color="#7f332f"
              scale={1.9}
            />
          ))}
        {model.countries.map((country) => (
          <SpriteLabel
            key={country.id}
            label={country.name}
            position={[country.position[0], 1.7, country.position[2]]}
            color={countryColor(model, country.countryId)}
            scale={3.1}
          />
        ))}
      </group>
      <group userData={{ regions: regionsById.size }} />
    </>
  );
}

function controllerLabel(
  kind: WorldSceneModel["hexes"][number]["controller"]["kind"],
): string {
  switch (kind) {
    case "country":
      return "국가 통제";
    case "faction":
      return "세력 통제";
    case "uncontrolled":
      return "통제 공백";
  }
}

export function PoliticalWorldStage({
  presentation,
  selectedRegionId,
  onSelectRegion,
  onClearFocus,
  projects,
  visualDeltas,
  focusRegionId,
  previewRegionIds,
}: {
  readonly presentation: PresentationState;
  readonly selectedRegionId: RegionId | null;
  readonly onSelectRegion: (regionId: RegionId) => void;
  readonly onClearFocus: () => void;
  readonly projects: readonly StateProjectPresentation[];
  readonly visualDeltas: readonly WorldVisualDelta[];
  readonly focusRegionId: RegionId | null;
  readonly previewRegionIds: readonly RegionId[];
}) {
  const model = useMemo(
    () =>
      deriveWorldSceneModel(
        presentation,
        projects.map((project) => ({
          id: project.id,
          name: project.name,
          anchorRegionId: project.anchorRegionId,
          landmarkKind: project.landmarkKind,
          status: project.status,
          progress: project.progress,
          sourceEventIds: project.sourceEventIds,
        })),
      ),
    [presentation, projects],
  );
  const [camera, setCamera] = useState<CameraState>({ x: 0, z: 0, zoom: 1 });
  const pointerRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const highlightedRegionIds = useMemo(
    () =>
      new Set([
        ...visualDeltas.flatMap((delta) => delta.regionIds),
        ...previewRegionIds,
        ...(selectedRegionId === null ? [] : [selectedRegionId]),
      ]),
    [previewRegionIds, selectedRegionId, visualDeltas],
  );
  const regionById = useMemo(
    () => new Map(model.regions.map((region) => [region.regionId, region])),
    [model.regions],
  );
  useEffect(() => {
    const target =
      focusRegionId === null
        ? {
            x: (model.bounds.minX + model.bounds.maxX) / 2,
            z: (model.bounds.minZ + model.bounds.maxZ) / 2,
            zoom: 1,
          }
        : (() => {
            const region = regionById.get(focusRegionId);
            return region === undefined
              ? {
                  x: (model.bounds.minX + model.bounds.maxX) / 2,
                  z: (model.bounds.minZ + model.bounds.maxZ) / 2,
                  zoom: 1,
                }
              : { x: region.position[0], z: region.position[2], zoom: 1.45 };
          })();
    setCamera((current) => ({
      ...target,
      x: Number(target.x.toFixed(3)),
      z: Number(target.z.toFixed(3)),
      zoom: current.zoom === target.zoom ? current.zoom : target.zoom,
    }));
  }, [focusRegionId, model.bounds, regionById]);
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
    setCamera((current) => ({
      ...current,
      x: current.x - (dx * 0.012) / current.zoom,
      z: current.z + (dy * 0.012) / current.zoom,
    }));
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerRef.current?.id === event.pointerId) pointerRef.current = null;
  };
  const countries = new Map(
    presentation.countries.map((country) => [country.countryId, country]),
  );
  const regionName = (regionId: RegionId) =>
    regionById.get(regionId)?.name ?? "지역";
  const controllerDescription = (hex: WorldSceneModel["hexes"][number]) => {
    if (hex.controller.kind === "country") {
      return countries.get(hex.controller.countryId)?.name ?? "국가";
    }
    if (hex.controller.kind === "faction") return "조직 세력";
    return controllerLabel(hex.controller.kind);
  };
  const debugLayers =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("designDebug") === "1";

  return (
    <div className="atlas-frame world-scene-frame" data-map-renderer="r3f">
      <div className="map-wrap world-scene-wrap">
        <div
          className="world-scene-viewport"
          data-world-scene-tick={model.tick}
          data-camera-focus={focusRegionId ?? "world"}
          data-camera-zoom={camera.zoom.toFixed(2)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={(event) => {
            event.preventDefault();
            setCamera((current) => ({
              ...current,
              zoom: Math.max(
                0.82,
                Math.min(1.8, current.zoom * (event.deltaY < 0 ? 1.08 : 0.93)),
              ),
            }));
          }}
        >
          <Canvas
            className="world-scene-canvas"
            orthographic
            dpr={[1, 1.75]}
            camera={{ position: [0, 10, 14], zoom: 30, near: 0.1, far: 100 }}
            gl={{ antialias: true, powerPreference: "high-performance" }}
            fallback={
              <div className="world-scene-fallback">
                지도를 불러오는 중입니다.
              </div>
            }
          >
            <WorldScene
              model={model}
              cameraState={camera}
              highlightedRegionIds={highlightedRegionIds}
              onSelectRegion={onSelectRegion}
            />
          </Canvas>
          <div className="world-scene-hud" aria-hidden="true">
            <span>2.5D 정치 지도</span>
            <span>{model.tick}일차 · 실제 상태 투영</span>
          </div>
          <div className="world-scene-object-key" aria-label="지도 객체 안내">
            <span>
              <i className="object-key-settlement" /> 수도
            </span>
            <span>
              <i className="object-key-project" /> 국가 사업
            </span>
            <span>
              <i className="object-key-route" /> 접촉 경로
            </span>
            <span>
              <i className="object-key-conflict" /> 활성 충돌
            </span>
          </div>
          <div className="map-camera-controls" aria-label="지도 카메라">
            <span className="eyebrow">지도 시선</span>
            <button
              type="button"
              aria-label="지도 축소"
              data-map-zoom="out"
              onClick={() =>
                setCamera((value) => ({
                  ...value,
                  zoom: Math.max(0.82, value.zoom / 1.18),
                }))
              }
            >
              −
            </button>
            <button
              type="button"
              aria-label="지도 확대"
              data-map-zoom="in"
              onClick={() =>
                setCamera((value) => ({
                  ...value,
                  zoom: Math.min(1.8, value.zoom * 1.18),
                }))
              }
            >
              +
            </button>
            <button
              type="button"
              data-map-focus="world"
              onClick={() => {
                onClearFocus();
                setCamera({
                  x: (model.bounds.minX + model.bounds.maxX) / 2,
                  z: (model.bounds.minZ + model.bounds.maxZ) / 2,
                  zoom: 1,
                });
              }}
            >
              전체 보기
            </button>
            <span className="map-camera-status">
              {focusRegionId === null
                ? "전체 세계"
                : `${regionName(focusRegionId)} 중심`}
            </span>
          </div>
        </div>
        <div className="map-legend" aria-label="지도 범례">
          {presentation.countries.map((country) => (
            <span key={country.countryId}>
              <i
                className="legend-swatch"
                style={{
                  backgroundColor: countryColor(model, country.countryId),
                }}
              />
              {country.name}
            </span>
          ))}
          <span>
            <i className="legend-line legend-line-route" /> 실제 경로
          </span>
          <span>
            <i className="legend-controller" /> 물리 통제
          </span>
          <span>
            <i className="legend-ideology" /> 정치 흐름
          </span>
        </div>
      </div>
      <details className="world-scene-data-summary">
        <summary>지도 데이터 읽기</summary>
        <div className="world-scene-data-grid">
          {model.hexes.map((hex) => (
            <span
              key={hex.id}
              className="atlas-controller-overlay"
              data-controller-kind={hex.controller.kind}
            >
              {regionName(hex.regionId)} · {controllerDescription(hex)}
            </span>
          ))}
          {model.influences.map((influence) => (
            <span key={influence.id} className="atlas-ideology-overlay">
              {regionName(influence.regionId)} · 정치 흐름 관측
            </span>
          ))}
          {model.regions.map((region) => (
            <span key={region.id} className="atlas-pressure-pulse">
              {region.name} · 불안/희소성 압력 관측
            </span>
          ))}
          {model.routes.map((route) => (
            <span key={route.id} className="atlas-route">
              {regionName(route.sourceRegionId)} ↔{" "}
              {regionName(route.targetRegionId)} · 접촉 경로
            </span>
          ))}
          {model.conflicts.map((conflict) => (
            <span key={conflict.id} className="atlas-conflict-marker">
              활성{" "}
              {conflict.kind === "rebellion"
                ? "반란"
                : conflict.kind === "coup"
                  ? "쿠데타"
                  : "충돌"}
            </span>
          ))}
          {model.projects.map((project) => (
            <span key={project.id} className="atlas-project-marker">
              {project.name} ·{" "}
              {project.status === "completed" ? "완료" : "진행 중"}
            </span>
          ))}
        </div>
      </details>
      {debugLayers ? (
        <details className="design-debug" open>
          <summary>지도 계층 검사</summary>
          <ul>
            {TMR_LAYER_REGISTRY.map((layer) => (
              <li key={layer.id}>
                <span>{layer.zIndex.toString().padStart(2, "0")}</span>
                {layer.name}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
