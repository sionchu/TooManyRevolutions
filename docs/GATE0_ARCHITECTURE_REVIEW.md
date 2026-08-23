# Gate 0 아키텍처 검토

**검토일:** 2026-08-21  
**역할:** Lead Game Simulation Architect  
**범위:** Gate 0 / T001–T005의 실제 코드와 현재 설계 문서. Gate 1 기능이나 코드 리팩터링은 수행하지 않았다.

## 검토 기준과 결론

검토한 문서:

- `AGENTS.md`
- `docs/GDD.md`
- `docs/ARCHITECTURE.md`
- `docs/BACKLOG.md`
- `docs/DECISIONS.md`
- `docs/CODEX_DEVLOG.md`

검토한 구현 범위는 `src/sim/`, Gate 0 테스트, 그리고 시뮬레이션을 읽는 최소 React 부트스트랩이다.

`docs/CODEX_DEVLOG.md`에 기록된 Gate 0 검증은 13개 Vitest 테스트, typecheck, lint, format, production build, Vite HTTP 200을 모두 통과했다. 이번 작업은 문서 검토만 수행하므로 이를 다시 실행하지 않았다.

### 총평

Gate 0는 통과 가능한 기반이다. `src/sim/`이 React와 렌더러에 의존하지 않고, seeded RNG·불변형 tick 결과·직렬화 가능한 이벤트·`causeIds`를 이미 갖췄다. 현재 시점의 **BLOCKER는 없다.**

다만 Gate 1 코드를 시작하기 전에 아래의 여덟 가지 계약을 확정해야 한다. 특히 국가와 정부의 분리, 영토 통제의 단일 진실, 정적 시나리오 데이터의 소유자, 입력/이벤트/스냅샷의 원자적 기록 규약은 늦게 바꾸면 경제·정책·반란·승패·리플레이를 함께 재작성하게 된다.

| 분류 | 수 | 의미 |
|---|---:|---|
| BLOCKER | 0 | Gate 0 구현 자체를 중단시킬 위반은 없음 |
| CHANGE_BEFORE_GATE1 | 8 | Gate 1 시스템이 이 가정을 사용하기 전에 확정할 계약 |
| SAFE_TO_DEFER | 6 | 해당 백로그 작업에서 구현해도 안전한 항목 |
| GOOD_AS_IS | 5 | 현재 Gate 0 범위에서 적절한 기반 |

## 요청 항목 대응표

| 요청 항목 | 관련 finding |
|---|---|
| 1. simulation authority boundaries | G0-01, G0-02 |
| 2. 핵심 상태 구조 | G0-03, G0-04, G0-05, G0-06 |
| 3. seeded deterministic RNG | G0-07 |
| 4. tick/clock | G0-08, G0-09 |
| 5. event model / causeIds | G0-10, G0-11 |
| 6. serialization / replay | G0-11, G0-12 |
| 7. regime change continuity | G0-05 |
| 8. 승리 = 새로운 질서 정착 | G0-13 |
| 9. 패배 = 국가 소멸 | G0-05, G0-13 |
| 10. 지지 / 급진 / 조직 분리 | G0-14 |
| 11. 명시적 contact edge 확산 | G0-15 |
| 12. faction/foreign AI 제안 구조 | G0-16 |
| 13. 되돌리기 비싼 위험 | G0-02~G0-06, G0-08, G0-11, G0-13 |

---

## BLOCKER

### 없음

Gate 0 요구사항의 범위에서는 설계 위반이나 검증 불능 상태가 없다. 아래 `CHANGE_BEFORE_GATE1`은 Gate 1 구현을 시작하기 전 설계 계약을 확정해야 한다는 뜻이며, 지금 코드를 되돌리거나 Gate 0를 재구축하라는 뜻은 아니다.

---

## CHANGE_BEFORE_GATE1

### G0-02 — 단일 시뮬레이션 트랜잭션 계약이 아직 없다

**분류:** CHANGE_BEFORE_GATE1  
**관찰:** `advanceTick(world)`은 새 `WorldState`와 이벤트 배열을 반환한다. 그러나 플레이어 입력, 검증된 AI 입력, 이벤트 저장소, 액션 로그, 스냅샷을 누가 한 번에 커밋하는지는 정의되어 있지 않다. 현재 `EventStore`는 별도 객체이고 `RunState`의 두 로그도 별도로 존재한다.

