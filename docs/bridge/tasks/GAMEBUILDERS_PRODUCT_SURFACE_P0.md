# GAMEBUILDERS_PRODUCT_SURFACE_P0 — Product Surface / Art / Map / UX

TASK_ID: `GAMEBUILDERS_PRODUCT_SURFACE_P0`
STATUS: `AUTHORIZED`
BASE_IMPLEMENTATION_HEAD: `ee4b282c767538c39bbf8379528d16761d3d4878`
BASE_BRANCH: `gamebuilders-demo-sprint-01`
WORK_BRANCH: `gamebuilders-product-surface-p0`
RESULT_PATH: `docs/bridge/results/GAMEBUILDERS_PRODUCT_SURFACE_P0_RESULT.md`

## 0. Mission

Turn the technically playable GameBuilders vertical slice into a visually coherent political-fantasy strategy game surface.

The current build is functionally real, but it still reads as a text-heavy/debug-oriented web app. This task is P0 productization: title fantasy, opening build-up, art direction, a real political world map with neighboring countries, responsive UI, coherent generated assets, player-facing copy, and game-theoretic decision presentation.

Do not deepen F05 simulation architecture in this task. Preserve the accepted FIX23 core and the reviewed GameBuilders thin-client architecture.

## 1. Non-negotiable product identity

Lock these strings as one product identity everywhere unless a dedicated copy constant intentionally supplies a short form:

```text
KO_TITLE: 내 왕국에 혁명이 너무 많다
EN_TITLE: TOO MANY REVOLUTIONS
TAGLINE: 정권은 무너져도, 국가는 계속된다.
```

The browser title, title screen, Sites metadata, loading/empty state, capture end frame, and major marketing copy must use the same identity. Do not reintroduce `Fantasy State Simulator`, `Gate 0`, or inconsistent alternate titles.

The first 15 seconds must answer:

```text
Who am I?        -> the historical continuity of a fragile kingdom/state
What is wrong?   -> scarcity, factional pressure, institutional conflict, neighboring powers
What do I do?    -> change institutions / commit interventions / control the flow of history
Why play?        -> every intervention changes incentives and produces counter-reactions; regime change is history, not automatic game over
```

## 2. Anti-AI-slop rule

The product must not look like an assortment of unrelated AI-generated fantasy assets.

Before implementing visual assets, create and lock one `TMR Visual Bible` with:

- period: late-19th-century / early-industrial fantasy constitutional crisis;
- visual language: engraved political atlas + lithographic newspaper/royal dossier + restrained gouache;
- palette family: aged parchment / charcoal ink / oxblood-crimson / desaturated indigo / muted brass;
- silhouettes: strong readable heraldry, print-like edges, limited material vocabulary;
- light: flat editorial/map lighting, not cinematic glossy 3D;
- texture: paper, ink, engraved hatching, restrained wear;
- typography: title/display serif + highly readable Korean UI sans; do not rasterize UI text into generated art;
- forbidden: generic purple fantasy glow, glossy mobile-game cards, random steampunk gears, anime, photorealistic medieval portraits, neon cyberpunk, glassmorphism, fake 3D UI, inconsistent render styles.

AI-generated raster art must never contain essential UI text. Text and controls remain DOM/SVG so they can be corrected independently.

Do NOT build the entire UI or map into one AI-generated background image.

## 3. Design system must be DB-like and partially replaceable

This is mandatory. Visual work must be editable by element, not as one monolith.

Create a typed design registry / manifest architecture. Exact file naming may adapt to the codebase, but the responsibilities must remain separate.

Recommended structure:

```text
src/presentation/design/
  tokens.ts or tokens.css
  designRegistry.ts
  assetManifest.ts
  layerRegistry.ts
  copyRegistry.ko.ts
  screenRegistry.ts
  designRegistry.test.ts

public/assets/tmr/
  brand/
  map/
  terrain/
  crests/
  factions/
  ui/
  fx/
  generated/
```

### 3.1 Stable naming

Use stable semantic IDs, not filenames as identity.

Examples:

```text
tmr.brand.logo.primary
tmr.brand.crest.arken
tmr.asset.title.hero.arken-crisis.v1
tmr.asset.map.terrain.mountains.01
tmr.asset.map.terrain.forest.01
tmr.asset.map.settlement.capital.arken
tmr.asset.country.arken.crest
tmr.asset.country.veloria.crest
tmr.asset.country.karsen.crest
tmr.component.hud.metric
tmr.component.council.action-card
tmr.layer.map.base
tmr.layer.map.terrain
tmr.layer.map.political
tmr.layer.map.settlements
tmr.layer.map.routes
tmr.layer.map.pressure
tmr.layer.map.labels
tmr.layer.ui.chrome
tmr.layer.ui.overlay
tmr.layer.ui.fx
```

Do not encode temporary React array order into identity.

### 3.2 Asset manifest

Each non-trivial asset must have a registry record containing at minimum:

```text
id
file/path
type (svg | png | webp | css | procedural)
role
layerId
version
source (generated | hand-authored | procedural | third-party-reference-only)
license/provenance
styleFamily = tmr-royal-revolution
promptRecipeId when AI-generated
transparentBackground when applicable
aspectRatio / crop policy
responsive usage notes
replaceable = true
```

If AI generation tooling is available in Codex Desktop, generate the required assets from ONE shared prompt prefix / style recipe and record prompt provenance in the manifest/documentation. If generation tooling is unavailable, create coherent SVG/procedural placeholders and store the exact future generation recipes instead of mixing arbitrary web images.

No unregistered art file may be used in production UI.

### 3.3 Layer hierarchy

Map and UI composition must use explicit layers with stable z-order. At minimum:

```text
00 atmosphere/background
10 terrain/base geography
20 political countries/borders
30 settlements/landmarks
40 routes/contact geography
50 state/faction/crisis overlays
60 labels
70 main UI chrome
80 drawers/modals/briefing
90 feedback/fx/accessibility
```

Each map layer should be independently renderable/toggleable in an optional development-only design debug mode (`?designDebug=1` or equivalent). Do not expose debug language in the normal player flow.

### 3.4 Registry QA

Add tests/checks for:

- duplicate design/asset/layer IDs;
- missing referenced asset files;
- invalid layer references;
- AI/generated assets missing provenance/prompt recipe;
- unregistered production art files when practical;
- broken country/crest references;
- player-facing copy registry containing prohibited developer jargon.

## 4. External reference audit — mandatory before implementation

Create `docs/GAMEBUILDERS_P0_REFERENCE_AUDIT.md` and record what is borrowed as a PRINCIPLE versus what may legally be reused.

### Commercial visual/UX references — inspiration only

Use official/public screenshots/pages only for structural benchmarking. Never copy their art/assets.

- Suzerain official site: https://www.suzeraingame.com/
  - reference: fictional-country hook, political responsibility, cabinet/decision framing, choices-have-consequences presentation.
- Papers, Please official site: https://papersplea.se/
  - reference: immediate role assignment, diegetic state-document language, high visual identity with limited assets.
- Crusader Kings III official/Steam materials
  - reference: readable political geography, neighboring polities, heraldry, map hierarchy.
- Frostpunk 2 official/Steam materials
  - reference: faction pressure, council politics, tension in UI hierarchy.

### GitHub / implementation references

Audit repository + license before using code/assets. At minimum inspect:

1. `Azgaar/Fantasy-Map-Generator` — MIT
   - use as reference for map data/render/editor separation, borders, labels, terrain and political map composition.
   - its license explicitly permits derivatives including created maps/images/screenshots/videos, but attribution/license obligations must still be respected for copied software portions.
2. `Hellenic/react-hexgrid` — MIT
   - use only if its coordinate/component patterns materially improve the current renderer; adding it as a dependency is optional.
3. `freeciv/freeciv-web` — AGPL
   - UX / strategy-map reference only. Do NOT copy code into TMR unless deliberate AGPL implications are accepted. Default is no code copying.
4. Search for additional reputable frontend/game-map/UI repos or agent `SKILL.md` resources. Record repository owner, exact useful pattern, license, and adoption decision. Do not trust random “AI design skill” repos merely because they rank in search.

Use external references actively, but every adoption needs a reason. No cargo-cult dependencies.

## 5. P0 title → build-up → main-game flow

Current title-to-game transition is too thin. Build an intentional three-stage experience.

