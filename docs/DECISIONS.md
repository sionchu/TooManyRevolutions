# Architecture & Product Decision Log

Do not delete old entries. Supersede them with a newer decision when needed.

---

## ADR-001 — Greenfield project

**Date:** 2026-08-21  
**Status:** Accepted

### Decision
Build as a brand-new repository with no inherited game codebase.

### Reason
The product identity, player role, win/loss conditions, map scale, politics, foreign-state simulation and AI architecture changed substantially.

### Reversal cost
Low now; high after production begins.

---

## ADR-002 — Player is the state, not the ruler

**Date:** 2026-08-21  
**Status:** Accepted

### Decision
The player represents the historical continuity of a state.

### Consequence
Regime change, revolution, coups and government loss do not automatically end the game.

### Reversal cost
Very high because it affects win/loss, UI, narrative, save state and simulation.

---

## ADR-003 — Victory is order consolidation

**Date:** 2026-08-21  
**Status:** Accepted

### Decision
Victory occurs when a functioning new order is stabilized for a required period.

### Not chosen
- ideology 100%
- survive N years only
- keep original monarchy alive

### Reason
Supports multiple political trajectories and gives the run a clear ending.

### T022 clarification — 2026-08-22
The implementation treats order consolidation as a scenario-defined consecutive
eligibility condition over actual current state. A pure read model explains each
configured criterion, while only `RunState.consolidation` and a typed won outcome
are written by the evaluation phase. Stable/core/capital territory is derived from
LandHex controller projection. An optional `maximumStableRegionUnrest` belongs to
the scenario when a scenario wants an unrest threshold; no global victory threshold
is introduced. Regime, ideology, policy names, and Government transition do not
provide victory modifiers.

`ORDER_CONSOLIDATION_STARTED` and `ORDER_CONSOLIDATED` are detected at the current
evaluation tick. If no actual earlier event caused the combined state, their
`causeIds` remain empty; the won outcome separately points to the consolidated event
through `causeEventId`.

---

## ADR-004 — Defeat is state dissolution

**Date:** 2026-08-21  
**Status:** Accepted

### Decision
Terminal defeat happens when the state ceases to exist as an independent political community.

---

## ADR-005 — Simulation authority

**Date:** 2026-08-21  
**Status:** Accepted

### Decision
Deterministic TypeScript simulation is authoritative.
LLMs can only propose bounded actions.

### Reason
Prevents AI-slop outcomes, enables QA/replay, keeps game rules understandable.

---

## ADR-006 — Web-first React/TypeScript/R3F

**Date:** 2026-08-21  
**Status:** Accepted for initial build

### Decision
Use Vite + React + TypeScript and Three.js through React Three Fiber for the initial web build.

### Baseline
WebGL.

### Progressive enhancement
WebGPU can be evaluated later.

### Reversal cost
Medium because renderer is separated from simulation.

---

## ADR-007 — Experimental web APIs cannot be core dependencies

**Date:** 2026-08-21  
**Status:** Accepted

### Decision
HTML-in-Canvas and experimental WebGPU paths can be used only as optional enhancements with fallback.

---

## ADR-008 — Responsive composition, shared simulation

**Date:** 2026-08-21  
**Status:** Accepted

### Decision
Desktop/tablet/mobile use the same simulation but different UI composition.

### Mobile
World + bottom sheet.

### Desktop
World + persistent inspector.

---

## ADR-009 — AI API calls stay server-side

**Date:** 2026-08-21  
**Status:** Accepted

### Decision
No model secret or direct privileged model API call in browser bundle.

---

## ADR-010 — Working title

**Date:** 2026-08-21  
**Status:** Accepted

### Decision
Current working title is:

**《내 왕국에 혁명이 너무 많다》**

Project codename:

`TooManyRevolutions`

### Reason
The title communicates the game's repeated regime instability, political simulation, fantasy setting, and light meme/web-fiction tone without explaining the entire system.

### Reversal cost
Low until public release/marketing lock.

---

## ADR-011 — Static ScenarioDefinition owns rule inputs and terminal criteria

**Date:** 2026-08-21  
**Status:** Accepted

### Problem

Gate 0 had mutable run data but no owner for initial entities, catalogs, contact topology, or victory/defeat criteria. Storing those values in WorldState would make replay and scenario versioning ambiguous.

### Decision

Introduce immutable `ScenarioDefinition` containing scenario identity/version, initial snapshots, ideology/policy catalogs, map/contact topology, `OrderConsolidationCriteria`, and `DissolutionCriteria`. `WorldState` contains only one run's mutable state. `RunState` holds evaluation/progress, not criterion copies.

### Alternatives

- duplicate catalogs and criteria in WorldState;
- keep criteria as ad-hoc system constants;
- defer scenario ownership until T025.

### Reason

Policy, contact graph, victory, defeat, replay, and the first playable scenario need a shared versioned source before they are implemented.

### Consequences

`createInitialWorldState(scenario, seed)` is the canonical initializer. A run loses only through a scenario-defined actual state dissolution, while regime change remains non-terminal.

### Reversal cost

High. Changing this after T012/T014/T022–T025 would require save migration and cross-system rewrites.

---

## ADR-012 — Region controller is the sole territorial-control authority

**Date:** 2026-08-21  
**Status:** Superseded by ADR-033 (2026-08-22)

### Problem

Country region lists and two nullable Region controller fields can disagree and permit contradictory controllers.

### Decision

Use `Region.controller` as an exclusive discriminated union: country, faction, or uncontrolled. `ownerCountryId` remains legal/ historical ownership. Country controlled-region lists are derived selectors only.

> **Historical record / supersession:** This decision describes the pre-T017B
> authority model. ADR-033 supersedes its physical territorial-authority
> portion: `WorldState.landHexStates[*].controller` is now the sole writable
> source, and Region control is derived from LandHex state.

### Alternatives

- maintain two-way Country/Region references;
- choose country-controller precedence over faction-controller;
- represent all unrest as state-control without a controller.

### Reason

Map display, capital control, occupation, rebellion, civil war, annexation, victory, and replay must read the same territorial fact.

### Consequences

Foreign occupation and faction control can differ from legal ownership without duplicating data. Invariants verify references but do not require owner and controller to match.

### Reversal cost

High. Territorial keys underpin T018, T021–T023, Gate 2 map work, and save data.

---

## ADR-013 — Country continuity is separate from government and derived regime

**Date:** 2026-08-21  
**Status:** Accepted

### Problem

An authoritative `Country.regime` and country-only conflict winner cannot represent a coup or revolution that changes central authority while the historical state survives.

### Decision

`CountryId` is the stable state-continuity identifier. `Government` is a separate entity and Country stores only `currentGovernmentId`. Active PolicyState carries institutional state. `RegimeClassification` is derived from institutions and never authoritative. Conflict outcomes explicitly include government transition or state dissolution.

### Alternatives

- replace CountryId on regime transition;
- keep a mutable authoritative regime label;
- treat every civil-war winner as a new country.

### Reason

This is required by the player role and by the design rule that revolutions, coups, elections, and dynastic collapse are gameplay events, not automatic defeat.

### Consequences

`RunOutcome.status = "defeated"` has only the `stateDissolved` variant. `ConflictStatus.terminal` is removed to prevent ambiguity.

### Reversal cost

Very high. This affects the meaning of saves, events, victory/defeat, historical summaries, UI, and every conflict result.

---

## ADR-014 — Canonical metric units and bounds

**Date:** 2026-08-21  
**Status:** Accepted

### Problem

Country metrics had no common scale. Different systems could have treated legitimacy, instability, military power, or state continuity as either normalized fractions or arbitrary scores.

### Decision

Use 0–100 indices for 정통성, 국가역량, 군사력, 불안, 국가 존속; signed finite absolute stock for 국고; non-negative absolute per-day output for 생산. Region, ideology, faction, resource, and contact-edge ranges are fixed in `ARCHITECTURE.md` 4.4. Domain phases clamp before canonical commit and invariants validate the result.

### Alternatives

- use 0–1 for every metric;
- leave ranges to individual systems;
- establish values only during balance work.

### Reason

T011, T017, T021–T023, UI, and scenario data need numbers with stable meanings before any balancing begins.

### Consequences

No thresholds or effect sizes are balanced by this decision. Treasury may go negative; the other named country indices may not.

### Reversal cost

Medium to high. Once scenario data and tests use a scale, changing it requires broad data migration and rebalance.

---

## ADR-015 — One ordered ActionRecord log and atomic simulation commit

**Date:** 2026-08-21  
**Status:** Accepted

### Problem

Separate player/AI logs, caller-selected event IDs, and an unowned commit boundary could produce non-replayable action order and partial causal histories.

### Decision

Use a single append-only `ActionRecord` envelope for player, heuristic, and LLM inputs. Every record has global sequence, schema version, and validation outcome. Only accepted records enter `SimulationStepInput`; `SimulationStepResult` and the action/event logs are committed atomically through `RunRecord`/`SimulationStepCommit`.

### Alternatives

- source-specific logs merged later;
- mutate WorldState in UI/server callbacks;
- record only accepted inputs;
- commit events independently from the next world.

### Reason

The deterministic simulation needs one explicit entry point and replay needs to reproduce both accepted and rejected decisions without trusting network timing.

### Consequences

Event sequence is globally ordered and ID follows `event:${tick}:${sequence}:${type}`. `causeIds` only reference existing events, including earlier staged events in the same step.

### Reversal cost

High. The log is a save/replay/public-history format and will be consumed by UI, AI, testing, and T024.

---

## ADR-016 — Daily authoritative tick with fixed phase order

**Date:** 2026-08-21  
**Status:** Accepted

### Problem

Gate 0 advances a 360-day calendar but had not locked whether a tick was a day or week, what phase order applied, or whether terminal runs could advance.

### Decision

One tick is one day in a 12 × 30-day calendar. T010 implements the fixed order: scheduled effects, validated actions, economy, resources, ideology diffusion, faction pressure, instability, diplomacy, conflict, consolidation/dissolution evaluation, close day, atomic commit. Terminal runs do not open a new step; they may record rejected inputs only.

### Alternatives

- weekly ticks;
- phase order defined independently by each system;
- allow terminal runs to keep advancing as no-op events.

### Reason

Time unit and phase order are part of deterministic behavior, event causality, pacing, and 5–10 minute simulation balance.

### Consequences

Renderer speed remains external to `advanceTick`/future `SimulationStep`. T010 is the first implementation task and must not silently add economy or other gameplay rules.

### Reversal cost

High. Changing it after system implementation changes every replay, test baseline, balance curve, and causal order.

---

## ADR-017 — Minimal deterministic regional economy substrate

**Date:** 2026-08-21  
**Status:** Accepted

### Problem

T011 needs regional production pressure, local resource shortage, and country treasury movement without introducing a commodity market or policy-specific economic effects. The existing Region had only one scalar production and one local resource stock, so actual output, capacity, and demand could not be distinguished.

### Decision

Add serializable per-resource `resourceProductionCapacity`, `resourceProduction`, and `resourceDemand` maps to `Region`; keep `resources` as local post-consumption stock. T011 treats capacity as actual daily output, consumes demand from `previousStock + actualProduction`, and computes scarcity as demand-weighted shortage in the 0–1 range.

`Region.production` is the sum of resource output capacity for the day. `Country.production` sums only Regions whose authoritative `Region.controller` names that Country. `Country.dailyIncome` equals production at a temporary 1:1 abstract conversion, and `Country.treasury` settles income minus configured non-negative `dailyExpenditure`. Treasury may become negative; this is not terminal defeat.

> **Historical record / T017B supersession:** At the time of this ADR,
> territorial control was read from `Region.controller`. ADR-033 supersedes
> only that territorial-authority source; the full-Region aggregation and
> non-split partial-control semantics remain current.

No national resource stock, prices, wages, firms, trade markets, policy modifiers, ideology effects, instability effects, or random variation are part of T011.

### Alternatives

- add a Victoria-style commodity/price/market model;
- store only a scalar Region production and derive resources implicitly;
- aggregate resources directly on Country;
- let policy/regime names modify economic output in T011.

### Reason

The chosen state is sufficient for the GDD causal chains—production loss, local shortage, treasury pressure, and territorial-control loss—while leaving later policy, ideology, faction, diplomacy, and conflict systems as readers or explicit writers. It also keeps replay state small and calculations deterministic.

### Reversal cost

Medium. Save fixtures, resource events, economy tests, and later political readers depend on these field meanings, but no market or balance data has been introduced yet.

---

## ADR-018 — Declarative policy rules with scenario-bound resolution

**Date:** 2026-08-21  
**Status:** Accepted

### Problem

T012 needs to change institutions through validated actions while keeping static policy content out of `WorldState`. A policy name or regime label cannot be an authoritative gameplay bonus, and the existing T010 step signature has no global scenario registry.

### Decision

