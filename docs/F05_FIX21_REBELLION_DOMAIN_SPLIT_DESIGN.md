# F05_FIX21 Rebellion Domain Split Design

TASK_ID: F05_FIX21
STATUS: COMPLETE / AWAITING_CHATGPT_REVIEW
BASE_IMPLEMENTATION_HEAD: 510e971f38b52343055285a585d851a5baae283f
BASE_IMPLEMENTATION_BRANCH: f05-fix20-review
REVIEW_BRANCH: f05-fix21-review

PRIMARY_CLASSIFICATION: REBELLION_SPLIT_MINIMAL_DOMAINS_DESIGNABLE
NEXT_IMPLEMENTATION_READINESS: REBELLION_PERSISTENCE_AUTHORING_SEAM
FIRST_IMPLEMENTATION_DIRECTION: PERSISTENCE_AUTHORING_FIRST

PERSISTENCE_DOMAIN_SEPARATE: YES
SETTLEMENT_DOMAIN_SEPARATE: YES
NO_FRONT_MEANS_PEACE: NO
ZERO_LANDHEX_MEANS_DEFEAT: NO
GENERIC_SCORE_ALLOWED: NO
RANDOM_OR_TIMER_ALLOWED: NO
DIRECT_CONFLICT_DELETE_ALLOWED: NO
FREE_LANDHEX_WRITER_ALLOWED: NO
LLM_DIRECT_MUTATION_ALLOWED: NO
PERSISTENCE_FORMAT: V7_UNCHANGED
GATE1F: NOT_READY
V02: NOT_STARTED

## 1. Design decision

F05_FIX21 is a docs-only schema and architecture design. It does not add
production state, actions, events, scenario content, tests, or persistence.

The smallest defensible split is:

    A. Rebellion operational persistence
       identified Conflict + explicit typed operational evidence

    B. Settlement / demobilization / suppression closure
       explicit party terms + implementation/compliance or
       suppression/demobilization evidence + typed closure request

These domains are both designable at minimum scope and must not be merged
into a rebellion strength, progress, persistence, or peace meter.

The first implementation direction is PERSISTENCE_AUTHORING_FIRST. The next
implementation task should add only the static, scenario-owned persistence
authoring contract and its validation. It should not add a runtime writer,
ActionRecord type, GameEvent type, Conflict mutation, or persistence version
change. A separate settlement authoring seam can follow after the persistence
identity contract is accepted.

This design preserves the F05_FIX20 grounding:

- a rebellion can remain identified while it has zero faction-controlled
  LandHexes and no derived front;
- no-front and zero-LandHex are observations, not peace or defeat;
- T018 eligibility is not operational persistence;
- T021 territorial projection is not settlement;
- acceptance is not implementation or completed peace;
- explicit provenance is required for every future authoritative transition.

## 2. Domain A: rebellion operational persistence

### 2.1 Purpose and non-goals

The persistence domain answers one bounded question:

    Does this already-created rebellion Conflict have an identified,
    authoritatively recorded operational episode and typed evidence that
    permits it to remain operationally represented?

It does not answer:

- whether the faction is politically eligible to start a rebellion;
- how many LandHexes the faction controls;
- whether a front edge is currently derived;
- how strong the faction is;
- whether a settlement is accepted or implemented;
- whether the Country dissolves.

The domain must not contain a numeric strength, progress, persistence,
suppression, probability, or readiness value. It must not use a hidden
threshold, automatic decay, timer, cooldown, countdown, or RNG.

### 2.2 Static authoring seam

