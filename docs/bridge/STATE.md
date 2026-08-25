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
REVIEW_BRANCH: f05-fix17-review
REVIEW_BASE: d3908e1f30390131e12cced6e1b80bd03c5c1a4f
REVIEWED_HEAD: 5863d46563b1d7ed6dc5d65a40e1965817662707
PRIMARY_CLASSIFICATION: COUP_COORDINATION_AUTHORING_SEAM_IMPLEMENTED
AUTHORING_SCOPE: STATIC_SCENARIO_ONLY
REQUIRED_SET_SEMANTIC: AUTHORED_NECESSARY_SET
INITIAL_ALIGNMENT_AUTHORED: NO
RUNTIME_ALIGNMENT_STATE: NO
RUNTIME_ACTION_SCHEMA_CHANGE: NO
COUP_OUTCOME_WRITER: NO
PERSISTENCE_FORMAT: V6_UNCHANGED
NEXT_IMPLEMENTATION_READINESS: COUP_COORDINATION_RUNTIME_VERTICAL_SLICE
```

The final correction uses collision-free exact `(countryId, coupFactionId)` profile identity and includes a delimiter-collision regression. No Coup Coordination runtime state, response action, coup outcome writer, Government-transition producer, T018/T021/T022/T023 behavior change, persistence change, or production Gate 1F coup-node content was added.

Verification: format/typecheck/lint/build/focused FIX17 tests and all required inspections pass. Full-suite assertions pass at `60 files / 489 tests`; the remaining process exit is the known Vitest `onTaskUpdate` runner/IPC issue after assertions and is not treated as a gameplay failure.

## Authorization

```text
CURRENT_TASK_ID: NONE
CURRENT_TASK_STATUS: WAITING_FOR_USER_NEXT
F05_FIX18: NOT_AUTHORIZED
NEXT_AUTHORIZED_TASK_ID: NONE
```

## Preserved architecture constraints

- player = CountryId continuity, not Government;
- Government transition is nonterminal;
- physical territorial authority only through LandHex controller state;
- no fake coup LandHex front/writer;
- no `0 LandHex -> defeat/dissolution`;
- State Dissolution remains T023-owned;
- no numeric coup coordination/support/loyalty/inevitability/progress score;
- no random/timer/majority coup resolution;
- no scalar/label inference of coup-node alignment;
- no FUND_MOVEMENT extension;
- no V02 until Gate 1F PASS.
