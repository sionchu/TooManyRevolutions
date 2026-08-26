# 06 Map Runtime Rolling QA

## REVIEW_SCOPE

- 역할: VISUAL DIRECTOR + UX QA + PRODUCT QC
- 목적: 기존 06 Visual QA baseline과 Map Runtime target의 동일 조건 비교
- production code 변경: 없음
- 비교 조건: desktop 1440×900, labels OFF, Day90 rebellion, mobile 390×844
- target 실행 방식: `parallel-p0-map-runtime`을 temporary detached worktree에서 실행하고 local Vite 화면을 hands-on 검토
- baseline 실행 방식: 기존 06 결과의 public deployment와 동일한 공개 화면을 같은 viewport에서 재확인
- 결과 판정: `PASS`, `PARTIAL`, `FAIL`

## BASELINE

- branch: `parallel-p0-visual-qa-v2`
- SHA: `cfd8a87ba1bea3f6e0f2727a9f428cacdc795699`
- public URL: `https://too-many-revolutions-gamebuilders.leeje92.chatgpt.site`
- deployed source: `271eb18b9d713c3d639091b35aa65c2c0d780b69`, Sites version 22
- 기존 baseline의 핵심 상태: world-content occupancy `0.997×0.740`, Day90 faction surface/front metadata 없음, mobile canvas 약 54% viewport height

## REVIEW_TARGET

- branch: `parallel-p0-map-runtime`
- SHA: `18d2f297c25dd27cfd05ea5c37e5d10f71f689e0`
- 실행 URL: `http://127.0.0.1:5176/`
- 실행 worktree: `C:\Temp\TooManyRevolutions-map-runtime-rolling-qa-20260826`
- deployed source: target branch는 이번 rolling review에서 production deploy하지 않음
- target Day0 metadata: world-content occupancy `1.000×0.962`, runtime geometry `continuous-surface`, polygon 6, shared vertices 34
- target Day90 metadata: faction surface 6, front 2, label count 21, active conflict `반란`

## EVIDENCE

| 비교 | baseline | target | 판정 |
| --- | --- | --- | --- |
| Day0 desktop | 큰 low-poly object cluster가 map stage를 채우지만 terrain이 평평한 board로 보임 | continuous terrain polygon이 추가되었으나 meaningful object는 중앙에 더 작게 모이고 inner map backdrop이 생김 | **FAIL** |
| Labels OFF Day0 | generic object, ring, route 중심 | hex/polygon ground가 늘었지만 장소별 silhouette는 여전히 generic | **FAIL** |
| Day90 rebellion | red flag와 controller marker가 여러 점으로 반복됨 | 연결된 갈색 faction surface와 경계가 생기고 반복 flag dominance가 줄어듦 | **PARTIAL** |
| Labels OFF Day90 | 반란은 red marker와 line 집합으로만 읽힘 | 큰 점령 영역과 외곽 front가 map-only에서도 읽힘. 단, 지형과 색이 평탄하고 front 방향은 약함 | **PARTIAL** |
| Mobile 390×844 | canvas `455.9px`, HUD `132.4px`, stage `573.9px` | 동일 layout/height, camera zoom만 `1.72→1.82` | **FAIL** |
| Player-theater | preset `mobile.player-theater`, zoom `1.72`, focus `world` | preset `mobile.player-theater`, zoom `1.82`, focus `world`; terrain polygon은 추가됨 | **PARTIAL** |

## DESKTOP_DAY0

