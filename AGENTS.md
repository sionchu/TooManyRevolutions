# AGENTS.md

## 0. Source of Truth

Before making gameplay, simulation, AI, UI/UX, art, architecture, or scope decisions, read:

- `docs/GDD.md`
- `docs/ARCHITECTURE.md`

For test or playtest work also read:

- `docs/QA_PLAYTEST.md`

`docs/GDD.md` is the authoritative product/design specification.
`docs/ARCHITECTURE.md` is authoritative for implementation boundaries.

If implementation convenience conflicts with the GDD, do not silently redesign the product.
Record the conflict in `docs/DECISIONS.md` and propose the smallest safe alternative.

---

## 1. Product Identity

Build a browser-native systemic fantasy state simulation game.

The player controls the **historical continuity of a state**, not an individual ruler.

Regime changes, revolutions, coups, elections, civil wars, dynastic collapse, and loss of office are gameplay events rather than automatic game-over conditions.

### Victory

Establish a functioning new order:
- required regions stabilized,
- capital/core state functions controlled,
- no active terminal civil-war state,
- minimum state capacity and solvency satisfied,
- consolidation maintained for the configured period.

### Defeat

The state ceases to exist as an independent political community:
- full annexation,
- permanent fragmentation beyond recovery,
- loss of sovereign state functions,
- or an explicitly defined terminal dissolution condition.

Never redefine victory as "ideology reaches 100%."

---

## 2. Core Game Principles

1. **WORLD FIRST.**
2. **THE MAP IS THE GAME BOARD.**
3. **POLICIES CHANGE WHAT PEOPLE DO.**
4. **SYSTEMS CREATE EVENTS.**
5. **PLAYER ACTION MUST PRODUCE VISIBLE CONSEQUENCES QUICKLY.**
6. **FAST OBSERVATION, SLOW DECISION.**
7. Avoid `READ -> BUTTON -> READ -> REPORT` gameplay.
8. Reports explain; the world demonstrates.
9. There is no universally correct political system.
10. Use historically meaningful names directly when appropriate: monarchy, republic, democracy, dictatorship, communism, capitalism, feudalism, revolution, etc.
11. Do not flatten specific political concepts into vague AI euphemisms.
12. Political outcomes must emerge from rules, incentives, organizations, material conditions, and actor behavior.
13. The player must be able to ask "WHY?" and get an explanation derived from actual recorded simulation events.

---

## 3. Simulation Authority

The deterministic simulation core is authoritative.

LLMs must NOT directly mutate:
- treasury,
- population,
- production,
- prices,
- resources,
- military strength,
- territorial control,
- state capacity,
- political support,
- radicalism,
- organization,
- ideology diffusion,
- rebellion outcome,
- war outcome,
- victory/defeat.

Correct flow:

`Observation -> Agent decision -> Structured action proposal -> Validation -> Simulation resolution -> Event log -> Presentation`

LLM text is never authoritative game state.

---

## 4. AI Usage Rules

AI must create **behavior**, not filler.

Good uses:
- faction chooses whether to protest, bargain, strike, hoard, lobby, fund rebels, compromise, defect;
- foreign state chooses whether to trade, sanction, support a faction, mobilize, intervene;
- actors update beliefs from limited information;
- selected actors adapt to loopholes or changing rules.

Bad uses:
- arbitrary story event generation;
- inventing numeric outcomes;
- long NPC conversations required to understand the game;
- replacing deterministic systems with prose;
- generating post-hoc fake causal explanations.

Free-form dialogue is secondary and optional.

Every AI action must be schema-valid and have a deterministic fallback heuristic.

The game must remain playable if AI calls fail or are disabled.

---

## 5. Political Model

Country-level core parameters should remain small and readable.

Default national metrics:
- treasury,
- legitimacy,
- stateCapacity,
- production,
- militaryPower,
- instability.

Each region has local properties such as:
- population,
- urbanization,
- accessibility,
- resources,
- production,
- stateControl.

Each ideology/political tendency uses at minimum:
- support,
- radicalism,
- organization.

Ideology diffusion must use causal connections:
- trade,
- migration,
- refugees,
- press/information,
- war,
- diplomacy,
- political organizations,
- religious networks,
- prestige/success of foreign regimes.

Avoid arbitrary global "+10 ideology" effects when a causal route can be represented.

### Intervention Resource Guardrail

