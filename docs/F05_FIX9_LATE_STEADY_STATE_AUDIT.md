# F05_FIX9 — Post-Interaction Late Steady-State Root-Cause Audit

TASK_ID: `F05_FIX9`
STATUS: `COMPLETE / AWAITING_CHATGPT_REVIEW`
START_BRANCH: `master`
START_COMMIT: `25976b63dd181fef5cd73095687a40f84af26399`
HORIZON: `1800` simulated days
SEED: `40103`
IMPLEMENTATION: `NONE`

## Scope and measurement contract

This is a diagnosis-only F05_FIX9 run. The audit reuses the F05_FIX7/F05_FIX8
population: 36 historical branches plus 108 proposal-enabled branches across
the six existing contexts, six existing strategies, and IGNORE/REJECT/
ACCEPT_IF_FEASIBLE response modes. Proposal lifecycle events remain outside
the official state-grounded pacing signal set. No proposal subject, template,
BARGAIN/counteroffer, faction consequence, crisis writer, territory shortcut,
continuity writer, timer, or renderer was added.

The detailed inspection keeps authoritative freeze snapshots at completion,
the last state-grounded signal before the long interval, a monthly boundary, an
active-conflict weekly boundary, and the final tick. Each snapshot includes
country resources and institutions, administrative load/headroom, physical
LandHex ownership, faction observation/dynamics, conflicts and intents,
proposal lifecycle/reconsideration basis, intervention feasibility reasons,
crisis gates, outcomes, and Agenda signatures.

## Phase A — exact late-silence population

The threshold is strictly `>720` days after the requested intervention's
state-grounded completion interval. Exactly six branches qualify. All six are
accepted proposals; no IGNORE or REJECT branch creates a late-silence false
positive.

| mode | context | strategy | open/response | requested start/complete | late state-grounded interval | duration | final outcome / Government / country LandHex / active conflicts | final Agenda |
| --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| ACCEPT_IF_FEASIBLE | EARLY_PREVENTIVE_T0 | POLITICAL_ACCOMMODATION | 31 / 32 | 32 / 37 | 870–1710 | 840d | active / `policy-fixture.government` / 0 / 2 | coup critical; rebellion critical |
| ACCEPT_IF_FEASIBLE | EARLY_PREVENTIVE_T1 | POLITICAL_ACCOMMODATION | 30 / 31 | 31 / 36 | 870–1710 | 840d | active / `policy-fixture.government` / 0 / 2 | coup critical; rebellion critical |
| ACCEPT_IF_FEASIBLE | NEAR_CRISIS_T18 | POLITICAL_ACCOMMODATION | 13 / 14 | 14 / 19 | 870–1710 | 840d | active / `policy-fixture.government` / 0 / 2 | coup critical; rebellion critical; fiscal low |
| ACCEPT_IF_FEASIBLE | NEAR_CRISIS_T18 | OPPOSITION_LEGALIZATION | 13 / 14 | 14 / 19 | 330–1440 | 1110d | active / `policy-fixture.government` / 0 / 2 | coup critical; rebellion critical; fiscal high |
| ACCEPT_IF_FEASIBLE | NEAR_CRISIS_T19 | POLITICAL_ACCOMMODATION | 12 / 13 | 13 / 18 | 870–1710 | 840d | active / `policy-fixture.government` / 0 / 2 | coup critical; rebellion critical; fiscal low |
| ACCEPT_IF_FEASIBLE | NEAR_CRISIS_T19 | OPPOSITION_LEGALIZATION | 12 / 14 | 14 / 19 | 330–1440 | 1110d | active / `policy-fixture.government` / 0 / 2 | coup critical; rebellion critical; fiscal high |

The six rows share the accepted authored demand
`gate1f.f04d.coercive-restriction` after the response. At the late freeze the
institutional rules remain `laborOrganization=restricted`,
`landOwnership=feudal`, `legislatureRequired=true`,
`politicalCompetition=banned`, `pressFreedom=censored`,
`productiveProperty=privateAllowed`, `rulerVeto=true`, and `suffrage=elite`.
Administrative load/headroom is `55.00 / 0.00`. The exact branch-specific
treasury, faction, feasibility, crisis, and proposal records are retained in
the branch snapshots produced by `f05Fix9LateSteadyStateAudit.ts`; the two
representative freeze records below show the authoritative values and causes.

No `ACTIVE_CONFLICT_RECOVERY` context exceeded 720 days, so no recovery-family
representative was selected. The absolute worst branches are the two
`NEAR_CRISIS` `OPPOSITION_LEGALIZATION` rows at 1110 days; the early and
near-crisis representatives below are also the required family/worst probes.

Matrix and regression totals:

```text
historical population                         36
proposal population                           108
complete population                           144/144
exact >720d late-silence population           6
state-grounded max reassessment silence      1200d
post-intervention late state-grounded max    1110d
proposal-decision max silence                1800d
IGNORE/REJECT non-accept divergences           0
identical-basis reopen churn                  0
legitimate feasibility reopens                 2
historical F05 baseline                 UNCHANGED
F05_FIX8 lifecycle                         PASS
```

## Phase B — causal freeze audit

### EARLY representative

Branch: `PROPOSAL_ACCEPT_IF_FEASIBLE:EARLY_PREVENTIVE_T0:POLITICAL_ACCOMMODATION`

| freeze point | tick | authoritative state |
| --- | ---: | --- |
| requested completion | 37 | treasury `651`; state capacity `55`; load/headroom `0/55`; country LandHex `3`; active conflicts `0`; accepted demand `gate1f.f04d.coercive-restriction` |
| late interval start | 870 | treasury `899`; state capacity `55`; load/headroom `0/55`; country LandHex `0`; active conflicts `2`; coup and rebellion Agenda entries critical |
| monthly boundary | 900 | treasury `869`; factions `G=0.968`, `O=0.800`, `R=0.800`, `I=0.800/0.200`; `currentStrategy=fundMovement`; selected action `FUND_MOVEMENT`; monthly `ΔG=0`, `ΔO=0` |
| weekly conflict boundary | 875 | zero front edges for the rebellion and coup conflicts; no LandHex intent |
| final horizon | 1800 | treasury `-31`; state capacity `55`; load/headroom `0/55`; country LandHex `0`; active conflicts `2`; outcome `active` |

The freeze graph is:

```text
300: COUP_ATTEMPT_STARTED
 -> authoritative state at t=870: country has 0 physical LandHexes and 2 active conflicts
 -> monthly T016/F04A: both factions remain FUND_MOVEMENT with bounded/no-op ΔG/ΔO
 -> weekly T021: rebellion has NO_ACTIVE_FRONT_EDGE; coup has COUP_HAS_NO_TERRITORIAL_WRITER
 -> T017/T018: rebellion prerequisite candidate is eligible, but the active conflict/crisis is already present
 -> T022/T023: consolidation blocked by stableRegions/capitalControl/coreTerritory; dissolution has deferred fullAnnexation/permanentFragmentation
 -> T016A/player: Agenda remains the two critical faction entries; final feasible response set is empty
 -> t=1800: unchanged active outcome
```

The freeze proposal is accepted (not open), with demand identity and
intervention provenance intact. At the freeze, the existing response set is
`gate1f.f04d.opposition-legalization`,
`gate1f.f04d.political-accommodation`, and `t016b.fixture.short-action`; the
final response set is empty after the existing treasury/feasibility guards.

### NEAR_CRISIS / absolute-worst representative

Branch: `PROPOSAL_ACCEPT_IF_FEASIBLE:NEAR_CRISIS_T18:OPPOSITION_LEGALIZATION`

| freeze point | tick | authoritative state |
| --- | ---: | --- |
| requested completion | 19 | treasury `621`; state capacity `55`; load/headroom `0/55`; country LandHex `3`; active conflicts `1`; accepted demand `gate1f.f04d.coercive-restriction` |
| late interval start | 330 | treasury `1139`; state capacity `55`; load/headroom `0/55`; country LandHex `0`; active conflicts `2`; coup and rebellion Agenda entries critical |
| monthly boundary | 360 | treasury `1109`; factions `G=0.840`, `O=0.800/0.720`, `R=0.800`, `I=0.800/0.200`; `currentStrategy=fundMovement`; selected action `FUND_MOVEMENT`; `ΔG=+0.020`, rebellion `ΔO=+0.020` |
| weekly conflict boundary | 336 | zero front edges for the rebellion and coup conflicts; no LandHex intent |
| final horizon | 1800 | treasury `-331`; state capacity `55`; load/headroom `0/55`; country LandHex `0`; active conflicts `2`; outcome `active` |

The freeze graph is:

```text
122: LAND_HEX_CONTROL_CHANGED:t021.industrial-extra-hex
 -> authoritative state at t=330: country has 0 physical LandHexes and 2 active conflicts
 -> monthly T016/F04A: faction dynamics continue to be derived from current observation
 -> weekly T021: rebellion has NO_ACTIVE_FRONT_EDGE; coup has COUP_HAS_NO_TERRITORIAL_WRITER
 -> T017/T018: rebellion prerequisite candidate is eligible, but active conflict deduplication and saturated crisis state remain
 -> T022/T023: consolidation blocked by stableRegions/capitalControl/coreTerritory; dissolution has deferred fullAnnexation/permanentFragmentation
 -> T016A/player: faction Agenda remains critical and fiscal severity becomes high; final feasible response set is empty
 -> t=1800: unchanged active outcome
```

