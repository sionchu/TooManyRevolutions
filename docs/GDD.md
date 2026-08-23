# Fantasy State Simulator — Game Design Document

**Status:** New project / greenfield  
**Platform:** Web-first, responsive desktop/tablet/mobile  
**Genre:** Fast systemic political simulation / fantasy state sandbox / grand-strategy-lite  
**Primary inspiration for pacing:** Plague Inc., Rebel Inc.  
**Primary differentiation:** Political rules, factions, foreign states and AI-assisted actors adapt to the player's institutional changes; regime change is history, not game over.

---

# 1. Product Vision
## Working Title

**《내 왕국에 혁명이 너무 많다》**

Project Codename: `TooManyRevolutions`

## 1.1 One-line pitch

> 붕괴 직전의 판타지 국가를 맡아 법과 제도를 바꾸고 시간을 돌린다. 시민·세력·외국은 그 변화에 적응하고 정치사상은 국경을 넘어 퍼진다. 국가가 사라지기 전에 작동 가능한 새로운 질서를 정착시키면 승리한다.

## 1.2 Player fantasy

플레이어가 느껴야 하는 감정:

- "내가 이 규칙을 바꿨다."
- "세상이 바로 반응했다."
- "좋은 효과만 생기지 않는다."
- "저 현상은 왜 생겼지?"
- "외국까지 반응한다고?"
- "정권은 바뀌었지만 내 국가는 계속된다."
- "다른 방식으로 한 판 더 해보고 싶다."

## 1.3 The player is the state

플레이어는 왕, 대통령, 장군, 혁명가 개인이 아니다.

플레이어는 **국가라는 역사적 연속성**을 플레이한다.

따라서 다음은 게임 진행 사건이다:
- 왕의 사망,
- 선거 패배,
- 혁명,
- 쿠데타,
- 왕정 폐지,
- 공화정 수립,
- 공산주의 정권 성립,
- 독재정 수립,
- 민주화,
- 내전에서 특정 정부의 패배.

국가가 독립된 정치 공동체로 존속하는 한 플레이는 계속된다.

---


# GDD Korean Terminology & UX Patch

> Apply after Gate 0.
> This patch does not change the simulation architecture.
> It tightens Korean product language and player-facing terminology.

## Where to apply

Add the following section to `docs/GDD.md`, preferably after **Product Vision** or **Design Pillars**.

---

# Korean Product Language Standard

## 1. 기본 원칙

이 게임은 정치·경제·사회 제도를 추상적인 버프 묶음으로 표현하지 않는다.

플레이어가 접하는 명칭은 가능한 한 실제 역사·정치·경제에서 통용되는 용어를 그대로 사용한다.

예:

- 왕정
- 절대왕정
- 입헌군주정
- 공화정
- 상인공화정
- 민주주의
- 독재정
- 군사독재
- 공산주의
- 사회주의
- 자본주의
- 봉건제
- 신정
- 혁명
- 반혁명
- 쿠데타
- 내전

판타지 세계의 고유 제도는 실제 용어 위에 판타지 특성을 덧붙인다.

예:

- 마탑 과두정
- 드워프 길드 공화국
- 불사왕 절대왕정
- 드루이드 공동체
- 네크로맨서 노동국가

## 2. 큰 개념과 세부 규칙을 분리한다

`공산주의`를 `계획경제`로 대체하지 않는다.

공산주의 국가 안에서도 다음 규칙은 서로 독립적으로 달라질 수 있다.

- 생산수단 소유
- 토지 소유
- 가격 결정
- 생산계획
- 노동 이동
- 정당 구조
- 선거
- 지방자치
- 종교
- 언론
- 복지

마찬가지로 민주주의, 왕정, 독재정 등도 단일 보너스가 아니라 실제 제도의 조합으로 구현한다.

## 3. 플레이어는 이념을 선택하는 것이 아니라 제도를 만든다

가능하면 다음과 같은 단일 버튼을 핵심 플레이로 사용하지 않는다.

`[민주주의로 전환]`

대신 실제 제도 변경을 플레이하게 한다.

예:

- 왕의 거부권 폐지
- 보통선거 도입
- 정기선거 도입
- 의회 입법권 확대

그 결과 게임이 현재 국가를 민주정으로 분류할 수 있다.

동일하게:

- 대규모 국유화
- 사유 생산수단 제한
- 계급 특권 폐지
- 노동자 조직 권력 확대

등의 실제 규칙 조합이 공산주의 체제로 이어질 수 있다.

체제 명칭은 결과를 설명하는 역사적 분류이며, 단순한 테크트리 보너스 이름이 아니다.

## 4. 정치사상 전염 UI 용어

정치 전염 시스템에서 플레이어에게 최소한 다음 개념이 구분되어야 한다.

### 지지

얼마나 많은 사람이 해당 정치사상이나 운동을 받아들이는가.

### 급진

현재 질서를 깨는 행동까지 감수할 의향이 얼마나 강한가.

### 조직

실제로 집회, 파업, 선거운동, 쿠데타, 반란, 혁명 등을 실행할 조직·지도력·자원·네트워크가 얼마나 존재하는가.

따라서:

- 지지가 높아도 조직이 낮으면 대중적 의견에 머물 수 있다.
- 지지가 낮아도 급진과 조직이 높으면 위험한 소수 운동이 될 수 있다.

## 5. 국가 핵심 지표의 한국어 고정명

초기 기본 플레이어-facing 명칭은 다음을 우선한다.

- `treasury` -> **국고**
- `legitimacy` -> **정통성**
- `stateCapacity` -> **국가역량**
- `production` -> **생산**
- `militaryPower` -> **군사력**
- `instability` -> **불안**
- `stateContinuity` -> **국가 존속**

변경하려면 `docs/DECISIONS.md`에 이유를 기록한다.

## 6. 승리/패배 문구

### 승리 개념

**새로운 질서의 정착**

의미:

> 국가가 사라지기 전에 플레이어가 만든 정치·경제·사회 질서가 실제로 작동하는 상태를 만들고 일정 기간 유지한다.

승리는 특정 이념 100%가 아니다.

### 패배 개념

**국가 소멸**

다음과 같은 상태를 의미한다.

- 완전 병합
- 회복 불가능한 영구 분열
- 독립된 중앙국가 기능의 소멸
- 실질적 주권의 완전 상실

정권교체, 혁명, 쿠데타, 왕조 멸망 자체는 패배가 아니다.

## 7. 플레이어-facing 문장 스타일

좋은 예:

> 북부 광산에서 공산주의 조직이 빠르게 늘고 있습니다.

> 상인공화국과의 교역을 통해 공화주의 신문이 항구에 유입됐습니다.

> 귀족 세력이 토지개혁에 반발해 군부와 접촉하고 있습니다.

> 국고는 회복됐지만 식량 배급이 줄어 수도 불안이 커졌습니다.

피해야 할 예:

> 복합적인 사회적 요인으로 정치적 긴장이 증가했습니다.

> 다양한 이해관계자들이 제도 변화에 반응하고 있습니다.

> 외부 영향으로 사회적 역학이 변화했습니다.

