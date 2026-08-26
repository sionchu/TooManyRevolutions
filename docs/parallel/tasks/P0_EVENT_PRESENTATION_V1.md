# P0 Event Presentation V1 — Fact-backed News / Toast / Decision Read Model

EXECUTION_AUTHORITY: THIS_FILE_ONLY

## Base / scope

- branch: `parallel-p0-event-presentation-v1`
- exact base: `e521961e25e4b20c70245137216c80a103120420`
- this is a presentation/read-model-only track.
- it must not modify simulation outcomes, event emission, policy/intervention content, map rendering, audio, icons, CSS, App wiring, Gate1F, persistence, deployment, or difficulty.

## Why this task exists

TMR already records factual events and authoritative political proposals, but the player-facing product does not yet have a clean distinction between:

- small observable changes,
- major newsworthy events,
- events that require a real player response,
- events that should remain only in the long-form Chronicle.

Do not create another Event system. The existing authorities remain:

```text
WorldState / EventStore / PoliticalProposal
        ↓
pure presentation classification
        ↓
TOAST | NEWS | DECISION_REQUIRED | CHRONICLE_ONLY
```

This branch produces only that classification/read model. UI rendering is owned by later reconciliation after the UI/Game Flow tracks complete.

## Existing authorities to preserve

Read before implementation:

- `src/sim/events/event.ts`
- `src/sim/state/politicalProposal.ts`
- `src/sim/state/action.ts`
- `src/app/gamePresentation.ts`
- `src/app/chronicleDigest.ts`
- `src/app/autoPause.ts` only to understand current behavior; do not edit it

Important:

- `GameEvent` / EventStore is factual event authority.
- `PoliticalProposal` is authoritative response-required state.
- `RESPOND_POLITICAL_PROPOSAL` is the existing accept/reject action path.
- `eventLabel()` already owns current Korean event wording. Do not duplicate the entire event-to-copy switch in this branch.
- Chronicle remains the long-form factual history surface.

## Clean-v0 requirement

Do not add:

- `EventManager`
- `NewsManager`
- `NotificationService`
- another event bus
- another persisted event queue
- synthetic notification state in WorldState
- fake scripted events
- fake decisions without an authoritative proposal

Prefer one small pure read-model module plus focused tests.

Suggested seam:

`src/presentation/eventPresentation.ts`

Exact name may vary only if an existing canonical presentation folder provides a clearly better home.

## Presentation kinds

Use exactly these primary kinds unless the existing code proves one is impossible to express cleanly:

```ts
"TOAST" | "NEWS" | "DECISION_REQUIRED" | "CHRONICLE_ONLY"
```

A terminal event should normally remain `NEWS` plus factual metadata such as `terminal: true`; do not invent a fifth parallel notification framework just for terminal state.

## Required output shape

A presentation item should contain only factual/read-model information needed by later UI integration, for example:

- stable item id derived from source identity
- presentation kind
- primary `eventId`
- `sourceEventIds`
- tick
- event type
- factual affected Region / Faction / Country / Government IDs when available from existing event/proposal data
- `proposalId` only when backed by an actual `PoliticalProposal`
- `requiresResponse: true` only for a currently open authoritative proposal
- `terminal` when supported by the event/run fact
- deterministic priority/order metadata if needed

Do not store marketing prose or duplicate all of `eventLabel()` copy. Later UI integration may combine this read model with the existing event labeling/copy authority.

## Classification rules

Use explicit deterministic rules, not a generic weighted importance score.

### DECISION_REQUIRED

`POLITICAL_PROPOSAL_OPENED` may become `DECISION_REQUIRED` only when an actual matching `PoliticalProposal` exists and is currently `open` for the relevant player country/government.

No proposal state = no decision prompt.

Do not create fake accept/reject choices for:

- rebellion start
- coup start
- government transition result
- border closure
- resource shortage
- conflict state

unless an accepted authoritative proposal/action domain already exists for that exact decision.

### NEWS

At minimum treat genuinely major factual transitions as newsworthy:

- `REBELLION_STARTED`
- `COUP_ATTEMPT_STARTED`
- `CIVIL_WAR_STARTED`
- `GOVERNMENT_TRANSITIONED`
- `STATE_DISSOLVED`

