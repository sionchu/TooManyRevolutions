import type { SimulationPhaseContext } from "../core/step";
import { createGameEvent, type GameEvent } from "../events/event";
import {
  decodeFactionAction,
  type ValidatedActionRecord,
} from "../state/action";
import {
  createDeterministicPoliticalProposalId,
  createPoliticalProposalReconsiderationBasis,
  politicalProposalReconsiderationBasisEqual,
  type PoliticalProposal,
} from "../state/politicalProposal";
import { evaluateInterventionFeasibility } from "../state/intervention";
import type { ScenarioDefinition } from "../state/scenario";
import type { WorldState } from "../state/world";

export interface PoliticalProposalOpeningResult {
  readonly world: WorldState;
  readonly event: GameEvent | null;
  readonly nextEventSequence: number;
}

function findMatchingTemplate(
  scenario: ScenarioDefinition,
  factionId: string,
  actionType: string,
) {
  return (scenario.factionProposalTemplates ?? []).find(
    (template) =>
      template.factionId === factionId && template.triggerAction === actionType,
  );
}

function hasMatchingOpenProposal(
  world: WorldState,
  proposal: Pick<
    PoliticalProposal,
    "proposerFactionId" | "countryId" | "subjectKind" | "interventionId"
  >,
): boolean {
  return Object.values(world.politicalProposals ?? {}).some(
    (candidate) =>
      candidate.status === "open" &&
      candidate.proposerFactionId === proposal.proposerFactionId &&
      candidate.countryId === proposal.countryId &&
      candidate.subjectKind === proposal.subjectKind &&
      candidate.interventionId === proposal.interventionId,
  );
}

function sameDemandIdentity(
  first: Pick<
    PoliticalProposal,
    "proposerFactionId" | "countryId" | "subjectKind" | "interventionId"
  >,
  second: Pick<
    PoliticalProposal,
    "proposerFactionId" | "countryId" | "subjectKind" | "interventionId"
  >,
): boolean {
  return (
    first.proposerFactionId === second.proposerFactionId &&
    first.countryId === second.countryId &&
    first.subjectKind === second.subjectKind &&
    first.interventionId === second.interventionId
  );
}

function compareProposalEpisodes(
  first: PoliticalProposal,
  second: PoliticalProposal,
): number {
  const firstTick = first.resolvedAtTick ?? first.createdAtTick;
  const secondTick = second.resolvedAtTick ?? second.createdAtTick;
  if (firstTick !== secondTick) return firstTick - secondTick;
  return String(first.id).localeCompare(String(second.id));
}

function latestExplicitRejection(
  world: WorldState,
  demand: Pick<
    PoliticalProposal,
    "proposerFactionId" | "countryId" | "subjectKind" | "interventionId"
  >,
): PoliticalProposal | undefined {
  return Object.values(world.politicalProposals ?? {})
    .filter(
      (candidate) =>
        candidate.status === "rejected" &&
        candidate.resolutionReason === "explicitReject" &&
        sameDemandIdentity(candidate, demand),
    )
    .sort(compareProposalEpisodes)
    .at(-1);
}

/** Open only an explicitly authored LOBBY proposal; labels alone do nothing. */
export function openFactionLobbyProposal(
  context: SimulationPhaseContext,
  world: WorldState,
  action: ValidatedActionRecord,
  nextEventSequence: number,
): PoliticalProposalOpeningResult {
  if (
    context.phase !== "factionPressure" ||
    context.scenario === undefined ||
    action.actionType !== "LOBBY"
  ) {
    return { world, event: null, nextEventSequence };
  }

  const payload = decodeFactionAction(action);
  if (payload === null) {
    return { world, event: null, nextEventSequence };
  }

  const faction = world.factions[payload.factionId];
  const country =
    faction === undefined ? undefined : world.countries[faction.countryId];
  const targetGovernmentId = country?.currentGovernmentId;
  const targetGovernment =
    targetGovernmentId === null || targetGovernmentId === undefined
      ? undefined
      : world.governments[targetGovernmentId];
  const template = findMatchingTemplate(
    context.scenario,
    payload.factionId,
    action.actionType,
  );

  if (
    faction === undefined ||
    country === undefined ||
    targetGovernment === undefined ||
    template === undefined ||
    targetGovernment.countryId !== country.id
  ) {
    return { world, event: null, nextEventSequence };
  }

  const proposalShape = {
    proposerFactionId: faction.id,
    countryId: country.id,
    targetGovernmentId: targetGovernment.id,
    subjectKind: "interventionRequest" as const,
    interventionId: template.interventionId,
  };
  if (hasMatchingOpenProposal(world, proposalShape)) {
    return { world, event: null, nextEventSequence };
  }

  const currentFeasibility = evaluateInterventionFeasibility({
    scenario: context.scenario,
    world,
    interventionId: template.interventionId,
    countryId: country.id,
  });
  const currentBasis = createPoliticalProposalReconsiderationBasis(
    targetGovernment.id,
    currentFeasibility,
  );
  const latestRejection = latestExplicitRejection(world, proposalShape);
  if (
    latestRejection !== undefined &&
    politicalProposalReconsiderationBasisEqual(
      latestRejection.reconsiderationBasis,
      currentBasis,
    )
  ) {
    return { world, event: null, nextEventSequence };
  }

  const proposalId = createDeterministicPoliticalProposalId(action.id);
  if (world.politicalProposals?.[proposalId] !== undefined) {
    return { world, event: null, nextEventSequence };
  }

  const event = createGameEvent({
    tick: context.nextTick,
    sequence: nextEventSequence,
    type: "POLITICAL_PROPOSAL_OPENED",
    actorId: faction.id,
    targetId: targetGovernment.id,
    causeIds: [],
    payload: {
      proposalId,
      openingActionId: action.id,
      proposerFactionId: faction.id,
      countryId: country.id,
      targetGovernmentId: targetGovernment.id,
      subjectKind: proposalShape.subjectKind,
      interventionId: template.interventionId,
      createdAtTick: context.nextTick,
    },
    visibility: "world",
  });
  const proposal: PoliticalProposal = {
    id: proposalId,
    ...proposalShape,
    status: "open",
    createdAtTick: context.nextTick,
    openingActionId: action.id,
    openingEventId: event.id,
  };

  return {
    world: {
      ...world,
      politicalProposals: {
        ...(world.politicalProposals ?? {}),
        [proposal.id]: proposal,
      },
    },
    event,
    nextEventSequence: nextEventSequence + 1,
  };
}
