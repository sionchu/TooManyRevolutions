# TMR Bridge State

UPDATED: 2026-08-24

REPOSITORY: sionchu/TooManyRevolutions

BRANCH: master

F04_CLOSED_COMMIT: 2db9ccd43b09bc4f24bb6980b5bd200b5464c5fc

F05_MEASUREMENT_COMMIT: 1866287e87072fc9b62f55a4af940f9d0e54b15b

GATE1F_REVIEW_COMMIT: 2423e629b018052d24f495793e10803cd5a0f837

F05_FIX1_REPAIR_COMMIT: 60c584543f1cfaf89c2066f8060859e7a6d2f103

F05_FIX2_REPAIR_COMMIT: 57bb80db449be0a29cb788e9f49b260eab290416

F05_FIX2_RESULT_COMMIT: cc51ad77d9ffa27afc49f21fe92dc0992e6ac846

F05_FIX2_R_RESULT_COMMIT: 1191bd1865200f4542d571a8af493392b075c4bd

F05_FIX3_IMPLEMENTATION_COMMIT: 49511e43d40d39408ad96e31d45109eb79afa63c

F05_FIX3_RESULT_COMMIT: 1c7666471bbbb22ee0bb1cb25801c6b9007f2a2d

F05_FIX4_IMPLEMENTATION_COMMIT: 557b1327d4f561a24e32aee31f2f7c3c0ad15b15

F05_FIX4_RESULT_COMMIT: 9d8324cdb5db13bbccad04ff5400e8ea0dffcafd

F05_FIX5_TASK_COMMIT: f09aa6ce62dadba29427e2139772846d3d98be4e

F05_FIX5_RESULT_COMMIT: 1bf0542dcd3584ff283d92a00461fdf6f134a416

F05_FIX6_TASK_COMMIT: 4399a7b661075266f6d6d64adc3fdc3b74b3e506

F05_FIX6_IMPLEMENTATION_COMMIT: e8be570

F05_FIX6_RESULT_COMMIT: PENDING_COMPLETION_METADATA_COMMIT

CURRENT_GATE: Gate 1F

CURRENT_PHASE: F05_FIX6 Political Interaction Kernel + one vertical slice

F04: CLOSED / PASS

F05: MEASUREMENT_COMPLETE / REVIEWED

F05_FIX1: REPAIR_COMPLETE / REVIEWED

F05_FIX2: REPAIR_COMPLETE / REVIEWED

F05_FIX2_MEASUREMENT: TRUSTWORTHY_BUT_TERMINAL_MECHANISM_REJECTED

F05_FIX2_R: REVIEW_COMPLETE / REVIEWED

F05_FIX2_R_ARCHITECTURE_VERDICT: REJECT_WRITER_REQUIRES_NEW_CONTINUITY_EVIDENCE

F05_FIX3: REPAIR_COMPLETE / REVIEWED

F05_FIX3_WRITER_REMOVAL: PASS / ACCEPTED

F05_FIX3_MEASUREMENT: TRUSTWORTHY_LATE_STEADY_STATE_RETURNED

F05_FIX4: REPAIR_COMPLETE / REVIEWED

F05_FIX4_IMPLEMENTATION: PASS / ACCEPTED

F05_FIX4_PROPOSAL_INTAKE_GAP: CLOSED

F05_FIX4_IMPACT: INTAKE_FIX_STRATEGY_ONLY

F05_FIX4_REMAINING_BLOCKER: ACTOR_ACTION_CONSUMER_GAP

F05_FIX5: COMPLETE / REVIEWED

F05_FIX5_TASK: PASS / ACCEPTED

F05_FIX5_CLASSIFICATION: INSUFFICIENT_ACTION_CONSEQUENCE_GROUNDING

F05_FIX5_SELECTED_ACTION: NONE

F05_FIX5_ACTIVE_CONFLICT_CONSUMER: NONE

F05_FIX5_CONCLUSION: action labels alone cannot justify scalar consequences; the missing layer is represented political commitment/proposal/response state

F05_FIX6: COMPLETE / AWAITING_CHATGPT_REVIEW

F05_FIX6_DIRECTION: Political Interaction Kernel implemented with one explicit proposal-response vertical slice; awaiting ChatGPT review

F05_FIX6_PREFERRED_TRIGGER: LOBBY with explicit scenario-authored proposal template only — implemented

F05_FIX6_PREFERRED_SUBJECT: existing InterventionId request, not a new scalar payoff — implemented as interventionRequest

F05_FIX6_PLAYER_RESPONSE: ACCEPT / REJECT; ACCEPT reuses normal intervention feasibility/cost/admin/duration/effects — implemented

F05_FIX6_CLASSIFICATION: KERNEL_IMPLEMENTED_VERTICAL_SLICE_MEANINGFUL

