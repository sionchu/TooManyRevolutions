# TMR Current Bridge Task

TASK_ID: GAMEBUILDERS_PRODUCT_SURFACE_P0
STATUS: AUTHORIZED
BASE_IMPLEMENTATION_HEAD: ee4b282c767538c39bbf8379528d16761d3d4878
BASE_IMPLEMENTATION_BRANCH: gamebuilders-demo-sprint-01
WORK_BRANCH: gamebuilders-product-surface-p0
TASK_FILE: docs/bridge/tasks/GAMEBUILDERS_PRODUCT_SURFACE_P0.md
RESULT_PATH: docs/bridge/results/GAMEBUILDERS_PRODUCT_SURFACE_P0_RESULT.md

## Accepted predecessor

```text
GAMEBUILDERS_DEMO_SPRINT_01: COMPLETE / REVIEWED / TECHNICAL_PASS / ACCEPTED_AS_VERTICAL_SLICE
REVIEWED_HEAD: ee4b282c767538c39bbf8379528d16761d3d4878
SITES_STATUS: DEPLOYED
TIME_FLOW_STATUS: PASS
DEMO_HORIZON_STATUS: STRONG_SHORT_HORIZON_LATE_STALL
SUBMISSION_READY: CONDITIONAL_POLISH_REQUIRED
PERSISTENCE_ACCEPTED: SerializedSimulationSnapshotV8 / format version 8
GATE1F: NOT_READY
V02: NOT_STARTED
```

## P0 mission

The current build is technically playable but visually/product-wise still reads too much like a text-heavy debug web app. The authorized P0 converts it into a coherent political-fantasy strategy-game surface.

Mandatory areas:

```text
locked title / brand identity
+ title -> opening briefing -> main-game build-up
+ anti-AI-slop visual bible
+ DB-like design registry / naming / layer hierarchy
+ replaceable asset manifest with provenance / generation recipes
+ unified AI-generated or procedural asset package
+ real neighboring Country/Region/LandHex entities in the GameBuilders scenario
+ layered political atlas where raw hexes are not the dominant look
+ responsive UI across desktop/laptop/tablet/mobile
+ player-facing copy cleanup and factual event fix
+ game-theoretic decision UX using actual declared costs/effects
+ external commercial UX references + vetted GitHub repo/license audit
+ Sites redeploy and responsive browser QA
```

## Design architecture rule

Visual work must remain partially replaceable. Do not create one monolithic AI background or one giant App/CSS implementation.

Required conceptual hierarchy:

```text
Design Tokens
-> Semantic Tokens
-> Design / Asset Registry
-> Layer Registry
-> Components
-> Screen Composition
-> State / Crisis Overlays
```

Stable IDs must identify assets/components/layers independent of filenames and array order. AI-generated assets require style-family/prompt/provenance records. Map layers must have explicit stable z-order and be independently renderable in development-only design debug mode.

## External references

Commercial game assets are inspiration only. Benchmark at minimum Suzerain, Papers Please, Crusader Kings III, and Frostpunk 2 for hook/map/political-pressure hierarchy.

Vetted implementation references include:

- Azgaar/Fantasy-Map-Generator — MIT; map data/render/editor separation and political atlas structure.
- Hellenic/react-hexgrid — MIT; optional hex rendering/coordinate reference.
- freeciv/freeciv-web — AGPL; UX reference only, no code copying by default.

Codex must audit additional reputable repos/skills with explicit license/use decisions before adopting them.

## Game-theory rule

Use game theory as a decision-design lens: opportunity costs, strategic response, externalities, credible commitment, signaling uncertainty, coordination/collective action, and principal-agent tension should be legible where supported by real current state and declared intervention effects.

Do NOT add a Nash/CFR/MCTS/RL/QRE/LLM solver, universal utility score, fake response percentages, or hidden strategy score.

Decision UI must distinguish:

```text
확정 비용
확정 변화
현재 관측
미확정 반응
```

Never present uncertain future behavior as guaranteed.

## Architecture boundaries

- accepted FIX23 simulation core remains authoritative;
- no direct UI WorldState mutation;
- no scripted/scheduled coup/rebellion;
- no fake Agenda/EventStore facts;
- neighboring countries shown on the map must be real authored scenario entities, not decorative labels;
- physical territorial authority remains LandHex controller state;
- fronts remain derived;
- no new F05 evidence/settlement runtime;
- no persistence V9;
- no Gate1F PASS;
- no V02;
- no commercial-game asset copying;
- no unvetted copyleft code import;
- no successor task self-authorization.

Execute every checkpoint in `docs/bridge/tasks/GAMEBUILDERS_PRODUCT_SURFACE_P0.md`, committing/pushing safe checkpoints without waiting for intermediate review. Stop after the final P0 result and Sites status are published.