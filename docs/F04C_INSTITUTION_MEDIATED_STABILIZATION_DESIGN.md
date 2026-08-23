# F04C — Institution-Mediated Stabilization Design

**프로젝트:** TooManyRevolutions  
**게임명:** 《내 왕국에 혁명이 너무 많다》  
**상태:** DESIGN COMPLETE / production implementation NOT STARTED  
**기준일:** 2026-08-24

## 0. 범위와 결론

F04C는 왕정·공화정·민주정·독재정·공산주의 국가를 직접 보너스가 아니라
제도 조합의 결과로 설명하고, 그 제도 조합이 안정화 수단의 선택 공간과
정치적 비용을 어떻게 바꾸는지 설계한 문서다.

이번 task에서는 다음을 하지 않는다.

- production gameplay code, balance, threshold, RNG 변경
- 새로운 Intervention catalog 또는 Policy catalog 구현
- election, political competition, military faction, war, arcane system 구현
- `Country.regime` 또는 regime-based authoritative state 추가
- F05 pacing/fun 판정
- F02 seed diversity repair
- F04D implementation
- V02 renderer

핵심 boundary는 다음과 같다.

```text
Institutional Rules / Scenario content
        ↓
legal Policy 또는 Intervention
        ↓
concrete authoritative state mutation
        ↓
existing Faction / Region / Country / Conflict consumers
        ↓
T016 / T017 / T018 / T021 / T022
        ↓
derived RegimeClassification와 역사 기록
```

`RegimeClassification`은 이 흐름의 입력이 아니다. 체제명은 제도와 현재
상태를 설명하는 derived label이며, 어떤 체제가 자동으로 안정 보너스를
받거나 승리하도록 만들지 않는다.

F04C의 implementation recommendation은 **F04D가 필요함**이다. 현재
material·faction state를 이용한 최소 안정화는 표현할 수 있지만, 정치적
대표성의 실제 선택 공간과 체제별 차이를 만들려면 최소 한 개의 작은 제도
축과 몇 개의 institution-gated action을 연결해야 한다. F05는 F04D와 그
counterfactual 재검증 이후에만 READY가 될 수 있다.

---

## 1. Repository truth audit

### 1.1 현재 Institutional Rules

현재 source의 canonical rule object는
`WorldState.policies[countryId].institutionalRules`이며 다음 7개 필드를
가진다. 이 목록은 `src/sim/state/policy.ts`의 실제 schema를 기준으로 한다.

| Institution           | 현재 값                                       | authoritative owner              | 현재 consumer                                                             | 아직 표현하지 못하는 의미                                |
| --------------------- | --------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------- |
| `rulerVeto`           | `boolean`                                     | `PolicyState.institutionalRules` | Policy mutation/prerequisite, derived regime label                        | 군주/행정부의 법안 거부권과 상징적 국가원수의 구분, 승계 |
| `legislatureRequired` | `boolean`                                     | 동일                             | Policy mutation/prerequisite, derived regime label                        | 의회 구성, 표결, 교착, 실제 대표성 절차                  |
| `suffrage`            | `none / elite / property / broad / universal` | 동일                             | Policy mutation/prerequisite, derived regime label                        | 선거, 경쟁 정당, 정부 교체, 선거 결과                    |
| `productiveProperty`  | `privateAllowed / mixed / publicOnly`         | 동일                             | Policy mutation/prerequisite, derived regime label                        | 소유권자의 실제 faction, 생산·분배·투자 반응             |
| `landOwnership`       | `feudal / private / communal / state`         | 동일                             | Policy mutation/prerequisite, derived regime label                        | 지주·농민의 권력, 토지세, 토지개혁 집행                  |
| `laborOrganization`   | `illegal / restricted / legal`                | 동일                             | Policy mutation/prerequisite, T016 `ORGANIZE` availability, derived label | 독립조직과 국가통합조직의 구분, 파업·교섭 lifecycle      |
| `pressFreedom`        | `censored / restricted / free`                | 동일                             | Policy mutation/prerequisite, T016 `LOBBY` availability, derived label    | 정보 품질, 지하조직, 언론기관·검열기관의 조직적 반응     |

`PolicyDefinition`은 scenario-owned static data이며 `ruleMutations`, 단순
prerequisite, incompatible policy를 가진다. `runPolicyPhase()`는 선언된
rule만 immutable replacement로 변경하고 `POLICY_ENACTED` 및
`INSTITUTION_RULE_CHANGED`를 기록한다. 현재 정책은 비용·지연·faction 반응을
자체적으로 구현하지 않는다.

현재 `policyFixture` catalog에는 `왕의 거부권`, `왕의 거부권 폐지`,
`귀족 선거권`, `보통선거`, `생산수단 사유 허용`, `생산수단 국유화`가 있다.
이는 T012 contract/inspection content이며, production regime catalog나
완성된 election system이 아니다. `interventionFixture` 역시 `short`, `long`,
`prerequisite` 세 개의 administrative fixture다.

현재 schema에 없는 축은 다음과 같다.

| 설계 축               | 현재 상태                                                        | 판정                 |
| --------------------- | ---------------------------------------------------------------- | -------------------- |
| 국가원수/주권 형태    | `Government`는 id, country, name, authority, formedAtTick만 소유 | GAP                  |
| 행정부 제약           | veto/legislature required로 일부 표현                            | 부분 표현            |
| 정치 참여             | `suffrage`는 존재                                                | 절차 consumer 없음   |
| 정치 경쟁             | 별도 필드 없음                                                   | SMALL EXTENSION 후보 |
| 지방자치              | `PolicyDomain` 이름은 있으나 rule 값 없음                        | GAP                  |
| 군-민 관계            | `Country.militaryPower`만 존재                                   | NEW DOMAIN           |
| 국가통제 노동조직     | `laborOrganization`에 해당 value 없음                            | SMALL EXTENSION 후보 |
| 종교/초자연 주권      | authoritative field 없음                                         | NEW DOMAIN / DEFER   |
| 마법 사용권·길드 특권 | authoritative field 없음                                         | NEW DOMAIN / DEFER   |

### 1.2 현재 stabilization action inventory

현재 production stabilization catalog는 아직 없다. source에서 실제로
검증된 action은 다음 범위다.

