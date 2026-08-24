# TMR Bridge Result — F05_FIX10

TASK_ID: F05_FIX10

STATUS: COMPLETE / AWAITING_CHATGPT_REVIEW

START_BRANCH: master

START_COMMIT: c05704eda14916897bfa2f52b731aebef82c37aa

BASE_TASK_COMMIT: 2789279f7ecead1852e325a5a0c19a59e3a3df74

IMPLEMENTATION_COMMIT: DEVELOPER_ONLY_INSPECTION_AND_DESIGN_DOCUMENTATION

PRODUCTION_GAMEPLAY_CHANGE: NONE

## Required result fields

PRIMARY_CLASSIFICATION: COVERAGE_REQUIRES_ACTION_SCHEMA_TARGETING

ACTIVE_CONFLICT_TRACK: DEFERRED_BY_GROUNDING_GATE

OUTCOME_TRACK: DEFERRED_BY_CONTINUITY_EVIDENCE

SECOND_LOBBY_REACHABILITY: NOT_REACHABLE

FUND_MOVEMENT_REACHABILITY: REACHABLE

ORGANIZE_REACHABILITY: NOT_REACHABLE

SELECTED_ACTION: FUND_MOVEMENT

TARGET_OBJECT_REQUIRED: YES

ACTION_SCHEMA_CHANGE_REQUIRED: YES

COMMITMENT_MODEL_STATUS: DESIGNABLE_AFTER_ACTION_SCHEMA_TARGETING

MAGNITUDE_GROUNDING_STATUS: BLOCKED_NO_AUTHORED_MAGNITUDE

PERSISTENCE_IMPLICATION: FUTURE_VERSION_REQUIRED_IF_COMMITMENT_STATE_IS_ADDED

HISTORICAL_F05_BASELINE: UNCHANGED

F05_FIX9_DIAGNOSIS: UNCHANGED

VITEST_RUNNER_STATUS: ASSERTIONS_PASS_RUNNER_IPC_ERROR

GATE1F_RECOMMENDATION: NOT_READY

V02: NOT_STARTED

## Measured late-state coverage

The developer-only inspection replays the six exact F05_FIX9 branches with
seed `40103` and records the late interval at every monthly political boundary
for both participating Factions. It produced 372 expanded faction-boundary
rows, 186 for each Faction. Every row remained in the measured blocker state:
an active conflict was present and the Country-controlled LandHex count was
zero.

| Selection / gate | Measured result |
| --- | ---: |
| LOBBY selected | 0 / 372 |
| Hypothetical additional LOBBY selection | 0 / 372 |
| ORGANIZE selected | 0 / 372 |
| FUND_MOVEMENT selected | 372 / 372 |
| First winning chooser guard FUND_MOVEMENT | 372 / 372 |
| Relevant Regions | `ideology-fixture.capital`, `ideology-fixture.industrial` |

`pressFreedom=censored` made LOBBY unavailable in the observed rows. The
existing chooser nevertheless selects FUND_MOVEMENT before ORGANIZE or LOBBY
at every row, so no threshold, priority, legal rule, or proposal template was
changed and no second LOBBY template was added.

## Causal and architecture decision

The active-conflict track remains deferred by the War-as-Politics grounding
gate. F04B/T021's existing recovery seam is narrow and requires an active
rebellion, a valid same-Country Government, affected-Region state control, and
an existing advantage margin. F05_FIX10 found no proof of a missing writer and
does not alter front, combat, recovery, coup, LandHex, or conflict semantics.

The outcome track remains deferred by continuity evidence. F05_FIX2_R and the
T022/T023 contracts still distinguish Government defeat or zero Country
LandHexes from State Dissolution, and F05_FIX10 changes no continuity writer,
threshold, successor Government, or terminal rule.

FUND_MOVEMENT is the only naturally selected interaction direction, but the
current `FactionActionPayload` is only `{ factionId }`. Two relevant Regions
are visible and T021's grounded local mobilization is Region-scoped; choosing
one target silently would invent semantics. The action also lacks an
actor-owned commitment, explicit cost/opportunity reservation, authored
magnitude, natural repeat limit, and persistent lifecycle. Therefore the
selected next direction is the schema/targeting seam, not a production
consequence.

The design-only contract is recorded in
`docs/FACTION_INTERNAL_COMMITMENT_KERNEL.md`. It defines the minimum future
grammar from an accepted ActionRecord through an explicit target, an
actor-owned commitment, cost/opportunity reservation, bounded resolution, an
existing consumer, and player-visible reassessment. No authoritative
commitment state, resolver, resource debit, scalar effect, event, persistence
field, proposal, BARGAIN, ORGANIZE consequence, or LOBBY template was added.

Detailed selection audit: `docs/F05_FIX10_STRUCTURAL_REMEDY_SELECTION.md`

## Verification

- `pnpm install --frozen-lockfile` — PASS
- `pnpm run format` — PASS
- `pnpm run typecheck` — PASS
- `pnpm run lint` — PASS
- `pnpm run build` — PASS
- `pnpm run inspect:f05` — PASS / existing F05 recommendation `NOT_READY`
- `pnpm run inspect:f05fix8lifecycle` — PASS
- `pnpm run inspect:f05fix8audit` — PASS / zero unresolved classifications
- `pnpm run inspect:f05fix9` — PASS / prior mixed-cause diagnosis unchanged
- `pnpm run inspect:f05fix10` — PASS / classification and counts above
- Focused F05_FIX10 Vitest — 1 test and 1 assertion passed; Vitest emitted one known `[vitest-worker]: Timeout calling "onTaskUpdate"` runner/IPC error
- `pnpm test` — 57 files and 449 assertions passed; Vitest emitted three known `[vitest-worker]: Timeout calling "onTaskUpdate"` runner/IPC errors and exited non-zero for runner reporting
- `git diff --check` — PASS after documentation update

The runner/IPC errors are reported separately from assertion outcomes and are
not treated as a gameplay repair target.

## Completion boundary

F05_FIX10 does not approve Gate 1F, start V02, or authorize F05_FIX11. The
Bridge state is left awaiting ChatGPT review.
