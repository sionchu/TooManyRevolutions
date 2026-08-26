# P0 Demo Reconciliation V1

EXECUTION_AUTHORITY: THIS_FILE_ONLY

## Branch / base

- branch: `parallel-p0-demo-reconciliation-v1`
- exact base: `e521961e25e4b20c70245137216c80a103120420`
- purpose: produce ONE final browser-playable demo candidate from the already-reviewed P0 slices.
- do not start another feature branch from this task.
- do not deploy from this task. Final deployment requires post-reconciliation browser QA and external gate review.

## Accepted implementation inputs

Integrate only the reviewed implementation commits below. Do not substitute branch tips blindly.

1. Map Simplify
   - `27794f093d3c1989548197091f0d6be867715b12`
2. UI Polish
   - `aaf7929975b4135c0d8d04a715fd7a040d987277`
3. Real KayKit Assets
   - `0c5dc55b951b93bff3304076ddf87ae2dc862d66`
4. Game Flow / Auto-Slow
   - `caca4d0797239b82b679e0a8143a91be5a9b99ad`
5. Contextual Decisions
   - `ee11f4029f190366974e9d8ff808e196cb44d684`
   - final docs-only follow-up `63fe379ba3e4b2b4520b36e2d64feb399a39f184` is reference-only and need not be cherry-picked.
6. Event Presentation
   - `cad87fc3dda69e61e7d2ed465fd99bb3e18f444b`
   - terminal correctness follow-up `d406dd47a55fd22a048094b3feaffc6ab83f0e5d`

Do not integrate World Art FIX3 `c667e23...` as a separate production renderer path. The real-asset integration below supersedes the need to chase the old procedural look.

## Integration order

Prefer this semantic order:

1. Map Simplify
2. UI Polish
3. Real Assets
4. Game Flow
5. Contextual Decisions
6. Event Presentation
7. Reconciliation-specific glue

If cherry-pick conflicts occur, resolve semantically. Do not use blanket `ours` / `theirs` on hot files.

Known overlap:

- `src/styles/global.css`: UI Polish owns drawer/card density; Game Flow owns only its time-control/auto-slow presentation. Preserve both.
- `src/app/App.tsx`: Game Flow changes playback; Contextual Decisions intentionally did not touch App and must now be connected here without losing Game Flow.
- `src/app/DecisionPanel.tsx`: UI Polish presentation must remain, but the new mixed contextual shortlist order must become authoritative for the immediate decision list.
- `src/app/PoliticalWorldStage.tsx` / `src/presentation/mapVisualSystem.ts`: Map Simplify is the starting behavior; real assets replace resolved production visual slots without restoring removed clutter.

After the accepted commits are integrated, read the resulting diff before adding glue. Remove duplicate or superseded paths instead of stacking compatibility layers.

---

# A. Preserve Map Simplify as the default visual contract

The final default/medium map must keep the accepted de-bloat behavior:

- roughly 4–7 dominant landmarks, not the old 21-placement default read.
- country / capital / factual crisis labels are the default hierarchy.
- Region / project / minor POI labels remain near/micro detail, not default clutter.
- medium route lines may remain factual, but animated route glyphs/pulses stay hidden until near detail.
- directional ideology treatment stays hidden outside near detail.
- legal owner boundary weakest, controller boundary stronger, real front strongest.
- general per-Region faction banners stay suppressed; use the existing connected-cluster capped anchor path.
- do not restore removed inline/Legacy art functions.
- do not restore primitive cone/forest terrain clutter at medium LOD.

The map must remain the primary play surface on desktop and mobile.

---

# B. Integrate real KayKit assets into the production map

`src/presentation/modelAssets/worldAssetManifest.ts` is the SSOT for asset identity, source, license and normalization.

Do NOT create another asset registry / manager / factory.

The final production map must visibly use actual loaded KayKit GLTF models, not only the standalone gallery.

