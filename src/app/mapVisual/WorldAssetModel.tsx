import { useLoader } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Mesh } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import type { WorldAssetManifestEntry } from "../../presentation/modelAssets/worldAssetManifest";

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
      }
    });
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
