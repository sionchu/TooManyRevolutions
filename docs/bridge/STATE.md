# TMR Bridge State

UPDATED: 2026-08-25
REPOSITORY: sionchu/TooManyRevolutions
BRANCH: master
CURRENT_GATE: Gate 1F
GATE1F_CHATGPT_DECISION: NOT_READY
V02: NOT_STARTED

## Authority

Repository source/tests/diffs override Bridge prose. GitHub Bridge task files are the task authority for Codex execution; the active local `TooManyRevolutions` workspace is the implementation base. Historical task/result docs retain detailed evidence.

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
F05_FIX17: static coup coordination authoring seam IMPLEMENTED in active local Codex workspace; continuation authorized
```

F05_FIX17 reported classification:

```text
PRIMARY_CLASSIFICATION: COUP_COORDINATION_AUTHORING_SEAM_IMPLEMENTED
NEXT_IMPLEMENTATION_READINESS: COUP_COORDINATION_RUNTIME_VERTICAL_SLICE
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

The FUND_MOVEMENT route is closed as the current Gate 1F pacing remedy. Do not extend it with another payoff, target, timer, cooldown, or lifecycle rule.

## Accepted coup-coordination semantics

```text
ACTOR_MODEL: STATIC_SCENARIO_AUTHORED_COUP_COORDINATION_NODES_WITH_AUTHORED_REQUIRED_SET
ALIGNMENT_MODEL: incumbent | coup | uncommitted
TRANSITION_PROVENANCE: explicit typed required-node response with ActionRecord/event provenance
OUTCOME_RULE: all required nodes coup => nonterminal governmentTransition; any required node incumbent => statusQuo; otherwise active
```

`uncommitted` is absence of accepted decisive response, not a numeric/progress meter. Coup remains non-territorial. State Dissolution remains T023-owned.

## Current authorized task

```text
TASK_ID: F05_FIX18
STATUS: AUTHORIZED
TASK_FILE: docs/bridge/tasks/F05_FIX18.md
RESULT_PATH: docs/bridge/results/F05_FIX18_RESULT.md
```

F05_FIX18 implements one minimal runtime vertical slice:

```text
COUP_COORDINATION_RESPONSE
-> sparse decisive node response state
-> deterministic response event provenance
-> authored necessary-set evaluation
-> existing applyConflictOutcome()
-> statusQuo / governmentTransition / remain active
-> persistence V7 + replay closure
```

F05_FIX18 does **not** authorize an autonomous response producer. No pacing improvement may be claimed merely from existence of the explicit response path.

If implemented, expected next readiness is:

```text
COUP_COORDINATION_RESPONSE_SOURCE_GROUNDING
```

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

## Codex Desktop execution policy

Codex Desktop may read the authorized Bridge task directly from GitHub while implementing in the existing local repository.

The local copy of `docs/bridge/CURRENT_TASK.md` may lag GitHub and is **not** an execution gate. Shell `git fetch`, `git pull`, `git push`, exact SHA synchronization, reset/rebase/force, or direct `github.com:443` access are not prerequisites merely to consume Bridge task metadata.

For F05_FIX18, the local workspace is expected to contain the completed FIX17 authoring seam. If it does not, report `BLOCKED_MISSING_FIX17_AUTHORING_SEAM`; do not recreate FIX17 inside FIX18.

## Current completion pointers

```text
LAST_COMPLETED_TASK_ID: F05_FIX17
NEXT_AUTHORIZED_TASK_ID: F05_FIX18
NEXT_TASK_STATUS: AUTHORIZED
CURRENT_TASK_FILE: docs/bridge/tasks/F05_FIX18.md
LAST_REVIEWED_REMOTE_RESULT: docs/bridge/results/F05_FIX16_RESULT.md
```
