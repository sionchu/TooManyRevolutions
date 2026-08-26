# 06 Map Runtime FIX1 Protocol QA

## REVIEW_SCOPE

- 역할: VISUAL DIRECTOR + UX QA + PRODUCT QC
- 실행 authority: `docs/parallel/tasks/06_MAP_RUNTIME_FIX1_PROTOCOL_QA.md`
- 적용 protocol: `docs/parallel/06_INTEGRATION_QA_PROTOCOL.md`
- production source 수정: 없음
- production deploy: 없음
- 비교 target: `parallel-p0-map-runtime@18d2f297c25dd27cfd05ea5c37e5d10f71f689e0`
- review target: `parallel-p0-map-runtime@7b2f5bd2c65f61a302bbc096f1afe2757b9bcd4a`

## SOURCE_AND_EXECUTION

| Field | Value |
| --- | --- |
| `QA_BRANCH` | `parallel-p0-visual-qa-v2` |
| `QA_BASE_SHA` | `1cb492e4fdb20aa8dd16ae593ce39df741d585e5` |
| `REVIEW_TARGET_BRANCH` | `parallel-p0-map-runtime` |
| `REVIEW_TARGET_SHA` | `7b2f5bd2c65f61a302bbc096f1afe2757b9bcd4a` |
| `PREVIOUS_RUNTIME_COMPARISON_SHA` | `18d2f297c25dd27cfd05ea5c37e5d10f71f689e0` |
| `DEPLOYED_SOURCE_IF_KNOWN` | target: **NOT_DEPLOYED**; frozen public baseline used in the prior rolling report: `271eb18b9d713c3d639091b35aa65c2c0d780b69` |
| `TARGET_WORKTREE` | `C:\Temp\TooManyRevolutions-map-runtime-fix1-qa-clean-20260826` |
| `LOCAL_URL` | `http://127.0.0.1:5181/` |
| `browser` | actual local Vite app, CSS viewport, DPR `1`, page `scrollY=0` |

Target SHA was checked out as a detached worktree and run with its own frozen-lockfile dependency install. State changes used only visible UI actions: `새 게임 →`, `브리핑 건너뛰기`, `내 극장`, map click, mobile `보조 진행`, and `+30일` × 3. React state, localStorage, DOM attributes, and tick injection were not used to create a capture.

PNG raster sizes returned by the browser screenshot tool were `1425×891` for the CSS `1440×900` capture and `375×812` for the CSS `390×844` capture. All measurements below use the browser CSS visual viewport values, not the raster size.

## METRIC_BOUNDARY

The three occupancy metrics are independent and are not interchangeable.

| Metric | This review’s source | Denominator | What it does not prove |
| --- | --- | --- | --- |
| `STAGE_OCCUPANCY` | `.world-stage` DOM rect clipped to the browser viewport | CSS viewport | amount of readable world inside the container |
| `TERRAIN_OCCUPANCY` | manual screenshot annotation of visible terrain polygon/ground footprint | `.world-scene-viewport` rect | POI, route, project, territory, or conflict density |
| `MEANINGFUL_WORLD_OCCUPANCY` | manual screenshot annotation of the smallest visible enclosing rect for landmark/POI/settlement/route/territory/front/conflict content | `.world-scene-viewport` rect | stage, terrain backdrop, label-only text, legend, crisis card, or drawer |

Manual annotations are canvas-local CSS pixels. The annotation box is recorded as `screen rect → local rect`; its width/height/area ratios are computed against the actual map viewport. On mobile, the first-viewport share is the manually annotated meaningful visible area divided by `390×844`, with drawer intersection deducted. UI-covered pixels were not treated as visible world content.

Runtime `data-world-content-occupancy-*`, `data-mobile-content-occupancy-*`, `data-map-projected-world-occupancy-*`, and `data-first-mobile-viewport-world-share` are recorded separately as `metadata-not-screen-proof`. The target implementation projects terrain-mesh vertices for those fields; they are not the manual meaningful-world annotation.