### Stage A — Title / proposition

Required:

- locked title identity;
- distinctive brand mark/crest;
- visual hero composition built from replaceable layers/assets;
- one concise core hook;
- `새 게임` as clear primary action;
- small `게임 방법` / `이 세계는?` secondary entry if time permits;
- no debug content.

The title must communicate political fantasy, not generic medieval fantasy.

### Stage B — Opening royal/state briefing

Before the main HUD, show a short skippable 2–4 beat briefing, not a quest chain.

The briefing should use actual authored demo scenario facts and can be structured as dossier pages / council dispatches:

1. `아르켄 왕국은 살아남았지만 질서는 흔들리고 있다.`
2. current material pressure / industrial region unrest;
3. named factions and institutional fracture;
4. neighboring powers / the player's mandate.

No future event may be promised or scripted. Do not say a coup/rebellion “will” occur.

Add `다시 보지 않기` only if cheap. The briefing is presentation state, not authoritative WorldState.

### Stage C — Main screen

The main screen must read as a political-strategy command surface, not a dashboard.

Visual priority:

```text
WORLD / CURRENT CRISIS first
-> WHAT CAN I DO second
-> STATE METRICS third
-> HISTORY / DETAILS on demand
```

The map should visually dominate on desktop.

## 6. Real political world map — P0

The current sparse hex projection is not acceptable as the final P0 map.

### 6.1 Neighboring countries must be real scenario entities

Do not paint decorative fake countries behind the map.

Extend only the GameBuilders demo scenario with at least two meaningful non-player neighboring `Country` entities, plus valid Government/Region/LandHex ownership/control as required by ScenarioDefinition. Reuse existing validated multi-country fixture patterns (for example `contactFixture.ts`) as implementation guidance, but do NOT simply ship the 7-Region/9-LandHex validation fixture as the product map.

Target a compact political atlas that fits the demo safely, roughly:

```text
3–4 countries total
8–14 named regions
12–24 LandHexes
```

Exact counts may be lower if adding entities destabilizes accepted simulation behavior; correctness beats arbitrary cardinality. Any authored neighbors must pass scenario/runtime closure and must not silently invalidate the existing short-horizon demo trajectory.

Every visible country label/crest/color must resolve to an actual authored Country.

### 6.2 Map rendering language

Keep authoritative LandHex controller semantics, but visually de-emphasize the raw debug-grid look.

Render layered political geography:

- parchment/atlas background;
- terrain fill/texture by actual terrain type;
- coast/water where supported by topology/presentation;
- stronger outer country border vs subtle internal Region/hex divisions;
- country tint washes;
- region names;
- country names;
- capital/important settlement marker;
- country crest/banners;
- selected region focus;
- actual faction/territorial pressure overlay;
- actual derived front only when it exists;
- subtle contact/foreign route layer only when actual data exists.

Hex boundaries may remain as a faint tactical substrate or appear on hover/selection; they must not be the dominant visual identity.

No invented armies/crowds/fronts/foreign interventions.

## 7. Unified AI/generated asset package

The P0 asset set should be small but reusable and coherent.

Prioritize:

```text
1 brand mark / title crest
3–4 country crests
2 faction emblems
1 title hero illustration or layered vignette
terrain marks: mountain / forest / field / coast / industrial
capital / city / mine / factory / port markers as needed by actual map data
UI ornaments: divider / seal / warning stamp / paper edge
```

Prefer transparent modular assets so one element can be regenerated without replacing the full screen.

All AI-generated assets must use the same art bible / prompt prefix. Generate variants only intentionally (`v1`, `v2`) and update the manifest instead of overwriting identity silently.

If generated assets include malformed text, discard them; UI text stays separate.

## 8. Responsive UI — P0

The desktop build is primary, but the Site must remain intentional at common laptop/tablet/mobile sizes.

Required layouts:

### Wide desktop >= 1440px
- map dominant center;
- council/actions dock;
- current crises/agendas visible;
- compact top state strip.

### Laptop 1024–1439px
- map remains primary;
- side panels become narrower/drawers;
- no tiny text or horizontal overflow.

### Tablet 768–1023px
- two major panes or map + tabbed/drawer secondary content;
- touch hit targets >= ~44 CSS px where practical.

