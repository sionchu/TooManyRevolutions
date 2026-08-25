# F05_FIX23 Rebellion Persistence Runtime Vertical Slice

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

## Purpose

F05_FIX23 adds the smallest authoritative runtime slice after the accepted
FIX22 static authoring seam:

```text
T018 creates a new rebellion Conflict
  + one exact Country/Faction RebellionPersistenceProfile
  + the existing REBELLION_STARTED event
  -> one Conflict-scoped bootstrap episode
  -> strict V8 save/load and replay closure
```

The episode is identity and provenance only. Its presence does not assert that
any operational channel currently exists, that the rebellion remains capable,
or that the Conflict should continue or resolve.

## Runtime contract

`src/sim/state/rebellionPersistence.ts` now owns the runtime type:

```ts
interface RebellionOperationalPersistenceEpisode {
  readonly conflictId: ConflictId;
  readonly profileId: RebellionPersistenceProfileId;
  readonly countryId: CountryId;
  readonly factionId: FactionId;
  readonly bootstrappedAtTick: number;
  readonly sourceEventId: EventId;
}
```

`WorldState.rebellionPersistenceEpisodes` is a deterministic record keyed by
`ConflictId`. `createInitialWorldState()` deliberately initializes it to `{}`.
FIX22 ScenarioDefinition channel/profile authoring is never copied into this
runtime map. An authored initial active rebellion also starts with `{}` because
it has no T018 creation event from which to fabricate provenance.

## Bootstrap owner and atomicity

The existing T018 writer in `src/sim/systems/conflict.ts` remains the only
rebellion-creation owner. After it creates a new rebellion Conflict, it finds
the exact Country/Faction profile. An ambiguous untrusted profile set throws;
array order is never used as a selection rule. A missing profile preserves the
previous T018 behavior and creates no episode.

The episode is created from the same `GameEvent` object that is emitted as
`REBELLION_STARTED`:

- `sourceEventId` is that event's deterministic ID;
- `bootstrappedAtTick` is that event's tick;
- Country/Faction identity comes from the Conflict candidate and event actor/
  target contract;
- no second rebellion-start event is emitted.

Conflict insertion, the existing start event, and the episode are returned in
one immutable `SimulationStepResult`. Repeated eligibility is still handled by
the existing active-Conflict deduplication, so it cannot create a second
Conflict, episode, or start event.

The episode does not write `LandHex.controller`, front state, `Conflict.outcome`,
Government state, `ActionRecord`, or any operational evidence/collapse state.
Existing suppression may resolve a rebellion while retaining the episode as
historical provenance.

## Runtime and event closure

`assertScenarioRuntimeClosure()` and its incremental continuation path verify
for every episode:

- the record key equals `episode.conflictId`;
- the Conflict exists and is a rebellion;
- Country/Faction participate in that Conflict;
- the profile exists and exactly matches profile/Country/Faction identity;
- the tick is a non-negative tick no later than the current WorldState tick;
- the source event identity is non-empty.

The V8 EventStore closure additionally requires exactly one existing
`REBELLION_STARTED` event matching the episode's source ID, tick, actor Faction,
target Country, and existing payload fields (`conflictId`, `kind`, `countryId`,
`factionId`). It does not require or invent an operational evidence event.

## V8 persistence

The authoritative snapshot is now:

```text
SerializedSimulationSnapshotV8
SerializedWorldStateV8
SIMULATION_SNAPSHOT_FORMAT_VERSION = 8
```

V8 serializes and canonicalizes `rebellionPersistenceEpisodes`. Its decoder
requires the map and rejects malformed maps, empty IDs, key/episode identity
mismatches, missing/non-rebellion Conflicts, participant mismatches, missing or
mismatched profiles, invalid ticks, and missing/mismatched
`REBELLION_STARTED` provenance. Format 7 and older snapshots are rejected;
there is no silent migration.

The focused suite covers empty and populated round trips, source-event
provenance, V7 rejection, corruption rejection, insertion-order canonical
serialization, uninterrupted versus save/load replay equality, duplicate T018
eligibility, initial-rebellion behavior, coup exclusion, suppression retention,
and absence of territorial/outcome/evidence writers.

## Explicit boundary audit

The implementation contains none of the following:

- operational evidence or collapse ActionRecord/GameEvent writer;
- settlement, demobilization, or suppression domain runtime;
- LandHex persistence writer;
- Conflict outcome or Government transition writer;
- T023 State Dissolution writer;
- autonomous persistence/evidence producer;
- scalar strength, readiness, score, timer, countdown, cooldown, or decay;
- front, Region, LandHex, RNG, or elapsed-time inference;
- `NO_ACTIVE_FRONT_EDGE -> peace` or zero-LandHex defeat semantics;
- F05_FIX24, Gate 1F PASS, or V02 authorization.

F05_FIX23: COMPLETE / AWAITING_CHATGPT_REVIEW
NEXT_AUTHORIZED_TASK_ID: NONE
GATE1F_CHATGPT_DECISION: NOT_READY
V02: NOT_STARTED
