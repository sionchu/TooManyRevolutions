# TMR Bridge State

UPDATED: 2026-08-25

REPOSITORY: sionchu/TooManyRevolutions
BRANCH: master
CURRENT_GATE: Gate 1F
CURRENT_PHASE: F05_FIX14 FUND_MOVEMENT commitment lifecycle closure — AUTHORIZED

## Key commits

F04_CLOSED_COMMIT: 2db9ccd43b09bc4f24bb6980b5bd200b5464c5fc
F05_MEASUREMENT_COMMIT: 1866287e87072fc9b62f55a4af940f9d0e54b15b
GATE1F_REVIEW_COMMIT: 2423e629b018052d24f495793e10803cd5a0f837
F05_FIX8_IMPLEMENTATION_COMMIT: 89f350bd67ced8e49c161f95fa5e2a1c94066d42
F05_FIX9_RESULT_COMMIT: c373c5ae591911d3650840ae8eac4973d63bde75
F05_FIX10_RESULT_COMMIT: 98985e84a5448e9d2454847f36e11a4c6cfa3732
F05_FIX10_END_COMMIT: 5d8ae1805bff76609a9b9370cb23b52672574e47
F05_FIX11_RESULT_COMMIT: b8869813f6279572001b3bc17f800f4918c98ad8
F05_FIX11_END_COMMIT: 534f4f2ac34a857cb2b837c1902d5fe3c80282a6
F05_FIX12_RESULT_COMMIT: c79f71c62f6d0048a504a125b3975a446d2f4013
F05_FIX12_END_COMMIT: 686df104814f31ef7fad70ab34cee374cc3e98cd
F05_FIX13_TASK_COMMIT: 005c617bd3a9c79651cc7730992e85a592134706
F05_FIX13_IMPLEMENTATION_COMMIT: 69f857fdb9036725014e676c8633977c421b19df
F05_FIX13_RESULT_METADATA_COMMIT: 19fd7a161bb5c95021921a31d5d566ff9c6920b7
F05_FIX14_TASK_COMMIT: 462b928fd35aab7ff09a5c12ca9ecc6b78044aa9

## Accepted gate history

F04: CLOSED / PASS
F05: MEASUREMENT_COMPLETE / REVIEWED
F05_FIX1: PASS / REVIEWED
F05_FIX2: terminal pacing writer rejected by continuity evidence gate
F05_FIX3: PASS / ACCEPTED architecture restoration
F05_FIX4: PASS / ACCEPTED faction ActionProposal intake
F05_FIX5: PASS / ACCEPTED grounding-only; `INSUFFICIENT_ACTION_CONSEQUENCE_GROUNDING`
F05_FIX6: PASS / ACCEPTED political interaction kernel
F05_FIX7: PASS / ACCEPTED long-horizon integration
F05_FIX8: PASS / ACCEPTED state-grounded proposal lifecycle; persistence V4

## ChatGPT acceptance of F05_FIX9

F05_FIX9: COMPLETE / REVIEWED / PASS / ACCEPTED
F05_FIX9_PRIMARY_CLASSIFICATION: LATE_STEADY_STATE_MIXED_CAUSE
F05_FIX9_REPRESENTATIVE_CAUSES: ACTIVE_CONFLICT_EQUILIBRIUM + OUTCOME_ELIGIBILITY_STALEMATE + INTERACTION_COVERAGE_EXHAUSTED
F05_FIX9_EXISTING_BUG_FOUND: NO
F05_FIX9_INTERACTION_COVERAGE_EXHAUSTED: YES
F05_FIX9_ACTIVE_CONFLICT_EQUILIBRIUM: YES
F05_FIX9_OUTCOME_GAP: YES
F05_FIX9_PLAYER_RESPONSE_SET_SATURATED: NO
F05_FIX9_STATE_GROUNDED_MAX_REASSESSMENT_SILENCE: 1200 days
F05_FIX9_POST_INTERVENTION_LATE_SILENCE: 1110 days
F05_FIX9_LATE_SILENCE_POPULATION: 6 ACCEPT branches >720 days
F05_FIX9_GATE1F_RECOMMENDATION: NOT_READY

## ChatGPT acceptance of F05_FIX10

