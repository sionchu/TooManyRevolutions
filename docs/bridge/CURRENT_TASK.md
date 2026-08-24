# TMR Current Bridge Task

TASK_ID: F05_FIX12
STATUS: AUTHORIZED
BASE_BRANCH: master
TASK_COMMIT: 56127d84219be61996000ce03d43c31bd63abc3d
STATE_ACTIVATION_COMMIT: d7952584396d0a5dd1211b0892d68de33f6e7de7
TASK_FILE: docs/bridge/tasks/F05_FIX12.md
COMMIT_POLICY: COMMIT_AND_PUSH_ON_PASS
RESULT_PATH: docs/bridge/results/F05_FIX12_RESULT.md

## Mission summary

F05_FIX11 is reviewed/accepted as `FUND_MOVEMENT_REQUIRES_NEW_AUTHORING_SEAM`.

F05_FIX12 must close that seam. There are only two valid outcomes:

```text
FUND_MOVEMENT_AUTHORING_SEAM_IMPLEMENTED
FUND_MOVEMENT_AUTHORING_SEAM_REJECTED_FOR_GATE1F
```

No third "needs more grounding" outcome is allowed.

If implementable, add only the smallest static scenario-owned authoring contract needed to express:

```text
explicit Faction
+ FUND_MOVEMENT
+ explicit single Region target
+ explicit faction-resource amount
```

The amount has no default and no state-derived formula. The target is never inferred.

If this cannot be represented cleanly without violating TMR architecture, reject FUND_MOVEMENT as the current Gate 1F interaction-coverage remedy.

## Allowed implementation

Static scenario/content schema and validation only, for example a narrow FUND_MOVEMENT-specific authoring type and optional `ScenarioDefinition` field.

Focused schema/validation tests are allowed.

Existing scenarios with no authoring record must remain behaviorally unchanged.

## Forbidden implementation

- no `FactionActionPayload` runtime schema change;
- no ActionRecord target/amount payload yet;
- no heuristic target/amount selection;
- no commitment WorldState;
- no resource debit/reserve/earmark writer;
- no commitment lifecycle/resolver/events;
- no Agenda reader/change;
- no faction scalar consequence;
- no T018/T021 consequence;
- no Conflict/LandHex/continuity/terminal change;
- no generic political/mobilization/effort meter;
- no cooldown/countdown;
- no second LOBBY/BARGAIN/ORGANIZE expansion;
- no chooser rewrite;
- no War-as-Politics, V02/UI, runtime LLM/solver;
- no Gate 1F PASS or F05_FIX13 self-authorization.

Persistence remains V4.

## Closure requirements

If implemented, static validation must cover at minimum:

- unknown Faction rejection;
- unknown Region rejection;
- invalid/non-positive/non-finite amount rejection;
- duplicate/ambiguous profile rejection;
- accepted valid profile;
- deterministic behavior;
- absence of the field preserves all existing scenarios.

Prefer at most one FUND_MOVEMENT authoring record per Faction in v1 unless current repository evidence proves another equally deterministic rule.

No actual Gate 1F target/amount content value is required in this task. Synthetic test values must not become defaults or production balance claims.

## Required primary classification

Exactly one:

```text
FUND_MOVEMENT_AUTHORING_SEAM_IMPLEMENTED
FUND_MOVEMENT_AUTHORING_SEAM_REJECTED_FOR_GATE1F
```

Required readiness:

```text
NEXT_IMPLEMENTATION_READINESS:
  TARGETED_COMMITMENT_VERTICAL_SLICE
  NONE
```

## Required documents

- `docs/F05_FIX12_FUND_MOVEMENT_AUTHORING_SEAM.md`
- `docs/bridge/results/F05_FIX12_RESULT.md`

## Repository-root / Codex Desktop freshness guard

The real repository is the nested `TooManyRevolutions` directory.

If the parent `Game-TMR` shows `TooManyRevolutions/` as untracked, first:

```bash
cd TooManyRevolutions
```

Never modify the parent empty repository.

Because Codex Desktop threads may use isolated worktrees, use this order:

```text
1. externally synchronize the real nested repo
2. verify master SHA
3. start a fresh Codex thread/worktree
4. verify fresh HEAD and origin/master
5. execute F05_FIX12
```

Do not reset/rebase an old stale Codex worktree to bypass freshness.

Before execution verify:

```bash
git status
git rev-parse HEAD
git rev-parse origin/master
```

Proceed only when the working tree is clean and both SHAs equal the exact current GitHub master activation SHA supplied by ChatGPT/user.

## Verification

Follow the immutable task, including at minimum:

```bash
pnpm install --frozen-lockfile
pnpm run format
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm run inspect:f05
pnpm run inspect:f05fix9
pnpm run inspect:f05fix10
# focused F05_FIX12 tests if code is added
pnpm test
git diff --check
```

Report the known Vitest `onTaskUpdate` IPC issue separately if assertions pass but the runner exits non-zero.

## Completion

On completion:

- `F05_FIX12: COMPLETE / AWAITING_CHATGPT_REVIEW` or truthful blocked state;
- `LAST_COMPLETED_TASK_ID: F05_FIX12`;
- `NEXT_AUTHORIZED_TASK_ID: NONE`;
- `NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW`;
- `CURRENT_TASK_FILE: NONE`;
- keep Gate 1F `NOT_READY`;
- keep V02 `NOT STARTED`;
- do not implement runtime commitment behavior;
- do not authorize F05_FIX13.

Execute only `docs/bridge/tasks/F05_FIX12.md`.
