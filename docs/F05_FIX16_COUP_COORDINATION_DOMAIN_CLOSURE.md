# F05_FIX16 — Coup Coordination Domain Closure

## Decision

```text
TASK_ID: F05_FIX16
STATUS: COMPLETE / AWAITING_CHATGPT_REVIEW
PRIMARY_CLASSIFICATION: COUP_COORDINATION_MINIMAL_DOMAIN_DESIGNABLE
NEXT_IMPLEMENTATION_READINESS: COUP_COORDINATION_AUTHORING_SEAM
PRODUCTION_CONFLICT_GAMEPLAY: NONE
PERSISTENCE: SerializedSimulationSnapshotV6 / format version 6 unchanged in this task
GATE1F: NOT_READY
V02: NOT_STARTED
F05_FIX17: NOT_AUTHORIZED
```

F05_FIX16 closes the coup branch as a bounded design. The smallest honest
slice is a scenario-authored set of named, decisive `CoupCoordinationNode`
groupings for one coup attempt. Each node records only an observable
current alignment for that attempt. It does not represent a tactical unit,
rank, command tree, force size, private belief, communications network, or
enduring loyalty.

This is a design closure, not an implementation. No `WorldState`,
`Conflict`, `Government`, `Faction`, `ActionRecord`, event vocabulary,
T018/T021/T022/T023 logic, scenario production content, or persistence code
was changed by F05_FIX16.

## Repository-grounded blocker

The current TMR state separates the coup mechanism from territorial conflict:

- `ScenarioDefinition.factionCapabilities` can declare a coup capability, and
  T018 derives a pure `CoupPrerequisiteSnapshot` from capability, central
  Government validity, Faction grievance/organization/influence/resources, and
  derived state weakness.
- `Faction` is one political actor with one `countryId`; it has no set of
  state-apparatus alignments. `currentStrategy` and `supportCoup` are not
  coordination evidence.
- `Government` identifies the current or contender authority for a Country. It
  is the target and result identity, not the set of separate actors whose
  responses decide a coup.
- T021's `deriveOneConflictIntent()` returns `null` for `coup` by design. A
  coup therefore must not receive a fake LandHex front or a territorial writer.
- `applyConflictOutcome()` already accepts an explicit typed
  `statusQuo`/`governmentTransition` result. It is a result sink and validates
  an existing same-Country target Government; it does not choose a coup
  outcome or provide coordination provenance.
- The current action/event boundary has an append-only `ActionRecord`, ordered
  `EventStore`, and deterministic IDs, but no typed coup coordination action
  or alignment state. The current V6 snapshot has no such runtime field.

The representative F05_FIX9 replay remains the relevant late-state test:

```text
scenario: gate1f.f05.fix7.political-interaction
seed: 40103
horizon: 1800 days
late state-grounded reassessment silence: 1200 days
post-intervention late silence: 1110 days
country-controlled LandHexes: 0
active conflicts: rebellion + coup
rebellion: NO_ACTIVE_FRONT_EDGE
coup: COUP_HAS_NO_TERRITORIAL_WRITER
current Government: valid
run outcome: active
```

At the EARLY `t=870` and NEAR_CRISIS `t=330` freezes, T018 still has a
political eligibility read model, but no node alignment, response event, or
seizure evidence exists. This design does not reinterpret that replay as
already resolved and does not claim a current Gate 1F improvement.

## Fixed grounding boundary

The external grounding is the immutable R01–R04 pack in
`docs/bridge/tasks/F05_FIX16.md` §3. The pack supports the following narrow
interpretation:

- coup outcomes are about coordination among intra-military/state actors,
  including what actors expect other actors to do, rather than a conventional
  territorial battle or a popularity score (R01, R02);
- coup is a distinct seizure-of-power mechanism and must not be collapsed into
  rebellion/civil-war territorial mechanics (R03);
- acquiescence to avoid internecine fighting is a coordination illustration,
  not a universal scenario rule (R04).

