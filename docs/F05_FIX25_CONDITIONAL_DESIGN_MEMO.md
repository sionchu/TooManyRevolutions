# Conditional F05_FIX25 design memo

STATUS: CONDITIONAL DESIGN MEMO ONLY
SOURCE_TASK: F05_FIX24
SOURCE_CLASSIFICATION: REBELLION_EVIDENCE_REQUIRES_NEW_OPERATIONAL_SUPPORT_DOMAINS
SOURCE_NEXT_IMPLEMENTATION_READINESS: REBELLION_OPERATIONAL_SOURCE_DOMAIN_DESIGN
AUTHORIZATION: NONE

This memo is a bounded design handoff. It is not an F05_FIX25 result, task
authorization, production implementation, persistence change, Gate 1F decision,
or V02 start.

## 1. Smallest defensible problem

FIX24 established that `REBELLION_STARTED` plus the FIX23 persistence episode is
bootstrap identity/provenance only. It does not prove that an organization,
command relation, logistics route, or external sponsor remains operational.
The smallest next problem is therefore not “add a rebellion persistence score.”
It is:

> define one typed, replayable source domain that can record a discrete
> organizational activity fact for one conflict-scoped rebellion episode,
> without reinterpreting existing aggregates or writing any conflict outcome.

`organizationalContinuity` is the narrowest first channel because its minimum
fact can be stated as an activity by an identified organization unit or role.
`commandContinuity`, `logisticsAccess`, and autonomous `externalSupport` should
remain design follow-ups until their distinct actors and relations are defined.

## 2. Source and domain ownership

The proposed future source domain is a channel-specific
`RebellionOrganizationDomain`, scoped by `conflictId` and linked to the accepted
FIX23 episode. It must own typed organization identities and activity facts, not
derive them from `Faction.organization`.

Minimum conceptual ownership:

| Layer | Smallest future responsibility | Explicit non-responsibility |
| --- | --- | --- |
| Static authoring | declare allowed organization actor/role identities and episode binding rules, if scenario authorship is needed | does not assert that the organization is active |
| Runtime source domain | accept one discrete organization activity fact with actor, role/relation, episode, and provenance | does not compute a persistence score, duration, decay, quorum, or victory |
| Action boundary | accept only a schema-valid source action from an authorized typed issuer or an explicitly labeled external input | player/heuristic/LLM prose cannot invent a fact or mutate state directly |
| Event boundary | append `ORGANIZATION_ACTIVITY_RECORDED` with source ActionRecord or existing typed-event provenance, observed tick, cause IDs, and idempotence key | does not start/resolve/delete a Conflict or change LandHex |
| Read model | expose evidence provenance and channel presence to diagnostics/Agenda only after the authoritative event exists | does not turn absence of evidence into suppression, peace, or defeat |

The common envelope should preserve the FIX24 minimum contract:

```text
conflictId / episode identity
channelId / channel kind
actor or issuer identity
subject/recipient identity when distinct
source ActionRecord or existing typed event
GameEvent provenance
observedAtTick
causeIds
idempotence key
```

The first design should not generalize this envelope into a numeric
`operationalStrength`, `continuity`, or `remainingCapacity` field. Channel
meaning belongs to the channel domain.

## 3. Action and event shape

The likely future action is a typed organization-activity request, not a free
“evidence exists” toggle. A request must name the organization actor or role,
the episode, the discrete activity kind, the issuer/source, and the source
provenance. If the only defensible source is external input, the record must be
marked as externally supplied and must not be presented as autonomous simulation
observation.

The likely future event is:

```text
ORGANIZATION_ACTIVITY_RECORDED
```

Its payload should contain identity and provenance only: episode, organization
actor/role, activity kind, source action/event, observed tick, cause IDs, and a
deterministic idempotence key. It should reject unknown episodes, bootstrap-only
claims, missing source provenance, forward causes, duplicate keys, and actor
identity outside the episode contract.

