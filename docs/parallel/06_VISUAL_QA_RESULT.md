# Parallel P0 Visual QA Result

## EXECUTION_SCOPE

- 역할: VISUAL DIRECTOR + UX QA + PRODUCT QC
- 실행 권한: `docs/parallel/tasks/06_VISUAL_QA.md`
- branch: `parallel-p0-visual-qa-v2`
- 검토 대상: 실제 배포 화면 `https://too-many-revolutions-gamebuilders.leeje92.chatgpt.site`
- 검토 일시: 2026-08-26, 1440×900 및 390×844 hands-on browser review
- production code 변경: 없음
- 자동 테스트: 이번 작업은 배포 화면 시각 QA 범위로 진행했으며 자동 테스트는 실행하지 않음
- 결과 판정: `PASS`는 직접 읽히는 상태, `PARTIAL`은 보조 단서가 있을 때 읽히는 상태, `FAIL`은 핵심 의미가 화면에서 안정적으로 읽히지 않는 상태

## BASE_SHA

`ffc876c8c532ae5f77282ba059ec565532a69eb7`

## HEAD_SHA

`ffc876c8c532ae5f77282ba059ec565532a69eb7`

검토용 코드 HEAD는 위 SHA이며, 이 문서와 evidence는 별도 결과 커밋으로 추가한다.

## DEPLOYED_SOURCE_IF_KNOWN

- Public URL: `https://too-many-revolutions-gamebuilders.leeje92.chatgpt.site`
- 배포 source commit: `271eb18b9d713c3d639091b35aa65c2c0d780b69`
- 배포 버전: Sites version 22
- 배포 source는 검토 HEAD의 선행 frozen map checkpoint이며, 아래 판정은 해당 URL에서 실제로 본 화면에 한정한다.

## EVIDENCE

| Evidence | 실제 관찰 |
| --- | --- |
| `deployed-day0-desktop-1440x900.png` | Day0 global map. 상단 HUD와 진행 컨트롤이 먼저 나오고, 지도는 낮은 영역에 배치된다. 올리브색 backdrop, 블록형 건물, 링과 선형 route가 보인다. |
| `deployed-labels-off-desktop-1440x900.png` | `?mapLabels=0` Day0. 지도 label count는 0이지만 capital/industrial/port/frontier의 silhouette가 서로 충분히 분리되지 않는다. |
| `deployed-day30-rebellion-1440x900.png` | Day30 반란. industrial focus, red event card, red conflict marker가 보이나 통합된 점령 영역은 읽히지 않는다. |
| `deployed-day90-rebellion-controller-1440x900.png` | Day90 반란. 8개 faction controller marker와 red boundary segment가 보이나 반복 flag/셀처럼 읽힌다. |
| `deployed-labels-off-day90-rebellion-1440x900.png` | `?mapLabels=0` Day90. red flag와 red boundary는 반란 단서가 되지만, map-only 정치 영역으로는 일관되게 읽히지 않는다. |
| `deployed-labels-off-day90-selected-region-1440x900.png` | label OFF에서 지역을 선택한 실제 화면. 지역 상세 drawer가 지도 오른쪽을 크게 가리고, 선택 단서가 텍스트 drawer에 의존한다. |
| `deployed-day91-project-implementing-1440x900.png` | 왕실 배급망 implementing 상태. 지도 landmark는 있으나 red conflict layer와 label/route가 더 강하다. |
| `deployed-day92-project-completed-1440x900.png` | 왕실 배급망 completed 상태. landmark 변화는 있으나 implementing과 completed가 즉시 구분될 정도로 크지 않다. |
| `deployed-day1082-late-state-1440x900.png` | late auto-focus. Karsen frontier로 camera가 이동하고 red flag/boundary가 늘어난다. Day0와 동일한 세계 비교가 어렵다. |
| `deployed-day1082-late-state-global-1440x900.png` | late global view. 변화는 보이지만 meaningful world가 중앙 cluster로 몰리고 넓은 empty backdrop이 남는다. |
| `deployed-mobile-default-390x844.png` | 390×844 Day0 default. HUD와 진행 row가 지도보다 먼저 보이고, 지도 canvas는 viewport의 약 54% 높이를 차지한다. |
| `deployed-mobile-selected-drawer-390x844.png` | 390×844에서 실제 지역 선택 drawer. drawer가 canvas 하단 대부분을 덮어 지도와 bottom navigation을 동시에 압박한다. |
| `deployed-late-decision-drawer-1440x900.png` | late decision drawer. 제도 경로와 국가 사업은 읽히지만 map과 drawer가 동시에 경쟁하여 world-first 시선이 약해진다. |

