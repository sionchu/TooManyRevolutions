import { commitSimulationStep } from "../sim/core/persistence";
import type { RunRecord } from "../sim/core/step";
import { runSimulationStep } from "../sim/core/tick";
import { createEventStore } from "../sim/events/eventStore";
import {
  acceptActionProposal,
  acceptActionProposals,
  decodeDiplomacyAction,
  decodeFactionAction,
  decodeTargetedFactionFundMovementAction,
  DIPLOMACY_ACTION_TYPES,
  FACTION_ACTION_TYPES,
  createEnactPolicyActionProposal,
  createStartInterventionActionProposal,
  type ActionProposal,
} from "../sim/state/action";
import { createInitialWorldState } from "../sim/state/world";
import { GAMEBUILDERS_DEMO_SCENARIO } from "../sim/state/gameBuildersDemoScenario";
import type { CountryId, InterventionId, PolicyId } from "../sim/state/ids";
import { createIdeologyDiffusionPhaseHook } from "../sim/systems/ideologyDiffusion";
import { createInterventionPhaseHooks } from "../sim/systems/interventionHooks";

export const GAMEBUILDERS_DEMO_SEED = 18970401;

const DEMO_HOOKS = {
  ...createInterventionPhaseHooks(GAMEBUILDERS_DEMO_SCENARIO),
  ideologyDiffusion: createIdeologyDiffusionPhaseHook(
    GAMEBUILDERS_DEMO_SCENARIO,
  ),
};

/**
 * Product-runtime envelope for non-persistent system proposals. The
 * authoritative WorldState and EventStore remain the existing RunRecord;
 * proposals are carried only until the next common ActionRecord intake.
 */
export interface DemoRuntimeState extends RunRecord {
  readonly pendingSystemProposals: readonly ActionProposal[];
}

function proposalKey(proposal: ActionProposal): string {
  return JSON.stringify([
    proposal.tick,
    proposal.source,
    proposal.actionType,
    proposal.schemaVersion,
    proposal.payload,
  ]);
}

function isOneOf<T extends readonly string[]>(
  values: T,
  value: string,
): value is T[number] {
  return values.some((candidate) => candidate === value);
}

function isSystemProposalForNextTick(
  proposal: ActionProposal,
  state: DemoRuntimeState,
): boolean {
  if (proposal.source === "player" || proposal.tick !== state.world.tick + 1) {
    return false;
  }

  let accepted;
  try {
    accepted = acceptActionProposal(proposal, 0);
  } catch {
    return false;
  }

  if (isOneOf(FACTION_ACTION_TYPES, proposal.actionType)) {
    const targeted = decodeTargetedFactionFundMovementAction(accepted);
    const payload = targeted ?? decodeFactionAction(accepted);
    return (
      payload !== null && state.world.factions[payload.factionId] !== undefined
    );
  }

  if (isOneOf(DIPLOMACY_ACTION_TYPES, proposal.actionType)) {
    const payload = decodeDiplomacyAction(accepted);
    return (
      payload !== null &&
      state.world.countries[payload.actorCountryId] !== undefined &&
      (payload.targetCountryId === undefined ||
        state.world.countries[payload.targetCountryId] !== undefined)
    );
  }

  return false;
}

function retainSystemProposals(
  proposals: readonly ActionProposal[],
  state: DemoRuntimeState,
): readonly ActionProposal[] {
  const seen = new Set<string>();
  const retained: ActionProposal[] = [];
  for (const proposal of proposals) {
    if (!isSystemProposalForNextTick(proposal, state)) continue;
    const key = proposalKey(proposal);
    if (seen.has(key)) continue;
    seen.add(key);
    retained.push(proposal);
  }
  return retained;
}

export function createDemoRunRecord(): RunRecord {
  return {
    world: createInitialWorldState(
      GAMEBUILDERS_DEMO_SCENARIO,
      GAMEBUILDERS_DEMO_SEED,
    ),
    eventStore: createEventStore(),
  };
}

export function createDemoRuntimeState(): DemoRuntimeState {
  return {
    ...createDemoRunRecord(),
    pendingSystemProposals: [],
  };
}

/** Rehydrate a runtime envelope after a normal V8 RunRecord load. */
export function createDemoRuntimeStateFromRecord(
  record: RunRecord,
  pendingSystemProposals: readonly ActionProposal[] = [],
): DemoRuntimeState {
  const state: DemoRuntimeState = {
    ...record,
    pendingSystemProposals: [],
  };
  return {
    ...state,
    pendingSystemProposals: retainSystemProposals(
      pendingSystemProposals,
      state,
    ),
  };
}

/** Run one demo day with player proposals first and carried system proposals second. */
export function runDemoRuntimeStep(
  state: DemoRuntimeState,
  playerProposals: readonly ActionProposal[] = [],
): DemoRuntimeState {
  const nextTick = state.world.tick + 1;
  const normalizedPlayerProposals = playerProposals.map((proposal) => ({
    ...proposal,
    tick: nextTick,
    source: "player" as const,
  }));
  const carriedSystemProposals = state.pendingSystemProposals.filter(
    (proposal) => proposal.tick === nextTick,
  );
  const proposals = [...normalizedPlayerProposals, ...carriedSystemProposals];
  const actions = acceptActionProposals(
    proposals,
    state.world.run.nextActionSequence,
  );
  const result = runSimulationStep(
    state.world,
    { actions },
    DEMO_HOOKS,
    GAMEBUILDERS_DEMO_SCENARIO,
  );
  const committed = commitSimulationStep(
    GAMEBUILDERS_DEMO_SCENARIO,
    state,
    result,
  );
  const nextState: DemoRuntimeState = {
    ...committed,
    pendingSystemProposals: [],
  };
  return {
    ...nextState,
    pendingSystemProposals: retainSystemProposals(
      result.actionProposals,
      nextState,
    ),
  };
}

export function advanceDemoRuntime(
  state: DemoRuntimeState,
  days: number,
): DemoRuntimeState {
  if (!Number.isInteger(days) || days < 0) {
    throw new Error("Demo advance days must be a non-negative integer.");
  }

  let current = state;
  for (let index = 0; index < days; index += 1) {
    if (current.world.run.outcome.status !== "active") break;
    current = runDemoRuntimeStep(current);
  }
  return current;
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

export function submitRuntimeIntervention(
  state: DemoRuntimeState,
  interventionId: InterventionId,
): DemoRuntimeState {
  const playerCountryId = GAMEBUILDERS_DEMO_SCENARIO.playerCountryId;
  const proposal = createStartInterventionActionProposal(
    state.world.tick + 1,
    "player",
    interventionId,
    playerCountryId ?? undefined,
  );
  return runDemoRuntimeStep(state, [proposal]);
}

export function submitRuntimePolicy(
  state: DemoRuntimeState,
  policyId: PolicyId,
  countryId: CountryId = GAMEBUILDERS_DEMO_SCENARIO.playerCountryId as CountryId,
): DemoRuntimeState {
  return runDemoRuntimeStep(state, [
    createEnactPolicyActionProposal(
      state.world.tick + 1,
      "player",
      policyId,
      countryId,
    ),
  ]);
}
