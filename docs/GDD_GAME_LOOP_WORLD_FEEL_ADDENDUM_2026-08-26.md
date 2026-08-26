# TMR GDD Amendment — Game Loop, World Feel, Institutional Progression, and Content Authoring

Date: 2026-08-26
Status: ACTIVE GDD AMENDMENT
Parent: `docs/GDD.md`
Scope: GameBuilders P0 and future product direction

> This document amends `docs/GDD.md`. It does not replace the existing GDD. During the next authorized P0 implementation checkpoint, the durable principles below must also be folded into the relevant sections of `docs/GDD.md` without deleting existing architecture/product contracts.

## 1. Hands-on finding

The deployed playable build proves that simulation changes can occur, but the player experience is still too close to:

```text
time passes
-> rebellion / crisis
-> pause
-> choose policy/intervention in a text-heavy surface
-> resume
-> repeat
```

On mobile this reads as a responsive administration page rather than a strategy game. The map is too visually narrow, major world changes are difficult to parse, and low-level Chronicle rows can obscure memorable history.

This is a core game-loop and presentation problem, not merely an art-polish issue.

## 2. Revised core loop

The durable target loop is:

```text
choose a medium-term institutional / state-building direction
-> let time flow while the world remains legible
-> watch ideology, factions, territory, conflicts, routes, and projects change spatially
-> selectively intervene at consequential opportunities/threats
-> policies/projects alter future availability and authoritative state
-> completed choices leave visible accumulated history
-> next decisions emerge from the changed world
```

The player should feel that they are building and surviving a state through history, not repeatedly answering modal incident reports.

## 3. Time flow and interruption

Auto-pause is a scarce attention mechanism.

May auto-pause:
- a genuinely high-consequence decision requiring timely player input;
- major coup/rebellion/war/capital/state-continuity transitions where player input is materially relevant;
- victory/terminal-state transition.

Should normally remain observable without modal interruption:
- routine ideology diffusion;
- ordinary faction activity;
- normal economic/resource ticks;
- ordinary EventStore churn;
- non-decision state changes that are already legible on the map/HUD.

Success means the player experiences both periods of observation/acceleration and moments worth stopping for.

## 4. The map is the game board

Persistent gameplay must be world-first.

```text
compact HUD / time controls
-> persistent living political map
-> spatial factual feedback
-> contextual drawer / bottom sheet on demand
```

The following facts must remain visually distinct:

- legal/historical owner;
- current physical `LandHex.controller`;
- Region ideology/political influence;
- authoritative faction/organization presence;
- contact/trade/information routes;
- active conflict and derived fronts;
- State Project lifecycle/completed landmark traces;
- current focus/consequential alerts.

`Region.stateControl` remains administrative penetration, not physical territorial ownership.

## 5. Institutional Roadmap

TMR may use the **readability and satisfaction of a technology/civic tree UI**, but must not create tech-tree authority.

`Institutional Roadmap` is a visualization of actual `PolicyDefinition` and institutional feasibility.

Node states may include:

```text
CURRENT / ENACTED
AVAILABLE
BLOCKED_BY_PREREQUISITE
BLOCKED_BY_INCOMPATIBILITY
BLOCKED_BY_REAL_FEASIBILITY
```

Edges and unlocks come from real prerequisites/incompatibilities/current institutional rules.

Forbidden:

```text
research points
reform points
political mana
ideology XP
focus-tree chapters
scripted historical unlock sequence
hidden unlock timers
```

The player gets “tree progression taste” because their state’s legal possibilities change, not because a separate abstract progression currency advances.

## 6. State Projects / wonder-like visible accumulation

TMR needs a small number of memorable map-linked state-building outcomes.

Use only existing/approved authoritative Policy or Intervention lifecycles that honestly support the presentation.

Potential archetypes when mechanically defensible:
- food relief / distribution or granary network;
- public works / industrial development;
- constitutional/parliamentary landmark;
- administrative/communications project.

Required lifecycle:

```text
real action accepted
-> existing commitment / implementation duration
-> authoritative completion
-> persistent map-visible trace
```

Do not add a second construction clock, construction mana, fake progress, or fake completion event.

Design success question:

> After years of different choices, can the player visually recognize that this is a different state from another run?

## 7. WorldVisualDelta

Presentation should translate factual state/event changes into immediate world feedback.

Examples:

```text
IDEOLOGY_SUPPORT_CHANGED
-> affected Region pattern/tint interpolation
-> route pulse only when factual route/source/destination exists

LAND_HEX_CONTROL_CHANGED
-> visible controller/border transition

BORDER_CLOSED / REOPENED
-> route lock/fade/reopen feedback

REBELLION_STARTED / COUP_ATTEMPT_STARTED
-> factual spatial focus + persistent conflict state

INSTITUTION_RULE_CHANGED
-> Institutional Roadmap transition

INTERVENTION_STARTED / COMPLETED
-> project lifecycle feedback where that intervention has approved project presentation
```

