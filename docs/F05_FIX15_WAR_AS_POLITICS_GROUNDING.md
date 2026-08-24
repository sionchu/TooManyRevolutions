# F05_FIX15 — War-as-Politics Grounding and Active-Conflict Remedy Selection

## Decision

```text
TASK_ID: F05_FIX15
PRIMARY_CLASSIFICATION: WAR_POLITICS_REQUIRES_NEW_AUTHORITATIVE_DOMAIN
NEXT_IMPLEMENTATION_READINESS: NEW_DOMAIN_GROUNDING_REQUIRED
PRODUCTION_CONFLICT_GAMEPLAY: NOT_IMPLEMENTED
PERSISTENCE: SerializedSimulationSnapshotV6 / format version 6
GATE1F: NOT_READY
V02: NOT_STARTED
F05_FIX16: NOT_AUTHORIZED
```

F05_FIX15 is complete as a grounding and architecture-selection task. The
smallest honest conclusion is not a new T021 territorial rule, an automatic
coup outcome, or a missing-front peace rule. The current authoritative model
has enough state to identify and persist the late conflicts, and enough
read-only consumers to derive eligibility and physical control, but it does
not have the authoritative coordination state for a coup or the
settlement/persistence state for an active rebellion that has no usable front.
Those are different mechanisms and should not be compressed into one hidden
score. A new domain must therefore be grounded before a production repair is
selected.

No production source, conflict schema, WorldState schema, T021/T022/T023
logic, scenario content, action schema, or persistence version was changed by
this task.

## Exact late-state basis

The representative F05_FIX9 replay was run with:

```text
scenario: gate1f.f05.fix7.political-interaction
seed: 40103
horizon: 1800 days
population: 36 historical + 108 proposal = 144/144
```

The audit reported:

```text
PRIMARY_CLASSIFICATION: LATE_STEADY_STATE_MIXED_CAUSE
ACTIVE_CONFLICT_EQUILIBRIUM: YES
OUTCOME_GAP: YES
EXISTING_BUG_FOUND: NO
INTERACTION_COVERAGE_EXHAUSTED: YES
state-grounded max reassessment silence: 1200 days
post-intervention late silence: 1110 days
historical F05 baseline: UNCHANGED
non-accept divergences: 0
identical reopen churn: 0
legitimate reopens: 2
```

The two representative freeze points are:

| representative | freeze | active conflict participants | physical/front state | continuity/outcome state |
|---|---:|---|---|---|
| EARLY_PREVENTIVE_T0 / POLITICAL_ACCOMMODATION | `t=870` | rebellion `conflict:t018:[150,"rebellion","policy-fixture.country","t018.fixture.rebellion-faction"]`; coup `conflict:t018:[300,"coup","policy-fixture.country","t018.fixture.coup-faction"]` | country-controlled LandHex list is empty; rebellion `0front: NO_ACTIVE_FRONT_EDGE`; coup `0front: COUP_HAS_NO_TERRITORIAL_WRITER` | current Government `policy-fixture.government` remains valid; run `active`; T022 blocked; T023 does not infer dissolution |
| NEAR_CRISIS_T18 / OPPOSITION_LEGALIZATION | `t=330` | rebellion `conflict:t018:[120,"rebellion","policy-fixture.country","t018.fixture.rebellion-faction"]`; coup `conflict:t018:[31,"coup","policy-fixture.country","t018.fixture.coup-faction"]` | country-controlled LandHex list is empty; rebellion `0front: NO_ACTIVE_FRONT_EDGE`; coup `0front: COUP_HAS_NO_TERRITORIAL_WRITER` | current Government `policy-fixture.government` remains valid; run `active`; T022 blocked; T023 does not infer dissolution |

The formatted F05_FIX9 inspection records faction controller lists in each
state snapshot and uses the LandHex controller as the physical authority. Its
late freeze summary exposes the decisive physical fact directly: the player
country has zero controlled LandHexes and the active rebellion still has no
derived front edge. The absence of a front is not used as evidence that the
rebellion ended. The coup has no territorial writer by design.

The causal graph at both freezes is stable through the 1,800-day horizon:

- T016/F04A continues to observe faction organization, resources, grievance,
  ideology support, and current strategy, but the selected `FUND_MOVEMENT`
  observation does not create a territorial or coup outcome.
