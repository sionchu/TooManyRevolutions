# TMR Current Task — F04D

**Current task:** F04D — Narrow Institution-Action Implementation  
**Status:** READY / NOT STARTED  
**Checkpoint:** F04C-R PASS / COMPLETED

이 파일은 다음 gameplay task의 scope guard다. **이번 laptop → desktop migration task는 F04D 구현이 아니다.** Desktop checkout과 setup을 먼저 검증한 뒤, 별도의 최종 F04D implementation prompt를 준비·검토하고 나서만 source를 변경한다.

## F04C-R decision

- F04C-R STATUS: PASS
- POLITICAL COMPETITION: ADD
- candidate rule:

  politicalCompetition = banned | restricted | plural

이는 opposition/competing political organizations의 legal scope만 표현한다. democracy score, openness score, legitimacy, civil-liberties meter, election system, parliament, government turnover가 아니다.

## Frozen minimum candidate scope

1. material relief
2. limited political amnesty / accommodation proxy
3. opposition legalization + narrow politicalCompetition
4. coercive political-organization restriction

## Key distinctions

- material relief != political accommodation
- amnesty != opposition legalization
- opposition legalization != suffrage
- opposition legalization != press freedom
- politicalCompetition != democracy score
- coercion != permanent organization deletion

각 action은 기존 Institutional Rules, Faction, Region, treasury/admin headroom, commitment lifecycle을 통해 합법적으로 실행되어야 한다. RegimeClassification을 직접 읽어 보너스를 주거나, action ID로 downstream crisis를 예약하지 않는다.

## Required future proof

F04D의 성공 기준은 scalar state delta만이 아니다. 동일 starting snapshot에서 institutional configuration과 stabilization response가 다음 중 실제 downstream 차이를 만드는지 검증한다.

- grievance / organization trajectory
- scarcity / unrest / instability
- coup / rebellion eligibility and timing
- crisis kind or conflict occurrence
- territorial trajectory
- government transition
- consolidation eligibility

효과가 비용·행정 부담·factional counter-reaction과 함께 나타나는지 기록한다. 하나의 regime이나 action이 모든 상황에서 우월한지 전제하지 않는다.

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

## Next action

After desktop migration verification, prepare and review the final F04D implementation prompt. Do not change gameplay code before that prompt and scope are explicitly reviewed.
