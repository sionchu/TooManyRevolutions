# PRESENTATION VISUAL V2 — END-TO-END EXECUTION AUTHORITY

Status: AUTHORIZED

Branch: `presentation-visual-v2`

Branch ancestry at creation: `08ca87d7d8bacad9dfbc49885066a768a71f8f2d`

Functional lineage: `d613154bb663ef01c8378d59943e3055d045f50d`

World correctness input already present in branch: `08ca87d` / FIX1 connected-component correction.

Rejected UI reference only: `83603a2`. **Do not cherry-pick this commit wholesale.** It may be inspected for structural ideas only (dedicated Institutions/Chronicle surfaces and mixed decision ordering). Its visual/CSS language is rejected.

## Mandatory visual authorities

Read fully before editing:

1. `docs/bridge/tasks/PRESENTATION_VISUAL_V2_TARGET.md`
2. `docs/bridge/tasks/PRESENTATION_VISUAL_V2_VISUAL_BAR.md`
3. `docs/GDD.md`
4. `docs/ARCHITECTURE.md`
5. `docs/QA_PLAYTEST.md`
6. root `AGENTS.md`

This task is intentionally authorized as one sequential overnight execution. Do **not** wait for the user or ChatGPT between phases. Iterate inside each phase using actual browser screenshots and the hard visual bar.

The agent may proceed through phases autonomously, but must never claim project-wide Gate PASS, submission-ready, or that a human approved the art. The user explicitly authorizes deployment at the final phase **only if the autonomous hard release bar is clean**.

## Product intent

Rebuild presentation so the project reads as a living political strategy game rather than:

- a React dashboard;
- a GIS heatmap;
- an asset gallery;
- a stack of dark rounded AI/SaaS cards.

Keep simulation/state authority. Rebuild the visual composition around the map.

## Non-negotiable architecture

KEEP:

- simulation kernel;
- WorldState / EventStore authority;
- LandHex as gameplay territory authority;
- PresentationState -> WorldSceneModel direction;
- contextual production decision selector and mixed shortlist order;
- Auto-Slow behavior;
- Event Presentation read-model;
- actual PoliticalProposal action pipeline;
- R3F / Three.js renderer;
- connected-component correctness from World FIX1.

DO NOT:

- directly mutate WorldState from UI/renderer;
- invent routes, rivers, armies, projects, government choices, rebellion facts, or political proposals;
- add generic tech/reform mana;
- add a new global manager/store/event system;
- restore per-Hex tree/rock/mountain GLTF scatter;
- restore beige procedural hero landmarks;
- expose debug/fixture/internal IDs in player UI;
- copy GPL/AGPL/copyleft implementation code from research repositories;
- add MapLibre, deck.gl, ELK, or another heavy dependency merely because they were research references. Implement the small needed subset locally unless a dependency is clearly justified.

## Research references — concept only

Study principles as needed:

- `gunyakov/three-hex-map`: neighbour-aware terrain blend, world-space terrain treatment, shared mountain ridges;
- Freeciv-web WebGL map: shared terrain geometry + heightmap/shader + separate water/roads/borders;
- OpenRA `WorldRenderer`: terrain / world / overlays / annotations as separate rendering responsibilities;
- Unciv world map updater: selection/mode causes relevant overlays to strengthen and irrelevant elements to dim;
- MapLibre/deck.gl: screen-space label priority/collision concepts;
- Victoria 3 graphics/UX dev diaries: map-first hierarchy and notification reduction;
- Plague Inc GDC: mobile/desktop composition should be platform-specific.

Reimplement ideas. Do not paste source.

---

# Execution protocol for every phase

For EACH phase:

1. implement only that phase's visual responsibility;
2. run focused checks;
3. run the local app;
4. capture the required screenshot(s);
5. **open the screenshots and inspect them visually**;
6. write a short critique against `PRESENTATION_VISUAL_V2_VISUAL_BAR.md`;
7. if any HARD FAIL is visible, fix it before continuing;
8. prefer simplification/removal over adding more objects/panels;
9. commit and push the phase checkpoint;
10. proceed to the next phase without asking for permission.

