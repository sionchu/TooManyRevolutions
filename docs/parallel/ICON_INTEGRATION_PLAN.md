# TMR ICON_INTEGRATION_PLAN

## 목적과 범위

이 문서는 accepted icon system을 현재 P0 map/UI에 연결하기 위한 integration handoff다. 이번 작업은 새로운 대량 icon 제작이 아니라, stable ID 선택·theme-safe renderer·사용 순서를 닫는 준비 단계다.

- 기준 branch: `parallel-p0-icon-system`
- 기준 HEAD: `304e039e893c819917d835714a79841d02ac71de`
- source 조사: player-facing source read-only
- 이번 변경 범위: icon registry subset, `TmrIcon` renderer, renderer test, integration 문서
- 변경하지 않는 범위: `src/sim/**`, `src/app/App.tsx`, `src/app/PoliticalWorldStage.tsx`, map-runtime/presentation state authority, bridge 문서

## P0 core subset

42개 전체 registry 중 현재 map / crisis / policy / navigation seam에 우선 연결할 25개다. 새 asset을 추가하지 않고 기존 stable ID만 allow-list로 재사용한다.

| 그룹 | 개수 | core IDs |
| --- | ---: | --- |
| map/place | 9 | `tmr.icon.map.capital`, `tmr.icon.map.city`, `tmr.icon.map.port`, `tmr.icon.map.mine`, `tmr.icon.map.factory`, `tmr.icon.map.fort`, `tmr.icon.map.checkpoint`, `tmr.icon.map.trade-route`, `tmr.icon.map.assembly` |
| crisis | 6 | `tmr.icon.crisis.rebellion`, `tmr.icon.crisis.coup`, `tmr.icon.crisis.civil-conflict`, `tmr.icon.crisis.territory-lost`, `tmr.icon.crisis.capital-threatened`, `tmr.icon.crisis.state-dissolution-warning` |
| policy | 4 | `tmr.icon.politics.parliament`, `tmr.icon.politics.suffrage`, `tmr.icon.politics.veto`, `tmr.icon.politics.property` |
| navigation | 6 | `tmr.icon.ui.map`, `tmr.icon.ui.governance`, `tmr.icon.ui.decision`, `tmr.icon.ui.chronicle`, `tmr.icon.ui.details`, `tmr.icon.ui.why` |

`road`, `granary`, `monarchy`, `election`, `press`, `censorship`, `labor-organization`, `land-reform`, activity route variants, `project-start`, `project-complete`, `settings`, `audio`, `trade`, `information`, `migration`, `border-closed`, `border-reopened`는 registry에 남겨 두되 이번 P0 core allow-list 밖의 reserved IDs다. 실제 surface evidence가 생길 때만 연결한다.

## ICON_INTEGRATION_PLAN

