# MAP RUNTIME / GEOGRAPHY / CAMERA RESULT

## BASE_SHA

`16b3ad5b2b255e41a9b4adb73b184f8b15684939`

## START_HEAD

`16b3ad5b2b255e41a9b4adb73b184f8b15684939`

## FROZEN_PRODUCTION_CODE

`271eb18b9d713c3d639091b35aa65c2c0d780b69`

## HEAD_SHA

`7c6067eefb54aa2e2c5bb0d611cb417d9a32f313`

Implementation commit on `parallel-p0-map-runtime`. The result document and visual evidence are committed separately after this implementation checkpoint.

## CHANGED_FILES

- `src/app/PoliticalWorldStage.tsx`
- `src/presentation/worldSceneModel.ts`
- `src/presentation/mapArchitecture.ts`
- `src/presentation/mapVisualSystem.ts`
- `src/presentation/mapRuntime/geometry.ts`
- `src/presentation/mapRuntime/geometry.test.ts`
- `docs/parallel/01_MAP_RUNTIME_RESULT.md`
- `docs/parallel/evidence/p0-map-desktop-continuous-terrain.png`
- `docs/parallel/evidence/p0-map-desktop-labels-on.png`
- `docs/parallel/evidence/p0-map-desktop-labels-off.png`
- `docs/parallel/evidence/p0-map-selected-hex.png`
- `docs/parallel/evidence/p0-map-rebellion-territory-front.png`
- `docs/parallel/evidence/p0-map-ideology-surface.png`
- `docs/parallel/evidence/p0-map-mobile-default.png`

## TEST_RESULTS

- `npm run format` — PASS.
- `npm run typecheck` — PASS.
- `npm run lint` — PASS.
- `npm run build` — PASS. Vite completed with 144 modules; the existing large bundle warning remains.
- Focused Vitest — PASS: 5 files, 19 tests (`mapRuntime/geometry`, `worldSceneModel`, `mapArchitecture`, `mapVisualSystem`, `mapFirstComposition`).
- `npm run inspect:t018` — PASS.
- `npm run inspect:t021` — PASS.
- `npm run inspect:t024` — PASS; Gate 1V remains not started.
- `npm run inspect:v01` — PASS; V02 remains not started.
- `git diff --check` — PASS.
- Full `npm test` — runner FAIL (exit 1): 84 files and 612 assertions passed, with 4 unhandled Vitest worker `Timeout calling "onTaskUpdate"` errors. This is recorded as a runner-level limitation, not converted to PASS.

Browser inspection used the local dev server at 1440×900 and 390×844:

- Day 0 desktop labels on/off: `data-map-runtime-polygon-count=6`, `data-map-runtime-shared-vertices=34`, LandHex count 20, world occupancy `1.000 × 0.962`.
- Selected LandHex: `t021.industrial-extra-hex`; one full selected outline and region inspector opened.
- Day 90 rebellion: `data-map-faction-surface-count=6`, `data-map-front-count=2`; territory and front are derived from factual runtime state.
- Ideology surface: 10 merged Region surfaces and zero ideology ring markers.
- Mobile default: `mobile.player-theater`, `near` LOD, zoom 1.82, mobile occupancy `1.000 × 0.962`; the mobile stage occupies about 68% of the initial 390×844 viewport.
- Browser console had no application errors. The only repeated warning was the dependency-side `THREE.Clock` deprecation warning.

## SCREENSHOT_PATHS

- `docs/parallel/evidence/p0-map-desktop-labels-on.png`
- `docs/parallel/evidence/p0-map-desktop-labels-off.png`
- `docs/parallel/evidence/p0-map-selected-hex.png`
- `docs/parallel/evidence/p0-map-rebellion-territory-front.png`
- `docs/parallel/evidence/p0-map-ideology-surface.png`
- `docs/parallel/evidence/p0-map-mobile-default.png`
- `docs/parallel/evidence/p0-map-desktop-continuous-terrain.png`

## KNOWN_LIMITATIONS

- The full test command has the runner-level `onTaskUpdate` timeout described above; focused presentation and map-runtime tests pass.
- The production build retains the existing large JavaScript chunk warning.
- Visual evidence is from the local development server. No production Sites deployment was performed.
- Gate1F was not self-declared, V02 was not started, and persistence V9 was not started.
- Production asset-kit/Region-art composition, icon, audio, and simulation-balancing work remain with their parallel owners.

## INTEGRATION_API

- `deriveMapRuntimeGeometry(model)` in `src/presentation/mapRuntime/geometry.ts` is a pure, deterministic read-model-to-geometry adapter. It returns shared snap-keyed terrain topology, merged Region surfaces, merged faction surfaces, and render bounds without mutating `WorldState`.
- `deriveMapViewportBounds(model, preset)` in `src/presentation/mapArchitecture.ts` supplies desktop global and mobile player-theater/focus camera bounds from actual content, not a synthetic empty backdrop.
- `PoliticalWorldStage` consumes `WorldSceneModel` and the runtime geometry. The invisible `WorldTile` interaction substrate remains the LandHex hit-test surface; only the selected LandHex receives a full outline.
- Same-controller legal boundaries are filtered from the visible political boundary layer. Front lines are derived only from active `model.fronts`; quiet controller boundaries do not become fake fronts.
- Far/medium/near LOD controls semantic visibility for geography, country identity, capital/crisis, Region identity, major POI/routes/projects, controller/front, and selected/minor/local detail.
- `data-map-runtime-*`, occupancy, camera, LOD, surface, and front attributes expose deterministic inspection hooks for integration QA.

## FILES_OTHER_BRANCHES_MUST_NOT_OVERWRITE

