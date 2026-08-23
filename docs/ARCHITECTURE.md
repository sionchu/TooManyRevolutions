# Technical Architecture

## 1. Goals

The architecture must support:
- deterministic fast simulation,
- browser rendering,
- responsive UI,
- optional AI agents,
- replay/debugging,
- mobile performance,
- future WebGPU/experimental enhancement without core dependency.

Primary principle:

> **Simulation is authoritative; rendering and AI are clients of the simulation.**

---

# 2. Recommended Stack

## Client

- Vite
- React
- TypeScript
- Three.js
- React Three Fiber
- Drei where useful
- Zustand only for UI/client orchestration if needed

Do not put core simulation truth in React component state.

## Testing

- Vitest for unit/system tests
- Playwright for browser E2E/responsive tests

## AI backend

Preferred:
- server/serverless endpoint
- OpenAI Agents SDK or Responses/tool-calling compatible structured layer
- schema validation with Zod or equivalent

Never call model APIs with secret keys directly from the browser.

## Assets

- GLB/glTF
- glTF Transform optimization
- compressed textures
- instancing for repeated props/crowds

---

# 3. Directory Layout

```text
src/
├── app/
│   ├── App.tsx
│   ├── routes/
│   └── boot/
│
├── sim/
│   ├── core/
│   │   ├── tick.ts
│   │   ├── step.ts
│   │   ├── rng.ts
│   │   ├── clock.ts
│   │   └── invariants.ts
│   ├── state/
│   │   ├── action.ts
│   │   ├── country.ts
│   │   ├── contact.ts
│   │   ├── contactFixture.ts
│   │   ├── conflictFixture.ts
│   │   ├── foreignIdeologicalThreatFixture.ts
│   │   ├── government.ts
│   │   ├── region.ts
│   │   ├── ideology.ts
│   │   ├── ideologyFixture.ts
│   │   ├── faction.ts
│   │   ├── intervention.ts
│   │   ├── policy.ts
│   │   ├── policyFixture.ts
│   │   ├── conflict.ts
│   │   ├── run.ts
│   │   ├── scenario.ts
│   │   ├── territorialTopology.ts
│   │   ├── territorialControl.ts
│   │   └── world.ts
│   ├── systems/
│   │   ├── economy.ts
│   │   ├── contactGraph.ts
│   │   ├── policy.ts
│   │   ├── resources.ts
│   │   ├── ideologyState.ts
│   │   ├── ideologyDiffusion.ts
│   │   ├── factionPressure.ts
│   │   ├── actionResolution.ts
│   │   ├── intervention.ts
│   │   ├── interventionHooks.ts
│   │   ├── instability.ts
│   │   ├── diplomacy.ts
│   │   ├── foreignIdeologicalThreat.ts
│   │   ├── conflict.ts
│   │   ├── conflictResolution.ts
│   │   ├── victory.ts
│   │   ├── defeat.ts
│   │   └── stateDissolution.ts
│   ├── events/
│   │   ├── event.ts
│   │   ├── eventStore.ts
│   │   ├── causalGraph.ts
│   │   └── snapshots.ts
│   ├── readModels/
│   │   └── agenda.ts
│   ├── inspection/
│   │   ├── t020ForeignIdeologicalThreatInspection.ts
│   │   └── t021SimplifiedConflictInspection.ts
│   └── scenarios/
│
├── agents/
│   ├── schemas/
│   ├── observations/
│   ├── heuristics/
│   ├── client/
│   └── fallback/
│
├── presentation/
│   ├── presentationState.ts
│   ├── index.ts
│   └── v01PresentationInspection.ts
│
├── world/
│   ├── WorldCanvas.tsx
│   ├── camera/
│   ├── countries/
│   ├── regions/
│   ├── diorama/
│   └── fx/
│
├── ui/
│   ├── hud/
│   ├── inspector/
│   ├── sheets/
│   ├── lenses/
│   ├── causal/
│   └── responsive/
│
├── assets/
└── styles/
```

Server example:

```text
server/
├── agentDecision.ts
├── validation.ts
└── rateLimit.ts
```

Actual hosting structure may differ, but security boundary must remain.

---

# 4. State Model and Pre-Gate-1 Contracts

이 절은 Gate 1 코드가 의존할 권위 있는 도메인 경계다. 모든 상태는 class가 아닌 JSON 직렬화 가능한 데이터로 유지하며, 렌더러·UI·네트워크·LLM은 이를 직접 변경하지 않는다.

## 4.1 `ScenarioDefinition`과 `WorldState`

`ScenarioDefinition`은 불변의 시나리오 입력이다. 최소 소유 범위는 다음과 같다.

- `id`, `version`, `playerCountryId`, `initialDate`
- 초기 `Country`, `Region`, `Government`, `Faction`, `Conflict`, 국가별 `PolicyState`
- `ideologyCatalog` (`IdeologyDefinition` identity/content metadata), `policyCatalog` (`PolicyDefinition` 정적 데이터)
- `interventionCatalog` (`InterventionDefinition` 정적 개입 정의: 비용·행정 부담·기간·실제 prerequisite)
- 지역 노드와 명시적 `ContactEdgeDefinition`을 가진 `mapContactTopology`
- `mapTerritorialTopology` (`LandHexDefinition` 정적 identity/좌표/Region membership/terrain)
- `OrderConsolidationCriteria`, `DissolutionCriteria`

`initialRegions`의 `initialController`는 static seed input이다. run 생성 시 member
LandHex의 `WorldState.landHexStates`를 초기화하는 데만 사용하며, mutable
`WorldState.regions`에는 복사하지 않는다.

`WorldState`는 특정 실행에서 바뀐 값만 가진다. 카탈로그·연락망 정의·승패 기준은 넣지 않는다. 정책의 현재 활성 목록, 제정 tick, 해석된 제도 규칙은 `WorldState.policies` 안의 국가별 `PolicyState`가 소유한다.

```ts
interface WorldState {
  tick: number;
  date: SimDate;
  countries: Record<CountryId, Country>;
  regions: Record<RegionId, Region>;
  governments: Record<GovernmentId, Government>;
  factions: Record<FactionId, Faction>;
  conflicts: Record<ConflictId, Conflict>;
  interventionCommitments: Record<InterventionCommitmentId, InterventionCommitment>;
  contactEdgeStates: Record<ContactEdgeId, ContactEdgeRuntimeState>;
  landHexStates: Record<LandHexId, LandHexRuntimeState>;
  policies: Record<CountryId, PolicyState>;
  rngState: SeedState;
  run: RunState;
}
```

`createInitialWorldState(scenario, seed)`은 정적 초기 스냅샷을 새 실행 상태로 복사한다. Gate 0의 `FOUNDATION_SCENARIO`는 부트스트랩 전용이며, 첫 플레이 가능 데이터는 T025에서 만든다.

`ScenarioDefinition.mapContactTopology`는 정적 지도 연결만 소유한다. 각 `ContactEdgeDefinition`은 `fromRegionId -> toRegionId` 하나의 directed edge이며, 양방향 연결은 서로 다른 두 edge record로 표현한다. 연결 topology는 CountryId에 묶이지 않는다. 실행 중 연결의 폐쇄·감쇠·재활성화가 필요할 때만 `WorldState.contactEdgeStates`의 sparse runtime overlay를 사용한다.

`ScenarioDefinition.mapTerritorialTopology`는 정적 물리 영토 substrate를 소유한다. T017A의 최소 `LandHexDefinition`은 `id`, 정수 axial `coordinate`, 유효한 `regionId`, static `terrain`만 가진다. 물리 adjacency는 좌표와 LandHex 집합에서 pure helper로 derive하며 별도 adjacency truth를 저장하지 않는다. topology는 `WorldState`에 복사하지 않는다.

`ScenarioDefinition.interventionCatalog`도 동일한 static/runtime 경계를 따른다. 개입 정의는 실행 중 복사되지 않는다. `WorldState.interventionCommitments`에는 현재 실행 중인 commitment의 최소 runtime 사실만 저장하며, 완료된 개입의 전체 이력은 ActionRecord와 GameEvent가 소유한다.

### 4.1.1 Scenario cardinality is content

Scenario country count is content, not an engine invariant. 국가·Region·LandHex의
개수와 관계는 `ScenarioDefinition`의 collection이 결정하며, simulation phase는
특정 국가 수나 `1 Region = 1 LandHex`를 전제로 하지 않는다.

`1 Country = N Regions`, `1 Region = N LandHexes`가 유효한 시나리오 구조다.
새 국가·Region·LandHex·topology·controller·ContactGraph 및 관련 content
reference는 scenario/content 추가로 처리할 수 있어야 하며, 단순 cardinality
증가 때문에 두 번째 engine architecture를 만들지 않는다.

이는 runtime procedural country creation, generic nation spawner, DLC/mod SDK,
procedural generator, arbitrary hot-loading 또는 plugin framework를 요구하지
않는다. 현재 필요한 범위는 서로 다른 유효한 `ScenarioDefinition`이 engine의
cardinality 가정 때문에 깨지지 않는지 보장하는 것이다.

## 4.2 영토, 국가 연속성, 정부

- T017B 이후 `WorldState.landHexStates[LandHexId].controller`가 물리적 영토 통제의 유일한 writable authority다. controller는 `{ kind: "country", countryId }`, `{ kind: "faction", factionId }`, `{ kind: "uncontrolled" }` 중 하나다.
- `Region.ownerCountryId`는 법적/역사적 소유권이며 controller와 다를 수 있다. 외국 점령과 반란 통제를 이 차이로 표현한다.
- `Country.controlledRegions`는 저장하지 않는다. 지도·승리 조건·UI가 필요할 때 `deriveRegionControlSummary()` 및 country territorial projection에서 파생한다. 국가 aggregate의 baseline은 해당 국가가 Region의 모든 LandHex를 fully control하는 경우만 포함한다.
- `CountryId`는 국가의 역사적 연속성이다. `Country.currentGovernmentId`는 현재 중앙 정부만 가리키며, 정부가 없으면 `null`일 수 있다.
- `Government`는 국가와 별도 entity다. `central`·`contender`·`exile` 권위를 표현하지만 국가 자체를 대체하지 않는다.
- 정책/제도 상태는 국가별 `PolicyState`에 있다. `RegimeClassification`은 활성 정책과 policy catalog에서 계산하는 표현/역사 분류다. `Country`나 `Government`에 권위 있는 `regime` 필드를 저장하지 않는다.
- `ConflictOutcome`은 `governmentTransition`을 표현할 수 있다. 이 결과는 같은 `CountryId`의 `currentGovernmentId`만 바꾸며 자동 패배가 아니다. T017B 이후 실제 물리적 영토 변화는 `LandHexRuntimeState.controller`에서 표현하고, Region/Country의 영토 통제 상태는 LandHex 상태에서 파생한다.
- `ConflictStatus`에는 `terminal`이 없다. terminal은 갈등 상태가 아니라 Run outcome의 의미다.

`RegimeClassification`의 player-facing taxonomy 최종 항목 수는 아직 LOCK되지
않았다. 분류 항목은 실제 institutional rule 조합에서 파생되는 역사적
표현이며, authoritative progression tree나 해금 순서가 아니다. 이 미결정
상태는 기존 derived-regime 계약을 변경하지 않는다.

경계 불변식은 controller/owner/정부/수도/세력/갈등 참조의 foreign key를 검증한다. 다만 owner와 controller의 동일성은 강제하지 않는다.

### 4.2.1 Territorial Topology 계약 — Region과 LandHex

T017A는 정적 두 공간 계층의 substrate를 추가했고, T017B는 그 위에 동적
LandHex authority를 연결했다. 현재 runtime 계약은
`WorldState.landHexStates[*].controller`가 sole writable physical authority라는
것이다.

#### Region

`Region`은 정치·경제·사회 시뮬레이션의 집계 단위다.

Region 수준에서 유지하는 상태는 다음과 같다.

- population
- production
- resources / scarcity
- ideology support / radicalism / organization
- faction pressure
- instability
- regional political state

Region은 현실의 주/도/지방에 가까운 영역이며,
하나의 Region이 하나의 시각적 HEX라는 가정은 사용하지 않는다.

예:

- 왕도권
- 서부 해안주
- 동부 철산주
- 남부 곡창주
- 북부 변경주

항구, 광산, 농장, 도시, 요새 등은 Region 자체가 아니라
Region 내부의 POI 또는 지역 특성으로 표현할 수 있다.

#### LandHex

T017A에서 하나의 Region은 여러 `LandHex`로 구성될 수 있다.

`LandHex`는 다음을 위한 정적 영토 공간 단위다. T017A에서 identity/topology를
제공했고 T017B에서 runtime controller projection을 연결했다.

- physical adjacency
- terrain
- future movement
- future roads / rivers
- future fortifications / POI placement
- future military or revolutionary occupation
- future front lines
- future territorial controller

정치·경제·이념의 전체 상태를 LandHex마다 복제하지 않는다.

핵심 구조는 다음과 같다.

`Region = political/economic/social simulation aggregate`

`LandHex = territorial/movement/control substrate`

#### Static topology and runtime territorial state

정적인 territorial topology와 실행 중 territorial authority는 `ScenarioDefinition`과
`WorldState`로 분리한다.

`ScenarioDefinition`의 확정 schema는 다음과 같다.

`LandHexDefinition`

- id
- `regionId`
- integer axial `coordinate: { q, r }`
- terrain
- adjacency is derived from coordinates; no duplicate adjacency field

T017B의 runtime schema는 다음과 같다.

`LandHexRuntimeState`

- controller
- occupation / contested state if authoritative state is required
- dynamic fortification/damage state if later systems require it

소유 경계는 다음과 같다.

`ScenarioDefinition.mapTerritorialTopology`
→ static `LandHexDefinition`

`WorldState`
→ `landHexStates: Record<LandHexId, LandHexRuntimeState>`

시나리오의 `ScenarioRegion.initialController`는 run 생성 시 같은 Region의 모든
LandHex runtime state를 seed하는 static initialization input일 뿐이다. 초기화가
끝나면 runtime `Region`에는 `controller` 필드가 없으며, seed를 mirror하지 않는다.
runtime map은 LandHex ID와 controller만 저장하고 static topology를 복사하지 않는다.

정적 terrain/topology 정의 전체를 `WorldState`에 복사하지 않는다. topology validation은
duplicate LandHexId, duplicate integer coordinate, invalid RegionId, invalid terrain을
거부한다. 전역 연결성이나 Region 내부 contiguous 조건은 강제하지 않는다.

#### Territorial authority migration

T017B COMPLETE:

`WorldState.landHexStates[*].controller`
→ sole writable physical territorial authority
→ `deriveRegionControlSummary()`
→ country-level territorial projections

`deriveRegionControlSummary()`는 하나의 controller 값으로 Region을 축약하지 않는다.

최소한 다음 상태를 표현할 수 있어야 한다.

- fully controlled
- partially occupied
- contested
- faction/rebel presence
- uncontrolled

`RegionControlSummary`는 controller별 LandHex count/share와
`fullyControlledByCountryId`, `fullyControlledByFactionId`를 제공한다.
`partial`, `contested`, `factionPresence`, `uncontrolled`는 하나의 controller로
축약하지 않은 derived 결과다. LandHex 하나에는 한 시점에 하나의 controller만 있다.

migration 이후에는 물리적 영토 통제를 Country, Region, LandHex에
각각 독립적으로 저장하지 않는다. `Region.stateControl`은 행정 집행력이고
`Region.ownerCountryId`는 법적/역사적 소유권이므로 둘 다 physical controller의
mirror 또는 alias가 아니다.

#### Existing Region.controller consumer migration

T017B는 기존 Region controller consumer를 새 territorial projection/selector로
명시적으로 migration했다. runtime domain type에서 `Region.controller`를 제거했으며,
legacy convenience field로 복제하거나 읽지 않는다.

최소 대상:

- `Country.controlledRegions` 파생
- economy의 controlled-region production/income aggregation
- `deriveCountryIdeology`
- `deriveCountryContacts`
- conflict territorial-control writer seam (`changeLandHexController`)
- victory / dissolution의 영토 통제 판정 seam (`getFullyControlledRegionIds`)
- `LAND_HEX_CONTROL_CHANGED` event

부분 점령이 도입되므로 각 downstream system이 어떤 territorial projection을
필요로 하는지 명시적으로 선택해야 한다.

#### Legal ownership, territorial control, political influence

다음 세 개념은 서로 독립적이다.

1. 법적/역사적 소유권
2. 실제 영토 통제
3. 정치적 영향

예:

- legal owner: Player Kingdom
- territorial controller: Revolutionary Faction
- dominant political influence: Communism

또는:

- legal owner: Player Kingdom
- territorial controller: Player Kingdom
- dominant political influence: Republicanism

정치적 영향의 변화만으로 territorial controller가 자동 변경되지 않는다.

반대로 군사 점령으로 controller가 바뀌어도
해당 지역 주민의 기존 정치사상 지지가 자동으로 사라지지 않는다.

#### Administrative stateControl vs territorial controller

`Region.stateControl`과 territorial `controller`는 서로 다른 authoritative concept이다.

`LandHex.controller`는 물리적 영토 통제를 표현한다.

`Region.stateControl`은 해당 Region에서 국가기관이 실제로 법, 치안, 조세,
행정 명령 등을 집행할 수 있는 정도를 나타내는 0–1 normalized metric이다.

따라서 다음 상태가 유효하다.

- 모든 LandHex가 Player Kingdom의 통제
- `Region.stateControl = 0.25`

이는 영토를 군사적으로 보유하고 있지만 행정력이 약한 변경 지역 등을 표현한다.

반대로 높은 `stateControl`은 LandHex의 법적 소유권이나 territorial controller를
자동으로 변경하지 않는다.

Do not derive `Region.stateControl` directly from LandHex ownership/control alone.
Territorial occupation may become one input to later state-control rules, but the two values are not aliases.

#### TerritorialTopology와 ContactGraph

두 그래프는 별개의 시스템이다.

`TerritorialTopology`는 다음을 표현한다.

- physical adjacency
- movement
- invasion routes
- occupation
- front lines

`ContactGraph`는 다음을 표현한다.

