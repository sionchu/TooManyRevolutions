# TMR Bridge State

UPDATED: 2026-08-26
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
F05_FIX21: REBELLION_SPLIT_MINIMAL_DOMAINS_DESIGNABLE / PASS / ACCEPTED
```

## F05_FIX21 accepted result

```text
REVIEW_BRANCH: f05-fix21-review
REVIEW_BASE: 510e971f38b52343055285a585d851a5baae283f
REVIEWED_HEAD: 79046aa292e22ff7afb0289f8d7895ba38d8a8ab
PRIMARY_CLASSIFICATION: REBELLION_SPLIT_MINIMAL_DOMAINS_DESIGNABLE
FIRST_IMPLEMENTATION_DIRECTION: PERSISTENCE_AUTHORING_FIRST
NEXT_IMPLEMENTATION_READINESS: REBELLION_PERSISTENCE_AUTHORING_SEAM
PERSISTENCE_DOMAIN_SEPARATE: YES
SETTLEMENT_DOMAIN_SEPARATE: YES
NO_FRONT_MEANS_PEACE: NO
ZERO_LANDHEX_MEANS_DEFEAT: NO
GENERIC_SCORE_ALLOWED: NO
RANDOM_OR_TIMER_ALLOWED: NO
DIRECT_CONFLICT_DELETE_ALLOWED: NO
FREE_LANDHEX_WRITER_ALLOWED: NO
LLM_DIRECT_MUTATION_ALLOWED: NO
PERSISTENCE_FORMAT: V7_UNCHANGED
```

The accepted persistence authoring design is scenario-owned and optional. Typed operational channels/profile membership are an allow-list for future evidence references, not current evidence, magnitude, weight, quorum, threshold, timer, territorial authority, or a pre-authored outcome. Old scenarios with absent/empty authoring retain current behavior.

The accepted settlement design remains a separate future domain. Proposal/negotiation/acceptance, implementation/compliance or breach, demobilization/suppression evidence, and closure are distinct. Acceptance alone cannot resolve Conflict. Any future closure must validate explicit evidence and reach the existing typed Conflict outcome boundary; State Dissolution remains T023-owned.

## Authorization

```text
CURRENT_TASK_ID: NONE
CURRENT_TASK_STATUS: WAITING_FOR_USER_NEXT
F05_FIX22: NOT_AUTHORIZED
NEXT_AUTHORIZED_TASK_ID: NONE
```

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
- persistence authoring is not runtime evidence;
- settlement acceptance is not implementation or completed peace;
- no direct crisis deletion by intervention;
- no LLM direct state mutation;
- coup autonomous response remains ungrounded at current scope;
- no FUND_MOVEMENT extension;
- no persistence V8 until an authorized runtime seam requires it;
- no V02 until Gate 1F PASS.
