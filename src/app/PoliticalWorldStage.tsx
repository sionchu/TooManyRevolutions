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
  dashed = false,
}: {
  readonly points: readonly THREE.Vector3[];
  readonly color: string;
  readonly opacity?: number;
  readonly width?: number;
  readonly dashed?: boolean;
}) {
  const geometry = useMemo(
    () => new THREE.BufferGeometry().setFromPoints([...points]),
    [points],
  );
  const line = useMemo(() => {
    const material = dashed
      ? new THREE.LineDashedMaterial({
          color,
          transparent: opacity < 1,
          opacity,
          dashSize: 0.26,
          gapSize: 0.14,
          linewidth: width,
        })
      : new THREE.LineBasicMaterial({
          color,
          transparent: opacity < 1,
          opacity,
          linewidth: width,
        });
    const nextLine = new THREE.Line(geometry, material);
    if (dashed) nextLine.computeLineDistances();
    return nextLine;
  }, [color, dashed, geometry, opacity, width]);
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

function TerrainWorldSurface({ model }: { readonly model: WorldSceneModel }) {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    for (const hex of model.hexes) {
      const terrainColor = new THREE.Color(TERRAIN_COLORS[hex.terrain]);
      const ownerColor = new THREE.Color(
        countryColor(model, hex.ownerCountryId),
      );
      terrainColor.lerp(ownerColor, 0.2);
      if (hex.controller.kind === "faction") {
        terrainColor.lerp(new THREE.Color(CONTROLLER_COLORS.faction), 0.13);
      }
      const y = hex.position[1] + hex.height + 0.022;
      const center = new THREE.Vector3(hex.position[0], y, hex.position[2]);
      const corners = pointsForHex([center.x, center.y, center.z], 1.01);
      for (let index = 0; index < 6; index += 1) {
        const first = corners[index]!;
        const second = corners[index + 1]!;
        for (const point of [center, first, second]) {
          positions.push(point.x, point.y, point.z);
          colors.push(terrainColor.r, terrainColor.g, terrainColor.b);
        }
      }
    }
    const nextGeometry = new THREE.BufferGeometry();
    nextGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    nextGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 3),
    );
    nextGeometry.computeVertexNormals();
    return nextGeometry;
  }, [model]);
  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry],
  );
  return (
    <mesh geometry={geometry} userData={{ truthClass: "DECORATIVE_SUBSTRATE" }}>
      <meshStandardMaterial vertexColors roughness={0.98} metalness={0} />
    </mesh>
  );
}

