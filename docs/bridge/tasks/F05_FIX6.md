# F05_FIX6 — Political Interaction Kernel + One Vertical Slice

Date: 2026-08-24

STATUS: AUTHORIZED

## Mission

F05_FIX5 established that action labels alone cannot justify scalar faction consequences. F05_FIX6 moves up one abstraction level: define the minimum political interaction grammar that lets a faction make a concrete proposal to the current Government, lets the player/state accept or reject it, and routes acceptance through an already-authoritative resolver instead of inventing a new payoff formula.

The task must design the kernel first, then implement exactly one narrow vertical slice if the design passes the repository/persistence checks, then run controlled simulation counterfactuals. A truthful `NOT_READY` is acceptable.

## Accepted prior facts

- F05_FIX4 closed `FACTION_PROPOSAL_INTAKE_GAP`; deterministic faction actions now become accepted ActionRecords.
- F05_FIX5 closed the question of whether the existing `FUND_MOVEMENT / ORGANIZE / LOBBY / BARGAIN / ACCEPT` labels alone justify scalar effects: they do not.
- `FUND_MOVEMENT` and `ORGANIZE` lack represented cost/commitment/magnitude/repeat-limit semantics.
- `LOBBY` lacks a represented demand/recipient/outcome; `BARGAIN` lacks offer/counterpart/settlement; `ACCEPT` lacks an accepted object.
- `Country.currentGovernmentId` and `Government` already represent the current authority relation; Government change is non-terminal.
- `PolicyDefinition` and `InterventionDefinition` already represent bounded, scenario-authored state-change contracts.
- `START_INTERVENTION` already owns treasury cost, administrative commitment, duration, prerequisites, completion effects, and causal events.
- `WorldState.landHexStates[*].controller` remains the only physical territorial authority.
- T023 dissolution semantics remain unchanged and read-only regarding continuity evidence.

## External / formal grounding to verify

Use the F04C-R source-fact → interpretation → TMR-inference method.

Required reference families:

1. Romer & Rosenthal (1978), *Political Resource Allocation, Controlled Agendas, and the Status Quo* — proposal/status-quo structure and agenda control.
2. Tsebelis veto-player formulation / Gehlbach formal-model summary — policy change requires agreement of actors able to block change from the status quo.
3. Cameron & McCarty (2004), *Models of Vetoes and Veto Bargaining* — proposal/response structure is institutionally conditioned; do not generalize into a universal probability of acceptance.
4. A minimal sequential/ultimatum bargaining reference may be used only to justify `offer -> accept/reject -> status quo or agreed outcome`; do not implement alternating-offer utility solving, discount factors, equilibrium search, or stochastic bargaining.
5. Reuse F05_FIX5 lobbying grounding: lobbying can seek access/information/coalition support but does not itself imply policy success. In TMR the represented proposal and player response provide the missing recipient/outcome stage.

No external source may be converted directly into a numeric TMR payoff.

## Core design decision to evaluate

Preferred v1 grammar:

```text
Faction accepted action (LOBBY)
-> scenario-authored proposal template exists
-> authoritative PoliticalProposal opens against Country.currentGovernmentId
-> Player/State responds on a later tick: ACCEPT or REJECT
-> REJECT preserves status quo
-> ACCEPT invokes the existing requested InterventionDefinition through the normal feasibility/cost/admin/duration/effect machinery
-> downstream systems re-evaluate from the resulting authoritative state
```

The first vertical slice should prefer `LOBBY` over `BARGAIN` because the reviewed lobbying literature supports an access/demand stage while `BARGAIN` still lacks an offer/counteroffer/settlement protocol. `BARGAIN`, counteroffers, multi-round negotiation, and `ACCEPT` as a generic faction action remain deferred.

## Required kernel design artifact

Create `docs/POLITICAL_INTERACTION_KERNEL.md` before implementation. It must define:

### Actors

