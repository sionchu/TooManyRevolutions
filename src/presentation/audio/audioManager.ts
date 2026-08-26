import {
  SOUND_CUE_REGISTRY,
  getSoundCueDefinition,
  type ProceduralAmbienceDefinition,
  type ProceduralSoundDefinition,
  type ProceduralToneDefinition,
  type SoundAssetDefinition,
  type SoundCueId,
  type SoundCueRegistry,
} from "./soundCueRegistry";

interface AudioParamLike {
  value: number;
  cancelScheduledValues?(startTime: number): void;
  setValueAtTime(value: number, startTime: number): AudioParamLike;
  linearRampToValueAtTime(value: number, endTime: number): AudioParamLike;
  exponentialRampToValueAtTime(value: number, endTime: number): AudioParamLike;
}

interface AudioNodeLike {
  connect(destination: AudioNodeLike): AudioNodeLike;
  disconnect?(): void;
}

interface AudioSourceLike extends AudioNodeLike {
  onended?: (() => void) | null;
  start(when?: number): void;
  stop?(when?: number): void;
}

interface OscillatorLike extends AudioSourceLike {
  type: ProceduralToneDefinition["waveform"];
  frequency: AudioParamLike;
  detune?: AudioParamLike;
}

interface GainNodeLike extends AudioNodeLike {
  gain: AudioParamLike;
}

interface BufferSourceLike extends AudioSourceLike {
  buffer: AudioBufferLike | null;
  loop: boolean;
}

export interface AudioBufferLike {
  readonly duration?: number;
}

export interface AudioContextLike {
  readonly currentTime: number;
  readonly state?: string;
  readonly destination: AudioNodeLike;
  createGain(): GainNodeLike;
  createOscillator(): OscillatorLike;
  createBufferSource?(): BufferSourceLike;
  resume(): Promise<void>;
  close?(): Promise<void>;
}

export type AudioContextFactory = () => AudioContextLike | null;

export interface AudioPreferenceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface AudioPreferences {
  readonly masterVolume: number;
  readonly sfxVolume: number;
  readonly ambienceVolume: number;
  readonly muted: boolean;
}

export interface AudioManagerOptions {
  readonly registry?: SoundCueRegistry;
  readonly storage?: AudioPreferenceStorage | null;
  readonly storageKey?: string;
  readonly audioContextFactory?: AudioContextFactory;
  /** Optional local loader. No network fetch is performed by the manager. */
  readonly assetLoader?: (
    asset: SoundAssetDefinition,
    context: AudioContextLike,
  ) => Promise<AudioBufferLike | null>;
  readonly defaultPreferences?: Partial<AudioPreferences>;
  readonly enabled?: boolean;
  readonly closeContextOnDispose?: boolean;
}

export type AudioAvailabilityStatus =
  "ready" | "disabled" | "unavailable" | "autoplay-blocked";

export interface AudioAvailabilityResult {
  readonly status: AudioAvailabilityStatus;
}

export type AudioPlaybackStatus =
  | "played"
  | "muted"
  | "disabled"
  | "unavailable"
  | "autoplay-blocked"
  | "missing-asset"
  | "unknown-cue"
  | "already-playing"
  | "not-ambience";

export interface AudioPlaybackResult {
  readonly cueId: SoundCueId;
  readonly status: AudioPlaybackStatus;
  readonly fallbackUsed?: boolean;
}

export interface AmbienceOptions {
  readonly fadeMs?: number;
  readonly replaceExisting?: boolean;
}

interface ActiveOneShot {
  readonly source: AudioSourceLike;
  readonly node: AudioNodeLike;
}

interface ActiveAmbience {
  readonly cueId: SoundCueId;
  readonly source: AudioSourceLike;
  readonly node: GainNodeLike;
  fadeTimer: ReturnType<typeof setTimeout> | null;
}

