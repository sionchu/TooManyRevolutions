# TMR Future Direction + ChatGPT / Codex / Git Working Protocol

> 상태: project working agreement / direction synthesis
>
> 이 문서는 기존 `AGENTS.md`, `docs/GDD.md`, `docs/ARCHITECTURE.md`, `docs/bridge/README.md`를 대체하지 않는다. 충돌 시 해당 authoritative 문서와 실제 repository evidence가 우선한다.

---

# Part A. 앞으로의 제품/개발 방향

## A1. 최상위 원칙

TMR은 **텍스트를 읽고 버튼을 누르는 정치 웹앱이 아니라, 시간이 흐르며 정치·이념·세력·영토·제도가 지도 위에서 변화하는 map-first systemic game**이다.

다음 문장을 프로젝트의 UX 기준으로 고정한다.

```text
WORLD FIRST.
THE MAP IS THE GAME BOARD.
REPORTS EXPLAIN; THE WORLD DEMONSTRATES.
```

실행 순서:

```text
Simulation truth
-> observable world change
-> spatial/gameplay feedback
-> player decision
-> explanation on demand
-> art/polish
```

다음 순서는 금지한다.

```text
simulation metric
-> text box
-> button
-> another text box
```

## A2. 현재 P0 우선순위

현재 승인 작업 `GAMEBUILDERS_PRODUCT_SURFACE_P0`는 다음 순서로 완료한다.

### 1) Gameplay Reality repair

필수:
- system-generated `ActionProposal` carry loop 연결
- existing ideology diffusion을 hands-on demo runtime에 연결
- current physical `LandHex.controller` 변화를 지도에서 명확히 표현
- current active Conflict를 persistent하게 표현
- routine event spam보다 significant political event를 우선
- real Policy action을 player-facing gameplay에 연결
- consolidation objective와 actual blockers를 보여줌

검증 질문:

```text
Day 0과 Day 1000을 스크린샷으로 비교했을 때
설명 없이도 다른 세계라는 것을 알 수 있는가?
```

NO면 P0는 통과하지 않는다.

### 2) Map-first world / renderer

Map이 persistent gameplay viewport의 중심이어야 한다.

Desktop:
- world/map approximately 70%+ visual priority
- compact HUD
- contextual drawers

Mobile:
- map first
- bottom sheet/details on demand
- no stacked desktop cards

Renderer 방향:

```text
Simulation authority: existing TMR TypeScript
App/UI/admin: React DOM
World renderer candidate: PixiJS v8 + @pixi/react v8
Camera candidate: pixi-viewport
```

Pixi adoption은 bounded spike 후 결정한다.

Spike가 실패/위험하면:
- SVG를 production renderer 하나로 유지
- WorldVisualDelta/camera/game-feel을 SVG에 적용
- engine migration은 P1로 기록

Phaser/Three/R3F 등 다른 engine/framework는 architecture migration을 자동 정당화하지 않는다. 채택은 문제/대안/비용/rollback을 `docs/DECISIONS.md`에 기록해야 한다.

## A3. 지도에서 반드시 보여야 하는 변화

지도는 legal geography만 보여주는 atlas가 아니다.

Layer별 의미를 분리한다.

```text
legal owner
current physical controller
Region political/ideology influence
faction/organization presence (authoritative only)
contact/trade/information routes
active conflicts / derived fronts
state projects / landmarks
current focus / alerts
```

원칙:

```text
Legal ownership != physical control
Ideology influence != territorial control
Region.stateControl != territorial ownership
```

반란이 territory를 장악하면 map에서 즉시 알아볼 수 있어야 한다.

## A4. 역동감: WorldVisualDelta

State/Event 변화와 visual feedback을 연결하는 presentation-only delta pipeline을 둔다.

예:

```text
IDEOLOGY_SUPPORT_CHANGED
-> affected Region pattern/tint interpolation
-> factual source/destination route pulse

LAND_HEX_CONTROL_CHANGED
-> changed territory controller transition

BORDER_CLOSED / REOPENED
-> route fade / reopen pulse

REBELLION_STARTED
-> affected factual Region focus / persistent conflict state

INSTITUTION_RULE_CHANGED
-> institutional roadmap transition

INTERVENTION_STARTED / COMPLETED
-> map-linked state project lifecycle visualization
```

