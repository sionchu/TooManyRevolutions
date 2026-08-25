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
F05_FIX20: REBELLION_PERSISTENCE_AND_SETTLEMENT_REQUIRE_SEPARATE_DOMAINS / PASS / ACCEPTED
```

## F05_FIX20 accepted result

```text
REVIEWED_HEAD: 510e971f38b52343055285a585d851a5baae283f
PRIMARY_CLASSIFICATION: REBELLION_PERSISTENCE_AND_SETTLEMENT_REQUIRE_SEPARATE_DOMAINS
EXISTING_BEHAVIOR_CLASSIFICATION: PARTIAL_BUT_INCOMPLETE
EXISTING_WORLDSTATE_PERSISTENCE_SUFFICIENT: NO
EXISTING_WORLDSTATE_TERMINATION_SUFFICIENT: NO
NO_FRONT_MEANS_PEACE: NO
ZERO_LANDHEX_MEANS_DEFEAT: NO
PERSISTENCE_FORMAT: V7_UNCHANGED
NEXT_IMPLEMENTATION_READINESS: REBELLION_DOMAIN_SPLIT_REQUIRED
```

The rebellion path must separate conflict-scoped operational persistence from negotiated settlement/demobilization/suppression closure. Territorial fronts remain derived and are not lifecycle authority.

## Current authorization

```text
CURRENT_TASK_ID: F05_FIX21
CURRENT_TASK_STATUS: AUTHORIZED
TASK_FILE: docs/bridge/tasks/F05_FIX21.md
IMPLEMENTATION_BASE: 510e971f38b52343055285a585d851a5baae283f
REVIEW_BRANCH: f05-fix21-review
NEXT_AUTHORIZED_TASK_ID: F05_FIX21
```

F05_FIX21 is docs-only domain split design. It must produce precise minimum schema/writer boundaries for persistence and settlement/demobilization and select the first implementation direction. No production mutation is authorized.

## Preserved architecture constraints

- player = CountryId continuity, not Government;
- Government transition is nonterminal;
- physical territorial authority only through LandHex controller state;
- Region.stateControl is not territorial ownership;
- fronts are derived, not authoritative;
- no `0 LandHex -> defeat/dissolution`;
- no `NO_ACTIVE_FRONT_EDGE -> peace`;
- State Dissolution remains T023-owned;
- no random/timer hidden conflict resolution;
- no generic rebellion persistence/strength/progress/suppression score;
- no hidden scalar threshold or automatic decay;
- no direct crisis deletion by intervention;
- settlement acceptance alone is not completed peace;
- no LLM direct state mutation;
- coup autonomous response remains ungrounded at current scope;
- no FUND_MOVEMENT extension;
- no persistence V8 in F05_FIX21;
- no V02 until Gate 1F PASS;
- no F05_FIX22 self-authorization.
