# F03B Agency Leverage / Threshold Sensitivity Diagnosis

## Scope

F03B는 F03A의 `PLAYER_AGENCY_WEAK` 결과를 balance 수정 없이 진단했다.
기존 F03 harness를 그대로 사용해 `gate1f.validation`, seed `40103`, day 0/90/180
natural WAIT checkpoint, `WAIT + short/long/prerequisite`, branch당 10년을
실행했다. 모든 branch는 `runSimulationStep → commitSimulationStep` canonical
path를 통과했다. 매일의 전체 WorldState를 저장하지 않고 T018/T016/T021 경계,
completion, event, annual checkpoint와 compressed eligibility window만 보존했다.

Production simulation, threshold, effect magnitude, cost, duration, cadence, RNG,
conflict, Government, T022/T023 rule은 변경하지 않았다.

## Actual cadence

- T018 prerequisite read/detector: branch당 3,600 daily evaluations
- T016 faction political boundary: 120 monthly boundaries (day 0 checkpoint),
  515 at natural checkpoints whose calendar offset begins mid-month
- T021 territorial resolution: 514 weekly boundaries (day 0), 515 at day 90/180
- Completion: short relative day 2, long/prerequisite relative day 181

Margin은 기존 `CrisisGate`의 numeric `value - threshold`로 표시했다. Boolean gate는
margin을 만들지 않았다. T018의 numeric gates는 모두 `value >= threshold` semantics다.

## Diagnosis matrix

| Checkpoint | Intervention | Leverage | Eligibility window | History opportunity | Primary diagnosis |
| --- | --- | --- | --- | --- | --- |
| A / day 0 | short | WEAK | none | PRESENT | EFFECT_TOO_LATE, active conflict; material effect is `NO_PROBLEM` for T018 |
| A / day 0 | long | STRONG | coup `181–3600` / 3,420 detector evaluations | PRESENT | EFFECT_TOO_LATE + CONFLICT_DEDUP_OR_ACTIVE_STATE_BLOCKS_DIFFERENCE |
| A / day 0 | prerequisite | STRONG | rebellion `181–3600` / 3,420 detector evaluations | PRESENT | EFFECT_TOO_LATE + CONFLICT_DEDUP_OR_ACTIVE_STATE_BLOCKS_DIFFERENCE |
| B / day 90 | short | WEAK | none | ABSENT | active conflict + NO_POLITICAL_DECISION_OPPORTUNITY + fixture too far; material effect is `NO_PROBLEM` for T018 |
| B / day 90 | long | STRONG | coup `181–3600` / 3,420 detector evaluations | PRESENT | active conflict blocks a new political history event |
| B / day 90 | prerequisite | STRONG | rebellion `181–3600` / 3,420 detector evaluations | PRESENT | active conflict blocks a new political history event |
| C / day 180 | short | WEAK | none | ABSENT | active conflict + NO_POLITICAL_DECISION_OPPORTUNITY + fixture too far; material effect is `NO_PROBLEM` for T018 |
| C / day 180 | long | STRONG | coup `181–3600` / 3,420 detector evaluations | PRESENT | active conflict blocks a new political history event |
| C / day 180 | prerequisite | STRONG | rebellion `181–3600` / 3,420 detector evaluations | PRESENT | active conflict blocks a new political history event |

### T017 response

`short` completion changes the industrial Region food production capacity by `+6`.
At the measured branch checkpoints this produced:

- scarcity: `-0.500` vs WAIT, persistent through the 10-year horizon;
- material pressure: `-0.500` vs WAIT;
- unrest: approximately `-0.006` at day 30, `-0.012` at day 180, and
  `-0.013` by one year/horizon;
- State A country instability: immediate approximately `-0.019`, then `0` delta
  after territorial control moved away; the other checkpoints had no persistent
  national instability delta because the player no longer controlled the relevant
  Region for aggregation.

