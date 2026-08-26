# QA Addendum — GameBuilders P0 Game Loop / World Feel / Content Authoring

Date: 2026-08-26
Task: `GAMEBUILDERS_PRODUCT_SURFACE_P0`
Status: REQUIRED FOR P0 REVIEW

## 1. Purpose

This QA addendum verifies that P0 is not merely technically functional but actually reads and plays as a world-first systemic strategy game.

Passing unit tests does not satisfy this checklist by itself.

## 2. Game-loop QA

### Flow test

Play at least several hundred days using normal time controls.

PASS only if:

- periods of uninterrupted observation/acceleration exist;
- routine ideology/faction/resource changes do not repeatedly force modal pause;
- major decisions/transitions are still noticeable;
- the loop does not degrade into `pause -> read -> click -> resume -> pause`;
- the player can plan toward a medium-term institutional/state-building direction.

Record which categories trigger auto-pause and why.

## 3. Map readability QA

Capture at minimum:

- Day 0;
- an intermediate meaningful-change checkpoint;
- a late checkpoint (Day ~720/1000 or equivalent meaningful horizon).

PASS only if, before opening Chronicle/details, the screenshots visibly distinguish major political-world changes through factual map state.

Verify distinct presentation of:

- legal owner;
- current `LandHex.controller`;
- ideology/political influence;
- active conflict;
- faction/organization presence when authoritative;
- routes/contact state;
- completed/active State Project traces.

## 4. Mobile game-native composition

Use a current mobile portrait viewport comparable to ~390px CSS width.

PASS only if:

- the first gameplay viewport is primarily the world/map;
- no horizontal overflow;
- HUD/time controls are compact;
- long explanatory paragraphs are not permanently occupying prime map space;
- settings/debug/manual jump controls do not dominate;
- details open as drawer/sheet/context rather than a stacked card page;
- the screen does not read as an admin/dashboard form.

## 5. Institutional Roadmap QA

PASS only if:

- nodes correspond to real PolicyDefinition/current institutional state;
- prerequisites/incompatibilities are factual;
- current/enacted/available/blocked states are distinguishable;
- no research/reform/political mana exists;
- no scripted focus-tree progression is introduced;
- a real policy action updates the Roadmap through authoritative state.

## 6. State Project QA

For each project-capable presentation:

- identify the actual Policy/Intervention/action ID;
- show the authoritative commitment/duration source;
- show active/in-progress presentation;
- show real completion;
- show persistent world/map trace after completion;
- verify no hidden second timer or fake completion event.

Target: 2–4 project presentations if existing lifecycles honestly support them. If fewer are defensible, mark the exact blocker rather than inventing content.

## 7. WorldVisualDelta QA

For each supported feedback class, prove:

```text
source authoritative change/event
-> presentation delta
-> no authoritative mutation by UI/renderer
```

At minimum inspect:

- ideology change;
- LandHex controller change;
- conflict start/current active state;
- institution rule change;
- project/intervention completion where applicable.

## 8. ChronicleDigest QA

Create a test/hands-on sequence that produces multiple low-level ideology/faction changes plus at least one major event.

PASS only if:

- low-level related changes can be grouped/condensed;
- major territorial/conflict/institution/project history dominates visually;
- each digest item can trace to source EventId(s) or equivalent provenance;
- EventStore remains append-only and unchanged;
- no historical fact is invented by the digest.

Explicit regression: many same-day ideology-support events must not become many equally weighted top-level historical rows by default.

## 9. Renderer decision QA

If PixiJS is adopted:

- verify React/Pixi integration is deadline-safe;
- no second authoritative clock;
- no renderer mutation of WorldState;
- camera/pan/zoom/focus works on desktop and touch;
- save/load/replay remains simulation-owned;
- fallback path documented.

If SVG remains production:

- document why Pixi spike was rejected/deferred;
- prove equivalent map-first/camera/WorldVisualDelta requirements are met in SVG;
- do not leave both renderers as competing production authorities.

## 10. Content Studio QA

PASS only if a developer can:

1. open the development-only studio;
2. search for player-facing content by stable ID/text;
3. filter branch/variant content;
4. edit a selected text;
5. see baseline vs edit diff;
6. detect placeholder/variable errors;
7. receive Korean length warning where applicable;
8. persist a local draft;
9. reset one/all;
10. export JSON patch;
11. import a valid patch;
12. prove normal gameplay uses the same stable content source/presentation path where intended.

Static deployment must not claim direct GitHub write capability.

## 11. Reference / asset QA

- no commercial screenshot/asset/copy/code copied;
- reference use documented as structural principle;
- asset provenance/licensing remains recorded;
- visual density/art family is coherent;
- static decoration must not obscure controller/ideology/conflict facts.

## 12. P0 final review markers

Result report should include:

```text
ROUTINE_AUTO_PAUSE_DOMINATES_GAME_LOOP: NO / BLOCKED
MAP_MAJOR_CHANGE_READABLE_WITHOUT_REPORT: YES / NO
DAY_0_INTERMEDIATE_LATE_VISUAL_DIVERGENCE: PASS / FAIL
INSTITUTIONAL_ROADMAP: PASS / BLOCKED
STATE_PROJECT_PRESENTATION: PASS / PARTIAL_WITH_BLOCKER / FAIL
WORLD_VISUAL_DELTA_PIPELINE: PASS / FAIL
CHRONICLE_DIGEST: PASS / FAIL
RENDERER_DECISION: PIXI / SVG_FALLBACK / BLOCKED
CONTENT_STUDIO: PASS / FAIL
CONTENT_BRANCH_VARIANT_EDITING: PASS / FAIL
MOBILE_GAME_NATIVE_COMPOSITION: PASS / FAIL
SITES_REDEPLOYED_FROM_REVIEWED_COMMIT: YES / NO
GATE1F: NOT_READY
V02: NOT_STARTED
```

P0 cannot self-authorize Gate 1F or V02.