The pack does not authorize a formula from `militaryPower`, `stateCapacity`,
legitimacy, instability, Faction values, LandHex count, a random roll, or a
generic majority threshold. The design below treats source claims as
grounding for the mechanism and treats the finite authored contract as a TMR
design recommendation, not as a universal historical law.

## Actor-domain audit

| Candidate | What it can represent now | Why it is or is not the coup coordination actor |
| --- | --- | --- |
| Reuse `Faction` | Coup initiator identity, Country ownership, political resources, and the existing T018 attempt boundary. | **Reject as the coordination actor.** One Faction cannot represent several decisive state-apparatus responses. Reusing it would turn one political actor into an implicit military unit and would make unrelated Factions look like military actors. |
| Reuse `Government` | Incumbent central authority, contender/exile authority labels, and the existing successor target used by `governmentTransition`. | **Reject as the coordination actor.** Government is the authority being retained or replaced. Its identity does not encode separate response decisions by the actors whose coordination determines seizure. |
| Narrow coup-only coordination nodes | A finite scenario-authored identity set, each with stable ID and Country ownership, attached only to a declared coup profile. | **Select.** Nodes are named decisive groupings for an attempt, not units or a reusable armed apparatus. They carry no strength, rank, hierarchy, manpower, communications, or loyalty scalar. |
| Broader state-apparatus/military actor domain | Ranks, command relationships, force units, communications topology, private beliefs, loyalty networks, or reusable military identities. | **Not required for the bounded slice.** If a future implementation needs any of those to decide an unobserved response, it must leave that case unresolved rather than silently expanding this domain. |

### Minimum static authoring contract

The next implementation task may add a static scenario contract with this
finite shape; F05_FIX16 does not add it:

```text
CoupCoordinationNodeDefinition
  id: stable CoupCoordinationNodeId
  countryId: CountryId
  name: authoring/presentation label only

CoupCoordinationProfile
  countryId: CountryId
  coupFactionId: FactionId
  requiredNodeIds: non-empty, unique, stable-sorted node IDs
  successorGovernmentId: existing different GovernmentId of the same Country
```

The profile is an explicit mapping for one `(countryId, coupFactionId)` coup
candidate. Every required node belongs to that Country. The scenario validator
must reject missing nodes, duplicate node IDs, a profile with no required
nodes, a node from another Country, or a successor Government that is missing,
has another Country, or equals the current Government at resolution time.
Node names are never used for branching. There are no node weights, force
values, ranks, command edges, or inferred membership rules.

This is static scenario content, not a dynamic actor factory. It exists when
the coup attempt is created, not when the late diagnostic reaches `t=870` or
`t=330`. A controlled developer fixture may provide initial alignment evidence
to exercise the contract; production must not infer an initial alignment from
existing scalars.

## Alignment-state audit

The smallest runtime state is exactly:

```text
incumbent | coup | uncommitted
```

The values are observable positions for the current coup attempt, not beliefs
or an enduring loyalty meter:

- `uncommitted` means that this node has no accepted decisive response for the
  active attempt. It is a real current state and can remain indefinitely; no
  timer converts it.
- `incumbent` means the node has produced an explicit, recorded response on
  the incumbent side for this attempt.
- `coup` means the node has produced an explicit, recorded response on the
  coup side for this attempt.

No value is derived from Faction grievance/organization/resources/influence,
Country `militaryPower`/`stateCapacity`/legitimacy/instability, ideology,
`currentStrategy`, Agenda, Government validity, or LandHex control. A private
belief or common-knowledge model is deliberately not represented. If a case
needs hidden beliefs or a communications network to decide a response, the
node remains `uncommitted` and the coup remains active; the system does not
invent a result.

`militarySympathy` must remain an explicit `notImplemented` diagnostic in T018
until a future coordination state exists. It must not become a numeric
loyalty/coordination shortcut. `leadership`, `foreignSupport`, and `weapons`
remain outside this minimal slice and continue as `notImplemented` evidence.

## Transition and writer provenance

The bounded future writer is an accepted typed response from a required
coordination node, not a scalar transition:

```text
COUP_COORDINATION_RESPONSE (future typed action; not added here)
  conflictId: active coup ConflictId
  coordinationNodeId: required node ID
  alignment: incumbent | coup
```

The response enters the common `ActionRecord` intake. The future validator
must require:

1. the referenced Conflict is active and has `kind = coup`;
2. the profile matches the Conflict's Country and coup Faction;
3. the node is one of that profile's required nodes;
4. the node has not already recorded a terminal alignment for this attempt;
5. the accepted action is applied in global ActionRecord sequence order.

The authoritative writer records the node alignment together with the source
ActionRecord identity, action tick, conflict ID, node ID, and alignment. It
emits a typed alignment-evidence event in the same deterministic event
pipeline. A repeated response for the same `(conflictId, nodeId)` is rejected
and cannot reopen or overwrite the prior alignment. Stable node ordering and
global action/event sequence make uninterrupted, save/load, and insertion-order
replay deterministic.

The event's causal links must use only EventStore IDs that are already known at
the commit boundary. The source ActionRecord ID is provenance data; it is not
pretended to be a GameEvent cause ID. A future implementation must not invent
cross-tick cause IDs because the current simulation phase does not receive a
historical EventStore. This is one reason the runtime state/persistence change
belongs to a later implementation task.

Scenario-authored initial alignment is allowed only for controlled fixtures and
must be explicit evidence. Current Government validity, Faction resources,
Agenda severity, `currentStrategy`, and existing LandHex events are not
coordination transitions. An LLM may propose an action through the same typed
intake, but it may not mutate alignment or outcome directly.

## Discrete outcome rule

The profile's `requiredNodeIds` is an authored necessary-set contract. It is
not a generic actor-count majority or quorum calculation:

| Required-node state | Coup result |
| --- | --- |
| Every required node is explicitly `coup` | Apply existing typed nonterminal `ConflictOutcome.governmentTransition` to the profile's existing same-Country successor Government. Preserve `CountryId`; the previous Government becomes `contender` through the existing writer. |
| Any required node is explicitly `incumbent` before success | Apply existing typed `ConflictOutcome.statusQuo`. Preserve the Country, Government, LandHex state, and RunOutcome. |
| At least one required node remains `uncommitted`, with no `incumbent` node and not all nodes `coup` | Leave the coup active. No timer, cooldown, countdown, probability, or inferred progress is created. |

If several node responses arrive for one boundary, the writer evaluates the
complete accepted response set after deterministic node/action ordering. The
terminal result is order-independent because success requires every authored
required node and failure requires an explicit incumbent refusal. Duplicate
responses are rejected before evaluation. There is no hidden score and no
random resolution.

`stateDissolved` is not a coup result. T023 remains the only owner of terminal
state dissolution. The existing `ConflictOutcome` result sink is sufficient;
the new slice needs a kind-specific coordination state and producer, not a new
shared conflict objective or a fake front.

## Late-state relevance test

The current replay proves only the existing gap. The proposed domain would be
available at coup creation if the scenario has a matching profile. It would not
be invented at the late freeze. In principle:

- explicit `coup` responses from every required node could resolve the coup to a
  nonterminal Government transition without touching LandHex control;
- an explicit `incumbent` response could resolve only the coup to `statusQuo`;
- no response would leave the coup active, preserving honest uncertainty;
- the separate rebellion would remain active and require its own future
  persistence/settlement evidence;
- an alignment event and the resulting typed outcome would be a real
  state-grounded reassessment before a long silence, not a presentation-only
  signal;
- Government transition would preserve CountryId and leave T023 untouched.

The existing F05_FIX9 run has none of these new node responses, so F05_FIX16
does not claim that the late state has improved. The replay remains
`LATE_STEADY_STATE_MIXED_CAUSE`, with `1110/1200` silence and two active
conflicts.

## Closure fields