| 현재 action/seam         | 실제 state 변화                                           | 실제 downstream consumer                                                 | 현재 한계                                                           |
| ------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `ENACT_POLICY`           | 선언된 institutional rule mutation                        | Policy prerequisite, T016 일부 action availability, derived regime label | 선거·대표성·재산·언론의 정치적 반응 없음                            |
| `START_INTERVENTION`     | commitment 생성, 국고 charge, admin load                  | economy, headroom, completion lifecycle                                  | 현재 category는 `administrative` 하나                               |
| F03A `short`             | Region resource production capacity                       | resources → scarcity → T017                                              | developer `gate1f.validation` content                               |
| F03A `long`              | Faction organization delta                                | T016/T018/T021 readers                                                   | developer content; political history는 fixture에서 미분기           |
| F03A `prerequisite`      | Faction grievance delta                                   | T016/T018 readers                                                        | developer content; active conflict가 history 차이를 흡수            |
| T016 faction actions     | `Faction.currentStrategy`만 변경                          | 현재 observation/기록                                                    | 국가 제도 자체나 faction state를 해결하지 않음                      |
| T018 crisis detector     | current prerequisite를 읽어 active Conflict 생성          | T021 conflict lifecycle                                                  | election, military sympathy, weapons, leadership는 `notImplemented` |
| T021                     | current faction/country strength와 LandHex authority 사용 | territorial projection, Government continuity seam                       | full army/war/military politics 없음                                |
| T022/T023                | existing criteria와 state continuity 평가                 | consolidation/dissolution                                                | institutional quality 자체는 criteria가 아님                        |
| ContactGraph / T019·T020 | directed Region route와 border runtime overlay            | foreign contact, ideological threat read model                           | trade treaty, sanction, foreign war, military support writer 없음   |

따라서 현재 F04C가 다룰 안정화 설계는 `treasury`와
`committedAdministrativeLoad`를 별도 안정 meter로 포장하지 않고, 이미 존재하는
Region·Faction·Country·PolicyState의 concrete writer와 reader를 어떻게 조합할지에
초점을 둔다.

---

## 2. Stabilization design language

다음은 새 authoritative meter 8개가 아니라, action과 causal trace를 설명하기
위한 설계 언어다.

| Channel                                 | 주된 질문                                                            | 사용할 기존 state                                                                     | 대표 action family                                                   | 구조적 부작용                                  |
| --------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------- |
| Material provision                      | 사람들이 먹고 생산할 수 있는가?                                      | Region resource capacity/production, scarcity, unrest, treasury, admin load           | food relief, rationing, public works                                 | 국고·행정 여력, 특정 지역/계층 편중            |
| Representation / incorporation          | 반대세력이 국가를 전복하지 않고 요구를 표현할 수 있는가?             | `suffrage`, `legislatureRequired`, Faction grievance/organization, future competition | amnesty, opposition legalization, suffrage reform                    | 조직의 공개화, 의사결정 지연, 기존 엘리트 반발 |
| Elite bargain                           | 국가의 핵심 재산·관료·군사 집단을 질서 안에 둘 수 있는가?            | Faction interests/influence/grievance, land/property rules, treasury                  | tax concession, privilege, office/patronage                          | 대중 faction의 박탈감, 재정 기반 약화          |
| Organization integration                | 조직을 독립적 적대세력으로 둘 것인가, 합법·국가조직으로 묶을 것인가? | `laborOrganization`, pressFreedom, Faction organization/grievance/resources           | union legalization, state integration, bargaining                    | 조직력 증가, 국가 apparatus의 정치화           |
| Coercion                                | 즉시 행동을 막을 수 있는가?                                          | labor/press rules, stateControl, Faction organization/grievance, admin load           | censorship, assembly ban, martial law                                | grievance 누적, 지하조직, 정보 품질 저하       |
| Administrative penetration              | 법과 배급·치안이 실제 지역에서 작동하는가?                           | Region.stateControl, infrastructure, resource flow, stateCapacity, admin load         | local administration, food distribution, public works                | 집행 비용, 과잉부담, 지역별 편차               |
| Military/security coalition             | 무장기관이 국가의 명령과 국내 질서에 묶여 있는가?                    | 현재는 `Country.militaryPower`만; future military faction                             | pay, patronage, purge, emergency command                             | 군부의 독자 정치, 민간 지출 감소, 쿠데타 위험  |
| Ideological / constitutional legitimacy | 이 질서가 왜 통치할 권리가 있는가?                                   | Country.legitimacy, PolicyState, Government, Faction reaction                         | constitutional settlement, religious sanction, revolutionary mandate | 반대 이념의 정통성 경쟁, 제도 모순             |

한 action은 여러 channel에 걸칠 수 있지만, 한 action이 저렴하게 예방·위기
대응·회복을 모두 해결해서는 안 된다. 효과는 target state와 downstream
consumer를 통해 설명하며, `stability`, `politicalPower`, `reformScore`,
`revolutionChance` 같은 종합 수치를 만들지 않는다.

---

## 3. Regime axes와 derived classification

### 3.1 설계 축

체제 archetype은 다음 독립 축의 조합을 읽기 쉽게 부르는 이름이다.

1. 국가원수/주권 — 세습, 선출, 종교적 승인, 군부 평의회 등
2. 행정부 제약 — veto, 의회 입법 요구, 비상권한
3. 정치 참여 — `suffrage`의 범위
4. 정치 경쟁 — 금지, 제한, 다원 경쟁
5. 생산수단 소유 — 사유, 혼합, 공공
6. 토지 소유 — 봉건, 사유, 공동, 국가
7. 노동조직 — 불법, 제한, 독립 합법, 국가통합
8. 언론 — 검열, 제한, 자유
9. 군-민 관계 — 민간 통제, 이중 권력, 군부 우위
10. 지방자치와 종교·초자연 권위 — 현재 GAP

현재 schema는 2·3·5·6·7·8의 일부만 직접 표현한다. 따라서
`constitutional monarchy`, `military dictatorship`, `one-party state`를
현재 `RegimeClassification` 값으로 완전하게 표현할 수 있다고 주장하지 않는다.

### 3.2 현재 derived label의 한계

현재 `deriveRegimeClassification()`은 public productive property와 state/
communal land를 `communism`, ruler veto 중심 조합을 `monarchy`, veto 폐지와
legislature/broad suffrage 조합을 `democracy`, 그 외 의회 중심 조합을
`republic`로 파생한다. 이는 역사·presentation label로는 유효하지만,
행동 선택·안정 보너스·승패 authority가 아니다.

현재 label은 상징적 군주가 있는 입헌군주정과 의원내각제 공화정을 구분하지
못하고, 개인독재와 군사독재를 구분하지 못하며, 일당제와 다원적 공화정을
구분하지 못한다. 이 차이는 F04C에서 새 label branch로 해결하지 않고, 필요한
institutional axis와 action consumer가 생긴 뒤 재검토한다.

### 3.3 최종 taxonomy는 미확정

다음은 design 비교용 후보이지 최종 enum이나 progression tree가 아니다.

- 강한 왕정/절대왕정
- 입헌군주정
- 민주공화정
- 권위주의 공화정/개인독재
- 군사독재
- 공산주의 일당국가
- 상인·과두 공화정
- 신정 또는 초자연 권위국가

---

## 4. Archetype comparison

### 4.1 강한 왕정 / 절대왕정

**Institutional pattern:** `rulerVeto=true`, `legislatureRequired=false`,
`suffrage=none/elite`, 봉건 또는 사유 토지, 노동 제한/불법, 언론 제한/검열.
상징적 군주권과 실제 행정부를 분리하는 필드는 아직 없다.