### Mobile < 768px
- map/full-state view first;
- bottom/tab navigation for `지도 / 국정 / 결정 / 기록` or equivalent;
- avoid rendering three desktop columns stacked into an endless wall of text;
- no horizontal overflow.

Use CSS grid/flex/container/media queries. Do not fork the simulation or create separate mobile state.

Test at minimum:

```text
1920x1080
1440x900
1366x768
1024x768
768x1024
390x844
```

## 9. Player-facing copy cleanup

Remove from normal UI:

```text
Renderer-neutral
LandHex projection
ActionRecord
authoritative history
T018
RunOutcome
fixture.* IDs
raw Country/Faction/Ideology IDs
```

Fix the already-reviewed event factual bug:

`RESOURCE_SHORTAGE_CHANGED` must read the producer's actual `scarcity` payload, not nonexistent `nextScarcity`.

Use catalog/entity names via lookup helpers.

Centralize copy in the copy registry instead of scattering strings across `App.tsx`.

## 10. Game theory applied to decision UX

Apply game theory as a design lens, not as a hidden solver or universal score.

Core concepts to make visible through actual existing state/effects:

- opportunity cost;
- strategic response by factions;
- externalities across groups;
- credible commitment / irreversibility where a real duration or institutional change exists;
- signaling/information uncertainty;
- collective-action and coordination pressure;
- principal-agent tension between state capacity and faction/government actors.

### 10.1 Decision card information architecture

For each intervention, separate:

```text
확정 비용       -> treasury / administrative load / duration from schema
확정 변화       -> declared completionEffects only
현재 이해관계   -> current actual faction/region pressure when safely derivable
미확정 반응     -> do NOT fabricate probability or guaranteed reaction
```

Use explicit language like `확정`, `현재 관측`, `반응은 미확정` to avoid fake prediction.

Example from existing authored effects:

- legalization can visibly reduce one faction grievance while increasing coup-faction grievance if those effects are actually declared;
- coercive restriction can reduce organization but increase grievance when both are declared;
- relief trades treasury/admin load for actual regional production capacity.

This is the core strategic value proposition: there should rarely be a universally best choice.

### 10.2 No game-theory overreach

Forbidden:

- Nash/CFR/MCTS/RL/QRE/runtime LLM strategy solver;
- one universal utility number;
- fake predicted faction-response percentages;
- hidden strategic score;
- inventing preferences from faction names/ideology labels;
- presenting a derived heuristic as guaranteed future outcome.

### 10.3 Decision-quality QA

Create a lightweight inspection/checklist that asks:

- does one visible option strictly dominate the others only because information is missing?
- are trade-offs legible in under 10 seconds?
- are certain facts separated from uncertain reactions?
- does the player understand who is affected?
- is the cost of waiting/no action visible when factual pressure exists?

Do not convert this checklist into an authoritative scoring mechanic.

External theory grounding:

- MDA: mechanics -> dynamics -> player experience; use it to review whether presentation reveals the real systemic dynamics.
- game theory: strategic interaction outcomes can emerge from interacting choices rather than authored narrative.
- Schelling: commitment/coordination/signaling are useful lenses for political choice design; do not mechanically import nuclear-deterrence models.

## 11. Implementation decomposition / partial-edit rule

Do not let `App.tsx` grow into another 1000+ line monolith.

Split product surfaces into named components/modules, e.g.:

```text
TitleScreen
OpeningBriefing
GameShell
RealmMap
MapLayer*
TopStateBar
CouncilPanel
DecisionCard
AgendaPanel
RegionDrawer
ForeignPowersStrip
ChroniclePanel
CrisisOverlay
TimeControls
SoundControls
```

Each component should consume derived/presentation props and avoid owning authoritative simulation rules.

Do not put all styles in one ever-growing CSS file if modular CSS/design-token separation is practical in the current toolchain.

## 12. Checkpoints — continuous P0 execution

This task authorizes all checkpoints. Commit/push after each safe checkpoint and continue without waiting for user review.

### P0-A — Reference audit + visual bible + registries

Deliver:

- `docs/GAMEBUILDERS_P0_REFERENCE_AUDIT.md`
- `docs/GAMEBUILDERS_ART_BIBLE.md`
- design tokens/registry/asset manifest/layer registry/copy registry skeleton
- tests for registry uniqueness/closure

