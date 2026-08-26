# PARALLEL TASK 05 — Gate1F 진단 결과

TASK_ID: `PARALLEL_05_GATE1F_DIAGNOSIS`

BASE_SHA: `ffc876c8c532ae5f77282ba059ec565532a69eb7`

HEAD_SHA: `ffc876c8c532ae5f77282ba059ec565532a69eb7` (진단 입력 기준점)

BRANCH: `parallel-gate1f-diagnosis-v2`

Gate1F 판정은 이 branch에서 산출하지 않았다. 이 문서는 현재 기준의 재현·측정·후속 설계 후보만 기록한다.

## BASELINE_REPRODUCED

`TRUE`

- `git fetch origin` 후 `origin/gamebuilders-product-surface-p0`가 `ffc876c8c532ae5f77282ba059ec565532a69eb7`와 일치함을 확인했다.
- Scenario: `gate1f.f04d.validation`
- Seed: `40103`
- Horizon: 5년 / `1,800`일
- Actor loop: `ON`
- Context: 6개, branch: 36개 (6 context × 6 response)
- 기존 `runF05PacingFunDecision()`과 상세 runner의 branch별 trajectory signature: `36/36` 일치
- action attempts/starts/completions/rejections: `36/36` 일치
- 기존 F05의 정확한 pacing-event silence metric: `36/36` 일치
- trajectory mismatch: `0`, action mismatch: `0`, silence mismatch: `0`
- 기존 F05 recommendation은 `NOT_READY`로 재현됐다.

상세 runner는 기존 F03의 canonical action → step → commit 경로와 F05의 90일 repeat accommodation 정책을 그대로 사용했다. 추가한 관측은 WorldState를 변경하지 않는 transient read model이다.

## Measurement method

- Checkpoint: relative `0`, `1`, `90`, `180`, `360`, `720`, `1080`, `1800`일.
- Recovery matrix는 `ACTIVE_CONFLICT_RECOVERY_T180`의 6개 response를 대상으로 한다.
- `meaningful player decision opportunity`는 기존 F05의 90일 decision sample 시점 중 하나 이상의 기존 response가 feasible인 시점이다. 이는 gameplay scheduler를 추가한 것이 아니다.
- `major event cluster`는 F05 pacing event를 30일 이내 간격으로 묶은 cluster의 종료 시점을 사용한다. 기존 F05와의 재현 비교에는 cluster가 아닌 개별 pacing-event tick도 별도로 보존했다.
- `map-visible state change`는 각 observation의 LandHex controller, active conflict, current government, terminal outcome signature 변화다.
- `action availability change`는 매 tick `evaluateInterventionFeasibility()`로 산출한 네 가지 기존 response의 feasible set 변화다.
- 침묵 gap은 branch 실행 구간의 시작·신호 tick·종료를 정렬해 계산했다. 모든 branch가 1,800일까지 실행됐다.

## RECOVERY_CHOICE_MATRIX

표의 `H/U/T/C`는 각각 player-controlled Hex 수 / 최대 region unrest / treasury / active conflict 수다. 아래 값은 recovery checkpoint의 절대값이며, `Δ` 표는 tick 180 시작값 대비 변화다.

