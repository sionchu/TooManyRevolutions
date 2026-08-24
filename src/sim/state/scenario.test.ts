import { describe, expect, it } from "vitest";

import { assertWorldStateInvariants } from "../core/invariants";
import {
  asCountryId,
  asFactionId,
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

  it("accepts explicit FUND_MOVEMENT profiles in insertion-order-independent form", () => {
    const scenario = createF05Fix7PoliticalInteractionScenario();
    const firstFaction = scenario.initialFactions[0];
    const secondFaction = scenario.initialFactions[1];
    const targetRegion = scenario.initialRegions[1];

    if (firstFaction === undefined || secondFaction === undefined) {
      throw new Error("FUND_MOVEMENT authoring test factions are missing.");
    }
    if (targetRegion === undefined) {
      throw new Error("FUND_MOVEMENT authoring test Region is missing.");
    }

    const profiles = [
      {
        factionId: firstFaction.id,
        targetRegionId: targetRegion.id,
        resourceAmount: 0.25,
      },
      {
        factionId: secondFaction.id,
        targetRegionId: targetRegion.id,
        resourceAmount: 0.4,
      },
    ] as const;

    expect(() =>
      assertScenarioDefinition({
        ...scenario,
        factionFundMovementTemplates: profiles,
      }),
    ).not.toThrow();
    expect(() =>
      assertScenarioDefinition({
        ...scenario,
        factionFundMovementTemplates: [...profiles].reverse(),
      }),
    ).not.toThrow();
  });

  it("rejects an unknown FUND_MOVEMENT faction", () => {
    const scenario = createF05Fix7PoliticalInteractionScenario();
    const targetRegion = scenario.initialRegions[0];

    if (targetRegion === undefined) {
      throw new Error("FUND_MOVEMENT authoring test Region is missing.");
    }

    expect(() =>
      assertScenarioDefinition({
        ...scenario,
        factionFundMovementTemplates: [
          {
            factionId: asFactionId("missing-fund-movement-faction"),
            targetRegionId: targetRegion.id,
            resourceAmount: 0.25,
          },
        ],
      }),
    ).toThrow("references missing faction");
  });

  it("rejects an unknown FUND_MOVEMENT target Region", () => {
    const scenario = createF05Fix7PoliticalInteractionScenario();
    const faction = scenario.initialFactions[0];

    if (faction === undefined) {
      throw new Error("FUND_MOVEMENT authoring test faction is missing.");
    }

    expect(() =>
      assertScenarioDefinition({
        ...scenario,
        factionFundMovementTemplates: [
          {
            factionId: faction.id,
            targetRegionId: asRegionId("missing-fund-movement-region"),
            resourceAmount: 0.25,
          },
        ],
      }),
    ).toThrow("references missing target Region");
  });

  it("rejects a FUND_MOVEMENT target Region owned by another country", () => {
    const scenario = createF05Fix7PoliticalInteractionScenario();
    const faction = scenario.initialFactions[0];
    const sourceRegion = scenario.initialRegions[0];
    const sourceCountry = scenario.initialCountries[0];

    if (
      faction === undefined ||
      sourceRegion === undefined ||
      sourceCountry === undefined
    ) {
      throw new Error("FUND_MOVEMENT authoring test data is missing.");
    }

    const foreignCountryId = asCountryId("foreign-fund-movement-country");
    const foreignRegionId = asRegionId("foreign-fund-movement-region");

    expect(() =>
      assertScenarioDefinition({
        ...scenario,
        initialCountries: [
          ...scenario.initialCountries,
          {
            ...sourceCountry,
            id: foreignCountryId,
            name: "Foreign Fund Movement Country",
            currentGovernmentId: null,
            capitalRegionId: foreignRegionId,
          },
        ],
        initialRegions: [
          ...scenario.initialRegions,
          {
            ...sourceRegion,
            id: foreignRegionId,
            name: "Foreign Fund Movement Region",
            ownerCountryId: foreignCountryId,
            initialController: { kind: "uncontrolled" },
          },
        ],
        factionFundMovementTemplates: [
          {
            factionId: faction.id,
            targetRegionId: foreignRegionId,
            resourceAmount: 0.25,
          },
        ],
      }),
    ).toThrow("must target a Region owned by faction country");
  });

  it.each([
    0,
    -0.1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ])("rejects invalid FUND_MOVEMENT resourceAmount %s", (resourceAmount) => {
    const scenario = createF05Fix7PoliticalInteractionScenario();
    const faction = scenario.initialFactions[0];
    const targetRegion = scenario.initialRegions[0];

    if (faction === undefined || targetRegion === undefined) {
      throw new Error("FUND_MOVEMENT authoring test data is missing.");
    }

    expect(() =>
      assertScenarioDefinition({
        ...scenario,
        factionFundMovementTemplates: [
          {
            factionId: faction.id,
            targetRegionId: targetRegion.id,
            resourceAmount,
          },
        ],
      }),
    ).toThrow("finite positive resourceAmount");
  });

  it("rejects duplicate FUND_MOVEMENT profiles for one faction", () => {
    const scenario = createF05Fix7PoliticalInteractionScenario();
    const faction = scenario.initialFactions[0];
    const targetRegion = scenario.initialRegions[0];

    if (faction === undefined || targetRegion === undefined) {
      throw new Error("FUND_MOVEMENT authoring test data is missing.");
    }

    const profile = {
      factionId: faction.id,
      targetRegionId: targetRegion.id,
      resourceAmount: 0.25,
    };

    expect(() =>
      assertScenarioDefinition({
        ...scenario,
        factionFundMovementTemplates: [
          profile,
          { ...profile, resourceAmount: 0.4 },
        ],
      }),
    ).toThrow("repeats faction");
  });

  it("keeps scenarios without FUND_MOVEMENT authoring behaviorally unchanged", () => {
    const scenario = createF05Fix7PoliticalInteractionScenario();
    const withoutAuthoring = createInitialWorldState(scenario, 17);
    const withEmptyAuthoring = createInitialWorldState(
      { ...scenario, factionFundMovementTemplates: [] },
      17,
    );

    expect(scenario.factionFundMovementTemplates).toBeUndefined();
    expect(withEmptyAuthoring).toEqual(withoutAuthoring);
  });
});
