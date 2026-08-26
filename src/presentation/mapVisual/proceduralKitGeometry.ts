import {
  getWorldObjectVisualDefinition,
  MAP_MATERIAL_FAMILIES,
  type MapAssetProvenance,
  type MapAssetReplacementSeam,
  type MapMaterialFamilyId,
  type MapObjectAssetId,
  type MapObjectFamily,
  type MapObjectGroundingContract,
  type MapScaleRole,
} from "./worldArt";

export type ProceduralPrimitiveKind = "box" | "cylinder" | "cone";

export interface ProceduralWorldArtPrimitive {
  readonly id: string;
  readonly kind: ProceduralPrimitiveKind;
  readonly position: readonly [x: number, y: number, z: number];
  readonly size: readonly [width: number, height: number, depth: number];
  readonly rotation: readonly [x: number, y: number, z: number];
  readonly materialFamily: MapMaterialFamilyId;
  readonly sides?: number;
}

export interface ProceduralWorldArtKit {
  readonly kitId: `tmr.map.kit.${MapObjectFamily}`;
  readonly assetId: MapObjectAssetId;
  readonly family: MapObjectFamily;
  readonly scaleRole: MapScaleRole;
  readonly relativeScale: number;
  readonly visibleAt: readonly ("macro" | "meso" | "micro")[];
  readonly materialFamily: MapMaterialFamilyId;
  readonly primitives: readonly ProceduralWorldArtPrimitive[];
  readonly primitiveCount: number;
  readonly origin: "ground-center";
  readonly unitScale: 1;
  readonly scaleConvention: "MAP_SCALE_HIERARCHY_RELATIVE_SCALE";
  readonly grounding: MapObjectGroundingContract;
  readonly instancing: "instance-friendly" | "single-placement";
  readonly silhouetteTags: readonly string[];
  readonly replacementSeam: MapAssetReplacementSeam;
  readonly provenance: MapAssetProvenance;
}

type Point = readonly [x: number, y: number, z: number];
type Size = readonly [width: number, height: number, depth: number];
type Rotation = readonly [x: number, y: number, z: number];

const NO_ROTATION: Rotation = [0, 0, 0];

function primitive(
  id: string,
  kind: ProceduralPrimitiveKind,
  position: Point,
  size: Size,
  materialFamily: MapMaterialFamilyId,
  rotation: Rotation = NO_ROTATION,
  sides?: number,
): ProceduralWorldArtPrimitive {
  return {
    id,
    kind,
    position,
    size,
    rotation,
    materialFamily,
    ...(sides === undefined ? {} : { sides }),
  };
}

const box = (
  id: string,
  position: Point,
  size: Size,
  materialFamily: MapMaterialFamilyId,
  rotation?: Rotation,
): ProceduralWorldArtPrimitive =>
  primitive(id, "box", position, size, materialFamily, rotation);

const cylinder = (
  id: string,
  position: Point,
  size: Size,
  materialFamily: MapMaterialFamilyId,
  sides = 8,
): ProceduralWorldArtPrimitive =>
  primitive(id, "cylinder", position, size, materialFamily, NO_ROTATION, sides);

const cone = (
  id: string,
  position: Point,
  size: Size,
  materialFamily: MapMaterialFamilyId,
  sides = 6,
): ProceduralWorldArtPrimitive =>
  primitive(id, "cone", position, size, materialFamily, NO_ROTATION, sides);

