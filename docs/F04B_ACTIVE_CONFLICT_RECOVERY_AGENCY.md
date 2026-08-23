# F04B — Active Conflict Response / Internal Recovery Agency Repair

Status: **COMPLETE / implementation PASS**  
Next required review: **Terra targeted architecture review**  
Scope: T021 active-conflict response and conditional internal zero-territory
recovery only.

## Finding and repair boundary

F04/F04A identified two related observations:

- T021 already derived faction operational strength from current
  `Faction.organization`, `Faction.resources`, and local political activation,
  but this needed an explicit active-conflict regression proof.
- Government recapture was front-based. When a Country had no
  country-controlled LandHex, there was no government source Hex and therefore
  no front edge from which to derive a recapture intent. The active Country
  could remain at zero territory indefinitely even when a valid Government,
  military capability, and residual regional state penetration remained.

F04B does not turn zero territory into defeat. It adds only a conditional,
internal `rebellion` recovery intent. The intent is still derived at the T021
weekly phase-start boundary and is applied through the existing
`changeLandHexController()` seam.

## Active-conflict causal audit

| Current state | Consumer | Cadence | Meaning |
|---|---|---:|---|
| `Faction.organization` | T021 faction operational strength | weekly resolution | Current organizational capability, not a conflict-creation snapshot |
| `Faction.resources` | T021 resource signal and operational strength | weekly resolution | Current material capability |
| local ideology/radicalism/organization and `Region.unrest` | T021 local mobilization | weekly resolution | Current affected-region activation |
| `Faction.grievance` | T018 prerequisite read model and no-territory suppression | conflict phase | Creation/persistence condition, not occupied-conflict deletion |
| `Conflict` active/dedup identity | T018 duplicate prevention and T021 resolver | daily/weekly | Prevents duplicate creation; it is not conflict immunity |
| current LandHex controllers | T021 fronts and recovery target selection | weekly resolution | Sole physical territorial truth |
| `Region.stateControl` | recovery candidate evidence | weekly resolution | Residual state penetration, not territorial control |

T018 creation eligibility, active-conflict operational state, and no-territory
suppression remain separate. A grievance decrease does not delete an occupied
rebellion: suppression still requires the rebellion to have zero faction-held
LandHexes and current rebellion prerequisites to be ineligible.

## Recovery contract

The zero-territory path is intentionally narrow:

- conflict kind: active internal `rebellion` only;
- `WorldState.run.outcome` must remain active;
- the participant Country must exist and its `currentGovernmentId` must resolve
  to a Government for that same CountryId;
- the conflict must name affected Regions;
- a candidate Region must be in those affected Regions, retain the Country as
  `ownerCountryId`, and have positive current `stateControl`;
- the selected LandHex must currently be controlled by the participating
  faction;
- government recovery strength is the existing Country military capability
  multiplied by the selected Region's current state-control value;
- that strength must exceed the current faction operational strength by the
  existing T021 advantage margin;
- at most one target is produced per conflict per weekly boundary.

The Region owner is used only as a legal/historical relevance check. It is not
copied into a controller field. Recovery does not modify ownership,
`stateControl`, ideology, Government, ContactGraph topology, consolidation,
dissolution, or conflict status. It only creates the normal
`LAND_HEX_CONTROL_CHANGED` event through the canonical LandHex writer.

Candidate ordering is descending `stateControl`, then stable RegionId and
LandHexId order. Intents are still collision-resolved with the existing
ConflictId/target ordering. No same-boundary cascade, army/unit entity,
pathfinding, logistics, foreign-war recovery, or coup territorial behavior was
added.

## Inspection evidence

`pnpm run inspect:f04b` reports the following developer-only cases:

- strong residual state: `stateControl 0.800`, government recovery strength
  `80`, faction operational strength `61.538`; exactly one industrial LandHex
  is restored and the rebellion remains active;
- weak residual state: `stateControl 0.100`; no recovery intent and no LandHex
  change;
- active occupied rebellion: current organization/resources change the T021
  intent from faction expansion to government recapture; grievance reduction
  does not instantly delete the occupied conflict;
- coup and foreign-country war: no `governmentRecovery` intent;
- insertion-order and save/load recovery equivalence: PASS.

The inspection also runs a post-conflict WAIT/LONG branch through the existing
F03 canonical runner. The political history can still converge in the current
fixture, but current operational response is no longer structurally frozen.

## F02/F04 interpretation

The full F02 WAIT survey was rerun after F04B: 24/24 runs remained active,
rebellion/coup/territorial changes remained `1/1/1`, `1/1/1`, and `3/3/3`,
exact/coarse signatures remained `1/1` with a `24/24` largest cluster, and seed
sensitivity remained unobserved. The run executed 345,600 ticks in 157.67 s on
the inspection machine. No-intervention behavior is compared before and after
because weekly recovery is an endogenous simulation rule; this is measurement
evidence, not a new balance gate.

F04 concerns are intentionally not all closed by this task:

- `POST_CONFLICT_INTERVENTION_FUTILITY`: reduced for operational response;
  political history divergence remains fixture-dependent;
- `NO_RECOVERY_PATH`: reduced for supported internal residual-state cases;
  weak residual states correctly remain stalemates;
- `WAIT_DOMINANCE_CANDIDATE`: remains a balance/pacing finding;
- `PRE_CRISIS_TIMING_CLIFF`: remains a timing/cadence finding;
- `ONE_WAY_RATCHET`: remains closed by F04A;
- historical F04 `CHEAP_PERMANENT_GATE_SHUTOFF`: **RESOLVED / NOT REPRODUCED
  after F04A**; it is not a current F04B concern.

F05 remains **NOT READY** until those findings are reviewed. F04B does not
start F05, F02 diversity repair, or V02 renderer work.

## Verification contract

The T021 conflict suite covers:

- current organization/resources during an active rebellion;
- occupied-rebellion persistence after grievance reduction;
- strong and weak zero-territory recovery;
- one-Hex limit and coup exclusion;
- insertion-order independence;
- continuous versus save/load recovery equivalence.

The focused F04B inspection and regression tests pass. The existing T024
persistence/replay, canonical immutability, EventStore, ActionRecord, LandHex
authority, F02, F03, F04, and F04A regressions remain required. A Terra targeted
architecture review is required before F05.

## Scope

- gameplay balance tuning: **NO**
- new intervention/policy/RNG: **NO**
- Army/unit/pathfinding/logistics: **NO**
- annexation/successor/exile-government system: **NO**
- foreign-war recovery: **NO**
- zero territory as defeat: **NO**
- F05: **NOT STARTED**
- V02/renderer/UI/assets: **NOT STARTED**
