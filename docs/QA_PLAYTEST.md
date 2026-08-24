# QA & Playtest Plan

## 1. Two separate jobs

### QA

질문: "게임이 의도대로 동작하는가?"

### Fun Evaluation

질문: "의도대로 동작하는 게임이 실제로 재미있는가?"

둘을 같은 판정으로 합치지 않는다.

---

# 2. Functional QA

## Simulation

- same seed + same inputs => same deterministic result
- all core metrics stay within valid bounds
- no negative impossible populations/resources
- controller/owner state remains valid
- policy prerequisites enforced
- rebellion prerequisites enforced
- AI cannot directly mutate state
- AI invalid action rejected
- fallback action works
- victory condition triggers once
- defeat condition triggers once
- regime change does not auto-defeat
- civil-war winner can become continued central state

## Event Graph

- major state changes emit events
- causal IDs reference existing events
- WHY view never cites missing event
- replay uses recorded AI decisions

### Procedural Political Press / Gazette QA (future)

신문/관보 구현 이후 다음을 별도 확인한다.

- **Fact integrity:** 기사에 EventStore에 없는 event, actor, action, 숫자,
  사망자·피해, 또는 causal relation이 들어가면 FAIL. PressFacts와 기사에
  기록된 event/cause provenance가 남아야 한다.
- **Perspective boundary:** 왕립 관보·독립 신문·혁명 회보 등 publication
  perspective가 달라도 같은 recorded facts를 사용해야 하며, framing이
  simulation state나 event를 변경하면 FAIL.
- **Terminology:** 쿠데타, 혁명, 독재정, 공산주의, 검열, 비밀경찰 등 정확한
  정치·역사 용어를 generic euphemism으로 바꾸면 FAIL.
- **Anti-slop:** 실제 actor/action/location 대신 “복합적인 사회적 요인”,
  “다양한 이해관계”, “새로운 국면”, “사회적 역학”, “향후 귀추가 주목” 같은
  추상 문구를 반복하면 writing QA failure 후보로 판정한다.
- **Replay:** 같은 recorded events, 같은 publication context, 같은
  deterministic variant configuration은 같은 headline/article 결과를
  재현해야 한다. runtime API, local model, wall-clock randomness에 의존하면
  FAIL.
- **Serious-state tone:** 대규모 기근·민간인 사망·학살·전쟁 피해·강제이주·
  국가 붕괴의 인도적 상황을 punchline으로 표현하면 FAIL.

## Web

- no API secret in client bundle
- production build succeeds
- refresh/loading works
- desktop
- tablet
- mobile portrait
- mobile landscape
- touch controls
- keyboard optional
- experimental API off still playable

## Counterfactual / Anti-Railroad QA

Run controlled comparisons using the same:

- ScenarioDefinition
- seed
- initial WorldState
- simulation version

Change one meaningful player action or policy decision and compare downstream state/events.

Validate:

- player actions change simulation state rather than selecting authored story nodes
- agendas are derived from current pressure and do not advance as a fixed quest chain
- no hidden chapter/storyProgress/revolutionPhase forces mandatory crises
- rebellion/coup/revolution detectors read current simulation conditions
- one policy does not directly schedule a predetermined crisis
- the same action may produce different downstream outcomes under materially different world states
- different actions may legitimately converge when structural conditions dominate

Counterfactual runs are NOT required to diverge every time.

Fail when:

- both branches reach the same mandatory crisis because the scenario requires it
- a policy directly schedules a coup/revolution after fixed elapsed time
- agenda completion unlocks the next authored crisis
- changing relevant state cannot alter a supposedly emergent outcome

### Agenda read-model QA

- current pressure produces 0–4 agendas; no filler appears when the world is below detector thresholds
- the highest-severity agenda is identifiable without opening a report
- agenda titles use actual Country/Region/Faction/Ideology names and do not invent unsupported military, treasury, or institutional facts
- changing or resolving the underlying treasury, faction, contact, or diffusion evidence changes/removes the corresponding agenda
- an agenda selector does not mutate WorldState, faction strategy, ideology dimensions, RunState, or emit GameEvents
- `Faction.organization` and Region ideology organization remain visibly separate inputs
- currentStrategy alone, ideology support alone, or a foreign edge without actual diffusion evidence does not create a crisis agenda
- trend is `unknown` when no bounded temporal evidence is supplied; it is never guessed from severity
- every displayed causal event ID exists in the supplied evidence window
- intervention categories describe only implemented capabilities; unavailable treasury/diplomacy/military/repression/concession actions are not advertised
- agendas are current derived pressures, not a completion chain, quest sequence, chapter, or scheduled future crisis

### T025B strategic planner evaluation QA — future

- the existing deterministic heuristic is the baseline; any rollout/MCTS/RHEA
  comparison uses the same authoritative simulation and does not introduce a second
  world model or alternate rules
- planner candidates enumerate legal schema-valid actions and return through the
  common `ActionProposal` boundary; committed WorldState, RNG, ActionRecord history,
  and GameEvent history remain unchanged during counterfactual evaluation
- same ScenarioDefinition, starting state, game seed, opponent configuration, and
  simulation version are used across candidate comparisons; agent/search seed is
  tracked separately from game seed
- no-cheat checks reject hidden treasury/production/stateCapacity bonuses, impossible
  information, bypassed prerequisites, and different action rules
- actor-specific objectives and hard survival constraints are inspectable; no universal
  authoritative utility score or ideology-aligned moral objective is assumed
- measure state dissolution, treasury collapse, administrative overload misuse,
  meaningless `WAIT`, repeated actions, invalid/rejected actions, crisis-response
  delay, action diversity, player exploitability, planning CPU/forward-model calls,
  and counterfactual regret in addition to win rate
- compare planning horizon, candidate count, opponent-model depth, and
  forward-model-call budget; reject a more complex planner without measurable benefit
  at an acceptable deterministic/replay-safe cost
- this QA item does not install or require boardgame.io, Macao, Stratega, Tribes,
  OpenSpiel, RHEA, an LLM, or a new AI engine

### Intervention capacity QA

- `stateCapacity` is unchanged after an intervention starts; active administrative load is derived from runtime commitments
- headroom is `max(0, stateCapacity - committedLoad)` and overload is observable as `max(0, committedLoad - stateCapacity)`
- enough treasury/headroom and actual institutional prerequisite produce `INTERVENTION_STARTED`; insufficient treasury, headroom, country/policy state, or prerequisite produce deterministic `INTERVENTION_REJECTED`
- rejected requests create no commitment and no treasury cost/event; accepted same-tick requests compete in global ActionRecord sequence order without double-spend
- `Country.treasury` changes only in economy settlement; `TREASURY_CHANGED` references already emitted intervention-start and production causes where applicable
- a one-day commitment occupies its start day and releases before action resolution on the next tick; long commitments remain active until the exact completion boundary
- no daily intervention-progress event is emitted
- lowering stateCapacity below an existing commitment does not delete it; new commitments are blocked while headroom is insufficient, while T017 reads overload regionally without auto-cancel, headroom mutation, or treasury mutation
- terminal runs do not validate/start/complete interventions or advance tick/date/RNG
- no `politicalPower`, `policyPoints`, intervention mana, wall-clock duration, UI/renderer mutation, faction behavior, diplomacy, military, repression, or concession behavior is present

### Instability QA

- high ideology support alone, or `Faction.currentStrategy` alone, does not create regional unrest
- high grievance + faction organization + local ideology radicalism/organization + explicit relevance can create political pressure; `Faction.organization` and ideology organization remain separate values
- scarcity, political mobilization, and administrative overload remain distinguishable channels, and multiple real channels compound without exceeding 1
- `Region.unrest` rises and recedes over daily ticks instead of being assigned directly or reset immediately when pressure disappears
- administrative overload matters only through derived overload plus weak regional `stateControl`; low `stateControl` alone does not create arbitrary unrest
- `Country.instability` uses fully country-controlled Region population weighting; owner-only, partial, contested, faction-controlled, and uncontrolled Regions are excluded
- `Country.legitimacy` remains unchanged in the T017 baseline
- band-transition events are sparse and causal; small daily deltas do not spam events
- no single unrest/instability threshold emits or schedules rebellion, coup, revolution, civil war, or strike

### T017A static territorial topology QA

- one Region may resolve to two or more static LandHex definitions; no 1:1 Region-to-Hex invariant is assumed
- each LandHex has a stable ID, integer axial coordinate, valid Region membership, and static terrain descriptor only
- duplicate LandHex IDs, duplicate coordinates, non-integer coordinates, invalid Region IDs, and invalid terrain are rejected at scenario initialization
- physical neighbors are derived deterministically from coordinates and remain the same when definition insertion order changes
- physical cross-Region adjacency does not create, remove, or alter ContactGraph edges
- `Region.controller` remains the sole authoritative territorial-control source during T017A
- `LandHex.controller`, LandHex runtime state, controller synchronization, occupation, fronts, armies, war, rebellion, and rendering are absent
- static topology is owned by `ScenarioDefinition` and is not copied into `WorldState`
- `pnpm run inspect:t017a` prints Region membership, physical adjacency, cross-Region borders, and authority/validation PASS checks

