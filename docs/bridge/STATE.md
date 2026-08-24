# TMR Bridge State

UPDATED: 2026-08-24

REPOSITORY: sionchu/TooManyRevolutions
BRANCH: master
CURRENT_GATE: Gate 1F
CURRENT_PHASE: F05_FIX12 FUND_MOVEMENT authoring seam closure — complete / awaiting ChatGPT review

## Key commits

F04_CLOSED_COMMIT: 2db9ccd43b09bc4f24bb6980b5bd200b5464c5fc
F05_MEASUREMENT_COMMIT: 1866287e87072fc9b62f55a4af940f9d0e54b15b
GATE1F_REVIEW_COMMIT: 2423e629b018052d24f495793e10803cd5a0f837
F05_FIX1_REPAIR_COMMIT: 60c584543f1cfaf89c2066f8060859e7a6d2f103
F05_FIX2_R_RESULT_COMMIT: 1191bd1865200f4542d571a8af493392b075c4bd
F05_FIX3_IMPLEMENTATION_COMMIT: 49511e43d40d39408ad96e31d45109eb79afa63c
F05_FIX4_IMPLEMENTATION_COMMIT: 557b1327d4f561a24e32aee31f2f7c3c0ad15b15
F05_FIX5_RESULT_COMMIT: 1bf0542dcd3584ff283d92a00461fdf6f134a416
F05_FIX6_IMPLEMENTATION_COMMIT: e8be5701fcb65e228cbff027203ccea184ea7e44
F05_FIX7_IMPLEMENTATION_COMMIT: 60a4a1d75a631490a23c9e670d60a5dcc473bf18
F05_FIX8_IMPLEMENTATION_COMMIT: 89f350bd67ced8e49c161f95fa5e2a1c94066d42
F05_FIX9_TASK_COMMIT: 44ceebcd29d1374f4e9f7f74f61d99f511c4c021
F05_FIX9_RESULT_COMMIT: c373c5ae591911d3650840ae8eac4973d63bde75
F05_FIX9_FINAL_METADATA_COMMIT: 1f71508ac93f0cee68d8cd5d517a8ef120de8458
F05_FIX10_TASK_COMMIT: 2789279f7ecead1852e325a5a0c19a59e3a3df74
F05_FIX10_RESULT_COMMIT: 98985e84a5448e9d2454847f36e11a4c6cfa3732
F05_FIX10_END_COMMIT: 5d8ae1805bff76609a9b9370cb23b52672574e47
F05_FIX11_TASK_COMMIT: fd8dc4f98a1813a5d0f5848232fbffac3131b600
F05_FIX11_RESULT_COMMIT: b8869813f6279572001b3bc17f800f4918c98ad8
F05_FIX11_END_COMMIT: 534f4f2ac34a857cb2b837c1902d5fe3c80282a6
F05_FIX12_TASK_COMMIT: 56127d84219be61996000ce03d43c31bd63abc3d

## Accepted gate history

F04: CLOSED / PASS
F05: MEASUREMENT_COMPLETE / REVIEWED

F05_FIX1: PASS / REVIEWED
F05_FIX2: REPAIR COMPLETE; terminal pacing writer later rejected
F05_FIX2_R_ARCHITECTURE_VERDICT: REJECT_WRITER_REQUIRES_NEW_CONTINUITY_EVIDENCE
F05_FIX3: PASS / ACCEPTED architecture restoration
F05_FIX4: PASS / ACCEPTED; faction ActionProposal intake closed
F05_FIX5: PASS / ACCEPTED grounding-only
F05_FIX5_CLASSIFICATION: INSUFFICIENT_ACTION_CONSEQUENCE_GROUNDING
F05_FIX6: PASS / ACCEPTED
F05_FIX6_CLASSIFICATION: KERNEL_IMPLEMENTED_VERTICAL_SLICE_MEANINGFUL
F05_FIX7: PASS / ACCEPTED
F05_FIX7_CLASSIFICATION: PROPOSAL_RESPONSE_DOMINANCE_OR_CHURN
F05_FIX8: PASS / ACCEPTED
F05_FIX8_NON_ACCEPT_DIVERGENCE: ORCHESTRATION_ARTIFACT_FIXED
F05_FIX8_RECONSIDERATION_MODEL: IMPLEMENTED_STATE_GROUNDED
F05_FIX8_PERSISTENCE: SerializedSimulationSnapshotV4 / format version 4
F05_FIX8_IDENTICAL_REOPEN_CHURN: CLOSED

