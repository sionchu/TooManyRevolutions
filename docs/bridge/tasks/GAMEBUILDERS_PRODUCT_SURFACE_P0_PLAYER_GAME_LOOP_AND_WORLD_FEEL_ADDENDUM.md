# GAMEBUILDERS_PRODUCT_SURFACE_P0 — Player Game Loop and World Feel Addendum

Date: 2026-08-26
Task: `GAMEBUILDERS_PRODUCT_SURFACE_P0`
Status: AUTHORIZED ADDENDUM

## 0. Why this addendum exists

Hands-on mobile play of the deployed P0 build demonstrated that the simulation now changes, but the player-facing loop is still too close to:

```text
time passes
-> rebellion/crisis banner
-> time stops
-> choose policy/intervention from text-heavy UI
-> resume time
-> repeat
```

This feels slow, reactive, and report-like rather than like a living strategy game. The map is visually narrow, many important changes are difficult to parse spatially, and the persistent screen still uses box/card/dashboard grammar. The Chronicle can also expose low-level ideology/faction churn as repeated rows instead of memorable political history.

This is a product/game-loop blocker, not merely a cosmetic polish request.

## 1. Target player loop

P0 should move toward this loop:

```text
choose a medium-term institutional / state-building direction
-> let time flow while the world remains readable
-> watch ideology, factions, territory, conflicts, routes, and projects change on the map
-> intervene when a consequential opportunity/threat appears
-> policy/project choices alter future availability and world state
-> completed choices leave persistent visible history
-> next decisions emerge from that changed world
```

The player should not need a modal stop for every meaningful change. Auto-pause remains appropriate for genuinely high-impact decisions, but the default experience must be observation + planning + selective intervention rather than stop/start paperwork.

## 2. Institutional Roadmap — “tech-tree taste” without tech-tree authority

Expose the existing `PolicyDefinition` graph as an `Institutional Roadmap`.

Required semantics:

```text
AVAILABLE
ENACTED / CURRENT
BLOCKED_BY_PREREQUISITE
BLOCKED_BY_INCOMPATIBILITY
BLOCKED_BY_CURRENT_RESOURCES_OR_CAPACITY (only where current authoritative feasibility supports it)
```

Roadmap edges come only from real policy prerequisites/incompatibilities and institutional state.

Do not add:

```text
research points
reform points
political mana
focus-tree chapters
scripted historical route
hidden unlock timer
```

The UX may borrow the clarity/satisfaction of a Civilization-style tree, but the authority remains TMR policy/institution state.

## 3. State Projects / wonder-like world feedback

The player needs visible medium-term construction/state-building outcomes. Use 2–4 existing authoritative Policy/Intervention lifecycles that can honestly support map-linked presentation.

Candidate presentation archetypes only where current mechanics justify them:

- food relief / granary or distribution network
- public works / industrial project
- constitutional/parliamentary landmark
- administrative/communications project

Required lifecycle:

```text
real action accepted
-> existing implementation duration / commitment state
-> real completion
-> persistent map-visible trace / landmark
```

Project progress is projection of existing authoritative duration/commitment state. Do not create a second construction clock, fake project completion event, or generic construction currency.

The key acceptance question is:

> After several years of different policy/project choices, can the player visually tell that they built a different state?

## 4. World-first map and visual grammar

The persistent gameplay screen must stop reading as:

```text
metrics box
-> time-control box
-> crisis box
-> map card
-> more text boxes
```

Target:

```text
compact HUD over/around the world
-> map fills the primary viewport
-> controller/ideology/conflict/project changes are spatial and legible
-> contextual drawers / bottom sheets only when requested
```

On mobile, the first gameplay viewport must be predominantly world/map. Long explanatory paragraphs, settings, debug/manual jump controls, and dense tables must not dominate the primary map surface.

## 5. What must become visually legible

Separate these concepts instead of collapsing them into one color or text label:

```text
legal owner
current physical LandHex controller
Region ideology/political influence
actual faction/organization presence
contact/trade/information routes
active conflict / derived fronts
state-project lifecycle and completed landmarks
current player focus / consequential alert
```

A rebellion that takes territory must visibly take territory. An ideology shift must be visible as a regional pattern/tint shift. A project completion must leave a persistent trace. A policy transition must remain visible in the Roadmap.

## 6. WorldVisualDelta

Create/complete a presentation-only factual feedback pipeline from authoritative state/event changes.

Examples:

```text
IDEOLOGY_SUPPORT_CHANGED
-> affected Region visual interpolation
-> factual route pulse where source/destination data exists

LAND_HEX_CONTROL_CHANGED
-> controller transition / border emphasis

BORDER_CLOSED / BORDER_REOPENED
-> route lock/fade/reopen feedback

REBELLION_STARTED / COUP_ATTEMPT_STARTED
-> factual affected-area focus + persistent active-conflict presentation

INSTITUTION_RULE_CHANGED
-> Roadmap node/edge transition

INTERVENTION_STARTED / COMPLETED
-> State Project progress / completion feedback when that intervention is a project-capable presentation
```