function TerrainBackdrop({
  bounds,
}: {
  readonly bounds: WorldSceneModel["bounds"];
}) {
  return (
    <mesh
      position={[
        (bounds.minX + bounds.maxX) / 2,
        -0.02,
        (bounds.minZ + bounds.maxZ) / 2,
      ]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry
        args={[
          bounds.maxX - bounds.minX + 4.5,
          bounds.maxZ - bounds.minZ + 4.5,
        ]}
      />
      <meshStandardMaterial color="#565a4d" roughness={1} />
    </mesh>
  );
}

function WorldTile({
  hex,
  highlighted,
  selected,
  showContextGrid,
  onSelectRegion,
  onSelectHex,
}: {
  readonly hex: WorldSceneModel["hexes"][number];
  readonly highlighted: boolean;
  readonly selected: boolean;
  readonly showContextGrid: boolean;
  readonly onSelectRegion: (regionId: RegionId) => void;
  readonly onSelectHex: (landHexId: string) => void;
}) {
  const controllerColor = CONTROLLER_COLORS[hex.controller.kind];
  const top = hex.position[1] + hex.height + 0.015;
  return (
    <group
      position={hex.position}
      userData={{ truthClass: hex.truthClass, logicalLandHexId: hex.id }}
      onClick={(event) => {
        event.stopPropagation();
        onSelectRegion(hex.regionId);
        onSelectHex(hex.id);
      }}
    >
      <mesh position={[0, hex.height + 0.06, 0]} rotation={[0, Math.PI / 6, 0]}>
        <cylinderGeometry args={[0.99, 0.99, 0.08, 6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <TerrainDetail terrain={hex.terrain} height={hex.height} />
      {highlighted ? (
        <mesh
          position={[0, top + 0.02, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={1.08}
        >
          <torusGeometry args={[0.72, 0.045, 6, 6]} />
          <meshBasicMaterial color="#f9dfa1" transparent opacity={0.8} />
        </mesh>
      ) : null}
      {showContextGrid ? (
        <SceneLine
          points={pointsForHex([0, top + 0.035, 0], 0.98)}
          color={selected ? "#fff0b5" : controllerColor}
          opacity={selected ? 0.98 : 0.7}
          width={selected ? 2 : 1}
        />
      ) : null}
    </group>
  );
}

function RoutePulse({
  start,
  end,
  visualKind,
}: {
  readonly start: WorldScenePoint;
  readonly end: WorldScenePoint;
  readonly visualKind: WorldSceneModel["routes"][number]["visualKind"];
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
      <sphereGeometry
        args={[visualKind === "border-gate" ? 0.08 : 0.1, 8, 8]}
      />
      <meshBasicMaterial
        color={
          visualKind === "trade-warm-flow"
            ? "#f1ce79"
            : visualKind === "information-signal"
              ? "#d7ecff"
              : visualKind === "migration-direction"
                ? "#c0dca8"
                : "#f4e4c3"
        }
      />
    </mesh>
  );
}

function RouteChannelGlyph({
  start,
  end,
  visualKind,
}: {
  readonly start: WorldScenePoint;
  readonly end: WorldScenePoint;
  readonly visualKind: WorldSceneModel["routes"][number]["visualKind"];
}) {
  const midpoint = useMemo(
    () =>
      [
        (start[0] + end[0]) / 2,
        Math.max(start[1], end[1]) + 0.16,
        (start[2] + end[2]) / 2,
      ] as WorldScenePoint,
    [end, start],
  );
  if (visualKind === "trade-warm-flow") {
    return (
      <mesh position={midpoint} rotation={[0, Math.PI / 4, 0]}>
        <octahedronGeometry args={[0.13, 0]} />
        <meshBasicMaterial color="#f1ce79" />
      </mesh>
    );
  }
  if (visualKind === "information-signal") {
    return (
      <mesh position={midpoint} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.14, 0.035, 6, 14]} />
        <meshBasicMaterial color="#d7ecff" />
      </mesh>
    );
  }
  if (visualKind === "migration-direction") {
    return (
      <group position={midpoint} rotation={[0, Math.PI / 2, 0]}>
        {[-0.12, 0, 0.12].map((offset) => (
          <mesh key={offset} position={[offset, 0, 0]}>
            <coneGeometry args={[0.055, 0.18, 5]} />
            <meshBasicMaterial color="#c0dca8" />
          </mesh>
        ))}
      </group>
    );
  }
  return (
    <group position={midpoint}>
      <mesh position={[-0.12, 0.12, 0]}>
        <boxGeometry args={[0.045, 0.24, 0.045]} />
        <meshBasicMaterial color="#f4e4c3" />
      </mesh>
      <mesh position={[0.12, 0.12, 0]}>
        <boxGeometry args={[0.045, 0.24, 0.045]} />
        <meshBasicMaterial color="#f4e4c3" />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.28, 0.035, 0.045]} />
        <meshBasicMaterial color="#f4e4c3" />
      </mesh>
    </group>
  );
}

function routeLineColor(
  visualKind: WorldSceneModel["routes"][number]["visualKind"],
): string {
  switch (visualKind) {
    case "trade-warm-flow":
      return "#f0bd64";
    case "information-signal":
      return "#c6e6f2";
    case "migration-direction":
      return "#b6d39c";
    case "border-gate":
      return "#f0dfbd";
  }
}

function Settlement({
  settlement,
}: {
  readonly settlement: WorldSceneModel["settlements"][number];
}) {
  return (
    <group position={settlement.position}>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.42, 0.48, 0.12, 8]} />
        <meshStandardMaterial color="#8c7454" roughness={1} />
      </mesh>
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
      <mesh position={[-0.28, 0.2, 0]}>
        <boxGeometry args={[0.055, 0.25, 0.055]} />
        <meshStandardMaterial color="#e4ce99" />
      </mesh>
      <mesh position={[0.28, 0.2, 0]}>
        <boxGeometry args={[0.055, 0.25, 0.055]} />
        <meshStandardMaterial color="#e4ce99" />
      </mesh>
    </group>
  );
}

