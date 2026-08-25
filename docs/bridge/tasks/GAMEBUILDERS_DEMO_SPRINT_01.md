# GAMEBUILDERS_DEMO_SPRINT_01 — Playable Vertical Slice

TASK_ID: `GAMEBUILDERS_DEMO_SPRINT_01`
STATUS: `AUTHORIZED`
BASE_IMPLEMENTATION_HEAD: `82bb6018f2fc87d9f1807cab3c12fb5e2e016775`
BASE_IMPLEMENTATION_BRANCH: `f05-fix23-review`
WORK_BRANCH: `gamebuilders-demo-sprint-01`
RESULT_PATH: `docs/bridge/results/GAMEBUILDERS_DEMO_SPRINT_01_RESULT.md`

## 0. Emergency event context

GameBuilders submission is imminent. The project has a strong deterministic simulation core, but the browser app still renders a Gate 0 foundation scaffold rather than a playable game client.

This task temporarily PAUSES the normal Gate 1F/F05 progression and builds a polished, deterministic, demonstrable vertical slice on top of the accepted FIX23 simulation core.

`F05_FIX24` is DEFERRED for the GameBuilders sprint. Do not execute F05_FIX24 or any later F05 task in this branch.

The accepted simulation baseline is FIX23:

```text
REVIEWED_HEAD: 82bb6018f2fc87d9f1807cab3c12fb5e2e016775
PERSISTENCE_ACCEPTED: SerializedSimulationSnapshotV8 / format version 8
GATE1F: NOT_READY
V02: NOT_STARTED
```

The goal of this task is NOT to claim Gate 1F PASS. The goal is to ship one honest, stable, visually coherent playable loop suitable for hands-on judging and a 3-minute capture.

## 1. Product target

Working title / player-facing title:

```text
내 왕국에 혁명이 너무 많다
TOO MANY REVOLUTIONS
정권은 무너져도, 국가는 계속된다.
```

The vertical slice must communicate this loop within the first minute:

```text
current national pressure
-> player understands the problem
-> player chooses an actual policy/intervention
-> action enters the existing authoritative action pipeline
-> time advances through real simulation ticks
-> metrics / region / ideology / faction / agenda / event state visibly reacts
-> a political crisis can emerge from actual conditions
-> regime/crisis does not automatically mean game over
```

Do not present the project as “Fantasy State Simulator”, “Gate 0”, a test fixture, a developer scaffold, or an architecture demo anywhere in the normal player-facing flow.

## 2. Critical architecture boundary

The GameBuilders client is a THIN CLIENT over the accepted core.

Allowed:

- new React UI/components/hooks;
- new CSS/SVG presentation;
- a dedicated GameBuilders ScenarioDefinition composed from accepted data/rules;
- curated INITIAL CONDITIONS for demo pacing;
- player-facing text mapping derived from authoritative state/events;
- native Web Audio presentation-only sound;
- demo reset and time controls that execute the normal simulation step repeatedly;
- additional pure presentation selectors/helpers;
- UI-focused tests / smoke checks;
- documentation for demo QA and video capture.

Forbidden:

- direct UI mutation of WorldState;
- scripted story/chapter/revolution countdown;
- scheduled coup/rebellion solely for the demo;
- fake EventStore entries;
- fake Agenda items;
- new hidden scores or pacing meters;
- `NO_ACTIVE_FRONT_EDGE -> peace`;
- `0 LandHex -> defeat`;
- new F05 operational-evidence semantics;
- settlement/domain work;
- new persistence version;
- changes whose only purpose is to manufacture Gate 1F PASS;
- LLM calls or server dependencies;
- Three.js / React Three Fiber / a new 3D pipeline;
- copyrighted or unlicensed downloaded art/audio;
- unrelated core refactors.

Every actual player gameplay action must use the existing validated ActionRecord/common intake and normal `runSimulationStep` / commit boundary. If an existing action is unavailable or rejected, the UI must honestly show that state rather than bypass it.

## 3. Overnight execution model

This single task AUTHORIZES all checkpoints below. Do NOT stop for human review between checkpoints.

Work continuously in order. After each checkpoint:

1. run the cheapest relevant verification;
2. create a descriptive commit;
3. push `gamebuilders-demo-sprint-01`;
4. continue immediately to the next checkpoint.

If one optional polish item takes more than roughly 20 minutes to unblock, preserve the last working build, document the limitation, skip that optional item, and continue. A smaller stable playable slice is better than a broader broken one.

