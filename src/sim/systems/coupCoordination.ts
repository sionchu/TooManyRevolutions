import type {
  SimulationPhaseContext,
  SimulationPhaseResult,
} from "../core/step";
import { createGameEvent, type GameEvent } from "../events/event";
import {
  COUP_COORDINATION_RESPONSE_ACTION_SCHEMA_VERSION,
  decodeCoupCoordinationResponseAction,
  COUP_COORDINATION_RESPONSE_ACTION_TYPE,
  type ValidatedActionRecord,
} from "../state/action";
import type { Conflict, ConflictOutcome } from "../state/conflict";
import {
  COUP_COORDINATION_RESPONSE_REJECTION_REASONS,
  findCoupCoordinationProfilesForConflict,
  type CoupCoordinationProfile,
  type CoupCoordinationAlignment,
  type CoupCoordinationResponseState,
  type CoupCoordinationResponseStateMap,
  type CoupCoordinationResponseRejectionReason,
} from "../state/coupCoordination";
import type { ConflictId, CoupCoordinationNodeId } from "../state/ids";
import type { ScenarioDefinition } from "../state/scenario";
import { applyConflictOutcome } from "./conflictResolution";

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

interface CoupCoordinationResponseRejectionIdentity {
  readonly conflictId?: ConflictId;
  readonly nodeId?: CoupCoordinationNodeId;
  readonly alignment?: CoupCoordinationAlignment;
}

function createCoupCoordinationResponseRejectionEvent(
  context: SimulationPhaseContext,
  sequence: number,
  action: ValidatedActionRecord,
  reason: CoupCoordinationResponseRejectionReason,
  identity: CoupCoordinationResponseRejectionIdentity = {},
): GameEvent {
  return createGameEvent({
    tick: context.nextTick,
    sequence,
    type: "COUP_COORDINATION_RESPONSE_REJECTED",
    ...(identity.nodeId === undefined ? {} : { actorId: identity.nodeId }),
    ...(identity.conflictId === undefined
      ? {}
      : { targetId: identity.conflictId }),
    causeIds: [],
    payload: {
      actionId: action.id,
      reason,
      ...(identity.alignment === undefined
        ? {}
        : { alignment: identity.alignment }),
      ...(identity.conflictId === undefined
        ? {}
        : { conflictId: identity.conflictId }),
      ...(identity.nodeId === undefined ? {} : { nodeId: identity.nodeId }),
    },
    visibility: "important",
  });
}

function getUniqueProfile(
  scenario: ScenarioDefinition,
  conflict: Conflict,
): CoupCoordinationProfile | null {
  if (conflict.kind !== "coup") {
    return null;
  }

  const profiles = findCoupCoordinationProfilesForConflict(scenario, conflict);
  return profiles.length === 1 ? profiles[0]! : null;
}

function hasValidProfileReferences(
  scenario: ScenarioDefinition,
  profile: CoupCoordinationProfile,
): boolean {
  const nodes = scenario.coupCoordinationNodes ?? [];
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const country = scenario.initialCountries.find(
    (candidate) => candidate.id === profile.countryId,
  );
  const faction = scenario.initialFactions.find(
    (candidate) => candidate.id === profile.coupFactionId,
  );
  const successorGovernment = scenario.initialGovernments.find(
    (candidate) => candidate.id === profile.successorGovernmentId,
  );
  const requiredNodeIds = new Set(profile.requiredNodeIds);
  if (
    requiredNodeIds.size !== profile.requiredNodeIds.length ||
    requiredNodeIds.size === 0 ||
    country === undefined ||
    faction === undefined ||
    faction.countryId !== profile.countryId ||
    !(scenario.factionCapabilities?.[profile.coupFactionId] ?? []).includes(
      "coup",
    ) ||
    successorGovernment === undefined ||
    successorGovernment.countryId !== profile.countryId
  ) {
    return false;
  }

  return profile.requiredNodeIds.every((nodeId) => {
    const node = nodeById.get(nodeId);
    return node !== undefined && node.countryId === profile.countryId;
  });
}