Audit whether `ORDER_CONSOLIDATED` and major `CONFLICT_RESOLVED` should also be NEWS based on their actual product meaning. Do not promote them just to increase count.

### TOAST

Use for important but non-modal factual feedback where the player should notice the change without losing world flow. Appropriate existing candidates may include:

- policy enacted/rejected
- intervention started/completed/rejected
- institution rule change
- meaningful shortage/unrest band change
- border closed/reopened
- major territory controller change

Keep this bounded. Do not make every significant event a toast.

### CHRONICLE_ONLY

High-frequency or lower-priority factual changes that are valuable historically but would create notification spam should remain Chronicle-only.

Examples may include routine ideology/faction trend changes or repeated low-level state movements when they do not cross an already important threshold.

The exact bounded list must be justified in tests/result.

## Dedupe / precedence

The same source fact must not generate multiple player-facing items of different kinds.

Required precedence:

```text
DECISION_REQUIRED > NEWS > TOAST > CHRONICLE_ONLY
```

Examples:

- a `POLITICAL_PROPOSAL_OPENED` with a valid open proposal is one `DECISION_REQUIRED` item, not both a toast and decision prompt.
- a terminal/state-dissolution event is one major NEWS item, not duplicate news+toast entries.

If multiple different events occur on the same tick, keep them separate unless they are provably one causal presentation cluster and the repository already has a stable grouping seam. Do not invent heuristic causal grouping in this task.

## World-flow compatibility

This read model must not pause or slow time itself.

The separate Game Flow/Pacing track owns playback reaction.

Later reconciliation will combine them conceptually as:

```text
major event
→ presentation says NEWS
→ game-flow says SLOW
→ world continues
```

Do not import or modify App playback state here.

## Required canonical tests

At minimum add deterministic tests for:

1. routine/low-level event -> `CHRONICLE_ONLY` or bounded `TOAST` according to explicit rule.
2. `POLICY_ENACTED` -> `TOAST`.
3. `REBELLION_STARTED` -> `NEWS`, no response required.
4. `COUP_ATTEMPT_STARTED` -> `NEWS`, no fake accept/reject response.
5. `GOVERNMENT_TRANSITIONED` -> `NEWS`.
6. `STATE_DISSOLVED` -> `NEWS` with terminal metadata.
7. `POLITICAL_PROPOSAL_OPENED` + matching open proposal -> exactly one `DECISION_REQUIRED` item with proposal id.
8. proposal-open event but proposal already accepted/rejected -> no `DECISION_REQUIRED`.
9. proposal-open event without matching authoritative proposal -> no fake decision item.
10. insertion order of events/proposals does not change deterministic output.
11. precedence prevents duplicate presentation for one source event.

Use existing fixture/builders where possible. Do not create a second giant scenario fixture merely for notification tests.

## Allowed files

Prefer:

- `src/presentation/eventPresentation.ts`
- `src/presentation/eventPresentation.test.ts`
- optional existing presentation index export only if necessary
- `docs/parallel/P0_EVENT_PRESENTATION_V1_RESULT.md`

Do not touch:

- `src/app/App.tsx`
- `src/app/CrisisBanner.tsx`
- `src/app/ChroniclePanel.tsx`
- `src/app/ContextualDock.tsx`
- `src/app/DecisionPanel.tsx`
- `src/app/TimeControls.tsx`
- `src/app/autoPause.ts`
- `src/styles/global.css`
- `src/app/PoliticalWorldStage.tsx`
- `src/sim/**` production behavior
- map/audio/icon/model assets

If a current type is insufficient, stop and document the exact blocker instead of broadening simulation authority in this branch.

## Verification

Run focused tests plus:

- typecheck
- lint
- format
- build
- `git diff --check`

Do not run the long full suite during this timeboxed parallel task.

## Result

Write:

`docs/parallel/P0_EVENT_PRESENTATION_V1_RESULT.md`

Include:

- exact classification table
- files changed
- canonical test cases/results
- deferred event types and why
- proof no synthetic event/proposal state was introduced
- integration API

Commit/push and STOP.

No UI integration, P0 PASS, Gate1F PASS, deploy, successor task, difficulty, or History redesign is authorized.