| 평가 항목 | 판정 | 근거 / exact screen·component | player consequence | severity | recommended owner |
| --- | --- | --- | --- | --- | --- |
| 2-second gaze order / P0-VIS-01 재검토 | **FAIL** | `compare-day0-desktop-baseline-target-1440x900.png`; 두 화면 모두 상단 `국가 상태 HUD`와 `시간 진행`이 먼저 나오며 target은 map inner surface가 더 작게 보인다. | target에서도 첫 시선이 WORLD가 아니라 status/control shell에 고정된다. | P0 | INTEGRATION |
| World occupancy의 실제 인상 | **PARTIAL** | target metadata는 `1.000×0.962`이지만 `target-day0-desktop-1440x900.png`에서 높은 점유율을 만든 것은 희미한 polygon ground이며 capital/POI/route가 채우는 meaningful content는 중앙에 집중된다. | 숫자상 개선이 실제 playable world density 개선으로 오인될 수 있고, 화면은 여전히 작은 board처럼 보인다. | P1 | 01_MAP_RUNTIME |
| Terrain geography richness | **PARTIAL** | `compare-day0-desktop-baseline-target-1440x900.png`; target은 연속 polygon과 hex-like ground footprint를 추가해 빈 backdrop을 줄였지만 coast, river, elevation, valley, biome의 차이는 거의 없다. | 땅이 이어졌다는 감각은 늘지만 장소가 왜 그곳에 있는지 설명하는 geography는 늘지 않는다. | P1 | 02_WORLD_ART |
| Silhouette hierarchy | **FAIL** | target의 `world-scene-frame`에서 capital, industrial block, POI, settlement, decorative tree/rock가 모두 비슷한 low-poly mass이며 polygon ground가 object보다 먼저 보이는 순간도 있다. | capital과 POI의 우선순위를 빠르게 읽을 수 없다. | P0 | 02_WORLD_ART |
| Map density / route density | **PARTIAL** | target은 terrain surface coverage를 늘렸지만 route line, ring, node, label, block object가 한 화면에서 서로 경쟁한다. | world occupancy는 커졌어도 decision-worthy landmark의 scanability는 충분히 좋아지지 않는다. | P1 | 03_ICON_SYSTEM |

## LABELS_OFF_QA

`?mapLabels=0`에서 map label count가 0인 화면을 비교했다. UI event/status text는 map label이 아니므로 계속 표시되며, 아래 판정은 map-only visual grammar를 기준으로 한다.

| 대상 | 판정 | 근거 / exact evidence | player consequence | severity | recommended owner |
| --- | --- | --- | --- | --- | --- |
| Capital | **FAIL** | `compare-labels-off-day0-baseline-target-1440x900.png`; target polygon ground는 늘었지만 가장 큰 beige block과 다른 large block 사이의 capital-specific skyline/seat cue는 약하다. | label을 끄면 정치 중심을 스스로 찾기 어렵다. | P0 | 02_WORLD_ART |
| Industrial region | **FAIL** | 같은 비교 화면에서 smokestack과 beige block이 보이나 settlement/POI와 분리되지 않는다. | 산업 압력의 공간적 근거가 generic prop처럼 보인다. | P0 | 02_WORLD_ART |
| Port | **FAIL** | white node/route와 작은 dark object는 있으나 shoreline, water edge, quay, vessel의 조합이 없다. | 항구와 일반 route node를 구분하기 어렵다. | P0 | 02_WORLD_ART |
| Frontier | **FAIL** | `compare-labels-off-day90-baseline-target-1440x900.png`; target outer area/front는 보이지만 fort, gate, border terrain의 frontier silhouette는 없다. | 국경 위험과 이동 경로를 지형으로 읽기 어렵다. | P0 | 02_WORLD_ART |
| Rebellion | **PARTIAL** | 같은 Day90 labels OFF 비교에서 target은 큰 갈색 faction surface와 외곽 front를 보여 baseline의 반복 flag보다 낫다. 다만 event card 문장과 평탄한 색면에 의존하고 front 방향/점령 주체가 뚜렷하지 않다. | 반란 존재는 감지하지만 세력의 확장과 점령 범위는 빠르게 판단하기 어렵다. | P1 | 01_MAP_RUNTIME |
| Labels-off overall | **FAIL** | target `data-map-label-count=0`은 확인되지만 5개 semantic class 중 rebellion 외 4개는 안정적으로 분리되지 않는다. | label이 사라지면 world grammar가 함께 사라진다. | P0 | 02_WORLD_ART |

## DAY90_REBELLION

### Metadata comparison

