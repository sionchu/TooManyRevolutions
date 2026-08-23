# F04 Targeted Architecture / Gate Review

**Date:** 2026-08-24
**Review target:** F04B + uncommitted F04D
**Result:** PASS WITH F05 NOTES
**Gate decision:** F04 CLOSED / F05 READY, not started

## Reviewed repository state

- branch: `master`, tracking `origin/master`
- committed base: `f277f146501a22841a93090e560ba5c49ff4d02e`
- review-start worktree: 22 modified files and 5 untracked files
- commit/push during review: none
- source changes made by review: none
- review-only changes: this record plus status alignment in QA, backlog, devlog,
  and the current handoff

The review read the project authority, Gate 1F, F04/F04A/F04B/F04C/F04C-R,
F04D, and T024 records and inspected all source files changed or added by F04D.
The source audit included PolicyState and institutional rule construction,
Intervention feasibility/completion, faction action selection, political-crisis and
conflict consumers, F04B territorial intent resolution, persistence/runtime closure,
fixtures, inspections, and tests.

## F04B architecture review

**Verdict: PASS. REQUIRED_FIX_BEFORE_F04_CLOSE: none.**

- Active rebellion strength is re-derived at each T021 weekly phase-start boundary
  from current faction organization, resources, and affected-region mobilization.
  It is not frozen at conflict creation and does not branch on intervention identity.
- Occupied rebellion is not deleted merely because grievance falls. T018 creation,
  active-conflict operation, and no-territory suppression remain separate contracts.
- Zero-territory recovery is limited to an active internal rebellion in an active
  run with a valid same-Country Government, affected-region evidence, legal owner
  relevance, positive state control, and a faction-controlled target Hex.
- `Region.stateControl` only scales residual government recovery strength. It is
  not copied into a controller and does not create a free Hex.
- Physical mutation still uses `changeLandHexController()`. The resolver produces
  at most one phase-start intent per conflict and applies stable collision ordering.
- Coups and foreign wars do not receive the recovery shortcut. Government,
  ownership, state control, ideology, ContactGraph, and outcome state are not
  mutated by the recovery path.
- Strong residual-state recovery, weak-state stalemate, insertion-order
  independence, and save/load equivalence all passed the current inspection.

## F04D architecture review

### Political competition ownership

**Verdict: PASS. REQUIRED_FIX_BEFORE_F04_CLOSE: none.**

`WorldState.policies[countryId].institutionalRules.politicalCompetition` is the
single runtime authority. The required enum is exactly `banned | restricted |
plural`; the default and F04D baseline are explicit `restricted`. The key is present
in stable rule ordering, runtime validation, mutation, cloning, persistence decode,
and round-trip tests. There is no undefined fallback, derived regime bonus, generic
political score, or presentation/UI copy of authority.

The field is narrower than suffrage, press freedom, and labor organization.
`LOBBY` continues to consume press freedom, `ORGANIZE` labor law, and `BARGAIN`
political competition. `RegimeClassification` remains derived and unchanged by the
legalization regression.

### BARGAIN consumer semantics

**Verdict: ACCEPT as the smallest F04D consumer, with an explicit causal limit.**

Existing `BARGAIN` means a faction choosing a public bargaining/negotiation
strategy when grievance and influence/resources/state weakness support it. The
accepted faction action writes `Faction.currentStrategy = bargain` and emits the
normal `FACTION_STRATEGY_CHANGED` event. It is not a labor contract, election,
party, or automatic stability bonus.

This is an honest narrow consumer because plural political competition opens a
legal faction strategy that banned/restricted competition closes. However,
`currentStrategy` is currently supporting/recorded state rather than a direct T018
gate or faction-delta writer. Therefore the reported banned/plural crisis timing
must not be attributed to BARGAIN alone.

The F04D institution comparison changes only the starting competition rule and
then submits the same legalization attempt. The banned branch accepts that action
and receives its rule and faction-grievance effects; the plural branch rejects it
as already achieved. The later crisis difference is consequently explained by the
normal rule prerequisite plus accepted completion effects, not by a hidden BARGAIN
bonus. That is a valid rule-dependent action counterfactual, but not proof that
BARGAIN by itself changes crisis timing.

### Policy versus Intervention mutation

**`institutionalRuleSet` InterventionEffect verdict: ACCEPT.**

- Policy enactment remains the immediate catalog path that records an active
  PolicyId and declared rule mutations.
- Intervention remains a bounded action/program with treasury cost,
  administrative load, duration, prerequisite checks, commitment identity, and
  exactly-once completion.