The first implementation seam should be optional scenario-owned authoring.
The following are candidate technical shapes, not production changes in
F05_FIX21.

    RebellionOperationalChannelId

    RebellionOperationalChannelKind =
      "organizationalContinuity"
      | "commandContinuity"
      | "logisticsAccess"
      | "externalSupport"

    RebellionOperationalChannelDefinition {
      id: RebellionOperationalChannelId
      countryId: CountryId
      kind: RebellionOperationalChannelKind
      name: string
    }

    RebellionPersistenceProfileId

    RebellionPersistenceProfile {
      id: RebellionPersistenceProfileId
      countryId: CountryId
      factionId: FactionId
      channelIds: readonly RebellionOperationalChannelId[]
    }

    ScenarioDefinition {
      rebellionOperationalChannels?: readonly
        RebellionOperationalChannelDefinition[]
      rebellionPersistenceProfiles?: readonly RebellionPersistenceProfile[]
    }

The channel is an authoring contract for which typed evidence kinds may be
referenced by a future episode. It is not evidence itself. A profile is an
identity-scoped list of available channels; it is not a required quorum,
weighted set, majority rule, score, or pre-authored outcome. The absence of a
channel does not mean defeat, and the presence of a channel does not mean
that the channel is currently active.

The kind vocabulary is categorical. It does not carry magnitude, weight,
reliability, probability, or a threshold. A later implementation may only
emit a kind after it has an authoritative action or event source for that
kind. The static seam must not make existing Faction resources, organization,
grievance, Region unrest, or foreign links into operational evidence by
renaming them.

An externalSupport channel is still scoped to the rebellion's Country and
Faction. It does not create a foreign actor, a foreign LandHex, a diplomatic
commitment, or an automatic supply path. A later explicit event must identify
the external actor and its provenance if that kind is implemented.

### 2.3 Static validation rules

The authoring validation for a later PERSISTENCE_AUTHORING_FIRST task must
reject at least:

1. duplicate operational channel ID;
2. unknown channel Country;
3. blank or whitespace-only channel name;
4. unsupported channel kind;
5. duplicate persistence profile ID;
6. duplicate profile for the same Country and Faction;
7. unknown profile Faction;
8. profile Faction/Country mismatch;
9. a Faction without static rebellion capability;
10. an empty profile channel set;
11. duplicate channel ID inside one profile;
12. unknown profile channel ID;
13. a channel authored for a different Country;
14. a channel kind represented with an unknown free-form string;
15. an attempt to encode weights, quorum, majority, score, threshold,
    timer, cooldown, countdown, RNG, LandHex targets, front edges, or final
    Conflict outcome in the static profile.

The profile identity is the pair Country ID and Faction ID. If the scenario
has no persistence channels and no persistence profiles, or has empty
authoring arrays, existing scenario initial state and current runtime
behavior remain unchanged. No profile is inferred from Faction values.

### 2.4 Future authoritative runtime concepts

When a later task is authorized to add runtime state, the minimum conceptual
objects are:

    RebellionOperationalPersistenceEpisode {
      id: RebellionPersistenceEpisodeId
      conflictId: ConflictId
      profileId: RebellionPersistenceProfileId
      lifecycle:
        "bootstrapped"
        | "evidenced"
        | "collapsed"
      evidenceIds: readonly RebellionOperationalEvidenceId[]
      collapseEvidenceId?: RebellionCollapseEvidenceId
      sourceEventIds: readonly GameEventId[]
    }

    RebellionOperationalEvidence {
      id: RebellionOperationalEvidenceId
      episodeId: RebellionPersistenceEpisodeId
      channelId: RebellionOperationalChannelId
      kind: RebellionOperationalChannelKind
      sourceActionId: ActionRecordId
      sourceEventId: GameEventId
      actorId: ActorId
      observedAtTick: Tick
      causeIds: readonly ProvenanceId[]
    }

    RebellionCollapseEvidence {
      id: RebellionCollapseEvidenceId
      episodeId: RebellionPersistenceEpisodeId
      kind: "operationalCollapse" | "explicitSuppression"
      sourceActionId: ActionRecordId
      sourceEventId: GameEventId
      actorId: ActorId
      observedAtTick: Tick
      causeIds: readonly ProvenanceId[]
    }

The exact branded ID names are subject to the implementation repository's
existing ID conventions. The semantics are fixed here:

- the episode is scoped to one existing Conflict;
- the profile is static authoring, while evidence is runtime provenance;
- evidence is a set of typed records, not a numeric accumulation;
- duplicate evidence IDs are idempotent and cannot apply a second effect;
- lifecycle is event-driven and does not advance because time passed;
- collapsed is a persistence-domain fact and does not directly resolve or
  delete Conflict;
- evidence does not mutate LandHex.controller.

The runtime object must not have a field such as persistenceStrength,
rebellionProgress, suppressionScore, remainingDays, or requiredEvidenceCount.
The profile channel list is an allow-list for typed evidence references, not a
calculation.

### 2.5 Bootstrap from T018

T018 creates an active rebellion when political and crisis prerequisites pass.
That creation event can legitimately bootstrap a persistence episode only in
the narrow identity sense:

1. the event identifies the Conflict, Faction, Country, and selected static
   profile;
2. the event proves that the rebellion episode was authoritatively created;
3. the event does not prove indefinite operational continuity;
4. the resulting lifecycle is bootstrapped until a separate typed operational
   evidence event is accepted.

Therefore the rule is not persistence equals true because a rebellion exists.
The bootstrap is a one-time episode identity and provenance link. A later
persistence transition requires an explicit evidence event whose channel and
kind are authorized by the profile.

If an older scenario has no persistence profile, the future implementation
must preserve the current Conflict behavior and must not invent a profile or
episode from Faction organization, grievance, resources, or a map count.

### 2.6 Positive persistence evidence

Positive evidence is a typed, causally linked action/event that references an
authorized channel. Candidate kinds are:

- organizationalContinuity: an explicitly authored or produced
  organization-continuity fact;
- commandContinuity: an explicitly authored or produced command-continuity
  fact;
- logisticsAccess: an explicitly authored or produced logistics-access fact;
- externalSupport: an explicitly authored or produced external-support fact
  with an identified actor and provenance.

These are categories, not scores. The future implementation must define one
authoritative producer for each enabled kind. A raw Faction resource,
organization, grievance, Region unrest, absence of a front, or elapsed time
is not evidence merely because it has a nonzero or changing value.

Evidence may keep an episode represented when no front or faction LandHex is
present. It does not grant territory, derive a front, or create an outcome.
Evidence from a player, heuristic, or LLM path is valid only after it has
passed the common typed ActionRecord validation and has produced the
corresponding GameEvent.

### 2.7 Collapse evidence

Persistence collapse requires explicit evidence of loss of operational
capacity. The minimum allowed sources are:

- an authorized operational-collapse event that identifies the failed
  capacity and its cause; or
- an explicit suppression or demobilization event owned by the separate
  settlement/closure domain.

No-front, zero faction LandHex, a lower grievance, lower organization, a
country metric, a long quiet interval, or a random roll cannot produce
collapse. Collapse does not directly delete Conflict, write State
Dissolution, change Government, or mutate LandHex.

The persistence episode can record collapse evidence so that a later closure
step has a causal basis. The closure domain remains the owner of the
decision to close the conflict and of the typed request sent to the existing
Conflict outcome boundary.

## 3. Domain B: settlement, demobilization, and suppression closure

### 3.1 Purpose and non-goals

The closure domain answers a different question:

    Has an explicit political or operational closure process produced
    sufficient implementation, compliance, demobilization, or suppression
    evidence for a typed Conflict outcome request?

It distinguishes negotiation from implementation and implementation from
closure. It may represent a negotiated settlement, a demobilization, or an
explicit suppression outcome. It does not replace the persistence domain and
does not use a settlement package as evidence that the rebellion has already
ended.

### 3.2 Static settlement authoring candidate

