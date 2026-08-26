# PARALLEL TASK 04 — AUDIO / SOUND UX RESULT

TASK_ID: PARALLEL_04_AUDIO_SYSTEM
BRANCH: parallel-p0-audio-system-v2
BASE_SHA: ffc876c8c532ae5f77282ba059ec565532a69eb7
HEAD_SHA: 5ca4bff9c725bd2b83b3e74ca09d3894f35c5600

## CUE_IDS

`ui.select`, `ui.confirm`, `ui.blocked`, `policy.enacted`,
`institution.changed`, `project.started`, `project.completed`,
`crisis.rebellion`, `crisis.coup`, `crisis.civilWar`,
`territory.controllerChanged`, `capital.threatened`, `border.closed`,
`border.reopened`, `chronicle.majorEvent`, `map.ambient`, `capital.ambient`,
`industrial.ambient`

## CHANGED_FILES

- `src/presentation/audio/soundCueRegistry.ts`
- `src/presentation/audio/soundCueResolver.ts`
- `src/presentation/audio/audioManager.ts`
- `src/presentation/audio/index.ts`
- `src/presentation/audioSystem.ts`
- `src/presentation/audio.test.ts`
- `src/presentation/audio/audioAssetManifest.ts`
- `src/presentation/audio/audioAssetValidation.ts`
- `src/presentation/audioAssetValidation.test.ts`
- `src/presentation/AudioGallery.tsx`
- `src/presentation/audioGalleryPreview.tsx`
- `audio-gallery.html`
- `tools/generateAudioAssets.ts`
- `public/assets/tmr/audio/*.wav`
- `public/assets/tmr/audio/manifest.json`

## IMPLEMENTATION

- Added a stable cue registry with priority, tick cooldown, channel, and
  provenance metadata.
- Added a pure resolver accepting bounded `GameEvent[]`, `EventStore`,
  `WorldState` read projections, `WorldVisualDelta[]`, and explicit UI cue
  requests.
- Rebellion/coup/civil-war cues dominate same-tick overlapping controller
  changes. Controller changes are grouped per tick and remain suppressed for
  the crisis suppression window; routine ideology and economy churn is silent.
- Intervention completion is keyed by commitment identity and is emitted once
  across replay calls. Derived institution-rule writes caused by a policy or
  project are represented by the parent cue rather than duplicated.
- Added `AudioManager` with gesture-safe startup, master/SFX/ambience gain
  buses, mute and enable controls, local preference persistence, generated WAV
  file playback, procedural one-shot/ambience fallback, and loop/fade/cleanup.

## GENERATED_AUDIO_ASSETS

18 deterministic project-authored PCM16 WAV assets are bundled under
`public/assets/tmr/audio/`. No fetched, copied, or third-party audio files are
used.

## PROVENANCE

Every generated file and manifest entry records
`PROJECT_AUTHORED_GENERATED_AUDIO` and `tmr-audio-pass1-v1`. The generator uses
deterministic repository-local synthesis only; there is no external license or
downloaded audio. Every registry file asset retains its authored procedural
recipe as the fallback.

## AUDIO_ASSET_PASS1

### GENERATED_AUDIO_ASSET_COUNT

18

### GENERATED_AUDIO_FILES

- `public/assets/tmr/audio/ui-select.wav`
- `public/assets/tmr/audio/ui-confirm.wav`
- `public/assets/tmr/audio/ui-blocked.wav`
- `public/assets/tmr/audio/policy-enacted.wav`
- `public/assets/tmr/audio/institution-changed.wav`
- `public/assets/tmr/audio/project-started.wav`
- `public/assets/tmr/audio/project-completed.wav`
- `public/assets/tmr/audio/crisis-rebellion.wav`
- `public/assets/tmr/audio/crisis-coup.wav`
- `public/assets/tmr/audio/crisis-civil-war.wav`
- `public/assets/tmr/audio/territory-controller-changed.wav`
- `public/assets/tmr/audio/capital-threatened.wav`
- `public/assets/tmr/audio/border-closed.wav`
- `public/assets/tmr/audio/border-reopened.wav`
- `public/assets/tmr/audio/chronicle-major-event.wav`
- `public/assets/tmr/audio/map-ambient.wav`
- `public/assets/tmr/audio/capital-ambient.wav`
- `public/assets/tmr/audio/industrial-ambient.wav`