| 지표 | baseline | target | 해석 |
| --- | --- | --- | --- |
| `data-map-faction-surface-count` | 없음 / 0에 해당하는 상태 | `6` | target에 faction area surface가 실제로 투영됨 |
| `data-map-front-count` | 없음 / 0에 해당하는 상태 | `2` | target에 front layer가 실제로 투영됨 |
| visual controller presentation | 여러 red flag/controller marker가 분산 | 연결된 갈색 영역과 외곽 경계, 중앙 conflict landmark | 반복 flag dominance 감소 |
| camera | `region.focus.ideology-fixture.capital`, zoom `1.68` | 같은 focus preset, zoom `1.42` | target은 area를 더 넓은 관계로 보여주지만 object scale은 작아짐 |
| owner/controller facts | UI와 marker가 별도 단서로 존재 | 선택 시 `소유: 아르켄 왕국 · 물리 통제: 세력 존재` | semantic distinction은 text inspector에 남음 |

### Required questions

| 질문 | 판정 | 답변 |
| --- | --- | --- |
| P0-VIS-03 territory/front hierarchy가 실제로 개선됐나? | **PARTIAL** | 개선됐다. target Day90에는 6 faction surface와 2 front가 있고 screenshot에서도 연결된 점령 영역이 보인다. 그러나 색면이 terrain과 가깝고 front가 방향성 있는 전선보다 faceted polygon 경계처럼 보여 제품 기준 PASS는 아니다. |
| 반란이 반복 flag가 아니라 area/front로 읽히나? | **PARTIAL** | baseline의 반복 flag 집합에서 target의 area/front 중심 표현으로 이동했다. labels OFF에서도 갈색 영역은 읽히지만, owner/controller/front가 하나의 강한 정치 지도 문법으로 분리되지는 않는다. |
| repeated faction flags가 줄었나? | **PASS** | `compare-day90-rebellion-baseline-target-1440x900.png`와 `compare-labels-off-day90-baseline-target-1440x900.png`에서 baseline의 여러 flag row가 target의 connected surface를 지배하지 않는다. |
| owner/controller/front distinction이 읽히나? | **PARTIAL** | target의 selected-region evidence는 legal owner `아르켄 왕국`과 physical control `세력 존재`를 설명하지만, map 자체에서는 owner fill, controller area, front line의 visual channel 대비가 약하다. |

## MOBILE_390X844

| 평가 항목 | baseline | target | 판정 / consequence | severity | recommended owner |
| --- | --- | --- | --- | --- | --- |
| Actual first viewport world share | canvas `455.9px / 844 = 54.0%`; stage `573.9px = 68.0%` | canvas `455.9px / 844 = 54.0%`; stage `573.9px = 68.0%` | **FAIL**. stage height에는 header/status/overlay가 포함되며, actual map canvas는 60% 미만이다. target은 terrain을 추가했지만 map 시작 위치를 앞당기지 않았다. | P0 | INTEGRATION |
| Mobile HUD height | `132.4px` | `132.4px` | **FAIL**. target에서 HUD와 진행 row 누적이 그대로라 world-first가 개선되지 않았다. | P1 | INTEGRATION |
| Player-theater framing | preset `mobile.player-theater`, zoom `1.72`, focus `world` | preset `mobile.player-theater`, zoom `1.82`, focus `world` | **PARTIAL**. target zoom은 커졌지만 기본 화면에서 player country + border context가 강하게 읽히지 않는다. | P1 | 01_MAP_RUNTIME |
| Touch target | map controls 약 `24.8px`, 진행 controls 약 `40px` | 동일 | **FAIL**. target map runtime 변경으로 touch affordance는 개선되지 않았다. | P1 | INTEGRATION |
| Drawer obstruction | selected drawer가 canvas 하단 대부분을 덮음 | 이번 target scope에서도 same layout contract | **FAIL**. detail 선택 후 surrounding world context가 충분히 남지 않는다. | P1 | INTEGRATION |
| Horizontal fit | client `375px`, scroll `383px` | client `375px`, scroll `383px` | **FAIL**. target에 8px horizontal overflow가 남아 있다. | P2 | INTEGRATION |

## QUESTION_ANSWERS

