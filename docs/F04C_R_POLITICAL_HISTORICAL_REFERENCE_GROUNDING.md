# F04C-R — Political / Historical Reference Grounding

**프로젝트:** TooManyRevolutions  
**게임명:** 《내 왕국에 혁명이 너무 많다》  
**상태:** COMPLETE / F04D scope recommendation  
**조사 기준일:** 2026-08-24  
**작업 유형:** docs / research grounding only

이 문서는 F04C가 설계한 안정화 수단을 실제 정치·역사적 mechanism과
대조한다. 역사 사건을 TMR의 scripted event로 옮기지 않는다. 각 사례에서
추출하는 것은 법적 지위, 조직의 합법성, 행정 집행, 비용 분배, 반작용과 같은
상태 전이뿐이다.

```text
historical case
  → observed institutional mechanism
  → conditions / failure modes
  → trade-off
  → TMR state and consumer mapping
  → F04D counterfactual
```

## Executive Conclusion

- F04C의 핵심 명제는 유지된다. 체제명은 derived description이고, gameplay는
  Institutional Rules, Faction, Region, Country, treasury와 행정 집행이 만든다.
- 다섯 후보 영역 모두에 대해 최소 한 개의 강한 사례와 반례·한계를 확인했다.
  자료는 `source-supported fact`, 해석, TMR inference를 분리한다.
- `politicalCompetition`은 **ADD**를 권고한다. 단, 민주주의·자유주의·정통성
  수치가 아니라 독립 정치조직이 합법적으로 조직되고, 후보·대표를 내고,
  집권 권위에 도전할 수 있는 범위를 나타내는 좁은 제도 축이어야 한다.
- 권고 표현은 `banned | restricted | plural`이다. 이 축은 `suffrage`,
  `pressFreedom`, `laborOrganization`, 선거 결과, 정부 교체를 대체하지 않는다.
- F04D의 최소 action set은 네 가지다.
  1. 기존 material relief
  2. 제한된 political amnesty / accommodation
  3. opposition legalization
  4. coercive restriction의 최소형
- labor bargaining은 역사적으로 중요하지만, 고용주 조직·교섭 절차·파업·중재
  consumer가 현재 없으므로 F04D의 핵심 증명에서 `USEFUL BUT DEFER`로 둔다.
- full elections, party system, transitional justice, underground information,
  military faction, arcane privilege, foreign war는 이번 task에서 구현하지 않고
  NEW DOMAIN 또는 DEFER로 남긴다.
- F05는 아직 READY가 아니다. F04D가 끝난 뒤 동일 checkpoint에서 counterfactual과
  WAIT dominance를 다시 측정해야 한다.

## Research Method / Source Quality Rules

### 자료 계층

1. 법률·의회·정부·국제기구 문서: 법이 무엇을 허용·금지·복원했는지 확인한다.
2. 공식 archive·기관 역사: 제도의 시기와 절차를 확인한다.
3. 학술 연구: 결과, 반작용, 장기 효과를 해석할 때 사용한다.
4. 고품질 종합 자료: 방향 확인에만 사용하고, 핵심 인과 결론의 단독 근거로
   사용하지 않는다.

Wikipedia, SEO 역사 블로그, 무출처 요약, AI-generated summary는 근거로
사용하지 않았다.

### 사실·해석·TMR inference 구분

이 문서의 각 사례는 다음 표기를 따른다.

- **Source-supported fact:** 원자료 또는 연구가 직접 지지하는 좁은 사실.
- **Interpretation:** 연구자가 제시하는 mechanism 해석. 원자료와 구분한다.
- **TMR inference:** 현재 TMR schema와 consumer를 기준으로 한 설계 추론.

법률이 어떤 조직을 금지했다는 사실은 그 법이 안정화를 달성했다는 증거가
아니다. 선거 득표나 조직의 존속을 설명하는 causal claim에는 별도의 연구와
반례가 필요하다.

### 범위와 한계

사례는 서로 다른 시기·정치체제·대륙에서 선택했다. 그러나 역사 연구는
언제나 선택된 제도와 관측 가능한 기록의 한계를 갖는다. 아래에서 근거가
충분하지 않은 부분은 `INSUFFICIENT_REFERENCE_GROUNDING`으로 표시하고,
직관으로 채우지 않는다.

## Existing F04C Claims Being Tested

| F04C claim                                                            | Research result                                                                             | TMR consequence                                                                                |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| material relief와 coercion은 함께 사용될 수 있다                      | 확인. Bismarck 시기 사회보험과 반사회주의법이 병행됨                                        | relief와 coercion을 상호 배타적 체제로 만들지 않는다                                           |
| relief가 조직을 없애는 것은 아니다                                    | 확인. 독일 사회민주운동은 금지와 낮은 초기 급여에도 조직·득표를 유지했다                    | material effect는 grievance/Region pressure와 분리하고 organization을 자동 0으로 만들지 않는다 |
| amnesty와 legalization은 다르다                                       | 확인. 사면은 처벌·권리·기록을 복원할 수 있고, legalization은 조직의 공개 활동 공간을 바꾼다 | 두 action을 하나의 `grievanceDelta`로 합치지 않는다                                            |
| legalization은 opposition을 없애지 않는다                             | 확인. 스페인·폴란드 사례 모두 조직을 합법 정치의 장으로 가져오는 과정이었다                 | organization은 유지 또는 가시화되고, competition 비용이 생길 수 있다                           |
| 노동 통합은 조직 해체와 다르다                                        | 확인. 스웨덴 협약은 강한 노동·고용주 조직을 남긴 채 교섭 절차를 만들었다                    | full bargaining은 별도 consumer가 필요하다                                                     |
| repression은 단기 가시성을 낮출 수 있으나 조직을 영구 삭제하지 않는다 | 확인. 독일·GDR·영국 사례에서 지하조직·재집결이 관찰됨                                       | censorship는 visible organization/communication과 grievance를 분리해서 다룬다                  |
| 정치 경쟁은 민주주의 전체와 같은 개념이 아니다                        | 확인. 권위주의 체제도 제한된 opposition party·선거를 허용할 수 있다                         | 좁은 `politicalCompetition` 축은 가능하지만 선거·정권교체를 포함하지 않는다                    |

## Case Portfolio

