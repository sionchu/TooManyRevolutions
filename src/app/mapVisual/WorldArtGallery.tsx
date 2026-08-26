import { Canvas } from "@react-three/fiber";

import {
  MAP_MATERIAL_FAMILIES,
  ProceduralWorldArtKitRenderer,
} from "../../presentation/mapVisual";
import {
  createWorldArtGallerySnapshot,
  type WorldArtGalleryPanel,
} from "./worldArtGalleryModel";

function GalleryPanel({
  panel,
  index,
}: {
  readonly panel: WorldArtGalleryPanel;
  readonly index: number;
}) {
  const column = index % 3;
  const row = Math.floor(index / 3);
  const position: readonly [number, number, number] = [
    (column - 1) * 4.4,
    0,
    row * -3.7,
  ];
  return (
    <group position={position}>
      <mesh position={[0, -0.04, 0]} receiveShadow>
        <boxGeometry args={[3.4, 0.08, 2.7]} />
        <meshStandardMaterial
          color={MAP_MATERIAL_FAMILIES["terrain-earth"].baseColor}
          roughness={MAP_MATERIAL_FAMILIES["terrain-earth"].roughness}
          metalness={MAP_MATERIAL_FAMILIES["terrain-earth"].metalness}
        />
      </mesh>
      {panel.placements.map((placement) => (
        <ProceduralWorldArtKitRenderer
          key={`${panel.role}:${placement.family}`}
          family={placement.family}
          position={[placement.offset[0], 0, placement.offset[1]]}
        />
      ))}
    </group>
  );
}

/**
 * Standalone authoring preview. It is not mounted by the production runtime.
 * No world labels are drawn; the five role panels are compared by silhouette.
 */
export function WorldArtGallery() {
  const panels = createWorldArtGallerySnapshot();
  return (
    <div
      aria-label="Too Many Revolutions procedural world art gallery"
      data-labels="off"
      data-preview-only="true"
      data-world-art-gallery="true"
      style={{ height: "640px", width: "100%" }}
    >
      <Canvas
        shadows
        orthographic
        camera={{ position: [0, 7, 10], zoom: 46 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={1.6} />
        <directionalLight position={[4, 8, 5]} intensity={2.4} castShadow />
        {panels.map((panel, index) => (
          <GalleryPanel key={panel.compositionId} panel={panel} index={index} />
        ))}
      </Canvas>
    </div>
  );
}
