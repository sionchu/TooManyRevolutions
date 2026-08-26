# PARALLEL TASK 05 — Gate1F R1 FIX2 Repeatability + Regression Result

TASK_ID: PARALLEL_05_GATE1F_R1_FIX2_REPEAT_AND_REGRESSION

EXECUTION_AUTHORITY: docs/parallel/tasks/05_GATE1F_R1_FIX2_REPEAT_AND_REGRESSION.md

BASE_BRANCH: gamebuilders-product-surface-p0

BASE_SHA: 5369ea7f98b57e4e6ba4c7e8bad5edcb9f51e24c

HEAD_SHA: 5369ea7f98b57e4e6ba4c7e8bad5edcb9f51e24c (authorized execution input)

BRANCH: parallel-gate1f-diagnosis-v2

R1_FIX2_STATUS: IMPLEMENTED_AND_MEASURED

F05_RECOMMENDATION: NOT_READY

GATE1F_ADJUDICATION: NOT_DECLARED

## Bootstrap and scope

- `git fetch origin` 후 dedicated worktree에서 `git pull --ff-only` 실행
- local branch와 `origin/parallel-gate1f-diagnosis-v2`는 authorized input `5369ea7f98b57e4e6ba4c7e8bad5edcb9f51e24c`를 가리켰다.
- 실행 시작 시 working tree는 clean이었다.
- 공통 bridge 문서와 공용 result 파일은 수정하지 않았다.
- production resolver, conflict system, territorial writer, persistence schema, V02는 수정하지 않았다.
- R2 silence repair, scheduler, story node, timer/cooldown, persistence V9는 구현하지 않았다.

## FIX2 institutional concession

기본 repaired F04D validation scenario의 `POLITICAL_ACCOMMODATION`은 기존 비용과 효과를 유지하면서 기존 intervention 의미론으로 one-time institutional concession을 갖는다.

- treasury cost: `70` (preserved)
- administrative load: `35` (preserved)
- duration: `7 days` (preserved)
- prerequisite: `legislatureRequired === true` (preserved)
- added prerequisite: `laborOrganization === "restricted"`
- completion effect: existing `factionGrievanceDelta = -0.25` (preserved)
- completion effect: existing R1 `factionOrganizationDelta = -0.50` (preserved)
- added completion effect: `institutionalRuleSet laborOrganization = "legal"`
- `politicalCompetition`와 `pressFreedom`은 이 action에서 변경하지 않았다.
- `OPPOSITION_LEGALIZATION`의 `politicalCompetition -> plural` ownership은 유지했다.

`createF04DPreR1ValidationScenario()`는 기존 counterfactual seam인
`createF04DValidationScenario({ politicalAccommodationOrganizationDelta: null })`을 명시적으로 호출한다. 이 pre-R1 path는 labor prerequisite/effect와 organization effect를 포함하지 않아 historical F05 정의를 재현한다. 기본 호출은 repaired scenario를 계속 사용한다.

## Bounded counterfactual sweep

실행 조건: seed `40103`, context `ACTIVE_CONFLICT_RECOVERY_T180`, actor loop `ON`, candidates `null, -0.05 ... -0.50`.

