# 06 World Art FIX2 Visual Re-review

## REVIEW_TARGET

| Field | Value |
|---|---|
| execution authority | `docs/parallel/tasks/06_WORLD_ART_FIX2_REREVIEW.md` |
| target branch | `parallel-p0-world-art-v2` |
| `BASE_SHA` | `105c9b585980dc559a2cabb6c4fec9facf9c200f` (authorized QA baseline) |
| `HEAD_SHA` | `52e4c14574689ec0c618d9d83a451b46f2302603` |
| comparison SHA | `fd46de162b81814a1c61caccaf09ab4a31641738` |
| QA branch capture commit | `4e151466ddac7933e9f4b5aa408c88a1dab37800` |
| deployed source | 해당 없음. exact target SHA의 local Vite render |
| target worktree | `C:\Temp\TooManyRevolutions-world-art-fix2-qa-20260826` (detached) |
| QA URL | `http://127.0.0.1:5182/qa-world-art-gallery.html?mapLabels=0` |
| reviewed component | `src/app/mapVisual/WorldArtGallery.tsx` |

이번 re-review는 production runtime map이 아니라 target commit의 standalone
authoring preview를 실제 browser Canvas로 렌더한 visual QA다. source 변경과
runtime integration만으로 판정을 올리지 않고, `fd46de1` screenshot과 같은
orthographic gallery framing에서 labels-off 화면을 직접 비교했다.

## EXECUTION_PROOF

### Fixed render conditions

- viewport: `1440×900 CSS px`
- devicePixelRatio: `1`
- scroll position: `0, 0`
- labels: OFF. gallery root `data-labels="off"`, `body.innerText === ""`
- gallery root / Canvas: `1440×640`, origin `(0, 0)`
- document horizontal extent: `1440px`; horizontal overflow 없음
- fixed gallery 아래 viewport 약 `260px`는 empty dark backdrop
- screenshot에는 overlay, role text, diagnostic text를 추가하지 않음

target worktree에만 다음 untracked QA entrypoint를 만들고 Vite로 실행했다.
target production source와 branch에는 commit하지 않았다.

```text
qa-world-art-gallery.html
src/qaWorldArtGallery.tsx
```

focused source tests도 target SHA에서 실행했다.

```text
npx vitest run src/app/mapVisual/worldArtGallery.test.ts src/presentation/mapVisual/proceduralKitGeometry.test.ts --reporter=verbose --silent=false
2 test files passed / 4 tests passed
```

위 test 결과는 geometry/model contract의 실행 결과이며, 아래 판정은 screenshot
evidence를 기준으로 한다.

## SCREENSHOT_EVIDENCE

Panel order는 screenshot을 본 뒤 target의 고정 camera projection과 대조했다.
상단 좌 `frontier`, 상단 중앙 `agrarian-distribution`, 하단 좌 `capital`,
하단 중앙 `industrial`, 하단 우 `port`다.

| Evidence | Dimensions | SHA-256 |
|---|---:|---|
| `evidence/06-world-art-gallery-1440x900-labels-off.png` (before) | 1440×900 | `BB6EDB1F30E0BDC4DC609D9D89CC6ACE630122A67548D94B2E8E9A7EEF8F26C3` |
| `evidence/06-world-art-gallery-1440x900-labels-off-panels.png` (before crop) | 650×245 | `CDE811D3AAF7005C87B519C6AC517A42B8B6EC630C1CF892443133DDE8088A5A` |
| `evidence/06-world-art-fix2-1440x900-labels-off.png` (after) | 1440×900 | `BA58CC68DE601DD102BED8827A1738421C1C84AE536ACC627B456C401961FDC0` |
| `evidence/06-world-art-fix2-1440x900-labels-off-panels.png` (after crop) | 650×245 | `D0FDFB5128EB181BC96B1B9BDD18D56E6728319B302B6909DF72499C1BCF6041` |
| `evidence/compare-fd46de1-to-fix2-panels-1440x900.png` | 1300×245 | `BF46AA27C2CD464187B5FF95EDB1120B576C0DCEB9791482D783FCC8D1375A34` |
| `evidence/compare-fd46de1-to-fix2-full-1440x900.png` | 2880×900 | `A0F3F6A052728D2D93C345442BF1E4C885A739AA28551FDDF90FE0463487FC1B` |
| `evidence/compare-fd46de1-to-fix2-port-zoom.png` (derived crop) | 1520×420 | `F09440E07CD3F2B8CBFF21442DD9115BB9B573215CF40EF5B80013754689BBB3` |
| `evidence/compare-fd46de1-to-fix2-frontier-zoom.png` (derived crop) | 1520×420 | `1A7FE88838852A49D41996C53EA76B3C7736E4E2CE6C1040C1C4B7492B20F83E` |

## BEFORE_AFTER_DECISION

