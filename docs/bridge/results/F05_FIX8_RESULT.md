# F05_FIX8 Result — Proposal Lifecycle Semantics + Non-Accept Audit

TASK_ID: `F05_FIX8`
STATUS: `COMPLETE / AWAITING_CHATGPT_REVIEW`
START_BRANCH: `master`
START_COMMIT: `c8e43097b4e1135cdbf56389cd5c24da7e659607`
BASE_TASK_COMMIT: `dbd39ff9e5fdc22a29cef1157399a634a0fa7701`
IMPLEMENTATION_COMMIT: `89f350bd67ced8e49c161f95fa5e2a1c94066d42`
END_BRANCH: `master`
END_COMMIT: `89f350bd67ced8e49c161f95fa5e2a1c94066d42`
COMMIT_POLICY: `COMMIT_AND_PUSH_ON_PASS`
COMMIT_CREATED: `YES`
PUSHED: `YES`

## Required result fields

```text
NON_ACCEPT_DIVERGENCE: ORCHESTRATION_ARTIFACT_FIXED
RECONSIDERATION_MODEL: IMPLEMENTED_STATE_GROUNDED
PERSISTENCE_FORMAT: V4
IDENTICAL_REOPEN_CHURN: CLOSED
LEGITIMATE_REOPEN_EVIDENCE: YES
HISTORICAL_F05_BASELINE: UNCHANGED
READY_FOR_F05_PROMOTION: NO
GATE1F_RECOMMENDATION: NOT_READY
V02: NOT_STARTED
```

## Phase A — eight-branch causal audit

The pre-fix probe enumerated exactly four `PROPOSAL_IGNORE` and four
`PROPOSAL_REJECT` branches. Each was classified
`MEASUREMENT_SIGNATURE_ARTIFACT`: ActionRecord order, carried faction actions,
authoritative core state, intervention state, and Agenda inputs stayed equal at
the first divergence; proposal lifecycle state was the only added runtime
state. Historical F05 and FIX7 no-template paired controls stayed equal.

The developer observer was then aligned with the official F05 30-day pacing
event-cluster rule. The rerun reports:

```text
historical baseline=NOT_READY branches=36
pre-fix observed divergences=8 ignore=4 reject=4
post-fix divergences=0 ignore=0 reject=0
PHASE_A=ORCHESTRATION_ARTIFACT_FIXED
```

Detailed branch evidence is in
`docs/F05_FIX8_NON_ACCEPT_DIVERGENCE_AUDIT.md`.

## Phase B/C — lifecycle and persistence

- stable demand identity is `proposerFactionId + countryId + subjectKind + interventionId`;
- an explicit REJECT stores captured Government, feasibility boolean, and
  sorted discrete failure classes;
- unchanged basis does not reopen; Government or requested-intervention
  feasibility-basis change can open a new episode;
- IGNORE remains one open episode maximum and ACCEPT keeps the existing
  intervention provenance;
- authoritative persistence is `SerializedSimulationSnapshotV4`, with strict
  V3 rejection and no migration;
- proposal events remain outside `F05_PACING_EVENT_TYPES`.

The focused lifecycle CLI passes all nine checks: unchanged basis, Government
change, feasibility change, unrelated scalar drift, IGNORE, ACCEPT provenance,
insertion-order determinism, V4 save/load, and V3 rejection.

## Long-horizon evidence

The F05_FIX7-style matrix is complete at `36 historical + 108 proposal =
144/144` branches. The historical baseline is unchanged and remains
`NOT_READY`.

```text
state-grounded max reassessment silence: 1200d
proposal-decision max silence: 1800d
post-intervention late state-grounded silence: 1110d
IGNORE non-accept effects: 0
REJECT non-accept effects: 0
ACCEPT state-grounded effects: 18
identical-basis reopens: 0
legitimate reopens: 2
response dominance: MIXED
```

The two legitimate transitions are the same Government moving from
`feasible` to `INSUFFICIENT_ADMINISTRATIVE_HEADROOM`, then back to `feasible`
in the repeated-accommodation probe. No cooldown, expiry, scalar hash, or
Agenda eligibility was used.

## Verification evidence

Executed commands and observed results:

- `git fetch origin` / `git pull --ff-only` — PASS; requested gate SHA matched
  `c8e43097b4e1135cdbf56389cd5c24da7e659607`;
- `pnpm install --frozen-lockfile` — PASS;
- `pnpm run format` — PASS;
- `pnpm run typecheck` — PASS;
- `pnpm run lint` — PASS;
- `pnpm run build` — PASS;
- `pnpm run inspect:t024` — PASS; snapshot/replay reports version 4;
- `pnpm run inspect:f01` — PASS;
- `pnpm run inspect:f04b` — PASS;
- `pnpm run inspect:f04d` — PASS;
- `pnpm run inspect:f05` — PASS; historical recommendation remains
  `NOT_READY`;
- `pnpm run inspect:f05fix8lifecycle` — PASS; 9/9 counterfactuals;
- `pnpm run inspect:f05fix8audit` — PASS; Phase A artifact fixed, 0 post-fix
  non-accept divergences;
- `pnpm test` — PASS; 55 files / 447 tests;
- `git diff --check` — PASS.

Gate 1F remains a ChatGPT/user review decision. This task does not promote F05
or start V02.

