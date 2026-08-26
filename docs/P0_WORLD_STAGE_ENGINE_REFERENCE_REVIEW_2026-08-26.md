# P0 World Stage / Engine / Reference Review — 2026-08-26

Status: CHATGPT PRODUCT REVIEW — REWORK REQUIRED
Task: GAMEBUILDERS_PRODUCT_SURFACE_P0
Reviewed implementation branch: `gamebuilders-product-surface-p0`
Reviewed player evidence: mobile hands-on screenshots supplied 2026-08-26

## Verdict

The current P0 is technically meaningful but is **not accepted as the target game surface**.

```text
P0_PRODUCT_PASS: NO
P0_TECHNICAL_PROGRESS: YES
P0_WORLD_STAGE_REWORK: REQUIRED
GATE1F: NOT_READY
V02: NOT_STARTED
```

The persistent player experience still reads primarily as a responsive DOM/card application wrapped around a small flat political hex diagram. The correction is a world-stage, renderer, information-hierarchy and reference-application correction, not ordinary CSS polish.

## Core findings

1. `PoliticalAtlas.tsx` is flat SVG polygons/lines/circles/text. It correctly projects real owner/controller/ideology/routes/fronts/projects, but does not meet the GDD miniature-world direction: orthographic/near-orthographic 30–45° camera, terrain/object depth, settlement/POI hierarchy, visible activity, landmark construction and spatial event feedback.
2. `InstitutionalRoadmapPanel` is an `<article>` list with text edges, not an actual node graph. Player-facing screens leak `PREREQUISITE_NOT_MET`, `fixture.*` IDs and raw rule values.
3. State Projects are grounded in real Intervention lifecycles, but read as DOM cards/progress bars plus tiny `粮/산/헌` glyph rectangles rather than in-world landmarks.
4. GDD already says supporting values should not all be on the HUD, reports are detail, mobile uses minimal always-visible HUD, and world change should be noticed before reading. Current screenshots remain too quantified/explanatory.
5. The existing reference audit is provenance-safe but translates references into principles too weak to constrain implementation. Civilization/HOI4 references requested later are not part of the original audit matrix as concrete component acceptance contracts.
6. `GAMEBUILDERS_P0_RENDERER_SPIKE.md` did not run a real Pixi prototype; it deferred the candidate because dependencies were absent. Dependency absence is setup state, not renderer evidence.

## Engine recommendation

### Primary candidate: Three.js + React Three Fiber

Use React 19 + R3F v9 + Three.js, orthographic camera, instanced/extruded hex terrain, low-poly/sprite/billboard POIs, depth hierarchy and presentation-only animation. This matches the existing GDD Web Technology Policy and 2.5D miniature-world target.

### Candidate B: Phaser 4

Use only if the target is fundamentally 2D/isometric. Phaser provides cameras, sprites, tilemaps, tweens, particles, input and filters. It must be presentation-only; TMR simulation/time remains authoritative outside Phaser.

### Candidate C: PixiJS v8

Lightweight 2D/isometric renderer candidate. Good for sprites/routes/particles/patterns, but does not alone solve the true miniature 2.5D/world-model target.

Do not move simulation authority into any renderer/game framework.

## Renderer-neutral world model

```text
Authoritative WorldState / EventStore
-> PresentationState
-> WorldSceneModel
-> chosen renderer
```

Suggested `WorldSceneModel` families:

```text
HexTileVisual
RegionSurfaceVisual
BorderVisual
RouteVisual
SettlementVisual
PoiVisual
InstitutionVisual
StateProjectVisual
FactionPresenceVisual
ConflictVisual
FrontVisual
ActivityVisual
WorldFxVisual
```

Every visual object is classified as:

- `AUTHORITATIVE_PROJECTION`: direct state identity/value;
- `DERIVED_PRESENTATION`: deterministic visual derived from real state/event;
- `DECORATIVE_SUBSTRATE`: environment art that cannot be mistaken for simulation truth.

## What may move now

Allowed from current evidence:
- route traffic/pulse for active ContactGraph channels;
- ideology route pulse where source/target evidence exists;
- controller-change sweep;
- faction/uprising presence from actual faction/conflict/controller evidence;
- derived front emphasis;
- State Project implementation/completion states;
- static settlement/capital/POI world objects from authored metadata;
- border close/open feedback;
- crisis effects tied to factual conflict/event evidence.

Do not invent:
- exact army formations/positions without a military-location domain;
- exact cargo trucks without logistics state;
- fake tactical battles;
- fake project timers;
- decorative units that imply authoritative population/army simulation.

## Information hierarchy

### Default world
Visual first: territory, controller, ideology, conflict, routes/activity, projects, institutional direction, 1–2 alerts.

### Compact decisions
Qualitative/relative cues first: cost low/medium/high, immediate/short/medium, target actors/regions, directional effects, prerequisites.

### Details on demand
Exact values, formulas, EventIds, raw rule mutations, fixture IDs and technical diagnostics.

## Reference traceability requirement

A reference counts as applied only when all five exist:

```text
1. observed interaction/visual principle
2. TMR-specific adaptation
3. exact component/screen/layer target
4. forbidden copy/authority transfer
5. screenshot/hands-on acceptance test
```

Examples to add:

- Plague Inc / Rebel Inc: persistent living map and spatial time-flow feedback.
- Civilization VI Technology/Civics tree: actual connected graph readability and reachable future choices; no research-point authority transfer.
- HOI4 national focus tree: branch/path readability and authored visual hierarchy; no scripted historical-path authority transfer.
- Against the Storm: upgrades/projects visibly changing world/settlement.
- CK/Paradox geography: polity/territorial identity.

## Role-specific methodology

### Planner / game designer
Every feature must answer: what does player SEE change, where, what real state caused it, and what decision becomes possible next?

### Developer
Own simulation/presentation separation, `WorldSceneModel`, real engine spikes, instancing/LOD, mobile input/performance, and removal of raw debug IDs from production player copy.

### UX/visual designer
Own 2.5D silhouette, layer hierarchy, 2-second gaze order, icon/object family, owner/controller/ideology separation, node-graph readability, landmark lifecycle, and removal of card/dashboard grammar.

### QC
Do not accept a feature because data attributes exist. Require Day 0/intermediate/late screenshots, rebellion location <3 sec, lost territory visible without text, completed project visible without drawer, enacted institutional direction readable without raw IDs, no admin-dashboard look, no debug leakage, mobile performance proof, and reference-traceability acceptance.

## Acceptance target

```text
WORLD_RENDERER_REAL_SPIKE: PASS
WORLD_RENDERER_DECISION: EVIDENCE_BASED
2_5D_OR_ISOMETRIC_WORLD_STAGE: YES
HEX_TERRAIN_READABLE: YES
SETTLEMENT_POI_WORLD_OBJECTS: YES
ROUTE_ACTIVITY_VISIBLE: YES
REBELLION_CONFLICT_SPATIAL_ACTIVITY_VISIBLE: YES
STATE_PROJECTS_READ_AS_WORLD_OBJECTS: YES
INSTITUTIONAL_ROADMAP_IS_NODE_GRAPH: YES
RAW_INTERNAL_IDS_ON_PLAYER_SURFACE: NO
DEFAULT_EXACT_NUMBER_TMI_DOMINATES: NO
REFERENCE_TRACEABILITY_MATRIX: PASS
MOBILE_WORLD_FIRST_VISUAL_QA: PASS
```

This review does not authorize Gate 1F PASS, V02, or a simulation-engine rewrite.