| Criterion | `fd46de1` | `52e4c14` | Change | Player-facing reading |
|---|---|---|---|---|
| Port | **FAIL** | **PARTIAL** | improved, not closed | A muted horizontal water/edge cue appears around the dock, but at native full-frame scale it is not a broad water surface with a decisive shoreline. Port remains easy to mistake for a timber yard. |
| Agrarian / Distribution | **FAIL** | **PARTIAL** | improved, not closed | The field is wider and furrow/drainage bands plus a larger storehouse profile are visible. The field still shares the plate color and the loading/distribution lane does not immediately separate from generic low structures. |
| Frontier | **PARTIAL** | **PASS** | closed in this gallery | Split south wall leaves a visible gate void; the four-tower perimeter, adjacent checkpoint structure, and rough-ground mass form a defensive choke silhouette. |
| Industrial richness | **FAIL** | **PARTIAL** | richer, still secondary | Lower varied chimneys, enlarged works yard, ore bay, haul axis and crane add production cues. The large iron box and chimney rhythm still win the first read. |
| Capital hierarchy | **PARTIAL** | **PASS** | improved | The bright palace mass, widened terrace and public approach now read as the strongest civic landmark; lowered industrial verticals no longer dominate it. |
| Five-role silhouette distinctness | **PARTIAL** | **PASS** | improved | Frontier enclosure, agrarian horizontal field/storehouse, capital civic mass, industrial dark works, and port linear timber cluster are distinguishable without labels. Secondary role detail remains small. |
| Material family coherence | **PASS** | **PASS** | retained | Earth, stone, civic plaster, iron, timber and muted water colors share one low-poly world treatment. |
| Grounding | **PASS** | **PASS** | retained | Contact shadows and plate contact keep the clusters grounded; no obvious floating object is visible in the after screenshot. |
| Primitive / blockout dominance | **FAIL** | **FAIL** | unchanged | Raw boxes, cylinders and cones remain the dominant visual language, especially in industrial, frontier and port. Semantic composition is still subordinate to construction primitives. |
| Palace > project > POI > settlement > prop scale hierarchy | **PARTIAL** | **PARTIAL** | partial improvement | Palace-to-project hierarchy is stronger, but equal presentation plates and the small gallery projection flatten lower-rank prop/settlement separation. |

## PRIMARY_P0_REVIEW

### Port — **PARTIAL**

The after panel has a larger pier/deck footprint and a new `water-shelf` family,
but the native screenshot does not show a sufficiently broad, unmistakably blue
water surface. A shoreline/tidal edge is not cleanly separated from the tan plate,
and the dock-to-water relation is mainly inferred from a thin muted band below the
timber structure. The warehouse is present, but the whole reads as a linear yard
before it reads as a waterside trade gateway.

P0 blocker remains open for labels-off recognition.

### Agrarian / Distribution — **PARTIAL**

The after panel materially increases `field-ground`, furrow spacing, drainage/berm
width, storehouse/silo profile and loading-yard footprint. These additions are
visible in the crop and improve the horizontal production read. In the full
1440×900 screenshot, however, field and plate remain close in tone, the gray bands
are easy to read as generic slabs, and the distribution lane does not form a clear
loading/food-flow silhouette. It is not safe to call this a text-free food
production/distribution region yet.

P0 blocker remains open for labels-off recognition.

### Frontier — **PASS**

The split `south-wall-left` / `south-wall-right` primitives expose a central void,
while the raised `gate` becomes a lintel rather than a filled gate block. In the
after crop, the wall perimeter and towers read first, the checkpoint/gate cluster
is adjacent on the right, and the rough mass behind the fort supports a border
choke interpretation. This is a screenshot-backed art-gallery PASS only; it does
not authorize a production-map or runtime integration PASS.

## SECONDARY_REVIEW

### Industrial richness — **PARTIAL**

`factory-iron-works` now has a wider works hall, varied lower chimneys, a larger
works yard, furnace/ore bay, haul axis and crane. Those pieces create more of a
production sequence than `fd46de1`, but the visible cluster is still dominated by
one dark rectangular hall and the chimney trio. The yard and ore relationships do
not yet compete with the block silhouette at first glance.

### Capital hierarchy — **PASS**

The palace panel has a wider stone terrace, stairs, public plaza and approach axis.
Combined with the lower industrial chimneys, the capital is now the brightest,
widest and most civic-looking landmark in the five-panel comparison. It wins
landmark attention without relying on a label.

### Primitive / blockout dominance — **FAIL**

The `WorldArtGallery` still renders all kits through `ProceduralWorldArtKitRenderer`
using only box, cylinder and cone primitives. The new composition relationships
are visible, but the screenshot continues to look like an arranged primitive
blockout rather than a finished world-art language. This is a P1 polish blocker,
not a claim that the geometry contract or replacement seam is absent.

## REMAINING_ISSUES

### WAG-FIX2-P0-01 — Port water identity remains weak

- 판정: **PARTIAL**
- screenshot/evidence: `evidence/06-world-art-fix2-1440x900-labels-off.png`, `evidence/06-world-art-fix2-1440x900-labels-off-panels.png`, `evidence/compare-fd46de1-to-fix2-port-zoom.png`
- exact component/screen: `src/app/mapVisual/WorldArtGallery.tsx` → `GalleryPanel(role: "port")` → `water-shelf` + `port-dock`
- player consequence: labels OFF에서 port가 waterside trade gateway보다 timber yard/scaffold로 먼저 읽혀 항구의 strategic geography를 찾기 어렵다.
- severity: **P0**
- recommended owner: **02_WORLD_ART**