핵심 원칙:

> **무슨 일이 일어났는지, 누가 무엇을 했는지, 왜 그랬는지를 구체적으로 쓴다.**

## 8. WHY? 인과 설명 스타일

`WHY?`는 AI가 나중에 그럴듯한 이유를 쓰는 기능이 아니다.

실제 Event Graph를 한국어로 표현한다.

예:

**북부 광산 총파업**

`토지 국유화`
→ `광산 귀족의 수익권 상실`
→ `귀족의 임금 지급 중단`
→ `광부 임금 체불`
→ `공산주의 노동조합 조직력 증가`
→ `외국 공산국가의 자금 지원`
→ `총파업`

가능하면 추상어보다 실제 사건과 행위자를 표시한다.

## 9. AI 대사 최소화

AI가 생성한 장문 대사는 게임의 핵심 전달수단이 아니다.

필요하면 짧게 쓴다.

예:

상인:
> "공식 가격으론 팔수록 손해입니다."

광부:
> "저쪽 나라 광산은 귀족 것이 아니라던데."

관료:
> "법은 오늘 바뀌었는데 장부는 아직 작년 기준입니다."

이후의 실제 행동은 Simulation에 반영되어야 한다.

## 10. 플레이 감정 목표

플레이어가 반복적으로 느껴야 하는 것:

- "내가 바꾸니까 바로 움직이네."
- "좋아진 줄 알았는데 다른 데서 터졌다."
- "왜 저쪽에서 이 사상이 퍼지지?"
- "외국이 자기 나라 정치 때문에 나한테 개입하는구나."
- "혁명에서 졌는데 게임이 안 끝나네."
- "이번엔 다른 국가를 만들어보고 싶다."

---

# Post-T017A Product Direction

이 절은 기존의 institution-first, emergent-history, 국가 연속성 계약을
재정의하지 않는다. 최근 합의된 product/content 방향과 아직 결정하지 않은
범위를 한 곳에 보존한다.

## Regime classification status

`RegimeClassification`은 계속 institutional rules에서 파생되는
player-facing / historical classification이다. authoritative `Country.regime`을
추가하지 않으며, regime/government transition은 같은 `CountryId`를 유지한다.
왕정 붕괴, 혁명, 쿠데타, 선거 패배, 정부 교체는 국가 소멸이 아닌 한
terminal defeat가 아니다. 정치체제는 progression node나 tech/focus-tree
unlock가 아니다.

Player-facing regime taxonomy의 최종 항목 수는 아직 **LOCK되지 않았다**.
후보는 봉건 왕정, 절대왕정, 입헌군주정, 상인공화정, 민주공화정, 독재정,
공산주의 국가, 신정, 군사독재, 일당독재 등을 포함할 수 있지만, 이 목록은
non-exhaustive이며 실제 institutional rule 조합에서 의미 있게 파생되어야
한다. 이 방향은 새 enum이나 regime mechanic을 지금 추가한다는 뜻이 아니다.

## Historical intervention content direction

`Policy`는 선거권, 왕의 거부권, 언론/검열, 토지 소유, 생산수단 소유,
노동조직 권리, 지방자치처럼 institutional rule을 변경한다.
`Intervention`은 현재 국가가 실제 문제에 대응하기 위해 수행하는
bounded action/program이다. 기존 계약의 국고, administrative headroom,
실제 prerequisite, authoritative day tick 기반 implementation time 제약을
그대로 사용하며, `stateCapacity`를 소비성 mana로 만들지 않는다. 모든
Policy를 Intervention으로 바꾸지 않는다.

향후 production Intervention content는 사회불안, 혁명, 경제위기, 군부 위협,
정치적 반발에 대응했던 역사적 조치를 연구해 일반화한 archetype에서 출발한다.
식량 배급·보조, 가격 통제, 공공사업, 세금 조정, 토지개혁, 부채 조정,
노동법·사회보험, 사면·선거권·지방자치 확대, 검열·집회 금지·계엄령,
비밀경찰·파업 진압·정치조직 금지, 국유화·민영화, 군 급료·군부 회유,
장교단 숙청, 행정부 개편·국가 선전 등은 후보 archetype의 예시일 뿐이다.
정확한 production catalog와 개수는 아직 LOCK하지 않으며 지금 구현하지 않는다.

**Historical inspiration supplies state-changing actions, not predetermined history.**

정책이나 개입은 실제 institutional/economic/faction state를 바꿀 뿐, 특정
날짜의 쿠데타·혁명·전쟁을 예약하지 않는다. 후속 detector가 당시
WorldState와 prerequisite를 읽어 사건을 감지한다.

## F04C Institution-mediated stabilization direction

안정화는 하나의 `stability` 보너스나 체제별 modifier가 아니다. 물자 공급,
대표성·정치적 편입, 엘리트 타협, 조직 통합, 강제, 행정 침투,
군사·안보 연합, 이념·헌정 정통성은 서로 다른 정치적 경로다. 각 경로는
현재 `InstitutionalRuleState`, `Faction`, `Region`, `Country`, 국고,
행정 여력, 실제 intervention prerequisite와 implementation time을 통해
선택 가능해져야 한다.

`RegimeClassification`은 이 제도 조합을 설명하는 derived historical label이며
authoritative gameplay state나 직접 보너스가 아니다. 최종 regime taxonomy는
LOCK하지 않는다. 같은 문제도 ruler veto, legislature, suffrage,
productive/land ownership, labor organization, press freedom과 향후
political competition의 조합에 따라 서로 다른 대응·비용·반작용을 갖는다.

정치적 안정화는 누군가의 부담과 권력을 재분배한다. 보통선거·계엄·국유화·
노동조직 합법화·식량 배급은 도덕적 정답이 아니라 실제 state와 faction을
변경하는 action이다. 전쟁과 판타지 요소도 각각 국내 권력관계와 법적 특권을
바꾸는 제도로 설계하며, 이 방향의 상세 matrix는
`docs/F04C_INSTITUTION_MEDIATED_STABILIZATION_DESIGN.md`에 둔다.

F04C는 design-only slice다. 선거, 군부 faction, 전쟁, arcane privilege,
renderer는 아직 구현하지 않는다.

## F04D Narrow institution-action slice

F04D는 `InstitutionalRuleState`에 좁은 법적 정치조직 접근성인
`politicalCompetition = banned | restricted | plural`을 추가한다. 이 규칙은
민주주의·정통성·선거·의회·정부 교체 점수가 아니다. `plural`은 기존 faction
pressure의 `BARGAIN` 경로를 열지만 press freedom이 여는 `LOBBY`, labor law가
여는 `ORGANIZE`와 서로 대체되지 않는다.

검증 시나리오의 최소 대응은 material relief, 제한된 political
accommodation, opposition legalization, coercive restriction 네 가지다. 모두
기존 Intervention의 국고 비용, 행정 부하, 구현 기간, prerequisite, completion
effect를 사용한다. 제도 변경은 authoritative PolicyState에 기록되고 기존
Faction·resource·crisis·conflict·consolidation consumer가 다음 cadence에서 읽는다.
행동 이름이 사건이나 결과를 직접 예약하지 않는다.

