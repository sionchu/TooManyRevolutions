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

## Current targeted rework: semantic world objects, continuous terrain, and content authoring

This is the current result for the two authorized addenda. The exact
production source used for the public deployment is:

```text
PRODUCTION_SOURCE_COMMIT: 9befdf7aaee6eafe75a4601369a2624691a4a189
BRANCH: gamebuilders-product-surface-p0
GITHUB_BRANCH_PUSH: PASS
SITES_REDEPLOYED: YES
```

The accepted R3F renderer and renderer-neutral `WorldSceneModel` were kept.
LandHex remains the logical/topological authority. The new terrain surface is
a continuous vertex-coloured world substrate projected from the existing hex
topology; visible hex outlines are emitted only for a selected hex, a faction
controller, or a current front. The transparent hex mesh used for pointer
hit-testing is not a visible pillar or board surface. No simulation, topology,
EventStore, persistence, or runtime LLM authority was added.

Title and opening briefing prose now resolve through stable
`ContentRegistry` records. The baseline pack is an authoring-time generated
draft and is static/reviewed at runtime. Content Studio can filter title and
briefing records, edit full text, show baseline/draft diffs, live-preview the
resolved title/briefing, export/import JSON patches, and reset local drafts.
It deliberately has no direct GitHub write path. The deployed game no longer
reads `PLAYER_COPY` directly as its only runtime source.

### Current result markers

```text
TITLE_BRIEFING_CONTENTREGISTRY_SOURCE: YES
TITLE_BRIEFING_ADMIN_EDITABLE: YES
TITLE_BRIEFING_LIVE_PREVIEW: YES
AUTHORING_TIME_DRAFT_PIPELINE: YES
RUNTIME_LLM_REQUIRED: NO
DIRECT_PLAYER_COPY_ONLY_TITLE_BRIEFING: NO
LOGICAL_HEX_RETAINED: YES
ALWAYS_VISIBLE_HEX_GRID: NO
CONTINUOUS_TERRAIN_READS_BEFORE_HEX: YES
HEX_PILLAR_BOARD_LOOK_DOMINANT: NO
HEX_SELECTION_CONTEXTUAL: YES
COUNTRY_CONTROLLER_BOUNDARIES_STILL_READABLE: YES
MOBILE_WORLD_STAGE_WIDTH_94PCT: PASS
MOBILE_WORLD_STAGE_HEIGHT_62SVH: PASS
MAP_WRAPPED_IN_LARGE_CONTENT_CARD: NO
DEFAULT_HUD_DOMINATES_WORLD: NO
SEMANTIC_WORLD_OBJECT_REWORK: COMPLETE
R3F_PRODUCTION_RENDERER_RETAINED: YES
WORLD_SCENE_MODEL_RETAINED: YES
FOOD_CIVIC_INDUSTRIAL_SILHOUETTES_DISTINCT: YES
AUTHORED_POI_FAMILIES_RECOGNISABLE: YES
REBELLION_LOCATABLE_WITHOUT_TEXT_IN_3S: YES
CONTROLLER_CHANGE_VISIBLE_WITHOUT_CHRONICLE: YES
ROUTE_CHANNELS_VISUALLY_DISTINCT: YES
DAY0_LATE_WORLD_VISUALLY_DIFFERENT: YES
ROADMAP_BRANCHES_READABLE_AT_GLANCE: YES
RAW_DEBUG_TMI_LEAKAGE: NO
MOBILE_WORLD_FIRST: PASS
P0_PRODUCT_PASS: NOT_SELF_DECLARED
GATE1F: NOT_READY
V02: NOT_STARTED
```

### Exact deployed-source visual and interaction evidence

All evidence below was captured from
`https://too-many-revolutions-gamebuilders.leeje92.chatgpt.site` after
deployment of `9befdf7aaee6eafe75a4601369a2624691a4a189`. PNGs are retained in
`docs/bridge/results/evidence/`.

