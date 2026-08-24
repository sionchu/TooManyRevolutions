# F05_FIX11 — FUND_MOVEMENT Target & Commitment Grounding

TASK_ID: `F05_FIX11`
STATUS: `DESIGN_ONLY / NO PRODUCTION IMPLEMENTATION`
START_COMMIT: `f65056593ff08b73c6296235eba5251dddcfa828`
TASK_COMMIT: `fd8dc4f98a1813a5d0f5848232fbffac3131b600`
BASE_BRANCH: `master`

This document records the F05_FIX11 grounding decision. It does not add an
action field, commitment record, resource writer, resolver, event, persistence
field, or gameplay consequence.

## Decision fields

```text
PRIMARY_CLASSIFICATION: FUND_MOVEMENT_REQUIRES_NEW_AUTHORING_SEAM
FUND_MOVEMENT_SEMANTIC: ALLOCATE_EXISTING_ACTOR_RESOURCES
TARGET_DOMAIN: REGION_SINGLE
COMMITMENT_SEMANTIC: EARMARK_EXISTING_FACTION_RESOURCES
AMOUNT_SEAM: SCENARIO_AUTHORED_AMOUNT_REQUIRED
NUMERIC_MAGNITUDE_STATUS: NOT_GROUNDED
FIRST_CONSUMER_BOUNDARY: AGENDA_REASSESSMENT
COMMITMENT_LIFECYCLE_STATUS: TARGET_SCHEMA_ONLY_DESIGNABLE
REPEAT_BOUNDARY: ACTIVE_SAME_ACTOR_TARGET_BLOCKS_DUPLICATE
PERSISTENCE_DECISION: FUTURE_VERSION_REQUIRED_FOR_AUTHORITATIVE_COMMITMENT
NEXT_IMPLEMENTATION_READINESS: NONE
```

The classification means that the political mechanism and the narrow target
domain are understandable, but a future action target and amount must be
scenario/content-authored before any implementation. The existing repository
does not yet contain the authoring object, commitment state, lifecycle
evidence, or magnitude required to make a production action honest. No
concrete `RegionId` is selected here.

## 1. Scope and evidence boundary

F05_FIX11 reconciles the fixed R01–R06 source pack with the repository facts in
F05_FIX5, F05_FIX9, F05_FIX10, F04B, the commitment-kernel design document, and
the current simulation source. The source pack grounds mechanisms and failure
modes; it does not provide a TMR cost, duration, conversion ratio, or success
formula.

The following remain outside this decision:

- production `FactionActionPayload` or `targetRegionId` changes;
- an authoritative faction commitment record, debit/reservation/earmark
  writer, resolver, or new event;
- numeric cost, effect, duration, organization/grievance/influence delta, or
  resource-to-success conversion;
- direct T018 crisis creation, T021 combat/conflict strength, LandHex control,
  continuity, terminal outcome, or hidden recovery;
- a second LOBBY template, BARGAIN/counteroffer, ORGANIZE consequence,
  chooser rewrite, generic mobilization/political mana, cooldown/countdown,
  runtime solver, UI/V02, or Gate 1F/F05_FIX12 authorization.

## 2. Phase A — exact action meaning

`FUND_MOVEMENT` is defined narrowly as:

> an actor-owned faction allocating an explicitly authored portion of its
> existing political resource stock to a named local political-mobilization
> target.

This is `ALLOCATE_EXISTING_ACTOR_RESOURCES`. It is not a claim that the action
raises new resources, transfers funds to another represented organization, or
is generic political spending. The current `Faction.resources` field is an
existing non-negative political-resource stock. The current chooser guard
(`resources >= 0.5`) is only eligibility evidence; it is not an action cost.

The source pack supports the mechanism at this level: resources,
organization, discontent, opportunity, local context, and strategy are
distinct contributors to mobilization. R01/R02 do not define a deterministic
resource-to-success conversion. R03/R04 support local organizations
mobilizing funds and members, while R05/R06 warn that heterogeneous resource
configurations and strategic capacity prevent a universal scalar payoff.

