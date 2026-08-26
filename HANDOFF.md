# HANDOFF

## Objective

Complete the authorized `GAMEBUILDERS_PRODUCT_SURFACE_P0` world-stage rework
while preserving TMR simulation authority. Keep the map as the continuous
playfield, expose real state changes through compact game-native UI, complete
the renderer evidence, deploy the playable Site, and stop before Gate 1F,
V02, F05 follow-up work, or a successor task.

## Completed checkpoint

The current targeted implementation checkpoint was pushed as:

```text
9befdf7aaee6eafe75a4601369a2624691a4a189
feat: add continuous terrain and content authoring
```

The public Sites version 21 was deployed from that exact code commit. Exact
deployed-source screenshots and hands-on QA cover title, briefing, Content
Studio title/briefing edits and JSON patch export, Day 0 continuous terrain,
selected-hex context, Day 90 rebellion/controller change, real project
implementing/completion, Institutional Roadmap, Day 1082, and 390×844 mobile.

The full suite collected 81/81 files and 600/600 passing assertions, then
exited 1 on four repeatable Vitest worker `onTaskUpdate` timeouts; no
assertion failed. This is recorded as `ASSERTIONS_PASS / RUNNER_EXIT_FAIL`.

## Delivered scope

- real R3F and PixiJS v8 benchmark builds from one frozen snapshot;
- evidence-based production choice of one R3F renderer;
- renderer-neutral `WorldSceneModel` with deterministic projections;
- continuous terrain world surface projected from the authoritative LandHex
  topology, with contextual hex selection/controller/front affordances;
- 2.5D world stage with authored countries, capitals, settlements, POIs,
  routes, controllers, ideology/pressure, conflict, and project landmarks;
- stable ContentRegistry title/briefing source, authoring-time draft pack, and
  Content Studio live preview/JSON patch handoff;
- actual Institutional Roadmap node graph with edges and fit/pan/zoom;
- qualitative default HUD with exact values on demand and no raw debug IDs;
- preserved ActionProposal, ideology, LandHex, Conflict, EventStore,
  policy/intervention, Chronicle, consolidation, and V8 boundaries;
- responsive mobile world-first surface with no horizontal overflow;
- public Site deployment and actual UI long-horizon run through Day 1080 and
  beyond Day 1000.

Evidence files are in
`docs/bridge/results/evidence/`; the complete provenance, marker block, and
measurements are in
`docs/bridge/results/GAMEBUILDERS_PRODUCT_SURFACE_P0_RESULT.md`.

## Verification evidence

- format, typecheck, lint, build, and `git diff --check` passed;
- focused current rework suite passed: 9 files / 20 tests;
- full suite collected 81 files / 600 passing assertions, then exited 1 from
  four Vitest worker `onTaskUpdate` progress-RPC timeouts; no assertion failed;
- T018, T021, T022, T023, T024, V01, and historical F05_FIX13 inspections
  passed; F05 inspection was baseline-only and remains NOT_READY;
- public actual UI run observed the conflict transition from none to rebellion
  to rebellion plus coup, faction controller migration, six routes, real
  policy/intervention feedback, Chronicle source records, and factual
  consolidation blockers;
- 1440×900 map stage measured 1367.40625×695; 390×844 world stage measured
  390×573.90625 (100% width, 67.998% viewport height), with no horizontal
  overflow observed.

## Decisions and boundaries

- R3F is the single production world-stage renderer; Pixi is benchmark-only.
- `WorldState`/`EventStore` remain authoritative. The renderer is read-only
  and has no second clock.
- State Projects are projections of existing intervention lifecycles, not a
  construction economy, generic timer, cooldown, countdown, or mana system.
- `SerializedSimulationSnapshotV8` remains unchanged.
- `P0_PRODUCT_PASS` is not declared by this handoff.
- `GATE1F: NOT_READY`, `V02: NOT_STARTED`, and `F05_SUCCESSOR_WORK: NOT_STARTED`.

## Result

See [docs/bridge/results/GAMEBUILDERS_PRODUCT_SURFACE_P0_RESULT.md](docs/bridge/results/GAMEBUILDERS_PRODUCT_SURFACE_P0_RESULT.md)
for the complete current markers, exact deployed visual evidence,
verification, public QA, and Sites deployment details.

## Next action

The result/evidence/handoff update is committed and pushed. Stop here. Do not
start F05 follow-up work, Gate 1F, or V02.
