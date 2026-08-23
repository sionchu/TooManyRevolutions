# F04D Institution-Action Implementation

**Date:** 2026-08-24
**Status:** IMPLEMENTED / COUNTERFACTUAL VALIDATED

## Scope

F04D adds one narrow institutional dimension and four developer-validation
responses. It reuses the existing PolicyState, Intervention commitment lifecycle,
Faction dynamics, resource scarcity, political-crisis detection, territorial
conflict, consolidation, EventStore, and T024 replay boundaries.

`politicalCompetition = banned | restricted | plural` describes only the legal
scope for independent political organizations to organize and compete. It is not a
democracy, legitimacy, suffrage, press, labor, election, parliament, or government
turnover score. `RegimeClassification` remains derived and supplies no bonus.

## Authoritative mechanics

- `InstitutionalRuleState.politicalCompetition` is required, enum-validated,
  invariant-checked, and included in canonical rule ordering.
- Faction `BARGAIN` availability consumes the rule directly: only `plural` opens
  that path. `LOBBY` still consumes press freedom and `ORGANIZE` still consumes
  labor-organization law.
- Intervention completion can set a typed institutional rule. The existing
  `INTERVENTION_COMPLETED` event is followed by `INSTITUTION_RULE_CHANGED`, whose
  cause points to the completion event and whose payload records the previous and
  new values.
- `ruleNotEquals` and `requireCompletionEffectChange` prevent a completed rule
  mutation from being repeated after it has become meaningless. Treasury and
  administrative headroom remain the normal start constraints.
- Institution effects modify authoritative PolicyState. Crisis, conflict,
  territory, government, and consolidation systems observe the resulting state
  through their existing cadence and prerequisites; no response ID schedules a
  coup, rebellion, conflict, or victory.
- T024 snapshot format is version 2. Version 2 requires a valid
  `politicalCompetition`; version 1 and malformed version 2 snapshots are rejected
  instead of being silently defaulted or migrated.

## Four validation responses

These definitions live only in `createF04DValidationScenario()` and are not a
production content catalog.

| Response | Treasury | Admin load | Duration | Completion effect |
|---|---:|---:|---:|---|
| Material relief | 90 | 35 | 1 day | Industrial food production capacity +6 |
| Limited political accommodation | 70 | 35 | 7 days | Rebellion-faction grievance -0.25; organization unchanged |
| Opposition legalization | 100 | 40 | 12 days | competition -> plural; rebellion grievance -0.10; coup-faction grievance +0.20 |
| Coercive restriction | 75 | 45 | 5 days | press -> censored; competition -> banned; rebellion organization -0.12 and grievance +0.10 |

Coercion reduces organization but never deletes the faction. Later monthly F04A
dynamics can rebuild organization when its existing drivers support recovery.

## Counterfactual result

`pnpm run inspect:f04d` uses seed `40103`, one canonical tick-0 checkpoint, and a
two-year horizon. It branches with the existing F03 record/snapshot runner.

### Same state, different institution

The only changed field is `politicalCompetition`.

| Start rule | BARGAIN | Legalization attempt | Observed history |
|---|---|---|---|
| banned | closed | feasible | coup day 13; rebellion day 90; territorial changes days 91/98/105 |
| plural | open | rejected as no-op | rebellion day 19; territorial changes days 35/42/49; coup day 300 |

The histories therefore diverge without changing regime classification or adding a
regime bonus.

### Same checkpoint, different response

| Branch | Observed two-year history |
|---|---|
| WAIT | rebellion day 19; territory days 35/42/49; coup day 300 |
| Material relief | rebellion day 20; territory days 35/42/49; coup day 300; final scarcity 0.5 instead of WAIT 1.0 |
| Limited accommodation | coup and rebellion day 300; territory days 301/308/315 |
| Opposition legalization | coup day 13; rebellion day 90; territory days 91/98/105 |
| Coercive restriction | rebellion day 120; territory days 126/133/140; coup day 300 |

All runs remain active at the horizon and have no government transition. The
inspection records consolidation eligibility/progress, but the validation fixture
requires a longer consecutive period than this horizon, so it does not manufacture
a terminal win. Each of the four response histories differs from WAIT.

Continuous 720-day execution matches a save/load continuation at day 360 after
canonical JSON comparison. Branch insertion order also leaves results unchanged.
The inspection reports no WAIT dominance, cheap permanent gate shutoff, one-way
ratchet, or pre-crisis timing cliff in this slice. Meaningless repeats are rejected
and repeated starts remain bounded by treasury/headroom. Active-conflict response
and zero-territory recovery remain owned by F04B rather than this decision-boundary
fixture.

## Automated coverage

- `src/sim/systems/f04dInstitutionActions.test.ts`: cost/load/duration, direct
  effects, downstream eligibility, event causality, persistence, recovery-compatible
  coercion, and no-op repeat rejection.
- `src/sim/core/persistence.test.ts`: all three values roundtrip; version 1,
  missing-field, and invalid-enum rejection.
- `src/sim/systems/policy.test.ts` and
  `src/sim/systems/factionPressure.test.ts`: canonical rule contract and distinct
  BARGAIN/LOBBY/ORGANIZE consumers.
- `src/sim/inspection/f04dInstitutionActionCounterfactualsInspection.test.ts`:
  same-state and response counterfactuals, replay, order independence, and exploit
  checks.

## Final verification

- `pnpm install --frozen-lockfile`: PASS
- `pnpm run format`: PASS
- `pnpm run typecheck`: PASS
- `pnpm run lint`: PASS
- `pnpm run build`: PASS
- `pnpm run inspect:t024`: PASS — snapshot format version 2
- `pnpm run inspect:v01`: PASS — V02 not started
- `pnpm run inspect:f01`: PASS — 40-year invariants and midpoint replay
- `pnpm run inspect:f04d`: PASS
- `pnpm test`: PASS — 51 files / 421 tests

## Deliberately deferred

Elections, parties, seats, electoral government turnover, full labor bargaining,
transitional justice, military factions/officer loyalty, local autonomy, war and
occupation politics, arcane privilege, new RNG, universal political resources,
generic stability/democracy meters, F05 pacing/fun judgment, and V02 rendering are
outside F04D.
