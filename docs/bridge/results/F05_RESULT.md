# TMR Bridge Result

TASK_ID: F05

STATUS: MEASUREMENT_COMPLETE

START_BRANCH: master

START_COMMIT: 75ffd60b7ef0335118e404d8be6767c7da37d72b

END_BRANCH: master

END_COMMIT: 1866287e87072fc9b62f55a4af940f9d0e54b15b

COMMIT_POLICY: COMMIT_AND_PUSH_ON_PASS

COMMIT_CREATED: YES

PUSHED: YES

## MEASUREMENT_SCOPE

- contexts: 3 representative natural checkpoints plus 3 one-day neighboring
  checkpoints (`0/1`, `18/19`, `180/181`)
- horizon: 5 simulated years / 1,800 days per branch
- strategies: WAIT, material relief, political accommodation, opposition
  legalization, coercive restriction, repeated political accommodation
- condition perturbations: timing-only neighboring checkpoints; no formula,
  parameter, or fixture-value changes
- matrix: 36 branches on seed `40103`

## POLITICAL_ACCOMMODATION

- classification: `CONDITIONALLY_STRONG`
- contexts where strongest: early/preventive and near-crisis, before permanent
  territorial collapse
- contexts where trade-off appears: repeated early/near use preserves all 3
  Hexes and reduces active conflicts from 2 to 1, but leaves instability near
  `96.4`; active-conflict/recovery use is cost-only
- treasury causal explanation: accommodation does not grant treasury directly;
  delayed territorial loss preserves fully controlled regional production and
  therefore daily income
- repeat behavior: early `20/20/20/0`, near-crisis `20/20/20/0`, recovery
  `20/4/4/16` for attempts/starts/completions/rejections

Accommodation is powerful but not globally dominant. Its repeat path has a
severe instability trade-off, and it fails after all territorial control is
lost.

## WAIT DOMINANCE

- early/preventive: `WAIT_WORSE`
- near-crisis: `WAIT_WORSE`
- active-conflict/recovery: `WAIT_WEAKLY_DOMINANT`
- broader verdict: WAIT is not broadly dominant before crisis, but recovery
  lacks enough worthwhile alternatives

## ACTION STRENGTH

- material relief: strong before collapse; remains a meaningful paid
  scarcity/unrest/grievance trade-off in recovery
- accommodation: strong early crisis-delay/economy effect; no immediate
  prevention at tick 18; ineffective/cost-only in recovery
- legalization: creates plural competition and a distinct coup/rebellion path;
  cost-only and triggers a relative-day-13 coup in recovery
- coercion: delays rebellion and sets banned competition/censored press before
  collapse; ineffective/cost-only in recovery

Only one of four required actions remains meaningfully beneficial in the
active-conflict/recovery context.

## TIMING SENSITIVITY

- early: tick 0 versus 1 changes event-cluster traces but creates no terminal or
  absolute first-crisis change
- near-crisis: tick 18 versus 19 changes all six first-crisis timings because
  the checkpoint crosses the rebellion boundary; terminal outcomes do not
  change
- post-crisis/recovery: tick 180 versus 181 is structurally stable

## PACING / ARC

- time to pressure: shortage day 1, unrest-band change from day 4 in the early
  WAIT branch
- time to decision: immediate at tick 0; tick 18 leaves one day before the
  baseline rebellion
- crisis timing: early WAIT rebellion day 19; single accommodation rebellion
  day 300; recovery next coup day 120
- territory timing: early WAIT loses Hexes on days 35/42/49; single
  accommodation delays those losses to days 301/308/315; recovery starts at 0
  controlled Hexes
- longest political silence: early 1,695 days; near-crisis 1,713 days;
  recovery 1,787 days
- accelerate windows: useful during long low-information spans and before the
  early pressure boundary
- pause/decision clusters: meaningful early crisis/action clusters exist, but
  single-response branches have no sustained late-horizon decision rhythm
- readable arc: NO across all three representative five-year contexts

## TRAJECTORY DIVERSITY

- meaningful branch clusters: six distinct trajectory signatures in each
  representative context; at least two required responses differ from WAIT
- fragile divergence: all single-response branches remain active and most
  reconverge to 0 controlled Hexes / 2 conflicts; several differences persist
  mainly in timing, treasury, institutions, or scarcity

## CAUSAL READABILITY

- explainable major differences: intervention completion → shortage change;
  completion → institutional-rule change; legalization completion → recovery
  coup; crisis → territorial change; territorial retention → production and
  treasury path
- gaps: state-threshold events rely on captured state rather than an event cause
  ID, and recovery contains a long consequence/decision silence

## GATE 1F CRITERIA

- trade-offs: PARTIAL — strong before collapse, insufficient in recovery
- surprising but explainable: YES
- different histories from choices: YES
- reasons to accelerate/pause: PARTIAL — acceleration is useful, pause-worthy
  clusters are sparse
- readable 5–10 year headless arc: NO at the measured five-year boundary

GATE1F_RECOMMENDATION: NOT_READY

## REQUIRED_FIX_BEFORE_GATE1F

1. Make at least one additional existing response produce a distinct paid
   benefit in active-conflict/recovery, while preserving treasury or
   institutional cost.
2. Shorten the longest political silence, or add an existing-system
   decision/event consequence, in all three representative contexts without a
   generic meter or story-node scheduler.
3. Rerun the same five-year matrix, including the repeat-accommodation probe.

These fixes are diagnoses only. F05 does not authorize implementation.

## FUTURE_BALANCE_NOTES

- Preserve the observed repeated-accommodation instability cost while
  remeasuring its territory and treasury leverage.
- Do not treat treasury as an isolated accommodation bonus; it is downstream of
  controlled production.
- Keep the tick-18/tick-19 crisis boundary explicit in later pacing work.

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

- `src/sim/inspection/f05PacingFunDecision.ts`
- `src/sim/inspection/f05PacingFunDecision.cli.ts`
- `src/sim/inspection/f05PacingFunDecisionInspection.test.ts`
- `package.json`
- `docs/F05_PACING_FUN_DECISION.md`
- `docs/bridge/results/F05_RESULT.md`
- `docs/bridge/LAST_RESULT.md`
- `docs/bridge/STATE.md`

No production formula, balance parameter, fixture value, UI, renderer, or V02
file changed.

## VERIFICATION

- `pnpm install --frozen-lockfile`: PASS — already current, pnpm 11.19.0
- `pnpm run format`: PASS
- `pnpm run typecheck`: PASS
- `pnpm run lint`: PASS
- `pnpm run build`: PASS — 44 modules transformed
- `pnpm run inspect:t024`: PASS
- `pnpm run inspect:f01`: PASS — 40-year invariants/replay
- `pnpm run inspect:f04d`: PASS
- `pnpm run inspect:f05`: COMPLETE — `NOT_READY`
- `pnpm test`: PASS — 51 files / 421 tests
- `git diff --check`: PASS before measurement commit
- measurement commit push: PASS — local and `origin/master` matched at
  `1866287e87072fc9b62f55a4af940f9d0e54b15b`

## BLOCKERS

None for F05 measurement completion. Gate 1F is not ready to pass for the two
measured product issues above.

## NEXT

Return to ChatGPT for Gate 1F review. Do not start V02 or any follow-up fix
without a new Bridge task.
