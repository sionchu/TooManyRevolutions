# Codex Development Log

Purpose:

- record how Codex contributed,
- preserve implementation decisions,
- support competition presentation,
- separate AI-generated implementation from human product decisions.

Do not log hidden model reasoning.
Log observable tasks, outputs, tests and human decisions.

---

## Entry Template

### YYYY-MM-DD — Task XXX — Title

**Model/config**

- model:
- reasoning level if relevant:

**Goal**
-

**Docs read**

- `AGENTS.md`
- `docs/GDD.md`
- ...

**Codex work**

- files created/changed:
- tests added:
- commands run:

**Human decisions**

- accepted:
- rejected:
- changed:

**Verification**

- tests:
- build:
- browser:
- playtest:

**Follow-up**
-

---

## Initial project note — 2026-08-21

The project is a greenfield reboot.

Human design decisions already locked:

- player = state continuity
- victory = order consolidation
- defeat = state dissolution
- regime change continues the run
- deterministic simulation is authoritative
- LLMs propose actions only
- politics uses support/radicalism/organization
- ideology diffuses across causal world connections
- WebGL is initial stable baseline
- responsive desktop/tablet/mobile required
- working title = 《내 왕국에 혁명이 너무 많다》

---

### 2026-08-21 — Tasks T001–T005 — Gate 0 foundation

**Model/config**

- model: Codex (desktop)
- reasoning level if relevant: not recorded

**Goal**

- Establish the greenfield Vite/React/TypeScript foundation and the renderer-independent simulation primitives required by Gate 0.
- Keep the implementation strictly below Gate 1 gameplay.

**Docs read**

- `AGENTS.md`
- `CODEX_KICKOFF.md`
- `docs/GDD.md`
- `docs/ARCHITECTURE.md`
- `docs/BACKLOG.md`
- `docs/QA_PLAYTEST.md`
- `docs/DECISIONS.md`
- `docs/CODEX_DEVLOG.md`

**Codex work**

- files created/changed:
  - Vite/React/TypeScript boot files and responsive foundation styles
  - Vitest, ESLint flat config, Prettier, TypeScript project references, and pnpm lock/config files
  - `src/sim/core/` with seeded RNG, simulation clock, tick skeleton, serialization types, and invariants
  - `src/sim/events/` with serializable events, `causeIds`, and causal-reference validating event store
  - `src/sim/state/` with base Country, Region, Ideology, Faction, Policy, Conflict, Run, World, and ID types
  - deterministic unit tests for RNG, clock, ticks, events, serialization, and invariants
  - `docs/BACKLOG.md` status for T001–T005
- tests added: 13 unit tests across 5 test files
- commands run:
  - `pnpm install`
  - `pnpm test`
  - `pnpm run typecheck`
  - `pnpm run lint`
  - `pnpm run format:write`
  - `pnpm run format`
  - `pnpm run build`
  - `pnpm dev --host 127.0.0.1`

**Human decisions**

- accepted: Gate 0 only; the UI is a boot scaffold and the simulation has no Gate 1 systems yet.
- rejected: final gameplay, final art, R3F world rendering, AI agents, diplomacy, rebellion, WebGPU, and HTML-in-Canvas.
- changed: none; the implementation follows the existing architecture and product decisions.

**Verification**

- tests: `pnpm test` — 5 files passed, 13 tests passed.
- typecheck: `pnpm run typecheck` — passed.
- lint: `pnpm run lint` — passed.
- format: `pnpm run format` — all matched files use Prettier code style.
- build: `pnpm run build` — Vite production build passed.
- boot: Vite served `http://127.0.0.1:5173/`; HTTP check returned `200` and the expected `Fantasy State Simulator` title.

**Follow-up**

- Smallest next Gate 1 task: `T010 Tick pipeline` — define and document the authoritative system order. Do not execute it as part of this kickoff.

---

### 2026-08-21 — Pre-Gate 1 contracts — Domain boundary lock

**Model/config**

- model: Codex (desktop)
- reasoning level if relevant: not recorded

**Goal**

- Resolve the eight expensive-to-reverse domain contracts identified by the Gate 0 architecture review.
- Do not implement T010 or any Gate 1 economy, ideology diffusion, faction, diplomacy, conflict, AI, or rendering system.

**Docs read**