- proposer: a `FactionId`;
- respondent target: the current `GovernmentId` of the faction's `CountryId` at proposal creation;
- player authority: the player still represents the `CountryId`, not the Government; the response is a state/player action addressed to the proposal's target Government.

No government-type enumeration is added merely for this kernel. `GovernmentAuthority` remains the current authority relation.

### Proposal subject

V1 should implement only one subject kind if possible:

```text
{ kind: "interventionRequest", interventionId }
```

The referenced intervention must already exist in `ScenarioDefinition.interventionCatalog`. Acceptance must not copy its effects into a second bespoke political-effect path.

Document future/deferred subject kinds (`policyRequest`, material demand, ceasefire, settlement, etc.) without implementing them unless strictly required by the vertical slice.

### Scenario-authored template

The simulation must not infer a demand from faction `interests` or ideology labels. Add the smallest optional scenario-owned authored mapping/catalog needed to say explicitly:

```text
this Faction + this trigger action -> this requested InterventionId
```

A developer validation fixture may author one such template. This is content, not a universal semantic mapping from `security`, `authority`, `labor`, communism, monarchy, etc.

### Authoritative proposal state

If implementation proceeds, `PoliticalProposal` must be explicit authoritative run state with at least:

- stable deterministic proposal id;
- proposerFactionId;
- countryId;
- targetGovernmentId captured at opening;
- template/subject identity;
- requested intervention id;
- status (`open | accepted | rejected`; add another status only if proven necessary);
- createdAtTick;
- resolvedAtTick when resolved;
- causal link to the opening action/event if needed for event causality.

Do not use Agenda text, presentation state, hidden timers, or an event alone as a substitute for authoritative open-proposal state.

### Lifecycle

- proposal opens only from an accepted authoritative faction action and a valid scenario-authored template;
- no duplicate open proposal for the same proposer/target/template subject;
- proposal opening does not mutate requested intervention effects, grievance, organization, territory, conflict, continuity, or outcome;
- player response occurs no earlier than the next authoritative tick;
- `REJECT`: closes proposal as rejected; requested intervention is not started; status quo otherwise remains;
- `ACCEPT`: re-checks current target/actionability and normal intervention feasibility; only if the existing intervention can start does the proposal become accepted and the normal intervention commitment start;
- if acceptance cannot start the intervention, report/emit an explicit invalid/infeasible response and do not silently treat it as accepted;
- no automatic counteroffer or AI response.

If the target Government is no longer the Country's current Government when response is attempted, do not retarget automatically and do not infer revolutionary succession. Define a narrow non-actionable/stale response behavior and document future lapse handling.

### Action authority

Add the minimum typed response action vocabulary necessary, e.g. a player `RESPOND_POLITICAL_PROPOSAL` with `{ proposalId, response: "accept" | "reject" }`.

Do not create a synthetic hidden `START_INTERVENTION` ActionRecord. The accepted proposal-response ActionRecord must remain the authoritative player decision. Refactor/reuse the existing intervention resolver so proposal acceptance invokes the same feasibility/reservation/commitment/effect path with the response action as the cause.

Faction proposal opening should reuse the already-accepted `LOBBY` ActionRecord rather than add a second hidden actor decision, if this can be done without making all LOBBY actions magically create demands. Only factions with explicit scenario-authored proposal templates should open proposals.

### Events / causality

Use explicit typed events such as proposal opened / accepted / rejected (exact names may follow repository naming conventions). Causal ordering must be inspectable:

```text
accepted faction LOBBY ActionRecord
-> proposal-open event
-> accepted player response ActionRecord
-> proposal-response event
-> existing intervention-start event/commitment
-> existing completion events/effects
```

Proposal events alone are not pacing evidence. Only later authoritative state/choice changes count as meaningful reassessment.

## Persistence requirement

Because open proposals are authoritative state, persistence must be correct.

The current format is `SerializedSimulationSnapshotV2` / format version 2. If the kernel adds proposal state to `WorldState`, update the snapshot schema/version explicitly (expected V3 unless repository inspection finds a safer contract). Preserve the T024 rule:

- explicit decoder;
- corrupt/missing data rejection;
- no hidden migration;
- prior snapshot versions rejected unless a separately explicit migration is authored (no migration is requested here);
- open proposal roundtrip;
- accepted/rejected proposal roundtrip;
- save/load replay determinism across proposal opening and response;
- insertion-order independence.

Do not leave proposal state outside persistence merely to avoid a schema bump.

## Required vertical slice

Use developer-only Gate 1F fixture content. Do not edit production scenario balance.

Preferred slice if repository contracts support it:

- the existing coup/security-authority faction's accepted `LOBBY` can open one explicitly authored proposal requesting the existing F04D `coerciveRestriction` intervention;
- this mapping is authored fixture data, **not** inferred automatically from the faction's interests;
- target = player Country's current Government at proposal opening;
- player branches on the next legal tick:
  1. `IGNORE` — proposal remains open, no intervention starts;
  2. `REJECT` — proposal closes rejected, status quo otherwise preserved;
  3. `ACCEPT` — existing intervention feasibility/cost/admin/duration/effects apply through the normal resolver.

If `coerciveRestriction` cannot be reused cleanly without duplicating F04D implementation, select another already-existing F04D intervention and document why. Do **not** invent a new consequence merely for F05_FIX6.

## Required simulation experiment

After the kernel vertical slice works, run controlled branches from the same state/seed:

```text
NO_PROPOSAL baseline
PROPOSAL_IGNORE
PROPOSAL_REJECT
PROPOSAL_ACCEPT
```

Hold everything else fixed.

Report at minimum:

- proposal opened/resolved tick;
- target GovernmentId and whether CountryId is preserved;
- requested intervention id;
- intervention feasibility at response;
- treasury / administrative load/commitment changes;
- institutional-rule changes;
- affected faction grievance/organization only insofar as the existing intervention already changes them;
- Agenda changes;
- faction legal-action availability/selected action changes;
- T018 crisis timing/eligibility;
- T021 conflict strength/intent/recovery/territory changes if any;
- player response feasibility changes;
- terminal/consolidation outcome;
- genuine reassessment signals/silence;
- evidence that `REJECT` and `IGNORE` do not accidentally enact effects;
- evidence that `ACCEPT` differs because of the existing intervention path, not proposal-event counting.

The experiment should be long enough to observe downstream consequences, but do not tune the horizon to manufacture a divergence.

## F05 handling

Do not silently change the existing six-strategy F05 matrix semantics to auto-accept or auto-reject proposals.

After the targeted interaction experiment:

- run existing `inspect:f05` as a regression baseline;
- if official F05 strategies do not yet contain proposal-response behavior, report that explicitly and do not claim Gate 1F pacing is repaired;
- do not count an open proposal/event by itself as fixing the 1,200-day gap;
- a future task may integrate proposal-response policies into F05 only after this kernel is reviewed.

## Required tests

At minimum:

1. no authored template -> accepted LOBBY changes strategy only, no proposal;
2. valid authored template -> one deterministic proposal opens;
3. duplicate LOBBY while same proposal open -> no duplicate proposal;
4. REJECT closes proposal, starts no intervention, mutates no unrelated state;
5. ACCEPT starts exactly one existing intervention commitment through shared normal semantics;
6. infeasible ACCEPT does not close as accepted or apply effects;
7. response against non-current target Government cannot auto-retarget or create successor;
8. same tick action sequencing remains deterministic;
9. proposal id/order independent of object insertion order;
10. persistence/replay across open/accepted/rejected proposal state;
11. CountryId preserved; Government relation does not become state dissolution;
12. LandHex controllers unchanged directly by proposal/response kernel.

## Architecture boundaries / forbidden scope