| Evidence | Actual observation |
| --- | --- |
| Title / opening briefing | `tmr.screen.title` and `tmr.screen.opening-briefing`; visible copy resolved from stable `tmr.copy.title.*` and `tmr.copy.briefing.*` IDs |
| Content Studio title | Edited `tmr.copy.title.tagline` to `정권이 흔들릴수록 국가는 선택을 기억한다.`; live preview matched; exported one-change JSON patch; reset afterward |
| Content Studio briefing | Edited `tmr.copy.briefing.beat-1.body`; live preview matched; exported two-change JSON patch; reset afterward |
| Day 0 | `selection=none`, `conflicts=0`, all 20 sampled controller kinds `country`; stage `1367.40625 × 695` at 1440×900; continuous terrain and authored objects visible |
| Selected hex | Actual canvas selection resolved `gamebuilders.arken.industrial-north-west`; detail sheet showed `철산 공업주 · 아르켄 왕국` and the contextual selection affordance |
| Day 90 | Actual `+30일` progression reached tick 90; `rebellion` conflict and 8 faction controller markers were present; red territory/front marks appeared contextually |
| Project implementing | Actual `곡창 긴급 배급 확대` action advanced to tick 91; project surface showed `왕실 배급망 · 구현 중` and the map landmark was visible |
| Project completed | Actual `+1일` progression reached tick 92; the same project showed `완료 흔적`, `완료 92일차 · 지도 흔적 유지` |
| Late state | Actual visible `+30일` progression reached ticks 182, 362, 722, and 1082; ticks 362/722/1082 showed `rebellion` + `coup`, 12 faction controller markers, and the completed project trace |
| Institutional Roadmap | Actual `결정` drawer showed 6 roadmap nodes and 3 graph edges; screenshot includes the graph and factual project traces |
| Mobile | At 390×844, measured world stage `x=-7.5`, `width=390` (`100%`), `height=573.90625` (`67.998%` of viewport); no horizontal overflow was observed |

Evidence filenames:

```text
GAMEBUILDERS_P0_TITLE.png
GAMEBUILDERS_P0_BRIEFING.png
GAMEBUILDERS_P0_DAY0_CONTINUOUS_TERRAIN.png
GAMEBUILDERS_P0_SELECTED_HEX_CONTEXT.png
GAMEBUILDERS_P0_DAY90_REBELLION_CONTROLLER.png
GAMEBUILDERS_P0_PROJECT_IMPLEMENTING.png
GAMEBUILDERS_P0_PROJECT_COMPLETED.png
GAMEBUILDERS_P0_LATE_DAY1082.png
GAMEBUILDERS_P0_ROADMAP.png
GAMEBUILDERS_P0_CONTENT_STUDIO_TITLE_PREVIEW.png
GAMEBUILDERS_P0_CONTENT_STUDIO_BRIEFING_PREVIEW.png
GAMEBUILDERS_P0_MOBILE_DAY0_390x844.png
```

### Verification for the current source

Passed checks:

```text
pnpm run format
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm exec vitest run src/presentation/design/contentRegistry.test.ts src/presentation/worldSceneModel.test.ts src/presentation/worldSceneContent.test.ts src/app/gameplayReality.test.ts src/app/rendererDecision.test.ts src/app/mapFirstComposition.test.ts src/app/institutionalRoadmap.test.ts src/app/stateProjects.test.ts src/app/gamePresentation.test.ts --no-file-parallelism --reporter=verbose
pnpm run inspect:t018
pnpm run inspect:t021
pnpm run inspect:t022
pnpm run inspect:t023
pnpm run inspect:t024
pnpm run inspect:v01
pnpm run inspect:f05fix13
pnpm run inspect:f05fix14
git diff --check
```

The focused suite passed with 9 files and 20 tests. The full suite collected
81/81 test files and 600/600 passing assertions, but the process exited 1
because Vitest reported four repeatable worker progress-RPC errors:
`Error: [vitest-worker]: Timeout calling "onTaskUpdate"`. A
`--pool=forks --maxWorkers=1 --minWorkers=1` rerun reproduced the same runner
condition. There were no assertion failures; this remains
`ASSERTIONS_PASS / RUNNER_EXIT_FAIL`, not a code assertion pass. The source
was not changed to hide or bypass the runner error.

### Sites provenance

```text
PUBLIC_URL: https://too-many-revolutions-gamebuilders.leeje92.chatgpt.site
SITES_PROJECT: appgprj_6a8dd05a84688191b356030d05e3e198
SITES_VERSION: 21
SITES_VERSION_ID: appgprj_6a8dd05a84688191b356030d05e3e198~appgver_e49718310d2881919222518ff0951414
DEPLOYED_SOURCE_COMMIT: 9befdf7aaee6eafe75a4601369a2624691a4a189
LOCAL_ARCHIVE: C:\\Temp\\tmr-gamebuilders-9befdf7.tar.gz
LOCAL_ARCHIVE_SHA256: 9D49F733DF912A3A4EC0977509CB0D87BC55357ADFBD34F50EC0294F25B81106
SITES_ARCHIVE_CONTENT_HASH: sha256:a845e8ea292eed1300007b8915dc38f6d399925f6b607723d47ca4d845091366
DEPLOYMENT_ID: appgdep_6a8e9def5c688191803a3bb7d71020c2
DEPLOYMENT_STATUS: succeeded
```

The result closes only this authorized targeted rework. It does not declare
P0 product PASS, Gate 1F PASS, or V02, and it does not start a successor task.

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

## Frozen map visual system checkpoint — 271eb18

This section is the current closure for the authorized Map World Architecture
and Map Visual System pass. The implementation checkpoint is frozen at:

```text
271eb18b9d713c3d639091b35aa65c2c0d780b69
feat: implement map visual system authoring pass
```