The requested `OPPOSITION_LEGALIZATION` intervention is already completed by
the time of this freeze. No open proposal or explicit rejection is suppressing
the later state; the accepted proposal is a historical lifecycle record, and
the next authored LOBBY demand is not selected by the existing faction
heuristic.

## Phase C — developer-only perturbation probes

Each probe clones the freeze `WorldState`, changes one existing authoritative
input, runs the existing read/step path, and discards the clone. No probe
changes production rules or adds state.

| input | first consumer | observed result | causal conclusion |
| --- | --- | --- | --- |
| faction organization `0.800 -> 1.000` | T021 `deriveConflictIntents` / T016 F04A | no intent or reassessment at the zero-front freeze; only normal `TREASURY_CHANGED,TICK_ADVANCED` probe events | existing operational consumer is present; limiter/equilibrium remains |
| faction resources `0.800 -> 1.000` | T021 `deriveConflictIntents` / T016 F04A | same as organization | no omitted conflict writer is demonstrated |
| treasury raised to existing feasibility threshold | T016B feasibility/response guard | baseline and perturbation remain `feasible:none` at the accepted-demand freeze | no new response is authorized by this state; no numeric pacing repair |
| state capacity raised above committed load | T016B administrative headroom guard | baseline and perturbation remain `feasible:none` | existing administrative guard is not an inert missing consumer |
| `politicalCompetition=banned -> plural` | T016 faction legality | available action set changes and `BARGAIN` becomes legal in the clone | existing legality consumer reacts; BARGAIN is not added to production |
| current Government replaced in clone | proposal lifecycle target/reconsideration guard | no automatic retarget or reassessment; authored proposal basis is read only when a later LOBBY/response path runs | no continuity/retarget writer is missing from the authorized scope |
| one existing LandHex controller changed | T021 `deriveConflictIntents` | no new intent at the zero-front/coup freeze | physical LandHex authority is consumed; no free recovery or hidden comeback is justified |

The probes therefore satisfy the diagnosis gate but do not satisfy the
implementation gate: none proves an existing writer/consumer to be wrongly
inert in the unperturbed authoritative state. The institutional probe changes
action legality only in a deliberately altered clone and is not a production
repair candidate.

## Root-cause classification

Representative branches share these exact labels:

```text
ACTIVE_CONFLICT_EQUILIBRIUM
OUTCOME_ELIGIBILITY_STALEMATE
INTERACTION_COVERAGE_EXHAUSTED
```

The first reflects the existing T021 front/strength guards and the deliberate
absence of a territorial writer for coups after all country LandHexes are
lost. The second reflects the existing T022/T023 eligibility criteria and
deferred terminal criteria. The third reflects that the accepted interaction
has completed and the existing faction heuristic does not select a later
authored LOBBY demand; proposal lifecycle itself is not being counted as
pacing. No representative is classified as `PLAYER_RESPONSE_SET_SATURATED`,
because the Agenda/feasibility signature is not identical at every selected
freeze-to-final pair.

Required output:

```text
PRIMARY_CLASSIFICATION: LATE_STEADY_STATE_MIXED_CAUSE
REPRESENTATIVE_BRANCH_CLASSIFICATIONS: PROPOSAL_ACCEPT_IF_FEASIBLE:EARLY_PREVENTIVE_T0:POLITICAL_ACCOMMODATION->ACTIVE_CONFLICT_EQUILIBRIUM+OUTCOME_ELIGIBILITY_STALEMATE+INTERACTION_COVERAGE_EXHAUSTED; PROPOSAL_ACCEPT_IF_FEASIBLE:NEAR_CRISIS_T18:OPPOSITION_LEGALIZATION->ACTIVE_CONFLICT_EQUILIBRIUM+OUTCOME_ELIGIBILITY_STALEMATE+INTERACTION_COVERAGE_EXHAUSTED
EXISTING_BUG_FOUND: NO
INTERACTION_COVERAGE_EXHAUSTED: YES
ACTIVE_CONFLICT_EQUILIBRIUM: YES
OUTCOME_GAP: YES
PLAYER_RESPONSE_SET_SATURATED: NO
IMPLEMENTATION: NONE
HISTORICAL_F05_BASELINE: UNCHANGED
PERSISTENCE_FORMAT: V4_UNCHANGED
STATE_GROUNDED_MAX_REASSESSMENT_SILENCE: 1200
POST_INTERVENTION_LATE_SILENCE: 1110
NON_ACCEPT_DIVERGENCES: 0
IDENTICAL_REOPEN_CHURN: 0
LEGITIMATE_REOPENS: 2
READY_FOR_F05_PROMOTION: NO
GATE1F_RECOMMENDATION: NOT_READY
V02: NOT_STARTED
```

No production seam was changed. Gate 1F remains a ChatGPT/user review
decision; this task does not approve Gate 1F, start V02, or authorize another
task.
