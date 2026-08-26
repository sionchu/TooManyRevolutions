# TMR Visual Bible — V00

**프로젝트:** TooManyRevolutions  
**게임명:** 《내 왕국에 혁명이 너무 많다》  
**상태:** V00 Visual System & Asset Quality Contract — 문서 계약 완료  
**범위:** Gate 1V 진입 전 시각언어·의미·reference·asset 검수 계약  

이 문서는 구현된 renderer나 최종 art style을 설명하지 않는다. Gate 1V 이후
사람, 외부 asset, Codex/Luna/Terra가 어떤 시각 결과물을 만들더라도 같은
TMR visual grammar와 simulation 의미를 따르게 하기 위한 production contract다.

상세 acceptance와 provenance 양식은 다음 문서에 둔다.

- `docs/VISUAL_REFERENCE_CATALOG.md`
- `docs/ASSET_SOURCE_CATALOG.md`
- `docs/VISUAL_QA.md`
- `docs/ARCHITECTURE.md`의 presentation authority boundary

## 1. Core visual thesis

### Miniature Political World + Restrained Administrative Cartography

> 세계 자체는 촉각적이고 읽기 쉬운 미니어처 정치 세계다. UI와 지도 표기는
> 국가가 세계 위에 그어 놓은 행정·정치·군사적 표기처럼 보인다.

TMR은 다음이 아니다.

- generic fantasy parchment UI
- generic mobile grand-strategy UI
- photoreal historical simulation

미니어처라는 말은 장난감처럼 단순하다는 뜻이 아니다. 지도 위의 건물,
경계, 조직, 이동, 충돌이 실제 시뮬레이션 상태를 읽기 쉬운 크기와 밀도로
보여야 한다는 뜻이다. 행정지도라는 말은 장식을 뜻하지 않는다. 선, 문양,
패턴, 표식의 우선순위가 누가 무엇을 통제하고 있는지 설명해야 한다는 뜻이다.

## 2. Three visual classes

모든 시각 요소는 최소 하나의 class에 속한다. 한 class의 문법을 다른 class에
무차별적으로 확장하지 않는다.

| Class | 표현 대상 | 기본 원칙 | 허용되는 역사적 재료 |
|---|---|---|---|
| Operational UI | 상태, 시간, 선택, Region inspector, intervention, warning, decision control | function first, 높은 가독성, 장식 최소, 일관된 primitive | 기본적으로 paper aesthetic를 사용하지 않음 |
| Map Notation | Country/Region/LandHex, influence, organization, ContactGraph, control, front | 행정지도·정치지도·상황도의 언어; 지도 위에서 의미를 읽음 | 제한된 선, 패턴, route, token, boundary |
| Historical Artifact | newspaper, gazette, law, decree, revolution declaration, historical report | 해당 매체의 문맥을 재현하되 사실은 recorded simulation에서 파생 | paper, ink, period typography, seal, printed hierarchy |

문서·신문 class에서 paper를 쓰는 것은 operational UI 전체를 parchment로
덮는 허가가 아니다.

## 3. Political continuity visual principle

플레이어는 individual ruler가 아니라 `CountryId`의 역사적 연속성을 플레이한다.
따라서 Government/regime transition이 일어나도 전체 product가 다른 게임처럼
다시 skin되지 않는다.

변할 수 있는 것:

- flag, seal, masthead, selected state symbol
- 제한된 political accent
- 실제 state/faction에서 파생되는 banner나 emblem

유지해야 하는 것:

- core layout grammar
- map notation grammar
- information hierarchy
- spacing와 interaction language
- base UI primitives

왕정 → 공화정 → 군사독재 → 혁명정부가 되어도 map fill, inspector 구조,
warning 우선순위, 입력 방식이 임의로 교체되지 않는다. regime label은
derived classification이며 visual skin authority가 아니다.

## 4. Presentation authority boundary

시각 layer는 simulation을 계산하거나 보완하지 않는다.

```text
ScenarioDefinition + WorldState + committed EventStore evidence
  → future pure presentation selectors / derivePresentationState
  → PresentationState
  → future DOM/CSS and React/R3F/WebGL presentation
```

- `WorldState`와 `EventStore`가 authoritative evidence다.
- selector는 읽기 전용이며 `WorldState`, `RunState`, RNG, EventStore를 mutate하지 않는다.
- renderer/UI는 action proposal을 제출할 수 있지만 authoritative state를 직접 수정하지 않는다.
- `src/sim/`은 React, R3F, renderer module을 import하지 않는다.
- 화면에 simulation truth처럼 보이는 entity가 있으면 실제 state/event/derived
  projection에서 나와야 한다.