- Both paths write the same authoritative PolicyState; no second rule store or
  competing territorial/political authority was introduced.
- Intervention rule effects are typed one-key mutations rather than a generic DSL.
  `INTERVENTION_COMPLETED` is followed by `INSTITUTION_RULE_CHANGED`, whose cause
  is the completion event and whose payload includes prior/new values and
  commitment/intervention identity.

Legalization and coercive restriction need implementation time and capacity, so
the Intervention seam is proportionate. Production content must avoid defining
contradictory Policy and Intervention entries for the same transition, but that is
a later catalog/content constraint rather than an F04 authority defect.

### Snapshot V2

**Verdict: PASS. REQUIRED_FIX_BEFORE_F04_CLOSE: none.**

- `SIMULATION_SNAPSHOT_FORMAT_VERSION` and the serialized envelope are version 2.
- version 1 is deliberately rejected; no missing value is silently interpreted as
  `restricted` and no migration chain is implied.
- strict known-key decoding requires a valid competition enum and rejects missing
  or invalid values.
- PolicyState cloning includes the entire institutional rule object.
- full runtime closure, canonical registration, EventStore/ActionRecord/commitment
  provenance, and scenario identity checks remain in place.
- all three enum values round-trip; T024 replay and F04D day-360 resume equal their
  continuous runs.

Explicit V1 rejection is proportionate in the current development phase because
the project has no released save-compatibility promise or storage backend. The
failure is explicit rather than silent, so no migration framework is required for
F04 closure.

## F04D action review

### Material relief

The action uses the existing Region food-production-capacity authority and the
normal resource → scarcity → unrest/instability path. It is distinct from political
accommodation, directly scripts no crisis, pays 90 treasury, occupies 35 load for
one day, and blocks a concurrent repeat through headroom. Its F05 question is
relative magnitude, not architecture.

### Political accommodation

The action pays 70 treasury, occupies 35 load for seven days, requires the existing
legislature rule, and applies only a bounded rebellion-faction grievance delta.
Organization is deliberately preserved; later F04A dynamics rebuild grievance and
organization, and coup/rebellion still occur at day 300 in the reviewed fixture.

The final treasury `2447` is causally explained rather than fabricated. WAIT loses
all three controlled Hexes by days 35/42/49 and falls from treasury 753 at day 90 to
123 at day 720. Accommodation retains all three Hexes through day 299, rises to
treasury 2822, then loses territory on days 301/308/315 and falls to 2447 by day
720. The large difference is retained economic base plus delayed territorial loss,
not a direct treasury bonus.

Current trade-offs are the up-front cost, seven-day administrative commitment,
conditional legislature prerequisite, preserved opposition organization, recovery
of grievance, and delayed rather than removed crisis. There is no explicit new
elite/security counter-reaction, so the magnitude of its advantage remains an open
gameplay question.

**POLITICAL_ACCOMMODATION_DOMINANCE_CANDIDATE: OPEN.**
**Classification: ACCEPTED_FOR_F04 / F05_MEASUREMENT.**

This is not a mechanical authority defect and is not a reason to invent a new meter
or rebalance F04 constants. F05 should test repeated use, opportunity cost, and
relative attractiveness across broader decision states.

### Opposition legalization

The action uses the accepted typed institutional mutation, changes competition to
plural, reduces rebellion grievance, and increases coup-faction grievance. It
opens BARGAIN without changing LOBBY, ORGANIZE, organization, Government, suffrage,
elections, or derived regime classification. No permanent immunity or meaningful
repeat is available after the target rule is reached.

### Coercive restriction

The action is a coherent bounded repression package: press becomes censored,
political competition becomes banned, rebellion organization falls by 0.12, and
grievance rises by 0.10. It closes LOBBY/BARGAIN through their normal rule
consumers, never deletes the faction or an active conflict, and F04A later rebuilds
organization under supporting drivers. The combined effects are visible fixture
content, not intervention-ID-specific downstream code.

## Counterfactual and fixture validity

- All starting authoritative state in the banned/plural pair is identical except
  `politicalCompetition`. The same legalization attempt then follows different
  normal feasibility/completion paths.
- All four response branches start from the same canonical tick-0 snapshot and
  use ActionRecord → simulation step → canonical commit. Four of four differ from
  WAIT in recorded political history.
- Explicit searches found no F04D intervention ID, fixture ID, or strategy label in
  downstream political/conflict systems. Fixture-specific values remain confined
  to fixture, inspection, and test code.
