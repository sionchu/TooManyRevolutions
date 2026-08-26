# Decision Record — P0 Game Loop, Renderer Boundary, Progression Presentation, Content Studio

Date: 2026-08-26
Status: ACCEPTED PRODUCT/ARCHITECTURE DIRECTION FOR CURRENT P0
Related task: `GAMEBUILDERS_PRODUCT_SURFACE_P0`

## Context

Hands-on mobile play of the deployed build showed that factual simulation changes are now present, but the persistent experience still feels like a responsive management/dashboard page:

```text
time
-> crisis
-> pause
-> text decision
-> time
```

The map is too visually narrow and difficult to read as an evolving game board; Chronicle rows expose too much low-level mutation; policies do not yet create enough visible accumulated state-building history.

## Decision 1 — Product loop

The default experience becomes observation + medium-term planning + selective intervention.

Routine state changes should be visible without repeatedly forcing modal interruption. Auto-pause is reserved for consequential decisions/transitions where timely player input matters.

## Decision 2 — Institutional progression presentation

Use an `Institutional Roadmap` to visualize real `PolicyDefinition` prerequisites/incompatibilities/current institutional state.

This is explicitly **tech-tree UX without tech-tree authority**.

No research/reform/political mana, hidden unlock timers, or scripted focus progression.

## Decision 3 — State Projects

Use 2–4 mechanically defensible existing Policy/Intervention lifecycles as visible map-linked State Projects/landmarks.

Progress comes from existing authoritative commitment/duration state. Completion must be real. Persistent visual traces are presentation, not new simulation authority.

## Decision 4 — ChronicleDigest

Keep EventStore append-only. Build a presentation-only digest that groups low-level factual changes and prioritizes major territorial, political, institutional, conflict and project history while retaining source EventId drill-down.

## Decision 5 — Renderer boundary

Run a bounded PixiJS v8 + React spike.

Target split if accepted:

```text
Simulation/actions/time: existing TMR TypeScript core
App/menu/drawers/Roadmap/Chronicle/Content Studio: React DOM
Persistent map/world rendering: PixiJS
```

PixiJS must not own an authoritative game clock or mutate WorldState.

Fallback: retain one SVG production renderer and apply the same map-first/camera/WorldVisualDelta requirements if Pixi adoption is not deadline-safe.

Whole-engine migration is rejected for P0.

## Decision 6 — Game-native visual grammar

Persistent gameplay must not be dominated by bordered rectangular containers. Map/world occupies the primary viewport; HUD is compact; details live in contextual drawers/sheets.

Mobile is not a stacked desktop card page.

## Decision 7 — Content Studio

Add a development-only Content Studio using stable content IDs with search/filter/edit/diff/validation/local draft/JSON patch import-export. It must include branch/variant text discovery and editing.

Static Sites do not directly commit to GitHub. Exported patches are applied through normal ChatGPT/Codex/tooling + Git diff review.

## Reference decisions

Reference roles are separated:

- Plague Inc./Rebel Inc.: living-map/time-flow/spatial feedback;
- Civilization: tree readability only;
- Against the Storm: world-visible upgrade/project accumulation;
- Frostpunk: law/state-building visual consequence;
- Victoria/Paradox: institutional/faction trade-offs;
- CK: political geography/readability;
- Suzerain/Papers Please: decision/briefing tone.

No copied commercial assets/UI/code/copy.

## Rejected alternatives

- redesigning TMR as a modal event-card game;
- adding a generic political/research progression currency;
- using Phaser/another game engine to own a second simulation loop during P0;
- faking project/landmark completion for visual satisfaction;
- solving visual weakness with static decorative art while map/world causality remains unreadable;
- exposing raw EventStore churn as the primary historical experience.

## Consequences

P0 acceptance now requires hands-on player-observable evidence in addition to tests/builds. The implementation branch must update the main GDD/QA/Backlog/decision ledger where appropriate and provide screenshots/behavioral evidence for Day 0/intermediate/late play, mobile map-first composition, ChronicleDigest, Roadmap, projects, renderer decision, and Content Studio.