**강한 channel**은 신속한 decree, 귀족·지주와의 elite bargain, 왕실이 승인한
조직, 제한적 coercion이다. **약하거나 비싼 channel**은 대중 대표성, 공개적인
노동 교섭, 권력 승계의 평화로운 절차다.

**취약성:** 도시 노동자와 중산층의 요구를 의회로 흡수하지 못할 수 있고,
귀족 면세·특권이 국고 기반을 잠식할 수 있다. 군부·귀족이 왕권의 보호자이자
잠재적 정치 경쟁자가 된다. 승계 위기는 현재 schema에 없으므로 GAP으로 남긴다.

### 4.2 입헌군주정

**Institutional pattern:** 의회 입법 요구, 제한 또는 광범위한 suffrage,
사유/혼합 생산수단, 노동 제한/합법, 제한/자유 언론. 왕의 상징적 지위와
의회의 실제 권한을 함께 표현할 `headOfState` 축은 아직 없다.

**강한 channel**은 제도 안에서의 대표성 확대, 의회 기반 타협, 왕조의 연속성과
점진적 개혁의 결합이다. **취약성**은 왕실·의회 충돌, 보수 엘리트의 거부,
급진 faction의 "아직 충분하지 않다"는 반응, 입법 지연이다. 비상권한이
장기화되면 헌정 자체가 반대 faction의 grievance 원인이 될 수 있다.

현재 이 조합은 derived label상 `republic` 또는 `democracy`가 될 수 있으며,
그것은 분류 한계이지 별도 체제 보너스의 근거가 아니다.

### 4.3 민주공화정

**Institutional pattern:** `rulerVeto=false`, `legislatureRequired=true`,
`suffrage=broad/universal`, `pressFreedom=free`, `laborOrganization=legal`을
대표 조합으로 삼는다. 실제 선거·정당 경쟁은 아직 없다.

**강한 channel**은 반대세력의 합법적 조직, 노동·정당 협상, 보통선거 확대,
지방 대표성의 설계 가능성이다. **취약성**은 양극화, 입법 교착, 공개 조직의
급진화, 물질 위기가 대표성만으로 해결되지 않는다는 점이다. 비상 억압은
단기 치안과 헌정 정당성 사이의 모순을 만든다.

선거 결과에 따른 정부 교체는 `NEW DOMAIN REQUIRED`다. 현재 민주정이
자동으로 안정적이거나 승리에 가까워지지 않는다.

### 4.4 권위주의 공화정 / 개인독재

**Institutional pattern:** 의회가 형식적으로 존재해도 정치 경쟁과 press가
제한되고, executive가 의회와 관료를 우회할 수 있는 조합. 현재 schema에는
개인독재를 명시할 주권·승계 축이 없다.

**강한 channel**은 신속한 행정 명령, elite bargain, censorship/coercion,
집중된 행정이다. **취약성**은 불만이 해결되지 않고 억눌리는 점, 정보가
상층에 왜곡되어 올라오는 점, 보안기관과 엘리트 연합의 독자 정치, 군부
쿠데타 노출이다. 정보 왜곡과 개인 승계는 GAP이다.

### 4.5 군사독재

**Institutional pattern:** emergency command와 군부의 정치적 veto가 실제로
존재하고, 민간 입법·대표성보다 장교단의 명령 체계가 우선하는 조합.
현재 `Country.militaryPower`만으로는 이를 표현할 수 없다.

**강한 channel**은 동원, 치안, emergency command, 군 급료·후원이다.
**취약성**은 군 급료 부담, 장교단 파벌, 민간 정치 배제, 군부가 하나의
정치 faction이 되는 현상, 전쟁 실패에 따른 정통성 붕괴다.

따라서 군사독재에 `militaryPower + bonus`를 부여하지 않는다. officer corps,
military loyalty, war prestige/failure가 필요한 `NEW DOMAIN`으로 기록한다.

### 4.6 공산주의 일당국가

**Institutional pattern:** `productiveProperty=publicOnly`,
`landOwnership=state/communal`을 대표 조합으로 삼되, 일당제·당-국가 조직은
현재 별도 rule이 없다.

**강한 channel**은 국가 배급, 국유 생산의 직접 조정, 국가 노동조직과 행정
동원이다. **취약성**은 공급 실패가 곧 체제의 물질적 정당성 문제로 번지는
점, 관료 faction의 경직, 독립 노동조직의 통로 부족, 조직이 국가를 장악하는
위험이다. 단순히 public ownership을 안정 보너스로 해석하지 않는다.

### 4.7 참고 archetype — 상인·과두 공화정

`legislatureRequired=true`, `suffrage=property/elite`, 사유 생산수단,
자유 또는 제한 언론, 상인·지주 faction의 높은 influence를 조합한 참고
형태다. 무역·국고·엘리트 타협에는 강할 수 있지만, 노동·농민 대표성,
토지개혁, 전시 부담 분배에서 취약할 수 있다. 상인 faction이 source에
없다면 scenario content로만 추가하며 엔진 cardinality를 가정하지 않는다.

### 4.8 No-best-regime check

현재 설계에서 각 archetype은 최소 한 개의 구조적 강점과 한 개의 구조적
취약성을 가진다.

- 민주정은 대표성 경로가 강하지만 교착·양극화·공개 조직의 정치 비용이 있다.
- 강한 왕정은 빠른 decree와 elite bargain이 가능하지만 대중 대표성과 승계
  안정이 약하다.
- 권위주의는 coercion과 빠른 집행이 가능하지만 grievance와 정보 왜곡을
  누적시킨다.
- 군사독재는 동원과 치안이 빠르지만 군부가 별도 정치 actor가 된다.
- 공산주의 일당국가는 배급·조직 통합이 가능하지만 공급 실패와 관료 경직에
  취약하다.
- 입헌군주정은 개혁과 연속성을 결합할 수 있지만 왕실·의회·엘리트의
  삼각 교착이 가능하다.

어떤 archetype도 material, representation, coercion, recovery, war,
consolidation의 모든 차원에서 weakly dominant하도록 설계하지 않는다.

---

## 5. 같은 문제의 institution-mediated 대응

예를 들어 노동자 grievance가 높을 때 action availability는 regime label이
아니라 현재 rule 조합과 실제 faction/Region state에서 파생되어야 한다.