Do not introduce a universal policy/reform/political mana currency by default.

Player intervention should be constrained by concrete state such as:

- treasury,
- state capacity / administrative headroom,
- institutional legality,
- faction and government opposition/support,
- implementation time.

`stateCapacity` is not a consumable mana pool.

If administrative workload is implemented, prefer committed capacity and derived
available headroom over permanently spending stateCapacity points.

Policies change rules.
Money pays costs.
State capacity limits simultaneous execution.
Politics determines what can be passed or resisted.
Time determines when implementation becomes real.

---

## 6. Time and Pacing

The game uses:
- pause,
- 1x,
- medium acceleration,
- high acceleration.

Default play rhythm:
`OBSERVE -> INTERVENE -> ACCELERATE -> NOTICE -> PAUSE/SLOW -> UNDERSTAND -> INTERVENE`

Target responsiveness:
- immediate visual feedback: under ~2 seconds where possible,
- first-order consequence: ~3–8 seconds at normal demo pacing,
- agent/faction adaptation: ~5–15 seconds,
- second-order consequence: ~15–30 seconds,
- meaningful major pressure: generally within ~30–60 seconds.

Do not create long periods where nothing legible changes.

---

## 7. Web and Responsive Rules

This is a browser-native game.

Core gameplay must support:
- desktop,
- tablet,
- mobile.

Do not shrink desktop UI into mobile.

Use the same simulation state with different composition patterns:

Desktop:
- world view + persistent side inspector.

Tablet:
- world view + adaptive sheet/overlay.

Mobile portrait:
- world view + bottom sheet/focused drill-down.

Requirements:
- Pointer Events compatible,
- touch targets sized appropriately,
- safe-area support,
- `dvh/svh` aware,
- responsive via CSS/container queries where useful,
- no mandatory hover-only controls,
- no body-scroll-driven core gameplay.

---

## 8. Browser Technology Policy

Core gameplay must rely on stable browser capabilities.

Preferred baseline:
- DOM/CSS UI,
- WebGL renderer,
- stable Three.js/R3F path.

Optional progressive enhancement:
- WebGPU,
- HTML-in-Canvas,
- advanced post-processing,
- experimental browser APIs.

Experimental APIs must never be required for:
- game rules,
- input,
- save/replay,
- core UI readability,
- competition build viability.

Always provide a stable fallback.

---

## 9. Engineering Rules

Prefer:
- TypeScript,
- explicit domain types,
- pure simulation functions where practical,
- seeded PRNG,
- deterministic ticks,
- event-sourced consequences,
- snapshots/replay,
- renderer-independent domain logic,
- small modules,
- automated tests for simulation invariants.

Simulation code must not import React or rendering modules.

UI components must not contain authoritative political/economic calculations.

Renderer must consume presentation state, not decide game outcomes.

Do not create giant stores or giant God objects.

---

## 10. Secrets and AI Backend

Never expose OpenAI or other model API keys in the browser bundle.

AI calls must go through:
- server,
- serverless function,
- edge function,
- or an equivalent trusted backend.

Client sends bounded observation payloads.
Server returns schema-validated action proposals.

No sensitive secret belongs in client source, static assets, localStorage, or public env variables.

---

## 11. Development Gates

### Gate 0 — Project Foundation

- Vite + React + TypeScript
- tests
- lint/format
- seeded RNG
- tick skeleton
- domain types
- event model
- build passes

### Gate 1 — Headless Fun Prototype

Implement without final world art:

- countries,
- regions,
- policy rules,
- ideology diffusion,
- factions,
- instability,
- rebellion/coup/civil-war pressure,
- diplomacy,
- foreign influence/intervention,
- simplified conflict/war pressure,
- treasury/state capacity,
- victory/defeat,
- event log,
- snapshots/replay.

### Gate 1F — Headless Fun Gate

Do not advance unless:

- policy choices create trade-offs,
- consequences are surprising but explainable,
- the simulation can generate different histories from different choices,
- the player has reasons to accelerate and reasons to pause,
- a 5–10 minute run has a readable arc.

### Gate 1V — Visual Simulation Validation

Do not advance directly from headless simulation to polished game UI or final art.

Before Gate 2, validate the running simulation through a developer-only
strategy-map / LandHex timelapse view.

The purpose of this gate is to verify that simulation history is spatially
readable and interesting before HUD, menus, event illustrations, opening,
ending, and final map art are built.

