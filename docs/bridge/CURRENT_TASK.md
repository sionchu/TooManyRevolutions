# TMR Current Bridge Task

TASK_ID: F05_FIX14
STATUS: AUTHORIZED
BASE_BRANCH: master
TASK_COMMIT: 462b928fd35aab7ff09a5c12ca9ecc6b78044aa9
STATE_ACTIVATION_COMMIT: f0b8086cea58200458e3d1e9336b0782b51e1277
TASK_FILE: docs/bridge/tasks/F05_FIX14.md
COMMIT_POLICY: COMMIT_AND_PUSH_ON_PASS
RESULT_PATH: docs/bridge/results/F05_FIX14_RESULT.md

## Mission summary

F05_FIX13 is reviewed/accepted as:

```text
TARGETED_COMMITMENT_KERNEL_IMPLEMENTED_BUT_LATE_REASSESSMENT_UNCHANGED
```

F05_FIX14 closes the FUND_MOVEMENT lifecycle question and prevents an endless FUND_MOVEMENT fix chain.

Required work:

1. **Targeted-v2 semantic atomicity hardening** — a business-invalid targeted FUND_MOVEMENT input must not mutate `currentStrategy` while failing commitment creation. Legacy v1 behavior is unchanged.
2. Audit the only authorized lifecycle candidate: while a commitment is active, evaluate whether the actor would still choose FUND_MOVEMENT under current authoritative state if only its own duplicate block were excluded.
3. If that lifecycle is honest, implement only a state-grounded `active -> resolved` transition with explicit provenance, no timer/cooldown/payoff/new meter.
4. If it is not honest, do not invent another lifecycle; classify the FUND_MOVEMENT route as exhausted for the current Gate 1F remedy.
5. Run no-response and existing-response counterfactuals and determine whether late reassessment actually improves.

## Exact primary classifications

Select exactly one:

```text
FUND_MOVEMENT_LIFECYCLE_IMPLEMENTED_REASSESSMENT_IMPROVED
FUND_MOVEMENT_LIFECYCLE_IMPLEMENTED_LATE_SILENCE_PERSISTS
FUND_MOVEMENT_ROUTE_EXHAUSTED_NO_HONEST_LIFECYCLE
```

Required readiness:

```text
NEXT_IMPLEMENTATION_READINESS:
  PROFILE_ENABLED_F05_REMEASUREMENT
  PIVOT_FROM_FUND_MOVEMENT
```

Choose `PROFILE_ENABLED_F05_REMEASUREMENT` only if late reassessment materially improves. Otherwise choose `PIVOT_FROM_FUND_MOVEMENT`.

## Key constraints

- no new FUND_MOVEMENT numeric payoff;
- no direct Faction.resources debit/gain;
- no direct organization/grievance/influence delta from FUND_MOVEMENT lifecycle;
- no new political/mobilization/effort meter;
- no direct crisis creation/deletion;
- no T021 combat bonus/intent shortcut;
- no Conflict/LandHex/continuity/terminal shortcut;
- no chooser threshold/priority rewrite;
- no default/inferred target or amount;
- no arbitrary duration/cooldown/countdown;
- no lifecycle/Agenda spam counted as pacing;
- no new LOBBY/BARGAIN/ORGANIZE content;
- no War-as-Politics, V02/UI, runtime LLM solver;
- no Gate 1F PASS or F05_FIX15 self-authorization.

If authoritative lifecycle state changes, persistence must move to the next explicit strict snapshot version. If lifecycle is rejected and only targeted-v2 atomicity is hardened, do not bump persistence unnecessarily.

## Repository-root / Codex Desktop freshness guard

The real repository is the nested `TooManyRevolutions` directory.

**The existing Codex Desktop thread may be reused. A new thread is not required.**

First externally synchronize the real nested repository. Then in the existing Codex thread/worktree run:

```bash
git status
git rev-parse HEAD
git rev-parse master
git rev-parse origin/master
```

If the worktree is clean, `master` and `origin/master` are already current, and only the existing worktree HEAD is behind, `git merge --ff-only origin/master` is permitted.

Do not reset, rebase, force-update, or create a new branch merely to bypass freshness.

Proceed only when working tree is clean and `HEAD == origin/master ==` the exact current GitHub master activation SHA supplied by ChatGPT/user.

If parent `Game-TMR` shows `TooManyRevolutions/` as untracked, `cd TooManyRevolutions` first. Never modify/configure/reset the parent empty repository.

## Verification

Follow the immutable task, including at minimum:

```bash
pnpm install --frozen-lockfile
pnpm run format
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm run inspect:t024
pnpm run inspect:f05
pnpm run inspect:f05fix9
pnpm run inspect:f05fix10
pnpm run inspect:f05fix13
# focused F05_FIX14 inspection/tests
pnpm test
git diff --check
```

Report the known Vitest `onTaskUpdate` runner/IPC issue separately from assertion status if it reproduces.

## Completion

On completion:

- `F05_FIX14: COMPLETE / AWAITING_CHATGPT_REVIEW` or truthful blocked state;
- `LAST_COMPLETED_TASK_ID: F05_FIX14`;
- `NEXT_AUTHORIZED_TASK_ID: NONE`;
- `NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW`;
- `CURRENT_TASK_FILE: NONE`;
- Gate 1F remains `NOT_READY`;
- V02 remains `NOT STARTED`;
- do not authorize F05_FIX15.

Execute only `docs/bridge/tasks/F05_FIX14.md`.
