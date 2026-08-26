import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";

import { TMR_LAYER_REGISTRY } from "../presentation/design/layerRegistry";
import { TMR_ICON_IDS } from "../presentation/design/iconRegistry";
import { TmrIcon } from "./icons/TmrIcon";
import {
  deriveWorldSceneModel,
  type WorldSceneModel,
  type WorldScenePoint,
} from "../presentation/worldSceneModel";
import {
  DEFAULT_MAP_STYLE,
  deriveFactionPresenceAnchors,
  deriveMapArchitecture,
  deriveMapLodTier,
  deriveMapViewportBounds,
  inspectMapScreenSpaceOccupancy,
  ideologySurfacePaletteIndex,
  type MapArchitecture,
  type MapLodTier,
  type MapScreenSpaceOccupancy,
  type MapScreenSpaceRect,
  type MapViewPreset,
} from "../presentation/mapArchitecture";
import {
  deriveMapVisualSystem,
  MAP_MATERIAL_SYSTEM,
  type MapVisualSystem,
} from "../presentation/mapVisualSystem";
import {
  deriveIntegratedRegionArtPlan,
  type IntegratedRegionArtPlacement,
  type IntegratedRegionArtPlan,
} from "../presentation/mapContent";
import {
  PROCEDURAL_WORLD_ART_KITS,
  ProceduralWorldArtKitRenderer,
} from "../presentation/mapVisual";
import {
  getResolvedWorldAssetEntries,
  type WorldAssetManifestEntry,
  type WorldAssetSlotId,
} from "../presentation/modelAssets/worldAssetManifest";
import {
  deriveMapRuntimeGeometry,
  type MapRuntimeGeometry,
  type MapRuntimePolygon,
} from "../presentation/mapRuntime/geometry";
import type { PresentationState } from "../presentation/presentationState";
import type { RegionId } from "../sim/state/ids";
import type { StateProjectPresentation } from "./stateProjects";
import type { WorldVisualDelta } from "./worldVisualDelta";
import { WorldAssetModel } from "./mapVisual/WorldAssetModel";

const COUNTRY_COLORS = ["#a9694b", "#3f7880", "#6c5c83"] as const;
const CONTROLLER_COLORS = {
  country: "#ead8a4",
  faction: "#e0524f",
  uncontrolled: "#d2d0bd",
} as const;

const PROCEDURAL_WORLD_ART_KIT_COUNT = Object.keys(
  PROCEDURAL_WORLD_ART_KITS,
).length;
const PRODUCTION_WORLD_ASSETS = {
  capitalHero: getResolvedWorldAssetEntries("capitalHero"),
  industrialHero: getResolvedWorldAssetEntries("industrialHero"),
  frontierHero: getResolvedWorldAssetEntries("frontierHero"),
} satisfies Readonly<
  Partial<Record<WorldAssetSlotId, readonly WorldAssetManifestEntry[]>>
>;
const PRODUCTION_WORLD_ASSET_IDS = Object.values(PRODUCTION_WORLD_ASSETS)
  .flat()
  .map((entry) => entry.assetId)
  .sort();
const PRODUCTION_WORLD_ASSET_SLOTS_BY_ID = new Map(
  Object.values(PRODUCTION_WORLD_ASSETS)
    .flat()
    .map((entry) => [entry.assetId, entry.slotId] as const),
);
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
  renderOrder = 0,
}: {
  readonly points: readonly THREE.Vector3[];
  readonly color: string;
  readonly opacity?: number;
  readonly width?: number;
  readonly dashed?: boolean;
  readonly renderOrder?: number;
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
    nextLine.renderOrder = renderOrder;
    if (dashed) nextLine.computeLineDistances();
    return nextLine;
  }, [color, dashed, geometry, opacity, renderOrder, width]);
  useEffect(
    () => () => {
      geometry.dispose();
      line.material.dispose();
    },
    [geometry, line],
  );
  return <primitive object={line} />;
}

function runtimePolygonGeometry(
  polygon: MapRuntimePolygon,
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      polygon.points.flatMap((point) => [point[0], point[1], point[2]]),
      3,
    ),
  );
  geometry.setIndex(polygon.triangles.flatMap((triangle) => [...triangle]));
  geometry.computeVertexNormals();
  return geometry;
}

