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
WORK_BRANCH: gamebuilders-product-surface-p0
BASE_IMPLEMENTATION_HEAD: ee4b282c767538c39bbf8379528d16761d3d4878
LATEST_P0_BRANCH_HEAD_BEFORE_NEW_LOOP_WORK: 55ec2334cd32953207d3bd144fdf793b5b808b9f
NEXT_AUTHORIZED_TASK_ID: GAMEBUILDERS_PRODUCT_SURFACE_P0
```

Current task/addenda are listed in `docs/bridge/CURRENT_TASK.md`. The latest added player-loop/world-feel requirements are additionally grounded in:

```text
docs/GDD_GAME_LOOP_WORLD_FEEL_ADDENDUM_2026-08-26.md
docs/DECISION_GAMEBUILDERS_P0_GAME_LOOP_RENDERER_CONTENT_STUDIO_2026-08-26.md
docs/QA_GAMEBUILDERS_P0_GAME_LOOP_WORLD_FEEL_2026-08-26.md
docs/BACKLOG_GAMEBUILDERS_P0_GAME_LOOP_WORLD_FEEL_2026-08-26.md
docs/bridge/tasks/GAMEBUILDERS_PRODUCT_SURFACE_P0_PLAYER_GAME_LOOP_AND_WORLD_FEEL_ADDENDUM.md
```

## P0 checkpoint already achieved at branch head 55ec2334

The result published on the P0 branch reports the following real gameplay-reality repairs and deployed hands-on evidence:

```text
SYSTEM_PROPOSAL_CARRY_LOOP: IMPLEMENTED_AND_TESTED
IDEOLOGY_DIFFUSION_IN_DEMO_RUNTIME: ENABLED
CURRENT_CONTROLLER_VISUALLY_DISTINCT_FROM_OWNER: YES
ACTIVE_CONFLICT_PERSISTENT_PRESENTATION: YES
SIGNIFICANT_EVENT_FEED: YES
PLAYER_POLICY_ACTIONS: YES
CONSOLIDATION_OBJECTIVE_BLOCKERS_VISIBLE: YES
PLAYER_OBSERVABLE_DYNAMICS_AUDIT: PASS
DAY_1000_LOOKS_IDENTICAL_TO_DAY_0: NO
MOBILE_MAP_FIRST_VIEWPORT: PASS at that checkpoint
SITES_REDEPLOYED: YES
```

The deployed/source checkpoint showed factual controller migration, active rebellion/coup presentation, ideology changes, policy actions, EventStore records and consolidation blockers. These fixes should not be reimplemented from scratch unless regression evidence requires it.

## Why P0 is still BLOCKING / NOT ACCEPTED

The `COMPLETE` wording in the branch result predates later, stronger P0 addenda. Current P0 scope is therefore not complete.

Hands-on mobile review after the gameplay-reality repair found that the product can still feel like:

```text
time passes
-> rebellion/crisis
-> auto-pause
-> text-heavy policy/intervention choice
-> resume
-> repeat
```

The player sees factual changes, but the experience still lacks enough game-native flow, readable spatial change, medium-term institutional/state-building progression and accumulated visible history.

### Remaining game-loop blockers

1. Routine/ordinary changes must not make repeated auto-pause/text interaction the dominant loop.
2. The map must be readable as the evolving game board before reports are opened.
3. Chronicle must become a factual `ChronicleDigest`, not a low-level ideology/faction log.
4. Policy choices need a visible medium-term `Institutional Roadmap` based on real PolicyDefinition prerequisites/incompatibilities.
5. 2–4 mechanically defensible existing lifecycles should become map-linked State Projects/landmarks with real progress/completion and persistent traces; if current authority cannot support this, the exact blocker must be documented rather than faked.
6. State/Event changes need factual `WorldVisualDelta` feedback.
7. Player-facing branch/variant copy needs a development-only Content Studio.

### Remaining visual / renderer blockers

Persistent gameplay must stop following normal webpage/admin grammar:

```text
header / metric boxes
-> form-like time controls
-> crisis card
-> map inside a bordered content box
-> more explanatory boxes
```

Target:

```text
compact game HUD
-> world/map fills primary viewport
-> spatial controller/ideology/conflict/project feedback
-> contextual drawers/sheets on demand
```

A bounded PixiJS v8 + React renderer spike is authorized. The existing TMR TypeScript simulation/action/time pipeline remains authoritative. No whole-engine migration or second game clock is authorized. If Pixi is not deadline-safe, retain one SVG production renderer and implement the same map-first/camera/WorldVisualDelta requirements there.

### Documentation alignment blocker

Before further P0 implementation, Codex must fold the durable requirements from the current GDD/decision/QA/backlog addenda into the canonical relevant sections of:

```text
docs/GDD.md
docs/DECISIONS.md
docs/BACKLOG.md
docs/QA_PLAYTEST.md
```

Update `docs/ARCHITECTURE.md` only where renderer/content/presentation authority boundaries need durable clarification. Historical decisions must not be deleted.

## Required remaining P0 result markers

```text
DOCUMENTATION_ALIGNMENT: PASS
ROUTINE_AUTO_PAUSE_DOMINATES_GAME_LOOP: NO
MAP_MAJOR_CHANGE_READABLE_WITHOUT_REPORT: YES
DAY_0_INTERMEDIATE_LATE_VISUAL_DIVERGENCE: PASS
INSTITUTIONAL_ROADMAP: YES
GENERIC_TECH_OR_POLICY_MANA: NO
STATE_PROJECT_PRESENTATION: YES_OR_EXACT_AUTHORITY_BLOCKER_DOCUMENTED
PROJECT_PROGRESS_USES_EXISTING_LIFECYCLE: YES
COMPLETED_PROJECT_LEAVES_MAP_VISIBLE_TRACE: YES_OR_BLOCKER_DOCUMENTED
WORLD_VISUAL_DELTA_PIPELINE: YES
CHRONICLE_DIGEST: YES
CHRONICLE_SOURCE_EVENT_PROVENANCE: YES
CONTENT_STUDIO: YES
CONTENT_BRANCH_VARIANT_EDITING: YES
CONTENT_JSON_IMPORT_EXPORT: YES
RENDERER_DECISION: PIXI_OR_SVG_FALLBACK_DOCUMENTED
WEB_DASHBOARD_VISUAL_GRAMMAR_DOMINANT: NO
MAP_OCCUPIES_PRIMARY_VIEWPORT: YES
MAP_WORLD_BOUNDS_FILLED: YES
PERSISTENT_PARAGRAPHS_ON_MAIN_MAP: NO
PRIMARY_HUD_COMPACT: YES
CAMERA_PAN_ZOOM_FOCUS: YES
POLICY_AND_PROJECT_VISUAL_TRACE: YES
MOBILE_STACKED_CARD_PAGE_FEEL: NO
SCREENSHOT_VISUAL_REVIEW: PASS_OR_BLOCKERS_DOCUMENTED
SITES_REDEPLOYED_FROM_REVIEWED_COMMIT: YES
```

## Locked product / spatial direction

```text
내 왕국에 혁명이 너무 많다
TOO MANY REVOLUTIONS
정권은 무너져도, 국가는 계속된다.
```

Core loop direction:

```text
choose medium-term institutional/state-building direction
-> let time flow while the world remains legible
-> watch ideology/factions/territory/conflicts/projects change spatially
-> selectively intervene
-> choices alter future availability and authoritative state
-> completed choices leave visible history
-> next decisions emerge from the changed world
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
- Plague Inc. / Rebel Inc.: persistent living map, spatial feedback and time flow;
- Civilization: tree readability/path satisfaction only, not research-point authority;
- Rebel Inc. Azure Dam: visible map-linked medium-term project;
- Against the Storm: strategic choices/upgrades visibly changing the world;
- Frostpunk: laws/state-building with visible consequences;
- Victoria / Paradox: institutional/faction trade-offs, not persistent dashboard UI;
- CK3: political geography / territory identity;
- Suzerain / Papers Please: briefing/decision flavor only.

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
-> branch/variant metadata
-> Content Studio editing and JSON patch export/import
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
- EventStore remains append-only; ChronicleDigest is presentation-only;
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