# TMR — F05_FIX2 Late Steady-State Pacing Repair

TASK_ID: F05_FIX2

Date: 2026-08-24

Task type: Gate 1F narrow repair + exact F05 remeasurement

## 0. Mission

F05_FIX1 successfully closed the recovery-choice blocker but Gate 1F remains `NOT_READY` because the early/preventive and near-crisis representative families still contain a ~1,200-day late steady-state span after their last meaningful reassessment threshold.

This task has exactly one gameplay goal:

```text
Find the actual causal reason that the early / near-crisis political state becomes inert,
then make the smallest existing-system repair that creates a genuine new political consequence or decision.
```

Do not add a broad new subsystem merely to satisfy the F05 harness.

After the repair, rerun the unchanged F05 36-branch / five-year matrix and report a Gate 1F recommendation. Codex does not own the final Gate 1F decision.

---

## 1. Authorized base

BASE_BRANCH: `master`

BASE_COMMIT: `64e34e0b6ac7597f2939f57f6a9af0fac351ba9c`

A newer HEAD is acceptable only if every commit after this base is a ChatGPT-authored Bridge authorization update that changes only `docs/bridge/**`. Verify the diff before execution. Any gameplay/source change after the base makes this task stale.

---

## 2. Required reading

Follow `AGENTS.md` and the Bridge protocol.

Read at minimum:

- `docs/bridge/STATE.md`
- `docs/bridge/CURRENT_TASK.md`
- `docs/bridge/LAST_RESULT.md`
- `docs/bridge/results/F05_RESULT.md`
- `docs/bridge/results/F05_FIX1_RESULT.md`
- `docs/F05_PACING_FUN_DECISION.md`
- `docs/F05_GATE1F_REPAIR1.md`
- `docs/F04_TARGETED_ARCHITECTURE_GATE_REVIEW.md`
- `docs/F04C_INSTITUTION_MEDIATED_STABILIZATION_DESIGN.md`
- `docs/F04C_R_POLITICAL_HISTORICAL_REFERENCE_GROUNDING.md`
- `docs/F04D_INSTITUTION_ACTION_IMPLEMENTATION.md`
- `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`
- relevant F04A/F04B/F04D source and F05 inspection code

Inspect actual source before deciding the repair.

---

## 3. Fixed accepted results

Treat these as accepted unless current code evidence contradicts them:

- F04 overall: CLOSED / PASS
- F05 measurement: trustworthy / `NOT_READY`
- F05_FIX1: repair complete
- silence diagnosis: `MIXED_GAP`
- recovery WAIT classification: repaired from `WAIT_WEAKLY_DOMINANT` to `TRADEOFF`
- recovery meaningful paid responses: 3
- political accommodation: `CONDITIONALLY_STRONG`
- F04B territory/conflict authority: preserved
- Agenda: pure read model, not authoritative progress
- previous major-event silence: `1,695–1,787` days
- F05_FIX1 reassessment silence: `510–1,200` days
- recovery representative arc: readable
- early/preventive representative arc: not readable
- near-crisis representative arc: not readable
- V02: NOT STARTED

The only Gate 1F blocker authorized here is the late early/near-crisis steady state and the exact remeasurement after repairing it.

---

## 4. Diagnosis before implementation

Before changing gameplay, inspect the problematic branches from approximately the final meaningful reassessment point through day 1,800.

At minimum inspect the early/preventive and near-crisis branches responsible for the 1,200-day maximum gap, including the accommodation branch identified by F05_FIX1.

Capture state at useful boundaries such as:

```text
day ~600
+ 6 months
+ 1 year
+ 2 years
+ horizon
```

Do not assume every branch has the exact same last-change day.

Compare at least:

- Country treasury / income / expenditure / stateCapacity headroom
- Region scarcity, unrest, stateControl and physical LandHex control separately
- Faction grievance, organization, resources, currentStrategy and relevant local activation
- institutional rules and currently feasible required responses
- active crisis/conflict state and current conflict-strength inputs
- Agenda composition / priority / severity bands
- consolidation and dissolution eligibility state
- meaningful event/reassessment trace

Classify the dominant reason for inertia using one or more of:

```text
ECONOMIC_STEADY_STATE
FACTION_EQUILIBRIUM_WITHOUT_NEW_CONSUMER
AGENDA_SATURATION
ACTION_SET_SATURATION
ACTIVE_CONFLICT_STALEMATE
INSTITUTIONAL_STALEMATE
OUTCOME_ELIGIBILITY_STALEMATE
MEASUREMENT_GAP_REMAINING
MIXED_CAUSE
OTHER_WITH_EVIDENCE
```