- trade
- information
- migration
- ideological/social contact

따라서 물리적으로 인접한 Region 사이의 정보 접촉이 약할 수도 있고,
멀리 떨어진 두 항구가 강한 무역·정보 연결을 가질 수도 있다.

한 그래프를 다른 그래프에서 자동 생성하지 않는다.

## 4.3 승리와 패배의 소유권

`ScenarioDefinition.orderConsolidationCriteria`는 필요 안정 지역, 선택적인 scenario-owned `maximumStableRegionUnrest`, 핵심 지역 및 수도 통제, 최소 국가역량, 최소 국고, 활성 내전 금지, 유지 tick 수를 정의한다. `ScenarioDefinition.dissolutionCriteria`는 국가 존속 임계값, 완전 병합, 영구 분열, 필요한 주권 기능의 상실을 정의한다.

`RunState`에는 기준값을 복사하지 않는다. 오직 현재 `consolidation` 진행과 typed `outcome`만 가진다.

```ts
type RunOutcome =
  | { status: "active" }
  | { status: "won"; kind: "orderConsolidated"; ... }
  | { status: "defeated"; kind: "stateDissolved"; ... };
```

따라서 패배 variant는 `stateDissolved` 하나뿐이다. 혁명·쿠데타·선거·왕조 붕괴·정부 교체는 국가 소멸 판정이 없는 한 실행을 끝내지 않는다. T022/T023이 이 기준을 실제로 평가한다.

T022에서 `requiredStableRegionIds`는 개수로 환산하는 일반 지역 수가 아니라
시나리오가 지정한 Region ID 집합이다. 각 항목은 현재
`WorldState.landHexStates[*].controller`에서 파생한 player Country의 full-control을
만족해야 한다. `maximumStableRegionUnrest`가 명시된 경우에만 해당 Region의
`unrest <= threshold`를 추가로 검사한다. 값이 생략된 기존 bootstrap/fixture에는
숨은 전역 불안 threshold를 적용하지 않는다. `requiredControlledCoreRegionIds`도
같은 LandHex-derived full-control 의미를 사용하며 `ownerCountryId`나
`contestedRegionIds`를 대체 authority로 사용하지 않는다.

## 4.4 Metric Contract

밸런스 값이나 효과량은 아직 정하지 않는다. 아래 계약은 숫자의 의미·범위·소유자만 고정한다. `canonical simulation step`의 해당 phase가 값의 유일한 writer이며, UI/AI/network는 숫자를 clamp하거나 직접 수정하지 않는다. 각 phase는 commit 전 범위를 보장하고 `assertWorldStateInvariants`가 최종 경계 검증을 한다.

| 필드 | 한국어 표기 | canonical 단위/범위 | 음수 | 정규화 | 주 소유 phase | clamp/validation |
|---|---|---|---:|---|---|---|
| `treasury` | 국고 | 시나리오 화폐의 절대 stock, 유한값, 상한 없음 | 허용 | 절대값 | economy | 상한/하한 clamp 없음; finite 검증 |
| `dailyIncome` | 일일 수입 | 하루당 절대 화폐 flow, 0 이상 | 불가 | 절대값 | economy | 0 하한, step 경계 검증 |
| `dailyExpenditure` | 일일 지출 | 하루당 절대 국가 지출 flow, 0 이상 | 불가 | 절대값 | scenario/향후 명시적 제도 규칙 | 0 하한, step 경계 검증 |
| `legitimacy` | 정통성 | 0–100 국가 지수 | 불가 | 0–1이 아닌 지수 | instability 및 명시적 제도 전환 | 0–100 clamp, step 경계 검증 |
| `stateCapacity` | 국가역량 | 0–100 국가 지수 | 불가 | 0–1이 아닌 지수 | institution/policy | 0–100 clamp, step 경계 검증 |
| `production` | 생산 | 하루당 절대 산출 단위, 0 이상 | 불가 | 절대값 | economy | 0 하한, step 경계 검증 |
| `militaryPower` | 군사력 | 0–100 상대 전력 지수 | 불가 | 0–1이 아닌 지수 | conflict/defense | 0–100 clamp, step 경계 검증 |
| `instability` | 불안 | 0–100 국가 지수 | 불가 | 0–1이 아닌 지수 | instability | 0–100 clamp, step 경계 검증 |
| `stateContinuity` | 국가 존속 | 0–100 국가 존속 지수; 시나리오 임계값과 비교 | 불가 | 0–1이 아닌 지수 | 명시적으로 근거가 있는 continuity evidence writer가 생길 때만 변경; 현재 production writer 없음; T023은 읽기만 함 | 0–100 clamp, step 경계 검증 |

보조 핵심 수치는 아래를 따른다.

| 영역 | 필드 | canonical 단위/범위 | 소유/검증 |
|---|---|---|---|
| Region | `population` | 0 이상 절대 인구 수 | demographic/economy; non-negative |
| Region | `urbanization`, `accessibility`, `stateControl`, `infrastructure`, `scarcity`, `unrest` | 각각 독립된 0–1 normalized 값 | 해당 지역 phase; 0–1 clamp |
| Region | `resources` | 자원별 0 이상 절대 local stock | resource; 0 하한 |
| Region | `resourceProductionCapacity` | 자원별 하루당 0 이상 절대 생산 capacity | scenario/명시적 intervention completion effect; economy/resources는 읽기 | 0 하한 |
| Region | `resourceProduction` | 자원별 최근 완료 tick의 0 이상 절대 실제 생산 | resources | 0 하한; capacity 초과 금지 |
| Region | `resourceDemand` | 자원별 하루당 0 이상 절대 수요 | scenario/향후 명시적 경제 규칙; T011은 읽기 | 0 하한 |
| Region | `production` | 하루당 0 이상 절대 산출 | economy; 0 하한 |
| Ideology | `support`, `radicalism`, `organization` | 각각 독립된 0–1 normalized 값 | T013/T015; 0–1 clamp, 세 값은 서로 대체하지 않음 |
| Faction | `resources` | 0 이상 절대 정치 자원 | faction system; 0 하한 |
| Faction | `organization`, `influence`, `grievance`, `ideologyAffinity`, `foreignLinks` | 각각 0–1 normalized 값 | faction/diplomacy inputs; 0–1 clamp |
| Scenario contact | `baseStrength` | 0–1 normalized 정적 연결 강도 | T014 scenario validator; run state에는 정적 정의를 복사하지 않음 |
| World contact runtime | `enabled`, `multiplier`, optional `blockedReason`, optional `blockedByCountryId` | enabled는 boolean, multiplier는 0 이상 finite; effective strength는 0–1; `blockedByCountryId`는 알려진 Country를 가리킴 | diplomacy/action phase; T014 query와 invariants가 구조 검증 |

이념별 `support`는 **비배타적 중첩 지지**다. 합계가 1일 필요가 없고, 한 사람이 여러 경향에 공감할 수 있다는 추상화다. T013은 support를 자동 재분배하거나 정규화하지 않는다.

---

# 5. Authoritative Tick Contract

## 5.1 시간 단위와 달력

- 권위 있는 simulation tick은 **하루**다.
- 달력은 12개월 × 30일, 즉 1년 360일이다. 윤년·계절 세부 규칙은 아직 없다.
- `tick`은 완료된 하루 수다. 초기 상태는 `tick = 0`, `year 1 / month 1 / day 1`이고, tick 1을 완료하면 날짜는 `year 1 / month 1 / day 2`다.
- 렌더 frame, UI 배속, wall clock은 tick을 바꾸지 않는다. T041 scheduler만 wall-clock budget에 따라 이 계약의 step을 여러 번 호출할 수 있다.

## 5.2 phase 순서와 쓰기 권한

기존 권장 pipeline을 유지하되, 입력 해소와 이벤트 할당을 명시적으로 분리한다. 이벤트는 마지막에 임의로 만들어지지 않는다. 각 phase는 순서대로 event buffer에 이벤트를 배출하고, 뒤 phase만 이미 배출된 event를 `causeIds`로 참조할 수 있다. T010에서는 `SIMULATION_PHASE_ORDER`가 이 순서의 단일 source of truth이며, phase 목록을 바꾸려면 이 tuple과 순서 회귀 테스트를 함께 바꿔야 한다.

```text
Action intake/validation (step 밖의 staging)
  -> terminal gate
  -> applyScheduledEffects
  -> resolveValidatedActions
  -> economy
  -> resources
  -> ideologyDiffusion
  -> factionPressure
  -> instability
  -> diplomacy
  -> conflict
  -> evaluateOrderConsolidationAndDissolution
  -> closeDay (tick/date advance, event buffer close)
  -> eventFinalization (event buffer validation/finalization; no new events)
  -> snapshotHook (read-only snapshot observation hook)
  -> atomic run-record commit
```

| phase | 직접 변경 가능한 권위 상태 | 금지/비고 |
|---|---|---|
| `applyScheduledEffects` | 이미 예약된 효과와 그 대상의 명시적 상태; 완료된 intervention commitment 제거 | `InterventionDefinition.completionEffects`가 있으면 completion tick에 typed concrete delta를 정확히 한 번 적용하고 완료 event에 기록한다. 미래의 신규 행동을 추측하지 않으며, 완료 event 이후 같은 tick action이 해제된 load를 사용할 수 있음 |
| `resolveValidatedActions` | `PolicyState`, `Government`, intervention commitment의 시작/거부 | 개입 시작은 commitment와 event만 만들고 `Country.treasury`를 직접 쓰지 않음; 숫자 core metric을 직접 보너스처럼 바꾸지 않음 |
| `economy` | `Country.treasury`, `Country.dailyIncome`, `Country.production`, `Region.production`; 같은 tick accepted intervention cost 정산 | 국고의 유일한 writer; 자원별 stock/actual production/scarcity는 다음 phase의 소유 |
| `resources` | `Region.resourceProduction`, `Region.resources`, `Region.scarcity` | 이념/세력 수치 직접 변경 금지 |
| `ideologyDiffusion` | `Region.ideology` at the configured `PoliticalCadence` boundary | phase는 매일 호출되며 non-boundary day에는 no-op; T015가 contact edge를 통한 실제 확산을 소유 |
| `factionPressure` | accepted faction `ActionRecord`가 해소될 때 `Faction.currentStrategy`만 변경; 월간 heuristic은 read-only `ActionProposal`을 반환 | 새 heuristic proposal은 WorldState/actionLog를 직접 변경하지 않음; `Country.instability`, `Region.unrest`, `Region.ideology`, 자원·외교·영토·승패는 변경 금지 |
| `instability` | 매일 `Region.unrest`와 이를 집계한 `Country.instability` | T017 baseline은 `Country.legitimacy`를 쓰지 않으며, conflict/승패 직접 판정·단일 unrest trigger 금지 |
| `diplomacy` | accepted T019 outgoing `CLOSE_BORDER`/`REOPEN_BORDER`와 T020 direction-explicit incoming restriction/restore가 directed `contactEdgeStates`의 enabled 상태를 변경; monthly foreign `ActionProposal` 생성 | static ContactGraph/TerritorialTopology 변경 금지; reverse edge·영토·제도·경제 직접 변경 금지; `WAIT`는 event 없는 no-op |
| `conflict` | `Conflict`, `LandHexRuntimeState.controller` through the typed territorial mutation seam, `Government`, continuity evidence inputs (read-only) | T018 crisis detection과 T021 active armed conflict resolution을 소유; front는 derived이고 `CountryId`를 교체하지 않으며, internal-rebellion displacement만으로 `stateContinuity`를 쓰지 않음 |
| `evaluateOrderConsolidationAndDissolution` | `RunState.consolidation`, `RunState.outcome` | criteria는 읽기 전용 ScenarioDefinition |
| `closeDay` | `tick`, `date`, `nextEventSequence` | 도메인 규칙을 새로 해소하지 않음 |
| `eventFinalization` | 현재 step의 event buffer 확정에 필요한 내부 값 | 새 gameplay event를 만들지 않으며 WorldState 도메인 값을 쓰지 않음 |
| `snapshotHook` | 없음; 확정 후보를 관찰하는 hook | WorldState와 event buffer를 mutate하지 않음 |

T010 구현은 `runSimulationStep(world, input, hooks)` 하나를 authoritative step 진입점으로 둔다. `SimulationStepInput.actions`는 이미 검증된 accepted record만 받으며, `world.run.nextActionSequence`부터 빈틈없이 이어지고 현재 step의 `world.tick + 1`을 대상으로 해야 한다. 입력 배열 순서가 실행 순서이며, step 시작 시 action log에 불변 방식으로 append된다.

각 `SimulationPhaseHook`은 현재 phase의 `WorldState`와 누적 event buffer를 읽고 다음 구조적 `WorldState`, 새 event, 다음 event sequence를 반환한다. decision phase는 선택적으로 다음 intake를 위한 `ActionProposal[]`을 함께 반환할 수 있지만, proposal은 action log나 WorldState가 아니다. 일반 no-op hook은 같은 world reference와 빈 event 목록을 반환하고, T016 `factionPressure`와 T019 `diplomacy` hook만 monthly boundary에서 proposal을 반환할 수 있다. `tick`과 `date`는 `closeDay`의 내장 처리만 변경할 수 있으며, 다른 phase가 clock을 전진시키면 step이 실패한다. `eventFinalization`과 `snapshotHook`은 infrastructure hook이므로 기본 구현은 no-op이고 새 event를 배출할 수 없다.

정책 resolver는 정적 catalog를 필요로 하므로 `ScenarioDefinition`을 명시적으로 캡처한 `createPolicyPhaseHook(scenario)`로 `resolveValidatedActions` hook에 주입한다. 전역 scenario registry를 두거나 정적 catalog를 `WorldState`에 복사하지 않는다. 이 주입은 기존 T010의 `runSimulationStep(world, input, hooks)` 경계를 유지하면서도 replay에 필요한 scenario id/version 검증을 가능하게 한다.

이 경계는 economy·확산·세력·외교·갈등 로직을 선행 구현하지 않는다. 실제 snapshot/persistence와 `RunRecord`의 원자 commit은 T024 범위이며, T010은 그 직전에 사용할 순수 `SimulationStepResult`와 hook 경계만 제공한다.

## 5.3 terminal run

`RunOutcome.status !== "active"`이면 새 simulation step은 열리지 않는다. T010의 `runSimulationStep`은 phase를 실행하지 않고 동일한 `WorldState`, 빈 event 목록, 빈 `actionProposals`를 반환한다. 따라서 date/tick/RNG/action log/도메인 상태가 변하지 않고 GameEvent도 배출하지 않는다. terminal 이후 도착한 proposal을 `validationOutcome = rejected`로 별도 append-only intake log에 남기는 것은 command gateway의 책임이며, terminal `SimulationStep` 안에서 WorldState를 mutate하는 동작이 아니다.

## 5.4 T011 economy and resource contract

T011은 Victoria-style commodity market가 아니라 하루 단위의 작은 압력 substrate다. 초기 사용 자원은 `food`, `material`, `mana`이며, 기존 `ResourceType`의 `arms` 슬롯은 T011 fixture에서 사용하지 않는다. 가격, 임금, 기업, 무역시장, 정책 보너스, 이념·불안 효과, random variation은 이 작업의 범위가 아니다.

Region의 자원 상태는 다음 네 값으로 분리한다.

```ts
interface Region {
  resources: ResourceStock;
  resourceProductionCapacity: ResourceStock;
  resourceProduction: ResourceStock;
  resourceDemand: ResourceStock;
  production: number;
  scarcity: number;
}
```

- `resourceProductionCapacity`: 하루에 생산할 수 있는 자원의 절대 상한이다. T011은 scenario 초기 입력을 읽고, F03A의 작은 typed completion effect가 명시한 경우에만 completion tick에서 immutable replacement로 값을 바꿀 수 있다. economy/resources는 결과를 읽고 각자의 output/scarcity를 계산한다.
- `resourceProduction`: 가장 최근 완료 tick에서 실제로 생산한 자원이다. T011은 capacity를 그대로 actual output으로 사용한다.
- `resources`: 소비 후 남은 지역 stock이다. 국가 전체 resource stock은 T011에서 추가하지 않는다.
- `resourceDemand`: 하루 소비 수요다. T011에서는 scenario initial snapshot의 입력값으로 읽는다.
- `production`: 해당 Region의 자원 actual output 합계이며, economy phase가 다음 식으로 갱신한다.

```text
Region.production = Σ resourceProductionCapacity
```

`resources` phase의 계산은 자원별로 다음과 같다.

```text
actualProduction = resourceProductionCapacity
availableSupply = previousStock + actualProduction
nextStock = max(0, availableSupply - demand)
shortage = max(0, demand - availableSupply)
```

지역 `scarcity`는 모든 자원의 수요 가중 shortage 비율이다. 총 수요가 0이면 0이며, 그 외에는 다음 범위로 제한한다.

```text
scarcity = Σ shortage / Σ demand
```

따라서 공급이 수요 이상이면 false scarcity가 생기지 않고, 수요가 공급을 초과한 만큼만 0–1 범위로 나타난다. `scarcity`는 resources phase만 쓴다. T011은 이를 불안·급진화·이념 지지로 변환하지 않는다.

Country 집계는 `getFullyControlledRegionIds(scenario, world, countryId)` projection만
읽는다. 부분 점령·contested·faction presence Region은 Hex 단위 인구/생산 분할을
선행하지 않으므로 어떤 국가 aggregate에도 포함하지 않는다.

```text
Country.production = Σ Region.production
  where Region ∈ fullyControlledRegionIds(Country.id)

Country.dailyIncome = Country.production × 1
Country.treasury(next) = Country.treasury
  + Country.dailyIncome
  - Country.dailyExpenditure
  - acceptedInterventionCost(nextTick)
```

`acceptedInterventionCost(nextTick)`는 해당 tick의 `resolveValidatedActions`가 만든 commitment 중 현재 입력 ActionRecord에서 유래한 정적 정의 비용의 합이다. action resolver는 같은 tick의 affordability 판단을 위해 projected treasury reservation만 추적하고, 실제 `Country.treasury` 변경은 economy phase가 한 번만 수행한다. 거부된 action은 commitment와 비용이 모두 없다. baseline의 음수 국고 허용은 유지하지만 신규 비용은 action 시작 시점의 현재/예약 국고가 충분해야 한다.

