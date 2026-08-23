# TMR — F05_FIX4 Deterministic Actor Adaptation Loop

TASK_ID: F05_FIX4

Date: 2026-08-24

Task type: Gate 1F narrow actor-loop integration + game-theory-grounded audit + exact F05 remeasurement

## 0. Mission

F05_FIX3 restored the correct state-continuity contract but also restored the real remaining Gate 1F blocker:

```text
LATE_STEADY_STATE_RETURNS
ACTIVE_CONFLICT_STALEMATE -> OUTCOME_ELIGIBILITY_STALEMATE
```

External/game-AI research and current source inspection expose a narrower precondition that must be fixed before inventing any new faction consequence:

```text
T016 derives deterministic FactionActionProposal values
-> runSimulationStep returns them for the following tick
-> the common action intake can accept them
-> accepted faction actions can change Faction.currentStrategy
BUT
-> the current F03/F05 headless orchestration only submits player intervention actions
-> returned faction heuristic proposals are not carried into the following tick
```

This task has exactly one implementation goal:

```text
Complete the existing deterministic faction proposal -> common intake -> next-tick execution loop,
then measure whether the existing consumers already create a real non-terminal political consequence.
```

Do NOT invent a new action effect merely to make F05 pass.

If actor execution only changes `Faction.currentStrategy` and the existing runtime still has no meaningful downstream consumer in the active-conflict stalemate, classify that honestly as an `ACTOR_ACTION_CONSUMER_GAP`, keep Gate 1F `NOT_READY`, and stop.

---

## 1. Authorized base

BASE_BRANCH: `master`

BASE_COMMIT: `1c7666471bbbb22ee0bb1cb25801c6b9007f2a2d`

A newer HEAD is acceptable only if every commit after this base is a ChatGPT-authored Bridge authorization update under `docs/bridge/**`. Before execution run the freshness sequence in section 16 and verify there are no intervening gameplay/source changes.

---

## 2. Fixed accepted history

Treat these as accepted unless actual source contradicts them:

- F04: CLOSED / PASS
- F05_FIX1 recovery choice repair: accepted
- recovery WAIT classification: `TRADEOFF`
- recovery meaningful paid responses: 3
- political accommodation: `CONDITIONALLY_STRONG`
- F05_FIX2 late-stalemate diagnosis: useful
- F05_FIX2 continuity writer: REJECTED
- F05_FIX2_R: review accepted
- rejected writer classification: `EFFECTIVE_PERMANENCE_TIMER`
- rejected writer ratchet: `ONE_WAY_CONTINUITY_RATCHET`
- dissolution evidence in those branches: `GOVERNMENT_DEFEAT_ONLY`
- F05_FIX3 writer removal: PASS
- post-removal continuity: displacement alone does not decay continuity
- F05_FIX3 exact matrix: trustworthy / Gate 1F `NOT_READY`
- current remaining blocker: `LATE_STEADY_STATE_RETURNS`
- V02: NOT STARTED

Do not reopen state-continuity, terminal defeat, or succession as a shortcut in this task.

---

## 3. Required repository reading

Follow `AGENTS.md` and the Bridge protocol.

Read at minimum:

- `docs/GDD.md`
- `docs/ARCHITECTURE.md`
- `docs/QA_PLAYTEST.md`
- `docs/bridge/STATE.md`
- `docs/bridge/CURRENT_TASK.md`
- `docs/bridge/LAST_RESULT.md`
- `docs/bridge/results/F05_RESULT.md`
- `docs/bridge/results/F05_FIX1_RESULT.md`
- `docs/bridge/results/F05_FIX2_RESULT.md`
- `docs/bridge/results/F05_FIX2_R_RESULT.md`
- `docs/bridge/results/F05_FIX3_RESULT.md`
- `docs/F05_PACING_FUN_DECISION.md`
- `docs/F05_GATE1F_REPAIR1.md`
- `docs/F05_GATE1F_REPAIR2.md`
- `docs/F05_FIX2_STATE_CONTINUITY_ARCHITECTURE_REVIEW.md`
- `docs/F05_GATE1F_REPAIR3_REMOVE_CONTINUITY_WRITER.md`
- `docs/T016_FACTION_PRESSURE_CHECK.md`
- `docs/F04A_ENDOGENOUS_FACTION_DYNAMICS.md`
- `docs/F04B_ACTIVE_CONFLICT_RECOVERY_AGENCY.md`
- `docs/F04C_R_POLITICAL_HISTORICAL_REFERENCE_GROUNDING.md`
- `docs/F04D_INSTITUTION_ACTION_IMPLEMENTATION.md`
- `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`
- `src/sim/state/action.ts`
- `src/sim/core/step.ts`
- `src/sim/core/tick.ts`
- `src/sim/core/runtimeClosure.ts`
- `src/sim/systems/factionPressure.ts`
- relevant T017/T018/T021/Agenda consumers
- `src/sim/inspection/f03InterventionCounterfactuals.ts`
- `src/sim/inspection/f05PacingFunDecision.ts`

