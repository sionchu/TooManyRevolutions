# Development Backlog — Gate Based

Tasks are intentionally small enough for Codex to execute and verify.

Do not jump directly to final visuals.

---

# Gate 0 — Foundation

## T001 Project scaffold — COMPLETE (2026-08-21)

- Vite + React + TypeScript
- test framework
- lint/format
- production build

Acceptance:

- dev server runs
- tests pass
- production build passes

## T002 Simulation module boundary — COMPLETE (2026-08-21)

Create renderer-independent `src/sim/`.

Acceptance:

- no React import under authoritative sim
- basic tick test

## T003 Seeded RNG — COMPLETE (2026-08-21)

Acceptance:

- same seed produces same sequence
- no `Math.random()` in authoritative systems

## T004 Event model — COMPLETE (2026-08-21)

Acceptance:

- serializable events
- cause IDs supported

## T005 Core state types — COMPLETE (2026-08-21)

- Country
- Region
- Ideology
- Faction
- Policy
- Conflict
- Run state

---

# Gate 1 — Headless Simulation

## T010 Tick pipeline — COMPLETE (2026-08-21)

Implement the authoritative `SimulationStep` boundary and fixed phase order.

Acceptance:

- `SimulationStepInput.actions` accepts only validated records in contiguous global `sequence` order; each input targets the next authoritative tick
- `SimulationStepResult` returns `nextWorld` and ordered `emittedEvents`
- one tick = one day in the 12 × 30-day calendar
- preserve the fixed phase order and per-phase write ownership through one `SIMULATION_PHASE_ORDER` tuple
- expose explicit no-op hooks for scheduled effects, validated actions, economy, resources, ideology diffusion, faction pressure, instability, diplomacy, conflict, order/dissolution evaluation, event finalization, and snapshot observation
- only `closeDay` advances tick/date; the default T010 hooks do not implement gameplay rules or mutate domain collections
- terminal runs do not advance tick/date/RNG or emit events
- use one ordered ActionRecord log and deterministic event ID/sequence rules
- preserve non-terminal input WorldState by structural copying; terminal input returns unchanged; reject clock changes or invalid event order from a phase hook
- tests cover determinism, phase order, one-day advancement, terminal no-op, no-op mutation boundaries, action order, event order, and input immutability
- do not add economy, policy effects, diffusion, faction, diplomacy, conflict, AI, or rendering rules

## T011 Country/region basic economy — COMPLETE (2026-08-21)

- deterministic region production and resource flows
- controlled-region country aggregation
- treasury income/expenditure settlement
- scarcity/shortage state

Acceptance:

- follow the canonical absolute/0–100 metric contract
- Region stores resource production capacity, actual production, local stock, and demand as serializable maps
- economy alone writes Country treasury/dailyIncome/production and Region production; resources phase writes resource actual output, stock, and scarcity
- only a Region fully controlled by the Country across all member LandHexes contributes to that country's production and income; `ownerCountryId` is not an aggregation source and partial Regions are not Hex-split
- resource output is deterministic capacity-based production; no random, policy, market, price, wage, or trade rules
- scarcity is a 0–1 demand-weighted shortage ratio; sufficient supply produces zero scarcity
- `RESOURCE_PRODUCED`, `RESOURCE_SHORTAGE_CHANGED`, `TREASURY_CHANGED`, and `NATIONAL_PRODUCTION_CHANGED` use deterministic order and valid existing `causeIds`
- negative treasury is valid; negative production/resources are not
- terminal runs do not execute economy/resources phases
- tests cover deterministic output, control loss, resource production/consumption, scarcity, treasury deficit, events, bounds, immutability, terminal behavior, and a multi-day run

## T012 Policy rule engine — COMPLETE (2026-08-21)

Policies alter actual rules.

Acceptance:

- serializable `PolicyDefinition` records come from `ScenarioDefinition.policyCatalog`; no functions or arbitrary metric deltas are allowed
- mutable `PolicyState` remains under `WorldState.policies` with active IDs, enactment ticks, and one canonical `institutionalRules` object
- `ENACT_POLICY` uses the validated ActionRecord envelope and resolves only through the authoritative `resolveValidatedActions` phase hook
- declarative policy/rule prerequisites and incompatible active policies reject deterministically; same-tick inputs respect global sequence order
- valid policies mutate only their declared institutional rules and emit `POLICY_ENACTED`; rejected inputs emit `POLICY_REJECTED`
- only changed rule values emit `INSTITUTION_RULE_CHANGED`, with causeIds pointing to the already emitted policy event
- regime classification is a pure derived hook; regime transition preserves CountryId, current government continuity, and active RunOutcome
- no ideology support/radicalism/organization, faction, instability, economy, diplomacy, conflict, AI, or rendering effects are implemented
- tests cover static/dynamic ownership, valid/invalid actions, prerequisites, incompatibility, determinism, ordering, event causes, immutability, terminal behavior, regime continuity, and metric/ideology separation

## T013 Ideology state — COMPLETE (2026-08-21)

Acceptance:

- `ScenarioDefinition.ideologyCatalog` owns a small static `IdeologyDefinition` catalog with identity/content metadata only; no ideology outcome bonus is stored in `WorldState`
- every initial Region covers every catalog ideology ID, and `Region.ideology` is the canonical mutable state
- support, radicalism, and organization remain independent 0–1 values; support is explicitly non-exclusive and no support-total normalization is applied
- country ideology is a population-weighted derived aggregate from fully country-controlled Regions only; owner-only, partial, contested, faction-controlled, and uncontrolled Regions are excluded; no duplicate aggregate is persisted
- typed immutable bounded adjustments clamp finite deltas and require existing causal event IDs; there is no generic setter or direct player/UI mutation path
- adjustments emit only `IDEOLOGY_SUPPORT_CHANGED`, `IDEOLOGY_RADICALISM_CHANGED`, or `IDEOLOGY_ORGANIZATION_CHANGED` when a value actually changes, with deterministic IDs/order and valid `causeIds`
- susceptibility context exposes scarcity, stateControl, urbanization, pressFreedom, laborOrganization, and faction presence without implementing formulas
- T012 policy enactment does not automatically change ideology; no diffusion, contact behavior, faction behavior, instability, diplomacy, conflict, AI, or rendering is implemented
- tests cover catalog/coverage, bounds, independence, non-exclusive support, distinct support/radicalism/organization profiles, aggregation, controller filtering, determinism, event causality/order, immutability, no-op, policy separation, susceptibility context, and terminal behavior

## T014 Contact graph — COMPLETE (2026-08-21)

Acceptance:

- `ScenarioDefinition.mapContactTopology` owns static Region-to-Region topology; `WorldState` stores only sparse `contactEdgeStates` runtime overlays
- initial channels are limited to `border`, `trade`, `migration`, and `information`
- every `ContactEdgeDefinition` is explicitly directed; bidirectional routes use two edge records and two edge IDs
- scenario initialization rejects duplicate edge IDs, missing/omitted Region endpoints, invalid channels, and baseStrength outside 0–1
- `effectiveStrength` is deterministic: disabled is 0, otherwise `clamp01(baseStrength × multiplier)`; runtime multiplier is finite and non-negative
- graph selectors provide outgoing, incoming, channel, and effective-strength queries in stable edge-ID order; disabled topology remains queryable with strength 0
- `deriveCountryContacts` resolves only fully country-controlled Region endpoints from LandHex projection, excludes same-country/internal routes and partial/contested/faction/uncontrolled endpoints, and stores no country graph
- runtime edge mutation actions/phases and contact events are intentionally not implemented in T014
- fixture includes player Capital/Port/Farmland/Mine/Border, Merchant Republic Port, Absolute Monarchy Border, and asymmetric multi-channel routes
- tests cover ownership, endpoint/ID/channel/strength validation, directedness, multiple channels, runtime overlays, deterministic queries, controller changes, uncontrolled/faction handling, immutability, ideology separation, and absence of contact events

## T015 Ideology diffusion — COMPLETE (2026-08-21)

Acceptance:

- diffusion reads only explicit directed `ScenarioDefinition.mapContactTopology` edges and T014 effective runtime strength; no reverse inference or country-global ideology bonus
- source signal is the source Region's ideology support; destination susceptibility uses the T013 susceptibility-input hook and a documented ideology-independent baseline
- formula is deterministic and bounded: `ideologyGradient = max(0, sourceSupport - destinationSupport)`, `pressure = ideologyGradient × effectiveStrength × channelWeight × susceptibility`, `delta = diffusionRate × pressure × (1 - destinationSupport)`
- default channel weights are centralized (`border=0.8`, `trade=1.0`, `migration=1.1`, `information=1.2`) and the T015B-selected production rate is `0.05`; later systems may inject explicit configuration
- all edge contributions read a phase-start snapshot, aggregate by destination Region/ideology, and apply simultaneously; edge iteration order cannot create a same-tick cascade
- support is the only ideology dimension written; radicalism, organization, support normalization, and counter-subtraction are not performed
- Region-level diffusion remains available for internal, foreign, faction-controlled, and uncontrolled endpoints; country ideology remains a derived current-controller aggregate
- actual contributions emit `IDEOLOGY_DIFFUSED` and aggregate changes emit `IDEOLOGY_SUPPORT_CHANGED` with route/source/channel/strength/support/delta reconstruction data; zero deltas emit no ideology event
- current-step `causeIds` point only to already emitted diffusion events; prior-tick cause lookup remains explicitly deferred to T024 because WorldState does not yet carry EventStore history
- tests cover directed/internal diffusion, no-edge/disabled/reverse behavior, strength/channel weighting, multi-source aggregation, order independence, snapshot semantics, multi-day propagation, bounds, non-exclusive support, dimension separation, controller/aggregate behavior, immutability, deterministic events, and valid causes

## T015B Diffusion stabilization — COMPLETE (2026-08-21)

Correct T015's long-run saturation while preserving contact-driven, directed, non-exclusive support diffusion.

Acceptance:

- compare the old absolute-source formula with the support-gradient formula on the exact T015 inspection scenario at Day 0/10/30/60/120/240
- production formula is `ideologyGradient = max(0, sourceSupport - destinationSupport)` followed by the existing contact/channel/susceptibility and remaining-support terms
- production default `diffusionRate` is `0.05`, selected as the slowest tested rate with visible Day 1 direct and Day 10–30 inland movement
- equal or destination-higher support produces zero positive diffusion from that edge
- long-run lower-source diffusion does not mechanically drive the destination to 1; source/destination differences diminish naturally
- directed edges, phase-start snapshot, simultaneous update, support-only writing, non-exclusive support, radicalism/organization separation, event causes, and isolated-region behavior remain intact
- absolute-source behavior remains available only as an explicit inspection comparison mode; normal gameplay uses the gradient default
- no faction, instability, ideology competition, repression, propaganda, diplomacy, AI, rebellion, or UI behavior is added

## T015C Political time-scale calibration — COMPLETE (2026-08-21)

Acceptance:

- keep one authoritative simulation step equal to one day and keep the 360-day / 12 × 30-day calendar
- compare daily, weekly, and monthly political cadence on the exact T015B scenario with the gradient formula and production rate `0.05` at Year 0, 6 months, Year 1, Year 2, Year 3, Year 5, and Year 10
- represent cadence as explicit reusable `PoliticalCadence` configuration; do not couple it to renderer time, wall clock, or scattered modulo checks
- invoke the ideology phase daily but return a deterministic no-op on non-boundary days; only a cadence boundary may write support or emit diffusion events
- select `monthly` as the production political cadence: direct contact regions remain visible in Year 1, capital/inland propagation takes multiple years, and the isolated mine remains unchanged
- retain the support-gradient formula, `diffusionRate = 0.05`, directed edges, phase-start snapshot, simultaneous update, non-exclusive support, and radicalism/organization separation
- tests cover non-update no-op behavior, update-boundary movement, daily tick advancement, cadence determinism, wall-clock-speed independence, terminal no-op, and isolated-region behavior
- do not begin T016 or add faction, propaganda, repression, instability, diplomacy, AI, or other new gameplay behavior in this task

## T016 Faction pressure — COMPLETE (2026-08-22)

Acceptance:

- `factionPressure` reuses the T015C `PoliticalCadence` helper and production `monthly` boundary while the authoritative tick remains one day
- heuristic derives a compact observation from current faction/country/Region ideology/institution context and selects only `LOBBY`, `BARGAIN`, `ORGANIZE`, `FUND_MOVEMENT`, `ACCEPT`, or `WAIT`
- same WorldState, faction, and boundary produce the same proposal; faction processing is stable `FactionId` order and does not use `Math.random()` or LLM calls
- heuristic output is a read-only `ActionProposal`; common `acceptActionProposal` intake converts it to `source: "heuristic"` `ActionRecord` with deterministic ID and global sequence for the next step
- accepted faction actions use the existing pipeline boundary and may change only `Faction.currentStrategy`; unchanged strategy emits no duplicate event
- `Region.ideology[*].organization` remains independent from `Faction.organization`
- T016 does not mutate Country instability, Region unrest/controller, ideology support/radicalism/organization, Government, treasury/production/resources/scarcity, diplomacy, conflict, or victory/defeat
- no agenda UI/read model, instability, rebellion/coup/revolution/civil-war/strike resolution, diplomacy, AI backend, rendering, or T017+ behavior is included
- tests cover deterministic proposals, monthly/non-monthly cadence, ActionRecord intake/source/order, terminal no-op, immutability, policy context, organization separation, bounded writes, and prohibited outcomes

## T016A Pressure / Agenda System — COMPLETE (2026-08-22)

Convert raw simulation pressures into 2–4 player-readable current national agendas.

Examples:

- 군 급료 체불
- 광산 노동자 조직화
- 귀족의 왕권 강화 요구
- 항구 상인의 대표권 요구
- 외국의 정치 개입

Each agenda must be derived from actual simulation state/events.

Agenda should expose:

- title
- affected regions
- severity / trend
- key causes
- involved factions
- available intervention categories
- causal event references

Intervention categories may include:

- policy
- treasury
- diplomacy
- military
- repression
- concession
- no action

Do not generate arbitrary agenda text with an LLM.

Acceptance:

- implement a renderer-independent pure `deriveNationalAgendas()` read model; never add agenda/story/quest progress to `WorldState` or `RunState`
- return 0–4 primary agendas, targeting 2–4 only when enough real pressure exists; never add filler
- use typed, deterministic agenda data: title, affected Regions, bounded severity/band, trend, key causes, factions, honest intervention categories, and supplied causal event IDs
- derive current fiscal pressure from T011 treasury/income/expenditure, faction pressure from T016 observation/state, and foreign ideological pressure only from a live directed ContactGraph route plus actual diffusion evidence
- keep `Faction.organization` separate from Region ideology organization; currentStrategy alone and ideology support alone cannot create an agenda
- rank by severity descending with stable `AgendaKind`/RegionId/FactionId/id tie-breakers and cap at four
- return `trend = unknown` when no supplied temporal evidence supports rising/falling/stable; never infer trend from severity alone
- ensure every `causeEventId` is a member of the supplied event evidence; empty causes are valid
- expose only currently implemented intervention capabilities (`policy`, `noAction`); do not claim treasury/diplomacy/military/repression/concession systems early
- agendas update/disappear with underlying pressure and do not form a fixed quest/story sequence or schedule crisis outcomes
- add a headless inspection harness with fiscal, faction, directed foreign diffusion pressure and a pressure-removal counterexample
- tests cover determinism, stable ordering, max-four/no-filler, threshold/update/removal, immutability/no-events, organization separation, trigger guards, evidence/trend/cause IDs, honest categories, terminal purity, and T010–T016 proposal-boundary regression
- do not begin T016B Intervention Capacity, T017 Instability, or any later system in this task

## T016B Intervention Capacity & Feasibility — COMPLETE (2026-08-22)

Implement deterministic intervention feasibility without introducing a universal action currency.

Acceptance:

- `ScenarioDefinition.interventionCatalog` owns static `InterventionDefinition` records with treasury cost, administrative load, day duration, and existing policy/institution prerequisites
- `WorldState.interventionCommitments` owns only active runtime commitments; completed history remains in ActionRecord/GameEvent logs
- `Country.stateCapacity` remains a non-consumable 0–100 metric; committed load, administrative headroom, and administrative overload are derived values
- `Region.stateControl`, `Country.stateCapacity`, and intervention administrative load remain distinct concepts
- `START_INTERVENTION` uses the validated ActionRecord envelope and global sequence shared with player, heuristic, and LLM sources
- same-tick requests compete against projected treasury reservations and projected active load in ActionRecord sequence order; rejected requests create neither commitments nor cost
- `economy` remains the canonical treasury writer and settles accepted same-tick intervention costs exactly once with valid `TREASURY_CHANGED` causes
- day-based duration is explicit: start tick is first occupied day, completion is `startedTick + durationDays`, completion runs before same-tick action feasibility, and no daily progress spam exists
- existing commitments persist when capacity drops below load; T017 reads overload regionally without auto-cancel, headroom mutation, or treasury mutation
- actual institutional prerequisite data is read from existing `PolicyState`/`institutionalRules`; no `politicalPower`, `policyPoints`, intervention mana, vote simulation, faction behavior, diplomacy, military, repression, or concession writer is added
- emit deterministic `INTERVENTION_STARTED`, `INTERVENTION_REJECTED`, and `INTERVENTION_COMPLETED` events; preserve existing event ordering and only reference already emitted causes
- add three fixture-only definitions and a headless inspection harness covering enough capacity, treasury/headroom rejection, prerequisite rejection, duration release, and overload counterexample
- tests cover feasibility, derived load/headroom/overload, same-tick ordering/double-spend, treasury ownership, event order/causes, terminal no-op, immutability, serialization, and T016A category honesty
- update architecture/decision/QA/devlog documentation; do not begin T017 or any T017A/B territorial work

## T017 Instability — COMPLETE (2026-08-22)

Connect actual regional political/material/administrative stress to gradual `Region.unrest` and population-weighted `Country.instability`.

Acceptance completed:

- pure typed `RegionalPressureSnapshot` with separate material, political, and administrative components; no pressure snapshot is persisted
- material reads `Region.scarcity` only; negative treasury is not directly converted to regional unrest
- political pressure requires explicit region relevance plus grievance, faction organization, local ideology radicalism/organization, and faction influence; support/currentStrategy alone do not trigger it; faction and ideology organization remain distinct
- administrative pressure reads derived T016B overload and weak `Region.stateControl`; overload/reference normalization is centralized and low stateControl alone produces zero
- channels combine through bounded `1 - Π(1 - component)`; no ideology-name modifier or arbitrary national soup
- daily instability phase approaches pressure target with centralized rise/recovery rates; `Region.unrest` remains 0–1 and pressure removal recovers gradually
- `Country.instability` is 0–100 and uses only population-weighted fully country-controlled Regions; owner-only, partial, contested, faction-controlled, and uncontrolled Regions are excluded; zero controlled population returns 0
- T017 does not write legitimacy, treasury, resources, ideology, factions, intervention commitments, controller, victory/defeat, or rebellion/coup/revolution/civil-war state
- sparse band-transition events have deterministic IDs/order and existing-only causes; no single unrest threshold schedules or emits a crisis
- default authoritative pipeline executes the instability phase daily; T017B migrated the territorial consumer to the fully-controlled LandHex projection without changing T017 rates/formula
- added `pnpm run inspect:t017` and `docs/T017_INSTABILITY_CHECK.md` with baseline/material/political/admin/recovery and country aggregation checks
- tests cover determinism, immutability, bounds, component separation, gradual accumulation/recovery, controller aggregation, event sparsity/causes, terminal behavior, and T016 regression

At the time of the T017 checkpoint, do not begin T017A/T017B Territorial Map or T018 Rebellion/Coup as part of that task. T017A and T017B are now complete; T018 remains pending.

## T017A Territorial Map Topology — COMPLETE (2026-08-22)

Introduce static LandHex topology only. T017A does not migrate territorial authority.

- `ScenarioDefinition.mapTerritorialTopology`
- `LandHexDefinition`
- Region -> LandHex membership
- coordinates
- deterministic adjacency
- static terrain descriptor

이 checkpoint 당시에는 territorial authority를 migration하지 않았다.
T017B 완료 후 현재 runtime authority는 `WorldState.landHexStates[*].controller`다.

Acceptance:

- `LandHexId`, integer axial `LandHexCoordinate`, `LandHexDefinition`, and `TerritorialTopology` are explicit static types
- `ScenarioDefinition.mapTerritorialTopology.landHexes` owns static identity, coordinate, terrain descriptor, and Region membership
- one Region may contain multiple LandHex definitions; the headless fixture includes multi-Hex capital and merchant-port Regions
- physical neighbors are derived from axial coordinates and returned in canonical LandHexId order
- duplicate LandHexId, duplicate coordinate, non-integer coordinate, invalid RegionId, and invalid terrain are rejected during scenario initialization
- global topology connectivity and Region contiguity are not required
- static topology is not copied into WorldState; T017A 자체에는 runtime state가 없었다
- T017A checkpoint의 authority 상태는 당시 `Region.controller` 계약으로 기록되며 현재 계약은 T017B acceptance를 따른다
- T017A에서는 `LandHex.controller`, controller synchronization, authority projection, war, rebellion, fronts, and occupation을 구현하지 않았다
- ContactGraph remains an independent directed Region graph; no implicit edge synchronization exists
- headless `pnpm run inspect:t017a` prints membership, physical adjacency, cross-Region borders, and authority/validation checks
- tests cover multi-Hex Regions, cross-Region neighbors, ContactGraph independence, invalid definitions, insertion-order determinism, simulation preservation, and absence of LandHex controller

## T017B Territorial Authority Migration — COMPLETE (2026-08-22)

Migrate physical territorial authority from Region to LandHex. T017B는 이 범위를
완료했으며 T018 rebellion/coup 및 T021 war resolution을 선행하지 않는다.

Introduce:

- `WorldState.landHexStates`
- `LandHexRuntimeState.controller`
- `deriveRegionControlSummary()`
- country territorial projections

Migrate all existing `Region.controller` consumers:

- country controlled-territory selectors
- economy aggregation
- `deriveCountryIdeology`
- `deriveCountryContacts`
- conflict territorial writer
- victory/dissolution territorial checks
- territorial-control events

Acceptance (PASS):

- `LandHex.controller` is the only writable physical territorial-control source
- Region control summary supports partial occupation / contested / faction presence / uncontrolled
- Region/Country control projections are derived
- no duplicate writable territorial authority remains
- existing deterministic economy/ideology/contact behavior remains valid through new selectors
- no war resolution implemented yet
- runtime `Region.controller` is removed; `Region.ownerCountryId`, `Region.stateControl`, political influence, and physical control remain distinct
- fully controlled Region만 baseline country economy, ideology, contact, instability aggregate에 포함한다; Hex별 인구/생산 분할은 하지 않는다
- ContactGraph는 directed Region graph로 유지되며 TerritorialTopology와 독립적이다
- `LAND_HEX_CONTROL_CHANGED`는 immutable/deterministic append-only event이며 no-op 변경에는 event가 없다
- `pnpm run inspect:t017b`가 초기화, multi-Hex projection, consumer 경계, mutation, event ordering, 독립성, alternate cardinality를 검사한다

