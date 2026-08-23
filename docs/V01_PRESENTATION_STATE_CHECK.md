# V01 Presentation State Check

**Status:** COMPLETE / PASS — 2026-08-22  
**Scope:** pure presentation read model only

## Contract

```text
ScenarioDefinition + WorldState
  → derivePresentationState()
  → read-only PresentationState
  → future React/R3F renderer
```

`PresentationState`는 simulation state가 아니며 `WorldState.presentationState`,
`WorldState.mapState`, snapshot field, reverse mutation path를 만들지 않는다.
`src/presentation/`은 simulation type/selector를 읽지만 React, R3F, Three.js,
CSS, renderer coordinates, assets, RNG, GameEvent, ActionProposal을 사용하지
않는다.

## Delivered semantic layers

- LandHex: static `q/r`/terrain/Region identity + runtime
  `WorldState.landHexStates[*].controller`
- Region: legal owner + T017B `RegionControlSummary` + unrest/scarcity
- Political influence: current Region ideology entries with positive support;
  radicalism/organization remain separate dimensions and are not copied to each
  LandHex
- Organization: stable faction/Region tokens only where a real Faction controls
  one or more LandHex cells; no token from support/currentStrategy alone
- ContactGraph: directed route ID, source/target, channel, effective strength,
  active/enabled state, and blocked metadata
- Front: T021 active rebellion/civilWar/war front edges from current opposing
  LandHex controllers; coup and peaceful borders produce no front
- Run: copied outcome/consolidation progress plus tick/date for presentation

No Army/Division/UnitStack, fake manpower/supply, ideology colors, material/asset
selection, camera, screen coordinates, hover/selection UI state, or regime-wide
reskin field is present.

## Determinism and authority evidence

- `src/presentation/presentationState.test.ts` — 9 tests PASS
- same WorldState produces deep-equal output
- input ScenarioDefinition/WorldState JSON remains unchanged
- LandHex/Region/Faction/Conflict record insertion order does not affect output
- T024 JSON serialize → deserialize → re-derive produces equal output without
  persisting PresentationState
- empty scenario, empty routes/tokens/fronts, partial Region control, directed
  route direction, active armed front, peaceful border, and coup/no-front are
  covered
- `pnpm run inspect:v01` reports authority, deterministic re-derivation, and
  renderer dependency boundaries

## Deliberate current-model limitation

The current Faction schema has national organization/influence but no separate
Region-level non-territorial organization identity. V01 therefore exposes a token
only for an actual faction LandHex controller presence. It does not infer a token
from ideology support, local ideology organization, grievance, or strategy. A later
authoritative organization-presence model may extend this projection explicitly.

## Scope exclusions

V02 Flat Hex Renderer, actual React/R3F map, semantic styling, visual tokens, asset
acquisition, screenshot baselines, and Gate 1V timelapse are not started. F01 measured
the O(ticks²) persistence-validation scaling and F01A resolved it for canonical
continuation; full serialize/deserialize validation remains mandatory.
