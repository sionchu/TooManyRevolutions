# TMR Current Bridge Task

TASK_ID: F05_FIX5

STATUS: AUTHORIZED

BASE_BRANCH: master

BASE_COMMIT: f09aa6ce62dadba29427e2139772846d3d98be4e

BASE_COMMIT_NOTE: This commit added the immutable `docs/bridge/tasks/F05_FIX5.md` task. A newer HEAD is allowed only when commits after this base are ChatGPT-authored Bridge authorization updates under `docs/bridge/STATE.md` and/or this `CURRENT_TASK.md`. Before execution, run `git fetch origin`, verify that post-base changes are Bridge authorization-only, and then `git pull --ff-only`.

TASK_FILE: docs/bridge/tasks/F05_FIX5.md

COMMIT_POLICY: COMMIT_AND_PUSH_ON_PASS

COMMIT_POLICY_NOTE: PASS means the action-consequence grounding is complete, candidate selection is evidence-based, any implementation stays within the one-action scope, verification passes, and the F05 report is truthful. It does NOT mean Gate 1F passed. A grounding-only `INSUFFICIENT_ACTION_CONSEQUENCE_GROUNDING / NOT_READY` is an acceptable successful result.

AUTHORIZED_SCOPE:

- read repository contracts, F05 history, F05_FIX4 grounding/result, and relevant faction/crisis/conflict consumers
- create `docs/F05_FIX5_FACTION_ACTION_CONSEQUENCE_GROUNDING.md`
- verify and use resource-mobilization / advocacy / lobbying references with F04C-R source-fact → interpretation → TMR-inference separation
- audit all current faction action types: `FUND_MOVEMENT`, `ORGANIZE`, `LOBBY`, `BARGAIN`, `ACCEPT`
- map each action to cost/commitment, existing authoritative state candidates, existing consumers, active-conflict relevance, player reassessment pathway, failure modes, and IMPLEMENT/DEFER/REJECT verdict
- treat `LOBBY` as access/information/coalition behavior, not automatic policy success or generic influence gain
- treat `BARGAIN` as requiring a represented offer/counterpart/acceptance; `politicalCompetition=plural` only enables legality
- treat `ACCEPT` as requiring a represented accepted object; do not magically reduce grievance
- prefer `ORGANIZE` or `FUND_MOVEMENT` only if their resource/organization/local-mobilization chain to existing T018/T021 consumers is grounded
- select and implement at most one action consequence only if every candidate-selection gate in the immutable task passes
- otherwise stop with `INSUFFICIENT_ACTION_CONSEQUENCE_GROUNDING`
- if implementing: use accepted ActionRecord authority, bounded/self-limiting state effects, deterministic ordering, and existing consumers; no direct terminal/territory/crisis resolution
- run required single-action, repeated-action, and player-interaction counterfactuals
- rerun the exact unchanged 36-branch / five-year F05 matrix only if an authoritative consequence is implemented
- create `docs/F05_GATE1F_REPAIR5_FACTION_CONSEQUENCE.md` only if implementation is justified
- write `docs/bridge/results/F05_FIX5_RESULT.md`
- update Bridge completion state

EXTERNAL_REFERENCE_GUARDRAIL:

- REQUIRED: `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`
- REQUIRED: F04C-R mechanism-first method
- verify McCarthy & Zald 1977 resource mobilization and Jenkins 1983 review before using them
- advocacy/lobbying references may support access/information/coalition mechanisms but must not be generalized into universal scalar bonuses
- F05_FIX4 best-response/Utility-AI work is conceptual only; payoff-aware chooser changes are deferred until consequence semantics exist
- no broad War as Politics or state-extinction/succession research

FORBIDDEN_SCOPE:

- more than one implemented faction action consequence
- continuity decay/restoration / sovereignty meter / T023 threshold changes
- automatic revolutionary succession / Government creation
- direct conflict resolution / crisis deletion / free LandHex / hidden comeback / direct terminal scripting
- generic hidden utility/political-power/stability score
- arbitrary `currentStrategy` combat multiplier
- arbitrary `grievance +/- X` from action names alone
- numeric tuning selected merely to improve F05 silence
- Nash/CFR/fictitious-play/PSRO/MCTS/RL runtime systems
- QRE/logit randomness or RNG for diversity
- MCP/LLM runtime NPC decisions
- elections / parties / coalitions
- full labor bargaining
- transitional justice
- military factions
- local autonomy
- War as Politics
- fantasy / arcane institutions
- V02 / renderer / UI
- story nodes / countdowns / filler events
- self-authorizing Gate 1F PASS or any follow-up task

EXPECTED_OUTPUT:

- complete five-action grounding/audit matrix
- exactly one consequence classification:
  - `CONSEQUENCE_IMPLEMENTED_MEANINGFUL`
  - `CONSEQUENCE_IMPLEMENTED_BUT_PACING_INSUFFICIENT`
  - `CONSEQUENCE_REJECTED_RATCHET_OR_DOMINANCE`
  - `INSUFFICIENT_ACTION_CONSEQUENCE_GROUNDING`
- `SELECTED_ACTION: <action | NONE>`
- `ACTIVE_CONFLICT_CONSUMER: <consumer | NONE>`
- cost/commitment and boundedness evidence
- player↔faction interaction evidence if implementation occurs
- exact F05 rerun and pacing/agency comparison if implementation occurs
- `GATE1F_RECOMMENDATION: PASS | PASS_WITH_NOTES | NOT_READY`

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

- preferred Node 24.19.0 / pnpm 11.19.0; if unavailable record exact runtime
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
- focused action/consequence/consumer tests if implementation occurs
- `pnpm test`
- `git diff --check`

RESULT_PATH: docs/bridge/results/F05_FIX5_RESULT.md

ON_COMPLETION:

- update Bridge to `F05_FIX5: COMPLETE / AWAITING_CHATGPT_REVIEW` or truthful blocked state
- set `NEXT_AUTHORIZED_TASK_ID: NONE`
- set `NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW`
- set `CURRENT_TASK_FILE: NONE`
- keep `V02: NOT STARTED`
- do not implement a second action consequence or next task
- do not declare Gate 1F passed

Execute only the immutable task file referenced above.