## T018 Rebellion/coup prerequisites — COMPLETE (2026-08-22)

No single unrest threshold. T018 reads current state and creates only a current active
political `Conflict`; it does not schedule a future crisis, resolve a government, or move
territory.

Acceptance completed:

- coup and rebellion use distinct typed prerequisite snapshots with explicit required gates and explanatory component signals
- `ScenarioDefinition.factionCapabilities` is the static, optional actor-capability source; it is validated but not copied into `WorldState` progression state
- no single unrest/instability/support/currentStrategy/Agenda/policy threshold creates a crisis; `Faction.organization` and Region ideology organization remain separate
- rebellion requires same-Region radicalism + local ideology organization + unrest evidence, faction resources/organization/grievance, geographic concentration, and derived state weakness; support remains supporting evidence only
- coup requires capability, central government, faction grievance/organization/influence/resources, and derived state weakness
- state weakness is pure derived data from state metrics, fully controlled Region unrest, and LandHex territorial projection; no generic stored weakness/progress/countdown exists
- military sympathy, foreign support, weapons, and leadership remain honest `notImplemented` evidence and do not receive fake defaults
- existing `Conflict` is reused with optional political `affectedRegionIds`; physical `contestedRegionIds` and LandHex controller are untouched
- eligible crises are detected in the existing `conflict` phase with canonical Country/kind/Faction/Region ordering; an active `(country, faction, kind)` conflict suppresses duplicate creation
- `COUP_ATTEMPT_STARTED` and `REBELLION_STARTED` carry bounded prerequisite evidence and use empty `causeIds` when no prior EventStore is available in the step context
- detection preserves CountryId, Government, RunOutcome, RNG, Region aggregate state, and LandHex territorial authority; no government transition, army, front, occupation, or war resolution is included
- added `pnpm run inspect:t018` plus prerequisite/determinism/authority/duplicate/order tests and inspection output

At the T018 checkpoint, T019 Diplomacy/foreign state baseline was the next smallest
task. T018 did not begin foreign support, military sympathy, weapons/leadership
systems, war resolution, victory / dissolution evaluation, persistence/replay, or
UI/rendering. T019 is now complete; those later systems remain pending.

## T019 Diplomacy/foreign state baseline — COMPLETE (2026-08-22)

Foreign states use the existing `Country` actor and a bounded deterministic heuristic
baseline. T019 does not add foreign ideology, sanctions, war, or faction behavior.

Acceptance completed:

- non-player Countries are selected from `ScenarioDefinition` in stable `CountryId`
  order; no engine-hardcoded country count or duplicate ForeignNation entity exists
- `ForeignStateObservation` is a pure read model of actual Country metrics, current
  Government, derived territorial projection, `deriveCountryContacts()` runtime edges,
  and active conflicts; it adds no generic bilateral relation authority or T020 motive
- foreign decision cadence is monthly on the authoritative daily tick, with at most one
  proposal per foreign Country and no proposal on non-boundary days
- the only T019 actions are `CLOSE_BORDER`, `REOPEN_BORDER`, and `WAIT`; they use the
  shared `ActionProposal` -> `acceptActionProposal` -> `ActionRecord` global ordering
- `diplomacy` is the canonical runtime contact writer; closure is directed from actor to
  target over explicit border edges, leaves reverse edges/static topology unchanged, and
  records closure owner/reason so only the owner can reopen while preserving multiplier
- actual transitions emit deterministic border events; valid `WAIT` is log-only and
  event-silent; invalid accepted foreign actions are rejected deterministically
- foreign-to-foreign border actions are supported without special-case country count
- no LandHex controller, Region aggregate, faction, ideology, treasury, Government,
  PolicyState, Conflict, economy, trade, sanction, war, or occupation mutation occurs
- terminal runs are inert, including foreign observation, proposal, action, event, and
  clock/RNG changes
- added T019 unit/integration tests, `pnpm run inspect:t019`, and
  `docs/T019_DIPLOMACY_FOREIGN_STATE_BASELINE_CHECK.md`

## T020 Foreign ideological threat

Foreign states react to causal foreign ideological exposure only when a live directed
route reaches a politically exposed domestic destination.

Acceptance completed:

- derive route-level `ForeignIdeologicalThreatRoute` evidence from actual foreign →
  domestic ContactGraph edges, current source/destination support-gradient, channel,
  effective strength, domestic faction/ideology mobilization, and actor vulnerability
- group routes into bounded `ForeignIdeologicalThreatSnapshot` values while retaining
  source Country, ideology, Region, ContactEdgeId, channel, support/radicalism/
  organization, faction IDs, vulnerability, eligibility, and severity evidence
- expose threats through pure `ForeignStateObservation.ideologicalThreats`; add no
  `WorldState.foreignIdeologicalThreat`, `Country.ideologicalThreat`, foreign support,
  ideology export meter, enemy list, or ideology writer
- require both actual external exposure and meaningful domestic mobilization; source
  support, ideology/regime names, government labels, vulnerability alone, or a foreign
  contact without a route do not create threat
- disabled/effective-zero routes contribute nothing; direction and all four actual
  channels remain visible, and foreign-to-foreign actors use the same derivation
- preserve T019 outgoing `CLOSE_BORDER` / `REOPEN_BORDER` semantics and add only
  direction-explicit `RESTRICT_INCOMING_BORDER` / `RESTORE_INCOMING_BORDER` for
  actor-owned incoming border closures; preserve reverse routes, static topology,
  base strength, and multiplier
- use separate restrict/restore hysteresis thresholds with no cooldown, hidden clock,
  RNG, or oscillating automatic mutation; information/trade/migration threat remains
  detectable but returns `WAIT` because no response is implemented
- keep monthly proposals on the daily authoritative pipeline, common ActionRecord
  ordering, deterministic Country/Ideology/ContactEdge ordering, terminal inertness,
  and no mutation to ideology, faction dimensions, Country metrics, Government,
  Region/LandHex control, economy, conflict, or victory/defeat
- add `inspect:t020`, Cases A–H headless diagnostics, T019 regression coverage, and
  tests for causality, disabled routes, direction, foreign-to-foreign behavior,
  regime/ideology-name neutrality, hysteresis, no writes, ordering, RNG, cadence,
  and terminal behavior
- T020 does not begin T021 army, war, occupation, front, or conflict resolution

## T021 Simplified conflict/war — COMPLETE (2026-08-22)

No tactical RTS, war declaration, peace negotiation, army entity, terrain combat,
logistics, casualties, or detailed military simulation.

Acceptance:

- resolve only existing active armed `rebellion`, `civilWar`, and `war` conflicts;
  `coup` remains non-territorial
- derive fronts from adjacent participant `LandHex.controller` values; peaceful
  borders and stored front state do not qualify
- use `Country.militaryPower` for Country participants and a derived Faction
  operational capacity from organization, normalized resources, local radicalism,
  local ideology organization, and local unrest; do not add fake military meters,
  weapons, military sympathy, or foreign military support
- use the centralized weekly boundary on the daily tick; derive all intents from
  the phase-start snapshot and allow at most one LandHex controller change per
  active Conflict per boundary
- select rebellion initial/expansion and government recapture targets through
  affected-Region ranking or physical adjacency; country war uses the same
  adjacency rule; no whole-Region flip shortcut
- resolve same-target collisions by stable `ConflictId` order and apply accepted
  mutations by stable target/Conflict order through `changeLandHexController()`
  with the current event buffer and already-known `causeIds`
- keep `ownerCountryId`, `Region.stateControl`, ideology, ContactGraph topology,
  and CountryId continuity unchanged by occupation
- allow an explicit typed government transition to reuse an existing Government
  while preserving CountryId and avoiding automatic defeat; reject
  `stateDissolved` because T023 owns terminal dissolution
- suppress a no-territory rebellion only when its T018 prerequisites are no longer
  eligible; otherwise keep the active non-territorial conflict
- add deterministic T021 system tests and `inspect:t021` Cases A–G

Do not start T022 victory/consolidation, T023 dissolution/defeat, T024
persistence/replay, detailed army behavior, or Gate 1V presentation in T021.

## T022 Victory — consolidation — COMPLETE (2026-08-22)

Implemented the headless order-consolidation evaluation boundary. T022 reads
current state after conflict resolution and never creates a scheduled victory.

Acceptance:

- `deriveOrderConsolidationEligibility()` is a pure, deterministic evidence/read
  model; criteria are read only from `ScenarioDefinition.orderConsolidationCriteria`
- optional `maximumStableRegionUnrest` is scenario-owned; no global victory
  stability threshold is hidden in the system
- stable/core/capital control uses LandHex-derived full-control projection, not
  `ownerCountryId`, stored Region control, or `contestedRegionIds`
- stateCapacity and treasury use inclusive configured thresholds; no legitimacy,
  production, militaryPower, ideology, regime, or policy-name blocker is added
- only relevant active civil war blocks when configured; rebellion/coup/foreign
  war do not become automatic victory blockers
- the evaluation phase writes only `RunState.consolidation` and a won
  `RunOutcome`; it does not mutate Country, Region, Government, PolicyState,
  ideology, faction, Conflict, or LandHex state
- configured positive consecutive period increments once per evaluation tick,
  resets on any failed criterion, restarts after recovery, emits sparse start and
  consolidated events, and emits no daily progress event
- `pnpm run inspect:t022` covers Cases A–G; T023 dissolution now runs first in the
  combined terminal-evaluation phase, while T024 remains outside the task

## T023 Defeat — dissolution — COMPLETE (2026-08-22)

T023 implements the smallest state-dissolution terminal boundary. It does not
invent annexation, fragmentation, or sovereignty evidence that the current
WorldState cannot authoritatively provide.

Acceptance:

- `deriveStateDissolutionEligibility()` is a pure deterministic read model and
  reads criteria only from `ScenarioDefinition.dissolutionCriteria`
- the inclusive supported condition is
  `Country.stateContinuity <= stateContinuityAtOrBelow`; T023 reads this value but
  does not add a writer or a decay formula
- configured full annexation, permanent fragmentation, and sovereign-function
  criteria remain explicit deferred evidence; occupation, capital loss, treasury,
  instability, stateCapacity, Government/regime/ideology, rebellion, or civil war
  do not become automatic defeat
- the combined phase checks dissolution before T022; a dissolved run emits one
  `STATE_DISSOLVED`, records its actual event ID in `RunOutcome.causeEventId`, and
  cannot emit `ORDER_CONSOLIDATED` in the same step
- `STATE_DISSOLVED` currently has `causeIds: []` because no actual source event is
  available; payload includes the CountryId, reason, evaluation tick/date, source
  value/threshold, and criteria evidence
- terminal follow-up steps preserve WorldState identity and do not advance date,
  tick, RNG, phases, actions, or events; already-won runs remain won
- `pnpm run inspect:t023` covers non-defeat regressions, precedence, authority
  boundary, terminal behavior, and ordinary T022 consolidation

SAFE_TO_DEFER:

- authoritative state-continuity writer/formula and final scenario balance
- full-annexation evidence, permanent-fragmentation permanence/recovery state,
  sovereign-function state, successor-state behavior, and annexation UI
- T024 persistence/replay, committed historical event lookup, and cross-tick WHY
  (deferred at T023 close; resolved by T024)
- T021 `localeCompare` audit in `src/sim/systems/economy.ts` and
  `src/sim/systems/resources.ts` (deferred at T023 close; resolved by T024)

## T024 Snapshot/replay — COMPLETE (2026-08-22)

Same inputs recreate the same run across a validated snapshot boundary.

Acceptance completed:

- `SerializedSimulationSnapshotV2` stores format/scenario identity, authoritative
  `WorldState` runtime, `RunState`/ActionRecord history, actual RNG state, and the
  sibling `EventStore` history without duplicating static `ScenarioDefinition` or
  derived read models
- deserialize is an explicit trust boundary: unknown format/keys, wrong scenario,
  incomplete/extra V2 Country/Region/Faction/PolicyState identity sets, ideology
  catalog gaps, invalid policy/faction/intervention references,
  Government/Conflict outcome reference errors, missing or unknown LandHex runtime
  state, static LandHex → Region mismatches, broken event causes, forward causes,
  terminal cause references, and forged/duplicate ActionRecord IDs are rejected
- `assertScenarioRuntimeClosure()` includes
  `assertLandHexRuntimeStateInvariants(scenario, world)` at load and commit;
  runtime physical control remains `WorldState.landHexStates[*].controller` and no
  `Region.controller` or static LandHex topology is introduced
- canonical textual ordering is used for authoritative runtime collections; the
  remaining simulation `localeCompare` risks in `economy.ts` and `resources.ts`
  were removed without changing UI sorting
- `commitSimulationStep(scenario, record, result)` validates existing and candidate
  runtime closure plus the complete EventStore before returning an atomic next
  WorldState/EventStore pair; event IDs/sequences/causes and `nextEventSequence`
  continue across save/load, with existing-only cause validation
- intervention commitments are provenance-closed to accepted deterministic
  `START_INTERVENTION` ActionRecords; full EventStore validation preserves a
  pre-save cause for a post-save event at the persistence boundary
- uninterrupted 120-tick, 40→save/load→80-tick, and multiple-boundary replays
  produce identical authoritative state, RNG, EventStore, IDs, sequences, and
  causes; T022/T023 terminal snapshots remain inert after load
- T021 conflict, T019/T020 mutable contact state, multi-Hex Region projection,
  T023 occupation-only non-defeat, and derived selector equivalence are covered
  by tests and `pnpm run inspect:t024`
- nonzero RNG cursor continuation, missing/unknown Region/ideology/PolicyState,
  static LandHex Region reference, invalid Conflict outcomes, forged/duplicate
  ActionRecord IDs, commitment provenance corruption, invalid serialization, and
  invalid next-state commit rejection are covered by regression tests
- `pnpm run inspect:t024` prints the snapshot, replay, terminal, corruption, and
  derived-selector checkpoint; `pnpm run inspect:t021/t022/t023` remain regression
  checks

SAFE_TO_DEFER:

- browser save UI, localStorage/IndexedDB, cloud save slots, compression/binary
  format, and old-version migration framework
- arbitrary rewind, branch timelines, multiplayer rollback, replay viewer, and
  end-of-run history presentation
- Gate 1V LandHex timelapse and visual validation
- full event-sourced rebuild from history; T024 persists both runtime snapshot and
  recorded history but does not replace the state model with event sourcing
- dynamic Country/Region/Faction/PolicyState lifecycle, content hashing, and
  migration framework; V2 content compatibility is governed by scenario version

### Future direction — Procedural Political Press / Gazette

이 방향은 별도 task tree를 지금 만들지 않고, T024 이후 eligible한 Gate 2+
presentation 범위로 둔다.

- T024 이후 Gate 2에서 deterministic critical-event/news presentation
  foundation을 만들 수 있다.
- 기본 runtime은 recorded history → deterministic PressFacts → publication
  perspective → authored template/grammar → deterministic variant의 흐름을
  사용한다. 외부 API/runtime AI integration은 현재 backlog requirement가 아니다.
- 이후 Gate 2 또는 Gate 6에서 routine press와 major-event press의 content,
  tone, presentation polish를 검토할 수 있다.
- fact integrity, exact political terminology, anti-AI-slop, serious-state tone,
  same-history replayability는 구현 시 QA acceptance에 포함한다.
- 정확한 PressFacts schema, publication type/name, template·variant 개수,
  seeded selection algorithm, UI layout, 저장 방식은 아직 LOCK하지 않는다.

## T025 Headless scenario

- player monarchy
- merchant republic
- absolute monarchy
- 5 regions

Acceptance:

- deliver one valid playable `ScenarioDefinition`, not ad-hoc WorldState construction
- validate all initial foreign keys, ContactGraph nodes/edges, static territorial topology LandHex IDs/coordinates/Region references, policy/ideology references, criteria ranges, and non-null playerCountryId
- production topology covers each playable Region with one or more LandHex definitions and includes at least one multi-Hex Region; no 1:1 generation invariant is allowed

Content boundary:

- the listed country/Region counts are first-playable content targets, not engine cardinality invariants; final country count remains open
- the future production historical Intervention set belongs in T025 or an immediately following explicit content/calibration task; its archetypes and trade-offs are not implemented or counted here
- adding a valid alternate `ScenarioDefinition` with different Country/Region/LandHex cardinality is a future smoke/regression check, not a runtime spawning or mod-framework requirement

---

## T025A Pacing Calibration

Calibrate game-time progression against real player time.

Target full run:

- real play time: 15–25 minutes
- simulated history: roughly 20–40 years

Target competition vertical slice:

- real play time: 3–5 minutes
- simulated history: roughly 5–10 years

Target pacing:

- first meaningful decision: within 30 seconds
- first visible consequence after action: 3–8 seconds
- second-order consequence: 15–30 seconds
- meaningful crisis/decision pressure: roughly every 30–60 seconds
- avoid >30 seconds of unreadable/no meaningful change

Validate:

- player has reasons to accelerate time
- player has reasons to pause
- political change accumulates over months/years
- revolutions/coups can break out rapidly after long buildup
- game does not feel like waiting for numbers

**Future content/QC placement (no new task tree):**

- before content freeze, country/Region/LandHex composition and historical Intervention content may be adjusted from playtest evidence
- after content freeze or release-candidate, adding Country/Region/LandHex or major Intervention content requires relevant regression, multi-seed, pacing, and visual review again
- after historical Intervention content exists, review dominant interventions, universally correct reform paths, zero-trade-off actions, hidden focus-tree behavior, and identical scripted crises across seeds
- a lightweight alternate-scenario smoke check must confirm that engine behavior does not depend on a fixed country count or Region-to-LandHex ratio

## T025B Strategic Planner Evaluation — FUTURE / NOT IMPLEMENTED

After T025 and pacing calibration, and before Gate 1F, evaluate whether strategic
planning materially improves foreign/faction decisions without changing simulation
authority. This is one future evaluation item, not a new AI framework or dependency
commitment.

Acceptance candidates:

- the existing deterministic heuristic is the baseline; compare it first with a
  bounded Top-K counterfactual rollout using the existing authoritative simulation
  as the forward model
- only if evidence justifies it, compare an adapted boardgame.io-style MCTS search and
  then conditional RHEA; do not add boardgame.io, Macao, Stratega, Tribes, or OpenSpiel
  as runtime dependencies for the evaluation
- planner candidates enumerate schema-valid legal actions, simulate cloned states,
  and return one common `ActionProposal`; they never mutate committed WorldState,
  ActionRecord history, RNG, events, or hidden planner state
- compare actor-specific hierarchical objectives with hard survival constraints rather
  than one universal moral/utility score; exact objective vocabulary remains unlocked
- record explicit planning horizon, candidate count, opponent-model depth, and
  forward-model-call/CPU budgets
- enforce no-cheat difficulty: no hidden treasury/production/stateCapacity bonuses,
  impossible information, bypassed prerequisites, or alternate action rules
- use fixed scenario/seed/opponent matrices and separate agent seed from game seed;
  inspect more than win rate, including state dissolution, treasury collapse,
  administrative overload misuse, meaningless `WAIT`, repeated actions,
  rejected actions, crisis-response delay, action diversity, exploitability,
  planning cost, and counterfactual regret
- reject adoption if a planner does not provide measurable competence benefit at an
  acceptable deterministic/replay-safe cost

Status: future research/evaluation only. T025B is not started by this patch.

# Gate 1F — Fun Gate

## T030 Headless telemetry view

Print/table:

- region stability
- ideology
- faction actions
- foreign actions
- win/loss pressure
- causal events

## T031 20 seeded simulation runs

Look for:

- dominant strategy
- dead states
- runaway loops
- no-op periods
- run selected same-seed counterfactual pairs and check for authored convergence / deterministic story rails

## T032 Human fun review

Use `QA_PLAYTEST.md`.

Stop here if core is flat.

## F01 — Long-run Headless Harness — COMPLETE / PASS (2026-08-22)

F01은 Gate 1F의 재미 판정이 아니라, 현재 simulation을 장기 headless 실행하고
측정할 수 있는 기반을 추가했다.

Acceptance:

- `pnpm run inspect:f01`이 기존 T021 진단 scenario를 `WAIT`/no-intervention
  baseline으로 5/10/20/40 simulated years(1,800/3,600/7,200/14,400
  authoritative daily ticks) 실행한다
- 진행은 `runSimulationStep` → `commitSimulationStep` canonical path만 사용하고,
  harness가 WorldState를 직접 mutate하지 않는다
- terminal outcome이면 즉시 중단하며, active/orderConsolidated/stateDissolved,
  terminal tick/year/cause, actual event vocabulary, treasury/stateCapacity/
  instability/LandHex trajectory, faction summary, yearly checkpoint를 출력한다
- wall-clock은 telemetry에만 기록하며, same scenario/seed/policy/horizon의
  simulation-derived summary와 JSON midpoint save/load resume가 deterministic하다
- F01 benchmark는 일반 unit CI에서 제외하고 inspection command에서 실행한다.
  장기 실행 중 canonical closure/EventStore/invariant validation은 생략하지 않는다

Evidence:

- 40년 WAIT baseline은 14,400 ticks를 terminal 없이 완료했고 invariants와
  continuous vs midpoint save/load resume가 PASS했다
- 20년→40년 runtime scaling은 약 4.50x로 관찰되어 T024 full-history
  validation을 Gate 1V 전에 최적화 검토해야 하는 `PERFORMANCE BLOCKER BEFORE
GATE1V` 관찰로 기록했다. F01에서는 persistence code를 최적화하지 않는다
- F01은 balance, multi-seed diversity, intervention counterfactual, exploit,
  pacing/fun 판정을 수행하지 않는다. 각각 F02–F05 또는 Gate 1F review에서 다룬다

## F01A — Incremental Commit Validation Performance Fix — COMPLETE / PASS (2026-08-22)

F01A는 F01에서 측정한 T024 full-history validation 누적 비용만 수정했다.
full serialize/deserialize trust boundary와 corruption rejection은 유지하고,
canonical in-process continuation에서 새 Event/Action/Commitment delta와
candidate closure만 검증한다.

Acceptance/evidence:

- process-local `WeakMap` canonical markers를 사용하며 serialized
  `validated` flag나 별도 EventStore authority를 만들지 않는다
