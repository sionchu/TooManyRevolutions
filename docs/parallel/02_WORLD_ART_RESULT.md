# Parallel Task 02 — World Art Result

- TASK_ID: `PARALLEL_02_WORLD_ART`
- BRANCH: `parallel-p0-world-art-v2`
- BASE_BRANCH: `gamebuilders-product-surface-p0`
- BASE_SHA: `ffc876c8c532ae5f77282ba059ec565532a69eb7`
- TASK_BASELINE: `16b3ad5b2b255e41a9b4adb73b184f8b15684939`

## CHANGED_FILES

- `src/presentation/mapVisual/worldArt.ts`
- `src/presentation/mapVisual/index.ts`
- `src/presentation/mapVisual/worldArt.test.ts`
- `src/presentation/mapVisual/proceduralKitGeometry.ts`
- `src/presentation/mapVisual/proceduralKitGeometry.test.ts`
- `src/presentation/mapVisual/ProceduralWorldArtKitRenderer.tsx`
- `src/presentation/mapVisual/ProceduralWorldArtKitRenderer.test.ts`
- `src/presentation/mapContent/regionComposition.ts`
- `src/presentation/mapContent/index.ts`
- `src/presentation/mapContent/regionCompositionAdapter.ts`
- `src/presentation/mapContent/regionCompositionAdapter.test.ts`
- `src/app/mapVisual/WorldArtGallery.tsx`
- `src/app/mapVisual/worldArtGalleryModel.ts`
- `src/app/mapVisual/worldArtGallery.test.ts`
- `src/app/mapVisual/index.ts`
- `docs/parallel/02_WORLD_ART_RESULT.md`

The runtime-owned files listed by the task boundary were not changed. No shared bridge file, simulation file, deployment configuration, or public binary asset was changed.

## REGION_COMPOSITIONS

`REGION_COMPOSITION_TEMPLATES` and `getRegionComposition` provide renderer-neutral, label-independent templates for:

- `capital`: palace axis, assembly/parliament, dense town, managed grove.
- `industrial`: factory/iron works, mine, dense town, mountain ridge, haul road.
- `port`: port/dock, dense town, small settlement, road corridor, field plot.
- `frontier`: fort, checkpoint/gate, small settlement, mountain ridge, and conditional barricade/banner.
- `agrarian-distribution`: field plot, granary/storehouse, distribution yard, small settlement, road corridor.

Each placement carries its semantic family, scale role/rank, offset, LOD visibility, and one of the truth-aware requirements `DECORATIVE_SUBSTRATE`, `AUTHORED_STATIC_POI`, `AUTHORED_SETTLEMENT`, `RECORDED_INSTITUTION`, `RECORDED_PROJECT`, `RECORDED_FACTION`, `RECORDED_CONFLICT`, or `RECORDED_ROUTE`. Region binding carries a typed evidence contract derived from WorldSceneModel facts; it does not own WorldState or simulation mutation.

## ASSET_FAMILIES

`MAP_OBJECT_ASSET_MANIFEST` contains these distinct families:

`palace`, `assembly-parliament`, `dense-town`, `small-settlement`, `port-dock`, `mine`, `factory-iron-works`, `fort`, `checkpoint-gate`, `granary-storehouse`, `distribution-yard`, `barricade`, `faction-banner`, `mountain-cluster`, `forest-cluster`, `field-plot`, and `road-corridor`.

`MAP_SCALE_HIERARCHY` makes the explicit hierarchy `signature-capital > major-project > poi > settlement > decorative-prop`, with ranks 5 through 1. `MAP_MATERIAL_FAMILIES` defines low-saturation base/shadow/accent colors, roughness, metalness, contact-shadow opacity, terrain blending, and notes for earth, stone, civic plaster, industrial iron, frontier timber, vegetation, and signal ochre.

State-project art is represented for `food`, `civic`, and `industrial` projects. Each has `not-started`, `implementing`, and `completed` variants. The latter two use different `scaffold` and `operational` cues, and every variant requires a recorded lifecycle state. No timer, countdown, mana, or cooldown state is introduced.

## PREP1

`RegionCompositionRequest.evidence` is a typed contract containing settlement, POI, institution, project, faction presence, conflict, and route fact projections. `regionCompositionEvidenceFromWorldSceneModel` copies only the required facts from `WorldSceneModel`; it does not import or mutate `WorldState`.

`resolveRegionCompositionPlacements(request)` is the runtime-facing pure adapter. It returns only placements whose requirement has matching evidence for the requested Region, with deterministic placement order and sorted `matchedEvidenceIds`. Project art requires a non-`not-started` project with source event IDs; route art requires an active recorded route; decorative terrain has no authority prerequisite. Missing project, institution, faction, or conflict evidence therefore removes granary/distribution, assembly, banner, or barricade placements respectively.

