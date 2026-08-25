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
```

## F05_FIX18 accepted result

```text
REVIEW_BRANCH: f05-fix18-review
REVIEW_BASE: 5863d46563b1d7ed6dc5d65a40e1965817662707
REVIEWED_HEAD: ccde3f4299b39d03ee80f097381c1efd4dd678e6
PRIMARY_CLASSIFICATION: COUP_COORDINATION_RUNTIME_VERTICAL_SLICE_IMPLEMENTED
RUNTIME_STATE: SPARSE_DECISIVE_NODE_RESPONSES_BY_COUP_CONFLICT
UNCOMMITTED_SEMANTIC: ABSENCE_OF_ACCEPTED_DECISIVE_RESPONSE
ACTION_TYPE: COUP_COORDINATION_RESPONSE
DECISIVE_ALIGNMENTS: incumbent | coup
REQUIRED_SET_SEMANTIC: AUTHORED_NECESSARY_SET
OUTCOME_RULE: ANY_INCUMBENT_STATUS_QUO__ALL_COUP_GOVERNMENT_TRANSITION__ELSE_ACTIVE
OUTCOME_SINK: EXISTING_APPLY_CONFLICT_OUTCOME
DIRECT_GOVERNMENT_WRITER: NO
TERRITORIAL_COUP_WRITER: NO
AUTONOMOUS_RESPONSE_PRODUCER: NO
PERSISTENCE_FORMAT: V7
LATE_STATE_IMPROVEMENT_CLAIMED: NO
NEXT_IMPLEMENTATION_READINESS: COUP_COORDINATION_RESPONSE_SOURCE_GROUNDING
```

The accepted runtime slice records only explicit decisive node responses. Business-invalid accepted response actions emit bounded deterministic `COUP_COORDINATION_RESPONSE_REJECTED` evidence and do not mutate response state or Conflict outcomes. No autonomous response producer, random/timer/score inference, LandHex coup writer, direct Government writer outside the existing conflict outcome sink, T023 coup dissolution writer, or FUND_MOVEMENT extension was added.

Verification: format/typecheck/lint/build, focused FIX18 tests, persistence/baseline set, T018/T024/F05/F05_FIX9/F05_FIX14 inspections, and `git diff --check` pass. Full-suite assertions pass at 61 files / 516 tests; the remaining nonzero process exit is the known Vitest `onTaskUpdate` runner/IPC issue after assertions.

## Authorization

```text
CURRENT_TASK_ID: NONE
CURRENT_TASK_STATUS: WAITING_FOR_USER_NEXT
F05_FIX19: NOT_AUTHORIZED
NEXT_AUTHORIZED_TASK_ID: NONE
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
- no autonomous coup-node response producer unless separately grounded and authorized;
- no FUND_MOVEMENT extension;
- rebellion persistence remains unresolved and separate;
- no V02 until Gate 1F PASS.
