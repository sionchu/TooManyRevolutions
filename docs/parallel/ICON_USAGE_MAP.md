# TMR ICON_USAGE_MAP

## 조사 기준

- 조사 대상: `parallel-p0-icon-system`의 `304e039e893c819917d835714a79841d02ac71de`
- 조사 범위: 현재 player-facing DOM UI와 R3F strategy-map presentation source
- 조사 방식: source read-only inspection. 이번 문서 작업에서는 조사 대상 UI/map 파일을 수정하지 않았다.
- authoritative 상태는 `PresentationState`와 `WorldSceneModel`이 계속 소유한다. 아이콘은 상태를 만들거나 해석하지 않고, 이미 존재하는 category와 기록을 표시하는 presentation layer다.

## 현재 표현과 stable ID 매핑

### Map / world surface

| Source seam | 현재 표현 | replacement `TMR_ICON_ID` | 사용 규칙 | 상태 |
| --- | --- | --- | --- | --- |
| `src/app/PoliticalWorldStage.tsx:2247-2259` object key settlement | CSS 원형 점 + `수도` text | `tmr.icon.map.capital` | 20px, dark map에서는 `inverse` 또는 surface light token | P0 |
| `src/app/PoliticalWorldStage.tsx:2247-2259` object key project | CSS 사각형 + `국가 사업` text | `tmr.icon.activity.project-start` / `tmr.icon.activity.project-complete` | `implementing`/`not-started`와 `completed`를 status에 따라 분리. 현재 generic key는 text를 유지 | P1 |
| `src/app/PoliticalWorldStage.tsx:2247-2259` object key route | CSS 가로선 + `접촉 경로` text | `tmr.icon.map.trade-route`, channel별 `tmr.icon.activity.information`, `tmr.icon.activity.migration`, `tmr.icon.activity.border-closed`/`border-reopened` | route는 연속 관계이므로 line은 보존하고 icon은 legend/detail prefix로 사용 | P0/P1 |
| `src/app/PoliticalWorldStage.tsx:2247-2259` object key conflict | red CSS 원 + glow + `활성 충돌` text | `tmr.icon.crisis.rebellion`, `tmr.icon.crisis.coup`, `tmr.icon.crisis.civil-conflict` | `PresentationConflict.kind`로 선택. crisis tone은 보조 accent이며 shape와 text를 함께 유지 | P0 |
| `src/app/PoliticalWorldStage.tsx:2334-2354` map legend route | 색상 dashed line + `실제 경로` | `tmr.icon.map.trade-route` 또는 channel-specific activity icon | 색상만 제거하지 않고 line pattern과 label을 함께 유지 | P0 |
| `src/app/PoliticalWorldStage.tsx:2334-2354` map legend physical control | dashed rectangle + `물리 통제` | — | 해당 의미에 정확히 맞는 core icon이 없으므로 기존 pattern/placement/text 유지. unrelated icon을 강제하지 않음 | P2 |
| `src/app/PoliticalWorldStage.tsx:2334-2354` map legend political flow | 작은 색상 square + `정치 흐름` | — | influence channel 전용 icon을 새로 늘리지 않고 placement/line grammar와 text 유지 | P2 |
| `src/app/PoliticalWorldStage.tsx:2375-2395` data summary settlement/POI/institution | `이름 · 종류` text-only rows | `tmr.icon.map.capital`, `city`, `port`, `mine`, `fort`, `checkpoint`, `assembly` | row prefix 16px 또는 20px. R3F object를 대체하지 않고 accessible summary에만 연결 | P0 |
| `src/app/PoliticalWorldStage.tsx:2405-2416` data summary route/faction | route endpoint text, `세력 깃발` text | route channel ID; faction에는 `tmr.icon.crisis.rebellion`를 직접 의미로 쓰지 않음 | faction presence는 실제 faction emblem/organization semantics가 필요하므로 text와 existing banner geometry 유지 | P1/P2 |
| `src/app/PoliticalWorldStage.tsx:2418-2439` data summary conflict/project | `활성 반란/쿠데타/충돌`, project status text | conflict-specific crisis ID; project status ID | crisis/project status에 따라 stable ID를 선택하고 detail text를 보존 | P0/P1 |
| `src/app/PoliticalWorldStage.tsx:1095-1107` `Settlement` | authored procedural palace geometry | `tmr.icon.map.capital` | DOM legend/inspector companion only. authoritative R3F landmark는 유지 | P1 |
| `src/app/PoliticalWorldStage.tsx:1110-1586` `PoiObject`/`InstitutionLandmark` | port/mine/fort와 institution의 procedural low-poly geometry | `port`, `mine`, `fort`, `checkpoint`, `assembly` | map zoom에서 geometry를 flat icon으로 교체하지 않음. low-LOD label/summary에서 companion icon 사용 | P1 |
| `src/app/PoliticalWorldStage.tsx:1016-1093` `RouteChannelGlyph` | trade octahedron, information torus, migration cones, border gate geometry | channel-specific route/activity IDs | 3D route glyph는 map readability용으로 유지. accessible legend/detail에서 icon 사용 | P1 |
| `src/app/PoliticalWorldStage.tsx:1729-1752` `ConflictActivity` | crisis beacon prism + red ring | conflict-specific crisis ID | red ring만으로 의미를 전달하지 않도록 banner/summary에서 silhouette와 text 병기 | P0 |

