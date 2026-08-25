import { createGameEvent, type GameEvent } from "../events/event";
import { advanceSimDate } from "../core/clock";
import type { JsonValue } from "../core/serialization";
import type {
  SimulationPhaseContext,
  SimulationPhaseResult,
} from "../core/step";
import { asConflictId, type ConflictId } from "../state/ids";
import type { Conflict, ConflictKind } from "../state/conflict";
import type { RebellionPersistenceProfile } from "../state/rebellionPersistence";
import type { ScenarioDefinition } from "../state/scenario";
import type {
  CrisisGate,
  CoupPrerequisiteSnapshot,
  RebellionPrerequisiteSnapshot,
} from "./politicalCrisis";
import { derivePoliticalCrisisPrerequisites } from "./politicalCrisis";
import {
  isConflictResolutionBoundary,
  resolveTerritorialConflictIntents,
  deriveConflictIntents,
  suppressIneligibleRebellions,
} from "./conflictResolution";

type EligibleCrisis = CoupPrerequisiteSnapshot | RebellionPrerequisiteSnapshot;

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function compareCrisisCandidates(
  first: EligibleCrisis,
  second: EligibleCrisis,
): number {
  const countryOrder = compareStableText(first.countryId, second.countryId);
  if (countryOrder !== 0) {
    return countryOrder;
  }

  const firstKindOrder = first.kind === "coup" ? 0 : 1;
  const secondKindOrder = second.kind === "coup" ? 0 : 1;
  if (firstKindOrder !== secondKindOrder) {
    return firstKindOrder - secondKindOrder;
  }

  const factionOrder = compareStableText(first.factionId, second.factionId);
  if (factionOrder !== 0) {
    return factionOrder;
  }

  return compareStableText(
    first.affectedRegionIds[0] ?? "",
    second.affectedRegionIds[0] ?? "",
  );
}

function conflictIdFor(candidate: EligibleCrisis, tick: number) {
  return asConflictId(
    `conflict:t018:${JSON.stringify([
      tick,
      candidate.kind,
      candidate.countryId,
      candidate.factionId,
    ])}`,
  );
}

function hasActiveDuplicate(
  conflicts: Readonly<Record<ConflictId, Conflict>>,
  candidate: EligibleCrisis,
): boolean {
  return Object.values(conflicts).some(
    (conflict) =>
      conflict.status === "active" &&
      conflict.kind === candidate.kind &&
      conflict.participantCountryIds.includes(candidate.countryId) &&
      conflict.participantFactionIds.includes(candidate.factionId),
  );
}

function findExactRebellionPersistenceProfile(
  scenario: ScenarioDefinition,
  candidate: EligibleCrisis,
): RebellionPersistenceProfile | undefined {
  if (candidate.kind !== "rebellion") {
    return undefined;
  }

  const matches = (scenario.rebellionPersistenceProfiles ?? []).filter(
    (profile) =>
      profile.countryId === candidate.countryId &&
      profile.factionId === candidate.factionId,
  );

  if (matches.length > 1) {
    throw new Error(
      `T018 rebellion ${candidate.countryId}/${candidate.factionId} has ambiguous persistence profiles.`,
    );
  }

  return matches[0];
}

function serializeGate(gate: CrisisGate): {
  readonly id: string;
  readonly status: string;
  readonly value: number | boolean;
  readonly threshold?: number;
  readonly reason: string;
} {
  if (gate.threshold === undefined) {
    return {
      id: gate.id,
      status: gate.status,
      value: gate.value,
      reason: gate.reason,
    };
  }

  return {
    id: gate.id,
    status: gate.status,
    value: gate.value,
    threshold: gate.threshold,
    reason: gate.reason,
  };
}

