# Gate 1 사전 도메인 계약

**상태:** Accepted — 2026-08-21  
**대상:** T010–T025의 구현 계약  
**범위:** 이 문서는 시스템 로직을 구현하지 않는다. 경제, 확산, 세력 행동, 외교, 갈등, AI, 렌더링은 각 백로그 작업에서 구현한다.

상세 근거와 metric 표는 `docs/ARCHITECTURE.md` 4–7절, 되돌리기 비용은 `docs/DECISIONS.md` ADR-011–ADR-016을 따른다.

---

## 1. 정적 시나리오와 동적 실행 상태

`ScenarioDefinition`은 불변 입력이며 다음을 소유한다.

- `id`, `version`, `playerCountryId`, `initialDate`
- 초기 countries, regions, governments, factions, conflicts, 국가별 policy state
- ideology/policy catalog
- `MapContactTopologyDefinition`과 명시적 `ContactEdgeDefinition`
- `OrderConsolidationCriteria`
- `DissolutionCriteria`

`WorldState`는 한 실행에서 변화하는 countries, regions, governments, factions, conflicts, policy state, RNG, run progress만 가진다. catalog, topology, 승패 criteria를 복사하거나 재정의하지 않는다.

초기화 진입점은 `createInitialWorldState(scenario, seed)`다. `FOUNDATION_SCENARIO`는 Gate 0 부트스트랩 전용이며 T025 시나리오가 아니다.

## 2. 영토 통제

`Region.controller`가 유일한 현재 통제 사실이다.

```ts
type RegionController =
  | { kind: "country"; countryId: CountryId }
  | { kind: "faction"; factionId: FactionId }
  | { kind: "uncontrolled" };
```

- `ownerCountryId`는 법적/역사적 소유권이다. controller와 다를 수 있다.
- `Country.controlledRegions`는 저장하지 않는다. `Region.controller`에서 파생한다.
- 수도 통제도 `capitalRegionId`와 해당 Region controller의 조합으로 판정한다.
- 모든 controller/owner/수도/참가자 참조는 state invariant가 검사한다.

## 3. 국가 연속성, 정부, 체제

- `CountryId`는 국가의 역사적 연속성이다.
- `Country.currentGovernmentId`는 현재 중앙 정부를 가리킨다. 국가가 중앙 정부를 잃으면 `null`일 수 있다.
- `Government`는 `central`, `contender`, `exile` 중 하나의 권위를 가지는 별도 entity다.
- 국가별 `PolicyState`가 제도 상태다.
- `RegimeClassification`은 policy catalog와 활성 PolicyState에서 계산하는 파생 분류다. `Country`/`Government`에 권위 있는 `regime` 필드를 저장하지 않는다.
- `ConflictOutcome.governmentTransition`은 같은 CountryId의 중앙 정부를 교체한다. 이는 자동 패배가 아니다.
- `ConflictStatus`는 `active | resolved`만 사용한다. terminal은 conflict가 아니라 run outcome의 의미다.

## 4. 승리와 패배

`ScenarioDefinition`만 기준값을 소유한다.

```ts
interface OrderConsolidationCriteria {
  requiredStableRegionIds: RegionId[];
  maximumStableRegionUnrest?: number;
  requiredControlledCoreRegionIds: RegionId[];
  requireCapitalControl: boolean;
  minimumStateCapacity: number;
  minimumTreasury: number;
  requiresNoActiveCivilWar: boolean;
  requiredConsecutiveTicks: number;
}
```

`DissolutionCriteria`는 국가 존속 임계값, 완전 병합, 영구 분열, 필요한 주권 기능 상실을 정의한다.

`RunState`에는 criterion 복사본이 없다. `consolidation`의 현재 진행과 typed `outcome`만 있다.

```ts
type RunOutcome =
  | { status: "active" }
  | { status: "won"; kind: "orderConsolidated"; ... }
  | { status: "defeated"; kind: "stateDissolved"; ... };
```

오직 실제 `stateDissolved`만 terminal defeat다.

## 5. Metric contract

| 필드 | 단위/범위 | 음수 | writer |
|---|---|---:|---|
| 국고 (`treasury`) | 유한한 절대 화폐 stock, 상한 없음 | 허용 | economy |
| 정통성 (`legitimacy`) | 0–100 지수 | 불가 | instability/명시적 제도 전환 |
| 국가역량 (`stateCapacity`) | 0–100 지수 | 불가 | institution/policy |
| 생산 (`production`) | 하루당 0 이상 절대 산출 | 불가 | economy |
| 군사력 (`militaryPower`) | 0–100 상대 전력 지수 | 불가 | conflict/defense |
| 불안 (`instability`) | 0–100 지수 | 불가 | instability |
| 국가 존속 (`stateContinuity`) | 0–100 지수, scenario threshold와 비교 | 불가 | conflict/territorial inputs |

Region normalized metrics, resource stock, ideology의 지지/급진/조직, faction 지표와 contact `baseStrength`의 정확한 범위는 `ARCHITECTURE.md` 4.4절을 따른다.

각 domain phase가 canonical commit 전에 clamp한다. `assertWorldStateInvariants`는 최종 검증이고 UI·AI·network가 clamp/writer가 될 수 없다. 값의 밸런스, 임계값, 효과량은 아직 정하지 않는다.

## 6. Action과 simulation transaction

모든 입력은 source와 무관하게 동일한 append-only envelope를 사용한다.

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

