# PRESENTATION_VISUAL_V2 결과

## 실행 기준

- 실행 authority: `docs/parallel/tasks/PRESENTATION_VISUAL_V2.md`
- visual authority: `docs/bridge/tasks/PRESENTATION_VISUAL_V2_TARGET.md`, `docs/bridge/tasks/PRESENTATION_VISUAL_V2_VISUAL_BAR.md`
- branch: `presentation-visual-v2`
- Phase 0 시작 HEAD: `d5a0265ee9bba0c9cdb38f0056e13f2ef1790690`
- demo seed: `18970401`

## Phase 0 기준선

| 화면 | 캡처 | 관찰 |
| --- | --- | --- |
| desktop 1440x900 | `docs/parallel/evidence/visual-v2-phase0-before-desktop.png` | connected translucent polygon, 반복 카드/metric band, GLTF가 지형 위에 붙은 현재 상태 |
| mobile 390x844 | `docs/parallel/evidence/visual-v2-phase0-before-mobile.png` | 지도와 하단 HUD가 한 화면에 압축되지 못하고 수평 overflow 및 다중 persistent band 노출 |

직접 재생한 deterministic factual rebellion은 무행동 `advanceDemoRuntime(createDemoRuntimeState(), 19)`에서 발생한다.

- event: `REBELLION_STARTED` at tick 19
- affected region: `ideology-fixture.industrial` / 플레이어 표시명 `철산 공업주`
- faction: `t018.fixture.rebellion-faction` / 플레이어 표시명 `철산 노동자회`
- factual evidence: local mobilization, radicalism 0.8, ideology organization 0.8, unrest 0.4550139006080861, geographic concentration 0.9428571428571428, state weakness 0.45
- map contract: the rebellion must change the LandHex/controller/front presentation before the NEWS treatment is shown

## Phase checkpoints

| Phase | 상태 | 증거 |
| --- | --- | --- |
| 0 | COMPLETED | branch/ancestry/clean sync, deterministic Day 0 screenshots, deterministic rebellion sequence |
| 1 | COMPLETED | shared-relief mesh code/test gate; `docs/parallel/evidence/visual-v2-phase1-terrain-desktop.png`; `docs/parallel/evidence/visual-v2-phase1-terrain-mobile.png` 직접 OPEN 검사. X/Z authorial spacing에 맞춘 공통 corner 공유와 실제 높이/vertex color relief 적용, connected translucent fill 비활성화. |
| 2 | COMPLETED | 세 역할(capital / industrial / frontier)을 각각 하나의 grounded place composition으로 표시; material adapter와 terrain terrace/contact shadow 적용. `docs/parallel/evidence/visual-v2-phase2-heroes-desktop.png`; `docs/parallel/evidence/visual-v2-phase2-heroes-mobile.png` 직접 OPEN 검사. per-Hex GLTF scatter 없음. |
| 3 | COMPLETED | `deriveMapVisibilityBudget`로 world/pressure/crisis 모드와 LOD budget을 상태에서 파생. tick 19 factual rebellion에서 affected region LandHex에 crisis contour와 controller/front 변화가 뉴스 overlay와 별도로 먼저 보임. `docs/parallel/evidence/visual-v2-phase3-rebellion-desktop.png`; `docs/parallel/evidence/visual-v2-phase3-rebellion-mobile.png` 직접 OPEN 검사. |
| 4 | COMPLETED | `screenSpaceLabels`가 투영 좌표 기준 충돌 검사 후 우선순위로 cap하며 desktop budget 4/5, mobile 3을 적용. DOM evidence: desktop/mobile `data-map-label-policy=priority-screen-space-collision-cap`, mobile `data-map-label-count=3`, document overflow 0. `docs/parallel/evidence/visual-v2-phase4-labels-desktop.png`; `docs/parallel/evidence/visual-v2-phase4-labels-mobile.png` 직접 OPEN 검사. |
| 5 | COMPLETED | 지도-first theatre CSS 적용: desktop map stage가 전체 화면 중심이며 drawer는 우측 context surface로 분리, dark rounded card/gold-border 반복을 제거. mobile은 header 1 band + compact state 1 band, decision drawer에서 CTA와 navigation overlap false를 DOM geometry로 확인. `docs/parallel/evidence/visual-v2-phase5-ui-desktop.png`; `docs/parallel/evidence/visual-v2-phase5-ui-mobile.png`; `docs/parallel/evidence/visual-v2-phase5-decision-mobile.png` 직접 OPEN 검사. |
| 6 | COMPLETED | Chronicle은 EventStore source를 digest 내부에서만 유지하고 player surface의 EventId/internal ID disclosure를 제거. EventPresentationOverlay는 열린 PoliticalProposal에만 수락/거절을 제공하며 institution/agenda drawer는 같은 derived read model을 사용. `docs/parallel/evidence/visual-v2-phase6-chronicle-desktop.png`; `docs/parallel/evidence/visual-v2-phase6-chronicle-mobile.png`; `docs/parallel/evidence/visual-v2-phase6-institution-mobile.png` 직접 OPEN 검사. 금칙어 DOM text scan matches 0. |
| 7 | COMPLETED | mobile Day 0 및 Decision 화면을 390x844에서 직접 OPEN 검사. `docs/parallel/evidence/visual-v2-phase7-mobile-day0.png`, `docs/parallel/evidence/visual-v2-phase7-mobile-decision.png`; persistent HUD bands 2개(56px/64px), label count 3, body overflow 0, Decision CTA와 metric/navigation overlap false. |
| 8 | COMPLETED | title/opening remains on the V2 dark editorial palette; final label texture/readability pass, screen-edge rejection, mobile theatre framing, and desktop playback hit-target correction completed. `pnpm exec prettier --check` PASS, `pnpm lint` PASS, `pnpm typecheck` PASS, `pnpm build` PASS (176 modules; Vite emitted only the existing large-chunk warning), `git diff --check` PASS. |
| 9 | COMPLETED | all eight required final screenshots were captured from the final local source and directly OPEN inspected: desktop Day 0 / rebellion / decisions / institutions / chronicle and mobile map / decisions / rebellion. The browser hard-bar review found 0 visible HARD FAILs. |
| 10 | IN_PROGRESS | local source is pushed to `presentation-visual-v2`; existing Site is public and final saved-version deployment is being closed against the exact pushed source/archive pair. |

