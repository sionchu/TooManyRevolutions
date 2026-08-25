# TMR Bridge State

UPDATED: 2026-08-25
REPOSITORY: sionchu/TooManyRevolutions
BRANCH: master
CURRENT_GATE: Gate 1F
GATE1F_CHATGPT_DECISION: NOT_READY
V02: NOT_STARTED
PERSISTENCE: SerializedSimulationSnapshotV6 / format version 6

## Accepted progression

```text
F04: CLOSED / PASS
F05: measurement complete; Gate 1F NOT_READY
F05_FIX1..F05_FIX14: accepted progression; FUND_MOVEMENT route closed as pacing remedy
F05_FIX15: War-as-Politics requires new authoritative domain
F05_FIX16: COUP_COORDINATION_MINIMAL_DOMAIN_DESIGNABLE / PASS / ACCEPTED
F05_FIX17: COUP_COORDINATION_AUTHORING_SEAM_IMPLEMENTED / PASS / ACCEPTED
```

## F05_FIX17 accepted result

```text
REVIEWED_HEAD: 5863d46563b1d7ed6dc5d65a40e1965817662707
PRIMARY_CLASSIFICATION: COUP_COORDINATION_AUTHORING_SEAM_IMPLEMENTED
AUTHORING_SCOPE: STATIC_SCENARIO_ONLY
REQUIRED_SET_SEMANTIC: AUTHORED_NECESSARY_SET
RUNTIME_ALIGNMENT_STATE: NO
RUNTIME_ACTION_SCHEMA_CHANGE: NO
COUP_OUTCOME_WRITER: NO
PERSISTENCE_FORMAT: V6_UNCHANGED
NEXT_IMPLEMENTATION_READINESS: COUP_COORDINATION_RUNTIME_VERTICAL_SLICE
```

Verification: format/typecheck/lint/build/focused FIX17 tests and required inspections pass; full-suite assertions pass at 60 files / 489 tests. The known Vitest `onTaskUpdate` runner/IPC process error remains separate from assertion status.

## Current authorization

```text
CURRENT_TASK_ID: F05_FIX18
CURRENT_TASK_STATUS: AUTHORIZED
TASK_FILE: docs/bridge/tasks/F05_FIX18_AUTHORIZED.md
IMPLEMENTATION_BASE: 5863d46563b1d7ed6dc5d65a40e1965817662707
REVIEW_BRANCH: f05-fix18-review
NEXT_AUTHORIZED_TASK_ID: F05_FIX18
```

F05_FIX18 implements the minimal explicit-response Coup Coordination runtime vertical slice and persistence V7. It does not authorize an autonomous response producer and must not claim Gate 1F pacing improvement merely because the explicit response path exists.

Expected successful next readiness:

```text
COUP_COORDINATION_RESPONSE_SOURCE_GROUNDING
```

## Preserved architecture constraints

- player = CountryId continuity, not Government;
- Government transition is nonterminal;
- physical territorial authority only through LandHex controller state;
- Region.stateControl is not territorial ownership;
- no fake coup LandHex front/writer;
- no `0 LandHex -> defeat/dissolution`;
- State Dissolution remains T023-owned;
- no numeric coup coordination/support/loyalty/inevitability/progress score;
- no random/timer/majority coup resolution;
- no scalar/label/Agenda/territory inference of coup-node alignment;
- no autonomous coup-node response producer in F05_FIX18;
- no FUND_MOVEMENT extension;
- no rebellion persistence implementation in F05_FIX18;
- no V02 until Gate 1F PASS;
- no F05_FIX19 self-authorization.
