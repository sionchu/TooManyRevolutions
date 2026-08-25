# TMR Current Bridge Task

TASK_ID: F05_FIX17
STATUS: CORRECTION_AND_VERIFICATION_REQUIRED
BASE_BRANCH: master
TASK_FILE: docs/bridge/tasks/F05_FIX17.md
RESULT_PATH: docs/bridge/results/F05_FIX17_RESULT.md
REVIEW_BRANCH: f05-fix17-review
REVIEW_BASE: d3908e1f30390131e12cced6e1b80bd03c5c1a4f
REVIEW_HEAD: ce425ddc063e20186476acf9f4fcf0676e52195b

## ChatGPT review

The GitHub diff has been independently reviewed. The FIX17 architecture/scope is provisionally acceptable: static scenario authoring only, no Coup Coordination runtime state, no response action, no coup outcome writer, no T018/T021/T022/T023 behavior change, no persistence change, and no production Gate 1F coup-node content.

F05_FIX17 is not yet PASS because one correctness issue and verification remain.

## Required correction

In `assertScenarioCoupCoordinationAuthoring()`, profile uniqueness must be checked by the exact `(countryId, coupFactionId)` pair. Do not derive pair identity by joining the two IDs with a delimiter, because distinct IDs containing that delimiter can collide. Use a collision-free pair structure such as a nested map/set.

Add a focused regression test where two distinct valid pairs would collide under delimiter joining but must both be accepted. Preserve rejection of a true duplicate exact pair.

## Cleanup

Remove root `HANDOFF.md`. Update `docs/bridge/results/F05_FIX17_RESULT.md` so its publication and verification fields match reality.

## Verification

Rerun: format, typecheck, lint, build, focused FIX17 tests, full tests, inspect:t018, inspect:t024, inspect:f05, inspect:f05fix9, inspect:f05fix14, and git diff --check.

If the known Vitest process/IPC issue occurs after assertions pass, report it separately. If esbuild still cannot start, report the environment error and do not claim verification PASS.

## Completion

Commit only these FIX17 corrections/cleanup on `f05-fix17-review`, publish the updated branch to GitHub, and stop. Do not start F05_FIX18, Gate 1F PASS, or V02.