Repository source/tests/diffs remain higher authority than this Bridge prose.

---

## 4. External reference grounding — mandatory

Create:

```text
docs/F05_FIX4_ACTOR_ADAPTATION_REFERENCE_GROUNDING.md
```

Use the following verified references as conceptual evidence only. Do not copy implementation code and do not add these packages as dependencies.

### 4.1 OpenSpiel — algorithm taxonomy / best response

Repository:

```text
https://github.com/google-deepmind/open_spiel
```

Relevant document:

```text
https://github.com/google-deepmind/open_spiel/blob/master/docs/algorithms.md
```

Observed fact:

- OpenSpiel contains explicit best-response/exploitability algorithms alongside fictitious play, regret matching, CFR, PSRO, MCTS and RL methods.

TMR inference:

- the relevant concept for the current slice is **myopic/current-state best response**, not a full equilibrium solver;
- an actor should receive a legal unilateral opportunity to choose a response to current state;
- no OpenSpiel runtime dependency is authorized.

### 4.2 Best-response dynamics

Reference:

```text
Tim Roughgarden — Best-Response Dynamics
https://theory.stanford.edu/~tim/f13/l/f13.pdf
```

Observed fact:

- best-response dynamics models agents making successive unilateral beneficial deviations;
- such dynamics need not converge in arbitrary games and can cycle.

TMR inference:

- TMR does NOT need to force convergence to a Nash equilibrium;
- repeated faction adaptation, cycling, and path dependence are acceptable when caused by current state and legal actions;
- do not add an equilibrium-progress meter or convergence target.

### 4.3 Utility AI implementation pattern

Reference repository:

```text
https://github.com/bohdon/UtilityAIPlugin
```

Observed pattern:

- actions are candidate choices;
- considerations read current context and score choices;
- decision selection and action execution are separate concerns.

TMR inference:

- `Observation -> legal candidate -> choose -> ActionProposal -> validation -> execution` is compatible with TMR;
- however F05_FIX4 must NOT replace the existing rule-ordered T016 heuristic with arbitrary utility weights before action payoff/consequence semantics are grounded;
- Utility AI scoring remains a future option if a later task has explicit payoff mappings.

### 4.4 Gambit / Nashpy — explicit non-choice for runtime

References:

```text
https://github.com/gambitproject/gambit
https://nashpy.readthedocs.io/en/stable/
```

Observed facts:

- Gambit focuses on representing strategic/extensive games and computing equilibria;
- Nashpy focuses on two-player strategic-form games, best responses, equilibrium algorithms and learning dynamics.

TMR inference:

- the current political simulation is not a small static normal-form game;
- no Nash-equilibrium solver, payoff matrix, Python sidecar, Gambit or Nashpy dependency is authorized for runtime faction decisions.

### 4.5 QRE / stochastic bounded rationality — defer

Reference concept:

```text
Quantal Response Equilibrium / stochastic response models
```

Observed fact:

- QRE allows higher-payoff actions to be chosen with higher probability rather than requiring exact deterministic best response.

TMR inference:

- useful future reference for bounded rationality;
- NOT used in F05_FIX4 because this slice must remain deterministic and no RNG is added merely to manufacture behavioral variety.

### 4.6 MCP game-agent architecture — tool boundary only

Reference:

```text
https://github.com/chrisreddington/turn-based-game-mcp
```

Observed pattern:

- MCP exposes validated game tools/API operations to an agent while shared game logic remains separate.

TMR inference:

- MCP may be useful later as an external development/agent tool boundary;
- MCP is NOT the authoritative NPC brain and is NOT added to the simulation runtime in this task;
- no LLM/MCP dependency is authorized.

### 4.7 Plugin/MCP search result

No dedicated installed game-theory plugin was available in the current tool environment. This is not a blocker because GitHub/research references are sufficient for the current deterministic integration task.

The grounding document MUST separate:

```text
SOURCE-SUPPORTED FACT
INTERPRETATION
TMR DESIGN INFERENCE
IMPLEMENT / DEFER / REJECT
```

for each reference family.

---

## 5. Repository diagnosis before implementation

Prove the actual current flow.

At minimum verify these current contracts:

### T016 decision

`deriveFactionActionProposals()` / `chooseFactionActionProposal()`:

```text
current WorldState
-> FactionObservation
-> legal action availability from institutions/resources
-> deterministic rule-ordered action choice
-> source="heuristic" ActionProposal targeting next tick
```

### Common action intake

`acceptActionProposal()` / `acceptActionProposals()`:

```text
ActionProposal
-> deterministic action id + global sequence
-> accepted ValidatedActionRecord
```

### Faction action execution

`runFactionPressurePhase()`:

```text
accepted faction action in SimulationStepInput
-> decode faction payload
-> change Faction.currentStrategy if needed
-> FACTION_STRATEGY_CHANGED
```

### Simulation step boundary

`runSimulationStep()`:

```text
phase result actionProposals
-> returned as SimulationStepResult.actionProposals
-> proposals are output, not committed input
-> caller must intake them explicitly
```

### Current headless runner

Prove whether `runF03StrategyFromRecord()` and therefore F05 currently:

```text
submits player intervention actions
but discards returned faction actionProposals
```

Record counts from at least the early, near-crisis, and recovery representative F05 contexts:

- faction proposals generated;
- faction proposals accepted under the pre-FIX4 runner;
- strategy-change events;
- dominant proposed action types after the late-state threshold;
- whether proposed actions repeat while `currentStrategy` stays stale.

Classify the orchestration defect:

```text
NO_INTAKE_GAP
FACTION_PROPOSAL_INTAKE_GAP
BROADER_HEURISTIC_INTAKE_GAP
OTHER_WITH_EVIDENCE
```

Do not assume the answer merely because the task text predicts it.

---

## 6. Consumer inventory before changing the chooser

Search actual production consumers of:

```text
Faction.currentStrategy
FACTION_STRATEGY_CHANGED
FactionActionType
```

At minimum inspect:

- T017 instability;
- T018 coup/rebellion prerequisites;
- T021 active conflict strength/intents/recovery;
- Agenda/read models;
- F04A dynamics;
- intervention feasibility/effects.

Produce a table:

| Consumer | Reads currentStrategy? | What changes? | Active-conflict relevance? | Player reassessment relevance? |
|---|---|---|---|---|

Classify current downstream coverage:

```text
MEANINGFUL_EXISTING_CONSUMERS
PRECRISIS_ONLY_CONSUMERS
STRATEGY_LABEL_ONLY
MIXED_CONSUMER_COVERAGE
```

This classification determines whether actor intake alone can possibly close Gate 1F.

---

## 7. Authorized implementation — deterministic faction proposal intake

Implement the smallest reusable orchestration seam that carries **faction heuristic proposals** from one step into the common intake for the target following tick.

### Required architecture

```text
step N WorldState
-> runSimulationStep(...)
-> faction heuristic proposals targeting N+1
-> external/orchestration pending proposal buffer
-> common ActionProposal intake
-> accepted ValidatedActionRecord(s) for N+1
-> runSimulationStep(step N+1 input)
-> normal factionPressure action resolution
```

### Authority rules

- proposals are NOT authoritative state;
- do not store pending proposals in `WorldState`;
- accepted ActionRecords remain the only authoritative action input/log;
- the deterministic simulation core remains the only state mutator;
- do not let a heuristic or LLM directly mutate faction/world state;
- persistence/replay continues through accepted action records and canonical snapshot state.

### Scope

The integration is for T016 **faction heuristic proposals only** in this task.

Do not silently auto-accept unrelated diplomacy/LLM/player proposals.

The helper may be generic internally if that is simpler, but tests and F05 activation must explicitly constrain the accepted autonomous source/domain.

