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

## PROVENANCE

Every manifest candidate is marked:

- source: `TMR-authored-procedural`
- license: `PROJECT_AUTHORED_NO_THIRD_PARTY_ASSET`
- rights status: `cleared-for-project-candidate`
- production status: `candidate-definition-only`

No external asset was copied into this branch. Every object has a replacement seam with a `glb` preferred format, stable slot ID, procedural fallback, shared ground origin/unit scale, and lazy replacement without layout change.

## TEST_RESULTS

- `pnpm install --frozen-lockfile --offline`: completed; lockfile supply-chain policy passed.
- `pnpm exec vitest run src/presentation/mapVisual/worldArt.test.ts src/presentation/mapVisual/proceduralKitGeometry.test.ts src/presentation/mapContent/regionCompositionAdapter.test.ts src/app/mapVisual/worldArtGallery.test.ts`: passed, 4 files / 14 tests.
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

Import from `src/presentation/mapContent` for `getRegionComposition`, `REGION_COMPOSITION_TEMPLATES`, `regionCompositionRoles`, `regionCompositionEvidenceFromWorldSceneModel`, and `resolveRegionCompositionPlacements`. Import from `src/presentation/mapVisual` for `MAP_OBJECT_ASSET_MANIFEST`, `getWorldObjectVisualDefinition`, `MAP_MATERIAL_FAMILIES`, `MAP_SCALE_HIERARCHY`, `STATE_PROJECT_ART_GRAMMAR`, `PROCEDURAL_WORLD_ART_KITS`, `getProceduralWorldArtKit`, and the related types.

The runtime integrator should derive typed evidence from the actual WorldSceneModel, bind each actual Region to a role and anchor, call `resolveRegionCompositionPlacements`, apply `visibleAt` LOD, and use the Kit grounding/material contract for terrain placement. A GLB loader can resolve `replacementSeam.slotId` while preserving the shared origin and unit scale, with the procedural Kit as fallback.

## KNOWN_LIMITATIONS

- This branch does not wire the protected production runtime; the downstream integrator must mount the resolver and Kit renderer.
- No GLB/glTF binary asset files are included; the procedural Kit is the current candidate fallback and the seam is ready for later cleared candidates.
- The gallery is an authoring preview and deliberately displays composition silhouettes without authority evidence. Production code must use the resolver output instead.
- No screenshot or browser visual QA was generated in this branch.

## FILES_RUNTIME_INTEGRATOR_MUST_CHANGE

The downstream runtime integration may need to change these files, outside this branch’s ownership:

- `src/app/PoliticalWorldStage.tsx` — consume region compositions, object families, LOD, and grounding data.
- `src/presentation/mapVisualSystem.ts` — bridge the current visual adapter to the new manifest/material/replacement seam.
- `src/presentation/mapArchitecture.ts` — connect existing map architecture metadata to the new region-composition contract if that adapter remains the integration point.

This result does not authorize those changes, a merge, deployment, Gate decision, V02 work, or persistence V9 work.
