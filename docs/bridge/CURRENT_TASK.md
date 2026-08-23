# TMR Current Bridge Task

TASK_ID: F05_FIX3

STATUS: AUTHORIZED

BASE_BRANCH: master

BASE_COMMIT: dda5949ba70165dd65ac86c48561d82f69b3a375

BASE_COMMIT_NOTE: This commit added the immutable `docs/bridge/tasks/F05_FIX3.md` task. A newer HEAD is allowed only when commits after this base are ChatGPT-authored Bridge authorization updates to `docs/bridge/STATE.md` and/or this `CURRENT_TASK.md`. Before execution, run `git fetch origin`, verify the diff contains no gameplay/source change, and then `git pull --ff-only`.

TASK_FILE: docs/bridge/tasks/F05_FIX3.md

COMMIT_POLICY: COMMIT_AND_PUSH_ON_PASS

COMMIT_POLICY_NOTE: PASS means the rejected continuity writer was removed correctly, verification passed, and the exact F05 remeasurement is truthful. It does NOT mean Gate 1F passed or V02 may start. A truthful `GATE1F_RECOMMENDATION: NOT_READY` is fully acceptable.

AUTHORIZED_SCOPE:

- remove only the F05_FIX2 unresolved-internal-rebellion weekly `stateContinuity` decrement writer
- remove/retire its config/function/conflict-phase invocation and tests that require the rejected behavior
- correct current Architecture prose so internal rebellion displacement alone does not drain state continuity
- preserve historical F05_FIX2 and F05_FIX2_R result/review artifacts
- add focused regression tests proving no elapsed-week continuity decay / dissolution from internal rebellion displacement alone
- preserve typed non-terminal `governmentTransition` semantics without automatic successor selection
- preserve F04B strength-qualified recovery and LandHex authority
- rerun the unchanged F05 36-branch / five-year matrix
- compare F05_FIX1 vs rejected-writer F05_FIX2 vs post-removal F05_FIX3
- report any returning late steady state honestly; do not repair it in this task
- create `docs/F05_GATE1F_REPAIR3_REMOVE_CONTINUITY_WRITER.md`
- write `docs/bridge/results/F05_FIX3_RESULT.md`
- update `docs/bridge/LAST_RESULT.md` and completion state

EXTERNAL_REFERENCE_GUARDRAIL:

- REQUIRED: read `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`
- REQUIRED: use repository contracts and F04C-R mechanism-first grounding first
- no new external research is expected merely to remove a writer already rejected by repository-grounded review
- do not gather references to invent a replacement mechanic
- if future continuity or successor-resolution evidence is missing, report and defer it
- War as Politics, Fantasy institutional politics, and Gate 1V visual reference work remain out of scope

FORBIDDEN_SCOPE:

- replacement continuity decay or restoration
- generic sovereignty/continuity meter
- T023 threshold changes
- automatic revolutionary succession / Government creation
- intervention, faction, crisis, or conflict rebalance
- F05 scenario changes or readable-arc threshold tuning to force a pass
- free LandHex transfer / direct crisis deletion / hidden comeback state / direct outcome scripting
- chapters / revolution phases / countdowns / permanence timers / filler events
- RNG added merely to manufacture diversity
- elections / parties / coalitions
- full labor bargaining
- transitional justice
- military factions
- local autonomy
- War as Politics
- fantasy / arcane institutions
- V02 / renderer / UI
- strategic AI / MCTS / runtime LLM
- self-authorizing Gate 1F PASS, Gate 1V, V02, or another follow-up task

EXPECTED_OUTPUT:

- rejected writer fully removed with no replacement shortcut
- current Architecture matches state-continuity contract
- focused regression evidence for no displacement-only continuity decay
- exact unchanged F05 matrix rerun
- WAIT / accommodation / meaningful-response classifications
- trajectory diversity and causal readability
- old/new major-event and reassessment silence
- readable-arc status by context
- terminal/consolidation outcome comparison
- explicit remaining blocker classification
- `GATE1F_RECOMMENDATION: PASS | PASS_WITH_NOTES | NOT_READY`
- one narrow next recommendation at most, without implementation

STARTUP / FRESHNESS CHECK:

```bash
git status
git fetch origin
git rev-parse HEAD
git rev-parse origin/master
git pull --ff-only
```

Do not treat an unfetched local `origin/master` as current GitHub state.

VERIFICATION:

- preferred Node 24.19.0 / pnpm 11.19.0; if Node 24 is unavailable, record exact runtime and still run full verification
- `pnpm install --frozen-lockfile`
- `pnpm run format`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run build`
- `pnpm run inspect:t024`
- `pnpm run inspect:f01`
- `pnpm run inspect:f04b`
- `pnpm run inspect:f04d`
- `pnpm run inspect:f05`
- focused tests for rejected-writer absence/current semantics
- `pnpm test`
- `git diff --check`

RESULT_PATH: docs/bridge/results/F05_FIX3_RESULT.md

ON_COMPLETION:

- update Bridge to `F05_FIX3: REPAIR_COMPLETE / AWAITING_CHATGPT_REVIEW` or truthful blocked state
- set `NEXT_AUTHORIZED_TASK_ID: NONE`
- set `NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW`
- set `CURRENT_TASK_FILE: NONE`
- keep `V02: NOT STARTED`
- commit/push if the task itself is correct and verification passes
- do not implement the next pacing/continuity/succession fix
- do not declare Gate 1F passed

Execute only the immutable task file referenced above.