function RuntimeSurfaceMesh({
  polygon,
  color,
  opacity = 1,
  depthWrite = false,
  renderOrder = 1,
}: {
  readonly polygon: MapRuntimePolygon;
  readonly color: string;
  readonly opacity?: number;
  readonly depthWrite?: boolean;
  readonly renderOrder?: number;
}) {
  const geometry = useMemo(() => runtimePolygonGeometry(polygon), [polygon]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} renderOrder={renderOrder}>
      <meshBasicMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        depthWrite={depthWrite}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

const CONNECTED_GEOGRAPHY_COLOR = "#718666";
const TERRAIN_SURFACE_COLORS: Readonly<
  Record<WorldSceneModel["hexes"][number]["terrain"], string>
> = {
  plains: "#718666",
  coast: "#5f8584",
  wetlands: "#6f8b73",
  forest: "#587561",
  hills: "#81775e",
  mountains: "#686d6b",
};

function terrainSurfaceOpacity(
  terrain: WorldSceneModel["hexes"][number]["terrain"] | undefined,
  lodTier: MapLodTier,
): number {
  if (terrain === "coast") return lodTier === "near" ? 0.12 : 0.06;
  if (terrain === "mountains") return lodTier === "near" ? 0.08 : 0.04;
  if (terrain === "plains" || terrain === undefined) return 0;
  return lodTier === "near" ? 0.07 : 0.035;
}

function smoothComponentBoundary(
  points: readonly WorldScenePoint[],
): readonly WorldScenePoint[] {
  let boundary = [...points];
  for (let iteration = 0; iteration < 3; iteration += 1) {
    boundary = boundary.flatMap((current, index) => {
      const next = boundary[(index + 1) % boundary.length]!;
      return [
        [
          current[0] * 0.75 + next[0] * 0.25,
          current[1] * 0.75 + next[1] * 0.25,
          current[2] * 0.75 + next[2] * 0.25,
        ],
        [
          current[0] * 0.25 + next[0] * 0.75,
          current[1] * 0.25 + next[1] * 0.75,
          current[2] * 0.25 + next[2] * 0.75,
        ],
      ] as const;
    });
  }
  return boundary;
}

function softenedComponentGeometry(
  polygon: MapRuntimePolygon,
): THREE.BufferGeometry {
  const contour = smoothComponentBoundary(polygon.points);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      contour.flatMap((point) => [point[0], point[1], point[2]]),
      3,
    ),
  );
  const triangles = THREE.ShapeUtils.triangulateShape(
    contour.map((point) => new THREE.Vector2(point[0], point[2])),
    [],
  );
  geometry.setIndex(triangles.flatMap((triangle) => [...triangle]));
  geometry.computeVertexNormals();
  return geometry;
}

function ConnectedGeographySurface({
  polygon,
  color,
  opacity,
  renderOrder,
}: {
  readonly polygon: MapRuntimePolygon;
  readonly color: string;
  readonly opacity: number;
  readonly renderOrder: number;
}) {
  const geometry = useMemo(() => softenedComponentGeometry(polygon), [polygon]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} renderOrder={renderOrder}>
      <meshBasicMaterial
        color={color}
        side={THREE.DoubleSide}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  );
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

