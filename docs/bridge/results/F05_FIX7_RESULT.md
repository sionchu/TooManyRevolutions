# F05_FIX7 Result — Political Interaction Long-Horizon Integration

TASK_ID: `F05_FIX7`
BASE_COMMIT: `20a9b0e7db45bbec092012456a638fd921009bd5`
IMPLEMENTATION_COMMIT: `60a4a1d`
STATUS: `COMPLETE / AWAITING_CHATGPT_REVIEW`
START_BRANCH: `master`
START_COMMIT: `7d5721a7528885fe2cb327077d893d34939912ab`
END_BRANCH: `master`
END_COMMIT: `d89c386` (bridge result metadata commit)
COMMIT_POLICY: `COMMIT_AND_PUSH_ON_PASS`
COMMIT_CREATED: `YES`
PUSHED: `YES after completion metadata commit`

## Required fields

```text
PRIMARY CLASSIFICATION: PROPOSAL_RESPONSE_DOMINANCE_OR_CHURN
HISTORICAL_F05_BASELINE: UNCHANGED
V1_TRIGGER_CONTRACT: CLOSED
PROPOSAL_RESPONSE_MODE_EFFECT: IGNORE=4; REJECT=4; ACCEPT=18 state-grounded branches differing from matching NO_TEMPLATE control
STATE_GROUNDED_MAX_REASSESSMENT_SILENCE: 1200 days
PROPOSAL_DECISION_MAX_SILENCE: 1800 days
POST_INTERVENTION_LATE_STATE_GROUNDED_SILENCE: 1110 days
REOPEN_CHURN: PRESENT
RESPONSE_DOMINANCE: MIXED
READY_FOR_F05_PROMOTION: NO
GATE1F_RECOMMENDATION: NOT_READY
V02: NOT STARTED
```

## Completed scope

- closed the v1 `FactionProposalTemplate.triggerAction` contract to `LOBBY`
  in both TypeScript and scenario validation;
- added a separate developer-only F05_FIX7 scenario identity reusing exactly
  the single F05_FIX6 coup/security `LOBBY -> coercive-restriction` template;
- preserved the official six-strategy / 36-branch F05 baseline;
- added deterministic `NO_TEMPLATE`, `PROPOSAL_IGNORE`, `PROPOSAL_REJECT`, and
  `PROPOSAL_ACCEPT_IF_FEASIBLE` orchestration;
- kept proposal responses on the normal ActionProposal -> accepted ActionRecord
  path and tested same-tick order as strategy, response, then carried faction;
- kept proposal lifecycle events out of F05 `PACING_EVENT_TYPES` and reported
  proposal decision load separately;
- measured all 36 historical controls plus 108 proposal-enabled branches;
- recorded lifecycle, feasibility, requested-intervention, reopen, action-order,
  state-grounded silence, late-silence, and response-mode telemetry.

## Observed matrix evidence

| Mode | Branches | Opened | Accepted | Explicit reject | Response actions | Feasibility changes | Requested start/complete | Reopened identical key |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `PROPOSAL_IGNORE` | 36 | 18 | 0 | 0 | 0 | 181 | 0 / 0 | 0 |
| `PROPOSAL_REJECT` | 36 | 66 | 0 | 66 | 66 | 132 | 0 / 0 | 48 |
| `PROPOSAL_ACCEPT_IF_FEASIBLE` | 36 | 18 | 18 | 0 | 18 | 37 | 18 / 18 | 0 |

`ACCEPT_IF_FEASIBLE` produced zero proposal-response `notFeasible` rejections.
Maximum concurrent matching open proposals was 1. Stale-target and
proposal-response intervention rejection counts were 0.

The representative WAIT branches are recorded in
`docs/F05_GATE1F_REPAIR7_INTERACTION_INTEGRATION.md`. In T0, the authored
proposal opened at day 31; REJECT responses occurred at days 32/62/92/122 and
reopened the same template key three times. ACCEPT started the existing
intervention at day 32 and completed it at day 37. T18 shifts those first
response points to days 14 and 19. T180 has no matching proposal in the WAIT
branch and is retained as a requested matrix combination.

## Verification evidence

Executed commands and observed results:

- `git fetch origin` — PASS; `origin/master` advanced to the requested gate;
- `git pull --ff-only` — PASS; fast-forward to `7d5721a7528885fe2cb327077d893d34939912ab`;
- post-base diff — Bridge-only activation files before implementation;
- `pnpm exec prettier --write <touched files>` — PASS;
- `pnpm run typecheck` — PASS;
- `pnpm run lint` — PASS;
- `pnpm run inspect:f05fix7` — PASS, `144/144` branches;
- focused Vitest (`scenario`, `politicalProposal`, F05_FIX7 integration) — PASS, 3 files / 14 tests;
- F05 historical regression inside the focused inspection — PASS / `UNCHANGED`;
- `pnpm test` — PASS, 55 files / 443 tests; file parallelism disabled to keep
  the long F05_FIX7 worker stable under the repository-wide suite;
- `pnpm run format` — PASS;
- `pnpm run typecheck` — PASS;
- `pnpm run lint` — PASS;
- `pnpm run build` — PASS;
- `pnpm run inspect:t024` — PASS;
- `pnpm run inspect:f01` — PASS;
- `pnpm run inspect:f04b` — PASS;
- `pnpm run inspect:f04d` — PASS;
- `pnpm run inspect:f05` — PASS / historical baseline `NOT_READY`;
- `git diff --check` — PASS after implementation and metadata cleanup.

Gate 1F remains a ChatGPT/user review decision; this task does not promote F05
or start V02.