| component | current representation | replacement icon ID | size | semantic color/contrast | priority |
| --- | --- | --- | ---: | --- | --- |
| `ContextualDock` context tabs | 지도/국정/결정/기록 text-only buttons | `ui.map` / `ui.governance` / `ui.decision` / `ui.chronicle` | 20px | light drawer: `neutral`; dark map tab: `inverse`; label 병기 | P0 |
| `PoliticalWorldStage` object key: settlement | CSS round dot + 수도 | `map.capital` | 20px | dark map: `inverse` 또는 `--tmr-icon-color-inverse`; dot/label 제거 후 silhouette+label 유지 | P0 |
| `PoliticalWorldStage` object key: conflict | red dot + glow + 활성 충돌 | conflict kind별 `crisis.rebellion` / `crisis.coup` / `crisis.civil-conflict` | 20px | `crisis` tone은 accent only; outline/pattern/text를 함께 사용 | P0 |
| `PoliticalWorldStage` map legend route | colored dashed line + 실제 경로 | `map.trade-route` 또는 route channel ID | 16px | map dark surface에서 `inverse`; line pattern은 유지 | P0 |
| `CrisisBanner` crisis stamp | 현재 사건 text stamp | active conflict/event ID에 따른 crisis ID | 24px | crisis surface: light ink on dark red panel; hue가 아니라 silhouette/title로 판독 | P0 |
| `AgendaPanel` focus CTA | `지도에서 보기 ↗` | `ui.map` | 16px | light panel `neutral` 또는 accent; arrow glyph 제거, Korean label 유지 | P0 |
| `App` map issue focus CTA | `지도에서 보기` text-only | `ui.map` | 16px | light map overlay `neutral`; title/detail과 함께 사용 | P0 |
| `DecisionCard` intervention CTA | `이 선택을 실행 ↗` | `ui.decision` | 20px | light action surface `accent`; 실행 text가 primary semantic | P0 |
| `PolicyCard` policy CTA | `이 정책을 시행 ↗` | mutation별 `politics.veto` / `politics.suffrage` / `politics.property`; fallback `politics.parliament` | 20px | light policy card `neutral`/`accent`; availability color는 shape를 대체하지 않음 | P0 |
| `ChroniclePanel` event row | crisis row border + 주요/전략/추세 text | `ui.chronicle`; crisis item에는 conflict-specific ID | 16px | light panel `neutral`; crisis row만 `crisis` tone, level text 유지 | P0 |
| `PoliticalWorldStage` data summary: settlement/POI/institution | 이름·종류 text-only rows | `map.capital` / `map.city` / `map.port` / `map.mine` / `map.fort` / `map.checkpoint` / `map.assembly` | 16px | light summary `neutral`; adjacent Korean name/type 유지 | P0 |
| `PoliticalWorldStage` project summary | project status text | `activity.project-start` / `activity.project-complete` | 16px | implementing은 `accent`, completed는 `neutral`/success contrast; status text 유지 | P1 |
| `PoliticalWorldStage` route summary | endpoint + channel text | `map.trade-route` / `activity.information` / `activity.migration` / border status IDs | 16px | channel별 tone은 contrast 보조; line/endpoint text 유지 | P1 |
| `DecisionPanel` 법과 제도 heading | text-only group heading | `politics.parliament` | 20px | light panel `neutral` | P1 |
| `DecisionPanel` 국가 집행 heading | text-only group heading | `ui.decision` | 20px | light panel `neutral` | P1 |
| `RegionInspector` selected-region heading | 선택 지역 eyebrow + stats | `ui.details` | 20px | light panel `neutral`; ownership/control은 text와 pattern 병기 | P1 |
| `GameHeader` audio button | 소리 켜짐/꺼짐 text-only | `ui.audio` | 20px | light header `neutral`; on/off text와 pressed state 유지 | P1 |
| `ConsolidationChecklist` criterion | `✓`/`·` glyph + label | — | — | pass/block 상태는 existing text/class/pattern 유지. project icon을 status icon으로 오용하지 않음 | P2 |
| `TimeControls` playback | 재생/일시정지/+일 text | — | — | text action 유지. core subset에 playback icon이 없으므로 임의 대체하지 않음 | P2 |
| `InstitutionalRoadmapPanel` edges | SVG arrow marker + 관계 line | — | — | edge direction/line grammar 유지. icon은 node category가 정해진 별도 pass에서만 추가 | P2 |
| R3F `Settlement`/`PoiObject`/`InstitutionLandmark` | procedural low-poly map geometry | companion IDs only | — | geometry를 CSS icon으로 덮지 않음. icon은 legend/summary/inspector에만 사용 | P1 |
| R3F `RouteChannelGlyph` | 3D route channel glyph | companion channel IDs only | — | actual route geometry와 icon legend를 중복 표시하지 않도록 LOD에서 하나를 우선 | P1 |
| R3F `ConflictActivity` | crisis beacon prism/ring | companion conflict ID only | — | red ring 단독 의미 금지; banner/summary에 silhouette + text 추가 | P0 |

## Theme-safe rendering contract

`TmrIcon`은 `<img>`의 고정 `#27211d` 표시 대신 registry SVG를 CSS mask로 사용한다. SVG의 alpha silhouette를 `currentColor`로 칠하므로 asset 파일의 authored stroke color가 light/dark surface 색을 결정하지 않는다.

