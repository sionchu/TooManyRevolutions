# P0 World Stage Rework — ChatGPT Code/Product Review

Date: 2026-08-26
Reviewed branch: `gamebuilders-product-surface-p0`
Reviewed head: `5594fe17c02b281b7f51ba2e05578190aa21d3bd`
Status: ENGINE/ARCHITECTURE PASS · PRODUCT WORLD-OBJECT REWORK REQUIRED

## Verdict

The authorized renderer/world-stage rework made real architectural progress and passes its engineering intent:

```text
REAL_RENDERER_BENCHMARK: PASS
THREE_R3F_PRODUCTION_RENDERER: PASS
WORLD_SCENE_MODEL: PASS
INSTITUTIONAL_ROADMAP_GRAPH: PASS
QUALITATIVE_DEFAULT_HUD: PASS
REFERENCE_TRACEABILITY_METHOD: PASS
P0_PRODUCT_VISUAL_PASS: NO
NEXT_REWORK: SEMANTIC_WORLD_OBJECT_AND_ART_READABILITY
GATE1F: NOT_READY
V02: NOT_STARTED
```

Do not reopen engine selection or throw away the R3F/WorldSceneModel work unless regression evidence demands it.

## What is accepted

### Renderer benchmark

The prior fake/deferred spike problem is closed. The branch now installs and builds React Three Fiber/Three and PixiJS, renders the same frozen `WorldSceneModel`, records desktop/mobile observations, and chooses R3F for production. The production path is one renderer.

### Authority separation

The accepted flow is:

```text
WorldState/EventStore
-> PresentationState
-> WorldSceneModel
-> R3F presentation
```

Renderer animation is presentation-only; simulation time remains the TMR core.

### Roadmap

The Institutional Roadmap is now a positioned node/edge graph with prerequisite/incompatibility edges, Korean reason labels, and pan/zoom. Raw `fixture.*` and failure enums are no longer the default player vocabulary.

### Information hierarchy

The default metric strip is now qualitative and exact numbers are moved under an explicit `수치` detail disclosure. This is aligned with the GDD rule that reports/numbers explain while the world demonstrates.

## Remaining product blocker

The current R3F scene is still a **technical graybox miniature**, not yet a sufficiently authored game world.

### 1. State Project silhouette is not semantically distinct

`ProjectLandmark` receives `landmarkKind = food | civic | industrial`, but the production renderer does not branch its geometry by `landmarkKind`. All projects therefore share the same basic box/cylinder/cone silhouette and differ mainly by status color/location.

This does not yet deliver the intended `I built this state` / wonder-like memory.

### 2. Settlement/POI family is too narrow

The world stage currently proves a capital/settlement object, terrain details, routes and projects, but authored world identity is still sparse. The GDD miniature-world promise requires recognisable settlement/POI families when backed by authored content/presentation metadata: capital/palace, port, mine/industrial district, fort/checkpoint, granary/distribution, assembly/parliament, etc.

These may be static authored presentation facts and need not become new simulation state.

### 3. Faction/uprising/conflict activity remains abstract

Faction presence and active conflict are spatially grounded, but production presentation is still primarily rings/spheres/lines. That is a useful semantic overlay, not yet strong game-world event language.

Use deterministic derived presentation tied to real controller/faction/conflict evidence: banners, barricade/camp silhouettes, smoke/beacon FX, occupied-building flags, front emphasis, or similar. Do not invent exact troop counts, unit positions or tactical combat.

### 4. Route movement is technically visible but weakly differentiated

A generic route pulse proves motion. The next pass should make channel families legible without implying nonexistent cargo counts: trade, information, border, migration can use different line/particle/icon grammar backed only by current route type/active state.

### 5. Product acceptance still needs human visual evidence

Codex reports responsive hands-on QA, but ChatGPT product review has not independently seen the post-rework rendered screenshots. Final product PASS requires fresh Day 0 / meaningful intermediate / crisis / project-complete / roadmap screenshots or equivalent human-visible evidence.

## Role-specific next pass

### Planner / game designer

Define a semantic visual contract for each world object:

```text
real state/content source
-> visible object family
-> allowed animation
-> forbidden implication
-> player decision meaning
```

### Developer

Keep R3F and `WorldSceneModel`. Add renderer-neutral presentation metadata/object families rather than renderer-specific ad hoc conditions. Prefer instancing/LOD for repeated terrain/props. No simulation rewrite.

### UX / visual designer

Create a coherent low-poly/isometric object language with unmistakable silhouettes. The map should be readable first by objects and spatial changes, second by labels, and last by numbers/details.

### QC

Require recognition tests, not existence tests:

- can a player distinguish food/civic/industrial project landmarks without opening the drawer?
- can a player locate an active rebellion within 3 seconds?
- can a player tell which hexes changed controller without text?
- can a player distinguish a capital, industrial/mine region, port/trade region and project site where authored metadata supports them?
- does Day 0 vs late game look like a materially different built political world?
- does the default mobile screen still avoid dashboard/spreadsheet dominance?

## Hard boundaries

- preserve R3F production renderer and `WorldSceneModel` unless a demonstrated blocker exists;
- no exact army/cargo positions without authoritative state;
- no new unit simulation merely to decorate the map;
- no generic tech/research/political mana;
- no fake project completion or scripted historical path;
- no direct renderer mutation of WorldState;
- no persistence V9;
- no Gate1F PASS;
- no V02.
