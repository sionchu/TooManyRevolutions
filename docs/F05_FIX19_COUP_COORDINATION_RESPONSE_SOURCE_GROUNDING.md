# F05_FIX19 — Coup Coordination Response Source Grounding

TASK_ID: F05_FIX19
STATUS: COMPLETE / AWAITING_CHATGPT_REVIEW
BASE_IMPLEMENTATION_HEAD: ccde3f4299b39d03ee80f097381c1efd4dd678e6
BASE_IMPLEMENTATION_BRANCH: f05-fix18-review
REVIEW_BRANCH: f05-fix19-review

PRIMARY_CLASSIFICATION: COUP_RESPONSE_SOURCE_EXTERNAL_INPUT_ONLY_AT_CURRENT_SCOPE
NEXT_IMPLEMENTATION_READINESS: EXPLICIT_RESPONSE_INPUT_INTEGRATION_ONLY

EXISTING_WORLDSTATE_SUFFICIENT: NO
GENERIC_SCALAR_INFERENCE_ALLOWED: NO
RANDOM_OR_TIMER_ALLOWED: NO
PREAUTHORED_ALIGNMENT_ALLOWED: NO
LLM_DIRECT_MUTATION_ALLOWED: NO
FIX18_RESPONSE_SEAM_REUSED: YES
PERSISTENCE_FORMAT: V7_UNCHANGED
GATE1F: NOT_READY
V02: NOT_STARTED

## 1. Decision

F05_FIX18 proves one narrow runtime fact: a schema-valid, explicit
COUP_COORDINATION_RESPONSE can be accepted for one authored required node,
recorded with ActionRecord and GameEvent provenance, persisted in the V7
response map, and resolved through the existing conflict-outcome sink.

It does not prove where an independent node obtains a grounded reason to
respond, or why that node selects incumbent rather than coup. The current
repository has aggregate country, faction, regional, ideological, and
territorial observations, but no authoritative node-level expectation,
communication, command, or public-signal domain. Those observations therefore
cannot be promoted into an autonomous response producer without inventing a
new causal model.

The current safe boundary is consequently:

    external player/heuristic/LLM proposal
      -> validated COUP_COORDINATION_RESPONSE ActionRecord
      -> F05_FIX18 resolver and V7 provenance

The external source may propose only a schema-valid response. It does not gain a
second mutation path, and the ActionRecord.source is provenance for the input;
it is not the actor identity. The actor remains the authored
CoupCoordinationNodeId in the response payload and event.

This is an explicit-input boundary, not a claim that autonomous coup
coordination is impossible in the product. It means that the source required
for such a producer is not grounded at the current architecture boundary.

## 2. Accepted predecessor and repository boundary

The accepted F05_FIX18 contract is:

- sparse decisive response state indexed by coup ConflictId and node ID;
- absence of an accepted response means uncommitted;
- only incumbent and coup are decisive alignments;
- an authored required-node set is necessary, not weighted or ordered;
- any incumbent response resolves status quo;
- all required coup responses resolve through the existing government-transition
  outcome sink;
- otherwise the coup remains active;
- the only current response writer consumes an explicit
  COUP_COORDINATION_RESPONSE ActionRecord;
- persistence remains SerializedSimulationSnapshotV7.

The static F05_FIX17 node/profile authoring seam supplies identity, country
ownership, the coup faction, the necessary node set, and the successor
Government. It does not supply a final alignment, a belief, a command
relationship, a signal, or a timing script. That omission is correct and is
preserved here.

## 3. Literature grounding

The literature is used to identify causal requirements, not to create a coup
score or a numeric balance rule.

| Source | Finding relevant to node-level response | Architecture implication |
| --- | --- | --- |
| Naunihal Singh, Seizing Power: The Strategic Logic of Military Coups, Johns Hopkins University Press, 2014 | Coup success is analyzed as coordination: actors care about what other military actors will do and about projected control or apparent inevitability. Grievance or incumbent popularity alone does not determine which side an actor joins. | A response source must expose actor-specific expectations or observable control signals. Country or faction dissatisfaction alone is not a side-selection rule. |
| Andrew T. Little, Coordination, Learning, and Coups, Journal of Conflict Resolution 61(1), 2017 | Officers may join only when they expect others to join. Learning and common expectations can support more than one equilibrium, so dissatisfaction does not uniquely determine participation. | A deterministic producer needs explicit information and a documented equilibrium/choice authority. RNG, array order, hidden priority, and time-based tie breaking are not acceptable substitutes. |
| Brett Allen Casper and Scott A. Tyson, Popular Protest and Elite Coordination in a Coup d'état, The Journal of Politics 76(2), 2014 | Public protest can aggregate information and act as a public signal that helps elites coordinate; the information environment changes how useful that signal is. | A future source must represent observable signals and their recipients or visibility. A private aggregate scalar is not the same as a node-observed public signal. |

