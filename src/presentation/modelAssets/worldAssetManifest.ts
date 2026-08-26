export type WorldAssetSourcePackId =
  "kaykit-medieval-hexagon" | "kaykit-forest-nature";

export type WorldAssetSlotId =
  | "capitalHero"
  | "industrialHero"
  | "portHero"
  | "frontierHero"
  | "houseA"
  | "houseB"
  | "mountainA"
  | "mountainB"
  | "treeClusterA"
  | "treeClusterB"
  | "rockCluster"
  | "roadStraight"
  | "roadCurve"
  | "riverStraight"
  | "riverCurve"
  | "coast"
  | "water";

export type WorldAssetSlotStatus = "resolved" | "unresolved";

export interface WorldAssetNormalization {
  /** Uniform source-to-world scale, applied after the shared map unit scale. */
  readonly scale: number;
  /** Euler rotation in radians, kept explicit for future GLB replacement. */
  readonly rotation: readonly [x: number, y: number, z: number];
  /** Translation that moves the source mesh to the shared ground origin. */
  readonly translation: readonly [x: number, y: number, z: number];
  readonly groundOrigin: "shared-y-zero";
}

export interface WorldAssetSourcePack {
  readonly id: WorldAssetSourcePackId;
  readonly displayName: string;
  readonly license: "CC0-1.0";
  readonly sourceTier: "free";
  readonly sourceDownloadSha256: string;
  readonly sourceUrl: string;
  readonly licenseFile: string;
}

export interface WorldAssetManifestEntry {
  /** Stable TMR identity; this is independent of the source filename. */
  readonly assetId: string;
  readonly slotId: WorldAssetSlotId;
  readonly publicUrl: string;
  readonly sourcePack: WorldAssetSourcePackId;
  readonly sourceFilename: string;
  readonly license: "CC0-1.0";
  readonly semanticFamily:
    | "civic-landmark"
    | "industrial"
    | "settlement"
    | "frontier"
    | "terrain"
    | "infrastructure"
    | "water";
  readonly normalization: WorldAssetNormalization;
}

export interface WorldAssetSlotManifest {
  readonly slotId: WorldAssetSlotId;
  readonly status: WorldAssetSlotStatus;
  /** One slot may resolve to a small coherent cluster, such as industrialHero. */
  readonly assetIds: readonly string[];
  readonly notes: string;
}

export interface WorldAssetManifestData {
  readonly sourcePacks: Readonly<
    Record<WorldAssetSourcePackId, WorldAssetSourcePack>
  >;
  readonly assets: readonly WorldAssetManifestEntry[];
  readonly slots: readonly WorldAssetSlotManifest[];
}

const MEDIEVAL_SOURCE_URL =
  "https://kaylousberg.itch.io/kaykit-medieval-hexagon";
const FOREST_SOURCE_URL = "https://kaylousberg.itch.io/kaykit-forest";
const MEDIEVAL_ROOT = "/assets/tmr/models/kaykit/medieval/Assets/gltf";
const FOREST_ROOT = "/assets/tmr/models/kaykit/forest/Assets/gltf";
const ROTATION_ZERO = [0, 0, 0] as const;
const GROUND_ZERO = "shared-y-zero" as const;

function normalization(
  scale: number,
  translation: readonly [x: number, y: number, z: number],
): WorldAssetNormalization {
  return {
    scale,
    rotation: ROTATION_ZERO,
    translation,
    groundOrigin: GROUND_ZERO,
  };
}

function medievalAsset(
  assetId: string,
  slotId: WorldAssetSlotId,
  sourceFilename: string,
  semanticFamily: WorldAssetManifestEntry["semanticFamily"],
  sourceNormalization: WorldAssetNormalization,
): WorldAssetManifestEntry {
  return {
    assetId,
    slotId,
    publicUrl: `${MEDIEVAL_ROOT}/${sourceFilename}`,
    sourcePack: "kaykit-medieval-hexagon",
    sourceFilename: `Assets/gltf/${sourceFilename}`,
    license: "CC0-1.0",
    semanticFamily,
    normalization: sourceNormalization,
  };
}

function forestAsset(
  assetId: string,
  slotId: WorldAssetSlotId,
  sourceFilename: string,
  semanticFamily: WorldAssetManifestEntry["semanticFamily"],
  sourceNormalization: WorldAssetNormalization,
): WorldAssetManifestEntry {
  return {
    assetId,
    slotId,
    publicUrl: `${FOREST_ROOT}/${sourceFilename}`,
    sourcePack: "kaykit-forest-nature",
    sourceFilename: `Assets/gltf/${sourceFilename}`,
    license: "CC0-1.0",
    semanticFamily,
    normalization: sourceNormalization,
  };
}

