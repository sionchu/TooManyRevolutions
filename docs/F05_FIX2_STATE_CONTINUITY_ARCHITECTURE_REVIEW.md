# F05_FIX2 State Continuity / Dissolution Architecture Review

Date: 2026-08-24  
Task: `F05_FIX2_R`  
Review type: Gate 1F targeted architecture review; no gameplay repair

## Review boundary

The review started at `501ee8a805164b1db9f011ecfa50243701178fa0`, after the
authorized fast-forward to the `F05_FIX2_R` task. The authorized base diff
contained only Bridge authorization updates under `docs/bridge/**`. The
existing F05_FIX2 writer was not changed.

The only source additions are the developer-only probe and its test:

- `src/sim/inspection/f05Fix2StateContinuityReview.ts`
- `src/sim/inspection/f05Fix2StateContinuityReview.test.ts`

No new external research was needed. The review used the repository contracts
and the F04C-R mechanism-first sequence:

```text
repository contract
→ actual writer condition
→ controlled counterexample / failure mode
→ state + consumer mapping
→ narrow follow-up recommendation
```

## Contract baseline

The GDD and architecture keep these facts separate:

- the player is the historical continuity of a `CountryId`, not an incumbent
  ruler, government, dynasty, faction, or ideology;
- revolution, coup, government turnover, civil-war government defeat,
  temporary capital loss, total occupation, and zero Country-controlled
  `LandHex` cells are not automatic terminal defeat;
- physical territorial authority is exclusively
  `WorldState.landHexStates[*].controller`;
- `Region.stateControl` is residual administrative penetration, not physical
  ownership;
- `Government` is a separate entity from `Country`, and
  `ConflictOutcome.governmentTransition` is explicitly non-terminal;
- T023 currently has authoritative evidence only for the scenario-owned
  inclusive `Country.stateContinuity <= threshold` comparison. Annexation,
  permanent fragmentation, and sovereign-function loss are deferred because
  their evidence is not implemented.

These contracts are recorded in `docs/GDD.md`, `docs/ARCHITECTURE.md`,
`docs/F04B_ACTIVE_CONFLICT_RECOVERY_AGENCY.md`, and
`docs/T023_STATE_DISSOLUTION_CHECK.md`.

## A. Countdown review

The current writer is `applyUnresolvedInternalRebellionContinuityPressure()`
in `src/sim/systems/conflictResolution.ts`.

The caller runs it only when
`isConflictResolutionBoundary()` is true. `CONFLICT_RESOLUTION_CONFIG` fixes
that cadence to `weekly`; `shouldRunPoliticalUpdate()` implements the boundary
as `nextTick % 7 === 0`. The writer then subtracts the fixed
`unresolvedInternalRebellionContinuityLoss` value, currently `1`, with a lower
clamp at zero.

The qualification is real but Boolean and repeatable:

1. the run is still active and the player Country exists;
2. the player Country controls zero physical LandHexes;
3. an active `rebellion` Conflict includes that Country;
4. a participant Faction belongs to that Country and physically controls at
   least one LandHex;
5. after the weekly territorial resolver has had an opportunity to recover a
   Hex, no recovery was applied.

No changing sovereign-function, annexation, fragmentation, successor, or
independent-community evidence is read by this writer. Once the same
qualifying state persists, the update is exactly one point per political week.

### Controlled runtime probe

The developer-only probe used the same qualifying internal-rebellion state,
the same seed and political inputs, and changed only the initial continuity
value. T023's threshold remained `0`.

| Initial `stateContinuity` | Terminal tick/day | Qualifying weekly decrements | Political prefix before earliest terminal |
| ---: | ---: | ---: | --- |
| 100 | 700 / 700 days | 100 | identical |
| 50 | 350 / 350 days | 50 | identical |
| 10 | 70 / 70 days | 10 | identical |

The runtime terminal boundary therefore follows:

```text
first qualifying weekly boundary
+ ceil((initial continuity - threshold) / loss per boundary) weekly boundaries
```

For the current integer values this is exact. The writer has no other
continuity consumer that could alter that timing. Changing the initial value
shifts the terminal date mechanically without changing the political history;
changing the configured loss would use the same fixed-step arithmetic.

