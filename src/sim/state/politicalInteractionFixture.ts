import { asScenarioId } from "./ids";
import {
  createF04DValidationScenario,
  F04D_VALIDATION_INTERVENTION_IDS,
} from "./gate1fValidationFixture";
import { POLITICAL_CRISIS_FIXTURE_FACTION_IDS } from "./politicalCrisisFixture";
import type { ScenarioDefinition } from "./scenario";

/**
 * F05_FIX6-only content. The mapping is explicit fixture data rather than a
 * semantic rule inferred from faction interests or ideology.
 */
export function createF05Fix6PoliticalInteractionScenario(): ScenarioDefinition {
  const baseScenario = createF04DValidationScenario();

  return {
    ...baseScenario,
    id: asScenarioId("gate1f.f05.fix6.political-interaction"),
    factionProposalTemplates: [
      {
        factionId: POLITICAL_CRISIS_FIXTURE_FACTION_IDS.coup,
        triggerAction: "LOBBY",
        interventionId: F04D_VALIDATION_INTERVENTION_IDS.coerciveRestriction,
      },
    ],
  };
}
