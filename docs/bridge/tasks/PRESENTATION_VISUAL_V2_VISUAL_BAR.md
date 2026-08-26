# PRODUCT PRESENTATION VISUAL V2 — HARD VISUAL BAR

Status: ACTIVE AUTHORITY for `presentation-visual-v2`

Purpose: prevent another technically-correct but visually poor build. This document judges screenshots first. Unit tests, DOM rectangles, and overflow counters are necessary checks, not substitutes for visual quality.

## 1. Product target

The product should read in the first two seconds as a **living illustrated political strategy map**, not a React dashboard, map editor, asset gallery, GIS overlay, or AI-generated SaaS template.

Visual reading order:

1. world geography
2. current crisis / important place
3. player choice
4. secondary state information

The world must remain the primary surface. UI appears to serve the world, not frame it with boxes.

## 2. Non-negotiable anti-slop rules

A screenshot is a HARD FAIL if any of the following are visible:

- repeated dark rounded cards with gold borders used as the universal visual language;
- obvious admin/SaaS dashboard composition;
- translucent terrain polygons overlapping like a Venn diagram or GIS heatmap;
- a GLTF landmark that looks pasted onto a flat colored surface with no ground relationship;
- giant environment props, per-Hex tree/rock/mountain scatter, or asset-gallery composition;
- beige procedural hero landmark mixed beside resolved KayKit hero art;
- default visible Hex board seams used as the terrain art;
- text clipping, broken Korean wrapping, vertical letter stacking, or ellipsis on essential player copy;
- HUD, CTA, bottom sheet, camera controls, navigation, or event panels visually overlapping each other;
- player-facing developer language such as `simulation catalog`, `depth`, fixture IDs, internal event IDs, debug counters, or implementation terminology;
- body/player copy smaller than 13px desktop or 14px mobile unless it is genuinely secondary metadata;
- more than 5 default map labels on desktop or more than 3 on mobile;
- more than 2 persistent HUD bands on mobile;
- a Decision surface that leaves less than about 45% of the mobile viewport usable for its own content or places playback controls over its CTA;
- a full-screen Institutions/Chronicle screen composed primarily of repeated generic cards;
- unexplained empty graph space dominating the Institutions viewport while meaningful nodes are compressed into one corner.

Any single HARD FAIL blocks final deployment until corrected.

## 3. World-map visual contract

### 3.1 Logical Hex vs visible terrain

`LandHex` remains authoritative for gameplay. It must not be the default art primitive.

Use logical Hex data as inputs for:

- shared terrain mesh topology;
- terrain/neighbour influence;
- coast and connected land masks;
- interaction/selectability;
- controller/front derivation.

Do not represent ordinary terrain by drawing each connected component as a flat translucent polygon.

### 3.2 Continuous terrain

The normal map must be rendered by a shared terrain surface with visible relief and material variation.

Required properties:

- shared vertices across neighbouring logical Hexes;
- terrain elevation as a presentation transform, not WorldState mutation;
- slopes visible through lighting/normals;
- world-space variation/noise so patterns do not restart per Hex;
- coastline visibly distinct from interior land;
- mountains/hills expressed mainly as terrain elevation/material, not object tokens;
- forests/wetlands expressed mainly as terrain treatment/mass at default/medium LOD, not repeated tree props.

`runtimeGeometry.worldSurfaces` and `terrainSurfaces` may remain topology/mask sources but should not be the main visible flat land art.

### 3.3 Landmark composition

Default/medium hero groups: 3–5 maximum.

Each hero group must read as a **place**, not a model preview.

A place may use:

- one primary resolved hero asset;
- a tightly bounded decorative satellite composition;
- local ground footprint/material treatment;
- existing factual route relationship when available;
- contact shadow and scale hierarchy.

Decorative satellites must never imply a new authoritative state fact. They are presentation substrate only.

Capital must be the strongest silhouette. Industrial/frontier must be subordinate. No environment object may visually exceed the capital.

### 3.4 Political overlay

Default mode is geography-first.

Controller/front/ideology/rebellion information is state-driven, but not all layers may shout simultaneously.

Use a visibility budget:

- DEFAULT: terrain + hero places + actual crisis + minimal controller hint;
- REGION SELECTED: selected region/controller stronger, unrelated detail dimmer;
- CRISIS: front/rebellion stronger, non-crisis secondary overlays dimmer;
- POLITICAL/NEAR: political detail may increase intentionally.

The map must not become a multi-alpha overlay pile.

## 4. Label contract

Labels are screen-space UI, not world-scale decoration.

Required:

- priority ordering;
- collision checking;
- alternate anchors where practical;
- hide lower-priority labels instead of allowing collisions;
- consistent screen-pixel typography regardless of zoom.

Suggested priority:

100 capital / active crisis
90 selected region
80 major hero place
60 current agenda location
30 secondary region

Default desktop <= 5 labels. Default mobile <= 3 labels.

## 5. Desktop GUI contract

Persistent structure should be close to:

- one compact top identity/status strip;
- world map dominating the viewport;
- one compact bottom interaction/playback/navigation layer.

Camera controls must be visually quiet and must not use an unrelated bright beige panel.

