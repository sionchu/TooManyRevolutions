# F05 Gate 1F Repair 4 — Deterministic Actor Loop

Date: 2026-08-24
Task: `F05_FIX4`
Seed: `40103`
Official horizon: `1,800` days / 5 years
Official actor mode: `ON`

## Result at a glance

The missing T016 proposal hand-off is repaired. Faction proposals now enter the
common ActionRecord intake exactly once on the immediately following tick when
the F05 developer runner opts into the actor loop. The normal simulation phase
changes `Faction.currentStrategy` and emits `FACTION_STRATEGY_CHANGED`.

The repair does not produce a meaningful active-conflict consequence in the
current consumers. The official F05 matrix therefore remains `NOT_READY`:

```text
ACTOR_ACTION_CONSUMER_GAP
GATE1F_RECOMMENDATION: NOT_READY
```

No new faction effect, continuity writer, terminal rule, balance constant, RNG,
solver, LLM, MCP process, or external runtime dependency was added.

## Pre-FIX diagnosis

The source path was verified as:

```text
T016 current WorldState
-> FactionObservation / legal availability
-> deterministic rule-ordered action
-> heuristic ActionProposal for the following tick
-> runSimulationStep().actionProposals
-> [F03/F05 previously discarded this output]
```

The common intake and authoritative execution already existed:

```text
acceptActionProposal(s)
-> deterministic id + global sequence + accepted record
-> factionPressure
-> currentStrategy + FACTION_STRATEGY_CHANGED
```

The defect classification is `FACTION_PROPOSAL_INTAKE_GAP`. In the detached
OFF runner, the representative WAIT branches generated 120 proposals each and
accepted 0:

| Representative context | Generated | Accepted pre-FIX4 | Strategy changes | Dominant late proposal types | Stale strategy observation |
| --- | ---: | ---: | ---: | --- | --- |
| Early `T0` | 120 | 0 | 0 | `FUND_MOVEMENT` 106, `ORGANIZE` 10, `LOBBY` 4 | proposals repeated while both strategies stayed `wait` |
| Near crisis `T18` | 120 | 0 | 0 | `FUND_MOVEMENT` 106, `ORGANIZE` 10, `LOBBY` 4 | same |
| Recovery `T180` | 120 | 0 | 0 | `FUND_MOVEMENT` 114, `ORGANIZE` 6 | same |

## Implementation

### Reusable orchestration seam

`src/sim/inspection/factionActorLoop.ts` provides the developer-only
`intakeFactionHeuristicProposals()` seam. It accepts only:

- `source = "heuristic"`;
- the bounded `FACTION_ACTION_TYPES` vocabulary;
- schema version `1`;
- an exact payload `{ factionId }` naming a faction present in the current
  world;
- `proposal.tick = world.tick + 1`.

The helper sorts by stable `FactionId`, then action type, rejects stale,
malformed, unknown, wrong-domain, and duplicate proposals, and returns accepted
records through `acceptActionProposals()`. The caller clears the transient
pending array after intake. No pending proposal is added to `WorldState`,
`RunRecord`, or the authoritative action log.

`runF03StrategyFromRecord()` now exposes `factionActorLoop: "off" | "on"`.
Historical F03/F04 callers remain OFF by default. F05 explicitly runs ON.
When player and carried faction actions share a target tick, player records
receive the first global sequence values and canonical faction records follow;
this is an explicit log order, not a gameplay priority. The faction phase still
resolves the complete accepted input through the normal authoritative path.

### Exactly-once and replay behavior

- duplicate proposals in one pending batch are accepted once;
- stale proposals are dropped rather than retargeted;
- the buffer is cleared after intake and replaced only by the next step’s
  output;
- accepted faction actions have unique global sequences beside player actions;
- persistence/replay continues from canonical snapshot state and accepted
  ActionRecords; pending proposals are not persisted;
- no direct faction/world mutation occurs in the helper.

## Actor-loop counterfactual

The same seed, contexts, five-year horizon, strategies, and scenario were run
with actor intake OFF and ON. The table uses the representative WAIT branch so
the actor effect is isolated from player intervention policy.

