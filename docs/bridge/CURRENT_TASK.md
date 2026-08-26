# TMR Current Bridge Task

TASK_ID: GAMEBUILDERS_PRODUCT_SURFACE_P0
STATUS: TARGETED_MAP_REWORK_REQUIRED / AUTHORIZED
WORK_BRANCH: gamebuilders-product-surface-p0
REVIEWED_BRANCH_HEAD: f6c3c2bbb03a516d081b859c01838a447d3caacc
REVIEWED_DEPLOYED_SOURCE: 9befdf7aaee6eafe75a4601369a2624691a4a189
PRODUCT_REVIEW: docs/P0_CONTINUOUS_WORLD_PRODUCT_REVIEW_2026-08-26.md
MAP_ARCHITECTURE_ADDENDUM: docs/bridge/tasks/GAMEBUILDERS_PRODUCT_SURFACE_P0_MAP_WORLD_ARCHITECTURE_AND_AUTHORING_ADDENDUM.md
SEMANTIC_WORLD_ADDENDUM: docs/bridge/tasks/GAMEBUILDERS_PRODUCT_SURFACE_P0_SEMANTIC_WORLD_OBJECT_ART_REWORK_ADDENDUM.md
CONTENT_TERRAIN_ADDENDUM: docs/bridge/tasks/GAMEBUILDERS_PRODUCT_SURFACE_P0_CONTINUOUS_TERRAIN_AND_CONTENT_AUTHORING_ADDENDUM.md
RESULT_PATH: docs/bridge/results/GAMEBUILDERS_PRODUCT_SURFACE_P0_RESULT.md

## ChatGPT gate decision

The latest implementation closes the content-authoring architecture but does not pass the map/world product gate.

```text
TITLE_BRIEFING_CONTENT_AUTHORING_PIPELINE: PASS / RETAIN
TITLE_BRIEFING_BASELINE_COPY: DRAFT / USER_EDIT_REQUIRED
R3F_PRODUCTION_RENDERER: PASS / RETAIN
WORLD_SCENE_MODEL: PASS / RETAIN
AUTHORED_POI_AND_SEMANTIC_OBJECT_KERNEL: PASS / RETAIN
P0_MAP_PRODUCT_PASS: NO
PRIMARY_BLOCKER: MAP_HIERARCHY + GEOGRAPHY + CAMERA + LOD + HUD
GATE1F: NOT_READY
V02: NOT_STARTED
```

Do not reopen Content Studio architecture, renderer selection, simulation authority, or persistence.

## Why the current map still fails product review

Hands-on desktop/mobile review found:

1. the world-stage container is large, but the actual world content is a small cluster surrounded by empty olive space;
2. current `TerrainWorldSurface` is still generated one logical-hex triangle fan at a time and does not read as authored geography;
3. rebellion/controller changes re-expose many complete hex perimeters, restoring a board-game/token look;
4. ideology/influence rings remain too prominent as board markers rather than geography-embedded political influence;
5. authored POIs and project objects exist, but they are too small at the default camera to define the world;
6. mobile still full-fits too much theater and keeps too much HUD above the map;
7. map content is source-authored but not yet manageable through a dedicated map authoring workflow.

Reference interpretation is now:

```text
RTK XIV -> logical HEX under Area/City Region/City-Port-Gate hierarchy
HOI4    -> terrain base + political/front/logistics overlays + zoom/map-mode hierarchy
Plague/Rebel Inc -> persistent geography-first playfield + spatial hotspots/routes
TMR     -> LandHex remains authority but must become a hidden interaction substrate
```

## Mandatory execution order

Read:

1. root `AGENTS.md`
2. `docs/GDD.md`
3. `docs/ARCHITECTURE.md`
4. `docs/QA_PLAYTEST.md`
5. `docs/P0_CONTINUOUS_WORLD_PRODUCT_REVIEW_2026-08-26.md`
6. `docs/bridge/tasks/GAMEBUILDERS_PRODUCT_SURFACE_P0_MAP_WORLD_ARCHITECTURE_AND_AUTHORING_ADDENDUM.md`
7. current semantic-world/content addenda as preserved constraints

Then perform only the targeted map pass.

## Preserve completed work