`dailyExpenditure`는 시나리오가 제공하는 음수가 아닌 절대 일일 지출이며, T011 economy phase는 이를 변경하지 않는다. `dailyIncome`는 economy phase가 계산하는 음수가 아닌 절대 flow다. 국고는 음수가 될 수 있고, T011은 negative treasury를 terminal defeat나 instability로 바꾸지 않는다. 순수한 재정 압력은 `dailyExpenditure - dailyIncome`으로 파생한다.

통제되지 않은 Region도 자신의 local production/stock/shortage를 계산할 수 있지만, 해당 output은 어떤 국가의 `Country.production`이나 `dailyIncome`에도 포함하지 않는다. 법적 소유권 `ownerCountryId`는 이 집계에 사용하지 않는다.

T011 economic events는 작은 state transition 단위로만 배출한다.

- `NATIONAL_PRODUCTION_CHANGED`: 국가 생산이 바뀔 때
- `TREASURY_CHANGED`: 국가 국고가 바뀔 때. 일반 flow는 앞서 배출된 production event를, intervention cost가 포함되면 같은 step의 앞서 배출된 `INTERVENTION_STARTED`와 production event를 `causeIds`로 참조한다.
- `RESOURCE_PRODUCED`: 실제 자원 output이 이전 tick과 달라지고 양수가 될 때
- `RESOURCE_SHORTAGE_CHANGED`: 지역 scarcity가 바뀔 때. 같은 resources phase에서 실제로 배출된 production event만 원인으로 사용할 수 있다.

변화가 없는 매일의 자원 output은 event를 반복 배출하지 않는다. 모든 국가·지역은 ID 정렬, 자원은 `RESOURCE_TYPES` 고정 순서로 처리해 event sequence를 결정론적으로 유지한다.

---

# 6. Deterministic Input, Step, and Commit Boundary

모든 player·heuristic·LLM 행동은 같은 append-only `ActionRecord`에 들어간다.

```ts
interface ActionRecord {
  id: ActionId;
  tick: number;
  sequence: number;
  source: "player" | "heuristic" | "llm";
  actionType: string;
  payload: JsonValue;
  schemaVersion: number;
  validationOutcome: { kind: "accepted" } | { kind: "rejected"; reason: string };
}
```

결정 주체가 만든 구조화 proposal은 먼저 다음 공통 shape를 사용한다.

```ts
interface ActionProposal {
  tick: number;          // 다음 authoritative step의 target tick
  source: "player" | "heuristic" | "llm";
  actionType: string;
  payload: JsonValue;
  schemaVersion: number;
}
```

`acceptActionProposal`/`acceptActionProposals`가 이 proposal을 deterministic action ID와 global `sequence`를 가진 accepted `ActionRecord`로 바꾼다. 그 record만 다음 `SimulationStepInput.actions`에 들어간다. `SimulationStepResult.actionProposals`는 현재 step에서 나온 proposal을 다음 intake로 넘기는 read-only 출력이다. 따라서 heuristic이 phase 안에서 `WorldState.run.actionLog`를 우회 append하거나 UI/network callback에서 faction 상태를 바꾸는 경로는 없다.

- `sequence`은 실행 전체에서 0부터 빈틈없이 증가하는 유일한 행동 순서다. `tick`은 non-decreasing이어야 한다.
- 단일 command gateway가 action intake 순서를 확정한다. replay는 네트워크 도착 시간이나 UI event loop를 다시 해석하지 않고 기록된 `sequence`만 사용한다.
- 검증 거부도 기록한다. `ValidatedActionRecord`만 `SimulationStepInput.actions`로 전달된다.
- UI, browser network handler, heuristic, LLM, server 응답은 `WorldState`를 직접 mutate하지 않는다. 모두 action proposal 또는 `ActionRecord`를 제출한다.

단일 step의 개념적 경계는 다음과 같다.

```text
staged ActionRecord validation
  -> SimulationStepInput(accepted actions)
  -> simulation step
  -> SimulationStepResult(nextWorld, emittedEvents, actionProposals)
  -> atomic SimulationStepCommit(RunRecord)
```

proposal은 같은 step에서 자동 실행되지 않으며, command gateway가 검증·수락한 뒤 다음 target tick의 `SimulationStepInput`에 넣는다. `factionPressure`가 accepted faction action을 해소해 `currentStrategy`를 변경할 때만 `FACTION_STRATEGY_CHANGED`를 배출한다.

T016B의 `START_INTERVENTION`도 같은 envelope를 사용한다. payload는 `{ interventionId, countryId? }`로 제한하며, resolver는 input sequence를 따라 feasibility를 평가하고 `INTERVENTION_STARTED` 또는 `INTERVENTION_REJECTED`를 배출한다. accepted action은 `WorldState.interventionCommitments`에만 시작 사실을 추가하고, same-tick projected treasury reservation은 economy settlement를 위한 내부 파생값이다. player·heuristic·LLM source 사이에 별도 intervention queue를 만들지 않는다.

원자 커밋은 새 `WorldState`(안의 action log 포함)와 event store를 함께 보이게 하거나, 둘 다 보이지 않게 해야 한다. 실제 persistence/snapshot I/O는 T024의 범위다.

---

# 7. Event Order and Causal Graph

`GameEvent`는 `tick` 외에 실행 전체에서 증가하는 `sequence`을 가진다. event ID는 호출자가 임의로 정하지 않고 다음 규칙으로 만든다.

```text
event:${tick}:${sequence}:${type}
```

`sequence`이 실행 내에서 유일하므로 이 ID는 동일 replay에서 재현 가능하고 실행 내 충돌이 없다. `EventStore`는 ID 규칙, 엄격히 증가하는 sequence, non-decreasing tick, 중복 ID를 검증한다.

`causeIds`는 이미 buffer/store에 존재하는 event ID만 가리킨다. 같은 step에서 later phase가 earlier phase event를 원인으로 쓸 수 있지만, 미래 event나 동시 미할당 event를 원인으로 쓰면 안 된다. 따라서 WHY는 사후 prose가 아니라 당시 확정한 causal chain을 읽는다.

의미 있는 변화는 event를 낸다. 대표 type은 `POLICY_ENACTED`, `IDEOLOGY_DIFFUSED`, `IDEOLOGY_SUPPORT_CHANGED`, `SUPPORT_SHIFTED`, `LAND_HEX_CONTROL_CHANGED`, `CONFLICT_RESOLVED`, `GOVERNMENT_TRANSITIONED`, `CIVIL_WAR_STARTED`, `ORDER_CONSOLIDATION_STARTED`, `ORDER_CONSOLIDATED`, `STATE_DISSOLVED`다. Region summary와 conflict front는 derived read model이며 별도 authoritative control event를 만들지 않는다.

T016B는 `INTERVENTION_STARTED`, `INTERVENTION_REJECTED`, `INTERVENTION_COMPLETED`를 추가한다. 시작/거부 event는 현재 action resolution 안에서 생성되고 같은 step의 뒤 phase가 참조할 수 있다. 완료 event는 이전 tick의 시작 event를 가장하지 않으며, 현재 WorldState가 가진 commitment/source action payload를 기록하고 `causeIds: []`를 사용한다. 하루별 progress event는 만들지 않는다.

---

# 8. Policy Engine

## 8.1 T012 policy rule engine contract

정책은 `ScenarioDefinition.policyCatalog`가 소유하는 직렬화 가능한 `PolicyDefinition`이다. 정의에는 identity/name/description/domain, declarative `ruleMutations`, 간단한 `prerequisites`, `incompatiblePolicyIds`만 들어간다. 함수, closure, 임의의 metric delta, LLM 결과는 scenario data에 들어가지 않는다.

실행 중인 국가의 `PolicyState`는 다음 세 가지 mutable 사실만 기록한다.

```ts
interface PolicyState {
  activePolicyIds: readonly PolicyId[];
  enactedAtTick: Readonly<Record<PolicyId, number>>;
  institutionalRules: InstitutionalRuleState;
}
```

`institutionalRules`가 현재 제도를 해석하는 유일한 canonical 상태다. T012의 초기 vocabulary는 다음처럼 구체적인 rule 값으로 제한한다.

| rule | 값 |
|---|---|
| `rulerVeto` | boolean |
| `legislatureRequired` | boolean |
| `suffrage` | `none \| elite \| property \| broad \| universal` |
| `productiveProperty` | `privateAllowed \| mixed \| publicOnly` |
| `landOwnership` | `feudal \| private \| communal \| state` |
| `laborOrganization` | `illegal \| restricted \| legal` |
| `pressFreedom` | `censored \| restricted \| free` |

현재 단계에서는 모든 rule이 downstream economy/ideology/faction 효과를 만들지 않는다. T011 economy는 이 상태를 읽지 않으며, T012는 정책 상태와 제도 event만 만든다.

정책 action은 기존 validated `ActionRecord` envelope를 사용한다. `ENACT_POLICY` payload는 `{ policyId, countryId? }`의 bounded object이며 `countryId`가 없으면 scenario의 `playerCountryId`를 대상으로 한다. 실행 경계는 다음과 같다.

```text
validated ActionRecord
  -> resolveValidatedActions (scenario-bound policy hook)
  -> policy existence / payload / prerequisite / incompatibility validation
  -> PolicyState + institutionalRules immutable replacement
  -> POLICY_ENACTED / POLICY_REJECTED
  -> changed rules only: INSTITUTION_RULE_CHANGED
```

같은 tick의 여러 action은 입력 `sequence` 순서로 하나씩 해소한다. 따라서 앞 action이 활성화한 정책은 뒤 action의 prerequisite가 될 수 있다. 이미 활성인 정책, 알 수 없는 policy id, prerequisite 실패, active policy와의 incompatibility는 deterministic `POLICY_REJECTED`가 되며 policy state는 바뀌지 않는다. 동일한 rule 값에 대한 `INSTITUTION_RULE_CHANGED`는 만들지 않는다. incompatibility는 새 정책을 자동으로 덮어쓰지 않고 거부하는 단일 규칙을 사용해 모순된 active set을 허용하지 않는다.

`POLICY_ENACTED`는 action id를 payload에 기록하고, 실제 rule 변경 event는 같은 정책 event의 id만 `causeIds`로 참조한다. 따라서 rule event는 이미 배출된 policy event를 원인으로 삼고, 미래 event를 참조하지 않는다.

`deriveRegimeClassification(policyState)`는 `institutionalRules`에서 coarse historical label을 계산하는 순수 함수다. 분류는 `WorldState`의 authoritative field가 아니며, CountryId/currentGovernmentId를 바꾸거나 run을 terminal로 만들지 않는다. T012 fixture의 `feudal monarchy -> abolish ruler veto -> broaden suffrage`는 동일 CountryId와 active run을 유지한 채 최종 rule 조합만 바꾼다.

T012에는 비용, 의회 지연, 선거, faction resistance, ideology diffusion, support/radicalism/organization 변경, 경제 효과를 넣지 않는다. 이 결과를 읽거나 추가로 해석하는 writer는 해당 후속 task에서 별도로 계약한다.

Policy definitions should be data-driven.

A policy may:
- enable/disable actions,
- change ownership rules,
- alter who votes,
- alter tax calculation,
- alter information flow,
- alter faction legality,
- alter labor/market mechanics,
- alter state capacity cost.

Avoid encoding policies as direct arbitrary metric deltas unless modeling a short-lived implementation cost.

Good:
`privateIndustryAllowed = false`

Bad:
`communism => production -10`

Consequences emerge downstream.

### State capacity vs administrative headroom

`Country.stateCapacity`는 0–100의 국가 수행능력 지수다.

T016B 개입/집행 시스템은 행정 부담을 구현할 때,
`stateCapacity` 자체를 소비성 currency처럼 직접 차감하지 않는다.

대신 active commitments에서 가용 여력을 파생한다.

개념적으로:

`stateCapacity`
- 전체 국가 수행능력

`administrativeCommitment`
- 현재 정책/사업/위기 대응에 묶인 수행 부담

`administrativeHeadroom`
- 새 개입에 사용할 수 있는 파생 가용 여력

T016B에서 storage/derivation contract를 다음처럼 고정한다.

- static `InterventionDefinition` catalog는 `ScenarioDefinition.interventionCatalog`가 소유한다. 정의의 최소 필드는 `id`, `name`, `category`, `treasuryCost`, `administrativeLoad`, `durationDays`, `prerequisites`다. 선택적인 `completionEffects`는 scenario content가 소유하는 작은 typed union(`regionResourceProductionCapacityDelta`, `factionGrievanceDelta`, `factionOrganizationDelta`)이며, arbitrary expression/스크립트/범용 modifier가 아니다. effect target은 기존 Scenario의 Region/Faction identity여야 하고 magnitude는 definition이 제공한다.
- mutable active runtime은 `WorldState.interventionCommitments`가 소유한다. commitment는 `id`, `interventionId`, `countryId`, `sourceActionId`, `startedTick`, `firstOccupiedTick`, `completionTick`, `administrativeLoad`만 저장한다. 완료 이력은 별도 history field로 복제하지 않는다.
- `committedAdministrativeLoad = Σ active commitment.administrativeLoad`이다.
- `administrativeHeadroom = max(0, stateCapacity - committedAdministrativeLoad)`이다.
- `administrativeOverload = max(0, committedAdministrativeLoad - stateCapacity)`도 파생 진단값으로 제공한다. overload가 생겨도 기존 commitment를 자동 삭제하지 않으며, T017은 이 값을 지역 administrative pressure의 reader로만 사용한다.
- headroom과 overload는 WorldState에 중복 저장하지 않는다. `Country.stateCapacity`는 0–100 지수 그대로 남고, Region의 `stateControl`이나 다른 국가 metric과 합치지 않는다.
- `stateCapacity`가 내려가 기존 부담을 초과해도 commitment는 계속 유지된다. 신규 개입만 현재 headroom에 의해 거부된다.

개입 기간은 wall-clock이 아니라 authoritative day tick으로만 계산한다. action이 `nextTick`에서 accepted되면 `startedTick = firstOccupiedTick = nextTick`, `completionTick = startedTick + durationDays`다. commitment는 start 결과 state에서 해당 첫날의 load를 차지하고, `applyScheduledEffects`가 `completionTick <= nextTick`인 commitment를 먼저 제거·완료 event로 기록한다. 따라서 duration 1은 tick N에 시작해 tick N+1의 action phase 전에 정확히 해제된다. 완료와 신규 action이 같은 날이면 완료가 먼저여서 해제된 여력이 그 날 신규 feasibility에 사용된다. terminal step에서는 이 phase 자체가 실행되지 않는다.

국고 비용도 범용 mana가 아니다. `resolveValidatedActions`는 현재 국고와 같은 tick에서 앞서 accepted된 intervention cost를 projected reservation으로만 추적해 sequence 순서로 double-spend를 거부한다. 실제 국고 차감은 `economy` phase가 `acceptedInterventionCost`를 한 번 합산해 수행하는 유일한 writer다. 거부된 action은 commitment·cost·treasury event를 만들지 않는다. policy action의 기존 T012 즉시 rule mutation semantics는 전부 intervention catalog로 이관하지 않는다.

정치적 feasibility는 `politicalPower` 같은 점수로 만들지 않는다. 개입 정의가 선언한 기존 `PolicyPrerequisite`와 현재 국가의 `PolicyState.institutionalRules`, active policy, country/policy-state validity만 읽는다. faction resistance, 의회 표 계산, repression, concession은 이 task의 writer가 아니다.

T016B fixture catalog는 단기 행정 fixture, 장기 행정 프로그램 fixture, 기존 `legislatureRequired` rule을 요구하는 prerequisite fixture의 세 가지뿐이다. 이는 production 군사·식량·복지 콘텐츠가 아니며, T016A agenda가 `administrative` category를 player capability로 표시하도록 확장되지 않는다. 실제 production catalog가 생길 때만 availability selector와 agenda category를 별도 연결한다.

F03A의 developer-only `gate1f.validation` composition은 이 optional effect
contract를 통해 기존 resources/T017 및 faction/T016/T018 readers를 검증한다.
completion effect는 기존 authoritative writer의 immutable replacement로만
적용되고, intervention identity를 downstream system에서 switch하지 않는다.
완료 event는 실제 effect application의 provenance를 제공하며, serialize/deserialize
및 replay boundary는 기존 full validation 계약을 유지한다. 이는 production
intervention catalog의 balance/content lock이 아니다.

Do not introduce a generic `politicalPower`, `policyPoint`, or equivalent
authoritative currency without a new architecture decision.

---

# 9. Ideology Diffusion System

## 9.1 T013 ideology state contract

`ScenarioDefinition.ideologyCatalog`은 `IdeologyDefinition`의 정적 catalog다. 정의에는 `id`, 한국어 player-facing `name`, `category`, 선택적 `description`·`tags`만 들어가며, 이념별 수치 보너스나 결과를 넣지 않는다. `WorldState`에는 catalog가 없고, 실행 중 변하는 이념값만 `Region.ideology`에 둔다. 초기 WorldState 생성 시 모든 Region은 catalog의 모든 ID에 대한 `IdeologyState`를 가져야 하며, 알 수 없는 ID도 허용하지 않는다.

`Region.ideology[ideologyId]`의 세 값은 서로 독립적이다.

- `support`: 해당 이념에 대한 주민의 수용·공감
- `radicalism`: 제도 밖 행동이나 파괴적 행동을 감수하려는 정도
- `organization`: 지도부, 모임, 노조·정당·세포, 자금·연락망 등 실제 조직 역량

각 값은 0–1이며, 음수·1 초과·비유한값은 허용하지 않는다. support는 비배타적이므로 이념 간 합계가 1일 필요가 없고, support가 높은데 organization이 낮은 지역과 support가 낮은데 radicalism/organization이 높은 지역은 서로 다른 상태다. 사람 단위 인구 시뮬레이션은 하지 않는다.

