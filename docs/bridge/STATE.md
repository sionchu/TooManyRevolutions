# TMR Bridge State

UPDATED: 2026-08-24

REPOSITORY: sionchu/TooManyRevolutions

BRANCH: master

F04_CLOSED_COMMIT: 2db9ccd43b09bc4f24bb6980b5bd200b5464c5fc

F05_MEASUREMENT_COMMIT: 1866287e87072fc9b62f55a4af940f9d0e54b15b

GATE1F_REVIEW_COMMIT: 2423e629b018052d24f495793e10803cd5a0f837

F05_FIX1_REPAIR_COMMIT: 60c584543f1cfaf89c2066f8060859e7a6d2f103

F05_FIX2_REPAIR_COMMIT: 57bb80db449be0a29cb788e9f49b260eab290416

F05_FIX2_RESULT_COMMIT: cc51ad77d9ffa27afc49f21fe92dc0992e6ac846

F05_FIX2_R_TASK_COMMIT: 8054e99ae12385bb43cd7e30bf480ff9ee930c5c

F05_FIX2_R_PROBE_COMMIT: f9f108696bf2de724428d0d61a8c4ba14935e42e

F05_FIX2_R_RESULT_COMMIT: 1191bd1865200f4542d571a8af493392b075c4bd

F05_FIX3_TASK_COMMIT: dda5949ba70165dd65ac86c48561d82f69b3a375

F05_FIX3_IMPLEMENTATION_COMMIT: 49511e43d40d39408ad96e31d45109eb79afa63c

F05_FIX3_RESULT_COMMIT: 1c7666471bbbb22ee0bb1cb25801c6b9007f2a2d

F05_FIX4_TASK_COMMIT: 406d6dd21561911d1a0c201b13d445d58623bee2

F05_FIX4_IMPLEMENTATION_COMMIT: 557b1327d4f561a24e32aee31f2f7c3c0ad15b15

F05_FIX4_RESULT_COMMIT: 9d8324cdb5db13bbccad04ff5400e8ea0dffcafd

F05_FIX5_TASK_COMMIT: f09aa6ce62dadba29427e2139772846d3d98be4e

CURRENT_GATE: Gate 1F

CURRENT_PHASE: F05_FIX5 faction action consequence / payoff grounding

F04: CLOSED / PASS

F05: MEASUREMENT_COMPLETE / REVIEWED

F05_FIX1: REPAIR_COMPLETE / REVIEWED

F05_FIX2: REPAIR_COMPLETE / REVIEWED

F05_FIX2_MEASUREMENT: TRUSTWORTHY_BUT_TERMINAL_MECHANISM_REJECTED

F05_FIX2_R: REVIEW_COMPLETE / REVIEWED

F05_FIX2_R_ARCHITECTURE_VERDICT: REJECT_WRITER_REQUIRES_NEW_CONTINUITY_EVIDENCE

F05_FIX3: REPAIR_COMPLETE / REVIEWED

F05_FIX3_WRITER_REMOVAL: PASS / ACCEPTED

F05_FIX3_MEASUREMENT: TRUSTWORTHY_LATE_STEADY_STATE_RETURNED

F05_FIX4: REPAIR_COMPLETE / REVIEWED

F05_FIX4_IMPLEMENTATION: PASS / ACCEPTED

F05_FIX4_PROPOSAL_INTAKE_GAP: CLOSED

F05_FIX4_IMPACT: INTAKE_FIX_STRATEGY_ONLY

F05_FIX4_REMAINING_BLOCKER: ACTOR_ACTION_CONSUMER_GAP

F05_FIX5: COMPLETE / AWAITING_CHATGPT_REVIEW

F05_FIX5_CLASSIFICATION: INSUFFICIENT_ACTION_CONSEQUENCE_GROUNDING

F05_FIX5_SELECTED_ACTION: NONE

F05_FIX5_ACTIVE_CONFLICT_CONSUMER: NONE

F05_FIX5_GATE1F_RECOMMENDATION: NOT_READY

GATE1F_CHATGPT_DECISION: NOT_READY

V02: NOT STARTED

