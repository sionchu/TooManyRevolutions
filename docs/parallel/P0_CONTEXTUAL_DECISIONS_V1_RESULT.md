# P0 Contextual Decisions v1 실행 결과

## 기준과 범위

- 작업 branch: `parallel-p0-contextual-decisions-v1`
- 실행 기준 base / authorized HEAD: `7ab69a9309c9e6a2f7c6a1c1068d65cf95042df2`
- 기준 remote: `origin/parallel-p0-contextual-decisions-v1`
- 권한 문서: `docs/parallel/tasks/P0_CONTEXTUAL_DECISIONS_V1.md`
- 대상: GameBuilders production decision content, F04C-R 근거 matrix, 순수 contextual decision read model
- 제외: `App.tsx`, `DecisionPanel`, Policy/Decision card, CSS, map, audio, icon, world-art 및 integration branch

## 변경 파일

### Production content / selector

- `src/sim/state/gameBuildersDecisionCatalog.ts`
- `src/sim/state/gameBuildersDecisionCatalog.test.ts`
- `src/sim/state/gameBuildersDemoScenario.ts`
- `src/sim/readModels/contextualDecisions.ts`
- `src/sim/readModels/contextualDecisions.test.ts`
- `src/sim/index.ts`

### Production ID로 전환한 비-UI 소비자와 테스트

- `src/app/chronicleDigest.test.ts`
- `src/app/demoGame.test.ts`
- `src/app/demoHorizonAudit.test.ts`
- `src/app/gameplayReality.test.ts`
- `src/app/institutionalRoadmap.test.ts`
- `src/app/stateProjects.test.ts`
- `src/app/stateProjects.ts`
- `src/app/worldVisualDelta.test.ts`
- `src/benchmark/frozenWorldSceneSnapshot.ts`

### 근거 산출물

- `docs/parallel/P0_CONTEXTUAL_DECISION_REFERENCE_MATRIX.md`
- `docs/parallel/P0_CONTEXTUAL_DECISIONS_V1_RESULT.md`

보호 파일 및 모듈은 `git diff --check`와 별도 protected-file 목록 비교에서 변경이 없음을 확인했다.

## Production Policy catalog

`GAMEBUILDERS_PRODUCTION_POLICY_CATALOG`는 `gamebuilders.policy.*` namespace를 사용하며 T012/F04D fixture catalog와 별도 객체다. 현재 authoritative `institutionalRules` writer가 표현할 수 있는 7개 축을 단계별로 구성했다.

- 권위·대표: `legislative-oversight`, `royal-veto-restoration`, `limited-suffrage-restoration`, `property-suffrage`, `broad-suffrage`, `universal-suffrage`
- 생산수단: `productive-property-mixed`, `public-productive-property`, `private-productive-property`
- 토지 rule: `private-land-ownership`, `communal-land-ownership`, `state-land-administration`
- 노동 조직: `labor-organization-opening`, `labor-organization-supervised-opening`, `labor-organization-restriction`, `labor-organization-ban`
- 언론: `press-freedom-opening`, `press-restriction-restoration`, `press-censorship-rollback`, `press-censorship`
- 정치 경쟁: `opposition-pluralism`, `opposition-restriction`, `opposition-restriction-restoration`, `opposition-ban`

총 24개 Policy는 `rulerVeto`, `legislatureRequired`, `suffrage`, `productiveProperty`, `landOwnership`, `laborOrganization`, `pressFreedom`, `politicalCompetition`의 실제 rule mutation만 사용한다. staged suffrage와 reversible rule path에는 실제 `ruleEquals`, `ruleNotEquals`, `policyActive` prerequisite를 부여했다. 선거·정당·의석·정부 교체나 토지/자산 ledger는 생성하지 않는다.

## Production Intervention catalog

`createGameBuildersProductionInterventionCatalog()`가 실제 GameBuilders Region/Faction ID를 받아 별도 catalog를 만든다. 총 8개이며 F04D validation definition을 이름만 바꿔 재사용하지 않는다.