금지:
- 정치 이벤트가 없는 랜덤 군중/군대/폭발 애니메이션
- 존재하지 않는 front/army/project를 화면에 생성
- presentation animation으로 simulation outcome을 암시

## A5. 제도 progression: Institutional Roadmap

사용자가 원하는 "테크 트리 타는 맛"은 수용하되, TMR의 architecture와 결합한다.

`Institutional Roadmap`은 실제 Policy graph의 시각화다.

노드 상태:

```text
AVAILABLE
ACTIVE / ENACTED
BLOCKED_BY_PREREQUISITE
BLOCKED_BY_INCOMPATIBILITY
CURRENT_INSTITUTIONAL_STATE
```

경로는 실제:
- prerequisite
- incompatible policies
- institutional rules
- treasury/admin/political feasibility

에서 나온다.

금지:
- research points
- reform points
- political mana
- ideology tech XP
- chapter/focus-tree authority
- scripted historical path

즉 "tech-tree UX"는 쓰되 "tech-tree authority"는 쓰지 않는다.

## A6. Wonder-like feedback: State Projects

2~4개 정도의 기억에 남는 map-linked project를 우선 구현한다.

기존 authoritative action/lifecycle을 활용한다.

예시 archetype:
- 식량 배급 / 곡창 네트워크
- 산업/공공사업
- 의회/헌정 landmark
- 행정/통신 프로젝트 (기존 intervention semantics가 있는 경우)

Presentation lifecycle:

```text
not started
-> authoritative intervention active
-> existing duration based implementation state
-> authoritative completion
-> persistent visible landmark/trace
```

완료 후 map이 실제로 이전과 다르게 보여야 한다.

## A7. 게임 이론 적용 규칙

게임 이론은 설명문으로 노출하는 것이 아니라 **선택의 구조**에 적용한다.

적용 lens:
- opportunity cost
- externality
- strategic reaction
- coordination / collective action
- credible commitment
- signaling / uncertainty
- principal-agent tension

Default decision UI:

```text
Decision name
cost chips
2–4 concrete effect arrows
who/where affected
execute
```

긴 설명과 uncertainty reasoning은 `자세히`에서 제공한다.

금지:
- universal utility score
- fake probability
- Nash/CFR/MCTS/RL/QRE solver를 player-facing core mechanic으로 도입
- faction 이름/이념에서 근거 없는 preference 추론

## A8. Art / visual language

AI-generated art는 단발성 이미지 모음이 아니라 design system에 속해야 한다.

Required stack:

```text
Design Tokens
-> Semantic Tokens
-> Design Registry
-> Asset Manifest
-> Layer Registry
-> Components
-> Screen Composition
-> State/Crisis Overlays
```

모든 production asset은 stable semantic ID를 갖는다.

AI asset metadata:
- style family
- prompt recipe ID
- version
- source/provenance
- intended layer
- crop/aspect policy
- responsive notes
- replaceable flag

원칙:
- 전체 UI를 한 장의 AI 배경으로 bake하지 않는다.
- generated raster 안에 essential text를 넣지 않는다.
- country crest / terrain / landmark / UI ornament를 개별 교체 가능하게 관리한다.

## A9. Content Studio / Admin

Gameplay UI는 admin처럼 보이면 안 되지만, **Content Studio는 admin UI여도 된다.**

Development-only route example:

```text
?contentStudio=1
```

관리 대상:
- title/tagline
- opening briefing
- tutorial/help
- HUD labels/tooltips
- Policy names/descriptions
- Intervention names/descriptions
- event presentation templates
- Agenda text
- Country/Region/Faction/Ideology display names
- objective/result copy
- project/landmark copy
- branch/variant presentation copy

Content records use stable IDs and metadata.

기능:
- search
- filter
- inline edit
- preview
- baseline/edit diff
- variable validation
- length warning
- local draft
- reset
- JSON patch import/export

