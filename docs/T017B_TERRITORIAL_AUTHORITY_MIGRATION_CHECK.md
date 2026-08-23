# T017B Territorial Authority Migration Check

**상태:** COMPLETE / PASS  
**기준일:** 2026-08-22

T017B는 physical territorial authority를 runtime `Region.controller`에서
`WorldState.landHexStates[*].controller`로 migration했다.

## Locked result

- `LandHexRuntimeState.controller` is the sole writable physical territorial authority.
- runtime `Region.controller`는 존재하지 않는다.
- Region territorial state와 Country territorial lists는 LandHex runtime에서 파생한다.
- `Region.ownerCountryId`, `Region.stateControl`, political influence, physical control은 독립적이다.
- ContactGraph는 directed Region graph로 유지되며 TerritorialTopology와 독립적이다.
- T017B는 T018 rebellion/coup, T021 war resolution, army/front/pathfinding, UI/rendering을 구현하지 않는다.

## Inspection checks

| Check | Result |
|---|---|
| A initialization migration | PASS |
| B sole physical authority | PASS |
| C multi-Hex full control | PASS |
| D partial occupation | PASS |
| D2 contested control | PASS |
| E faction presence | PASS |
| F uncontrolled | PASS |
| G economy full-only boundary | PASS |
| H ideology full-only boundary | PASS |
| I country-contact partial endpoint exclusion | PASS |
| J instability full-only boundary | PASS |
| K stateControl independence | PASS |
| L legal-owner independence | PASS |
| M ContactGraph independence | PASS |
| N immutable mutation/no-op silence | PASS |
| O deterministic event ordering | PASS |
| P alternate cardinality | PASS |
| Q existing fully-controlled baseline projection | PASS |

`pnpm run inspect:t017b`는 동일 fixture를 반복 실행해 동일한 projection과 event
sequence를 출력한다. 현재 headless output의 baseline은 economy `15 / 5`,
country-contact projection `6 / 2`, instability `22.989 / 0.000`이며,
이는 full Region과 partial endpoint의 경계를 확인하기 위한 diagnostic 값이다.

## Deferred

partial Region의 Hex별 인구·생산 분할, occupation duration, front/army/combat,
rebellion/coup territorial spread, victory/dissolution 실행 규칙, serialization/replay
저장 I/O, map UI/rendering은 후속 task에서 별도 결정한다.