| Case                                    | Main mechanisms                                                   | Evidence role                                                        |
| --------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| Bismarck-era Germany, 1878–1890         | coercion + social insurance + legal residual competition          | relief가 repression과 병행되고, 조직이 금지 뒤에도 남는 사례         |
| United States New Deal, 1930s           | relief / public works / administrative allocation                 | material provision이 fiscal·행정 배분과 정치 반응을 함께 만드는 사례 |
| Spain, 1976–1978                        | amnesty + PCE legalization + political opening                    | amnesty와 legalization, franchise·competition의 분리                 |
| South Africa, 1990s                     | conditional amnesty + political unbanning + negotiated transition | amnesty의 조건성·피해자 절차·조직 inclusion의 trade-off              |
| Sweden, 1938 onward                     | employer–worker organization bargaining                           | 조직을 보존하면서 conflict channel을 제도화한 사례                   |
| Britain, long institutional development | representative institutions and staged franchise                  | suffrage와 representation/competition의 역사적 분리                  |
| GDR, late 1980s                         | censorship + underground press + dissident regrouping             | 억압이 visibility와 조직의 생존을 다르게 바꾸는 사례                 |
| Poland, 1989                            | Solidarity legalization + negotiated partial competition          | legalization이 competition과 legitimacy를 동시에 열 수 있는 사례     |

## Material Relief

### Bismarck-era Germany

**Source-supported fact**

독일의 1878년 Anti-Socialist Law는 사회민주주의 단체·회의·신문을 금지했지만,
Reichstag의 사회주의 후보와 의원 활동은 금지하지 않았다. 법 시행 중에도
지하 인쇄·조직망이 유지되었고, GHDI의 편집 요약은 1890년까지 사회주의 후보의
득표가 증가했다고 기록한다【R01】. bpb의 역사 해설은 1883년 질병보험, 1884년
재해보험, 1889년 연금보험이 도입되었지만 초기 급여가 낮고 효과가 느렸으며,
사회민주당 지지가 감소하지 않았다고 설명한다【R02】. Bismarck의 공식 메시지는
억압과 노동자 복지를 병행하려는 의도를 명시했다【R02】.

**Interpretation**

Material provision은 급성 생활압력을 낮추는 별도 channel이지, 이미 존재하는
정치조직을 해체하는 장치가 아니었다. coverage가 제한되고 급여가 낮으면
정통성 효과가 약하거나, repression과 결합된 국가 의도에 대한 불신이 남을 수
있다. 이는 “복지 지출 → 혁명 압력 0”이라는 단순 공식을 지지하지 않는다.

**TMR inference**

현재 TMR에서는 Region resource production capacity → resources → scarcity →
T017 material pressure라는 F03A 경로가 이 mechanism의 작은 proxy다. 효과는
Region별로 집행되고, treasury와 administrative load를 사용하며, Faction
organization을 지우지 않는다. 복지 수급 자격, coverage 불평등, 기대 상승,
보험기금 같은 새 경제 domain은 현재 표현하지 않는다.

**Confidence:** HIGH for parallel coercion/relief and limited initial coverage;
MEDIUM for direct grievance/instability effects.

### New Deal relief and public works

**Source-supported fact**

NBER의 Kantor·Fishback·Wallis 연구는 New Deal relief/public works spending과
장기 정당 지지 이동 사이의 관계를 county 자료로 추정하며, 지출의 효과가
지역 경제 조건과 시기별 행정 통제 방식에 따라 달랐다고 보고한다【R04】.
Wallis·Fishback·Kantor 연구는 1930년대 relief가 연방·주·지방의 행정 상호작용을
통해 배분되었고, 규칙 중심 행정이 지방 재량과 부패 문제를 줄이는 방향으로
작동했다고 분석한다【R05】.

**Interpretation**

Material relief는 단순한 국고 차감이 아니라 “누구에게, 어떤 규칙으로, 어느
지역을 통해 전달되는가”의 행정 문제다. 연구가 지지하는 것은 지출과 정치적
지지·행정 배분의 관계이지, 모든 relief가 불안을 낮춘다는 보편 법칙이 아니다.
coverage·배분·정치적 보상 여부가 효과를 바꾼다.

**TMR inference**

현재 state에서는 Region resource capacity와 scarcity가 가장 작은 faithful
mapping이다. F04D는 국가 전체의 `stability`나 복지 수급 meter를 추가하지
않고, 특정 Region target과 비용·행정 부담을 가진 action을 재검증해야 한다.

### Material relief mechanism extraction

- **Short-term effect:** 대상 지역의 scarcity/material pressure가 낮아질 수
  있다. 즉시가 아니라 implementation/자원 phase를 거칠 수 있다.
- **Medium/long-term effect:** organization은 남을 수 있다. 지속적 재정·행정
  공급이 없으면 효과가 약해지고, coverage 차이가 새로운 grievance가 될 수 있다.
- **Trade-offs:** treasury, committed administrative load, 다른 지역의 배분,
  독립 조직과의 관계.
- **Failure modes:** 낮은 급여, 지연, 편중, 재정 고갈, relief와 coercion의
  동시 사용으로 인한 불신.
- **Existing TMR state:** Region resource production capacity, scarcity,
  unrest, treasury, intervention commitment, administrative load.
- **State TMR currently cannot express:** 수급 자격·coverage, 가격·임금,
  보험기금, 기대 상승을 독립적으로 추적하는 state.
- **F04D implication:** `REQUIRED FOR F04D`; 기존 F03A material path를
  production-like proof로 유지하고, 효과를 faction 삭제나 위기 예약으로
  확장하지 않는다.

## Political Amnesty

### Spain, Amnesty Law 46/1977

**Source-supported fact**

스페인 법률 46/1977은 특정 시기 정치적 의도의 행위, 반란·선동 관련 범죄,
정치적 표현, 일부 노동·노조 관련 위반을 사면 범위에 포함했다. 법은 형사책임
소멸, 수감자 석방, 수배 해제, 공무원·군인의 권리 복원과 노동권 관련 행정
처분의 효력 제거를 규정했다【R06】. 이것은 단순한 “grievance -1”이 아니라
처벌·기록·직업·정치적 권리의 법적 상태를 건드리는 조치였다.

**Interpretation**

사면은 조직을 없애는 것이 아니라 조직 구성원이 다시 활동할 수 있는 조건을
바꿀 수 있다. 그러나 Cambridge의 Aguilar 연구는 스페인 사례가 과거 폭력에
대한 책임·진실·정의와 정치적 이행 사이의 trade-off를 가졌다고 분석한다.
사면이 민주적 이행을 가능하게 한 측면과 면책의 한계가 함께 존재한다【R07】.

### South Africa, conditional amnesty

**Source-supported fact**

1995년 South African Promotion of National Unity and Reconciliation Act는
Truth and Reconciliation Commission과 Amnesty Committee를 만들고, 정치적
목적의 행위에 대해 관련 사실을 전부 공개한 사람에게 사면을 부여하는 절차,
피해자 진술, 배상·회복을 함께 규정했다【R08】. 공식 TRC 자료도 사면·피해자·배상
위원회의 분리를 기록한다【R09】.

