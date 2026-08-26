import { describe, expect, it } from "vitest";

import { F04D_VALIDATION_INTERVENTION_IDS } from "../sim/state/gate1fValidationFixture";
import {
  advanceDemoRuntime,
  createDemoRuntimeState,
  submitRuntimeIntervention,
} from "./demoGame";
import { deriveStateProjectPresentations } from "./stateProjects";
import { GAMEBUILDERS_DEMO_SCENARIO } from "../sim/state/gameBuildersDemoScenario";

describe("state project presentation", () => {
  it("follows the existing intervention lifecycle without a second project clock", () => {
    const initial = createDemoRuntimeState();
    const started = submitRuntimeIntervention(
      initial,
      F04D_VALIDATION_INTERVENTION_IDS.materialRelief,
    );
    const implementing = deriveStateProjectPresentations(
      GAMEBUILDERS_DEMO_SCENARIO,
      started.world,
      started.eventStore.events,
    );
    const material = implementing.find(
      (project) =>
        project.sourceInterventionId ===
        F04D_VALIDATION_INTERVENTION_IDS.materialRelief,
    );
    expect(material?.status).toBe("implementing");
    expect(material?.startedTick).toBe(1);
    expect(material?.sourceEventIds.length).toBeGreaterThan(0);

    const completed = advanceDemoRuntime(started, 1);
    const completedProjects = deriveStateProjectPresentations(
      GAMEBUILDERS_DEMO_SCENARIO,
      completed.world,
      completed.eventStore.events,
    );
    const completedMaterial = completedProjects.find(
      (project) =>
        project.sourceInterventionId ===
        F04D_VALIDATION_INTERVENTION_IDS.materialRelief,
    );
    expect(completedMaterial?.status).toBe("completed");
    expect(completedMaterial?.progress).toBe(1);
    expect(
      completedMaterial?.sourceEventIds.some((eventId) =>
        eventId.includes("INTERVENTION_COMPLETED"),
      ),
    ).toBe(true);
  });
});