추가 DOM 관찰값:

- Desktop Day0: viewport 1440×900, document scroll height 1012, canvas 약 1345×606, LandHex 20, asset kit 15, composition 10, route 6, map label 17.
- Day90: active conflict `반란`, faction controller marker 8개, project marker 3개.
- Day1082: active conflict `반란` + `쿠데타`, faction controller marker 12개.
- Mobile: viewport 390×844, document client width 375 / scroll width 383, HUD `y=117.6 h=132.4`, canvas `y=314.1 h=455.9`, map control button height 약 24.8px, 주요 진행 버튼 높이 약 40px.
- Label OFF Day0/Day90: `data-map-label-count=0`. UI의 event/status card는 map label이 아니므로 여전히 문장을 표시한다.
- 사용자 화면 body에서 `fixture.`, `PREREQUISITE_NOT_MET`, `privateAllowed`, `debug`, `raw`, `TMI` 문자열은 관찰되지 않았다.

## RUBRIC

| 판정 | 의미 |
| --- | --- |
| PASS | 핵심 의미가 텍스트 보조 없이도 먼저 읽히며 조작을 방해하지 않음 |
| PARTIAL | 색/위치/상태 단서는 있으나 silhouette, hierarchy, 비교 가능성 중 하나가 약함 |
| FAIL | 핵심 의미가 카드·label·drawer에 의존하거나, 화면에서 서로 구분되지 않음 |

## DESKTOP_QA

| 평가 항목 | 판정 | 근거 / exact component·screen | 플레이어 consequence | 심각도 | recommended owner |
| --- | --- | --- | --- | --- | --- |
| 2-second gaze order | **FAIL** | `deployed-day0-desktop-1440x900.png`, `PoliticalWorldStage`의 `국가 상태 HUD`와 `시간 진행`이 화면 상단을 선점하고 `정치 세계 지도`는 아래에서 시작한다. Day30/90에는 `현재 사건` red card가 지도 위에 추가된다. | 첫 입력 전에 국정 dashboard를 읽게 되고, 이 게임의 주 보드인 살아 있는 정치 세계가 첫 시선의 anchor가 되지 못한다. | P0 | INTEGRATION |
| Silhouette hierarchy: capital > major landmark > POI > settlement > prop | **FAIL** | `deployed-day0-desktop-1440x900.png`, R3F `world-scene-frame`의 capital/large block/POI/settlement/tree가 비슷한 low-poly mass와 색으로 렌더된다. `deployed-day90-rebellion-controller-1440x900.png`에서는 flag와 POI가 landmark보다 먼저 튄다. | 수도·산업·항구·정착지의 중요도를 눈으로 학습하기 어렵고, 이동·관찰 우선순위가 생기지 않는다. | P0 | 02_WORLD_ART |
| Map density / empty backdrop / world occupancy | **PARTIAL** | Day0와 `deployed-day1082-late-state-global-1440x900.png`에서 stage 자체는 넓지만 meaningful object가 중앙 cluster에 몰리고 주변은 단순 backdrop이다. 20 LandHex/15 asset/10 composition/6 route는 존재하나 정보가 고르게 분포하지 않는다. | 세계가 넓은 지리보다 작은 board cluster처럼 보이며, late 변화 비교 때 빈 공간이 변화를 희석한다. | P1 | 01_MAP_RUNTIME |
| POI, label, route density | **PARTIAL** | Day0 label 17, Day90 label 21, route 6. `deployed-day90-rebellion-controller-1440x900.png`에서 labels, route lines, red flags, ring marker가 함께 경쟁한다. | 필요한 장소를 찾을 수는 있지만 한 번에 읽는 의미 채널이 겹쳐 POI보다 장식과 line이 먼저 보인다. | P1 | 03_ICON_SYSTEM |
| Desktop vertical fit | **PARTIAL** | Day0 document height가 1012px로 900px viewport보다 길고, bottom tabs·pressure card·map controls가 지도 가장자리와 겹쳐 있다. | 한 화면에서 world와 보조 UI를 동시에 비교하기 어렵고, 첫 진입 시 아래쪽 정보가 잘린다. | P1 | INTEGRATION |