**Interpretation**

사면은 unconditional pardon, 조건부 amnesty, 권리 복원, transitional justice를
같은 action으로 취급할 수 없다. 조건을 붙이면 조직·국가·피해자 사이의 절차가
필요하고, 면책의 범위가 넓을수록 단기 정착과 책임·피해자 반발 사이의 trade-off가
커진다.

### TMR mapping

- **Short-term effect:** targeted faction의 grievance 또는 legal status가
  변할 수 있다. 법적 status를 실제로 보존하려면 현재 schema보다 작은 확장이
  필요하다.
- **Organization:** 사면은 organization을 0으로 만들지 않는다. 오히려 공개
  활동 능력이 커질 수 있다.
- **Trade-offs:** 보안·엘리트 faction의 반발, 피해자/경쟁 faction의 grievance,
  사법·행정 처리 비용.
- **Existing TMR state:** Faction.grievance/organization, Institutional Rules,
  treasury/admin load, existing T016/T018 reader.
- **Cannot express now:** 개인별 형사기록, 수감·귀환, 피해자 절차, 조건부 공개,
  transitional justice.
- **F04D implication:** `REQUIRED FOR F04D`인 최소형은 **political
  accommodation**으로 명시한다. 현재 effect는 대상 faction grievance를
  낮추고 organization을 유지하는 제한된 proxy이며, 완전한 법적 사면이라고
  주장하지 않는다. full amnesty는 `NEW DOMAIN_REQUIRED`다.

**Confidence:** HIGH for legal distinction; MEDIUM for a minimal TMR grievance
proxy.

## Opposition Legalization

### Spain, Communist Party legalization

**Source-supported fact**

스페인 BOE에는 1977년 4월 7일자 Partido Comunista de España의 정치단체 등록
신청에 관한 행정 명령이 남아 있다【R10】. Cambridge의 역사 연구는 1976–1977년
정치개혁 과정에서 여러 정당이 합법화되고 1977년 선거에 참여했으며, PCE
합법화가 특히 어려운 결정이었다고 설명한다【R11】.

**Interpretation**

Legalization은 amnesty와 다르다. 전자는 조직이 공개적으로 등록·조직·경쟁할
수 있는 arena를 바꾸고, 후자는 처벌·기록·권리의 과거 행위를 처리한다. 조직은
사라지지 않고 합법적 자원과 가시성을 얻을 수 있으며, 기존 incumbent에게
새로운 경쟁 비용을 만든다.

### South Africa and Poland

**Source-supported fact**

South Africa의 1993 Abolition of Restrictions on Free Political Activity Act는
정당·조직·출판물에 대한 여러 제한을 폐지·수정하는 목적을 명시했다【R12】.
폴란드 대통령 archive는 1989 Round Table의 한 당사자로 Solidarity를 설명하고,
합법 활동 복귀와 제한적 선거 참여가 협상되었으며 이후 자유화가 확대되었다고
기록한다【R13】.

**Interpretation**

Legalization은 단순히 “불만 감소”가 아니라 조직의 합법적 활동, 공개 경쟁,
incumbent의 정보·협상·위협 관리 방식을 동시에 바꾼다. 제한된 경쟁은 민주정의
증거가 아니다. 비교 정치 연구도 opposition party의 존재만으로 민주주의를
판정할 수 없고, 권위주의 체제도 제한된 opposition을 허용할 수 있음을
지적한다【R14】. 권위주의 체제의 제한된 선거·정당 경쟁이 incumbent의
정당성과 coalition management에 사용될 수 있다는 연구도 있다【R15】.

### TMR mapping

- **Short-term effect:** 독립 정치조직의 legal access와 공개 조직 경로가 바뀐다.
- **Organization:** organization을 제거하지 않는다. 가시성과 자원 접근이
  증가하거나, 경쟁자 간 분화가 발생할 수 있다.
- **Trade-offs:** incumbent의 권위·정보 통제 약화, 보수/보안 faction의 반발,
  공개 경쟁에 따른 단기 contestation 증가.
- **Existing TMR state:** Faction.organization/grievance/resources, PolicyState,
  T016 action availability, T018 prerequisite.
- **Cannot express now:** party registry, candidacy, election, seat allocation,
  government turnover, fair campaign, incumbent resource advantage.
- **F04D implication:** `REQUIRED FOR F04D`. `politicalCompetition`을 좁게
  추가하고, action은 rule mutation·legal action availability에만 연결한다.
  선거와 정부교체를 함께 구현하지 않는다.

**Confidence:** HIGH for the distinction between legalization and amnesty;
MEDIUM for the smallest TMR mapping because current Faction has no legal-status
field.

## Labor Legalization / Bargaining

### Sweden, Saltsjöbaden Agreement

**Source-supported fact**

ILO의 역사 보고서는 스웨덴의 1938 basic agreement가 노동자·고용주 중앙조직의
공동 Employment Market Board를 만들었고, 산업별 단체협약과 노동법원·중재·조정
절차를 통해 분쟁을 처리했다고 기록한다. 조직은 국가에 흡수되지 않았으며,
당사자들은 국가 개입보다 자체 합의를 선호했다【R16】. Swenson의 연구는 이를
노동운동과 수출산업 자본의 cross-class alliance와 노동시장·복지정치의 결합으로
해석한다【R17】.

**Interpretation**

Legal union은 peaceful union과 같지 않다. 핵심은 조직을 약화시키는 것이
아니라, 조직된 힘을 교섭·조정·중재라는 예측 가능한 절차로 옮기는 것이다.
노동자 조직은 bargaining power를 얻고, 고용주는 파업·임금·생산 조건의
예측 가능성을 얻으며, 국가는 행정·중재 비용과 집행 부담을 진다.

### Comparative institutional lead

ILO Convention No. 87은 노동자·고용주가 사전 허가 없이 자신이 선택한 조직을
만들고, 조직이 자체 규칙·대표·활동을 정하며, 공권력이 조직을 해산·정지하지
않도록 하는 원칙을 명시한다【R18】. 이는 normative legal standard이지, 어느
국가에서 legal organization이 자동으로 안정화를 만들었다는 causal proof는
아니다. 영국의 statutory recognition guidance는 union recognition이 특정
단체교섭 범위와 투표·중재·법적 집행 절차를 요구한다는 점을 보여준다【R19】.

### TMR mapping

- **Short-term effect:** organization을 보존하면서 grievance를 협상 경로로
  전환할 수 있다.
