import { describe, expect, it } from "vitest";

import { createInitialWorldState } from "../sim/state/world";
import { GAMEBUILDERS_PRODUCTION_POLICY_IDS } from "../sim/state/gameBuildersDecisionCatalog";
import { GAMEBUILDERS_DEMO_SCENARIO } from "../sim/state/gameBuildersDemoScenario";
import {
  deriveInstitutionalGraphLayout,
  deriveInstitutionalRoadmap,
  INSTITUTIONAL_GRAPH_NODE_HEIGHT,
  INSTITUTIONAL_GRAPH_NODE_WIDTH,
} from "./institutionalRoadmap";

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

  it("keeps authored domains vertical and prerequisite depth horizontal", () => {
    const world = createInitialWorldState(GAMEBUILDERS_DEMO_SCENARIO, 18970401);
    const policyState =
      world.policies[GAMEBUILDERS_DEMO_SCENARIO.playerCountryId!]!;
    const roadmap = deriveInstitutionalRoadmap(
      policyState,
      GAMEBUILDERS_DEMO_SCENARIO.policyCatalog,
    );
    const layout = deriveInstitutionalGraphLayout(roadmap);

    expect(layout.positions.size).toBe(roadmap.nodes.length);
    expect(layout.lanes.map((lane) => lane.domain)).toEqual([
      "authority",
      "property",
      "labor",
      "information",
      "taxation",
      "localGovernment",
    ]);

    const legislative = layout.positions.get(
      GAMEBUILDERS_PRODUCTION_POLICY_IDS.legislativeOversight,
    );
    const broad = layout.positions.get(
      GAMEBUILDERS_PRODUCTION_POLICY_IDS.broadSuffrage,
    );
    const universal = layout.positions.get(
      GAMEBUILDERS_PRODUCTION_POLICY_IDS.universalSuffrage,
    );
    expect(legislative?.domain).toBe("authority");
    expect(broad?.domain).toBe("authority");
    expect(universal?.domain).toBe("authority");
    expect(broad?.depth).toBeGreaterThan(legislative?.depth ?? -1);
    expect(universal?.depth).toBeGreaterThan(broad?.depth ?? -1);

    for (const first of roadmap.nodes) {
      const firstPosition = layout.positions.get(first.definition.id)!;
      for (const second of roadmap.nodes) {
        const secondPosition = layout.positions.get(second.definition.id)!;
        if (
          first.definition.id >= second.definition.id ||
          firstPosition.domain !== secondPosition.domain ||
          firstPosition.depth !== secondPosition.depth
        ) {
          continue;
        }
        const overlaps =
          firstPosition.x < secondPosition.x + INSTITUTIONAL_GRAPH_NODE_WIDTH &&
          firstPosition.x + INSTITUTIONAL_GRAPH_NODE_WIDTH > secondPosition.x &&
          firstPosition.y <
            secondPosition.y + INSTITUTIONAL_GRAPH_NODE_HEIGHT &&
          firstPosition.y + INSTITUTIONAL_GRAPH_NODE_HEIGHT > secondPosition.y;
        expect(overlaps).toBe(false);
      }
    }
  });
});