- `gamebuilders.intervention.emergency-food-distribution`: 산업 Region food production capacity `+6`
- `gamebuilders.intervention.capital-granary-expansion`: 수도 Region food production capacity `+4`
- `gamebuilders.intervention.industrial-material-allocation`: 산업 Region material production capacity `+4`
- `gamebuilders.intervention.political-accommodation`: 노동 faction grievance `-0.25`, `legislatureRequired=true` prerequisite
- `gamebuilders.intervention.opposition-legalization`: `politicalCompetition=plural`, 노동 faction grievance `-0.10`
- `gamebuilders.intervention.labor-organization-opening`: `laborOrganization=legal`, 노동 faction grievance `-0.12`
- `gamebuilders.intervention.labor-organization-restriction`: `laborOrganization=restricted`, organization `-0.08`, grievance `+0.06`
- `gamebuilders.intervention.coercive-political-restriction`: `pressFreedom=censored`, `politicalCompetition=banned`, organization `-0.12`, grievance `+0.10`

비용·admin load·기간은 현재 Intervention feasibility/lifecycle 범위 안의 scenario-authored 값이며 역사 자료의 수치를 복사하지 않는다. 모든 개입은 기존 `InterventionDefinition`, `evaluateInterventionFeasibility`, `runInterventionResolutionPhase`, `runInterventionCompletionPhase` 경로를 사용한다.

## Explicit DEFER / NEW_DOMAIN catalog

다음 항목은 현재 production catalog와 selector에서 제외하고 matrix에 명시했다.

- `deferred.full-political-amnesty` — 전면 면책·피해자 절차·법적 상태 writer 없음
- `deferred.collective-bargaining-and-strike` — 고용주·교섭·임금계약·파업 lifecycle 없음
- `deferred.land-owner-and-asset-ledger` — 토지 소유자·농장·자산·임대료 ledger 없음
- `deferred.military-pay-and-loyalty` — 군 급여·지휘·주둔·충성도 authoritative domain 없음
- `deferred.martial-law-and-emergency-power` — 비상권한 기간·감독·종료 state/writer 없음
- `deferred.war-mobilization-and-settlement` — 동원·점령정부·전쟁목표·평화조건 domain 없음
- `deferred.coup-coordination-resolution` — coup coordination node와 결과 persistence writer 없음

따라서 coup-active state에는 군사 충성도, army support, coup 종료, 전쟁 정산 카드를 만들지 않는다. 물리적 점령·반란 회복도 기존 LandHex/T021 conflict-resolution 권한에 남긴다.

## Reference matrix

전체 row 단위 근거는 [`P0_CONTEXTUAL_DECISION_REFERENCE_MATRIX.md`](P0_CONTEXTUAL_DECISION_REFERENCE_MATRIX.md)에 기록했다. 각 row에는 stable ID, 한국어 이름, `R01`–`R22` 또는 F05 경계 참조, 좁은 mechanism, 조건/실패/반례, trade-off, 정확한 state, writer, consumer, contextual relevance, normal feasibility, `IMPLEMENT_NOW` 또는 `NEW_DOMAIN` 결정을 포함한다.

F04C-R의 역사 reference는 material relief, accommodation/amnesty 경계, opposition legalization, labor organization, coercive restriction의 좁은 mechanism으로만 승격했다. F04D/T012/T016 fixture ID는 validation source로 남기고 GameBuilders product identity로 사용하지 않았다.

## Selector API

구현 위치: `src/sim/readModels/contextualDecisions.ts`

```ts
deriveContextualDecisionSurface({
  scenario,
  world,
  playerCountryId,
  catalog: GAMEBUILDERS_PRODUCTION_CONTEXTUAL_CATALOG,
  agendas,
  recentEvents,
});
```

`agendas`와 `recentEvents`는 선택 입력이며, agendas를 생략하면 현재 `WorldState`와 bounded event evidence로 `derivePrimaryAgendas`를 사용한다. Selector는 다음 authoritative/read-model 입력을 읽는다.

- 현재 player Country와 PolicyState의 institutional rules
- Region scarcity, unrest, demand/capacity
- player country의 Faction grievance, organization, interest
- active Conflict의 kind, participants, affected Regions
- current agenda/pressure 및 전달된 recent GameEvent ID

반환 surface는 `primaryShortlist`, `relevantCandidates`, policy/intervention 분리 목록, `roadmapPolicyIds`, agenda, faction observations, active conflict IDs를 제공한다. 각 candidate는 stable ID, kind, typed `relevanceReasons`와 evidence, affected Region/Faction IDs, source Event IDs, feasibility/availability를 함께 가진다. `AVAILABLE`과 `BLOCKED_BUT_RELEVANT`를 분리하며, irrelevance와 feasibility를 하나의 enabled flag로 합치지 않는다.