`ScenarioDefinition.policyCatalog` owns serializable `PolicyDefinition` records. Each definition contains typed declarative `ruleMutations`, simple policy/rule prerequisites, and incompatible policy IDs. `WorldState.policies` owns only active IDs, enactment ticks, and one resolved `InstitutionalRuleState`. The policy resolver receives static content through `createPolicyPhaseHook(scenario)` and runs inside `resolveValidatedActions`; it does not add a scenario registry or copy the catalog into the run.

An incompatible active policy causes deterministic rejection rather than automatic replacement. Only changed rule values emit `INSTITUTION_RULE_CHANGED`, whose cause is the already emitted `POLICY_ENACTED` event. Regime classification remains a pure derived function and cannot change CountryId or RunOutcome.

### Alternatives

- put `ScenarioDefinition` or a policy catalog on `WorldState`;
- use a process-global scenario registry for default action resolution;
- encode policy effects as arbitrary metric deltas or regime-name switches;
- silently deactivate conflicting policies when a new policy is enacted.

### Reason

The chosen boundary keeps saves/replays versioned by the existing scenario id/version, makes the current institutional state unambiguous, preserves T010's API, and prevents contradictory active policy sets without inventing a second mutation path. Explicit rule data also gives later economy, ideology, faction, and regime readers a stable input without implementing their effects early.

### Consequences

Callers that resolve policies must construct a scenario-bound phase hook. Initial institutional rules may be seeded by a scenario even when no policy was enacted during the run. T012 does not implement costs, delays, faction resistance, ideology changes, or downstream economic effects.

### Reversal cost

High. `InstitutionalRuleState`, policy action payloads, event payloads, scenario data, and replay histories will be consumed by later Gate 1 systems and save migration.

---

## ADR-019 — Non-exclusive overlapping ideology support

**Date:** 2026-08-21  
**Status:** Accepted

### Problem

T013 needs a canonical meaning for regional ideology support before diffusion, faction pressure, and regime interpretation are implemented. Forcing all ideology support values to sum to one would make every increase an implicit decrease elsewhere and would collapse sympathy, radicalism, and organization into one competition score.

### Decision

`Region.ideology[IdeologyId].support` is an independent 0–1 value. Ideologies may overlap, so a Region's support values do not have to sum to one. `radicalism` and `organization` are also independent 0–1 values and are never inferred from support. Country aggregates population-weight each dimension independently and may therefore contain overlapping support totals.

### Alternatives

- enforce a normalized exclusive distribution across ideologies;
- store one dominant ideology plus residual support;
- derive radicalism and organization from support instead of storing them separately.

### Reason

The GDD treats political tendencies as overlapping and requires the player to distinguish broad sympathy from willingness to disrupt and from real organizational capacity. Non-exclusive support represents coalition overlap without a person-level simulation and preserves the required high-support/low-organization versus low-support/high-organization states.

### Consequences

Later diffusion must explicitly choose which dimension and which ideology to adjust; no hidden counter-adjustment occurs. UI summaries must not display support as a probability distribution unless they label it as overlapping sympathy. Replay and event payloads preserve each dimension independently.

### Reversal cost

High. Changing to exclusive support would alter the Region schema's interpretation, every aggregation and diffusion rule, event histories, UI summaries, balance assumptions, and save/replay compatibility.

---

## ADR-020 — Directed contact topology with sparse runtime overlays

**Date:** 2026-08-21  
**Status:** Accepted

### Problem

T014 needs a causal Region graph that remains meaningful when control changes and can later express closures, disruptions, censorship, and temporary route changes. The pre-Gate-1 shape allowed a `direction: "bidirectional"` flag, which makes traversal semantics implicit, and it had no explicit owner for mutable edge state.

### Decision

Every `ContactEdgeDefinition` is one directed `fromRegionId -> toRegionId` edge. A bidirectional relationship is represented by two explicit edge records with independent IDs, channels, and strengths. The initial channel vocabulary is limited to `border`, `trade`, `migration`, and `information`.

Static topology remains solely in `ScenarioDefinition.mapContactTopology`. `WorldState.contactEdgeStates` is a sparse map keyed by `ContactEdgeId` and stores only `enabled`, a finite non-negative `multiplier`, and an optional `blockedReason`. Missing runtime state means enabled with multiplier 1. Effective strength is `clamp01(baseStrength * multiplier)`; disabled edges evaluate to 0 but remain queryable as topology. No T014 action, phase writer, or contact event is added for runtime mutation.

Country contacts are derived per directed Region edge from current `Region.controller` values. Only edges whose endpoints are currently controlled by two different countries appear in the foreign country projection. Internal routes remain available through Region-level queries, and uncontrolled/faction endpoints are excluded from the country projection.

> **Historical record / T017B supersession:** At the time of this ADR, the
> endpoint controller was `Region.controller`. ADR-033 supersedes only that
> source; the directed Region graph and country-projection semantics remain,
> with current control supplied by LandHex-derived full-controller selectors.

### Alternatives

- keep a one-edge `bidirectional` flag and infer reverse traversal;
- copy full ContactEdge definitions into WorldState for every run;
- store a separate authoritative Country-to-Country graph;
- omit runtime state until closures and disruptions are implemented;
- aggregate all parallel Region routes into one country-level strength value.

### Reason

Explicit directed edges preserve asymmetric trade and information paths, make causal explanations point to one concrete route, and avoid hidden reverse behavior. A sparse overlay keeps replay state small while supporting future closures and multipliers. Deriving country contacts from controller state ensures occupation and revolution change political meaning without rewriting physical topology. Keeping one derived record per directed Region edge preserves route evidence for T015 instead of losing it through premature aggregation.

### Consequences

Later systems must write runtime overlays through the authoritative simulation boundary and must not mutate topology or create a second country graph. New channels require an explicit vocabulary change. T015 can consume edge IDs, direction, channel, and effective strength as causal inputs; it must decide its own diffusion formula.

### Reversal cost

High. Directionality, channel IDs, runtime state keys, query results, country projections, causal event payloads, and saved/replayed topologies will be consumed by T015, diplomacy, war, refugee, and UI systems.

---

## ADR-021 — Snapshot-based ideology diffusion and route-attributed events

**Date:** 2026-08-21  
**Status:** Accepted (snapshot/event boundary; formula superseded by ADR-022)

### Problem

T015 needs to spread regional ideology support through the explicit T014 contact graph without turning support into a normalized competition score or allowing edge iteration order to create same-day cascades. The current event infrastructure can validate `causeIds` against the current event buffer/EventStore, but `WorldState` does not carry the prior event log into a simulation step.

### Decision

Use a deterministic region-to-region formula. The original T015 formula was `pressure = sourceSupport × effectiveContactStrength × channelWeight × destinationSusceptibility`; `delta = diffusionRate × pressure × (1 - destinationSupport)`. The formula and default rate were superseded by ADR-022; the snapshot, aggregation, event, and causal-boundary decisions in this ADR remain active.

T015 snapshots all source/destination ideology states at the start of `ideologyDiffusion`, aggregates contributions by destination Region and ideology, then applies the aggregate simultaneously. The original default `diffusionRate` was `0.1`; the current production default is recorded in ADR-022. Centralized provisional channel weights remain `border=0.8`, `trade=1.0`, `migration=1.1`, and `information=1.2`. The destination susceptibility baseline uses T013's context hook and only generic accessibility, urbanization, and state-control inputs.

Each actual source-edge contribution emits `IDEOLOGY_DIFFUSED` with source Region, destination Region, ideology, edge, channel, source support, effective strength, pressure, susceptibility, previous/next support, and applied delta. One aggregate `IDEOLOGY_SUPPORT_CHANGED` follows and references those contribution events through same-step `causeIds`; its `sourceContributions` payload preserves multi-edge reconstruction. Zero changes emit no ideology event. Self-loop edges are ignored, and controller kind does not suppress Region-level diffusion.

Because the current step API has no prior EventStore input, diffusion roots use empty `causeIds`; T015 does not invent cross-tick event references. Extending a step with a committed event-history lookup is deferred to T024 replay/persistence work.

### Alternatives

- calculate from a country-wide ideology aggregate;
- update destinations in edge iteration order;
- normalize ideology support or subtract from other ideologies;
- attach guessed prior-tick event IDs that are not available in `WorldState`;
- emit only an unexplained aggregate support event.

### Reason

The snapshot makes A → B → C propagation advance one hop per day and makes topology ordering irrelevant. Route-level payloads preserve the GDD's explainable WHY chain without implementing faction, diplomacy, war, censorship, refugee, prestige, or AI behavior. Keeping the current same-step cause contract avoids weakening `EventStore` validation or prematurely redesigning replay.

### Consequences

Support remains bounded and non-exclusive; radicalism and organization remain untouched. Static contact topology and sparse runtime overlays remain the only route inputs. Channel weights and diffusion rate are explicit configuration points, not hidden per-channel constants. Cross-tick WHY will initially reconstruct from the recorded source/contact payload and same-step support causes; prior-event links require T024's persistence boundary.

### Reversal cost

High. Diffusion values and event payloads will be consumed by instability, faction, foreign influence, UI WHY views, save/replay, and balance tests. The provisional numerical weights can be rebalanced without changing the structural contract, but changing snapshot semantics or event attribution would affect histories and replay.

---

## ADR-022 — Support-gradient ideology diffusion stabilization

**Date:** 2026-08-21  
**Status:** Accepted

### Problem

T015's absolute source-support term created positive support on every reachable edge. The T015 fun check showed connected regions and multiple non-exclusive ideologies approaching support 1 over long runs, even when the destination already matched or exceeded the source's support.

### Decision

Use the support gradient as the production source signal:

`ideologyGradient = max(0, sourceSupport - destinationSupport)`

`pressure = ideologyGradient × effectiveContactStrength × channelWeight × destinationSusceptibility`

`delta = diffusionRate × pressure × (1 - destinationSupport)`

Set the production default to `diffusionRate = 0.05`, the slowest tested rate that still produced visible Day 1 contact-region movement and Day 10–30 inland propagation in the fixed T015 scenario. The old absolute-source calculation remains only as an explicit inspection comparison mode so the A/B result remains reproducible; normal gameplay uses the gradient default.

Keep directed edges, phase-start snapshots, simultaneous aggregation, non-exclusive support, support-only writing, and unchanged radicalism/organization. Do not normalize support, subtract another ideology, add decay, or add ideology-specific material stereotypes in T015B.

### Alternatives

- keep the absolute-source formula and tune only the rate;
- normalize all ideology support into a zero-sum distribution;
- add decay, repression, propaganda, or local ideology modifiers;
- add faction, institutional, economic, diplomatic, or foreign-agent divergence now;
- use the gradient with `diffusionRate = 0.10` or `0.15`.

### Reason

The fixed A/B run preserved the desired spatial behavior under the gradient. At rate `0.05`, the player port moved from `0.0500` to `0.0803` on Day 1, the capital reached `0.0490` on Day 10, and farmland reached `0.0411` on Day 30. By Day 240, the player farmland was `0.5564` and the player-border monarchy support was `0.7369`, while the source values remained `0.90` and `0.85`; the isolated mine stayed unchanged. The absolute formula instead drove connected regions toward simultaneous saturation.

### Consequences

Support now moves only down an explicit local support gradient. Equal or destination-higher support produces no positive contribution from that edge, and a lower destination approaches the source rather than mechanically reaching 1. Non-exclusive overlap remains valid, so this does not make ideology a competition meter. Later faction, institutional, material, repression, propaganda, diplomacy, and foreign-action systems remain responsible for changing source conditions and creating divergence.

### Reversal cost

High for the formula because event histories, T015 consumers, later faction/instability behavior, UI explanations, and replay comparisons will observe the source signal. The selected `0.05` rate is a lower-cost balance change, but it is recorded here because it establishes the T015 production default.

## ADR-023 — Fast observation, slow decision pacing

**Date:** 2026-08-21  
**Status:** Accepted

### Decision

The game uses a fast-forward-centered simulation rhythm.

The player should spend most passive time accelerating history and interrupt that flow only for meaningful decisions.

Internal simulation remains daily-tick based.

Political and social pressures may accumulate over months or years, while coups, revolutions, wars, and other phase changes may erupt over days or weeks.

### Product targets

Full game:
- 15–25 minutes real time
- approximately 20–40 simulated years

Competition vertical slice:
- 3–5 minutes real time
- approximately 5–10 simulated years

### Reason

The game's systemic complexity must not result in slow, report-heavy gameplay.

The target experience is closer to Plague Inc. / Rebel Inc. pacing than a slow grand-strategy administrative simulation.

### Reversal cost

High.

## ADR-024 — Monthly political diffusion cadence on a daily simulation tick

**Date:** 2026-08-21  
**Status:** Accepted

### Problem