function PoiObject({ poi }: { readonly poi: WorldSceneModel["pois"][number] }) {
  if (poi.kind === "port") {
    return (
      <group position={poi.position}>
        <mesh position={[0, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.82, 0.1, 0.16]} />
          <meshStandardMaterial color="#765b46" roughness={1} />
        </mesh>
        <mesh position={[0.12, 0.34, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.64, 6]} />
          <meshStandardMaterial color="#4c4038" roughness={1} />
        </mesh>
        <mesh position={[0.25, 0.49, 0]} rotation={[0, 0, -0.25]}>
          <planeGeometry args={[0.24, 0.18]} />
          <meshStandardMaterial color="#e2c875" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[-0.22, 0.16, 0]}>
          <boxGeometry args={[0.16, 0.26, 0.12]} />
          <meshStandardMaterial color="#a86f4b" roughness={0.9} />
        </mesh>
      </group>
    );
  }
  if (poi.kind === "mine") {
    return (
      <group position={poi.position}>
        <mesh position={[0, 0.14, 0]}>
          <boxGeometry args={[0.58, 0.24, 0.42]} />
          <meshStandardMaterial color="#56515a" roughness={1} />
        </mesh>
        <mesh position={[0, 0.29, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.15, 0.07, 6, 12, Math.PI]} />
          <meshStandardMaterial color="#292932" roughness={1} />
        </mesh>
        <mesh position={[-0.18, 0.52, -0.02]}>
          <cylinderGeometry args={[0.05, 0.07, 0.48, 6]} />
          <meshStandardMaterial color="#35353d" roughness={1} />
        </mesh>
        <mesh position={[0.18, 0.45, -0.02]}>
          <cylinderGeometry args={[0.04, 0.06, 0.32, 6]} />
          <meshStandardMaterial color="#35353d" roughness={1} />
        </mesh>
      </group>
    );
  }
  if (poi.kind === "fort") {
    return (
      <group position={poi.position}>
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.62, 0.24, 0.52]} />
          <meshStandardMaterial color="#6c6670" roughness={1} />
        </mesh>
        {[
          [-0.25, 0.34, -0.19],
          [0.25, 0.34, -0.19],
          [-0.25, 0.34, 0.19],
          [0.25, 0.34, 0.19],
        ].map(([x, y, z]) => (
          <mesh key={`${x}:${z}`} position={[x, y, z]}>
            <cylinderGeometry args={[0.09, 0.11, 0.42, 6]} />
            <meshStandardMaterial color="#817985" roughness={1} />
          </mesh>
        ))}
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.08, 0.22, 0.08]} />
          <meshStandardMaterial color="#d8b769" />
        </mesh>
      </group>
    );
  }
  if (poi.kind === "granary") {
    return (
      <group position={poi.position}>
        <mesh position={[-0.16, 0.2, 0]}>
          <cylinderGeometry args={[0.16, 0.18, 0.4, 10]} />
          <meshStandardMaterial color="#d2a45c" roughness={0.9} />
        </mesh>
        <mesh position={[0.16, 0.2, 0]}>
          <cylinderGeometry args={[0.16, 0.18, 0.4, 10]} />
          <meshStandardMaterial color="#c69050" roughness={0.9} />
        </mesh>
        <mesh position={[-0.16, 0.45, 0]}>
          <coneGeometry args={[0.18, 0.18, 10]} />
          <meshStandardMaterial color="#8d5439" roughness={0.9} />
        </mesh>
        <mesh position={[0.16, 0.45, 0]}>
          <coneGeometry args={[0.18, 0.18, 10]} />
          <meshStandardMaterial color="#8d5439" roughness={0.9} />
        </mesh>
      </group>
    );
  }
  return (
    <group position={poi.position}>
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[0.62, 0.36, 0.42]} />
        <meshStandardMaterial color="#b38c67" roughness={0.9} />
      </mesh>
      {[-0.2, 0, 0.2].map((x) => (
        <mesh key={x} position={[x, 0.42, 0.18]}>
          <cylinderGeometry args={[0.035, 0.045, 0.3, 6]} />
          <meshStandardMaterial color="#e4ce99" />
        </mesh>
      ))}
      <mesh position={[0, 0.47, 0]}>
        <coneGeometry args={[0.4, 0.2, 4]} />
        <meshStandardMaterial color="#6f4b43" roughness={0.9} />
      </mesh>
    </group>
  );
}

