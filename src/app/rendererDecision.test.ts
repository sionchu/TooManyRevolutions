import { describe, expect, it } from "vitest";

import {
  assertRendererDecision,
  P0_RENDERER_DECISION,
} from "./rendererDecision";

describe("P0 world-stage renderer decision", () => {
  it("selects R3F only after both real renderer spikes pass", () => {
    expect(() => assertRendererDecision()).not.toThrow();
    expect(P0_RENDERER_DECISION.productionRenderer).toBe("three-r3f");
    expect(P0_RENDERER_DECISION.candidate).toBe("pixi-v8");
    expect(
      P0_RENDERER_DECISION.evidence.map((entry) => entry.candidate),
    ).toEqual(["three-r3f", "pixi-v8"]);
    expect(
      P0_RENDERER_DECISION.evidence.every(
        (entry) =>
          entry.build === "PASS" &&
          entry.touchCamera === "PASS" &&
          entry.factualProjection === "PASS" &&
          entry.domAccessibility === "PASS",
      ),
    ).toBe(true);
  });

  it("keeps the simulation and persistence boundaries explicit", () => {
    expect(P0_RENDERER_DECISION.verifiedBoundaries).toEqual(
      expect.arrayContaining([
        "WorldSceneModel reads PresentationState and never writes WorldState",
        "save/load/replay remains on the existing SerializedSimulationSnapshotV8 boundary",
      ]),
    );
  });
});