| organization delta | feasible | starts/completions | Δ organization@360 | Δ grievance@360 | Δ player Hex@360 | Δ conflicts@360 | country recovery <=360 | structural recovery |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| baseline | YES | 1/1 | 0.000 | -0.250 | 0 | 0 | NO | NO |
| -0.05 | YES | 1/1 | 0.000 | -0.250 | 0 | 0 | NO | NO |
| -0.10 | YES | 1/1 | 0.000 | -0.250 | 0 | 0 | NO | NO |
| -0.15 | YES | 1/1 | 0.000 | -0.250 | 0 | 0 | NO | NO |
| -0.20 | YES | 1/1 | -0.040 | -0.250 | 0 | 0 | NO | YES |
| -0.25 | YES | 1/1 | -0.090 | -0.250 | 0 | 0 | NO | YES |
| -0.30 | YES | 1/1 | -0.140 | -0.250 | 0 | 0 | NO | YES |
| -0.35 | YES | 1/1 | -0.190 | -0.250 | 0 | 0 | NO | YES |
| -0.40 | YES | 1/1 | -0.240 | -0.250 | 0 | 0 | NO | YES |
| -0.41 | YES | 1/1 | -0.250 | -0.250 | 0 | 0 | NO | YES |
| -0.42 | YES | 1/1 | -0.260 | -0.250 | 0 | 0 | NO | YES |
| -0.43 | YES | 1/1 | -0.270 | -0.250 | 0 | 0 | NO | YES |
| -0.44 | YES | 1/1 | -0.280 | -0.250 | 0 | 0 | NO | YES |
| -0.45 | YES | 1/1 | -0.290 | -0.250 | 0 | 0 | NO | YES |
| -0.46 | YES | 1/1 | -0.300 | -0.250 | 0 | 0 | NO | YES |
| -0.47 | YES | 1/1 | -0.310 | -0.250 | 0 | 0 | NO | YES |
| -0.48 | YES | 1/1 | -0.320 | -0.250 | 0 | 0 | NO | YES |
| -0.49 | YES | 1/1 | -0.330 | -0.250 | 0 | 0 | NO | YES |
| -0.50 | YES | 1/1 | -0.340 | -0.250 | 3 | -1 | YES | YES |

Selection: `-0.50`, rule `PREFERRED_COUNTRY_RECOVERY`. The first country recovery event remains at the preferred canonical path; `-0.49` does not produce that event by day 360.

## Canonical single-use recovery

The repaired action was traced from `ACTIVE_CONFLICT_RECOVERY_T180` through the existing simulation and conflict consumers:

- completion: relative day `8`, `INTERVENTION_COMPLETED`
- post-completion institutional event: `INSTITUTION_RULE_CHANGED`, `laborOrganization restricted -> legal`
- first recovery: relative day `9`, `LAND_HEX_CONTROL_CHANGED`
- recovery intent: `reason=governmentRecovery`
- target: `ideology-fixture.industrial-hex`
- acting strength: `27.5`
- opposing strength: `22`
- direct controller mutation at completion: `false`
- territorial writer: existing `changeLandHexController()` path

The completion effect changes faction/institution state only. Existing conflict-intent derivation and the existing territorial writer produce the later authoritative LandHex event.

## Repeated accommodation before / after

The same 90-day strategy was run through the 1,800-day horizon.

| measurement | single accommodation | repeated accommodation before FIX2 | repeated accommodation after FIX2 |
| --- | ---: | ---: | ---: |
| attempts | 1 | 20 | 20 |
| starts | 1 | 20 | 1 |
| completions | 1 | 20 | 1 |
| rejections | 0 | 0 | 19 |
| nominal treasury cost | 70 | 1400 | 70 |
| nominal administrative commitment-days | 245 | 4900 | 245 |

After the first completion, `laborOrganization` is `legal`; subsequent accommodation availability samples carry the existing `PREREQUISITE_NOT_MET` reason. No cooldown, timer, scheduler, random branch, or new prerequisite kind was added.

The single and repeated branches have the same recovery-related LandHex ticks: `9, 16, 23, 513, 520, 527`. The maximum LandHex changes at one resolution tick is `1`, and the repeated branch has no additional recovery ticks relative to single use.

### Repeated branch checkpoints

`H/U/T/C` in the compact matrix means player-controlled LandHexes / maximum region unrest / treasury / active conflicts. The additional columns are the measured F03 state values.

| relative day | H | C | treasury | instability | max unrest | max scarcity | faction grievance | faction organization | laborOrganization |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 180 | 3 | 1 | 1854 | 96.704 | 0.999 | 1.000 | 1.230 | 1.140 | legal |
| 360 | 3 | 1 | 3294 | 96.759 | 1.000 | 1.000 | 1.470 | 1.260 | legal |
| 720 | 0 | 2 | 4339 | 0.000 | 1.000 | 1.000 | 1.918 | 1.500 | legal |
| 1080 | 0 | 2 | 3979 | 0.000 | 1.000 | 1.000 | 1.935 | 1.600 | legal |
| 1800 | 0 | 2 | 3259 | 0.000 | 1.000 | 1.000 | 1.935 | 1.600 | legal |