If a phase still has a HARD FAIL after three design iterations, do not expand scope. Simplify the design until the hard fail is removed. If it cannot be removed safely without breaking game authority, STOP without deployment and document the blocker.

Tests/DOM metrics do not override a bad screenshot.

---

# PHASE 0 — baseline, cleanup plan, deterministic evidence states

Before product edits:

- verify branch is `presentation-visual-v2` and clean;
- verify ancestry includes `08ca87d`;
- capture current deterministic Day 0 desktop and mobile screenshots for before/after comparison;
- identify the exact deterministic sequence/state used for factual rebellion/front evidence;
- preserve existing selectors and test fixtures; do not fabricate a visual-only rebellion;
- create/update `docs/parallel/PRESENTATION_VISUAL_V2_RESULT.md` with a phase checklist and before screenshots.

No design PASS required here.

---

# PHASE 1 — continuous terrain renderer

This phase is the most important. Hide/minimize UI while visually judging terrain. The screenshot must look like a world before landmarks or GUI are allowed to rescue it.

## 1.1 Use the existing shared terrain mesh

`src/presentation/mapRuntime/geometry.ts` already creates `createContinuousTerrainMesh()` with shared corner vertices. Build on it rather than adding a second terrain engine.

Current connected polygons (`worldSurfaces`, `terrainSurfaces`) remain topology/mask data, not the primary visible flat art.

Required direction:

- render `runtimeGeometry.terrainMesh` as the primary land surface;
- use real normals/lighting (`meshStandardMaterial` or a small independently-written shader), not `meshBasicMaterial` flat translucent land;
- add presentation-only semantic elevation derived from terrain kind and existing hex height, blended at shared corners;
- terrain elevation must remain presentation-only and deterministic;
- use restrained world-space deterministic variation/noise so colour/height texture does not visibly restart per Hex;
- hills/mountains must read mainly through relief and slope;
- forest/wetland must read mainly through terrain colour/material mass at default/medium;
- no environment GLTF scatter;
- create a coherent water/background plane so disconnected land/coast has geographic context;
- derive any shoreline treatment from real world component boundaries/coast data; do not invent rivers.

Suggested semantic elevation is a visual tuning concept, not an exact required constant. Keep slopes stylized and readable, not exaggerated miniature mountains.

## 1.2 Rendering responsibility split

Refactor `PoliticalWorldStage.tsx` only as far as useful into clear render-pass components. Acceptable examples:

- `TerrainWorldLayer`
- `PoliticalOverlayLayer`
- `LandmarkLayer`
- `CrisisFrontLayer`
- `MapLabelLayer`

These are render components, not new managers or stores.

## 1.3 Remove superseded visible substrate

Once the terrain mesh is visually authoritative, remove/disable normal rendering of connected translucent world/terrain polygon fills that caused Venn/GIS blobs. Retain topology data for masks/boundaries.

## Evidence

Commit and open:

- `docs/parallel/evidence/visual-v2-phase1-terrain-desktop.png` 1440x900
- `docs/parallel/evidence/visual-v2-phase1-terrain-mobile.png` 390x844

HARD phase gate:

- no Venn-like translucent terrain blobs;
- no obvious default Hex board;
- relief/slope visible without props;
- water/coast/world silhouette readable;
- screenshot with labels mentally ignored still reads as a game map.

---

# PHASE 2 — landmark compositions and asset grounding

Keep exactly three primary evidence-backed hero roles unless actual state calls for fewer:

- capital;
- industrial;
- frontier.

Do not merely place one GLTF at an anchor.

## Capital

Create one bounded composition using the resolved capital hero plus at most a few decorative satellites already covered by asset provenance. Decorative houses/ground detail are allowed only as `DECORATIVE_SUBSTRATE`; they must not imply new mechanics or authoritative buildings.

Required:

- local ground footprint/colour treatment integrated with terrain;
- contact shadow/lighting;
- coherent scale;
- capital is strongest silhouette;
- no giant surrounding prop.

