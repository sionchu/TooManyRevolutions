# F05_FIX9 — Post-Interaction Late Steady-State Root-Cause Audit

TASK_ID: F05_FIX9
STATUS: AUTHORIZED
BASE_BRANCH: master
BASE_COMMIT: 472f23351dc9684d37c2d7e5a9cb4373a4e138b1
COMMIT_POLICY: COMMIT_AND_PUSH_ON_PASS

## Mission

F05_FIX8 closed false non-accept divergence and identical-demand reopen churn, but the proposal-enabled five-year matrix still contains:

- state-grounded maximum reassessment silence: 1200 days;
- post-intervention late state-grounded silence: up to 1110 days;
- meaningful ACCEPT consequences in 18 branches;
- no durable five-year reassessment cadence;
- Gate 1F remains NOT_READY.

This task must determine *why the simulation stops producing new state-grounded political reassessment after a real accepted interaction completes* before adding any new political domain, demand, policy, or bargaining content.

Diagnosis must distinguish a broken/omitted existing consumer from a legitimate model equilibrium from exhausted interaction coverage. Do not assume the answer in advance.

## Phase A — Exact late-silence population

Using the F05_FIX8/F05_FIX7-style 144-branch population and historical F05 measurement contracts:

1. Enumerate every proposal-enabled branch whose post-intervention late state-grounded silence exceeds 720 days.
2. For each branch report:
   - context / strategy / response mode;
   - proposal open / response / requested-intervention start / completion ticks;
   - last state-grounded reassessment tick before the long silent interval;
   - silent interval start/end and duration;
   - final outcome, current Government, Country-controlled LandHexes, active conflicts;
   - final institutions, treasury, administrative headroom/load;
   - relevant faction grievance / organization / resources / influence / currentStrategy;
   - proposal demand/lifecycle state and current reconsideration basis;
   - current intervention feasibility + discrete reasons;
   - current Agenda composition/severity/signature.
3. Rank the branches by silence duration and select at least:
   - one early representative;
   - one near-crisis representative;
   - one active-conflict/recovery representative if any branch qualifies;
   - the absolute worst branch.

Do not count proposal lifecycle events themselves as state-grounded pacing.

## Phase B — Freeze-point causal audit

For every representative branch, capture the authoritative state at:

- the requested intervention completion;
- the last state-grounded reassessment before the long silence;
- one monthly boundary during the silent interval;
- one weekly conflict boundary during the silent interval when active conflict exists;
- the final horizon tick.

Audit all existing writers/consumers relevant to political movement:

1. **Faction adaptation / F04A / T016**
   - current observation;
   - legal action set;
   - heuristic proposal/action;
   - faction dynamics target and actual monthly delta;
   - whether currentStrategy has any real consumer in this state.

2. **Political interaction / proposal lifecycle**
   - whether an open demand exists;
   - latest explicit rejection basis if any;
   - whether the authored demand can legitimately reopen;
   - whether the requested intervention is feasible, infeasible, or exhausted by `NO_COMPLETION_EFFECT_CHANGE`;
   - whether no proposal exists because the faction never selects LOBBY versus because lifecycle suppresses it.

3. **Instability / crisis / T017-T018**
   - current scarcity/unrest/instability drivers;
   - faction pressure gates;
   - crisis prerequisites;
   - whether dedup alone blocks a new crisis or the underlying prerequisites are already saturated.

4. **Active conflict / F04B / T021**
   - country operational strength;
   - faction operational strength and each limiting component (resources, organization, local mobilization);
   - territorial ownership snapshot;
   - weekly intents before collision;
   - exact reason no LandHex mutation occurs on the audited weekly boundary;
   - whether zero-country-hex recovery is eligible and, if not, why;
   - whether conflict is a genuine tie/equilibrium versus a missing consumer/writer.

