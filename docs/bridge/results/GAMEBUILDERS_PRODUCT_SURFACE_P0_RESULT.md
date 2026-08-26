# GAMEBUILDERS_PRODUCT_SURFACE_P0 Result

Date: 2026-08-26
Branch: `gamebuilders-product-surface-p0`
Repository: nested `TooManyRevolutions`
Task: `GAMEBUILDERS_PRODUCT_SURFACE_P0`

## Result markers

```text
P0_PRODUCT_REVIEW_REWORK: COMPLETE
P0_PRODUCT_PASS: NOT_DECLARED
REFERENCE_TRACEABILITY_MATRIX: PASS
THREE_R3F_SPIKE: PASS
SECOND_RENDERER_SPIKE: PASS
WORLD_RENDERER_DECISION: THREE_R3F
WORLD_RENDERER_DECISION_EVIDENCE: PRESENT
WORLD_SCENE_MODEL: YES
2_5D_OR_ISOMETRIC_WORLD_STAGE: YES
HEX_TERRAIN_READABLE: YES
SETTLEMENT_POI_WORLD_OBJECTS: YES
ROUTE_ACTIVITY_VISIBLE: YES
REBELLION_CONFLICT_SPATIAL_ACTIVITY_VISIBLE: YES
STATE_PROJECTS_READ_AS_WORLD_OBJECTS: YES
INSTITUTIONAL_ROADMAP_IS_NODE_GRAPH: YES
RAW_INTERNAL_IDS_ON_PLAYER_SURFACE: NO
DEFAULT_EXACT_NUMBER_TMI_DOMINATES: NO
MOBILE_WORLD_FIRST_VISUAL_QA: PASS
SITES_REDEPLOYED: YES
GATE1F: NOT_READY
V02: NOT_STARTED
F05_SUCCESSOR_WORK: NOT_STARTED
```

`P0_PRODUCT_PASS` is intentionally not declared. This result closes the
authorized world-stage rework evidence and preserves the bridge gate state;
the next gate still requires its own review.

## Scope and synchronization

The canonical task remained `REWORK_REQUIRED / AUTHORIZED` in
`docs/bridge/CURRENT_TASK.md`. The five canonical product documents and the
world-stage rework addendum were read before implementation. The branch was
fast-forwarded with:

```text
267dd27a3cfae939e97d4c535a559f46f571a9a7
  -> eefff023bca58c95a99b60dfa47ba4738aaab63e
```

The implementation checkpoint was committed and pushed as:

```text
31180d977e75e4646332678c36812abc30a3a7fd
feat: rework P0 world stage with R3F
```

No simulation rewrite, second authoritative clock, renderer-side WorldState
mutation, persistence V9 change, Gate 1F decision, V02 work, or F05 successor
work was started.

## Reference traceability

`docs/GAMEBUILDERS_P0_REFERENCE_AUDIT.md` now contains a component-level
matrix for Plague Inc, Rebel Inc, Civilization VI, Hearts of Iron IV,
Against the Storm, CK-style political geography, and the prior TMR screen as
the negative baseline. Every row records:

```text
observed reference principle
-> TMR-specific adaptation
-> exact component/layer
-> prohibited copied authority/assets
-> measurable hands-on acceptance
```

The references supply visual/navigation principles only. TMR simulation,
action, EventStore, LandHex, Conflict, and V8 snapshot authority remain the
existing TypeScript implementation.

## Real renderer benchmark and decision

Both bounded candidates were built from the same frozen presentation snapshot:

```text
20 hex · 3 수도 · 6 경로 · 2 조직 · 1 충돌 · 3 프로젝트
changed: 8 LandHex · 4 Region
```

| Candidate | Build | Raw JS/CSS | Gzip evidence | Browser evidence |
| --- | --- | ---: | --- | --- |
| Three.js + React Three Fiber | PASS, 107 modules | 1,312,394 bytes | JS 359.46 kB, CSS 1.56 kB | 1440×900: 188 FPS avg / 5.1 ms p95; 390×844: 193 FPS avg / 5.1 ms p95; drag pan PASS |
| PixiJS v8 | PASS, 803 modules / 12 chunks | 916,099 bytes | largest Pixi JS 191.27 kB gzip | 1440×900: 190 FPS avg / 5.1 ms p95; 390×844: 192 FPS avg / 5.1 ms p95; drag pan PASS |