```tsx
<TmrIcon iconId={TMR_ICON_IDS.ui.map} size={20} tone="neutral" />
<TmrIcon iconId={TMR_ICON_IDS.crisis.rebellion} size={24} tone="crisis" />
```

Renderer contract:

- `iconId`는 `TmrIconId`만 허용하고 asset path는 registry에서 resolve한다.
- `tone`: `neutral`, `accent`, `crisis`, `inverse`.
- tone별 CSS variable: `--tmr-icon-color`, `--tmr-icon-color-accent`, `--tmr-icon-color-crisis`, `--tmr-icon-color-inverse`.
- variable이 제공되지 않으면 inherited `currentColor`로 fallback한다.
- renderer는 `mask-image`와 WebKit prefix를 함께 설정하고 `background-color: currentColor`를 사용한다.
- semantic icon은 `role="img"`와 registry의 Korean `ariaLabel`을 사용한다. `decorative`일 때만 `aria-hidden`을 사용한다.
- `data-icon-renderer="css-mask"`, `data-icon-tone`, `data-icon-id`를 QA hook으로 유지한다.
- crisis tone은 contrast/accent 채널일 뿐이며 crisis category는 silhouette, border/pattern, label, placement 중 최소 하나를 함께 제공한다.

### Surface profile

| surface | 권장 tone | 권장 contrast 관계 | 적용 예 |
| --- | --- | --- | --- |
| light panel / drawer | `neutral` 또는 `accent` | 어두운 icon ink를 밝은 paper/parchment 위에 배치 | ContextualDock, DecisionCard, RegionInspector |
| dark map / map HUD | `inverse` | 밝은 icon ink를 `#25241f` 계열 map surface 위에 배치 | object key, route legend, map focus control |
| crisis banner / crisis row | `crisis` + 필요 시 `inverse` | crisis panel의 어두운 바탕과 충분히 대비되는 light icon; title/detail와 함께 사용 | CrisisBanner, conflict chronicle row |
| monochrome / print-like view | `neutral` | tone을 제거해도 silhouette와 line/pattern이 의미를 유지 | asset QA, reduced-color capture |

## Size/detail audit

42개 SVG를 16/20/24/32px 기준으로 구조 검사했다.

- 모든 asset의 authored `stroke-width`는 `1.7`이다.
- viewBox 24 기준 환산 stroke는 각각 약 `1.13px`, `1.42px`, `1.70px`, `2.27px`이다.
- geometry element 수는 asset당 2~5개다. `trade-route`가 5개로 가장 많고 `capital`, `checkpoint`, `port`가 4개다.
- `<text>`, `<script>`, `<foreignObject>`와 외부 href는 없다.
- 16px에서 path가 사라지는 42개 asset은 구조 검사에서 발견되지 않았다.
- 이 audit 범위에서는 stroke/detail이 예산을 초과한 icon이 없어 SVG를 수정하지 않았다. 48px preview는 detail inspection용이고 P0 UI 기본 크기는 16~24px다.

## Integrator sequence

1. `ContextualDock`와 `CrisisBanner`에 P0 navigation/crisis icon을 먼저 붙인다.
2. `AgendaPanel`, `DecisionCard`, `PolicyCard`, `ChroniclePanel`의 arrow/glyph와 category marker를 stable ID로 교체한다.
3. map object key와 accessible data summary에 companion icon을 추가한다. R3F authoritative geometry는 그대로 둔다.
4. light/dark/crisis surface에서 `tone` CSS variable을 공급하고, adjacent Korean label과 focus/pressed state를 확인한다.
5. 16/20/24/32px gallery capture를 다시 실행해 overlap, baseline, contrast, silhouette를 검토한다.

## Integration guardrails

- 이번 prep에서 `App.tsx`, `PoliticalWorldStage.tsx`, `src/sim/**`, map-runtime authority를 수정하지 않았다.
- icon을 추가해 simulation entity, crisis state, organization, route 또는 territorial control을 발명하지 않는다.
- `crisis` tone만으로 crisis를 표현하지 않는다.
- icon-only control을 만들지 않는다. label/accessible name은 계속 제공한다.
- core subset 밖의 ID는 실제 사용처가 생길 때까지 대량 연결하지 않는다.