function AssetEntry({
  entry,
  position,
  scaleMultiplier,
  rotationY,
  onAssetLoaded,
}: {
  readonly entry: WorldAssetManifestEntry;
  readonly position: WorldScenePoint;
  readonly scaleMultiplier: number;
  readonly rotationY?: number;
  readonly onAssetLoaded: (assetId: string) => void;
}) {
  return (
    <WorldAssetModel
      entry={entry}
      position={position}
      scaleMultiplier={scaleMultiplier}
      rotationY={rotationY}
      onLoaded={onAssetLoaded}
    />
  );
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

type StrategicHeroRole = "capital" | "industrial" | "frontier";

interface StrategicHeroPlan {
  readonly regionId: string;
  readonly role: StrategicHeroRole;
  readonly anchor: IntegratedRegionArtPlacement;
}

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function stablePlacementScore(
  model: WorldSceneModel,
  placement: IntegratedRegionArtPlacement,
  role: StrategicHeroRole,
): number {
  const playerCountryId = model.countries.find(
    (country) => country.isPlayer,
  )?.countryId;
  const isPlayerRegion =
    playerCountryId !== undefined &&
    model.regions.some(
      (region) =>
        region.regionId === placement.regionId &&
        region.ownerCountryId === playerCountryId,
    );
  const hasActiveConflict = model.conflicts.some((conflict) =>
    conflict.regionIds.includes(placement.regionId as RegionId),
  );
  const hasFront = model.fronts.some(
    (front) =>
      front.firstLandHexId !== undefined &&
      model.hexes.some(
        (hex) =>
          hex.id === front.firstLandHexId &&
          hex.regionId === placement.regionId,
      ),
  );
  const familyBias =
    role === "capital"
      ? placement.family === "palace"
        ? 40
        : 0
      : role === "industrial"
        ? placement.family === "factory-iron-works"
          ? 30
          : placement.family === "mine"
            ? 24
            : 0
        : placement.family === "fort"
          ? 30
          : 0;
  return (
    familyBias +
    (isPlayerRegion ? 12 : 0) +
    (hasActiveConflict ? 18 : 0) +
    (hasFront ? 14 : 0) +
    placement.matchedEvidenceIds.length * 3
  );
}

function selectStrategicHeroPlans(
  model: WorldSceneModel,
  plan: IntegratedRegionArtPlan,
): readonly StrategicHeroPlan[] {
  const selectedRegions = new Set<string>();
  const familyByRole: Readonly<
    Record<StrategicHeroRole, readonly IntegratedRegionArtPlacement[]>
  > = {
    capital: plan.placements.filter(
      (placement) =>
        placement.role === "capital" && placement.family === "palace",
    ),
    industrial: plan.placements.filter(
      (placement) =>
        placement.role === "industrial" &&
        (placement.family === "factory-iron-works" ||
          placement.family === "mine"),
    ),
    frontier: plan.placements.filter(
      (placement) =>
        placement.role === "frontier" && placement.family === "fort",
    ),
  };
  return (["capital", "industrial", "frontier"] as const).flatMap((role) => {
    const candidates = [...familyByRole[role]].sort(
      (first, second) =>
        stablePlacementScore(model, second, role) -
          stablePlacementScore(model, first, role) ||
        compareStableText(first.regionId, second.regionId) ||
        compareStableText(first.assetId, second.assetId),
    );
    const anchor =
      candidates.find(
        (candidate) => !selectedRegions.has(candidate.regionId),
      ) ?? candidates[0];
    if (anchor === undefined) return [];
    selectedRegions.add(anchor.regionId);
    return [{ regionId: anchor.regionId, role, anchor }];
  });
}

function IntegratedRegionArtLayer({
  model,
  plan,
  onAssetLoaded,
}: {
  readonly model: WorldSceneModel;
  readonly plan: IntegratedRegionArtPlan;
  readonly onAssetLoaded: (assetId: string) => void;
}) {
  const heroPlans = selectStrategicHeroPlans(model, plan);

  const renderHero = (hero: (typeof heroPlans)[number]) => {
    const entries = PRODUCTION_WORLD_ASSETS[`${hero.role}Hero`];
    const offsets: readonly WorldScenePoint[] =
      hero.role === "industrial"
        ? [
            [-0.28, 0, 0.02],
            [0.32, 0, 0.08],
          ]
        : [[0, 0, 0]];
    const scaleMultiplier =
      hero.role === "capital" ? 0.7 : hero.role === "frontier" ? 0.58 : 0.54;
    return (
      <group
        key={`kaykit-hero:${hero.regionId}:${hero.role}`}
        position={hero.anchor.worldPosition}
        userData={{
          productionAssetSlot: `${hero.role}Hero`,
          regionId: hero.regionId,
          proceduralFallback: false,
        }}
      >
        <ContactShadow
          scale={
            hero.role === "capital"
              ? 1.05
              : hero.role === "industrial"
                ? 0.82
                : 0.76
          }
        />
        {entries.map((entry, index) => (
          <AssetEntry
            key={entry.assetId}
            entry={entry}
            position={offsets[index] ?? [0, 0, 0]}
            scaleMultiplier={scaleMultiplier}
            rotationY={index === 0 ? -0.12 : 0.22}
            onAssetLoaded={onAssetLoaded}
          />
        ))}
      </group>
    );
  };

  return (
    <group
      userData={{
        mapLayer: "MapSemanticContent",
        composition: "strategic-hero-landmarks-only",
        renderer: "KayKitGLTF+StateMarkersOnly",
        heroGroupCount: heroPlans.length,
      }}
    >
      {heroPlans.map(renderHero)}
    </group>
  );
}

function projectWorldPointsToCanvas(
  camera: THREE.Camera,
  points: readonly WorldScenePoint[],
  width: number,
  height: number,
): MapScreenSpaceRect | null {
  if (points.length === 0 || width <= 0 || height <= 0) return null;
  const projected = points.map((point) =>
    new THREE.Vector3(...point).project(camera),
  );
  return {
    minX: Math.min(...projected.map((point) => ((point.x + 1) / 2) * width)),
    maxX: Math.max(...projected.map((point) => ((point.x + 1) / 2) * width)),
    minY: Math.min(...projected.map((point) => ((1 - point.y) / 2) * height)),
    maxY: Math.max(...projected.map((point) => ((1 - point.y) / 2) * height)),
  };
}

function TerrainWorldSurface({
  runtimeGeometry,
  lodTier,
}: {
  readonly runtimeGeometry: MapRuntimeGeometry;
  readonly lodTier: MapLodTier;
}) {
  return (
    <group
      userData={{
        truthClass: "DECORATIVE_SUBSTRATE",
        mapLayer: "MapGeographyDefinition",
        geometryMode: "connected-component-surfaces",
        sharedVertexCount: runtimeGeometry.terrainMesh.sharedVertexCount,
        polygonCount: runtimeGeometry.terrainMesh.polygonCount,
        connectedWorldSurfaceCount: runtimeGeometry.worldSurfaces.length,
        connectedTerrainSurfaceCount: runtimeGeometry.terrainSurfaces.length,
        boundaryTreatment: "soft-translucent-no-outline",
        terrainKinds: runtimeGeometry.terrainMesh.terrainKinds.join(","),
        terrainHeightRange: `${runtimeGeometry.terrainMesh.minHeight.toFixed(3)}:${runtimeGeometry.terrainMesh.maxHeight.toFixed(3)}`,
      }}
    >
      {runtimeGeometry.worldSurfaces.map((polygon) => (
        <ConnectedGeographySurface
          key={`world-surface:${polygon.id}`}
          polygon={polygon}
          color={CONNECTED_GEOGRAPHY_COLOR}
          opacity={0.72}
          renderOrder={0}
        />
      ))}
      {runtimeGeometry.terrainSurfaces.map((polygon) => {
        const opacity = terrainSurfaceOpacity(polygon.terrain, lodTier);
        return opacity === 0 ? null : (
          <ConnectedGeographySurface
            key={`terrain-surface:${polygon.id}`}
            polygon={polygon}
            color={
              TERRAIN_SURFACE_COLORS[polygon.terrain ?? "plains"] ??
              CONNECTED_GEOGRAPHY_COLOR
            }
            opacity={opacity}
            renderOrder={1}
          />
        );
      })}
    </group>
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
          bounds.maxX - bounds.minX + 0.6,
          bounds.maxZ - bounds.minZ + 0.6,
        ]}
      />
      <meshStandardMaterial color="#3d4a3d" roughness={1} />
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
    ...(lodTier === "near" ? architecture.geography.ridgePaths : []),
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
          opacity={path.kind === "coastline" ? 0.34 : 0.16}
          width={path.kind === "coastline" ? 1.1 : 0.8}
        />
      ))}
    </group>
  );
}