## MOBILE_QA

| 평가 항목 | 판정 | 근거 / exact component·screen | 플레이어 consequence | 심각도 | recommended owner |
| --- | --- | --- | --- | --- | --- |
| First viewport world share | **FAIL** | `deployed-mobile-default-390x844.png`, 390×844에서 canvas는 `y=314.1~770.1`으로 약 54% viewport 높이이며, 상단 314px를 title/HUD/time controls가 사용한다. | 작은 화면에서 지도보다 보조 UI를 먼저 읽게 되어 map-first 전략 게임의 핵심 진입이 약해진다. | P0 | INTEGRATION |
| HUD height | **FAIL** | `국가 상태 HUD` rect `y=117.6, h=132.4`; map stage는 `y=313.1`부터 시작한다. 3 qualitative metric box와 playback/secondary progress row가 누적된다. | 플레이어가 첫 viewport 안에서 국가 상태와 세계 지형을 함께 비교할 수 없다. | P1 | INTEGRATION |
| Tap target | **FAIL** | `deployed-mobile-default-390x844.png`; 지도 `−/+ / 내 극장 / 전체 보기` control은 약 24.8px 높이, playback/`+1일/+7일/+30일`은 약 40px 높이이다. | 지도 확대·카메라 이동과 시간 조작에서 오입력 가능성이 있고, 핵심 control이 손가락 친화적이지 않다. | P1 | 01_MAP_RUNTIME |
| Drawer obstruction | **FAIL** | `deployed-mobile-selected-drawer-390x844.png`, `지역 상세` complementary drawer rect `x=9.6, y=484.7, w=355.8, h=294.5`; canvas 하단의 약 65%를 덮고 bottom tabs도 바로 아래에 붙는다. | 지도 선택 후에도 현재 지형·route·주변 landmark를 유지해서 비교하기 어렵다. | P1 | INTEGRATION |
| Default camera framing | **FAIL** | `deployed-mobile-default-390x844.png`; DOM preset은 `mobile.player-theater`이지만 rendered view는 `camera-focus=world`이고 player country + border context가 한 번에 강하게 읽히지 않는다. | 모바일 기본 진입에서 “내가 어디를 통치하는가”를 즉시 파악하기 어렵다. | P1 | 01_MAP_RUNTIME |
| Horizontal fit | **FAIL** | mobile DOM client width 375px, scroll width 383px. `deployed-mobile-default-390x844.png`와 `deployed-mobile-selected-drawer-390x844.png`에서 우측 scrollbar/좁은 layout 여유가 나타난다. | 가로 edge 조작과 drawer/map 경계가 불안정해지고 작은 화면의 usable width가 줄어든다. | P2 | INTEGRATION |

## LABELS_OFF_QA

`?mapLabels=0`으로 map label layer를 끈 뒤 Day0와 Day90을 실제로 확인했다. label count는 0이었지만 UI event/status card는 유지되므로, 아래 판정은 map-only silhouette와 spatial cue를 기준으로 한다.

