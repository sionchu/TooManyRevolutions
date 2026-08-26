# P0 Demo UI Polish V1 — Anti-Admin Surface

EXECUTION_AUTHORITY: THIS_FILE_ONLY

## Base

- branch: `parallel-p0-demo-ui-polish-v1`
- exact base: `e521961e25e4b20c70245137216c80a103120420`
- owns DOM presentation density and styling only.
- contextual decision identity/selection remains owned by `parallel-p0-contextual-decisions-v1`.
- do NOT touch `PoliticalWorldStage.tsx`, map geometry, simulation, audio system internals, model assets, Gate1F or deployment.

## Timebox

40 minutes implementation + browser evidence.

## Confirmed problem

The current map is more world-first than before, but open contextual panels still read as an administrative dashboard: tall cream cards, repeated bordered boxes, exact internal values competing with qualitative meaning, and side drawers occupying too much visual attention.

Do not redesign the entire UI. Reduce hierarchy noise using the existing components.

## Required outcome

The default player flow should read:

`world -> urgent context -> 1–3 primary actions -> optional details`

not

`world -> spreadsheet/card stack -> exact values`.

## Scope

Allowed primary files:
- `src/styles/global.css`
- `src/app/GameHeader.tsx`
- `src/app/ContextualDock.tsx`
- `src/app/CrisisBanner.tsx`
- `src/app/AgendaPanel.tsx`
- `src/app/DecisionPanel.tsx`
- `src/app/DecisionCard.tsx`
- `src/app/PolicyCard.tsx`
- related tests

Avoid `App.tsx` unless a tiny presentation-only prop is unavoidable. Do not modify how candidate IDs are selected.

## Changes

### Panel footprint

Desktop:
- contextual drawer should feel like an overlay inspector, not a second full application column
- target compact width around 320–380px where practical
- preserve visible map around the drawer

Mobile:
- use bottom-sheet behavior/height where existing structure supports it
- avoid full-screen takeover by default
- maintain >=44px touch targets

### Card hierarchy

Reduce borders/card-within-card repetition.

Each action card should visually prioritize:
1. name
2. qualitative availability/status
3. one meaningful effect/cost summary
4. primary CTA

Move exact numerical detail and long condition/provenance text into existing `<details>` / expandable sections where possible.

Do NOT delete factual data; demote L2 data.

### Agenda

Default agenda item should prioritize:
- pressure name
- qualitative severity/trend
- affected place
- one compact why/action affordance

Exact grievance/organization/material scalar values should not have the same visual weight as the headline.

### Crisis

Keep the crisis banner compact and map-supporting. It should not be wider/more visually dominant than the active territory/front itself.

### Header/HUD

Do not re-expand the header. Preserve integration world-first ordering. Remove redundant labels or borders only when clearly safe.

### Visual language

Use the existing TMR palette/icon system. Do not add a new design-system abstraction or theme framework.

No glossy gradients, neon, glassmorphism, dashboard charts, new progress meters or invented summary scores.

## Contextual-decisions compatibility

The future contextual selector will replace the current fixed/full candidate identity source. This branch must make no assumptions about exact candidate count or IDs.

Decision UI must work cleanly with 2–5 cards and not rely on the current repeated fixture list.

## Browser evidence

Capture 1440x900:
- map with no drawer
- agenda drawer
- decisions drawer
- active rebellion + decisions drawer

Capture 390x844:
- map default
- agenda/decision sheet open

Record drawer dimensions and whether the map remains visibly usable.

## Verification

Run targeted UI/icon tests plus:
- typecheck
- lint
- format
- build
- git diff --check

Do not run the long full suite during the timebox.

Write `docs/parallel/P0_DEMO_UI_POLISH_V1_RESULT.md`, commit/push, STOP. No P0 PASS or deploy.