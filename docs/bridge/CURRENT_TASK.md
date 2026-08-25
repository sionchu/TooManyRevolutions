# TMR Current Bridge Task

TASK_ID: F05_FIX21
STATUS: AUTHORIZED
BASE_IMPLEMENTATION_HEAD: 510e971f38b52343055285a585d851a5baae283f
BASE_IMPLEMENTATION_BRANCH: f05-fix20-review
REVIEW_BRANCH: f05-fix21-review
TASK_FILE: docs/bridge/tasks/F05_FIX21.md
RESULT_PATH: docs/bridge/results/F05_FIX21_RESULT.md

## Accepted predecessor

```text
F05_FIX20: COMPLETE / REVIEWED / PASS / ACCEPTED
PRIMARY_CLASSIFICATION: REBELLION_PERSISTENCE_AND_SETTLEMENT_REQUIRE_SEPARATE_DOMAINS
EXISTING_BEHAVIOR_CLASSIFICATION: PARTIAL_BUT_INCOMPLETE
NEXT_IMPLEMENTATION_READINESS: REBELLION_DOMAIN_SPLIT_REQUIRED
PERSISTENCE_FORMAT: V7_UNCHANGED
```

## Mission

F05_FIX21 is docs-only Rebellion Domain Split Design.

Design two separate minimum domains:

```text
A. rebellion operational persistence
B. settlement / demobilization / suppression closure
```

Specify static/runtime/action/event ownership, writer boundaries, coexistence rules, replay requirements, and implementation ordering precisely enough for the next task to implement the first seam without inventing semantics.

The expected preferred direction is the smallest defensible authoring-first seam, but Codex must justify the result rather than force it.

## Execution

Codex Desktop should read `docs/bridge/tasks/F05_FIX21.md` from GitHub and continue from the accepted FIX20 lineage.

The GitHub review branch `f05-fix21-review` already exists at accepted FIX20 head `510e971f38b52343055285a585d851a5baae283f`.

Create only the required design/result documents, publish them to `f05-fix21-review`, and stop for ChatGPT review.

## Hard boundaries

- no `NO_ACTIVE_FRONT_EDGE -> peace`;
- no `0 faction LandHex -> defeat`;
- no free LandHex writer;
- no generic rebellion persistence/strength/progress/suppression score;
- no hidden scalar threshold or automatic decay;
- no random/timer/countdown/cooldown resolution;
- no direct Conflict delete or State Dissolution writer;
- no settlement acceptance = automatic completed peace shortcut;
- no production source/test change;
- no persistence V8;
- no Gate 1F PASS or V02;
- no F05_FIX22 self-authorization.
