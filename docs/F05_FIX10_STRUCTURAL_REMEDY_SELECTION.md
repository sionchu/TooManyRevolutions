# F05_FIX10 — Interaction-Coverage Structural Remedy Selection

TASK_ID: `F05_FIX10`  
STATUS: `COMPLETE / AWAITING_CHATGPT_REVIEW`  
START_HEAD: `c05704eda14916897bfa2f52b731aebef82c37aa`  
SEED: `40103`  
HORIZON: `1800` simulated days  
PRODUCTION_GAMEPLAY_CHANGE: `NONE`

## Decision

```text
PRIMARY_CLASSIFICATION: COVERAGE_REQUIRES_ACTION_SCHEMA_TARGETING
ACTIVE_CONFLICT_TRACK: DEFERRED_BY_GROUNDING_GATE
OUTCOME_TRACK: DEFERRED_BY_CONTINUITY_EVIDENCE
SECOND_LOBBY_REACHABILITY: NOT_REACHABLE
FUND_MOVEMENT_REACHABILITY: REACHABLE
ORGANIZE_REACHABILITY: NOT_REACHABLE
SELECTED_ACTION: FUND_MOVEMENT
TARGET_OBJECT_REQUIRED: YES
ACTION_SCHEMA_CHANGE_REQUIRED: YES
COMMITMENT_MODEL_STATUS: DESIGNABLE_AFTER_ACTION_SCHEMA_TARGETING
MAGNITUDE_GROUNDING_STATUS: BLOCKED_NO_AUTHORED_MAGNITUDE
PERSISTENCE_IMPLICATION: FUTURE_VERSION_REQUIRED_IF_COMMITMENT_STATE_IS_ADDED
PRODUCTION_GAMEPLAY_CHANGE: NONE
HISTORICAL_F05_BASELINE: UNCHANGED
F05_FIX9_DIAGNOSIS: UNCHANGED
GATE1F_RECOMMENDATION: NOT_READY
V02: NOT_STARTED
```

`FUND_MOVEMENT` is the only observed late-state action direction, but the
current T016 action grammar carries only `{ factionId }`. The late observation
contains two relevant Regions (`ideology-fixture.capital` and
`ideology-fixture.industrial`), and the existing T021 consumer reads
Region-scoped local mobilization. Selecting one silently would invent a target.
The next implementation task therefore needs an action-schema/targeting step
before it can define an internal commitment. No consequence is implemented by
F05_FIX10.

## Phase A — structural remedy eligibility

### ACTIVE_CONFLICT_EQUILIBRIUM

Classification: `DEFERRED_BY_GROUNDING_GATE`.

F05_FIX9's six late branches have two active conflicts, zero player-Country
LandHexes, zero front edges, and no coup territorial writer. F04B/T021 already
defines the only narrow internal recovery seam: an active `rebellion`, a valid
same-Country Government, affected Region state-control, and an existing
advantage margin can produce at most one normal LandHex recovery intent per
weekly boundary. The observed late state does not meet a proof of a missing
T021 writer. Changing fronts, combat, recovery, coup territorial behavior, or
war outcomes would enter the deferred War-as-Politics domain and violate the
LandHex/no-hidden-comeback boundary.

F05_FIX10 does not change T018, T021, `LandHex.controller`, combat strength,
front derivation, or recovery semantics.

### OUTCOME_ELIGIBILITY_STALEMATE

Classification: `DEFERRED_BY_CONTINUITY_EVIDENCE`.

F05_FIX2_R remains authoritative: zero Country-controlled LandHexes, domestic
Faction control, an active internal conflict, or government displacement prove
incumbent-government defeat/displacement, not disappearance of the same
Country as an independent political community. T022 still requires the
scenario-owned stable-region, capital, core-territory, capacity, treasury, and
active-civil-war criteria. T023 currently has supported
`stateContinuityThreshold` evidence and deferred `fullAnnexation`,
`permanentFragmentation`, and sovereign-function evidence.

F05_FIX10 does not change continuity writers, consolidation/dissolution
thresholds, successor Government rules, or terminal outcome semantics.

### INTERACTION_COVERAGE_EXHAUSTED

This is the only eligible direction for the next gameplay vertical slice. The
selection below is based on measured late-state reachability, not feature
preference.

## Phase B — second LOBBY reachability

The inspection replays the six exact F05_FIX9 late branches and records every
monthly political boundary from the late-interval start inclusive to the next
state-grounded signal exclusive. Each row records one of the two Faction
observations in the branch. The ledger contains 372 expanded faction-boundary
rows (186 per Faction):