T015B의 support-gradient 공식은 구조적 포화를 해결했지만, daily cadence로 360일(왕력 1년) 안에 수도와 연결 내륙이 지나치게 크게 변했다. T010의 authoritative daily tick과 360일 달력은 유지하면서 정치적 아이디어의 역사적 시간척도를 늦출 필요가 있었다.

### Decision

`ideologyDiffusion` phase는 매일 호출하되 `PoliticalCadence` 경계에서만 support를 계산하고 event를 배출한다. production 기본값은 `monthly`다.

- `daily`: 모든 non-terminal step
- `weekly`: `nextTick % 7 === 0`
- `monthly`: 다음 simulated date가 `day = 1`인 30일 월 경계

경계 판정은 `src/sim/core/politicalCadence.ts`의 `shouldRunPoliticalUpdate` 하나가 담당한다. cadence는 renderer, UI speed, wall clock과 무관하며, terminal step은 기존 T010 규칙대로 phase를 실행하지 않는다. 공식은 T015B의 support gradient를, rate는 `0.05`를 그대로 사용한다.

### Alternatives

- daily cadence를 유지하고 `diffusionRate`를 더 낮춘다.
- weekly cadence를 선택한다.
- cadence를 renderer scheduler의 실시간 간격으로 판단한다.
- 하루 tick 자체를 주간/월간 tick으로 바꾼다.

### Reason

동일 scenario/seed/formula/rate의 10년 harness에서 다음 결과가 나왔다.

| cadence | 정치 update 수 | 왕력 2년 1월 항구 공화주의 | 왕력 2년 1월 수도 공화주의 | 왕력 3년 1월 수도 공화주의 | 왕력 6년 1월 농지 공화주의 | 왕력 11년 1월 수도 공화주의 |
|---|---:|---:|---:|---:|---:|---:|
| daily | 3600 | 0.8702 | 0.8033 | 0.8700 | 0.8861 | 0.9000 |
| weekly | 514 | 0.6211 | 0.3270 | 0.5325 | 0.5775 | 0.8437 |
| monthly | 120 | 0.3141 | 0.0617 | 0.1482 | 0.1311 | 0.5782 |

monthly는 Year 1에 항구/국경의 직접 영향은 보이게 하면서 수도·농지는 늦게 움직이고, Year 2–5에 의미 있는 내륙 변화가 누적되며, Year 10에도 source 수준으로의 접근이 완결되지 않는다. 광산은 세 cadence 모두 0.0100에 남았다. 이는 향후 faction, policy, repression, propaganda, instability가 local divergence를 만들 공간을 남긴다.

### Consequences

정치 확산은 하루마다 평가되는 것처럼 보이는 renderer 이벤트가 아니라, 월 경계에서 일어나는 결정론적 political update가 된다. non-boundary day에도 authoritative tick/date와 다른 phase는 정상 진행할 수 있다. cadence를 `daily` 또는 `weekly`로 주입하는 inspection/test 재현 경로는 보존한다. 월간 cadence 자체가 ideology competition, decay, repression, propaganda 또는 faction behavior를 추가하지 않는다.

### Reversal cost

중간 이상. cadence는 support event 수, replay history, later faction/instability timing, pacing tests와 UI event grouping에 영향을 준다. 반면 `PoliticalCadence`가 명시적 hook 설정으로 분리되어 있어 월간을 주간/일간으로 되돌리는 비용은 formula나 tick 단위를 바꾸는 것보다 낮다. authoritative daily tick, calendar boundary, event ordering을 함께 바꾸면 별도 ADR과 replay migration이 필요하다.


## ADR-025 — Region aggregate + Land Hex territorial model

**Date:** 2026-08-22
**Status:** Accepted

### Decision

The strategy map uses two spatial layers.

Region:
- political
- economic
- social
- ideology
- faction
- instability simulation aggregate

Land Hex:
- movement
- occupation
- front line
- terrain
- POI
- territorial control

A Region consists of multiple Land Hex cells.

### Rejected alternatives

1. One Region = one Hex

Rejected because:
- territorial invasion feels too coarse,
- front lines cannot visibly advance,
- the map becomes too similar to a large-zone stabilization game.

2. All simulation at Land Hex level

Rejected because:
- excessive state complexity,
- slower game readability,
- increased UI and balancing burden,
- harms Plague Inc.-like pacing.

### Design reason

The game needs both:

- readable political/economic regions,
- visually moving territorial front lines.

This structure supports military invasion, ideological influence and revolutionary territorial expansion as distinct spatial phenomena.

### Key visual principle

**사상은 색으로 퍼지고, 조직은 말이 되고, 혁명은 영토가 된다.**

### Reversal cost

High.

## ADR-026 — Faction heuristic proposals stay outside WorldState until ActionRecord intake

**Date:** 2026-08-22  
**Status:** Accepted

### Problem

T016 faction 판단은 T015C의 monthly political boundary에서 실행되어야 하지만, heuristic이 phase 안에서 `WorldState`나 action log를 직접 바꾸면 player/LLM과 다른 mutation 경로가 생기고 replay/action ordering이 깨진다. 반대로 heuristic 결과를 버리면 후속 instability/AI가 실제로 어떤 의도를 선택했는지 공통 입력 경계에서 재생할 수 없다.

### Decision

`factionPressure`는 current phase state를 읽어 stable `FactionId` 순서로 `ActionProposal[]`을 만들고 `SimulationStepResult.actionProposals`로 반환한다. proposal은 다음 target tick을 명시하지만 현재 step에서 자동 실행되거나 action log에 묵시적으로 append되지 않는다.

공통 `acceptActionProposal` intake가 proposal을 deterministic `ActionId`, global `sequence`, `source: "heuristic"`, `validationOutcome: "accepted"`를 가진 `ValidatedActionRecord`로 변환한다. 이후 player/LLM record와 똑같이 다음 `SimulationStepInput.actions`에 들어간다. accepted faction action이 phase에서 해소될 때만 `Faction.currentStrategy`를 변경하고 `FACTION_STRATEGY_CHANGED`를 변화 시에만 배출한다.

T015C와 동일하게 heuristic 판단은 `monthly` boundary에서만 새 proposal을 만든다. non-boundary day의 ordinary no-action step은 faction proposal/event/state 변화가 없는 no-op이며, 명시적으로 accepted된 faction action의 state 적용은 input resolution으로만 허용한다.

### Alternatives

- heuristic이 phase에서 currentStrategy와 action log를 동시에 직접 변경한다.
- faction마다 별도 action queue/log를 두고 나중에 player log와 merge한다.
- 매일 판단하거나 renderer/wall-clock scheduler에서 정치 update를 호출한다.
- proposal을 narrative event로만 남기고 ActionRecord로 수락하지 않는다.

### Reason

현재 T010이 이미 제공하는 `SimulationStepInput`/`ActionRecord` 경계를 그대로 재사용하면서, 월간 decision cadence와 일일 authoritative tick을 동시에 보존한다. `SimulationStepResult.actionProposals`는 phase 뒤의 ideology 상태를 읽은 proposal을 관찰 가능하게 하고, 다음 step intake는 action sequence를 전역으로 유지한다. currentStrategy는 실제 accepted action의 최소 상태 표현으로만 변경하므로 T017의 instability가 향후 이 state를 읽을 수 있지만, T016이 위기 결과를 예약하지 않는다.

### Consequences

- proposal generation은 pure/deterministic이며 UI, network, AI callback은 WorldState writer가 아니다.
- proposal을 수락·보류·거부하는 command gateway와 future scheduling semantics는 T024/T041에서 확장할 수 있다.
- 현재 T016에는 action cost, cooldown, resources 소비, organization growth, agenda text, downstream crisis resolution이 없다.
- proposal을 다음 step에서 수락하므로 decision tick과 action target tick을 구분해 replay해야 한다.

### Reversal cost

중간 이상. `SimulationStepResult.actionProposals`와 next-tick intake는 replay serialization, global action sequence, future faction/foreign AI integration에 영향을 준다. 다만 proposal payload와 action vocabulary가 작고 `ActionRecord` 공통 envelope를 사용하므로 cadence나 heuristic rule을 바꾸는 비용은 제한적이다. phase 내부 자동 append로 되돌리려면 action log atomic commit 및 replay 규약을 다시 설계해야 한다.

## ADR-027 — Agenda is a bounded derived read model, not authoritative story state

**Date:** 2026-08-22  
**Status:** Accepted

### Problem

T016의 faction intention, T011의 fiscal flow, T015의 directed diffusion은 플레이어가 현재 무엇을 신경 써야 하는지 직접 보여주지 않는다. 이를 편하게 표현하려고 agenda를 `WorldState`에 저장하거나 완료/다음 agenda 진행으로 만들면 현재 압력과 별개의 quest rail이 생기고, replay·counterfactual·regime continuity 경계가 오염된다. 또한 과거 event가 없는 현재 `WorldState`만으로 trend와 causal event를 가장하면 설명이 사후 생성이 된다.

### Decision

T016A는 `src/sim/readModels/agenda.ts`의 순수 `deriveNationalAgendas()`로만 구현한다.

- 입력은 `ScenarioDefinition`, 현재 `WorldState`, 호출자가 제공하는 bounded `recentEvents`다.
- 출력은 현재 fiscal/faction/foreign ideological pressure에서 파생한 0–4 `PrimaryAgenda`다. 2–4는 충분한 pressure가 있을 때의 목표이며 0도 유효하다.
- `WorldState.agendas`, `RunState` story/quest/progress, agenda completion, future crisis scheduling은 금지한다.
- severity는 중앙 detector config로 bounded하고, stable tie-breaker로 정렬한다.
- trend는 event delta evidence가 없으면 `unknown`이며, 현재 severity에서 추측하지 않는다.
- `causeEventIds`는 전달된 실제 event ID의 부분집합이다. EventStore를 WorldState에 넣는 결정은 T024로 남긴다.
- 현재 실제로 표시할 intervention capability는 `policy`와 `noAction`뿐이다. 구현되지 않은 treasury/diplomacy/military/repression/concession writer를 미리 약속하지 않는다.
- 현재Strategy alone, ideology support alone, contact topology alone은 agenda trigger가 아니다.

### Alternatives

- agenda를 WorldState에 저장하고 완료/단계/진행도를 관리한다.
- agenda를 LLM이 자유 문장으로 생성한다.
- 현재 severity를 이전 severity와 비교해 trend를 추측하고, 과거 event ID를 사후 연결한다.
- 모든 potential intervention category를 미리 표시한다.

### Reason

현재 압력에서 매번 다시 파생하면 압력이 해결될 때 agenda가 자연스럽게 사라지고, 동일 WorldState/evidence/replay에서 동일한 읽기 결과를 얻는다. 실제 Country/Region/Faction/Ideology 이름은 ScenarioDefinition에서 가져오므로 제목이 현재 데이터와 분리되지 않는다. foreign agenda는 live directed edge와 실제 diffusion event를 모두 요구하므로 “외국이 어딘가에 존재한다”는 사실만으로 위기를 만들지 않는다.

### Consequences

- agenda selector는 UI·renderer·AI·network와 독립적이며 GameEvent/authoritative state writer가 아니다.
- bounded event window가 없으면 trend는 `unknown`이고 foreign evidence agenda는 만들어지지 않는다. T024 EventStore/replay 입력이 후속으로 이 window를 제공해야 한다.
- 현재 fiscal/faction agenda의 affected region은 선행 observation 범위에 따라 국가/세력 관련 영역의 집계일 수 있으며, 더 정밀한 지역 책임성은 T016B/T017 이후에 별도 계약해야 한다.
- intervention 목록은 현재 구현보다 보수적으로 보이며, 후속 writer가 추가될 때 detector별 capability mapping을 갱신해야 한다.
- agenda는 위기·반란·쿠데타·내전·승패를 만들거나 예약하지 않는다.

### Reversal cost

중간 이상. Agenda를 authoritative 상태로 되돌리면 snapshot/replay schema, event causality, counterfactual QA, UI semantics를 함께 바꿔야 한다. 반면 detector threshold/weight와 추가 detector는 현재 pure read-model API 안에서 확장할 수 있다.

## ADR-028 — Intervention capacity is committed load with economy-owned settlement

**Date:** 2026-08-22  
**Status:** Accepted

### Problem

T016B는 국고·행정 여력·제도 prerequisite·시간으로 개입 가능성을 표현해야 한다. `stateCapacity`를 차감하거나 `politicalPower`/`policyPoints`를 추가하면 국가역량의 의미가 바뀌고, action resolver가 treasury를 직접 쓰면 T011 economy writer와 같은 tick의 비용 정산이 두 갈래가 된다. 반대로 비용을 나중에 임의로 계산하면 같은 tick의 두 action이 같은 국고를 중복 사용할 수 있다.

### Decision

