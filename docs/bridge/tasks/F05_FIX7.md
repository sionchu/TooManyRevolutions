# TMR Bridge Task — F05_FIX7

TASK_ID: F05_FIX7

TITLE: Political Interaction Long-Horizon Integration

STATUS: AUTHORIZED

BASE_BRANCH: master

BASE_COMMIT: ae214499876d951263012a59c71f617ee88d8d9b

COMMIT_POLICY: COMMIT_AND_PUSH_ON_PASS

## Mission

F05_FIX6 proved that the Political Interaction Kernel can create one meaningful
Faction -> Government -> player response -> existing Intervention consequence
vertical slice. F05_FIX7 must now test that kernel in the same long-horizon
political environment used by F05 without silently redefining the historical
36-branch F05 baseline.

This is an integration-and-measurement task, not a new political-domain task.
The key question is:

```text
Does a real proposal-response loop create durable, non-filler player/faction
reassessment over five years, or does the old late active-conflict steady state
remain after the proposal consequence saturates?
```

A truthful result that the interaction is meaningful but Gate 1F remains blocked
is a PASS for this task.

## Accepted starting facts

- F05_FIX4 actor proposal intake is correct and deterministic.
- F05_FIX5 correctly rejected arbitrary scalar consequences from action labels.
- F05_FIX6 Political Interaction Kernel is accepted:
  - explicit scenario-authored Faction/action -> existing InterventionId template;
  - v1 subject `interventionRequest`;
  - accepted `LOBBY` opens an authoritative proposal only when a template exists;
  - target Government is captured at opening and is never auto-retargeted;
  - player `RESPOND_POLITICAL_PROPOSAL(accept|reject)` is authoritative;
  - REJECT preserves the requested-intervention status quo;
  - ACCEPT uses the response ActionRecord itself as the source of the existing
    intervention feasibility/cost/admin/duration/commitment/effect path;
  - no hidden synthetic `START_INTERVENTION` record;
  - proposal state persists in strict `SerializedSimulationSnapshotV3`;
  - proposal kernel has no territory, continuity, crisis, or terminal writer.
- Official F05 still measures the unchanged six intervention strategies and remains
  `NOT_READY`, with early/near representative late reassessment silence up to
  1,200 days and recovery 510 days.

## Required correctness cleanup before measurement

F05_FIX6 v1 runtime/provenance supports proposal opening from `LOBBY` only, while
`FactionProposalTemplate.triggerAction` is currently typed as the whole
`FactionActionType` vocabulary. Close this configuration footgun narrowly:

- v1 proposal templates must accept only `triggerAction: "LOBBY"`; or
- scenario validation must explicitly reject every non-LOBBY trigger.

Do not generalize the opener to BARGAIN/ORGANIZE/FUND_MOVEMENT/ACCEPT in this task.

## Integration scenario

Create a developer-only long-horizon integration scenario derived from the same
F04D/F05 validation state, without changing the historical F04D/F05 fixture
semantics in place.

The integration scenario may add exactly the explicit F05_FIX6-style template:

```text
coup/security fixture Faction + LOBBY
-> existing gate1f.f04d.coercive-restriction InterventionId
```

Do not infer this mapping from faction interests, ideology, current strategy,
grievance, organization, or conflict state.

Do not add a second proposal subject or a second template merely to improve
pacing.

## Developer response-policy seam

Add the smallest deterministic developer-runner seam needed to exercise open
proposals over long horizons. It must not become an autonomous production player
AI and must not mutate WorldState outside accepted ActionRecords.

Required response modes:

1. `NO_TEMPLATE`
   - historical control; same six F05 strategies and actor loop ON;
   - no proposal template, no proposal response.

2. `PROPOSAL_IGNORE`
   - integration template present;
   - never submit a response action;
   - an open matching proposal naturally suppresses duplicate open proposals via
     the existing kernel.

3. `PROPOSAL_REJECT`
   - integration template present;
   - respond `reject` to newly open proposals on the next eligible tick in stable
     PoliticalProposalId order;
   - use normal player ActionProposal -> ActionRecord intake;
   - do not directly close proposal state in the runner.

4. `PROPOSAL_ACCEPT_IF_FEASIBLE`
   - integration template present;
   - for each open proposal, derive current feasibility from the existing requested
     intervention contract;
   - submit `accept` only when currently feasible;
   - if infeasible, submit no response action and leave the proposal open until
     feasibility changes;
   - use stable PoliticalProposalId ordering and exactly-once response to a
     lifecycle state.

