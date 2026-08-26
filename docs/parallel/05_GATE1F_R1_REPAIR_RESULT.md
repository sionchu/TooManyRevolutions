# PARALLEL TASK 05 — Gate1F R1 Recovery Repair Result

TASK_ID: PARALLEL_05_GATE1F_R1_REPAIR

EXECUTION_AUTHORITY: docs/parallel/tasks/05_GATE1F_R1_REPAIR.md

BASE_BRANCH: gamebuilders-product-surface-p0

BASE_SHA: 1fc839e77f0fab6c0d58a4d0e312529919e2ce18

HEAD_SHA: 1fc839e77f0fab6c0d58a4d0e312529919e2ce18 (authorized execution input)

BRANCH: parallel-gate1f-diagnosis-v2

R1_STATUS: IMPLEMENTED_AND_MEASURED

GATE1F_ADJUDICATION: NOT_DECLARED

## Scope

이 문서는 승인된 R1 recovery repair만 기록한다. Gate1F 최종 판정, V02, persistence V9, R2/R3 작업은 수행하지 않았다.

공유 bridge 파일과 공용 결과 파일은 수정하지 않았다. conflict resolver, conflict system, faction pressure system, generic intervention system, presentation, map renderer, persistence schema도 수정하지 않았다.

## Bootstrap

- git fetch origin 실행 후 dedicated worktree에서 git pull --ff-only 실행
- local branch: parallel-gate1f-diagnosis-v2
- pull 후 local HEAD와 origin/parallel-gate1f-diagnosis-v2: 1fc839e77f0fab6c0d58a4d0e312529919e2ce18
- 실행 시작 시 working tree clean

## Selected repair

POLITICAL_ACCOMMODATION completion effect에 기존 effect kind인 factionOrganizationDelta를 추가했다.

- existing factionGrievanceDelta: -0.25
- selected factionOrganizationDelta: -0.50
- treasury cost: 70
- administrative load: 35
- duration: 7 days
- legislatureRequired prerequisite: preserved
- existing institution rule behavior and grievance benefit: preserved

선택값은 ACTIVE_CONFLICT_RECOVERY_T180, seed 40103, actor loop ON에서 bounded counterfactual sweep으로 선택했다. sweep은 baseline(null), -0.05부터 -0.50까지를 실행했다. 약한 structural recovery 신호는 -0.20에서 처음 나타났지만, preferred acceptance인 existing conflict resolver의 governmentRecovery와 국가 측 LAND_HEX_CONTROL_CHANGED를 동시에 만드는 가장 작은 후보는 -0.50이었다. 따라서 -0.50을 선택했다.

null 또는 zero delta를 전달하면 사전 repair accommodation effect를 재현할 수 있도록 진단용 scenario override를 남겼다. 기본 F04D validation fixture는 선택된 R1 값을 사용한다.

## Changed files

- src/sim/state/gate1fValidationFixture.ts
- src/sim/inspection/gate1fDiagnosisV2.ts
- src/sim/inspection/f05PacingFunDecision.ts
- src/sim/inspection/gate1fR1RecoveryRepair.ts
- src/sim/inspection/gate1fR1RecoveryRepair.cli.ts
- src/sim/inspection/gate1fR1RecoveryRepair.test.ts
- src/sim/systems/f04dInstitutionActions.test.ts
- src/sim/inspection/f04dInstitutionActionCounterfactualsInspection.test.ts
- docs/parallel/05_GATE1F_R1_REPAIR_RESULT.md

f05PacingFunDecision.ts 변경은 scenario override를 number로 전달하기 위한 type annotation만 추가했다. production repair surface는 gate1fValidationFixture.ts의 F04D validation intervention composition이다.

## Bounded counterfactual sweep

실행 조건: scenario gate1f.f04d.validation, seed 40103, context ACTIVE_CONFLICT_RECOVERY_T180, actor loop ON. H/U/T/C는 각각 player-controlled LandHex 수, maximum region unrest, treasury, active conflict 수다. ΔO, ΔG, ΔH, ΔC는 WAIT 대비 relative day 360 차이다.

