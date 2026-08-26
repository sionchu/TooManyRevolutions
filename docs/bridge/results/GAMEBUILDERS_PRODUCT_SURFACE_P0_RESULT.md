# GAMEBUILDERS_PRODUCT_SURFACE_P0 Result

Date: 2026-08-26
Branch: `gamebuilders-product-surface-p0`
Authoritative gameplay addendum: `GAMEBUILDERS_PRODUCT_SURFACE_P0_GAMEPLAY_REALITY_ADDENDUM.md`

## Delivery status

The map-first product surface and the mandatory gameplay-reality addendum are
implemented in the nested `TooManyRevolutions` repository. The world map is a
continuous playfield, and the demo now exposes real system changes through the
same runtime state that produces the simulation step.

```text
P0_IMPLEMENTATION: COMPLETE
GAMEPLAY_REALITY_ADDENDUM: IMPLEMENTED
SYSTEM_PROPOSAL_CARRY_LOOP: IMPLEMENTED_AND_TESTED
IDEOLOGY_DIFFUSION_IN_DEMO_RUNTIME: ENABLED
CURRENT_CONTROLLER_VISUALLY_DISTINCT_FROM_OWNER: YES
ACTIVE_CONFLICT_PERSISTENT_PRESENTATION: YES
SIGNIFICANT_EVENT_FEED: YES
PLAYER_POLICY_ACTIONS: YES
CONSOLIDATION_OBJECTIVE_BLOCKERS_VISIBLE: YES
PLAYER_OBSERVABLE_DYNAMICS_AUDIT: PASS
DAY_1000_LOOKS_IDENTICAL_TO_DAY_0: NO
MOBILE_MAP_FIRST_VIEWPORT: PASS
SITES_REDEPLOYED: YES
GATE1F: NOT_READY
V02: NOT_STARTED
F05_FIX18: NOT_STARTED
```

The existing `SerializedSimulationSnapshotV8` boundary remains unchanged. No
Gate 1F, V02, F05_FIX18, solver, fake timer, fake front, or fake gameplay
event was added.

## Gameplay-reality implementation

### Runtime carry loop

`src/app/demoGame.ts` now owns an explicit `DemoRuntimeState` adapter. It carries
`SimulationStepResult.actionProposals` as transient pending system proposals,
normalizes player proposals into the same `ActionRecord` intake, filters both
sources to the next tick, and commits the canonical action/event order. Player
proposals are accepted first; carried system proposals follow in their emitted
canonical order. The carry state is deliberately not persisted, so V8
save/load/replay equivalence remains an authoritative simulation test.

`src/app/demoGame.test.ts` covers exact proposal source/type/payload ordering,
next-tick-only carry behavior, real `ENACT_POLICY` acceptance, actual policy
rule/event changes, ideology diffusion, and V8 save/load replay at the intake
boundary.

### Existing ideology diffusion hook

The demo phase hooks now include
`createIdeologyDiffusionPhaseHook(GAMEBUILDERS_DEMO_SCENARIO)`. Neighboring
Regions use the existing ideology state and ContactGraph/catalog IDs with
authored gradients rather than a UI-only color scale. The Player-Observable
Audit records the resulting support signatures and actual diffusion events.

### Authoritative map and conflict presentation

The scenario now authors 20 LandHexes across the existing 10 Regions, including
12 initial player-controlled Hexes. This is scenario authoring only; no runtime
territory writer or alternate controller field was introduced. The map renders:

- legal owner wash separately from `WorldState.landHexStates[*].controller`;
- faction, foreign-country, and uncontrolled controller marks from the actual
  LandHex controller;
- ideology overlays from actual Region support;
- pressure pulses from actual Region unrest/scarcity;
- player-controlled/legal Hex counts, capital control, active conflict count and
  conflict kinds in the map fact strip.

