# F05_FIX23 Result

TASK_ID: F05_FIX23
STATUS: COMPLETE / AWAITING_CHATGPT_REVIEW
BASE_IMPLEMENTATION_HEAD: e6912f2ac643079ed8347fb496b7d1d10033aa41
BASE_IMPLEMENTATION_BRANCH: f05-fix22-review
REVIEW_BRANCH: f05-fix23-review

PRIMARY_CLASSIFICATION: REBELLION_PERSISTENCE_RUNTIME_VERTICAL_SLICE_IMPLEMENTED
RUNTIME_STATE: CONFLICT_SCOPED_BOOTSTRAP_EPISODE
BOOTSTRAP_SOURCE: EXISTING_REBELLION_STARTED_EVENT
BOOTSTRAP_PROVES_CONTINUED_CAPACITY: NO
PROFILE_BINDING: EXACT_COUNTRY_FACTION_PROFILE
OPERATIONAL_EVIDENCE_WRITER: NOT_IMPLEMENTED
OPERATIONAL_COLLAPSE_WRITER: NOT_IMPLEMENTED
SETTLEMENT_DOMAIN: NOT_IMPLEMENTED
T018_CREATION_OWNER: UNCHANGED
T021_T022_T023: UNCHANGED
TERRITORIAL_WRITER: NO
PERSISTENCE_FORMAT: V8
LATE_STATE_IMPROVEMENT_CLAIMED: NO
GATE1F: NOT_READY
V02: NOT_STARTED
NEXT_IMPLEMENTATION_READINESS: REBELLION_OPERATIONAL_EVIDENCE_SOURCE_GROUNDING

## Implementation

F05_FIX22의 static ScenarioDefinition channel/profile seam 위에 최소 runtime
bootstrap만 추가했다.

- `RebellionOperationalPersistenceEpisode`를 추가했다.
- `WorldState.rebellionPersistenceEpisodes`를 ConflictId-keyed runtime map으로
  추가하고 `createInitialWorldState()`에서는 `{}`로 초기화했다.
- T018이 새 rebellion Conflict를 만들 때만 exact Country/Faction profile을
  찾고, 같은 step에서 생성된 기존 `REBELLION_STARTED` event의 ID/tick을
  episode에 기록한다.
- profile이 없으면 기존 T018 결과와 episode map `{}`를 유지한다.
- active Conflict deduplication은 그대로 유지되어 repeated eligibility가
  Conflict/event/episode를 중복 생성하지 않는다.
- authored initial active rebellion은 start event provenance가 없으므로
  episode를 만들지 않는다.
- Coup에는 episode를 만들지 않는다.
- suppression이 Conflict를 resolve해도 episode는 역사적 provenance로 남고,
  active 여부의 authority로 사용하지 않는다.

## Strict V8 persistence and closure

`SerializedSimulationSnapshotV8`, `SerializedWorldStateV8`, format version 8을
구현했다. V8 decoder와 runtime/event closure는 episode의 key, Conflict kind와
participants, exact authored profile, Country/Faction identity, tick,
source-event ID를 검증한다. EventStore closure는 source ID가 동일 Conflict,
Country, Faction, tick의 기존 `REBELLION_STARTED` event를 정확히 가리키는지
확인한다. V7 및 이전 snapshot은 silent migration 없이 reject한다.

저장/복원 및 focused tests는 다음을 직접 확인했다.

- empty/profile-bound episode map roundtrip;
- source `REBELLION_STARTED` provenance roundtrip;
- V7 rejection;
- missing/malformed map, key, Conflict, profile, Country/Faction, tick, source
  event corruption rejection;
- uninterrupted versus save/load replay equality;
- episode map insertion-order canonicalization;
- resolved Conflict가 episode provenance를 보존하는 동작.

## Scope audit

다음 writer/producer는 추가하지 않았다.

