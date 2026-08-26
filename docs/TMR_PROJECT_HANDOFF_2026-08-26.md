# Too Many Revolutions — Project Handoff / Conversation Record

**작성일:** 2026-08-26  
**프로젝트:** 《내 왕국에 혁명이 너무 많다》 / `TooManyRevolutions`  
**Repository:** `sionchu/TooManyRevolutions`  
**목적:** 현재 대화에서 확정된 판단, GameBuilders 대응 방향, 제품/게임성 문제, 앞으로의 구현 순서, ChatGPT ↔ Codex ↔ Git 운영 규약을 한 문서에 보존한다.

> 이 문서는 채팅 원문 verbatim export가 아니라, 현재 스레드에서 실제 의사결정과 피드백, 검증 결과, 승인된 방향을 잃지 않기 위한 handoff 기록이다.
>
> 권위 충돌 시 이 문서보다 실제 repository source/tests/Git history, `docs/bridge/STATE.md`, 현재 Bridge task/result, `docs/GDD.md`, `docs/ARCHITECTURE.md`, root `AGENTS.md`가 우선한다.

---

# 1. 변하지 않는 제품 정체성

## 1.1 제목

- 한국어: **내 왕국에 혁명이 너무 많다**
- 영어: **TOO MANY REVOLUTIONS**
- Tagline: **정권은 무너져도, 국가는 계속된다.**

임의로 `Fantasy State Simulator`, `Gate 0`, 다른 가제/서브브랜드를 player-facing 화면에 다시 노출하지 않는다.

## 1.2 플레이어 판타지

플레이어는 왕, 대통령, 장군, 정당 지도자가 아니다.

플레이어는 **하나의 국가가 역사적으로 계속 존재하도록 만드는 주체**다.

따라서 다음은 게임오버가 아니라 역사적 사건이다.

- 왕조 붕괴
- 정부 교체
- 선거 패배
- 쿠데타
- 혁명
- 왕정 폐지
- 공화정 전환
- 독재정 성립
- 내전에서 현 정부 패배
- 일시적 수도 상실
- 점령

유일한 terminal defeat는 **State Dissolution / 국가 소멸**이다.

승리는 특정 이념 100%가 아니라 **새로운 질서의 정착(Order Consolidation)** 이다.

## 1.3 원래 핵심 플레이 감정

플레이어가 반복적으로 느껴야 하는 것은 다음이다.

- “내가 규칙을 바꾸니까 세계가 움직인다.”
- “좋아진 줄 알았는데 다른 데서 터졌다.”
- “저 사상이 왜 저 길을 따라 퍼지는지 보인다.”
- “저 세력이 지금 왜 저 행동을 하는지 이해할 수 있다.”
- “정권은 무너졌는데 국가는 계속된다.”
- “다음 판에는 완전히 다른 제도 조합을 만들어보고 싶다.”

---

# 2. 원래 GDD의 게임 형태 — MAP FIRST

이 프로젝트는 텍스트 어드벤처나 행정 dashboard가 아니다.

핵심 제품 원칙:

```text
WORLD FIRST
THE MAP IS THE GAME BOARD
POLICIES CHANGE WHAT PEOPLE DO
SYSTEMS CREATE EVENTS
PLAYER ACTION MUST PRODUCE VISIBLE CONSEQUENCES QUICKLY
FAST OBSERVATION, SLOW DECISION
```

특히 다음 gameplay 형태를 피한다.

```text
READ -> BUTTON -> READ -> REPORT
```

보고서는 설명한다. **세계가 먼저 증명해야 한다.**

## 2.1 공간 계약

```text
정치는 Region에서 계산된다.
영토는 LandHex 위에서 움직인다.

사상은 Region 사이를 퍼진다.
전선은 LandHex 위를 움직인다.

사상은 색과 문양으로 퍼지고,
조직은 지도 위의 실제 marker가 되며,
혁명은 영토가 된다.
```

### Region
정치/경제 aggregate.

### LandHex
물리 영토 통제와 전선의 substrate.