const AUDIO_PREFERENCES_KEY = "tmr.audio.preferences.v1";
const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = {
  masterVolume: 0.72,
  sfxVolume: 0.85,
  ambienceVolume: 0.4,
  muted: false,
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function defaultAudioContextFactory(): AudioContextLike | null {
  if (typeof window === "undefined") return null;
  const contextConstructor =
    window.AudioContext ??
    (
      window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext;
  if (contextConstructor === undefined) return null;
  try {
    return new contextConstructor() as unknown as AudioContextLike;
  } catch {
    return null;
  }
}

function defaultPreferenceStorage(): AudioPreferenceStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readStoredPreferences(
  storage: AudioPreferenceStorage | null,
  storageKey: string,
  defaults: AudioPreferences,
): AudioPreferences {
  if (storage === null) return { ...defaults };
  try {
    const raw = storage.getItem(storageKey);
    if (raw === null) return { ...defaults };
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return { ...defaults };
    return {
      masterVolume:
        typeof parsed.masterVolume === "number" &&
        Number.isFinite(parsed.masterVolume)
          ? clamp01(parsed.masterVolume)
          : defaults.masterVolume,
      sfxVolume:
        typeof parsed.sfxVolume === "number" &&
        Number.isFinite(parsed.sfxVolume)
          ? clamp01(parsed.sfxVolume)
          : defaults.sfxVolume,
      ambienceVolume:
        typeof parsed.ambienceVolume === "number" &&
        Number.isFinite(parsed.ambienceVolume)
          ? clamp01(parsed.ambienceVolume)
          : defaults.ambienceVolume,
      muted: typeof parsed.muted === "boolean" ? parsed.muted : defaults.muted,
    };
  } catch {
    return { ...defaults };
  }
}

function safeFadeMs(value: number | undefined): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(5000, value!)) : 350;
}

function hasProceduralRecipe(recipe: ProceduralSoundDefinition): boolean {
  return recipe.tones.length > 0 || recipe.ambience !== undefined;
}

function safeParamValue(
  param: AudioParamLike,
  value: number,
  time: number,
): void {
  const safeValue = Math.max(0, value);
  try {
    param.cancelScheduledValues?.(time);
    param.setValueAtTime(safeValue, time);
  } catch {
    try {
      param.value = safeValue;
    } catch {
      // A browser-specific audio node can reject writes after context close.
    }
  }
}

function safeLinearRamp(
  param: AudioParamLike,
  value: number,
  time: number,
): void {
  try {
    param.linearRampToValueAtTime(Math.max(0.0001, value), time);
  } catch {
    safeParamValue(param, value, time);
  }
}

function safeExponentialRamp(
  param: AudioParamLike,
  value: number,
  time: number,
): void {
  try {
    param.exponentialRampToValueAtTime(Math.max(0.0001, value), time);
  } catch {
    safeParamValue(param, value, time);
  }
}

function ambientTarget(recipe: ProceduralAmbienceDefinition): number {
  return clamp01(recipe.gain);
}

/**
 * Presentation-only WebAudio facade. It owns browser audio nodes and user
 * preferences, but has no timer, simulation writer, or gameplay scheduler.
 */
export class AudioManager {
  private readonly registry: SoundCueRegistry;
  private readonly storage: AudioPreferenceStorage | null;
  private readonly storageKey: string;
  private readonly contextFactory: AudioContextFactory;
  private readonly assetLoader: AudioManagerOptions["assetLoader"] | undefined;
  private readonly closeContextOnDispose: boolean;
  private preferences: AudioPreferences;
  private enabled: boolean;
  private disposed = false;
  private context: AudioContextLike | null = null;
  private masterGain: GainNodeLike | null = null;
  private sfxGain: GainNodeLike | null = null;
  private ambienceGain: GainNodeLike | null = null;
  private readonly activeOneShots = new Set<ActiveOneShot>();
  private readonly activeAmbience = new Map<SoundCueId, ActiveAmbience>();