국가 이념 상태는 저장하지 않는 파생값이다. `deriveCountryIdeology(scenario, world, countryId)`는 해당 Country가 모든 LandHex를 fully controlled하는 Region만 사용해 population-weighted 평균을 계산한다. `ownerCountryId`는 사용하지 않으며, partial/contested/faction/uncontrolled Region은 제외한다. 통제된 유효 인구가 없으면 빈 aggregate를 반환한다. `deriveDominantTendencies`는 support 내림차순, ID 오름차순으로 안정 정렬한다.

유일한 조정 경로는 typed `IdeologyAdjustment`와 불변 `applyIdeologyAdjustment`다. 조정은 한 Region·한 이념·한 dimension에 finite delta를 적용하고 결과를 0–1로 clamp한다. 잘못된 Region/이념/기존값/delta는 거부하며, 유효하지만 결과가 변하지 않으면 같은 Region을 반환하고 event를 만들지 않는다. UI·renderer·network·AI·player action은 이 함수를 직접 호출하거나 `WorldState`를 수정하지 않는다. T013은 이 조정을 `ideologyDiffusion` phase hook에 연결할 뿐, contact graph·지역 간 확산·foreign influence를 구현하지 않는다.

조정은 하나 이상의 이미 배출된 `causeIds`를 요구한다. 이벤트는 전역 sequence와 `event:${tick}:${sequence}:${type}` ID 규칙을 사용한다. dimension별 event type은 `IDEOLOGY_SUPPORT_CHANGED`, `IDEOLOGY_RADICALISM_CHANGED`, `IDEOLOGY_ORGANIZATION_CHANGED`이며, 변화가 없을 때 일일 event를 반복하지 않는다. 같은 adjustment 배열의 순서가 deterministic 입력 순서다.

`deriveIdeologySusceptibilityInputs`는 scarcity, stateControl, urbanization, pressFreedom, laborOrganization, factionPresence를 이후 계산에 넘길 읽기 전용 context만 만든다. T013에는 susceptibility 공식이나 값 변경이 없다. T012 정책 enactment도 이념값을 자동 변경하지 않는다.

## 9.2 T014 contact graph contract

`ScenarioDefinition.mapContactTopology`가 정적 Region graph의 유일한 소유자다. 초기 channel vocabulary는 `border`, `trade`, `migration`, `information` 네 가지로 제한한다. `ContactEdgeDefinition`은 방향이 명확한 하나의 directed edge다. 양방향 연결은 두 개의 서로 다른 edge ID를 가진 record로 작성하며, `direction: "bidirectional"` 같은 숨은 해석은 사용하지 않는다.

`baseStrength`는 0–1 정적 값이다. 실행 중 필요한 최소 overlay는 `WorldState.contactEdgeStates[ContactEdgeId]`이며, edge 전체를 복사하지 않는다.

```ts
interface ContactEdgeRuntimeState {
  enabled: boolean;
  multiplier: number; // finite, >= 0
  blockedReason?: string;
}
```

overlay가 없으면 edge는 enabled이고 multiplier 1로 해석한다. disabled edge의 effective strength는 0이다. 그 외에는 다음 규칙을 사용하고 결과를 0–1로 clamp한다.

```text
effectiveStrength = clamp01(baseStrength * runtimeMultiplier)
```

`multiplier > 1`은 향후 refugee route activation 같은 일시적 강화 가능성을 보존하고, 최종 effective 값은 항상 0–1이다. T014는 runtime map을 직접 변경하는 action/phase를 구현하지 않는다. UI·network·AI는 topology나 runtime map을 직접 mutate할 수 없다.

`getOutgoingContacts`, `getIncomingContacts`, `getContactsByChannel`, `getEffectiveContactStrength`는 edge ID 오름차순으로 결정론적 결과를 반환한다. disabled edge도 topology 관찰을 위해 결과에 남기며 effective strength만 0이 된다. 초기화/조회 검증은 중복 edge ID, 존재하지 않는 Region endpoint, topology node 누락, 잘못된 channel/strength, static topology에 없는 runtime edge ID를 거부한다.

국가 contact는 별도 network로 저장하지 않는다. `deriveCountryContacts`가 각 directed
Region edge의 현재 territorial projection을 읽어 양 끝이 서로 다른 Country에 의해
fully controlled일 때만 foreign country contact를 파생한다. partial/contested/
faction presence/uncontrolled endpoint가 하나라도 있으면 국가 projection에서 제외한다.
같은 국가 내부 연결은 Region query에는 남지만 foreign country contact에는 넣지 않는다.
물리적 LandHex control 변화는 static ContactGraph edge를 생성·삭제하지 않고 국가-level
projection만 바꾼다.

T014는 contact event를 매 tick 배출하지 않으며, runtime state mutation도 구현하지 않는다. 실제 폐쇄·전쟁 disruption·censorship·refugee activation event와 writer는 후속 authoritative task가 소유한다. T015는 이 query 결과와 `effectiveStrength`를 원인 경로로 소비할 수 있다. T014 fixture에는 플레이어 항구 → 상인공화국 항구의 trade/migration edge와 역방향 information/trade edge가 있다.

## 9.3 T015 diffusion boundary

T015는 `ideologyDiffusion` phase의 실제 contact 기반 support writer다. 정적 이념 catalog는 계속 `ScenarioDefinition`이 소유하고, mutable 값은 `WorldState.regions[*].ideology`에만 남는다. 국가 aggregate는 저장하지 않으며 `deriveCountryIdeology`가 현재 fully controlled Region projection을 다시 읽는다.

### 입력과 적용 범위

- 모든 입력은 phase 시작 시점의 `WorldState` snapshot과 `ScenarioDefinition.mapContactTopology`에서 읽는다.
- 각 명시적 directed `ContactEdgeDefinition`을 `getEffectiveContactStrength`로 읽는다. reverse edge는 별도로 존재할 때만 사용한다.
- source signal은 국가 aggregate가 아니라 source Region의 해당 `IdeologyState.support`다. T015B는 이를 destination Region의 같은 support와 비교해 양의 gradient만 사용한다.
- destination은 Region의 같은 `ideologyId` 상태이며, physical controller가 country/faction/uncontrolled인지와 무관하게 Region 간 확산을 계산한다. 이는 local contact를 계속 보존하기 위한 규칙이다. 다만 국가 aggregate 파생값은 T017B projection 계약대로 fully country-controlled Region만 포함한다.
- T015가 바꾸는 dimension은 `support` 하나다. `radicalism`과 `organization`은 그대로이며, support를 정규화하거나 다른 이념에서 빼지 않는다.
- self-loop edge는 self-feedback/order exploit을 막기 위해 diffusion에서 무시한다.

### 결정론적 공식

T015B에서 검증한 production 계산은 source와 destination의 지지 차이를 사용한다. `diffusionRate`, channel weight, 그리고 A/B 진단용 formula 선택은 phase hook 설정으로 주입할 수 있지만, 기본값은 모든 replay에서 동일하다.

```text
ideologyGradient = max(0, sourceSupport - destinationSupport)

pressure = ideologyGradient
         × effectiveContactStrength
         × channelWeight
         × destinationSusceptibility

delta = diffusionRate × pressure × (1 - destinationSupport)
nextSupport = clamp01(previousSupport + aggregate(delta))
```

T015B production 기본값은 `diffusionRate = 0.05`이며 channel weight는 다음과 같다.

| channel | 기본 weight |
|---|---:|
| `border` | 0.8 |
| `trade` | 1.0 |
| `migration` | 1.1 |
| `information` | 1.2 |

이 weight는 이념의 우열이나 특정 정치 체제의 친화도를 뜻하지 않는다. 현재는 연결 경로가 정보를 전달할 수 있는 임시 transport capacity 가정이며, 이후 balance/정책/검열/난민/전쟁 modifier가 명시적으로 추가될 때 교체 가능한 중앙 설정이다. T015에는 censorship, sanction, refugee, war, prestige, foreign AI modifier를 넣지 않는다.

production formula는 `supportGradient`다. `absoluteSource`는 T015B의 동일 시나리오 A/B 재현을 위한 명시적 inspection mode로만 보존하며, gameplay hook은 formula를 생략해 production 기본값을 사용한다.

### 정치 시간척도와 cadence

T015C는 권위 있는 daily simulation tick을 바꾸지 않고 정치 확산 phase의 적용 cadence만 분리한다. `PoliticalCadence`는 `daily | weekly | monthly` 중 하나이며, `src/sim/core/politicalCadence.ts`의 `shouldRunPoliticalUpdate(nextTick, nextDate, cadence)`가 유일한 경계 판정 함수다.

- `daily`: 모든 non-terminal step에서 적용한다.
- `weekly`: `nextTick`이 7의 배수인 step에서 적용한다.
- `monthly`: 30일 달력의 다음 날짜가 `day = 1`인 월 경계에서 적용한다. 초기 날짜가 왕력 1년 1월 1일이면 첫 적용은 tick 30, 왕력 1년 2월 1일이다.

`ideologyDiffusion` phase hook은 매일 호출되지만 cadence 경계가 아니면 동일 `WorldState`, 빈 이념 event, 동일 event sequence를 반환하는 결정론적 no-op이다. 그 날의 `tick/date` 전진은 여전히 `closeDay`가 소유한다. cadence는 renderer frame, UI 배속, wall clock 또는 별도 scheduler의 경과 시간으로 판단하지 않는다. T041이 나중에 여러 authoritative step을 호출하더라도 같은 simulated day 수와 같은 action 순서는 같은 정치 결과를 만든다.

T015C의 동일 T015B 시나리오 비교 결과, production cadence는 `monthly`로 선택했다. formula와 production `diffusionRate = 0.05`, channel weights, directed edge, phase-start snapshot, simultaneous update, non-exclusive support, support-only writing은 변경하지 않았다. daily/weekly는 inspection에서 명시적으로 주입할 수 있고, T015/T015B의 과거 일일 진단 재현도 `cadence: "daily"`를 명시한다. monthly 기본값은 향후 faction, policy, repression, propaganda, instability가 특정 update에서 source 조건을 바꾸는 확장 지점을 보존한다.

destination susceptibility는 T013의 `deriveIdeologySusceptibilityInputs` hook을 통해 destination Region과 현재 국가 institutional rules를 읽은 뒤, 이념 종류와 무관한 보수적 baseline만 사용한다.

```text
susceptibility = clamp01(
  0.5
  + accessibility × 0.25
  + urbanization × 0.15
  - stateControl × 0.10
)
```

scarcity, pressFreedom, laborOrganization, factionPresence는 T013 context에 보존되지만 T015에서 임의의 정치적 stereotype modifier로 쓰지 않는다. 이 값들을 실제 확산 원인으로 쓰려면 후속 task가 명시적인 정책/정보/물질 경로와 writer를 추가해야 한다.

### 동시성, 경계, 이벤트

한 phase 안에서 edge별 pressure를 전부 같은 snapshot으로 계산하고 `(destinationRegionId, ideologyId)`별로 집계한 뒤 한 번에 적용한다. 따라서 A → B → C 경로에서 B의 새 support는 C의 같은 tick 계산에 들어가지 않고 다음 day에만 source가 된다. edge 배열 순서를 바꾸어도 결과와 event 순서는 변하지 않도록 edge ID, source Region ID, destination Region ID, ideology ID로 안정 정렬한다.

실제로 delta가 양수인 source contribution만 event를 만든다. 각 기여에는 다음 정보를 기록한다.

- `sourceRegionId`, `destinationRegionId`, `ideologyId`
- `contactEdgeId`, `channel`, `effectiveStrength`
- `sourceSupport`, `ideologyGradient`, `destinationSusceptibility`, `pressure`
- `previousSupport`, `nextSupport`, `appliedDelta`

source edge별 `IDEOLOGY_DIFFUSED` event를 먼저 배출하고, 같은 destination/ideology의 aggregate를 적용한 뒤 기존 `IDEOLOGY_SUPPORT_CHANGED` event 하나를 배출한다. 후자의 `sourceContributions` payload가 여러 edge의 기여를 보존하며, support event의 `causeIds`는 같은 phase에서 이미 배출된 `IDEOLOGY_DIFFUSED` event만 참조한다. 변화가 없으면 두 event 모두 만들지 않는다.

현재 `WorldState`와 `SimulationStepInput`에는 과거 EventStore가 들어 있지 않다. 따라서 `IDEOLOGY_DIFFUSED`는 source support/contact 계산을 payload로 남기는 causal root(`causeIds: []`)이고, support change는 같은 step의 diffusion event를 원인으로 삼는다. 다음 day가 이전 day의 event ID를 직접 cause로 참조한다고 가장하지 않는다. 과거 event까지 연결하는 replay/event-store 입력 확장은 T024에서 최소 범위로 결정한다.

T015는 UI·renderer·network·AI를 import하거나 호출하지 않으며, `WorldState`를 in-place mutation하지 않는다. T015 fixture는 상인공화국 항구 → 플레이어 항구 → 플레이어 수도의 다중 day route와 route 밖 플레이어 광산을 포함해 첫날 intermediate source snapshot과 다음 날 전달을 검증한다.

---

# 10. Faction System

## 10.1 T016 pressure/heuristic contract

Faction heuristic은 현재 `WorldState`에서 작은 read-only observation을 만들고, 명시적인 rule ordering으로 하나의 정치적 의도를 선택한다. T016의 baseline action vocabulary는 다음 여섯 개뿐이다.

- `LOBBY`
- `BARGAIN`
- `ORGANIZE`
- `FUND_MOVEMENT`
- `ACCEPT`
- `WAIT`

`COUP`, `REVOLT`, `REVOLUTION`, `START_CIVIL_WAR`, territorial occupation, military action, 실제 `STRIKE` crisis는 이 vocabulary에 없다. strategy는 미래 사건 예약표나 story progress가 아니다. T016은 LLM/backend/dialogue를 호출하지 않으며 RNG도 사용하지 않는다.

Observation은 다음 실제 상태의 compact projection이다.

- faction의 `resources`, `organization`, `influence`, `grievance`, `ideologyAffinity`, `foreignLinks`, `currentStrategy`
- faction의 historical `countryId`와 해당 국가의 `treasury`, `legitimacy`, `stateCapacity`, `instability`
- faction 국가가 소유하거나 faction이 직접 통제하는 Region의 `scarcity`, `unrest`, `stateControl`
- affinity-weighted Region ideology의 `support`, `radicalism`, `organization`
- 해당 국가 `PolicyState.institutionalRules`와 그로부터 파생한 action availability

이 observation은 derived context이며 `WorldState`에 저장하지 않는다. `Region.ideology[ideologyId].organization`은 특정 지역 이념/운동의 조직 기반이고, `Faction.organization`은 faction entity의 조직 역량이다. 전자는 후자로 복사하지 않으며, heuristic은 두 값을 독립된 입력으로만 읽는다.

`PoliticalCadence`는 T015C와 같은 `monthly`가 production default다. `factionPressure` phase는 매일 pipeline에서 호출되고, 다음 simulated date가 month boundary가 아니면 새 heuristic proposal을 만들지 않는 결정론적 no-op다. 월 경계에서 `ideologyDiffusion` 다음에 실행되므로 같은 step에서 바뀐 support를 observation이 읽을 수 있다. renderer time, wall clock, `setInterval`, scattered `tick % 30`은 사용하지 않는다.

## 10.2 Proposal과 authoritative mutation

`runFactionPressurePhase`와 T019 `runDiplomacyPhase`는 stable actor ID 오름차순으로 proposal을 만들고 `SimulationStepResult.actionProposals`에 다음 target tick을 담아 반환한다. heuristic 함수 자체는 `WorldState`를 mutate하지 않는다. 공통 `acceptActionProposal` intake가 proposal을 accepted `ActionRecord`로 바꾼 뒤, player/heuristic/LLM action과 동일한 global action sequence로 다음 step에 넣는다.

T016 baseline phase가 accepted faction action으로 변경하는 권위 상태는
`Faction.currentStrategy`뿐이다. 전략이 이전 값과 달라질 때만
`FACTION_STRATEGY_CHANGED`를 한 번 배출한다. `resources`, `organization`,
`influence`, `grievance`는 T016 heuristic의 observation input이다. F04A의
별도 bounded endogenous writer는 이 action semantics를 바꾸지 않으며,
`Faction.grievance`/`Faction.organization`만 10.2A의 기존 monthly boundary
계약에 따라 immutable replacement한다. `Country.instability`, `Region.unrest`,
모든 ideology dimension, `LandHexRuntimeState.controller`, `Government`,
treasury/production/scarcity, diplomacy, conflict, victory/defeat는
T016/F04A writer가 아니다.

accepted faction action의 해소는 명시적인 input 적용이며, 새 heuristic 판단은 monthly boundary에서만 일어난다. proposal 생성과 action acceptance를 한 번에 묵시적으로 합치지 않기 때문에 UI/network/AI callback이 `currentStrategy`를 직접 바꿀 수 없다.

## 10.2A F04A endogenous faction dynamics

F04A는 T016이 읽던 authoritative `Faction.grievance`와
`Faction.organization`에 기존 월간 정치 경계의 bounded endogenous writer를
추가한다. 이는 별도 정치 subsystem이나 generic score가 아니다.

`deriveFactionDynamicsSnapshot()`은 현재 Country/Region/Faction/ideology
상태에서만 순수하게 driver와 target을 계산한다. grievance target은 scarcity,
local unrest, 약한 `stateControl`, Country legitimacy/stateCapacity 약화,
Country instability 중 현재 가장 큰 hostile pressure를 사용한다.
organization target은 faction resources로 상한을 두고 influence 또는
affinity-weighted local political activation 중 큰 값을 사용한다. `support`
단독, `currentStrategy` 단독, intervention ID 분기는 driver가 아니다.

`runFactionPressurePhase`는 기존 T016 monthly cadence에서만 두 값을 최대
`0.02`씩 target 방향으로 이동시키며, 유효 범위 안에서 immutable Faction
replacement를 만든다. 같은 phase의 모든 faction snapshot은 phase 시작
WorldState에서 읽고 stable `FactionId` 순서로 적용한다. dynamics target,
cursor, recovery progress는 WorldState에 저장하지 않는다.

phase 경계는 다음과 같다.