A later settlement authoring seam may use the following minimum concepts:

    SettlementTermId

    SettlementTermKind =
      "politicalGuarantee"
      | "amnesty"
      | "demobilization"
      | "implementationCommitment"

    SettlementTermDefinition {
      id: SettlementTermId
      kind: SettlementTermKind
      countryId: CountryId
      factionId: FactionId
      name: string
    }

    SettlementPackageId

    SettlementPackageDefinition {
      id: SettlementPackageId
      countryId: CountryId
      factionId: FactionId
      termIds: readonly SettlementTermId[]
      authorizedGuarantorCountryIds?: readonly CountryId[]
    }

    ScenarioDefinition {
      settlementTerms?: readonly SettlementTermDefinition[]
      settlementPackages?: readonly SettlementPackageDefinition[]
    }

This package is an allow-list of typed terms and authorized participants. It
is not an accepted agreement, a completed peace, a Government transition, a
LandHex transfer, a State Dissolution, a victory result, or a scheduled
resolution. A display name is not authoritative narrative evidence.

Static validation must reject duplicate term or package IDs, unknown
Countries, unknown Factions, Faction/Country mismatch, empty term sets,
duplicate term references, unknown term references, terms from a different
Country/Faction, unknown guarantor Countries, and any field that pre-authors
acceptance, compliance, final outcome, closure tick, LandHex target, or
automatic effect.

An authored guarantor list does not create a guarantee. A later explicit
action/event must identify the guarantor, its role, the terms covered, and
the implementation or compliance evidence. Foreign Countries are not
silently made parties by a package reference.

### 3.3 Future settlement runtime lifecycle

The minimum future runtime concept is:

    SettlementEpisode {
      id: SettlementEpisodeId
      conflictId: ConflictId
      packageId?: SettlementPackageId
      partyCountryId: CountryId
      partyFactionId: FactionId
      lifecycle:
        "open"
        | "negotiating"
        | "accepted"
        | "implementing"
        | "compliant"
        | "breached"
        | "demobilizationEvidenced"
        | "suppressionEvidenced"
        | "closed"
      termEvidenceIds: readonly SettlementTermEvidenceId[]
      implementationEvidenceIds: readonly SettlementImplementationEvidenceId[]
      complianceEvidenceIds: readonly SettlementComplianceEvidenceId[]
      breachEvidenceIds: readonly SettlementBreachEvidenceId[]
      closureEvidenceIds: readonly SettlementClosureEvidenceId[]
      sourceActionIds: readonly ActionRecordId[]
      sourceEventIds: readonly GameEventId[]
    }

Closure eligibility is derived from the authoritative evidence set. It is not
a timer or an unconditional boolean set by acceptance:

- accepted means the parties accepted typed terms;
- implementing means an implementation action/event is in progress or
  explicitly recorded;
- compliant means the required implementation/compliance evidence exists;
- breached means an explicit breach event exists and may reopen bargaining;
- demobilizationEvidenced or suppressionEvidenced means the corresponding
  explicit operational closure evidence is present;
- closed means a separate typed closure action/event has passed validation and
  the existing Conflict outcome boundary has accepted the result.

The exact final status names may follow repository conventions, but the
semantic separation is mandatory. Acceptance alone must not resolve Conflict.
There is no scheduled close tick, automatic decay, or random settlement
result.

### 3.4 Typed terms and evidence

The term definitions establish the allowed vocabulary. Runtime events carry
the proof:

- a political guarantee event identifies the guarantor, terms, and source;
- an amnesty event identifies the covered faction and terms;
- a demobilization event identifies the demobilized capacity and actor;
- an implementation event identifies the effect, terms, and source;
- a compliance event identifies the observed implementation condition;
- a breach event identifies the violated term and cause;
- suppression evidence identifies the authorized suppressing actor and the
  operational capacity or command structure explicitly affected.

Each event must have ActionRecord provenance, actor identity, tick, scenario
version, subject IDs, and cause IDs. Free-form narrative may be retained for
display only and cannot authorize a state transition.

### 3.5 Closure and existing Conflict outcome boundary

The existing applyConflictOutcome() path remains the typed Conflict status
and outcome sink. It is not evidence generation and must not be called at
proposal acceptance.

