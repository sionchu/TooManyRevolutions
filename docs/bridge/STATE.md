# TMR Bridge State

UPDATED: 2026-08-25

REPOSITORY: sionchu/TooManyRevolutions
BRANCH: master
CURRENT_GATE: Gate 1F
CURRENT_PHASE: F05_FIX15 War-as-Politics grounding & active-conflict remedy selection — COMPLETE / AWAITING_CHATGPT_REVIEW

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
F05_FIX14_IMPLEMENTATION_COMMIT: 4345e7fa84d589576db65db1f2df43c8934a9b6f
F05_FIX14_RESULT_METADATA_COMMIT: 5987b4c6732a91cf516c0eff3dae47cd268510eb
F05_FIX15_TASK_COMMIT: 8fd27058c95c75f55efda8612bd40a0befe81d67
F05_FIX15_RESULT_COMMIT: 3489927c5ba67095b6f58b9292e017affeacf659
F05_FIX15_END_COMMIT: 3489927c5ba67095b6f58b9292e017affeacf659

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
F05_FIX13_LATE_REASSESSMENT_CHANGED: NO
F05_FIX13_GATE1F_RECOMMENDATION: NOT_READY

## ChatGPT acceptance of F05_FIX14

F05_FIX14: COMPLETE / REVIEWED / PASS / ACCEPTED
F05_FIX14_PRIMARY_CLASSIFICATION: FUND_MOVEMENT_LIFECYCLE_IMPLEMENTED_LATE_SILENCE_PERSISTS
F05_FIX14_NEXT_IMPLEMENTATION_READINESS: PIVOT_FROM_FUND_MOVEMENT
F05_FIX14_TARGETED_V2_ATOMICITY: PASS
F05_FIX14_LIFECYCLE: active -> resolved(actorIntentCeased) from unchanged chooser/current authoritative state
F05_FIX14_CURRENT_STRATEGY_DEPENDENCY: NONE
F05_FIX14_TIMER_COOLDOWN_COUNTDOWN: NONE
F05_FIX14_EXISTING_RESPONSE: tick 32 response; tick 60 resolution; available resources 0.5 -> 0.8; Agenda active cause removed
F05_FIX14_NO_RESPONSE: 1200 days; no resolution; active commitments 2
F05_FIX14_REENTRY: later state-grounded recommitment tick 211; duplicate/churn 0
F05_FIX14_PERSISTENCE: SerializedSimulationSnapshotV6 / format version 6; V5 rejected
F05_FIX14_REPLAY: uninterrupted/save-load/insertion-order equal
F05_FIX14_HISTORICAL_BASELINES: F05 unchanged; F05_FIX9 1110/1200 and 108/108; F05_FIX13 unchanged
F05_FIX14_RESOURCE_DEBIT: NONE
F05_FIX14_FORBIDDEN_WRITERS: NONE
F05_FIX14_GATE1F_RECOMMENDATION: NOT_READY

Accepted interpretation:

- targeted FUND_MOVEMENT is now a coherent authored/runtime/lifecycle political object;
- existing political accommodation can cause a real state-grounded commitment resolution and later recommitment;
- the 1,200-day no-response path remains unresolved, so FUND_MOVEMENT does not materially reduce the measured late silence;
- the FUND_MOVEMENT route is closed as the current Gate 1F pacing remedy;
- the next repair direction must pivot to another F05_FIX9 structural cause rather than add another FUND_MOVEMENT consequence/payoff/lifecycle rule.

## F05_FIX15 completion