## CAPTURE_MATRIX

| Capture ID | State / actual action | Labels | Tick | Camera / zoom | Drawer | Result |
| --- | --- | --- | --- | --- | --- | --- |
| `desktop-day0-labels-on` | fresh run, briefing skipped | ON | 0 | `desktop.global` / `1.12` | closed | **RUN** |
| `desktop-day0-labels-off` | fresh run with `?mapLabels=0` | OFF | 0 | `desktop.global` / `1.12` | closed | **RUN** |
| `desktop-day90-rebellion` | `+30일` × 3 | ON | 90 | `region.focus.ideology-fixture.capital` / `1.42` | closed; crisis card visible | **RUN** |
| `desktop-day90-rebellion-labels-off` | fresh `?mapLabels=0`, `+30일` × 3 | OFF | 90 | `region.focus.ideology-fixture.capital` / `1.42` | closed; crisis card visible | **RUN** |
| `mobile-day0-default` | fresh run, responsive default camera | ON | 0 | `desktop.global` / `1.12` | closed | **RUN** |
| `mobile-day0-player-theater` | actual `내 극장` selection before 390×844 resize | ON | 0 | `mobile.player-theater` / `1.82` | closed | **RUN** |
| `mobile-selected-region` | actual map tap on `철산 공업주` | ON | 0 | `region.focus.ideology-fixture.industrial` / `1.42` | open | **RUN** |
| `mobile-rebellion` | mobile `보조 진행` open, `+30일` × 3 | ON | 90 | `region.focus.ideology-fixture.capital` / `1.42` | closed; crisis card visible | **RUN** |
| `desktop-project-implementing` | no easy, deterministic visible action capture within this review window | ON | — | — | — | **NOT_RUN** |
| `desktop-project-completed` | no easy, deterministic lifecycle completion capture within this review window | ON | — | — | — | **NOT_RUN** |
| `desktop-late-global` | no capture; no arbitrary late-tick injection | ON | — | — | — | **NOT_RUN** |
| `mobile-decision-drawer` | no decision-drawer capture; selected Region drawer is the required mobile drawer evidence | ON | 0 | `region.focus.ideology-fixture.industrial` / `1.42` | open | **NOT_RUN** |

## DESKTOP_QA

### Fixed DOM geometry and overflow

All four desktop captures used the same CSS geometry after `scrollY=0`:

- `canvasViewportRect C`: `x=39.19, y=322.44, w=1346.63, h=607.83`
- `.world-stage S`: `x=28.80, y=268.84, w=1367.41, h=695.00`
- `STAGE_OCCUPANCY`: `0.950 × 0.701`, area `0.666` of the CSS viewport after clipping to `1440×900`
- HUD/header occupied height: `322.44px` (`C.top - viewport.top`)
- document overflow: `client=1425×900`, `scroll=1425×1012`, vertical `112px`, horizontal `0px`
- visible map-control minimum: `24.80px`
- visible `재생` primary-action minimum: `40.00px`

The `40px` play control and `24.80px` map controls are below the protocol’s fixed `44px` floor. Desktop horizontal overflow is not present; vertical document overflow remains visible in the screenshots.

### STAGE / TERRAIN / MEANINGFUL measurements

The following manual boxes are the actual screenshot reviewer annotations. They are not copied from runtime metadata.