A later closure implementation may:

1. validate a typed settlement, demobilization, or suppression closure
   request against the SettlementEpisode and its evidence;
2. emit a causally linked closure GameEvent;
3. pass an allowed typed ConflictOutcome through applyConflictOutcome();
4. record the closure provenance and keep the persistence episode's terminal
   evidence linked to the same conflict.

The closure path must not directly assign Conflict.status, delete Conflict,
write State Dissolution, or create a Government transition unless a future
task explicitly owns that typed outcome. T023 remains the sole State
Dissolution owner. A status-quo closure and a Government transition must not
be conflated with settlement success.

Existing Intervention Catalog definitions and commitments may be referenced
only through a future explicit contract that says which typed settlement term
they implement. Their current administrative effects, capacity, source
ActionRecord, and completion rules remain unchanged. The term
implementation must not silently reinterpret an existing intervention as a
peace agreement.

Existing Political Proposal currently represents an intervention request and
its accepted/rejected lifecycle. It cannot be renamed or treated as a
settlement episode. A future settlement proposal needs a new subject kind and
validation contract or another explicit bounded action type.

## 4. Existing-system boundary matrix

The relation labels are:

- IDENTITY_INPUT
- OBSERVATION_ONLY
- MAY_BE_EXPLICITLY_REFERENCED
- FUTURE_MUTATION_SINK
- MUST_REMAIN_SEPARATE
- FORBIDDEN_AS_WRITER

| Existing system or state | Relation | Boundary rule |
| --- | --- | --- |
| Conflict identity and participant IDs | IDENTITY_INPUT; MAY_BE_EXPLICITLY_REFERENCED | Both future episodes bind to one existing Conflict and its Country/Faction participants. |
| Conflict.status and typed ConflictOutcome | FUTURE_MUTATION_SINK; MUST_REMAIN_SEPARATE | Closure may reach the existing typed outcome sink after evidence validation; status is not persistence evidence. |
| T018 rebellion creation | IDENTITY_INPUT; MAY_BE_EXPLICITLY_REFERENCED | REBELLION_STARTED may bootstrap an episode identity, but eligibility is not continuing evidence. |
| suppressIneligibleRebellions() | MAY_BE_EXPLICITLY_REFERENCED; MUST_REMAIN_SEPARATE | Its narrow existing suppression rule remains unchanged and is not a generic operational-collapse writer. |
| T021 territorial intent derivation | OBSERVATION_ONLY; MUST_REMAIN_SEPARATE | Territorial intent can observe domain state but does not own persistence or settlement. |
| T021 LandHex.controller mutation | FORBIDDEN_AS_WRITER | New domains cannot mutate LandHex; all territorial change stays on the existing authority path. |
| Derived front edges | OBSERVATION_ONLY; FORBIDDEN_AS_WRITER | Fronts are a current territorial projection and cannot prove peace, defeat, or persistence. |
| Faction resources, organization, grievance, currentStrategy | OBSERVATION_ONLY; MUST_REMAIN_SEPARATE | Existing values may inform T018/T021 read models but cannot become a hidden persistence or suppression score. |
| Region unrest, radicalism, scarcity, stateControl | OBSERVATION_ONLY; MUST_REMAIN_SEPARATE | Region signals do not create operational evidence or settlement compliance. |
| Intervention Catalog and commitments | MAY_BE_EXPLICITLY_REFERENCED; MUST_REMAIN_SEPARATE | Only an explicit future term contract may reference an intervention's implementation effect. |
| Political Proposal lifecycle | MAY_BE_EXPLICITLY_REFERENCED; MUST_REMAIN_SEPARATE | Current interventionRequest semantics remain unchanged; settlement needs an explicit new contract. |
| ActionRecord | FUTURE_MUTATION_SINK; MAY_BE_EXPLICITLY_REFERENCED | Future player, heuristic, and LLM proposals enter through validated ActionRecord provenance. |
| GameEvent/EventStore | FUTURE_MUTATION_SINK; MAY_BE_EXPLICITLY_REFERENCED | Authoritative transitions emit deterministic events with source and cause IDs. |
| Agenda and other read models | OBSERVATION_ONLY; FORBIDDEN_AS_WRITER | Read models cannot create, close, or mutate either domain. |
| T022 Order Consolidation | MUST_REMAIN_SEPARATE; FORBIDDEN_AS_WRITER | Rebellion persistence or closure cannot write Order Consolidation state. |
| T023 State Dissolution | MUST_REMAIN_SEPARATE; FORBIDDEN_AS_WRITER | No F05_FIX21 domain writes State Dissolution or calls its path. |
| SerializedSimulationSnapshotV7 | MUST_REMAIN_SEPARATE | V7 remains unchanged in F05_FIX21; future runtime serialization requires a separately authorized persistence decision. |