| 대상 | 판정 | 근거 / exact component·screen | 플레이어 consequence | 심각도 | recommended owner |
| --- | --- | --- | --- | --- | --- |
| Capital | **FAIL** | `deployed-labels-off-desktop-1440x900.png`; 가장 큰 건물 mass는 있으나 왕궁/수도와 다른 large landmark의 architectural silhouette가 충분히 다르지 않다. | label을 끄면 정치 중심을 스스로 찾기 어렵다. | P0 | 02_WORLD_ART |
| Industrial region | **FAIL** | 같은 Day0 label OFF 화면의 beige block, smokestack, ring/route 조합은 산업 단서이지만 settlement/POI와 혼동된다. | 생산·불안·정치 압력의 공간적 근거가 generic prop처럼 보인다. | P0 | 02_WORLD_ART |
| Port | **FAIL** | Day0 label OFF에서 white circular node/route가 항구 후보로 보이지만 shoreline, quay, vessel, water edge가 명확한 port silhouette를 만들지 않는다. | 항구와 일반 route node를 구분하지 못해 외교·무역 공간을 잃는다. | P0 | 02_WORLD_ART |
| Frontier | **FAIL** | `deployed-labels-off-day90-rebellion-1440x900.png`; 외곽 red flag/boundary는 보이지만 fort/topography/border gate가 하나의 frontier landmark로 묶이지 않는다. | 국경의 위험과 이동 경로를 지형으로 읽지 못한다. | P0 | 02_WORLD_ART |
| Rebellion | **PARTIAL** | 같은 Day90 label OFF 화면의 red flags, red boundary, red event treatment는 반란 단서로 작동하지만, 통합된 occupied area/front가 아닌 반복 marker 집합으로 읽힌다. | 반란의 위치는 추정할 수 있으나 세력이 어디를 장악하고 확장하는지 판단하기 어렵다. | P1 | 01_MAP_RUNTIME |
| Label OFF overall | **FAIL** | Day0와 Day90 모두 5개 semantic class를 안정적으로 분리하지 못한다. 선택 후에는 `deployed-labels-off-day90-selected-region-1440x900.png`처럼 오른쪽 텍스트 drawer가 지역 식별을 대신한다. | labels를 끄는 순간 world grammar가 사라지고, 플레이어가 지도보다 UI 설명을 읽어야 한다. | P0 | 02_WORLD_ART |

## DAY0_REBELLION_LATE_COMPARISON

| State | 실제 화면 상태 | screenshot |
| --- | --- | --- |
| Day0 | tick 0, active conflict 없음, faction controller 없음, global world view. project marker는 지도에 보이지만 결정 panel의 project status와 일관되지 않게 `진행 중`으로 보이는 baseline marker가 있다. | `deployed-day0-desktop-1440x900.png` |
| Rebellion Day30 | tick 30, active conflict `반란`, industrial focus, red current-event card와 conflict marker. | `deployed-day30-rebellion-1440x900.png` |
| Rebellion Day90 | tick 90, active conflict `반란`, faction controller marker 8개, red boundary segment. | `deployed-day90-rebellion-controller-1440x900.png` |
| Project implementing / completed | Day91에 `왕실 배급망`을 실제 실행해 implementing, Day92에 completed로 전환. map landmark는 유지되지만 상태 변화의 silhouette 대비가 약하다. | `deployed-day91-project-implementing-1440x900.png`, `deployed-day92-project-completed-1440x900.png` |
| Late Day1082 | active conflict `반란` + `쿠데타`, faction controller marker 12개, Karsen frontier auto-focus. global view에서는 red outer boundary와 flag cluster가 남는다. | `deployed-day1082-late-state-1440x900.png`, `deployed-day1082-late-state-global-1440x900.png` |