| Capture | `STAGE_OCCUPANCY` | `TERRAIN_OCCUPANCY` manual box | `MEANINGFUL_WORLD_OCCUPANCY` manual box | Counts from screenshot |
| --- | --- | --- | --- | --- |
| Day0 labels ON | `0.950×0.701×0.666` | screen `186.0,423.0→1225.0,777.0`; local `146.8,100.6,1039×354`; `0.772×0.582×0.449` | screen `205.0,466.0→1227.0,775.0`; local `165.8,143.6,1042×309`; `0.774×0.508×0.393` | labels `21`; POI `4`; faction surface `0`; front `0`; routes `4` |
| Day0 labels OFF | `0.950×0.701×0.666` | same visible terrain extent; `0.772×0.582×0.449` | same meaningful extent; `0.774×0.508×0.393` | labels `0`; POI `4`; faction surface `0`; front `0`; routes `4` |
| Day90 rebellion ON | `0.950×0.701×0.666` | screen `224.19,372.44→1368.19,837.44`; local `185.0,50.0,1144×465`; `0.850×0.765×0.650` | screen `390.19,372.44→1368.19,837.44`; local `351.0,50.0,978×465`; `0.726×0.765×0.556` | labels `21`; POI `4`; faction surface `1`; front `2`; routes `4` |
| Day90 rebellion OFF | `0.950×0.701×0.666` | same terrain extent; `0.850×0.765×0.650` | same meaningful extent; `0.726×0.765×0.556` | labels `0`; POI `4`; faction surface `1`; front `2`; routes `4` |

`TERRAIN_OCCUPANCY` is larger than the object cluster in Day0 but is not itself meaningful-world density. On Day90 the camera focus makes the occupied area and active geometry span more of the canvas, while the top crisis card still occupies the first map band.

### Desktop runtime metadata, kept separate

| Capture | runtime metadata (`metadata-not-screen-proof`) | manual screen interpretation |
| --- | --- | --- |
| Day0 labels ON/OFF | projected `0.777×0.620`; stage metadata `0.950×0.761` in the DOM field; geometry `continuous-surface`, polygon `6`, shared vertices `34` | manual terrain `0.772×0.582`; manual meaningful `0.774×0.508` |
| Day90 labels ON/OFF | projected `0.861×0.787`; faction surfaces `6`; banner anchors `1`; front segments `2` | one connected faction area is visually readable; two active front segments are traceable but low-contrast and not a strong directional front band |

The DOM stage metadata height differs from the protocol-clipped `STAGE_OCCUPANCY` row because the product field is an implementation attribute, while this QA row uses the protocol’s visible-stage clipping formula. Neither field is used as meaningful-world proof.

### 2-second gaze order / P0-VIS-01

**FAIL — no material improvement versus `18d2f29`.**

The first fixation in `desktop-day0-labels-on` and `desktop-day0-labels-off` is the top header/metric/time shell. `C.top=322.44px`, while the visible meaningful objects begin materially lower inside the inner terrain surface. The side-by-side capture keeps the previous target on the left and FIX1 on the right:

- [Day0 labels ON: 18d2 → FIX1](evidence/06-map-runtime-fix1/compare-day0-labels-on-18d2-to-fix1-1440x900.png)
- [Day0 labels OFF: 18d2 → FIX1](evidence/06-map-runtime-fix1/compare-day0-labels-off-18d2-to-fix1-1440x900.png)

Observed order: `HUD/time controls > map heading/crisis context > meaningful WORLD`. This is the protocol’s **FAIL** condition, not a PASS derived from stage or terrain extent.

### Day0 labels-off blind recognition

| Class | Blind result | Independent visual cues | Time-to-recognition | Evidence |
| --- | --- | --- | --- | --- |
| `CAPITAL` | **FAIL** | one of several large beige masses; no independent civic/seat skyline cue | not reliably named within 3s | [desktop Day0 labels OFF](evidence/06-map-runtime-fix1/desktop-day0-labels-off-1440x900.png) |
| `INDUSTRIAL` | **FAIL** | smokestack-like dark verticals exist, but the mass and ground context remain generic | not reliably named within 3s | [desktop Day0 labels OFF](evidence/06-map-runtime-fix1/desktop-day0-labels-off-1440x900.png) |
| `PORT` | **FAIL** | a dark object and route/node cue exist; no water edge, quay, dock, or vessel grammar | not named | [desktop Day0 labels OFF](evidence/06-map-runtime-fix1/desktop-day0-labels-off-1440x900.png) |
| `FRONTIER` | **PARTIAL** | white gate/arch cue is present, but outer-edge/fortified-terrain role is not immediate | greater than 3s / ambiguous | [desktop Day0 labels OFF](evidence/06-map-runtime-fix1/desktop-day0-labels-off-1440x900.png) |
| `REBELLION` | **PARTIAL** | not a Day0 state; Day90 supplies the connected area/front cue | n/a in Day0 | [desktop Day90 labels OFF](evidence/06-map-runtime-fix1/desktop-day90-rebellion-labels-off-1440x900.png) |