  public constructor(options: AudioManagerOptions = {}) {
    this.registry = options.registry ?? SOUND_CUE_REGISTRY;
    this.storage =
      options.storage === undefined
        ? defaultPreferenceStorage()
        : options.storage;
    this.storageKey = options.storageKey ?? AUDIO_PREFERENCES_KEY;
    this.contextFactory =
      options.audioContextFactory ?? defaultAudioContextFactory;
    this.assetLoader = options.assetLoader;
    this.closeContextOnDispose = options.closeContextOnDispose ?? true;
    const defaultPreferences: AudioPreferences = {
      ...DEFAULT_AUDIO_PREFERENCES,
      ...options.defaultPreferences,
    };
    this.preferences = readStoredPreferences(
      this.storage,
      this.storageKey,
      defaultPreferences,
    );
    this.enabled = options.enabled ?? true;
  }

  public getPreferences(): AudioPreferences {
    return { ...this.preferences };
  }

  public isEnabled(): boolean {
    return this.enabled && !this.disposed;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.stopAmbience(undefined, 0);
  }

  public setMasterVolume(volume: number): void {
    this.updatePreferences({ masterVolume: clamp01(volume) });
    this.applyGainLevels();
  }

  public setSfxVolume(volume: number): void {
    this.updatePreferences({ sfxVolume: clamp01(volume) });
    this.applyGainLevels();
  }

  public setAmbienceVolume(volume: number): void {
    this.updatePreferences({ ambienceVolume: clamp01(volume) });
    this.applyGainLevels();
  }

  public setMuted(muted: boolean): void {
    this.updatePreferences({ muted });
    this.applyGainLevels();
  }

  /** Call this from a trusted click/tap before starting optional audio. */
  public async startFromUserGesture(): Promise<AudioAvailabilityResult> {
    if (!this.isEnabled()) return { status: "disabled" };
    const context = this.ensureAudioGraph();
    if (context === null) return { status: "unavailable" };
    return (await this.resumeContext(context))
      ? { status: "ready" }
      : { status: "autoplay-blocked" };
  }

  public async playCue(cueId: SoundCueId): Promise<AudioPlaybackResult> {
    const definition = getSoundCueDefinition(cueId, this.registry);
    if (definition === undefined) {
      return { cueId, status: "unknown-cue" };
    }
    if (!this.isEnabled()) return { cueId, status: "disabled" };
    if (this.preferences.muted || this.channelVolume(definition.channel) <= 0) {
      return { cueId, status: "muted" };
    }
    if (definition.channel === "ambience") {
      return this.startAmbience(cueId);
    }

    const context = this.ensureAudioGraph();
    if (context === null) return { cueId, status: "unavailable" };
    if (!(await this.resumeContext(context))) {
      return { cueId, status: "autoplay-blocked" };
    }

    const asset = await this.resolveAsset(definition.asset, context);
    if (
      asset.buffer !== null &&
      this.scheduleBufferOneShot(context, asset.buffer)
    ) {
      return { cueId, status: "played", fallbackUsed: asset.fallbackUsed };
    }
    if (
      hasProceduralRecipe(definition.asset.procedural) &&
      this.scheduleProceduralOneShot(
        context,
        definition.asset.procedural,
        this.sfxGain,
      )
    ) {
      return {
        cueId,
        status: "played",
        fallbackUsed: asset.fallbackUsed || definition.asset.kind === "file",
      };
    }
    return { cueId, status: "missing-asset" };
  }