The debug visualization should expose actual simulation state such as:

- country boundaries,
- Region boundaries,
- LandHex territorial control,
- political influence,
- ContactGraph routes,
- faction / political organization presence,
- military or revolutionary presence,
- front lines,
- simulation date,
- important recent events.

The visualization is a client of authoritative simulation state.

It must NOT:

- mutate `WorldState`,
- contain authoritative game rules,
- implement a second simulation,
- skip simulation ticks to fake timelapse results,
- invent political organizations or territorial changes for presentation.

Developer playback may run much faster than player-facing time controls,
but it must execute the same authoritative simulation steps.

Before passing this gate, perform:

- long-run timelapse review,
- multi-seed visual review,
- same-seed counterfactual comparison.

Do not advance unless:

- political influence visibly spreads through plausible contact paths,
- direct-contact Regions change before more isolated inland Regions,
- organization becomes visible before major political crises where applicable,
- military invasion and political influence are visually distinguishable,
- territorial fronts visibly advance or retreat across LandHex cells,
- major crises do not appear disconnected from prior visible conditions,
- different runs do not look like the same scripted history,
- important map changes can be understood without reading long reports,
- watching the simulation map itself is interesting enough to justify building the final UX.

If this gate fails, improve simulation behavior or map presentation before
adding polished HUD, menus, cinematics, event art, or final visual assets.

### Gate 2 — Graybox World UX

- strategy map,
- Region / LandHex state presentation,
- time controls,
- Region inspector,
- political lens,
- instability lens,
- trade / foreign influence view,
- WHY / causal inspection,
- victory / defeat pressure UI.

### Gate 3 — Agent AI Proof

Add only selected AI decisions:

- faction agents,
- foreign-state agents,
- optional focus citizens.

Never put LLMs on every citizen tick.

### Gate 4 — Map Art / World Signals

Polish the already validated strategy-map gameplay surface.

- terrain / Region visual identity,
- POIs,
- political organization visuals,
- trade / information / migration movement,
- troops and revolutionary forces,
- front-line presentation,
- protests,
- closures,
- soldiers,
- queues,
- refugees,
- banners,
- market / trade activity.

The main strategy map remains the primary gameplay surface.

Do not introduce mandatory nested mine/port/city gameplay scenes.

### Gate 5 — Responsive / Performance

- desktop/tablet/mobile,
- performance budgets,
- touch validation,
- accessibility,
- asset optimization.

### Gate 6 — Competition / Release Polish

Only after the core map experience is validated:

- title screen,
- scenario selection,
- scenario opening,
- first-run onboarding,
- critical-event presentation,
- ending presentation,
- history/result report,
- final menu/settings polish,
- production deployment,
- submission capture/materials.

Opening and critical-event presentation must describe or present actual
scenario/state conditions.

They must not introduce fixed story progression or predetermined outcomes.

## 12. Fun Gate

Passing tests is not success.

Always evaluate:
- Immediate Read
- Speed
- Agency
- Trade-off quality
- Surprise
- Causality
- AI Necessity
- Replay Desire
- World Appeal
- Cognitive Load

If headless gameplay is not interesting, do not compensate with more art, dialogue, lore, or AI-generated content.

---

## 13. Documentation

Maintain:
- `docs/GDD.md`
- `docs/ARCHITECTURE.md`
- `docs/QA_PLAYTEST.md`
- `docs/REFERENCES.md`
- `docs/DECISIONS.md`
- `docs/CODEX_DEVLOG.md`
- `docs/BACKLOG.md`

For significant architectural decisions record:
- problem,
- decision,
- alternatives,
- rationale,
- reversal cost,
- date.

---

## 14. Codex Working Style

Before implementation:
1. read relevant docs,
2. inspect current code,
3. state the implementation boundary,
4. implement the smallest coherent slice,
5. run tests,
6. run production build if relevant,
7. verify behavior,
8. update docs when architecture changed.

Do not silently expand scope.
Do not build speculative systems because they "might be useful later."
Favor playable vertical slices over framework-building.

# AGENTS Language & Product Terminology Patch

> Apply this patch **after the current Gate 0 / T001–T005 Codex run finishes**.
> Do not interrupt an in-progress implementation turn just to apply this patch.

## Where to apply

Append the following section near the end of the repository-root `AGENTS.md`.

---

## 15. Language Policy

### Default response language