Static Site에서는 GitHub commit 기능을 가장하지 않는다.

Canonical editing flow:

```text
Content Studio
-> export JSON patch
-> ChatGPT/Codex applies patch to repository
-> Git diff review
-> deploy
```

## A10. Gate 복구 원칙

GameBuilders deadline 때문에 Gate 1V를 사실상 건너뛰며 product shell을 먼저 붙인 것이 주요 원인 중 하나였다.

앞으로 큰 기능/시각 추가 전에는 최소한 다음을 수행한다.

```text
same authoritative simulation
-> fast map timelapse
-> visual state comparison
-> counterfactual paths
-> human hands-on observation
```

Gate 1V 핵심 질문:

- map 자체를 보고 변화가 이해되는가?
- ideology가 spatially 움직이는가?
- organization/crisis가 선행 조건과 연결돼 보이는가?
- territory/front가 움직이는가?
- different decisions produce visibly different histories인가?
- report를 읽지 않아도 중요한 변화가 보이는가?

아니면 final art/HUD로 덮지 않는다.

---

# Part B. ChatGPT / Codex / Git 규약

## B1. Source of Truth

권위 순서:

```text
1. Actual repository source / tests / diffs / Git history
2. docs/bridge/STATE.md
3. Current/historical Bridge task/result docs
4. Conversation snapshots / old chat context
```

Product/design 결정:
- `docs/GDD.md` authoritative

Implementation boundaries:
- `docs/ARCHITECTURE.md` authoritative

Agent working rules:
- root `AGENTS.md` authoritative

QA/playtest:
- `docs/QA_PLAYTEST.md`

## B2. 역할

### ChatGPT

ChatGPT가 담당:
- repo/Bridge 실제 상태 확인
- next task 작성/수정
- acceptance criteria 정의
- external reference/research
- Codex 결과의 실제 GitHub diff 독립 검토
- PASS / REJECT 결정
- 다음 task authorization
- Content Studio patch 적용/검토 workflow 관리

ChatGPT는 Codex result 문구만 믿고 PASS하지 않는다.

### Codex Desktop

Codex가 담당:
- `docs/bridge/CURRENT_TASK.md` 읽기
- task/addenda 전체 확인
- active authorized branch에서 구현
- 테스트/build/QA
- safe checkpoint commit/push
- result doc 작성
- 실제 GitHub에 review 가능한 결과 publish

Codex는 다음 task를 self-authorize하지 않는다.

### User

정상 workflow에서 사용자는 Git 명령/SHA를 관리할 필요가 없다.

사용자 인터페이스는 최대한:

```text
ChatGPT가 task 발행
-> 사용자가 Codex에 "CURRENT_TASK 읽고 진행" 전달
-> Codex 구현
-> 사용자 "완료" 보고
-> ChatGPT GitHub 독립 검토
```

로 유지한다.

## B3. Normal Bridge workflow

```text
ChatGPT writes authorized task to GitHub Bridge
-> Codex Desktop reads CURRENT_TASK
-> Codex implements/tests on authorized branch
-> Codex commits/pushes
-> user reports completion
-> ChatGPT inspects actual GitHub branch/diff/tests/result
-> PASS or REJECT
-> only PASS permits successor authorization
```

예외: 하나의 task 안에 명시적으로 continuous checkpoints가 승인된 경우 Codex는 그 내부 checkpoint 사이에서 사용자 확인을 기다릴 필요가 없다.

## B4. Git 규칙

허용:
- `git fetch`
- normal `git push`
- task/review branch publish
- safe checkpoint commits

기본 금지:
- force push
- reset으로 사용자 작업 폐기
- 임의 rebase
- history rewrite
- Bridge metadata 맞추기 위해 implementation history를 파괴

master의 Bridge metadata가 별도로 전진해 implementation branch와 fast-forward가 안 맞으면:

```text
reviewed predecessor에서 시작한 dedicated task/review branch에 publish
```

한다.

Bridge task를 읽기 위해 exact-SHA ritual이나 수동 user Git 작업을 매번 요구하지 않는다.

## B5. Branch 규칙