  public async startAmbience(
    cueId: SoundCueId,
    options: AmbienceOptions = {},
  ): Promise<AudioPlaybackResult> {
    const definition = getSoundCueDefinition(cueId, this.registry);
    if (definition === undefined) return { cueId, status: "unknown-cue" };
    if (definition.channel !== "ambience") {
      return { cueId, status: "not-ambience" };
    }
    if (!this.isEnabled()) return { cueId, status: "disabled" };
    if (this.preferences.muted || this.channelVolume("ambience") <= 0) {
      return { cueId, status: "muted" };
    }
    if (this.activeAmbience.has(cueId)) {
      return { cueId, status: "already-playing" };
    }

    const context = this.ensureAudioGraph();
    if (context === null) return { cueId, status: "unavailable" };
    if (!(await this.resumeContext(context))) {
      return { cueId, status: "autoplay-blocked" };
    }

    if (options.replaceExisting ?? true) {
      for (const activeCueId of this.activeAmbience.keys()) {
        this.stopAmbience(activeCueId, safeFadeMs(options.fadeMs));
      }
    }

    const asset = await this.resolveAsset(definition.asset, context);
    const source =
      asset.buffer === null
        ? this.createProceduralAmbienceSource(
            context,
            definition.asset.procedural.ambience,
          )
        : this.createBufferAmbienceSource(context, asset.buffer);
    const fallbackSource =
      source === null && asset.buffer !== null
        ? this.createProceduralAmbienceSource(
            context,
            definition.asset.procedural.ambience,
          )
        : source;
    if (fallbackSource === null) {
      return { cueId, status: "missing-asset" };
    }

    let ambienceNode: GainNodeLike | null = null;
    try {
      const node = context.createGain();
      ambienceNode = node;
      const now = context.currentTime;
      const fadeMs = safeFadeMs(options.fadeMs);
      const recipe = definition.asset.procedural.ambience;
      const target = ambientTarget(
        recipe ?? {
          waveform: "sine",
          frequencyHz: 80,
          gain: 0.03,
        },
      );
      safeParamValue(node.gain, 0.0001, now);
      safeLinearRamp(node.gain, target, now + fadeMs / 1000);
      node.connect(this.ambienceGain!);
      fallbackSource.connect(node);
      fallbackSource.start(now);
      const active: ActiveAmbience = {
        cueId,
        source: fallbackSource,
        node,
        fadeTimer: null,
      };
      fallbackSource.onended = () => this.cleanupAmbience(active);
      this.activeAmbience.set(cueId, active);
      return {
        cueId,
        status: "played",
        fallbackUsed:
          asset.fallbackUsed ||
          (asset.buffer !== null && source === null) ||
          definition.asset.kind === "file",
      };
    } catch {
      this.safeStopSource(fallbackSource);
      fallbackSource.disconnect?.();
      ambienceNode?.disconnect?.();
      return { cueId, status: "unavailable" };
    }
  }

  public stopAmbience(cueId?: SoundCueId, fadeMs = 350): void {
    const targets =
      cueId === undefined
        ? [...this.activeAmbience.values()]
        : [this.activeAmbience.get(cueId)].filter(
            (active): active is ActiveAmbience => active !== undefined,
          );
    for (const active of targets) {
      if (active.fadeTimer !== null) clearTimeout(active.fadeTimer);
      const context = this.context;
      const now = context?.currentTime ?? 0;
      const duration = safeFadeMs(fadeMs);
      safeParamValue(active.node.gain, active.node.gain.value, now);
      safeLinearRamp(active.node.gain, 0.0001, now + duration / 1000);
      if (duration === 0) {
        this.cleanupAmbience(active);
      } else {
        active.fadeTimer = setTimeout(
          () => this.cleanupAmbience(active),
          duration + 40,
        );
      }
    }
  }

  /** Stop all owned nodes and release the optional context. */
  public dispose(): void {
    if (this.disposed) return;
    this.stopAmbience(undefined, 0);
    for (const active of [...this.activeOneShots]) {
      this.safeStopSource(active.source);
      this.cleanupOneShot(active);
    }
    this.activeOneShots.clear();
    for (const node of [this.sfxGain, this.ambienceGain, this.masterGain]) {
      try {
        node?.disconnect?.();
      } catch {
        // Cleanup remains best-effort across browser implementations.
      }
    }
    const context = this.context;
    this.context = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.ambienceGain = null;
    this.disposed = true;
    if (this.closeContextOnDispose && context?.close !== undefined) {
      try {
        const closing = context.close();
        void closing.catch(() => undefined);
      } catch {
        // A closed context is already fully disposed.
      }
    }
  }

