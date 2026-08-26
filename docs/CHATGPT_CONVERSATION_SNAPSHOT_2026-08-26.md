# TMR ChatGPT Conversation Snapshot — 2026-08-26

> 목적: 2026-08-26 GameBuilders 대응 과정에서 ChatGPT와 사용자가 합의하거나 발견한 핵심 맥락, 실패 원인, 제품 방향, 현재 상태를 한 문서에 보존한다.
>
> 이 문서는 **대화의 verbatim transcript가 아니라 구조화된 결정/맥락 요약**이다. 충돌 시 권위 순서는 실제 repository source/tests/Git history → `docs/bridge/STATE.md` → 현재 Bridge task/result → 이 문서 순이다.

---

## 1. 프로젝트 정체성

- 작품명: **《내 왕국에 혁명이 너무 많다》**
- 영문명: **TOO MANY REVOLUTIONS**
- 태그라인: **정권은 무너져도, 국가는 계속된다.**
- 플레이어는 왕/대통령/정부가 아니라 **CountryId로 표현되는 국가의 역사적 연속성**을 플레이한다.
- 정권 교체, 왕정 붕괴, 쿠데타, 혁명, 선거 패배, 내전에서 특정 정부의 패배는 자동 게임오버가 아니다.
- 승리: **새로운 질서의 정착(Order Consolidation)**
- 패배: **국가 소멸(State Dissolution)**

## 2. GameBuilders 전 긴급 피벗

Gate 1F는 `NOT_READY`이고 V02는 시작하지 않은 상태였으나 GameBuilders 일정이 임박해, F05를 끝까지 밀기보다 **검증된 FIX23/V8 코어를 동결하고 playable vertical slice를 먼저 만드는 방향**으로 피벗했다.

당시 목표는 다음이었다.

```text
accepted simulation core
-> thin React client
-> title / start
-> time flow
-> HUD
-> map
-> Agenda
-> factual EventStore
-> intervention actions
-> responsive UI
-> Sites deploy
-> 3-minute capture readiness
```

`GAMEBUILDERS_DEMO_SPRINT_01`은 기술적으로 실제 ActionProposal/ActionRecord/SimulationStep 경로를 사용하는 playable vertical slice까지 성공했다.

## 3. 첫 번째 제품 검토에서 드러난 문제

실제 Site를 보고 다음 문제가 확인됐다.

- 텍스트와 rectangular card가 주 화면을 지배해 **웹 대시보드/텍스트 웹게임**처럼 보였다.
- 맵은 작은 hex strip에 가까웠고, 세계/국경/주변국/지형/정치적 밀도가 부족했다.
- title → world build-up → main-game reveal이 약했다.
- 개발자 용어가 일부 player-facing UI에 남아 있었다.
- 에셋/아트/맵/UI를 하나의 통일된 디자인 시스템으로 관리하는 규약이 부족했다.

사용자 피드백의 요지는 다음과 같았다.

> "그냥 텍스트 기반 웹게임 같다."
>
> "맵도 헥스만 있고 아무것도 없다."
>
> "이 게임을 왜 해야 되는지에 대한 타이틀-빌드업-메인 화면이 없다."

이 피드백을 계기로 `GAMEBUILDERS_PRODUCT_SURFACE_P0`를 만들고 다음을 추가했다.

- anti-AI-slop Art Bible
- stable ID 기반 Design Registry / Asset Manifest / Layer Registry
- title → opening briefing → main game
- 실제 Scenario Country/Region/LandHex 기반 주변국
- responsive map-first composition
- player-facing copy cleanup
- game-theory-informed decision UX

## 4. Map-first 방향 재확인

대화 중 원래 GDD가 Plague Inc./Rebel Inc.의 빠른 systemic pacing을 참고하고, 공간 표현에서는 명확히 **맵이 게임판**이라는 점을 다시 확인했다.

핵심 GDD 원칙:

```text
정치는 Region에서 계산되고, 영토는 LandHex 위에서 움직인다.
사상은 색과 문양으로 퍼지고,
조직은 지도 위의 말이 되며,
혁명은 영토가 된다.
```

따라서 main gameplay는 다음처럼 정의됐다.

```text
compact game HUD
-> persistent living world map
-> factual political / ideology / control / route / conflict changes
-> contextual drawer / bottom sheet only when needed
```

다음 구조는 실패로 간주한다.

```text
[permanent text/card wall] [small map card] [permanent text/card wall]
```

## 5. 실제 hands-on 검증에서 드러난 더 큰 문제

사용자가 약 1,000~1,500일 이상 시간을 진행해 직접 플레이한 결과:

- 국가/세계가 거의 변하지 않는 것처럼 보임
- 텍스트가 실제 세계 변화와 연결되지 않은 "허상"처럼 느껴짐
- 반란/정책 선택만 반복되고, 지도에서 무엇이 일어났는지 알 수 없음
- 플레이하는 감각보다 보고서/관리 페이지를 읽는 감각이 강함