| 비교 항목 | 판정 | 근거 / exact component·screen | 플레이어 consequence | 심각도 | recommended owner |
| --- | --- | --- | --- | --- | --- |
| Day0 → rebellion | **PARTIAL** | Day0 대비 Day30/90에 red marker·boundary·event treatment가 추가된다. 그러나 Day90의 8개 marker가 하나의 occupied political area/front로 합쳐지지 않고, camera도 global에서 industrial focus로 바뀐다. | 위기는 감지하지만 어느 지역이 실제로 변했는지와 전선의 방향을 안정적으로 비교하기 어렵다. | P1 | 01_MAP_RUNTIME |
| Day0 → project completed | **FAIL** | `deployed-day91-project-implementing-1440x900.png`와 `deployed-day92-project-completed-1440x900.png`의 project landmark 차이가 작고, decision panel의 lifecycle과 map marker presentation이 완전히 같은 의미로 읽히지 않는다. | 국가 사업을 선택한 결과가 세계에 축적된다는 핵심 loop가 시각적으로 보상되지 않는다. | P1 | INTEGRATION |
| Day0 → late state | **PARTIAL** | Day1082에는 반란+쿠데타와 red boundary/flag가 남아 정치적 변화는 보인다. 다만 auto-focus가 Karsen frontier로 이동한 뒤 global을 수동 복귀해야 Day0와 비교 가능하고, 지형 자체는 거의 같은 primitive board다. | late world가 “다른 정치 세계”라기보다 같은 board 위 marker 증가로 보인다. | P1 | 01_MAP_RUNTIME |
| Text-free political world comparison | **FAIL** | label OFF Day0/Day90에서도 event/status text가 시선을 보조하며, map-only silhouette가 capital/industrial/port/frontier/rebellion을 완전히 분리하지 못한다. | 카드와 label을 읽지 않으면 정치 상태 변화의 의미를 재구성하기 어렵다. | P0 | 02_WORLD_ART |

## ANTI_ADMIN_PAGE

| 항목 | 판정 | 근거 / exact component·screen | 플레이어 consequence | 심각도 | recommended owner |
| --- | --- | --- | --- | --- | --- |
| Rectangular card dominance | **FAIL** | `deployed-day0-desktop-1440x900.png`, `deployed-mobile-default-390x844.png`; metric tiles, playback block, `현재 사건`, `현재 압력`, bottom tabs가 map frame보다 강한 직사각형 리듬을 만든다. | 플레이어가 세계를 관찰하기보다 국가 관리 화면을 탐색하는 인상을 받는다. | P0 | INTEGRATION |
| Metric wall | **PARTIAL** | Desktop은 국고/정통성/국가역량/불안/국가 존속 5개 상태 tile, mobile은 3개 tile과 진행 row를 동시에 노출한다. | 수치는 간결하지만 첫 시선이 spatial decision보다 status reading으로 고정된다. | P1 | INTEGRATION |
| Form-like controls | **PARTIAL** | `재생`, `1x/2x/3x`, `+1일/+7일/+30일`, checkbox, map `−/+`가 표준 form control처럼 배치된다. | 시간을 세계 안에서 흐르게 하기보다 toolbar를 조작하는 느낌이 강하다. | P1 | INTEGRATION |
| Debug vocabulary | **PASS** | public body text에서 `fixture.`, `PREREQUISITE_NOT_MET`, `privateAllowed`, `debug`가 보이지 않았다. | 내부 구현 용어 때문에 몰입이 깨지는 문제는 이번 화면에서 발견하지 않았다. | — | INTEGRATION |
| Raw TMI | **PASS** | 현재 사건·지도 사실·결정 drawer가 사용자용 한국어로 정리되어 있으며 raw payload dump는 보이지 않았다. | 정보량은 많지만 내부 데이터 dump가 직접 노출되지는 않는다. | — | INTEGRATION |
| Overall anti-admin posture | **PARTIAL** | world canvas와 qualitative facts는 실제로 존재하지만 상단 shell, red event card, pressure card, drawer가 map hierarchy를 압도한다. | 제품의 방향은 전략 지도지만 첫 경험은 행정 dashboard에 가깝다. | P0 | INTEGRATION |