  private updatePreferences(changes: Partial<AudioPreferences>): void {
    this.preferences = { ...this.preferences, ...changes };
    if (this.storage === null) return;
    try {
      this.storage.setItem(this.storageKey, JSON.stringify(this.preferences));
    } catch {
      // Private browsing and quota errors must not affect gameplay/UI flow.
    }
  }

  private ensureAudioGraph(): AudioContextLike | null {
    if (this.disposed) return null;
    if (
      this.context !== null &&
      this.masterGain !== null &&
      this.sfxGain !== null &&
      this.ambienceGain !== null
    ) {
      return this.context;
    }
    let context: AudioContextLike | null;
    try {
      context = this.contextFactory();
    } catch {
      context = null;
    }
    if (context === null || context.state === "closed") return null;

    try {
      const masterGain = context.createGain();
      const sfxGain = context.createGain();
      const ambienceGain = context.createGain();
      sfxGain.connect(masterGain);
      ambienceGain.connect(masterGain);
      masterGain.connect(context.destination);
      this.context = context;
      this.masterGain = masterGain;
      this.sfxGain = sfxGain;
      this.ambienceGain = ambienceGain;
      this.applyGainLevels();
      return context;
    } catch {
      return null;
    }
  }

  private async resumeContext(context: AudioContextLike): Promise<boolean> {
    if (context.state === "closed") return false;
    try {
      if (context.state !== "running") await context.resume();
      return context.state !== "closed";
    } catch {
      return false;
    }
  }

  private channelVolume(channel: "ui" | "sfx" | "ambience"): number {
    if (this.preferences.muted) return 0;
    const channelVolume =
      channel === "ambience"
        ? this.preferences.ambienceVolume
        : this.preferences.sfxVolume;
    return this.preferences.masterVolume * channelVolume;
  }

  private applyGainLevels(): void {
    if (
      this.context === null ||
      this.masterGain === null ||
      this.sfxGain === null ||
      this.ambienceGain === null
    ) {
      return;
    }
    const now = this.context.currentTime;
    safeParamValue(
      this.masterGain.gain,
      this.preferences.muted ? 0 : this.preferences.masterVolume,
      now,
    );
    safeParamValue(this.sfxGain.gain, this.preferences.sfxVolume, now);
    safeParamValue(
      this.ambienceGain.gain,
      this.preferences.ambienceVolume,
      now,
    );
  }

  private async resolveAsset(
    asset: SoundAssetDefinition,
    context: AudioContextLike,
  ): Promise<{
    readonly buffer: AudioBufferLike | null;
    readonly fallbackUsed: boolean;
  }> {
    if (
      asset.kind === "file" &&
      asset.url !== undefined &&
      this.assetLoader !== undefined
    ) {
      try {
        const buffer = await this.assetLoader(asset, context);
        if (buffer !== null) return { buffer, fallbackUsed: false };
      } catch {
        // Optional local assets fall through to the authored procedural recipe.
      }
    }
    return { buffer: null, fallbackUsed: asset.kind === "file" };
  }

  private scheduleBufferOneShot(
    context: AudioContextLike,
    buffer: AudioBufferLike,
  ): boolean {
    if (this.sfxGain === null || context.createBufferSource === undefined) {
      return false;
    }
    let active: ActiveOneShot | null = null;
    try {
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = false;
      source.connect(this.sfxGain);
      const activePlayback: ActiveOneShot = { source, node: source };
      active = activePlayback;
      source.onended = () => this.cleanupOneShot(activePlayback);
      this.activeOneShots.add(activePlayback);
      source.start(context.currentTime);
      return true;
    } catch {
      if (active !== null) {
        this.cleanupOneShot(active);
      }
      return false;
    }
  }