정치적 타협은 grievance를 낮추되 organization을 지우지 않는다. 야권 합법화는
정치 경쟁을 plural로 만들지만 경쟁 엘리트의 grievance를 높일 수 있다. 강제
제한은 press와 competition을 좁히고 단기 organization을 줄이지만 faction을
삭제하지 않으며 grievance 반작용과 F04A의 재형성 가능성을 보존한다. 동일
starting state의 rule/response branch가 다른 위기·영토 history를 만들 수 있어야
한다. 상세 구현과 반사실 결과는
`docs/F04D_INSTITUTION_ACTION_IMPLEMENTATION.md`가 소유한다.

선거·정당·의석·선거를 통한 정부 교체, full labor bargaining, transitional
justice, 군부 faction, 전쟁 정치, 지방자치, arcane privilege, F05 pacing/fun,
V02 renderer는 이 slice 밖이다.

## No political progression tree and no moral outcome tags

핵심 정치 시스템은 `Constitution I -> Constitution II -> Democracy` 같은
Civ/HOI-style focus·tech·upgrade tree가 아니다. historical focus가 미래
사건을 예약하거나, 특정 ideology가 최종 upgrade가 되거나, policy/reform
point가 다음 정치 node를 unlock하는 구조를 사용하지 않는다. 플레이어의
선택 공간은 다음의 조합에서 나온다.

`Institutional Rules + Current Intervention Capabilities + Actual WorldState`

향후 UI가 카드나 분류를 사용하더라도 authoritative progression tree가
되어서는 안 된다.

Production Policy/Intervention에는 `good`, `bad`, `progress`, `evil` 같은
도덕적 정답 tag나 미리 정해진 결과 보너스를 부여하지 않는다. 보통선거,
계엄, 국유화, 민영화 등은 현재 국가의 제도·세력·물질 조건에 따라 서로 다른
대가와 결과를 낼 수 있어야 한다. simulation은 실제 consequence를 계산하고,
표준 역사·정치 용어를 완곡한 generic 표현으로 대체하지 않는다.

## Product tone

내부 tone shorthand는 **정치는 냉소적으로, 비극은 건조하게.** 이다.
관료주의, 권력자의 자기합리화, 책임 회피, 군부의 정치 개입, 선전과 검열의
모순, 임시 조치의 영구화, 위원회 중복, 정책의 예상 밖 부작용은 건조한
black comedy의 대상이 될 수 있다. 구체적인 humor copy 전체는 아직
production에 저장하지 않는다.

반대로 대규모 기근, 민간인 사망, 학살, 광범위한 전쟁 피해, 국가 붕괴에
따른 인도적 상황처럼 실제 심각한 human consequence가 발생한 경우에는
짧고 구체적이며 건조하고 희화화하지 않는 문체를 사용한다. 웃음의 대상인
정치적 자기합리화와 비극의 대상인 사람들의 피해를 구분한다.

## Scenario cardinality and content freeze

Scenario country count is content, not an engine invariant. 현재 GDD의
first-build 국가·Region 수는 playable content target이며 최종 국가 수를
LOCK한 것이 아니다. 유효한 `ScenarioDefinition`은 `1 Country = N Regions`,
`1 Region = N LandHexes`를 가질 수 있어야 한다. 국가·지역·LandHex·연결망과
관련 faction/ideology/economy reference를 늘리는 일은 scenario/content
추가로 처리하며, runtime country spawning, DLC/mod SDK, procedural world
generator, generic plugin/hot-loading framework를 지금 만들지 않는다.

content freeze 전에는 playtest 결과에 따라 국가 구성을 조정할 수 있다.
freeze 또는 release-candidate 이후 Country/Region/LandHex나 major
Intervention content를 추가하면 기존 QC를 그대로 재사용하지 않고 relevant
regression, multi-seed, pacing, visual review를 다시 수행한다. Gate 1F/1V
결과에 따라 실제 국가 수와 content 구성을 조정할 수 있다.



# 2. Design Pillars

## Pillar A — Fast systemic feedback

게임은 빠르게 읽혀야 한다.

플레이어는 장문의 보고서를 읽기 전에 지도와 세계에서 변화가 보이는 것을 우선한다.

핵심 루프:

`OBSERVE -> INTERVENE -> ACCELERATE -> NOTICE -> PAUSE -> UNDERSTAND -> INTERVENE`

## Pillar B — Institutions are rules, not bonuses

왕정, 공화정, 민주주의, 독재정, 공산주의, 자본주의, 봉건제 등은 "+10%" 카드가 아니다.

제도는 실제 게임 규칙을 바꾼다.

예:
- 누가 법을 통과시킬 수 있는가?
- 누가 재산을 소유하는가?
- 누가 투표하는가?
- 누가 생산을 지시하는가?
- 누가 조세를 걷는가?
- 어느 조직이 합법인가?
- 정보가 얼마나 자유롭게 퍼지는가?
- 지방은 얼마나 자율적인가?

## Pillar C — Politics spreads through contact

정치사상은 국가 내부와 국가 사이에서 퍼진다.

정치 전염은 단순 보너스가 아니라:
- 무역,
- 접경,
- 난민,
- 전쟁,
- 신문/정보,
- 상인,
- 노동조직,
- 종교망,
- 외국의 성공/실패,
- 외국의 직접 지원

등의 경로를 가진다.

## Pillar D — AI changes behavior

AI는 대사를 많이 만들기 위해 쓰지 않는다.

AI가 필요한 이유:
- 정치세력이 이해관계에 따라 전략을 선택한다.
- 외국이 자기 국내정치와 국제이익을 같이 고려한다.
- 일부 행위자가 새로운 제도에 적응하거나 허점을 이용한다.

결과 숫자는 Simulation Core가 결정한다.

## Pillar E — The world is the report

줄, 파업, 닫힌 상점, 군대, 난민, 가격표, 깃발, 집회, 창고, 마차, 항구 활동 등이 그래프 역할을 한다.

숫자는 보조 정보다.

## Pillar F — Failure becomes history

좋지 않은 결과도 재미있는 이야기로 이어져야 한다.

정권을 잃는 것은 곧 패배가 아니다.

국가 자체가 사라질 때만 terminal defeat다.

---

## Core Player Goal

**왕국을 살려서 혁명의 시대를 끝내라.**

The player's immediate actions may involve policy, finance, diplomacy, military action, compromise, repression, or waiting.

Policies are tools, not the objective.

Long-term victory:
- the player's state survives,
- political disorder across the relevant game space is sufficiently stabilized,
- a functioning new order remains established for the required period.

## Pacing Philosophy

The game should feel:

**빠르게 관찰하고, 중요한 순간에는 멈춰서 결정하는 게임.**

Typical rhythm:

관찰
→ 시간 가속
→ 이상징후 발견
→ 감속/정지
→ 개입
→ 다시 시간 가속
→ 2차 결과 발생

## Emergent History Principle

플레이어의 선택은 다음 사건을 고르는 것이 아니라 세계의 상태를 바꾼다.

