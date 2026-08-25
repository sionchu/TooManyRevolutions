# GAMEBUILDERS_DEMO_SPRINT_01 — ChatGPT Sites Deployment Addendum

STATUS: AUTHORIZED / MANDATORY
PARENT_TASK: GAMEBUILDERS_DEMO_SPRINT_01
WORK_BRANCH: gamebuilders-demo-sprint-01

## Purpose

The overnight GameBuilders sprint is not complete when the game only runs locally. The final working demo must be created and deployed through **ChatGPT Sites from Codex Desktop** so the user can open a real Site URL immediately after waking.

This addendum is part of the already authorized `GAMEBUILDERS_DEMO_SPRINT_01`. Continue without waiting for human review.

## Checkpoint G — ChatGPT Sites live deployment (P0)

After checkpoints A–F are stable enough for a playable demo:

1. In Codex Desktop, invoke **Sites** explicitly (`@Sites` if needed) and create a Site from the final `gamebuilders-demo-sprint-01` implementation.
2. The Site must reproduce the final playable vertical slice, not a marketing-only landing page and not the old Gate 0 scaffold.
3. Use the actual implemented demo behavior: title/start/reset, deterministic demo scenario, time controls, real actions through the accepted simulation boundary, HUD, SVG map, Agenda, EventStore feed, crisis presentation, and sound when that checkpoint shipped stably.
4. Do not rebuild a separate fake simulation inside Sites. Reuse/adapt the final app code and authoritative client logic as supported by the Sites runtime.
5. Do not remove or weaken the accepted simulation architecture merely to fit the Site. If a specific unsupported framework/runtime detail prevents direct reuse, make the smallest presentation/packaging adaptation that keeps the same deterministic rules and state/action semantics.

## Access and publishing

Prefer the strongest access option already available to the account:

1. **Anyone on the internet** if public publishing is available;
2. otherwise the broadest shareable preview/site access available without requiring new credentials or admin intervention.

Do not change workspace policy, billing, account plan, repository visibility, or organization controls.

If public publishing is unavailable because of plan/workspace settings, do not block the rest of the sprint. Leave the Site deployed/previewable at the maximum available access level and report the exact publishing limitation in the final result.

## Live verification

The deployment checkpoint is successful only after Codex opens the deployed Site/preview URL and verifies the player path, not merely after a build command succeeds.

Verify at minimum:

- Site URL exists and opens;
- title is `내 왕국에 혁명이 너무 많다`;
- old `Fantasy State Simulator` / `Gate 0 · Foundation` scaffold is absent;
- Start/New Game works;
- Reset works;
- +1 / +7 / +30 day controls advance the real simulation;
- at least one real policy/intervention action can be submitted and its accepted/rejected result is honest;
- HUD renders real Country/WorldState values;
- SVG map renders and selected-region interaction works if implemented in final HEAD;
- Agenda cards come from the actual Agenda read model;
- recent events come from EventStore data;
- coup/rebellion presentation only appears from actual events;
- mute/unmute works if sound shipped;
- refresh/reopen does not leave the Site unusable;
- no Site-runtime console-breaking error blocks gameplay.

Do not fabricate a successful deployment URL in documentation. Record only the URL actually produced by Sites.

## Capture readiness

Use the deployed Site URL as the preferred source for the 3-minute capture if it is stable enough. Update `docs/GAMEBUILDERS_3MIN_SHOTLIST.md` so the opening instructions reference the actual Site URL or clearly state where the URL is recorded in the final result.

A `?capture=1` or equivalent presentation-only option is allowed only if it removes onboarding/debug clutter and does not modify simulation rules, state, seed, event timing, or crisis pacing.

## Failure handling

If ChatGPT Sites cannot host a necessary part of the final app because of a concrete runtime limitation:

- keep the final local/browser build intact;
- do not replace the authoritative sim with a mocked demo;
- preserve the last verified playable checkpoint;
- document the exact Sites limitation and the narrowest adaptation attempted;
- continue with QA/shot-list/result work rather than spending the entire sprint on deployment.

Do not fall back to GitHub Pages or another hosting provider during the overnight sprint unless the user explicitly authorizes that later.

## Final result additions

`docs/bridge/results/GAMEBUILDERS_DEMO_SPRINT_01_RESULT.md` must include:

```text
SITES_STATUS: DEPLOYED | PREVIEW_ONLY | BLOCKED
SITES_URL: <actual URL or NONE>
SITES_PUBLIC_ACCESS: YES | NO | UNKNOWN
SITES_PLAYER_PATH_VERIFIED: YES | NO
SITES_BLOCKER: NONE | <specific blocker>
```

A locally working build with `SITES_STATUS: BLOCKED` is still preferable to a fake hosted demo, but it must be reported clearly.

Stop only after the main sprint result and this deployment status are committed/pushed to `gamebuilders-demo-sprint-01`.