- T021 evaluates the active conflict boundary. Rebellion has no usable front;
  coup is excluded from territorial intent derivation.
- T018 keeps the rebellion candidate eligible in the representative freeze;
  the existing no-territory suppression therefore does not apply.
- T022 remains blocked by stable-region, capital-control, and core-territory
  criteria. T023 does not treat occupation, Government status, or active
  rebellion as a standalone dissolution proof.
- Agenda remains critical for the coup and rebellion factions while the run
  remains active.

## Mechanism matrix

The external claims below use only the fixed R01–R10 pack in
`docs/bridge/tasks/F05_FIX15.md`. The repository observations come from the
current source and the replay above.

| mechanism | source-supported causal claim | representative condition / counterexample / failure mode | current TMR authoritative state | current TMR consumer / writer | missing state or domain | dangerous shortcut to forbid | relevance to the exact late equilibrium |
|---|---|---|---|---|---|---|---|
| War as a political instrument / political objective | R01: war is a political instrument whose means must be read against the political object; the object need not be annihilation or total conquest. | A limited political object can coexist with military action; territorial loss is not by itself proof that the state has ceased to exist. | `Conflict.kind`, participants, optional `affectedRegionIds`, `contestedRegionIds`, status, and typed `ConflictOutcome`; `CountryId` continuity; current Government; Agenda and crisis read models. | T021 derives physical intents from armed conflicts; `applyConflictOutcome()` applies an explicitly supplied typed outcome; T022 and T023 own consolidation and dissolution criteria. | A typed political objective and its authoritative consumer are not present. Existing outcome types can record a result but do not determine the political object or settlement terms. | `country LandHexes == 0 -> defeat/dissolution`; Government defeat -> continuity loss; a generic war score or peace score. | The late state is a political-purpose and outcome-selection gap, not evidence that physical occupation should terminate the run. |
| Rebellion / insurgency persistence and local control | R03: local control, collaboration, and information interact; partial or fragmented control can matter. R04: insurgency can persist under conventional weakness when local, terrain, sanctuary, or information conditions support it. | A missing front can mean separated or non-adjacent control, not termination. The pack does not authorize inventing sanctuary, cells, terrain modifiers, or manpower. | Faction grievance, organization, resources, influence; Region ideology radicalism/organization, support, unrest, state control; physical LandHex controllers; active Conflict; current Government. | T018 derives rebellion eligibility. T021 derives fronts and territorial intents. F04B/T021 can perform bounded Government recovery only under its explicit current-Government, affected-Region, state-control, strength, and LandHex conditions. | An authoritative persistence/termination or settlement state is absent: no local insurgent persistence evidence beyond existing eligibility/control, no security guarantee, demobilization, or negotiated termination record. | `no active front -> peace`; grievance reduction -> conflict deletion; `Region.stateControl` -> physical ownership or loyalty; hidden guerrilla/manpower state added only to force motion. | The rebellion remains active with no front and an eligible T018 read model. Current physical consumers explain persistence but do not provide a legitimate terminal condition. |
| Coup coordination and seizure of state authority | R02: coup outcomes depend on coordination within the military/state apparatus and perceived control or inevitability; a coup is not a conventional territorial battle or popularity contest. | High organization, resources, influence, military power, or state weakness may support eligibility but cannot establish alignment among decisive state actors without a stated mechanism. | `currentGovernmentId`; Government identity and authority; Faction organization/resources/influence/grievance; Country militaryPower, stateCapacity, legitimacy, instability; institutional rules; `CoupPrerequisiteSnapshot`; active coup Conflict. | T018 produces a pure coup eligibility read model. T021 intentionally returns no territorial intent for `coup`. `applyConflictOutcome()` can apply an explicit `statusQuo` or `governmentTransition` while preserving CountryId, but it does not choose that outcome or create a coordination record. | A coup coordination/alignment domain and provenance for seizure, refusal, or negotiated transition are absent. | Infer a hidden coordination score from `militaryPower * organization`, faction labels, ideology, `currentStrategy`, or LandHex count; give a coup a fake LandHex front; auto-transition Government on eligibility. | The coup is inert because the required authoritative coordination state and autonomous outcome producer are absent, not because T021 forgot a territorial consumer. It is one of the two active conflicts, but no current scalar can honestly resolve it. |
| Civil-war termination / negotiated settlement / demobilization | R05: durable civil-war settlement has credible-commitment and security problems; negotiation, disarmament, power sharing, and enforcement can matter. R06: explicit settlement provisions can transition combatants into political participation. | A front can disappear while security commitments remain unresolved; elapsed time is not a settlement. A negotiated transition is not the same as automatic amnesty or party conversion. | Active Conflict status and typed `ConflictOutcome`; Government identity; political competition rules; authored political proposals/interventions; EventStore provenance. | T021 handles armed territorial movement. `applyConflictOutcome()` handles an explicitly supplied result. T016 political proposals and interventions have their own contracts. No TMR writer owns settlement terms or demobilization. | Settlement terms, guarantor/enforcement state, disarmament/demobilization state, and participation provisions. | no-front or long duration -> peace; generic war exhaustion; automatic amnesty, legalization, bargaining, or party conversion. | The current late pair is not solved by adding a shared peace timer. A settlement domain would be required before a rebellion or civil-war termination slice could be honest. |
| Occupation and collaboration / resistance | R03: physical control and political collaboration interact; partial control can be politically meaningful and resource-intensive to consolidate. | Physical occupation may coexist with resistance or weak collaboration; physical control is not a loyalty or state-continuity conversion. | `WorldState.landHexStates[*].controller` is the sole physical authority; Region `stateControl` and ideology/unrest are separate; Government and Country continuity remain separate. | `changeLandHexController()` is the only physical LandHex writer. T021 consumes controllers. T017/T018 consume regional political state. T023 explicitly owns dissolution and does not infer it from occupation or Government defeat. | Collaboration/resistance and occupation-administration state; no existing consumer can represent those mechanisms as distinct political facts. | `Region.stateControl == physical control`; all occupied LandHexes -> annexation/dissolution; Government defeat -> continuity damage. | The exact freeze demonstrates why this separation matters: country physical control is zero while Government and run continuity remain valid. Occupation is not an available remedy or terminal rule. |
| Mobilization / conscription and exemption politics | R08: conscription and exemption involve consent, legitimacy, institutional bargains, obligations, and fairness; they are not reducible to manpower. | The same military need can produce different political responses under different bargains or perceived fairness. The source does not authorize a generic manpower meter or forced-conscription button. | Country legitimacy, stateCapacity, militaryPower, treasury, institutional rules; Faction organization/resources/grievance; Region ideology and unrest. | T018 reads selected political signals; T021 uses bounded operational strength from existing faction/region signals; economy and policy systems own their existing state. No conscription/exemption writer exists. | Explicit mobilization obligation, exemption/burden, consent, and distribution domain. | Add manpower, automatic legitimacy modifiers, or a generic mobilization effort resource. | This could ground a future political slice but has no current late-state consumer that selects or resolves either active conflict. It would add a side system rather than repair the measured freeze. |
| War finance / extraction / distribution burdens | R07: war making, state making, extraction, and protection can interact. R09: mass war finance can produce political demands to redistribute fiscal burdens; war finance is political, not merely a treasury drain. | Fiscal burden can create representation or redistribution demands rather than a universal treasury delta. | Country treasury, income, production; Faction resources/grievance; PolicyState; Agenda; existing targeted `FUND_MOVEMENT` commitment lifecycle. | Economy writes treasury; T016/F04A reads faction dynamics; F05_FIX14 owns the targeted FUND_MOVEMENT lifecycle. No war-finance distribution writer is present. | Explicit war-finance burden, exemption, redistribution, or consent mechanism. | `war -> treasury -X`; `war -> stateCapacity +X`; reuse FUND_MOVEMENT as a hidden T021 strength bonus or add another generic fiscal scalar. | F05_FIX14 closed the FUND_MOVEMENT route and its no-response path still reaches the active-conflict freeze. War finance is not the smallest current remedy. |
| Displacement / refugees | R10: displacement can be strategic and connected to control, information, sorting, and extraction, not only an accidental byproduct. | Displacement cannot be inferred from lost LandHexes or unrest without population movement and destination state. | Region population exists, but there is no authoritative displaced population, refugee identity, destination, or return state in the audited runtime. | No existing conflict, economy, ideology, or outcome writer consumes a displacement state. | New population-movement/refugee domain and consumers. | Infer refugees from occupation, LandHex loss, or a conflict timer; use displacement as an untracked peace or legitimacy score. | It has no current consumer at the representative freeze and is explicitly deferred as a new domain. |
| Post-conflict political participation / settlement consequences | R06: combatants may enter political participation through explicit negotiated provisions; plural competition alone is not that transition. Amnesty, legalization, bargaining, demobilization, party participation, and Government succession are distinct. | A legal political channel can be available while an armed conflict remains unresolved; an authored response does not prove a settlement. | `politicalCompetition`, Government identity, Faction identity, political proposals/interventions, action log, EventStore. | T016 validates existing political proposals/interventions and policy legality. T021/T018 do not convert an armed faction into a party or resolve a Conflict from plural competition. | Explicit settlement provision, demobilization, party membership/participation, or enforcement state. | `politicalCompetition=plural -> peace`; automatic armed-group-to-party lifecycle; automatic amnesty/legalization/bargaining. | The F05_FIX9 plural perturbation changes action legality and BARGAIN availability in a clone but does not resolve either active conflict. It is a read-model reachability result, not a current remedy. |