Never reset/rebase/force-push or discard accepted FIX23 history.

## 4. Checkpoint A — Product shell + deterministic demo scenario (P0)

### A1. Replace the developer scaffold

Replace the normal `App.tsx` foundation card with a real product flow:

```text
TITLE SCREEN
-> Start / New Game
-> GAME SCREEN
-> Reset to title/demo
```

Update at minimum:

- browser `<title>`;
- document language when appropriate;
- visible title/subtitle/tagline;
- remove `Gate 0 · Foundation`, seed debug card, and foundation-scaffold copy from the player path.

### A2. Dedicated GameBuilders demo scenario

Create a dedicated scenario module, e.g. `src/sim/state/gameBuildersDemoScenario.ts`.

It may compose/reuse accepted fixture builders to reduce risk, but the new scenario must have player-facing names and must not require editing old inspection fixtures to manufacture the demo.

Prefer reuse of the already accepted F04D/Gate1F composition because it exposes:

- economy/scarcity;
- factions;
- policy/institution state;
- interventions;
- ideology;
- T018 coup/rebellion;
- T021 territorial semantics;
- Agenda-compatible pressure.

Author only initial data and existing catalog composition. It is valid to tune initial treasury, legitimacy, instability, faction grievance/organization, Region unrest/scarcity, policy rules, and existing intervention availability so the vertical slice has meaningful pressure quickly.

Do NOT schedule a crisis or add a story timer.

Demo pacing target:

- at game start, at least one meaningful Agenda/pressure is visible;
- one valid player intervention/policy can be performed immediately or after obvious prerequisite handling;
- meaningful visible state changes can be reached within a few `+7/+30 day` advances;
- at least one coup or rebellion path can emerge under an understandable player/no-action trajectory from real T018 conditions;
- demo remains deterministic at a fixed demo seed.

Do not claim that every trajectory must produce the same crisis.

### A3. Runtime client state

Create a clean React state boundary around one authoritative `RunRecord`/EventStore and the demo ScenarioDefinition.

Required controls:

- new/reset game;
- advance +1 day;
- advance +7 days;
- advance +30 days;
- optional auto-run only if it is stable and easy to stop.

Time controls must repeatedly call the accepted daily simulation pipeline; do not skip directly by mutating `tick` or `date`.

Checkpoint A acceptance:

- normal app starts at product title screen;
- clicking start creates the demo run;
- time controls genuinely advance simulation;
- build/typecheck passes;
- commit/push and continue.

## 5. Checkpoint B — Actual game HUD + playable actions (P0)

Build a desktop-first 3-column game shell. It should remain usable at typical laptop resolutions; tablet/mobile perfection is not required for this sprint.

Recommended information hierarchy:

```text
TOP: country / date / core state indicators / time controls / sound
LEFT: institutions + available policy/intervention actions
CENTER: world/map
RIGHT: national Agenda / current pressure / selected context
BOTTOM: recent event feed
```

### B1. Core indicators

Use real existing Country/WorldState values and fixed Korean product terminology:

- 국고 (`treasury`)
- 정통성 (`legitimacy`)
- 국가역량 (`stateCapacity`)
- 불안 (`instability`)
- 국가 존속 (`stateContinuity`)
- optionally 생산 / 군사력 when useful and space permits.

Do not invent “stability”, political power, reform points, or generic mana.

Use concise status bands and small deltas/flash feedback only from actual previous/current state comparison.

### B2. Institutions

Display current institutional rules from actual PolicyState using player-readable Korean labels.

Do not show regime labels as authoritative writable state. A derived regime classification may be shown if an existing pure selector exists and can be wired without introducing new simulation authority.

### B3. Actions

Expose a small, readable set of actual existing actions from the demo scenario.

Priority:

1. existing Intervention Catalog entries such as material relief / political accommodation / opposition legalization / coercive restriction;
2. existing policy actions only if they can be safely and honestly wired in the available time.

For each action card show only facts the schema actually owns, such as:

- name;
- treasury cost;
- administrative load;
- duration;
- prerequisite availability;
- concise player-facing consequence description derived from declared completion effects.

Submit actions through the existing common action validation/resolution path. Rejections must display an honest reason/event state; never directly apply completion effects from React.

Checkpoint B acceptance:

- a human can start the game, choose at least two meaningfully different valid responses, advance time, and observe real consequences;
- the UI makes unavailable/rejected actions understandable;
- no direct simulation state mutation from components;
- commit/push and continue.