- Respond to the user in **Korean** unless the user explicitly requests another language.
- Implementation summaries, QA reports, architecture explanations, playtest findings, and task completion reports should be written in Korean.
- Do not translate code identifiers merely to make them Korean.

### Technical language

The following may remain in English where conventional:

- code identifiers
- filenames
- class/type/interface names
- API names
- library/framework names
- CLI commands
- Git terminology
- standard engineering terminology where Korean translation would reduce precision

Examples:

- `WorldState`
- `RegionState`
- `IdeologyState`
- `advanceTick()`
- `event log`
- `seeded RNG`
- `React Three Fiber`
- `WebGPU`

### Player-facing language

Unless explicitly designing another locale:

- Player-facing UI copy should be authored in **Korean first**.
- Tutorial text, alerts, policy names, political concepts, result screens, causal explanations, and end-of-run history should use natural Korean.
- Do not ship placeholder English text as final player-facing copy.

### Political and historical terminology

Use established political and historical names directly.

Preferred examples:

- 왕정
- 절대왕정
- 입헌군주정
- 공화정
- 상인공화정
- 민주주의
- 직접민주주의
- 독재정
- 군사독재
- 일당독재
- 공산주의
- 사회주의
- 자본주의
- 봉건제
- 신정
- 혁명
- 반혁명
- 쿠데타
- 내전
- 국유화
- 사유재산
- 토지개혁

Do **not** automatically replace specific terms with vague euphemisms.

Bad examples:

- 공산주의 -> "집단적 경제 체제"
- 독재정 -> "중앙집권적 통치 방식"
- 혁명 -> "급격한 제도 변화"
- 봉건제 -> "전통적 토지 기반 체제"

If a mechanic specifically concerns a narrower subsystem such as 중앙계획, 시장가격, 생산수단 소유, 검열, 보통선거, or 지방자치, use that precise subsystem term **in addition to**, not as a replacement for, the larger historical/political concept.

### Ideological neutrality

The simulation must not silently encode a predetermined ideological conclusion in prose.

Avoid language such as:

- "민주주의는 자연스럽게 더 발전된 체제다."
- "공산주의는 필연적으로 생산성을 낮춘다."
- "독재정은 언제나 안정적이다."
- "왕정은 낡은 체제다."

Instead:

- define actual rules,
- simulate incentives and constraints,
- let outcomes emerge,
- explain the causal chain that actually occurred in the run.

### Anti-AI-slop writing rule

When writing game design, UI copy, or simulation explanations:

1. Prefer concrete nouns and actions over abstract management language.
2. Preserve the historically meaningful name of the institution or ideology.
3. Avoid generic AI phrases such as:
   - "사회적 역학"
   - "복합적 이해관계"
   - "다양한 요인이 작용"
   unless the concrete factors are immediately named.
4. Prefer:
   - "귀족이 토지 몰수에 반발해 군부와 접촉했다."
   over:
   - "기득권 세력이 제도 변화에 부정적으로 반응했다."
5. Prefer:
   - "상인공화국과의 무역을 통해 항구 노동자에게 공화주의가 퍼졌다."
   over:
   - "외부 정치적 영향이 지역 사회에 확산되었다."

### Translation consistency

When a Korean player-facing term is established in `docs/GDD.md`, reuse that term consistently.

Do not create multiple synonyms for the same system merely for stylistic variation.

Example:

If the GDD defines:
- `국가역량`

do not alternate between:
- 행정력
- 국가 수행능력
- 통치 효율
- 국가 운영력

unless these are intentionally different mechanics.

### Procedural Political Press / Gazette

The existing Language Policy and Anti-AI-slop writing rule apply to the
political press and gazette as well. Press copy must use recorded simulation
facts, actual actors/actions, and exact political or historical terminology.
It must not invent events, numbers, actors, or causal explanations, or replace
terms such as 쿠데타, 혁명, 독재정, 공산주의, 검열, or 비밀경찰 with vague
euphemisms. The default runtime press is deterministic and does not require an
external AI/API; development-time AI authoring is only a reviewed content
drafting aid.

---

## 16. Human-facing Codex Reports

At the end of implementation tasks, report in Korean:

1. 무엇을 구현했는지
2. 어떤 파일을 변경했는지
3. 어떤 테스트/빌드를 실행했는지
4. 결과가 어땠는지
5. 남은 위험이나 미해결 사항
6. 다음으로 권장하는 가장 작은 작업

