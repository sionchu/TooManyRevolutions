# P0 World Stage / Engine / Reference Review — 2026-08-26

Status: CHATGPT PRODUCT REVIEW — REWORK REQUIRED
Task: GAMEBUILDERS_PRODUCT_SURFACE_P0
Reviewed implementation branch: `gamebuilders-product-surface-p0`
Reviewed player evidence: mobile hands-on screenshots supplied 2026-08-26

## 0. Verdict

The current P0 is technically meaningful but is **not accepted as the target game surface**.

The implementation successfully added factual state changes, ChronicleDigest, policy execution, an institutional data projection, state-project lifecycle projections and a Content Studio. However the persistent player experience still reads primarily as a responsive DOM/card application wrapped around a small flat political hex diagram.

The next correction is not ordinary CSS polish. It is a **world-stage, renderer, interaction-grammar and reference-application correction**.

```text
P0_PRODUCT_PASS: NO
P0_TECHNICAL_PROGRESS: YES
P0_WORLD_STAGE_REWORK: REQUIRED
GATE1F: NOT_READY
V02: NOT_STARTED
```

## 1. Review evidence — current map is a diagram, not yet the game board

Current `PoliticalAtlas.tsx` is an SVG scene built from flat polygons, lines, circles, text and image marks. It correctly separates:

- legal owner;
- current LandHex controller;
- Region ideology overlay;
- ContactGraph routes;
- derived fronts;
- pressure circles;
- organization tokens;
- capitals;
- project markers.

That is good presentation truth, but the player-facing result remains visually diagrammatic.

The current map still lacks the miniature-world reading already described in `docs/GDD.md`:

- orthographic / near-orthographic 30–45° camera;
- terrain/object depth;
- settlement/POI silhouette hierarchy;
- visible trade/logistics activity;
- uprising/protest/conflict activity as spatial world feedback;
- buildings/projects that read as actual constructed places;
- state evolution that is visible before opening a drawer.

The GDD explicitly defines the main map as a strategic miniature world and names troops, refugee streams, protests, market traffic, barricades, state institutions and related spatial signals as examples. The current flat SVG result therefore satisfies data-layer correctness but not the intended visual/gameplay contract.

## 2. Institutional Roadmap implementation is not yet a roadmap UX

The current `InstitutionalRoadmapPanel` renders each policy as an `<article>` and renders edges as text spans such as:

```text
선행 · fixture.abolish-royal-veto -> fixture.universal-suffrage
충돌 · fixture.aristocratic-suffrage -> fixture.universal-suffrage
```

This is a data listing, not a visual node graph comparable in readability to the Technology/Civics tree patterns being referenced.

Player screenshots also expose internal/debug strings such as:

- `PREREQUISITE_NOT_MET`;
- `fixture.*` IDs;
- raw rule mutation values such as `false`, `true`, `universal`.

These are QC failures for player-facing presentation.

Required correction:

```text
policy graph data
-> actual 2D node/edge layout
-> semantic grouping/lanes
-> enacted-path persistence
-> available / blocked / incompatible visual states
-> concise Korean player copy
-> technical IDs only in developer inspection
```

The node graph may borrow structural readability from Civilization technology/civics trees or HOI4-style focus-tree layout, but it must not import their research/focus authority model.

## 3. State Projects are mechanically grounded but visually too abstract

Current State Projects correctly use existing Intervention lifecycles. This contract should be kept.

However the presentation remains:

- DOM project cards;
- progress bars;
- small map glyphs using `粮`, `산`, `헌` inside a rectangle.

This does not yet deliver the intended `I built this` / landmark / wonder-like world feedback.

Required correction:

- each approved project gets a real map/world object family;
- `not started -> implementing -> complete` gets distinct visual states;
- completed project remains in-world;
- visual scale/silhouette must be legible at normal camera distance;
- map object must be anchored to actual Region/capital/POI metadata;
- visual object never becomes a second authoritative project system.

## 4. Numbers and explanatory TMI are overexposed

The GDD already says supporting values do not all belong on the HUD, reports are optional detail, mobile should have minimal always-visible HUD, and the desired sequence is:

```text
world changes -> player notices -> clicks only if curious
```

Current screenshots still foreground many dashboard-like facts and explanations:

- `12/12` control counters;
- active conflict counts;
- raw national metrics;
- factual pressure values in drawers;
- cost/duration/effect chips on many choices;
- long explanatory blocks;
- raw internal roadmap diagnostics.

The problem is not that the simulation has numbers. The problem is that the **default surface reads like a quantified administration app**.

Required information hierarchy:

### Layer 0 — default world

Show through visuals first:

- territory/controller;
- ideology influence;
- conflict/uprising;
- routes/activity;
- constructed state projects;
- current institutional direction;
- one or two urgent alerts.

### Layer 1 — compact decision cues

Use small qualitative/relative cues:

- 비용 낮음/중간/높음;
- 즉시/단기/중기;
- 대상 faction/region icons;
- likely directional effects where supported;
- prerequisite state.

Do not expose exact formulas by default.

### Layer 2 — details on demand

Exact values, source EventIds, rule mutations, debug IDs and derived calculations belong in details/WHY/developer inspection.

## 5. Reference process failed at the translation step

The repository reference audit is useful for provenance, but its application contract is too weak.

Examples:

```text
Plague Inc -> 'keep the political atlas visible'
Rebel Inc -> 'select a region and open contextual drawers'
CK3 -> 'show neighboring polity labels'
```

These statements are too abstract to force a game-like result.

Also the existing audit does not include the later-requested Civilization tree and HOI4 focus-tree references as concrete UX reference rows.

A reference is considered **applied** only when all five are present:

```text
1. observed interaction/visual principle
2. TMR-specific adaptation
3. exact component/screen/layer target
4. forbidden copy/authority transfer
5. screenshot/hands-on acceptance test
```

Example:

```text
Reference: Civilization VI Technology/Civics tree
Observed: connected node graph shows current research and future reachable choices
TMR adaptation: PolicyDefinition prerequisites/incompatibilities become spatial node edges
Target: InstitutionalRoadmap world/drawer surface
Do not copy: research points, era progression, tech unlock authority, assets/UI art
Acceptance: player can identify current enacted path and two reachable/blocked future branches in <5 seconds without reading raw IDs
```

## 6. Renderer re-review

### Current SVG conclusion is not accepted as an adequate engine spike

`docs/GAMEBUILDERS_P0_RENDERER_SPIKE.md` records:

```text
PIXI candidate deferred because pixi.js / @pixi/react are not in dependencies
```

The absence of a dependency is a setup state, not evidence from a renderer spike. No candidate renderer was installed and no side-by-side world-stage prototype was measured.

A real engine decision requires a bounded prototype.

## 7. Recommended engine architecture

### Primary candidate — Three.js + React Three Fiber

This is the preferred first spike because it matches the existing GDD direction and the requested 2.5D miniature-world target.

Use:

- React 19 + `@react-three/fiber` v9;
- Three.js;
- orthographic camera;
- instanced hex terrain meshes or thin extruded tiles;
- low-poly / sprite / billboard POIs and actor markers;
- depth/z hierarchy for settlements, castles, projects, faction activity;
- lines/tubes/sprites for trade/information routes;
- presentation-only animation from `WorldVisualDelta`.

Do **not** move TMR simulation into R3F's render loop.

### Candidate B — Phaser 4

Phaser 4 is a serious alternative if the desired result remains fundamentally 2D/isometric rather than true 3D.

Useful strengths:

- cameras;
- sprites;
- tilemaps;
- tweens;
- particles;
- input;
- filters/lighting;
- asset loading;
- framework integration.

Risk: Phaser is a game framework with its own timestep/scene model. If selected, it must run as a presentation client only. The TMR authoritative calendar/action pipeline stays outside Phaser.

### Candidate C — PixiJS v8

Pixi remains a good lightweight 2D renderer for sprites, routes, particles, patterns and isometric depth sorting. It is lower migration risk than a full game framework but does not by itself solve the miniature 2.5D/world-model problem.

### Not recommended for this correction