function isJsonObject(
  value: JsonValue,
): value is { readonly [key: string]: JsonValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function completionCauseIdsForCandidate(
  events: readonly GameEvent[],
  candidate: EligibleCrisis,
): readonly GameEvent["id"][] {
  return events
    .filter((event) => event.type === "INTERVENTION_COMPLETED")
    .filter((event) => {
      if (
        !isJsonObject(event.payload) ||
        !Array.isArray(event.payload.effects)
      ) {
        return false;
      }

      return event.payload.effects.some(
        (effect) =>
          isJsonObject(effect) &&
          (effect.kind === "factionGrievanceDelta" ||
            effect.kind === "factionOrganizationDelta") &&
          effect.factionId === candidate.factionId &&
          effect.changed === true,
      );
    })
    .map((event) => event.id);
}

function createCrisisEvent(
  candidate: EligibleCrisis,
  conflict: Conflict,
  tick: number,
  sequence: number,
  causeIds: readonly GameEvent["id"][],
): GameEvent {
  const type =
    candidate.kind === "coup" ? "COUP_ATTEMPT_STARTED" : "REBELLION_STARTED";
  const regionalEvidence =
    candidate.kind === "rebellion"
      ? candidate.regionalSignals.map((signal) => ({
          regionId: signal.regionId,
          population: signal.population,
          factionPresence: signal.factionPresence,
          affinityWeightedSupport: signal.affinityWeightedSupport,
          localRadicalism: signal.localRadicalism,
          localIdeologyOrganization: signal.localIdeologyOrganization,
          localUnrest: signal.localUnrest,
          mobilizationReadiness: signal.mobilizationReadiness,
          localMobilizationGate: signal.localMobilizationGate,
        }))
      : [];

  return createGameEvent({
    tick,
    sequence,
    type,
    actorId: candidate.factionId,
    targetId: candidate.countryId,
    causeIds,
    payload: {
      conflictId: conflict.id,
      kind: candidate.kind,
      countryId: candidate.countryId,
      factionId: candidate.factionId,
      affectedRegionIds: [...candidate.affectedRegionIds],
      requiredGates: candidate.gates.map(serializeGate),
      stateWeakness: { ...candidate.stateWeakness },
      futureEvidence: candidate.futureEvidence.map((evidence) => ({
        id: evidence.id,
        status: evidence.status,
      })),
      ...(candidate.kind === "coup"
        ? {
            supportingSignals: { ...candidate.supportingSignals },
          }
        : {
            geographicConcentration: candidate.geographicConcentration,
            qualifiedRegionIds: [...candidate.qualifiedRegionIds],
            regionalEvidence,
            supportingSignals: {
              factionResources: candidate.supportingSignals.factionResources,
              currentStrategy: candidate.supportingSignals.currentStrategy,
              factionControlledRegionIds: [
                ...candidate.supportingSignals.factionControlledRegionIds,
              ],
              maximumAffinityWeightedSupport:
                candidate.supportingSignals.maximumAffinityWeightedSupport,
            },
          }),
    },
    visibility: "important",
  });
}

/**
 * T018 detection and T021 territorial resolution share one conflict phase.
 * Territorial intents are always derived from the phase-start WorldState;
 * newly detected crises cannot resolve territory until a later boundary.
 */
export function runConflictPhase(
  context: SimulationPhaseContext,
): SimulationPhaseResult {
  if (context.phase !== "conflict") {
    throw new Error("Conflict must run during conflict phase.");
  }

  const scenario = context.scenario;
  if (scenario === undefined) {
    return {
      nextWorld: context.world,
      emittedEvents: [],
      nextEventSequence: context.nextEventSequence,
    };
  }

  const phaseStartWorld = context.world;
  const prerequisites = derivePoliticalCrisisPrerequisites(
    scenario,
    phaseStartWorld,
  );

  const suppression = suppressIneligibleRebellions(
    scenario,
    phaseStartWorld,
    context.nextTick,
    context.nextEventSequence,
    prerequisites.rebellions,
  );

  let currentWorld = suppression.nextWorld;
  let nextEventSequence = suppression.nextEventSequence;
  const emittedEvents: GameEvent[] = [...suppression.emittedEvents];

  const resolution = isConflictResolutionBoundary(
    context.nextTick,
    advanceSimDate(phaseStartWorld.date),
  )
    ? resolveTerritorialConflictIntents(
        scenario,
        phaseStartWorld,
        currentWorld,
        deriveConflictIntents(scenario, phaseStartWorld),
        context.nextTick,
        nextEventSequence,
        [...context.emittedEvents, ...emittedEvents].map((event) => event.id),
      )
    : null;

  if (resolution !== null) {
    currentWorld = resolution.nextWorld;
    nextEventSequence = resolution.nextEventSequence;
    emittedEvents.push(...resolution.emittedEvents);
  }

  const eligibleCandidates = [
    ...prerequisites.coups.filter((snapshot) => snapshot.eligible),
    ...prerequisites.rebellions.filter((snapshot) => snapshot.eligible),
  ].sort(compareCrisisCandidates);

  let nextConflicts = currentWorld.conflicts;
  let conflictsChanged = false;
  let nextRebellionPersistenceEpisodes =
    currentWorld.rebellionPersistenceEpisodes;
  let rebellionPersistenceEpisodesChanged = false;

  for (const candidate of eligibleCandidates) {
    if (hasActiveDuplicate(nextConflicts, candidate)) {
      continue;
    }

    const conflictId = conflictIdFor(candidate, context.nextTick);
    if (nextConflicts[conflictId] !== undefined) {
      throw new Error(
        `T018 conflict ID collision for ${conflictId}; refusing ambiguous crisis creation.`,
      );
    }

    const conflict: Conflict = {
      id: conflictId,
      kind: candidate.kind as ConflictKind,
      status: "active",
      participantCountryIds: [candidate.countryId],
      participantFactionIds: [candidate.factionId],
      affectedRegionIds: [...candidate.affectedRegionIds],
      contestedRegionIds: [],
      startedAtTick: context.nextTick,
    };
    const persistenceProfile = findExactRebellionPersistenceProfile(
      scenario,
      candidate,
    );

    nextConflicts = {
      ...nextConflicts,
      [conflict.id]: conflict,
    };
    conflictsChanged = true;
    const startEvent = createCrisisEvent(
      candidate,
      conflict,
      context.nextTick,
      nextEventSequence,
      completionCauseIdsForCandidate(context.emittedEvents, candidate),
    );
    emittedEvents.push(startEvent);

    if (persistenceProfile !== undefined) {
      const existingEpisodes = nextRebellionPersistenceEpisodes ?? {};
      if (existingEpisodes[conflict.id] !== undefined) {
        throw new Error(
          `T018 rebellion ${conflict.id} already has a persistence episode.`,
        );
      }

      nextRebellionPersistenceEpisodes = {
        ...existingEpisodes,
        [conflict.id]: {
          conflictId: conflict.id,
          profileId: persistenceProfile.id,
          countryId: candidate.countryId,
          factionId: candidate.factionId,
          bootstrappedAtTick: startEvent.tick,
          sourceEventId: startEvent.id,
        },
      };
      rebellionPersistenceEpisodesChanged = true;
    }
    nextEventSequence += 1;
  }

  if (!conflictsChanged && emittedEvents.length === 0) {
    return {
      nextWorld: currentWorld,
      emittedEvents: [],
      nextEventSequence: context.nextEventSequence,
    };
  }

  return {
    nextWorld: {
      ...currentWorld,
      conflicts: nextConflicts,
      ...(rebellionPersistenceEpisodesChanged
        ? { rebellionPersistenceEpisodes: nextRebellionPersistenceEpisodes }
        : {}),
    },
    emittedEvents,
    nextEventSequence,
  };
}
