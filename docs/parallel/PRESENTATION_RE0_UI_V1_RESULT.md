# Presentation RE0 UI V1 결과

## 구현 결과

- 기본 화면에서 admin dashboard형 `game-grid`, metric fact strip/detail, 상시 agenda 탭을 제거했다.
- 기본 HUD는 국가 정체성, 재정·정통성·국가역량·불안의 4개 질적 신호, compact playback으로 정리했다.
- auto-slow와 `+1/+7/+30일`은 `보조 설정` details 안으로 강등했다.
- 주 네비게이션은 `지도 / 결정 / 제도 / 연대기`로 구성했다.
- Decisions는 `decisionSurface.primaryShortlist`의 혼합 순서와 5개 표시를 유지하고, 각 카드에 현재성 설명과 결과·반응 배지를 추가했다.
- InstitutionalRoadmap를 Decision drawer에서 제거하고 Institutions의 dedicated full-screen mode로 이동했다.
- Chronicle을 dedicated history surface와 timeline으로 전환했다.
- NEWS/TOAST는 map 위 non-blocking stack으로 유지하고, `DECISION_REQUIRED`는 실제 matching open `PoliticalProposal` 경로만 사용한다.

## Institutional Web proof

- 브라우저 실제 화면: 1440×900 Institutions surface.
- 실제 정책 node: 24개.
- 실제 domain lane: authority, property, labor, information.
- prerequisite depth: 0, 1, 2의 가로 배치.
- 브라우저 DOM rectangle 교차 계산: node overlap 0건.
- pan/zoom과 `제도 연결 읽기`를 제공하며 별도 연구 화폐·focus·timer는 추가하지 않았다.

## Chronicle proof

- day 30 실제 실행 후 EventStore에서 파생된 12개 흐름을 dedicated timeline에서 확인했다.
- 날짜는 `30일차`, `27일차`처럼 chronology를 유지하고, 주요 전환·상태 흐름과 원문 기록 개수를 분리했다.

## Browser evidence

실제 로컬 브라우저에서 열어 시각 검토한 파일:

- `docs/parallel/evidence/presentation-re0-ui-v1-desktop-map.png` — 1440×900 기본 Map
- `docs/parallel/evidence/presentation-re0-ui-v1-desktop-decisions.png` — 1440×900 Decisions drawer
- `docs/parallel/evidence/presentation-re0-ui-v1-desktop-institutions.png` — 1440×900 Institutions full-screen
- `docs/parallel/evidence/presentation-re0-ui-v1-desktop-chronicle.png` — day 30 Chronicle full-screen
- `docs/parallel/evidence/presentation-re0-ui-v1-desktop-rebellion-news.png` — day 30 active rebellion + NEWS/TOAST
- `docs/parallel/evidence/presentation-re0-ui-v1-mobile-map.png` — 390×844 기본 Map
- `docs/parallel/evidence/presentation-re0-ui-v1-mobile-decisions.png` — 390×844 Decisions bottom sheet
- `docs/parallel/evidence/presentation-re0-ui-v1-mobile-institutions.png` — 추가 390×844 Institutions mode 확인

## Mobile proof

- 기본 Map에서 world surface가 먼저 보이고 navigation은 map 하단에 남는다.
- Decisions sheet는 지도 문맥을 남긴 채 열린다. 실제 drawer rectangle은 432px로 viewport의 약 절반이다.
- Institutions/Chronicle은 sheet가 아닌 명시적 full-screen mode와 44px back target을 사용한다.
- 390×844 실제 측정에서 document `scrollWidth=390`, client width도 390이었다.

## Verification

| 항목 | 결과 |
|---|---|
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm format` | PASS |
| `git diff --check` | PASS |
| focused UI/presentation tests | PASS — 5 files, 20 tests |
| `pnpm build` | PASS — Vite build 완료; large chunk warning만 출력 |
| browser screenshot inspection | PASS — 7개 evidence 파일을 실제로 열어 시각 검토 |

`pnpm test` 전체 실행은 102개 파일 중 101개 통과, 705/706 assertions 통과로 종료됐다. 실패 1건은 UI 소유 범위 밖인 `src/presentation/mapVisualSystem.test.ts:94`에서 현재 world worktree의 LOD 결과 `["palace"]`와 기존 기대값 `["palace", "water-shelf"]`가 달라진 항목이다. 추가로 Vitest `onTaskUpdate` timeout 4건이 발생했다. UI 집중 테스트 결과와 분리해 기록한다.

## Remaining visual weaknesses

- Institutional Web은 24개 node를 겹치지 않게 배치하지만, 초기 viewport에는 상위 lane이 우선 보이고 하위 lane은 graph pan/zoom으로 읽는다.
- world renderer의 landmark/material 및 label 세부 조정은 이 track의 소유 범위가 아니므로 변경하지 않았다.
- 공유 visual bar의 최종 판정은 이 결과에서 자체 PASS로 선언하지 않는다.

## Scope boundary

world renderer 관련 기존 worktree 변경인 `src/app/PoliticalWorldStage.tsx`, `src/presentation/mapArchitecture.ts`, `src/presentation/mapRuntime/geometry.ts`, `src/presentation/mapVisualSystem.ts`는 보존했고 이 작업 커밋에 포함하지 않는다.

배포는 실행하지 않았다.