F05_FIX6_PROPOSAL_SUBJECT_KIND: interventionRequest

F05_FIX6_TRIGGER_ACTION: LOBBY

F05_FIX6_PERSISTENCE_FORMAT: SerializedSimulationSnapshotV3 / format version 3

F05_FIX6_TARGETED_COUNTERFACTUAL: meaningful

F05_FIX6_OFFICIAL_F05_PACING: unchanged / NOT_READY

F05_FIX6_GATE1F_RECOMMENDATION: NOT_READY

GATE1F_CHATGPT_DECISION: NOT_READY

V02: NOT STARTED

POLITICAL_COMPETITION: IMPLEMENTED — `banned | restricted | plural`

PERSISTENCE: SerializedSimulationSnapshotV3; V2 is explicitly rejected after F05_FIX6 authoritative proposal state

LAST_COMPLETED_TASK_ID: F05_FIX6

NEXT_AUTHORIZED_TASK_ID: NONE

NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW

CURRENT_TASK_FILE: NONE

LAST_RESULT_FILE: `docs/bridge/results/F05_FIX6_RESULT.md`

FUTURE_REFERENCE_GROUNDING_GATES: `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`

## ChatGPT acceptance of F05_FIX5

ChatGPT accepts F05_FIX5 as a correct grounding-only task.

Accepted facts:

- all five active faction action labels were audited;
- no action passed the complete cost/commitment/boundedness/magnitude/counterfactual gate;
- production gameplay correctly remained unchanged;
- `FUND_MOVEMENT` and `ORGANIZE` have plausible T018/T021 consumers but lack represented commitment semantics;
- `LOBBY` lacks a represented demand/recipient/outcome;
- `BARGAIN` lacks offer/counterpart/acceptance/settlement;
- `ACCEPT` lacks an accepted object and cannot justify a generic grievance reduction;
- baseline F05 remains early/near 1,200-day late steady-state and recovery 510-day reassessment silence;
- therefore the next layer is not a scalar payoff but a represented political interaction object.

## F05_FIX6 architecture direction

F05_FIX6 must define the minimum interaction grammar:

```text
Faction
-> accepted political action
-> concrete proposal to current Government
-> player/state ACCEPT or REJECT
-> status quo on rejection
-> existing authoritative resolver on acceptance
-> downstream systems re-evaluate from resulting state
```

Preferred first slice:

- trigger: existing accepted `LOBBY`, but only when an explicit scenario-authored proposal template exists;
- proposal subject: request an existing `InterventionId`;
- target: Country.currentGovernmentId captured when proposal opens;
- response: player/state `ACCEPT | REJECT` on a later tick;
- `ACCEPT` must reuse the requested InterventionDefinition's existing feasibility, treasury cost, administrative load, duration, commitment, completion effects, and events;
- no direct grievance/organization/territory/conflict/continuity/terminal effect is owned by the proposal kernel;
- first developer fixture should prefer an already-existing F04D intervention such as `coerciveRestriction` if it can be reused without duplication; the faction-to-demand mapping must be explicitly authored fixture content and never inferred from interests/ideology.

External formal grounding accepted for the task:

- Romer & Rosenthal: proposal versus status quo / agenda control;
- veto-player models: policy change requires agreement of blocking/responding actors;
- Cameron & McCarty: proposal-response bargaining is institutionally conditioned;
- sequential/ultimatum bargaining may justify offer -> accept/reject only; no equilibrium solver, discounting model, or stochastic acceptance;
- F05_FIX5 lobbying references support a demand/access stage, not automatic policy success.

If authoritative open proposal state is added to WorldState, persistence must be explicitly versioned (expected snapshot V3), fully decoded/validated, replay deterministic, and prior versions explicitly rejected unless a separate migration is authored. Do not hide proposal state outside persistence.

## Still forbidden

- direct faction scalar bonuses from action names
- generic utility / political-power / stability meters
- inferred demands from ideology/interests
- automatic policy/intervention success from LOBBY
- automatic counteroffers / full bargaining system
- Nash/CFR/MCTS/RL/QRE / runtime LLM or MCP NPC decisions
- continuity decay/restoration / sovereignty meter / T023 threshold changes
- automatic successor Government creation or revolutionary succession
- direct crisis deletion / conflict resolution / free LandHex / hidden comeback
- elections / parties / coalitions / full labor bargaining / transitional justice / military factions / local autonomy
- War as Politics / fantasy / V02 / renderer / UI
- story nodes / countdowns / filler events
- self-authorizing Gate 1F PASS or another follow-up task

## Bridge freshness requirement

Before starting F05_FIX6, Codex must explicitly run:

```bash
git status
git fetch origin
git rev-parse HEAD
git rev-parse origin/master
git pull --ff-only
```

Do not rely on a stale local `origin/master` tracking ref. Gate 1F remains ChatGPT/user authority.
