# GAMEBUILDERS_PRODUCT_SURFACE_P0 — Game Feel / Progression / Renderer / Content Studio Addendum

TASK_ID: GAMEBUILDERS_PRODUCT_SURFACE_P0
STATUS: AUTHORIZED ADDENDUM
PRECEDENCE: after Gameplay Reality repair, before decorative polish
WORK_BRANCH: gamebuilders-product-surface-p0

## 0. Why this addendum exists

Hands-on review still reports a weak game feel even after the map-first correction. The current product loop risks collapsing into:

```text
time passes -> crisis text appears -> choose one intervention -> more text
```

That is insufficient. TMR needs accumulated spatial and institutional consequences that remain visible on the persistent map. The player should be able to look at the world and understand what their state has built, legalized, suppressed, lost, connected, or transformed.

This addendum does NOT authorize a generic research currency, scripted story tree, fake world animation, or a replacement simulation. It adds a product/gameplay layer over existing Policy / Intervention / WorldState / EventStore facts.

## 1. Reference findings and product lessons

Use these as principles, not copied assets.

### Plague Inc. / Rebel Inc.
- persistent map is the main game surface;
- systemic spread/control is visible spatially rather than only in text;
- the world reacts continuously while time flows;
- region/zone status is readable at a glance;
- major state changes have immediate visual feedback.

### Rebel Inc. map-linked projects
Ndemic's Azure Dam map demonstrates a strong pattern: a major development objective exists as a visible place in the world, takes sustained effort, and interacts with conflict pressure. TMR should use this principle for state projects: policies/interventions should leave map-visible institutional or infrastructure landmarks when current authoritative state/event history supports them.

### Against the Storm
- progression decisions alter both capability and the visible settlement;
- building upgrades can visibly change the building itself;
- strategic choices become tangible world changes, not just number changes;
- avoid progression systems that discourage experimentation or create one obvious optimal route.

### Civilization-style lesson, bounded for TMR
Use a visual branching roadmap and memorable completed projects, but do not introduce generic science/research/policy mana. TMR progression must derive from actual institutional prerequisites, incompatibilities, treasury, administrative headroom, time, and current WorldState.

## 2. Policy progression: Institutional Roadmap, not a fake tech tree

Add a player-facing `Institutional Roadmap` surface using the existing PolicyDefinition graph.

Nodes are real policies/institutional changes. Edges are derived from actual prerequisites / incompatibilities / active policies. Do not author a second hidden progression graph when the Policy catalog already contains the facts.

Required presentation states:

```text
AVAILABLE
ACTIVE / ENACTED
BLOCKED_BY_PREREQUISITE
BLOCKED_BY_INCOMPATIBILITY
CURRENT_INSTITUTIONAL_STATE
```

No XP, research points, reform points, policy mana, tech era score, or artificial unlock timer.

The player should visually understand paths such as:

```text
royal veto
-> abolish royal veto
-> broader legislative government
-> universal suffrage (when its real prerequisite is satisfied)
```

and mutually exclusive property/institution paths where they are actually authored.

The roadmap is a visualization of legal possibilities, not an authoritative story/progress track.

## 3. Map-linked State Projects / Landmark feedback

Create a small P0 `State Project Presentation Catalog` that maps selected existing Interventions (and only if semantically appropriate, completed Policy changes) to visible map landmarks.

P0 target: 2–4 memorable projects only.

Examples of acceptable archetypes when backed by real existing effects:
- food relief / distribution office or granary network;
- industrial/public works landmark;
- constitutional assembly / parliament visual marker after a real institution change;
- state communications / administrative office only if an existing Intervention safely represents it.

Do NOT invent a project solely for visuals if no existing authoritative action/effect can support it.

### Project lifecycle projection

Derive presentation from existing authoritative facts:

```text
not started
START_INTERVENTION / active intervention -> construction/implementation state
implementation progress = elapsed authoritative ticks / authored duration, presentation-only
INTERVENTION_COMPLETED -> completed landmark
```

Elapsed duration may be visualized because the Intervention already owns an authored duration. Do not add a second hidden construction timer.

On completion:
- reveal/change a landmark asset on the actual target Region if the action has a valid region target;
- if it is country-level with no honest spatial target, place it at an explicitly authored presentation anchor such as the actual capital Region, and mark that anchor as presentation metadata;
- emit no fake GameEvent;
- all visuals remain derivations of the existing event/action/state history.

A project should make the map look materially different after completion.

## 4. Game feel: state delta -> visual feedback pipeline

Build a presentation-only `WorldVisualDelta` / `MapFeedbackQueue` layer between successive PresentationState/EventStore snapshots.

It may animate only factual changes. Examples:

```text
IDEOLOGY_SUPPORT_CHANGED -> region color/pattern interpolation + source/destination route pulse
FACTION_STRATEGY_CHANGED -> faction marker emphasis if a real marker exists
REBELLION_STARTED -> crisis pulse at affected factual region(s)
LAND_HEX_CONTROL_CHANGED -> controller color/pattern sweep on the changed hex
BORDER_CLOSED / BORDER_REOPENED -> route fade/lock animation
INTERVENTION_STARTED -> project construction marker if catalogued
INTERVENTION_COMPLETED -> project completion reveal
INSTITUTION_RULE_CHANGED -> short state-seal / institution feedback + roadmap node transition
GOVERNMENT_TRANSITIONED -> header/government identity transition, not territorial recolor
```