- `AGENTS.md`
- `docs/GDD.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `docs/BACKLOG.md`
- `docs/GATE0_ARCHITECTURE_REVIEW.md`
- `docs/QA_PLAYTEST.md`
- `docs/CODEX_DEVLOG.md`

**Codex work**

- files created/changed:
  - `docs/PRE_GATE1_CONTRACTS.md` as the compact T010–T025 implementation contract
  - architecture, decision log, and backlog contract updates
  - static `ScenarioDefinition`, Government, action/step, run outcome, and map-contact types
  - exclusive Region controller, derived regime classification contract, and scenario-based initialization
  - deterministic event sequence/ID contract and append-only global action envelope
  - boundary invariants and tests for scenario-to-run initialization and event ordering
- tests added: ScenarioDefinition initialization boundary test; event global-order test
- commands run:
  - `pnpm test`
  - `pnpm run typecheck`
  - `pnpm run lint`
  - `pnpm run build`
  - `pnpm run format`
  - targeted `prettier --write` for three new/changed TypeScript files

**Human decisions**

- accepted: static scenario ownership, Region as territorial-control source, CountryId continuity, derived regime classification, scenario-owned win/loss criteria, metric ranges, atomic action/event contract, and daily tick order.
- rejected: implementation of T010 and all Gate 1 gameplay systems in this task.
- changed: player/heuristic/LLM inputs now share one documented ordered contract rather than separate source-specific logs.

**Verification**

- tests: `pnpm test` — 6 files passed, 15 tests passed.
- typecheck: `pnpm run typecheck` — passed.
- lint: `pnpm run lint` — passed.
- build: `pnpm run build` — Vite production build passed.
- format: an initial check found three TypeScript formatting differences; targeted Prettier normalization was applied and the final `pnpm run format` check passed.
- browser/playtest: not run; this task changed no gameplay or renderer behavior.

**Follow-up**

- T010 is now the smallest authorized next task: implement the contract's terminal gate, step boundary, phase orchestration, and atomic commit skeleton only.

---

### 2026-08-21 — T010 — Authoritative tick pipeline

**Model/config**

- model: Codex (desktop)
- reasoning level if relevant: not recorded

**Goal**

- Implement only the deterministic `SimulationStep` pipeline. Keep all Gate 1 gameplay systems as explicit no-op extension hooks.

**Docs read**

- `AGENTS.md`
- `docs/GDD.md`
- `docs/ARCHITECTURE.md`
- `docs/PRE_GATE1_CONTRACTS.md`
- `docs/BACKLOG.md`
- `docs/DECISIONS.md`
- `docs/CODEX_DEVLOG.md`

**Codex work**

- added `SimulationStepInput`, `SimulationStepResult`, the single `SIMULATION_PHASE_ORDER` tuple, phase context/result types, and future-system hook types in `src/sim/core/step.ts`
- implemented `runSimulationStep` in `src/sim/core/tick.ts` with accepted-action ordering checks, immutable action-log append, deterministic phase orchestration, built-in one-day `closeDay`, deterministic `TICK_ADVANCED` event emission, event-sequence checks, and terminal no-op behavior
- added deterministic pipeline tests in `src/sim/core/pipeline.test.ts`; updated the Gate 0 tick tests to consume the new result shape
- updated `docs/ARCHITECTURE.md`, `docs/PRE_GATE1_CONTRACTS.md`, and `docs/BACKLOG.md` with the realized T010 boundary and phase hooks

**Human decisions**

- accepted: `SIMULATION_PHASE_ORDER` is the only phase-order source of truth; gameplay systems enter through phase hooks; only `closeDay` owns authoritative clock advancement; terminal steps return the unchanged world with no events
- no new expensive architecture decision was required; existing ADR-011–ADR-016 contracts remain authoritative
- rejected: economy, resources, policies, ideology diffusion, contact behavior, faction behavior, instability, diplomacy, conflict, victory/defeat evaluation rules, AI, rendering, and scheduler work

**Verification**

- tests: `pnpm test` — 7 files passed, 24 tests passed
- typecheck: `pnpm run typecheck` — passed
- lint: `pnpm run lint` — passed
- format: `pnpm run format` — all matched files use Prettier code style
- build: `pnpm run build` — Vite production build passed
- browser/playtest: not run; T010 changed no gameplay rules or rendering

**Follow-up**

- T011 Country/region basic economy is the next smallest task. Do not begin it as part of T010.

---

### 2026-08-21 — T011 — Country / Region Basic Economy

**Model/config**

- model: Codex (desktop)
- reasoning level if relevant: not recorded

**Goal**

- Add the smallest deterministic economic substrate for regional production, local resource pressure, controlled-region national aggregation, and treasury flow.
- Do not implement policy effects, ideology, factions, instability, diplomacy, conflict, AI, rendering, or scheduler behavior.

**Docs read**

- `AGENTS.md`
- `docs/GDD.md`
- `docs/ARCHITECTURE.md`
- `docs/PRE_GATE1_CONTRACTS.md`
- `docs/BACKLOG.md`
- `docs/DECISIONS.md`
- `docs/CODEX_DEVLOG.md`

**Codex work**

- added serializable Region resource capacity, actual production, demand, and local stock fields; added Country daily income/expenditure flow fields
- implemented `src/sim/systems/economy.ts` and `src/sim/systems/resources.ts` as the default `economy` and `resources` hooks inside `runSimulationStep`
- implemented controlled-Region production aggregation, one-to-one abstract production income, treasury settlement, local stock consumption, and demand-weighted scarcity
- added deterministic economic events: `RESOURCE_PRODUCED`, `RESOURCE_SHORTAGE_CHANGED`, `TREASURY_CHANGED`, and `NATIONAL_PRODUCTION_CHANGED`
- added a reusable three-region economy scenario fixture and 10 T011 tests
- updated `docs/ARCHITECTURE.md`, `docs/BACKLOG.md`, `docs/DECISIONS.md`, and this devlog

**Human decisions**

- accepted: capacity-based deterministic output; no prices, wages, firms, markets, policy modifiers, national resource stock, or randomness in T011
- accepted: `Region.controller` is the only source for national production/income aggregation; ownerCountryId is not used for aggregation
- accepted: negative treasury is valid and solvency/treasury pressure remain derived observations, not terminal rules
- rejected: all T012+ political, diplomatic, conflict, AI, UI, and rendering systems

**Verification**

- tests: `pnpm test` — 8 files passed, 34 tests passed
- typecheck: `pnpm run typecheck` — passed
- lint: `pnpm run lint` — passed
- format: `pnpm run format` — all matched files use Prettier code style
- build: `pnpm run build` — Vite production build passed
- browser/playtest: not run; this task changed no rendering/UI

**Follow-up**

- T012 Policy rule engine is the next smallest task. Do not begin it as part of T011.

---

### 2026-08-21 — T012 — Policy rule engine

**Model/config**

- model: Codex (desktop)
- reasoning level if relevant: not recorded

**Goal**

- Implement only the deterministic, data-driven policy/institution rule engine inside the existing authoritative simulation step.
- Keep ideology, factions, instability, diplomacy, conflict, AI, rendering, and downstream economic effects out of T012.

**Docs read**

- `AGENTS.md`
- `docs/GDD.md`
- `docs/ARCHITECTURE.md`
- `docs/PRE_GATE1_CONTRACTS.md`
- `docs/BACKLOG.md`
- `docs/DECISIONS.md`
- `docs/CODEX_DEVLOG.md`

**Codex work**

- files created/changed:
  - typed declarative `PolicyDefinition`, `InstitutionalRuleState`, prerequisites, and immutable `PolicyState` extensions in `src/sim/state/policy.ts`
  - bounded `ENACT_POLICY` ActionRecord decoder in `src/sim/state/action.ts`
  - scenario-bound `resolveValidatedActions` policy hook in `src/sim/systems/policy.ts`
  - deterministic `POLICY_ENACTED`, `POLICY_REJECTED`, and `INSTITUTION_RULE_CHANGED` events
  - derived regime classification hook in `src/sim/state/government.ts`
  - small reusable policy ScenarioDefinition/catalog fixture in `src/sim/state/policyFixture.ts`
  - policy state cloning and institutional-rule invariants
  - `src/sim/systems/policy.test.ts` with 13 T012 tests
  - architecture, pre-Gate-1 contract, backlog, decision log, and devlog updates
- tests added: 13 policy rule engine tests
- commands run: initial `pnpm test` exposed one test matcher issue; implementation was unchanged and the matcher was corrected

**Human decisions**

- accepted: scenario-bound policy hook injection preserves T010's step API while keeping static catalog data out of WorldState
- accepted: one canonical resolved institutional rule object; incompatible active policies are rejected rather than silently replaced
- accepted: regime labels remain pure derived history/presentation data
- rejected: policy costs, delays, faction resistance, ideology changes, economy modifiers, instability, diplomacy, conflict, AI, and rendering

**Verification**

- tests: `pnpm test` — 9 files passed, 47 tests passed
- typecheck: `pnpm run typecheck` — passed
- lint: `pnpm run lint` — passed
- format: `pnpm run format` — all matched files use Prettier code style
- build: `pnpm run build` — Vite production build passed
- browser/playtest: not run; T012 changes no rendering/UI behavior

**Follow-up**

- T013 Ideology state is the next smallest task. Do not begin it as part of T012.

---

### 2026-08-21 — T013 — Ideology state substrate

**Model/config**

- model: Codex (desktop)
- reasoning level if relevant: not recorded

**Goal**

- Implement only the deterministic political-state substrate for ideology definitions, regional state, derived country aggregation, bounded adjustments, and causal events.
- Keep cross-region diffusion, contact behavior, foreign influence, faction behavior, instability, diplomacy, conflict, AI, and rendering out of T013.

**Docs read completely**

- `AGENTS.md`
- `docs/GDD.md`
- `docs/ARCHITECTURE.md`
- `docs/PRE_GATE1_CONTRACTS.md`
- `docs/BACKLOG.md`
- `docs/DECISIONS.md`
- `docs/CODEX_DEVLOG.md`

**Codex work**

- files created/changed:
  - explicit static `IdeologyDefinition` metadata and four-ideology fixture catalog
  - immutable `IdeologyAdjustment`, dimension-specific bounded update helpers, and read-only susceptibility context
  - population-weighted `deriveCountryIdeology` and stable `deriveDominantTendencies`; no persisted country aggregate
  - initial ScenarioDefinition/Region ideology catalog coverage validation
  - `ideologyDiffusion` phase-bound adjustment hook without diffusion logic
  - `IDEOLOGY_SUPPORT_CHANGED`, `IDEOLOGY_RADICALISM_CHANGED`, and `IDEOLOGY_ORGANIZATION_CHANGED` event types
  - `src/sim/systems/ideologyState.test.ts` with 20 T013 tests
  - architecture, backlog, decision log, and devlog updates

**Human decisions**

- accepted: ideology support is non-exclusive overlapping sympathy; support, radicalism, and organization remain separate 0–1 dimensions
- accepted: country ideology is derived from currently country-controlled, population-weighted Regions and is not stored in WorldState
- accepted: adjustment deltas are finite, immutable, bounded, and clamp to 0–1; unchanged results do not emit ideology events
- accepted: adjustment causes must reference events already emitted in the current step buffer
- rejected: diffusion, contact graph behavior, policy-to-ideology effects, faction/foreign behavior, instability, diplomacy, conflict, AI, and rendering

**Verification**

- tests: `pnpm test` — 10 files passed, 67 tests passed
- typecheck: `pnpm run typecheck` — passed
- lint: `pnpm run lint` — passed
- format: `pnpm run format` — all matched files use Prettier code style
- build: `pnpm run build` — Vite production build passed
- browser/playtest: not run; T013 changes no rendering/UI behavior

**Follow-up**

- T014 Contact graph is the next smallest task. Do not begin it as part of T013.

---

### 2026-08-21 — T015 — Ideology diffusion

**Model/config**

- model: Codex (desktop)
- reasoning level if relevant: not recorded

**Goal**

- Implement only deterministic ideology-support diffusion through the T014 explicit directed contact graph.
- Keep faction decisions, instability, diplomacy, foreign AI, conflict, LLM, rendering, and victory/defeat rules out of T015.

**Docs read completely**

- `AGENTS.md`
- `docs/GDD.md`
- `docs/ARCHITECTURE.md`
- `docs/PRE_GATE1_CONTRACTS.md`
- `docs/BACKLOG.md`
- `docs/DECISIONS.md`
- `docs/CODEX_DEVLOG.md`

**Codex work**

- added `IDEOLOGY_DIFFUSED` to the existing deterministic event vocabulary
- added a reusable multi-day ideology/contact fixture with Merchant Republic Port → Player Port → Player Capital and an unconnected mine
- implemented `src/sim/systems/ideologyDiffusion.ts` with centralized provisional channel weights, bounded rate/config validation, T013 susceptibility-hook usage, directed effective-strength reads, snapshot-based contribution aggregation, simultaneous support updates, and immutable phase-hook integration
- preserved support/radicalism/organization separation and non-exclusive support; no country-global ideology modifier or controller-based suppression of Region diffusion
- recorded route/source/channel/strength/susceptibility/support/delta data in `IDEOLOGY_DIFFUSED` and aggregate `IDEOLOGY_SUPPORT_CHANGED` payloads; support events cause only already emitted same-step diffusion events
- added `src/sim/systems/ideologyDiffusion.test.ts` with 26 deterministic tests, including directed/internal routes, disabled/no-edge/reverse behavior, multi-source/order invariance, no same-tick cascade, multi-day propagation, bounds, event causality, controller handling, and immutability
- updated `docs/ARCHITECTURE.md`, `docs/BACKLOG.md`, `docs/DECISIONS.md`, and this devlog

**Human decisions**

- accepted: `pressure = sourceSupport × effectiveStrength × channelWeight × destinationSusceptibility`, followed by `delta = diffusionRate × pressure × (1 - destinationSupport)` and final 0–1 clamping
- accepted: phase-start snapshot and simultaneous aggregate application; A → B → C advances one hop per day
- accepted: provisional centralized weights `border=0.8`, `trade=1.0`, `migration=1.1`, `information=1.2`, with default rate `0.1`
- accepted: support-only diffusion; radicalism, organization, normalization, and counter-subtraction remain out of scope
- accepted: current step/event buffer is the only available causal lookup; prior-tick event references are explicitly deferred to T024 rather than fabricated
- rejected: scarcity/press/labor/faction/war/refugee/prestige modifiers, dynamic edge mutation, faction/foreign AI action, instability, diplomacy, conflict, LLM, rendering, and victory/defeat behavior

**Verification**

- tests: `pnpm test` — 12 files passed, 111 tests passed
- typecheck: `pnpm run typecheck` — passed
- lint: `pnpm run lint` — passed
- format: `pnpm run format` — passed after `pnpm run format:write`
- build: `pnpm run build` — Vite production build passed
- browser/playtest: not run; T015 changes no rendering/UI behavior

**Follow-up**

- T016 Faction pressure is the next smallest task. Do not begin it as part of T015.

---

### 2026-08-21 — T014 — Contact graph

**Model/config**

- model: Codex (desktop)
- reasoning level if relevant: not recorded

**Goal**

- Implement only the deterministic causal Region contact graph that later T015 diffusion can consume.
- Keep ideology changes, foreign influence effects, faction behavior, rebellion, instability, diplomacy decisions, conflict, AI, rendering, and victory/defeat behavior out of T014.

**Docs read completely**

- `AGENTS.md`
- `docs/GDD.md`
- `docs/ARCHITECTURE.md`
- `docs/PRE_GATE1_CONTRACTS.md`
- `docs/BACKLOG.md`
- `docs/DECISIONS.md`
- `docs/CODEX_DEVLOG.md`

**Codex work**

- files created/changed:
  - explicit directed `ContactEdgeDefinition` topology and four-channel initial vocabulary in `src/sim/state/scenario.ts`
  - sparse `ContactEdgeRuntimeState` overlay type and `WorldState.contactEdgeStates`
  - deterministic contact graph selectors and controller-derived country projection in `src/sim/systems/contactGraph.ts`
  - scenario topology validation for duplicate IDs, endpoint/node references, channels, and base strength
  - reusable seven-region player/merchant-republic/absolute-monarchy contact fixture
  - `src/sim/systems/contactGraph.test.ts` with 18 T014 tests
  - architecture, pre-Gate-1 contract, backlog, decision log, and devlog updates

**Human decisions**

- accepted: each contact edge is directed; bidirectional routes use two explicit records
- accepted: static topology belongs to ScenarioDefinition; only sparse runtime overlays belong to WorldState
- accepted: missing runtime state means enabled with multiplier 1; effective strength is `clamp01(baseStrength * multiplier)` and disabled is 0
- accepted: country contacts are derived from current Region.controller and exclude internal, uncontrolled, and faction-controlled endpoints from foreign projection
- accepted: no runtime mutation action/phase or contact events in T014
- rejected: ideology diffusion, contact-caused political changes, foreign influence effects, faction/AI behavior, rebellion, instability, diplomacy decisions, conflict, and rendering

**Verification**

- tests: `pnpm test` — 11 files passed, 85 tests passed
- typecheck: `pnpm run typecheck` — passed
- lint: `pnpm run lint` — passed
- format: `pnpm run format` — all matched files use Prettier code style
- build: `pnpm run build` — Vite production build passed
- browser/playtest: not run; T014 changes no rendering/UI behavior

**Follow-up**

- T015 Ideology diffusion is the next smallest task. Do not begin it as part of T014.

---

### 2026-08-21 — T015 — Diffusion fun checkpoint

**Model/config**

- model: Codex (desktop)
- reasoning level if relevant: not recorded

**Goal**

- Run a headless, inspection-only diffusion scenario before faction behavior.
- Assess spatial legibility, pacing, channel/source visibility, isolation, feedback, and route importance without changing T015 gameplay constants.

**Docs read completely**

- `AGENTS.md`
- `docs/GDD.md`
- `docs/ARCHITECTURE.md`
- `docs/QA_PLAYTEST.md`
- `docs/BACKLOG.md`
- `docs/CODEX_DEVLOG.md`

**Codex work**

- added `src/sim/inspection/t015DiffusionInspection.ts`
- added `src/sim/inspection/t015DiffusionInspection.test.ts`
- added the `pnpm run inspect:t015` command
- reused the existing T015 simulation, directed contact graph, event payloads, and deterministic step boundary
- inspected Day 0, 10, 30, 60, 120, and 240, including meaningful diffusion events and rate sensitivity at `0.05`, `0.10`, and `0.15`
- created `docs/T015_DIFFUSION_FUN_CHECK.md`

**Human decisions**

- accepted: classify the current behavior as `TOO_FAST`; do not tune it during this diagnostic task
- accepted: keep `diffusionRate=0.10`, the T015 formula, and channel weights unchanged
- accepted: keep the unconnected mine as the isolation control
- rejected: T016 faction pressure, new gameplay systems, and any formula/balance change

**Verification**

- inspection harness: `pnpm run inspect:t015` — passed and printed reproducible checkpoints/events
- tests: `pnpm test` — 13 files passed, 112 tests passed
- typecheck: `pnpm run typecheck` — passed
- lint: `pnpm run lint` — passed
- format: `pnpm run format` — all matched files use Prettier code style
- build: `pnpm run build` — Vite production build passed
- browser/playtest: not run; this task adds no rendering/UI behavior

**Follow-up**

- Do not begin T016 from this checkpoint. Treat diffusion pacing/saturation as an explicit balance risk for a later approved task.

---

### 2026-08-21 — T015B — Diffusion stabilization

**Model/config**

- model: Codex (desktop)
- reasoning level if relevant: not recorded

**Goal**

- Compare T015's absolute-source formula with the support-gradient candidate on the exact T015 inspection scenario.
- Correct long-run saturation without adding zero-sum ideology competition or new gameplay systems.

**Docs read completely**

- `AGENTS.md`
- `docs/GDD.md`
- `docs/ARCHITECTURE.md`
- `docs/QA_PLAYTEST.md`
- `docs/T015_DIFFUSION_FUN_CHECK.md`
- `docs/BACKLOG.md`
- `docs/CODEX_DEVLOG.md`

**Codex work**

- added explicit formula selection to the existing T015 diffusion hook; `supportGradient` is now the production default and `absoluteSource` is inspection-only
- recorded `ideologyGradient` in route contribution payloads for causal reconstruction
- selected production `diffusionRate=0.05` after comparing `0.05`, `0.10`, and `0.15`
- added `src/sim/inspection/t015bDiffusionStabilization.ts` and its reproducible `pnpm run inspect:t015b` harness
- added gradient invariants for equal support, destination-above-source, long-run bounds, and retained existing direction/order/isolation/dimension tests
- updated architecture, backlog, decision log, T015 fun-check, and this devlog

**Human decisions**

- accepted: `ideologyGradient = max(0, sourceSupport - destinationSupport)`
- accepted: production default rate `0.05`, the slowest tested rate with visible Day 1 direct and Day 10–30 inland movement
- accepted: preserve directed edges, snapshot/simultaneous update, non-exclusive support, support-only writing, radicalism/organization separation, and isolated-region behavior
- rejected: normalization, counter-subtraction, decay, repression, propaganda, ideology stereotypes, faction behavior, instability, diplomacy, AI, rebellion, and UI

**Verification**

- A/B harness: `pnpm run inspect:t015b` — passed; all six checkpoints and all seven inspection regions printed for A and all three B rates
- targeted diffusion tests passed after updating the reverse-edge fixture expectation for gradient semantics
- tests: `pnpm test` — 14 files passed, 116 tests passed
- typecheck: `pnpm run typecheck` — passed
- lint: `pnpm run lint` — passed
- format: `pnpm run format` — all matched files use Prettier code style
- build: `pnpm run build` — Vite production build passed
- browser/playtest: not run; this task adds no rendering/UI behavior

**Follow-up**

- T016 may begin from the diffusion saturation standpoint, but was not started in this task. Faction pressure must be tested against the new gradient source/destination contract.

---

### 2026-08-21 — T015C — Political time-scale calibration

**Goal**

- Keep T010's one-day authoritative tick and T015B's support-gradient formula/rate.
- Compare daily, weekly, and monthly political update cadence on the same T015B scenario before faction behavior.
- Choose a cadence that keeps contact regions legible while leaving multi-year political history and future intervention systems meaningful.

**Docs read completely**

- `AGENTS.md`
- `docs/GDD.md`
- `docs/ARCHITECTURE.md`
- `docs/QA_PLAYTEST.md`
- `docs/T015_DIFFUSION_FUN_CHECK.md`
- `docs/BACKLOG.md`
- `docs/DECISIONS.md`
- `docs/CODEX_DEVLOG.md`

**Codex work**

- added reusable `PoliticalCadence` and `shouldRunPoliticalUpdate(nextTick, nextDate, cadence)` in `src/sim/core/politicalCadence.ts`
- kept the ideology phase in the daily pipeline, with deterministic no-op behavior on non-boundary days
- added `cadence` to `IdeologyDiffusionConfig` and selected production default `monthly`
- preserved `supportGradient` and `diffusionRate = 0.05`; explicitly pinned the historical T015/T015B inspection harnesses to `daily`
- added the ten-year `pnpm run inspect:t015c` harness with daily/weekly/monthly tables, Korean calendar dates, and event samples
- added cadence boundary, non-update, update, determinism, speed-independence, terminal, isolation, and daily-tick tests
- updated architecture, backlog, decision log, T015 report, and added `docs/T015C_TIME_SCALE_CHECK.md`

**Human decisions**

- accepted: one authoritative tick remains one day; calendar remains 360 days/year and 30 days/month
- accepted: production political cadence is `monthly`
- accepted: non-boundary days invoke the phase as a no-op and do not create ideology events
- accepted: cadence is simulation-time based and independent of renderer/wall clock speed
- retained: gradient formula, rate `0.05`, directed contacts, phase-start snapshot, simultaneous update, non-exclusive support, support-only writing, and radicalism/organization separation
- rejected: changing formula/rate, changing daily tick, coupling cadence to renderer scheduler, faction effects, propaganda, repression, instability, ideology competition, diplomacy, AI, and T016

**Observed result**

- daily: Year 1 player capital republican support `0.8033`; Year 2 farmland `0.8066` — too fast for the intended political timescale
- weekly: Year 1 player capital `0.3270`; Year 3 farmland `0.4085` — readable but still materially faster than the target
- monthly: Year 1 player port `0.3141`, capital `0.0617`; Year 2 capital `0.1482`; Year 5 farmland `0.1311`; Year 10 capital `0.5782`
- monthly first boundary: tick 30 / 왕력 1년 2월 1일; port republican support `0.0500 → 0.0803`, player-border monarchy `0.0100 → 0.0256`
- mine stayed `0.0100 / 0.0100` through Year 10 for all cadence variants

**Verification**

- T015C harness: `pnpm run inspect:t015c` — passed; all three cadence runs printed all seven regions at all seven historical checkpoints
- tests: `pnpm test` — 16 files passed, 124 tests passed
- typecheck: `pnpm run typecheck` — passed
- lint: `pnpm run lint` — passed
- format: `pnpm run format` — all matched files use Prettier code style
- build: `pnpm run build` — Vite production build passed
- browser/playtest: not run; this task adds no rendering/UI behavior

**Follow-up**

- Do not begin T016. The next approved task should be chosen separately after this cadence contract is reviewed.

---

### 2026-08-22 — T016 — Faction pressure

**Goal**

- T015C의 monthly political boundary에서 Faction이 현재 WorldState를 읽고 결정론적인 정치 행동 proposal을 선택하도록 한다.
- proposal을 player/LLM과 같은 ActionRecord intake에 연결하되, T016A 및 T017 이후의 결과 시스템은 시작하지 않는다.

**Docs read completely**

- `AGENTS.md`
- `docs/GDD.md`
- `docs/ARCHITECTURE.md`
- `docs/BACKLOG.md`
- `docs/DECISIONS.md`
- `docs/CODEX_DEVLOG.md`
- `docs/QA_PLAYTEST.md` (simulation test boundary 확인)

**Codex work**

- added `ActionProposal`, deterministic action IDs, and common `acceptActionProposal(s)` intake helpers in `src/sim/state/action.ts`
- added the bounded T016 vocabulary: `LOBBY`, `BARGAIN`, `ORGANIZE`, `FUND_MOVEMENT`, `ACCEPT`, `WAIT`
- added `src/sim/systems/factionPressure.ts`
  - compact observation of faction/country/Region ideology/institution context
  - explicit rule-ordered heuristic with no RNG/LLM/story progression
  - reusable monthly `PoliticalCadence` boundary
  - stable `FactionId` proposal ordering
  - accepted action resolution limited to `Faction.currentStrategy`
- connected the phase to T010's default `factionPressure` hook and extended `SimulationStepResult` with read-only `actionProposals`
- added `FACTION_STRATEGY_CHANGED`; unchanged strategies do not repeat the event
- added `src/sim/systems/factionPressure.test.ts` with deterministic, cadence, intake, order, terminal, immutability, policy-context, organization-separation, and scope-guard tests
- updated `docs/ARCHITECTURE.md`, `docs/BACKLOG.md`, `docs/DECISIONS.md`, and added `docs/T016_FACTION_PRESSURE_CHECK.md`

**Human decisions**

- accepted: new heuristic decisions run at the existing production `monthly` boundary while the authoritative tick remains one day
- accepted: heuristic output is a phase result proposal, not an implicit WorldState/action-log mutation; accepted proposals use the common ActionRecord envelope and `source: "heuristic"`
- accepted: only accepted faction actions can change `Faction.currentStrategy`; T016 does not consume faction resources or change organization/influence/grievance
- accepted: Region ideology organization and Faction organization are separate signals and are never mirrored
- rejected: T016A agenda/read model, instability, coup/revolution/rebellion/civil war/strike resolution, diplomacy/foreign AI, propaganda/repression, UI/rendering, and balance tuning

**Inspection**

- three-faction headless fixture produced stable differentiated intentions at the first monthly checkpoint: merchant `FUND_MOVEMENT`, nobility `LOBBY`, workers `ORGANIZE`
- making labor organization illegal removes `ORGANIZE` from the available action set without scheduling a replacement event
- reducing merchant resources changes the selected action from `FUND_MOVEMENT` to `ORGANIZE`

**Verification**

- targeted faction tests: 16 tests passed after implementation
- full `pnpm test` — 17 files passed, 140 tests passed
- `pnpm run typecheck` — passed
- `pnpm run lint` — passed
- `pnpm run format` — all matched files use Prettier code style
- `pnpm run build` — Vite production build passed
- browser/playtest: not run; T016 adds no rendering/UI behavior

**Follow-up**

- T016A remains the next separate task; do not start it in this change.

---

### 2026-08-22 — T016A — Pressure / Agenda read model

**Goal**

- T011 fiscal flow, T016 faction observation, T015 directed diffusion evidence를 현재 플레이어가 읽을 수 있는 0–4개 national agenda로 파생한다.
- agenda를 authoritative state, quest sequence, future crisis scheduler로 만들지 않는다.

**Docs read completely**

- `AGENTS.md`
- `docs/GDD.md`
- `docs/ARCHITECTURE.md`
- `docs/QA_PLAYTEST.md`
- `docs/BACKLOG.md`
- `docs/CODEX_DEVLOG.md`

**Codex work**

- added renderer-independent `src/sim/readModels/agenda.ts`
  - typed `PrimaryAgenda`, `AgendaCause`, trend/band/kind/intervention contracts
  - centralized bounded detector config and deterministic ranking/cap
  - fiscal detector from treasury/daily income/daily expenditure
  - faction detector from the existing T016 `FactionObservation`
  - foreign ideological detector requiring a live directed edge and actual diffusion evidence
  - bounded recent event evidence with existing-only `causeEventIds`
- kept agenda entirely outside `WorldState` and `RunState`; selector emits no GameEvent and writes no state
- kept `Faction.organization` separate from Region ideology organization; currentStrategy alone is not a trigger
- returned only currently honest intervention categories: `policy` and `noAction`
- added `src/sim/inspection/t016aAgendaInspection.ts` and reproducible headless output with a pressure-removal counterexample
- added 25 read-model tests plus T016 next-tick proposal regression coverage
- updated architecture, backlog, QA, decision log, and added `docs/T016A_AGENDA_CHECK.md`

**Human decisions**

- accepted: agenda is a derived current-pressure read model, never authoritative story/quest state
- accepted: current implementation supports 0–4 agendas; 2–4 is a target only when pressure is sufficient
- accepted: trend is `unknown` without supplied temporal evidence and is never inferred from current severity
- accepted: foreign pressure requires current directed contact/controller state plus actual diffusion event evidence
- accepted: unavailable treasury/diplomacy/military/repression/concession capabilities are not advertised
- rejected: T016B intervention capacity, policy cost/cooldown, instability, ideology competition, repression, diplomacy, AI, rebellion, conflict, victory/defeat, UI, and rendering

**Inspection**

- Day 1 harness produced four agendas: faction political pressure, absolute-monarchy border ideological pressure, merchant-republic port ideological pressure, and fiscal pressure
- all four used actual names and rising event evidence; cause IDs were drawn from the same step's events
- after positive treasury, low faction pressure, and disabled foreign inbound routes, the same selector returned zero agendas

**Verification**

- targeted agenda tests: 25 passed
- T016A inspection harness: passed and printed reproducible topology, agenda table, event evidence, and counterexample
- full `pnpm test`: 19 files passed, 166 tests passed
- `pnpm run typecheck`: passed
- `pnpm run lint`: passed
- `pnpm run format`: all matched files use Prettier code style
- `pnpm run build`: Vite production build passed
- browser/playtest: not run; T016A adds no rendering/UI behavior

**Follow-up**

- T016B Intervention Capacity remains the next separate task; T017 Instability was not started.

### 2026-08-22 — T016B — Intervention Capacity & Feasibility

**Scope**

- T016B only. T017/T017A/T017B and instability, ideology competition, repression, diplomacy, military, rebellion, UI, and rendering remain untouched.
- Existing T010–T016A ActionRecord, fixed phase order, event ordering, economy ownership, and terminal-run contracts were preserved.

**Implementation**

- added static `ScenarioDefinition.interventionCatalog` and mutable `WorldState.interventionCommitments`
- added typed `InterventionDefinition`, `InterventionCommitment`, pure feasibility result/reasons, and derived committed load/headroom/overload queries
- added bounded `START_INTERVENTION` action decoder/proposal helper
- added sequence-ordered policy/intervention action dispatcher so same-tick actions share one global order
- added `applyScheduledEffects` completion hook with explicit day-tick boundary and no daily progress spam
- kept `Country.treasury` under the economy writer; same-tick accepted intervention cost is reserved during resolution and settled once in economy with valid causes
- added deterministic `INTERVENTION_STARTED`, `INTERVENTION_REJECTED`, and `INTERVENTION_COMPLETED` events
- added three inspection-only intervention definitions: short, long, and legislature prerequisite fixture
- added `t016b` inspection harness for Day 0/1/2/181 metrics, feasibility reasons, event order, release, and capacity-overload counterexample

**Locked decisions**

- stateCapacity is not consumable currency; headroom and overload are derived from active commitment load
- duration uses one authoritative day tick; start tick is first occupied day and completion runs before the next tick's action feasibility
- prerequisites reuse existing PolicyState/institutionalRules; no politicalPower or policy points were added
- T016A remains a pure read model and does not advertise the fixture-only administrative category as a player capability

**Final verification**

- targeted T016B tests: 44 passed
- full `pnpm test`: 21 files passed, 210 tests passed
- `pnpm run typecheck`: passed
- `pnpm run lint`: passed
- `pnpm run format:write`: passed
- `pnpm run format`: passed
- `pnpm run build`: Vite production build passed

**Follow-up**

- T017 Instability remains the next smallest gameplay task; do not start it as part of T016B.

### 2026-08-22 — T017 — Instability

**Scope**

- Connect existing material, political, and administrative state to regional `unrest` and national `instability`.
- T017A/T017B territorial authority, T018 rebellion/coup, diplomacy, war, AI, UI, and rendering were not started.

**Docs read**

- `AGENTS.md`
- `docs/GDD.md`
- `docs/ARCHITECTURE.md`
- `docs/BACKLOG.md`
- `docs/QA_PLAYTEST.md`
- existing T010–T016B simulation, phase, faction, agenda, intervention, event, and invariant code

**Implementation**

- added `src/sim/systems/instability.ts` with pure typed `RegionalPressureSnapshot` and separate material/political/administrative components
- material reads `Region.scarcity` only; political pressure uses explicit relevance, faction grievance/organization/influence, and relevant local ideology radicalism/organization; administrative pressure uses T016B derived overload plus weak `Region.stateControl`
- combined bounded components with `1 - Π(1 - component)` and kept pressure out of `WorldState`
- made the daily instability writer approach the pressure target with baseline `riseRate=0.02` and `recoveryRate=0.015`; writes only regional `unrest` and population-weighted Country `instability`
- bound `runInstabilityPhase` into the authoritative default pipeline while preserving the explicit phase hook boundary
- added sparse `REGION_UNREST_BAND_CHANGED` and `NATIONAL_INSTABILITY_BAND_CHANGED` events with deterministic order/IDs and existing-only causes
- added 21 focused instability tests and a reproducible `pnpm run inspect:t017` five-scenario harness
- updated architecture, backlog, QA, decision log, and added `docs/T017_INSTABILITY_CHECK.md`

**Inspection**

- calm control stayed at zero through 360 days
- sustained material pressure produced target-region unrest `0.455 / 0.838 / 0.974 / 0.999` at Day 30/90/180/360
- political mobilization produced `0.382 / 0.704 / 0.818 / 0.839`; same support with low radicalism/organization reduced political pressure `0.840 → 0.216`
- overload `15` produced administrative pressure `0.400` at stateControl `0.2` and `0.050` at `0.9`
- after pressure removal, recovery checkpoints were `0.619 / 0.250 / 0.064 / 0.004`
- population-weighted aggregate check produced Country instability `65.0 / 100`

**Locked decisions**

- pressure, unrest, and instability remain separate derived/authoritative layers
- support or ideology name alone is never an instability modifier; no ideology-specific bonus exists
- no legitimacy feedback loop, national overload double-count, single unrest crisis trigger, or future crisis scheduling
- T017B must migrate the current Region.controller-based aggregate/controller read to the later LandHex territorial projection

**Verification**

- targeted T017 tests and inspection: passed
- full `pnpm test`: 23 files passed, 232 tests passed
- `pnpm run typecheck`: passed
- `pnpm run lint`: passed
- `pnpm run format`: passed
- `pnpm run build`: passed

**SAFE_TO_DEFER**

- final pressure normalization/rates and pacing balance
- finer Faction–Region presence/relevance and hotspot amplification
- wage/unemployment/tax-specific material consequences
- legitimacy feedback, protest/strike entities, crisis detector/thresholds
- LandHex territorial effects and visual unrest rendering

**Follow-up**

- T017A Territorial Map Topology is the next smallest separate task. Do not start T018 as part of T017.

### 2026-08-22 — T017A — Static Territorial Map Topology

**Scope**

- T017A static LandHex topology only.
- T017B territorial authority migration, T018 rebellion/coup, conflict/fronts/army, UI, React, rendering, and Gate 1V debug map were not started.

**Docs read completely**

- `AGENTS.md`
- `docs/GDD.md`
- `docs/ARCHITECTURE.md`
- `docs/BACKLOG.md`
- `docs/QA_PLAYTEST.md`
- `docs/DECISIONS.md`
- `docs/CODEX_DEVLOG.md`
- `docs/T017_INSTABILITY_CHECK.md`
- T017A request attachment and current ScenarioDefinition/WorldState/Region/ContactGraph/fixture code

**Implementation**

- added `LandHexId` and `asLandHexId` without adding LandHex to mutable `EntityId` state
- added `src/sim/state/territorialTopology.ts` with static `LandHexDefinition`, `LandHexCoordinate`, `TerritorialTopology`, terrain descriptor, scenario validation, Region membership lookup, coordinate-derived physical neighbors, and canonical adjacency projection
- added `ScenarioDefinition.mapTerritorialTopology`; `createInitialWorldState` validates it while copying no topology into `WorldState`
- kept axial coordinate adjacency pure, insertion-order independent, and sorted by stable LandHex ID
- added 9 LandHex definitions to the existing 7-Region headless contact fixture; capital and merchant-port are multi-Hex Regions
- added `src/sim/state/territorialTopology.test.ts` for multi-Hex membership, cross-Region neighbors, validation failures, ordering, ContactGraph independence, simulation preservation, and no LandHex controller
- added `src/sim/inspection/t017aTerritorialTopologyInspection.ts`, its test, and `pnpm run inspect:t017a`
- updated architecture, backlog, QA, ADR-030, and added `docs/T017A_TERRITORIAL_TOPOLOGY_CHECK.md`

**Locked authority boundary**

- `Region.controller` remains the only authoritative territorial-control source: yes
- `LandHex.controller` or `WorldState.landHexStates`: no
- ContactGraph auto-derived from physical topology: no
- T017B/T018/UI/rendering: not started

**Initial inspection**

- production/headless fixture: 7 Regions, 9 LandHexes, 2 multi-Hex Regions
- cross-Region physical borders are derived from axial coordinates and printed deterministically
- duplicate ID, duplicate coordinate, invalid Region, insertion ordering, and ContactGraph independence checks passed

**Verification**

- `pnpm test` — 25 files passed, 240 tests passed
- `pnpm run typecheck` — passed
- `pnpm run lint` — passed
- `pnpm run format` — passed
- `pnpm run build` — passed
- `pnpm run inspect:t017a` — passed; 7 Regions, 9 LandHexes, multi-Hex membership, cross-Region borders, and authority checks printed

**Follow-up**

- T017B Territorial Authority Migration remains the next smallest task and requires a separate authority/consumer migration review.

### 2026-08-22 — Post-T017A docs-only product direction patch

**Scope**

- Preserve T017A COMPLETE / PASS.
- Update product and architecture documentation only.
- Do not start T017B or T018, add production Intervention content, or change code,
  tests, scenario data, UI, rendering, or regime mechanics.

**Docs read completely**

- `AGENTS.md`
- `docs/GDD.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `docs/BACKLOG.md`
- `docs/QA_PLAYTEST.md`
- `docs/CODEX_DEVLOG.md`

