import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";

import type { BenchmarkCameraState } from "./BenchmarkShell";
import { BenchmarkShell } from "./BenchmarkShell";
import type {
  WorldSceneModel,
  WorldScenePoint,
} from "../presentation/worldSceneModel";

const COUNTRY_COLORS = ["#a9694b", "#3f7880", "#6c5c83"] as const;
const TERRAIN_COLORS: Record<
  WorldSceneModel["hexes"][number]["terrain"],
  string
> = {
  plains: "#b7a777",
  coast: "#6b9da0",
  wetlands: "#829777",
  forest: "#5b8065",
  hills: "#9b8060",
  mountains: "#706d73",
};

function Line({
  start,
  end,
  color,
  width = 1,
}: {
  start: WorldScenePoint;
  end: WorldScenePoint;
  color: string;
  width?: number;
}) {
  const geometry = useMemo(
    () =>
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...start),
        new THREE.Vector3(...end),
      ]),
    [start, end],
  );
  const line = useMemo(
    () =>
      new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({ color, linewidth: width }),
      ),
    [color, geometry, width],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => line.material.dispose(), [line]);
  return <primitive object={line} />;
}

function RoutePulse({
  start,
  end,
}: {
  start: WorldScenePoint;
  end: WorldScenePoint;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current === null) return;
    const t = (clock.getElapsedTime() * 0.22) % 1;
    ref.current.position.lerpVectors(
      new THREE.Vector3(...start),
      new THREE.Vector3(...end),
      t,
    );
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshBasicMaterial color="#edc56c" />
    </mesh>
  );
}

function Tile({
  model,
  hex,
}: {
  model: WorldSceneModel;
  hex: WorldSceneModel["hexes"][number];
}) {
  const region = model.countries.find(
    (country) => country.countryId === hex.ownerCountryId,
  );
  const color =
    region === undefined
      ? "#9f9a83"
      : COUNTRY_COLORS[
          model.countries.indexOf(region) % COUNTRY_COLORS.length
        ]!;
  return (
    <group
      position={hex.position}
      userData={{ truthClass: hex.truthClass, landHexId: hex.id }}
    >
      <mesh position={[0, hex.height / 2, 0]}>
        <cylinderGeometry args={[0.94, 0.94, hex.height, 6]} />
        <meshStandardMaterial color={color} roughness={0.96} />
      </mesh>
      <mesh
        position={[0, hex.height + 0.012, 0]}
        rotation={[0, Math.PI / 6, 0]}
      >
        <cylinderGeometry args={[0.72, 0.72, 0.025, 6]} />
        <meshStandardMaterial
          color={TERRAIN_COLORS[hex.terrain]}
          roughness={1}
        />
      </mesh>
    </group>
  );
}

function Settlement({
  settlement,
}: {
  settlement: WorldSceneModel["settlements"][number];
}) {
  return (
    <group
      position={settlement.position}
      userData={{
        truthClass: settlement.truthClass,
        settlementId: settlement.id,
      }}
    >
      <mesh>
        <cylinderGeometry args={[0.28, 0.34, 0.18, 8]} />
        <meshStandardMaterial color="#d7c18d" />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <coneGeometry args={[0.28, 0.42, 6]} />
        <meshStandardMaterial color="#5b342f" />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.08, 0.25, 0.08]} />
        <meshStandardMaterial color="#ebd7a2" />
      </mesh>
    </group>
  );
}

function ProjectLandmark({
  project,
}: {
  project: WorldSceneModel["projects"][number];
}) {
  const color =
    project.status === "completed"
      ? "#e3c56e"
      : project.status === "implementing"
        ? "#d98755"
        : "#7c8580";
  return (
    <group
      position={project.position}
      userData={{
        truthClass: project.truthClass,
        projectId: project.id,
        status: project.status,
      }}
    >
      <mesh>
        <boxGeometry args={[0.34, 0.18, 0.34]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 0.42, 6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <coneGeometry args={[0.18, 0.2, 6]} />
        <meshStandardMaterial color="#f2dfac" />
      </mesh>
    </group>
  );
}

function FactionMarker({
  marker,
}: {
  marker: WorldSceneModel["factionPresence"][number];
}) {
  return (
    <group
      position={marker.position}
      userData={{ truthClass: marker.truthClass, factionId: marker.factionId }}
    >
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.25, 0.06, 6, 12]} />
        <meshBasicMaterial color="#e49a75" />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#8b3d36" />
      </mesh>
    </group>
  );
}

function ConflictMarker({
  conflict,
}: {
  conflict: WorldSceneModel["conflicts"][number];
}) {
  return (
    <group
      position={conflict.position}
      userData={{
        truthClass: conflict.truthClass,
        conflictId: conflict.conflictId,
      }}
    >
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.34, 0.05, 6, 16]} />
        <meshBasicMaterial color="#d84e4e" />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <octahedronGeometry args={[0.15, 0]} />
        <meshBasicMaterial color="#f0c36a" />
      </mesh>
    </group>
  );
}

function WorldScene({
  model,
  camera,
}: {
  model: WorldSceneModel;
  camera: BenchmarkCameraState;
}) {
  const { camera: activeCamera } = useThree();
  useEffect(() => {
    activeCamera.position.set(camera.x, 9, 13 + camera.z);
    activeCamera.lookAt(camera.x * 0.1, 0, camera.z * 0.1);
    activeCamera.zoom = 36 * camera.zoom;
    activeCamera.updateProjectionMatrix();
  }, [activeCamera, camera]);
  return (
    <>
      <ambientLight intensity={1.35} />
      <directionalLight position={[-4, 10, 5]} intensity={2.1} />
      <group>
        {model.hexes.map((hex) => (
          <Tile key={hex.id} model={model} hex={hex} />
        ))}
        {model.routes
          .filter((route) => route.active)
          .map((route) => (
            <group key={route.id}>
              <Line
                start={route.start}
                end={route.end}
                color="#e6c887"
                width={1}
              />
              <RoutePulse start={route.start} end={route.end} />
            </group>
          ))}
        {model.fronts.map((front) => (
          <Line
            key={front.id}
            start={front.start}
            end={front.end}
            color="#e0504c"
            width={2}
          />
        ))}
        {model.settlements.map((settlement) => (
          <Settlement key={settlement.id} settlement={settlement} />
        ))}
        {model.projects.map((project) => (
          <ProjectLandmark key={project.id} project={project} />
        ))}
        {model.factionPresence.map((marker) => (
          <FactionMarker key={marker.id} marker={marker} />
        ))}
        {model.conflicts.map((conflict) => (
          <ConflictMarker key={conflict.id} conflict={conflict} />
        ))}
      </group>
    </>
  );
}

export function R3FBenchmark() {
  return (
    <BenchmarkShell
      renderer="r3f"
      render={({ model, camera, onReady }) => (
        <Canvas
          orthographic
          dpr={[1, 2]}
          camera={{ position: [0, 9, 13], zoom: 36, near: 0.1, far: 100 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          onCreated={() => onReady("R3F WebGL canvas 준비됨")}
        >
          <WorldScene model={model} camera={camera} />
        </Canvas>
      )}
    />
  );
}