The four asset-dependent classes are not attributed as an implementation failure of 01 alone: this target predates the new 02 World Art integration. Runtime alone still cannot close the labels-off recognition requirement; ownership for the missing semantic silhouettes is `02_WORLD_ART`.

### Day90 rebellion, territory/front, and banner hierarchy

**P0-VIS-03: PARTIAL — improved signal, not closed.**

The target introduces a connected brown faction surface and two red active-front segments. In the labels-off capture, the rebellion is more than repeated flags: the occupied area spans the lower-right cluster, and the two front edges can be followed. The target has `data-map-faction-surface-count=6`, but the screenshot-blind count is one connected readable faction area; six is a polygon/geometry metadata count, not six player-readable territories.

- [Day90 labels OFF: 18d2 → FIX1](evidence/06-map-runtime-fix1/compare-day90-labels-off-18d2-to-fix1-1440x900.png)
- [Day90 rebellion labels OFF](evidence/06-map-runtime-fix1/desktop-day90-rebellion-labels-off-1440x900.png)
- [Day90 rebellion labels ON](evidence/06-map-runtime-fix1/desktop-day90-rebellion-labels-on-1440x900.png)

Owner/controller/front assessment:

- legal owner: faint owner boundary/tint is present but not independently strong in the map-only crop;
- physical controller: connected brown faction area is visible;
- active front: two red boundary segments are visible, but they read as low-contrast polygon edges rather than one clear directional front band;
- event card and selected inspector text provide semantic confirmation, but they are not accepted as map-only proof.

Result: **PARTIAL**. The repeated-flag problem is reduced; the three channels still do not answer “legal owner / physical controller / active front” independently within five seconds.

Banner result: **PASS** for the narrow cap/secondary test. Runtime reports one banner anchor (`≤2`), and the screenshot-blind Day90 count is zero visible faction banners at the medium-Lod camera. No repeated faction flag row dominates the world. The red cube-like conflict landmark is not counted as a faction banner.

### Continuous terrain and map density

**Continuous terrain: PARTIAL.**

The target’s six connected polygon surfaces, shared-vertex count `34`, color variation, and small forest/highland props are visible. This is better than a disconnected hex-only board. However, the desktop side-by-side still reads first as a flat translucent/faceted board: coast, river, elevation, valley, and biome boundaries do not carry enough spatial information to explain why landmarks occupy their locations. Terrain connection improved; geographic meaning did not reach PASS.

Density notes are screenshot observations, not box complements:

- desktop Day0: inner low-information terrain/backdrop occupies more area than the readable landmark cluster; route lines and rings compete with the few large masses;
- desktop Day90: occupied faction surface increases political density, but the red crisis card and lower pressure panel compete with the map;
- labels OFF removes map text but leaves generic object masses, making the map less identifiable rather than cleaner;
- route density is visually high enough to compete, while POI density is low enough that generic masses are not separated into a useful hierarchy.

## MOBILE_QA

### Mobile geometry, world share, controls, and obstruction