### 절대 금지
- `Region.stateControl`을 영토 소유로 사용
- 이념 수치를 Hex마다 복제해서 가짜 전염 cell 생성
- 실제 Faction/organization state 없는 군중/조직 marker 발명
- 실제 controller가 아닌 UI용 가짜 영토 변경
- 쿠데타가 났다고 자동으로 지도 전체 국가색 변경

---

# 3. GameBuilders 직전 목표 변경

Gate1F는 아직 `NOT_READY`였고 장기 pacing/late-state silence가 남아 있었다.

GameBuilders까지 시간이 매우 부족해지면서 목표를 다음과 같이 변경했다.

기존 목표:

```text
F05 FIX progression
-> Gate1F 완결
-> 다음 visual gate
```

GameBuilders 긴급 목표:

```text
검증된 core를 freeze
-> 실제 플레이 가능한 vertical slice
-> map-first product surface
-> graphics / UX / sound
-> Sites 배포
-> 3분 영상
```

FIX23 / V8을 안정 core 기준점으로 삼고, deeper F05 작업은 행사 대응 중 일시 정지했다.

---

# 4. 첫 Demo Sprint 결과

`GAMEBUILDERS_DEMO_SPRINT_01`에서 다음을 만들었다.

- 타이틀
- 게임 시작/reset
- deterministic demo scenario
- pause/play/1x/2x/3x
- 실제 Intervention action
- HUD
- SVG map
- Agenda
- EventStore 표시
- 간단한 sound
- responsive check
- ChatGPT Sites 배포
- 0~20년 horizon audit
- 3분 shot list

기술적으로는 실제 core 위에서 움직이는 thin client였다.

하지만 hands-on 검토 결과 제품적으로는 다음 문제가 드러났다.

- 텍스트 기반 웹게임/관리자 dashboard 느낌
- map이 작은 hex strip에 가까움
- 세계/주변국 존재감 부족
- 게임을 왜 해야 하는지 첫인상이 약함
- 그래픽/asset 방향이 약함
- “게임을 한다”보다 “시뮬레이션 수치를 본다”는 느낌
- 긴 시간 진행 시 실제 세계가 살아 움직인다는 인상이 없음

---

# 5. P0 Product Surface Sprint로 전환

현재 승인 작업:

```text
TASK_ID: GAMEBUILDERS_PRODUCT_SURFACE_P0
WORK_BRANCH: gamebuilders-product-surface-p0
```

현재 Bridge는 P0를 다섯 문서의 누적 작업으로 정의한다.

1. `GAMEBUILDERS_PRODUCT_SURFACE_P0.md`
2. `GAMEBUILDERS_PRODUCT_SURFACE_P0_MAP_FIRST_ADDENDUM.md`
3. `GAMEBUILDERS_PRODUCT_SURFACE_P0_GAMEPLAY_REALITY_ADDENDUM.md`
4. `GAMEBUILDERS_PRODUCT_SURFACE_P0_GAME_FEEL_ENGINE_CONTENT_STUDIO_ADDENDUM.md`
5. `GAMEBUILDERS_PRODUCT_SURFACE_P0_GAME_VISUAL_UX_RENDER_ADDENDUM.md`

뒤의 addendum가 앞의 약한 해석을 강화한다.

---

# 6. 실제 hands-on에서 발견한 핵심 문제

## 6.1 “천일 넘게 지나도 아무 변화가 없는 것 같다”

모바일 hands-on에서 Day ~1528까지 흘렸지만 사용자는 다음처럼 느꼈다.

- 국고 숫자는 떨어짐
- 반란/쿠데타 텍스트가 있었던 것 같음
- 지도는 거의 그대로
- 세계가 움직였다는 증거가 없음
- 대부분 텍스트가 실제 gameplay가 아니라 설명문처럼 느껴짐

이 피드백은 UI 취향 문제만이 아니었다.

코드 검토 결과 실제 orchestration/presentation gap이 있었다.

## 6.2 System ActionProposal carry loop 누락

Faction / foreign-state system은 다음 tick의 structured `ActionProposal`을 생성할 수 있다.

