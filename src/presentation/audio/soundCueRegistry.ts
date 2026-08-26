export const SOUND_CUE_IDS = [
  "ui.select",
  "ui.confirm",
  "ui.blocked",
  "policy.enacted",
  "institution.changed",
  "project.started",
  "project.completed",
  "crisis.rebellion",
  "crisis.coup",
  "crisis.civilWar",
  "territory.controllerChanged",
  "capital.threatened",
  "border.closed",
  "border.reopened",
  "chronicle.majorEvent",
  "map.ambient",
  "capital.ambient",
  "industrial.ambient",
] as const;

export type SoundCueId = (typeof SOUND_CUE_IDS)[number];
export type SoundCueChannel = "ui" | "sfx" | "ambience";
export type ProceduralWaveform = "sine" | "triangle" | "sawtooth" | "square";

export interface ProceduralToneDefinition {
  readonly waveform: ProceduralWaveform;
  readonly frequencyHz: number;
  readonly endFrequencyHz?: number;
  readonly durationMs: number;
  readonly gain: number;
  readonly attackMs?: number;
  readonly releaseMs?: number;
}

export interface ProceduralAmbienceDefinition {
  readonly waveform: ProceduralWaveform;
  readonly frequencyHz: number;
  readonly detuneCents?: number;
  readonly gain: number;
}

export interface ProceduralSoundDefinition {
  readonly tones: readonly ProceduralToneDefinition[];
  readonly ambience?: ProceduralAmbienceDefinition;
}

export interface SoundAssetDefinition {
  /** Stable asset identity even when the implementation is procedural. */
  readonly id: string;
  readonly kind: "procedural" | "file";
  readonly optional: boolean;
  /** Human-readable provenance kept next to the asset identity. */
  readonly provenance: string;
  /** Optional local asset URL. The manager never fetches one by default. */
  readonly url?: string;
  /** Procedural fallback, also used as the canonical placeholder recipe. */
  readonly procedural: ProceduralSoundDefinition;
}

export interface SoundCueDefinition {
  readonly id: SoundCueId;
  readonly channel: SoundCueChannel;
  readonly priority: number;
  /** Number of simulation ticks that must pass before the same cue can play. */
  readonly cooldownTicks: number;
  readonly label: string;
  readonly asset: SoundAssetDefinition;
}

export type SoundCueRegistry = Readonly<
  Partial<Record<SoundCueId, SoundCueDefinition>>
>;

function tone(
  waveform: ProceduralWaveform,
  frequencyHz: number,
  durationMs: number,
  gain: number,
  options: Pick<
    ProceduralToneDefinition,
    "endFrequencyHz" | "attackMs" | "releaseMs"
  > = {},
): ProceduralToneDefinition {
  return {
    waveform,
    frequencyHz,
    durationMs,
    gain,
    ...options,
  };
}

function proceduralAsset(
  id: string,
  recipe: ProceduralSoundDefinition,
): SoundAssetDefinition {
  return {
    id,
    kind: "procedural",
    optional: true,
    provenance:
      "TooManyRevolutions project-authored WebAudio placeholder; no external audio asset.",
    procedural: recipe,
  };
}

const uiSelect = proceduralAsset("tmr.audio.ui.select.v1", {
  tones: [tone("triangle", 420, 75, 0.16, { endFrequencyHz: 300 })],
});

const uiConfirm = proceduralAsset("tmr.audio.ui.confirm.v1", {
  tones: [
    tone("triangle", 330, 115, 0.13, { endFrequencyHz: 390 }),
    tone("sine", 520, 150, 0.1, { attackMs: 18 }),
  ],
});

const uiBlocked = proceduralAsset("tmr.audio.ui.blocked.v1", {
  tones: [tone("sawtooth", 135, 190, 0.12, { endFrequencyHz: 78 })],
});

const policyEnacted = proceduralAsset("tmr.audio.policy.enacted.v1", {
  tones: [
    tone("triangle", 190, 130, 0.13, { endFrequencyHz: 245 }),
    tone("sine", 390, 180, 0.09, { attackMs: 20 }),
  ],
});

const institutionChanged = proceduralAsset("tmr.audio.institution.changed.v1", {
  tones: [tone("triangle", 255, 170, 0.12, { endFrequencyHz: 330 })],
});

const projectStarted = proceduralAsset("tmr.audio.project.started.v1", {
  tones: [tone("triangle", 155, 155, 0.11, { endFrequencyHz: 205 })],
});

const projectCompleted = proceduralAsset("tmr.audio.project.completed.v1", {
  tones: [
    tone("triangle", 205, 145, 0.12, { endFrequencyHz: 275 }),
    tone("sine", 410, 210, 0.1, { attackMs: 22 }),
  ],
});

const rebellion = proceduralAsset("tmr.audio.crisis.rebellion.v1", {
  tones: [
    tone("sawtooth", 150, 280, 0.13, { endFrequencyHz: 78 }),
    tone("triangle", 92, 340, 0.08, { endFrequencyHz: 62 }),
  ],
});

const coup = proceduralAsset("tmr.audio.crisis.coup.v1", {
  tones: [
    tone("sawtooth", 185, 245, 0.12, { endFrequencyHz: 105 }),
    tone("triangle", 245, 175, 0.08, { endFrequencyHz: 170 }),
  ],
});

const civilWar = proceduralAsset("tmr.audio.crisis.civil-war.v1", {
  tones: [
    tone("sawtooth", 125, 320, 0.14, { endFrequencyHz: 64 }),
    tone("triangle", 205, 230, 0.07, { endFrequencyHz: 120 }),
  ],
});