## 6. Checkpoint C — SVG map + political state visualization (P0)

Implement the map with React + SVG + CSS. Do not add Three.js.

Use existing `derivePresentationState()` and existing ScenarioDefinition topology wherever practical.

### C1. Hex map

Render `PresentationState.landHexes` from axial coordinates as SVG hex polygons.

Required visual semantics:

- Country-controlled / Faction-controlled / Uncontrolled controllers are visibly distinct;
- Region identity is readable;
- selected region/hex highlight;
- current control comes only from actual `LandHex.controller` projection.

Do not invent armies, banners, units, crowds, front lines, organizations, or occupations absent from the presentation state.

### C2. Region detail

On selection show actual:

- Region name;
- unrest;
- scarcity;
- stateControl if needed and clearly distinguished from territorial control;
- ideology support / radicalism / organization for the most relevant ideologies;
- actual organization token/faction presence when exposed by PresentationState.

### C3. Routes/fronts

If cheap, render actual contact routes and actual derived front edges from PresentationState with subtle toggles. These are P1; skip before risking P0 map stability.

Checkpoint C acceptance:

- map visibly changes if actual territorial controller changes;
- no fake territory/front semantics;
- selected region explains why it is politically interesting;
- commit/push and continue.

## 7. Checkpoint D — Agenda, event storytelling, crisis presentation, UX polish (P0/P1)

### D1. Agenda

Use the existing renderer-neutral Agenda system. Show 0–4 real agendas; no filler.

Each card should visibly communicate:

- title;
- severity/band;
- affected Region(s);
- involved faction(s);
- key causes;
- trend when grounded, otherwise unknown/neutral;
- available response categories only when honestly implemented.

The highest-severity issue should be obvious without reading every number.

### D2. Recent event feed

Create a player-facing event feed from actual EventStore events.

Use deterministic event-type mappings and actual actor/target/payload facts. Do not use generic AI narrative or invent casualties, organizations, motives, armies, treaty terms, or causal relations.

Prioritize readable mappings for events that can occur in the demo path, including as applicable:

- policy/institution changes;
- intervention start/completion/rejection;
- treasury/resource changes;
- ideology changes/diffusion;
- faction strategy/fund movement;
- coup/rebellion start;
- LandHex control changes;
- conflict outcomes;
- Order Consolidation / State Dissolution.

### D3. Major event presentation

When an actual `COUP_ATTEMPT_STARTED` or `REBELLION_STARTED` event first appears, present a strong but factual crisis banner/modal/toast using existing faction/country/region data.

The crisis presentation must make the project thesis obvious: a coup/rebellion is a major historical event but is not automatically Game Over.

If run outcome becomes won/defeated, show a dedicated outcome state based only on authoritative RunOutcome.

### D4. First-minute usability

Add a minimal non-blocking onboarding hint if useful:

```text
1. 국가 의제를 확인하세요.
2. 제도/대응을 선택하세요.
3. 시간을 진행해 결과를 지켜보세요.
```

Do not build a quest/tutorial progression system.

Checkpoint D acceptance:

- first-time user can understand what is wrong, what they can do, and what changed;
- crisis events feel dramatic through presentation without invented simulation facts;
- commit/push and continue.

## 8. Checkpoint E — Art direction + sound language (P1, but high demo value)

### E1. Visual direction

Replace the generic teal SaaS/glass-card appearance with one coherent product direction:

```text
royal strategic map
+ revolutionary-era printed matter
+ government dossier / newspaper texture
```

Use only CSS/SVG/native assets you create in code. Avoid new external asset/licensing risk.

Suggested presentation language:

- deep ink / charcoal base;
- warm parchment/ivory panels;
- muted brass/gold state accents;
- crimson for danger/crisis;
- strong serif/display treatment for title/major headings, readable sans-serif body fallback;
- subtle CSS paper/grain/line textures;
- restrained shadows/borders, not modern glassmorphism;
- consistent iconography using simple inline SVG/CSS marks.

Animations should be fast and meaningful:

- metric delta pulse;
- action confirmation stamp/flash;
- crisis banner arrival;
- selected hex/Agenda transitions.

Respect reduced-motion preferences if easy.

### E2. Audio

Implement a minimal presentation-only sound layer using the browser Web Audio API; do not add licensed/downloaded audio dependencies.

Required if stable:

- UI click;
- accepted action/confirmation;
- warning/critical agenda or crisis sting;
- major coup/rebellion impact;
- win/defeat sting;
- mute/unmute control.