현재 repository에는 `src/presentation/derivePresentationState.ts`, 실제
LandHex renderer, Three.js/R3F 의존성이 없다. 현재 `src/app/App.tsx`는 Gate 0
foundation status shell일 뿐이며 V00에서 이를 production UI로 바꾸지 않는다.
`derivePresentationState`는 V01의 책임이다.

## 5. Semantic visual channels

같은 hue 하나에 ideology, enemy, rebels, shortage, danger, critical alert를
동시에 넣지 않는다. 의미별로 hue, pattern, stroke, shape, token silhouette,
animation, density, placement를 조합한다. 특히 ideology/political influence는
색상만으로 구별하지 않는다.

| Simulation 의미 | authoritative source | primary visual channel | 금지 |
|---|---|---|---|
| 법적 소유권 | `Region.ownerCountryId`와 scenario facts | 낮은 우선순위의 ownership boundary/label | physical control과 동일시 |
| 물리적 영토 통제 | `WorldState.landHexStates[*].controller` | base fill + boundary | Region에 별도 writable controller를 만들거나 색 하나로 모든 정치 의미를 표현 |
| 정치적 영향 | Region `ideology`와 derived regional read model | Region-level pattern + 제한된 hue variation | ideology를 LandHex마다 복제해 시각 밀도를 부풀림 |
| 정치조직 | 실제 `Faction` 또는 후속 authoritative organization state | token silhouette, shape, bounded label | ideology `organization`만으로 조직 token을 발명 |
| ContactGraph | static directed topology + runtime edge overlay | route + channel-specific movement | 물리 국경과 route를 같은 authority/선으로 합침 |
| active armed front | 인접한 다른 LandHex controller + active armed `Conflict` | strong linear boundary | front 자체를 WorldState authority로 저장하거나 평화 국경을 front로 표시 |
| critical alert | 실제 event/criteria/read model | priority, placement, stroke, bounded pulse | 빨강 하나로 danger와 ideology와 enemy를 모두 표시 |

ContactGraph channel 표현도 서로 다른 흐름으로 구분한다.

- `trade`: ship, cart, caravan 또는 cargo flow
- `information`: courier, message, pamphlet/press pulse
- `migration`: migrant/refugee movement
- `border`: traveler, patrol crossing, local traffic

위 표현은 해당 directed edge에서만 파생된다. 화면에 route, token, front,
crowd, army, flag가 보인다면 해당 simulation entity/evidence가 있어야 한다.

## 6. Information hierarchy

모든 정보를 동일한 card weight로 표현하지 않는다.

1. **LEVEL 1 — Immediate Critical:** active revolution, front, capital threat,
   state dissolution risk
2. **LEVEL 2 — Decision:** unrest, Agenda, scarcity, faction, foreign influence,
   intervention feasibility
3. **LEVEL 3 — Detail:** exact numbers, causal evidence, policy history,
   EventStore, historical detail

L1은 위치·크기·contrast로 즉시 읽혀야 한다. L2는 decision surface와
inspector에 배치한다. L3는 WHY/detail view에서 열어 본다.

## 7. Anti-card-soup and negative rules

상태는 상태처럼, 지도 정보는 지도 위에서, Region 정보는 inspector에서,
alert는 alert로, 법은 administrative document로, 신문은 newspaper로 보인다.
모든 것을 `rounded rectangle + icon + title + number` card로 만들지 않는다.

기본 금지 또는 강한 의심 대상:

- parchment everywhere, gold/brass fantasy frame, wax seal everywhere
- ornamental serif everywhere, floral corner, rune, fantasy RPG ornament
- glassmorphism, blue-purple generic gradient, meaningless glow/particle/bloom
- random neon highlight, permanent pulse, arbitrary shadow, inconsistent radius/stroke
- emoji 또는 의미 없는 icon-per-line, dramatic fake graph
- simulation에 없는 crowd, army, flag, protest, front, movement
- photoreal PBR과 toy low-poly의 무계획 혼합
- unrelated asset pack의 병렬 혼합
- AI output을 바로 production asset으로 승인
- quest log, ornate medieval inventory frame, fantasy crest spam, tactical HOI-like
  unit stack/division counter/supply arrow가 실제 gameplay 없이 등장하는 것

이는 AI가 만들었다는 이유로 reject하는 규칙이 아니다. 의미 없는 장식,
평균화된 취향, 서로 관계없는 문법의 혼합을 구체적으로 reject하기 위한 규칙이다.