## Conflict-kind semantic separation

The shared `Conflict` envelope is a useful identity and lifecycle boundary, but
it is not a complete mechanism model for all four kinds. Its existing fields
are sufficient to preserve participant identity, active/resolved status,
affected/contested region references, and an explicit outcome. They are not
sufficient to decide the kind-specific political mechanism.

| kind | current semantics and consumer | what the shared envelope can honestly express | additional authoritative requirement |
|---|---|---|---|
| `rebellion` | T018 eligibility; T021 derived physical front/intents; F04B/T021 bounded Government recovery; no-territory suppression only when prerequisites fail and the faction controls no LandHex. | Active identity and physical persistence can be represented; `statusQuo` can be applied when an authorized producer supplies a reason. | Persistence/settlement/termination evidence, including security or demobilization terms where a future slice needs them. No-front is not that evidence. |
| `coup` | T018 eligibility read model; T021 returns `null` from `deriveOneConflictIntent()` by design; Government transition is an explicit typed outcome application seam. | Active coup identity and a nonterminal Government transition result can be represented. | Coordination/alignment/seizure provenance and an outcome producer. Existing numeric signals are prerequisites, not a coordination outcome. |
| `civilWar` | T021 treats it as an armed faction-vs-faction territorial conflict and derives front intents. | Physical conflict identity and explicit result can be represented. | Political objective, credible-commitment settlement, demobilization, and participation terms for a grounded termination mechanism. |
| `war` | T021 treats it as an armed country-vs-country territorial conflict and derives front intents. | Physical conflict identity and explicit result can be represented. | Authored political objective and a settlement/termination consumer if a future task wants more than territorial movement. |

