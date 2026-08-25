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
```

## F05_FIX17 current status

```text
TASK_ID: F05_FIX17
IMPLEMENTATION_STATUS: IMPLEMENTED_LOCALLY
CHATGPT_REVIEW_STATUS: NOT_YET_REVIEWED_FROM_GITHUB_DIFF
REVIEW_BRANCH: f05-fix17-review
REVIEW_BASE: d3908e1f30390131e12cced6e1b80bd03c5c1a4f
REPORTED_PRIMARY_CLASSIFICATION: COUP_COORDINATION_AUTHORING_SEAM_IMPLEMENTED
REPORTED_NEXT_READINESS: COUP_COORDINATION_RUNTIME_VERTICAL_SLICE
```

The reported FIX17 result is not accepted until the implementation/result is published to GitHub and independently reviewed against repository evidence.

## Authorization

```text
CURRENT_TASK_ID: F05_FIX17
CURRENT_TASK_STATUS: AWAITING_GITHUB_REVIEW_UPLOAD
F05_FIX18: NOT_AUTHORIZED
NEXT_AUTHORIZED_TASK_ID: NONE
```

The previously drafted F05_FIX18 authorization was premature and has been revoked.

## Normal Bridge workflow

```text
ChatGPT writes task to GitHub
-> Codex Desktop new chat reads GitHub task
-> Codex implements/tests in the active local repo
-> Codex commits and publishes implementation/result to GitHub
-> user reports completion
-> ChatGPT reviews actual GitHub diff/tests/result
-> PASS/REJECT
-> only after PASS does ChatGPT authorize the next task
```

Codex does not need local Bridge metadata freshness merely to read the GitHub task. Bridge synchronization mechanics must not replace actual implementation review.

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
