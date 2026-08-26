# P0 Demo Game Flow / Pacing V1 결과

## 범위

기준 branch `parallel-p0-integration-v1`의 commit
`e521961e25e4b20c70245137216c80a103120420`에서
`parallel-p0-demo-game-flow-v1`를 만들고, player-facing 시간 반응만 정리했다.
simulation balance, 사건 발생 조건, faction logic, Gate1F, map geometry,
world asset, audio, title/briefing, difficulty, History/Chronicle redesign,
News popup system은 변경하지 않았다.

새 event type이나 Manager/framework/event bus도 추가하지 않았다.

## Before / After playback behavior

| 상황 | Before | After |
| --- | --- | --- |
| routine significant event | 사건에 따라 재생 흐름이 끊길 수 있음 | `NONE`: speed와 `isPlaying` 유지 |
| rebellion / coup / civil war | 중대 사건 auto-pause 계층 | `SLOW`: 자동 감속 ON이면 1x, 재생 유지 |
| auto-slow OFF + crisis | 설정에 따라 계속 진행 | 현재 speed 유지, 재생 유지 |
| government transition | auto-pause 계층 | `NONE`: 단순 정권교체는 terminal이 아니므로 계속 진행 |
| order consolidated / state dissolved | 설정에 따라 pause가 우회될 수 있음 | `STOP`: 설정과 무관하게 재생 정지 |
| policy / intervention submission | 제출 시 clock clear + `isPlaying=false` | 제출 전 playback state 유지 |
| +1일 / +7일 / +30일 | 수동 진행 후 정지 | 기존처럼 수동 진행 후 정지 |

## Event reaction model

`src/app/autoPause.ts`의 기존 seam을 다음 세 반응으로 재구성했다.

| Event | Reaction | 동작 |
| --- | --- | --- |
| routine event | `NONE` | speed / playback state 변경 없음 |
| `REBELLION_STARTED` | `SLOW` | auto-slow ON이면 1x로 감속, 시간은 계속 흐름 |
| `COUP_ATTEMPT_STARTED` | `SLOW` | auto-slow ON이면 1x로 감속, 시간은 계속 흐름 |
| `CIVIL_WAR_STARTED` | `SLOW` | auto-slow ON이면 1x로 감속, 시간은 계속 흐름 |
| `GOVERNMENT_TRANSITIONED` | `NONE` | terminal이 아닌 정부 포인터 전환 |
| `ORDER_CONSOLIDATED` | `STOP` | Run outcome 확정으로 재생 정지 |
| `STATE_DISSOLVED` | `STOP` | Run outcome 확정으로 재생 정지 |

한 tick에 여러 event가 있으면 `STOP > SLOW > NONE` 우선순위를 적용한다.
`flowNotice`는 실제 `eventLabel`을 사용하며, 자동 감속 시
`반란 발생 · 19일차 · 1x로 자동 감속`처럼 표시한다.

## Policy / intervention playback preservation

`submitPolicy()`와 `submitAction()`에서 제출 자체를 이유로 `clearClock()`와
`setIsPlaying(false)`를 호출하던 경로를 제거했다.

- 재생 중 정책 제출: 공통 action pipeline을 실행한 뒤 재생 계속
- 재생 중 intervention 제출: 공통 action pipeline을 실행한 뒤 재생 계속
- 일시정지 중 정책 제출: 일시정지 유지
- intervention 또는 policy transition이 terminal outcome을 실제로 만들면
  `STOP` 반응이 우선한다.
- `SLOW` 반응에서는 `setIsPlaying(false)`를 호출하지 않는다.
- `STOP`에서만 clock을 즉시 clear하여 stale interval의 추가 tick을 막는다.

## Verification

### Targeted tests

실행:

```text
pnpm exec vitest run src/app/autoPause.test.ts src/app/gameplayReality.test.ts src/app/demoGame.test.ts --no-file-parallelism
```

결과: 3 files / 18 tests passed.

포함한 회귀 범위:

- 3x + rebellion → 1x
- 2x + coup → 1x
- 1x + civil war → 1x
- auto-slow OFF → 현재 speed 유지
- `STATE_DISSOLVED` → `STOP`
- routine event → `NONE`
- 한 tick 다중 event의 `STOP > SLOW > NONE`
- 기존 policy/intervention runtime pipeline과 UI control copy

### Project gates

```text
pnpm run typecheck     PASS
pnpm run lint          PASS
pnpm run format        PASS
pnpm run build         PASS
git diff --check       PASS
```

Build는 정상 완료했으며 Vite의 기존 large chunk advisory만 출력됐다.

### Browser smoke

local Vite 화면에서 다음을 실제로 관찰했다.

- 3x 재생 중 실제 `반란 발생` 시점에
  `반란 발생 · 19일차 · 1x로 자동 감속` 표시
- 같은 시점에 `1x` 선택 상태와 `일시정지` 버튼의 재생 상태 유지
- crisis banner의 `반란 진행 중`, 철산 공업주 focus, 활성 반란 map feedback 유지
- auto-slow OFF에서 `반란 발생 · 19일차 · 현재 3x 유지`, 3x와 재생 상태 유지
- 재생 중 policy 제출 후 `정책 제출 완료 · 제도 기록을 갱신했습니다. · 재생 계속`
  표시와 tick 증가
- 재생 중 intervention 제출 후 `행동 제출 완료 · 재생을 계속합니다.` 표시와
  재생 상태 유지
- 일시정지 중 policy 제출 후 `정책 제출 완료 · 제도 기록을 갱신했습니다. · 일시정지 유지`
  표시와 일시정지 상태 유지

## Known limitations

- `STOP`의 사건 분류와 우선순위는 targeted unit test로 검증했다. 장시간
  terminal run을 기다리는 별도 browser capture는 실행하지 않았다.
- `ORDER_CONSOLIDATED`의 terminal 의미는 기존 Run outcome 계약을 따른다.
  사건 발생 조건과 consolidation balance는 이 작업에서 조정하지 않았다.
- full suite 및 장시간 multi-seed/factory/hardware 검증은 이 pacing slice의
  시간 범위에 포함하지 않았다.