## Final screenshot critique

Each row below was captured at the required viewport and directly OPEN inspected. PASS means the screenshot cleared the visual bar; DOM counts and overflow measurements were used only as supporting evidence.

| Screenshot | Strongest focal point | Text / overlap / grounding review | Generic-web pattern / result |
| --- | --- | --- | --- |
| `visual-v2-desktop-day0.png` | continuous relief terrain and the capital silhouette | dark-outlined map labels are readable; top controls no longer overlap the live status line; capital, industrial, and frontier compositions sit on visible terraces/contact shadows | map-first world surface, no repeated dashboard card language — PASS |
| `visual-v2-desktop-rebellion.png` | red crisis contours, crisis beacon, and industrial place | `반란` is visible at the state-derived region; crisis treatment is concentrated on the map; event treatment does not cover the place or controls | factual crisis reads before secondary UI — PASS |
| `visual-v2-desktop-decisions.png` | map remains dominant beside the decision sheet | Korean decision copy is readable; mixed contextual shortlist begins with `철산 공업주 식량 생산능력 보강` then `노동자회 제한적 정치 타협`; CTA and event notices remain separated | flat editorial list, not a generic card stack — PASS |
| `visual-v2-desktop-institutions.png` | current institution pressure and progression lane | headings, statuses, and reasons remain legible; drawer stays within the right context lane and does not cover the map focal point | progression surface avoids dependency-inspector treatment — PASS |
| `visual-v2-desktop-chronicle.png` | highlighted day-19 major event | major rebellion headline is distinct from compact historical rows; no raw event IDs or log-like player copy; drawer and map remain separate | editorial timeline, not an admin log — PASS |
| `visual-v2-mobile-map.png` | capital and industrial places within the narrow theatre | three-label cap holds; Korean labels do not clip or stack vertically; two persistent HUD bands remain; hero assets are grounded | mobile is a separate map composition, not squeezed desktop — PASS |
| `visual-v2-mobile-decisions.png` | decision sheet CTA over the still-visible crisis map | primary CTA is inside the bottom sheet; playback and navigation are absent from the sheet zone; measured CTA/drawer/nav overlap is false and horizontal overflow is 0 | single decision surface without stacked card chrome — PASS |
| `visual-v2-mobile-rebellion.png` | industrial crisis place, red front contours, and rebellion notice | factual crisis is visible on the map before reading the notice; label count is 3; event, map, pressure chip, and bottom navigation remain separated | concentrated crisis signal, no translucent overlay soup — PASS |

Final local visual hard-bar count: **0**.

## Browser and authority gates

- local browser smoke: `3x` selected, playback started, deterministic `REBELLION_STARTED` reached at tick 19, crisis remained visible on the actual map, and automatic crisis response changed playback to `1x` while the run continued.
- final browser audit: speed-button hit targets all resolve to their buttons; desktop label count is 5; mobile label count is 3; horizontal overflow is 0; player-facing forbidden-term scan is empty.
- contextual mixed shortlist remains derived from the production selector and retains the authoritative order recorded above.
- event presentation remains derived from EventStore and only open PoliticalProposal records expose response actions; no WorldState direct mutation was introduced.
- `pnpm vitest run --no-file-parallelism src/app/mapFirstComposition.test.ts src/presentation/mapArchitecture.test.ts src/presentation/mapRuntime/geometry.test.ts src/presentation/mapVisualSystem.test.ts src/presentation/presentationState.test.ts`: 5 files / 30 tests PASS.
- full `pnpm test`: 706 assertions passed; the runner exited 1 after four Vitest worker `onTaskUpdate` timeout errors. This runner result is recorded separately from the focused visual/UI gate.

## Final release

- final hard fail count: 0
- build/smoke gate: local build PASS; local browser smoke PASS; production HTTP/browser smoke pending final source publish
- production URL: `https://too-many-revolutions.leeje92.chatgpt.site`
- production access: public (existing Site retained; no new Site created)
- production deployment: IN_PROGRESS
