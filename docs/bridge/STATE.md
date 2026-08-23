# TMR Bridge State

UPDATED: 2026-08-24

REPOSITORY: sionchu/TooManyRevolutions

BRANCH: master

F04_CLOSED_COMMIT: 2db9ccd43b09bc4f24bb6980b5bd200b5464c5fc

F05_MEASUREMENT_COMMIT: 1866287e87072fc9b62f55a4af940f9d0e54b15b

GATE1F_REVIEW_COMMIT: 2423e629b018052d24f495793e10803cd5a0f837

F05_FIX1_REPAIR_COMMIT: 60c584543f1cfaf89c2066f8060859e7a6d2f103

F05_FIX2_REPAIR_COMMIT: 57bb80db449be0a29cb788e9f49b260eab290416

F05_FIX2_RESULT_COMMIT: cc51ad77d9ffa27afc49f21fe92dc0992e6ac846

F05_FIX2_R_TASK_COMMIT: 8054e99ae12385bb43cd7e30bf480ff9ee930c5c

F05_FIX2_R_PROBE_COMMIT: f9f108696bf2de724428d0d61a8c4ba14935e42e

F05_FIX2_R_RESULT_COMMIT: 1191bd1865200f4542d571a8af493392b075c4bd

F05_FIX3_TASK_COMMIT: dda5949ba70165dd65ac86c48561d82f69b3a375

CURRENT_GATE: Gate 1F

CURRENT_PHASE: F05_FIX3 remove rejected continuity writer + exact F05 remeasurement

F04: CLOSED / PASS

F05: MEASUREMENT_COMPLETE / REVIEWED

F05_FIX1: REPAIR_COMPLETE / REVIEWED

F05_FIX2: REPAIR_COMPLETE / REVIEWED

F05_FIX2_IMPLEMENTATION: PASS

F05_FIX2_MEASUREMENT: TRUSTWORTHY_BUT_TERMINAL_MECHANISM_REJECTED

F05_FIX2_CODEX_RECOMMENDATION: PASS_WITH_NOTES

F05_FIX2_R: REVIEW_COMPLETE / REVIEWED

F05_FIX2_R_COUNTDOWN_CLASSIFICATION: EFFECTIVE_PERMANENCE_TIMER

F05_FIX2_R_RATCHET_CLASSIFICATION: ONE_WAY_CONTINUITY_RATCHET

F05_FIX2_R_DISSOLUTION_EVIDENCE: GOVERNMENT_DEFEAT_ONLY

F05_FIX2_R_SUCCESSION_REVIEW: SUCCESSION_SEAM_EXISTS_BUT_EVIDENCE_MISSING

F05_FIX2_R_WRITER_SEMANTIC_VERDICT: WRITER_TRACKS_GOVERNMENT_CONTROL_NOT_STATE_CONTINUITY

F05_FIX2_R_ARCHITECTURE_VERDICT: REJECT_WRITER_REQUIRES_NEW_CONTINUITY_EVIDENCE

F05_FIX2_R_GATE1F_RECOMMENDATION: NOT_READY

GATE1F_CHATGPT_DECISION: NOT_READY

F05_FIX3: AUTHORIZED / NOT STARTED

V02: NOT STARTED

POLITICAL_COMPETITION: IMPLEMENTED — `banned | restricted | plural`

PERSISTENCE: SerializedSimulationSnapshotV2

LAST_COMPLETED_TASK_ID: F05_FIX2_R

NEXT_AUTHORIZED_TASK_ID: F05_FIX3

NEXT_TASK_STATUS: AUTHORIZED

CURRENT_TASK_FILE: `docs/bridge/tasks/F05_FIX3.md`

LAST_RESULT_FILE: `docs/bridge/results/F05_FIX2_R_RESULT.md`

FUTURE_REFERENCE_GROUNDING_GATES: `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`

## ChatGPT acceptance of F05_FIX2_R

ChatGPT accepts the F05_FIX2_R review as trustworthy and adopts its architecture verdict.

The F05_FIX2 unresolved-internal-rebellion continuity writer is rejected because controlled runtime probes demonstrated all of the following:

- under persistent qualifying displacement it is an `EFFECTIVE_PERMANENCE_TIMER`;
- continuity damage is a `ONE_WAY_CONTINUITY_RATCHET` across legitimate recovery and later redisplacement;
- the terminal branches prove `GOVERNMENT_DEFEAT_ONLY`, not extinction of the state as an independent political community;
- the existing non-terminal government-transition seam is representable, but current F05 state lacks authoritative successor-selection evidence;
- the writer tracks incumbent-government physical control rather than the intended semantic meaning of state continuity.

Therefore F05_FIX2's readable pacing cannot be used as Gate 1F evidence while that writer remains authoritative.

## F05_FIX3 authorized repair

F05_FIX3 is a narrow correctness rollback plus measurement task.

It must:

1. remove only the rejected F05_FIX2 weekly continuity decrement mechanism;
2. restore current Architecture documentation to the pre-writer continuity semantics;
3. add focused regression proof that internal-rebellion displacement alone no longer drains continuity or causes elapsed-boundary dissolution;
4. preserve the existing non-terminal Government transition seam without automatic successor selection;
5. preserve F04B recovery, F05_FIX1 response coverage, LandHex authority, and T024 determinism;
6. rerun the unchanged F05 36-branch / five-year matrix;
7. report the truthful pacing state after writer removal;
8. not repair any returning pacing blocker in the same task.

A truthful `GATE1F_RECOMMENDATION: NOT_READY` is an acceptable and likely F05_FIX3 result.

## External-reference / grounding guardrail

- `docs/FUTURE_REFERENCE_GROUNDING_GATES.md` is mandatory reading.
- Use repository contracts and the F04C-R mechanism-first method first.
- No new external research is expected merely to remove a writer already rejected by repository-grounded review.
- Do not gather references merely to invent a replacement terminal or succession mechanic.
- If future continuity or successor-resolution evidence is required, report the grounding gap and defer implementation.
- War as Politics, Fantasy institutional politics, and Gate 1V visual reference work remain out of scope.

## Forbidden until later authorization

- replacement continuity decay / restoration / sovereignty meter
- changing T023 dissolution thresholds
- automatic revolutionary succession or Government creation
- intervention / faction / crisis / conflict rebalance
- F05 scenario or readable-arc tuning to force a pass
- free territory / direct crisis deletion / hidden comeback state
- chapters / countdowns / permanence timers / filler events
- RNG added merely to manufacture diversity
- elections / parties / coalitions
- full labor bargaining
- transitional justice
- military factions
- local autonomy
- War as Politics
- fantasy / arcane institutions
- V02 / renderer / UI
- strategic AI / runtime LLM
- self-authorizing Gate 1F PASS or another task

## Bridge freshness requirement

Before starting F05_FIX3, Codex must explicitly run:

```bash
git status
git fetch origin
git rev-parse HEAD
git rev-parse origin/master
git pull --ff-only
```

Do not rely on a stale local `origin/master` tracking ref.

Gate 1F remains ChatGPT/user authority. Repository source, tests, diffs, and actual simulation evidence remain the highest authority.
