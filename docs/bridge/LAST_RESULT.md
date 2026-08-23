# TMR Last Bridge Result

TASK_ID: F05

STATUS: MEASUREMENT_COMPLETE

START_BRANCH: master

START_COMMIT: 75ffd60b7ef0335118e404d8be6767c7da37d72b

END_BRANCH: master

END_COMMIT: 1866287e87072fc9b62f55a4af940f9d0e54b15b

COMMIT_POLICY: COMMIT_AND_PUSH_ON_PASS

COMMIT_CREATED: YES

PUSHED: YES

GATE1F_RECOMMENDATION: NOT_READY

## MEASUREMENT_SCOPE

- contexts: early/preventive, near-crisis, active-conflict/recovery plus a
  one-day neighbor for each
- horizon: 5 years / 1,800 days per branch
- strategies: WAIT, four F04D responses, repeated accommodation
- condition perturbations: timing-only natural checkpoints; no balance changes

## POLITICAL_ACCOMMODATION

- classification: `CONDITIONALLY_STRONG`
- strongest: early/preventive and near-crisis
- trade-off: repeated use preserves territory but leaves instability near
  `96.4`; recovery use is cost-only
- treasury cause: delayed territorial loss preserves controlled production and
  daily income
- repeat behavior: `20/20` starts early and near crisis; `4/20` starts in
  recovery

## WAIT DOMINANCE

- early/preventive: `WAIT_WORSE`
- near-crisis: `WAIT_WORSE`
- active-conflict/recovery: `WAIT_WEAKLY_DOMINANT`
- broader verdict: no broad pre-crisis WAIT dominance; weak recovery choice
  coverage remains

## ACTION STRENGTH

- material relief: meaningful in all three contexts
- accommodation: strong before collapse, ineffective after it
- legalization: distinct institutional/crisis path, cost-only in recovery
- coercion: distinct rule/timing path, cost-only in recovery

## TIMING SENSITIVITY

- early: trace-sensitive, no absolute first-crisis or terminal cliff
- near-crisis: tick 18/19 crosses the rebellion boundary
- post-crisis/recovery: stable at tick 180/181

## PACING / ARC

- early pressure: shortage day 1; unrest from day 4; WAIT rebellion day 19
- territory: WAIT loses Hexes days 35/42/49; accommodation delays to
  301/308/315
- longest political silence: `1,695 / 1,713 / 1,787` days by representative
  context
- accelerate windows: present
- pause/decision clusters: too sparse after the early cluster
- readable five-year arc: NO

## TRAJECTORY DIVERSITY

- six distinct histories per representative context
- many single-action branches reconverge to 0 Hexes / 2 conflicts

## CAUSAL READABILITY

- action completion, institution, crisis, territory, production, and treasury
  differences are explainable through emitted events and captured state
- long recovery silence remains the primary gap

## GATE 1F CRITERIA

- trade-offs: PARTIAL
- surprising but explainable: YES
- different histories from choices: YES
- reasons to accelerate/pause: PARTIAL
- readable 5–10 year headless arc: NO

## REQUIRED_FIX_BEFORE_GATE1F

1. Add a second distinct paid benefit among existing recovery responses.
2. Shorten the 1,485–1,787 day political silence with an existing-system
   decision/event consequence.
3. Rerun the same matrix, including repeat accommodation.

F05 does not authorize these fixes.

## FUTURE_BALANCE_NOTES

- Keep repeated accommodation's instability cost visible.
- Treat its treasury result as downstream of territorial production.
- Retain the tick-18/tick-19 boundary probe.

## DEFERRED

- elections/parties
- full labor bargaining
- transitional justice
- military factions
- local autonomy
- war
- fantasy
- V02

## FILES_CHANGED

- F05 inspection, CLI, focused test, package script, and decision document
- F05 immutable Bridge result plus current result/state metadata

## VERIFICATION

- install, format, typecheck, lint, build: PASS
- T024, F01, F04D inspections: PASS
- F05 inspection: COMPLETE / `NOT_READY`
- full test suite: PASS — 51 files / 421 tests
- measurement commit and push: PASS —
  `1866287e87072fc9b62f55a4af940f9d0e54b15b`

## BLOCKERS

None for measurement completion. Gate 1F is not ready to pass.

## NEXT

Return to ChatGPT for Gate 1F review. Do not start V02 or any follow-up fix
without a new Bridge task.

Historical result: `docs/bridge/results/F05_RESULT.md`

Detailed evidence: `docs/F05_PACING_FUN_DECISION.md`
