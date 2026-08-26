# 06 Integration Visual QA Protocol

이 문서는 `01_MAP_RUNTIME`, `02_WORLD_ART`, `03_ICON_SYSTEM`,
`INTEGRATION` 구현 branch를 같은 방법으로 검토하기 위한 rolling reviewer
계약이다. 목표는 stage/container metadata를 player가 실제로 읽는 world로
오인하지 않는 것이다.

적용 대상은 실제 실행 화면이다. source inspection, DOM metadata, inspector
텍스트는 화면 판정의 보조 근거일 뿐이며, Canvas/WebGL 안의 플레이어 시각
정보를 대신할 수 없다.

## 0. 고정 원칙

- 비교는 같은 seed, 같은 viewport CSS pixel, 같은 label mode, 같은 camera
  preset, 같은 tick/date에서 baseline과 target을 side-by-side로 수행한다.
- browser는 페이지 최상단(`scrollY = 0`), zoom 100%, device emulation만
  사용한다. browser chrome은 측정 영역에 포함하지 않는다.
- 모든 좌표는 browser visual viewport 기준 CSS pixel이다. `devicePixelRatio`와
  visual viewport 값도 결과에 함께 기록한다.
- state를 바꿀 때는 실제 UI의 start/skip/time/decision/selection 동작만
  사용한다. React state, localStorage, DOM attribute, query 결과를 직접
  주입해 결과를 만들지 않는다.
- 매 capture마다 `beginCapture(id)`를 호출하고 terrain/meaningful annotation을
  다시 한다. 이전 상태의 annotation이나 count를 재사용하지 않는다.
- overlay는 측정 중에만 잠깐 DOM에 추가된다. screenshot은 overlay를 제거한
  뒤 촬영한다. helper는 application state와 production source를 수정하지
  않는다.
- `PASS`는 직접 screenshot/화면 측정이 있는 경우에만 사용한다.
  `NOT_MEASURED` 값을 PASS로 승격하지 않는다.

## 1. Occupancy 의미와 계산 경계

세 metric은 이름, source, denominator를 고정한다. 한 metric의 수치를 다른
metric의 evidence로 복사하지 않는다.

| Metric | 정확한 의미 | 기본 source | denominator / 계산 | 금지되는 해석 |
|---|---|---|---|---|
| `STAGE_OCCUPANCY` | `.world-stage` 또는 동등한 container/stage가 viewport에서 차지하는 rect | DOM `getBoundingClientRect()` | viewport에 clip한 stage width/height/area 비율 | stage 안에 실제 world가 얼마나 읽히는지의 증거로 사용 |
| `TERRAIN_OCCUPANCY` | player-visible terrain polygon/ground의 화면상 extent. outer backdrop, HUD, card, controls 제외 | helper의 canvas-local 수동 annotation | canvas viewport에 clip한 terrain bounds의 width/height/area 비율 | terrain이 있어 보인다는 이유로 POI/정치 정보를 포함하거나 meaningful world로 이름 변경 |
| `MEANINGFUL_WORLD_OCCUPANCY` | capital, major landmark/POI, settlement, route, project, territory, conflict/front처럼 player가 읽어야 하는 content의 최소 enclosing rect | helper의 canvas-local 수동 annotation | canvas viewport에 clip한 meaningful bounds의 width/height/area 비율 | stage rect, terrain polygon, label-only text, legend, crisis card, drawer를 포함 |

`TERRAIN_OCCUPANCY`와 `MEANINGFUL_WORLD_OCCUPANCY`는 현재 helper에서
축 정렬 bounding box로 기록한다. 따라서 해당 값은 “채워진 pixel 면적”이
아니라 화면상 extent 면적이다. polygon의 실제 pixel-fill 면적을 별도로
사용할 경우 필드명을 `terrainPixelFillArea`로 새로 만들고 기존 세 metric과
혼합하지 않는다.

### 1.1 고정 공식

helper가 반환하는 `canvasViewportRect`를 `C`, browser viewport를 `V`,
stage rect를 `S`, annotation bounds를 `A`라고 한다.

