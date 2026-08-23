# TMR Current Bridge Task

TASK_ID: F05_FIX1

STATUS: AUTHORIZED

BASE_BRANCH: master

BASE_COMMIT: e069fe038cd63cf8ea705f4adc1560dd7bf0daa0

BASE_COMMIT_NOTE: This commit added the immutable `docs/bridge/tasks/F05_FIX1.md` task. A newer HEAD is allowed only when commits after this base are ChatGPT-authored Bridge authorization updates to `docs/bridge/STATE.md` and/or this `CURRENT_TASK.md`. Before execution, verify the diff contains no gameplay/source changes.

TASK_FILE: docs/bridge/tasks/F05_FIX1.md

COMMIT_POLICY: COMMIT_AND_PUSH_ON_PASS

COMMIT_POLICY_NOTE: PASS means the authorized repair task completed coherently and verification passed. It does NOT authorize Codex to declare Gate 1F passed or start V02. A truthful `GATE1F_RECOMMENDATION: NOT_READY` may still be committed/pushed.

AUTHORIZED_SCOPE:

- first classify the F05 long silence as measurement gap / simulation gap / mixed gap
- repair at least one additional existing paid response in active-conflict/recovery if an honest existing-state mechanism exists
- repair genuine pacing/decision silence with existing systems only
- improve F05 measurement only for genuinely player-relevant existing signals, never to game the metric
- rerun the exact F05 five-year matrix
- write `docs/F05_GATE1F_REPAIR1.md`
- write `docs/bridge/results/F05_FIX1_RESULT.md`
- update `docs/bridge/LAST_RESULT.md` and completion state

EXTERNAL_REFERENCE_GUARDRAIL:

- REQUIRED: read `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`
- REQUIRED: reuse the F04C-R mechanism-first grounding method
- research is demand-driven; do not gather references merely to expand scope
- prefer existing repo grounding; if insufficient, report `INSUFFICIENT_REFERENCE_GROUNDING` rather than inventing a political mechanism
- if genuinely necessary new research is used, separate source-supported fact / interpretation / TMR inference
- War, Fantasy, and Gate 1V reference domains remain out of scope for this repair

FORBIDDEN_SCOPE:

- V02 / renderer / UI
- War as Politics
- fantasy/arcane institutions
- elections / parties
- full labor bargaining
- transitional justice
- military factions
- local autonomy
- strategic AI / MCTS / runtime LLM
- generic stability/democracy/legitimacy/political-power meters
- story nodes / countdowns / scheduled crises / filler periodic events
- RNG added merely to manufacture diversity
- free territory / direct conflict deletion / hidden comeback score
- self-authorizing Gate 1F PASS or any follow-up task

EXPECTED_OUTPUT:

- trustworthy silence diagnosis
- smallest coherent recovery-response repair
- smallest coherent pacing repair or measurement correction
- exact F05 matrix rerun
- accommodation dominance reclassification
- WAIT dominance reclassification
- previous vs new longest silence
- causal readability and trajectory diversity result
- `GATE1F_RECOMMENDATION: PASS | PASS_WITH_NOTES | NOT_READY`
- remaining blocker list if not ready

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
- `pnpm test`
- `git diff --check`

RESULT_PATH: docs/bridge/results/F05_FIX1_RESULT.md

ON_COMPLETION:

- update Bridge to `F05_FIX1: REPAIR_COMPLETE / AWAITING_CHATGPT_REVIEW` or truthful blocked state
- set `NEXT_AUTHORIZED_TASK_ID: NONE`
- set `CURRENT_TASK_FILE: NONE`
- keep `V02: NOT STARTED`
- if the repair is coherent and verification passes, commit/push the repair and result
- do not start another task

Execute only the immutable task file referenced above.