# F05_FIX17 — Coup Coordination Static Authoring Seam

## Scope

F05_FIX17 adds only the static scenario authoring boundary selected by
F05_FIX16. It does not resolve a coup, record alignment, produce a response
action, write a `ConflictOutcome`, mutate a `Government`, or persist any new
runtime state.

## Classification

```text
PRIMARY_CLASSIFICATION: COUP_COORDINATION_AUTHORING_SEAM_IMPLEMENTED
NEXT_IMPLEMENTATION_READINESS: COUP_COORDINATION_RUNTIME_VERTICAL_SLICE
```

The bounded domain remains a scenario-authored set of named decisive nodes.
Nodes are identities and presentation labels only. They are not military
units, ranks, command edges, communications, private beliefs, manpower,
loyalty values, or a reusable state-apparatus simulation.

## Static contract

`ScenarioDefinition` owns two optional collections:

```text
coupCoordinationNodes: CoupCoordinationNodeDefinition[]
coupCoordinationProfiles: CoupCoordinationProfile[]
```

The definitions are:

```text
CoupCoordinationNodeDefinition
  id: CoupCoordinationNodeId
  countryId: CountryId
  name: authoring/presentation label only

CoupCoordinationProfile
  countryId: CountryId
  coupFactionId: FactionId
  requiredNodeIds: non-empty, unique necessary-set CoupCoordinationNodeId[]
  successorGovernmentId: GovernmentId
```

`CoupCoordinationNodeId` is a branded static identity. The profile is unique
for one `(countryId, coupFactionId)` pair. Every required node must be authored,
must belong to the profile country, and the coup faction must belong to that
country. The successor Government must exist, belong to the same country, and
be different from the country's current initial Government.

`requiredNodeIds` is an explicit necessary set: order has no meaning and there
is no majority, quorum, weight, score, timer, or countdown interpretation.

Validation rejects empty node IDs, duplicate nodes, unknown node countries,
blank node labels, missing factions/countries/nodes/Governments, factions
without the authored `coup` capability, duplicate profiles, empty required
sets, duplicate required IDs, cross-country node references, cross-country
factions, and cross-country or current successor Governments.

The validator never sorts or mutates authored input. Node/profile insertion
order and required-node array order therefore do not change the authored
meaning or the initial runtime state.

## Runtime and persistence boundary

The authoring fields stay on `ScenarioDefinition`. `WorldState` receives no
node, profile, alignment, response, outcome, timer, cooldown, countdown, or
coordination score field. No `ActionRecord`, `GameEvent`, Government-transition
producer, T018/T021/T022/T023 logic, or `SerializedSimulationSnapshotV6`
schema was changed.

No production scenario content was added. The focused fixture exists only in
the test file to exercise the static boundary.

## Implementation files

- `src/sim/state/ids.ts` — `CoupCoordinationNodeId` and constructor.
- `src/sim/state/coupCoordination.ts` — static node/profile interfaces.
- `src/sim/state/scenario.ts` — ScenarioDefinition fields and validation.
- `src/sim/state/coupCoordination.test.ts` — focused authoring and boundary tests.
- `src/sim/index.ts` — public static-domain export.

F05_FIX18, Gate 1F PASS, and V02 remain outside this task.