1. **P0-VIS-01 world-first가 개선됐나? — FAIL / 실질적 개선 없음.** target Day0에도 HUD와 time controls가 먼저 보이고, meaningful map object는 중앙에 더 작게 집중된다.
2. **P0-VIS-03 territory/front hierarchy가 개선됐나? — PARTIAL / 분명한 개선.** connected faction surface와 2 front가 새로 보이지만 owner/controller/front의 대비와 방향성은 부족하다.
3. **1.000×0.962 occupancy가 화면에서도 사실인가? — PARTIAL.** authored render bounds와 polygon footprint 기준으로는 맞다. 그러나 player가 읽는 meaningful world occupancy로 해석하면 중앙 object cluster와 빈 backdrop이 남아 주장 전체는 성립하지 않는다.
4. **mobile first viewport world share가 실제 60% 이상인가? — FAIL / 아니다.** actual canvas는 54.0%이며 상단 HUD/진행 UI가 map보다 먼저 차지한다.
5. **continuous terrain은 좋아졌지만 지형 정보가 평탄화됐나? — PARTIAL / 그렇다.** surface coverage와 연결감은 개선됐지만 6개 polygon의 flat translucent board가 geography의 원인·차이를 거의 전달하지 않는다.
6. **반란이 반복 flag가 아니라 area/front로 읽히나? — PARTIAL.** target은 area/front로 이동했으나, 정치적 점령 영역이라기보다 faceted color surface로 읽히는 순간이 남아 있다.

## P0_BLOCKERS_REMAINING

| ID | 상태 | screenshot / evidence | exact component / screen | player consequence | severity | recommended owner | fix direction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P0-VIS-01 | **RETAINED** | `compare-day0-desktop-baseline-target-1440x900.png`, `compare-mobile-day0-baseline-target-390x844.png` | `국가 상태 HUD` + `시간 진행` + `정치 세계 지도` composition | target도 world-first 진입을 만들지 못해 primary board가 보조 surface처럼 보인다. | P0 | INTEGRATION | meaningful world를 첫 viewport의 주 시각 anchor로 재배치하고 HUD/status를 compact cue로 줄인다. |
| P0-VIS-02 | **RETAINED** | `compare-labels-off-day0-baseline-target-1440x900.png`, `compare-labels-off-day90-baseline-target-1440x900.png` | R3F map asset/silhouette layer | label OFF에서 capital/industrial/port/frontier를 안정적으로 구분할 수 없다. | P0 | 02_WORLD_ART | semantic class별 mass, skyline, ground, water, border cue를 분리한다. |
| P0-VIS-03 | **IMPROVED / NOT CLOSED** | `compare-day90-rebellion-baseline-target-1440x900.png`, `target-day90-selected-region-1440x900.png` | faction surface/front/owner-controller rendering in `world-scene-frame` | 반복 flag 문제는 줄었지만 front 방향과 owner/controller distinction이 충분히 읽히지 않는다. | P0 residual | 01_MAP_RUNTIME | merged area와 front를 지형 위에서 더 강하게 분리하고 legal owner / physical controller / conflict front의 채널을 겹치지 않게 한다. |

## P1_POLISH

| ID | issue | screenshot / evidence | exact component / screen | player consequence | severity | recommended owner |
| --- | --- | --- | --- | --- | --- | --- |
| P1-MR-01 | occupancy metric semantics | `target-day0-desktop-1440x900.png`, target DOM attrs | `.world-scene-viewport` occupancy attributes와 meaningful object footprint | polygon backdrop이 world density로 계산되어 실제 scanability와 metric이 어긋난다. | P1 | 01_MAP_RUNTIME |
| P1-MR-02 | continuous terrain faceting | `compare-labels-off-day0-baseline-target-1440x900.png` | continuous-surface polygon layer | 연결된 지형보다 translucent hex/polygon board가 먼저 읽힌다. | P1 | 02_WORLD_ART |
| P1-MR-03 | owner/controller/front contrast | `compare-labels-off-day90-baseline-target-1440x900.png`, `target-day90-selected-region-1440x900.png` | faction surface, front line, selected-region inspector | legal owner와 physical controller를 map에서 즉시 비교하기 어렵다. | P1 | 01_MAP_RUNTIME |
| P1-MR-04 | mobile composition unchanged | `compare-mobile-day0-baseline-target-390x844.png` | mobile world stage, HUD, map controls, drawer | map runtime 개선이 mobile first viewport, touch, drawer 문제를 해결하지 못한다. | P1 | INTEGRATION |
| P1-MR-05 | label/route/object collision | `compare-day0-desktop-baseline-target-1440x900.png` | label LOD, route line, ring/node, POI marker | terrain coverage가 늘어도 landmark scan order가 충분히 개선되지 않는다. | P1 | 03_ICON_SYSTEM |