### T017B territorial authority migration QA

- `WorldState.landHexStates[*].controller` is the only writable physical territorial authority; runtime `Region.controller` is absent
- a multi-Hex Region distinguishes fully controlled, partial, contested, faction presence, and uncontrolled projections without storing a Region summary
- Country-controlled LandHex and Region lists are derived in stable ID order; no stored `Country.controlledRegions` cache exists
- baseline economy, country ideology, country contact, and national instability aggregates include only fully controlled Regions; partial/contested Regions are not Hex-split
- `Region.ownerCountryId`, `Region.stateControl`, political influence, and physical territorial control remain independent during counterfactual control changes
- ContactGraph topology remains unchanged when LandHex controller or TerritorialTopology coordinates change
- `changeLandHexController` is immutable, reference-valid, deterministic, and emits no event for a no-op; changes emit `LAND_HEX_CONTROL_CHANGED` in append-only sequence order
- `pnpm run inspect:t017b` passes initialization, projection, consumer-boundary, event-order, independence, and alternate-cardinality checks
- T017B QA does not start rebellion/coup, war resolution, army/front/pathfinding, or UI/rendering validation

### T018 rebellion / coup prerequisite QA

- coup and rebellion are inspected as separate typed prerequisite models; neither is represented by a generic crisis score or one unrest/instability meter
- high unrest/instability alone, ideology support alone, `Faction.currentStrategy` alone, Agenda severity, and policy/intervention identity do not create or schedule a crisis
- coup candidates require scenario-declared capability, a current central government, faction grievance/organization/influence/resources, and derived state weakness
- rebellion candidates require scenario-declared capability, faction grievance/organization/resources, same-Region local radicalism + ideology organization + unrest, and geographic concentration; existing faction LandHex presence is supporting evidence rather than a circular requirement
- `Faction.organization` and `Region.ideology[*].organization` are inspected as separate metrics; support remains non-zero-sum supporting evidence
- state weakness is recomputed from current Country metrics, fully controlled Region unrest, and LandHex territorial projection; no `WorldState` weakness/progress/countdown field is accepted
- foreign support, military sympathy, weapons, and leadership are shown as `notImplemented` until the owning systems exist; fake fixture defaults are a failure
- T018 starts an active existing `Conflict` and emits bounded `COUP_ATTEMPT_STARTED` / `REBELLION_STARTED` evidence only; it does not resolve Government, change CountryId, change RunOutcome, move armies, or change LandHex controller
- the same active `(country, faction, kind)` conflict suppresses duplicate next-day detection; multiple distinct eligible factions/kinds remain valid
- candidate and event order remains deterministic under different faction insertion order; the same ScenarioDefinition + WorldState produces the same read model, conflict records, events, and unchanged RNG
- runtime Region has no `controller`; T018 detection leaves `WorldState.landHexStates[*].controller` byte-for-byte unchanged
- `pnpm run inspect:t018` prints the five prerequisite counterexamples, evidence honesty, authority, duplicate, and stable-order checks
- T018 QA does not begin T019/T020 diplomacy/foreign support, T021 army/front/occupation/war resolution, T022/T023 victory/dissolution, T024 persistence/replay, or UI/rendering

### T019 diplomacy / foreign state baseline QA

- foreign actors are existing non-player `Country` records, selected without a hardcoded
  country count and evaluated in stable `CountryId` order
- T019's baseline portion of `ForeignStateObservation` is pure and exposes only actual
  own-state, current Government, derived territorial, directed contact-runtime, and
  active Conflict facts; T020 adds a separate derived causal threat snapshot and does
  not invent regime-prestige, sanctions, or a generic relation meter
- foreign proposals are monthly only on the daily authoritative tick, at most one per
  foreign Country, and are targeted at the next tick through the shared action intake
- the T019 outgoing vocabulary remains `CLOSE_BORDER`, `REOPEN_BORDER`, and `WAIT`;
  T020's separate incoming vocabulary is direction-explicit and the heuristic remains
  deterministic with no RNG or LLM output
- `ActionProposal` -> `acceptActionProposal` -> heuristic `ActionRecord` uses the same
  global action sequence as player/faction/LLM inputs; no foreign queue or parallel log
  exists
- a weak foreign state can close only its own outgoing explicit `border` edges to a
  target Country; reverse edges, static topology, runtime multipliers, LandHex control,
  Region projections, and unrelated channels remain unchanged
- a foreign state can reopen only a closure carrying its own
  `blockedByCountryId` and `foreignPolicyBorderClosure` reason; duplicate close and
  invalid target/edge actions are deterministic rejections
- valid `WAIT` is accepted but emits no event; real transitions emit ordered border
  events and rejected actions emit bounded `FOREIGN_ACTION_REJECTED` evidence
- foreign-to-foreign actions work without special country-count assumptions
- no economy, trade, sanction, ideology, faction funding, propaganda, war, occupation,
  Government, PolicyState, or generic bilateral relation mutation is included
- terminal runs do not propose, resolve, emit, advance the clock, consume RNG, or mutate
  state; `pnpm run inspect:t019` passes the headless diagnostic checks
- T019 QA does not begin T021 war/occupation, T022/T023 victory/dissolution, T024
  persistence/replay, Gate 1V, or UI/rendering

### T020 foreign ideological threat QA

- `ForeignIdeologicalThreatRoute` / `ForeignIdeologicalThreatSnapshot` are pure
  derived read models; no threat meter is stored in `WorldState`, `Country`, or
  `RunState`, and T020 never writes ideology support/radicalism/organization
- a meaningful threat requires both a live directed foreign → domestic ContactGraph
  route and aligned domestic mobilization; source support, ideology/regime names,
  government labels, state vulnerability alone, or foreign contact existence alone
  does not qualify
- T015 support-gradient semantics, actual channel, effective strength, source/dest
  Region, ContactEdgeId, domestic faction IDs, local radicalism/organization, and
  vulnerability evidence remain inspectable; disabled/effective-zero routes contribute
  nothing and foreign-to-foreign actors use the same rules
- T019 `CLOSE_BORDER` remains outgoing actor → target. T020 incoming restriction uses
  only target-controlled source → actor-controlled destination explicit border edges;
  reverse/unrelated routes, static topology, base strength, multiplier, Region/LandHex
  control, faction dimensions, Country metrics, and Government remain unchanged
- incoming restriction records actor ownership and a distinct reason; restore only
  restores the actor's own T020 incoming closure and uses a separate restore threshold
  from restriction threshold, without cooldown or hidden clock
- information/trade/migration threat can be visible while implemented border response
  is unavailable; the deterministic decision in that case is `WAIT`, not a claim that
  border closure resolves a non-border route
- monthly proposals remain on the daily authoritative tick and share the global
  ActionRecord sequence; same state/actions produce same threats, proposals, events,
  and ordering, with no RNG consumption
- `pnpm run inspect:t020` prints Cases A–H: no contact, no domestic organization,
  domestic-only pressure, live causal threat, regime-label neutrality, T019 outgoing
  closure directionality, actual incoming restriction, and information-only WAIT
- T020 QA does not begin T021 army/front/occupation/war resolution, T022/T023,
  persistence/replay, Gate 1V, or UI/rendering

### T021 simplified conflict / war QA

- `pnpm test`, `pnpm run typecheck`, `pnpm run lint`, `pnpm run format`, and
  `pnpm run build` must pass with the T021 conflict resolver and its tests
- `pnpm run inspect:t017b`, `pnpm run inspect:t018`, `pnpm run inspect:t019`,
  `pnpm run inspect:t020`, and `pnpm run inspect:t021` must pass; T021 inspection
  covers peaceful borders, same-phase T018 detection without capture, initial
  rebellion seizure, adjacency expansion/recapture, country-war advance,
  stalemate, and deterministic collision ordering
- verify that only `WorldState.landHexStates[*].controller` changes physical
  territory, Region/Country territorial summaries remain projections, and no
  front is stored as a second authority
- verify that coup conflicts do not mutate LandHex control, one active armed
  Conflict changes at most one LandHex per weekly boundary, and a newly detected
  rebellion cannot capture territory in its detection phase
- verify Country/Faction strength inputs, resource saturation, advantage ties,
  deterministic `ConflictId` collision handling, shared event sequence, valid
  causeIds, and input-order independence
- verify occupation does not mutate legal owner, `Region.stateControl`, ideology,
  ContactGraph topology, CountryId, or RunOutcome; explicit government transition
  preserves CountryId and is not defeat
- verify that terminal victory/dissolution evaluation, persistence/replay,
  detailed army behavior, war declaration/peace, and UI/rendering remain outside
  T021

### T022 order consolidation QA

- `pnpm test`, `pnpm run typecheck`, `pnpm run lint`, `pnpm run format`, and
  `pnpm run build` must pass with the T022 evaluation phase, read model, and tests
- `pnpm run inspect:t022` must print Cases A–G: near miss, exact consecutive
  success, interrupted/restarted streak, Government transition, regime neutrality,
  partial capital, and relevant active civil war
