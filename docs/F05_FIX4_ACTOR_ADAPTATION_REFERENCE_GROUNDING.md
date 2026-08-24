# F05_FIX4 Actor Adaptation Reference Grounding

Date: 2026-08-24
Scope: conceptual grounding for the narrow deterministic T016 proposal-intake repair
Runtime dependency change: none

## Decision

F05_FIX4 uses the existing T016 rule-ordered chooser and repairs only the
missing orchestration edge:

```text
WorldState -> FactionObservation -> legal deterministic action
-> heuristic ActionProposal -> transient next-tick buffer
-> common ActionRecord intake -> normal factionPressure execution
```

The external references below are used to bound the design vocabulary. They do
not authorize an equilibrium solver, utility-weight tuning, stochastic policy,
LLM, MCP server, or a new faction consequence.

## Claim-to-source trail

| Reference family | SOURCE-SUPPORTED FACT | INTERPRETATION | TMR DESIGN INFERENCE | IMPLEMENT / DEFER / REJECT |
| --- | --- | --- | --- | --- |
| [OpenSpiel repository](https://github.com/google-deepmind/open_spiel) and [algorithm catalogue](https://github.com/google-deepmind/open_spiel/blob/master/docs/algorithms.md) | The project is a research collection of games and algorithms; its catalogue includes best-response/exploitability alongside fictitious play, regret/CFR, PSRO, MCTS and RL families. | “Best response” is a useful name for a local response concept, not a requirement to import the framework. | Keep T016 as a current-state, legal, myopic response. Do not force equilibrium or convergence. | **IMPLEMENT:** the intake seam only. **DEFER:** payoff-aware best-response selection. **REJECT:** OpenSpiel runtime dependency. |
| [Tim Roughgarden, Best-Response Dynamics](https://theory.stanford.edu/~tim/f13/l/f13.pdf) | Best-response dynamics models successive unilateral beneficial deviations and need not converge in arbitrary games. | Actor adaptation can be path-dependent or cyclic without a terminal “equilibrium reached” flag. | A repeated proposal or a strategy cycle is valid diagnostic behavior when the current state and legal action rules produce it. | **IMPLEMENT:** repeated deterministic intake. **REJECT:** convergence meter, equilibrium-progress state, or forced stabilization. |
| [UtilityAIPlugin](https://github.com/bohdon/UtilityAIPlugin) | Candidate actions are evaluated from current-context considerations and the selected action is activated; decision and execution are separate concepts. | The separation maps to TMR’s observation/proposal/validation/execution boundary. | Preserve the existing explainable rule order until TMR has explicit action-specific payoff/consequence semantics. | **IMPLEMENT:** observation → proposal → common intake → execution boundary. **DEFER:** utility scoring. **REJECT:** arbitrary hidden political weights. |
| [Gambit](https://github.com/gambitproject/gambit) | Gambit represents strategic/extensive games and provides Nash-equilibrium and QRE facilities. | Its problem shape is static/explicit game analysis, not this runtime’s bounded multi-system daily loop. | Do not turn the T016 action vocabulary into an implicit normal-form game. | **REJECT:** Gambit and any equilibrium sidecar in runtime. |
| [Nashpy](https://github.com/drvinceknight/Nashpy) and [normal-form documentation](https://nashpy.readthedocs.io/en/stable/) | Nashpy targets two-player strategic-form games, including matrix payoffs and equilibrium/best-response algorithms. | A two-player payoff matrix does not represent TMR’s multi-faction, institutional, territorial, and conflict state. | No matrix is invented for F05_FIX4 merely to make action variety appear. | **REJECT:** Nashpy dependency and payoff-matrix shortcut. |
| QRE / stochastic bounded rationality, with the [Gambit QRE implementation](https://github.com/gambitproject/gambit) as a reference point | QRE models probabilistic responses related to payoff differences; Gambit exposes QRE computation/fitting facilities. | This is a future bounded-rationality option, not evidence that F05 needs RNG. | F05_FIX4 remains deterministic and replayable. | **DEFER:** QRE research. **REJECT:** stochastic choice or RNG added for behavioral diversity. |
| [Turn-based game MCP example](https://github.com/chrisreddington/turn-based-game-mcp) | MCP can expose validated game tools/API operations to an agent while shared game logic remains separate. | MCP is an external tool boundary, not authoritative simulation state or an NPC brain. | The simulation must remain runnable without a service, model call, or MCP process. | **DEFER:** development/tool integration. **REJECT:** MCP/LLM runtime faction decisions. |

## Repository mapping

The source contract inspected before implementation is:

1. `deriveFactionActionProposals()` and `chooseFactionActionProposal()` read
   the current world, derive legal T016 actions, and emit deterministic
   `source="heuristic"` proposals in stable FactionId order.
2. `acceptActionProposal()` / `acceptActionProposals()` create the global
   sequence and deterministic ActionRecord id; they do not mutate WorldState.
3. `runFactionPressurePhase()` resolves accepted faction records, changes only
   `Faction.currentStrategy` when needed, emits `FACTION_STRATEGY_CHANGED`, and
   returns the next proposal batch.
4. `runSimulationStep()` returns proposals as output. They are not committed
   input and are not automatically executed in the same step.
5. Before F05_FIX4, `runF03StrategyFromRecord()` supplied player intervention
   records and discarded `SimulationStepResult.actionProposals`; F05 inherited
   that detached behavior.

The repair therefore lives in the developer orchestration layer. It does not
put a pending proposal in `WorldState`, bypass the ActionRecord gateway, or
change the authoritative tick phases.

## Consumer boundary

| Consumer | Reads `currentStrategy` / strategy event? | What changes in the current slice? | Active-conflict relevance | Player reassessment relevance |
| --- | --- | --- | --- | --- |
| T017 instability | No strategy-only trigger; reads grievance/organization/local signals | No instability from the strategy label alone | None by itself | No |
| T018 coup/rebellion prerequisites | Strategy appears in supporting snapshots; gates use current grievance/organization/resources/state weakness | No crisis from strategy alone | Precondition context only | No direct change |
| T021 conflict | Strategy appears in supporting signals; strength/intent/recovery use resources, organization, control, and conflict state | No conflict strength, intent, or recovery mutation from strategy alone | No meaningful consumer in the active stalemate | No |
| Agenda read model | Strategy-change events can be evidence; strategy is explanatory, not a standalone trigger | No new agenda from strategy alone | Label/evidence only unless existing pressure also qualifies | No standalone response-set change |
| F04A endogenous dynamics | Explicitly excludes `currentStrategy` and support as drivers | Grievance/organization continue to follow existing state drivers | Does not turn strategy into a recovery writer | No |
| F04D intervention feasibility/effects | Reads policy/resources/headroom and existing intervention contracts | No faction strategy-specific cost/effect is added | No | Existing player response set remains authoritative |

Classification after inspection: `MIXED_CONSUMER_COVERAGE`, with the active
conflict path effectively `STRATEGY_LABEL_ONLY`. The actor loop is therefore a
real pipeline repair, but it is not authorized to invent the missing
non-terminal faction consequence.

## Boundary retained for future payoff work

A later grounded task may define:

```text
legal candidates
-> explicit state-derived payoff projection
-> deterministic top action + stable tie-break
-> ActionProposal -> common intake -> execution
```

That future interface must identify the existing authoritative consumer and
measure its consequence before introducing weights. F05_FIX4 intentionally does
not implement that payoff projection.
