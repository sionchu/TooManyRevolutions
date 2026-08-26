import { describe, expect, it } from "vitest";

import { advanceDemoRuntime, createDemoRuntimeState } from "../../app/demoGame";
import { GAMEBUILDERS_DEMO_SCENARIO } from "../../sim/state/gameBuildersDemoScenario";
import { derivePresentationState } from "../presentationState";
import { deriveWorldSceneModel } from "../worldSceneModel";
import { deriveMapRuntimeGeometry } from "./geometry";

function createFixture() {
  const record = createDemoRuntimeState();
  const presentation = derivePresentationState(
    GAMEBUILDERS_DEMO_SCENARIO,
    record.world,
  );
  return deriveWorldSceneModel(presentation);
}

describe("map runtime geometry", () => {
  it("derives connected terrain surfaces without changing LandHex count", () => {
    const model = createFixture();
    const runtime = deriveMapRuntimeGeometry(model);

    expect(runtime.terrainMesh.logicalLandHexCount).toBe(model.hexes.length);
    expect(runtime.terrainMesh.polygonCount).toBeLessThan(model.hexes.length);
    expect(runtime.terrainMesh.sharedVertexCount).toBeGreaterThan(0);
    expect(runtime.terrainMesh.vertices.length).toBeLessThan(
      model.hexes.length * 7,
    );
    expect(runtime.terrainMesh.terrainKinds.length).toBeGreaterThan(1);
    expect(runtime.terrainMesh.minHeight).toBeLessThan(
      runtime.terrainMesh.maxHeight,
    );
    expect(
      runtime.terrainMesh.triangles.every(([first, second, third]) =>
        [first, second, third].every(
          (index) => index >= 0 && index < runtime.terrainMesh.vertices.length,
        ),
      ),
    ).toBe(true);
    expect(runtime.regionSurfaces.length).toBeGreaterThan(0);
  });

  it("uses merged faction surfaces and keeps runtime geometry deterministic", () => {
    const record = advanceDemoRuntime(createDemoRuntimeState(), 90);
    const presentation = derivePresentationState(
      GAMEBUILDERS_DEMO_SCENARIO,
      record.world,
    );
    const model = deriveWorldSceneModel(presentation);
    const first = deriveMapRuntimeGeometry(model);
    const reversed = deriveMapRuntimeGeometry({
      ...model,
      hexes: [...model.hexes].reverse(),
      regions: [...model.regions].reverse(),
    });

    expect(first.factionSurfaces.length).toBeGreaterThan(0);
    expect(reversed).toEqual(first);
  });
});
