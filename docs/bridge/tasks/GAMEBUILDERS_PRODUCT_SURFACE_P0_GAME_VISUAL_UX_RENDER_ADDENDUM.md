# GAMEBUILDERS_PRODUCT_SURFACE_P0 — Game Visual UX / Renderer / Graphic Design Correction

TASK_ID: GAMEBUILDERS_PRODUCT_SURFACE_P0
STATUS: AUTHORIZED ADDENDUM
PRECEDENCE: after Gameplay Reality repair; applies together with Game Feel / Renderer / Content Studio addendum
WORK_BRANCH: gamebuilders-product-surface-p0

## 0. Blocking visual diagnosis

Hands-on mobile review shows that the product still reads as a styled website/dashboard rather than a game.

The problem is not just palette or missing illustration. The current UI grammar is dominated by:

```text
page background
-> rectangular bordered container
-> heading + paragraphs
-> nested rectangular controls
-> another bordered map container
-> another rectangular information box
```

This creates an admin/dashboard/document experience even when the colors are parchment-themed.

P0 cannot pass with a prettier version of this composition.

## 1. Core graphic-design target

The main play surface should be read in this order within ~2 seconds:

```text
1. THE WORLD / MAP
2. what is changing on the world
3. what requires my attention
4. what can I do
5. supporting numbers/details
```

Not:

```text
1. title/header
2. metric table
3. time-control form
4. map card
5. text card
```

The world is the canvas. UI is game chrome layered around and over it.

## 2. Ban the web-dashboard visual grammar

Normal gameplay must avoid having every feature represented as a white/beige rectangular card with border + shadow.

### Forbidden as dominant composition

- full-width page header that looks like a website navbar;
- five equal metric boxes as the main top visual;
- large rectangular card around the world map;
- nested cards inside cards;
- paragraphs permanently visible under every action;
- web-form style checkbox/controls as high-priority HUD;
- large empty margins around a small SVG world;
- repeated `border: 1px solid ...; background: ...; box-shadow: ...` as the visual identity of every system;
- generic dashboard tabs that could belong to a banking/admin SaaS.

Cards are still allowed for transient decision sheets, tooltips, event dossiers, or the Content Studio. They must not define the persistent gameplay silhouette.

## 3. Persistent gameplay composition

### Desktop

Target visual silhouette:

```text
┌ compact top status / date / time ┐
│                                  │
│       FULL POLITICAL WORLD       │
│       map / terrain / state      │
│                                  │
│  floating alerts      objectives │
│                                  │
│ [left contextual] [right action] │
└ compact bottom/edge navigation ──┘
```

- map/world stage >= 70% of visible gameplay area;
- map stage reaches close to viewport edges;
- UI panels float/dock over the world and can be collapsed;
- default world view should not be enclosed inside a large paper card;
- country/terrain mass must fill the camera frame, not sit as a small horizontal strip in a mostly empty rectangle.

### Mobile

Target:

```text
status/date minimal
[ FULL-WIDTH MAP ]
[ FULL-WIDTH MAP ]
[ FULL-WIDTH MAP ]
compact bottom navigation
optional bottom sheet only when opened
```

- the first viewport after gameplay enters must be dominated by the map;
- metrics collapse into icon + number chips or a single expandable status rail;
- manual +1/+7/+30 debug/capture controls must not consume prime screen area;
- auto-pause setting moves to settings/options, not the primary HUD;
- `소리` and `타이틀로` move into compact menu/settings chrome;
- bottom-sheet details should be dismissible by drag/close.

## 4. Map composition correction

Current screenshot failure: the political map is a narrow horizontal row of a few large hexes occupying a small fraction of a large beige field.

Correct this at both content-layout and renderer levels.

### World bounds

- calculate camera/world bounds from actual map content;
- auto-fit world with deliberate padding;
- avoid hard-coded view boxes leaving >30% useless empty visual space;
- arrange the P0 authored topology as a coherent 2D landmass/region composition, not a left-to-right test strip;
- preserve real axial topology and valid contacts/ownership.

### Level of visual abstraction

The player should perceive:

```text
country mass
-> region shapes/labels
-> terrain and landmarks
-> ideology/control overlays
-> contacts/fronts/pressure
```

before perceiving raw hex geometry.

Hexes are an interaction substrate. At default zoom their borders should be subtle or hidden unless controller/front/selection requires them.

### Required visual layers

- atmospheric background / paper-table or world backdrop;
- land/water/terrain mass;
- political territory wash;
- current-controller layer distinct from legal owner;
- terrain marks/textures;
- capital/settlement/state-project landmarks;
- ideology influence color/pattern layer;
- faction/organization markers only where authoritative;
- contact/trade/information routes where factual;
- active conflict/front layer where factual;
- labels and crests;
- factual animation/feedback layer.

## 5. Renderer language and motion

Static React DOM/SVG is acceptable only if it can achieve game-level spatial feedback. Run the authorized PixiJS spike from the Game Feel addendum.

### Desired game-render characteristics

- continuously renderable world stage;
- smooth pan/zoom;
- camera focus transitions;
- short factual tweens;
- masks/pattern overlays for ideology and controller state;
- map markers with depth hierarchy;
- texture atlas / sprite asset usage;
- responsive scaling independent of DOM panel layout;
- 60fps target on common phone/laptop for P0 map scale where practical.

PixiJS v8 is the preferred bounded candidate because its scene graph maps cleanly to TMR's existing Layer Registry and its Assets API supports manifest/bundle loading. Phaser may be evaluated but should not replace TMR's existing simulation/action clock during this sprint.

## 6. Graphic-design system

### Typography

Use at most three functional text roles in the persistent HUD:

```text
DISPLAY: title / major crisis only
HUD: compact labels and numeric state
BODY: contextual sheet / dossier only
```

