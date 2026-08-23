import type { SimulationPhaseHooks } from "../core/step";
import type { ScenarioDefinition } from "../state/scenario";
import { createEconomyPhaseHook } from "./economy";
import { createInterventionCompletionPhaseHook } from "./intervention";
import { createPolicyAndInterventionPhaseHook } from "./actionResolution";

/** Bind the complete T016B slice to the existing fixed pipeline. */
export function createInterventionPhaseHooks(
  scenario: ScenarioDefinition,
): SimulationPhaseHooks {
  return {
    applyScheduledEffects: createInterventionCompletionPhaseHook(scenario),
    resolveValidatedActions: createPolicyAndInterventionPhaseHook(scenario),
    economy: createEconomyPhaseHook(scenario),
  };
}
