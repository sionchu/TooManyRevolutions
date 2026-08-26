# GAMEBUILDERS_PRODUCT_SURFACE_P0 — Continuous Terrain / Content Authoring Addendum

Date: 2026-08-26
Task: `GAMEBUILDERS_PRODUCT_SURFACE_P0`
Status: AUTHORIZED SUPPLEMENT TO CURRENT TARGETED REWORK
Applies with: `GAMEBUILDERS_PRODUCT_SURFACE_P0_SEMANTIC_WORLD_OBJECT_ART_REWORK_ADDENDUM.md`

## User product finding

Latest hands-on mobile review identifies two additional blockers:

1. title/opening briefing prose is too authored/opaque to lock this early; the user wants rough generated scenario copy to exist as editable content and to refine it later through the Content Studio/admin surface;
2. the world still visually reads as explicit raised hex pieces. The target is Civilization/strategy-game-style terrain where the logical hex grid exists underneath, but terrain, borders, roads, settlements and political activity read before the tile geometry.

These findings strengthen the current targeted rework. They do not reopen renderer selection or simulation architecture.

# Part A — Content authoring, not hardcoded prose

## A1. Authoring-time generated baseline

Player-facing title/briefing text should be treated as **editable authored content**, not sacred source-code prose.

Preferred workflow:

```text
Scenario facts / content metadata
-> ChatGPT/Codex authoring-time draft generation OR imported draft pack
-> stable ContentRegistry records
-> Content Studio edit / preview
-> JSON patch export
-> repo apply / review / deploy
```

P0 does not require a runtime LLM/API dependency. Draft generation may happen during content authoring through ChatGPT/Codex or an imported JSON pack. The production game consumes reviewed static content records.

## A2. ContentRegistry becomes the player-copy source

`TitleScreen` and `OpeningBriefing` currently read `PLAYER_COPY` directly. That is insufficient for the user editing workflow.

All visible title/briefing fields must have stable content IDs and be resolved through the same content-authoring layer used by Content Studio.

At minimum cover:

```text
title eyebrow
title Korean title / English title
tagline
optional title hook
secondary/world-note label and body if retained
footer if retained
start action label

briefing masthead/label
beat eyebrow
beat title
beat body
skip / next / finish labels
```

`PLAYER_COPY` may remain a compile-time seed/fallback but must not be the only runtime source for these screens.

## A3. Admin/Content Studio requirements

Content Studio must support a clear `타이틀 / 브리핑` authoring workflow:

- filter directly to title/briefing records;
- edit every player-visible field above;
- live preview of title and current briefing beat where practical;
- baseline vs edited diff;
- local draft persistence;
- Korean length warning;
- reset entry / reset all;
- JSON patch import/export/copy;
- stable ID visible to the author;
- branch/variant metadata retained.

Static Sites must not pretend to write GitHub directly.

Canonical workflow remains:

```text
Content Studio edit
-> export JSON patch
-> ChatGPT/Codex/repo tool applies patch
-> diff review
-> rebuild/deploy
```

## A4. Title/briefing information policy

Do not spend P0 visual review time polishing opaque prose as if it were final narrative.

The default title should be visually simple:

```text
product title
+ one short tagline/hook
+ New Game
```

Additional exposition is optional and editable.

Opening briefing should communicate current scenario facts simply. It may use generated draft text, but the player must be able to skip it and the author must be able to rewrite it later without touching React source.

# Part B — Hex is the logic, not the picture

## B1. Core visual contract

```text
LOGICAL_TOPOLOGY = HEX
DEFAULT_VISUAL_ART_UNIT != HEX
```

LandHex remains authoritative for territorial controller, movement/topology and spatial mechanics. However, the normal production camera must **not** look like a board made from individual extruded hex columns.

The player should first perceive:

```text
terrain
-> country / territorial geography
-> roads/routes/rivers if present
-> cities/POIs/projects
-> conflict/political activity
```

and only then, when useful, the underlying hex selection/grid.

## B2. Continuous terrain requirement

Replace the default `raised individual hex pillar` look with a visually continuous terrain surface.

Allowed implementation approaches within R3F:

- contiguous top-surface mesh generated from the same hex topology;
- tile top faces that meet seamlessly with no obvious gaps/pillar sides;
- subtle terrain height blending / shared material system;
- coastline/cliff/meaningful elevation edges may expose vertical relief;
- terrain decals/props may cross the visual impression of tile boundaries while preserving underlying topology.

