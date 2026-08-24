# TMR Current Bridge Task

TASK_ID: F05_FIX9
STATUS: AUTHORIZED
BASE_BRANCH: master
BASE_COMMIT: 44ceebcd29d1374f4e9f7f74f61d99f511c4c021

BASE_COMMIT_NOTE: This commit added the immutable `docs/bridge/tasks/F05_FIX9.md` task. A newer HEAD is allowed only when commits after this base are ChatGPT-authored Bridge activation/current-task updates under `docs/bridge/STATE.md` and/or this `CURRENT_TASK.md`. Before execution, run `git fetch origin`, verify post-base changes are Bridge-only authorization changes, and then `git pull --ff-only`.

TASK_FILE: docs/bridge/tasks/F05_FIX9.md
COMMIT_POLICY: COMMIT_AND_PUSH_ON_PASS

COMMIT_POLICY_NOTE: PASS means the post-interaction late steady state is causally audited across the required representative branches, the freeze-point writer/consumer chain is explicit, perturbation probes are truthful, and any implementation (if one exists) is limited to one proven bug in an already-authorized existing seam. A diagnosis-only result is a valid PASS. It does NOT mean Gate 1F passed.

AUTHORIZED_SCOPE:

- accept F05_FIX8 as reviewed/accepted
- enumerate all proposal-enabled branches with post-intervention late silence >720 days
- select early / near / recovery-if-applicable / absolute-worst representatives
- capture intervention completion, last reassessment, monthly/weekly silent-boundary, and final-horizon authoritative snapshots
- audit faction adaptation/F04A/T016, proposal lifecycle, T017/T018, F04B/T021, T022/T023, Agenda and player response feasibility
- produce a causal freeze graph for each representative branch
- run developer-only single-input perturbation probes using existing authoritative fields only
- classify each branch and the overall cause using the exact labels in the immutable task
- preserve historical 36-branch F05 and F05_FIX8 lifecycle semantics
- preserve the 108 proposal-enabled population for diagnosis
- create `docs/F05_FIX9_LATE_STEADY_STATE_AUDIT.md`
- write `docs/bridge/results/F05_FIX9_RESULT.md`
- if and only if a proven narrow existing consumer/writer bug meets every implementation gate, repair at most one seam and create `docs/F05_GATE1F_REPAIR9_LATE_STEADY_STATE.md`
- update Bridge completion state

FORBIDDEN_SCOPE:

- new proposal subjects/templates or additional interaction content
- BARGAIN/counteroffers/full settlement
- new FUND_MOVEMENT/ORGANIZE consequences
- new faction scalar effects
- parties/elections/coalitions/full labor bargaining/transitional justice/military factions/local autonomy
- generic hidden utility/political-power/stability meters
- arbitrary cooldown/expiry/countdown
- proposal lifecycle events as pacing filler
- direct crisis creation/deletion for pacing
- direct conflict resolution/free LandHex/hidden comeback
- continuity decay/restoration, sovereignty meter, T023 threshold changes
- automatic successor/revolutionary Government creation
- Nash/CFR/fictitious-play/PSRO/MCTS/RL/QRE
- runtime LLM/MCP NPC decisions
- War as Politics / fantasy / V02 / renderer/UI
- changing historical F05 strategy semantics
- self-authorizing Gate 1F PASS or another follow-up task

EXPECTED_OUTPUT:

- exact >720-day post-interaction late-silence population
- representative freeze-point causal graphs
- writer/guard/limiter/no-op reason by existing system
- perturbation-probe evidence
- exact overall classification:
  - `LATE_STEADY_STATE_EXISTING_BUG_FOUND`
  - `LATE_STEADY_STATE_MODEL_EQUILIBRIUM`
  - `LATE_STEADY_STATE_INTERACTION_COVERAGE_EXHAUSTED`
  - `LATE_STEADY_STATE_OUTCOME_GAP`
  - `LATE_STEADY_STATE_MIXED_CAUSE`
  - `LATE_STEADY_STATE_MEASUREMENT_ARTIFACT`
- required status fields from the immutable task
- historical F05 regression result
- current state-grounded and post-intervention silence values
- Gate 1F recommendation and V02 status

STARTUP / FRESHNESS CHECK:

```bash
git status
git fetch origin
git rev-parse HEAD
git rev-parse origin/master
git pull --ff-only
```

Do not trust an unfetched local `origin/master`.

VERIFICATION:

```bash
pnpm install --frozen-lockfile
pnpm run format
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm run inspect:t024
pnpm run inspect:f01
pnpm run inspect:f04b
pnpm run inspect:f04d
pnpm run inspect:f05
# focused F05_FIX9 audit inspection/tests
# F05_FIX8 lifecycle/audit regressions if touched
pnpm test
git diff --check
```

RESULT_PATH: docs/bridge/results/F05_FIX9_RESULT.md

ON_COMPLETION:

- set `F05_FIX9: COMPLETE / AWAITING_CHATGPT_REVIEW` or truthful blocked state
- set `LAST_COMPLETED_TASK_ID: F05_FIX9`
- set `NEXT_AUTHORIZED_TASK_ID: NONE`
- set `NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW`
- set `CURRENT_TASK_FILE: NONE`
- keep `V02: NOT STARTED`
- do not add another political-interaction domain
- do not declare Gate 1F passed

Execute only the immutable task file referenced above.
