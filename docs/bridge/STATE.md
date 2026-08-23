# TMR Bridge State

UPDATED: 2026-08-24

REPOSITORY: sionchu/TooManyRevolutions

BRANCH: master

F04_CLOSED_COMMIT: 2db9ccd43b09bc4f24bb6980b5bd200b5464c5fc

F05_MEASUREMENT_COMMIT: 1866287e87072fc9b62f55a4af940f9d0e54b15b

GATE1F_REVIEW_COMMIT: 2423e629b018052d24f495793e10803cd5a0f837

CURRENT_GATE: Gate 1F

CURRENT_PHASE: F05_FIX1 recovery + pacing repair

F04: CLOSED / PASS

F05: MEASUREMENT_COMPLETE / REVIEWED

F05_RECOMMENDATION: NOT_READY

GATE1F_CHATGPT_DECISION: NOT_READY

F05_FIX1: AUTHORIZED / NOT STARTED

V02: NOT STARTED

POLITICAL_COMPETITION: IMPLEMENTED — `banned | restricted | plural`

PERSISTENCE: SerializedSimulationSnapshotV2

LAST_COMPLETED_TASK_ID: F05

NEXT_AUTHORIZED_TASK_ID: F05_FIX1

NEXT_TASK_STATUS: AUTHORIZED

CURRENT_TASK_FILE: `docs/bridge/tasks/F05_FIX1.md`

LAST_RESULT_FILE: `docs/bridge/results/F05_RESULT.md`

FUTURE_REFERENCE_GROUNDING_GATES: `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`

## Gate 1F blockers being repaired

1. Active-conflict/recovery has only one meaningfully beneficial required response; WAIT is weakly dominant there.
2. Representative five-year branches contain long gaps between major pacing/decision events (`1,695–1,787` days).
3. The exact F05 five-year matrix must be rerun after the narrow repair.

The repair must first classify the silence as `MEASUREMENT_GAP`, `SIMULATION_GAP`, or `MIXED_GAP`; it may not manufacture filler events merely to satisfy the harness.

## External-reference / grounding guardrail

`F05_FIX1` must read and obey `docs/FUTURE_REFERENCE_GROUNDING_GATES.md` and reuse the F04C-R mechanism-first grounding method.

- research is demand-driven;
- use existing F04C-R political grounding before seeking new references;
- if existing grounding is insufficient, report `INSUFFICIENT_REFERENCE_GROUNDING` rather than inventing a mechanism;
- if new external research is genuinely required, separate source-supported fact, interpretation, and TMR inference;
- War as Politics, Fantasy institutional politics, and Gate 1V visual work remain out of scope.

## Scope boundaries

Authorized:

- diagnose and narrowly repair Gate 1F recovery choice coverage;
- diagnose and narrowly repair genuine pacing/decision silence using existing systems;
- improve F05 developer measurement only when a real player-relevant existing signal was previously omitted;
- rerun the same F05 matrix;
- write `docs/bridge/results/F05_FIX1_RESULT.md` and update Bridge completion state.

Forbidden:

- V02 / renderer / UI;
- War as Politics;
- fantasy/arcane institutions;
- elections / parties;
- full labor bargaining;
- transitional justice;
- military factions;
- local autonomy;
- generic political meters;
- story scheduling/countdowns/filler events;
- RNG added for diversity;
- self-authorizing Gate 1F PASS or the next task.

Gate 1F remains ChatGPT/user authority. Repository source, tests, and diffs remain the highest authority.