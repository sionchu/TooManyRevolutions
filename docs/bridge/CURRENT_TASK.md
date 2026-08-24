# TMR Current Bridge Task

TASK_ID: F05_FIX13
STATUS: AUTHORIZED
BASE_BRANCH: master
TASK_COMMIT: 005c617bd3a9c79651cc7730992e85a592134706
STATE_ACTIVATION_COMMIT: 67fcc82418471f7af4037024d0d56f61b1405441
TASK_FILE: docs/bridge/tasks/F05_FIX13.md
COMMIT_POLICY: COMMIT_AND_PUSH_ON_PASS
RESULT_PATH: docs/bridge/results/F05_FIX13_RESULT.md

## Mission summary

F05_FIX12 is reviewed/accepted as `FUND_MOVEMENT_AUTHORING_SEAM_IMPLEMENTED`.

F05_FIX13 is the first actual runtime targeted-commitment slice:

```text
scenario-authored FactionFundMovementTemplate
-> existing chooser selects FUND_MOVEMENT
-> targeted/versioned faction ActionProposal
-> accepted ActionRecord
-> exact authored target/amount match
-> authoritative active actor-owned commitment
-> current available-resource feasibility
-> active same-actor/target duplicate guard
-> Agenda visibility
-> strict next-version persistence/replay
```

The commitment is an earmark of existing `Faction.resources`; it is not a debit or a new resource meter.

## Required preservation

- Scenarios with no `factionFundMovementTemplates` keep the existing v1 faction-action behavior and create no commitment.
- Historical 36-branch F05 and existing F05_FIX7/F05_FIX8 108-branch populations remain unchanged.
- Existing chooser priority/threshold order is unchanged.
- Target and amount are never inferred.

## Allowed implementation

- dedicated versioned targeted FUND_MOVEMENT payload/decoder path;
- authoritative FUND_MOVEMENT commitment state with source ActionId, FactionId, RegionId, authored amount, creation tick, active status;
- derived available faction resources = stock minus active earmarks;
- runtime profile-match/resource feasibility;
- active same-actor/target duplicate blocking;
- profile-enabled `availableActions.FUND_MOVEMENT` feasibility integration without priority rewrite;
- one state-grounded commitment-created event with provenance;
- existing faction-pressure Agenda evidence of active target/amount without severity bonus;
- explicit next snapshot format version with strict persistence/replay;
- developer-only profile-enabled fixture and long-horizon diagnostic.

## Forbidden implementation

- no default/inferred Region target or amount;
- no direct `Faction.resources` debit/gain;
- no organization/grievance/influence scalar effect;
- no generic mobilization/political/effort meter;
- no direct crisis creation/deletion;
- no direct T021 combat bonus or intent shortcut;
- no Conflict resolution shortcut;
- no LandHex mutation/hidden comeback;
- no continuity writer or terminal shortcut;
- no new LOBBY/BARGAIN/ORGANIZE content;
- no chooser priority/threshold rewrite;
- no arbitrary cooldown/countdown/expiry;
- no repeated lifecycle/Agenda display counted as pacing;
- no War-as-Politics, V02/UI, runtime LLM/solver;
- no Gate 1F PASS or F05_FIX14 self-authorization.

## Required classification

Exactly one:

```text
TARGETED_COMMITMENT_VERTICAL_SLICE_MEANINGFUL
TARGETED_COMMITMENT_KERNEL_IMPLEMENTED_BUT_LATE_REASSESSMENT_UNCHANGED
TARGETED_COMMITMENT_KERNEL_BLOCKED
```

Required readiness:

```text
NEXT_IMPLEMENTATION_READINESS:
  COMMITMENT_CONSEQUENCE_OR_LIFECYCLE_REVIEW
  NONE
```

## Repository-root / Codex Desktop freshness guard

The real repository is the nested `TooManyRevolutions` directory.

Use this order:

```text
1. externally synchronize the real nested repo
2. verify exact master SHA
3. start a fresh Codex Desktop thread/worktree
4. verify fresh HEAD and origin/master
5. execute F05_FIX13 only
```

If parent `Game-TMR` shows `TooManyRevolutions/` as untracked:

```bash
cd TooManyRevolutions
```

Never modify/reset/configure the parent empty repository.

Before execution:

```bash
git status
git rev-parse HEAD
git rev-parse origin/master
```

Proceed only when working tree is clean and both SHAs equal the exact current GitHub master activation SHA supplied by ChatGPT/user.

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
# focused F05_FIX13 inspection/tests
pnpm test
git diff --check
```

Report known Vitest `onTaskUpdate` runner/IPC errors separately from assertion status.

## Completion

On completion:

- `F05_FIX13: COMPLETE / AWAITING_CHATGPT_REVIEW` or truthful blocked state;
- `LAST_COMPLETED_TASK_ID: F05_FIX13`;
- `NEXT_AUTHORIZED_TASK_ID: NONE`;
- `NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW`;
- `CURRENT_TASK_FILE: NONE`;
- keep Gate 1F `NOT_READY`;
- keep V02 `NOT STARTED`;
- do not authorize F05_FIX14.

Execute only `docs/bridge/tasks/F05_FIX13.md`.