## PROCEDURAL_ASSET_KIT

`src/presentation/mapVisual/proceduralKitGeometry.ts` supplies actual renderer-neutral low-poly primitive geometry. Every Kit uses 3–9 `box`, `cylinder`, and `cone` primitives with local transforms, positive dimensions, shared material-family IDs, a common `ground-center` origin, unit scale 1, and the existing `MAP_SCALE_HIERARCHY` relative scale. The generated Kit set is:

| Kit | Primitive count | Main silhouette |
|---|---:|---|
| `PalaceKit` / `palace` | 6 | central hall, twin towers, roof, terrace, stairs |
| `AssemblyKit` / `assembly-parliament` | 6 | hall, portico, columns, civic roof, steps |
| `DenseTownKit` / `dense-town` | 7 | varied houses, roofs, tower, market platform |
| `SmallSettlementKit` / `small-settlement` | 5 | two low houses and open yard |
| `PortDockKit` / `port-dock` | 8 | pier, dock posts, warehouse, mast, crane arm |
| `MineKit` / `mine` | 6 | mine mouth, headframe, ore pile, track |
| `FactoryIronWorksKit` / `factory-iron-works` | 8 | works hall, three chimneys, furnace, yard crane |
| `FortKit` / `fort` | 9 | four wall bodies, four corner towers, gate |
| `CheckpointGateKit` / `checkpoint-gate` | 6 | gate posts, lintel, booth, barrier, marker |
| `GranaryKit` / `granary-storehouse` | 7 | storehouse, roof, two silos, grain yard, posts |
| `DistributionYardKit` / `distribution-yard` | 7 | two warehouses, canopy, loading platform, lanes |
| `BarricadeKit` / `barricade` | 5 | crossed beams, posts, blocked-path base |
| `FactionBannerKit` / `faction-banner` | 4 | pole, cloth, finial, base |
| `MountainClusterKit` / `mountain-cluster` | 5 | three peaks, ridge foot, foothill |
| `ForestClusterKit` / `forest-cluster` | 6 | overlapping canopies, trunks, underbrush |
| `FieldPlotKit` / `field-plot` | 5 | ground, repeated furrows, berm |
| `RoadCorridorKit` / `road-corridor` | 5 | road bed, shoulders, marker posts |

Mountain, forest, field, and road kits declare `instance-friendly` placement contracts. Material color, roughness, metalness, grounding, provenance, and the GLB replacement seam are inherited from the shared manifest rather than authored per Kit. No external GLB was downloaded.

`src/app/mapVisual/WorldArtGallery.tsx` is a standalone R3F component that maps each primitive to a real mesh and applies the Kit relative scale. `src/app/mapVisual/worldArtGalleryModel.ts` builds five comparison panels (`capital`, `industrial`, `port`, `frontier`, `agrarian-distribution`) with `previewOnly: true` and `labelsVisible: false`. It is not mounted by the production runtime and cannot authorize semantic world objects.

## FIX1

`ProceduralWorldArtPrimitive.size` remains `[width, height, depth]`. The reusable renderer now uses unit `box`, `cylinder`, and `cone` geometries with mesh scale set directly to `size`, so X/Y/Z dimensions are preserved for every primitive. The existing Kit data was not rewritten.

`src/presentation/mapVisual/ProceduralWorldArtKitRenderer.tsx` exports `ProceduralWorldArtKitRenderer`, `createProceduralPrimitiveRenderDescriptor`, and `createProceduralWorldArtKitRenderDescriptor`. The API accepts either a stable `family` or a `resolvedPlacement`, an integrator-provided 3D position, optional LOD/visibility, and an optional scale multiplier. `WorldArtGallery` now consumes this reusable renderer instead of owning private primitive/kit renderers.

The render descriptor consumes manifest grounding data: `contactShadow` controls whether a contact proxy is rendered, `terrainBlend` selects its deterministic footprint scale, `contactShadowOpacity` comes from the shared material family, and `acceptsTerrainHeight` controls whether the integrator-provided Y coordinate is consumed. No terrain sampling or synthetic height calculation is performed.

The resolver remains strict for settlement evidence. `AUTHORED_SETTLEMENT` is still required for `dense-town` and `small-settlement`; no resolver loosening or fabricated non-capital settlement evidence was added. The missing non-capital authored semantic-content input is an integration-stage content gap, not a reason to display settlement art by role alone.

## PROVENANCE

Every manifest candidate is marked:

- source: `TMR-authored-procedural`
- license: `PROJECT_AUTHORED_NO_THIRD_PARTY_ASSET`
- rights status: `cleared-for-project-candidate`
- production status: `candidate-definition-only`