**중요한 이유:** Gate 1부터 정책·경제·세력 행동이 생기면 “UI가 상태를 직접 바꾸는가”, “resolver가 먼저 이벤트를 남기는가”, “실패한 입력도 기록하는가”가 갈리기 쉽다. 이것은 결정론, WHY? 인과 그래프, 리플레이, AI 권한 경계를 동시에 깨뜨릴 수 있다.

**되돌리기 비용:** 높음. 여러 시스템과 UI가 서로 다른 진입점을 사용하기 시작하면 통합할 때 과거 저장 데이터와 테스트도 바뀐다.

**가장 작은 시정 변경:** T010 전에 코드가 아닌 계약을 먼저 확정한다.

```ts
type SimulationStepInput = {
  actions: readonly ValidatedActionRecord[];
};

type SimulationStepResult = {
  nextWorld: WorldState;
  events: readonly GameEvent[];
};
```

상위 `RunRecord` 또는 동등한 저장 경계는 `nextWorld`, 입력 기록, 이벤트 기록, 필요 시 스냅샷을 원자적으로 커밋한다. UI·LLM·네트워크는 이 경계 밖에서 직접 `WorldState`를 수정하지 않는다. 실제 타입/코드 작성은 이 검토 범위 밖이다.

### G0-03 — 정적 시나리오 데이터와 동적 `WorldState`의 소유자가 비어 있다

**분류:** CHANGE_BEFORE_GATE1  
**관찰:** `WorldState`에는 동적 국가·지역·세력·정책 상태가 있지만, `Ideology` 정의, `Policy` 정의, 초기 지도, 접촉 토폴로지, 승패 기준을 소유할 `ScenarioDefinition`이 아직 없다. `RunState`에는 `scenarioId`와 `scenarioVersion`만 있다.

**중요한 이유:** GDD의 이념 목록, 정책 규칙, 지도 연결, 새로운 질서의 정착 조건은 매 tick 변하는 상태가 아니라 시나리오/콘텐츠 데이터다. 이 경계가 없으면 replay가 같은 `scenarioId`를 가리켜도 같은 규칙을 재생하지 못하고, 정적 정의가 `WorldState` 곳곳에 중복된다.

**되돌리기 비용:** 높음. 정책 엔진(T012), contact graph(T014), 승리/패배(T022–T023), headless scenario(T025)가 모두 이 데이터를 참조한다.

**가장 작은 시정 변경:** Gate 1 시작 전에 다음의 소유권만 설계 문서 또는 타입 설계안으로 고정한다.

- `ScenarioDefinition`: `id`, `version`, 초기 국가/지역/세력, 이념/정책 카탈로그, 지도·접촉 토폴로지, 승리/패배 규칙
- `WorldState`: 그 시나리오에서 변화한 값만 보유
- `RunState`: scenario/rules version, seed, 입력 순서, 현재 결과만 보유

`createInitialWorldState`는 장차 `ScenarioDefinition`과 seed에서 동적 상태를 만든다는 방향만 합의하면 충분하다.

### G0-04 — 영토 통제의 단일 진실과 참조 무결성이 확정되지 않았다

**분류:** CHANGE_BEFORE_GATE1  
**관찰:** `Country.controlledRegions`와 `Region.controllerCountryId`/`controllerFactionId`가 같은 사실을 중복 표현한다. 또한 지역은 국가와 세력을 동시에 controller로 가질 수도, 둘 다 갖지 않을 수도 있다. 현재 invariant는 이 배타성·소유권·존재 여부를 검증하지 않는다.

**중요한 이유:** 지도, 내전, 수도 통제, 병합, 새로운 정부 수립, 승리 조건은 모두 “누가 어느 지역을 실제로 통제하는가”에 의존한다. 중복 데이터가 드리프트하면 WHY?와 리플레이가 서로 다른 역사를 보여 준다.

**되돌리기 비용:** 높음. T018, T021, T022, T023, Gate 2 지도 모두의 핵심 키가 된다.

**가장 작은 시정 변경:** 구현 전에 다음을 결정한다.

- 권위 있는 통제 정보는 `Region` 한 곳에만 둔다.
- controller는 두 nullable 필드가 아니라 배타적 discriminated union으로 표현한다. 예: country controller, faction controller, 또는 명시적 무통제 상태.
- `Country.controlledRegions`는 저장하지 않고 selector로 계산하거나, 저장해야 한다면 오직 `Region`에서 갱신되는 파생 캐시로 정의한다.
- 수도는 `capitalRegionId`와 지역 controller에서 판정한다.
- Invariant 목록에는 모든 foreign key, controller 배타성, owner/controller 관계, 중복 지역 ID를 넣는다.

