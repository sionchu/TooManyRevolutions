# GAMEBUILDERS_DEMO_SPRINT_01 — Time-Flow & Pacing Addendum

STATUS: REQUIRED
APPLIES_TO: GAMEBUILDERS_DEMO_SPRINT_01
PRIORITY: P0

## 1. Core correction

The player controls the **flow rate of history**. The normal game must not feel like a debug console where the player repeatedly presses `+7 days` or `+30 days` just to make the world move.

Primary controls should therefore be strategy-game-style:

```text
Pause / Play
1x / 2x / 4x (or another small readable set chosen after pacing verification)
```

Manual day-jump controls may exist as secondary capture/debug conveniences but are not the primary player clock.

Every simulated day MUST still execute the accepted authoritative daily pipeline in order:

```text
runSimulationStep(...)
-> commitSimulationStep(...)
-> next day
```

Speed is presentation scheduling only. Never directly mutate tick/date or skip intermediate authoritative days.

## 2. Auto-pause is a user option, not a forced rule

Do NOT hard-code mandatory automatic pause on coup/rebellion as the normal game rule.

Provide an option such as:

```text
[ ] 중요 사건 발생 시 자동 일시정지
```

The option may default ON or OFF based on the best UX observed during the sprint, but it must be user-controllable and presentation-only.

When disabled, major events still need a prominent factual banner/toast/feed treatment without forcibly changing time speed.

Terminal RunOutcome naturally stops further authoritative simulation because the existing core already treats terminal runs as non-advancing; this is not the same as optional major-event auto-pause.

## 3. The real pacing risk: accelerated time exposes late-state silence faster

Fast-forward does NOT solve the accepted Gate 1F problem. It can expose it sooner in real time.

The accepted F05 state still has a known long-horizon risk: after enough simulated time, the world can enter an active-conflict / low-reassessment state where meaningful political interaction becomes sparse. Therefore the demo client must not assume that adding a faster speed makes the game fun.

This sprint MUST perform a dedicated deterministic horizon audit of the actual GameBuilders demo scenario before finalizing normal speed choices.

## 4. Mandatory demo-scenario horizon audit

After the first playable client exists, run the exact fixed-seed GameBuilders demo ScenarioDefinition headlessly under several representative trajectories. At minimum:

```text
A. no player action
B. material/economic relief-oriented response
C. political accommodation/legalization-oriented response
D. coercive/restrictive response
```

Use only actions that actually exist and validate in the demo scenario. If a named branch is unavailable, replace it with another genuinely distinct legal response and document that substitution.

Observe checkpoints at approximately:

```text
Day 0
Day 90
Day 180
Day 360
Day 720
Day 1080
Day 1800
Day 3600
Day 7200  (~20 years)
```

Do NOT force the simulation to reach a pre-authored crisis. This is an audit, not a story script.

Record at minimum per trajectory/checkpoint:

- RunOutcome;
- active Conflict count/kinds/status;
- Agenda count/highest severity;
- accepted/rejected meaningful player-action availability;
- meaningful GameEvent density since prior checkpoint;
- last meaningful political reassessment/event tick;
- major Country state values;
- faction grievance/organization/currentStrategy summaries;
- territorial control summary/front presence;
- whether the state appears interactively alive, temporarily quiet, or structurally stalled.

Create `docs/GAMEBUILDERS_DEMO_HORIZON_AUDIT.md` with the actual results.

## 5. Demo blocker classification

Classify the demo scenario honestly:

```text
DEMO_HORIZON_STATUS: ROBUST_SHORT_AND_MEDIUM_HORIZON
DEMO_HORIZON_STATUS: STRONG_SHORT_HORIZON_LATE_STALL
DEMO_HORIZON_STATUS: EARLY_STALL_DEMO_BLOCKER
```

Definitions:

- `ROBUST_SHORT_AND_MEDIUM_HORIZON`: meaningful interaction continues through the expected hands-on demo horizon and no obvious stall appears early.
- `STRONG_SHORT_HORIZON_LATE_STALL`: the first several minutes / early simulated years are strong, but the known late-state stall appears later. This is acceptable for the event vertical slice only if disclosed internally; do not claim the full campaign is complete.
- `EARLY_STALL_DEMO_BLOCKER`: the actual player can reach a quiet/stalled state within the likely 3–8 minute judge session even on normal speeds. This must be addressed before visual polish is treated as done.

## 6. What may be changed if the demo scenario stalls early

First use **scenario authoring and UI pacing**, not new hidden simulation mechanics.

Allowed:

- tune GameBuilders-only initial conditions;
- choose a better existing intervention/policy catalog composition;
- set starting pressures so multiple real responses are immediately relevant;
- change presentation speed presets after measurement;
- make event/Agenda consequences more legible;
- choose a better fixed demo seed only if deterministic and documented.

Forbidden:

- scheduled rebellion/coup;
- hidden crisis countdown;
- scripted event chain;
- fake Agenda/EventStore entries;
- automatic Conflict deletion;
- arbitrary late-state reset;
- timers/randomness solely to create activity;
- pretending the 20-year Gate 1F problem is solved when it is not.

If the **core** rather than the demo authoring is the blocker, record it for the F05 continuation instead of smuggling a gameplay rule into the demo branch.

## 7. Runtime scheduler safety

The client scheduler must:

- have exactly one active simulation loop;
- prevent overlapping/re-entrant day steps;
- stop cleanly on Pause and Reset;
- clean up timers on unmount;
- use the newest committed RunRecord rather than stale React closure state;
- remain responsive at the fastest supported speed;
- safely queue or pause around player ActionRecord submission so actions do not race day stepping.

## 8. Verification

Verify at minimum:

- start/reset deterministic;
- Pause stops time;
- each speed executes one-day steps in correct order;
- speed switching does not create multiple loops;
- optional auto-pause setting works both enabled and disabled;
- major-event presentation is visible even when auto-pause is disabled;
- action submission does not double-step or race;
- no direct clock/WorldState mutation;
- the mandatory horizon audit is completed and documented;
- the 3-minute shot list uses a trajectory actually observed in the audit, not an invented sequence.

Document final speed presets, auto-pause default, and `DEMO_HORIZON_STATUS` in `GAMEBUILDERS_DEMO_SPRINT_01_RESULT.md`.
