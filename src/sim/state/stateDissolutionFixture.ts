import { asScenarioId } from "./ids";
import { createContactFixtureScenario } from "./contactFixture";
import type { DissolutionCriteria, ScenarioDefinition } from "./scenario";

/** Diagnostic-only T023 criteria; this is not production balance or T025 content. */
export const T023_STATE_DISSOLUTION_CRITERIA: DissolutionCriteria = {
  stateContinuityAtOrBelow: 0,
  fullAnnexationIsTerminal: true,
  permanentFragmentationIsTerminal: true,
  sovereignFunctionsRequiredForContinuity: [],
};

/** Existing contact topology with the T023 criteria made explicit for inspection. */
export function createT023StateDissolutionScenario(): ScenarioDefinition {
  const base = createContactFixtureScenario();

  return {
    ...base,
    id: asScenarioId("t023.state-dissolution-fixture"),
    dissolutionCriteria: T023_STATE_DISSOLUTION_CRITERIA,
  };
}
