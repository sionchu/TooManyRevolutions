# Parallel Task 06 — Map Runtime FIX1 Protocol QA

EXECUTION_AUTHORITY: THIS_FILE_ONLY

## Branch / baseline

- QA branch: `parallel-p0-visual-qa-v2`
- start from current QA branch HEAD `8e7399e39325965e0e33887f4a126427873ad510`
- protocol: `docs/parallel/06_INTEGRATION_QA_PROTOCOL.md`
- review target: `parallel-p0-map-runtime@7b2f5bd2c65f61a302bbc096f1afe2757b9bcd4a`
- previous runtime comparison target: `18d2f297c25dd27cfd05ea5c37e5d10f71f689e0`
- frozen deployed baseline remains `271eb18b9d713c3d639091b35aa65c2c0d780b69` where useful for before/after context

Production source must not be modified or deployed.

## Objective

Re-review 01 FIX1 using the new visual QA protocol so runtime metadata, terrain occupancy, and meaningful-world occupancy are never mixed.

This is especially important because FIX1 now reports `first mobile viewport world share = 0.344`, but its projected bounds are terrain-vertex bounds rather than a manually verified meaningful-world rect.

## Required comparison

Run exact target SHA in a temporary detached worktree/local Vite environment. Use the same seed/state reproduction as prior rolling QA.

Capture at minimum:

Desktop 1440×900:
- Day0 labels ON
- Day0 labels OFF
- Day90 rebellion
- Day90 rebellion labels OFF

Mobile 390×844:
- Day0 default
- selected Region/drawer
- Day90 rebellion

If project states are easy to reproduce without changing source, also capture implementing/completed; otherwise record NOT_MEASURED.

## Occupancy metrics — keep separate

Follow `06_INTEGRATION_QA_PROTOCOL.md` exactly.

Record independently:

1. `STAGE_OCCUPANCY`
2. `TERRAIN_OCCUPANCY`
3. `MEANINGFUL_WORLD_OCCUPANCY`

Do not copy `data-map-projected-world-occupancy-*` into meaningful-world results.

For mobile compute:
- canvasTopY
- canvasHeight / 844
- firstViewportActualWorldShare from manually annotated meaningful world minus drawer occlusion
- HUD/header/time-controls cumulative height
- smallest map-control target
- smallest primary action target when present
- horizontal overflow
- drawer obstruction ratio

Reference target: firstViewportActualWorldShare >= 0.60. Do not declare PASS if only stage or terrain passes.

## Runtime FIX1 questions

Answer explicitly:

1. Does the preserved continuous terrain now show terrain/elevation variation rather than a flat translucent polygon board?
2. Are legal owner, physical controller, and active front three distinct visual channels on the actual map?
3. Does the Day90 rebellion read as an occupied area + real front rather than repeated flags?
4. Are faction banners actually <=2 and visually secondary?
5. Is the FIX1 `0.344` browser metadata consistent with manually measured terrain share? If not, explain why.
6. What is the manually measured meaningful-world share on mobile?
7. Has P0-VIS-01 improved at all versus previous runtime target `18d2f29`?
8. Has P0-VIS-03 improved enough to close, or is it still PARTIAL?

## Labels-off rubric

Blindly review:
- capital
- industrial
- port
- frontier
- rebellion

Because 02 World Art is not integrated into this target, do not penalize 01 for missing the new 02 assets beyond confirming that runtime alone still cannot close P0-VIS-02. Attribute ownership correctly.

## Evidence

Store new screenshots under a new folder, e.g.:

`docs/parallel/evidence/06-map-runtime-fix1/`

Do not overwrite previous baseline or rolling screenshots.

Use protocol helper:
- `tools/visualQa/measure-world.js`

Record measurement JSON or summarized exact values in the report.

## Result

Create:

`docs/parallel/06_MAP_RUNTIME_FIX1_PROTOCOL_QA.md`

Include:
- target SHA and comparison SHA
- exact viewport/state/camera conditions
- STAGE/TERRAIN/MEANINGFUL measurements
- mobile actual first-viewport world share
- owner/controller/front visual assessment
- terrain richness assessment
- faction banner count and dominance
- before/after blocker status
- evidence paths
- recommended owner for each remaining blocker

Do not declare P0 product PASS, Gate1F, or V02.

Commit/push and STOP. Await the integration target after this review.