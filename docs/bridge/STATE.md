# TMR Bridge State

UPDATED: 2026-08-25

REPOSITORY: sionchu/TooManyRevolutions
BRANCH: master
CURRENT_GATE: Gate 1F
CURRENT_PHASE: F05_FIX17 Coup Coordination Authoring Seam — AUTHORIZED

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
F05_FIX16_RESULT_COMMIT: f096a84573da2f22bdf323f5782ff13841ea9959
F05_FIX16_END_COMMIT: d3908e1f30390131e12cced6e1b80bd03c5c1a4f
F05_FIX17_TASK_COMMIT: e40493948335afcfc253dee1dcee5a010166db23

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
F05_FIX16: PASS / ACCEPTED `COUP_COORDINATION_MINIMAL_DOMAIN_DESIGNABLE`

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

## ChatGPT acceptance of F05_FIX16

F05_FIX16: COMPLETE / REVIEWED / PASS / ACCEPTED
F05_FIX16_PRIMARY_CLASSIFICATION: COUP_COORDINATION_MINIMAL_DOMAIN_DESIGNABLE
F05_FIX16_NEXT_IMPLEMENTATION_READINESS: COUP_COORDINATION_AUTHORING_SEAM
F05_FIX16_ACTOR_MODEL: STATIC_SCENARIO_AUTHORED_COUP_COORDINATION_NODES_WITH_AUTHORED_REQUIRED_SET
F05_FIX16_ALIGNMENT_MODEL: incumbent | coup | uncommitted
F05_FIX16_TRANSITION_PROVENANCE: accepted typed coup-coordination response by required node with ActionRecord/event provenance
F05_FIX16_OUTCOME_RULE: all authored required nodes coup => governmentTransition; any explicit required node incumbent => statusQuo; otherwise active
F05_FIX16_CURRENT_FACTION_REUSE: NO
F05_FIX16_CURRENT_GOVERNMENT_REUSE: NO
F05_FIX16_NEW_STATIC_AUTHORING_REQUIRED: YES
F05_FIX16_NEW_RUNTIME_STATE_REQUIRED: YES
F05_FIX16_PERSISTENCE_IMPLICATION: FUTURE_VERSION_REQUIRED
F05_FIX16_PRODUCTION_GAMEPLAY: NONE
F05_FIX16_PERSISTENCE: V6_UNCHANGED

Accepted interpretation:

- the coup branch can be bounded without a general military/state-apparatus simulation;
- the minimum actor is a coup-only scenario-authored coordination node, not `Faction`, `Government`, a unit, rank, command hierarchy, or communication graph;
- node alignment is an observable attempt-local categorical state (`incumbent | coup | uncommitted`), not a loyalty/belief/progress meter;
- alignment may only come from an explicit typed response with deterministic ActionRecord/event provenance in a future runtime task;
- the authored `requiredNodeIds` set is a necessary-set contract, not a generic majority/quorum/weighted score;
- all required nodes aligned `coup` may feed the existing nonterminal `governmentTransition` result sink; any explicit required-node `incumbent` response may feed `statusQuo`; unresolved nodes leave the coup active;
- `stateDissolved` remains T023-owned and LandHex control is irrelevant to normal coup resolution;
- the next finite step is static scenario authoring only.

## F05_FIX17 authorization

F05_FIX17: AUTHORIZED
F05_FIX17_TASK_FILE: `docs/bridge/tasks/F05_FIX17.md`
F05_FIX17_DIRECTION: implement only the static scenario-owned coup coordination node/profile authoring seam.

Required static semantic contract:

```text
CoupCoordinationNodeDefinition
  -> stable coup-only node identity
  -> Country ownership
  -> authoring/presentation name only

CoupCoordinationProfile
  -> CountryId
  -> coup-capable FactionId
  -> non-empty explicit requiredNodeIds necessary-set
  -> existing same-Country successor GovernmentId
```

Required preservation:

- existing scenarios without authoring fields remain behaviorally unchanged;
- no runtime alignment state or initial alignment writer;
- no `COUP_COORDINATION_RESPONSE` action/event;
- no coup outcome producer or Government-transition producer;
- no T018/T021/T022/T023 behavior change;
- no persistence change; V6 remains current;
- no production Gate 1F coup-node content merely to manufacture reachability.

Exact allowed classifications:

```text
COUP_COORDINATION_AUTHORING_SEAM_IMPLEMENTED
COUP_COORDINATION_AUTHORING_SEAM_REJECTED_FOR_GATE1F
```

If implemented:

```text
NEXT_IMPLEMENTATION_READINESS: COUP_COORDINATION_RUNTIME_VERTICAL_SLICE
```

If rejected:

```text
NEXT_IMPLEMENTATION_READINESS: PIVOT_TO_REBELLION_PERSISTENCE_GROUNDING
```

No third open-ended authoring outcome is allowed.

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

LAST_COMPLETED_TASK_ID: F05_FIX16
NEXT_AUTHORIZED_TASK_ID: F05_FIX17
NEXT_TASK_STATUS: AUTHORIZED
CURRENT_TASK_FILE: `docs/bridge/tasks/F05_FIX17.md`
LAST_RESULT_FILE: `docs/bridge/results/F05_FIX16_RESULT.md`
F05_FIX18: NOT_AUTHORIZED
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