- **Trade-offs:** 조직력이 높아져 파업·교섭 요구가 더 잘 보일 수 있고, 고용주·
  지주·상인 faction이 비용을 부담한다.
- **Prerequisites:** legal organization 외에도 bargaining counterpart, scope,
  dispute procedure, credible enforcement가 필요하다.
- **Existing TMR state:** `laborOrganization`, Faction.organization/grievance,
  treasury/admin load, T016/T017.
- **Cannot express now:** employer faction, bargaining unit, strike lifecycle,
  labor court/arbitration, agreement duration, compliance.
- **F04D implication:** labor legalization의 최소 feasibility는 기존 rule과
  faction organization availability로 검증할 수 있지만, **full labor
  bargaining은 USEFUL BUT DEFER / partial new domain**이다.

**Confidence:** HIGH for the distinction between integration and suppression;
MEDIUM for direct instability effects.

## Censorship / Assembly Restriction

### Bismarck Anti-Socialist Law

**Source-supported fact**

1878 법은 단체·회의·신문을 금지하고 경찰에게 회의 해산, 출판물 압수, 조직
감독·자금 관리 권한을 부여했다. 동시에 Reichstag 선거와 의원 활동에는 잔여
공간이 있었고, underground press와 조직망이 남았다【R01】. bpb는 1890년까지
많은 단체·출판물·활동가가 처벌되었지만 사회민주당 지지가 줄지 않고 오히려
늘었다고 설명한다【R02】.

### Britain and GDR counterpoints

영국 혁명기 억압의 법·행정 기관에 대한 Roberts의 연구는 기소, Home Office,
충성단체, 결사·집회·표현 제한이 결합해 개혁운동을 한동안 지하로 밀어 넣은
과정을 분석한다【R20】. 이는 억압이 특정 시기 가시적 조직과 활동을 실제로
줄일 수 있다는 반례다.

미국 국무부 역사문서의 1988년 GDR 보고서는 교회·환경 단체에 대한 단속과
출판물 검열 뒤에도 dissident group이 재집결하고 지하 잡지가 다시 나타났으며,
경제적 불만은 여전히 해결되지 않았다고 기록한다【R21】. 즉 visibility,
communication, organization, grievance가 같은 속도로 움직이지 않는다.

### TMR mapping

- **Short-term effect:** 공개 `LOBBY`/`ORGANIZE` 경로, 회의·언론 가시성,
  조직의 recruitment/coordination이 제한될 수 있다.
- **Medium-term risk:** underground organization, solidarity, grievance,
  정보 손실, 보안 행정 부담이 커질 수 있다.
- **Existing TMR state:** `pressFreedom`, `laborOrganization`, Faction.organization,
  Faction.grievance, Region.unrest, administrative load.
- **Cannot express now:** 지하조직, 정보 정확도, 경찰·보안조직, 선택적 집행,
  underground communication network.
- **F04D implication:** current rule mutation과 T016 availability를 이용한
  최소 coercive restriction은 `REQUIRED FOR F04D`의 비교 action으로 둘 수
  있다. 그러나 organization을 영구 0으로 만들거나 crisis를 직접 삭제하지
  않는다.

**Confidence:** HIGH for short-term visibility/organization restriction and
adaptation; MEDIUM for long-term grievance direction.

## Political Competition Architecture Decision

### Decision: ADD, but only as a narrow institutional dimension

```text
politicalCompetition = banned | restricted | plural
```

이 값은 다음만 의미한다.

- `banned`: 독립 정치조직이 합법적으로 결성·등록·공개 활동·권위 경쟁을 할
  수 없다.
- `restricted`: 일부 조직·후보·대표 경로가 허용되지만 등록, 활동, contestation,
  접근성 중 하나 이상이 제약된다.
- `plural`: 둘 이상의 자율 정치조직이 합법적으로 조직되고 국가 권위에 대해
  공개적으로 contest할 수 있다. 이것은 공정한 선거, 정권교체, 보통선거를
  보장하지 않는다.

### Explicit exclusions

`politicalCompetition`은 다음이 아니다.

- democracy/liberalism/openness score
- legitimacy 또는 stability meter
- `suffrage` duplicate
- `pressFreedom` duplicate
- `laborOrganization` duplicate
- election result, seat share, party registry, government turnover
- generic civil liberties meter

### Coherent combinations

- monarchy + plural competition: 군주가 국가원수여도 의회·정당·조직 경쟁이
  열릴 수 있다.
- republic + banned competition: 공화국 명칭과 국가원수 형태가 있어도 독립
  opposition 조직을 금지할 수 있다.
- broad suffrage + restricted competition: 유권자 범위가 넓어도 후보·정당·
  언론·조직 접근이 제한될 수 있다.
- free press + restricted candidacy: 보도가 자유로워도 공식 권위에 도전할
  후보 자격이 닫힐 수 있다.

영국 의회 자료는 대표기관·왕권·의회 주권·선거권이 장기간 서로 다른 단계로
발전했음을 보여준다【R22】. 스페인·남아공·폴란드 사례와 비교정치 연구는
정당의 존재와 민주주의가 동일하지 않으며, 제한된 opposition도 권위주의
정치의 일부가 될 수 있음을 보여준다【R10】【R12】【R13】【R14】.

**TMR inference:** 이 축은 F04C가 식별한 “amnesty와 legalization의 차이”와
현재 schema의 빈칸을 최소 비용으로 표현한다. F04D에서는 action availability와
대상 Faction의 공개 조직 경로에만 연결한다. 선거·대표 선출·정부교체가 필요해지는
순간에는 `NEW DOMAIN_REQUIRED`로 분리한다.

## Cross-Case Mechanism Matrix