### Day 360 / day 1800 response comparison

| response | day 360 H/U/T/C | day 1800 H/U/T/C | attempts/start/complete/reject |
| --- | --- | --- | --- |
| WAIT | 0 / 1.000 / 303 / 2 | 0 / 1.000 / -1137 / 2 | 0/0/0/0 |
| MATERIAL_RELIEF | 0 / 0.987 / 213 / 2 | 0 / 0.987 / -1227 / 2 | 1/1/1/0 |
| POLITICAL_ACCOMMODATION | 3 / 1.000 / 3294 / 1 | 0 / 1.000 / 3259 / 2 | 1/1/1/0 |
| OPPOSITION_LEGALIZATION | 0 / 1.000 / 203 / 2 | 0 / 1.000 / -1237 / 2 | 1/1/1/0 |
| COERCIVE_RESTRICTION | 0 / 1.000 / 228 / 2 | 0 / 1.000 / -1212 / 2 | 1/1/1/0 |
| REPEATED_POLITICAL_ACCOMMODATION | 3 / 1.000 / 3294 / 1 | 0 / 1.000 / 3259 / 2 | 20/1/1/19 |

The repeated branch no longer dominates the single branch through accumulated accommodation effects. Its day-1800 vector equals the single-use accommodation vector on the measured response fields.

## 36-branch remeasurement

Execution: seed `40103`, horizon `1,800 days`, actor loop `ON`, six contexts × six strategies.

- branches: `36`
- compared branches: `36`
- `baselineReproduced`: `true`
- trajectory signature mismatches: `0`
- action count mismatches: `0`
- silence mismatches: `0`
- existing F05 recommendation: `NOT_READY`

The repaired Gate1F diagnosis compares against the repaired default F05 runner. Historical F05 FIX7/FIX9/FIX10 audits use the explicit pre-R1 scenario seam described above.

### Recovery reconvergence dimensions

For `ACTIVE_CONFLICT_RECOVERY_T180`, accommodation and repeated accommodation have the same differences from WAIT:

| relative day | differing dimensions vs WAIT |
| ---: | --- |
| 180 | treasury, instability, factionOrganization, factionGrievance, controlledLandHexes, activeConflicts, controller, institution |
| 360 | treasury, instability, factionOrganization, factionGrievance, controlledLandHexes, activeConflicts, controller, institution |
| 720 | treasury, factionOrganization, factionGrievance, institution |
| 1080 | treasury, institution |
| 1800 | treasury, institution |

The repaired institutional state remains visible as `laborOrganization=legal`; late trajectory reconvergence still leaves the treasury and institution dimensions.

### Silence channels

Values are `maximum / median / p90` days for the six-branch context aggregate. Both neighboring recovery contexts produced the same values.

| context | meaningful decision opportunities | major event clusters | map-visible state changes | action availability changes |
| --- | ---: | ---: | ---: | ---: |
| ACTIVE_CONFLICT_RECOVERY_T180 | 1350 / 90 / 1350 | 1787 / 96 / 1787 | 1787 / 13 / 1787 | 1792 / 10 / 1792 |
| ACTIVE_CONFLICT_RECOVERY_T181 | 1350 / 90 / 1350 | 1787 / 96 / 1787 | 1787 / 13 / 1787 | 1792 / 10 / 1792 |

FIX2 reduces median map-visible silence through the measured existing intervention/conflict/territory chain, but the maximum map-visible silence remains `1787` days. No silence scheduler or R2 system was implemented.

## Historical F05 baseline isolation

- FIX7 historical 36 branches and its 108 proposal branches explicitly use the pre-R1 scenario (`politicalAccommodationOrganizationDelta: null`). Result: `36 + 108 = 144/144`, historical baseline `UNCHANGED`, regression `PASS`, proposal mode effects `IGNORE=0 REJECT=0 ACCEPT=18`, reopen churn `NONE`, F05 recommendation `NOT_READY`.
- FIX9 explicitly uses the same pre-R1 political-interaction scenario and consumes the isolated FIX7 integration. Result: late-silence population `6`, state-grounded maximum `1200d`, post-intervention late silence `1110d`, non-accept divergences `0`, identical reopen churn `0`, implementation `NONE`, historical baseline `UNCHANGED`, recommendation `NOT_READY`.
- FIX10 explicitly derives its monthly observations with the pre-R1 scenario. Result: `lateMonthlyBoundaryCount=372`, `blockerMonthlyBoundaryCount=372`, FUND_MOVEMENT selections `372`, `PRODUCTION_GAMEPLAY_CHANGE=NONE`, historical baseline `UNCHANGED`, FIX9 diagnosis `UNCHANGED`.
- The `372` golden expectations were not changed to `390`; the historical tests passed with the original expectation.

