# Faction Internal Commitment Kernel — F05_FIX10 Design-Only Contract

STATUS: `DESIGN_ONLY / NOT IMPLEMENTED`  
TASK: `F05_FIX10`  
SELECTED_DIRECTION: `FUND_MOVEMENT`  
PRIMARY_CLASSIFICATION: `COVERAGE_REQUIRES_ACTION_SCHEMA_TARGETING`

This document is a design boundary for a possible future internal faction
action. It is not an authoritative schema, resolver, balance rule, or
production gameplay change. F05_FIX10 does not create the commitment state.

## Why the schema seam comes first

The accepted action currently has this bounded payload:

```ts
{ factionId }
```

The late replay observes two relevant Regions for both participating Factions:
`ideology-fixture.capital` and `ideology-fixture.industrial`. Existing T021
local mobilization is derived over affected Regions, but an internal action
cannot silently choose one of them. An honest future action therefore needs an
explicit target object before a commitment can be created.

No target Region, target LandHex, cost, amount, duration, or conversion ratio is
chosen here.

## Minimum future grammar

The future contract must preserve the existing common intake sequence:

```text
heuristic observation
-> typed FUND_MOVEMENT proposal with explicit target
-> accepted ActionRecord
-> actor-owned internal commitment
-> explicit cost/opportunity reservation
-> bounded resolution
-> existing authoritative consumer
-> player-visible reassessment
```

### Action object and target

- `actionType` remains `FUND_MOVEMENT`.
- The future schema must extend the current faction-action payload with an
  explicit target identity, at minimum a `RegionId`-like existing object.
- The target must be validated against the Faction's current country/affected
  Region relevance. Unknown, foreign, or ambiguous targets must be rejected.
- A target must not be inferred from Faction name, ideology label, sorted Region
  order, or whichever Region happens to have the highest current signal.
- The action's `sourceActionId`, FactionId, target identity, and schema version
  must remain available for deterministic provenance.

### Commitment identity and lifecycle

A future commitment identity may be derived deterministically from the accepted
ActionRecord identity and explicit target. It must remain distinct from
`Faction.currentStrategy`.

The minimum lifecycle is:

```text
accepted -> active -> resolved
                    \-> rejected
```

The future resolver must specify the exact rejection/no-op reason and retain
source provenance in the event/action evidence. An active commitment for the
same actor/target must not be accepted as a free duplicate; repeat behavior
must come from commitment identity/lifecycle, not an arbitrary cooldown or
countdown.

### Cost and opportunity cost

`Faction.resources` is an existing authoritative stock and T021 already reads
its bounded signal. F05_FIX10 does not decide whether a commitment reserves,
spends, or merely earmarks that stock, and it does not choose a numeric amount.
A future task must ground:

- who owns the committed resource;
- when the resource becomes unavailable to another action;
- what causes resolution, rejection, or failure;
- how the opportunity cost is visible without a generic political-power meter.

The existing `Faction.resources >= 0.5` chooser guard is availability evidence,
not a cost formula.

### Bounded consequence and consumer

The only presently grounded downstream candidates are existing readers:

- T018 reads faction resources/organization and local political prerequisites;
- T021 derives faction operational capacity from organization, resource signal,
  and affected-Region local mobilization;
- Agenda reads faction grievance/organization/resources as explanatory state.

F05_FIX10 does not select a direct delta for any of these fields. A future
resolver must prove one bounded transition and its failure modes before it can
write state. It must not write a Conflict, crisis, LandHex controller,
continuity, terminal outcome, or hidden recovery directly.

### Magnitude and repeat boundary

No action-specific debit, organization gain, operational-strength bonus,
duration, percentage, or conversion ratio is currently grounded. A future task
must provide separate mechanism evidence and an authored scenario-owned value
before writing any magnitude. Repeated monthly `FUND_MOVEMENT` records must be
no-op/rejected/continued according to the explicit commitment lifecycle, not
because an arbitrary timer was added.

### Persistence and replay

The current repository uses `SerializedSimulationSnapshotV4` and keeps V4
unchanged in F05_FIX10. An authoritative internal commitment would be new
runtime state, so a future implementation task must explicitly version and
validate its snapshot/replay contract. It must cover action provenance,
commitment lifecycle, target identity, rejected/no-op behavior, insertion-order
determinism, and uninterrupted versus save/load replay.

## Deliberately unsupported here

- no production payload/schema change;
- no authoritative commitment record or resolver;
- no resource debit, organization delta, grievance delta, or scalar effect;
- no new proposal subject or second LOBBY template;
- no BARGAIN, counteroffer, settlement, war, crisis, conflict, LandHex,
  continuity, successor Government, terminal, UI, or V02 behavior;
- no change to `chooseFactionActionType()` thresholds or priority;
- no authorization of F05_FIX11 or Gate 1F.

