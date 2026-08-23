# TMR Laptop → Desktop Migration Guide

**Checkpoint:** F04C-R PASS / F04D READY but NOT STARTED  
**Purpose:** reproduce the reviewed laptop worktree on another machine without depending on the old ChatGPT conversation.
**Remote source of truth:** `https://github.com/sionchu/TooManyRevolutions` (`PRIVATE`)  
**First reviewed checkpoint:** `master` at `cfa38907973f239c4a8260a0a82fe7ff748e9f73`

## 1. Source of truth

Preferred authority order:

    remote Git repository
    → reviewed commit/checkpoint
    → latest handoff documents
    → older conversation/context

Copied working directories must not become competing long-term sources of truth.

The reviewed F04C-R worktree is now published to the private repository above. `master` tracks `origin/master`; the first source checkpoint is the commit recorded above. Later migration-document-only commits do not change the F04C-R gameplay/source boundary.

## 2. Laptop-side checklist

Run from the repository root:

    git status --short --branch
    git branch --show-current
    git rev-parse --verify HEAD
    git log -1 --oneline --decorate
    git remote -v
    git diff --stat
    git diff --name-only
    git ls-files
    node --version
    pnpm --version

Expected published state: branch `master`, upstream `origin/master`, private remote `sionchu/TooManyRevolutions`, and a clean worktree.

Run the repository checks:

    pnpm install --frozen-lockfile
    pnpm run format
    pnpm run typecheck
    pnpm run lint
    pnpm run build
    pnpm run inspect:t024
    pnpm run inspect:v01
    pnpm run inspect:f01
    pnpm test

Do not use git reset --hard, git clean -fd, branch deletion, history rewriting, or force-push. The initial snapshot was reviewed for generated paths, secrets, binaries, and unusually large files before publication.

## 3. Files not to migrate manually

The repository confirms these are regenerable or cache-only:

- node_modules/ — regenerate with pnpm install --frozen-lockfile.
- dist/ — regenerate with pnpm run build.
- .pnpm-store/ — pnpm cache; not required for the clone.
- .vite/ and similar tool caches — regenerate as needed.

The source, docs/, package.json, pnpm-lock.yaml, pnpm-workspace.yaml, TypeScript/Vite/Vitest config, and AGENTS.md are migration-relevant.

## 4. Local-only and secret-safe inventory

- No .env or .env.local file was found in the repository scan.
- No credential-bearing local configuration is required by the current scripts.
- No real secret value is recorded here.
- A local pnpm cache exists at .pnpm-store/, but it does not need to be copied.
- If a future machine adds local configuration, document only its filename, purpose, and whether a template exists; never copy secret values into handoff files.

## 5. Desktop setup — clone route

Authenticate GitHub CLI to an account with access to the private repository, then run:

    gh repo clone sionchu/TooManyRevolutions TooManyRevolutions
    Set-Location TooManyRevolutions
    git checkout master
    git log -1 --oneline --decorate
    node --version
    pnpm --version
    pnpm install --frozen-lockfile
    pnpm run format
    pnpm run typecheck
    pnpm run lint
    pnpm run build
    pnpm run inspect:t024
    pnpm run inspect:v01
    pnpm run inspect:f01

The laptop observed Node v24.19.0 and pnpm 11.19.0; use those versions or the project's compatible maintained equivalents, then record any difference. The lockfile is the dependency authority.

Verify that the cloned history contains first checkpoint `cfa38907973f239c4a8260a0a82fe7ff748e9f73`. Use the latest `origin/master` migration-document commit as the desktop checkout target; do not copy the laptop worktree over the clone.

## 6. Verification baseline

Known F04C-R baseline:

- pnpm run format: PASS.
- pnpm run typecheck: PASS.
- pnpm run lint: PASS.
- pnpm run build: PASS.
- pnpm run inspect:t024: PASS.
- pnpm run inspect:v01: PASS.
- pnpm run inspect:f01: PASS.
- Extended-timeout full tests: 50 files / 410 tests PASS.

The default pnpm test command uses Vitest's default 5-second per-test timeout while excluding some long inspection files. In the F04C-R verification run, two existing long-running inspection tests (f04aEndogenousFactionDynamicsInspection.test.ts and t017InstabilityInspection.test.ts) exceeded that limit; the run had 408/410 passing and timeout failures, not assertion failures. Re-running the same suite with the repository-appropriate command-line extension:

    pnpm test -- --testTimeout=30000 --maxWorkers=1

produced 50 files / 410 tests PASS. Do not change the repository-global timeout merely to hide this behavior; report both results if it recurs.

Migration-prep rerun note (2026-08-24): the default command produced 407/410 passing with three timeout failures. A focused non-fork run of the four long inspection files with `testTimeout=60000` and `maxWorkers=1` completed with 4 files / 6 tests PASS.

Git-checkpoint rerun note (2026-08-24): the default command produced 406/410 passing with four timeout failures: one F03B test at 15 seconds, two F04A tests at 5 seconds, and the T017 inspection at 5 seconds. There were no assertion failures. A focused single-worker run of those three files with `testTimeout=60000` completed with 3 files / 5 tests PASS. Format, typecheck, lint, build, `inspect:t024`, `inspect:v01`, and `inspect:f01` passed. The F01 authoritative result was unchanged; this run measured the 40-year case at 14.4 seconds and flagged it for performance observation. Recheck timing on the desktop without changing gameplay or global test timeouts during migration.

## 7. Desktop readiness gate

Do not begin F04D until all are true:

- expected branch and reviewed commit are checked out;
- dependencies install from pnpm-lock.yaml;
- typecheck, lint, build, and relevant inspections pass;
- default test timeout behavior is understood and any extended run is reported;
- the three handoff bundle files are present;
- F04C-R = PASS, politicalCompetition = ADD, and F04D = READY / NOT STARTED are confirmed;
- no F04D source schema/gameplay work has slipped into the migration.

## 8. Handoff bundle

Attach/read these files in a new desktop ChatGPT/Codex conversation:

1. docs/handoff/TMR_HANDOFF_MASTER_2026-08-24_F04CR_COMPLETE.md
2. docs/handoff/TMR_CURRENT_TASK_F04D_2026-08-24.md
3. docs/handoff/TMR_NEW_CHAT_BOOTSTRAP_2026-08-24_F04CR_COMPLETE.md

This migration README is operational support; the master handoff and current-task file are the project context.

## 9. Desktop verification — 2026-08-24

- Desktop OS: Microsoft Windows 11 Pro, build 26200.
- Runtime: Node v24.19.0 and pnpm 11.19.0.
- Verified base checkpoint: `7ebdadeb7df729fc65f12ae6b53dbc30dc14d7d4` on `master`, matching `origin/master` before this documentation update.
- `pnpm install --frozen-lockfile`, format, typecheck, lint, build, T024, V01, and F01 passed without gameplay/source changes.
- The first default test attempt ended in a transient Vitest worker `ERR_IPC_CHANNEL_CLOSED`; an unchanged immediate rerun passed 50 files / 410 tests, with zero assertion failures. The focused single-worker run passed 3 files / 5 tests.
- F01 preserved the authoritative 40-year result and completed 14,400 ticks in 4.269 seconds, compared with the laptop's 14.4-second migration baseline. No residual performance blocker was observed.
- F04D remained not started during desktop verification.
