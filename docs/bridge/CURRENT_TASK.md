# TMR Current Bridge Task

TASK_ID: F05_FIX18
STATUS: REVIEW_CORRECTION_REQUIRED
REVIEW_BRANCH: f05-fix18-review
REVIEW_BASE: 5863d46563b1d7ed6dc5d65a40e1965817662707
REVIEWED_HEAD: 46958f17803b9b7b9f748f9b11d38564fa571ed6
TASK_FILE: docs/bridge/tasks/F05_FIX18_AUTHORIZED.md
RESULT_PATH: docs/bridge/results/F05_FIX18_RESULT.md

## ChatGPT review

The runtime vertical slice is provisionally architecture-correct: explicit `COUP_COORDINATION_RESPONSE`, sparse decisive response state, authored necessary-set resolution through existing `applyConflictOutcome()`, no autonomous producer, no LandHex coup writer, and persistence V7 are all present.

One required task contract is missing before PASS.

## Required correction: rejection provenance

The authorized task requires business-invalid coup response actions to reject/no-op with repository-consistent rejection evidence. The current resolver silently `continue`s for invalid payload/schema, missing/resolved/non-coup Conflict, missing/ambiguous/invalid profile, non-required node, duplicate response, and stale final successor. The accepted ActionRecord therefore remains in history without a deterministic record of why it produced no response state.

Add the smallest repository-consistent rejection event path, analogous to existing intervention/proposal rejection evidence. Use a bounded deterministic rejection reason vocabulary covering the authorized validation cases. A rejected response attempt must:

- emit exactly one rejection event tied to the ActionRecord;
- not create or change `coupCoordinationResponses`;
- not resolve/reopen the Conflict;
- preserve global event/action sequence order;
- not add any autonomous response producer or new gameplay inference.

Add focused regression coverage for representative schema-invalid, missing/resolved/non-coup, profile/node, duplicate, and stale-successor rejections, including same-tick sequence behavior.

Then rerun format, typecheck, lint, build, focused FIX18 tests, full tests, inspect:t018, inspect:t024, inspect:f05, inspect:f05fix9, inspect:f05fix14, and `git diff --check`. Update `F05_FIX18_RESULT.md`, commit/push only this FIX18 correction to `f05-fix18-review`, and stop.

Do not start F05_FIX19, Gate 1F PASS, or V02.