- `ScenarioDefinition.orderConsolidationCriteria` is the only victory criteria
  source; `RunState` contains only current progress/outcome and no criteria copy
- stable/core/capital control must follow current `LandHex.controller` projection;
  `ownerCountryId`, cached Region control, and `contestedRegionIds` must not act as
  authority; partial multi-Hex Regions and partial capital fail full-control checks
- configured `maximumStableRegionUnrest` is tested at its inclusive boundary and
  no omitted/global unrest threshold is silently applied
- stateCapacity and treasury boundary checks use the actual Country fields; criteria
  absent fields such as legitimacy, production, militaryPower, ideology, regime
  classification, and policy name do not affect eligibility
- active civil-war blocking is exact and relevant to the player Country/faction;
  resolved civil war, foreign-only civil war, rebellion, coup, and foreign war do
  not use an automatic substitute meaning
- first eligibility emits one `ORDER_CONSOLIDATION_STARTED`, exact final tick emits
  one `ORDER_CONSOLIDATED` with empty `causeIds`, and `RunOutcome.causeEventId`
  points to that event; no daily progress spam or duplicate victory event exists
- Government/CountryId continuity and derived regime changes do not reset a valid
  streak; terminal follow-up steps do not advance tick/date/RNG or emit events
- T022 did not implement T023 dissolution; T023 now owns only the headless
  dissolution boundary. T024 persistence/replay, victory UI, ending/history
  presentation, and Gate 1V visualization remain outside these tasks

### T023 state dissolution QA

- `pnpm test`, `pnpm run typecheck`, `pnpm run lint`, `pnpm run format`, and
  `pnpm run build` must pass with the T023 dissolution read model, terminal writer,
  and regression tests
- `pnpm run inspect:t023` must print Cases A–H: negative treasury, instability,
  capital loss, Government transition, active civil war, actual state dissolution,
  simultaneous consolidation/dissolution precedence, and ordinary consolidation
- `ScenarioDefinition.dissolutionCriteria` is the only criteria source;
  `RunState` contains outcome/current evaluation only and receives no criteria copy
- the inclusive boundary `stateContinuity <= stateContinuityAtOrBelow` is the only
  currently supported dissolution evidence; T023 must not add a state-continuity
  writer, decay formula, timer, or sovereignty meter
- negative treasury, instability 100, stateCapacity 0, capital loss, occupation of
  all LandHexes, Government absence/transition, derived regime change, ideology
  change, active rebellion, and active civil war remain non-defeat regressions
- configured full-annexation, permanent-fragmentation, and sovereign-function
  conditions are reported as deferred until authoritative evidence exists; no
  Region controller, `ownerCountryId`, capital shortcut, or inferred permanence may
  satisfy them
- dissolution is evaluated before T022 in the combined phase; a dissolving step
  emits exactly one `STATE_DISSOLVED`, does not emit `ORDER_CONSOLIDATED`, uses
  empty `causeIds` when no real source event exists, and points
  `RunOutcome.causeEventId` to the emitted event
- an already-won run stays won; an already-defeated run is inert. Terminal follow-up
  steps must preserve WorldState identity and must not advance date, tick, RNG,
  actions, phases, or events
- T024 snapshot/replay, save/load, annexation, successor states, dissolution UI,
  final defeat presentation, and Gate 1V were outside T023. The former T024
  blockers—authoritative `localeCompare` audit and scenario-aware LandHex runtime
  invariant/deserialization review—are resolved by the T024 section below; save UI,
  storage, and Gate 1V remain deferred.

### T024 persistence / replay QA

T024 is complete as an in-memory typed snapshot/replay contract. It does not add
save UI, browser storage, cloud saves, replay viewer, or Gate 1V.

- `pnpm test`, `pnpm run typecheck`, `pnpm run lint`, `pnpm run format`, and
  `pnpm run build` must pass with the explicit `SerializedSimulationSnapshotV4`
  decoder, `EventStore` commit boundary, and regression tests
- `pnpm run inspect:t024` must pass snapshot version/scenario identity,
  authoritative runtime roundtrip, LandHex/contact/conflict/RNG/EventStore
  preservation, 120-tick uninterrupted vs 40→save/load→80 replay, multiple
  save boundaries, derived selector equivalence, and won/defeated terminal no-op
- snapshot input must contain no static ScenarioDefinition/topology,
  `Region.controller`, front, agenda, threat, regime, consolidation, dissolution,
  or other derived read model; those are reconstructed after load
- wrong scenario identity, unsupported format/unknown keys, incomplete/extra V4
  Country/Region/Faction/PolicyState identity sets, incomplete ideology catalog
  coverage, invalid policy/faction/intervention references, Government/Conflict
  outcome references, missing or unknown LandHex runtime state, static LandHex →
  Region mismatches, missing/forward event causes, broken `RunOutcome.causeEventId`,
  and forged/duplicate ActionRecord IDs must be rejected without silent repair
- intervention commitments must be traceable to accepted deterministic
  `START_INTERVENTION` ActionRecords with matching source, country, tick,
  intervention, and commitment ID
- authoritative ordering must be locale-independent; ordering audit evidence is
  source-audited and covered by deterministic replay tests, without claiming a
  runtime numeric scan
- a nonzero RNG cursor must survive save/load and produce the same subsequent
  random stream; an event emitted after load may reference a preserved pre-save
  cause at the persistence boundary, while gameplay phases do not invent causes
- preserve T017B LandHex authority, T021 phase-start conflict semantics, T022
  consolidation progress, T023 threshold/occupation-only non-defeat, and terminal
  tick/date/RNG/event freeze across snapshot boundaries
- invalid live serialization and invalid candidate next-state commit must fail
  atomically without mutating the source RunRecord
- V2 has no dynamic Country/Region/Faction/PolicyState lifecycle; incompatible
  ScenarioDefinition content requires a `scenario.version` bump. Gate 1V
  visualization, save UI, and persistence backend selection remain future work.

### Scenario expansion and content-freeze QA

- after T025, a valid alternate `ScenarioDefinition` with different Country/Region/LandHex counts and at least one multi-Hex Region must pass without an engine cardinality assumption or a 1:1 Region-to-LandHex assumption
- adding Country, Region, LandHex, topology, or major Intervention content is a content change; before content freeze it may be adjusted from playtest evidence
- after content freeze or release-candidate, re-run the relevant functional regression, multi-seed, pacing, and visual simulation review because content can change contact, diffusion, economy, faction, diplomacy, conflict, instability, and victory/defeat pacing
- once production historical Intervention content exists, check for a dominant intervention, a universally correct reform path, a zero-trade-off action, hidden progression-tree behavior, and the same scripted crisis across seeds
- regime taxonomy count and tone guidelines are product direction, not duplicated QA assertions here

### V00 / Gate 1V visual system QA

상세 checklist는 `docs/VISUAL_QA.md`가 소유한다. 여기서는 Gate 1V entry와
playtest 판정의 핵심만 유지한다.

- V00 Visual Bible, Visual Reference Catalog, Asset Source Catalog, Visual QA,
  provenance/acceptance 규칙이 존재해야 Gate 1V implementation을 시작한다
- Gate 1V 초반은 flat/simple LandHex, primitive building/token/route/pattern으로
  debug-first 검증을 수행한다. final art가 simulation signal을 가리면 FAIL이다
- `WorldState.landHexStates[*].controller` 기반 territorial control,
  Region-level political influence, actual Faction token, directed ContactGraph,
  active armed Conflict front는 서로 다른 visual channel을 가져야 한다
- 화면에 보이는 crowd, army, flag, protest, refugee, market, front는 실제
  simulation state/event/evidence에서 파생되어야 한다
- L1 critical / L2 decision / L3 detail hierarchy가 유지되고, 모든 정보를
  동일한 rounded card로 표현하는 card-soup가 없어야 한다
- political influence는 색상만으로 구분하지 않으며, red/one hue를 ideology,
  enemy, shortage, danger, alert에 동시에 재사용하지 않는다
- Visual Benchmark Scene에서 donor origin mismatch, signature over-detail,
  geometry/material mismatch, unexplained decoration, unsupported signal을 기록한다
- external/custom/kitbash asset은 동일 acceptance gate와 provenance/license
  검사를 통과해야 하며, `UNKNOWN` rights는 직접 사용하지 않는다
- desktop/tablet/mobile에서 같은 semantic grammar와 다른 composition이 유지되는지
  확인한다. map/inspector, sheet/overlay, bottom-sheet 구조를 검토한다
- canonical screenshot 후보 `CANON-01`–`CANON-06`은 Gate 2/5 이후 baseline으로
  만들며, Gate 1V 이후 external human critique를 두 번 수행한다
- current 7 Regions / 9 LandHexes는 validation fixture일 뿐 final density가
  아니다. Gate 1V에서 candidate density와 visual clutter/readability를 비교한다
- Gate 1V 진입 전에 20–40 simulated years(약 7,200–14,400 daily ticks)의
  long-run performance benchmark를 수행한다. F01A는 측정 후 canonical
  continuation incremental validation을 적용했으며, persistence trust-boundary
  full validation은 유지한다

