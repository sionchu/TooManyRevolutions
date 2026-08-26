# P0 Integration V1 Result

BRANCH: `parallel-p0-integration-v1`

BASE_SHA: `7b2f5bd2c65f61a302bbc096f1afe2757b9bcd4a`

AUTHORIZED_HEAD_AT_START: `f6c12f267c52b289331748e8da6815eec8f93a81`

IMPLEMENTATION_HEAD_SHA: `906a4dd35a0757f17ca137e38931720efd8ccb3a`

HEAD_SHA: `144f13ebfb812014e8562aa24a8c14dcbcf7732d`

REMOTE_SYNC: `c3734cef9bb87a6de3db1f152d3b09532dc09ad4` was retained as a
docs-only contextual-decisions addendum after the authorized starting head.

## AUTHORIZED INPUTS

- 02 World Art: `641d112f8f6c125e5dce33fbe8736b49b4f3c601`,
  `fd46de162b81814a1c61caccaf09ab4a31641738`,
  `a780e3df108dbdf4490d42859af1d880d4fdd663`,
  `52e4c14574689ec0c618d9d83a451b46f2302603` (FIX2 integrated).
- 03 Icon System: `9dfe81dacf0ad101b10ea7f99e0eef18d031e326`.
- 04 Audio: `0bf4e24ce6a50a0cacea8c6e19c22a7be3c4bf20`,
  `5ca4bff9c725bd2b83b3e74ca09d3894f35c5600`.
- Visual authority: `docs/parallel/tasks/P0_INTEGRATION_V1_VISUAL_DISPOSITION_ADDENDUM.md`.
- FIX3 was not waited for or integrated.

## CHANGED_FILES

This integration pass changed or added:

- `src/app/App.tsx`
- `src/app/GameHeader.tsx`
- `src/app/PoliticalWorldStage.tsx`
- `src/presentation/mapArchitecture.ts`
- `src/presentation/mapContent/index.ts`
- `src/presentation/mapContent/regionComposition.ts`
- `src/presentation/mapContent/regionCompositionIntegration.ts`
- `src/presentation/mapContent/regionCompositionIntegration.test.ts`
- `src/styles/global.css`
- `docs/parallel/evidence/p0-integration-v1-desktop-labels-off.png`
- `docs/parallel/evidence/p0-integration-v1-desktop-labels-on.png`
- `docs/parallel/evidence/p0-integration-v1-desktop-rebellion.png`
- `docs/parallel/evidence/p0-integration-v1-desktop-rebellion-selected.png`
- `docs/parallel/evidence/p0-integration-v1-mobile-default.png`

The remote-only contextual decision authority file retained during sync is
`docs/parallel/tasks/P0_INTEGRATION_V1_CONTEXTUAL_DECISIONS_ADDENDUM.md`.

## IMPLEMENTED INTEGRATION

- `PoliticalWorldStage` now uses the accepted `ProceduralWorldArtKitRenderer`.
  The old generic factual-object path is suppressed when the evidence-backed
  composition covers the same fact, preventing duplicate blockout and kit
  rendering.
- Port composition is anchored to the authored port POI and reads as water
  shelf → shoreline/dock → port POI → inland route/settlement context. The
  water and route substrates are enlarged for geographic reading; no shipping
  or coastline state is invented.
- Agrarian composition supports recorded food projects and reads as open field
  → granary/storehouse → distribution yard → open route/settlement context.
  A runtime semantic building is emitted only for evidence-backed POI/project
  facts with source event evidence.
- Continuous terrain remains the 01 runtime surface: `LandHex` count is 20,
  runtime geometry is `continuous-surface`, polygon count is 6, and shared
  vertex count is 34. LandHex meshes remain the invisible hit-test substrate.
- Legal owner boundaries, physical controller boundaries, and real fronts stay
  separate. Same-controller legal boundaries remain available when owner IDs
  differ; front lines are limited to derived active `model.fronts`.
- Faction territory surfaces and fronts are primary. Near-LOD banner anchors
  are deduped to connected faction clusters and capped at two; the Day90
  browser evidence contains one anchor and two real front segments.
- Faction surface/front render order was raised while the crisis ring was
  reduced, so ideology and territorial geography remain stronger than aura
  markers.
- Desktop and mobile document flow is world-first: header, world stage, then
  metrics/time controls. The mobile default is `mobile.player-theater`; “전체
  보기” remains a separate action. Camera/time/context controls measure at
  least 44px touch height in the inspected states.
- Stage/container occupancy, projected meaningful-world occupancy, and first
  mobile viewport world share are emitted as separate screen-space metrics;
  there is no synthetic ratio or 1.0 clamp.
- The contextual decision addendum is recorded as `CONTEXTUAL_DECISION_SURFACE:
  P0_OPEN`; no new decision filtering was added in this pass.

## TEST_RESULTS

- Focused map/runtime/world-art suite: 7 files, 32 tests — exit 0.
- Focused audio/icon suite: 6 files, 26 tests — exit 0.
- `npm run inspect:t018` — exit 0; one inspection test.
- `npm run inspect:t021` — exit 0; one inspection test.
- `npm run inspect:t024` — exit 0; Gate 1V remains NOT STARTED.
- `npm run inspect:v01` — exit 0; V02 remains NOT STARTED.
- `npm run typecheck` — exit 0.
- `npm run lint` — exit 0.
- `npm run format` — exit 0.
- `npm run build` — exit 0; Vite transformed 163 modules. The existing large
  JavaScript chunk warning remains.
