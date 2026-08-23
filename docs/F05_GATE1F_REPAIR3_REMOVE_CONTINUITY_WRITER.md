# F05_FIX3 Gate 1F Correctness Repair 3

Date: 2026-08-24

Task status: **REPAIR_COMPLETE / AWAITING_CHATGPT_REVIEW**

Gate 1F recommendation: **NOT_READY**

F05_FIX3 removes the F05_FIX2 unresolved-internal-rebellion continuity writer
that F05_FIX2_R rejected on architectural grounds. The unchanged F05 matrix
was then rerun so the pacing result reflects the current state model rather
than a government-defeat countdown.

## Scope and fixed boundaries

- The measurement remains seed `40103`, 1,800 days per branch, contexts
  `0/1`, `18/19`, and `180/181`, and the same six strategies.
- No scenario value, threshold, intervention strength, faction formula,
  conflict-strength rule, succession rule, pacing threshold, RNG rule, story
  scheduler, renderer, UI, or V02 file changed.
- `WorldState.landHexStates[*].controller` remains the sole physical territory
  authority.
- T023 remains the only terminal state-dissolution writer.
- F04B recovery, F04D paid action semantics, T024 persistence, and the typed
  non-terminal `governmentTransition` seam remain in force.

## Rejected writer removal

The following F05_FIX2 production pieces were removed:

1. `CONFLICT_RESOLUTION_CONFIG.unresolvedInternalRebellionContinuityLoss`;
2. `applyUnresolvedInternalRebellionContinuityPressure()`;
3. its call after the weekly territorial-resolution boundary in
   `runConflictPhase()`.

No replacement production writer was added. The developer-only
`f05Fix2StateContinuityReview` probe and test were retired because they encoded
the rejected behavior; the historical F05_FIX2/F05_FIX2_R commits and review
documents remain unchanged.

Current contract:

```text
active internal rebellion + zero Country-controlled LandHexes
≠ automatic stateContinuity decrement
≠ automatic STATE_DISSOLVED
```

Full displacement by a domestic rebellion faction is therefore a valid active
displacement/stalemate state. It does not prove annexation, permanent
fragmentation, loss of sovereign functions, or extinction of the Country as an
independent political community. T023 still evaluates the scenario-owned
`stateContinuity` threshold when authoritative continuity evidence exists, but
the current conflict phase has no displacement-only continuity writer.

## Correctness regressions

- A persistent internal-rebellion displacement fixture was advanced for 700
  days (100 weekly boundaries): the Country retained `stateContinuity = 100`,
  remained `active`, and emitted no `STATE_DISSOLVED` event while controlling
  zero LandHexes.
- The same displacement state remained equivalent across a JSON save/load
  boundary, with continuity still `100` and an active outcome.
- The existing typed `governmentTransition` test still preserves the same
  `CountryId`, changes only to an explicitly supplied existing Government, and
  keeps `RunOutcome` active without automatic successor selection.
- The F04B strength-qualified recovery tests still restore at most one real
  LandHex per eligible weekly boundary and keep recovery distinct from
  continuity evidence.
- T023 and T024 tests continue to cover inclusive threshold evaluation,
  deterministic read models, persistence, and replay.

The F01/F02 inspection expectations were updated only for the truthful
post-removal horizon: the former 714-tick displacement terminal now executes
the requested 720 ticks and remains `active`.

## Exact F05 rerun

The full 36-branch matrix completed with no scenario or measurement changes.

| Representative context | WAIT | Meaningful responses | Old major-event silence | Reassessment silence | Readable arc | Causal |
| --- | --- | ---: | ---: | ---: | --- | --- |
| Early/preventive, tick 0 | `WAIT_WORSE` | 4 | 1,695 days | 1,200 days | No | Yes |
| Near-crisis, tick 18 | `WAIT_WORSE` | 4 | 1,713 days | 1,200 days | No | Yes |
| Active-conflict/recovery, tick 180 | `TRADEOFF` | 3 | 1,787 days | 510 days | Yes | Yes |

