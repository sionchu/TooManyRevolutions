# TMR Handoff Master — F04C-R Complete

**Date:** 2026-08-24  
**Project:** 《내 왕국에 혁명이 너무 많다》  
**Codename:** TooManyRevolutions / TMR

이 문서는 이전 ChatGPT 대화가 없어도 현재 프로젝트의 경계와 다음 작업을 복원할 수 있는 canonical handoff다. Repository의 최신 source와 최신 task 문서가 이 문서보다 우선한다.

## 1. Product identity

TMR은 browser-native systemic fantasy political simulation이다. 플레이어는 특정 왕이나 정부가 아니라 한 국가의 역사적 연속성인 CountryId를 플레이한다.

- 목표: 혁명 시대를 살아남고 작동하는 새로운 질서를 수립한다.
- 승리: Order Consolidation.
- terminal defeat: State Dissolution.
- 혁명, 쿠데타, 정권교체, 왕조 붕괴, 정부 상실, 임시 점령은 자동 Game Over가 아니다.
- 플레이어 선택은 state를 바꾸며 story node를 예약하지 않는다.
- 사건은 현재 조건에서 감지되며, 고정 chapter/혁명 countdown으로 예약되지 않는다.

## 2. Current checkpoint

| Area                                           | Status               |
| ---------------------------------------------- | -------------------- |
| Gate 1 authoritative foundation                | CLOSED / PASS        |
| T017–T024                                      | FINAL PASS           |
| V00 Visual Contract                            | PASS                 |
| V01 Presentation State                         | PASS                 |
| F01/F01A/F01B/F01C trust/performance           | CLOSED / PASS        |
| F02 Multi-seed survey                          | COMPLETE / measured  |
| F03 Player Agency                              | COMPLETE / diagnosed |
| F03A downstream integration                    | PASS                 |
| F03B leverage diagnosis                        | COMPLETE             |
| F04 Degenerate Strategy / Exploit Check        | COMPLETE             |
| F04A endogenous faction dynamics               | PASS                 |
| F04B active conflict / recovery                | FINAL PASS           |
| F04C institution-mediated stabilization design | COMPLETED            |
| F04C-R political/historical grounding          | PASS / COMPLETED     |
| F04D                                           | READY / NOT STARTED  |
| F05                                            | NOT STARTED          |
| V02 / Gate 1V renderer                         | NOT STARTED          |
| War as Politics implementation                 | NOT STARTED          |
| Fantasy politics implementation                | NOT STARTED          |

F04/F04A/F04B의 diagnostic finding은 모두 gameplay를 이번 checkpoint에서 수정했다는 뜻이 아니다. F05는 F04D와 counterfactual validation 이후에만 검토한다.

## 3. F04C-R result

F04C-R은 docs/research-only task로 PASS했다. 주요 case, counterexample/limitation, source ledger, existing-state fit은 docs/F04C_R_POLITICAL_HISTORICAL_REFERENCE_GROUNDING.md에 있다.

### Political competition decision

결정은 ADD, 단 다음의 좁은 institutional axis로만 허용한다.

    politicalCompetition = banned | restricted | plural

의미는 독립 opposition/경쟁 정치조직이 합법적으로 활동할 수 있는 범위다. 다음과 동일하지 않다.

- democracy score
- liberalism/openness score
- legitimacy score
- civil-liberties score
- generic regime score
- election system
- parliamentary seat composition
- government turnover

기존 distinction도 유지한다.

    suffrage != pressFreedom != laborOrganization != politicalCompetition

현재 source schema에는 이 rule이 아직 없다. migration task에서 추가하지 않는다.

## 4. Frozen F04D scope

F04D는 다음 최소 action candidates만 검토할 수 있다.

1. material relief
2. limited political amnesty / accommodation proxy
3. opposition legalization + narrow politicalCompetition
4. coercive political-organization restriction

의도된 distinction:

- material relief != political accommodation
- amnesty != opposition legalization
- opposition legalization != suffrage
- opposition legalization != press freedom
- politicalCompetition != democracy score
- coercion != permanent organization deletion

F04D의 proof는 숫자 하나의 변화가 아니라 같은 checkpoint에서 institutional configuration과 response가 downstream political history를 갈라놓는지 확인해야 한다. 후보 evidence는 grievance, organization, scarcity, unrest, coup/rebellion eligibility, crisis timing/kind, conflict, territory, government transition, consolidation이다.

## 5. Architecture invariants

### Authoritative simulation

- deterministic simulation core가 authoritative하다.
- LLM은 action proposal만 만들 수 있고 treasury, population, production, prices, resources, military strength, territory, state capacity, political support, organization, ideology, crisis, war, victory/defeat를 직접 변경하지 않는다.
- 올바른 흐름은 observation → structured proposal → validation → simulation resolution → event log → presentation이다.
- Agenda는 현재 state/pressure의 derived read model이며 quest chain이 아니다.
- authoritative storyProgress, chapter progression, fixed revolution phase/countdown을 만들지 않는다.

### Outcome and continuity

- 플레이어는 ruler가 아니라 CountryId의 historical continuity다.
- Government 변경은 국가 continuity를 끊지 않는다.
- 승리는 Order Consolidation, terminal defeat는 State Dissolution이다.
- ideology가 100%가 되는 것을 승리 조건으로 만들지 않는다.

