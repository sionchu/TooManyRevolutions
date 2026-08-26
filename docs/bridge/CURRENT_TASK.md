# TMR Current Bridge Task

TASK_ID: GAMEBUILDERS_PRODUCT_SURFACE_P0
STATUS: AUTHORIZED
BASE_IMPLEMENTATION_HEAD: ee4b282c767538c39bbf8379528d16761d3d4878
BASE_IMPLEMENTATION_BRANCH: gamebuilders-demo-sprint-01
WORK_BRANCH: gamebuilders-product-surface-p0
TASK_FILE: docs/bridge/tasks/GAMEBUILDERS_PRODUCT_SURFACE_P0.md
MAP_FIRST_ADDENDUM: docs/bridge/tasks/GAMEBUILDERS_PRODUCT_SURFACE_P0_MAP_FIRST_ADDENDUM.md
GAMEPLAY_REALITY_ADDENDUM: docs/bridge/tasks/GAMEBUILDERS_PRODUCT_SURFACE_P0_GAMEPLAY_REALITY_ADDENDUM.md
GAME_FEEL_ENGINE_CONTENT_STUDIO_ADDENDUM: docs/bridge/tasks/GAMEBUILDERS_PRODUCT_SURFACE_P0_GAME_FEEL_ENGINE_CONTENT_STUDIO_ADDENDUM.md
GAME_VISUAL_UX_RENDER_ADDENDUM: docs/bridge/tasks/GAMEBUILDERS_PRODUCT_SURFACE_P0_GAME_VISUAL_UX_RENDER_ADDENDUM.md
RESULT_PATH: docs/bridge/results/GAMEBUILDERS_PRODUCT_SURFACE_P0_RESULT.md

## Accepted predecessor

```text
GAMEBUILDERS_DEMO_SPRINT_01: COMPLETE / REVIEWED / TECHNICAL_PASS / ACCEPTED_AS_VERTICAL_SLICE
REVIEWED_HEAD: ee4b282c767538c39bbf8379528d16761d3d4878
SITES_STATUS: DEPLOYED
DEMO_HORIZON_STATUS: STRONG_SHORT_HORIZON_LATE_STALL
PERSISTENCE_ACCEPTED: SerializedSimulationSnapshotV8 / format version 8
GATE1F: NOT_READY
V02: NOT_STARTED
```

## Current blocking product finding

Hands-on review of the in-progress P0 Site shows two separate blockers:

1. **gameplay reality / dynamism:** the player can advance large amounts of simulated time while the visible world appears materially static;
2. **visual grammar:** the screen still reads as a parchment-themed responsive website/admin dashboard: rectangular bordered containers, equal metric boxes, form-like controls, a map enclosed as one content card, large empty map margins, and dense explanatory text.

The next work must repair those blockers before more decorative static art is accepted.

## Mandatory execution order

Read and execute all five documents. Later addenda strengthen earlier ones; they do not authorize bypassing simulation truth.

1. `GAMEBUILDERS_PRODUCT_SURFACE_P0.md`
2. `GAMEBUILDERS_PRODUCT_SURFACE_P0_MAP_FIRST_ADDENDUM.md`
3. `GAMEBUILDERS_PRODUCT_SURFACE_P0_GAMEPLAY_REALITY_ADDENDUM.md`
4. `GAMEBUILDERS_PRODUCT_SURFACE_P0_GAME_FEEL_ENGINE_CONTENT_STUDIO_ADDENDUM.md`
5. `GAMEBUILDERS_PRODUCT_SURFACE_P0_GAME_VISUAL_UX_RENDER_ADDENDUM.md`

Priority inside the remaining sprint:

```text
Gameplay Reality repair
-> make factual world changes visibly readable
-> bounded PixiJS renderer spike / renderer decision
-> map/world-stage visual composition repair
-> real Policy Institutional Roadmap
-> 2–4 map-linked State Projects / landmark traces from existing authoritative lifecycles
-> factual WorldVisualDelta feedback / camera / motion
-> compact game-native HUD and decision UX
-> Content Studio / editable stable-ID player copy
-> responsive QA / Sites redeploy
```

## Required gameplay-reality outcomes

```text
SYSTEM_PROPOSAL_CARRY_LOOP: IMPLEMENTED_AND_TESTED
IDEOLOGY_DIFFUSION_IN_DEMO_RUNTIME: ENABLED
CURRENT_CONTROLLER_VISUALLY_DISTINCT_FROM_OWNER: YES
ACTIVE_CONFLICT_PERSISTENT_PRESENTATION: YES
SIGNIFICANT_EVENT_FEED: YES
PLAYER_POLICY_ACTIONS: YES
CONSOLIDATION_OBJECTIVE_BLOCKERS_VISIBLE: YES
PLAYER_OBSERVABLE_DYNAMICS_AUDIT: PASS_OR_BLOCKER_DOCUMENTED
DAY_1000_LOOKS_IDENTICAL_TO_DAY_0: NO
```

