# P0 Integration V1 — 03 Icon UI Addendum

EXECUTION_AUTHORITY: P0_INTEGRATION_V1_SUPPLEMENT

This addendum supplements `docs/parallel/tasks/P0_INTEGRATION_V1.md` and only changes the status/integration handling of the 03 Icon track. All other authority boundaries in the main integration task remain unchanged.

## Accepted 03 UI integration

The following commit is independently QC-accepted for P0 integration:

- `9dfe81dacf0ad101b10ea7f99e0eef18d031e326` — actual player-facing semantic icon integration

It descends from the already accepted icon implementation/prep commits:

- `fef02f01eee007bd79254d41a39a736c5c3bc595`
- `f4007d6f1127641db1ad57a5d4fa71adf4cd42c8`

The accepted UI commit connects icons to:

- `ContextualDock`
- `CrisisBanner`
- `AgendaPanel`
- `DecisionCard`
- `PolicyCard`
- `ChroniclePanel`
- `DecisionPanel`
- `RegionInspector`

It also adds factual crisis-icon mapping and player-facing integration tests.

## Preserve from 03

- `TmrIcon` remains the theme-safe CSS-mask/currentColor renderer.
- Korean text labels remain beside icons; do not convert these controls to icon-only UI.
- Crisis icon choice must remain tied to actual conflict/event kind.
- Unrelated events must not receive invented crisis silhouettes.
- Policy icons remain derived from actual rule mutation semantics, with parliament as a generic fallback only when no more specific approved policy icon applies.
- Existing accessibility labels/text remain intact.
- Interactive controls touched by the icon pass retain a minimum 44px target where the accepted 03 CSS establishes it.
- R3F world landmarks remain 3D world art; do not replace map geography with CSS icons.

## Integration conflict policy

The 03 commit modifies `src/styles/global.css`, while P0 Integration V1 also owns world-first/mobile layout work. Therefore:

- Do **not** resolve a CSS conflict by blindly taking the entire 03 `global.css` or the entire integration copy.
- 03 owns icon-related variables, icon alignment, semantic icon tones, and the accepted minimum hit-target additions.
- Integration owner owns final HUD/header/map/drawer sizing, responsive composition, first-viewport world share, and overflow fixes.
- Preserve both when they do not conflict.
- If a 44px rule materially blocks the P0 world-first target, reduce surrounding padding/layout before reducing the interaction target below 44px.

For component conflicts:

- preserve integration-owned behavior/state/data flow;
- preserve 03 icon identity, factual mapping, visible Korean label, and accessibility treatment;
- never reintroduce fake crisis state merely to show an icon.

## Known P1 semantic note

The current registry has no dedicated external-war icon, so `PresentationConflict.kind === "war"` currently falls back to `crisis.civilConflict`. Because the icon is decorative and the visible text still carries the actual conflict label, this is not a P0 blocker. Record it as a P1 icon-taxonomy limitation rather than inventing a new icon during integration.

## Tests to retain/add in integrated branch

At minimum run:

- `src/app/crisisIcon.test.ts`
- `src/app/iconIntegration.test.tsx`
- icon registry / `TmrIcon` tests
- any affected component tests
- typecheck / lint / format / build / `git diff --check`

Browser QA should verify:

- Dock icons + labels on light surface
- crisis icon on crisis surface
- decision/policy CTA icon + label
- 44px minimum hit target on relevant mobile controls
- no icon-only regression
- no missing-mask/broken SVG rendering

## Integration result documentation

`docs/parallel/P0_INTEGRATION_V1_RESULT.md` must record `9dfe81dacf0ad101b10ea7f99e0eef18d031e326` as an integrated accepted 03 source commit if it is included.

Do not declare P0 PASS from this addendum. No Gate1F/V02/persistence authorization is added.