**Documentation updates**

- recorded that the final player-facing regime taxonomy count remains unlocked;
  the existing derived-regime / CountryId continuity contract is unchanged
- recorded the historical Intervention archetype direction, no political
  progression tree, no moral good/bad tags, and the black-comedy / serious-state
  tone boundary
- recorded scenario cardinality as content rather than an engine invariant, with
  no speculative runtime spawning or framework requirement
- placed future content-freeze re-QC and alternate-scenario smoke checks in the
  backlog and QA plan
- added ADR-031 and ADR-032; no duplicate regime ADR was added because ADR-013
  already owns the derived regime decision

**Verification**

- code changed: no
- tests changed: no
- scenario data changed: no
- T017A remains COMPLETE / PASS; T017B and T018 were not started
- documentation consistency scan: passed; the expected ADR/status/deferral
  markers are present and no conflicting T017B/T018 completion was introduced
- `pnpm run format`: passed; the repository's canonical Prettier check excludes
  `docs/`
- explicit docs-only Prettier check with the ignore file overridden reported
  pre-existing formatting differences in all six documents; no `--write` was run
  because that would reformat unrelated historical documentation beyond this
  minimal patch

**Follow-up**

- T017B Territorial Authority Migration remains the next smallest task. Stop here
  until that task is explicitly started.

