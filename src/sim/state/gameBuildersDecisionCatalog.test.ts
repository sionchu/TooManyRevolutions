import { describe, expect, it } from "vitest";

import { assertContextualDecisionCatalog } from "../readModels/contextualDecisions";
import { assertScenarioDefinition } from "./scenario";
import { assertScenarioInterventionCatalog } from "./intervention";
import {
  F04D_VALIDATION_INTERVENTION_IDS,
  createF04DValidationScenario,
} from "./gate1fValidationFixture";
import {
  GAMEBUILDERS_PRODUCTION_CONTEXTUAL_CATALOG,
  GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS,
  GAMEBUILDERS_PRODUCTION_POLICY_CATALOG,
  GAMEBUILDERS_PRODUCTION_POLICY_IDS,
  createGameBuildersProductionInterventionCatalog,
} from "./gameBuildersDecisionCatalog";
import { GAMEBUILDERS_DEMO_SCENARIO } from "./gameBuildersDemoScenario";
import { INTERVENTION_FIXTURE_IDS } from "./interventionFixture";
import { POLICY_FIXTURE_IDS } from "./policyFixture";

describe("GameBuilders production decision catalogs", () => {
  it("covers every current institutional axis with non-fixture policy content", () => {
    const policyIds = Object.keys(GAMEBUILDERS_PRODUCTION_POLICY_CATALOG);
    const mutatedRules = new Set(
      Object.values(GAMEBUILDERS_PRODUCTION_POLICY_CATALOG).flatMap((policy) =>
        Object.keys(policy.ruleMutations),
      ),
    );

    expect(policyIds.length).toBe(
      Object.keys(GAMEBUILDERS_PRODUCTION_POLICY_IDS).length,
    );
    expect(policyIds.every((id) => id.startsWith("gamebuilders.policy."))).toBe(
      true,
    );
    expect(mutatedRules).toEqual(
      new Set([
        "rulerVeto",
        "legislatureRequired",
        "suffrage",
        "productiveProperty",
        "landOwnership",
        "laborOrganization",
        "pressFreedom",
        "politicalCompetition",
      ]),
    );
    expect(policyIds).not.toContain(POLICY_FIXTURE_IDS.abolishRoyalVeto);
    expect(policyIds).not.toContain(POLICY_FIXTURE_IDS.universalSuffrage);
  });

  it("binds production intervention targets to the real GameBuilders actors", () => {
    const playerCountry = GAMEBUILDERS_DEMO_SCENARIO.initialCountries[0]!;
    const capital = GAMEBUILDERS_DEMO_SCENARIO.initialRegions[0]!;
    const industrial = GAMEBUILDERS_DEMO_SCENARIO.initialRegions[1]!;
    const laborFaction = GAMEBUILDERS_DEMO_SCENARIO.initialFactions.find(
      (faction) => faction.interests.includes("labor"),
    )!;
    const catalog = createGameBuildersProductionInterventionCatalog({
      capitalRegionId: capital.id,
      industrialRegionId: industrial.id,
      laborFactionId: laborFaction.id,
    });

    expect(Object.keys(catalog).length).toBe(
      Object.keys(GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS).length,
    );
    expect(
      Object.keys(catalog).every((id) =>
        id.startsWith("gamebuilders.intervention."),
      ),
    ).toBe(true);
    expect(Object.keys(catalog)).not.toContain(INTERVENTION_FIXTURE_IDS.short);
    expect(Object.keys(catalog)).not.toContain(
      F04D_VALIDATION_INTERVENTION_IDS.oppositionLegalization,
    );
    expect(
      Object.values(catalog).some((definition) =>
        definition.completionEffects?.some(
          (effect) =>
            effect.kind === "regionResourceProductionCapacityDelta" &&
            effect.regionId === industrial.id,
        ),
      ),
    ).toBe(true);
    expect(
      Object.values(catalog).some((definition) =>
        definition.completionEffects?.some(
          (effect) =>
            effect.kind === "factionGrievanceDelta" &&
            effect.factionId === laborFaction.id,
        ),
      ),
    ).toBe(true);
    expect(playerCountry.id).toBe(GAMEBUILDERS_DEMO_SCENARIO.playerCountryId);
  });

  it("uses the production catalogs in the GameBuilders scenario and validates metadata coverage", () => {
    assertScenarioDefinition(GAMEBUILDERS_DEMO_SCENARIO);
    assertScenarioInterventionCatalog(GAMEBUILDERS_DEMO_SCENARIO);
    assertContextualDecisionCatalog({
      scenario: GAMEBUILDERS_DEMO_SCENARIO,
      catalog: GAMEBUILDERS_PRODUCTION_CONTEXTUAL_CATALOG,
    });

    expect(GAMEBUILDERS_DEMO_SCENARIO.policyCatalog).toBe(
      GAMEBUILDERS_PRODUCTION_POLICY_CATALOG,
    );
    expect(Object.keys(GAMEBUILDERS_DEMO_SCENARIO.interventionCatalog)).toEqual(
      expect.arrayContaining([
        GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS.emergencyFoodDistribution,
        GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS.oppositionLegalization,
      ]),
    );
    expect(
      Object.keys(GAMEBUILDERS_DEMO_SCENARIO.interventionCatalog).some((id) =>
        id.startsWith("t016b."),
      ),
    ).toBe(false);
    expect(
      Object.keys(GAMEBUILDERS_DEMO_SCENARIO.policyCatalog).some((id) =>
        id.startsWith("fixture."),
      ),
    ).toBe(false);
    expect(GAMEBUILDERS_PRODUCTION_POLICY_IDS.legislativeOversight).toBe(
      "gamebuilders.policy.legislative-oversight",
    );
  });

  it("does not alter the developer-only F04D fixture catalog", () => {
    const fixtureScenario = createF04DValidationScenario();

    expect(fixtureScenario.interventionCatalog).toHaveProperty(
      F04D_VALIDATION_INTERVENTION_IDS.oppositionLegalization,
    );
    expect(fixtureScenario.policyCatalog).toHaveProperty(
      POLICY_FIXTURE_IDS.abolishRoyalVeto,
    );
    expect(fixtureScenario.interventionCatalog).not.toHaveProperty(
      GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS.emergencyFoodDistribution,
    );
  });
});
