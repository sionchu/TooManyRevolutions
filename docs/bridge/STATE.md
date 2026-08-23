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

CURRENT_GATE: Gate 1F

CURRENT_PHASE: F05_FIX2_R review complete / ChatGPT review pending

F04: CLOSED / PASS

F05: MEASUREMENT_COMPLETE / REVIEWED

F05_FIX1: REPAIR_COMPLETE / REVIEWED

F05_FIX2: REPAIR_COMPLETE / REVIEWED

F05_FIX2_IMPLEMENTATION: PASS

F05_FIX2_MEASUREMENT: TRUSTWORTHY

F05_FIX2_CODEX_RECOMMENDATION: PASS_WITH_NOTES

GATE1F_CHATGPT_DECISION: NOT_READY

F05_FIX2_R: REVIEW_COMPLETE / AWAITING_CHATGPT_REVIEW

V02: NOT STARTED

POLITICAL_COMPETITION: IMPLEMENTED — `banned | restricted | plural`

PERSISTENCE: SerializedSimulationSnapshotV2

LAST_COMPLETED_TASK_ID: F05_FIX2_R

NEXT_AUTHORIZED_TASK_ID: NONE

NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW

CURRENT_TASK_FILE: NONE

LAST_RESULT_FILE: `docs/bridge/results/F05_FIX2_R_RESULT.md`

F05_FIX2_R_COUNTDOWN_CLASSIFICATION: EFFECTIVE_PERMANENCE_TIMER

F05_FIX2_R_RATCHET_CLASSIFICATION: ONE_WAY_CONTINUITY_RATCHET

F05_FIX2_R_DISSOLUTION_EVIDENCE: GOVERNMENT_DEFEAT_ONLY

F05_FIX2_R_SUCCESSION_REVIEW: SUCCESSION_SEAM_EXISTS_BUT_EVIDENCE_MISSING

F05_FIX2_R_WRITER_SEMANTIC_VERDICT: WRITER_TRACKS_GOVERNMENT_CONTROL_NOT_STATE_CONTINUITY

F05_FIX2_R_ARCHITECTURE_VERDICT: REJECT_WRITER_REQUIRES_NEW_CONTINUITY_EVIDENCE

F05_FIX2_R_GATE1F_RECOMMENDATION: NOT_READY

FUTURE_REFERENCE_GROUNDING_GATES: `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`

## ChatGPT review of F05_FIX2

ChatGPT accepts the F05_FIX2 diagnosis and measurement as technically trustworthy but does **not** pass Gate 1F yet.

Accepted results:

- F05_FIX1 recovery repair remains intact: recovery is `TRADEOFF` with three meaningful paid responses.
- Political accommodation remains `CONDITIONALLY_STRONG`, not universally dominant.
- The late steady-state diagnosis `ACTIVE_CONFLICT_STALEMATE → OUTCOME_ELIGIBILITY_STALEMATE` is useful and evidence-based.
- The exact F05 matrix after F05_FIX2 produces readable measured arcs and six distinct trajectory signatures per representative context.
- LandHex authority, Region.stateControl semantics, F04B recovery boundary, determinism, and T024 persistence/replay remained intact.

Open architecture blocker:

The F05_FIX2 writer decreases `Country.stateContinuity` by one on each weekly conflict boundary while the player Country has zero controlled LandHexes under qualifying internal-rebellion physical control and no recovery restored a Country Hex.

This may function as an implicit fixed-duration defeat countdown / permanence timer and may create a one-way continuity ratchet. More importantly, current runtime evidence may prove displacement/defeat of the incumbent government rather than extinction of the state as an independent political community.

TMR's core contract remains:

- player = historical continuity of the state, not the current government;
- revolution, coup, government turnover, civil-war government defeat, temporary capital loss, total occupation, or zero Country Hexes alone are not automatic defeat;
- only genuine `State Dissolution` is terminal defeat.

## F05_FIX2_R authorized review

`F05_FIX2_R` is a targeted architecture review, not a gameplay repair.

It must determine:

1. whether the weekly continuity writer is functionally a countdown/permanence timer;
2. whether continuity damage is an irreversible ratchet across recovery and repeated displacement;
3. whether current F05_FIX2 terminal branches prove state extinction or only incumbent-government defeat/displacement;
4. whether the existing non-terminal `governmentTransition` seam can represent revolutionary succession, and whether sufficient successor evidence exists;
5. the precise semantic meaning of `Country.stateContinuity` and whether the writer matches it;
6. the smallest follow-up recommendation if the writer must be rejected.

No gameplay repair is authorized inside F05_FIX2_R. Developer-only tests/inspection may be added only to prove current behavior.

## External-reference / grounding guardrail

- `docs/FUTURE_REFERENCE_GROUNDING_GATES.md` is mandatory reading.
- Use existing repository contracts and F04C-R mechanism-first grounding first.
- Research remains demand-driven.
- Only if repository grounding is insufficient may the review perform narrow external research on state continuity through revolution/regime replacement, government succession vs state extinction, and evidence of actual state extinction.
- Any new external research must separate source-supported fact, interpretation, and TMR design inference.
- Do not broaden into War as Politics, fantasy politics, election/party systems, international-law simulation, or a generic sovereignty subsystem.

## Forbidden until later authorization

- changing the F05_FIX2 continuity writer during the review
- adding a continuity restoration formula
- implementing revolutionary succession
- changing T023 dissolution thresholds
- V02 / renderer / UI
- War as Politics
- fantasy / arcane institutions
- elections / parties / coalitions
- full labor bargaining
- transitional justice
- military factions
- local autonomy
- strategic AI / runtime LLM
- generic political / sovereignty meters
- story nodes / countdowns / filler events
- RNG added merely to manufacture diversity
- self-authorizing Gate 1F PASS or any follow-up fix

Gate 1F remains ChatGPT/user authority. Repository source, tests, diffs, and actual simulation evidence remain the highest authority.

## F05_FIX2_R completed review

The review-only probe commit is `f9f108696bf2de724428d0d61a8c4ba14935e42e`.
No production gameplay writer, dissolution threshold, succession behavior, or
F05 pacing input was changed.

Review conclusions:

- the weekly writer is an `EFFECTIVE_PERMANENCE_TIMER`;
- continuity damage is a `ONE_WAY_CONTINUITY_RATCHET` across recovery and
  later displacement;
- the unchanged terminal branches prove `GOVERNMENT_DEFEAT_ONLY`, not state
  extinction;
- the typed government-transition seam exists, but successor evidence is
  missing;
- the writer tracks government control rather than the repository meaning of
  state continuity;
- architecture verdict: `REJECT_WRITER_REQUIRES_NEW_CONTINUITY_EVIDENCE`.

The smallest follow-up is a separate `REMOVE_OR_DISABLE_CONTINUITY_WRITER`
task that removes only the weekly decrement and reruns the unchanged F05
matrix. A replacement writer requires separately grounded continuity evidence.
Gate 1F remains `NOT_READY`; V02 remains `NOT_STARTED`; no next task is
authorized pending ChatGPT review.
