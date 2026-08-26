import { describe, expect, it } from "vitest";

import {
  createGameEvent,
  type GameEvent,
  type GameEventType,
} from "../sim/events/event";
import type { JsonValue } from "../sim/core/serialization";
import { AudioManager, type AudioContextLike } from "./audio/audioManager";
import {
  SOUND_CUE_IDS,
  SOUND_CUE_REGISTRY,
  createOptionalFileAsset,
} from "./audio/soundCueRegistry";
import { resolveAmbientCue, resolveSoundCues } from "./audio/soundCueResolver";

function event(
  tick: number,
  sequence: number,
  type: GameEventType,
  payload: Readonly<Record<string, JsonValue>> = {},
  causeIds: readonly GameEvent["id"][] = [],
) {
  return createGameEvent({
    tick,
    sequence,
    type,
    payload,
    causeIds,
    visibility: "world",
  });
}

class FakeParam {
  public value = 0;

  public cancelScheduledValues(): void {}

  public setValueAtTime(value: number): this {
    this.value = value;
    return this;
  }

  public linearRampToValueAtTime(value: number): this {
    this.value = value;
    return this;
  }

  public exponentialRampToValueAtTime(value: number): this {
    this.value = value;
    return this;
  }
}

class FakeNode {
  public readonly connections: FakeNode[] = [];

  public connect(destination: FakeNode): FakeNode {
    this.connections.push(destination);
    return destination;
  }

  public disconnect(): void {
    this.connections.length = 0;
  }
}

class FakeGain extends FakeNode {
  public readonly gain = new FakeParam();
}

class FakeOscillator extends FakeNode {
  public type: "sine" | "triangle" | "sawtooth" | "square" = "sine";
  public readonly frequency = new FakeParam();
  public readonly detune = new FakeParam();
  public onended: (() => void) | null = null;
  public started = 0;
  public stopped = 0;

  public start(): void {
    this.started += 1;
  }

  public stop(): void {
    this.stopped += 1;
    this.onended?.();
  }
}

class FakeBufferSource extends FakeOscillator {
  public buffer: { readonly duration?: number } | null = null;
  public loop = false;
}

class FakeAudioContext {
  public currentTime = 0;
  public state = "running";
  public readonly destination = new FakeNode();
  public readonly oscillators: FakeOscillator[] = [];
  public readonly gains: FakeGain[] = [];

  public createGain(): FakeGain {
    const node = new FakeGain();
    this.gains.push(node);
    return node;
  }

  public createOscillator(): FakeOscillator {
    const node = new FakeOscillator();
    this.oscillators.push(node);
    return node;
  }

  public createBufferSource(): FakeBufferSource {
    const node = new FakeBufferSource();
    this.oscillators.push(node);
    return node;
  }

  public async resume(): Promise<void> {
    this.state = "running";
  }

  public async close(): Promise<void> {
    this.state = "closed";
  }
}

