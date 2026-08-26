# Parallel P0 Integration V1

EXECUTION_AUTHORITY: THIS_FILE_ONLY

## Branch / baseline

- integration branch: `parallel-p0-integration-v1`
- integration base: `7b2f5bd2c65f61a302bbc096f1afe2757b9bcd4a`
- base contains accepted 01 Map Runtime + FIX1.
- This task authorizes P0 product-surface integration only. It does not authorize Gate1F PASS, V02, persistence V9, or production deployment.

## Accepted inputs to integrate now

### 01 Map Runtime
Already present in branch base.

- runtime implementation: `7c6067eefb54aa2e2c5bb0d611cb417d9a32f313`
- FIX1 implementation: `7ae9381dc984f1c0526f212ab9fb8db7813bc15e`
- result head: `7b2f5bd2c65f61a302bbc096f1afe2757b9bcd4a`

Preserve:
- shared terrain mesh with terrain/elevation attributes
- legal owner / physical controller / actual front separation
- faction banner dedupe
- actual screen-space occupancy inspection hooks
- LandHex hit-test authority

### 02 World Art
Integrate the current accepted implementation commits:

- `641d112f8f6c125e5dce33fbe8736b49b4f3c601`
- `fd46de162b81814a1c61caccaf09ab4a31641738`
- `a780e3df108dbdf4490d42859af1d880d4fdd663` — accepted FIX1 renderer contract

These contain:
- truth-aware region composition contract
- 17 procedural low-poly asset kits
- material/scale/grounding contracts
- `resolveRegionCompositionPlacements`
- dimension-safe reusable `ProceduralWorldArtKitRenderer`
- unit primitive geometry + X/Y/Z mesh scaling contract
- grounding/LOD/stable Kit-ID render descriptors
- R3F authoring gallery

Do not loosen truth requirements to make art appear.

Note: 06 visual QA against pre-FIX1 `fd46de1` found port and agrarian identity FAIL, frontier PARTIAL, and primitive/blockout dominance. 02 is separately working on FIX2. Do not wait for FIX2 to start integration, but record that the integrated art may require a later accepted 02 visual-identity follow-up before product PASS.

### 03 Icon System
Integrate the accepted icon implementation and theme-safe prep:

- `fef02f01eee007bd79254d41a39a736c5c3bc595`
- `f4007d6f1127641db1ad57a5d4fa71adf4cd42c8`

Do not cherry-pick `304e039` just to obtain result documentation unless needed.

The icon system may be present and ready for consumer integration, but do not duplicate UI work owned by a newer 03 UI-integration commit unless that commit is separately QC-authorized later.

### 04 Audio System + generated WAV assets
Accepted for integration.

Integrate implementation commits:

- `0bf4e24ce6a50a0cacea8c6e19c22a7be3c4bf20` — presentation-only cue resolver / AudioManager / 18-cue registry
- `5ca4bff9c725bd2b83b3e74ca09d3894f35c5600` — 18 deterministic project-authored PCM16 WAV assets, file-primary registry, manifest/validator, AudioGallery

Do not cherry-pick docs-only result commits `7abb6e3` or `fa9666d` unless result documentation is specifically useful.

Preserve:
- `SoundCueResolver` remains presentation-only and read-only toward simulation
- `AudioManager` owns browser audio/preferences only
- generated local WAV is primary
- retained procedural recipe is fallback when file fetch/decode/play setup fails
- priority/cooldown/dedupe/replay idempotence
- routine ideology/economy churn remains silent
- trusted user gesture startup
- master/SFX/ambience volume and mute preferences
- all 18 assets remain `PROJECT_AUTHORED_GENERATED_AUDIO`

## Do not integrate yet

- 05 Gate1F R1: entirely separate simulation branch; do not cherry-pick any Gate1F repair into P0 product integration.
- 06 Visual QA: evidence/protocol only; do not treat QA branches as production source.

## Phase 1 objective

Create one coherent playable strategy-map product surface where:

1. 01 continuous terrain remains the geography substrate.
2. 02 procedural kits replace generic blockout landmarks where factual evidence permits.
3. region composition is resolved from actual `WorldSceneModel` evidence.
4. logical Hex remains the interaction/computation substrate but is not visually dominant.
5. world-first composition improves substantially on desktop and mobile.
6. accepted 03 semantic icon system is available to player-facing consumers without replacing 3D geography.
7. accepted 04 generated WAV/audio system is actually connected to player-visible interactions and factual world events without modifying simulation authority.