## 3. Phase B — target-domain evaluation

The target decision evaluates every candidate. `REGION_SINGLE` is a domain
decision, not a selected fixture Region.

| Candidate | Source mechanism | Repository state/consumer | Ambiguity or failure mode | Verdict |
|---|---|---|---|---|
| One explicit `RegionId` | R03 and R04 are explicitly local-organization/community mechanisms; R02 keeps opportunity and organization distinct. | `Region` is the political/economic/social aggregate. `factionPressure` exposes relevant `regionIds`; T021 consumes affected-Region local mobilization; Agenda already carries affected Region IDs. | Current `FactionActionPayload` is exactly `{ factionId }`. F05_FIX10 observes two relevant Regions, `ideology-fixture.capital` and `ideology-fixture.industrial`; silently choosing either would invent targeting. | **Only defensible target domain, but requires an explicit authoring/action seam.** No concrete RegionId is chosen. |
| Explicit set of `RegionId`s | Local organizations can have more than one locality, but R01–R06 provide no TMR set cardinality or selection rule. | The current regional observation is an aggregate over all relevant Regions; it is not an authored action target. | “All relevant Regions” would be an inferred set, not an explicit target. A set also needs stable ordering, relevance validation, and a bounded scope owner. | **Not grounded for the current seam.** |
| Whole-Country political scope | The source pack does not turn national actor identity into a universal national payoff; R04 instead preserves locality and indirect resource mobilization. | `Faction.countryId` identifies the actor’s country, not a target. No existing Country-wide FUND_MOVEMENT consumer is present. | A country-wide action would erase the local consumer boundary and invite an ungrounded global effect. | **Not grounded.** |
| Another existing authoritative object | No R01–R06 mechanism identifies a LandHex, Conflict, Agenda row, or ActionRecord envelope as the funded political target. | LandHex controller is the sole physical territorial authority; Conflict is a war/conflict domain; FactionId is already the actor; Agenda is a read model; intervention commitments are player administrative actions. | Reusing any of these would cross a forbidden authority boundary or confuse actor, target, and presentation. | **No suitable existing object.** |
| No target yet | This is the safe fallback if an authoring seam cannot supply an explicit target. | Current payload and fixture do not supply a target. | Treating the absence as the final semantic answer would discard the local mechanism and existing Region-scoped consumer topology. | **Not selected as the domain classification; remains the rejection result for missing/invalid authored targets.** |

The future target contract must carry an explicit Region identity and
deterministically reject an unknown, foreign, or currently irrelevant Region.
It must not infer a target from faction name, ideology label, array/sort order,
highest unrest/radicalism/organization, conflict front, or fixture layout.
`LandHex` remains out of scope: it is the physical movement/control substrate,
not the political-mobilization target.

## 4. Phase C — actor-owned commitment semantics

The narrowest design direction is `EARMARK_EXISTING_FACTION_RESOURCES`.

An earmark is an explicitly authored allocation that remains owned by the
Faction and does not imply a debit in this task. If a future implementation
uses this direction, the commitment must also reduce the actor’s available
resource capacity for competing commitments; otherwise the earmark becomes a
hidden free resource pool. That availability projection, its amount, and its
resolution/rejection conditions are not implemented here.

This choice does not invent `effort`, `mobilization points`, `campaign power`,
or `political capital`. It keeps ownership in the existing `Faction.resources`
stock and treats the future commitment record as an allocation/provenance
object, not a replacement meter. A future task may prove a reserve or spend
semantics instead, but F05_FIX11 does not choose a debit or amount.

The current repository has no faction-action commitment state. The existing
`WorldState.interventionCommitments` are scenario-owned administrative player
interventions and cannot be silently reused as faction movement commitments.

## 5. Phase D — amount authoring

