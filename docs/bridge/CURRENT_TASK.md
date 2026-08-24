# TMR Current Bridge Task

TASK_ID: F05_FIX7

STATUS: AUTHORIZED

BASE_BRANCH: master

BASE_COMMIT: 20a9b0e7db45bbec092012456a638fd921009bd5

BASE_COMMIT_NOTE: This commit added the immutable `docs/bridge/tasks/F05_FIX7.md` task. A newer HEAD is allowed only when commits after this base are ChatGPT-authored Bridge activation/current-task updates under `docs/bridge/STATE.md` and/or this `CURRENT_TASK.md`. Before execution, run `git fetch origin`, verify post-base changes are Bridge-only authorization changes, and then `git pull --ff-only`.

TASK_FILE: docs/bridge/tasks/F05_FIX7.md

COMMIT_POLICY: COMMIT_AND_PUSH_ON_PASS

COMMIT_POLICY_NOTE: PASS means the v1 LOBBY-only trigger contract is made honest, the historical F05 baseline is preserved, the separate five-year proposal-response integration matrix is complete, proposal-decision load is separated from state-grounded pacing, churn/dominance is diagnosed, and verification is truthful. It does NOT mean Gate 1F passed. A truthful `INTERACTION_INTEGRATION_MEANINGFUL_PACING_STILL_BLOCKED`, `PROPOSAL_RESPONSE_DOMINANCE_OR_CHURN`, or other authorized NOT_READY result is a successful task outcome.

AUTHORIZED_SCOPE:

- accept F05_FIX6 Political Interaction Kernel as reviewed/accepted
- close the v1 template configuration footgun by restricting/validating `FactionProposalTemplate.triggerAction` to `LOBBY` only
- preserve the historical official F05 six-strategy / 36-branch baseline unchanged
- create a developer-only long-horizon integration scenario with exactly the existing F05_FIX6 explicit template: coup/security Faction + LOBBY -> existing F04D coercive-restriction InterventionId
- add a deterministic developer-runner proposal-response seam with modes `NO_TEMPLATE`, `PROPOSAL_IGNORE`, `PROPOSAL_REJECT`, `PROPOSAL_ACCEPT_IF_FEASIBLE`
- keep response actions on the normal ActionProposal -> accepted ActionRecord path
- `ACCEPT_IF_FEASIBLE` must derive current intervention feasibility and must not spam infeasible response actions
- explicitly define same-tick player intervention / proposal response ActionRecord ordering and test it
- run the historical 36-branch F05 baseline as regression
- run the separate proposal-enabled matrix over all six F05 contexts × six existing intervention strategies × IGNORE/REJECT/ACCEPT_IF_FEASIBLE
- record proposal lifecycle telemetry, response telemetry, requested-intervention telemetry, churn, and response dominance
- preserve existing Gate-relevant state-grounded pacing metrics
- report proposal decision load separately
- do not add proposal lifecycle events to F05 `PACING_EVENT_TYPES` merely to reduce silence
- test whether any state-grounded silence reduction persists after the requested intervention completes
- preserve neighboring one-day timing checks
- create `docs/F05_GATE1F_REPAIR7_INTERACTION_INTEGRATION.md`
- write `docs/bridge/results/F05_FIX7_RESULT.md`
- update Bridge completion state

FORBIDDEN_SCOPE:

- new proposal subjects or additional proposal templates
- generalizing proposal triggers beyond LOBBY
- direct faction scalar effects from proposal lifecycle
- BARGAIN/counteroffer/full settlement systems
- proposal-specific combat modifiers
- generic hidden utility/political-power/stability scores
- automatic production player AI or probabilistic response
- Nash/CFR/fictitious-play/PSRO/MCTS/RL/QRE
- runtime LLM/MCP NPC decisions
- continuity decay/restoration, sovereignty meter, or T023 threshold changes
- automatic successor/revolutionary Government creation
- direct crisis deletion/conflict resolution/free LandHex/hidden comeback
- proposal cooldown/expiry/rejection memory added merely to improve pacing
- elections/parties/coalitions/full labor bargaining/transitional justice/military factions/local autonomy
- War as Politics / fantasy / V02 / renderer/UI
- story nodes/countdowns/filler events
- rewriting the official F05 strategy semantics in this task
- self-authorizing Gate 1F PASS or a follow-up task

EXPECTED_OUTPUT:

- exact long-horizon branch population and response-mode definitions
- historical F05 baseline regression result
- proposal-enabled matrix result
- representative T0/T18/T180 NO_TEMPLATE vs IGNORE vs REJECT vs ACCEPT_IF_FEASIBLE comparison
- proposal open/accept/reject/reopen counts
- state-grounded longest reassessment silence
- proposal-decision-load longest silence
- post-intervention late-silence result
- churn and response dominance diagnosis
- one primary classification:
  - `INTERACTION_INTEGRATION_MEANINGFUL_PACING_IMPROVED`
  - `INTERACTION_INTEGRATION_MEANINGFUL_PACING_STILL_BLOCKED`
  - `PROPOSAL_RESPONSE_DOMINANCE_OR_CHURN`
  - `INTERACTION_INTEGRATION_NO_MEANINGFUL_LONG_HORIZON_EFFECT`
  - `INTEGRATION_BLOCKED_BY_ORCHESTRATION_CONTRACT`
- `HISTORICAL_F05_BASELINE: UNCHANGED | CHANGED`
- `V1_TRIGGER_CONTRACT: CLOSED | OPEN`
- `REOPEN_CHURN: NONE | PRESENT`
- `RESPONSE_DOMINANCE: NONE | IGNORE | REJECT | ACCEPT | MIXED`
- `READY_FOR_F05_PROMOTION: YES | NO`
- `GATE1F_RECOMMENDATION: PASS | PASS_WITH_NOTES | NOT_READY`
- `V02: NOT STARTED`

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
- new focused F05_FIX7 long-horizon integration inspection
- focused proposal/action/persistence tests as touched
- `pnpm test`
- `git diff --check`

RESULT_PATH: docs/bridge/results/F05_FIX7_RESULT.md

ON_COMPLETION:

- set `F05_FIX7: COMPLETE / AWAITING_CHATGPT_REVIEW` or truthful blocked state
- set `LAST_COMPLETED_TASK_ID: F05_FIX7`
- set `NEXT_AUTHORIZED_TASK_ID: NONE`
- set `NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW`
- set `CURRENT_TASK_FILE: NONE`
- keep `V02: NOT STARTED`
- do not promote the response policy into official F05 in this task
- do not declare Gate 1F passed

Execute only the immutable task file referenced above.
