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
BASE_IMPLEMENTATION_HEAD: ee4b282c767538c39bbf8379528d16761d3d4878
WORK_BRANCH: gamebuilders-product-surface-p0
NEXT_AUTHORIZED_TASK_ID: GAMEBUILDERS_PRODUCT_SURFACE_P0
```

## In-progress P0 review finding — BLOCKING

Latest inspected P0 branch head during hands-on review:

```text
P0_INSPECTED_HEAD: a4287a1dd5978bd87713a9ecb019e270331b7239
P0_COMMITS_AHEAD_OF_DEMO_BASE: 15
USER_OBSERVED_LATE_TICK: ~1528
USER_REPORTED_FEELING: visually static / text feels fictitious / not game-like
```

The P0 has successfully added modular design registries, replaceable assets, title/briefing flow, real neighbor Countries, a political atlas, responsive components, and map-first decomposition. However, those improvements do not yet solve the more important gameplay-readability/integration problem.

Independent source review found:

1. `runSimulationStep()` emits next-tick system `actionProposals`, but current `demoGame.ts` discards them after each committed step. Faction and foreign heuristic proposals therefore do not become the next tick's ActionRecords in the player runtime.
2. The accepted monthly ideology diffusion system exists but the demo runtime does not install `createIdeologyDiffusionPhaseHook()`, so cross-border ideology propagation is absent from actual play.
3. The political atlas base fill uses Region legal ownership rather than current LandHex controller, so rebellion/occupation can change authoritative territorial control without a correspondingly obvious map-color change.
4. Current coup/rebellion UI derives from a recent-event window; unresolved active Conflicts can disappear from player presentation after routine events accumulate.
5. Raw recent events and long explanatory decision cards overuse text. Game theory is currently explained rather than made quickly playable.
6. Current player action UI exposes Interventions but not the already implemented Policy/`ENACT_POLICY` institution path.
7. The player's territorial substrate remains small enough that crisis territorial movement can exhaust visible front motion quickly while the accepted late-state unresolved-conflict issue persists.

Therefore static visual polish is no longer the next priority. The mandatory Gameplay Reality addendum must be completed before P0 can pass.

## P0 reality target

The actual player runtime must visibly realize existing accepted systems:

```text
player Policy + Intervention input
+ carried faction/foreign system actions through common ActionRecord intake
+ contact-driven ideology diffusion
+ visible current LandHex control changes
+ persistent active crisis state
+ meaningful sparse political event feedback
+ clear consolidation objective/blockers
```

The map remains the persistent playfield. Text/dialog/drawers explain changes; they do not substitute for changes.

Required new P0 result markers include:

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
MOBILE_MAP_FIRST_VIEWPORT: PASS
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

Plague Inc. / Rebel Inc. are the primary persistent-map/pacing references. CK3 is political geography. Suzerain/Papers Please are title/briefing/decision framing only.

## Design system / partial-edit contract

Keep the in-progress modular stack:

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

Do not regress to a monolithic AI image or one giant component.

## Preserved architecture constraints

- player = CountryId continuity, not ruler/government;
- Government transition remains nonterminal;
- physical territorial authority remains only `WorldState.landHexStates[*].controller`;
- Region.stateControl is not territorial ownership;
- fronts remain derived;
- no invented armies/crowds/fronts;
- no fake countries / Agenda / EventStore facts;
- no direct UI WorldState mutation;
- all actions use common action/simulation boundaries;
- no scripted/scheduled coup/rebellion;
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

Do not resume these until the GameBuilders P0 is independently reviewed or explicitly paused.