- full Godot/Unity-style rewrite;
- moving simulation into a new engine;
- keeping DOM/SVG as the final world renderer without a genuine candidate benchmark;
- building a second world state just for visual objects.

## 8. Web world-model architecture

Introduce a renderer-neutral derived presentation model:

```text
Authoritative WorldState / EventStore
-> PresentationState
-> WorldSceneModel
-> chosen world renderer
```

`WorldSceneModel` is not persisted and may contain only derived or authored-presentation information.

Suggested families:

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

Every visual entity receives a truth class:

### A. AUTHORITATIVE_PROJECTION

Directly represents a real state value or identity.

Examples:
- LandHex controller;
- active conflict;
- completed project;
- capital Region;
- real ContactGraph route.

### B. DERIVED_PRESENTATION

Computed deterministically from authoritative state without claiming a new actor/state.

Examples:
- border line;
- front line;
- route pulse;
- controller transition animation;
- trade-cart stream representing active trade flow at a route level;
- protest crowd effect when a factual protest/uprising/faction action exists.

### C. DECORATIVE_SUBSTRATE

Pure environmental art that cannot be mistaken for simulation truth.

Examples:
- trees;
- generic field texture;
- mountain mesh;
- non-interactive roof clusters inside an authored settlement area.

Decorative substrate must never look like an authoritative army, project completion, ownership change or active crisis.

## 9. What can move on the map now

### Can be implemented now from existing truth

- route traffic/pulses for active ContactGraph channels;
- ideology propagation pulses when source/target contribution is known;
- controller-change sweeps;
- faction/uprising presence markers from actual faction/conflict/controller evidence;
- derived front emphasis where fronts exist;
- project construction/completion states from real Intervention lifecycle;
- settlement/capital/POI static world objects from Scenario/presentation metadata;
- border opening/closing feedback;
- crisis smoke/banner/crowd-style effects if tied to actual conflict/event evidence.

### Must not be invented yet

- exact army formations/positions without an authoritative military-location domain;
- supply trucks carrying exact cargo values without logistics state;
- tactical battle animations that imply outcomes not present in simulation;
- fake villagers/units whose movement implies real population simulation;
- new construction timers.

Future military/logistics domains may later promote these from abstract/derived activity to authoritative objects.

## 10. Role-specific development methodology

### Game designer / planner

Owns:

1. player fantasy and 30-second loop;
2. reference traceability matrix;
3. what is world-first vs details-only;
4. state-project and institutional-roadmap semantics;
5. event significance hierarchy;
6. map object meaning rules.

Every feature spec must answer:

```text
What will the player SEE change?
Where on the map?
What real state caused it?
What can the player decide next because of it?
```

### Developer

Owns:

1. strict simulation/presentation separation;
2. renderer-neutral `WorldSceneModel`;
3. engine spike measurements;
4. object pooling/instancing/LOD;
5. mobile input/camera performance;
6. deterministic visual provenance where required;
7. no debug IDs in production player copy.

### UI/UX + visual designer

Owns:

1. map silhouette and 2.5D art direction;
2. layer hierarchy;
3. 2-second gaze order;
4. icon/object families;
5. color/pattern separation for owner/controller/ideology;
6. node-graph readability;
7. state-project progression appearance;
8. removal of default card/dashboard grammar.

Required visual rule:

```text
If the screen is blurred or viewed at thumbnail size,
the map/world and major conflict/state change must still dominate.
```

### QC / playtest

QC does not accept a feature because its data attributes exist.

Required checks include:

- screenshot comparison Day 0 / intermediate / late;
- can user identify rebellion location in <3 seconds?;
- can user identify lost territory without text?;
- can user identify one completed State Project without opening a drawer?;
- can user identify enacted institutional direction without raw IDs?;
- default mobile screenshot mistaken for admin/dashboard? must be NO;
- raw internal enum / fixture / EventId leakage? must be NO except explicit debug/detail view;
- renderer mobile performance/input proof;
- reference traceability acceptance for each reference-driven feature.

## 11. New acceptance target

P0 world-stage correction is accepted only when:

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
