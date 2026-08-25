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

- reads the repository snapshot supplied by the active Codex project/task;
- reads `STATE.md`, `CURRENT_TASK.md`, and its referenced task file;
- executes only the authorized scope and respects forbidden scope;
- writes the historical result and required bridge completion metadata;
- runs the required verification and exposes a reviewable diff/commit through
  the Codex product handoff available for that environment.

ChatGPT/user review remains the gate authority. Codex must not infer a gate pass,
change a phase from ready to started, or authorize the next major task merely
because implementation checks pass.

## Remote Codex execution policy

For Codex cloud/remote tasks, the repository snapshot supplied by the Codex
product is the execution input. **Shell `git fetch`, `git pull`, `git push`, `gh`
authentication, or direct `github.com:443` access are not prerequisites for
starting or completing the coding task.** Remote sandboxes may have network
access disabled or restricted independently of repository access provided by
the product.

Do not tell a remote Codex task to repair a stale workspace by reaching GitHub
from inside the sandbox. If the supplied snapshot does not contain the currently
authorized `CURRENT_TASK.md` or its referenced task file, that remote task was
started from a stale repository snapshot. Stop that task and start a new remote
Codex task against the current repository/branch snapshot instead of using
reset/rebase/force/fetch/pull workarounds inside the sandbox.

After execution, use the Codex product's normal review/handoff path available in
that environment (for example a reviewable diff, apply/sync flow, commit, or pull
request handoff). A shell-level `git push` is optional only when the environment
already supports it; failure or absence of shell GitHub network access is not a
code failure and must not trigger manual network workarounds.

## Local Codex execution policy

For a genuinely local Codex workspace, ordinary Git synchronization may be used
when helpful. Never reset, rebase, force-update, or discard user work merely to
match Bridge metadata. Local Git mechanics are an environment concern, not part
of the gameplay task's acceptance criteria.

## Task cycle

Before execution, Codex confirms that the supplied repository snapshot contains
the authorized `CURRENT_TASK.md` and referenced task file, then executes that
task only. Exact SHA matching is not a universal prerequisite for remote Codex;
the task may name a reviewed predecessor for architecture provenance without
requiring shell network synchronization.

After execution, Codex writes
`docs/bridge/results/<TASK_ID>_RESULT.md`, updates the required active bridge
metadata, runs verification, and inspects the final diff/status. Historical task
and result files remain audit records; explicit task IDs such as `F05_FIX17` are
used for later cycles.

Future long prompts should normally be committed under `tasks/`; manual
copy/paste is a fallback. ChatGPT should author new tasks from the latest GitHub
state it can inspect.

## Handoff policy

Each executable task chooses an execution/handoff policy.

- `REMOTE_HANDOFF_ON_PASS`: preferred for Codex cloud/remote. Implement and
  verify in the product-provided repository snapshot, then expose the completed
  change through the product's normal review/handoff path. Do not require shell
  GitHub network access.
- `COMMIT_AND_PUSH_ON_PASS`: use only in an environment already known to have
  working Git credentials and network access.
- `LEAVE_REVIEWABLE_DIFF`: implement and verify without committing when manual
  review of the working tree is intentionally desired.

The policy never expands authorized scope and never permits Codex to create the
next major task.