| Rule 조합                                             | 가능한 경로                                                          | 잃는 것/반작용                                   |
| ----------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------ |
| veto 강함 + 노동조직 제한 + 언론 검열                 | food relief, 왕실/지주와의 bargain, 제한적 임금·노동 양보, 조직 억압 | 노동자 공개 대표성 부족, 지하조직·grievance 누적 |
| 의회 입법 + 노동조직 제한/합법 + 언론 제한            | 노동법, 의회 타협, amnesty, union legalization                       | 입법 지연, 귀족·상인 faction의 비용 부담         |
| 의회 입법 + 보통선거 + 노동조직 합법 + 자유 언론      | union bargaining, social legislation, opposition legalization        | 조직력 증가, 의회 교착, 보수 faction 반발        |
| 생산수단 public + 토지 state/communal + 노동조직 제한 | 배급, state labor integration, 행정 동원                             | 공급 실패의 직접 타격, 독립 노동 통로 폐쇄       |
| 군부 emergency command + 민간 대표성 제한             | military pay, coercion, requisition, martial law                     | 군부 정치화, 국고·민간 생산 부담, 쿠데타 위험    |

이 표는 `if regime === ...` 분기를 제안하는 것이 아니다. 동일한
`Faction.interests`, `PolicyState`, `Region` 조건을 읽어 합법 action과 비용을
파생하는 설계 예시다.

---

## 6. Institution-gated stabilization action matrix

이 표는 production catalog가 아니라 action archetype 설계 목록이다. 수치,
정확한 이름, final catalog 개수는 lock하지 않는다.

분류는 다음을 뜻한다.

- **ALREADY REPRESENTABLE:** 현재 typed state/effect/commitment seam으로
  최소 causal proof가 가능함
- **SMALL EXTENSION:** 기존 state에 작은 prerequisite/effect/consumer 연결이
  필요함
- **NEW DOMAIN REQUIRED:** 현재 authoritative representation 자체가 없음
- **DEFER:** Gate 1F의 핵심 안정화 검증에 필요하지 않음

| Action archetype                   | Phase       | Institution prerequisites / availability                             | Concrete target state                                                   | 완화되는 pressure                    | Cost / counter-reaction                                     | 분류                                     |
| ---------------------------------- | ----------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------- | ---------------------------------------- |
| Food relief                        | 예방 / 위기 | treasury와 admin headroom, 대상 Region의 실제 scarcity               | Region resource capacity/production 또는 resource flow                  | material pressure, scarcity, unrest  | 국고·행정 load, 특정 지역/사업의 기회비용                   | ALREADY REPRESENTABLE                    |
| Rationing / price control          | 예방 / 위기 | 배급을 집행할 stateControl과 admin headroom                          | resource demand/distribution와 scarcity 경로                            | 단기 scarcity 완화                   | 배급 편중, 행정 부담, 공급·시장 반작용은 별도 consumer 필요 | SMALL EXTENSION                          |
| Public works                       | 예방 / 회복 | treasury, admin headroom, 집행 가능한 Region                         | Region infrastructure 또는 stateControl을 기존 writer로 연결            | administrative/material pressure     | 장기 국고·행정 점유, 다른 지역 소외                         | SMALL EXTENSION                          |
| Tax relief / debt moratorium       | 예방 / 위기 | 재정 authority와 대상 faction/Region의 실제 부담                     | Country treasury flow와 faction grievance                               | 즉시 재정·정치 압력                  | 국고 수입 감소, 채권자·상인 faction 반발                    | NEW DOMAIN REQUIRED                      |
| Political amnesty                  | 위기 / 회복 | 대상 faction이 criminalized/억압 상태라는 evidence, 법적 권한        | 대상 Faction grievance; organization은 자동 삭제하지 않음               | 정치적 grievance                     | 보안·엘리트 faction 반발, 공개 조직 증가                    | EXPRESSIBLE WITH SMALL RULE (제한 proxy) |
| Opposition legalization            | 예방 / 위기 | political competition이 제한/금지된 상태, 법률 변경 권한             | future `politicalCompetition`, 대상 faction의 legal action availability | grievance와 비합법 조직 압력         | 공개 조직력 증가, 기존 권력 faction 반발                    | SMALL EXTENSION                          |
| Suffrage expansion                 | 예방        | 현재 suffrage가 더 좁고 법률 변경 권한이 있음                        | `PolicyState.suffrage`, 대상 faction grievance/합법 조직                | representation pressure              | 의사결정 지연, 귀족·지주 grievance, 선거 consumer 필요      | SMALL EXTENSION + election GAP           |
| Local autonomy                     | 예방 / 회복 | 지방 규칙과 대상 Region의 행정 capacity                              | future local-government rule, Region stateControl/행정 비용             | 중심-지역 grievance                  | 수도 통제·세수 분산, 지방 엘리트 강화                       | NEW DOMAIN REQUIRED                      |
| Labor law / union legalization     | 예방 / 위기 | `laborOrganization`이 illegal/restricted이고 실행 authority가 있음   | `laborOrganization`, Faction grievance/organization                     | 노동 grievance를 합법 교섭으로 이동  | 조직력 증가, 생산 중단·사용자 faction 반발                  | SMALL EXTENSION                          |
| State labor integration            | 예방 / 위기 | 국가가 조직을 직접 조정할 administrative capacity                    | `laborOrganization`의 state-controlled value 후보, Faction organization | 동원·행정 통합                       | 독립 노동 통로 폐쇄, 국가조직의 정치화                      | SMALL EXTENSION                          |
| Elite tax / property bargain       | 예방 / 위기 | target Faction의 `land`/`trade`/`taxation` interest와 실제 influence | Faction grievance, treasury, property rule 또는 target Region state     | elite split, 일부 fiscal pressure    | 대중 faction의 상대적 박탈, 세입 감소                       | SMALL EXTENSION                          |
| Censorship                         | 예방 / 위기 | `pressFreedom`이 free/restricted이고 집행 capacity가 있음            | `pressFreedom`, T016 lobby availability, 대상 grievance                 | 공개 선동·정보 확산을 제한           | 정보 품질 저하, 지하조직·grievance 증가                     | ALREADY REPRESENTABLE (최소형)           |
| Assembly / organization ban        | 위기        | `laborOrganization` 또는 정치 경쟁이 제한될 법적 authority           | labor/faction legal action availability와 organization                  | 단기 조직 동원                       | underground organization, grievance, 행정 load              | SMALL EXTENSION                          |
| Martial law                        | 위기        | 명시된 emergency authority와 active crisis evidence                  | stateControl/치안 response inputs                                       | 즉시 치안·조직 억제                  | 국고·군부 부담, 정통성·grievance 악화                       | NEW DOMAIN REQUIRED                      |
| Secret-police expansion            | 위기        | 보안기관이라는 조직적 state가 존재해야 함                            | 정보·체포·지하조직 detection                                            | 조직 활동 억제                       | 정보 왜곡, 보안 faction 권력, grievance                     | NEW DOMAIN REQUIRED / DEFER              |
| Land reform                        | 예방 / 회복 | `landOwnership`이 feudal/private이고 행정 집행 가능                  | `landOwnership`, 대상 Region/faction grievance, stateControl            | 농민·지주 정치 압력                  | 지주 faction 반발, 생산·행정 혼란                           | SMALL EXTENSION                          |
| Nationalization                    | 예방 / 위기 | `productiveProperty=privateAllowed/mixed`, 공공 집행 capacity        | `productiveProperty`, Region resource production/소유 반응              | 일부 노동·재정·소유 갈등             | merchant/owner faction 반발, 공급 실패 위험                 | SMALL EXTENSION                          |
| Property guarantee / privatization | 예방 / 회복 | state/public 소유와 실제 owner faction evidence                      | `productiveProperty`, treasury/investment proxy가 필요할 경우           | owner/merchant grievance             | 노동·국유화 faction 반발, 분배 문제                         | SMALL EXTENSION                          |
| Military pay / officer patronage   | 예방 / 위기 | military actor와 payroll authority                                   | future military loyalty/faction influence                               | coup/war readiness                   | treasury, civilian spending, 군부 독자 권력                 | NEW DOMAIN REQUIRED                      |
| Officer purge / emergency command  | 위기        | military faction, command authority, purge consequence               | future military faction organization/loyalty                            | 단기 coup risk 또는 command conflict | 반란·군부 faction 분열·전쟁 능력 저하                       | NEW DOMAIN REQUIRED / DEFER              |

