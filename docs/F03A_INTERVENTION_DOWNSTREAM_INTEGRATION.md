# F03A Intervention Downstream Integration Repair

## Scope

F03A는 F03에서 확인된 intervention의 treasury/administrative-only dead-end를
수정하기 위한 최소 integration slice다. 새 political system, crisis threshold,
RNG, intervention catalog expansion, AI, balance tuning은 추가하지 않았다.

검증 대상은 T021 fixture가 아니라 F03용 developer-only
`gate1f.validation` composition이다. T021 `rebellion-fixture` 자체는
변경하지 않았다.

## Causal contract

기존 canonical path는 그대로 유지한다.

```text
validated START_INTERVENTION ActionRecord
  → intervention commitment
  → economy treasury settlement / administrative load
  → completionTick
  → scenario-owned typed completion effect
  → existing phase consumer
  → derived pressure and history evidence
```

`InterventionDefinition.completionEffects`는 다음 세 가지 concrete delta만
지원하는 작은 typed union이다.

- `regionResourceProductionCapacityDelta`
- `factionGrievanceDelta`
- `factionOrganizationDelta`

범용 modifier, expression interpreter, callback registry, intervention ID별
downstream switch, moral flag, hidden political score는 만들지 않았다.
effect magnitude와 target은 ScenarioDefinition content가 소유하고, target
identity는 scenario validation에서 확인한다.

효과는 기존 commitment의 `completionTick`에서 immutable replacement로 적용되고
같은 commitment가 제거되는 completion path에서 정확히 한 번만 실행된다.
`INTERVENTION_COMPLETED` payload에는 실제 적용 전후 값과 `changed` 여부를 남겨
resource/crisis event가 필요한 경우 이 완료 event를 정확한 causal evidence로
참조할 수 있게 했다.

## Causal audit

아래는 F03의 세 기존 fixture intervention에 F03A validation content를 연결한
결과다. 비용·행정 부담·prerequisite·기간은 F03와 동일하다.

| Intervention | Immediate cost/load | Completion effect | Existing downstream consumer | Observed result |
|---|---:|---|---|---|
| `t016b.fixture.short-action` | 8 / 12 | industrial Region food production capacity `+6` | resources → scarcity → T017 material pressure | Region scarcity와 unrest trajectory가 WAIT와 달라짐; `RESOURCE_PRODUCED` → `RESOURCE_SHORTAGE_CHANGED` cause chain 확인 |
| `t016b.fixture.long-program` | 20 / 15 | coup fixture Faction organization `-0.3` | T016 observations, T018 coup prerequisite; T021 strength reader when conflict reads faction | Faction organization이 `0.8 → 0.5`, coup eligibility가 WAIT 대비 감소 |
| `t016b.fixture.prerequisite-program` | 12 / 20 | rebellion fixture Faction grievance `-0.3` | T016 observations, T018 rebellion prerequisite | Faction grievance와 rebellion eligibility가 WAIT 대비 감소 |

세 intervention 모두 completion effect가 적용되었고, F03의 세 natural
checkpoint에서 non-cost authoritative state와 기존 consumer response가
관찰됐다. `short`의 resource effect는 F03A fixture의 `industrial` Region과
`food` capacity를 대상으로 한다. 이는 production balance lock이 아니다.

## Downstream boundaries

- T016: faction grievance/organization을 기존 observation에서 읽는다. F03A는
  T016 strategy writer를 새로 만들지 않는다.
- T017: resource capacity 변경은 resources phase가 scarcity를 다시 계산하게
  하고, instability phase가 기존 material pressure를 읽는다. T017 threshold와
  rate는 변경하지 않는다.
- T018: faction grievance/organization 변경은 기존 coup/rebellion prerequisite
  read model을 바꾼다. completion event가 crisis를 예약하거나 직접 생성하지
  않는다.
- T021: faction organization은 active armed conflict가 읽을 때 기존
  operational-strength derivation의 입력이다. F03A는 army/unit/territory를
  발명하지 않는다.
- T022: 직접 consolidation progress를 쓰지 않는다. treasury/instability/관련
  state가 바뀌면 기존 criteria가 자연스럽게 읽을 수 있는 경계만 열었다.
- T023: stateContinuity와 dissolution formula는 변경하지 않았다.

Intervention-specific Government transition, LandHex controller/front,
consolidation, dissolution effect는 이번 task에서 구현하지 않았으며, 현재
fixture에서 이를 dead-end로 숨기지 않고 deferred boundary로 기록한다.

## Counterfactual rerun

F03와 같은 `gate1f.validation`, seed `40103`, day 0/90/180 checkpoint,
WAIT + three legal single-intervention branches, branch당 10년 matrix를 다시
실행했다.

### Before F03A

- 세 intervention은 treasury/admin commitment 차이만 만들었다.
- Region/Faction/T017/T018 downstream difference가 관찰되지 않았다.
- 결과: `PLAYER_AGENCY_WEAK`, `INTERVENTION_DOWNSTREAM_INTEGRATION_GAP`.

### After F03A

- 세 intervention 모두 `INTERVENTION_COMPLETED`의 effect application 1건을
  만들었다.
- short는 scarcity/unrest/T017 material pressure path가 달라졌다.
- long와 prerequisite는 각각 faction organization/grievance 및 T018
  eligibility read model이 달라졌다.
- 세 intervention 모두 existing downstream consumer가 관찰되었고, dead-end
  candidate branch는 없다.
- first divergence는 합법 action이 적용되는 day 1이며, completion effect의
  실제 state divergence는 short day 2, long/prerequisite completion boundary
  이후에 나타난다.
- 정치 event sequence, rebellion/coup/civil war count, Government transition,
  territorial change, consolidation/dissolution outcome은 이 validation
  matrix에서 WAIT와 여전히 같았다.

따라서 F03A의 integration acceptance는 PASS지만 player agency classification은
`PLAYER_AGENCY_WEAK`로 유지한다. state/read-model difference는 증명했으나
10년 범위에서 정치적 history divergence나 persistent crisis/outcome
divergence까지 증명한 것은 아니다.

## Persistence and determinism

- effect는 `runSimulationStep → commitSimulationStep` canonical path에서만
  실행된다.
- mid-commitment T024 save/load resume은 continuous branch와 동일한
  WorldState/EventStore/ActionRecord/RNG 결과를 만들었다.
- completion event는 한 번만 기록되고, resource production/shortage cause
  chain은 완료 event에서 기존 resource event로 이어진다.
- frozen canonical graph에 직접 mutation하지 않고 Region/Faction을
  immutable replacement한다.
- WAIT/no-intervention branch는 completion effect를 실행하지 않는다. F02의
  24-seed WAIT baseline을 오염시키지 않는다.

## Deliberately not done

- production intervention catalog expansion
- effect magnitude balancing or historical content lock
- stateContinuity intervention effects
- direct territory/Government/consolidation/dissolution effects
- crisis scheduling or threshold tuning
- repeated intervention strategy / exploit search
- Agent AI, renderer, V02

F03A 이후에도 player agency가 `WEAK`이면 F04를 곧바로 “해결”로 간주하지
말고, 작은 targeted agency/balance diagnosis를 먼저 검토한다. F03A 자체는
balance decision이 아니다.