F05_FIX10: COMPLETE / REVIEWED / PASS / ACCEPTED
F05_FIX10_PRIMARY_CLASSIFICATION: COVERAGE_REQUIRES_ACTION_SCHEMA_TARGETING
F05_FIX10_FUND_MOVEMENT_REACHABILITY: 372/372 late-state faction boundaries
F05_FIX10_LOBBY_REACHABILITY: 0/372
F05_FIX10_ORGANIZE_REACHABILITY: 0/372
F05_FIX10_SELECTED_ACTION: FUND_MOVEMENT
F05_FIX10_TARGET_OBJECT_REQUIRED: YES
F05_FIX10_ACTION_SCHEMA_CHANGE_REQUIRED: YES
F05_FIX10_MAGNITUDE_GROUNDING_STATUS: BLOCKED_NO_AUTHORED_MAGNITUDE
F05_FIX10_GATE1F_RECOMMENDATION: NOT_READY

## ChatGPT acceptance of F05_FIX11

F05_FIX11: COMPLETE / REVIEWED / PASS / ACCEPTED
F05_FIX11_PRIMARY_CLASSIFICATION: FUND_MOVEMENT_REQUIRES_NEW_AUTHORING_SEAM
F05_FIX11_FUND_MOVEMENT_SEMANTIC: ALLOCATE_EXISTING_ACTOR_RESOURCES
F05_FIX11_TARGET_DOMAIN: REGION_SINGLE
F05_FIX11_COMMITMENT_SEMANTIC: EARMARK_EXISTING_FACTION_RESOURCES
F05_FIX11_AMOUNT_SEAM: SCENARIO_AUTHORED_AMOUNT_REQUIRED
F05_FIX11_NUMERIC_MAGNITUDE_STATUS: NOT_GROUNDED
F05_FIX11_FIRST_CONSUMER_BOUNDARY: AGENDA_REASSESSMENT
F05_FIX11_REPEAT_BOUNDARY: ACTIVE_SAME_ACTOR_TARGET_BLOCKS_DUPLICATE
F05_FIX11_NEXT_IMPLEMENTATION_READINESS: NONE

## ChatGPT acceptance of F05_FIX12

F05_FIX12: COMPLETE / REVIEWED / PASS / ACCEPTED
F05_FIX12_PRIMARY_CLASSIFICATION: FUND_MOVEMENT_AUTHORING_SEAM_IMPLEMENTED
F05_FIX12_AUTHORING_TYPE: FactionFundMovementTemplate
F05_FIX12_SCENARIO_FIELD: factionFundMovementTemplates
F05_FIX12_TARGET_DOMAIN: REGION_SINGLE
F05_FIX12_TARGET_INFERENCE: FORBIDDEN
F05_FIX12_AMOUNT_OWNERSHIP: SCENARIO_AUTHORED
F05_FIX12_AMOUNT_DEFAULT: NONE
F05_FIX12_AMOUNT_DERIVATION: NONE
F05_FIX12_PROFILE_UNIQUENESS: at most one per Faction
F05_FIX12_NEXT_IMPLEMENTATION_READINESS: TARGETED_COMMITMENT_VERTICAL_SLICE

## ChatGPT acceptance of F05_FIX13

F05_FIX13: COMPLETE / REVIEWED / PASS / ACCEPTED
F05_FIX13_PRIMARY_CLASSIFICATION: TARGETED_COMMITMENT_KERNEL_IMPLEMENTED_BUT_LATE_REASSESSMENT_UNCHANGED
F05_FIX13_NEXT_IMPLEMENTATION_READINESS: COMMITMENT_CONSEQUENCE_OR_LIFECYCLE_REVIEW
F05_FIX13_ACTION_SCHEMA: targeted FUND_MOVEMENT schema version 2; legacy v1 preserved
F05_FIX13_COMMITMENT: authoritative active actor-owned earmark with ActionId/FactionId/RegionId/authored amount provenance
F05_FIX13_AVAILABLE_RESOURCES: derived stock minus active earmarks; no direct Faction.resources debit
F05_FIX13_DUPLICATE_GUARD: active same actor/target blocks second commitment
F05_FIX13_AGENDA: active target/amount visible without severity bonus
F05_FIX13_PERSISTENCE: SerializedSimulationSnapshotV5 / format version 5; V4 rejected
F05_FIX13_LONG_HORIZON: 2 commitments; first tick 31; duplicate success events 0; Agenda exposure 1170 ticks
F05_FIX13_RESOURCE_DEBIT: NONE
F05_FIX13_FORBIDDEN_EFFECT_EVENTS: NONE
F05_FIX13_LATE_REASSESSMENT_CHANGED: NO
F05_FIX13_GATE1F_RECOMMENDATION: NOT_READY

