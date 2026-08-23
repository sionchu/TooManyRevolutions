# T016A Agenda Read-Model Check

실제 T011/T015/T016 상태와 같은 `SimulationStep` 출력으로 agenda selector를 점검했다. 이 문서는 UI 목업이 아니라 headless read-model inspection 결과다.

## 검사 범위

- 시뮬레이션: Day 0에서 실제 1일 step 실행
- player: 플레이어 왕국
- 외국 국가: 상인공화국, 절대왕정
- 지역: 플레이어 수도·항구·농지·광산·국경, 상인공화국 항구, 절대왕정 국경지대
- 압력 입력:
  - 플레이어 왕국: 국고 `-30`, 일일 지출 `5`
  - 플레이어 항구: `food` 수요 `20`, 공화주의 지역 조직 `0.7`
  - 항구 상인연합: grievance `0.8`, Faction organization `0.75`, influence `0.7`, resources `0.65`
  - 실제 directed foreign diffusion: 상인공화국 항구 → 플레이어 항구, 절대왕정 국경지대 → 플레이어 국경
- event evidence: 같은 step에서 실제 생성된 `TREASURY_CHANGED`, `RESOURCE_SHORTAGE_CHANGED`, `IDEOLOGY_DIFFUSED`, `IDEOLOGY_SUPPORT_CHANGED`

## Topology

| 출발 | 도착 | channel | base strength |
|---|---|---|---:|
| 플레이어 국경 | 절대왕정 국경지대 | border | 0.90 |
| 플레이어 수도 | 플레이어 농지 | border | 0.60 |
| 플레이어 수도 | 플레이어 항구 | border | 0.80 |
| 플레이어 농지 | 플레이어 수도 | border | 0.60 |
| 상인공화국 항구 | 플레이어 항구 | information | 0.60 |
| 상인공화국 항구 | 플레이어 항구 | trade | 0.40 |
| 절대왕정 국경지대 | 플레이어 국경 | border | 0.70 |
| 플레이어 항구 | 플레이어 수도 | information | 0.70 |
| 플레이어 항구 | 상인공화국 항구 | migration | 0.30 |
| 플레이어 항구 | 상인공화국 항구 | trade | 0.80 |

## Day 1 result

| 순위 | 종류 | 제목 | severity | 추세 | 관련 지역 | 관련 세력 | 핵심 원인 | 개입 | causeEventIds |
|---:|---|---|---:|---|---|---|---|---|---|
| 1 | 세력 | 항구 상인연합의 정치 압력 | 0.678 (high) | 상승 | 플레이어 국경, 수도, 농지, 광산, 항구 | 항구 상인연합 | grievance 0.800; Faction organization 0.750; 지역 물질·행정 압력 0.172 | policy, noAction | `event:1:0`, `event:1:1` |
| 2 | 외국 이념 압력 | 절대왕정의 왕정주의 영향이 플레이어 국경으로 유입 | 0.381 (low) | 상승 | 플레이어 국경 | 없음 | 접경 contact 0.700; source support 0.850; destination support 0.026; 실제 diffusion event 2건 | noAction | `event:1:2`, `event:1:3` |
| 3 | 외국 이념 압력 | 상인공화국의 공화주의 영향이 플레이어 항구로 유입 | 0.336 (low) | 상승 | 플레이어 항구 | 없음 | 정보 contact 0.600; source support 0.900; destination support 0.080; 실제 diffusion event 2건 | noAction | `event:1:6`, `event:1:8` |
| 4 | 재정 | 플레이어 왕국의 재정 압박 | 0.293 (low) | 상승 | 국가 단위 | 없음 | 국고 `-35`; 일일 deficit `5` | noAction | `event:1:0` |

실제 전체 event ID는 harness 출력에서 확인할 수 있으며, 모든 agenda의 `causeEventIds`는 입력한 10개 event의 부분집합이다.

## 압력 제거 counterexample

다음만 바꿔 같은 selector를 다시 실행했다.

- 국고 `100`, 일일 지출 `0`
- 항구 상인연합 grievance/organization/influence/resources를 `0.1`로 낮춤
- 외국 inbound edge 3개를 disabled overlay로 닫음

결과: agenda `0개`.

이 결과는 agenda가 완료 flag로 사라진 것이 아니라, underlying state/contact/evidence 조건이 사라져 selector가 더 이상 candidate를 만들지 않은 것이다.

## 관찰

- faction 압력이 가장 높은 항목으로 정렬되고, 외국 영향은 실제 접촉 지역별로 분리되어 나타난다.
- foreign agenda는 현재 directed edge와 실제 diffusion evidence가 동시에 있어야 한다. topology에 edge가 있기만 한 경우에는 생성되지 않는다.
- event 방향이 입력되므로 현재 inspection에서는 fiscal/faction/foreign trend가 `상승`이다. recent event를 주지 않으면 faction/fiscal trend는 `unknown`이며, foreign agenda는 evidence 부족으로 생성되지 않는다.
- 제목은 ScenarioDefinition의 실제 Country/Region/Faction/Ideology 이름에서 조립한다. LLM, 자유문장 생성, 군사·전쟁 사실 발명은 없다.
- 현재 실제 개입 writer는 정책 action뿐이며 fiscal/foreign 항목은 `noAction`으로 표시된다. 미래 category를 미리 약속하지 않았다.

## 남은 위험

- faction agenda의 관련 지역은 현재 T016 observation 범위 전체를 나타낸다. 지역별 정치 책임을 더 좁히는 것은 T016B/T017 이후의 별도 모델링이 필요하다.
- foreign agenda는 bounded recent event window에 의존한다. window가 지나치게 짧으면 현재 route가 살아 있어도 agenda가 사라질 수 있다. EventStore/replay가 이를 제공하는 T024에서 호출 경계를 고정해야 한다.
- fiscal detector의 reference/weight는 bounded read-model normalization일 뿐 balance 확정값이 아니다.
- 최대 4개 cap 때문에 낮은 우선순위 candidate가 숨겨질 수 있다. ranking/cognitive-load playtest에서 다시 검증한다.

## 결론

현재 T016A는 raw state를 현재 문제 목록으로 읽는 데 충분한 구조를 갖췄다. agenda가 위기·반란·내전·승패를 만들거나 고정 story chain을 진행하지 않으므로 T016B의 개입 용량 설계로 확장할 수 있다. T017 Instability는 별도 task로 남겨 둔다.