| Action / mechanism                | Short-term effect                                             | Long-term risk                                          | Organization effect                                | Grievance effect                                | Institutional effect                       | Fiscal/admin cost        | Existing TMR fit                                   | Confidence |
| --------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------- | ------------------------------------------ | ------------------------ | -------------------------------------------------- | ---------- |
| Material relief                   | acute material pressure와 scarcity 완화 가능                  | coverage 불평등, 기대 상승, fiscal exhaustion           | 조직을 자동 제거하지 않음                          | 대상 grievance 완화 가능, 미포함 집단 반발 가능 | 행정 전달 능력과 대상 지역 우선순위가 중요 | treasury + admin/load    | `EXPRESSIBLE_NOW` via Region resources → T017      | H/M        |
| Political amnesty / accommodation | 처벌·권리·정치적 위험을 낮추거나 대상 faction을 다시 참여시킴 | 면책·진실·피해자 반발, 보안 faction 반발                | 유지·재활성화될 수 있음                            | 대상은 감소할 수 있으나 다른 집단은 증가 가능   | legalization과 별도의 법적 처리            | 사법·행정 처리 비용      | 제한 proxy는 small rule; full amnesty는 new domain | H/M        |
| Opposition legalization           | 공개 조직·경쟁·협상 경로 증가                                 | incumbent contestation, coalition split, elite backlash | 보존·가시화·성장 가능                              | 낮아질 수 있으나 경쟁 요구는 증가               | `politicalCompetition`을 바꿈              | 등록·감독·정치 접근 비용 | `EXPRESSIBLE_WITH_SMALL_RULE`                      | H          |
| Labor bargaining                  | conflict를 협약·중재로 전환                                   | 조직된 교섭력·파업·고용주 반발, 집행 실패               | 조직을 보존·강화                                   | 합의가 credible하면 완화, 실패하면 악화         | 법적 recognition과 procedure 필요          | 중재·법원·행정           | legal 최소형은 가능; full bargaining defer         | H/M        |
| Censorship / assembly restriction | 공개 소통·조직·모집을 단기 제한                               | 지하조직, 연대, grievance, 정보 왜곡                    | visible organization 감소, underground는 유지/재편 | 숨겨지거나 증가할 수 있음                       | press/labor/assembly access를 닫음         | 경찰·감독·집행 행정      | current rules로 최소형 가능                        | H/M        |

`H/M`은 하나의 전역 confidence score가 아니라, 직접 법·기관 사실은 HIGH,
장기 causal mapping은 MEDIUM이라는 뜻이다.

## Existing-State Fit Matrix

| Mechanism                                     | Fit                         | 현재 표현 가능한 부분                                                              | 빠진 부분                                                |
| --------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Region-targeted material relief               | EXPRESSIBLE_NOW             | resource capacity, scarcity, unrest, treasury/admin, T017                          | coverage·가격·임금                                       |
| Limited political accommodation               | EXPRESSIBLE_WITH_SMALL_RULE | targeted faction grievance, organization 보존, policy prerequisite                 | legal record·release·restoration                         |
| Opposition legalization                       | EXPRESSIBLE_WITH_SMALL_RULE | institutional rule mutation, Faction organization/grievance, T016 availability     | party registry·candidacy·election                        |
| Coercive press/labor restriction              | EXPRESSIBLE_WITH_SMALL_RULE | press/labor rule, visible T016 action availability, grievance/organization readers | underground·information quality·security agency          |
| Labor recognition without full bargaining     | EXPRESSIBLE_WITH_SMALL_RULE | laborOrganization legal, faction organization/grievance                            | employer counterpart·procedure                           |
| Full collective bargaining                    | NEW DOMAIN_REQUIRED         | —                                                                                  | bargaining unit, strike, arbitration, compliance         |
| Full political amnesty / transitional justice | NEW DOMAIN_REQUIRED         | —                                                                                  | individual acts, victims, disclosure, justice/reparation |
| Elections and government turnover             | NEW DOMAIN_REQUIRED         | suffrage label only                                                                | parties, nominations, votes, seats, governments          |
| Military faction / loyalty                    | NEW DOMAIN_REQUIRED         | Country.militaryPower only                                                         | officer organization, loyalty, coup coalition            |
| Arcane privilege / Mage Guild                 | NEW DOMAIN_REQUIRED         | Faction can be a future container                                                  | arcane legal status, guild economy, privilege            |
| Foreign war as domestic politics              | DEFER                       | T021 conflict baseline only                                                        | mobilization, war economy, diplomacy, peace              |

## F04D Minimum Action Recommendation

### Required for F04D

#### 1. Material relief

- **Institutional prerequisite:** existing legal action and enough treasury/admin
  headroom; no regime-label branch.
- **Authoritative mutation:** existing Region resource production capacity or the
  smallest current material state already used by F03A.
- **Immediate cost:** existing treasury cost, committed administrative load,
  implementation duration.
- **Short-term benefit:** resources → scarcity → T017 material pressure.
- **Medium-term trade-off:** fiscal/admin opportunity cost and regional coverage;
  faction organization remains.
- **Consumer:** resources, T017, Region unrest, Country instability.
- **Repeat behavior:** bounded by cost, headroom and target bounds; repeated no-op
  must not be a free accepted action.
- **Grounding:** R01, R02, R04, R05.

#### 2. Limited political amnesty / accommodation

- **Institutional prerequisite:** target faction is politically restricted or has
  elevated grievance; exact legal record is not modeled.
- **Authoritative mutation:** targeted Faction grievance decrease; organization is
  preserved. If a legal-access rule is added, that is a separate legalization step.
- **Immediate cost:** treasury/admin and possible incumbent/security faction reaction
  expressed through existing faction state where available.
- **Implementation time:** existing commitment lifecycle.
- **Short-term benefit:** targeted political pressure can fall without erasing the
  actor.
- **Medium-term trade-off:** organization may remain strong; opposing factions may
  resist; no guarantee of truth, justice, or reconciliation.
- **Consumer:** T016/T017/T018 existing readers.
- **Repeat behavior:** repeated use must not permanently suppress a faction without
  endogenous recovery/counter-pressure; F04A is the relevant guardrail.
- **Grounding:** R06, R07, R08, R09.
- **Scope note:** this is a TMR accommodation proxy, not a full historical amnesty
  system.

#### 3. Opposition legalization

- **Institutional prerequisite:** `politicalCompetition` is not already `plural`,
  and the current authority can enact the rule under existing Policy/Intervention
  legality.
- **Authoritative mutation:** `politicalCompetition` rule plus the minimum legal
  action availability required for the target Faction. Do not mutate organization
  to zero.
- **Immediate cost:** administrative implementation and incumbent/elite reaction;
  content owns the cost, not a new political mana.
- **Short-term benefit:** public organization and contestation path becomes legal.
- **Medium-term trade-off:** opposition organization can grow, incumbent control is
  less exclusive, and visible conflict can increase before it is institutionalized.
- **Consumer:** a narrow T016 legal political-action selector first; T018 reads
  current organization/grievance, not an intervention ID.
- **Repeat behavior:** after `plural`, action becomes infeasible or a no-op with no
  free repeated benefit.
- **Grounding:** R10, R12, R13, R14, R15.

#### 4. Coercive restriction, minimum form

- **Institutional prerequisite:** current authority can change `pressFreedom` or
  `laborOrganization`; no new secret-police domain.
- **Authoritative mutation:** existing rule restriction and, only where current
  consumers support it, visible organization/action availability.