```text
PRIMARY_CLASSIFICATION: COUP_COORDINATION_MINIMAL_DOMAIN_DESIGNABLE
ACTOR_MODEL: STATIC_SCENARIO_AUTHORED_COUP_COORDINATION_NODES_WITH_AUTHORED_REQUIRED_SET
ALIGNMENT_MODEL: incumbent | coup | uncommitted (observable attempt-local alignment)
TRANSITION_PROVENANCE: ACCEPTED_TYPED_COUP_COORDINATION_RESPONSE_BY_REQUIRED_NODE_WITH_ACTION_AND_EVENT_PROVENANCE
OUTCOME_RULE: ALL_AUTHORED_REQUIRED_NODES_COUP => governmentTransition; ANY_EXPLICIT_REQUIRED_NODE_INCUMBENT => statusQuo; OTHERWISE ACTIVE
CURRENT_FACTION_REUSE: NO
CURRENT_GOVERNMENT_REUSE: NO
NEW_STATIC_AUTHORING_REQUIRED: YES
NEW_RUNTIME_STATE_REQUIRED: YES
PERSISTENCE_IMPLICATION: FUTURE_VERSION_REQUIRED
NEXT_IMPLEMENTATION_READINESS: COUP_COORDINATION_AUTHORING_SEAM
```

The current V6 contract remains unchanged because this task adds no runtime
state. A future implementation that persists per-conflict node alignments and
their provenance will require a versioned snapshot change; it must not smuggle
the new state into V6 without a decoder/closure/replay contract.

## Explicit non-goals and review boundary

- no new production gameplay or scenario coup content;
- no new WorldState/Conflict/Government/Faction field in this task;
- no new ActionRecord or GameEvent type in this task;
- no T018/T021/T022/T023 change;
- no military units, manpower, officer loyalty, command hierarchy,
  communications graph, private belief model, or tactical battle;
- no numeric coup support, coordination, loyalty, command cohesion,
  inevitability, or progress score;
- no random roll, timer, cooldown, countdown, Agenda trigger, strategy/name
  branch, or LandHex-based coup result;
- no automatic state dissolution, rebellion settlement, FUND_MOVEMENT extension,
  V02/UI work, Gate 1F PASS, or F05_FIX17 authorization.

## Claim-to-source ledger

| claim ID | claim used | status | source | limitation |
| --- | --- | --- | --- | --- |
| R01 | Coup coordination is distinct from conventional territorial battle and involves actors' expectations about coordination. | Source-based inference within fixed pack | R01, Naunihal Singh, *Seizing Power*, DOI `10.1353/book.31450`; fixed pack in `docs/bridge/tasks/F05_FIX16.md` §3 | The pack does not provide a TMR formula or actor-count threshold. |
| R02 | The attempt itself and officers' expectations about other officers support separating eligibility from outcome alignment. | Source-based inference within fixed pack | R02, Barbara Geddes review of Singh, *Political Science Quarterly* 130(3), 2015; fixed pack §3 | No private-belief simulation is claimed by this design. |
| R03 | Coup is a distinct seizure-of-power mechanism and should not be collapsed into rebellion/civil-war territorial mechanics. | Source-based inference within fixed pack | R03, Powell & Thyne (2011), *Journal of Peace Research*; fixed pack §3 | The source supports mechanism separation, not the authored required-set rule. |
| R04 | Acquiescence to avoid internecine fighting is a coordination illustration, not a universal rule. | Source-based inference within fixed pack | R04, African Affairs Niger briefing; fixed pack §3 | Used only to justify explicit observable response evidence; no scenario script is inferred. |
| TMR-01 | Current T018 is eligibility-only; T021 has no coup territorial intent; `applyConflictOutcome()` is a typed result sink. | Verified repository observation | `src/sim/systems/politicalCrisis.ts`, `src/sim/systems/conflictResolution.ts`, `src/sim/state/conflict.ts` | Observation is current at F05_FIX16 base and does not implement the proposed seam. |
| TMR-02 | The late representative remains active with zero country LandHexes, active rebellion/coup, and `1110/1200` silence. | Verified repository inspection | `docs/F05_FIX9_LATE_STEADY_STATE_AUDIT.md`; `pnpm run inspect:f05fix9` | This is a design baseline, not a claim of future improvement. |
