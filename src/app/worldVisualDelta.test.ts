import { describe, expect, it } from "vitest";

import { derivePresentationState } from "../presentation/presentationState";
import { GAMEBUILDERS_DEMO_SCENARIO } from "../sim/state/gameBuildersDemoScenario";
import { GAMEBUILDERS_PRODUCTION_POLICY_IDS } from "../sim/state/gameBuildersDecisionCatalog";
import {
  advanceDemoRuntime,
  createDemoRuntimeState,
  submitRuntimePolicy,
} from "./demoGame";
import { deriveWorldVisualDeltas } from "./worldVisualDelta";

describe("WorldVisualDelta", () => {
  it("projects authoritative policy and ideology changes into transient map feedback", () => {
    const initial = createDemoRuntimeState();
    const policyRun = submitRuntimePolicy(
      initial,
      GAMEBUILDERS_PRODUCTION_POLICY_IDS.legislativeOversight,
    );
    const policyDeltas = deriveWorldVisualDeltas({
      previous: derivePresentationState(
        GAMEBUILDERS_DEMO_SCENARIO,
        initial.world,
      ),
      next: derivePresentationState(
        GAMEBUILDERS_DEMO_SCENARIO,
        policyRun.world,
      ),
      events: policyRun.eventStore.events.filter(
        (event) => event.type !== "TICK_ADVANCED",
      ),
      previousPolicy:
        initial.world.policies[GAMEBUILDERS_DEMO_SCENARIO.playerCountryId!],
      nextPolicy:
        policyRun.world.policies[GAMEBUILDERS_DEMO_SCENARIO.playerCountryId!],
    });
    expect(policyDeltas.some((delta) => delta.kind === "institution")).toBe(
      true,
    );
    expect(initial.world.tick).toBe(0);

    const horizon = advanceDemoRuntime(initial, 30);
    const ideologyDeltas = deriveWorldVisualDeltas({
      previous: derivePresentationState(
        GAMEBUILDERS_DEMO_SCENARIO,
        initial.world,
      ),
      next: derivePresentationState(GAMEBUILDERS_DEMO_SCENARIO, horizon.world),
      events: horizon.eventStore.events,
    });
    expect(ideologyDeltas.some((delta) => delta.kind === "ideology")).toBe(
      true,
    );
    expect(
      ideologyDeltas.every(
        (delta) =>
          delta.sourceEventIds.length > 0 || delta.kind === "institution",
      ),
    ).toBe(true);
  });
});
