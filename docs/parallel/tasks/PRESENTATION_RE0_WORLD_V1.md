# Presentation RE0 — World / Map Visual V1

EXECUTION_AUTHORITY: THIS_FILE_ONLY

BASE_FUNCTIONAL_SHA: `d613154bb663ef01c8378d59943e3055d045f50d`
VISUAL_BAR: `docs/bridge/tasks/PRODUCT_PRESENTATION_RE0_VISUAL_BAR.md`

## Goal

Rebuild the player-facing world composition so the default view reads as a coherent political strategy world, not an asset gallery or debug board.

This track owns the internal world renderer only. It must not redesign the product HUD/panels.

## Owned files / domains

Primary ownership:

- `src/app/PoliticalWorldStage.tsx`
- `src/app/mapVisual/**`
- `src/presentation/mapArchitecture.ts`
- `src/presentation/mapRuntime/**`
- `src/presentation/mapVisualSystem.ts`
- `src/presentation/mapContent/**`
- map/world renderer-focused tests

You may add one dedicated map-only stylesheet imported by the world renderer if necessary. Do NOT edit `src/styles/global.css`.

Do NOT modify:

- simulation behavior or balance,
- `src/sim/**` production behavior,
- contextual decision selector/catalog,
- `App.tsx`, `DecisionPanel.tsx`, `MetricStrip.tsx`, `TimeControls.tsx`, `ContextualDock.tsx`, `ChroniclePanel.tsx`, `InstitutionalRoadmapPanel.tsx`,
- EventPresentation authority,
- PoliticalProposal authority,
- title/opening UI.

## Required RE0 decisions

### 1. Remove asset-gallery terrain behavior

Default and medium view must NOT render repeated tree, rock, or mountain GLTF clusters per LandHex.

The current `TerrainDetail()` / `renderTerrainPlacement()` behavior that makes trees, rocks, and mountains read as giant toy tokens must be removed from the normal player-facing medium composition.

Near/focus view may use sparse environmental detail only if it does not dominate landmarks and if scale is coherent. Do not scatter one cluster per cell.

### 2. Terrain becomes continuous geography

Preserve LandHex logical authority, but render geography as continuous connected terrain treatment.

Improve the terrain surface using the existing authoritative terrain kinds and authored geography only. Acceptable techniques include:

- restrained vertex/material palette by terrain,
- shared/snap-keyed height variation,
- continuous coast/water treatment,
- subtle forest mass / cultivated-ground / mountain-ridge surface treatment,
- terrain-normal/roughness variation,
- atmospheric depth/fog,
- restrained shadowing.

Do not invent population, armies, buildings, roads, rivers, ports, farms, or settlements that have no authored/presentation evidence.

Logical Hex outlines should be absent or nearly invisible by default. They may appear for selection, focus, controller transition, or other justified game-state feedback.

### 3. Default landmarks: 3–5 intentional groups

Default/medium camera should show only strategically meaningful hero landmarks.

Target:

- capital hero,
- industrial hero,
- frontier hero,
- truthful port treatment only if visually valid,
- factual crisis marker when active.

No minor house scatter in default/medium.

### 4. Eliminate mixed art-language default

Resolved KayKit hero assets must not sit beside beige procedural landmarks in the same default composition.

For unresolved visual families:

1. omit if not required for comprehension,
2. use quiet factual label/surface treatment,
3. procedural fallback only in dev/blockout or explicitly near/focus case if it visually matches.

Do not preserve a bad procedural object merely because a slot exists.

### 5. Scale hierarchy

Define a coherent world scale based on visible screen size, not source-pack native scale.

Acceptance target:

- capital is dominant but not gigantic,
- industrial center reads as one cluster, not two unrelated buildings,
- frontier reads as a single defensive landmark,
- environmental forms never exceed or visually compete with the capital landmark in medium view.

### 6. Camera / lighting

Keep orthographic or near-orthographic strategy readability.

Improve:

- geographic depth,
- landmark separation,
- subtle directional light hierarchy,
- restrained ambient/fog treatment.

Do not make the scene glossy, saturated, or toy-like.

### 7. Political overlays remain factual and subordinate

Preserve:

- legal owner weakest,
- controller stronger,
- real front strongest,
- ideology Region-scale,
- faction territory derived,
- no invented tactical units.

But the geography must remain visible under those overlays.

## Visual acceptance measurements

Desktop 1440x900 normal camera:

- default labels <= 5,
- dominant hero landmark groups target 3–5,
- default/medium visible repeated tree/rock/mountain GLTF clusters = 0,
- default/medium visible beige procedural hero landmarks beside resolved KayKit = 0,
- same-controller internal boundary clutter = 0,
- no giant environmental asset visually larger than capital.

Mobile 390x844:

- world remains legible without giant assets blocking country structure,
- no horizontal overflow from world canvas,
- camera framing still reads capital + broader territory, not one oversized object.

## Browser evidence

Capture and inspect:

1. desktop default 1440x900,
2. desktop labels-off,
3. desktop active rebellion/front,
4. desktop near/focus view,
5. mobile default 390x844.

The screenshots must be opened and judged for composition, not only DOM counts.

## Verification

Run focused map/world tests, typecheck, lint, format, build, `git diff --check`.

Do not spend time on the known long full-suite worker timeout unless a changed map contract requires a broader targeted regression.

## Result

Write:

`docs/parallel/PRESENTATION_RE0_WORLD_V1_RESULT.md`

Record:

- removed visual paths,
- final default landmark count,
- medium environmental-prop count,
- procedural fallback visibility,
- camera/lighting/terrain changes,
- screenshots,
- remaining visual weaknesses.

Commit/push and STOP.

Do not deploy and do not self-declare the shared visual bar PASS.