- **Immediate cost:** administrative load and implementation time.
- **Short-term benefit:** public communication/recruitment may be reduced.
- **Medium-term trade-off:** grievance, underground adaptation and information loss;
  no direct crisis deletion or scheduled suppression.
- **Consumer:** T016 action availability, Faction dynamics, T017 pressure where
  existing readers already observe the state.
- **Repeat behavior:** restrictions cannot grant permanent immunity; F04A recovery
  and current grievance/organization writers remain active.
- **Grounding:** R01, R02, R18, R20, R21.

### Useful but defer

- **Full labor legalization / bargaining:** retain as a design target, but do not
  pretend that `laborOrganization = legal` alone creates recognition, a bargaining
  unit, an employer counterpart, arbitration, or compliance.
- **Local autonomy:** historically relevant, but Region-level political authority is
  not currently modeled.
- **Broad welfare, price control, debt relief, public works:** use material relief as
  a single proof path first; do not expand the catalog before causal evidence exists.

### New domain — defer

- election, candidacy, seats, party registry, government turnover
- individual legal record, victim/reparation, disclosure and transitional justice
- underground organization and information quality
- employer organizations, strike lifecycle, labor courts and bargaining compliance
- military faction, officer loyalty, mobilization and war economy
- arcane legal privilege, Mage Guild economy, sacred sovereignty

## Counterfactual Validation Plan

F04D가 구현되면 아래를 새 runner가 아니라 기존 canonical branch harness로
검증한다. 이 문서는 test design만 제공한다.

### Same state, different institution

동일 snapshot에서 다음을 비교한다.

- `politicalCompetition = banned`
- `politicalCompetition = plural`

두 branch의 treasury, admin headroom, Faction organization/grievance,
합법 action availability, T018 prerequisite margin을 비교한다. 이 실험은
선거를 실행하지 않는다.

축을 아직 구현하지 않은 경우의 대체 실험은 `laborOrganization = illegal`과
`legal`이며, legal branch가 단순히 organization을 삭제하지 않는지 확인한다.

### Same institution, different response

같은 decision-boundary snapshot에서 다음을 비교한다.

1. WAIT
2. material relief
3. limited political accommodation
4. opposition legalization
5. coercive restriction

기록할 것은 ending의 강제 분화가 아니라 다음의 실제 차이다.

- immediate ActionRecord와 completion timing
- treasury/admin load
- scarcity, Region.unrest, Country.instability
- Faction grievance/organization/resources
- T018 eligibility window와 failed prerequisite
- active conflict가 이미 있는 경우의 response
- Government/LandHex/T022 변화가 발생할 실제 opportunity가 있었는지

### Trade-off persistence

- relief는 영구 pacification이 아니어야 한다.
- amnesty/accommodation은 organization을 지우지 않아야 한다.
- legalization은 grievance를 자동 0으로 만들지 않아야 한다.
- labor integration은 조직을 파괴하지 않아야 한다.
- coercion은 영구 crisis immunity가 아니어야 한다.
- 반복 action은 treasury/admin/legality에 의해 bounded되어야 한다.
- 한 action이 preventive, crisis-response, recovery를 모두 저렴하게 해결하면
  dominance candidate로 기록한다.

### Minimum evidence for F04D review

각 action에 대해 다음 네 질문을 PASS/FAIL로 남긴다.

1. concrete authoritative state가 바뀌었는가?
2. 기존 downstream consumer가 그 변화를 읽었는가?
3. WAIT와 state/prerequisite trajectory가 갈라졌는가?
4. 다른 faction·지역·재정에 관찰 가능한 비용이 남았는가?

정치 event나 outcome이 즉시 달라지지 않는 것은 자동 FAIL이 아니다. 다만
decision opportunity가 없었다면 `NO_OPPORTUNITY`로 분리한다.

## New-Domain / Deferred Findings

| Finding                                    | Classification                | Reason                                                              |
| ------------------------------------------ | ----------------------------- | ------------------------------------------------------------------- |
| `politicalCompetition` narrow axis         | SMALL EXTENSION / ADD in F04D | amnesty·franchise·party legality를 구분하는 최소 빈칸               |
| elections / government turnover            | NEW DOMAIN_REQUIRED           | suffrage만으로 votes, seats, governments를 만들 수 없음             |
| full political amnesty                     | NEW DOMAIN_REQUIRED           | individual legal status, victims, disclosure, restoration 필요      |
| underground politics / information quality | NEW DOMAIN_REQUIRED           | press restriction의 장기 적응을 별도 state로 추적해야 함            |
| full labor bargaining                      | NEW DOMAIN_REQUIRED           | employer counterpart, bargaining procedure, strike/arbitration 필요 |
| local autonomy                             | NEW DOMAIN_REQUIRED           | Region-level political authority와 fiscal delegation 필요           |
| military faction / loyalty                 | NEW DOMAIN_REQUIRED           | Country.militaryPower를 정치 actor로 사용하면 안 됨                 |
| arcane privilege / Mage Guild              | NEW DOMAIN_REQUIRED / DEFER   | F04C의 core fantasy proposal이지만 Gate 1F 필수 아님                |
| Sacred / Supernatural Sovereignty          | DEFER                         | religious institution·legitimacy writer가 없음                      |
| foreign war as domestic politics           | DEFER                         | W-series slot; T021 baseline을 확대하지 않음                        |

## War-as-Politics Reference Leads

이번 task에서 전쟁 시스템을 연구·구현하지 않았다. F04C 이후의 research lead만
남긴다.

- 전시 동원은 militaryPower 숫자의 자동 보너스가 아니라 treasury, 노동력,
  행정 capacity, 군부 조직의 이해관계가 충돌하는 domestic action으로 조사한다.
- emergency taxation, rationing, requisition, military pay, officer patronage는
  누가 비용을 부담하고 누가 veto를 얻는지의 institutional question으로
  조사한다.
- martial law는 전쟁의 무료 stability 버튼이 아니라, assembly/press/organization
  restriction과 군부 권력의 국내 반작용으로 조사한다.
- future source work는 military faction·war failure/prestige·mobilization
  politics를 별도로 다룬다. 이번 문서의 사례를 외부전쟁 event로 복제하지 않는다.

## Fantasy-Politics Analogy Leads

### Recommended core axis carried from F04C

**Arcane Privilege / Mage Guild**

마법을 combat multiplier가 아니라 허가, 특허, 면세, 소유권, 징집 면제,
국가 requisition을 둘러싼 법적 특권과 조직으로 조사한다. 역사적 analogy는
길드·면허 직업·독점 charter·종교·군사 order의 법적 지위이지, “마법은
안정을 준다”는 결론이 아니다.

### Optional secondary axis

