# F05_FIX13 Targeted FUND_MOVEMENT Commitment Vertical Slice

STATUS: `IMPLEMENTED / AWAITING_CHATGPT_REVIEW`
PRIMARY_CLASSIFICATION: `TARGETED_COMMITMENT_KERNEL_IMPLEMENTED_BUT_LATE_REASSESSMENT_UNCHANGED`
NEXT_IMPLEMENTATION_READINESS: `COMMITMENT_CONSEQUENCE_OR_LIFECYCLE_REVIEW`

F05_FIX13 consumes the explicit `FactionFundMovementTemplate` seam from
F05_FIX12. It adds one bounded runtime path for a profile-enabled scenario:

```text
FactionFundMovementTemplate
 -> targeted FUND_MOVEMENT ActionProposal (schema 2)
 -> accepted ActionRecord
 -> exact profile validation
 -> active actor-owned commitment
 -> derived available resources
 -> duplicate guard
 -> Agenda evidence
 -> SerializedSimulationSnapshotV5 replay
```

## Authoritative state

`WorldState.factionFundMovementCommitments` stores only:

- deterministic commitment ID;
- source `ActionId`;
- actor `FactionId`;
- authored target `RegionId`;
- authored positive `resourceAmount`;
- `createdAtTick`;
- `active` status.

The commitment is an active earmark. `Faction.resources` is not debited or
gained. Available resources are derived as current stock minus active earmarks,
clamped at zero for feasibility projection. An active commitment for the same
Faction and Region blocks a second success without a timer or cooldown.

Scenarios without a FUND_MOVEMENT profile continue to use the v1
`{ factionId }` payload and do not create a commitment. The existing chooser
priority and threshold checks remain unchanged; a profile-enabled chooser only
adds current-resource and active-duplicate feasibility to
`availableActions.FUND_MOVEMENT`.

## Evidence boundary

One `FACTION_FUND_MOVEMENT_COMMITTED` event records the source action,
commitment, faction, target, authored amount, and creation tick. The existing
faction-pressure Agenda read model exposes the exact target and amount as
evidence without changing severity. No organization, grievance, influence,
Country, Region, Conflict, LandHex, continuity, terminal, or crisis writer was
added to this slice.

Persistence is explicitly advanced from V4 to V5. The decoder requires the
new commitment record, rejects unknown fields, validates entity references and
source provenance, requires exactly one creation event, and rejects V4 input.
Canonical record sorting preserves insertion-order-independent snapshots and
continuous versus save/load replay.

## Developer-only diagnostic

`inspect:f05fix13` runs the profile-enabled composition for 1200 days and also
checks the existing F05_FIX9 late-state reference at ticks 1110 and 1200. The
executed result was:

```text
profile-enabled commitments: 2
first commitment tick: 31
duplicate commitment success events: 0
chooser FUND_MOVEMENT after active: 0
Agenda exposure ticks: 1170
resource debit observed: false
historical F05 baseline: UNCHANGED
F05_FIX9 reference branches at 1110/1200: 108/108
late reassessment changed: false
```

This is a targeted commitment kernel result, not a pacing, Gate 1F, V02, or
terminal-outcome result.
