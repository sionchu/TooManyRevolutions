# TMR Current Bridge Task

TASK_ID: GAMEBUILDERS_PRODUCT_SURFACE_P0
STATUS: TARGETED_MAP_REWORK_REQUIRED / AUTHORIZED
WORK_BRANCH: gamebuilders-product-surface-p0
REVIEWED_BRANCH_HEAD: f6c3c2bbb03a516d081b859c01838a447d3caacc
REVIEWED_DEPLOYED_SOURCE: 9befdf7aaee6eafe75a4601369a2624691a4a189
PRODUCT_REVIEW: docs/P0_CONTINUOUS_WORLD_PRODUCT_REVIEW_2026-08-26.md
MAP_ARCHITECTURE_ADDENDUM: docs/bridge/tasks/GAMEBUILDERS_PRODUCT_SURFACE_P0_MAP_WORLD_ARCHITECTURE_AND_AUTHORING_ADDENDUM.md
MAP_VISUAL_SYSTEM_ADDENDUM: docs/bridge/tasks/GAMEBUILDERS_PRODUCT_SURFACE_P0_MAP_VISUAL_SYSTEM_ART_DIRECTION_ADDENDUM.md
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
PRIMARY_BLOCKER: MAP_ARCHITECTURE + VISUAL_SYSTEM + GEOGRAPHY + CAMERA + LOD + HUD
GATE1F: NOT_READY
V02: NOT_STARTED
```

Do not reopen Content Studio architecture, renderer selection, simulation authority, or persistence.

## Why the current map still fails product review

Hands-on desktop/mobile review found:

1. the world-stage container is large, but the actual world content is a small cluster surrounded by empty background;
2. current terrain is still visually derived from logical Hex patches rather than authored geographic masses;
3. rebellion/controller changes still trend toward repeated cell outlines/flags instead of one readable occupied area/front;
4. authored POIs exist but the capital, industrial region, frontier and route corridors do not yet read as distinct spatial compositions without labels;
5. primitive blockout geometry, flat materials and weak grounding make buildings/POIs look like editor props rather than one world;
6. object scale hierarchy is weak: trees, mountains, cities, forts, flags and route glyphs compete at similar visual weight;
7. labels are too numerous and overlap spatial objects instead of following LOD/priority/collision rules;
8. camera fit is still based too much on showing the whole bounded dataset rather than composing a useful strategic theater;
9. mobile still keeps too much HUD/control surface above the world;
10. current map authoring is not yet a true visual-composition workflow.

The key distinction is:

```text
DATA LAYERING != VISUAL HIERARCHY
```

Reference interpretation:

```text
RTK / Civilization -> topology is hidden under authored geography, settlements, chokepoints and infrastructure
HOI4               -> one geographic base supports political/front/logistics layers by zoom/map mode
Plague/Rebel Inc   -> geography is the persistent playfield; hotspots/routes are immediately readable
TMR                -> restrained 2.5D political atlas where LandHex remains hidden authority
```

## Mandatory execution order

Read:

1. root `AGENTS.md`
2. `docs/GDD.md`
3. `docs/ARCHITECTURE.md`
4. `docs/QA_PLAYTEST.md`
5. `docs/P0_CONTINUOUS_WORLD_PRODUCT_REVIEW_2026-08-26.md`
6. `docs/bridge/tasks/GAMEBUILDERS_PRODUCT_SURFACE_P0_MAP_WORLD_ARCHITECTURE_AND_AUTHORING_ADDENDUM.md`
7. `docs/bridge/tasks/GAMEBUILDERS_PRODUCT_SURFACE_P0_MAP_VISUAL_SYSTEM_ART_DIRECTION_ADDENDUM.md`
8. current semantic-world/content addenda as preserved constraints

Then perform one coherent targeted map pass. Do not separately polish the old per-Hex rendering.

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

## Required map architecture outcomes

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
MAP_LOD_POLICY: IMPLEMENTED
```

## Required visual-system outcomes

```text
MAP_VISUAL_SYSTEM: PASS
MACRO_MESO_MICRO_HIERARCHY: PASS
AUTHORED_GEOGRAPHY_COMPOSITION: PASS
PRIMITIVE_BLOCKOUT_LOOK_DOMINANT: NO
REGION_COMPOSITION_READABLE_WITHOUT_LABELS: YES
OBJECT_SCALE_HIERARCHY: PASS
MATERIAL_LIGHTING_GROUNDING: PASS
LABEL_COLLISION_POLICY: PASS
DEFAULT_CAMERA_EMPTY_SPACE_DOMINANT: NO
REBELLION_REPEATED_CELL_ICON_CLUTTER: NO
MOBILE_GAME_MAP_FIRST_IMPRESSION: PASS
```

Visual target is a restrained grand-strategy political atlas / 2.5D miniature world. Primitive box/cone/cylinder assets are blockout only and do not qualify for product-art PASS.

## Required occupancy / HUD outcomes

```text
WORLD_CONTENT_OCCUPANCY_DESKTOP_WIDTH: >=75%
WORLD_CONTENT_OCCUPANCY_DESKTOP_HEIGHT: >=55%
WORLD_CONTENT_OCCUPANCY_MOBILE_WIDTH: >=88%
FIRST_MOBILE_VIEWPORT_WORLD_SHARE: >=60%
PERSISTENT_MOBILE_STATUS_CUES: <=3
POI_OBJECTS_READ_BEFORE_LABELS: YES
```

## Required visual evidence

From the exact deployed source commit:

- desktop Day 0 with world-content occupancy measurement;
- labels-hidden screenshot proving capital/industrial/frontier compositions remain recognisable;
- mobile default player-theater camera;
- selected single Hex contextual outline;
- rebellion showing merged occupied area/front rather than repeated cell grid/flag clutter;
- ideology surface treatment;
- project implementing/completed;
- late state;
- Map Studio geography/POI/camera/style view;
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
- no copied commercial assets;
- no persistence V9;
- no Gate1F PASS;
- no V02;
- no successor self-authorization.

Stop after implementation/testing/deployment/result update. ChatGPT performs final product review.