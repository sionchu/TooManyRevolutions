# GAMEBUILDERS_PRODUCT_SURFACE_P0 — World Stage / Engine / Reference Rework Addendum

Date: 2026-08-26
Task: `GAMEBUILDERS_PRODUCT_SURFACE_P0`
Status: AUTHORIZED REWORK ADDENDUM
Review basis: `docs/P0_WORLD_STAGE_ENGINE_REFERENCE_REVIEW_2026-08-26.md`

## Gate decision

The prior P0 result is **not product-accepted**.

```text
P0_PRODUCT_REVIEW: REWORK_REQUIRED
TECHNICAL_PROGRESS: RETAIN
WORLD_STAGE: REBUILD_REQUIRED
GATE1F: NOT_READY
V02: NOT_STARTED
```

Do not throw away working simulation/replay/gameplay-reality work. Replace the player-facing world-stage implementation where needed.

## Mission

Turn the current flat SVG/card-heavy prototype into a real map-first strategy-game surface while preserving TMR simulation authority.

Target:

```text
2.5D / isometric miniature political world
+ readable hex territorial substrate
+ visible settlement/POI/project objects
+ factual route/activity movement
+ factual uprising/conflict/world feedback
+ actual visual institutional node graph
+ compact/qualitative HUD
+ exact numbers and diagnostics on demand
```

## Reference traceability first

Before production UI work, update `docs/GAMEBUILDERS_P0_REFERENCE_AUDIT.md` or create a successor matrix covering at least Plague Inc, Rebel Inc, Civilization VI Technology/Civics tree, Hearts of Iron IV focus-tree visual/branch grammar, Against the Storm world-upgrade feedback, CK-style geography and current TMR screenshots as negative baseline.

Each row must contain:

```text
observed principle
-> TMR adaptation
-> exact component/layer
-> forbidden copied authority/assets
-> measurable hands-on acceptance
```

`keep map visible` is not enough.

## Real renderer benchmark

The prior `Pixi deferred because dependency absent` record does not count as a real spike.

Build bounded prototypes from the same frozen presentation snapshot.

### Candidate A — Three.js + React Three Fiber

Required proof:
- React 19-compatible R3F;
- orthographic 30–45° camera;
- hex terrain with visible depth;
- 3+ object families such as capital/settlement/project/faction presence;
- one route activity animation;
- one factual controller/conflict visual change;
- touch pan/zoom at mobile size;
- build through the current Vite/Sites path.

### Candidate B — Phaser 4 OR PixiJS v8

Choose one as the 2D/isometric competitor and implement an equivalent minimal proof.

No prototype may mutate simulation state.

### Measure and choose

Record build success, bundle delta, 390×844 usability, 1440×900 usability, touch/camera behavior, rough frame stability, implementation complexity, terrain/landmark/route capability, DOM accessibility strategy and rollback cost.

Choose one production renderer. Isolate/remove abandoned prototype code so there are not divergent production renderers.

## Renderer-neutral WorldSceneModel

Create a derived layer:

```text
WorldState/EventStore -> PresentationState -> WorldSceneModel -> renderer
```

Visual truth classes:

```text
AUTHORITATIVE_PROJECTION
DERIVED_PRESENTATION
DECORATIVE_SUBSTRATE
```

No renderer inference of new simulation facts.

## World-stage requirements

- Hex remains a readable territorial substrate but must stop reading as a raw test strip.
- Use 2.5D/isometric depth and coherent terrain/world art.
- Legal owner, controller, ideology and derived front remain distinguishable.
- Show authored capital/settlement/POI objects where metadata supports them.
- Active real routes have visible derived movement/pulse.
- Factual rebellion/conflict becomes spatially obvious through control, activity, derived front and grounded FX.
- State Projects become distinct world objects with visible implementing/completed states; no tiny text-glyph substitute as final presentation.

Do not invent exact army positions, cargo, tactical battles or fake timers absent from state.

## Institutional Roadmap reimplementation

Do not render the roadmap as a vertical card stack.

Required:
- actual node positions;
- prerequisite/incompatibility connecting edges;
- current/enacted path persistence;
- reachable/blocked/incompatible visual states;
- fit/pan/zoom as needed;
- concise Korean labels;
- no `fixture.*`, `PREREQUISITE_NOT_MET` or raw enums in normal player UI.

Civ/HOI4 are visual-navigation references only. TMR authority remains PolicyDefinition + InstitutionalRuleState + real feasibility.

## TMI / numeric policy

Default map/HUD must not feel like a spreadsheet.

Hide by default raw IDs, enum values, EventIds, diagnostic codes, full rule mutation syntax, secondary metrics and unnecessary cumulative counters.

Default cues favor visual/qualitative information. Exact values remain available through details/WHY/debug.

## Reduce DOM/card grammar

Target gaze order:

```text
1 WORLD
2 active spatial change
3 objective / institution path
4 decision cue
5 supporting numbers/details
```

Drawers may use cards, but the world and Roadmap must be game-native spatial surfaces.

## Role signoff

Planner: state-building loop, semantic object rules and reference matrix.
Developer: authority separation, one renderer, WorldSceneModel, mobile performance, no debug leakage.
Designer: 2.5D silhouette/layer hierarchy, coherent object families, graph readability, no dashboard grammar.
QC: Day 0/intermediate/late screenshots; rebellion <3 sec; lost territory visible; completed project visible without drawer; institution path readable without IDs; mobile dashboard impression = NO; reference criteria checked individually.

## Required result markers

```text
P0_PRODUCT_REVIEW_REWORK: COMPLETE_OR_BLOCKED
REFERENCE_TRACEABILITY_MATRIX: PASS
THREE_R3F_SPIKE: PASS_OR_EXACT_RUNTIME_BLOCKER
SECOND_RENDERER_SPIKE: PASS_OR_EXACT_RUNTIME_BLOCKER
WORLD_RENDERER_DECISION: THREE_R3F | PHASER4 | PIXI8 | BLOCKED
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
MOBILE_WORLD_FIRST_VISUAL_QA: PASS_OR_BLOCKER
SITES_REDEPLOYED: YES_IF_PRODUCTION_CHANGED
GATE1F: NOT_READY
V02: NOT_STARTED
```

## Hard boundaries

- no simulation rewrite;
- no second authoritative game clock;
- no direct renderer mutation of WorldState;
- no invented armies/fronts/cargo/project completion;
- no focus-tree/story authority;
- no generic research/political mana;
- no persistence V9 unless separately authorized;
- no Gate1F PASS;
- no V02;
- no successor self-authorization.
