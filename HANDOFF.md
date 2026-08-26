# HANDOFF

## Objective

Complete the authorized `GAMEBUILDERS_PRODUCT_SURFACE_P0` world-stage rework
while preserving TMR simulation authority. Keep the map as the continuous
playfield, expose real state changes through compact game-native UI, complete
the renderer evidence, deploy the playable Site, and stop before Gate 1F,
V02, F05 follow-up work, or a successor task.

## Completed checkpoint

The implementation checkpoint was pushed as:

```text
31180d977e75e4646332678c36812abc30a3a7fd
feat: rework P0 world stage with R3F
```

The public Sites version 20 was deployed from that exact code commit and
passed hands-on title, briefing, map, decision, policy, intervention,
Chronicle, governance, responsive, and long-horizon QA.

The result/state documentation follow-up is the current local change to be
committed and pushed after final verification.

## Delivered scope

- real R3F and PixiJS v8 benchmark builds from one frozen snapshot;
- evidence-based production choice of one R3F renderer;
- renderer-neutral `WorldSceneModel` with deterministic projections;
- 2.5D hex world stage with authored countries, capitals, settlements,
  routes, controllers, ideology/pressure, conflict, and project landmarks;
- actual Institutional Roadmap node graph with edges and fit/pan/zoom;
- qualitative default HUD with exact values on demand and no raw debug IDs;
- preserved ActionProposal, ideology, LandHex, Conflict, EventStore,
  policy/intervention, Chronicle, consolidation, and V8 boundaries;
- responsive mobile world-first surface with no horizontal overflow;
- public Site deployment and actual UI long-horizon run through Day 1080 and
  beyond Day 1000.

## Verification evidence

- format, typecheck, lint, build, and `git diff --check` passed;
- focused world-stage/gameplay suite passed: 6 files / 16 tests;
- full suite collected 80 files / 598 passing assertions, then exited 1 from
  four Vitest worker `onTaskUpdate` progress-RPC timeouts; no assertion failed;
- T018, T021, T022, T023, T024, V01, and historical F05_FIX13 inspections
  passed; F05 inspection was baseline-only and remains NOT_READY;
- public actual UI run observed the conflict transition from none to rebellion
  to rebellion plus coup, faction controller migration, six routes, real
  policy/intervention feedback, Chronicle source records, and factual
  consolidation blockers;
- 1440×900 map measured 1367×695 and 390×844 map measured 343×624, with no
  horizontal overflow.

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
for the complete markers, benchmark evidence, implementation record,
verification, public QA, and Sites deployment details.

## Next action

Commit and push this documentation-only handoff update, then stop. Do not
start F05_FIX18 or any successor task, Gate 1F, or V02.