| Response | cost / admin / days | start feasible | attempts / starts / completes / rejects | immediate H/U/T/C | 90d H/U/T/C | 360d H/U/T/C | 1800d H/U/T/C | 분류 |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- |
| `WAIT` | 0 / 0 / 0 | yes | 0 / 0 / 0 / 0 | 0 / 0.979 / 662 / 1 | 0 / 0.997 / 573 / 1 | 0 / 1.000 / 303 / 2 | 0 / 1.000 / -1137 / 2 | WAIT baseline |
| `MATERIAL_RELIEF` | 90 / 35 / 1 | yes | 1 / 1 / 1 / 0 | 0 / 0.979 / 572 / 1 | 0 / 0.983 / 483 / 1 | 0 / 0.987 / 213 / 2 | 0 / 0.987 / -1227 / 2 | useful trade-off |
| `POLITICAL_ACCOMMODATION` | 70 / 35 / 7 | yes | 1 / 1 / 1 / 0 | 0 / 0.979 / 592 / 1 | 0 / 0.997 / 503 / 1 | 0 / 1.000 / 233 / 2 | 0 / 1.000 / -1207 / 2 | cost-only |
| `OPPOSITION_LEGALIZATION` | 100 / 40 / 12 | yes | 1 / 1 / 1 / 0 | 0 / 0.979 / 562 / 1 | 0 / 0.997 / 473 / 2 | 0 / 1.000 / 203 / 2 | 0 / 1.000 / -1237 / 2 | harmful trade-off |
| `COERCIVE_RESTRICTION` | 75 / 45 / 5 | yes | 1 / 1 / 1 / 0 | 0 / 0.979 / 587 / 1 | 0 / 0.997 / 498 / 1 | 0 / 1.000 / 228 / 2 | 0 / 1.000 / -1212 / 2 | cost-only |
| `REPEATED_POLITICAL_ACCOMMODATION` | 70 / 35 / 7 per attempt | yes | 20 / 4 / 4 / 16 | 0 / 0.979 / 592 / 1 | 0 / 0.997 / 503 / 1 | 0 / 1.000 / 23 / 2 | 0 / 1.000 / -1417 / 2 | cost-only |

Recovery 시작 시 모든 response의 feasible set은 `MATERIAL_RELIEF`, `POLITICAL_ACCOMMODATION`, `OPPOSITION_LEGALIZATION`, `COERCIVE_RESTRICTION` 네 개였다. 모든 branch에서 recovery 시작과 최종 controller count는 `faction:t018.fixture.rebellion-faction=3`이며 player count는 `0`이다. 즉 이 matrix에서 유료 response가 LandHex 제어권을 회복한 branch는 없다.

| Response | Δ day 1: `T/I/U/S/G/O/H/C` | Δ day 90 | Δ day 360 | Δ day 1800 |
| --- | --- | --- | --- | --- |
| `WAIT` | `-1/0/0/0/0/0/0/0` | `-90/0/+0.018/0/+0.120/+0.060/0/0` | `-360/0/+0.021/0/+0.480/+0.080/0/+1` | `-1800/0/+0.021/0/+0.695/+0.080/0/+1` |
| `MATERIAL_RELIEF` | `-91/0/0/0/0/0/0/0` | `-180/0/+0.004/-0.500/+0.120/+0.060/0/0` | `-450/0/+0.008/-0.500/+0.478/+0.080/0/+1` | `-1890/0/+0.008/-0.500/+0.676/+0.080/0/+1` |
| `POLITICAL_ACCOMMODATION` | `-71/0/0/0/0/0/0/0` | `-160/0/+0.018/0/-0.130/+0.060/0/0` | `-430/0/+0.021/0/+0.230/+0.080/0/+1` | `-1870/0/+0.021/0/+0.695/+0.080/0/+1` |
| `OPPOSITION_LEGALIZATION` | `-101/0/0/0/0/0/0/0` | `-190/0/+0.018/0/+0.220/+0.060/0/+1` | `-460/0/+0.021/0/+0.580/+0.080/0/+1` | `-1900/0/+0.021/0/+0.695/+0.080/0/+1` |
| `COERCIVE_RESTRICTION` | `-76/0/0/0/0/0/0/0` | `-165/0/+0.018/0/+0.220/-0.060/0/0` | `-435/0/+0.021/0/+0.488/+0.080/0/+1` | `-1875/0/+0.021/0/+0.695/+0.080/0/+1` |
| `REPEATED_POLITICAL_ACCOMMODATION` | `-71/0/0/0/0/0/0/0` | `-160/0/+0.018/0/-0.130/+0.060/0/0` | `-640/0/+0.021/0/-0.420/+0.080/0/+1` | `-2080/0/+0.021/0/+0.695/+0.080/0/+1` |