### 2026-08-22 — T017B — Territorial Authority Migration

**Scope**

- Migrate physical territorial authority from runtime `Region.controller` to
  `WorldState.landHexStates[*].controller`.
- Keep T017 formula/balance, ContactGraph topology, Region-level ideology/economy
  aggregates, stateControl, legal ownership, and political influence semantics
  separate.
- Do not start T018 rebellion/coup, T021 war resolution, army/front/pathfinding,
  UI, React, rendering, or new scenario content.

**Implementation**

- added `LandHexRuntimeState`, `TerritorialController`, static
  `ScenarioRegion.initialController`, and `WorldState.landHexStates`
- removed runtime `Region.controller`; initialization copies each static Region seed
  to all member LandHexes without mirroring it back
- added pure `deriveRegionControlSummary()` with full, partial, contested, faction
  presence, and uncontrolled projections
- added stable country/faction LandHex selectors and fully/partially controlled
  Region projections; Country controlled-region lists remain derived
- added immutable `changeLandHexController()` with valid-reference checks,
  existing-cause validation, no-op silence, and `LAND_HEX_CONTROL_CHANGED`
- migrated economy, country ideology, country contacts, faction relevance,
  instability, invariants, fixtures, and T017A/T017 inspection consumers
- added `src/sim/state/territorialControl.test.ts` and the headless
  `pnpm run inspect:t017b` harness

**Locked projection semantics**

- only fully controlled Regions enter baseline country economy, ideology, contact,
  and instability aggregates; no Hex-level population/production split is invented
- `Region.ownerCountryId`, `Region.stateControl`, political influence, and physical
  LandHex control remain independent
- ContactGraph remains a directed Region graph independent from TerritorialTopology
- physical control changes are plain JSON state and deterministic append-only events;
  no RNG is consumed by T017B

**Verification**

- initial migration, multi-Hex full/partial/contested/faction/uncontrolled summaries,
  consumer boundaries, event ordering, no-op behavior, immutability, cause validation,
  ContactGraph independence, and alternate cardinality checks pass in `inspect:t017b`
- `pnpm test` — 27 files passed, 248 tests passed
- `pnpm run typecheck` — passed
- `pnpm run lint` — passed
- `pnpm run format` — passed
- `pnpm run build` — passed
- `pnpm run inspect:t017` — passed
- `pnpm run inspect:t017a` — passed
- `pnpm run inspect:t017b` — passed

**Follow-up**

- T018 remains not started. The next smallest task is a Terra architecture review of
  the T017B authority graph, projection semantics, determinism, and scope boundary.

---

### 2026-08-22 — Procedural Political Press & repository-grounded review — docs-only direction patch

**Scope**

- Preserve T017, T017A, and T017B COMPLETE / PASS status.
- Record Procedural Political Press / Gazette as the default product direction
  without implementing runtime press, T018, T024, Gate 2, or Gate 6 systems.
- Keep the existing simulation-authority, emergent-history, CountryId continuity,
  derived-presentation, exact terminology, anti-AI-slop, and product-tone contracts.

**Docs read completely**