## OWNER_ASSIGNMENT

| Owner | rolling review assignment |
| --- | --- |
| `01_MAP_RUNTIME` | meaningful occupancy metric, stable player-theater framing, merged faction area/front, legal owner versus physical controller versus front channel |
| `02_WORLD_ART` | capital/industrial/port/frontier silhouettes, geography-rich terrain, non-flat continuous terrain, rebellion area visual identity |
| `03_ICON_SYSTEM` | POI/route/ring/label hierarchy, collision and LOD, marker scale after faction surface introduction |
| `04_AUDIO_SYSTEM` | 이번 비교에서 visual blocker 없음. audio quality는 이 rolling visual review 범위에 포함하지 않음. |
| `INTEGRATION` | world-first composition, mobile first viewport, HUD/card/drawer obstruction, responsive overflow and touch targets |

## INTEGRATION_ACCEPTANCE_CHECKLIST

- [ ] `P0-VIS-01`: Day0 2-second gaze에서 meaningful WORLD가 HUD보다 먼저 읽힌다.
- [ ] `P0-VIS-02`: labels OFF에서 capital, industrial region, port, frontier, rebellion을 map-only로 구분한다.
- [ ] `P0-VIS-03`: rebellion은 repeated flags가 아닌 merged area + legible front로 읽힌다.
- [ ] legal owner, physical controller, conflict front가 서로 다른 visual channel로 즉시 구분된다.
- [ ] occupancy metric은 low-information backdrop이 아니라 player-readable world content를 반영한다.
- [ ] mobile 390×844 actual map canvas/world share가 60% 이상이고 player country + border context를 유지한다.
- [ ] mobile touch target은 선택한 기준을 충족하며 horizontal overflow가 없다.
- [ ] continuous terrain이 polygon board보다 coast/river/elevation/biome와 landmark geography를 먼저 전달한다.
- [ ] POI와 capital silhouette가 label과 route보다 먼저 읽힌다.

## SCREENSHOT_PATHS

All new comparison evidence is under `docs/parallel/evidence/06-map-runtime/`.

1. `docs/parallel/evidence/06-map-runtime/target-day0-desktop-1440x900.png`
2. `docs/parallel/evidence/06-map-runtime/target-player-theater-day0-1440x900.png`
3. `docs/parallel/evidence/06-map-runtime/target-labels-off-day0-1440x900.png`
4. `docs/parallel/evidence/06-map-runtime/target-day90-rebellion-1440x900.png`
5. `docs/parallel/evidence/06-map-runtime/target-day90-selected-region-1440x900.png`
6. `docs/parallel/evidence/06-map-runtime/target-labels-off-day90-rebellion-1440x900.png`
7. `docs/parallel/evidence/06-map-runtime/target-mobile-day0-390x844.png`
8. `docs/parallel/evidence/06-map-runtime/baseline-player-theater-day0-1440x900.png`
9. `docs/parallel/evidence/06-map-runtime/compare-day0-desktop-baseline-target-1440x900.png`
10. `docs/parallel/evidence/06-map-runtime/compare-player-theater-baseline-target-1440x900.png`
11. `docs/parallel/evidence/06-map-runtime/compare-labels-off-day0-baseline-target-1440x900.png`
12. `docs/parallel/evidence/06-map-runtime/compare-day90-rebellion-baseline-target-1440x900.png`
13. `docs/parallel/evidence/06-map-runtime/compare-labels-off-day90-baseline-target-1440x900.png`
14. `docs/parallel/evidence/06-map-runtime/compare-mobile-day0-baseline-target-390x844.png`

## NOT_DECLARED

`P0_PRODUCT_PASS`, `Gate1F`, `V02`는 이 rolling review에서 선언하지 않는다.
