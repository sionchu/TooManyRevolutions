# TMR Current Bridge Task

TASK_ID: F05_FIX18
STATUS: AUTHORIZED
BASE_IMPLEMENTATION_HEAD: 5863d46563b1d7ed6dc5d65a40e1965817662707
BASE_IMPLEMENTATION_BRANCH: f05-fix17-review
REVIEW_BRANCH: f05-fix18-review
TASK_FILE: docs/bridge/tasks/F05_FIX18_AUTHORIZED.md
RESULT_PATH: docs/bridge/results/F05_FIX18_RESULT.md

## Accepted predecessor

```text
F05_FIX17: COMPLETE / REVIEWED / PASS / ACCEPTED
PRIMARY_CLASSIFICATION: COUP_COORDINATION_AUTHORING_SEAM_IMPLEMENTED
NEXT_IMPLEMENTATION_READINESS: COUP_COORDINATION_RUNTIME_VERTICAL_SLICE
```

## Mission

Implement only the minimal Coup Coordination runtime vertical slice:

```text
COUP_COORDINATION_RESPONSE
-> sparse decisive node response state
-> deterministic ActionRecord/GameEvent provenance
-> authored necessary-set evaluation
-> existing applyConflictOutcome()
-> statusQuo / nonterminal governmentTransition / remain active
-> strict persistence V7 / replay closure
```

No autonomous response producer is authorized in F05_FIX18.

## Execution

Codex Desktop should read `docs/bridge/tasks/F05_FIX18_AUTHORIZED.md` from GitHub and continue from the reviewed local FIX17 implementation lineage.

The expected implementation base is `5863d46563b1d7ed6dc5d65a40e1965817662707`. The GitHub review branch `f05-fix18-review` already exists at that exact head.

Do not recreate FIX17. Do not merge Bridge-only master metadata into the implementation merely to read this task. Normal Git remote use is allowed; no reset/rebase/force.

Publish the completed FIX18 implementation/result to `f05-fix18-review` and stop for ChatGPT review.

## Hard boundaries

- no random/timer/score/majority/weighted coup resolution;
- no scalar/label/territory inference of node alignment;
- no fake coup LandHex writer;
- no direct Government writer outside existing conflict outcome sink;
- no coup State Dissolution writer;
- no rebellion implementation;
- no FUND_MOVEMENT extension;
- no Gate 1F PASS;
- no V02;
- no F05_FIX19 self-authorization.

Execute only `docs/bridge/tasks/F05_FIX18_AUTHORIZED.md`.
