# F05_FIX2 Gate 1F Late Steady-State Repair 2

Date: 2026-08-24

Task status: **REPAIR_COMPLETE**

Gate 1F recommendation: **PASS_WITH_NOTES**

F05_FIX2 closes the remaining late steady-state blocker with one narrow
existing-domain repair. It does not decide Gate 1F. The final gate decision
remains with ChatGPT/user review.

## Scope and fixed measurement

- The exact F05 matrix remains unchanged: seed `40103`, 1,800 days, contexts
  `0/1`, `18/19`, and `180/181`, and six strategies per context.
- No scenario value, intervention effect, faction formula, conflict-strength
  formula, Agenda threshold, RNG rule, story scheduler, UI, renderer, or V02
  file changed.
- `WorldState.landHexStates[*].controller` remains the exclusive physical
  territory authority.
- T023 remains the only terminal-defeat writer.

## Late steady-state diagnosis

Classification: `MIXED_CAUSE`.

The deeply traced maximum-gap branches were political accommodation from the
early/preventive tick-0 and near-crisis tick-18 contexts. Their last meaningful
reassessment was the critical faction-pressure Agenda transition around
relative day 600. The tick-1 and tick-19 neighbors reached the same downstream
state after their one-day-shifted starts.

The following trace was captured before the repair. Values are from the
early/preventive accommodation branch; the near-crisis branch had the same
political, territorial, conflict, and outcome state and an 18-lower treasury
stock by the horizon.

| Relative day | Treasury | State continuity | Country Hexes | Faction grievance | Organization | Conflict intents | Agenda |
| ---: | ---: | ---: | ---: | --- | --- | --- | --- |
| 600 | 2,567 | 100 | 0 | coup 0.80 / rebellion 0.75 | 0.80 / 0.80 | none | both critical |
| 780 | 2,387 | 100 | 0 | coup 0.92 / rebellion 0.87 | 0.80 / 0.80 | none | both critical |
| 960 | 2,207 | 100 | 0 | converging to about 0.9676 | 0.80 / 0.80 | none | both critical |
| 1,320 | 1,847 | 100 | 0 | about 0.9676 / 0.9676 | 0.80 / 0.80 | none | both critical |
| 1,800 | 1,367 | 100 | 0 | about 0.9676 / 0.9676 | 0.80 / 0.80 | none | both critical |

The near-crisis branch ended with treasury `1,349`; all other listed
downstream facts matched. Across the traced interval:

- daily income was `0`, expenditure was `1`, state capacity/headroom was
  `55/55`, and instability was `0`;
- capital scarcity/stateControl were `0/0.80`; industrial
  scarcity/stateControl were `1/0.55`; unrest approached `1`;
- the rebellion Faction controlled all three Hexes and the Country controlled
  none;
- coup and rebellion conflicts remained active, while current territorial
  intent derivation returned no intent;
- both Factions retained `currentStrategy=wait` although the existing T016
  heuristic continued to propose `FUND_MOVEMENT`;
- material relief, political accommodation, opposition legalization, and
  coercive restriction all remained feasible, so the legal response set no
  longer changed;
- order consolidation remained ineligible because stable-region, capital, and
  core-territory control were absent;
- dissolution remained ineligible because `stateContinuity` stayed at `100`
  against threshold `0`; full-annexation and permanent-fragmentation evidence
  remained deferred;
- after day 600, the trace contained only routine tick and treasury events.

### Exact causal chain

```text
all three physical Hexes held by the active internal rebellion
→ no Country front and no strength-qualified governmentRecovery intent
→ active conflict remains a valid stalemate
→ faction values converge and Agenda/response availability saturate
→ consolidation cannot start
→ stateContinuity has no production writer and remains 100
→ T023's existing dissolution threshold can never become eligible
→ the same critical state persists to day 1,800
```

`ECONOMIC_STEADY_STATE`,
`FACTION_EQUILIBRIUM_WITHOUT_NEW_CONSUMER`, `AGENDA_SATURATION`, and
`ACTION_SET_SATURATION` describe supporting symptoms. The dominant gameplay
gap is `ACTIVE_CONFLICT_STALEMATE → OUTCOME_ELIGIBILITY_STALEMATE`: the conflict
phase was already documented as the owner of necessary `stateContinuity`
inputs, but it never wrote that existing field.

## Selected repair

Domain: existing T021 conflict resolution feeding existing T023 state
dissolution.

After each existing weekly territorial-resolution boundary, the conflict phase
now applies one point of continuity pressure only when all of these current
facts are true:

1. the run is active and has a player Country;
2. that Country controls zero LandHexes;
3. an active internal `rebellion` names that Country;
4. a participant Faction belonging to that Country physically controls at
   least one LandHex;
5. territorial resolution did not restore a Country-controlled Hex on that
   boundary.

The writer clamps `Country.stateContinuity` at zero. The value `1` is the
smallest unit of the existing 0–100 index and is applied at the already
canonical weekly conflict boundary; it was selected from the field/cadence
contract before the F05 rerun, not fitted to the two-year readability limit.

The order is deliberate:

```text
phase-start conflict state
→ derive and resolve real territorial intents
→ if the government still has zero physical control under internal rebellion,
  reduce existing stateContinuity by one
→ T023 independently evaluates the scenario-owned threshold
```

This repair adds no event for weekly scalar movement. F05 therefore does not
count the raw drift. The later reassessment is the existing
`STATE_DISSOLVED` consequence emitted by T023 when the actual threshold is
reached.