function IdeologySurfaceLayer({
  architecture,
  runtimeGeometry,
  lodTier,
}: {
  readonly architecture: MapArchitecture;
  readonly runtimeGeometry: MapRuntimeGeometry;
  readonly lodTier: MapLodTier;
}) {
  if (lodTier !== "near") return null;
  const showDirectionalTreatment = lodTier === "near";
  const regionPolygons = (regionId: string) =>
    runtimeGeometry.regionSurfaces.filter(
      (polygon) => polygon.semanticKey === `region:${regionId}`,
    );
  const factionPolygons = (factionId: string) =>
    runtimeGeometry.factionSurfaces.filter(
      (polygon) => polygon.semanticKey === `faction:${factionId}`,
    );
  const factionOpacity = new Map(
    architecture.political.factionTerritories.map((territory) => [
      territory.factionId,
      Math.min(
        0.22,
        0.11 +
          Math.max(
            ...architecture.activity.factionPresence
              .filter((presence) => presence.factionId === territory.factionId)
              .map((presence) => presence.organization * 0.1),
            0,
          ),
      ),
    ]),
  );
  return (
    <group
      userData={{
        mapLayer: "MapPoliticalProjection",
        truthClass: "AUTHORITATIVE_PROJECTION",
      }}
    >
      {architecture.political.ideologySurfaces.flatMap((surface) =>
        regionPolygons(surface.regionId).map((polygon) => (
          <group key={`${surface.id}:${polygon.id}`}>
            <RuntimeSurfaceMesh
              polygon={polygon}
              color={
                IDEOLOGY_SURFACE_COLORS[
                  ideologySurfacePaletteIndex(surface.ideologyId)
                ]
              }
              opacity={
                DEFAULT_MAP_STYLE.ideologySurfaceOpacity *
                (0.24 + surface.support * 0.18)
              }
              renderOrder={2}
            />
            {showDirectionalTreatment ? (
              <SurfaceDirectionalTreatment
                polygon={polygon}
                color={
                  IDEOLOGY_SURFACE_COLORS[
                    ideologySurfacePaletteIndex(surface.ideologyId)
                  ]
                }
                opacity={
                  0.04 + surface.radicalism * 0.08 + surface.organization * 0.05
                }
                patternIndex={ideologySurfacePaletteIndex(surface.ideologyId)}
              />
            ) : null}
          </group>
        )),
      )}
      {architecture.political.factionTerritories.flatMap((territory) =>
        factionPolygons(territory.factionId).map((polygon) => (
          <RuntimeSurfaceMesh
            key={`faction-surface:${territory.factionId}:${polygon.id}`}
            polygon={polygon}
            color={CONTROLLER_COLORS.faction}
            opacity={factionOpacity.get(territory.factionId) ?? 0.1}
            renderOrder={6}
          />
        )),
      )}
    </group>
  );
}

