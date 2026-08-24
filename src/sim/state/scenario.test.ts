import { describe, expect, it } from "vitest";

import { assertWorldStateInvariants } from "../core/invariants";
import {
  asCountryId,
  asGovernmentId,
  asLandHexId,
  asRegionId,
  asScenarioId,
} from "./ids";
import {
  assertScenarioDefinition,
  FOUNDATION_SCENARIO,
  type ScenarioDefinition,
} from "./scenario";
import { createDefaultInstitutionalRuleState } from "./policy";
import { createInitialWorldState } from "./world";
import {
  createF05Fix6PoliticalInteractionScenario,
  createF05Fix7PoliticalInteractionScenario,
} from "./politicalInteractionFixture";

describe("ScenarioDefinition boundary", () => {
  it("creates mutable run state from static initial snapshots", () => {
    const countryId = asCountryId("contract-state");
    const governmentId = asGovernmentId("contract-government");
    const capitalRegionId = asRegionId("contract-capital");
    const scenario: ScenarioDefinition = {
      ...FOUNDATION_SCENARIO,
      id: asScenarioId("contract-scenario"),
      playerCountryId: countryId,
      initialCountries: [
        {
          id: countryId,
          name: "Contract State",
          currentGovernmentId: governmentId,
          treasury: 0,
          dailyIncome: 0,
          dailyExpenditure: 0,
          legitimacy: 50,
          stateCapacity: 50,
          production: 0,
          militaryPower: 50,
          instability: 0,
          stateContinuity: 100,
          capitalRegionId,
          diplomacy: {},
        },
      ],
      initialRegions: [
        {
          id: capitalRegionId,
          name: "Contract Capital",
          ownerCountryId: countryId,
          initialController: { kind: "country", countryId },
          population: 1,
          urbanization: 0,
          accessibility: 0,
          resources: {},
          resourceProductionCapacity: {},
          resourceProduction: {},
          resourceDemand: {},
          production: 0,
          stateControl: 1,
          infrastructure: 0,
          scarcity: 0,
          unrest: 0,
          ideology: {},
        },
      ],
      initialGovernments: [
        {
          id: governmentId,
          countryId,
          name: "Contract Government",
          authority: "central",
          formedAtTick: 0,
        },
      ],
      initialCountryPolicies: {
        [countryId]: {
          activePolicyIds: [],
          enactedAtTick: {},
          institutionalRules: createDefaultInstitutionalRuleState(),
        },
      },
      mapContactTopology: {
        regionIds: [capitalRegionId],
        contactEdges: [],
      },
      mapTerritorialTopology: {
        landHexes: [
          {
            id: asLandHexId("contract-capital-hex"),
            regionId: capitalRegionId,
            coordinate: { q: 0, r: 0 },
            terrain: "plains",
          },
        ],
      },
    };

    const world = createInitialWorldState(scenario, 17);

    expect(world.run.scenarioId).toBe(scenario.id);
    expect(world.countries[countryId]).toEqual(scenario.initialCountries[0]);
    expect(world.countries[countryId]).not.toBe(scenario.initialCountries[0]);
    expect(
      world.landHexStates[asLandHexId("contract-capital-hex")]?.controller,
    ).toEqual({
      kind: "country",
      countryId,
    });
    expect(world.regions[capitalRegionId]).not.toHaveProperty("controller");
    assertWorldStateInvariants(world);
  });

  it("closes the v1 proposal trigger contract to LOBBY only", () => {
    const fix6 = createF05Fix6PoliticalInteractionScenario();
    const fix7 = createF05Fix7PoliticalInteractionScenario();

    expect(fix6.factionProposalTemplates).toEqual(
      fix7.factionProposalTemplates,
    );
    expect(fix7.factionProposalTemplates).toHaveLength(1);
    expect(fix7.factionProposalTemplates?.[0]?.triggerAction).toBe("LOBBY");

    const invalid = {
      ...fix7,
      factionProposalTemplates: [
        {
          ...fix7.factionProposalTemplates![0]!,
          triggerAction: "BARGAIN" as never,
        },
      ],
    };

    expect(() => assertScenarioDefinition(invalid)).toThrow(
      "invalid trigger action BARGAIN",
    );
  });
});
