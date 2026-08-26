# GameBuilders P0 Renderer Spike Decision

Date: 2026-08-26  
Scope: `GAMEBUILDERS_PRODUCT_SURFACE_P0_GAME_VISUAL_UX_RENDER_ADDENDUM`

## Decision

```text
PRODUCTION_RENDERER: SVG_FALLBACK
CANDIDATE: PIXI_V8_REACT
SPIKE_STATUS: DEFERRED_WITH_EXACT_BLOCKER
```

The P0 production map remains the existing React/SVG renderer. It consumes only
`PresentationState` plus transient `WorldVisualDelta` feedback. Camera focus and
zoom are local renderer state; they do not create a second clock or mutate the
simulation.

## Exact blocker

The current dependency graph has neither `pixi.js` nor `@pixi/react`. Adding a
second renderer at this checkpoint would require a real dependency/build/mobile
touch proof before it could replace the existing production surface. The
repository therefore keeps one renderer and records the bounded Pixi candidate
without claiming a Pixi implementation or deployment result.

## Verified boundary

- `src/sim/` does not import React or a renderer.
- `PoliticalAtlas` reads `PresentationState` and authored presentation data.
- controller, ideology, active Conflict, route and project marks originate in
  current WorldState/EventStore-derived projections.
- `WorldVisualDelta` is short-lived UI feedback and is not persisted.
- the authoritative calendar remains the existing simulation tick.
- save/load remains `SerializedSimulationSnapshotV8`.

## Re-entry criteria

A later renderer spike may be reopened only when the candidate dependency is
reviewed, the package builds in the Sites deployment path, pointer/touch camera
behavior is measured at desktop and mobile sizes, and the SVG fallback can be
removed without changing simulation authority. This P0 task does not open that
follow-up.
