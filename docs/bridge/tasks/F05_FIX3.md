# TMR — F05_FIX3 Remove Rejected Continuity Writer + Exact F05 Remeasurement

TASK_ID: F05_FIX3

Date: 2026-08-24

Task type: Gate 1F correctness repair + exact pacing remeasurement

## 0. Mission

`F05_FIX2_R` conclusively rejected the F05_FIX2 unresolved-internal-rebellion `stateContinuity` writer.

Accepted review findings:

```text
COUNTDOWN_REVIEW: EFFECTIVE_PERMANENCE_TIMER
RATCHET_REVIEW: ONE_WAY_CONTINUITY_RATCHET
DISSOLUTION_EVIDENCE_REVIEW: GOVERNMENT_DEFEAT_ONLY
REVOLUTIONARY_SUCCESSION_REVIEW: SUCCESSION_SEAM_EXISTS_BUT_EVIDENCE_MISSING
STATE_CONTINUITY_WRITER_VERDICT: WRITER_TRACKS_GOVERNMENT_CONTROL_NOT_STATE_CONTINUITY
ARCHITECTURE_VERDICT: REJECT_WRITER_REQUIRES_NEW_CONTINUITY_EVIDENCE
```

This task has exactly two goals:

```text
1. Remove the rejected F05_FIX2 weekly continuity writer and restore the pre-writer continuity architecture.
2. Rerun the unchanged F05 36-branch / five-year matrix to reveal the truthful pacing state after that removal.
```

Do **not** replace the rejected writer with another terminal shortcut, countdown, restoration formula, revolutionary succession implementation, filler event, or new subsystem in this task.

A truthful result may return Gate 1F to the earlier late-steady-state blocker. That is acceptable and preferred over manufacturing a pass.

Codex may recommend the next narrow task, but must not implement it, pass Gate 1F, or authorize V02.

---

## 1. Authorized base

BASE_BRANCH: `master`

BASE_COMMIT: `1191bd1865200f4542d571a8af493392b075c4bd`

Before doing any work:

```bash
git status
git fetch origin
git rev-parse HEAD
git rev-parse origin/master
git pull --ff-only
```

After fetch/pull, `origin/master` must contain this task and all newer commits must be ChatGPT-authored Bridge authorization-only changes under `docs/bridge/**`.

If a gameplay/source commit exists after the base, stop and report the task as stale.

This explicit `git fetch origin` requirement is mandatory; do not treat a stale local `origin/master` tracking ref as proof that GitHub is current.

---

## 2. Required reading

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
- `docs/F05_PACING_FUN_DECISION.md`
- `docs/F05_GATE1F_REPAIR1.md`
- `docs/F05_GATE1F_REPAIR2.md`
- `docs/F05_FIX2_STATE_CONTINUITY_ARCHITECTURE_REVIEW.md`
- `docs/F04B_ACTIVE_CONFLICT_RECOVERY_AGENCY.md`
- `docs/F04C_R_POLITICAL_HISTORICAL_REFERENCE_GROUNDING.md`
- `docs/T021_SIMPLIFIED_CONFLICT_WAR_CHECK.md`
- `docs/T023_STATE_DISSOLUTION_CHECK.md`
- `docs/T024_PERSISTENCE_REPLAY_CHECK.md`
- `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`
- current `conflict.ts`, `conflictResolution.ts`, dissolution code, F05 inspection, and related tests

Repository source/tests/diffs remain higher authority than Bridge prose.

---

## 3. Fixed project decisions

Treat the following as fixed for this task unless the current repository directly contradicts them:

### 3.1 F05_FIX2_R verdict is accepted

The rejected writer must not remain authoritative gameplay merely because it improved F05 pacing.

### 3.2 Player identity

The player is the historical continuity of the state (`CountryId`), not the incumbent Government, Faction, ruler, dynasty, party, or ideology.

The following are not automatic defeat by themselves:

- revolution;
- coup;
- monarchy collapse;
- government turnover;
- election loss;
- a particular government losing a civil war;
- temporary capital loss;
- total occupation alone;
- zero Country-controlled LandHexes alone.

### 3.3 State Dissolution

`State Dissolution` remains the only terminal defeat.

