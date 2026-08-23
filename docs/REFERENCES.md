# External References — Repos, Frameworks, MCP, APIs

This file is a **reference/inspection list**, not a dependency list.
Do not install everything.

Always check current license, maintenance status, version compatibility and security before adoption.

---

# 1. Runtime / Web Game

## React Three Fiber
https://github.com/pmndrs/react-three-fiber

Use:
- React integration for Three.js world rendering.

Adoption:
- likely core dependency.

## Drei
https://github.com/pmndrs/drei

Use:
- R3F helpers, camera/assets/utilities.

Adoption:
- selective.

## Zustand
https://github.com/pmndrs/zustand

Use:
- lightweight client/UI orchestration.

Rule:
- not authoritative simulation state by default.

## glTF Transform
https://github.com/donmccurdy/glTF-Transform

Use:
- GLB/glTF optimization, texture/mesh pipeline.

---

# 2. Agent / Social Simulation Research Repositories

## Generative Agents
https://github.com/joonspk-research/generative_agents

Learn:
- memory, reflection, planning architecture.

Do not:
- copy full architecture into every citizen.

## Google DeepMind Concordia
https://github.com/google-deepmind/concordia

Learn:
- agent intent vs authoritative environment separation.

Strong conceptual match:
- agent proposes; simulation resolves.

## AgentSociety
https://github.com/tsinghua-fib-lab/AgentSociety

Learn:
- large-scale social agent experimentation,
- replay/experiment architecture,
- macro social simulation ideas.

Do not:
- embed entire research framework in browser runtime without need.

## AI Town
https://github.com/a16z-infra/ai-town
and/or maintained project forks such as:
https://github.com/AITownFun/ai-town

Learn:
- JS/TS agent game loops,
- asynchronous model decisions.

Check current active upstream before using code.

## Ensemble
https://github.com/ensemble-engine/ensemble

Learn:
- rules-based social simulation/social physics,
- social behavior that can work without LLMs.

---

# 3. OpenAI Runtime

## OpenAI Agents SDK — JavaScript/TypeScript
https://github.com/openai/openai-agents-js

Potential use:
- structured faction/foreign-state agent orchestration,
- tool/action schemas,
- tracing.

Rule:
- game state remains authoritative in our simulation.

Model calls must occur server-side or through trusted backend infrastructure.

---

# 4. MCP / Development Tooling

## Chrome DevTools MCP
https://github.com/ChromeDevTools/chrome-devtools-mcp

Use:
- console/network/performance inspection,
- browser automation/debugging,
- experimental browser feature validation.

Priority:
- high.

## Playwright MCP
https://github.com/microsoft/playwright-mcp

Use:
- browser regression,
- responsive viewport checks,
- interaction testing.

Also evaluate regular Playwright tests/CLI where simpler.

Priority:
- high.

## Figma MCP
Official docs:
https://developers.figma.com/docs/figma-mcp-server/

Use:
- responsive HUD/sheet/lens design iteration,
- design-to-code context.

Priority:
- medium.

## Blender MCP
Community project example:
https://github.com/ahujasid/blender-mcp

Use:
- signature props,
- low-poly asset edits,
- export iteration.

Rule:
- community dependency; review before trust.

Priority:
- medium/optional.

---

# 5. Experimental / Modern Browser APIs

## HTML-in-Canvas proposal
https://github.com/WICG/html-in-canvas

Potential use:
- diegetic law document,
- in-world HTML texture/effects,
- shader-distorted real UI.

Policy:
- experimental only.
- core gameplay cannot depend on it.
- feature detection + fallback required.

## WebGPU

Use:
- optional advanced effects/compute later.

Policy:
- WebGL baseline for initial competition build unless current browser/support matrix proves otherwise.
- no core gameplay dependency.

---

# 6. Asset Sources

## Kenney
https://kenney.nl/

Candidate:
- coherent low-poly/fantasy base assets.

Always verify exact pack license, even when expected CC0.

## KayKit
https://kaylousberg.com/game-assets

Candidate:
- coherent stylized low-poly environment assets.

Do not mix visual packs without art-direction review.

---

# 7. Simulation Ideas / Research Concepts to Review

Research topics:
- Generative Agents: memory/reflection/planning
- Agent-based social simulation
- Sugarscape-style emergent macro behavior
- social physics / Ensemble
- political contagion / diffusion through networks
- rebellion requiring support + radicalism + organization
- event sourcing / deterministic replay for simulation games

Rule:
research informs the model; it does not replace playtesting.

---

# 8. Game Design References

## Plague Inc.
Study:
- speed controls,
- readable global spread,
- tight win/loss pressure,
- rapid feedback.

Do not copy:
- ideology = disease framing.

## Rebel Inc.
Study:
- region-level stabilization,
- insurgency pressure,
- national pressure resource,
- civil/military trade-offs.

## Civilization
Study:
- legible world states,
- recognizable political terminology,
- diplomacy readability.

Do not copy:
- governments as simple bonus packages.