function InstitutionLandmark({
  landmark,
}: {
  readonly landmark: WorldSceneModel["institutions"][number];
}) {
  const capital = landmark.kind === "capital-seat";
  return (
    <group position={landmark.position}>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry
          args={[capital ? 0.7 : 0.8, 0.16, capital ? 0.58 : 0.48]}
        />
        <meshStandardMaterial
          color={capital ? "#8e684c" : "#a48661"}
          roughness={0.9}
        />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry
          args={[capital ? 0.5 : 0.62, 0.48, capital ? 0.42 : 0.32]}
        />
        <meshStandardMaterial
          color={capital ? "#d9bd82" : "#c9ad7a"}
          roughness={0.86}
        />
      </mesh>
      {capital ? (
        <>
          <mesh position={[-0.28, 0.42, 0]}>
            <coneGeometry args={[0.12, 0.42, 6]} />
            <meshStandardMaterial color="#6c4140" roughness={0.9} />
          </mesh>
          <mesh position={[0.28, 0.42, 0]}>
            <coneGeometry args={[0.12, 0.42, 6]} />
            <meshStandardMaterial color="#6c4140" roughness={0.9} />
          </mesh>
        </>
      ) : (
        [-0.22, 0, 0.22].map((x) => (
          <mesh key={x} position={[x, 0.62, 0.18]}>
            <cylinderGeometry args={[0.035, 0.045, 0.34, 6]} />
            <meshStandardMaterial color="#f0d9a1" />
          </mesh>
        ))
      )}
      <mesh position={[0, 0.78, 0]}>
        <boxGeometry args={[0.055, 0.28, 0.055]} />
        <meshStandardMaterial color="#efd58f" />
      </mesh>
    </group>
  );
}

