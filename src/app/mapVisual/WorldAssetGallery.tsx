import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo } from "react";
import { Mesh } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { MAP_MATERIAL_FAMILIES } from "../../presentation/mapVisual";
import type { WorldAssetManifestEntry } from "../../presentation/modelAssets/worldAssetManifest";
import {
  WORLD_ASSET_ENTRIES,
  type WorldAssetSlotId,
} from "../../presentation/modelAssets/worldAssetManifest";
import {
  createWorldAssetGallerySnapshot,
  type WorldAssetGalleryPanel,
} from "./worldAssetGalleryModel";
import "./worldAssetGallery.css";

function LoadedAssetMarker({ assetId }: { readonly assetId: string }) {
  useEffect(() => {
    const gallery = document.querySelector<HTMLElement>(
      "[data-world-asset-gallery]",
    );
    if (gallery === null) return;
    const loaded = new Set(
      (gallery.dataset.loadedAssets ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    );
    loaded.add(assetId);
    gallery.dataset.loadedAssets = [...loaded].sort().join(",");
  }, [assetId]);
  return null;
}

function WorldAssetModel({
  entry,
  position,
}: {
  readonly entry: WorldAssetManifestEntry;
  readonly position: readonly [x: number, y: number, z: number];
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

  return (
    <group
      name={`world-asset-${entry.assetId}`}
      position={position}
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
        scale={[scale, scale, scale]}
      >
        <primitive object={scene} />
      </group>
      <LoadedAssetMarker assetId={entry.assetId} />
    </group>
  );
}

function GalleryPanel({ panel }: { readonly panel: WorldAssetGalleryPanel }) {
  const material =
    panel.status === "unresolved"
      ? MAP_MATERIAL_FAMILIES["terrain-water"]
      : MAP_MATERIAL_FAMILIES["terrain-earth"];
  const entryPositions: readonly (readonly [
    x: number,
    y: number,
    z: number,
  ])[] =
    panel.assets.length > 1
      ? [
          [-0.72, 0, 0],
          [0.72, 0, 0],
        ]
      : [[0, 0, 0]];

  return (
    <group position={panel.position}>
      <mesh position={[0, -0.08, 0]} receiveShadow>
        <boxGeometry args={[3.8, 0.16, 2.9]} />
        <meshStandardMaterial
          color={material.baseColor}
          roughness={material.roughness}
          metalness={material.metalness}
        />
      </mesh>
      {panel.assets.map((entry, index) => (
        <WorldAssetModel
          key={entry.assetId}
          entry={entry}
          position={entryPositions[index] ?? [0, 0, 0]}
        />
      ))}
    </group>
  );
}

function GalleryCamera() {
  const { camera } = useThree();
  useLayoutEffect(() => {
    camera.position.set(0, 18, 18);
    camera.lookAt(0, 0, -7);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

function GalleryScene({
  panels,
}: {
  readonly panels: readonly WorldAssetGalleryPanel[];
}) {
  return (
    <>
      <GalleryCamera />
      <ambientLight intensity={1.8} />
      <directionalLight
        castShadow
        color="#fff4dc"
        intensity={3.2}
        position={[5, 12, 8]}
      />
      <directionalLight
        color="#9db5b2"
        intensity={1.1}
        position={[-7, 6, -12]}
      />
      {panels.map((panel) => (
        <GalleryPanel key={panel.slotId} panel={panel} />
      ))}
    </>
  );
}

function PanelLabel({ panel }: { readonly panel: WorldAssetGalleryPanel }) {
  return (
    <div
      className="world-asset-gallery__label"
      data-slot-id={panel.slotId}
      data-slot-status={panel.status}
    >
      <strong>{panel.label}</strong>
      <span>{panel.status === "resolved" ? "KayKit asset" : "unresolved"}</span>
    </div>
  );
}

/**
 * Standalone R3F load proof for the curated licensed model set. This is not a
 * production map renderer and does not create gameplay placements.
 */
export function WorldAssetGallery() {
  const panels = createWorldAssetGallerySnapshot();
  return (
    <main
      aria-label="Too Many Revolutions licensed world asset gallery"
      className="world-asset-gallery"
      data-expected-assets={WORLD_ASSET_ENTRIES.length}
      data-loaded-assets=""
      data-preview-only="true"
      data-world-asset-gallery="true"
    >
      <Canvas
        camera={{
          far: 100,
          near: 0.1,
          position: [0, 18, 18],
          zoom: 36,
        }}
        className="world-asset-gallery__canvas"
        shadows
        orthographic
      >
        <GalleryScene panels={panels} />
      </Canvas>
      <header className="world-asset-gallery__header">
        <p className="world-asset-gallery__eyebrow">
          TMR / licensed demo assets
        </p>
        <h1>KayKit world asset slots</h1>
        <p>
          Curated GLTF load proof · {WORLD_ASSET_ENTRIES.length} model files ·
          procedural map art is not rendered here
        </p>
      </header>
      <div className="world-asset-gallery__labels">
        {panels.map((panel) => (
          <PanelLabel key={panel.slotId} panel={panel} />
        ))}
      </div>
    </main>
  );
}

export type { WorldAssetSlotId };