## Silence boundary / R2 candidate

`R2_CANDIDATE`: inspect whether the existing active internal-conflict/faction-action and outcome-eligibility consumers can expose another genuine decision or state consequence after territorial displacement. This is a measurement candidate only; no R2 implementation was performed.

Remaining measured blocker: maximum map-visible silence `1787d`, with F05 still `NOT_READY`. Gate1F final adjudication remains outside this branch.

## Verification

### Exit-0 inspection commands

- `pnpm exec vite-node src/sim/inspection/gate1fR1RecoveryRepair.cli.ts` — exit `0`; sweep, canonical trace, 36-branch summary, repeatability checkpoints.
- `pnpm exec vite-node src/sim/inspection/gate1fDiagnosisV2.cli.ts` — exit `0`; `36/36`, zero trajectory/action/silence mismatches.
- `pnpm run inspect:f04b` — exit `0`.
- `pnpm run inspect:f04d` — exit `0`; F04D result checks passed.
- `pnpm run inspect:f05` — exit `0`; F05 recommendation `NOT_READY`.
- `pnpm run inspect:t018` — exit `0`.
- `pnpm run inspect:t021` — exit `0`.
- `pnpm run inspect:t024` — exit `0`.
- `pnpm run inspect:v01` — exit `0`.

### Focused historical and R1 tests

The following tests had all listed assertions pass, while Vitest separately emitted one long-task worker `Error: [vitest-worker]: Timeout calling "onTaskUpdate"`; their process exit was `1` because of that runner error:

- `f05Fix7InteractionIntegration.test.ts` — 2/2 tests passed, 1 worker timeout.
- `f05Fix9LateSteadyStateAudit.test.ts` — 1/1 test passed, 1 worker timeout.
- `f05Fix10StructuralRemedySelection.test.ts` — 1/1 test passed, 1 worker timeout.
- `gate1fR1RecoveryRepair.test.ts` — 2/2 tests passed, 1 worker timeout.

Focused assertion status: `ASSERTIONS_PASS / RUNNER_EXIT_FAIL`.

### Quality gates

- `pnpm run typecheck` — exit `0`.
- `pnpm run lint` — exit `0`.
- `pnpm run format` — exit `0`.
- `pnpm run build` — exit `0`; 143 modules transformed; existing large-chunk warning only.
- `git diff --check` — clean before RESULT staging.

### Full suite

Command: `pnpm test`

- Test files: `85 passed / 85 total`.
- Tests: `614 passed / 614 total`.
- assertion failures: `0`.
- unhandled runner errors: `5`, all Vitest worker `onTaskUpdate` timeouts from long-running tasks.
- process exit: `1`.

Full-suite status: `ASSERTIONS_PASS / RUNNER_EXIT_FAIL`.

## Changed files

- `src/sim/state/gate1fValidationFixture.ts`
- `src/sim/state/politicalInteractionFixture.ts`
- `src/sim/inspection/f05PacingFunDecision.ts`
- `src/sim/inspection/f05Fix7InteractionIntegration.ts`
- `src/sim/inspection/f05Fix9LateSteadyStateAudit.ts`
- `src/sim/inspection/f05Fix10StructuralRemedySelection.ts`
- `src/sim/inspection/gate1fR1RecoveryRepair.ts`
- `src/sim/inspection/gate1fR1RecoveryRepair.cli.ts`
- `src/sim/inspection/gate1fR1RecoveryRepair.test.ts`
- `docs/parallel/05_GATE1F_R1_FIX2_RESULT.md`

Commit/push is the final handoff action for this branch. No Gate1F PASS declaration is made here.