function ProjectScaffold() {
  return (
    <group>
      {[
        [-0.34, 0.34, -0.24],
        [0.34, 0.34, -0.24],
        [-0.34, 0.34, 0.24],
        [0.34, 0.34, 0.24],
      ].map(([x, y, z]) => (
        <mesh key={`${x}:${z}`} position={[x, y, z]}>
          <boxGeometry args={[0.035, 0.7, 0.035]} />
          <meshStandardMaterial color="#d98755" />
        </mesh>
      ))}
      <mesh position={[0, 0.66, -0.24]}>
        <boxGeometry args={[0.72, 0.035, 0.035]} />
        <meshStandardMaterial color="#d98755" />
      </mesh>
      <mesh position={[0, 0.66, 0.24]}>
        <boxGeometry args={[0.72, 0.035, 0.035]} />
        <meshStandardMaterial color="#d98755" />
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
  if (project.status === "not-started") {
    return (
      <group position={project.position}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.26, 0.3, 8]} />
          <meshBasicMaterial color="#8b9185" transparent opacity={0.7} />
        </mesh>
        {[-0.24, 0.24].map((x) => (
          <mesh key={x} position={[x, 0.16, 0]}>
            <boxGeometry args={[0.035, 0.28, 0.035]} />
            <meshStandardMaterial color="#9a927d" />
          </mesh>
        ))}
      </group>
    );
  }
  const implementing = project.status === "implementing";
  const surfaceProps = {
    color,
    roughness: 0.86,
    transparent: implementing,
    opacity: implementing ? 0.78 : 1,
  };
  return (
    <group position={project.position}>
      {project.silhouette === "granary" ? (
        <>
          <mesh position={[0, 0.12, 0]}>
            <boxGeometry args={[0.7, 0.2, 0.5]} />
            <meshStandardMaterial {...surfaceProps} />
          </mesh>
          {[-0.2, 0.2].map((x) => (
            <mesh key={x} position={[x, 0.4, 0]}>
              <cylinderGeometry args={[0.16, 0.18, 0.42, 10]} />
              <meshStandardMaterial {...surfaceProps} />
            </mesh>
          ))}
          <mesh position={[-0.2, 0.66, 0]}>
            <coneGeometry args={[0.18, 0.18, 10]} />
            <meshStandardMaterial color="#f5e3ae" roughness={0.8} />
          </mesh>
          <mesh position={[0.2, 0.66, 0]}>
            <coneGeometry args={[0.18, 0.18, 10]} />
            <meshStandardMaterial color="#f5e3ae" roughness={0.8} />
          </mesh>
        </>
      ) : project.silhouette === "assembly-hall" ? (
        <>
          <mesh position={[0, 0.22, 0]}>
            <boxGeometry args={[0.78, 0.42, 0.48]} />
            <meshStandardMaterial {...surfaceProps} />
          </mesh>
          {[-0.25, 0, 0.25].map((x) => (
            <mesh key={x} position={[x, 0.52, 0.25]}>
              <cylinderGeometry args={[0.045, 0.055, 0.38, 8]} />
              <meshStandardMaterial color="#f5e3ae" roughness={0.82} />
            </mesh>
          ))}
          <mesh position={[0, 0.54, 0]}>
            <coneGeometry args={[0.5, 0.24, 4]} />
            <meshStandardMaterial color="#f5e3ae" roughness={0.8} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.82, 0.4, 0.52]} />
            <meshStandardMaterial {...surfaceProps} />
          </mesh>
          <mesh position={[-0.24, 0.58, -0.04]}>
            <cylinderGeometry args={[0.06, 0.08, 0.58, 8]} />
            <meshStandardMaterial color="#5c5050" roughness={1} />
          </mesh>
          <mesh position={[0.24, 0.5, -0.04]}>
            <cylinderGeometry args={[0.05, 0.07, 0.42, 8]} />
            <meshStandardMaterial color="#5c5050" roughness={1} />
          </mesh>
          <mesh position={[0, 0.48, 0.27]}>
            <boxGeometry args={[0.48, 0.08, 0.08]} />
            <meshStandardMaterial color="#f5e3ae" roughness={0.8} />
          </mesh>
        </>
      )}
      {implementing ? <ProjectScaffold /> : null}
    </group>
  );
}

function FactionBanner({ position }: { readonly position: WorldScenePoint }) {
  return (
    <group position={[position[0], position[1] + 0.1, position[2]]}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.62, 6]} />
        <meshStandardMaterial color="#4a3030" roughness={1} />
      </mesh>
      <mesh position={[0.12, 0.52, 0]}>
        <boxGeometry args={[0.24, 0.16, 0.035]} />
        <meshStandardMaterial color="#dd554f" roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.32, 0.08, 0.28]} />
        <meshStandardMaterial color="#6c4740" roughness={1} />
      </mesh>
    </group>
  );
}

