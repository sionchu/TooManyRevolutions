import { asScenarioId } from "./ids";
import { createF05Fix7PoliticalInteractionScenario } from "./politicalInteractionFixture";
import type { ScenarioDefinition } from "./scenario";
import { POLITICAL_CRISIS_FIXTURE_FACTION_IDS } from "./politicalCrisisFixture";

/** Developer-only F05_FIX13 composition; historical F05 fixtures stay unchanged. */
export function createF05Fix13TargetedCommitmentScenario(): ScenarioDefinition {
  const baseScenario = createF05Fix7PoliticalInteractionScenario();
  const capital = baseScenario.initialRegions[0];
  const industrial = baseScenario.initialRegions[1];

  if (capital === undefined || industrial === undefined) {
    throw new Error("F05_FIX13 fixture regions are missing.");
  }

  return {
    ...baseScenario,
    id: asScenarioId("gate1f.f05.fix13.targeted-commitment"),
    initialFactions: baseScenario.initialFactions.map((faction) => ({
      ...faction,
      // Synthetic profile-enabled pressure only; the historical F05 fixture
      // and its population remain untouched.
      resources: 0.8,
      organization: 0.8,
      grievance: 0.8,
    })),
    factionFundMovementTemplates: [
      {
        factionId: POLITICAL_CRISIS_FIXTURE_FACTION_IDS.coup,
        targetRegionId: capital.id,
        resourceAmount: 0.25,
      },
      {
        factionId: POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion,
        targetRegionId: industrial.id,
        resourceAmount: 0.3,
      },
    ],
  };
}
