# Presentation RE0 World V1 Result

Date: 2026-08-27

Branch: `parallel-presentation-re0-world-v1`

Execution authority: `docs/parallel/tasks/PRESENTATION_RE0_WORLD_V1.md`

Common visual authority: `docs/bridge/tasks/PRODUCT_PRESENTATION_RE0_VISUAL_BAR.md`

## Implemented

- Removed `TerrainDetail` and integrated `renderTerrainPlacement` rendering from the normal world composition. The production scene no longer places repeated tree, rock, or mountain GLTF instances per LandHex in default or medium presentation.
- Reduced the integrated world layer to three evidence-backed strategic hero groups: one capital, one industrial, and one frontier landmark. The rendered set uses resolved KayKit GLTF assets only.
- Removed the legacy procedural settlement, POI, institution, and project landmark render paths from the world scene. The remaining procedural renderer is limited to state feedback for a faction banner.
- FIX1 removed the global terrain-mesh convex hull and terrain-kind aggregation from the renderer. Geography is now drawn from each `runtimeGeometry.worldSurfaces` component, and terrain treatment is drawn from each `runtimeGeometry.terrainSurfaces` component. The surfaces use smoothed boundaries, translucent materials, and no outlines so component edges do not become Hex seams.
- Kept the quieter terrain palette, subdued routes, and less dominant political surfaces. The runtime still retains the authoritative LandHex topology and shared terrain mesh data.
- Kept Hex interaction geometry invisible by default. Context geometry is emitted only for selected Hex interaction, while controller/front feedback remains state-driven.
- Reduced default and medium landmark-family selection to strategic silhouettes and made non-player capital labels near-only. Near/focus remains available for readable labels and political detail.
- Adjusted the camera elevation, material lighting, fog, and contact shadows so the capital remains the dominant landmark without becoming a giant object.

## Browser visual evidence and judgement

Screens were opened and judged in the in-app Browser after the implementation, using actual rendered views rather than test output.

| View | Rendered evidence | Visual judgement |
| --- | --- | --- |
| Desktop default, 1440x900 | `presentation-re0-world-v1-fix1-desktop-default.png`; `medium`, day 0, 6 connected world surfaces, 18 connected terrain surfaces, 4 labels, 3 strategic hero groups, 3 rendered integrated placements, 0 medium environment props, 0 procedural landmarks, procedural fallback `false`, terrain detail `hidden` | The global bridge is absent: separate runtime components remain separate, while each visible component has a softened boundary with no Hex outline. Capital is the dominant hero; industrial and frontier are subordinate. |
| Desktop labels off, 1440x900, `?mapLabels=0` | `presentation-re0-world-v1-fix1-desktop-labels-off.png`; `medium`, label count `0`, same 6/18/3/3/0/0 composition counters | The component-based geography remains readable without text and does not depend on labels to communicate the world surface. |
| Desktop active rebellion/front, 1440x900 | `presentation-re0-world-v1-fix1-desktop-rebellion.png`; day 60, front count `1`, faction banner anchors `1`, label count `5`, 6/18 connected surface counts | The active crisis overlay and front feedback become visible while the separate geography components remain underneath. Hex/boundary feedback appears in the active state rather than the default state. |
| Desktop near/focus, 1440x900 | `presentation-re0-world-v1-fix1-desktop-near.png`; focus `ideology-fixture.capital`, zoom `1.68`, LOD `near`, 22 labels, 3 strategic hero groups, 0 medium environment props, 0 procedural landmarks | Focus reveals local labels and political detail without reintroducing terrain prop repetition, a global blob, or procedural landmark clutter. |
| Mobile default, 390x844 | `presentation-re0-world-v1-fix1-mobile-default.png`; world share `0.741`, LOD `near`, 6/18 connected surface counts, 3 strategic hero groups, 0 medium environment props, 0 procedural landmarks; body scroll width/height `375/882`, document client width/height `375/844` | The fitted map remains legible in the narrow viewport and keeps the capital/industrial read. The shared shell still exposes a vertical scrollbar in this base `e57a208` view; UI/global.css/App were intentionally left untouched by FIX1. |

The inspected default and medium composition contains three landmark groups: capital, industrial, and frontier. No environment object competes with the capital because no environment prop is rendered in that composition. The unresolved port remains label/coast-facts-only; no unsupported port model was introduced. No per-Hex tree, rock, or mountain GLTF is rendered.

## Automated verification

- Focused map/world tests: `6` files passed, `32` tests passed, including the component-rendering source contract.
- Typecheck: `pnpm run typecheck` completed successfully.
- Lint: `pnpm run lint` completed successfully.
- Formatting: targeted Prettier check completed successfully for all changed world-renderer files.
- Production build: `pnpm run build` completed successfully, including the Vite build and Sites worker generation. Vite emitted its existing large-chunk advisory; it did not fail the build.
- Whitespace check: `git diff --check` completed successfully before result-file creation; it is rerun before commit.
- The full simulation/inspection suite was not run because this slice does not modify `src/sim/**`; the task authority permits focused map/world verification for that case.

## Remaining weaknesses

- Connected component surfaces are intentionally presentation-only; they communicate the supplied geography without inventing bridges between disconnected runtime components.
- The near view exposes more labels and political surfaces by design, so it is denser than the default world read.
- Port hero art remains unresolved and is represented only by truthful coast/label data.
- The base `e57a208` shared shell has a mobile scrollbar; this FIX1 did not modify the prohibited UI/global.css/App surfaces.

No deployment or hosting action was performed.
