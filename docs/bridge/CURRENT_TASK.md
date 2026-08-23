# TMR Current Bridge Task

TASK_ID: F05

STATUS: AUTHORIZED

BASE_BRANCH: master

BASE_COMMIT: 446d14871d62d1a9273a6bb7c6f699f8a246cac4

BASE_COMMIT_NOTE: This commit added the immutable `docs/bridge/tasks/F05.md` task. A newer HEAD is allowed only when the commits after this base are ChatGPT-authored Bridge authorization updates to `docs/bridge/STATE.md` and/or this `CURRENT_TASK.md`. Before execution, verify `git diff 446d14871d62d1a9273a6bb7c6f699f8a246cac4..HEAD` contains no gameplay/source changes.

TASK_FILE: docs/bridge/tasks/F05.md

COMMIT_POLICY: COMMIT_AND_PUSH_ON_PASS

COMMIT_POLICY_NOTE: Here PASS means the F05 measurement task completed correctly and verification passed. It does NOT authorize Codex to declare Gate 1F passed or start V02. A truthful `GATE1F_RECOMMENDATION: NOT_READY` is still a valid result and may be committed/pushed.

AUTHORIZED_SCOPE:

- developer-only F05 pacing/fun inspection and tests
- reuse of existing F03/F04/F04D inspection infrastructure
- one developer-only F05 validation fixture only if existing fixtures are insufficient for representative headless pacing
- measurement of accommodation dominance, WAIT dominance, action strength, timing sensitivity, pacing/readable arc, trajectory diversity and causal readability
- `docs/F05_PACING_FUN_DECISION.md`
- package script `inspect:f05` if needed
- Bridge F05 result / last-result / state updates after measurement

FORBIDDEN_SCOPE:

- gameplay rebalance during the primary measurement
- new political/economic/war/fantasy systems
- elections or party system
- full labor bargaining
- transitional justice
- military factions
- local autonomy
- War as Politics
- fantasy/arcane institutions
- V02 / renderer / UI
- strategic AI / MCTS / runtime LLM
- generic stability/democracy/legitimacy/political-power meters
- RNG added merely to manufacture diversity
- self-authorizing a follow-up fix or Gate 1F pass

EXPECTED_OUTPUT:

- trustworthy multi-context F05 headless measurement
- explicit accommodation-dominance classification
- per-context WAIT-dominance classification
- action strength/trade-off evidence
- early/near-crisis/recovery timing evidence
- structural pacing and readable-arc evidence
- choice-driven trajectory diversity and causal explanation
- `GATE1F_RECOMMENDATION: PASS | PASS_WITH_NOTES | NOT_READY`
- exact required fix list if recommendation is NOT_READY

VERIFICATION:

- `pnpm install --frozen-lockfile`
- `pnpm run format`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run build`
- `pnpm run inspect:t024`
- `pnpm run inspect:f01`
- `pnpm run inspect:f04d`
- `pnpm run inspect:f05`
- `pnpm test`
- `git diff --check`

RESULT_PATH: docs/bridge/results/F05_RESULT.md

ON_COMPLETION:

- write immutable `docs/bridge/results/F05_RESULT.md`
- update `docs/bridge/LAST_RESULT.md`
- update `docs/bridge/STATE.md` to `F05: MEASUREMENT_COMPLETE / AWAITING_CHATGPT_REVIEW`
- set `NEXT_AUTHORIZED_TASK_ID: NONE`
- keep `V02: NOT STARTED`
- if measurement and verification are trustworthy, commit/push the diagnostic artifacts and Bridge result
- do not start any follow-up task

Execute only the immutable task file referenced above.
