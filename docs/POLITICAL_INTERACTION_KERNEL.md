# Political Interaction Kernel

**Scope:** F05_FIX6, one developer-only Gate 1F vertical slice
**Status:** Implemented for the explicit fixture template; Gate 1F remains `NOT_READY`.

## Decision

The smallest useful political interaction is an authored proposal object, not a numeric faction bonus:

```text
accepted Faction LOBBY ActionRecord
  -> explicit ScenarioDefinition proposal template
  -> PoliticalProposal against the Country's current Government
  -> later player RESPOND_POLITICAL_PROPOSAL(accept | reject)
  -> reject: proposal closes and the requested intervention is not run
  -> accept: normal InterventionDefinition feasibility/commitment/effects path
  -> downstream systems read the resulting authoritative state
```

The first subject is deliberately one existing contract:

```ts
{ kind: "interventionRequest", interventionId: InterventionId }
```

No payoff, influence score, probability, equilibrium solver, or inferred demand is part of the kernel.

## Source grounding and TMR interpretation

These sources justify the shape of a proposal/status-quo/response sequence; they do not supply a TMR number or automatic outcome.

| Source fact | TMR interpretation | Explicit limit |
| --- | --- | --- |
| Romer & Rosenthal describe controlled agendas in which a proposal is compared with a status quo. [DOI](https://doi.org/10.1007/BF03187594) | Keep an open proposal and an unchanged status quo as separate authoritative states. | No agenda-control score or numeric policy utility is added. |
| Veto-player summaries describe policy change as requiring agreement of actors able to block the status quo. [Gehlbach, Cambridge](https://www.cambridge.org/core/books/abs/formal-models-of-domestic-politics/veto-players/FAD5549C08C6188A9CE6B71E6DB5D60D) | A player/state response is required before a requested intervention can start. | The kernel does not model a complete set of veto players or calculate a winset. |
| Cameron & McCarty describe veto bargaining as institutionally conditioned. [Annual Reviews](https://doi.org/10.1146/annurev.polisci.7.012003.104810) | The template is scenario-authored and the response is addressed to the current Government relation. | No universal acceptance probability is inferred. |
| Sequential ultimatum experiments use an offer followed by acceptance or rejection. [Guth, Schmittberger & Schwarze](https://doi.org/10.1016/0167-2681(82)90011-7) | `accept | reject` is the minimum typed response vocabulary. | No alternating offers, discounting, equilibrium, or stochastic bargaining is implemented. |
| Lobbying research treats lobbying as access, information, or coalition work rather than guaranteed policy success. [McCarthy & Zald](https://doi.org/10.1086/226464), [Jenkins](https://doi.org/10.1146/annurev.so.09.080183.002523), [Andrews & Edwards](https://doi.org/10.1146/annurev.soc.30.012703.110542) | `LOBBY` can open a represented demand only when fixture content names the demand and recipient. | Faction interests and ideology labels never synthesize an intervention. |

## Actors and authored template

- The proposer is a `FactionId`.
- The proposal stores the proposer's `CountryId` and captures that country's `currentGovernmentId` at opening.
- The player represents the `CountryId`, not a Government type. The response is a player/state action addressed to the captured Government relation.
- Government transition remains a normal non-terminal state change. This kernel does not create a successor Government and does not retarget stale proposals.

`ScenarioDefinition.factionProposalTemplates` is optional static content:

```ts
interface FactionProposalTemplate {
  factionId: FactionId;
  triggerAction: FactionActionType;
  interventionId: InterventionId;
}
```

The validation fixture contains exactly one mapping:

```text
t018.fixture.coup-faction + LOBBY
  -> gate1f.f04d.coercive-restriction
```

The mapping is fixture content. Nothing in interests, ideology affinity, grievance, organization, or strategy names is interpreted as a demand. Production F04D/F05 scenarios remain template-free.

## Authoritative lifecycle

`WorldState.politicalProposals` stores one deterministic `PoliticalProposal` per open/resolved proposal:

```ts
interface PoliticalProposal {
  id: PoliticalProposalId;
  proposerFactionId: FactionId;
  countryId: CountryId;
  targetGovernmentId: GovernmentId;
  subjectKind: "interventionRequest";
  interventionId: InterventionId;
  status: "open" | "accepted" | "rejected";
  createdAtTick: number;
  openingActionId: ActionId;
  openingEventId: EventId;
  resolvedAtTick?: number;
  responseActionId?: ActionId;
  resolutionReason?: "accepted" | "explicitReject" | "staleTargetGovernment";
}
```

Rules:

1. Opening requires an accepted faction `LOBBY`, a valid current Government, and one matching authored template.
2. The proposal ID is deterministic from the opening ActionRecord. A matching open proposal is not duplicated.
3. Opening changes only proposal state and its event. It does not change treasury, administrative load, policy rules, faction values, conflict, LandHex control, consolidation, or terminal outcome.
4. A response is valid only on a later authoritative tick. `REJECT` closes the proposal with `explicitReject` and leaves the requested intervention unused.
5. `ACCEPT` re-checks the captured Government relation and normal intervention feasibility. A stale Government closes the proposal as `staleTargetGovernment` without retargeting. An infeasible response emits `POLITICAL_PROPOSAL_RESPONSE_REJECTED` and leaves the proposal open.
6. A feasible `ACCEPT` closes the proposal and starts the existing `InterventionDefinition` with the response ActionRecord as its source. No hidden synthetic `START_INTERVENTION` action is created.

The causal chain is inspectable:

```text
LOBBY ActionRecord
 -> POLITICAL_PROPOSAL_OPENED
 -> RESPOND_POLITICAL_PROPOSAL ActionRecord
 -> POLITICAL_PROPOSAL_ACCEPTED / REJECTED
 -> INTERVENTION_STARTED (accept only)
 -> INTERVENTION_COMPLETED and existing typed effects (when applicable)
```

## Persistence and replay

Adding authoritative proposals raises the snapshot format from V2 to `SerializedSimulationSnapshotV3`. V3 strictly decodes proposal identity, lifecycle status, Government target, intervention subject, and action/event provenance. V2 and malformed/missing proposal data are rejected; no hidden migration or default demand is provided.

The persistence boundary verifies proposal and Government/Country/Faction/intervention references, open versus resolved tick/reason consistency, opening ActionRecord and event provenance, accepted response provenance and commitment source, deterministic JSON after save/load, replay, and proposal object insertion-order changes.

## Deliberately deferred

`policyRequest`, material demand, ceasefire, settlement, counteroffers, multi-round bargaining, generic `ACCEPT`, parties/elections/coalitions, probabilistic acceptance, utility or political-power meters, runtime LLM/MCP decisions, crisis/conflict/territory writers, continuity, V02, and UI are outside this kernel.

## Implementation evidence

- State/action/events: `src/sim/state/politicalProposal.ts`, `src/sim/state/action.ts`, `src/sim/events/event.ts`.
- Shared intervention path: `src/sim/systems/intervention.ts`.
- Focused lifecycle/persistence tests: `src/sim/systems/politicalProposal.test.ts`.
- Controlled same-seed branches: `src/sim/inspection/f05Fix6PoliticalInteraction.ts`.