The distinction between FUTURE_MUTATION_SINK and FORBIDDEN_AS_WRITER is
intentional. ActionRecord, GameEvent, and the existing typed Conflict outcome
are approved provenance or sink boundaries for a later implementation. The
new domains cannot write those boundaries directly without validation, and
read models, LandHex, T022, and T023 cannot be used as substitute writers.

## 5. Proof obligations

### 5.1 Persistence bootstrap

T018 supplies the authoritative creation identity: Conflict ID, participants,
Country, Faction, start tick, and the accepted static persistence profile.
The bootstrap event creates a persistence episode in the bootstrapped state.
It does not assert continued capacity. A later typed operational event must
move the episode to evidenced. Old scenarios without a profile retain current
behavior and do not receive an inferred episode.

### 5.2 Positive persistence evidence

Positive evidence is a typed event tied to an authored channel, a validated
ActionRecord, an actor, and cause IDs. The event must describe a concrete
operational fact in one of the closed channel kinds. A nonzero scalar, an
active Conflict status, an absent front, a faction map count, or a long
silence is not positive evidence.

### 5.3 Collapse evidence

Collapse requires an explicit operational-collapse or
suppression/demobilization event. The event identifies the capacity or
process affected and its authoritative cause. The persistence domain records
the evidence; the closure domain determines whether the Conflict can close.
No map absence, threshold, time rule, or random result is accepted.

### 5.4 Territory independence

The invariant remains:

    LandHex.controller = sole physical territorial authority
    fronts = derived from current territorial state
    persistence != territory

The persistence profile has no LandHex target, controller field, front field,
or territorial effect. A persistence evidence event cannot seize, release, or
teleport a LandHex.

### 5.5 Settlement implementation

Acceptance records agreement on typed terms. It does not close Conflict.
Implementation and compliance evidence must be recorded separately. A
demobilization or suppression event may provide closure evidence without a
negotiated package, but it still requires explicit actor and cause
provenance. Only after closure eligibility is established can a typed request
reach applyConflictOutcome().

### 5.6 Same-conflict coexistence

A single rebellion Conflict may simultaneously have:

| Coexisting state | Meaning |
| --- | --- |
| Persistence episode bootstrapped or evidenced | The operational episode has identity and, when evidenced, explicit continuity facts. |
| Zero faction LandHex and no front | Current territorial projection is empty; this does not end the episode. |
| Faction-controlled LandHex and derived front | T021 has current physical territory; this does not prove settlement. |
| Settlement episode open, negotiating, accepted, or implementing | A political closure process exists while the rebellion remains active. |
| Settlement episode breached | The process has explicit breach evidence; persistence is not silently deleted and bargaining may be reopened through a new bounded action. |
| Closure evidence and typed closure request | Closure is possible only after evidence validation and the existing Conflict outcome sink accepts it. |

Only one domain owns each mutation:

- persistence writer: future validated operational evidence events;
- settlement writer: future validated terms, implementation, compliance,
  breach, demobilization, and suppression events;
