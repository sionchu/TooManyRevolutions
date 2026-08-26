import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";

import { TMR_LAYER_REGISTRY } from "../presentation/design/layerRegistry";
import {
  deriveWorldSceneModel,
  type WorldSceneModel,
  type WorldScenePoint,
} from "../presentation/worldSceneModel";
import {
  DEFAULT_MAP_STYLE,
  deriveMapArchitecture,
  deriveMapLodTier,
  estimateMapOccupancy,
  ideologySurfacePaletteIndex,
  type MapArchitecture,
  type MapLodTier,
  type MapViewPreset,
} from "../presentation/mapArchitecture";
import {
  deriveMapVisualSystem,
  MAP_MATERIAL_SYSTEM,
  type MapRegionComposition,
  type MapVisualSystem,
} from "../presentation/mapVisualSystem";
import type { PresentationState } from "../presentation/presentationState";
import type { RegionId } from "../sim/state/ids";
import type { StateProjectPresentation } from "./stateProjects";
import type { WorldVisualDelta } from "./worldVisualDelta";

const COUNTRY_COLORS = ["#a9694b", "#3f7880", "#6c5c83"] as const;
const CONTROLLER_COLORS = {
  country: "#ead8a4",
  faction: "#e0524f",
  uncontrolled: "#d2d0bd",
} as const;
const IDEOLOGY_SURFACE_COLORS = [
  "#d2a45a",
  "#8a6db1",
  "#5b9b98",
  "#b96f62",
  "#748d61",
] as const;

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

type PolygonPoint = readonly [x: number, z: number];

