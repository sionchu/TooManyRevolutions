# TMR Bridge State

UPDATED: 2026-08-26
REPOSITORY: sionchu/TooManyRevolutions
BRANCH: master
CURRENT_GATE: Gate 1F / TEMPORARILY_PAUSED_FOR_GAMEBUILDERS_DEMO
GATE1F_CHATGPT_DECISION: NOT_READY
V02: NOT_STARTED
PERSISTENCE_ACCEPTED: SerializedSimulationSnapshotV8 / format version 8

## Accepted progression

```text
F04: CLOSED / PASS
F05: measurement complete; Gate 1F NOT_READY
F05_FIX1..F05_FIX14: accepted progression; FUND_MOVEMENT route closed as pacing remedy
F05_FIX15: War-as-Politics requires new authoritative domain
F05_FIX16: COUP_COORDINATION_MINIMAL_DOMAIN_DESIGNABLE / PASS / ACCEPTED
F05_FIX17: COUP_COORDINATION_AUTHORING_SEAM_IMPLEMENTED / PASS / ACCEPTED
F05_FIX18: COUP_COORDINATION_RUNTIME_VERTICAL_SLICE_IMPLEMENTED / PASS / ACCEPTED
F05_FIX19: COUP_RESPONSE_SOURCE_EXTERNAL_INPUT_ONLY_AT_CURRENT_SCOPE / PASS / ACCEPTED
F05_FIX20: REBELLION_PERSISTENCE_AND_SETTLEMENT_REQUIRE_SEPARATE_DOMAINS / PASS / ACCEPTED
F05_FIX21: REBELLION_SPLIT_MINIMAL_DOMAINS_DESIGNABLE / PASS / ACCEPTED
F05_FIX22: REBELLION_PERSISTENCE_AUTHORING_SEAM_IMPLEMENTED / PASS / ACCEPTED
F05_FIX23: REBELLION_PERSISTENCE_RUNTIME_VERTICAL_SLICE_IMPLEMENTED / PASS / ACCEPTED
```

## Accepted implementation freeze point

```text
IMPLEMENTATION_HEAD: 82bb6018f2fc87d9f1807cab3c12fb5e2e016775
PRIMARY_CLASSIFICATION: REBELLION_PERSISTENCE_RUNTIME_VERTICAL_SLICE_IMPLEMENTED
PERSISTENCE_FORMAT: V8
GATE1F: NOT_READY
V02: NOT_STARTED
```

This FIX23 head is the stable core base for the GameBuilders vertical slice. The demo sprint must layer presentation/client/scenario authoring on top of it and must not manufacture a Gate 1F pass.

## GameBuilders emergency sprint override

The current browser app at the accepted base still exposes a foundation/developer scaffold while renderer-neutral PresentationState, Agenda, deterministic simulation, EventStore, policy/intervention, ideology, faction, crisis, conflict, and persistence systems already exist behind it.

Submission priorities therefore temporarily change from deeper F05 architecture to a playable product surface.

`F05_FIX24` status:

```text
PREVIOUSLY_AUTHORIZED: YES
CURRENTLY_AUTHORIZED: NO
STATUS: DEFERRED_FOR_GAMEBUILDERS
IMPLEMENTATION/RESULT_ACCEPTED: NO
REVIEW_BRANCH: f05-fix24-review (left untouched as audit/work branch)
```

Do not continue F05_FIX24/F05_FIX25 until the GameBuilders sprint is reviewed or explicitly ended.

## Current authorization

```text
CURRENT_TASK_ID: GAMEBUILDERS_DEMO_SPRINT_01
CURRENT_TASK_STATUS: AUTHORIZED
TASK_FILE: docs/bridge/tasks/GAMEBUILDERS_DEMO_SPRINT_01.md
IMPLEMENTATION_BASE: 82bb6018f2fc87d9f1807cab3c12fb5e2e016775
WORK_BRANCH: gamebuilders-demo-sprint-01
RESULT_PATH: docs/bridge/results/GAMEBUILDERS_DEMO_SPRINT_01_RESULT.md
NEXT_AUTHORIZED_TASK_ID: GAMEBUILDERS_DEMO_SPRINT_01
```

This is one long authorized task with internal checkpoints. Codex may continue through all checkpoints without intermediate human authorization, committing and pushing after each checkpoint.

Target: convert the accepted simulation into an honest deterministic vertical slice with title/start/reset, curated demo scenario, actual player actions through the common pipeline, state HUD, SVG map, Agenda, factual EventStore storytelling, crisis presentation, coherent 2D art direction, presentation-only sound if stable, QA checklist, and 3-minute capture shot list.

## Preserved architecture constraints during demo sprint

- player = CountryId continuity, not Government;
- Government transition remains nonterminal;
- physical territorial authority remains only LandHex controller state;
- Region.stateControl is not territorial ownership;
- fronts remain derived;
- no direct UI WorldState mutation;
- player actions use existing validation/action/simulation boundaries;
- no fake/scheduled coup, rebellion, Agenda, EventStore history, or story progression;
- no `0 LandHex -> defeat/dissolution`;
- no `NO_ACTIVE_FRONT_EDGE -> peace`;
- State Dissolution remains T023-owned;
- no new generic political/persistence/pacing score;
- no timer/RNG cheat to shorten the demo;
- no F05 operational-evidence or settlement implementation in the sprint;
- no persistence V9; accepted persistence remains V8;
- no LLM/server dependency;
- no Three.js/new 3D pipeline for the emergency sprint;
- no unlicensed external media;
- Gate 1F remains NOT_READY;
- V02 remains NOT_STARTED;
- no successor task self-authorization.