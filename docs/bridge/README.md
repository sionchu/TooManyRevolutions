# TMR ChatGPT ↔ Codex GitHub Bridge

This directory is the live GitHub-first handoff between ChatGPT and Codex Desktop.

## Authority order

1. Actual repository source, tests, diffs, and Git history
2. `docs/bridge/STATE.md`
3. Current/historical Bridge task and result files
4. Older conversation context

Bridge files are development metadata only. Simulation/runtime code must never depend on `docs/bridge/*`.

## Normal workflow

```text
ChatGPT writes the authorized task to GitHub
-> user opens a Codex Desktop chat
-> Codex reads the GitHub Bridge task through the repository's normal Git remote
-> Codex implements/tests in the active local TooManyRevolutions repository
-> Codex commits and pushes/publishes the implementation/result to GitHub
-> user reports completion
-> ChatGPT reviews the actual GitHub diff/tests/result
-> ChatGPT decides PASS/REJECT
-> only after PASS may ChatGPT authorize the next task
```

## Roles

ChatGPT:

- authors the next task on GitHub;
- reviews actual repository evidence after Codex publishes it;
- decides gate status and next authorization.

Codex Desktop:

- reads the currently authorized GitHub task;
- implements only that task in the active local repository;
- runs required verification;
- writes the result document;
- commits and publishes the implementation/result to GitHub for review;
- never self-authorizes the next task.

## Git handling

**Normal repository Git operations are allowed.** In particular, `git fetch` may be used to refresh remote-tracking refs and `git push` may be used to publish completed work. Do not disable these operations by default.

When local Bridge metadata is stale, prefer refreshing `origin/master` and reading the Bridge task from that remote-tracking ref. A fetch does not require merging the remote branch into the current implementation branch.

Do not make pull/merge/exact-SHA matching a universal prerequisite for starting implementation, and do not reset, rebase, force-update, or discard user work merely to synchronize Bridge metadata.

Do not fall back to web search, browser cache, raw GitHub URL lookup, or `git ls-remote` when the normal repository remote can provide the Bridge files.

The important completion condition is that the actual implementation/result becomes reviewable on GitHub. If master cannot accept the local implementation as a fast-forward because Bridge-only metadata advanced independently, publish the implementation on a dedicated review branch rooted at the reviewed predecessor instead of rewriting either history.

## Review gate

A Codex-reported classification is provisional until ChatGPT can inspect the GitHub implementation diff and result evidence.

No successor task may be authorized before the predecessor is independently reviewed and accepted.