**Sacred / Supernatural Sovereignty**

종교·초자연 기관의 재산, 과세, 정통성 해석권을 조사 대상으로 남긴다. 지금은
authoritative field나 faction consumer가 없으므로 defer한다.

### Explicitly deferred fantasy soup

- 종족별 정치 보너스
- 선택받은 영웅·예언·운명
- 마법 학교·던전·몬스터 생태계
- magic = military power multiplier
- 수십 개의 고유명사·lore encyclopedia

## Gazette / Tone Leads

이 절은 production copy가 아니다. 향후 Gazette의 구조적 참고만 기록한다.

- 법률은 “임시” 제한의 기간, 승인 기관, 항소, 예외 조항을 길게 쓸 수 있다.
  독일 Anti-Socialist Law의 1년 제한·경찰 권한·항소 구조가 좋은 참고다【R01】.
- Spanish Amnesty Law처럼 한 문서가 반란, 언론, 공무원, 군인, 노동권을 서로
  다른 조항으로 처리하는 법률적 관료주의를 참고할 수 있다【R06】.
- 억압은 “질서를 회복한다”는 공식 문구와 지하조직·정보·생활 조건의 실제
  변화를 분리해 보여줄 수 있다【R20】【R21】.
- 농담의 대상은 권력자의 자기합리화, 관료적 모순, 특권의 법률화다. 기근,
  학살, 민간인 대량 사망과 같은 피해는 건조하고 직접적으로 기록하며 희화화하지
  않는다.

## Sources

### Source ledger

