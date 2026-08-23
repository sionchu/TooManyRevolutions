# T019 Diplomacy / Foreign State Baseline Check

상태: **COMPLETE / PASS**  
검사일: 2026-08-22

## 검사 범위

- 기존 `Country`를 foreign actor로 사용하고, player가 아닌 Country를 stable
  `CountryId` 순서로 평가한다.
- 실제 Country state, current Government, derived territorial projection,
  `deriveCountryContacts()` runtime edge, active Conflict만으로 pure observation을
  만든다.
- 월별 checkpoint에서 `CLOSE_BORDER`, `REOPEN_BORDER`, `WAIT` 중 하나만 제안하고,
  공통 `ActionProposal` → `ActionRecord` → `diplomacy` phase 경로로 처리한다.
- actor가 소유한 directed `border` edge만 닫거나 다시 열며 reverse edge, static
  topology, LandHex controller, Region projection은 변경하지 않는다.

## Headless inspection

실행:

```text
pnpm run inspect:t019
```

결과:

```text
T019 Foreign State Baseline Inspection
Scenario: contact-fixture
Foreign countries: contact.absolute-monarchy, contact.merchant-republic
Cadence: monthly
Cases: stable WAIT, weak CLOSE_BORDER, recovered REOPEN_BORDER, foreign-to-foreign
actor→target closed: YES
reverse edge changed: NO
static topology changed: NO
ActionProposal → heuristic ActionRecord → diplomacy resolution: PASS
Foreign-to-foreign action: PASS
Stable ordering: PASS
T020 ideology motive used: NO
foreign faction support mutation: NO
territorial mutation: NO
terminal behavior: PASS
all checks PASS
```

## 확인된 경계

- `WAIT`는 accepted action log만 남기고 event/state mutation을 만들지 않는다.
- 외교 폐쇄는 `foreignPolicyBorderClosure`와 `blockedByCountryId`를 기록하고,
  해당 actor만 reopen할 수 있다.
- T019는 ideology threat, sanctions/trade effects, faction funding/propaganda,
  war/occupation, Government/PolicyState mutation을 구현하지 않는다.

다음 작업은 T020 Foreign Ideological Threat이다.