The report must show the causal chain, not only the label.

---

## 5. Repair-selection rule

Choose only the smallest coherent repair supported by existing TMR state and existing political grounding.

A valid repair should have this shape:

```text
existing authoritative pressure/state
→ existing or narrowly completed downstream consumer
→ real political consequence / changed legal decision / changed conflict or institutional trajectory
→ player has a reason to reassess
```

Preferred order:

1. expose a real existing consumer/threshold that is currently hidden or disconnected;
2. complete a missing downstream consequence within an already implemented domain;
3. only if necessary, make a very small parameter/cadence correction whose causal meaning is already grounded.

Do NOT begin by tuning arbitrary numbers to push the measured silence under a threshold.

Do not accept `new event because N days passed` as a repair.

---

## 6. External-reference / grounding guardrail

This task MUST follow `docs/FUTURE_REFERENCE_GROUNDING_GATES.md` and the F04C-R mechanism-first method.

Research is demand-driven.

Use this order:

```text
existing repo grounding
→ actual current-state mechanism
→ conditions / counterexample / failure mode
→ trade-off
→ TMR state + consumer
→ smallest repair
```

Prefer existing F04C-R evidence. Do not search for more sources merely to justify expanding scope.

If the proposed consequence is not honestly supported by existing grounding:

```text
INSUFFICIENT_REFERENCE_GROUNDING
```

and stop rather than inventing a political mechanism.

If genuinely necessary new external research is performed, document separately:

- source-supported fact;
- interpretation;
- TMR design inference;
- why existing grounding was insufficient.

War as Politics, Fantasy institutional politics and Gate 1V visual reference work remain strictly out of scope.

---

## 7. Candidate existing domains — inspect, do not assume

The repair may inspect existing domains such as:

- F04A endogenous faction dynamics;
- T016 faction strategy / pressure;
- T016A Agenda;
- intervention feasibility / administrative opportunity cost;
- T017 instability/unrest/scarcity consumers;
- T018 coup/rebellion prerequisites;
- F04B/T021 active-conflict current-state resolution and recovery;
- T022 consolidation eligibility;
- T023 dissolution eligibility;
- institutional rule consumers.

This list does NOT authorize adding features to all of them.

Pick one smallest causal gap.

---

## 8. Pacing integrity

A reassessment point is legitimate only if the player could reasonably change behavior because something meaningful changed.

Allowed signals include genuine changes to:

- Agenda composition/priority/severity band;
- legal/feasible response set;
- crisis/conflict state;
- territorial control;
- institutional rules;
- faction strategy/pressure state when it actually changes a decision or consequence;
- consolidation/dissolution eligibility;
- another existing domain transition with clear causal meaning.

Do NOT count:

- raw scalar drift alone;
- every treasury tick;
- every monthly faction number change;
- arbitrary sample boundaries;
- repeated identical Agenda state;
- periodic filler events;
- cosmetic logs.

Do not game `readableArc` by changing only instrumentation. If the remaining 1,200-day gap is real, a gameplay consequence must genuinely change.

---

## 9. Gate 1F target

F05's current conservative readable-arc criterion uses sustained reassessment rather than constant event spam.

The goal is not a magic number, but after repair the representative early and near-crisis families should no longer contain the ~1,200-day inert critical steady state.

A PASS/PASS_WITH_NOTES recommendation requires all of the following:

- recovery remains `TRADEOFF`, not WAIT-dominant;
- at least two causally distinct paid responses remain meaningful in recovery;
- political accommodation remains non-universally-dominant;
- early/preventive and near-crisis receive at least one genuine later reassessment/consequence cycle;
- the five-year arc is readable under the same F05 methodology;
- choice-driven trajectory diversity and causal readability remain present;
- no new generic meter, story scheduler or fake periodic event is introduced;
- F04/F04B/T024 authority/determinism contracts remain intact.

If the smallest honest repair cannot satisfy this without a new unsupported domain, return `NOT_READY` rather than overbuilding.

---

## 10. Exact F05 rerun

After the repair, rerun the same F05 matrix without changing its representative scenario values merely to obtain a pass:

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

Report old vs new:

