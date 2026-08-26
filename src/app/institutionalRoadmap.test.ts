import { describe, expect, it } from "vitest";

import { createInitialWorldState } from "../sim/state/world";
import { GAMEBUILDERS_DEMO_SCENARIO } from "../sim/state/gameBuildersDemoScenario";
import { POLICY_FIXTURE_IDS } from "../sim/state/policyFixture";
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
        (node) => node.definition.id === POLICY_FIXTURE_IDS.universalSuffrage,
      )?.status,
    ).toBe("BLOCKED_BY_PREREQUISITE");
    expect(initial.edges.some((edge) => edge.kind === "prerequisite")).toBe(
      true,
    );
    expect(initial.edges.some((edge) => edge.kind === "incompatible")).toBe(
      true,
    );
    expect(JSON.stringify(initial)).not.toContain("currency");

    const enactedState = {
      ...policyState,
      activePolicyIds: [POLICY_FIXTURE_IDS.abolishRoyalVeto],
      enactedAtTick: { [POLICY_FIXTURE_IDS.abolishRoyalVeto]: 1 },
      institutionalRules: {
        ...policyState.institutionalRules,
        rulerVeto: false,
        legislatureRequired: true,
      },
    };
    const enacted = deriveInstitutionalRoadmap(
      enactedState,
      GAMEBUILDERS_DEMO_SCENARIO.policyCatalog,
    );
    expect(
      enacted.nodes.find(
        (node) => node.definition.id === POLICY_FIXTURE_IDS.abolishRoyalVeto,
      )?.status,
    ).toBe("ENACTED");
    expect(
      enacted.nodes.find(
        (node) => node.definition.id === POLICY_FIXTURE_IDS.universalSuffrage,
      )?.status,
    ).toBe("AVAILABLE");
  });
});