### 6.1 Action design rule

주요 action은 가능한 한 다음을 함께 선언한다.

- 어떤 existing state 또는 작은 future state를 바꾸는가
- 누구의 pressure가 내려가고 누구의 pressure가 올라가는가
- 국고·행정 여력·시간을 얼마나 점유하는가
- 완화가 prevention, crisis-response, recovery 중 어느 phase에 강한가
- 어떤 downstream consumer가 실제로 읽는가

`isGood`, `isEvil`, `isStable`, `regimeBonus` 같은 tag는 사용하지 않는다.

### 6.2 Preventive / crisis / recovery 경계

- Food relief와 labor law는 대체로 preventive에 강하고, 이미 점령된
  rebellion을 자동으로 제거하지 않는다.
- Amnesty와 opposition legalization은 crisis-response에 의미가 있을 수
  있지만 active Conflict dedup를 직접 삭제하지 않는다.
- Land reform과 public works는 recovery에 영향을 줄 수 있지만,
  `LandHex.controller`를 무료로 복구하지 않는다. physical recovery는
  T021의 기존 strength·adjacency·one-Hex seam을 따른다.
- Martial law는 crisis에서 빠를 수 있으나 representation과 legitimacy의
  비용을 가진다.

하나의 action이 세 phase를 모두 싸게 해결하는 설계는 거부한다.

---

## 7. Property, labor, press와 institutional reaction

### Productive property

- `privateAllowed`는 subsidy, tax, regulation, owner faction bargaining을
  가능하게 하는 출발점이다.
- `mixed`는 국가가 일부 생산을 직접 조정하면서 private owner와 협상해야
  하는 긴장을 만든다.
- `publicOnly`는 배급·국유 생산의 집행 능력을 요구하며, supply failure가
  worker/consumer의 material grievance로 직접 돌아오게 설계한다.

현재 owner/merchant faction의 별도 class는 없으므로, F04D에서는 기존
Faction `interests`와 grievance/influence를 활용할 수 있는 최소 action만
검토하고, 정교한 owner ledger는 만들지 않는다.

### Land ownership

`feudal/private/communal/state`는 regime label 입력으로만 남아서는 안 된다.
향후 land reform은 Region stateControl과 Faction grievance를 함께 읽어
행정 집행과 지주·농민 반작용을 보여줘야 한다. 법적 owner와 physical
controller는 계속 분리한다.

### Labor organization

- `illegal`: 공개 조직·교섭은 막지만 underground grievance가 사라진다는
  뜻이 아니다.
- `restricted`: 국가가 허용한 범위의 교섭과 제한된 조직을 표현한다.
- `legal`: T016 `ORGANIZE`와 공개 bargaining의 기반이 된다.
- 향후 `stateControlled`가 필요하면 기존 enum의 의미를 몰래 바꾸지 않고
  작은 schema extension으로 추가한다.

### Press freedom

현재 `pressFreedom`은 T016 `LOBBY` availability에 이미 연결되어 있다.
향후 free press는 조직·정보 확산을 열고, censored press는 단기 공개 행동을
막는 대신 지하정치와 정보 왜곡의 원인이 되어야 한다. 아직 별도 information
quality 또는 underground organization meter는 만들지 않는다.

---

## 8. Institutional contradiction

모순적인 제도 조합을 모두 invalid state로 막지 않는다. 예를 들어
보통선거와 조직 금지, 자유 언론과 장기 계엄, 국유 생산과 봉건 토지 독점은
유효하지만 불안정한 political condition이 될 수 있다.

후속 consumer는 다음을 해야 한다.

- 대표성은 넓지만 실제 조직은 막혀 있다는 contradiction을 Faction grievance와
  action availability로 드러낸다.
- 자유 언론 아래 censorship를 유지하는 emergency rule은 press faction과
  정통성 반응을 만든다.
- public production과 private/feudal land는 소유권 충돌과 행정 부담을 만든다.

현재 정치 경쟁·정통성 writer가 없으므로 이 반응은 F04C에서 구현하지 않고
GAP으로 남긴다. contradiction을 regime enum의 invalid/valid로 단순 판정하지
않는다.

---

## 9. Six state/action flows

아래는 scripted story node가 아니라, 동일한 state reader가 institution 조합에
따라 합법 action과 반작용을 다르게 만드는 예시다.

### Example 1 — 강한 왕정의 도시 노동 불안

`rulerVeto=true`, 의회 불필요, 노동 제한, 언론 검열, 도시 Region의 scarcity와
노동 faction grievance가 높다.

- 가능: food relief, elite bargain, 제한적 labor concession, censorship,
  emergency coercion
- 어렵거나 부재: broad suffrage, opposition legalization, 공개 union bargaining
- 관찰 경로: relief는 scarcity/T017을 낮추지만 국고와 admin load를 쓰고,
  coercion은 조직을 누를 수 있어도 grievance와 지하조직 위험을 남긴다.

### Example 2 — 입헌군주정의 노동 위기

의회 입법이 필요하고 veto가 제한되며, suffrage가 property/broad이고 노동조직이
restricted다.

- 가능: labor law, amnesty, union legalization, 점진적 suffrage expansion
- 비용: 의회 지연과 귀족·상인 faction의 저항
- 관찰 경로: organization이 공개화되어 T016/T018에서 읽히지만, 공개 조직이
  곧 rebellion을 예약하지는 않는다.

### Example 3 — 민주공화정의 양극화

veto가 없고 의회가 필요하며 universal suffrage, free press, legal labor가
있지만 두 faction의 grievance와 organization이 모두 높다.

- 가능: opposition legalization, bargaining, public works, social legislation
- 비용: 의회 교착, 공개 급진조직, 반대 faction의 선거 동원
- GAP: 실제 선거와 정부 교체는 별도 domain이다.