```text
clip(X, Y) = X와 Y의 교집합 rect

STAGE width ratio  = width(clip(S, V)) / width(V)
STAGE height ratio = height(clip(S, V)) / height(V)
STAGE area ratio   = area(clip(S, V)) / area(V)

TERRAIN/MEANINGFUL width ratio  = width(clip(A, C)) / width(C)
TERRAIN/MEANINGFUL height ratio = height(clip(A, C)) / height(C)
TERRAIN/MEANINGFUL area ratio   = area(clip(A, C)) / area(C)
```

`actualMeaningfulWorldWidthRatio`와
`actualMeaningfulWorldHeightRatio`는 반드시 `C`를 denominator로 한다.
`data-world-content-occupancy-*`, `data-mobile-content-occupancy-*`는
`runtimeMetadata` 아래에만 기록하고 source를
`metadata-not-screen-proof`로 고정한다.

`projectedMeaningfulWorldBounds`는 annotation의 screen rect와
`clippedToCanvas` rect를 함께 기록한다. annotation이 없거나 현재 tick,
camera, label mode, capture id와 맞지 않으면 `NOT_MEASURED` 또는
`STALE_ANNOTATION`이며 ratio를 계산하지 않는다.

### 1.2 화면상 실제 world share

Mobile의 `firstViewportActualWorldShare`는 다음으로 고정한다.

```text
meaningful rect와 first viewport의 교집합 면적
- 그 영역과 drawer가 겹치는 면적
------------------------------------------------
first viewport 전체 면적
```

즉 stage 높이, terrain extent, canvas 높이는 mobile world share가 아니다.
drawer가 닫혀 있으면 drawer 공제값은 0이다. 결과에는 raw meaningful area,
drawer occluded area, 최종 visible area를 모두 남긴다.

## 2. 반복 측정 helper

standalone helper는
[`tools/visualQa/measure-world.js`](../../tools/visualQa/measure-world.js)이다.
기존 browser dependency와 무관한 plain JavaScript이며 production source를
import하지 않는다.

### 2.1 browser console 실행 절차

실행 중인 target URL에서 DevTools Console에 파일 내용을 붙여 넣는다.
이 단계는 앱 state를 바꾸지 않는다.

```js
// helper 설치 후
__tmrVisualQa.measure();

// 매 screenshot state의 첫 명령
__tmrVisualQa.beginCapture("desktop-day0-labels-on", {
  notes: "fresh run / day 0 / labels on",
  screenshotPath: "docs/parallel/evidence/06-integration/desktop-day0-labels-on.png",
});

// canvas 위 드래그: terrain extent, meaningful world extent
await __tmrVisualQa.select("terrain");
await __tmrVisualQa.select("meaningful");

// screenshot을 보고 metadata를 보지 않은 상태에서 count 입력
__tmrVisualQa.setVisualCounts(
  {
    labelCount: 0,
    visiblePoiCount: 0,
    factionSurfaceCount: 0,
    frontCount: 0,
    routeCount: 0,
  },
  {
    evidencePath: "docs/parallel/evidence/06-integration/desktop-day0-labels-on.png",
    note: "counted from screenshot after overlay removal",
  },
);

const measurement = __tmrVisualQa.measure();
copy(JSON.stringify(measurement, null, 2));
```

`select("terrain")`과 `select("meaningful")`는 canvas viewport 안에서
smallest enclosing rectangle을 드래그하고 overlay를 자동 제거한다. 좌표를
직접 알고 있을 때는 다음처럼 canvas-local CSS pixel을 쓴다.

```js
__tmrVisualQa.annotate("terrain", { x: 42, y: 18, width: 1280, height: 590 });
__tmrVisualQa.annotate("meaningful", { x: 180, y: 92, width: 940, height: 410 });
```

annotation 직후 `measure()`를 호출하고, screenshot은 annotation overlay가
사라진 뒤 촬영한다. count는 screenshot을 먼저 보고 입력한다. Canvas/WebGL
픽셀을 DOM selector count로 대체하지 않는다.

