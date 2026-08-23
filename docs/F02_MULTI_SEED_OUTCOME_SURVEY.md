# F02 Multi-seed Outcome Survey

**Status:** COMPLETE / PASS — 2026-08-23  
**Scope:** developer-only WAIT baseline survey; no balance or gameplay change

## Contract

F02는 새로운 simulation system이 아니다. 기존 F01 headless harness를 재사용해
동일한 `ScenarioDefinition`과 `WAIT`/no-intervention input을 여러 deterministic
seed로 실행하고, outcome·정치 활동·상태 trajectory·history diversity를 측정한다.

각 run은 다음 canonical path만 사용한다.

```text
runSimulationStep
→ commitSimulationStep
→ event / state telemetry
```

survey result와 history signature는 developer analysis artifact이며
`WorldState`, persistence snapshot, EventStore authority가 아니다. F02는
새 RNG 소비, intervention, policy, AI, balance tuning을 추가하지 않았다.

## Survey setup

- Scenario: `t021.rebellion-fixture` v1
- Input policy: `WAIT` (accepted ActionRecords 0)
- Seeds: `0..22`와 기존 F01 baseline `40101` — 총 24개
- Horizon: seed당 40 simulated years = 14,400 authoritative daily ticks
- Terminal run: terminal 발생 시 즉시 중단
- Command: `pnpm run inspect:f02`
- Implementation: `src/sim/inspection/f02MultiSeedOutcomeSurvey.ts`

## First survey result

실행 환경에서 24개 run은 모두 요청 horizon까지 실행되었다.

| Metric | Result |
| --- | ---: |
| Seeds | 24 |
| Requested / executed ticks | 345,600 / 345,600 |
| Wall-clock runtime | 185.58 s |
| Effective throughput | 1,862.26 ticks/s |
| Active | 24 / 24 |
| Order consolidated | 0 / 24 |
| State dissolved | 0 / 24 |

### Political activity

각 값은 `min / median / max (zero seed count)`이다.

- Rebellion: `1 / 1 / 1 (0)`
- Coup: `1 / 1 / 1 (0)`
- Civil war: `0 / 0 / 0 (24)`
- Government transition: `0 / 0 / 0 (24)`
- LandHex territorial change: `3 / 3 / 3 (0)`
- Consolidation attempt: `0 / 0 / 0 (24)`
- State dissolution: `0 / 0 / 0 (24)`

### History diversity and seed sensitivity

- Exact history signatures: `1`
- Coarse history signatures: `1`
- Largest exact/coarse cluster: `24 / 24`
- Exact duplicate seed count: `24`
- Near-identical coarse duplicate seed count: `24`
- Seed-sensitive authoritative history: **NOT OBSERVED**

24개 seed는 동일한 observable event sequence와 trajectory signature로 수렴했다.
이는 seed가 deterministic contract를 위반했다는 뜻이 아니라, 현재 WAIT fixture의
authoritative path에서 seed-dependent choice가 관찰되지 않았다는 뜻이다. F02에서는
이 결과를 숨기기 위해 RNG mechanic을 추가하거나 narrative history label을 만들지
않는다.

### State dynamics

- Treasury unchanged: `24 / 24`; final range `0–0`
- `stateCapacity` unchanged: `24 / 24`; final range `20–20`
- Faction organization total start/peak/final range: `1.60–1.60 / 1.60–1.60 /
  1.60–1.60`
- Crisis-participating faction range: `2–2`
- Instability peak range: `80–80`; all 24 seeds ended below the peak
- State continuity minimum: `100 / 100 / 100`

### Territory and recovery

- Controlled LandHex start/min/final: `3 / 0 / 0` for every seed
- Zero controlled LandHex reached: `24 / 24`
- Recovered after zero control: `0 / 24`
- Final active at zero control: `24 / 24`
- Zero-control duration: `14,379 ticks` = approximately `39.94 years`

이는 T023의 현재 계약과 일치한다. `0 controlled Hex` alone은 dissolution이
아니며, scenario-owned `dissolutionCriteria.stateContinuityAtOrBelow`와
authoritative terminal evidence가 별도로 필요하다. 이번 fixture의 continuity
minimum은 `100`이고 scenario threshold는 `0`이므로 dissolution은 발생하지 않았다.

### Consolidation and pacing

- Consolidation ever eligible: `0 / 24`
- Maximum consolidation streak: `0 / 0 / 0 (24 zero seeds)`
- Dissolution threshold reached: `0 / 24`
- Terminal-year distribution: no terminal years
- Longest political silence: `39.94 / 39.94 / 39.94 years`
- Territorial ping-pong candidates: `0`
- Event-spam candidates: `0`

## Diagnostic concerns

이 항목들은 F02 관찰 결과이며 자동 balance FAIL이나 최종 재미 점수가 아니다.

- `NO_OUTCOME_REACHED`
- `LOW_HISTORY_DIVERSITY`
- `ECONOMIC_STASIS`
- `HIGH_ZERO_TERRITORY_PERSISTENCE`
- `LONG_SILENT_INTERVALS`
- `NO_CONSOLIDATION_REACHED`
- `DISSOLUTION_NOT_REACHED`

현재 seed survey에서 Government transition, civil war, consolidation,
dissolution, territory recovery는 관찰되지 않았다. `stateContinuity` 감소
source와 full annexation/permanent fragmentation 같은 일부 evidence는 기존
deferred contract의 영향을 받으므로 F05에서 별도 해석한다.

## Representative seeds

현재 coarse cluster가 단 하나이므로 대표성의 차이는 없지만, 후속 작업의 재현 가능한
출발점으로 다음을 기록한다.

- active: `0`
- boring / least active: `0`
- volatile / most active: `0`
- recovery candidate: 없음
- terminal candidate: 없음
- largest cluster representative: `0`

좋은 seed만 골라 Gate 1F 시각 검증에 사용하지 않는다. 모든 seed가 동일해
boring/pathological representative도 같은 cluster에서 선택된다.

## Verification

- small F02 tests: PASS
- F02 inspection: PASS — 24 seeds / 40 years
- F01 baseline seed `40101`: rebellion 1, coup 1, civil war 0, Government
  transition 0, territorial changes 3, controlled LandHex `3 / 0 / 0`
- cross-seed signature/order tests: PASS
- balance changed: NO
- gameplay changed: NO
- new RNG mechanic: NO
- F03 started: COMPLETE / PLAYER_AGENCY_WEAK
- F04 started: NO
- F05 started: NO
- V02 started: NO

## Next

F03 — Intervention Counterfactuals는 이 baseline을 기준으로 완료되었다. 상세
counterfactual evidence와 현재 `PLAYER_AGENCY_WEAK`/downstream integration
finding은 `docs/F03_INTERVENTION_COUNTERFACTUALS.md`에 기록한다.
