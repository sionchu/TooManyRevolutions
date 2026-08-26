import {
  getResolvedWorldAssetEntries,
  getWorldAssetSlot,
  type WorldAssetManifestEntry,
  type WorldAssetSlotId,
  type WorldAssetSlotStatus,
} from "../../presentation/modelAssets/worldAssetManifest";

export interface WorldAssetGalleryPanel {
  readonly slotId: WorldAssetSlotId;
  readonly label: string;
  readonly position: readonly [x: number, y: number, z: number];
  readonly status: WorldAssetSlotStatus;
  readonly notes: string;
  readonly assets: readonly WorldAssetManifestEntry[];
  readonly previewOnly: true;
}

const GALLERY_LAYOUT: readonly {
  readonly slotId: WorldAssetSlotId;
  readonly label: string;
  readonly position: readonly [x: number, y: number, z: number];
}[] = [
  { slotId: "capitalHero", label: "Capital", position: [-6.6, 0, -14.2] },
  {
    slotId: "industrialHero",
    label: "Industrial",
    position: [-2.2, 0, -14.2],
  },
  { slotId: "portHero", label: "Port", position: [2.2, 0, -14.2] },
  { slotId: "frontierHero", label: "Frontier", position: [6.6, 0, -14.2] },
  { slotId: "houseA", label: "House A", position: [-6.6, 0, -10.65] },
  { slotId: "houseB", label: "House B", position: [-2.2, 0, -10.65] },
  { slotId: "mountainA", label: "Mountain A", position: [2.2, 0, -10.65] },
  { slotId: "mountainB", label: "Mountain B", position: [6.6, 0, -10.65] },
  {
    slotId: "treeClusterA",
    label: "Forest A",
    position: [-6.6, 0, -7.1],
  },
  {
    slotId: "treeClusterB",
    label: "Forest B",
    position: [-2.2, 0, -7.1],
  },
  {
    slotId: "rockCluster",
    label: "Rock",
    position: [2.2, 0, -7.1],
  },
  {
    slotId: "roadStraight",
    label: "Road Straight",
    position: [6.6, 0, -7.1],
  },
  {
    slotId: "roadCurve",
    label: "Road Slope",
    position: [-6.6, 0, -3.55],
  },
  {
    slotId: "riverStraight",
    label: "River Straight",
    position: [-2.2, 0, -3.55],
  },
  {
    slotId: "riverCurve",
    label: "River Curve",
    position: [2.2, 0, -3.55],
  },
  { slotId: "coast", label: "Coast", position: [6.6, 0, -3.55] },
  { slotId: "water", label: "Water", position: [-6.6, 0, 0] },
];

/**
 * Standalone authoring preview layout. It reads slot resolution from the
 * asset manifest and never infers or creates a production map placement.
 */
export function createWorldAssetGallerySnapshot(): readonly WorldAssetGalleryPanel[] {
  return GALLERY_LAYOUT.map((layout) => {
    const slot = getWorldAssetSlot(layout.slotId);
    return {
      ...layout,
      status: slot.status,
      notes: slot.notes,
      assets: getResolvedWorldAssetEntries(layout.slotId),
      previewOnly: true,
    };
  });
}

export const WORLD_ASSET_GALLERY_SLOTS = GALLERY_LAYOUT.map(
  (layout) => layout.slotId,
);
