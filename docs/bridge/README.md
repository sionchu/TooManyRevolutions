# TMR ChatGPT ↔ Codex GitHub Bridge

This directory is the live, GitHub-first handoff between ChatGPT and Codex. It
automates transport of task authorization and execution evidence; it does not
replace repository evidence or product judgment.

## Authority order

1. Actual repository source, tests, diffs, and Git history
2. `docs/bridge/STATE.md`
3. Current and historical bridge task/result files
4. Historical handoffs and older conversation context

Bridge files are development metadata. Simulation code must never read
`docs/bridge/*`, and these files must not become build or runtime dependencies.

## Roles

ChatGPT:

- reviews repository and result evidence;
- explains results to the user in Korean;
- decides whether a gate passes and which task comes next;
- writes the next authorized task and active pointer to GitHub.

Codex:

- pulls the latest authorized branch;
- reads `STATE.md`, `CURRENT_TASK.md`, and its referenced immutable task file;
- validates `TASK_ID`, `BASE_BRANCH`, and `BASE_COMMIT` before work;
- executes only `AUTHORIZED_SCOPE` and respects `FORBIDDEN_SCOPE`;
- writes the historical result, refreshes `LAST_RESULT.md`, and updates task
  status in `STATE.md`;
- verifies the result and commits/pushes only when the task policy permits it.

ChatGPT/user review remains the gate authority. Codex must not infer a gate pass,
change a phase from ready to started, or authorize the next major task merely
because implementation checks pass.

## Task cycle

Before execution, Codex must confirm the repository root, inspect `git status`,
run `git pull --ff-only`, read the bridge state and current task, validate branch
and base commit, and read `docs/bridge/tasks/<TASK_ID>.md`. If local changes block
the pull, Codex must not reset or blindly stash them. If the branch or commit does
not match, Codex must refuse the stale task unless the task explicitly permits a
newer fast-forward state and explains why.

After execution, Codex writes
`docs/bridge/results/<TASK_ID>_RESULT.md`, updates `LAST_RESULT.md`, updates only
the completed task status in `STATE.md`, runs the required verification, and
inspects the final diff/status. Historical task and result files are immutable;
use explicit IDs such as `F05_REVIEW` or `F05_FIX1` for later cycles. The active
pointer files may be replaced each cycle.

Future long prompts should normally be committed under `tasks/`; manual
copy/paste is a fallback. ChatGPT should base each new task on the latest remote
commit.

## Commit policy

Each executable task chooses one policy; neither is globally hardcoded.

- `COMMIT_AND_PUSH_ON_PASS`: Codex may implement, verify, write the result,
  commit, push, and report the final hash.
- `LEAVE_REVIEWABLE_DIFF`: Codex implements and verifies locally, writes the
  result, and leaves all changes uncommitted and unpushed for review.

The policy never expands authorized scope and never permits Codex to create the
next major task.