- `ScenarioDefinition.interventionCatalog`가 static `InterventionDefinition`을 소유한다.
- `WorldState.interventionCommitments`는 active commitment의 최소 runtime만 소유한다. committed administrative load, headroom, overload는 이를 `Country.stateCapacity`와 함께 매번 파생한다. stateCapacity는 소비되지 않는다.
- `START_INTERVENTION`은 기존 validated `ActionRecord`로 들어오며, resolver는 global sequence 순서로 treasury/headroom/prerequisite를 평가한다. accepted action은 commitment를 만들고 projected treasury reservation을 갱신하지만 Country.treasury를 직접 변경하지 않는다.
- `economy`는 accepted current-tick commitment의 static cost를 한 번 합산해 canonical treasury settlement와 `TREASURY_CHANGED`를 작성한다. rejected action은 비용과 commitment를 만들지 않는다.
- duration은 day tick 기반이며, start tick을 첫 occupied day로 삼고 `completionTick = startedTick + durationDays`로 계산한다. `applyScheduledEffects`가 completion을 먼저 처리한다.
- T016A agenda는 fixture-only `administrative` capability를 실제 player-facing category로 표시하지 않는다. production intervention catalog가 추가될 때 availability selector를 별도 연결한다.

### Alternatives

- `stateCapacity`에서 시작할 때 load를 직접 차감하고 시간이 지나면 회복한다.
- `politicalPower`, `policyPoints`, `interventionMana` 같은 범용 currency를 만든다.
- action resolver가 즉시 treasury를 차감한다.
- 각 intervention을 별도 queue/log로 관리하고 player/heuristic/LLM action을 나중에 합친다.
- wall-clock duration이나 renderer scheduler로 완료를 판정한다.

### Reason

Committed load는 “국가가 동시에 처리할 수 있는 일의 양”과 국가역량 지수를 분리한다. ActionRecord sequence로 같은 tick의 feasibility를 먼저 결정하면서도 T011의 economy-only treasury authority를 유지한다. day tick과 explicit completion boundary는 replay와 headless inspection에서 off-by-one을 검증할 수 있게 한다. static definition과 minimal runtime commitment은 save/replay에서 catalog 재로딩과 active state 직렬화를 분리한다.

### Consequences

- overload는 보존·관찰되지만 T016B에서는 instability, 실패, 자동 취소로 연결되지 않는다.
- 같은 tick의 accepted costs는 economy가 한 번만 정산하며, daily income/expenditure와 함께 계산된다.
- policy action은 기존 T012 즉시 rule mutation으로 남고, 모든 정책을 intervention catalog로 옮기지 않는다.
- production player-facing intervention content, availability UI, agenda integration, overload consequences는 후속 task의 명시적 계약이 필요하다.

### Reversal cost

높음. `WorldState` snapshot shape, ActionRecord replay semantics, economy event causes, phase ownership, UI feasibility selectors가 함께 영향을 받는다. fixture definition의 숫자나 후속 prerequisite 종류를 바꾸는 비용은 낮지만, stateCapacity 소비형 currency로 되돌리거나 treasury writer를 분산하면 replay와 metric contract를 다시 설계해야 한다.

## ADR-029 — Instability separates derived pressure, accumulated unrest, and national aggregation

**Date:** 2026-08-22  
**Status:** Accepted

### Problem

T017은 scarcity, organized political mobilization, T016B administrative overload를 지역 불안으로 연결해야 한다. 이들을 하나의 arbitrary national score로 합치거나 pressure를 즉시 `Region.unrest`로 대입하면 원인 설명, 시간 누적, 회복, 후속 T018 detector의 입력 경계가 무너진다. 특히 ideology support나 이름 자체를 불안 modifier로 쓰면 정치적 지지와 실제 동원 능력을 혼동하게 된다.

### Decision

- `RegionalPressureSnapshot`은 `WorldState` 밖의 pure derived read model이며 material, political, administrative channel을 각각 0–1로 계산한다.
- material은 `Region.scarcity`만 읽고, negative treasury는 직접 지역 unrest가 되지 않는다.
- political은 명시적으로 관련된 Faction의 grievance/organization/influence와 affinity-weighted local ideology radicalism/organization을 읽는다. mobilization gate는 네 핵심 동원 상태의 최솟값이며 influence는 별도 bounded supplemental signal이다. support/currentStrategy alone은 pressure가 아니다. `Faction.organization`과 ideology organization은 별도 상태다.
- administrative는 `overload / (overload + 15) × (1 - stateControl)`이며, country controller와 positive overload가 모두 있어야 한다. stateCapacity/headroom/overload/stateControl/controller를 합치지 않는다.
- channel combination은 `1 - Π(1 - component)`로 고정한다.
- instability phase는 매일 current pressure target을 향해 `Region.unrest`를 rise `0.02`/recovery `0.015`로 점진적으로 접근시키고, 현재 country-controlled Region의 population-weighted unrest만 `Country.instability` 0–100으로 집계한다. controlled population이 없으면 0이며 national overload bonus는 없다.
- T017 baseline은 legitimacy를 자동 감소시키지 않고, unrest/instability threshold로 rebellion/coup/revolution/civil-war를 예약하거나 발생시키지 않는다.
- event는 severity band transition에만 sparse하게 만들고, existing-only causes와 기존 deterministic event ordering을 유지한다.

### Alternatives

- scarcity/faction/administration을 arbitrary weighted national sum 하나로 합친다.
- pressure를 매일 unrest에 직접 대입하거나 pressure 제거 시 0으로 reset한다.
- ideology support 또는 ideology name에 고정 불안 bonus를 부여한다.
- `Country.instability`에 national overload bonus를 추가한다.
- T017에서 unrest threshold를 T018 crisis scheduler로 연결한다.

### Reason

세 단계의 분리는 “지금 무엇이 압력을 만들고 있는가”, “그 압력이 며칠 누적되었는가”, “현재 국가가 통제하는 인구 중 얼마나 불안한가”를 각각 설명 가능하게 한다. 포화 결합은 여러 실제 원인이 동시에 있을 때만 compound effect를 허용하면서 bounds를 보존한다. daily writer는 T015/T016 monthly source cadence와 authoritative one-day clock을 분리한다. 후속 T018은 이 state를 다른 조건과 함께 읽을 수 있지만 단일 trigger에 종속되지 않는다.

### Consequences

- inspection/WHY read model은 component와 concrete causes를 구분해 보여줄 수 있다.
- T017 초기 rates와 overload reference는 calibration baseline이며 final balance가 아니다.
- `Region.controller` 의존 aggregate는 T017B LandHex authority migration 때 새 territorial projection으로 바꿔야 한다.
- default simulation pipeline은 instability phase를 실제 daily writer로 실행하며, 단위 테스트는 명시적 no-op hook으로 T016 writer 경계를 격리할 수 있다.

### Reversal cost

높음. pressure snapshot shape, unrest event payload, Country metric history, T018 inputs, WHY UI, replay/counterfactual tests가 이 경계를 참조한다. rates나 band thresholds는 낮은 비용으로 재조정할 수 있지만, pressure/unrest/instability를 다시 하나의 저장 score로 합치거나 owner-based aggregation으로 되돌리면 event/replay semantics와 causal explanations를 함께 마이그레이션해야 한다.

## ADR-030 — T017A static LandHex topology is scenario-owned and coordinate-derived

**Date:** 2026-08-22  
**Status:** Accepted

### Problem

T017A는 Region simulation 아래에 여러 LandHex를 가진 물리적 영토 substrate를 추가해야 하지만, T017B의 동적 territorial authority를 선행하면 `Region.controller`와 `LandHex.controller`가 동시에 권위가 되는 위험이 있다. 또한 물리 adjacency를 별도 배열로 저장하면 좌표와 adjacency가 서로 어긋날 수 있고, ContactGraph와의 암묵적 동기화가 생길 수 있다.

### Decision

- `ScenarioDefinition.mapTerritorialTopology.landHexes`가 static `LandHexDefinition`을 소유한다.
- `LandHexDefinition`은 `LandHexId`, integer axial `{ q, r }`, 하나의 `RegionId`, static `terrain`만 가진다. terrain은 descriptor이며 movement/combat/production/ideology/instability modifier가 아니다.
- physical neighbors는 LandHex 집합과 여섯 axial offset에서 pure하게 derive하고, `LandHexId` 오름차순으로 반환한다. explicit adjacency truth를 저장하지 않는다.
- scenario initialization은 duplicate LandHexId, duplicate coordinate, non-integer coordinate, invalid RegionId, invalid terrain을 거부한다. global connectivity와 Region contiguity는 강제하지 않는다.
- T017A에서는 `WorldState.landHexStates`와 `LandHex.controller`를 추가하지 않는다. `Region.controller`가 계속 유일한 territorial authority다.
- `TerritorialTopology`와 `ContactGraph`는 독립적이며 어느 한쪽에서 다른 쪽 edge를 자동 생성하지 않는다.

### Alternatives

- LandHex별 explicit adjacency 배열을 저장한다.
- coordinate topology를 보고 ContactGraph border/contact edge를 자동 생성한다.
- T017A에서 `LandHex.controller`와 `Region.controller`를 함께 두고 동기화한다.
- 전역 연결성 또는 Region별 contiguous 영역을 강제한다.

### Reason

axial coordinate는 작은 static map에서 충분한 topology truth를 제공하고 duplicate coordinate만으로 self/dangling adjacency를 구조적으로 방지한다. 결과를 stable ID order로 정렬하면 definition 배열과 object insertion order가 replay/inspection 결과에 영향을 주지 않는다. static membership과 runtime control을 분리하면 T017A가 기존 economy, ideology, contact, instability 소비자를 바꾸지 않으며 T017B가 authority migration을 별도 검토할 수 있다. 독립된 graph를 유지해야 physical border와 trade/information/migration contact를 서로 다른 causal route로 표현할 수 있다.

### Consequences

- 현재 headless fixture는 7개 Region과 9개 LandHex를 가지며 capital과 merchant-port가 multi-Hex다.
- T017A는 topology 조회와 validation만 제공하고 tick phase, RNG, event, gameplay metric을 변경하지 않는다.
- roads, rivers, POI, fortification, movement, occupation, front, controller projection은 후속 task에서 별도 schema/authority 결정을 받아야 한다.
- T017B는 LandHex runtime controller를 도입할 때 Region/Country control projection과 기존 Region.controller consumer를 함께 migration해야 한다.

### Reversal cost

높음. scenario/save schema, map inspection, future movement/front topology, replay determinism, ContactGraph causal explanations가 LandHex identity와 coordinate convention을 참조한다. terrain vocabulary와 fixture 좌표는 낮은 비용으로 바꿀 수 있지만, coordinate-derived adjacency를 explicit/dynamic topology로 되돌리면 validation·selector·serialization 계약을 함께 마이그레이션해야 한다.

## ADR-031 — Historical intervention archetypes and politically neutral product tone

**Date:** 2026-08-22  
**Status:** Accepted

### Problem

향후 Intervention content가 실제 역사적 대응을 참고하지 않으면 generic bonus
카드나 도덕적 정답 목록으로 흐를 수 있다. 반대로 역사적 사례를 그대로
scripted event로 옮기면 기존의 emergent-history와 정치적 중립성 계약을
깨뜨릴 수 있다. 작품의 냉소적 정치 풍자와 실제 인명 피해의 표현 경계도
production 전에 분명히 할 필요가 있다.

### Decision

- `Policy`는 institutional rule mutation이고 `Intervention`은 현재 문제에 대응하는 bounded action/program이다. 기존의 treasury, administrative headroom, 실제 prerequisite, authoritative day tick 기반 implementation time 계약을 유지하며, `stateCapacity`는 소비성 currency가 아니다.
- production Intervention은 식량·가격·토지·노동·복지·정치권리·검열·치안·군부·행정 등 실제 국가 대응을 연구해 일반화한 archetype에서 만든다. 정확한 catalog와 개수는 아직 정하지 않는다.
- historical inspiration은 state-changing action의 출처일 뿐, 특정 날짜의 쿠데타·혁명·전쟁을 예약하는 script가 아니다. 사건은 당시 WorldState를 읽는 detector가 조건을 충족할 때 감지한다.
- Policy/Intervention에는 `good`/`bad`/`progress`/`evil` 같은 authoritative moral outcome tag를 부여하지 않는다. 실제 institutional, economic, faction consequence를 simulation이 계산한다.
- 내부 tone shorthand는 **정치는 냉소적으로, 비극은 건조하게.** 로 고정한다. 관료주의와 권력자의 자기합리화 등은 black comedy의 대상이 될 수 있지만, 기근·학살·대규모 사망·전쟁 피해·국가 붕괴의 human consequence는 짧고 구체적이며 비희화화된 문체로 표현한다.

### Alternatives