primary action이 표준 selector로 잡히지 않으면 실제 button을 임시 표기한다.
이 표기는 helper destroy 또는 페이지 reload 때 사라진다.

```js
__tmrVisualQa.markPrimaryAction(document.querySelector("button.some-action"));
```

### 2.2 helper 출력에서 반드시 읽는 필드

- `canvasViewportRect`: 실제 map canvas host rect. 가능하면
  `.world-scene-viewport`를 우선한다.
- `projectedMeaningfulWorldBounds`: manual screen/local/clipped bounds.
- `occupancy.STAGE_OCCUPANCY`:
  `source = DOM stage/container rect`.
- `occupancy.TERRAIN_OCCUPANCY`와
  `occupancy.MEANINGFUL_WORLD_OCCUPANCY`:
  `source = manual-canvas-annotation`.
- `desktop.*`: 1440×900 capture용 고정 필드.
- `mobile.*`: 390×844 capture용 고정 필드.
- `screenInventory.*`: screenshot-blind manual count, DOM probe, metadata를
  서로 다른 property로 반환한다.
- `runtimeMetadata`: 화면의 증거가 아닌 stage/runtime metadata.
- `warnings`: `NOT_MEASURED`, stale annotation, overflow를 포함한 경고.

`screenInventory.*.value`가 null이면 해당 count는 `NOT_MEASURED`이다.
`screenInventory.*.metadata.value`를 actual count로 복사하지 않는다.

## 3. 고정 측정 항목

### 3.1 Desktop 1440×900

viewport를 정확히 `1440×900`으로 고정하고 다음을 한 row로 기록한다.

| Field | 측정법 | 판정 경계 |
|---|---|---|
| `canvasViewportRect` | 실제 map viewport rect의 left/top/width/height | `.world-scene-viewport`가 없으면 사용한 fallback selector를 기록. stage rect로 대체하지 않음 |
| `projectedMeaningfulWorldBounds` | screenshot에서 world content만 box annotation | HUD, header, crisis card, legend, drawer, label-only text 제외 |
| `actualMeaningfulWorldWidthRatio` | `width(meaningful ∩ canvas) / canvas width` | `MEANINGFUL_WORLD_OCCUPANCY`만 사용. stage/terrain metadata 사용 금지 |
| `actualMeaningfulWorldHeightRatio` | `height(meaningful ∩ canvas) / canvas height` | 동일 |
| `hudHeaderOccupiedHeight` | canvas top Y와 viewport top의 차이. header/metric/time component rect도 진단용으로 기록 | component rect를 합산하지 않음. nested `.metric-strip`/`.time-controls` 중복 금지 |
| `documentVerticalOverflow` | `max(scrollHeight) - clientHeight` | `0px` PASS; 양수면 exact px와 screen 기록 |
| `horizontalOverflow` | `max(scrollWidth) - clientWidth` | `0px` PASS; 양수면 FAIL 후보 |
| `labelCount` | screenshot에서 보이는 map label을 blind count | DOM `data-map-label-count`는 metadata 보조값일 뿐 |
| `visiblePoiCount` | canvas screenshot에서 실제 보이는 POI object를 count | data inventory/hidden details는 count하지 않음 |
| `factionSurfaceCount` | screenshot에서 서로 분리되어 읽히는 merged faction surface를 count | `data-map-faction-surface-count` 단독으로 PASS 불가 |
| `frontCount` | screenshot에서 active front line/band를 count | peace border, selection outline, route를 front로 세지 않음 |

제품 기준으로 별도 threshold가 정해지지 않은 future target에서는
`meaningful width ≥ 0.75`, `meaningful height ≥ 0.55`를 desktop review
reference로 사용한다. 이는 `STAGE_OCCUPANCY`나 `TERRAIN_OCCUPANCY`에
적용하지 않는다.

### 3.2 Mobile 390×844

portrait viewport를 정확히 `390×844`로 고정하고, browser page를 scroll top에
둔다.

