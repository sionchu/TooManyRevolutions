# T020 Foreign Ideological Threat Check

상태: COMPLETE / PASS (2026-08-22)

이 문서는 T020 headless inspection의 현재 계약과 관찰 결과를 요약한다. 수치는
최종 balance가 아니라 `src/sim/systems/foreignIdeologicalThreat.ts`의 파생 판정
baseline이다.

## Causal model

```text
live directed foreign ContactEdge
  + support gradient / effective strength / actual channel
  + aligned domestic faction grievance + faction organization
    + local ideology radicalism + local ideology organization
  + current state vulnerability as amplifier
  -> route evidence -> sourceCountryId + ideologyId aggregate
```

T015의 `max(0, sourceSupport - destinationSupport)` 의미를 유지한다. disabled 또는
effective-zero edge는 exposure가 아니다. T020은 ideology, faction dimension,
Country, Government, Region, LandHex를 쓰지 않는다.

## Inspection cases

| Case | 입력 | 결과 |
|---|---|---|
| A | 높은 외국 support, contact 없음 | Threat: NO |
| B | live contact, 국내 faction/radicalism/organization 부족 | Threat: NO |
| C | 국내 정치 동원만 있고 foreign route 없음 | Foreign threat: NO; domestic risk는 별도 가능 |
| D | merchant republic → player port border + 국내 공화파 동원 | Threat: YES; route evidence 보존 |
| E | regime/government label만 변경 | Threat before/after: SAME |
| F | T019 outgoing `CLOSE_BORDER` | incoming threat 완화: NO |
| G | T020 incoming restriction | foreign → player border route만 disabled; reverse/비관련 route 보존 |
| H | border 차단 후 information/trade만 남음 | Threat: YES; border response: NO; Decision: WAIT |

## Locked boundaries

- `ForeignStateObservation.ideologicalThreats`는 pure derived snapshot이다.
- `WorldState.foreignIdeologicalThreat`, `Country.ideologicalThreat`,
  `foreignSupport`, `ideologyPower`, enemy list는 없다.
- T019 outgoing semantics는 유지된다. T020 incoming response는
  `RESTRICT_INCOMING_BORDER` / `RESTORE_INCOMING_BORDER`로 명시한다.
- restriction threshold와 restore threshold는 분리하며, restore는 hypothetical
  reopen 결과를 현재 state에서 재계산한다. cooldown/RNG/hidden clock은 없다.
- T020은 foreign support transfer, propaganda, censorship, sanctions, trade economy,
  migration/refugee resolution, military/war/occupation, coup/rebellion, UI/rendering을
  구현하지 않는다.

## Reproduction

```text
pnpm run inspect:t020
```

검증 대상은 `src/sim/systems/foreignIdeologicalThreat.test.ts`와
`src/sim/inspection/t020ForeignIdeologicalThreatInspection.test.ts`이다.