`T/I/U/S/G/O/H/C`는 treasury / instability / max unrest / max scarcity / faction grievance / faction organization / player Hex / active conflicts다. Recovery horizon에서 모든 branch의 instability는 `0.000`으로 측정됐다.

### Recovery causal chains and availability

- `MATERIAL_RELIEF`: day 1 `INTERVENTION_STARTED`, day 2 `INTERVENTION_COMPLETED`와 `RESOURCE_SHORTAGE_CHANGED`가 연결됐다. Scarcity는 day 90에 `1.000 → 0.500`, unrest는 `0.997 → 0.983`이지만 controller는 바뀌지 않았다. 따라서 비용을 지불한 국소 경제 benefit은 있으나 territorial recovery benefit은 없다.
- `POLITICAL_ACCOMMODATION`: day 1 start, day 8 complete, recovery grievance는 day 90에 `-0.130` delta를 보였지만 360일 이후 WAIT와 같은 conflict/controller 경로로 돌아간다. Treasury만 더 낮고, 회복 제어권 증거는 없다.
- `OPPOSITION_LEGALIZATION`: day 13 completion이 `INSTITUTION_RULE_CHANGED`와 같은 cause로 `COUP_ATTEMPT_STARTED`를 만들었다. Institution은 `restricted/restricted → plural/restricted`, active conflict는 day 90에 `1 → 2`가 됐고 controller는 변하지 않았다. 유료 제도 변화가 recovery를 만들지 않고 단기 conflict 악화를 추가한다.
- `COERCIVE_RESTRICTION`: day 6 completion에서 `pressFreedom`과 `politicalCompetition`이 각각 `censored`, `banned`로 바뀌었다. Organization은 day 90에 `-0.060` delta를 보였고, day 120 coup 이후 conflict/controller 결과는 WAIT와 같다.
- `REPEATED_POLITICAL_ACCOMMODATION`: 20회 시도 중 4회만 start/completion 됐고 16회가 rejection 됐다. 최초 completion cluster는 day 8, 이후 successful completion은 day 98, 188, 278에 관측됐다. Recovery horizon에서는 player Hex `0`, active conflict `2`, treasury `-1417`로 WAIT보다 treasury만 더 낮다.

| Response | feasible set at day 1 | feasible set at day 90 | feasible set at day 360 | 측정된 동작 |
| --- | --- | --- | --- | --- |
| `WAIT` | all 4 | all 4 | all 4 | action 없음 |
| `MATERIAL_RELIEF` | none | all 4 | all 4 | active commitment 동안 admin headroom으로 day 1 set이 비어 있음 |
| `POLITICAL_ACCOMMODATION` | none | all 4 | all 4 | completion 후에도 recovery controller 변화 없음 |
| `OPPOSITION_LEGALIZATION` | none | material / accommodation / coercive | material / accommodation / coercive | plural 전환 후 legalization 자체가 unavailable |
| `COERCIVE_RESTRICTION` | none | material / accommodation / legalization | material / accommodation / legalization | censored/banned 전환 후 coercion 자체가 unavailable |
| `REPEATED_POLITICAL_ACCOMMODATION` | none | all 4 | none | 20 attempts, 4 starts, 4 completions, 16 rejections |

Availability sample과 action acceptance는 동일한 신호가 아니다. 예를 들어 repeated branch는 day 90 sample에서 response set이 열려 있지만 전체 실행에서 16회 rejection이 발생했다. 그러므로 후속 repair에서는 feasibility 표시와 canonical action rejection 원인을 함께 유지해야 한다.

## POLITICAL_SILENCE_METRICS

아래는 각 context의 6개 branch를 aggregate한 `maximum / median / p90` 일수다.