A terminal continuity consequence requires authoritative evidence for disappearance of the state as an independent political community, such as supported evidence of annexation, permanent fragmentation, loss of sovereign functions, or another explicitly grounded scenario-owned extinction condition.

No such new evidence domain is authorized here.

### 3.4 Physical territory authority

Only:

```text
WorldState.landHexStates[*].controller
```

is authoritative physical territorial control.

`Region.stateControl` remains administrative/security/state penetration, not physical ownership.

### 3.5 Accepted F05_FIX1 gains

Preserve unless removal of the rejected writer itself necessarily changes measurement outcome:

- recovery response coverage repair;
- recovery `TRADEOFF` classification if supported by the current matrix;
- material relief / political accommodation / opposition legalization causal distinctions;
- political accommodation is not to be silently weakened or strengthened;
- Agenda measurement corrections remain valid;
- F04B current-state recovery boundary remains valid.

---

## 4. Exact production change authorized

Remove only the F05_FIX2 unresolved-internal-rebellion continuity-pressure mechanism.

At minimum inspect and remove/retire as appropriate:

```text
CONFLICT_RESOLUTION_CONFIG.unresolvedInternalRebellionContinuityLoss
applyUnresolvedInternalRebellionContinuityPressure()
its invocation from runConflictPhase()
production tests added specifically to require that rejected behavior
Architecture prose that currently describes the rejected writer as valid current architecture
```

After the repair, the current production architecture should again reflect:

```text
internal rebellion + zero Country Hexes
≠ automatic stateContinuity decrement
≠ automatic State Dissolution
```

T023 may continue to evaluate the existing scenario-owned `stateContinuity` threshold; this task does not remove T023 or redesign `stateContinuity`.

Do not alter the scenario threshold simply because no current production writer reaches it in F05.

---

## 5. Historical artifacts vs current truth

Do not rewrite history.

Keep these immutable historical records intact:

- `docs/bridge/results/F05_FIX2_RESULT.md`
- `docs/bridge/results/F05_FIX2_R_RESULT.md`
- `docs/F05_GATE1F_REPAIR2.md`
- `docs/F05_FIX2_STATE_CONTINUITY_ARCHITECTURE_REVIEW.md`

They document what happened and why the writer was rejected.

Update current-truth documentation such as `docs/ARCHITECTURE.md` only where F05_FIX2 had promoted the rejected writer into current architecture.

The current architecture must explicitly make clear that:

- the F05_FIX2 writer was rejected and removed;
- internal-rebellion full displacement alone does not mutate state continuity;
- annexation / permanent fragmentation / sovereign-function evidence remain deferred unless already implemented elsewhere;
- government transition remains distinct from state dissolution.

If the developer-only `f05Fix2StateContinuityReview` source/test is no longer meaningful against current runtime, it may be removed. The historical commit and review documents remain the evidence. Do not mutate that probe into a different test while keeping a misleading name.

---

## 6. Required focused regression checks

Add or retain narrow tests proving the repaired current semantics.

At minimum demonstrate:

### A. Internal rebellion displacement does not drain continuity

Under the same type of qualifying state used by F05_FIX2_R:

```text
Country controls zero Hexes
active internal rebellion
participant domestic Faction physically controls territory
no government recovery
```

advance multiple weekly boundaries and verify `Country.stateContinuity` does not mechanically decrement.

### B. No automatic dissolution from displacement alone

Using a valid scenario with initial continuity above its threshold, verify that persistent internal-rebellion displacement alone does not reach `STATE_DISSOLVED` merely by elapsed weekly boundaries.

This test does not need to run forever; run far enough to prove the rejected 100-week arithmetic path is gone.

### C. Government transition remains non-terminal

Preserve/verify the existing typed `governmentTransition` seam:

- same `CountryId`;
- changed `currentGovernmentId` when explicitly supplied valid evidence exists;
- active RunOutcome;
- no automatic State Dissolution.

Do not add automatic successor selection.

### D. F04B recovery boundary remains intact

Real strength-qualified government recovery may still restore at most one Hex per eligible weekly conflict boundary as already authorized.

### E. T024 determinism/persistence remains intact

No schema migration should be required merely by removing the writer/config constant.

---

## 7. Exact F05 remeasurement

After removing the writer, rerun the same F05 matrix without changing scenario values, action strengths, decision criteria, or readable-arc thresholds.