### Example 4 — 군사독재의 전쟁 공포

현재 schema만으로 군사독재를 authoritative하게 표현할 수 없다는 점을 먼저
기록한다. 향후 military loyalty와 officer faction이 있는 경우에만:

- 가능: military pay, emergency command, conscription, martial law
- 비용: 국고·민간 생산 감소, officer faction의 독자 권력, 전쟁 실패 정통성
- 금지: `militaryPower`에 숨은 bonus를 넣어 군사독재를 자동 우월하게 만들기

### Example 5 — 공산주의 일당국가의 공급 위기

public productive property, state/communal land, 국가 노동조직, 제한 언론을
조합한 참고 상태다. 일당제 자체는 현재 GAP이다.

- 가능: rationing, state labor integration, national allocation
- 비용: supply failure가 체제 전체의 material legitimacy로 번지고,
  독립 노동조직의 대안 통로가 닫힌다.
- 관찰 경로: 실제 resource/scarcity와 Faction grievance를 읽으며,
  공산주의 label이 직접 생산량을 보정하지 않는다.

### Example 6 — 마도사 특권 위기

후속 `arcanePractice=privileged`와 Mage Guild faction이 있는 scenario를
가정한다.

- 가능: 길드 특허 유지, licensing 확대, 마법세, 징집 면제 폐지, 국가 연구소
  통합
- 비용: 생산·국방·행정에 필요한 마법 서비스의 감소, 길드의 조직적 저항,
  비마도 시민의 특권 박탈감
- 관찰 경로: 특권은 lore flag가 아니라 법적 지위·국고·노동·군사 동원
  조건을 바꾼다. 현재 source에는 이 축이 없으므로 implementation은 later다.

---

## 10. Comparative vulnerability matrix

정량 balance가 아닌 구조적 검토다.

| Archetype                | Material crisis                                        | Elite split                                | Mass opposition                                    | War mobilization                    | Long-term institutional risk    |
| ------------------------ | ------------------------------------------------------ | ------------------------------------------ | -------------------------------------------------- | ----------------------------------- | ------------------------------- |
| 강한 왕정                | relief·decree는 빠를 수 있으나 국고·집행 여력에 의존   | 귀족·군부 bargain에 의존, 특권이 재정 잠식 | 대표성 부족으로 공개 통로가 좁음                   | 왕실 명령과 후원으로 빠를 수 있음   | 승계·군부·도시의 누적 배제      |
| 입헌군주정               | 의회 승인과 coalition 때문에 느릴 수 있음              | 왕실·의회·지주 타협이 깨질 수 있음         | 합법 흡수 경로가 있으나 급진파는 불충분하다고 판단 | 의회 동의와 비상권한의 충돌         | 헌정의 예외상태가 상시화        |
| 민주공화정               | 대표성은 물자를 만들지 않으므로 material crisis가 남음 | 공개 coalition과 양극화                    | 조직을 흡수하지만 공개 급진화 가능                 | 동원 승인과 민간 비용 분배가 정치화 | 교착·정당 포획·헌정 신뢰 저하   |
| 권위주의 공화정/개인독재 | 빠른 명령·배급이 가능하나 정보가 왜곡됨                | 소수 elite/security coalition이 핵심       | 억압은 즉시 효과, grievance는 누적                 | 신속한 명령 가능, 군부 독자화 위험  | 승계·정보·보안기관의 국가 포획  |
| 군사독재                 | 동원 우선, 민간 배급·생산과 충돌                       | officer faction이 국가 중심이 됨           | 시민 대표성 부족, repression 반작용                | 명령·징집에 강할 수 있음            | 전쟁 실패·군부 파벌·재정 붕괴   |
| 공산주의 일당국가        | 배급·직접 배분이 강하지만 공급 실패가 치명적           | 관료·당 조직의 내부 faction                | 독립 opposition 통로가 좁고 조직이 국가화됨        | 중앙 동원이 가능하나 공급 부담 큼   | 경직된 관료제·당 조직·정보 은폐 |
| 상인·과두 공화정         | 무역·국고·상인 bargain에 강할 수 있음                  | 상인/지주 coalition의 분열                 | 노동·농민 대표성이 약함                            | 상업 금융과 용병 동원 가능          | 부의 집중과 대중 배제           |

---

## 11. War as Politics — design only

F04C에서는 외부전쟁을 구현하지 않는다. 다만 전쟁이 국내 권력관계를 바꾸는
후속 slot을 다음처럼 고정한다.

| Wartime action            | domestic authoritative consequence 후보                  | political counter-reaction                        | 현재 분류  |
| ------------------------- | -------------------------------------------------------- | ------------------------------------------------- | ---------- |
| Military budget expansion | treasury 감소, future readiness/military capability 입력 | civilian spending·tax burden, officer influence   | NEW DOMAIN |
| Conscription              | future defense manpower, labor/production availability   | worker·농민 grievance, 군부 조직                  | NEW DOMAIN |
| Emergency taxation        | treasury flow와 faction 부담                             | 상인·지주·지역 저항                               | NEW DOMAIN |
| Wartime rationing         | scarcity distribution, admin load                        | 배급 편중, black market/공급 실패                 | SMALL/NEW  |
| Industrial requisition    | production allocation, owner/labor reaction              | owner faction·worker grievance                    | NEW DOMAIN |
| Martial law               | stateControl/치안 response와 political freedom           | grievance, representation contradiction           | NEW DOMAIN |
| Border fortification      | future conflict front/defense input                      | treasury·admin load, 지역 우선순위                | NEW DOMAIN |
| Officer patronage         | military loyalty와 officer influence                     | civilian budget, military faction dominance       | NEW DOMAIN |
| Alliance concession       | diplomacy/contact/foreign guarantee                      | sovereignty·domestic faction 반발                 | DEFER      |
| Propaganda campaign       | information/legitimacy exposure                          | press freedom contradiction, underground politics | DEFER      |

향후 slot의 방향은
`Policy/Intervention → Country/Faction/Region/Conflict state → existing readers`
다. 전쟁 선포는 random event나 regime branch가 아니라 foreign objectives,
diplomatic relations, military balance, territorial interest, domestic
political incentives에서 파생되어야 한다.

현재 `Country.militaryPower`와 T021 derived operational strength는
전쟁의 존재·영토 movement를 위한 baseline일 뿐, military loyalty,
manpower, weapons, logistics, officer faction을 대체하지 않는다. 이들은
W-series 또는 별도 Gate 1F domain decision으로 다룬다.

---

## 12. Fantasy politics recommendation

### Recommended Core Fantasy Axis — Arcane Privilege / Mage Guild

마법을 combat bonus가 아니라 **허가·특허·면세·소유·징집 면제·국가 연구소·
군사 requisition을 둘러싼 제도와 집단**으로 만든다.

이 축이 TMR에 맞는 이유:

- 생산·행정·군사 세 영역에 동시에 걸치지만 하나의 global magic meter가
  필요하지 않다.
