# PRESENTATION VISUAL V2 FIX2 RESULT

## 범위

- 실행 authority: `docs/parallel/tasks/PRESENTATION_VISUAL_V2_FIX2.md`
- 구현 시작 HEAD: `a3e702b157967314d7abc34f8771120e9e517b09`
- `c4d3023`의 지도·4-surface·Institutions·Chronicle 구조를 유지했다.
- terrain, simulation, gameplay 경로는 수정하지 않았다. Sites deploy는 실행하지 않았다.

## 구현 결과

- Institutions와 Chronicle의 dedicated surface eyebrow/copy를 실제 화면 용어로 정리했다.
- Institutions 노드는 제목과 상태만 표시하고, 선택한 제도의 상세 정보는 별도 영역에서 제공한다.
- 제도 그래프는 domain lane을 세로로, 선행 단계를 가로로 유지하면서 노드 폭·높이와 가로 스크롤 영역을 확장했다.
- 구현 용어가 노출되던 제도 문구와 접근성 label을 플레이어용 문구로 교체했다.
- 데스크톱 핵심 문구를 13px 이상, 모바일 핵심 문구를 14px 이상으로 조정했다. 노드 제목은 2줄 래핑을 허용하고 ellipsis를 제거했다.
- 모바일 Decisions는 하단 navigation과 충돌하지 않는 패널 구성으로 확인했으며, dedicated deep surface에서는 중복 context tab을 숨겼다.
- `src/app/presentationVisualV2Fix2.test.ts`에 player-copy, 4개 primary label, Decisions/Institutions 분리 source contract를 추가했다.

## 변경 경계

변경된 소스 파일은 다음과 같다.

- `src/app/ContextualDock.tsx`
- `src/app/InstitutionalRoadmapPanel.tsx`
- `src/app/institutionalRoadmap.ts`
- `src/styles/global.css`
- `src/app/presentationVisualV2Fix2.test.ts`

`src/sim/**`, terrain 관련 경로, gameplay 관련 경로는 `git diff --name-only`에 나타나지 않았다.

`global.css`는 기존 FIX1 selector를 수정·병합했다. diff 기준 `103 additions / 35 deletions`, 최종 파일 길이는 `5362` lines이며 새 대형 override layer를 추가하지 않았다.

## 화면 증거

아래 10개 PNG를 1440×900 데스크톱과 390×844 모바일로 저장하고 각각 직접 열어 확인했다.

| 화면 | 증거 | 직접 확인한 내용 |
|---|---|---|
| Desktop map | `docs/parallel/evidence/visual-v2-fix2-desktop-map.png` | 지도 stage, 상태 헤더, 4개 하단 surface navigation, 지도 이슈 chip이 함께 보이며 핵심 문구가 잘리지 않는다. |
| Desktop decisions | `docs/parallel/evidence/visual-v2-fix2-desktop-decisions.png` | 결정 패널의 설명·선택지·실행 CTA와 내부 스크롤이 보이고 하단 navigation과 겹치지 않는다. |
| Desktop institutions | `docs/parallel/evidence/visual-v2-fix2-desktop-institutions.png` | `선행 1단계`·`선행 2단계` 헤딩, compact node title/state, 오른쪽 선택 제도 상세 정보, 그래프 가로 스크롤이 보인다. |
| Desktop chronicle | `docs/parallel/evidence/visual-v2-fix2-desktop-chronicle.png` | 연대기 전용 lead card와 이어진 기록 timeline이 generic drawer와 분리된 전체 surface로 보인다. |
| Desktop rebellion | `docs/parallel/evidence/visual-v2-fix2-desktop-rebellion.png` | 180일차 지도에서 `반란 발생`과 `철산 공업주 통제 변화` event presentation이 표시된다. |
| Mobile map | `docs/parallel/evidence/visual-v2-fix2-mobile-map.png` | 390px 폭에서 event 카드, 지도, issue chip, 하단 navigation이 서로 겹치지 않는다. |
| Mobile decisions | `docs/parallel/evidence/visual-v2-fix2-mobile-decisions.png` | 결정 패널의 설명과 첫 CTA가 390px 화면 안에서 읽히며 conflicting HUD가 추가로 나타나지 않는다. |
| Mobile institutions | `docs/parallel/evidence/visual-v2-fix2-mobile-institutions.png` | 제도 전용 back button, `제도 경로`, 단계 헤딩과 compact node가 보이고 그래프는 가로 스크롤로 확장된다. |
| Mobile chronicle | `docs/parallel/evidence/visual-v2-fix2-mobile-chronicle.png` | `국가 연대기` eyebrow, lead record, timeline copy가 보이며 하단 context tab overlay가 없다. |
| Mobile rebellion | `docs/parallel/evidence/visual-v2-fix2-mobile-rebellion.png` | 반란·통제 변화 event copy, 지도, 하단 navigation이 390px 화면에서 분리되어 보인다. |

## 계산된 글자 크기

브라우저 computed style을 증거 화면과 같은 viewport에서 읽었다. secondary metadata는 authority가 허용한 예외로 두었다.

| 항목 | Desktop | Mobile |
|---|---:|---:|
| primary navigation | 13px | 14px |
| Decisions why-now / body | 13px | 14px |
| Decisions title | 15px | 15px |
| Decisions CTA | 13px | 14px |
| Institutions node title | 13px | 14px |
| selected institution detail body | 13px | 14px |
| Chronicle title / body | 13px / 13px | 14px / 14px |
| event NEWS title / body | 14.4px / 13px | 14px / 14px |

추가로 모바일 body의 `clientWidth / scrollWidth`는 `390 / 390`, Institutions graph viewport는 약 `337px / 1520px`이고 세로 영역은 약 `447px / 1394px`였다. deep surface에서 context tab은 `display: none`으로 계산되며 전용 back button을 사용한다. 모바일 manual `+30일` 조작은 실제로 180일차까지 진행되어 rebellion 증거를 생성했다.

DOM/static copy contract에서 Institutions player-facing text의 `depth`, `inspector`, `simulation`, `catalog`, `fixture` 및 raw `gamebuilders.*` 노출은 0건으로 확인했다.

## 검증

- focused Vitest: 8 files, 29 tests passed
- `pnpm typecheck`: exit 0
- `pnpm lint`: exit 0
- `pnpm format`: exit 0
- `pnpm build`: exit 0; 기존 대형 chunk warning만 출력
- `git diff --check`: exit 0
- `pnpm test` 1회: 104 files, 713 tests passed. Vitest worker `Timeout calling "onTaskUpdate"` unhandled errors 4건으로 runner exit 1.

이 문서와 증거는 FIX2 작업 결과 기록이며 Visual PASS를 선언하지 않는다. 외부 visual review는 후속 검토로 남긴다.