### P0-B — Title + opening build-up + brand asset package

Deliver coherent title, brand crest/mark, opening briefing, player fantasy.

### P0-C — Political atlas + real neighbors

Author valid demo-only neighboring countries and render a layered political map. Verify existing demo gameplay remains functional/deterministic.

### P0-D — Main HUD/decision UX + game-theory pass

Recompose main screen around map/crisis/decision hierarchy, expose real trade-offs, remove developer jargon, fix factual event bug.

### P0-E — Responsive pass + visual polish

Verify six required viewport sizes; touch/keyboard basics; no horizontal overflow; asset crops/variants use manifest rules.

### P0-F — QA + Sites redeploy

Run at minimum:

```text
pnpm run format
pnpm run typecheck
pnpm run lint
pnpm run build
focused design/registry/demo tests
pnpm test
pnpm run inspect:v01
pnpm run inspect:t018
pnpm run inspect:t021
pnpm run inspect:t024
git diff --check
```

Then deploy the ACTUAL updated build to the existing ChatGPT Sites project / URL if supported by current tooling. Verify the published player path on desktop and mobile. Do not create a mock replacement Site.

Update/rewrite `docs/GAMEBUILDERS_3MIN_SHOTLIST.md` so it captures the new title -> briefing -> political world -> decision -> consequence path. Prefer a deterministic real crisis trajectory when achievable without scripting.

## 13. Acceptance criteria

P0 passes only if all are true:

```text
TITLE_IDENTITY_CONSISTENT: YES
OPENING_BUILDUP_PRESENT: YES
PLAYER_FANTASY_CLEAR_UNDER_15S: YES
DESIGN_REGISTRY_IMPLEMENTED: YES
ASSET_MANIFEST_IMPLEMENTED: YES
LAYER_REGISTRY_IMPLEMENTED: YES
PARTIAL_ASSET_REPLACEMENT_SUPPORTED: YES
AI_ASSET_STYLE_COHERENT: YES_OR_TOOL_BLOCKER_DOCUMENTED
POLITICAL_WORLD_MAP: YES
REAL_NEIGHBOR_COUNTRIES_VISIBLE: YES
RAW_HEX_DEBUG_LOOK_DOMINANT: NO
PLAYER_FACING_DEV_JARGON: NONE
RESOURCE_SHORTAGE_EVENT_MAPPING_CORRECT: YES
DECISION_TRADEOFFS_VISIBLE: YES
FAKE_PREDICTION_OR_SOLVER: NO
RESPONSIVE_1920_1440_1366_1024_768_390: PASS
SITES_REDEPLOYED: YES_OR_EXACT_BLOCKER
GATE1F: NOT_READY
V02: NOT_STARTED
```

## 14. Hard architecture boundaries

Preserve all accepted TMR rules:

- player = CountryId continuity, not ruler/government;
- Government transition is nonterminal;
- only `WorldState.landHexStates[*].controller` owns physical territorial authority;
- Region.stateControl is not ownership;
- fronts remain derived;
- no invented army/crowd/banner/front entity absent from authored/presentation state;
- no direct UI WorldState mutation;
- player actions use common ActionRecord/simulation boundaries;
- no scripted/scheduled coup/rebellion;
- no fake Agenda/EventStore facts;
- no hidden pacing mechanic;
- no F05 operational-evidence/settlement implementation;
- no persistence V9;
- no Gate1F PASS;
- no V02;
- no copyrighted commercial-game asset copying;
- no unvetted copyleft code import;
- no successor task self-authorization.

## 15. Final result

Create `docs/bridge/results/GAMEBUILDERS_PRODUCT_SURFACE_P0_RESULT.md` containing:

- checkpoint commits;
- reference audit summary;
- final design system file map;
- asset manifest statistics + provenance summary;
- AI generation tool/status and generated asset list;
- map/country/region/hex counts;
- responsive QA matrix;
- game-theory decision UX findings;
- test/build results;
- Sites deployment URL/status;
- screenshots/review notes if tooling can capture them;
- remaining P0/P1 blockers.

Stop only after P0-F result is pushed to `gamebuilders-product-surface-p0`.