# Backlog Addendum — GameBuilders P0 Game Loop / World Feel / Content Studio

Date: 2026-08-26
Status: ACTIVE / CURRENT P0
Task: `GAMEBUILDERS_PRODUCT_SURFACE_P0`

## P0 remaining priority order

### P0-GL01 — Auto-pause / loop audit

Goal: prevent routine state changes from turning the game into repeated modal paperwork.

Deliver:
- enumerate current auto-pause triggers;
- classify consequential vs routine;
- keep critical interruptions;
- let routine ideology/faction/resource/world changes remain observable while time flows;
- add focused regression coverage.

Acceptance: `ROUTINE_AUTO_PAUSE_DOMINATES_GAME_LOOP = NO`.

### P0-GL02 — ChronicleDigest

Goal: turn factual event history into readable political history.

Deliver:
- presentation-only grouping/digest layer;
- territorial/conflict/institution/project events prioritized;
- repeated low-level ideology/faction changes condensed where safe;
- source EventId drill-down/provenance;
- EventStore remains unchanged/append-only.

### P0-GL03 — Renderer spike and decision

Goal: determine whether PixiJS v8 improves persistent 2D world rendering without threatening the authoritative simulation/deadline.

Deliver:
- bounded PixiJS + React spike;
- camera/pan/zoom/touch proof;
- explicit ownership boundary;
- decision recorded: adopt Pixi or SVG fallback;
- no second game clock.

### P0-GL04 — World-stage composition repair

Goal: persistent gameplay reads as a game world, not a responsive dashboard.

Deliver:
- map dominates viewport;
- compact HUD;
- settings/debug controls removed from prime gameplay surface;
- owner/controller/ideology/conflict/routes differentiated;
- mobile uses contextual bottom sheet/drawer instead of stacked cards;
- terrain/asset density improved without hiding political truth.

### P0-GL05 — Institutional Roadmap

Goal: give medium-term institutional planning and satisfying path visibility.

Deliver:
- real PolicyDefinition graph;
- prerequisite/incompatibility states;
- current/enacted/available/blocked states;
- real `ENACT_POLICY` integration;
- no research/reform/political mana;
- no focus-tree authority.

### P0-GL06 — State Projects / landmark traces

Goal: make state-building choices accumulate visibly in the world.

Deliver:
- identify 2–4 defensible existing Policy/Intervention lifecycles;
- project progress derived from existing commitment/duration;
- authoritative completion;
- persistent map-visible trace;
- no fake construction economy/timer.

If existing mechanics only justify fewer than two, stop and document the exact domain blocker rather than fabricate projects.

### P0-GL07 — WorldVisualDelta

Goal: translate actual political/world changes into factual motion/feedback.

Deliver presentation deltas for, where supported:
- ideology change;
- controller/border change;
- route closure/reopen;
- active conflict;
- institutional rule change;
- project/intervention completion.

No renderer/UI authoritative writes.

### P0-GL08 — Content Studio

Goal: let the user/developer locate and edit player-facing branch/variant text without searching source files.

Deliver:
- stable content IDs;
- search/filter;
- screen/entity/event/policy/intervention/project/branch/variant metadata;
- edit/preview/diff;
- placeholder validation;
- Korean length warning;
- local draft/reset;
- JSON patch import/export;
- clipboard copy where useful.

### P0-GL09 — Documentation integration checkpoint

Before final P0 review, fold the durable product rules from:

- `docs/GDD_GAME_LOOP_WORLD_FEEL_ADDENDUM_2026-08-26.md`
- `docs/ARCHITECTURE_P0_RENDERER_CONTENT_BOUNDARY_ADDENDUM_2026-08-26.md`
- `docs/DECISION_GAMEBUILDERS_P0_GAME_LOOP_RENDERER_CONTENT_STUDIO_2026-08-26.md`
- `docs/QA_GAMEBUILDERS_P0_GAME_LOOP_WORLD_FEEL_2026-08-26.md`
- this backlog addendum
- current Bridge task/addenda

into the canonical relevant sections of:

- `docs/GDD.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `docs/BACKLOG.md`
- `docs/QA_PLAYTEST.md`

Do not delete historical decisions or weaken existing simulation authority contracts while integrating.

### P0-GL10 — Hands-on / responsive / deployment review

Deliver:
- Day 0 / intermediate / late screenshots;
- several-hundred-day normal-play flow observation;
- mobile portrait QA;
- desktop QA;
- Chronicle/Roadmap/Project/Content Studio evidence;
- exact source commit deployment to Sites;
- result doc updated against latest seven-addendum scope.

## Not authorized

- Gate 1F PASS;
- V02;
- persistence V9;
- F05 successor implementation hidden inside P0;
- full engine migration;
- generic research/political currency;
- fake world/project history;
- successor task self-authorization.