function validateGovernmentTransitionTarget(
  world: SimulationPhaseContext["world"],
  conflict: Conflict,
  profile: CoupCoordinationProfile,
): boolean {
  const country = world.countries[profile.countryId];
  const successorGovernment = world.governments[profile.successorGovernmentId];
  return (
    country !== undefined &&
    conflict.participantCountryIds.includes(profile.countryId) &&
    successorGovernment !== undefined &&
    successorGovernment.countryId === profile.countryId &&
    successorGovernment.id !== country.currentGovernmentId
  );
}

function sortedResponseStates(
  responses: Readonly<Record<string, CoupCoordinationResponseState>>,
): readonly CoupCoordinationResponseState[] {
  return Object.values(responses).sort((first, second) => {
    const tickOrder = first.respondedAtTick - second.respondedAtTick;
    return tickOrder !== 0
      ? tickOrder
      : compareStableText(first.eventId, second.eventId);
  });
}

function allKnownResponseEventIds(
  responses: CoupCoordinationResponseStateMap | undefined,
): readonly GameEvent["id"][] {
  return Object.values(responses ?? {})
    .flatMap((byNode) => Object.values(byNode))
    .map((response) => response.eventId);
}

function evaluateOutcome(
  world: SimulationPhaseContext["world"],
  conflict: Conflict,
  profile: CoupCoordinationProfile,
  responses: Readonly<
    Record<CoupCoordinationNodeId, CoupCoordinationResponseState>
  >,
): ConflictOutcome | null {
  const requiredResponses = profile.requiredNodeIds.map(
    (nodeId) => responses[nodeId],
  );
  if (
    requiredResponses.some((response) => response?.alignment === "incumbent")
  ) {
    return {
      kind: "statusQuo",
      winner: { kind: "country", countryId: profile.countryId },
    };
  }

  if (
    requiredResponses.length > 0 &&
    requiredResponses.every((response) => response?.alignment === "coup")
  ) {
    const country = world.countries[profile.countryId];
    if (
      country === undefined ||
      !validateGovernmentTransitionTarget(world, conflict, profile)
    ) {
      return null;
    }

    return {
      kind: "governmentTransition",
      countryId: profile.countryId,
      previousGovernmentId: country.currentGovernmentId,
      nextGovernmentId: profile.successorGovernmentId,
      winner: { kind: "faction", factionId: profile.coupFactionId },
    };
  }

  return null;
}

/**
 * Consume only explicit COUP_COORDINATION_RESPONSE ActionRecords. No
 * producer, timer, random decision, or scalar alignment writer lives here.
 */
