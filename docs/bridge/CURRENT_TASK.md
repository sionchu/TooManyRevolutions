# TMR Current Bridge Task

TASK_ID: GAMEBUILDERS_DEMO_SPRINT_01
STATUS: AUTHORIZED
BASE_IMPLEMENTATION_HEAD: 82bb6018f2fc87d9f1807cab3c12fb5e2e016775
BASE_IMPLEMENTATION_BRANCH: f05-fix23-review
WORK_BRANCH: gamebuilders-demo-sprint-01
TASK_FILE: docs/bridge/tasks/GAMEBUILDERS_DEMO_SPRINT_01.md
DEPLOYMENT_ADDENDUM: docs/bridge/tasks/GAMEBUILDERS_DEMO_SPRINT_01_DEPLOYMENT_ADDENDUM.md
RESULT_PATH: docs/bridge/results/GAMEBUILDERS_DEMO_SPRINT_01_RESULT.md

## Event sprint override

GameBuilders submission is imminent. Normal Gate 1F/F05 progression is temporarily paused so the accepted simulation core can be turned into a playable vertical slice.

```text
F05_FIX23: COMPLETE / REVIEWED / PASS / ACCEPTED
PERSISTENCE_ACCEPTED: SerializedSimulationSnapshotV8 / format version 8
GATE1F: NOT_READY
V02: NOT_STARTED
```

`F05_FIX24` was authorized previously but is now **DEFERRED_FOR_GAMEBUILDERS** before review/acceptance. Its historical task file remains as an audit artifact. Do not execute F05_FIX24 or F05_FIX25 during this sprint.

## Mission

Execute the full authorized overnight sprint in `docs/bridge/tasks/GAMEBUILDERS_DEMO_SPRINT_01.md` **and the mandatory ChatGPT Sites deployment addendum** in `docs/bridge/tasks/GAMEBUILDERS_DEMO_SPRINT_01_DEPLOYMENT_ADDENDUM.md`.

The sprint is one continuous task with internal checkpoints. Codex Desktop is explicitly authorized to continue from checkpoint to checkpoint without waiting for human review, committing and pushing after each checkpoint.

Target outcome:

```text
product title/start/reset
+ deterministic curated demo scenario
+ real simulation time controls
+ actual policy/intervention actions through common intake
+ state HUD
+ SVG hex map
+ Agenda UI
+ factual EventStore feed and crisis presentation
+ coherent 2D art direction
+ presentation-only sound if stable
+ demo QA checklist
+ exact 3-minute capture shot list
+ ChatGPT Sites deployment / real Site URL
```

The final deployment target is **ChatGPT Sites from Codex Desktop**, not GitHub Pages. Codex should invoke Sites explicitly (`@Sites` if needed), deploy the real playable demo, and verify the actual Site URL. If public publishing is unavailable because of account/workspace controls, use the maximum available Sites preview/share access and report the limitation honestly rather than blocking the whole sprint.

## Hard boundaries

- thin client over accepted FIX23 core;
- no direct UI WorldState mutation;
- no scripted/scheduled crisis or story progression;
- no fake Agenda/EventStore facts;
- no fake/mock simulation for Sites;
- no new hidden pacing score/timer/RNG mechanic;
- no new F05 evidence/settlement domain work;
- no persistence V9;
- no Three.js/new 3D pipeline;
- no LLM/server dependency;
- no copyrighted/unlicensed downloaded media;
- no GitHub Pages/other hosting fallback during the overnight sprint unless user later authorizes it;
- accepted persistence remains V8;
- Gate 1F remains NOT_READY;
- V02 remains NOT_STARTED;
- no successor task self-authorization.

Execute only the main sprint task plus its mandatory Sites deployment addendum, then stop after publishing the final result and Sites deployment status.