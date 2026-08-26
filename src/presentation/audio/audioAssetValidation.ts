import type { AudioAssetManifestEntry } from "./audioAssetManifest";

export interface PcmWavMetrics {
  readonly duration: number;
  readonly sampleRate: number;
  readonly channels: number;
  readonly bitsPerSample: number;
  readonly frameCount: number;
  readonly dataBytes: number;
  readonly peak: number;
  readonly rms: number;
  /** Maximum normalized difference between the first and last frame. */
  readonly seamDelta: number;
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.slice(offset, offset + length));
}

function invalid(message: string): never {
  throw new Error(`Invalid PCM WAV: ${message}`);
}

/** Parse and measure an uncompressed little-endian PCM WAV without browser APIs. */
export function parsePcmWav(bytes: Uint8Array): PcmWavMetrics {
  if (bytes.byteLength < 12) invalid("file is shorter than a RIFF header");
  if (ascii(bytes, 0, 4) !== "RIFF") invalid("missing RIFF signature");
  if (ascii(bytes, 8, 4) !== "WAVE") invalid("missing WAVE signature");

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const riffSize = view.getUint32(4, true);
  if (riffSize + 8 > bytes.byteLength) invalid("RIFF size exceeds file");

  let audioFormat: number | undefined;
  let channels: number | undefined;
  let sampleRate: number | undefined;
  let blockAlign: number | undefined;
  let bitsPerSample: number | undefined;
  let dataOffset: number | undefined;
  let dataBytes: number | undefined;

  let offset = 12;
  while (offset + 8 <= bytes.byteLength) {
    const chunkId = ascii(bytes, offset, 4);
    const chunkSize = view.getUint32(offset + 4, true);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkSize;
    if (chunkEnd > bytes.byteLength) invalid(`${chunkId} chunk exceeds file`);

    if (chunkId === "fmt ") {
      if (chunkSize < 16) invalid("fmt chunk is too short");
      audioFormat = view.getUint16(chunkStart, true);
      channels = view.getUint16(chunkStart + 2, true);
      sampleRate = view.getUint32(chunkStart + 4, true);
      blockAlign = view.getUint16(chunkStart + 12, true);
      bitsPerSample = view.getUint16(chunkStart + 14, true);
    } else if (chunkId === "data") {
      dataOffset = chunkStart;
      dataBytes = chunkSize;
    }

    offset = chunkEnd + (chunkSize % 2);
  }

  if (
    audioFormat === undefined ||
    channels === undefined ||
    sampleRate === undefined ||
    blockAlign === undefined ||
    bitsPerSample === undefined
  ) {
    invalid("missing fmt chunk");
  }
  if (dataOffset === undefined || dataBytes === undefined) {
    invalid("missing data chunk");
  }
  if (audioFormat !== 1) invalid(`audio format ${audioFormat} is not PCM`);
  if (channels < 1) invalid("channel count is zero");
  if (sampleRate < 1) invalid("sample rate is zero");
  if (bitsPerSample !== 16) {
    invalid(`bit depth ${bitsPerSample} is not signed PCM16`);
  }
  if (blockAlign !== channels * 2) invalid("unexpected block alignment");
  if (dataBytes % blockAlign !== 0) invalid("data is not frame aligned");

  const frameCount = dataBytes / blockAlign;
  if (frameCount < 2) invalid("data has fewer than two frames");

  let peak = 0;
  let sumSquares = 0;
  const firstFrame: number[] = [];
  const lastFrame: number[] = [];
  for (let frame = 0; frame < frameCount; frame += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const sampleOffset = dataOffset + (frame * channels + channel) * 2;
      const sample = view.getInt16(sampleOffset, true) / 32768;
      if (!Number.isFinite(sample)) invalid("non-finite PCM sample");
      if (frame === 0) firstFrame[channel] = sample;
      if (frame === frameCount - 1) lastFrame[channel] = sample;
      peak = Math.max(peak, Math.abs(sample));
      sumSquares += sample * sample;
    }
  }

  let seamDelta = 0;
  for (let channel = 0; channel < channels; channel += 1) {
    seamDelta = Math.max(
      seamDelta,
      Math.abs((firstFrame[channel] ?? 0) - (lastFrame[channel] ?? 0)),
    );
  }

  return {
    duration: frameCount / sampleRate,
    sampleRate,
    channels,
    bitsPerSample,
    frameCount,
    dataBytes,
    peak,
    rms: Math.sqrt(sumSquares / (frameCount * channels)),
    seamDelta,
  };
}

export function validatePcmWav(
  entry: AudioAssetManifestEntry,
  metrics: PcmWavMetrics,
): readonly string[] {
  const errors: string[] = [];
  const durationTolerance = 2 / metrics.sampleRate;

  if (Math.abs(metrics.duration - entry.duration) > durationTolerance) {
    errors.push(
      `duration ${metrics.duration.toFixed(5)}s != ${entry.duration.toFixed(5)}s`,
    );
  }
  if (
    entry.sampleRate !== undefined &&
    metrics.sampleRate !== entry.sampleRate
  ) {
    errors.push(`sampleRate ${metrics.sampleRate} != ${entry.sampleRate}`);
  }
  if (entry.channels !== undefined && metrics.channels !== entry.channels) {
    errors.push(`channels ${metrics.channels} != ${entry.channels}`);
  }
  if (metrics.frameCount < 2) errors.push("fewer than two frames");
  if (metrics.peak <= 0.005) errors.push("silence-only or near-silent");
  if (metrics.rms <= 0.0005) errors.push("RMS is below audible floor");
  if (metrics.peak > 0.95)
    errors.push(`peak ${metrics.peak.toFixed(5)} is clipped`);

  if (entry.loop) {
    if (metrics.duration < 8 || metrics.duration > 15) {
      errors.push("loop duration is outside the 8-15 second range");
    }
    if (metrics.seamDelta > 0.02) {
      errors.push(
        `loop seam delta ${metrics.seamDelta.toFixed(5)} is too large`,
      );
    }
  } else if (metrics.duration < 0.05) {
    errors.push("one-shot duration is below 50ms");
  }

  return errors;
}