### Exactly-once

Every carried proposal must be:

- targeted to the immediately following tick;
- accepted at most once;
- dropped/rejected if stale or malformed rather than retargeted;
- cleared from the transient pending buffer after intake.

### Deterministic ordering

Use an explicit stable ordering.

Preferred behavior:

- preserve the canonical FactionId order already produced by T016;
- document how player action proposal(s) and carried faction proposal(s) receive global action sequence values when they share a target tick;
- sequence ordering may determine IDs/log order but must not create a hidden gameplay priority.

Do not use object insertion order as an unstated authority rule.

### Historical harness preservation

Do not silently rewrite historical F03/F04 measurements.

Preferred approach:

- expose a reusable actor-intake helper outside the authoritative step;
- add an explicit opt-in actor-loop mode to the developer runner used by F05;
- keep historical F03/F04 inspection behavior unchanged unless a test proves that changing it is required by an existing production contract.

F05 must explicitly run with faction autonomous intake enabled after this fix.

---

## 8. Do NOT replace the faction decision algorithm yet

Keep the existing deterministic T016 rule-ordered chooser for F05_FIX4.

Reason:

- best-response or Utility AI scoring requires meaningful action-specific payoffs/consequences;
- current T016 documentation explicitly says the existing faction actions are intentions and do not yet implement resources consumption, organization growth, bargaining outcomes, instability outcomes, rebellion resolution, etc.;
- adding arbitrary utility weights before those consequences exist would create a hidden political score rather than grounded intelligence.

Therefore F05_FIX4 may document a future interface such as:

```text
legal candidates
-> explicit state-derived utility/payoff projection
-> deterministic top action + stable tie-break
```

but must not implement a new generic utility meter, Nash solver, CFR, MCTS, QRE, stochastic action choice, or learned policy.

---

## 9. Pacing integrity — strategy changes are not automatically meaningful

Do NOT add `FACTION_STRATEGY_CHANGED` to the F05 pacing-event set merely because actor intake now emits it.

A faction strategy change counts as a legitimate reassessment only if actual existing state/consumer evidence shows that it changes at least one of:

- Agenda composition/priority/severity;
- legal/feasible player response set;
- crisis prerequisite/eligibility state;
- active conflict strength/intent/recovery state;
- territory;
- institutional state;
- another real downstream consequence that can change player behavior.

If strategy changes are semantically visible but causally inert in the current active-conflict state, record them as diagnostic actor activity but do not use them to shrink `longestReassessmentSilenceDays`.

This is critical: actor chatter/event density is not a Gate 1F fix.

---

## 10. Required actor-loop counterfactual

Run the same representative F05 contexts in two developer modes after the code change:

```text
A. faction autonomous intake OFF
B. faction autonomous intake ON
```

This is diagnostic only; the official post-FIX4 F05 result uses mode B.

For early, near-crisis, and recovery report:

- proposals generated;
- proposals accepted;
- strategy changes;
- action-type sequence over time;
- final currentStrategy values;
- changes in grievance / organization / resources;
- Agenda changes;
- crisis timing/eligibility changes;
- conflict strength/intent/recovery changes;
- territorial changes;
- player response-feasibility changes;
- terminal/consolidation state;
- longest genuine reassessment silence.

Then classify the impact:

```text
INTAKE_FIX_CREATES_MEANINGFUL_EXISTING_CONSEQUENCE
INTAKE_FIX_CHANGES_PRECRISIS_ONLY
INTAKE_FIX_STRATEGY_ONLY
INTAKE_FIX_NO_EFFECT
```

---

## 11. Exact F05 rerun

Run the unchanged official matrix with autonomous faction intake enabled:

```text
seed: 40103
horizon: 1,800 days / 5 years
contexts: tick 0/1, 18/19, 180/181
strategies:
WAIT
MATERIAL_RELIEF
POLITICAL_ACCOMMODATION
OPPOSITION_LEGALIZATION
COERCIVE_RESTRICTION
REPEATED_POLITICAL_ACCOMMODATION
```

Do not change scenario values or pacing thresholds to force a pass.

Report:

- WAIT classification per representative context;
- meaningful response counts;
- accommodation classification;
- faction proposals generated/accepted;
- faction strategy-change count and sequence;
- trajectory-signature count;
- causal readability;
- major-event silence;
- genuine reassessment silence;
- readable arc per context;
- outcomes;
- comparison with F05_FIX3.