No decorative army, population crowd, battle, explosion, smoke, city, or construction progress may imply an authoritative entity/event that does not exist. Ambient paper/noise/light animation is allowed if clearly non-semantic.

Animations should be short and layered; they must never block the simulation clock.

## 5. Renderer / web-game engine decision

The existing React + SVG renderer is valuable for accessibility and inspection, but it currently encourages a static diagram look. Perform a bounded renderer spike before deciding whether to keep pure SVG.

### Preferred P0 renderer candidate: PixiJS v8 + @pixi/react v8

Reasons:
- existing React 19 client can keep DOM HUD/drawers/admin while Pixi renders only the world stage;
- GPU-accelerated WebGL rendering is mature and recommended for production;
- Pixi scene graph/containers fit the already-defined TMR layer registry;
- sprites, textures, filters, asset manifests and lightweight animation are sufficient for a map game without introducing a second gameplay engine;
- @pixi/react v8 is designed for React 19;
- Pixi Assets supports manifest/bundle loading;
- `pixi-viewport` can supply drag/pinch/wheel pan/zoom and is MIT licensed.

### Phaser evaluation

Phaser is a serious HTML5 2D game framework with cameras, scenes, tweens, particles, asset tooling and React integration templates. However, do NOT migrate TMR wholesale to Phaser during this P0 unless a documented spike proves a strong benefit. TMR already owns its authoritative simulation/time/action pipeline; a Phaser scene/game-loop migration could duplicate or obscure that authority.

Default recommendation for this sprint:

```text
authoritative simulation: existing TMR TypeScript core
application / menus / drawers / Content Studio: React DOM
persistent map renderer: PixiJS v8 + @pixi/react v8 (bounded spike, adopt if stable)
map camera: pixi-viewport if adopted
```

### Renderer spike acceptance

Before a full map rewrite, prove in an isolated component:
- React 19 integration;
- Sites build/deploy compatibility;
- desktop mouse + mobile pinch/pan;
- responsive resize;
- one country polygon/hex layer;
- one ideology overlay;
- one real controller-change animation;
- one factual route pulse;
- performance with the P0 map cardinality;
- no simulation mutation from renderer.

If the spike fails quickly or destabilizes submission, keep the SVG renderer for the deadline and implement the same `WorldVisualDelta` model there. Document the engine migration as P1. Do not leave two competing production map renderers half-complete.

## 6. Map visual composition must feel like a game

Regardless of engine, the visible main screen must no longer look like a large beige DOM panel containing a tiny horizontal strip of hexes.

Required:
- map canvas/world surface fills the majority of the viewport;
- camera auto-fits the actual world bounds rather than a hard-coded mostly-empty viewBox;
- map has continuous composition: terrain, country mass, borders, labels, routes, ideological influence, faction/control overlays, landmarks;
- HUD floats over/around the map rather than boxing the map inside a web-dashboard card;
- zooming in reveals Region/POI/landmark detail; zooming out emphasizes country/ideology/control geography;
- on mobile, map remains the first full-screen surface with bottom sheet controls.

## 7. World density and readable motion

The P0 authored world should have enough spatial substrate that one rebellion does not consume the entire player state in one or two visible changes and then become static.

Do not increase map size blindly. Use the Player-Observable Dynamics Audit to select a compact but meaningful P0 topology. Prefer multiple internal player Regions and enough LandHexes to show several visible control/influence changes over the first 3–8 minutes.

Every visible Region should have a reason to exist: capital, industrial belt, granary/agricultural zone, border region, port/trade corridor, etc. Avoid clone-like filler Regions.

## 8. Content Studio / Admin UI

The user needs direct control of player-facing text without searching source files.

Create an unlinked development/admin surface such as:

```text
?contentStudio=1
```

or an equivalent clearly separated route.

It must not affect authoritative WorldState.

### 8.1 Content registry

Centralize player-facing text under stable IDs. At minimum cover:
- product title/tagline/subtitle;
- opening briefing beats;
- tutorial/help text;
- main HUD labels/tooltips;
- Policy names/descriptions;
- Intervention names/descriptions/presentation copy;
- event presentation templates;
- Agenda presentation labels/explanations;
- Country/Region/Faction/Ideology display names and optional short descriptions;
- victory/defeat/objective copy;
- project/landmark presentation copy.

Recommended record shape:

```text
id
locale
category
screen
entityType/entityId if applicable
branchOrVariantId if applicable
text/template
allowedVariables
maxRecommendedLength
notes
tags
source/defaultRevision
```

### 8.2 Branch / variant inspection

The studio must let the user filter text by:
- screen;
- event type;
- policy/intervention;
- country/faction/region;
- branch/variant/condition label where one exists;
- missing/unreviewed status.

