# TMR — F05_FIX1 Gate 1F Recovery + Pacing Repair

TASK_ID: F05_FIX1

Date: 2026-08-24

Task type: narrow Gate 1F repair + F05 re-measurement

## 0. Mission

F04 is closed. F05 measurement is complete and ChatGPT has reviewed it as trustworthy.

Current Gate 1F decision:

```text
GATE 1F: NOT_READY
```

The measured blockers are narrow:

1. active-conflict/recovery has only one meaningfully beneficial required response, so WAIT is weakly dominant there;
2. representative five-year branches contain very long gaps between major pacing/decision events (`1,695–1,787` days), so the headless political arc is not yet readable enough;
3. the exact F05 matrix must be rerun after repair.

This task must repair only those blockers using existing TMR systems. Do not expand scope.

## 1. Authorized base

BASE_BRANCH: `master`

BASE_COMMIT: `2423e629b018052d24f495793e10803cd5a0f837`

A newer HEAD is expected only because ChatGPT must commit this immutable task plus Bridge authorization metadata. Before execution:

```bash
git pull --ff-only
git diff 2423e629b018052d24f495793e10803cd5a0f837..HEAD --stat
git diff 2423e629b018052d24f495793e10803cd5a0f837..HEAD
```

The diff after the base must contain only ChatGPT-authored task/Bridge authorization files. Any gameplay/source change makes this task stale.

## 2. Required reading

Read and obey:

- `AGENTS.md`
- `docs/bridge/STATE.md`
- `docs/bridge/CURRENT_TASK.md`
- `docs/bridge/LAST_RESULT.md`
- `docs/F05_PACING_FUN_DECISION.md`
- `docs/bridge/results/F05_RESULT.md`
- `docs/F04_TARGETED_ARCHITECTURE_GATE_REVIEW.md`
- `docs/F04D_INSTITUTION_ACTION_IMPLEMENTATION.md`
- `docs/F04B_ACTIVE_CONFLICT_RECOVERY_AGENCY.md`
- `docs/F04A_ENDOGENOUS_FACTION_DYNAMICS.md`
- `docs/F04C_R_POLITICAL_HISTORICAL_REFERENCE_GROUNDING.md`
- `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`
- `docs/GDD.md`
- `docs/ARCHITECTURE.md`
- `docs/QA_PLAYTEST.md`

Inspect the actual F05 harness and existing agenda/faction/intervention/conflict systems before changing code.

## 3. External-reference / grounding rule — REQUIRED

This task is governed by `docs/FUTURE_REFERENCE_GROUNDING_GATES.md` and the F04C-R method.

Research is **demand-driven**, not collection-driven.

Do not add War, Fantasy, visual-production work, or any other new domain because references exist.

For any political mechanism used in this repair, prefer the already documented F04C-R grounding. The required reasoning shape is:

```text
source-supported mechanism already grounded in repo
→ conditions / failure mode
→ trade-off
→ existing TMR state
→ existing downstream consumer
→ smallest repair
```

Do not turn historical cases into scripted events or universal bonuses.

Do not perform broad new external research by default. If the narrow repair truly cannot be justified from existing repository grounding, stop and report `INSUFFICIENT_REFERENCE_GROUNDING` rather than inventing a mechanism. If additional external research is genuinely necessary and available, clearly separate:

- source-supported fact;
- interpretation;
- TMR inference.

No new War/Fantasy reference implementation is authorized here.

## 4. First diagnosis — political silence: measurement gap or simulation gap?

Before adding gameplay consequences, audit the measured `1,695–1,787` day political silence.

F05 defines silence from major pacing events. That does NOT prove all meaningful current state is frozen.

Inspect the late-horizon branches for existing changes in at least:

- faction grievance / organization / resources / strategy;
- Region unrest / scarcity / stateControl;
- ideology support / radicalism / organization;
- intervention feasibility and administrative headroom;
- Agenda/read-model output and changes;
- active conflict operational balance / recovery eligibility;
- institutional action availability;
- consolidation eligibility/progress;
- existing events that F05 may not currently classify as pacing-relevant.

Classify the gap as one of:

```text
MEASUREMENT_GAP
SIMULATION_GAP
MIXED_GAP
```

Rules:

- If genuine player-relevant decisions/consequences already change but F05 fails to count them, improve the developer-only F05 measurement instead of manufacturing gameplay events.
- Do NOT solve the gate by simply adding every noisy event type to `PACING_EVENT_TYPES`.
- An existing event/state change may count only if it would honestly justify a player pause/reassessment in future presentation.
- If there really is no meaningful decision/consequence movement, implement the smallest existing-system repair that creates one.

## 5. Recovery response repair