| Branch | Late interval | Faction rows | FUND_MOVEMENT | ORGANIZE | LOBBY |
| --- | ---: | ---: | ---: | ---: | ---: |
| EARLY_PREVENTIVE_T0 / POLITICAL_ACCOMMODATION | 870–1710 (840d) | 56 | 56 | 0 | 0 |
| EARLY_PREVENTIVE_T1 / POLITICAL_ACCOMMODATION | 870–1710 (840d) | 56 | 56 | 0 | 0 |
| NEAR_CRISIS_T18 / POLITICAL_ACCOMMODATION | 870–1710 (840d) | 56 | 56 | 0 | 0 |
| NEAR_CRISIS_T18 / OPPOSITION_LEGALIZATION | 330–1440 (1110d) | 74 | 74 | 0 | 0 |
| NEAR_CRISIS_T19 / POLITICAL_ACCOMMODATION | 870–1710 (840d) | 56 | 56 | 0 | 0 |
| NEAR_CRISIS_T19 / OPPOSITION_LEGALIZATION | 330–1440 (1110d) | 74 | 74 | 0 | 0 |
| **Total** | — | **372** | **372** | **0** | **0** |

Each monthly political boundary contributes one row for each of the two
participating Factions. The exact six branches therefore contribute four
56-row branch ledgers and two 74-row branch ledgers: `4 × 56 + 2 × 74 = 372`.

At every observed row, `pressFreedom=censored`, so `LOBBY` is not legally
available. More importantly, even a hypothetical additional authored LOBBY
template would not be naturally selected: the existing chooser's first guard
is `FUND_MOVEMENT` at every row. No threshold, action priority, legal rule, or
template was changed to obtain this result. No second LOBBY template is added.

## Phase C — internal action coverage gates

### FUND_MOVEMENT

| Gate | Status | Evidence / boundary |
| --- | --- | --- |
| Natural reachability | PASS | 372/372 expanded faction rows select `FUND_MOVEMENT`; first winning guard is the FUND_MOVEMENT guard in every row. |
| Action object | FAIL | Current `FactionActionPayload` is only `{ factionId }`; the action label is not a commitment object. |
| Target | FAIL | Both late Factions observe two relevant Regions; T021 local mobilization is Region-scoped. No Region may be inferred silently. |
| Commitment | FAIL | No actor-owned internal commitment/lifecycle exists in current WorldState. |
| Cost / opportunity cost | FAIL | `Faction.resources >= 0.5` is an availability guard, not an action-specific spend or reservation. No political-power meter may be invented. |
| Bounded consequence | PASS in principle | Existing T018/T021 consumers read organization, resources, and local mobilization; F05_FIX10 adds no writer. |
| Magnitude grounding | FAIL | F05_FIX5 supplies resource-mobilization grounding but no action-specific numeric debit, duration, conversion, or combat magnitude. |
| Natural repeat limit | FAIL | Repeated accepted actions currently change only strategy label/event; no commitment prevents free monthly stacking. |
| Causal visibility | PASS in principle | A future grounded transition could be read by T018/T021/Agenda; no such transition is authored here. |
| Persistence/replay | FAIL for implementation | A future authoritative commitment would be new snapshot state and needs explicit versioning; current V4 remains unchanged. |
| No implementation-knowledge chooser | PASS | The audit did not suppress FUND_MOVEMENT or ORGANIZE to force LOBBY. |
| Reference grounding | PASS for direction | Accepted F05_FIX5 resource-mobilization/advocacy grounding supports the direction, not a numeric effect. |

### ORGANIZE comparator

`ORGANIZE` is not naturally reachable in the target late population (0/372
boundary selections). It also lacks an action object, explicit effort/cost,
bounded writer, magnitude grounding, and repeat limit. Its existing
organization consumers make it a possible future comparison, but not the
selected next slice in this task.

## Phase D — minimum grammar boundary

The design-only contract is recorded in
[`docs/FACTION_INTERNAL_COMMITMENT_KERNEL.md`](FACTION_INTERNAL_COMMITMENT_KERNEL.md).
It specifies the missing target/schema seam and the conditions a future task
would have to ground. It does not add an authoritative commitment record,
resolver, cost, effect, event, persistence field, or player-facing action.

The current V4 persistence contract remains unchanged for this task. If a
future task adds an authoritative internal commitment, that task must choose
and explicitly implement a persistence version/migration contract rather than
silently serializing new state as V4.

## Reproducibility and scope boundary

`pnpm run inspect:f05fix10` reuses the F05_FIX9 deterministic replay and emits
the full per-boundary ledger, including FactionId, grievance/resources/
organization/influence, legal actions, selected action, first winning guard,
hypothetical second-LOBBY result, relevant Regions, and blocker-state flag.
No production WorldState is mutated by the audit; cloned/replayed state is
discarded after measurement.

Historical 36-branch F05 remains unchanged. F05_FIX9's mixed-cause diagnosis
and six-branch/1110-day late-state evidence remain unchanged. Gate 1F remains
a ChatGPT/user decision; F05_FIX10 does not start V02 or authorize F05_FIX11.