| Field | 측정법 | 판정 경계 |
|---|---|---|
| `canvasTopY` | canvas viewport rect의 top | stage top이나 screen section top으로 대체하지 않음 |
| `canvasHeight / viewportHeight` | raw canvas CSS height ÷ 844, visible clipped height도 함께 기록 | stage height와 혼용 금지 |
| `firstViewportActualWorldShare` | drawer occlusion을 공제한 meaningful visible area ÷ 390×844 area | `MEANINGFUL_WORLD_OCCUPANCY` annotation 없으면 `NOT_MEASURED` |
| `HUD/header/timeControlsCumulativeHeight` | canvas top Y를 viewport top에서부터 측정 | nested component 합산 금지 |
| `smallestMapControlHitTarget` | 보이는 map-control button 중 `min(width,height)` 최솟값 | fixed floor `44px`; selector miss는 `NOT_MEASURED` |
| `smallestPrimaryActionHitTarget` | 보이는 primary action button 중 최솟값 | fixed floor `44px`; 실제 action이 없는 state는 `NOT_MEASURED` |
| `horizontalOverflow` | desktop과 동일한 document overflow | `0px` PASS |
| `drawerObstructionRatio` | visible drawer와 canvas viewport의 union intersection area ÷ canvas area | underlying WebGL이 보여도 drawer가 덮으면 obstruction |

`firstViewportActualWorldShare ≥ 0.60`을 mobile world-share reference로
사용한다. stage가 `0.60` 이상이어도 canvas 또는 meaningful world가 그보다
작으면 PASS가 아니다.

## 4. 고정 screenshot matrix

모든 capture는 baseline과 target에 같은 ID를 쓰고, screenshot path에 viewport와
label mode를 포함한다. tick/date, camera preset, URL, commit SHA, viewport,
측정 JSON capture id를 결과에 같이 남긴다.

### 4.1 Desktop

| Capture ID | State | Label mode | 실제 실행 조건 | 권장 evidence filename |
|---|---|---|---|---|
| `desktop-day0-labels-on` | Day0 default | ON | fresh run 후 opening/briefing을 실제 UI로 종료 | `desktop-day0-labels-on.png` |
| `desktop-day0-labels-off` | Day0 default | OFF | fresh run + `?mapLabels=0` 또는 제품의 실제 label toggle | `desktop-day0-labels-off.png` |
| `desktop-day90-rebellion` | Day90 rebellion | ON | 실제 time control로 target tick까지 진행하고 rebellion 확인 | `desktop-day90-rebellion.png` |
| `desktop-day90-rebellion-labels-off` | Day90 rebellion | OFF | 같은 seed/run contract로 label OFF 상태 재현 | `desktop-day90-rebellion-labels-off.png` |
| `desktop-project-implementing` | project implementing | ON | 실제 decision/action을 승인한 직후 status가 implementing인 frame | `desktop-project-implementing.png` |
| `desktop-project-completed` | project completed | ON | 실제 lifecycle 완료 후 status가 completed인 frame | `desktop-project-completed.png` |
| `desktop-late-global` | late global | ON | 같은 run을 late state까지 실제 진행 후 `전체 보기`/동등 preset | `desktop-late-global.png` |

Day90, project completed, late global은 임의 tick injection으로 만들지
않는다. target이 해당 state에 도달하지 못하면 그 capture는 `NOT_RUN`이며
다른 state screenshot으로 PASS를 대체하지 않는다.

### 4.2 Mobile 390×844

| Capture ID | State | 실제 조작 | 권장 evidence filename |
|---|---|---|---|
| `mobile-day0-default` | Day0 default | fresh run, default camera | `mobile-day0-default.png` |
| `mobile-selected-region` | selected Region | map에서 Region을 실제 tap/click | `mobile-selected-region.png` |
| `mobile-rebellion` | rebellion | 실제 Day90 rebellion 재현 | `mobile-rebellion.png` |
| `mobile-decision-drawer` | decision drawer | decisions tab 또는 동등 실제 control을 열기 | `mobile-decision-drawer.png` |