function ConflictActivity({
  conflict,
}: {
  readonly conflict: WorldSceneModel["conflicts"][number];
}) {
  if (conflict.visualKind === "rebellion-camp") {
    return (
      <group position={conflict.position}>
        {[-0.2, 0.04, 0.27].map((x) => (
          <mesh key={x} position={[x, 0.16, (x * 1.7) % 0.12]}>
            <coneGeometry args={[0.14, 0.25, 5]} />
            <meshStandardMaterial color="#8f4a3f" roughness={1} />
          </mesh>
        ))}
        <mesh position={[0.32, 0.58, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="#a7a09a" transparent opacity={0.38} />
        </mesh>
        <mesh position={[0.38, 0.76, 0.02]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshBasicMaterial color="#b5aea4" transparent opacity={0.24} />
        </mesh>
      </group>
    );
  }
  if (conflict.visualKind === "coup-beacon") {
    return (
      <group position={conflict.position}>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.09, 0.13, 0.58, 6]} />
          <meshStandardMaterial color="#55424c" roughness={1} />
        </mesh>
        <mesh position={[0, 0.69, 0]}>
          <octahedronGeometry args={[0.16, 0]} />
          <meshBasicMaterial color="#f3c66c" />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.45, 0.045, 6, 18]} />
          <meshBasicMaterial color="#f0524d" transparent opacity={0.8} />
        </mesh>
      </group>
    );
  }
  return (
    <group position={conflict.position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.44, 0.06, 6, 18]} />
        <meshBasicMaterial color="#f0524d" />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <octahedronGeometry args={[0.18, 0]} />
        <meshBasicMaterial color="#f3c66c" />
      </mesh>
    </group>
  );
}

