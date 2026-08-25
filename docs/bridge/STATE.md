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
REVIEW_BASE: ccde3f4299b39d03ee80f097381c1efd4dd678e6
REVIEWED_HEAD: e300fb2e51435e0f1eeedc1c2dd3db006ac0c08e
PRIMARY_CLASSIFICATION: COUP_RESPONSE_SOURCE_EXTERNAL_INPUT_ONLY_AT_CURRENT_SCOPE
EXISTING_WORLDSTATE_SUFFICIENT: NO
GENERIC_SCALAR_INFERENCE_ALLOWED: NO
RANDOM_OR_TIMER_ALLOWED: NO
PREAUTHORED_ALIGNMENT_ALLOWED: NO
LLM_DIRECT_MUTATION_ALLOWED: NO
FIX18_RESPONSE_SEAM_REUSED: YES
PERSISTENCE_FORMAT: V7_UNCHANGED
NEXT_IMPLEMENTATION_READINESS: EXPLICIT_RESPONSE_INPUT_INTEGRATION_ONLY
```

The accepted grounding finds no existing authoritative node-level information, expectation, command, or public-signal domain sufficient to generate autonomous `incumbent | coup` responses. Existing Country/Faction/Government/Agenda/Region/territorial scalars and labels cannot be promoted into a response writer. RNG, timers, hidden scores, pre-authored final alignment, node-name inference, and direct LLM mutation remain forbidden.

The currently grounded response source is therefore explicit schema-valid external input entering the existing F05_FIX18 `COUP_COORDINATION_RESPONSE` ActionRecord path. This is a replayable input boundary, not evidence that autonomous coup coordination has been solved, and it makes no Gate 1F pacing-improvement claim.

## Authorization

```text
CURRENT_TASK_ID: NONE
CURRENT_TASK_STATUS: WAITING_FOR_USER_NEXT
F05_FIX20: NOT_AUTHORIZED
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
- no pre-authored initial coup-node alignment;
- no autonomous coup-node response producer at the accepted current scope;
- no FUND_MOVEMENT extension;
- rebellion persistence remains unresolved and separate;
- no V02 until Gate 1F PASS.