`AMOUNT_SEAM` is `SCENARIO_AUTHORED_AMOUNT_REQUIRED` and
`NUMERIC_MAGNITUDE_STATUS` is `NOT_GROUNDED`.

The future content/action seam must own a bounded amount profile and validate
it against the actor’s existing resource stock, target relevance, provenance,
and deterministic acceptance rules. No default amount, percentage, duration,
conversion ratio, or organization/resource effect is selected here.

The amount must not be derived merely from grievance, organization, influence,
unrest, state weakness, conflict strength, Region count, or the `0.5` chooser
threshold. R01–R06 explicitly do not support such a universal numeric table;
R04’s non-monotonic result and R05/R06’s heterogeneity make that shortcut
especially unsafe.

## 6. Phase E — first legitimate consumer boundary

`FIRST_CONSUMER_BOUNDARY` is `AGENDA_REASSESSMENT`.

This is a bounded, non-war, player-visible boundary: the existing Agenda
read model already observes faction resources/organization and regional
pressure, and can later expose an accepted/active/rejected commitment as
evidence without turning it into a scalar success or combat modifier. F05_FIX11
does not add a commitment reader or Agenda entry.

T018 and T021 remain existing state/input paths, but they are not the first
consumer selected here. They are crisis/conflict-adjacent and may only consume
future authoritative fields through a separately grounded action consequence;
R01–R06 do not authorize a direct crisis writer or combat-strength bonus.
No commitment may write a Conflict, crisis, LandHex controller, continuity,
terminal outcome, or hidden recovery.

## 7. Phase F — lifecycle and repeat boundary

`COMMITMENT_LIFECYCLE_STATUS` is `TARGET_SCHEMA_ONLY_DESIGNABLE`: an explicit
target schema and deterministic validation shape can be described, but the
current state has no authoritative faction commitment, authored amount, or
resolution evidence from which to implement a lifecycle.

If a later authoring/implementation task supplies those missing inputs, the
only semantic lifecycle permitted by this design is a state-evidence chain such
as:

```text
accepted -> active -> resolved
                   -> rejected
                   -> cancelled
```

Each transition would need a named validation or consumer result. No transition
may be based only on “after N days,” a countdown, or an interaction-count
timer.

`REPEAT_BOUNDARY` is the minimum future identity rule
`ACTIVE_SAME_ACTOR_TARGET_BLOCKS_DUPLICATE`: an active commitment for the same
Faction and explicit Region target cannot be accepted as a free duplicate.
This is a future deterministic reject/no-op rule, not a runtime cooldown and
not implemented in F05_FIX11. Until an authoritative commitment exists, the
current action remains repeatable and therefore cannot claim this boundary.

## 8. Phase G — persistence and replay

`PERSISTENCE_DECISION` is
`FUTURE_VERSION_REQUIRED_FOR_AUTHORITATIVE_COMMITMENT`.

The current `SerializedSimulationSnapshotV4` remains unchanged. A future
authoritative commitment would need a versioned schema containing, at minimum:

- stable commitment identity;
- source `ActionId` and action provenance;
- actor `FactionId`;
- explicit target `RegionId`;
- authored amount and amount provenance;
- lifecycle status and deterministic rejection/no-op reason;
- duplicate handling independent of insertion order;
- uninterrupted versus save/load replay equality.

The current ActionRecord envelope remains generic, but
`decodeFactionAction()` deliberately accepts only the version-1 payload with
the single `factionId` key. A future target/commitment schema must not be
smuggled into V4 or into the current decoder.

## 9. Primary classification and readiness

The exact classification is:

```text
FUND_MOVEMENT_REQUIRES_NEW_AUTHORING_SEAM
```

The local Region target domain and existing-resource earmark semantics are
clear enough to design, but the action still needs an explicit content-owned
target and amount seam. The current repository also lacks the authoritative
commitment/lifecycle state needed for a production consumer. Therefore:

```text
NEXT_IMPLEMENTATION_READINESS: NONE
```