| Context | meaningful decision opportunities | major event clusters | map-visible changes | action availability changes |
| --- | ---: | ---: | ---: | ---: |
| `EARLY_PREVENTIVE_T0` | `1080 / 90 / 1080` | `1695 / 90 / 1695` | `1695 / 7 / 1695` | `1792 / 10 / 1792` |
| `EARLY_PREVENTIVE_T1` | `1080 / 90 / 1080` | `1696 / 90 / 1696` | `1696 / 7 / 1696` | `1792 / 10 / 1792` |
| `NEAR_CRISIS_T18` | `1080 / 90 / 1080` | `1713 / 87 / 1713` | `1713 / 7 / 1713` | `1792 / 10 / 1792` |
| `NEAR_CRISIS_T19` | `1080 / 90 / 1080` | `1714 / 86 / 1714` | `1714 / 7 / 1714` | `1792 / 10 / 1792` |
| `ACTIVE_CONFLICT_RECOVERY_T180` | `1530 / 90 / 1530` | `1787 / 112 / 1787` | `1787 / 120 / 1787` | `1486 / 10 / 1306` |
| `ACTIVE_CONFLICT_RECOVERY_T181` | `1530 / 90 / 1530` | `1787 / 111 / 1787` | `1787 / 119 / 1787` | `1487 / 10 / 1307` |

Representative primary context의 gap distribution은 다음과 같다. 표기 `구간: gap 개수`이며 0개 구간은 생략했다.

| Context | Channel | Distribution |
| --- | --- | --- |
| `EARLY_PREVENTIVE_T0` | decision opportunity | `31-90:86, 181-360:1, 361-720:1, 721-1080:2` |
| `EARLY_PREVENTIVE_T0` | major event cluster | `31-90:22, 91-180:6, 181-360:3, 1081+:5` |
| `EARLY_PREVENTIVE_T0` | map-visible | `0-30:18, 31-90:1, 91-180:2, 181-360:4, 1081+:6` |
| `EARLY_PREVENTIVE_T0` | availability | `0-30:57, 31-90:20, 181-360:1, 361-720:1, 721-1080:4, 1081+:3` |
| `NEAR_CRISIS_T18` | decision opportunity | `31-90:84, 181-360:1, 361-720:1, 721-1080:2` |
| `NEAR_CRISIS_T18` | major event cluster | `31-90:24, 91-180:4, 181-360:3, 1081+:5` |
| `NEAR_CRISIS_T18` | map-visible | `0-30:25, 31-90:1, 91-180:2, 181-360:4, 1081+:6` |
| `NEAR_CRISIS_T18` | availability | `0-30:57, 31-90:20, 181-360:1, 361-720:1, 721-1080:4, 1081+:3` |
| `ACTIVE_CONFLICT_RECOVERY_T180` | decision opportunity | `31-90:29, 1081+:6` |
| `ACTIVE_CONFLICT_RECOVERY_T180` | major event cluster | `0-30:5, 31-90:2, 91-180:5, 1081+:6` |
| `ACTIVE_CONFLICT_RECOVERY_T180` | map-visible | `0-30:1, 91-180:5, 1081+:6` |
| `ACTIVE_CONFLICT_RECOVERY_T180` | availability | `0-30:31, 31-90:3, 361-720:5, 1081+:6` |

Context difference:

- T0 → T1은 decision opportunity max가 같고, major/map max가 `1695 → 1696`으로 하루 늘었다. Availability max는 양쪽 모두 `1792`다.
- T18 → T19는 decision opportunity max가 같고, major/map max가 `1713 → 1714`로 하루 늘었다. Availability max는 양쪽 모두 `1792`다.
- T180 → T181은 major-event max가 `1787`로 같고, map-visible median이 `120 → 119`, availability max가 `1486 → 1487`로 바뀐다. one-day neighbor에서 recovery의 구조적 leverage는 stable하게 관측됐다.

기존 F05의 개별 pacing-event 기준 maximum은 primary context에서 각각 `1695`, `1713`, `1787`일이며, 신규 cluster 표현과 함께 보존됐다. 따라서 긴 침묵은 sampling artifact만으로 설명되지 않는다.

## RECONVERGENCE_METRICS

각 representative primary context에서 `WAIT`를 기준으로 relative tick `180`, `360`, `720`, `1080`, `1800`의 trajectory signature를 비교했다. 숫자는 WAIT와 다른 state dimension 개수이며 괄호는 남은 차이다.