**Player choices change state, not story nodes.**

사건은 미리 예약된 시나리오 노드가 아니라 현재 WorldState에서 조건이 충족될 때 발생한다.

**Events are detected, not scheduled.**

예:

BAD:
- 보통선거 도입
- 6개월 뒤 귀족 쿠데타 이벤트 발생

GOOD:
- 보통선거 도입
- 귀족의 정치 영향력 변화
- 귀족 불만 증가
- 군부와 관계
- 외국 지원
- 국가 통제력
- 조직력

이 상태들의 조합이 실제 쿠데타 가능성을 만든다.

게임은 `chapter`, `storyProgress`, `revolutionPhase` 같은 서사 진행 변수를 핵심 시뮬레이션 상태로 사용하지 않는다.

고정되어도 되는 것:
- 시작 상황
- 세계의 규칙
- 승패 조건

고정되면 안 되는 것:
- 중간 역사
- 특정 정책 이후 발생할 사건
- 혁명/쿠데타/전쟁의 발생 순서
- 특정 체제로의 강제 진행

정책은 사건을 예약하지 않는다.
정책은 실제 제도와 세계 상태를 변경한다.
후속 시스템이 그 상태를 읽어 사건을 만든다.

# 3. Win / Loss / Endings

## 3.1 Victory — Order Consolidation

승리는 특정 이념의 세계정복이 아니다.

승리 정의:

> **붕괴 위기의 국가에 작동 가능한 새로운 질서를 정착시킨다.**

기본 승리 조건은 시나리오 설정으로 조정 가능하지만 다음을 기반으로 한다.

- requiredStableRegions 이상 안정 지역 확보
- capitalControlled = true
- stateCapacity >= minimum
- treasury/solvency가 terminal 상태가 아님
- activeTerminalCivilWar = false
- coreTerritoryControl >= minimum
- 위 조건을 consolidationPeriod 동안 유지

예시 대회용:
- 5개 핵심 지역 중 4개 안정
- 수도 통제
- 국가역량 40 이상
- 붕괴상태 없음
- 18개월 유지

## 3.2 Defeat — State Dissolution

다음 중 시나리오가 terminal로 정의한 조건:

- 모든 핵심 영토의 완전 병합
- 수도와 주권 기관 상실 후 회복 가능성 소멸
- 중앙국가가 여러 세력으로 영구 분열
- 외교/군사/재정/입법 주권을 모두 상실한 완전 종속
- 국가 존속도(`stateContinuity`)가 시나리오가 정의한 국가 존속 임계값 이하로 내려간 경우

## 3.3 Not automatic defeat

- 왕정 붕괴
- 혁명 성공
- 쿠데타 성공
- 내각/정당 교체
- 왕조 소멸
- 사회주의/공산주의/민주주의/독재정 등 다른 체제 전환
- 일시적 수도 상실
- 내전 패배 후 새로운 중앙정부 출범

## 3.4 End-of-run history

승패 뒤에는 "점수"보다 플레이어가 만든 역사를 보여준다.

예:
- 최종 체제
- 주요 제도
- 안정/번영/국가역량
- 정치 참여
- 불평등/분배
- 군사 영향력
- 국제 이념 영향력
- 가장 큰 혁명/전쟁/개혁
- 플레이어가 만든 주요 causal chain

정답 엔딩은 없다.

---

# 4. World Structure

## 4.1 Scope

첫 vertical slice:
- 플레이어 국가 1
- 외국 2~3
- 플레이어 국가 핵심 지역 5
- 외국은 단순화된 지역/상태를 가짐
- 3~5 주요 정치세력
- 4~6 정치사상/체제 경향

장기 확장:
- 국가 5~12
- 국가별 지역
- 종족/종교/경제 차이
- 여러 시나리오

## 4.2 Fantasy baseline

세계 대부분은 왕정/봉건질서에서 시작해도 되지만 균일하지 않다.

예시:
- 플레이어: 흔들리는 봉건 왕정
- 서쪽: 상인공화정
- 북쪽: 절대왕정
- 동쪽: 제국
- 남쪽: 신정국

판타지는 단순 스킨이 아니다.

예:
- 장수 엘프의 세대 구조
- 드워프 길드 공동소유 관습
- 마법 특허/마탑 독점
- 언데드 노동
- 드래곤의 극단적 자산 집중
- 종교/마법 네트워크가 정보 확산 경로가 됨


## Territorial Map Model

이 게임의 메인맵은 단순한 Province/Zone 지도도 아니고,
모든 게임 데이터를 작은 HEX마다 계산하는 워게임 지도도 아니다.

맵은 두 개의 공간 단위를 사용한다.

### Region

Region은 정치·경제·사회 시뮬레이션의 기본 집계 단위다.

Region은 현실의 주/도/지방과 비슷한 크기의 영토다.

예:

- 왕도권
- 서부 해안주
- 동부 철산주
- 남부 곡창주
- 북부 변경주

Region에는 다음과 같은 상태가 존재한다.

- 인구
- 생산
- 자원
- 희소성
- 정부 통제
- 정치사상 지지 / 급진 / 조직
- 주요 Faction
- 불안
- 지역 특성

Region의 이름을 단순히 `광산`, `항구`, `농촌`으로 짓지 않는다.

광산, 항구, 도시, 농장, 요새 등은 Region 내부의 특성 또는 POI다.

`Region.stateControl`은 행정력·치안·국가기관의 실질적 침투 정도를 뜻하며,
Land Hex의 물리적 territorial controller와 다른 개념이다.

한 국가가 Region의 모든 Land Hex를 물리적으로 통제하고 있어도
해당 Region의 `stateControl`은 낮을 수 있다.

예를 들어 변경 지역은 영토상 왕국의 지배 아래 있으면서도
세금 징수, 치안, 행정 집행이 제대로 이루어지지 않을 수 있다.

### Land Hex

하나의 Region은 여러 개의 Land Hex로 구성된다.

Land Hex는 다음을 표현하기 위한 공간 단위다.

- 군대 이동
- 실제 영토 점령
- 전선 이동
- 혁명군 확산
- 도로 / 강 / 산악
- 요새
- 주요 POI
- 실제 controller

정치·경제의 모든 수치를 Land Hex마다 독립적으로 계산하지 않는다.

Region은 simulation aggregate이고,
Land Hex는 territorial substrate다.

### Core rule

**정치는 Region에서 계산되고, 영토는 Land Hex 위에서 움직인다.**

또는:

**사상은 Region 사이를 퍼지고, 전선은 Hex 위를 움직인다.**

## Three Forms of Invasion

이 게임에서 국경을 넘어오는 것은 군대만이 아니다.

### 1. 군사적 침범

외국군 또는 내전 세력이 Land Hex를 실제로 점령한다.

결과:
- controller 변경
- 전선 형성
- 생산/도로/거점 통제 변화

### 2. 정치적 침범

무역·정보·이주·국경 접촉을 통해 정치사상이 들어온다.

영토 controller는 변하지 않지만 Region의 정치 상태가 변한다.

플레이어는:

"땅은 내 영토인데 정치적으로 저쪽 영향권이 되고 있다."

