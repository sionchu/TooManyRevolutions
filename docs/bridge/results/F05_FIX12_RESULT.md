# F05_FIX12 Result

TASK_ID: F05_FIX12
STATUS: COMPLETE / AWAITING_CHATGPT_REVIEW
START_BRANCH: master
START_COMMIT: 5828dda5834a7cb037c7b83b9e44820192fc73bb
BASE_TASK_COMMIT: 56127d84219be61996000ce03d43c31bd63abc3d
TASK_RESULT_COMMIT: PENDING_FINAL_COMMIT
END_COMMIT: PENDING_FINAL_COMMIT
COMMIT_POLICY: COMMIT_AND_PUSH_ON_PASS
COMMIT_CREATED: PENDING
PUSHED: PENDING

## Outcome fields

```text
PRIMARY_CLASSIFICATION: FUND_MOVEMENT_AUTHORING_SEAM_IMPLEMENTED
AUTHORING_SCOPE: STATIC_SCENARIO_ONLY
AUTHORING_TYPE: FactionFundMovementTemplate
SCENARIO_FIELD: factionFundMovementTemplates
TARGET_DOMAIN: REGION_SINGLE
TARGET_INFERENCE: FORBIDDEN
AMOUNT_OWNERSHIP: SCENARIO_AUTHORED
AMOUNT_DEFAULT: NONE
AMOUNT_DERIVATION: NONE
STATIC_AMOUNT_VALIDATION: Number.isFinite(resourceAmount) && resourceAmount > 0; no current Faction.resources comparison
PROFILE_UNIQUENESS: at most one FactionFundMovementTemplate per factionId; duplicate factionId rejected
RUNTIME_ACTION_SCHEMA_CHANGE: NO
AUTHORITATIVE_COMMITMENT_STATE: NO
RUNTIME_RESOURCE_WRITER: NO
PERSISTENCE_FORMAT: V4_UNCHANGED
HISTORICAL_F05_BASELINE: UNCHANGED
F05_FIX9_DIAGNOSIS: UNCHANGED
F05_FIX10_REACHABILITY: UNCHANGED
F05_FIX11_GROUNDING: UNCHANGED
NEXT_IMPLEMENTATION_READINESS: TARGETED_COMMITMENT_VERTICAL_SLICE
GATE1F_RECOMMENDATION: NOT_READY
V02: NOT_STARTED
```

## Implemented files

- `src/sim/state/scenario.ts` — added the optional specialized static
  authoring type/field and deterministic validation.
- `src/sim/state/scenario.test.ts` — added 13 focused schema/validation tests.
- `docs/F05_FIX12_FUND_MOVEMENT_AUTHORING_SEAM.md` — records the contract and
  authority boundary.

No production scenario profile, runtime action payload, commitment state,
resource writer, Agenda reader, consequence, or persistence field was added.

## Verification

Commands executed in the nested `TooManyRevolutions` repository:

- `git status`, `git rev-parse HEAD`, `git rev-parse origin/master` — clean;
  both initial SHAs were `5828dda5834a7cb037c7b83b9e44820192fc73bb`.
- `git pull --ff-only` — already up to date.
- `pnpm install --frozen-lockfile` — PASS.
- `pnpm exec vitest run src/sim/state/scenario.test.ts --reporter=verbose` —
  13/13 tests PASS.
- `pnpm run format` — PASS.
- `pnpm run typecheck` — PASS.
- `pnpm run lint` — PASS.
- `pnpm run build` — PASS.
- `pnpm run inspect:f05` — exit 0; existing `MIXED_GAP` diagnosis and
  `F05 RECOMMENDATION: NOT_READY` retained.
- `pnpm run inspect:f05fix9` — exit 0; existing
  `LATE_STEADY_STATE_MIXED_CAUSE`, historical baseline unchanged,
  `GATE1F_RECOMMENDATION: NOT_READY`, and `V02: NOT_STARTED` retained.
- `pnpm run inspect:f05fix10` — exit 0; `FUND_MOVEMENT_REACHABILITY: 372/372`,
  selected action and structural diagnosis unchanged, `GATE1F_RECOMMENDATION:
  NOT_READY`, and `V02: NOT_STARTED` retained.
- `pnpm run inspect:t024` — 1/1 PASS; snapshot version 4 and roundtrip/replay
  checks unchanged, Gate 1V not started.
- `pnpm test` — 57 test files / 460 assertions passed. The process exited 1
  because of the repository's known 3 `[vitest-worker]: Timeout calling
  "onTaskUpdate"` runner errors; assertion status and runner status are
  recorded separately as required.
- `git diff --check` — PASS.

## Completion boundary

F05_FIX12 is complete and awaits ChatGPT review. Gate 1F remains not ready,
V02 remains not started, and F05_FIX13 is not authorized. The next readiness is
only the separately authorized targeted commitment vertical slice.
