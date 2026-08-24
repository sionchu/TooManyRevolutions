# TMR Current Bridge Task

TASK_ID: F05_FIX8

STATUS: AUTHORIZED

BASE_BRANCH: master

BASE_COMMIT: dbd39ff9e5fdc22a29cef1157399a634a0fa7701

BASE_COMMIT_NOTE: This commit added the immutable `docs/bridge/tasks/F05_FIX8.md` task. A newer HEAD is allowed only when commits after this base are ChatGPT-authored Bridge activation/current-task updates under `docs/bridge/STATE.md` and/or this `CURRENT_TASK.md`. Before execution, run `git fetch origin`, verify post-base changes are Bridge-only authorization changes, and then `git pull --ff-only`.

TASK_FILE: docs/bridge/tasks/F05_FIX8.md

COMMIT_POLICY: COMMIT_AND_PUSH_ON_PASS

COMMIT_POLICY_NOTE: PASS means the 8 non-accept divergences are fully audited, lifecycle semantics are explicit, any rejected-demand reconsideration implementation is state-grounded/deterministic, persistence and replay remain trustworthy, and long-horizon results are truthful. It does NOT mean Gate 1F passed. A truthful `NON_ACCEPT_DIVERGENCE_UNRESOLVED`, `LIFECYCLE_RECONSIDERATION_MODEL_INSUFFICIENT`, or `...PACING_STILL_BLOCKED` result is an acceptable successful task outcome.

AUTHORIZED_SCOPE:

- accept F05_FIX7 as reviewed/accepted measurement
- create `docs/F05_FIX8_NON_ACCEPT_DIVERGENCE_AUDIT.md`
- enumerate the exact 4 IGNORE + 4 REJECT branches that differ from matching NO_TEMPLATE controls
- identify the first divergence tick and first ActionRecord/event/authoritative-state difference for each
- isolate historical runner vs FIX7 integration runner vs template/proposal-state effects with paired controls
- classify every divergence exactly as specified in the immutable task
- if a developer-runner or measurement artifact is proven, fix only that developer seam and rerun the audit
- if any divergence remains unresolved, stop lifecycle implementation
- create `docs/F05_FIX8_PROPOSAL_LIFECYCLE_SEMANTICS.md` only after the audit is resolved
- distinguish stable demand identity from proposal episode provenance
- prefer stable demand identity `proposerFactionId + countryId + subjectKind + interventionId`
- define rejected-demand reconsideration from named existing authoritative state changes, not time
- prefer current Government + requested-intervention discrete feasibility basis as the minimum v1 reconsideration basis
- prohibit raw continuously drifting scalar hashes and Agenda/read-model eligibility
- if grounded, implement the smallest explicit-REJECT lifecycle rule: same demand cannot reopen while the reconsideration basis is unchanged, but can reopen after a real approved basis transition
- keep IGNORE one-open maximum and preserve existing ACCEPT intervention provenance
- version persistence explicitly if new authoritative lifecycle state must be stored
- run focused unchanged-basis / Government-change / feasibility-change / unrelated-drift counterfactuals
- rerun the unchanged historical F05 36-branch baseline and the separate 108-branch long-horizon proposal matrix if implementation occurs
- create `docs/F05_GATE1F_REPAIR8_PROPOSAL_LIFECYCLE.md` if implementation occurs
- write `docs/bridge/results/F05_FIX8_RESULT.md`
- update Bridge completion state

FORBIDDEN_SCOPE:

- arbitrary cooldown, expiry timer, or wait-N-days rule
- permanent rejected-demand ban with no state-grounded reconsideration path
- raw scalar snapshot/hash whose purpose is merely to make reopening possible
- Agenda/read-model values as authoritative proposal eligibility
- new proposal subjects/templates, BARGAIN/counteroffers/full settlement
- new faction scalar effects or proposal-specific combat modifiers
- generic hidden utility/political-power/stability meters
- probabilistic player response, QRE/logit randomness, Nash/CFR/PSRO/MCTS/RL
- runtime LLM/MCP NPC decisions
- continuity decay/restoration, sovereignty meter, T023 changes
- automatic successor/revolutionary Government creation
- direct crisis deletion/conflict resolution/free LandHex/hidden comeback
- elections/parties/coalitions/full labor bargaining/transitional justice/military factions/local autonomy
- War as Politics / fantasy / V02 / renderer/UI
- story nodes/countdowns/filler events
- changing historical F05 strategy semantics
- self-authorizing Gate 1F PASS or another follow-up task

EXPECTED_OUTPUT:

- complete 8-branch divergence causal audit
- explicit demand identity / proposal episode / reconsideration semantics
- optional state-grounded lifecycle implementation only after the audit passes
- persistence version result (`V3_UNCHANGED` or explicit `V4`)
- identical-demand reopen/churn result
- legitimate state-change reopen evidence
- historical F05 baseline regression
- long-horizon proposal matrix result if implementation occurs
- `NON_ACCEPT_DIVERGENCE`, `RECONSIDERATION_MODEL`, `PERSISTENCE_FORMAT`, `IDENTICAL_REOPEN_CHURN`, `LEGITIMATE_REOPEN_EVIDENCE`, `HISTORICAL_F05_BASELINE`, state-grounded silence, post-intervention late silence, `READY_FOR_F05_PROMOTION`, `GATE1F_RECOMMENDATION`, `V02`

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
- `pnpm run inspect:f05` unchanged historical baseline
- focused divergence audit tests/inspection
- focused proposal lifecycle/persistence tests if implementation occurs
- rerun F05_FIX7-style integration matrix if implementation occurs
- `pnpm test`
- `git diff --check`

RESULT_PATH: docs/bridge/results/F05_FIX8_RESULT.md

ON_COMPLETION:

- set `F05_FIX8: COMPLETE / AWAITING_CHATGPT_REVIEW` or truthful blocked state
- set `LAST_COMPLETED_TASK_ID: F05_FIX8`
- set `NEXT_AUTHORIZED_TASK_ID: NONE`
- set `NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW`
- set `CURRENT_TASK_FILE: NONE`
- keep `V02: NOT STARTED`
- do not add another political-interaction domain
- do not declare Gate 1F passed

Execute only the immutable task file referenced above.
