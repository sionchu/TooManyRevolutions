# T016 Faction Pressure Check

2026-08-22 기준의 작은 headless inspection이다. 목적은 정답 정치 행동을 정하거나 balance를 맞추는 것이 아니라, 같은 WorldState의 차이가 heuristic proposal의 차이로 나타나는지 확인하는 것이다.

## Scenario

한 국가와 두 Region, 세 Faction을 사용했다.

| Faction | grievance | resources | faction organization | influence | affinity/context | 예상 proposal |
|---|---:|---:|---:|---:|---|---|
| 상인 길드 | 0.70 | 0.80 | 0.60 | 0.40 | 공화주의 affinity, 무역 interest | `FUND_MOVEMENT` |
| 귀족원 | 0.35 | 0.20 | 0.40 | 0.80 | 왕정 affinity, 토지·권위 interest | `LOBBY` |
| 공업 노동자회 | 0.75 | 0.20 | 0.70 | 0.20 | 공산주의 affinity, 노동 interest | `ORGANIZE` |

국가의 institutional rules는 기본값인 제한적 언론·노동 조직 허용 상태로 시작한다. observation은 두 Region의 scarcity/unrest/stateControl와 faction affinity에 해당하는 Region ideology의 support/radicalism/organization도 읽는다.

`Region.ideology[*].organization`은 지역 이념/운동의 조직 기반이고 `Faction.organization`은 faction entity의 조직 역량이다. inspection은 두 값을 별도로 계산하며 복사하지 않는다.

## First monthly checkpoint

초기 날짜를 왕력 1년 1월 30일로 두고 한 daily step을 실행했다. 다음 날짜가 왕력 1년 2월 1일이므로 `factionPressure`가 proposal을 만든다. 세 proposal은 `FactionId` 오름차순으로 반환되며 target tick은 다음 step이다.

| 반환 순서 | source | actionType | target tick | WorldState 직접 변경 |
|---:|---|---|---:|---|
| 1 | `heuristic` | `FUND_MOVEMENT` | 2 | 없음 |
| 2 | `heuristic` | `LOBBY` | 2 | 없음 |
| 3 | `heuristic` | `ORGANIZE` | 2 | 없음 |

proposal을 `acceptActionProposals`로 intake하면 action ID와 global sequence가 붙은 accepted `ActionRecord`가 된다. 그 record를 다음 step에 넣었을 때만 해당 faction의 `currentStrategy`가 바뀌며, 변경 시 `FACTION_STRATEGY_CHANGED`가 한 번 배출된다.

## Context sensitivity

- 노동 조직을 `illegal`로 바꾸면 노동자회의 `ORGANIZE` availability가 false가 되고 heuristic은 `ORGANIZE`를 선택하지 않는다. 정책이 특정 action/event를 직접 예약하지 않는다.
- 상인 길드의 resources를 `0.80`에서 `0.10`으로 낮추면 `FUND_MOVEMENT`에서 `ORGANIZE`로 바뀐다.
- 같은 상태를 반복하면 같은 proposal과 같은 faction order가 나온다.
- non-monthly no-action step은 proposal, faction event, faction state change가 없다.

## Scope result

이 checkpoint는 proposal 가독성과 state-to-intention 연결만 확인했다. T016은 resources 소비, 조직 성장, grievance 변화, agenda text, instability, strike/coup/revolution/rebellion/civil-war resolution, diplomacy, foreign support, AI, UI를 추가하지 않는다. 따라서 이 표의 행동은 의도이며 실제 정치 결과가 아니다.
