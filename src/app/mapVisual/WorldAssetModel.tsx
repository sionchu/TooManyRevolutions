import { useLoader } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Box3, Color, Mesh } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import type { WorldAssetManifestEntry } from "../../presentation/modelAssets/worldAssetManifest";
import type { Material } from "three";

const TERRAIN_WARMTH = new Color("#b59a6b");

function adaptWorldMaterial(material: Material): Material {
  const adapted = material.clone();
  const surface = adapted as Material & {
    color?: Color;
    roughness?: number;
    metalness?: number;
  };
  if (surface.color !== undefined) {
    surface.color = surface.color.clone().lerp(TERRAIN_WARMTH, 0.16);
  }
  if (surface.roughness !== undefined) surface.roughness = 0.86;
  if (surface.metalness !== undefined) surface.metalness = 0;
  return adapted;
}

export function WorldAssetModel({
  entry,
  position,
  scaleMultiplier = 1,
  rotationY = 0,
  onLoaded,
}: {
  readonly entry: WorldAssetManifestEntry;
  readonly position: readonly [x: number, y: number, z: number];
  readonly scaleMultiplier?: number;
  readonly rotationY?: number;
  readonly onLoaded?: (assetId: string) => void;
}) {
  const gltf = useLoader(GLTFLoader, entry.publicUrl);
  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((node) => {
      if (node instanceof Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        node.material = Array.isArray(node.material)
          ? node.material.map(adaptWorldMaterial)
          : adaptWorldMaterial(node.material);
      }
    });
    // Asset files use different authoring origins. Re-ground the cloned
    // composition at local y=0 before the manifest translation and shared map
    // height are applied, so a hero never floats over its authored hex.
    clone.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(clone);
    if (Number.isFinite(bounds.min.y)) clone.position.y -= bounds.min.y;
    return clone;
  }, [gltf.scene]);
  const { scale, rotation, translation } = entry.normalization;

  useEffect(() => {
    onLoaded?.(entry.assetId);
  }, [entry.assetId, onLoaded]);

  return (
    <group
      name={`world-asset-${entry.assetId}`}
      position={position}
      rotation={[0, rotationY, 0]}
      userData={{
        assetId: entry.assetId,
        slotId: entry.slotId,
        sourcePack: entry.sourcePack,
        sourceFilename: entry.sourceFilename,
      }}
    >
      <group
        position={translation}
        rotation={rotation}
        scale={[
          scale * scaleMultiplier,
          scale * scaleMultiplier,
          scale * scaleMultiplier,
        ]}
      >
        <primitive object={scene} />
      </group>
    </group>
  );
}