## Required game-feel / progression outcomes

The player fantasy is no longer only `time -> crisis text -> intervention text`. Existing authoritative systems must accumulate into visible history.

```text
INSTITUTIONAL_ROADMAP: visual graph of real PolicyDefinition prerequisites/incompatibilities
GENERIC_TECH_OR_POLICY_MANA: NO
STATE_PROJECT_PRESENTATION: 2–4 existing actions with defensible map-linked presentation
PROJECT_PROGRESS: projection of existing intervention duration only
COMPLETED_PROJECT_LEAVES_MAP_VISIBLE_TRACE: YES
WORLD_VISUAL_DELTA_PIPELINE: factual state/event-driven feedback
CONTENT_STUDIO: stable-ID editable player-facing content with search/filter/import/export JSON patch
```

Institutional Roadmap is a visualization of actual legal/institutional possibilities, not a focus tree/story progression or research-point system.

## Required visual / renderer outcomes

Persistent gameplay must stop looking like a normal responsive webpage.

```text
WEB_DASHBOARD_VISUAL_GRAMMAR_DOMINANT: NO
MAP_OCCUPIES_PRIMARY_VIEWPORT: YES
MAP_WORLD_BOUNDS_FILLED: YES
RAW_HEX_TEST_STRIP_APPEARANCE: NO
PERSISTENT_PARAGRAPHS_ON_MAIN_MAP: NO
PRIMARY_HUD_COMPACT: YES
SETTINGS_CONTROLS_OUT_OF_PRIMARY_HUD: YES
ICON_FAMILY_COHERENT: YES
FACTUAL_WORLD_MOTION_VISIBLE: YES
CAMERA_PAN_ZOOM_FOCUS: YES
POLICY_AND_PROJECT_VISUAL_TRACE: YES
MOBILE_STACKED_CARD_PAGE_FEEL: NO
SCREENSHOT_VISUAL_REVIEW: PASS_OR_BLOCKERS_DOCUMENTED
```

Run the bounded PixiJS v8 + React renderer spike required by the addendum. Keep the existing TMR TypeScript simulation/action/time pipeline authoritative. Do not migrate the simulation into Pixi/Phaser or add a second game clock. If the Pixi spike fails or threatens the deadline, keep one SVG production renderer and implement the same visual-delta/camera principles there; document the renderer decision.

## Original product direction

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

- Plague Inc. / Rebel Inc. -> persistent living world-map game surface and spatial feedback;
- Rebel Inc. Azure Dam -> major visible map-linked development objective interacting with instability/conflict;
- Against the Storm -> strategic choices/upgrades becoming visible settlement/world changes and strong game-native HUD hierarchy;
- CK3 -> political geography / heraldry / territorial identity;
- Suzerain / Papers Please -> title/briefing/decision flavor only, not persistent main-screen layout.

## Design / content architecture

Preserve and extend the modular stack:

```text
Design Tokens
-> Semantic Tokens
-> Design Registry
-> Asset Manifest
-> Layer Registry
-> Component Registry
-> Screen Composition
-> State / Crisis Overlay

Content Registry
-> stable player-facing copy IDs
-> screen/entity/event/policy/intervention/variant metadata
-> Content Studio edit/diff/import/export
```

Normal gameplay and Content Studio must use different UI grammar. Dense forms/tables belong only in the Content Studio.

## Architecture boundaries

- accepted FIX23 simulation core remains authoritative;
- no direct UI/renderer mutation of WorldState;
- no second renderer/game clock owning authoritative simulation;
- no scripted/scheduled coup/rebellion;
- no fake Agenda/EventStore facts;
- neighboring countries remain real authored scenario entities;
- physical territorial authority remains LandHex controller state;
- Region.stateControl is separate from physical territory;
- fronts remain derived;
- no fake army/crowd/front/project completion;
- no generic tech/reform/policy currency;
- no focus-tree/story-node authority;
- no hidden pacing timer/RNG cheat;
- no new F05 operational-evidence/settlement runtime hidden in P0;
- no persistence V9;
- no Gate1F PASS;
- no V02;
- no solver/universal utility score;
- no commercial-game asset copying;
- no unvetted copyleft code import;
- no successor task self-authorization.

Continue on `gamebuilders-product-surface-p0`, commit/push safe checkpoints, redeploy the actual corrected build to Sites, and stop only after the result reports all applicable gameplay-reality, renderer, visual-UX, progression/project, Content Studio, responsive, and Sites statuses.