## Integration order

### A. Bring accepted branches

Cherry-pick/import accepted 02, 03, and 04 implementation commits onto this branch.

Resolve conflicts in favor of 01 runtime authority for:

- `PoliticalWorldStage.tsx`
- `mapArchitecture.ts`
- `mapRuntime/**`
- shared terrain mesh
- controller/front semantics

Resolve conflicts in favor of 02 for:

- `mapVisual/worldArt*`
- `mapVisual/proceduralKitGeometry*`
- `mapVisual/ProceduralWorldArtKitRenderer*`
- `mapContent/regionComposition*`

Resolve conflicts in favor of 03 for:

- `public/assets/tmr/icons/**`
- icon registry/component/renderer

Resolve conflicts in favor of 04 for:

- `src/presentation/audio/**`
- `src/presentation/audioSystem.ts`
- generated `public/assets/tmr/audio/**`
- audio manifest/validation/generator

After cherry-pick, run typecheck immediately before further integration.

### B. Actual World Art in the strategy map

Integrate `regionCompositionEvidenceFromWorldSceneModel` + `resolveRegionCompositionPlacements` into the map presentation.

Use `ProceduralWorldArtKitRenderer` from accepted 02 FIX1 rather than reimplementing primitive rendering inside `PoliticalWorldStage`.

The integrator must provide the factual 3D position/Y grounding input. The reusable renderer may consume that Y when the Kit accepts terrain height, but it must not sample or invent terrain height itself.

Use the 17 procedural kits for factual world objects. Do not render duplicate old generic landmark geometry and new kit geometry simultaneously.

Required target silhouettes where factual authored/evidence content exists:

- capital: palace / assembly / capital town mass
- industrial: mine and industrial/project mass when evidence exists
- port: dock/port silhouette
- frontier: fort/gate silhouette
- agrarian/distribution: only if a truthful matching Region and evidence exist

Do not display:
- assembly without institution evidence
- project building without recorded project lifecycle evidence
- banner without faction presence
- barricade without conflict
- route corridor without active route

Terrain must come from 01 shared terrain mesh. Do not use the gallery's flat panel ground in production.

### C. Authored settlement content gap

Current non-capital settlement evidence may be insufficient for `dense-town` / `small-settlement`.

It is allowed to extend presentation-only authored semantic content for existing Scenario Regions/LandHex anchors when this represents static authored settlement metadata.

Rules:
- no new simulation entity
- no WorldState field
- no population/cargo/army implication
- stable scenario/Region/LandHex anchor
- explicit authored-presentation provenance
- do not invent settlement metadata for a Region that has no design rationale

If no truthful authored settlement can be established, omit the settlement kit rather than weakening resolver authority.

### D. World-first / mobile composition — P0-VIS-01

01 FIX1 measured first mobile viewport terrain share at `0.344`. This is a product blocker, not a runtime-geometry blocker.

Change the integrated layout so the world is the dominant first viewport.

Required mobile acceptance target at 390×844:

- actual map canvas / meaningful world presentation should occupy at least 60% of first viewport height where technically feasible
- compact header/HUD/time controls instead of stacking large blocks above the map
- map/control touch targets >= 44px
- no horizontal body overflow
- selected-region drawer must preserve visible surrounding world context; avoid covering nearly the whole map

Do not fake the metric by enlarging an empty stage. 06 will measure separately:
- STAGE_OCCUPANCY
- TERRAIN_OCCUPANCY
- MEANINGFUL_WORLD_OCCUPANCY

Desktop 1440×900:
- world should be the first visual anchor within ~2 seconds
- HUD/context should read as support, not primary dashboard

### E. Political visual hierarchy

Keep three visual channels separate:

- legal owner boundary = subtle legal geography
- physical controller = stronger occupied/controlled area edge/surface
- active front = strongest conflict line, only from real fronts

Do not use one color/line to represent all three.

Faction territory surface/front is primary. Faction banners remain secondary anchors only.

Inspect/remove or clip any ideology directional treatment that visually leaks outside its valid Region surface or implies false movement.

### F. Icons

Make the 03 icon system available in the integrated build.

If touching player-facing components in this phase, prioritize only low-conflict P0 seams and preserve Korean labels/accessibility.