### Territory and presentation

- WorldState.landHexStates[*].controller가 physical territorial authority의 유일한 writable source다.
- Region.stateControl은 행정·치안·국가 침투도이며 physical controller가 아니다.
- legal ownership, physical control, political influence를 섞지 않는다.
- Region은 하나 이상의 LandHex를 포함하는 aggregate이며 Region=Hex로 단순화하지 않는다.
- Front와 presentation state는 derived다. Renderer가 simulation entity나 결과를 발명하지 않는다.

### Regime and institutions

- RegimeClassification은 실제 Institutional Rules의 derived label이다.
- regime label을 직접 읽는 stability bonus, democracy meter, openness meter, universal political mana를 만들지 않는다.
- 현재 Institutional Rules의 실제 schema와 consumer를 먼저 읽고, 새 rule은 F04D에서 작은 slice로만 검토한다.
- 현재 politicalCompetition은 문서상의 candidate이지 source field가 아니다.

### Trust, persistence, replay

- canonical trust는 process-local이며 serializable capability가 아니다.
- canonical RunRecord는 runtime-immutable이다.
- trusted SimulationStepResult는 exact source WorldState에 parent-bound이며 canonical commit에서 single-use다.
- deserialize는 decode 후 full validation과 runtime immutability를 거쳐 canonical registration한다.
- serialize는 canonical marker를 믿고 full validation을 생략하지 않는다.
- EventStore/ActionRecord/commitment provenance와 T024 replay/cross-save causality를 유지한다.

## 6. Current source boundaries relevant to F04D

현재 source의 InstitutionalRuleState는 rulerVeto, legislatureRequired, suffrage, productiveProperty, landOwnership, laborOrganization, pressFreedom을 가진다. politicalCompetition, elections, parties, parliamentary composition, government turnover는 구현되어 있지 않다.

현재 intervention effect union은 concrete authoritative state를 대상으로 하며, F03A에서 검증된 대표 path는 다음과 같다.

- region resource/food capacity → scarcity → T017 material pressure
- faction organization → T016/T018 prerequisite read model
- faction grievance → T016/T018 prerequisite read model

F04D는 이 existing consumer chain을 재사용해야 하며 regime ID special-case, direct crisis scheduling, generic modifier DSL을 추가하지 않는다.

## 7. Known findings carried forward

- F02 WAIT baseline은 seed diversity가 거의 없고 긴 political silence를 보였다.
- F03A 이후 intervention state/downstream difference는 존재하지만 political history divergence는 약했다.
- F04/F04A/F04B에서 preventive, active-conflict, recovery agency를 분리해 진단했다.
- F04A 이후 faction grievance/organization one-way ratchet는 해소됐다.
- F04B는 내부반란 recovery path를 최소하게 추가했고 T021 LandHex authority와 Country continuity를 보존했다.
- WAIT dominance, pre-crisis timing cliff, broader institutional differentiation은 F04D/F05에서 다시 검증해야 한다.

이 항목들은 이번 migration에서 수정하거나 balance decision으로 확정하지 않는다.

## 8. Repository migration state

현재 laptop repository의 관찰 결과:

- branch: master
- HEAD commit: 없음 (master에 아직 commit 없음)
- configured remote: 없음
- Git tracked files: 0
- working tree: repository 파일 전체가 untracked로 보임
- 기존 사용자 작업: 보존해야 하며, migration task는 삭제/reset/clean/push/commit을 수행하지 않음
- local runtime observed: Node v24.19.0, pnpm 11.19.0
- dependency source: pnpm-lock.yaml

따라서 현재 상태는 clone 가능한 reviewed commit이 아니라 laptop worktree checkpoint다. Desktop clone을 만들려면 먼저 사용자가 별도 review 후 commit과 remote push를 해야 한다. 이 handoff는 그 전제와 수동 명령을 기록하며 push하지 않는다.

Regenerable/local-only 항목:

- node_modules/: pnpm install --frozen-lockfile로 재생성
- dist/: pnpm run build로 재생성
- .pnpm-store/: pnpm cache; 수동 이동 불필요
- .vite/ 및 tool cache: 재생성
- .env/.env.local: 현재 repository에서 발견되지 않음; secret을 handoff에 기록하지 않음

## 9. Canonical handoff bundle

- TMR_HANDOFF_MASTER_2026-08-24_F04CR_COMPLETE.md
- TMR_CURRENT_TASK_F04D_2026-08-24.md
- TMR_NEW_CHAT_BOOTSTRAP_2026-08-24_F04CR_COMPLETE.md
- TMR_MIGRATION_LAPTOP_TO_DESKTOP_2026-08-24.md

새 desktop session은 위 master/current-task/bootstrap 세 파일을 우선 읽고, migration README로 환경을 검증한다.

## 10. Immediate next sequence

    migration verification
    → create/review final F04D implementation prompt
    → F04D implementation
    → same-state counterfactual validation
    → F04 assessment
    → F05 only if ready
    → Gate 1F decision
    → V02 only after Gate 1F PASS

F04D 구현, politicalCompetition source schema 추가, F05, V02, war/fantasy implementation은 이 migration task에서 시작하지 않았다.
