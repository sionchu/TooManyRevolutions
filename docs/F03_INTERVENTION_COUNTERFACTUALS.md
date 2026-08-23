# F03 Intervention Counterfactuals / Player Agency Validation

## Scope

F03는 새 intervention, policy, RNG, AI, balance 조정을 추가하지 않고,
동일한 authoritative starting snapshot에서 `WAIT`와 현재 catalog의 합법적인
단회 `START_INTERVENTION` branch를 비교했다. 모든 branch는

`T024 snapshot clone → validated ActionRecord → runSimulationStep → commitSimulationStep`

canonical path를 사용했다. telemetry는 developer 결과이며 `WorldState`나
persistence schema가 아니다.

## Scenario suitability

### T021 fixture

`t021.rebellion-fixture`는 T021 conflict contract 검증에는 적합하지만 F03에는
부적합했다.

- `interventionCatalog`가 비어 있음
- player 시작 treasury가 0
- ContactGraph directed edge가 없음
- intervention feasibility와 downstream 경제/행정 선택을 비교할 수 없음

T021 fixture 자체는 수정하지 않았다.

### Gate1F validation composition

`src/sim/state/gate1fValidationFixture.ts`의 `gate1f.validation`은 T021의
정치 위기, 두 faction, multi-Hex Region/LandHex 상태를 그대로 기반으로 하고,
기존 T016B fixture catalog의 세 administrative definition만 재사용한다.

- starting treasury: 500
- daily expenditure: 1
- stateCapacity: 60
- capital/industrial Region의 서로 다른 unrest, ideology, resource
  production/demand
- 두 방향의 information/trade ContactGraph edge
- T022 consolidation criteria를 실제 ScenarioDefinition으로 구성
- stateContinuity dissolution threshold는 기존 계약을 유지

국고/지출은 90일·180일 natural checkpoint에서도 합법 action feasibility를
관찰하기 위한 developer fixture 입력이다. production balance를 변경하지 않는다.

## Survey setup

- Scenario: `gate1f.validation`
- Seed: `40103`
- Policy: `WAIT` 또는 branch 시작 시 합법 intervention 한 번 후 `WAIT`
- Horizon: branch당 10 simulated years / 3,600 authoritative daily ticks
- Starting checkpoints: day 0, day 90, day 180 (기존 WAIT run에서 자연 도달)
- Branches: `WAIT`, `INTERVENTION_SHORT`, `INTERVENTION_LONG`,
  `INTERVENTION_PREREQUISITE`
- Executed ticks: 43,200
- Current run wall-clock: 약 15.8초 (machine-dependent)

모든 세 starting state에서 세 intervention이 feasibility를 통과했다.
infeasible branch는 treasury/headroom/prerequisite를 무시하고 실행하지 않는다.

## Observed state and history

| Branch | Cost | Admin load | Duration | First divergence | Political history vs WAIT |
|---|---:|---:|---:|---:|---|
| short | 8 | 12 | 1 day | day 1 | same |
| long | 20 | 15 | 180 days | day 1 | same |
| prerequisite | 12 | 20 | 180 days | day 1 | same |

각 accepted branch에서 실제 경로는 다음과 같았다.

`START_INTERVENTION ActionRecord`
→ `interventionCommitments`
→ `INTERVENTION_STARTED`
→ economy treasury charge
→ administrative load/headroom read model

day 180에는 long/prerequisite commitment load가 해제되었다. Treasury delta는
각각 `-20`과 `-12`로 남았고 short는 `-8`이었다. stateCapacity는 소비되지
않았다.

그러나 세 intervention 모두 WAIT와 다음 political history가 같았다.

- rebellion: 동일
- coup: 동일
- civil war: 동일
- Government transition: 동일
- territorial control changes: 동일
- consolidation/dissolution outcome: 동일

F03는 `stateReConvergedAtHorizon`를 별도 기록한다. 이 run에서는 intervention
cost가 treasury에 남아 state snapshot은 재수렴하지 않았지만, 차이는
administrative/economic path에 한정되었고 정치적 history는 갈라지지 않았다.

## Downstream audit — before F03A

F03 당시 확인한 실제 consumer:

- commitment 생성/완료
- treasury settlement
- administrative headroom/overload selector
- 조건이 맞을 때 instability pressure selector

F03 당시 intervention definition에서 관찰되지 않은 consumer:

- intervention-specific Region unrest/scarcity 변화
- faction organization/grievance/resources 변화
- Government transition
- LandHex controller/front/conflict 변화
- consolidation/dissolution criteria에 대한 intervention별 영향

따라서 세 intervention은 모두 `INTERVENTION_DOWNSTREAM_INTEGRATION_GAP`
후보로 기록했다. 이 문서는 F03의 historical snapshot이며, 다음 F03A에서
이 gap을 수정했다. 수정 후 결과는
`docs/F03A_INTERVENTION_DOWNSTREAM_INTEGRATION.md`에 분리해 기록한다.

## Player agency classification

`PLAYER_AGENCY_WEAK`

근거:

- accepted action은 day 1에 실제 authoritative state와 EventStore history를
  바꾼다
- 세 intervention 사이에 비용·행정 점유·기간 trade-off가 있다
- 하지만 +1년/+5년/10년 political history와 outcome trajectory는 WAIT와
  갈라지지 않는다
- 새 RNG나 smart policy를 추가하지 않았으므로 결과를 억지로 다양화하지 않았다

이는 최종 fun/balance 판정이 아니다. F02의 seed-insensitive/stasis finding과
별개로, F03은 현재 intervention catalog의 downstream 연결 부족을 더 직접적으로
보여준다.

## Verification

- F03 small tests: PASS
- `pnpm run inspect:f03`: PASS
- same snapshot branch determinism: PASS
- branch order independence: PASS
- legal action seam: PASS
- infeasible action rejection: PASS
- scenario/telemetry purity: PASS
- balance/gameplay/RNG/persistence schema changes: NONE
- F04: NOT STARTED
- V02: NOT STARTED

## F03 recommendation at the time

F04 exploit analysis보다 먼저, 현재 intervention 중 하나가 실제 political 또는
material downstream state를 읽도록 하는 최소 Gate1F gameplay integration repair를
별도 task로 제안했다. 이 recommendation은 F03A로 실행되었지만, F03A 후에도
정치적 history divergence가 없으므로 player agency가 자동으로 PASS로 승격된 것은
아니다.