Do not expose hidden chain-of-thought.
Provide concise engineering rationale and observable evidence only.

## Emergent History Guardrail

Do not implement fixed story progression for core gameplay.

Core rule:

**Player choices change state, not story nodes.**
**Events are detected, not scheduled.**

Forbidden core patterns:

- policy A -> schedule event B
- chapter-based mandatory revolution
- fixed coup after N days
- predetermined regime-transition sequence
- hidden `storyProgress` controlling simulation outcomes

Allowed:

- fixed scenario initial conditions
- fixed world rules
- fixed victory/defeat conditions
- tutorial-only presentation scripting that does not force simulation outcomes

Policies must mutate institutional/world state.

Events such as:
- strikes
- coups
- revolutions
- civil wars
- foreign intervention

must emerge from current simulation conditions and event detectors.

Agenda items must also be derived from current simulation pressure, not authored as a fixed quest chain.

## Territorial Map Guardrail

Do not simplify the strategy map to one Region = one Hex.

Locked model:

- Region = political/economic/social aggregate
- LandHex = territorial/movement/control substrate

A Region is represented by one or more LandHex cells.

The architecture and gameplay must support multiple LandHex cells per Region.
Do not assume or optimize around a 1:1 Region-to-Hex mapping.

`Region.stateControl` is administrative reach and is not the same value as physical LandHex territorial control.

Do not move all ideology/economy simulation to LandHex level without an explicit architecture decision.

Do not create separate gameplay scenes for mine/port/farm/city POIs by default.

POIs should normally remain visible or inspectable directly from the strategy map.

Keep these concepts separate:

- legal ownership
- territorial control
- political influence

Political influence may change without territorial control changing.

Military occupation or revolutionary occupation may change LandHex controller.

ContactGraph and TerritorialTopology are separate systems.

### Visual Simulation Gate

Do not jump directly from headless simulation to polished game UI/art.

Before final strategy-map UX work, validate the simulation through a
developer-only HEX/LandHex timelapse view.

The debug visualization must remain a client of authoritative simulation state.

Do not hide weak simulation behavior behind:

- polished HUD,
- event illustrations,
- scripted cinematics,
- generated prose,
- final art.

The map should already produce readable and interesting change
before final presentation polish.

### Visual Simulation Guardrail

Do not hide weak simulation behavior behind polished UI or art.

Before final game UX and art production, the simulation must be reviewed
through a developer-only LandHex strategy-map timelapse.

The map should already communicate meaningful political and territorial change
before title screens, event illustrations, cinematics, or final HUD polish are added.

### Visual implementation operational rules

- Presentation may not invent authoritative simulation entities or outcomes; if it
  looks like simulation truth, derive it from recorded state/event evidence.
- Visual implementation should reuse the approved TMR grammar, semantic channels,
  and primitives documented in `docs/VISUAL_BIBLE.md` rather than inventing a new
  panel/icon language for each screen.
- External/custom/kitbash assets require provenance, license verification,
  normalization, and the common acceptance gate before production use. Downloaded
  or AI-generated output is not automatically accepted.

---

## 17. Repository-grounded review

When a GitHub connector or equivalent repository access is actually available,
reviewers should prefer repository evidence—source, search, diff, tests, CI, and
history—over implementation-summary claims. Do not imply that a connector or
repository access is available when it is not.

Repository review should begin with the minimum permissions needed for
inspection, preferably read-only repository/code/PR/diff/CI access. Automatic
merge, unrestricted writes, branch deletion, and destructive operations are not
required for the review workflow. Repository access is a development review
workflow, not a runtime game dependency.

## 18. Manual development-model routing

The current TMR workflow is manual and evidence-driven:

- Luna is the default for bounded implementation, docs-only work, formatting,
  tests, inspections, fixtures, and clear local fixes.
- Terra is used for authority migration, schema ownership, replay boundaries,
  partial-state semantics, complex refactors, and architecture-sensitive review.
- Sol is reserved for unexplained determinism/replay divergence, conflicting
  contracts, security or model-authority boundaries, and difficult cross-system
  root-cause analysis.

Escalate for reasoning and de-escalate for execution when evidence supports it. This
does not install an automatic router or guarantee result quality. Repository evidence,
acceptance tests, inspections, and human/product judgment remain required; tests must
not be skipped because a stronger model was used. External router references must not
inject unrelated project context into TMR.