| organization delta | feasible | starts/completions | ΔO@360 | ΔG@360 | ΔH@360 | ΔC@360 | country recovery event <=360 | structural recovery |
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

Sweep selection: selected=-0.50, rule=PREFERRED_COUNTRY_RECOVERY. All candidates retained the same action feasibility and one start/one completion behavior. -0.49 did not produce a country recovery event; -0.50 was the first candidate that did.

## Canonical recovery path

선택값 -0.50으로 F03 canonical action runner와 existing conflict resolver를 직접 추적했다.

1. ACTIVE_CONFLICT_RECOVERY_T180에서 intervention start
2. relative day 8: INTERVENTION_COMPLETED
3. completion effect가 existing faction grievance/organization state를 변경
4. existing faction operational strength와 conflict eligibility consumer가 변경된 faction state를 읽음
5. relative day 9: deriveConflictIntents가 reason=governmentRecovery인 intent를 생성
6. target: ideology-fixture.industrial-hex
7. acting government strength: 27.5
8. opposing faction strength: 22
9. normal territorial resolution 후 authoritative LAND_HEX_CONTROL_CHANGED 발생
10. subsequent existing resolution에서 relative day 16에 capital target recovery가 관측됨

canonical verification 결과:

- first completion: relative day 8
- first recovery event: relative day 9
- first recovery intent: governmentRecovery
- directControllerMutationAtCompletion: false
- controller write authority: existing changeLandHexController path

따라서 intervention completion 자체가 LandHex controller를 쓰지 않는다. completion 이후 기존 faction/conflict strength 판정과 기존 territorial writer가 순서대로 실행된다.

## 36-branch remeasurement

실행 조건: scenario gate1f.f04d.validation, seed 40103, horizon 1,800 days, actor loop ON, 6 contexts × 6 response strategies.

- branches: 36
- compared branches: 36
- trajectory signature mismatches: 0
- action count mismatches: 0
- silence mismatches: 0
- baselineReproduced: true
- existing F05 recommendation: NOT_READY

이 36/36 비교는 detailed diagnosis runner와 같은 현재 F05 runner 설정을 비교한 결과다. repair 전 accommodation reference는 기존 진단 결과와 함께 아래 before/after 표에 보존했다.

### Recovery matrix before/after

| response | before d360 H/U/T/C | after d360 H/U/T/C | before d1800 H/U/T/C | after d1800 H/U/T/C | after attempts/starts/completions/rejections | after classification |
| --- | --- | --- | --- | --- | --- | --- |
| WAIT | 0 / 1.000 / 303 / 2 | 0 / 1.000 / 303 / 2 | 0 / 1.000 / -1137 / 2 | 0 / 1.000 / -1137 / 2 | 0/0/0/0 | WAIT_BASELINE |
| MATERIAL_RELIEF | 0 / 0.987 / 213 / 2 | 0 / 0.987 / 213 / 2 | 0 / 0.987 / -1227 / 2 | 0 / 0.987 / -1227 / 2 | 1/1/1/0 | USEFUL_TRADEOFF |
| POLITICAL_ACCOMMODATION | 0 / 1.000 / 233 / 2 | 3 / 1.000 / 3294 / 1 | 0 / 1.000 / -1207 / 2 | 0 / 1.000 / 3259 / 2 | 1/1/1/0 | USEFUL_TRADEOFF |
| OPPOSITION_LEGALIZATION | 0 / 1.000 / 203 / 2 | 0 / 1.000 / 203 / 2 | 0 / 1.000 / -1237 / 2 | 0 / 1.000 / -1237 / 2 | 1/1/1/0 | HARMFUL_TRADEOFF |
| COERCIVE_RESTRICTION | 0 / 1.000 / 228 / 2 | 0 / 1.000 / 228 / 2 | 0 / 1.000 / -1212 / 2 | 0 / 1.000 / -1212 / 2 | 1/1/1/0 | COST_ONLY |
| REPEATED_POLITICAL_ACCOMMODATION | 0 / 1.000 / 23 / 2 | 3 / 1.000 / 3084 / 1 | 0 / 1.000 / -1417 / 2 | 3 / 1.000 / 13484 / 1 | 20/20/20/0 | USEFUL_TRADEOFF |

