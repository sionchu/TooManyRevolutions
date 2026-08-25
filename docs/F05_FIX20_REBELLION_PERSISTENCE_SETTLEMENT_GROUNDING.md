# F05_FIX20 Rebellion Persistence and Settlement Grounding

TASK_ID: F05_FIX20
STATUS: COMPLETE / AWAITING_CHATGPT_REVIEW
BASE_IMPLEMENTATION_HEAD: e300fb2e51435e0f1eeedc1c2dd3db006ac0c08e
BASE_IMPLEMENTATION_BRANCH: f05-fix19-review
REVIEW_BRANCH: f05-fix20-review

PRIMARY_CLASSIFICATION: REBELLION_PERSISTENCE_AND_SETTLEMENT_REQUIRE_SEPARATE_DOMAINS
NEXT_IMPLEMENTATION_READINESS: REBELLION_DOMAIN_SPLIT_REQUIRED

EXISTING_WORLDSTATE_PERSISTENCE_SUFFICIENT: NO
EXISTING_WORLDSTATE_TERMINATION_SUFFICIENT: NO
NO_FRONT_MEANS_PEACE: NO
ZERO_LANDHEX_MEANS_DEFEAT: NO
RANDOM_OR_TIMER_ALLOWED: NO
DIRECT_CONFLICT_DELETE_ALLOWED: NO
FREE_LANDHEX_WRITER_ALLOWED: NO
LLM_DIRECT_MUTATION_ALLOWED: NO
PERSISTENCE_FORMAT: V7_UNCHANGED
GATE1F: NOT_READY
V02: NOT_STARTED

## Executive decision

F05_FIX20 is a research and architecture-grounding closure only. The current
repository can preserve an active rebellion in some non-territorial states,
but it does not have a conflict-scoped operational-persistence domain. It also
does not have a settlement, guarantee, implementation, demobilization, or
loss-of-capacity domain that can establish a durable termination.

Persistence and settlement must therefore remain separate future domains:

- A persistence domain answers whether an identified rebellion still has
  grounded operational capacity or continuity even when it has no current
  front edge and controls no LandHex.
- A settlement domain answers whether the parties have accepted, implemented,
  and complied with a settlement or whether explicit suppression or
  demobilization has removed the conflict's capacity to continue.

The absence of a derived front, the absence of faction-controlled LandHex, a
long quiet interval, or a random result is not sufficient evidence for either
answer. The selected classification is
REBELLION_PERSISTENCE_AND_SETTLEMENT_REQUIRE_SEPARATE_DOMAINS. The next
implementation readiness is REBELLION_DOMAIN_SPLIT_REQUIRED.

This document does not add either domain to production code. It does not
change Conflict, Faction, Country, Government, Region, LandHex, actions,
events, persistence, or any T018/T021/T022/T023 path.

## Research grounding

### Kalyvas: control is local, fragmented, and not a conventional front

Stathis Kalyvas, *The Logic of Violence in Civil War*, treats control and
collaboration as local and variable rather than as a single binary map
condition. A territorial-control observation can therefore be useful evidence
about where force is currently projected, but it cannot by itself prove that
an insurgent organization has ceased to exist or that a settlement has been
implemented.

