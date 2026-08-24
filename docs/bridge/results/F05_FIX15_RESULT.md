# F05_FIX15 Result

```text
TASK_ID: F05_FIX15
STATUS: COMPLETE / AWAITING_CHATGPT_REVIEW
START_BRANCH: master
START_COMMIT: 7c690dcf1dea32fc57852d1412891cfc055a80bc
BASE_TASK_COMMIT: 8fd27058c95c75f55efda8612bd40a0befe81d67
TASK_RESULT_COMMIT: 3489927c5ba67095b6f58b9292e017affeacf659
END_COMMIT: 3489927c5ba67095b6f58b9292e017affeacf659
COMMIT_POLICY: COMMIT_AND_PUSH_ON_PASS
COMMIT_CREATED: YES
PUSHED: YES
```

## Outcome

F05_FIX15 completed the War-as-Politics grounding gate and selected the
smallest honest classification for the F05_FIX9 active-conflict equilibrium.
No production conflict gameplay was implemented.

```text
PRIMARY_CLASSIFICATION: WAR_POLITICS_REQUIRES_NEW_AUTHORITATIVE_DOMAIN
COUP_CURRENT_STATE_SUFFICIENT: NO
COUP_REQUIRES_NEW_COORDINATION_DOMAIN: YES
REBELLION_CURRENT_STATE_SUFFICIENT: NO
REBELLION_REQUIRES_SETTLEMENT_OR_PERSISTENCE_DOMAIN: YES
SHARED_CONFLICT_OBJECTIVE_SCHEMA_REQUIRED: NO
MOBILIZATION_FINANCE_RELEVANT_TO_CURRENT_BLOCKER: NO
OCCUPATION_DISPLACEMENT_RELEVANT_TO_CURRENT_BLOCKER: NO
NEXT_IMPLEMENTATION_READINESS: NEW_DOMAIN_GROUNDING_REQUIRED
```

The representative seed `40103`, horizon `1800d` F05_FIX9 replay reproduced:

- EARLY freeze `t=870`: country-controlled LandHexes `0`, active rebellion
  `0front / NO_ACTIVE_FRONT_EDGE`, active coup `0front /
  COUP_HAS_NO_TERRITORIAL_WRITER`, valid current Government, active run;
- NEAR_CRISIS freeze `t=330`: the same continuity and front boundary with the
  corresponding active rebellion/coup participants;
- final active conflicts `2`, `OUTCOME_GAP=YES`,
  `ACTIVE_CONFLICT_EQUILIBRIUM=YES`, historical F05 unchanged;
- state-grounded reassessment silence `1200d`, post-intervention late silence
  `1110d`, non-accept divergences `0`, identical reopen churn `0`, legitimate
  reopens `2`.

The conclusion is mechanism-specific. T021 deliberately has no territorial
intent for a coup, while current TMR has no authoritative coordination or
seizure provenance from which to derive a nonterritorial coup outcome. The
rebellion has current eligibility/control readers, but no security,
settlement, demobilization, or persistence evidence that could distinguish
termination from a missing front. Existing `ConflictOutcome` is an explicit
result sink, not an outcome producer. A shared objective field alone would
not supply either missing mechanism and would risk becoming a hidden story
goal or timer.

The complete mechanism matrix, ConflictKind separation, candidate seam audit,
and perturbation evidence are in:

- `docs/F05_FIX15_WAR_AS_POLITICS_GROUNDING.md`

## Required counterfactuals and architecture boundaries

The existing F05_FIX14 targeted-v2/lifecycle checks were rerun as part of the
F05_FIX15 verification boundary; no FUND_MOVEMENT code was extended.

- Direct business-invalid targeted-v2 atomicity: focused test `1 file / 8
  tests` passed. Profile-target mismatch, amount mismatch, missing/foreign
  target, insufficient resources, active duplicate, terminal state, and
  legacy v1 behavior were covered. Invalid applications left strategy,
  commitment state, and success events unchanged.
- No-response counterfactual: `1200d`, no player response, resolutions `none`,
  active commitments `2`, duplicate/reopen churn `0`.
- Existing player-response counterfactual: response tick `32`, lifecycle
  resolution tick `60` with `actorIntentCeased`, observed duration `29`,
  available resources `0.5 -> 0.8`, Agenda cause `present -> absent`, and one
  later state-grounded recommitment at tick `211`.
- Timer/cooldown/countdown and `currentStrategy` lifecycle dependencies:
  `false` / `false`.
- Uninterrupted versus save/load replay and insertion-order equality: covered
  by the focused F05_FIX14 V6 test and T024 inspection; all equal.
- Historical F05 baseline: unchanged. F05_FIX9 remains `1110/1200` with
  `108/108` branches and late population `6`; F05_FIX13 remains unchanged.
- Forbidden writers: `none` in the F05_FIX14 lifecycle inspection, and no
  production source file was changed by F05_FIX15.

The F05_FIX9 inspection's historical report retains its own
`PERSISTENCE_FORMAT: V4_UNCHANGED` label for that earlier baseline. Current
runtime persistence remains `SerializedSimulationSnapshotV6 / format version
6`, confirmed by T024 and the F05_FIX14 checks; F05_FIX15 did not change it.

## Verification

| command | result |
|---|---|
| `pnpm install --frozen-lockfile` | exit `0`; dependencies already up to date |
| `pnpm run format` | exit `0`; Prettier check passed |
| `pnpm run typecheck` | exit `0` |
| `pnpm run lint` | exit `0` |
| `pnpm run build` | exit `0`; Vite production build completed |
| focused F05_FIX14 lifecycle test | exit `0`; `1 file / 8 tests` passed |
| `pnpm run inspect:t024` | exit `0`; `1 test` passed; snapshot V6, roundtrip, save/load replay, derived-state, terminal, corruption, and ordering checks passed |
| `pnpm run inspect:f05` | exit `0`; `MIXED_GAP`, `F05 RECOMMENDATION: NOT_READY` |
| `pnpm run inspect:f05fix9` | exit `0`; `LATE_STEADY_STATE_MIXED_CAUSE`, active-conflict equilibrium, outcome gap, `1110/1200`, baseline unchanged |
| `pnpm run inspect:f05fix14` | exit `0`; no-response, existing-response, resource restoration, re-entry, timer, duplicate, and forbidden-writer checks completed |
| `pnpm test` | assertion result `59 files / 477 tests passed`; process exit `1` because Vitest reported 3 existing `[vitest-worker]: Timeout calling "onTaskUpdate"` unhandled runner errors |
| `git diff --check` | exit `0` |
| focused document Prettier check | exit `0` |

The full test run has no failed assertions. Its process-level nonzero result is
reported separately from the `477/477` assertion result because the same
Vitest worker/IPC `onTaskUpdate` error is the known repository test-runner
condition.

## Bridge completion state

```text
LAST_COMPLETED_TASK_ID: F05_FIX15
NEXT_AUTHORIZED_TASK_ID: NONE
NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW
CURRENT_TASK_FILE: NONE
GATE1F_CHATGPT_DECISION: NOT_READY
V02: NOT_STARTED
F05_FIX16: NOT_AUTHORIZED
```

F05_FIX15 stops at grounding, result documentation, commit, and push. It does
not authorize F05_FIX16, Gate 1F PASS, V02, or a production conflict
implementation.