## Required resolved hero replacements

Use the manifest slots as the semantic source:

- `capitalHero` -> replace the default procedural palace/capital hero with the KayKit castle.
- `industrialHero` -> replace the procedural industrial hero with the resolved mine + blacksmith composition.
- `frontierHero` -> replace the dominant frontier hero with the resolved KayKit defensive/barracks model.
- `mountainA/B`, `treeClusterA/B`, `rockCluster` -> use for near/focus terrain detail in place of the old cone primitives where the underlying factual terrain supports them.
- `coast` / `water` may support the factual port/coast composition if they align correctly with the current map geometry.

Not every imported asset must be used. `roadStraight`, `roadCurve`, `riverStraight`, `riverCurve` must NOT be placed decoratively if they do not line up with authoritative route/geography evidence.

## Port

`portHero` is intentionally unresolved.

Do NOT fabricate a dock from an unrelated model.

For the port, prefer in this order after browser inspection:

1. factual coast/water + port label/POI with no ugly fake hero;
2. existing procedural port fallback only if the port becomes unreadable without it.

Do not keep a visually dominant procedural dock merely because the old renderer had one.

## Production rendering rule

For a resolved slot, the KayKit model is primary.
Do not render the real model and the old procedural hero simultaneously for the same semantic slot.

The existing procedural renderer may remain only for an explicitly unresolved semantic slot or a still-needed factual fallback. Do not build `RendererV2`, `AssetManager`, or a second world-art orchestration layer.

Prefer reusing/refactoring the minimal GLTF loading code already proven in `WorldAssetGallery` rather than duplicating another loader implementation.

The standalone asset gallery may remain dev/build evidence, but it is not the production map.

---

# C. Connect Contextual Decisions to the actual product UI

The current App product surface must stop using validation/test fixtures as player-facing authority.

Remove from product decision composition:

- `POLICY_FIXTURE_IDS` product use.
- hard-coded `policySurfaceIds`.
- `Object.values(GAMEBUILDERS_DEMO_SCENARIO.interventionCatalog)` as the immediate full decision list.

Create one memoized contextual surface using the accepted API:

```ts
deriveContextualDecisionSurface({
  scenario: GAMEBUILDERS_DEMO_SCENARIO,
  world: record.world,
  playerCountryId: PLAYER_ID,
  catalog: GAMEBUILDERS_PRODUCTION_CONTEXTUAL_CATALOG,
  agendas,
  recentEvents: record.eventStore.events,
})
```

## Critical ordering rule

`decisionSurface.primaryShortlist` mixes policy and intervention candidates in authored contextual order.
That mixed order is authoritative for the immediate player decision surface.

Do NOT split it back into:

1. all policies
2. all interventions

because that destroys crisis/pressure/reform ordering.

Refactor the current polished `DecisionPanel` minimally so the immediate action list maps the mixed shortlist in exact order:

- `kind === "policy"` -> existing `PolicyCard`
- `kind === "intervention"` -> existing `DecisionCard`

Preserve the UI Polish density rules and WHY/details disclosure.

The Institutional Roadmap remains the full policy route and may continue to use the whole production policy catalog. It is not the same thing as the immediate shortlist.

`BLOCKED_BUT_RELEVANT` may appear only with its real existing feasibility/availability reason. Do not invent reasons.

---

# D. Preserve Game Flow / Auto-Slow

Keep the accepted time reaction contract:

- routine -> `NONE`
- rebellion / coup / civil war -> `SLOW`
- government transition -> `NONE`
- `ORDER_CONSOLIDATED` -> `STOP`
- `STATE_DISSOLVED` -> `STOP`
- multiple events -> deterministic `STOP > SLOW > NONE`

Crisis auto-slow ON:

- 3x -> 1x, playing continues
- 2x -> 1x, playing continues
- 1x -> 1x, playing continues