- TypeScript simulation/action/time authority;
- LandHex logical/topological authority;
- V8 persistence/replay;
- R3F production renderer;
- renderer-neutral `WorldSceneModel`;
- Content Registry / Content Studio / JSON patch workflow;
- title/briefing stable-ID runtime resolution;
- authored POI/institution metadata;
- state-project semantic object families;
- ChronicleDigest;
- real route/contact state;
- controller/Conflict/front truth;
- Institutional Roadmap graph kernel.

## Current implementation targets

### 1. Continuous geography

Stop using one visible independent hex fan as the primary terrain concept. Build shared/snap-keyed adjacent terrain vertices into one or a small number of continuous triangulated meshes. Logical LandHex hit areas remain separate and invisible.

### 2. Political boundary extraction

```text
same owner/controller across adjacent cells -> no internal edge
different owner/controller -> boundary segment
faction-controlled cells -> merged territory surface / outer perimeter
front -> controller-difference boundary segments only
selected/target cell -> full hex outline allowed
```

Do not show every rebel/controller hex as a complete outlined token.

### 3. Ideology on geography

Replace dominant torus/ring markers with Region surface tint/pattern/decal/gradient/noise treatment. Rings are allowed only as temporary selection/focus cues.

### 4. Camera / occupancy

Desktop whole-theater fit is allowed only when actual world content fills the stage. Mobile portrait defaults to player-country core + immediate border context, with `전체 보기` as an explicit global-fit action.

### 5. Map LOD

```text
far    -> geography, polity labels, capitals, major crisis
medium -> Region identity, POIs, routes, projects, controller/front
near   -> selected LandHex, minor POIs, fine activity/detail
```

Do not render all labels/objects at every zoom.

### 6. Mobile HUD reduction

Persistent mobile map screen:

- compact country/date;
- play/pause/speed;
- at most 2–3 high-value qualitative status cues;
- one urgent alert if needed.

Move exact values, `+1/+7/+30`, sound/title return, auto-pause explanation and secondary state to drawers/settings/details.

### 7. Map Studio foundation

Create development-only `?mapStudio=1` for map authoring/management.

Required modes:

- topology inspect (read-only in P0);
- geography/terrain authoring;
- POI/institution placement;
- political snapshot preview;
- camera preset editing;
- Day0/rebellion/project/late snapshot preview;
- validation;
- MapPatch v1 JSON import/export.

No direct Map Studio -> GitHub write path.

## Map architecture

```text
MapTopologyDefinition  [authoritative]
-> MapGeographyDefinition [authored presentation + truth-linked geography]
-> MapSemanticContent     [authored POI/institutions]
-> MapPoliticalProjection [runtime derived]
-> MapActivityProjection  [runtime derived]
-> MapViewPreset          [presentation]
-> MapStyleDefinition     [presentation]
-> R3F
```

Every visual item must remain classifiable as:

```text
AUTHORITATIVE_PROJECTION
DERIVED_PRESENTATION
DECORATIVE_SUBSTRATE
```

## Acceptance markers

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
PERSISTENT_MOBILE_STATUS_CUES: <=3
MAP_LOD_POLICY: IMPLEMENTED
POI_OBJECTS_READ_BEFORE_LABELS: YES
TITLE_BRIEFING_CONTENT_AUTHORING_PIPELINE: RETAINED
P0_PRODUCT_PASS: NOT_SELF_DECLARED
GATE1F: NOT_READY
V02: NOT_STARTED
```

## Required visual evidence

From the exact deployed source commit:

- desktop Day 0 with world-content occupancy measurement;
- mobile default player-theater camera;
- selected single hex contextual outline;
- rebellion showing merged occupied area/front rather than full-cell grid;
- ideology surface treatment without dominant rings;
- project implementing/completed;
- late state;
- Map Studio geography/POI/camera view;
- 390×844 first viewport showing >=60% world share.

## Hard boundaries

- no renderer migration;
- no LandHex/topology rewrite in this P0 map pass;
- no LandHex-count increase merely for decoration;
- no runtime LLM dependency;
- no direct Map Studio or Content Studio GitHub write;
- no invented army/cargo/person positions;
- no decorative element that falsely implies unsupported mechanics;
- no fake project lifecycle;
- no generic research/political mana;
- no persistence V9;
- no Gate1F PASS;
- no V02;
- no successor self-authorization.

Stop after implementation/testing/deployment/result update. ChatGPT performs final product review.