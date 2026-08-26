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
| 8 | NOT_RUN | - |
| 9 | NOT_RUN | - |
| 10 | NOT_RUN | - |

## Final release

- final hard fail count: NOT_RUN
- build/smoke gate: NOT_RUN
- production URL: `https://too-many-revolutions.leeje92.chatgpt.site`
- production deployment: NOT_RUN
