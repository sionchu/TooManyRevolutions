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

F05_FIX4_RESULT_COMMIT: PENDING

CURRENT_GATE: Gate 1F

CURRENT_PHASE: F05_FIX4 complete — deterministic faction actor-loop integration

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

F05_FIX3_REMAINING_BLOCKER: LATE_STEADY_STATE_RETURNS

F05_FIX4: REPAIR_COMPLETE / AWAITING_CHATGPT_REVIEW

F05_FIX4_REMAINING_BLOCKER: ACTOR_ACTION_CONSUMER_GAP

F05_FIX4_GATE1F_RECOMMENDATION: NOT_READY

GATE1F_CHATGPT_DECISION: NOT_READY

V02: NOT STARTED

POLITICAL_COMPETITION: IMPLEMENTED — `banned | restricted | plural`

PERSISTENCE: SerializedSimulationSnapshotV2

LAST_COMPLETED_TASK_ID: F05_FIX4

NEXT_AUTHORIZED_TASK_ID: NONE

NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW

CURRENT_TASK_FILE: NONE

LAST_RESULT_FILE: `docs/bridge/results/F05_FIX4_RESULT.md`

FUTURE_REFERENCE_GROUNDING_GATES: `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`

## ChatGPT acceptance of F05_FIX3

ChatGPT accepts F05_FIX3 as a correct rollback and truthful remeasurement.

Accepted current facts:

- the rejected F05_FIX2 weekly `stateContinuity` writer is absent from production;
- domestic-rebellion displacement alone does not reduce `stateContinuity` or cause elapsed-time dissolution;
- recovery remains `TRADEOFF` with three meaningful paid responses;
- political accommodation remains `CONDITIONALLY_STRONG`;
- early and near-crisis representative branches again contain up to 1,200 days of genuine late steady-state reassessment silence;
- the remaining blocker is non-terminal active-conflict stalemate, not state dissolution;
- all current continuity/succession shortcuts remain forbidden.

## F05_FIX4 external/game-AI grounding

Before authorizing the implementation, ChatGPT reviewed current external references and current repository flow.

Reference conclusions:

- OpenSpiel provides best-response, fictitious-play, regret/CFR, PSRO, search and RL algorithms; only the **current-state best-response idea** is relevant to this narrow slice. No OpenSpiel dependency is authorized.
- Best-response dynamics supports repeated unilateral adaptation and does not require forced convergence; TMR may exhibit cycling/path dependence when caused by actual state.
- Utility AI repositories demonstrate `candidate actions -> current-context considerations -> selection -> separate execution`; this is compatible conceptually, but arbitrary utility weights are deferred until action-specific consequences/payoffs are grounded.
- Gambit/Nashpy equilibrium solvers are not appropriate runtime dependencies for the current dynamic political simulation.
- stochastic QRE-style bounded rationality is deferred; no RNG is added merely to create variety.
- MCP game-agent examples are useful only as tool/API-boundary references. MCP/LLM is not added as an authoritative NPC decision path.
- no dedicated game-theory plugin was available in the current plugin environment; this is not a blocker.

## F05_FIX4 source diagnosis being tested

Current source already contains:

```text
FactionObservation
-> deterministic legal faction choice
-> source="heuristic" FactionActionProposal targeting the next tick
-> common ActionProposal intake
-> accepted faction action
-> Faction.currentStrategy + FACTION_STRATEGY_CHANGED
```

But `runSimulationStep()` deliberately returns proposals as non-authoritative output and requires the caller to intake them. The current F03/F05 headless orchestration submits player intervention actions but does not carry returned faction heuristic proposals into the next tick.

F05_FIX4 must prove this defect from source/runtime before implementing the smallest deterministic intake seam.

## F05_FIX4 scope

Authorized:

1. create the external reference-grounding artifact required by the task;
2. inventory actual `currentStrategy` consumers;
3. connect existing T016 faction heuristic proposals to the common next-tick action intake exactly once in an explicit actor-enabled orchestration mode;
4. preserve proposals as non-authoritative/transient and accepted ActionRecords as the authoritative input/log;
5. keep the current deterministic rule-ordered faction chooser;
6. run OFF-vs-ON actor-loop counterfactuals;
7. rerun the unchanged F05 36-branch / five-year matrix with faction actor intake ON;
8. if only strategy labels/events change and no meaningful active-conflict consumer exists, return `ACTOR_ACTION_CONSUMER_GAP` and stop.

Forbidden:

- adding new faction action resource/grievance/organization effects;
- arbitrary Utility AI payoff weights or a hidden utility score;
- Nash/CFR/fictitious-play/PSRO/MCTS/RL runtime systems;
- QRE/random actor choice;
- MCP/LLM runtime faction decisions;
- new continuity/dissolution/succession shortcut;
- counting causally inert `FACTION_STRATEGY_CHANGED` events as pacing merely to shrink silence;
- V02 / renderer / UI;
- War as Politics;
- fantasy institutions;
- elections/parties, full labor bargaining, transitional justice, military factions, local autonomy;
- self-authorizing Gate 1F PASS or another task.

## Bridge freshness requirement

Before starting F05_FIX4, Codex must explicitly run:

```bash
git status
git fetch origin
git rev-parse HEAD
git rev-parse origin/master
git pull --ff-only
```

Do not rely on a stale local `origin/master` tracking ref.

Gate 1F remains ChatGPT/user authority. Repository source, tests, diffs, actual simulation evidence, and the immutable F05_FIX4 task remain the execution authority.

## F05_FIX4 completion evidence

- `F05_FIX4` repaired the detached T016 heuristic proposal hand-off with a
  transient, source/domain-constrained, canonical next-tick intake helper.
- OFF/ON actor counterfactual: representative WAIT branches generated 120
  proposals; OFF accepted 0 and changed 0 strategies; ON accepted 118/120/118
  and changed 5/5/3 strategies for early/near/recovery.
- ON actor execution changed only `Faction.currentStrategy` and its event
  evidence in the active-conflict path. Grievance, organization, resources,
  Agenda timing, crisis timing, conflict/territory, feasibility, terminal state,
  and genuine reassessment silence did not change.
- classification: `ACTOR_ACTION_CONSUMER_GAP`; Gate 1F recommendation remains
  `NOT_READY`.
- reference grounding: `docs/F05_FIX4_ACTOR_ADAPTATION_REFERENCE_GROUNDING.md`
- repair evidence: `docs/F05_GATE1F_REPAIR4_ACTOR_LOOP.md`
- immutable result: `docs/bridge/results/F05_FIX4_RESULT.md`
- verification: Node `v25.2.1`, pnpm `11.19.0`; full suite 52 files / 428 tests
  passed; required T024/F01/F04B/F04D/F05 inspections passed.