Visual effects are projections. They never mutate authoritative state or invent facts.

## 8. ChronicleDigest — history instead of event spam

`EventStore` stays append-only and authoritative.

The player-facing Chronicle is a presentation/digest layer. It should group related low-level events when safe and prioritize meaningful history:

- territorial control changes;
- capital loss/recovery;
- rebellion/coup/major conflict start/resolution;
- Government transition;
- institutional/policy transition;
- State Project start/completion;
- meaningful ideology lead or regional political shift;
- border/contact change;
- major consolidation condition transition.

Each digest item must preserve source EventId/provenance drill-down.

Repeated same-day ideology support changes should not automatically appear as many equally important “historical events.”

## 9. Game-native visual grammar

A persistent gameplay surface dominated by rectangular bordered cards is a failure state.

Avoid:

```text
header
-> metric boxes
-> form-like time controls
-> crisis box
-> map inside another content card
-> explanatory boxes
```

Prefer:

```text
world stage fills the viewport
+ compact game HUD
+ map-linked alerts/motion/landmarks
+ drawers/sheets only when needed
```

Mobile must not be a vertical stack of desktop cards. The initial viewport should primarily communicate the world.

Art quality matters, but art cannot conceal a weak world loop. Simulation truth and spatial readability come first; coherent art/terrain/icon/landmark polish follows.

## 10. Renderer policy for P0

Run a bounded `PixiJS v8 + React` renderer spike.

Preferred responsibility split if accepted:

```text
TMR TypeScript simulation/action/time = authoritative
React DOM = menus, drawers, Roadmap, Chronicle, Content Studio
PixiJS = persistent 2D world renderer / camera / factual visual feedback
```

Do not migrate the simulation into Pixi/Phaser and do not create a second authoritative game clock.

If Pixi adoption threatens the P0 deadline or architecture, retain one SVG production renderer and apply the same map-first, camera, WorldVisualDelta, density and feedback principles. Record the renderer decision and rollback reason in the decision log.

## 11. Reference roles

Use references as design lenses, not templates/assets/code to copy.

- **Plague Inc. / Rebel Inc.** — persistent living map, readable time flow and spatial feedback.
- **Civilization** — long-term tree readability/path satisfaction; not research-point political authority.
- **Rebel Inc. Azure Dam** — visible medium-term map-linked development objective under instability/security pressure.
- **Against the Storm** — upgrades/projects visibly changing the settlement/world and strong game-native HUD hierarchy.
- **Frostpunk** — laws/state-building choices visibly altering the lived world; not scripted story authority.
- **Victoria / Paradox politics** — laws and organized interests producing trade-offs; do not inherit dashboard-heavy persistent UI.
- **CK-style political geography** — map identity, territory and heraldic readability.
- **Suzerain / Papers Please** — briefing/decision tone only, not persistent main-screen structure.

No commercial screenshots, assets, copy, or source code may be imported.

## 12. Content Studio

A development-only Content Studio is required so player-facing and branch/variant text can be changed without manually searching source code.

Required capabilities:

- stable content IDs;
- search;
- filter by screen/entity/event/policy/intervention/project/branch/variant;
- inline editing;
- preview where practical;
- baseline vs edit diff;
- placeholder/variable validation;
- Korean length warnings;
- local draft persistence;
- reset one/all;
- JSON patch import/export;
- clipboard copy where useful.

Canonical publishing flow:

```text
Content Studio edit
-> JSON patch export
-> ChatGPT/Codex/tooling applies patch to repository
-> Git diff review
-> deploy
```

Static Sites must not pretend to commit directly to GitHub.

## 13. Product acceptance

Tests and numeric state divergence are necessary but not sufficient.

A P0 product review must also answer YES to:

- Can the player understand major world change from the map before opening reports?
- Does several hundred days of play avoid degrading into pause/text/pause paperwork?
- Do Day 0/intermediate/late screenshots visibly look like different political worlds?
- Does the institutional path remain visible and understandable?
- Do completed approved State Projects leave world-visible traces?
- Does ChronicleDigest show history rather than low-level spam?
- Does Content Studio expose/edit branch/variant copy?
- Does mobile read as a game world rather than an admin page?
- Is renderer/game-engine responsibility explicit and simulation authority preserved?

## 14. Durable architecture boundaries

This amendment does not authorize:

- generic research/reform/political currency;
- focus-tree/story-node authority;
- direct renderer/UI mutation of `WorldState`;
- fake/scheduled rebellion/coup;
- fake project completion;
- invented armies/fronts/crowds;
- persistence V9;
- F05 settlement/evidence implementation hidden inside P0;
- Gate 1F PASS;
- V02;
- successor-task self-authorization.