This does not authorize a target-field implementation. ChatGPT/user review
remains required; Gate 1F is not approved and F05_FIX12 is not authorized.

## 10. Claim-to-source and repository ledger

| Claim | Class | Evidence | Boundary |
|---|---|---|---|
| Grievance alone is insufficient; resources and relationships matter. | Source-supported | R01, DOI `10.1086/226464` | No numeric resource-to-success rule. |
| Resources, organization, opportunity, and discontent are distinct; organization matters. | Source-supported | R02, DOI `10.1146/annurev.so.09.080183.002523` | No universal deterministic payoff. |
| Local agency/effort predicts volunteer labor, revenue, and membership; structure and strategy differentiate outcomes. | Source-supported | R03, DOI `10.2307/2096309` | Supports represented effort/commitment and local context, not a fixed action delta. |
| Local community characteristics affect action indirectly through resource mobilization; more money is not simply more action. | Source-supported | R04, DOI `10.1016/0362-3319(86)90033-9` | Locality is relevant; monotonic resource bonus is not. |
| Resource types/configurations and support sources are heterogeneous. | Source-supported | R05, DOI `10.2307/2096310` | No generic conversion ratio. |
| Better resources do not automatically win; strategic capacity and information matter. | Source-supported | R06, DOI `10.1086/210398` | No direct success, crisis, or combat bonus. |
| `FactionActionPayload` is `{ factionId }`; accepted faction actions write only strategy state/event. | Repository fact | `src/sim/state/action.ts`, `src/sim/systems/factionPressure.ts`, F05_FIX5 | No action-specific target, cost, commitment, or effect writer. |
| Region is the political/economic/social aggregate; LandHex is physical authority. | Repository/GDD fact | `src/sim/state/region.ts`, `src/sim/state/world.ts`, GDD/ARCHITECTURE | LandHex is not a FUND_MOVEMENT target. |
| T018/T021 and Agenda read existing faction/regional state. | Repository fact | `politicalCrisis.ts`, `conflictResolution.ts`, `readModels/agenda.ts`, F04B/F05_FIX5 | Readers do not prove a FUND_MOVEMENT writer or numeric consequence. |
| A future target/commitment requires explicit provenance and versioned replay. | Design inference constrained by architecture | F05_FIX10 kernel, persistence V4 | No V4 change or runtime implementation in this task. |

## 11. Explicitly unsupported claims

F05_FIX11 does **not** claim that FUND_MOVEMENT:

- succeeds, increases organization, reduces grievance, increases influence, or
  changes any scalar by a fixed amount;
- creates or resolves a crisis, conflict, war, rebellion, coup, or outcome;
- changes combat strength, LandHex control, territorial recovery, continuity,
  terminal state, or state victory;
- raises new resources, transfers funds to an unrepresented recipient, or
  creates a generic mobilization meter;
- has a numeric cost, duration, conversion ratio, cooldown, or monthly reward;
- may infer a target from the fixture, faction/ideology label, sorted order,
  highest local signal, or an active front;
- warrants a second LOBBY template, BARGAIN, ORGANIZE consequence, chooser
  rewrite, V02, Gate 1F PASS, or F05_FIX12.

## 12. Historical boundaries

F05_FIX9 remains the mixed-cause diagnosis
`ACTIVE_CONFLICT_EQUILIBRIUM + OUTCOME_ELIGIBILITY_STALEMATE +
INTERACTION_COVERAGE_EXHAUSTED`, with no existing writer bug proven and no
implementation seam changed.

F05_FIX10 remains the deterministic late-state measurement: 372 expanded
faction-boundary rows, `FUND_MOVEMENT` selected in `372/372`, `LOBBY` and
`ORGANIZE` selected in `0/372`, and two relevant fixture Regions. Those counts
are reachability evidence, not a target selection.

```text
PRODUCTION_GAMEPLAY_CHANGE: NONE
GATE1F_RECOMMENDATION: NOT_READY
V02: NOT_STARTED
```