```text
F03A commitment completion / accepted actions
  -> economy / resources / ideology diffusion
  -> T016 faction dynamics replacement and proposals
  -> T017 instability
  -> T018/T021 consumers
```

F04A writer는 crisis, conflict, Government, LandHex controller,
consolidation, dissolution을 직접 변경하거나 event를 월별로 생성하지 않는다.
T017/T018/T021이 갱신된 authoritative faction fields를 기존 규칙으로
읽는다. `0.02` step은 Gate 1F recovery-timescale 측정값이며 최종 balance
결정이 아니다.

## 10.3 T016A agenda/read-model boundary

T016A의 agenda는 현재 압력을 읽기 쉽게 묶는 **순수 read model**이다. agenda를 `WorldState`에 저장하거나 `RunState`의 진행·완료·다음 단계로 해석하지 않는다. 허용되는 형태는 다음과 같다.

```text
ScenarioDefinition + current WorldState + bounded recent GameEvents
  -> deriveNationalAgendas()
  -> 0–4 PrimaryAgenda read models
```

`PrimaryAgenda`의 최소 출력은 `id`, `kind`, deterministic `title`, `affectedRegionIds`, bounded `severity`/optional `severityBand`, `trend`, typed `keyCauses`, `involvedFactionIds`, `interventionCategories`, `causeEventIds`다. selector는 WorldState·Faction·PolicyState·Region ideology·ContactGraph·입력 event를 읽지만 WorldState를 변경하지 않고 GameEvent를 만들지 않는다. UI·renderer는 이 값을 소비할 수 있지만 agenda selector는 React를 import하지 않는다.

현재 구현된 detector는 실제 선행 시스템이 제공하는 세 압력뿐이다.

- `fiscalPressure`: T011의 `treasury`, `dailyIncome`, `dailyExpenditure`
- `factionPressure`: T016 `FactionObservation`의 grievance/organization/influence/resources/foreignLinks, affinity-weighted Region context, country state context
- `foreignIdeologicalPressure`: 현재 directed ContactGraph edge, 현재 source/destination controller, 실제 `IDEOLOGY_DIFFUSED` 또는 해당 edge를 포함한 `IDEOLOGY_SUPPORT_CHANGED` evidence

별도의 explicit institutional-pressure 관계가 아직 없으므로 detector를 억지로 추가하지 않는다. `currentStrategy` alone, ideology support alone, 존재만 하는 foreign contact alone은 agenda를 만들 수 없다. `Faction.organization`과 `Region.ideology[*].organization`은 서로 다른 입력으로 유지한다.

detector 입력/threshold/weight는 `src/sim/readModels/agenda.ts`의 `AGENDA_DETECTOR_CONFIG`에 모은다. 이것은 T016A의 bounded read-model normalization이며 economy/faction/ideology balance 상수가 아니다. severity threshold 미만 candidate는 제거하고, 남은 결과는 `severity` 내림차순 → `AgendaKind` → 첫 `RegionId` → 첫 `FactionId` → `id` 순으로 정렬한 뒤 최대 4개만 반환한다. 압력이 충분하지 않으면 0개가 유효하며 filler를 만들지 않는다.

`trend`는 현재 severity에서 추측하지 않는다. selector에 전달된 bounded recent events에 방향성 있는 실제 delta가 없으면 `unknown`이다. `causeEventIds`는 전달된 evidence의 실제 ID 부분집합이며, evidence가 없을 때 비어 있을 수 있다. T024까지 WorldState에 EventStore를 넣지 않으므로 event window는 호출자가 제공한다.

현재 실제로 연결된 intervention category는 `policy`와 `noAction`뿐이다. treasury/diplomacy/military/repression/concession writer/action이 없으므로 agenda가 이를 이미 가능한 개입처럼 표시하지 않는다. agenda가 사라지는 것은 underlying pressure가 사라졌다는 뜻이며, 별도 completion/quest/story state를 만들지 않는다.

현재 T018 conflict-phase detector가 실제 당시 state를 다시 읽어 쿠데타·반란
eligibility와 active political Conflict를 판단한다. `strategy === X`나 agenda가
고정된 crisis event를 예약하는 구조는 금지한다. 외국 자금 지원은 T020 또는 후속
명시적 시스템으로 남겨 두며, T019 diplomacy action은 공통 ActionRecord intake와
`diplomacy` phase writer를 사용한다.

## 10.4 T017 Instability contract

T017은 현재 실제 상태를 **지역 pressure → 지역 unrest → 국가 instability**로 연결한다. 세 개를 같은 값으로 취급하지 않는다.

```text
actual WorldState
  -> RegionalPressureSnapshot (pure derived read model)
  -> combined pressure target (0–1)
  -> daily Region.unrest approach/recovery (0–1, authoritative writer)
  -> population-weighted Country.instability (0–100, authoritative writer)
```

`RegionalPressureSnapshot`은 `WorldState`에 저장하지 않는다. selector는 input을 mutate하지 않으며, `PressureComponent`는 bounded severity와 실제 입력을 설명하는 typed causes를 가진다. 모든 지역은 stable `RegionId` 순서로 계산한다.

### Pressure channels

- **material:** `clamp(Region.scarcity, 0, 1)`만 읽는다. `Country.treasury < 0`은 직접 지역 unrest로 변환하지 않는다. 재정 agenda와 지역 공급 실패는 서로 다른 의미다.
- **political:** faction이 해당 국가 소유 지역 또는 자신이 직접 통제하는 지역과 명시적으로 관련된 경우에만 읽는다. `Faction.grievance`, `Faction.organization`, affinity-weighted local ideology의 `radicalism`/`organization` 중 가장 낮은 값을 mobilization gate로 삼고, `Faction.influence`를 별도 보조 신호로 포화 결합한다. `Faction.currentStrategy`와 ideology `support`만으로는 pressure를 만들지 않는다. `Faction.organization`과 `Region.ideology[*].organization`은 서로 다른 상태다.
- **administrative:** 현재 Region이 한 Country에 의해 fully controlled인 경우에만 `deriveAdministrativeOverload()`를 읽고, 다음 bounded baseline을 적용한다. partial/contested/faction presence/uncontrolled Region은 국가 행정 aggregate에서 제외한다.

```text
overloadSignal = overload / (overload + 15)
administrative = overloadSignal * (1 - clamp(stateControl, 0, 1))
```

`stateCapacity`, committed administrative load, headroom, overload, `Region.stateControl`, territorial controller는 별도 개념이다. 낮은 `stateControl`만으로는 pressure가 생기지 않고, overload가 각 지역에 이미 반영되므로 국가 aggregate에 overload bonus를 다시 더하지 않는다.

각 channel은 먼저 0–1로 bounded 된다. baseline global combination은 arbitrary weighted sum이 아니라 다음 하나로 고정한다.

```text
combinedPressure = 1 - Π(1 - channelPressure)
```

이 규칙은 all-zero를 0으로 유지하고, 여러 실제 channel이 동시에 존재할 때만 compound pressure를 만들며, 결과를 0–1 안에 둔다. T017의 `riseRate = 0.02`, `recoveryRate = 0.015`, overload reference `15`는 초기 inspection baseline이지 최종 balance lock이 아니다.

T016 faction observation과 T017은 공통 pure `isFactionRelevantToRegion()` predicate를 사용한다. 다만 T016A의 agenda severity는 국가 단위 observation/read model이고 T017 political component는 지역 단위 동원 gate이므로, 두 공식을 하나의 generic weighted engine으로 통합하지 않는다. T017은 T016B의 `deriveAdministrativeOverload()`도 reader로 재사용한다.

### Unrest and national aggregation

`instability` phase는 authoritative one-day tick마다 phase-start pressure snapshot을 읽고, 다음 방식으로 `Region.unrest`를 목표값에 점진적으로 접근시킨다.

```text
nextUnrest = currentUnrest + (pressureTarget - currentUnrest) *
  (riseRate if target is higher else recoveryRate)
```

결과는 0–1로 clamp한다. pressure를 제거해도 즉시 0으로 reset하지 않으며, renderer/wall-clock와 무관하게 매일 같은 방식으로 누적·회복한다. T015/T016의 political source state가 monthly boundary에서 바뀌더라도 T017 자체는 monthly cadence에 묶지 않는다.

`Country.instability`는 현재 통제 중인 지역만을 사용한다.

```text
Σ(Region.unrest × Region.population) /
Σ(Region.population) × 100
```

판정은 `ownerCountryId`가 아니라 `getFullyControlledRegionIds()` projection으로 한다.
partial/contested/faction-controlled/uncontrolled 지역은 제외한다. controlled population이
0이면 deterministic하게 `0`을 반환한다. Country instability에는 별도 overload bonus나
state dissolution 의미를 더하지 않는다.

T017 baseline은 `Country.legitimacy`를 자동 감소시키지 않는다. `unrest >= X`가
rebellion/revolution/coup를 발생시키거나 미래 crisis를 예약하는 구조도 없다. T018
detector는 당시의 grievance, support, radicalism, organization, resources,
concentration, state weakness와 unrest를 읽고, 아직 구현하지 않은 military sympathy와
foreign support는 `notImplemented`로 남긴다.

### Events and phase binding

숫자 state는 매일 갱신할 수 있지만 event는 매일 작은 delta마다 만들지 않는다. `REGION_UNREST_BAND_CHANGED`와 `NATIONAL_INSTABILITY_BAND_CHANGED`를 low/medium/high/critical 경계(기본 `0.25/0.50/0.75`)를 넘을 때만 배출한다. event ID와 sequence는 기존 global event contract를 따르고, `causeIds`는 현재 step buffer에서 이미 배출된 event만 참조한다. T017은 rebellion/coup/revolution/civil-war/strike event를 만들지 않는다.

`runSimulationStep`의 production default는 `instability: runInstabilityPhase`로 고정되어 daily phase를 실제로 실행한다. 테스트나 특정 composition이 T017 writer 경계를 격리해야 할 때만 명시적 no-op hook을 주입할 수 있다. phase는 `Region.unrest`와 `Country.instability`만 이 목적에서 쓰며, treasury/resources/ideology/factions/intervention commitments/controllers/legitimacy를 직접 변경하지 않는다.

T017B COMPLETE는 이 aggregate consumer와 administrative controller 판정을
`LandHexRuntimeState.controller` 기반 projection으로 migrate했다. T017의
regional pressure/unrest formula와 event band behavior는 변경하지 않았다.

## 10.5 T018 Rebellion / Coup prerequisite contract

T018은 현재 `WorldState`에서 쿠데타와 반란이 **지금 가능한 상태인지**를
deterministically 읽고, eligible한 경우 기존 `Conflict` domain에 active political
crisis attempt를 추가한다. 이것은 `StoryCrisis`, `revolutionClock`, `progress`,
미래 event 예약이 아니다.

### Static actor capability

`ScenarioDefinition.factionCapabilities`는 세력별 정적
`PoliticalCrisisCapability`(`coup` 또는 `rebellion`) 목록을 선택적으로 소유한다.
이는 해당 세력이 구조적으로 그런 시도를 할 수 있다는 content/schema 사실이며,
unlock, progression, `WorldState` runtime flag, 성공 예약이 아니다. capability map은
run 생성 시 검증하지만 `WorldState`에 복사하지 않는다. map이 없거나 해당 faction에
capability가 없으면 그 종류의 crisis candidate가 아니다. faction 이름, 현재 전략,
ideology 이름으로 capability를 추측하지 않는다.

### Separate prerequisite read models

`deriveCoupPrerequisites()`와 `deriveRebellionPrerequisites()`는 같은
phase-start `WorldState`에서 각각 별도의 typed snapshot을 만든다. 두 모델은
`required gates`와 bounded supporting signals를 보존하며 단일
`politicalCrisisScore`, unrest meter, instability threshold를 저장하거나 사용하지
않는다.

- Coup required gates: static capability, 현재 중앙 정부, faction grievance,
  `Faction.organization`, influence, resources, derived state weakness.
- Rebellion required gates: static capability, faction grievance,
  `Faction.organization`, resources, 같은 Region에서 함께 충족되는 local
  ideology radicalism/local ideology organization/`Region.unrest`, geographic
  concentration, derived state weakness.
- `Region.ideology[*].organization`은 `Faction.organization`과 별개의 값이다.
  ideology support는 rebellion의 설명용 supporting signal일 뿐 trigger gate가
  아니다. `Faction.currentStrategy`와 Agenda도 설명용 상태일 뿐 crisis를 만들거나
  예약하지 않는다.
- Rebellion의 지역 신호는 Region aggregate에서 계산한다. LandHex에 인구나 ideology를
  임의 분할하지 않는다. 이미 faction이 통제하는 LandHex가 있으면 presence
  supporting signal로 읽을 수 있지만, 반란의 필수 사전조건으로 만들지 않는다.

`deriveCrisisStateWeakness()`는 legitimacy 약화, stateCapacity 약화, 국가
instability, fully controlled Region의 population-weighted unrest,
legal-owner LandHex 대비 현재 country-controlled LandHex의 territorial weakness를
순수하게 읽고, 그 중 가장 큰 bounded component를 baseline `stateWeakness`로
반환한다. 이 값은 `WorldState`에 저장되지 않는다. T018의 named threshold
(`COUP_PREREQUISITE_CONFIG`, `REBELLION_PREREQUISITE_CONFIG`)는 inspection 가능한
초기 detection baseline이며 최종 balance lock이 아니다.

현재 구현이 제공하지 않는 military sympathy, foreign support, weapons, leadership는
`notImplemented` evidence로만 나타난다. fake default 수치를 넣지 않으며 eligibility에
영향을 주지 않는다. foreign support/diplomacy는 T019/T020, 실제 군사·점령·전선
해소는 T021의 책임이다.

### Conflict-phase detection boundary

새 simulation phase를 만들지 않고 기존 `conflict` phase가 T018 detector를 호출한다.
eligible candidate는 `CountryId → coup before rebellion → FactionId → first
affected RegionId` 순으로 정렬한다. 같은 `(countryId, factionId, kind)`의 active
`Conflict`가 이미 있으면 identity 중복을 막기 위해 새 object/event를 만들지 않는다.
여러 서로 다른 faction 또는 kind가 같은 tick에 eligible한 것은 허용한다.

기존 `ConflictKind`의 `coup`/`rebellion`과 active status를 재사용하고, 정치적 영향
범위를 물리적 전투 경합과 구분하기 위해 optional `Conflict.affectedRegionIds`를
추가했다. T018에서는 `contestedRegionIds`를 채우지 않는다. 새 conflict는
`COUP_ATTEMPT_STARTED` 또는 `REBELLION_STARTED`와 함께 생성되며, payload에는
required gate, state weakness components, affected Regions, regional evidence를
담는다. 현재 step context에 과거 EventStore가 없으므로 cross-tick cause를 추측하지
않고 `causeIds`는 빈 목록으로 둔다. event ID/sequence는 기존 global event contract를
그대로 따른다.

T018 detection은 `Government`, `CountryId`, `RunOutcome`, `LandHexRuntimeState`를
변경하지 않는다. 쿠데타·반란이 시작되었다고 즉시 정부가 교체되거나 영토가 faction에
넘어가지 않는다. 향후 conflict resolution이 정부를 바꿀 때는 기존
`ConflictOutcome.governmentTransition` seam을 사용하고 같은 `CountryId`를 유지하며,
물리적 control change가 필요할 때만 `changeLandHexController()`를 사용한다.

T018은 policy/intervention/Agenda/action proposal을 crisis scheduler로 사용하지
않으며 RNG를 소비하지 않는다. 기존 scenario에 capability metadata가 없으면
기존 simulation은 conflict phase에서 immutable no-op으로 남는다.

## 10.6 T019 Foreign State Baseline

T019에서 외국은 별도 `ForeignNation`/`AICountry` entity가 아니다. 기존
`Country`가 동일한 simulation actor이며, `country.id !== ScenarioDefinition.playerCountryId`
인 현재 국가를 stable `CountryId` 오름차순으로 foreign heuristic 대상에 넣는다.
현재 run이 terminal이면 이 대상에서 proposal과 mutation을 만들지 않는다.

### Foreign observation

`deriveForeignStateObservation()`은 renderer-independent pure read model이다.
`WorldState`에 저장하지 않으며 현재 구현된 사실만 포함한다.

- own state: treasury, daily income/expenditure, legitimacy, stateCapacity,
  instability, stateContinuity, current Government ID/authority, fully-controlled
  Region projection, bounded state weakness, active conflict 존재
- contacts: `deriveCountryContacts()`가 반환하는 실제 fully-controlled Region
  endpoint의 directed routes, channel, base/effective strength, enabled state,
  closure reason/owner
- conflicts: 해당 Country가 participant인 active Conflict의 bounded identity와
  physical/political affected Region 구분
- available actions: 현재 route와 government/action-capability에서 파생된
  T019의 `CLOSE_BORDER`, `REOPEN_BORDER`, `WAIT` 및 T020의 방향 명시
  `RESTRICT_INCOMING_BORDER`, `RESTORE_INCOMING_BORDER`

`Country.diplomacy`의 opinion/trade/ideological threat 같은 generic bilateral
meter를 T019 heuristic의 새 권위 상태나 점수로 사용하지 않는다. ideology,
regime name, foreign prestige, sanctions, faction funding, propaganda는 T020
또는 후속 명시적 시스템의 책임이다.

### Cadence and common action boundary

authoritative tick은 계속 하루이고, foreign decision checkpoint는 기존
`PoliticalCadence`의 `monthly` boundary를 재사용한다. non-boundary day에는
proposal을 만들지 않는다. 각 foreign Country는 checkpoint마다 최대 하나의
proposal을 만들며, T019의 기존 action과 T020의 incoming action을 같은 공통
vocabulary로 사용한다. heuristic은 RNG와 LLM을 사용하지 않고 현재 observation만
읽는다.

```text
monthly foreign observation
  -> deterministic heuristic
  -> ActionProposal(target next tick)
  -> acceptActionProposal
  -> heuristic ActionRecord(global sequence)
  -> next authoritative step / diplomacy phase
```

