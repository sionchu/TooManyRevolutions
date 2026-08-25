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
REVIEW_BRANCH: f05-fix23-review
REVIEW_BASE: e6912f2ac643079ed8347fb496b7d1d10033aa41
REVIEWED_HEAD: 82bb6018f2fc87d9f1807cab3c12fb5e2e016775
PRIMARY_CLASSIFICATION: REBELLION_PERSISTENCE_RUNTIME_VERTICAL_SLICE_IMPLEMENTED
RUNTIME_STATE: CONFLICT_SCOPED_BOOTSTRAP_EPISODE
BOOTSTRAP_SOURCE: EXISTING_REBELLION_STARTED_EVENT
BOOTSTRAP_PROVES_CONTINUED_CAPACITY: NO
PROFILE_BINDING: EXACT_COUNTRY_FACTION_PROFILE
OPERATIONAL_EVIDENCE_WRITER: NOT_IMPLEMENTED
OPERATIONAL_COLLAPSE_WRITER: NOT_IMPLEMENTED
SETTLEMENT_DOMAIN: NOT_IMPLEMENTED
T018_CREATION_OWNER: UNCHANGED
T021_T022_T023: UNCHANGED
TERRITORIAL_WRITER: NO
PERSISTENCE_FORMAT: V8
LATE_STATE_IMPROVEMENT_CLAIMED: NO
NEXT_IMPLEMENTATION_READINESS: REBELLION_OPERATIONAL_EVIDENCE_SOURCE_GROUNDING
```

The accepted FIX23 slice binds a newly T018-created rebellion Conflict to one exact authored RebellionPersistenceProfile and the same existing `REBELLION_STARTED` GameEvent. The Conflict-scoped episode stores bootstrap identity/provenance only and is not operational continuity evidence. Initial authored rebellions do not fabricate episodes, and resolved rebellions may retain the episode as historical provenance.

V8 strictly serializes/decodes the episode map and validates Conflict/profile/Country/Faction/tick/source-event closure. V7 and older snapshots are rejected without silent migration. Verification reported focused FIX23 tests PASS, focused persistence regression PASS, format/typecheck/lint/build PASS, T018/T021/T024/F04B/F05/F05_FIX9 inspections PASS, full-suite assertions PASS at 63 files / 553 assertions with only the known post-assertion Vitest `onTaskUpdate` IPC runner error, and `git diff --check` PASS.

## Authorization

```text
CURRENT_TASK_ID: NONE
CURRENT_TASK_STATUS: WAITING_FOR_USER_NEXT
F05_FIX24: NOT_AUTHORIZED
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
- no hidden scalar threshold, quorum, weight, or automatic decay;
- persistence authoring is not runtime evidence;
- bootstrap episode presence is not continued-capacity evidence;
- no operational evidence/collapse writer yet;
- no Faction/Region/LandHex/front observation promoted to persistence evidence;
- settlement acceptance is not implementation or completed peace;
- no direct crisis deletion by intervention;
- no LLM direct state mutation;
- coup autonomous response remains ungrounded at current scope;
- no FUND_MOVEMENT extension;
- no V02 until Gate 1F PASS.