는 상황을 경험할 수 있다.

### 3. 혁명에 의한 침범

정치사상이 실제 `Faction` 또는 authoritative 조직 상태와 결합해
봉기 조건을 충족하고 실제 봉기가 시작되면 Faction 또는 혁명정부가
Land Hex를 장악하기 시작한다. 이념의 `organization` 수치만으로
조직이나 점령을 만들어내지 않는다.

정치적 영향이 실제 영토 변화로 전환된다.

### Visual principle

**사상은 색과 문양으로 퍼지고,
조직은 지도 위의 말이 되며,
혁명은 영토가 된다.**

### Spatial presentation contract

이 원칙은 시뮬레이션의 공간 단위와 시각 표현 단위를 일치시키되, 서로
다른 사실을 하나의 색으로 합치지 않기 위한 계약이다.

- 정치사상 영향은 `Region` 단위의 연속적인 overlay, 색, 문양, 또는 밀도로
  표현한다. `Region`의 이념 상태를 `LandHex`마다 복사해 정치 확산 셀처럼
  표현하지 않는다.
- 정치조직 marker는 실제 `Faction` 또는 향후 authoritative organization
  state가 존재할 때만 표시한다. `IdeologyState.organization`만으로 존재하지
  않는 조직이나 token을 만들어내지 않는다.
- 실제 무장 충돌과 영토 변화는 `LandHex.controller`의 이산적인 변화로
  표현한다. 전선은 인접한 LandHex의 서로 다른 controller에서 파생되는
  presentation이며, 별도의 권위 있는 영토 상태가 아니다. 정확한 전선
  알고리즘은 T021에서 결정한다.
- 쿠데타가 정부를 바꾸더라도 영토 controller가 변하지 않을 수 있다. 이때
  지도 전체를 새 regime 색으로 칠하거나 자동으로 영토 전환을 만들지 않는다.
  같은 `CountryId`의 역사적 연속성과 당시의 물리적 통제를 계속 표현한다.
- 접촉 → 영향 → 조직 → 봉기/충돌 → 영토 점령의 시각적 escalation은
  정해진 사건 순서를 예약하는 장치가 아니다. 지도는 기록된 WorldState와
  Event history에서 실제 발생한 변화를 표현한다.

이 지도는 전술 RTS가 아니다. 개별 병력의 미세 명령이나 모든 LandHex의
상시 전투를 요구하지 않으며, 플레이어가 영향의 방향·조직의 존재·전선의
이동을 빠르게 읽는 전략적 가독성을 우선한다.

최종 LandHex 밀도는 아직 LOCK하지 않는다. 현재 headless fixture의 7개
Region과 9개 LandHex는 topology와 표현 가능성을 검증하기 위한 값이며 최종
콘텐츠 목표가 아니다. Gate 1V에서 여러 후보 밀도(예: 20/35/50)를 비교해
가독성, 변화 속도, 게임 감각, 시각적 혼잡을 판단한다. 국가 수나 LandHex
수를 늘리는 것이 engine invariant가 되지는 않는다.
---

# 5. Simulation Model

## 5.1 Country parameters

플레이어가 쉽게 읽는 국가 단위 기본값:

- `treasury`
- `legitimacy`
- `stateCapacity`
- `production`
- `militaryPower`
- `instability`
- `stateContinuity`

보조값은 시스템 내부에 더 존재할 수 있지만 HUD에 모두 노출하지 않는다.

## 5.2 Region parameters

- `population`
- `urbanization`
- `accessibility`
- `resources`
- `production`
- `stateControl`
- `infrastructure`
- `scarcity`
- `unrest`

고정 성질 + 동적 상태를 분리한다.

## 5.3 Political tendency

각 지역/국가에서 이념별:

- `support`
- `radicalism`
- `organization`

세 값을 사용한다.

해석:
- support: 얼마나 많은 사람이 받아들이는가
- radicalism: 제도 밖 행동까지 감수하는가
- organization: 실제로 움직일 조직/자원/네트워크가 있는가

높은 지지만으로 혁명은 일어나지 않는다.

## 5.4 Factions

예:
- nobility
- merchants
- workers
- peasants
- military
- clergy
- bureaucrats
- mage guild

Faction에는:
- interests
- resources
- organization
- influence
- grievance
- ideology affinity
- foreign links
- current strategy

가 존재한다.

## 5.5 Policies / institutions

정책은 상태 보너스가 아니라 rule mutation이다.

예:
- 왕의 거부권
- 의회 입법권
- 선거권
- 사유재산
- 토지 소유
- 생산시설 소유
- 가격 통제
- 조세
- 복지
- 노동조직 권리
- 언론/검열
- 지방자치
- 종교
- 군 징집
- 무역


## 5.6 State Intervention Capacity

플레이어의 개입은 하나의 범용 정책 포인트를 소비하는 구조로 만들지 않는다.

핵심 제약은 다음 네 가지다.

1. 국고
2. 행정 여력
3. 정치적 실행 가능성
4. 시간

### 국가역량과 행정 여력

`stateCapacity`는 국가가 행정·치안·조세·동원·개혁 등을 수행할 수 있는
전체적인 국가 수행능력을 나타낸다.

행정 여력은 별도의 영구 능력치라기보다
현재 국가역량 중 다른 정책·사업·위기 대응에 묶이지 않은 가용 부분이다.

개념적으로:

`administrativeHeadroom = available state capacity after active commitments`

예:

국가역량 60

현재 행정 부담:
- 식량 배급 12
- 토지개혁 집행 15
- 전시 동원 18

가용 행정 여력:
15

행정 여력은 시간이 지나면 자동 충전되는 mana가 아니다.

다음과 같은 변화로 확보되거나 감소할 수 있다.

- 국가역량 상승/하락
- 기존 국가사업 종료
- 전쟁/동원 종료
- 신규 개혁 시행
- 대규모 행정사업
- 난민/치안/전시 부담
- 정부 기능 붕괴

### Intervention constraints

개입마다 필요한 제약은 다르다.

예:

군 급료 지급:
- 국고 중심

토지개혁:
- 국고
- 행정 여력
- 정치 조건
- 집행 시간

왕의 거부권 폐지:
- 정치 조건 중심
- 행정 여력 일부
- 국고 비용은 작을 수 있음

전시 동원:
- 국고
- 행정 여력
- 군사/정치 조건

모든 행동에 같은 비용 구조를 강제하지 않는다.

### Political feasibility

정치적 개혁은 범용 `politicalPower` 포인트를 소비해서 실행하지 않는다.

실행 가능성과 저항은 실제 상태에서 나온다.

예:

- Government 구조
- 의회 규칙
- Faction influence
- Faction grievance
- 정통성
- 국가역량
- 현재 제도
- 군부 관계
- 외국 지원

### Implementation time

법이나 정책의 채택과 실제 사회적 집행은 같은 순간일 필요가 없다.

예:

법 통과
→ 행정 준비
→ 지역 집행
→ 실제 효과 발생

따라서 "법은 바뀌었지만 현실은 아직 바뀌지 않은" 상태가 존재할 수 있다.