### Decoration test

주요 visual element를 제거했을 때 gameplay information이 실제로 줄어드는가?

- YES: 유지 가능. 어떤 정보를 전달하는지 기록한다.
- NO: 장식일 가능성이 높다. mood/identity 목적이 명시되지 않으면 제거한다.

## 8. Map grammar

### Camera

Gate 1V baseline은 orthographic 또는 near-orthographic, 약 30–45° tilt다.
정확한 angle과 camera distance는 readability test에서 조정하며 V00에서 숫자를
final lock하지 않는다.

### Semantic zoom

Semantic zoom은 presentation detail이지 새 simulation truth가 아니다.

- **Far:** countries, major boundaries, active fronts, major political influence
- **Mid:** Regions, political patterns, faction tokens, contact routes, key POIs
- **Near:** buildings, markets, mines, protest signal, actual soldiers/carts/
  checkpoints/refugees when the state supports them

### World proportion classes

향후 비교할 상대 비율 class는 human, tree, house, civic building,
palace/parliament, wall, fortification, cart, ship이다. exact final number는
Gate 4에서 정하고, 모든 source/custom asset이 같은 world처럼 보이는지 먼저
검수한다.

### Material and palette grammar

TMR material library의 후보 class는 stone, dark stone, wood, roof, metal,
cloth, earth, vegetation이다. 각 source의 원본 material language가 병렬로
그대로 공존하지 않도록 TMR material assignment와 normalization을 거친다.

- world palette는 restrained
- political overlay는 limited
- critical signal은 high contrast
- faction color가 모든 UI surface를 소비하지 않음
- hue는 semantic channel의 일부일 뿐 유일한 식별자가 아님

정확한 RGB, shader, roughness/metalness budget, font file은 V00에서 lock하지
않는다. Operational UI typography는 높은 가독성과 절제를 우선하고,
Historical Artifact에서만 context-sensitive period print language를 허용한다.

### Motion grammar

허용되는 motion은 ContactGraph movement, 실제 critical alert pulse,
organization arrival/movement, front change transition, recorded world-state
signal이다. idle glow, 의미 없는 particle, arbitrary floating icon,
permanent UI pulse는 만들지 않는다.

## 9. Asset and reference grammar

Reference는 무엇을 배울지, asset은 production geometry/image/material로
사용할 수 있는지에 대한 별도 기록이다. 외부 reference image가 TMR design
authority가 아니다.

```text
External Source
  → Candidate Reference
  → source / rights verification
  → visual principle extraction
  → TMR Visual Rule
  → implementation
  → canonical screenshot review
```

예:

```text
VR-MIL-004 observation:
  active front가 secondary administrative boundary보다 강한 hierarchy를 가짐
      ↓
TMR-MAP-007:
  front stroke > country boundary > Region boundary > LandHex boundary
```

특정 commercial game의 distinctive composition, icon, UI skin은 복제하지
않는다. Commercial game은 `REFERENCE_ONLY`다.

### Donor, signature, primary language

- generic environment: external donor와 normalization을 적극 검토할 수 있음
- signature world asset: palace, parliament, revolutionary HQ, signature harbor,
  mine, government building은 custom 또는 강한 kitbash/normalization 우선
- political signature asset: faction token, banner, seal, barricade, checkpoint,
  protest/strike/ration signal은 custom 우선
- **PRIMARY GEOMETRY LANGUAGE:** 하나의 source/style grammar를 선택
- **SECONDARY DONOR:** 필요한 geometry만 보조
- **SIGNATURE:** custom/kitbash/normalized identity

V00에서는 primary source, secondary donor, signature pack을 선택하지 않는다.

### Normalization and acceptance

모든 external/custom/kitbash asset은 같은 흐름을 거친다.

```text
Candidate
  → scale normalize
  → proportion normalize
  → geometry-language check
  → TMR material assignment
  → palette/saturation normalize
  → bevel/detail normalize
  → pivot/naming cleanup
  → technical validation
  → canonical scene check
  → ACCEPTED
```

다운로드, 구매, 생성, custom 제작은 acceptance가 아니다. asset origin은
최종 composition에서 쉽게 식별되지 않아야 한다. 이는 legal provenance를
숨기라는 뜻이 아니라 visual cohesion 품질 기준이다.

AI-generated visual은 concept/composition/mood/silhouette exploration까지만
허용한다. `AI output → production` direct acceptance는 금지한다. human/design
selection 후 rebuild/normalize와 universal acceptance gate를 통과해야 한다.