- territorial writer: existing LandHex controller path;
- Conflict status/outcome writer: existing applyConflictOutcome() path;
- State Dissolution writer: T023 only.

No domain writes another domain's state by assigning a shared active flag.

### 5.7 Replay and determinism

Every future authoritative transition must carry:

- stable event and action IDs;
- Conflict, episode, profile/package, Country, and Faction IDs;
- actor/source identity;
- scenario version and observed tick;
- cause IDs and referenced term/channel IDs;
- an idempotence key where an external action may be retried.

Runtime collections must be canonicalized by stable IDs before comparison or
serialization. Duplicate evidence delivery must be a no-op after the first
accepted event. Save/load replay must apply the same ordered ActionRecord and
GameEvent sequence and reach the same persistence and settlement states as
uninterrupted replay. Insertion order must not change a result.

F05_FIX21 does not add these runtime fields to SerializedSimulationSnapshotV7.
When a later runtime task is authorized, it must decide the persistence
contract explicitly and update snapshot encoding only in that task. V8 is not
introduced here.

### 5.8 Player, heuristic, and LLM boundary

Player and heuristic decisions may propose only schema-valid typed actions
whose target Conflict, episode, channel, package, term, and parties are
present in the authoritative decision context. LLM output is an input to the
same proposal validator. It cannot invent a channel, term, guarantor,
evidence, actor, or outcome and cannot mutate either domain directly.

### 5.9 No pacing cheat

The design remains valid if a late-state diagnostic still has a long silence.
No timer, cooldown, countdown, decay, random event, scalar threshold, or
automatic closure is added merely to shorten that silence. A future change
must be justified by new typed operational or settlement evidence.

## 6. First implementation direction

FIRST_IMPLEMENTATION_DIRECTION: PERSISTENCE_AUTHORING_FIRST

The persistence authoring seam is the smallest first step because it
establishes stable scenario identity and an explicit vocabulary for future
operational evidence without claiming that any evidence already exists. It
can be validated independently in the same discipline as F05_FIX17:

1. add optional ScenarioDefinition channel/profile fields;
2. add branded IDs and closed categorical kinds;
3. validate identity, Country/Faction capability, channel membership, and
   duplicate/foreign references;
4. preserve old scenarios when fields are absent or empty;
5. add no WorldState runtime field, ActionRecord, GameEvent, Conflict
   outcome, LandHex writer, or persistence version.

Settlement authoring is designable but should not be the first implementation
direction. A SettlementPackage can be authored independently, but its runtime
episode must bind to a stable Conflict and must not be mistaken for accepted
or implemented peace. Establishing the persistence profile identity first
reduces the risk that settlement terms become an unbound story object. The
later settlement seam must still be separate and must validate typed terms,
participants, and implementation boundaries.

The next task is therefore authorized only to implement the static persistence
authoring seam and validation described above. It must not begin F05_FIX22,
Gate 1F, or V02.

## 7. Grounding references

The design extends the accepted [F05_FIX20 rebellion persistence and
settlement grounding](F05_FIX20_REBELLION_PERSISTENCE_SETTLEMENT_GROUNDING.md).
Its research basis includes:

- [Kalyvas, The Logic of Violence in Civil War](https://www.cambridge.org/core/books/logic-of-violence-in-civil-war/3DFE74EA492295FC6940D58CA8EF4D5C)
- [Fearon and Laitin, Ethnicity, Insurgency, and Civil War](https://doi.org/10.1017/S0003055403000534)
- [Walter, Committing to Peace](https://www.jstor.org/stable/j.ctv1j13z61)
- [Matanock and Lichtenheld implementation literature](https://doi.org/10.1017/S0007123421000491)

## 8. Completion markers

F05_FIX21: COMPLETE / AWAITING_CHATGPT_REVIEW
NEXT_AUTHORIZED_TASK_ID: NONE
GATE1F_CHATGPT_DECISION: NOT_READY
V02: NOT_STARTED