### G0-05 — 국가 존속, 정부 교체, 체제 분류, 내전 결과를 분리해야 한다

**분류:** CHANGE_BEFORE_GATE1  
**관찰:** `Country`는 직접 저장되는 `regime`을 갖고, `Conflict`는 `winnerCountryId`만 갖는다. GDD는 국가 연속성과 정부/정권을 분리하며, 세력이나 새 정부가 내전에서 이겨도 국가가 존속할 수 있다고 명시한다. 현재 `ConflictStatus`의 `terminal`도 “갈등 종료”인지 “국가 소멸”인지 모호하다.

**중요한 이유:** `CountryId`가 국가 연속성을 뜻하지 않거나, 체제가 정책에서 파생되지 않으면 왕정 붕괴·혁명·쿠데타를 패배로 오인하게 된다. 이는 ADR-002, ADR-003, ADR-004와 직접 충돌할 위험이다.

**되돌리기 비용:** 매우 높음. 승패, 저장 데이터, 맵 소유권, 이벤트 연쇄, 최종 역사 화면의 의미가 모두 바뀐다.

**가장 작은 시정 변경:** Gate 1 전에 아래를 하나의 도메인 계약으로 고정한다.

- `CountryId`는 국가의 역사적 연속성으로서 안정적이다.
- 현재 정부/중앙 권력과 제도 묶음은 국가 연속성과 별도 상태다.
- `regime`은 권위 있는 직접 입력이 아니라 활성 제도 조합에서 계산되는 역사적 분류다. 초기 시나리오의 표기는 설명용으로만 둔다.
- 갈등 결과는 승자 국가만이 아니라 세력 승리·정부 교체·영토 이전·국가 존속/소멸을 명시적으로 표현한다.
- `STATE_DISSOLVED`만 `RunState.status = "defeated"`의 근거가 될 수 있다. 정권 교체 이벤트는 그렇지 않다.

### G0-06 — 국가/지역/세력 지표의 단위와 허용 범위가 불완전하다

**분류:** CHANGE_BEFORE_GATE1  
**관찰:** invariant는 `IdeologyState`와 일부 지역 지표를 0–1로 검증하지만, `Country`의 정통성·국가역량·불안·군사력·생산, `Faction`의 조직·영향력·불만, 자원 stock에는 명시적인 단위/범위가 없다. 국고는 음수가 가능한지, `stateContinuity`가 0–1인지 0–100인지도 정의되지 않았다.

**중요한 이유:** 경제(T011), 불안(T017), 승패(T022–T023), UI 표현이 서로 다른 스케일을 가정하면 임계값과 정책 효과가 임의적이 된다. GDD의 “정책은 보너스가 아니라 규칙” 원칙도 정량 의미가 고정되어야 지킬 수 있다.

**되돌리기 비용:** 중간~높음. 첫 밸런스 데이터와 테스트가 만들어진 뒤에는 모든 시나리오 수치를 다시 조정해야 한다.

**가장 작은 시정 변경:** T011 전에 metric contract 표를 만든다.

- 각 지표의 단위, 최소/최대, 음수 허용 여부, 정규화 여부
- 수정 권한이 있는 시스템
- clamp/validation 위치
- UI 한국어 고정명: 국고, 정통성, 국가역량, 생산, 군사력, 불안, 국가 존속

이 표는 수치를 밸런싱하지 않는다. 오직 같은 숫자가 어디에서나 같은 뜻을 갖게 한다.

### G0-08 — T010의 tick 단위와 시스템 순서가 아직 확정되지 않았다

**분류:** CHANGE_BEFORE_GATE1  
**관찰:** `advanceTick`은 날짜를 하루 전진시키고 `TICK_ADVANCED`만 낸다. `SimDate`는 12개월 × 30일 달력이며, `docs/ARCHITECTURE.md`의 권장 pipeline은 아직 코드/문서 계약으로 채택되지 않았다.

**중요한 이유:** 하루 tick인지 주 단위 tick인지에 따라 식량 소비, 정책 지연, 세력 적응, 18개월 정착 기간, 이벤트 빈도가 모두 달라진다. 시스템 순서는 같은 입력에서 같은 결과를 내는 결정론의 일부다.

**되돌리기 비용:** 높음. 시스템이 한 번 순서를 가정하면 밸런스, 이벤트 cause chain, replay 결과가 함께 달라진다.

