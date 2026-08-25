# HANDOFF

## Objective

Complete the authorized `GAMEBUILDERS_PRODUCT_SURFACE_P0` task on
`gamebuilders-product-surface-p0`, then publish the updated existing ChatGPT
Site and its result document. Do not start F05_FIX18, Gate 1F, V02, or a
successor task.

## Scope

Product surface only: visual bible, stable-ID registries, replaceable assets,
real demo neighbors and political atlas, title/opening/main flow, responsive
UI, player copy, and decision presentation. Accepted FIX23 simulation and
persistence remain authoritative.

## Acceptance criteria

Follow `docs/bridge/tasks/GAMEBUILDERS_PRODUCT_SURFACE_P0.md`, including
checkpoint commits/pushes, the six responsive viewports, full verification, and
actual Sites redeploy/browser QA.

## Completed

- Confirmed nested repository and clean `gamebuilders-product-surface-p0`
  branch at accepted predecessor `ee4b282c767538c39bbf8379528d16761d3d4878`.
- Added P0-A visual bible, external reference/license audit, typed design
  tokens, screen/component registry, asset manifest, layer registry, Korean
  copy skeleton, project-authored crest/emblem SVGs, and registry tests.

## Current checkpoint

P0-A verification is in progress; no title/map/main-screen source changes have
been made yet.

## Decisions and reasons

- Keep the existing DOM/SVG renderer for P0. It is stable, readable, and avoids
  adding a renderer dependency without a measured need.
- Use project-authored vector/procedural assets and a shared
  `tmr-royal-revolution` style family. Future generated raster variants must be
  versioned and carry provenance/prompt metadata.
- Use actual ScenarioDefinition Country/Region/LandHex data for every visible
  political entity; no decorative countries or invented crisis actors.

## Verification evidence

- `pnpm run typecheck`: passed after P0-A files were added.
- Focused `designRegistry.test.ts`: passed 5/5 after formatting.
- `pnpm run build` at the accepted predecessor: passed before P0-A changes.
- License/reference evidence is recorded in `docs/GAMEBUILDERS_P0_REFERENCE_AUDIT.md`.

## Not executed

- P0-B through P0-F implementation and verification.
- Final full test/inspection suite and published Site QA.

## Blockers

None currently. The chatgpt2codex project lease did not recognize this nested
OneDrive repository, so local repository tools are being used directly while
preserving the same evidence-first workflow.

## Modified files

P0-A registry/docs/asset files listed by `git status`; no simulation files have
been changed.

## Next concrete action

Finish P0-A format/lint/full focused checks, commit and push the checkpoint,
then implement title/opening and the shared asset package.