const medievalBuilding = normalization(1, [0, 0, 0]);
const capitalNormalization = normalization(0.72, [0, 0, 0]);
const medievalTile = normalization(1, [0, 1, 0]);
const forestTreeA = normalization(0.5, [0, 0.13, 0]);
const forestTreeB = normalization(0.56, [0, 0.15, 0]);
const forestRock = normalization(1.25, [0, 0, 0]);

const assets: readonly WorldAssetManifestEntry[] = [
  medievalAsset(
    "tmr.demo.asset.kaykit.castle.blue",
    "capitalHero",
    "buildings/blue/building_castle_blue.gltf",
    "civic-landmark",
    capitalNormalization,
  ),
  medievalAsset(
    "tmr.demo.asset.kaykit.mine.blue",
    "industrialHero",
    "buildings/blue/building_mine_blue.gltf",
    "industrial",
    medievalBuilding,
  ),
  medievalAsset(
    "tmr.demo.asset.kaykit.blacksmith.blue",
    "industrialHero",
    "buildings/blue/building_blacksmith_blue.gltf",
    "industrial",
    medievalBuilding,
  ),
  medievalAsset(
    "tmr.demo.asset.kaykit.barracks.blue",
    "frontierHero",
    "buildings/blue/building_barracks_blue.gltf",
    "frontier",
    medievalBuilding,
  ),
  medievalAsset(
    "tmr.demo.asset.kaykit.home-a.blue",
    "houseA",
    "buildings/blue/building_home_A_blue.gltf",
    "settlement",
    medievalBuilding,
  ),
  medievalAsset(
    "tmr.demo.asset.kaykit.home-b.blue",
    "houseB",
    "buildings/blue/building_home_B_blue.gltf",
    "settlement",
    medievalBuilding,
  ),
  medievalAsset(
    "tmr.demo.asset.kaykit.mountain-a",
    "mountainA",
    "decoration/nature/mountain_A.gltf",
    "terrain",
    medievalBuilding,
  ),
  medievalAsset(
    "tmr.demo.asset.kaykit.mountain-b",
    "mountainB",
    "decoration/nature/mountain_B.gltf",
    "terrain",
    medievalBuilding,
  ),
  medievalAsset(
    "tmr.demo.asset.kaykit.road-straight",
    "roadStraight",
    "tiles/roads/hex_road_A.gltf",
    "infrastructure",
    medievalTile,
  ),
  medievalAsset(
    "tmr.demo.asset.kaykit.road-slope",
    "roadCurve",
    "tiles/roads/hex_road_A_sloped_low.gltf",
    "infrastructure",
    medievalTile,
  ),
  medievalAsset(
    "tmr.demo.asset.kaykit.river-straight",
    "riverStraight",
    "tiles/rivers/hex_river_A.gltf",
    "water",
    medievalTile,
  ),
  medievalAsset(
    "tmr.demo.asset.kaykit.river-curve",
    "riverCurve",
    "tiles/rivers/hex_river_A_curvy.gltf",
    "water",
    medievalTile,
  ),
  medievalAsset(
    "tmr.demo.asset.kaykit.coast-a",
    "coast",
    "tiles/coast/hex_coast_A.gltf",
    "water",
    medievalTile,
  ),
  medievalAsset(
    "tmr.demo.asset.kaykit.water",
    "water",
    "tiles/base/hex_water.gltf",
    "water",
    medievalTile,
  ),
  forestAsset(
    "tmr.demo.asset.kaykit.tree-a",
    "treeClusterA",
    "Tree_1_A_Color1.gltf",
    "terrain",
    forestTreeA,
  ),
  forestAsset(
    "tmr.demo.asset.kaykit.tree-b",
    "treeClusterB",
    "Tree_3_A_Color1.gltf",
    "terrain",
    forestTreeB,
  ),
  forestAsset(
    "tmr.demo.asset.kaykit.rock-a",
    "rockCluster",
    "Rock_1_A_Color1.gltf",
    "terrain",
    forestRock,
  ),
];