## Industrial

Use existing resolved industrial assets as one composition, not separate random tokens. Ground should subtly read as worked/industrial terrain. Do not invent a completed project or route.

## Frontier

Use the factual frontier anchor with a restrained composition. Do not invent a port, city, or fortification state beyond the selected presentation asset's decorative role.

## Palette integration

If KayKit saturation/value is visually disconnected from terrain, adapt cloned presentation materials in `WorldAssetModel` or a dedicated presentation material adapter. Do not mutate source asset files blindly and do not tint factual faction colours into something misleading.

## Evidence

- `visual-v2-phase2-landmarks-desktop.png`
- `visual-v2-phase2-landmarks-mobile.png`

HARD phase gate:

- zero floating/pasted-model impression;
- no asset gallery spacing;
- capital > industrial/frontier hierarchy;
- hero places visually belong to the same world palette.

---

# PHASE 3 — political projection, crisis, fronts, visibility budget

Reintroduce state overlays carefully.

Implement explicit presentation modes/budgets without a new store:

- DEFAULT;
- REGION_SELECTED;
- CRISIS;
- NEAR/POLITICAL detail.

Use current UI/camera/selection state to derive the mode.

DEFAULT should prioritize geography and hero places. Controller information should be subtle. CRISIS should strengthen only factual rebellion/front/controller change and slightly de-emphasize unrelated decoration.

Do not stack controller + ideology + faction + route + selection + labels all at equal prominence.

A factual rebellion must visibly alter the map near its actual state-derived location before the player reads the news card.

## Evidence

- `visual-v2-phase3-day0-desktop.png`
- `visual-v2-phase3-rebellion-desktop.png`

HARD phase gate:

- crisis is locatable on the map;
- crisis red is concentrated, not a generic UI theme;
- no multi-alpha overlay soup;
- default state stays quiet.

---

# PHASE 4 — screen-space label system

Replace the current "render everything and hope" label behavior with a small deterministic label resolver.

Do not add MapLibre/deck.gl.

Required derived input:

- text;
- world anchor;
- priority;
- approximate screen rectangle;
- preferred/alternate anchors;
- visible mode/LOD eligibility.

Resolve candidates in priority order, reject collisions, try alternate positions, hide lower-priority labels if necessary.

Typography must be effectively screen-sized rather than growing/shrinking as ordinary world objects.

Default desktop <= 5 labels; default mobile <= 3.

Recommended priority: active crisis/capital > selected region > hero place > current agenda location > secondary region.

## Evidence

- `visual-v2-phase4-labels-desktop.png`
- `visual-v2-phase4-labels-mobile.png`

HARD phase gate:

- zero visually colliding labels;
- zero essential clipping;
- no unreadable tiny pale labels over terrain;
- zoom/focus does not create absurd text scale.

---

# PHASE 5 — main HUD and Decisions

Do not import the rejected `83603a2` visual CSS. Structural ideas may be manually reimplemented.

## 5.1 Persistent desktop HUD

Target: one quiet top identity/status strip + one compact bottom interaction/playback/navigation layer.

Remove or demote:

- stacked metric boxes;
- permanent camera control panel;
- separate current-pressure bar if it creates another HUD band;
- permanently visible auto-slow checkbox;
- permanently visible +1/+7/+30 controls.

Camera options/settings may remain behind a compact secondary control.

State signals should be short qualitative text/icon signals, not bordered cards.

## 5.2 Navigation

Primary product navigation:

- 지도
- 결정
- 제도
- 연대기

Use restrained separators and active state. Do not put each tab in an inflated rounded card.

## 5.3 Decisions desktop

Preserve **exact `decisionSurface.primaryShortlist` mixed order**.

Show 2–5 contextual decisions as a typographic list/sheet, not generic card stack.

Each row:

- decision title;
- one `why now` line;
- 1–3 qualitative outcome/trade-off signals;
- CTA;
- exact evidence/details behind secondary disclosure.

No duplicated title hierarchy. No developer copy.