At least one additional existing response beyond material relief must become a **distinct paid benefit** in `ACTIVE_CONFLICT_RECOVERY`.

Candidate existing responses:

```text
POLITICAL_ACCOMMODATION
OPPOSITION_LEGALIZATION
COERCIVE_RESTRICTION
```

Do not make all three useful by force. Audit the current authoritative consumers and choose the smallest mechanism that is both politically coherent and supported by existing grounding/state.

The repaired response must:

- use existing authoritative state;
- have a real treasury, administrative, institutional, or political opportunity cost;
- read current state rather than intervention ID in downstream systems;
- not delete an active conflict directly;
- not create free LandHex control;
- not schedule crisis resolution;
- not introduce a hidden recovery/comeback score;
- not add Army/unit/pathfinding/logistics;
- preserve F04B's LandHex controller authority and one-Hex weekly recovery boundary;
- preserve the distinction between amnesty/accommodation, legalization, and coercion.

A useful recovery response does NOT need to instantly win territory. Valid benefits can include an existing-state causal change that improves later recovery odds, conflict pressure, organization/grievance trajectory, institutional access, or another already implemented downstream consumer.

But pure scalar movement with no meaningful decision/history consequence is not sufficient.

## 6. Pacing repair

Gate 1F needs a readable 5-year headless arc, not arbitrary event spam.

After the diagnosis in section 4, repair the long quiet span using the smallest valid route.

Preferred order:

1. recognize an already-existing genuinely player-relevant decision/consequence in the F05 measurement if it was omitted;
2. strengthen an existing causal consumer so current state naturally creates a later decision/consequence;
3. only if necessary, add a sparse event for an already-existing authoritative state transition that currently has no truthful event representation.

Do NOT add:

- story nodes;
- countdowns;
- scheduled crises;
- periodic filler events;
- generic tension/stability/political-power meters;
- event emissions solely because N days passed;
- random events merely to create rhythm.

A valid pacing consequence should arise because state crossed or changed something meaningful that already exists in the model.

## 7. Agenda/read-model audit

Because T016A Agenda is already an existing pure read model, inspect whether it can honestly contribute to pause/reassessment opportunities without becoming authoritative quest state.

Allowed:

- developer measurement of Agenda snapshots/change points;
- counting meaningful agenda composition/severity/cause/availability changes in F05 if they are real and stable enough to matter;
- fixing stale/honesty issues in an existing read-model consumer if a correctness gap is found.

Forbidden:

- authoritative agenda progress;
- quest chains;
- scripted agenda sequence;
- filler agendas;
- LLM-generated pressure text;
- using Agenda solely to fake event density.

If Agenda changes already provide real decision cadence, prove it with before/after measurement.

## 8. Preserve F04/F05 findings

Do not reopen closed architecture unless a correctness defect is demonstrated.

Preserve:

- F04A endogenous faction recovery;
- F04B current-state conflict/recovery architecture;
- `WorldState.landHexStates[*].controller` as sole physical territorial authority;
- `Region.stateControl` as administrative/security penetration, not ownership;
- `politicalCompetition = banned | restricted | plural`;
- Snapshot V2 strictness/replay;
- intervention completion causality;
- repeated-accommodation instability trade-off.

Political accommodation must not become a no-cost universal answer while fixing recovery or pacing.

## 9. Exact F05 re-measurement

After the narrow repair, rerun the same F05 structure:

- seed `40103`;
- 5 simulated years / 1,800 days per branch;
- primary contexts: tick 0, tick 18, tick 180;
- neighboring contexts: tick 1, tick 19, tick 181;
- strategies:
  - WAIT
  - MATERIAL_RELIEF
  - POLITICAL_ACCOMMODATION
  - OPPOSITION_LEGALIZATION
  - COERCIVE_RESTRICTION
  - REPEATED_POLITICAL_ACCOMMODATION

Do not change the fixture values merely to pass.

If measurement semantics are improved because section 4 proves a measurement gap, show both:

```text
old F05 pacing interpretation
vs
new justified pacing interpretation
```

and explain exactly why the new signal is genuinely player-relevant.

## 10. Acceptance targets

This task may recommend Gate 1F PASS only if the rerun shows all of the following:

1. active-conflict/recovery has at least **two causally distinct paid responses** with meaningful benefit/trade-off;
2. WAIT is no longer weakly/strongly dominant in that representative recovery context;
3. the long silence issue is materially improved by genuine decision/consequence cadence, not instrumentation gaming;
4. each representative context contains a plausible observe → decide → consequence → reassess rhythm across the five-year horizon;
5. political accommodation remains at most `CONDITIONALLY_STRONG` or otherwise carries a material downside/opportunity cost;
6. choice-driven histories remain distinct and causally explainable;
7. no new universal political meter, story scheduler, RNG diversity patch, or new domain was added;
8. T024/F01/F04D determinism and regression evidence still pass.

