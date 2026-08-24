# TMR Current Bridge Task

TASK_ID: F05_FIX10
STATUS: AUTHORIZED
BASE_BRANCH: master
TASK_COMMIT: 2789279f7ecead1852e325a5a0c19a59e3a3df74
STATE_ACTIVATION_COMMIT: 1e68f9fc9389348c97780e36dbfabd28c0dad7a2
TASK_FILE: docs/bridge/tasks/F05_FIX10.md
COMMIT_POLICY: COMMIT_AND_PUSH_ON_PASS
RESULT_PATH: docs/bridge/results/F05_FIX10_RESULT.md

## Mission summary

F05_FIX9 is reviewed/accepted as `LATE_STEADY_STATE_MIXED_CAUSE` with no production bug repair. F05_FIX10 must select the next interaction-coverage slice without changing War/outcome semantics or inventing scalar consequences.

Required order:

1. classify ACTIVE_CONFLICT_EQUILIBRIUM as currently implementable or deferred by the War-as-Politics grounding gate;
2. classify OUTCOME_ELIGIBILITY_STALEMATE against F05_FIX2_R continuity evidence;
3. audit actual late-state action reachability;
4. measure whether a second LOBBY demand would ever be naturally selected;
5. audit `FUND_MOVEMENT` first and `ORGANIZE` second for an explicit internal commitment grammar;
6. select exactly one next-slice classification or truthful NONE/grounding block;
7. do not implement the selected production consequence in F05_FIX10.

The immutable task file contains the full authorized/forbidden scope and is authoritative for execution.

## Key constraints

- No production consequence for `FUND_MOVEMENT` or `ORGANIZE`.
- No new numeric cost/effect/duration/conversion ratio.
- No heuristic threshold/action-priority rewrite to force LOBBY.
- Do not filter unimplemented actions merely to force the chooser down to LOBBY.
- No second LOBBY proposal template in this task.
- No BARGAIN/counteroffer/settlement implementation.
- No new proposal subject.
- No direct faction scalar effect from an action label.
- No crisis/territory/continuity/terminal shortcut.
- No War-as-Politics implementation.
- No V02/UI.
- No self-authorized Gate 1F PASS or follow-up task.

## Required primary classification

Exactly one:

```text
COVERAGE_NEXT_SLICE_FUND_MOVEMENT_INTERNAL_COMMITMENT
COVERAGE_NEXT_SLICE_ORGANIZE_INTERNAL_COMMITMENT
SECOND_LOBBY_REACHABLE_AND_SUFFICIENT
COVERAGE_REQUIRES_ACTION_SCHEMA_TARGETING
COVERAGE_INSUFFICIENT_GROUNDING
```

## Required documents

- `docs/F05_FIX10_STRUCTURAL_REMEDY_SELECTION.md`
- `docs/FACTION_INTERNAL_COMMITMENT_KERNEL.md` only if an internal-action slice is selected/designable
- `docs/bridge/results/F05_FIX10_RESULT.md`

## Repository-root guard

The real repository is the nested `TooManyRevolutions` directory.

If Codex starts in parent `Game-TMR` and `TooManyRevolutions/` appears untracked:

```bash
cd TooManyRevolutions
```

before any Git or task work. Never commit/reset/configure the parent empty repository.

## Freshness

Preferred:

```bash
git status
git fetch origin
git rev-parse HEAD
git rev-parse origin/master
git pull --ff-only
```

If outbound HTTPS is unavailable in Codex, do not create a branch/reset/rebase to bypass it. The task may proceed only after the user/ChatGPT externally synchronizes the real nested repository and confirms the current GitHub `master` SHA, with:

```text
working tree clean
HEAD == origin/master == confirmed GitHub master
CURRENT_TASK = F05_FIX10
```

If those conditions are not all true, stop and report freshness failure.

## Verification

Follow the immutable task, including:

```bash
pnpm install --frozen-lockfile
pnpm run format
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm run inspect:f05
pnpm run inspect:f05fix8lifecycle
pnpm run inspect:f05fix8audit
pnpm run inspect:f05fix9
# focused F05_FIX10 inspection/test if added
pnpm test
git diff --check
```

If the known Vitest `[vitest-worker]: Timeout calling "onTaskUpdate"` runner/IPC error reproduces after all assertions pass, report runner status separately. Do not modify gameplay to address it.

## Completion

On completion:

- `F05_FIX10: COMPLETE / AWAITING_CHATGPT_REVIEW` or truthful blocked result;
- `LAST_COMPLETED_TASK_ID: F05_FIX10`;
- `NEXT_AUTHORIZED_TASK_ID: NONE`;
- `NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW`;
- `CURRENT_TASK_FILE: NONE`;
- `GATE1F_CHATGPT_DECISION: NOT_READY`;
- `V02: NOT STARTED`;
- do not implement the selected next slice;
- do not authorize F05_FIX11.

Execute only `docs/bridge/tasks/F05_FIX10.md`.
