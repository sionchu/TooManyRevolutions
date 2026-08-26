# PARALLEL TASK 02 — WORLD ART / REGION COMPOSITION

TASK_ID: PARALLEL_02_WORLD_ART
EXECUTION_AUTHORITY: THIS_FILE_ONLY
BASELINE: 16b3ad5b2b255e41a9b4adb73b184f8b15684939

## Critical authority rule

This is an explicitly isolated parallel task.

- `docs/bridge/CURRENT_TASK.md` is **NOT an executable task for this branch**.
- Read `CURRENT_TASK.md` only for shared hard boundaries and already-accepted architecture.
- Do **NOT** implement its Map Runtime/geometry/camera work unless this file explicitly asks for it.
- If this file conflicts with a request in `CURRENT_TASK.md` about what to implement now, **this file wins for this parallel branch**.
- Do not update `CURRENT_TASK.md`, `STATE.md`, `LAST_RESULT.md`, or the shared P0 result.

## Role

WORLD ART SYSTEM / REGION COMPOSITION / ASSET PIPELINE.

Goal: make the world visually identifiable without labels by creating coherent authored region compositions and a reusable low-poly asset/material system. This task supplies art/content APIs to the Map Runtime integrator; it does not own renderer geometry.

## Must not modify

- `src/app/PoliticalWorldStage.tsx`
- `src/presentation/worldSceneModel.ts`
- `src/presentation/mapArchitecture.ts`
- `src/sim/**`
- shared bridge state/result files
- production deployment

If integration would require one of those files, document the required API in the result instead of editing the file.

## Owned/new areas

Prefer new isolated files under:

- `src/presentation/mapVisual/**`
- `src/presentation/mapContent/**`
- `src/app/mapVisual/**`
- `public/assets/tmr/map/**`
- asset manifest extensions only when necessary
- dedicated tests

## Deliverables

1. `RegionCompositionDefinition` with at least:
   - capital
   - industrial
   - port
   - frontier
   - agrarian/distribution
2. Distinct semantic object families:
   - palace
   - assembly/parliament
   - dense town
   - small settlement
   - port/dock
   - mine
   - factory/iron works
   - fort
   - checkpoint/gate
   - granary/storehouse
   - distribution yard
   - barricade
   - faction banner
   - mountain/forest/field decorative families
3. Explicit scale hierarchy:
   - signature capital > major project > POI > settlement > decorative prop
4. Coherent material/palette/grounding contract:
   - contact/footprint/shadow/terrain alignment
   - avoid toy/plastic/rainbow appearance
5. State Project art grammar:
   - food/civic/industrial recognizable without text
   - implementing vs completed visually distinct without fake timers
6. GLB/glTF-ready replacement seam even if current assets are procedural low-poly.
7. Asset provenance for every added production candidate.
8. Renderer-neutral integration API such as:
   - `getRegionComposition(...)`
   - `getWorldObjectVisualDefinition(...)`
   - `MAP_OBJECT_ASSET_MANIFEST`
   - `MAP_MATERIAL_FAMILIES`
   - `MAP_SCALE_HIERARCHY`

## Acceptance

With labels disabled in a standalone preview, a reviewer should distinguish at category level:

- capital area
- industrial area
- port area
- frontier area
- agrarian/distribution area

Do not claim product PASS from type definitions alone. Provide preview/snapshot evidence if practical without editing the runtime-owned renderer.

## Verification

Run format, typecheck, lint, build, focused tests, asset/provenance/path validation, and `git diff --check`.

## Result

Write only `docs/parallel/02_WORLD_ART_RESULT.md`.

Include:

- BASE_SHA
- HEAD_SHA
- CHANGED_FILES
- REGION_COMPOSITIONS
- ASSET_FAMILIES
- PROVENANCE
- TEST_RESULTS
- PREVIEW_EVIDENCE
- INTEGRATION_API
- KNOWN_LIMITATIONS
- FILES_RUNTIME_INTEGRATOR_MUST_CHANGE

Commit and push only this branch's work, then STOP. Do not merge, deploy, or self-authorize another task.