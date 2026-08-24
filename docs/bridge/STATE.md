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

F05_FIX6_IMPLEMENTATION_COMMIT: e8be5701fcb65e228cbff027203ccea184ea7e44

F05_FIX6_RESULT_COMMIT: ef87782188de9337661e8d5a54e7845f9bb7e325

F05_FIX7_TASK_COMMIT: 20a9b0e7db45bbec092012456a638fd921009bd5

CURRENT_GATE: Gate 1F

CURRENT_PHASE: F05_FIX7 Political Interaction long-horizon integration measurement

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

F05_FIX5: COMPLETE / REVIEWED

F05_FIX5_TASK: PASS / ACCEPTED

F05_FIX5_CLASSIFICATION: INSUFFICIENT_ACTION_CONSEQUENCE_GROUNDING

F05_FIX5_SELECTED_ACTION: NONE

F05_FIX5_CONCLUSION: action labels alone cannot justify scalar consequences; represented political proposal/response state was required

F05_FIX6: COMPLETE / REVIEWED

F05_FIX6_TASK: PASS / ACCEPTED

F05_FIX6_CLASSIFICATION: KERNEL_IMPLEMENTED_VERTICAL_SLICE_MEANINGFUL

F05_FIX6_PROPOSAL_SUBJECT_KIND: interventionRequest

F05_FIX6_TRIGGER_ACTION: LOBBY

F05_FIX6_PLAYER_RESPONSE: ACCEPT / REJECT

F05_FIX6_PERSISTENCE_FORMAT: SerializedSimulationSnapshotV3 / format version 3

F05_FIX6_TARGETED_COUNTERFACTUAL: meaningful

F05_FIX6_OFFICIAL_F05_PACING: unchanged / NOT_READY

F05_FIX7: COMPLETE / AWAITING_CHATGPT_REVIEW

F05_FIX7_IMPLEMENTATION_COMMIT: 60a4a1d

F05_FIX7_RESULT_COMMIT: d89c386

F05_FIX7_CLASSIFICATION: PROPOSAL_RESPONSE_DOMINANCE_OR_CHURN

F05_FIX7_HISTORICAL_F05_BASELINE: UNCHANGED

F05_FIX7_V1_TRIGGER_CONTRACT: CLOSED

F05_FIX7_PROPOSAL_MATRIX: 36 historical + 108 proposal = 144 branches

F05_FIX7_STATE_GROUNDED_MAX_REASSESSMENT_SILENCE: 1200 days

F05_FIX7_PROPOSAL_DECISION_MAX_SILENCE: 1800 days

F05_FIX7_POST_INTERVENTION_LATE_SILENCE: 1110 days

F05_FIX7_REOPEN_CHURN: PRESENT / 48 identical-key reopens

F05_FIX7_RESPONSE_DOMINANCE: MIXED

F05_FIX7_READY_FOR_F05_PROMOTION: NO

F05_FIX7_GATE1F_RECOMMENDATION: NOT_READY

F05_FIX7_DIRECTION: preserve historical F05 baseline and run a separate five-year proposal-response integration matrix

F05_FIX7_RESPONSE_MODES: NO_TEMPLATE control / PROPOSAL_IGNORE / PROPOSAL_REJECT / PROPOSAL_ACCEPT_IF_FEASIBLE

F05_FIX7_REQUIRED_CLEANUP: v1 FactionProposalTemplate trigger contract must be LOBBY-only

F05_FIX7_GATE_METRIC_RULE: proposal lifecycle events alone do not count as pacing repair; state-grounded reassessment remains the Gate-relevant comparison

F05_FIX7_PRIMARY_QUESTION: does proposal-response interaction durably reduce the early/near 1,200-day late steady-state gap after the requested intervention completes?

GATE1F_CHATGPT_DECISION: NOT_READY

V02: NOT STARTED

POLITICAL_COMPETITION: IMPLEMENTED — `banned | restricted | plural`

PERSISTENCE: SerializedSimulationSnapshotV3; V2 is explicitly rejected

LAST_COMPLETED_TASK_ID: F05_FIX7

NEXT_AUTHORIZED_TASK_ID: NONE

NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW

CURRENT_TASK_FILE: NONE

LAST_RESULT_FILE: `docs/bridge/results/F05_FIX7_RESULT.md`