function defineKit(
  family: MapObjectFamily,
  materialFamily: MapMaterialFamilyId,
  primitives: readonly ProceduralWorldArtPrimitive[],
  silhouetteTags: readonly string[],
  instancing: ProceduralWorldArtKit["instancing"] = "single-placement",
): ProceduralWorldArtKit {
  const visual = getWorldObjectVisualDefinition(family);
  if (visual === undefined) {
    throw new Error(`Missing visual manifest entry for ${family}.`);
  }
  if (MAP_MATERIAL_FAMILIES[materialFamily] === undefined) {
    throw new Error(`Missing material family ${materialFamily}.`);
  }
  return {
    kitId: `tmr.map.kit.${family}`,
    assetId: visual.assetId,
    family,
    scaleRole: visual.scaleRole,
    relativeScale: visual.relativeScale,
    visibleAt: visual.visibleAt,
    materialFamily,
    primitives,
    primitiveCount: primitives.length,
    origin: "ground-center",
    unitScale: 1,
    scaleConvention: "MAP_SCALE_HIERARCHY_RELATIVE_SCALE",
    grounding: visual.grounding,
    instancing,
    silhouetteTags,
    replacementSeam: visual.replacementSeam,
    provenance: visual.provenance,
  };
}

export const PROCEDURAL_WORLD_ART_KITS: Readonly<
  Record<MapObjectFamily, ProceduralWorldArtKit>