- 역사적 사건을 특정 intervention 뒤에 고정 일정으로 복사한다.
- intervention 이름에 안정/진보/악행 같은 선험적 결과 modifier를 붙인다.
- 실제 정치 용어와 심각한 결과를 generic euphemism 또는 punchline으로 대체한다.
- production Intervention catalog와 전체 humor copy를 지금 확정한다.

### Reason

이 결정은 GDD의 institution-first 및 `Player choices change state, not story
nodes` 원칙을 content 제작 단계에서도 유지한다. 역사적 이름과 구체적
행동은 세계의 인과를 풍부하게 만들지만 결과의 방향을 미리 결정하지 않는다.
Tone 경계는 정치적 자기합리화를 풍자하면서 실제 피해를 가볍게 만들지 않게
한다. 기존 derived `RegimeClassification` 계약은 ADR-013에 이미 기록되어
있으므로 이 ADR에서 새 regime taxonomy나 enum을 만들지 않는다.

### Consequences

- 후속 content/calibration task는 각 intervention의 실제 state mutation,
  prerequisite, 비용, 시간, 가능한 trade-off를 별도로 명시해야 한다.
- historical 사례는 참고 자료이지 재생해야 하는 역사 순서가 아니다.
- tone과 player-facing copy는 simulation authority와 분리되며, 지금은
  production catalog나 문구를 추가하지 않는다.

### Reversal cost

중간. 초기 content 단계에서 수정할 수 있지만, catalog·UI·QA·역사 보고서에
도덕 tag나 scripted outcome이 퍼진 뒤에는 content와 event explanation을
함께 되돌려야 한다.

## ADR-032 — Scenario cardinality is content-driven, not engine-hardcoded

**Date:** 2026-08-22  
**Status:** Accepted

### Problem

first-build의 국가·Region 수를 engine invariant로 오해하면 새 scenario나
T017A의 multi-Hex Region을 추가할 때 simulation loop, aggregation, replay,
QA를 다시 설계하게 된다. 반대로 이 문제를 해결한다며 runtime spawning이나
speculative mod framework를 지금 도입하는 것도 범위를 불필요하게 넓힌다.

### Decision

- Scenario country count is content, not an engine invariant.
- `ScenarioDefinition`의 collection이 `1 Country = N Regions`,
  `1 Region = N LandHexes` cardinality를 결정한다. core simulation은 특정
  국가 수, Country A/B/C 이름, 또는 Region-to-Hex 1:1 관계를 전제로 하지
  않는다.
- 새 Country/Region/LandHex와 topology, initial controller, ContactGraph,
  관련 faction/ideology/economy reference는 scenario/content 변경으로
  추가한다. 단순 cardinality 증가 때문에 두 번째 engine architecture를
  만들지 않는다.
- runtime procedural country creation, generic nation-spawning framework,
  DLC/mod SDK, procedural world generator, arbitrary hot-loading, generic
  plugin architecture는 요구하지도 구현하지도 않는다.
- content freeze 전에는 playtest 결과로 content 구성을 조정할 수 있다.
  freeze 또는 release-candidate 이후 content 추가는 relevant regression,
  multi-seed, pacing, visual QA를 다시 통과해야 한다.

### Alternatives

- first-build의 고정 국가 수를 engine loop와 schema에 하드코딩한다.
- Region마다 LandHex 하나만 허용한다.
- 확장성을 이유로 runtime spawner, mod SDK, procedural generator를 먼저
  만든다.

### Reason

정적 scenario input과 동적 WorldState 경계를 유지하면서 content cardinality를
늘릴 수 있어야 T025 이후 alternate scenario와 T017B territorial migration이
같은 authoritative engine을 사용한다. 동시에 speculative framework를 금지해
현재 Gate 1 fun validation에 필요한 구체적인 content와 QA만 남긴다.

### Consequences

- first-build 국가 수와 production Intervention 수는 아직 LOCK되지 않는다.
- 향후 alternate `ScenarioDefinition`에 대한 lightweight cardinality smoke
  check를 QA backlog에 둔다.
- freeze 이후 content 변경은 기존 QC 결과를 자동 승계하지 않는다.

### Reversal cost

높음. 국가·Region·LandHex를 engine invariant로 되돌리면 scenario validation,
aggregation, territorial projection, serialization, replay, inspection,
multi-seed QA를 함께 바꿔야 한다.

## ADR-033 — T017B LandHex is the sole writable physical territorial authority

**Date:** 2026-08-22  
**Status:** Accepted

### Problem

T017A가 static multi-Hex topology를 추가한 뒤에도 `Region.controller`를
동적으로 유지하면 Region과 LandHex가 서로 다른 물리 통제 사실을 가질 수 있다.
그 상태는 economy, ideology, contact, instability, victory/dissolution,
향후 conflict writer가 서로 다른 권위를 읽게 만드는 dual-truth 위험이다.

### Decision

- `ScenarioDefinition.mapTerritorialTopology.landHexes`는 static identity/membership/
  coordinate/terrain을 소유하고, `ScenarioRegion.initialController`는 run 생성 때
  member LandHex의 runtime controller를 seed하는 static input으로만 사용한다.
- `WorldState.landHexStates[LandHexId].controller`가 물리적 영토 통제의 유일한
  writable authority다. 한 LandHex에는 `country`, `faction`, `uncontrolled` 중 정확히
  하나의 controller만 존재한다.
- runtime `Region.controller`와 저장된 Region summary를 제거한다. Region 상태는
  `deriveRegionControlSummary()`가 LandHex 집합에서 순수하게 파생하고, Country
  territorial lists도 selector로 파생한다.
- Region 전체가 한 Country에 의해 fully controlled일 때만 baseline country economy,
  ideology, foreign-contact, instability aggregate에 포함한다. partial/contested/
  faction presence/uncontrolled는 이 단계에서 Hex별 population/production 분할을
  하지 않는다.
- `Region.ownerCountryId`, `Region.stateControl`, political influence는 physical
  controller와 독립된 사실이다. ContactGraph는 directed Region graph로 유지하며
  TerritorialTopology에서 자동 생성하지 않는다.
- 물리 통제 변경은 typed immutable `changeLandHexController` seam을 사용하고,
  실제 변화만 deterministic `LAND_HEX_CONTROL_CHANGED`를 append-only event로 배출한다.
  `causeIds`는 호출자가 이미 알고 있는 event ID만 받을 수 있다.

### Alternatives

- Region.controller를 호환성 cache로 남기고 매 tick LandHex와 동기화한다.
- Region 단위 controller를 계속 권위로 두고 LandHex는 rendering projection으로만 둔다.
- partial Region의 생산·인구를 LandHex에 임의 분할해 즉시 aggregate한다.

### Reason

LandHex는 실제 물리 점령·전선·영토 변화가 일어나는 최소 substrate이고 Region은
정치·경제·사회 aggregate다. writable fact를 LandHex 하나로 고정하면 partial/contested
상태를 손실 없이 표현하면서 Region/Country consumer가 각자의 projection semantics를
선택할 수 있다. full-only baseline은 기존 Region 단위 생산·인구 가중 의미를 보존하고,
population을 Hex에 발명해 double count하는 일을 피한다. ContactGraph 독립성은 물리
인접성과 무역·정보·이주 접촉의 원인을 섞지 않는다.

### Consequences

- T017B는 topology, economy, ideology, contact, faction relevance, instability의
  기존 controller read path를 projection으로 migration한다.
- T018 rebellion/coup과 T021 conflict가 물리 통제를 바꿀 때에도 같은 typed seam과
  event contract를 사용해야 한다. 이 ADR은 반란·전쟁 해소 규칙을 구현하지 않는다.
- T022/T023이 Region control criteria를 평가할 때는 이 ADR의 full-region projection을
  사용해야 한다.
- `WorldState.landHexStates`는 plain JSON data라서 T024 serialization/replay seam에
  들어갈 수 있지만, T024 자체를 이 ADR이 구현하지는 않는다.

### Reversal cost

높음. LandHex runtime schema, all territorial projections, event IDs/payloads,
economy/ideology/contact/instability aggregation, victory/dissolution reads,
save/replay snapshots, T017B inspection and future map/conflict writers를 함께
마이그레이션해야 한다.

## ADR-034 — Procedural political press derives deterministic framing from recorded history

**Date:** 2026-08-22  
**Status:** Accepted

### Problem

An AI-first political press could invent events, actors, numbers, or causal
explanations after a run. Runtime model calls would also make the feature
network-dependent, costly, and difficult to reproduce in replay. A generic
narrative layer would conflict with the existing event authority, exact
political terminology, and emergent-history rules.

### Decision

- The default product direction is **Procedural Political Press / Gazette**.
- PressFacts are a deterministic, bounded read model derived only from the
  recorded ordered `ActionRecord` / `GameEvent` history supplied by the future
  `EventStore` boundary. Press prose is never authoritative causal truth.
- The primary runtime path is authored templates/grammar plus deterministic
  seeded variant selection. The same recorded history and publication context
  must reproduce the same result; `Math.random()` and wall-clock selection are
  not allowed.
- A publication perspective may frame the same recorded facts differently using
  actual Government/institutional context, actors, Regions, and event severity.
  It may change expression, emphasis, and non-essential omission, but may not
  invent facts, actors, actions, numbers, damage, or causal links.
- The default runtime has no required external API, OpenAI call, internet
  dependency, runtime token cost, local LLM, or WebGPU inference. Optional future
  AI enhancement is non-required and must not replace the deterministic primary
  path.
- Exact PressFacts schema, publication types/names, template or variant counts,
  selection algorithm, UI layout, and storage format remain unlocked until the
  implementation task.
- Exact political and historical terminology, anti-AI-slop writing, and the
  existing **정치는 냉소적으로, 비극은 건조하게.** boundary apply to press copy.
  Development-time AI may assist with candidate authoring only; human/design
  review is required before static content is accepted.
- This decision does not change ADR-005 simulation authority or ADR-009's
  server-side boundary for any future AI actor integration.

### Alternatives

- make runtime LLM generation the primary newspaper path;
- generate generic prose from current numeric state without event provenance;
- let newspaper text create or schedule events and explain them afterward;
- use one neutral summary style and discard publication perspective;
- require an external API or local model for replayable press output.

### Reason

The simulation already owns the facts, event order, cause IDs, and replay
inputs. A deterministic derived layer preserves repository-grounded history,
offline playability, stable replay, and clear WHY inspection while still
allowing political framing and authored tone. Keeping facts separate from prose
also prevents a newspaper from becoming a second simulation or an invented
story rail.

### Consequences

- T024 must expose enough committed ordered history for later PressFacts
  derivation, while article text remains presentation data rather than
  authoritative WorldState.
- Different publication perspectives can produce different headlines for the
  same event, but fact-integrity and cause provenance remain testable.
- Routine events may use procedural composition; major historical events may use
  a larger reviewed hand-authored variant set. The content catalog and counts are
  future calibration work, not this decision's implementation.
- The feature is eligible after T024 and Gate 2 deterministic event/news
  presentation foundation. Runtime AI integration is not a current backlog
  requirement.

### Reversal cost

높음. Once PressFacts provenance, template content, publication framing, replay
output, and UI expectations are consumed, changing the primary path or allowing
prose to become authoritative would require content, QA, replay, and presentation
migration. The current schema and content counts remain intentionally unlocked to
keep early reversal cheaper.

## ADR-035 — T018 political crisis capabilities and current-state Conflict detection

**Date:** 2026-08-22  
**Status:** Accepted

### Problem

T018 needs to distinguish a structurally coup-capable faction from a rebellion-capable
regional movement without guessing from faction names or treating unrest, instability,
support, or current strategy as a universal trigger. A read-only eligibility check alone
would also recreate the same crisis every day unless the existing active `Conflict`
domain represented the current attempt.

### Decision

- Add optional static `ScenarioDefinition.factionCapabilities` metadata containing
  typed `coup` / `rebellion` capabilities. Scenario validation checks faction references
  and duplicate/invalid capabilities; the map is not copied into `WorldState` and does
  not represent progression, unlocks, countdowns, or guaranteed behavior.
- Implement separate pure `deriveCoupPrerequisites()` and
  `deriveRebellionPrerequisites()` read models. They preserve required gate status,
  bounded supporting signals, concrete reasons, regional evidence, and explicit
  `notImplemented` future evidence instead of a generic crisis score.
- Derive state weakness from current Country metrics, fully controlled Region unrest,
  and LandHex territorial projection. Do not add a stored generic `stateWeakness`,
  `crisisProgress`, or clock to `WorldState`.
- Reuse `ConflictKind.coup` / `ConflictKind.rebellion` and active `Conflict` records
  for current attempts. Add optional `Conflict.affectedRegionIds` for political impact
  regions; keep `contestedRegionIds` for physical contest semantics.
- Run detection in the existing `conflict` phase, with canonical deterministic ordering
  and active `(country, faction, kind)` duplicate suppression. Starting a crisis does
  not mutate Government, CountryId, RunOutcome, LandHex controller, or physical fronts.
  Future government transitions continue to use `ConflictOutcome.governmentTransition`.
