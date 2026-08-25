# F05_FIX17 Codex Handoff

## Objective

Complete the F05_FIX17 Coup Coordination static authoring seam in the nested
`TooManyRevolutions` repository and leave a verifiable local handoff.

## Scope

Only the static authoring contract is in scope:

- `CoupCoordinationNodeId`.
- `CoupCoordinationNodeDefinition` and `CoupCoordinationProfile`.
- Optional `ScenarioDefinition` node/profile fields.
- Static scenario validation and focused tests.
- F05_FIX17 design and result documentation.

Runtime alignment, response actions, coup outcome writers, Government
transition producers, T018/T021/T022/T023 changes, persistence changes,
FUND_MOVEMENT changes, Gate 1F, V02, and F05_FIX18 are outside this handoff.

## Acceptance criteria

- Reject duplicate node IDs, unknown Countries, blank node names, unknown or
  cross-country Factions, Factions without `coup` capability, duplicate
  profiles, empty or duplicate required-node entries, unknown or foreign
  required nodes, unknown or foreign successor Governments, and a successor
  equal to the initial current Government.
- Treat `requiredNodeIds` as an unordered explicit necessary set without
  majority, quorum, weight, score, timer, cooldown, or countdown semantics.
- Keep absent and empty authoring fields runtime-equivalent and keep
  `SerializedSimulationSnapshotV6` unchanged.

## Completed

- Existing F05_FIX17 implementation was reviewed and preserved.
- Focused authoring tests cover valid data, invalid references, capability
  provenance, order-independent required sets, and runtime-field absence.
- `docs/bridge/results/F05_FIX17_RESULT.md` contains the required
  classification and verification boundary.
- Final local implementation/documentation commit is
  `dbe41766dea27ff7bd8ae00aeb8fb21b74d537b5`; the handoff is preserved in
  `49d97dc3bbad93ea0b88315d94f9da2c7a14e985`.

## Current checkpoint

- Nested repository: `<LOCAL_USER_HOME>\OneDrive\Documents\ChatGPT\Game-TMR\TooManyRevolutions`.
- `HEAD`: `49d97dc3bbad93ea0b88315d94f9da2c7a14e985`.
- `origin/master`: `d3908e1f30390131e12cced6e1b80bd03c5c1a4f`.
- The worktree is clean after the handoff update.
- No `git fetch`, `git pull`, or `git push` was run for this handoff.
- `docs/bridge/CURRENT_TASK.md` still describes F05_FIX16; this run followed
  the explicit user instruction to execute F05_FIX17. It specifies
  `TASK_FILE: NONE`, and `docs/bridge/tasks/F05_FIX17.md` is absent; neither
  bridge task metadata nor a new task file was created.

## Decisions and reasons

- Preserve the existing local F05_FIX17 commits; no reset, rebase, force, or
  reconstruction was used.
- Keep required-node ordering non-semantic; only duplicate membership is
  rejected.
- Keep the authoring fields on `ScenarioDefinition` and do not copy them into
  `WorldState` or persistence.
- Do not self-authorize F05_FIX18, Gate 1F PASS, or V02.

## Verification evidence

- `pnpm run format` — PASS.
- `pnpm run typecheck` — PASS.
- `pnpm run lint` — PASS.
- `git diff --check` — PASS on the reviewed repository diff.
- Compiled static validator/runtime diagnostic — PASS, 17 checks covering the
  requested rejection matrix, required-set permutation, absent/empty runtime
  equality, and runtime field absence. Details are in the F05_FIX17 result.

## Not executed

- `pnpm run build` reached the `tsc -b` stage, then stopped during Vite config
  loading.
- Focused Vitest and full `pnpm test` did not reach assertions.
- F05_FIX18, Gate 1F PASS, and V02 were not started.
- GitHub synchronization commands were not executed, per instruction.

## Blockers

The local Vite/Vitest runner cannot resolve the checkout config through the
installed esbuild under the current execution sandbox:

```text
Cannot read directory "../../../../..": Access is denied.
Could not resolve ...\\TooManyRevolutions\\vite.config.ts / vitest.config.ts
```

This is a tool/runtime startup failure, not a test assertion failure.

## Modified files

- `src/sim/index.ts`
- `src/sim/state/ids.ts`
- `src/sim/state/scenario.ts`
- `src/sim/state/coupCoordination.ts`
- `src/sim/state/coupCoordination.test.ts`
- `docs/F05_FIX17_COUP_COORDINATION_AUTHORING_SEAM.md`
- `docs/bridge/results/F05_FIX17_RESULT.md`
- `HANDOFF.md`

## Next concrete action

When the local Vite/Vitest execution environment is available, rerun the
focused test, full test, and build verification. Keep F05_FIX18, Gate 1F PASS,
and V02 outside the next action until explicit review authorizes them.
