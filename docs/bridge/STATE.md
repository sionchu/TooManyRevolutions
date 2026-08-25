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
F05_FIX22: REBELLION_PERSISTENCE_AUTHORING_SEAM_IMPLEMENTED / PASS / ACCEPTED
```

## F05_FIX22 accepted result

```text
REVIEW_BRANCH: f05-fix22-review
REVIEW_BASE: 79046aa292e22ff7afb0289f8d7895ba38d8a8ab
REVIEWED_HEAD: e6912f2ac643079ed8347fb496b7d1d10033aa41
PRIMARY_CLASSIFICATION: REBELLION_PERSISTENCE_AUTHORING_SEAM_IMPLEMENTED
AUTHORING_SCOPE: STATIC_SCENARIO_ONLY
CHANNEL_KINDS: organizationalContinuity | commandContinuity | logisticsAccess | externalSupport
PROFILE_IDENTITY: COUNTRY_AND_FACTION
CHANNELS_ARE_CURRENT_EVIDENCE: NO
PROFILE_IS_SCORE_OR_THRESHOLD: NO
RUNTIME_PERSISTENCE_EPISODE: NOT_IMPLEMENTED
RUNTIME_EVIDENCE: NOT_IMPLEMENTED
SETTLEMENT_DOMAIN: NOT_IMPLEMENTED
T018_T021_T022_T023: UNCHANGED
PERSISTENCE_FORMAT: V7_UNCHANGED
NEXT_IMPLEMENTATION_READINESS: REBELLION_PERSISTENCE_RUNTIME_VERTICAL_SLICE
```

The accepted static seam adds optional ScenarioDefinition rebellion operational channels and Country/Faction persistence profiles with strict validation. Channel/profile authoring is only an allow-list for future typed evidence references; it is not current persistence evidence, a score, threshold, quorum, territorial writer, or pre-authored outcome. Exact Country/Faction pair uniqueness uses delimiter-safe nested identity logic. Absent/empty authoring preserves current WorldState and gameplay.

Verification reported for FIX22: focused 25-test suite PASS; format/typecheck/lint/build PASS; T018/T021/F04B/F05/F05_FIX9 inspections PASS; full-suite assertions PASS at 62 files / 541 tests, with only the known Vitest `onTaskUpdate` IPC process error after assertions; `git diff --check` PASS. Independent review confirmed the implementation diff is one commit over the accepted FIX21 head and changes only FIX22 docs/result, static IDs/domain/types/validation/tests, and the public export surface.

## Authorization

```text
CURRENT_TASK_ID: NONE
CURRENT_TASK_STATUS: WAITING_FOR_USER_NEXT
F05_FIX23: NOT_AUTHORIZED
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
- no Faction/Region/LandHex/front observation promoted to persistence evidence;
- settlement acceptance is not implementation or completed peace;
- no direct crisis deletion by intervention;
- no LLM direct state mutation;
- coup autonomous response remains ungrounded at current scope;
- no FUND_MOVEMENT extension;
- persistence remains V7 until a separately authorized runtime seam requires a version decision;
- no V02 until Gate 1F PASS.