`WAIT`는 유효한 accepted action이지만 state mutation이나 event를 만들지 않는다.
`WAIT`가 T016 faction action type과 겹치므로 typed payload의
`actorCountryId`/`factionId`가 각 phase decoder의 경계를 확정한다. 별도
foreign queue/log를 만들지 않는다.

### Directed border mutation

`diplomacy` phase가 T019 runtime contact mutation의 canonical writer다.
accepted `CLOSE_BORDER(actor, target)`는 actor가 fully control하는 Region에서
target이 fully control하는 Region으로 향하는 explicit `channel: "border"`
ContactEdge만 찾고, 해당 directed edge들을 `enabled: false`로 만든다. 역방향
edge는 자동으로 바꾸지 않는다. `REOPEN_BORDER`는 같은 actor가 이전 외교 폐쇄로
닫은 edge만 `enabled: true`로 되돌리며 static `baseStrength`와 runtime
`multiplier`는 보존한다.

외교 폐쇄 runtime state는 `blockedReason: "foreignPolicyBorderClosure"`와
`blockedByCountryId`를 함께 기록한다. 이 owner metadata가 없으면 다른 국가가
남의 폐쇄를 임의로 재개할 수 있으므로 runtime schema에 포함한다. 다른 시스템의
closure는 T019 reopen 대상이 아니다.

T020의 `RESTRICT_INCOMING_BORDER(actor, target)`는 기존 T019의 outgoing
`CLOSE_BORDER`를 재해석하지 않는다. `target`이 fully control하는 source Region에서
`actor`가 fully control하는 destination Region으로 향하는 explicit `border`
ContactEdge만 `enabled: false`로 만든다. 이 runtime state는
`blockedReason: "foreignIdeologicalThreatBorderRestriction"`와 actor의
`blockedByCountryId`를 기록한다. `RESTORE_INCOMING_BORDER`는 그 actor가 소유한
동일 reason의 incoming closure만 복구한다. 두 incoming action 모두 reverse
outgoing edge, static topology, base strength, multiplier를 바꾸지 않는다.

`ScenarioDefinition.mapContactTopology`, LandHex topology/controller,
Region.stateControl, ideology, Faction, treasury, Government, PolicyState,
Conflict와 generic relation meter는 이 writer가 변경하지 않는다. 물리적 국경,
점령, 전선, 무역·제재 경제 효과, foreign faction support는 이 task의 결과가
아니다.

### Events and terminal behavior

실제 state transition만 `BORDER_CLOSED` 또는 `BORDER_REOPENED`를 만들고,
payload에 source ActionId, actor/target CountryId, affected ContactEdge IDs,
previous/new runtime state를 기록한다. 불가능한 accepted action은
`FOREIGN_ACTION_REJECTED`를 만들 수 있으며, `WAIT`에는 event를 만들지 않는다.
Accepted ActionRecord는 GameEvent가 아니므로 action 자체를 `causeIds`로 넣지
않으며, 현재 cross-tick EventStore가 step context에 없다는 기존 규칙에 따라
이 이벤트들의 `causeIds`는 빈 목록이다.

terminal run에서는 foreign observation proposal, diplomacy mutation, event가
없고 tick/date/RNG/action state가 변하지 않는다. T020은 T019의 contact mutation
경계를 확장했지만 T021 war/army/occupation, sanctions/trade economy, propaganda,
foreign faction funding, richer bilateral relations, Gate 3 LLM actor를 구현하지
않는다.

## 10.7 T020 Foreign Ideological Threat

T020 foreign ideological threat는 `Country.diplomacy.ideologicalThreat`나
`WorldState`의 저장 meter가 아니다. `deriveForeignIdeologicalThreatRoutes()`가
현재 `WorldState`와 static `ScenarioDefinition`에서 route-level evidence를
계산하고, `deriveForeignIdeologicalThreats()`가 `sourceCountryId + ideologyId`
그룹으로 bounded aggregate를 파생한다. `ForeignStateObservation.ideologicalThreats`
는 이 snapshot을 read model로 노출하며 UI·network·AI가 직접 state를 쓸 수 있는
권한을 제공하지 않는다.

### Causal eligibility

위협은 다음 세 층을 구분한다.

1. external exposure: 실제 foreign source Region → actor destination Region의
   directed ContactGraph route와 `effectiveStrength > 0`
2. domestic mobilization: destination의 aligned domestic Faction과
   `grievance`, `Faction.organization`, local ideology `radicalism`, local
   ideology `organization`, affinity의 동시 신호
3. state vulnerability: actor Country의 legitimacy weakness, stateCapacity
   weakness, instability

T015의 support-gradient 의미를 재사용하여 route의 external exposure는
`max(0, sourceSupport - destinationSupport) × effectiveStrength × channelWeight`로
읽는다. channel은 `border`, `trade`, `migration`, `information` 중 실제 edge의
값만 사용하며 disabled/0-strength route는 exposure가 아니다. domestic signal이
없으면 source support나 ideology 이름만으로 threat를 만들지 않는다. vulnerability는
domestic exposure를 증폭하지만 vulnerability 단독으로 threat를 만들지 않는다.

route snapshot은 actor/source Country, ideology, source/destination Region,
`ContactEdgeId`, channel, effective strength, source/destination support와 gradient,
destination radicalism/ideology organization, domestic faction IDs, vulnerability
components, eligibility, severity를 보존한다. 그룹 aggregate도 원래 routes를 버리지
않는다. regime/government label, ideology display name, `foreignSupport`,
`ideologyPower` 같은 이름 기반·가상 meter는 입력이 아니다.

### Read/write and cadence boundary

T020은 `Region.ideology`의 support/radicalism/organization, `Faction` dimensions,
Country metrics, Government, Region/LandHex controller를 쓰지 않는다. 이념 writer는
계속 T015 `ideologyDiffusion` phase 하나이며, T020의 diplomacy response는
`contactEdgeStates`만 기존 canonical writer를 통해 바꾼다. observation/proposal은
T015 diffusion 뒤, daily pipeline의 diplomacy phase에서 읽고 monthly political
checkpoint에서만 next-tick proposal을 만든다. 정보·교역·이주 위협도 감지할 수
있지만 T020이 구현한 response가 없으면 `WAIT`다.

### Hysteresis and deterministic response

incoming restriction threshold와 restore threshold는 별도 중앙 설정이다.
restore 가능 여부는 현재 actor-owned T020 closure를 가상으로 다시 열어 계산한
live threat가 restore threshold 아래인지로만 판정한다. cooldown, 숨은 clock,
randomness는 없다. heuristic 우선순위는 다음과 같다.

1. high actionable incoming border threat → `RESTRICT_INCOMING_BORDER`
2. 기존 T019 severe domestic weakness → outgoing `CLOSE_BORDER`
3. threat가 restore threshold 아래로 감소한 actor-owned incoming closure →
   `RESTORE_INCOMING_BORDER`
4. 기존 T019 recovery → outgoing `REOPEN_BORDER`
5. `WAIT`

이 순서는 threat severity, actionable border route, live contribution strength,
stable Country/Ideology/ContactEdge ID 순으로 결정된다. foreign-to-foreign도 같은
계약을 사용하며 player Country를 특별 취급하지 않는다. incoming restriction은
border route만 바꾸므로 information/trade/migration threat를 해결했다고 주장하지
않는다.

### T020 non-goals

T020은 foreign support transfer, faction funding, propaganda, censorship,
information restriction, migration/refugee resolution, sanctions/trade economy,
diplomacy relation score, military/army/occupation/war resolution, coup/rebellion,
Government transition, victory/defeat를 구현하지 않는다. T018의 foreign support와
military evidence는 계속 `notImplemented`다. 실제 해결 action/event의 provenance는
현재 available event context를 넘어서 fake cross-tick cause ID를 만들지 않는다.

## 10.8 T021 Simplified Conflict / War

T021은 이미 존재하는 active armed `Conflict`가 전략적 수준에서 LandHex
controller를 한 칸씩 바꾸는 최소 resolution substrate다. 전쟁 선포, 평화협상,
군대 entity, 전술 명령, 병참, 사상자, terrain modifier는 이 범위에 없다.

### Conflict kind boundary

- `coup`는 중앙정부 장악 시도이며 T021 territorial resolver에서 제외한다.
- `rebellion`은 같은 Country의 Faction이 실제 영토 contest로 전개될 수 있다.
- `civilWar`는 두 Faction participant 사이의 기존 armed contest를 처리할 수 있다.
- `war`는 두 Country participant의 현재 LandHex control과 물리 adjacency를
  사용한다.

T019/T020은 `DECLARE_WAR`, `MOBILIZE`, `INTERVENE` action을 만들지 않는다.
따라서 T021은 ScenarioDefinition initial Conflict, explicit fixture, 또는 이미
존재하는 active Conflict만 해소하며 자동 전쟁 발발을 추가하지 않는다.

### Derived front and authority

`deriveConflictFrontEdges(scenario, world, conflictId)`는 active armed Conflict의
participant controller가 서로 다르고 물리적으로 인접한 LandHex 쌍을
`LandHexId` 기준으로 안정 정렬해 반환한다. 평화로운 Country 경계, participant가
아닌 uncontrolled Hex, coup conflict는 front가 아니다. front는 selector 결과이며
`WorldState`에 저장하지 않는다.

실제 영토 변경은 `WorldState.landHexStates[*].controller`만 바꾸며 반드시
`changeLandHexController()`를 통과한다. Region 전체를 controller 하나로 덮거나
`Region.ownerCountryId`, `Region.stateControl`, `Region.ideology`,
`ScenarioDefinition.mapContactTopology`를 자동 변경하지 않는다. 점령은 병합이
아니며 CountryId와 legal ownership은 유지된다.

### Derived strength

- Country participant는 canonical `Country.militaryPower` (0–100)를 사용한다.
- Faction participant는 실제 `Faction.organization`, non-negative
  `Faction.resources`의 중앙 saturation
  `resources / (resources + factionResourceReference)`, 그리고 affected Region의
  radicalism·ideology organization·unrest에서 operational capacity를 파생한다.
- T021은 `armyStrength`, `combatPower`, `weapons`, `militiaStrength`,
  `militarySympathy`, foreign military support 같은 새 authoritative meter를
  만들지 않는다.
- terrain, production, logistics, stateCapacity는 이번 strength 계산에 들어가지
  않는다. advantage margin 미달은 유효한 stalemate다.

### Weekly phase-start resolution

authoritative tick은 계속 하루지만 territorial resolution boundary는 중앙
`CONFLICT_RESOLUTION_CONFIG.cadence = weekly`를 사용한다. conflict phase는 매일
호출될 수 있으나 non-boundary day에는 territorial intent를 적용하지 않는다.

각 boundary는 다음 단계를 따른다.

```text
phase-start WorldState
  -> active armed Conflict별 최대 1 TerritorialControlIntent 파생
  -> ConflictId 오름차순 target reservation/collision 처리
  -> target LandHexId, ConflictId stable order로 accepted intent 적용
  -> changeLandHexController()가 현재 event buffer/next sequence를 이어받음
```

한 Conflict는 boundary마다 최대 1개의 LandHex controller change를 만든다.
새로 capture한 Hex는 같은 boundary의 추가 intent source가 되지 않는다. 두
Conflict가 같은 target을 요구하면 canonical `ConflictId`가 먼저 reservation하고
나머지는 no-op/rejected intent가 된다. 여러 accepted mutation은 매 mutation의
`nextWorld`, event buffer, sequence를 다음 mutation에 전달하며 causeIds는 이미
알려진 event만 참조한다. T021 baseline에는 RNG가 없다.

### Rebellion and country-war movement

영토가 없는 active rebellion은 먼저 T018의 affected Region을 current political
mobilization evidence로 ranking하고, 그 Region의 Country-controlled LandHex를
`RegionId -> LandHexId` 순으로 하나 선택한다. faction operational strength가
government Country strength보다 margin 이상 높을 때만 initial seizure를 시도한다.

F04B의 좁은 내부 recovery seam도 같은 weekly phase-start resolver에 속한다.
Country가 모든 LandHex를 잃었지만 active internal `rebellion`, valid current
Government, affected Region의 positive `stateControl`, 그리고 current Country
military capability가 남아 있으면, government strength
(`militaryPower × stateControl`)가 현재 faction operational strength보다 기존
advantage margin 이상 클 때 최대 하나의 faction-held LandHex에
`governmentRecovery` intent를 만들 수 있다. 이는 zero territory를 defeat로
정의하지 않으며, coup/foreign war에는 적용하지 않는다. Region owner는 관련성
검사일 뿐 물리적 controller가 아니다.

faction이 이미 Hex를 통제하면 확장 target은 faction-controlled Hex와 인접한
eligible Country-controlled Hex에서만 고른다. 반대로 government가 우세하고
faction territory가 있으면 Country-controlled Hex와 인접한 faction Hex를 한 칸
재점령할 수 있다. Country war도 같은 front adjacency 규칙을 따르며 우세가
없으면 영토를 이동시키지 않는다. Region의 모든 Hex를 한 번에 뒤집는 shortcut은
없다.

T018 prerequisite가 새 rebellion을 detect한 phase에서는 그 conflict를 같은
phase의 territorial snapshot에 포함하지 않는다. 다음 eligible weekly boundary
부터만 intent가 가능하다. faction territory가 없고 T018 rebellion prerequisite가
더 이상 eligible하지 않으면 active rebellion을 `statusQuo`로 suppress할 수
있지만, faction이 LandHex를 점유한 active rebellion은 prerequisite 일부가
낮아져도 삭제하지 않는다. suppression은 현재 faction territory가 0인 경우에만
적용된다. 따라서 active conflict dedup는 중복 생성 방지이며, conflict 전체의
정치/territorial response를 흡수하는 면역 규칙이 아니다.

같은 weekly boundary의 territorial resolution 뒤에도 player Country가 통제하는
LandHex가 0이고, 해당 Country의 active internal `rebellion` participant Faction이
실제 LandHex를 통제하는 상태는 유효한 displacement/stalemate 관찰값일 뿐이다.
그 상태만으로 conflict phase가 `Country.stateContinuity`를 낮추거나
`STATE_DISSOLVED`를 만들지 않는다. F04B의 strength-qualified government recovery는
기존대로 최대 하나의 Hex를 회복할 수 있지만, 회복 여부와 무관하게 continuity
decrement writer는 없다. foreign occupation, coup, faction의 물리 통제가 없는
반란도 state continuity evidence를 자동으로 만들지 않는다. F05_FIX2가 추가했던
내부 반란 continuity writer는 이 계약과 충돌하여 F05_FIX3에서 제거되었고,
그 역사적 근거는 별도 F05_FIX2/F05_FIX2_R 문서에 보존한다. 현재 T023은
scenario-owned threshold를 읽기만 하며, annexation·permanent fragmentation·
sovereign-function evidence는 근거가 추가될 때까지 deferred다.

### Government continuity seam

명시적인 typed `ConflictOutcome.governmentTransition`을 적용할 때만 기존
Scenario/WorldState에 이미 존재하는 target Government를 사용한다. 새 Government를
즉석 생성하지 않으며, 이전 central Government는 contender로 남기고 target을
central로 만들어 같은 Country의 `currentGovernmentId`만 교체한다. CountryId,
LandHex control, RunOutcome는 자동 교체·패배하지 않는다. `stateDissolved` 적용은
T023 책임으로 T021에서 거부한다.

T024 persistence/replay, war declaration/peace/annexation,
army/RTS micro, terrain combat, logistics, casualties, foreign military
intervention, UI/front rendering은 후속 범위다.

## 10.9 T022 Order Consolidation contract

T022는 `evaluateOrderConsolidationAndDissolution` phase에서 현재 state를 다시
읽는 순수 eligibility projection과 그 결과를 `RunState`에 기록하는 얇은 writer로
구성한다.

```text
ScenarioDefinition.orderConsolidationCriteria + current WorldState
  -> deriveOrderConsolidationEligibility()
  -> RunState.consolidation
  -> ORDER_CONSOLIDATION_STARTED / ORDER_CONSOLIDATED
  -> RunOutcome { status: "won", kind: "orderConsolidated" }
```

- criteria 자체는 `ScenarioDefinition`에만 있고 `WorldState`/`RunState`에 복사하지
  않는다. selector snapshot은 저장하지 않는다.
- selector는 stable Region, capital, core Region, `Country.stateCapacity`,
  `Country.treasury`, relevant active `civilWar`를 각각 설명하는 evidence와
  `failedCriteria`를 반환한다. criteria에 없는 legitimacy, production,
  militaryPower, ideology, Government label은 blocker가 아니다.
- required stable/core Region과 capital은
  `deriveRegionControlSummary()`의 LandHex-derived full-control projection을
  사용한다. partial Region/capital은 통과하지 않으며 `ownerCountryId`는 읽지
  않는다. 물리 영토 authority를 `Region`에 다시 저장하지 않는다.
- `maximumStableRegionUnrest`는 선택적인 scenario-owned 0–1 threshold다. 이
  값이 없으면 stable Region 판정은 현재 criteria가 정의한 full-control만
  사용하며, 전역 victory threshold를 암묵적으로 만들지 않는다.
- state-capacity와 treasury는 inclusive `>=` 비교를 사용한다. active civil war
  금지는 `requiresNoActiveCivilWar`가 true일 때 player Country 또는 player
  faction이 participant인 active `civilWar`만 막는다. rebellion, coup, foreign
  war, closed border는 자동 blocker가 아니다.
- `requiredConsecutiveTicks`가 양수인 configured scenario에서만 매 evaluation
  tick 조건을 재평가한다. eligible이면 1 증가하고, 한 조건이라도 깨지면 0으로
  reset한다. 0은 foundation/legacy fixture의 T022 evaluation disabled 값이다.
- 첫 eligible tick의 0 -> 1 전환에서 `ORDER_CONSOLIDATION_STARTED`를 한 번
  만들고, exact required tick에서 `ORDER_CONSOLIDATED`를 한 번 만든다. 두
  event의 `causeIds`는 실제 선행 event가 없으므로 빈 배열이다. `RunOutcome`의
  `causeEventId`는 해당 `ORDER_CONSOLIDATED` event ID를 가리킨다.