하지만 초기 demo runtime은 `runSimulationStep()` 결과를 commit하고 `actionProposals`를 다음 tick input으로 carry하지 않았다.

결과적으로:

```text
세력: ORGANIZE/BARGAIN/FUND_MOVEMENT 등을 결정
-> proposal 생성
-> 실제 다음 tick action으로 연결되지 않음

외국: 국경 폐쇄/재개 같은 행동을 결정
-> proposal 생성
-> 실제 다음 tick action으로 연결되지 않음
```

즉 세계 actor가 “생각”은 하지만 실제 player runtime에서는 행동이 사라질 수 있었다.

이것은 신규 AI 시스템 요구가 아니라 **기존 시스템의 runtime orchestration defect**다.

## 6.3 Ideology Diffusion runtime 연결 누락

이미 구현된 ideology diffusion은 ContactGraph를 따라 월간 정치사상 확산을 수행할 수 있다.

하지만 초기 GameBuilders runtime hook에는 이 phase가 연결되지 않았다.

따라서 이 게임의 대표 fantasy:

```text
외국의 정치적 성공/사상
-> 교역/정보/국경 contact
-> 인접 Region
-> 더 먼 Region
-> Faction / 정치 압력
```

이 실제 플레이에서 거의 보이지 않았다.

## 6.4 지도에서 Owner와 Controller가 분리되지 않음

법적 소유:

```text
Region.ownerCountryId
```

물리적 영토 권위:

```text
WorldState.landHexStates[*].controller
```

그런데 초기 정치 지도는 주로 법적 owner 색을 사용했다.

따라서 반란 faction이 실제로 LandHex를 장악해도 지도 기본색이 거의 그대로일 수 있었다.

향후 지도는 최소 다음 두 레이어를 구분해야 한다.

```text
Legal/Historical Ownership
+
Current Physical Controller
```

현재 controller 변화는 눈으로 바로 보이는 주요 gameplay feedback이어야 한다.

## 6.5 Active conflict가 화면에서 사라질 수 있음

초기 UI는 최근 몇 개 EventStore event에서 `REBELLION_STARTED` / `COUP_ATTEMPT_STARTED`를 찾아 crisis UI를 만들었다.

하지만 routine event가 계속 추가되면 start event는 최근 window 밖으로 밀려난다.

따라서 active conflict는 Event history가 아니라 **현재 `world.conflicts`**에서 projection해야 한다.

반란이 수년째 active라면 시작 event가 오래됐어도 지도/HUD에서 계속 보여야 한다.

## 6.6 Chronicle이 routine churn에 묻힘

`TICK_ADVANCED`, 경제/자원 변화 같은 routine event와 정치적 중요한 사건을 동일하게 보여주면 “일어난 일”이 보이지 않는다.

Player-facing timeline은 EventStore를 바꾸지 않고 **significant-event projection**으로 별도 제공한다.

## 6.7 “불안 0” 같은 값이 player-facing에서 잘못 읽힘

국가 instability가 낮거나 0이라고 해서 국가가 안전한 것이 아니다.

현재 집계 semantics상 통제 지역이 줄어들면 national instability와 영토 붕괴 상황이 직관적으로 일치하지 않을 수 있다.

따라서 top HUD에서 다음을 더 중요하게 보여야 한다.

- 현재 player-controlled LandHex / legal LandHex
- active conflict count / kind
- capital control
- current institution / key pressure
- treasury / administrative headroom

어떤 단일 수치도 universal health score처럼 보여주지 않는다.

## 6.8 실제 Policy gameplay surface 부족

TMR의 fantasy는 단순 crisis response가 아니라 **제도를 바꾸는 것**이다.

코어에는 이미 `PolicyDefinition`과 `ENACT_POLICY` action path가 있다.

예:
- 왕의 거부권
- 왕의 거부권 폐지
- 선거권
- 보통선거
- 생산수단 소유
- 국유화/사유화 관련 규칙

P0는 Intervention뿐 아니라 실제 Policy를 player action으로 노출해야 한다.

---

# 7. “게임 이론” 적용 방식 수정

초기 P0 UI는 게임 이론을 설명문으로 너무 많이 드러냈다.