Political accommodation detailed checkpoints:

| checkpoint | before H/U/T/C | after H/U/T/C |
| --- | --- | --- |
| immediate | 0 / 0.979 / 592 / 1 | 0 / 0.979 / 592 / 1 |
| relative day 90 | 0 / 0.997 / 503 / 1 | 3 / 0.997 / 1134 / 0 |
| relative day 360 | 0 / 1.000 / 233 / 2 | 3 / 1.000 / 3294 / 1 |
| relative day 1800 | 0 / 1.000 / -1207 / 2 | 0 / 1.000 / 3259 / 2 |

MATERIAL_RELIEF remains the distinct scarcity/unrest response. OPPOSITION_LEGALIZATION remains a harmful political trade-off and COERCIVE_RESTRICTION retains institutional coercion semantics.

## Silence metrics

The values below are maximum / median / p90 days for the six-branch context aggregate, using diagnosis v2 definitions.

| context | channel | before | after |
| --- | --- | ---: | ---: |
| ACTIVE_CONFLICT_RECOVERY_T180 | meaningful decision opportunities | 1530 / 90 / 1530 | 1350 / 90 / 1350 |
| ACTIVE_CONFLICT_RECOVERY_T180 | major event clusters | 1787 / 112 / 1787 | 1787 / 96 / 1787 |
| ACTIVE_CONFLICT_RECOVERY_T180 | map-visible state changes | 1787 / 120 / 1787 | 1787 / 13 / 1787 |
| ACTIVE_CONFLICT_RECOVERY_T180 | action availability changes | 1486 / 10 / 1306 | 1792 / 10 / 1792 |
| ACTIVE_CONFLICT_RECOVERY_T181 | meaningful decision opportunities | 1530 / 90 / 1530 | 1350 / 90 / 1350 |
| ACTIVE_CONFLICT_RECOVERY_T181 | major event clusters | 1787 / 111 / 1787 | 1787 / 96 / 1787 |
| ACTIVE_CONFLICT_RECOVERY_T181 | map-visible state changes | 1787 / 119 / 1787 | 1787 / 13 / 1787 |
| ACTIVE_CONFLICT_RECOVERY_T181 | action availability changes | 1487 / 10 / 1307 | 1792 / 10 / 1792 |

Repair effects:

- maximum map-visible silence did not improve: 1787 to 1787 days
- map-visible median improved by 107 days for T180 and 106 days for T181
- major-event median improved by 16 days for T180 and 15 days for T181
- maximum decision-opportunity silence improved by 180 days in both neighboring contexts
- availability maximum increased to 1792 days because the changed state trajectory changes later feasibility; this is recorded as a measured limitation

The shorter map-visible gap is caused by observed intervention/faction/conflict/territory consequences at relative days 8, 9, and 16. No pacing timer, scheduler, or synthetic map event was added.

## Trajectory and reconvergence

Dimensions use the existing T/I/U/S/G/O/H/C signature. The controller label is the existing K/controller distribution dimension; institution is the existing P dimension.

| relative checkpoint | before accommodation versus WAIT | after accommodation versus WAIT | after repeated accommodation versus WAIT |
| ---: | --- | --- | --- |
| 180 | 2: T,G | 7: T,I,O,G,H,C,controller | 7: T,I,O,G,H,C,controller |
| 360 | 2: T,G | 7: T,I,O,G,H,C,controller | 7: T,I,O,G,H,C,controller |
| 720 | 2: T,G | 3: T,O,G | 7: T,I,O,G,H,C,controller |
| 1080 | 1: T | 1: T | 7: T,I,O,G,H,C,controller |
| 1800 | 1: T | 1: T | 7: T,I,O,G,H,C,controller |

At relative day 360, accommodation is no longer treasury plus grievance only: it differs from WAIT in player-controlled Hexes, active conflicts, faction organization, and controller distribution. At the late horizon, single accommodation reconverges to treasury-only difference; this is a real limitation of the existing downstream trajectory, not a hidden repair meter.

