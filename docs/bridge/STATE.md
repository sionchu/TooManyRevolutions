# TMR Bridge State

UPDATED: 2026-08-25

REPOSITORY: sionchu/TooManyRevolutions
BRANCH: master
CURRENT_GATE: Gate 1F
CURRENT_PHASE: F05_FIX16 Coup Coordination Domain Closure — AUTHORIZED

## Key commits

F04_CLOSED_COMMIT: 2db9ccd43b09bc4f24bb6980b5bd200b5464c5fc
F05_MEASUREMENT_COMMIT: 1866287e87072fc9b62f55a4af940f9d0e54b15b
GATE1F_REVIEW_COMMIT: 2423e629b018052d24f495793e10803cd5a0f837
F05_FIX8_IMPLEMENTATION_COMMIT: 89f350bd67ced8e49c161f95fa5e2a1c94066d42
F05_FIX9_RESULT_COMMIT: c373c5ae591911d3650840ae8eac4973d63bde75
F05_FIX10_RESULT_COMMIT: 98985e84a5448e9d2454847f36e11a4c6cfa3732
F05_FIX11_RESULT_COMMIT: b8869813f6279572001b3bc17f800f4918c98ad8
F05_FIX12_RESULT_COMMIT: c79f71c62f6d0048a504a125b3975a446d2f4013
F05_FIX13_IMPLEMENTATION_COMMIT: 69f857fdb9036725014e676c8633977c421b19df
F05_FIX14_IMPLEMENTATION_COMMIT: 4345e7fa84d589576db65db1f2df43c8934a9b6f
F05_FIX14_RESULT_METADATA_COMMIT: 5987b4c6732a91cf516c0eff3dae47cd268510eb
F05_FIX15_TASK_COMMIT: 8fd27058c95c75f55efda8612bd40a0befe81d67
F05_FIX15_RESULT_COMMIT: 3489927c5ba67095b6f58b9292e017affeacf659
F05_FIX15_END_COMMIT: a38614fbb387c072105d4d7568cb199ef6ff5a87
F05_FIX16_TASK_COMMIT: 7a75116f74fadeb1fa4cc98f91591b1607999ead

## Accepted gate history

F04: CLOSED / PASS
F05: MEASUREMENT_COMPLETE / REVIEWED / Gate 1F NOT_READY
F05_FIX1: PASS / REVIEWED
F05_FIX2: terminal pacing writer rejected by continuity evidence gate
F05_FIX3: PASS / ACCEPTED architecture restoration
F05_FIX4: PASS / ACCEPTED faction ActionProposal intake
F05_FIX5: PASS / ACCEPTED grounding-only; `INSUFFICIENT_ACTION_CONSEQUENCE_GROUNDING`
F05_FIX6: PASS / ACCEPTED political interaction kernel
F05_FIX7: PASS / ACCEPTED long-horizon integration
F05_FIX8: PASS / ACCEPTED proposal lifecycle; strict persistence then V4
F05_FIX9: PASS / ACCEPTED diagnosis `LATE_STEADY_STATE_MIXED_CAUSE`
F05_FIX10: PASS / ACCEPTED `COVERAGE_REQUIRES_ACTION_SCHEMA_TARGETING`
F05_FIX11: PASS / ACCEPTED `FUND_MOVEMENT_REQUIRES_NEW_AUTHORING_SEAM`
F05_FIX12: PASS / ACCEPTED `FUND_MOVEMENT_AUTHORING_SEAM_IMPLEMENTED`
F05_FIX13: PASS / ACCEPTED `TARGETED_COMMITMENT_KERNEL_IMPLEMENTED_BUT_LATE_REASSESSMENT_UNCHANGED`
F05_FIX14: PASS / ACCEPTED `FUND_MOVEMENT_LIFECYCLE_IMPLEMENTED_LATE_SILENCE_PERSISTS`
F05_FIX15: PASS / ACCEPTED `WAR_POLITICS_REQUIRES_NEW_AUTHORITATIVE_DOMAIN`

