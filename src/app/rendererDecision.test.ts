import { describe, expect, it } from "vitest";

import {
  assertRendererDecision,
  P0_RENDERER_DECISION,
} from "./rendererDecision";

describe("P0 renderer decision", () => {
  it("keeps one production SVG renderer with explicit Pixi blocker", () => {
    expect(() => assertRendererDecision()).not.toThrow();
    expect(P0_RENDERER_DECISION.productionRenderer).toBe("svg-fallback");
    expect(P0_RENDERER_DECISION.spikeStatus).toBe(
      "DEFERRED_WITH_EXACT_BLOCKER",
    );
    expect(P0_RENDERER_DECISION.blocker).toContain("pixi.js/@pixi/react");
  });
});