정렬은 active crisis → current pressure/agenda → institutional reform → background structural option 순이다. 같은 tier 안에서는 authored priority와 stable ID만 사용한다. weighted utility, RNG, hidden timer, WorldState write, event emission, scheduling은 없다. primary shortlist는 테스트된 모든 상태에서 5개 이하로 제한했다.

## Canonical state → primary shortlist

아래는 `contextualDecisions.test.ts`가 stable ID, tier, typed reason, availability까지 고정한 결과다. `B`는 관련성은 있으나 현재 일반 feasibility가 막힌 `BLOCKED_BUT_RELEVANT`다.

| 상태 | primary shortlist (순서 고정) |
| --- | --- |
| Day 0/default | `gamebuilders.intervention.emergency-food-distribution`, `gamebuilders.intervention.political-accommodation`, `gamebuilders.intervention.opposition-legalization`, `gamebuilders.intervention.labor-organization-opening`, `gamebuilders.policy.legislative-oversight` |
| High material scarcity | `gamebuilders.intervention.emergency-food-distribution`, `gamebuilders.intervention.labor-organization-opening`, `gamebuilders.policy.labor-organization-opening`, `gamebuilders.policy.productive-property-mixed`, `gamebuilders.intervention.labor-organization-restriction` (B) |
| High labor grievance/organization | `gamebuilders.policy.labor-organization-supervised-opening` (B), `gamebuilders.intervention.political-accommodation`, `gamebuilders.intervention.opposition-legalization`, `gamebuilders.intervention.labor-organization-opening` (B), `gamebuilders.policy.legislative-oversight` |
| Active rebellion/recovery | `gamebuilders.intervention.emergency-food-distribution`, `gamebuilders.intervention.industrial-material-allocation`, `gamebuilders.intervention.political-accommodation`, `gamebuilders.intervention.opposition-legalization`, `gamebuilders.intervention.labor-organization-opening` — 모두 crisis tier |
| Opening reforms already active | `gamebuilders.policy.public-productive-property`, `gamebuilders.policy.communal-land-ownership`, `gamebuilders.policy.labor-organization-restriction`, `gamebuilders.policy.opposition-restriction`, `gamebuilders.policy.press-restriction-restoration` |
| Coercive/restricted rules | `gamebuilders.policy.labor-organization-supervised-opening`, `gamebuilders.policy.press-censorship-rollback`, `gamebuilders.policy.opposition-restriction-restoration`, `gamebuilders.intervention.political-accommodation`, `gamebuilders.intervention.opposition-legalization` |
| Active coup, no military domain | `gamebuilders.intervention.emergency-food-distribution`, `gamebuilders.intervention.political-accommodation`, `gamebuilders.intervention.opposition-legalization`, `gamebuilders.intervention.labor-organization-opening`, `gamebuilders.policy.legislative-oversight` — military/coup/war response 없음 |

실제 WorldState의 Region pressure, Faction 상태, institutional rule, active Conflict를 바꿀 때 목록의 ID·tier·reason이 달라진다. 예를 들어 high scarcity 상태는 실제 부족 resource를 대상으로 하는 food response와 material/property/labor 경로를 올리고, opening 상태는 pressure tier를 제거해 background rule path만 남긴다. resource target별 demand/capacity 판정으로 food 부족이 material allocation을 자동 생성하지도 않는다. 따라서 같은 카드 집합의 enabled/disabled 변형이 아니라 relevance filtering과 authored tier의 결과다.

## F04D/T012 leakage evidence

- GameBuilders production policy ID는 전부 `gamebuilders.policy.*`이며 production intervention ID는 전부 `gamebuilders.intervention.*`이다.
- `gameBuildersDecisionCatalog.test.ts`는 production policy 24개와 intervention 8개의 namespace, current rule-axis coverage, 실제 Region/Faction target, fixture ID 비포함을 검사한다.
- 같은 테스트는 F04D validation scenario가 기존 fixture catalog를 계속 사용하는지, GameBuilders scenario가 production catalog를 사용하는지를 별도로 검사한다.
- F04D inspection/test와 T016 validation fixture 파일은 production catalog로 변경하지 않았다.