The distinction prevents a coup from receiving a fake LandHex writer and
prevents an insurgency with no derived front from being declared peaceful. It
also keeps Government transition nonterminal and State Dissolution under T023.

## Candidate seam audit

| candidate | current-state test | selection |
|---|---|---|
| A. Coup political-resolution seam | `currentGovernmentId`, central Government validity, faction organization/resources/influence, country military/state signals, institutions, and the T018 coup snapshot are present. None records alignment among state actors, perceived inevitability, or a causal seizure. The explicit `applyConflictOutcome()` seam needs an already grounded outcome. | Not implementable as a current vertical slice. It requires a coup coordination domain first. |
| B. Rebellion political-termination seam | T018 can remain eligible; T021 can report no front; F04B can act only when its existing physical recovery conditions are met; no current state distinguishes persistence from a negotiated/security-backed termination at this freeze. | Not implementable without settlement/persistence state. It must not use no-front as peace. |
| C. Shared conflict political-objective/outcome schema | Existing `ConflictOutcome` already expresses a small typed result, including nonterminal Government transition. Adding a generic objective without a kind-specific authoritative producer would become a hidden story goal, arbitrary timer, or unsupported peace score. | Not selected as the standalone remedy. A typed objective/settlement contract may be a later prerequisite inside a new domain, but it cannot supply the missing mechanisms by itself. |
| D. Mobilization / war-finance political slice | Existing Country/Faction/Policy state has readers, but the measured late blocker has no mobilization or finance consumer that can resolve the two active conflicts. F05_FIX14 already closed the FUND_MOVEMENT route. | Defer; it does not address the exact equilibrium. |
| E. Occupation / collaboration / displacement slice | Physical controllers and regional political state are intentionally distinct; collaboration and displacement have no authoritative runtime state/consumer. | Defer as new domains; do not conflate them with occupation or LandHex loss. |
| F. No current implementable War-as-Politics slice | Coup needs coordination state; rebellion needs persistence/settlement state; shared outcome application is only an explicit sink. Existing perturbations do not reveal an omitted writer. | Selected through `WAR_POLITICS_REQUIRES_NEW_AUTHORITATIVE_DOMAIN`. |

