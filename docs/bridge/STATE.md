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
REVIEWED_HEAD: e6912f2ac643079ed8347fb496b7d1d10033aa41
PRIMARY_CLASSIFICATION: REBELLION_PERSISTENCE_AUTHORING_SEAM_IMPLEMENTED
AUTHORING_SCOPE: STATIC_SCENARIO_ONLY
CHANNELS_ARE_CURRENT_EVIDENCE: NO
RUNTIME_PERSISTENCE_EPISODE: NOT_IMPLEMENTED
RUNTIME_EVIDENCE: NOT_IMPLEMENTED
PERSISTENCE_FORMAT: V7_UNCHANGED
NEXT_IMPLEMENTATION_READINESS: REBELLION_PERSISTENCE_RUNTIME_VERTICAL_SLICE
```

The accepted FIX22 seam is optional ScenarioDefinition metadata only. Rebellion operational channels/profile membership are future typed-evidence allow-lists, not current evidence, a score, a threshold, territorial authority, or a pre-authored outcome.

## Current authorization

```text
CURRENT_TASK_ID: F05_FIX23
CURRENT_TASK_STATUS: AUTHORIZED
TASK_FILE: docs/bridge/tasks/F05_FIX23.md
IMPLEMENTATION_BASE: e6912f2ac643079ed8347fb496b7d1d10033aa41
REVIEW_BRANCH: f05-fix23-review
NEXT_AUTHORIZED_TASK_ID: F05_FIX23
```

F05_FIX23 may add only a Conflict-scoped bootstrap episode when T018 actually creates a new rebellion under an exact authored persistence profile, tied to the existing REBELLION_STARTED event. This episode is runtime identity/provenance only and is not positive operational persistence evidence.

Because this adds authoritative WorldState, candidate persistence for FIX23 is V8, subject to independent review. Until FIX23 is accepted, the project-wide accepted persistence contract remains V7.

Expected successful next readiness:

```text
REBELLION_OPERATIONAL_EVIDENCE_SOURCE_GROUNDING
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
- no operational evidence/collapse writer in F05_FIX23;
- no Faction/Region/LandHex/front observation promoted to persistence evidence;
- settlement acceptance is not implementation or completed peace;
- no direct crisis deletion by intervention;
- no LLM direct state mutation;
- coup autonomous response remains ungrounded at current scope;
- no FUND_MOVEMENT extension;
- no V02 until Gate 1F PASS;
- no F05_FIX24 self-authorization.