function SurfaceDirectionalTreatment({
  polygon,
  color,
  opacity,
  patternIndex,
}: {
  readonly polygon: MapRuntimePolygon;
  readonly color: string;
  readonly opacity: number;
  readonly patternIndex: number;
}) {
  const { minX, maxX, minZ, maxZ } = polygon.bounds;
  const width = maxX - minX;
  const depth = maxZ - minZ;
  const y = Math.max(...polygon.points.map((point) => point[1])) + 0.018;
  const lines = [0.28, 0.52, 0.76].slice(0, 1 + (patternIndex % 2));
  return (
    <group userData={{ politicalTreatment: "directional-surface" }}>
      {lines.map((fraction) => {
        const offset = (fraction - 0.5) * depth;
        const points =
          patternIndex % 2 === 0
            ? [
                new THREE.Vector3(
                  minX + width * 0.14,
                  y,
                  minZ + depth * 0.18 + offset,
                ),
                new THREE.Vector3(
                  maxX - width * 0.14,
                  y,
                  minZ + depth * 0.82 + offset,
                ),
              ]
            : [
                new THREE.Vector3(
                  minX + width * 0.18 + offset,
                  y,
                  minZ + depth * 0.16,
                ),
                new THREE.Vector3(
                  minX + width * 0.82 + offset,
                  y,
                  maxZ - depth * 0.16,
                ),
              ];
        return (
          <SceneLine
            key={`${polygon.id}:direction:${fraction}`}
            points={points}
            color={color}
            opacity={Math.min(0.38, opacity)}
            width={1.2}
            renderOrder={4}
          />
        );
      })}
    </group>
  );
}