대표 사용자 피드백:

> "한 천일이 지나도 아무 변화도 없고 그냥 모든 텍스트들이 허상임. 내가 게임 하는 느낌이 안 듬."

실제 repository inspection에서 이 감각이 단순한 취향 문제가 아니라 **runtime/presentation integration blocker**와 연결돼 있음을 확인했다.

## 6. Gameplay Reality blocker 진단

### 6.1 System ActionProposal carry loop 누락

Faction/foreign systems는 다음 tick용 heuristic `ActionProposal`을 생성할 수 있지만, inspected demo runtime은 `runSimulationStep()` 결과를 commit한 뒤 `actionProposals`를 다음 tick 입력으로 carry하지 않는 경로가 있었다.

결과적으로 "세계 actor가 결정은 하지만 실제 행동은 이어지지 않는" 상태가 발생할 수 있었다.

### 6.2 Ideology diffusion runtime 연결 누락

월간 ideology diffusion 시스템은 구현돼 있지만 inspected demo runtime hook 구성에서 빠져 있어, 실제 hands-on play에서 **국경/무역/정보 접촉을 통한 이념 확산**이 보이지 않을 수 있었다.

### 6.3 Legal owner와 physical controller 표현 혼동

지도 기본 정치색이 Region legal owner 중심이면 `LandHex.controller`가 faction으로 바뀌어도 눈에 띄지 않는다.

필수 원칙:

```text
legal owner presentation != current physical controller presentation
```

반란이 territory를 먹으면 지도에서 실제로 보여야 한다.

### 6.4 Active conflict가 recent event에서 사라짐

반란/쿠데타를 최근 EventStore 몇 개에서만 찾으면 active Conflict가 계속 존재해도 시작 이벤트가 오래되어 UI에서 사라진다.

현재 active crisis는 event recency가 아니라 **current authoritative Conflict state**에서 읽어야 한다.

### 6.5 National instability 숫자의 오해 가능성

Country instability는 특정 통제 기준에 따라 낮거나 0으로 보일 수 있다. 실제 territorial loss/active conflict가 심한데 `불안 0`만 크게 보이면 player-facing 의미가 왜곡된다.

Map/controller/conflict/territorial status가 misleading scalar보다 우선해야 한다.

### 6.6 Game theory를 설명문으로 과잉 표현

`확정 비용 / 확정 변화 / 현재 관측 / 미확정 반응 / 기회비용 / 기다림 비용`을 매 카드에서 장문으로 보여주는 형태는 게임 이론을 **플레이 선택의 긴장**이 아니라 **텍스트 설명**으로 만든다.

기본 카드에는 compact factual trade-off만 보여주고, 긴 설명은 자세히 보기로 보내는 방향으로 수정한다.

### 6.7 Policy fantasy가 UI에서 약함

게임의 핵심 fantasy는 "법과 제도를 바꾸고 시간을 돌린다"인데, UI가 intervention 몇 개만 보여주면 핵심 정체성이 약해진다.

실제 `PolicyDefinition` / `ENACT_POLICY` 경로를 player-facing gameplay로 노출해야 한다.

## 7. 게임 역동감 / progression 방향

사용자는 단순한:

```text
time -> rebellion -> policy/intervention -> text
```

구조보다, 시간이 흐르면서 **국가가 눈에 보이게 만들어지고 변하는 맛**을 요구했다.

새 방향:

### 7.1 Institutional Roadmap

Civilization식 tech tree의 "읽기 좋은 분기/완성감"은 참고하되, generic research/policy mana는 도입하지 않는다.

실제 `PolicyDefinition`의 prerequisite/incompatibility를 시각화한다.

```text
real institutional rules / prerequisites / incompatibilities
-> visual roadmap
-> enacted path remains visible
```

이것은 focus tree/story progression이 아니라 **실제 제도 가능성의 시각화**다.

### 7.2 State Projects / landmarks / wonder-like feedback

기존 authoritative Intervention/Policy lifecycle로 정당화되는 2~4개 프로젝트를 지도 위에 남긴다.

예:
- 식량 배급/곡창 네트워크
- 공공사업/산업 프로젝트
- 의회/헌정 관련 landmark

필수:

```text
actual action starts
-> existing duration projects implementation state
-> existing completion
-> persistent map-visible trace
```

fake project event나 별도 hidden construction timer는 금지한다.

### 7.3 WorldVisualDelta

정치/영토/이념/국경/정책 변화는 텍스트만 추가하지 말고 factual map animation/feedback으로 이어진다.

