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
| 0:35–0:55 | Inspect the initial main screen | Compact HUD over the persistent map-first political atlas: Arken, Veloria, Karsen, named regions, crests, borders, routes, pressure, and the current issue chip. `지도 / 국정 / 결정 / 기록` context tabs are visible; no permanent text columns. |
| 0:55–1:15 | Click `+7일`, then `2x` and `재생`; pause after a visible day advance | The authoritative clock and factual EventStore advance; the live status line changes and pause remains available |
| 1:15–1:35 | Open `국정`, use `지도에서 보기`, then click a map region such as `철산 공업주` | Agenda remains on demand; the affected Region is selected on the atlas and its current LandHex-derived state opens in a contextual sheet |
| 1:35–1:55 | Open `결정`, choose an available action, and click `이 선택을 실행` | The drawer exposes `확정 비용`, `확정 변화`, `현재 관측`, `반응은 미확정`; submission records the real intervention event and updates the HUD |
| 1:55–2:15 | Toggle `소리 켜짐` to `소리 꺼짐` and back; open `기록` | Presentation-only sound state changes; EventStore rows show actual event type, tick, detail, and important/normal visibility |
| 2:25–2:45 | Click `+30일` once or twice | Agenda and crisis presentation continue to reflect current simulation evidence; do not manufacture a coup/rebellion banner |
| 2:45–3:00 | Click `타이틀로`, then repeat `새 게임` → briefing → `국정 시작` | Deterministic reset to 0일차 and the same title/opening path; optionally append `?designDebug=1` to inspect registered map layers |

## Capture guardrails

- Keep `중요 사건 시 자동 일시정지` enabled for the first pass if a major event is useful; it is an optional presentation setting, not a game rule.
- If no coup or rebellion event occurs in the short capture, do not manufacture a crisis banner. Show the factual Agenda and EventStore instead; crisis presentation is conditional on actual `COUP_ATTEMPT_STARTED` or `REBELLION_STARTED` evidence.
- The horizon audit found a late-state stall, so do not use fast speed to imply a complete twenty-year arc. The 3-minute capture is a short-horizon playable slice.
- The task delivered capture readiness and a shot list, not a recorded video file.