Codex/Luna/Terra가 visual implementation을 수행할 때도 “beautiful”,
“premium”, “cinematic” 같은 모호한 지시를 production authority로 사용하지
않는다. approved TMR visual rule, semantic channel, approved primitive,
reference ID를 근거로 구현한다.

각 production asset은 Asset ID, name, source type, source, author, license,
commercial use, attribution, source URL, original file reference, modifications,
normalized by, acceptance status를 manifest에 남긴다. lifecycle은
`CANDIDATE → VERIFIED_SOURCE → NORMALIZING → QA → ACCEPTED`와
`REJECTED / REPLACED`를 사용한다. license가 불명확하면 `UNKNOWN / DO NOT
USE DIRECTLY` 및 `DO NOT SHIP`이다.

## 10. Visual Benchmark Scene

실제 구현이 아니라 Gate 1V 중후반 평가 규격만 정의한다.

## 11. Semantic world-object language

P0 world stage의 지도는 텍스트 목록이 아니라 현재 정치 세계를 읽는
주 playfield다. 모든 semantic object는 다음 renderer-neutral family와
truth classification을 가진다.

| Family | Truth classification | Visual contract |
| --- | --- | --- |
| `SettlementVisual` | `DERIVED_PRESENTATION` | existing Country/Region settlement projection; legal owner와 controller를 혼동시키지 않는다 |
| `PoiVisual` | `AUTHORITATIVE_PROJECTION` | authored Region/LandHex에 결박된 port, mine, fort/checkpoint 등 stable place |
| `StateProjectVisual` | `DERIVED_PRESENTATION` | existing intervention commitment/event lifecycle의 not-started, implementing, completed projection |
| `FactionActivityVisual` | `DERIVED_PRESENTATION` | 실제 faction-controlled LandHex에만 banner/occupied-site cue |
| `ConflictActivityVisual` | `DERIVED_PRESENTATION` | 실제 active Conflict와 affected/contested Region에만 camp/beacon/front cue |
| `RouteActivityVisual` | `DERIVED_PRESENTATION` | existing ContactGraph channel의 trade, information, migration, border grammar |
| `InstitutionLandmarkVisual` | `AUTHORITATIVE_PROJECTION` | authored capital-seat/assembly-hall content identity |
| `DecorativeTerrainVisual` | `DECORATIVE_SUBSTRATE` | political truth를 가리지 않는 low-poly terrain, elevation, coast, vegetation substrate |

음식·배급 project는 granary/storehouse, civic project는 assembly hall,
industrial project는 workshop/public-works silhouette을 사용한다. `not-started`
는 ring과 survey stakes만, `implementing`은 translucent body와 scaffold,
`completed`는 durable structure를 보여 준다. 이 변화는 새 timer/resource가
아니라 기존 intervention commitment와 completion event의 presentation이다.

Authored POI는 임의의 색이나 위치에서 추론하지 않는다. 현재 demo scenario의
실제 Region과 그 Region에 속한 LandHex identity를 metadata에 기록하고,
`WorldSceneModel`이 해당 anchor를 검증한 뒤 R3F에 투영한다. faction banner,
rebellion camp/beacon, controller emphasis도 실제 state/event evidence에서만
파생한다. exact army, cargo, person count/location은 표현하지 않는다.

Route channel은 warm octahedron trade flow, thin signal ring information,
spaced directional migration marks, gate/checkpoint border line으로 구분한다.
이는 활동 channel의 의미를 읽게 하는 grammar이며 literal cargo/person 수가
아니다. 기본 gaze order는 `WORLD → spatial cue → decision opportunity →
compact qualitative state → exact detail`이다. raw ID/enum/debug vocabulary는
상세 surface 뒤에 둔다.

## 12. Continuous terrain and authored player copy

`LandHex`는 topology, controller, movement와 territorial mechanics의 logical
authority다. 기본 art unit은 hex pillar가 아니다. 정상 camera의 reading order는
`terrain → country/controller boundary → roads/routes → places/projects →
conflict activity`이며, tile outline은 선택·hover·controller/front·strategic
lens에서만 contextual하게 드러난다. 타일 top은 shared continuous surface처럼
읽혀야 하고, 수직성은 terrain relief, palace, fort, mine, project와 conflict
object가 담당한다. 기본 화면에서 모든 hex의 side wall과 outline이 board look을
지배하면 안 된다.