- Emit `COUP_ATTEMPT_STARTED` / `REBELLION_STARTED` with bounded prerequisite evidence.
  If the current step has no historical EventStore input, use empty `causeIds` rather
  than inventing cross-tick event IDs.

### Alternatives

- infer capability from faction names, interests, or `currentStrategy`;
- add one national rebellion/coup meter or a hidden crisis countdown;
- add a separate `StoryCrisis` state instead of reusing `Conflict`;
- require existing faction LandHex control before a rebellion can start;
- change LandHex controller or Government as soon as eligibility passes.

### Reason

Scenario-owned capability is the smallest typed answer to actor eligibility and keeps
static content separate from mutable run state. Separate gates preserve the distinction
between political intent, public support, radicalism, organization, resources, and actual
regional mobilization. Reusing `Conflict` prevents a second crisis authority while the
optional affected-region field avoids falsely treating a coup's political target as a
physical territorial contest. Detection can therefore be deterministic, explainable,
replay-friendly, and compatible with the T017B LandHex authority contract.

### Consequences

- Existing scenarios without capability metadata remain conflict-phase no-ops for T018.
- T019/T020 must own foreign support and diplomacy evidence; T021 must own army,
  occupation, territorial resolution, and physical LandHex mutations.
- Numeric prerequisite thresholds remain centralized inspection baselines and are not
  final balance decisions.
- `Conflict` serialization/replay consumers must preserve optional
  `affectedRegionIds` when T024 is implemented.

### Reversal cost

높음. Changing this boundary later would require migrating ScenarioDefinition validation,
conflict identity/deduplication, event payloads, WHY evidence, typed read models,
serialization/replay, and future Government/LandHex resolution consumers.

## ADR-036 — T019 foreign heuristic uses common action intake and diplomacy-owned directed contact mutation

**Date:** 2026-08-22  
**Status:** Accepted

### Problem

T019 needs a deterministic foreign-state baseline that can inspect existing Country
state and perform a reversible border-policy action. A separate foreign actor entity,
an unbounded bilateral relation score, or direct heuristic mutation would create a
second authority boundary before T020/T021.

### Decision

- Use the existing non-player `Country` as the foreign actor. Derive a pure
  `ForeignStateObservation` from actual Country, Government, derived territorial,
  contact-runtime, and active Conflict state in stable `CountryId` order.
- Run one bounded no-RNG heuristic checkpoint per foreign Country at the existing
  monthly cadence. Its only actions are `CLOSE_BORDER`, `REOPEN_BORDER`, and `WAIT`.
- Route foreign actions through the common `ActionProposal` ->
  `acceptActionProposal` -> `ActionRecord` intake and global sequence. Do not create a
  foreign action queue or parallel action log. `WAIT` is accepted and event-silent.
- Make the `diplomacy` phase the canonical writer for `contactEdgeStates`. A close
  affects only explicit directed `channel: "border"` edges from actor-controlled
  Regions to target-controlled Regions. The reverse edge and static topology are
  independent.
- Record `blockedReason: "foreignPolicyBorderClosure"` and
  `blockedByCountryId` on a foreign-policy closure. Reopen only an edge closed by that
  same actor and preserve static `baseStrength` and runtime `multiplier`.
- Emit ordered border transition events and bounded rejection evidence. T019 does not
  mutate LandHex controllers, Region projections, factions, ideology, treasury,
  Government, PolicyState, Conflict, economy, trade, sanctions, or war state, and it
  does not use T020 ideology/regime-prestige motives.

### Alternatives

- create a separate `ForeignNation` / `AICountry` domain entity;
- add a new authoritative bilateral relation meter;
- make border closures symmetric;
- encode the closure owner only inside a free-form reason string;
- let the heuristic mutate contact runtime state directly.

### Reason

The existing Country and contact graph already provide the smallest authoritative seams.
The common action intake keeps player, heuristic, and future LLM inputs replayable and
globally ordered. Explicit directed edge ownership makes close/reopen reversible without
silently changing a neighbor's policy or a static ScenarioDefinition. Keeping T019
observation-only for ideology and regime motives leaves T020's causal foreign threat
model as a separate decision.

### Consequences

- T019 supplies readable foreign macro behavior without adding a relation score or
  predetermined diplomacy story.
- Runtime serialization must preserve optional `blockedByCountryId` alongside the
  existing closure reason when T024 persistence/replay is implemented.
- T020 may add foreign ideological threat evidence, and T021 may add war/occupation,
  but neither may bypass the action/event/territorial authority boundaries.

### Reversal cost

High. Changing this boundary would require migrating action schemas, runtime contact
state, event payloads, deterministic ordering, replay records, inspection fixtures, and
future diplomacy/UI consumers.

## ADR-037 — T020 causal foreign ideological threat and explicit incoming border response

**Date:** 2026-08-22  
**Status:** Accepted

### Problem

T020 needs to distinguish a real foreign ideological threat from an ideology name,
foreign Country existence, or source support in isolation. T019's `CLOSE_BORDER` is
explicitly an actor → target outgoing closure, so reusing it for an incoming
foreign → actor threat would silently reverse its meaning and make the response
directionally false.

### Decision

- Derive T020 route candidates and grouped `ForeignIdeologicalThreatSnapshot` values
  from live directed ContactGraph routes, T015 support-gradient exposure, actual
  channel/effective strength, aligned domestic faction mobilization, and current
  actor vulnerability. Store no threat meter in `WorldState`, `Country`, or `RunState`.
- Require both external exposure and meaningful domestic mobilization. Vulnerability
  amplifies an eligible route but cannot create threat alone. Preserve route evidence
  rather than reducing the result to an unexplained scalar.
- Extend `ForeignStateObservation` with the derived threat snapshot. Keep the existing
  T019 outgoing `CLOSE_BORDER` / `REOPEN_BORDER` semantics unchanged.
- Add direction-explicit `RESTRICT_INCOMING_BORDER(actor, target)` and
  `RESTORE_INCOMING_BORDER(actor, target)`. These mutate only explicit border edges
  from target-controlled source Regions to actor-controlled destination Regions,
  record actor ownership with a distinct runtime reason, preserve reverse edges/static
  topology/base strength/multiplier, and restore only the actor's own closure.
- Use separate restriction/restore thresholds with deterministic hypothetical reopen
  evaluation; no cooldown, hidden clock, RNG, or automatic response to non-border
  channels is introduced.

### Alternatives

- reuse T019 `CLOSE_BORDER` and claim an outgoing closure blocks incoming exposure;
- add a stored bilateral `ideologicalThreat` meter or `foreignSupport` value;
- make all border closures symmetric;
- let source ideology names or regime labels directly assign hostility;
- implement censorship, propaganda, sanctions, faction funding, or military response
  as a shortcut.

### Reason

The derived snapshot keeps ideology/contact authority with T015/T014 and prevents a
second mutable threat state. Requiring a live route plus domestic political exposure
makes the explanation causal and keeps foreign ideology from becoming an automatic
enemy list. Direction-explicit actions are the smallest reversible extension that
matches the actual graph while preserving T019 regression behavior and the later T021
military boundary.

### Consequences

- T020 can detect information, trade, migration, and border exposure, but only border
  exposure has an implemented response; unsupported channels remain visible and lead
  to `WAIT`.
- `ForeignStateObservation` and border events carry enough route evidence for WHY
  inspection without making UI, network, or AI authoritative.
- Existing T019 action records and closures remain valid. T024 serialization/replay
  must preserve the two new action types, incoming closure reason/owner, threat evidence,
  and deterministic ordering.
- Thresholds are centralized diagnostic classification constants, not final balance.
  T021 may consume the derived evidence but must not bypass the contact/action authority.

### Reversal cost

High. Removing or changing this boundary would require migrating action decoding,
runtime closure ownership, event payloads, ForeignStateObservation consumers, replay
schemas, inspections, and future diplomacy/war explanation paths.

## ADR-038 — T021 phase-start strategic conflict resolution on LandHex authority

**Date:** 2026-08-22  
**Status:** Accepted

### Problem

T021 needs the smallest deterministic conflict/war substrate that can change
physical territory without introducing a second territorial authority, a tactical
army model, or fixed war scheduling. Rebellion detection, multiple active
conflicts, and a later government transition also need an explicit phase boundary
and event ordering contract.

### Decision

- Resolve only existing active armed `rebellion`, `civilWar`, and `war` conflicts;
  `coup` is non-territorial in T021.
- On the centralized weekly boundary of the daily tick, derive at most one
  `TerritorialControlIntent` per Conflict from the phase-start `WorldState`.
  Resolve target collisions by stable `ConflictId` order and apply accepted
  intents by stable target/Conflict order.
- Mutate physical territory only through `changeLandHexController()` and pass the
  current event buffer, event sequence, and already-known cause IDs through every
  mutation. Fronts remain pure projections from adjacent LandHex controllers.
- Use `Country.militaryPower` for Country participants. Derive Faction operational
  capacity from organization, normalized resources, local radicalism, local
  ideology organization, and local unrest. Do not add a new military meter,
  weapons, military sympathy, foreign military support, terrain modifier, or RNG.
- Rebellion initial seizure uses affected-Region ranking; later movement and
  country war require physical adjacency. An advantage margin is required, ties
  stalemate, and each boundary changes at most one LandHex per Conflict.
- New T018 rebellions are detected after resolution and cannot capture in the same
  phase. An eligible no-territory rebellion may be suppressed when its prerequisites
  become ineligible; otherwise it remains active.
- Government transition is an explicit typed outcome that reuses an existing
  Government of the same Country, preserves CountryId and territory, and never
  implies terminal defeat. `stateDissolved` remains owned by T023.

### Alternatives

- store a Region-level controller or cached front in `WorldState`;
- resolve every day or let newly detected rebellions act immediately;
- add a speculative army/weapon/military-sympathy model;
- let insertion order or RNG decide colliding targets;
- treat coup or regime change as territorial capture or automatic defeat.

### Reason

The phase-start intent model keeps all active conflicts comparable and makes
same-seed replay independent of object insertion order. The existing LandHex
mutation seam preserves the T017B authority migration and event provenance. The
derived Faction capacity uses already authoritative political and resource state,
while the explicit exclusions keep T021 from pretending to be a full war model.

### Consequences

T021 can produce spatially legible, bounded territorial movement and a typed
government-continuity seam. It does not declare wars, negotiate peace, model armies,
or evaluate victory/defeat. T022/T023 and later military/diplomatic systems must
consume the derived projections and preserve the same LandHex/event boundaries.

### Reversal cost

High. Changing this boundary would require migrating conflict resolution inputs,
LandHex mutation calls, event payloads and ordering, deterministic inspections,
government-transition handling, and later T022/T023/replay consumers.

## ADR-039 — T023 state dissolution evidence boundary and terminal precedence

**Date:** 2026-08-22  
**Status:** Accepted

### Problem

`DissolutionCriteria` names full annexation, permanent fragmentation, and loss of
sovereign functions, but the current `WorldState` does not yet contain authoritative
evidence for those conditions. T023 must also define what happens when the same
post-conflict state would both finish T022 consolidation and satisfy dissolution.

### Decision

- `ScenarioDefinition.dissolutionCriteria` remains the only criteria source;
  `RunState` stores only current evaluation/outcome state.
- `deriveStateDissolutionEligibility()` is a pure deterministic read model. The
  only supported condition is the inclusive player-Country check
  `stateContinuity <= stateContinuityAtOrBelow`. T023 reads `stateContinuity` and
  does not create its writer or reduction formula.
- Full annexation, permanent fragmentation, and sovereign-function loss remain
  explicitly deferred when their configured evidence is unavailable. T023 does not
  infer them from LandHex occupation alone, capital loss, owner identity, treasury,
  instability, state capacity, Government/regime/ideology, rebellion, or civil war.
- The combined `evaluateOrderConsolidationAndDissolution` phase evaluates
  dissolution first. A satisfied dissolution emits one `STATE_DISSOLVED`, records
  that event ID in `RunOutcome.causeEventId`, and skips T022 consolidation for that
  step. With no actual source event, `causeIds` is empty. Existing terminal gating
  keeps already-won and already-defeated runs inert.

### Alternatives

- infer annexation from all LandHexes being foreign-controlled;
- add a generic sovereignty score or recovery timer;
- evaluate T022 before dissolution and allow contradictory terminal events;
- treat regime change, capital loss, or active conflict as automatic defeat.

### Reason

The boundary records only evidence the current simulation can defend and prevents
territorial occupation from silently becoming state dissolution. Checking the
terminal condition first makes the outcome single-valued and keeps event provenance
honest while preserving the existing LandHex authority and CountryId continuity.

### Consequences