### Player-facing UI

| Source seam | 현재 표현 | replacement `TMR_ICON_ID` | 사용 규칙 | 상태 |
| --- | --- | --- | --- | --- |
| `src/app/ContextualDock.tsx:42-60` context tabs | `지도`, `국정`, `결정`, `기록` text-only button | `tmr.icon.ui.map`, `tmr.icon.ui.governance`, `tmr.icon.ui.decision`, `tmr.icon.ui.chronicle` | 20px icon + Korean label을 함께 표시. label을 제거하지 않음 | P0 |
| `src/app/ContextualDock.tsx:66-83` drawer heading/close | `지역 상세` heading, `닫기` text button | heading에 `tmr.icon.ui.details`; close는 — | core set에 close icon이 없으므로 `닫기` text 유지 | P1/P2 |
| `src/app/CrisisBanner.tsx:59-75` crisis stamp | `현재 사건` text stamp | active kind에 따른 `rebellion`/`coup`/`civil-conflict`; dissolution event에는 `state-dissolution-warning` | 24px, crisis tone + border/pattern + Korean title/detail. 빨강만으로 상태를 구분하지 않음 | P0 |
| `src/app/App.tsx:527-550` map issue chip | `현재 압력`, agenda title, `지도에서 보기` text | focus action에 `tmr.icon.ui.map`; issue 자체는 agenda text 유지 | 16px 또는 20px. agenda를 임의의 crisis icon으로 재분류하지 않음 | P0 |
| `src/app/AgendaPanel.tsx:65-72` focus button | `지도에서 보기 ↗` | `tmr.icon.ui.map` | arrow glyph를 제거하고 16px icon + `지도에서 보기` text 사용 | P0 |
| `src/app/DecisionCard.tsx:195-203` intervention action | `이 선택을 실행 ↗` | `tmr.icon.ui.decision` | 20px icon + action text. arrow glyph는 제거 | P0 |
| `src/app/PolicyCard.tsx:91-99` policy action | `이 정책을 시행 ↗` | rule mutation별 `tmr.icon.politics.veto`, `suffrage`, `property`; fallback `tmr.icon.politics.parliament` | 실제 policy definition의 mutation에서 선택. policy name/detail은 유지 | P0 |
| `src/app/DecisionPanel.tsx:84-113` policy/admin groups | `법과 제도`, `국가 집행` text headings | `tmr.icon.politics.parliament`, `tmr.icon.ui.decision` | heading companion 20px; group semantics를 읽는 label은 유지 | P1 |
| `src/app/ChroniclePanel.tsx:32-58` chronicle rows | `주요/전략/추세` text level + crisis row border | `tmr.icon.ui.chronicle`; crisis item은 conflict-specific ID | 16px row prefix. level text와 event title/detail은 유지 | P0 |
| `src/app/RegionInspector.tsx:29-69` selected-region header | eyebrow + region name + text stats | `tmr.icon.ui.details` | 20px heading companion. control/ownership semantics는 text와 pattern으로 병기 | P1 |
| `src/app/GameHeader.tsx:40-49` sound control | `소리 켜짐/꺼짐` text-only button | `tmr.icon.ui.audio` | 20px icon + 상태 text. audio는 P0 subset 밖의 follow-up | P1 |
| `src/app/ConsolidationChecklist.tsx:83-90` checklist row | `✓` 또는 `·` glyph + text | — | project-complete를 checklist pass icon으로 오용하지 않음. 현재 glyph와 label을 별도 status icon 결정 전까지 유지 | P2 |
| `src/app/TimeControls.tsx:23-77` playback/manual jump | `일시정지`, `재생`, `+1일`, `+7일`, `+30일` text | — | core set에 play/pause/step 의미가 없으므로 Korean action text 유지 | P2 |
| `src/app/InstitutionalRoadmapPanel.tsx:177-205` graph edge | SVG arrow marker + line | — | graph relation grammar이며 object icon이 아니다. arrow marker와 edge kind text 유지 | P2 |
| `src/app/OpeningBriefing.tsx:78` / `src/app/TitleScreen.tsx:44` | CTA 뒤 `→` glyph | `tmr.icon.ui.decision` (선택적) | final opening/title pass에서만 적용. 현재 text CTA와 arrow의 의미를 먼저 유지 | P2 |

## ID 선택 원칙

1. `rebellion`, `coup`, `civil-conflict`는 실제 `PresentationConflict.kind`에서만 선택한다. active conflict가 없는데 crisis icon을 장식으로 추가하지 않는다.
2. `territory-lost`, `capital-threatened`, `state-dissolution-warning`는 해당 event/presentation evidence가 있을 때만 사용한다. `capital` 아이콘과 `capital-threatened` 아이콘은 서로 대체하지 않는다.
3. route는 `trade`, `information`, `migration`, `border` channel을 구분한다. 하나의 generic red marker로 합치지 않는다.
4. `project-start`와 `project-complete`는 `StateProjectPresentation.status`에서 직접 파생한다. 진행률이나 색상만 보고 상태를 추정하지 않는다.
5. text를 지워 icon-only UI로 만들지 않는다. 16px icon은 label을 보완하며, standalone map marker에서도 `ariaLabel` 또는 adjacent accessible text를 유지한다.