Preserve the repeated-accommodation probe.

---

## 12. Gate interpretation

### Case A — intake closes the gap through existing consumers

If autonomous action intake changes real downstream state and produces truthful later reassessment cycles, rerun all acceptance checks and recommend `PASS` or `PASS_WITH_NOTES` only if the unchanged Gate 1F criteria are met.

### Case B — intake executes but currentStrategy has no active-conflict consequence

Return:

```text
ACTOR_ACTION_CONSUMER_GAP
GATE1F_RECOMMENDATION: NOT_READY
```

The smallest next task should then be a separately grounded design/implementation of one non-terminal faction-action consequence. Do NOT implement that consequence in F05_FIX4.

### Case C — intake changes only pre-crisis behavior

Return:

```text
PRECRISIS_ACTOR_LOOP_WORKS_ACTIVE_CONFLICT_CONSUMER_MISSING
GATE1F_RECOMMENDATION: NOT_READY
```

Again, do not add a second repair system in this task.

---

## 13. Explicitly forbidden scope

Do not implement:

- new state-continuity writer, decay, restoration, sovereignty meter, or T023 threshold change;
- automatic revolutionary succession or Government creation;
- new Faction fields solely for AI memory/payoff/history;
- a generic hidden utility/political score;
- Nash equilibrium, Gambit, Nashpy, OpenSpiel runtime dependency;
- CFR / regret matching / fictitious play / PSRO / MCTS / RL;
- QRE/logit randomness or RNG added for behavior diversity;
- MCP server/runtime dependency for NPC decisions;
- runtime LLM faction decisions;
- direct crisis deletion;
- free LandHex transfer;
- direct outcome scripting;
- intervention/faction/conflict balance tuning unrelated to proposal intake;
- arbitrary action resource costs or organization/grievance effects;
- strategy-specific scalar bonuses not already grounded in repository contracts;
- fake strategy-change pacing signals;
- chapters, story nodes, countdowns, periodic filler events;
- elections / parties / coalitions;
- full labor bargaining;
- transitional justice;
- military factions;
- local autonomy;
- War as Politics;
- fantasy/arcane institutions;
- V02 / renderer / UI;
- self-authorizing Gate 1F PASS or another task.

---

## 14. Expected artifacts

Create:

```text
docs/F05_FIX4_ACTOR_ADAPTATION_REFERENCE_GROUNDING.md
docs/F05_GATE1F_REPAIR4_ACTOR_LOOP.md
```

Add the smallest reusable orchestration helper/tests needed for deterministic faction heuristic intake.

Update F05 developer inspection only as needed for actor diagnostics and truthful remeasurement.

Write immutable Bridge result:

```text
docs/bridge/results/F05_FIX4_RESULT.md
```

Update on completion:

```text
docs/bridge/LAST_RESULT.md
docs/bridge/STATE.md
```

Do not overwrite historical F05/FIX1/FIX2/FIX2_R/FIX3 result files.

---

## 15. Required tests

Add focused tests proving at minimum:

1. a monthly T016 faction proposal targeting tick N+1 is accepted exactly once on N+1 when actor-loop mode is enabled;
2. proposal order remains canonical across object insertion-order perturbations;
3. stale proposals are not silently retargeted;
4. player action plus faction actions can share one target tick without sequence collisions;
5. autonomous faction actions change `currentStrategy` only through the normal accepted ActionRecord path;
6. disabling actor-loop mode reproduces the historical detached-runner behavior for diagnostic comparison;
7. save/load/replay determinism remains intact for authoritative state/action log after accepted actor actions;
8. F05 does not count causally inert `FACTION_STRATEGY_CHANGED` events as meaningful reassessment.

If the helper is generalized, add tests that F05 only auto-intakes the authorized faction heuristic domain.

---

## 16. Startup / freshness sequence

Before reading the task as executable state:

```bash
git status
git fetch origin
git rev-parse HEAD
git rev-parse origin/master
git pull --ff-only
```

Do not treat an unfetched local `origin/master` as current GitHub state.

Then verify:

```text
CURRENT_TASK.md = F05_FIX4
TASK_FILE = docs/bridge/tasks/F05_FIX4.md
base ancestry is Bridge-only after 1c7666471bbbb22ee0bb1cb25801c6b9007f2a2d
```

---

## 17. Verification

Preferred runtime:

```text
Node 24.19.0
pnpm 11.19.0
```

If Node 24 is unavailable, record the exact runtime and run the full suite anyway.

Run at minimum:

```bash
pnpm install --frozen-lockfile
pnpm run format
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm run inspect:t024
pnpm run inspect:f01
pnpm run inspect:f04b
pnpm run inspect:f04d
pnpm run inspect:f05
pnpm test
git diff --check
```

Run the new focused actor-loop tests explicitly.

Do not loosen global timeouts to hide failures.

---

## 18. Commit policy

COMMIT_POLICY: `COMMIT_AND_PUSH_ON_PASS`

Here PASS means:

- reference grounding is complete;
- the existing actor proposal loop is diagnosed correctly;
- the authorized proposal-intake integration is correct and deterministic;
- no ungrounded faction consequence is invented;
- verification passes;
- the official F05 rerun is truthful.

A result with:

```text
GATE1F_RECOMMENDATION: NOT_READY
ACTOR_ACTION_CONSUMER_GAP
```

is a valid successful F05_FIX4 task result.

Preferred implementation commit:

```text
fix: connect deterministic faction actor loop
```

Bridge/result documentation may be a separate commit following the existing workflow.

---

## 19. Required result schema

Write the Bridge result with at least:

```text
TASK_ID: F05_FIX4
STATUS: REPAIR_COMPLETE / BLOCKED
START_COMMIT:
END_COMMIT:
COMMIT_CREATED:
PUSHED:

REFERENCE_GROUNDING:
- OpenSpiel / best response:
- Utility AI:
- Gambit/Nashpy:
- QRE:
- MCP:
- dependencies added: YES / NO
- new external runtime service added: YES / NO

PRE_FIX_DIAGNOSIS:
- orchestration classification:
- proposals generated:
- proposals accepted:
- strategy changes:
- evidence:

CONSUMER_INVENTORY:
- currentStrategy consumers:
- active-conflict meaningful consumer exists: YES / NO
- classification:

IMPLEMENTATION:
- orchestration seam:
- pending proposal authority:
- intake domain:
- exact-once behavior:
- deterministic ordering:
- player + faction same-tick sequence behavior:
- persistence/replay treatment:

ACTOR_LOOP_COUNTERFACTUAL:
- early OFF vs ON:
- near OFF vs ON:
- recovery OFF vs ON:
- impact classification:

F05_RERUN:
- matrix:
- WAIT early:
- WAIT near:
- WAIT recovery:
- accommodation:
- meaningful responses:
- actor proposals generated/accepted:
- strategy-change count:
- longest major-event silence:
- longest genuine reassessment silence:
- readable arc early:
- readable arc near:
- readable arc recovery:
- trajectory diversity:
- causal readability:
- terminal outcomes:

REMAINING_BLOCKER_CLASSIFICATION:
- ...

GATE1F_RECOMMENDATION:
PASS / PASS_WITH_NOTES / NOT_READY

NEXT_RECOMMENDED_TASK:
- at most one narrow recommendation; no implementation

VERIFICATION:
- environment:
- install:
- format:
- typecheck:
- lint:
- build:
- inspect:t024:
- inspect:f01:
- inspect:f04b:
- inspect:f04d:
- inspect:f05:
- focused actor-loop tests:
- full tests:
- git diff --check:

NEXT_AUTHORIZED_TASK_ID: NONE
V02: NOT STARTED
```

---

## 20. Completion discipline

On completion:

- update Bridge to `F05_FIX4: REPAIR_COMPLETE / AWAITING_CHATGPT_REVIEW` or truthful blocked state;
- set `NEXT_AUTHORIZED_TASK_ID: NONE`;
- set `NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW`;
- set `CURRENT_TASK_FILE: NONE`;
- keep `V02: NOT STARTED`;
- do not implement the next consumer/payoff task;
- do not declare Gate 1F passed without ChatGPT/user review.

The objective is not to make factions look busy. The objective is to prove that existing actor decisions actually enter the authoritative action pipeline, then reveal whether TMR already has enough downstream political consequence to keep the player making meaningful decisions.
