# F05_FIX18 — Coup Coordination Runtime Vertical Slice

TASK_ID: `F05_FIX18`
STATUS: `AUTHORIZED`
BASE_IMPLEMENTATION_HEAD: `5863d46563b1d7ed6dc5d65a40e1965817662707`
BASE_IMPLEMENTATION_BRANCH: `f05-fix17-review`
REVIEW_BRANCH: `f05-fix18-review`
RESULT_PATH: `docs/bridge/results/F05_FIX18_RESULT.md`

## 0. Accepted predecessor

F05_FIX17 is independently reviewed and accepted:

```text
PRIMARY_CLASSIFICATION: COUP_COORDINATION_AUTHORING_SEAM_IMPLEMENTED
AUTHORING_SCOPE: STATIC_SCENARIO_ONLY
REQUIRED_SET_SEMANTIC: AUTHORED_NECESSARY_SET
INITIAL_ALIGNMENT_AUTHORED: NO
RUNTIME_ALIGNMENT_STATE: NO
RUNTIME_ACTION_SCHEMA_CHANGE: NO
COUP_OUTCOME_WRITER: NO
PERSISTENCE_FORMAT: V6_UNCHANGED
NEXT_IMPLEMENTATION_READINESS: COUP_COORDINATION_RUNTIME_VERTICAL_SLICE
```

The implementation base is the reviewed FIX17 head above. Do not recreate or replace FIX17.

## 1. Mission

Implement the smallest deterministic runtime vertical slice that makes the accepted coup-coordination semantics executable **when explicit node responses are supplied**:

```text
active coup Conflict
+ scenario-owned CoupCoordinationProfile
+ explicit COUP_COORDINATION_RESPONSE ActionRecord
-> sparse decisive response state
-> deterministic response GameEvent provenance
-> authored necessary-set evaluation
-> existing applyConflictOutcome() sink
-> statusQuo OR nonterminal governmentTransition OR remain active
-> strict persistence V7 / replay closure
```

This task does **not** implement an autonomous response producer and makes no Gate 1F pacing-improvement claim.

## 2. Runtime state

Add only sparse authoritative decisive responses. Semantics equivalent to:

```ts
type CoupCoordinationAlignment = "incumbent" | "coup";

interface CoupCoordinationResponseState {
  readonly conflictId: ConflictId;
  readonly nodeId: CoupCoordinationNodeId;
  readonly alignment: CoupCoordinationAlignment;
  readonly actionId: ActionId;
  readonly eventId: EventId;
  readonly respondedAtTick: number;
}
```

Store responses by coup Conflict and node in `WorldState` using a deterministic record/map shape consistent with the repository.

`uncommitted` is **not stored**. It means only that a required node has no accepted decisive response for that Conflict.

Do not copy node names, profile weights, ranks, military units, command hierarchy, or any generic state-apparatus model into WorldState.

## 3. Typed action

Add exactly one new bounded action:

```text
COUP_COORDINATION_RESPONSE
schemaVersion: 1
payload: {
  conflictId: ConflictId,
  nodeId: CoupCoordinationNodeId,
  alignment: "incumbent" | "coup"
}
```

Decoder requirements:

- exact payload keys only;
- reject extra/missing keys;
- reject empty IDs;
- reject unsupported schema version;
- reject any alignment outside `incumbent | coup`;
- `uncommitted` cannot be submitted.

This accepted ActionRecord is the **only** alignment writer in FIX18. `ActionRecord.source` is provenance and must not replace `nodeId` as the coordination actor identity.

## 4. Runtime validation and atomicity

Before mutating coup-response state, deterministically reject/no-op with repository-consistent rejection evidence when at minimum:

1. payload/schema is invalid;
2. Conflict is missing;
3. Conflict is resolved;
4. Conflict kind is not `coup`;
5. no unique authored FIX17 profile matches the coup Conflict's participating Country/Faction identity;
6. node is not in that profile's `requiredNodeIds`;
7. the same node already has a decisive response for this Conflict, regardless of alignment;
8. profile/node references are inconsistent with scenario authoring;
9. a final all-`coup` response would transition to a successor Government that is missing, foreign-country, or equal to the Country's **current** Government at resolution time.

The response writer must be atomic. In particular, a final all-`coup` response whose successor is stale must not partially record the response and then fail the outcome transition.

Do not auto-retarget a stale successor Government and do not invent a replacement Government.

If a coup Conflict has multiple candidate Country/Faction combinations and more than one profile could match, reject as ambiguous rather than choosing by order or heuristic.

## 5. Response event and provenance

Each successfully applied decisive response emits exactly one deterministic event, naming consistent with:

```text
COUP_COORDINATION_NODE_RESPONDED
```

It must expose stable provenance sufficient to recover:

```text
conflictId
nodeId
alignment
actionId
```

The authoritative response state stores the accepted ActionRecord id, response event id, and response tick.

No response may exist without a corresponding accepted ActionRecord and response GameEvent.

## 6. Outcome rule

After each successfully applied response, evaluate only the authored necessary set:

```text
ANY required node explicitly incumbent
  => statusQuo

ELSE IF ALL required nodes explicitly coup
  => governmentTransition to authored successorGovernmentId

ELSE
  => Conflict remains active
```

Properties:

- required-node order has no semantics;
- no majority/quorum/weight/score;
- one `incumbent` response is decisive;
- partial `coup` responses remain active;
- all `coup` responses resolve only after runtime successor freshness validation;
- later responses to a resolved Conflict reject/no-op;
- same-tick multiple actions obey global ActionRecord sequence order.

Use the existing `applyConflictOutcome()` path for both `statusQuo` and `governmentTransition`.

Do not directly mutate `Country.currentGovernmentId` in the new coup code.

For `governmentTransition`:

- CountryId continuity is preserved;
- use the authored same-Country successor Government;
- use the coup Faction as winner if the existing sink requires a winner;
- transition remains nonterminal.

For `statusQuo`:

- use existing typed outcome semantics;
- no continuity damage/restoration;
- no territorial mutation.

Outcome event causal provenance must include the accepted response-event evidence in deterministic order consistent with the existing `causeIds` contract.

## 7. Simulation integration

Process `COUP_COORDINATION_RESPONSE` in the existing validated-action resolution phase.

Preserve sequence sensitivity across policy/intervention/political-proposal/coup-response actions in the same tick. Do not add a second mutation path outside the simulation pipeline.

A focused coup-response resolver module is allowed. Avoid unrelated dispatcher refactors.

Do not make T018 create node responses. Do not make T021 territorial conflict resolution handle coups.

## 8. Persistence V7

Because new authoritative runtime state is added, advance persistence exactly one version:

```text
SIMULATION_SNAPSHOT_FORMAT_VERSION: 7
SerializedSimulationSnapshotV7
SerializedWorldStateV7
```

V7 must serialize/deserialize the coup response state and preserve deterministic provenance/replay.

Strict closure must reject at minimum:

- response references missing Conflict;
- referenced Conflict is not a coup or does not match a unique authored profile;
- unknown/non-required/foreign node;
- map keys disagree with record IDs;
- invalid alignment;
- invalid response tick;
- missing/mismatched ActionRecord;
- ActionRecord is not exactly a compatible `COUP_COORDINATION_RESPONSE` for the same conflict/node/alignment;
- missing/mismatched response GameEvent;
- GameEvent provenance does not match the ActionRecord/response state;
- duplicate decisive responses;
- malformed/unknown IDs.

Do not fabricate missing V7 fields. Do not silently coerce V6 into V7. If there is no explicit migration framework, strict rejection of older format is preferred to implicit upgrade.

Update T024/persistence/replay coverage accordingly.

## 9. Explicit response-source boundary

FIX18 must **not** add an autonomous node-response producer.

Do not infer node responses from:

- random rolls;
- elapsed time / timer / countdown / cooldown;
- militaryPower, stateCapacity, legitimacy, instability;
- faction organization/resources/influence/grievance/currentStrategy;
- ideology similarity;
- Government classification;
- Agenda severity;
- Region stateControl;
- LandHex control;
- node names/labels;
- hidden scripts/story schedules;
- LLM direct authoritative mutation.

Focused tests may submit explicit response ActionRecords. Production historical scenarios must not receive fabricated responses merely to improve Gate 1F pacing.

## 10. Required focused tests

Cover at minimum:

1. exact valid response schema;
2. missing/extra payload keys rejected;
3. `uncommitted` rejected;
4. missing Conflict rejected/no-op;
5. resolved Conflict rejected/no-op;
6. non-coup Conflict rejected/no-op;
7. missing/ambiguous profile rejected/no-op;
8. non-required node rejected/no-op;
9. duplicate same-alignment response rejected/no-op;
10. duplicate opposite-alignment response rejected/no-op;
11. partial `coup` response persists and Conflict remains active;
12. all required `coup` responses resolve through `applyConflictOutcome()` to authored governmentTransition;
13. one `incumbent` response resolves through `applyConflictOutcome()` to statusQuo;
14. Government transition preserves CountryId continuity;
15. status quo preserves CountryId continuity;
16. no coup response changes LandHex controller;
17. stale successor is rechecked atomically and does not auto-retarget;
18. required-node insertion order is semantically irrelevant;
19. same-tick response ordering is deterministic;
20. ActionRecord -> response event -> response state provenance is exact;
21. V7 roundtrip preserves partial response state;
22. V7 roundtrip/replay preserves resolved coup provenance;
23. corrupted node/action/event/payload references reject;
24. save/load/replay determinism passes;
25. scenarios without coup authoring remain behaviorally unchanged apart from deliberate empty V7 response state/snapshot shape;
26. historical F05/F05_FIX9/F05_FIX14 measurements remain unchanged;
27. no autonomous response producer exists in production code.