5. **Outcome / T022-T023**
   - consolidation eligibility and failed criteria;
   - dissolution eligibility and failed criteria;
   - confirm no continuity writer/countdown is involved;
   - distinguish outcome ineligibility from missing political succession evidence.

6. **Agenda / player reassessment**
   - current Agenda signature;
   - feasible intervention response set;
   - why neither changes during the silent interval;
   - confirm whether the player has any distinct state-grounded decision left or only repeated/no-op options.

The audit must produce a causal freeze graph for each representative branch:

```text
last meaningful state change
-> current authoritative state
-> each scheduled/monthly/weekly system evaluation
-> candidate writer
-> exact guard/limiter/no-op reason
-> next unchanged state
```

## Phase C — Diagnostic perturbation probes

Diagnostic probes may clone a freeze-point record and alter one *existing authoritative input* only to test causality. These probes are developer inspection only and must never become production mechanics.

Allowed examples:

- raise/lower one existing faction organization/resource input enough to cross an existing T021 limiter;
- alter one existing intervention feasibility input such as administrative headroom or treasury;
- change one existing institutional rule to test whether action legality is the blocking seam;
- change current Government only to test proposal lifecycle targeting;
- alter one existing LandHex controller only in a cloned diagnostic state to test T021 intent/recovery response.

For every perturbation report:

- changed input;
- first downstream consumer that reacts;
- whether it produces a real state-grounded reassessment;
- whether the original freeze was caused by an existing guard/equilibrium or by a missing consumer.

Forbidden in probes:

- adding new state fields/meters;
- injecting a new proposal subject/template;
- adding a new crisis/conflict/outcome;
- continuity manipulation;
- arbitrary timer/countdown;
- changing code to force a desired result.

## Required root-cause classification

Classify each representative branch using one or more of these exact labels:

- `MEASUREMENT_ARTIFACT`
- `EXISTING_CONSUMER_OR_WRITER_BUG`
- `ACTIVE_CONFLICT_EQUILIBRIUM`
- `OUTCOME_ELIGIBILITY_STALEMATE`
- `INTERACTION_COVERAGE_EXHAUSTED`
- `PLAYER_RESPONSE_SET_SATURATED`
- `MIXED_CAUSE`

Then produce one overall primary classification:

- `LATE_STEADY_STATE_EXISTING_BUG_FOUND`
- `LATE_STEADY_STATE_MODEL_EQUILIBRIUM`
- `LATE_STEADY_STATE_INTERACTION_COVERAGE_EXHAUSTED`
- `LATE_STEADY_STATE_OUTCOME_GAP`
- `LATE_STEADY_STATE_MIXED_CAUSE`
- `LATE_STEADY_STATE_MEASUREMENT_ARTIFACT`

## Implementation gate

This task is **diagnosis-first**.

Production implementation is permitted only if Phase A-C prove a narrowly scoped bug/omission in an **already-authorized existing consumer/writer** and the repair:

1. does not add a new political domain, proposal subject, faction effect, or terminal mechanism;
2. restores an already-documented intended consumer path rather than introducing new semantics;
3. is not numeric tuning for pacing;
4. has a direct same-state counterfactual showing the pre-fix path was incorrectly inert;
5. preserves F04B/F04D/T024/F05_FIX8 contracts;
6. does not create universal response dominance or a one-way ratchet.

If these conditions are not all satisfied, **do not implement a repair**. A diagnosis-only result is a successful task outcome.

If implementation occurs, change at most one existing consumer/writer seam and rerun the required long-horizon measurements. Do not add a second fix.

## Explicitly forbidden scope