- `AGENTS.md`
- `docs/GDD.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `docs/BACKLOG.md`
- `docs/QA_PLAYTEST.md`
- `docs/CODEX_DEVLOG.md`

**Documentation updates**

- recorded the API-free, deterministic primary press path:
  recorded history → PressFacts → publication perspective → authored
  template/grammar → deterministic variant
- kept press non-authoritative: it cannot create events, facts, actors, numbers,
  causes, simulation outcomes, or state mutations
- recorded that publication framing may differ while recorded facts remain the
  same, and that exact political terminology and the serious-state tone boundary
  apply to press copy
- recorded development-time AI authoring as optional reviewed drafting only;
  runtime AI/API, local models, WebGPU inference, and MCP are not requirements
- recorded T024 → Gate 2 eligibility, later Gate 2/Gate 6 polish, and future QA
  for fact integrity, terminology, anti-slop, replay, perspective, and serious tone
- added ADR-034; no duplicate AI-authority ADR was created
- added a short repository-grounded review principle favoring actual repository
  evidence and minimum read-only permissions when access is genuinely available

**Verification**

- code changed: no
- tests changed: no
- scenario data changed: no
- dependencies changed: no
- external API added: no
- local LLM added: no
- MCP configured: no
- T017B remains FINAL PASS / COMPLETE; T018 and T024 remain not started
- production newspaper content was not added

**Follow-up**

- T018 Rebellion/Coup Prerequisites remains the next smallest implementation task.

---

### 2026-08-22 — T018 — Rebellion / Coup Prerequisites

**Scope**

- Detect current coup/rebellion eligibility from actual `WorldState` without adding a
  rebellion meter, countdown, story progression, or future event schedule.
- Preserve T017 pressure/unrest/instability separation and T017B LandHex authority.
- Do not begin T019/T020 foreign support, T021 army/front/war resolution, T022/T023,
  T024, UI, or rendering.

**Implementation**

- added optional scenario-owned `factionCapabilities` with typed `coup` / `rebellion`
  capability validation; metadata is not copied into `WorldState`
- added separate pure `deriveCoupPrerequisites()` and
  `deriveRebellionPrerequisites()` snapshots with required gates, supporting signals,
  concrete reasons, regional evidence, and honest `notImplemented` future evidence
- added pure derived state weakness from Country metrics, fully controlled Region
  unrest, and LandHex territorial projection; no stored generic weakness/progress
- reused active `ConflictKind.coup` / `ConflictKind.rebellion`; added optional
  political `affectedRegionIds` while keeping physical `contestedRegionIds` separate
- bound detection to the existing `conflict` phase; eligible candidates use stable
  Country/kind/Faction/Region ordering, duplicate active crisis identity suppression,
  deterministic conflict IDs, and `COUP_ATTEMPT_STARTED` /
  `REBELLION_STARTED` events
- detection emits empty causeIds when prior EventStore evidence is not available in the
  step context and does not mutate Government, CountryId, RunOutcome, RNG, Regions, or
  LandHex controllers
- added T018 fixture, prerequisite/determinism/authority tests, and
  `pnpm run inspect:t018`

**Inspection**

- high unrest only: no crisis
- organized coup-capable elite: coup only
- concentrated radical regional movement: rebellion only
- high support without organization: no rebellion
- current strategy without prerequisites: no crisis
- future foreign/military evidence is not fabricated; duplicate and insertion-order
  checks pass
- added `docs/T018_REBELLION_COUP_PREREQUISITES_CHECK.md`

**Documentation**

- updated architecture, backlog, QA, and decision log with ADR-035
- preserved CountryId continuity and derived regime/government-transition seams
- recorded revolution escalation/classification, foreign evidence, military resolution,
  final calibration, and replay integration as SAFE_TO_DEFER

**Verification**

- targeted T018 tests — passed (13 tests including inspection)
- `pnpm run typecheck` — passed
- `pnpm test` — passed (29 files, 261 tests)
- `pnpm run lint` — passed
- `pnpm run format` — passed
- `pnpm run build` — passed
- `pnpm run inspect:t017` — passed
- `pnpm run inspect:t017a` — passed
- `pnpm run inspect:t017b` — passed
- `pnpm run inspect:t018` — passed

**Follow-up**

- T019 Diplomacy / Foreign State Baseline is the next smallest task. Stop here.

---

### 2026-08-22 — Spatial Presentation & Territorial Readability — docs-only direction patch

**Scope**

- Preserve T017, T017A, T017B, and T018 COMPLETE / PASS status.
- Record the spatial presentation contract without implementing T019, T021,
  Gate 1V, renderer/UI, army/front, or new scenario content.
- Keep Region as the political influence aggregate and LandHex as the physical
  territorial substrate.

**Documentation updates**

- clarified that political influence is a Region-level continuous presentation;
  Region ideology is not copied into LandHex cells
- clarified that map organization markers require actual Faction or future
  authoritative organization state; `IdeologyState.organization` alone cannot
  invent an actor or marker
- clarified that LandHex controller changes represent physical territorial
  conflict, while front lines are non-authoritative projections from adjacent
  controller differences and the exact T021 algorithm remains deferred
- recorded that a coup or government transition may occur without territorial
  change or whole-map recoloring, while CountryId continuity remains intact
- recorded strategic readability over tactical micro-management and left LandHex
  density unlocked for Gate 1V comparison
- recorded the current 7 Region / 9 LandHex fixture as validation content only and
  retained the approximately 15–25 minute / 20–40 simulated year pacing target

**Verification boundary**

- code changed: no
- tests changed: no
- scenario data or LandHex count changed: no
- renderer/UI/React changed: no
- T019, T021, and Gate 1V implementation started: no
- no new ADR was added; existing spatial authority/topology and visual boundary
  decisions cover this docs-only direction patch
- `pnpm run format` — passed

**Follow-up**

- T019 Diplomacy / Foreign State Baseline remains the next smallest task. Stop here.

---

### 2026-08-22 — T019 — Diplomacy / Foreign State Baseline

**Scope**

- Implemented the smallest foreign-state baseline after T018.
- Kept existing `Country` as the actor and preserved T017B LandHex authority,
  T018 current-state Conflict detection, and T010 daily pipeline boundaries.
- Did not start T020 ideological threat, T021 war/occupation, T022/T023
  victory/dissolution, T024 persistence/replay, Gate 1V, UI, or rendering.

**Implementation**

- Added pure `ForeignStateObservation` derivation from actual Country metrics,
  current Government, derived territorial projection, directed runtime contacts,
  and active conflicts.
- Selected non-player Countries in stable `CountryId` order with no hardcoded
  country count; foreign heuristic decisions are monthly, bounded, deterministic,
  and do not consume RNG or call an LLM.
- Added only `CLOSE_BORDER`, `REOPEN_BORDER`, and `WAIT` through the shared
  `ActionProposal` / `acceptActionProposal` / `ActionRecord` pipeline.
- Made the diplomacy phase the canonical writer for directed border contact runtime:
  reverse edges and static topology remain independent, and foreign closures carry
  `foreignPolicyBorderClosure` plus `blockedByCountryId` for safe reopen ownership.
- Added deterministic border transition/rejection events; valid `WAIT` remains
  accepted but event-silent. Terminal runs remain inert.
- Added `inspect:t019`, focused T019 tests, and the headless inspection report.

**Documentation**

- Updated architecture, backlog, QA, and ADR-036 with the T019 authority, cadence,
  action, event, and non-goals contracts.

**Verification**

- T019 targeted tests — passed (15 tests)
- `pnpm test` — passed (31 test files, 277 tests)
- `pnpm run typecheck` — passed
- `pnpm run lint` — passed
- `pnpm run format` — passed
- `pnpm run build` — passed
- `pnpm run inspect:t017b` — passed
- `pnpm run inspect:t018` — passed
- `pnpm run inspect:t019` — passed

**Follow-up**

- T020 Foreign Ideological Threat is the next smallest task. Stop here.

---

### 2026-08-22 — Strategic AI Planning & Codex Router — docs-only direction patch

**Scope**

- Recorded future strategic-planning research and development-workflow routing after
  T019 FINAL PASS.
- Preserved the existing deterministic simulation, ActionProposal/ActionRecord
  boundary, AI non-authority rule, T019 heuristic, and T020-not-started status.
- Did not implement a planner, MCTS, RHEA, difficulty, model router, skill, MCP,
  dependency, gameplay code, or test change.

**Strategic planning direction**

- Declared the current authoritative simulation as the only future forward model;
  planner/counterfactual state is cloned and read-only, and a chosen action returns
  through the existing common action intake.
- Kept the `StrategicPlanningAdapter` shape as a future concept rather than a locked
  TypeScript API.
- Recorded T025B as one future evaluation item: heuristic baseline, bounded Top-K
  rollout, conditional MCTS, and conditional RHEA with explicit horizon, candidate,
  opponent-model, forward-call, and CPU budgets.
- Recorded actor-specific hierarchical objectives, hard survival constraints, no-cheat
  difficulty, counterfactual regret, multi-seed/tournament evaluation, and measurable
  adoption criteria without adding an authoritative utility score.
- Added boardgame.io, Macao, Stratega, Tribes, OpenSpiel, and RHEA as classified
  external references only.

**Codex router direction**

- Recorded the external GPT5.6-SOLTELU-Model-Inverter repository as a reference only.
- Documented the current manual Luna/Terra/Sol workflow, repository-evidence routing
  signals, escalation/de-escalation, and a separate future `DX01` dry-run spike.
- Kept model naming out of GDD/player-facing product rules and did not install or copy
  an external router, skill, MCP, or unrelated project context.

**Documentation**

- updated `AGENTS.md`, `docs/REFERENCES.md`, `docs/ARCHITECTURE.md`,
  `docs/BACKLOG.md`, `docs/QA_PLAYTEST.md`, and this devlog
- intentionally added no ADR because no external library or router was adopted

**Verification boundary**

- gameplay code changed: no
- tests changed: no
- scenario data changed: no
- dependency/lockfile changed: no
- boardgame.io/Macao/Stratega/Tribes/OpenSpiel/RHEA installed: no
- planner/MCTS/RHEA implemented: no
- automatic model router/skill/MCP configured: no
- current heuristic changed: no
- T020 started: no
- `pnpm run format` — passed

**Follow-up**

- Keep T025B and DX01 future-only. The next gameplay task remains T020 Foreign
  Ideological Threat; stop here.

---

### 2026-08-22 — T020 — Foreign Ideological Threat

**Scope**

- Implemented only the derived foreign ideological threat boundary after T019.
- Preserved T015 support-gradient diffusion as the sole ideology writer and T019
  outgoing border semantics.
- Did not start T021 army, war, occupation, fronts, or conflict resolution; no
  sanctions, trade economy, propaganda, censorship, faction funding, migration,
  military, UI, rendering, or LLM behavior was added.

**Implementation**

- Added pure route-level and grouped `ForeignIdeologicalThreatSnapshot` derivation.
  A threat requires a live directed foreign → domestic route plus aligned domestic
  faction mobilization; source support, ideology names, regime labels, or vulnerability
  alone are not sufficient.
- Reused T015 support-gradient and channel weights, retained source/destination Region,
  ContactEdgeId, channel, effective strength, support/radicalism/organization,
  domestic faction, vulnerability, eligibility, and severity evidence.
- Extended `ForeignStateObservation` with derived `ideologicalThreats` and a
  deterministic incoming-restore hysteresis projection. No threat meter or foreign
  support field was added to `WorldState`.
- Added direction-explicit `RESTRICT_INCOMING_BORDER` / `RESTORE_INCOMING_BORDER`.
  T019 `CLOSE_BORDER` / `REOPEN_BORDER` remains outgoing actor → target; T020 incoming
  actions mutate only target → actor explicit border routes and preserve reverse routes,
  topology, base strength, and multiplier.
- Kept information/trade/migration threat detection read-only with no implemented
  response, so the heuristic returns `WAIT` for those channels.
- Added the diagnostic fixture and `inspect:t020` Cases A–H headless report.

**Documentation**

- Updated `docs/ARCHITECTURE.md`, `docs/BACKLOG.md`, `docs/QA_PLAYTEST.md`, and
  `docs/DECISIONS.md` (ADR-037) with causal threat, direction, hysteresis, authority,
  and non-goal contracts.

**Verification boundary**

- T019 behavior remains covered; T020 adds causal, directionality, disabled-route,
  regime/ideology-name neutrality, foreign-to-foreign, hysteresis, no-write,
  deterministic ordering, RNG, cadence, and terminal tests.
- T021 army/war/occupation/conflict resolution: not started.

**Verification**

- `pnpm test` — passed (33 test files, 295 tests)
- `pnpm run typecheck` — passed
- `pnpm run lint` — passed
- `pnpm run format` — passed
- `pnpm run build` — passed
- `pnpm run inspect:t017b` — passed
- `pnpm run inspect:t018` — passed
- `pnpm run inspect:t019` — passed
- `pnpm run inspect:t020` — passed

**Follow-up**

- T021 Simplified conflict/war remains the next task. Stop here.

---

### 2026-08-22 — T021 — Simplified Conflict / War

**Scope**

- Implemented only the strategic conflict-resolution substrate for existing active
  armed conflicts.
- Preserved T017B LandHex authority, T018 detection, T019/T020 diplomacy boundaries,
  and the daily authoritative tick.
- Did not start T022/T023/T024, war declaration/peace, detailed army behavior,
  terrain/logistics/casualties, foreign military intervention, AI, UI, rendering,
  or Gate 1V.

**Implementation**

- Added pure derived front selectors for active `rebellion`, `civilWar`, and `war`;
  peaceful borders and `coup` conflicts do not produce fronts.
- Added phase-start `TerritorialControlIntent` derivation with a centralized weekly
  boundary, at most one LandHex change per Conflict, stable target collision handling,
  and stable mutation order.
- Used `Country.militaryPower` and derived Faction operational capacity from
  organization, normalized resources, local ideology radicalism/organization, and
  unrest. No new military meter, terrain modifier, or RNG was introduced.
- Routed all physical control changes through `changeLandHexController()` and kept
  owner CountryId, Region stateControl, ideology, ContactGraph topology, and RunOutcome
  separate from occupation.
- Added explicit government-transition application using an existing Government of
  the same Country; state dissolution remains T023-owned.
- Kept newly detected T018 rebellion conflicts from capturing territory in the same
  phase and added deterministic suppression for no-territory rebellions whose
  prerequisites become ineligible.
- Added the headless `inspect:t021` Cases A–G diagnostic and deterministic system tests.

**Documentation**

- Updated `docs/ARCHITECTURE.md`, `docs/BACKLOG.md`, `docs/QA_PLAYTEST.md`,
  `docs/DECISIONS.md` (ADR-038), and this devlog with the T021 contract.
- Corrected the stale Pre-Gate-1 table entry so T018/T021 refer to LandHex authority.

**Verification boundary**

- T022/T023/T024 and Gate 1V remain not started.
- The T021 Terra architecture review is the next required review before T022.

---

### 2026-08-22 — T022 — Order Consolidation

**Scope**

- Implemented only scenario-defined Order Consolidation evaluation after the
  existing conflict phase.
- Preserved T017B LandHex authority, T018/T021 conflict semantics, CountryId
  continuity, and the terminal run gate.
- Did not start T023 dissolution, T024 persistence/replay, victory UI, ending or
  history presentation, Gate 1V, or any new gameplay system.

**Implementation**

- Added pure `deriveOrderConsolidationEligibility()` evidence for stable Regions,
  capital control, core control, stateCapacity, treasury, and relevant active civil
  war.
- Added optional scenario-owned `maximumStableRegionUnrest`; no global victory
  threshold is applied when it is omitted.
- Added the evaluation phase writer for `RunState.consolidation` and
  `RunOutcome { status: "won", kind: "orderConsolidated" }` with exact consecutive
  tick semantics.
- Emitted sparse `ORDER_CONSOLIDATION_STARTED` and `ORDER_CONSOLIDATED` events;
  both use empty `causeIds` without an actual prior causal event, while the outcome
  points to the consolidated event ID.
- Added diagnostic-only T022 criteria fixture, Cases A–G inspection, and regression
  tests for projection authority, partial control, boundaries, reset/restart,
  civil-war scope, Government/regime neutrality, determinism, and terminal purity.

**Documentation**

- Updated `docs/ARCHITECTURE.md`, `docs/PRE_GATE1_CONTRACTS.md`, `docs/BACKLOG.md`,
  `docs/QA_PLAYTEST.md`, `docs/DECISIONS.md`, `docs/T022_ORDER_CONSOLIDATION_CHECK.md`,
  and this devlog.

**Verification**

- `pnpm test` — passed (37 test files, 320 tests)
- `pnpm run typecheck` — passed
- `pnpm run lint` — passed
- `pnpm run format` — passed
- `pnpm run build` — passed
- `pnpm run inspect:t021` — passed
- `pnpm run inspect:t022` — passed
- `pnpm run inspect:t020` — passed

**Follow-up**

- T023 State Dissolution is the next smallest task; SAFE_TO_DEFER items remain
  persistence/replay, final criteria balance, victory presentation, and Gate 1V.

---

### 2026-08-22 — T023 — State Dissolution

**Scope**

- Implemented only the headless state-dissolution terminal boundary.
- Preserved T017B LandHex authority, T018/T021 conflict semantics, T022 order
  consolidation, CountryId continuity, and the existing terminal-step gate.
- Did not start T024 persistence/replay, save/load, annexation, permanent
  fragmentation, sovereign-function simulation, successor states, Gate 1V, UI,
  ending presentation, or any new state-continuity writer.

**Implementation**

- Added pure `deriveStateDissolutionEligibility()` using only
  `ScenarioDefinition.dissolutionCriteria` and the inclusive supported evidence
  `Country.stateContinuity <= stateContinuityAtOrBelow`.
- Kept configured full-annexation, permanent-fragmentation, and
  sovereign-function criteria explicit but `deferred` because no authoritative
  evidence exists in the current WorldState.
- Added `runStateDissolutionPhase()` and composed it before the existing T022
  evaluation in `runOrderConsolidationAndDissolutionPhase()`.
- Added deterministic `STATE_DISSOLVED` payload evidence, empty `causeIds` when no
  actual source event exists, and `RunOutcome.causeEventId` pointing to the emitted
  event. A dissolving step cannot also emit `ORDER_CONSOLIDATED`.
- Added T023 inspection Cases A–H and regression tests for threshold boundaries,
  insertion-order determinism, unsupported evidence, non-defeat conditions,
  Country/Government continuity, event provenance, terminal inertness, dissolution
  precedence, already-won preservation, and the ordinary T022 path.

**Documentation**

- Updated `docs/ARCHITECTURE.md`, `docs/BACKLOG.md`, `docs/QA_PLAYTEST.md`,
  `docs/DECISIONS.md` (ADR-039), and this devlog.
- Added `docs/T023_STATE_DISSOLUTION_CHECK.md` as the task inspection record.

**Verification**

- `pnpm test` — passed (39 test files, 332 tests)
- `pnpm run typecheck` — passed
- `pnpm run lint` — passed
- `pnpm run format` — passed
- `pnpm run build` — passed
- `pnpm run inspect:t021` — passed
- `pnpm run inspect:t022` — passed
- `pnpm run inspect:t023` — passed; all checks PASS

**SAFE_TO_DEFER / Follow-up**

- T024 authoritative `localeCompare` audit, scenario-aware LandHex runtime
  invariant during deserialize, persistence/replay, and cross-tick causal history
- final state-continuity writer/formula and dissolution criteria balance
- actual annexation, permanent fragmentation, sovereign-function loss, and
  successor-state semantics
- T023 Terra architecture review is required before starting T024.

---

### 2026-08-22 — T024 — Persistence / Replay Determinism

**Scope**

- Implemented only the typed in-memory persistence/replay boundary after T023.
- Preserved ScenarioDefinition/static topology ownership, LandHex controller
  authority, T018/T021 conflict semantics, T019/T020 mutable contact overlays,
  T022/T023 terminal ownership, and the existing daily simulation pipeline.
- Did not start save UI, browser storage, replay viewer, event-sourced rebuild,
  rewind/branching, Gate 1V, rendering, AI, or new gameplay mechanics.

**Implementation**

- Added `SerializedSimulationSnapshotV1` with explicit JSON-safe decode/validation.
  It persists mutable WorldState runtime, RunState/ActionRecord history, actual
  RNG state, and sibling EventStore history while excluding static ScenarioDefinition,
  static LandHex topology, Region.controller, fronts, and derived read models.
- Added scenario identity checks and scenario-aware
  `assertLandHexRuntimeStateInvariants()` at the deserialize trust boundary,
  including missing/unknown LandHex, controller references, Government references,
  unsupported format/unknown keys, terminal cause, and event cause validation.
- Added `commitSimulationStep()` to append emitted events to the existing history
  as one RunRecord commit, plus `cloneRunRecordViaSnapshot()` for replay/
  counterfactual tests. Preserved event IDs, global sequences, causes, and
  `nextEventSequence` across save/load.
- Replaced the three authoritative economy/resources `localeCompare` paths with
  locale-independent textual comparison; no balance constant or formula changed.
- Added T024 core tests and `inspect:t024` for roundtrip, insertion-order
  canonicalization, multi-boundary replay, RNG/EventStore equivalence, T021/T022/
  T023/contact regressions, active-rebellion continuation through the next weekly
  resolution, derived selector equivalence, terminal freeze, and corrupt snapshot
  rejection.

**Documentation**

- Updated `docs/ARCHITECTURE.md` with the snapshot trust boundary, replay
  equivalence, EventStore sibling commit, canonical ordering, and terminal rules.
- Added ADR-040 to `docs/DECISIONS.md` and updated `docs/BACKLOG.md`,
  `docs/QA_PLAYTEST.md`, and `docs/T024_PERSISTENCE_REPLAY_CHECK.md`.

**Verification**

- `pnpm test` — passed
- `pnpm run typecheck` — passed
- `pnpm run lint` — passed
- `pnpm run format` — passed
- `pnpm run build` — passed
- `pnpm run inspect:t021` — passed
- `pnpm run inspect:t022` — passed
- `pnpm run inspect:t023` — passed
- `pnpm run inspect:t024` — passed

**Follow-up**

- T024 Terra architecture review is required before Gate 1V.
- Save backend/UI, migration framework, replay viewer, and Gate 1V remain
  SAFE_TO_DEFER.

---

### 2026-08-22 — T024 — Snapshot Trust-Boundary Completion

**Scope**

- Terra T024 architecture review의 FAIL 원인만 수정했다. gameplay rule, balance,
  persistence backend, replay viewer, UI, Gate 1V, T025는 시작하지 않았다.

**Implementation**

- `assertScenarioRuntimeClosure()`를 추가해 V1의 ScenarioDefinition과
  WorldState가 닫힌 runtime graph인지 검사한다. Country/Region/Faction/
  PolicyState identity set, Region ideology catalog, policy/faction/intervention
  catalog, Government/Conflict outcome, static LandHex Region reference를
  검증한다.
- ActionRecord deterministic ID/duplicate 검증과 intervention commitment의
  accepted `START_INTERVENTION` source/provenance 검증을 추가했다.
- `assertEventStoreInvariants()`가 전체 history의 deterministic ID, 중복,
  sequence/tick order, existing-only cause를 한 번에 검증한다.
- `commitSimulationStep(scenario, record, result)`가 기존 record와 appended
  EventStore, candidate nextWorld를 같은 trust boundary에서 검증하고 실패 시
  입력 record를 유지하도록 했다.
- serialize/deserialize도 같은 closure validator를 사용하며, nonzero RNG와
  pre-save cause 보존을 persistence-level에서 검증한다. 새 gameplay causal
  inference나 content hash는 추가하지 않았다.
- T024 inspection의 locale ordering 문구를 실제 source audit/test 근거에 맞게
  정리했다.

**Regression**

- missing/unknown Region, ideology, PolicyState, static LandHex Region reference
- forged/duplicate ActionRecord ID
- dangling/rejected/forged/mismatched/unknown intervention commitment
- invalid Conflict outcome, invalid serialization, invalid next-state commit
- nonzero RNG continuation과 save 후 pre-save cause reference

**Verification**

- `pnpm test` — PASS
- `pnpm run typecheck` — PASS
- `pnpm run lint` — PASS
- `pnpm run format` — PASS
- `pnpm run build` — PASS
- `pnpm run inspect:t020`–`t024` — PASS

**SAFE_TO_DEFER**

- dynamic Country/Region/Faction/PolicyState lifecycle, content hash, migration
  framework, save backend/UI, replay viewer, full event-sourced rebuild, Gate 1V.

### 2026-08-22 — V00 — Visual System & Asset Quality Contract

**Scope**

- Gate 1V 이후 시각 결과물이 TMR visual grammar와 simulation 의미를 공유하도록
  docs/catalog/process contract만 추가했다.
- T024 FINAL PASS와 LandHex authority, Region aggregate, CountryId continuity,
  EventStore/replay boundary를 보존했다.
- V01, renderer, R3F/Three.js scene, UI system, production asset, asset download,
  font/texture import, Gate 1V implementation은 시작하지 않았다.

**Docs read completely**

- `AGENTS.md`
- `docs/GDD.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `docs/BACKLOG.md`
- `docs/QA_PLAYTEST.md`
- `docs/PRE_GATE1_CONTRACTS.md`
- `docs/CODEX_DEVLOG.md`
- `docs/T024_PERSISTENCE_REPLAY_CHECK.md`

**Repository-grounded inspection**

- 실제 `src/`에는 renderer-independent `src/sim/`, Gate 0 React status shell,
  global CSS만 존재한다.
- Three.js/R3F dependency, `src/presentation/`, `derivePresentationState`,
  LandHex renderer는 아직 없다.

**Documentation**

- added `docs/VISUAL_BIBLE.md` with the miniature political world / restrained
  administrative cartography thesis, three visual classes, continuity rule,
  semantic channels, anti-card-soup/slop rules, benchmark, zoom, tone, and Gate 1V entry
- added `docs/VISUAL_REFERENCE_CATALOG.md` with rights classification, traceability,
  historical source categories, and official LoC/NYPL/Europeana/David Rumsey seeds