## ChatGPT acceptance of F05_FIX9

F05_FIX9: COMPLETE / REVIEWED / PASS / ACCEPTED
F05_FIX9_PRIMARY_CLASSIFICATION: LATE_STEADY_STATE_MIXED_CAUSE
F05_FIX9_REPRESENTATIVE_CAUSES: ACTIVE_CONFLICT_EQUILIBRIUM + OUTCOME_ELIGIBILITY_STALEMATE + INTERACTION_COVERAGE_EXHAUSTED
F05_FIX9_EXISTING_BUG_FOUND: NO
F05_FIX9_INTERACTION_COVERAGE_EXHAUSTED: YES
F05_FIX9_ACTIVE_CONFLICT_EQUILIBRIUM: YES
F05_FIX9_OUTCOME_GAP: YES
F05_FIX9_PLAYER_RESPONSE_SET_SATURATED: NO
F05_FIX9_IMPLEMENTATION: NONE
F05_FIX9_HISTORICAL_F05_BASELINE: UNCHANGED
F05_FIX9_STATE_GROUNDED_MAX_REASSESSMENT_SILENCE: 1200 days
F05_FIX9_POST_INTERVENTION_LATE_SILENCE: 1110 days
F05_FIX9_LATE_SILENCE_POPULATION: 6 ACCEPT branches >720 days
F05_FIX9_NON_ACCEPT_DIVERGENCES: 0
F05_FIX9_IDENTICAL_REOPEN_CHURN: 0
F05_FIX9_LEGITIMATE_REOPENS: 2
F05_FIX9_GATE1F_RECOMMENDATION: NOT_READY

## ChatGPT acceptance of F05_FIX10

F05_FIX10: COMPLETE / REVIEWED / PASS / ACCEPTED
F05_FIX10_PRIMARY_CLASSIFICATION: COVERAGE_REQUIRES_ACTION_SCHEMA_TARGETING
F05_FIX10_SECOND_LOBBY_REACHABILITY: NOT_REACHABLE / 0 of 372
F05_FIX10_FUND_MOVEMENT_REACHABILITY: REACHABLE / 372 of 372
F05_FIX10_ORGANIZE_REACHABILITY: NOT_REACHABLE / 0 of 372
F05_FIX10_SELECTED_ACTION: FUND_MOVEMENT
F05_FIX10_TARGET_OBJECT_REQUIRED: YES
F05_FIX10_ACTION_SCHEMA_CHANGE_REQUIRED: YES
F05_FIX10_PRODUCTION_GAMEPLAY_CHANGE: NONE
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
F05_FIX11_COMMITMENT_LIFECYCLE_STATUS: TARGET_SCHEMA_ONLY_DESIGNABLE
F05_FIX11_REPEAT_BOUNDARY: ACTIVE_SAME_ACTOR_TARGET_BLOCKS_DUPLICATE
F05_FIX11_PERSISTENCE_DECISION: FUTURE_VERSION_REQUIRED_FOR_AUTHORITATIVE_COMMITMENT
F05_FIX11_NEXT_IMPLEMENTATION_READINESS: NONE
F05_FIX11_PRODUCTION_GAMEPLAY_CHANGE: NONE

Accepted interpretation:

- `FUND_MOVEMENT` means allocating existing actor-owned faction resources, not raising a new resource or generic political spending;
- the only defensible v1 target domain is one explicitly authored Region;
- no actual Region may be inferred from pressure, ideology, sort order, faction label, conflict front, or fixture layout;
- existing `Faction.resources` can support an earmark-style commitment concept, but no resource debit/reservation writer is yet authorized;
- the amount must be explicit scenario/content data; no default or state-derived formula is grounded;
- `Agenda` is only the first safe visibility/reassessment boundary, not itself an authoritative gameplay consequence;
- no runtime action schema, commitment state, resource writer, effect, or persistence field was added;
- further open-ended FUND_MOVEMENT grounding is not authorized: F05_FIX12 must either implement the explicit static authoring seam or reject FUND_MOVEMENT for the current Gate 1F path.