### No universal policy currency

다음과 같은 핵심 자원을 기본 구조로 추가하지 않는다.

- policy points
- political mana
- reform points
- ideology research points

플레이어의 행동 가능성은 실제 국가의 돈, 역량, 정치조건과 시간에서 나온다.
---

# 6. Ideology Diffusion

## 6.1 Core concept

정치사상은 "국가 하나가 보유하는 속성"이 아니라 네트워크를 따라 퍼지는 동적 상태다.

개념적 압력:

`sourceAttractiveness × contact × recipientSusceptibility × networkStrength × modifiers`

정확한 공식은 구현/밸런스 문서에서 정의한다.

## 6.2 Contact channels

- land border
- trade
- port traffic
- migration
- refugees
- press
- literacy/education
- religious network
- guild network
- military occupation
- alliance
- covert support
- visible success of a foreign regime

## 6.3 Regime performance matters

외국 체제가 성공하면 해당 사상의 매력이 상승할 수 있다.

예:
- 상인공화정이 번영 -> 인접 상인/도시민 공화주의 수용성 증가
- 공산혁명 후 식량/토지 문제가 개선 -> 인접 노동자/농민 수용성 증가
- 공산주의 국가가 붕괴 -> 주변 수용성 하락
- 민주공화국이 반복적으로 내전에 빠짐 -> 주변에서 민주주의 매력 약화 가능
- 절대왕정이 전쟁에서 연승 -> 귀족/군부가 왕정 권위에 매력을 느낄 수 있음

게임이 특정 이념의 결론을 미리 작성하지 않는다.

---

# 7. Rebellion / Coup / Revolution

## 7.1 No single rebellion meter

반란은 단순 불만 100으로 시작하지 않는다.

조건 조합:
- grievance
- political support
- radicalism
- organization
- resources
- weapons
- leadership
- military sympathy
- geographic concentration
- foreign support
- state weakness

## 7.2 Different actors, different forms

귀족:
- palace coup
- pretender support
- separatism

군부:
- coup
- emergency government

노동자:
- strike
- factory occupation
- revolution

농민:
- tax refusal
- land seizure
- rural revolt

상인:
- capital flight
- tax evasion
- embargo pressure
- mercenary finance

종교:
- mass movement
- holy revolt
- legitimacy challenge

## 7.3 Civil war

Civil war changes territorial control.

플레이어는 "정부"가 아니라 국가이므로 승리 세력이 새 중앙정부를 만들면 플레이는 이어질 수 있다.

내전 자체는:
- 생산 손실
- 인구 피해
- 국가역량 손실
- 외국 개입 기회
- 부채
- 영토 상실
- 정치적 기억

을 남긴다.

---

# 8. Foreign States / Diplomacy

## 8.1 Foreign state motivations

외국은 단순 관계 점수만 보지 않는다.

고려:
- trade dependence
- border threat
- military balance
- ideological threat
- domestic political exposure
- alliances
- opportunity
- territorial claims
- prestige
- debt/finance
- refugee flow

## 8.2 Foreign actions

- trade agreement
- tariff/sanction
- border closure
- propaganda
- faction funding
- rebel support
- diplomatic guarantee
- mobilization
- intervention
- limited war
- annexation demand
- peace offer

LLM을 사용할 경우 위 행동 중 하나를 schema로 선택한다.
실제 효과는 simulation이 계산한다.

## 8.3 Ideological threat example

인접 공산주의 국가의 성공 때문에 자국 광산지역 공산주의 조직력이 올라간 왕정은:
- 무역은 유지하면서 신문을 금지하거나,
- 국경을 닫거나,
- 왕당파를 지원하거나,
- 플레이어에게 개입할 수 있다.

이 모순된 이해관계가 외교의 재미다.

---

# 9. War

전쟁은 별도 RTS가 아니다.

전쟁은 정치/경제/외교 시스템의 결과다.

플레이어 결정:
- mobilize
- defend
- offensive
- fortify
- conscription level
- negotiate
- seek ally
- prioritize front

결과는:
- military power
- logistics
- production
- terrain
- state capacity
- morale/cohesion
- foreign aid
- unrest

등으로 계산한다.

전쟁이 국내에 되먹임되어야 한다.

예:
징병 -> 농업 노동 감소 -> 식량 부족 -> 도시 불안 -> 정치 급진화.

---

# 10. Economy and Resources

경제는 Victoria 수준의 수백 품목을 목표로 하지 않는다.

첫 버전은 압축한다.

권장 자원:
- Food
- Material
- Mana/Magic Resource
- Treasury/Currency

필요 시:
- Arms
- Medicine

중요한 것은 품목 수가 아니라 인과관계다.

예:
가격 통제 -> 공식가격 하락 -> 생산자의 수익성 악화 -> 공급 감소 -> 암시장 -> 불안/단속 비용.

AI가 이 결과를 쓰지 않는다.
시뮬레이션이 계산하고 AI 행위자가 대응 행동을 선택한다.

---

# 11. AI Actor Model

## 11.1 Cognitive LOD

모든 시민에게 LLM을 쓰지 않는다.

### Background population
- aggregate/statistical simulation
- utility rules
- no LLM

### Active factions
- heuristic baseline
- selected decision checkpoints can use LLM

### Foreign states
- strategic decision checkpoints
- optional LLM

### Focus citizens
- vertical slice에서 소수만 선택적으로 사용 가능
- 이름은 필수 아님
- 상태/직업/가족/이해관계 중심

## 11.2 AI action examples

Faction:
- PROTEST
- STRIKE
- BARGAIN
- LOBBY
- HOARD
- FUND_MOVEMENT
- SUPPORT_COUP
- COMPROMISE
- DEFECT
- WAIT

Foreign state:
- TRADE
- SANCTION
- PROPAGANDA
- SUPPORT_FACTION
- CLOSE_BORDER
- MOBILIZE
- INTERVENE
- OFFER_PEACE
- WAIT

## 11.3 AI failure

AI timeout/error:
- log error
- deterministic heuristic fallback
- simulation continues
- no blocked game tick

---

# 12. Pacing

## 12.1 Time controls

- Pause
- 1x
- 3x or equivalent
- 8x or equivalent

Exact multipliers can be tuned.

## 12.2 Desired temporal feedback

- UI acknowledgment: immediate
- world feedback: <2 sec where possible
- first-order result: 3–8 sec
- actor adaptation: 5–15 sec
- second-order effect: 15–30 sec
- major new pressure: ~30–60 sec

Critical events may auto-slow or auto-pause sparingly.

## 12.3 What pauses the player

Auto-pause candidates:
- coup begins
- revolution begins
- war declaration
- capital threatened
- state dissolution imminent
- victory consolidation reached

Do not pause for routine micro-events.

## 12.4 Spatial readability pacing target

Gate 1V의 지도 검증은 지리적 정밀도보다 플레이어가 변화를 읽고 판단할 수
있는 속도를 우선한다. 현재 product target은 한 run을 약 15–25분에 관찰하고,
대략 20–40년의 시뮬레이션 역사를 경험하는 것이다. 이 목표는 LandHex
개수나 특정 지도 밀도를 고정하지 않는다. 밀도와 지형 표현은 이 속도에서
정치 영향, 조직, 영토 통제, 전선 변화를 읽을 수 있는지를 기준으로
조정한다.

