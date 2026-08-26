import type { ReactNode } from "react";
import { Fragment } from "react";

import {
  MAP_MATERIAL_FAMILIES,
  type MapMaterialFamilyId,
  type MapObjectFamily,
} from "./worldArt";
import {
  getProceduralWorldArtKit,
  type ProceduralWorldArtKit,
  type ProceduralWorldArtPrimitive,
} from "./proceduralKitGeometry";
import type { CompositionVisibility } from "../mapContent/regionComposition";
import type { ResolvedRegionCompositionPlacement } from "../mapContent/regionCompositionAdapter";
import type { WorldScenePoint } from "../worldSceneModel";

export type ProceduralWorldArtKitPosition = WorldScenePoint;

export interface ProceduralWorldArtKitRenderBaseInput {
  /** The integrator-provided world position; Y is never derived here. */
  readonly position: ProceduralWorldArtKitPosition;
  readonly lod?: CompositionVisibility;
  readonly visible?: boolean;
  /** Multiplier applied after MAP_SCALE_HIERARCHY.relativeScale. */
  readonly scale?: number;
}

export type ProceduralWorldArtKitRenderInput =
  | (ProceduralWorldArtKitRenderBaseInput & {
      readonly family: MapObjectFamily;
      readonly resolvedPlacement?: never;
    })
  | (ProceduralWorldArtKitRenderBaseInput & {
      readonly family?: never;
      readonly resolvedPlacement: ResolvedRegionCompositionPlacement;
    });

export interface ProceduralPrimitiveRenderDescriptor {
  readonly kind: ProceduralWorldArtPrimitive["kind"];
  /** Unit geometry args; meshScale carries width/height/depth. */
  readonly geometryArgs: readonly number[];
  readonly meshScale: readonly [width: number, height: number, depth: number];
}

export interface ProceduralWorldArtKitGroundingDescriptor {
  readonly contactShadow: ProceduralWorldArtKit["grounding"]["contactShadow"];
  readonly contactShadowEnabled: boolean;
  readonly contactShadowOpacity: number;
  readonly contactShadowScale: readonly [x: number, y: number, z: number];
  readonly terrainBlend: ProceduralWorldArtKit["grounding"]["terrainBlend"];
  readonly acceptsTerrainHeight: boolean;
  readonly terrainHeight: number | null;
  readonly terrainHeightSource: "integrator-position" | "not-consumed";
}

export interface ProceduralWorldArtKitRenderDescriptor {
  readonly family: MapObjectFamily;
  readonly assetId: ProceduralWorldArtKit["assetId"];
  readonly kitId: ProceduralWorldArtKit["kitId"];
  readonly visible: boolean;
  readonly visibleAt: readonly ("macro" | "meso" | "micro")[];
  readonly position: ProceduralWorldArtKitPosition;
  readonly scale: number;
  readonly materialFamily: MapMaterialFamilyId;
  readonly primitives: readonly ProceduralWorldArtPrimitive[];
  readonly grounding: ProceduralWorldArtKitGroundingDescriptor;
}

const CONTACT_SHADOW_SCALE: Readonly<
  Record<
    ProceduralWorldArtKit["grounding"]["terrainBlend"],
    readonly [x: number, y: number, z: number]
  >
> = {
  flush: [1, 0.01, 1],
  raised: [1.12, 0.01, 1.12],
  coastal: [1.28, 0.01, 0.78],
};

export function createProceduralPrimitiveRenderDescriptor(
  primitive: ProceduralWorldArtPrimitive,
): ProceduralPrimitiveRenderDescriptor {
  switch (primitive.kind) {
    case "box":
      return {
        kind: "box",
        geometryArgs: [1, 1, 1],
        meshScale: primitive.size,
      };
    case "cylinder":
      return {
        kind: "cylinder",
        geometryArgs: [0.5, 0.5, 1, primitive.sides ?? 8],
        meshScale: primitive.size,
      };
    case "cone":
      return {
        kind: "cone",
        geometryArgs: [0.5, 1, primitive.sides ?? 6],
        meshScale: primitive.size,
      };
  }
}

function familyFromInput(
  input: ProceduralWorldArtKitRenderInput,
): MapObjectFamily {
  const family = input.resolvedPlacement?.family ?? input.family;
  if (family === undefined) {
    throw new Error("A world-art family or resolved placement is required.");
  }
  return family;
}