Map remains visible at roughly 65–72% width when Decisions is open on desktop.

## Evidence

- `visual-v2-phase5-map-desktop.png`
- `visual-v2-phase5-decisions-desktop.png`

HARD phase gate:

- map is the clear primary visual on default screen;
- no generic dark-card dashboard pattern;
- Korean decision text readable at screenshot size;
- no control overlaps.

---

# PHASE 6 — events, Institutions, Chronicle

## 6.1 Events

Keep existing `deriveEventPresentation()` authority.

- one major NEWS treatment max at a time;
- small factual events as quiet toasts;
- deduplicate/limit stack;
- actual matching open `PoliticalProposal` only for response CTA;
- no fake accept/reject for rebellion/coup/government transition;
- ORDER_CONSOLIDATED / STATE_DISSOLVED terminal consistency remains intact.

Major event treatment should feel like a strategy-game dispatch, not another generic card.

## 6.2 Institutions

Dedicated full-screen/deep surface.

You may inspect `83603a2`'s domain/depth layout algorithm but do not port its styling wholesale.

Required structure:

- domain lanes vertically;
- prerequisite progression horizontally;
- compact nodes with title + state only;
- selected-node inspector contains description, prerequisites, exact effect, enact action if legitimate;
- useful initial viewport;
- no huge unexplained dead space;
- no `INSTITUTIONAL WEB`, `simulation catalog`, `depth`, fixture/internal language in player copy.

If current deterministic layout needs a simple local routing/layout helper, implement it pure and deterministic. Do not add a graph framework for 24 nodes unless truly necessary.

## 6.3 Chronicle

Dedicated editorial timeline derived only from EventStore.

- major transition/crisis/institution events get headline treatment;
- minor events are compact rows;
- no equal generic card around every event;
- no invented prose fact.

## Evidence

- `visual-v2-phase6-rebellion-news-desktop.png`
- `visual-v2-phase6-institutions-desktop.png`
- `visual-v2-phase6-chronicle-desktop.png`

HARD phase gate:

- event does not obscure focal landmark/core controls;
- Institutions reads as progression structure in one glance;
- Chronicle reads as history, not logs/admin list;
- all essential Korean text wraps cleanly.

---

# PHASE 7 — mobile composition RE0

Treat 390x844 as a separate composition using the same game state, not compressed desktop.

Default:

- compact identity/date/play state;
- map at least about half viewport;
- at most two persistent HUD bands;
- navigation + playback integrated rather than stacked with metrics/camera/current-pressure bars;
- no horizontal overflow;
- no vertical letter stacking;
- body >= 14px.

Decisions open:

- bottom sheet replaces/hides conflicting lower HUD content;
- playback/navigation must not appear underneath CTA;
- no nested scroll trap;
- 44px controls;
- close control accessible;
- enough map context remains above the sheet to retain world context.

Institutions/Chronicle may be dedicated mobile full-screen surfaces with clear back control.

## Evidence

- `visual-v2-phase7-mobile-map.png`
- `visual-v2-phase7-mobile-decisions.png`
- `visual-v2-phase7-mobile-rebellion.png`
- `visual-v2-phase7-mobile-institutions.png` if practical.

HARD phase gate:

- zero CTA/playback overlap;
- <=2 persistent HUD bands on default map;
- no essential clipping/ellipsis;
- map remains a substantial visible surface.

---

# PHASE 8 — title/opening polish and CSS/code cleanup

Only after the in-game world is visually stable:

- align title/opening typography/palette with V2;
- keep branding and tagline clear;
- avoid introducing a new unrelated UI style;
- do not fabricate game imagery or state facts in the live map.

Clean superseded presentation code:

- remove old visible flat-component terrain styling replaced by TerrainWorldLayer;
- remove obsolete label path if replaced;
- remove superseded HUD/panel CSS rather than appending a giant override layer;
- do not leave duplicate old/new roadmap styling fighting through selector specificity;
- remove obvious one-line compatibility test shim if safe and covered elsewhere;
- no new Manager V2.

Run format/typecheck/lint/build/diff checks.