function polygonPrismGeometry(
  points: readonly PolygonPoint[],
  height: number,
  topScale = 0.82,
): THREE.BufferGeometry {
  const center = points.reduce(
    (total, point) =>
      [total[0] + point[0], total[1] + point[1]] as PolygonPoint,
    [0, 0] as PolygonPoint,
  );
  const centerX = center[0] / points.length;
  const centerZ = center[1] / points.length;
  const vertices = points.flatMap(([x, z]) => [x, 0, z]);
  vertices.push(
    ...points.flatMap(([x, z]) => [
      centerX + (x - centerX) * topScale,
      height,
      centerZ + (z - centerZ) * topScale,
    ]),
  );
  const indices: number[] = [];
  const count = points.length;
  for (let index = 1; index < count - 1; index += 1) {
    indices.push(0, index + 1, index);
    indices.push(count, count + index, count + index + 1);
  }
  for (let index = 0; index < count; index += 1) {
    const next = (index + 1) % count;
    indices.push(index, next, count + next, index, count + next, count + index);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function pyramidGeometry(
  points: readonly PolygonPoint[],
  height: number,
): THREE.BufferGeometry {
  const center = points.reduce(
    (total, point) =>
      [total[0] + point[0], total[1] + point[1]] as PolygonPoint,
    [0, 0] as PolygonPoint,
  );
  const centerX = center[0] / points.length;
  const centerZ = center[1] / points.length;
  const vertices = points.flatMap(([x, z]) => [x, 0, z]);
  vertices.push(centerX, height, centerZ);
  const indices: number[] = [];
  const apex = points.length;
  for (let index = 0; index < points.length; index += 1) {
    const next = (index + 1) % points.length;
    indices.push(index, next, apex);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function KitPrism({
  points,
  height,
  topScale,
  color,
  opacity = 1,
}: {
  readonly points: readonly PolygonPoint[];
  readonly height: number;
  readonly topScale?: number;
  readonly color: string;
  readonly opacity?: number;
}) {
  const geometry = useMemo(
    () => polygonPrismGeometry(points, height, topScale),
    [height, points, topScale],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={color}
        roughness={MAP_MATERIAL_SYSTEM.roughness}
        metalness={MAP_MATERIAL_SYSTEM.metalness}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  );
}

function KitPyramid({
  points,
  height,
  color,
}: {
  readonly points: readonly PolygonPoint[];
  readonly height: number;
  readonly color: string;
}) {
  const geometry = useMemo(
    () => pyramidGeometry(points, height),
    [height, points],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={color}
        roughness={MAP_MATERIAL_SYSTEM.roughness}
        metalness={MAP_MATERIAL_SYSTEM.metalness}
      />
    </mesh>
  );
}

function ContactShadow({ scale = 1 }: { readonly scale?: number }) {
  return (
    <mesh
      position={[0, 0.012, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={[scale, scale * 0.68, 1]}
    >
      <circleGeometry args={[0.62, 18]} />
      <meshBasicMaterial
        color={MAP_MATERIAL_SYSTEM.contactShadowColor}
        transparent
        opacity={MAP_MATERIAL_SYSTEM.contactShadowOpacity}
        depthWrite={false}
      />
    </mesh>
  );
}

function UrbanClusterKit({ scale = 1 }: { readonly scale?: number }) {
  const small = useMemo(
    () =>
      [
        [-0.38, -0.22],
        [-0.1, -0.32],
        [0.18, -0.2],
        [0.28, 0.12],
        [-0.06, 0.26],
        [-0.34, 0.14],
      ] as const,
    [],
  );
  const tall = useMemo(
    () =>
      [
        [-0.18, -0.2],
        [0.08, -0.24],
        [0.22, 0.02],
        [0.08, 0.22],
        [-0.18, 0.16],
        [-0.3, -0.02],
      ] as const,
    [],
  );
  return (
    <group scale={[scale, scale, scale]}>
      <ContactShadow scale={0.95} />
      <KitPrism
        points={small}
        height={0.22}
        color={MAP_MATERIAL_SYSTEM.palette["earth-ochre"]}
      />
      <KitPrism
        points={tall}
        height={0.38}
        topScale={0.72}
        color={MAP_MATERIAL_SYSTEM.palette["civic-cream"]}
      />
      <KitPyramid
        points={tall}
        height={0.56}
        color={MAP_MATERIAL_SYSTEM.palette["earth-ochre"]}
      />
    </group>
  );
}

function CapitalPalaceKit({ scale = 1 }: { readonly scale?: number }) {
  const body = useMemo(
    () =>
      [
        [-0.5, -0.34],
        [0.5, -0.34],
        [0.4, 0.3],
        [0.08, 0.42],
        [-0.4, 0.3],
      ] as const,
    [],
  );
  const roof = useMemo(
    () =>
      [
        [-0.4, -0.26],
        [0.4, -0.26],
        [0.3, 0.25],
        [-0.3, 0.25],
      ] as const,
    [],
  );
  return (
    <group scale={[scale, scale, scale]}>
      <ContactShadow scale={1.25} />
      <KitPrism
        points={body}
        height={0.42}
        color={MAP_MATERIAL_SYSTEM.palette["civic-cream"]}
      />
      <KitPyramid
        points={roof}
        height={0.3}
        color={MAP_MATERIAL_SYSTEM.palette["earth-ochre"]}
      />
      <mesh position={[0, 0.65, 0]}>
        <octahedronGeometry args={[0.14, 0]} />
        <meshStandardMaterial
          color={MAP_MATERIAL_SYSTEM.palette["civic-cream"]}
          roughness={0.92}
        />
      </mesh>
    </group>
  );
}

function AssemblyKit({ scale = 1 }: { readonly scale?: number }) {
  const hall = useMemo(
    () =>
      [
        [-0.44, -0.25],
        [0.44, -0.25],
        [0.34, 0.26],
        [-0.34, 0.26],
      ] as const,
    [],
  );
  return (
    <group scale={[scale, scale, scale]}>
      <ContactShadow scale={1.05} />
      <KitPrism
        points={hall}
        height={0.4}
        color={MAP_MATERIAL_SYSTEM.palette["civic-cream"]}
      />
      <KitPyramid
        points={hall}
        height={0.28}
        color={MAP_MATERIAL_SYSTEM.palette["earth-ochre"]}
      />
      <mesh position={[0, 0.53, 0]}>
        <octahedronGeometry args={[0.12, 0]} />
        <meshStandardMaterial
          color={MAP_MATERIAL_SYSTEM.palette["civic-cream"]}
          roughness={0.92}
        />
      </mesh>
    </group>
  );
}

function IndustryWorksKit({ scale = 1 }: { readonly scale?: number }) {
  const works = useMemo(
    () =>
      [
        [-0.52, -0.3],
        [0.46, -0.3],
        [0.52, 0.16],
        [0.18, 0.3],
        [-0.48, 0.18],
      ] as const,
    [],
  );
  return (
    <group scale={[scale, scale, scale]}>
      <ContactShadow scale={1.18} />
      <KitPrism
        points={works}
        height={0.34}
        topScale={0.86}
        color={MAP_MATERIAL_SYSTEM.palette["stone-slate"]}
      />
      <mesh position={[-0.18, 0.55, 0]}>
        <cylinderGeometry args={[0.08, 0.11, 0.5, 7]} />
        <meshStandardMaterial
          color={MAP_MATERIAL_SYSTEM.terrainShadow}
          roughness={0.98}
        />
      </mesh>
      <mesh position={[0.22, 0.46, 0.05]}>
        <cylinderGeometry args={[0.06, 0.08, 0.32, 7]} />
        <meshStandardMaterial
          color={MAP_MATERIAL_SYSTEM.terrainShadow}
          roughness={0.98}
        />
      </mesh>
    </group>
  );
}

function FieldsKit({ scale = 1 }: { readonly scale?: number }) {
  const field = useMemo(
    () =>
      [
        [-0.58, -0.28],
        [0.55, -0.28],
        [0.48, 0.24],
        [-0.52, 0.24],
      ] as const,
    [],
  );
  return (
    <group scale={[scale, scale, scale]}>
      <ContactShadow scale={1.28} />
      <KitPrism points={field} height={0.035} topScale={0.98} color="#b6a261" />
      {[-0.28, -0.08, 0.12, 0.32].map((x) => (
        <mesh key={x} position={[x, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.05, 0.8]} />
          <meshBasicMaterial
            color="#d6c17b"
            transparent
            opacity={0.62}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function FortGateKit({ scale = 1 }: { readonly scale?: number }) {
  const wall = useMemo(
    () =>
      [
        [-0.52, -0.3],
        [0.52, -0.3],
        [0.42, 0.3],
        [-0.42, 0.3],
      ] as const,
    [],
  );
  return (
    <group scale={[scale, scale, scale]}>
      <ContactShadow scale={1.08} />
      <KitPrism
        points={wall}
        height={0.22}
        color={MAP_MATERIAL_SYSTEM.palette["stone-slate"]}
      />
      <KitPyramid
        points={wall}
        height={0.48}
        color={MAP_MATERIAL_SYSTEM.palette["stone-slate"]}
      />
      <mesh position={[0, 0.2, -0.32]}>
        <planeGeometry args={[0.24, 0.24]} />
        <meshBasicMaterial
          color="#b86d4d"
          transparent
          opacity={0.92}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function CrisisBeaconKit({ scale = 1 }: { readonly scale?: number }) {
  const beacon = useMemo(
    () =>
      [
        [-0.18, -0.18],
        [0.18, -0.18],
        [0.22, 0.15],
        [0, 0.27],
        [-0.22, 0.15],
      ] as const,
    [],
  );
  return (
    <group scale={[scale, scale, scale]}>
      <ContactShadow scale={0.75} />
      <KitPrism
        points={beacon}
        height={0.28}
        color={MAP_MATERIAL_SYSTEM.palette["crisis-iron"]}
      />
      <mesh position={[0, 0.54, 0]}>
        <octahedronGeometry args={[0.15, 0]} />
        <meshBasicMaterial color="#f3c66c" />
      </mesh>
    </group>
  );
}

function CompositionLayer({
  compositions,
  showMeso,
}: {
  readonly compositions: readonly MapRegionComposition[];
  readonly showMeso: boolean;
}) {
  if (!showMeso) return null;
  return (
    <group
      userData={{ mapLayer: "MapSemanticContent", composition: "authored" }}
    >
      {compositions.map((composition) => {
        const roleScale = composition.dominantScale;
        const assetSet = new Set(composition.assetIds);
        return (
          <group
            key={`composition:${composition.regionId}`}
            position={composition.anchor}
          >
            {assetSet.has("asset.settlement.urban-cluster") ? (
              <group position={[-0.54, 0.03, 0.26]}>
                <UrbanClusterKit scale={roleScale * 0.72} />
              </group>
            ) : null}
            {assetSet.has("asset.capital.palace") ? (
              <group position={[0.12, 0.05, -0.18]}>
                <CapitalPalaceKit scale={roleScale} />
              </group>
            ) : null}
            {assetSet.has("asset.institution.assembly") ? (
              <group position={[0.5, 0.04, 0.25]}>
                <AssemblyKit scale={roleScale * 0.82} />
              </group>
            ) : null}
            {assetSet.has("asset.industry.works") ||
            assetSet.has("asset.project.works") ? (
              <group position={[0.18, 0.04, 0.34]}>
                <IndustryWorksKit scale={roleScale * 0.82} />
              </group>
            ) : null}
            {assetSet.has("asset.agriculture.fields") ||
            assetSet.has("asset.project.granary") ? (
              <group position={[0.08, 0.04, 0.38]}>
                <FieldsKit scale={roleScale * 0.9} />
              </group>
            ) : null}
            {assetSet.has("asset.frontier.fort-gate") ? (
              <group position={[0.46, 0.05, -0.32]}>
                <FortGateKit scale={roleScale * 0.82} />
              </group>
            ) : null}
          </group>
        );
      })}
    </group>
  );
}

function TerrainWorldSurface({
  architecture,
}: {
  readonly architecture: MapArchitecture;
}) {
  const geometry = useMemo(() => {
    const {
      vertices,
      colors: vertexColors,
      triangles,
    } = architecture.sharedTerrainMesh;
    const nextGeometry = new THREE.BufferGeometry();
    nextGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        vertices.flatMap((point) => [point[0], point[1], point[2]]),
        3,
      ),
    );
    nextGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(
        vertexColors.flatMap((color) => [color[0], color[1], color[2]]),
        3,
      ),
    );
    nextGeometry.setIndex(triangles.flatMap((triangle) => [...triangle]));
    nextGeometry.computeVertexNormals();
    return nextGeometry;
  }, [architecture.sharedTerrainMesh]);
  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry],
  );
  return (
    <mesh
      geometry={geometry}
      userData={{
        truthClass: "DECORATIVE_SUBSTRATE",
        mapLayer: "MapGeographyDefinition",
        sharedVertexCount: architecture.sharedTerrainMesh.sharedVertexCount,
      }}
    >
      <meshStandardMaterial vertexColors roughness={0.98} metalness={0} />
    </mesh>
  );
}

function TerrainBackdrop({
  bounds,
}: {
  readonly bounds: MapArchitecture["geography"]["worldBounds"];
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
          bounds.maxX - bounds.minX + 1.2,
          bounds.maxZ - bounds.minZ + 1.2,
        ]}
      />
      <meshStandardMaterial color="#4f584b" roughness={1} />
    </mesh>
  );
}

function MapPathLayer({
  architecture,
  lodTier,
}: {
  readonly architecture: MapArchitecture;
  readonly lodTier: MapLodTier;
}) {
  const paths = [
    ...architecture.geography.coastlinePaths,
    ...(lodTier === "far" ? [] : architecture.geography.ridgePaths),
    ...(lodTier === "far" ? [] : architecture.geography.roadPaths),
  ];
  return (
    <group userData={{ mapLayer: "MapGeographyDefinition" }}>
      {paths.map((path) => (
        <SceneLine
          key={path.id}
          points={path.points.map((point) => new THREE.Vector3(...point))}
          color={
            path.kind === "coastline"
              ? "#c5e4d8"
              : path.kind === "ridge"
                ? "#b2a081"
                : "#d6b579"
          }
          opacity={path.kind === "road" ? 0.22 : 0.38}
          width={path.kind === "road" ? 1 : 1.2}
          dashed={path.kind === "road"}
        />
      ))}
    </group>
  );
}

function IdeologySurfaceLayer({
  model,
  architecture,
}: {
  readonly model: WorldSceneModel;
  readonly architecture: MapArchitecture;
}) {
  const hexesById = useMemo(
    () =>
      new Map<string, WorldSceneModel["hexes"][number]>(
        model.hexes.map((hex) => [hex.id, hex]),
      ),
    [model.hexes],
  );
  const footprint = (landHexIds: readonly string[]) => {
    const hexes = landHexIds.flatMap((id) => {
      const hex = hexesById.get(id);
      return hex === undefined ? [] : [hex];
    });
    if (hexes.length === 0) return null;
    const minX = Math.min(...hexes.map((hex) => hex.position[0]));
    const maxX = Math.max(...hexes.map((hex) => hex.position[0]));
    const minZ = Math.min(...hexes.map((hex) => hex.position[2]));
    const maxZ = Math.max(...hexes.map((hex) => hex.position[2]));
    return {
      x: (minX + maxX) / 2,
      z: (minZ + maxZ) / 2,
      width: Math.max(1.25, maxX - minX + 1.65),
      depth: Math.max(1, maxZ - minZ + 1.35),
      y: Math.max(...hexes.map((hex) => hex.position[1] + hex.height)) + 0.045,
    };
  };
  return (
    <group
      userData={{
        mapLayer: "MapPoliticalProjection",
        truthClass: "AUTHORITATIVE_PROJECTION",
      }}
    >
      {architecture.political.ideologySurfaces.flatMap((surface) => {
        const area = footprint(surface.landHexIds);
        if (area === null) return [];
        return [
          <mesh
            key={surface.id}
            position={[area.x, area.y, area.z]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[area.width, area.depth, 1]}
          >
            <circleGeometry args={[0.5, 32]} />
            <meshBasicMaterial
              color={
                IDEOLOGY_SURFACE_COLORS[
                  ideologySurfacePaletteIndex(surface.ideologyId)
                ]
              }
              transparent
              opacity={
                DEFAULT_MAP_STYLE.ideologySurfaceOpacity *
                (0.45 + surface.support * 0.35)
              }
              depthWrite={false}
            />
          </mesh>,
        ];
      })}
      {architecture.political.factionTerritories.flatMap((territory) => {
        const area = footprint(territory.landHexIds);
        if (area === null) return [];
        return [
          <mesh
            key={`faction-surface:${territory.factionId}`}
            position={[area.x, area.y + 0.006, area.z]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[area.width, area.depth, 1]}
          >
            <circleGeometry args={[0.5, 32]} />
            <meshBasicMaterial
              color={CONTROLLER_COLORS.faction}
              transparent
              opacity={0.12}
              depthWrite={false}
            />
          </mesh>,
        ];
      })}
    </group>
  );
}

function BoundaryLayer({
  architecture,
}: {
  readonly architecture: MapArchitecture;
}) {
  const renderSegments = (
    segments: readonly MapArchitecture["political"]["physicalControllerBoundarySegments"][number][],
    color: string,
    width: number,
    opacity: number,
  ) =>
    segments.map((segment) => (
      <SceneLine
        key={segment.id}
        points={[
          new THREE.Vector3(...segment.from),
          new THREE.Vector3(...segment.to),
        ]}
        color={color}
        opacity={opacity}
        width={width}
      />
    ));
  return (
    <group
      userData={{
        mapLayer: "MapPoliticalProjection",
        ownerBoundaryCount:
          architecture.political.legalOwnerBoundarySegments.length,
        controllerBoundaryCount:
          architecture.political.physicalControllerBoundarySegments.length,
        frontBoundaryCount: architecture.political.frontBoundarySegments.length,
      }}
    >
      {renderSegments(
        architecture.political.legalOwnerBoundarySegments,
        DEFAULT_MAP_STYLE.ownerBoundaryColor,
        DEFAULT_MAP_STYLE.ownerBoundaryWidth,
        0.52,
      )}
      {renderSegments(
        architecture.political.physicalControllerBoundarySegments,
        DEFAULT_MAP_STYLE.controllerBoundaryColor,
        DEFAULT_MAP_STYLE.controllerBoundaryWidth,
        0.84,
      )}
      {renderSegments(
        architecture.political.frontBoundarySegments,
        DEFAULT_MAP_STYLE.frontBoundaryColor,
        DEFAULT_MAP_STYLE.frontBoundaryWidth,
        0.96,
      )}
    </group>
  );
}

function WorldTile({
  hex,
  selected,
  showContextGrid,
  onSelectRegion,
  onSelectHex,
}: {
  readonly hex: WorldSceneModel["hexes"][number];
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
    <group
      position={settlement.position}
      userData={{ assetId: "asset.capital.palace" }}
    >
      <CapitalPalaceKit scale={0.94} />
    </group>
  );
}

function LegacyPoiObject({
  poi,
}: {
  readonly poi: WorldSceneModel["pois"][number];
}) {
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

function PoiObject({ poi }: { readonly poi: WorldSceneModel["pois"][number] }) {
  const port = useMemo(
    () =>
      [
        [-0.62, -0.16],
        [0.62, -0.16],
        [0.48, 0.16],
        [-0.48, 0.16],
      ] as const,
    [],
  );
  const mine = useMemo(
    () =>
      [
        [-0.42, -0.3],
        [0.38, -0.3],
        [0.48, 0.12],
        [0.1, 0.3],
        [-0.44, 0.16],
      ] as const,
    [],
  );
  const fort = useMemo(
    () =>
      [
        [-0.46, -0.3],
        [0.46, -0.3],
        [0.38, 0.3],
        [-0.38, 0.3],
      ] as const,
    [],
  );
  const granary = useMemo(
    () =>
      [
        [-0.32, -0.22],
        [0.32, -0.22],
        [0.32, 0.22],
        [-0.32, 0.22],
      ] as const,
    [],
  );
  const assembly = useMemo(
    () =>
      [
        [-0.5, -0.24],
        [0.5, -0.24],
        [0.34, 0.3],
        [-0.34, 0.3],
      ] as const,
    [],
  );
  return (
    <group
      position={poi.position}
      userData={{ assetId: `asset.poi.${poi.kind}` }}
    >
      <ContactShadow scale={0.84} />
      {poi.kind === "port" ? (
        <>
          <KitPrism
            points={port}
            height={0.12}
            color={MAP_MATERIAL_SYSTEM.palette["earth-ochre"]}
          />
          <mesh position={[0.3, 0.36, 0]}>
            <cylinderGeometry args={[0.035, 0.05, 0.6, 7]} />
            <meshStandardMaterial
              color={MAP_MATERIAL_SYSTEM.terrainShadow}
              roughness={0.98}
            />
          </mesh>
          <mesh position={[0.38, 0.52, 0]} rotation={[0, 0, -0.2]}>
            <planeGeometry args={[0.28, 0.2]} />
            <meshStandardMaterial
              color={MAP_MATERIAL_SYSTEM.palette["civic-cream"]}
              side={THREE.DoubleSide}
              roughness={0.92}
            />
          </mesh>
        </>
      ) : poi.kind === "mine" ? (
        <>
          <KitPrism
            points={mine}
            height={0.28}
            color={MAP_MATERIAL_SYSTEM.palette["stone-slate"]}
          />
          <mesh position={[-0.18, 0.56, 0]}>
            <cylinderGeometry args={[0.065, 0.09, 0.5, 7]} />
            <meshStandardMaterial
              color={MAP_MATERIAL_SYSTEM.terrainShadow}
              roughness={0.98}
            />
          </mesh>
          <mesh position={[0.2, 0.46, 0.04]}>
            <cylinderGeometry args={[0.05, 0.075, 0.32, 7]} />
            <meshStandardMaterial
              color={MAP_MATERIAL_SYSTEM.terrainShadow}
              roughness={0.98}
            />
          </mesh>
        </>
      ) : poi.kind === "fort" ? (
        <>
          <KitPrism
            points={fort}
            height={0.24}
            color={MAP_MATERIAL_SYSTEM.palette["stone-slate"]}
          />
          <KitPyramid
            points={fort}
            height={0.52}
            color={MAP_MATERIAL_SYSTEM.palette["stone-slate"]}
          />
          <mesh position={[0, 0.25, -0.32]}>
            <planeGeometry args={[0.2, 0.24]} />
            <meshBasicMaterial
              color="#b86d4d"
              transparent
              opacity={0.92}
              depthWrite={false}
            />
          </mesh>
        </>
      ) : poi.kind === "granary" ? (
        <>
          <KitPrism
            points={granary}
            height={0.32}
            color={MAP_MATERIAL_SYSTEM.palette["civic-cream"]}
          />
          <KitPyramid
            points={granary}
            height={0.54}
            color={MAP_MATERIAL_SYSTEM.palette["earth-ochre"]}
          />
          <mesh position={[0, 0.36, 0.24]}>
            <planeGeometry args={[0.14, 0.22]} />
            <meshBasicMaterial color="#d7bf79" depthWrite={false} />
          </mesh>
        </>
      ) : (
        <>
          <KitPrism
            points={assembly}
            height={0.38}
            color={MAP_MATERIAL_SYSTEM.palette["civic-cream"]}
          />
          <KitPyramid
            points={assembly}
            height={0.68}
            color={MAP_MATERIAL_SYSTEM.palette["earth-ochre"]}
          />
        </>
      )}
    </group>
  );
}

function LegacyInstitutionLandmark({
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

function InstitutionLandmark({
  landmark,
}: {
  readonly landmark: WorldSceneModel["institutions"][number];
}) {
  const capital = landmark.kind === "capital-seat";
  return (
    <group
      position={landmark.position}
      userData={{
        assetId: capital
          ? "asset.capital.palace"
          : "asset.institution.assembly",
      }}
    >
      {capital ? (
        <CapitalPalaceKit scale={0.78} />
      ) : (
        <AssemblyKit scale={0.72} />
      )}
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

function LegacyProjectLandmark({
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

function ConstructionFrameKit({ scale = 1 }: { readonly scale?: number }) {
  const beam = useMemo(
    () =>
      [
        [-0.07, -0.07],
        [0.07, -0.07],
        [0.07, 0.07],
        [-0.07, 0.07],
      ] as const,
    [],
  );
  return (
    <group scale={[scale, scale, scale]}>
      {[
        [-0.36, 0.34, -0.24],
        [0.36, 0.34, -0.24],
        [-0.36, 0.34, 0.24],
        [0.36, 0.34, 0.24],
      ].map(([x, y, z]) => (
        <group key={`${x}:${z}`} position={[x, y, z]}>
          <KitPrism points={beam} height={0.68} color="#d98755" />
        </group>
      ))}
    </group>
  );
}

function ProjectLandmark({
  project,
}: {
  readonly project: WorldSceneModel["projects"][number];
}) {
  const baseScale = project.landmarkKind === "food" ? 0.84 : 0.8;
  return (
    <group
      position={project.position}
      userData={{ assetId: `asset.project.${project.landmarkKind}` }}
    >
      {project.status === "not-started" ? (
        <>
          <ContactShadow scale={0.7} />
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.24, 0.28, 12]} />
            <meshBasicMaterial
              color="#9b9b89"
              transparent
              opacity={0.56}
              depthWrite={false}
            />
          </mesh>
        </>
      ) : project.landmarkKind === "food" ? (
        <FieldsKit scale={baseScale} />
      ) : project.landmarkKind === "civic" ? (
        <AssemblyKit scale={baseScale} />
      ) : (
        <IndustryWorksKit scale={baseScale} />
      )}
      {project.status === "implementing" ? (
        <ConstructionFrameKit scale={0.7} />
      ) : null}
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

function LegacyConflictActivity({
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

function ConflictActivity({
  conflict,
}: {
  readonly conflict: WorldSceneModel["conflicts"][number];
}) {
  return (
    <group
      position={conflict.position}
      userData={{ assetId: "asset.activity.crisis-beacon" }}
    >
      <CrisisBeaconKit
        scale={conflict.visualKind === "rebellion-camp" ? 1.12 : 0.96}
      />
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[0.42, 0.46, 18]} />
        <meshBasicMaterial
          color="#f0524d"
          transparent
          opacity={0.32}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function WorldScene({
  model,
  architecture,
  visualSystem,
  lodTier,
  cameraState,
  highlightedRegionIds,
  selectedHexId,
  onSelectRegion,
  onSelectHex,
}: {
  readonly model: WorldSceneModel;
  readonly architecture: MapArchitecture;
  readonly visualSystem: MapVisualSystem;
  readonly lodTier: MapLodTier;
  readonly cameraState: CameraState;
  readonly highlightedRegionIds: ReadonlySet<string>;
  readonly selectedHexId: string | null;
  readonly onSelectRegion: (regionId: RegionId) => void;
  readonly onSelectHex: (landHexId: string) => void;
}) {
  const { camera, size } = useThree();
  const fitZoom = Math.min(
    size.width /
      Math.max(
        architecture.geography.worldBounds.maxX -
          architecture.geography.worldBounds.minX +
          1.2,
        1,
      ),
    size.height /
      Math.max(
        architecture.geography.worldBounds.maxZ -
          architecture.geography.worldBounds.minZ +
          1.2,
        1,
      ),
  );
  useEffect(() => {
    camera.position.set(cameraState.x, 10, cameraState.z + 14);
    camera.lookAt(cameraState.x, 0, cameraState.z);
    camera.zoom = Math.max(12, fitZoom * cameraState.zoom * 1.28);
    camera.updateProjectionMatrix();
  }, [camera, cameraState, fitZoom]);

  const regionsById = useMemo(
    () => new Map(model.regions.map((region) => [region.regionId, region])),
    [model.regions],
  );
  const showDetailedObjects = lodTier !== "far";
  const showMinorObjects = lodTier === "near";
  return (
    <>
      <color attach="background" args={[visualSystem.material.fogColor]} />
      <fog
        attach="fog"
        args={[
          visualSystem.material.fogColor,
          visualSystem.material.fogNear,
          visualSystem.material.fogFar,
        ]}
      />
      <hemisphereLight args={["#e7dec4", "#465144", 0.48]} />
      <ambientLight intensity={visualSystem.material.ambientFill} />
      <directionalLight
        castShadow
        position={[-5, 12, 7]}
        intensity={visualSystem.material.keyLight}
        color="#f1d9ad"
      />
      <directionalLight
        position={[7, 7, -5]}
        intensity={0.42}
        color="#e6c79b"
      />
      <group>
        <TerrainBackdrop bounds={architecture.geography.worldBounds} />
        <TerrainWorldSurface architecture={architecture} />
        <CompositionLayer
          compositions={visualSystem.compositions}
          showMeso={showDetailedObjects}
        />
        <MapPathLayer architecture={architecture} lodTier={lodTier} />
        <IdeologySurfaceLayer model={model} architecture={architecture} />
        <BoundaryLayer architecture={architecture} />
        {model.hexes.map((hex) => (
          <WorldTile
            key={hex.id}
            hex={hex}
            selected={selectedHexId === hex.id}
            showContextGrid={selectedHexId === hex.id}
            onSelectRegion={onSelectRegion}
            onSelectHex={onSelectHex}
          />
        ))}
        {model.routes
          .filter((route) => lodTier !== "far" || route.active)
          .map((route) => (
            <group key={route.id}>
              <SceneLine
                points={[
                  new THREE.Vector3(...route.start),
                  new THREE.Vector3(...route.end),
                ]}
                color={
                  route.active ? routeLineColor(route.visualKind) : "#8a7557"
                }
                opacity={
                  (route.active ? 0.9 : 0.2) *
                  DEFAULT_MAP_STYLE.routeOpacity[lodTier]
                }
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
        {model.settlements.map((settlement) => (
          <Settlement key={settlement.id} settlement={settlement} />
        ))}
        {showDetailedObjects
          ? model.pois.map((poi) => <PoiObject key={poi.id} poi={poi} />)
          : null}
        {showDetailedObjects
          ? model.institutions.map((landmark) => (
              <InstitutionLandmark key={landmark.id} landmark={landmark} />
            ))
          : null}
        {showDetailedObjects
          ? model.projects.map((project) => (
              <ProjectLandmark key={project.id} project={project} />
            ))
          : null}
        {showMinorObjects
          ? model.hexes
              .filter((hex) => hex.controller.kind === "faction")
              .map((hex) => (
                <FactionBanner
                  key={`faction-banner:${hex.id}`}
                  position={[hex.position[0], hex.height, hex.position[2]]}
                />
              ))
          : null}
        {showMinorObjects && model.factionPresence.length > 0
          ? model.factionPresence.map((presence) => (
              <group key={presence.id} position={presence.position}>
                <mesh>
                  <boxGeometry args={[0.22, 0.16, 0.22]} />
                  <meshBasicMaterial color="#e45f55" />
                </mesh>
              </group>
            ))
          : null}
        {model.conflicts.map((conflict) => (
          <ConflictActivity key={conflict.id} conflict={conflict} />
        ))}
        {visualSystem.labels.map((label) => {
          const region = model.regions.find(
            (candidate) => candidate.id === label.id,
          );
          const country = model.countries.find(
            (candidate) => candidate.id === label.id,
          );
          const color =
            label.kind === "crisis"
              ? "#f1b27c"
              : label.kind === "country" && country !== undefined
                ? countryColor(model, country.countryId)
                : label.kind === "region" &&
                    region !== undefined &&
                    highlightedRegionIds.has(region.regionId)
                  ? "#f0d49b"
                  : label.kind === "capital"
                    ? "#ead49b"
                    : "#7f332f";
          return (
            <SpriteLabel
              key={label.id}
              label={label.text}
              position={label.position}
              color={color}
              scale={label.scale * 1.35 * DEFAULT_MAP_STYLE.labelScale[lodTier]}
            />
          );
        })}
      </group>
      <group userData={{ regions: regionsById.size }} />
    </>
  );
}

// Kept as a reference during this targeted art migration; production JSX uses
// the authored procedural kit components above.
void LegacyPoiObject;
void LegacyInstitutionLandmark;
void LegacyProjectLandmark;
void LegacyConflictActivity;

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

function defaultMapPreset(presets: readonly MapViewPreset[]): MapViewPreset {
  const mobile =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(max-width: 760px)").matches;
  const requestedId = mobile ? "mobile.player-theater" : "desktop.global";
  return (
    presets.find((preset) => preset.id === requestedId) ??
    presets[0] ?? {
      id: "desktop.global",
      label: "데스크톱 세계",
      x: 0,
      z: 0,
      zoom: 1,
      minZoom: 0.8,
      maxZoom: 2.2,
      truthClass: "DERIVED_PRESENTATION",
    }
  );
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
  const architecture = useMemo(() => deriveMapArchitecture(model), [model]);
  const viewPresets = architecture.viewPresets;
  const initialPreset = useMemo(
    () => defaultMapPreset(viewPresets),
    [viewPresets],
  );
  const presetById = useMemo(
    () => new Map(viewPresets.map((preset) => [preset.id, preset])),
    [viewPresets],
  );
  const [activePresetId, setActivePresetId] = useState<MapViewPreset["id"]>(
    initialPreset.id,
  );
  const [camera, setCamera] = useState<CameraState>(() => ({
    x: initialPreset.x,
    z: initialPreset.z,
    zoom: initialPreset.zoom,
  }));
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
  const activeFocusPreset =
    focusRegionId === null
      ? (presetById.get(activePresetId) ?? initialPreset)
      : (presetById.get(`region.focus.${focusRegionId}`) ?? initialPreset);
  useEffect(() => {
    const target = activeFocusPreset;
    setCamera((current) => ({
      x: Number(target.x.toFixed(3)),
      z: Number(target.z.toFixed(3)),
      zoom: current.zoom === target.zoom ? current.zoom : target.zoom,
    }));
  }, [activeFocusPreset]);
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
  const desktopOccupancy = estimateMapOccupancy(
    model,
    presetById.get("desktop.global") ?? initialPreset,
  );
  const mobileOccupancy = estimateMapOccupancy(
    model,
    presetById.get("mobile.player-theater") ?? initialPreset,
  );
  const lodTier = deriveMapLodTier(camera.zoom);
  const labelsHidden =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("mapLabels") === "0";
  const visualSystem = useMemo(
    () => deriveMapVisualSystem(model, architecture, lodTier),
    [architecture, lodTier, model],
  );
  const renderedVisualSystem = labelsHidden
    ? { ...visualSystem, labels: [] as const }
    : visualSystem;
  const focusPresetId =
    focusRegionId === null
      ? activePresetId
      : (`region.focus.${focusRegionId}` as MapViewPreset["id"]);

  return (
    <div className="atlas-frame world-scene-frame" data-map-renderer="r3f">
      <div className="map-wrap world-scene-wrap">
        <div
          className="world-scene-viewport"
          data-world-scene-tick={model.tick}
          data-camera-focus={focusRegionId ?? "world"}
          data-map-preset={focusPresetId}
          data-camera-zoom={camera.zoom.toFixed(2)}
          data-map-lod={lodTier}
          data-map-visual-scale={visualSystem.visualScale}
          data-map-label-count={renderedVisualSystem.labels.length}
          data-map-label-policy="priority-collision-lod"
          data-map-composition-count={visualSystem.compositions.length}
          data-map-asset-kit={visualSystem.assets.length}
          data-land-hex-count={model.hexes.length}
          data-world-content-occupancy-width={desktopOccupancy.width.toFixed(3)}
          data-world-content-occupancy-height={desktopOccupancy.height.toFixed(
            3,
          )}
          data-mobile-content-occupancy-width={mobileOccupancy.width.toFixed(3)}
          data-mobile-content-occupancy-height={mobileOccupancy.height.toFixed(
            3,
          )}
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
              architecture={architecture}
              visualSystem={renderedVisualSystem}
              lodTier={lodTier}
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
              data-map-focus="player-theater"
              onClick={() => {
                onClearFocus();
                setActivePresetId("mobile.player-theater");
                setSelectedHexId(null);
              }}
            >
              내 극장
            </button>
            <button
              type="button"
              data-map-focus="world"
              onClick={() => {
                onClearFocus();
                setActivePresetId("full-world");
                setSelectedHexId(null);
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
