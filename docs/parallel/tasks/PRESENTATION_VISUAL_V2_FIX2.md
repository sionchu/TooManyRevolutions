# PRESENTATION VISUAL V2 — FIX2 TYPOGRAPHY / PLAYER-COPY HARD-BAR REPAIR

Status: AUTHORIZED

Branch: `presentation-visual-v2`

Required starting implementation HEAD before this task commit: `c4d3023e25adab2097199a3ed62d6e96d49d511f`

Purpose: preserve the valid FIX1 surface architecture and map work while repairing source-level violations of the active Visual V2 hard bar. This is intentionally narrow. Do not redesign terrain, simulation, gameplay, or the four-surface architecture.

## Why FIX2 exists

External source audit of `c4d3023` confirmed that FIX1 structurally repaired the previous authority mismatches, but the final source still violates the visual hard bar before screenshot judgement can even begin.

### Confirmed hard-bar violation A — player-facing implementation terminology

`InstitutionalRoadmapPanel.tsx` still renders player-visible implementation language:

- `선행 depth {n}`
- `선택된 제도 inspector에서 확인합니다.`
- accessibility/player labels also use `inspector`

The active visual bar explicitly bans implementation/developer terminology such as `depth` from player-facing copy.

### Confirmed hard-bar violation B — essential typography below the required floor

The active visual bar requires essential player copy to be at least approximately:

- desktop: 13px
- mobile: 14px

unless the text is genuinely secondary metadata.

Current FIX1 CSS still renders essential information far below that floor, including examples such as:

- desktop roadmap node title `0.67rem` (~10.7px)
- roadmap inspector facts/section body around `0.63–0.65rem` (~10–10.4px)
- desktop Chronicle timeline title `0.76rem` (~12.2px) and detail `0.65rem` (~10.4px)
- mobile primary navigation `0.58rem` (~9.3px)
- mobile event headline/detail around `0.72rem` / `0.56rem`
- mobile Chronicle timeline title/detail around `0.70rem` / `0.60rem`

These are source facts and block external Visual PASS regardless of DOM overlap counts.

## KEEP — must not regress

Preserve from `c4d3023`:

- map / decisions / institutions / chronicle primary navigation model;
- `region` only as ephemeral map inspector state;
- Decisions separated from Institutions;
- dedicated deep Institutions surface;
- dedicated editorial Chronicle surface;
- domain lanes vertically and prerequisite progression horizontally;
- selected-policy detail surface and legitimate policy enact path;
- mixed contextual shortlist order;
- shared terrain relief, connected topology, grounded three hero roles;
- visibility budget, factual front/rebellion projection, label collision cap;
- Auto-Slow, EventStore, PoliticalProposal and WorldState authority;
- no per-Hex environment GLTF scatter and no procedural hero fallback mixing.

Do not change `src/sim/**`.

## FIX2-A — remove implementation language from player surfaces

Replace all player-visible/accessibility implementation jargon in the Institutions surface.

Required examples:

- `선행 depth 1` → `선행 1단계` or simply `1단계`
- `inspector` → `상세 정보`, `선택한 제도`, or another natural Korean player term
- `aria-label="선택된 제도 inspector"` must also be changed
- `선택된 제도 inspector에서 확인합니다.` must be natural Korean with no implementation noun

Also review the four deep-surface/player headings for awkward implementation framing. In particular, do not show phrases such as `지도에서 분리된 전체 화면` as a player-facing eyebrow. Use a game-world label or omit it.

Run a player-facing DOM/text scan for at least:

- `depth`
- `inspector`
- `simulation`
- `catalog`
- `fixture`
- raw internal IDs

Expected visible matches: 0.

## FIX2-B — typography floor

This is the main task.

### Essential-copy floors

Desktop 1440x900:

- primary navigation labels: >= 13px
- decision titles / why-now / outcome text / CTA: >= 13px, titles normally >= 15px
- Institutions node titles: >= 13px
- Institutions inspector description, facts, prerequisites, effects: >= 13px
- Chronicle event titles and descriptive text: >= 13px
- major NEWS/event headline and essential body: >= 13px

