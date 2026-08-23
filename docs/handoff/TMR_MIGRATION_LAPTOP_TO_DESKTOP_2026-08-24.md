# TMR Laptop → Desktop Migration Guide

**Checkpoint:** F04C-R PASS / F04D READY but NOT STARTED  
**Purpose:** reproduce the reviewed laptop worktree on another machine without depending on the old ChatGPT conversation.

## 1. Source of truth

Preferred authority order:

    remote Git repository
    → reviewed commit/checkpoint
    → latest handoff documents
    → older conversation/context

Copied working directories must not become competing long-term sources of truth.

Current laptop caveat: this repository currently has no commit and no configured remote. master exists, but its HEAD is absent and all repository files are untracked. Therefore a reproducible git clone is not available until the user creates a reviewed commit and publishes it manually. This task does not commit, push, initialize a remote, or discard files.

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

On the current laptop checkpoint, git rev-parse --verify HEAD, git log, and remote output show that there is no commit/remote. git ls-files reports zero tracked files. Preserve this fact; do not represent the worktree as a pushed checkpoint.

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

Do not use git reset --hard, git clean -fd, branch deletion, history rewriting, or automatic push. Review all untracked files before staging anything.

If the user chooses to create the desktop-clone checkpoint after review, the manual commands are:

    git add --all
    git status --short
    git commit -m "checkpoint: F04C-R complete before desktop migration"
    git remote add origin <REMOTE_URL>
    git push -u origin master

These commands are a user-controlled recommendation only. They were not executed by this task. Do not put credentials in <REMOTE_URL> or in any Markdown file.

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

## 5. Desktop setup — preferred clone route

After a reviewed commit is available on a remote:

    git clone <REMOTE_URL> TooManyRevolutions
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

If the user must transfer the current uncommitted worktree before a remote checkpoint exists, use a reviewed manual file copy as a temporary bridge and exclude the regenerable directories above. Do not call that copy a clone or a reproducible commit. Establish the reviewed Git commit/remote before normal desktop continuation.

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

Migration-task rerun note (2026-08-24): the default command produced 407/410 passing with three timeout failures: f03bAgencyLeverageDiagnosis.test.ts at 15 seconds, f04aEndogenousFactionDynamicsInspection.test.ts at 5 seconds, and t017InstabilityInspection.test.ts at 5 seconds. There were no assertion failures in those reports. Passing the timeout arguments through the package script raised the F03B/F04A limits, but T017 still reported its 5-second timeout and the run ended at 409/410. A focused non-fork run of those four long inspection files with testTimeout=60000 and maxWorkers=1 completed with 4 files / 6 tests PASS and no unhandled errors. The known 50 files / 410 tests PASS baseline above remains the prior F04C-R result; this current timing behavior must be rechecked on the desktop rather than silently called fully green.

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