현재 작업:

```text
TASK: GAMEBUILDERS_PRODUCT_SURFACE_P0
BRANCH: gamebuilders-product-surface-p0
```

Codex는 이 작업을 해당 branch에서 계속한다.

ChatGPT가 predecessor를 review/accept하기 전에는:
- successor branch 구현 금지
- F05_FIX25 production implementation 금지

별도 작업 branch의 결과를 자동 merge/통합했다고 가정하지 않는다.

## B6. Task 규칙

Task에는 최소한 다음이 있어야 한다.

```text
TASK_ID
STATUS
BASE / WORK BRANCH
mission
required outcomes
hard boundaries
verification
result path
stop condition
```

Addendum은 기존 task를 강화할 수 있다.

현재 task에서 later addendum가 earlier wording과 충돌하면, `CURRENT_TASK.md`에 정의된 precedence/order를 따른다.

## B7. Codex 구현 원칙

구현 전에:

1. `AGENTS.md`
2. relevant GDD/ARCHITECTURE/QA
3. `docs/bridge/CURRENT_TASK.md`
4. current task + addenda
5. current branch/code

를 확인한다.

그 후:

```text
state boundary
-> smallest coherent slice
-> implementation
-> tests
-> build
-> behavior verification
-> checkpoint commit/push
```

framework-building 자체를 목표로 하지 않는다.

## B8. Review 규칙

ChatGPT의 완료 검증은 최소 다음을 본다.

- actual branch HEAD
- predecessor 대비 compare diff
- changed-file scope
- runtime implementation, not result doc only
- focused tests
- broader regression/build where needed
- player-observable behavior
- deployed Site when relevant

제품 task의 PASS에는 test green만으로 부족하다.

특히 TMR에서는:

```text
map/world behavior
hands-on play
visual dynamics
decision clarity
responsive behavior
```

를 함께 본다.

## B9. Documentation 위치 규칙

새 project handoff/snapshot/protocol 문서는 `docs/` 아래에 둔다.

Bridge runtime metadata:

```text
docs/bridge/
```

Task/result:

```text
docs/bridge/tasks/
docs/bridge/results/
```

일반적으로 root에 임시 `HANDOFF.md`를 만들지 않는다. Repo root는 `AGENTS.md`, build/config/source navigation 등 실제 repository root 역할을 유지한다.

## B10. Architecture hard boundaries

지속적으로 유지:

- player = Country continuity, not ruler/government
- Government transition alone != defeat
- State Dissolution only terminal defeat
- physical territory authority = `WorldState.landHexStates[*].controller`
- Region.stateControl != territorial ownership
- fronts derived
- no direct UI/renderer WorldState mutation
- no fake/scheduled crisis
- no fake Agenda/EventStore
- LLM cannot directly mutate authoritative state
- no generic policy/reform/political mana
- no hidden countdown/story progression
- no focus-tree authority
- no solver/universal utility score
- no invented armies/fronts/crowds/projects absent from state
- no persistence V9 without separate authorization
- no V02 before Gate 1F PASS

## B11. Current project snapshot

As of 2026-08-26:

```text
Core accepted: F05_FIX23
Persistence: V8
Gate1F: NOT_READY
V02: NOT_STARTED
GameBuilders vertical slice: technical PASS
Current authorized task: GAMEBUILDERS_PRODUCT_SURFACE_P0
Current work branch: gamebuilders-product-surface-p0
F05_FIX24: separate branch, awaiting ChatGPT review
F05_FIX25 implementation: NOT AUTHORIZED
```

The current P0 includes these mandatory addenda:

```text
MAP_FIRST
GAMEPLAY_REALITY
GAME_FEEL_ENGINE_CONTENT_STUDIO
GAME_VISUAL_UX_RENDER
```

## B12. Definition of progress

TMR에서 progress는 commit 수나 UI 양이 아니다.

진짜 progress:

```text
player makes a real choice
-> authoritative state changes
-> actors react
-> world/map visibly changes
-> player notices without reading a report
-> player understands enough to choose again
```

이 loop가 강해지는 변경을 우선한다.