### Decisions

Desktop Decisions may use a right-side contextual sheet while preserving map context.

- render contextual mixed shortlist order exactly;
- 2–5 primary choices;
- flat/list hierarchy preferred over a stack of generic rounded cards;
- qualitative effect first;
- exact evidence/details secondary;
- Korean body copy comfortably readable;
- one obvious primary CTA per decision;
- no duplicated `지금 결정할 일` hierarchy.

### Events

- small event: quiet toast;
- major factual event: one strong nonblocking news treatment;
- actual open PoliticalProposal only: response prompt;
- deduplicate/limit simultaneous notices;
- event presentation must not cover the primary map focal point or core controls.

## 6. Mobile GUI contract — separate composition, same state

Do not treat mobile as desktop CSS squeezed to 390px.

Default 390x844:

- world should occupy at least about half the visible screen before scrolling;
- at most 2 persistent HUD bands;
- no horizontal overflow;
- essential body copy >= 14px;
- tap targets >= 44px;
- map controls, current pressure, nav, metrics, and playback must not form 4–5 stacked bands.

When Decisions opens:

- bottom sheet replaces conflicting bottom HUD content instead of stacking over it;
- playback controls must never overlap the primary decision CTA;
- no nested scroll trap where both the page and sheet fight for scrolling;
- close/back control remains reachable.

## 7. Institutions contract

Dedicated surface is allowed and preferred.

The visual should read as an institution/progression web, not a developer dependency inspector.

- vertical axis = domain lane;
- horizontal axis = prerequisite progression;
- nodes show title + short status only by default;
- long descriptions/costs/reasons belong in a selected-node inspector;
- no developer-facing words like `depth`, `simulation catalog`, or fixture terminology;
- meaningful first viewport; do not compress all nodes to upper-left with huge dead space;
- readable Korean typography at screenshot scale;
- edges visible but secondary to nodes;
- node/edge/text collisions = 0 visually, not only DOM rectangle overlap.

## 8. Chronicle contract

Chronicle is history, not an admin log.

Use an editorial timeline hierarchy:

- major events: headline treatment;
- minor events: compact timeline row;
- crisis/government transition/institution change visually distinguishable;
- EventStore remains the source of truth;
- no invented narrative facts;
- do not wrap every event in the same generic rounded card.

## 9. Typography and shape language

- Korean body: 13–16px desktop, 14–16px mobile;
- major headings may use serif; body should remain highly readable;
- eyebrow labels are rare accents, not attached to every component;
- use no more than two meaningful corner-radius families;
- borders are structural separators, not a border around every element;
- gold is an accent for selection/authority, not the default outline color for every surface;
- crisis red reserved for factual crisis/negative state.

## 10. Evidence protocol

Every phase must create and OPEN its screenshot evidence before proceeding.

Required final deterministic screenshots:

1. `visual-v2-desktop-day0.png` — 1440x900
2. `visual-v2-desktop-rebellion.png` — 1440x900 factual rebellion/front
3. `visual-v2-desktop-decisions.png` — 1440x900 mixed contextual decisions
4. `visual-v2-desktop-institutions.png` — 1440x900
5. `visual-v2-desktop-chronicle.png` — 1440x900 after meaningful history exists
6. `visual-v2-mobile-map.png` — 390x844
7. `visual-v2-mobile-decisions.png` — 390x844
8. `visual-v2-mobile-rebellion.png` — 390x844 if practical

For each screenshot, record a short visual critique in RESULT:

- strongest focal point;
- any text issue;
- any overlap issue;
- any asset grounding issue;
- any generic-web/AI-slop pattern;
- PASS/FAIL against each hard rule.

The implementation agent is authorized to iterate inside the active V2 task, but it must not claim project-wide Gate PASS or submission-ready status.

## 11. Reference implementation principles

Research references, not code-copy authority:

- `gunyakov/three-hex-map`: neighbour-aware terrain blending, shared mountain ridges, world-space terrain treatment;
- Freeciv-web WebGL map: shared landscape mesh + heightmap/shader + separate roads/borders/water;
- OpenRA: terrain / world renderables / overlays / annotations as separate rendering responsibilities;
- Unciv: mode-dependent overlay visibility and dimming of irrelevant information;
- MapLibre/deck.gl label collision principles;
- Victoria 3 visual/UX dev diaries for map-first information hierarchy;
- Plague Inc GDC material for platform-specific GUI composition.

Do not copy GPL/AGPL/copyleft source into this project. Reimplement ideas independently unless license compatibility has been explicitly verified.

## 12. Final release bar

Deployment is allowed only if:

- all eight required/available screenshots have been opened and reviewed;
- HARD FAIL count = 0;
- typecheck/lint/format/build/diff checks pass;
- focused visual/UI tests pass;
- core gameplay smoke still demonstrates 3x -> factual rebellion -> 1x while playing;
- contextual mixed shortlist still comes from production selector;
- Event Presentation still uses actual EventStore/PoliticalProposal authority;
- no new fake state facts were introduced for visual effect.

Final human visual approval may still happen later, but this bar is the minimum autonomous overnight release bar.