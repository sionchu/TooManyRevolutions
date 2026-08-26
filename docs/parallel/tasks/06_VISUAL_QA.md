# PARALLEL TASK 06 — VISUAL QA / PRODUCT AUDIT

TASK_ID: PARALLEL_06_VISUAL_QA
EXECUTION_AUTHORITY: THIS_FILE_ONLY
BASELINE: 16b3ad5b2b255e41a9b4adb73b184f8b15684939

## Critical authority rule

This is an explicitly isolated review task.

- `docs/bridge/CURRENT_TASK.md` is **NOT an executable implementation task for this branch**.
- Read it only as product context and hard-boundary reference.
- Do **NOT** implement Map Runtime, World Art, icons, audio, or Gate1F changes.
- If this file conflicts with a request in `CURRENT_TASK.md` about what to implement now, **this file wins for this parallel branch**.
- Do not update shared bridge state/result files.

## Role

VISUAL DIRECTOR + UX QA + PRODUCT QC.

This branch is review/evidence only. Production code must remain unchanged.

## Must not modify

- `src/**`
- `public/assets/**`
- `package.json` / lockfile
- GDD/architecture authority docs
- shared bridge state/result files
- production deployment

Only dedicated QA result/evidence files may be added.

## Review targets

Use the current deployed/frozen P0 visual checkpoint and available evidence. If browser access is available, perform hands-on desktop and 390×844 mobile review.

### 1. Two-second gaze order

What does the eye see first: world, HUD, text/card, or empty background?

### 2. Labels-off recognition

Without labels, can a reviewer recognize at category level:

- capital
- industrial region
- port
- frontier
- rebellion/crisis area

### 3. Spatial history

Compare Day0, rebellion/controller change, project implementing/completed, and late state. Do they read as materially different worlds without relying on Chronicle prose?

### 4. Silhouette hierarchy

Check whether the actual rendered hierarchy is:

`capital/signature > major project > POI > settlement > decorative prop`

### 5. Density and composition

Assess:

- world occupancy vs empty backdrop
- POI density
- route density
- label density/collision
- repeated primitive/blockout feel
- grounding/contact
- palette/material cohesion

### 6. Mobile

Assess first viewport world share, HUD vertical share, camera framing, tap targets, drawer obstruction, and whether it feels like a game map rather than a responsive admin page.

### 7. Anti-admin-page / anti-TMI

Flag persistent card walls, metric walls, form-control appearance, raw debug vocabulary, unnecessary exact values, and text that competes with the world.

### 8. Reference-lens audit

Use references only as principles:

- Plague Inc / Rebel Inc — persistent readable living map
- Civilization / RTK — geography/world reads before underlying grid
- HOI4 — political/front/route hierarchy
- Against the Storm — accumulated development visibly changes the world

Do not demand copied art/assets/UI.

## Verdict format

For each major criterion use:

- PASS
- PARTIAL
- FAIL

For each PARTIAL/FAIL include:

- evidence/screenshot
- exact component/surface
- player consequence
- severity P0/P1/P2
- recommended owner (`01_MAP_RUNTIME`, `02_WORLD_ART`, `03_ICON_SYSTEM`, `04_AUDIO`, `INTEGRATION`)
- concise fix direction

This task does not declare P0 product PASS or any Gate PASS.

## Result

Write only `docs/parallel/06_VISUAL_QA_RESULT.md` and dedicated evidence under `docs/parallel/evidence/06/` if needed.

Include BASE_SHA, REVIEWED_PRODUCTION_SHA, EVIDENCE, RUBRIC, TOP_BLOCKERS, OWNER_ASSIGNMENT, and INTEGRATION_ACCEPTANCE_CHECKLIST.

Commit/push review documents only, then STOP.