Mobile screenshot은 drawer open/closed 상태를 혼동하지 않는다. drawer가
world를 가리면 obstruction ratio와 screenshot을 같은 상태에서 측정한다.

## 5. 표준 capture 순서

각 matrix row에 대해 다음 순서를 반복한다.

1. target/baseline의 exact commit/source를 기록하고, 같은 seed로 fresh load한다.
2. viewport를 1440×900 또는 390×844로 설정하고 `scrollTo(0, 0)` 한다.
3. 실제 UI를 통해 capture state에 도달한다. tick/date와 camera preset을 기록한다.
4. helper를 붙여 넣고 `beginCapture(captureId, { screenshotPath })`를 호출한다.
5. terrain과 meaningful world를 canvas 위에 각각 annotation한다.
6. overlay를 제거하고 screenshot을 저장한다. screenshot에는 DevTools,
   helper 안내문, annotation box가 없어야 한다.
7. labels OFF row에서는 map crop만 보고 labels/metadata/inspector 없이
   `screenInventory` count와 blind recognition rubric을 작성한다.
8. screenshot count를 `setVisualCounts()`로 넣고 `measure()` JSON을 저장한다.
9. baseline/target screenshot을 동일한 crop과 동일한 scale로 side-by-side
   배치하고 판정을 작성한다.
10. 각 `FAIL`은 아래 issue record를 채운다. `PARTIAL`도 어떤 조건이
    닫히지 않았는지 exact screen에 남긴다.

## 6. Labels-off recognition blind rubric

판정자는 map crop만 본다. label, legend, crisis text, selected inspector,
DOM metadata, data summary는 가리고, 먼저 3초 이내에 아래 semantic class를
지목한다. 색상 하나만으로 맞힌 답은 PASS로 세지 않는다.

| Class | 텍스트 없이 보여야 하는 독립 cue | PASS 기준 | PARTIAL / FAIL |
|---|---|---|---|
| `CAPITAL` | 다른 settlement보다 큰 civic/core mass, palace/seat/citadel/central skyline, 주변 route·political focus | 두 개 이상의 독립 cue가 결합되어 국가의 중심으로 즉시 지목됨 | 큰 일반 block 하나만 보임 = PARTIAL; generic settlement와 구분 불가 = FAIL |
| `INDUSTRIAL` | factory/smokestack/yard/production material, worker/transport cluster, resource·route 결합 | 생산 시설이라는 silhouette와 ground context가 함께 읽힘 | 색/크기만 다름 = PARTIAL; settlement/POI와 구분 불가 = FAIL |
| `PORT` | water edge/coast, quay/dock/ships/harbor geometry, trade route node | 물가와 항구 구조가 동시에 읽힘 | route node만 보임 = PARTIAL; water/shore cue 없음 = FAIL |
| `FRONTIER` | outer edge/low density, fort/gate/watchtower/pass, rough terrain 또는 active border context | 나라의 끝과 방어/통과 지점이라는 spatial role이 즉시 읽힘 | outer edge만 있음 = PARTIAL; generic settlement/blank edge = FAIL |
| `REBELLION` | contiguous faction/contested area, changed controller surface, active front/pressure edge, expansion/retreat direction | 반복 flag 없이 area + front + political disturbance가 동시에 읽힘 | area 또는 front 하나만 읽힘 = PARTIAL; repeated flags/card/event text 의존 = FAIL |

blind 결과에는 `answer`, `time-to-recognition`, `independent-cues`,
`screenshot-path`를 남긴다. answer가 틀리거나 reviewer가 label을 다시 켜야
하면 FAIL이다.

## 7. World-first / 2-second gaze

고정 순서는 다음과 같다.

```text
WORLD  >  crisis/context  >  HUD/detail
```

### PASS

- 첫 2초의 primary fixation이 meaningful world surface와 political
  geography에 있다.
- crisis/context는 world를 설명하는 두 번째 cue로 보인다.
- header, metric wall, time controls, detail card가 첫 시선의 main anchor가
  아니다.
