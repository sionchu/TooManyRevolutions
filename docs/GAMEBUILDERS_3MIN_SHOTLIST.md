# GameBuilders 3-minute capture shot list

## Capture source

Use the deployed Site first:

`https://too-many-revolutions-gamebuilders.leeje92.chatgpt.site`

The same URL is recorded in `docs/bridge/results/GAMEBUILDERS_DEMO_SPRINT_01_RESULT.md`. The playable state is deterministic with seed `18970401`; do not add a second seed or a scripted event for capture.

## Sequence

| Time | Player action | What should be visible |
|---|---|---|
| 0:00–0:15 | Open the URL and click `새 게임 시작` | `내 왕국에 혁명이 너무 많다`, 아르켄 왕국, 1897.04.01, no old scaffold |
| 0:15–0:35 | Hold on the initial screen | Treasury, legitimacy, state capacity, instability, continuity HUD; actual SVG LandHex map; two current Agenda cards; four authored actions |
| 0:35–0:55 | Click `+7일` | The authoritative clock advances, EventStore gains factual `TICK_ADVANCED` and economy events, Agenda values update |
| 0:55–1:15 | Click `2x`, then `재생`; pause after a visible day advance | The status line changes, the daily clock continues through the common simulation step, and pause remains available |
| 1:15–1:45 | Click `곡창 긴급 배급 확대` → `실행 기록` | Time pauses for safe submission; EventStore shows the real `INTERVENTION_STARTED`; HUD treasury and state presentation update |
| 1:45–2:05 | Click `철산 공업주 · 국가 통제` on the map | Selected-region inspector changes to 철산 공업주 and remains a read-model presentation of LandHex state |
| 2:05–2:25 | Toggle `소리 켜짐` to `소리 꺼짐` and back | Presentation-only sound state changes; no simulation value changes |
| 2:25–2:45 | Click `+30일` once or twice | EventStore and Agenda continue to reflect actual simulation events; keep the capture in the interactive short horizon |
| 2:45–3:00 | Click `타이틀로`, then `새 게임 시작` | Deterministic reset to 0일차 and the same initial HUD; end on the title and start path |

## Capture guardrails

- Keep `중요 사건 시 자동 일시정지` enabled for the first pass if a major event is useful; it is an optional presentation setting, not a game rule.
- If no coup or rebellion event occurs in the short capture, do not manufacture a crisis banner. Show the factual Agenda and EventStore instead; crisis presentation is conditional on actual `COUP_ATTEMPT_STARTED` or `REBELLION_STARTED` evidence.
- The horizon audit found a late-state stall, so do not use fast speed to imply a complete twenty-year arc. The 3-minute capture is a short-horizon playable slice.
- The task delivered capture readiness and a shot list, not a recorded video file.
