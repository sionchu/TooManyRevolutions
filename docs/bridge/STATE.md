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

This FIX23 head is the stable core base for the GameBuilders vertical slice. The demo sprint layers client/presentation/scenario authoring on top of it and must not manufacture a Gate 1F pass.

## GameBuilders emergency sprint override

The current browser app at the accepted base still exposes a foundation/developer scaffold while renderer-neutral PresentationState, Agenda, deterministic simulation, EventStore, policy/intervention, ideology, faction, crisis, conflict, and persistence systems already exist behind it.

Submission priorities therefore temporarily change from deeper F05 architecture to a playable product surface.

## Current authorization

```text
CURRENT_TASK_ID: GAMEBUILDERS_DEMO_SPRINT_01
CURRENT_TASK_STATUS: AUTHORIZED
TASK_FILE: docs/bridge/tasks/GAMEBUILDERS_DEMO_SPRINT_01.md
TIMEFLOW_ADDENDUM: docs/bridge/tasks/GAMEBUILDERS_DEMO_SPRINT_01_TIMEFLOW_ADDENDUM.md
DEPLOYMENT_ADDENDUM: docs/bridge/tasks/GAMEBUILDERS_DEMO_SPRINT_01_DEPLOYMENT_ADDENDUM.md
OVERNIGHT_CONTINUATION: docs/bridge/tasks/GAMEBUILDERS_OVERNIGHT_CONTINUATION_01.md
IMPLEMENTATION_BASE: 82bb6018f2fc87d9f1807cab3c12fb5e2e016775
WORK_BRANCH: gamebuilders-demo-sprint-01
RESULT_PATH: docs/bridge/results/GAMEBUILDERS_DEMO_SPRINT_01_RESULT.md
```

This is one long authorized unattended task. Codex may continue through the demo checkpoints and bounded overnight continuation without intermediate human authorization, committing/pushing at safe checkpoints.

## Time-flow / pacing correction

The player controls the **flow rate of history** through pause/play and selectable speed. Every simulated day still executes the authoritative one-day pipeline; wall-clock speed is presentation scheduling only.

Important-event auto-pause is a **user-configurable presentation option**, not a forced game rule. Major events remain prominently visible even when auto-pause is disabled.

Fast-forward is not a remedy for Gate 1F. It can expose the known late-state interaction stall sooner in real time. Therefore the exact GameBuilders demo scenario must be audited deterministically through approximately 20 simulated years across multiple real legal response trajectories.

Required classification:

```text
DEMO_HORIZON_STATUS: ROBUST_SHORT_AND_MEDIUM_HORIZON
DEMO_HORIZON_STATUS: STRONG_SHORT_HORIZON_LATE_STALL
DEMO_HORIZON_STATUS: EARLY_STALL_DEMO_BLOCKER
```

The audit must separate simulated-horizon behavior from UI speed. Slowing the clock is not accepted as evidence that the stall is solved.

If `EARLY_STALL_DEMO_BLOCKER`, unattended repair may tune only GameBuilders-specific initial ScenarioDefinition data, existing action/catalog composition, documented demo seed, UI information hierarchy, and speed presets. No scheduled crisis, hidden countdown, fake event/Agenda, arbitrary Conflict cleanup, new persistence version, or other hidden pacing mechanic is allowed.

## Sites deployment

The target is the actual playable application deployed/previewed through ChatGPT Sites from Codex Desktop. The Site must not be a mock/reimplementation. If public publishing is blocked by account/workspace permissions, use the maximum available Sites preview/share state and record the exact blocker.

## Bounded overnight continuation

Do not stop simply because the first playable build finishes quickly. After the P0 demo is safely committed/deployed:

```text
playable demo + Sites
-> deterministic 0–20y demo horizon audit
-> demo-only authoring repair if early-stall blocker
-> deployed browser/Sites P0/P1 QA + one repair/redeploy pass
-> if time remains, resume F05_FIX24 in its existing docs-only scope on f05-fix24-review
-> if time still remains, write a conditional F05_FIX25 DESIGN MEMO only
```

F05_FIX24 may therefore resume after demo safety work, but only its already-authored research/docs scope. It remains `AWAITING_CHATGPT_REVIEW` after Codex completion.

No F05_FIX25 production implementation, new authoritative runtime writer, ActionRecord/GameEvent evidence type, persistence V9, or settlement runtime is authorized unattended. The conditional design memo is non-authoritative planning only.

## Preserved architecture constraints

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
- no unreviewed F05 operational-evidence or settlement implementation;
- no persistence V9; accepted persistence remains V8;
- no LLM/server dependency;
- no Three.js/new 3D pipeline for the emergency sprint;
- no unlicensed external media;
- Gate 1F remains NOT_READY;
- V02 remains NOT_STARTED.