References:

- [Singh, Johns Hopkins University Press](https://www.press.jhu.edu/books/title/10989/seizing-power)
- [Singh review, Political Science Quarterly](https://academic.oup.com/psq/article-abstract/130/3/580/6846177)
- [Little, Journal of Conflict Resolution](https://journals.sagepub.com/doi/abs/10.1177/0022002714567953)
- [Casper and Tyson, The Journal of Politics](https://www.journals.uchicago.edu/doi/abs/10.1017/S0022381613001485)

The common requirement is not "find a better scalar." It is an information
problem: which actor observed which authoritative signal, what expectation did
that signal make common, and what event made the choice actionable?

## 4. Current-state sufficiency matrix

The question in this matrix is specifically whether the candidate can
determine one already-active coup node's incumbent or coup response. A
candidate can be useful for crisis eligibility or presentation and still be
insufficient for side selection.

| Candidate source | Classification | Why it is or is not sufficient |
| --- | --- | --- |
| Country militaryPower | INSUFFICIENT | It is an aggregate country value. It does not identify the node, the node's observations, or the expected actions of other nodes. A military-power comparison is expressly forbidden as coup-node alignment. |
| Country stateCapacity | INSUFFICIENT | It describes state administrative capacity and can contribute to state weakness. It does not express a command order, communication, recognition, or node belief. |
| Country legitimacy | INSUFFICIENT | Legitimacy can describe incumbent pressure, but legitimacy is not equivalent to a node's expected side. A direct legitimacy-to-incumbent mapping is forbidden. |
| Country instability | INSUFFICIENT | Instability is an aggregate pressure/result. It can help explain why a crisis is possible, but it does not select a particular node response. |
| Country stateContinuity | INSUFFICIENT | The field is historical continuity of the Country, not the current Government or a state-apparatus actor. It has no node-level decision semantics. |
| Faction organization, resources, influence, grievance | INSUFFICIENT | These are aggregate Faction fields used by existing pressure and crisis read models. They do not encode military chain of command, communication reach, expectations, or the response of a distinct coordination node. |
| Faction currentStrategy | FORBIDDEN | It is an existing heuristic strategy field, not a node belief or command signal. Mapping supportCoup directly to a coup response would turn an incidental strategy label into an alignment writer. |
| Ideology affinity or similarity | INSUFFICIENT | It describes a Faction-to-Ideology relation. It does not describe what a node has learned about other actors during an active coup. |
| Government identity, authority, or derived classification | INSUFFICIENT | Government authority is central, contender, or exile, while regime classification is a presentation/read-model derivation. Neither represents independent node decisions, communication, or common expectations. |
| Agenda severity and causes | INSUFFICIENT | PrimaryAgenda is derived presentation context from ScenarioDefinition, WorldState, and bounded recent events. It is not authoritative lifecycle state and is not a response source. |
| Region stateControl, unrest, scarcity | INSUFFICIENT | These are regional aggregates. They can be pressure evidence or rebellion context, but they do not identify which coordination node received which signal. |
| LandHex ownership, control, or derived fronts | FORBIDDEN | LandHex controller is the physical territorial authority. A coup response is not a territorial front, and automatic controller evidence would create the forbidden fake coup-front/alignment shortcut. |
| Coup node name or authored ordering | FORBIDDEN | F05_FIX17 defines name as presentation/authoring text and requiredNodeIds as an unordered necessary set. Neither can encode alignment or priority. |
| Elapsed time, cadence, timer, countdown, or cooldown | FORBIDDEN | Time alone is not the missing signal. A rule such as "choose after N days" would be a pacing mechanism and would hide the coordination decision. |
| Random roll or seed | FORBIDDEN | RNG is authoritative replay state, but no random equilibrium selector is grounded by the literature or the current domain. Randomness would make an unobserved choice look causal. |
| LLM or heuristic prose without schema-grounded facts | FORBIDDEN | An LLM or heuristic may propose a bounded ActionRecord, but prose cannot directly mutate WorldState or substitute for a node-observed authoritative context. |
| Active Conflict identity and participant lists | INSUFFICIENT | They establish that a coup response is in scope and connect the profile to a Country/Faction. They do not explain a node's side choice. |
| Static F05_FIX17 node/profile | INSUFFICIENT | It supplies actor identity, ownership, the necessary set, and successor Government. It intentionally does not pre-author an initial alignment or a source signal. |

No current candidate is SUFFICIENT for an autonomous node-level response
producer. This is why EXISTING_WORLDSTATE_SUFFICIENT is NO.

## 5. Source-family evaluation

| Source family | Decision | Reason |
| --- | --- | --- |
| Existing-state deterministic inference | Reject for autonomous response | The existing values are useful eligibility and explanation inputs, but none provides node-specific information or common expectations. A deterministic formula would be a hidden scalar/threshold mapping. |
| Random or time-driven resolution | Reject and forbid | RNG, timer, cadence, countdown, and cooldown do not supply a historical or architectural reason for a node's side. They also hide multiple equilibria behind implementation order or pacing. |
| Unstructured external choice | Reject as an autonomous source | An unbounded LLM or heuristic judgment has no replayable authoritative decision context. It may only submit a bounded proposal through the common ActionRecord intake. |
| Direct player alignment choice | Retain only as explicit external input | F05_FIX18 can accept a player-supplied response because the action is explicit, validated, and replayable. That does not establish that an independent node autonomously chose its side, so it cannot be relabeled as the node's source domain. |
| Explicit signal/information domain | Candidate for future research, not grounded here | The literature supports this family, but the current repo has no authoritative signal visibility, issuer-to-node relation, expectation state, or event that makes a response eligible. Adding those facts would be a new domain and is outside FIX19 implementation scope. |
| Larger state-apparatus domain | Deferred, not silently invented | If future signals require command hierarchy, communication reach, recognition, or institutional authority, a reusable apparatus/information domain may be necessary. The current repository does not contain that model, so it cannot be simulated by reusing Faction or Government fields. |

The selected current family is explicit external input only. It preserves a
real, bounded path without pretending that a response producer has been
grounded.

## 6. Minimal-domain proof obligations

The following obligations test the smallest possible coup-specific signal
domain. The result is deliberately conservative: F05_FIX19 identifies the
missing contracts but does not add them.

| Obligation | Current result | Required boundary |
| --- | --- | --- |
| Actor identity | PASS for explicit input; FAIL for autonomous production | CoupCoordinationNodeId remains the actor. ActionRecord.source remains only player, heuristic, or LLM input provenance. A future producer must not use source as the node identity. |
| Information/signals | FAIL | No current authoritative state says which node observed a command, public signal, control claim, or other expectation-forming fact. New signal state/events would be required. |
| Bootstrap | FAIL | The first response cannot be justified by another response because that is circular. A future source needs a non-circular, typed signal with an explicit issuer, recipient/visibility, and causal event. None exists at this boundary. |
| Choice rule | FAIL for autonomous production | Existing scalars, currentStrategy, labels, ordering, scores, and thresholds are disallowed. An explicit response action is valid input, but its external proposer is the current source rather than a derived node decision. |
| Event-driven timing | FAIL for autonomous production | The current pipeline has action-resolution events and active-conflict state, but no source event that makes a node response eligible. Arbitrary elapsed-time selection is forbidden. |
| Multiple equilibria | Preserved only by explicit input | F18 leaves an incomplete response set active. That is honest uncertainty. An automatic producer must not select an equilibrium through RNG, ordering, priority, or a hidden script. |
| Replay and determinism | PASS after action intake; incomplete before intake | F18 records the accepted ActionRecord, response event, cause IDs, and V7 state. A future producer would also need the authoritative decision context and its causal event/provenance before emitting the same action. |
| Player/AI boundary | PASS for the existing seam; no autonomous context | Player, heuristic, and LLM inputs enter through the common validator. They must be constrained by a future typed decision context, and LLM output must never mutate WorldState directly. |
| No pacing cheat | PASS for the current seam | No timer, cadence, countdown, or cooldown is added. Keeping a coup active without an explicit response is preferable to fabricating a late response. |

These results do not authorize a hidden "minimal" score. A future signal domain
would have to prove that a signal has a typed semantic relationship to the
recipient node and that the response rule is an explicit domain rule rather
than a numeric correlation or final-alignment lookup. Until then, the only
grounded source is an explicit external response.

## 7. Architecture comparison: A, B, C, D

### A. Small coup-specific signal/decision domain

This is the smallest plausible autonomous direction: add only typed,
coup-specific signals and a node decision context. The minimum concepts would
be an authoritative signal identity, issuer, recipient or visibility,
semantic signal kind, source event/provenance, and a bounded decision-context
rule. Derived agenda severity, narrative prose, and aggregate scalars would
remain outside the writer.

The current repository cannot yet satisfy the non-arbitrary choice and
bootstrap obligations for that domain. Static nodes/profiles are identities,
not signals; F18 responses are already final choices, not precursor evidence.
Therefore A is not selected as "designable" for this task.

### B. Reusable command/information network

This could represent command relationships, communication reach, recognition,
and institutional authority in a reusable way. It may be the correct model if
the intended game design requires nodes to infer projected control from
hierarchical or public information. It is materially larger than the current
F05 seam and would require its own authoring, runtime, event, replay, and
inspection contract. Reusing Faction or Government as an implicit network
would be invalid.

### C. Explicit external responses only

This is the selected current architecture. F05_FIX18 already provides the
validated ActionRecord, deterministic response event, rejection provenance,
outcome sink, and V7 persistence boundary. It supports explicit player or
bounded AI/LLM proposals while retaining active uncertainty when no response
exists. It does not claim autonomous node behavior.

### D. No viable coup response source; pivot to rebellion

This is not selected because an explicit, replayable response input is viable
and already implemented. The absence of an autonomous source does not require
inventing rebellion behavior or declaring a Gate 1F pivot in FIX19.

## 8. Architecture boundary audit

The following existing contracts remain authoritative:

- ScenarioDefinition owns static coup node/profile authoring and validates
  references, country ownership, capability, necessary-set uniqueness, and
  successor Government identity.
- WorldState owns mutable Country, Region, LandHex, Government, Faction,
  Conflict, and V7 sparse response state. It does not own an ungrounded
  node-belief or coordination score.
- Agenda and faction-pressure observations are read models or heuristic
  contexts. They do not become coup response writers.
- ActionRecord is append-only input provenance. The common validation path is
  the only input hand-off.
- F05_FIX18 response resolution is the only current response mutation path.
  Accepted responses write the sparse V7 map and typed event; complete
  response sets use applyConflictOutcome.
- EventStore preserves ordered action/event provenance for replay and rejection
  evidence. No new signal event or runtime field is introduced by FIX19.
- SerializedSimulationSnapshotV7 remains unchanged. No V8 field or migration
  is introduced.

No production source or test file is changed by this task. There is no
response producer, Government-transition producer, LandHex coup writer,
rebellion implementation, FUND_MOVEMENT extension, Gate 1F declaration, V02
work, or F05_FIX20 authorization.

## 9. Explicit recommendation

At the current scope, keep COUP_COORDINATION_RESPONSE as an explicit external
input only. Do not derive node alignment from Country, Faction, Government,
Agenda, Region, LandHex, time, RNG, node name, or prose.

If autonomous response production is later required, the next design decision
must first authorize a separate source-domain task. That task must choose
between a genuinely typed coup-specific signal domain and a larger reusable
state-apparatus/information domain. It must specify the first non-circular
signal, its issuer and visibility, the node's authoritative decision context,
the event that makes the response eligible, and the replay contract before
any producer is written.

This recommendation intentionally does not authorize F05_FIX20, Gate 1F PASS,
V02, rebellion, or any production gameplay change.

## 10. Completion markers

F05_FIX19: COMPLETE / AWAITING_CHATGPT_REVIEW
NEXT_AUTHORIZED_TASK_ID: NONE
GATE1F_CHATGPT_DECISION: NOT_READY
V02: NOT_STARTED