## REFERENCE_RUBRIC

| Reference lens | 판정 | 근거 / exact component·screen | 플레이어 consequence | 심각도 | recommended owner |
| --- | --- | --- | --- | --- | --- |
| Plague / Rebel Inc: persistent living map | **PARTIAL** | Day0→Day90→Day1082에서 red conflict marks와 boundary가 지속되며 state가 map에 남는다. 그러나 terrain/landmark는 거의 고정이고 late auto-focus가 비교를 끊는다. | 위기 지속성은 느끼지만 “살아 움직이는 지역”보다 marker가 누적되는 화면으로 느껴진다. | P1 | 01_MAP_RUNTIME |
| Civilization / RTK: geography before hex topology | **FAIL** | `deployed-labels-off-desktop-1440x900.png`; 개별 hex outline은 평상시 숨겨져 있으나 terrain은 평평한 board이고 ring/route/node가 지리보다 먼저 보인다. | 땅의 형태와 이동 가능성이 아니라 추상 marker 배치로 세계를 해석하게 된다. | P0 | 02_WORLD_ART |
| HOI4: territory / front / routes hierarchy | **PARTIAL** | Day90/late global에 red boundary와 route line은 존재하나 fragmented flag와 segment가 cohesive territory/front보다 먼저 보인다. | 전선의 연속성·점령 면적·route 우선순위를 빠르게 읽기 어렵다. | P1 | 01_MAP_RUNTIME |
| Against the Storm: development accumulation remains in world | **FAIL** | Day91 implementing과 Day92 completed의 project landmark 변화가 작고, 국가 사업 status와 map marker가 한눈에 같은 lifecycle로 읽히지 않는다. | 결정을 내린 결과가 지속적인 settlement/development 축적으로 느껴지지 않는다. | P1 | 02_WORLD_ART |

## P0_BLOCKERS

| ID | blocker | screenshot / evidence | exact component / screen | player consequence | severity | recommended owner | fix direction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P0-VIS-01 | World-first gaze와 mobile map share 실패 | `deployed-day0-desktop-1440x900.png`, `deployed-mobile-default-390x844.png` | `PoliticalWorldStage`의 `국가 상태 HUD` + `시간 진행` + `정치 세계 지도` layout, `.world-scene-frame` | 첫 2초와 mobile 첫 viewport에서 HUD가 world보다 먼저 읽혀 핵심 보드가 secondary surface가 된다. | P0 | INTEGRATION | 첫 viewport의 world canvas와 meaningful geography를 우선 배치하고, HUD/status를 world를 가리지 않는 compact cue로 재조합한다. |
| P0-VIS-02 | Label OFF semantic recognition 실패 | `deployed-labels-off-desktop-1440x900.png`, `deployed-labels-off-day90-rebellion-1440x900.png` | R3F map asset/silhouette layer: capital, industrial, port, frontier, rebellion | label을 끄면 장소 타입과 정치 위기를 안정적으로 구분할 수 없어 spatial planning이 불가능하다. | P0 | 02_WORLD_ART | 다섯 semantic class에 서로 다른 mass, skyline, ground cue, border cue를 부여하고 동일 scale에서 먼저 읽히게 한다. |
| P0-VIS-03 | Geography와 territory/front hierarchy 실패 | `deployed-day90-rebellion-controller-1440x900.png`, `deployed-day1082-late-state-global-1440x900.png` | `world-scene-frame`의 terrain/territory/faction controller/route layer | 반란은 반복 flag와 선분으로 보이고 점령 영역·전선·지형의 관계가 보이지 않아 late political world가 marker 증가로 축소된다. | P0 | 01_MAP_RUNTIME | faction control을 merged area 또는 outer boundary로 합치고, normal grid는 억제한 채 geography→territory→front→route 순서로 렌더 우선순위를 재정렬한다. |

## TOP_BLOCKERS