```text
operational evidence writer: NONE
operational collapse writer: NONE
settlement runtime: NONE
LandHex persistence writer: NONE
Conflict outcome writer from persistence: NONE
T023 State Dissolution writer: NONE
autonomous persistence/evidence producer: NONE
```

bootstrap은 `LandHex.controller`, front, Region, Government, Conflict outcome,
RunOutcome, ActionRecord, operational channel state, score, timer, cooldown,
countdown, decay, RNG를 읽거나 쓰지 않는다. `NO_ACTIVE_FRONT_EDGE -> peace`,
zero-faction-LandHex defeat, settlement, Gate 1F PASS, V02, 다음 task
authorization도 추가하지 않았다.

## Files changed

- `src/sim/state/rebellionPersistence.ts`
- `src/sim/state/world.ts`
- `src/sim/systems/conflict.ts`
- `src/sim/core/invariants.ts`
- `src/sim/core/runtimeClosure.ts`
- `src/sim/core/persistence.ts`
- `src/sim/systems/rebellionPersistence.test.ts`
- V8 expectation updates in existing persistence/replay tests
- `docs/F05_FIX23_REBELLION_PERSISTENCE_RUNTIME_VERTICAL_SLICE.md`
- `docs/T024_PERSISTENCE_REPLAY_CHECK.md`
- `docs/ARCHITECTURE.md`
- `docs/bridge/results/F05_FIX23_RESULT.md`

## Verification

- focused F05_FIX23:
  `pnpm exec vitest run src/sim/systems/rebellionPersistence.test.ts`
  PASS; 1 file, 12 tests.
- final focused persistence regression rerun:
  `src/sim/systems/rebellionPersistence.test.ts`,
  `src/sim/state/rebellionPersistence.test.ts`,
  `src/sim/core/persistence.test.ts` PASS; 3 files, 72 tests.
- focused regression set:
  `src/sim/systems/rebellionPersistence.test.ts`,
  `src/sim/state/rebellionPersistence.test.ts`,
  `src/sim/systems/conflict.test.ts` PASS; 3 files, 58 tests.
- `pnpm run format`: PASS after final documentation formatting.
- `pnpm run typecheck`: PASS.
- `pnpm run lint`: PASS.
- `pnpm run build`: PASS; TypeScript and Vite production build completed.
- `pnpm test`: 63 files and 553 assertions PASS. The process exited 1 after
  all assertions because Vitest emitted the known three
  `[vitest-worker]: Timeout calling "onTaskUpdate"` unhandled runner errors.
  This is recorded as a runner/environment failure, not an assertion failure;
  no gameplay change was made to suppress it.
- `pnpm run inspect:t018`: PASS; detector authority and duplicate checks
  remained unchanged.
- `pnpm run inspect:t021`: PASS; same-tick detection has no occupation and
  LandHex remains the sole territorial writer.
- `pnpm run inspect:t024`: PASS; snapshot version 8, roundtrip, replay,
  derived-state, terminal, corruption, and ordering checks passed.
- `pnpm run inspect:f04b`: PASS; active-conflict recovery/insertion/save-load
  inspection passed.
- `pnpm run inspect:f05`: PASS; recommendation remained `NOT_READY`.
- `pnpm run inspect:f05fix9`: PASS; historical F05 baseline was `UNCHANGED`,
  implementation remained `NONE`, and recommendation remained `NOT_READY`.
- `git diff --check`: PASS.

The changed production paths contain no operational evidence/collapse writer,
settlement runtime, LandHex persistence writer, Conflict outcome writer from
persistence, T023 writer, or autonomous evidence producer. T018/T021/T022/T023
ownership and the historical F05/F05_FIX9 boundaries remain unchanged apart
from the deliberate V8 snapshot version and empty runtime map shape.

F05_FIX23: COMPLETE / AWAITING_CHATGPT_REVIEW
NEXT_AUTHORIZED_TASK_ID: NONE
GATE1F_CHATGPT_DECISION: NOT_READY
V02: NOT_STARTED