Fixed matrix:

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

Report at minimum:

- WAIT classification in early / near-crisis / recovery;
- meaningful paid response count by representative context;
- political accommodation classification;
- trajectory-signature count;
- causal readability;
- longest major-event silence;
- longest reassessment silence;
- readable arc in each representative context;
- terminal outcomes;
- consolidation state;
- whether the pre-FIX2 late steady-state span returns;
- whether any new or previously hidden non-terminal reassessment remains after writer removal.

Compare three historical checkpoints clearly:

```text
F05_FIX1 truthful state before rejected writer
F05_FIX2 with rejected writer
F05_FIX3 after writer removal
```

Do not count the disappearance of an invalid terminal event as a regression by itself. The question is whether the remaining game has enough truthful political consequence density.

---

## 8. Pacing interpretation rule

If writer removal causes the ~1,200-day late steady state to return, report it plainly.

Do **not** repair that pacing gap inside F05_FIX3.

Classify the remaining blocker using current evidence. Suggested categories:

```text
NO_REMAINING_BLOCKER
LATE_STEADY_STATE_RETURNS
ACTIVE_CONFLICT_STALEMATE
NONTERMINAL_CONSEQUENCE_MISSING
SUCCESSOR_RESOLUTION_EVIDENCE_MISSING
CONTINUITY_EVIDENCE_MISSING
MEASUREMENT_GAP
MIXED_CAUSE
OTHER_WITH_EVIDENCE
```

A truthful `NOT_READY` is a successful F05_FIX3 result if correctness is restored and measurement is trustworthy.

---

## 9. No automatic revolutionary succession in this task

F05_FIX2_R established:

```text
SUCCESSION_SEAM_EXISTS_BUT_EVIDENCE_MISSING
```

That means the architecture can represent a non-terminal Government transition when an already existing valid successor Government and typed outcome are supplied, but current F05 branches do not contain enough authoritative evidence to automatically select one.

Therefore this task MUST NOT:

- create a new revolutionary Government automatically;
- infer a successor from the winning Faction alone;
- transfer all Faction-held LandHexes to a new Government/Country controller;
- resolve rebellion merely because the incumbent Government lost all Hexes;
- invent party/election/coalition/military-faction succession logic.

If successor resolution appears to be the next necessary political consequence after measurement, report it as a future candidate only.

---

## 10. External-reference / grounding guardrail

Read and obey `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`.

Use the F04C-R mechanism-first sequence:

```text
repository contract
→ current state/mechanism
→ conditions + counterexample + failure mode
→ trade-off
→ TMR state/consumer mapping
→ smallest authorized change
```

No new external research should be necessary to remove a writer already rejected by repository-grounded architecture review.

Do not search for references merely to invent a replacement mechanic.

If remeasurement reveals that a future replacement requires a new continuity or succession mechanism, report the missing grounding explicitly and defer implementation.

War as Politics, Fantasy institutional politics, and Gate 1V visual reference work remain out of scope.

---

## 11. Explicit forbidden scope

Do not implement or change:

- any replacement `stateContinuity` decay/pressure formula;
- continuity restoration;
- new sovereignty/continuity meter;
- T023 dissolution threshold values;
- automatic revolutionary succession;
- Government creation from a Faction;
- elections / parties / seats / coalitions;
- full labor bargaining;
- transitional justice;
- military factions / loyalty;
- local autonomy / federalism;
- War as Politics;
- fantasy/arcane institutions;
- V02 / renderer / UI;
- strategic AI / MCTS / runtime LLM;
- intervention cost/duration/effect rebalance;
- faction formula rebalance;
- crisis threshold rebalance;
- conflict-strength rebalance;
- free LandHex transfer;
- direct crisis/conflict deletion;
- hidden comeback state;
- chapters / revolution phases / countdowns / permanence timers;
- filler periodic events;
- RNG merely to manufacture diversity;
- F05 scenario-value changes made to force a pass;
- F05 readable-arc threshold changes made to force a pass;
- self-authorizing Gate 1F PASS, Gate 1V, V02, or another follow-up task.

---

## 12. Expected artifacts

Create:

```text
docs/F05_GATE1F_REPAIR3_REMOVE_CONTINUITY_WRITER.md
```

Write immutable Bridge result:

```text
docs/bridge/results/F05_FIX3_RESULT.md
```

Update on completion:

```text
docs/bridge/LAST_RESULT.md
docs/bridge/STATE.md
```

Do not overwrite F05/F05_FIX1/F05_FIX2/F05_FIX2_R historical result files.

---

## 13. Verification

Preferred verified desktop runtime:

```text
Node 24.19.0
pnpm 11.19.0
```

If Node 24.19.0 is unavailable in the actual workspace, do not modify source merely to compensate. Record the exact runtime used and run the complete verification suite. Environment mismatch is a note that ChatGPT/user will evaluate.

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

Also run focused tests for:

- rejected writer absence;
- no displacement-only continuity decay;
- government transition non-terminal contract;
- F04B recovery preservation.

Do not loosen test timeouts to hide a regression.

---

## 14. Commit policy

COMMIT_POLICY: `COMMIT_AND_PUSH_ON_PASS`

Here PASS means:

- rejected writer removed cleanly;
- current architecture documentation corrected;
- no replacement shortcut introduced;
- required regression tests pass;
- exact F05 matrix rerun is truthful;
- Bridge result accurately reports the resulting Gate 1F recommendation.

It does **not** mean Gate 1F passed.

A result with:

```text
GATE1F_RECOMMENDATION: NOT_READY
```

is expected and may be committed/pushed if the task itself is correct.

Preferred implementation commit:

```text
fix: remove rejected Gate 1F continuity writer
```

Bridge result may be a separate documentation commit consistent with the existing workflow.

---

## 15. Required result schema

Write `docs/bridge/results/F05_FIX3_RESULT.md` with at least:

```text
TASK_ID: F05_FIX3
STATUS: REPAIR_COMPLETE / BLOCKED
START_COMMIT:
END_COMMIT:
COMMIT_CREATED:
PUSHED:

WRITER_REMOVAL:
- config removed:
- function removed:
- conflict-phase call removed:
- production behavior replacement added: NO
- current architecture corrected:
- historical artifacts preserved:

CORRECTNESS_REGRESSION:
- internal rebellion displacement continuity remains stable:
- elapsed-boundary auto-dissolution absent:
- government transition non-terminal:
- F04B recovery preserved:
- T024 persistence/replay:

REFERENCE_GROUNDING:
- existing grounding sufficient: YES / NO
- new external research: YES / NO
- missing future grounding if any:

F05_RERUN:
- matrix:
- WAIT early:
- WAIT near-crisis:
- WAIT recovery:
- accommodation classification:
- meaningful responses early:
- meaningful responses near:
- meaningful responses recovery:
- trajectory signatures:
- causal readability:
- longest major-event silence:
- longest reassessment silence:
- readable arc early:
- readable arc near:
- readable arc recovery:
- terminal outcomes:
- consolidation outcomes:

HISTORICAL_COMPARISON:
- F05_FIX1:
- F05_FIX2 rejected-writer result:
- F05_FIX3 truthful post-removal result:

REMAINING_BLOCKER_CLASSIFICATION:
- ...

GATE1F_RECOMMENDATION:
PASS / PASS_WITH_NOTES / NOT_READY

NEXT_RECOMMENDED_TASK:
- NONE or one narrowly described recommendation

VERIFICATION:
- runtime:
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
- focused tests:
- full tests:
- git diff --check:

NEXT_AUTHORIZED_TASK_ID: NONE
V02: NOT STARTED
```

---

## 16. Completion discipline

On completion:

1. write `docs/F05_GATE1F_REPAIR3_REMOVE_CONTINUITY_WRITER.md`;
2. write `docs/bridge/results/F05_FIX3_RESULT.md`;
3. update `docs/bridge/LAST_RESULT.md`;
4. update `docs/bridge/STATE.md` to:

```text
F05_FIX3: REPAIR_COMPLETE / AWAITING_CHATGPT_REVIEW
NEXT_AUTHORIZED_TASK_ID: NONE
NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW
CURRENT_TASK_FILE: NONE
V02: NOT STARTED
```

5. run all verification;
6. inspect `git diff --check` and `git status`;
7. commit/push if the task itself passes;
8. do not authorize another task;
9. do not declare Gate 1F passed.

Return to ChatGPT/user for review.