- 승리 평가 뒤 `closeDay`가 정상적으로 해당 하루를 마치며, terminal 다음
  step은 기존 terminal gate에 따라 phase/event/RNG/date/tick을 모두 동결한다.
  같은 CountryId의 Government transition이나 derived regime classification
  변화는 streak를 자동 reset하지 않는다.

## 10.10 T023 State Dissolution contract

T023은 `evaluateOrderConsolidationAndDissolution` phase 안에서 국가 소멸을
판정하는 유일한 terminal-defeat writer다. 이 phase는 T021 conflict resolution
직후에 dissolution을 먼저 평가하고, 실제 dissolution이 확인된 날에는 T022
consolidation 평가를 실행하지 않는다.

```text
ScenarioDefinition.dissolutionCriteria + current WorldState
  -> deriveStateDissolutionEligibility()
  -> STATE_DISSOLVED
  -> RunOutcome { status: "defeated", kind: "stateDissolved" }
```

- `ScenarioDefinition.dissolutionCriteria`만 기준의 source다. criteria 또는
  selector snapshot을 `WorldState`/`RunState`에 복사하지 않는다.
- `deriveStateDissolutionEligibility()`는 pure deterministic read model이다.
  현재 authoritative evidence로 지원하는 유일한 조건은 player Country의
  `stateContinuity <= stateContinuityAtOrBelow`이며, 경계값을 포함한다. T023은
  `stateContinuity`를 읽지만 writer나 감소 공식을 소유하지 않는다. F05_FIX2의
  unresolved internal-rebellion displacement writer는 제거되었으며, 현재 T021
  conflict phase에도 displacement-only continuity writer가 없다.
- `fullAnnexationIsTerminal`, `permanentFragmentationIsTerminal`, 그리고
  `sovereignFunctionsRequiredForContinuity`는 ScenarioDefinition의 정적 계약으로
  보존하지만, 현재 authoritative evidence가 없으므로 `deferred`로 기록한다.
  모든 LandHex의 외국/무정부 controller, 수도 상실, occupation, treasury,
  instability, stateCapacity, `currentGovernmentId`, regime/ideology, active
  rebellion/civil war만으로는 dissolution을 추론하지 않는다. permanence timer,
  sovereignty meter, successor state, annexation shortcut을 추가하지 않는다.
- 향후 territorial evidence가 추가되더라도 authority는
  `WorldState.landHexStates[*].controller` 및 그로부터 파생된 selector여야 한다.
  현재 T023 evaluator는 occupation을 annexation의 증거로 사용하지 않는다.
- dissolution이면 해당 step에서 `STATE_DISSOLVED` 하나만 만들고
  `RunOutcome.causeEventId`는 그 실제 event ID를 가리킨다. 현재 source event가
  없으므로 `causeIds`는 `[]`이다. event payload에는 CountryId, reason, 평가 tick/date,
  stateContinuity와 threshold, 지원/지연 criteria evidence를 남긴다.
- dissolution이 아니면 기존 T022 평가를 그대로 수행한다. 따라서 한 step에서
  `STATE_DISSOLVED`와 `ORDER_CONSOLIDATED`를 함께 emit하지 않는다. 이미 won인
  run도 outcome을 defeated로 바꾸지 않는다.
- terminal run은 공통 `runSimulationStep()` gate를 따른다. 후속 step은 같은
  WorldState identity를 반환하며 date, tick, RNG, phases, actions, events를
  진행하지 않는다.

T023은 full annexation/영구 분열/주권 기능 상실의 실제 evidence writer를
추가하지 않는다. 해당 evidence는 future architecture/content work이며, T024가
그 writer들이 소비할 runtime snapshot, EventStore, RNG, cross-tick replay
boundary를 제공한다.

---

# 11. Foreign AI

Foreign states are macro agents.

T019의 production foreign-action semantics는 outgoing `CLOSE_BORDER`,
`REOPEN_BORDER`, `WAIT`로 유지된다. T020은 incoming border restriction 두 action과
causal ideological-threat read model만 추가했다. Regime prestige, sanctions, trade
leverage, faction funding, propaganda, war, and richer bilateral relations remain
future systems and are not implied by either baseline.

Observation payload must be compact:
- own regime/state health,
- player state,
- border regions,
- trade dependence,
- ideology threat,
- military balance,
- active conflicts,
- available actions.

LLM output:

```ts
type ForeignAction =
  | { type: "TRADE"; target: CountryId }
  | { type: "SANCTION"; target: CountryId }
  | { type: "CLOSE_BORDER"; target: CountryId }
  | { type: "SUPPORT_FACTION"; target: FactionId; level: 1 | 2 | 3 }
  | { type: "MOBILIZE"; targetRegion: RegionId }
  | { type: "INTERVENE"; conflictId: ConflictId }
  | { type: "OFFER_PEACE"; target: CountryId }
  | { type: "WAIT" };
```

AI cannot return arbitrary commands.

---

# 12. Client / Server AI Flow

```text
Browser simulation reaches decision checkpoint
        |
        v
build bounded observation
        |
        v
POST /api/agent-decision
        |
        v
server calls model
        |
        v
schema validation
        |
   valid? ---- no ---> heuristic fallback
        |
       yes
        |
        v
return action proposal
        |
        v
simulation validates and resolves
        |
        v
record validated input event
```

Must include:
- timeout
- retry policy
- rate limit
- fallback
- telemetry
- no secret leakage

## 12.1 Future Strategic Planning / Forward-Model Boundary

Strategic planning is a future client of the authoritative simulation, not a second
game engine. The current `WorldState`, `ScenarioDefinition`, legal-action validation,
and authoritative `runSimulationStep` remain the only forward model.

The smallest future adapter concept is intentionally not a locked TypeScript API:

```text
StrategicPlanningAdapter
  - enumerateLegalActions(state, actor)
  - simulate/transition(state, action)
  - isTerminal(state)
  - evaluateOutcome(state, actor)
```

Any counterfactual state is a clone/read-only rollout result. A planner must not mutate
committed `WorldState`, `ActionRecord` history, RNG state, or `GameEvent` history. Once a
planner chooses an action, it returns the same bounded `ActionProposal` used by player,
heuristic, and LLM inputs; the normal validator and simulation resolver remain the only
authoritative mutation path.

Do not add a planner-owned world model, duplicate rules, hidden resource bonuses,
prerequisite bypasses, impossible information, or a generic authoritative utility
score. Future evaluation may compare actor-specific hierarchical objectives with hard
survival constraints, but that vocabulary is not current state and is not yet locked.

T025B may compare the existing heuristic, bounded top-K counterfactual rollout, an
adapted MCTS search, and conditional RHEA using explicit horizon, candidate,
opponent-model, and forward-model-call budgets. External search libraries are research
or reuse candidates only; no library is adopted by this contract.

---

# 13. Presentation State

World renderer does not consume raw deep domain state everywhere.

Use a renderer-neutral derived presentation read model. The concrete V01 shape is
owned by `src/presentation/presentationState.ts`; it is not a second simulation
state or a universal UI DTO.

### V00 presentation boundary — docs-only contract

V00은 art direction 자체를 이 문서의 authority로 만들지 않는다. 이 문서가
소유하는 것은 authoritative data flow와 mutation boundary이며, 시각언어·semantic
channel·asset provenance·acceptance checklist는 `docs/VISUAL_BIBLE.md`,
`docs/VISUAL_REFERENCE_CATALOG.md`, `docs/ASSET_SOURCE_CATALOG.md`,
`docs/VISUAL_QA.md`가 소유한다.

```text
ScenarioDefinition + WorldState + committed EventStore evidence
  → pure presentation selectors / derivePresentationState
  → PresentationState
  → React/R3F/DOM/WebGL presentation
```

- `WorldState`와 `EventStore`는 presentation이 읽는 authoritative evidence다.
- pure selector는 state, RNG, EventStore를 mutate하지 않으며 새로운 simulation
  entity나 rule을 발명하지 않는다.
- React/R3F/DOM/WebGL은 `PresentationState`와 derived selectors를 소비할 뿐
  authoritative simulation outcome, territorial controller, conflict, ideology,
  victory/defeat를 계산하거나 직접 변경하지 않는다.
- `src/sim/`은 React 또는 rendering module을 import하지 않는다.
- V01은 `src/presentation/presentationState.ts`의
  `derivePresentationState(scenario, world)`로 이 경계를 구현한다. 실제 map
  renderer와 Three.js/R3F dependency는 여전히 Gate 1V/V02 이후 범위이며,
  V01 module은 React, R3F, Three.js를 import하지 않는다.

최소 channel authority는 다음과 같다.

| Presentation signal | Source / projection | Presentation boundary |
|---|---|---|
| physical territorial control | `WorldState.landHexStates[*].controller` → Region summary | fill/boundary; Region summary를 writable state로 저장하지 않음 |
| political influence | Region ideology / Region-level derived read model | pattern + limited hue; LandHex ideology 복제 금지 |
| political organization | actual Faction 또는 future authoritative organization state | token; ideology organization만으로 entity 발명 금지 |
| ContactGraph route | directed static topology + runtime overlay | route/movement; TerritorialTopology와 별도 |
| active armed front | adjacent controller difference + active armed Conflict | strong line; front 자체는 non-authoritative |

이 boundary는 기존 simulation authority, T017B LandHex authority, T024 snapshot/
replay 계약의 presentation 적용 사례다. V00은 selector를 구현하지 않는다.

### V01 Presentation State implementation

V01의 read model은 다음의 최소 semantic layer를 안정적인 canonical order로
제공한다.

- `landHexes`: ScenarioDefinition의 static `LandHexDefinition`에서 `landHexId`,
  `regionId`, axial `q/r`, terrain을 읽고, controller는
  `WorldState.landHexStates[*].controller`에서 복사한다. `x/y/z` renderer 좌표는
  없다.
- `regions`: Region의 legal/역사적 `ownerCountryId`, T017B
  `deriveRegionControlSummary()` 결과, 현재 unrest/scarcity, Region ideology의
  양수 support를 정치 영향으로 제공한다. ideology support는 기존 값을
  노출하는 것이며 새로운 influence 공식이나 LandHex-level 복제가 아니다.
- `organizationTokens`: 현재 모델에 Region별 비영토 조직 anchor가 없으므로,
  실제 Faction이 하나 이상의 LandHex controller로 존재하는 Region에만
  `factionId`/`organization`/controlled LandHex IDs를 가진 token을 만든다.
  support, currentStrategy, 또는 IdeologyState.organization만으로 token을
  발명하지 않는다. 후속 authoritative organization state가 생기면 이 selector의
  입력으로 명시적으로 확장한다.
- `contactRoutes`: T019/T020의 directed static edge와 runtime overlay를
  `getOutgoingContacts()`로 읽는다. source/target 방향, channel, effective
  strength, disabled/blocked metadata를 유지하며 route geometry는 만들지 않는다.
- `fronts`: T021 `deriveActiveConflictFrontEdges()`를 사용한다. active
  rebellion/civilWar/war와 현재 LandHex controller에서만 front를 파생하고,
  coup와 평화 국경은 제외한다. front 자체는 WorldState에 저장하지 않는다.
- `run`: 현재 RunOutcome과 OrderConsolidation progress만 복사한다. Government,
  regime, CountryId map identity는 서로 대체하지 않는다.

`derivePresentationState()`와 각 selector는 ScenarioDefinition/WorldState를
변경하지 않고 RNG, ActionProposal, GameEvent, simulation writer를 호출하지
않는다. PresentationState는 T024 snapshot에 추가하지 않으며, JSON save/load
후 WorldState에서 다시 파생한다. arrays는 domain ID의 `<`/`>` 비교로 정렬하고
`localeCompare` 또는 iteration index를 identity로 사용하지 않는다. 이는
WorldState record insertion order와 renderer implementation을 분리하기 위한
V01 determinism 계약이다.

`src/sim/`은 계속 presentation module을 import하지 않는다. 향후 React/R3F는
이 read model을 소비할 뿐 authoritative control, influence, organization,
contact eligibility, front, victory/defeat를 재계산하지 않는다.

Examples of WorldSignal:
- protest crowd density
- queue length
- shop closures
- soldier presence
- refugee flow
- market activity
- banners/flags
- smoke/damage
- paperwork load

This separates UX tuning from domain truth.

### Procedural Political Press / Gazette boundary

정치신문/관보는 authoritative simulation system이 아니라 기록된 역사를
표현하는 derived read model이다. T024 이후의 기본 흐름은 다음과 같다.

```text
EventStore (ordered ActionRecord / GameEvent history)
  → deterministic PressFacts
  → publication perspective
  → authored template / grammar
  → deterministic seeded variant
  → press presentation
```

- PressFacts는 실제 기록에서 bounded facts만 파생한다. 존재하지 않는
  actor, action, 수치, 피해, event, 또는 causal relation을 만들지 않는다.
- press output은 `WorldState`의 authoritative field나 event source가 아니며,
  기사/신문 문장을 `WorldState`에 저장하지 않는다.
- publication framing은 current Government/institutional rules, 실제
  actor/Region, recorded event kind와 같은 presentation context를 읽을 수
  있지만 Government, RegimeClassification, CountryId, policy effect,
  ideology, faction, unrest, conflict, territorial controller, victory/defeat를
  변경하지 않는다.
- 같은 recorded facts에 대해 publication perspective가 표현·강조·비핵심
  생략을 다르게 할 수 있다. framing은 사실을 추가하거나 인과를 다시 쓰는
  권한이 아니다.
- 기본 runtime은 외부 API, 인터넷, OpenAI, local LLM, WebGPU inference에
  의존하지 않는다. authored static content와 deterministic seeded selection이
  primary path이며, 개발-time AI authoring은 reviewed content drafting일 뿐
  runtime dependency가 아니다.
- exact `PressFacts` schema, publication types, template/variant 수, seeded
  algorithm, presentation layout, 저장 방식은 이 시점에 lock하지 않는다.

이 경계는 기존 `Simulation Core → derived presentation` 및 AI non-authority
계약의 적용 사례다. 구현은 T024의 EventStore/Snapshot/Replay 입력이 준비된
뒤 Gate 2 critical-event/news presentation foundation에서 시작하며, 이후
polish는 별도 범위다. `src/sim/`은 press 문장이나 UI를 authoritative하게
생성하지 않으며 renderer는 파생 결과만 소비한다.

### Strategy-map presentation layers

전략 지도는 다음 상태를 시각적으로 구분해야 한다.

1. legal country ownership
2. physical territorial control
3. political influence
4. political organization
5. active conflict / front lines

이들을 하나의 지도 색상으로 합치지 않는다.

기본 시각 매핑은 다음과 같다.

- ideology support → Region 단위 색/문양/영향 overlay
- actual Faction/organization state → faction/organization token
- military/revolutionary occupation → LandHex controller 및 국경 변화
- active territorial conflict → front-line visualization
- ContactGraph → trade/information/migration route visualization
- POI → 전략 지도 내부의 landmark/icon

POI를 보기 위해 별도의 광산/항구/도시 gameplay scene으로 진입하는 것을 기본 구조로 하지 않는다.

핵심 시각 원칙:

**사상은 색과 문양으로 퍼지고, 조직은 지도 위의 말이 되며, 혁명은 영토가 된다.**

### Moving Strategic Visuals

중요한 simulation process는 가능한 경우 전략 지도 위에서
움직이는 시각 표현을 가져야 한다.

목적은 숫자나 보고서를 열기 전에 플레이어가
세계의 흐름과 침범 방향을 지도 자체에서 읽을 수 있게 하는 것이다.

이러한 표현은 실제 simulation state에서 파생되는 presentation이며,
별도 authoritative simulation entity로 취급하지 않는다.
단, 해당 시스템이 명시적으로 실제 entity를 요구하는 경우는 예외다.

#### Contact movement

`ContactGraph` channel은 서로 구분되는 지도 표현을 사용한다.

`trade`
- merchant ships
- caravans
- trade wagons
- cargo flow

`information`
- messengers
- courier movement
- newspaper / pamphlet pulses
- 빠른 정보 흐름 표현

`migration`
- migrant groups
- refugee columns
- population movement

`border`
- travelers
- patrol crossings
- local cross-border traffic

ContactEdge는 단순한 정적 선으로만 표현하지 않는다.

플레이어는 상세 보고서를 열지 않아도 예를 들어

"상인공화국과 서부 해안주의 왕래가 강해지고 있다."

라는 사실을 지도에서 인지할 수 있어야 한다.

#### Political organization tokens

실제 `Faction` 또는 향후 authoritative organization state가 존재하고 해당
상태가 presentation selector에 의해 선택될 때만 지도 위에 정치조직 token을
표시할 수 있다. 이념의 `organization`은 그 조직의 가시성·행동 가능성을
판단하는 입력일 수 있지만, 그 값만으로 token을 만들 권한은 없다.

예:

- 왕당파 귀족회
- 상인 정치클럽
- 노동조합
- 공화주의 신문사
- 노동자 평의회
- 종교조직
- 군부 정치조직

이 token은 단순 ideology decoration이 아니라
실제로 조직된 정치 행위자의 존재를 표현한다.

시각 원칙:

`support -> influence pattern`

`actual organization state -> visible token`

`IdeologyState.organization` 값만으로 새로운 정치 행위자 entity나 지도 marker를
생성하지 않는다. 정치조직 token의 identity는 실제 `Faction` 또는 후속
authoritative organization state에서 파생해야 하며, ideology `organization`은
해당 조직의 출현/가시성/행동 가능성에 기여하는 simulation input으로만 사용할
수 있다.

Presentation을 위해 존재하지 않는 정치조직을 만들어내지 않는다.

#### Military and revolutionary movement

군대와 실제 무장 혁명세력은 전략 지도 위에서
물리적인 이동 주체로 보여야 한다.

가능한 표현:

- army token
- banner / column
- marching formation
- revolutionary militia token
- advancing / retreating front marker

군대와 혁명군의 이동은 `LandHex` territorial topology를 사용한다.

ContactGraph를 따라 움직이는 사회적 접촉 표현과
군사적 이동 표현을 동일한 화살표나 시각 언어로 표현하지 않는다.

예:

`merchant ship -> port`
= trade / ideological exposure

