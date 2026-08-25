# TMR Bridge State

UPDATED: 2026-08-25
REPOSITORY: sionchu/TooManyRevolutions
BRANCH: master
CURRENT_GATE: Gate 1F
GATE1F_CHATGPT_DECISION: NOT_READY
V02: NOT_STARTED
PERSISTENCE_ACCEPTED: SerializedSimulationSnapshotV6 / format version 6

## Accepted progression

```text
F04: CLOSED / PASS
F05: measurement complete; Gate 1F NOT_READY
F05_FIX1..F05_FIX14: accepted progression; FUND_MOVEMENT route closed as pacing remedy
F05_FIX15: War-as-Politics requires new authoritative domain
F05_FIX16: COUP_COORDINATION_MINIMAL_DOMAIN_DESIGNABLE / PASS / ACCEPTED
F05_FIX17: COUP_COORDINATION_AUTHORING_SEAM_IMPLEMENTED / PASS / ACCEPTED
```

## F05_FIX18 review status

```text
TASK_ID: F05_FIX18
REVIEW_BRANCH: f05-fix18-review
REVIEW_BASE: 5863d46563b1d7ed6dc5d65a40e1965817662707
REVIEWED_HEAD: 46958f17803b9b7b9f748f9b11d38564fa571ed6
REPORTED_CLASSIFICATION: COUP_COORDINATION_RUNTIME_VERTICAL_SLICE_IMPLEMENTED
ARCHITECTURE_SCOPE_REVIEW: PROVISIONALLY_ACCEPTABLE
FINAL_CHATGPT_DECISION: REVIEW_CORRECTION_REQUIRED
```

The implementation contains the intended explicit Coup Coordination response path, sparse response state, authored necessary-set outcome evaluation through the existing conflict-outcome sink, and candidate persistence V7. It adds no autonomous response producer, random/timer/score inference, or territorial coup writer.

Final acceptance is withheld because business-invalid `COUP_COORDINATION_RESPONSE` ActionRecords currently no-op silently. The authorized task required repository-consistent rejection provenance. FIX18 must add bounded deterministic rejection evidence without changing gameplay semantics, then rerun the full required verification.

## Authorization

```text
CURRENT_TASK_ID: F05_FIX18
CURRENT_TASK_STATUS: REVIEW_CORRECTION_REQUIRED
NEXT_AUTHORIZED_TASK_ID: NONE
F05_FIX19: NOT_AUTHORIZED
```

Until FIX18 is accepted, the project-wide accepted persistence contract remains V6. V7 is provisional on the FIX18 review branch.

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
- no autonomous coup-node response producer in F05_FIX18;
- no FUND_MOVEMENT extension;
- no rebellion persistence implementation in F05_FIX18;
- no V02 until Gate 1F PASS.
