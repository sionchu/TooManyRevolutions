# F05_FIX14 FUND_MOVEMENT Commitment Lifecycle Closure

STATUS: `IMPLEMENTED / AWAITING_CHATGPT_REVIEW`
PRIMARY_CLASSIFICATION: `FUND_MOVEMENT_LIFECYCLE_IMPLEMENTED_LATE_SILENCE_PERSISTS`
NEXT_IMPLEMENTATION_READINESS: `PIVOT_FROM_FUND_MOVEMENT`

F05_FIX14 closes the bounded lifecycle question for the scenario-authored
targeted FUND_MOVEMENT commitment. It also makes targeted schema-v2 application
semantically atomic without changing the legacy schema-v1 strategy-only path.

```text
targeted-v2 ActionRecord
 -> validate exact authored profile and current feasibility
 -> mutate strategy and create active commitment together
 -> monthly authoritative-state reassessment
 -> active or resolved(actorIntentCeased)
 -> derived available-resource restoration
 -> Agenda active-cause removal
 -> strict SerializedSimulationSnapshotV6 replay
```

## Atomic application

A targeted-v2 action validates profile target/amount, explicit target presence,
target control, available resources, active duplicate status, and terminal state
before changing `Faction.currentStrategy`. A business-invalid action therefore
creates no commitment, emits no commitment/strategy success event, and leaves
strategy unchanged. Legacy v1 continues to change only strategy.

## State-grounded lifecycle

At the existing monthly faction political boundary, each active commitment is
reassessed with the existing `FactionObservation` and unchanged
`chooseFactionActionType()` ordering. Only that commitment is excluded from its
own duplicate and earmark projection. The decision reads current authoritative
Country, Region, Faction, ideology, policy, territorial control, and all other
active earmarks.

If the actor would no longer choose FUND_MOVEMENT, the record moves from
`active` to `resolved`, records the current tick and `actorIntentCeased`, and
emits one `FACTION_FUND_MOVEMENT_RESOLVED` event tied to the source ActionRecord.
No elapsed-time rule, timer, duration, cooldown, countdown, `currentStrategy`
shortcut, payoff, or new meter participates in the transition.

Resolved earmarks no longer reduce derived available resources and no longer
appear as active Agenda evidence. They remain in authoritative history. A later
state-grounded FUND_MOVEMENT choice may create a new commitment with a new
ActionRecord; an active same-actor/same-target duplicate remains blocked.

## Counterfactual evidence

The developer-only diagnostic ran the same profile-enabled composition for
1,200 days with seed 51414.

```text
no response:
  creation ticks: 31,31
  resolutions: none
  active/total at end: 2/2

existing political-accommodation response:
  response submitted: tick 32
  rebellion commitment resolved: tick 60, actorIntentCeased
  observed active duration: 29 ticks
  available resources: 0.5 -> 0.8
  active Agenda cause: true -> false
  later state-grounded recommitment: tick 211
  active/total at end: 2/3
```

Both paths had zero duplicate/churn violations, no resource debit, and no
forbidden writer. The response path proves an actual state-grounded lifecycle
difference and resource restoration. The no-response path remains silent for
the full late horizon, so late reassessment did not materially improve.

Historical F05 remained unchanged. F05_FIX9 retained ticks 1110/1200, branches
108/108, and late population 6. F05_FIX13 retained two commitments with first
creation at tick 31 and no duplicate success.

## Persistence and determinism

Persistence advances from V5 to strict V6. The decoder distinguishes active
and resolved record shapes, validates resolution reason/tick, requires exactly
one matching resolution event for each resolved commitment, forbids one for an
active commitment, and rejects orphan resolution events and V5 snapshots.

Focused verification covers uninterrupted versus save/load replay equality and
commitment insertion-order-independent serialization. The lifecycle result is
therefore replayable without storing a timer or duplicating a derived resource
balance.

This result does not pass Gate 1F, start V02, or authorize F05_FIX15.
