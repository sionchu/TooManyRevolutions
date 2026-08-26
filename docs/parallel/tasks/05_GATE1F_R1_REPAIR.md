# Parallel Task 05 — Gate1F R1 Recovery Repair

EXECUTION_AUTHORITY: THIS_FILE_ONLY

## Baseline

- diagnosis branch: `parallel-gate1f-diagnosis-v2`
- diagnosis implementation/result commit: `17551f91e10b8fedc134579a95beaf0bd721368d`
- diagnosis result: `docs/parallel/05_GATE1F_DIAGNOSIS_RESULT.md`
- Gate1F remains `NOT_READY` before this repair.
- This task authorizes one narrow R1 repair only. It does not authorize Gate1F PASS, V02, persistence V9, or any successor work.

## Why this repair is authorized

The diagnosis reproduced all 36 F05 branches and showed that, in active-conflict recovery, `POLITICAL_ACCOMMODATION` is cost-only by the late horizon while `MATERIAL_RELIEF` is the only clearly useful paid response. Existing conflict code already contains a zero-territory government recovery path: if an active internal rebellion remains and government military power adjusted by residual `Region.stateControl` has a meaningful advantage over faction operational strength, the normal conflict resolver may emit a `governmentRecovery` territorial intent. The intervention must never write a LandHex controller directly.

## Objective

Make `POLITICAL_ACCOMMODATION` one additional meaningful paid recovery response by reusing only existing intervention effects and the existing faction/conflict/territorial consumers.

Target causal path:

```text
POLITICAL_ACCOMMODATION
-> existing intervention completion effect(s)
-> existing faction grievance / organization state
-> existing faction operational strength / crisis eligibility consumer
-> existing conflict resolver
-> governmentRecovery or governmentRecapture intent
-> authoritative LAND_HEX_CONTROL_CHANGED if the normal strength rule permits it
```

No direct intervention-to-controller write is allowed.

## Authorized production surface

Primary change surface:

- `src/sim/state/gate1fValidationFixture.ts`

Authorized inspection/test updates:

- `src/sim/inspection/gate1fDiagnosisV2.ts`
- `src/sim/inspection/gate1fDiagnosisV2.test.ts`
- existing F04D/F05/F04B inspection tests as needed
- a new narrow `gate1fR1RecoveryRepair` inspection/test module is allowed

Do not modify these unless an exact blocker is demonstrated in the result and no implementation is attempted there:

- `src/sim/systems/conflict.ts`
- `src/sim/systems/conflictResolution.ts`
- `src/sim/systems/factionPressure.ts`
- generic `src/sim/state/intervention.ts`

The intent is content/effect recomposition through existing consumers, not a new mechanic.

## Required preserved action contract

For `POLITICAL_ACCOMMODATION` preserve:

- treasury cost: `70`
- administrative load: `35`
- duration: `7` days
- existing `legislatureRequired === true` prerequisite
- existing grievance benefit unless a measured replacement is explicitly justified

Only existing `InterventionEffect` kinds may be used. Prefer the smallest bounded combination of existing `factionGrievanceDelta` and/or `factionOrganizationDelta` needed to create durable recovery leverage.

Before selecting the final value, run a bounded deterministic counterfactual sweep. Do not hand-pick an unexplained magic number. Record candidates and choose the smallest-magnitude effect that satisfies the acceptance criteria below.

## Hard authority boundaries

Forbidden:

- direct `landHexStates[*].controller` mutation from intervention code
- new intervention effect kind
- hidden recovery score or meter
- story node / focus tree
- time-triggered recovery event
- new scheduler or pacing timer
- RNG pacing cheat
- generic political mana
- fake ceasefire/front/controller event
- bypassing `deriveConflictIntents` / normal conflict resolution
- changing player identity from CountryId continuity
- treating government transition as terminal defeat
- persistence schema change

## Acceptance — recovery value

Using the same seed `40103`, scenario `gate1f.f04d.validation`, actor loop ON, and the same F05 context matrix:

1. `ACTIVE_CONFLICT_RECOVERY_T180 / POLITICAL_ACCOMMODATION` must still start and complete through the canonical action path.
2. Completion itself must not directly change any LandHex controller.
3. By relative day 360, accommodation must differ from WAIT on at least one recovery-relevant existing structural axis beyond treasury alone:
   - player-controlled LandHex count / controller distribution, or
   - active conflict count/status, or
   - faction organization/grievance in a way that remains measurably different at day 360.
4. Preferred stronger acceptance: the existing conflict resolver derives at least one `governmentRecovery` or `governmentRecapture` intent and produces an authoritative country-favoring `LAND_HEX_CONTROL_CHANGED` by day 360. If the bounded existing-effect sweep cannot reach this without regression/exploit, do not force it; record the exact blocker and use the weaker structural acceptance above.
5. `MATERIAL_RELIEF` must remain meaningfully distinct as the material/scarcity response.
6. `OPPOSITION_LEGALIZATION` may remain a harmful political trade-off; do not make every response beneficial.
7. `COERCIVE_RESTRICTION` must keep its institutional coercion semantics; do not homogenize responses.

## Acceptance — silence and trajectory

Rerun all 36 branches and the repeated-accommodation probe.

For the repaired political-accommodation recovery branch:

- record major-event, map-visible, decision-opportunity, and availability silence using the diagnosis v2 definitions;
- the repair must create at least one additional existing-system consequence signal versus baseline accommodation in the 5-year horizon;
- any shorter map-visible gap must come from real intervention/faction/conflict/territory consequences, never a scheduler;
- report whether the maximum map-visible silence improves and by how much; do not invent a PASS threshold if the existing system cannot support it.

Trajectory requirement:

- accommodation at day 360 must no longer be `treasury + grievance only` if the repair can use the existing conflict consumer safely;
- report dimensions at 180/360/720/1080/1800 versus WAIT using the existing `T/I/U/S/G/O/H/C/K/P` signature.

## Regression / exploit checks

Required contexts:

- `EARLY_PREVENTIVE_T0`
- `EARLY_PREVENTIVE_T1`
- `NEAR_CRISIS_T18`
- `NEAR_CRISIS_T19`
- `ACTIVE_CONFLICT_RECOVERY_T180`
- `ACTIVE_CONFLICT_RECOVERY_T181`

Required checks:

- same 36-branch runner completes
- canonical action attempts/starts/completions/rejections remain explainable
- neighboring T180/T181 result does not depend on one exact tick coincidence
- repeated accommodation keeps materially higher treasury/admin burden than single accommodation
- repeated accommodation must not produce instant multi-Hex recovery at one resolution boundary
- no new intervention completion may directly emit controller changes
- T018/T021/T024/V01 inspections remain PASS
- F04B/F04D/F05 inspections still execute and any changed recommendation is reported, not self-approved

## Parameter sweep rule

A bounded sweep may vary only the political-accommodation faction-state completion delta(s). Use deterministic candidate values and report the table. Prefer smallest absolute change that produces meaningful recovery leverage without making accommodation universally dominant.

Do not modify global faction dynamics rates, crisis thresholds, conflict advantage margin, military power, Region.stateControl, or territorial topology just to make the repair pass.

## Result

Update/create:

`docs/parallel/05_GATE1F_R1_REPAIR_RESULT.md`

Must include:

- BASE_SHA / HEAD_SHA
- exact changed files
- candidate sweep table
- selected effect values and why
- canonical causal chain
- proof no direct controller mutation was added
- recovery matrix before/after
- silence before/after
- reconvergence before/after
- repeated-accommodation exploit check
- regression results
- full-test status exactly as observed
- known limitations

## Verification

Run at minimum:

- focused R1 test(s)
- Gate1F diagnosis v2 baseline/repair comparison
- `pnpm run inspect:f04b`
- F04D inspection/test
- `pnpm run inspect:f05`
- `pnpm run inspect:t018`
- `pnpm run inspect:t021`
- `pnpm run inspect:t024`
- `pnpm run inspect:v01`
- typecheck
- lint
- format
- build
- `git diff --check`

If full Vitest assertions pass but worker `onTaskUpdate` timeouts remain, record `ASSERTIONS_PASS / RUNNER_EXIT_FAIL`; do not call it a clean full-suite PASS.

Commit/push and STOP. Do not declare Gate1F PASS.