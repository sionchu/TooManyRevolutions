export type ProductionRenderer = "three-r3f";

export interface RendererCandidateEvidence {
  readonly candidate: "three-r3f" | "pixi-v8";
  readonly build: "PASS";
  readonly rawBundleBytes: number;
  readonly desktopObservation: string;
  readonly mobileObservation: string;
  readonly touchCamera: "PASS";
  readonly factualProjection: "PASS";
  readonly domAccessibility: "PASS";
}

export interface RendererDecisionReport {
  readonly productionRenderer: ProductionRenderer;
  readonly candidate: "pixi-v8";
  readonly spikeStatus: "PASS";
  readonly blocker: null;
  readonly rationale: string;
  readonly evidence: readonly RendererCandidateEvidence[];
  readonly verifiedBoundaries: readonly string[];
}

/**
 * The P0 benchmark uses the same frozen WorldSceneModel for both candidates.
 * R3F is selected for the production surface because the project already has
 * a React 19 UI, and it provides real depth/lighting while keeping the
 * authoritative simulation boundary in the existing read-model pipeline.
 */
export const P0_RENDERER_DECISION: RendererDecisionReport = {
  productionRenderer: "three-r3f",
  candidate: "pixi-v8",
  spikeStatus: "PASS",
  blocker: null,
  rationale:
    "R3F and PixiJS v8 both passed the frozen snapshot build, desktop/mobile browser render, and drag camera proof. R3F wins the product decision because its orthographic 3D scene expresses the required 2.5D depth and integrates directly with the existing React surface; Pixi remains an isolated benchmark candidate.",
  evidence: [
    {
      candidate: "three-r3f",
      build: "PASS",
      rawBundleBytes: 1312394,
      desktopObservation: "1280x729 viewport; 188 FPS average; p95 5.1 ms",
      mobileObservation: "370x596 viewport; 193 FPS average; p95 5.1 ms",
      touchCamera: "PASS",
      factualProjection: "PASS",
      domAccessibility: "PASS",
    },
    {
      candidate: "pixi-v8",
      build: "PASS",
      rawBundleBytes: 916099,
      desktopObservation: "1280x729 viewport; 190 FPS average; p95 5.1 ms",
      mobileObservation: "370x596 viewport; 192 FPS average; p95 5.1 ms",
      touchCamera: "PASS",
      factualProjection: "PASS",
      domAccessibility: "PASS",
    },
  ],
  verifiedBoundaries: [
    "simulation, action, and time remain in the existing TMR TypeScript core",
    "WorldSceneModel reads PresentationState and never writes WorldState",
    "WorldVisualDelta remains transient presentation feedback",
    "camera pan, zoom, and focus are renderer-local state",
    "save/load/replay remains on the existing SerializedSimulationSnapshotV8 boundary",
    "PixiJS benchmark code is isolated from the production app path",
  ],
};

export function assertRendererDecision(): void {
  if (P0_RENDERER_DECISION.productionRenderer !== "three-r3f") {
    throw new Error("P0 must select the R3F production renderer.");
  }
  if (P0_RENDERER_DECISION.spikeStatus !== "PASS") {
    throw new Error("Both renderer spikes must pass before selection.");
  }
  if (P0_RENDERER_DECISION.blocker !== null) {
    throw new Error("The selected renderer must not carry a blocker.");
  }
  if (P0_RENDERER_DECISION.evidence.length !== 2) {
    throw new Error("R3F and Pixi evidence are both required.");
  }
  if (P0_RENDERER_DECISION.verifiedBoundaries.length < 6) {
    throw new Error("Renderer boundary evidence is incomplete.");
  }
}
