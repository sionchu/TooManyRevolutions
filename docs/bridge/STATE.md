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
F05: measurement complete; Gate 1F NOT_READY
F05_FIX1..F05_FIX23: accepted progression through rebellion persistence bootstrap episode
GAMEBUILDERS_DEMO_SPRINT_01: TECHNICAL_PASS / ACCEPTED_AS_VERTICAL_SLICE
```

## Stable core / reviewed demo base

```text
CORE_IMPLEMENTATION_HEAD: 82bb6018f2fc87d9f1807cab3c12fb5e2e016775
GAMEBUILDERS_REVIEWED_HEAD: ee4b282c767538c39bbf8379528d16761d3d4878
PERSISTENCE_FORMAT: V8
TIME_FLOW_STATUS: PASS
DEMO_HORIZON_STATUS: STRONG_SHORT_HORIZON_LATE_STALL
GATE1F: NOT_READY
V02: NOT_STARTED
```

The reviewed GameBuilders demo is a real thin client over the accepted simulation core, but product review found that the title/build-up/world-map/art/asset/UI surface is still not convincing enough for final submission. The next authorized work is therefore a P0 product-surface sprint rather than deeper F05 implementation.

## Current authorization

```text
CURRENT_TASK_ID: GAMEBUILDERS_PRODUCT_SURFACE_P0
CURRENT_TASK_STATUS: AUTHORIZED
TASK_FILE: docs/bridge/tasks/GAMEBUILDERS_PRODUCT_SURFACE_P0.md
BASE_IMPLEMENTATION_HEAD: ee4b282c767538c39bbf8379528d16761d3d4878
WORK_BRANCH: gamebuilders-product-surface-p0
RESULT_PATH: docs/bridge/results/GAMEBUILDERS_PRODUCT_SURFACE_P0_RESULT.md
NEXT_AUTHORIZED_TASK_ID: GAMEBUILDERS_PRODUCT_SURFACE_P0
```

## P0 product direction

Locked player-facing identity:

```text
내 왕국에 혁명이 너무 많다
TOO MANY REVOLUTIONS
정권은 무너져도, 국가는 계속된다.
```

The P0 must deliver an intentional title -> opening briefing -> main-game flow, a visually dominant political atlas with real neighboring scenario Countries, coherent generated/procedural asset language, responsive screen composition, and decision UX that makes strategic trade-offs legible without inventing future outcomes.

## Design system / partial-edit contract

Visual implementation must be modular and DB-like rather than a one-shot AI composition.

Required conceptual stack:

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

Asset, layer, component, copy, and country visual identities use stable semantic IDs. AI-generated assets must carry style-family/prompt/provenance/version metadata and remain individually replaceable. Map/UI layers require explicit stable z-order. Normal player UI must not expose design/debug vocabulary.

## External reference policy

Commercial games are reference-only: Suzerain, Papers Please, Crusader Kings III, Frostpunk 2.

Vetted GitHub references:

```text
Azgaar/Fantasy-Map-Generator: MIT; political-map and data/render separation reference
Hellenic/react-hexgrid: MIT; optional coordinate/rendering reference
freeciv/freeciv-web: AGPL; UX reference only, no code copying by default
```

Additional GitHub repositories/agent skills may be inspected only with explicit license/reputation/use decisions. Do not adopt random AI design skill repositories merely from search ranking.

## Game theory design lens

Use opportunity cost, externalities, strategic response, credible commitment, signaling/uncertainty, coordination/collective action, and principal-agent tension only where existing authoritative state or declared intervention effects support them.

Player-facing decisions should distinguish certain cost/effect from current observations and uncertain response. No solver, universal utility score, response probability fabrication, or hidden strategy meter is authorized.

## Product-QC items carried forward

The P0 must also correct the reviewed demo issues:

- remove `Renderer-neutral`, `LandHex projection`, `ActionRecord`, `authoritative history`, `T018`, `RunOutcome`, fixture IDs and raw ideology IDs from player UI;
- fix `RESOURCE_SHORTAGE_CHANGED` display to use actual payload field `scarcity`;
- rebuild the 3-minute capture path around the improved title/briefing/world map and a deterministic real crisis trajectory when feasible without scripting.

## Preserved architecture constraints

- player = CountryId continuity, not ruler/government;
- Government transition remains nonterminal;
- physical territorial authority remains only `WorldState.landHexStates[*].controller`;
- Region.stateControl is not territorial ownership;
- fronts remain derived;
- presentation may not invent armies/crowds/fronts or fake countries;
- neighboring countries displayed in the world atlas must be valid authored scenario entities;
- no direct UI WorldState mutation;
- actions use existing common action/simulation boundary;
- no fake/scheduled coup, rebellion, Agenda, or EventStore history;
- no hidden pacing mechanic;
- no F05 operational-evidence/settlement implementation in P0;
- no persistence V9;
- no commercial-game asset copying;
- no unvetted copyleft code import;
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