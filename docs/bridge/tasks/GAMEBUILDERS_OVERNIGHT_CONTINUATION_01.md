# GAMEBUILDERS_OVERNIGHT_CONTINUATION_01 — Authorized Bounded Continuation Queue

STATUS: AUTHORIZED
APPLIES_AFTER: GAMEBUILDERS_DEMO_SPRINT_01 primary checkpoints
TIME_BUDGET_INTENT: use the available unattended 4–5 hour window productively
BASE_ACCEPTED_CORE: F05_FIX23 / 82bb6018f2fc87d9f1807cab3c12fb5e2e016775

## 0. Purpose

Do not stop merely because the first playable demo implementation finishes quickly.

This queue explicitly authorizes continued unattended work after the primary GameBuilders demo checkpoints, but it is **bounded** so unreviewed Codex conclusions cannot cascade into risky new authoritative simulation writers.

The order below is mandatory. Preserve a working deployable demo at every stage.

## 1. Stage O1 — Complete and verify the playable demo first

Before doing any F05 continuation, finish the currently authorized:

- `GAMEBUILDERS_DEMO_SPRINT_01.md`;
- `GAMEBUILDERS_DEMO_SPRINT_01_TIMEFLOW_ADDENDUM.md`;
- `GAMEBUILDERS_DEMO_SPRINT_01_DEPLOYMENT_ADDENDUM.md`.

A working local production build and the maximum available ChatGPT Sites deployment/preview are required before moving on.

Commit and push the working demo branch before any later stage.

## 2. Stage O2 — Mandatory deterministic horizon audit

Execute the time-flow addendum's exact GameBuilders demo scenario horizon audit through approximately 20 simulated years for multiple real legal trajectories.

Create/update:

`docs/GAMEBUILDERS_DEMO_HORIZON_AUDIT.md`

Classify exactly:

```text
DEMO_HORIZON_STATUS: ROBUST_SHORT_AND_MEDIUM_HORIZON
DEMO_HORIZON_STATUS: STRONG_SHORT_HORIZON_LATE_STALL
DEMO_HORIZON_STATUS: EARLY_STALL_DEMO_BLOCKER
```

Do not hide a late stall by merely slowing the UI clock. Report simulated-year behavior separately from real-time speed.

## 3. Stage O3 — If EARLY_STALL_DEMO_BLOCKER, repair only demo authoring/presentation

If and only if the horizon audit classifies `EARLY_STALL_DEMO_BLOCKER`, spend up to roughly 60–90 minutes improving the GameBuilders vertical slice using only safe demo-layer changes:

Allowed:

- GameBuilders-only initial ScenarioDefinition values;
- selection/composition of existing policies/interventions;
- fixed documented demo seed;
- information hierarchy and action discoverability;
- presentation speed presets;
- factual Agenda/Event presentation;
- client bugs/races that prevent interaction.

Forbidden:

- new crisis timers/countdowns;
- scheduled coup/rebellion;
- fake events/agendas;
- arbitrary Conflict cleanup;
- new operational-evidence/settlement mechanics;
- persistence version changes;
- direct WorldState mutation.

After each meaningful authoring adjustment, rerun the short/medium horizon checks and keep the best honest deterministic configuration.

If the early stall cannot be fixed without changing authoritative core semantics, STOP scenario tuning and record the exact blocker for F05. Do not smuggle a core fix into the demo scenario.

## 4. Stage O4 — Browser/Sites product QA and one repair pass

After the playable/horizon state is stable, perform another product-facing pass.

Verify the deployed/preview Site itself, not only localhost, where the available Sites tooling permits it.

Check at minimum:

- title/start/reset;
- 1920x1080;
- 1440x900 or similar laptop;
- 1366x768;
- narrow/mobile viewport as a non-blocking sanity check;
- no horizontal desktop overflow;
- time play/pause/speed switching;
- optional major-event auto-pause enabled and disabled;
- action submission while time runs;
- Agenda legibility;
- SVG map legibility;
- EventStore/crisis visibility;
- mute/unmute;
- reset deterministic;
- no console-breaking exception;
- page reload / asset loading;
- actual Site deployment URL/preview remains available.

Fix P0/P1 defects discovered by this pass on `gamebuilders-demo-sprint-01`, rerun build/typecheck/lint and relevant focused tests, commit/push, redeploy/update Sites, and verify again.

Do not spend remaining unattended time on pixel-perfect low-value tweaks while functional P0/P1 issues remain.

## 5. Stage O5 — F05_FIX24 may resume only after demo is safely committed/deployed

If substantial unattended time remains after O1–O4, F05_FIX24 is re-authorized **for its existing docs-only scope only**.

Switch to the already prepared `f05-fix24-review` branch, which is based on accepted FIX23.

Read and execute exactly:

`docs/bridge/tasks/F05_FIX24.md`

Restrictions remain absolute:

- docs/research/architecture only;
- no production `src` changes;
- no tests changed except none should be needed;
- no ActionRecord/GameEvent operational-evidence writer;
- no WorldState evidence state;
- no persistence V9;
- no settlement implementation;
- no Gate 1F PASS;
- no V02.

Commit/push F05_FIX24 result to `f05-fix24-review`.

Because ChatGPT will not be awake to independently review it, F05_FIX24 remains `AWAITING_CHATGPT_REVIEW` even after Codex completes it.

## 6. Stage O6 — Conditional next-FIX DESIGN MEMO only

If F05_FIX24 is complete and meaningful time still remains, Codex may create a **non-authoritative design memo only**, not an implementation and not an accepted F05_FIX25 result.

Path:

`docs/F05_FIX25_CONDITIONAL_DESIGN_MEMO.md`

Use the actual F05_FIX24 primary classification and next-readiness to describe the smallest possible successor task.

The memo must contain:

- exact problem to solve;
- source/domain that FIX24 found defensible;
- minimum static/runtime/action/event ownership if any;
- persistence implications;
- writer boundaries;
- focused test plan;
- explicit reasons this next task might still fail to improve Gate 1F;
- whether it can plausibly improve autonomous late-state reassessment rather than merely provide an external/manual seam;
- forbidden shortcuts.

Do NOT:

- create F05_FIX25 production code;
- create a Bridge `AUTHORIZED` F05_FIX25 task;
- modify CURRENT_TASK/STATE to self-authorize;
- introduce new runtime state, ActionRecord, GameEvent, persistence V9, settlement, or territorial semantics.

Commit/push this memo on `f05-fix24-review` after the FIX24 result.

## 7. Stage O7 — Final unattended summary

Before stopping, ensure both branches are pushed as applicable and write a concise final summary into the relevant result docs.

The GameBuilders sprint result must report:

```text
PLAYABLE_LOCAL
TIME_FLOW_STATUS
DEMO_HORIZON_STATUS
SITES_STATUS
SITES_URL_OR_PREVIEW
DEPLOYED_URL_VERIFIED
P0_BLOCKERS
P1_ISSUES
3MIN_CAPTURE_READY
```

If F05_FIX24 was also completed, its own result remains separate and must end:

```text
F05_FIX24: COMPLETE / AWAITING_CHATGPT_REVIEW
NEXT_AUTHORIZED_TASK_ID: NONE
```

Never merge the demo branch and F05 review branch merely for convenience.

## 8. Stop conditions

Stop when any of the following occurs:

1. all O1–O7 applicable work is complete;
2. remaining work requires human visual/product judgment rather than safe implementation;
3. a new authoritative simulation mechanic would be required;
4. external permissions/account interaction prevent further Sites work after the blocker is documented;
5. a destructive Git operation would be required.

The priority is a preserved working GameBuilders build plus useful evidence, not maximum code volume.
