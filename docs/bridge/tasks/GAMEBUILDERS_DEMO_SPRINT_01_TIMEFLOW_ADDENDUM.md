# GAMEBUILDERS_DEMO_SPRINT_01 — Mandatory Time-Flow Addendum

STATUS: REQUIRED
APPLIES_TO: GAMEBUILDERS_DEMO_SPRINT_01
PRIORITY: P0

## Why this is required

The player must not experience the product as a manual simulation console where they repeatedly click `+7 days` or `+30 days` to make anything happen.

The primary game-time interaction must feel like a strategy game:

```text
pause / play
+ selectable simulation speed
+ real day-by-day authoritative simulation
+ automatic pause on major political events
```

Manual `+1/+7/+30 day` controls may remain only as secondary debug/capture conveniences if they do not clutter the player-facing UI. They are not the primary gameplay clock.

## Required player-facing controls

Implement a compact time control strip with at minimum:

```text
⏸ Pause
▶ 1×
▶▶ 3×
▶▶▶ 10×
```

A faster optional speed may be added only if stable and readable.

Starting the game paused is acceptable and recommended so the player can read the initial Agenda before time begins.

The current active speed must be visually obvious.

## Authoritative simulation boundary

Speed is presentation scheduling only.

Every simulated day must still execute the accepted authoritative daily pipeline in order:

```text
runSimulationStep(...)
-> commitSimulationStep(...)
-> next day
```

Do NOT implement speed by directly changing `tick`, `date`, faction state, crisis state, or any other WorldState value.

Do NOT skip intermediate daily simulation steps when running at 3×/10×. A high speed only means executing valid one-day steps more frequently in wall-clock time.

Wall-clock timing must never become an authoritative gameplay input.

## Runtime safety

The client scheduler must:

- have exactly one active simulation loop;
- prevent overlapping/re-entrant day steps;
- stop cleanly on Pause;
- stop on Reset / return to title;
- clean up timers on component unmount;
- use the newest committed RunRecord rather than a stale React closure;
- stop automatically when RunOutcome is terminal;
- remain responsive enough that the user can pause at any time.

If rendering every day at 10× is expensive, rendering may be throttled carefully, but authoritative simulation steps must still occur one day at a time and in order.

## Major-event auto-pause — P0

Automatically pause the presentation clock when a newly committed event contains any of:

```text
COUP_ATTEMPT_STARTED
REBELLION_STARTED
ORDER_CONSOLIDATED
STATE_DISSOLVED
```

The corresponding factual crisis/outcome presentation should become visible immediately.

Do not auto-resolve the event. Auto-pause is UI behavior only.

Optional additional auto-pause triggers are allowed only for genuinely important existing events and should remain sparse.

## Action UX

The player must be able to pause, inspect an Agenda, choose an actual action, and resume time.

Submitting an action while time is running must not race the simulation loop. Either:

1. queue it through the existing next-tick/common action boundary safely; or
2. briefly pause during submission and resume the prior speed after the accepted/rejected action is committed.

Never bypass the common ActionRecord pipeline.

## Demo feel target

A first-time player should be able to do this without explanation:

```text
Start
-> inspect current national pressure while paused
-> press Play / choose speed
-> watch dates and state change continuously
-> pause or choose an intervention
-> resume
-> see Agenda / map / events react
-> major coup/rebellion appears
-> game automatically pauses
-> inspect the crisis and choose what to do next
```

The resulting interaction should feel like controlling the flow of history, not clicking a date-advance debug button.

## Verification

Add focused UI/runtime tests where practical and manually verify:

- Start begins in a readable paused state;
- 1× advances continuously;
- 3× and 10× advance more quickly while still executing one-day steps;
- Pause stops advancement;
- switching speeds does not create multiple loops;
- Reset stops the old loop and restores deterministic initial state;
- coup/rebellion auto-pause works;
- terminal outcome auto-pause works;
- action submission does not double-step or race;
- no direct clock/WorldState mutation is introduced.

Document the final time-control behavior in `GAMEBUILDERS_DEMO_SPRINT_01_RESULT.md` and include the real interaction in the 3-minute shot list.