Title/Opening Briefing의 visible copy도 source-code prose가 아니라 stable
ContentRegistry record다. baseline은 authoring-time generated/imported draft로
시작하고 Content Studio에서 filter, edit, diff, preview, local draft, reset,
JSON patch export를 수행한다. production runtime에는 LLM/API 의존성이 없고,
Content Studio가 GitHub에 직접 쓰는 것처럼 가장하지 않는다.

Capital 또는 politically active area를 다음과 같이 구성한다.

- 6–10 visible LandHex를 baseline candidate로 검토한다. architecture constant가 아님.
- 2–3 Regions
- basic houses, road, trees, civic landmark, market
- harbor 또는 mine 중 하나
- Region-level political influence
- 실제 Faction/organization token
- 실제 ContactGraph route
- fixture가 실제 active armed Conflict를 포함할 때만 front
- Region inspector presentation candidate

목적은 donor asset + custom signature asset + map notation + political signal +
UI가 한 화면에서 하나의 게임처럼 보이는지 확인하는 것이다.

- donor origin이 튀는가?
- signature asset이 과도하게 detailed한가?
- political overlay와 3D world가 충돌하는가?
- UI와 world가 다른 게임처럼 보이는가?
- hierarchy와 semantic channel이 읽히는가?

KayKit/Quaternius/Kenney 같은 variant 비교는 가능하지만 V00에서 다운로드,
winner 선택, primary pack lock을 하지 않는다.

## 11. Responsive and tone boundary

같은 simulation/visual grammar를 사용하되 composition은 viewport에 맞게
달라진다.

- desktop: map dominant + persistent side inspector
- tablet: map + adaptive sheet/overlay
- mobile portrait: map + bottom sheet/focused drill-down

Desktop을 단순 축소해 mobile로 만들지 않는다. hover만 필요한 control을
만들지 않으며, touch target/safe-area/dvh/svh는 실제 구현 task에서 검증한다.

정치·역사 용어는 직접 사용한다: 계엄, 검열, 비밀경찰, 장교단 숙청, 혁명,
쿠데타, 공산주의, 독재정. 관료주의, 권력자의 자기합리화, 책임 회피,
선전과 검열의 모순에는 dry satire가 가능하다. 대규모 기근, 학살, 민간인
사망, 전쟁 피해, 국가 붕괴의 인도적 상황은 짧고 구체적이며 건조하게 표현하고
희화화하지 않는다.

## 12. Gate 1V entry contract

다음이 확인된 뒤 V01을 시작할 수 있다.

- T024 FINAL PASS
- 이 Visual Bible 존재
- semantic channels와 anti-slop rules 문서화
- External Reference Catalog와 External Asset Catalog 존재
- universal Asset Acceptance Gate와 provenance 규칙 존재
- Visual Benchmark Scene spec 존재
- debug-first rule 존재
- F01에서 20–40 simulated year long-run performance benchmark가 수행됨
- F01 측정에서 T024 full-history validation scaling이 Gate 1V 전 성능 검토
  대상으로 관찰되었고 F01A에서 canonical continuation incremental validation으로
  해소됨. serialize/deserialize full trust-boundary validation은 유지됨

T024의 full-history validation 비용(O(ticks²))은 V00에서 측정 전 최적화하지
않았고, F01A에서 canonical continuation incremental validation으로 분리했다.
현재 calendar 기준 7,200–14,400 authoritative daily ticks의 long-run benchmark는
Gate 1V에서 계속 수행한다. full trust-boundary correctness는 항상 유지한다.

## 13. Future implementation direction

Gate 2 이후 소수의 approved primitive을 재사용한다. 후보 이름은
`TmrPanel`, `TmrRule`, `TmrStat`, `TmrAlert`, `TmrToken`, `TmrMapLabel`,
`TmrDocument`이며 개수와 이름은 final lock하지 않는다.

Future token categories는 surface, text, territory, political signal, warning,
spacing, radius, stroke, motion이다. DTCG/Style Dictionary dependency와 실제
design token file은 V00에서 추가하지 않는다.

Gate 1V/2/5에서 다음 canonical screenshot 목적을 검토한다.

- `CANON-01` Normal
- `CANON-02` High Unrest
- `CANON-03` Revolution
- `CANON-04` Civil War
- `CANON-05` Government Transition
- `CANON-06` Mobile

이름은 QA 방향이며 screenshot baseline implementation은 Gate 2/5 이후다.

V00에서 final Hex density, exact asset budget, final font, shader, primary pack,
최종 regime taxonomy, production Intervention 수를 lock하지 않는다.
