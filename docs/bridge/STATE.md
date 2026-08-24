# TMR Bridge State

UPDATED: 2026-08-24

REPOSITORY: sionchu/TooManyRevolutions
BRANCH: master
CURRENT_GATE: Gate 1F
CURRENT_PHASE: F05_FIX11 FUND_MOVEMENT target & commitment grounding

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
F05_FIX10_ACTIVE_CONFLICT_TRACK: DEFERRED_BY_GROUNDING_GATE
F05_FIX10_OUTCOME_TRACK: DEFERRED_BY_CONTINUITY_EVIDENCE
F05_FIX10_SECOND_LOBBY_REACHABILITY: NOT_REACHABLE / 0 of 372 late-state faction boundaries
F05_FIX10_FUND_MOVEMENT_REACHABILITY: REACHABLE / 372 of 372
F05_FIX10_ORGANIZE_REACHABILITY: NOT_REACHABLE / 0 of 372
F05_FIX10_SELECTED_ACTION: FUND_MOVEMENT
F05_FIX10_TARGET_OBJECT_REQUIRED: YES
F05_FIX10_ACTION_SCHEMA_CHANGE_REQUIRED: YES
F05_FIX10_COMMITMENT_MODEL_STATUS: DESIGNABLE_AFTER_ACTION_SCHEMA_TARGETING
F05_FIX10_MAGNITUDE_GROUNDING_STATUS: BLOCKED_NO_AUTHORED_MAGNITUDE
F05_FIX10_PERSISTENCE_IMPLICATION: FUTURE_VERSION_REQUIRED_IF_COMMITMENT_STATE_IS_ADDED
F05_FIX10_PRODUCTION_GAMEPLAY_CHANGE: NONE
F05_FIX10_HISTORICAL_F05_BASELINE: UNCHANGED
F05_FIX10_F05_FIX9_DIAGNOSIS: UNCHANGED
F05_FIX10_GATE1F_RECOMMENDATION: NOT_READY

Accepted interpretation:

- the exact six F05_FIX9 late branches were replayed at monthly faction boundaries;
- every one of the 372 measured blocker-state rows naturally selected `FUND_MOVEMENT`;
- a second LOBBY template is not a current remedy because LOBBY was not naturally selected and was legally unavailable in the measured state;
- `FUND_MOVEMENT` currently carries only `{ factionId }`, so a target cannot be inferred from the two relevant Regions without new semantics;
- F05_FIX10 correctly stopped at the schema/targeting seam and made no production simulation change;
- `RegionId` is a candidate target domain, not yet an accepted target contract;
- no numeric debit/effect/duration/conversion ratio is grounded;
- the next task must ground target domain and actor-owned commitment semantics before implementation.

## F05_FIX11 authorization

F05_FIX11: AUTHORIZED
F05_FIX11_TASK_FILE: `docs/bridge/tasks/F05_FIX11.md`
F05_FIX11_DIRECTION: ground the smallest honest `FUND_MOVEMENT` target + commitment contract before any runtime schema/effect implementation.

F05_FIX11_SOURCE_PACK:

- McCarthy & Zald (1977), DOI `10.1086/226464`;
- Jenkins (1983), DOI `10.1146/annurev.so.09.080183.002523`;
- McCarthy & Wolfson (1996), DOI `10.2307/2096309`;
- Hunter & Staggenborg (1986), DOI `10.1016/0362-3319(86)90033-9`;
- Cress & Snow (1996), DOI `10.2307/2096310`;
- Ganz (2000), DOI `10.1086/210398`.

Source-pack interpretation boundary:

```text
resources / organization / effort / local organizational context can matter
!=
more resources automatically produce more political action or success
!=
resource spend automatically creates crisis/conflict/combat strength
```

F05_FIX11 must decide, without production implementation:

- exact `FUND_MOVEMENT` semantic meaning;
- explicit target domain, including whether one Region / Region set / Country-wide / other existing object is defensible;
- whether existing `Faction.resources` can honestly be reserve/spend/earmark commitment or a new unsupported effort domain would be required;
- amount-authoring seam without inventing a number;
- first legitimate non-war/non-terminal consumer boundary;
- state-grounded lifecycle/repeat rule without cooldown/countdown;
- persistence implications;
- implementation readiness for a later ChatGPT-authorized task.

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

LAST_COMPLETED_TASK_ID: F05_FIX10
NEXT_AUTHORIZED_TASK_ID: F05_FIX11
NEXT_TASK_STATUS: AUTHORIZED
CURRENT_TASK_FILE: `docs/bridge/tasks/F05_FIX11.md`
LAST_RESULT_FILE: `docs/bridge/results/F05_FIX10_RESULT.md`
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

If outbound HTTPS is unavailable inside Codex, proceed only after the nested repository has been externally synchronized and local `HEAD == origin/master ==` the exact activation SHA recorded in `CURRENT_TASK.md`, with a clean working tree.