- `Faction`의 기존 organization/influence/grievance/resources와 연결할 수
  있는 명확한 집단(Mage Guild / state arcane office)을 제공한다.
- `productiveProperty`, `laborOrganization`, press, taxation, military
  requisition 같은 실제 정치 언어와 결합되어 generic lore를 피한다.
- 마법 사용권을 바꿔도 특정 혁명이나 승리를 예약하지 않고, 후속 T016/T017/
  T018/T021 reader가 current state를 판단할 수 있다.

후속 institutional dimension 후보:

`arcanePractice = banned | licensed | privileged | stateControlled`

이는 F04C에서 추가하지 않는다. 처음에는 scenario/content와 기존 Faction/
Policy/Intervention boundary로 표현 가능성을 검토하고, 실제 authority가
필요해질 때 작은 schema extension으로 결정한다.

### Optional Secondary Axis — Sacred / Supernatural Sovereignty

왕권·의회·종교기관이 초자연적 승인과 재산·과세·승계 정당성을 놓고
충돌하는 축이다. 신정이나 왕정의 자동 안정 보너스가 아니라:

- 누가 신성한 정통성을 해석하는가
- 의회가 종교기관의 재산·법적 특권을 제한할 수 있는가
- 군주가 파문·승인 철회에 어떻게 반응하는가

를 다룬다. 종교 faction, legitimacy writer, property privilege가 필요하므로
Gate 1F에서는 구현하지 않고 secondary candidate로만 둔다.

### Explicitly deferred fantasy elements

- 종족별 보너스/종족 분류를 먼저 만드는 것
- 선택받은 영웅, 예언, 운명의 장
- 마법 학교·던전·몬스터 생태계
- 마법을 단순 군사력 multiplier로 쓰는 것
- 고유명사와 lore encyclopedia를 먼저 확장하는 것
- 용을 독립 combat unit으로 구현하는 것

### Regime interaction examples

| Institutional pattern                       | Mage Guild의 정치화                                                  |
| ------------------------------------------- | -------------------------------------------------------------------- |
| 왕실 veto 강함, 특권 재산, 제한 언론        | 왕실 특허 길드, 면세·징집 면제, 왕실 requisition에 대한 길드 bargain |
| 의회 입법, property 기반 참여               | 의회가 license와 arcane budget을 통제, 왕실 후원과 길드 자율권 충돌  |
| 보통선거, 자유 언론, private/mixed property | 길드 독점 공개 비판, 평등한 license 요구, 비마도 faction 조직화      |
| public property, state labor organization   | arcane facilities 국유화, 마도사 노동의 국가 통합, 관료 faction 경직 |
| military command 우위                       | Arcane Corps를 군부에 편입, 지휘권과 길드 독립성 충돌                |

여기서도 체제명 branch는 쓰지 않는다. 동일한 `arcanePractice`, 소유권,
참여·언론·군사 규칙 조합이 결과를 만든다.

---

## 13. Black comedy tone boundary

블랙코미디는 관료주의와 권력자의 자기합리화에서 나온다.

예시(최종 production copy로 lock하지 않음):

1. 임시 비상계엄령 제17차 연장 — 의회는 임시라는 단어의 법적 의미를 검토 중이다.
2. 국고가 바닥났지만 왕실 마도사 징집 면제는 국가 핵심인력 보호로 분류된다.
3. 위원회가 배급을 감독하기 위해 배급 감독 위원회의 감독 위원회를 설치한다.
4. 수도를 잃은 보고서가 도착하자 정부는 방어선을 행정적으로 단순화했다고 발표한다.
5. 검열국은 언론의 자유를 보호하기 위해 검열 대상 목록을 공개하지 않는다.
6. 장교단 숙청안은 군부의 정치 개입을 막기 위해 군부의 동의를 받아야 한다.
7. 국유화된 공장의 소유권 증서는 국가가 소유한다는 사실을 증명하기 위해 세 번 재발급된다.
8. 길드는 징집 면제를 포기하는 대신 징집 면제를 협상할 독점권을 요구한다.

기근 사망, 학살, 민간인 대량 사망, 국가 붕괴의 human consequence는 농담의
대상이 아니다. 짧고 직접적이며 건조하게 기록한다.

---

## 14. Implementation classification

| Proposed capability                                     | Classification              | 근거                                                                                                                                      |
| ------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| resource-capacity 기반 food relief                      | ALREADY REPRESENTABLE       | F03A completion effect → resources/scarcity → T017 경로가 이미 있음                                                                       |
| targeted faction grievance/organization accommodation   | ALREADY REPRESENTABLE       | typed completion effect와 F04A endogenous reader가 있음                                                                                   |
| rule-gated censorship/organization restriction의 최소형 | ALREADY REPRESENTABLE       | existing rule mutation과 T016 LOBBY/ORGANIZE availability가 있음                                                                          |
| institution prerequisite를 가진 정치 amnesty 최소형     | EXPRESSIBLE WITH SMALL RULE | 역사적 amnesty의 법적 권리 복원을 현재 Faction grievance 하나로 완전히 대체하지 않고, organization 보존 accommodation proxy로 제한해야 함 |
| labor legalization의 downstream bargain                 | SMALL EXTENSION             | 기존 labor value는 있으나 legal organization의 정치적 반작용 consumer가 부족                                                              |
| `politicalCompetition` rule                             | SMALL EXTENSION / F04D ADD  | amnesty·franchise·press·labor와 겹치지 않는 독립 정치조직의 합법적 경쟁 접근성을 명시할 작은 축이 필요                                    |
| state-controlled labor value                            | SMALL EXTENSION             | 기존 `laborOrganization` 의미를 확장하지 않고 새 value로 추가해야 함                                                                      |
| land reform/nationalization의 faction·resource 반작용   | SMALL EXTENSION             | rule은 있으나 owner/land faction과 실행 writer가 부족                                                                                     |
| political amnesty/opposition의 실제 선거 경쟁           | NEW DOMAIN REQUIRED         | election, parties, government turnover authority 없음                                                                                     |
| local autonomy                                          | NEW DOMAIN REQUIRED         | local-government rule와 Region-level political authority 없음                                                                             |
| military pay, officer patronage, officer purge          | NEW DOMAIN REQUIRED         | military faction/loyalty/manpower authority 없음                                                                                          |
| martial law의 full crisis lifecycle                     | NEW DOMAIN REQUIRED         | emergency power, security actor, suppression semantics가 없음                                                                             |
| secret police/information distortion                    | NEW DOMAIN REQUIRED         | security organization과 information quality authority 없음                                                                                |
| Arcane Privilege / Mage Guild                           | NEW DOMAIN REQUIRED         | arcane legal privilege와 관련 faction/content authority 없음                                                                              |
| foreign war, mobilization, requisition, peace           | DEFER                       | W-series 범위; T021 baseline을 full war로 확장하지 않음                                                                                   |
| Sacred/Supernatural Sovereignty                         | DEFER                       | legitimacy/religious institution domain이 F05 필수 아님                                                                                   |