- added `docs/ASSET_SOURCE_CATALOG.md` with KayKit/Kenney/Quaternius source/license
  candidates; all remain `CANDIDATE / NOT ACCEPTED`
- added `docs/VISUAL_QA.md` with simulation-fiction, normalization, universal asset
  acceptance, canonical screenshot, responsive, human critique, and performance QA
- added `docs/V00_VISUAL_SYSTEM_ASSET_QUALITY_CHECK.md`
- updated `docs/GDD.md` with a short Visual Bible cross-reference, and updated
  `docs/ARCHITECTURE.md`, `docs/BACKLOG.md`, `docs/QA_PLAYTEST.md`, and `AGENTS.md`
  with the presentation boundary and operational visual rules
- no new ADR; existing authority/presentation/replay contracts are sufficient

**External source verification**

- official collection/rights pages were checked for Library of Congress maps and
  Chronicling America, NYPL Digital Collections, David Rumsey, Europeana, KayKit,
  Kenney, and Quaternius
- no source files were downloaded or imported; item-level rights remain required
  for any future direct use

**Verification boundary**

- code changed: no
- tests changed: no
- scenario data changed: no
- production renderer/assets/UI changed: no
- Gate 1V V01 started: no
- `pnpm run format`: PASS
- `pnpm test`: PASS (41 files, 351 tests)
- `pnpm run typecheck`: PASS
- `pnpm run lint`: PASS

**Follow-up**

- V01 Presentation State / `derivePresentationState` is the next smallest visual
  implementation task, after the V00 contract is accepted. Do not start it in V00.

### 2026-08-22 — V01 — Presentation State / `derivePresentationState`

**Scope**

- ScenarioDefinition과 authoritative WorldState를 향후 React/R3F가 소비할
  renderer-neutral pure `PresentationState`로 조합했다.
- T017B LandHex authority, T019/T020 directed ContactGraph, T021 front
  derivation, Region ideology support, T022/T023 RunState를 기존 selector와
  현재 state에서 읽었다. 새로운 gameplay rule이나 authority를 만들지 않았다.

**Implementation**

- added `src/presentation/presentationState.ts` and `src/presentation/index.ts`
- LandHex static q/r/terrain + runtime controller, Region control summary,
  legal owner, unrest/scarcity, Region-level ideology support를 제공한다
- 실제 faction-controlled LandHex presence가 있는 Region에만 stable
  organization token을 제공한다. 현재 모델에 비영토 Region organization anchor가
  없으므로 support/currentStrategy/IdeologyState.organization만으로 token을
  만들지 않는다
- directed ContactGraph route/effective strength/blocked overlay와 active
  armed conflict fronts를 제공한다. coup/평화 국경/front 저장/Army entity는 없다
- run outcome/consolidation progress와 tick/date를 읽기 전용으로 복사한다
- `src/presentation/presentationState.test.ts`에 purity, multi-Hex partial
  control, political influence, organization truth, directed routes, fronts,
  persistence re-derivation, insertion order, empty state regression을 추가했다
- `src/presentation/v01PresentationInspection.ts`와 `pnpm run inspect:v01`을
  추가했다

**Boundary / non-goals**

- PresentationState는 WorldState나 T024 snapshot에 저장하지 않는다.
- no React/R3F/Three.js, renderer coordinates, colors/materials/assets, CSS/UI,
  camera, rendering, simulation writer, event/action/RNG가 추가됐다.
- V02 Flat Hex Renderer, Gate 1V renderer, T024 O(ticks²) optimization은
  시작하지 않았다.

**Verification**

- V01 presentation tests: PASS
- `pnpm run inspect:v01`: PASS
- `pnpm test`: PASS (43 files, 361 tests)
- `pnpm run typecheck`: PASS
- `pnpm run lint`: PASS
- `pnpm run format`: PASS
- `pnpm run build`: PASS
- `pnpm run inspect:t024`: PASS

### 2026-08-22 — F01 — Long-run Headless Harness

**Scope**

- 현재 simulation을 5/10/20/40 simulated years 동안 headless로 측정하는
  developer-only harness를 추가했다.
- WAIT/no-intervention만 사용했으며, 새 economy/policy/intervention/faction AI/
  war/UI/renderer/gameplay rule은 추가하지 않았다.
- V02와 Gate 1V visual work는 시작하지 않았다.

**Implementation**

- `src/sim/inspection/f01LongRunHeadless.ts`에 `LongRunSummary`, yearly
  checkpoint, event/state/faction/territory trajectory, pathology observation,
  wall-clock benchmark, JSON midpoint save/load comparison을 추가했다.
- 각 tick은 `runSimulationStep`와 `commitSimulationStep`만 통과한다. WAIT는
  기존 `SimulationStepInput`의 빈 validated action list로 표현된다.
- `src/sim/inspection/f01LongRunHeadless.test.ts`에 small-horizon deterministic
  summary, terminal early stop, telemetry non-authority, persistence resume
  regression을 추가했다.
- `inspect:f01`은 40년 benchmark가 일반 unit CI를 지연시키지 않도록 별도
  async inspection runner로 실행하며, 일반 `pnpm test`에서는 long benchmark
  test file을 제외한다.

**Measured baseline**

- scenario: existing `t021.rebellion-fixture`, seed `40101`, WAIT
- 5y: 1,800 ticks / 1.34s / 1,340 ticks/sec
- 10y: 3,600 ticks / 5.96s / 604 ticks/sec
- 20y: 7,200 ticks / 22.61s / 319 ticks/sec
- 40y: 14,400 ticks / 101.75s / 142 ticks/sec / active outcome
- 20→40 runtime scale 약 4.50x(벽시계 값은 실행 환경에 따라 달라짐). T024 full-history validation을
  `PERFORMANCE BLOCKER BEFORE GATE1V` 관찰로 기록했지만 최적화는 수행하지 않았다.
- 40년 WAIT baseline은 invariants PASS, 14,412 events/EventStore entries,
  rebellion 1, coup 1, civil war 0, Government transition 0, LandHex control
  changes 3을 기록했다. `Country.instability`의 canonical 0–100 단위를 적용한
  pathology detector에서는 이 run에 pathology가 관찰되지 않았다.
- 2년 midpoint JSON save/load resume와 continuous 5-year run은 authoritative
  final snapshot이 동일했다.

**Verification**

- `pnpm test` — PASS (44 files, 365 tests; 40-year inspection excluded from unit CI)
- `pnpm run typecheck` — PASS
- `pnpm run lint` — PASS
- `pnpm run format` — PASS
- `pnpm run build` — PASS
- `pnpm run inspect:f01` — PASS
- `pnpm run inspect:t024` — PASS
- `pnpm run inspect:v01` — PASS

**Documentation**

- added `docs/F01_LONG_RUN_HEADLESS_CHECK.md`
- updated `docs/BACKLOG.md`, `docs/QA_PLAYTEST.md`,
  `docs/V01_PRESENTATION_STATE_CHECK.md`, and `docs/VISUAL_BIBLE.md`
- V01 이후 sequence를 `Gate 1F F01–F05 → V02`로 정렬했다.

**Follow-up**

- F02 multi-seed outcome survey
- F03 intervention counterfactual
- F04 exploit/degeneracy survey
- F05 pacing/fun decision
- T024 validation optimization은 당시 F01 checkpoint에서 Gate 1V 전 별도
  measured task로 남겼다.

### 2026-08-22 — F01A — Incremental Commit Validation Performance Fix

**Scope**

- F01에서 확인한 `commitSimulationStep()` full-history validation 누적 비용만
  줄였다. economy, policy, faction behavior, conflict cadence, victory/defeat,
  balance, AI, UI, renderer는 변경하지 않았다.
- serialize/deserialize trust boundary, corrupt snapshot rejection, replay,
  causeId, RNG, failure atomicity 계약은 그대로 유지했다.

**Bottleneck evidence**

- 매 tick 이전/후보 runtime closure가 전체 state를 다시 검사했다.
- EventStore 전체 history가 매 tick 다시 검사됐고, `appendEvent()`가 기존
  history 기반 ID/cause lookup과 full event-array copy를 반복했다.
- F01 WAIT에는 ActionRecord가 없어 action-history scan은 주 병목이 아니었다.

**Implementation**

- added `src/sim/core/canonical.ts` with process-local `WeakMap` trust markers;
  no serialized `validated` flag is accepted
- `runSimulationStep()` results and full-validated/deserialized `RunRecord`s only
  enter the canonical continuation when they share the same ScenarioDefinition
- added incremental EventStore append validation for deterministic ID, expected
  sequence, tick order, duplicate ID, existing/earlier cause, and terminal
  outcome relation; full EventStore validation remains at persistence boundaries
- added ActionRecord suffix validation and changed intervention commitment
  provenance validation; candidate runtime invariants/identity closure remain
  checked without rescanning the old action history
- added ordered EventStore binary cause lookup; the `events` array remains the
  sole event-history authority

**Regression**

- invalid new event sequence/ID/missing cause/forward cause: rejected
- invalid ActionRecord sequence/ID/duplicate: rejected
- dangling intervention commitment: rejected
- failed incremental commit leaves the previous RunRecord unchanged
- selected incremental results pass full snapshot validation
- full/untrusted commit path and incremental path produce the same deterministic
  18-tick result
- existing T024 corruption, cross-save cause, RNG, replay, and terminal tests
  remain PASS

**F01 before / after measurement**

- 5y: `1.34s → 0.497s` (`2.69x`), 3,619 ticks/sec after
- 10y: `5.96s → 0.830s` (`7.18x`), 4,336 ticks/sec after
- 20y: `22.61s → 1.561s` (`14.48x`), 4,612 ticks/sec after
- 40y: `101.75s → 3.466s` (`29.36x`), 4,155 ticks/sec after
- 20→40 scaling: `4.50x → 2.22x`
- 40-year simulation-derived outcome/trajectory remained the F01 WAIT baseline

**Verification**

- targeted persistence/event tests: PASS
- `pnpm test`: PASS (44 files, 370 tests; long F01 inspection excluded)
- `pnpm run typecheck`: PASS
- `pnpm run lint`: PASS
- `pnpm run format`: PASS
- `pnpm run build`: PASS
- `pnpm run inspect:t024`: PASS
- `pnpm run inspect:v01`: PASS
- `pnpm run inspect:f01`: PASS; no residual long-run performance blocker observed

**Follow-up**

- F02 Multi-seed Outcome Survey is ready and remains not started.
- V02/Gate 1V visual work remains not started.

### 2026-08-22 — F01B — Canonical Trust Hardening

**Scope**

- F01A의 incremental validation 성능 구조를 유지하면서 process-local
  canonical trust의 parent binding, stale mutation, result reuse gap만 닫았다.
- gameplay, balance, EventStore semantics, persistence schema, F02, V02는
  변경하지 않았다.

**Implementation**

- `SimulationStepResult`에 정확한 source `WorldState` object identity를 묶고,
  다른 canonical parent에 commit하는 mixed-parent result를 거부했다.
- step result capability를 commit 시도 전에 one-shot consume하여 parent 불일치,
  delta validation 실패, 성공 이후의 재사용을 모두 거부한다.
- raw `markCanonical*` API를 제거하고 trusted persistence/simulation seam 전용
  registration 이름으로 정리했다. marker/capability는 serialized data에 없다.
- canonical `RunRecord`와 trusted step-result authoritative graph에 incremental
  runtime freeze를 적용했다. process-local `WeakSet`으로 이미 보호된 object는
  다시 전체 graph를 순회하지 않는다. 현재 저장 graph는 plain object/array이며
  `Map`/`Set`이 들어오면 false immutability를 허용하지 않고 거부한다.
- 기존 full serialize/deserialize validation, corruption rejection,
  cross-save causality, replay equivalence, incremental/full comparison은
  유지했다.

**Regression**

- raw canonical marker export absence: PASS
- same-value different-parent mixed result: rejected
- failed trusted result reuse: rejected
- successful trusted result reuse: rejected
- canonical ActionRecord/EventStore/commitment/result nested mutation: blocked
- deserialized canonical record nested mutation: blocked
- previous record immutability and commit atomicity: PASS

**F01 hardening measurement**

- F01A baseline → F01B: 5y `0.497s → 0.488s`, 10y `0.830s → 0.842s`,
  20y `1.561s → 2.488s`, 40y `3.466s → 7.089s`
- 20→40 scaling: `2.22x → 2.85x`
- 40-year authoritative outcome/trajectory, EventStore, ActionRecord, RNG,
  replay resume, and invariants remained equivalent
- runtime immutability adds measured cost but does not regress to F01's
  `101.75s` full-history behavior; no residual performance blocker observed

**Verification**

- `pnpm test`: PASS (44 files, 376 tests; long F01 inspection excluded)
- `pnpm run typecheck`: PASS
- `pnpm run lint`: PASS
- `pnpm run format`: PASS
- `pnpm run build`: PASS
- `pnpm run inspect:t024`: PASS
- `pnpm run inspect:v01`: PASS
- `pnpm run inspect:f01`: PASS

**Follow-up**

- F02 Multi-seed Outcome Survey is ready and remains not started.
- V02/Gate 1V visual work remains not started.

### 2026-08-23 — F01C — Canonical Registration & Freeze Atomicity Fix

**Scope**

- F01B Terra targeted review에서 남은 raw registration export와 recursive
  freeze stale-completion 문제만 수정했다.
- gameplay, balance, EventStore semantics, persistence schema, F02, V02는
  변경하지 않았다.

**Implementation**

- RunRecord canonical registration을 `persistence.ts` private validated seam으로
  이동했다.
- SimulationStepResult source binding/one-shot registry를 `tick.ts` private
  simulation-step seam으로 이동했다. public simulation export에는 raw
  `registerCanonical*`/`registerProduced*` capability가 남지 않았다.
- 공통 `canonicalFreeze.ts`는 `inProgress`와 completed `WeakSet`을 분리한다.
  recursive child protection과 `Object.freeze()`가 성공한 뒤에만 completed 상태를
  기록하고, 실패 시 in-progress 상태를 정리한다.
- nested Map/Set 동일-object 재시도와 public export surface 회귀를 추가했다.

**Verification**

- `pnpm test`: PASS (44 files, 379 tests; long F01 inspection excluded)
- `pnpm run typecheck`: PASS
- `pnpm run lint`: PASS
- `pnpm run format`: PASS
- `pnpm run build`: PASS
- F01C targeted persistence tests: PASS
- `pnpm run inspect:t024`: PASS
- `pnpm run inspect:v01`: PASS
- `pnpm run inspect:f01`: PASS; 40-year `6.802s`, 20→40 scaling `2.74x`
- F02/V02: NOT STARTED

### 2026-08-23 — F02 — Multi-seed Outcome Survey

**Scope**

- 기존 F01 `runSimulationStep → commitSimulationStep` WAIT runner를 developer
  survey로 재사용했다
- T021 rebellion fixture를 seeds `0..22`와 F01 baseline `40101`로 24회,
  seed당 40 simulated years 실행했다. terminal run은 즉시 중단한다
- seed별 outcome, political event sequence, Government transition sequence,
  territorial changes, treasury/stateCapacity/instability/stateContinuity,
  faction organization, consolidation, zero-territory recovery, pacing silence를
  기록하고 exact/coarse deterministic history signature를 계산했다
