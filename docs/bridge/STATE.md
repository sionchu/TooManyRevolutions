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
PERSISTENCE_FORMAT: V7_UNCHANGED
```

The accepted persistence authoring design is optional ScenarioDefinition metadata. Operational channels and profile membership are allow-lists for future typed evidence only; they are not current evidence, score, threshold, territorial authority, or a pre-authored outcome. Settlement/demobilization/suppression remains a separate domain.

## Current authorization

```text
CURRENT_TASK_ID: F05_FIX22
CURRENT_TASK_STATUS: AUTHORIZED
TASK_FILE: docs/bridge/tasks/F05_FIX22.md
IMPLEMENTATION_BASE: 79046aa292e22ff7afb0289f8d7895ba38d8a8ab
REVIEW_BRANCH: f05-fix22-review
NEXT_AUTHORIZED_TASK_ID: F05_FIX22
```

F05_FIX22 implements only the static Rebellion Persistence authoring seam and validation. It must not create runtime persistence state/evidence, settlement state, ActionRecord/GameEvent writers, Conflict outcomes, LandHex effects, or persistence V8.

Expected successful next readiness:

```text
REBELLION_PERSISTENCE_RUNTIME_VERTICAL_SLICE
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
- no hidden scalar threshold, quorum, weight, or automatic decay;
- persistence authoring is not runtime evidence;
- no Faction/Region/LandHex/front observation promoted to persistence evidence;
- settlement acceptance is not implementation or completed peace;
- no direct crisis deletion by intervention;
- no LLM direct state mutation;
- coup autonomous response remains ungrounded at current scope;
- no FUND_MOVEMENT extension;
- persistence remains V7 in F05_FIX22;
- no V02 until Gate 1F PASS;
- no F05_FIX23 self-authorization.