Do not use every hex's side wall/extrusion as the dominant world silhouette.

Verticality should come primarily from:

```text
mountains / hills
settlements / castles
mines / industry
forts
state-project landmarks
conflict objects / banners
```

not from every tile being a raised token.

## B3. Hex/grid visibility policy

Normal default:

```text
ALWAYS_VISIBLE_HEX_GRID: NO
```

Visible when useful:

- hovered/selected tile;
- controller-change/contested edge;
- optional strategic grid lens;
- developer/debug mode;
- movement/targeting interaction if a future mechanic genuinely needs it.

Country borders and current controller boundaries are separate political information and may remain visible according to the active map lens.

Acceptance principle:

> With tile outlines disabled, the screenshot must still look like a coherent playable world, not like information disappeared.

## B4. Civilization / Three-Kingdoms-style reference interpretation

Use the reference only as a design principle:

```text
calculation/navigation tile underneath
+ continuous terrain/art above
+ city/road/object hierarchy above the tile grid
+ selection reveals tile when necessary
```

Do not copy commercial map art, assets, shaders, UI layout or game rules.

The TMR adaptation is specifically:

- Region politics remains aggregate;
- LandHex remains territorial substrate;
- terrain/object presentation masks the raw grid during normal observation;
- controller/front/selection can reveal the relevant hex topology contextually.

# Part C — Map must fill the device

## C1. Mobile map-first viewport

The current map reads too narrow because it is nested inside a bordered content card with substantial surrounding HUD/UI.

On the map tab, the normal world stage should be effectively edge-to-edge inside the safe area.

Target at 390×844 portrait:

```text
WORLD_STAGE_WIDTH >= 94% of usable viewport width
WORLD_STAGE_HEIGHT >= 62svh where browser chrome allows
SIDE_GUTTER <= 8px per side inside gameplay surface
PRIMARY_WORLD_VISIBLE_AREA dominates first gameplay viewport
```

Do not wrap the production world in a large parchment/card margin.

## C2. HUD compression

Move secondary controls and explanations out of the world viewport.

Default top/edge chrome should prioritize:

```text
date/time
pause/speed
2–3 critical qualitative state cues
one urgent alert when present
```

Move these away from persistent prime space:

```text
manual +day debugging/assist controls
exact numeric disclosure
settings/auto-pause explanation
long map fact summaries
large current-pressure card
```

They may live in compact menu/details/drawer surfaces.

## C3. Camera fit

Initial fit must use the screen, not preserve empty padding around a small map cluster.

- world fills the horizontal visual field;
- pan/zoom remains available;
- labels may de-clutter at wide fit;
- world objects remain legible at mobile scale;
- do not crop the world merely to make hexes larger.

# Required implementation markers

```text
TITLE_BRIEFING_CONTENTREGISTRY_SOURCE: YES
TITLE_BRIEFING_ADMIN_EDITABLE: YES
TITLE_BRIEFING_LIVE_PREVIEW: YES_OR_DOCUMENTED_LIMIT
RUNTIME_LLM_REQUIRED: NO

LOGICAL_HEX_RETAINED: YES
ALWAYS_VISIBLE_HEX_GRID: NO
CONTINUOUS_TERRAIN_READS_BEFORE_HEX: YES
HEX_PILLAR_BOARD_LOOK_DOMINANT: NO
HEX_SELECTION_CONTEXTUAL: YES

MOBILE_WORLD_STAGE_WIDTH_94PCT: PASS
MOBILE_WORLD_STAGE_HEIGHT_62SVH: PASS_OR_BROWSER_CONSTRAINT_DOCUMENTED
MAP_WRAPPED_IN_LARGE_CONTENT_CARD: NO
DEFAULT_HUD_DOMINATES_WORLD: NO
```

# Required visual evidence

From the exact deployed source commit:

1. mobile Day 0 map with grid/hex outlines not visually dominant;
2. same map with one selected hex showing contextual tile affordance;
3. rebellion/controller-change screen showing topology when strategically relevant;
4. title screen and Content Studio title-edit view;
5. briefing beat and Content Studio briefing-edit view;
6. 390×844 viewport showing world-stage width/height measurements.

# Hard boundaries

- no simulation/topology rewrite;
- no replacement of LandHex authority;
- no runtime LLM dependency for production gameplay;
- no direct admin-to-GitHub fake write path;
- no new renderer migration; R3F remains production renderer;
- no generic research/political mana;
- no persistence V9;
- no Gate1F PASS;
- no V02;
- no successor self-authorization.