FUTURE_REFERENCE_GROUNDING_GATES: `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`

## ChatGPT acceptance of F05_FIX6

ChatGPT accepts F05_FIX6 as a correct and meaningful Political Interaction Kernel vertical slice.

Accepted facts:

- explicit scenario-authored `LOBBY -> InterventionId` mapping is used; no demand is inferred from ideology/interests;
- `PoliticalProposal` is authoritative WorldState with proposer, Country, captured Government, interventionRequest subject, lifecycle, and provenance;
- player `RESPOND_POLITICAL_PROPOSAL(accept|reject)` is a normal accepted ActionRecord;
- REJECT preserves the requested-intervention status quo;
- ACCEPT uses the response ActionRecord itself as the source of the existing intervention feasibility/cost/admin/duration/commitment/effect path;
- no hidden synthetic `START_INTERVENTION` ActionRecord exists;
- stale Government targets are rejected without retargeting;
- infeasible ACCEPT leaves the proposal open and does not start the intervention;
- proposal state/provenance round-trip under strict snapshot V3 and V2 is rejected;
- no proposal-owned LandHex, conflict, continuity, Government-transition, or terminal writer was added;
- the same-seed NO_PROPOSAL / IGNORE / REJECT / ACCEPT counterfactual is meaningful because only ACCEPT reaches the existing bounded intervention consequence;
- official F05 remains unchanged, so Gate 1F remains NOT_READY.

Minor accepted cleanup for the next task:

- v1 scenario template typing/validation currently permits the full FactionActionType vocabulary while the implemented opener/provenance contract is LOBBY-only; F05_FIX7 must close that configuration footgun without generalizing the political domain.

## F05_FIX7 integration direction

F05_FIX7 must not add new proposal subjects or new faction effects. It must integrate the accepted kernel into a developer-only long-horizon F05 comparison while preserving the historical official 36-branch F05 result.

Required response policies:

```text
NO_TEMPLATE
PROPOSAL_IGNORE
PROPOSAL_REJECT
PROPOSAL_ACCEPT_IF_FEASIBLE
```

The proposal-enabled matrix must cross the existing six F05 contexts and six existing intervention strategies with IGNORE / REJECT / ACCEPT_IF_FEASIBLE. The historical NO_TEMPLATE 36 branches remain the control.

Measurement must separate:

1. state-grounded reassessment — existing pacing events, Agenda changes, intervention feasibility/choice changes, and real state consequences;
2. proposal decision load — proposal open/resolve/actionability changes reported separately.

Proposal lifecycle events must not be added to `PACING_EVENT_TYPES` merely to shorten silence. Repeated identical proposals after rejection must be diagnosed as churn rather than automatically suppressed with a new cooldown or timer.

F05_FIX7 may recommend `READY_FOR_F05_PROMOTION: YES` if the interaction produces robust, non-dominant, state-grounded long-horizon improvement. It must not itself redefine the official F05 strategy matrix, pass Gate 1F, authorize V02, or authorize a follow-up task.

## Still forbidden

- direct scalar faction bonuses from proposal lifecycle;
- additional proposal templates for pacing variety;
- BARGAIN/counteroffer/full settlement systems;
- generic utility/political-power/stability meters;
- probabilistic player response or autonomous production player AI;
- Nash/CFR/fictitious-play/PSRO/MCTS/RL/QRE or runtime LLM/MCP NPC decisions;
- continuity decay/restoration, sovereignty meter, or T023 changes;
- automatic successor/revolutionary Government creation;
- direct crisis deletion/conflict resolution/free LandHex/hidden comeback;
- proposal cooldown/expiry/rejection-memory added only to improve pacing;
- elections/parties/coalitions/full labor bargaining/transitional justice/military factions/local autonomy;
- War as Politics / fantasy / V02 / renderer/UI;
- story nodes/countdowns/filler events;
- self-authorizing Gate 1F PASS or another follow-up task.

## Bridge freshness requirement

Before starting F05_FIX7, Codex must explicitly run:

```bash
git status
git fetch origin
git rev-parse HEAD
git rev-parse origin/master
git pull --ff-only
```

The expected remote chain is the immutable F05_FIX7 task commit followed only by ChatGPT-authored Bridge activation/current-task commits. Do not rely on a stale local `origin/master` tracking ref. Gate 1F remains ChatGPT/user authority.
