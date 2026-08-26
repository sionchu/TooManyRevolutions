# GAMEBUILDERS_PRODUCT_SURFACE_P0 — World Stage / Engine / Reference Rework Addendum

Date: 2026-08-26
Task: `GAMEBUILDERS_PRODUCT_SURFACE_P0`
Status: AUTHORIZED REWORK ADDENDUM
Review basis: `docs/P0_WORLD_STAGE_ENGINE_REFERENCE_REVIEW_2026-08-26.md`

## 0. Gate decision

The prior P0 result is **not product-accepted**.

```text
P0_PRODUCT_REVIEW: REWORK_REQUIRED
TECHNICAL_PROGRESS: RETAIN
WORLD_STAGE: REBUILD_REQUIRED
GATE1F: NOT_READY
V02: NOT_STARTED
```

Do not throw away working simulation/replay/gameplay-reality work. Replace the player-facing world-stage implementation where needed.

## 1. Mission

Turn the current flat SVG/card-heavy prototype into a real map-first strategy-game surface while preserving TMR simulation authority.

Target experience:

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

## 2. Mandatory first checkpoint — reference traceability

Before production UI work, update `docs/GAMEBUILDERS_P0_REFERENCE_AUDIT.md` or create a successor matrix that includes at least:

- Plague Inc;
- Rebel Inc;
- Civilization VI Technology/Civics tree;
- Hearts of Iron IV focus-tree visual/branch grammar;
- Against the Storm world-upgrade feedback;
- CK-style political geography;
- current TMR screenshots as negative baseline.

Each row must contain:

```text
observed principle
-> TMR adaptation
-> exact component/layer
-> forbidden copied authority/assets
-> measurable hands-on acceptance
```

A sentence such as `keep map visible` is insufficient.

## 3. Mandatory real renderer benchmark

The previous `Pixi deferred because dependency absent` record does not count as a real spike.

Build bounded render prototypes using the same frozen presentation snapshot.

### Candidate A — Three.js + React Three Fiber

Required proof:
- React 19-compatible R3F version;
- orthographic camera;
- 30–45° miniature-world angle;
- hex terrain with visible depth;
- 3+ object families such as capital/settlement/project/faction-presence;
- one route activity animation;
- one factual controller/conflict visual change;
- touch pan/zoom on mobile;
- build through current Vite/Sites path.

### Candidate B — Phaser 4 OR PixiJS v8

Choose one as the 2D/isometric competitor and implement equivalent minimal proof.

Do not use simulation state mutations in either prototype.

### Measure

Record:
- build success;
- bundle delta;
- 390×844 physical/mobile usability;
- 1440×900 usability;
- pan/zoom/touch behavior;
- rough FPS/frame stability during animated world delta;
- implementation complexity;
- ability to represent terrain depth, landmarks, routes and activity;
- accessibility/DOM overlay strategy;
- rollback cost.

Then choose one production renderer. Remove or isolate abandoned prototype code so there are not multiple divergent production renderers.

## 4. Required world scene model

Create a renderer-neutral derived `WorldSceneModel` (name may vary) between `PresentationState` and the chosen renderer.

It must preserve truth classes:

```text
AUTHORITATIVE_PROJECTION
DERIVED_PRESENTATION
DECORATIVE_SUBSTRATE
```

The renderer must not infer new simulation facts.

## 5. World-stage requirements

### Hex / terrain
- Hex remains a readable territorial substrate but should no longer read as a raw test strip.
- Use 2.5D/isometric depth, terrain surfaces, coast/mountain/forest/field/industrial treatment where authored/presentation metadata permits.
- Country border, legal owner, physical controller and ideology remain separable.

### Settlements / POI
Show actual authored capital/settlement/POI objects where metadata exists.

Examples:
- palace/capital;
- port;
- mine/industrial site;
- granary/distribution site;
- parliament/constitutional landmark;
- border fort/checkpoint if actual scenario metadata or state supports it.

### Routes / activity
Active real routes must have visible movement/pulse. Movement is a derived visualization of route activity, not simulated trucks/people.

### Uprising / conflict
A factual rebellion must be visible spatially through controller change, crisis/faction activity, derived front and/or grounded visual FX. Do not require the player to read a banner first.

### State Projects
Replace tiny text glyph project markers with distinct world objects whose implementation/completion lifecycle is readable from normal camera scale.

## 6. Institutional Roadmap visual reimplementation

Do not render the roadmap as a vertical stack of cards.

Required:
- actual node positions;
- actual connecting prerequisite/incompatibility edges;
- current/enacted path persistence;
- reachable / blocked / incompatible differentiation;
- pan/zoom or fit-to-tree when needed;
- concise Korean labels;
- no `fixture.*`, enum strings or `PREREQUISITE_NOT_MET` on normal player surface.

Civ/HOI4 are visual-navigation references only. TMR authority remains `PolicyDefinition + InstitutionalRuleState + actual feasibility`.

## 7. TMI / numeric information policy

Default map/HUD must not feel like a spreadsheet.

Hide by default:
- raw fixture IDs;
- raw enum values;
- exact source EventIds;
- exact prerequisite diagnostic codes;
- full rule mutation syntax;
- secondary simulation metrics;
- unnecessary cumulative counters.

Default player cues should favor visual/qualitative information. Exact values remain available through detail/WHY/debug views.

## 8. DOM/card grammar reduction

The persistent gameplay screenshot must not be dominated by bordered rectangular cards.

Target gaze order:

```text
1 WORLD
2 active spatial change
3 current objective / institution path
4 available decision cue
5 supporting numbers/details
```

Contextual drawers may contain cards when appropriate, but Roadmap and world must use game-native spatial layout.

## 9. Role-based signoff

### Planner signoff
- medium-term state-building loop clear;
- each visible object has a semantic role;
- reference matrix complete;
- exact player decisions and consequences traceable.

### Developer signoff
- simulation authority unchanged;
- one chosen production renderer;
- `WorldSceneModel` boundary;
- mobile build/performance proof;
- no internal IDs in player copy.

### Designer signoff
- world dominates thumbnail/blurred screenshot;
- 2.5D silhouette and object hierarchy work;
- terrain, objects, routes, conflict and projects form one coherent visual language;
- Roadmap is visually a graph, not cards.

### QC signoff
- Day 0/intermediate/late screenshot comparison;
- rebellion location identifiable in <3 seconds without text;
- lost/controlled territory identifiable;
- completed project identifiable without drawer;
- institution path identifiable without raw IDs;
- no dashboard/admin first impression on mobile;
- reference acceptance criteria checked one by one.

## 10. Required result markers

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

## 11. Hard boundaries

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