class MemoryStorage {
  private readonly values = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("presentation audio system", () => {
  it("keeps a stable, provenance-carrying cue registry", () => {
    expect(Object.keys(SOUND_CUE_REGISTRY).sort()).toEqual(
      [...SOUND_CUE_IDS].sort(),
    );
    expect(
      SOUND_CUE_IDS.every(
        (cueId) =>
          SOUND_CUE_REGISTRY[cueId]?.asset.provenance.length > 0 &&
          SOUND_CUE_REGISTRY[cueId]?.asset.id.startsWith("tmr.audio."),
      ),
    ).toBe(true);
    expect(resolveAmbientCue("capital")).toBe("capital.ambient");
  });

  it("lets a rebellion outrank repeated territory-control changes", () => {
    const rebellion = event(12, 0, "REBELLION_STARTED", {
      conflictId: "conflict.rebellion.1",
      affectedRegionIds: ["region.frontier"],
    });
    const firstControl = event(12, 1, "LAND_HEX_CONTROL_CHANGED", {
      conflictId: "conflict.rebellion.1",
      landHexId: "hex.frontier.1",
      regionId: "region.frontier",
    });
    const secondControl = event(12, 2, "LAND_HEX_CONTROL_CHANGED", {
      conflictId: "conflict.rebellion.1",
      landHexId: "hex.frontier.2",
      regionId: "region.frontier",
    });

    const resolution = resolveSoundCues({
      events: [secondControl, firstControl, rebellion],
    });

    expect(resolution.cues.map((cue) => cue.cueId)).toEqual([
      "crisis.rebellion",
    ]);
    expect(resolution.suppressedDedupeKeys).toContain(
      "territory.controllerChanged:event:12:1:LAND_HEX_CONTROL_CHANGED",
    );
    expect(resolution.suppressedDedupeKeys).toContain(
      "territory.controllerChanged:event:12:2:LAND_HEX_CONTROL_CHANGED",
    );
  });

  it("keeps routine ideology and economy churn silent", () => {
    const resolution = resolveSoundCues({
      events: [
        event(3, 0, "IDEOLOGY_SUPPORT_CHANGED", {
          regionId: "region.capital",
          support: 0.41,
        }),
        event(3, 1, "IDEOLOGY_RADICALISM_CHANGED", {
          regionId: "region.capital",
          radicalism: 0.2,
        }),
        event(3, 2, "TREASURY_CHANGED", { countryId: "country.arken" }),
        event(3, 3, "NATIONAL_PRODUCTION_CHANGED", {
          countryId: "country.arken",
        }),
      ],
    });

    expect(resolution.cues).toEqual([]);
  });

  it("emits one project-completion cue and is idempotent on replay", () => {
    const completion = event(20, 0, "INTERVENTION_COMPLETED", {
      commitmentId: "commitment.project.1",
      interventionId: "intervention.material-relief",
      countryId: "country.arken",
    });
    const derivedRule = event(
      20,
      1,
      "INSTITUTION_RULE_CHANGED",
      {
        commitmentId: "commitment.project.1",
        rule: "pressFreedom",
      },
      [completion.id],
    );

    const first = resolveSoundCues({ events: [completion, derivedRule] });
    const replay = resolveSoundCues(
      { events: [completion, derivedRule] },
      first.nextState,
    );

    expect(first.cues.map((cue) => cue.cueId)).toEqual(["project.completed"]);
    expect(first.cues[0]?.sourceEventIds).toContain(completion.id);
    expect(replay.cues).toEqual([]);
  });

  it("applies deterministic cooldown while keeping later territory changes audible", () => {
    const first = event(10, 0, "LAND_HEX_CONTROL_CHANGED", {
      landHexId: "hex.1",
      regionId: "region.frontier",
    });
    const duringCooldown = event(13, 1, "LAND_HEX_CONTROL_CHANGED", {
      landHexId: "hex.2",
      regionId: "region.frontier",
    });
    const afterCooldown = event(14, 2, "LAND_HEX_CONTROL_CHANGED", {
      landHexId: "hex.3",
      regionId: "region.frontier",
    });

    const firstResolution = resolveSoundCues({ events: [first] });
    const secondResolution = resolveSoundCues(
      { events: [duringCooldown] },
      firstResolution.nextState,
    );
    const thirdResolution = resolveSoundCues(
      { events: [afterCooldown] },
      secondResolution.nextState,
    );

    expect(firstResolution.cues).toHaveLength(1);
    expect(secondResolution.cues).toEqual([]);
    expect(thirdResolution.cues.map((cue) => cue.cueId)).toEqual([
      "territory.controllerChanged",
    ]);
  });

  it("persists preferences and makes disabled or muted playback a no-op", async () => {
    const storage = new MemoryStorage();
    const disabled = new AudioManager({
      enabled: false,
      storage,
      audioContextFactory: () => null,
    });
    await expect(disabled.playCue("ui.confirm")).resolves.toMatchObject({
      status: "disabled",
    });
    disabled.dispose();

    const muted = new AudioManager({
      storage,
      defaultPreferences: { muted: true },
      audioContextFactory: () => null,
    });
    await expect(muted.playCue("ui.confirm")).resolves.toMatchObject({
      status: "muted",
    });
    muted.setMasterVolume(0.31);
    muted.setSfxVolume(0.44);
    muted.setAmbienceVolume(0.27);
    muted.setMuted(false);

    const restored = new AudioManager({
      storage,
      audioContextFactory: () => null,
    });
    expect(restored.getPreferences()).toEqual({
      masterVolume: 0.31,
      sfxVolume: 0.44,
      ambienceVolume: 0.27,
      muted: false,
    });
  });

  it("falls back to the authored procedural recipe when an optional file is missing", async () => {
    const context = new FakeAudioContext();
    const baseCue = SOUND_CUE_REGISTRY["ui.select"]!;
    const registry = {
      ...SOUND_CUE_REGISTRY,
      "ui.select": {
        ...baseCue,
        asset: createOptionalFileAsset({
          id: "tmr.audio.ui.select.optional-file.v1",
          url: "/audio/missing-select.ogg",
          provenance: "Optional local placeholder slot; no bundled file.",
          fallback: baseCue.asset.procedural,
        }),
      },
    };
    const manager = new AudioManager({
      registry,
      audioContextFactory: () => context as unknown as AudioContextLike,
      assetLoader: async () => null,
    });

    await expect(manager.playCue("ui.select")).resolves.toMatchObject({
      status: "played",
      fallbackUsed: true,
    });
    expect(context.oscillators.length).toBeGreaterThan(0);
    manager.dispose();
  });

  it("uses a generated local file before the procedural fallback", async () => {
    const context = new FakeAudioContext();
    const loadedUrls: string[] = [];
    const manager = new AudioManager({
      audioContextFactory: () => context as unknown as AudioContextLike,
      assetLoader: async (asset) => {
        loadedUrls.push(asset.url ?? "");
        return { duration: 0.24 };
      },
    });

    await expect(manager.playCue("ui.select")).resolves.toMatchObject({
      status: "played",
      fallbackUsed: false,
    });
    expect(loadedUrls).toEqual(["/assets/tmr/audio/ui-select.wav"]);
    expect(context.oscillators[0]).toBeInstanceOf(FakeBufferSource);
    manager.dispose();
  });

  it("keeps a decoded ambience file marked as primary playback", async () => {
    const context = new FakeAudioContext();
    const loadedUrls: string[] = [];
    const manager = new AudioManager({
      audioContextFactory: () => context as unknown as AudioContextLike,
      assetLoader: async (asset) => {
        loadedUrls.push(asset.url ?? "");
        return { duration: 10 };
      },
    });

    await expect(
      manager.startAmbience("map.ambient", { fadeMs: 0 }),
    ).resolves.toMatchObject({
      status: "played",
      fallbackUsed: false,
    });
    expect(loadedUrls).toEqual(["/assets/tmr/audio/map-ambient.wav"]);
    expect(context.oscillators[0]).toBeInstanceOf(FakeBufferSource);
    manager.stopAmbience("map.ambient", 0);
    manager.dispose();
  });

  it("starts, fades, and cleans up ambience without throwing", async () => {
    const context = new FakeAudioContext();
    const manager = new AudioManager({
      audioContextFactory: () => context as unknown as AudioContextLike,
    });

    await expect(manager.startFromUserGesture()).resolves.toEqual({
      status: "ready",
    });
    await expect(
      manager.startAmbience("map.ambient", { fadeMs: 0 }),
    ).resolves.toMatchObject({
      status: "played",
    });
    await expect(manager.startAmbience("map.ambient")).resolves.toMatchObject({
      status: "already-playing",
    });
    manager.stopAmbience("map.ambient", 0);
    expect(() => manager.dispose()).not.toThrow();
  });
});