- survey collector는 WorldState를 직접 수정하지 않으며, telemetry는 gameplay
  authority나 persistence schema에 들어가지 않는다

**Implementation**

- `src/sim/inspection/f02MultiSeedOutcomeSurvey.ts`에 순차 sync/async survey,
  aggregate distribution, concern diagnostics, representative seed selection,
  compact report를 추가했다
- `src/sim/inspection/f02MultiSeedOutcomeSurvey.test.ts`에 small-horizon
  determinism, seed-order independence/cross-run isolation, aggregate math,
  terminal early-stop 회귀를 추가했다
- `inspect:f02` 장기 inspection은 일반 `pnpm test`에서 제외하고 별도 실행한다
- F01 telemetry에 political event/territorial change/faction/consolidation
  trajectory를 추가했으며 기존 F01 deterministic signature에도 새 telemetry를
  포함했다

**Survey evidence**

- 345,600 / 345,600 ticks, wall-clock `185.58s`, 약 `1,862.26 ticks/sec`
- active `24/24`, orderConsolidated `0/24`, stateDissolved `0/24`
- rebellion `1/1/1`, coup `1/1/1`, civil war `0/0/0`, Government transition
  `0/0/0`, territorial changes `3/3/3` (min/median/max)
- exact/coarse signature `1/1`, largest cluster `24/24`, seed sensitivity 미관찰
- treasury/stateCapacity unchanged `24/24`; faction organization total
  start/peak/final `1.60–1.60`; crisis-participating faction `2–2`
- controlled LandHex 0 도달 `24/24`, 회복 `0/24`, final active at zero `24/24`
- consolidation eligibility `0/24`, dissolution threshold 도달 `0/24`, 최장
  political silence 약 `39.94`년

**Verification**

- F02 small tests: PASS
- `pnpm run inspect:f02`: PASS (24 seeds / 40 years)
- F01 baseline seed `40101` regression: PASS
- balance/gameplay/RNG mechanic/persistence schema: unchanged
- F03/F04/F05/V02: not started

**Follow-up**

- F02 concerns and raw evidence: `docs/F02_MULTI_SEED_OUTCOME_SURVEY.md`
- Next smallest task: F03 Intervention Counterfactuals

### 2026-08-23 — F03 — Intervention Counterfactuals / Player Agency Validation

**Scope**

- 동일 authoritative snapshot에서 `WAIT`와 현재 catalog의 합법적인 단회
  intervention branch를 비교했다
- balance, threshold, policy/intervention catalog, RNG, faction AI, conflict,
  victory/dissolution, renderer는 변경하지 않았다
- `t021.rebellion-fixture`는 intervention catalog가 비어 있고 시작 국고가 0,
  ContactGraph edge가 없어 F03에 부적합하다는 것을 먼저 확인했다

**Implementation**

- `src/sim/state/gate1fValidationFixture.ts`에 T021 political-crisis/
  multi-Hex/faction state와 기존 T016B three administrative intervention
  definitions, resource flow, directed ContactGraph, T022 criteria를 조합한
  developer-only `gate1f.validation` fixture를 추가했다
- `src/sim/inspection/f03InterventionCounterfactuals.ts`에 T024 JSON snapshot
  branch, feasibility check, canonical action/step/commit runner, checkpoint
  metrics, event/history divergence, trade-off/downstream audit를 추가했다
- `inspect:f03`와 small branch determinism/order/legal/infeasible/purity tests를
  추가했다. 3 natural checkpoints × 4 branches × 10 years의 long matrix는
  일반 `pnpm test`에서 제외했다

**Evidence**

- 3 starting states (day 0/90/180)에서 short/long/prerequisite 모두 feasible
- accepted branch는 day 1에 ActionRecord → commitment → `INTERVENTION_STARTED`
  → treasury charge를 만들었다
- cost/load/duration trade-off는 각각 short `8/12/1d`, long `20/15/180d`,
  prerequisite `12/20/180d`였다
- intervention branch는 WAIT와 정치 event sequence, rebellion/coup/civil war,
  Government transition, territorial change, consolidation/dissolution 결과가
  같았다. treasury와 administrative commitment/headroom 차이는 관찰됐다
- 결과: `PLAYER_AGENCY_WEAK`; current intervention definitions의 political/
  material downstream integration gap을 F04 전에 별도 repair proposal로
  검토할 필요가 있다

**Verification**

- F03 small tests: PASS
- `pnpm run inspect:f03`: PASS (43,200 branch ticks; current run 약 15.8초)
- balance/gameplay/RNG/persistence schema: unchanged
- F04/V02: NOT STARTED

**Follow-up**

- raw evidence: `docs/F03_INTERVENTION_COUNTERFACTUALS.md`
- recommended next step: 최소 intervention downstream integration repair proposal
  검토 후 F04 exploit/degeneracy survey 여부 결정

### 2026-08-23 — F03A — Intervention Downstream Integration Repair

**Scope**

- F03에서 확인한 treasury/administrative-only intervention dead-end만 기존
  authoritative consumer에 연결했다
- T021 fixture, production catalog, crisis threshold, balance, RNG, AI, conflict,
  victory/dissolution, renderer는 변경하지 않았다

**Implementation**

- `InterventionDefinition.completionEffects`에 세 가지 concrete typed delta를
  추가했다: Region resource production capacity, Faction grievance, Faction
  organization
- `applyScheduledEffects`의 기존 completion boundary에서 immutable replacement로
  effect를 정확히 한 번 적용하고, `INTERVENTION_COMPLETED` payload에 실제
  previous/next/changed application evidence를 기록했다
- `gate1f.validation`만 기존 T016B intervention IDs에 scenario-owned effect
  content를 제공한다
- resources는 completion → production → shortage cause chain을 보존하고,
  conflict는 실제 faction prerequisite candidate가 같은 step에서 effect를
  읽을 때만 completion cause를 연결한다
- F03 report에 causal audit, downstream consumer, dead-end, T017/T018
  prerequisite difference를 추가했다

**Evidence**

- short: production capacity → resources/scarcity → T017 material pressure,
  scarcity/unrest trajectory difference observed
- long: faction organization `0.8 → 0.5`, T016/T018 coup eligibility reader
  difference observed
- prerequisite: faction grievance `0.8 → 0.5`, T016/T018 rebellion eligibility
  reader difference observed
- F03 동일 3 checkpoint × 4 branch × 10-year matrix에서 세 intervention 모두
  non-cost authoritative state와 existing downstream consumer difference가
  관찰되었고 dead-end candidate는 남지 않았다
- 정치 event sequence, Government/territory, consolidation/dissolution outcome은
  WAIT와 여전히 같아서 player agency는 `PLAYER_AGENCY_WEAK`로 유지했다

**Persistence / scope**

- material completion event → resource production → shortage cause provenance
  회귀 PASS
- mid-commitment save/load continuous/resume equality와 exactly-once completion
  PASS
- F02 WAIT/no-intervention baseline은 intervention effect 없이 유지
- balance/gameplay/RNG mechanic/production catalog expansion/F04/V02: 변경 또는
  시작하지 않음

**Verification**

- F03A targeted tests: PASS
- `pnpm run inspect:f03`: PASS; causal audit/dead-end output PASS
- `pnpm test`: PASS (47 files, 391 tests; long F01/F02/F03 inspections excluded)
- `pnpm run typecheck`: PASS
- `pnpm run lint`: PASS
- `pnpm run format`: PASS
- `pnpm run build`: PASS
- `pnpm run inspect:t024`: PASS
- `pnpm run inspect:v01`: PASS
- `pnpm run inspect:f01`: PASS (40-year WAIT `7.35s`, 20→40 `2.72x`)
- `pnpm run inspect:f02`: PASS (24 seeds / 345,600 ticks; one exact/coarse
  signature cluster; no WAIT baseline change)

**Follow-up**

- F03A evidence: `docs/F03A_INTERVENTION_DOWNSTREAM_INTEGRATION.md`
- player agency가 아직 WEAK이므로 F04 전에 작은 targeted agency/balance
  diagnosis를 검토한다. F04/V02는 시작하지 않았다.

### 2026-08-23 — F03B — Agency Leverage / Threshold Sensitivity Diagnosis

**Scope**

- F03A의 `PLAYER_AGENCY_WEAK` 원인을 measurement-only로 진단했다.
- threshold, effect magnitude, cost, duration, cadence, RNG, gameplay,
  conflict/Government/T022/T023 rule은 변경하지 않았다.
- 기존 F03 canonical branch runner를 재사용했고 `inspect:f03b`는 developer-only
  compact timeline/diagnosis를 출력한다.

**Instrumentation**

- T018 daily prerequisite evaluation, T016 monthly boundary, T021 weekly
  resolution boundary를 실제 source helper로 관측했다.
- `CrisisGate` numeric margin, failed gate, eligibility window, detector count,
  completion timing, active conflict/dedup, event opportunity를 기록했다.
- T017 short path의 scarcity/material pressure/unrest/instability attenuation,
  T022 one-year criterion blockers, WAIT natural drift를 별도 기록했다.
- full daily WorldState dump와 WorldState telemetry authority는 만들지 않았다.

**Evidence**

- short `+6 food production capacity`는 scarcity/material pressure `-0.500`,
  unrest 약 `-0.013`의 persistent T017 difference를 만들었다. T018 gate를
  직접 target하지 않아 current matrix의 political divergence 부재는
  `NO_PROBLEM`/decision-opportunity 진단으로 분리했다.
- long organization `0.800 → 0.500`은 coup gate margin `+0.200 → -0.100`,
  prerequisite grievance `0.800 → 0.500`은 rebellion margin `+0.250 → -0.050`으로
  실제 eligibility window를 만들었다.
- State A의 first political event는 day 1이고 long/prerequisite completion은
  day 181이다. 세 checkpoint의 relevant branch에는 active conflict가 있어
  T018 dedup/suppression이 새 history를 만들지 않았다. State B/C는 completion
  이후 WAIT future political event가 없었다.
- T022 one-year blocker는 stableRegions/capitalControl/coreTerritory였고,
  sensitivity `0.5x/1x/2x/4x`에서 1x가 이미 decision boundary를 통과했지만
  political history는 모든 scale에서 같았다.

**Decision**

- `PLAYER_AGENCY_WEAK` 유지.
- primary diagnosis: active conflict/dedup, State A effect-too-late, post-crisis
  checkpoint decision opportunity 부재. other-prerequisite dominance와
  cadence-missed window는 primary cause로 관찰되지 않았다.
- F04는 narrow decision-boundary 기준 `READY`; active-conflict fixture caveat를
  carry-forward한다. F04/V02는 시작하지 않았다.

**Verification**

- `pnpm test`: PASS (48 files, 393 tests; long F01/F02/F03/F03B inspections
  excluded from normal CI)
- `pnpm run typecheck`: PASS
- `pnpm run lint`: PASS
- `pnpm run format`: PASS
- `pnpm run build`: PASS
- `pnpm run inspect:f03b`: PASS
- `pnpm run inspect:f03`: PASS; `PLAYER_AGENCY_WEAK` retained
- `pnpm run inspect:f02`: PASS; 24/24 WAIT runs remain one exact/coarse
  signature cluster with no seed sensitivity
- `pnpm run inspect:f01`: PASS
- `pnpm run inspect:t024` / `pnpm run inspect:v01`: PASS

### 2026-08-23 — F04 — Degenerate Strategy / Exploit Check

**Scope**

- F03B decision-boundary checkpoint를 재사용해 반복 intervention, JIT timing,
  commitment overlap, treasury/admin feasibility, active-conflict response,
  recovery agency를 measurement-only로 검사했다.
- `WAIT`, repeat short/long/prerequisite, single long/prerequisite, `MIX`, JIT
  long/prerequisite의 9개 deterministic legal strategy를 PRE_CRISIS day 0, POST_CONFLICT day 90,
  RECOVERY_STRESS day 180에서 각각 10년 실행했다. 단일 전략은 한 번만
  합법적으로 실행해 gate shutoff를 측정했다.
- gameplay, balance, intervention definition/cost/duration, threshold/cadence,
  conflict/T022/T023 semantics, RNG, AI, V02는 변경하지 않았다.

**Evidence**

- 27 branches / 97,200 ticks / final inspection 약 `44,477 ms` / 약
  `2,185 ticks/sec` (wall-clock은 process load에 따라 변동).
- PRE_CRISIS에서 long은 coup eligibility exposure `-3,420` ticks,
  prerequisite는 rebellion exposure `-3,420` ticks를 만들었지만 political
  event/Government/territory/outcome은 WAIT와 같았다. POST_CONFLICT와
  RECOVERY_STRESS에서도 active-conflict history와 recovery 결과는 갈라지지
  않았다.
- 최대 committed load는 60으로 capacity 안에 있었고, accepted cost와
  completion은 정상 accounting을 유지했다. PRE_CRISIS 첫 short의 비용 8은
  net-zero treasury tick에서 `TREASURY_CHANGED`가 생략된 정상 경로로 audit에
  설명되며 `COST_AVOIDANCE`는 발생하지 않았다.
- WAIT vs Repeat Short resource-dimension weak dominance 후보, long/prerequisite
  organization/grievance one-way ratchet 후보, post-conflict intervention
  futility, zero-territory no-recovery가 `MAJOR` concern으로 기록됐다.
- F04 당시(F04A 이전) 단일 Long(cost 20)과 단일 Prerequisite(cost 12)가 각각
  3,420 ticks의 coup/rebellion eligibility exposure를 줄였지만 political
  history는 바꾸지 않아 historical `CHEAP_PERMANENT_GATE_SHUTOFF` 및
  `PRE_CRISIS_TIMING_CLIFF`가 `MAJOR`로 기록됐다.
- 반복 long/prerequisite의 bound no-op은 정상 비용/행정력 아래서 관찰됐고,
  commitment overlap은 legal/capacity-bounded라 exploit으로 판정하지 않았다.

**Decision**

- F05는 `NOT_READY`. 이는 즉시 수정 판정이 아니라 active-conflict lifecycle,
  recovery path, one-way state, WAIT dominance 후보를 먼저 다뤄야 한다는
  evidence-based gate다.
- representative repeated-strategy save/load, strategy order independence,
  F02 WAIT, F03A/F03B regression은 유지됐다.
- F04는 finding을 수정하지 않았고 F05/V02를 시작하지 않았다.

**Verification**

- `pnpm test`: PASS
- `pnpm run typecheck`: PASS
- `pnpm run lint`: PASS
- `pnpm run format`: PASS
- `pnpm run build`: PASS
- `pnpm run inspect:f04`: PASS; direct `vite-node` developer harness,
  F05 `NOT_READY`
- `pnpm run inspect:f02`: PASS
- `pnpm run inspect:f03`: PASS
- `pnpm run inspect:f03b`: PASS
- `pnpm run inspect:t024`: PASS
- `pnpm run inspect:v01`: PASS

**Follow-up**