- WAIT classification per representative context;
- meaningful response count;
- accommodation classification;
- longest major-event silence;
- longest reassessment silence;
- event/reassessment clusters;
- trajectory-signature count;
- causal readability;
- readable arc;
- terminal/consolidation/dissolution outcomes if any.

Preserve the repeated-accommodation instability/territory/treasury probe.

---

## 11. Explicitly forbidden scope

Do not implement:

- V02 / renderer / UI;
- War as Politics;
- fantasy/arcane institutions;
- elections / parties / seats / coalitions;
- full labor bargaining;
- transitional justice;
- military factions / loyalty;
- local autonomy / federalism;
- strategic AI / MCTS / runtime LLM;
- generic stability, democracy, legitimacy or political-power meters;
- chapters, story nodes, revolution phases or countdowns;
- crisis/event scheduling based only on elapsed time;
- filler periodic events;
- RNG merely to manufacture diversity;
- direct crisis deletion;
- free LandHex transfer or hidden comeback state;
- direct outcome scripting;
- wholesale retuning of multiple systems;
- self-authorizing Gate 1F PASS or Gate 1V.

Do not reopen F04 architecture unless the diagnosis exposes a correctness defect.

---

## 12. Expected artifacts

Create:

```text
docs/F05_GATE1F_REPAIR2.md
```

Update the existing F05 inspection/tests only as needed for truthful remeasurement.

Write immutable Bridge result:

```text
docs/bridge/results/F05_FIX2_RESULT.md
```

Update on completion:

```text
docs/bridge/LAST_RESULT.md
docs/bridge/STATE.md
```

Do not overwrite F05/F05_FIX1 historical results.

---

## 13. Required verification

Use the verified desktop runtime:

```text
Node 24.19.0
pnpm 11.19.0
```

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

Add focused tests for any actual gameplay/read-model change.

Do not loosen global test timeouts to hide failures.

---

## 14. Commit policy

COMMIT_POLICY: `COMMIT_AND_PUSH_ON_PASS`

Here `PASS` means the F05_FIX2 repair task itself is coherent, scoped correctly, and verification passes. It does NOT mean Gate 1F passed.

A truthful result with:

```text
GATE1F_RECOMMENDATION: NOT_READY
```

may still be committed/pushed if the repair/diagnosis is valid.

Preferred implementation commit:

```text
fix: improve Gate 1F late political pacing
```

Bridge result may be a separate docs commit if that matches the existing Bridge workflow.

---

## 15. Required result schema

Return in Korean and write the Bridge result with at least:

```text
TASK_ID:
F05_FIX2

STATUS:
REPAIR_COMPLETE / BLOCKED

START_COMMIT:
END_COMMIT:
COMMIT_CREATED:
PUSHED:

LATE_STEADY_STATE_DIAGNOSIS:
- classification:
- exact problematic branches:
- last meaningful reassessment:
- state at last reassessment:
- state evolution through horizon:
- causal reason for inertia:

REFERENCE_GROUNDING:
- existing grounding sufficient: YES / NO
- documents/sources used:
- new external research: YES / NO
- if new: fact / interpretation / TMR inference separation

SELECTED_REPAIR:
- domain:
- exact causal gap:
- change:
- authoritative state affected:
- downstream consumer:
- player-visible decision consequence:
- cost/trade-off:
- why not filler:

AUTHORITY / ARCHITECTURE:
- LandHex authority:
- Region.stateControl semantics:
- F04B recovery boundary:
- persistence/replay:
- scripted-history check:

F05 RERUN:
- matrix:
- WAIT early:
- WAIT near-crisis:
- WAIT recovery:
- accommodation classification:
- meaningful recovery responses:
- old/new longest reassessment silence:
- readable arc early:
- readable arc near-crisis:
- readable arc recovery:
- trajectory diversity:
- causal readability:

GATE1F_RECOMMENDATION:
PASS / PASS_WITH_NOTES / NOT_READY

REMAINING_BLOCKERS:
- ...

VERIFICATION:
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

NEXT_AUTHORIZED_TASK_ID:
NONE

V02:
NOT STARTED
```

---

## 16. Completion discipline

Do not create a second or third repair merely because the first selected repair does not force a Gate pass.

This task should perform:

```text
diagnose exact steady-state cause
→ choose one smallest grounded repair
→ implement
→ verify
→ rerun exact F05 matrix
→ stop and report honestly
```

ChatGPT/user will review the result and decide Gate 1F.
