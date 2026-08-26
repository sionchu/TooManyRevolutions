# GAMEBUILDERS_PRODUCT_SURFACE_P0 — Map World Architecture / Authoring Addendum

Date: 2026-08-26
Task: `GAMEBUILDERS_PRODUCT_SURFACE_P0`
Status: AUTHORIZED TARGETED MAP REWORK
Review basis: `docs/P0_CONTINUOUS_WORLD_PRODUCT_REVIEW_2026-08-26.md`

## Product finding

The remaining map problem is not primarily “low-poly quality”. It is the absence of a mature **map hierarchy**.

Current TMR still tends to translate:

```text
LandHex data
-> one visible hex-shaped surface/marker
```

Too directly.

Reference strategy games instead separate logical cells from the world the player sees:

```text
logical topology
-> geography
-> strategic areas / polity
-> settlements / infrastructure
-> activity / units / conflicts
-> labels / UI
```

TMR must do the same while preserving existing simulation authority.

## Why the current world does not feel like RTK / HOI / Plague-Rebel style strategy maps

### A. No strong geographic silhouette

The current world reads as a flat olive board with a small cluster of primitive objects. Rivers, ridges, passes, coastlines, urban clusters and road corridors do not create a memorable geographic shape.

### B. Logical cell geometry is still visible as art grammar

Even with hidden normal outlines, terrain is constructed cell-by-cell and political change re-exposes many complete hex perimeters. The player notices the tessellation before the geography.

### C. Strategic hierarchy is too shallow

The screen currently has roughly:

```text
LandHex -> Region label / POI
```

It lacks a clear visual hierarchy comparable to:

```text
LandHex -> strategic area -> city region / polity theater -> city/port/gate/route
```

TMR does not need to copy another game's rules, but it does need multiple readable spatial scales.

### D. Geography, politics and activity use similar abstract primitives

Rings, lines, hex outlines and small geometric props compete for attention. Terrain, political influence, territorial control and active conflict do not have sufficiently different visual channels.

### E. Camera framing treats “fit all bounds” as the default goal

A large stage with a tiny fully-fitted world is still a small map. Mobile portrait especially needs a local strategic camera rather than global fit.

### F. Map content is code-authored but not yet editor-managed

POIs and institutions now have stable authored metadata, but map authoring still requires source edits. As scenarios grow, this will become a bottleneck and create visual inconsistency.

## Reference adaptation

### Romance of the Three Kingdoms XIV

Use the **hierarchy principle** only:

```text
logical LandHex
-> Area-like strategic grouping
-> Region / polity grouping
-> city / port / gate / important place
```

TMR already has LandHex and Region. Add presentation-only strategic geography/grouping where needed; do not import RTK economy/unit rules.

### Hearts of Iron IV

Use the **layered grand-strategy map principle**:

- terrain/geography remains the base world;
- political boundaries are overlays;
- fronts/conflict are separate overlays;
- logistics/contact routes are separate overlays;
- different map modes emphasize one strategic question without replacing geography.

Do not import HOI military simulation.

### Plague Inc / Rebel Inc

Use the **persistent playfield / hotspot principle**:

- map fills the player's attention;
- activity appears directly on geography;
- important changes are visible as spatial hotspots and routes;
- supporting statistics do not replace the world.

## Required map data architecture

Preserve authoritative simulation data and introduce explicit presentation/authoring layers.

```text
1. MapTopologyDefinition      [authoritative simulation/content]
2. MapGeographyDefinition     [authored presentation + authoritative terrain refs]
3. MapSemanticContent         [authored presentation]
4. MapPoliticalProjection     [runtime derived]
5. MapActivityProjection      [runtime derived]
6. MapViewPreset              [presentation]
7. MapStyleDefinition         [presentation]
```

### 1. MapTopologyDefinition

Existing authority remains:

- LandHex stable ID;
- axial coordinate / adjacency;
- Region membership;
- terrain type where mechanically relevant;
- physical controller;
- authoritative routes/state already in simulation.

Do not replace this layer in P0.

### 2. MapGeographyDefinition

Manage the visible world independently from hex outlines.

Suggested fields:

```text
scenarioId
worldBounds
terrainZones[]
heightAnchors[]
coastline / water masks where authored
riverPaths[]
roadPaths[]
ridge / pass presentation anchors[]
vegetationZones[]
regionSurfaceHints[]
```

