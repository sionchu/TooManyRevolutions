# F04A — Endogenous Faction Dynamics / One-Way Ratchet Repair

Date: 2026-08-24  
Scenario: `gate1f.validation` v1  
Policy: deterministic legal branches  
Primary inspection horizon: 10 simulated years / 3,600 ticks per branch

## Scope

F04A repairs the missing endogenous writer for the existing authoritative
`Faction.grievance` and `Faction.organization` fields. It does not add a new
political subsystem, intervention, policy, RNG mechanic, crisis scheduler,
conflict rule, recovery rule, renderer, or V02 work.

The existing F03A effects remain unchanged:

- `short`: industrial food production capacity `+6`
- `long`: coup faction organization `-0.3`
- `prerequisite`: rebellion faction grievance `-0.3`

The repair adds bounded monthly movement from current world drivers. It does
not guarantee a crisis, victory, dissolution, territorial recovery, or
Government transition.

## Writer audit

| Field | Before F04A | F04A writer | Other writers |
| --- | --- | --- | --- |
| `Faction.grievance` | initialization and F03A completion effect only | `factionPressure` at the existing T016 monthly boundary | F03A completion effect remains |
| `Faction.organization` | initialization and F03A completion effect only | `factionPressure` at the existing T016 monthly boundary | F03A completion effect remains |

The writer uses immutable replacement of the faction record. It does not emit
a monthly state-change event and does not write `Country.instability`,
`Region.unrest`, ideology state, `LandHexRuntimeState.controller`, conflicts,
Government, or `RunOutcome` directly.

## Driver contract

`deriveFactionDynamicsSnapshot()` is a pure diagnostic/derivation helper over
existing authoritative state. It uses stable Region/Faction ordering and no
randomness.

Grievance moves toward the largest current hostile pressure among:

- regional scarcity,
- regional unrest,
- weak regional `stateControl`,
- Country legitimacy weakness,
- Country state-capacity weakness,
- Country instability.

Organization is resource-capped and moves toward the larger of faction
influence or local political activation. Local activation is derived from
existing affinity-weighted ideology radicalism/organization and local unrest.
`support` alone and `currentStrategy` alone are not drivers. Downstream code
does not inspect intervention IDs.

Movement is bounded by the existing `0..1` faction dimensions and uses the
provisional Gate 1F step `0.02` per existing monthly political boundary. The
step is a recovery-timescale diagnostic constant, not a final balance lock.
There is no weighted generic political score or hidden intervention meter.

## Phase and authority boundary

The existing authoritative step order remains:

```text
scheduled effects / accepted actions
→ economy / resources / ideology diffusion
→ T016 faction pressure boundary
   → bounded faction dynamics replacement
   → faction proposals
→ T017 instability
→ T018/T021 conflict consumers
→ T022/T023 evaluation
```

F03A completion effects are applied through the existing commitment lifecycle
before the faction-pressure phase. F04A then lets the same phase read the
updated state at its normal cadence. Crisis events are still detected by the
existing T018 rules; F04A does not schedule rebellion, coup, civil war,
territorial change, consolidation, or dissolution.

## Verification evidence

The unit contract covers:

- grievance rising again under hostile material/political drivers,
- no forced rebound under stable low pressure,
- organization rebuilding under strong current drivers,
- no organization rebuild under weak drivers,
- bounds and insertion-order independence.

The developer inspection `pnpm run inspect:f04a` reuses the F03 branch seam and
reports the accepted intervention, completion tick, faction values at start,
one year, and horizon end, plus the persistent state difference and political
history difference. For the current `gate1f.validation` run:

- all 9 tracked State A branches were accepted;
- all 9 retained a horizon state difference from WAIT;
- long/prerequisite faction effects recovered by the 10-year horizon;
- no one-way-ratchet path remained in the F04A inspection;
- political event, Government, territory, and outcome history remained the
  same as WAIT in this fixture.

This separates the repaired one-way state issue from the still-open F04/F05
concerns: active-conflict lifecycle absorption, pre-crisis timing cliffs,
WAIT dominance candidates, and the lack of zero-territory recovery remain
measurement findings and were not changed here.

### Historical F04 gate-shutoff reclassification

The F04 `CHEAP_PERMANENT_GATE_SHUTOFF` observation belongs to the pre-F04A
baseline. It is retained as historical evidence only. After F04A, endogenous
grievance/organization recovery means the intervention effect is not permanent
immunity: current `inspect:f04` does not reproduce the concern. The current
single-action measurements are a `149/3601` tick coup-eligibility difference
for `SINGLE_LONG` and a `0` tick rebellion-eligibility difference for
`SINGLE_PREREQUISITE`.

### F02 WAIT regression after F04A

The 24-seed, 40-year no-intervention survey was rerun after this repair:

- `345,600 / 345,600` ticks, `137.79 s`, approximately `2,508 ticks/s`
- `active 24/24`, `orderConsolidated 0/24`, `stateDissolved 0/24`
- rebellion `1/1/1`, coup `1/1/1`, civil war `0/0/0`, Government transition
  `0/0/0`, territorial changes `3/3/3`
- exact/coarse signature `1/1`, largest cluster `24/24`, seed sensitivity
  **NOT OBSERVED**
- treasury unchanged `24/24`, stateCapacity unchanged `24/24`, faction
  organization total remained `1.60–1.60` at start/peak/final
- controlled Hex `0` reached `24/24`, recovered `0/24`, final active at zero
  `24/24`; longest political silence remained about `39.94` years

The political and territorial WAIT baseline therefore remains unchanged. The
F04A writer did not contaminate no-intervention history or introduce RNG. The
updated endogenous baseline still carries F02 concerns such as economic
stasis, low history diversity, long silent intervals, no consolidation, and
zero-territory persistence; those concerns are not balance decisions in F04A.

## Persistence and determinism

Faction updates use the canonical immutable replacement path. Existing T024
serialization/deserialization, replay, F03A exactly-once completion, and
F01C canonical ownership boundaries remain in force. The derived dynamics
snapshot is not persisted, and no new authoritative target/cursor/progress
field is stored.

## Scope decision

- gameplay balance tuning: **NO**
- new intervention/policy/RNG: **NO**
- direct crisis/conflict/recovery scheduling: **NO**
- F04B: **COMPLETE / Terra targeted review pending**
- F05: **NOT STARTED**
- V02/renderer/UI/assets: **NOT STARTED**

F04A closes the observed faction one-way-ratchet repair slice. The remaining
F04 concerns require a separate repair/decision; they are not silently
reclassified as solved by this task.
