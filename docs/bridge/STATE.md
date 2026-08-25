# TMR Bridge State

UPDATED: 2026-08-25
REPOSITORY: sionchu/TooManyRevolutions
BRANCH: master
CURRENT_GATE: Gate 1F
GATE1F_CHATGPT_DECISION: NOT_READY
V02: NOT_STARTED
PERSISTENCE: SerializedSimulationSnapshotV6 / format version 6

## Authority

Repository source/tests/diffs override Bridge prose. Historical task/result docs retain detailed evidence. This STATE file records only the current accepted project state and execution boundary.

## Accepted progression

```text
F04: CLOSED / PASS
F05: measurement complete; Gate 1F NOT_READY
F05_FIX1: PASS
F05_FIX2: terminal pacing writer rejected
F05_FIX3: architecture restoration PASS
F05_FIX4: faction ActionProposal intake PASS
F05_FIX5: grounding PASS
F05_FIX6: political interaction kernel PASS
F05_FIX7: long-horizon integration PASS
F05_FIX8: proposal lifecycle PASS
F05_FIX9: LATE_STEADY_STATE_MIXED_CAUSE
F05_FIX10: FUND_MOVEMENT selected as reachable interaction seam
F05_FIX11: FUND_MOVEMENT requires explicit authoring seam
F05_FIX12: FUND_MOVEMENT authoring seam implemented
F05_FIX13: targeted commitment kernel implemented; late reassessment unchanged
F05_FIX14: lifecycle implemented; late silence persists; FUND_MOVEMENT route closed
F05_FIX15: War-as-Politics requires new authoritative domain
F05_FIX16: minimal coup coordination domain DESIGNABLE / PASS / ACCEPTED
```

## Preserved F05 late-state diagnosis

```text
state-grounded max reassessment silence = 1200 days
post-intervention late silence = 1110 days
late population = 6 ACCEPT branches >720 days
representative country physical LandHexes = 0
active conflicts = rebellion + coup
rebellion = NO_ACTIVE_FRONT_EDGE
coup = COUP_HAS_NO_TERRITORIAL_WRITER
Government remains valid
run outcome remains active
T022 consolidation blocked
T023 dissolution not proven by occupation/Government defeat
```

Representative root causes remain:

```text
ACTIVE_CONFLICT_EQUILIBRIUM
OUTCOME_ELIGIBILITY_STALEMATE
INTERACTION_COVERAGE_EXHAUSTED
```

The FUND_MOVEMENT route is complete as an authored/runtime/lifecycle political object but is exhausted as the current Gate 1F pacing remedy. Do not extend it with another payoff, target, timer, cooldown, or lifecycle rule.

## Accepted F05_FIX16 coup design

```text
PRIMARY_CLASSIFICATION: COUP_COORDINATION_MINIMAL_DOMAIN_DESIGNABLE
ACTOR_MODEL: STATIC_SCENARIO_AUTHORED_COUP_COORDINATION_NODES_WITH_AUTHORED_REQUIRED_SET
ALIGNMENT_MODEL: incumbent | coup | uncommitted
TRANSITION_PROVENANCE: explicit typed required-node response with ActionRecord/event provenance
OUTCOME_RULE: all required nodes coup => nonterminal governmentTransition; any required node incumbent => statusQuo; otherwise active
CURRENT_FACTION_REUSE: NO
CURRENT_GOVERNMENT_REUSE: NO
NEW_STATIC_AUTHORING_REQUIRED: YES
NEW_RUNTIME_STATE_REQUIRED: YES
NEXT_IMPLEMENTATION_READINESS: COUP_COORDINATION_AUTHORING_SEAM
```

The alignment model is categorical observable attempt-local state, not a loyalty/belief/progress score. Coup remains non-territorial; no fake LandHex front is permitted. State Dissolution remains T023-owned.

## Current authorized task

```text
TASK_ID: F05_FIX17
STATUS: AUTHORIZED
TASK_FILE: docs/bridge/tasks/F05_FIX17.md
HANDOFF_POLICY: REMOTE_HANDOFF_ON_PASS
```

F05_FIX17 implements static scenario authoring only:

```text
CoupCoordinationNodeDefinition
  -> stable coup-only node identity
  -> Country ownership
  -> presentation/authoring name

CoupCoordinationProfile
  -> CountryId
  -> coup-capable FactionId
  -> non-empty authored requiredNodeIds necessary-set
  -> existing same-Country successor GovernmentId
```

F05_FIX17 must not add runtime alignment, node responses, coup outcome production, Government-transition production, T018/T021/T022/T023 behavior changes, runtime Conflict/Government/Faction fields, or persistence changes.

Allowed classifications:

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

F05_FIX18 is not authorized.

## Architecture constraints

- player = `CountryId` continuity, not Government;
- Government transition is nonterminal;
- physical territorial authority only `WorldState.landHexStates[*].controller` via `changeLandHexController()`;
- `Region.stateControl` is not territorial ownership;
- fronts are derived;
- no `0 LandHex -> defeat/dissolution`;
- no Government defeat -> continuity damage/restoration;
- no fake coup LandHex front/writer;
- no `no front -> peace`;
- no generic political/war/coup mana;
- no numeric coup coordination/support/loyalty/inevitability/progress score;
- no random coup resolution;
- no hidden score inferred from names, ideology, strategy, Agenda, or existing Country/Faction scalars;
- LLM never directly mutates authoritative state;
- no V02 until Gate 1F PASS.

## Codex remote execution policy

For Codex remote/cloud, the repository snapshot supplied by the Codex product is the execution input. **Shell `git fetch`, `git pull`, `git push`, GitHub CLI authentication, direct `github.com:443` access, and exact SHA synchronization are not task prerequisites.**

If the supplied snapshot contains `CURRENT_TASK.md` pointing to the authorized task and the referenced task file exists, execute it directly.

If those files are absent, the remote task was started from a stale snapshot. Stop that remote task and launch a new remote task against the current repository/branch snapshot. Do not repair a stale sandbox with reset/rebase/force or direct GitHub network workarounds.

After successful work, use the Codex product's normal diff/commit/apply/sync/PR handoff available in that environment. Shell GitHub connectivity is not an acceptance criterion.

## Current completion pointers

```text
LAST_COMPLETED_TASK_ID: F05_FIX16
NEXT_AUTHORIZED_TASK_ID: F05_FIX17
NEXT_TASK_STATUS: AUTHORIZED
CURRENT_TASK_FILE: docs/bridge/tasks/F05_FIX17.md
LAST_RESULT_FILE: docs/bridge/results/F05_FIX16_RESULT.md
```