Do not force exact numeric thresholds if the state evidence clearly supports or rejects readability. However, compare the previous `1,695–1,787` day major-event silence directly with the repaired result.

## 11. If the repair cannot honestly satisfy the gate

Return a truthful:

```text
GATE1F_RECOMMENDATION: NOT_READY
```

with the smallest remaining blocker.

Do not add a second repair system in the same task just to force a pass.

If a missing domain is genuinely required, classify it explicitly and stop rather than smuggling it into Gate 1F.

## 12. Forbidden scope

Do not implement:

- War as Politics;
- fantasy/arcane institutions;
- V02 / renderer / UI;
- elections / parties / seats / coalitions;
- full labor bargaining;
- transitional justice;
- military factions / loyalty;
- local autonomy/federalism;
- mobilization/conscription/war economy;
- strategic AI/MCTS;
- runtime LLM;
- generic stability/democracy/legitimacy/political-power meter;
- RNG merely to create diversity;
- tactical military micro.

## 13. Required artifacts

Update/create as appropriate:

```text
docs/F05_GATE1F_REPAIR1.md
src/sim/inspection/f05PacingFunDecision.ts
src/sim/inspection/f05PacingFunDecisionInspection.test.ts
```

Only modify authoritative systems if the diagnosis justifies the smallest repair.

Add focused tests for every gameplay change.

Write immutable Bridge result:

```text
docs/bridge/results/F05_FIX1_RESULT.md
```

Update:

```text
docs/bridge/LAST_RESULT.md
docs/bridge/STATE.md
```

Do not overwrite `F05_RESULT.md`.

## 14. Verification

Use Node v24.19.0 / pnpm 11.19.0.

Run at minimum:

```bash
pnpm install --frozen-lockfile
pnpm run format
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm run inspect:t024
pnpm run inspect:f01
pnpm run inspect:f04b
pnpm run inspect:f04d
pnpm run inspect:f05
pnpm test
git diff --check
```

If a focused new inspection is added, run it too.

## 15. Commit policy

COMMIT_POLICY: `COMMIT_AND_PUSH_ON_PASS`

Here `PASS` means the authorized repair task completed coherently, all verification passed, and the Bridge result truthfully records the re-measurement. It does NOT self-authorize Gate 1F or V02.

A truthful `GATE1F_RECOMMENDATION: NOT_READY` may still be committed/pushed if the implemented repair is coherent and verified.

Recommended commit:

```text
fix: improve Gate 1F recovery and pacing agency
```

After completion, do not authorize or begin another task.

## 16. Final result schema

Return/write at least:

```text
TASK_ID: F05_FIX1
STATUS: REPAIR_COMPLETE / BLOCKED
START_COMMIT:
END_COMMIT:
COMMIT_CREATED:
PUSHED:

SILENCE_DIAGNOSIS:
- classification: MEASUREMENT_GAP / SIMULATION_GAP / MIXED_GAP
- existing late-horizon changes found:
- genuinely player-relevant signals:
- instrumentation changes, if any:
- gameplay repair required:

RECOVERY_RESPONSE_REPAIR:
- response chosen:
- why this response:
- existing grounding used:
- authoritative state changed:
- downstream consumer:
- cost/trade-off:
- conflict/territory authority preserved:

PACING_REPAIR:
- mechanism:
- why it is not filler/scheduled content:
- previous longest silence:
- new longest silence:
- agenda/read-model role:

F05 RERUN:
- contexts:
- strategies:
- political accommodation classification:
- WAIT classification by context:
- meaningful recovery responses:
- trajectory diversity:
- causal readability:
- readable arc:

EXTERNAL_REFERENCE_GUARDRAIL:
- FUTURE_REFERENCE_GROUNDING_GATES read:
- F04C-R grounding reused:
- new research performed: YES / NO
- if YES, source fact vs interpretation vs TMR inference separation:
- War/Fantasy/Visual scope untouched:

GATE1F_RECOMMENDATION:
PASS / PASS_WITH_NOTES / NOT_READY

REMAINING_BLOCKERS:
- ...

FILES_CHANGED:
- ...

VERIFICATION:
- install:
- format:
- typecheck:
- lint:
- build:
- inspect:t024:
- inspect:f01:
- inspect:f04b:
- inspect:f04d:
- inspect:f05:
- full tests:
- git diff --check:

NEXT_AUTHORIZED_TASK_ID:
NONE

V02:
NOT STARTED
```

Gate 1F remains ChatGPT/user authority after this task.