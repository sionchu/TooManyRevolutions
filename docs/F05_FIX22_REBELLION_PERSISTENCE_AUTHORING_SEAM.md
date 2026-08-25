# F05_FIX22 Rebellion Persistence Authoring Seam

TASK_ID: F05_FIX22
STATUS: COMPLETE / AWAITING_CHATGPT_REVIEW
BASE_IMPLEMENTATION_HEAD: 79046aa292e22ff7afb0289f8d7895ba38d8a8ab
BASE_IMPLEMENTATION_BRANCH: f05-fix21-review
REVIEW_BRANCH: f05-fix22-review

PRIMARY_CLASSIFICATION: REBELLION_PERSISTENCE_AUTHORING_SEAM_IMPLEMENTED
AUTHORING_SCOPE: STATIC_SCENARIO_ONLY
CHANNEL_KINDS: organizationalContinuity | commandContinuity | logisticsAccess | externalSupport
PROFILE_IDENTITY: COUNTRY_AND_FACTION
CHANNELS_ARE_CURRENT_EVIDENCE: NO
PROFILE_IS_SCORE_OR_THRESHOLD: NO
RUNTIME_PERSISTENCE_EPISODE: NOT_IMPLEMENTED
RUNTIME_EVIDENCE: NOT_IMPLEMENTED
SETTLEMENT_DOMAIN: NOT_IMPLEMENTED
T018_T021_T022_T023: UNCHANGED
PERSISTENCE_FORMAT: V7_UNCHANGED
GATE1F: NOT_READY
V02: NOT_STARTED
NEXT_IMPLEMENTATION_READINESS: REBELLION_PERSISTENCE_RUNTIME_VERTICAL_SLICE

## Scope

F05_FIX22 implements the smallest static, scenario-owned Rebellion
Persistence authoring seam accepted by F05_FIX21:

    ScenarioDefinition channel/profile authoring
      -> strict static validation
      -> future evidence allow-list only

The seam does not create a persistence episode, operational evidence,
collapse evidence, settlement state, ActionRecord/GameEvent writer, Conflict
outcome, LandHex effect, or persistence snapshot field.

## Static contract

The new state module is:

    src/sim/state/rebellionPersistence.ts

It owns the closed vocabulary:

    organizationalContinuity
    commandContinuity
    logisticsAccess
    externalSupport

It also owns:

    RebellionOperationalChannelDefinition {
      id
      countryId
      kind
      name
    }

    RebellionPersistenceProfile {
      id
      countryId
      factionId
      channelIds
    }

The IDs are branded in src/sim/state/ids.ts:

- RebellionOperationalChannelId
- RebellionPersistenceProfileId

ScenarioDefinition has two optional fields:

    rebellionOperationalChannels?
    rebellionPersistenceProfiles?

The fields are static metadata. A channel is an allow-listed future evidence
contract, not current evidence. A profile is a Country/Faction-scoped list,
not a required quorum, weighted set, majority, score, threshold, readiness
value, or pre-authored outcome. The channel name is authoring/presentation
text only and is not used as a simulation branch key.

## Validation boundary

assertScenarioRebellionPersistenceAuthoring() is integrated into
assertScenarioDefinition(). It validates:

- non-empty and unique channel IDs;
- existing channel Countries;
- the closed four-kind vocabulary;
- non-empty channel names;
- non-empty and unique profile IDs;
- existing profile Countries and Factions;
- Faction/Country ownership;
- the existing authored rebellion political-crisis capability;
- exact Country/Faction profile uniqueness;
- non-empty channel membership;
- unique channel references;
- known channel references;
- channel/profile Country ownership.

The Country/Faction uniqueness check uses a nested CountryId to FactionId
set. It does not construct a delimiter-joined string key, so delimiter-like
identities remain distinct.

Absent fields and explicitly empty arrays are accepted. No profile is inferred
from Faction organization, resources, grievance, currentStrategy, Region
state, LandHex control, fronts, Agenda, ideology, or any other runtime value.

## Preservation and writer audit

The optional fields are never copied into WorldState. createInitialWorldState()
does not gain a rebellion persistence episode, evidence collection, action
record, or event record. The following remain unchanged:

- T018 rebellion creation and suppressIneligibleRebellions();
- T021 territorial intents, derived fronts, and LandHex.controller authority;
- T022 Order Consolidation;
- T023 State Dissolution;
- Conflict status and outcome writers;
- settlement, demobilization, and suppression runtime;
- ActionRecord and GameEvent schemas;
- SerializedSimulationSnapshotV7 and format version 7.

No no-front peace rule, zero-LandHex defeat rule, scalar inference, hidden
threshold, random result, timer, countdown, cooldown, automatic decay, or
free LandHex writer was added.

## Focused test coverage

The focused suite is:

    src/sim/state/rebellionPersistence.test.ts

It contains 25 passing tests covering:

1. valid authoring;
2. all four channel kinds;
3. absent authoring;
4. empty authoring arrays;
5. absent/empty initial WorldState equality;
6. empty channel ID;
7. duplicate channel ID;
8. unknown channel Country;
9. unsupported channel kind;
10. blank channel name;
11. empty profile ID;
12. duplicate profile ID;
13. unknown profile Country;
14. unknown profile Faction;
15. Faction/Country mismatch;
16. missing rebellion capability;
17. duplicate exact Country/Faction pair;
18. delimiter-collision lookalike pairs;
19. empty channel set;
20. duplicate channel reference;
21. unknown channel reference;
22. foreign-Country channel reference;
23. insertion-order determinism;
24. absence of runtime persistence/evidence/action/event state;
25. historical no-authoring T018/T021/F05 initial behavior preservation.

The fixtures are synthetic or existing historical validation fixtures. No
production scenario persistence channel/profile content was added.

## Next boundary

The successful next readiness is
REBELLION_PERSISTENCE_RUNTIME_VERTICAL_SLICE. That is not started by FIX22.
A later authorized task may decide how a validated static profile is attached to
a Conflict-scoped runtime episode and how explicit ActionRecord/GameEvent
provenance is produced. That future work must preserve the separate settlement
domain and V7 persistence boundary until an explicit persistence decision is
authorized.

F05_FIX22: COMPLETE / AWAITING_CHATGPT_REVIEW
NEXT_AUTHORIZED_TASK_ID: NONE
GATE1F_CHATGPT_DECISION: NOT_READY
V02: NOT_STARTED