Every item must state whether it is:

- `AUTHORITATIVE_PROJECTION` — backed by simulation/content truth;
- `DERIVED_PRESENTATION` — deterministic rendering of truth;
- `DECORATIVE_SUBSTRATE` — atmosphere only and cannot imply gameplay state.

If a road/river affects simulation, it must be linked to authoritative scenario content. Decorative roads/rivers must not imply nonexistent mechanics.

### 3. MapSemanticContent

Expand the current `worldSceneContent` concept:

```text
settlements
ports
mines / industrial works
forts / gates / checkpoints
state institutions
state-project anchors
special landmarks
label anchors
```

All use stable IDs and explicit Region/LandHex anchors.

### 4. MapPoliticalProjection

Runtime-derived visual layers:

- legal owner surface/boundary;
- physical controller surface/boundary;
- ideology/influence region surface treatment;
- faction-controlled merged territory;
- derived fronts;
- capital threat / territorial delta.

Do not render every changed cell as a full cell outline.

### 5. MapActivityProjection

Runtime-derived activity:

- route flow;
- faction activity;
- rebellion/coup hotspot;
- project implementing/completed state;
- factual world visual deltas.

### 6. MapViewPreset

Store scenario/device-aware camera presets:

```text
desktop.global
mobile.player-theater
region.focus.<regionId>
crisis.focus
project.focus
full-world
```

A camera preset is presentation only.

### 7. MapStyleDefinition

Centralize visual grammar:

- terrain palette/material family;
- political overlay opacity;
- border widths;
- icon/object scale;
- label LOD;
- route grammar;
- crisis FX grammar;
- selected-cell affordance.

No component-local arbitrary style constants for major map semantics.

## Continuous terrain implementation requirement

The next renderer pass must stop using “one independent visible fan per hex” as the primary terrain construction concept.

Preferred P0 implementation:

1. derive shared world vertices from adjacent LandHex corner positions;
2. key/snap shared corners so adjacent cells reference common geographic vertices;
3. build one or a small number of continuous triangulated terrain meshes;
4. blend terrain/elevation across shared vertices where visual-only smoothing is allowed;
5. preserve logical LandHex hit areas separately and invisibly;
6. render political boundaries from adjacency-edge extraction, not per-cell outlines.

A higher-resolution decorative terrain mesh may be derived above LandHex topology if it cannot change gameplay truth.

## Territory boundary extraction

For owner/controller/faction territory:

```text
for each LandHex edge
  compare adjacent cell semantic owner/controller
  if same -> do not draw internal edge
  if different -> emit boundary segment
merge connected boundary segments
render outer political/front perimeter
```

Required result:

- normal country interior has no grid;
- faction occupation reads as one territory patch;
- front reads as boundary between controllers;
- only selected/target cells show full hex affordance.

## Ideology / influence presentation

Replace large ring-token language as the dominant region signal.

Preferred channels:

- terrain tint/decal;
- soft pattern/noise density;
- region-surface gradient;
- animated low-opacity diffusion texture/pulse tied to actual route evidence.

Rings may remain for temporary selection/focus only.

## Geography density / object hierarchy

At default desktop framing, the player must be able to identify without reading labels:

- player capital/palace;
- main industrial place;
- at least one neighboring strategic place;
- one major route corridor;
- active crisis area when present;
- completed state project when present.

Repeated generic primitives do not count as a finished object family.

Use a coherent low-poly asset kit or procedurally authored family. R3F remains the renderer; glTF 2.0 is the preferred future asset interchange for authored 3D objects, with asset provenance tracked in the existing manifest/catalog system.

## Camera / LOD policy

### Desktop

Default camera may show the whole current theater **only if** actual world content occupies at least 75% of stage width and 55% of stage height.

### Mobile portrait

Default camera must show:

```text
player country core
+ immediate border context
+ one neighboring polity edge
```

Do not full-fit all countries by default.

Provide explicit:

- pan;
- zoom;
- `전체 보기`;
- focus-to-crisis;
- focus-to-project/region.

### LOD

Far zoom:
- terrain masses;
- country labels;
- major capitals;
- major crisis/front.

Medium zoom:
- Region identity;
- POI families;
- routes;
- project landmarks;
- controller boundary.

Near zoom:
- selected LandHex affordance;
- minor POIs;
- fine activity/detail.

