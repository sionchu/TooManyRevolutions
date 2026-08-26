# TMR Bridge State

UPDATED: 2026-08-26
REPOSITORY: sionchu/TooManyRevolutions
CURRENT_GATE: Gate 1F / PAUSED_FOR_GAMEBUILDERS_P0_WORLD_STAGE_REWORK
GATE1F_CHATGPT_DECISION: NOT_READY
V02: NOT_STARTED
PERSISTENCE_ACCEPTED: SerializedSimulationSnapshotV8 / format version 8

## Accepted core progression

```text
F04: CLOSED / PASS
F05_FIX1..F05_FIX23: accepted core progression
GAMEBUILDERS_DEMO_SPRINT_01: TECHNICAL_PASS / ACCEPTED_AS_VERTICAL_SLICE
```

## Current P0 review state

```text
CURRENT_TASK_ID: GAMEBUILDERS_PRODUCT_SURFACE_P0
CURRENT_TASK_STATUS: REWORK_REQUIRED / AUTHORIZED
WORK_BRANCH: gamebuilders-product-surface-p0
REVIEWED_IMPLEMENTATION_HEAD: 267dd27a3cfae939e97d4c535a559f46f571a9a7
P0_TECHNICAL_PROGRESS: RETAIN
P0_PRODUCT_PASS: NO
P0_WORLD_STAGE_REWORK: REQUIRED
```

Review:
- `docs/P0_WORLD_STAGE_ENGINE_REFERENCE_REVIEW_2026-08-26.md`
- `docs/bridge/tasks/GAMEBUILDERS_PRODUCT_SURFACE_P0_WORLD_STAGE_ENGINE_REFERENCE_REWORK_ADDENDUM.md`

## Why product acceptance was rejected

The deployed implementation proves real simulation change, but hands-on review and source inspection show:

- current world renderer is still flat React/SVG polygons/lines/circles/text;
- existing GDD calls for a strategic miniature world with orthographic/near-orthographic 30–45° camera and world objects;
- roadmap is a vertical card/list surface with textual edges, not an actual node graph;
- normal player UI leaks raw/debug terms such as `fixture.*`, `PREREQUISITE_NOT_MET` and raw rule values;
- State Projects are mechanically grounded but visually remain cards plus tiny glyph markers;
- default UI remains too quantified/explanatory relative to the GDD world-first/detail-on-demand contract;
- external references were recorded as broad principles but not enforced through component-level screenshot/hands-on acceptance;
- prior Pixi record was not a real installed/runtime renderer spike.

## Preserved completed work

Do not reimplement from scratch without regression evidence:

- ActionProposal carry;
- ideology diffusion runtime;
- LandHex controller truth;
- active Conflict presentation;
- real Policy/Intervention action paths;
- ChronicleDigest kernel;
- Content Registry / Content Studio;
- state-project lifecycle derivation;
- WorldVisualDelta derivation;
- V8 persistence/replay boundary.

## Required rework sequence

```text
reference traceability matrix
-> real engine benchmark
   Three.js/R3F
   vs Phaser4 or PixiJS8
-> evidence-based production renderer decision
-> renderer-neutral WorldSceneModel
-> 2.5D/isometric world stage
-> real spatial Roadmap node graph
-> in-world State Project landmarks
-> numeric/TMI/debug leakage cleanup
-> mobile world-first QC
-> Sites redeploy
```

## Architecture invariant

```text
TMR TypeScript simulation/action/time = authoritative
renderer = presentation consumer
no second authoritative clock
no direct renderer mutation of WorldState
```

## Current required markers

```text
REFERENCE_TRACEABILITY_MATRIX: REQUIRED
THREE_R3F_SPIKE: REQUIRED
SECOND_RENDERER_SPIKE: REQUIRED
WORLD_RENDERER_DECISION: REQUIRED
WORLD_SCENE_MODEL: REQUIRED
2_5D_OR_ISOMETRIC_WORLD_STAGE: REQUIRED
HEX_TERRAIN_READABLE: REQUIRED
SETTLEMENT_POI_WORLD_OBJECTS: REQUIRED
ROUTE_ACTIVITY_VISIBLE: REQUIRED
REBELLION_CONFLICT_SPATIAL_ACTIVITY_VISIBLE: REQUIRED
STATE_PROJECTS_READ_AS_WORLD_OBJECTS: REQUIRED
INSTITUTIONAL_ROADMAP_IS_NODE_GRAPH: REQUIRED
RAW_INTERNAL_IDS_ON_PLAYER_SURFACE: MUST_BE_NO
DEFAULT_EXACT_NUMBER_TMI_DOMINATES: MUST_BE_NO
MOBILE_WORLD_FIRST_VISUAL_QA: REQUIRED
```

## Deferred / forbidden

- no simulation rewrite;
- no invented army/front/logistics facts;
- no generic research/political mana;
- no scripted focus-tree authority;
- no persistence V9 without separate authorization;
- Gate1F remains NOT_READY;
- V02 remains NOT_STARTED;
- no successor self-authorization.