- EventStore는 deterministic sequence/ID/order/cause를 새 append에 대해
  incremental하게 확인하고, full `assertEventStoreInvariants()`는
  serialize/deserialize와 audit 경계에서 유지한다
- ActionRecord suffix, changed intervention commitment provenance, runtime
  identity/closure, terminal cause relation을 incremental path에서 확인한다
- invalid Event/Action/Commitment delta, previous record immutability,
  incremental-vs-full validator, old snapshot corruption, cross-save causality
  regression이 PASS했다
- 동일 WAIT baseline의 40년 simulation-derived 결과는 F01과 동일했다
- 20년→40년 runtime scaling은 4.50x에서 2.22x로 개선되었고, 40년 run은
  약 3.47초였다. 이 측정에서 residual performance blocker는 관찰되지 않았다

F01A 이후 다음 작은 단계는 F02 Multi-seed Outcome Survey이며, V02는 여전히
F02–F05와 Gate 1F review 뒤에 시작한다. balance/gameplay 규칙은 변경하지
않았다.

## F01C — Canonical Registration & Freeze Atomicity Fix — COMPLETE / PASS (2026-08-23)

F01C는 F01B targeted review에서 남은 두 trust-boundary 문제만 수정했다.

- RunRecord registration은 `persistence.ts`, SimulationStepResult registration은
  `tick.ts`의 private validated seam으로 이동했으며, raw canonical registration
  export는 제거했다
- recursive freeze는 성공적으로 전체 graph를 보호한 뒤에만 completed `WeakSet`에
  기록하고, 실패 시 in-progress bookkeeping을 정리한다
- nested Map/Set의 동일 object 재시도, public export surface, 기존 parent/one-shot/
  persistence/replay 회귀가 PASS했다
- gameplay, balance, EventStore semantics, persistence schema, F02, V02는 변경하지
  않았다

F01C 구현 검증과 Terra final targeted review는 PASS이며, 다음 단계는 F02
multi-seed survey다.

## F02 — Multi-seed Outcome Survey — COMPLETE / PASS (2026-08-23)

F02는 T021 rebellion fixture에서 `WAIT`/no-intervention baseline을 24개의
deterministic seed(`0..22`, `40101`)로 40 simulated years씩 실행했다. 각 run은
기존 F01의 `runSimulationStep → commitSimulationStep` canonical path를 사용하고,
terminal이면 즉시 중단한다. F02는 balance/fun PASS가 아니라 현재 endogenous
history의 분포와 stasis/reachability evidence를 수집하는 survey다.

실행 evidence:

- 24 seeds / 345,600 executed ticks / 185.58초 / 약 1,862 ticks/sec
- 24/24 active; order consolidation 0/24; state dissolution 0/24
- rebellion `1 / 1 / 1`, coup `1 / 1 / 1`, civil war `0 / 0 / 0`, Government
  transition `0 / 0 / 0`, territorial change `3 / 3 / 3` (min / median / max)
- exact/coarse history signature 모두 1종이며 24개 seed가 하나의 cluster에 모였다.
  서로 다른 seed에서 seed-sensitive authoritative history는 관찰되지 않았다
- treasury는 24/24 unchanged, stateCapacity는 24/24 unchanged, faction
  organization total은 start/peak/final 모두 `1.60–1.60`, crisis-participating
  faction은 `2–2`
- 24/24가 controlled LandHex 0에 도달했고, recovery 0, 40년 후 active at zero
  24/24였다. 이는 T023의 `0 Hex != dissolution` 계약을 변경하지 않는 관찰이다
- consolidation eligibility 0/24, stateContinuity minimum `100 / 100 / 100`,
  dissolution threshold `<= 0` 도달 0/24, 최장 정치적 침묵은 약 39.94년이었다

F02 결과는 `NO_OUTCOME_REACHED`, `LOW_HISTORY_DIVERSITY`,
`ECONOMIC_STASIS`, `HIGH_ZERO_TERRITORY_PERSISTENCE`,
`LONG_SILENT_INTERVALS`, `NO_CONSOLIDATION_REACHED`,
`DISSOLUTION_NOT_REACHED` diagnostic concern을 남긴다. 이는 자동 balance 수정이나
fun score가 아니며 F03 counterfactual 및 F05 pacing/fun review의 evidence다.
`pnpm run inspect:f02` 장기 survey는 일반 `pnpm test`에서 제외하고, small-horizon
determinism/order/aggregate/terminal 회귀만 CI에 둔다.

F02 구현은 gameplay, balance, RNG mechanic, persistence schema, renderer를
변경하지 않았다.

F04A 이후 WAIT baseline regression도 다시 실행했다(2026-08-24): 24 seeds /
345,600 ticks / 137.79초 / 약 2,508 ticks/sec. 정치·영토 결과는
`24/24 active`, consolidation/dissolution `0/24`, rebellion/coup/territory
`1/1/1`, `1/1/1`, `3/3/3`으로 유지되었고, exact/coarse signature `1/1`,
largest cluster `24/24`, seed sensitivity `NOT OBSERVED`였다. treasury와
stateCapacity 정체, zero-territory final-active, 약 39.94년 정치적 침묵도
그대로였다. F04A endogenous writer는 no-intervention history를 오염시키지
않았으며, F02의 diagnostic concern은 유지된다.

## F03 — Intervention Counterfactuals / Player Agency Validation — COMPLETE / PLAYER_AGENCY_WEAK (2026-08-23)

F03는 동일 authoritative snapshot에서 `WAIT`와 합법적인 기존 T016B
administrative intervention을 단 한 번씩 실행한 뒤, 10 simulated years의
state/history 차이를 측정했다. T021 fixture는 intervention catalog가 비어 있고
시작 국고가 0이며 ContactGraph edge도 없어 counterfactual 검증에 부적합했다.

F03는 새 gameplay가 아니라 `gate1f.validation` developer-only composition
fixture를 사용했다. 이 fixture는 T021의 정치 위기/파벌/LandHex 상태에 기존
T016B 세 intervention 정의, 비자명한 treasury/resource flow, 두 방향의
ContactGraph edge, 구성 가능한 T022 criteria를 조합했다. intervention 정의,
threshold, RNG, action semantics, conflict/economy formula는 추가하거나
변경하지 않았다.

실행 evidence:

- 3 natural WAIT checkpoints (day 0 / 90 / 180) × `WAIT` + short/long/
  prerequisite intervention, 43,200 executed ticks
- 세 intervention은 세 starting state에서 모두 feasibility를 통과했다
- 모든 intervention은 day 1에 ActionRecord → commitment →
  `INTERVENTION_STARTED` → economy treasury charge를 만들었다
- short/long/prerequisite는 각각 treasury cost `8 / 20 / 12`, administrative
  load `12 / 15 / 20`, duration `1 / 180 / 180`일의 실제 trade-off를 보였다
- day 180에는 long/prerequisite의 load가 사라지고 treasury delta는 각각
  `-20 / -12`, short는 `-8`로 남았다. +1년/+5년/10년에도 이 treasury
  차이는 유지됐다
- 세 intervention branch 모두 WAIT와 정치 event sequence, rebellion/coup/
  civil-war/Government transition/territorial change 결과가 같았다
- 따라서 분기 결과는 `PLAYER_AGENCY_WEAK`: 즉시·재정·administrative state
  차이는 있으나 정치적 downstream divergence는 관찰되지 않았다
- F03 당시 definitions에는 Region unrest/scarcity, faction, Government,
  LandHex/conflict, consolidation/dissolution을 intervention별로 읽는
  consumer가 없어 `INTERVENTION_DOWNSTREAM_INTEGRATION_GAP`을 기록했다
- stateCapacity는 소비되지 않았고, stateContinuity/territory semantics를
  intervention 결과에 맞춰 변경하지 않았다. negative treasury와 0 Hex active는
  기존 T011/T023 계약대로 관찰만 했다

`pnpm run inspect:f03`는 10년 matrix를 developer-only로 실행한다. small tests는
동일 snapshot branching, branch order independence, legal/infeasible action,
telemetry purity를 검증하며, 장기 matrix는 일반 `pnpm test`에서 제외한다.
전체 evidence는 `docs/F03_INTERVENTION_COUNTERFACTUALS.md`에 기록한다.

F03은 player agency를 positive로 판정하지 않는다. F04 exploit 분석보다 먼저
현재 intervention 정의에 실제 political/economic downstream consumer를 연결할
최소 gameplay integration repair proposal을 검토하는 것이 권장된다. F04와 V02는
시작하지 않았다.

## F03A — Intervention Downstream Integration Repair — COMPLETE / INTEGRATION PASS, PLAYER_AGENCY_WEAK (2026-08-23)

F03A는 F03에서 확인한 treasury/administrative-only dead-end를 최소 typed
completion effect contract로 기존 consumer에 연결했다. 새 정치 시스템, generic
score, intervention ID별 downstream switch, threshold/balance/RNG 변경은 없다.

- `InterventionDefinition.completionEffects`는 scenario-owned typed union으로
  `regionResourceProductionCapacityDelta`, `factionGrievanceDelta`,
  `factionOrganizationDelta`만 지원한다
- effect는 기존 commitment의 `completionTick`에서 immutable replacement로
  정확히 한 번 적용되고, `INTERVENTION_COMPLETED` payload에 previous/next/
  changed provenance를 기록한다
- Gate1F `short`는 resource capacity → resources/scarcity → T017 material
  pressure, `long`은 faction organization → T016/T018, `prerequisite`는
  faction grievance → T016/T018 경로를 검증했다. T021 operational strength는
  기존 faction organization reader를 그대로 사용한다
- F03 동일 matrix에서 세 intervention 모두 non-cost authoritative state와
  existing downstream consumer difference가 관찰되었고 dead-end candidate는
  남지 않았다. 그러나 political event/history/outcome은 WAIT와 여전히 같아
  classification은 `PLAYER_AGENCY_WEAK`로 유지한다
- mid-commitment save/load exactly-once, replay/EventStore cause provenance,
  F02 WAIT no-intervention baseline regression을 유지한다

상세 causal audit과 BEFORE/AFTER evidence는
`docs/F03A_INTERVENTION_DOWNSTREAM_INTEGRATION.md`에 기록한다. production
intervention content balancing과 F04 exploit analysis는 별도 작업이다.

## F03B — Agency Leverage / Threshold Sensitivity Diagnosis — COMPLETE / PASS (2026-08-23)

F03B는 F03A의 `PLAYER_AGENCY_WEAK` 원인을 measurement-only로 분해했다. 기존
F03 branch runner를 재사용하고, T018 daily prerequisite, T016 monthly, T021
weekly boundary를 압축 관측했다. threshold/effect/cost/duration/cadence/RNG와
gameplay는 변경하지 않았다.

- `src/sim/inspection/f03bAgencyLeverageDiagnosis.ts`와
  `pnpm run inspect:f03b`를 추가했다
- numeric T018 gate는 기존 `value - threshold` margin으로 기록하고,
  eligibility difference window와 그 안의 실제 detector evaluation 수를
  기록한다
- short는 capacity `+6 → scarcity/material pressure -0.500`, unrest 약
  `-0.013`의 persistent T017 차이를 만들지만 T018 gate를 직접 바꾸지 않아
  `NO_PROBLEM`/opportunity 부재로 분류했다
- long/prerequisite는 각각 coup organization margin `+0.200 → -0.100`,
  rebellion grievance margin `+0.250 → -0.050`으로 실제 eligibility window를
  만들었다. 그러나 State A에서는 completion 전 day 1 정치 event가 있었고,
  모든 relevant branch에는 active conflict가 있어 history divergence는 없다
