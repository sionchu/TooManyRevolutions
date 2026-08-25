# GameBuilders 3-minute capture shot list

## Capture source

Use the deployed Site first:

`https://too-many-revolutions-gamebuilders.leeje92.chatgpt.site`

The same URL is recorded in `docs/bridge/results/GAMEBUILDERS_DEMO_SPRINT_01_RESULT.md`. The playable state is deterministic with seed `18970401`; do not add a second seed or a scripted event for capture.

## Sequence

| Time | Player action | What should be visible |
|---|---|---|
| 0:00–0:15 | Open the URL and click `새 게임` | `내 왕국에 혁명이 너무 많다`, `TOO MANY REVOLUTIONS`, the oxblood crest, and the core hook are visible without debug copy |
| 0:15–0:35 | Click `다음 서류` through the four briefing beats, then `국정 시작` | Opening briefing establishes Arken, 1897, neighboring pressure, and the player role before the main screen |
| 0:35–0:55 | Inspect the initial main screen | Treasury, legitimacy, capacity, instability, continuity HUD; layered SVG political atlas with Arken, Veloria, Karsen, named regions, crests, borders, and routes; Agenda cards and authored actions |
| 0:55–1:15 | Click `+7일`, then `2x` and `재생`; pause after a visible day advance | The authoritative clock and factual EventStore advance; the live status line changes and pause remains available |
| 1:15–1:45 | Choose an available card and click `이 선택을 실행` | The card exposes `확정 비용`, `확정 변화`, `현재 관측`, `반응은 미확정`; submission records the real intervention event and updates the HUD |
| 1:45–2:05 | Click an SVG map region such as `철산 공업주` | The selected-region inspector changes to the named region and presents current LandHex-derived state |
| 2:05–2:25 | Toggle `소리 켜짐` to `소리 꺼짐` and back; inspect `연대기` | Presentation-only sound state changes; EventStore rows show actual event type, tick, detail, and important/normal visibility |
| 2:25–2:45 | Click `+30일` once or twice | Agenda and crisis presentation continue to reflect current simulation evidence; do not manufacture a coup/rebellion banner |
| 2:45–3:00 | Click `타이틀로`, then repeat `새 게임` → briefing → `국정 시작` | Deterministic reset to 0일차 and the same title/opening path; optionally append `?designDebug=1` to inspect registered map layers |

## Capture guardrails

- Keep `중요 사건 시 자동 일시정지` enabled for the first pass if a major event is useful; it is an optional presentation setting, not a game rule.
- If no coup or rebellion event occurs in the short capture, do not manufacture a crisis banner. Show the factual Agenda and EventStore instead; crisis presentation is conditional on actual `COUP_ATTEMPT_STARTED` or `REBELLION_STARTED` evidence.
- The horizon audit found a late-state stall, so do not use fast speed to imply a complete twenty-year arc. The 3-minute capture is a short-horizon playable slice.
- The task delivered capture readiness and a shot list, not a recorded video file.