> = {
  palace: defineKit(
    "palace",
    "civic-plaster",
    [
      box("central-hall", [0, 0.4, 0], [1.05, 0.8, 0.72], "civic-plaster"),
      cylinder(
        "left-tower",
        [-0.66, 0.52, 0],
        [0.3, 1.04, 0.3],
        "civic-plaster",
      ),
      cylinder(
        "right-tower",
        [0.66, 0.52, 0],
        [0.3, 1.04, 0.3],
        "civic-plaster",
      ),
      cone("central-roof", [0, 1.08, 0], [1.02, 0.38, 0.78], "civic-plaster"),
      box("stone-terrace", [0, 0.05, 0], [1.9, 0.1, 1.35], "terrain-stone"),
      box("front-stairs", [0, 0.14, 0.7], [0.7, 0.18, 0.4], "terrain-stone"),
      box("public-plaza", [0, 0.09, 0.98], [1.35, 0.08, 0.28], "terrain-stone"),
      box(
        "civic-approach",
        [0, 0.04, 1.22],
        [0.42, 0.08, 0.38],
        "terrain-earth",
      ),
    ],
    ["central-hall", "towers", "roof", "terrace", "public-axis"],
  ),
  "assembly-parliament": defineKit(
    "assembly-parliament",
    "civic-plaster",
    [
      box("assembly-hall", [0, 0.38, 0], [1, 0.76, 0.72], "civic-plaster"),
      box("portico", [0, 0.32, 0.52], [1.2, 0.64, 0.18], "civic-plaster"),
      cylinder(
        "left-column",
        [-0.38, 0.35, 0.65],
        [0.12, 0.7, 0.12],
        "civic-plaster",
      ),
      cylinder(
        "right-column",
        [0.38, 0.35, 0.65],
        [0.12, 0.7, 0.12],
        "civic-plaster",
      ),
      cone("assembly-roof", [0, 0.9, 0], [1.1, 0.3, 0.8], "civic-plaster"),
      box("civic-steps", [0, 0.09, 0.73], [0.75, 0.18, 0.25], "terrain-stone"),
    ],
    ["hall", "portico", "columns", "low-civic-roof"],
  ),
  "dense-town": defineKit(
    "dense-town",
    "terrain-earth",
    [
      box("street-ground", [0, 0.03, 0], [1.7, 0.06, 1.2], "terrain-earth"),
      box("house-a", [-0.48, 0.28, -0.2], [0.55, 0.5, 0.48], "civic-plaster"),
      cone(
        "house-a-roof",
        [-0.48, 0.62, -0.2],
        [0.62, 0.25, 0.55],
        "frontier-timber",
      ),
      box("house-b", [0.32, 0.22, 0.3], [0.4, 0.4, 0.38], "frontier-timber"),
      cone(
        "house-b-roof",
        [0.32, 0.5, 0.3],
        [0.48, 0.2, 0.45],
        "frontier-timber",
      ),
      box(
        "town-tower",
        [0.63, 0.4, -0.25],
        [0.28, 0.72, 0.28],
        "terrain-stone",
      ),
      box(
        "market-platform",
        [-0.08, 0.12, 0.45],
        [0.65, 0.18, 0.3],
        "terrain-earth",
      ),
    ],
    ["varied-roofs", "close-set-buildings", "market-platform"],
  ),
  "small-settlement": defineKit(
    "small-settlement",
    "frontier-timber",
    [
      box("settlement-ground", [0, 0.03, 0], [1.2, 0.06, 0.9], "terrain-earth"),
      box("house-a", [-0.28, 0.25, -0.1], [0.5, 0.44, 0.42], "frontier-timber"),
      cone(
        "house-a-roof",
        [-0.28, 0.55, -0.1],
        [0.58, 0.22, 0.5],
        "frontier-timber",
      ),
      box("house-b", [0.32, 0.2, 0.22], [0.38, 0.35, 0.32], "civic-plaster"),
      cone(
        "house-b-roof",
        [0.32, 0.45, 0.22],
        [0.45, 0.18, 0.4],
        "frontier-timber",
      ),
    ],
    ["two-houses", "open-yard", "low-roofs"],
  ),
  "port-dock": defineKit(
    "port-dock",
    "terrain-earth",
    [
      box("pier", [0, 0.12, 0.28], [1.8, 0.2, 0.78], "terrain-earth"),
      box("quay-apron", [0, 0.06, -0.25], [1.8, 0.12, 0.28], "terrain-stone"),
      box("dock-edge", [0, 0.22, 0.66], [1.8, 0.12, 0.12], "frontier-timber"),
      cylinder(
        "dock-post-left",
        [-0.7, 0.38, 0.64],
        [0.1, 0.7, 0.1],
        "frontier-timber",
      ),
      cylinder(
        "dock-post-right",
        [0.7, 0.38, 0.64],
        [0.1, 0.7, 0.1],
        "frontier-timber",
      ),
      box("warehouse", [-0.5, 0.35, -0.42], [0.65, 0.7, 0.52], "civic-plaster"),
      cone(
        "warehouse-roof",
        [-0.5, 0.78, -0.42],
        [0.75, 0.28, 0.6],
        "civic-plaster",
      ),
      cylinder(
        "mast",
        [0.42, 0.72, 0.25],
        [0.08, 1.35, 0.08],
        "frontier-timber",
      ),
      box(
        "crane-arm",
        [0.42, 1.24, 0.25],
        [0.75, 0.08, 0.08],
        "frontier-timber",
      ),
    ],
    ["shore-crossing-pier", "quay-edge", "warehouse", "mast"],
  ),
  "water-shelf": defineKit(
    "water-shelf",
    "terrain-water",
    [
      box("water-plane", [0, 0.02, 0.52], [5.2, 0.04, 3.4], "terrain-water"),
      box(
        "shoreline-band",
        [0, 0.07, -0.14],
        [5.2, 0.1, 0.24],
        "terrain-earth",
      ),
      box(
        "shoreline-edge",
        [0, 0.13, -0.04],
        [5.2, 0.08, 0.1],
        "terrain-stone",
      ),
      box(
        "tidal-inlet-left",
        [-1.7, 0.045, 0.16],
        [0.9, 0.05, 0.12],
        "terrain-water",
      ),
      box(
        "tidal-inlet-right",
        [1.7, 0.045, 0.16],
        [0.9, 0.05, 0.12],
        "terrain-water",
      ),
    ],
    ["broad-water-shelf", "shoreline-band", "edge-breaks"],
    "instance-friendly",
  ),
  mine: defineKit(
    "mine",
    "industrial-iron",
    [
      box("mine-mouth", [0, 0.2, 0.18], [0.65, 0.4, 0.18], "industrial-iron"),
      cylinder(
        "headframe-left",
        [-0.2, 0.55, 0.2],
        [0.08, 0.9, 0.08],
        "frontier-timber",
      ),
      cylinder(
        "headframe-right",
        [0.2, 0.55, 0.2],
        [0.08, 0.9, 0.08],
        "frontier-timber",
      ),
      box("headframe-beam", [0, 0.96, 0.2], [0.5, 0.1, 0.1], "frontier-timber"),
      cone("ore-pile", [0.45, 0.18, -0.2], [0.45, 0.35, 0.45], "terrain-stone"),
      box("mine-track", [0, 0.04, 0.8], [0.15, 0.08, 0.8], "terrain-earth"),
    ],
    ["mine-mouth", "headframe", "ore-pile", "track"],
  ),
  "factory-iron-works": defineKit(
    "factory-iron-works",
    "industrial-iron",
    [
      box("works-hall", [0, 0.45, 0], [1.4, 0.9, 0.76], "industrial-iron"),
      box("works-roof", [0, 0.96, 0], [1.52, 0.1, 0.84], "industrial-iron"),
      cylinder(
        "chimney-a",
        [-0.42, 1.18, -0.16],
        [0.14, 0.45, 0.14],
        "industrial-iron",
      ),
      cylinder(
        "chimney-b",
        [0, 1.25, -0.16],
        [0.14, 0.62, 0.14],
        "industrial-iron",
      ),
      cylinder(
        "chimney-c",
        [0.42, 1.14, -0.16],
        [0.14, 0.4, 0.14],
        "industrial-iron",
      ),
      cylinder(
        "furnace",
        [0.42, 0.72, 0.25],
        [0.34, 0.74, 0.34],
        "industrial-iron",
      ),
      box(
        "works-yard",
        [-0.32, 0.08, 0.62],
        [1.15, 0.16, 0.38],
        "terrain-earth",
      ),
      box("yard-crane", [0, 1.0, 0.42], [1.25, 0.08, 0.08], "industrial-iron"),
      box("ore-bay", [-0.75, 0.16, 0.42], [0.32, 0.32, 0.42], "terrain-stone"),
      box("haul-axis", [0, 0.045, 0.92], [1.55, 0.09, 0.12], "terrain-stone"),
    ],
    [
      "works-hall",
      "varied-chimneys",
      "furnace-ore-bay",
      "haul-axis",
      "yard-crane",
    ],
  ),
  fort: defineKit(
    "fort",
    "terrain-stone",
    [
      box("north-wall", [0, 0.32, -0.55], [1.35, 0.64, 0.14], "terrain-stone"),
      box(
        "south-wall-left",
        [-0.43, 0.32, 0.55],
        [0.46, 0.64, 0.14],
        "terrain-stone",
      ),
      box(
        "south-wall-right",
        [0.43, 0.32, 0.55],
        [0.46, 0.64, 0.14],
        "terrain-stone",
      ),
      box("west-wall", [-0.62, 0.32, 0], [0.14, 0.64, 1.0], "terrain-stone"),
      box("east-wall", [0.62, 0.32, 0], [0.14, 0.64, 1.0], "terrain-stone"),
      cylinder(
        "tower-north-west",
        [-0.62, 0.62, -0.55],
        [0.3, 1.24, 0.3],
        "terrain-stone",
      ),
      cylinder(
        "tower-north-east",
        [0.62, 0.62, -0.55],
        [0.3, 1.24, 0.3],
        "terrain-stone",
      ),
      cylinder(
        "tower-south-west",
        [-0.62, 0.62, 0.55],
        [0.3, 1.24, 0.3],
        "terrain-stone",
      ),
      cylinder(
        "tower-south-east",
        [0.62, 0.62, 0.55],
        [0.3, 1.24, 0.3],
        "terrain-stone",
      ),
      box("gate", [0, 0.78, 0.55], [0.42, 0.16, 0.18], "frontier-timber"),
    ],
    ["wall-perimeter", "corner-towers", "open-gate-void", "gate-lintel"],
  ),
  "checkpoint-gate": defineKit(
    "checkpoint-gate",
    "frontier-timber",
    [
      box("left-post", [-0.42, 0.48, 0], [0.16, 0.96, 0.16], "frontier-timber"),
      box("right-post", [0.42, 0.48, 0], [0.16, 0.96, 0.16], "frontier-timber"),
      box("gate-lintel", [0, 0.94, 0], [1, 0.16, 0.2], "frontier-timber"),
      box(
        "guard-booth",
        [0.58, 0.28, -0.18],
        [0.4, 0.56, 0.38],
        "frontier-timber",
      ),
      cone(
        "guard-roof",
        [0.58, 0.62, -0.18],
        [0.48, 0.18, 0.44],
        "frontier-timber",
      ),
      box("gate-threshold", [0, 0.05, 0], [0.78, 0.1, 0.3], "terrain-stone"),
      box(
        "barrier-arm",
        [0, 0.22, 0.22],
        [0.82, 0.1, 0.1],
        "signal-ochre",
        [0, 0, 0.12],
      ),
      cylinder(
        "checkpoint-marker",
        [-0.62, 0.18, 0.2],
        [0.14, 0.36, 0.14],
        "signal-ochre",
      ),
    ],
    ["gate-posts", "lintel", "guard-booth", "barrier"],
  ),
  "granary-storehouse": defineKit(
    "granary-storehouse",
    "civic-plaster",
    [
      box("storehouse", [0, 0.42, 0], [1.05, 0.84, 0.68], "terrain-cultivated"),
      cone(
        "storehouse-roof",
        [0, 0.92, 0],
        [1.18, 0.34, 0.78],
        "frontier-timber",
      ),
      cylinder("silo-a", [-0.52, 0.4, -0.05], [0.3, 0.8, 0.3], "civic-plaster"),
      cylinder("silo-b", [0.52, 0.4, -0.05], [0.3, 0.8, 0.3], "civic-plaster"),
      cone(
        "silo-cap-a",
        [-0.52, 0.86, -0.05],
        [0.36, 0.16, 0.36],
        "civic-plaster",
      ),
      cone(
        "silo-cap-b",
        [0.52, 0.86, -0.05],
        [0.36, 0.16, 0.36],
        "civic-plaster",
      ),
      box("grain-yard", [0, 0.08, 0.58], [1.6, 0.16, 0.4], "terrain-earth"),
      cylinder(
        "yard-post-left",
        [-0.68, 0.28, 0.58],
        [0.08, 0.56, 0.08],
        "frontier-timber",
      ),
      cylinder(
        "yard-post-right",
        [0.68, 0.28, 0.58],
        [0.08, 0.56, 0.08],
        "frontier-timber",
      ),
    ],
    ["storehouse", "silo-profile", "grain-yard"],
  ),
  "distribution-yard": defineKit(
    "distribution-yard",
    "terrain-earth",
    [
      box(
        "warehouse-a",
        [-0.55, 0.3, -0.22],
        [0.72, 0.6, 0.48],
        "terrain-cultivated",
      ),
      box(
        "warehouse-b",
        [0.48, 0.26, -0.24],
        [0.52, 0.52, 0.4],
        "frontier-timber",
      ),
      box(
        "loading-canopy",
        [0, 0.52, 0.36],
        [1.15, 0.14, 0.42],
        "frontier-timber",
      ),
      box(
        "canopy-post-left",
        [-0.48, 0.28, 0.36],
        [0.08, 0.56, 0.08],
        "frontier-timber",
      ),
      box(
        "canopy-post-right",
        [0.48, 0.28, 0.36],
        [0.08, 0.56, 0.08],
        "frontier-timber",
      ),
      box(
        "loading-platform",
        [0, 0.11, 0.59],
        [1.5, 0.22, 0.28],
        "terrain-stone",
      ),
      box("lane-a", [-0.42, 0.04, 0.86], [0.18, 0.08, 0.62], "terrain-earth"),
      box("lane-b", [0.42, 0.04, 0.86], [0.18, 0.08, 0.62], "terrain-earth"),
      box("yard-boundary", [0, 0.04, 1.18], [1.5, 0.08, 0.1], "terrain-stone"),
    ],
    ["two-warehouses", "canopy", "loading-platform", "lanes", "open-yard"],
  ),
  barricade: defineKit(
    "barricade",
    "signal-ochre",
    [
      box("barrier-base", [0, 0.06, 0], [0.9, 0.12, 0.18], "terrain-stone"),
      box(
        "cross-beam-a",
        [-0.18, 0.35, 0],
        [0.75, 0.1, 0.1],
        "signal-ochre",
        [0, 0, 0.38],
      ),
      box(
        "cross-beam-b",
        [0.18, 0.35, 0],
        [0.75, 0.1, 0.1],
        "signal-ochre",
        [0, 0, -0.38],
      ),
      cylinder(
        "left-post",
        [-0.32, 0.28, 0],
        [0.1, 0.56, 0.1],
        "frontier-timber",
      ),
      cylinder(
        "right-post",
        [0.32, 0.28, 0],
        [0.1, 0.56, 0.1],
        "frontier-timber",
      ),
    ],
    ["cross-beams", "blocked-path", "posts"],
  ),
  "faction-banner": defineKit(
    "faction-banner",
    "signal-ochre",
    [
      box("banner-base", [0, 0.04, 0], [0.22, 0.08, 0.22], "terrain-stone"),
      cylinder(
        "banner-pole",
        [0, 0.55, 0],
        [0.06, 1.1, 0.06],
        "frontier-timber",
      ),
      box("banner-cloth", [0.2, 0.82, 0], [0.38, 0.2, 0.04], "signal-ochre"),
      cone("banner-finial", [0, 1.14, 0], [0.12, 0.16, 0.12], "signal-ochre"),
    ],
    ["pole", "cloth", "finial"],
  ),
  "mountain-cluster": defineKit(
    "mountain-cluster",
    "terrain-stone",
    [
      cone("peak-a", [-0.52, 0.65, 0], [0.9, 1.3, 0.9], "terrain-stone"),
      cone("peak-b", [0.05, 0.48, -0.18], [0.7, 0.96, 0.7], "terrain-stone"),
      cone("peak-c", [0.55, 0.38, 0.12], [0.62, 0.76, 0.62], "terrain-stone"),
      box("ridge-foot", [0, 0.08, 0.08], [1.55, 0.16, 0.72], "terrain-stone"),
      cone("foothill", [-0.05, 0.24, 0.46], [0.8, 0.42, 0.55], "terrain-earth"),
    ],
    ["three-peaks", "ridge-foot", "foothill"],
    "instance-friendly",
  ),
  "forest-cluster": defineKit(
    "forest-cluster",
    "vegetation",
    [
      box("forest-ground", [0, 0.03, 0], [1.35, 0.06, 1], "vegetation"),
      cone("tree-a", [-0.5, 0.38, 0], [0.5, 0.76, 0.5], "vegetation"),
      cone("tree-b", [-0.1, 0.52, -0.18], [0.58, 1.04, 0.58], "vegetation"),
      cone("tree-c", [0.38, 0.42, 0.1], [0.5, 0.84, 0.5], "vegetation"),
      cylinder(
        "trunk-a",
        [-0.1, 0.18, -0.18],
        [0.1, 0.36, 0.1],
        "frontier-timber",
      ),
      cone("underbrush", [0.18, 0.16, 0.42], [0.5, 0.3, 0.5], "vegetation"),
    ],
    ["overlapping-canopies", "trunks", "underbrush"],
    "instance-friendly",
  ),
  "field-plot": defineKit(
    "field-plot",
    "terrain-cultivated",
    [
      box("field-ground", [0, 0.03, 0], [4.4, 0.06, 2.8], "terrain-cultivated"),
      box("furrow-a", [-1.05, 0.075, 0], [0.13, 0.05, 2.3], "terrain-stone"),
      box("furrow-b", [0, 0.075, 0], [0.13, 0.05, 2.3], "terrain-stone"),
      box("furrow-c", [1.05, 0.075, 0], [0.13, 0.05, 2.3], "terrain-stone"),
      box(
        "field-berm",
        [0, 0.1, -1.32],
        [4.5, 0.14, 0.16],
        "terrain-cultivated",
      ),
      box("field-drainage", [0, 0.08, 1.2], [4.2, 0.06, 0.1], "terrain-stone"),
    ],
    [
      "wide-open-ground",
      "cultivated-soil",
      "repeating-furrows",
      "drainage-berm",
    ],
    "instance-friendly",
  ),
  "road-corridor": defineKit(
    "road-corridor",
    "terrain-earth",
    [
      box("road-bed", [0, 0.03, 0], [0.3, 0.06, 1.8], "terrain-earth"),
      box(
        "left-shoulder",
        [-0.22, 0.035, 0],
        [0.08, 0.07, 1.8],
        "terrain-stone",
      ),
      box(
        "right-shoulder",
        [0.22, 0.035, 0],
        [0.08, 0.07, 1.8],
        "terrain-stone",
      ),
      cylinder(
        "left-marker",
        [-0.34, 0.16, -0.62],
        [0.06, 0.32, 0.06],
        "signal-ochre",
      ),
      cylinder(
        "right-marker",
        [0.34, 0.16, 0.62],
        [0.06, 0.32, 0.06],
        "signal-ochre",
      ),
    ],
    ["linear-bed", "stone-shoulders", "markers"],
    "instance-friendly",
  ),
};