- day 90/180 checkpoint에서는 completion 이후 WAIT의 future political event가
  없고, State A/B/C 모두 active conflict/dedup 또는 fixture boundary 문제가
  관찰됐다
- T022 1년 blocker는 `stableRegions`, `capitalControl`, `coreTerritory`였고,
  stateCapacity/treasury/active civil war가 주 blocker는 아니었다
- developer-only `0.5x/1x/2x/4x` sensitivity probe에서 1x가 이미 T018
  eligibility boundary를 넘었으며, magnitude를 키워도 political history는
  달라지지 않았다. 생산 content에 반영하지 않았다
- 결과: `PLAYER_AGENCY_WEAK` 유지, F04는 좁은 의미의 decision-boundary
  진단 기준으로 `READY`; active-conflict fixture caveat를 F04에 carry-forward

상세 evidence는 `docs/F03B_AGENCY_LEVERAGE_DIAGNOSIS.md`에 기록한다. F04와
V02는 이 task에서 시작하지 않았다.

## F04 — Degenerate Strategy / Exploit Check — COMPLETE / F05 NOT READY (2026-08-23)

F04는 F03B의 day 0/90/180 natural decision-boundary checkpoint를 재사용해
`WAIT`, repeat `short`/`long`/`prerequisite`, single `long`/`prerequisite`, `MIX`, early/JIT legal timing을
10 simulated years 동안 비교했다. 모든 branch는 기존 feasibility와
`ActionRecord → runSimulationStep → commitSimulationStep` canonical path를
사용했으며, gameplay/balance/RNG는 변경하지 않았다.

- 3 starting states × 9 strategies에서 97,200 ticks를 실행했다. 전략은 모두
  legal action만 제출했고 terminal 이후에는 진행하지 않았다. `SINGLE_LONG`과
  `SINGLE_PREREQUISITE`는 한 번만 실행해 단일 행동의 gate shutoff를 검사했다
- PRE_CRISIS에서 long은 coup eligibility exposure `-3,420` ticks, prerequisite는
  rebellion exposure `-3,420` ticks를 만들었지만 모든 branch의 political event,
  Government, territory, outcome은 WAIT와 같았다. POST_CONFLICT/RECOVERY_STRESS도
  prerequisite 차이는 남았지만 history/territory/outcome은 갈라지지 않았다
- 최대 commitment overlap은 long 4 / prerequisite 3, peak committed load는
  60으로 capacity 안에 있었다. cost/accounting과 headroom bypass는 관찰되지
  않았다. PRE_CRISIS 첫 short 비용 8은 treasury net-zero tick으로
  `TREASURY_CHANGED`가 생략됐지만 economy arithmetic에는 포함되며 inspection의
  settled-without-change-event audit가 이를 설명한다
- WAIT는 Repeat Short에 대해 treasury/headroom 차원에서 weak dominance 후보가
  되었고, long/prerequisite 반복은 bound 도달 뒤 각각 8/6 no-op completion을
  만들었다. F04 당시 faction organization/grievance는 관찰 horizon에서
  one-way ratchet 후보였다. 이 후보는 F04A에서 별도 endogenous writer를
  추가한 뒤 재측정한다
- F04 당시(F04A 이전) 단 한 번의 `LONG`(cost 20) 또는 `PREREQUISITE`(cost
  12)로도 각각 3,420 ticks의 coup/rebellion eligibility exposure가 줄었고,
  변경된 faction state는 horizon 끝까지 회복되지 않았다. 이는 당시의
  historical `CHEAP_PERMANENT_GATE_SHUTOFF [MAJOR]`와
  `ONE_WAY_RATCHET [MAJOR]` evidence다
- pre-crisis eligibility만 바뀌고 정치 history가 갈라지지 않아
  `PRE_CRISIS_TIMING_CLIFF [MAJOR]`를 기록했다
- POST_CONFLICT/RECOVERY_STRESS에서는 zero controlled LandHex에서 recovery한
  전략이 없었고, active conflict 이후 intervention futility가 관찰됐다
- `pnpm run inspect:f04`는 97,200 ticks / 약 44.5초 / 약 2,185 ticks/sec로
  실행되며, save/load repeated-strategy equivalence와 strategy order independence를
  PASS했다. 위의 MAJOR concerns 때문에 F05는 `NOT_READY`다. F04에서는 어떤
  finding도 수정하지 않는다

상세 evidence는 `docs/F04_DEGENERATE_STRATEGY_EXPLOIT_CHECK.md`에 기록한다.
F05는 active-conflict lifecycle, recovery path, one-way state, WAIT dominance
후보를 별도 repair/diagnosis한 뒤 재평가한다.

## F04A — Endogenous Faction Dynamics / One-Way Ratchet Repair — COMPLETE / PASS (2026-08-24)

F04A는 F04에서 관찰한 faction organization/grievance one-way ratchet만
대상으로 한 최소 gameplay repair다. 기존 T016 monthly political boundary에
immutable replacement writer를 추가해 현재 scarcity, unrest, stateControl,
Country weakness/instability, faction resources/influence, local ideology
activation에서 bounded target을 계산한다. `Faction.grievance`와
`Faction.organization`은 최대 `0.02`씩 target 방향으로 이동하며, target이나
progress를 별도 WorldState authority로 저장하지 않는다.

- 기존 F03A intervention effect, cost, administrative load, prerequisite,
  duration은 변경하지 않았다
- `currentStrategy`/support 단독 trigger, intervention ID special case,
  generic political score, RNG, direct crisis/conflict/recovery scheduling은
  추가하지 않았다
- T017/T018/T021은 갱신된 authoritative faction fields를 기존 reader로
  소비하며 T022/T023/Territorial authority는 변경하지 않았다
- unit test와 `pnpm run inspect:f04a`에서 hostile pressure의 grievance
  회복, 강한 driver의 organization 재형성, stable low pressure에서의 무강제
  rebound, bounds 및 insertion-order independence를 확인했다
- 현재 `gate1f.validation` F04A inspection에서 추적한 9개 branch는 모두
  accepted 되었고, long/prerequisite의 faction state difference는 10년
  horizon 안에 회복되어 one-way-ratchet 잔여 경로가 없었다. 정치 event,
  Government, territory, outcome은 이 fixture에서 여전히 WAIT와 같았다
- F04의 `CHEAP_PERMANENT_GATE_SHUTOFF`는 F04A 이후 historical finding으로
  재분류되었다. 현재 `inspect:f04`는 이를 발생시키지 않으며, `SINGLE_LONG`의
  coup eligibility difference는 `149/3601` ticks, `SINGLE_PREREQUISITE`의
  rebellion eligibility difference는 `0`이다

상세 evidence는 `docs/F04A_ENDOGENOUS_FACTION_DYNAMICS.md`에 기록한다.
F04의 active-conflict lifecycle, pre-crisis timing, WAIT dominance,
zero-territory recovery concerns는 해결된 것으로 재분류하지 않는다.
F04A 자체에서는 F04B/F05와 V02를 시작하지 않았으며, F04B는 아래 별도
repair slice에서 후속 완료되었다. F05와 V02는 시작하지 않았다.

## F04B — Active Conflict Response / Internal Recovery Agency Repair — COMPLETE / Terra review pending (2026-08-24)

F04B는 F04에서 관찰한 active-conflict futility와 zero-territory recovery
deadlock을 T021 범위 안에서 최소 보완했다. T018의 conflict 생성/dedup와 T021의
현재 operational state 읽기를 분리해 유지하고, grievance가 낮아져도 faction이
LandHex를 점유한 active rebellion은 suppress하지 않는다.

- T021 faction strength는 매 weekly phase-start에 현재
  `Faction.organization`, `Faction.resources`, local ideology activation과
  `Region.unrest`를 다시 읽는다. creation snapshot이나 intervention ID 분기는
  추가하지 않았다
- 국가가 모든 LandHex를 잃어 front source가 없어지는 경우를 위해, active
  internal `rebellion`에 한해 valid current Government, current Country
  `militaryPower`, affected Region의 positive `stateControl`, current faction
  operational strength를 비교하는 단일 `governmentRecovery` intent를 추가했다
- recovery는 strength가 기존 T021 advantage margin을 넘을 때만, affected
  Region에서 최대 1개 faction-held LandHex를 기존 `changeLandHexController()`로
  되찾는다. Region owner는 relevance check일 뿐 controller authority가 아니다
- coup와 foreign war에는 recovery intent를 만들지 않으며, T022/T023,
  stateControl/ownership/정부 전환/외교 topology는 변경하지 않았다
- strong residual fixture는 1개 Hex 회복과 active conflict 유지를 보였고,
  weak residual fixture는 정상 stalemate로 남았다. insertion-order,
  continuous/save-load equivalence, occupied-rebellion persistence가 PASS했다

F02 WAIT 재실행 결과는 `24/24 active`, rebellion/coup/territorial changes
`1/1/1`, `1/1/1`, `3/3/3`, exact/coarse signature `1/1`, largest cluster
`24/24`, seed sensitivity 없음으로 baseline history를 유지했다. 이번 실행은
345,600 ticks / 157.67초였으며 runtime은 환경 측정치다.

F04의 WAIT dominance, pre-crisis timing cliff, intervention cost/효과 문제는
이번 task에서 조정하지 않았다. F05는 여전히 `NOT_READY`; F04B는 F05, F02
diversity repair, V02 renderer를 시작하지 않는다.

상세 evidence는 `docs/F04B_ACTIVE_CONFLICT_RECOVERY_AGENCY.md`에 기록한다.

## F04C — Institution-Mediated Stabilization Design — COMPLETE / F04D REQUIRED (2026-08-24)

F04C는 체제명을 직접 보너스로 사용하지 않고, 현재 Institutional Rules와
Faction/Region/Country/Intervention 구조가 어떤 안정화 선택 공간을 만들 수
있는지 설계했다. production gameplay code, balance, threshold, RNG, war,
fantasy, F04D, F05, V02는 변경하거나 시작하지 않았다.

- 실제 source 기준 현재 InstitutionalRuleState는 ruler veto, legislature
  required, suffrage, productive property, land ownership, labor organization,
  press freedom의 7개 규칙을 가진다. 실제 simulation consumer는 정책
  mutation/prerequisite, T016의 일부 LOBBY/ORGANIZE availability, derived
  RegimeClassification에 집중되어 있다
- 안정화 언어를 material provision, representation, elite bargain,
  organization integration, coercion, administrative penetration,
  military/security coalition, ideological/constitutional legitimacy로
  구분했지만 새 authoritative meter는 만들지 않았다
- 강한 왕정, 입헌군주정, 민주공화정, 권위주의/개인독재, 군사독재,
  공산주의 일당국가를 독립 축의 조합으로 비교했다. 최종 regime taxonomy와
  `Country.regime`은 추가하지 않았다
- 20개 action archetype에 institutional availability, concrete target state,
  cost, counter-reaction, preventive/crisis/recovery 역할, 현재 표현 가능성을
  매핑했다. 어느 action도 특정 crisis/victory를 예약하지 않는다
- War as Politics는 domestic political consequence의 설계 slot만 남겼고,
  military faction·manpower·logistics·foreign war는 NEW DOMAIN/DEFER로
  분류했다
- 핵심 판타지 축은 Arcane Privilege / Mage Guild, optional secondary는
  Sacred / Supernatural Sovereignty로 추천했다. 둘 다 이번 task에서 구현하지
  않으며 races/prophecy/magic soup는 defer한다