- 첫 viewport에서 player country, major landmark/route, active pressure 중
  하나 이상을 map-only로 위치시킬 수 있다.

### PARTIAL

- world는 보이지만 HUD/time row와 동등하게 경쟁하거나, meaningful content가
  중앙의 작은 cluster로만 남는다.

### FAIL

- 첫 시선이 status card, metric strip, timer, drawer, form-like panel로
  고정된다.
- map backdrop은 넓지만 meaningful world가 첫 viewport에서 읽히지 않는다.

실행 방법은 각 default capture에서 reviewer가 screenshot을 가린 상태로
2초 stopwatch gaze를 한 번 수행하고, 첫 세 fixation을
`WORLD / crisis-context / HUD-detail`로 기록하는 것이다. DOM stage rect나
occupancy metadata가 이 순서를 대신하지 않는다.

## 8. Legal owner / physical controller / active front

세 채널은 한 색, 한 선, 한 flag repetition으로 합치지 않는다.

| Channel | 의미 | 기대되는 visual channel |
|---|---|---|
| `legal owner` | 국가/Region의 법적·역사적 소유 | 낮은 우선순위의 country tint, boundary, owner legend/label |
| `physical controller` | 현재 `LandHex.controller`가 가리키는 물리 통제 | merged territory fill/perimeter, occupation texture, controller mark |
| `active front` | 서로 다른 physical controller와 active armed conflict에서 파생되는 현재 전선 | 강한 linear boundary/band, active contrast, 진행 방향 또는 접촉 edge |

### PASS

map-only screenshot에서 5초 안에 다음 세 질문에 각각 답할 수 있다.

1. 누가 법적으로 소유하는가?
2. 누가 현재 물리적으로 통제하는가?
3. 실제 active front는 어디인가?

답을 만들기 위해 동일한 색/선/flag를 세 번 재해석하지 않아야 한다.
selected Region inspector는 의미를 교차 검증하는 보조 evidence이며 map-only
판정을 대체하지 않는다.

### PARTIAL

세 채널 중 하나가 legend/inspector를 봐야만 구분되거나, merged area와
front는 보이지만 owner와 controller 대비가 약하다.

### FAIL

legal owner fill, physical controller area, active front가 같은 색면/선으로
겹치거나, rebellion이 repeated faction flags와 event card로만 표시된다.

최소 검토 frame은 `desktop-day0-labels-off`,
`desktop-day90-rebellion-labels-off`, `mobile-rebellion`이다.

## 9. Silhouette hierarchy와 map density

### 9.1 Silhouette hierarchy

실제 screenshot에서 다음 순서가 유지되는지 2초 gaze 후 기록한다.

```text
capital > major landmark > POI > settlement > decorative prop
```

capital은 가장 큰 generic block이 아니라 독자적인 civic/core silhouette여야
한다. major landmark는 capital과 겹치지 않는 두 번째 landmark tier여야 한다.
POI/settlement가 route node·label보다 먼저 읽혀야 하며 decorative prop이
정치적 signal을 가리면 FAIL 후보이다.

### 9.2 Density 기록

각 screenshot에 다음을 한 줄로 기록한다.

```text
canvas rect / stage rect /
meaningful width×height×area /
terrain width×height×area /
empty backdrop qualitative note /
label count / POI count / route count /
faction surface count / front count
```

`empty backdrop`은 terrain bounding-box의 1-complement로 산출하지 않는다.
그 값은 box 내부의 빈 pixel을 포함할 수 있으므로 screenshot reviewer의
qualitative note로만 기록한다. stage 또는 terrain extent가 넓다는 이유로
POI density가 높다고 기록하지 않는다.

## 10. Day0 → rebellion → late / project spatial change

세 transition은 text 없이도 다른 정치적 세계로 보여야 한다.

| Transition | PASS evidence |
|---|---|
| Day0 → rebellion | connected controller/faction area, active front/pressure edge, changed local silhouette가 생기고 repeated flags만 늘지 않음 |
| Day0 → project completed | project landmark가 implementing/completed에 따라 world에 남거나 변하며, 단순 progress text만 바뀌지 않음 |
| Day0 → late global | territorial/control/front/route/project accumulation이 world에 남고, camera zoom-out에서도 geography와 political hierarchy가 유지됨 |