`army token -> LandHex`
= military invasion / controller change

`organization token -> uprising -> revolutionary force -> LandHex occupation`
= political organization becoming territorial conflict

#### Front lines

갈등이 실제 영토 통제로 전환되면
숫자만 변경하지 않고 지도 위에 전선을 표현한다.

전선 후보는 서로 다른 controller를 가진 인접 LandHex에서 파생되는
non-authoritative presentation이다. 전선 자체를 `WorldState`에 저장하거나
territorial authority로 사용하지 않으며, 정확한 adjacency 처리·전선 묶음·
충돌 표시는 T021의 conflict resolution/presentation boundary에서 결정한다.

표현 예:

- contested border
- battle marker
- occupation direction
- advancing front
- retreating front

전선 표시는 전략적 방향과 영토 변화의 가독성을 위한 것이다. 개별 병력의
미세 명령, 모든 LandHex의 상시 전투, 전술 RTS 수준의 조작은 요구하지 않는다.

#### Three readable movement types

플레이어는 지도에서 다음 세 흐름을 즉시 구분할 수 있어야 한다.

1. 사회적 접촉
   - ships
   - caravans
   - messengers
   - refugees
   - trade / information / migration 영향 전달

2. 정치적 조직
   - faction / organization tokens
   - 실제 정치 행동이 가능한 조직의 존재

3. 물리적 침공
   - armies
   - revolutionary forces
   - front lines
   - territorial controller 변화

세 종류를 동일한 색, 화살표, particle로 표현하지 않는다.

### Visual escalation

전략 지도는 다음 변화 과정을 시각적으로 읽을 수 있어야 한다.

`contact`
→ `ideological influence`
→ `political organization`
→ `uprising`
→ `territorial occupation`
→ `front line`

즉,

**사상은 색과 문양으로 퍼진다.  
조직은 지도 위의 말이 된다.  
혁명과 전쟁은 영토와 전선을 움직인다.**

### Visual Simulation Validation Boundary

Before final game UX is built, the project may expose a developer-only
strategy-map visualization for simulation validation.

This visualization is not authoritative gameplay state.

It may provide:

- accelerated playback
- pause / step
- seed selection
- replay/reset
- ideology overlays
- ContactGraph routes
- Faction/organization markers
- LandHex controller visualization
- conflict/front visualization
- event timeline/ticker
- optional synchronized counterfactual comparison

Architecture rules remain unchanged:

`Simulation Core`
→ `PresentationState / debug selectors`
→ `Debug Strategy Map Renderer`

The debug renderer:

- must not mutate WorldState,
- must not implement simulation rules,
- must not skip authoritative simulation ticks to fake timelapse results,
- must not become a second simulation implementation.

Developer playback speed may be much faster than player-facing T041 speeds.

Timelapse acceleration changes how quickly authoritative steps are executed/observed,
not the result of those steps.

The purpose of this layer is to validate whether simulation history is
spatially readable before committing to final HUD, menus, art, opening,
event presentation, and ending screens.

### Spatial density and Gate 1V boundary

LandHex density is content, not an engine invariant. The current headless fixture
with 7 Regions and 9 LandHexes is a topology/authority validation fixture, not a
production map-size decision. Gate 1V owns comparison of candidate densities
(for example 20/35/50, without locking those values) against spatial readability,
change visibility, pacing, visual clutter, and game feel. Responsive concerns are
validated again at Gate 5, but Gate 1V must already reject a map whose essential
signals are unreadable at the intended strategic scale.

The product pacing target is approximately 15–25 minutes for a full run and
20–40 simulated years. This target prioritizes simulation readability over
geographic fidelity; it does not authorize a fixed LandHex count, per-Hex
political simulation, or tactical micro-management.

### Gate 1V performance carry-forward

T024에서 correctness-first로 남긴 `commitSimulationStep()` 전체 history validation의
잠재적 누적 비용(O(ticks²))은 F01에서 실제 측정했고, F01A에서 canonical
continuation incremental validation으로 해소했다. Gate 1V timelapse의
20–40 simulated years, 즉 현재 360일 calendar 기준 약 7,200–14,400
authoritative daily ticks benchmark는 계속 수행하지만, 현재 측정에서는 residual
performance blocker가 관찰되지 않았다. full serialize/deserialize trust-boundary
validation과 corruption rejection은 최적화 대상에서 제외한다.

---

# 14. Responsive Composition

Use layout state derived from available container/viewport, not simulation logic.

Suggested:
- `desktop`
- `tablet`
- `mobilePortrait`
- `mobileLandscape`

Do not fork game state.

Desktop:
- canvas flexes
- inspector persistent

Tablet:
- inspector becomes overlay/sheet

Mobile:
- world + bottom sheet
- reduced HUD
- lenses in compact menu

Input abstraction:
- pointer/touch
- keyboard shortcuts optional
- no essential hover

---

# 15. Rendering Performance

Initial targets:
- desktop 60fps typical
- mobile/tablet gracefully degrade
- game simulation independent from render fps

Strategies:
- instancing
- LOD
- aggregate crowds
- sprite/impostor where appropriate
- lazy asset loading
- compressed GLB/textures
- avoid per-agent React components for large crowds
- cap post-processing on mobile

Performance budgets should be measured, not guessed.

---

# 16. Progressive Enhancement

## WebGPU

Feature detect.
If available and tested, optional renderer/effects can use it.
Core game remains on stable WebGL path.

## HTML-in-Canvas

Feature detect.
Use only for non-essential signature effects.
Fallback to regular DOM/world texture.

No core control may require experimental APIs.

---

# 17. Save / Replay

T024는 authoritative runtime과 이미 커밋된 causal history를 함께 보존하는
versioned in-memory snapshot boundary를 구현했다. 현재 public contract는
`SerializedSimulationSnapshotV2`, `serializeSimulationSnapshot()`/
`serializeSimulationSnapshotJson()`, `deserializeSimulationSnapshot()`,
`commitSimulationStep()`, `cloneRunRecordViaSnapshot()`이다. 브라우저 파일,
`localStorage`/IndexedDB, cloud save slot은 이 경계의 책임이 아니다.

snapshot envelope에는 다음만 들어간다.

- `formatVersion`, `scenarioId`, `scenarioVersion`
- 현재 `WorldState`의 tick/date, Country/Region/Faction/Government/Conflict,
  policy/institution runtime, intervention commitment, mutable ContactGraph edge
  state, `LandHexRuntimeState`, `RunState`, `rngState`
- `RunState.actionLog`의 player/heuristic/LLM 공통 `ActionRecord` history
- 별도로 보관되는 `EventStore`의 전체 ordered `GameEvent` history

`ScenarioDefinition`과 static `TerritorialTopology`/ContactGraph definition은
snapshot에 복제하지 않는다. Region control summary, Country territorial list,
front, Agenda, faction pressure, threat, regime classification,
consolidation/dissolution eligibility, UI/presentation state도 저장하지 않는다.
복원 뒤 현재 scenario와 runtime state에서 selector/read model을 다시 계산한다.

```text
static ScenarioDefinition (별도 로드)
  + SerializedSimulationSnapshotV2
  -> validated WorldState + EventStore
  -> derived selectors/read models
```

## 17.1 Deserialize trust boundary

deserialize는 외부/저장 데이터를 `WorldState`로 직접 cast하지 않는다. JSON
primitive/array/record와 각 domain enum/id를 명시적으로 decode하고 unknown key,
잘못된 format version, 필수 필드 누락, 잘못된 reference를 거부한다. decode 뒤에는
`assertScenarioRuntimeClosure(scenario, world)`가 현재 V2 시나리오와 runtime 전체가
닫혀 있는지 검증한다.

- snapshot top-level identity와 `WorldState.run.scenarioId/version`이 전달된
  `ScenarioDefinition`과 일치해야 한다.
- `assertLandHexRuntimeStateInvariants(scenario, world)`를 포함한 scenario-aware
  closure 검증을 deserialize 뒤에 실행한다. 모든 scenario LandHex의 runtime
  controller가 정확히 하나씩 존재해야 하고 unknown/missing LandHex와 잘못된
  Country/Faction controller를 거부한다. static LandHex의 `regionId`도 runtime
  Region identity와 닫혀 있어야 한다.
- runtime snapshot은 LandHex의 `q/r`, terrain, `regionId`, adjacency를 갖지
  않는다. 이 static identity/membership/topology는 scenario에서만 읽는다.
- Region에 `controller`를 만들지 않으며, physical territory authority는 계속
  `WorldState.landHexStates[*].controller` 하나다.
- V2에는 Country/Region/Faction/PolicyState의 runtime lifecycle이 없으므로
  `initialCountries`, `initialRegions`, `initialFactions`,
  `initialCountryPolicies`와 각각의 runtime identity set이 정확히 일치해야
  한다. 후속 state successor나 동적 actor 생성을 도입할 때는 별도 lifecycle
  계약과 closure validator 확장이 필요하다.
- 모든 Region이 scenario ideology catalog를 정확히 한 번씩 가지며, PolicyState의
  policy IDs, Faction의 ideology affinity, intervention commitment의
  intervention ID가 현재 catalog에 속하는지 검증한다.
- `currentGovernmentId`, Government의 Country 소유, Conflict outcome의
  Country/Government/Faction winner, Country/Faction/Region/Contact edge/policy와
  terminal `RunOutcome.causeEventId`의 참조 integrity를 검증한다.
- `RunState.actionLog`는 `(tick, sequence, source, actionType)`로 재계산한
  deterministic Action ID와 append-only 중복 금지를 검증한다. Intervention
  commitment는 `sourceActionId`, accepted `START_INTERVENTION` payload, 시작
  tick/country/intervention, deterministic commitment ID가 서로 일치해야 한다.

현재 format은 `version: 2`만 지원한다. F04D의 required
`politicalCompetition`을 누락한 version 1과 unknown version은 명확히
reject한다. migration framework나 과거 format chain은 만들지 않았다. 별도 content hash는
아직 도입하지 않으며, 정적 ScenarioDefinition 호환성은 `scenarioId`와
`scenarioVersion`으로 관리한다. 호환되지 않는 content 변경은 version bump를
요구한다.

## 17.2 Replay and EventStore contract

`EventStore`는 `WorldState` 안에 복제하지 않고 `RunRecord`의 sibling으로
커밋된다. 한 step은 다음 경계에서 원자적으로 보인다.

```text
validated ActionRecord
  -> SimulationStepResult(nextWorld, emittedEvents)
  -> canonical in-process continuation?
       yes: validate new Event/Action/Commitment delta + candidate closure
            -> append immutable EventStore delta
       no:  full existing-record + candidate closure/history validation
  -> next RunRecord
```

`commitSimulationStep(scenario, record, result)`는 untrusted/plain record나
직렬화 경계를 넘은 임의 객체에는 기존 full validator를 사용한다. `runSimulationStep()`
결과와 full-validated `RunRecord`가 같은 in-process `ScenarioDefinition`을 통해
생성되고, 결과의 `sourceWorld`가 commit 대상 `record.world`와 정확히 같은 object
identity인 경우에만 process-local non-serializable marker를 사용해 canonical
continuation 경로로 들어간다. 다른 canonical record에 만든 결과를 같은
ScenarioDefinition이라는 이유만으로 재사용할 수 없다. 이 경로도 새 GameEvent의
deterministic ID/sequence/tick/cause, ActionRecord suffix, 변경된 commitment
provenance, candidate runtime identity/closure, terminal cause relation을 검증한다.
이전 canonical history는 다시 전체 scan하지 않는다.

이 marker는 snapshot field나 user-forgeable `validated` flag가 아니며, JSON
serialize/deserialize에서 복원되지 않는다. deserialize는 full validation을 끝낸
새 record를 다시 in-process canonical seam에 등록한다. `SimulationStepResult`의
process-local capability는 commit 시도 전에 one-shot으로 소비되므로, parent 불일치나
delta validation 실패 뒤에 같은 결과를 재사용할 수 없다. 성공한 결과도 하나의
authoritative transition에만 사용된다. canonical `RunRecord`와 trusted step result의
authoritative object graph는 runtime immutable이며, 새 object/delta만 process-local
incremental freeze로 보호한다. 이미 보호된 object는 다시 전체 graph를 순회하지 않는다.
RunRecord marker registration은 `persistence.ts`의 validated commit/deserialize seam
내부에만 있고, SimulationStepResult registration은 `tick.ts`의 실제 step 생산 seam
내부에만 있다. canonical module과 simulation public export에는 raw
`register(anyRawObject)` capability가 없다. 공통 freeze bookkeeping은 recursive
protection과 `Object.freeze()`가 성공한 뒤에만 completed object를 기록하며, 실패한
traversal은 in-progress 상태를 제거해 같은 object의 재시도에서 stale completion을
사용하지 않는다. step 생산 중 먼저 보호된 WorldState는 simulation-step continuation
최적화 표식일 뿐이며, canonical RunRecord marker나 commit 성공을 의미하지 않는다.
EventStore의 실제 ordered `events` 배열은 유일한 history authority이고, incremental
cause lookup은 그 배열의 deterministic sequence에 대한 파생 조회일 뿐 두 번째 event
cache가 아니다.
검증 실패 시 입력 record/EventStore/action history는 변경되지 않으며,
UI/network/AI는 이 경계를 우회해 WorldState를 쓸 수 없다.

저장/복원은 event의 ID, global sequence, tick, payload, `causeIds`, order를
그대로 보존한다. `EventStore`는 deterministic ID
`event:${tick}:${sequence}:${type}`, strictly increasing sequence,
non-decreasing tick, duplicate ID, existing-only/forward-invalid cause를
검증한다. load 뒤 `WorldState.run.nextEventSequence`는 history의 다음
sequence와 일치해야 하며, terminal outcome의 cause event도 실제 history에서
같은 tick과 호환되는 type으로 확인되어야 한다.

따라서 다음 정의가 T024 replay equivalence다.

```text
same ScenarioDefinition version
  + same validated snapshot
  + same subsequent ActionRecord inputs
  = same WorldState, RunState, RNG, EventStore, event IDs/sequences/causes
```

serialization은 collection record key를 canonical textual order로 쓰지만,
Conflict participant 순서나 Faction interest priority처럼 domain 의미가 있는
array 순서는 바꾸지 않는다. authoritative simulation의 ID ordering에는
locale-dependent comparator를 사용하지 않는다.

전체 EventStore는 `assertEventStoreInvariants()`로 한 번에 검증한다. event ID,
중복 ID, sequence 0 시작 및 strictly increasing global order, non-decreasing tick,
existing-only cause를 모두 확인한다. canonical continuation에서는 새 append
delta에 같은 규칙을 적용하고 기존 history는 canonical 전제로 재검사하지 않는다.
저장 경계를 넘은 뒤에도 이미 저장된 event의
ID를 보존하므로, 이후 실제로 생성된 event가 pre-save event를 cause로 참조하는
것은 persistence-level에서 허용된다. 다만 phase가 실제 causal source 없이
cross-tick cause를 추론하거나 만들어내는 계약은 아니다.

terminal snapshot을 load한 뒤의 step은 공통 terminal gate를 그대로 사용한다.
date/tick/RNG/WorldState/EventStore/action history와 outcome을 변경하지 않고
새 event도 만들지 않는다. T024는 full event-sourced rebuild, arbitrary rewind,
branch timeline, save UI, storage backend, replay viewer를 구현하지 않는다.

## 17.3 F04D institutional mutation boundary

`InstitutionalRuleState.politicalCompetition`은 독립 정치조직의 합법적 조직·경쟁
접근성만 표현하는 required enum이다. `banned | restricted | plural` 외의 값을
허용하지 않고, regime classification·legitimacy·suffrage·press·labor·election
state와 합치지 않는다. Faction pressure의 `BARGAIN` availability가 이 규칙을
직접 읽으며 `LOBBY`와 `ORGANIZE`는 기존의 서로 다른 법적 consumer를 유지한다.

Intervention completion effect의 `institutionalRuleSet`은 typed rule/value 한
쌍을 authoritative PolicyState에 immutable replacement로 적용한다. 실제 값이
바뀐 경우 기존 `INTERVENTION_COMPLETED` 뒤에 `INSTITUTION_RULE_CHANGED`가 나오고,
rule-change event의 `causeIds`는 그 completion event를 가리킨다. 정의가
`requireCompletionEffectChange`를 선택하면 모든 completion effect가 이미
동일한 상태인 start request는 `NO_COMPLETION_EFFECT_CHANGE`로 거부한다.

이 effect는 generic scripting DSL이 아니다. crisis/conflict/territory/government/
consolidation을 직접 쓰지 않으며, 기존 downstream system이 바뀐 PolicyState와
Faction/Region state를 cadence에 따라 읽는다. F04D의 네 대응 정의는 developer
validation fixture에만 있고 production intervention catalog로 승격하지 않는다.

Competition build can support:
- restart same seed
- replay summary
- shareable run code later

---

# 18. Test Strategy

Unit:
- bounded metrics
- deterministic RNG
- T011 controlled-region production aggregation, resource stock/consumption, scarcity, treasury flow, and economic event ordering
- ScenarioDefinition → WorldState 초기화 경계
- Region controller 배타성 및 foreign key
- 정부 교체 후 CountryId 연속성
- action/event의 전역 sequence 및 existing-only `causeIds`
- ideology state invariants (T013부터), explicit contact diffusion invariants (T015부터)
- contact topology validation, directed edge queries, runtime strength overlay, and controller-derived country contacts (T014부터)
- policy rule correctness (T012부터)
- intervention catalog/runtime ownership, derived administrative load/headroom/overload, treasury settlement ownership, duration boundaries, prerequisite feasibility, and same-tick cost competition (T016B부터)
- victory/defeat (T022/T023부터)
- faction prerequisites (T018부터)

System:
- same seed + same inputs => same outcome
- civil war can resolve into continued state
- state dissolution triggers terminal defeat
- AI unavailable => fallback works
- terminal run does not advance tick/date/RNG

Browser:
- desktop
- tablet
- mobile portrait
- mobile landscape
- no secret in bundle
- game playable without experimental APIs

See `QA_PLAYTEST.md`.