약어: `T` treasury, `I` instability, `U` unrest, `S` scarcity, `G` faction grievance, `O` faction organization, `H` player-controlled Hex, `C` active conflicts, `K` controller distribution, `P` institutional rules.

| Context / tick | MATERIAL_RELIEF | POLITICAL_ACCOMMODATION | OPPOSITION_LEGALIZATION | COERCIVE_RESTRICTION | REPEATED_POLITICAL_ACCOMMODATION |
| --- | --- | --- | --- | --- | --- |
| T0 / 180 | 4 (T,U,S,G) | 6 (T,I,G,H,C,K) | 4 (T,G,C,P) | 4 (T,O,G,P) | 6 (T,I,G,H,C,K) |
| T0 / 360 | 4 (T,U,S,G) | 2 (T,G) | 3 (T,G,P) | 4 (T,O,G,P) | 6 (T,I,G,H,C,K) |
| T0 / 720 | 4 (T,U,S,G) | 2 (T,G) | 3 (T,G,P) | 2 (T,P) | 6 (T,I,G,H,C,K) |
| T0 / 1080 | 4 (T,U,S,G) | 1 (T) | 2 (T,P) | 2 (T,P) | 6 (T,I,G,H,C,K) |
| T0 / 1800 | 4 (T,U,S,G) | 1 (T) | 2 (T,P) | 2 (T,P) | 6 (T,I,G,H,C,K) |
| T18 / 180 | 4 (T,U,S,G) | 6 (T,I,G,H,C,K) | 4 (T,G,C,P) | 4 (T,O,G,P) | 6 (T,I,G,H,C,K) |
| T18 / 360 | 4 (T,U,S,G) | 2 (T,G) | 3 (T,G,P) | 4 (T,O,G,P) | 6 (T,I,G,H,C,K) |
| T18 / 720 | 4 (T,U,S,G) | 2 (T,G) | 3 (T,G,P) | 2 (T,P) | 6 (T,I,G,H,C,K) |
| T18 / 1080 | 4 (T,U,S,G) | 1 (T) | 2 (T,P) | 2 (T,P) | 6 (T,I,G,H,C,K) |
| T18 / 1800 | 4 (T,U,S,G) | 1 (T) | 2 (T,P) | 2 (T,P) | 6 (T,I,G,H,C,K) |
| T180 / 180 | 3 (T,U,S) | 2 (T,G) | 3 (T,G,P) | 4 (T,O,G,P) | 2 (T,G) |
| T180 / 360 | 4 (T,U,S,G) | 2 (T,G) | 3 (T,G,P) | 3 (T,G,P) | 2 (T,G) |
| T180 / 720 | 4 (T,U,S,G) | 2 (T,G) | 2 (T,P) | 2 (T,P) | 2 (T,G) |
| T180 / 1080 | 4 (T,U,S,G) | 1 (T) | 2 (T,P) | 2 (T,P) | 2 (T,G) |
| T180 / 1800 | 4 (T,U,S,G) | 1 (T) | 2 (T,P) | 2 (T,P) | 1 (T) |

모든 non-WAIT branch는 첫 측정 checkpoint인 day 180에서 WAIT와 달랐고, full signature가 horizon에서 완전히 같아진 branch는 없었다. 다만 차원의 축소는 structural reconvergence를 보여준다.

- Single accommodation은 T0/T18에서 horizon에 treasury만 남긴다. Recovery에서도 treasury 외에는 WAIT와 같아진다.
- Legalization은 horizon에 treasury와 `politicalCompetition=plural`만 남긴다. day 13의 coup/history 차이는 terminal signature의 event history에 계속 남는다.
- Coercion은 horizon에 treasury와 `politicalCompetition=banned`, `pressFreedom=censored`가 남는다.
- Material relief는 horizon에 treasury, unrest, scarcity, grievance가 남는다.
- Repeat accommodation은 T0/T18에서 instability·grievance·player controller·active conflict가 지속되지만 recovery에서는 rejection 이후 horizon에 treasury만 남는다.