**가장 작은 시정 변경:** T010에서 구현보다 먼저 다음을 승인한다.

1. tick의 실제 시간 단위와 360일 달력 사용 여부
2. `applyScheduledEffects → economy → resources → ideologyDiffusion → factionPressure → instability → diplomacy → conflict → victoryDefeat → emitEvents → maybeSnapshot`의 확정 순서
3. 각 phase가 직접 수정할 수 있는 상태와 반드시 남겨야 하는 cause/event 관계
4. terminal run에서 tick을 거부할지, 명시적 no-op으로 기록할지

### G0-11 — 이벤트 ID와 입력 로그가 replay에 필요한 전역 순서를 보장하지 않는다

**분류:** CHANGE_BEFORE_GATE1  
**관찰:** `GameEvent`와 `EventStore`는 JSON 직렬화와 기존 `causeIds` 참조를 보장한다. 반면 event ID 정책은 호출자에게 열려 있고 현재 tick event는 `tick:${tick}` 형식이다. `RunActionRecord.type`은 자유 문자열이고 source, 전역 sequence, schema/rules version, 검증 결과가 없다. player/AI log가 분리되어 있어 같은 tick에서의 전체 적용 순서가 드러나지 않는다.

**중요한 이유:** replay는 “같은 seed + 같은 입력 순서”를 요구한다. 행동과 이벤트의 순서가 정의되지 않으면 AI 응답을 기록해도 재생 결과가 달라질 수 있고, causal graph에 ID 충돌 또는 누락이 생긴다.

**되돌리기 비용:** 높음. 저장 포맷은 사용자가 만든 실행 기록과 직접 연결되므로 나중에 마이그레이션이 필요해진다.

**가장 작은 시정 변경:** 첫 정책 행동을 추가하기 전에 하나의 append-only `ActionRecord` envelope를 설계한다.

- `id`, `tick`, `sequence`, `source` (`player` / `heuristic` / `llm`), `actionType`, `payload`, `schemaVersion`, `validationOutcome`
- event ID는 tick 내 emission ordinal을 포함한 결정론적 규칙을 사용한다.
- 검증된 AI 행동은 player 행동과 같은 전역 순서 로그에 기록하고 source로만 구분한다.
- `causeIds`는 계속 기존 이벤트만 가리키도록 유지한다.

### G0-13 — 승리와 패배의 판단 기준은 `RunState`가 아니라 시나리오 규칙으로 소유해야 한다

**분류:** CHANGE_BEFORE_GATE1  
**관찰:** `RunState`에는 `status`와 `consolidationTicks`가 있지만, 새로운 질서의 정착 조건이나 국가 소멸 조건을 표현하는 타입/설정이 없다. 현재 `ConflictStatus = "terminal"`은 run terminal과 혼동될 수 있다.

**중요한 이유:** GDD의 승리는 이념 100%가 아니라 안정 지역·수도 통제·국가역량·지불능력·내전 상태를 일정 기간 유지하는 것이다. 패배는 정권 교체가 아니라 국가 소멸이다. 이 조건을 국가나 갈등의 임의 bool로 흩어 두면 ADR-003/004가 손상된다.

**되돌리기 비용:** 높음. HUD, event log, end-of-run history, replay, 테스트의 terminal 의미가 모두 의존한다.

**가장 작은 시정 변경:** G0-03의 `ScenarioDefinition` 안에 다음 두 순수 데이터 계약을 넣기로 결정한다.

- `OrderConsolidationCriteria`: 필요 안정 지역 수, 수도/핵심 지역 통제, 최소 국가역량, 지급불능 한계, terminal civil war 조건, 유지 tick 수
- `DissolutionCriteria`: 완전 병합, 회복 불가능한 영구 분열, 주권 기능 상실, `stateContinuity` 임계값

`RunState`는 판정 결과와 누적 진행만 보유한다. 실제 victory/defeat system은 T022/T023에서 구현한다.

---

## SAFE_TO_DEFER

### G0-09 — 시간 배속의 실제 scheduler는 Gate 2까지 미뤄도 된다

**분류:** SAFE_TO_DEFER  
**관찰:** `CLOCK_SPEEDS`는 `0/1/3/8`을 표현하지만 `advanceIfRunning`은 실행 여부만 보고 한 tick을 진행한다.

