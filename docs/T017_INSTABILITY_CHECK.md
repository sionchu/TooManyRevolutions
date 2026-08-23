# T017 Instability Inspection

2026-08-22 기준의 headless diagnostic이다. `src/sim/inspection/t017InstabilityInspection.ts`가 동일한 seed `20260822`로 실제 `runSimulationStep`을 실행하며, T017 phase만 명시적으로 config hook으로 확인한다. production default pipeline에도 같은 instability writer가 연결되어 있다.

이번 문서는 balance 확정이 아니라 다음을 확인한다.

- material / political / administrative pressure가 서로 구분되는가
- pressure와 누적 `Region.unrest`가 분리되는가
- pressure 제거 후 회복에 시간이 걸리는가
- `Country.instability`가 현재 통제 지역에서 검산 가능하게 집계되는가
- support 또는 ideology 이름만으로 불안이 생기지 않는가

## Baseline contract

- authoritative tick: 1일, calendar 360일/년
- `riseRate = 0.02`, `recoveryRate = 0.015`
- administrative overload reference: `15`
- channel combination: `1 - Π(1 - component)`
- severity bands: low `< 0.25`, medium `< 0.50`, high `< 0.75`, critical `≥ 0.75`
- pressure 표본은 자원 phase가 첫날 scarcity를 확정한 뒤 읽었다.

## Scenario comparison

| Scenario | Material | Political | Administrative | Combined | Day 30 Unrest | Day 90 | Day 180 | Day 360 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline calm | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| Material pressure | 1.000 | 0.000 | 0.000 | 1.000 | 0.455 | 0.838 | 0.974 | 0.999 |
| Political mobilization | 0.000 | 0.840 | 0.000 | 0.840 | 0.382 | 0.704 | 0.818 | 0.839 |
| Administrative overload | 0.000 | 0.000 | 0.400 | 0.400 | 0.182 | 0.335 | 0.389 | 0.400 |
| Pressure removed / recovery | 1.000* | 0.000 | 0.000 | 1.000* | 0.619 | 0.250 | 0.064 | 0.004 |

`*` Recovery 행의 pressure columns는 180일 동안 유지했던 제거 전 source pressure다. Day 30/90/180/360 값은 source 제거 직후부터의 회복 일수다.

## Political comparison

두 변형은 support를 `0.20`으로 고정하고 같은 Faction grievance/organization/influence를 사용했다.

| variant | support | radicalism | ideology organization | political pressure |
|---|---:|---:|---:|---:|
| 조직화된 급진 소수 | 0.200 | 0.850 | 0.800 | 0.840 |
| 같은 support, 낮은 radicalism/organization | 0.200 | 0.020 | 0.020 | 0.216 |

Support alone이 아니라 실제 radicalism/organization과 Faction 동원 상태가 pressure를 구분했다. `currentStrategy = wait`는 두 variant에서 동일하며 계산 입력이 아니다.

## Administrative comparison

두 지역 모두 Country의 `stateCapacity = 40`, committed load `55`, overload `15`를 사용했다.

| region | stateControl | overload | administrative pressure |
|---|---:|---:|---:|
| 플레이어 수도 (low reach) | 0.200 | 15.000 | 0.400 |
| 플레이어 항구 (high reach) | 0.900 | 15.000 | 0.050 |

낮은 `stateControl`만 있는 baseline은 administrative pressure 0이다. overload가 있어도 reach가 높으면 지역 pressure가 크게 줄어든다.

## Country aggregation check

다음 세 지역만 플레이어 Country가 통제하도록 만들고, mine/border는 uncontrolled로 제외했다.

| Region | population | unrest | weighted contribution |
|---|---:|---:|---:|
| 플레이어 수도 | 100 | 0.200 | 20.0 |
| 플레이어 항구 | 300 | 0.500 | 150.0 |
| 플레이어 농지 | 600 | 0.800 | 480.0 |
| 합계 | 1000 | — | 650.0 |

`Country.instability = 650 / 1000 × 100 = 65.0 / 100`이다. `ownerCountryId`가 아니라 `Region.controller`를 사용하며, controlled population이 없으면 0을 반환한다.

## Event observations

작은 daily delta는 event를 만들지 않고 band transition만 기록했다.

- Material sustained: `REGION_UNREST_BAND_CHANGED` at ticks 15, 35, 69
- Political mobilization: regional transitions at ticks 18, 45, 111; national transition at tick 54
- Administrative overload: regional transition at tick 49
- Recovery: rise transitions at ticks 15, 35, 69; recovery transitions at ticks 198, 225, 270

Event IDs/sequence는 기존 global ordering을 사용하며, T017이 새로 만든 event의 `causeIds`는 같은 step에서 이미 배출된 resource/ideology/intervention/faction event 또는 같은 phase에서 먼저 배출된 regional band event만 참조한다. T017은 rebellion/coup/revolution/civil-war/strike event를 만들거나 예약하지 않았다.

## Observations and risks

1. Baseline calm은 360일 동안 0으로 유지되어 control이 명확하다.
2. Material pressure는 첫 달에는 점진적이다(`0.455`). 지속적인 scarcity가 90일 이상 이어지면 high band으로 올라가며, 이것은 현재 formula/rate가 실제 장기 공급 실패를 무시하지 않는다는 뜻이다. 최종 pacing/balance는 T025A에서 다시 검증해야 한다.
3. Political pressure는 같은 support에서도 radicalism/organization이 낮으면 크게 낮아진다. 그러나 Faction relevance가 국가 소유 지역 전체로 넓게 해석되는 현재 구조 때문에 여러 지역에서 band가 같은 tick에 바뀔 수 있다. 지역별 faction presence/organization은 후속 task에서 더 정밀하게 다룰 수 있다.
4. Administrative overload는 낮은 reach 지역에 집중되며 national overload를 다시 더하지 않는다.
5. 제거 후 Day 30에도 unrest `0.619`가 남고 Day 360에 `0.004`로 내려간다. pressure와 unrest를 직접 대입하지 않는 효과가 보인다.
6. 이 harness는 T017 자체의 구조를 검사한다. wages, unemployment, taxes, repression, propaganda, institution feedback, faction growth, military sympathy는 아직 존재하지 않으므로 지역 다양성과 crisis 재미를 최종 판정하지 않는다.

## Recommendation

**STRUCTURALLY PROMISING — BALANCE NOT LOCKED**

T017 baseline은 component 구분, gradual accumulation/recovery, population aggregation, support-only 방지라는 구조 목표를 충족한다. 다만 sustained scarcity의 장기 수렴 속도와 Faction–Region relevance 해상도는 SAFE_TO_DEFER로 남긴다. 이 문서의 수치는 final balance로 승격하지 않는다.

실행 명령:

```text
pnpm run inspect:t017
```

T017A/T017B Territorial Map, T018 Rebellion/Coup, UI/React/rendering은 이 checkpoint에서 시작하지 않았다.