const territoryChanged = proceduralAsset("tmr.audio.territory.changed.v1", {
  tones: [tone("triangle", 175, 120, 0.1, { endFrequencyHz: 125 })],
});

const capitalThreatened = proceduralAsset("tmr.audio.capital.threatened.v1", {
  tones: [tone("sawtooth", 170, 235, 0.1, { endFrequencyHz: 100 })],
});

const borderClosed = proceduralAsset("tmr.audio.border.closed.v1", {
  tones: [tone("triangle", 230, 135, 0.1, { endFrequencyHz: 145 })],
});

const borderReopened = proceduralAsset("tmr.audio.border.reopened.v1", {
  tones: [tone("triangle", 165, 155, 0.1, { endFrequencyHz: 245 })],
});

const majorEvent = proceduralAsset("tmr.audio.chronicle.major-event.v1", {
  tones: [
    tone("triangle", 275, 145, 0.1, { endFrequencyHz: 335 }),
    tone("sine", 505, 190, 0.07, { attackMs: 22 }),
  ],
});

const mapAmbient = proceduralAsset("tmr.audio.ambient.map.v1", {
  tones: [],
  ambience: {
    waveform: "sine",
    frequencyHz: 82,
    detuneCents: -4,
    gain: 0.045,
  },
});

const capitalAmbient = proceduralAsset("tmr.audio.ambient.capital.v1", {
  tones: [],
  ambience: {
    waveform: "sine",
    frequencyHz: 118,
    detuneCents: 3,
    gain: 0.038,
  },
});

const industrialAmbient = proceduralAsset("tmr.audio.ambient.industrial.v1", {
  tones: [],
  ambience: {
    waveform: "triangle",
    frequencyHz: 66,
    detuneCents: 7,
    gain: 0.05,
  },
});

function definition(
  id: SoundCueId,
  channel: SoundCueChannel,
  priority: number,
  cooldownTicks: number,
  label: string,
  asset: SoundAssetDefinition,
): SoundCueDefinition {
  return { id, channel, priority, cooldownTicks, label, asset };
}

/** Stable cue IDs and restrained, project-authored placeholder sound recipes. */
export const SOUND_CUE_REGISTRY = {
  "ui.select": definition("ui.select", "ui", 10, 0, "선택", uiSelect),
  "ui.confirm": definition("ui.confirm", "ui", 15, 0, "확정", uiConfirm),
  "ui.blocked": definition("ui.blocked", "ui", 20, 0, "차단", uiBlocked),
  "policy.enacted": definition(
    "policy.enacted",
    "sfx",
    70,
    1,
    "정책 제정",
    policyEnacted,
  ),
  "institution.changed": definition(
    "institution.changed",
    "sfx",
    68,
    1,
    "제도 변경",
    institutionChanged,
  ),
  "project.started": definition(
    "project.started",
    "sfx",
    58,
    0,
    "사업 착수",
    projectStarted,
  ),
  "project.completed": definition(
    "project.completed",
    "sfx",
    76,
    0,
    "사업 완료",
    projectCompleted,
  ),
  "crisis.rebellion": definition(
    "crisis.rebellion",
    "sfx",
    100,
    7,
    "반란 발발",
    rebellion,
  ),
  "crisis.coup": definition("crisis.coup", "sfx", 100, 7, "쿠데타 시도", coup),
  "crisis.civilWar": definition(
    "crisis.civilWar",
    "sfx",
    100,
    7,
    "내전 발발",
    civilWar,
  ),
  "territory.controllerChanged": definition(
    "territory.controllerChanged",
    "sfx",
    35,
    3,
    "영토 통제 변경",
    territoryChanged,
  ),
  "capital.threatened": definition(
    "capital.threatened",
    "sfx",
    92,
    5,
    "수도 위협",
    capitalThreatened,
  ),
  "border.closed": definition(
    "border.closed",
    "sfx",
    52,
    2,
    "국경 폐쇄",
    borderClosed,
  ),
  "border.reopened": definition(
    "border.reopened",
    "sfx",
    48,
    2,
    "국경 재개",
    borderReopened,
  ),
  "chronicle.majorEvent": definition(
    "chronicle.majorEvent",
    "sfx",
    64,
    1,
    "주요 연대기",
    majorEvent,
  ),
  "map.ambient": definition(
    "map.ambient",
    "ambience",
    0,
    0,
    "지도 분위기",
    mapAmbient,
  ),
  "capital.ambient": definition(
    "capital.ambient",
    "ambience",
    0,
    0,
    "수도 분위기",
    capitalAmbient,
  ),
  "industrial.ambient": definition(
    "industrial.ambient",
    "ambience",
    0,
    0,
    "산업 지대 분위기",
    industrialAmbient,
  ),
} as const satisfies Readonly<Record<SoundCueId, SoundCueDefinition>>;

export function getSoundCueDefinition(
  cueId: string,
  registry: SoundCueRegistry = SOUND_CUE_REGISTRY,
): SoundCueDefinition | undefined {
  return registry[cueId as SoundCueId];
}

export function createOptionalFileAsset(input: {
  readonly id: string;
  readonly url: string;
  readonly provenance: string;
  readonly fallback: ProceduralSoundDefinition;
}): SoundAssetDefinition {
  return {
    id: input.id,
    kind: "file",
    optional: true,
    url: input.url,
    provenance: input.provenance,
    procedural: input.fallback,
  };
}
