# TMR Bridge State

UPDATED: 2026-08-26
REPOSITORY: sionchu/TooManyRevolutions
BRANCH: master
CURRENT_GATE: Gate 1F / TEMPORARILY_PAUSED_FOR_GAMEBUILDERS_PRODUCT_P0
GATE1F_CHATGPT_DECISION: NOT_READY
V02: NOT_STARTED
PERSISTENCE_ACCEPTED: SerializedSimulationSnapshotV8 / format version 8

## Accepted progression

```text
F04: CLOSED / PASS
F05_FIX1..F05_FIX23: accepted core progression
GAMEBUILDERS_DEMO_SPRINT_01: TECHNICAL_PASS / ACCEPTED_AS_VERTICAL_SLICE
```

## Stable core / reviewed demo base

```text
CORE_IMPLEMENTATION_HEAD: 82bb6018f2fc87d9f1807cab3c12fb5e2e016775
GAMEBUILDERS_REVIEWED_HEAD: ee4b282c767538c39bbf8379528d16761d3d4878
PERSISTENCE_FORMAT: V8
DEMO_HORIZON_STATUS: STRONG_SHORT_HORIZON_LATE_STALL
GATE1F: NOT_READY
V02: NOT_STARTED
```

## Current authorization

```text
CURRENT_TASK_ID: GAMEBUILDERS_PRODUCT_SURFACE_P0
CURRENT_TASK_STATUS: AUTHORIZED
TASK_FILE: docs/bridge/tasks/GAMEBUILDERS_PRODUCT_SURFACE_P0.md
MAP_FIRST_ADDENDUM: docs/bridge/tasks/GAMEBUILDERS_PRODUCT_SURFACE_P0_MAP_FIRST_ADDENDUM.md
GAMEPLAY_REALITY_ADDENDUM: docs/bridge/tasks/GAMEBUILDERS_PRODUCT_SURFACE_P0_GAMEPLAY_REALITY_ADDENDUM.md
GAME_FEEL_ENGINE_CONTENT_STUDIO_ADDENDUM: docs/bridge/tasks/GAMEBUILDERS_PRODUCT_SURFACE_P0_GAME_FEEL_ENGINE_CONTENT_STUDIO_ADDENDUM.md
GAME_VISUAL_UX_RENDER_ADDENDUM: docs/bridge/tasks/GAMEBUILDERS_PRODUCT_SURFACE_P0_GAME_VISUAL_UX_RENDER_ADDENDUM.md
BASE_IMPLEMENTATION_HEAD: ee4b282c767538c39bbf8379528d16761d3d4878
WORK_BRANCH: gamebuilders-product-surface-p0
NEXT_AUTHORIZED_TASK_ID: GAMEBUILDERS_PRODUCT_SURFACE_P0
```

## In-progress P0 review finding — BLOCKING

Latest inspected P0 branch head during this review:

```text
P0_INSPECTED_HEAD: 11cd70d82756cc89bd4b9a8c1f92a55fe7c32991
USER_OBSERVED_LATE_TICK: ~1528
USER_REPORTED_FEELING: visually static / text feels fictitious / not game-like / normal responsive web page
```

The P0 has added modular design registries, replaceable assets, title/briefing flow, real neighboring Countries, responsive decomposition and a political atlas. These are useful foundations, but P0 is still blocked because the product does not yet deliver a living game-world or game-native visual grammar.

### Gameplay-reality blockers

1. `runSimulationStep()` emits next-tick system `actionProposals`, but the inspected demo runtime discards them after each committed step. Faction and foreign heuristic proposals therefore do not consistently become next-tick ActionRecords in hands-on play.
2. The accepted monthly ideology-diffusion system exists but the inspected demo runtime does not install it, so cross-border ideology propagation can be absent from actual play.
3. The atlas can hide authoritative LandHex controller changes behind legal Region owner coloring.
4. Coup/rebellion visibility can depend on recent-event history rather than persistent current active Conflict state.
5. Raw routine event churn and long decision prose obscure meaningful political history.
6. Existing Policy/`ENACT_POLICY` institutional gameplay is not yet fully surfaced to the player.
7. The player territorial substrate / camera composition can exhaust visible spatial motion quickly.

### Game-feel / motivation blockers

Current loop risks reading as:

```text
time -> crisis text -> intervention text -> time
```

The player needs accumulating visible history:

```text
real Policy path
+ map-linked State Projects / landmarks backed by existing action lifecycles
+ factual ideology / control / border / crisis visual transitions
+ persistent medium-term objective and blockers
```

A visual `Institutional Roadmap` may expose actual PolicyDefinition prerequisites/incompatibilities, but must not become a generic focus tree, research system, policy mana, or authored story progression.

### Visual / renderer blockers

The current composition still follows normal web-dashboard grammar:

```text
page/header
-> equal metric boxes
-> form-like time controls
-> bordered map content card
-> large empty map margins
-> more bordered text boxes
```

The normal gameplay target is instead:

```text
compact game chrome
-> world/map fills the primary viewport
-> factual overlays/landmarks/motion on that world
-> collapsible contextual drawers/sheets
```

Mobile must not become a stack of desktop cards. The first gameplay viewport should be map-first with compact HUD and bottom-sheet details.

A bounded PixiJS v8 + React renderer spike is authorized. TMR TypeScript simulation/time/action remains authoritative. Phaser may be evaluated, but no wholesale engine migration or second game clock is authorized in this sprint.

### Content-authoring requirement

Create a separate development-only Content Studio (`?contentStudio=1` or equivalent) backed by stable content IDs. It should support search/filter/edit/live preview where practical, local draft persistence, diff/reset, JSON patch import/export, placeholder validation, and branch/variant metadata. Static Sites cannot directly commit to GitHub; do not fake that capability.

Dense form/admin UI is appropriate in Content Studio only and must not leak into gameplay.

## Required remaining P0 result markers

```text
SYSTEM_PROPOSAL_CARRY_LOOP: IMPLEMENTED_AND_TESTED
IDEOLOGY_DIFFUSION_IN_DEMO_RUNTIME: ENABLED
CURRENT_CONTROLLER_VISUALLY_DISTINCT_FROM_OWNER: YES
ACTIVE_CONFLICT_PERSISTENT_PRESENTATION: YES
PLAYER_POLICY_ACTIONS: YES
INSTITUTIONAL_ROADMAP: YES
GENERIC_TECH_OR_POLICY_MANA: NO
STATE_PROJECT_PRESENTATION: YES
COMPLETED_PROJECT_LEAVES_MAP_VISIBLE_TRACE: YES
WORLD_VISUAL_DELTA_PIPELINE: YES
CONTENT_STUDIO: YES
CONTENT_JSON_IMPORT_EXPORT: YES
WEB_DASHBOARD_VISUAL_GRAMMAR_DOMINANT: NO
MAP_OCCUPIES_PRIMARY_VIEWPORT: YES
MAP_WORLD_BOUNDS_FILLED: YES
RAW_HEX_TEST_STRIP_APPEARANCE: NO
PERSISTENT_PARAGRAPHS_ON_MAIN_MAP: NO
CAMERA_PAN_ZOOM_FOCUS: YES
MOBILE_STACKED_CARD_PAGE_FEEL: NO
PLAYER_OBSERVABLE_DYNAMICS_AUDIT: PASS_OR_BLOCKER_DOCUMENTED
DAY_1000_VISUALLY_AND_SYSTEMICALLY_DISTINCT_FROM_DAY_0: YES_OR_CORE_BLOCKER_PROVEN
```

## Locked product / spatial direction

```text
내 왕국에 혁명이 너무 많다
TOO MANY REVOLUTIONS
정권은 무너져도, 국가는 계속된다.
```

GDD spatial contract:

```text
politics is calculated at Region scale
territory moves on LandHexes
ideology spreads as color/pattern
authoritative organizations become map markers
revolution becomes territory
```

Reference roles:
- Plague Inc. / Rebel Inc.: persistent living map, spatial feedback, pacing;
- Rebel Inc. Azure Dam: visible map-linked development objective under political/security pressure;
- Against the Storm: strategic decisions/upgrades producing visible world/building changes and game-native HUD hierarchy;
- CK3: political geography / heraldry / territory identity;
- Suzerain / Papers Please: title/briefing/decision flavor only.

## Design / partial-edit contract

Keep and extend:

```text
Design Tokens
-> Semantic Tokens
-> Design Registry
-> Asset Manifest
-> Layer Registry
-> Components
-> Screen Composition
-> State / Crisis Overlay

Content Registry
-> stable player-facing text IDs
-> Content Studio editing and patch export
```

Do not regress to a monolithic AI image, one giant React component, or hardcoded player copy scattered through components.

## Preserved architecture constraints

- player = CountryId continuity, not ruler/government;
- Government transition remains nonterminal;
- physical territorial authority remains only `WorldState.landHexStates[*].controller`;
- Region.stateControl is not territorial ownership;
- fronts remain derived;
- no invented armies/crowds/fronts;
- no fake countries / Agenda / EventStore facts;
- no direct UI/renderer mutation of WorldState;
- all actions use common action/simulation boundaries;
- no scripted/scheduled coup/rebellion;
- no fake project completion;
- no generic tech/reform/policy currency;
- no focus-tree/story-node authority;
- no hidden pacing timer/RNG cheat;
- no new F05 operational-evidence/settlement implementation in P0;
- no persistence V9;
- no solver/universal utility score;
- Gate 1F remains NOT_READY;
- V02 remains NOT_STARTED;
- no successor task self-authorization.

## Deferred core work

```text
F05_FIX24: COMPLETE / AWAITING_CHATGPT_REVIEW on separate branch
F05_FIX25_CONDITIONAL_DESIGN_MEMO: NON_AUTHORITATIVE
F05_FIX25_IMPLEMENTATION: NOT_AUTHORIZED
```

Do not resume these until GameBuilders P0 is independently reviewed or explicitly paused.