### CUE_TO_FILE_MAPPING

`ui.select → ui-select.wav`; `ui.confirm → ui-confirm.wav`; `ui.blocked →
ui-blocked.wav`; `policy.enacted → policy-enacted.wav`; `institution.changed →
institution-changed.wav`; `project.started → project-started.wav`;
`project.completed → project-completed.wav`; `crisis.rebellion →
crisis-rebellion.wav`; `crisis.coup → crisis-coup.wav`; `crisis.civilWar →
crisis-civil-war.wav`; `territory.controllerChanged →
territory-controller-changed.wav`; `capital.threatened → capital-threatened.wav`;
`border.closed → border-closed.wav`; `border.reopened → border-reopened.wav`;
`chronicle.majorEvent → chronicle-major-event.wav`; `map.ambient →
map-ambient.wav`; `capital.ambient → capital-ambient.wav`; `industrial.ambient →
industrial-ambient.wav`.

### AMBIENCE_FILES

- `map.ambient → map-ambient.wav`: 10.00000s, loop seam delta 0.00000
- `capital.ambient → capital-ambient.wav`: 10.00000s, loop seam delta 0.00000
- `industrial.ambient → industrial-ambient.wav`: 10.00000s, loop seam delta 0.00000

### GENERATOR_PATH

`tools/generateAudioAssets.ts`, invoked with
`pnpm exec vite-node tools/generateAudioAssets.ts --write`.

### PROVENANCE

`PROJECT_AUTHORED_GENERATED_AUDIO` for all 18 assets; generator version
`tmr-audio-pass1-v1`; repository-local deterministic PCM synthesis; external
license asset count 0.

### AUDIO_METRICS

All files are RIFF/WAVE, PCM16, mono, 22050 Hz. Peak and RMS are normalized
sample metrics from the generated files.

| cueId | duration | peak | RMS | loop |
| --- | ---: | ---: | ---: | :---: |
| `ui.select` | 0.24000s | 0.779968 | 0.173936 | no |
| `ui.confirm` | 0.32000s | 0.779968 | 0.154157 | no |
| `ui.blocked` | 0.34000s | 0.779968 | 0.171500 | no |
| `policy.enacted` | 0.48000s | 0.779968 | 0.144201 | no |
| `institution.changed` | 0.44000s | 0.779968 | 0.135015 | no |
| `project.started` | 0.38000s | 0.779968 | 0.171165 | no |
| `project.completed` | 0.56000s | 0.779968 | 0.131103 | no |
| `crisis.rebellion` | 0.76000s | 0.779968 | 0.157184 | no |
| `crisis.coup` | 0.550023s | 0.779968 | 0.138384 | no |
| `crisis.civilWar` | 0.90000s | 0.779968 | 0.132816 | no |
| `territory.controllerChanged` | 0.28000s | 0.779968 | 0.163289 | no |
| `capital.threatened` | 0.52000s | 0.779968 | 0.181006 | no |
| `border.closed` | 0.48000s | 0.779968 | 0.177559 | no |
| `border.reopened` | 0.52000s | 0.779968 | 0.125409 | no |
| `chronicle.majorEvent` | 0.50000s | 0.779968 | 0.171537 | no |
| `map.ambient` | 10.00000s | 0.359985 | 0.097578 | yes |
| `capital.ambient` | 10.00000s | 0.359985 | 0.095565 | yes |
| `industrial.ambient` | 10.00000s | 0.359985 | 0.101871 | yes |

### PLAYBACK_QA