F05_FIX15: COMPLETE / AWAITING_CHATGPT_REVIEW
F05_FIX15_TASK_FILE: `docs/bridge/tasks/F05_FIX15.md`
F05_FIX15_DIRECTION: satisfy the War-as-Politics grounding gate and select the smallest honest repair seam for `ACTIVE_CONFLICT_EQUILIBRIUM`.
F05_FIX15_PRIMARY_CLASSIFICATION: WAR_POLITICS_REQUIRES_NEW_AUTHORITATIVE_DOMAIN
F05_FIX15_NEXT_IMPLEMENTATION_READINESS: NEW_DOMAIN_GROUNDING_REQUIRED
F05_FIX15_COUP_CURRENT_STATE_SUFFICIENT: NO
F05_FIX15_COUP_REQUIRES_NEW_COORDINATION_DOMAIN: YES
F05_FIX15_REBELLION_CURRENT_STATE_SUFFICIENT: NO
F05_FIX15_REBELLION_REQUIRES_SETTLEMENT_OR_PERSISTENCE_DOMAIN: YES
F05_FIX15_SHARED_CONFLICT_OBJECTIVE_SCHEMA_REQUIRED: NO
F05_FIX15_MOBILIZATION_FINANCE_RELEVANT_TO_CURRENT_BLOCKER: NO
F05_FIX15_OCCUPATION_DISPLACEMENT_RELEVANT_TO_CURRENT_BLOCKER: NO

Exact late-state basis:

```text
country physical LandHexes = 0
active conflicts = 2
rebellion = NO_ACTIVE_FRONT_EDGE
coup = COUP_HAS_NO_TERRITORIAL_WRITER
Government remains valid
run outcome remains active
T022 consolidation blocked
T023 dissolution not proven by occupation/Government defeat
```

Required semantic separation:

- coups are audited as non-territorial coordination/seizure-of-authority problems; no fake LandHex front;
- rebellion/insurgency persistence is not equivalent to one missing front edge;
- Government transition remains nonterminal;
- occupation alone remains insufficient for State Dissolution;
- settlement/demobilization/conscription/war finance/occupation/displacement may be grounded, but new domains must be explicitly deferred if current authoritative state cannot express them honestly.

Fixed source pack in the immutable task covers Clausewitz, Singh, Kalyvas, Fearon & Laitin, Walter, Matanock, Tilly, Levi, Scheve & Stasavage, and wartime displacement literature with conservative claim boundaries.

Exact primary classifications:

```text
WAR_POLITICS_GROUNDED_COUP_RESOLUTION_SLICE
WAR_POLITICS_GROUNDED_REBELLION_TERMINATION_SLICE
WAR_POLITICS_GROUNDED_CONFLICT_OBJECTIVE_SCHEMA
WAR_POLITICS_REQUIRES_NEW_AUTHORITATIVE_DOMAIN
WAR_POLITICS_GROUNDING_INSUFFICIENT
```

Readiness:

```text
COUP_POLITICAL_RESOLUTION_VERTICAL_SLICE
REBELLION_TERMINATION_VERTICAL_SLICE
CONFLICT_OBJECTIVE_SCHEMA_ONLY
NEW_DOMAIN_GROUNDING_REQUIRED
NONE
```

F05_FIX15 is grounding/architecture selection only. Production conflict logic, Conflict/WorldState schema, T021/T022/T023, persistence V6, and official F05 semantics remain unchanged.

## Current architecture constraints

- player = CountryId continuity, not Government;
- Government transition remains nonterminal;
- physical territorial authority only through `WorldState.landHexStates[*].controller` / `changeLandHexController()`;
- Region.stateControl is not territorial ownership;
- fronts remain derived;
- no direct crisis scheduling/deletion by interactions;
- no generic politicalPower/reformPoint/stability/mobilization/effort/war mana;
- LLM never directly mutates authoritative state;
- proposal/action target and amount content must be explicit, never inferred from labels/interests/ideology;
- no hidden synthetic START_INTERVENTION or FUND_MOVEMENT ActionRecord;
- no continuity damage/restoration from occupation/Government defeat;
- no direct terminal shortcut;
- War-as-Politics **implementation** remains blocked until F05_FIX15 grounding is reviewed/accepted;
- V02 remains blocked until Gate 1F passes.

## Current gate / persistence

GATE1F_CHATGPT_DECISION: NOT_READY
V02: NOT STARTED
POLITICAL_COMPETITION: IMPLEMENTED — `banned | restricted | plural`
PERSISTENCE: SerializedSimulationSnapshotV6 / format version 6

LAST_COMPLETED_TASK_ID: F05_FIX15
NEXT_AUTHORIZED_TASK_ID: NONE
NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW
CURRENT_TASK_FILE: NONE
LAST_RESULT_FILE: `docs/bridge/results/F05_FIX15_RESULT.md`
F05_FIX16: NOT_AUTHORIZED
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
