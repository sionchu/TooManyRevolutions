# TMR Current Bridge Task

TASK_ID: GAMEBUILDERS_DEMO_SPRINT_01
STATUS: AUTHORIZED
BASE_IMPLEMENTATION_HEAD: 82bb6018f2fc87d9f1807cab3c12fb5e2e016775
BASE_IMPLEMENTATION_BRANCH: f05-fix23-review
WORK_BRANCH: gamebuilders-demo-sprint-01
TASK_FILE: docs/bridge/tasks/GAMEBUILDERS_DEMO_SPRINT_01.md
TIMEFLOW_ADDENDUM: docs/bridge/tasks/GAMEBUILDERS_DEMO_SPRINT_01_TIMEFLOW_ADDENDUM.md
DEPLOYMENT_ADDENDUM: docs/bridge/tasks/GAMEBUILDERS_DEMO_SPRINT_01_DEPLOYMENT_ADDENDUM.md
OVERNIGHT_CONTINUATION: docs/bridge/tasks/GAMEBUILDERS_OVERNIGHT_CONTINUATION_01.md
RESULT_PATH: docs/bridge/results/GAMEBUILDERS_DEMO_SPRINT_01_RESULT.md

## Event sprint override

GameBuilders submission is imminent. Normal Gate 1F/F05 progression is temporarily paused so the accepted simulation core can be turned into a playable vertical slice.

```text
F05_FIX23: COMPLETE / REVIEWED / PASS / ACCEPTED
PERSISTENCE_ACCEPTED: SerializedSimulationSnapshotV8 / format version 8
GATE1F: NOT_READY
V02: NOT_STARTED
```

`F05_FIX24` was authorized previously but is deferred while the GameBuilders P0 demo is built. The overnight continuation explicitly permits F05_FIX24 to resume **docs-only** after the playable/deployed demo, horizon audit, and product QA are safely committed.

## Mission

Execute the full authorized overnight queue in this order:

1. `docs/bridge/tasks/GAMEBUILDERS_DEMO_SPRINT_01.md`
2. `docs/bridge/tasks/GAMEBUILDERS_DEMO_SPRINT_01_TIMEFLOW_ADDENDUM.md`
3. `docs/bridge/tasks/GAMEBUILDERS_DEMO_SPRINT_01_DEPLOYMENT_ADDENDUM.md`
4. `docs/bridge/tasks/GAMEBUILDERS_OVERNIGHT_CONTINUATION_01.md`

This is one unattended 4–5 hour work window. Codex Desktop is explicitly authorized to continue through all internal checkpoints and the bounded continuation queue without waiting for human review, committing and pushing at safe checkpoints.

Target outcome:

```text
product title/start/reset
+ deterministic curated demo scenario
+ continuous pause/play/speed-controlled daily simulation
+ optional (not forced) important-event auto-pause
+ actual policy/intervention actions through common intake
+ state HUD
+ SVG hex map
+ Agenda UI
+ factual EventStore feed and crisis presentation
+ coherent 2D art direction
+ presentation-only sound if stable
+ deterministic 0–20y demo-scenario horizon audit
+ demo QA / repair pass
+ exact 3-minute capture shot list
+ ChatGPT Sites deployment / real Site URL or maximum available preview
+ if time remains: F05_FIX24 docs-only grounding and conditional next-FIX design memo only
```

## Critical pacing rule

Fast-forward is not a substitute for Gate 1F. Faster wall-clock time can expose the known late-state interaction stall earlier. Therefore speed presets must be selected after the actual GameBuilders demo scenario horizon audit, and the final result must report `DEMO_HORIZON_STATUS` honestly.

Do not hide a core stall merely by reducing speed. If the likely 3–8 minute judging session can reach a structural stall, treat that as a demo blocker and first tune only safe GameBuilders scenario authoring/presentation. If authoritative core semantics are required, record the blocker for F05 rather than smuggling in a hidden mechanic.

## Time-flow rule

The player controls time flow through pause/play and speed presets. Every simulated day still runs one authoritative daily SimulationStep in order. Major-event automatic pause is a user-configurable presentation option, not a mandatory game rule.

## Sites

The deployment target is ChatGPT Sites from Codex Desktop. Deploy/preview the actual playable application, not a mock. Verify the available Site URL/preview itself where tooling permits. If public publishing is blocked by account/workspace settings, record the maximum available Sites state and exact blocker without derailing the rest of the sprint.

## Hard boundaries

- thin client over accepted FIX23 core;
- no direct UI WorldState mutation;
- no scripted/scheduled crisis or story progression;
- no fake Agenda/EventStore facts;
- no fake/mock simulation for Sites;
- no new hidden pacing score/timer/RNG mechanic;
- no unreviewed new F05 evidence/settlement runtime writer;
- no persistence V9;
- no Three.js/new 3D pipeline;
- no LLM/server dependency;
- no copyrighted/unlicensed downloaded media;
- accepted persistence remains V8;
- Gate 1F remains NOT_READY;
- V02 remains NOT_STARTED;
- F05_FIX24 may only resume in its existing docs-only scope after demo safety work;
- no F05_FIX25 implementation/self-authorization; at most the explicitly permitted conditional design memo.

Stop only after the applicable overnight queue is exhausted or a documented stop condition in `GAMEBUILDERS_OVERNIGHT_CONTINUATION_01.md` is reached.