No external asset was copied into this branch. Every object has a replacement seam with a `glb` preferred format, stable slot ID, procedural fallback, shared ground origin/unit scale, and lazy replacement without layout change.

## TEST_RESULTS

- `pnpm install --frozen-lockfile --offline`: completed; lockfile supply-chain policy passed.
- `pnpm exec vitest run src/presentation/mapVisual/worldArt.test.ts src/presentation/mapVisual/proceduralKitGeometry.test.ts src/presentation/mapVisual/ProceduralWorldArtKitRenderer.test.ts src/presentation/mapContent/regionCompositionAdapter.test.ts src/app/mapVisual/worldArtGallery.test.ts`: passed, 5 files / 17 tests.
- `pnpm run format`: passed.
- `pnpm run typecheck`: passed.
- `pnpm run lint`: passed.
- `pnpm run build`: passed; Vite emitted the existing large-chunk warning and exited successfully.
- `git diff --check`: passed before final staging; cached check is repeated before commit.
- `pnpm test`: not rerun for this follow-up. The prior baseline run at `641d112f8f6c125e5dce33fbe8736b49b4f3c601` reported 84 test files and 614 assertions completed successfully, then 4 unhandled Vitest worker `Timeout calling "onTaskUpdate"` errors and exit code 1.

## PREVIEW_EVIDENCE

- Standalone preview source: `src/app/mapVisual/WorldArtGallery.tsx`.
- Preview model: `src/app/mapVisual/worldArtGalleryModel.ts`.
- Labels-disabled gallery coverage: `src/app/mapVisual/worldArtGallery.test.ts`, included in the 4-file / 14-test focused run.
- A screenshot was not generated because the gallery is intentionally not mounted into the protected production runtime in this branch. The source is a renderable R3F preview component, but no visual product-gate or runtime integration result is claimed.

## INTEGRATION_API

Import from `src/presentation/mapContent` for `getRegionComposition`, `REGION_COMPOSITION_TEMPLATES`, `regionCompositionRoles`, `regionCompositionEvidenceFromWorldSceneModel`, and `resolveRegionCompositionPlacements`. Import from `src/presentation/mapVisual` for `MAP_OBJECT_ASSET_MANIFEST`, `getWorldObjectVisualDefinition`, `MAP_MATERIAL_FAMILIES`, `MAP_SCALE_HIERARCHY`, `STATE_PROJECT_ART_GRAMMAR`, `PROCEDURAL_WORLD_ART_KITS`, `getProceduralWorldArtKit`, `ProceduralWorldArtKitRenderer`, `createProceduralPrimitiveRenderDescriptor`, `createProceduralWorldArtKitRenderDescriptor`, and the related types.

The runtime integrator should derive typed evidence from the actual WorldSceneModel, bind each actual Region to a role and anchor, call `resolveRegionCompositionPlacements`, apply `visibleAt` LOD, and use the Kit grounding/material contract for terrain placement. A GLB loader can resolve `replacementSeam.slotId` while preserving the shared origin and unit scale, with the procedural Kit as fallback.

## KNOWN_LIMITATIONS

- This branch does not wire the protected production runtime; the downstream integrator must mount the resolver and Kit renderer.
- No GLB/glTF binary asset files are included; the procedural Kit is the current candidate fallback and the seam is ready for later cleared candidates.
- The gallery is an authoring preview and deliberately displays composition silhouettes without authority evidence. Production code must use the resolver output instead.
- No screenshot or browser visual QA was generated in this branch.
- Non-capital authored settlement facts are not present in the current WorldSceneModel content source, so dense-town/small-settlement resolution remains absent until the integration owner supplies real authored settlement facts.

## FILES_RUNTIME_INTEGRATOR_MUST_CHANGE

The downstream runtime integration may need to change these files, outside this branch’s ownership:

- `src/app/PoliticalWorldStage.tsx` — consume region compositions, object families, LOD, and grounding data.
- `src/presentation/mapVisualSystem.ts` — bridge the current visual adapter to the new manifest/material/replacement seam.
- `src/presentation/mapArchitecture.ts` — connect existing map architecture metadata to the new region-composition contract if that adapter remains the integration point.

This result does not authorize those changes, a merge, deployment, Gate decision, V02 work, or persistence V9 work.

## FIX2_VISUAL_IDENTITY

FIX2 keeps the current strict authority resolver and changes only the authored procedural world-art contract plus its standalone gallery coverage. The 06 QA blocker-to-fix mapping is:

| QA finding | Authored fix |
|---|---|
| Port had no waterside identity | Added the new `water-shelf` decorative family with a broad water plane, shoreline band/edge, and tidal edge breaks. `port-dock` now has a deeper pier that crosses the shoreline edge and a stronger quay edge/post relationship. |
| Agrarian/distribution read as a pale civic cluster | Expanded `FieldPlotKit` horizontally with durable furrows, berm, and drainage. `GranaryKit` now has a broader storehouse, two capped silos, and a larger yard. `DistributionYardKit` now emphasizes canopy, loading platform, parallel lanes, and an open-yard boundary; the prior cargo-like `crate-stack` was removed. |
| Frontier fort/gate did not immediately read as a chokepoint | `FortKit` now splits the south wall around an explicit open gate void with a raised timber lintel. `CheckpointGateKit` uses a timber booth roof and stone threshold to separate the gate grammar from industrial chimney language. The existing mountain/ridge substrate remains decorative. |
| Industrial was dominated by a box and three chimneys | `FactoryIronWorksKit` now has a larger works yard, ore bay, haul axis, furnace relation, and varied lower chimney heights. It remains a 10-primitive practical kit with no actors, vehicles, cargo activity, or production quantities. |
| Capital hierarchy was only partial | `PalaceKit` now has a broader terrace, public plaza, civic approach, and a centered roof axis without an extreme height increase. The industrial chimney heights were reduced while the manifest hierarchy remains `signature-capital > major-project > poi > settlement > decorative-prop`. |

### Changed Kits and families

- Changed `PalaceKit` (`palace`): 8 primitives; terrace/public-axis emphasis.
- Changed `PortDockKit` (`port-dock`): 8 primitives; shoreline-crossing pier and quay edge.
- Added `WaterShelfKit` (`water-shelf`): 5 instance-friendly decorative substrate primitives.
- Changed `FactoryIronWorksKit` (`factory-iron-works`): 10 primitives; works yard, ore bay, haul axis, furnace, and varied chimneys.
- Changed `FortKit` (`fort`): 10 primitives; wall perimeter with explicit gate void/lintel.
- Changed `CheckpointGateKit` (`checkpoint-gate`): 8 primitives; timber guard roof and threshold.
- Changed `GranaryKit` (`granary-storehouse`): 9 primitives; storehouse, capped silo profile, and yard.
- Changed `DistributionYardKit` (`distribution-yard`): 7 primitives; canopy, loading platform, lanes, and open yard.
- Changed `FieldPlotKit` (`field-plot`): 6 instance-friendly primitives; wide field plane, furrows, berm, and drainage.

The new `water-shelf` manifest entry uses stable family/asset/kit IDs, `terrain-water`, low-saturation rough material settings, coastal grounding, LOD visibility, TMR-authored provenance, and the same GLB replacement seam as the existing families. `WorldArtGallery` exercises it automatically through the updated port composition snapshot; its labels-off test asserts the water shelf and gated port pair.

### Authority proof

`water-shelf` is explicitly `DECORATIVE_SUBSTRATE`. The resolver contract was not loosened: empty port evidence resolves only `water-shelf` and the existing decorative `field-plot`; `port-dock` still requires an authoritative authored port POI. Project art remains `RECORDED_PROJECT`, assembly remains `RECORDED_INSTITUTION`, settlement kits remain `AUTHORED_SETTLEMENT`, banners remain `RECORDED_FACTION`, barricades remain `RECORDED_CONFLICT`, and roads remain `RECORDED_ROUTE`. No runtime/simulation file, WorldState mutation, route fact, activity actor, cargo quantity, or project-completion fact was added.

### Verification

- Focused world-art suite: `node node_modules/vitest/vitest.mjs run src/presentation/mapVisual/worldArt.test.ts src/presentation/mapVisual/proceduralKitGeometry.test.ts src/presentation/mapVisual/ProceduralWorldArtKitRenderer.test.ts src/presentation/mapContent/regionCompositionAdapter.test.ts src/app/mapVisual/worldArtGallery.test.ts --reporter=verbose` — 5 files / 18 tests passed.
- `node node_modules/prettier/bin/prettier.cjs --check .` — passed.
- `node node_modules/typescript/bin/tsc -b --pretty false` — passed.
- `node node_modules/eslint/bin/eslint.js .` — passed.
- `node node_modules/vite/bin/vite.js build` — passed; the existing large-chunk warning remains.
- `node scripts/build-sites-worker.mjs` — passed.
- `git diff --check` — passed before staging.

### Preview and remaining limitations

- A browser screenshot was not produced. The gallery is a standalone authoring component and is intentionally not mounted into the protected production runtime; 06 visual re-review remains the authority for blocker disposition.
- Production runtime integration remains outside this branch. The downstream integrator must call the strict resolver, pass actual terrain Y, and mount the reusable renderer.
- Non-capital authored settlement facts remain an integration content gap; dense/small settlement art is not displayed by role alone.
- Procedural geometry remains the cleared project-authored fallback candidate. No external GLB/glTF was downloaded or added.
