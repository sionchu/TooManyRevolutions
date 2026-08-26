export type ProductionRenderer = "svg-fallback";

export interface RendererDecisionReport {
  readonly productionRenderer: ProductionRenderer;
  readonly candidate: "pixi-v8-react";
  readonly spikeStatus: "DEFERRED_WITH_EXACT_BLOCKER";
  readonly blocker: string;
  readonly verifiedBoundaries: readonly string[];
}

/**
 * P0 renderer decision. The existing SVG renderer remains the only production
 * authority until a real Pixi dependency/build/mobile proof is available.
 */
export const P0_RENDERER_DECISION: RendererDecisionReport = {
  productionRenderer: "svg-fallback",
  candidate: "pixi-v8-react",
  spikeStatus: "DEFERRED_WITH_EXACT_BLOCKER",
  blocker:
    "현재 dependency graph에는 pixi.js/@pixi/react가 없고, P0에서 새 GPU renderer를 추가하면 Sites build와 mobile touch proof를 먼저 확보해야 하므로 production renderer를 이 checkpoint에서 이중화하지 않는다.",
  verifiedBoundaries: [
    "simulation/action/time remains in existing TMR TypeScript core",
    "SVG consumes PresentationState only",
    "WorldVisualDelta is presentation-only",
    "camera focus/zoom is local renderer state",
    "save/load/replay remains SerializedSimulationSnapshotV8",
  ],
};

export function assertRendererDecision(): void {
  if (P0_RENDERER_DECISION.productionRenderer !== "svg-fallback") {
    throw new Error("Unexpected P0 production renderer decision.");
  }
  if (P0_RENDERER_DECISION.verifiedBoundaries.length < 5) {
    throw new Error("Renderer boundary evidence is incomplete.");
  }
}
