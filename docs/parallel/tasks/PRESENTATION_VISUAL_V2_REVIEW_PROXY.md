# PRESENTATION VISUAL V2 — REVIEW PROXY TASK

Status: AUTHORIZED

Branch: `presentation-visual-v2-review-evidence`

Base product commit: `0615bad2dcc5c591aaa013a651e10eb3157cde78`

Purpose: create tiny, lossily-compressed visual-review proxies from the exact FIX2 evidence screenshots so ChatGPT can fetch the entire base64 payload from GitHub and reconstruct/open the pixels locally. This is evidence packaging only. Do not edit product source, tests, gameplay, CSS, terrain, simulation, or original screenshots.

## Source screenshots

Use these exact files as inputs:

- `docs/parallel/evidence/visual-v2-fix2-desktop-map.png`
- `docs/parallel/evidence/visual-v2-fix2-desktop-decisions.png`
- `docs/parallel/evidence/visual-v2-fix2-desktop-institutions.png`
- `docs/parallel/evidence/visual-v2-fix2-desktop-chronicle.png`
- `docs/parallel/evidence/visual-v2-fix2-mobile-decisions.png`

Do not recapture, redraw, crop, annotate, sharpen, recolor, or otherwise change composition. Only resize + lossy-compress the exact committed source pixels.

## Output

Create directory:

`docs/parallel/evidence/review-proxy/`

Create exactly these five proxy images:

- `desktop-map.webp`
- `desktop-decisions.webp`
- `desktop-institutions.webp`
- `desktop-chronicle.webp`
- `mobile-decisions.webp`

### Proxy constraints

- preserve complete frame and aspect ratio; no crop
- WebP RGB
- desktop initial max width: 480 px
- mobile initial max width: 220 px
- each output MUST be <= 5,500 bytes
- if quality reduction alone cannot reach <= 5,500 bytes without obvious total corruption, reduce dimensions stepwise; desktop minimum width 320 px, mobile minimum width 170 px
- use a deterministic script/command locally, but do not commit a new utility unless genuinely necessary
- proxy is for composition/art-direction inspection; original committed screenshots remain authoritative for exact text and measurements

## Manifest

Create:

`docs/parallel/evidence/review-proxy/MANIFEST.md`

For each proxy record:

- exact source path
- source Git blob SHA (use `git ls-tree HEAD <path>` or equivalent)
- source byte size
- proxy path
- proxy pixel dimensions
- proxy byte size (must be <= 5500)
- proxy SHA-256
- statement that operation was resize/compress only, no crop/recomposition/annotation

Also record:

- base product commit `0615bad2dcc5c591aaa013a651e10eb3157cde78`
- review branch name
- `git diff --name-only 0615bad2..HEAD`

The final diff from `0615bad2` must contain ONLY this task document, the five proxy images, and `MANIFEST.md`.

## Verification

Before commit:

1. Open all five proxies locally and confirm they are recognizable and preserve the whole source frame.
2. Confirm every proxy is <= 5,500 bytes.
3. Confirm image dimensions/aspect ratio are correct and no crop occurred.
4. Confirm `git diff --name-only 0615bad2..HEAD` contains no `src/**`, no package files, no original evidence modification.

Commit and push to `presentation-visual-v2-review-evidence`, then STOP.

Do not deploy Sites. Do not modify `presentation-visual-v2`. Do not declare Visual PASS.