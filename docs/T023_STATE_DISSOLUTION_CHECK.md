# T023 State Dissolution Check

**Status:** COMPLETE / PASS  
**Date:** 2026-08-22

## Scope

T023 adds the smallest deterministic terminal-defeat boundary for actual state
dissolution. It does not implement save/load, replay, annexation, permanent
fragmentation, sovereign-function simulation, successor states, Gate 1V, UI, or a
state-continuity writer/formula.

## Locked contract

- `ScenarioDefinition.dissolutionCriteria` is the only criteria source.
- `deriveStateDissolutionEligibility()` is a pure read model.
- The only currently supported evidence is the inclusive comparison
  `Country.stateContinuity <= stateContinuityAtOrBelow`.
- Configured full annexation, permanent fragmentation, and sovereign-function loss
  are reported as deferred until authoritative evidence exists.
- Occupation, capital loss, treasury, instability, state capacity, Government or
  regime transition, ideology state, rebellion, and civil war do not independently
  cause defeat.
- Dissolution is checked before T022 in the combined evaluation phase. A dissolving
  step emits `STATE_DISSOLVED` and skips `ORDER_CONSOLIDATED`.
- `STATE_DISSOLVED.causeIds` is `[]` without an actual source event, and
  `RunOutcome.causeEventId` points to the emitted event.
- Terminal runs do not advance date, tick, RNG, phases, actions, or events.

## Inspection

Run:

```text
pnpm run inspect:t023
```

The deterministic fixture covers:

- Case A: negative treasury is not dissolution
- Case B: instability 100 is not dissolution
- Case C: capital loss is not dissolution
- Case D: Government transition preserves CountryId and is not dissolution
- Case E: active civil war is not dissolution
- Case F: supported state-continuity threshold emits one terminal event
- Case G: dissolution takes precedence over a final consolidation tick
- Case H: ordinary T022 consolidation remains unchanged
- terminal follow-up: no duplicate event or clock/RNG advancement
- occupation-only control change: not inferred as annexation

## SAFE_TO_DEFER

- authoritative state-continuity writer and final threshold balance
- full-annexation evidence, permanence/recovery state, sovereign functions, and
  successor-state behavior
- T024 persistence/replay, scenario-aware LandHex deserialization invariants, and
  cross-tick causal event history (deferred at T023 close; resolved by T024)
- authoritative `localeCompare` audit in `economy.ts` and `resources.ts`
  (deferred at T023 close; resolved by T024)

At T023 close, T024 was gated on resolving the deferred serialization and
replay-causality boundaries. T024 now provides that boundary; its Terra review is
still required before Gate 1V.