| Capture | `C` map viewport rect | `canvasHeight/844` | `canvasTopY` / cumulative HUD-header-time | `STAGE_OCCUPANCY` | manual `TERRAIN_OCCUPANCY` | manual `MEANINGFUL_WORLD_OCCUPANCY` | first viewport meaningful share |
| --- | --- | ---: | ---: | --- | --- | --- | ---: |
| Day0 default | `x=-7.50,y=313.13,w=390,h=457.94` | `0.542` | `313.13px` | `0.981×0.680×0.667` | screen `0,363→382,614`; `0.979×0.548×0.537` | screen `0,450→357,598`; `0.915×0.323×0.296` | `0.161` |
| Day0 player-theater | `x=-7.50,y=282.13,w=390,h=457.94` | `0.542` | `282.13px` | `0.981×0.680×0.667` | screen `0,333→382,581`; `0.979×0.542×0.530` | screen `0,409→357,581`; `0.915×0.376×0.344` | `0.187` |
| selected Region / drawer | `x=-7.50,y=282.13,w=390,h=457.94` | `0.542` | `282.13px` | `0.981×0.680×0.667` | screen `0,313→382,467`; `0.979×0.336×0.329` | screen `0,389→382,467`; `0.979×0.170×0.167` | `0.091` |
| Day90 rebellion | `x=-7.50,y=326.13,w=390,h=457.94` | `0.542` | `326.13px` | `0.981×0.640×0.628` | screen `0,452→382,626`; `0.979×0.380×0.372` | screen `0,453→357,626`; `0.915×0.378×0.346` | `0.188` |

Selected Region drawer measurement:

- drawer rect: `x=9.59,y=484.70,w=355.81,h=294.50`
- drawer ∩ C: `355.81×255.36 = 90,860.2px²`
- `drawerObstructionRatio = 0.509` of the map viewport
- final meaningful share uses the visible screenshot box above; drawer deduction for that already-visible box is `0px²`, while the drawer still obscures half of the underlying canvas.

Common mobile hit/overflow results:

- smallest map control: `24.80×24.80px` — **FAIL** against `44px` floor;
- smallest primary action: `재생`, `42.17×40px` — **FAIL** against `44px` floor;
- default/player-theater/selected document: `clientWidth=375`, `scrollWidth=383`, horizontal overflow `8px`;
- Day90 document: same horizontal overflow `8px`, vertical document overflow grows from `37px` to `81px` because the crisis state adds content;
- mobile `metric-strip` is `132.38px` in Day0 and `176.38px` in Day90; `time-controls` is `87.77px` in Day0 and `131.77px` in Day90;
- the first viewport is dominated by header, metrics, time controls, map heading, crisis card, or pressure/drawer panels before a meaningful world band is visible.

### Mobile runtime metadata versus manual screen truth

| Capture | runtime metadata (`metadata-not-screen-proof`) | manual screen result |
| --- | --- | --- |
| Day0 default | `desktop.global`; projected `0.977×0.301`; first-mobile metadata `0.163` | manual meaningful share `0.161`; readable objects occupy only a bottom band |
| Day0 player-theater | `mobile.player-theater`; projected `1.000×0.637`; first-mobile metadata `0.344` | manual terrain extent `0.979×0.542`; manual meaningful share `0.187` |
| selected Region | region-focus camera; metadata remains `1.000×0.637` / `0.344` | manual meaningful share `0.091`; drawer obstruction `0.509` |
| Day90 rebellion | region-focus camera; projected `1.000×0.713`; first-mobile metadata `0.385` | manual meaningful share `0.188`; event card and pressure panel consume the visible world band |

FIX1’s `0.344` is **not consistent as a terrain screen-share metric** with the manual screenshot annotation. The value is generated from projected terrain vertices and the implementation helper’s mobile field is a vertical projected height share; the protocol’s manual metric is a meaningful-world area share after viewport/drawer handling. It also includes geometry that is behind UI or not itself meaningful content. The correct player-visible, player-theater meaningful share for this capture is `0.187`, not `0.344`.

### Mobile world-first / player-theater verdict

**FAIL.** `mobile.player-theater` improves camera zoom (`1.82`) and raises the map host to `y=282.13px`, but the meaningful world still occupies only `0.187` of the first viewport. The default camera is `0.161`; selected Region with drawer is `0.091`; Day90 rebellion is `0.188`. The target does not meet the `≥0.60` first-viewport reference.