Accepted review note:

- targeted schema-v2 business-invalid inputs currently cannot create a commitment, but application order can allow `currentStrategy = fundMovement` before commitment business validation; F05_FIX14 must harden targeted-v2 semantic atomicity without changing legacy v1 behavior.

## F05_FIX14 authorization

F05_FIX14: AUTHORIZED
F05_FIX14_TASK_FILE: `docs/bridge/tasks/F05_FIX14.md`
F05_FIX14_DIRECTION: close the FUND_MOVEMENT lifecycle question and decide whether this route remains a viable Gate 1F pacing remedy.

Mandatory obligations:

1. Harden targeted schema-v2 application so profile/current-state business-invalid inputs cannot partially mutate strategy while failing commitment creation.
2. Audit the only authorized lifecycle candidate: at the monthly faction political boundary, ask whether the same actor would still choose FUND_MOVEMENT under current authoritative state if only its own active duplicate block were excluded.
3. If that candidate is honest, implement only `active -> resolved` with explicit state-grounded provenance, no timer/payoff/new meter, and strict persistence/replay.
4. If it is not honest, do not invent another lifecycle.
5. Run no-response and existing-response counterfactuals.
6. End with either a profile-enabled F05 remeasurement readiness or a pivot away from FUND_MOVEMENT. Do not continue an open-ended FUND_MOVEMENT fix chain.

Exact allowed classifications:

```text
FUND_MOVEMENT_LIFECYCLE_IMPLEMENTED_REASSESSMENT_IMPROVED
FUND_MOVEMENT_LIFECYCLE_IMPLEMENTED_LATE_SILENCE_PERSISTS
FUND_MOVEMENT_ROUTE_EXHAUSTED_NO_HONEST_LIFECYCLE
```

Readiness:

```text
PROFILE_ENABLED_F05_REMEASUREMENT
PIVOT_FROM_FUND_MOVEMENT
```

## Current architecture constraints

- player = CountryId continuity, not Government;
- Government transition remains nonterminal;
- physical territorial authority only through `WorldState.landHexStates[*].controller` / `changeLandHexController()`;
- Region.stateControl is not territorial ownership;
- fronts remain derived;
- no direct crisis scheduling/deletion by interactions;
- no generic politicalPower/reformPoint/stability/mobilization/effort mana;
- LLM never directly mutates authoritative state;
- proposal/action target and amount content must be explicit, never inferred from labels/interests/ideology;
- no hidden synthetic START_INTERVENTION or FUND_MOVEMENT ActionRecord;
- no continuity damage/restoration from occupation/government defeat;
- no direct terminal shortcut;
- War-as-Politics implementation remains blocked by `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`;
- V02 remains blocked until Gate 1F passes.

## Current gate / persistence

GATE1F_CHATGPT_DECISION: NOT_READY
V02: NOT STARTED
POLITICAL_COMPETITION: IMPLEMENTED — `banned | restricted | plural`
PERSISTENCE: SerializedSimulationSnapshotV5 / format version 5

LAST_COMPLETED_TASK_ID: F05_FIX13
NEXT_AUTHORIZED_TASK_ID: F05_FIX14
NEXT_TASK_STATUS: AUTHORIZED
CURRENT_TASK_FILE: `docs/bridge/tasks/F05_FIX14.md`
LAST_RESULT_FILE: `docs/bridge/results/F05_FIX13_RESULT.md`
FUTURE_REFERENCE_GROUNDING_GATES: `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`

## Repository-root / Codex Desktop freshness guard

The real repository is the nested `TooManyRevolutions` directory.

The existing Codex Desktop thread may be reused. A new thread is not required.

Preferred order:

```text
1. externally synchronize the real nested repository
2. verify master/origin-master
3. in the existing Codex thread/worktree, verify working tree clean
4. fast-forward only if needed
5. execute only CURRENT_TASK
```

If the parent `Game-TMR` shows `TooManyRevolutions/` as untracked, `cd TooManyRevolutions` first and never modify/reset/configure the parent empty repository.

If `master` and `origin/master` are current but the clean Codex worktree HEAD is behind, `git merge --ff-only origin/master` is permitted. Do not reset/rebase/force merely to bypass freshness.