### V01 Presentation State QA

`src/presentation/presentationState.ts`는 renderer 없이 semantic read model만
파생한다. V01 회귀에서는 다음을 확인한다.

- ScenarioDefinition/WorldState와 input record가 호출 전후 변경되지 않는다
- static LandHex q/r, runtime LandHex controller, Region control summary,
  Region ideology support, legal owner가 서로 다른 fields/계층으로 남는다
- multi-Hex Region의 partial/contested control이 full control로 flatten되지
  않는다
- 실제 faction-controlled LandHex가 없는 faction에 organization token을
  발명하지 않으며, 실제 token identity/order가 domain ID 기반으로 안정적이다
- directed ContactGraph source/target/channel과 disabled route metadata가
  유지되고, active armed Conflict front만 표시되며 coup/평화 국경은 비어 있다
- Country/Region/Faction record insertion order를 바꿔도 결과가 같고,
  T024 JSON save/load 후 저장하지 않은 PresentationState가 동일하게
  재파생된다
- no-front/no-token/no-route/empty scenario가 정상적인 빈 배열을 반환한다
- `src/sim/`이 presentation을 import하지 않고 presentation module이
  React/R3F/Three.js 또는 renderer coordinate/style/asset을 import하지 않는다

저비용 자동 checkpoint는 `pnpm run inspect:v01`이며, V02/실제 renderer 전까지
semantic styling이나 visual screenshot pass를 이 결과로 대체하지 않는다.
---

# F01 Long-run Headless QA

F01은 재미/밸런스 PASS 판정이 아니라 현재 authoritative simulation의 장기 실행
가능성과 측정 가능성을 확인하는 developer benchmark다.

- `pnpm run inspect:f01`은 T021 political-crisis diagnostic fixture를 고정 seed
  `40101`, `WAIT`/no-intervention, 360일/년으로 5/10/20/40년 실행한다
- horizon은 각각 1,800/3,600/7,200/14,400 canonical daily ticks이며,
  `runSimulationStep`과 `commitSimulationStep`을 통해서만 진행한다. terminal이면
  즉시 중단하고 terminal 이후 no-op tick을 만들지 않는다
- runtime/ticks-per-second는 wall-clock observation이며 simulation authority,
  RNG, replay 결과에 들어가지 않는다. EventStore size, actual event vocabulary,
  ActionRecord 수, treasury/stateCapacity/instability/LandHex/faction trajectory,
  yearly checkpoint를 함께 기록한다
- WAIT baseline은 매 tick validated action이 0개인 기존 입력 seam이다. 별도
  policy/AI/직접 WorldState mutation을 추가하지 않는다
- 2026-08-22 F01 baseline은 5y 1.34s/1,800 ticks, 10y 5.96s/3,600 ticks,
  20y 22.61s/7,200 ticks, 40y 101.75s/14,400 ticks였고 20→40년 runtime
  scaling은 약 4.50x였다(벽시계 값은 실행 환경에 따라 달라짐)
- F01A 이후 동일 조건은 5y 0.497s/3,619 ticks/sec, 10y 0.830s/4,336
  ticks/sec, 20y 1.561s/4,612 ticks/sec, 40y 3.466s/4,155 ticks/sec이며
  20→40년 scaling은 약 2.22x다. canonical continuation은 incremental
  validation을 사용하고, serialize/deserialize 및 corruption boundary는
  full validation을 유지한다
- F01A는 balance/gameplay를 바꾸지 않았고, WAIT simulation-derived result와
  replay/cause/atomicity regression은 baseline과 동등하다. F02 multi-seed와
  F05 pacing 판정은 아직 수행하지 않았다
- F01B는 trusted `SimulationStepResult`를 정확한 source `WorldState` identity에
  bind하고 commit에서 one-shot consume한다. mixed-parent, failed-reuse,
  successful-reuse, canonical nested mutation 차단을 regression으로 검증한다
- canonical `RunRecord`/step-result graph는 process-local runtime immutable이며,
  이미 freeze된 object는 incremental `WeakSet` 경계에서 재사용한다. 이는
  serialize/deserialize full validation이나 corruption rejection을 대체하지
  않는다
- F01B representative hardening run은 5y `0.488s`, 10y `0.842s`, 20y
  `2.488s`, 40y `7.089s`, 20→40 scaling `2.85x`였다. F01A의 `3.466s`/40y
  baseline보다 freeze 비용이 늘었지만 F01 original `101.75s`로 회귀하지 않았고
  authoritative outcome/replay/invariants는 동일했다
- F01C는 raw canonical registration export를 제거하고, RunRecord/step-result
  registration을 각 validated seam 내부로 제한했다. recursive freeze completed
  bookkeeping은 성공 후에만 기록되며, nested Map/Set 동일-object 재시도도 계속
  reject된다
- F01C 대표 실행은 5y `0.617s`, 10y `0.994s`, 20y `2.478s`, 40y `6.802s`,
  20→40 scaling `2.74x`였다. 원래 F01의 `101.75s`로 회귀하지 않았고 baseline
  simulation-derived 결과는 동일했다
- 동일 seed/inputs의 simulation-derived summary와 2년 midpoint JSON
  serialize → deserialize → resume 결과가 일치했고 invariants는 PASS했다
- 이번 run에서 0–100 `Country.instability` 단위를 기준으로 한 pathology는
  관찰되지 않았다. pathology detector는 balance FAIL threshold가 아니며,
  F02 multi-seed, F03 counterfactual, F04 exploit, F05 pacing/fun 판정에서
  장기 분포와 pacing을 다시 본다
- 40년 benchmark는 일반 `pnpm test`에 포함하지 않고 `inspect:f01` 전용으로
  실행한다. 소규모 harness correctness 회귀만 unit test에 둔다

## F02 Multi-seed Outcome Survey QA

F02는 동일 T021 diagnostic fixture와 `WAIT`/no-intervention baseline을 사용해
현재 simulation의 endogenous history 분포를 측정한다. balance 또는 fun PASS를
결정하지 않으며, survey telemetry는 WorldState authority가 아니다.

- `pnpm run inspect:f02`는 seeds `0..22`와 F01 baseline seed `40101`을 각각
  40 simulated years / 14,400 authoritative ticks까지 순차 실행한다. 기존
  F01 canonical runner를 재사용하고 terminal이면 즉시 중단한다
- 2026-08-23 survey는 24/24 active, orderConsolidated 0/24,
  stateDissolved 0/24였다. rebellion/coup/territorial change는 각각
  `1/1/1`, `1/1/1`, `3/3/3` (min/median/max)였고 civil war와 Government
  transition은 24개 seed 모두 0이었다
- exact/coarse history signature가 각각 1종이고 최대 cluster가 24/24였으므로,
  이 baseline에서는 seed sensitivity가 관찰되지 않았다. 이는 새 RNG를 추가할
  근거가 아니라 F03/F05에서 검토할 finding이다
- treasury는 24/24, stateCapacity도 24/24 unchanged였다. faction
  organization total start/peak/final은 모두 `1.60–1.60`, crisis-participating
  faction은 `2–2`였다
- 24/24가 controlled LandHex 0에 도달했고 회복은 0, final active at zero는
  24였다. T023의 `0 Hex != dissolution` semantics는 유지한다
- consolidation eligibility는 0/24, stateContinuity minimum은
  `100 / 100 / 100`, scenario dissolution threshold 도달은 0/24였다.
  최장 정치적 침묵은 약 39.94년이었다
- diagnostic concern은 outcome 미도달, 낮은 history diversity, 경제/국가역량
  정체, zero-territory 지속, 긴 침묵, consolidation 미도달,
  dissolution 미도달이다. 자동 FAIL threshold나 opaque fun score는 만들지 않는다
- small unit tests는 동일 survey determinism, seed 실행 순서 독립성/교차 오염,
  aggregate 계산, terminal 조기 중단을 검증한다. 24×40년 benchmark는 일반
  `pnpm test`에서 제외한다
- F04A 이후 2026-08-24 regression은 24/24 active, 동일 political/territorial
  distribution, exact/coarse signature `1/1`, largest cluster `24/24`, seed
  sensitivity `NOT OBSERVED`를 유지했다. 345,600 ticks는 약 137.79초 / 약
  2,508 ticks/sec였고, treasury/stateCapacity stasis와 zero-territory
  final-active도 변하지 않았다. 이는 F04A monthly faction writer가 WAIT
  baseline을 오염시키지 않았다는 evidence다

F02 이후 F03 counterfactual, F04 exploit/degeneracy, F05 pacing/fun decision을
별도로 수행한다. V02/renderer/visual review는 Gate 1F 순서가 끝날 때까지
시작하지 않는다.

## F03 Intervention Counterfactual QA

F03는 intervention balance를 조정하는 단계가 아니라, 같은 authoritative
snapshot에서 `WAIT`와 합법적인 단회 intervention을 갈라 실제 player agency와
downstream consumer를 확인하는 단계다. 상세 결과는
`docs/F03_INTERVENTION_COUNTERFACTUALS.md`가 소유한다.