## LABELS_OFF_QA

The labels-off desktop captures have `data-map-label-count=0`, and the blind judgments above were made from the map pixels before consulting inspector text or metadata. The target cannot close `P0-VIS-02` without the semantic World Art layer. This is attributed to `02_WORLD_ART` for the missing capital/industrial/port/frontier cues, while the runtime review records the actual failure.

Overall labels-off result: **FAIL**.

## DAY0_REBELLION_LATE_COMPARISON

| Transition / lens | Target evidence | Verdict | Finding |
| --- | --- | --- | --- |
| Day0 → rebellion | [Day0 labels OFF](evidence/06-map-runtime-fix1/desktop-day0-labels-off-1440x900.png), [Day90 labels OFF](evidence/06-map-runtime-fix1/desktop-day90-rebellion-labels-off-1440x900.png) | **PARTIAL** | changed connected controller area and active front appear; it is not merely repeated flags, but political channel separation remains weak |
| Day0 → project completed | no deterministic actual capture | **NOT_RUN** | no text-only PASS/FAIL inference |
| Day0 → late global | no deterministic actual capture | **NOT_RUN** | no arbitrary tick injection |
| persistent living map lens | Day0/Day90 side-by-side | **PARTIAL** | state-dependent controller/front surface persists, but geography and landmark accumulation remain weak |
| geography before topology lens | Day0 labels OFF | **FAIL** | faceted polygon/hex ground reads before meaningful geographic form; coast/river/elevation roles are weak |
| territory/front/routes lens | Day90 labels OFF | **PARTIAL** | territory and two fronts are present, routes remain visible, owner/controller/front hierarchy is not independently legible |
| development accumulation lens | project captures not run | **NOT_RUN** | implementing/completed/late spatial persistence was not measured |

## REFERENCE_RUBRIC

| Reference | PASS criterion applied | Result | Evidence-based note |
| --- | --- | --- | --- |
| Plague / Rebel Inc | persistent map state reads as a living political surface | **PARTIAL** | rebellion area/front persists in Day90, but UI crisis context competes with the map and terrain is low-information |
| Civilization / RTK | geography reads before hex topology | **FAIL** | faceted connected polygons are visible, but coast/river/elevation/biome are not strong enough to lead the read |
| HOI4 | territory / front / routes form a legible hierarchy | **PARTIAL** | connected faction area and two fronts are visible; legal owner and physical controller are too close in visual weight |
| Against the Storm | development accumulation remains in the world | **NOT_RUN** | project implementing/completed/late states were not reproduced under the no-injection rule |

## P0_BLOCKERS

Every FAIL below includes screenshot/evidence, exact screen/component, player consequence, severity, and owner.