Do not use paragraphs on the persistent map surface.

### Shape language

Replace repeated generic rectangles with a coherent game-specific vocabulary:

- narrow status rails;
- seals / stamps for critical state;
- crest medallions for countries;
- tabs integrated into the edge frame;
- anchored map pins and banners;
- compact ribbon/chip for resources;
- dossier sheet only when opened;
- institutional roadmap nodes with consistent icon frames.

Avoid random decorative shapes. Every repeated shape must have a semantic role.

### Iconography

Create one coherent icon family for:
- treasury;
- legitimacy;
- state capacity;
- instability/pressure;
- continuity;
- policy/institution;
- intervention/project;
- faction;
- conflict;
- diplomacy/contact;
- food/material/administration.

Do not use emoji or mismatched icon sets. Icons belong in the Asset Manifest with stable IDs/provenance.

### Color roles

Use semantic colors consistently:
- country identity colors;
- friendly/neutral/hostile relationship accents only when supported;
- crisis/red reserved for actual urgency;
- ideology uses dedicated patterned/tinted overlays rather than recoloring every UI component;
- construction/project uses one consistent implementation-state language;
- selected/focus uses one highlight system.

Do not make every panel parchment beige. Parchment should be material flavor, not the entire interface.

## 7. Visual hierarchy of numbers

Current equal-sized metric boxes make all numbers appear equally important and resemble a dashboard.

Replace with:
- 2–3 primary state signals visible by default;
- secondary metrics behind hover/tap/expand;
- delta arrows / recent-change flash when a factual value changes;
- warning treatment when an actual threshold/band is crossed;
- territorial/control/conflict status should outrank a misleading low national instability value when the country controls little/no territory.

Never fabricate a composite health score.

## 8. Game feel / juice without fake simulation

Allowed non-semantic ambient effects:
- subtle map paper movement/noise;
- water shimmer if water is merely decorative geography and not gameplay state;
- low-intensity vignette/light drift;
- hover/tap feedback;
- UI mechanical sounds.

Semantic effects must be event/state-driven:
- ideology support change -> region overlay visibly changes/pulses;
- border close -> route shuts/fades;
- controller change -> territory sweep;
- policy enacted -> institutional roadmap node transforms/seal appears;
- intervention project starts -> landmark construction state;
- project completes -> landmark completes;
- rebellion/coup -> persistent map-centered crisis treatment.

No constant random movement pretending something political is happening.

## 9. Decision UX should be spatial

Selecting/hovering an intervention or policy should visually connect it to the world:

- highlight affected Region(s);
- highlight affected Faction marker(s) when actually grounded;
- show cost/effect icons compactly;
- preview only declared effects, clearly as preview;
- long explanation appears only on demand.

The player should learn consequences by watching the map and state deltas, not by reading a wall of prose.

## 10. Institutional Roadmap visual UX

The roadmap added by the Game Feel addendum must itself look like a game system, not an HTML settings list.

- node/icon-based graph;
- actual prerequisite connections;
- enacted path visually persistent;
- incompatible path visibly crossed/locked;
- selecting a node focuses affected state/region/faction where applicable;
- completed major institutional changes can produce a map/capital visual trace when semantically supported;
- no generic research progress bar.

## 11. State-project / wonder visual UX

For 2–4 P0 projects, use multi-state visual assets:

```text
foundation / preparing
implementation/construction
completed
```

These states are projected from the existing Intervention lifecycle and duration.

The player must be able to zoom the map and see that the country they built is visually different from its starting state.

## 12. Content Studio is allowed to look like an admin tool

The new Content Studio is the ONE surface where a dense table/form UI is appropriate.

Keep it visually and route-wise separate from gameplay (`?contentStudio=1` or equivalent). Do not let its UI grammar leak back into the game.

## 13. Visual review checkpoints

Capture screenshots at:

```text
TITLE desktop
TITLE mobile
GAME Day 0 desktop
GAME Day 0 mobile
GAME Day ~90 after first meaningful dynamics
GAME Day ~360 with crisis/state changes
GAME after one Policy path
GAME after one completed State Project
CONTENT STUDIO desktop
```

Review each screenshot using these binary questions:

```text
Could this screenshot be mistaken for a normal website/admin dashboard? -> must be NO
Is the world/map the first thing the eye sees? -> YES
Can I see at least one consequence without reading a paragraph? -> YES
Can I identify the current crisis spatially? -> YES when crisis exists
Does the state look materially different after meaningful play? -> YES
Are cards/panels supporting the map rather than enclosing/replacing it? -> YES
Does mobile still look like a game rather than stacked responsive web cards? -> YES
```

## 14. P0 additional acceptance

```text
WEB_DASHBOARD_VISUAL_GRAMMAR_DOMINANT: NO
MAP_OCCUPIES_PRIMARY_VIEWPORT: YES
MAP_WORLD_BOUNDS_FILLED: YES
RAW_HEX_TEST_STRIP_APPEARANCE: NO
PERSISTENT_PARAGRAPHS_ON_MAIN_MAP: NO
PRIMARY_HUD_COMPACT: YES
SETTINGS_CONTROLS_OUT_OF_PRIMARY_HUD: YES
ICON_FAMILY_COHERENT: YES
MAP_TERRAIN_LANDMARK_VISUAL_DENSITY: PASS
FACTUAL_WORLD_MOTION_VISIBLE: YES
CAMERA_PAN_ZOOM_FOCUS: YES
POLICY_AND_PROJECT_VISUAL_TRACE: YES
MOBILE_STACKED_CARD_PAGE_FEEL: NO
CONTENT_STUDIO_SEPARATE_FROM_GAME: YES
SCREENSHOT_VISUAL_REVIEW: PASS_OR_BLOCKERS_DOCUMENTED
```
