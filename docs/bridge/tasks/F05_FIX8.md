# F05_FIX8 — Proposal Lifecycle Semantics + Non-Accept Divergence Audit

## Status

AUTHORIZED

## Mission

F05_FIX7 proved that the Political Interaction Kernel is meaningful but not ready for promotion. Two issues now block trustworthy integration:

1. `PROPOSAL_REJECT` reopened the same authored demand 48 times without a meaningful state change;
2. 4 `PROPOSAL_IGNORE` and 4 `PROPOSAL_REJECT` branches differed from their matching `NO_TEMPLATE` controls even though no requested intervention was accepted.

This task must diagnose the eight non-accept divergences **before** changing proposal lifecycle semantics, then define the smallest state-grounded reconsideration contract for an explicitly rejected demand. Do not add more proposal subjects, more templates, or pacing filler.

A truthful result that leaves Gate 1F `NOT_READY` is a successful task outcome.

## Required reading

- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `docs/POLITICAL_INTERACTION_KERNEL.md`
- `docs/F05_GATE1F_REPAIR6_POLITICAL_INTERACTION.md`
- `docs/F05_GATE1F_REPAIR7_INTERACTION_INTEGRATION.md`
- `docs/bridge/results/F05_FIX6_RESULT.md`
- `docs/bridge/results/F05_FIX7_RESULT.md`
- `src/sim/state/politicalProposal.ts`
- `src/sim/systems/politicalProposal.ts`
- `src/sim/systems/intervention.ts`
- `src/sim/core/runtimeClosure.ts`
- `src/sim/core/persistence.ts`
- `src/sim/inspection/f03InterventionCounterfactuals.ts`
- `src/sim/inspection/f05PacingFunDecision.ts`
- `src/sim/inspection/f05Fix7InteractionIntegration.ts`

## Phase A — non-accept divergence causal audit MUST happen first

Before any production proposal-lifecycle mutation:

1. enumerate the exact 8 F05_FIX7 branches where `PROPOSAL_IGNORE` or `PROPOSAL_REJECT` had a state-grounded trajectory difference from the matching `NO_TEMPLATE` control;
2. for each branch identify the **first absolute/relative tick of divergence**;
3. at that tick compare, at minimum:
   - accepted `ActionRecord` stream and sequence order;
   - carried faction actions;
   - phase output events;
   - authoritative WorldState fields;
   - intervention feasibility/commitment state;
   - proposal state;
   - Agenda/reassessment measurement inputs;
4. isolate runner-vs-template effects with paired controls. Prefer a three-way probe where possible:
   - historical/no-template using the historical F05 runner;
   - no-template using the F05_FIX7 integration runner;
   - template-enabled IGNORE or REJECT using the same integration runner;
5. classify every divergence as exactly one of:
   - `ORCHESTRATION_ORDER_EFFECT`
   - `RUNNER_IMPLEMENTATION_ARTIFACT`
   - `PROPOSAL_STATE_HAS_REAL_EXISTING_CONSUMER`
   - `MEASUREMENT_SIGNATURE_ARTIFACT`
   - `EXPECTED_EXISTING_SYSTEM_INTERACTION`
   - `UNRESOLVED`
6. if an unintended developer-runner/measurement artifact is proven, fix **only that developer orchestration/measurement seam**, preserve production gameplay, and rerun the audit;
7. do not change gameplay merely to force IGNORE/REJECT to match the control;
8. if any branch remains `UNRESOLVED`, stop lifecycle implementation and return `NON_ACCEPT_DIVERGENCE_UNRESOLVED`.

Create `docs/F05_FIX8_NON_ACCEPT_DIVERGENCE_AUDIT.md` with branch-by-branch evidence.

## Phase B — define demand identity and reconsideration semantics

Only after Phase A is resolved, create `docs/F05_FIX8_PROPOSAL_LIFECYCLE_SEMANTICS.md` before implementation.

### Stable demand identity vs proposal episode

The design must distinguish:

- a stable **demand identity** representing “this faction asks this country for this subject”;
- an individual **proposal episode** addressed to a captured Government and opened by one accepted LOBBY ActionRecord.

Preferred v1 demand identity, unless source inspection proves a narrower equivalent:

```text
proposerFactionId
+ countryId
+ subjectKind
+ interventionId
```

`targetGovernmentId`, opening/response action IDs, event IDs, and ticks are episode/provenance, not demand identity.

Do not create a generic political-demand score or stringly hidden hash.

### Reconsideration rule

Explicit rejection must mean something, but must **not** create either:

- a time cooldown/countdown; or
- a permanent gate shutoff under unchanged Government forever regardless of relevant state.

For v1, an explicitly rejected demand may open a new proposal episode only when a **named, deterministic, existing authoritative condition relevant to the requested intervention has materially changed** since the latest explicit rejection of that demand.

Preferred minimal reconsideration basis is:

1. current target `GovernmentId`; and
2. the requested existing intervention's discrete feasibility state, including the boolean feasibility result and stable rejection-reason/prerequisite class needed to explain why feasibility changed.

If implementation needs anything beyond that, it must be justified from an existing intervention prerequisite/effect-applicability contract. Do **not** include raw continuously drifting scalars merely so the signature changes. Do not depend on Agenda/read-model output for authoritative eligibility.

Examples the v1 contract should support if the existing model can prove them:

```text
REJECT at basis A
+ same Government
+ same requested-intervention feasibility basis A
=> do not reopen identical demand

REJECT at basis A
+ Government changes
=> new episode may be considered against the new Government

REJECT at basis A
+ requested intervention changes feasibility class/reason because relevant authoritative state changed
=> new episode may be considered
```

Pure passage of time, repeated monthly LOBBY, new action IDs, or unrelated scalar drift must not by themselves authorize reopening.

`IGNORE` remains one open proposal maximum. Do not change ACCEPT semantics in this task unless strictly required by persistence/invariant compatibility.

### Persistence

If the reconsideration basis must become authoritative proposal state, version persistence explicitly. Expected outcome is `SerializedSimulationSnapshotV4` / format version 4, with V3 explicitly rejected and no hidden migration. If a correct implementation can avoid new authoritative persisted state, explain why and preserve V3.

Any persisted basis must have strict decoding, reference validation, provenance closure, canonical ordering, save/load equality, and replay determinism.

## Phase C — implementation and counterfactuals

Implement the smallest lifecycle change only if Phase A and Phase B both pass.

Required focused counterfactuals:

1. explicit REJECT + unchanged reconsideration basis + repeated eligible LOBBY opportunities -> **no identical-demand reopen**;
2. explicit REJECT + Government change -> reopen is allowed only as a new episode to the new current Government;
3. explicit REJECT + real requested-intervention feasibility-basis change -> reopen is allowed;
4. explicit REJECT + unrelated raw scalar drift that does not change the approved basis -> no reopen;
5. IGNORE -> still at most one matching open proposal;
6. ACCEPT -> existing F05_FIX6 intervention path and provenance remain unchanged;
7. insertion-order independence and same-tick action ordering remain deterministic;
8. save/load/replay preserves lifecycle eligibility exactly if persistence changes.

Then rerun:

- the unchanged historical 36-branch F05 baseline;
- the separate F05_FIX7 long-horizon proposal matrix with all 108 proposal-enabled branches.

Measure at minimum:

- identical-demand reopen count;
- legitimate reopen count and the exact basis transition that justified each;
- IGNORE/REJECT non-accept divergence count after the audit/fix;
- ACCEPT state-grounded effect count;
- state-grounded max reassessment silence;
- post-intervention late state-grounded silence;
- proposal decision load separately;
- response dominance;
- neighboring one-day timing behavior.

Proposal lifecycle events still do not become F05 pacing events merely to improve the metric.

## Forbidden scope

- arbitrary cooldown, expiry timer, or “wait N days before retry”;
- permanent rejected-demand ban with no state-based reconsideration path;
- raw scalar snapshot/hash whose only purpose is to make reopening happen;
- Agenda/read-model values as authoritative proposal eligibility;
- new proposal subjects, additional authored templates, BARGAIN/counteroffers/full settlement;
- new faction resource/organization/grievance effects;
- proposal-specific combat modifiers;
- generic hidden utility, political-power, reform-point, or stability meters;
- random/probabilistic response, QRE/logit randomness, Nash/CFR/PSRO/MCTS/RL;
- runtime LLM/MCP NPC decisions;
- continuity decay/restoration, sovereignty meter, T023 changes;
- automatic successor/revolutionary Government creation;
- direct crisis deletion/conflict resolution/free LandHex/hidden comeback;
- elections/parties/coalitions/full labor bargaining/transitional justice/military factions/local autonomy;
- War as Politics / fantasy / V02 / renderer/UI;
- story nodes/countdowns/filler events;
- changing historical F05 strategy semantics;
- self-authorizing Gate 1F PASS or any follow-up task.