- Detailed evidence: `docs/F04_DEGENERATE_STRATEGY_EXPLOIT_CHECK.md`
- Next smallest recommendation: targeted diagnosis/repair proposal for the
  observed recovery, active-conflict lifecycle, one-way ratchet, and WAIT
  dominance concerns before F05. No V02 work yet.

### 2026-08-24 — F04A — Endogenous Faction Dynamics / One-Way Ratchet Repair

**Scope**

- F04에서 발견한 `Faction.grievance`/`Faction.organization` one-way ratchet만
  대상으로 기존 `factionPressure` monthly boundary에 최소 endogenous writer를
  추가했다.
- F03A intervention effect, cost, administrative load, prerequisite, duration,
  T017/T018/T021/T022/T023 semantics, RNG, persistence, renderer는 변경하지
  않았다.
- `deriveFactionDynamicsSnapshot()`은 기존 scarcity, unrest, stateControl,
  Country weakness/instability, faction resources/influence, local ideology
  activation만 읽는다. `support`/`currentStrategy` 단독 trigger와 intervention
  ID special case는 없다.

**Implementation**

- grievance는 hostile pressure target을 향해, organization은 resource-capped
  local political target을 향해 기존 monthly boundary마다 최대 `0.02` 이동한다.
- 각 faction은 stable ID 순서로 immutable replacement 된다. target/progress는
  WorldState에 저장하지 않고 monthly state-change event도 만들지 않는다.
- T017/T018/T021은 갱신된 authoritative faction fields를 기존 reader로
  소비한다. F04A writer는 crisis, conflict, Government, LandHex controller,
  consolidation, dissolution을 직접 조작하지 않는다.

**Evidence**

- unit tests에서 hostile grievance rise, stable low-pressure no-forced-rebound,
  strong/weak organization rebuild, bounds, insertion-order independence를
  검증했다.
- `pnpm run inspect:f04a`: State A 9개 tracked branch accepted, horizon state
  difference 9개, long/prerequisite faction effect는 10년 안에 회복,
  one-way-ratchet remaining `NONE`.
- F03/F03B/F04의 현재 fixture에서는 정치 event/Government/territory/outcome이
  WAIT와 여전히 같았다. active-conflict lifecycle, pre-crisis timing, WAIT
  dominance, zero-territory recovery는 해결된 것으로 재분류하지 않았다.
- F04의 `CHEAP_PERMANENT_GATE_SHUTOFF`는 F04A 이후 historical finding으로
  재분류했다. 현재 `inspect:f04`는 이를 발생시키지 않으며, SINGLE_LONG의
  coup eligibility difference는 `149/3601` ticks, SINGLE_PREREQUISITE의
  rebellion eligibility difference는 `0`이다.

**Decision**

- F04A repair slice: `PASS`.
- F04B, F05, V02는 시작하지 않았다.
- F02 no-intervention baseline은 F04A 이후 별도로 재실행해 baseline 오염 여부와
  endogenous dynamics의 영향을 기록한다.

**Verification**

- `pnpm test`: PASS (49 files, 400 tests; long F01/F02/F03/F03B/F04
  inspections excluded from normal CI)
- `pnpm run typecheck`: PASS
- `pnpm run lint`: PASS
- `pnpm run format`: PASS
- `pnpm run build`: PASS
- `pnpm run inspect:t024`: PASS
- `pnpm run inspect:v01`: PASS
- `pnpm run inspect:f03`: PASS; `PLAYER_AGENCY_WEAK` retained
- `pnpm run inspect:f03b`: PASS; existing threshold/cadence diagnosis retained
- `pnpm run inspect:f04a`: PASS; one-way-ratchet remaining `NONE`
- `pnpm run inspect:f04`: PASS; F05 remains `NOT_READY` for separate concerns
- `pnpm run inspect:f02`: PASS — 24 seeds / 345,600 ticks / 137.79 s;
  `24/24 active`, political/territorial distribution unchanged, exact/coarse
  signature `1/1`, largest cluster `24/24`, seed sensitivity not observed
- F02 WAIT regression shows no-intervention history contamination; treasury and
  stateCapacity stasis, zero-territory final-active, and long silence remain

---

## F04B — Active Conflict Response / Internal Recovery Agency Repair — 2026-08-24

**Scope**

F04B는 F04의 active-conflict futility와 zero-territory recovery deadlock만
보완했다. 새 intervention, balance tuning, RNG, Army/unit, foreign recovery,
T022/T023, F05, V02는 시작하지 않았다.

**Implementation**

- T021 weekly resolver가 active rebellion의 현재
  `Faction.organization`/`resources`와 local activation을 계속 읽도록 현재
  operational-state 회귀를 추가했다. occupied rebellion은 grievance 감소만으로
  삭제하지 않는다
- Country가 모든 LandHex를 잃은 경우, active internal rebellion에 한해 valid
  Government, current Country `militaryPower`, affected Region의 positive
  `stateControl`, current faction operational strength를 비교하는
  `governmentRecovery` intent를 추가했다
- 기존 `changeLandHexController()`로 주간 boundary마다 최대 한 Hex만 회복하며,
  Region owner는 controller authority가 아니다. coup/foreign war와 T022/T023은
  영향을 받지 않는다

**Evidence**

- strong residual fixture: `stateControl 0.800`, government strength `80`,
  faction strength `61.538`에서 정확히 1개 Hex 회복, rebellion active 유지
- weak residual fixture: `stateControl 0.100`에서 회복 intent/Hex 변경 없음
- occupied-rebellion persistence, current organization/resources response,
  coup/foreign exclusion, one-Hex limit, insertion-order, save/load equivalence:
  PASS
- `pnpm run inspect:f02`: 24 seeds / 345,600 ticks / 157.67 s;
  `24/24 active`, rebellion/coup/territory `1/1/1`, `1/1/1`, `3/3/3`,
  exact/coarse signature `1/1`, largest cluster `24/24`, seed sensitivity 없음

**Decision**

- F04B implementation: `PASS`, Terra targeted architecture review pending
- F04의 WAIT dominance, pre-crisis timing cliff, intervention cost/agency,
  weak-state stalemate는 해결된 것으로 재분류하지 않음
- F05 remains `NOT_READY`; next step is Terra review, not F05/V02

**Verification**

- F04B conflict tests: PASS (18 tests)
- F04B inspection tests: PASS (2 tests)
- F02 full WAIT regression: PASS

### 2026-08-24 — F04C — Institution-Mediated Stabilization Design

**Scope**

- 현재 `InstitutionalRuleState`, Policy/Intervention, Government, Faction,
  Region, T016/T017/T018/T021/T022의 실제 source consumer를 inventory했다
- F04에서 남은 WAIT dominance, pre-crisis timing cliff, 체제별 대응 차이
  부족을 해결하기 위한 institution-mediated stabilization design만 작성했다
- gameplay code, balance, threshold, RNG, war, fantasy, F04D, F05, V02는
  변경하거나 시작하지 않았다

**Design output**

- 안정화 channel을 material, representation, elite bargain, organization
  integration, coercion, administrative penetration, military/security,
  ideological/constitutional legitimacy로 분리했다. 새 stability meter는
  추가하지 않았다
- 강한 왕정, 입헌군주정, 민주공화정, 권위주의/개인독재, 군사독재,
  공산주의 일당국가를 독립 institutional axes의 조합으로 비교했으며,
  최종 regime taxonomy와 authoritative regime field는 lock하지 않았다
- 20개 action archetype에 실제 target state, institution availability,
  cost, factional counter-reaction, phase 역할, 현재 표현 가능성을 매핑했다
- War as Politics는 향후 domestic political consequence의 slot으로만
  설계했다. military faction, manpower, logistics, foreign war는
  NEW DOMAIN/DEFER로 남겼다
- 핵심 판타지 정치축은 Arcane Privilege / Mage Guild, optional secondary는
  Sacred / Supernatural Sovereignty로 추천했다. prophecy, races, magic
  combat bonus, lore soup는 defer했다

**Decision**

- F04D `REQUIRED`: `politicalCompetition` 하나의 작은 institutional dimension
  후보와 material relief, political amnesty, opposition legalization, labor
  legalization/bargaining, censorship/assembly restriction 중 4~5개를 기존
  canonical action/effect → T016/T017/T018 consumer seam에 연결하는 최소
  implementation을 추천한다
- 선거, 군부 정치, 지방자치, arcane privilege는 현재 source가 표현할 수
  없는 범위로 정직하게 분류했다
- F05는 F04D와 counterfactual 재검증 전까지 `NOT_READY`, V02는 기존
  `V01 → F01–F05 → V02` 순서를 유지한다

상세 문서: `docs/F04C_INSTITUTION_MEDIATED_STABILIZATION_DESIGN.md`

**Verification / scope**

- 문서-only task; production simulation authority와 persistence schema 불변
- docs format, 기존 test/typecheck/build를 변경 후 실행
- new ADR 없음: F04C는 design recommendation이며 irreversible architecture
  decision은 F04D implementation review에서 별도 판단

### 2026-08-24 — F04C-R — Political / Historical Reference Grounding

**Scope**

- F04C가 제안한 material relief, political amnesty, opposition legalization,
  labor bargaining, censorship/assembly restriction을 공식 법률·archive·국제기구
  자료·학술 연구와 대조했다
- docs/research only로 수행했으며 gameplay, balance, RNG, source schema, F04D,
  F05, V02는 변경하거나 시작하지 않았다

**Findings**

- Bismarck와 New Deal 자료는 material provision이 조직 해체와 같지 않고,
  coverage·행정 배분·재정 비용이 mechanism을 바꾼다는 점을 뒷받침한다
- Spain과 South Africa 자료는 amnesty를 법적 처벌·권리·기록 처리로,
  opposition legalization을 조직의 공개 활동 arena 변화로 구분하게 한다
- Sweden 자료는 노동조직을 없애지 않고 교섭·중재로 conflict를 채널링할 수
  있음을 보이지만, 현재 TMR에는 full bargaining consumer가 없다
- Germany·Britain·GDR 자료는 repression의 단기 visibility 효과와 underground
  adaptation/재집결을 함께 보여준다
- `politicalCompetition`은 민주주의 점수가 아니라 독립 정치조직의 합법적
  조직·경쟁 접근성으로 좁히면 `banned | restricted | plural` ADD가 타당하다

**Decision**

- F04D 최소 action set: material relief, 제한된 political
  amnesty/accommodation proxy, opposition legalization, coercive restriction
- full amnesty/transitional justice, elections, party system, full labor
  bargaining, military faction, war, arcane privilege는 NEW DOMAIN/DEFER
- F04C 설계 문서는 source-grounding 결과에 맞춰 amnesty를 제한 proxy로 정렬하고
  `politicalCompetition`을 F04D narrow ADD 후보로 정렬했다

상세 문서: `docs/F04C_R_POLITICAL_HISTORICAL_REFERENCE_GROUNDING.md`

**Verification / scope**

- source ledger, case limitation, TMR fit, F04D counterfactual plan을 문서에 기록
- code/test/inspection 변경 없음; F04D와 F05는 시작하지 않음

### 2026-08-24 — F04D — Narrow Institution-Action Implementation

**Scope**

- `politicalCompetition = banned | restricted | plural`을 required institutional
  rule로 구현하고 기존 BARGAIN availability에 연결했다
- material relief, 제한된 political accommodation, opposition legalization,
  coercive restriction 네 developer-validation response를 기존 Intervention
  lifecycle에 연결했다
- election/party/full bargaining/transitional justice/military/war/fantasy/F05/
  V02는 구현하지 않았다

**Implementation**

- typed `institutionalRuleSet` completion effect, `ruleNotEquals` prerequisite,
  no-op completion guard를 추가했다
- institution completion은 PolicyState를 immutable replacement하고 기존
  completion event를 원인으로 갖는 `INSTITUTION_RULE_CHANGED`를 기록한다
- relief는 food capacity, accommodation은 grievance, legalization은 competition과
  상반된 faction grievance, coercion은 press/competition과 bounded
  organization/grievance를 바꾼다
- snapshot format은 version 2로 전환했다. version 1과 missing/invalid
  competition은 strict deserialize boundary에서 거부한다

**Counterfactual**

- seed 40103, tick 0, 720-day horizon에서 banned/plural same-state pair의
  BARGAIN·legalization eligibility와 coup/rebellion/territory history가 갈라졌다
- WAIT와 네 response 모두 서로 다른 history를 만들었다. 어떤 branch도
  Government transition 또는 terminal consolidation을 직접 만들지 않았다
- continuous run과 day-360 save/load continuation, branch insertion order가
  canonical comparison에서 일치했다
- no-op repeat는 거부되고 repeated start는 treasury/headroom으로 bounded였다.
  WAIT dominance, cheap permanent gate shutoff, one-way ratchet, pre-crisis timing
  cliff는 이 slice에서 나타나지 않았다

상세 문서: `docs/F04D_INSTITUTION_ACTION_IMPLEMENTATION.md`

**Verification**

- `pnpm install --frozen-lockfile`: PASS
- `pnpm run format`: PASS
- `pnpm run typecheck`: PASS
- `pnpm run lint`: PASS
- `pnpm run build`: PASS
- `pnpm run inspect:t024`: PASS
- `pnpm run inspect:v01`: PASS
- `pnpm run inspect:f01`: PASS
- `pnpm run inspect:f04d`: PASS
- `pnpm test`: PASS — 51 files / 421 tests
- F04: ready for overall assessment
- F05 / V02: not started

### 2026-08-24 — F04B + F04D Targeted Architecture / Gate Review

**Review result**

- actual source and uncommitted F04D worktree reviewed; gameplay/source changes by
  review: none
- F04B current-state active-conflict response, internal zero-territory recovery,
  LandHex authority, foreign/coup exclusion, insertion order, and save/load: PASS
- `politicalCompetition` ownership, required enum/default, BARGAIN availability,
  typed Intervention institution mutation, event provenance, and snapshot V2: PASS
- banned/plural comparison attribution narrowed: later crisis difference comes from
  the same legalization attempt being accepted only in the non-plural branch, not
  from a hidden BARGAIN stability effect
- hidden F04D ID/scenario/strategy branches in downstream systems: none found

**Gameplay finding**

- political accommodation treasury `500 → 2447` is explained by retaining three
  controlled Hexes until day 300; WAIT loses them by day 49. The action delays but
  does not remove crisis and preserves opposition organization
- dominance/trade-off magnitude is `ACCEPTED_FOR_F04 / F05_MEASUREMENT`, not an
  architecture fix. No balance constants or new political domain were added
- neighboring checks at industrial unrest `0.18` and treasury `510` retained the
  qualitative response divergence

**Verification / gate**

- install, format, typecheck, lint, build: PASS
- inspect:t024, inspect:f01, inspect:f04b, inspect:f04d: PASS
- full tests: 51 files / 421 tests / 0 assertion failures
- `REQUIRED_FIX_BEFORE_F04_CLOSE`: NONE
- F04: `PASS / CLOSED`
- F05: `READY / NOT STARTED`; political accommodation and broader WAIT/timing are
  F05 measurement notes
- commit/push and Bridge setup: not executed

Detailed record: `docs/F04_TARGETED_ARCHITECTURE_GATE_REVIEW.md`