---

# 13. Core UX
## 13.0 Player Experience Flow

최종 게임의 기본 사용자 흐름은 다음과 같다.

`Title`
→ `Scenario Opening`
→ `Main Strategy Map`
→ `Critical Event Presentation`
→ `Main Strategy Map`
→ `Ending`
→ `History Report`

### Title

최소 기능:

- 새 게임
- 이어하기
- 시나리오 선택
- 설정

타이틀 화면 자체가 핵심 gameplay system은 아니다.


### Scenario Opening

오프닝은 미래 사건을 예고하는 scripted story가 아니다.

오직 다음을 설명한다.

- 현재 국가 상황
- 주요 제도
- 주요 국내 세력
- 주변 국가
- 현재 경제/정치 압력
- 플레이어 목표

오프닝은 특정 혁명, 쿠데타, 전쟁이 반드시 발생한다고 말하지 않는다.

**Authored starting conditions are allowed. Authored outcomes are not.**


### Main Strategy Map

게임 시간의 대부분은 전략 지도에서 진행한다.

플레이어는 지도에서 직접 다음을 관찰한다.

- 국가/영토
- 정치사상 확산
- 정치조직
- 무역/정보/이주
- 군사 이동
- 혁명/내전
- 외국 개입
- 전선 변화

보고서는 보조 정보다.


### Critical Event Presentation

모든 이벤트를 별도 popup/image로 보여주지 않는다.

일반 변화는 전략 지도에서 표현한다.

별도의 사건 presentation은 역사적 전환점 수준의 사건에 제한한다.

예:

- 혁명 시작
- 쿠데타
- 전쟁 선포
- 수도 함락
- 새 중앙정부 수립
- 국가 소멸
- 새로운 질서 정착

Critical Event Presentation은 simulation에서 실제 발생한 사건을 표현하며,
새로운 결과를 결정하는 authored story node가 아니다.


### Ending

Ending은 run의 감정적 마무리를 담당한다.

예:

- 혁명의 시대 종료
- 국가 소멸
- 최종 체제
- 생존 기간
- 주요 역사적 전환점

상세 분석은 History Report에서 제공한다.


### History Report

History Report는 실제 recorded event/action history에서 파생한다.

포함 가능:

- 주요 제도 변화
- 정부 교체
- 혁명 / 쿠데타 / 내전
- 전쟁
- 영토 변화
- 주요 정치사상 변화
- 중요한 causal chain
- 최종 국가/제도 상태

LLM이 실행 후 존재하지 않았던 역사를 창작하지 않는다.

### Procedural Political Press / Gazette

정치신문과 관보는 simulation system이 아니라 recorded history를 읽는
player-facing presentation이다. 기본 production 방향은 다음과 같다.

이전 working name인 `AI Political Press / Gazette`를 기본 product 기능이나
runtime dependency로 LOCK하지 않는다. 기본 명칭과 구현 방향은
**Procedural Political Press / Gazette**, 즉 정치신문/관보 시스템이다.

```text
Recorded Simulation History
→ deterministic PressFacts
→ publication perspective
→ authored templates / grammar
→ deterministic variant selection
→ headline / short article
```

PressFacts와 문장은 실제 `ActionRecord`, `GameEvent`, 그리고 T024 이후의
`EventStore` history에서만 파생한다. 신문은 혁명, 쿠데타, 전쟁, 정책 효과,
피해 수치, actor, 또는 causal relation을 결정하거나 새로 만들지 않는다.
신문 문장 자체는 causal truth가 아니며, 존재하지 않는 사실을 그럴듯하게
보충하지 않는다.

같은 기록된 사건은 왕립 관보, 독립 신문, 혁명 회보처럼 publication
perspective에 따라 다른 표현·강조·제목 framing을 가질 수 있다. 다만 모든
관점은 같은 recorded facts를 공유해야 한다. 같은 `CountryId`가 정부와
제도를 거치는 동안 publication identity/style이 바뀔 수 있지만, publication
change는 Government transition이나 regime authority가 아니다.

기본 runtime은 외부 API, OpenAI 호출, 인터넷, token 비용, local LLM, WebGPU
추론에 의존하지 않는다. authored template/grammar와 seeded deterministic
variant가 primary path이며, 개발 중 AI는 초안 authoring을 도울 수 있을 뿐
human/design review를 거친 static content로만 채택된다. optional future AI
enhancement는 production requirement가 아니다.

문체는 기존 Korean Product Language, exact political terminology,
anti-AI-slop, **정치는 냉소적으로, 비극은 건조하게.** 계약을 따른다. 쿠데타,
혁명, 독재정, 공산주의, 검열, 비밀경찰 같은 정확한 용어를 generic
euphemism으로 바꾸지 않는다. 관료주의와 권력자의 자기합리화는 풍자할 수
있지만, 기근·학살·대규모 사망·광범위한 전쟁 피해 같은 serious-state
consequence는 짧고 구체적이며 희화화하지 않는다.

Routine event는 procedural template을 사용할 수 있고, 혁명 시작·쿠데타·내전·
왕정 붕괴·국가 소멸·새로운 질서 정착 같은 major historical event는 더 많은
검수된 hand-authored variant를 사용할 수 있다. 정확한 `PressFacts` schema,
publication type/name, template·variant 개수, selection algorithm, layout,
storage 방식은 아직 LOCK하지 않는다.

이 variant는 이미 발생한 event를 표현하는 content일 뿐, event 발생 순서나
결과를 예약하는 story node가 아니다.

이 시스템은 T024 EventStore / Snapshot / Replay foundation 이후, Gate 2의
deterministic critical-event/news presentation 기반으로 시작하고, 이후 Gate 2
및 Gate 6에서 polish할 수 있다. 현재 Gate 1과 T018의 요구사항이 아니며 지금
runtime press를 구현하지 않는다.

## 13.1 Primary views

### World View
- countries
- borders
- political pressure
- war
- trade
- ideology diffusion

### Region Focus / Inspector
- capital and selected region
- visible consequences
- factions/crowds/queues/markets/protests
- policy impact

A competition vertical slice may merge these into one compact world if scope demands.

## 13.2 Lenses

First target:
- Political
- Instability
- Trade/Resources
- Foreign Influence

Avoid a dozen lenses.

## 13.3 WHY? — Causal Lens

Player selects an event/state:
"왜 이 지역에서 공산주의 조직력이 급증했지?"

UI traverses actual event graph:

foreign revolution success  
-> cross-border worker contact  
-> local support increased  
-> mine wage shock  
-> faction organization campaign  
-> strike network formed

No AI-generated fake explanation.

## 13.4 Reports

Reports are optional detail.

Bad:
popup -> paragraph -> button -> paragraph.

Good:
world changes -> player notices -> clicks only if curious.

---

# 14. Responsive Web UX

## 14.1 Desktop

Target references:
- 16:9 and common laptop displays

