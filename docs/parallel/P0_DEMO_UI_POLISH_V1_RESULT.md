# P0 Demo UI Polish V1 Result

BRANCH: `parallel-p0-demo-ui-polish-v1`

AUTHORITY: `docs/parallel/tasks/P0_DEMO_UI_POLISH_V1.md`

BASE_SHA: `e521961e25e4b20c70245137216c80a103120420`

AUTHORIZED_HEAD_AT_START: `963829ec0191f2634cdcbb0e99300f0382f2f212`

IMPLEMENTATION_COMMIT_SHA: `aaf7929975b4135c0d8d04a715fd7a040d987277`

## SCOPE

This pass keeps the existing simulation, data semantics, action catalog,
candidate selection, map renderer, 3D assets, and audio internals unchanged.
It changes only the player-facing composition and presentation density of the
existing contextual surfaces.

No `App.tsx`, `PoliticalWorldStage.tsx`, `src/sim/**`, map runtime, world-art,
audio, bridge documentation, or production deployment was changed.

## IMPLEMENTED

- Agenda cause values and consolidation conditions are now behind native
  `왜 그런가` / support disclosures. The agenda headline, qualitative severity,
  trend, place, and map action remain on the default surface.
- Decision cards lead with the intervention name, qualitative resource/effect
  summary, a collapsed `왜 그런가 · 세부 조건` disclosure, and one clear CTA.
  Exact treasury, duration, effect, observation, and trade-off evidence remains
  available inside the existing details surface.
- Policy cards use the same WHY disclosure treatment without changing policy
  content or mutation semantics.
- Roadmap, state-project, and current institution-rule content is optional
  support content instead of a stack of equally weighted cream cards.
- Existing TmrIcon IDs and Korean labels remain in place. No emoji or text glyph
  was introduced as a production icon.
- Drawer presentation is world-first: desktop drawer width is capped at
  `min(360px, 24vw)` with a `300px` floor, and mobile uses a bounded bottom
  sheet with the map remaining visible above it.
- Primary action buttons, WHY disclosures, drawer close, and mobile playback /
  manual-progress controls retain 44px minimum interaction dimensions. CTA
  contrast uses the existing surface tone variables and does not rely on red
  alone for crisis meaning.

## CHANGED_FILES

- `src/app/AgendaPanel.tsx`
- `src/app/DecisionCard.tsx`
- `src/app/DecisionPanel.tsx`
- `src/app/PolicyCard.tsx`
- `src/app/iconIntegration.test.tsx`
- `src/styles/global.css`
- `docs/parallel/evidence/p0-demo-ui-polish-v1-desktop-default.png`
- `docs/parallel/evidence/p0-demo-ui-polish-v1-desktop-agenda.png`
- `docs/parallel/evidence/p0-demo-ui-polish-v1-desktop-decisions.png`
- `docs/parallel/evidence/p0-demo-ui-polish-v1-desktop-rebellion-decisions.png`
- `docs/parallel/evidence/p0-demo-ui-polish-v1-mobile-default.png`
- `docs/parallel/evidence/p0-demo-ui-polish-v1-mobile-agenda.png`
- `docs/parallel/evidence/p0-demo-ui-polish-v1-mobile-decisions.png`
- `docs/parallel/P0_DEMO_UI_POLISH_V1_RESULT.md`

## BROWSER_EVIDENCE

Evidence was captured from the local development server at the requested
desktop and mobile viewport sizes and visually inspected.

- Desktop default, 1440×900: world stage `1367.41×790px`; no contextual drawer.
- Desktop agenda and decisions, 1440×900: drawer `345.59px` wide; map remains
  the persistent main surface.
- Desktop rebellion + decisions, 1440×900: actual day-30 crisis banner uses
  `tmr.icon.crisis.rebellion`, measures `480×75.78px`, and has `0px²` overlap
  with the drawer.
- Mobile default, 390×844: world stage `390×658.31px`; horizontal overflow is
  false and the bottom context tabs remain available.
- Mobile agenda and decisions, 390×844: bottom sheet
  `357.41×432px`; the map remains visible above the sheet. The first decision
  CTA is `300.64×44px` and is fully inside the sheet.
- Drawer close, action CTA, WHY disclosures, and mobile playback/manual
  controls measured at 44px minimum height; drawer close measured 44×44px.

SCREENSHOT_PATHS:

- `docs/parallel/evidence/p0-demo-ui-polish-v1-desktop-default.png`
- `docs/parallel/evidence/p0-demo-ui-polish-v1-desktop-agenda.png`
- `docs/parallel/evidence/p0-demo-ui-polish-v1-desktop-decisions.png`
- `docs/parallel/evidence/p0-demo-ui-polish-v1-desktop-rebellion-decisions.png`
- `docs/parallel/evidence/p0-demo-ui-polish-v1-mobile-default.png`
- `docs/parallel/evidence/p0-demo-ui-polish-v1-mobile-agenda.png`
- `docs/parallel/evidence/p0-demo-ui-polish-v1-mobile-decisions.png`

## TEST_RESULTS

- `pnpm run format` — PASS.
- Targeted Vitest (`iconIntegration`, `mapFirstComposition`,
  `tmrIconRenderer`) — PASS, 3 files and 12 tests.
- `pnpm run typecheck` — PASS.
- `pnpm run lint` — PASS.
- `pnpm run build` — PASS; Vite transformed 163 modules. The existing large
  JavaScript chunk warning remains.
- `git diff --check` — PASS.
- Full-suite test run — NOT_RUN in this pass.

## KNOWN_LIMITATIONS

- Browser evidence is local development-server evidence only; no production
  deployment was performed.
- The Vite build still reports the existing post-minification chunk-size
  warning (`index` JavaScript bundle approximately 1.55 MB).
- This task does not make a P0 gate decision and does not declare Gate1F PASS.
  V02 and persistence V9 were not started.

## HANDOFF

The integration point is the existing `ContextualDock` drawer composition. The
next integrator can consume the changed components and the screenshot paths
without changing simulation or map runtime code. Final commit and push SHA are
reported by the task handoff after the repository commit is created.
