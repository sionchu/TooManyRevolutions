# TMR Visual QA Contract — V00

**상태:** V00 process contract — implementation deferred to Gate 1V/2/4/5  
**범위:** debug map, visual benchmark, UI primitive, external/custom asset의 공통 검수

이 문서는 “예쁜가?”를 단독 판정 기준으로 사용하지 않는다. 시각 결과물이
실제 simulation을 정확히 설명하고, TMR grammar를 재사용하며, 서로 다른
source가 하나의 세계처럼 보이는지를 검수한다.

## 1. Review order

```text
Simulation truth check
  → semantic channel check
  → hierarchy/readability check
  → visual cohesion check
  → technical check
  → legal/provenance check
  → canonical screenshot review
```

Visual polish는 앞 단계의 실패를 가리지 못한다. 화면에 표시된 simulation
entity가 실제 state/evidence에서 설명되지 않으면 FAIL이다.

## 2. Simulation-fiction consistency

- 정치조직 token은 실제 `Faction` 또는 후속 authoritative organization state에서 파생된다.
- political influence는 Region-level ideology/read model에서 파생되며 LandHex마다 복제하지 않는다.
- territorial fill/boundary는 `WorldState.landHexStates[*].controller`에서 파생된다.
- front는 현재 서로 다른 LandHex controller와 active armed `Conflict`에서 파생된다.
- ContactGraph route/movement는 실제 directed edge와 channel에서 파생된다.
- crowd, army, flag, protest, refugee, market activity는 해당 state가 있을 때만 표시한다.
- presentation selector/renderer는 WorldState, RunState, RNG, EventStore를 mutate하지 않는다.
- selector/renderer에 duplicate simulation rule이나 hidden fallback authority가 없다.

## 3. Universal asset acceptance gate

external asset, custom asset, kitbash, AI-concept-derived rebuild 모두 같은
상태 흐름을 따른다.

```text
CANDIDATE
  → NORMALIZING
  → VALIDATE
  → VISUAL QA
  → ACCEPTED
```

### Visual checklist

- [ ] game-scale silhouette가 한눈에 읽힌다.
- [ ] human/tree/house/civic/palace/wall/cart/ship과 proportion이 맞는다.
- [ ] geometry language, bevel/roundness, detail density가 기존 grammar와 맞는다.
- [ ] material language, roughness/metalness, saturation, value range가 맞는다.
- [ ] TMR palette와 shadow behavior가 맞는다.
- [ ] asset origin이 최종 composition에서 튀지 않는다.

### Gameplay and semantic checklist

- [ ] gameplay role, landmark role, decoration role이 구분된다.
- [ ] 올바른 semantic visual channel을 사용한다.
- [ ] 다른 의미를 같은 색/선/아이콘 하나에 과부하하지 않는다.
- [ ] color-blind/low-contrast 상황에서도 pattern, shape, stroke, placement 중 하나로 의미를 구분할 수 있다.
- [ ] 화면에 보이는 entity가 실제 simulation state로 설명된다.
- [ ] 제거했을 때 정보가 줄지 않는 장식은 explicit mood/identity 이유가 없으면 제거한다.

### Technical checklist

- [ ] glTF 2 validity를 확인한다.
- [ ] scale, pivot, bounds, node/name을 정리한다.
- [ ] stray camera/light/node가 없다.
- [ ] triangle/material/texture budget이 해당 Gate의 budget 안에 있다.
- [ ] mobile/tablet에서도 필요한 detail과 hierarchy가 유지된다.

정확한 triangle/texture budget과 Khronos glTF Validator/glTF Transform
도입은 Gate 4에서 측정 후 결정한다. V00은 budget 숫자를 임의로 만들지 않는다.

### Legal checklist

- [ ] source, author, license, commercial use, attribution을 기록했다.
- [ ] source URL과 original file reference가 있다.
- [ ] modification history와 normalized by가 있다.
- [ ] `UNKNOWN / DO NOT USE DIRECTLY` source를 production에 넣지 않았다.
- [ ] downloaded/purchased/generated 상태를 accepted로 오인하지 않았다.

## 4. Map and UI review

- [ ] territorial controller는 base fill + boundary로 읽힌다.
- [ ] political influence는 Region pattern + limited hue로 읽힌다.
- [ ] organization은 token silhouette로 읽히며 실제 Faction에서 나온다.
- [ ] ContactGraph는 route/movement로 읽히고 trade/information/migration/border가 혼동되지 않는다.
- [ ] active front는 강한 linear boundary로 읽히며 평화 국경과 구분된다.
- [ ] legal ownership, physical control, political influence, organization, conflict가 하나의 색으로 합쳐지지 않는다.
- [ ] L1 critical, L2 decision, L3 detail hierarchy가 유지된다.
- [ ] 모든 정보가 rounded card로 변환되지 않는다.
- [ ] operational UI가 parchment/fantasy frame에 의존하지 않는다.
- [ ] Historical Artifact에서만 paper/ink/period print/seal 문법을 적극 사용한다.
- [ ] regime change가 core layout/map grammar/interaction language를 reskin하지 않는다.

## 5. Gate 1V debug-first review

Gate 1V 초반에는 final art를 사용하지 않는다.

1. flat/simple LandHex로 physical control과 Region boundary를 확인한다.
2. primitive pattern으로 political influence를 확인한다.
3. simple token으로 actual organization을 확인한다.
4. simple route로 ContactGraph direction/channel을 확인한다.
5. active armed Conflict fixture가 있을 때만 simple front line을 확인한다.
6. 그 다음에만 donor/custom asset과 material/palette를 비교한다.

front가 이해되지 않을 때 explosion/particle/shine을 추가하지 않는다. 먼저
visual encoding 또는 simulation signal을 고친다.