export function runCoupCoordinationResponsePhase(
  context: SimulationPhaseContext,
  scenario: ScenarioDefinition,
): SimulationPhaseResult {
  if (context.phase !== "resolveValidatedActions") {
    throw new Error(
      "Coup Coordination response resolution must run during resolveValidatedActions.",
    );
  }

  let currentWorld = context.world;
  let nextEventSequence = context.nextEventSequence;
  const emittedEvents: GameEvent[] = [];

  const reject = (
    action: ValidatedActionRecord,
    reason: CoupCoordinationResponseRejectionReason,
    identity?: CoupCoordinationResponseRejectionIdentity,
  ): void => {
    if (!COUP_COORDINATION_RESPONSE_REJECTION_REASONS.includes(reason)) {
      throw new Error(
        `Unknown Coup Coordination response rejection: ${reason}`,
      );
    }

    const event = createCoupCoordinationResponseRejectionEvent(
      context,
      nextEventSequence,
      action,
      reason,
      identity,
    );
    emittedEvents.push(event);
    nextEventSequence += 1;
    currentWorld = {
      ...currentWorld,
      run: {
        ...currentWorld.run,
        nextEventSequence,
      },
    };
  };

  for (const action of context.input.actions) {
    if (action.actionType !== COUP_COORDINATION_RESPONSE_ACTION_TYPE) {
      continue;
    }

    const payload = decodeCoupCoordinationResponseAction(action);
    if (payload === null) {
      reject(
        action,
        action.schemaVersion ===
          COUP_COORDINATION_RESPONSE_ACTION_SCHEMA_VERSION
          ? "invalidPayload"
          : "unsupportedSchemaVersion",
      );
      continue;
    }

    const conflict = currentWorld.conflicts[payload.conflictId];
    if (conflict === undefined) {
      reject(action, "missingConflict", payload);
      continue;
    }
    if (conflict.status !== "active") {
      reject(action, "conflictResolved", payload);
      continue;
    }
    if (conflict.kind !== "coup") {
      reject(action, "nonCoupConflict", payload);
      continue;
    }

    const profile = getUniqueProfile(scenario, conflict);
    if (profile === null) {
      reject(action, "missingOrAmbiguousProfile", payload);
      continue;
    }
    if (!hasValidProfileReferences(scenario, profile)) {
      reject(action, "invalidProfileReferences", payload);
      continue;
    }
    if (!profile.requiredNodeIds.includes(payload.nodeId)) {
      reject(action, "nonRequiredNode", payload);
      continue;
    }

    const node = (scenario.coupCoordinationNodes ?? []).find(
      (candidate) => candidate.id === payload.nodeId,
    );
    if (node === undefined || node.countryId !== profile.countryId) {
      reject(action, "invalidProfileReferences", payload);
      continue;
    }

    const previousResponses = currentWorld.coupCoordinationResponses ?? {};
    const previousByNode = previousResponses[payload.conflictId] ?? {};
    if (previousByNode[payload.nodeId] !== undefined) {
      reject(action, "duplicateResponse", payload);
      continue;
    }

    const finalAllCoup = profile.requiredNodeIds.every((nodeId) =>
      nodeId === payload.nodeId
        ? payload.alignment === "coup"
        : previousByNode[nodeId]?.alignment === "coup",
    );
    if (
      finalAllCoup &&
      !validateGovernmentTransitionTarget(currentWorld, conflict, profile)
    ) {
      reject(action, "staleSuccessorGovernment", payload);
      continue;
    }

    const event = createGameEvent({
      tick: context.nextTick,
      sequence: nextEventSequence,
      type: "COUP_COORDINATION_NODE_RESPONDED",
      actorId: payload.nodeId,
      targetId: payload.conflictId,
      causeIds: [],
      payload: {
        actionId: action.id,
        alignment: payload.alignment,
        conflictId: payload.conflictId,
        nodeId: payload.nodeId,
      },
      visibility: "important",
    });

    const response: CoupCoordinationResponseState = {
      conflictId: payload.conflictId,
      nodeId: payload.nodeId,
      alignment: payload.alignment,
      actionId: action.id,
      eventId: event.id,
      respondedAtTick: context.nextTick,
    };
    const nextByNode = {
      ...previousByNode,
      [payload.nodeId]: response,
    };
    const nextResponses = {
      ...previousResponses,
      [payload.conflictId]: nextByNode,
    } as CoupCoordinationResponseStateMap;
    const responseWorld = {
      ...currentWorld,
      coupCoordinationResponses: nextResponses,
      run: {
        ...currentWorld.run,
        nextEventSequence: nextEventSequence + 1,
      },
    };

    const outcome = evaluateOutcome(
      responseWorld,
      conflict,
      profile,
      nextByNode,
    );

    const acceptedEvents = [...emittedEvents, event];
    const responseCauseIds = sortedResponseStates(nextByNode).map(
      (acceptedResponse) => acceptedResponse.eventId,
    );
    if (outcome === null) {
      currentWorld = responseWorld;
      emittedEvents.push(event);
      nextEventSequence += 1;
      continue;
    }

    const outcomeResult = applyConflictOutcome(responseWorld, {
      conflictId: payload.conflictId,
      outcome,
      tick: context.nextTick,
      causeIds: responseCauseIds,
      knownCauseIds: [
        ...context.emittedEvents.map((knownEvent) => knownEvent.id),
        ...acceptedEvents.map((knownEvent) => knownEvent.id),
        ...allKnownResponseEventIds(currentWorld.coupCoordinationResponses),
        ...allKnownResponseEventIds(nextResponses),
      ],
    });

    currentWorld = outcomeResult.nextWorld;
    emittedEvents.push(event, ...outcomeResult.emittedEvents);
    nextEventSequence = outcomeResult.nextEventSequence;
  }

  return {
    nextWorld: currentWorld,
    emittedEvents,
    nextEventSequence,
  };
}
