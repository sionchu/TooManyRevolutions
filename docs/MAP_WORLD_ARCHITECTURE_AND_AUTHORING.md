# MAP_WORLD_ARCHITECTURE_AND_AUTHORING

Date: 2026-08-26
Scope: `GAMEBUILDERS_PRODUCT_SURFACE_P0` map architecture rework
Repository: nested `TooManyRevolutions`

## Decision

The accepted Three.js + React Three Fiber renderer, `WorldSceneModel`,
ContentRegistry/Content Studio, POI kernel, LandHex topology and existing
simulation authority remain in place. This pass adds a presentation and
authoring seam around those contracts; it does not create a second world
model, clock, persistence schema, or gameplay writer.

The map pipeline is:

```text
MapTopologyDefinition [existing ScenarioDefinition / authoritative]
  -> MapGeographyDefinition [authored presentation + truth-linked paths]
  -> MapSemanticContent [stable POI, institution, project and label anchors]
  -> MapPoliticalProjection [owner/controller/front/ideology projection]
  -> MapActivityProjection [routes/conflicts/projects/faction activity]
  -> MapViewPreset [desktop/mobile/focus camera]
  -> MapStyleDefinition [central visual grammar]
  -> R3F [renderer]
```

The implementation lives in `src/presentation/mapArchitecture.ts`. Every
record is classified as `AUTHORITATIVE_PROJECTION`, `DERIVED_PRESENTATION`,
or `DECORATIVE_SUBSTRATE`. Rendering reads `PresentationState` through the
renderer-neutral `WorldSceneModel`; it never writes `WorldState` or
`EventStore`.

## Terrain and geography

`createSharedTerrainMeshData()` snaps adjacent LandHex corner positions into
one shared vertex table and emits one indexed triangulated surface. Per-hex
transparent cylinders remain only as logical hit areas. Terrain height is
blended at shared corners, while terrain zones, coastline/ridge decoration,
and existing contact routes provide geography without adding LandHexes.

The authoritative topology count is asserted in the focused test and exposed
in Map Studio as read-only. The GameBuilders fixture remains at 20 LandHexes.

## Political projection

`deriveBoundarySegments()` builds an edge candidate map from adjacent hex
corners. It emits an owner boundary only when legal owners differ and a
controller boundary only when physical controllers differ. Same-controller
interior edges are not rendered. Connected segments are coalesced before
rendering.

Front segments are selected from the existing `WorldSceneModel.fronts` pair
and must match a physical controller boundary. A faction territory is
represented as one controller surface plus its outer boundary segment IDs;
the UI does not outline every occupied LandHex. A selected LandHex alone may
show its contextual hex outline.

Ideology is rendered as a low-opacity surface tint over authored Region/hex
anchors. The former persistent influence/pressure rings are removed from the
normal world view; rings remain available only to factual crisis/object
components where they are contextual.

## Camera and LOD

Stable presets are derived for:

```text
desktop.global
mobile.player-theater
region.focus.<regionId>
crisis.focus
project.focus
full-world
```

Desktop opens on the content-filled theater. Mobile opens around the player
country core and immediate border; `전체 보기` is explicit. `deriveMapLodTier`
selects `far`, `medium`, or `near`: country/major crisis at far, Regions/POI/
routes/projects at medium, and minor faction/activity detail at near. Labels
and objects are therefore not all present at every zoom.

The persistent mobile HUD keeps three qualitative country cues and the
playback controls. Exact values, secondary facts and map details remain in
drawers/details; the map stage is full-width and edge-to-edge.

## Map Studio foundation

`?mapStudio=1` is a development-only route. It uses the same presentation
snapshot and R3F world stage as the game and provides:

- read-only topology inspection;
- geography zone/path draft review;
- stable POI/institution anchor review;
- political boundary/front/ideology preview;
- camera preset and occupancy inspection;
- Day 0, rebellion candidate, project horizon and late-state snapshots;
- architecture validation;
- local MapPatch v1 JSON import/export/reset.

MapPatch v1 is deliberately local:

```json
{
  "version": 1,
  "scenarioId": "gamebuilders.demo",
  "geographyChanges": [],
  "poiChanges": [],
  "cameraPresetChanges": [],
  "styleChanges": []
}
```

The workflow is baseline records -> local draft -> MapPatch export -> human
or Codex review/application -> tests -> deployment. There is no direct
Map Studio-to-GitHub write path.

## Validation and QA contracts

Focused tests cover shared vertex generation, unchanged topology count,
owner/controller boundary semantics, front subset semantics, ideology
surface presence, camera presets, LOD, occupancy thresholds, MapPatch v1
parsing, and insertion-order determinism. The browser QA surface exposes
`data-land-hex-count`, camera preset, LOD tier and desktop/mobile occupancy
metrics for evidence capture.

The map pass intentionally does not change LandHex topology/count, runtime
conflict outcome writers, persistence, ContentRegistry authority, action/time
authority, Gate 1F, V02, or any successor task.
