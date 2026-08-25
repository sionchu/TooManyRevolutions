# F05_FIX24 Rebellion Operational Evidence Source Grounding

TASK_ID: F05_FIX24
STATUS: COMPLETE / AWAITING_CHATGPT_REVIEW
BASE_IMPLEMENTATION_HEAD: 82bb6018f2fc87d9f1807cab3c12fb5e2e016775
BASE_IMPLEMENTATION_BRANCH: f05-fix23-review
REVIEW_BRANCH: f05-fix24-review

PRIMARY_CLASSIFICATION: REBELLION_EVIDENCE_REQUIRES_NEW_OPERATIONAL_SUPPORT_DOMAINS
ORGANIZATIONAL_CONTINUITY_SOURCE: NEW_AUTHORITATIVE_DOMAIN_REQUIRED
COMMAND_CONTINUITY_SOURCE: NEW_AUTHORITATIVE_DOMAIN_REQUIRED
LOGISTICS_ACCESS_SOURCE: NEW_AUTHORITATIVE_DOMAIN_REQUIRED
EXTERNAL_SUPPORT_SOURCE: EXPLICIT_EXTERNAL_INPUT_ONLY
BOOTSTRAP_COUNTS_AS_POSITIVE_EVIDENCE: NO
GENERIC_SCALAR_INFERENCE_ALLOWED: NO
RANDOM_OR_TIMER_ALLOWED: NO
PREAUTHORED_CURRENT_EVIDENCE_ALLOWED: NO
DIRECT_PLAYER_FACT_INVENTION_ALLOWED: NO
LLM_DIRECT_MUTATION_ALLOWED: NO
TERRITORIAL_WRITER: NO
CONFLICT_OUTCOME_WRITER: NO
SETTLEMENT_DOMAIN: UNCHANGED
PERSISTENCE_FORMAT: V8_UNCHANGED
GATE1F: NOT_READY
V02: NOT_STARTED
NEXT_IMPLEMENTATION_READINESS: REBELLION_OPERATIONAL_SOURCE_DOMAIN_DESIGN

## 1. Decision

현재 `WorldState`와 `EventStore`에는 반란이 계속해서 실제로 작동하고 있다는
긍정적 operational fact를 네 종류 중 어느 것도 독립적으로 기록할 수 없다.
FIX23의 `RebellionOperationalPersistenceEpisode`는 T018이 새 Conflict를
만든 사실과 기존 `REBELLION_STARTED` event의 provenance만 보존한다. 그것은
조직·지휘·물류·외부 지원의 지속을 뜻하지 않는다.

조직 지속성, 지휘 지속성, 물류 접근은 각각 actor와 관계, 행위, 관찰
provenance가 없는 현재 aggregate state로는 안전하게 표현할 수 없다. 따라서
각각 별도의 최소 operational-support domain 설계가 필요하다. External
support는 현재 범위에서는 식별 가능한 외부 actor가 실제 지원을 했다는
사실을 내부 simulation이 만들 수 없으므로 명시적 external input만 허용한다.
나중에 자율적으로 발생시키려면 그 입력을 제공할 외부 actor/support domain이
별도로 필요하다.

이 문서는 evidence writer, producer, ActionRecord schema, GameEvent type,
WorldState field, settlement, persistence V9를 추가하지 않는다. 아래의
domain과 event 이름은 향후 설계 경계를 설명하기 위한 제안이며 현재 코드에
존재하는 API가 아니다.

## 2. Operational fact의 의미

| Channel | 긍정적으로 기록하려는 실제 fact | 단순히 같은 것으로 취급할 수 없는 현재 값 |
| --- | --- | --- |
| `organizationalContinuity` | 반란 조직의 세포·역할·정보/지원 연결이 실제 행위로 유지되고, 구성원이 조직된 활동을 계속 수행함 | `Faction.organization`, 지역 ideology organization, `REBELLION_STARTED` |
| `commandContinuity` | 식별 가능한 지휘 역할 또는 command node가 명령을 발행·전달·수신·승계할 수 있는 관계를 유지함 | `Faction.currentStrategy`, `Faction.influence`, Country `militaryPower`, active Conflict |
| `logisticsAccess` | 반란 actor가 특정 공급·은닉처·이동 경로·재정/물자 전달에 실제 접근하거나 허가·이전을 받음 | `Faction.resources`, Region scarcity/resources, ContactGraph edge, LandHex ownership, `FUND_MOVEMENT` |
| `externalSupport` | 식별 가능한 외부 sponsor/provider가 반란 actor에게 특정 종류의 지원을 실제로 제공·허가하고 recipient가 그것을 받음 | `Faction.foreignLinks`, `FOREIGN_SUPPORT_SENT` enum 이름, LLM/heuristic 입력 source |