예:

- 확정 비용
- 확정 변화
- 현재 관측
- 미확정 반응
- 기회비용
- 기다림 비용

이런 요소를 카드마다 장문으로 보여주면 정치학 report처럼 보인다.

앞으로 원칙:

**게임 이론은 텍스트로 설명하는 것이 아니라 선택 구조로 체감시킨다.**

기본 decision UI:

```text
[정책명]

국고 -120
행정 15
18일

노동자회 불만 ↓
수비평의회 불만 ↑
정치 경쟁 -> 다원

[시행]
[자세히]
```

`자세히`에서만 full causality / current observation / uncertainty를 보여준다.

금지:

- universal utility score
- Nash/CFR/MCTS/RL/QRE solver
- fake faction response %
- “80% 확률로 반란” 같은 근거 없는 예측
- faction 이름/이념 label만 보고 preference 발명

---

# 8. 앞으로의 메인 제품 방향

## 8.1 전체 화면 구조

TMR 메인 화면은 Plague Inc. / Rebel Inc.처럼 **persistent world map이 주 무대**여야 한다.

Desktop:

```text
compact top state/time rail

              LIVING WORLD MAP
              LIVING WORLD MAP
 contextual    LIVING WORLD MAP       actions
   panel       LIVING WORLD MAP       drawer

compact navigation / timeline
```

목표:
- world stage >= 약 70% visible gameplay area
- 지도는 viewport edge 가까이 차지
- permanent 3-column text wall 금지
- HUD / drawer는 map을 둘러싸거나 위에 뜬다

Mobile:

```text
minimal status
[ FULL MAP ]
[ FULL MAP ]
[ FULL MAP ]

지도 | 국정 | 제도 | 결정 | 기록
```

긴 responsive webpage처럼 카드가 아래로 쌓이지 않는다.

## 8.2 지도에서 보여야 하는 변화

플레이어가 텍스트를 안 읽어도 알아야 한다.

- 이념 support 변화 -> Region overlay color/pattern 변화
- contact -> route pulse
- faction 조직 -> factual marker
- border closed -> route lock/fade
- rebellion -> persistent crisis focus
- LandHex controller change -> 영토색/패턴 sweep
- front -> actual derived front
- completed state project -> permanent landmark
- institution change -> capital/institution visual trace
- government transition -> header/crest/government identity transition
- no fake event/army/crowd/front

---

# 9. Policy “Tech Tree”는 Institutional Roadmap으로 만든다

사용자 피드백:

> 정책을 테크 트리처럼 타고 그에 따라 원더 같은 것도 생기면 게임하는 맛이 날 것 같다.

이 방향은 채택하되 TMR architecture와 충돌하지 않도록 다음과 같이 정의한다.

## 9.1 허용

**Institutional Roadmap**

기존 `PolicyDefinition`의 실제 prerequisite / incompatibility / current rule을 시각 graph로 보여준다.

상태:

```text
AVAILABLE
ENACTED
BLOCKED_BY_PREREQUISITE
BLOCKED_BY_INCOMPATIBILITY
CURRENT_INSTITUTION
```

예:

```text
왕의 거부권
-> 거부권 폐지
-> 의회 권한 확대
-> 보통선거
```

단, 실제 `PolicyDefinition` prerequisite가 있을 때만 edge를 만든다.

## 9.2 금지

- research point
- reform point
- policy mana
- ideology XP
- arbitrary “시대” unlock
- story focus tree
- 미리 정해진 revolution chapter
- 특정 이념을 end-tier로 두는 progression

즉 “테크트리의 시각적 쾌감”은 사용하되, authoritative progression은 실제 법/제도 상태다.

---

# 10. Wonder 느낌은 State Project / Landmark로 만든다

2~4개만 강하게 만든다.

기존 Intervention/Policy에서 실제 lifecycle/effect가 있는 것만 map-linked project로 연결한다.

예시 archetype:
- 긴급 배급망 / 곡창 네트워크
- 산업/공공 사업
- 헌정의회/의회 건물
- 행정/통신 거점

## 10.1 lifecycle

