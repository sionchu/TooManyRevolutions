import { describe, expect, it } from "vitest";

import { deriveMapArchitecture, deriveMapLodTier } from "./mapArchitecture";
import {
  deriveMapVisualSystem,
  MAP_MATERIAL_SYSTEM,
  MAP_VISUAL_ASSET_KIT,
  validateMapVisualSystem,
} from "./mapVisualSystem";
import { derivePresentationState } from "./presentationState";
import { deriveWorldSceneModel } from "./worldSceneModel";
import { createDemoRuntimeState } from "../app/demoGame";
import { GAMEBUILDERS_DEMO_SCENARIO } from "../sim/state/gameBuildersDemoScenario";

function createFixture() {
  const record = createDemoRuntimeState();
  const presentation = derivePresentationState(
    GAMEBUILDERS_DEMO_SCENARIO,
    record.world,
  );
  const model = deriveWorldSceneModel(presentation);
  const architecture = deriveMapArchitecture(model);
  return { model, architecture };
}

describe("MAP_VISUAL_SYSTEM", () => {
  it("provides macro, meso, and micro visual hierarchy without topology changes", () => {
    const { model, architecture } = createFixture();
    const macro = deriveMapVisualSystem(
      model,
      architecture,
      deriveMapLodTier(0.9),
    );
    const meso = deriveMapVisualSystem(
      model,
      architecture,
      deriveMapLodTier(1.25),
    );
    const micro = deriveMapVisualSystem(
      model,
      architecture,
      deriveMapLodTier(1.8),
    );

    expect(macro.visualScale).toBe("macro");
    expect(meso.visualScale).toBe("meso");
    expect(micro.visualScale).toBe("micro");
    expect(macro.compositions).toHaveLength(model.regions.length);
    expect(macro.labels.every((label) => label.kind !== "region")).toBe(true);
    expect(meso.labels.some((label) => label.kind === "region")).toBe(true);
    expect(architecture.sharedTerrainMesh.logicalLandHexCount).toBe(
      model.hexes.length,
    );
  });

  it("keeps the authored kit coherent and grounded", () => {
    expect(MAP_VISUAL_ASSET_KIT.length).toBeGreaterThanOrEqual(14);
    expect(
      MAP_VISUAL_ASSET_KIT.every(
        (asset) =>
          asset.geometry === "TMR_PROCEDURAL_LOW_POLY_KIT" &&
          asset.license === "PROJECT_AUTHORED_NO_THIRD_PARTY_ASSET",
      ),
    ).toBe(true);
    expect(MAP_MATERIAL_SYSTEM.roughness).toBeGreaterThanOrEqual(0.75);
    expect(MAP_MATERIAL_SYSTEM.contactShadowOpacity).toBeGreaterThan(0);
  });

  it("passes visual composition, material, and label collision validation", () => {
    const { model, architecture } = createFixture();
    const visualSystem = deriveMapVisualSystem(model, architecture, "medium");
    expect(validateMapVisualSystem(model, architecture, visualSystem)).toEqual(
      [],
    );
  });
});
