# TMR Last Bridge Result

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

## Outcome

F05_FIX12 implemented the smallest static scenario-owned authoring seam for
`FUND_MOVEMENT`. `FactionFundMovementTemplate` carries an explicit Faction,
single Region target, and scenario-authored resource amount through the
optional `ScenarioDefinition.factionFundMovementTemplates` field. Static
validation rejects missing IDs, foreign-owner Regions, invalid amounts, and
duplicate Faction profiles. Existing scenarios without the field remain
unchanged.

No runtime action schema, commitment state, resource writer, consequence,
Agenda reader, territory/outcome path, or persistence field was added.

## Outcome fields

PRIMARY_CLASSIFICATION: FUND_MOVEMENT_AUTHORING_SEAM_IMPLEMENTED
AUTHORING_SCOPE: STATIC_SCENARIO_ONLY
AUTHORING_TYPE: FactionFundMovementTemplate
SCENARIO_FIELD: factionFundMovementTemplates
TARGET_DOMAIN: REGION_SINGLE
TARGET_INFERENCE: FORBIDDEN
AMOUNT_OWNERSHIP: SCENARIO_AUTHORED
AMOUNT_DEFAULT: NONE
AMOUNT_DERIVATION: NONE
STATIC_AMOUNT_VALIDATION: Number.isFinite(resourceAmount) && resourceAmount > 0; current resource feasibility deferred to runtime
PROFILE_UNIQUENESS: at most one profile per factionId; duplicate rejected
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

## Verification

- `pnpm install --frozen-lockfile` — PASS
- focused `src/sim/state/scenario.test.ts` — 13/13 PASS
- `pnpm run format` — PASS
- `pnpm run typecheck` — PASS
- `pnpm run lint` — PASS
- `pnpm run build` — PASS
- `pnpm run inspect:f05` — exit 0; `MIXED_GAP`, `F05 RECOMMENDATION: NOT_READY`
- `pnpm run inspect:f05fix9` — exit 0; `LATE_STEADY_STATE_MIXED_CAUSE`,
  historical baseline unchanged, Gate 1F not ready, V02 not started
- `pnpm run inspect:f05fix10` — exit 0; `FUND_MOVEMENT` selected at 372/372,
  structural diagnosis unchanged, Gate 1F not ready, V02 not started
- `pnpm run inspect:t024` — 1/1 PASS; snapshot version 4 and roundtrip/replay
  checks unchanged, Gate 1V not started
- `pnpm test` — 57 files / 460 assertions passed; exit 1 from the known 3
  `[vitest-worker]: Timeout calling "onTaskUpdate"` runner errors
- `git diff --check` — PASS

## Completion boundary

`F05_FIX12` is complete and awaits ChatGPT review. `Gate 1F` remains `NOT_READY`,
`V02` remains `NOT_STARTED`, and `F05_FIX13` is not authorized.
