# T024 Persistence / Replay Check

**Status:** COMPLETE / PASS — 2026-08-22  
**Scope:** typed in-memory snapshot, restore validation, atomic EventStore commit,
and deterministic continuation. Gate 1V/UI/storage backend는 시작하지 않는다.

## Contract

- `SerializedSimulationSnapshotV1` stores `formatVersion`, scenario identity,
  mutable `WorldState` runtime, `RunState`/ActionRecord history, actual `rngState`,
  and sibling `EventStore` history.
- `ScenarioDefinition`, static TerritorialTopology/ContactGraph definitions,
  Region control summaries, fronts, Agenda/threat/pressure/regime read models,
  eligibility snapshots, and UI state are not stored.
- Load uses explicit decoding plus scenario identity and
  `assertScenarioRuntimeClosure()`, including
  `assertLandHexRuntimeStateInvariants()`. `Region.controller` is not recreated;
  `WorldState.landHexStates[*].controller` remains the physical authority.
- V1 closure requires exact runtime Country/Region/Faction/PolicyState identity
  sets, complete Region ideology catalog coverage, catalog-valid PolicyState and
  Faction ideology references, valid Government/Conflict outcome references, and
  static LandHex → runtime Region membership.
- `ActionRecord` IDs are recomputed from their tick/sequence/source/actionType and
  duplicate IDs are rejected. Intervention commitments must point to an accepted
  `START_INTERVENTION` ActionRecord with matching deterministic commitment ID,
  country, tick, and catalog intervention.
- Event IDs/sequences/causes and `RunOutcome.causeEventId` are preserved and
  validated. `nextEventSequence` continues from the existing history.
- Replay equivalence is same scenario version + same validated snapshot + same
  subsequent inputs producing the same authoritative state, RNG, EventStore, IDs,
  sequences, causes, and terminal outcome.

## Automated evidence

`src/sim/core/persistence.test.ts` covers:

- JSON roundtrip, canonical collection insertion order, no aliasing, and no static/
  derived/Region.controller fields;
- full EventStore history validation, next sequence, missing/forward causes, and
  broken terminal outcome cause rejection; a JSON-safe two-boundary roundtrip
  preserves pre-save E100, post-load E101, their exact cause relation, IDs,
  sequence order, and the EventStore cursor, without inventing cross-tick causes
  inside gameplay phases;
- uninterrupted 120 ticks vs 40 → save/load → 80 and multiple save boundaries;
- missing/unknown Country, Region, Faction, ideology, PolicyState, and static
  LandHex Region references;
- forged/duplicate ActionRecord IDs, dangling/rejected/forged/mismatched/unknown
  intervention commitment provenance, and invalid Conflict outcome references;
- nonzero RNG cursor continuation, invalid live-state serialization, and atomic
  rejection of an invalid next state at `commitSimulationStep()`;
- T022 consolidation progress and won terminal no-op;
- T023 state-continuity defeat, terminal no-op, occupation-only non-defeat;
- T021 active conflict/multi-Hex state and T019/T020 mutable contact runtime;
- active T021 rebellion saved after detection and resumed through the next weekly
  LandHex resolution;
- wrong scenario, missing/unknown LandHex, and invalid Government references.

`src/sim/inspection/t024PersistenceReplayInspection.test.ts` exposes the same
checkpoint through `pnpm run inspect:t024`, including derived selector equivalence
for Region control, front, foreign ideological threat, consolidation, and
dissolution.

## Determinism correction

The authoritative `localeCompare` paths in `src/sim/systems/economy.ts` and
`src/sim/systems/resources.ts` were replaced with locale-independent textual
comparison. The inspection now reports the ordering audit as covered by source
audit/tests rather than claiming a runtime numeric scan. No balance constants or
gameplay formulas changed.

V1 has no dynamic Country/Region/Faction/PolicyState identity lifecycle. A
ScenarioDefinition content change that is not compatible with a saved runtime must
bump `scenario.version`; no content hash or migration framework is introduced here.

## Performance debt / F01A resolution

F01에서 측정된 `commitSimulationStep()` 전체 history 재검증 누적 비용(O(ticks²))은
F01A에서 canonical in-process continuation incremental validation으로 해소했다.
새 Event/Action/Commitment delta와 candidate closure만 continuation에서 검사하며,
serialize/deserialize와 corrupt snapshot trust boundary의 full validation은
그대로 유지한다. Gate 1V의 20–40 simulated year timelapse benchmark는 계속
수행하고, 이후 residual bottleneck이 새로 관찰될 때만 별도 측정 task를 연다.

## Verification

- `pnpm test` — PASS
- `pnpm run typecheck` — PASS
- `pnpm run lint` — PASS
- `pnpm run format` — PASS
- `pnpm run build` — PASS
- `pnpm run inspect:t021` — PASS
- `pnpm run inspect:t022` — PASS
- `pnpm run inspect:t023` — PASS
- `pnpm run inspect:t024` — PASS

## Deferred

Save UI, localStorage/IndexedDB/cloud persistence, compression, migration chains,
rewind/branching/multiplayer replay, replay viewer, full event-sourced rebuild,
content hashing, dynamic entity lifecycle, Gate 1V visualization, and UI remain
future work. The Terra trust-boundary review fixes are complete for this V1 scope.