- no direct faction `resources/organization/grievance` delta from `LOBBY` itself;
- no automatic policy success;
- no inferred demand from faction interests/ideology;
- no generic influence/utility/political-power score;
- no probabilistic acceptance;
- no bargaining equilibrium solver, Nash/CFR/MCTS/RL/QRE;
- no runtime LLM/MCP NPC decisions;
- no alternating-offer/counteroffer system in this task;
- no party/election/coalition model;
- no full labor bargaining/transitional justice/military factions/local autonomy;
- no continuity writer/restoration/sovereignty meter/T023 threshold change;
- no automatic revolutionary Government creation or successor selection;
- no direct conflict resolution/crisis deletion/free LandHex/hidden comeback;
- no War as Politics / fantasy / V02 / renderer / UI;
- no story nodes/countdowns/filler events;
- no self-authorized Gate 1F PASS or follow-up task.

## Expected artifacts

Create/update as appropriate:

- `docs/POLITICAL_INTERACTION_KERNEL.md`
- `docs/F05_GATE1F_REPAIR6_POLITICAL_INTERACTION.md`
- `docs/bridge/results/F05_FIX6_RESULT.md`
- current Architecture / Decisions docs if authoritative contracts materially change;
- persistence docs/tests if snapshot version changes;
- focused inspection/test code for interaction counterfactuals.

Historical F05_FIX1–5 result/review documents must remain immutable evidence.

## Required classifications

Report exactly one primary result:

- `KERNEL_IMPLEMENTED_VERTICAL_SLICE_MEANINGFUL`
- `KERNEL_IMPLEMENTED_BUT_NO_MEANINGFUL_DOWNSTREAM_CHANGE`
- `KERNEL_BLOCKED_BY_MODEL_OR_PERSISTENCE_CONTRACT`
- `KERNEL_DESIGN_ONLY_INSUFFICIENT_GROUNDING`

Also report:

```text
PROPOSAL_SUBJECT_KIND: <kind | NONE>
TRIGGER_ACTION: <action | NONE>
PLAYER_RESPONSE: <implemented | not implemented>
PERSISTENCE_FORMAT: <version>
TARGETED_COUNTERFACTUAL: <meaningful | not meaningful | not run>
OFFICIAL_F05_PACING: <unchanged/not_ready/etc>
GATE1F_RECOMMENDATION: PASS | PASS_WITH_NOTES | NOT_READY
V02: NOT STARTED
```

Task PASS means the design, implementation (if justified), persistence, tests, and truthful measurements are correct. It does **not** mean Gate 1F passes.

## Startup / freshness

Before any work:

```bash
git status
git fetch origin
git rev-parse HEAD
git rev-parse origin/master
git pull --ff-only
```

The expected remote head at authorization will be recorded by `CURRENT_TASK.md`. If the fetched remote contains non-Bridge source/gameplay commits after the task base, stop and report instead of rebasing assumptions.

## Verification

Preferred Node 24.19.0 / pnpm 11.19.0; if unavailable, record exact runtime and do not patch source for environment.

Run:

- `pnpm install --frozen-lockfile`
- `pnpm run format`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run build`
- `pnpm run inspect:t024`
- `pnpm run inspect:f01`
- `pnpm run inspect:f04b`
- `pnpm run inspect:f04d`
- targeted political-interaction inspection/test
- `pnpm run inspect:f05` baseline regression
- focused persistence tests if schema changes
- `pnpm test`
- `git diff --check`

No timeout loosening.

## Commit / completion policy

COMMIT_POLICY: `COMMIT_AND_PUSH_ON_PASS`

Suggested implementation commit if implementation occurs:

`feat: add political interaction proposal kernel`

On completion:

- `F05_FIX6: COMPLETE / AWAITING_CHATGPT_REVIEW` or truthful blocked state;
- `NEXT_AUTHORIZED_TASK_ID: NONE`;
- `NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW`;
- `CURRENT_TASK_FILE: NONE`;
- `V02: NOT STARTED`;
- do not implement the next integration step;
- do not declare Gate 1F passed.