| ID / result | Screenshot / evidence | Exact component / state | Player consequence | Severity | Recommended owner |
| --- | --- | --- | --- | --- | --- |
| `P0-FIX1-VIS-01` — **FAIL** | [Day0 side-by-side](evidence/06-map-runtime-fix1/compare-day0-labels-on-18d2-to-fix1-1440x900.png), [mobile player-theater](evidence/06-map-runtime-fix1/mobile-day0-player-theater-390x844.png) | `.game-header`, `.metric-strip`, `.time-controls`, `.world-stage`; `desktop-day0-labels-on`, `mobile-day0-player-theater` | player’s primary gaze lands on status/control shell; world is a secondary board | P0 | `INTEGRATION` |
| `P0-FIX1-VIS-02-CAPITAL` — **FAIL** | [Day0 labels OFF](evidence/06-map-runtime-fix1/desktop-day0-labels-off-1440x900.png) | R3F `CompositionLayer` / capital settlement and landmark presentation | capital cannot be located without labels or generic-size comparison | P0 | `02_WORLD_ART` |
| `P0-FIX1-VIS-02-INDUSTRIAL` — **FAIL** | [Day0 labels OFF](evidence/06-map-runtime-fix1/desktop-day0-labels-off-1440x900.png) | R3F industrial composition / `PoiObject` | production pressure reads as a generic block rather than a place with a distinct economic role | P0 | `02_WORLD_ART` |
| `P0-FIX1-VIS-02-PORT` — **FAIL** | [Day0 labels OFF](evidence/06-map-runtime-fix1/desktop-day0-labels-off-1440x900.png) | R3F port POI / terrain edge | player cannot distinguish port from a route node or settlement | P0 | `02_WORLD_ART` |
| `P0-FIX1-VIS-02-OVERALL` — **FAIL** | [Day0 labels OFF](evidence/06-map-runtime-fix1/desktop-day0-labels-off-1440x900.png), [Day90 labels OFF](evidence/06-map-runtime-fix1/desktop-day90-rebellion-labels-off-1440x900.png) | labels-off map visual grammar | four of five required semantic classes are not reliably identified; runtime alone cannot close the asset-dependent requirement | P0 | `02_WORLD_ART` |
| `P0-FIX1-VIS-03` — **PARTIAL / P0 residual** | [Day90 labels OFF side-by-side](evidence/06-map-runtime-fix1/compare-day90-labels-off-18d2-to-fix1-1440x900.png) | faction surface, legal-owner boundary, controller boundary, front boundary in `world-scene-frame` | rebellion area is visible, but the player cannot independently answer owner/controller/front from map-only color/line channels | P0 residual | `01_MAP_RUNTIME` |
| `P0-FIX1-MOBILE-WORLD-SHARE` — **FAIL** | [mobile player-theater](evidence/06-map-runtime-fix1/mobile-day0-player-theater-390x844.png), [mobile rebellion](evidence/06-map-runtime-fix1/mobile-day90-rebellion-390x844.png) | `.world-scene-viewport`, mobile header/metrics/time/cards | readable world remains below the required first-viewport share; mobile play becomes panel scanning rather than world reading | P0 | `INTEGRATION` |

## P1_POLISH

| ID / result | Screenshot / evidence | Exact component / state | Player consequence | Severity | Recommended owner |
| --- | --- | --- | --- | --- | --- |
| `P1-FIX1-TERRAIN-INFO` — **PARTIAL** | [Day0 labels OFF](evidence/06-map-runtime-fix1/desktop-day0-labels-off-1440x900.png) | continuous terrain mesh / `TerrainWorldSurface` | connected ground improves continuity, but flat faceting does not explain geography or landmark placement | P1 | `02_WORLD_ART` |
| `P1-FIX1-CHANNEL-CONTRAST` — **PARTIAL** | [Day90 labels OFF](evidence/06-map-runtime-fix1/desktop-day90-rebellion-labels-off-1440x900.png) | owner/controller/front boundary layers | territory/front is present but legal ownership and physical control remain too similar in visual weight | P1 | `01_MAP_RUNTIME` |
| `P1-FIX1-MOBILE-HIT` — **FAIL** | [mobile selected Region](evidence/06-map-runtime-fix1/mobile-selected-region-drawer-390x844.png) | `.map-camera-controls`, `.play-button` | map manipulation and primary time action are below the 44px touch floor | P1 | `INTEGRATION` |
| `P1-FIX1-DRAWER` — **FAIL** | [mobile selected Region](evidence/06-map-runtime-fix1/mobile-selected-region-drawer-390x844.png) | `.contextual-drawer` over `.world-scene-viewport` | drawer obscures `0.509` of the map host and removes surrounding context after selection | P1 | `INTEGRATION` |
| `P1-FIX1-ROUTE-POI-HIERARCHY` — **PARTIAL** | [Day0 labels ON](evidence/06-map-runtime-fix1/desktop-day0-labels-on-1440x900.png) | route lines, rings, POI/composition assets, label LOD | routes and generic masses compete; capital/POI scan order is not stable | P1 | `03_ICON_SYSTEM` |