F04C 결론은 `F04D REQUIRED`다. 가장 작은 다음 slice는
`politicalCompetition` 하나의 작은 institutional dimension 후보와
material relief, political amnesty, opposition legalization, labor
legalization/bargaining, censorship/assembly restriction 중 4~5개 action을
기존 canonical action/effect → T016/T017/T018 consumer seam에 연결하는
것이다. F04D 이후 counterfactual을 다시 측정해 WAIT dominance와
pre-crisis timing을 재평가한 뒤에만 F05 readiness를 판단한다.

상세 설계는 `docs/F04C_INSTITUTION_MEDIATED_STABILIZATION_DESIGN.md`에
기록한다. F04C는 F05 pacing/fun decision이나 V02 renderer를 시작하지 않는다.

## F04C-R — Political / Historical Reference Grounding — COMPLETE / PASS (2026-08-24)

F04C-R은 F04C의 material relief, political amnesty, opposition legalization,
labor bargaining, censorship/assembly restriction을 실제 법률·공식 archive·학술
연구와 대조했다. 역사 사례를 scripted event로 복제하지 않고, 법적 지위·조직
합법성·행정 집행·재정/정치 비용·반작용을 TMR state와 consumer에 매핑했다.

- Bismarck-era Germany는 repression과 social insurance가 병행되었고, 낮은 초기
  급여가 사회민주조직을 자동 해체하지 않았다는 반례를 제공한다
- New Deal 연구는 material relief의 지역 배분·행정 규칙·장기 정치 반응을
  보여주지만, relief가 항상 unrest를 낮춘다는 근거는 아니다
- Spain·South Africa 사례는 amnesty가 처벌·기록·권리 복원을 다루는 반면,
  opposition legalization은 조직의 공개 활동 arena를 바꾼다는 차이를 보인다
- Sweden의 Saltsjöbaden 자료는 강한 노동·고용주 조직을 없애지 않고 교섭·조정
  절차로 conflict를 제도화한 사례다. full bargaining은 현재 TMR에 없다
- Germany·Britain·GDR 자료는 censorship가 단기 가시성을 낮출 수 있어도
  underground organization·재집결·grievance를 자동 제거하지 않음을 보인다

F04C-R의 architecture decision은 `politicalCompetition` **ADD**다. 단,
`banned | restricted | plural`의 좁은 축으로만 정의하며 democracy score,
legitimacy, suffrage/press/labor duplicate, election 또는 government turnover로
확장하지 않는다. F04D 최소 action set은 material relief, 제한된 political
amnesty/accommodation proxy, opposition legalization, coercive restriction의
네 가지로 좁혔고, full labor bargaining·elections·transitional justice·military
faction·war·arcane domain은 defer했다.

상세 mechanism, limitation, existing-state fit, counterfactual plan과 source
ledger는 `docs/F04C_R_POLITICAL_HISTORICAL_REFERENCE_GROUNDING.md`에 기록한다.
F04C 문서는 research 결과에 맞춰 amnesty를 제한 proxy로, competition을 F04D
ADD 후보로 정렬했다.

이번 task는 docs/research only이며 gameplay, balance, RNG, source schema,
F04D, F05, V02를 변경하거나 시작하지 않았다. 다음은 F04D의 narrow
institution-action implementation과 counterfactual 재검증이다.

## F04D — Narrow Institution-Action Implementation — COMPLETE / COUNTERFACTUAL PASS (2026-08-24)

F04D는 `politicalCompetition = banned | restricted | plural`을 required
Institutional Rule로 구현하고, 기존 Faction `BARGAIN` availability에 직접
연결했다. 이 rule은 suffrage, press freedom, labor organization, legitimacy,
election, government turnover 또는 regime bonus를 대체하지 않는다.

- Intervention completion에 typed `institutionalRuleSet` effect와
  `ruleNotEquals` prerequisite를 추가했다
- `requireCompletionEffectChange`를 사용하는 definition은 이미 동일한 결과인
  no-op repeat를 start 전에 거부한다
- 제도 변경은 `INTERVENTION_COMPLETED -> INSTITUTION_RULE_CHANGED`의 실제
  cause chain을 남기며 PolicyState, EventStore, T024 replay를 통과한다
- developer validation fixture는 material relief, 제한된 political
  accommodation, opposition legalization, coercive restriction 정확히 네
  response만 제공한다. 각 response는 비용, 행정 부하, 기간과 서로 다른
  material/faction/institution effect를 가진다
- coercion은 faction을 삭제하지 않고 organization 감소와 grievance 반작용을
  함께 남겨 F04A recovery dynamics를 보존한다
- snapshot format을 version 2로 올려 `politicalCompetition`을 required로
  저장한다. version 1을 hidden default로 복원하거나 silent migration하지 않는다

`pnpm run inspect:f04d`의 seed 40103 동일-state 비교에서 banned와 plural은
BARGAIN availability와 coup/rebellion/territory history가 갈라졌다. 동일
checkpoint의 WAIT 및 네 response도 모두 서로 다른 history를 만들었다. 720일
continuous와 day-360 save/load continuation, insertion-order comparison은 동일한
canonical result를 냈다. WAIT dominance, cheap permanent gate shutoff, one-way
ratchet, pre-crisis timing cliff는 이 narrow slice에서 나타나지 않았고 no-op
repeat와 capacity spam은 blocked/bounded였다.

상세 구현과 결과는 `docs/F04D_INSTITUTION_ACTION_IMPLEMENTATION.md`에 기록한다.
F04는 이제 overall assessment를 수행할 수 있다. F05는 그 종합 판정 전에는
시작하지 않으며, elections/party system/full bargaining/transitional justice/
military faction/war/arcane privilege/V02도 시작하지 않는다.

## F04 Targeted Architecture / Gate Review — PASS / F04 CLOSED (2026-08-24)

F04B와 uncommitted F04D를 실제 source, counterfactual, persistence, full test
기준으로 함께 검토했다. `REQUIRED_FIX_BEFORE_F04_CLOSE`는 없으며 F04는
`PASS / CLOSED`, F05는 `READY / NOT STARTED`로 변경한다.

- F04B current-state response와 conditional internal recovery는 LandHex authority,
  stateControl 의미, one-Hex boundary, foreign/coup exclusion, save/load/order
  determinism을 보존한다
- required `politicalCompetition` ownership, BARGAIN의 최소 legal-channel 의미,
  typed Intervention institution mutation, snapshot V2 strict boundary는 PASS다
- banned/plural 비교의 crisis divergence는 BARGAIN 직접 bonus가 아니라 같은
  legalization action의 rule-dependent feasibility와 completion effect로 설명한다
- political accommodation의 treasury 우세는 territory/economic base retention의
  정상 결과이며, dominance/trade-off magnitude는 F04 architecture fix가 아니라
  F05 balance/pacing measurement다
- unrest와 treasury 소폭 인접 조건에서도 response의 qualitative ordering과
  divergence가 유지됐다

상세 review는 `docs/F04_TARGETED_ARCHITECTURE_GATE_REVIEW.md`에 기록한다. 다음
순서는 reviewed F04D checkpoint commit/push → ChatGPT ↔ Codex GitHub Bridge setup
→ F05다. 이 review는 commit, push, Bridge, F05, V02를 실행하지 않았다.

---

# V00 — Visual System & Asset Quality Contract — COMPLETE / PASS (2026-08-22)

V00은 Gate 1V 이후의 renderer/art/UI 구현을 위한 docs-only visual system,
reference, asset provenance, acceptance contract다.

Deliverables:

- `docs/VISUAL_BIBLE.md`
- `docs/VISUAL_REFERENCE_CATALOG.md`
- `docs/ASSET_SOURCE_CATALOG.md`
- `docs/VISUAL_QA.md`
- `docs/V00_VISUAL_SYSTEM_ASSET_QUALITY_CHECK.md`

Acceptance:

- core thesis `Miniature Political World + Restrained Administrative Cartography`
  와 Operational UI / Map Notation / Historical Artifact의 구분이 존재한다
- CountryId continuity와 regime-change visual continuity가 보존된다
- territorial control, political influence, organization, ContactGraph, active
  front의 semantic channel이 authoritative source와 함께 정의된다
- semantic channel collision, anti-card-soup, anti-slop, decoration test가 정의된다
- presentation은 simulation entity를 발명하지 않으며 `WorldState → pure
presentation selectors → React/R3F` boundary를 따른다
- External Reference Catalog와 rights classification, reference → TMR rule
  traceability가 존재한다
- External Asset Catalog와 reference/asset 분리, donor/production 분리,
  normalization, universal acceptance, provenance manifest가 존재한다
- AI-generated output의 direct production acceptance가 금지된다
- Visual Benchmark Scene, debug-first, semantic zoom, camera/proportion/material/
  palette/motion 방향과 canonical screenshot 후보가 정의된다
- final Hex density, exact RGB/font/budget, primary pack, final regime taxonomy,
  production Intervention 수는 lock하지 않는다
- T024 O(ticks²) validation 비용은 V00에서 최적화하지 않고 F01에서 측정했다.
  F01A에서 canonical continuation incremental validation으로 해소했으며,
  full trust-boundary validation은 유지된다

V00에서 renderer, `derivePresentationState`, UI, Three.js/R3F, asset download/
import/conversion, final asset acceptance를 시작하지 않는다.

## Candidate visual implementation sequence — FUTURE / NOT STARTED

아래는 Gate 1V/2의 작은 implementation slices 후보이며 현재 task ID나 최종
task tree를 새로 고정하지 않는다. 기존 T033–T037 Gate 1V 작업과 정렬해 후속
planning에서 매핑한다.

- V01 Presentation State / `derivePresentationState` — COMPLETE / PASS
- F01 Long-run Headless Harness — COMPLETE / PASS
- F01A Incremental Commit Validation Performance Fix — COMPLETE / PASS
- F01B Canonical Trust Hardening — COMPLETE / PASS (source-world binding,
  one-shot step results, runtime-immutable canonical graphs; F01A incremental
  validation and T024 full trust boundaries retained)
- F01C Canonical Registration & Freeze Atomicity Fix — COMPLETE / PASS (raw
  registration ownership and freeze-failure bookkeeping hardening)
- F02 Multi-seed Outcome Survey — COMPLETE / PASS (24-seed WAIT survey;
  seed-insensitive repeated history recorded; no balance change)
- F03 Intervention Counterfactual — COMPLETE / PLAYER_AGENCY_WEAK (Gate1F
  administrative-only divergence; downstream integration gap recorded)
- F03A Intervention Downstream Integration Repair — COMPLETE / INTEGRATION PASS,
  PLAYER_AGENCY_WEAK (typed completion effects reach existing T017/T016/T018
  consumers; no political history divergence yet)
- F03B Agency Leverage / Threshold Sensitivity Diagnosis — COMPLETE / PASS
  (T018 margins, eligibility windows, cadence, T017 attenuation, T022 blockers;
  PLAYER_AGENCY_WEAK remains; F04 narrow READY)
- F04 Exploit / Degeneracy Survey — READY FOR OVERALL ASSESSMENT (F04A recovery,
  F04B active-conflict repair, F04D institution-action counterfactual complete)
- F05 Pacing / Fun Decision — FUTURE / AWAITS F04 OVERALL ASSESSMENT
- V02 Flat Hex Renderer — after Gate 1F F01–F05
- V03 Political Overlay
- V04 Organization Tokens
- V05 Contact Routes
- V06 Territorial Front
- V07 Timelapse
- V08 Multi-seed Visual Review
- V09 Counterfactual Split-screen