Policy/intervention submission preserves the prior playback state unless the resulting transition actually produces a terminal outcome.

Do not bring back auto-pause for rebellion/coup/civil war.

Manual +1/+7/+30 may continue to stop playback.

---

# E. Connect Event Presentation without creating a second event system

Use `deriveEventPresentation()` over the canonical `record.eventStore` and actual `world.politicalProposals`.

Do NOT create EventManager, NotificationService, event bus, persisted notification queue or synthetic event state.

Use existing `eventLabel()` for player-facing event copy. Do not duplicate its Korean switch.

## Presentation hierarchy

The target is:

`World change -> EventStore -> EventPresentation -> map feedback / toast / news / decision prompt -> Chronicle`

Do not turn every event into a modal.

### TOAST

- compact, non-blocking notification over/adjacent to the map.
- examples: policy/intervention result, meaningful shortage, unrest band, factual territory/border change.
- do not pause time.

### NEWS

- compact major-news presentation for rebellion, coup, civil war, government transition and terminal outcomes.
- must be visually more important than a toast but must not become a paragraph-heavy blocking modal.
- rebellion/coup/civil war use Game Flow auto-slow, not auto-stop.
- `ORDER_CONSOLIDATED` and `STATE_DISSOLVED` are terminal and may remain visible as outcome news.

A tiny local dismissed/acknowledged EventId set is acceptable as ephemeral presentation state. Do not persist it and do not create a manager abstraction.

### DECISION_REQUIRED

Show a response UI only when the accepted Event Presentation read model returns a real `DECISION_REQUIRED` item backed by an actual `PoliticalProposal` whose status is `open` for the player country/current government.

- show the factual proposal/intervention subject.
- expose accept / reject only through the existing `RESPOND_POLITICAL_PROPOSAL` action pipeline.
- inspect and reuse the current action creator/consumer. Add only the smallest demo-runtime adapter if the App does not yet expose that existing action path.
- after response, the authoritative proposal status/event must drive disappearance/update of the prompt.
- do not pause time merely because the prompt exists.

Never fabricate:

- a government-transfer choice from `GOVERNMENT_TRANSITIONED` (that event is currently a result).
- rebellion/coup accept/reject choices without a real PoliticalProposal.
- military loyalty, war settlement, coup coordination or other unsupported proposal subjects.

If no real open proposal can be naturally produced in the demo browser path, production UI still must be wired correctly and tested with an authoritative proposal generated through existing sim/test helpers. Do not add a fake production button/state just for evidence.

Chronicle remains the secondary complete history surface.

---

# F. Mobile / HUD / density

Preserve UI Polish:

- desktop contextual drawer remains approximately 320–380px practical width, not a dashboard wall.
- mobile uses bounded bottom sheet and map stays visible.
- 44px interaction targets remain for primary actions, close, playback and mobile controls.
- exact values/provenance stay behind details where already moved.
- event toast/news must not cover the whole mobile map.
- do not reintroduce body-scroll-as-core-gameplay.

---

# G. Do NOT add in this reconciliation

Do not expand scope into:

- new difficulty/scenario preset system.
- History timeline redesign.
- Institutional Web visual redesign.
- new coup/military/war domain.
- Gate1F R2.
- persistence V9 / V02.
- new simulation balance pass.
- new renderer architecture.
- whole-pack asset imports.
- new generic managers/services.

If one of these appears necessary, record it as a known limitation rather than implementing it.

---

# H. Reconciliation cleanup requirements

Before verification, inspect the final diff and remove superseded paths.

Required checks:

- no product use of fixture policy IDs.
- no full intervention catalog enumeration on the immediate decision surface.
- no duplicate procedural + GLTF hero for a resolved semantic slot.
- no revived Legacy art code.
- no duplicate event classification system.
- no duplicate auto-pause and auto-slow paths.
- no duplicate CSS rules created merely by append-only conflict resolution; preserve UI Polish canonical declarations and merge the Game Flow selectors into them cleanly where practical.
- do not rename stable files only for cleanliness during this timeboxed pass (`autoPause.ts` filename may remain).