## F05_FIX12 authorization

F05_FIX12: AUTHORIZED
F05_FIX12_TASK_FILE: `docs/bridge/tasks/F05_FIX12.md`
F05_FIX12_DIRECTION: close the explicit FUND_MOVEMENT target + amount authoring seam.

Required closure:

```text
scenario author
-> explicit Faction
-> explicit single Region target
-> explicit resource amount
-> deterministic static validation
-> future runtime intake boundary
```

F05_FIX12 may implement only static scenario-definition/validation schema. It may not implement runtime faction-action payload changes, commitments, resource writers, Agenda readers, crisis/conflict effects, territory, continuity, terminal outcomes, or persistence changes.

F05_FIX12 has only two valid primary outcomes:

```text
FUND_MOVEMENT_AUTHORING_SEAM_IMPLEMENTED
FUND_MOVEMENT_AUTHORING_SEAM_REJECTED_FOR_GATE1F
```

There is no third "needs more grounding" outcome.

## F05_FIX12 completion

F05_FIX12: COMPLETE / AWAITING_CHATGPT_REVIEW
F05_FIX12_PRIMARY_CLASSIFICATION: FUND_MOVEMENT_AUTHORING_SEAM_IMPLEMENTED
F05_FIX12_AUTHORING_SCOPE: STATIC_SCENARIO_ONLY
F05_FIX12_NEXT_IMPLEMENTATION_READINESS: TARGETED_COMMITMENT_VERTICAL_SLICE
F05_FIX12_RUNTIME_COMMITMENT: NOT_IMPLEMENTED
F05_FIX12_GATE1F: NOT_READY
F05_FIX12_V02: NOT_STARTED
F05_FIX13: NOT_AUTHORIZED

## Current architecture constraints

- player = CountryId continuity, not Government;
- Government transition remains nonterminal;
- physical territorial authority only through `WorldState.landHexStates[*].controller` / `changeLandHexController()`;
- Region.stateControl is not territorial ownership;
- fronts remain derived;
- no direct crisis scheduling/deletion by interactions;
- no generic politicalPower/reformPoint/stability/mobilization mana;
- LLM never directly mutates authoritative state;
- proposal demand is explicit scenario-authored content, never inferred from faction interests/ideology;
- no hidden synthetic START_INTERVENTION ActionRecord;
- rejected-demand reconsideration remains state-grounded V4 lifecycle semantics;
- no continuity damage/restoration from occupation/government defeat;
- no direct terminal shortcut;
- War-as-Politics implementation remains blocked by `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`;
- V02 remains blocked until Gate 1F passes.

## Current gate / persistence

GATE1F_CHATGPT_DECISION: NOT_READY
V02: NOT STARTED
POLITICAL_COMPETITION: IMPLEMENTED — `banned | restricted | plural`
PERSISTENCE: SerializedSimulationSnapshotV4 / format version 4; V3 rejected

LAST_COMPLETED_TASK_ID: F05_FIX12
NEXT_AUTHORIZED_TASK_ID: NONE
NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW
CURRENT_TASK_FILE: NONE
LAST_RESULT_FILE: `docs/bridge/results/F05_FIX12_RESULT.md`
FUTURE_REFERENCE_GROUNDING_GATES: `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`

## Repository-root / freshness guard

The real repository is the nested `TooManyRevolutions` directory. If Codex starts from parent `Game-TMR` and sees `TooManyRevolutions/` as untracked, it must `cd TooManyRevolutions` before Git/task work.

Preferred freshness check:

```bash
git status
git fetch origin
git rev-parse HEAD
git rev-parse origin/master
git pull --ff-only
```

For Codex Desktop isolated worktrees, the stable operating order is:

```text
1. externally synchronize the real nested repository
2. verify the expected master SHA
3. start a fresh Codex thread/worktree
4. verify that fresh worktree HEAD/origin-master match CURRENT_TASK activation SHA
5. execute only the authorized task
```

Do not reset/rebase an old stale Codex worktree to bypass the freshness guard.