각 transition은 같은 screen crop, 같은 camera preset 계열, 같은 label mode로
비교한다. text-only event card 또는 metric value 변화만 있으면 FAIL이다.

## 11. PASS / PARTIAL / FAIL 및 issue record

| 판정 | 뜻 |
|---|---|
| `PASS` | 해당 기준을 실제 screenshot과 helper 측정이 직접 충족 |
| `PARTIAL` | 일부 signal/viewport/state는 충족하지만 기준 하나가 닫히지 않음 |
| `FAIL` | player가 기준을 읽지 못하거나 측정 source가 screen truth가 아님 |
| `NOT_RUN` | state를 실제로 재현하지 못함. PASS/FAIL로 변환하지 않음 |
| `NOT_MEASURED` | required annotation/count가 없음. metric을 추정하지 않음 |

모든 FAIL은 다음 record를 갖는다.

```text
ID / 판정 / severity(P0|P1|P2)
screenshot 또는 evidence path
exact component/screen/state
player consequence
recommended owner:
  01_MAP_RUNTIME | 02_WORLD_ART | 03_ICON_SYSTEM | 04_AUDIO_SYSTEM | INTEGRATION
baseline observation
target observation
reproduction/capture id
```

P0는 world-first, labels-off recognition, meaningful world share, territory/
front hierarchy처럼 player가 기본 board를 읽지 못하게 하는 문제다. P1은
상위 readability/contrast/density를 깎지만 core state를 일부 읽을 수 있는
문제다. P2는 non-blocking polish다. severity는 screenshot consequence로
정하며 metadata 수치만으로 올리지 않는다.

## 12. Evidence path와 side-by-side 규칙

권장 root는 `docs/parallel/evidence/06-integration/`이며 파일명은 다음처럼
고정한다.

```text
<capture-id>-<baseline|target>.png
compare-<capture-id>-baseline-target.png
```

각 comparison에는 다음 caption을 붙인다.

```text
SHA / source URL / viewport / DPR / tick / date / camera preset /
labels / drawer state / measurement capture id
```

baseline과 target은 동일한 pixel dimensions로 배치한다. browser chrome,
DevTools, helper overlay, raw metadata disclosure가 들어간 이미지는 visual
evidence로 사용하지 않는다. 필요하면 raw measurement JSON은 report의
code block에 붙이되, screenshot 판정을 대신하지 않는다.

## 13. Reviewer acceptance checklist

- [ ] `STAGE_OCCUPANCY`, `TERRAIN_OCCUPANCY`, `MEANINGFUL_WORLD_OCCUPANCY`가
      separate rows/source/denominator로 기록되었다.
- [ ] Desktop 1440×900의 12개 고정 field가 있다.
- [ ] Mobile 390×844의 9개 고정 field가 있다.
- [ ] screenshot matrix 7 desktop + 4 mobile가 같은 capture ID로 비교되었다.
- [ ] labels-off five-class blind rubric을 metadata 없이 수행했다.
- [ ] 2-second gaze order가 `WORLD > crisis/context > HUD/detail`인지 기록했다.
- [ ] legal owner / physical controller / active front가 독립 channel인지
      Day90 labels-off에서 기록했다.
- [ ] faction surface와 front는 screenshot count와 runtime metadata를
      분리했다.
- [ ] mobile `firstViewportActualWorldShare`가 stage height가 아닌
      meaningful visible area로 계산되었다.
- [ ] overflow, hit target, drawer obstruction, player-theater framing을
      같은 viewport에서 기록했다.
- [ ] 모든 FAIL에 screenshot, exact component/screen, consequence, severity,
      owner가 있다.

이 protocol은 visual QA 결과를 선언하는 문서가 아니다. 각 구현 branch의
실행 screenshot과 측정 JSON을 이 계약에 대입한 뒤에만 개별 QA report의
판정을 작성한다.