export const PalaceKit = PROCEDURAL_WORLD_ART_KITS.palace;
export const AssemblyKit = PROCEDURAL_WORLD_ART_KITS["assembly-parliament"];
export const DenseTownKit = PROCEDURAL_WORLD_ART_KITS["dense-town"];
export const SmallSettlementKit = PROCEDURAL_WORLD_ART_KITS["small-settlement"];
export const PortDockKit = PROCEDURAL_WORLD_ART_KITS["port-dock"];
export const WaterShelfKit = PROCEDURAL_WORLD_ART_KITS["water-shelf"];
export const MineKit = PROCEDURAL_WORLD_ART_KITS.mine;
export const FactoryIronWorksKit =
  PROCEDURAL_WORLD_ART_KITS["factory-iron-works"];
export const FortKit = PROCEDURAL_WORLD_ART_KITS.fort;
export const CheckpointGateKit = PROCEDURAL_WORLD_ART_KITS["checkpoint-gate"];
export const GranaryKit = PROCEDURAL_WORLD_ART_KITS["granary-storehouse"];
export const DistributionYardKit =
  PROCEDURAL_WORLD_ART_KITS["distribution-yard"];
export const BarricadeKit = PROCEDURAL_WORLD_ART_KITS.barricade;
export const FactionBannerKit = PROCEDURAL_WORLD_ART_KITS["faction-banner"];
export const MountainClusterKit = PROCEDURAL_WORLD_ART_KITS["mountain-cluster"];
export const ForestClusterKit = PROCEDURAL_WORLD_ART_KITS["forest-cluster"];
export const FieldPlotKit = PROCEDURAL_WORLD_ART_KITS["field-plot"];
export const RoadCorridorKit = PROCEDURAL_WORLD_ART_KITS["road-corridor"];

export function getProceduralWorldArtKit(
  query: MapObjectFamily | MapObjectAssetId,
): ProceduralWorldArtKit | undefined {
  return Object.values(PROCEDURAL_WORLD_ART_KITS).find(
    (kit) => kit.family === query || kit.assetId === query,
  );
}