- new proposal subjects/templates or additional political-interaction content;
- BARGAIN/counteroffer/full settlement;
- FUND_MOVEMENT/ORGANIZE new consequence semantics;
- parties/elections/coalitions;
- full labor bargaining;
- transitional justice;
- military factions/local autonomy;
- War as Politics;
- fantasy institutions;
- new generic meters or utility/political-power/stability scores;
- arbitrary cooldown/expiry/countdown;
- proposal events as pacing filler;
- direct crisis deletion or creation to improve pacing;
- direct conflict resolution, free LandHex, hidden comeback;
- continuity decay/restoration, sovereignty meter, T023 threshold changes;
- automatic revolutionary/successor Government creation;
- Nash/CFR/fictitious-play/PSRO/MCTS/RL/QRE;
- runtime LLM/MCP NPC decisions;
- V02/renderer/UI;
- self-authorizing Gate 1F PASS or another follow-up task.

## Required artifacts

Always create:

- `docs/F05_FIX9_LATE_STEADY_STATE_AUDIT.md`
- `docs/bridge/results/F05_FIX9_RESULT.md`

If and only if a narrow authorized repair is implemented, also create:

- `docs/F05_GATE1F_REPAIR9_LATE_STEADY_STATE.md`

Add focused inspection/test code as needed for causal snapshots and perturbation probes.

## Measurement / regression requirements

Always:

- preserve and rerun historical official F05 36-branch baseline;
- preserve F05_FIX8 proposal lifecycle semantics;
- preserve the 108 proposal-enabled long-horizon population for diagnosis;
- keep proposal lifecycle events outside `PACING_EVENT_TYPES`;
- report current state-grounded max reassessment silence;
- report post-intervention late state-grounded silence;
- report proposal-decision silence separately;
- report IGNORE/REJECT non-accept divergence count;
- report identical-basis reopen churn and legitimate reopens.

If a repair is implemented, rerun the full 144-branch comparison and compare against F05_FIX8 exactly.

## Required output fields

```text
PRIMARY_CLASSIFICATION: <one exact overall label>
REPRESENTATIVE_BRANCH_CLASSIFICATIONS: <branch -> labels>
EXISTING_BUG_FOUND: YES | NO
INTERACTION_COVERAGE_EXHAUSTED: YES | NO | MIXED
ACTIVE_CONFLICT_EQUILIBRIUM: YES | NO | MIXED
OUTCOME_GAP: YES | NO | MIXED
PLAYER_RESPONSE_SET_SATURATED: YES | NO | MIXED
IMPLEMENTATION: NONE | <one existing seam>
HISTORICAL_F05_BASELINE: UNCHANGED | CHANGED
PERSISTENCE_FORMAT: V4_UNCHANGED | <truthful other>
STATE_GROUNDED_MAX_REASSESSMENT_SILENCE: <days>
POST_INTERVENTION_LATE_SILENCE: <days>
NON_ACCEPT_DIVERGENCES: <count>
IDENTICAL_REOPEN_CHURN: <count>
LEGITIMATE_REOPENS: <count>
READY_FOR_F05_PROMOTION: YES | NO
GATE1F_RECOMMENDATION: PASS | PASS_WITH_NOTES | NOT_READY
V02: NOT_STARTED
```

## Startup / freshness

Before work:

```bash
git status
git fetch origin
git rev-parse HEAD
git rev-parse origin/master
git pull --ff-only
```

Do not trust an unfetched local `origin/master`.

## Verification

Preferred runtime: Node 24.19.0 / pnpm 11.19.0. If unavailable, record exact runtime.

Run:

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
# focused F05_FIX9 audit inspection/tests
# F05_FIX8 lifecycle/audit regressions if touched
pnpm test
git diff --check
```

## Completion

On completion:

- set `F05_FIX9: COMPLETE / AWAITING_CHATGPT_REVIEW` or truthful blocked state;
- set `LAST_COMPLETED_TASK_ID: F05_FIX9`;
- set `NEXT_AUTHORIZED_TASK_ID: NONE`;
- set `NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW`;
- set `CURRENT_TASK_FILE: NONE`;
- keep `V02: NOT STARTED`;
- do not authorize new interaction content;
- do not declare Gate 1F passed.
