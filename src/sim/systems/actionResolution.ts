import type {
  SimulationPhaseContext,
  SimulationPhaseHook,
  SimulationPhaseResult,
  SimulationStepInput,
} from "../core/step";
import type { GameEvent } from "../events/event";
import { runInterventionResolutionPhase } from "./intervention";
import { runPolicyPhase } from "./policy";
import type { ScenarioDefinition } from "../state/scenario";

/**
 * Dispatch policy and intervention actions one global ActionRecord at a time.
 * This keeps same-tick prerequisites and reservations sequence-sensitive while
 * preserving the existing T012 policy resolver.
 */
export function runPolicyAndInterventionResolutionPhase(
  context: SimulationPhaseContext,
  scenario: ScenarioDefinition,
): SimulationPhaseResult {
  if (context.phase !== "resolveValidatedActions") {
    throw new Error(
      "Policy/intervention resolution must run during resolveValidatedActions.",
    );
  }

  let currentWorld = context.world;
  let nextEventSequence = context.nextEventSequence;
  const emittedEvents: GameEvent[] = [];

  for (const action of context.input.actions) {
    if (
      action.actionType !== "ENACT_POLICY" &&
      action.actionType !== "START_INTERVENTION"
    ) {
      continue;
    }

    const singleActionInput: SimulationStepInput = { actions: [action] };
    const singleActionContext: SimulationPhaseContext = {
      ...context,
      world: currentWorld,
      input: singleActionInput,
      emittedEvents: [...context.emittedEvents, ...emittedEvents],
      nextEventSequence,
    };
    const result =
      action.actionType === "ENACT_POLICY"
        ? runPolicyPhase(singleActionContext, scenario)
        : runInterventionResolutionPhase(singleActionContext, scenario);

    currentWorld = result.nextWorld;
    nextEventSequence = result.nextEventSequence;
    emittedEvents.push(...result.emittedEvents);
  }

  return {
    nextWorld: currentWorld,
    emittedEvents,
    nextEventSequence,
  };
}

export function createPolicyAndInterventionPhaseHook(
  scenario: ScenarioDefinition,
): SimulationPhaseHook {
  return (context) =>
    runPolicyAndInterventionResolutionPhase(context, scenario);
}