---

# I. Required automated verification

Run focused tests covering at minimum:

- map architecture/runtime/world-art + map simplify selector.
- real asset manifest/gallery/load tests.
- contextual decision catalog + selector canonical states.
- DecisionPanel/product hookup tests proving no fixture/hardcoded decision surface.
- Game Flow `NONE/SLOW/STOP` tests.
- Event Presentation tests including real-open-proposal-only behavior and both terminal outcomes.
- existing audio/icon integration tests affected by App/UI integration.
- map-first/mobile composition tests.

Then:

```text
pnpm run typecheck
pnpm run lint
pnpm run format
pnpm run build
git diff --check
```

Run the full suite once if time permits. If all assertions pass but the known Vitest `onTaskUpdate` worker timeout occurs, record assertion pass/fail separately from runner exit. Do not spend the remaining demo window repeatedly rerunning the same known worker timeout.

---

# J. Required browser QA / evidence

Capture from the exact reconciliation source, not an older branch or deployed build.

Desktop 1440x900:

1. Day0/default, decisions closed.
2. Day0 decisions open: mixed contextual shortlist visible in exact selector order.
3. 3x playback -> actual rebellion/coup crisis -> 1x auto-slow while playback remains active.
4. crisis state: major NEWS presentation + map/front feedback + contextual decision list.
5. labels-off map.
6. actual KayKit capital + industrial + frontier model visible on the production map (not gallery).

Mobile 390x844:

7. default map-first view.
8. bottom-sheet decisions with map still visible and 44px CTA.
9. crisis/news state without full-screen obstruction.

Proposal response:

10. If a real open PoliticalProposal is reachable deterministically, capture accept/reject prompt and response.
    If not, provide integration-test evidence built from a real authoritative PoliticalProposal and explicitly state browser natural-path evidence was not reached. Do not fake it.

Record useful DOM/evidence markers for:

- visible GLTF/asset slot identities or counts.
- map landmark and label counts.
- current speed/isPlaying during crisis.
- contextual shortlist stable IDs/order.
- event presentation kind/eventId.
- active front/faction presence counts when relevant.

Visual acceptance is not satisfied by counts alone. Inspect screenshots for composition quality.

---

# K. Visual acceptance target

The final screenshots must visibly differ from the old procedural-board screenshot.

Required qualitative read:

- map first, not admin page first.
- real KayKit hero models are immediately recognizable.
- no dominant cone-mountain / toy-tree / beige-box language in the default view.
- negative space remains after asset integration.
- country/controller/front hierarchy remains legible.
- crisis feedback is visible without stopping the world.
- immediate decisions feel situational rather than a static catalog.

If the real asset integration technically works but still looks obviously worse than the simplified map, reduce/hide the offending optional asset rather than increasing visual density.

---

# L. Result / commit / stop

Write:

`docs/parallel/P0_DEMO_RECONCILIATION_V1_RESULT.md`

Include:

- exact base and accepted input SHAs actually integrated.
- cherry-pick/conflict resolution summary.
- final production asset replacements and unresolved port decision.
- proof that product decisions no longer use fixture/hardcoded immediate lists.
- mixed contextual shortlist browser evidence.
- event/news/proposal presentation wiring.
- auto-slow browser evidence.
- desktop/mobile screenshot paths.
- automated verification results.
- full-suite assertion count vs runner status if run.
- known limitations.
- explicit `NO_DEPLOY`.

Suggested implementation commit message:

`demo: reconcile final playable candidate`

Commit and push `parallel-p0-demo-reconciliation-v1`, then STOP.

Do NOT self-declare P0 PASS, Gate1F PASS, deploy readiness or submission readiness. External review decides those after inspecting the exact pushed HEAD.
