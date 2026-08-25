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
GAMEBUILDERS_DEMO_SPRINT_01: TECHNICAL_PASS / ACCEPTED_AS_VERTICAL_SLICE
```

## Accepted core freeze point

```text
CORE_IMPLEMENTATION_HEAD: 82bb6018f2fc87d9f1807cab3c12fb5e2e016775
PRIMARY_CLASSIFICATION: REBELLION_PERSISTENCE_RUNTIME_VERTICAL_SLICE_IMPLEMENTED
PERSISTENCE_FORMAT: V8
GATE1F: NOT_READY
V02: NOT_STARTED
```

The GameBuilders branch is a presentation/client/scenario overlay on this accepted core. It does not alter accepted persistence or claim Gate 1F completion.

## GameBuilders reviewed result

```text
WORK_BRANCH: gamebuilders-demo-sprint-01
REVIEW_BASE: 82bb6018f2fc87d9f1807cab3c12fb5e2e016775
REVIEWED_HEAD: ee4b282c767538c39bbf8379528d16761d3d4878
DEPLOYED_SOURCE_HEAD: 2a454a9b3f539cc7a74c1beb724af7c4b170004d
PLAYABLE_LOCAL: YES
SITES_STATUS: DEPLOYED
SITES_URL: https://too-many-revolutions-gamebuilders.leeje92.chatgpt.site
TIME_FLOW_STATUS: PASS
DEMO_HORIZON_STATUS: STRONG_SHORT_HORIZON_LATE_STALL
TECHNICAL_PLAYABILITY: PASS
SUBMISSION_READY: CONDITIONAL_POLISH_REQUIRED
```

Independent review confirmed seven commits over the FIX23 base and a focused change set: product shell/UI, deterministic GameBuilders scenario, demo runtime helpers/tests, time-flow controls, 0–20y audit, Sites packaging, QA and capture docs. The browser client submits interventions through the common ActionProposal/ActionRecord path and advances every simulated day through `runSimulationStep -> commitSimulationStep`.

No direct UI WorldState mutation, scripted/scheduled crisis, fake Agenda/EventStore facts, new F05 evidence/settlement runtime, persistence V9, Three.js, server/LLM dependency, or unlicensed external media was added.

## Product-QC findings before final submission

The vertical slice is technically playable, but three short follow-up fixes are required before treating it as final-submission polished:

- remove player-facing developer jargon and raw domain IDs. Current UI still exposes phrases such as `Renderer-neutral read model`, `authoritative history`, `LandHex projection`, `ActionRecord`, `T018`, and `RunOutcome`, and the region inspector displays raw ideology IDs rather than catalog names;
- correct `RESOURCE_SHORTAGE_CHANGED` display to read the authoritative payload field `scarcity`; the current UI asks for `nextScarcity`, which does not exist in the event producer and can display a false zero;
- revise the 3-minute capture route to intentionally follow a deterministic real crisis trajectory when feasible. The current shot list allows a no-crisis capture even though the horizon audit demonstrates real rebellion/coup emergence in deterministic trajectories.

## Horizon / pacing status

The deterministic audit used the same daily authoritative pipeline and seed across no-action, material relief, political accommodation, legalization, and coercive trajectories at Days 0/90/180/360/720/1080/1800/3600/7200.

```text
DEMO_HORIZON_STATUS: STRONG_SHORT_HORIZON_LATE_STALL
```

Short/medium play is active and meaningful, but late conflicts can become structurally stalled. With the shipped presentation scheduler, 3x means roughly 300 ms per simulated day, so uninterrupted play can reach Day 720 in about 3.6 minutes and Day 1080 in about 5.4 minutes. This is a real hands-on demo risk for long continuous sessions and must not be hidden by UI speed or fake resolution. Gate 1F remains NOT_READY.

## Overnight continuation

```text
F05_FIX24: COMPLETE / AWAITING_CHATGPT_REVIEW
F05_FIX24_REVIEW_BRANCH_HEAD: 4553ac1029803cb01b821c3c78db64978d1c1b98
F05_FIX24_PRIMARY_CLASSIFICATION_REPORTED: REBELLION_EVIDENCE_REQUIRES_NEW_OPERATIONAL_SUPPORT_DOMAINS
F05_FIX25_CONDITIONAL_DESIGN_MEMO: CREATED / NON_AUTHORITATIVE
F05_FIX25_IMPLEMENTATION: NOT_AUTHORIZED
```

The F05_FIX24 branch is three commits ahead of FIX23 and changes only the grounding document, result document, and conditional F05_FIX25 design memo. No production/test/persistence changes were made on that branch. F05_FIX24 remains awaiting independent acceptance; the memo is planning only.

## Current authorization

```text
CURRENT_TASK_ID: NONE
CURRENT_TASK_STATUS: WAITING_FOR_USER_NEXT
NEXT_AUTHORIZED_TASK_ID: NONE
```

## Preserved architecture constraints

- player = CountryId continuity, not Government;
- Government transition remains nonterminal;
- physical territorial authority remains only LandHex controller state;
- Region.stateControl is not territorial ownership;
- fronts remain derived;
- no direct UI WorldState mutation;
- no fake/scheduled coup, rebellion, Agenda, EventStore history, or story progression;
- no `0 LandHex -> defeat/dissolution`;
- no `NO_ACTIVE_FRONT_EDGE -> peace`;
- State Dissolution remains T023-owned;
- no generic political/persistence/pacing score;
- no timer/RNG cheat to shorten the demo;
- no unreviewed F05 operational-evidence or settlement implementation;
- accepted persistence remains V8;
- no V02 until Gate 1F PASS.
