# Parallel Task 05 — Gate1F R1 FIX2: Repeatability + Historical Regression Isolation

EXECUTION_AUTHORITY: THIS_FILE_ONLY

## Branch / baseline

- branch: `parallel-gate1f-diagnosis-v2`
- execution base: `15cb2583ce673a55f1258fcfdb2b4bb5faa7ef74`
- R1 mechanism at base: `POLITICAL_ACCOMMODATION` adds `factionOrganizationDelta = -0.50` and reaches the existing `governmentRecovery -> changeLandHexController -> LAND_HEX_CONTROL_CHANGED` path without direct controller mutation.
- Gate1F remains NOT_READY. This task does not authorize Gate1F PASS, V02, persistence V9, or any P0 product integration.

## Why FIX2 is required

The R1 mechanism works, but the current result is not accepted as a final recovery repair because:

1. `REPEATED_POLITICAL_ACCOMMODATION` starts/completes 20/20 times with 0 rejections.
2. At relative day 1800 the repeated branch has treasury `13484`, 3 player LandHexes and 1 active conflict versus WAIT treasury `-1137`, 0 player LandHexes and 2 conflicts. Nominal cost alone is not sufficient evidence that repetition is bounded.
3. The current repeated-exploit test checks nominal cost and one-Hex-per-resolution-tick but does not assert outcome dominance or repeatability bounds.
4. Full suite has 3 F05 historical-regression assertion failures. Those audits explicitly require the historical pre-R1 F05 baseline to remain unchanged.
5. Maximum map-visible silence remains 1787 days, so Gate1F is still NOT_READY even if this FIX2 succeeds.

## Objective A — Make political accommodation a bounded institutional concession using existing semantics

Use existing intervention prerequisite/effect types only. Do not add a cooldown, timer, scheduler, generic diminishing-return meter, new prerequisite kind, or hidden RNG.

Authorized preferred repair:

- preserve treasury cost: `70`
- preserve administrative load: `35`
- preserve duration: `7 days`
- preserve existing prerequisite `legislatureRequired === true`
- preserve `factionGrievanceDelta = -0.25`
- preserve `factionOrganizationDelta = -0.50`
- ADD prerequisite: `laborOrganization === "restricted"`
- ADD completion effect: `institutionalRuleSet laborOrganization = "legal"`

Rationale: this is a narrow labor-specific political accommodation, not general opposition legalization. `OPPOSITION_LEGALIZATION` continues to own `politicalCompetition -> plural`. The institutional concession also makes the response naturally one-time through existing rule state instead of a pacing timer.

Do NOT mutate:

- `politicalCompetition` for this action
- `pressFreedom`
- conflict thresholds
- military power formula
- stateControl formula
- LandHex topology
- controller writer authority
- generic intervention schema

If the preferred repair cannot preserve the canonical recovery path or creates a worse existing-system regression, STOP after measuring it and document the failure. Do not invent a different mechanism without new authorization.

## Objective B — Preserve historical F05 audit baselines explicitly

The old F05 FIX7/FIX9/FIX10 audits are historical regression audits. They must continue to measure the pre-R1 F05 baseline rather than silently inheriting the repaired default fixture.

Use the existing counterfactual seam:

`createF04DValidationScenario({ politicalAccommodationOrganizationDelta: null })`

or an equivalent narrowly typed helper for historical-F05 audit construction.

Required rule:

- historical F05 regression/audit code uses the explicit pre-R1 baseline scenario
- Gate1F R1 diagnosis/recovery measurement uses the repaired default scenario
- do NOT simply change golden expectations such as `372 -> 390` to make tests green
- do NOT weaken `historicalF05BaselineRegression`, `historicalF05Regression`, or equivalent assertions

The goal is separation of two truths:

1. historical F05 baseline remains reproducible and unchanged when explicitly requested
2. repaired Gate1F scenario has intentional new recovery behavior

## Required measurements

### 1. Canonical single-use recovery

Verify the repaired accommodation still:

- is feasible in `ACTIVE_CONFLICT_RECOVERY_T180`
- starts once and completes once
- changes faction state through existing completion effects
- produces a `governmentRecovery` intent through the existing resolver
- produces authoritative `LAND_HEX_CONTROL_CHANGED` only through the existing territorial writer
- has `directControllerMutationAtCompletion = false`

Prefer preserving first recovery around relative day 9. If timing changes, record exact timing and explain why.

### 2. Repeated accommodation

Run the same repeated 90-day strategy through 1800 days.

Required acceptance:

- first accommodation can start/complete
- later repeated attempts are rejected by the existing institutional prerequisite after `laborOrganization` becomes `legal`
- expected starts/completions should be 1/1 unless evidence proves a legitimate rule-state reversal by existing gameplay
- no direct controller mutation
- no same-tick multi-Hex burst
- report treasury/admin burden and day180/day360/day720/day1080/day1800 state
- compare against WAIT and MATERIAL_RELIEF

Do not call the repeatability issue closed merely because nominal costs are nonzero.

### 3. 36-branch matrix

Rerun the same 6 contexts × 6 strategies, seed 40103, 1800-day horizon.

Record:

- trajectory/action/silence comparison
- recovery choice matrix
- reconvergence dimensions
- repeated accommodation behavior
- meaningful decision / major-event / map-visible / availability silence

Do not self-declare Gate1F PASS.

### 4. Historical F05 regression suite

At minimum rerun:

- `f05Fix7InteractionIntegration.test.ts`
- `f05Fix9LateSteadyStateAudit.test.ts`
- `f05Fix10StructuralRemedySelection.test.ts`
- F04B/F04D/F05 inspections
- R1 focused tests
- typecheck
- lint
- format
- build
- `git diff --check`
- full `pnpm test`

The three historical tests should return to their original contract through explicit baseline isolation, not expectation weakening.

## R2 silence boundary

Do not implement R2 silence repair in this task.

After FIX2, report the remaining maximum/median/p90 silence. If maximum map-visible or decision silence remains product-blocking, provide a short `R2_CANDIDATE` section that identifies which existing system consequence could create meaningful opportunities. No scheduler/story node/pacing timer implementation is authorized.

## Result

Create/update:

`docs/parallel/05_GATE1F_R1_FIX2_RESULT.md`

Include:

- base/head SHA
- exact institutional prerequisite/effect change
- canonical recovery trace
- repeated strategy before/after
- day1800 WAIT vs single vs repeated comparison
- historical F05 baseline isolation approach
- targeted/full test results
- silence metrics
- remaining blockers
- `F05_RECOMMENDATION`
- `GATE1F_ADJUDICATION: NOT_DECLARED`

Commit/push and STOP.
