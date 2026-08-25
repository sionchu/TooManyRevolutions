# TMR Current Bridge Task

TASK_ID: F05_FIX18
STATUS: AUTHORIZED
BASE_BRANCH: master
TASK_FILE: docs/bridge/tasks/F05_FIX18.md
RESULT_PATH: docs/bridge/results/F05_FIX18_RESULT.md

## Accepted predecessor

F05_FIX17 was completed in the active local Codex workspace and reported as:

```text
PRIMARY_CLASSIFICATION: COUP_COORDINATION_AUTHORING_SEAM_IMPLEMENTED
NEXT_IMPLEMENTATION_READINESS: COUP_COORDINATION_RUNTIME_VERTICAL_SLICE
```

The local implementation workspace is expected to already contain the FIX17 static authoring seam. Do not recreate or reset it.

## Mission

F05_FIX18 implements the minimal Coup Coordination runtime vertical slice:

```text
explicit COUP_COORDINATION_RESPONSE ActionRecord
-> sparse decisive node response state
-> deterministic node-response event provenance
-> authored necessary-set evaluation
-> existing applyConflictOutcome() sink
-> statusQuo OR nonterminal governmentTransition OR remain active
-> strict persistence V7 / replay
```

`uncommitted` means absence of an accepted decisive response; it is not a stored progress value.

## Hard boundaries

- no autonomous node-response producer in this task;
- no random/timer/score/majority/weighted coup resolution;
- no scalar or label inference of node alignment;
- no fake coup LandHex front/writer;
- no direct Government mutation outside existing conflict-outcome sink;
- no coup State Dissolution writer;
- no T021/T022/T023 semantic changes;
- no rebellion implementation;
- no FUND_MOVEMENT extension;
- no Gate 1F PASS;
- no V02;
- no F05_FIX19 self-authorization.

## Codex Desktop execution

Read this file and `docs/bridge/tasks/F05_FIX18.md` from GitHub as the task authority, then implement in the current local `TooManyRevolutions` workspace.

The local copy of `docs/bridge/CURRENT_TASK.md` does **not** need to be current and is not an execution gate. Do not run shell `git fetch`, `git pull`, exact-SHA synchronization, reset, rebase, or force merely to mirror Bridge metadata locally.

If the local workspace contains the completed FIX17 authoring types, proceed directly. If the expected FIX17 authoring seam is absent, stop and report `BLOCKED_MISSING_FIX17_AUTHORING_SEAM` rather than reimplementing FIX17.

Execute only `docs/bridge/tasks/F05_FIX18.md`.