## Victoria series
Study:
- political groups,
- support/radicalization,
- revolutions,
- state politics linked to external affairs.

Do not copy:
- excessive simulation granularity for this project's pacing.

## Tiny Glade / Dorfromantik
Study:
- diorama appeal,
- compact visual world,
- readable spatial composition.

---

# 9. Adoption Rule

Before adding an external dependency, record in `DECISIONS.md`:
- why we need it,
- what problem it solves,
- size/performance cost,
- license,
- maintenance risk,
- fallback/removal cost.

MCPs are development tools and should not become runtime dependencies.

---

# 10. Strategic AI Planning / Forward-Model Research

These references are research, reuse, spike, or evaluation candidates only. They are
not current runtime dependencies. The authoritative `WorldState` simulation remains
the only forward model for TooManyRevolutions planning.

## boardgame.io MCTSBot

Repository:  
https://github.com/boardgameio/boardgame.io

MCTS source:  
https://github.com/boardgameio/boardgame.io/blob/main/src/ai/mcts-bot.ts

- License reference: MIT; re-check the repository license and attribution requirements
  immediately before copying or depending on code.
- Useful concepts: UCT selection, expansion, rollout, backpropagation, seeded search,
  iteration budget, and playout-depth budget.
- Status: reuse/dependency candidate for a future T025B comparison only.
- Boundary: do not adopt boardgame.io as the game engine or create a second state
  authority. If used, it must call a TMR planning adapter around the existing forward
  model.

## Macao

Repository:  
https://github.com/snowfrogdev/macao

- License reference: MIT; verify the repository license before any code reuse.
- Useful concepts: a small planning boundary shaped around `generateActions`,
  `applyAction`, `stateIsTerminal`, and `calculateReward`.
- Status: short architecture/proof-of-concept spike candidate only.
- Boundary: its two-player, turn-based, perfect-information assumptions are not a
  production fit for the current daily political simulation.

## Stratega

Repository:  
https://github.com/GAIGResearch/Stratega

Documentation:  
https://stratega.readthedocs.io/

Advanced agents:  
https://stratega.readthedocs.io/en/latest/tutorials/advancedAgents/index.html

- Useful concepts: forward-model planning, explicit time/iteration/forward-call
  budgets, state heuristics, opponent models, and strategy portfolios.
- Status: primary research reference; do not add as a runtime dependency.
- Boundary: learn the planning structure without copying its engine or keeping a
  duplicate TMR world representation.

## Tribes

Repository:  
https://github.com/GAIGResearch/Tribes

- Useful concepts: multi-agent tournament evaluation, repeated fixed-seed runs,
  agent/game seed separation, headless metrics, and partial-observation research.
- Status: strategy-game benchmark/evaluation reference; do not add to runtime.

## OpenSpiel

Repository:  
https://github.com/google-deepmind/open_spiel

Algorithms documentation:  
https://github.com/google-deepmind/open_spiel/blob/master/docs/algorithms.md

- Useful concepts: general-sum and multi-agent evaluation, best response,
  exploitability, MCTS, IS-MCTS, CFR-family methods, and evolutionary evaluation.
- Status: terminology and experimental-method reference; do not add a C++/Python
  duplicate game engine to the repository or browser runtime.

## RHEA

Primary reference path: Stratega advanced-agent material above and related
GAIG/GVGAI research literature.

- Useful concept: rolling-horizon evolution of action sequences.
- Status: conditional T025B candidate only; inspect after simple rollout/MCTS evidence
  shows a real long-horizon sequencing problem.

## Strategic planning adoption guardrail

The first future comparison should use the existing deterministic heuristic as the
baseline, then a bounded counterfactual rollout. MCTS/RHEA adoption requires measurable
benefit, deterministic/replay-safe behavior, acceptable forward-model cost, and no
hidden rule or resource advantage. Actor-specific objectives and hard survival
constraints remain future evaluation concerns; no universal weighted utility score is
authoritative state.

---

# 11. Codex Development Workflow / Router Reference

## GPT5.6-SOLTELU-Model-Inverter

Repository:  
https://github.com/AlexAI-MCP/GPT5.6-SOLTELU-Model-Inverter

- Useful concepts: task-risk routing, Luna/Terra/Sol model selection, escalation and
  de-escalation, compact handoff, and repository-evidence-aware review.
- Status: external reference only. Do not install the original skill unchanged, copy
  unrelated project context, configure MCP, or add a game dependency.
- TMR direction: extract only a generic routing mechanism later and rebuild it around
  TMR-specific rules in the development environment.

## Current manual workflow

- Luna: default implementation and contained docs/test/fixture work with explicit
  acceptance criteria.
- Terra: authority migration, schema ownership, replay boundary, partial-state, or
  architecture-sensitive review.
- Sol: unexplained determinism/replay divergence, conflicting contracts, security or
  model-authority boundaries, and difficult cross-system root-cause analysis.

This is a current manual workflow, not an installed router or an automatic quality
guarantee. Tests, inspections, repository evidence, and human/product judgment remain
required.
