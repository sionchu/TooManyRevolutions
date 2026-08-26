# PARALLEL TASK 05 — GATE 1F DIAGNOSIS ONLY

TASK_ID: PARALLEL_05_GATE1F_DIAGNOSIS
EXECUTION_AUTHORITY: THIS_FILE_ONLY
BASELINE: 16b3ad5b2b255e41a9b4adb73b184f8b15684939

## Critical authority rule

This is an explicitly isolated diagnostic task.

- `docs/bridge/CURRENT_TASK.md` is **NOT an executable task for this branch**.
- Read it only for shared hard boundaries.
- Do **NOT** implement any Map/P0 visual work from `CURRENT_TASK.md`.
- Do **NOT** implement a Gate1F repair in production gameplay. This task is diagnosis/measurement/design only.
- If this file conflicts with a request in `CURRENT_TASK.md` about what to implement now, **this file wins for this parallel branch**.
- Do not update shared bridge state/result files.

## Role

GAMEPLAY SYSTEMS ANALYST / GATE 1F DIAGNOSTIC.

Known Gate1F problems to re-measure from the current baseline:

- early/pre-crisis choices have some leverage
- active-conflict/recovery choice coverage is weak and WAIT becomes weakly dominant
- several responses become cost-only after collapse
- long five-year political silence
- late branch reconvergence

## Allowed changes

Only diagnostic/inspection work:

- new `src/sim/inspection/**` tools/tests
- analysis-only read models/helpers
- counterfactual runners that do not alter canonical production behavior
- result documentation

## Forbidden changes

Do not change:

- canonical gameplay formulas
- action effects
- production fixtures/balance values
- pipeline phase order
- event scheduling
- policy/intervention semantics
- conflict/territorial production logic
- persistence
- presentation/UI/map/audio/icon code

No generic scheduler, hidden timer, fake crisis, story node, political mana, or self-declared Gate PASS.

## Required analysis

### A. Reproduce current Gate1F baseline

Use the existing representative contexts and responses from `docs/F05_PACING_FUN_DECISION.md`, including WAIT and the repeat-accommodation probe.

### B. Recovery choice matrix

For each existing response in active-conflict/recovery, measure:

- cost
- immediate consequence
- 90-day consequence
- 360-day consequence
- territory/controller consequence
- institutional consequence
- instability consequence
- treasury consequence
- conflict consequence
- rejection/availability behavior

Explain from state/event chains why an action becomes useful, harmful, or cost-only.

### C. Political silence

Across the five-year horizon measure gaps between:

- meaningful player decision opportunities
- major event clusters
- map-visible state changes
- action-availability changes

Report maximum, median, distribution and context differences.

### D. Reconvergence

Compare trajectory signatures around ticks 180, 360, 720, 1080, and 1800. Identify which choice effects persist and which structurally reconverge.

### E. Repair candidates — design only

Propose at most 3 narrow candidates. For each state:

- existing system(s) reused
- expected actual trade-off
- why recovery becomes more meaningful
- whether political silence improves
- exploit risk
- regression risk
- expected changed production files
- exact new authorization required

Prefer recomposition of existing systems to invention of a new mechanic.

### F. Recommendation

Recommend one repair for a separately authorized future task. Do not implement it.

## Verification

Baseline production tests/inspections must remain unchanged. Run relevant Gate1F/F04/F05 inspections, typecheck for new diagnostic code, focused tests, and `git diff --check`.

## Result

Write only `docs/parallel/05_GATE1F_DIAGNOSIS_RESULT.md`.

Include:

- BASE_SHA
- HEAD_SHA
- BASELINE_REPRODUCED
- RECOVERY_CHOICE_MATRIX
- POLITICAL_SILENCE_METRICS
- RECONVERGENCE_METRICS
- TOP_3_REPAIR_CANDIDATES
- RECOMMENDED_REPAIR
- EXPECTED_CHANGED_FILES
- RISKS
- AUTHORIZATION_REQUIRED

Commit and push diagnostic changes only, then STOP. No Gate1F PASS and no production repair.