# GAMEBUILDERS_DEMO_SPRINT_01 result

## Required classification

```text
PLAYABLE_LOCAL: YES
TIME_FLOW_STATUS: PASS
DEMO_HORIZON_STATUS: STRONG_SHORT_HORIZON_LATE_STALL
SITES_STATUS: DEPLOYED
SITES_URL: https://too-many-revolutions-gamebuilders.leeje92.chatgpt.site
SITES_URL_OR_PREVIEW: https://too-many-revolutions-gamebuilders.leeje92.chatgpt.site
SITES_PUBLIC_ACCESS: YES
SITES_PLAYER_PATH_VERIFIED: YES
SITES_BLOCKER: NONE
DEPLOYED_URL_VERIFIED: YES
P0_BLOCKERS: NONE
P1_ISSUES: Late-state structural stall documented by the deterministic horizon audit
3MIN_CAPTURE_READY: YES
```

## Delivered slice

- Product title/start/reset: `내 왕국에 혁명이 너무 많다`.
- Fixed demo seed: `18970401`.
- Curated GameBuilders scenario with four authored actions: 곡창 긴급 배급 확대, 노동자회와 제한적 정치 타협, 독립 야권 합법화, 야권 집회·언론 활동 제한.
- Real daily `runSimulationStep` → `commitSimulationStep` flow behind play/pause, 1x/2x/3x presets, and optional user-controlled major-event auto-pause.
- Real common action intake through `START_INTERVENTION`, with honest accepted/rejected outcomes.
- HUD, SVG LandHex map, selected-region read model, Agenda read model, and EventStore feed.
- Presentation-only sound toggle and short confirmation/crisis tones; sound does not affect simulation state.
- No scripted/scheduled crisis, fake Agenda/EventStore fact, direct UI WorldState mutation, hidden pacing mechanic, persistence V9, new F05 writer, Three.js, or server/LLM dependency.

## Horizon finding

The mandatory fixed-seed audit covered no-action, material relief, political accommodation, legalization, and coercive trajectories at Days 0, 90, 180, 360, 720, 1080, 1800, 3600, and 7200. All five trajectories were deterministic and had real events, Agenda state, and available actions in the short/medium window. The audit observed a late structural stall in the no-action/material/coercive paths and later in other trajectories; slowing the clock does not remove it. The full evidence is in [GAMEBUILDERS_DEMO_HORIZON_AUDIT.md](../../GAMEBUILDERS_DEMO_HORIZON_AUDIT.md).

No crisis was forced for the demo. In the deployed browser path through Day 279, the EventStore and Agenda remained factual and no `COUP_ATTEMPT_STARTED` or `REBELLION_STARTED` event was observed, so no crisis banner was shown. The UI crisis path remains event-driven.

## Sites deployment

- Final public URL: [내 왕국에 혁명이 너무 많다](https://too-many-revolutions-gamebuilders.leeje92.chatgpt.site).
- Final saved/deployed Site version: 3, sourced from commit `2a454a9b3f539cc7a74c1beb724af7c4b170004d`.
- Final Sites archive content hash reported by Sites: `sha256:53baa6263aaa3aa564a31db9e9bde7e62227d9230aa3b5949b6dba975a891a4b`.
- Connector access state: public.
- Final URL verification: actual browser opened the title, started a game, advanced +1/+7/+30, submitted a real intervention, selected a map region, inspected HUD/Agenda/EventStore, toggled sound, paused/resumed at 3x, reset, reloaded, and reported no console errors.
- Final HTTP asset sanity: GET `/` returned 200 and the built JavaScript asset returned 200.
- The first static-asset deployment returned 404; the worker-only packaging repair was committed and redeployed. No simulation code was changed for that repair.

## QA and verification evidence

| Command/check | Result |
|---|---|
| `pnpm run format` | PASS |
| `pnpm run typecheck` | PASS |
| `pnpm run lint` | PASS |
| `pnpm run build` | PASS; Vite build and Sites worker packaging completed |
| focused `demoGame` + `demoHorizonAudit` | PASS; 6 tests |
| `pnpm test` | 559/559 assertions and 65/65 files passed; runner exit 1 from 3 Vitest `onTaskUpdate` timeout errors after long inspections |
| full-suite retry with forks/dot reporter | Same 559/559 and 65/65 pass; same 3 runner timeout errors |
| `inspect:v01` | PASS |
| `inspect:t018` | PASS |
| `inspect:t021` | PASS |
| `inspect:t022` | PASS |
| `inspect:t023` | PASS |
| `inspect:t024` | PASS |
| `git diff --check` | PASS |
| local browser QA | PASS; responsive, controls, action, HUD, map, Agenda, EventStore, sound, reset, reload |
| deployed browser QA | PASS; same player path and console error list empty |

The two full-suite runner failures are execution-environment failures, not assertion failures. They occurred after long F05_FIX9/F05_FIX10/F05_FIX7 inspections and were reproduced with the alternate runner invocation; they are not being reported as a green full-suite exit.

## Checkpoint history

```text
b69944b148e0e0318f43951d2e66ca10f1b57b7a  feat: add playable GameBuilders demo shell
cac27a4d20a99c6c7100ed86fab9e9587f959c00  feat: add demo timeflow controls
b710cc7d3b9f9e9aa7b738acd19279da6edc07f5  docs: record GameBuilders horizon audit
56c3c5dd35ea1b1db583ed2babe51b9f481c6303  build: add Sites hosting package
15d43ad725a8324b2c04544e2c2769ae4c94cc23  fix: broaden Sites static asset routing
2a454a9b3f539cc7a74c1beb724af7c4b170004d  fix: embed Sites static assets in worker
```

## Boundary status

```text
PERSISTENCE_ACCEPTED: SerializedSimulationSnapshotV8
GATE1F: NOT_READY
V02: NOT_STARTED
F05_FIX24: deferred to the separate docs-only review branch after this demo checkpoint
```

The bounded overnight queue next permits F05_FIX24 docs-only grounding on `f05-fix24-review`, followed only by a conditional F05_FIX25 design memo. No F05_FIX25 production implementation, Gate 1F approval, or V02 work is included here.
