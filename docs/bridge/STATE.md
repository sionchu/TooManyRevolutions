# TMR Bridge State

UPDATED: 2026-08-25
REPOSITORY: sionchu/TooManyRevolutions
BRANCH: master
CURRENT_GATE: Gate 1F
GATE1F_CHATGPT_DECISION: NOT_READY
V02: NOT_STARTED
PERSISTENCE_ACCEPTED: SerializedSimulationSnapshotV7 / format version 7

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
```

## F05_FIX19 accepted result

```text
REVIEW_BRANCH: f05-fix19-review
REVIEWED_HEAD: e300fb2e51435e0f1eeedc1c2dd3db006ac0c08e
PRIMARY_CLASSIFICATION: COUP_RESPONSE_SOURCE_EXTERNAL_INPUT_ONLY_AT_CURRENT_SCOPE
EXISTING_WORLDSTATE_SUFFICIENT: NO
FIX18_RESPONSE_SEAM_REUSED: YES
PERSISTENCE_FORMAT: V7_UNCHANGED
NEXT_IMPLEMENTATION_READINESS: EXPLICIT_RESPONSE_INPUT_INTEGRATION_ONLY
```

The coup path remains valid for explicit schema-grounded external responses but has no accepted autonomous node-response producer. It therefore does not by itself close Gate 1F late-state silence.

## Current authorization

```text
CURRENT_TASK_ID: F05_FIX20
CURRENT_TASK_STATUS: AUTHORIZED
TASK_FILE: docs/bridge/tasks/F05_FIX20.md
IMPLEMENTATION_BASE: e300fb2e51435e0f1eeedc1c2dd3db006ac0c08e
REVIEW_BRANCH: f05-fix20-review
NEXT_AUTHORIZED_TASK_ID: F05_FIX20
```

F05_FIX20 is docs-only rebellion persistence/settlement grounding. It must determine the minimal historically and architecturally defensible explanation for an active rebellion with no active territorial front edge, and distinguish persistence from settlement/suppression/demobilization before any new writer is implemented.

## Preserved architecture constraints

- player = CountryId continuity, not Government;
- Government transition is nonterminal;
- physical territorial authority only through LandHex controller state;
- Region.stateControl is not territorial ownership;
- no fake coup or rebellion LandHex writer;
- no `0 LandHex -> defeat/dissolution`;
- no `NO_ACTIVE_FRONT_EDGE -> peace`;
- State Dissolution remains T023-owned;
- no random/timer/majority hidden conflict resolution;
- no generic insurgency/suppression/progress score;
- no direct crisis deletion by intervention;
- no LLM direct state mutation;
- coup autonomous response remains ungrounded at current scope;
- no FUND_MOVEMENT extension;
- no persistence V8 in F05_FIX20;
- no V02 until Gate 1F PASS;
- no F05_FIX21 self-authorization.
