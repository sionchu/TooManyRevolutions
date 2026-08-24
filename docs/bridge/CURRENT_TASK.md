# TMR Current Bridge Task

TASK_ID: F05_FIX4

STATUS: AUTHORIZED

BASE_BRANCH: master

BASE_COMMIT: 406d6dd21561911d1a0c201b13d445d58623bee2

BASE_COMMIT_NOTE: This commit added the immutable `docs/bridge/tasks/F05_FIX4.md` task. A newer HEAD is allowed only when commits after this base are ChatGPT-authored Bridge authorization updates to `docs/bridge/STATE.md` and/or this `CURRENT_TASK.md`. Before execution, run `git fetch origin`, verify the diff contains no gameplay/source changes, and then `git pull --ff-only`.

TASK_FILE: docs/bridge/tasks/F05_FIX4.md

COMMIT_POLICY: COMMIT_AND_PUSH_ON_PASS

COMMIT_POLICY_NOTE: PASS means the reference grounding, proposal-loop diagnosis, deterministic faction proposal intake integration, tests, and truthful F05 rerun completed correctly. It does NOT mean Gate 1F passed. A truthful `ACTOR_ACTION_CONSUMER_GAP / GATE1F_RECOMMENDATION: NOT_READY` is an acceptable successful task result.

AUTHORIZED_SCOPE:

- read the required repository contracts and F05 history
- create `docs/F05_FIX4_ACTOR_ADAPTATION_REFERENCE_GROUNDING.md`
- ground the design against OpenSpiel/best-response dynamics, Utility AI implementation patterns, Gambit/Nashpy non-fit, QRE defer, and MCP tool-boundary examples exactly as specified in the immutable task
- prove whether current T016 faction heuristic proposals are generated but dropped by the current F03/F05 headless orchestration
- inventory production consumers of `Faction.currentStrategy`, faction action types, and `FACTION_STRATEGY_CHANGED`
- classify the existing downstream coverage before implementation
- add the smallest reusable external/orchestration seam that carries existing T016 faction heuristic proposals into the common next-tick action intake
- keep proposals transient/non-authoritative and accepted ActionRecords authoritative
- preserve exactly-once target-tick execution and deterministic faction ordering
- explicitly define same-tick player/faction action sequence ordering without hidden gameplay priority
- preserve historical F03/F04 behavior by using an explicit actor-loop mode unless actual source proves otherwise
- enable faction autonomous intake for the official post-FIX4 F05 rerun
- run actor-loop OFF vs ON counterfactuals in early/near/recovery contexts
- do not count causally inert strategy-change events as meaningful pacing
- rerun the unchanged 36-branch / five-year F05 matrix
- write `docs/F05_GATE1F_REPAIR4_ACTOR_LOOP.md`
- write `docs/bridge/results/F05_FIX4_RESULT.md`
- update Bridge completion state

EXTERNAL_REFERENCE_GUARDRAIL:

- REQUIRED: `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`
- REQUIRED: F04C-R mechanism-first separation of source fact / interpretation / TMR inference
- OpenSpiel and best-response dynamics are conceptual references only; no dependency
- Utility AI is an implementation-pattern reference only; do not add arbitrary utility weights in this task
- Gambit/Nashpy equilibrium solving is explicitly not a runtime solution here
- QRE/stochastic response is deferred; no RNG for behavioral variety
- MCP examples are tool/API-boundary references only; no MCP or LLM runtime NPC dependency
- no new external service is authorized

FORBIDDEN_SCOPE:

- new state-continuity decay/restoration, sovereignty meter, or T023 threshold changes
- automatic revolutionary succession / Government creation
- arbitrary faction action resource/grievance/organization effects
- strategy-specific scalar bonuses not already grounded
- generic hidden utility/political score
- Nash equilibrium / Gambit / Nashpy / OpenSpiel runtime dependency
- CFR / regret matching / fictitious play / PSRO / MCTS / RL
- QRE/logit randomness or RNG merely for diversity
- MCP server/runtime dependency for NPC decisions
- runtime LLM faction decisions
- direct crisis deletion / free LandHex / hidden comeback / direct outcome scripting
- intervention/faction/conflict rebalance unrelated to proposal intake
- adding `FACTION_STRATEGY_CHANGED` to F05 pacing solely to reduce measured silence
- chapters / revolution phases / countdowns / filler events
- elections / parties / coalitions
- full labor bargaining
- transitional justice
- military factions
- local autonomy
- War as Politics
- fantasy / arcane institutions
- V02 / renderer / UI
- self-authorizing Gate 1F PASS or any follow-up task

EXPECTED_OUTPUT:

- external/game-AI reference grounding artifact
- source/runtime proof of proposal generation vs pre-FIX4 acceptance
- currentStrategy consumer inventory
- deterministic faction heuristic intake seam
- exactly-once and insertion-order-safe tests
- same-tick player/faction sequencing test
- persistence/replay verification
- actor-loop OFF-vs-ON counterfactual
- exact F05 matrix rerun with actor loop ON
- one of:
  - `INTAKE_FIX_CREATES_MEANINGFUL_EXISTING_CONSEQUENCE`
  - `INTAKE_FIX_CHANGES_PRECRISIS_ONLY`
  - `INTAKE_FIX_STRATEGY_ONLY`
  - `INTAKE_FIX_NO_EFFECT`
- if active-conflict consumer is missing, explicit `ACTOR_ACTION_CONSUMER_GAP`
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
- focused actor-loop tests
- `pnpm test`
- `git diff --check`

RESULT_PATH: docs/bridge/results/F05_FIX4_RESULT.md

ON_COMPLETION:

- update Bridge to `F05_FIX4: REPAIR_COMPLETE / AWAITING_CHATGPT_REVIEW` or truthful blocked state
- set `NEXT_AUTHORIZED_TASK_ID: NONE`
- set `NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW`
- set `CURRENT_TASK_FILE: NONE`
- keep `V02: NOT STARTED`
- do not implement the next faction-action consumer/payoff task
- do not declare Gate 1F passed

Execute only the immutable task file referenced above.
