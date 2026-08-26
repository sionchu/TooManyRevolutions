import { describe, expect, it } from "vitest";

import { createInitialWorldState } from "../sim/state/world";
import { GAMEBUILDERS_PRODUCTION_POLICY_IDS } from "../sim/state/gameBuildersDecisionCatalog";
import { GAMEBUILDERS_DEMO_SCENARIO } from "../sim/state/gameBuildersDemoScenario";
import { deriveInstitutionalRoadmap } from "./institutionalRoadmap";

describe("InstitutionalRoadmap", () => {
  it("projects only authored policy prerequisites, conflicts and rule mutations", () => {
    const world = createInitialWorldState(GAMEBUILDERS_DEMO_SCENARIO, 18970401);
    const policyState =
      world.policies[GAMEBUILDERS_DEMO_SCENARIO.playerCountryId!]!;
    const initial = deriveInstitutionalRoadmap(
      policyState,
      GAMEBUILDERS_DEMO_SCENARIO.policyCatalog,
    );
    expect(
      initial.nodes.find(
        (node) =>
          node.definition.id ===
          GAMEBUILDERS_PRODUCTION_POLICY_IDS.universalSuffrage,
      )?.status,
    ).toBe("BLOCKED_BY_PREREQUISITE");
    expect(initial.edges.some((edge) => edge.kind === "prerequisite")).toBe(
      true,
    );
    expect(initial.edges.some((edge) => edge.kind === "incompatible")).toBe(
      false,
    );
    expect(JSON.stringify(initial)).not.toContain("currency");

    const enactedState = {
      ...policyState,
      activePolicyIds: [
        GAMEBUILDERS_PRODUCTION_POLICY_IDS.legislativeOversight,
        GAMEBUILDERS_PRODUCTION_POLICY_IDS.propertySuffrage,
        GAMEBUILDERS_PRODUCTION_POLICY_IDS.broadSuffrage,
      ],
      enactedAtTick: {
        [GAMEBUILDERS_PRODUCTION_POLICY_IDS.legislativeOversight]: 1,
        [GAMEBUILDERS_PRODUCTION_POLICY_IDS.propertySuffrage]: 2,
        [GAMEBUILDERS_PRODUCTION_POLICY_IDS.broadSuffrage]: 3,
      },
      institutionalRules: {
        ...policyState.institutionalRules,
        rulerVeto: false,
        legislatureRequired: true,
        suffrage: "broad" as const,
      },
    };
    const enacted = deriveInstitutionalRoadmap(
      enactedState,
      GAMEBUILDERS_DEMO_SCENARIO.policyCatalog,
    );
    expect(
      enacted.nodes.find(
        (node) =>
          node.definition.id ===
          GAMEBUILDERS_PRODUCTION_POLICY_IDS.legislativeOversight,
      )?.status,
    ).toBe("ENACTED");
    expect(
      enacted.nodes.find(
        (node) =>
          node.definition.id ===
          GAMEBUILDERS_PRODUCTION_POLICY_IDS.universalSuffrage,
      )?.status,
    ).toBe("AVAILABLE");
  });
});