즉 branch history는 달라도 late state structure의 상당 부분은 같은 `0 player Hex / 2 active conflict / active outcome`으로 reconverge한다. 이 결과는 회복 국면에서 선택의 endpoint leverage가 아니라 초기 cost와 timing만 분기하는 현상을 보여준다.

## TOP_3_REPAIR_CANDIDATES

아래 세 항목은 설계 후보이며 이 branch에서는 구현하지 않았다.

### R1 — 기존 institution/intervention downstream의 recovery response 재조합

- Reuse: F04D administrative intervention feasibility/cost/load, `politicalCompetition` 및 faction grievance consumer, 기존 LandHex/conflict read model.
- Expected trade-off: treasury·administrativeLoad·duration과 정치 rule 변화는 유지하고, completion 이후 기존 faction/territory/conflict consumer에 상태 차이를 연결한다.
- Recovery meaning: 전부 잃은 뒤에도 하나의 유료 response가 controller·conflict·instability 중 최소 한 축에 측정 가능한 결과를 만든다.
- Silence: completion에서 기존 downstream event/map signal이 발생할 수 있지만 시간 기반 scheduler는 추가하지 않는다.
- Exploit risk: repeated response로 treasury와 controller 효과를 동시에 누적하는 조합.
- Regression risk: pre-collapse timing, institution prerequisite, F04D causal trace 변경.
- Expected production files: `src/sim/state/gate1fValidationFixture.ts` 또는 해당 intervention consumer, 관련 `src/sim/systems/*` consumer, `src/sim/inspection/f04dInstitutionActionCounterfactuals*` 회귀 검사.

### R2 — 기존 conflict/faction action의 recovery 선택지 재조합

- Reuse: active conflict participant/controller state, faction action intake, political agenda read model, 기존 territorial conflict resolution seam.
- Expected trade-off: 기존 resource·administrative·instability 비용을 유지하고 conflict participant와 controller 조건에 따라 기존 resolution 경로의 결과를 관측한다.
- Recovery meaning: 단순 treasury 소모가 아니라 active conflict state와 연결된 선택이 recovery trajectory를 분기한다.
- Silence: 새 timer/event scheduler 없이 기존 conflict/faction action 또는 agenda 변화가 발생한 때만 신호를 만든다.
- Exploit risk: active conflict 동안 반복 action으로 controller transition을 과도하게 유도하는 문제.
- Regression risk: actor-loop proposal order, conflict resolution, neighboring checkpoint timing 변화.
- Expected production files: 기존 `src/sim/state/action.ts` 또는 faction action intake, 기존 conflict/territorial consumer, `src/sim/inspection/f04bActiveConflictRecoveryAgency*` 회귀 검사.

### R3 — 기존 response feasibility와 recovery coverage의 좁은 보강

- Reuse: `evaluateInterventionFeasibility`, administrative headroom/treasury commitment, F04D response catalog와 기존 downstream event chain.
- Expected trade-off: 추가 response도 treasury·administrativeLoad·completion delay·정치적 부작용 중 명시된 비용을 가진다.
- Recovery meaning: 세 response가 cost-only가 되는 coverage gap을 좁게 보강하고 rejection/availability 측정을 보존한다.
- Silence: availability 변화 또는 completion effect가 기존 event/map signal을 만들 때만 개선된다.
- Exploit risk: 충분한 treasury branch에서 repeat response가 availability와 effect를 누적하는 문제.
- Regression risk: feasible response 수, prerequisite rejection, WAIT 비교 벡터 변경.
- Expected production files: `src/sim/state/gate1fValidationFixture.ts`, 필요한 경우 기존 intervention consumer, F04D inspection 회귀 검사.

## RECOMMENDED_REPAIR

`R1_RECOVERY_RESPONSE_RECOMPOSITION`을 별도 repair task에서 우선 검토한다.