This is a content-authoring branch/variant catalog. Do not create an authoritative narrative chapter tree or hidden story progression.

### 8.3 Editing workflow

Minimum capabilities:
- search/filter;
- inline edit;
- live preview where practical;
- baseline vs edited diff;
- placeholder/variable validation;
- Korean length warning;
- duplicate/missing stable-ID detection;
- local draft persistence (localStorage is acceptable for P0);
- reset one entry / reset all;
- import JSON patch;
- export JSON patch;
- copy patch to clipboard.

A static Sites deployment cannot directly commit edits back to GitHub without an authenticated backend. Do not fake that capability. The P0 workflow is:

```text
edit in Content Studio -> export content patch JSON -> apply patch to repository through Codex/ChatGPT/tooling -> redeploy
```

Document the patch schema and exact repo ingestion command/helper.

### 8.4 Hardcoded-text audit

Add a development test/audit that detects important remaining player-facing Korean strings outside approved registry/presentation-template files. Allow explicit exceptions for tests/developer diagnostics.

Goal: the user should not have to hunt through React components to fix a sentence.

## 9. Text density / decision UX correction

Game theory must be experienced through trade-offs, not explained as a textbook on every card.

Default decision card should be compact:

```text
name
cost chips
2–4 concrete effect arrows
who/where affected
primary button
```

Move long causality/uncertainty explanation behind `자세히` / tooltip / expandable detail.

The map should react/highlight affected Regions/Factions while hovering/selecting a policy/intervention.

## 10. Objective and long-term motivation

The persistent main screen must show an understandable medium-term objective:

```text
새 질서 정착
```

Expose actual current blockers/conditions from the existing consolidation read model without inventing a generic progress bar when the authoritative domain does not provide one.

The player should understand:
- what kind of state they are trying to create;
- which institutional path they are currently taking;
- what has physically/institutionally changed since game start;
- which projects/landmarks they have completed;
- which conflicts/pressures threaten that path.

## 11. Continuous P0 checkpoints

After Gameplay Reality repair, continue without waiting:

### GF-A — engine/reference spike
- document PixiJS/Phaser decision;
- license audit PixiJS, @pixi/react, pixi-viewport, Phaser if considered;
- build isolated renderer spike;
- select one production renderer.

### GF-B — Institutional Roadmap
- expose real Policy actions;
- render prerequisites/incompatibilities as a visual branching roadmap;
- no generic progression currency.

### GF-C — State Projects / map landmarks
- select 2–4 existing actions with defensible map presentation;
- show started/progress/completed projection from existing authoritative lifecycle;
- completed project visibly alters map presentation.

### GF-D — game-feel delta pipeline
- factual map transitions and camera/event focus;
- compact decision UX;
- no fake animation facts.

### GF-E — Content Studio
- stable-ID content catalog;
- editable admin UI;
- import/export JSON patch;
- hardcoded-copy audit.

### GF-F — QA / Sites
- test desktop/mobile;
- Day 0/90/360/720/1080 player-observable visual-state comparison;
- one Policy roadmap path verified;
- one completed State Project map landmark verified;
- Content Studio editing/export verified;
- redeploy actual Site.

## 12. P0 acceptance additions

```text
GAME_FEELS_LIKE_STATIC_TEXT_DASHBOARD: NO
MAP_IS_PRIMARY_GAME_SURFACE: YES
WORLD_CAMERA_PAN_ZOOM_RESPONSIVE: YES
GAME_RENDERER_DECISION_DOCUMENTED: YES
PIXI_SPIKE: PASS_OR_EXACT_BLOCKER
INSTITUTIONAL_ROADMAP: YES
GENERIC_TECH_OR_POLICY_MANA: NO
PLAYER_CAN_ENACT_REAL_POLICY: YES
STATE_PROJECT_PRESENTATION: YES
COMPLETED_PROJECT_LEAVES_MAP_VISIBLE_TRACE: YES
WORLD_VISUAL_DELTA_PIPELINE: YES
FACTUAL_CONTROLLER_IDEOLOGY_ROUTE_CRISIS_FEEDBACK: YES
CONTENT_STUDIO: YES
CONTENT_STABLE_IDS: YES
CONTENT_SEARCH_FILTER_EDIT: YES
CONTENT_JSON_IMPORT_EXPORT: YES
HARD_CODED_PLAYER_COPY_AUDIT: PASS_OR_EXCEPTIONS_DOCUMENTED
DAY_1000_VISUALLY_AND_SYSTEMICALLY_DISTINCT_FROM_DAY_0: YES_OR_CORE_BLOCKER_PROVEN
```

## 13. Preserved boundaries

- no direct UI/Pixi/Phaser mutation of WorldState;
- no second game clock;
- no renderer-owned authoritative state;
- no scripted crisis;
- no fake army/front/crowd/project completion;
- no generic tech/reform currency;
- no focus-tree/story-node authority;
- no F05 evidence/settlement implementation hidden inside a visual task;
- no persistence V9 unless separately authorized;
- State Dissolution remains T023-owned;
- Gate1F remains NOT_READY;
- V02 remains NOT_STARTED.
