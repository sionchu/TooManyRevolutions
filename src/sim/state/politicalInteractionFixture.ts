import { asScenarioId } from "./ids";
import {
  createF04DValidationScenario,
  type F04DValidationScenarioOptions,
  F04D_VALIDATION_INTERVENTION_IDS,
} from "./gate1fValidationFixture";
import { POLITICAL_CRISIS_FIXTURE_FACTION_IDS } from "./politicalCrisisFixture";
import type { ScenarioDefinition } from "./scenario";

/**
 * F05_FIX6-only content. The mapping is explicit fixture data rather than a
 * semantic rule inferred from faction interests or ideology.
 */
export function createF05Fix6PoliticalInteractionScenario(
  options: F04DValidationScenarioOptions = {},
): ScenarioDefinition {
  const baseScenario = createF04DValidationScenario(options);

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

/**
 * F05_FIX7 developer-only long-horizon composition. It deliberately reuses
 * the accepted FIX6 template verbatim; only the scenario identity changes so
 * the integration matrix cannot be confused with the eight-day slice.
 */
export function createF05Fix7PoliticalInteractionScenario(
  options: F04DValidationScenarioOptions = {},
): ScenarioDefinition {
  const baseScenario = createF05Fix6PoliticalInteractionScenario(options);

  return {
    ...baseScenario,
    id: asScenarioId("gate1f.f05.fix7.political-interaction"),
  };
}