function BoundaryLayer({
  architecture,
  lodTier,
}: {
  readonly architecture: MapArchitecture;
  readonly lodTier: MapLodTier;
}) {
  const visibleOwnerSegments =
    architecture.political.legalOwnerBoundarySegments;
  const visibleControllerSegments =
    lodTier === "far"
      ? []
      : architecture.political.physicalControllerBoundarySegments;
  const visibleFrontSegments =
    lodTier === "far" ? [] : architecture.political.frontBoundarySegments;
  const renderSegments = (
    segments: readonly MapArchitecture["political"]["physicalControllerBoundarySegments"][number][],
    color: string,
    width: number,
    opacity: number,
    renderOrder: number,
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
        renderOrder={renderOrder}
      />
    ));
  return (
    <group
      userData={{
        mapLayer: "MapPoliticalProjection",
        ownerBoundaryCount: visibleOwnerSegments.length,
        controllerBoundaryCount: visibleControllerSegments.length,
        frontBoundaryCount: visibleFrontSegments.length,
      }}
    >
      {renderSegments(
        visibleOwnerSegments,
        DEFAULT_MAP_STYLE.ownerBoundaryColor,
        DEFAULT_MAP_STYLE.ownerBoundaryWidth,
        0.18,
        8,
      )}
      {renderSegments(
        visibleControllerSegments,
        DEFAULT_MAP_STYLE.controllerBoundaryColor,
        DEFAULT_MAP_STYLE.controllerBoundaryWidth,
        0.58,
        10,
      )}
      {renderSegments(
        visibleFrontSegments,
        DEFAULT_MAP_STYLE.frontBoundaryColor,
        Math.max(DEFAULT_MAP_STYLE.frontBoundaryWidth, 3.2),
        1,
        12,
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

function ProceduralFactionBanner({
  position,
}: {
  readonly position: WorldScenePoint;
}) {
  return (
    <ProceduralWorldArtKitRenderer
      family="faction-banner"
      position={position}
      lod="micro"
    />
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
        scale={conflict.visualKind === "rebellion-camp" ? 0.92 : 0.84}
      />
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[0.32, 0.35, 18]} />
        <meshBasicMaterial
          color="#f0524d"
          transparent
          opacity={0.16}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function WorldScene({
  model,
  architecture,
  runtimeGeometry,
  visualSystem,
  integratedArtPlan,
  lodTier,
  cameraState,
  cameraBounds,
  factionPresenceAnchors,
  highlightedRegionIds,
  selectedHexId,
  onAssetLoaded,
  onSelectRegion,
  onSelectHex,
  onProjectedWorldBounds,
}: {
  readonly model: WorldSceneModel;
  readonly architecture: MapArchitecture;
  readonly runtimeGeometry: MapRuntimeGeometry;
  readonly visualSystem: MapVisualSystem;
  readonly integratedArtPlan: IntegratedRegionArtPlan;
  readonly lodTier: MapLodTier;
  readonly cameraState: CameraState;
  readonly cameraBounds: MapArchitecture["contentBounds"];
  readonly factionPresenceAnchors: readonly WorldSceneModel["factionPresence"][number][];
  readonly highlightedRegionIds: ReadonlySet<string>;
  readonly selectedHexId: string | null;
  readonly onAssetLoaded: (assetId: string) => void;
  readonly onSelectRegion: (regionId: RegionId) => void;
  readonly onSelectHex: (landHexId: string) => void;
  readonly onProjectedWorldBounds: (bounds: MapScreenSpaceRect) => void;
}) {
  const { camera, size } = useThree();
  const isMobileTheater = size.width <= 760;
  const widthFitZoom =
    size.width / Math.max(cameraBounds.maxX - cameraBounds.minX + 1.2, 1);
  const heightFitZoom =
    size.height / Math.max(cameraBounds.maxZ - cameraBounds.minZ + 1.2, 1);
  // Mobile is a player-theatre view, not a global fit. Bias the fit toward
  // the vertical stage so the core and immediate border context occupy the
  // first viewport; the dedicated full-world action remains the escape hatch.
  const fitZoom = isMobileTheater
    ? heightFitZoom * 0.76
    : Math.min(widthFitZoom, heightFitZoom);
  useEffect(() => {
    // A restrained 2.5D tilt keeps the actual terrain mass in the stage,
    // especially on the narrow mobile theater, without switching renderers.
    camera.position.set(cameraState.x, 17, cameraState.z + 11);
    camera.lookAt(cameraState.x, 0, cameraState.z);
    camera.zoom = Math.max(12, fitZoom * cameraState.zoom);
    camera.updateProjectionMatrix();
  }, [camera, cameraState, fitZoom]);
  useEffect(() => {
    camera.updateMatrixWorld();
    const projected = projectWorldPointsToCanvas(
      camera,
      runtimeGeometry.terrainMesh.vertices,
      size.width,
      size.height,
    );
    if (projected !== null) onProjectedWorldBounds(projected);
  }, [
    camera,
    onProjectedWorldBounds,
    runtimeGeometry.terrainMesh.vertices,
    size.height,
    size.width,
  ]);

  const showMinorObjects = lodTier === "near";
  const showRouteDetails = lodTier === "near";
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
        <TerrainWorldSurface
          runtimeGeometry={runtimeGeometry}
          lodTier={lodTier}
        />
        <IntegratedRegionArtLayer
          model={model}
          plan={integratedArtPlan}
          onAssetLoaded={onAssetLoaded}
        />
        <MapPathLayer architecture={architecture} lodTier={lodTier} />
        <IdeologySurfaceLayer
          architecture={architecture}
          runtimeGeometry={runtimeGeometry}
          lodTier={lodTier}
        />
        <BoundaryLayer architecture={architecture} lodTier={lodTier} />
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
              {showRouteDetails ? (
                <RouteChannelGlyph
                  start={route.start}
                  end={route.end}
                  visualKind={route.visualKind}
                />
              ) : null}
              {showRouteDetails && route.active ? (
                <RoutePulse
                  start={route.start}
                  end={route.end}
                  visualKind={route.visualKind}
                />
              ) : null}
            </group>
          ))}
        {showMinorObjects && factionPresenceAnchors.length > 0
          ? factionPresenceAnchors.map((presence) => (
              <ProceduralFactionBanner
                key={presence.id}
                position={presence.position}
              />
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
  const runtimeGeometry = useMemo(
    () => deriveMapRuntimeGeometry(model),
    [model],
  );
  const integratedArtPlan = useMemo(
    () => deriveIntegratedRegionArtPlan(model, architecture),
    [architecture, model],
  );
  const factionPresenceAnchors = useMemo(
    () => deriveFactionPresenceAnchors(model),
    [model],
  );
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
  const [loadedProductionAssetIds, setLoadedProductionAssetIds] = useState<
    readonly string[]
  >([]);
  const markProductionAssetLoaded = useCallback((assetId: string) => {
    setLoadedProductionAssetIds((current) => {
      if (current.includes(assetId)) return current;
      return [...current, assetId].sort();
    });
  }, []);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [screenSpaceOccupancy, setScreenSpaceOccupancy] =
    useState<MapScreenSpaceOccupancy | null>(null);
  const onProjectedWorldBounds = useCallback(
    (projectedBounds: MapScreenSpaceRect) => {
      if (typeof window === "undefined") return;
      const viewportElement = viewportRef.current;
      const canvas = viewportElement?.querySelector("canvas");
      if (
        viewportElement === null ||
        viewportElement === undefined ||
        canvas === null ||
        canvas === undefined
      )
        return;
      const canvasRect = canvas.getBoundingClientRect();
      const stageElement = viewportElement.closest(".world-stage");
      const stageRect =
        stageElement?.getBoundingClientRect() ??
        viewportElement.getBoundingClientRect();
      const canvasBounds: MapScreenSpaceRect = {
        minX: canvasRect.left,
        maxX: canvasRect.right,
        minY: canvasRect.top,
        maxY: canvasRect.bottom,
      };
      const projectedWorldBounds: MapScreenSpaceRect = {
        minX: canvasRect.left + projectedBounds.minX,
        maxX: canvasRect.left + projectedBounds.maxX,
        minY: canvasRect.top + projectedBounds.minY,
        maxY: canvasRect.top + projectedBounds.maxY,
      };
      const measured = inspectMapScreenSpaceOccupancy({
        viewport: { width: window.innerWidth, height: window.innerHeight },
        stageBounds: {
          minX: stageRect.left,
          maxX: stageRect.right,
          minY: stageRect.top,
          maxY: stageRect.bottom,
        },
        canvasBounds,
        projectedWorldBounds,
      });
      setScreenSpaceOccupancy((current) => {
        if (
          current?.stage.width === measured.stage.width &&
          current.stage.height === measured.stage.height &&
          current.projectedWorld.width === measured.projectedWorld.width &&
          current.projectedWorld.height === measured.projectedWorld.height &&
          current.firstMobileViewportWorldShare ===
            measured.firstMobileViewportWorldShare
        )
          return current;
        return measured;
      });
    },
    [],
  );
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
  const cameraBounds = useMemo(
    () => deriveMapViewportBounds(model, activeFocusPreset),
    [activeFocusPreset, model],
  );
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
  const isMobileViewport =
    typeof window !== "undefined" && window.innerWidth <= 760;
  const lodTier = deriveMapLodTier(camera.zoom);
  const labelsHidden =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("mapLabels") === "0";
  const visualSystem = useMemo(
    () => deriveMapVisualSystem(model, architecture, lodTier),
    [architecture, lodTier, model],
  );
  const visibleIntegratedLandmarkCount = useMemo(
    () => selectStrategicHeroPlans(model, integratedArtPlan).length,
    [integratedArtPlan, model],
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
          ref={viewportRef}
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
          data-map-production-assets="kaykit-gltf"
          data-map-production-asset-expected-count={
            PRODUCTION_WORLD_ASSET_IDS.length
          }
          data-map-production-asset-loaded-count={
            loadedProductionAssetIds.length
          }
          data-map-production-asset-ids={loadedProductionAssetIds.join(",")}
          data-map-production-asset-slot-ids={[
            ...new Set(
              loadedProductionAssetIds.flatMap((assetId) => {
                const slotId = PRODUCTION_WORLD_ASSET_SLOTS_BY_ID.get(assetId);
                return slotId === undefined ? [] : [slotId];
              }),
            ),
          ]
            .sort()
            .join(",")}
          data-map-port-hero="unresolved-label-and-coast-facts-only"
          data-map-procedural-kit-registry-count={
            PROCEDURAL_WORLD_ART_KIT_COUNT
          }
          data-map-integrated-kit-placement-count={
            integratedArtPlan.placements.length
          }
          data-map-integrated-visible-landmark-count={
            visibleIntegratedLandmarkCount
          }
          data-map-strategic-hero-group-count={visibleIntegratedLandmarkCount}
          data-map-rendered-integrated-placement-count={
            visibleIntegratedLandmarkCount
          }
          data-map-medium-environment-prop-count="0"
          data-map-procedural-landmark-count="0"
          data-map-procedural-fallback-visible="false"
          data-map-integrated-kit-family-count={
            new Set(
              integratedArtPlan.placements.map((placement) => placement.family),
            ).size
          }
          data-map-composed-region-count={
            integratedArtPlan.composedRegionIds.length
          }
          data-map-omitted-region-count={
            integratedArtPlan.omittedRegionIds.length
          }
          data-map-icon-system="tmr-semantic-registry"
          data-land-hex-count={model.hexes.length}
          data-map-runtime-geometry="connected-component-surfaces"
          data-map-connected-world-surface-count={
            runtimeGeometry.worldSurfaces.length
          }
          data-map-connected-terrain-surface-count={
            runtimeGeometry.terrainSurfaces.length
          }
          data-map-default-terrain-detail="hidden"
          data-map-directional-treatment={
            lodTier === "near" ? "visible" : "hidden"
          }
          data-map-runtime-polygon-count={
            runtimeGeometry.terrainMesh.polygonCount
          }
          data-map-terrain-surface-count={
            runtimeGeometry.terrainSurfaces.length
          }
          data-map-runtime-shared-vertices={
            runtimeGeometry.terrainMesh.sharedVertexCount
          }
          data-map-ideology-surface-count={
            architecture.political.ideologySurfaces.length
          }
          data-map-faction-surface-count={
            runtimeGeometry.factionSurfaces.length
          }
          data-map-faction-banner-anchor-count={factionPresenceAnchors.length}
          data-map-front-count={
            architecture.political.frontBoundarySegments.length
          }
          data-map-camera-bounds={`${cameraBounds.minX.toFixed(2)},${cameraBounds.maxX.toFixed(
            2,
          )},${cameraBounds.minZ.toFixed(2)},${cameraBounds.maxZ.toFixed(2)}`}
          data-world-render-bounds={`${runtimeGeometry.renderBounds.minX.toFixed(
            2,
          )},${runtimeGeometry.renderBounds.maxX.toFixed(
            2,
          )},${runtimeGeometry.renderBounds.minZ.toFixed(
            2,
          )},${runtimeGeometry.renderBounds.maxZ.toFixed(2)}`}
          data-map-occupancy-source={
            screenSpaceOccupancy === null
              ? "screen-space-pending"
              : "screen-space-projection"
          }
          data-map-stage-occupancy-width={
            screenSpaceOccupancy?.stage.width.toFixed(3) ?? "NOT_MEASURED"
          }
          data-map-stage-occupancy-height={
            screenSpaceOccupancy?.stage.height.toFixed(3) ?? "NOT_MEASURED"
          }
          data-map-projected-world-occupancy-width={
            screenSpaceOccupancy?.projectedWorld.width.toFixed(3) ??
            "NOT_MEASURED"
          }
          data-map-projected-world-occupancy-height={
            screenSpaceOccupancy?.projectedWorld.height.toFixed(3) ??
            "NOT_MEASURED"
          }
          data-first-mobile-viewport-world-share={
            screenSpaceOccupancy === null
              ? "NOT_MEASURED"
              : isMobileViewport
                ? screenSpaceOccupancy.firstMobileViewportWorldShare.toFixed(3)
                : "NOT_MOBILE_VIEWPORT"
          }
          data-world-content-occupancy-width={
            screenSpaceOccupancy?.projectedWorld.width.toFixed(3) ??
            "NOT_MEASURED"
          }
          data-world-content-occupancy-height={
            screenSpaceOccupancy?.projectedWorld.height.toFixed(3) ??
            "NOT_MEASURED"
          }
          data-mobile-content-occupancy-width={
            screenSpaceOccupancy?.projectedWorld.width.toFixed(3) ??
            "NOT_MEASURED"
          }
          data-mobile-content-occupancy-height={
            screenSpaceOccupancy?.projectedWorld.height.toFixed(3) ??
            "NOT_MEASURED"
          }
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
              runtimeGeometry={runtimeGeometry}
              visualSystem={renderedVisualSystem}
              integratedArtPlan={integratedArtPlan}
              lodTier={lodTier}
              cameraState={camera}
              cameraBounds={cameraBounds}
              factionPresenceAnchors={factionPresenceAnchors}
              highlightedRegionIds={highlightedRegionIds}
              selectedHexId={selectedHexId}
              onAssetLoaded={markProductionAssetLoaded}
              onSelectRegion={onSelectRegion}
              onSelectHex={setSelectedHexId}
              onProjectedWorldBounds={onProjectedWorldBounds}
            />
          </Canvas>
          <div className="world-scene-hud" aria-hidden="true">
            <span>2.5D 정치 지도</span>
            <span>{model.tick}일차 · 실제 상태 투영</span>
          </div>
          <div className="world-scene-object-key" aria-label="지도 객체 안내">
            <span>
              <TmrIcon
                iconId={TMR_ICON_IDS.map.capital}
                size={16}
                decorative
                tone="accent"
              />{" "}
              수도
            </span>
            <span>
              <TmrIcon
                iconId={TMR_ICON_IDS.map.factory}
                size={16}
                decorative
                tone="accent"
              />{" "}
              국가 사업
            </span>
            <span>
              <TmrIcon
                iconId={TMR_ICON_IDS.map.tradeRoute}
                size={16}
                decorative
                tone="accent"
              />{" "}
              접촉 경로
            </span>
            <span>
              <TmrIcon
                iconId={TMR_ICON_IDS.crisis.civilConflict}
                size={16}
                decorative
                tone="crisis"
              />{" "}
              활성 충돌
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
              <TmrIcon
                iconId={TMR_ICON_IDS.map.city}
                size={16}
                decorative
                tone="neutral"
              />
              {country.name}
            </span>
          ))}
          <span>
            <TmrIcon
              iconId={TMR_ICON_IDS.map.tradeRoute}
              size={16}
              decorative
              tone="accent"
            />{" "}
            실제 경로
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
