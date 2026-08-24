# TMR Current Bridge Task

TASK_ID: F05_FIX17
STATUS: AUTHORIZED
BASE_BRANCH: master
TASK_COMMIT: e40493948335afcfc253dee1dcee5a010166db23
STATE_ACTIVATION_COMMIT: 40e23c98763f98d24875a2dd857bc85de4268404
TASK_FILE: docs/bridge/tasks/F05_FIX17.md
COMMIT_POLICY: COMMIT_AND_PUSH_ON_PASS
RESULT_PATH: docs/bridge/results/F05_FIX17_RESULT.md

## Mission summary

F05_FIX16 is reviewed/accepted as:

```text
COUP_COORDINATION_MINIMAL_DOMAIN_DESIGNABLE
NEXT_IMPLEMENTATION_READINESS: COUP_COORDINATION_AUTHORING_SEAM
```

F05_FIX17 implements **only** the static scenario-owned authoring contract for the accepted coup coordination design.

Required semantic shape:

```text
CoupCoordinationNodeDefinition
  id
  countryId
  name

CoupCoordinationProfile
  countryId
  coupFactionId
  requiredNodeIds (non-empty explicit necessary-set)
  successorGovernmentId (existing same-Country Government)
```

The required-node set is authored content, not a majority/quorum/weighted score. Node names are presentation/authoring labels only and never branch logic.

## Required preservation

- existing scenarios with no coup-coordination authoring remain behaviorally unchanged;
- absent vs explicit empty authoring collections produce equivalent initial WorldState;
- no authored node/profile is copied into mutable WorldState in this task;
- no runtime alignment state;
- no initial alignment writer;
- no `COUP_COORDINATION_RESPONSE` ActionRecord/event;
- no node-response producer;
- no coup outcome writer or Government-transition producer;
- no T018/T021/T022/T023 behavior change;
- no Conflict/Government/Faction runtime schema change;
- no persistence change; remain strict V6;
- no production Gate 1F coup-node content merely to manufacture reachability.

## Required validation

At minimum reject:

- duplicate node IDs;
- unknown node Country;
- empty node name;
- unknown profile Country;
- unknown coup Faction;
- Faction/Country mismatch;
- Faction without authored `coup` capability;
- duplicate/ambiguous coup profile;
- empty required-node set;
- duplicate required node in one profile;
- unknown required node;
- foreign-Country required node;
- unknown successor Government;
- foreign-Country successor Government;
- initially self-successor profile.

Required-node insertion order must not carry semantics.

## Exact outcomes

Exactly one:

```text
COUP_COORDINATION_AUTHORING_SEAM_IMPLEMENTED
COUP_COORDINATION_AUTHORING_SEAM_REJECTED_FOR_GATE1F
```

If implemented:

```text
NEXT_IMPLEMENTATION_READINESS: COUP_COORDINATION_RUNTIME_VERTICAL_SLICE
```

If rejected:

```text
NEXT_IMPLEMENTATION_READINESS: PIVOT_TO_REBELLION_PERSISTENCE_GROUNDING
```

No third open-ended authoring outcome is allowed.

## Forbidden scope

- no generic military/state-apparatus actor framework;
- no ranks, units, command hierarchy, communications graph, manpower;
- no loyalty/coordination/inevitability/progress score;
- no random roll, timer, countdown, cooldown, majority threshold, node weight;
- no alignment inference from Faction/Country/Government scalars, ideology, strategy, Agenda, Region stateControl, or LandHex control;
- no fake coup LandHex front;
- no State Dissolution from coup/Government transition;
- no rebellion implementation;
- no FUND_MOVEMENT extension;
- no V02/UI/runtime LLM solver;
- no Gate 1F PASS or F05_FIX18 self-authorization.

Persistence remains `SerializedSimulationSnapshotV6 / format version 6`.

## Repository-root / Codex Desktop freshness guard

The real repository is the nested `TooManyRevolutions` directory.

**The existing Codex Desktop thread may be reused. A new thread is not required.**

First synchronize the real nested repository. Then in the existing Codex thread/worktree run:

```bash
git status
git rev-parse HEAD
git rev-parse master
git rev-parse origin/master
```

If the worktree is clean, `master`/`origin/master` are current, and only HEAD is behind, `git merge --ff-only origin/master` is permitted.

Do not reset, rebase, force, or create a new branch merely to bypass freshness.

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
pnpm run inspect:t018
pnpm run inspect:t024
pnpm run inspect:f05
pnpm run inspect:f05fix9
pnpm run inspect:f05fix14
# focused F05_FIX17 scenario-validation tests if code is added
pnpm test
git diff --check
```

Report the known Vitest `onTaskUpdate` runner/IPC issue separately from assertion status if it reproduces.

## Completion

```text
F05_FIX17: COMPLETE / AWAITING_CHATGPT_REVIEW
LAST_COMPLETED_TASK_ID: F05_FIX17
NEXT_AUTHORIZED_TASK_ID: NONE
NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW
CURRENT_TASK_FILE: NONE
GATE1F_CHATGPT_DECISION: NOT_READY
V02: NOT_STARTED
F05_FIX18: NOT_AUTHORIZED
```

Execute only `docs/bridge/tasks/F05_FIX17.md`.