T023 can terminate a run through the configured state-continuity threshold and can
report the other configured criteria as deferred. Actual annexation, permanence,
sovereign-function, successor-state, and cross-tick evidence require a later
architecture decision and persistence/replay support.

### Reversal cost

High. Changing this boundary would affect `RunOutcome`, event payloads and terminal
ordering, scenario validation, deterministic inspections, future conflict/territory
evidence, and T024 replay schemas.

## ADR-040 — T024 versioned authoritative snapshot with sibling EventStore replay boundary

**Date:** 2026-08-22  
**Status:** Accepted

### Problem

The simulation had deterministic runtime state and an external `EventStore`, but no
typed boundary proving that save/load can continue the same history. Serializing
only a seed or only `WorldState` would lose RNG cursor, action history, event causes,
terminal outcome provenance, mutable ContactGraph overlays, or multi-Hex runtime
control. Copying ScenarioDefinition or derived read models into the save would create
another authority.

### Decision

- Use the explicit `SerializedSimulationSnapshotV2` envelope with
  `formatVersion`, `scenarioId`, `scenarioVersion`, authoritative runtime
  `WorldState`, and sibling `EventStore` history. The static ScenarioDefinition is
  supplied separately to `deserializeSimulationSnapshot()`.
- Persist the actual `WorldState.rngState`, `RunState` including the shared ordered
  ActionRecord log/cursors and RunOutcome, all mutable runtime entities, LandHex
  controller state, mutable ContactGraph edge state, and the full ordered
  GameEvent history. `RunRecord` is the in-memory atomic unit.
- Do not persist ScenarioDefinition/topology, Region.controller, front, Region/Country
  control summaries, regime classification, Agenda, pressure/threat snapshots,
  consolidation/dissolution eligibility, or UI state. These are reconstructed from
  static scenario plus current runtime state.
- Treat deserialize as a trust boundary. Explicit decoding plus
  `assertScenarioRuntimeClosure()` rejects unknown format or keys, wrong scenario
  identity, incomplete/extra V2 Country/Region/Faction/PolicyState identity sets,
  incomplete ideology catalog coverage, invalid policy/faction/intervention
  references, Government/Conflict outcome reference errors, missing/unknown
  LandHex runtime state or static LandHex → Region membership, invalid terminal
  cause references, forged/duplicate ActionRecord IDs, invalid commitment
  provenance, and event histories with missing or forward causes.
- `commitSimulationStep(scenario, record, result)` keeps the full validation path
  for plain/untrusted records and uses an in-process canonical continuation path
  only when both the previous `RunRecord` and `runSimulationStep()` result came
  through the same validated `ScenarioDefinition` and the result is bound to the
  exact `record.world` object identity. The continuation validates only the new
  Event/Action/commitment delta plus candidate runtime closure and terminal
  relation; prior canonical history is not rescanned every tick.
  Failure leaves the input record, EventStore, action history, and runtime state
  unchanged. Event IDs, sequences, payloads, and causeIds are not renumbered or
  repaired.
- Canonical continuation status is held in process-local non-serializable
  `WeakMap` markers. A trusted `SimulationStepResult` is bound to the exact
  source `WorldState` object identity and is single-use at commit; a mixed-parent
  result or a reused result is rejected. Canonical `RunRecord` and trusted result
  graphs are runtime-immutable through incremental process-local freezing, while
  already-protected objects are reused without a full graph traversal each tick.
  No serialized marker or capability is restored. Full
  `serializeSimulationSnapshot()` / `deserializeSimulationSnapshot()` validation
  remains mandatory, and the ordered EventStore history remains its sole
  authority; incremental ID/cause lookup is only a derived lookup over that
  history.
- Replay equivalence means: same ScenarioDefinition version + same validated
  snapshot + same subsequent validated ActionRecord inputs produces the same
  WorldState, RunState, RNG, EventStore, event IDs/sequences/causes, and terminal
  outcome. Canonical textual ordering is used for authoritative collection keys;
  semantically ordered domain arrays are preserved.
- Replace the authoritative `localeCompare` ordering in economy/resources with a
  locale-independent textual comparator. This is a determinism correction, not a
  balance change.

### Alternatives

- persist only the initial seed and replay all commands from the beginning;
- serialize the entire ScenarioDefinition and derived read models into each save;
- make EventStore part of WorldState or rebuild WorldState only from events;
- accept unknown snapshot data and silently repair missing LandHex/events;
- use locale-sensitive display ordering in authoritative simulation paths.

### Reason

The snapshot captures exactly the mutable authority needed to continue the current
run while static content remains scenario-owned and derived views remain selectors.
V2 deliberately assumes no runtime lifecycle for Country/Region/Faction/PolicyState;
future successors or dynamically created actors require an explicit lifecycle
extension rather than silently weakening the exact identity checks. Scenario
version is the compatibility boundary; a content hash and migration framework are
not introduced by this decision.
Keeping EventStore beside WorldState preserves the existing step contract and makes
cross-tick provenance available without converting the project to a full
event-sourced engine. Explicit decoding makes corrupt or mismatched saves fail at the
boundary. The uninterrupted-versus-resumed and multi-boundary tests demonstrate that
the actual RNG cursor, event history, and terminal freeze survive the round trip.
The F01A continuation seam preserves this boundary while removing repeated
full-history work from the trusted in-process path; selected checkpoints and a
full-commit comparison keep the two validation paths aligned. F01B adds exact
parent binding, one-shot result consumption, and runtime immutability so the
incremental shortcut cannot rely on a stale or forged process-local marker.
F01C keeps canonical registration private to the validated persistence and
simulation-step seams; no public simulation module can register an arbitrary raw
RunRecord or SimulationStepResult. Shared freeze bookkeeping records completion
only after recursive protection succeeds and clears in-progress state on failure,
so an unsupported Map/Set cannot become an apparent completed graph on retry.

### Consequences

- T021/T022/T023 and T019/T020 runtime overlays can cross a snapshot boundary without
  changing their authority or cadence semantics.
- Future deterministic PressFacts/WHY/read models can consume the committed history,
  but prose remains non-authoritative.
- `version: 2` is identified and version 1/unknown versions are rejected; migration chains,
  storage backends, save slots, rewind, branching, multiplayer rollback, and replay
  UI remain future work.
- A snapshot is a runtime continuation artifact, not a replacement for scenario
  content validation or an event-sourced history rebuild.

### Reversal cost

높음. Changing the runtime/static boundary, moving EventStore into WorldState,
dropping RNG/history, or restoring derived authority would require snapshot schema
migration, replay baselines, causal WHY consumers, terminal tests, and every later
system that reads LandHex/contact/conflict state to be revised.

## ADR-041 — F04D narrow political competition and intervention-owned institution mutation

**Date:** 2026-08-24
**Status:** Accepted

### Problem

The existing institutional rules could distinguish suffrage, press, labor,
legislature, veto, and property law, but could not represent whether independent
political organizations were legally banned, restricted, or allowed to compete.
F04C-R required that distinction without introducing a democracy score, election
simulation, regime bonus, or scripted political history. F04D also needed a normal
action path that could change the rule while preserving treasury, administrative
capacity, duration, causal events, replay, and downstream detector authority.

### Decision

- Add required `InstitutionalRuleState.politicalCompetition` with exactly
  `banned | restricted | plural`. It represents legal organization/competition
  access only and remains independent of suffrage, press, labor, legitimacy,
  elections, government turnover, and derived `RegimeClassification`.
- Make the existing faction `BARGAIN` path consume `politicalCompetition ===
  "plural"`. Keep `LOBBY` on press freedom and `ORGANIZE` on labor law so the three
  legal channels remain distinct.
- Add typed `institutionalRuleSet` to Intervention completion effects. The effect
  writes only one valid InstitutionalRuleState key/value at a time. Completion
  retains the existing `INTERVENTION_COMPLETED` event and emits
  `INSTITUTION_RULE_CHANGED` with the completion event as its cause.
- Add `ruleNotEquals` and opt-in `requireCompletionEffectChange` so F04D definitions
  can reject a start whose completion would no longer change authoritative state.
  This does not replace treasury, administrative headroom, prerequisite, or
  commitment-duration checks.
- Keep the four F04D response definitions in a developer validation fixture. They
  use existing material, faction, and institution effects; no response directly
  writes crisis, conflict, territory, government, or consolidation state.
- Raise `SNAPSHOT_FORMAT_VERSION` to 2 and require a valid competition value at the
  deserialize trust boundary. Reject version 1 instead of silently defaulting or
  adding a migration chain.

### Alternatives

- infer political competition from suffrage, press freedom, or regime label;
- add a generic democracy/openness/stability meter;
- let response IDs schedule coup, rebellion, or government transition outcomes;
- add an unrestricted effect scripting language;
- silently load version 1 with `restricted` as an implicit default.

### Reason

The narrow rule models a legal distinction that existing axes do not contain, while
one real BARGAIN consumer makes it mechanically observable. The Intervention seam
already owns cost, administrative headroom, time, completion, event provenance, and
replay, so a typed rule mutation is the smallest authoritative extension. Existing
crisis and territorial systems remain responsible for detecting consequences from
state. Strict version 2 decoding avoids turning an absent saved field into an
unstated political choice.

### Consequences

- Same non-institution state can produce different legal availability and later
  histories from `banned` versus `plural` competition.
- Legalization and coercive restriction carry costs, duration, faction
  counter-reaction, and no-op repeat rejection; neither deletes a faction or grants
  a regime-wide bonus.
- Every ScenarioDefinition and serialized PolicyState must include the new rule.
  Version 1 snapshots no longer load.
- Elections, parties, electoral turnover, full labor bargaining, transitional
  justice, military factions, war politics, and arcane privilege need later domain
  decisions rather than being inferred from this enum.

### Reversal cost

Medium. Removing or broadening the rule changes PolicyState, snapshot compatibility,
Faction pressure availability, intervention effects, event histories, validation
fixtures, and counterfactual baselines, but it does not change territory, conflict,
or Government authority.

## ADR-042 — F05_FIX6 authored political proposal and shared intervention response

**Date:** 2026-08-24
**Status:** Accepted for the developer validation slice; Gate 1F remains `NOT_READY`

### Problem

F05_FIX5 showed that faction action labels alone do not identify a demand,
recipient, commitment, or outcome. `LOBBY` had no represented interaction, while
the existing InterventionDefinition already had a bounded authoritative resolver.

### Decision

- Add an optional scenario-authored `(FactionId, triggerAction) -> InterventionId`
  template. The first slice uses one explicit coup-faction `LOBBY` template for
  the existing F04D coercive restriction intervention.
- Add authoritative `PoliticalProposal` runtime state with captured Country and
  current Government, one `interventionRequest` subject, open/accepted/rejected
  lifecycle, and opening/response provenance.
- Add typed player `RESPOND_POLITICAL_PROPOSAL` with `accept | reject` on a later
  tick. Rejection preserves the measured status quo. Acceptance reuses the
  existing intervention feasibility, treasury, administrative load, duration,
  completion, and typed effect path with the response ActionRecord as source.
- Reject stale Government targets without retargeting and leave infeasible
  acceptance open with an explicit response-rejected event.
- Raise snapshots to V3 and reject V2 rather than silently migrating or defaulting
  proposal state.

### Alternatives

- infer demands from faction interests or ideology;
- apply a scalar grievance/organization/resource bonus on `LOBBY`;
- create a hidden synthetic `START_INTERVENTION` action;
- auto-accept or auto-reject in the official F05 matrix;
- add probabilistic bargaining, counteroffers, or an equilibrium solver.

### Reason

The proposal/status-quo and veto-response structure is grounded by Romer &
Rosenthal, veto-player/veto-bargaining summaries, and minimal offer/accept-reject
work. The implementation keeps those references at the grammar level and uses
existing TMR contracts for the actual consequence. The controlled same-seed
experiment shows that only ACCEPT reaches an existing intervention and produces
measured institutional/faction downstream change.

### Consequences

The snapshot trust boundary, action/event causality, runtime closure, and focused
replay tests now include proposal state. Production F04D/F05 scenarios remain
template-free; integrating proposal-response policy into F05 pacing requires a
separate reviewed task. Bargaining, parties, elections, crisis writers, territory,
continuity, V02, and UI remain outside this decision.

### Reversal cost

Medium-high. Removing this layer would require reverting V3 persistence, action
and event vocabulary, runtime provenance checks, focused tests, and the explicit
developer fixture without changing the underlying InterventionDefinition seam.

# Template

## ADR-XXX — Title

**Date:** YYYY-MM-DD  
**Status:** Proposed / Accepted / Superseded

### Problem

### Decision

### Alternatives

### Reason

### Consequences

### Reversal cost
Low / Medium / High

## ADR-045 — GameBuilders P0 replaceable political-atlas surface

**Date:** 2026-08-26
**Status:** Accepted for `GAMEBUILDERS_PRODUCT_SURFACE_P0`