## Perturbation and reachability audit

The required replay and probe were performed by the existing developer-only
F05_FIX9 audit; no inspection source was added or changed for F05_FIX15.

### Current consumers and discrete probes

At both representative freezes, the audit applied these read-only probes:

| probe | first consumer | observed result | implication |
|---|---|---|---|
| faction organization `0.800 -> 1.000` | T021 `deriveConflictIntents()` and T016/F04A dynamics | no conflict change, no reassessment, no new writer; only the probe step's ordinary treasury/tick events | operational strength inputs are consumed, but they do not form a coup coordination or rebellion settlement outcome |
| faction resources `0.800 -> 1.000` | T021 `deriveConflictIntents()` and T016/F04A dynamics | no conflict change, no reassessment, no new writer | resource stock is not a hidden political-resolution score |
| country treasury raised at freeze | T016B feasibility / proposal-response guard | no feasible response and no reassessment | treasury alone is not a conflict resolver |
| country stateCapacity raised at freeze | T016B administrative headroom / proposal-response guard | no feasible response and no reassessment | administrative capacity alone is not a conflict resolver |
| `politicalCompetition: banned -> plural` in a clone | T016 action legality / BARGAIN availability | action set changed and BARGAIN became available; no conflict event or resolution | political access is not a settlement or armed-group participation transition |
| current Government identity replaced in a clone | political proposal target/reconsideration guard | no automatic retargeting or conflict reassessment | Government identity is a lifecycle reference, not a coup coordination result |
| one existing LandHex controller in the armed-conflict probe | T021 derived front/intents | at the exact representative freeze there was no front edge to perturb; baseline and probe remained no-front with no event | physical controller authority is not an omitted coup writer, and no-front is not peace |

The production code also contains two explicit outcome boundaries:

- `suppressIneligibleRebellions()` can resolve an active rebellion only when
  its prerequisites are no longer eligible **and** the faction controls no
  LandHex. The representative rebellion remains eligible, so this existing
  route is not a late-freeze termination condition.
- `applyConflictOutcome()` can apply a supplied `statusQuo` or
  `governmentTransition`, but it does not derive the outcome, create a coup
  coordination record, or create settlement terms. `stateDissolved` is rejected
  there because T023 owns dissolution.

Therefore no existing discrete state mutation in the audit produced a
legitimate conflict resolution. The coup is not waiting for a missing
territorial consumer; T021 deliberately excludes it, while the authoritative
coordination state and outcome producer are absent. The rebellion is not
proven ended by the missing front; current state shows persistence/eligibility
but no settlement evidence.

### Counterfactual and horizon evidence

The F05_FIX9 replay contains both an early preventive branch and a near-crisis
branch, each continuing to the 1,800-day horizon. F05_FIX14's existing
counterfactual inspection additionally covers:

- no player response: active FUND_MOVEMENT commitments remain unresolved
  through 1,200 days;
- existing political-accommodation response: response at tick 32 resolves
  the relevant commitment at tick 60, restores derived available resources
  from `0.5` to `0.8`, and removes its Agenda cause;
- later state-grounded recommitment at tick 211, with duplicate/reopen churn
  equal to zero;
- no timer, cooldown, countdown, or `currentStrategy` lifecycle dependency;
- uninterrupted and save/load replay equality and insertion-order equality
  under V6 persistence;
- historical F05 and F05_FIX9/F05_FIX13 measurements unchanged.

These are counterfactuals about the already-closed FUND_MOVEMENT route and
the late-state diagnostic, not authorization to extend FUND_MOVEMENT or to
make it a conflict effect. They show that the remaining silence is not
explained by a hidden lifecycle timer and that the active-conflict equilibrium
survives the existing player-response comparison.

## Resulting boundary

The exact classification is:

```text
PRIMARY_CLASSIFICATION: WAR_POLITICS_REQUIRES_NEW_AUTHORITATIVE_DOMAIN
COUP_CURRENT_STATE_SUFFICIENT: NO
COUP_REQUIRES_NEW_COORDINATION_DOMAIN: YES
REBELLION_CURRENT_STATE_SUFFICIENT: NO
REBELLION_REQUIRES_SETTLEMENT_OR_PERSISTENCE_DOMAIN: YES
SHARED_CONFLICT_OBJECTIVE_SCHEMA_REQUIRED: NO
MOBILIZATION_FINANCE_RELEVANT_TO_CURRENT_BLOCKER: NO
OCCUPATION_DISPLACEMENT_RELEVANT_TO_CURRENT_BLOCKER: NO
NEXT_IMPLEMENTATION_READINESS: NEW_DOMAIN_GROUNDING_REQUIRED
```

`SHARED_CONFLICT_OBJECTIVE_SCHEMA_REQUIRED: NO` means that a shared schema is
not the smallest sufficient remedy by itself. The current envelope already
has a typed result sink. A future task may introduce a kind-specific
coordination or settlement domain and then decide whether a shared objective
contract is a useful bounded input, but that decision must follow the new
domain's authoritative writer/consumer contract.

No production implementation is authorized by this result. In particular:

- zero country-controlled LandHexes do not cause defeat or dissolution;
- Government transition remains nonterminal;
- coups do not receive a LandHex front or writer;
- a missing front does not resolve a rebellion;
- no generic war exhaustion, support, morale, manpower, officer-loyalty,
  command-cohesion, occupation, refugee, peace, or coordination meter is
  introduced;
- no automatic amnesty, legalization, bargaining, demobilization, party
  conversion, or settlement timer is introduced;
- F05_FIX16, Gate 1F PASS, and V02 remain outside this task.

## Source trail

### Fixed external grounding pack

The source pack is the immutable §3 pack in
`docs/bridge/tasks/F05_FIX15.md`:

- R01 Clausewitz, *On War*, Book I, Chapter 1, §§24–25.
- R02 Naunihal Singh, *Seizing Power: The Strategic Logic of Military Coups*,
  DOI [`10.1353/book.31450`](https://doi.org/10.1353/book.31450).
- R03 Stathis N. Kalyvas, *The Logic of Violence in Civil War*.
- R04 Fearon and Laitin, “Ethnicity, Insurgency, and Civil War,” DOI
  [`10.1017/S0003055403000534`](https://doi.org/10.1017/S0003055403000534).
- R05 Barbara F. Walter, *Committing to Peace: The Successful Settlement of
  Civil Wars*, DOI [`10.1515/9781400824465`](https://doi.org/10.1515/9781400824465).
- R06 Aila M. Matanock, *Electing Peace*, chapter DOI
  [`10.1017/9781316987179.002`](https://doi.org/10.1017/9781316987179.002).
- R07 Charles Tilly, “War Making and State Making as Organized Crime.”
- R08 Margaret Levi, *Consent, Dissent, and Patriotism*, chapter DOI
  [`10.1017/CBO9780511609336.006`](https://doi.org/10.1017/CBO9780511609336.006).
- R09 Scheve and Stasavage, “The Conscription of Wealth,” DOI
  [`10.1017/S0020818310000226`](https://doi.org/10.1017/S0020818310000226).
- R10 contemporary wartime-displacement literature, used only for the narrow
  displacement proposition stated in the task pack.

### Repository evidence

- `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`
- `docs/F05_FIX9_LATE_STEADY_STATE_AUDIT.md`
- `docs/F05_FIX14_FUND_MOVEMENT_LIFECYCLE_CLOSURE.md`
- `docs/F04B_ACTIVE_CONFLICT_RECOVERY_AGENCY.md`
- `docs/ARCHITECTURE.md`, §17 Save / Replay
- `src/sim/state/conflict.ts`
- `src/sim/state/run.ts`
- `src/sim/state/government.ts`
- `src/sim/state/world.ts`
- `src/sim/state/territorialControl.ts`
- `src/sim/state/territorialTopology.ts`
- `src/sim/core/persistence.ts`
- `src/sim/core/invariants.ts`
- `src/sim/systems/conflictResolution.ts`
- `src/sim/systems/politicalCrisis.ts`
- `src/sim/systems/orderConsolidation.ts`
- `src/sim/systems/stateDissolution.ts`
- `src/sim/inspection/f05Fix9LateSteadyStateAudit.ts`