`P0-VIS-01`, `P0-VIS-02`, `P0-VIS-03`이 이번 실제 배포 화면에서 확인된 top blockers다. 이 결과는 제품 통과 선언이 아니다.

## P1_POLISH

| ID | issue | screenshot / evidence | exact component / screen | player consequence | severity | recommended owner | fix direction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P1-VIS-01 | World occupancy와 camera comparison | `deployed-day0-desktop-1440x900.png`, `deployed-day1082-late-state-global-1440x900.png` | `정치 세계 지도`, global/region focus camera | meaningful world가 backdrop 안의 중앙 cluster로 축소되고 Day0/late 비교 시 framing이 달라진다. | P1 | 01_MAP_RUNTIME | desktop meaningful occupancy를 넓히고 late 비교용 stable global framing과 player theater framing을 분리한다. |
| P1-VIS-02 | Mobile touch target, overflow, drawer | `deployed-mobile-default-390x844.png`, `deployed-mobile-selected-drawer-390x844.png` | mobile map controls, `지역 상세`, bottom tabs | 24.8px map control과 8px horizontal overflow가 조작 여유를 줄이고 drawer가 canvas 대부분을 가린다. | P1 | INTEGRATION | 핵심 map action을 최소 44px 수준으로 통일하고, drawer를 bottom sheet/peek 상태로 조정해 선택 후 주변 world context를 남긴다. |
| P1-VIS-03 | Card shell가 world보다 강함 | `deployed-day0-desktop-1440x900.png`, `deployed-mobile-default-390x844.png`, `deployed-late-decision-drawer-1440x900.png` | HUD, `현재 사건`, `현재 압력`, `결정 테이블` | admin dashboard와 strategy world의 identity가 충돌한다. | P1 | INTEGRATION | card surface 수를 줄이고 map에 붙는 상태 cue를 짧게 유지하며 exact detail은 on-demand로 이동한다. |
| P1-VIS-04 | Project lifecycle의 map/UI presentation 불일치 | `deployed-day91-project-implementing-1440x900.png`, `deployed-day92-project-completed-1440x900.png` + Day90 decision drawer DOM | `PoliticalWorldStage` project markers와 `결정 테이블`의 `국가 사업` | panel에서는 미착수/구현 중/완료가 구분되지만 map marker는 baseline `진행 중`을 함께 보여 state meaning이 흔들린다. | P1 | INTEGRATION | project state를 하나의 lifecycle source로 연결하고 implementing/completed를 landmark의 형태·빛·배치 변화로 지속 투영한다. |
| P1-VIS-05 | POI/route/label channel collision | `deployed-day90-rebellion-controller-1440x900.png`, `deployed-labels-off-day90-selected-region-1440x900.png` | R3F POI marker, route line, faction flag, label LOD | route와 POI가 작은 node/ring/line으로 경쟁해 landmark hierarchy가 무너진다. | P1 | 03_ICON_SYSTEM | POI silhouette를 키우고 route/label opacity와 collision LOD를 조정해 object가 label보다 먼저 읽히게 한다. |
| P1-VIS-06 | Rebellion/late state visual delta가 marker 중심 | `deployed-day30-rebellion-1440x900.png`, `deployed-day1082-late-state-global-1440x900.png` | conflict overlay, faction controller, territory layer | 국가의 정치 질서가 바뀌었다는 감각보다 red marker 수가 늘었다는 감각이 앞선다. | P1 | 01_MAP_RUNTIME | conflict state를 area, boundary, route disruption, landmark damage/occupation 등 여러 spatial channel에 지속 투영한다. |

## OWNER_ASSIGNMENT

아래 owner별 배정은 위 blocker와 polish를 실제 재검토 가능한 acceptance 항목으로 묶은 것이다.

## OWNER_ASSIGNMENTS

