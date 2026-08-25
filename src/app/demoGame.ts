import { commitSimulationStep } from "../sim/core/persistence";
import type { RunRecord } from "../sim/core/step";
import { runSimulationStep } from "../sim/core/tick";
import { createEventStore } from "../sim/events/eventStore";
import {
  acceptActionProposal,
  createStartInterventionActionProposal,
  type ActionProposal,
} from "../sim/state/action";
import { createInitialWorldState } from "../sim/state/world";
import { GAMEBUILDERS_DEMO_SCENARIO } from "../sim/state/gameBuildersDemoScenario";
import type { InterventionId } from "../sim/state/ids";
import { createInterventionPhaseHooks } from "../sim/systems/interventionHooks";

export const GAMEBUILDERS_DEMO_SEED = 18970401;

const DEMO_HOOKS = createInterventionPhaseHooks(GAMEBUILDERS_DEMO_SCENARIO);

export function createDemoRunRecord(): RunRecord {
  return {
    world: createInitialWorldState(
      GAMEBUILDERS_DEMO_SCENARIO,
      GAMEBUILDERS_DEMO_SEED,
    ),
    eventStore: createEventStore(),
  };
}

export function runDemoStep(
  record: RunRecord,
  proposals: readonly ActionProposal[] = [],
): RunRecord {
  const nextTick = record.world.tick + 1;
  const actions = proposals.map((proposal, index) =>
    acceptActionProposal(
      { ...proposal, tick: nextTick },
      record.world.run.nextActionSequence + index,
    ),
  );
  const result = runSimulationStep(
    record.world,
    { actions },
    DEMO_HOOKS,
    GAMEBUILDERS_DEMO_SCENARIO,
  );

  return commitSimulationStep(GAMEBUILDERS_DEMO_SCENARIO, record, result);
}

export function advanceDemoRecord(record: RunRecord, days: number): RunRecord {
  if (!Number.isInteger(days) || days < 0) {
    throw new Error("Demo advance days must be a non-negative integer.");
  }

  let current = record;
  for (let index = 0; index < days; index += 1) {
    if (current.world.run.outcome.status !== "active") {
      break;
    }
    current = runDemoStep(current);
  }

  return current;
}

export function submitIntervention(
  record: RunRecord,
  interventionId: InterventionId,
): RunRecord {
  const playerCountryId = GAMEBUILDERS_DEMO_SCENARIO.playerCountryId;
  const proposal = createStartInterventionActionProposal(
    record.world.tick + 1,
    "player",
    interventionId,
    playerCountryId ?? undefined,
  );

  return runDemoStep(record, [proposal]);
}