- `src/app/PoliticalWorldStage.tsx`
- `src/presentation/worldSceneModel.ts`
- `src/presentation/mapArchitecture.ts`
- `src/presentation/mapVisualSystem.ts`
- `src/presentation/mapRuntime/**`
- `docs/parallel/01_MAP_RUNTIME_RESULT.md`
- `docs/parallel/evidence/p0-map-*.png`

All common bridge documents and the shared P0 result remain untouched by this branch.

## FIX1 — QC follow-up

### BASE_SHA

`16b3ad5b2b255e41a9b4adb73b184f8b15684939`

### HEAD_SHA

`7ae9381dc984f1c0526f212ab9fb8db7813bc15e`

Implementation commit for the FIX1 map-runtime follow-up on `parallel-p0-map-runtime`.

### CHANGED_FILES

- `src/app/PoliticalWorldStage.tsx`
- `src/app/MapStudio.tsx`
- `src/presentation/mapArchitecture.ts`
- `src/presentation/mapArchitecture.test.ts`
- `src/presentation/mapRuntime/geometry.ts`
- `src/presentation/mapRuntime/geometry.test.ts`
- `docs/parallel/01_MAP_RUNTIME_RESULT.md`
- `docs/parallel/evidence/p0-fix1-desktop-occupancy.png`
- `docs/parallel/evidence/p0-fix1-desktop-occupancy-final.png`
- `docs/parallel/evidence/p0-fix1-mobile-occupancy.png`
- `docs/parallel/evidence/p0-fix1-faction-anchors.png`

### TEST_RESULTS

- `npm run format` — PASS.
- `npm run typecheck` — PASS.
- `npm run lint` — PASS.
- `npm run build` — PASS. Vite completed with 144 modules; the existing large bundle warning remains.
- Focused Vitest — PASS: 5 files, 20 tests (`mapRuntime/geometry`, `worldSceneModel`, `mapArchitecture`, `mapVisualSystem`, `mapFirstComposition`).
- `npm run inspect:t018` — PASS.
- `npm run inspect:t021` — PASS.
- `npm run inspect:t024` — PASS; inspection output keeps Gate 1V not started.
- `npm run inspect:v01` — PASS; inspection output keeps V02 not started.
- `git diff --check` — PASS.
- `npm test` — not rerun for FIX1; the earlier baseline runner-level `onTaskUpdate` timeout remains recorded in the original section above.

### SCREENSPACE_EVIDENCE

The runtime now reports stage/container occupancy, projected meaningful-world occupancy, and first-mobile-viewport world share as separate metrics. The values below came from the local browser after the renderer projected the continuous terrain vertices; no synthetic world-unit ratio or 1.0 clamp was used.

- Desktop 1440×900, day 120: stage `0.950 × 0.701`; projected world `0.927 × 0.787`; first-mobile metric `NOT_MOBILE_VIEWPORT`.
- Mobile 390×844, `mobile.player-theater`, initial view: stage `0.981 × 0.680`; projected world `1.000 × 0.637`; first mobile viewport world share `0.344`.
- Day 120 mobile runtime: faction surfaces `6`, faction banner anchors `1`, front segments `0` in this snapshot. The anchor count is capped independently from the territory surface/front layers.

### KNOWN_LIMITATIONS

- The measured first mobile viewport world share is `0.344`, below the `0.60` product target; FIX1 exposes this actual gap and does not convert it into a PASS.
- The projected-world metric is measured against the actual canvas viewport; it is not a substitute for the stage/container metric.
- Browser evidence is from the local development server. No production Sites deployment was performed.
- Gate1F was not self-declared, V02 was not started, and persistence V9 was not started.
- Production asset-kit/Region-art composition, icon, audio, and simulation-balancing work remain with their parallel owners.

### INTEGRATION_API

- `deriveMapRuntimeGeometry(model)` now returns a continuous shared snap-keyed terrain mesh whose shared corners preserve interpolated terrain color and elevation attributes while retaining the authoritative `logicalLandHexCount`.
- `deriveMapArchitecture(model)` keeps legal-owner boundaries independent from physical-controller boundaries, and derives front segments only from actual `model.fronts` pairs that map to opposing-controller boundaries.
- `deriveFactionPresenceAnchors(model, maxAnchors = 2)` returns one strongest presence per connected faction cluster, capped at two anchors for near LOD. Territory surfaces and fronts remain primary.
- `inspectMapScreenSpaceOccupancy(input)` consumes browser-pixel stage, canvas, and projected-world rectangles and returns separate measured metrics without synthetic padding or clamping.
- `PoliticalWorldStage` exposes `data-map-stage-occupancy-*`, `data-map-projected-world-occupancy-*`, `data-first-mobile-viewport-world-share`, `data-map-faction-banner-anchor-count`, and `data-map-occupancy-source` for inspection. Desktop reports the mobile-only metric as `NOT_MOBILE_VIEWPORT`.
- `MapStudio` displays camera bounds in world units instead of presenting the removed synthetic occupancy estimate as evidence.

### FILES_OTHER_BRANCHES_MUST_NOT_OVERWRITE

- `src/app/PoliticalWorldStage.tsx`
- `src/app/MapStudio.tsx`
- `src/presentation/mapArchitecture.ts`
- `src/presentation/mapArchitecture.test.ts`
- `src/presentation/mapRuntime/**`
- `docs/parallel/01_MAP_RUNTIME_RESULT.md`
- `docs/parallel/evidence/p0-fix1-*.png`

FIX1 did not modify the common bridge documents, shared P0 result, or the `02_WORLD_ART`, `03_ICON`, and `04_AUDIO` owner areas.