This is consistent with T017's daily smoothing (`riseRate 0.02`, `recoveryRate
0.015`). The effect persists in the Region state but does not cross a T018 gate in
this fixture. F03B classifies that as a material/T017 effect with no expected direct
T018 gate divergence, not as a missing resource consumer.

### T018 margin evidence

At completion, `long` changes the coup faction organization from `0.800` to `0.500`.
The organization gate margin moves from `+0.200` to `-0.100`, so coup eligibility
changes. `prerequisite` changes the rebellion faction grievance from `0.800` to
`0.500`; its grievance margin moves from `+0.250` to `-0.050`, so rebellion
eligibility changes. Other current gates remain available in the observed
completion snapshot; `OTHER_PREREQUISITE_DOMINATES` was not the primary finding for
these two effects.

The changed eligibility is real, but an already active conflict exists at the
relevant branch boundary. T018/T021 therefore does not create a second conflict
history from the changed prerequisite. In State A, the first political event occurs
at day 1, before the long/prerequisite completion at relative day 181.

### T022 blocker evidence

At the one-year checkpoint all branches remain consolidation-ineligible. The
observed failed criteria are:

- `stableRegions`
- `capitalControl`
- `coreTerritory`

State capacity remains above the configured minimum (margin `+20`); treasury is not
the blocker at the one-year diagnostic point. No active civil war is present. F03B
did not write consolidation progress or alter the criteria.

## Optional sensitivity probes

Developer-only scenario clones used the same action/effect pipeline with completion
effect scales `0.5x / 1x / 2x / 4x`. Production content was not changed.

| Effect | 0.5x | 1x | 2x | 4x | Political history |
| --- | --- | --- | --- | --- | --- |
| long / coup organization | no eligibility delta | coup `-1` | coup `-1` | coup `-1` | unchanged at every scale |
| prerequisite / rebellion grievance | no eligibility delta | rebellion `-1` | rebellion `-1` | rebellion `-1` | unchanged at every scale |

The current `1x` values are already sufficient to cross the relevant T018
eligibility boundary. Increasing magnitude does not create history divergence in
this fixture because active-conflict/dedup and timing dominate the history path.

## F02/F03A relationship

F03B is measurement-only. It does not alter the WAIT branch or F03A effect
application. F02's seed-insensitive WAIT result, F03A exactly-once effects, and
persistence/replay contracts remain regression obligations and are re-run in the
task verification.

## Decision

- `PLAYER_AGENCY_WEAK` remains the evidence-based F03 classification.
- Primary causes are timing/active-conflict blocking for long/prerequisite and lack
  of a future political decision opportunity for short at the post-crisis
  checkpoints.
- `OTHER_PREREQUISITE_DOMINATES`, cadence-missed window, and trajectory
  reconvergence were not the primary causes in this matrix.
- F04 is `READY` in the narrow diagnostic sense: long/prerequisite change an actual
  T018 decision boundary. F04 must preserve the caveat that the current fixture's
  active conflict can hide event-history differences.
- No threshold, effect amount, balance, or gameplay rule is adopted from this
  diagnosis.

## Verification

- `pnpm test` — PASS (48 files, 393 tests)
- `pnpm run typecheck` — PASS
- `pnpm run lint` — PASS
- `pnpm run format` — PASS
- `pnpm run build` — PASS
- `pnpm run inspect:f03b` — PASS
- `pnpm run inspect:f03` — PASS; `PLAYER_AGENCY_WEAK` retained
- `pnpm run inspect:f02` — PASS; 24/24 WAIT runs remain one exact/coarse
  signature cluster with no seed sensitivity
- `pnpm run inspect:f01` — PASS; 40-year WAIT run remains active with the
  existing political/territorial baseline
- `pnpm run inspect:t024` / `pnpm run inspect:v01` — PASS

F03B remains measurement-only. No balance, gameplay, F04, or V02 work was
started.