The crisis banner and map focus read active `world.conflicts`, not recent-event
history. Active conflicts remain visible after their creation until the actual
authoritative conflict status changes. Routine ticks are filtered from the
significant EventStore projection while policy, ideology, faction, conflict,
territorial, and other material events remain visible and generate feedback.

### Real player choices and long objective

The decision surface exposes existing policy catalog entries through real
`ENACT_POLICY` proposals. The compact cards show declared cost, duration,
known rule effects, current facts, trade-offs, and uncertainty badges without a
mana/score/solver layer.

`ConsolidationChecklist` derives directly from
`deriveOrderConsolidationEligibility`. It shows the actual stable-region,
capital, core-territory, state-capacity, treasury, and active-civil-war
criteria, including the first real blocker. It does not invent a progress score
or completion forecast.

## Player-Observable Dynamics Audit

`src/app/playerObservableDynamicsAudit.ts` runs the same no-action demo runtime
to checkpoints at Day 0/30/90/180/360/720/1080. It tracks meaningful EventStore
events, agendas, policy/institution rules, faction actions, foreign routes,
ideology signatures, active conflicts, LandHex controllers, player-controlled
Hex count, map signature, decisions, consolidation blockers, and outcome. The
baseline checkpoint is classified as `PLAYER_OBSERVABLE_SYSTEM_CHANGE` because
it establishes the initial observable state; every later checkpoint also has
actual state/event deltas.

| Day | Classification | Meaningful events | Active conflicts | Controller changes | Player-controlled LandHexes |
| ---: | --- | ---: | ---: | ---: | ---: |
| 0 | `PLAYER_OBSERVABLE_SYSTEM_CHANGE` | 0 | 0 | 0 | 12 |
| 30 | `PLAYER_OBSERVABLE_SYSTEM_CHANGE` | 31 | 1 | 0 | 12 |
| 90 | `PLAYER_OBSERVABLE_SYSTEM_CHANGE` | 82 | 1 | 8 | 4 |
| 180 | `PLAYER_OBSERVABLE_SYSTEM_CHANGE` | 125 | 1 | 4 | 0 |
| 360 | `PLAYER_OBSERVABLE_SYSTEM_CHANGE` | 198 | 2 | 0 | 0 |
| 720 | `PLAYER_OBSERVABLE_SYSTEM_CHANGE` | 343 | 2 | 0 | 0 |
| 1080 | `PLAYER_OBSERVABLE_SYSTEM_CHANGE` | 487 | 2 | 0 | 0 |

The long no-action horizon audit also reaches Day 7200 with an active run,
persistent rebellion/coup conflicts, actual faction/country controller counts,
and non-zero meaningful-event density. This is not a timer-driven story: the
audit reads the simulation's existing event/state channels.

## Map-first product surface

The fixed identity remains:

```text
내 왕국에 혁명이 너무 많다
TOO MANY REVOLUTIONS
정권은 무너져도, 국가는 계속된다.
```

The flow is title → short royal-dossier opening briefing → persistent political
atlas. Agenda, decision, record, region detail, and crisis details are
contextual drawers/sheets. The authored scenario contains three Countries, ten
Regions, twenty LandHexes, and ContactGraph routes. Neighboring Countries are
spatially visible and map labels are backed by authored IDs.

The product surface keeps the stable design/asset/layer registries and
replaceable asset contract from the earlier P0 checkpoints. Commercial games
were used only for structural principles; no commercial asset, screenshot,
copy, or code was copied. The GitHub reference/license decisions remain in
`docs/GAMEBUILDERS_P0_REFERENCE_AUDIT.md`.

## Verification

Executed in the nested repository after the gameplay-reality changes:

| Verification | Result |
| --- | --- |
| `pnpm run format:write` / `pnpm run format` | PASS |
| `pnpm run typecheck` | PASS |
| `pnpm run lint` | PASS |
| `pnpm run build` | PASS; Vite transformed 108 modules |
| Focused gameplay suite | PASS; 5 files / 25 tests |
| Player-Observable Dynamics Audit | PASS; required checkpoints and deterministic assertions |
| 20-year horizon audit assertions | PASS; 5 trajectories / 5 tests |
| `pnpm test` | 72 files / 586 assertions PASS; process exit 1 from 4 Vitest worker `onTaskUpdate` RPC timeouts |
| `pnpm run inspect:v01` | PASS; V02 remains NOT STARTED |
| `pnpm run inspect:t018` | PASS |
| `pnpm run inspect:t021` | PASS |
| `pnpm run inspect:t024` | PASS; V8 replay and derived selectors identical |
| `pnpm run inspect:f05` | PASS diagnostic; F05 recommendation remains NOT_READY |
| `pnpm run inspect:f05fix9` | PASS diagnostic; historical baseline unchanged |
| `pnpm run inspect:f05fix14` | PASS diagnostic; forbidden writers none, F05_FIX15 not authorized |
| `git diff --check` | PASS |

The four full-suite errors are runner/worker progress-report timeouts observed
after all collected assertions passed; they are not source assertion failures.
The long horizon file was split into per-trajectory tests so each assertion
case completes within the runner's heartbeat window, while the full batch still
retains the known Vitest worker limitation in other long inspections.

## Deployed Site and hands-on QA

The existing Sites project was reused and the exact pushed source commit was
deployed:

| Item | Evidence |
| --- | --- |
| Public URL | https://too-many-revolutions-gamebuilders.leeje92.chatgpt.site |
| Sites version | 15 (`appgprj_6a8dd05a84688191b356030d05e3e198~appgver_5e3f2457e33c8191a3c3230ab8d487ee`) |
| Source commit | `e9ac0de93c0e1e29427f7b86bf763f08bfbaccff` |
| Deployment | succeeded (`appgdep_6a8e48befe74819181402f045409d601`) |
| Archive content hash | `sha256:31c68bd90cbea6e7b1778e799f3eed328748e72d84461c87e17123bbb0a8e1e1` |

The deployed public URL was opened and exercised through title → briefing →
main map. A real policy action (`왕의 거부권 폐지`) advanced the run to Day 1,
changed the current institution read to `공화정`, changed the treasury, and
appeared in the EventStore record. A real intervention was then submitted and
produced the visible `행동 제출 완료` feedback and a record entry.

No-action deployed trajectory evidence:

| Day | Active conflicts | Player-controlled LandHexes | Faction-controlled map marks |
| ---: | ---: | ---: | ---: |
| 0 | 0 | 12 | 0 |
| 30 | 1 | 12 | 0 |
| 90 | 1 | 4 | 16 |
| 180 | 1 | 0 | 24 |
| 360 | 2 | 0 | 24 |
| 720 | 2 | 0 | 24 |
| 1080 | 2 | 0 | 24 |
| 1500 | 2 | 0 | 24 |

At Day 1500 the deployed crisis presentation visibly reported `반란 진행 중`
and `2 활성 충돌 · 반란 · 쿠데타`. The EventStore drawer contained ten
significant ideology-support entries rather than routine tick rows. The
Agenda drawer showed `새 질서 정착`, `막힌 조건`, and the actual first blocker
`안정 지역`.

Responsive public QA also passed:

- 1440×900 desktop: client/scroll width 1425/1425, map 1367.4×630,
  approximately 66.5% of viewport area, desktop manual jumps visible and
  mobile disclosure hidden.
- 390×844 mobile: client/scroll width 375/375, map 343px wide, desktop jumps
  hidden, mobile disclosure closed by default, +1/+7/+30 controls available
  after disclosure, and no horizontal overflow.

The deployed no-action run therefore differs materially from Day 0 through
controller migration, active conflict presentation, ideology/event feed, and
objective blockers without using a fake timer or fabricated event.

## Boundary

This result closes only the authorized GAMEBUILDERS_PRODUCT_SURFACE_P0 and its
gameplay-reality addendum. It does not start or approve F05_FIX18, Gate 1F PASS,
or V02.