The measured ranges are `1,695–1,787` days for the old major-event-only
silence and `510–1,200` days for reassessment silence. The output reports
`MIXED_GAP`, `CONDITIONALLY_STRONG` political accommodation, six distinct
representative trajectory signatures per context, choice-driven histories,
and visible causal histories. One-day timing remains
`MEANINGFUL_TIMING`, `MEANINGFUL_TIMING`, and `STABLE` for early, near, and
recovery respectively. Repeated accommodation remains `20/20/20/0` in early
and near contexts and `20/4/4/16` in recovery, with a meaningful trade-off
classification.

All 36 branches complete the five-year horizon as `active`: there are zero
`stateDissolved` outcomes and zero `orderConsolidated` outcomes. The early and
near repeated-accommodation branches retain three Country Hexes and one active
conflict; the already displaced recovery repeated-accommodation branch remains
active with zero Country Hexes and two active conflicts. No conflict is deleted
and no LandHex is transferred for free.

The pre-FIX2 late steady-state span therefore returns in the early and
near-crisis families. A non-terminal active-conflict stalemate remains after
the existing Agenda and response-set signals saturate; removing the invalid
terminal event does not create a new pacing consequence.

## Historical comparison

| Checkpoint | Writer state | Representative pacing | Terminal interpretation | Gate 1F |
| --- | --- | --- | --- | --- |
| F05_FIX1 | No unresolved-displacement writer | Reassessment `510–1,200` days; early/near not readable, recovery readable | Displacement remains non-terminal | `NOT_READY` |
| F05_FIX2 | Rejected weekly continuity writer | Reassessment `330–408` days; all representative arcs readable | T023 dissolution was reached from incumbent-government defeat without state-extinction evidence | Historically `PASS_WITH_NOTES`, architecture rejected |
| F05_FIX3 | Writer removed | F05_FIX1 late steady state returns; `510–1,200` days | All branches remain active; no displacement-only dissolution | `NOT_READY` |

F05_FIX2's readable result remains historical evidence of the rejected
mechanism, not current Gate 1F evidence.

## Remaining blocker

Classification: `LATE_STEADY_STATE_RETURNS` with supporting mechanism
`ACTIVE_CONFLICT_STALEMATE → OUTCOME_ELIGIBILITY_STALEMATE`.

The current runtime has no grounded non-terminal consequence that follows from
this active stalemate after Agenda and legal-response availability saturate.
Defining such a consequence, or grounding a future continuity/succession
evidence source, belongs to a separate authorized review. It is not repaired
in F05_FIX3.

## Reference grounding

Existing repository grounding was sufficient: GDD, Architecture, QA,
F04B/F04C-R contracts, T021, T023, T024, the F05 pacing records, and the
accepted F05_FIX2_R review. No new external research was performed. No
replacement continuity or succession mechanism is proposed here.

## Verification

- runtime: Node `v25.2.1`, pnpm `11.19.0`; Node 24.19.0 was unavailable in the
  workspace environment and no source change was made to compensate;
- `pnpm install --frozen-lockfile`: PASS — already up to date;
- `pnpm run format`: PASS;
- `pnpm run typecheck`: PASS;
- `pnpm run lint`: PASS;
- `pnpm run build`: PASS — 44 modules transformed;
- `pnpm run inspect:t024`: PASS;
- `pnpm run inspect:f01`: PASS;
- `pnpm run inspect:f04b`: PASS;
- `pnpm run inspect:f04d`: PASS;
- `pnpm run inspect:f05`: PASS as a measurement command — recommendation
  `NOT_READY` and the matrix above reproduced;
- focused Vitest regression run: PASS — 5 files / 76 tests;
- `pnpm test`: PASS — 51 files / 423 tests;
- `git diff --check`: PASS before bridge-doc creation; final check is repeated
  before the documentation commit and push.

```text
GATE1F_RECOMMENDATION: NOT_READY
NEXT_AUTHORIZED_TASK_ID: NONE
V02: NOT STARTED
```