- PASS — local Vite `audio-gallery.html` rendered all 18 rows; trusted-click
  startup returned ready; `ui.select` reported `재생됨 · WAV asset`;
  `map.ambient` reported `재생됨 · WAV asset` and showed its stop state.
- PASS — browser console warning/error collection was empty during the smoke
  run; static `ui-select.wav` serving returned HTTP 200 with `audio/wav`.
- NOT_RUN — physical speaker/ear fidelity and OS audio-device behavior were
  not measurable through the automated browser surface.

### PROCEDURAL_FALLBACK_RETAINED

PASS — every generated file registry asset keeps its original `procedural`
recipe. Missing-file fallback and decoded-file-primary behavior are covered by
focused `AudioManager` tests.

### TEST_RESULTS

- `pnpm exec vite-node tools/generateAudioAssets.ts --write` — PASS, 18 assets
  generated.
- Generator repeat run with SHA-256 comparison — PASS, all 18 WAV hashes were
  identical.
- `pnpm exec vitest run src/presentation/audio.test.ts src/presentation/audioAssetValidation.test.ts --reporter=verbose --silent=false` — PASS, 2 files / 12 tests.
- `pnpm run typecheck` — PASS.
- `pnpm run lint` — PASS.
- `pnpm run format` — PASS.
- `pnpm run build` — PASS. Vite emitted the repository's existing large-chunk
  warning; the build completed.
- `git diff --cached --check` — PASS at implementation staging.
- `pnpm test` — the existing full-runner result remains an exit 1 after 84
  files / 618 tests passed because of 4 unhandled Vitest
  `[vitest-worker]: Timeout calling "onTaskUpdate"` errors; no assertion
  failure was reported. The PASS1 change does not touch simulation files.

### KNOWN_LIMITATIONS

- `AudioGallery` is a standalone preview surface and is intentionally not
  mounted by production `App.tsx`.
- Browser AudioContext file fetch/decode/play scheduling was exercised; final
  speaker fidelity, autoplay behavior on other browsers, and OS permissions
  remain environment-dependent.
- The generated assets are intentionally restrained mono PCM16 sounds; future
  mix/mastering can refine them without changing cue IDs, resolver semantics,
  or the fallback contract.

## INTEGRATION_API

```ts
const audioManager = new AudioManager();
let audioResolverState = createSoundCueResolverState();

await audioManager.startFromUserGesture();
const resolved = resolveSoundCues(
  { events: newEvents, eventStore, world, visualDeltas },
  audioResolverState,
);
audioResolverState = resolved.nextState;
await Promise.all(
  resolved.cues.map((cue) => audioManager.playCue(cue.cueId)),
);
await audioManager.startAmbience(resolveAmbientCue("map"), { fadeMs: 350 });

audioManager.setMasterVolume(0.7);
audioManager.setSfxVolume(0.85);
audioManager.setAmbienceVolume(0.4);
audioManager.setMuted(false);
audioManager.dispose();
```

Resolver state is presentation-owned and must not be placed in `WorldState` or
the persistence snapshot. `AudioManager` never advances simulation time or
creates gameplay events.

## BROWSER_LIMITATIONS

The automated tests use a deterministic fake `AudioContext` in Node. The
standalone local browser smoke confirmed file fetch/decode/play scheduling for
one-shot and ambience assets, but physical speaker fidelity, browser-specific
autoplay prompts, and OS audio permissions were not exercised. Browser startup
must call `startFromUserGesture()` from a trusted click/tap; unavailable or
blocked contexts return a status without throwing.

## INTEGRATION_PATCH_NEEDED

YES — intentionally not applied to the common `App.tsx` hotspot. A future
screen integration should instantiate one `AudioManager` per game screen,
call `startFromUserGesture()` from the existing start/input gesture, pass only
new events plus `WorldVisualDelta[]` into `resolveSoundCues`, retain the
returned resolver state outside simulation state, play the resolved cue IDs,
and dispose the manager when the screen unmounts. Existing `playTone` wiring
can then be replaced by this API in a separately owned integration change.