The same commit was pushed to `gamebuilders-product-surface-p0` and to the
Sites project's configured source branch before version creation. No map,
presentation, simulation, persistence, or renderer code was changed after
this checkpoint; the remaining changes in this closure are result/evidence
documents only.

### Production provenance

| Item | Value |
| --- | --- |
| Public URL | https://too-many-revolutions-gamebuilders.leeje92.chatgpt.site |
| Sites project | `appgprj_6a8dd05a84688191b356030d05e3e198` |
| Sites version | 22 (`appgprj_6a8dd05a84688191b356030d05e3e198~appgver_bd39ca2f44008191ae82d2b97931c2fd`) |
| Saved source commit | `271eb18b9d713c3d639091b35aa65c2c0d780b69` |
| Archive | `C:\Temp\tmr-gamebuilders-271eb18.tar.gz` |
| Archive SHA-256 | `B310EFF7C2CBFC6B4A013AFACA6DBF50786921E8253CBA6FC1756410C79EDE76` |
| Sites archive content hash | `sha256:353914d24ecff52c526347e27cdf84a5fc48a17a52f27aa41ae78e0fd416d60e` |
| Deployment | succeeded (`appgdep_6a8eba7747fc8191997ea85025f6168b`) |

`get_site_version` returned the saved source commit above, and `get_site`
returned the same live URL with latest version 22.

### Production smoke and visual evidence

The exact production URL was exercised through title → `새 게임` → opening
briefing → `브리핑 건너뛰기` → main world screen.

| Checkpoint | Observed result |
| --- | --- |
| Desktop Day 0 | 1440×1000 browser; `desktop.global`, `meso`, LandHex 20, asset kit 15, Region compositions 10, label count 17, occupancy `0.997 × 0.740`, no Internal Server Error |
| Labels hidden | `?mapLabels=0`; label count 0 while asset kit/compositions and occupancy remained `15 / 10 / 0.997 × 0.740` |
| Selected Hex | `ideology-fixture.capital-hex`; visible selection text `왕도권 · 아르켄 왕국`; no callback error |
| Rebellion | three real `+30일` actions reached Day 90; one active rebellion, 8 faction-controller DOM projections, LandHex 20, no Internal Server Error |
| Mobile | 390×844; `mobile.player-theater`, `near`/`micro`, stage width 390, mobile occupancy `1.000 × 1.000`, first-viewport world share `67.998%`, 3 visible status metrics, no Internal Server Error |
| Map Studio | 11 visual-authoring modes; `architecture validation PASS`; zero error issues; tick 0 / LandHex 20; no Internal Server Error |

Evidence captured from the exact deployed source is in
`docs/bridge/results/evidence/`:

- `GAMEBUILDERS_P0_MAP_VISUAL_DEPLOYED_DESKTOP_DAY0.png`
- `GAMEBUILDERS_P0_MAP_VISUAL_DEPLOYED_LABELS_HIDDEN.png`
- `GAMEBUILDERS_P0_MAP_VISUAL_DEPLOYED_SELECTED_HEX.png`
- `GAMEBUILDERS_P0_MAP_VISUAL_DEPLOYED_DAY90_REBELLION.png`
- `GAMEBUILDERS_P0_MAP_VISUAL_DEPLOYED_MOBILE_PLAYER_THEATER.png`
- `GAMEBUILDERS_P0_MAP_VISUAL_DEPLOYED_MAP_STUDIO.png`

### Verification record

| Verification | Result |
| --- | --- |
| `npm run format` | PASS |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS; Vite and Sites worker completed |
| focused map architecture/visual/presentation tests | PASS; 3 files / 14 tests |
| full `npm test -- --reporter=dot` | 83 files / 610 tests PASS; runner exit 1 from 4 Vitest worker `onTaskUpdate` timeout errors |
| fork-pool full-suite rerun | 83 files / 610 tests PASS; same 4 `onTaskUpdate` timeout errors; exit 1 |
| T018 individual inspection | PASS |
| T021 individual inspection | PASS |
| T024 individual inspection | PASS |
| V01 individual inspection | PASS; V02 remains NOT_STARTED |
| `git diff --check` | PASS |

The four full-suite errors were runner progress-RPC timeouts, not assertion
failures. They were recorded as `ASSERTIONS_PASS / RUNNER_EXIT_FAIL`; source
was not changed to hide or bypass them.

### Boundary status

```text
MAP_VISUAL_SYSTEM: IMPLEMENTED_FOR_REVIEW
PRIMITIVE_BLOCKOUT_LOOK_DOMINANT: NO (captured production visual review)
LANDHEX_TOPOLOGY_OR_COUNT_CHANGED: NO (20)
P0_PRODUCT_PASS: NOT_DECLARED
GATE1F: NOT_READY
V02: NOT_STARTED
F05_FOLLOW_UP: NOT_STARTED
```