Source: [Cambridge University Press, The Logic of Violence in Civil War](https://www.cambridge.org/core/books/logic-of-violence-in-civil-war/3DFE74EA492295FC6940D58CA8EF4D5C)

Architecture consequence: the derived front in this repository is a
territorial projection. It must not be promoted to the identity, persistence,
or termination authority of a rebellion.

### Fearon and Laitin: insurgency viability is not identical to territorial control

James D. Fearon and David D. Laitin, “Ethnicity, Insurgency, and Civil War,”
explain insurgency through conditions that enable relatively small armed groups
to operate against a weak or difficult-to-control state. This supports a
distinction between territorial control and the operational ability to
continue an insurgency. A faction can be operationally persistent without
holding a current LandHex, while the existence of a LandHex does not by itself
prove a negotiated or durable political outcome.

Sources: [American Political Science Review article](https://www.cambridge.org/core/journals/american-political-science-review/article/abs/ethnicity-insurgency-and-civil-war/B1D5D0E7C782483C5D7E102A61AD6605) and [DOI 10.1017/S0003055403000534](https://doi.org/10.1017/S0003055403000534)

Architecture consequence: a future persistence seam needs explicit,
conflict-scoped operational evidence. It must not infer an insurgency meter
from grievance, organization, military power, elapsed time, or a map count.

### Walter: negotiation, agreement, implementation, and guarantees are distinct

Barbara F. Walter, *Committing to Peace*, separates the negotiation and
compromise problem from implementation and credible commitment. A ceasefire or
signed text is not equivalent to completed demobilization, and an agreement
without a credible implementation mechanism does not establish durable peace.

Source: [JSTOR, Committing to Peace](https://www.jstor.org/stable/j.ctv1j13z61)

Architecture consequence: settlement cannot be represented by setting
Conflict.status to resolved merely because a front disappeared or a proposal
was accepted. A future settlement domain needs explicit agreement,
implementation, guarantee, and demobilization or compliance evidence.

### Matanock-related implementation literature: compliance is an explicit
process

Matanock and Lichtenheld describe how interveners can condition political,
economic, and legal incentives on compliance with peace processes. The
relevant architectural point is that implementation and compliance mechanisms
are separate from the initial cessation of violence.

Source: [Matanock and Lichtenheld, DOI 10.1017/S0007123421000491](https://doi.org/10.1017/S0007123421000491)

Architecture consequence: a future settlement domain needs typed
implementation or compliance provenance. Existing intervention commitments
and political proposals are not silently reclassified as settlement
commitments.

## Repository baseline

The audit was performed against the F05_FIX20 base and the authoritative
architecture boundaries:

- **Conflict state:** src/sim/state/conflict.ts stores Conflict identity,
  kind, status, participants, affected regions, contested regions, start and
  resolution ticks, and an optional typed outcome. It has no
  rebellion-specific operational-persistence episode and no settlement
  implementation state.
- **Faction state:** src/sim/state/faction.ts stores organization, resources,
  influence, grievance, ideology affinity, foreign links, strategy, and static
  capabilities. These are inputs to current eligibility and intent
  derivation, not a durable rebellion lifecycle record.
- **Regions and LandHexes:** Region signals are political and social
  observations. LandHex controller is the physical territorial authority.
  Front edges are derived from current adjacent controllers and are not
  stored as a rebellion identity.
- **T018 political crisis:** rebellion prerequisites are a derived
  eligibility read model. The state-weakness snapshot is also derived.
  Neither is a persistence, settlement, or demobilization writer.
- **T021 conflict resolution:** territorial intents use current controller
  state and the single LandHex controller mutation seam. The same-phase
  creation restriction and weekly boundary are cadence rules, not persistence
  evidence.
- **Actions and proposals:** ActionRecord is append-only and bounded by
  source and cause provenance. Existing political proposals concern
  intervention requests. They do not carry a rebellion settlement,
  guarantee, implementation, or demobilization lifecycle.
- **Persistence:** SerializedSimulationSnapshotV7 remains the current format.
  No F05_FIX20 persistence field or version change is authorized.

## Existing-source sufficiency matrix

The labels below answer two different questions. Persistence asks whether the
source can prove continued operational continuity. Termination asks whether it
can prove suppression, negotiated settlement, demobilization, or loss of
capacity. A source can be useful for one read model while being insufficient or
forbidden for lifecycle mutation.

| Existing source or observation | Persistence classification | Termination classification | Grounded boundary |
| --- | --- | --- | --- |
| Active Conflict identity and participant faction/country IDs | PERSISTENCE_INSUFFICIENT | TERMINATION_INSUFFICIENT | Identifies the episode but does not prove its continuing capacity or its end. |
| Conflict.status active/resolved | PERSISTENCE_INSUFFICIENT | TERMINATION_INSUFFICIENT | Stores a lifecycle result; it is not the missing evidence that should produce that result. |
| Faction organization, resources, influence, grievance, and currentStrategy | PERSISTENCE_INSUFFICIENT | TERMINATION_INSUFFICIENT | Supports current eligibility or intent derivation; no scalar combination may become a generic insurgency score. |
| Static faction rebellion capability | PERSISTENCE_INSUFFICIENT | TERMINATION_INSUFFICIENT | Authoring capability is not an operational episode and its absence is not demobilization. |
| Region unrest, ideology, scarcity, stateControl, and local mobilization signals | PERSISTENCE_INSUFFICIENT | TERMINATION_INSUFFICIENT | Political and social signals are not a continuity or settlement writer. |
| Current LandHex controllers and derived front edges | PERSISTENCE_INSUFFICIENT | TERMINATION_INSUFFICIENT | Describes current territorial projection. It may coexist with non-territorial persistence. |
| No faction-controlled LandHex | PERSISTENCE_INSUFFICIENT | TERMINATION_FORBIDDEN | It cannot be used as automatic defeat or peace evidence. |
| No derived front edge | PERSISTENCE_INSUFFICIENT | TERMINATION_FORBIDDEN | A temporary operational pause or dispersed activity can have no front. |
| Country legitimacy, stateCapacity, instability, and militaryPower | PERSISTENCE_INSUFFICIENT | TERMINATION_INSUFFICIENT | These are derived or current political/military conditions, not settlement proof. |
| Agenda and other read models | PERSISTENCE_INSUFFICIENT | TERMINATION_FORBIDDEN | Read models do not own lifecycle mutation or external commitment. |
| Existing actions and intervention commitments | PERSISTENCE_INSUFFICIENT | TERMINATION_INSUFFICIENT | They have action-specific semantics; they cannot be reinterpreted as settlement or demobilization without a typed seam. |
| Existing political proposals | PERSISTENCE_INSUFFICIENT | TERMINATION_INSUFFICIENT | Current proposals are intervention requests, not bilateral settlement and implementation records. |
| suppressIneligibleRebellions() | PERSISTENCE_INSUFFICIENT | TERMINATION_INSUFFICIENT | It covers a narrow ineligible, no-faction-LandHex case; it does not prove general suppression or settlement. |
| Elapsed time, weekly cadence, or long silence | PERSISTENCE_FORBIDDEN | TERMINATION_FORBIDDEN | Quiet duration cannot replace operational or political evidence. |
| RNG or random outcome | PERSISTENCE_FORBIDDEN | TERMINATION_FORBIDDEN | Randomness cannot establish continuity, defeat, settlement, or compliance. |
| Unstructured external or LLM proposal | PERSISTENCE_INSUFFICIENT | TERMINATION_INSUFFICIENT | A proposal may request a bounded action; it cannot directly mutate lifecycle state. |

No existing row is persistence sufficient or termination sufficient for the
full F05_FIX20 problem. The current active Conflict record is a necessary
identity anchor, not a complete persistence domain.

## Required conceptual distinctions

### Political eligibility

T018 derives whether a faction and country currently meet the preconditions
for rebellion. This is a gate for starting or suppressing a narrow case. It
does not establish that an already-started rebellion has no operational
capacity, and it is not settlement evidence.

### Non-territorial operational persistence

An active rebellion may remain operationally relevant while it has no current
front edge and controls no LandHex. The future persistence seam must identify
the conflict and preserve typed operational evidence without a generic score,
daily decay, timer, or hidden threshold. This is distinct from merely leaving
Conflict.status active forever.

### Territorial control and front

LandHex.controller remains the physical territorial authority. T021 derives
front edges from current adjacent controllers and uses the existing
LandHex-writing seam. Territorial presence may support a future operational
record, but territorial presence is neither required for persistence nor
sufficient for settlement.

### Suppression and defeat

The current narrow suppression rule can resolve an active rebellion when its
prerequisites are no longer present and the faction controls no LandHex. It
does not model operational collapse, loss of leadership or supply, explicit
military suppression, or a settlement. Grievance reduction alone is not
demobilization.

### Negotiated settlement

A settlement is a relationship and process between parties. It requires
explicit terms, acceptance, implementation, and a provenance-bearing
compliance or guarantee path. A response proposal, a ceasefire, a quiet
front, or a status quo outcome alone is insufficient.

### Demobilization and loss of capacity

Demobilization or operational defeat must be represented by an explicit
typed fact or event with a cause and actor boundary. It cannot be inferred
from zero LandHexes, no front, a country metric, or the passage of time.

### Temporary front absence

No front is a derived statement about the current map projection at one
checkpoint. It is not proof that the rebellion has ended. Repeated no-front
observations are still not a timer-based termination rule.

## Existing behavior audit

EXISTING_BEHAVIOR_CLASSIFICATION: PARTIAL_BUT_INCOMPLETE

The current behavior is a useful boundary but not a complete F05_FIX20
solution:

1. An eligible rebellion with no faction-controlled LandHex can remain active
   even when no territorial intent or front edge is currently derivable.
2. A rebellion with faction-controlled LandHex is not removed merely because
   a prerequisite later becomes ineligible.
3. suppressIneligibleRebellions() resolves the narrow case in which the
   rebellion is ineligible and the faction controls no LandHex. The
   resolution is a typed status-quo outcome with an event, not a new direct
   deletion shortcut.
4. T021 derives territorial edges from current LandHex controllers and does
   not write a free or teleported LandHex.
5. The current behavior has no conflict-scoped operational persistence
   evidence, settlement implementation state, guarantee state,
   demobilization state, or explicit loss-of-capacity proof.

The behavior therefore correctly rejects “no front means peace” and “zero
LandHex means defeat,” but it does not yet provide positive persistence or
positive termination evidence. It is PARTIAL_BUT_INCOMPLETE.

## Source-family evaluation

| Source family | F05_FIX20 judgment | Reason |
| --- | --- | --- |
| A. Existing-state scalar inference | Reject as a lifecycle source | Existing scalars can inform political eligibility or a bounded territorial intent, but combining them into an insurgency score would hide missing operational provenance. |
| B. No-front or zero-LandHex automatic peace | Forbidden | It confuses a derived territorial projection with operational defeat or implemented peace. |
| C. Random or time-based resolution | Forbidden | It is a pacing mechanism, not evidence of persistence loss or settlement. |
| D. Explicit external settlement or suppression input | Retain as a future input boundary | A typed, validated action/event can supply evidence, but current intervention requests and proposals are not silently promoted to settlement. |
| E. Minimal rebellion-specific persistence domain | Designable | A bounded domain can attach operational identity and typed continuity evidence to a Conflict without introducing a generic score. |
| F. Minimal settlement and demobilization domain | Designable separately | Negotiation, guarantees, implementation, compliance, suppression, and demobilization have lifecycle semantics that do not belong in persistence. |
| G. Larger reusable insurgency or state-security domain | Defer | It is justified only if later proof shows that the minimal split cannot represent required actors, evidence, and transitions. It is not needed for this grounding closure. |

## Minimal future-domain proof obligations

These are design obligations for a later authorized task, not production schema
changes in F05_FIX20.

### Persistence domain

- **Identity:** bind the episode to an existing Conflict identity and its
  faction/country participants. Do not replace identity with a global
  rebellion flag or a numeric score.
- **Bootstrap:** the rebellion-start boundary may initiate a persistence
  record, but the record must carry typed operational provenance rather than
  assuming that eligibility equals continued capacity.
- **Maintenance and change:** use explicit, causally ordered actions or
  events for grounded operational facts. A change must identify its source,
  actor, tick, and cause. There is no daily decay, cooldown, countdown, or
  hidden timer.
- **Territory relation:** a persistence record may coexist with zero
  faction-controlled LandHexes and no front. Any territorial observation is
  evidence about projection, not a free LandHex writer and not automatic
  defeat.
- **Suppression or defeat:** termination requires an explicit operational
  collapse, suppression, or other typed capacity-loss fact. The existing
  narrow prerequisite suppression remains distinct from this future proof.
- **Player and AI boundary:** both player and heuristic/AI paths use bounded
  ActionRecord and GameEvent provenance. An LLM may propose a bounded action
  but cannot mutate the persistence domain.
- **Replay:** persistence changes must be deterministic from scenario version,
  action/event identity, actor, tick, cause IDs, and the serialized runtime
  state selected by a future persistence decision. Uninterrupted and
  save/load replay must agree.

### Settlement and demobilization domain

- **Parties and terms:** identify the participating government, faction, and
  any explicitly authorized guarantor or implementer. Terms must be typed,
  not an unstructured text claim.
- **Lifecycle:** distinguish proposal, negotiation, acceptance, implementation,
  compliance, breach, demobilization, and closure. Acceptance or a ceasefire
  is not the same as completion.
- **Guarantee and implementation:** record the bounded source and effect of
  implementation or guarantee actions. Existing intervention commitments must
  not be relabeled without an explicit contract.
- **Suppression boundary:** a military or administrative suppression outcome
  must be an explicit authorized action/event with cause provenance. It is
  not inferred from a missing front, a zero map count, or a timer.
- **Replay and idempotence:** repeated delivery, reopen, and save/load cases
  must preserve event identity, resolution provenance, and deterministic
  outcomes. Duplicate settlement effects must not be applied twice.

### Shared no-pacing-cheat obligation

Neither domain may be selected merely to make a long-horizon diagnostic
terminate. The F05_FIX9 late-state observation is evidence that current
interaction coverage and active-conflict equilibrium leave a gap; it is not
permission to add a timer, random event, generic score, or free territorial
writer.

## Architecture boundary and recommendation

The current architecture already gives each concern a separate boundary:

- T018 derives political eligibility.
- T021 owns territorial projection and the LandHex mutation seam.
- ActionRecord and GameEvent provide bounded provenance.
- PoliticalProposal and intervention commitments have their own subject and
  effect semantics.
- V7 persistence serializes the current runtime state without a F05_FIX20
  persistence field.

The next authorized design or implementation work must preserve those
boundaries and introduce the two concepts in order: a rebellion persistence
authoring seam, and a separate settlement/demobilization authoring seam.
Neither seam is implemented by F05_FIX20. No production code, simulation test,
runtime schema, persistence format, Gate 1F decision, V02 work, or F05_FIX21
work is authorized here.

## Completion markers

F05_FIX20: COMPLETE / AWAITING_CHATGPT_REVIEW
NEXT_AUTHORIZED_TASK_ID: NONE
GATE1F_CHATGPT_DECISION: NOT_READY
V02: NOT_STARTED
