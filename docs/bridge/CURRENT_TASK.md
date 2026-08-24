# TMR Current Bridge Task

TASK_ID: F05_FIX15
STATUS: COMPLETE / AWAITING_CHATGPT_REVIEW
BASE_BRANCH: master
TASK_COMMIT: 8fd27058c95c75f55efda8612bd40a0befe81d67
STATE_ACTIVATION_COMMIT: 9e287e3a38fa6596b75bcb9f793ddabc90d811e0
TASK_FILE: NONE
COMMIT_POLICY: COMMIT_AND_PUSH_ON_PASS
RESULT_PATH: docs/bridge/results/F05_FIX15_RESULT.md
TASK_RESULT_COMMIT: 3489927c5ba67095b6f58b9292e017affeacf659
END_COMMIT: 3489927c5ba67095b6f58b9292e017affeacf659

## Mission summary

F05_FIX14 is reviewed/accepted as:

```text
FUND_MOVEMENT_LIFECYCLE_IMPLEMENTED_LATE_SILENCE_PERSISTS
NEXT_IMPLEMENTATION_READINESS: PIVOT_FROM_FUND_MOVEMENT
```

The FUND_MOVEMENT path is closed for the current Gate 1F pacing remedy.

F05_FIX15 pivots to F05_FIX9's `ACTIVE_CONFLICT_EQUILIBRIUM` and satisfies the repository's War-as-Politics grounding gate before any new conflict implementation is authorized.

Exact late-state basis:

```text
Country physical LandHexes = 0
active conflicts = 2
rebellion T021 = NO_ACTIVE_FRONT_EDGE
coup T021 = COUP_HAS_NO_TERRITORIAL_WRITER
Government remains valid
run outcome remains active
T022 consolidation blocked
T023 dissolution not proven by occupation/Government defeat alone
```

Required work:

1. read the immutable F05_FIX15 task and its fixed external grounding pack;
2. reconcile war/coup/rebellion/settlement mechanisms with the exact current TMR state and consumers;
3. keep coup coordination distinct from territorial warfare;
4. keep rebellion persistence distinct from a missing front edge;
5. audit war mobilization/finance, occupation/collaboration, displacement, settlement/demobilization, and post-conflict political participation without creating unsupported domains;
6. replay representative F05_FIX9 late freezes for reachability/consumer evidence if useful;
7. choose exactly one smallest next repair seam or explicitly classify that a new authoritative domain is required;
8. make no production gameplay implementation.

## Exact classifications

Select exactly one:

```text
WAR_POLITICS_GROUNDED_COUP_RESOLUTION_SLICE
WAR_POLITICS_GROUNDED_REBELLION_TERMINATION_SLICE
WAR_POLITICS_GROUNDED_CONFLICT_OBJECTIVE_SCHEMA
WAR_POLITICS_REQUIRES_NEW_AUTHORITATIVE_DOMAIN
WAR_POLITICS_GROUNDING_INSUFFICIENT
```

Required readiness:

```text
COUP_POLITICAL_RESOLUTION_VERTICAL_SLICE
REBELLION_TERMINATION_VERTICAL_SLICE
CONFLICT_OBJECTIVE_SCHEMA_ONLY
NEW_DOMAIN_GROUNDING_REQUIRED
NONE
```

## Key constraints

- no `0 LandHex -> defeat/dissolution`;
- no Government defeat -> continuity damage;
- no fake coup LandHex front/writer;
- no `no front -> peace`;
- no generic war exhaustion/support/morale/manpower/officer-loyalty/command-cohesion/refugee/occupation/peace-score meter;
- no hidden coup coordination score inferred from existing labels or scalars;
- no FUND_MOVEMENT extension;
- no direct T021/T022/T023 production change;
- no Conflict/WorldState/persistence schema change;
- no new LOBBY/BARGAIN/ORGANIZE content;
- no V02/UI/runtime LLM solver;
- no Gate 1F PASS or F05_FIX16 self-authorization.

Persistence remains `SerializedSimulationSnapshotV6`.

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
pnpm run inspect:f05fix14
# focused F05_FIX15 inspection/test only if developer-only code was added
pnpm test
git diff --check
```

Report the known Vitest `onTaskUpdate` runner/IPC issue separately from assertion status if it reproduces.

## Completion

On completion:

- `F05_FIX15: COMPLETE / AWAITING_CHATGPT_REVIEW` or truthful blocked state;
- `LAST_COMPLETED_TASK_ID: F05_FIX15`;
- `NEXT_AUTHORIZED_TASK_ID: NONE`;
- `NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW`;
- `CURRENT_TASK_FILE: NONE`;
- Gate 1F remains `NOT_READY`;
- V02 remains `NOT_STARTED`;
- do not authorize F05_FIX16.

Execute only `docs/bridge/tasks/F05_FIX15.md`.