### Problem

The accepted GameBuilders demo is playable but its title, map, and decision
surface are visually coupled in one small React composition. That makes a
single crest, hero, map layer, or copy correction expensive and leaves the
authoritative political map visually indistinct from a debug hex grid.

### Decision

- Keep simulation and persistence unchanged as the authority. Add a typed,
  stable-ID design registry, asset manifest, layer registry, screen registry,
  and Korean copy registry under `src/presentation/design/`.
- Treat project-authored SVG/CSS/procedural assets as replaceable modules. Any
  future generated raster must carry style-family, provenance, prompt recipe,
  version, layer, and crop metadata before it is used.
- Compose title, opening dossier, political atlas, HUD, decisions, and history
  from named presentation components. Country/Region/LandHex labels and tint
  are derived from actual scenario data; the renderer does not invent entities.
- Use the existing DOM/SVG path for P0. Audit MIT map/renderer references and
  keep AGPL Freeciv-web as UX reference only; do not add a renderer dependency
  without a measured P0 need.

### Reason

The registry makes partial asset replacement and layer-level QA possible while
preserving the thin-client boundary. The atlas can become visually richer by
changing presentation modules without moving political authority into React.

### Consequences

New production art must be registered and pass provenance/closure checks. The
first P0 map remains a stable SVG/DOM composition and may use procedural texture
instead of an untraceable asset bundle.

### Reversal cost

Medium. Removing the registry would require returning component identity, asset
provenance, and layer toggle coverage to per-screen code.

## ADR-043 — F05_FIX7 long-horizon proposal orchestration remains developer-only

**Date:** 2026-08-24
**Status:** Accepted for the F05_FIX7 measurement slice; Gate 1F remains `NOT_READY`

### Problem

F05_FIX6 proved one authored political proposal can reach an existing
intervention. The next question is whether that interaction produces durable
state-grounded reassessment over five years without changing the historical F05
baseline or turning proposal notifications into artificial pacing.

### Decision

- Close `FactionProposalTemplate.triggerAction` to `LOBBY` only because the
  implemented opener/provenance contract is LOBBY-only.
- Reuse exactly the one FIX6 coup/security-faction template in a separate
  developer-only F05_FIX7 scenario identity.
- Measure the historical 36 branches separately from 108 proposal-enabled
  branches (six contexts × six existing strategies × three response modes).
- Add only a deterministic developer response seam. It emits normal player
  ActionProposals; strategy actions are ordered before proposal responses on a
  shared target tick, with carried faction records after them.
- Keep state-grounded F05 pacing events separate from proposal decision load.
  Measure reopening, response feasibility changes, and mode effects instead of
  adding cooldown, expiry, or rejection memory.

### Alternatives

- add proposal lifecycle events to F05 pacing to shorten silence;
- make rejection suppress future authored proposals;
- add more templates or subjects for variety;
- replace the deterministic seam with production player AI or probabilistic
  response;
- rewrite the official F05 strategy matrix around proposals.

### Reason

The matrix preserves a clean historical control and tests the accepted kernel
against the same F05 contexts, strategies, and five-year horizon. The measured
run contains 48 identical-key reopens after explicit rejection, while the
state-grounded maximum reassessment silence remains 1,200 days. That is a
truthful interaction/churn finding, not evidence for a Gate 1F promotion.

### Consequences

The v1 configuration footgun is closed and same-tick input ordering is
inspectable. Proposal decision load can be reported without contaminating the
Gate-relevant pacing metric. F05 remains unchanged and `V02` remains outside
scope. A later reviewed task would need to decide whether to redesign the
proposal lifecycle or promote any response policy.

### Reversal cost

Medium. Removing the developer seam and trigger validation affects inspection
contracts, tests, and measurement docs, but not authoritative proposal state,
intervention resolution, persistence V3, or production F05 strategy semantics.

## ADR-044 — F05_FIX8 state-grounded rejected-demand reconsideration

**Date:** 2026-08-24
**Status:** Accepted for the developer validation slice; Gate 1F remains `NOT_READY`

### Problem

F05_FIX7 exposed two separate findings: eight IGNORE/REJECT control differences
that needed causal audit, and repeated explicit-rejection episodes for the same
authored demand. Lifecycle changes could not be justified until the non-accept
differences were separated into runtime state, runner ordering, and measurement
effects.

### Decision

- Audit the exact four IGNORE and four REJECT branches before production
  lifecycle mutation. The first probe showed equal ActionRecord order, carried
  faction actions, authoritative core state, intervention state, and Agenda
  inputs; only proposal lifecycle state was added. The historical and FIX7
  no-template runners stayed paired. The measured difference was the FIX7
  observer counting individual pacing events rather than official 30-day event
  clusters, so only that developer measurement seam was repaired.
- Define stable demand identity as
  `proposerFactionId + countryId + subjectKind + interventionId`. Government,
  opening/response IDs, event IDs, and ticks are episode provenance.
- Persist an explicit-rejection basis containing the captured Government,
  feasibility boolean, and sorted discrete failure classes. Reopen only after
  a Government or named feasibility-basis transition. Do not use cooldowns,
  raw scalar hashes, or Agenda/read-model eligibility.
- Keep one open episode per stable demand, preserve the existing ACCEPT
  intervention path, and emit no proposal pacing events.
- Raise persistence from V3 to V4, reject V3 explicitly, and validate basis
  ordering, references, event provenance, save/load, and replay.

### Alternatives

- count proposal events as F05 pacing signals;
- suppress every rejected demand permanently;
- add a time cooldown or expiry timer;
- hash treasury/headroom values to manufacture a reopening transition;
- accept the eight unexplained control differences as gameplay effects.

### Reason

The audit showed no non-proposal authoritative consumer for the eight branches;
the mismatch was an observer contract error. The existing intervention
feasibility result already exposes the named categorical conditions needed for a
deterministic reconsideration test without inventing a political score or
continuity meter. A persisted basis is required for replay-safe eligibility, so
the format bump is explicit rather than an implicit migration.

### Consequences

Repeated unchanged REJECT opportunities no longer reopen the same demand.
Government and feasibility transitions can produce a new episode, with the
transition visible in branch telemetry. The F05 historical 36-branch baseline
and official pacing event set remain unchanged. Gate 1F remains `NOT_READY`.

### Reversal cost

Medium-high. Reverting the amendment requires restoring V3 rejection behavior,
snapshot decoding, runtime provenance checks, and the lifecycle counterfactuals,
but does not alter the underlying intervention or territorial contracts.

## ADR-046 — GameBuilders P0 world-first presentation and content boundary

**Date:** 2026-08-26
**Status:** Accepted for `GAMEBUILDERS_PRODUCT_SURFACE_P0`

### Problem

The deployed P0 surface has real state changes but can still read as a
dashboard of time controls, crisis text and raw history. The player needs a
continuous map/world surface, a readable institutional direction, memorable
accumulated consequences and editable player-facing copy without weakening the
simulation authority boundary.

### Decision

- Make the political map the persistent primary playfield. Use compact HUD and
  contextual drawers/sheets for Agenda, Chronicle, decisions and details; mobile
  uses a map-first bottom-sheet composition.
- Add `Institutional Roadmap` as a read model of actual policy prerequisites,
  incompatibilities, institutional state and feasibility. It owns no unlock
  currency, focus tree or hidden timer.
- Map 2–4 State Project presentations only to existing Policy/Intervention
  lifecycles. Derive progress and completion from their real commitment,
  duration and event/history; leave a persistent trace only after real
  completion.
- Keep EventStore append-only and expose `ChronicleDigest` and
  `WorldVisualDelta` as deterministic presentation projections with source
  EventId provenance.
- Run a bounded PixiJS v8 + React spike. If it is not deadline-safe, keep one
  SVG production renderer and document the fallback; neither option owns a
  second clock or mutates WorldState.
- Provide a development-only stable-ID Content Studio with branch/variant
  search, edit, validation, local draft and JSON patch import/export. Static
  deployment does not claim direct GitHub writes.

### Alternatives

- keep the permanent card/dashboard composition;
- add generic research or political mana to make progression visible;
- fake project completion or scheduled visual events;
- migrate the simulation into a second game engine;
- expose raw EventStore churn as the primary Chronicle;
- let a static Site commit Content Studio edits directly.

### Reason

The selected path improves player-observable history while preserving the
accepted TypeScript simulation, ActionRecord, LandHex, EventStore and V8
persistence contracts. It also keeps visual and content work replaceable and
reviewable at the stable-ID boundary.

### Consequences

P0 acceptance requires hands-on Day 0/intermediate/late map evidence, mobile
game-world composition, policy/project/Chronicle/Content Studio checks, and a
documented renderer decision in addition to automated tests. Gate 1F remains
`NOT_READY`, V02 remains `NOT_STARTED`, and F05 successor runtime work is out
of scope.

### Reversal cost

Medium. The presentation selectors, registries and Content Studio can be
replaced independently, while reversing the map composition after deployment
would require another visual QA and Sites review.

## ADR-047 — P0 real world-stage renderer and spatial roadmap

**Date:** 2026-08-26
**Status:** Accepted for the authorized P0 world-stage rework

### Problem

The first P0 deployment had meaningful state projections but still presented a
flat SVG atlas, a list-like policy roadmap, and small glyphs that did not read
as a persistent miniature world. The rework requires a real renderer proof and
a spatial surface without moving authority into presentation code.

### Decision

- Benchmark Three.js + React Three Fiber and PixiJS v8 against the same frozen
  `WorldSceneModel` snapshot at desktop and mobile sizes.
- Select R3F for production because its orthographic scene provides actual
  depth, lighting, terrain height, settlement/project landmarks, and route
  movement inside the existing React surface.
- Keep `WorldState`/`EventStore` → `PresentationState` → `WorldSceneModel` as
  the only data path. Camera focus, zoom, drag, and transient emphasis remain
  presentation-local.
- Use an actual positioned policy node graph with prerequisite arrows and
  incompatibility links. Status is derived from current `PolicyState`; there is
  no research currency, focus schedule, or hidden progression timer.
- Keep Pixi benchmark code isolated under `src/benchmark/` and preserve the
  `PoliticalAtlas` import as a compatibility alias to the one R3F production
  implementation.

### Consequences

The production map now has real 2.5D objects and a mobile touch camera, while
the DOM retains on-demand facts and named labels for accessibility. The bundle
is larger than the Pixi comparison, so the benchmark and responsive QA are
part of the P0 evidence. No simulation, outcome, conflict writer, or V9
persistence work is introduced.

### Reversal cost

Medium. The renderer-neutral model and compatibility alias keep a future
renderer replacement bounded; the reference traceability matrix and deployed
visual QA would need to be repeated for another selection.

## ADR-048 — Semantic world-object and art-readability layer

### Status

Accepted for the authorized `GAMEBUILDERS_PRODUCT_SURFACE_P0` targeted rework.

### Problem

The accepted R3F world stage had correct factual layers but the same generic
project landmark geometry for food, civic, and industrial projects. Authored
places, faction/conflict activity, and route channels were spatially present
but not recognisable enough before reading a drawer or Chronicle.

### Decision

Keep R3F and `WorldSceneModel` as the production architecture. Add explicit
renderer-neutral object families and truth classifications; bind authored POIs
and institutional landmarks to existing scenario Region/LandHex identities;
project distinct code-native silhouettes for existing project lifecycle states;
and give factual route/faction/conflict channels distinct symbolic geometry.

### Consequences

The world can communicate place, development, controller change, conflict, and
channel activity before text without adding simulation entities, writers,
timers, resources, or persistence fields. Fresh exact-deployment screenshots
are required for product review because tests cannot establish visual
recognition alone.

### Reversal cost

Medium. The renderer-neutral families keep a future renderer bounded, but
rendered evidence and the semantic reference matrix would need to be repeated
if the object grammar were replaced.

## ADR-049 — Continuous terrain and ContentRegistry player-copy source

### Status

Accepted for the authorized P0 supplement.

### Problem

The logical LandHex topology was visually overrepresented as individual raised
hex tokens, especially on mobile. Title and briefing text also had an authoring
workflow in the repository but the runtime screens still read `PLAYER_COPY`
directly, preventing a complete stable-ID edit/preview path.

### Decision

Retain LandHex and R3F. Render a flat, continuous terrain surface from the same
topology, omit default hex outlines, and reveal them contextually for selection,
controller/faction, and conflict/front situations. Move every visible
title/briefing field behind stable ContentRegistry records; use Content Studio
for local draft editing, preview, diff, and JSON patch export. Treat baseline
prose as authoring-time generated/imported draft content and keep runtime LLM
independent.

### Consequences

The world reads as terrain with political objects above it rather than a board
of pillars. Mobile map width/height becomes an explicit acceptance measurement.
Screen copy can be revised without editing React components, while repository
review remains the authority for applying exported patches.