### Boundaries and trade-off

- A strong zero-territory government that earns a real `governmentRecovery`
  intent and retakes one Hex loses no continuity on that boundary.
- Foreign occupation alone, a coup, or a rebellion without physical Faction
  control does not activate the writer.
- No conflict is deleted and no Hex is transferred for free.
- No new permanence timer, chapter, story node, countdown, or generic meter is
  introduced.
- Responses that delay rebellion or preserve territory can keep the Country
  active longer. Responses that leave total displacement unresolved now face
  the existing dissolution consequence.
- Repeated accommodation demonstrates the cost boundary: early/near branches
  remain active through five years with three Country Hexes, but end near
  `96.4–96.5` instability rather than receiving a free safe outcome.

## Authority and architecture

- LandHex authority is unchanged: the repair only reads canonical runtime
  controllers and writes `Country.stateContinuity`.
- `Region.stateControl` remains residual administrative penetration used by
  the existing F04B strength-qualified recovery intent; it never grants a Hex.
- F04B still resolves at most one Hex per active conflict per weekly boundary,
  before continuity pressure is evaluated.
- T023 continues to own `STATE_DISSOLVED` and `RunOutcome`; the conflict phase
  does not script a terminal result.
- `stateContinuity` was already serialized and invariant-checked, so no
  snapshot schema or migration changed.
- The repair is deterministic, consumes no RNG, and adds no scripted-history
  branch.

## Reference grounding

Existing repository grounding was sufficient.

- `docs/GDD.md` defines state dissolution through loss of sovereign continuity
  and the scenario-owned `stateContinuity` threshold.
- `docs/ARCHITECTURE.md` assigns necessary continuity inputs to the conflict
  domain, keeps T023 as a pure evaluator/terminal writer, and defines the
  weekly current-state recovery boundary.
- `docs/F04C_INSTITUTION_MEDIATED_STABILIZATION_DESIGN.md` and
  `docs/F04C_R_POLITICAL_HISTORICAL_REFERENCE_GROUNDING.md` supplied the
  mechanism-first conditions, counterexample, and trade-off method used to
  constrain the repair.
- `docs/F04D_INSTITUTION_ACTION_IMPLEMENTATION.md` preserved the existing paid
  response semantics.

No new external research was performed.

## Exact F05 rerun

| Representative context | WAIT | Meaningful responses | Previous reassessment silence | New reassessment silence | New major-event silence | Readable arc |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Early/preventive, tick 0 | `WAIT_WORSE` | 4 | 1,200 days | 408 days | 693 days | Yes |
| Near-crisis, tick 18 | `WAIT_WORSE` | 4 | 1,200 days | 390 days | 693 days | Yes |
| Active-conflict/recovery, tick 180 | `TRADEOFF` | 3 | 510 days | 330 days | 549 days | Yes |

The overall reassessment range moved from `510–1,200` days to `330–408` days.
The earlier major-event-only range was `1,695–1,787` days; after the genuine
terminal consequence it is `549–693` days.

### Outcome and cluster evidence

- Early WAIT reaches `STATE_DISSOLVED` at relative day 742; single-action
  branches resolve between days 742 and 1,008 depending on their earlier
  political trajectory.
- Near-crisis WAIT reaches `STATE_DISSOLVED` at relative day 724; single-action
  branches resolve between days 724 and 990.
- Recovery branches reach `STATE_DISSOLVED` at relative day 562, while their
  earlier paid benefits and costs remain distinct.
- Repeated accommodation stays active through day 1,800 in early/near contexts
  because it preserves actual Country territory; it does not do so in the
  already displaced recovery context.
- Every representative context retains six distinct trajectory signatures and
  visible causal histories.
- Neighbor timing remains `MEANINGFUL_TIMING`, `MEANINGFUL_TIMING`, and
  `STABLE` for early, near, and recovery respectively.

Political accommodation remains `CONDITIONALLY_STRONG`. Recovery remains
`TRADEOFF` with three meaningful paid responses: material relief, political
accommodation, and opposition legalization.

## Gate 1F recommendation

All three representative families now meet the unchanged readable-arc test,
choice-driven history and causal readability remain present, and the accepted
FIX1 recovery result is preserved. The recommendation is therefore:

```text
GATE1F_RECOMMENDATION: PASS_WITH_NOTES
NEXT_AUTHORIZED_TASK_ID: NONE
V02: NOT STARTED
```

The note is that unresolved full internal displacement now becomes terminal
through the existing continuity contract. The final Gate 1F decision and any
authorization for V02 remain outside this task.

## Verification

Verified with Node `24.19.0` and pnpm `11.19.0`:

- `pnpm install --frozen-lockfile`: pass, lockfile already current
- `pnpm run format`: pass
- `pnpm run typecheck`: pass
- `pnpm run lint`: pass
- `pnpm run build`: pass, 44 modules transformed
- `pnpm run inspect:t024`: pass, including deterministic save/load replay
- `pnpm run inspect:f01`: pass; the WAIT fixture reaches the new grounded
  terminal result at tick 714 and persistence replay remains equivalent
- `pnpm run inspect:f04b`: pass; strong recovery still changes exactly one Hex
  and weak-state stalemate remains valid
- `pnpm run inspect:f04d`: pass
- `pnpm run inspect:f05`: complete, `PASS_WITH_NOTES`
- focused conflict/F01/F02/F05/T024 tests: pass, 33 tests
- `pnpm test`: pass, 51 files / 424 tests
- `git diff --check`: pass