```text
not started
-> intervention started
-> implementation
-> completed
```

진행률은 기존 intervention duration의 elapsed tick projection일 뿐이다.

별도 construction timer를 만들지 않는다.

## 10.2 완료 후

실제 target Region 또는 defensible presentation anchor에 permanent visual trace를 남긴다.

플레이어는 게임 후반 지도만 보고도:

> “이 나라를 내가 이렇게 바꿨다.”

를 느껴야 한다.

---

# 11. 게임 엔진 / 웹 렌더러 방향

## 11.1 유지해야 할 것

Authoritative simulation:

```text
기존 TypeScript simulation core
```

React DOM:
- menus
- drawers
- Institutional Roadmap
- Content Studio
- accessibility
- admin/editor UI

## 11.2 P0 renderer spike

우선 후보:

```text
PixiJS v8
@pixi/react v8
pixi-viewport
```

목표:
- map world stage만 GPU renderer
- pan / zoom / pinch
- texture/sprite layers
- controller tween
- ideology overlay
- route pulse
- camera focus
- responsive resize

## 11.3 Phaser

평가 가능하지만 P0에서 simulation 전체를 Phaser로 이식하지 않는다.

TMR은 이미:
- time pipeline
- action pipeline
- WorldState
- EventStore
- replay/persistence

를 갖고 있다.

Phaser game loop가 authoritative clock을 새로 소유하면 안 된다.

## 11.4 실패 시

Pixi spike가 deadline을 위협하면:

```text
production: 단일 SVG renderer 유지
P1: Pixi migration
```

단, SVG에서도 WorldVisualDelta / camera / map-first 원칙은 구현한다.

두 renderer를 반쯤 만든 채 shipping하지 않는다.

---

# 12. WorldVisualDelta / Game Feel

두 consecutive PresentationState/EventStore snapshot 사이 factual delta를 presentation-only queue로 만든다.

개념:

```text
WorldVisualDelta
MapFeedbackQueue
```

예:

```text
IDEOLOGY_SUPPORT_CHANGED
-> destination Region pattern interpolation
-> source/target route pulse

LAND_HEX_CONTROL_CHANGED
-> territory controller sweep

BORDER_CLOSED
-> route fade + lock

REBELLION_STARTED
-> region crisis pulse

INTERVENTION_STARTED
-> project implementation marker

INTERVENTION_COMPLETED
-> landmark reveal

INSTITUTION_RULE_CHANGED
-> roadmap node transition + seal

GOVERNMENT_TRANSITIONED
-> header/government transition only
```

모든 semantic animation은 실제 state/event에서만 나온다.

ambient map noise/light 같은 비정치적 연출은 허용한다.

---

# 13. Asset / Design DB화 규약

화면을 한 번 예쁘게 만드는 것이 목적이 아니다.

**부분 수정 가능해야 한다.**

구조:

```text
Design Tokens
-> Semantic Tokens
-> Design Registry
-> Asset Manifest
-> Layer Registry
-> Component Registry
-> Screen Composition
-> State / Crisis Overlay
```

Stable semantic ID를 사용한다.

예:

```text
tmr.brand.logo.primary
tmr.country.arken.crest
tmr.country.veloria.crest
tmr.map.terrain.mountain.01
tmr.map.landmark.granary.arken.01
tmr.layer.map.terrain
tmr.layer.map.political
tmr.layer.map.controller
tmr.layer.map.ideology
tmr.layer.map.routes
tmr.layer.map.landmarks
tmr.component.hud.state-rail
tmr.component.policy.roadmap-node
```

파일 이름/배열 순서가 identity가 되면 안 된다.

AI generated asset metadata:
- stable ID
- path
- version
- style family
- prompt recipe ID
- source/provenance
- license
- aspect/crop policy
- responsive usage
- replaceable flag

AI 이미지 안에 중요한 UI text를 rasterize하지 않는다.

---

# 14. Anti-AI-Slop Art Direction

하나의 visual family만 유지한다.

현재 방향:

```text
late-19th / early-industrial fantasy constitutional crisis
+
engraved political atlas
+
lithographic newspaper / royal dossier
+
restrained gouache
```