**중요한 이유:** 현재 코드가 3x와 8x를 실제 tick 수로 오해하게 만들면 UI frame과 simulation tick이 다시 결합될 수 있다.

**되돌리기 비용:** 중간.

**가장 작은 시정 변경:** T041에서 renderer와 분리된 scheduler를 만든다. scheduler가 wall-clock budget에 따라 `advanceTick`을 여러 번 호출할 뿐, `advanceTick` 자체는 speed를 알지 않는다. Gate 1 headless simulation에는 speed UI가 없어도 된다.

### G0-12 — 실제 snapshot 저장/복원과 마이그레이션은 T024에서 구현한다

**분류:** SAFE_TO_DEFER  
**관찰:** `JsonValue`, primitive ID, `SeedState`, `WorldState`의 plain data shape은 직렬화 친화적이다. 다만 snapshot envelope, 런타임 decode/validation, schema migration은 없다.

**중요한 이유:** JSON 문자열화만으로는 손상되거나 오래된 save를 안전하게 읽을 수 없다.

**되돌리기 비용:** 중간. G0-03과 G0-11의 version/로그 계약을 먼저 고정하면 낮아진다.

**가장 작은 시정 변경:** T024에서 `SnapshotEnvelope { formatVersion, scenarioId, scenarioVersion, simulationVersion, world, actionLog, eventLog }`와 runtime validation/migration을 도입한다. Gate 0에는 저장 I/O를 넣지 않는다.

### G0-15 — 이념 확산용 contact graph의 구현은 T014에 둔다

**분류:** SAFE_TO_DEFER  
**관찰:** 현재 `Region`에는 직접적인 이웃/무역/이주 링크가 없다. 이는 Gate 0 누락이 아니라 T014의 명시적 범위다.

**중요한 이유:** GDD는 무역, 국경, 이주, 난민, 언론, 종교·길드 네트워크처럼 실제 경로를 요구한다. 국가 전체에 임의의 `+10 ideology`를 적용하면 이 원칙을 위반한다.

**되돌리기 비용:** 중간. 지역 속성에 임시 링크를 흩뿌리면 높아진다.

**가장 작은 시정 변경:** T014에서 별도 `ContactEdge` graph를 사용한다. edge는 최소한 `fromRegionId`, `toRegionId`, `channel`, `strength`, `enabled/blocked reason`을 갖고, 정책·전쟁·국경 폐쇄는 edge의 활성도만 바꾼다. 국가 이념은 지역 이념의 파생 집계로 유지한다.

### G0-16 — faction/foreign AI 제안 계층은 Gate 3까지 미룬다

**분류:** SAFE_TO_DEFER  
**관찰:** `FactionStrategy`는 `protest`, `strike`, `bargain`, `hoard`, `supportCoup` 등 제한된 행위 어휘를 갖지만 AI 호출, 서버, schema validation은 아직 없다. `src/sim/`에는 React/모델 SDK/비밀키 참조가 없다.

**중요한 이유:** LLM이 수치를 수정하지 않고 행동만 제안해야 한다는 simulation authority를 지키려면 제안과 결정론적 해소를 분리해야 한다.

**되돌리기 비용:** 낮음~중간. T016의 heuristic action과 같은 action vocabulary를 재사용하면 낮다.

**가장 작은 시정 변경:** T016/T050에서 `FactionActionProposal`과 `ForeignActionProposal`을 discriminated union으로 정의한다. 서버는 제안만 반환하고, sim의 validator/resolver가 비용·합법성·도달성·전제조건·cooldown을 검사해 기록된 입력으로 바꾼다. timeout/실패 시에는 동일 schema의 heuristic proposal을 사용한다.

### G0-17 — Gate 1 테스트 확장은 각 시스템과 함께 추가한다

**분류:** SAFE_TO_DEFER  
**관찰:** 현재 테스트는 RNG, 시계, tick skeleton, 기본 invariant, event serialization/causality를 적절히 다룬다. 정책 충돌, 영역 controller, 정권 교체 지속, victory/defeat, replay는 아직 테스트되지 않는다.

**중요한 이유:** 이 항목들은 아직 구현되지 않았으므로 Gate 0 테스트에 억지로 넣으면 가짜 계약이 된다.

**되돌리기 비용:** 낮음. 단, 해당 시스템과 같은 PR/작업에 추가해야 한다.

**가장 작은 시정 변경:** T012, T015, T018, T022, T023, T024 각각에 대응하는 invariant/system test를 함께 추가한다. 특히 “정권 교체는 패배가 아님”과 “국가 소멸은 한 번만 terminal event를 낸다”는 회귀 테스트를 T023의 필수 acceptance로 둔다.

