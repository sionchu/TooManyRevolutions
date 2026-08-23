# T018 Rebellion / Coup Prerequisite Check

**Date:** 2026-08-22  
**Status:** PASS

이 문서는 현재 T018 baseline detector의 headless inspection 결과다. 숫자는
최종 balance가 아니라 named prerequisite baseline이다.

## Scenario

`political-crisis-fixture`는 한 국가의 두 Region으로 구성된다.

- `이념 실험 수도`: central Government의 capital Region
- `이념 실험 공업지대`: 공산주의 affinity를 가진 노동 faction의 regional signal이
  집중될 수 있는 Region
- coup-capable `국가 수비 평의회`
- rebellion-capable `공업 노동자회`
- runtime physical authority: `WorldState.landHexStates[*].controller`

## Inspection table

| Case | Coup | Rebellion | 결과 |
|---|---:|---:|---|
| High unrest only | NO | NO | 불안·국가 instability가 높아도 faction organization이 낮으면 시작하지 않음 |
| Organized military elite | YES | NO | coup capability, grievance, organization, influence, resources, state weakness 통과 |
| Concentrated radical labor movement | NO | YES | 한 Region의 radicalism·ideology organization·unrest와 geographic concentration 통과 |
| High support, no organization | NO | NO | support 1.0이어도 radicalism·local organization·faction organization 부족 |
| Strategy only | NO | NO | `FUND_MOVEMENT`/`ORGANIZE`만으로는 crisis가 되지 않음 |

## Structural checks

- Coup와 rebellion은 별도 typed prerequisite model이다.
- support는 supporting evidence이고 trigger가 아니다.
- `Faction.organization`과 `Region.ideology[*].organization`은 서로 다른 gate다.
- geographic concentration은 Region-level readiness의 population-weighted share로
  derive하며 LandHex에 인구·ideology를 분할하지 않는다.
- state weakness는 legitimacy 약화, stateCapacity 약화, national instability,
  fully controlled Region unrest, LandHex territorial weakness에서 순수 파생한다.
- foreign support, military sympathy, weapons, leadership는 `notImplemented`이며
  fake default 값을 만들지 않는다.
- 같은 active `(country, faction, kind)` Conflict는 다음 날 중복 생성되지 않는다.
- Faction insertion order를 뒤집어도 prerequisite/event ordering이 같다.
- detector는 Region controller를 사용하지 않고 LandHex controller를 변경하지 않는다.
- T018은 Government transition, CountryId 변경, RunOutcome 변경, 군대·전선·점령을
  수행하지 않는다.

## Event / conflict result

Eligible candidates는 기존 `Conflict`에 active `coup` 또는 `rebellion` record로
표현된다. 정치적 영향 지역은 optional `affectedRegionIds`에 담고,
`contestedRegionIds`는 비워 physical conflict resolution과 구분한다.

새 event는 `COUP_ATTEMPT_STARTED` 또는 `REBELLION_STARTED`이며 required gates,
state weakness components, regional evidence, future evidence status를 payload에
담는다. 현재 step에는 과거 EventStore가 없으므로 `causeIds: []`를 사용한다.

## Recommendation

**PASS — T018 prerequisite/detector slice is ready for separate review.**

### SAFE_TO_DEFER

- foreign support, sanctions, and foreign faction funding (T019/T020)
- military sympathy, weapons, leadership, armies, occupation, fronts, and war
  resolution (T021)
- probability/AI behavior and action proposals for crisis escalation
- Government transition success/resolution formula
- rebellion versus revolution escalation/classification
- final threshold calibration and multi-seed fun/pacing review
- persistence/replay EventStore integration (T024)