- `git diff --check` — exit 0.
- Full `npm test` — runner exit 1. Vitest reported 96 files and 661 tests
  executed successfully, with 4 unhandled worker errors:
  `Timeout calling "onTaskUpdate"`. No P0 result is inferred from this
  runner-level outcome.

## SCREENSPACE_EVIDENCE

Measurements are from the local browser against the rendered canvas and
projected terrain bounds, not DOM container size alone.

- Desktop 1440×900, labels on: stage `0.950 × 0.878`; projected world
  `0.934 × 0.620`; labels `21`; horizontal overflow `scrollWidth 1425`,
  `clientWidth 1425`.
- Desktop 1440×900, labels off: labels `0`; runtime geometry remains
  continuous and the geographic/art layer remains visible.
- Mobile 390×844, initial `mobile.player-theater`, near LOD: stage
  `0.981 × 0.780`; projected world `1.000 × 0.905`; first mobile viewport
  world share `0.612`; horizontal overflow `scrollWidth 375`,
  `clientWidth 375`.
- Day90 desktop: `tick=90`, faction surfaces `6`, faction banner anchors `1`,
  front segments `2`, stage `0.950 × 0.878`, projected world `0.934 × 0.787`.
  The territory/front surface reads before the compact crisis banner/card.
- Day0 integration DOM: procedural kit registry `18`, integrated placements
  `21`, integrated families `13`, composed regions `7`, omitted regions `3`.
- Browser audio smoke in this environment reported `AudioContext` unavailable
  and `data-audio-status=disabled`; WAV source/registry/resolver tests ran, but
  speaker playback is not asserted here.

## SCREENSHOT_PATHS

- `docs/parallel/evidence/p0-integration-v1-desktop-labels-on.png`
- `docs/parallel/evidence/p0-integration-v1-desktop-labels-off.png`
- `docs/parallel/evidence/p0-integration-v1-mobile-default.png`
- `docs/parallel/evidence/p0-integration-v1-desktop-rebellion.png`
- `docs/parallel/evidence/p0-integration-v1-desktop-rebellion-selected.png`

## KNOWN_LIMITATIONS

- Port and Agrarian-distribution remain P0-open visual dispositions pending the
  exact integrated production-map review by 06. This result does not declare
  Port, Agrarian, or Frontier visual PASS.
- The standalone visual disposition also keeps primitive/blockout dominance as
  a P1 item; this pass does not replace the renderer or broadly rewrite the
  accepted kit.
- `CONTEXTUAL_DECISION_SURFACE` is P0_OPEN until the authorized contextual
  decision branch is accepted and integrated.
- Full-suite runner reliability remains limited by four Vitest worker
  `onTaskUpdate` timeouts, despite 661 reported test executions.
- Evidence is local development-server evidence only. No Sites production
  deployment was performed.
- Gate1F PASS was not declared; V02 and persistence V9 were not started.

## INTEGRATION_API

- `deriveIntegratedRegionArtPlan(model, architecture)` in
  `src/presentation/mapContent/regionCompositionIntegration.ts` resolves
  authored region roles, anchors, evidence coverage, and LOD-ready kit
  placements without mutating `WorldState`.
- `isEvidenceCoveredByRegionComposition(plan, regionId, evidenceId)` is the
  duplicate-suppression seam for legacy factual object consumers.
- `ProceduralWorldArtKitRenderer` and `PROCEDURAL_WORLD_ART_KITS` in
  `src/presentation/mapVisual/` remain the approved world-art renderer/kit
  authority.
- `deriveMapRuntimeGeometry(model)` remains the continuous shared terrain
  geometry authority.
- `deriveMapArchitecture(model)` remains the legal-owner/controller/front,
  camera, LOD, and faction-anchor authority.
- `inspectMapScreenSpaceOccupancy(input)` remains the actual projected
  screen-space occupancy inspection helper.
- `AudioManager` and `SoundCueResolver` remain presentation/ref-only audio
  seams; audio state is not placed in `WorldState` or persistence.

## FILES_OTHER_BRANCHES_MUST_NOT_OVERWRITE

- `src/app/PoliticalWorldStage.tsx`
- `src/app/App.tsx`
- `src/app/GameHeader.tsx`
- `src/presentation/mapArchitecture.ts`
- `src/presentation/mapContent/index.ts`
- `src/presentation/mapContent/regionComposition.ts`
- `src/presentation/mapContent/regionCompositionAdapter.ts`
- `src/presentation/mapContent/regionCompositionIntegration.ts`
- `src/styles/global.css`
- accepted `src/presentation/mapVisual/**` world-art kit and renderer files
- accepted `src/presentation/audio/**` and `public/assets/tmr/audio/**`
- accepted `src/presentation/design/**`, `src/app/icons/**`, and
  `public/assets/tmr/icons/**`
- `docs/parallel/evidence/p0-integration-v1-*.png`

No shared bridge document or common P0 result document was modified by this
pass. No merge to a production branch, deployment, Gate declaration, V02
start, or persistence change was performed.