### WAG-FIX2-P0-02 — Agrarian distribution grammar remains generic

- 판정: **PARTIAL**
- screenshot/evidence: `evidence/06-world-art-fix2-1440x900-labels-off.png`, `evidence/06-world-art-fix2-1440x900-labels-off-panels.png`
- exact component/screen: `src/app/mapVisual/WorldArtGallery.tsx` → `GalleryPanel(role: "agrarian-distribution")` → `field-plot`, `granary-storehouse`, `distribution-yard`
- player consequence: field/furrow and storehouse cues는 보이지만 food-production surface와 loading/distribution flow가 generic pale cluster에서 즉시 분리되지 않는다.
- severity: **P0**
- recommended owner: **02_WORLD_ART**

### WAG-FIX2-P1-01 — Industrial works chain remains secondary

- 판정: **PARTIAL**
- screenshot/evidence: `evidence/06-world-art-fix2-1440x900-labels-off-panels.png`, `evidence/compare-fd46de1-to-fix2-panels-1440x900.png`
- exact component/screen: `src/app/mapVisual/WorldArtGallery.tsx` → `GalleryPanel(role: "industrial")` → `factory-iron-works`
- player consequence: 산업 region은 식별되지만 ore → works yard → haul/furnace 관계가 먼저 읽히지 않아 생산 거점의 richness와 strategic purpose가 약하다.
- severity: **P1**
- recommended owner: **02_WORLD_ART**

### WAG-FIX2-P1-02 — Primitive/blockout language still dominates

- 판정: **FAIL**
- screenshot/evidence: `evidence/06-world-art-fix2-1440x900-labels-off.png`, `evidence/06-world-art-fix2-1440x900-labels-off-panels.png`
- exact component/screen: `src/app/mapVisual/WorldArtGallery.tsx` → `ProceduralWorldArtKitRenderer` → `PrimitiveMesh`
- player consequence: player가 landmark의 role을 읽기 전에 box/cylinder/cone construction language를 읽어 authoring placeholder처럼 느낀다.
- severity: **P1**
- recommended owner: **02_WORLD_ART**

### WAG-FIX2-P1-03 — Lower-rank scale separation remains compressed

- 판정: **PARTIAL**
- screenshot/evidence: `evidence/06-world-art-fix2-1440x900-labels-off.png`, `evidence/compare-fd46de1-to-fix2-full-1440x900.png`
- exact component/screen: `WorldArtGallery` five-panel orthographic preview; equal tan presentation plates with `MAP_SCALE_HIERARCHY` kits
- player consequence: palace와 project는 구별되지만 POI, settlement, decorative substrate의 rank가 작은 panel과 동일 plate 때문에 안정적으로 계층화되지 않는다.
- severity: **P1**
- recommended owner: **02_WORLD_ART**

## P0_BLOCKER_DISPOSITION

| Item | Disposition |
|---|---|
| Port labels-off recognition | **OPEN — PARTIAL** |
| Agrarian/distribution labels-off recognition | **OPEN — PARTIAL** |
| Frontier fort/gate labels-off recognition | **CLOSED in this standalone gallery — PASS** |
| production-map integration of these kits | 이 standalone task의 판정 범위가 아님 |

FIX2는 모든 visual blocker를 닫지 않았다. 이 문서는 `P0_PRODUCT_PASS`,
`Gate1F`, `V02`를 선언하지 않는다.

## OWNER_ASSIGNMENTS

| Owner | Assignment |
|---|---|
| `02_WORLD_ART` | Port water/shoreline/dock contrast; agrarian field + loading flow; industrial works-chain readability; primitive-to-authored surface breakup; lower-rank scale separation |
| `P0_INTEGRATION` | 이번 standalone gallery screenshot의 unresolved integration disposition를 production map acceptance로 확장하지 않도록 별도 runtime review에서 검토 |

## SCREENSHOT_PATHS

```text
docs/parallel/evidence/06-world-art-gallery-1440x900-labels-off.png
docs/parallel/evidence/06-world-art-gallery-1440x900-labels-off-panels.png
docs/parallel/evidence/06-world-art-fix2-1440x900-labels-off.png
docs/parallel/evidence/06-world-art-fix2-1440x900-labels-off-panels.png
docs/parallel/evidence/compare-fd46de1-to-fix2-panels-1440x900.png
docs/parallel/evidence/compare-fd46de1-to-fix2-full-1440x900.png
docs/parallel/evidence/compare-fd46de1-to-fix2-port-zoom.png
docs/parallel/evidence/compare-fd46de1-to-fix2-frontier-zoom.png
```

Only this QA result and screenshot evidence are intended for the QA branch
commit. No production source, package/lockfile, bridge document, target branch,
or deployed source was modified by this review.
