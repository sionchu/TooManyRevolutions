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
- `src/presentation/mapContent/regionComposition.ts`
- `src/presentation/mapContent/index.ts`
- `docs/parallel/02_WORLD_ART_RESULT.md`

The runtime-owned files listed by the task boundary were not changed. No shared bridge file, simulation file, deployment configuration, or public binary asset was changed.

## REGION_COMPOSITIONS

`REGION_COMPOSITION_TEMPLATES` and `getRegionComposition` provide renderer-neutral, label-independent templates for:

- `capital`: palace axis, assembly/parliament, dense town, managed grove.
- `industrial`: factory/iron works, mine, dense town, mountain ridge, haul road.
- `port`: port/dock, dense town, small settlement, road corridor, field plot.
- `frontier`: fort, checkpoint/gate, small settlement, mountain ridge, and conditional barricade/banner.
- `agrarian-distribution`: field plot, granary/storehouse, distribution yard, small settlement, road corridor.

Each placement carries its semantic family, scale role/rank, offset, LOD visibility, and an explicit `always` / recorded-project / recorded-faction / recorded-conflict requirement. Region binding carries only `regionId`, anchor, and caller-supplied evidence IDs; it does not own simulation state.

## ASSET_FAMILIES

`MAP_OBJECT_ASSET_MANIFEST` contains these distinct families:

`palace`, `assembly-parliament`, `dense-town`, `small-settlement`, `port-dock`, `mine`, `factory-iron-works`, `fort`, `checkpoint-gate`, `granary-storehouse`, `distribution-yard`, `barricade`, `faction-banner`, `mountain-cluster`, `forest-cluster`, `field-plot`, and `road-corridor`.

`MAP_SCALE_HIERARCHY` makes the explicit hierarchy `signature-capital > major-project > poi > settlement > decorative-prop`, with ranks 5 through 1. `MAP_MATERIAL_FAMILIES` defines low-saturation base/shadow/accent colors, roughness, metalness, contact-shadow opacity, terrain blending, and notes for earth, stone, civic plaster, industrial iron, frontier timber, vegetation, and signal ochre.

State-project art is represented for `food`, `civic`, and `industrial` projects. Each has `not-started`, `implementing`, and `completed` variants. The latter two use different `scaffold` and `operational` cues, and every variant requires a recorded lifecycle state. No timer, countdown, mana, or cooldown state is introduced.

## PROVENANCE

Every manifest candidate is marked:

- source: `TMR-authored-procedural`
- license: `PROJECT_AUTHORED_NO_THIRD_PARTY_ASSET`
- rights status: `cleared-for-project-candidate`
- production status: `candidate-definition-only`

No external asset was copied into this branch. Every object has a replacement seam with a `glb` preferred format, stable slot ID, procedural fallback, shared ground origin/unit scale, and lazy replacement without layout change.

## TEST_RESULTS

- `pnpm install --frozen-lockfile --offline`: completed; lockfile supply-chain policy passed.
- `pnpm exec vitest run src/presentation/mapVisual/worldArt.test.ts`: passed, 4 tests.
- `pnpm run format`: passed.
- `pnpm run typecheck`: passed.
- `pnpm run lint`: passed.
- `pnpm run build`: passed; Vite emitted the existing large-chunk warning and exited successfully.
- `git diff --check`: passed before final staging; cached check is repeated before commit.
- `pnpm test`: runner exit 1. The run reported 84 test files and 614 assertions completed successfully, then reported 4 unhandled Vitest worker `Timeout calling "onTaskUpdate"` errors. No source change was made to broaden this task in response.

## PREVIEW_EVIDENCE

`NOT_RUN`: a renderer preview/screenshot was not generated. The task boundary excludes the runtime renderer integration files, and this branch supplies the standalone composition/asset contract only. The focused test checks the semantic categories, hierarchy, grounding, provenance, replacement seam, and state-project distinctions; it is not a visual product-gate result.

## INTEGRATION_API

Import from `src/presentation/mapContent` for `getRegionComposition`, `REGION_COMPOSITION_TEMPLATES`, and `regionCompositionRoles`. Import from `src/presentation/mapVisual` for `MAP_OBJECT_ASSET_MANIFEST`, `getWorldObjectVisualDefinition`, `MAP_MATERIAL_FAMILIES`, `MAP_SCALE_HIERARCHY`, `STATE_PROJECT_ART_GRAMMAR`, and the related types.

The runtime integrator should bind each actual region to a role and anchor, filter conditional placements using recorded project/faction/conflict facts, apply `visibleAt` LOD, and use the grounding/material contract for terrain placement. A GLB loader can resolve `replacementSeam.slotId` while preserving the shared origin and unit scale, with the procedural definition as fallback.

## KNOWN_LIMITATIONS

- This branch defines the art grammar and integration seam; it does not wire the runtime renderer or produce a visual screenshot.
- No GLB/glTF binary asset files are included; the seam is ready for later cleared candidates.
- Region templates and project-art variants are presentation metadata. The runtime must provide real region identity, evidence, and recorded lifecycle/faction/conflict state.

## FILES_RUNTIME_INTEGRATOR_MUST_CHANGE

The downstream runtime integration may need to change these files, outside this branch’s ownership:

- `src/app/PoliticalWorldStage.tsx` — consume region compositions, object families, LOD, and grounding data.
- `src/presentation/mapVisualSystem.ts` — bridge the current visual adapter to the new manifest/material/replacement seam.
- `src/presentation/mapArchitecture.ts` — connect existing map architecture metadata to the new region-composition contract if that adapter remains the integration point.

This result does not authorize those changes, a merge, deployment, Gate decision, V02 work, or persistence V9 work.
