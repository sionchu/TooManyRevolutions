# PRESENTATION VISUAL V2 — FIX1 AUTHORITY REPAIR

Status: AUTHORIZED

Branch: `presentation-visual-v2`

Required starting implementation HEAD before this task commit: `c1ffcbaab58b1ab45de594a7a7e4ec7f2ce1b327`

Purpose: repair the portions of Visual V2 that were reported complete but do not match the execution authority in final source. Preserve the valid map/terrain work. Do not redeploy until external visual review.

## Why FIX1 exists

External source audit found hard authority mismatches even though `PRESENTATION_VISUAL_V2_RESULT.md` reports Phase 0–10 complete and visual hard fail count 0.

The following are source facts, not optional design suggestions:

1. `PRESENTATION_VISUAL_V2.md` Phase 5 requires primary navigation `지도 / 결정 / 제도 / 연대기`.
2. Final `ContextualDock.tsx` still exposes `지도 / 국정 / 결정 / 기록` and opens every non-map panel as the same `contextual-drawer`.
3. Phase 6 requires Institutions as a dedicated full-screen/deep surface. Final source has no `institutions` ContextPanel.
4. Final `DecisionPanel.tsx` still embeds `InstitutionalRoadmapPanel` under `중기 계획·사업 기록` inside the Decision drawer.
5. Phase 6 requires domain lanes vertically, prerequisite progression horizontally, compact title+state nodes, and a selected-node inspector. Final `InstitutionalRoadmapPanel.tsx` still uses the old depth-only layout:
   - `x = 18 + depth * 31`
   - `y = 16 + (index + 1) * (68 / (ids.length + 1))`
   This is the exact structural family that previously collapsed many shallow policies into one column.
6. Chronicle is still rendered through the same drawer and `event-row` list instead of a dedicated editorial history surface.
7. Phase 8 explicitly says to remove superseded presentation CSS rather than append a giant override layer. `08ca87d..c1ffcba` changed `src/styles/global.css` by roughly `+1085/-0`.

Therefore the existing result's "Phase 5/6/8 COMPLETED" and "hard fail 0" are not accepted as authority evidence.

## KEEP — do not regress

Treat the following V2 work at `c1ffcba` as accepted implementation input unless a concrete bug requires a minimal correction:

- shared continuous terrain mesh rendering and deterministic relief;
- anisotropic authorial X/Z hex spacing fix;
- connected-component topology correctness from World FIX1;
- no default translucent connected-component Venn fills as terrain art;
- three strategic hero roles only: capital / industrial / frontier;
- grounded hero terrace/contact-shadow/material-adapter work;
- no per-Hex tree/rock/mountain GLTF scatter;
- no beige procedural hero fallback beside resolved KayKit heroes;
- `deriveMapVisibilityBudget` world/pressure/crisis behavior;
- factual controller/front/rebellion projection;
- screen-space label priority/collision cap;
- mixed contextual decision shortlist authority and order;
- Auto-Slow behavior;
- EventStore / PoliticalProposal authority;
- simulation/state authority and no direct UI WorldState mutation.

Do not redesign terrain again in this FIX unless a screenshot demonstrates an actual regression.

## Mandatory authority

Read fully before editing:

- `docs/parallel/tasks/PRESENTATION_VISUAL_V2.md`
- `docs/bridge/tasks/PRESENTATION_VISUAL_V2_TARGET.md`
- `docs/bridge/tasks/PRESENTATION_VISUAL_V2_VISUAL_BAR.md`
- this FIX1 document
- `docs/GDD.md`
- `docs/ARCHITECTURE.md`
- `docs/QA_PLAYTEST.md`
- root `AGENTS.md`

If this FIX conflicts with the original V2 task only because the original phase was falsely marked complete, this FIX is the controlling correction.

# FIX1-A — Product navigation and surface architecture

## Required ContextPanel model

Primary navigation must be exactly:

- `map` → 지도
- `decisions` → 결정
- `institutions` → 제도
- `chronicle` → 연대기

`region` may remain an ephemeral map inspector state but is not a primary tab.

Remove `agenda` / `국정` as a primary navigation tab. Existing factual Agenda data is not deleted: keep current pressure on the map and use agenda evidence in contextual Decisions as already derived.

## Surface behavior

Desktop:

- Map = primary world surface.
- Decisions = right contextual sheet/drawer; map remains clearly visible.
- Institutions = dedicated deep/full surface, not inside Decisions and not the generic right drawer.
- Chronicle = dedicated deep/full surface, not the generic right drawer.

Mobile:

- Decisions = bottom sheet replacing conflicting lower controls.
- Institutions / Chronicle = dedicated mobile full-screen surfaces with one clear back-to-map target.

Do not fake this with CSS that merely stretches an existing nested `<details>` element. The React surface state must represent the product modes explicitly.

# FIX1-B — Decisions cleanup

`DecisionPanel` must preserve `decisionSurface.primaryShortlist` exact mixed order.

Remove `InstitutionalRoadmapPanel` from DecisionPanel completely.

Do not show a full policy graph inside any Decision disclosure.

If StateProject support remains, keep it compact and secondary; it must not recreate the old "중기 계획·사업 기록" admin subsection as a second product inside Decisions.

Decision first-read hierarchy:

1. 지금 필요한 선택
2. title
3. why-now
4. 1–3 qualitative outcomes/tradeoffs
5. CTA
6. exact evidence only under secondary disclosure