## F05 late-state diagnosis preserved

Historical F05 / F05_FIX9 reference remains:

```text
state-grounded max reassessment silence = 1200 days
post-intervention late silence = 1110 days
late population = 6 ACCEPT branches >720 days
country physical LandHexes = 0 in representative late freezes
active conflicts = rebellion + coup
rebellion = NO_ACTIVE_FRONT_EDGE
coup = COUP_HAS_NO_TERRITORIAL_WRITER
Government remains valid
run outcome remains active
T022 consolidation blocked
T023 dissolution not proven by occupation/Government defeat
```

F05_FIX9 representative causes remain:

```text
ACTIVE_CONFLICT_EQUILIBRIUM
OUTCOME_ELIGIBILITY_STALEMATE
INTERACTION_COVERAGE_EXHAUSTED
```

No production task may reinterpret `0 LandHex` or Government defeat as automatic State Dissolution.

## FUND_MOVEMENT route closure

The FUND_MOVEMENT path is complete as an authored/runtime/lifecycle political object but exhausted as the current Gate 1F pacing remedy.

Accepted chain:

```text
scenario-authored FactionFundMovementTemplate
-> targeted FUND_MOVEMENT ActionRecord schema v2
-> exact authored Region/amount validation
-> authoritative actor-owned earmark commitment
-> derived available resources
-> active same actor/target duplicate guard
-> Agenda visibility without severity bonus
-> state-grounded active -> resolved(actorIntentCeased)
-> resource availability restoration
-> strict persistence/replay
```

F05_FIX14 showed a real lifecycle under an existing political-accommodation response but no-response remained unresolved for 1200 days. Therefore do not add another FUND_MOVEMENT payoff, target, timer, cooldown, or lifecycle rule for Gate 1F.

Current persistence after this route: `SerializedSimulationSnapshotV6 / format version 6`.

## ChatGPT acceptance of F05_FIX15

F05_FIX15: COMPLETE / REVIEWED / PASS / ACCEPTED
F05_FIX15_PRIMARY_CLASSIFICATION: WAR_POLITICS_REQUIRES_NEW_AUTHORITATIVE_DOMAIN
F05_FIX15_NEXT_IMPLEMENTATION_READINESS: NEW_DOMAIN_GROUNDING_REQUIRED
F05_FIX15_COUP_CURRENT_STATE_SUFFICIENT: NO
F05_FIX15_COUP_REQUIRES_NEW_COORDINATION_DOMAIN: YES
F05_FIX15_REBELLION_CURRENT_STATE_SUFFICIENT: NO
F05_FIX15_REBELLION_REQUIRES_SETTLEMENT_OR_PERSISTENCE_DOMAIN: YES
F05_FIX15_SHARED_CONFLICT_OBJECTIVE_SCHEMA_REQUIRED: NO
F05_FIX15_MOBILIZATION_FINANCE_RELEVANT_TO_CURRENT_BLOCKER: NO
F05_FIX15_OCCUPATION_DISPLACEMENT_RELEVANT_TO_CURRENT_BLOCKER: NO
F05_FIX15_PRODUCTION_CONFLICT_GAMEPLAY: NONE
F05_FIX15_PERSISTENCE: V6_UNCHANGED

Accepted interpretation:

- coup is a non-territorial coordination/seizure-of-authority problem; T021's lack of a coup LandHex writer is deliberate, not a missing front bug;
- existing Faction/Country/Government scalars are attempt/eligibility evidence, not enough to derive coup success/failure honestly;
- current TMR has no authoritative coordination/alignment/seizure provenance;
- rebellion with no front cannot be declared ended without persistence/settlement/security/demobilization evidence;
- a generic shared conflict objective alone would not produce either missing mechanism;
- Government transition remains nonterminal and State Dissolution remains under T023 evidence only;
- no production source, Conflict/WorldState schema, T021/T022/T023, or persistence was changed by F05_FIX15.