export function createProceduralWorldArtKitRenderDescriptor(
  input: ProceduralWorldArtKitRenderInput,
): ProceduralWorldArtKitRenderDescriptor {
  const family = familyFromInput(input);
  const kit = getProceduralWorldArtKit(family);
  if (kit === undefined) {
    throw new Error(`Missing procedural world-art kit for ${family}.`);
  }
  const scaleMultiplier = input.scale ?? 1;
  if (!Number.isFinite(scaleMultiplier) || scaleMultiplier <= 0) {
    throw new Error("Procedural world-art render scale must be positive.");
  }
  const placementVisibleAt = input.resolvedPlacement?.visibleAt;
  const lodVisible =
    input.lod === undefined ||
    (kit.visibleAt.includes(input.lod) &&
      (placementVisibleAt === undefined ||
        placementVisibleAt.includes(input.lod)));
  const acceptsTerrainHeight = kit.grounding.acceptsTerrainHeight;
  const terrainHeight = acceptsTerrainHeight ? input.position[1] : null;
  return {
    family,
    assetId: kit.assetId,
    kitId: kit.kitId,
    visible: input.visible !== false && lodVisible,
    visibleAt: kit.visibleAt,
    position: [
      input.position[0],
      acceptsTerrainHeight ? input.position[1] : 0,
      input.position[2],
    ],
    scale: kit.relativeScale * scaleMultiplier,
    materialFamily: kit.materialFamily,
    primitives: kit.primitives,
    grounding: {
      contactShadow: kit.grounding.contactShadow,
      contactShadowEnabled: kit.grounding.contactShadow !== "none",
      contactShadowOpacity:
        MAP_MATERIAL_FAMILIES[kit.materialFamily].contactShadowOpacity,
      contactShadowScale: CONTACT_SHADOW_SCALE[kit.grounding.terrainBlend],
      terrainBlend: kit.grounding.terrainBlend,
      acceptsTerrainHeight,
      terrainHeight,
      terrainHeightSource: acceptsTerrainHeight
        ? "integrator-position"
        : "not-consumed",
    },
  };
}

function PrimitiveMesh({
  primitive,
}: {
  readonly primitive: ProceduralWorldArtPrimitive;
}) {
  const material = MAP_MATERIAL_FAMILIES[primitive.materialFamily];
  const descriptor = createProceduralPrimitiveRenderDescriptor(primitive);
  const materialProps = {
    color: material.baseColor,
    roughness: material.roughness,
    metalness: material.metalness,
  };
  const mesh = (geometry: ReactNode) => (
    <mesh
      position={primitive.position}
      rotation={primitive.rotation}
      scale={descriptor.meshScale}
      castShadow
      receiveShadow
    >
      {geometry}
      <meshStandardMaterial {...materialProps} />
    </mesh>
  );
  switch (descriptor.kind) {
    case "box":
      return mesh(
        <boxGeometry
          args={descriptor.geometryArgs as [number, number, number]}
        />,
      );
    case "cylinder":
      return mesh(
        <cylinderGeometry
          args={descriptor.geometryArgs as [number, number, number, number]}
        />,
      );
    case "cone":
      return mesh(
        <coneGeometry
          args={descriptor.geometryArgs as [number, number, number]}
        />,
      );
  }
}

function GroundContact({
  descriptor,
}: {
  readonly descriptor: ProceduralWorldArtKitRenderDescriptor;
}) {
  if (!descriptor.grounding.contactShadowEnabled) return null;
  const material = MAP_MATERIAL_FAMILIES[descriptor.materialFamily];
  return (
    <mesh
      position={[0, 0.004, 0]}
      scale={descriptor.grounding.contactShadowScale}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <circleGeometry args={[0.5, 16]} />
      <meshBasicMaterial
        color={material.shadowColor}
        transparent
        opacity={descriptor.grounding.contactShadowOpacity}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * Reusable renderer for integration owners. The supplied Y coordinate is
 * consumed as-is when the Kit accepts terrain height; this component never
 * samples terrain or invents a height.
 */
export function ProceduralWorldArtKitRenderer(
  input: ProceduralWorldArtKitRenderInput,
) {
  const descriptor = createProceduralWorldArtKitRenderDescriptor(input);
  if (!descriptor.visible) return null;
  return (
    <group
      position={descriptor.position}
      scale={[descriptor.scale, descriptor.scale, descriptor.scale]}
      userData={{
        assetId: descriptor.assetId,
        kitId: descriptor.kitId,
        terrainBlend: descriptor.grounding.terrainBlend,
      }}
    >
      <GroundContact descriptor={descriptor} />
      {descriptor.primitives.map((primitive) => (
        <Fragment key={primitive.id}>
          <PrimitiveMesh primitive={primitive} />
        </Fragment>
      ))}
    </group>
  );
}
