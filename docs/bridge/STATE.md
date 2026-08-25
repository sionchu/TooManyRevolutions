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
REVIEWED_HEAD: ccde3f4299b39d03ee80f097381c1efd4dd678e6
PRIMARY_CLASSIFICATION: COUP_COORDINATION_RUNTIME_VERTICAL_SLICE_IMPLEMENTED
RUNTIME_STATE: SPARSE_DECISIVE_NODE_RESPONSES_BY_COUP_CONFLICT
ACTION_TYPE: COUP_COORDINATION_RESPONSE
OUTCOME_SINK: EXISTING_APPLY_CONFLICT_OUTCOME
AUTONOMOUS_RESPONSE_PRODUCER: NO
PERSISTENCE_FORMAT: V7
NEXT_IMPLEMENTATION_READINESS: COUP_COORDINATION_RESPONSE_SOURCE_GROUNDING
```

The accepted FIX18 seam resolves only explicit decisive node responses. It does not justify how production node responses are generated.

## Current authorization

```text
CURRENT_TASK_ID: F05_FIX19
CURRENT_TASK_STATUS: AUTHORIZED
TASK_FILE: docs/bridge/tasks/F05_FIX19.md
IMPLEMENTATION_BASE: ccde3f4299b39d03ee80f097381c1efd4dd678e6
REVIEW_BRANCH: f05-fix19-review
NEXT_AUTHORIZED_TASK_ID: F05_FIX19
```

F05_FIX19 is docs-only Coup Coordination response-source grounding. It must determine whether a minimal signal/decision domain is historically and architecturally defensible before any autonomous producer is implemented.

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
- no pre-authored initial coup-node alignment;
- no autonomous coup-node response producer until separately grounded and authorized;
- no FUND_MOVEMENT extension;
- rebellion persistence remains unresolved and separate;
- no persistence V8 in F05_FIX19;
- no V02 until Gate 1F PASS;
- no F05_FIX20 self-authorization.