Mobile 390x844:

- primary navigation labels: >= 14px
- decision title/body/CTA: >= 14px
- Institutions node titles: >= 14px
- Institutions selected-policy essential body: >= 14px
- Chronicle event title/body: >= 14px
- major NEWS/event headline/body: >= 14px

Genuinely secondary metadata may be smaller, e.g. dates, counts, status micro-labels, eyebrow text, zoom percentage. Do not classify decision explanations, policy names, Chronicle descriptions, event descriptions, or navigation labels as metadata.

Do not solve this with browser zoom or scaling the whole app.

### Institution graph density

Increasing text size must not create clipping.

Adjust the graph layout constants and/or node composition as necessary:

- increase node width/height where needed;
- preserve domain-lane vertical grouping and prerequisite-depth horizontal ordering;
- allow horizontal pan/scroll rather than shrinking essential text;
- policy title may wrap to two lines;
- essential policy title must not use ellipsis or vertical letter stacking;
- status may remain smaller secondary metadata.

The target is not to fit the entire 24-node graph into one screen at microscopic scale. The target is a readable strategy-game progression surface.

## FIX2-C — mobile readability and controls

At 390x844 inspect the actual pixels, not just scrollWidth.

Required:

- four primary navigation labels clearly readable without microscopic type;
- decision CTA and explanation readable without zooming;
- event NEWS/rebellion copy readable;
- Institutions node titles readable at normal scale;
- Chronicle rows readable;
- no essential clipping, ellipsis, or vertical stacking;
- no CTA/playback/navigation overlap;
- no new third persistent HUD band.

If increasing font sizes causes space pressure, remove/demote secondary copy or simplify the composition instead of shrinking essential text again.

## FIX2-D — CSS discipline

Do not append another giant style layer.

Edit/merge the existing FIX1 V2 selectors in place. Remove superseded tiny-type rules where practical.

No universal rounded-card redesign. Preserve the current map-first/editorial language.

Report `global.css` additions/deletions and final line count.

## Evidence — mandatory

Capture from the final FIX2 source and OPEN each image locally before reporting:

Desktop 1440x900:

1. `docs/parallel/evidence/visual-v2-fix2-desktop-map.png`
2. `docs/parallel/evidence/visual-v2-fix2-desktop-decisions.png`
3. `docs/parallel/evidence/visual-v2-fix2-desktop-institutions.png`
4. `docs/parallel/evidence/visual-v2-fix2-desktop-chronicle.png`
5. `docs/parallel/evidence/visual-v2-fix2-desktop-rebellion.png`

Mobile 390x844:

6. `docs/parallel/evidence/visual-v2-fix2-mobile-map.png`
7. `docs/parallel/evidence/visual-v2-fix2-mobile-decisions.png`
8. `docs/parallel/evidence/visual-v2-fix2-mobile-institutions.png`
9. `docs/parallel/evidence/visual-v2-fix2-mobile-chronicle.png`
10. `docs/parallel/evidence/visual-v2-fix2-mobile-rebellion.png`

For evidence report measured computed font sizes for representative essential elements on desktop/mobile:

- primary nav label
- decision why-now/body
- decision CTA
- institution node title
- institution selected-policy body
- chronicle row title/body
- event NEWS title/body

Do not report Visual PASS yourself.

## Verification

Run:

- focused presentation/FIX tests
- `pnpm typecheck`
- `pnpm lint`
- `pnpm format`
- `pnpm build`
- `git diff --check`
- full `pnpm test` once if practical; record assertion result separately from known worker timeout

Add source-contract tests for:

- no visible `depth` / `inspector` player copy in Institutions;
- four primary nav labels still present;
- Institutions remains separated from Decisions.

## Result / stop

Write:

`docs/parallel/PRESENTATION_VISUAL_V2_FIX2_RESULT.md`

Commit and push to `presentation-visual-v2`.

**DO NOT deploy ChatGPT Sites.**

External visual review is mandatory after FIX2. Stop after push/result/evidence.

Do not start Gate1F R2 or unrelated gameplay work.