The runner must not repeatedly submit infeasible ACCEPT actions merely to create
response-rejected events.

Player intervention strategy actions and proposal-response actions may share a
simulation tick. Their ActionRecord ordering must be explicit, deterministic, and
tested. Preserve the existing player intervention strategy semantics; document the
chosen sequence order as log/action resolution order, not hidden gameplay priority.

## Long-horizon matrix

Keep the historical official F05 36-branch run unchanged and rerun it as a
regression baseline.

Add a separate F05_FIX7 integration matrix using:

- seed `40103`;
- horizon `1,800` days / five years;
- all six existing F05 contexts: `0/1`, `18/19`, `180/181`;
- all six existing F05 intervention strategies;
- response modes:
  - `PROPOSAL_IGNORE`
  - `PROPOSAL_REJECT`
  - `PROPOSAL_ACCEPT_IF_FEASIBLE`;
- plus the existing `NO_TEMPLATE` historical control.

Expected total comparison population is 36 historical control branches plus
108 proposal-enabled branches unless source structure justifies an equivalent
non-duplicative representation. If the implementation uses a different exact
count, explain it and prove all requested combinations are represented.

Do not replace, rename, or reinterpret the original six F05 intervention
strategies.

## Measurement rules

### Proposal lifecycle telemetry

For each branch record at minimum:

- proposals opened;
- open proposal subjects/targets;
- proposal accepts;
- explicit rejects;
- stale-target rejects;
- proposal response feasibility changes;
- requested interventions started/completed/rejected through proposal response;
- reopened identical proposal count after a resolved proposal;
- maximum concurrently open matching proposal count;
- response ActionRecord sequence examples.

### Do not game pacing with proposal events

`POLITICAL_PROPOSAL_OPENED`, `POLITICAL_PROPOSAL_ACCEPTED`,
`POLITICAL_PROPOSAL_REJECTED`, and
`POLITICAL_PROPOSAL_RESPONSE_REJECTED` must NOT be added to the existing F05
`PACING_EVENT_TYPES` merely to reduce silence.

Maintain two explicit notions:

1. **state-grounded reassessment**
   - the existing F05 pacing/Agenda/feasible-response logic and any real state
     consequence produced through the accepted intervention path;
   - this remains the Gate-relevant comparison to the prior 1,200-day late gap.

2. **proposal decision load**
   - open/close/actionability changes of proposal response options;
   - report separately so we can see whether the kernel creates real choices or
     only recurring prompts.

A Gate-readiness improvement must not be claimed solely because proposal lifecycle
notifications occur frequently.

### Churn / dominance diagnosis

Explicitly diagnose:

- whether the same authored proposal reopens after REJECT with no meaningful
  intervening state change;
- whether repeated identical proposal prompts become a loop whose only difference
  is lifecycle/event history;
- whether `ACCEPT_IF_FEASIBLE`, `REJECT`, or `IGNORE` becomes universally dominant
  across the existing six intervention strategies;
- whether proposal response meaningfully changes Agenda, intervention feasibility,
  crisis timing, faction action availability, conflict strength/intent/recovery,
  territory, or player choices;
- whether the 1,200-day early/near late steady-state gap is reduced in the
  **state-grounded** metric, and whether any reduction persists after the one
  requested intervention completes.

Do not add a cooldown, rejection memory, expiry timer, repeated-demand penalty, or
new proposal suppression rule in this task merely to cure observed churn. Measure
and classify it first.

## Required comparisons

At minimum report representative primary contexts (`T0`, `T18`, `T180`) with:

- historical NO_TEMPLATE baseline;
- IGNORE;
- REJECT;
- ACCEPT_IF_FEASIBLE;
- proposal counts / response counts;
- first and last proposal-relevant decision points;
- first requested intervention start/completion;
- final institutions and faction grievance/organization;
- first crisis timing;
- active conflicts;
- controlled LandHexes;
- final outcome;
- existing F05 longest political silence;
- existing/state-grounded longest reassessment silence;
- proposal-decision-load longest silence;
- trajectory signature differences.

Also preserve neighboring context timing checks so the interaction integration does
not introduce a one-day response cliff.

## Interpretation / classification

Return exactly one primary classification:

- `INTERACTION_INTEGRATION_MEANINGFUL_PACING_IMPROVED`
- `INTERACTION_INTEGRATION_MEANINGFUL_PACING_STILL_BLOCKED`
- `PROPOSAL_RESPONSE_DOMINANCE_OR_CHURN`
- `INTERACTION_INTEGRATION_NO_MEANINGFUL_LONG_HORIZON_EFFECT`
- `INTEGRATION_BLOCKED_BY_ORCHESTRATION_CONTRACT`

Also report:

- `HISTORICAL_F05_BASELINE: UNCHANGED | CHANGED`
- `V1_TRIGGER_CONTRACT: CLOSED | OPEN`
- `PROPOSAL_RESPONSE_MODE_EFFECT: ...`
- `STATE_GROUNDED_MAX_REASSESSMENT_SILENCE: ...`
- `PROPOSAL_DECISION_MAX_SILENCE: ...`
- `REOPEN_CHURN: NONE | PRESENT`
- `RESPONSE_DOMINANCE: NONE | IGNORE | REJECT | ACCEPT | MIXED`
- `READY_FOR_F05_PROMOTION: YES | NO`
- `GATE1F_RECOMMENDATION: PASS | PASS_WITH_NOTES | NOT_READY`
- `V02: NOT STARTED`

`READY_FOR_F05_PROMOTION: YES` only means a later reviewed task may promote a
proposal-response policy into the official Gate 1F measurement. F05_FIX7 itself
must not rewrite the official F05 strategy definition or self-authorize Gate 1F.

## Forbidden scope

- changing the F05_FIX6 proposal subject beyond `interventionRequest`;
- adding more faction proposal templates for pacing variety;
- BARGAIN/counteroffer/settlement systems;
- direct faction scalar effects from proposal opening/response;
- proposal-specific combat multipliers;
- generic hidden utility/political-power/stability score;
- automatic production player AI or probabilistic response policy;
- Nash/CFR/fictitious-play/PSRO/MCTS/RL/QRE;
- runtime LLM/MCP NPC decisions;
- continuity decay/restoration, sovereignty meter, T023 changes;
- automatic successor/revolutionary Government creation;
- direct crisis deletion/conflict resolution/free LandHex/hidden comeback;
- proposal expiry/countdown/cooldown or rejection-memory behavior added only to
  make pacing look better;
- elections/parties/coalitions/full labor bargaining/transitional justice/military
  factions/local autonomy;
- War as Politics, fantasy, V02, renderer/UI;
- story nodes/filler events;
- self-authorizing Gate 1F PASS or a follow-up task.

## Required artifacts

- `docs/F05_GATE1F_REPAIR7_INTERACTION_INTEGRATION.md`
- focused integration inspection and tests;
- `docs/bridge/results/F05_FIX7_RESULT.md`
- Bridge completion metadata.

Update `docs/POLITICAL_INTERACTION_KERNEL.md` only if needed to document the
v1 trigger-contract cleanup or long-horizon orchestration boundary; do not expand
its political domain.

## Startup / freshness

```bash
git status
git fetch origin
git rev-parse HEAD
git rev-parse origin/master
git pull --ff-only
```

The expected remote authorization chain starts from this task commit plus later
ChatGPT-authored Bridge-only activation commits. Do not trust an unfetched local
`origin/master`.

## Verification

- preferred Node 24.19.0 / pnpm 11.19.0; if unavailable record exact runtime;
- `pnpm install --frozen-lockfile`;
- `pnpm run format`;
- `pnpm run typecheck`;
- `pnpm run lint`;
- `pnpm run build`;
- `pnpm run inspect:t024`;
- `pnpm run inspect:f01`;
- `pnpm run inspect:f04b`;
- `pnpm run inspect:f04d`;
- `pnpm run inspect:f05` unchanged historical baseline;
- new focused F05_FIX7 long-horizon integration inspection;
- focused proposal/action/persistence tests as touched;
- `pnpm test`;
- `git diff --check`.

## Completion state

On successful completion:

- `F05_FIX7: COMPLETE / AWAITING_CHATGPT_REVIEW`;
- `LAST_COMPLETED_TASK_ID: F05_FIX7`;
- `NEXT_AUTHORIZED_TASK_ID: NONE`;
- `NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW`;
- `CURRENT_TASK_FILE: NONE`;
- `V02: NOT STARTED`;
- do not self-authorize promotion or Gate 1F PASS.