## P2_POLISH

| ID / result | Screenshot / evidence | Exact component / state | Player consequence | Severity | Recommended owner |
| --- | --- | --- | --- | --- | --- |
| `P2-FIX1-HORIZONTAL-FIT` — **FAIL** | [mobile Day0 default](evidence/06-map-runtime-fix1/mobile-day0-default-390x844.png), [mobile Day90](evidence/06-map-runtime-fix1/mobile-day90-rebellion-390x844.png) | responsive game shell / document width | `8px` horizontal overflow introduces a scroll edge and weakens one-hand framing | P2 | `INTEGRATION` |
| `P2-FIX1-DOCUMENT-OVERFLOW` — **FAIL** | [desktop Day0](evidence/06-map-runtime-fix1/desktop-day0-labels-on-1440x900.png), [mobile Day90](evidence/06-map-runtime-fix1/mobile-day90-rebellion-390x844.png) | document flow below `.world-stage` and event/pressure panels | lower content is clipped in the first viewport and requires page scrolling to inspect | P2 | `INTEGRATION` |

## OWNER_ASSIGNMENTS

| Owner | Assignment from this review |
| --- | --- |
| `01_MAP_RUNTIME` | close legal-owner / physical-controller / active-front separation; keep faction surface and front as primary map channels; ensure runtime metadata names terrain projection separately from meaningful content |
| `02_WORLD_ART` | author independent capital, industrial, port, frontier silhouettes; add coast/water/terrain/elevation/biome cues so continuous terrain is geographic rather than a faceted board |
| `03_ICON_SYSTEM` | reduce route/ring/label competition; reinforce POI and landmark scan hierarchy |
| `04_AUDIO_SYSTEM` | no visual issue assigned in this review |
| `INTEGRATION` | world-first composition, mobile first-viewport share, HUD/time compression, drawer obstruction, touch targets, responsive overflow |

## SCREENSHOT_PATHS

### New target evidence

1. `docs/parallel/evidence/06-map-runtime-fix1/desktop-day0-labels-on-1440x900.png`
2. `docs/parallel/evidence/06-map-runtime-fix1/desktop-day0-labels-off-1440x900.png`
3. `docs/parallel/evidence/06-map-runtime-fix1/desktop-day90-rebellion-1440x900.png`
4. `docs/parallel/evidence/06-map-runtime-fix1/desktop-day90-rebellion-labels-off-1440x900.png`
5. `docs/parallel/evidence/06-map-runtime-fix1/mobile-day0-default-390x844.png`
6. `docs/parallel/evidence/06-map-runtime-fix1/mobile-day0-player-theater-390x844.png`
7. `docs/parallel/evidence/06-map-runtime-fix1/mobile-selected-region-drawer-390x844.png`
8. `docs/parallel/evidence/06-map-runtime-fix1/mobile-day90-rebellion-390x844.png`

### Side-by-side comparison evidence

1. `docs/parallel/evidence/06-map-runtime-fix1/compare-day0-labels-on-18d2-to-fix1-1440x900.png`
2. `docs/parallel/evidence/06-map-runtime-fix1/compare-day0-labels-off-18d2-to-fix1-1440x900.png`
3. `docs/parallel/evidence/06-map-runtime-fix1/compare-day90-labels-off-18d2-to-fix1-1440x900.png`
4. `docs/parallel/evidence/06-map-runtime-fix1/compare-mobile-player-theater-18d2-to-fix1-390x844.png`

For all side-by-side images, the previous `18d2f29` target is on the left and FIX1 `7b2f5bd` is on the right. Browser chrome, DevTools, helper overlay, metadata disclosure, and annotation overlay are absent from the visual evidence.

## NOT_DECLARED

This review records actual screenshot and measurement results only. `P0_PRODUCT_PASS`, `Gate1F`, and `V02` are not declared.
