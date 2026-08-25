# GameBuilders demo product QA

## Result

The local app and final deployed Site were exercised through the player path. The final Site is public and the final deployment serves the HTML, JavaScript, and CSS assets successfully.

## Responsive checks

| Viewport | Title/start | Horizontal overflow | Visual check |
|---|---:|---:|---:|
| 1920 × 1080 | PASS | none (`scrollWidth = clientWidth`) | PASS |
| 1440 × 900 | PASS | none (`scrollWidth = clientWidth`) | PASS |
| 1366 × 768 | PASS | none (`scrollWidth = clientWidth`) | PASS; desktop screenshot inspected |
| 390 × 844 | PASS | none (`scrollWidth = clientWidth`) | PASS; mobile screenshot inspected |

## Player-path checks

| Check | Local | Deployed Site |
|---|---:|---:|
| Product title and new-game start | PASS | PASS |
| Old `Fantasy State Simulator` / `Gate 0 · Foundation` scaffold absent | PASS | PASS |
| `+1일`, `+7일`, `+30일` | PASS | PASS; 0 → 1 → 8 → 38 days verified |
| Play/pause and 1x/2x/3x | PASS | PASS; optional auto-pause on/off verified |
| Real action submission | PASS | PASS; `INTERVENTION_STARTED` recorded |
| HUD values | PASS | PASS |
| SVG LandHex map and region selection | PASS | PASS |
| Agenda read model | PASS | PASS |
| EventStore feed | PASS | PASS; event count and factual event types changed |
| Crisis presentation boundary | PASS in code/read-model path | No crisis event occurred through the tested Day 279 demo path; no banner was fabricated |
| Mute/unmute | PASS | PASS |
| Reset to deterministic initial state | PASS | PASS |
| Reload/reopen | PASS | PASS; start path available after reload |
| Console-breaking application error | none | none (`dev.logs({levels:["error"]})` returned `[]`) |

## Sites packaging repair

The first worker package deployed successfully but returned 404 for the root and static assets. Worker logs identified the failure as static asset serving, not game code. The final package embeds the exact Vite-built HTML/JS/CSS as a fallback while retaining the normal Workers Assets lookup. After the repair, the actual URL returned HTTP 200 for `/` and the JavaScript asset, and the browser player path passed.

## Known limitation

The deterministic horizon audit classifies the demo as `STRONG_SHORT_HORIZON_LATE_STALL`. The late stall is an accepted-core interaction limitation and was not hidden with a timer, scheduled crisis, fake event, direct WorldState mutation, or speed change.