Do not show all labels/objects at all zoom levels.

## Map Studio — development/admin map management UI

Create a development-only `Map Studio`, following the Content Studio philosophy.

Suggested entry:

```text
?mapStudio=1
```

It must not be part of normal gameplay.

### Main layout

```text
LEFT: scenario/layer tree
CENTER: interactive world editor/preview
RIGHT: selected object inspector
BOTTOM/TOOLBAR: mode, snapshot, validation, patch export/import
```

### Editing modes

1. **Topology view**
   - inspect LandHex IDs, Region membership, adjacency;
   - normally read-only in P0 unless topology edit is explicitly authorized.

2. **Geography view**
   - terrain zone/height anchor editing;
   - river/road/ridge/pass presentation paths;
   - continuous terrain preview.

3. **POI / Institution view**
   - place/move authored POIs;
   - choose stable kind;
   - anchor to Region/LandHex;
   - edit label offset/LOD.

4. **Political preview**
   - owner/controller/front/ideology overlay inspection;
   - no mutation of runtime WorldState.

5. **Camera view**
   - edit/test desktop/mobile view presets;
   - show world-content occupancy metrics.

6. **Snapshot preview**
   - Day 0 frozen scene;
   - rebellion/controller-change scene;
   - project implementing/completed scene;
   - late-state scene.

### Persistence workflow

Map Studio does **not** write GitHub directly.

```text
baseline map/content records
-> local draft edits
-> MapPatch v1 export
-> Codex/ChatGPT/human applies patch to repo
-> diff/review/tests
-> deploy
```

Suggested patch shape:

```text
{
  version: 1,
  scenarioId,
  geographyChanges: [...],
  poiChanges: [...],
  cameraPresetChanges: [...],
  styleChanges: [...]
}
```

Topology changes require a separate explicit patch category and stronger validation.

## Map validation

Map Studio / tests must detect:

- duplicate axial coordinates;
- orphan LandHex;
- disconnected Region topology;
- Region with no visual center;
- invalid POI Region/LandHex anchor;
- route endpoint missing;
- overlapping critical POIs at default camera;
- country/front boundary discontinuity;
- camera preset out of bounds;
- default camera world-content occupancy failure;
- mobile label collision / horizontal overflow;
- player country not visible at mobile start;
- decorative element implying unsupported gameplay state.

## Current P0 topology density

Do **not** increase LandHex count merely to make the map prettier during this targeted pass.

First solve:

- continuous geography;
- camera framing;
- boundary extraction;
- POI scale/density;
- LOD;
- HUD dominance.

After that, use the already-unlocked future density gate to benchmark logical LandHex counts such as 20 / 35 / 50+ for actual territorial gameplay. Any density increase changes authoritative territorial resolution and requires its own simulation/playability review.

## Required P0 acceptance markers

```text
MAP_ARCHITECTURE_LAYERING: PASS
MAP_STUDIO_FOUNDATION: YES_OR_EXACT_BLOCKER
CONTINUOUS_SHARED_TERRAIN_MESH: YES
NORMAL_INTERNAL_HEX_GRID_VISIBLE: NO
FACTION_TERRITORY_OUTER_BOUNDARY_ONLY: YES
FRONT_BOUNDARY_SEGMENTS_ONLY: YES
IDEOLOGY_BOARD_RING_DOMINANT: NO
MAP_VIEW_PRESETS: YES
MOBILE_DEFAULT_CAMERA_PLAYER_THEATER: YES
WORLD_CONTENT_OCCUPANCY_DESKTOP_WIDTH: >=75%
WORLD_CONTENT_OCCUPANCY_DESKTOP_HEIGHT: >=55%
WORLD_CONTENT_OCCUPANCY_MOBILE_WIDTH: >=88%
FIRST_MOBILE_VIEWPORT_WORLD_SHARE: >=60%
MAP_LOD_POLICY: IMPLEMENTED
POI_OBJECTS_READ_BEFORE_LABELS: YES
```

## Hard boundaries

- retain R3F;
- retain LandHex authority;
- no topology rewrite in this P0 pass;
- no runtime LLM requirement;
- no invented armies/cargo/person positions;
- no decorative feature that falsely signals gameplay mechanics;
- no direct Map Studio -> GitHub write path;
- no persistence V9;
- no Gate1F PASS;
- no V02.