| Owner | 배정 |
| --- | --- |
| `01_MAP_RUNTIME` | mobile default player-country + border camera, desktop/mobile world occupancy, stable Day0/late framing, merged faction territory/front, route hierarchy, conflict spatial delta, map control hit target |
| `02_WORLD_ART` | capital/industrial/port/frontier/settlement/prop silhouette hierarchy, geography-first terrain, rebellion visual grammar, project implementing/completed accumulation landmark |
| `03_ICON_SYSTEM` | POI versus route versus faction icon hierarchy, label collision/LOD, marker scale and contrast, labels-off recognition support |
| `04_AUDIO_SYSTEM` | 이번 화면 QA에서 직접 확인된 visual blocker 없음. 소리 toggle UI는 존재하지만 audio mix/feedback 품질은 이 task의 visual evidence 범위에 포함하지 않음. |
| `INTEGRATION` | HUD/map composition, anti-admin surface, event/pressure card obstruction, mobile drawer behavior, project lifecycle synchronization, overflow and responsive layout |

## INTEGRATION_ACCEPTANCE_CHECKLIST

다음 재검토에서 같은 public workflow로 아래 항목을 다시 확인한다.

- [ ] Desktop meaningful world occupancy: width ≥75%, height ≥55%.
- [ ] Mobile meaningful world occupancy: width ≥88%, stage height ≥45%, first viewport world share ≥60%.
- [ ] Mobile default view shows player country and border context, not only a generic world or region focus.
- [ ] Persistent mobile status cues are no more than three before the player chooses a detail surface.
- [ ] Normal state has no individual hex outline; rebellion shows grid/outline only for selected or target context.
- [ ] Faction control reads as a merged area or outer boundary, not a repeated flag/cell set.
- [ ] Ideology ring/token treatment does not dominate terrain or political territory.
- [ ] Continuous geography reads before grid, route, or decorative marker.
- [ ] POI object reads before its label; capital > major landmark > POI > settlement > prop remains stable at the tested zooms.
- [ ] Label OFF map-only view distinguishes capital, industrial region, port, frontier, and rebellion.
- [ ] Day0, rebellion, project completed, and late state retain a comparable global frame and show spatial change without relying on prose cards.
- [ ] Project panel lifecycle and map marker lifecycle are identical for not started, implementing, and completed.
- [ ] Implementing and completed projects leave a durable, legible world trace.
- [ ] Mobile map controls meet the chosen touch target standard and 390px view has no horizontal overflow.
- [ ] Detail drawer preserves enough map context to compare the selected region with surrounding world.
- [ ] No raw debug vocabulary or payload dump appears in the player surface.

## SCREENSHOT_PATHS

All evidence is under `docs/parallel/evidence/06/`.

1. `docs/parallel/evidence/06/deployed-day0-desktop-1440x900.png`
2. `docs/parallel/evidence/06/deployed-labels-off-desktop-1440x900.png`
3. `docs/parallel/evidence/06/deployed-day30-rebellion-1440x900.png`
4. `docs/parallel/evidence/06/deployed-day90-rebellion-controller-1440x900.png`
5. `docs/parallel/evidence/06/deployed-labels-off-day90-rebellion-1440x900.png`
6. `docs/parallel/evidence/06/deployed-labels-off-day90-selected-region-1440x900.png`
7. `docs/parallel/evidence/06/deployed-day91-project-implementing-1440x900.png`
8. `docs/parallel/evidence/06/deployed-day92-project-completed-1440x900.png`
9. `docs/parallel/evidence/06/deployed-day1082-late-state-1440x900.png`
10. `docs/parallel/evidence/06/deployed-day1082-late-state-global-1440x900.png`
11. `docs/parallel/evidence/06/deployed-mobile-default-390x844.png`
12. `docs/parallel/evidence/06/deployed-mobile-selected-drawer-390x844.png`
13. `docs/parallel/evidence/06/deployed-late-decision-drawer-1440x900.png`

## NOT_DECLARED

`P0_PRODUCT_PASS`, `Gate1F`, `V02`는 이 작업에서 선언하지 않는다.