POLITICAL_COMPETITION: IMPLEMENTED — `banned | restricted | plural`

PERSISTENCE: SerializedSimulationSnapshotV2

LAST_COMPLETED_TASK_ID: F05_FIX5

NEXT_AUTHORIZED_TASK_ID: NONE

NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW

CURRENT_TASK_FILE: NONE

LAST_RESULT_FILE: `docs/bridge/results/F05_FIX5_RESULT.md`

F05_FIX5_RESULT_COMMIT: 1bf0542dcd3584ff283d92a00461fdf6f134a416

FUTURE_REFERENCE_GROUNDING_GATES: `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`

## ChatGPT acceptance of F05_FIX4

ChatGPT accepts F05_FIX4 as a correct deterministic actor-loop repair.

Accepted facts:

- T016 heuristic faction proposals were previously generated but dropped by the F03/F05 developer orchestration;
- F05_FIX4 closes that intake gap through a transient, deterministic, next-tick common ActionRecord intake seam;
- actor-loop ON changes `Faction.currentStrategy` and emits real accepted faction actions exactly once;
- pending proposals remain non-authoritative and are not persisted in WorldState/RunRecord;
- no OpenSpiel/Nash/MCTS/RL/LLM/MCP runtime dependency was introduced;
- strategy-change events are not counted as meaningful pacing by themselves;
- actor-loop OFF vs ON shows no meaningful change in grievance, organization, resources, Agenda timing, crisis timing, active-conflict strength/intent/recovery, territory, player feasibility, terminal state, or genuine reassessment silence;
- therefore the remaining blocker is `ACTOR_ACTION_CONSUMER_GAP`, not actor selection or proposal intake.

Gate 1F remains `NOT_READY` and V02 remains blocked.

## F05_FIX5 grounding direction

F05_FIX5 must audit `FUND_MOVEMENT`, `ORGANIZE`, `LOBBY`, `BARGAIN`, and `ACCEPT` using the F04C-R mechanism-first method.

Reference direction accepted for the task:

- resource-mobilization literature supports treating resources and organization as conditions of collective mobilization rather than grievance alone;
- advocacy/lobbying literature emphasizes access, information, coalitions, and institutional opportunity rather than a universal scalar influence bonus;
- therefore `LOBBY`, `BARGAIN`, and `ACCEPT` must be deferred if the repository lacks a represented demand/counterpart/accepted object;
- `ORGANIZE` and `FUND_MOVEMENT` are preferred first candidates only because current T018/T021 already consume faction resources, organization, and local mobilization;
- no numeric conversion may be chosen merely to shrink F05 silence.

The task may implement at most one consequence, and only if it has a grounded cost/commitment, bounded authoritative state change, existing active-conflict/pre-crisis consumer, deterministic causal path, and no ratchet/terminal shortcut.

A truthful `INSUFFICIENT_ACTION_CONSEQUENCE_GROUNDING / NOT_READY` is an acceptable successful outcome.

## Forbidden until later authorization

- continuity decay/restoration / sovereignty meter / T023 threshold change
- automatic revolutionary succession or Government creation
- direct crisis deletion / direct conflict resolution / free LandHex / hidden comeback
- generic hidden utility/political-power/stability score
- arbitrary strategy-specific combat bonus
- arbitrary grievance delta from an action name alone
- Nash/CFR/fictitious-play/PSRO/MCTS/RL runtime systems
- QRE/logit randomness
- MCP/LLM runtime NPC decisions
- elections / parties / coalitions
- full labor bargaining
- transitional justice
- military factions
- local autonomy
- War as Politics
- fantasy / arcane institutions
- V02 / renderer / UI
- story nodes / countdowns / filler events
- self-authorizing Gate 1F PASS or another task

## Bridge freshness requirement

Before starting F05_FIX5, Codex must explicitly run:

```bash
git status
git fetch origin
git rev-parse HEAD
git rev-parse origin/master
git pull --ff-only
```

Do not rely on a stale local `origin/master` tracking ref.

Gate 1F remains ChatGPT/user authority. Repository source, tests, diffs, actual simulation evidence, and the immutable F05_FIX5 task remain the execution authority.