F04–F05와 Gate 1F review가 끝나기 전에는 V02를 시작하지 않는다. V01은 V00
contract를 실제 renderer-neutral read model로 연결한 완료 slice이며, 현재
순서는 `V01 → Gate 1F F01–F05 → V02`다. F03B는 weak-agency의 decision-boundary
원인을 측정했고, F04는 decision-boundary exploit evidence를 남겼지만 F05
readiness를 통과시키지 않았다.

## V01 — Presentation State / `derivePresentationState` — COMPLETE / PASS (2026-08-22)

`src/presentation/presentationState.ts`에 ScenarioDefinition과 WorldState에서
파생되는 pure `PresentationState`를 추가했다.

Acceptance:

- LandHex static axial topology와 LandHexRuntimeState controller를 semantic
  projection으로 제공하고 Region control은 T017B summary를 재사용한다
- multi-Hex/partial control, legal owner와 physical controller, Region-level
  ideology support를 분리한다
- actual faction-controlled LandHex presence만 organization token으로 표시하고
  support/currentStrategy/이념 수치만으로 조직을 발명하지 않는다
- directed ContactGraph route와 inactive runtime overlay를 보존하고, active
  armed Conflict front만 T021 selector에서 파생한다. coup/평화 국경은 front가
  아니다
- deterministic stable IDs/order, insertion-order independence, empty state,
  JSON save/load 후 재파생을 테스트한다. `localeCompare`, snapshot 저장,
  React/R3F/Three.js dependency는 없다
- `pnpm run inspect:v01`이 authority/determinism/renderer 경계를 출력한다

V01은 renderer, CSS, camera, colors/materials, asset import, UI, V02를 시작하지
않는다. T024의 O(ticks²) validation scaling은 F01에서 측정했고 F01A에서
canonical continuation incremental validation으로 해결했다. full trust-boundary
validation은 계속 유지된다.

---

# Gate 1V — Visual Simulation Validation

이 Gate의 목적은 최종 게임 UI나 아트를 만드는 것이 아니다.

Headless simulation의 상태 변화가 전략 HEX 지도 위에서
공간적으로 읽히고 관찰 자체가 재미있는지를 검증한다.

최종 HUD, 타이틀 화면, 오프닝, 이벤트 일러스트,
정식 메뉴, polished inspector는 이 Gate의 범위가 아니다.

## T033 Debug Strategy Map Renderer

Headless simulation state를 최소한의 2D/3D debug strategy map으로 시각화한다.

최소 표시:

- Country boundary
- Region boundary
- LandHex
- LandHex controller
- Region ideology influence
- ContactGraph routes
- Faction / organization markers
- military / revolutionary presence when available
- front lines when available
- current simulation date
- recent important events

시각 요소는 실제 simulation state에서 파생되어야 한다.

Acceptance:

- simulation logic은 renderer를 import하지 않는다
- renderer는 authoritative state를 mutate하지 않는다
- Region / LandHex / ContactGraph를 서로 구분해서 볼 수 있다
- political influence와 physical territorial control이 다른 시각 언어를 가진다
- final game art asset이 없어도 동작한다

## T034 Simulation Timelapse

여러 해의 simulation을 빠르게 재생하여 공간적 변화 과정을 관찰할 수 있게 한다.

필수 기능:

- pause
- step
- accelerated playback
- very-high-speed developer playback
- restart same seed
- jump/reset to initial state if practical

Timelapse에서 확인할 것:

- direct-contact Region이 먼저 정치적으로 변화하는가
- inland propagation이 뒤따르는가
- isolated Region이 실제로 고립되어 보이는가
- faction organization이 위기 전에 시각적으로 나타나는가
- rebellion/war가 갑자기 spawn된 것처럼 보이지 않는가
- territorial fronts가 LandHex 위에서 이동하는가
- foreign contact/invasion direction이 지도에서 읽히는가

Developer playback speed는 실제 player-facing T041 time-control 규칙과
동일할 필요가 없다.

단, simulation 결과는 authoritative tick을 건너뛰거나 근사하지 않는다.

## T035 Multi-seed Visual Review

T031의 seeded simulation 검증을 visual timelapse와 연결한다.

최소 여러 seed를 장기 실행하여 다음을 검토한다.

- 항상 같은 Region에서 같은 crisis가 발생하지 않는가
- 항상 같은 연도에 같은 revolution/war가 발생하지 않는가
- political geography가 seed/state에 따라 달라지는가
- 장기간 변화가 없는 dead board가 발생하지 않는가
- 지나치게 빠른 map saturation이 발생하지 않는가
- 전선과 정치 영향이 구분되어 움직이는가

가능하면 동일한 debug renderer에서 seed를 빠르게 교체할 수 있게 한다.

### Spatial readability and density acceptance

Gate 1V는 특정 LandHex 수를 production target으로 잠그지 않는다. 현재
headless fixture의 7개 Region / 9개 LandHex는 validation content일 뿐이며,
예시 후보 밀도(20/35/50 등)를 비교해 다음을 판정한다.

- 한 LandHex의 controller 변화와 Region 경계 변화가 timelapse에서 식별되는가
- Region 정치 영향 overlay, 실제 Faction/organization marker, LandHex 물리
  통제와 전선이 서로 다른 시각 언어로 읽히는가
- 직접 접촉 영향과 inland 변화의 순서, 정치적 침범과 군사적 침범의 차이가
  보고서를 열지 않아도 보이는가
- 작은 셀의 빠른 churn, 지나친 marker/route clutter, 너무 거친 지도 표현이
  모두 허용 범위 안에 있는가
- 전선은 인접한 서로 다른 LandHex controller에서 파생되는 presentation이며
  authoritative state가 아닌가. 정확한 전선 알고리즘은 T021에서 결정한다.
- 결과가 전술 RTS식 LandHex 미세 조작을 요구하지 않고 전략적 방향과 압력을
  읽게 하는가

최종 판단은 readability, 변화 속도, game feel, visual clutter와 responsive
검토를 함께 사용한다. 전체 run 약 15–25분 / 20–40 simulated years 목표는
지도 밀도를 고정하는 규칙이 아니라 Gate 1V의 pacing 기준이다.

## T036 Counterfactual Visual Review

동일한:

- ScenarioDefinition
- seed
- initial world
- simulation version

을 사용하는 두 실행에서
하나의 의미 있는 player action/policy만 바꿔 비교한다.

가능하면 split-screen 또는 synchronized playback을 사용한다.

검증 목표:

- player action이 story node를 선택하는 것이 아니라 world state를 바꾸는가
- 두 실행의 정치적/영토적 경로가 state 차이에 따라 달라질 수 있는가
- 같은 scripted crisis sequence로 강제 수렴하지 않는가
- 반대로 구조적 조건이 강할 경우 합리적인 convergence도 가능한가

Counterfactual runs가 항상 달라야 하는 것은 아니다.

## T037 Visual Simulation Gate

Gate 2로 넘어가기 전에 사람이 직접 판정한다.

Pass 조건:

- 10–30년 timelapse만 봐도 정치적 판세 변화가 읽힌다
- Contact → influence → organization → crisis/occupation의 연쇄가 시각적으로 이해된다
- 군사 침공과 정치적 침범이 구분된다
- LandHex 전선이 실제로 밀리고 후퇴하는 느낌이 있다
- major crisis가 map state와 무관하게 갑자기 spawn된 느낌이 적다
- 여러 seed가 동일한 scripted history처럼 보이지 않는다
- UI 보고서를 열지 않아도 주요 변화 방향을 알 수 있다

Fail 조건:

- 대부분의 변화가 숫자 로그를 봐야 이해된다
- 정치사상이 단순 map color fill로만 느껴진다
- organization이 보이기 전에 revolution이 발생한다
- 영토가 전선 없이 순간적으로 뒤집힌다
- 모든 run이 비슷한 crisis 순서를 따른다
- timelapse 자체를 보는 재미가 없다

Fail이면 T040 final graybox UX로 넘어가기 전에 simulation/presentation 문제를 수정한다.

# Gate 2 — Graybox UX

## T040 Strategy Map Graybox

Render the Region + LandHex territorial model.

The main map must visually support:

- country borders
- Region boundaries
- LandHex territorial control
- political influence overlays
- organization tokens
- military/revolution fronts
- ContactEdge visualization
- POIs

The map should feel like a strategic board rather than a dashboard.

Do not require entering a separate Site scene.

POIs are rendered directly inside the strategy map.

## T041 Time controls

Pause / 1x / medium / high.

Acceptance additions:

- Pause / normal / fast / very fast simulation speeds
- simulation tick remains authoritative and independent from render frame
- speed controls change wall-clock scheduling, not simulation rules
- critical events may auto-pause
- major warnings may auto-slow
- routine metric changes must not interrupt gameplay

Initial auto-pause candidates:

- revolution starts
- coup starts
- war declaration
- capital becomes critically threatened
- state dissolution imminent
- victory consolidation completed

Initial auto-slow candidates:

- major strike
- foreign intervention
- severe fiscal crisis
- political movement enters critical state

## T042 Region inspector

## T043 Political lens

## T044 Instability lens

## T045 Foreign influence lens

## T046 Causal WHY view

## T047 Win/loss pressure UI

---

# Gate 3 — AI Proof

## T050 Agent action schemas

## T051 Heuristic fallback

## T052 Server-side model endpoint

## T053 One faction Agent

## T054 One foreign-state Agent

## T055 AI failure/timeout test

## T056 AI A/B playtest

Compare to heuristic-only.

---

# Gate 4 — Diorama

## T060 Art direction lock

## T061 Asset pipeline

## T062 Capital/region diorama gray-to-art pass

## T063 World signals

- protest
- closures
- soldiers
- queues
- refugees
- banners
- trade activity

## T064 Camera/game feel

## T065 Lightweight FX

---

# Gate 5 — Responsive / Performance

## T070 Desktop composition

## T071 Tablet composition

## T072 Mobile portrait

## T073 Mobile landscape

## T074 Touch validation

## T075 GLB/texture optimization

## T076 Performance profiling

## T077 Reduced-motion/accessibility pass

---

# Gate 6 — Competition / Release

## T080 First-run onboarding

## T081 3–5 minute demo pacing

## T082 End-of-run history/replay summary

## T083 Production deploy

## T084 Browser matrix

## T085 Codex devlog cleanup

## T086 Capture submission video/materials

---

# Development Workflow / DX (separate from game gates)

## DX01 — TMR Codex Router Spike — FUTURE / NOT IMPLEMENTED

Explore a TMR-specific manual-assist routing workflow after repository evidence and
current task patterns justify it. This item is not a gameplay system, Codex config
change, skill installation, MCP connection, or automatic task-spawning framework.

Acceptance candidates:

- use the external router only as a reference and remove unrelated project context
- begin with dry-run output containing only recommended model, reason, and risk level
- cover routing fixtures such as docs formatting → Luna, authority migration/review →
  Terra, and same-seed determinism failure → Sol
- use actual repository evidence where available: diff scope, touched authority/schema
  paths, test failures, CI/replay evidence, and prior failed fixes; do not route from
  completion-report prose alone
- verify that model handoff does not pollute TMR context, change product ontology,
  skip tests, or imply that a stronger model is always correct
- keep current manual routing unchanged until measurable reduction in handoff loss,
  developer friction, and unnecessary escalation is demonstrated
- do not enable automatic task spawning in the first spike

Status: future development-tooling spike only. DX01 is not started by this patch.