Presentation must never invent an event, army, crowd, front, project, or outcome absent from authoritative state.

## 7. ChronicleDigest — history, not raw log

The player-facing Chronicle should prioritize memorable history rather than repeat every low-level mutation.

Group/condense related factual events by date/window, place, actor, and mechanism when safe. Important digest categories include:

- territorial control shift
- capital loss/recovery
- rebellion/coup/major conflict start or resolution
- institution/policy change
- project start/completion
- meaningful ideology lead/change
- border/contact change
- government transition
- major consolidation blocker/eligibility transition

Each digest item must retain source EventId drill-down or equivalent provenance to the underlying append-only EventStore. EventStore itself remains unchanged.

Avoid rows such as six same-day ideology-support changes becoming six equally weighted “historic” entries when one grouped item communicates the actual political shift better.

## 8. Pause / time-flow behavior

Audit the current auto-pause policy.

Principle:

```text
high-consequence decision requiring timely player input -> may auto-pause
routine state change / ordinary faction action / ordinary ideology tick -> should remain observable without repeatedly interrupting flow
```

The goal is not to remove pause. The goal is to prevent the game from feeling like a sequence of modal reports.

Document the final auto-pause categories and why they require interruption.

## 9. Renderer / web-game engine decision

Run the already-authorized bounded PixiJS v8 + React spike.

Preferred responsibility split if it passes:

```text
TMR TypeScript simulation/action/time = authoritative
React DOM = menus, drawers, Roadmap, Chronicle, Content Studio
PixiJS = persistent world renderer and map feedback
```

PixiJS or any renderer must never own a second authoritative game clock or mutate WorldState directly.

If the spike is not deadline-safe, retain one SVG production renderer and implement the same camera, map-first composition, WorldVisualDelta and density requirements there. Record the decision and rollback rationale in `docs/DECISIONS.md`.

Do not perform a whole-engine migration in P0.

## 10. Content Studio / editable branching text

Create/complete a development-only Content Studio for player-facing text and branch/variant content.

Required capabilities:

```text
stable content ID
search
filter by screen/entity/event/policy/intervention/project/branch/variant
inline edit
preview where practical
baseline vs edited diff
placeholder/variable validation
Korean length warning
local draft persistence
single/all reset
JSON patch export/import
clipboard copy where useful
```

Branch/variant text must be discoverable without searching source code manually.

Static Sites must not pretend it can commit directly to GitHub.

Canonical edit path:

```text
Content Studio edit
-> JSON patch export
-> ChatGPT/Codex applies patch to repository
-> Git diff review
-> redeploy
```

## 11. Reference roles

Use references for interaction/design principles, not cloning.

- Plague Inc. / Rebel Inc.: persistent living world map, readable spatial feedback, time flow.
- Civilization: long-term tree readability and path satisfaction; do not copy research-point authority.
- Against the Storm: upgrades/projects visibly changing the world/settlement and strong game-native HUD hierarchy.
- Frostpunk: law/state-building choices producing visible world consequences; do not copy scripted scenario authority.
- Victoria / Paradox politics: laws and organized interests producing trade-offs; do not inherit dense dashboard UI as the persistent game surface.
- CK-style political geography: territorial identity and map readability.
- Suzerain / Papers Please: decision flavor and briefing only, not the persistent main-screen structure.

No commercial assets, screenshots, UI artwork, copy, or code may be imported.

## 12. Acceptance evidence

P0 cannot be accepted solely because tests pass or Day 1000 differs numerically.

Required hands-on evidence:

1. a player can run several hundred days without the experience degrading into repeated pause/text/pause;
2. the map itself communicates major world changes before opening the Chronicle;
3. Day 0 / intermediate / late screenshots visibly show different political worlds;
4. at least one real institutional path is visible in the Roadmap;
5. at least two real project-capable lifecycles show persistent map/world traces if defensible existing lifecycles exist; otherwise document the exact authoritative blocker rather than fake them;
6. ChronicleDigest communicates major history without ideology/faction row spam;
7. Content Studio can locate and modify branch/variant player-facing copy and export a patch;
8. mobile does not look like a vertically stacked admin page;
9. renderer decision is documented;
10. all visuals remain projections of authoritative state.

## 13. Hard boundaries

Preserve all existing P0/FIX23 boundaries, including:

- no new generic political/research currency;
- no focus-tree/story-node authority;
- no direct renderer/UI WorldState mutation;
- no fake/scheduled rebellion or coup;
- no fake project completion;
- no invented army/front/crowd;
- no persistence V9;
- no new F05 settlement/evidence runtime hidden in P0;
- Gate 1F remains NOT_READY;
- V02 remains NOT_STARTED;
- no successor-task self-authorization.