- `t021.rebellion-fixture`는 intervention catalog/국고/ContactGraph가 없어
  F03에 부적합하므로 수정하지 않는다
- `gate1f.validation` developer-only composition fixture가 T021 정치 위기와
  기존 T016B administrative intervention catalog를 함께 검증한다. 이는 새
  gameplay system이나 production scenario lock이 아니다
- branch는 T024 snapshot clone에서 시작하고 `ActionRecord →
runSimulationStep → commitSimulationStep` canonical path만 사용한다. 직접
  treasury, faction, conflict, LandHex mutation을 하지 않는다
- day 0/90/180 natural WAIT checkpoint에서 WAIT, short, long,
  prerequisite를 비교하며 feasibility 실패 branch는 실행하지 않는다
- treasury, stateCapacity, administrative load/headroom, Region unrest/scarcity,
  faction metrics, controlled LandHex, conflict/political event, consolidation,
  terminal outcome을 checkpoint로 기록한다
- action → commitment → `INTERVENTION_STARTED` → economy treasury charge와
  실제 cost/load/duration trade-off를 확인한다
- political event/history가 WAIT와 갈라지는지, first divergence,
  persistence/re-convergence, dead-end/no-op candidate를 별도로 기록한다.
  opaque agency/fun score는 만들지 않는다
- 현재 결과는 `PLAYER_AGENCY_WEAK`: immediate treasury/administrative 차이는
  있으나 정치적 downstream divergence는 관찰되지 않았다. 세 기존
  intervention을 integration-gap 후보로 기록했으며 F03에서 수정하지 않았다
- `pnpm run inspect:f03`가 3×4 branch/10-year matrix를 실행한다. 장기 matrix는
  일반 `pnpm test`에서 제외하고 small determinism, branch-order, legal/
  infeasible action, purity 회귀만 CI에서 실행한다

F03 결과가 positive agency PASS가 아니므로 F04 exploit 분석보다 먼저 최소
Gate1F intervention downstream integration repair proposal을 검토하는 것이
권장된다. F04/V02는 시작하지 않는다.

## F03A Intervention downstream integration QA

F03A는 F03에서 발견한 treasury/administrative-only intervention dead-end를
새 정치 시스템 없이 기존 authoritative consumer에 연결하는 최소 검증이다.
상세 causal table은 `docs/F03A_INTERVENTION_DOWNSTREAM_INTEGRATION.md`가
소유한다.

- `t021.rebellion-fixture`는 그대로 두고, T021 정치 위기/파벌/LandHex와
  기존 T016B catalog를 조합한 developer-only `gate1f.validation`에서만
  effect content를 검증한다
- `InterventionDefinition.completionEffects`는 scenario-owned typed union이며
  resource production capacity, faction grievance, faction organization 세
  concrete delta 외의 generic scripting/modifier/score를 제공하지 않는다
- accepted action의 treasury cost, administrative load, prerequisite, authoritative
  completion duration은 F03와 동일하게 유지한다. `stateCapacity`를 소비하지
  않는다
- completion tick에서 immutable replacement로 effect를 한 번 적용하고,
  `INTERVENTION_COMPLETED` payload가 실제 previous/next/changed 값을 기록한다.
  start/commitment 단계에서 즉시 정치 사건을 만들지 않는다
- short의 resource capacity effect는 기존 resources → scarcity → T017
  material pressure가 읽고, long/prerequisite의 faction effect는 T016
  observations와 T018 prerequisite read model이 읽는다. T021은 faction
  organization을 existing operational-strength input으로만 읽는다
- effect는 rebellion/coup/conflict/Government/territory/consolidation/
  dissolution을 직접 schedule하거나 mutate하지 않는다. T022/T023은 기존
  criteria/authority를 유지한다
- resource effect의 `INTERVENTION_COMPLETED → RESOURCE_PRODUCED →
RESOURCE_SHORTAGE_CHANGED` cause chain, EventStore/ActionRecord provenance,
  mid-commitment save/load exactly-once, replay equivalence를 확인한다
- same WAIT snapshot branch와 F02 no-intervention baseline은 effect 없이
  이전 결과와 같아야 한다. branch order independence와 telemetry purity를
  유지한다
- F03A integration proof는 세 intervention 모두 non-cost state와 existing
  consumer difference를 관찰했지만 정치적 event/history divergence는 아직
  없었다. 따라서 player agency는 `PLAYER_AGENCY_WEAK`로 유지하며, 이를
  balance PASS나 opaque score로 바꾸지 않는다

F03A는 production intervention catalog 확장, historical effect magnitude
조정, F04 exploit 분석, V02 renderer를 시작하지 않는다.

## F03B Agency leverage / threshold sensitivity QA

F03B는 F03A 이후에도 정치적 history가 WAIT와 같았던 이유를 측정한다. 결과와
margin table은 `docs/F03B_AGENCY_LEVERAGE_DIAGNOSIS.md`가 소유한다.

- `pnpm run inspect:f03b`는 F03의 동일한 day 0/90/180 checkpoint와 WAIT/세
  intervention branch를 재사용한다. 새 simulation runner나 direct WorldState
  mutation은 없다
- T018은 daily prerequisite evaluation, T016은 monthly boundary, T021은
  weekly resolution boundary로 실제 source cadence를 기록한다
- numeric gate는 `value - threshold`, boolean gate는 status만 기록한다. 모든
  gate를 opaque scalar로 합치지 않는다
- branch별로 intervention start/completion, T018 prerequisite snapshot,
  failed gate, eligibility difference window, detector opportunity count,
  active conflict/dedup, political event opportunity, annual/decision
  checkpoint를 기록한다
- short의 T017 chain은 capacity → scarcity/material pressure → smoothed unrest/
  instability로 분리 측정한다. 현재 `riseRate 0.02`, `recoveryRate 0.015`를
  변경하지 않는다
- long/prerequisite는 각각 organization/grievance gate margin을 실제 T018
  read model에서 비교한다. 현재 1x effect가 eligibility window를 만들지만
  active conflict와 State A의 late completion 때문에 history는 갈라지지 않는다
- T022는 stable region/capital/core territory/state capacity/treasury/active
  civil war criterion을 별도로 기록한다. consolidation progress/threshold는
  변경하지 않는다
- 0.5x/1x/2x/4x probe는 cloned developer scenario에서만 production effect
  pipeline을 사용한다. 결과를 production balance나 threshold decision으로
  lock하지 않는다
- 현재 판정은 `PLAYER_AGENCY_WEAK` 유지, F04는 decision-boundary가 실제로
  바뀐다는 좁은 기준으로 READY다. active conflict/dedup caveat와 정치 event
  divergence 부재는 F04에서 다시 검증한다

F03B는 threshold/effect/cost/duration/cadence/RNG/gameplay를 수정하지 않으며,
F04 exploit analysis와 V02 renderer를 시작하지 않는다.

## F04 Degenerate Strategy / Exploit QA

F04는 balance를 조정하는 단계가 아니라, 실제 decision-boundary snapshot에서
반복 개입·타이밍·commitment overlap·비용/행정력 우회 가능성을 측정하는
developer-only survey다. 상세 raw evidence는
`docs/F04_DEGENERATE_STRATEGY_EXPLOIT_CHECK.md`가 소유한다.

- `pnpm run inspect:f04`는 `gate1f.validation`의 day 0/90/180 natural checkpoint를
  사용하고, `WAIT`, repeat short/long/prerequisite, single long/prerequisite,
  `MIX`, JIT long/prerequisite를 각각 10 simulated years 실행한다. 각 branch는
  snapshot clone에서 시작한다
- strategy는 feasibility를 확인한 legal action만 제출하며, 직접 WorldState를
  수정하지 않는다. 한 authoritative tick에 최대 하나의 player action을 넣고,
  terminal이면 즉시 중단한다
- resource audit은 treasury start/min/final, intervention spend/charge,
  commitment overlap, peak administrative load/headroom, accepted/rejected/
  completed count, no-op completion을 기록한다. `TREASURY_CHANGED`가 net-zero
  tick에서 생략될 수 있는 정상 경로는 settled-without-change-event로 별도
  설명하며 cost avoidance로 판정하지 않는다
- crisis audit은 coup/rebellion eligibility exposure, political event sequence,
  Government/territory/outcome, preventive/crisis-response/recovery agency를
  WAIT와 비교한다. opaque utility/fun score는 만들지 않는다
- 2026-08-23 최종 실행은 27 branches / 97,200 ticks / 약 44.5초 / 약 2,185
  ticks/sec였다.
  admin headroom bypass와 cost avoidance는 없었고, 최대 committed load 60은
  state capacity 안에 있었다. 반복 long/prerequisite의 bound no-op과
  organization/grievance one-way ratchet 후보를 기록했으며, 단일 Long(cost 20)
  및 Prerequisite(cost 12)에서도 각각 3,420 ticks의 crisis eligibility shutoff가
  관찰되어 당시 F04의 historical `CHEAP_PERMANENT_GATE_SHUTOFF [MAJOR]`를
  기록했다. 이 finding은 F04A 이후 current open concern으로 유지하지 않는다
