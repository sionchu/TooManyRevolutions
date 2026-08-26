# Product Presentation RE0 — Visual Bar

STATUS: ACTIVE AUTHORITY

BASE_FUNCTIONAL_SHA: `d613154bb663ef01c8378d59943e3055d045f50d`

This document is the visual acceptance authority for the next presentation pass. Simulation correctness, WorldState/EventStore authority, contextual decisions, auto-slow, PoliticalProposal, and R3F/LandHex authority are already accepted functional foundations. The next work is judged primarily by product visual quality, not by test count or whether components merely fit inside the viewport.

## Product thesis

The first impression must be: **a living political strategy map whose events and decisions appear over the world**.

It must NOT read as:

- an admin dashboard,
- a React control panel,
- a 3D asset gallery,
- a board covered in toy tokens,
- a debug visualization with gameplay controls attached.

## Non-negotiable visual hierarchy

Within roughly two seconds the eye should read, in order:

1. the world / country geography,
2. the most important current crisis or change, if one exists,
3. the player’s immediate decision opportunity,
4. secondary state detail only on demand.

The map is the game board. Panels are temporary instruments, not the default composition.

## Shared visual gate — desktop 1440x900

A candidate fails visual QC if any of these are false:

- The playable world is the visually dominant surface and occupies at least ~78% of the usable first-viewport height when no secondary full-screen surface is open.
- Persistent top + bottom HUD together remain visually compact; they must not resemble stacked dashboard rows.
- No default body-scroll is required to understand the core game loop.
- No developer/debug chips, truth-class labels, raw IDs, evidence IDs, or verbose system copy appear in the default product surface.
- Default map labels are limited to the minimum useful hierarchy: country/capital plus factual active crisis/front context. Target <= 5 visible labels in the normal default camera.
- Default/medium world objects read as a small number of intentional landmarks, not scattered props. Target 3–5 dominant landmark groups.
- Crisis red is reserved for crisis/conflict emphasis. Focus gold is reserved for selection/important interaction. Terrain and ordinary institutions must not compete with those accents.
- The palette reads as one game, not a mixture of beige procedural art + bright KayKit + debug olive + unrelated UI colors.

## Shared visual gate — mobile 390x844

- The world remains visibly dominant by default; no drawer/sheet may replace the map as the default first screen.
- A bottom sheet may open for decisions/details, but the player must retain clear world context above it.
- All primary touch targets are >= 44x44 CSS px.
- No horizontal overflow.
- Full-screen secondary surfaces such as Institutional Web or Chronicle are explicit mode changes with a clear close/back action; they are not squeezed into a narrow sheet.

## World art rules

### Terrain is geography, not tokens

- Trees, rocks, and mountains must NOT be represented as repeated per-Hex toy objects in default or medium view.
- Logical LandHex remains authoritative underneath, but ordinary Hex borders should be visually absent or extremely subdued until hover/selection/controller/front context requires them.
- Forest, mountain, field, coast, and water should read as continuous geographic treatment across neighboring terrain, not as one model per cell.
- Same-controller adjacent cells must not create visible internal ownership seams.
- Real front segments remain the strongest territorial line treatment.

### Landmarks

Default/medium view may show only strategically meaningful hero landmarks, e.g.:

- capital,
- industrial center,
- frontier/fortress,
- port if truthful visual treatment exists,
- one factual crisis landmark/marker when needed.

Resolved hero GLTFs are allowed. Decorative asset scatter is not.

### Procedural fallback

- No beige procedural landmark may remain visible beside resolved KayKit hero art in the default/medium production view.
- Unresolved content must prefer omission, label/silhouette, or quiet semantic treatment over a visually incompatible fallback.
- Procedural primitives may remain dev/blockout-only, not the default player-facing composition.

### Camera / lighting / material

- Orthographic or near-orthographic miniature-strategy read.
- Landmarks must share a believable world scale.
- Lighting must create geographic depth and landmark hierarchy without glossy toy shading.
- Atmospheric depth/fog and restrained contact shadows are acceptable when they improve separation.
- Avoid saturated toy-green vegetation and pure-gray boulder clusters dominating the frame.

## Product UI rules

### HUD

The default game surface should converge toward:

- compact country/date identity at top,
- at most 3–4 qualitative state signals always visible,
- compact playback controls in a game HUD treatment,
- primary navigation: Map / Decisions / Institutions / Chronicle,
- no grid of metric cards,
- no always-visible auto-slow checkbox,
- no always-visible +1/+7/+30 developer-like jump controls unless clearly demoted to secondary controls.

### Decisions

- Immediate surface shows the existing mixed contextual shortlist in authoritative selector order.
- Normal target: 2–5 choices.
- Policy and intervention are not visually split back into two product lists.
- Card first read: action name, why now, broad trade-off/availability, CTA.
- Exact numeric evidence and raw prerequisite detail remain secondary.

### Events

- TOAST: small, transient/non-blocking.
- NEWS: visually stronger, still non-blocking for nonterminal events.
- DECISION_REQUIRED: focused response surface only when an actual open PoliticalProposal exists.
- Rebellion/coup/civil war continue gameplay through auto-slow rather than forced modal pause.

### Institutional Web

The current narrow-drawer graph is rejected.

- Institutional Web is a dedicated full-screen/large-mode surface.
- Layout uses institutional domain lanes vertically and prerequisite depth horizontally.
- 24-policy catalog must produce no node overlap.
- Node names must remain legible without 1–3 character wrapping.
- Prerequisite/incompatibility edges remain derived from the real catalog.
- No research currency, focus power, generic tech points, or fake timers.

### Chronicle

Chronicle becomes a dedicated state-history surface, not a cramped secondary card list.

- date/tick chronology is visually clear,
- major transitions stand out,
- government transition remains nonterminal history,
- state dissolution/order consolidation remain terminal outcomes.

## Keep / RE0 boundary

KEEP:

- deterministic simulation kernel,
- WorldState / EventStore,
- PresentationState / WorldSceneModel authority flow,
- contextual decision selector and production catalog,
- GameEvent presentation read-model,
- PoliticalProposal action pipeline,
- auto-slow time reaction,
- R3F renderer and LandHex authority,
- licensed asset manifest/provenance.

RE0 PRESENTATION:

- main map composition,
- terrain visual language,
- landmark scale/placement,
- persistent HUD and metric presentation,
- immediate decision composition,
- Institutional Web presentation,
- Chronicle presentation,
- title/opening visual composition where necessary.

## Validation evidence

Every implementation track must provide real browser screenshots, not only DOM measurements.

Required visual proof:

- desktop default 1440x900,
- desktop active rebellion/crisis,
- desktop relevant opened secondary surface,
- mobile default 390x844,
- mobile active decision surface.

Visual acceptance is external. A task must not self-declare the product visual bar passed solely because automated tests or size measurements pass.
