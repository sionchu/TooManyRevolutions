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
| 2 | NOT_RUN | - |
| 3 | NOT_RUN | - |
| 4 | NOT_RUN | - |
| 5 | NOT_RUN | - |
| 6 | NOT_RUN | - |
| 7 | NOT_RUN | - |
| 8 | NOT_RUN | - |
| 9 | NOT_RUN | - |
| 10 | NOT_RUN | - |

## Final release

- final hard fail count: NOT_RUN
- build/smoke gate: NOT_RUN
- production URL: `https://too-many-revolutions.leeje92.chatgpt.site`
- production deployment: NOT_RUN
