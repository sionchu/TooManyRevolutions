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

## F05_FIX17 review status

```text
TASK_ID: F05_FIX17
REVIEW_BRANCH: f05-fix17-review
REVIEW_BASE: d3908e1f30390131e12cced6e1b80bd03c5c1a4f
REVIEWED_HEAD: ce425ddc063e20186476acf9f4fcf0676e52195b
ARCHITECTURE_SCOPE_REVIEW: PROVISIONALLY_ACCEPTABLE
FINAL_CHATGPT_DECISION: CORRECTION_AND_VERIFICATION_REQUIRED
REPORTED_PRIMARY_CLASSIFICATION: COUP_COORDINATION_AUTHORING_SEAM_IMPLEMENTED
REPORTED_NEXT_READINESS: COUP_COORDINATION_RUNTIME_VERTICAL_SLICE
```

The GitHub implementation diff has now been independently reviewed. It stays within the intended static authoring boundary. Final acceptance is withheld for one correctness fix in exact profile-pair uniqueness and completion of the required verification suite.

## Required FIX17 correction

Profile uniqueness must represent the exact `(countryId, coupFactionId)` pair without delimiter-string collision. A regression test must cover distinct IDs that would collide under naive delimiter joining.

Root `HANDOFF.md` is workflow residue and should be removed. The result document must be refreshed after the final verification and review-branch publication.

## Authorization

```text
CURRENT_TASK_ID: F05_FIX17
CURRENT_TASK_STATUS: CORRECTION_AND_VERIFICATION_REQUIRED
F05_FIX18: NOT_AUTHORIZED
NEXT_AUTHORIZED_TASK_ID: NONE
```

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