- PRE_CRISIS에서는 long/prerequisite가 각각 coup/rebellion eligibility
  exposure를 3,420 ticks 줄였지만 history는 WAIT와 같았다. POST_CONFLICT와
  RECOVERY_STRESS에서는 active-conflict futility와 zero-territory recovery
  부재가 관찰됐다. pre-crisis eligibility만 바뀌고 history가 갈라지지 않아
  `PRE_CRISIS_TIMING_CLIFF [MAJOR]`를 추가했으며, WAIT는 Repeat Short에 대해
  resource-dimension weak dominance 후보였다
- F04 판정은 `F05 NOT_READY`다. 이번 단계에서는 어떤 exploit, recovery,
  lifecycle, balance도 수정하지 않는다. F05 전에 active-conflict response,
  recovery path, one-way ratchet, WAIT dominance 후보를 별도 repair/diagnosis한다
- representative repeated strategy save/load와 strategy execution-order
  independence는 PASS했다. F02 WAIT 및 F03A/F03B measurement regression도
  유지한다

F04는 `F05` pacing/fun decision이나 `V02` renderer를 시작하지 않는다.

## F04C-R Political / Historical Reference Grounding QA

F04C-R은 docs/research only task다. 역사 사례는 scripted history나 regime bonus로
옮기지 않으며, source-supported fact, interpretation, TMR inference를 문서에서
구분한다. 상세 source ledger는
`docs/F04C_R_POLITICAL_HISTORICAL_REFERENCE_GROUNDING.md`가 소유한다.

- material relief, political amnesty, opposition legalization, labor
  legalization/bargaining, censorship/assembly restriction 각각에 두 개의
  materially different case 또는 강한 case + counterexample/limitation이
  기록되어야 한다
- 법률 text는 법적 범위를 증명하는 데만 사용하고, causal outcome은 학술/공식
  역사 자료로 별도 확인한다
- `politicalCompetition` 결정은 **ADD**이지만 `banned | restricted | plural`의
  좁은 legal political-organization access만 뜻해야 한다. democracy score,
  suffrage/press/labor duplicate, election result, government turnover가 되면
  F04D design failure다
- monarchy + plural competition, republic + banned competition, broad suffrage +
  restricted competition, free press + restricted candidacy가 schema상 설명
  가능한지 확인한다
- F04D action recommendation은 material relief, 제한된 political
  amnesty/accommodation, opposition legalization, coercive restriction이다.
  full amnesty/transitional justice, full bargaining, elections, underground
  information, military faction, war, arcane mechanics는 구현하지 않는다
- 문서는 `stability`, `politicalPower`, `reformPoints` 또는 regime-specific
  stability bonus를 추가하거나 추천하지 않는다
- research result가 F05를 READY로 만들지 않는다. F04D 구현과 same-state
  counterfactual recheck가 먼저다

2026-08-24 F04C-R: `PASS`. `politicalCompetition`은 F04D에서 narrow ADD,
F04D READY는 narrow slice에 한정, F05는 `NOT READY`다. gameplay/source schema/
balance/RNG/inspection은 변경하지 않았다.

## F04A Endogenous faction dynamics QA

F04A는 F04의 one-way-ratchet finding을 측정 가능한 최소 범위에서 보완한다.
기존 `factionPressure` monthly boundary에만 writer가 실행되며,
`Faction.grievance`와 `Faction.organization`은 현재 authoritative hostile
drivers와 faction/local political drivers를 향해 bounded immutable replacement로
이동한다. `0.02` step은 Gate 1F recovery-timescale diagnostic이며 최종 balance
상수가 아니다.

- hostile scarcity/unrest/weak-state conditions에서는 grievance가 다시 상승할
  수 있어야 하며, stable low pressure에서는 organization/grievance를 강제로
  rebound시키지 않는다
- 충분한 faction resources/influence/local activation이 있을 때 organization이
  회복될 수 있어야 하고, weak drivers에서는 재형성되지 않는다
- 값은 현재 domain bound를 넘지 않고, faction insertion order에 의존하지 않는다
- `currentStrategy`/support 단독 trigger, intervention ID 분기, RNG, monthly
  event spam, direct crisis/conflict/territory/recovery writer는 금지한다
- T017/T018/T021이 기존 규칙으로 갱신된 faction fields를 읽는다. T022/T023,
  `WorldState.landHexStates[*].controller`, Government는 F04A에서 변경하지
  않는다
- F03A completion effect와 F04A monthly dynamics가 같은 canonical immutable
  replacement path를 사용하며, T024 replay/save-load와 exactly-once effect
  regression을 유지한다
- `pnpm run inspect:f04a`는 F03 branch seam을 재사용해 accepted/completion,
  start/1-year/final faction values, horizon state difference, political history
  difference, remaining one-way paths를 출력한다. full daily telemetry를
  WorldState에 저장하지 않는다

2026-08-24 F04A inspection에서는 9개 State A branch가 모두 accepted 되었고,
long/prerequisite faction state difference가 10년 안에 회복되어 one-way-ratchet
잔여 경로가 없었다. 이 fixture의 political event/Government/territory/outcome은
여전히 WAIT와 같으며, active-conflict lifecycle, pre-crisis timing, WAIT
dominance, zero-territory recovery는 F04/F05의 미해결 measurement finding이다.

F04A 이후 `CHEAP_PERMANENT_GATE_SHUTOFF`는 historical F04 finding으로
재분류되었다. 현재 `inspect:f04`는 해당 concern을 발생시키지 않으며,
SINGLE_LONG의 coup eligibility difference는 `149/3601` ticks,
SINGLE_PREREQUISITE의 rebellion eligibility difference는 `0`이다.

F04A 자체에서는 F04B, F05 pacing/fun decision, V02 renderer를 시작하지
않았으며, F04B는 별도 후속 repair slice로 완료되었다.

## F04B Active conflict response / internal recovery QA

F04B는 active internal rebellion의 현재 운영 상태와 무영토 정부의 제한적
내부 회복 경로만 검증한다. T018의 생성 eligibility와 active-conflict 상태를
혼동하지 않으며, faction이 LandHex를 점유한 동안 grievance 감소만으로 conflict를
삭제하지 않는다.

- strong residual state에서 valid Government, Country military strength,
  affected Region `stateControl`과 current faction operational strength가
  기존 T021 margin을 넘으면 weekly boundary마다 최대 1개 LandHex를 회복한다
- weak residual state, coup, foreign-country war에서는 회복하지 않는다
- physical territory는 계속 `WorldState.landHexStates[*].controller`이며,
  mutation은 `changeLandHexController()`만 사용한다. Region owner/stateControl을
  controller로 복사하지 않는다
- active-conflict organization/resources 재평가, occupied rebellion persistence,
  one-Hex limit, insertion order, save/load equivalence를 테스트한다

2026-08-24 F04B inspection은 strong case에서 1개 Hex 회복과 active conflict
유지를, weak case에서 정상 stalemate를 확인했다. F02 WAIT 24-seed regression은
24/24 active, 동일 정치/영토 분포, exact/coarse signature 1/1을 유지했다.
F04의 WAIT dominance, pre-crisis timing cliff, intervention cost/agency 문제는
여전히 별도 finding이며 F05는 NOT READY다.

F04B는 F05 pacing/fun decision이나 V02 renderer를 시작하지 않는다.

## F04C Institution-mediated stabilization design QA

F04C는 production simulation을 변경하지 않는 design-only checkpoint다.
검토 기준은 체제명이 직접 bonus가 되는지보다, 현재 Institutional Rules와
실제 Faction/Region/Country/Intervention state가 서로 다른 안정화 경로와
반작용을 설명하는지다.

- 현재 7개 institutional rule과 실제 consumer를 source 기준으로 inventory한다
- material provision, representation, elite bargain, organization integration,
  coercion, administration, military/security, ideological legitimacy를 새
  meter 없이 설계 언어로 분리한다
- 강한 왕정, 입헌군주정, 민주공화정, 권위주의/개인독재, 군사독재,
  공산주의 일당국가 각각에 구조적 강점과 취약성이 있는지 확인한다
- `RegimeClassification`이 derived label로 남고 `Country.regime`이나 regime
  bonus가 추가되지 않았는지 확인한다
- action archetype마다 institution prerequisite, concrete state target,
  cost/admin/time, factional counter-reaction, preventive/crisis/recovery 역할을
  기록한다
- political competition, elections, military faction, local autonomy, arcane
  privilege처럼 현재 authority가 없는 내용은 GAP/NEW DOMAIN/DEFER로 표시한다
- War as Politics는 설계 slot만 만들고 war/mobilization/army를 구현하지 않는다
- 판타지 핵심 축은 Arcane Privilege / Mage Guild로 추천하되, magic을 combat
  bonus나 lore-only decoration으로 만들지 않는다
- F04C 이후 F04D가 필요한 최소 subset을 결정하며 F05는 아직 `NOT_READY`다

상세 QA/design evidence는
`docs/F04C_INSTITUTION_MEDIATED_STABILIZATION_DESIGN.md`에 기록한다.
이번 checkpoint에서 gameplay code, balance, RNG, F04D, F05, V02는 변경하지
않는다.

