import { Canvas, useThree } from "@react-three/fiber";
import { useCallback, useLayoutEffect } from "react";

import { MAP_MATERIAL_FAMILIES } from "../../presentation/mapVisual";
import {
  WORLD_ASSET_ENTRIES,
  type WorldAssetSlotId,
} from "../../presentation/modelAssets/worldAssetManifest";
import {
  createWorldAssetGallerySnapshot,
  type WorldAssetGalleryPanel,
} from "./worldAssetGalleryModel";
import { WorldAssetModel } from "./WorldAssetModel";
import "./worldAssetGallery.css";

function useLoadedAssetMarker() {
  return useCallback((assetId: string) => {
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
  }, []);
}

function GalleryPanel({ panel }: { readonly panel: WorldAssetGalleryPanel }) {
  const markLoaded = useLoadedAssetMarker();
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
          onLoaded={markLoaded}
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
