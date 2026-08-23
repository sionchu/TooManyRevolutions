# T022 Order Consolidation Check

**상태:** COMPLETE — 2026-08-22

## Contract

`ScenarioDefinition.orderConsolidationCriteria` is the only victory criteria
source. `deriveOrderConsolidationEligibility()` is a pure read model with
criterion-level evidence; it reads current `Country`, `Region`, relevant active
`Conflict`, and LandHex-derived territorial projections without mutating state.

`requiredStableRegionIds`, `requiredControlledCoreRegionIds`, and capital control
require full control of every relevant LandHex by the player Country. An optional
scenario-owned `maximumStableRegionUnrest` is an inclusive 0–1 threshold. If it is
omitted, no global unrest threshold is applied. `ownerCountryId` and
`contestedRegionIds` are not territorial authority.

Configured positive `requiredConsecutiveTicks` is evaluated after conflict and before
`closeDay`: eligible ticks increment by one, any failed criterion resets progress to
zero, and recovery starts a new streak. `ORDER_CONSOLIDATION_STARTED` is emitted on
the first eligible tick and `ORDER_CONSOLIDATED` on the exact final tick. Neither
event invents causality; `causeIds` are empty unless a future explicit causal source
exists. `RunOutcome.causeEventId` points to the consolidated event.

`requiredConsecutiveTicks: 0` is the explicit disabled value for the Gate 0
foundation and legacy fixtures. T023 dissolution, simultaneous win/defeat precedence,
persistence/replay, UI, ending presentation, and Gate 1V remain outside T022.

## Inspection

Run:

```bash
pnpm run inspect:t022
```

The deterministic report covers:

- Case A — near miss at state capacity
- Case B — three-tick success and terminal no-op
- Case C — capital loss, reset, restoration, and restart
- Case D — Government transition with CountryId continuity
- Case E — derived regime classification neutrality
- Case F — partial capital control
- Case G — relevant active civil war

The diagnostic criteria fixture is not production T025 content or final balance.
