# Presentation RE0 — Product UI / Secondary Surfaces V1

EXECUTION_AUTHORITY: THIS_FILE_ONLY

BASE_FUNCTIONAL_SHA: `d613154bb663ef01c8378d59943e3055d045f50d`
VISUAL_BAR: `docs/bridge/tasks/PRODUCT_PRESENTATION_RE0_VISUAL_BAR.md`

## Goal

Rebuild the product-facing interface so the game reads as a strategy game over a living map, not an admin dashboard.

This track owns DOM composition, HUD, decision/event presentation, Institutional Web, Chronicle, title/opening presentation, and global styling. It must not change the internal R3F world renderer or simulation authority.

## Owned files / domains

Primary ownership:

- `src/app/App.tsx`
- `src/app/GameHeader.tsx`
- `src/app/MetricStrip.tsx`
- `src/app/TimeControls.tsx`
- `src/app/ContextualDock.tsx`
- `src/app/AgendaPanel.tsx`
- `src/app/DecisionPanel.tsx`
- `src/app/DecisionCard.tsx`
- `src/app/PolicyCard.tsx`
- `src/app/EventPresentationOverlay.tsx`
- `src/app/InstitutionalRoadmapPanel.tsx`
- `src/app/ChroniclePanel.tsx`
- `src/app/TitleScreen.tsx`
- `src/app/OpeningBriefing.tsx`
- related DOM/presentation tests
- `src/styles/global.css`

Do NOT modify:

- `src/app/PoliticalWorldStage.tsx`
- `src/app/mapVisual/**`
- `src/presentation/mapArchitecture.ts`
- `src/presentation/mapRuntime/**`
- `src/presentation/mapVisualSystem.ts`
- `src/presentation/mapContent/**`
- simulation behavior/balance,
- contextual decision selector/catalog,
- EventPresentation classification,
- PoliticalProposal lifecycle/action authority,
- audio engine internals.

## Required RE0 decisions

### 1. Remove dashboard structure from default game surface

The current always-visible metric strip/card grid is rejected.

Default HUD should converge toward:

- compact country/date identity,
- at most 3–4 qualitative state signals,
- compact playback controls,
- compact primary navigation.

Do not render separate boxed cards for treasury, legitimacy, state capacity, unrest, continuity, etc. on the default first viewport.

Exact numeric values may live in detail/secondary surfaces.

### 2. Playback controls become game HUD

Keep:

- play/pause,
- 1x / 2x / 3x,
- current auto-slow behavior.

Demote from always-visible default HUD:

- the auto-slow checkbox,
- +1 / +7 / +30 jump controls.

Those may live under a secondary/options control if retained.

The playback control should read as one compact strategy-game control cluster, not a form row.

### 3. Navigation

Default primary navigation should expose the conceptual product surfaces:

- Map,
- Decisions,
- Institutions,
- Chronicle.

Region detail may remain contextual from map interaction rather than a permanent top-level tab.

### 4. Decisions remain mixed and contextual

Preserve `decisionSurface.primaryShortlist` order exactly.

Do not split policy and intervention into separate product lists.

Normal visual target: 2–5 cards.

Each card first read:

- action name,
- why it matters now,
- broad consequence/trade-off,
- availability/CTA.

Move precise numeric evidence, low-level prerequisites, raw state values, IDs, and formulas behind details.

### 5. Event presentation hierarchy

Preserve factual read-model authority.

- TOAST: small non-blocking transient notification.
- NEWS: visually prominent headline card/band, but nonterminal events must not become blocking modals.
- DECISION_REQUIRED: focused response surface only for actual open PoliticalProposal.
- terminal outcome may use a stronger result surface.

Rebellion/coup/civil war continue via auto-slow.

### 6. Institutional Web leaves the drawer

The current `InstitutionalRoadmapPanel` inside `DecisionPanel` / narrow drawer is rejected.

Create a dedicated full-screen or large explicit mode for Institutions.

Layout rule:

- vertical lane = institutional domain,
- horizontal position = prerequisite depth.

Domains should be visibly grouped, e.g. authority/representation, labor, information/press, property/land, political competition as supported by actual policy definitions.

Hard acceptance:

- 24-policy catalog: zero node overlap,
- node names readable without single-character stacking,
- prerequisite edges legible,
- incompatibility visually distinct,
- pan/zoom allowed,
- no generic research currency/focus power/timer.

The old narrow graph implementation may be RE0 rather than patched.

### 7. Chronicle becomes a real state-history surface

Create a dedicated Chronicle mode with clear chronology.

Prioritize:

- government transitions,
- rebellion/coup/civil-war milestones,
- major policy/institution changes,
- territorial/controller changes where important,
- terminal outcomes.

Do not invent historical entries outside EventStore.

### 8. Default map remains unobstructed

When no secondary surface is open:

- no permanent right drawer,
- no large cream panel occupying world space,
- no verbose “map truth” chips,
- no developer-language status text.

A current urgent agenda/crisis may appear as one compact contextual prompt.

### 9. Title / opening visual coherence

Refresh only as necessary to align the same visual language:

- dark/warm political-fantasy tone,
- strong title hierarchy,
- clear tagline,
- minimal CTA,
- no admin UI aesthetic.

Do not rebuild content/state flow or add difficulty in this task.

## Visual acceptance measurements

Desktop 1440x900 default:

- world remains the dominant surface,
- no always-visible grid of metric cards,
- no always-visible auto-slow checkbox,
- no always-visible +1/+7/+30 buttons,
- persistent qualitative state signals <= 4,
- primary nav visible without dominating the map,
- default product surface requires no body scroll to understand current state + playback + navigation.

Decision mode:

- mixed shortlist order preserved,
- normal visible decision count 2–5,
- cards do not expose raw IDs or verbose system/evidence copy by default.

Institutions mode:

- no node overlap at 1440x900,
- node labels readable,
- dedicated large/full-screen surface.

Mobile 390x844:

- default map stays dominant,
- decision sheet may cover at most roughly half the screen and must leave meaningful map context,
- Institutions/Chronicle are explicit full-screen modes with >=44px close/back target,
- no horizontal overflow.

## Browser evidence

Capture and inspect:

1. desktop default 1440x900,
2. desktop Decisions,
3. desktop Institutions full-screen,
4. desktop Chronicle,
5. desktop active rebellion + NEWS,
6. mobile default 390x844,
7. mobile Decisions.

Screenshots must be opened and judged visually. DOM dimensions alone are insufficient.

## Verification

Run focused UI/presentation tests, typecheck, lint, format, build, `git diff --check`.

Do not modify simulation tests merely to satisfy presentation changes.

## Result

Write:

`docs/parallel/PRESENTATION_RE0_UI_V1_RESULT.md`

Record:

- removed dashboard structures,
- final persistent HUD inventory,
- Institutional Web layout proof,
- Chronicle proof,
- event/decision screenshots,
- mobile proof,
- remaining visual weaknesses.

Commit/push and STOP.

Do not deploy and do not self-declare the shared visual bar PASS.