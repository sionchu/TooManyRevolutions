# T016B Intervention Capacity Inspection

`src/sim/inspection/t016bInterventionCapacityInspection.ts`가 T016B fixture를 기존 authoritative pipeline으로 실행한다. 이 문서는 production balance가 아니라 static/runtime·feasibility·phase 경계 확인용이다.

## Fixture

플레이어 국가의 `국고 = 100`, `국가역량 = 60`에서 시작한다. active commitment 두 개를 미리 둔다.

| commitment | administrativeLoad | 상태 |
|---|---:|---|
| 단기 fixture | 12 | Day 0부터 active |
| 장기 fixture | 15 | Day 0부터 active |

초기 파생값:

| 국고 | 국가역량 | committed load | headroom | overload |
|---:|---:|---:|---:|---:|
| 100 | 60 | 27 | 33 | 0 |

fixture catalog에는 다음 세 정의만 있다.

- 단기 행정 fixture: load 12, duration 1 day, treasury cost 8
- 장기 행정 프로그램 fixture: load 15, duration 180 days, treasury cost 20
- 제도 prerequisite fixture: load 20, duration 180 days, treasury cost 12, `legislatureRequired = true` 필요

실제 군사·식량·복지 정책을 뜻하는 production content는 추가하지 않았다.

## Run result

제도 prerequisite를 충족한 뒤 C를 Day 1에 시작하면 load는 `27 + 20 = 47`, headroom은 `13`이 된다. 국고는 economy phase에서 cost 12를 한 번 정산해 88이 된다. Day 2에 장기 fixture D를 요청하면 필요한 load 15가 남은 headroom 13을 초과하므로 deterministic reject된다. D에는 commitment와 추가 비용이 없다.

C의 `completionTick = startedTick + 180 = 181`이다. Day 181의 `applyScheduledEffects`에서 C가 먼저 완료·제거되고, active load는 27, headroom은 33으로 돌아온다. 중간 날짜에는 progress event를 만들지 않는다.

| 시점 | 국고 | 국가역량 | committed load | headroom | overload |
|---|---:|---:|---:|---:|---:|
| Day 0 | 100 | 60 | 27 | 33 | 0 |
| Day 1, C 시작 후 | 88 | 60 | 47 | 13 | 0 |
| Day 2, D 거부 후 | 88 | 60 | 47 | 13 | 0 |
| Day 181, C 완료 후 | 88 | 60 | 27 | 33 | 0 |

Counterexample로 국가역량을 40으로 낮추고 기존 load를 25 + 25로 두면 `headroom = 0`, `overload = 10`이 된다. 기존 commitment는 삭제되지 않고 신규 시작만 `INSUFFICIENT_ADMINISTRATIVE_HEADROOM`으로 거부된다. T016B에서는 overload를 instability나 자동 실패로 연결하지 않는다.

## Event order

대표 accepted path:

`INTERVENTION_STARTED → TREASURY_CHANGED → TICK_ADVANCED`

거부 path:

`INTERVENTION_REJECTED → TICK_ADVANCED`

완료 path:

`INTERVENTION_COMPLETED → TICK_ADVANCED`

`TREASURY_CHANGED`는 같은 step에서 이미 배출된 `INTERVENTION_STARTED`를 cause로 참조한다. 완료 event는 이전 tick event를 현재 buffer에서 가장하지 않고 commitment/source action 정보를 payload에 기록한다.

재현 명령:

```text
pnpm run inspect:t016b
```

