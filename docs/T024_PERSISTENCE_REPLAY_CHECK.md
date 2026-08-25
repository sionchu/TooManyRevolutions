# T024 Persistence / Replay Check

**Status:** COMPLETE / PASS — 2026-08-22  
**Scope:** typed in-memory snapshot, restore validation, atomic EventStore commit,
and deterministic continuation. Gate 1V/UI/storage backend는 시작하지 않는다.

F05_FIX6 supersedes the V2 envelope with the V3 amendment at the end of this
document; the earlier V2 bullets remain the historical T024 baseline.

## Contract

- `SerializedSimulationSnapshotV2` stores `formatVersion`, scenario identity,
  mutable `WorldState` runtime, `RunState`/ActionRecord history, actual `rngState`,
  and sibling `EventStore` history.
- `ScenarioDefinition`, static TerritorialTopology/ContactGraph definitions,
  Region control summaries, fronts, Agenda/threat/pressure/regime read models,
  eligibility snapshots, and UI state are not stored.
- Load uses explicit decoding plus scenario identity and
  `assertScenarioRuntimeClosure()`, including
  `assertLandHexRuntimeStateInvariants()`. `Region.controller` is not recreated;
  `WorldState.landHexStates[*].controller` remains the physical authority.
- V2 closure requires exact runtime Country/Region/Faction/PolicyState identity
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

V2 has no dynamic Country/Region/Faction/PolicyState identity lifecycle. A
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
future work. F04D raised the format to version 2 so `politicalCompetition` is a
required validated rule; version 1 is rejected without a hidden default or migration.

## F05_FIX6 V3 amendment

F05_FIX6 adds authoritative `WorldState.politicalProposals`, so the snapshot
contract is now `SerializedSimulationSnapshotV3` / format version 3. V3 strictly
serializes and decodes proposal ID, proposer Faction, CountryId, captured target
GovernmentId, `interventionRequest` subject, requested InterventionId, lifecycle
status, created/resolved ticks, and opening/response ActionRecord/Event
provenance. Version 2 is rejected; no hidden migration or default proposal is
applied.

Runtime closure additionally checks that an opened proposal has a matching
scenario-authored template and accepted `LOBBY` ActionRecord, that resolved
proposals carry a later response, and that an accepted proposal's intervention
commitment points to the actual player response ActionRecord. Save/load replay
and object insertion-order checks cover open, rejected, and accepted states.

The proposal state is not an event-only read model. Its opening event alone does
not count as a pacing or downstream result; only the existing intervention
commitment/completion and typed state effects qualify as an ACCEPT consequence.

## F05_FIX18 V7 amendment

F05_FIX18 advances the authoritative snapshot contract to
`SerializedSimulationSnapshotV7` / format version 7. V7 adds only the sparse
`WorldState.coupCoordinationResponses` map and its strict action/event
provenance. The map is indexed by coup `ConflictId` and authored required-node
ID; absence is the uncommitted state, while the only stored alignments are
`incumbent` and `coup`.

The V7 decoder rejects V6 and older envelopes, missing response maps, unknown
or mismatched conflict/node keys, invalid alignments/ticks, duplicate decisive
responses, missing or incompatible `COUP_COORDINATION_RESPONSE` ActionRecords,
and missing or mismatched `COUP_COORDINATION_NODE_RESPONDED` events. T024
roundtrip and replay checks therefore cover empty, partial, and resolved coup
response state without serializing ScenarioDefinition authoring data or any
derived read model.

## F05_FIX23 V8 amendment

F05_FIX23 advances the authoritative snapshot contract to
`SerializedSimulationSnapshotV8` / format version 8. V8 adds only the
Conflict-scoped `WorldState.rebellionPersistenceEpisodes` bootstrap map. A
record is created only when T018 creates a new rebellion Conflict under an
exact authored Country/Faction `RebellionPersistenceProfile`, and it points to
the same existing `REBELLION_STARTED` event. The record is identity/provenance
only; it is not operational evidence, a capacity score, a collapse signal, a
settlement state, or a territorial/outcome writer.

The V8 decoder requires the episode map and rejects missing or malformed maps,
empty or mismatched IDs, non-rebellion or missing Conflicts, participant and
profile mismatches, invalid bootstrap ticks, and missing or mismatched
`REBELLION_STARTED` source events. V7 and older snapshots are rejected without
silent migration. T024 roundtrip/replay coverage now includes the empty and
populated episode maps, source-event provenance, corruption rejection, and
save/load deterministic replay.