Use synthetic focused fixtures only.

## 11. Forbidden scope

- no generic military/state-apparatus actor framework;
- no officers, units, ranks, hierarchy, manpower, communications graph;
- no loyalty/coordination/support/inevitability/progress numeric score;
- no random coup resolution;
- no timer/countdown/cooldown;
- no majority/quorum/weighted threshold;
- no alignment inference from existing scalars/labels/strategy/Agenda/territory;
- no fake coup LandHex front/writer;
- no State Dissolution from coup;
- no `0 LandHex -> defeat/dissolution`;
- no Government transition continuity damage/restoration;
- no rebellion settlement/persistence implementation;
- no FUND_MOVEMENT extension;
- no production historical node responses;
- no V02/UI work;
- no Gate 1F PASS declaration;
- no F05_FIX19 self-authorization.

## 12. Verification

Run at minimum:

```text
format
typecheck
lint
build
focused F05_FIX18 tests
full tests
inspect:t018
inspect:t024
inspect:f05
inspect:f05fix9
inspect:f05fix14
git diff --check
```

Report the known Vitest `onTaskUpdate` runner/IPC error separately if it occurs after assertions pass. Do not change gameplay to suppress it.

Before completion explicitly audit:

```text
LandHex coup writer: NONE
random/timer/score alignment writer: NONE
autonomous response producer: NONE
direct Government mutation outside existing outcome sink: NONE
T023 coup dissolution writer: NONE
```

## 13. Exact outcome

Select exactly one:

```text
COUP_COORDINATION_RUNTIME_VERTICAL_SLICE_IMPLEMENTED
COUP_COORDINATION_RUNTIME_VERTICAL_SLICE_REJECTED
```

If implemented, result must include:

```text
PRIMARY_CLASSIFICATION: COUP_COORDINATION_RUNTIME_VERTICAL_SLICE_IMPLEMENTED
RUNTIME_STATE: SPARSE_DECISIVE_NODE_RESPONSES_BY_COUP_CONFLICT
UNCOMMITTED_SEMANTIC: ABSENCE_OF_ACCEPTED_DECISIVE_RESPONSE
ACTION_TYPE: COUP_COORDINATION_RESPONSE
DECISIVE_ALIGNMENTS: incumbent | coup
REQUIRED_SET_SEMANTIC: AUTHORED_NECESSARY_SET
OUTCOME_RULE: ANY_INCUMBENT_STATUS_QUO__ALL_COUP_GOVERNMENT_TRANSITION__ELSE_ACTIVE
OUTCOME_SINK: EXISTING_APPLY_CONFLICT_OUTCOME
DIRECT_GOVERNMENT_WRITER: NO
TERRITORIAL_COUP_WRITER: NO
AUTONOMOUS_RESPONSE_PRODUCER: NO
PERSISTENCE_FORMAT: V7
LATE_STATE_IMPROVEMENT_CLAIMED: NO
GATE1F: NOT_READY
V02: NOT_STARTED
NEXT_IMPLEMENTATION_READINESS: COUP_COORDINATION_RESPONSE_SOURCE_GROUNDING
```

If rejected:

```text
PRIMARY_CLASSIFICATION: COUP_COORDINATION_RUNTIME_VERTICAL_SLICE_REJECTED
REJECTION_REASON: <specific architecture blocker>
GATE1F: NOT_READY
V02: NOT_STARTED
NEXT_IMPLEMENTATION_READINESS: PIVOT_TO_REBELLION_PERSISTENCE_GROUNDING
```

No third outcome.

## 14. Documents and publication

Create/update:

- `docs/F05_FIX18_COUP_COORDINATION_RUNTIME_VERTICAL_SLICE.md`
- `docs/bridge/results/F05_FIX18_RESULT.md`

Implement from reviewed head `5863d46563b1d7ed6dc5d65a40e1965817662707` and publish the completed implementation/result to `f05-fix18-review` for ChatGPT review.

Do not merge master Bridge metadata into the implementation branch merely to consume task prose. Normal Git remote use is allowed. Do not reset/rebase/force or discard the reviewed FIX17 history.

Completion marker:

```text
F05_FIX18: COMPLETE / AWAITING_CHATGPT_REVIEW
NEXT_AUTHORIZED_TASK_ID: NONE
GATE1F_CHATGPT_DECISION: NOT_READY
V02: NOT_STARTED
```