| Context | Mode | Generated / accepted | Strategy changes | Final strategies | Δ grievance / organization / resources | Agenda changes | First crisis | Final conflict / territory / outcome | Genuine reassessment silence |
| --- | --- | ---: | ---: | --- | --- | --- | ---: | --- | ---: |
| Early `T0` | OFF | 120 / 0 | 0 | both `wait` | +0.935 / +0.200 / 0 | 30, 270, 540, 870, 900, 930, 1020, 1260, 1770 | 19 | 2 / 0 / active | 510d |
| Early `T0` | ON | 120 / 118 | 5 | both `fundMovement` | +0.935 / +0.200 / 0 | same as OFF | 19 | 2 / 0 / active | 510d |
| Near `T18` | OFF | 120 / 0 | 0 | both `wait` | +0.935 / +0.200 / 0 | 270, 540, 870, 900, 990, 1230, 1740 | 1 | 2 / 0 / active | 510d |
| Near `T18` | ON | 120 / 120 | 5 | both `fundMovement` | +0.935 / +0.200 / 0 | same as OFF | 1 | 2 / 0 / active | 510d |
| Recovery `T180` | OFF | 120 / 0 | 0 | both `wait` | +0.695 / +0.080 / 0 | 90, 360, 690, 720, 750, 840, 1080, 1590 | 120 | 2 / 0 / active | 510d |
| Recovery `T180` | ON | 120 / 118 | 3 | both `fundMovement` | +0.695 / +0.080 / 0 | same as OFF | 120 | 2 / 0 / active | 510d |

The ON action sequence is canonical and visibly executed (for example, early
starts `31:t018.fixture.coup-faction:LOBBY`, then
`31:t018.fixture.rebellion-faction:ORGANIZE`, followed by the same target-tick
ordering at days 61, 91, and 121). The proposal type distribution remains
state-derived: the early and near branches are `FUND_MOVEMENT` 106,
`ORGANIZE` 10, `LOBBY` 4; recovery is `FUND_MOVEMENT` 114, `ORGANIZE` 6.

Across these comparisons, actor intake changes the strategy label and its
event evidence, but not grievance, organization, faction resources, Agenda
composition/timing, crisis timing, conflict count, territory, feasibility,
terminal outcome, or the longest genuine reassessment silence. This is
`INTAKE_FIX_STRATEGY_ONLY`, not a pacing pass.

## Official F05 remeasurement (actor ON)

The unchanged matrix is the six required strategies over contexts
`0/1`, `18/19`, and `180/181`:

| Measure | Early representative | Near-crisis representative | Recovery representative |
| --- | --- | --- | --- |
| WAIT classification | `WAIT_WORSE` | `WAIT_WORSE` | `TRADEOFF` |
| Meaningful paid responses | 4 | 4 | 3 |
| WAIT proposals generated / accepted | 120 / 118 | 120 / 120 | 120 / 118 |
| WAIT strategy changes | 5 | 5 | 3 |
| Distinct trajectory histories | 6 | 6 | 6 |
| Readable arc | NO | NO | YES |
| Visible causal histories | YES | YES | YES |
| Longest major-event silence | 1695d | 1713d | 1787d |
| Longest genuine reassessment silence | 1200d | 1200d | 510d |
| Terminal outcomes | active | active | active |

Overall F05 remains:

```text
Accommodation: CONDITIONALLY_STRONG
Silence diagnosis: MIXED_GAP
Recommendation: NOT_READY
```

The ON loop restores real actor execution and preserves the repeated-
accommodation probe. It does not close the late steady-state return because the
active-conflict consumers still do not use `currentStrategy` to alter conflict
strength/intent/recovery, territory, terminal eligibility, or another
player-facing response consequence.

## Gate interpretation and next narrow task

`FACTION_STRATEGY_CHANGED` remains diagnostic evidence only. It is deliberately
not in the F05 pacing-event set, and the focused test verifies that inert
strategy events do not shorten reassessment silence.

The next task, if authorized, should ground and implement one existing,
non-terminal faction-action consequence for the active-conflict path, with an
explicit consumer and payoff contract. It must not add a continuity writer or
alter the Gate 1F terminal rules.
