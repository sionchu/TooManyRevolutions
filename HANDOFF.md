# HANDOFF

## Objective

Complete the authorized `GAMEBUILDERS_PRODUCT_SURFACE_P0` task with the
mandatory gameplay-reality addendum, then publish the final result and Site
evidence. Do not start F05_FIX18, Gate 1F PASS, V02, or a successor task.

## Scope

Map-first product surface plus the minimal demo runtime/presentation seams
required to make simulation changes player-observable: proposal carry,
existing ideology diffusion, authoritative LandHex controller map marks,
persistent active conflicts, significant EventStore feedback, real policy
actions, consolidation blockers, compact decision UX, and the deterministic
Player-Observable Dynamics Audit. Persistence remains SerializedSnapshotV8.

## Completed

- Re-read the authoritative gameplay-reality addendum from `origin/master`.
- Added the `DemoRuntimeState` action-proposal carry loop without changing the
  simulation or persistence schema.
- Enabled the existing ideology diffusion phase hook and authored real
  neighboring ideology gradients.
- Added authored scenario territory for a legible map: 20 LandHexes total and
  12 initial player-controlled Hexes, with no runtime fake territory writer.
- Rendered actual LandHex controllers separately from legal owner wash, plus
  ideology, pressure, active conflict, capital, and controller facts.
- Added EventStore significant-event projection, actual policy catalog choices,
  consolidation checklist blockers, and compact decision disclosure.
- Added focused tests and the Day 0/30/90/180/360/720/1080
  Player-Observable Dynamics Audit.
- Ran full local verification, including the existing F05/F05_FIX9/F05_FIX14
  diagnostics and T018/T021/T024/V01 inspections.
- Updated the result document with the gameplay matrix and measured audit.

## Current checkpoint

Local implementation and verification are complete. The working tree contains
the runtime/presentation changes, focused tests, scenario authoring, and final
result documentation. The next authorized action is to commit and push this
checkpoint, package the exact pushed source, redeploy the existing Site, and
run deployed desktop/mobile QA through Day 1080 and beyond Day 1000.

## Verification evidence

- `pnpm run format:write`: PASS
- `pnpm run format`: PASS
- `pnpm run typecheck`: PASS
- `pnpm run lint`: PASS
- `pnpm run build`: PASS; 108 Vite modules
- Focused gameplay suite: 5 files / 25 tests PASS
- Player-Observable Dynamics Audit: PASS at all required checkpoints
- 20-year horizon audit: 5 trajectory tests PASS
- Full suite: 72 files / 586 assertions PASS; process exit 1 from four
  Vitest worker `onTaskUpdate` RPC timeouts after assertions passed
- V01, T018, T021, T024 inspections: PASS
- F05, F05_FIX9, F05_FIX14 diagnostics: PASS as diagnostics; F05 remains
  NOT_READY and F05_FIX15 is not authorized
- `git diff --check`: PASS

## Decisions and boundaries

- The map remains the continuous main playfield; context is drawer/sheet UX.
- Only existing authoritative simulation state/event channels are presented.
- Scenario expansion is authored data for readable controller changes, not a
  runtime state mutation or fake front.
- No persistence schema change, solver, timer/cooldown/countdown, V9, Gate 1F,
  V02, F05_FIX18, or deeper F05 operational work.
- Existing design/asset/layer registries and prior P0 commits are preserved.

## Modified files

Runtime/presentation: `src/app/App.tsx`, `src/app/demoGame.ts`,
`src/app/PoliticalAtlas.tsx`, `src/app/CrisisBanner.tsx`,
`src/app/gamePresentation.ts`, `src/presentation/presentationState.ts`,
`src/sim/state/action.ts`, `src/sim/state/policy.ts`, and the compact decision,
policy, consolidation, and time-control components/styles.

Tests/audit: `src/app/demoGame.test.ts`,
`src/app/demoHorizonAudit.test.ts`, `src/app/gameplayReality.test.ts`,
`src/app/playerObservableDynamicsAudit.ts`,
`src/app/playerObservableDynamicsAudit.test.ts`, and
`src/sim/state/gameBuildersDemoScenario.test.ts`.

Docs: `docs/bridge/results/GAMEBUILDERS_PRODUCT_SURFACE_P0_RESULT.md` plus
the earlier P0 art/reference/shot-list documents.

## Next concrete action

Commit and push the current checkpoint, package/deploy the exact pushed source
through the existing Sites project, perform public desktop/mobile hands-on QA
at Day 0/30/90/180/360/720/1080 and >1000 days, append the deployment and QA
evidence, commit/push the final result update, and stop.
