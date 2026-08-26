# P0 Demo Map Simplify V1 Result

## Scope

- Branch: `parallel-p0-demo-map-simplify-v1`
- Authority: `docs/parallel/tasks/P0_DEMO_MAP_SIMPLIFY_V1.md`
- Base SHA: `e521961e25e4b20c70245137216c80a103120420`
- Authorized task HEAD: `77bd6f8681b7ad1d3227fba51ab108f6ae1e4375`
- HEAD SHA: `27794f093d3c1989548197091f0d6be867715b12` (`parallel: simplify demo map default read`)

## CHANGED_FILES

- `src/app/PoliticalWorldStage.tsx`
- `src/presentation/mapVisualSystem.ts`
- `src/presentation/mapVisualSystem.test.ts`
- `docs/parallel/evidence/p0-demo-map-simplify-v1-desktop-day0-labels-on.png`
- `docs/parallel/evidence/p0-demo-map-simplify-v1-desktop-day0-labels-off.png`
- `docs/parallel/evidence/p0-demo-map-simplify-v1-desktop-day90-rebellion.png`

## Implemented

- Existing `IntegratedRegionArtPlan` and `ProceduralWorldArtKitRenderer` remain in use. The default medium tier now renders only dominant authored silhouettes from the existing placement metadata; the full plan remains available at near LOD.
- Default integrated landmark count is 6 while the authored plan remains 21 placements. Decorative town, minor settlement, mountain/forest, field, route-corridor, distribution, and repeated banner placements are hidden outside the near/focus read.
- Default labels are limited to country, capital, and factual crisis. Region, project, and POI labels remain available at micro/near detail. Day0 medium rendered 6 labels; Day90 medium rendered 7 labels.
- Medium route rendering keeps factual route lines but hides animated route glyphs and pulses until near LOD.
- Ideology surface opacity and faction surface intensity were reduced; directional ideology treatment is hidden outside near LOD.
- Legal owner boundaries remain rendered with a subdued opacity, controller boundaries remain stronger, and real front segments retain the strongest treatment. No political data was synthesized.
- Legacy and inline art functions in `PoliticalWorldStage.tsx` were removed after call-site verification. The active factual crisis beacon and procedural fallback consumers remain.
- Faction banners use the existing connected-cluster anchor path, capped by `deriveFactionPresenceAnchors`; composition-level per-region faction banners are not rendered.

## TEST_RESULTS

- Focused Vitest: 10 files / 40 tests passed, including `mapFirstComposition`, `mapArchitecture`, `worldSceneModel`, `mapVisualSystem`, map content integration/adapter, map runtime geometry, world art, renderer, and gallery tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run format`: passed.
- `npm run build`: passed. Vite emitted the existing large-chunk advisory (>500 kB); build completed successfully.
- `git diff --check`: passed.

## Visual evidence

Viewport: desktop `1440x900`.

- Day0 labels on: `data-map-lod=medium`, `data-map-integrated-visible-landmark-count=6`, `data-map-label-count=6`, `data-map-default-terrain-detail=hidden`, `data-map-directional-treatment=hidden`, projected world occupancy `0.934 x 0.620`, stage occupancy `0.950 x 0.878`.
- Day0 labels off: same map state with `data-map-label-count=0`.
- Day90 rebellion: `data-world-scene-tick=90`, `data-map-lod=medium`, visible landmarks `6`, labels `7`, faction surfaces `6`, real fronts `2`, banner anchors `1`, projected world occupancy `0.934 x 0.787`, terrain detail/directional treatment hidden.

## SCREENSHOT_PATHS

- `docs/parallel/evidence/p0-demo-map-simplify-v1-desktop-day0-labels-on.png`
- `docs/parallel/evidence/p0-demo-map-simplify-v1-desktop-day0-labels-off.png`
- `docs/parallel/evidence/p0-demo-map-simplify-v1-desktop-day90-rebellion.png`

## INTEGRATION_API

- `selectIntegratedLandmarksForLod(placements, lodTier)` in `src/presentation/mapVisualSystem.ts` is the existing-plan selection seam used directly by `IntegratedRegionArtLayer` and the DOM evidence count.
- `deriveIntegratedRegionArtPlan` remains the resolver-neutral evidence plan source.
- `ProceduralWorldArtKitRenderer` remains the only integrated world-art renderer call-site; no renderer v2, compatibility layer, or visual manager was added.
- `deriveFactionPresenceAnchors` remains the near-LOD faction banner anchor source.

## KNOWN_LIMITATIONS

- The full repository Vitest command was not included in this focused pass because the task authority excludes the known long-running worker path.
- This pass provides the requested desktop Day0, labels-off, and Day90 visual evidence. Mobile visual inspection is outside this task's verification list.
- No deployment, Gate declaration, simulation/contextual decision, audio, icon, or shared CSS change was made.

## FILES_OTHER_BRANCHES_MUST_NOT_OVERWRITE

- `src/app/PoliticalWorldStage.tsx`
- `src/presentation/mapVisualSystem.ts`
- `src/presentation/mapVisualSystem.test.ts`
- `docs/parallel/evidence/p0-demo-map-simplify-v1-desktop-day0-labels-on.png`
- `docs/parallel/evidence/p0-demo-map-simplify-v1-desktop-day0-labels-off.png`
- `docs/parallel/evidence/p0-demo-map-simplify-v1-desktop-day90-rebellion.png`

No P0 PASS or deployment declaration is made here. Integration remains the responsibility of the designated owner.