예:
- `IDEOLOGY_SUPPORT_CHANGED` -> region pattern/tint change + route pulse
- `LAND_HEX_CONTROL_CHANGED` -> territory controller sweep
- `BORDER_CLOSED` -> route fade/lock
- `REBELLION_STARTED` -> factual region crisis focus
- `INSTITUTION_RULE_CHANGED` -> roadmap transition / institutional seal
- `INTERVENTION_COMPLETED` -> landmark complete

## 8. 렌더러 / 웹게임 엔진 방향

현재 React+SVG는 inspection/accessibility에 좋지만 정적인 diagram 느낌으로 흐르기 쉽다는 문제가 확인됐다.

현재 P0는 **bounded PixiJS v8 + React spike**를 허용한다.

권장 분리:

```text
Authoritative simulation / time / actions: existing TMR TypeScript core
Application / menus / drawers / Content Studio: React DOM
Persistent world renderer: PixiJS v8 + @pixi/react v8 if spike passes
Camera: pixi-viewport if adopted
```

Phaser는 검토 가능하지만 P0에서 전체 engine migration을 기본 선택으로 하지 않는다. renderer/game engine이 simulation authority나 second game clock을 소유하면 안 된다.

Pixi spike가 deadline/compatibility를 위협하면 SVG 단일 production renderer를 유지하고 같은 WorldVisualDelta/camera 원칙을 적용하며 engine migration은 P1로 미룬다.

## 9. Visual/game-feel 목표

Persistent gameplay가 일반 responsive webpage/admin dashboard처럼 보이면 실패다.

화면의 2초 시선 순서:

```text
1. WORLD / MAP
2. 지금 세계에서 변하는 것
3. 내가 신경 써야 할 것
4. 내가 할 수 있는 것
5. 보조 숫자 / 상세
```

Desktop:
- world stage가 visible gameplay area의 대부분을 차지
- HUD/panels는 map edge에 compact하게 dock/float

Mobile:
- 첫 viewport는 거의 map
- detail은 bottom sheet
- manual capture/debug controls, settings는 prime area에서 제거

## 10. Design / asset 관리 방향

부분 수정 가능성이 필수다.

```text
Design Tokens
-> Semantic Tokens
-> Design Registry
-> Asset Manifest
-> Layer Registry
-> Components
-> Screen Composition
-> State / Crisis Overlay
```

에셋/레이어/컴포넌트는 stable semantic ID를 사용한다.

AI-generated art는:
- 하나의 style family 사용
- prompt recipe/provenance/version 기록
- essential UI text를 raster image에 넣지 않음
- modular asset로 생성
- 한 장짜리 AI background에 전체 UI를 bake하지 않음

## 11. Content Studio / Admin 요구

사용자는 source code를 찾지 않고 player-facing text를 직접 수정할 수 있어야 한다.

별도의 development-only `Content Studio`를 만든다.

예:

```text
?contentStudio=1
```

기능:
- stable content ID
- search/filter
- screen/event/policy/intervention/entity/branch/variant 필터
- inline edit
- preview
- baseline vs edited diff
- placeholder validation
- Korean length warning
- local draft persistence
- one/all reset
- JSON patch import/export
- clipboard copy

Static Sites가 GitHub에 직접 commit할 수 있는 것처럼 가장하지 않는다.

Workflow:

```text
Content Studio edit
-> export JSON patch
-> Codex/ChatGPT/tooling applies patch to repository
-> review
-> redeploy
```

## 12. 현재 프로젝트 상태

2026-08-26 현재 Bridge 기준:

```text
Gate 1F: NOT_READY
V02: NOT_STARTED
Persistence accepted: V8
Accepted core: through F05_FIX23
GameBuilders demo: technical vertical slice accepted
Current authorized task: GAMEBUILDERS_PRODUCT_SURFACE_P0
Current branch: gamebuilders-product-surface-p0
```

Current P0는 product polish만이 아니라 gameplay-reality / renderer / progression / content authoring까지 포함하도록 강화된 상태다.

F05_FIX24는 별도 branch에서 COMPLETE / AWAITING_CHATGPT_REVIEW이며, F05_FIX25 implementation은 승인되지 않았다.

## 13. 가장 중요한 교훈

GameBuilders 긴급 대응에서 원래 Gate 순서를 일부 건너뛰면서 다음 문제가 발생했다.

```text
headless systems exist
-> final-looking UI를 너무 빨리 붙임
-> map timelapse / observable world validation 부족
-> 웹 대시보드 위에 simulation data를 올린 모습이 됨
```

원래 `AGENTS.md`의 Gate 1V가 요구했던 것은 바로 이것을 막기 위한 것이었다.

앞으로는:

```text
SIMULATION TRUTH
-> PLAYER-OBSERVABLE WORLD DYNAMICS
-> MAP GAME FEEL
-> PLAYER DECISIONS
-> ART / POLISH
```

순서를 지킨다.

**Passing tests is not success. The map itself must be interesting to watch and play.**