function WorldScene({
  model,
  cameraState,
  highlightedRegionIds,
  selectedHexId,
  onSelectRegion,
  onSelectHex,
}: {
  readonly model: WorldSceneModel;
  readonly cameraState: CameraState;
  readonly highlightedRegionIds: ReadonlySet<string>;
  readonly selectedHexId: string | null;
  readonly onSelectRegion: (regionId: RegionId) => void;
  readonly onSelectHex: (landHexId: string) => void;
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
  const frontHexIds = useMemo(
    () =>
      new Set(
        model.fronts.flatMap((front) => [
          front.firstLandHexId,
          front.secondLandHexId,
        ]),
      ),
    [model.fronts],
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
        <TerrainBackdrop bounds={model.bounds} />
        <TerrainWorldSurface model={model} />
        {model.hexes.map((hex) => (
          <WorldTile
            key={hex.id}
            hex={hex}
            highlighted={highlightedRegionIds.has(hex.regionId)}
            selected={selectedHexId === hex.id}
            showContextGrid={
              selectedHexId === hex.id ||
              hex.controller.kind === "faction" ||
              frontHexIds.has(hex.id)
            }
            onSelectRegion={onSelectRegion}
            onSelectHex={onSelectHex}
          />
        ))}
        {model.routes.map((route) => (
          <group key={route.id}>
            <SceneLine
              points={[
                new THREE.Vector3(...route.start),
                new THREE.Vector3(...route.end),
              ]}
              color={
                route.active ? routeLineColor(route.visualKind) : "#8a7557"
              }
              opacity={route.active ? 0.9 : 0.2}
              width={route.active ? 2 : 1}
              dashed={route.visualKind === "migration-direction"}
            />
            <RouteChannelGlyph
              start={route.start}
              end={route.end}
              visualKind={route.visualKind}
            />
            {route.active ? (
              <RoutePulse
                start={route.start}
                end={route.end}
                visualKind={route.visualKind}
              />
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
        {model.pois.map((poi) => (
          <PoiObject key={poi.id} poi={poi} />
        ))}
        {model.institutions.map((landmark) => (
          <InstitutionLandmark key={landmark.id} landmark={landmark} />
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
        {model.hexes
          .filter((hex) => hex.controller.kind === "faction")
          .map((hex) => (
            <FactionBanner
              key={`faction-banner:${hex.id}`}
              position={[hex.position[0], hex.height, hex.position[2]]}
            />
          ))}
        {model.factionPresence.map((presence) => (
          <group key={presence.id} position={presence.position}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.3, 0.045, 6, 14]} />
              <meshBasicMaterial color="#e45f55" />
            </mesh>
          </group>
        ))}
        {model.conflicts.map((conflict) => (
          <ConflictActivity key={conflict.id} conflict={conflict} />
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

function routeChannelLabel(
  channel: WorldSceneModel["routes"][number]["channel"],
): string {
  switch (channel) {
    case "trade":
      return "교역 흐름";
    case "information":
      return "정보 흐름";
    case "migration":
      return "이주 흐름";
    case "border":
      return "국경 통행";
  }
}

function poiKindLabel(kind: WorldSceneModel["pois"][number]["kind"]): string {
  switch (kind) {
    case "port":
      return "항구";
    case "mine":
      return "제련소";
    case "fort":
      return "요새";
    case "granary":
      return "곡창";
    case "assembly":
      return "의회당";
  }
}

function institutionKindLabel(
  kind: WorldSceneModel["institutions"][number]["kind"],
): string {
  return kind === "capital-seat" ? "수도 권력 중심" : "의회당";
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
  const [selectedHexId, setSelectedHexId] = useState<string | null>(null);
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
              selectedHexId={selectedHexId}
              onSelectRegion={onSelectRegion}
              onSelectHex={setSelectedHexId}
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
                setSelectedHexId(null);
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
          <div
            className="world-scene-selection"
            aria-live="polite"
            data-selected-hex={selectedHexId ?? "none"}
          >
            {selectedHexId === null
              ? "영토 격자는 선택·충돌 상황에서만 표시됩니다."
              : (() => {
                  const selectedHex = model.hexes.find(
                    (hex) => hex.id === selectedHexId,
                  );
                  return selectedHex === undefined
                    ? "선택한 영토"
                    : `${regionName(selectedHex.regionId)} · ${controllerDescription(selectedHex)}`;
                })()}
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
          {model.settlements.map((settlement) => (
            <span key={settlement.id} className="atlas-settlement-marker">
              {settlement.name} · 수도
            </span>
          ))}
          {model.pois.map((poi) => (
            <span
              key={poi.id}
              className="atlas-poi-marker"
              data-poi-kind={poi.kind}
            >
              {poi.name} · {poiKindLabel(poi.kind)}
            </span>
          ))}
          {model.institutions.map((landmark) => (
            <span
              key={landmark.id}
              className="atlas-institution-landmark"
              data-institution-kind={landmark.kind}
            >
              {landmark.name} · {institutionKindLabel(landmark.kind)}
            </span>
          ))}
          {model.regions.map((region) => (
            <span key={region.id} className="atlas-pressure-pulse">
              {region.name} · 불안/희소성 압력 관측
            </span>
          ))}
          {model.routes.map((route) => (
            <span
              key={route.id}
              className="atlas-route"
              data-route-channel={route.channel}
            >
              {regionName(route.sourceRegionId)} ↔{" "}
              {regionName(route.targetRegionId)} ·{" "}
              {routeChannelLabel(route.channel)}
            </span>
          ))}
          {model.factionPresence.map((presence) => (
            <span key={presence.id} className="atlas-faction-banner">
              {regionName(presence.regionId)} · 세력 깃발
            </span>
          ))}
          {model.conflicts.map((conflict) => (
            <span
              key={conflict.id}
              className="atlas-conflict-marker"
              data-conflict-kind={conflict.kind}
            >
              활성{" "}
              {conflict.kind === "rebellion"
                ? "반란"
                : conflict.kind === "coup"
                  ? "쿠데타"
                  : "충돌"}
            </span>
          ))}
          {model.projects.map((project) => (
            <span
              key={project.id}
              className="atlas-project-marker"
              data-project-silhouette={project.silhouette}
            >
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
