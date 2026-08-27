# PRESENTATION VISUAL V2 — FIX1 RESULT

Branch: `presentation-visual-v2`

Authority: `docs/parallel/tasks/PRESENTATION_VISUAL_V2_FIX1.md`

## Implemented

- Primary React navigation is now `지도 / 결정 / 제도 / 연대기`. `region` remains an ephemeral map inspector state; primary `국정` and `기록` tabs are removed.
- `결정` is a map-visible contextual drawer. Its first-read hierarchy is `지금 필요한 선택 → title → why-now → qualitative outcome/tradeoff → CTA`; the compact StateProject record remains a secondary disclosure.
- `제도` is a dedicated deep surface. The pure layout derives vertical PolicyDomain lanes and horizontal prerequisite depth, then assigns deterministic tracks for same-lane/same-depth nodes. Graph nodes contain only policy title and state; one selected-node inspector contains authoritative details, prerequisites, incompatibilities, rule effects and the supported enact CTA.
- `연대기` is a dedicated editorial history surface derived from EventStore/chronicle digest. The most recent major event receives lead treatment and the remaining records use a compact timeline without raw event IDs.
- Superseded roadmap percentage positioning, nested Decision roadmap styling, obsolete generic Chronicle row styling and unreachable event-row CSS were removed. `global.css` is smaller after the change.
- The accepted c1ffcba terrain, grounded hero, visibility, factual projection, label and time-flow implementation was preserved; no renderer or WorldState authority was changed.

## Browser evidence

All nine final PNGs were captured from the final local source at the requested viewport sizes and opened as local images for inspection.

| Viewport | Evidence | Observation |
|---|---|---|
| 1440x900 | `docs/parallel/evidence/visual-v2-fix1-desktop-map.png` | Map fills the primary lower surface; grounded capital, industrial and frontier hero objects, labels, map controls and four navigation tabs are visible. |
| 1440x900 | `docs/parallel/evidence/visual-v2-fix1-desktop-decisions.png` | Map remains visible beside the decision drawer; mixed shortlist starts with `지금 필요한 선택`; no institution graph is present. |
| 1440x900 | `docs/parallel/evidence/visual-v2-fix1-desktop-institutions.png` | Dedicated full surface shows 권한·소유·노동 lanes, horizontal 선행 depth columns, compact title/state nodes and a readable selected-policy inspector. |
| 1440x900 | `docs/parallel/evidence/visual-v2-fix1-desktop-chronicle.png` | Dedicated editorial surface shows a lead transition and compact 이어진 기록 timeline rather than an event-row drawer. |
| 1440x900 | `docs/parallel/evidence/visual-v2-fix1-desktop-rebellion.png` | Browser smoke reached factual 19일차 `반란 발생`; the control shows 1x automatic slowdown while the run remains playing. |
| 390x844 | `docs/parallel/evidence/visual-v2-fix1-mobile-map.png` | Mobile map keeps the map primary with compact HUD and four bottom navigation controls. |
| 390x844 | `docs/parallel/evidence/visual-v2-fix1-mobile-decisions.png` | Decisions opens as a bottom sheet; the lower map pressure/event overlays are removed from the conflicting area. |
| 390x844 | `docs/parallel/evidence/visual-v2-fix1-mobile-institutions.png` | Institutions opens as a mobile full surface with a single back-to-map target, lane graph and selectable policy nodes. |
| 390x844 | `docs/parallel/evidence/visual-v2-fix1-mobile-chronicle.png` | Chronicle opens as a mobile full surface with a crisis lead and readable editorial timeline rows. |

The Institutions browser smoke also selected a different node: the selected policy changed from `gamebuilders.policy.broad-suffrage` to `gamebuilders.policy.communal-land-ownership`, while the selected-node inspector remained rendered.

The external visual gate is intentionally left for external review; no Visual PASS is declared here.

## Verification executed

- Focused Vitest: 6 files, 24 tests passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm format`: passed; all files matched Prettier.
- `pnpm build`: passed with exit code 0. Vite emitted the repository's existing large-chunk warning for the 1,161.98 kB world asset chunk.
- `git diff --check`: passed.
- `pnpm test`: 102 of 103 test files and 710 of 711 assertions passed in the single full-suite run. The run also emitted four Vitest `onTaskUpdate` worker timeout errors and exited 1 because `src/app/iconIntegration.test.tsx` still asserted the removed `국정`/`기록` labels. That expectation was corrected; the follow-up focused run passed the wrapper test and all FIX1-focused tests (24/24). The full suite was not looped again.

## CSS diff

`src/styles/global.css` changed from 5,432 lines at the starting commit to 5,295 lines after FIX1: `842 additions / 979 deletions`, net `-137` lines.

## Deployment

ChatGPT Sites deployment was not run.

## External review boundary

This result records implementation, execution evidence and concrete screenshot observations. The external visual review remains the next gate; no production publish or Gate1F R2 work was started.