This event is evidence append-only. It must not call `applyConflictOutcome()`,
write `LandHex.controller`, change a derived front, transition Government,
change `RunOutcome`, or invoke settlement/demobilization/suppression logic.

## 4. Persistence and replay implications

No persistence change is part of this memo. A later authorized implementation
would need to choose explicitly between:

1. a V8-compatible extension whose migration, unknown-field, corruption, and
   replay contracts are reviewed; or
2. a separately authorized persistence-version task.

It must not silently add a V9 field or treat an in-memory evidence list as
durable. Once evidence is durable, uninterrupted and save/load runs with the
same accepted source actions must produce identical evidence IDs, event order,
cause IDs, observed ticks, and derived read models. Snapshot corruption and
episode/profile mismatch must reject deterministically. Evidence persistence
must remain separate from settlement, conflict outcome, and territorial state.

## 5. Focused verification plan for a future authorized task

The smallest future test set would cover:

- authoring: duplicate organization actor/role IDs, foreign episode binding,
  missing actor, and invalid channel membership are rejected;
- provenance: bootstrap `REBELLION_STARTED` alone cannot create positive
  activity evidence;
- action boundary: valid typed source action is accepted, free player fact
  declaration is rejected, and LLM/heuristic input cannot mutate WorldState;
- event boundary: one activity event has deterministic ID/sequence/tick/cause
  data and duplicate idempotence rejects a second copy;
- episode boundary: unknown or mismatched `conflictId`/episode/profile is
  rejected;
- replay: uninterrupted versus save/load replay has identical evidence and
  EventStore history;
- insertion order: organization actor arrays and source candidates produce the
  same canonical event order;
- negative controls: changing Faction organization, currentStrategy,
  resources, foreignLinks, ContactGraph edges, or elapsed time alone emits no
  activity evidence;
- writer isolation: the evidence path leaves LandHex, Conflict outcome,
  Government, RunOutcome, T022/T023 state, and settlement state unchanged.

These tests validate source semantics. They do not authorize a continuity score,
automatic decay, or autonomous crisis resolution.

## 6. Why this may not improve Gate 1F

A typed organizational activity event can make one operational fact auditable,
but it does not by itself provide command succession, logistics access, external
sponsorship, operational collapse, settlement, demobilization, suppression, or
conflict resolution. Gate 1F could therefore remain `NOT_READY` even if this
small seam is implemented correctly.

It can plausibly improve autonomous late-state reassessment only if an
authoritative producer or source actor can generate new facts from real typed
state/actions. A manual or external-input-only seam improves provenance but does
not prove autonomous reassessment. A read-model change that merely displays an
old aggregate under a new label would not improve the late-state behavior.

## 7. Forbidden shortcuts

The conditional successor must not:

- map `Faction.organization`, `resources`, `grievance`, `influence`,
  `currentStrategy`, `foreignLinks`, Country weakness, scarcity, ContactGraph
  reachability, LandHex ownership, or active Conflict to operational evidence;
- relabel `FUND_MOVEMENT`, `INTERVENTION_*`, `POLITICAL_PROPOSAL_*`, or
  `REBELLION_STARTED` without an existing matching semantic contract;
- use thresholds, weights, scores, majority/quorum, probability, RNG, timer,
  cooldown, countdown, or automatic decay;
- allow a player, heuristic, or LLM to directly declare an actor, supply route,
  command structure, sponsor, or evidence fact;
- write LandHex control, fronts, Conflict outcomes, Government transitions,
  State Dissolution, settlement, demobilization, or suppression state;
- change persistence to V9, create an F05_FIX25 authorization, approve Gate 1F,
  or start V02.

## 8. Recommendation

If ChatGPT later authorizes a successor, first review a channel-specific static
source contract and actor/provenance model for `organizationalContinuity` only.
Do not implement all four channels in one vertical slice. After that design is
accepted, a separate implementation task can decide whether a valid typed source
producer exists; otherwise the result should remain an explicit external-input
boundary rather than claiming autonomous rebellion persistence.