## F04D Narrow institution-action QA

F04D는 제도 규칙 자체, 네 대응의 직접 효과, 기존 consumer를 통한 후속 history,
T024 save/load를 함께 검사한다. 대표 명령은 `pnpm run inspect:f04d`다.

- `politicalCompetition`은 required `banned | restricted | plural` enum이고
  snapshot version 2에서 roundtrip한다. version 1, 누락 값, enum 밖의 값은
  deserialize 단계에서 거부한다
- 같은 state에서 competition만 `banned`와 `plural`로 바꾸면 BARGAIN
  availability가 달라져야 한다. LOBBY와 ORGANIZE는 각각 press/labor rule만
  계속 읽어야 한다
- material relief, 제한된 accommodation, opposition legalization, coercive
  restriction 네 정의가 같은 base checkpoint에서 각각 시작 가능해야 한다
- 모든 response는 treasury cost, administrative load, duration을 가지며,
  이미 같은 completion state에 도달한 의미 없는 반복은 거부되어야 한다
- accommodation과 legalization은 조직을 직접 지우지 않는다. coercion도
  organization을 0으로 만들거나 faction/conflict를 삭제하지 않고 grievance
  반작용 및 F04A 재형성 경로를 남긴다
- 제도 변경 event는 completion event를 원인으로 참조하고 이전/새 값을
  기록해야 한다. action ID가 coup/rebellion/conflict/territory/government/
  consolidation을 직접 쓰면 실패다
- seed 40103의 동일 tick-0 checkpoint에서 WAIT와 네 response가 2년 후 서로
  다른 실제 history를 만들어야 한다. same-state rule pair도 eligibility와
  history가 모두 달라야 한다
- continuous 720-day run과 day 360 save/load continuation, branch insertion-order
  comparison이 각각 같은 canonical result를 만들어야 한다
- WAIT dominance, cheap permanent gate shutoff, one-way ratchet, pre-crisis timing
  cliff를 다시 검사한다. no-op repeat는 blocked, repeated starts는 국고/행정
  headroom으로 bounded여야 한다

2026-08-24 결과: F04D counterfactual `PASS`. 기본 테스트 51개 파일/421개
테스트와 F04D 전용 inspection이 통과했다. active-conflict response와
zero-territory recovery는 F04B가 소유하며, F04D fixture는 decision boundary만
측정한다. F05와 V02는 시작하지 않는다.

## F04 Targeted architecture / Gate review

2026-08-24 F04B+F04D targeted review 결과는 `PASS WITH F05 NOTES`다. 코드
REQUIRED FIX는 없고 F04는 `CLOSED`, F05는 balance/pacing 측정을 시작할 수 있는
`READY` 상태다. F05와 V02 자체는 이 review에서 시작하지 않았다.

- F04B는 active internal rebellion에서 현재 organization/resources/local
  activation을 다시 읽고, strong residual state에서만 canonical LandHex writer로
  최대 1 Hex를 회복한다. weak state/coup/foreign war는 shortcut이 없다
- `politicalCompetition`은 PolicyState의 required authority로 남고, BARGAIN은
  plural competition에서만 열리는 최소 정치 협상 전략이다. BARGAIN 자체는
  직접 crisis modifier가 아니므로 banned/plural timing 차이는 같은 legalization
  시도의 feasibility와 faction effect 경로로 설명한다
- `institutionalRuleSet`은 cost/load/duration을 가진 Intervention completion에서
  동일 PolicyState를 쓰는 typed effect이며, Policy path와 별도 rule store를
  만들지 않는다
- snapshot V2의 version 1 명시적 거부, strict enum decode, roundtrip, runtime
  closure, replay는 현재 개발 단계 계약에 맞아 PASS다
- political accommodation의 높은 treasury는 day 300까지 영토/경제 기반을
  유지한 결과다. grievance가 다시 상승하고 crisis가 지연될 뿐 제거되지 않지만,
  상대적 우세와 repeated-use trade-off는 F05 measurement로 이관한다
- industrial unrest `0.20 → 0.18`과 starting treasury `500 → 510` 인접 조건에서도
  네 response의 qualitative divergence가 유지됐다

상세 판정과 original F04 finding closure table은
`docs/F04_TARGETED_ARCHITECTURE_GATE_REVIEW.md`가 소유한다.

---

# 3. Performance QA

Track:

- initial load size
- time to interactive
- main-thread spikes
- render fps
- simulation tick duration
- AI request latency
- memory growth over a run

Rules:

- simulation must not depend on render fps
- AI latency must not freeze world UI
- high time acceleration must remain responsive
- reduce visual fidelity before reducing simulation correctness

---

# 4. Fun Scorecard

Score 1–5 after each playtest.

All dimensions use the same direction:

- 1 = 매우 부족함 / 좋지 않음
- 3 = 보통
- 5 = 매우 좋음

| Dimension               | Question                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------- |
| Immediate Read          | 30초 안에 무슨 게임인지 이해할 수 있는가?                                           |
| Speed                   | 내가 한 행동의 결과가 충분히 빠르게 나타나는가?                                     |
| Agency                  | 내 선택이 실제 세계를 바꾼다고 느끼는가?                                            |
| Trade-off               | 선택마다 고민할 만한 이득과 대가가 있는가?                                          |
| Surprise                | 예상하지 못했지만 납득 가능한 결과가 생기는가?                                      |
| Causality               | 중요한 결과가 왜 생겼는지 추적할 수 있는가?                                         |
| Tension                 | 시간을 가속하거나 멈출 타이밍에 긴장감이 있는가?                                    |
| AI Necessity            | AI가 단순 대사가 아니라 행동과 판세 변화에 실질적으로 기여하는가?                   |
| Replay Desire           | 다른 정책·체제로 다시 플레이해보고 싶은가?                                          |
| World Appeal            | 세계의 판세가 변하는 모습을 관찰하는 것 자체가 즐거운가?                            |
| Cognitive Load          | 필요한 정보를 과부하 없이 이해할 수 있는가?                                         |
| Pacing                  | 기다리는 느낌보다 계속 판세가 움직인다고 느끼는가?                                  |
| Pause Value             | 중요한 순간에 자연스럽게 시간을 멈추고 싶어지는가?                                  |
| Fast Forward Value      | 별일 없을 때 자연스럽게 시간을 가속하고 싶어지는가?                                 |
| Agenda Clarity          | 지금 가장 중요한 국가 문제가 무엇인지 바로 알 수 있는가?                            |
| Title Fit               | 《내 왕국에 혁명이 너무 많다》라는 제목과 실제 플레이 경험이 잘 맞는가?             |
| Emergence               | 내가 선택지를 따라간 것이 아니라, 내 선택 때문에 상황이 새롭게 발생했다고 느끼는가? |
| Predictability          | 같은 정책이 항상 같은 사건으로 이어진다는 느낌이 적은가?                            |
| Territorial Read        | 국경과 전선이 실제로 밀리고 들어오는 느낌이 드는가?                                 |
| Political Invasion Read | 군대가 오지 않아도 외국 정치 영향이 스며드는 것이 지도에서 보이는가?                |
| Layer Clarity           | 정치 영향, 조직, 실제 영토 통제를 서로 구분해서 이해할 수 있는가?                   |

## 4.1 자유응답 질문

- 가장 기억에 남은 사건이나 연쇄반응은 무엇이었는가?
- 내가 한 선택 때문에 상황이 바뀌었다고 가장 강하게 느낀 순간은 언제였는가?
- 예상하지 못했지만 결과를 보고 납득됐던 사건이 있었는가?
- 플레이 중 가장 오래 아무 일도 일어나지 않는다고 느낀 구간은 언제였는가?
- 시간을 빨리 돌리고 싶었던 순간은 언제였는가?
- 스스로 Pause하고 싶었던 순간은 언제였는가?
- 지금 해결해야 할 문제가 무엇인지 모호했던 순간이 있었는가?
- 위기가 갑자기 터졌을 때, 이전부터 원인이 쌓이고 있었다고 느꼈는가?
- 혁명·쿠데타·정권 변화의 빈도는 어떻게 느껴졌는가?
  - 너무 적었다
  - 약간 적었다
  - 적절했다
  - 약간 많았다
  - 너무 많았다
- 다시 플레이한다면 무엇을 다르게 해보고 싶은가?
- 게임 제목을 플레이 전에 보지 않았다고 가정하면, 이 게임에 어떤 제목을 붙이고 싶은가?
- 어떤 사건이 “게임이 정해둔 순서대로 나온다”고 느껴진 적이 있었는가?
- 같은 상황을 다시 플레이하면 다른 역사가 나올 것 같다고 느끼는가?
- 특정 정책을 선택하면 이후 결과가 너무 쉽게 예상되는 경우가 있었는가?
- 다른 국가가 내 영토로 "들어오고 있다"고 가장 강하게 느낀 순간은 언제였는가?
- 군사 침공과 정치적 영향력 확산이 서로 다른 현상으로 느껴졌는가?
- 전선이 움직이는 것을 보는 재미가 있었는가?