const slots: readonly WorldAssetSlotManifest[] = [
  {
    slotId: "capitalHero",
    status: "resolved",
    assetIds: ["tmr.demo.asset.kaykit.castle.blue"],
    notes: "Castle landmark from the Medieval Hexagon free tier.",
  },
  {
    slotId: "industrialHero",
    status: "resolved",
    assetIds: [
      "tmr.demo.asset.kaykit.mine.blue",
      "tmr.demo.asset.kaykit.blacksmith.blue",
    ],
    notes: "Small mine and blacksmith cluster; no actors or vehicles.",
  },
  {
    slotId: "portHero",
    status: "unresolved",
    assetIds: [],
    notes:
      "No dock/port hero was selected from the free tier; do not substitute a non-port building.",
  },
  {
    slotId: "frontierHero",
    status: "resolved",
    assetIds: ["tmr.demo.asset.kaykit.barracks.blue"],
    notes: "Barracks landmark used as a frontier defensive silhouette.",
  },
  {
    slotId: "houseA",
    status: "resolved",
    assetIds: ["tmr.demo.asset.kaykit.home-a.blue"],
    notes: "Minor settlement variant A.",
  },
  {
    slotId: "houseB",
    status: "resolved",
    assetIds: ["tmr.demo.asset.kaykit.home-b.blue"],
    notes: "Minor settlement variant B.",
  },
  {
    slotId: "mountainA",
    status: "resolved",
    assetIds: ["tmr.demo.asset.kaykit.mountain-a"],
    notes: "Repeatable mountain variant A.",
  },
  {
    slotId: "mountainB",
    status: "resolved",
    assetIds: ["tmr.demo.asset.kaykit.mountain-b"],
    notes: "Repeatable mountain variant B.",
  },
  {
    slotId: "treeClusterA",
    status: "resolved",
    assetIds: ["tmr.demo.asset.kaykit.tree-a"],
    notes: "Repeatable Forest Nature tree cluster A.",
  },
  {
    slotId: "treeClusterB",
    status: "resolved",
    assetIds: ["tmr.demo.asset.kaykit.tree-b"],
    notes: "Repeatable Forest Nature tree cluster B.",
  },
  {
    slotId: "rockCluster",
    status: "resolved",
    assetIds: ["tmr.demo.asset.kaykit.rock-a"],
    notes: "Repeatable Forest Nature rock cluster.",
  },
  {
    slotId: "roadStraight",
    status: "resolved",
    assetIds: ["tmr.demo.asset.kaykit.road-straight"],
    notes: "Straight hex road tile.",
  },
  {
    slotId: "roadCurve",
    status: "resolved",
    assetIds: ["tmr.demo.asset.kaykit.road-slope"],
    notes: "Nearest available curved-road equivalent: low sloped road tile.",
  },
  {
    slotId: "riverStraight",
    status: "resolved",
    assetIds: ["tmr.demo.asset.kaykit.river-straight"],
    notes: "Straight river tile.",
  },
  {
    slotId: "riverCurve",
    status: "resolved",
    assetIds: ["tmr.demo.asset.kaykit.river-curve"],
    notes: "Curved river tile.",
  },
  {
    slotId: "coast",
    status: "resolved",
    assetIds: ["tmr.demo.asset.kaykit.coast-a"],
    notes: "Coast tile for water-edge compositions.",
  },
  {
    slotId: "water",
    status: "resolved",
    assetIds: ["tmr.demo.asset.kaykit.water"],
    notes: "Ocean/lake water tile.",
  },
];

export const WORLD_ASSET_MANIFEST: WorldAssetManifestData = {
  sourcePacks: {
    "kaykit-medieval-hexagon": {
      id: "kaykit-medieval-hexagon",
      displayName: "KayKit - Medieval Hexagon Pack",
      license: "CC0-1.0",
      sourceTier: "free",
      sourceDownloadSha256:
        "4FBB374C45732C88522BD3439E9415BF568C683236EDE336B4E61D161155BA12",
      sourceUrl: MEDIEVAL_SOURCE_URL,
      licenseFile:
        "/assets/tmr/models/kaykit/licenses/KayKit_Medieval_Hexagon_License.txt",
    },
    "kaykit-forest-nature": {
      id: "kaykit-forest-nature",
      displayName: "KayKit - Forest Nature Pack",
      license: "CC0-1.0",
      sourceTier: "free",
      sourceDownloadSha256:
        "2EE83E63BB7695F2D884EC27DDF6FCE020789A452E7D5C5B0BBDFC4F6EA1FC8C",
      sourceUrl: FOREST_SOURCE_URL,
      licenseFile:
        "/assets/tmr/models/kaykit/licenses/KayKit_Forest_Nature_License.txt",
    },
  },
  assets,
  slots,
};

export const WORLD_ASSET_ENTRIES = WORLD_ASSET_MANIFEST.assets;
export const WORLD_ASSET_SLOTS = WORLD_ASSET_MANIFEST.slots;

export function getWorldAssetEntry(
  assetId: string,
): WorldAssetManifestEntry | undefined {
  return WORLD_ASSET_MANIFEST.assets.find((asset) => asset.assetId === assetId);
}

export function getWorldAssetSlot(
  slotId: WorldAssetSlotId,
): WorldAssetSlotManifest {
  const slot = WORLD_ASSET_MANIFEST.slots.find(
    (candidate) => candidate.slotId === slotId,
  );
  if (slot === undefined) {
    throw new Error(`World asset slot ${slotId} is not registered.`);
  }
  return slot;
}

export function getResolvedWorldAssetEntries(
  slotId: WorldAssetSlotId,
): readonly WorldAssetManifestEntry[] {
  return getWorldAssetSlot(slotId).assetIds.map((assetId) => {
    const asset = getWorldAssetEntry(assetId);
    if (asset === undefined) {
      throw new Error(`World asset ${assetId} is not registered.`);
    }
    return asset;
  });
}
