# TMR Current Task — F04D

**Current task:** F04 — Targeted Architecture / Gate Review
**Status:** PASS WITH F05 NOTES
**Checkpoint:** F04 CLOSED / F05 READY, NOT STARTED

F04D는 기존 Intervention·PolicyState·Faction·resource·crisis·conflict·T024
경계 안에서 구현되었다. F05 pacing/fun과 V02 renderer는 시작하지 않았다.

## Implemented decision

- F04C-R STATUS: PASS
- F04D STATUS: PASS
- POLITICAL COMPETITION: ADDED
- authoritative rule:

  politicalCompetition = banned | restricted | plural

이는 opposition/competing political organizations의 legal scope만 표현한다. democracy score, openness score, legitimacy, civil-liberties meter, election system, parliament, government turnover가 아니다.

## Implemented minimum scope

1. material relief — cost 90 / load 35 / 1 day / industrial food capacity +6
2. limited political accommodation — cost 70 / load 35 / 7 days / rebellion
   grievance -0.25
3. opposition legalization — cost 100 / load 40 / 12 days / competition plural,
   rebellion grievance -0.10, coup-faction grievance +0.20
4. coercive political-organization restriction — cost 75 / load 45 / 5 days /
   press censored, competition banned, rebellion organization -0.12 and
   grievance +0.10

All four definitions are developer-validation content in
`createF04DValidationScenario()`, not a production catalog.

## Key distinctions

- material relief != political accommodation
- amnesty != opposition legalization
- opposition legalization != suffrage
- opposition legalization != press freedom
- politicalCompetition != democracy score
- coercion != permanent organization deletion

각 action은 기존 Institutional Rules, Faction, Region, treasury/admin headroom,
commitment lifecycle을 사용한다. RegimeClassification을 직접 읽어 보너스를
주지 않고, action ID로 downstream crisis를 예약하지 않는다.

## Counterfactual evidence

`pnpm run inspect:f04d`는 seed 40103의 동일 tick-0 checkpoint를 720일 동안
branch했다.

- competition banned: BARGAIN closed, legalization feasible, coup day 13,
  rebellion day 90, territory changes day 91/98/105
- competition plural: BARGAIN open, legalization rejected as a no-op, rebellion
  day 19, territory changes day 35/42/49, coup day 300
- WAIT, material relief, accommodation, legalization, coercion all produced
  different histories from the same checkpoint
- continuous 720-day and day-360 save/load continuation matched after canonical
  JSON comparison; insertion-order comparison also matched
- no-op repeat was rejected and repeat-start spam was bounded by treasury/admin
  headroom
- WAIT dominance, cheap permanent gate shutoff, one-way ratchet, and pre-crisis
  timing cliff were not observed in this narrow slice

All branches remained active at the horizon and had no Government transition.
Consolidation eligibility/progress was recorded without forcing a terminal result.
Active-conflict response and zero-territory recovery remain F04B-owned.

## Persistence and causality

- snapshot format is version 2 and requires a valid `politicalCompetition`
- version 1, missing-field, and invalid-enum snapshots are rejected without a
  hidden default or migration
- institution mutation emits `INSTITUTION_RULE_CHANGED` after completion with the
  completion event as its cause
- `requireCompletionEffectChange` prevents meaningless repeated completion
- T024 roundtrip/replay and immutable lineage remain intact

## Explicitly deferred

이번 F04D narrow slice 밖이다.

- elections, electoral competition, party system, parliamentary seats
- government turnover through elections
- full labor/collective bargaining or strike negotiation domain
- transitional justice / truth commission
- military faction / officer loyalty
- local autonomy
- War as Politics, invasion AI, mobilization, conscription, war economy, occupation politics, peace treaties
- arcane privilege / Mage Guild / sacred sovereignty mechanics
- F05 pacing/fun decision
- V02 / Gate 1V renderer
- new RNG, generic political resource, universal stability meter, legitimacy/democracy meter
- unrelated balance, persistence redesign, or architecture framework

## Guardrails

- Player choices change state, not story nodes.
- Events are detected, not scheduled.
- LLM output is never authoritative state.
- WorldState.landHexStates[*].controller remains the sole physical territorial authority.
- Region.stateControl is administrative penetration, not territory.
- RegimeClassification remains derived.
- serialize/deserialize full validation, canonical trust, replay, causality, and immutable lineage remain intact.

## Verification

- `pnpm install --frozen-lockfile`: PASS
- `pnpm run format`: PASS
- `pnpm run typecheck`: PASS
- `pnpm run lint`: PASS
- `pnpm run build`: PASS
- `pnpm run inspect:t024`: PASS — snapshot version 2
- `pnpm run inspect:v01`: PASS — V02 not started
- `pnpm run inspect:f01`: PASS — 40-year invariants and replay
- `pnpm run inspect:f04d`: PASS
- `pnpm test`: PASS — 51 files / 421 tests

## Next action

The targeted F04B+F04D review found no required code fix. Detailed evidence is in
`docs/F04_TARGETED_ARCHITECTURE_GATE_REVIEW.md`.

Next sequence:

1. review and commit/push the complete F04D + F04 review checkpoint;
2. set up the ChatGPT ↔ Codex GitHub Bridge;
3. start F05 pacing/fun measurement with political-accommodation dominance,
   repeated-use trade-off, broader WAIT dominance, and timing sensitivity as inputs.

Do not start V02, elections/parties/full labor bargaining, transitional justice,
military factions, local autonomy, war, or fantasy politics as part of checkpointing.
