# GameBuilders P0 Renderer Benchmark and Decision

Date: 2026-08-26  
Scope: `GAMEBUILDERS_PRODUCT_SURFACE_P0_WORLD_STAGE_ENGINE_REFERENCE_REWORK_ADDENDUM`

## Decision

```text
THREE_R3F_SPIKE: PASS
SECOND_RENDERER_SPIKE: PASS
WORLD_RENDERER_DECISION: THREE_R3F
```

R3F is the sole production world renderer. PixiJS v8 remains a comparison
spike only; it is not imported by `src/main.tsx` or the production app path.

## Controlled benchmark

Both candidates rendered the identical frozen Day 90
`WorldSceneModel` projection: 20 LandHexes, 3 capitals, 6 active contact
routes, 2 organization markers, 1 active Conflict, and 3 state-project
landmarks. The spike source contains no action, time, EventStore, persistence,
or WorldState writer.

| Candidate | Build | Raw JS/CSS output | Desktop browser | Mobile browser | Touch camera | Factual projection | DOM detail path |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| Three.js + React Three Fiber 9.7.0 / Three 0.185.1 | PASS | 1,312,394 bytes | 1280×729; 188 FPS average; p95 5.1 ms | 370×596; 193 FPS average; p95 5.1 ms | PASS | PASS | PASS |
| PixiJS 8.20.0 | PASS | 916,099 bytes across 12 chunks | 1280×729; 190 FPS average; p95 5.1 ms | 370×596; 192 FPS average; p95 5.1 ms | PASS | PASS | PASS |

The measurements are rough browser observations from the in-repository
benchmark pages, not a production performance guarantee. Both pages used the
same drag and wheel camera harness and the same `PresentationState` snapshot.

## Why R3F wins

- The product brief asks for a 30–45° orthographic or near-orthographic 2.5D
  miniature political world. R3F provides actual depth, lighting, raised
  terrain, settlement/project geometry, and a route pulse while staying inside
  the existing React 19 surface.
- The smaller Pixi bundle is useful evidence, but its candidate proof is an
  isometric 2D drawing surface rather than the selected product's depth model.
- DOM labels, legends, on-demand map facts, and contextual drawers preserve
  accessibility without treating the DOM as a second visual authority.
- Rollback is bounded: `PoliticalAtlas` remains a stable import name and
  delegates to `PoliticalWorldStage`; the renderer-neutral model is independent
  of both candidates.

## Commands and artifacts

```text
pnpm install
pnpm run benchmark:r3f
pnpm run benchmark:pixi
```

The benchmark entrypoints are:

- `benchmarks/r3f.html` → `src/benchmark/r3fMain.tsx`
- `benchmarks/pixi.html` → `src/benchmark/pixiMain.tsx`

The production flow is:

```text
WorldState + EventStore
  → PresentationState
  → WorldSceneModel
  → PoliticalWorldStage / R3F
```

`WorldSceneModel` labels every object as an authoritative projection, derived
presentation, or decorative substrate. Only the first two classes may be
driven by current TMR state; decorative geometry never supplies a fact.