## F05_FIX16 authorization

F05_FIX16: AUTHORIZED
F05_FIX16_TASK_FILE: `docs/bridge/tasks/F05_FIX16.md`
F05_FIX16_DIRECTION: close the coup-coordination domain question for Gate 1F.

Research basis:

- Singh: coup outcomes are intra-military coordination problems, not conventional territorial battle or popularity contests;
- Geddes review of Singh: officers' choices depend strongly on beliefs about what other officers will do; grievance alone does not decide alignment;
- Powell & Thyne: coups are analytically distinct from other anti-regime activity;
- repository T018 already exposes `militarySympathy` and `leadership` as unimplemented future-evidence placeholders, but these must not become hidden numeric scores.

Closure question:

```text
Can TMR represent coup resolution with a bounded coup-only set of explicit decisive coordination actors and categorical observable alignment/action provenance,
without creating a general military/state-apparatus simulation or hidden coordination score?
```

Exactly two valid primary outcomes:

```text
COUP_COORDINATION_MINIMAL_DOMAIN_DESIGNABLE
COUP_COORDINATION_REJECTED_FOR_GATE1F
```

If designable:

```text
NEXT_IMPLEMENTATION_READINESS: COUP_COORDINATION_AUTHORING_SEAM
```

If honest implementation requires a broader military/state-apparatus actor, command, communications, hidden-belief, loyalty, or unit system:

```text
NEXT_IMPLEMENTATION_READINESS: PIVOT_TO_REBELLION_PERSISTENCE_GROUNDING
```

There is no third `needs more coup grounding` outcome. If rejected, the coup route is closed for the current Gate 1F repair.

F05_FIX16 is grounding/design only. It may not add WorldState/Conflict/Government/Faction fields, actions, coup outcome writers, T018/T021/T022/T023 changes, persistence changes, or production scenario content.

## Current architecture constraints

- player = `CountryId` continuity, not Government;
- Government transition remains nonterminal;
- physical territorial authority only through `WorldState.landHexStates[*].controller` / `changeLandHexController()`;
- `Region.stateControl` is not territorial ownership;
- fronts remain derived;
- no `0 LandHex -> defeat/dissolution`;
- no Government defeat -> continuity damage/restoration;
- no fake coup LandHex front/writer;
- no `no front -> peace`;
- no generic politicalPower/reformPoint/stability/mobilization/effort/war/coup mana;
- no numeric coup coordination/support/loyalty/inevitability/progress score;
- no random coup resolution;
- no hidden score inferred from Faction name/ideology/currentStrategy or existing Country/Faction scalars;
- no LLM direct authoritative mutation;
- no FUND_MOVEMENT extension;
- no V02 until Gate 1F PASS.

## Current gate / persistence

GATE1F_CHATGPT_DECISION: NOT_READY
V02: NOT STARTED
POLITICAL_COMPETITION: IMPLEMENTED — `banned | restricted | plural`
PERSISTENCE: SerializedSimulationSnapshotV6 / format version 6

LAST_COMPLETED_TASK_ID: F05_FIX15
NEXT_AUTHORIZED_TASK_ID: F05_FIX16
NEXT_TASK_STATUS: AUTHORIZED
CURRENT_TASK_FILE: `docs/bridge/tasks/F05_FIX16.md`
LAST_RESULT_FILE: `docs/bridge/results/F05_FIX15_RESULT.md`
F05_FIX17: NOT_AUTHORIZED
FUTURE_REFERENCE_GROUNDING_GATES: `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`

## Repository-root / freshness guard

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

If parent `Game-TMR` shows `TooManyRevolutions/` as untracked, `cd TooManyRevolutions` first and never modify/reset/configure the parent repository.

If `master` and `origin/master` are current but the clean Codex worktree HEAD is behind, `git merge --ff-only origin/master` is permitted. Do not reset/rebase/force merely to bypass freshness.
