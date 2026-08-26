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
F05_FIX1..F05_FIX24: accepted core progression
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
P0_WORLD_STAGE_REWORK: COMPLETE / AWAITING PRODUCT REVIEW
```

## Current rework evidence

```text
REFERENCE_TRACEABILITY_MATRIX: PASS
THREE_R3F_SPIKE: PASS
SECOND_RENDERER_SPIKE: PASS
WORLD_RENDERER_DECISION: THREE_R3F
WORLD_RENDERER_DECISION_EVIDENCE: PRESENT
WORLD_SCENE_MODEL: YES
2_5D_OR_ISOMETRIC_WORLD_STAGE: YES
HEX_TERRAIN_READABLE: YES
SETTLEMENT_POI_WORLD_OBJECTS: YES
ROUTE_ACTIVITY_VISIBLE: YES
REBELLION_CONFLICT_SPATIAL_ACTIVITY_VISIBLE: YES
STATE_PROJECTS_READ_AS_WORLD_OBJECTS: YES
INSTITUTIONAL_ROADMAP_IS_NODE_GRAPH: YES
RAW_INTERNAL_IDS_ON_PLAYER_SURFACE: NO
DEFAULT_EXACT_NUMBER_TMI_DOMINATES: NO
MOBILE_WORLD_FIRST_VISUAL_QA: PASS
SITES_REDEPLOYED: YES
```

The implementation and deployed source checkpoint is
`31180d977e75e4646332678c36812abc30a3a7fd`. The public Site version 20 was
tested from that exact production code commit. The result document contains
the benchmark measurements, long-horizon checkpoints, verification status,
and deployment hashes.

## Preserved authority and boundaries

- existing TypeScript simulation/action/time and EventStore remain
  authoritative;
- presentation uses `WorldSceneModel -> PoliticalWorldStage` and does not
  write WorldState or create a second clock;
- `SerializedSimulationSnapshotV8` remains the persistence boundary;
- no simulation rewrite, invented army/front/cargo fact, generic political
  currency, persistence V9, Gate 1F PASS, V02, or successor self-authorization.

The full test runner collected 80 files / 598 passing assertions but exited 1
after four Vitest worker `onTaskUpdate` timeouts. This remains recorded as
`ASSERTIONS_PASS / RUNNER_EXIT_FAIL`, not as a hidden pass.
