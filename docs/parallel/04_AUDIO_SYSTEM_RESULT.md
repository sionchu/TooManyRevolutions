# PARALLEL TASK 04 — AUDIO / SOUND UX RESULT

TASK_ID: PARALLEL_04_AUDIO_SYSTEM
BRANCH: parallel-p0-audio-system-v2
BASE_SHA: ffc876c8c532ae5f77282ba059ec565532a69eb7
HEAD_SHA: 0bf4e24ce6a50a0cacea8c6e19c22a7be3c4bf20

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
  buses, mute and enable controls, local preference persistence, procedural
  one-shot playback, ambience loop/fade/cleanup, and safe missing-asset
  fallback.

## GENERATED_AUDIO_ASSETS

NONE. The registry uses short project-authored WebAudio oscillator recipes;
there are no fetched, copied, or bundled copyrighted audio files.

## PROVENANCE

Every registry asset has a stable `tmr.audio.*` identity and records:
`TooManyRevolutions project-authored WebAudio placeholder; no external audio
asset.` Optional file slots carry caller-supplied provenance and fall back to
the authored procedural recipe.

## TEST_RESULTS

- `pnpm install --frozen-lockfile` — PASS.
- `pnpm exec vitest run src/presentation/audio.test.ts --reporter=verbose --silent=false` — PASS, 1 file / 8 tests.
- `pnpm run typecheck` — PASS.
- `pnpm run lint` — PASS.
- `pnpm run format` — PASS.
- `pnpm run build` — PASS. Vite emitted the repository's existing large-chunk warning; the build completed.
- `git diff --check` — PASS.
- `pnpm test` — runner exit 1 after 84 files / 618 tests passed because Vitest reported 4 unhandled `[vitest-worker]: Timeout calling "onTaskUpdate"` errors in the long-running suite; no assertion failure was reported.

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

The automated tests use a deterministic fake `AudioContext` in Node. Actual
browser device output, speaker fidelity, browser-specific autoplay prompts,
and OS audio permissions were not exercised in this branch. Browser startup
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