| ID  | Title                                                                                 | Author / issuing institution                                     |              Date | URL / archive locator                                                                                                                                                                                           | Type                            | Case                                 | Mechanism supported                                                                          | Important limitation                                                         |
| --- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| R01 | Anti-Socialist Law (21 Oct 1878)                                                      | German Historical Institute, GHDI; law text / Lidtke translation |              1878 | [GHDI](https://germanhistorydocs.org/en/forging-an-empire-bismarckian-germany-1866-1890/ghdi:document-1843)                                                                                                     | primary law + editorial context | Germany                              | association, meeting, press restriction; residual Reichstag activity; underground adaptation | law text proves legal content, not all causal outcomes                       |
| R02 | Sozialdemokratie zwischen Ausnahmegesetzen und Sozialreformen                         | Wolfgang Kruse, bpb                                              |              2026 | [bpb](https://www.bpb.de/themen/kolonialismus-imperialismus/kaiserreich/139650/sozialdemokratie-zwischen-ausnahmegesetzen-und-sozialreformen/)                                                                  | secondary institutional history | Germany                              | repression and social insurance in parallel; low initial benefits; SPD support               | one national case; not a universal welfare law                               |
| R03 | Bismarcks Sozialgesetze                                                               | Gerhard Bäcker / Ernst Kistler, bpb                              |              2024 | [bpb](https://www.bpb.de/themen/soziale-lage/rentenpolitik/289619/bismarcks-sozialgesetze/)                                                                                                                     | secondary expert history        | Germany                              | 1889 pension scope, financing and low benefit level                                          | pension history, not direct unrest measurement                               |
| R04 | Did the New Deal Solidify the 1932 Democratic Realignment?                            | Shawn Kantor, Price Fishback, John Joseph Wallis, NBER           |              2012 | [NBER](https://www.nber.org/papers/w18500)                                                                                                                                                                      | academic quantitative history   | United States                        | relief/public works, administrative allocation and long-run electoral support                | electoral support is not direct instability or grievance                     |
| R05 | Politics, Relief, and Reform                                                          | John Joseph Wallis, Price Fishback, Shawn Kantor, NBER           |              2005 | [NBER](https://www.nber.org/papers/w11080)                                                                                                                                                                      | academic institutional history  | United States                        | federal/state/local administration, rules vs discretion, corruption incentives               | allocation history does not prove every relief program stabilizes            |
| R06 | Ley 46/1977 de Amnistía                                                               | Boletín Oficial del Estado, Spain                                |              1977 | [BOE](https://www.boe.es/buscar/act.php?id=BOE-A-1977-24937)                                                                                                                                                    | primary law                     | Spain                                | acts covered, release, record/rights restoration, labor provisions                           | legal text does not prove transition outcome                                 |
| R07 | The Spanish Amnesty Law of 1977 in Comparative Perspective                            | Paloma Aguilar, Cambridge University Press                       |              2012 | [Cambridge](https://www.cambridge.org/core/books/abs/amnesty-in-the-age-of-human-rights-accountability/spanish-amnesty-law-of-1977-in-comparative-perspective/B006CEB372D5DB73A98E906E84059254)                 | academic secondary              | Spain / Argentina / Chile comparison | amnesty-accountability trade-off and political process                                       | abstract-level access; do not overextend beyond stated comparison            |
| R08 | Promotion of National Unity and Reconciliation Act 34 of 1995                         | South African Government                                         |              1995 | [gov.za](https://www.gov.za/documents/promotion-national-unity-and-reconciliation-act)                                                                                                                          | primary act summary / PDF       | South Africa                         | conditional disclosure, victims, reparations, TRC/Amnesty Committee                          | landing page summarizes purpose; detailed sections require PDF               |
| R09 | Truth and Reconciliation Commission Report                                            | South African Government / Department of Justice                 |         1998–2003 | [TRC report](https://www.justice.gov.za/trc/report/index.htm)                                                                                                                                                   | official commission report      | South Africa                         | amnesty, victims, reparation and rehabilitation institutional separation                     | large report; used for structure, not a single causal estimate               |
| R10 | Order on registration of Partido Comunista de España                                  | Boletín Oficial del Estado, Spain                                |              1977 | [BOE](https://www.boe.es/diario_boe/txt.php?id=BOE-A-1977-8942&lang=es)                                                                                                                                         | primary administrative record   | Spain                                | legal registration/recognition process                                                       | BOE page exposes metadata; original text is PDF/XML                          |
| R11 | Transition without Justice / Spanish transition                                       | Cambridge historical law study                                   |              2013 | [Cambridge](https://www.cambridge.org/core/books/abs/historical-memory-and-criminal-justice-in-spain/transition-without-justice/2A70E292BCF9EBF4CF7E1EB404329BD0)                                               | academic secondary              | Spain                                | legalization, elections, amnesties and constitutional transition                             | chapter access is limited; use summary claims only                           |
| R12 | Abolition of Restrictions on Free Political Activity Act 206 of 1993                  | South African Government                                         |              1993 | [gov.za](https://www.gov.za/documents/abolition-restrictions-free-political-activity-act)                                                                                                                       | primary act summary             | South Africa                         | lifting restrictions on parties, organizations and publications                              | purpose summary, not full transition causality                               |
| R13 | 1989 — Round Table and Solidarity                                                     | Office of the President of Poland archive                        |              1989 | [President.pl archive](https://www.president.pl/archives/bronislaw-komorowski/freedom-day/1989)                                                                                                                 | official historical archive     | Poland                               | return to legal operation, negotiated limited elections, later expansion                     | retrospective institutional summary                                          |
| R14 | Political Oppositions in Democratic and Authoritarian Regimes                         | Government and Opposition / Cambridge                            |              2022 | [Cambridge](https://www.cambridge.org/core/journals/government-and-opposition/article/political-oppositions-in-democratic-and-authoritarian-regimes-a-stateofthefields-review/7D2D28956618E1FD6A0183A84D618C92) | academic state-of-field review  | comparative                          | opposition party presence ≠ democracy; institutional opposition scope                        | review synthesizes literature rather than one case                           |
| R15 | Party system institutionalization and durability of competitive authoritarian regimes | European Journal of Political Research / Wiley                   |              2024 | [Wiley](https://onlinelibrary.wiley.com/doi/10.1111/1475-6765.12655)                                                                                                                                            | academic comparative research   | authoritarian competition            | restricted competition can manage opposition and coalition uncertainty                       | contemporary comparative scope; not a TMR formula                            |
| R16 | Cooperation in Industry                                                               | International Labour Office                                      |              1949 | [ILO historical report PDF](https://www.ilo.org/public/libdoc/ilo/ILO-SR/ILO-SR_NS26_engl.pdf)                                                                                                                  | official institutional report   | Sweden / Nordic labor relations      | Saltsjöbaden joint board, collective agreements, arbitration and independence                | institutional report includes participants' view of industrial peace         |
| R17 | Cross-Class Alliance: The Social Democratic Breakthrough                              | Peter A. Swenson, Oxford University Press                        |              2002 | [Oxford Academic](https://academic.oup.com/book/11836/chapter-abstract/160929981)                                                                                                                               | academic secondary              | Sweden                               | employer–labor alliance and bargaining politics                                              | chapter abstract; not a complete Sweden history                              |
| R18 | Convention No. 87 — Freedom of Association                                            | International Labour Organization                                |              1948 | [ILO NORMLEX](https://normlex.ilo.org/dyn/nrmlx_en/f?p=NORMLEXPUB:12100:0::NO::P12100_ILO_CODE:C087+)                                                                                                           | primary normative convention    | comparative labor law                | organization rights and non-interference                                                     | normative standard, not causal stabilization evidence                        |
| R19 | Statutory Recognition Guidance                                                        | Central Arbitration Committee / GOV.UK                           | current framework | [GOV.UK](https://www.gov.uk/guidance/statutory-recognition-guidance-on-part-i-of-schedule-a1)                                                                                                                   | official legal guidance         | United Kingdom                       | recognition, ballot, bargaining method, enforceability                                       | modern legal framework, not historical Sweden causality                      |
| R20 | Experiments with Suppression: Evolution of Repressive Legality in Britain             | Christopher M. Roberts                                           |              2020 | [Loyola Law Review repository](https://digitalcommons.lmu.edu/ilr/vol43/iss2/2/)                                                                                                                                | academic secondary              | Britain                              | repression institutions, association/assembly limits, underground shift                      | one historical period and legal-history focus                                |
| R21 | Historical Documents: GDR dissent and censorship                                      | U.S. Department of State, Office of the Historian                |              1988 | [FRUS document](https://history.state.gov/historicaldocuments/frus1981-88v10/d312)                                                                                                                              | declassified official report    | East Germany                         | crackdown, censorship, regrouping, underground press, unresolved economic grievance          | contemporaneous report; observations are bounded and not a full causal study |
| R22 | The History of Parliament                                                             | UK Parliament / Parliamentary Archives                           |              n.d. | [UK Parliament PDF](https://www.parliament.uk/globalassets/documents/parliamentary-archives/evolution.pdf)                                                                                                      | official institutional history  | Britain                              | representative institution, royal power, parliamentary sovereignty, franchise development    | broad institutional narrative; not a stability estimate                      |

### Reference quality decision

F04C-R는 각 major mechanism에 2개 이상의 case 또는 강한 case와 counterexample을
배치했다. 다만 다음은 `INSUFFICIENT_REFERENCE_GROUNDING`으로 남긴다.

- TMR의 exact numeric grievance/organization delta와 역사적 효과의 수치 대응
- 판타지 Mage Guild의 실제 simulation 수치
- military loyalty·전시 동원·war failure의 TMR-specific causal scale
- underground organization을 current Faction fields만으로 완전히 재현하는 방법

## F04C Design Update Needed

F04C의 broad direction은 유지하되, F04C-R의 두 가지 정렬을 반영한다.

1. `politicalCompetition`은 단순 후보가 아니라 **F04D에서 ADD를 검토할
   smallest missing dimension**으로 우선순위를 올린다. 의미는 위의 세 값과
   명시적 exclusions를 따른다.
2. `political amnesty`는 현재 `Faction.grievanceDelta`만으로 완전하게
   표현되지 않는다. F04D가 구현할 수 있는 것은 법적 사면 전체가 아니라
   organization을 보존하는 제한된 political accommodation proxy다. full
   amnesty/transitional justice는 NEW DOMAIN으로 재분류한다.
3. labor legalization/bargaining은 최소 legal organization proof와 full
   bargaining system을 분리한다. 후자는 F04D 필수가 아니다.

F04C의 action archetype·regime comparison·War/Fantasy defer 원칙은 중복
작성하지 않고 그대로 유지한다.

## Planning / QA Alignment

- F04C-R는 gameplay, balance, RNG, source schema, inspection runner를 변경하지
  않았다.
- F04D는 위 네 action의 최소 canonical path와 `politicalCompetition` narrow
  consumer를 구현한 뒤, same-state counterfactual을 다시 실행해야 한다.
- F05는 F04D 이후에도 WAIT dominance와 실제 political history divergence가
  남는지 확인하기 전에는 시작하지 않는다.
- V02는 Gate 1F/F05와 visual simulation validation 이후에만 시작한다.

## Status

**F04C-R STATUS: PASS**  
**POLITICAL COMPETITION: ADD — narrow `banned | restricted | plural` dimension**  
**F04D READY: YES, for the narrow implementation slice only**  
**F05 READY: NO — F04D and counterfactual recheck required**  
**BLOCKERS:** full elections, party system, transitional justice, labor bargaining,
military faction, war, and arcane domain remain outside the smallest slice.
