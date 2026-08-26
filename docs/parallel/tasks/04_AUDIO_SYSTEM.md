# PARALLEL TASK 04 — AUDIO / SOUND UX

TASK_ID: PARALLEL_04_AUDIO_SYSTEM
EXECUTION_AUTHORITY: THIS_FILE_ONLY
BASELINE: 16b3ad5b2b255e41a9b4adb73b184f8b15684939

## Critical authority rule

This is an explicitly isolated parallel task.

- `docs/bridge/CURRENT_TASK.md` is **NOT an executable task for this branch**.
- Read it only for shared hard boundaries and already-accepted architecture.
- Do **NOT** implement Map Runtime, Map Visual System, Map Studio, camera, terrain, icon, or Gate1F work from `CURRENT_TASK.md`.
- If this file conflicts with a request in `CURRENT_TASK.md` about what to implement now, **this file wins for this parallel branch**.
- Do not update shared bridge state/result files.

## Role

AUDIO UX / SOUND PRESENTATION ENGINEER.

Goal: add a presentation-only audio architecture that reacts to real TMR facts without becoming a simulation writer or event-spam machine.

## Must not modify

- `src/sim/**` except importing existing read-only types when necessary
- `src/app/PoliticalWorldStage.tsx`
- `src/presentation/worldSceneModel.ts`
- map architecture/visual modules owned by other branches
- shared bridge state/result files
- production deployment

Prefer no `App.tsx` integration. If integration is necessary, document a tiny integration patch instead of editing the common hotspot.

## Dataflow

`WorldState/EventStore/WorldVisualDelta -> SoundCueResolver (read only) -> AudioManager -> SFX/Ambience`

Audio never mutates `WorldState`, never owns authoritative time, and never schedules gameplay.

## Deliverables

1. Stable `SoundCueDefinition` registry with a restrained core set, for example:
   - `ui.select`
   - `ui.confirm`
   - `ui.blocked`
   - `policy.enacted`
   - `institution.changed`
   - `project.started`
   - `project.completed`
   - `crisis.rebellion`
   - `crisis.coup`
   - `territory.controllerChanged`
   - `capital.threatened` if factual source exists
   - `border.closed`
   - `border.reopened`
   - `chronicle.majorEvent`
   - `map.ambient`
   - `capital.ambient`
   - `industrial.ambient`
2. Pure/deterministic `SoundCueResolver` from existing event/presentation facts.
3. Priority, cooldown and dedupe policy so one rebellion does not trigger many controller-change sounds.
4. Explicit suppression for routine ideology/economy churn.
5. `AudioManager` supporting:
   - user-gesture-safe startup / autoplay restrictions
   - master/SFX/ambience volume
   - mute
   - local preference persistence
   - one-shot playback
   - ambience loop/fades
   - cleanup
   - safe missing-asset fallback
6. Coherent placeholder sound language. Prefer procedural WebAudio or clearly self-generated short placeholder assets. Do not fetch unverified copyrighted audio.
7. Provenance metadata for generated/included assets.
8. Simple integration API, e.g. `resolveSoundCues(...)`, `audioManager.playCue(...)`, `setMasterVolume`, `setMuted`.

## Sound direction

Restrained fantasy/historical administration: paper, seal, wood, metal, low percussion, distant industrial mechanism, wind/city ambience. Avoid arcade/scifi beep language.

## Acceptance tests

At minimum:

- rebellion cue outranks repeated territory-change cues
- routine ideology support update produces no sound
- project completion produces exactly one expected cue
- dedupe/cooldown works deterministically
- disabled/muted audio throws no error
- missing optional asset safely degrades

## Verification

Run format, typecheck, lint, build, focused audio tests, and `git diff --check`.

## Result

Write only `docs/parallel/04_AUDIO_SYSTEM_RESULT.md`.

Include BASE_SHA, HEAD_SHA, CUE_IDS, CHANGED_FILES, GENERATED_AUDIO_ASSETS, PROVENANCE, TEST_RESULTS, INTEGRATION_API, BROWSER_LIMITATIONS, and INTEGRATION_PATCH_NEEDED.

Commit and push only this branch's work, then STOP. Do not merge, deploy, or start another task.