주 색감:
- aged parchment
- charcoal ink
- oxblood crimson
- desaturated indigo
- muted brass

금지:
- random glossy mobile fantasy card
- 보라색 마법 glow 남발
- anime
- photorealistic unrelated portraits
- neon
- glassmorphism
- 랜덤 steampunk gear
- 생성 이미지마다 스타일이 바뀌는 asset pack

---

# 15. Content Studio / Admin UI

사용자는 player-facing 문구를 source file을 찾지 않고 직접 검토/수정할 수 있어야 한다.

예상 진입:

```text
?contentStudio=1
```

이 화면은 **admin tool처럼 보여도 된다.**

게임 본화면만 admin/dashboard처럼 보이면 안 된다.

## 15.1 관리 대상

- title/tagline/subtitle
- opening briefing
- tutorial/help
- HUD labels/tooltips
- Country/Region/Faction/Ideology display name
- Policy name/description
- Intervention name/description
- event presentation template
- Agenda labels
- victory/defeat/objective text
- State Project/landmark copy
- variant/condition별 문구

## 15.2 Stable Content ID

예:

```text
content.ko.title.main
content.ko.opening.beat.01
content.ko.policy.abolish-veto.name
content.ko.policy.abolish-veto.description
content.ko.event.rebellion-started.title
content.ko.country.arken.name
```

권장 metadata:

```text
id
locale
category
screen
entityType
entityId
variantId
text/template
allowedVariables
maxRecommendedLength
notes
tags
revision
```

## 15.3 기능

- search
- category/filter
- entity/filter
- branch/variant filter
- inline edit
- live preview
- baseline vs edited diff
- variable validation
- length warning
- duplicate/missing ID audit
- local draft persistence
- reset one / reset all
- JSON patch import
- JSON patch export
- copy patch

정적 Site에서 바로 GitHub commit을 하는 척하지 않는다.

P0 workflow:

```text
Content Studio edit
-> JSON patch export
-> ChatGPT/Codex가 repository에 적용
-> redeploy
```

---

# 16. 현재 P0의 필수 완료 기준

정적 art가 예뻐졌다고 P0 PASS가 아니다.

다음이 필요하다.

```text
SYSTEM_PROPOSAL_CARRY_LOOP: implemented/tested
IDEOLOGY_DIFFUSION_IN_RUNTIME: enabled
FACTION_AUTONOMOUS_ACTIONS: visible or honest no-action state
FOREIGN_AUTONOMOUS_ACTIONS: visible or honest no-action state

CURRENT_CONTROLLER != OWNER visual distinction
ACTIVE_CONFLICT persistent presentation
SIGNIFICANT_EVENT projection
PLAYER_POLICY_ACTIONS
INSTITUTIONAL_ROADMAP
CONSOLIDATION objective/blockers

STATE_PROJECT presentation
completed project -> map visible trace

WORLD_VISUAL_DELTA pipeline
factual map motion
camera pan/zoom/focus

CONTENT_STUDIO
stable content IDs
JSON import/export

WEB DASHBOARD FEEL: NO
MAP PRIMARY VIEWPORT: YES
MOBILE STACKED CARD PAGE: NO

Day 0 != Day 90 != Day 360 != Day 720
Day 1000 must not look identical to Day 0
```

---

# 17. P0 Dynamics Audit

기존 “버튼이 하나 남아 있으면 interactive” 판정으로는 부족하다.

실제 player-visible audit checkpoint:

```text
Day 0
Day 30
Day 90
Day 180
Day 360
Day 720
Day 1080
```

각 구간에서 기록:

- meaningful player-facing event count
- Agenda signature
- policy/institution change
- faction strategy/action change
- foreign action/contact change
- ideology support/diffusion
- active conflicts
- LandHex controller change
- player controlled territory count
- map-visible state signature
- player decision signature
- objective blockers
- run outcome

분류:

```text
INTERNAL_CHANGE_NOT_PRESENTED
PRESENTATION_ONLY_CHANGE
PLAYER_OBSERVABLE_SYSTEM_CHANGE
STRUCTURAL_STALL
```