Optional if robust: a very subtle procedural ambient bed started only after user interaction. Browser autoplay restrictions must be respected. If procedural ambience is unstable or unpleasant, ship SFX only rather than risk the build.

Audio must never affect simulation state or determinism.

Checkpoint E acceptance:

- coherent art direction across title and gameplay;
- sound toggle works and no autoplay console failure blocks gameplay;
- build remains stable;
- commit/push and continue.

## 9. Checkpoint F — Demo QA + capture readiness + final overnight result (P0)

### F1. Automated verification

Run at minimum at final HEAD:

```text
pnpm run format
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm test
pnpm run inspect:v01
pnpm run inspect:t018
pnpm run inspect:t021
pnpm run inspect:t024
git diff --check
```

If the known Vitest `onTaskUpdate` IPC runner issue appears only after all assertions pass, report it separately as before.

Do NOT spend hours fixing unrelated pre-existing test-runner infrastructure.

### F2. Demo-oriented checks

Add `docs/GAMEBUILDERS_DEMO_QA.md` containing a short manual P0/P1 checklist for the user to run immediately after waking.

At minimum cover:

- clean page load;
- title/start/reset;
- 1920×1080 and common laptop viewport;
- no horizontal overflow on desktop;
- map legibility;
- actions work/reject honestly;
- +1/+7/+30 day controls;
- Agenda updates;
- major event presentation;
- sound mute/unmute;
- no console-breaking error;
- reset gives the same deterministic demo seed/state;
- a 3–8 minute demo path can reach visible political escalation without scripted crisis scheduling.

### F3. 3-minute capture plan

Add `docs/GAMEBUILDERS_3MIN_SHOTLIST.md` with a precise capture plan, roughly:

```text
0:00–0:12 title + hook
0:12–0:35 map / national pressure
0:35–1:05 player action
1:05–1:35 time advance + visible consequence
1:35–2:05 coup/rebellion escalation
2:05–2:35 response / changed political state
2:35–2:50 show regime/crisis continuity and systemic reaction
2:50–3:00 title + one-line pitch
```

The shot list must refer to UI/features that actually exist at final HEAD. Do not write shots for unfinished features.

If cheap, support a `?capture=1` presentation mode that only removes onboarding/debug clutter; it must not alter simulation state/rules/pacing.

### F4. Final result

Create `docs/bridge/results/GAMEBUILDERS_DEMO_SPRINT_01_RESULT.md` with:

```text
STATUS: COMPLETE / AWAITING_CHATGPT_REVIEW
BASE_HEAD: 82bb6018f2fc87d9f1807cab3c12fb5e2e016775
WORK_BRANCH: gamebuilders-demo-sprint-01
FINAL_HEAD: <actual>
PLAYABLE_FROM_TITLE: YES|NO
DEMO_SCENARIO: <id>
ACTUAL_PLAYER_ACTIONS_WIRED: <count / names>
SVG_MAP: YES|NO
AGENDA_UI: YES|NO
EVENT_FEED: YES|NO
CRISIS_PRESENTATION: YES|NO
AUDIO: NONE|SFX|SFX_AND_AMBIENCE
DEMO_QA_DOC: YES|NO
VIDEO_SHOTLIST: YES|NO
CORE_SIMULATION_SEMANTICS_CHANGED: NO
PERSISTENCE_FORMAT: V8_UNCHANGED
GATE1F: NOT_READY
V02: NOT_STARTED
```

Then include:

- checkpoint commits;
- verification results;
- known P0/P1/P2 issues;
- the exact recommended first manual test path after waking;
- what should NOT be touched before recording unless P0 broken.

Push final HEAD and STOP. Do not authorize or begin another task.

## 10. Priority ladder

If time becomes constrained, implement in this order and CUT from the bottom:

```text
P0 MUST SHIP
1. title/start/reset
2. deterministic demo scenario
3. real simulation time controls
4. actual actions through common pipeline
5. state HUD
6. SVG map
7. Agenda
8. event feed + crisis presentation
9. build / demo QA docs

P1 HIGH VALUE
10. coherent art direction
11. SFX + mute
12. onboarding hint
13. capture mode
14. contact/front visual toggles

P2 DO NOT RISK P0
15. procedural ambience
16. mobile-perfect layout
17. extra scenario selection
18. elaborate animation
19. new gameplay systems
20. 3D
```

The overriding rule is: wake the user up to the most stable, most game-like version of the actual accepted simulation possible.