The Pixi candidate was isolated under `src/benchmark/` and did not mutate
simulation state. The production decision is Three.js + React Three Fiber:
the orthographic camera, 2.5D depth, coherent object families, route pulse,
and factual conflict/controller marks are now in one production world-stage
path. Pixi remains benchmark evidence, not a divergent production renderer.

The renderer decision and benchmark method are recorded in
`docs/GAMEBUILDERS_P0_RENDERER_SPIKE.md`; architecture and acceptance records
were updated in `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, and
`docs/QA_PLAYTEST.md`.

## World-stage implementation

The presentation dataflow is:

```text
WorldState/EventStore -> PresentationState -> WorldSceneModel -> R3F world stage
```

`WorldSceneModel` is renderer-neutral and sorts projected positions and
controller marks for insertion-order determinism. `PoliticalWorldStage` is an
orthographic R3F scene with:

- 2.5D cylindrical hex terrain with visible elevation, mountain, forest, and
  coast substrate;
- separate legal owner, physical controller, ideology/pressure, and conflict
  visual channels;
- authored capital/settlement points and country labels;
- six factual contact routes with visible activity pulses;
- faction/controller presence, rebellion and coup spatial markers;
- three State Project landmarks with implementing/completed state;
- crisis feedback over the map rather than a map-displacing modal;
- local camera focus/zoom/fit state with mobile pan/zoom behavior;
- on-demand map facts and qualitative default HUD cues.

The production renderer has no simulation writer and no independent clock.
Project landmarks and conflict markers are projections of existing state and
EventStore evidence; no army position, cargo, tactical battle, fake front, or
scripted completion was invented.

## Roadmap and player-surface cleanup

`InstitutionalRoadmapPanel` is now a positioned graph with six policy nodes
and three prerequisite/incompatibility edges. It supports fit, pan, zoom,
reachable/blocked/incompatible states, enacted-path persistence, and concise
Korean labels. It is derived from real policy prerequisites and institutional
rules, not a focus tree or political currency system.

Default player surfaces hide raw IDs, diagnostic codes, enum values, full rule
mutation syntax, and unnecessary counters. Exact values remain available
through details. Public DOM checks found no `fixture.`,
`PREREQUISITE_NOT_MET`, or `privateAllowed` leakage. The map remains the
primary gaze target; decisions, agenda, Chronicle, and regional detail are
contextual drawers/sheets.

## Hands-on public Site QA

The public Site was opened and exercised through actual UI callbacks:

- title -> `새 게임` -> opening briefing -> `브리핑 건너뛰기` -> persistent map;
- actual `결정` drawer open with the six-node roadmap and State Projects;
- actual `왕의 거부권 폐지` policy action, showing the institution change and
  the resulting authoritative feedback;
- actual `곡창 긴급 배급 확대` intervention, followed by time advancement,
  producing the `왕실 배급망 · 완료` map landmark and completion trace;
- actual `기록` drawer with grouped records and EventId-backed source-record
  presentation;
- actual `국정` drawer with `새 질서 정착` and current factual blockers;
- actual map zoom/fit and mobile decision drawer interaction.

The late-horizon run used the visible `+30일` control, not direct state
mutation. The same public deployment reached these checkpoints:

| Requested checkpoint | Observed tick | Active spatial conflicts | Faction controller marks | Routes | Renderer |
| ---: | ---: | --- | ---: | ---: | --- |
| 0 | 0 | none | 0 | 6 | r3f |
| 30 | 30 | 반란 | 0 | 6 | r3f |
| 90 | 90 | 반란 | 8 | 6 | r3f |
| 180 | 180 | 반란 | 12 | 6 | r3f |
| 360 | 360 | 반란, 쿠데타 | 12 | 6 | r3f |
| 720 | 720 | 반란, 쿠데타 | 12 | 6 | r3f |
| 1000+ | 1020 | 반란, 쿠데타 | 12 | 6 | r3f |
| 1080 | 1080 | 반란, 쿠데타 | 12 | 6 | r3f |

At the late public screen the `기록` surface grouped the current crisis
history into source-record flows. The `국정` surface exposed:

```text
새 질서 정착
안정 지역 0/2 충족
핵심 영토 0/1 통제
국가역량 55 / 40
국고 -211 / 0
다음 blocker: 안정 지역
```

These are current authoritative facts and eligibility blockers, not a new
score or scripted objective writer. The map stayed visible behind both
contextual surfaces.

Responsive QA used a browser viewport override and reset it after the pass:

| Viewport | Map surface | Document client/scroll width | Horizontal overflow |
| --- | ---: | ---: | --- |
| 1440×900 | 1367×695 | 1425/1425 | none |
| 390×844 | 343×624 | 375/375 | none |

The mobile pass opened the decision drawer, verified six roadmap nodes and
three edges, and found no raw internal IDs on the player surface.

## Verification

| Command or inspection | Result |
| --- | --- |
| `pnpm run format` | PASS |
| `pnpm run typecheck` | PASS |
| `pnpm run lint` | PASS |
| `pnpm run build` | PASS; Vite and the Sites worker completed |
| focused world-stage/gameplay suite | PASS; 6 files / 16 tests |
| `pnpm test` | 80 files / 598 assertions passed; process exit 1 from 4 unhandled Vitest worker `onTaskUpdate` timeouts |
| single-worker full-suite rerun | same 80 files / 598 assertions; same runner timeout condition |
| `pnpm run inspect:t018` | PASS |
| `pnpm run inspect:t021` | PASS |
| `pnpm run inspect:t022` | PASS |
| `pnpm run inspect:t023` | PASS |
| `pnpm run inspect:t024` | PASS; V8 snapshot/replay/derived selectors identical |
| `pnpm run inspect:v01` | PASS; V02 remains NOT_STARTED |
| `pnpm run inspect:f05fix13` | PASS as historical baseline inspection; no successor work |
| `pnpm run inspect:f05` | baseline inspection only; recommendation remains NOT_READY |
| `git diff --check` | PASS |

The full-suite status is `ASSERTIONS_PASS / RUNNER_EXIT_FAIL`: no assertion
failure was reported, but Vitest emitted four worker progress-RPC
`onTaskUpdate` timeouts after collection. The source was not changed to hide
or bypass the runner condition.

## Sites deployment

The existing public Sites project was reused. The archive was built from the
successful local build output and saved against the exact pushed production
code commit:

| Item | Value |
| --- | --- |
| Public URL | https://too-many-revolutions-gamebuilders.leeje92.chatgpt.site |
| Sites project | `appgprj_6a8dd05a84688191b356030d05e3e198` |
| Sites version | 20 (`appgprj_6a8dd05a84688191b356030d05e3e198~appgver_f77775dcfbd8819195ecbc2f2b024842`) |
| Deployed source commit | `31180d977e75e4646332678c36812abc30a3a7fd` |
| Local archive | `C:\Temp\tmr-gamebuilders-31180d9.tar.gz` |
| Local archive SHA-256 | `C9482B15762AA9A5072C1D12F44086454294640A4A1A709F9CA9590DBFF1B6A7` |
| Sites archive content hash | `sha256:84754b2fb7d342f99033610b58c70bccb6388f8ac8c174b98efcad838e3be076` |
| Deployment | succeeded (`appgdep_6a8e8dd6cd788191808d8c7cd3464199`) |

Version 20 was the deployed and hands-on-tested production source. The
follow-up commit containing this result and bridge-state documentation is
documentation-only and does not alter that tested production bundle.

## Boundary

This result closes only the authorized `GAMEBUILDERS_PRODUCT_SURFACE_P0`
world-stage rework. It does not declare Gate 1F PASS, does not start V02, does
not start F05 follow-up work, and does not authorize the next task.