Do not replace R3F world landmarks with CSS icons.

### G. Audio integration

Actually connect accepted 04 audio to the playable screen. Do not leave it as a gallery-only system.

Required integration behavior:

1. Create one `AudioManager` per active game-screen lifecycle and dispose it on unmount/restart where appropriate.
2. Keep `SoundCueResolverState` in React/presentation state or a ref, never in `WorldState` or persistence.
3. Start/resume audio only from an existing trusted user click/tap. Reuse an existing start/continue/audio-control gesture; do not create a mandatory modal just for audio.
4. Feed only factual new `GameEvent`s / existing presentation deltas into `resolveSoundCues`; do not synthesize fake gameplay events to get sound.
5. Prevent render/replay duplicate sound. Use the resolver state/event identity/cursor contract so rerenders do not replay old cues.
6. Play resolved one-shot cues through file-primary WAV assets. Missing/decode failure must fall through to the existing procedural recipe.
7. Start `map.ambient` as the safe default game ambience after audio activation. Switching to `capital.ambient` or `industrial.ambient` is optional and must be based on factual selected/focused Region semantics; do not infer fake location/activity.
8. Existing audio on/off UI must control `AudioManager` mute/enable state and keep an accessible text label. If 03 `ui.audio` is available, it may be used as a companion icon, not as the sole label.
9. Do not make routine ideology/economy ticks audible. Preserve resolver suppression/priority behavior.
10. Do not let a burst of territory changes overpower rebellion/coup/civil-war priority. Preserve tested crisis suppression/dedupe.

Required local smoke QA:
- trusted-click audio startup = ready or clearly handled autoplay-blocked state
- `ui.select` or `ui.confirm` file playback
- `map.ambient` file playback + stop/dispose
- one factual gameplay cue such as project completion, rebellion, or controller change through the resolver path
- mute/unmute control
- no console error caused by missing WAV path

Do not claim speaker fidelity PASS from automated browser status alone.

## Protected authority

Forbidden:

- direct UI/renderer WorldState mutation
- audio-generated simulation events or gameplay state
- fake routes, army formations, crowds, cargo, project completion, conflict, or faction facts
- direct LandHex controller writes from presentation
- visible internal Hex grid as default geography art
- increasing LandHex count for decoration
- generic story/focus nodes
- generic political/tech mana
- Gate1F simulation repair
- persistence schema work

## Tests / QA

Run at minimum:

- focused map-runtime tests
- world-art tests including `ProceduralWorldArtKitRenderer.test.ts`
- region composition authority tests
- icon tests
- focused audio tests
- generated audio asset validation tests
- `inspect:t018`
- `inspect:t021`
- `inspect:t024`
- `inspect:v01`
- typecheck
- lint
- format
- build
- `git diff --check`

Run full test suite and record Vitest worker timeout honestly if it recurs.

## Required browser evidence

Local browser only; no production Sites deploy in this phase.

Capture at minimum:

Desktop 1440×900:
- Day0 labels ON
- Day0 labels OFF
- Day90 rebellion
- Day90 labels OFF

Mobile 390×844:
- Day0 default
- selected Region / drawer
- Day90 rebellion

Record actual DOM/browser measurements:
- canvas top/height
- viewport share
- horizontal overflow
- minimum touch target
- faction surface/front count
- labels count
- projected terrain bounds

Also record audio smoke evidence/status for:
- trusted gesture startup
- one-shot WAV
- `map.ambient` WAV
- factual resolver-driven gameplay cue
- mute/unmute

Do not declare P0 PASS yourself.

## Result

Create/update:

`docs/parallel/P0_INTEGRATION_V1_RESULT.md`

Include:
- base/head SHA
- source commits integrated, including 02 FIX1 `a780e3d` and 04 `0bf4e24` + `5ca4bff`
- conflict resolutions
- actual changed files
- world-art integration mapping
- omitted art due to missing evidence
- audio integration lifecycle and event-cursor/resolver-state ownership
- which WAV cues were browser-smoke tested
- mobile/desktop measurements
- screenshot paths
- tests
- known limitations
- pending accepted follow-up commits not yet integrated (for example future 02 FIX2 or newer 03 UI integration if they finish later)

Commit/push and STOP.

No merge to main P0 branch, no production deploy, no P0/Gate declaration.