## 6. Visual Benchmark Scene review

benchmark scene은 Capital 또는 politically active area에서 수행한다.

- visible LandHex 6–10은 baseline candidate일 뿐 final density가 아니다.
- 2–3 Regions, houses, road, trees, civic landmark, market, harbor/mine 중 하나를 포함한다.
- actual political influence, Faction token, ContactGraph route를 포함한다.
- actual active armed Conflict fixture가 있을 때만 front를 포함한다.
- Region inspector presentation candidate를 함께 본다.

질문:

- donor origin이 튀는가?
- signature asset이 generic environment보다 지나치게 detailed한가?
- political overlay와 world geometry가 충돌하는가?
- UI와 map이 다른 제품처럼 보이는가?
- 가장 먼저 보이는 요소가 L1/현재 decision과 일치하는가?

## 7. Canonical screenshot and human critique

향후 screenshot regression 후보:

- `CANON-01` Normal
- `CANON-02` High Unrest
- `CANON-03` Revolution
- `CANON-04` Civil War
- `CANON-05` Government Transition
- `CANON-06` Mobile

Playwright baseline은 Gate 2/5 이후에 만든다. Visual Benchmark Scene 이후와
Gate 5/6 polish 전에 external human critique를 수행한다.

질문 예:

- 무엇이 generic AI game처럼 보이는가?
- 어떤 asset이 다른 pack처럼 보이는가?
- 무엇이 가장 먼저 눈에 들어오는가?
- 이유 없이 decorative한 요소는 무엇인가?
- 실제 gameplay signal로 이해한 요소는 무엇인가?

선택적 blind comparison에서 commercial screenshot은 `REFERENCE_ONLY`로만
사용한다. 결과는 source style copy가 아니라 hierarchy/cohesion 개선 근거로만
사용한다.

## 8. Responsive and performance review

- desktop은 map dominant + persistent inspector를 검토한다.
- tablet은 map + sheet/overlay를 검토한다.
- mobile은 map + bottom sheet/focused drill-down을 검토한다.
- desktop layout을 단순 축소해 mobile로 만들지 않는다.
- touch target, safe area, `dvh/svh`, reduced motion, hover 없는 조작을 확인한다.
- simulation tick은 render frame/wall clock과 독립적이어야 한다.
- high-speed playback에서도 simulation correctness보다 visual fidelity를 먼저 낮출 수 있어야 한다.

T024의 full-history validation 잠재 비용은 V00에서 측정 전 최적화하지 않았다.
F01에서 20–40 simulated years(약 7,200–14,400 daily ticks)를 long-run
benchmark했고, F01A에서 canonical continuation incremental validation으로
분리했다. serialize/deserialize trust boundary의 full validation은 유지한다.

## 9. Review result format

각 asset/scene review는 다음을 남긴다.

```text
Review ID:
Scene / Asset:
Simulation evidence:
Semantic channel:
Visual rule / Reference IDs:
Passed checks:
Failed checks:
Provenance status:
Decision: ACCEPTED | REJECTED | NEEDS_NORMALIZATION | NEEDS_EVIDENCE
Reviewer:
Date:
```

실패 언어는 “AI처럼 보인다”로 끝내지 않고 다음처럼 구체화한다:

- inconsistent geometry language
- meaningless decoration
- conflicting semantic channel
- asset-pack mismatch
- unsupported simulation signal
- hierarchy failure
- generic fantasy UI trope
- inconsistent material treatment
- excessive ornamental density

## 10. Semantic world-object readability gate

For the authorized P0 semantic rework, review the exact deployed source at
fresh checkpoints. The reviewer records the source commit, public URL, viewport,
and screenshot path for each row.

| Check | Evidence required | Pass condition |
| --- | --- | --- |
| Project silhouettes | Day implementing and completed captures | food/granary, civic/assembly-hall, and industrial/workshop identities differ; lifecycle is visible without a timer |
| Authored POIs | Day 0 capture plus DOM/model inspection | port, mine, fort/checkpoint, capital-seat, and assembly-hall are recognisable and anchored to existing scenario identity |
| Conflict/controller | first rebellion/territorial-change capture | active rebellion is locatable in under three seconds; controller change is visible without Chronicle |
| Route grammar | Day 0/late capture plus model inspection | trade, information, migration, and border channels use distinct visual language without literal people/cargo |
| Late-world divergence | Day 0 vs 1000+ capture | built/political/conflict layers visibly differ while remaining state-derived |
| Roadmap | roadmap capture | branch hierarchy, enacted, reachable, blocked, and incompatible states read at a glance; no raw IDs |
| HUD/mobile | desktop and 390×844 captures | map remains primary; default HUD does not dominate gaze; no card-wall collapse or horizontal overflow |

The semantic gate may close only with all seven fresh captures and the
automated verification suite. A screenshot generated from an unpushed or
non-deployed local bundle is not production evidence.

## 11. Continuous terrain / content-authoring gate

| Check | Evidence required | Pass condition |
| --- | --- | --- |
| Terrain substrate | Day 0 exact-deployment capture | terrain reads continuously; no dominant raised pillar or always-visible grid |
| Contextual hex | selected-hex and rebellion/front captures | selection/controller/front context reveals the relevant outline without turning on a global board grid |
| Mobile world stage | 390×844 DOM measurements and capture | world stage width ≥94% of usable viewport, height ≥62svh where browser chrome allows, no large surrounding card |
| Title authoring | title screen plus Content Studio edit/preview | all visible title fields have stable IDs and preview updates from local draft |
| Briefing authoring | briefing beat plus Content Studio edit/preview | label, beat eyebrow/title/body, actions are stable records and patch-exportable |
| Runtime boundary | build/source inspection | no runtime LLM/API and no direct admin-to-GitHub write path |