Layout:
- large world
- persistent side inspector
- top status/time controls
- contextual bottom events

## 14.2 Tablet

- world remains dominant
- inspector becomes sheet/drawer
- larger touch targets
- fewer simultaneous metrics

Support portrait and landscape where practical.

## 14.3 Mobile portrait

Do not reproduce desktop layout.

Pattern:
- world occupies upper/main area
- bottom sheet handles region/policy/WHY detail
- one primary action zone
- swipe/drag sheet
- no hover dependency
- minimal always-visible HUD

## 14.4 Mobile landscape

Can approach tablet composition if usable.

## 14.5 CSS/web requirements

- safe-area insets
- dynamic viewport units
- pointer/touch support
- container queries where component-local responsiveness helps
- reduced-motion support
- readable Korean/English text
- accessible focus states
- no body scroll as core control mechanic

---

# 15. Visual Direction — Strategic Map as Miniature World

## 15.1 Goal

"정치 대시보드"보다 먼저 **작은 판타지 국가/도시 모형**으로 읽혀야 한다.

V00의 상세 visual grammar, semantic channel, reference/asset provenance와
acceptance contract는 `docs/VISUAL_BIBLE.md`,
`docs/VISUAL_REFERENCE_CATALOG.md`, `docs/ASSET_SOURCE_CATALOG.md`,
`docs/VISUAL_QA.md`에 둔다. V00에서는 primary asset pack이나 final visual
implementation을 선택·구현하지 않는다.

## 15.2 Camera

- orthographic or near-orthographic
- 30–45° tilt
- limited controlled zoom
- optional small rotation
- clear silhouette and landmark hierarchy

## 15.3 World as graph

Examples:
- hospital/office queue
- shuttered shops
- price boards
- troops at gate
- refugee stream
- protest crowd
- banners changing
- warehouse stock
- market traffic
- official paperwork piles
- barricades
- foreign merchant traffic

## 15.4 Asset strategy

Use one coherent base pack where possible.

Custom signature assets focus on:
- political banners
- seals
- parliament/palace
- market signage
- protest/strike props
- checkpoints
- border markers
- state institutions
- fantasy-specific economic signals

Avoid mixing unrelated visual packs.

The main strategy map remains the primary gameplay surface.

Region focus may provide optional zoom/inspection,
but it does not introduce nested Site gameplay navigation.

---

# 16. Web Technology Policy

## 16.1 Core renderer

Preferred initial stack:
- Three.js
- React Three Fiber
- WebGL

Reason:
- React/TypeScript integration
- browser-native
- fast UI iteration
- stable baseline

## 16.2 WebGPU

WebGPU is a progressive enhancement/experimental path for this project, not a core dependency.

Possible later uses:
- large particle/crowd effects
- advanced post-processing
- compute-heavy visualizations

Fallback must preserve gameplay.

## 16.3 HTML-in-Canvas

Potential signature uses:
- law parchment rendered in world
- magical distortion of real UI
- diegetic newspaper/poster
- shader transitions

Do not use for core input or required game UI until browser support is production-safe.

## 16.4 Asset format

- glTF/GLB
- compressed textures
- mesh/texture optimization
- lazy loading
- reusable instancing

---

# 17. Vertical Slice

## 17.1 Goal

Within 3–5 minutes a new player should understand:

1. the state is in crisis,
2. the player changes an institution,
3. time accelerates,
4. the world visibly adapts,
5. ideology/faction behavior changes,
6. a foreign state reacts,
7. the player can inspect WHY,
8. the run has clear victory/defeat pressure.

## 17.2 Scenario

Player:
- unstable feudal monarchy

Foreign A:
- merchant republic

Foreign B:
- absolute monarchy

Regions:
- 왕도권 — 수도 / 왕궁 / 군영 POI
- 서부 해안주 — 항구 / 상업도시 POI
- 남부 곡창주 — 농업 / 대지주 중심
- 동부 철산주 — 광산 / 광산도시 POI
- 북부 변경주 — 요새 / 국경로 POI

### Authored starting pressures

The vertical slice may start with:

- 취약한 왕실 재정
- 왕도권의 귀족 정치 영향력
- 서부 해안주의 상인 성장
- 상인공화국과 서부 항구 사이의 강한 trade/information contact
- 동부 철산주의 노동자 조직화 가능성
- 북부 절대왕정과 국내 왕당파의 연결 가능성

These conditions are authored.

Their outcomes are not.

Possible runs may produce:

- constitutional reform
- aristocratic backlash
- republican organization
- labor unrest
- coup attempt
- foreign intervention
- no uprising at all

No outcome or ordering is mandatory.

This sequence must emerge from systems as much as possible, not hardcoded prose.

---

# 18. Content Scope for First Build

Implement:
- 3 countries
- 5 player regions
- 4 political tendencies
- 4–5 factions
- 8–12 policies/institutional rules
- 4 resources max initially
- 6–10 foreign/faction actions
- one rebellion/coup route
- one simplified war route
- one win condition
- one terminal defeat route
- event graph
- replay summary

Do not implement yet:
- giant world
- dozens of races
- long dialogue
- free-form diplomacy chat
- detailed battle tactics
- hundreds of commodities
- 50 policy trees
- character biography system
- procedurally generated quests
- multiplayer

---

# 19. Anti-AI-Slop Rules

1. LLM does not decide numeric state.
2. LLM does not invent arbitrary events.
3. Reading generated text is never required to understand core gameplay.
4. AI outputs must end in concrete game actions.
5. Those actions must become visible world changes.
6. Every major outcome must have a causal event path.
7. AI failure cannot stop the simulation.
8. One policy should affect multiple connected systems.
9. Specific political language should not be flattened into vague euphemisms.
10. Player discovery matters more than generated content volume.
11. Art cannot be used to conceal a weak core loop.
12. The game should be fun with AI temporarily replaced by heuristics; AI should make adaptation richer, not make the game exist at all.

---

# 20. Fun Success Criteria

A playtest run succeeds when most testers can answer:

- "무슨 일이 일어나는 게임인지 30초 안에 알았다."
- "내가 한 행동 때문에 세상이 변했다고 느꼈다."
- "예상 못 한 결과가 있었지만 이유를 이해할 수 있었다."
- "시간을 빨리 돌리고 싶을 때와 멈추고 싶을 때가 둘 다 있었다."
- "다른 정책으로 다시 해보고 싶었다."
- "AI가 단순 대사 생성이 아니라 행동에 영향을 준다는 느낌이 있었다."

Target internal scores:
- Immediate Read >= 4/5
- Speed >= 4/5
- Agency >= 4/5
- Surprise >= 4/5
- Causality >= 4/5
- Replay Desire >= 4/5
- Cognitive Load <= acceptable threshold

---

# 21. Production Gates

0. Foundation
1. Headless Simulation
1F. Headless Fun
1V. Visual Simulation Validation
2. Graybox UX
3. AI Agent Proof
4. Map Art / World Signals
5. Responsive / Performance
6. Competition / Release Polish

Every gate must have an explicit acceptance checklist in the backlog/QA docs.