---

# PHASE 9 — final deterministic visual gate

Create the final evidence names required by the visual bar:

1. `docs/parallel/evidence/visual-v2-desktop-day0.png`
2. `docs/parallel/evidence/visual-v2-desktop-rebellion.png`
3. `docs/parallel/evidence/visual-v2-desktop-decisions.png`
4. `docs/parallel/evidence/visual-v2-desktop-institutions.png`
5. `docs/parallel/evidence/visual-v2-desktop-chronicle.png`
6. `docs/parallel/evidence/visual-v2-mobile-map.png`
7. `docs/parallel/evidence/visual-v2-mobile-decisions.png`
8. `docs/parallel/evidence/visual-v2-mobile-rebellion.png` if state reproduction is practical.

OPEN every final image.

In `docs/parallel/PRESENTATION_VISUAL_V2_RESULT.md`, make a screenshot-by-screenshot table with:

- focal point;
- text/wrap status;
- overlap status;
- asset grounding status;
- map/world status;
- generic-web/AI-slop check;
- hard-fail count.

The visual gate is not satisfied by DOM rectangle counts alone.

## Automated final verification

At minimum:

- focused map/world tests;
- focused UI/decision/event tests;
- contextual selector tests;
- auto-slow tests;
- typecheck;
- lint;
- format/prettier check;
- production build including Sites worker;
- `git diff --check`.

Run full suite once if practical. If the known Vitest `onTaskUpdate` timeout recurs after assertions pass, record assertion result and runner exit separately; do not loop full suite repeatedly.

## Gameplay/browser smoke

Desktop actual run:

- title -> new game/opening -> map;
- select 3x;
- reproduce actual rebellion from deterministic runtime;
- verify 3x -> 1x and still playing;
- verify map crisis/front treatment;
- verify NEWS presentation;
- open Decisions and confirm mixed shortlist order;
- open Institutions;
- open Chronicle after history exists.

Mobile actual run at 390x844:

- default map;
- decisions;
- crisis if practical;
- no overlap/overflow hard fail.

---

# PHASE 10 — commit, push, deploy to EXISTING ChatGPT Site

The user explicitly authorizes final deployment in this task if and only if final HARD FAIL count is 0 and build/smoke gates above are satisfied.

## Source commit

- ensure worktree clean except intended V2 files/evidence/result;
- final implementation commit message: `feat: rebuild product presentation visual v2` (or equivalent);
- push `presentation-visual-v2`;
- record exact final source SHA in RESULT.

## ChatGPT Sites deployment

Update the **existing Site**. Do not create a new Site or new public URL.

Existing canonical public URL:

`https://too-many-revolutions.leeje92.chatgpt.site`

Use the repository's existing ChatGPT Sites workflow/plugin. Select/update the existing `too-many-revolutions` Site.

Required:

- deploy exact final source SHA;
- retain public sharing (`Anyone on the internet`) and Publish state;
- verify anonymous/public index returns HTTP 200;
- if an in-app/Chrome browser is available, directly open the public URL and smoke the production deployment;
- if browser extension is unavailable, record that limitation but still verify public HTTP access and deployment output;
- do not silently create a replacement URL on failure.

Production smoke should confirm at least:

- title/start loads;
- map renders V2 terrain and grounded hero compositions;
- Decisions opens;
- no obvious initial text/overlap hard fail;
- public URL remains the same.

If production differs materially from local screenshot evidence, fix/rebuild/redeploy the same Site before finishing.

## Final RESULT

Update `docs/parallel/PRESENTATION_VISUAL_V2_RESULT.md` with:

- final source SHA;
- all verification results;
- known nonblocking warnings;
- screenshot evidence table;
- deployment timestamp/status;
- canonical public URL;
- anonymous HTTP result;
- production smoke notes;
- any remaining visual weakness that is not a HARD FAIL.

Commit/push final RESULT if deployment metadata changes after the implementation commit.

STOP.

Do not begin Gate1F R2, persistence, history mechanics, difficulty, new content systems, or unrelated features.