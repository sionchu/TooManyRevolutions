# TMR Current Bridge Task

TASK_ID: F05_FIX16
STATUS: COMPLETE / AWAITING_CHATGPT_REVIEW
BASE_BRANCH: master
TASK_COMMIT: 7a75116f74fadeb1fa4cc98f91591b1607999ead
STATE_ACTIVATION_COMMIT: 5075eca39da977d630e9359c795b057274665262
TASK_FILE: NONE
COMMIT_POLICY: COMMIT_AND_PUSH_ON_PASS
RESULT_PATH: docs/bridge/results/F05_FIX16_RESULT.md
TASK_RESULT_COMMIT: f096a84
END_COMMIT: f096a84

## Mission summary

F05_FIX15 is reviewed/accepted as:

```text
WAR_POLITICS_REQUIRES_NEW_AUTHORITATIVE_DOMAIN
COUP_REQUIRES_NEW_COORDINATION_DOMAIN: YES
REBELLION_REQUIRES_SETTLEMENT_OR_PERSISTENCE_DOMAIN: YES
```

F05_FIX16 chooses the coup branch and closes it for the current Gate 1F repair.

Required question:

```text
Can TMR model coup success/failure with a bounded coup-only set of explicit decisive coordination actors and categorical observable alignment/action provenance,
without creating a general military/state-apparatus simulation, hidden coordination score, random roll, or fake territorial battle?
```

Repository note: T018 currently has unimplemented `militarySympathy` and `leadership` future-evidence placeholders. These are evidence that the gap was anticipated; they are not permission to implement scalar loyalty/coordination meters.

## Exact outcomes

Exactly one:

```text
COUP_COORDINATION_MINIMAL_DOMAIN_DESIGNABLE
COUP_COORDINATION_REJECTED_FOR_GATE1F
```

If designable:

```text
NEXT_IMPLEMENTATION_READINESS: COUP_COORDINATION_AUTHORING_SEAM
```

If honest modeling requires a broad military/state-apparatus actor model, command hierarchy, communications network, hidden belief model, officer-loyalty system, or tactical units:

```text
NEXT_IMPLEMENTATION_READINESS: PIVOT_TO_REBELLION_PERSISTENCE_GROUNDING
```

There is no third open-ended coup-grounding outcome.

## Required audit

- compare reuse of current `Faction` vs `Government` vs narrow coup-only coordination actor/node vs broader state-apparatus actor domain;
- audit categorical `incumbent | coup | uncommitted` only as observable alignment, not a loyalty/belief meter;
- identify an explicit authoritative transition/writer provenance contract or reject the coup route;
- identify an honest discrete success/failure rule or reject the coup route;
- preserve existing `ConflictOutcome.statusQuo` / nonterminal `governmentTransition` as result sinks only;
- replay/inspect the exact late coup blocker for relevance;
- produce the required design/result docs;
- make no production gameplay implementation.

## Forbidden scope

- no new WorldState/Conflict/Government/Faction fields;
- no new ActionRecord type or coup outcome writer;
- no T018/T021/T022/T023 changes;
- no persistence change; remain V6;
- no numeric coup support/coordination/loyalty/command-cohesion/inevitability/progress score;
- no random roll;
- no majority rule unless the actor contract itself makes that discrete rule explicitly grounded;
- no inferred alignment from militaryPower, stateCapacity, legitimacy, instability, Faction grievance/organization/resources/influence, ideology, name, currentStrategy, Agenda, or LandHex count;
- no fake coup LandHex front;
- no state dissolution from coup/Government transition;
- no FUND_MOVEMENT extension;
- no rebellion implementation;
- no V02/UI/runtime LLM solver;
- no Gate 1F PASS or F05_FIX17 self-authorization.

## Repository-root / Codex Desktop freshness guard

The real repository is the nested `TooManyRevolutions` directory.

**The existing Codex Desktop thread may be reused. A new thread is not required.**

First externally synchronize the real nested repository. Then in the existing thread/worktree run:

```bash
git status
git rev-parse HEAD
git rev-parse master
git rev-parse origin/master
```

If the worktree is clean, `master`/`origin/master` are current, and only HEAD is behind, `git merge --ff-only origin/master` is permitted.

Do not reset/rebase/force or create a new branch merely to bypass freshness.

Proceed only when the worktree is clean and `HEAD == origin/master ==` the exact current GitHub master activation SHA supplied by ChatGPT/user.

If parent `Game-TMR` shows `TooManyRevolutions/` as untracked, `cd TooManyRevolutions` first and never modify/configure/reset the parent repository.

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
# focused F05_FIX16 inspection only if developer-only code was added
pnpm test
git diff --check
```

Report the known Vitest `onTaskUpdate` runner/IPC issue separately from assertion status if it reproduces.

## Completion

```text
F05_FIX16: COMPLETE / AWAITING_CHATGPT_REVIEW
LAST_COMPLETED_TASK_ID: F05_FIX16
NEXT_AUTHORIZED_TASK_ID: NONE
NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW
CURRENT_TASK_FILE: NONE
GATE1F: NOT_READY
V02: NOT_STARTED
F05_FIX17: NOT_AUTHORIZED
```

F05_FIX16 stops at grounding/design, verification, result documentation,
commit, and push. It does not authorize F05_FIX17, Gate 1F PASS, V02, or
production coup gameplay.
