# F01 Long-run Headless Check

**Status:** F01 COMPLETE / PASS; F01A COMPLETE / PASS; F01B COMPLETE / PASS; F01C COMPLETE / PASS; F02 COMPLETE / PASS — 2026-08-23  
**Scope:** developer-only long-run measurement and commit-validation performance;
no new gameplay system

## Contract

F01 runs the existing simulation through:

```text
WAIT / zero accepted actions
  → runSimulationStep(..., { actions: [] }, ..., ScenarioDefinition)
  → commitSimulationStep(...)
  → next authoritative WorldState + EventStore
```

The harness does not mutate `WorldState` directly, does not add balance rules,
does not use `Math.random()`, and never inserts wall-clock time into simulation
authority. A terminal run stops before another step is called.

The baseline inspection uses the existing `t021.rebellion-fixture` with seed
`40101`. This is a diagnostic fixture, not a new production scenario.

## Supported horizons and measured result

Calendar: 360 authoritative daily ticks / simulated year.

| horizon | requested ticks | executed ticks | runtime | ticks/sec | outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| 5 years | 1,800 | 1,800 | 1.34 s | 1,340 | active |
| 10 years | 3,600 | 3,600 | 5.96 s | 604 | active |
| 20 years | 7,200 | 7,200 | 22.61 s | 319 | active |
| 40 years | 14,400 | 14,400 | 101.75 s | 142 | active |

The benchmark completed without invariant failures. The 20→40-year runtime
scale was approximately 4.50x in this measurement (wall-clock values are
machine-dependent). F01 therefore records:

> `PERFORMANCE BLOCKER BEFORE GATE1V` — T024 full-history validation scaling
> requires a pre-Gate-1V performance review.

This is the historical F01 baseline finding, not a new automatic balance gate.
No persistence optimization was performed at that baseline checkpoint.

## F01A incremental validation result

The measured bottleneck was the canonical `commitSimulationStep()` path:

- previous and candidate runtime closure were fully scanned on every tick;
- the complete EventStore history was revalidated on every tick;
- `appendEvent()` rebuilt prior ID/cause lookup data and copied the full event
  array for each append.

WAIT has no ActionRecords, so the growing ActionRecord history was not the
primary cost in this measurement. The fix separates the two trust contexts:

```text
serialize / deserialize / untrusted record
  → full closure + full EventStore validation

validated in-process RunRecord + runSimulationStep result
  → new event/action/commitment delta validation
  → candidate runtime closure
  → immutable append
```

Canonical status is held by process-local `WeakMap` metadata, not by a
serializable `validated` flag. F01B binds each trusted step result to the exact
source `WorldState` identity and consumes it once at commit. Event history
remains the sole EventStore authority; incremental causal lookup uses the
ordered event array and its deterministic sequence, without a second
authoritative event cache.

| horizon | before runtime | after runtime | speedup | after ticks/sec |
| --- | ---: | ---: | ---: | ---: |
| 5 years | 1.34 s | 0.497 s | 2.69x | 3,619 |
| 10 years | 5.96 s | 0.830 s | 7.18x | 4,336 |
| 20 years | 22.61 s | 1.561 s | 14.48x | 4,612 |
| 40 years | 101.75 s | 3.466 s | 29.36x | 4,155 |

The same seed (`40101`), scenario, WAIT policy, calendar, and requested
horizons were used. The after-run 20→40-year runtime scale was `2.22x`
(before: `4.50x`). Wall-clock values are machine-dependent; the scaling and
simulation-derived equivalence are the useful observations.

The 40-year simulation-derived result remained identical to the F01 baseline:
rebellion 1, coup 1, civil war 0, Government transition 0, LandHex control
changes 3, consolidation 0, dissolution 0, treasury `0/0/0`, stateCapacity
`20/20/20`, and player-controlled LandHex `3/0/0`. Outcome remained active.

Full serialize/deserialize validation, corrupt snapshot rejection,
cross-save causality, RNG persistence, replay equivalence, and failure
atomicity remain in force. Selected incremental commits are rechecked through
the full snapshot validator, and a deterministic full-commit comparison test
matches the incremental path.

**F01A decision:** `F02 READY`. No residual long-run performance blocker was
observed in this measurement. No balance or gameplay constants changed.

## F01B canonical trust hardening result

F01B preserved F01A's incremental continuation path while closing the
process-local trust gaps identified in the targeted architecture review:

- trusted `SimulationStepResult` metadata records the exact `sourceWorld`
  object identity, so a result from canonical Record A cannot commit to Record B
  even when their state values and ScenarioDefinition are equal;
- the result capability is consumed before parent or delta validation, so a
  failed commit cannot retry the same trusted result and a successful result is
  single-use;
- raw `markCanonical*` registration names were removed. Registration is kept at
  the trusted persistence/simulation seams and is not a serialized capability;
- canonical `RunRecord` and trusted result graphs are runtime-immutable. A
  process-local `WeakSet` skips objects already protected, so the implementation
  does not perform a full-history freeze traversal on every tick;
- full serialize/deserialize validation, corruption rejection, cross-save
  causality, replay equivalence, and atomicity remain active.

Representative post-hardening `inspect:f01` measurement on the same scenario,
seed, WAIT policy, and calendar:

| horizon | F01A baseline | F01B hardening | F01B ticks/sec |
| --- | ---: | ---: | ---: |
| 5 years | 0.497 s | 0.488 s | 3,690 |
| 10 years | 0.830 s | 0.842 s | 4,278 |
| 20 years | 1.561 s | 2.488 s | 2,893 |
| 40 years | 3.466 s | 7.089 s | 2,031 |

The representative 20→40-year scale was `2.85x` (F01A: `2.22x`). This is a
measured runtime-immutability cost, but it remains far below the original F01
full-history result (`101.75 s` for 40 years); no full-history validation was
restored and no gameplay-derived result changed. The measurement is not a hard
performance constant and should be rerun under the Gate 1V/F02 machine profile.

**F01B decision:** `F02 READY`. No residual performance blocker was observed;
the remaining benchmark debt is to monitor the hardening overhead during the
future long-run multi-seed survey. No balance or gameplay constants changed.

## F01C canonical registration and freeze atomicity result

F01C applied only the two trust-boundary corrections from the F01B targeted
review:

- RunRecord registration is private to the validated persistence seams, and
  SimulationStepResult registration is private to the simulation-step seam;
  public simulation exports contain no arbitrary canonical registration
  capability.
- Shared recursive freeze bookkeeping records an object as complete only after
  all reachable children are protected and the object itself is frozen. Failed
  traversal removes its in-progress marker, so a nested Map/Set fails again on
  retry and cannot become a stale completed graph.
- Parent binding, one-shot result consumption, incremental validation, full
  serialize/deserialize validation, replay, causality, and runtime immutability
  regressions remain PASS.

The representative F01C run measured 5-year `0.617s`, 10-year `0.994s`,
20-year `2.478s`, and 40-year `6.802s`; the 20→40-year scale was `2.74x`.
These are environment observations, not balance constants. F02 then completed
the multi-seed WAIT survey described below.

## 40-year WAIT baseline summary

- outcome: `active`; no terminal tick
- total events / EventStore size: 14,412
- ActionRecords: 0; rejected actions: 0
- rebellion detections: 1
- coup attempts: 1
- civil wars started: 0
- Government transitions: 0
- LandHex controller changes: 3
- order consolidation attempts/wins: 0 / 0
- state dissolutions: 0
- player controlled LandHex: start 3 / minimum 0 / final 0
- treasury: start 0 / minimum 0 / final 0
- stateCapacity: start 20 / minimum 20 / final 20
- instability: start 80 / peak 80 / final 0
- faction organization total: start 1.6 / final 1.6
- faction resources total: start 1.6 / final 1.6
- final faction grievance total: 1.6
- crisis-participating factions: 2

No pathology was flagged by the corrected 0–100 instability observation in this
run. The 40-year run remaining active is also not an automatic failure; pacing
and outcome diversity are measured in the F02 survey, while final pacing/fun
judgement remains a later F05 decision.

## Persistence regression

The same seed/scenario was run continuously and with a midpoint JSON path:

```text
continuous
→ serializeSimulationSnapshotJson
→ JSON parse / deserializeSimulationSnapshot
→ resume through canonical steps
```

At the 5-year baseline with a 2-year midpoint, final tick, outcome, event
history, RNG state, and serialized authoritative snapshot were equivalent.

## F02 multi-seed survey result

`pnpm run inspect:f02` ran the same T021 fixture with `WAIT` and seeds `0..22`
plus `40101`, for 24 sequential 40-year runs. The survey executed 345,600
authoritative ticks in `185.58s` (approximately `1,862.26 ticks/sec`). All
24 runs remained active through the requested horizon.

- rebellion `1 / 1 / 1`, coup `1 / 1 / 1`, civil war `0 / 0 / 0`, Government
  transition `0 / 0 / 0`, and territorial changes `3 / 3 / 3`
- exact and coarse history signatures: `1` each; largest cluster `24 / 24`;
  seed sensitivity not observed
- treasury and stateCapacity were unchanged in all 24 seeds; faction
  organization total start/peak/final stayed `1.60–1.60`
- all 24 seeds reached zero controlled LandHex, none recovered, and all remained
  active at zero; this does not change T023's `0 Hex != dissolution` contract
- consolidation eligibility and dissolution were reached by `0 / 24` seeds;
  longest political silence was approximately `39.94` years

The resulting diagnostic concerns are recorded in
`docs/F02_MULTI_SEED_OUTCOME_SURVEY.md`; they are observations for F03/F05, not
automatic balance changes or an opaque fun score.

## Verification boundaries

- long benchmark is run by `pnpm run inspect:f01`, not normal unit CI
- small harness tests cover deterministic summary, 360-day conversion,
  terminal early stop, telemetry non-authority, and JSON resume equivalence
- F02 multi-seed outcome survey: COMPLETE / PASS (`pnpm run inspect:f02`)
- F03 intervention counterfactual: COMPLETE / PLAYER_AGENCY_WEAK; `inspect:f03`
  records administrative-only divergence and the current downstream integration
  concern without changing gameplay
- F04 exploit/degeneracy survey: not started
- F05 pacing/fun decision: not started
- V02 renderer and Gate 1V visual work: not started