---

# 18. 반응형 규약

Desktop / tablet / mobile은 같은 state를 다른 composition으로 보여준다.

## Desktop
- full map
- contextual side sheets
- compact HUD

## Tablet
- map + adaptive overlay/sheet

## Mobile
- map first
- bottom navigation
- bottom sheet drill-down
- no long body-scroll gameplay
- no mandatory hover
- touch target 충분히 확보
- safe-area
- `dvh/svh`
- manual debug/capture day-jump controls은 primary HUD에서 제거

---

# 19. 현재 core architecture에서 절대 깨면 안 되는 것

- player = `CountryId` historical continuity
- Government != player
- Government transition != defeat
- only State Dissolution terminal
- `Region.stateControl` != territory ownership
- physical territory = `LandHex.controller`
- fronts derived only
- events detected, not scheduled
- no authoritative chapter/story progress
- no hidden revolution countdown
- no generic politicalPower/reformPoint
- `stateCapacity` is not mana
- regime classification derived
- no direct LLM WorldState mutation
- no fabricated faction/army/front
- no fake LandHex restoration
- no `0 LandHex -> automatic defeat`
- no `NO_ACTIVE_FRONT_EDGE -> peace`
- no timer/random conflict cleanup
- no persistence V9 hidden in visual task
- Gate1F remains NOT_READY
- V02 remains NOT_STARTED until authorized

---

# 20. ChatGPT ↔ Codex ↔ Git Working Contract

이 섹션은 새 authority를 만들기 위한 것이 아니라 root `AGENTS.md`와 `docs/bridge/README.md`를 대화 맥락에서 명확하게 재확인한 것이다.

## 20.1 Source of Truth 순서

```text
1. actual repository source / tests / diff / Git history
2. docs/bridge/STATE.md
3. current/historical Bridge task + result
4. older conversation
```

Product/architecture 판단:

```text
docs/GDD.md
docs/ARCHITECTURE.md
docs/QA_PLAYTEST.md
root AGENTS.md
```

Bridge metadata는 runtime에서 참조하지 않는다.

## 20.2 역할

### ChatGPT
- 현재 상태 확인
- task authoring
- Bridge 업데이트
- 완료 후 실제 GitHub diff/test/result 독립 검토
- PASS / REJECT 결정
- 다음 작업 승인

### Codex Desktop
- 현재 authorized Bridge task 읽기
- active local TMR repo에서 구현
- test/build/QA
- result 작성
- commit/push
- 다음 task 자가 승인 금지

### 사용자
정상 workflow에서 직접 Git 명령을 관리할 필요가 없다.

사용자에게 기대하는 가장 작은 흐름:

```text
ChatGPT가 task 발행
-> Codex Desktop에서 새 채팅/현재 채팅에 "CURRENT_TASK 읽고 수행" 지시
-> Codex 완료/push
-> 사용자: "완료 검증"
-> ChatGPT가 GitHub를 직접 리뷰
```

## 20.3 Git 원칙

정상 허용:
- `git fetch`
- dedicated branch
- commit
- push

금지/주의:
- 무조건적인 reset/rebase/force-push
- 사용자 작업 삭제
- Bridge 동기화를 이유로 implementation history 파괴
- parent repo를 잘못 commit

현재 Windows 실제 nested repo:

```text
<LOCAL_USER_HOME>\OneDrive\Documents\ChatGPT\Game-TMR\TooManyRevolutions
```

부모 `Game-TMR` repo가 아니라 **nested TooManyRevolutions repo**가 실제 프로젝트다.

## 20.4 Branch rule

master에 Bridge metadata가 앞서가도 implementation branch를 억지로 master에 맞추기 위해 history를 rewrite하지 않는다.

필요하면 reviewed predecessor에서 dedicated review/work branch를 사용한다.

현재 P0:

```text
gamebuilders-product-surface-p0
```

## 20.5 Review Gate

Codex가 “PASS”라고 써도 provisional이다.

ChatGPT가 실제:
- compare diff
- source
- tests
- result
- deployed behavior