네 종류 모두 “현재 값이 높다”가 아니라 “누가 무엇을 누구에게 어떤
provenance로 수행했는가”가 필요한 사실이다. Positive evidence는 active
Conflict의 존재, authored profile의 channel membership, 또는 한 번의
bootstrap을 다시 표현한 label이어서는 안 된다.

## 3. Literature grounding

문헌은 persistence score나 gameplay threshold를 정하기 위한 것이 아니라,
증거가 어떤 actor·관계·행위·접근을 기록해야 하는지 결정하기 위한 causal
grounding으로 사용했다.

| 연구 | 확인한 관련 결과 | TMR 설계 판단 |
| --- | --- | --- |
| Sarah Elizabeth Parkinson, “Organizing Rebellion: Rethinking High-Risk Mobilization and Social Networks in War,” *American Political Science Review* 107(3), 2013, pp. 418–432 | 반란의 resilience를 이해하려면 전투 참여자 수가 아니라 조직·사회적 맥락, 역할 분화, clandestine supply/financial/information network를 구분해야 한다. | `Faction.organization` 하나로 조직 지속성을 기록할 수 없다. 조직 unit/role/network activity와 그 provenance가 필요하다. |
| Paul Staniland, *Networks of Rebellion: Explaining Insurgent Cohesion and Collapse*, Cornell University Press, 2014 | insurgent cohesion과 collapse는 조직 유형, 사회적 기반, coalition/network 구조가 전쟁 중 어떻게 변하는지와 연결된다. | 정적 profile이나 aggregate cohesion 값이 아니라 조직 구조와 변화의 typed fact가 필요하다. |
| Mark Youngman and Cerwyn Moore, “Replacing the standard bearer: Theorising leadership transition in insurgencies,” *European Journal of International Security* 9, 2024, pp. 199–219 | 지도자 교체는 역할과 관계가 유동적이고, 승계·정보 흐름·경쟁 관계가 조직 취약성을 만드는 별도 국면이다. | `currentStrategy`나 `leadership` placeholder만으로 command continuity를 만들 수 없다. command role, successor/claim, recipient 관계가 필요하다. |
| Jennifer M. Hazen, *What Rebels Want: Resources and Supply Networks in Wartime*, Cornell University Press, 2013 | 자원은 현금만이 아니라 무기·탄약·safe haven·diplomatic support를 포함하며, 반란 집단의 접근은 전쟁 중 계속 변한다. | `Faction.resources`는 물류 접근이 아니다. 공급자, 물자/은신처 종류, route 또는 transfer/permission 사실이 필요하다. |
| Daniel Byman, Peter Chalk, Bruce Hoffman, William Rosenau, and David Brannan, *Trends in Outside Support for Insurgent Movements*, RAND MR-1405, 2001 | 외부 actor의 지원은 safe haven/transit, leadership/command, financial/material aid, training 등 서로 다른 형태와 제공자를 가진다. | 외부 지원은 `foreignLinks` 관계값이 아니라 sponsor와 recipient 사이의 명시적 support action/event여야 한다. |
| Idean Salehyan, Kristian Skrede Gleditsch, and David E. Cunningham, “Explaining External Support for Insurgent Groups,” *International Organization* 65(4), 2011, pp. 709–744 | 외부 지원에는 state의 공급 측과 rebel의 수요·수용 측이 함께 있으며, transnational constituency와 국가 간 linkage가 조건이 된다. | sponsor 의사/authorization, recipient identity, accepted support, 지원 종류를 모두 기록하지 않고는 `foreignLinks`를 support evidence로 승격할 수 없다. |

References:

- [Parkinson, *American Political Science Review*](https://doi.org/10.1017/S0003055413000208)
- [Staniland, Cornell University Press distribution record](https://utpdistribution.com/9780801452666/networks-of-rebellion/)
- [Youngman and Moore, *European Journal of International Security*](https://doi.org/10.1017/eis.2023.31)
- [Hazen, Cornell Scholarship Online / Oxford Academic](https://doi.org/10.7591/cornell/9780801451669.001.0001)
- [Byman et al., RAND MR-1405](https://www.rand.org/content/dam/rand/pubs/monograph_reports/2001/MR1405.pdf)
- [Salehyan, Gleditsch, and Cunningham, *International Organization*](https://doi.org/10.1017/S0020818311000233)

문헌은 실제 사례와 개념을 제공하지만 TMR의 특정 actor ID, tick, event
sequence를 결정하지 않는다. 따라서 문헌에서 직접 numeric score, quorum,
decay, success probability를 도출하지 않는다.

## 4. Accepted FIX23 bootstrap boundary

현재 구현의 정확한 경계는 다음과 같다.

```text
T018 new rebellion Conflict
  + exact Country/Faction RebellionPersistenceProfile
  + existing REBELLION_STARTED event
  -> Conflict-scoped RebellionOperationalPersistenceEpisode
```

`src/sim/state/rebellionPersistence.ts`의 episode는 `conflictId`, profile,
Country/Faction, bootstrap tick, source event ID를 보존한다. `src/sim/systems/conflict.ts`
는 T018의 기존 Conflict creation owner로서 이 episode를 한 번 만들 뿐이다.
`REBELLION_STARTED` payload의 prerequisite snapshot과 `futureEvidence`
placeholder도 미래 operational fact를 기록하지 않는다.

그러므로 다음은 허용되지 않는다.

- bootstrap event를 네 operational channel의 첫 positive evidence로 재해석
- authored channel/profile membership을 현재 evidence로 취급
- active Conflict 또는 unresolved status를 continuity로 취급
- suppression 또는 absence of front를 operational collapse/settlement로 취급

첫 positive evidence는 bootstrap 이후 별도의 typed action 또는 existing
semantic contract를 가진 event에서만 만들어질 수 있다. 현재 repository에는
그 source event/action이 없다.

## 5. Current repository audit

### 5.1 Authoritative state and static authoring

| 현재 개념 | 실제 현재 의미 | Evidence source 판정 |
| --- | --- | --- |
| `RebellionOperationalPersistenceEpisode` | T018-created Conflict의 identity/provenance와 `REBELLION_STARTED` 연결 | 네 채널 모두 `EXISTING_TYPED_SOURCE_REFERENCABLE_BUT_INSUFFICIENT` |
| `RebellionPersistenceProfile` | Country/Faction에 허용할 static channel ID set; array order/weight 없음 | 네 채널 모두 `EXISTING_TYPED_SOURCE_REFERENCABLE_BUT_INSUFFICIENT` |
| `Faction.organization`, `resources`, `influence`, `grievance` | 기존 pressure/crisis/read model용 aggregate 값 | 네 채널 모두 `FORBIDDEN_AS_SOURCE` |
| `Faction.foreignLinks` | Country별 normalized relation signal | `externalSupport`는 `FORBIDDEN_AS_SOURCE`; 나머지는 `EXISTING_TYPED_SOURCE_REFERENCABLE_BUT_INSUFFICIENT` |
| `Faction.currentStrategy` | bounded heuristic/action 결과인 전략 label | `commandContinuity`는 `FORBIDDEN_AS_SOURCE`; 나머지도 evidence로는 `FORBIDDEN_AS_SOURCE` |
| Region `unrest`, ideology `radicalism/organization`, `scarcity`, resources, stateControl | local political/economic/administrative state | 네 채널 모두 `FORBIDDEN_AS_SOURCE` |
| Country `militaryPower`, `stateCapacity`, `legitimacy`, `instability`, `stateContinuity` | 국가 aggregate 및 Country continuity 값 | 네 채널 모두 `FORBIDDEN_AS_SOURCE` |
| Government `authority` 및 current Government | central/contender/exile의 정부 관계 | 네 채널 모두 `EXISTING_TYPED_SOURCE_REFERENCABLE_BUT_INSUFFICIENT` |
| `landHexStates[*].controller`와 derived front | 유일한 physical territorial authority와 그 selector | 네 채널 모두 `FORBIDDEN_AS_SOURCE` |
| ContactGraph edge/runtime overlay | static Region route와 enabled/multiplier/block reason | `logisticsAccess`는 `FORBIDDEN_AS_SOURCE`; 나머지는 `EXISTING_TYPED_SOURCE_REFERENCABLE_BUT_INSUFFICIENT` |

현재 state는 crisis eligibility와 설명에 유용할 수 있지만, evidence source의
actor, recipient, operation, consent, command relation을 추가로 만들어내지
않는다.

### 5.2 Existing ActionRecord and GameEvent semantics

| 현재 경로 | 실제 semantics | Evidence source 판정 |
| --- | --- | --- |
| `ActionRecord` / `ActionProposal` | `player | heuristic | llm`의 bounded input envelope와 append-only provenance | 네 채널에 대해 `EXPLICIT_EXTERNAL_INPUT_ONLY`; ActionRecord source는 fact actor가 아님 |
| `REBELLION_STARTED` | T018 prerequisite와 Conflict creation event | 네 채널 모두 `EXISTING_TYPED_SOURCE_REFERENCABLE_BUT_INSUFFICIENT` |
| `FACTION_STRATEGY_CHANGED` | Faction action resolution이 `currentStrategy`를 바꾼 event | `commandContinuity`는 `FORBIDDEN_AS_SOURCE`; 나머지는 `EXISTING_TYPED_SOURCE_REFERENCABLE_BUT_INSUFFICIENT` |
| `ORGANIZATION_INCREASED` event vocabulary | 현재 조직 변화의 generic vocabulary일 뿐, accepted head에서 rebellion organization actor/operation producer는 없음 | `organizationalContinuity`는 `EXISTING_TYPED_SOURCE_REFERENCABLE_BUT_INSUFFICIENT` |
| `FACTION_FUND_MOVEMENT_COMMITTED/RESOLVED` | authored target Region에 대한 faction-owned resource earmark lifecycle | `logisticsAccess`는 `FORBIDDEN_AS_SOURCE`; 나머지는 `EXISTING_TYPED_SOURCE_REFERENCABLE_BUT_INSUFFICIENT` |
| `INTERVENTION_*` | Country intervention commitment, feasibility, cost, completion effect | 네 채널 모두 `EXISTING_TYPED_SOURCE_REFERENCABLE_BUT_INSUFFICIENT` |
| `POLITICAL_PROPOSAL_*` | Faction-to-Government intervention request와 explicit response lifecycle | 네 채널 모두 `EXISTING_TYPED_SOURCE_REFERENCABLE_BUT_INSUFFICIENT` |
| `BORDER_CLOSED/REOPENED` | diplomacy가 ContactGraph border state를 바꾼 event | `logisticsAccess`/`externalSupport`를 직접 뜻하지 않으며 `EXISTING_TYPED_SOURCE_REFERENCABLE_BUT_INSUFFICIENT` |
| `FOREIGN_SUPPORT_SENT` event vocabulary | enum에 이름은 있지만 accepted head에서 external sponsor/recipient transfer producer가 없음 | `externalSupport`는 `EXISTING_TYPED_SOURCE_REFERENCABLE_BUT_INSUFFICIENT` |
| EventStore | ordered event IDs, causes, tick, actor/target/payload 보존 | provenance container로는 충분하지만 evidence semantics 자체는 `EXISTING_TYPED_SOURCE_REFERENCABLE_BUT_INSUFFICIENT` |
| Agenda/read models | ScenarioDefinition·WorldState·bounded recent events에서 계산한 presentation/heuristic context | 네 채널 모두 `FORBIDDEN_AS_SOURCE` |
| tick/cadence/RNG | deterministic time/ordering/replay state | 네 채널 모두 `FORBIDDEN_AS_SOURCE` |

`FOREIGN_SUPPORT_SENT`와 `ORGANIZATION_INCREASED`의 이름이 event type
목록에 있다는 사실은 해당 event가 실제로 발생했거나 필요한 payload를
가지고 있다는 증거가 아니다. EventStore가 보존하는 것은 생성된 typed event의
provenance이지, 없는 producer를 보충하는 의미 변환기가 아니다.

### 5.3 Boundary audit

- T018은 rebellion Conflict creation owner로 유지된다.
- T021은 `LandHex.controller`를 유일한 physical territorial writer로 유지하고,
  fronts는 derived selector로 남는다.
- T022/T023, `ConflictOutcome`, `RunOutcome`, Government transition은
  operational evidence source가 아니다.
- Intervention, Political Proposal, FUND_MOVEMENT는 각각의 기존 semantic
  contract를 유지한다. 이름을 바꾸어 rebellion evidence로 재사용하지 않는다.
- LLM과 heuristic은 common ActionProposal intake에 schema-valid input을
  제안할 수 있을 뿐, WorldState나 EventStore를 직접 mutation하지 않는다.
- V8 snapshot은 evidence runtime state를 아직 가지지 않으며 FIX24에서 V9로
  바꾸지 않는다.

## 6. Channel-specific source decisions

### 6.1 `organizationalContinuity`

#### Required fact and legitimate actor

긍정적 evidence는 반란 Faction의 aggregate organization 수치가 아니라,
식별 가능한 organization unit/cell/role이 실제로 유지되고 활동했다는
사실이어야 한다. 최소한 다음이 구분되어야 한다.

- 어느 `ConflictId`/episode에 속한 organization인지;
- 어떤 organization actor 또는 cell이 행위했는지;
- 어떤 role/network relation이 유지·생성·복구되었는지;
- 어떤 subject/recipient가 그 행위를 받았는지;
- 그 사실을 관찰·기록할 issuer와 source event가 무엇인지.

`Faction.organization`, Region ideology organization, `ORGANIZATION_INCREASED`,
고정된 channel profile은 이 의미를 충족하지 않는다. 조직의 실제 사회적
기반과 clandestine subdivision을 구분해야 한다는 문헌 결과도 이 결론을
지지한다.

#### Current verdict

`ORGANIZATIONAL_CONTINUITY_SOURCE: NEW_AUTHORITATIVE_DOMAIN_REQUIRED`

현재 typed state/event는 context로 참조할 수 있지만 positive evidence를
만들 수 없다. 현 scope에서 임시로 허용할 수 있는 것은 외부에서 명시된
schema-valid activity input뿐이며, 그것은 자율적으로 grounded된 조직 fact가
아니다.

#### Minimum future boundary

향후 `RebellionOrganizationDomain`은 최소한 organization actor/cell identity,
role 또는 relation identity, episode binding, 그리고 실제 조직 행위를
기록하는 typed action/event를 가져야 한다. 가능한 event 경계는
`ORGANIZATION_ACTIVITY_RECORDED`처럼 actor/issuer, subject/recipient,
source ActionRecord, observed tick, cause IDs를 명시하는 형태다. 이 event는
continuity score나 활동 강도를 저장하지 않고, 한 번의 관찰 가능한 typed
행위와 그 provenance만 기록한다.

### 6.2 `commandContinuity`

#### Required fact and legitimate actor

긍정적 evidence는 지도자 이름이나 Faction 전략 label이 아니라, 식별 가능한
command role/node가 명령을 발행하고 recipient가 수신·승계·수행할 수 있는
관계가 여전히 존재한다는 사실이다. 지도자 identity, successor claim,
command connectivity, role authority는 서로 다른 사실이며 하나의
`leadership` boolean으로 합치면 안 된다.

현재 `Government.authority`는 국가 정부의 분류이고, `Faction.currentStrategy`
는 heuristic action label이다. 둘 다 rebel command authority나 succession
provenance가 아니다. `militaryPower`, `influence`, active Conflict도 같은
이유로 command continuity를 입증하지 않는다.

#### Current verdict

`COMMAND_CONTINUITY_SOURCE: NEW_AUTHORITATIVE_DOMAIN_REQUIRED`

`FACTION_STRATEGY_CHANGED`를 command event로 재명명하거나
`currentStrategy === supportCoup` 같은 label을 command continuity로 매핑하는
것은 금지한다. 현재는 명시적 외부 input만 입력 경계로 남길 수 있고, 자동
producer는 새 domain 없이는 만들 수 없다.

#### Minimum future boundary

향후 `RebellionCommandDomain`은 command actor/role, issuer, recipient,
successor 또는 command-link identity, 그리고 발행·수신·승계 중 무엇을
기록하는지 명시하는 typed action/event를 가져야 한다. 예를 들어
`COMMAND_MESSAGE_ACKNOWLEDGED` 같은 event는 command relation을 증명할 수
있지만, actor identity와 recipient, source action/event, observed tick,
cause IDs 없이 단순 `leadership: true`를 쓰면 안 된다. 명령 event는
국가의 militaryPower를 변경하거나 Conflict outcome을 만들지 않는다.

### 6.3 `logisticsAccess`

#### Required fact and legitimate actor

긍정적 evidence는 faction resources가 충분하다는 뜻이 아니라, 특정 공급·
은신처·이동 경로·금융 또는 물자 channel에 실제 접근했거나 provider가
접근/이전을 허가했다는 사실이다. 공급 provider, recipient, route/sanctuary
owner, resource class와 실제 transfer 또는 permission이 분리되어야 한다.

현재 Region `resources`, `resourceProduction`, `scarcity`, `infrastructure`,
`ContactGraph` edge의 `effectiveStrength`, LandHex controller는 이런 transfer
또는 sanctuary contract를 갖지 않는다. `FUND_MOVEMENT`는 authored target
Region에 대한 faction resource earmark이며 arms/supply/sanctuary access가
아니다. 이를 logistics evidence로 재해석하면 FIX14 semantics를 훼손한다.

#### Current verdict

`LOGISTICS_ACCESS_SOURCE: NEW_AUTHORITATIVE_DOMAIN_REQUIRED`

ContactGraph 연결이나 LandHex 소유를 route access로 자동 승격할 수 없다.
현재 명시적 external input은 “외부에서 이 access fact를 주장한 input”일
뿐이며, simulation이 실제 route/transfer를 grounded하게 생성한다는 뜻이
아니다.

#### Minimum future boundary

향후 `RebellionLogisticsAccessDomain`은 episode, logistics actor/provider,
recipient, typed resource/access kind, route 또는 sanctuary identity,
permission/transfer action, source event를 연결해야 한다. `LOGISTICS_ACCESS_GRANTED`
또는 `SUPPLY_TRANSFER_RECORDED` 같은 event는 access가 발생한 discrete fact와
provenance만 저장하며 quantity, weight, score, remaining duration, decay를
evidence magnitude로 저장하지 않는다. route topology 자체는 access fact가
아니며, 실제 provider/recipient action 또는 explicit external issuer가
필요하다.

### 6.4 `externalSupport`

#### Required fact and legitimate actor

긍정적 evidence는 `foreignLinks[countryId]`가 아니라 식별 가능한 external
sponsor/provider가 어떤 support kind를 recipient rebellion actor에게
제공·허가했고 recipient가 그것을 받은 사실이다. State sponsor, diaspora,
refugee network, non-state organization은 서로 다른 actor class일 수 있으며,
`ActionRecord.source = llm`은 sponsor identity가 아니다.

최소한 sponsor/issuer, recipient, support kind, authorization 또는 transfer,
recipient acceptance, observed tick, source event가 필요하다. 현재
`FOREIGN_SUPPORT_SENT`는 event vocabulary에만 있고 accepted head에는 이를
생성하는 sponsor/recipient domain이 없다.

#### Current verdict

`EXTERNAL_SUPPORT_SOURCE: EXPLICIT_EXTERNAL_INPUT_ONLY`

현 scope에서는 player/heuristic/LLM이 common ActionProposal 경계를 통해
schema-valid external support assertion을 제출하는 것만 방어 가능하다.
그 input은 “외부 입력으로 주어진 사실”의 provenance이지, 외부 sponsor가
simulation에서 자율적으로 행동했다는 증명이 아니다. `foreignLinks`를 읽어
support event를 자동 생성하거나 channel authoring을 support delivery로
취급하지 않는다.

향후 autonomous external support를 요구하면 `ExternalSupportDomain`이
외부 actor identity, sponsor intent/authorization, recipient, support kind,
transfer/acceptance event를 소유해야 한다. 이 domain 없이는 현재 분류를
`CURRENT_AUTHORITATIVE_SOURCE_SUFFICIENT`로 올릴 수 없다.

## 7. Source-family evaluation

| Source family | Decision | Architecture reason |
| --- | --- | --- |
| A. 기존 Faction/Country/Region/LandHex/ContactGraph state의 deterministic inference | Reject | 각 값은 pressure, economy, territory, route 또는 continuity context이지 네 operational fact의 actor/action/provenance가 아니다. threshold나 조합식은 숨은 persistence score가 된다. |
| B. Intervention/Proposal/FUND_MOVEMENT/event relabeling | Reject | 각 lifecycle은 Country intervention, faction resource earmark, Government proposal, 또는 T018 crisis라는 고유 의미를 갖는다. 이름만 바꿔 operational evidence로 쓰면 기존 causal contract를 위반한다. |
| C. Random/time/cadence/countdown/decay | Reject and forbid | 시간 경과와 RNG는 누가 무엇을 했는지 설명하지 않는다. replay는 가능해도 causal evidence는 아니다. |
| D. Direct player choice of evidence existence | Reject as fact invention | 플레이어는 evidence의 존재를 임의로 선언할 수 없다. 다만 아래 E의 명시적 external input boundary는 허용한다. |
| E. Explicit external schema-valid input | Retain only as current external boundary | 입력은 common ActionProposal → accepted ActionRecord로 들어오고 source/action/event provenance를 남길 수 있다. 이는 autonomous grounding이나 내부 state mutation의 대체물이 아니다. |
| F. Channel-specific minimal authoritative domains | Select for future design | 조직·지휘·물류는 각 actor/relation/action domain이 필요하고, external support도 자율화하려면 sponsor/recipient domain이 필요하다. 먼저 domain contract를 설계한 뒤에만 writer를 검토한다. |
| G. One broad insurgent organization/logistics/support simulation | Defer | 문헌상 서로 연결되지만 actor, network, supply, sponsor, settlement까지 한 번에 만드는 것은 current scope를 넘어선다. 공통 evidence envelope는 재사용할 수 있어도 각 channel semantic domain은 분리한다. |

## 8. Player, heuristic, and LLM boundary

현재 허용되는 흐름은 다음과 같다.

```text
player / heuristic / LLM
  -> bounded ActionProposal
  -> acceptActionProposal()
  -> accepted ActionRecord
  -> (future typed source resolver only)
  -> GameEvent / evidence provenance
```

`ActionRecord.source`는 누가 input을 제출했는지 나타내는 envelope 값이지,
조직 actor, command issuer, logistics provider, external sponsor를 식별하지
않는다. LLM이나 heuristic은 prose로 cell, leader, route, sponsor, transfer를
발명할 수 없고 WorldState를 직접 바꿀 수 없다. 명시적 external input을
선택하더라도 “simulation이 관찰한 fact”와 “외부에서 제출된 fact”를
presentation과 audit에서 구분해야 한다.

## 9. Future evidence and replay contract

향후 어떤 channel이 구현되더라도 최소 envelope은 다음을 만족해야 한다.

```text
conflictId / episode identity
channelId / channel kind
actor or issuer identity
subject/recipient identity when distinct
source ActionRecord or existing typed event
GameEvent provenance
observedAtTick
causeIds containing only existing or same-step-known causes
idempotence key and duplicate rejection rule
```

추가 의미는 channel domain이 소유해야 한다. 예를 들어 organization actor,
command recipient, logistics route, external sponsor의 typed identity는
공통 evidence envelope만으로 발명하지 않는다.

Replay obligations:

- evidence action은 common ActionRecord intake를 거쳐야 한다.
- event ID, sequence, tick, actor/target, payload, cause IDs는 deterministic
  rule로 재생성되어야 한다.
- source action/event가 없는 evidence, forward cause, duplicate evidence,
  episode mismatch는 reject해야 한다.
- uninterrupted run과 save/load 후 같은 input은 같은 evidence history와
  EventStore를 만들어야 한다.
- insertion order, locale, wall-clock, RNG, timer, countdown, decay는 evidence
  존재를 결정하지 않는다.
- evidence writer는 LandHex controller, derived front, Conflict outcome,
  Government transition, RunOutcome, T022/T023, settlement/demobilization/
  suppression state를 직접 변경하지 않는다.
- evidence persistence는 settlement persistence가 아니다. 새 evidence
  domain이 생기더라도 FIX24에서 V8을 V9로 바꾸지 않는다.

## 10. Explicit architecture boundaries

- `REBELLION_STARTED + exact profile -> bootstrap episode`는 positive evidence가
  아니다.
- Faction `organization/resources/grievance/influence`, currentStrategy,
  foreignLinks에는 evidence threshold를 붙이지 않는다.
- ContactGraph edge는 logistics access가 아니고 LandHex/front는 logistics나
  organizational continuity가 아니다.
- `NO_ACTIVE_FRONT_EDGE -> peace`, `0 faction LandHex -> defeat`, 직접 Conflict
  delete/outcome, State Dissolution writer를 추가하지 않는다.
- settlement, demobilization, suppression/collapse closure는 이 task의 source
  grounding과 별도다.
- `T018` creation owner, T021 territorial authority, T022/T023 ownership,
  V8 persistence, Gate 1F `NOT_READY`, V02 `NOT_STARTED`를 유지한다.
- F05_FIX25를 시작하거나 self-authorize하지 않는다.

## 11. Claim-to-source ledger

| claim_id | claim | status | source_title | source_url_or_path | accessed | support | limitation | artifact_location |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L01 | 반란 조직의 resilience는 역할·사회 network·clandestine supply/information 구조와 연결된다 | Verified fact | Parkinson, *Organizing Rebellion* | [DOI](https://doi.org/10.1017/S0003055413000208) | 2026-08-26 | APSR article metadata와 abstract | 특정 TMR schema를 제공하지 않음 | §3, §6.1 |
| L02 | insurgent cohesion/collapse는 organization/network 유형과 전쟁 중 변화에 의존한다 | Verified fact | Staniland, *Networks of Rebellion* | [Publisher record](https://utpdistribution.com/9780801452666/networks-of-rebellion/) | 2026-08-26 | Cornell University Press distribution record | 서술적 비교 연구이며 game rule이 아님 | §3, §6.1 |
| L03 | leadership transition은 역할·관계·정보 흐름의 불확실성을 만든다 | Verified fact | Youngman and Moore, *Replacing the standard bearer* | [DOI](https://doi.org/10.1017/eis.2023.31) | 2026-08-26 | EJIS article and abstract | TMR의 command event contract를 직접 정의하지 않음 | §3, §6.2 |
| L04 | resource access에는 arms, safe haven, diplomatic support가 포함되고 접근은 변동한다 | Verified fact | Hazen, *What Rebels Want* | [DOI](https://doi.org/10.7591/cornell/9780801451669.001.0001) | 2026-08-26 | Cornell Scholarship Online abstract | aggregate `resources`와 typed transfer의 차이는 architecture inference임 | §3, §6.3 |
| L05 | external support는 state/non-state provider, support kind, safe haven/transit 등으로 분해된다 | Verified fact | Byman et al., RAND MR-1405 | [RAND PDF](https://www.rand.org/content/dam/rand/pubs/monograph_reports/2001/MR1405.pdf) | 2026-08-26 | RAND report contents and support requirements | policy report이며 TMR의 actor model이 아님 | §3, §6.4 |
| L06 | external support는 공급 측과 rebel의 수요·수용 측 및 cross-border linkage를 함께 요구한다 | Verified fact | Salehyan, Gleditsch, Cunningham, *Explaining External Support* | [DOI](https://doi.org/10.1017/S0020818311000233) | 2026-08-26 | *International Organization* abstract | correlation/conditions를 TMR outcome rule로 직접 사용하지 않음 | §3, §6.4 |
| L07 | FIX23 episode는 `REBELLION_STARTED` provenance만 보존하고 operational capacity를 주장하지 않는다 | Verified fact | Accepted FIX23 implementation | `src/sim/state/rebellionPersistence.ts`, `src/sim/systems/conflict.ts`, `docs/F05_FIX23_REBELLION_PERSISTENCE_RUNTIME_VERTICAL_SLICE.md` | 2026-08-26 | accepted head `82bb6018...` source and design doc | 현재 runtime의 positive evidence writer는 없음 | §4, §5 |
| L08 | current ActionRecord source는 player/heuristic/LLM input provenance이고 evidence actor가 아니다 | Verified fact | Action boundary | `src/sim/state/action.ts`, `src/sim/systems/actionResolution.ts`, `docs/ARCHITECTURE.md` | 2026-08-26 | common proposal intake and resolver | future source domain is not implemented | §5.2, §8 |
| L09 | 세 channel은 future domain, external support는 current explicit input only가 현재 최소 결론이다 | Recommendation | Repository audit + literature synthesis | `src/sim/state/*`, `src/sim/systems/*`, `docs/ARCHITECTURE.md` | 2026-08-26 | actor/action/provenance gaps remain after FIX23 | ChatGPT review is required before any implementation | metadata, §6, §10 |

## 12. Completion markers

F05_FIX24: COMPLETE / AWAITING_CHATGPT_REVIEW
NEXT_AUTHORIZED_TASK_ID: NONE
GATE1F_CHATGPT_DECISION: NOT_READY
V02: NOT_STARTED
