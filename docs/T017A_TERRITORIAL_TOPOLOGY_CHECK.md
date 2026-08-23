# T017A Static Territorial Topology Check

2026-08-22 기준 headless T017A inspection 결과다. 이 문서는 영토 authority를 바꾸거나 지도를 렌더링하는 검사가 아니다. 현재 simulation의 `Region.controller` 계약 아래에 static LandHex substrate가 올바르게 존재하는지만 확인한다.

실행:

```text
pnpm run inspect:t017a
```

## Locked boundary

- `ScenarioDefinition.mapTerritorialTopology.landHexes`가 static LandHex identity, integer axial coordinate, `regionId`, terrain descriptor를 소유한다.
- `WorldState`에는 topology 또는 LandHex runtime state를 복사하지 않는다.
- `Region.controller`는 여전히 유일한 authoritative territorial-control source다.
- `LandHex.controller`는 존재하지 않는다.
- physical adjacency는 axial coordinate와 LandHex 집합에서 derive한다. 별도 adjacency truth를 저장하지 않는다.
- `TerritorialTopology`와 directed `ContactGraph`는 독립적이다.
- T017A는 tick, RNG, event, economy, ideology, faction, agenda, intervention, instability 결과를 변경하지 않는다.

## Fixture topology

기존 `contact-fixture`를 정적 topology 검증용 headless scenario로 재사용했다.

| 항목 | 결과 |
|---|---:|
| Region | 7 |
| LandHex | 9 |
| Multi-Hex Region | 2 |
| Terrain descriptor | `plains`, `hills`, `coast`, `mountains` |
| Coordinate system | integer axial `{ q, r }` |

| Region | LandHex | 좌표 |
|---|---|---|
| 플레이어 수도 | `capital-west`, `capital-east` | `(0,0)`, `(1,0)` |
| 플레이어 항구 | `port` | `(0,-1)` |
| 플레이어 농지 | `farmland` | `(1,1)` |
| 플레이어 광산 | `mine` | `(2,0)` |
| 플레이어 국경 | `border` | `(-1,1)` |
| 상인공화국 항구 | `merchant-port`, `merchant-quays` | `(-1,0)`, `(-2,0)` |
| 절대왕정 국경지대 | `monarchy-border` | `(-2,1)` |

## Derived physical adjacency

대표 결과:

- `capital-west` ↔ `capital-east` — 같은 Region 내부 adjacency
- `capital-west` ↔ `port` — 플레이어 수도/항구 cross-Region border
- `capital-west` ↔ `border` — 플레이어 수도/국경 cross-Region border
- `capital-east` ↔ `mine` — 플레이어 수도/광산 cross-Region border
- `border` ↔ `monarchy-border` — 플레이어/절대왕정 cross-Region border
- `merchant-quays` ↔ `monarchy-border` — 상인공화국/절대왕정 cross-Region border

모든 neighbor 결과는 `LandHexId` 오름차순으로 정렬된다. LandHex definition 배열을 역순으로 구성한 검사에서도 adjacency와 Region membership 결과가 동일했다. 전역 연결성이나 Region 내부 contiguous 조건은 검사하지 않으며 강제하지 않는다.

## Validation and authority checks

| Check | Result |
|---|---|
| duplicate LandHexId | PASS — scenario initialization rejects |
| duplicate coordinate | PASS — scenario initialization rejects |
| invalid RegionId | PASS — scenario initialization rejects |
| non-integer coordinate | PASS — scenario initialization rejects |
| deterministic insertion ordering | PASS |
| ContactGraph independence | PASS — coordinate relocation leaves directed contact query unchanged |
| static topology absent from WorldState | PASS |
| LandHex controller absent | PASS |
| existing simulation result preserved with/without static topology | PASS |

## Interpretation

T017A의 구조 목표는 충족됐다. 하나의 Region이 여러 LandHex를 가질 수 있고, 서로 다른 Region의 물리적 이웃을 deterministic하게 조회할 수 있다. physical adjacency를 추가하거나 바꿔도 ContactGraph route가 생성·삭제·변경되지 않는다.

이번 단계에서는 `Region.controller`가 그대로 authoritative하므로, LandHex를 실제로 점령하거나 전선을 움직이는 의미는 아직 없다. `stateControl` 의미도 바꾸지 않았다.

## SAFE_TO_DEFER

- `WorldState.landHexStates`
- `LandHex.controller`와 territorial authority migration
- `deriveRegionControlSummary()` 및 Country territorial projection
- partial occupation / contested / faction presence
- army, movement, pathfinding, invasion, war, front, supply
- roads, rivers, fortifications, POI gameplay
- Region/stateControl consumer migration
- map rendering, developer timelapse, UI
- T018 rebellion/coup territorial outcomes

결론: **T017A PASS.** 다음 가장 작은 작업은 별도 review가 필요한 T017B Territorial Authority Migration이며, 이번 작업에서는 시작하지 않았다.