근거는 recovery matrix에서 material relief만 실제 scarcity/unrest benefit을 남겼고, 정치 accommodation/legalization/coercion이 controller를 전혀 바꾸지 못했기 때문이다. 기존 institution/intervention downstream을 재조합하면 현재 비용과 정치적 부작용을 보존하면서 recovery에서 하나의 유료 response에 상태 결과를 줄 수 있다. 이 후보는 generic meter, story node, hidden timer, persistence schema 없이 현재 consumer 경계를 좁게 다루는 방향이다.

## EXPECTED_CHANGED_FILES

이 branch에서 실제로 추가한 파일:

- `src/sim/inspection/gate1fDiagnosisV2.ts`
- `src/sim/inspection/gate1fDiagnosisV2.cli.ts`
- `src/sim/inspection/gate1fDiagnosisV2.test.ts`
- `docs/parallel/05_GATE1F_DIAGNOSIS_RESULT.md`

후속 R1 repair에서 변경 가능성이 있는 production 경계는 `src/sim/state/gate1fValidationFixture.ts` 또는 승인된 기존 intervention consumer와 그에 대응하는 F04D/F05 inspection test다. 이 branch에서는 production gameplay, presentation, map, audio, icon, persistence 파일을 변경하지 않았다.

## RISKS

- 이 측정은 `gate1f.f04d.validation`, seed `40103`, F05의 6 context/6 response에 한정된다. 다른 seed·scenario 일반화는 이 결과에 포함하지 않는다.
- 90일 decision opportunity는 기존 F05 diagnostic sample을 재사용한 것이며 새로운 gameplay opportunity를 만들지 않는다.
- Cluster silence와 legacy individual-event silence를 함께 보존했다. 두 metric을 혼합해 하나의 숫자로 해석하면 안 된다.
- Recovery에서 availability와 repeated action rejection이 분리되어 관측됐다. 후속 변경이 이 둘을 합치면 사용자가 볼 선택지와 canonical resolution 사이의 설명 가능성이 떨어질 수 있다.
- R1은 정치 rule 변경과 downstream consumer 사이의 회귀 위험이 가장 크므로 pre-collapse, near-crisis, active-recovery와 neighboring checkpoint를 모두 재측정해야 한다.
- R2는 actor loop와 conflict resolution을 함께 건드릴 수 있고, R3는 feasibility coverage를 넓히는 과정에서 repeat exploit을 만들 수 있다.

## AUTHORIZATION_REQUIRED

현재 branch에는 production repair 권한이 없다. 후속 task를 시작하려면 다음을 명시한 별도 authorization이 필요하다.

1. R1/R2/R3 중 하나와 변경할 정확한 production 파일·consumer 경계.
2. recovery에서 허용할 하나 이상의 기존 response와 보존할 treasury/admin/duration/institution trade-off.
3. controller/conflict/instability 중 어떤 기존 state consumer를 결과로 사용할지와 acceptance threshold.
4. pre-collapse·near-crisis·active-recovery·neighboring checkpoint 회귀 테스트 범위.
5. 이번 진단 runner와 repeated accommodation probe를 후속 재측정에 유지할지 여부.

Gate1F 최종 판정, V02 시작, persistence 변경은 이 authorization에 포함되지 않는다.

## Verification

실행한 명령:

- `git fetch origin`
- `pnpm exec vite-node src/sim/inspection/gate1fDiagnosisV2.cli.ts` — exit 0; `baselineReproduced=true`, 36/36 비교, mismatch 0
- `pnpm exec vitest run src/sim/inspection/gate1fDiagnosisV2.test.ts --pool=forks --testTimeout=240000 --reporter=verbose --silent=false` — 2 tests passed
- `pnpm run inspect:f04b` — exit 0
- `pnpm run inspect:f05` — exit 0; 기존 recommendation `NOT_READY`
- `pnpm exec vitest run src/sim/inspection/f04dInstitutionActionCounterfactualsInspection.test.ts --pool=forks --testTimeout=30000 --reporter=verbose --silent=false` — 1 test passed
- `pnpm run typecheck` — pass
- `pnpm run lint` — pass
- `pnpm run format` — pass
- `pnpm run build` — pass; 143 modules transformed
- `git diff --check` — pass after final source/document inspection