No duplicated `지금 결정할 일` title hierarchy.

# FIX1-C — Institutions actual RE0

Reimplement `InstitutionalRoadmapPanel` as the Phase 6 progression surface.

## Layout

Use deterministic pure layout:

- Y axis = `PolicyDomain` lane.
- X axis = prerequisite depth.
- Multiple nodes with the same domain/depth must occupy deterministic tracks/rows without overlap.

Recommended domain order:

1. authority
2. property
3. labor
4. information
5. taxation
6. localGovernment

Use Korean player labels for lanes.

Do not use the old global depth-only percentage layout.

## Node content

Default graph node shows only:

- policy title;
- enacted / available / blocked state.

Do not put descriptions, mutation summaries, prerequisite reasons and multiple badges into every graph node.

## Selected-node inspector

Selecting a node opens one inspector within the Institutions deep surface containing, where authoritative:

- name;
- description;
- current state;
- prerequisites;
- incompatibilities;
- exact rule effect;
- legitimate enact CTA only if the current authoritative action path supports it.

No invented research currency, progress timer, focus-tree resource, generic tech mana, or fake availability.

## Initial viewport

At 1440x900 the first Institutions screenshot must communicate multiple domain lanes and at least the meaningful early prerequisite structure without one corner containing all meaningful content and a giant unexplained empty remainder.

At 390x844 it may pan horizontally/vertically, but labels and selected-node inspector must remain readable.

# FIX1-D — Chronicle actual RE0

Chronicle remains derived only from EventStore / chronicle digest.

Dedicated deep surface structure:

- current/most recent major event gets headline/editorial treatment;
- major transitions/crises/institution events visually distinct;
- minor trend events are compact timeline rows;
- no equal rounded card around every event;
- no raw EventId/internal ids/debug copy;
- no invented historical facts.

Do not render Chronicle through the generic contextual drawer.

# FIX1-E — CSS cleanup, not another override layer

This is mandatory.

Do not append another large Visual V2 override block to the end of `global.css`.

While implementing the corrected structures:

- remove superseded old roadmap percentage-node rules;
- remove old nested Decision roadmap styling;
- remove obsolete generic Chronicle drawer rules that the new surface replaces;
- merge duplicate `.map-first-shell`, roadmap, decision and chronicle rules where touched;
- remove styles made unreachable by the new ContextPanel structure.

Target for this FIX1 diff: `src/styles/global.css` should be net-negative or near-neutral in line count. A new 500+ line append-only override is a hard failure.

Do not perform unrelated whole-project CSS formatting churn.

# FIX1-F — Screenshot-first visual gate

Capture from the final FIX1 source, not intermediate code:

Desktop 1440x900:

- `docs/parallel/evidence/visual-v2-fix1-desktop-map.png`
- `docs/parallel/evidence/visual-v2-fix1-desktop-decisions.png`
- `docs/parallel/evidence/visual-v2-fix1-desktop-institutions.png`
- `docs/parallel/evidence/visual-v2-fix1-desktop-chronicle.png`
- `docs/parallel/evidence/visual-v2-fix1-desktop-rebellion.png`

Mobile 390x844:

- `docs/parallel/evidence/visual-v2-fix1-mobile-map.png`
- `docs/parallel/evidence/visual-v2-fix1-mobile-decisions.png`
- `docs/parallel/evidence/visual-v2-fix1-mobile-institutions.png`
- `docs/parallel/evidence/visual-v2-fix1-mobile-chronicle.png`

Open each screenshot and record concrete observations, but DO NOT self-declare external Visual PASS.

Hard failures include all Visual Bar conditions plus:

- primary tab still says `국정` or `기록` instead of `제도` / `연대기`;
- no explicit Institutions product mode;
- Institutions is still nested in Decision details;
- old depth-only roadmap layout remains;
- Chronicle is still the same generic right drawer;
- graph node text overlap/clipping;
- generic repeated rounded-card dashboard language;
- essential Korean clipping/ellipsis/vertical stacking;
- mobile CTA/HUD overlap;
- terrain or grounded heroes regress from accepted V2 behavior.

# FIX1-G — verification

Run at minimum:

- focused tests for ContextualDock / DecisionPanel / InstitutionalRoadmap / Chronicle / map composition;
- `pnpm typecheck`;
- `pnpm lint`;
- targeted Prettier check / repo format command as established by repo;
- `pnpm build`;
- `git diff --check`.

Run the full suite once if practical. If the known Vitest `onTaskUpdate` worker timeout recurs after all assertions, record assertion result and runner exit separately; do not loop repeatedly.

Browser smoke:

- Day 0 map;
- Decisions mixed shortlist;
- Institutions navigation and node selection;
- Chronicle;
- 3x → factual tick-19 rebellion → 1x while still playing;
- mobile 390x844 navigation across all four product surfaces.

# DO NOT DEPLOY

The existing public Site currently points at the previously deployed V2 build.

FIX1 must NOT publish or update ChatGPT Sites.

Reason: the previous agent self-declared visual hard fail 0 despite source-level authority mismatches. External review is now mandatory before another production publish.

After FIX1 commit/push, STOP and report:

- exact HEAD;
- changed files/stat;
- verification results;
- all screenshot paths;
- `global.css` additions/deletions for FIX1 specifically;
- confirmation that deployment was not run.

Write/update result:

`docs/parallel/PRESENTATION_VISUAL_V2_FIX1_RESULT.md`

Do not start Gate1F R2 or unrelated feature work.