## Expected output

Required artifacts:

- `docs/F05_FIX8_NON_ACCEPT_DIVERGENCE_AUDIT.md`
- `docs/F05_FIX8_PROPOSAL_LIFECYCLE_SEMANTICS.md`
- `docs/F05_GATE1F_REPAIR8_PROPOSAL_LIFECYCLE.md` if implementation occurs
- `docs/bridge/results/F05_FIX8_RESULT.md`

Required result fields:

```text
NON_ACCEPT_DIVERGENCE:
  ORCHESTRATION_ARTIFACT_FIXED |
  EXPECTED_CAUSAL |
  MIXED_EXPLAINED |
  UNRESOLVED

RECONSIDERATION_MODEL:
  IMPLEMENTED_STATE_GROUNDED |
  DESIGN_ONLY_INSUFFICIENT |
  BLOCKED

PERSISTENCE_FORMAT:
  V3_UNCHANGED | V4

IDENTICAL_REOPEN_CHURN:
  CLOSED | REDUCED | PRESENT

LEGITIMATE_REOPEN_EVIDENCE:
  YES | NO | NOT_IMPLEMENTED

HISTORICAL_F05_BASELINE:
  UNCHANGED | CHANGED

STATE_GROUNDED_MAX_REASSESSMENT_SILENCE: <days>
POST_INTERVENTION_LATE_SILENCE: <days>
READY_FOR_F05_PROMOTION: YES | NO
GATE1F_RECOMMENDATION: PASS | PASS_WITH_NOTES | NOT_READY
V02: NOT STARTED
```

Primary classification must be one of:

- `LIFECYCLE_RECONSIDERATION_IMPLEMENTED_PACING_IMPROVED`
- `LIFECYCLE_RECONSIDERATION_IMPLEMENTED_PACING_STILL_BLOCKED`
- `NON_ACCEPT_DIVERGENCE_UNRESOLVED`
- `LIFECYCLE_RECONSIDERATION_MODEL_INSUFFICIENT`
- `LIFECYCLE_IMPLEMENTATION_BLOCKED_BY_PERSISTENCE_OR_INVARIANTS`

## Startup / freshness

```bash
git status
git fetch origin
git rev-parse HEAD
git rev-parse origin/master
git pull --ff-only
```

Do not trust an unfetched local `origin/master`.

## Verification

- preferred Node 24.19.0 / pnpm 11.19.0; if unavailable record exact runtime
- `pnpm install --frozen-lockfile`
- `pnpm run format`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run build`
- `pnpm run inspect:t024`
- `pnpm run inspect:f01`
- `pnpm run inspect:f04b`
- `pnpm run inspect:f04d`
- `pnpm run inspect:f05` unchanged historical baseline
- focused divergence audit inspection/tests
- focused proposal lifecycle/persistence tests if implementation occurs
- rerun F05_FIX7-style long-horizon integration matrix if implementation occurs
- `pnpm test`
- `git diff --check`

## Commit policy

`COMMIT_AND_PUSH_ON_PASS`

PASS means the divergence audit is complete and truthful, lifecycle semantics are explicit, any implementation is state-grounded and deterministic, persistence/replay remains valid, and the long-horizon rerun is reported honestly. PASS does **not** mean Gate 1F passed.

## On completion

- set `F05_FIX8: COMPLETE / AWAITING_CHATGPT_REVIEW` or truthful blocked state;
- set `LAST_COMPLETED_TASK_ID: F05_FIX8`;
- set `NEXT_AUTHORIZED_TASK_ID: NONE`;
- set `NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW`;
- set `CURRENT_TASK_FILE: NONE`;
- keep `V02: NOT STARTED`;
- do not add another interaction domain;
- do not declare Gate 1F passed.
