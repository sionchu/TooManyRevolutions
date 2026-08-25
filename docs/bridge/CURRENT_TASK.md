# TMR Current Bridge Task

TASK_ID: F05_FIX17
STATUS: IMPLEMENTED_LOCALLY / AWAITING_GITHUB_REVIEW_UPLOAD
BASE_BRANCH: master
TASK_FILE: docs/bridge/tasks/F05_FIX17.md
RESULT_PATH: docs/bridge/results/F05_FIX17_RESULT.md
REVIEW_BRANCH: f05-fix17-review

## Current state

F05_FIX17 has been implemented in the active Codex Desktop local repository and reported with:

```text
PRIMARY_CLASSIFICATION: COUP_COORDINATION_AUTHORING_SEAM_IMPLEMENTED
NEXT_IMPLEMENTATION_READINESS: COUP_COORDINATION_RUNTIME_VERTICAL_SLICE
```

ChatGPT has **not** independently reviewed the actual FIX17 source diff/result on GitHub yet. Therefore F05_FIX17 is not accepted and F05_FIX18 is not authorized.

## Codex Desktop action

Do not reimplement, reset, rewrite, rebase, or force-update F05_FIX17.

Use the repository's normal Git remote. **Normal `git fetch` and `git push` are allowed and expected here.** Do not use web search, browser cache, GitHub raw URL lookup, or `git ls-remote` as a substitute for the repository remote.

If the local Bridge metadata is stale, fetch `origin/master` only to refresh the remote-tracking ref and read the latest Bridge metadata from `origin/master`. This must not merge, reset, or rewrite the completed local FIX17 implementation.

Publish the existing completed local FIX17 HEAD to the already-created GitHub review branch:

```text
f05-fix17-review
```

That branch is rooted at the reviewed F05_FIX16 predecessor `d3908e1f30390131e12cced6e1b80bd03c5c1a4f`, matching the lineage of the local FIX17 implementation. Do not merge Bridge-only master metadata into FIX17 merely to publish it.

After the review branch is published, stop. Do not start F05_FIX18, Gate 1F PASS, or V02.

## Review sequence

```text
FIX17 branch published
-> ChatGPT compares d390... to f05-fix17-review
-> ChatGPT reviews code/tests/result
-> PASS or correction
-> only then may next task be authorized
```