---

## 15. F04 findings에 대한 설계 대응

### WAIT dominance

현재 F04의 WAIT dominance 후보를 문서만으로 해결했다고 주장하지 않는다.
F04D에서는 material relief, representation, labor integration, coercion 중
최소 두 경로가 실제 기존 consumer로 이어지는지 counterfactual을 다시 본다.
action은 비용·행정 load·반작용을 가지므로 WAIT가 모든 차원에서 우월하지
않은지 측정한다.

### Pre-crisis timing cliff

pre-crisis action만 의미 있고 active conflict 뒤에는 아무것도 못 하는 문제는
다음 설계로 완화한다.

- preventive action은 scarcity·grievance·organization을 낮추는 방향
- crisis-response action은 current active conflict의 prerequisite와
  suppression/lifecycle reader를 읽음
- recovery action은 T021의 실제 residual strength와 LandHex seam을 따름

직접 `crisis=false`, `conflict.resolve()`, `victoryProgress +=`를 하지 않는다.

### Crisis-response agency

F04B는 internal rebellion의 현재 faction state 재평가와 제한된 government
recovery를 이미 추가했다. F04C는 그 위에 amnesty, labor bargaining,
coercion 등의 정치적 action slot을 설계하지만, coup·foreign war·군부
response는 미구현 영역으로 남긴다.

### Recovery agency

행정·재정·대표성 action이 recovery의 조건을 도울 수는 있지만, 0 Hex를
무료로 되돌리지 않는다. physical territory는 계속
`WorldState.landHexStates[*].controller`와 `changeLandHexController()`의
권위 아래 있다.

### History diversity

F02의 seed-insensitive fixture history `1/1`은 F04C 설계가 해결한 것으로
재분류하지 않는다. 제도와 action이 더 많은 endogenous state를 읽게 되면
F02/F03 counterfactual을 다시 측정해야 하며, RNG를 임의로 추가하지 않는다.

---

## 16. F04D recommendation

### Required: YES

현재 `InstitutionalRuleState`의 일부 규칙은 label·prerequisite·T016 action
availability에 머물러 있다. F05를 바로 시작하면 체제별 선택 차이를 관찰할
수 없고, F04의 WAIT dominance/weak history finding을 판정할 evidence도
부족하다.

### Smallest recommended implementation slice

1. **작은 missing dimension 하나:**
   `politicalCompetition = banned | restricted | plural` 후보를
   `InstitutionalRuleState`에 추가하되, 실제 policy/action prerequisite와
   T016의 legal political action availability에만 연결한다. regime label이나
   bonus에는 연결하지 않는다.
2. **대표 action 4개:**
   - 기존 F03A material relief를 production-like validation content로 유지
   - 제한된 political amnesty/accommodation: 대상 Faction grievance 완화, organization은 유지
   - opposition legalization: competition과 대상 faction의 합법 action 경로
   - censorship/조직 제한의 최소형: 같은 crisis에 대한 coercive 대안
   - labor legalization/bargaining은 full bargaining consumer가 없어 F04D의
     핵심 action에서 `USEFUL BUT DEFER`로 둔다
3. 모든 action은 기존 ActionRecord → commitment/effect → downstream reader
   seam을 사용하고, 비용·행정 load·duration은 content가 소유한다.
4. 같은 decision-boundary snapshot에서 WAIT와 위 action을 비교해
   authoritative state, prerequisite margin, eligibility window, active
   conflict response, resource trade-off를 재측정한다.

이 subset은 선거·정부 교체·군부·전쟁·마법을 구현하지 않는다. F04D 이후에도
election, military faction, local autonomy는 `NEW DOMAIN REQUIRED`로 남을 수
있다.

### F05 readiness

현재: **NOT READY**  
F04D 이후 조건부: **READY AFTER F04D AND COUNTERFACTUAL RECHECK**

F04D가 끝났다고 자동 PASS하지 않는다. 최소 두 개 action에서 concrete
non-cost state와 기존 downstream response가 관찰되고, WAIT 또는 한 action이
모든 meaningful dimension에서 지배하지 않는지 확인해야 한다.

---

## 17. Scope and verification

### Scope

- gameplay code changed: **NO**
- balance/threshold/effect magnitude changed: **NO**
- regime bonus/authoritative regime label added: **NO**
- new RNG/AI/planner added: **NO**
- war implementation started: **NO**
- fantasy implementation started: **NO**
- F04D started: **NO**
- F05 started: **NO**
- V02 started: **NO**
- new ADR: **NO** — 이번 문서는 설계 recommendation이며 irreversible
  architecture decision은 F04D implementation review에서 별도로 기록한다.

### External grounding

이번 문서는 repository의 GDD/ARCHITECTURE와 현재 source schema를 우선하고,
식량 배급·공공사업·사면·선거권·검열·계엄·토지개혁·국유화·군 급료 같은
역사적으로 반복된 정치수단을 archetype 언어로 사용했다. 상세한 사례·반례와
source ledger는 `docs/F04C_R_POLITICAL_HISTORICAL_REFERENCE_GROUNDING.md`에
기록한다. 특정 역사 사건이나 체제의 결과를 scripted history로 복제하지
않는다.

### Verification expectation

문서-only task이므로 F04C 자체에는 새 unit test나 inspection command가 없다.
변경 후 repository formatting과 기존 test/typecheck/build를 실행한다. 실제
action consumer와 authority를 바꾸는 것은 F04D의 verification 범위다.

---

## 18. Final design decision

- **Regime label describes the system; institutions cause the gameplay.**
- 안정화는 material, representation, elite bargain, organization,
  coercion, administration, military/security, ideological legitimacy의
  여러 경로로 분해해 설계한다.
- 어떤 체제도 자동 best가 아니며, 모든 action은 승자·패자·행정/재정 비용을
  가진다.
- 현재 구현으로 표현 가능한 material/faction 경로를 먼저 활용하고,
  F04C-R은 `politicalCompetition = banned | restricted | plural`을 F04D의
  좁은 ADD 후보로 권고한다. 이는 민주주의·정통성·선거 결과가 아니다.
- 역사적 political amnesty는 full legal restoration이 아니라 F04D에서
  organization을 보존하는 제한된 accommodation proxy로 시작하며, full
  transitional justice는 별도 domain으로 defer한다.
- 군부·전쟁·arcane privilege는 별도 domain으로 정직하게 분리한다.
- 핵심 판타지 축은 **Arcane Privilege / Mage Guild**, secondary candidate는
  **Sacred / Supernatural Sovereignty**이며 둘 다 이번 task에서 구현하지
  않는다.
- 다음 최소 task는 F04D narrow institution-action implementation이며,
  F05와 V02는 그 결과 확인 전까지 시작하지 않는다.
