# Political Interaction Kernel

**Scope:** F05_FIX6/F05_FIX8, one developer-only Gate 1F vertical slice
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
  reconsiderationBasis?: {
    targetGovernmentId: GovernmentId;
    feasible: boolean;
    failureClasses: readonly PoliticalProposalFailureClass[];
  };
}
```

Rules:

1. Opening requires an accepted faction `LOBBY`, a valid current Government, and one matching authored template.
2. The proposal ID is deterministic from the opening ActionRecord. A matching
   open stable demand is not duplicated, even if the current Government has
   changed.
3. Opening changes only proposal state and its event. It does not change treasury, administrative load, policy rules, faction values, conflict, LandHex control, consolidation, or terminal outcome.
4. A response is valid only on a later authoritative tick. `REJECT` closes the proposal with `explicitReject` and leaves the requested intervention unused.
5. `ACCEPT` re-checks the captured Government relation and normal intervention feasibility. A stale Government closes the proposal as `staleTargetGovernment` without retargeting. An infeasible response emits `POLITICAL_PROPOSAL_RESPONSE_REJECTED` and leaves the proposal open.
6. A feasible `ACCEPT` closes the proposal and starts the existing `InterventionDefinition` with the response ActionRecord as its source. No hidden synthetic `START_INTERVENTION` action is created.
7. `REJECT` stores the captured Government plus the requested intervention's
   feasibility boolean and discrete failure classes. A later `LOBBY` can open a
   new episode only after that Government or named feasibility basis changes;
   time, new ActionRecord IDs, Agenda output, and unrelated scalar drift do not
   reopen the demand.

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

Adding authoritative proposals initially raised the snapshot format to V3.
F05_FIX8 adds authoritative explicit-rejection reconsideration basis, so the
current contract is `SerializedSimulationSnapshotV4` / format version `4`.
V4 strictly decodes proposal identity, lifecycle status, Government target,
discrete basis classes, and action/event provenance. V3 is explicitly rejected;
there is no hidden migration or default basis.

The persistence boundary verifies proposal and Government/Country/Faction/intervention references, open versus resolved tick/reason consistency, opening ActionRecord and event provenance, accepted response provenance and commitment source, deterministic JSON after save/load, replay, and proposal object insertion-order changes.

## Deliberately deferred

`policyRequest`, material demand, ceasefire, settlement, counteroffers, multi-round bargaining, generic `ACCEPT`, parties/elections/coalitions, probabilistic acceptance, utility or political-power meters, runtime LLM/MCP decisions, crisis/conflict/territory writers, continuity, V02, and UI are outside this kernel.

## Implementation evidence

- State/action/events: `src/sim/state/politicalProposal.ts`, `src/sim/state/action.ts`, `src/sim/events/event.ts`.
- Shared intervention path: `src/sim/systems/intervention.ts`.
- Focused lifecycle/persistence tests: `src/sim/systems/politicalProposal.test.ts`,
  `src/sim/inspection/f05Fix8ProposalLifecycle.ts`.
- Controlled same-seed branches: `src/sim/inspection/f05Fix6PoliticalInteraction.ts`.

## F05_FIX7 orchestration boundary

The v1 template contract is now closed to the implemented opener:

```ts
interface FactionProposalTemplate {
  factionId: FactionId;
  triggerAction: "LOBBY";
  interventionId: InterventionId;
}
```

Scenario validation rejects any non-`LOBBY` trigger. The F05_FIX7 fixture reuses
the single F05_FIX6 mapping (`coup/security faction + LOBBY -> coercive
restriction`) and changes no political subject or runtime effect.

The developer-only long-horizon seam accepts additional player
`ActionProposal`s through the normal intake boundary. When a strategy action
and proposal response share a target tick, the deterministic log order is:

```text
player strategy START_INTERVENTION
  -> player RESPOND_POLITICAL_PROPOSAL
  -> carried heuristic faction ActionRecords
```

This is input/log ordering, not a new gameplay-priority phase. `ACCEPT_IF_FEASIBLE`
projects the already-selected strategy reservation when checking the requested
intervention, and submits no response while the request is infeasible.

F05_FIX7 keeps `F05_PACING_EVENT_TYPES` unchanged. Proposal lifecycle and
response-actionability changes are measured as a separate proposal-decision
load, while Agenda, intervention, crisis, conflict, territory, and other
state-grounded signals remain the Gate-relevant pacing metric. The full
five-year comparison and churn diagnosis are recorded in
`docs/F05_GATE1F_REPAIR7_INTERACTION_INTEGRATION.md`.

## F05_FIX8 lifecycle and audit boundary

The eight pre-fix IGNORE/REJECT control differences were measurement-signature
artifacts: the developer observer counted individual pacing events instead of
the official 30-day event clusters. The seam was aligned in the FIX7 observer;
the post-fix audit reports zero non-accept divergences while the historical
36-branch baseline remains unchanged. The branch evidence is recorded in
`docs/F05_FIX8_NON_ACCEPT_DIVERGENCE_AUDIT.md`.

The state-grounded rejected-demand contract and V4 persistence amendment are
recorded in `docs/F05_FIX8_PROPOSAL_LIFECYCLE_SEMANTICS.md`. The implementation
does not add a cooldown, expiry timer, proposal pacing event, new subject, or
new authored template.
