# TMR Current Bridge Task

TASK_ID: F05_FIX2

STATUS: AUTHORIZED

BASE_BRANCH: master

BASE_COMMIT: b93b701814ca8c38fb6477b253b49daa83d92b95

BASE_COMMIT_NOTE: This commit added the immutable `docs/bridge/tasks/F05_FIX2.md` task. A newer HEAD is allowed only when commits after this base are ChatGPT-authored Bridge authorization updates to `docs/bridge/STATE.md` and/or this `CURRENT_TASK.md`. Before execution, verify `git diff b93b701814ca8c38fb6477b253b49daa83d92b95..HEAD` contains no gameplay/source changes.

TASK_FILE: docs/bridge/tasks/F05_FIX2.md

COMMIT_POLICY: COMMIT_AND_PUSH_ON_PASS

COMMIT_POLICY_NOTE: PASS means the F05_FIX2 repair task completed coherently and verification passed. It does NOT authorize Codex to declare Gate 1F passed or start V02. A truthful `GATE1F_RECOMMENDATION: NOT_READY` may still be committed/pushed.

AUTHORIZED_SCOPE:

- diagnose the exact causal reason for the remaining ~1,200-day late steady state in early/preventive and near-crisis representative branches
- choose and implement one smallest grounded repair using existing authoritative state and existing systems
- preserve the F05_FIX1 recovery repair and recovery `TRADEOFF` result
- preserve political accommodation as a real paid trade-off rather than manufacture a dominant answer
- improve F05 instrumentation only when a genuinely player-relevant existing signal was omitted; do not game the metric
- rerun the unchanged F05 36-branch / five-year matrix
- create `docs/F05_GATE1F_REPAIR2.md`
- write `docs/bridge/results/F05_FIX2_RESULT.md`
- update `docs/bridge/LAST_RESULT.md` and completion state

EXTERNAL_REFERENCE_GUARDRAIL:

- REQUIRED: read `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`
- REQUIRED: use the F04C-R mechanism-first grounding method
- research is demand-driven; use existing repository grounding first
- do not gather references merely to justify adding a new mechanic or domain
- if the proposed consequence lacks sufficient grounding, report `INSUFFICIENT_REFERENCE_GROUNDING` instead of inventing a political mechanism
- if genuinely necessary new external research is used, separate source-supported fact / interpretation / TMR design inference and explain why existing grounding was insufficient
- War as Politics, Fantasy institutional politics, and Gate 1V visual reference work remain out of scope

FORBIDDEN_SCOPE:

- V02 / renderer / UI
- War as Politics
- fantasy / arcane institutions
- elections / parties / seats / coalitions
- full labor bargaining
- transitional justice
- military factions / loyalty
- local autonomy / federalism
- strategic AI / MCTS / runtime LLM
- generic stability / democracy / legitimacy / political-power meters
- chapters / story nodes / revolution phases / countdowns
- crisis or event scheduling based only on elapsed time
- filler periodic events or cosmetic pacing logs
- raw scalar drift counted as a decision merely to reduce measured silence
- RNG added merely to manufacture diversity
- direct crisis deletion
- free LandHex transfer / hidden comeback state
- direct outcome scripting
- wholesale retuning of multiple systems
- self-authorizing Gate 1F PASS, Gate 1V, or another follow-up task

EXPECTED_OUTPUT:

- evidence-based late steady-state diagnosis
- one smallest coherent grounded repair, or an honest insufficient-grounding/blocker result
- old vs new reassessment silence
- preserved recovery choice quality
- unchanged exact F05 matrix rerun
- accommodation and WAIT reclassification
- trajectory diversity and causal-readability result
- `GATE1F_RECOMMENDATION: PASS | PASS_WITH_NOTES | NOT_READY`
- exact remaining blockers if not ready

VERIFICATION:

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
- focused tests for any changed domain
- `pnpm test`
- `git diff --check`

RESULT_PATH: docs/bridge/results/F05_FIX2_RESULT.md

ON_COMPLETION:

- update Bridge to `F05_FIX2: REPAIR_COMPLETE / AWAITING_CHATGPT_REVIEW` or a truthful blocked state
- set `NEXT_AUTHORIZED_TASK_ID: NONE`
- set `CURRENT_TASK_FILE: NONE`
- keep `V02: NOT STARTED`
- if the repair is coherent and verification passes, commit/push the repair and result
- do not start another task or declare Gate 1F passed

Execute only the immutable task file referenced above.
