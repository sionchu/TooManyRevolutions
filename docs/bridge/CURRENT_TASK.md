# TMR Current Bridge Task

TASK_ID: F05_FIX11
STATUS: AUTHORIZED
BASE_BRANCH: master
TASK_COMMIT: fd8dc4f98a1813a5d0f5848232fbffac3131b600
STATE_ACTIVATION_COMMIT: 6374b1afbd42aae22c0c13722a15842c7c72450c
TASK_FILE: docs/bridge/tasks/F05_FIX11.md
COMMIT_POLICY: COMMIT_AND_PUSH_ON_PASS
RESULT_PATH: docs/bridge/results/F05_FIX11_RESULT.md

## Mission summary

F05_FIX10 is reviewed/accepted as `COVERAGE_REQUIRES_ACTION_SCHEMA_TARGETING`. The exact six late branches produced 372/372 `FUND_MOVEMENT` selections, with LOBBY and ORGANIZE at 0/372. F05_FIX11 must ground the smallest honest target + actor-owned commitment contract before any production schema/effect implementation.

The task is **grounding/design only**.

Required order:

1. read the immutable F05_FIX11 task and its fixed six-source external grounding pack;
2. reconcile the source claims with F05_FIX5, F05_FIX9, F05_FIX10 and current source code;
3. define the exact semantic meaning of `FUND_MOVEMENT` rather than relying on the label;
4. evaluate target domains (`RegionId`, explicit Region set, Country-wide, another existing object, or none);
5. decide whether existing `Faction.resources` can be reserved/spent/earmarked honestly, or whether the mechanism would require a forbidden/new effort domain;
6. classify the amount-authoring seam without selecting a number;
7. identify the first legitimate non-war/non-terminal consumer boundary;
8. determine whether a state-grounded lifecycle/repeat boundary is designable without cooldown/countdown;
9. specify persistence/replay implications without changing V4;
10. select exactly one F05_FIX11 primary classification and implementation-readiness value;
11. do not implement the direction in this task.

## Fixed external source pack

The immutable task contains conservative claim boundaries for:

- McCarthy & Zald (1977), DOI `10.1086/226464`;
- Jenkins (1983), DOI `10.1146/annurev.so.09.080183.002523`;
- McCarthy & Wolfson (1996), DOI `10.2307/2096309`;
- Hunter & Staggenborg (1986), DOI `10.1016/0362-3319(86)90033-9`;
- Cress & Snow (1996), DOI `10.2307/2096310`;
- Ganz (2000), DOI `10.1086/210398`.

Codex does not need internet access to use these authorized claim boundaries. If internet is unavailable, do not fabricate additional source claims.

## Key constraints

- No production `FactionActionPayload` change.
- Do not add `targetRegionId` or another runtime target field yet.
- `RegionId` is a candidate, not a pre-decided answer.
- Never use LandHex as the default political-mobilization target.
- Do not infer target from highest unrest/radicalism/organization, sort order, faction name, ideology label, conflict front, or fixture layout.
- No authoritative commitment record/resolver.
- No resource debit/reservation/earmark writer.
- No numeric cost/effect/duration/conversion ratio.
- No state-derived amount formula for convenience.
- No combat-strength bonus, crisis writer, conflict resolution, LandHex change, continuity writer, terminal shortcut, or hidden recovery.
- No second LOBBY template, BARGAIN, ORGANIZE consequence, chooser rewrite, generic mobilization/political mana, cooldown/countdown, War-as-Politics implementation, V02/UI, or runtime LLM solver.
- Do not self-authorize Gate 1F PASS or F05_FIX12.

## Required primary classification

Exactly one:

```text
FUND_MOVEMENT_TARGET_AND_COMMITMENT_GROUNDED
FUND_MOVEMENT_TARGET_SCHEMA_ONLY_GROUNDED
FUND_MOVEMENT_TARGET_GROUNDED_COMMITMENT_BLOCKED
FUND_MOVEMENT_REQUIRES_NEW_AUTHORING_SEAM
FUND_MOVEMENT_GROUNDING_INSUFFICIENT
```

Required readiness:

```text
NEXT_IMPLEMENTATION_READINESS:
  TARGET_SCHEMA_ONLY
  TARGET_PLUS_COMMITMENT_LIFECYCLE
  NONE
```

The classification is not authorization to implement it.

## Required documents

- `docs/F05_FIX11_FUND_MOVEMENT_GROUNDING.md`
- `docs/bridge/results/F05_FIX11_RESULT.md`
- update `docs/FACTION_INTERNAL_COMMITMENT_KERNEL.md` only if `TARGET_PLUS_COMMITMENT_LIFECYCLE` is genuinely grounded; keep it design-only.

## Repository-root guard

The real repository is the nested `TooManyRevolutions` directory.

If Codex starts in parent `Game-TMR` and `TooManyRevolutions/` appears untracked:

```bash
cd TooManyRevolutions
```

before any Git/task work. Never commit/reset/configure the parent empty repository.

## Freshness

Preferred:

```bash
git status
git fetch origin
git rev-parse HEAD
git rev-parse origin/master
git pull --ff-only
```

If outbound HTTPS is unavailable inside Codex, do not create a branch/reset/rebase to bypass it. Proceed only after the user/ChatGPT externally synchronizes the real nested repository and confirms the current GitHub master SHA, with:

```text
working tree clean
HEAD == origin/master == confirmed GitHub master
CURRENT_TASK = F05_FIX11
```

If not, stop and report freshness failure.

## Verification

Follow the immutable task, including:

```bash
pnpm install --frozen-lockfile
pnpm run format
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm run inspect:f05
pnpm run inspect:f05fix9
pnpm run inspect:f05fix10
# focused F05_FIX11 inspection/test only if developer-only code was added
pnpm test
git diff --check
```

If the known Vitest `[vitest-worker]: Timeout calling "onTaskUpdate"` runner/IPC error reproduces after assertions pass, report assertion and runner status separately. Do not modify gameplay to address it.

## Completion

On completion:

- `F05_FIX11: COMPLETE / AWAITING_CHATGPT_REVIEW` or truthful blocked state;
- `LAST_COMPLETED_TASK_ID: F05_FIX11`;
- `NEXT_AUTHORIZED_TASK_ID: NONE`;
- `NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW`;
- `CURRENT_TASK_FILE: NONE`;
- `GATE1F_CHATGPT_DECISION: NOT_READY`;
- `V02: NOT STARTED`;
- no production implementation of the selected direction;
- do not authorize F05_FIX12.

Execute only `docs/bridge/tasks/F05_FIX11.md`.
