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
