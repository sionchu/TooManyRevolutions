# TMR Current Bridge Task

TASK_ID: F05_FIX20
STATUS: AUTHORIZED
BASE_IMPLEMENTATION_HEAD: e300fb2e51435e0f1eeedc1c2dd3db006ac0c08e
BASE_IMPLEMENTATION_BRANCH: f05-fix19-review
REVIEW_BRANCH: f05-fix20-review
TASK_FILE: docs/bridge/tasks/F05_FIX20.md
RESULT_PATH: docs/bridge/results/F05_FIX20_RESULT.md

## Accepted predecessor

```text
F05_FIX19: COMPLETE / REVIEWED / PASS / ACCEPTED
PRIMARY_CLASSIFICATION: COUP_RESPONSE_SOURCE_EXTERNAL_INPUT_ONLY_AT_CURRENT_SCOPE
NEXT_IMPLEMENTATION_READINESS: EXPLICIT_RESPONSE_INPUT_INTEGRATION_ONLY
PERSISTENCE_FORMAT: V7_UNCHANGED
```

FIX19 establishes that the current coup path has no grounded autonomous response producer and therefore does not by itself repair Gate 1F pacing.

## Mission

F05_FIX20 is docs-only research/architecture grounding for rebellion persistence and settlement.

Determine why an already-active rebellion can persist, transform, or end when it has no active territorial front edge and/or no faction-controlled LandHex. Separate political eligibility, non-territorial operational persistence, territorial control/fronts, suppression/defeat, negotiated settlement, demobilization, and temporary front absence.

Do not implement runtime state, actions, settlement writers, persistence V8, Gate 1F PASS, or V02.

## Execution

Codex Desktop should read `docs/bridge/tasks/F05_FIX20.md` from GitHub and continue from the accepted FIX19 lineage.

The GitHub review branch `f05-fix20-review` already exists at accepted FIX19 head `e300fb2e51435e0f1eeedc1c2dd3db006ac0c08e`.

Create only the required grounding/result documents, publish them to `f05-fix20-review`, and stop for ChatGPT review.

## Hard boundaries

- no `NO_ACTIVE_FRONT_EDGE -> peace`;
- no `0 faction LandHex -> defeat`;
- no free LandHex writer;
- no random/timer/countdown/cooldown resolution;
- no generic hidden insurgency/suppression score;
- no direct Conflict deletion or State Dissolution writer;
- no LLM direct mutation;
- no production source/test change;
- no persistence V8;
- no F05_FIX21 self-authorization.