Target before art production:

- Immediate Read >= 4
- Speed >= 4
- Agency >= 4
- Surprise >= 3.5
- Causality >= 4
- Replay Desire >= 4

---

# 5. Headless Fun Gate

Headless log/table view만으로 다음이 가능해야 한다.

Scenario:

- player monarchy
- merchant republic neighbor
- absolute monarchy neighbor
- 5 regions
- 4 ideologies
- 4 factions

Player makes 2–4 institutional changes.

Expected:

- at least one material benefit
- at least one unintended consequence
- at least one ideology spread route
- at least one faction adaptation
- at least one foreign reaction
- at least one credible crisis
- victory or defeat pressure emerges

Fail conditions:

- best answer is obvious every run
- nothing happens without scripted events
- consequences are only numeric +/-
- ideology behaves as generic flavor
- player can safely idle
- AI outputs change prose but not behavior

If failed, do not add final art.

---

# 6. Visual Simulation Validation

최종 HUD/UI/아트를 제작하기 전에
debug strategy-map timelapse로 simulation의 공간적 가독성을 검증한다.

## 6.1 Timelapse Review

여러 해를 빠르게 재생하며 다음을 확인한다.

- 정치사상이 ContactGraph 경로와 일치하게 퍼지는가?
- 직접 접촉 Region이 먼저 변하고 내륙이 뒤따르는가?
- 조직이 crisis보다 먼저 지도에서 읽히는가?
- 외국 정치 영향이 어느 방향에서 들어오는지 보이는가?
- 군대/혁명군이 실제 LandHex 공간을 이동하는가?
- 전선이 점진적으로 이동하는가?
- 영토가 이유 없이 순간적으로 뒤집히지 않는가?
- 장기간 아무 변화가 없는 dead period가 과도하지 않은가?

### 6.1.1 Spatial layer and density review

- political influence는 Region 단위의 연속적인 overlay로 읽히고, Region의
  ideology state가 LandHex별 정치 확산 셀처럼 복제되지 않는가?
- 지도 조직 marker가 실제 `Faction` 또는 authoritative organization state와
  대응하며, `IdeologyState.organization`만으로 발명된 marker가 생기지 않는가?
- physical territorial control은 LandHex controller의 이산 변화로 읽히고,
  전선은 인접한 서로 다른 controller에서 파생된 presentation으로 읽히는가?
- 쿠데타/정부 전환과 실제 영토 통제가 분리되어, 정부 변화만으로 전 국토가
  순간 재도색되지 않는가?
- 전선·조직·route marker가 너무 많아 작은 셀 churn이나 시각적 clutter를
  만들지 않는가? 반대로 지도 밀도가 너무 낮아 방향과 변화가 사라지지 않는가?
- 현재 7 Region / 9 LandHex fixture를 최종 지도 크기로 간주하지 않고, Gate
  1V에서 여러 후보 밀도(예: 20/35/50)를 같은 seed와 pacing 조건으로 비교했는가?
- 전선 관찰이 전술 RTS식 개별 LandHex 미세 조작을 요구하지 않고 전략적
  압력과 방향을 읽게 하는가?

판정은 readability, 변화 속도, game feel, visual clutter와 responsive
고려를 함께 기록한다. 전체 run 약 15–25분 / 20–40 simulated years는
검증할 pacing 목표이며 LandHex 개수를 고정하는 QA 기준이 아니다.

## 6.2 Multi-seed Visual Review

여러 seed를 비교한다.

Fail 신호:

- 동일 지역에서 반복적으로 동일 crisis 발생
- 비슷한 시점에 동일 revolution sequence 반복
- ideology map이 모든 run에서 거의 동일하게 수렴
- war/front progression이 거의 동일
- 특정 scripted event가 상태와 무관하게 반복

## 6.3 Counterfactual Visual Review

동일 seed에서 하나의 player decision만 변경하고 synchronized comparison을 수행한다.

검증:

- 변화한 decision이 downstream world state에 실제 차이를 만드는가?
- map history가 fixed scenario sequence를 따라가지 않는가?
- 결과 차이가 실제 causal state에서 설명 가능한가?

반드시 divergence할 필요는 없다.

구조적 조건 때문에 다시 convergence하는 것은 허용된다.

## 6.4 Visual Simulation Gate

Pass:

- 보고서를 읽지 않고도 주요 판세 변화를 이해할 수 있다
- political influence / organization / territorial control이 구분된다
- Contact → influence → organization → crisis의 시간적 순서가 보인다
- invasion/front movement가 공간적으로 읽힌다
- timelapse를 관찰하는 것 자체가 흥미롭다

Fail이면 Graybox UX 작업 전에 simulation 또는 map presentation을 수정한다.

# 7. Graybox UX Test

A tester should be able to:

1. identify the most unstable region,
2. identify current regime,
3. change one policy,
4. accelerate time,
5. notice a consequence,
6. open WHY,
7. identify foreign influence,
8. understand current win/loss pressure,

without tutorial paragraphs longer than a few sentences.

---

# 8. Responsive UX Acceptance

## Desktop

- world remains dominant
- side inspector does not obscure essential regions
- 16:9 laptop usable

## Tablet

- sheet can be opened/closed with touch
- world remains interactable
- no tiny text/buttons

## Mobile portrait

- core actions reachable one-handed where possible
- bottom sheet does not permanently cover critical map
- lens/time controls usable
- no horizontal overflow
- no hover dependency

## Mobile landscape

- no clipped safe-area controls
- UI uses added width intelligently

---

# 9. AI Evaluation

Run A/B:

A. heuristic-only
B. heuristic + LLM decision layer

Questions:

- Does B create more strategically coherent variation?
- Does B create repeated generic actions?
- Does B increase latency enough to harm pacing?
- Can player perceive a difference without reading AI prose?
- Are AI actions still explainable?

If B is not meaningfully better, keep heuristic for that actor class.

---

# 10. Competition Demo Test

A fresh observer should understand within 3 minutes:

- who the player is,
- what can be changed,
- why time acceleration matters,
- one ideology spreading,
- one faction adapting,
- one foreign state reacting,
- one WHY chain,
- current victory/defeat direction.

Any feature that cannot contribute to this loop is lower priority for competition build.

## F05_FIX6 political interaction QA

- an explicit authored template is required; an accepted `LOBBY` without one
  remains strategy-only;
- proposal opening captures the current Government and preserves CountryId;
- opening, `IGNORE`, and `REJECT` do not start an intervention or write its
  institutional/faction effects;
- `ACCEPT` is a later player response and uses the existing feasibility, treasury,
  administrative commitment, duration, completion, and typed effect seams;
- infeasible acceptance stays open with an explicit response-rejected event;
- a stale Government target is not retargeted and does not create a successor;
- proposal action/event cause chains are append-only and inspectable;
- V4 save/load roundtrip covers open, explicitly rejected (including its
  reconsideration basis), and accepted proposals, including replay and
  insertion-order determinism; V3 is rejected without migration;
- `pnpm run inspect:f05fix8lifecycle` passes unchanged-basis, Government-change,
  feasibility-change, unrelated-scalar-drift, IGNORE one-open, ACCEPT
  provenance, insertion-order, V4 roundtrip, and V3 rejection counterfactuals;
- `WorldState.landHexStates[*].controller`, crisis/conflict writers, continuity,
  and terminal outcome remain unchanged by the kernel;
- `pnpm run inspect:f05fix6` compares NO_PROPOSAL, PROPOSAL_IGNORE,
  PROPOSAL_REJECT, and PROPOSAL_ACCEPT from one seed/state.

## F05_FIX7 political interaction long-horizon integration QA

- v1 `FactionProposalTemplate.triggerAction` accepts and validates `LOBBY`
  only; the authored fixture still contains exactly one coup/security-faction
  mapping to the existing coercive-restriction intervention;
- the historical official F05 run remains a 36-branch regression control and
  remains `NOT_READY` with the prior 1,200-day maximum state-grounded
  reassessment silence;
- the separate matrix contains all 6 contexts × 6 existing strategies ×
  `PROPOSAL_IGNORE` / `PROPOSAL_REJECT` / `PROPOSAL_ACCEPT_IF_FEASIBLE`;
- `ACCEPT_IF_FEASIBLE` derives the requested intervention contract after the
  selected same-tick strategy reservation and submits no infeasible response;
- same-tick strategy and proposal-response ActionRecords are ordered and
  tested as strategy first, response second, carried faction actions last;
- proposal opening/accept/reject/reopen, response feasibility changes,
  requested intervention start/completion/rejection, concurrent-open count,
  and action sequence are recorded per branch;
- proposal lifecycle is excluded from `F05_PACING_EVENT_TYPES`; its decision
  load is reported separately from state-grounded reassessment;
- repeated identical proposal keys after explicit rejection are measured as
  churn, not hiddenly suppressed by a cooldown or rejection-memory rule;
- the five-year inspection reports post-intervention late state-grounded
  silence and does not treat frequent proposal prompts as pacing repair;
- `pnpm run inspect:f05fix7` is the focused deterministic inspection.