### Classification

`EFFECTIVE_PERMANENCE_TIMER`

It is state-conditioned at entry, but under the persistent qualifying state it
is functionally a fixed-duration countdown to T023. It is not merely a sparse
event consequence whose timing depends on new political evidence.

## B. Ratchet review

The probe followed the authorized sequence without changing the production
writer:

```text
A. zero Country Hexes under an active internal rebellion
B. three qualifying weekly boundaries
C. real F04B/T021 government recovery of one Country Hex
D. later physical redisplacement and another qualifying weekly boundary
```

Observed values:

| Boundary | Country Hexes | `stateContinuity` | Outcome |
| --- | ---: | ---: | --- |
| after initial displacement | 0 | 97 | active |
| after real F04B recovery | 1 | 97 | active |
| after later redisplacement | 0 | 96 | active |

The real recovery does prevent a decrement at that boundary because the writer
sees a Country-controlled Hex after territorial resolution. It does not restore
any previously lost continuity. The later qualifying displacement resumes from
the damaged value. No production consumer increases `stateContinuity`; the
repository search finds only the F05_FIX2 decrement writer and fixture/test
initialization values.

### Classification

`ONE_WAY_CONTINUITY_RATCHET`

Repeated recoverable crises can therefore accumulate irreversible continuity
damage toward `STATE_DISSOLVED`, even when physical authority is re-established
through the existing recovery path.

## C. Government defeat versus State Dissolution

The unchanged `pnpm run inspect:f05` matrix still produces terminal branches
whose late snapshot is effectively:

```text
Country-controlled LandHexes = 0
active conflicts = 2
outcome = stateDissolved
```

Representative terminal ticks in the unchanged output include early WAIT at
742, early accommodation at 1,008, near-crisis WAIT at 724, and recovery WAIT
at 562. The terminal event is `STATE_DISSOLVED` from the continuity threshold;
there is no `GOVERNMENT_TRANSITIONED` event in those branches.

| Proposition | What the current terminal branches prove |
| --- | --- |
| incumbent/current government controls no LandHexes | Yes |
| an internal rebellion Faction controls LandHexes | Yes |
| the same `CountryId` still exists in `WorldState` | Yes, until T023 commits the terminal outcome |
| a valid current Government exists | The fixture retains the current Government; no successor is selected |
| sovereign state functions are lost | Not represented or proven |
| permanent fragmentation exists | Not represented or proven |
| annexation exists | Not represented or proven; the controller is a domestic Faction, not a foreign Country |
| the independent political community is extinct | Not represented or proven |

T023 deliberately reports the other configured criteria as deferred and emits a
continuity-threshold event with only the captured continuity value and
threshold. The current evidence therefore proves displacement/defeat of the
incumbent government, not disappearance of the state.

### Classification

`GOVERNMENT_DEFEAT_ONLY`

## D. Revolutionary succession seam

The existing typed seam is representable and non-terminal:

- `ConflictOutcome.governmentTransition` requires a Country, a previous
  Government ID, an already existing different Government of the same Country,
  and a winner;
- `applyConflictOutcome()` changes only `Country.currentGovernmentId` and the
  two Governments' authority labels, records `GOVERNMENT_TRANSITIONED`, and
  preserves `CountryId`, LandHex state, and `RunOutcome`;
- the existing conflict test and the F05_FIX2_R probe both pass this contract.

The current runtime does not choose or create a revolutionary successor from a
F05 branch. `runConflictPhase()` detects active conflicts and resolves physical
LandHex intents, but it does not infer a successor Government. Selecting one
would require evidence not currently represented: a candidate Government,
succession authority, or a new political domain such as elections, parties,
coalitions, or military factions.

### Classification

`SUCCESSION_SEAM_EXISTS_BUT_EVIDENCE_MISSING`

## E. Precise `stateContinuity` semantics

The precise repository-grounded meaning should be:

> `Country.stateContinuity` is a bounded, scenario-evaluated indicator that the
> same `CountryId` remains an independent political community across changes of
> government, regime, administrative penetration, and temporary territorial
> displacement. It is not incumbent-government control, a LandHex count,
> `Region.stateControl`, a faction score, or a time budget. It may satisfy a
> terminal dissolution threshold only when authoritative evidence supports
> annexation, permanent fragmentation, loss of sovereign functions, or another
> explicitly grounded scenario-specific extinction condition.

### Writer audit

The F05_FIX2 writer reads zero Country-controlled LandHexes, a domestic faction
controller, an active internal rebellion, and lack of immediate recovery. Those
facts are evidence of an incumbent government's physical defeat. They do not
establish state extinction, sovereign-function loss, permanent fragmentation,
annexation, or the failure of a successor government.

`WRITER_TRACKS_GOVERNMENT_CONTROL_NOT_STATE_CONTINUITY`

## F. Reference grounding

- repository grounding sufficient: **YES**;
- documents used: `docs/GDD.md`, `docs/ARCHITECTURE.md`,
  `docs/QA_PLAYTEST.md`, `docs/F04B_ACTIVE_CONFLICT_RECOVERY_AGENCY.md`,
  `docs/F04C_INSTITUTION_MEDIATED_STABILIZATION_DESIGN.md`,
  `docs/F04C_R_POLITICAL_HISTORICAL_REFERENCE_GROUNDING.md`,
  `docs/F04_TARGETED_ARCHITECTURE_GATE_REVIEW.md`,
  `docs/T021_SIMPLIFIED_CONFLICT_WAR_CHECK.md`,
  `docs/T023_STATE_DISSOLUTION_CHECK.md`,
  `docs/T024_PERSISTENCE_REPLAY_CHECK.md`,
  `docs/F05_GATE1F_REPAIR2.md`, and
  `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`;
- new external research: **NO**.

The existing repository grounding is sufficient to reject the writer. No new
continuity rule, state-extinction claim, international-law subsystem, or
successor mechanism is invented here.

## G. F05 pacing implication

The historical F05_FIX2 result remains reproducible under the unchanged matrix:

- `WAIT` is `WAIT_WORSE` in early and near-crisis contexts and `TRADEOFF` in
  recovery;
- recovery retains three meaningful paid responses;
- accommodation remains `CONDITIONALLY_STRONG`;
- six representative trajectory signatures and readable measured arcs remain;
- reassessment silence remains approximately `330–408` days and the F05
  terminal branches remain continuity-threshold dissolutions.

The improved pacing result is **not architecture-acceptable** as a State
Dissolution consequence. `readableArc=YES` shows that the measurement became
more active; it does not prove that the terminal writer represents the
disappearance of the independent state. The pacing benefit must not be used to
retain an implicit countdown or ratchet.

## H. Architecture verdict and smallest follow-up

```text
ARCHITECTURE_VERDICT: REJECT_WRITER_REQUIRES_NEW_CONTINUITY_EVIDENCE
```

Smallest next task, not implemented here:

1. `REMOVE_OR_DISABLE_CONTINUITY_WRITER` — remove only the F05_FIX2 weekly
   continuity decrement and rerun the unchanged F05 matrix. Do not replace it
   with another terminal shortcut in the same task.
2. Only if a later task still needs a continuity-based terminal consequence,
   separately define and ground an authoritative evidence source for sovereign
   continuity (annexation, permanent fragmentation, or loss of sovereign
   functions) before adding any writer.

No Government creation, revolutionary succession, restoration rule, threshold
change, pacing retune, or Gate 1F/V02 authorization is included in this review.

## Review conclusion

```text
COUNTDOWN_REVIEW: EFFECTIVE_PERMANENCE_TIMER
RATCHET_REVIEW: ONE_WAY_CONTINUITY_RATCHET
DISSOLUTION_EVIDENCE_REVIEW: GOVERNMENT_DEFEAT_ONLY
REVOLUTIONARY_SUCCESSION_REVIEW: SUCCESSION_SEAM_EXISTS_BUT_EVIDENCE_MISSING
STATE_CONTINUITY_WRITER_VERDICT: WRITER_TRACKS_GOVERNMENT_CONTROL_NOT_STATE_CONTINUITY
GATE1F_RECOMMENDATION: NOT_READY
V02: NOT STARTED
```