  private scheduleProceduralOneShot(
    context: AudioContextLike,
    recipe: ProceduralSoundDefinition,
    channelGain: GainNodeLike | null,
  ): boolean {
    if (channelGain === null) return false;
    let scheduled = false;
    for (const tone of recipe.tones) {
      let active: ActiveOneShot | null = null;
      try {
        const oscillator = context.createOscillator();
        const node = context.createGain();
        const start = context.currentTime;
        const duration = Math.max(0.02, tone.durationMs / 1000);
        const attack = Math.min(
          duration / 2,
          Math.max(0.005, (tone.attackMs ?? 12) / 1000),
        );
        const release = Math.min(
          duration / 2,
          Math.max(0.01, (tone.releaseMs ?? 45) / 1000),
        );
        oscillator.type = tone.waveform;
        oscillator.frequency.setValueAtTime(
          Math.max(1, tone.frequencyHz),
          start,
        );
        if (tone.endFrequencyHz !== undefined) {
          try {
            oscillator.frequency.exponentialRampToValueAtTime(
              Math.max(1, tone.endFrequencyHz),
              start + duration,
            );
          } catch {
            oscillator.frequency.setValueAtTime(
              Math.max(1, tone.endFrequencyHz),
              start + duration,
            );
          }
        }
        safeParamValue(node.gain, 0.0001, start);
        safeLinearRamp(node.gain, clamp01(tone.gain), start + attack);
        safeExponentialRamp(
          node.gain,
          0.0001,
          start + Math.max(attack, duration - release),
        );
        oscillator.connect(node).connect(channelGain);
        const activePlayback: ActiveOneShot = {
          source: oscillator,
          node,
        };
        active = activePlayback;
        oscillator.onended = () => this.cleanupOneShot(activePlayback);
        this.activeOneShots.add(activePlayback);
        oscillator.start(start);
        oscillator.stop?.(start + duration + 0.02);
        scheduled = true;
      } catch {
        if (active !== null) {
          this.cleanupOneShot(active);
        }
        // One unavailable oscillator must not prevent other tones/fallbacks.
      }
    }
    return scheduled;
  }

  private createBufferAmbienceSource(
    context: AudioContextLike,
    buffer: AudioBufferLike,
  ): BufferSourceLike | null {
    if (context.createBufferSource === undefined) return null;
    try {
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      return source;
    } catch {
      return null;
    }
  }

  private createProceduralAmbienceSource(
    context: AudioContextLike,
    recipe: ProceduralAmbienceDefinition | undefined,
  ): OscillatorLike | null {
    if (recipe === undefined) return null;
    try {
      const source = context.createOscillator();
      source.type = recipe.waveform;
      source.frequency.setValueAtTime(
        Math.max(1, recipe.frequencyHz),
        context.currentTime,
      );
      if (recipe.detuneCents !== undefined && source.detune !== undefined) {
        source.detune.setValueAtTime(recipe.detuneCents, context.currentTime);
      }
      return source;
    } catch {
      return null;
    }
  }

  private safeStopSource(source: AudioSourceLike): void {
    try {
      source.stop?.();
    } catch {
      // A source that has already ended is safely considered stopped.
    }
  }

  private cleanupOneShot(active: ActiveOneShot): void {
    this.activeOneShots.delete(active);
    try {
      active.source.disconnect?.();
      active.node.disconnect?.();
    } catch {
      // Cleanup is idempotent and best-effort.
    }
  }

  private cleanupAmbience(active: ActiveAmbience): void {
    if (active.fadeTimer !== null) {
      clearTimeout(active.fadeTimer);
      active.fadeTimer = null;
    }
    if (this.activeAmbience.get(active.cueId) === active) {
      this.activeAmbience.delete(active.cueId);
    }
    this.safeStopSource(active.source);
    try {
      active.source.disconnect?.();
      active.node.disconnect?.();
    } catch {
      // Cleanup is best-effort across browser implementations.
    }
  }
}