## Repeated accommodation exploit check

The repeated strategy uses the same 70/35/7 action definition at every existing 90-day decision sample.

| measurement | single accommodation | repeated accommodation |
| --- | ---: | ---: |
| attempts | 1 | 20 |
| starts | 1 | 20 |
| completions | 1 | 20 |
| rejections | 0 | 0 |
| nominal treasury cost | 70 | 1400 |
| nominal administrative commitment-days | 245 | 4900 |

Additional repeated checks:

- recovery-related LandHex event ticks: relative 9, 16, 23
- maximum LandHex changes at one resolution tick: 1
- repeated action is not a free action and carries materially higher treasury/admin burden
- no direct controller mutation was observed on the canonical intervention completion tick; the first controller event is one tick later through the existing resolver path

## Regression results

Required targeted inspections:

- pnpm run inspect:f04b — exit 0; F04B inspection checks passed
- pnpm run inspect:f04d — exit 0; F04D inspection/test passed and reported F04D RESULT: PASS
- pnpm run inspect:f05 — exit 0; existing recommendation remained NOT_READY
- pnpm run inspect:t018 — exit 0; detection and read-only state checks passed
- pnpm run inspect:t021 — exit 0; LandHex sole-writer and same-tick separation checks passed
- pnpm run inspect:t024 — exit 0; snapshot version 8 and replay/load equivalence passed
- pnpm run inspect:v01 — exit 0; renderer-independent checks passed and V02 remained not started

Focused R1:

- pnpm exec vitest run src/sim/inspection/gate1fR1RecoveryRepair.test.ts --pool=forks --no-file-parallelism --testTimeout=240000 --reporter=verbose --silent=false — 2 tests assertions passed; runner exit 1 because of one Vitest worker onTaskUpdate timeout
- the separate 36-branch test selection — 1 test passed, 1 skipped; runner exit 1 because of the same Vitest worker onTaskUpdate timeout
- focused status: ASSERTIONS_PASS / RUNNER_EXIT_FAIL

Diagnosis v2:

- pnpm exec vite-node src/sim/inspection/gate1fDiagnosisV2.cli.ts — exit 0; repaired diagnosis printed 36/36 comparison with zero trajectory/action/silence mismatches

Quality:

- pnpm run typecheck — exit 0
- pnpm run lint — exit 0
- pnpm run format — exit 0
- pnpm run build — exit 0; 143 modules transformed; existing large-chunk warning only
- git diff --check — clean before staging

## Full test status

Command: pnpm test

The package script excludes the pre-existing long-run survey/inspection files listed in package.json and includes the R1 test file.

- exit code: 1
- Test Files: 82 passed, 3 failed, 85 total
- Tests: 611 passed, 3 failed, 614 total
- unhandled errors: 5

Observed failed assertions:

1. src/sim/inspection/f05Fix7InteractionIntegration.test.ts — historicalF05BaselineRegression expected true, received false
2. src/sim/inspection/f05Fix9LateSteadyStateAudit.test.ts — report.allPassed expected true, received false
3. src/sim/inspection/f05Fix10StructuralRemedySelection.test.ts — lateMonthlyBoundaryCount expected 372, received 390

The five unhandled errors were Vitest worker Error: [vitest-worker]: Timeout calling onTaskUpdate. The R1-focused assertions passed; the full-suite result is not a clean suite pass. The three failed files are outside the R1 implementation surface and were not modified in this task.

## Known limitations

- Measurement uses gate1f.f04d.validation, seed 40103, six F05 contexts, and 1,800-day horizon.
- The preferred country recovery effect requires -0.50 organization delta; the weaker structural signal begins at -0.20.
- Maximum map-visible silence remains 1787 days even though its median improves.
- Single accommodation eventually retains only treasury as a difference from WAIT at the 1,800-day checkpoint.
- Availability maximum increases in the repaired neighboring contexts and requires separate design review.
- F05 remains NOT_READY.
- Gate1F PASS is not declared in this branch.

Commit and push are performed after this result is formatted and staged. STOP follows the push.