## Verification

| 명령 | 실제 결과 |
| --- | --- |
| `pnpm install --frozen-lockfile` | exit 0 |
| production catalog + selector targeted tests | 5 files, 22 tests passed, exit 0 |
| `pnpm run inspect:f04d` | 1 test passed, exit 0; 기존 F04D validation output 유지 |
| `pnpm run inspect:t018` | 1 test passed, exit 0 |
| `pnpm run inspect:t021` | 1 test passed, exit 0 |
| `pnpm run inspect:t024` | 1 test passed, exit 0 |
| `pnpm run inspect:v01` | 1 test passed, exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0 |
| `pnpm format` | all files matched, exit 0 |
| `pnpm build` | `tsc`, Vite production build, Sites worker build 모두 exit 0; Vite chunk-size warning 1건 |
| `git diff --check` | exit 0 |
| protected-file comparison | PASS; 보호 hotspot 변경 없음 |

전체 `pnpm test`도 실행했다. 86개 test file의 625개 assertion은 모두 통과했지만 Vitest worker의 `onTaskUpdate` unhandled timeout 4건으로 process exit는 1이었다. assertion failure와 runner error를 분리하면 다음과 같다.

- assertion: 625 passed / failed 0
- runner: `Error: [vitest-worker]: Timeout calling "onTaskUpdate"` 4건
- process: exit 1

## Integration handoff

`parallel-p0-integration-v1` owner가 UI hookup 시 다음 두 지점을 교체한다. 이 branch에서는 해당 hotspot을 수정하지 않았다.

1. `src/app/App.tsx`의 `POLICY_FIXTURE_IDS` import, `policySurfaceIds` 배열, `policyCandidates = policySurfaceIds.flatMap(...)` 블록을 제거한다.
2. `const decisionSurface = useMemo(...)`를 추가하고 `deriveContextualDecisionSurface`에 `GAMEBUILDERS_DEMO_SCENARIO`, `record.world`, `PLAYER_ID`, `GAMEBUILDERS_PRODUCTION_CONTEXTUAL_CATALOG`, 현재 `agendas`, `record.eventStore.events`를 전달한다.
3. 기존 `DecisionPanel` props의 `candidates`에는 `decisionSurface.primaryInterventionCandidates`를 `{ definition, feasibility }` shape으로 전달한다.
4. 기존 `policyCandidates`에는 `decisionSurface.primaryPolicyCandidates`를 `{ definition, availability }` shape으로 전달한다. `BLOCKED_BUT_RELEVANT`도 feasibility/availability의 실제 실패 이유와 함께 표시할 수 있다.
5. `decisionSurface.primaryShortlist`의 순서를 보존한다. `Object.values(interventionCatalog)` 전체를 정렬해 전달하거나 고정 ID 목록을 다시 만들지 않는다.
6. `roadmap`은 기존 `deriveInstitutionalRoadmap(policyState, GAMEBUILDERS_DEMO_SCENARIO.policyCatalog)`를 유지해 full structural policy path를 별도로 제공한다. primary shortlist와 roadmap을 합치지 않는다.

이 교체로 현재의 hardcoded `policySurfaceIds`와 full `interventionCatalog` enumeration이 실제 contextual selector output으로 대체된다. 제출 함수와 simulation writer는 기존 pipeline을 그대로 사용한다.

## Known limitations

- UI integration, visual rendering, audio, map, icon은 이 작업 범위가 아니며 실행하지 않았다.
- selector는 decision read model이다. 후보 선택 자체가 WorldState mutation이나 event를 만들지 않는다.
- material intervention은 현재 writer가 제공하는 Region production capacity delta까지만 표현한다. 재고·가격·물류·보험기금은 추가하지 않았다.
- land rule은 institutional rule만 바꾸며 소유자·농장·자산 재분배를 뜻하지 않는다.
- labor organization은 legal/restricted/illegal rule과 bounded faction delta까지만 사용하며 bargaining/strike lifecycle은 NEW_DOMAIN이다.
- coup/war/military resolution은 authoritative domain 부재로 production surface에 없다.
- 전체 suite의 4개 `onTaskUpdate` runner error는 현재 저장소의 장시간 Vitest 실행에서 관측된 process-level 문제이며, 해당 실행에서는 assertion failure가 없었다.
