# Map Visual System / Art Direction

Status: targeted P0 implementation

This document records the visual system layered over the existing R3F,
`WorldSceneModel`, and authoritative LandHex projection. It does not change
simulation topology, controller state, persistence, or route truth.

## Visual hierarchy

The production map has three presentation scales:

- **Macro**: continuous terrain mass, country/controller surfaces, major ridge or
  corridor, capital, and active crisis.
- **Meso**: Region composition, settlement cluster, institution, industry,
  agriculture, frontier gate, route corridor, and state-project silhouette.
- **Micro**: selected LandHex affordance, fine POI detail, and factual local
  activity. The grid is not a normal observation layer.

`src/presentation/mapVisualSystem.ts` computes this hierarchy from existing
WorldSceneModel evidence. A Region composition cannot create a mine, fort,
project, crisis, or route without an existing anchored object or runtime
projection.

## Authored geography and composition

The shared terrain mesh remains derived from the existing LandHex corner
positions. Visual geography is then layered above it with low-contrast terrain
surfaces, authored coastline/ridge/route paths, and Region compositions. Similar
terrain reads as one world surface before political boundaries or selection
affordances are considered.

Capital, industrial, agricultural, and frontier compositions use different
asset families and stable evidence IDs. A composition is presentation-only and
does not write WorldState.

## Procedural low-poly asset kit

The current kit is project-authored procedural geometry in R3F. It is a
documented bridge toward a future Blender/GLB pipeline and deliberately has no
third-party asset dependency:

`TMR-authored-procedural -> TMR_PROCEDURAL_LOW_POLY_KIT -> shared material palette -> R3F`

Families include palace, urban cluster, assembly, works, mine, port, fort/gate,
fields, project silhouettes, crisis beacon, terrain cluster, and route corridor.
Relative scales are centralized in `MAP_VISUAL_ASSET_KIT`; they are not
component-local arbitrary constants. Asset provenance is
`PROJECT_AUTHORED_NO_THIRD_PARTY_ASSET`.

## Material, lighting, and grounding

`MAP_MATERIAL_SYSTEM` centralizes the restrained historical palette, high
roughness, zero-metal material family, warm key light, cool hemisphere fill,
far-zoom fog, and contact-shadow opacity. Each authored object receives a
grounding ellipse so it sits in the terrain rather than floating above it.
Country/controller tint remains an overlay and does not replace object material
identity. Crisis red is reserved for active conflict evidence.

## Labels and camera

Label candidates use the priority order country > capital > crisis > Region >
project > major POI. `deriveMapVisualSystem()` filters by macro/meso/micro LOD,
tries deterministic offset candidates, and rejects occupied placements. The
`?mapLabels=0` local QA switch proves that the world remains legible without
labels. The default mobile preset remains `mobile.player-theater`; global fit is
explicit.

## Map Studio visual authoring

`?mapStudio=1` exposes read-only topology plus Geography, Infrastructure, Region
composition, Labels/LOD, Style/materials, POI/institution, Political preview,
Camera, Snapshot, and Validation/Patch modes. Draft changes stay in local
MapPatch v1 `visualChanges`, `styleChanges`, `geographyChanges`, or
`cameraPresetChanges` arrays. Map Studio never writes GitHub or runtime
WorldState directly.

## Acceptance method

Technical tests validate deterministic composition, asset provenance, material
grounding, LOD, label collision, shared terrain, faction perimeter, fronts, and
LandHex count. Browser screenshots separately inspect Day 0, labels-hidden
composition, mobile player theater, selected Hex context, rebellion territory,
project lifecycle, late state, and Map Studio. A code object existing in the
WorldSceneModel is not visual acceptance by itself.
