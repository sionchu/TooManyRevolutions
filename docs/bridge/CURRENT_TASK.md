# TMR Current Bridge Task

TASK_ID: GAMEBUILDERS_PRODUCT_SURFACE_P0
STATUS: TARGETED_REWORK_REQUIRED / AUTHORIZED
WORK_BRANCH: gamebuilders-product-surface-p0
REVIEWED_IMPLEMENTATION_HEAD: 5594fe17c02b281b7f51ba2e05578190aa21d3bd
ENGINE_REWORK_REVIEW: docs/P0_WORLD_STAGE_REWORK_CODE_REVIEW_2026-08-26.md
CURRENT_REWORK_ADDENDUM: docs/bridge/tasks/GAMEBUILDERS_PRODUCT_SURFACE_P0_SEMANTIC_WORLD_OBJECT_ART_REWORK_ADDENDUM.md
PREVIOUS_ENGINE_REWORK_ADDENDUM: docs/bridge/tasks/GAMEBUILDERS_PRODUCT_SURFACE_P0_WORLD_STAGE_ENGINE_REFERENCE_REWORK_ADDENDUM.md
RESULT_PATH: docs/bridge/results/GAMEBUILDERS_PRODUCT_SURFACE_P0_RESULT.md

## ChatGPT gate decision

The R3F/WorldSceneModel rework is accepted as an engineering/architecture checkpoint. P0 product visual acceptance is still withheld.

```text
REAL_RENDERER_BENCHMARK: PASS
THREE_R3F_PRODUCTION_RENDERER: PASS
WORLD_SCENE_MODEL: PASS
INSTITUTIONAL_ROADMAP_GRAPH_KERNEL: PASS
QUALITATIVE_HUD_DIRECTION: PASS
REFERENCE_TRACEABILITY_METHOD: PASS
P0_PRODUCT_VISUAL_PASS: NO
NEXT_REWORK: SEMANTIC_WORLD_OBJECT_AND_ART_READABILITY
GATE1F: NOT_READY
V02: NOT_STARTED
```

Do not reopen engine selection or replace R3F unless a demonstrated regression blocker exists.

## Why targeted rework remains

Repository inspection of the accepted R3F checkpoint found:

1. `ProjectLandmark` receives `food | civic | industrial` but renders the same generic geometry for every project kind;
2. capital/terrain proof exists, but settlement/POI identity is still too sparse for the GDD miniature-world promise;
3. faction/conflict presentation is spatially grounded but still dominated by rings/spheres/lines rather than recognisable symbolic world objects;
4. active route pulse proves motion, but route channel families are not yet strongly distinguishable;
5. fresh post-rework visual evidence has not yet been independently accepted by ChatGPT.

The next pass is an object-language/art-readability pass on the accepted architecture, not another engine migration.

## Mandatory execution

Read in this order:

1. root `AGENTS.md`
2. `docs/GDD.md`
3. `docs/ARCHITECTURE.md`
4. `docs/QA_PLAYTEST.md`
5. `docs/P0_WORLD_STAGE_REWORK_CODE_REVIEW_2026-08-26.md`
6. `docs/bridge/tasks/GAMEBUILDERS_PRODUCT_SURFACE_P0_SEMANTIC_WORLD_OBJECT_ART_REWORK_ADDENDUM.md`
7. previous P0 task/addenda only as preserved constraints where not superseded

Then implement only the targeted rework.

## Preserve completed work

Keep unless regression evidence proves otherwise:

- accepted TypeScript simulation/action/time authority;
- V8 persistence/replay;
- gameplay-reality fixes;
- ChronicleDigest and Content Studio kernels;
- R3F + Three production renderer;
- renderer-neutral `WorldSceneModel`;
- Pixi comparison benchmark as historical evidence only;
- current Institutional Roadmap node/edge graph kernel;
- qualitative default metric direction;
- state-project lifecycle derivation;
- WorldVisualDelta derivation.

## Required result markers

```text
SEMANTIC_WORLD_OBJECT_REWORK: COMPLETE_OR_BLOCKED
R3F_PRODUCTION_RENDERER_RETAINED: YES
WORLD_SCENE_MODEL_RETAINED: YES
FOOD_CIVIC_INDUSTRIAL_SILHOUETTES_DISTINCT: YES
AUTHORED_POI_FAMILIES_RECOGNISABLE: YES
REBELLION_LOCATABLE_WITHOUT_TEXT_IN_3S: YES
CONTROLLER_CHANGE_VISIBLE_WITHOUT_CHRONICLE: YES
ROUTE_CHANNELS_VISUALLY_DISTINCT: YES
DAY0_LATE_WORLD_VISUALLY_DIFFERENT: YES
ROADMAP_BRANCHES_READABLE_AT_GLANCE: YES
DEFAULT_HUD_DOMINATES_GAZE: NO
RAW_DEBUG_TMI_LEAKAGE: NO
MOBILE_WORLD_FIRST: PASS
SITES_REDEPLOYED: YES_IF_PRODUCTION_CHANGED
P0_PRODUCT_PASS: NOT_SELF_DECLARED
GATE1F: NOT_READY
V02: NOT_STARTED
```

## Required visual evidence

Capture from the exact deployed source commit:

- Day 0 world;
- first rebellion/territorial change;
- project implementing;
- project completed;
- late-state world;
- Institutional Roadmap;
- 390×844 mobile world-first screen.

Automated tests alone cannot close this task.

## Hard boundaries

- no simulation rewrite;
- no renderer migration without demonstrated blocker;
- no exact army/cargo/person locations absent from state;
- no new tactical/unit simulation just for decoration;
- no fake project progress/completion;
- no generic research/reform/political mana;
- no scripted historical focus authority;
- no direct renderer mutation of WorldState;
- no persistence V9;
- no Gate1F PASS;
- no V02;
- no successor self-authorization.

Stop after implementing/testing/deploying this targeted rework and updating the result. ChatGPT performs the final product review.