를 확인하기 전에는 accepted가 아니다.

다음 task는 predecessor review/accept 전에는 authorize하지 않는다.

---

# 21. Codex 작업 규약

구현 전에:

1. relevant docs 읽기
2. current code inspect
3. implementation boundary 확정
4. smallest coherent slice 구현
5. tests
6. production build
7. behavior verification
8. architecture 변경 시 docs update

금지:
- “나중에 쓸 수도 있어서” speculative framework 생성
- scope 자동 확대
- 다음 task 자가 승인
- GDD와 충돌하는 제품 재설계
- passing tests를 fun/gameplay PASS로 착각

---

# 22. 지금부터의 실행 순서

현재 P0 안에서 우선순위:

```text
1. Gameplay Reality
   - system proposal carry
   - ideology runtime
   - actual autonomous actors
   - owner/controller visual truth
   - persistent conflict

2. Observable Map
   - world fills viewport
   - controller / ideology / routes / crisis
   - actual meaningful delta
   - world camera
   - map-linked feedback

3. Renderer
   - Pixi spike
   - one production renderer 선택

4. Institutional Roadmap
   - actual Policy graph
   - real enact action

5. State Projects / Wonder-like landmarks
   - actual Intervention lifecycle only
   - visible map history

6. Compact Game UX
   - text walls 제거
   - spatial preview
   - objective/blockers

7. Content Studio
   - stable text DB
   - edit / diff / import/export

8. Responsive QA
   - desktop/mobile

9. Sites redeploy

10. Manual play
   - no-action
   - policy + intervention
   - actual crisis
   - >1000 day
   - 3 minute capture path
```

---

# 23. GameBuilders 제출 직전 체크

게임 영상/심사에서 반드시 보여야 하는 것:

1. 제목/세계관 hook
2. 살아있는 full map
3. 주변 국가
4. 시간이 흐르면서 지도 상태 변화
5. 정치사상/route 변화
6. faction/foreign actor 반응
7. 실제 정책 선택
8. Institutional Roadmap
9. Intervention / State Project
10. map landmark 변화
11. rebellion/coup가 실제 발생하면 spatial crisis
12. LandHex controller 변화
13. “정권은 무너져도 국가는 계속된다”라는 identity
14. 새 질서 정착 목표와 blocker

영상이 다음처럼 보이면 실패다.

```text
텍스트 읽음
-> 버튼
-> 숫자 바뀜
-> 텍스트 읽음
```

영상이 다음처럼 보여야 한다.

```text
세계를 봄
-> 결정을 내림
-> 세계가 시각적으로 바뀜
-> 다른 actor가 반응
-> 새로운 문제가 지도에서 생김
-> 다시 결정
```

---

# 24. GameBuilders 이후

행사 제출 뒤에는 현재 P0를 리뷰/동결한 후 core Gate 진행으로 돌아간다.

남아 있는 core 상태:

```text
Gate1F: NOT_READY
F05_FIX24: docs-only complete / awaiting independent review
F05_FIX25: conditional design memo only / implementation not authorized
V02: NOT_STARTED
```

GameBuilders visual/content work를 이유로 Gate1F를 PASS 처리하지 않는다.

---

# 25. 현재 한 문장 방향

> **TMR은 정책 설명을 읽는 웹게임이 아니라, 국가의 제도적 선택이 지도 위 사상·세력·외교·영토·건설 흔적으로 축적되고, 시간이 흐를수록 자신이 만든 역사가 눈앞에서 변하는 map-first systemic political strategy game이어야 한다.**

---

# 26. 문서 운용

이 문서는 새로운 task 파일이 아니다.

현재 실행 authority는 항상:

```text
docs/bridge/CURRENT_TASK.md
```

에서 확인한다.

작업 완료 후:

```text
사용자: 완료 검증
-> ChatGPT 실제 GitHub review
-> PASS/REJECT
-> 다음 task 결정
```

이 handoff 문서는 새 대화를 열거나 컨텍스트가 길어졌을 때 프로젝트 방향을 빠르게 복구하는 용도로 사용한다.