### G0-18 — Gate 0 부트스트랩의 영어 UI는 실제 플레이 UX 전에 교체한다

**분류:** SAFE_TO_DEFER  
**관찰:** `src/app/App.tsx`는 Gate 0 상태 화면으로 영어 문구를 사용한다. 새 GDD와 `AGENTS.md`는 플레이어-facing UI를 한국어 우선으로 요구한다.

**중요한 이유:** 이는 simulation authority 문제가 아니며 현재 화면은 최종 UX가 아니다. 다만 Gate 2에서 이 언어가 그대로 확장되면 용어 일관성이 흔들린다.

**되돌리기 비용:** 낮음.

**가장 작은 시정 변경:** Gate 2 UI 작업 시작 시 GDD의 고정명(국고, 정통성, 국가역량, 생산, 군사력, 불안, 국가 존속)과 한국어 플레이어 문장을 기준으로 copy dictionary를 만든다. Gate 0 코드는 변경하지 않는다.

---

## GOOD_AS_IS

### G0-01 — 시뮬레이션 권위 경계의 출발점은 적절하다

**분류:** GOOD_AS_IS  
`src/sim/`은 React, renderer, 네트워크, AI SDK를 import하지 않는다. React 부트스트랩은 `createInitialWorldState`를 읽을 뿐이며, 권위 있는 계산은 sim 내부에 남아 있다. Gate 1에서도 이 방향을 유지한다.

### G0-07 — seeded RNG는 순수하고 직렬화 가능하다

**분류:** GOOD_AS_IS  
`createSeedState`, `nextRandom`, `nextInt`는 새 상태를 반환하고 `Math.random()`에 의존하지 않는다. 같은 seed가 같은 순서를 내고 `SeedState`는 JSON round-trip 테스트를 통과한다. seed 입력의 실제 도메인은 uint32로 문서화하면 충분하며, RNG 교체는 현재 필요하지 않다.

### G0-10 — 이벤트와 `causeIds`의 최소 causal graph는 올바른 기반이다

**분류:** GOOD_AS_IS  
`GameEvent`는 JSON-safe payload, actor/target, visibility, `causeIds`를 갖는다. `EventStore.appendEvent`는 중복 ID와 아직 존재하지 않는 원인을 거부하므로 나중에 prose로 원인을 발명하지 않는 WHY?의 핵심을 이미 만족한다.

### G0-14 — 지지·급진·조직은 분리되어 있다

**분류:** GOOD_AS_IS  
`IdeologyState`가 `support`, `radicalism`, `organization`을 독립 필드로 보유하고 invariant가 각각 0–1을 강제한다. 이는 “지지는 높지만 조직은 약한 여론”과 “작지만 급진적이고 조직된 운동”을 구분할 수 있는 올바른 출발점이다. 국가 수준 수치는 지역 수준 값을 파생 집계하는 방향을 유지한다.

### G0-19 — 모듈 분리와 ID branding은 Gate 0에 알맞다

**분류:** GOOD_AS_IS  
core/state/events가 작은 파일로 나뉘고 `CountryId`, `RegionId`, `FactionId`, `EventId` 등이 구분되어 있다. 이는 renderer-independent domain logic과 잘 맞으며, 아직 거대한 store나 class-heavy model을 만들지 않은 점도 적절하다.

---

## Gate 1 진입 전 승인 순서

코드를 바꾸지 않고 다음 순서로 설계 결정을 승인하는 것이 가장 안전하다.

1. G0-03: `ScenarioDefinition`과 동적 `WorldState`의 경계
2. G0-04: 지역 controller와 국가 영토 집계의 단일 진실
3. G0-05: 국가 연속성 / 정부 교체 / 체제 분류 / 갈등 결과
4. G0-13: 새로운 질서의 정착과 국가 소멸의 시나리오 규칙
5. G0-06: metric contract
6. G0-02와 G0-11: 입력·이벤트·기록의 단일 트랜잭션과 순서 규칙
7. G0-08: T010 tick 단위와 확정 pipeline

이 승인 뒤의 가장 작은 실제 개발 작업은 백로그 그대로 **T010 Tick pipeline**이다. T010은 위 계약을 구현하기 시작하는 첫 작업일 뿐, 경제·정책·이념 확산·AI·갈등을 선행 구현하지 않는다.