- The fixture is deliberately poised near a decision boundary, so exact crisis
  days are fixture-specific. It does not script those days or alter production
  mechanics by scenario ID.
- Neighboring-condition check 1 changed industrial unrest `0.20 → 0.18`. WAIT and
  material-relief rebellion shifted by one day, while response ordering, all four
  distinct histories, accommodation day-300 crisis, legalization/coercion history,
  and territory paths remained qualitatively unchanged.
- Neighboring-condition check 2 changed starting treasury `500 → 510`. All crisis
  and territory timings were unchanged and each final treasury shifted by exactly
  10. The qualitative divergence is therefore not a single-constant knife edge.

**Meaningful response divergence: validated.** The institution comparison is valid
as a rule-dependent action-availability test, with the BARGAIN-only attribution
limit recorded above.

## Original F04 finding closure

| Finding | Review result | Classification |
| --- | --- | --- |
| `WAIT_DOMINANCE_CANDIDATE` | Not observed in the F04D decision context, but not universally closed by one fixture | ACCEPTED_FOR_F04 / F05_MEASUREMENT |
| `CHEAP_PERMANENT_GATE_SHUTOFF` | Closed as a current architecture concern after F04A recovery; F04D actions also pay material cost and reject achieved no-ops | CLOSED |
| `PRE_CRISIS_TIMING_CLIFF` | F04D produces real timing differences, but exact sensitivity remains fixture/pacing dependent | ACCEPTED_FOR_F04 / F05_MEASUREMENT |
| `ONE_WAY_RATCHET` | F04A endogenous recovery remains active and F04D coercion/accommodation regressions recover | CLOSED |
| `POST_CONFLICT_INTERVENTION_FUTILITY` | Current operational faction state changes active-conflict intent; political history may still converge | ACCEPTABLE / REDUCED by F04B |
| `NO_RECOVERY_PATH` | Supported internal residual-state recovery exists; weak states can remain valid stalemates | ACCEPTABLE / REDUCED by F04B |
| `MEANINGLESS_REPEAT` | Achieved institutional/no-op effects are rejected; other legal starts remain paid | CLOSED for the F04D slice |
| `INTERVENTION_SPAM` | Treasury and administrative headroom bound concurrent starts | CLOSED as an authority exploit; pacing remains F05 measurement |

## Required fixes and deferred work

### REQUIRED_FIX_BEFORE_F04_CLOSE

**NONE.**

### ACCEPTED_FOR_F04 / F05_MEASUREMENT

- political accommodation dominance candidate and repeated-use attractiveness
- exact action costs, duration, grievance/organization deltas, and trade-off strength
- WAIT and pre-crisis timing behavior outside the reviewed F04D checkpoint
- fixture-specific crisis days and broader production-content pacing

### DEFERRED_NEW_DOMAIN

Elections, parties, electoral Government turnover, full labor bargaining,
transitional justice, military factions/officer loyalty, local autonomy, war and
occupation politics, fantasy/arcane privilege, and V02 remain outside F04.

## Verification

Verified with Node `v24.19.0` and pnpm `11.19.0` from the desktop verification
runtime.

- `pnpm install --frozen-lockfile`: PASS, lockfile already up to date
- `pnpm run format`: PASS
- `pnpm run typecheck`: PASS
- `pnpm run lint`: PASS
- `pnpm run build`: PASS
- `pnpm run inspect:t024`: PASS, snapshot version 2 and replay checks
- `pnpm run inspect:f01`: PASS, 40-year invariants and midpoint replay
- `pnpm run inspect:f04b`: PASS
- `pnpm run inspect:f04d`: PASS
- `pnpm test`: PASS, 51 files / 421 tests / 0 assertion failures
- neighboring-condition diagnostic: PASS for unrest `0.18` and treasury `510`
- `git diff --check`: PASS

## Gate decision

F04 meets the closure standard: faction effects are recoverable, active internal
conflict reads current state, supported internal recovery preserves LandHex
authority, institutions gate legal response paths, response choices produce real
state-driven history differences, no structural WAIT dominance or cheap permanent
immunity is demonstrated in the reviewed decision context, no generic political
meter or scripted branch was added, and persistence/replay remain correct.

**F04 OVERALL: PASS / CLOSED**
**F05 READY: YES, with the balance notes above; F05 has not started**
**COMMIT READY: YES**

After checkpoint commit/push, set up the ChatGPT ↔ Codex GitHub Bridge before
starting F05. This review does not perform the commit, push, or Bridge setup.