- `sequence`은 실행 전체에서 0부터 빈틈없이 증가하고 `tick`은 non-decreasing이다.
- 거부 입력도 기록한다. `ValidatedActionRecord`만 step input에 들어간다.
- command gateway만 순번을 부여한다. replay는 network arrival time을 다시 해석하지 않는다.
- UI, network, heuristic, LLM은 action proposal/record를 제출할 뿐 WorldState를 직접 mutate하지 않는다.

```text
staged validation
  -> SimulationStepInput(accepted actions)
  -> SimulationStepResult(nextWorld, emittedEvents)
  -> atomic SimulationStepCommit(RunRecord)
```

원자 커밋은 action log를 포함한 world와 event store를 함께 보이게 한다. persistence 구현은 T024다.

## 7. Event 순서와 인과

- `GameEvent.sequence`은 실행 전체에서 엄격히 증가한다.
- event ID는 `event:${tick}:${sequence}:${type}`이다.
- EventStore는 deterministic ID, sequence, non-decreasing tick, 중복 ID를 검증한다.
- `causeIds`는 이미 event buffer/store에 존재하는 event만 참조한다. 같은 step의 later phase는 earlier phase event를 참조할 수 있지만 미래 event를 참조할 수 없다.

## 8. Tick

- tick은 하루이며 달력은 12개월 × 30일(360일/년)이다.
- 초기 `tick = 0`, `year 1 / month 1 / day 1`; tick 1 완료 후 day 2다.
- renderer frame, UI speed, wall clock은 authoritative tick이 아니다.
- terminal run은 새 step을 열지 않는다. terminal 이후 입력은 거부 기록만 가능하며 tick/date/RNG/domain/event는 변하지 않는다.

## 8.1 T012 정책·제도

`ScenarioDefinition.policyCatalog`는 함수 없는 직렬화 가능한 `PolicyDefinition`을 소유한다. `WorldState.policies[countryId]`는 `activePolicyIds`, `enactedAtTick`, canonical `institutionalRules`만 가진다. 현재 rule vocabulary는 `rulerVeto`, `legislatureRequired`, `suffrage`, `productiveProperty`, `landOwnership`, `laborOrganization`, `pressFreedom`이다.

`ENACT_POLICY`는 기존 validated `ActionRecord`로 제출한다. payload는 `policyId`와 선택적 `countryId`이며, 후자가 없으면 `playerCountryId`를 사용한다. `resolveValidatedActions`에 scenario-bound policy hook을 주입해 policy 존재성, declarative prerequisite, incompatibility를 sequence 순서대로 검증한다. 실패는 `POLICY_REJECTED`, 성공은 `POLICY_ENACTED`, 실제 rule 값 변화만 `INSTITUTION_RULE_CHANGED`로 기록한다. 후자의 `causeIds`는 이미 배출된 `POLICY_ENACTED`만 참조한다.

정책은 rule state를 바꾸지만 T012에서 economy, ideology, faction, instability, diplomacy, conflict, AI writer가 아니다. `RegimeClassification`은 institutional rules에서 파생하며 CountryId, currentGovernmentId, RunOutcome를 자동 변경하지 않는다.

T010이 구현할 phase 순서:

```text
action intake/validation (staging)
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
  -> closeDay
  -> eventFinalization
  -> snapshotHook
  -> atomic commit
```

각 phase의 쓰기 권한은 `ARCHITECTURE.md` 5.2절 표를 따른다.

---

## T010–T025 구현 시 적용표

| 작업 | 이 계약에서 반드시 지킬 것 |
|---|---|
| T010 | 위 day tick, gameplay phase 순서, terminal gate, infrastructure hook, SimulationStep transaction만 구현한다. 경제/정치 규칙을 추가하지 않는다. |
| T011 | 국고·생산·자원·희소성의 절대/0 하한 contract를 사용한다. |
| T012 | policy catalog는 scenario, active PolicyState는 world에 둔다. regime을 저장하지 않고 파생한다. |
| T013 | support/radicalism/organization을 독립 0–1 값으로 유지한다. |
| T014–T015 | Scenario contact topology의 명시적 directed edge만 사용한다. 양방향은 두 edge로 표현하고, runtime 폐쇄/감쇠는 WorldState의 sparse overlay만 사용한다. 국가 전체의 임의 ideology bonus는 금지한다. |
| T016–T017 | faction/instability는 action writer와 metric writer 경계를 넘지 않는다. |
| T018 및 T021 | T017B의 `LandHex.controller`만 물리 영토 통제로 수정하고, Region/Country 영토 상태는 파생한다. Government transition은 CountryId를 유지한다. |
| T019–T020 | 외국 heuristic 입력도 `ActionRecord` source만 다를 뿐 같은 validator/sequence를 쓴다. |
| T022 | Scenario의 OrderConsolidationCriteria를 읽고 RunState에는 진행만 기록한다. |
| T023 | Scenario의 DissolutionCriteria를 읽고 `stateDissolved`만 defeat로 만든다. 정권 교체 회귀 테스트를 둔다. |
| T024 | scenario/simulation version, seed/RNG, single action log, ordered event log을 snapshot/replay에 넣는다. |
| T025 | 첫 playable ScenarioDefinition의 모든 initial foreign key, map node/edge, criteria, playerCountryId를 검증한다. |

T010–T014는 위 계약에 따라 구현되었으며, `docs/ARCHITECTURE.md`가 실제 hook 경계와 테스트된 세부사항을 설명한다. 다음 실제 작업은 **T015 Ideology diffusion**이다. 이 계약 문서 자체는 여전히 후속 게임플레이 효과를 구현하지 않는다.
