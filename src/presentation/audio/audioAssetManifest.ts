import type { SoundCueId } from "./soundCueRegistry";

export const AUDIO_ASSET_PROVENANCE =
  "PROJECT_AUTHORED_GENERATED_AUDIO" as const;
export const AUDIO_ASSET_GENERATOR_VERSION = "tmr-audio-pass1-v1" as const;

export type AudioAssetCategory =
  | "ui"
  | "policy"
  | "institution"
  | "project"
  | "crisis"
  | "territory"
  | "capital"
  | "border"
  | "chronicle"
  | "ambience";

export interface AudioAssetManifestEntry {
  readonly id: string;
  readonly cueId: SoundCueId;
  /** Filename relative to public/assets/tmr/audio/. */
  readonly file: string;
  readonly duration: number;
  readonly category: AudioAssetCategory;
  readonly materialLanguage: string;
  readonly loop: boolean;
  readonly provenance: typeof AUDIO_ASSET_PROVENANCE;
  readonly generatorVersion: typeof AUDIO_ASSET_GENERATOR_VERSION;
  /** Render metrics are refreshed into public/.../manifest.json by the generator. */
  readonly sampleRate?: number;
  readonly channels?: number;
  readonly peak?: number;
  readonly rms?: number;
}

export const TMR_AUDIO_ASSET_MANIFEST = [
  {
    id: "tmr.audio.ui.select.v1",
    cueId: "ui.select",
    file: "ui-select.wav",
    duration: 0.24,
    category: "ui",
    materialLanguage: "paper + wood click",
    loop: false,
    provenance: AUDIO_ASSET_PROVENANCE,
    generatorVersion: AUDIO_ASSET_GENERATOR_VERSION,
  },
  {
    id: "tmr.audio.ui.confirm.v1",
    cueId: "ui.confirm",
    file: "ui-confirm.wav",
    duration: 0.32,
    category: "ui",
    materialLanguage: "seal/stamp + low resonance",
    loop: false,
    provenance: AUDIO_ASSET_PROVENANCE,
    generatorVersion: AUDIO_ASSET_GENERATOR_VERSION,
  },
  {
    id: "tmr.audio.ui.blocked.v1",
    cueId: "ui.blocked",
    file: "ui-blocked.wav",
    duration: 0.34,
    category: "ui",
    materialLanguage: "dull wood latch",
    loop: false,
    provenance: AUDIO_ASSET_PROVENANCE,
    generatorVersion: AUDIO_ASSET_GENERATOR_VERSION,
  },
  {
    id: "tmr.audio.policy.enacted.v1",
    cueId: "policy.enacted",
    file: "policy-enacted.wav",
    duration: 0.48,
    category: "policy",
    materialLanguage: "paper + seal/stamp + low impact",
    loop: false,
    provenance: AUDIO_ASSET_PROVENANCE,
    generatorVersion: AUDIO_ASSET_GENERATOR_VERSION,
  },
  {
    id: "tmr.audio.institution.changed.v1",
    cueId: "institution.changed",
    file: "institution-changed.wav",
    duration: 0.44,
    category: "institution",
    materialLanguage: "paper movement + muted wood/metal",
    loop: false,
    provenance: AUDIO_ASSET_PROVENANCE,
    generatorVersion: AUDIO_ASSET_GENERATOR_VERSION,
  },
  {
    id: "tmr.audio.project.started.v1",
    cueId: "project.started",
    file: "project-started.wav",
    duration: 0.38,
    category: "project",
    materialLanguage: "wood/metal work impact",
    loop: false,
    provenance: AUDIO_ASSET_PROVENANCE,
    generatorVersion: AUDIO_ASSET_GENERATOR_VERSION,
  },
  {
    id: "tmr.audio.project.completed.v1",
    cueId: "project.completed",
    file: "project-completed.wav",
    duration: 0.56,
    category: "project",
    materialLanguage: "clear seal/stamp + low impact",
    loop: false,
    provenance: AUDIO_ASSET_PROVENANCE,
    generatorVersion: AUDIO_ASSET_GENERATOR_VERSION,
  },
  {
    id: "tmr.audio.crisis.rebellion.v1",
    cueId: "crisis.rebellion",
    file: "crisis-rebellion.wav",
    duration: 0.76,
    category: "crisis",
    materialLanguage: "low drum + rough filtered wind",
    loop: false,
    provenance: AUDIO_ASSET_PROVENANCE,
    generatorVersion: AUDIO_ASSET_GENERATOR_VERSION,
  },
  {
    id: "tmr.audio.crisis.coup.v1",
    cueId: "crisis.coup",
    file: "crisis-coup.wav",
    duration: 0.55,
    category: "crisis",
    materialLanguage: "dry low impact + muted metal",
    loop: false,
    provenance: AUDIO_ASSET_PROVENANCE,
    generatorVersion: AUDIO_ASSET_GENERATOR_VERSION,
  },
  {
    id: "tmr.audio.crisis.civil-war.v1",
    cueId: "crisis.civilWar",
    file: "crisis-civil-war.wav",
    duration: 0.9,
    category: "crisis",
    materialLanguage: "heavy low percussion + rough filtered wind",
    loop: false,
    provenance: AUDIO_ASSET_PROVENANCE,
    generatorVersion: AUDIO_ASSET_GENERATOR_VERSION,
  },
  {
    id: "tmr.audio.territory.changed.v1",
    cueId: "territory.controllerChanged",
    file: "territory-controller-changed.wav",
    duration: 0.28,
    category: "territory",
    materialLanguage: "muted territorial wood/metal",
    loop: false,
    provenance: AUDIO_ASSET_PROVENANCE,
    generatorVersion: AUDIO_ASSET_GENERATOR_VERSION,
  },
  {
    id: "tmr.audio.capital.threatened.v1",
    cueId: "capital.threatened",
    file: "capital-threatened.wav",
    duration: 0.52,
    category: "capital",
    materialLanguage: "restrained low warning resonance",
    loop: false,
    provenance: AUDIO_ASSET_PROVENANCE,
    generatorVersion: AUDIO_ASSET_GENERATOR_VERSION,
  },
  {
    id: "tmr.audio.border.closed.v1",
    cueId: "border.closed",
    file: "border-closed.wav",
    duration: 0.48,
    category: "border",
    materialLanguage: "wood/metal gate close",
    loop: false,
    provenance: AUDIO_ASSET_PROVENANCE,
    generatorVersion: AUDIO_ASSET_GENERATOR_VERSION,
  },
  {
    id: "tmr.audio.border.reopened.v1",
    cueId: "border.reopened",
    file: "border-reopened.wav",
    duration: 0.52,
    category: "border",
    materialLanguage: "wood/metal gate opening",
    loop: false,
    provenance: AUDIO_ASSET_PROVENANCE,
    generatorVersion: AUDIO_ASSET_GENERATOR_VERSION,
  },
  {
    id: "tmr.audio.chronicle.major-event.v1",
    cueId: "chronicle.majorEvent",
    file: "chronicle-major-event.wav",
    duration: 0.5,
    category: "chronicle",
    materialLanguage: "paper turn + restrained resonance",
    loop: false,
    provenance: AUDIO_ASSET_PROVENANCE,
    generatorVersion: AUDIO_ASSET_GENERATOR_VERSION,
  },
  {
    id: "tmr.audio.ambient.map.v1",
    cueId: "map.ambient",
    file: "map-ambient.wav",
    duration: 10,
    category: "ambience",
    materialLanguage: "wind + neutral environmental texture",
    loop: true,
    provenance: AUDIO_ASSET_PROVENANCE,
    generatorVersion: AUDIO_ASSET_GENERATOR_VERSION,
  },
  {
    id: "tmr.audio.ambient.capital.v1",
    cueId: "capital.ambient",
    file: "capital-ambient.wav",
    duration: 10,
    category: "ambience",
    materialLanguage: "administrative room tone + soft resonance",
    loop: true,
    provenance: AUDIO_ASSET_PROVENANCE,
    generatorVersion: AUDIO_ASSET_GENERATOR_VERSION,
  },
  {
    id: "tmr.audio.ambient.industrial.v1",
    cueId: "industrial.ambient",
    file: "industrial-ambient.wav",
    duration: 10,
    category: "ambience",
    materialLanguage: "low mechanical drone + muted machinery",
    loop: true,
    provenance: AUDIO_ASSET_PROVENANCE,
    generatorVersion: AUDIO_ASSET_GENERATOR_VERSION,
  },
] as const satisfies readonly AudioAssetManifestEntry[];

export function getAudioAssetManifestEntry(
  cueId: SoundCueId,
): AudioAssetManifestEntry | undefined {
  return TMR_AUDIO_ASSET_MANIFEST.find((entry) => entry.cueId === cueId);
}
