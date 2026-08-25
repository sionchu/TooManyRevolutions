# TMR Bridge State

UPDATED: 2026-08-26
REPOSITORY: sionchu/TooManyRevolutions
BRANCH: master
CURRENT_GATE: Gate 1F
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
```

## F05_FIX23 accepted result

```text
REVIEWED_HEAD: 82bb6018f2fc87d9f1807cab3c12fb5e2e016775
PRIMARY_CLASSIFICATION: REBELLION_PERSISTENCE_RUNTIME_VERTICAL_SLICE_IMPLEMENTED
RUNTIME_STATE: CONFLICT_SCOPED_BOOTSTRAP_EPISODE
BOOTSTRAP_SOURCE: EXISTING_REBELLION_STARTED_EVENT
BOOTSTRAP_PROVES_CONTINUED_CAPACITY: NO
PROFILE_BINDING: EXACT_COUNTRY_FACTION_PROFILE
OPERATIONAL_EVIDENCE_WRITER: NOT_IMPLEMENTED
OPERATIONAL_COLLAPSE_WRITER: NOT_IMPLEMENTED
SETTLEMENT_DOMAIN: NOT_IMPLEMENTED
PERSISTENCE_FORMAT: V8
NEXT_IMPLEMENTATION_READINESS: REBELLION_OPERATIONAL_EVIDENCE_SOURCE_GROUNDING
```

The accepted bootstrap episode is Conflict-scoped identity/provenance only. It is not positive evidence of organizational continuity, command continuity, logistics access, external support, or any other continuing operational capacity.

## Current authorization

```text
CURRENT_TASK_ID: F05_FIX24
CURRENT_TASK_STATUS: AUTHORIZED
TASK_FILE: docs/bridge/tasks/F05_FIX24.md
IMPLEMENTATION_BASE: 82bb6018f2fc87d9f1807cab3c12fb5e2e016775
REVIEW_BRANCH: f05-fix24-review
NEXT_AUTHORIZED_TASK_ID: F05_FIX24
```

F05_FIX24 is docs-only operational-evidence source grounding. It must evaluate each of the four authored channel kinds independently and determine whether current typed state/events are sufficient, only explicit external input is defensible, or new authoritative operational-support domains are required before any positive evidence writer is implemented.

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
- FIX23 bootstrap episode is not positive operational evidence;
- Faction organization/resources/grievance/influence are not operational evidence by threshold;
- currentStrategy is not command continuity;
- foreignLinks is not external-support evidence;
- ContactGraph connectivity is not logistics evidence;
- LandHex/front observations are not persistence evidence;
- existing Intervention/FUND_MOVEMENT/Political Proposal events may not be relabeled without exact semantic support;
- settlement acceptance is not implementation or completed peace;
- no direct crisis deletion by intervention;
- no LLM direct state mutation;
- coup autonomous response remains ungrounded at current scope;
- persistence remains V8 in F05_FIX24;
- no V02 until Gate 1F PASS;
- no F05_FIX25 self-authorization.
