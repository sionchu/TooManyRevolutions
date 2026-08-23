import {
  createGameEvent,
  type GameEvent,
  type GameEventType,
} from "../events/event";
import type {
  SimulationPhaseContext,
  SimulationPhaseHook,
  SimulationPhaseResult,
} from "../core/step";
import {
  applyIdeologyAdjustment,
  type IdeologyAdjustment,
} from "../state/ideology";

const IDEOLOGY_EVENT_TYPES: Readonly<
  Record<IdeologyAdjustment["dimension"], GameEventType>
> = {
  support: "IDEOLOGY_SUPPORT_CHANGED",
  radicalism: "IDEOLOGY_RADICALISM_CHANGED",
  organization: "IDEOLOGY_ORGANIZATION_CHANGED",
};

function assertKnownCauses(
  adjustment: IdeologyAdjustment,
  knownEventIds: ReadonlySet<string>,
): void {
  if (adjustment.causeIds.length === 0) {
    throw new Error("Ideology adjustments require at least one cause event.");
  }

  for (const causeId of adjustment.causeIds) {
    if (!knownEventIds.has(causeId)) {
      throw new Error(
        `Ideology adjustment references an event that is not yet emitted: ${causeId}.`,
      );
    }
  }
}

/**
 * Resolve explicit political-state adjustments in the existing
 * `ideologyDiffusion` slot. This is a state substrate hook, not diffusion.
 */
export function runIdeologyAdjustmentPhase(
  context: SimulationPhaseContext,
  adjustments: readonly IdeologyAdjustment[],
): SimulationPhaseResult {
  if (context.phase !== "ideologyDiffusion") {
    throw new Error("Ideology adjustments must run during ideologyDiffusion.");
  }

  let currentWorld = context.world;
  let nextEventSequence = context.nextEventSequence;
  const emittedEvents: GameEvent[] = [];
  const knownEventIds = new Set<string>(
    context.emittedEvents.map((event) => event.id),
  );

  for (const adjustment of adjustments) {
    assertKnownCauses(adjustment, knownEventIds);

    const region = currentWorld.regions[adjustment.regionId];
    if (region === undefined) {
      throw new Error(
        `Ideology adjustment references missing region ${adjustment.regionId}.`,
      );
    }

    const adjustmentResult = applyIdeologyAdjustment(region, adjustment);
    if (!adjustmentResult.changed) {
      continue;
    }

    currentWorld = {
      ...currentWorld,
      regions: {
        ...currentWorld.regions,
        [adjustment.regionId]: adjustmentResult.nextRegion,
      },
    };

    const event = createGameEvent({
      tick: context.nextTick,
      sequence: nextEventSequence,
      type: IDEOLOGY_EVENT_TYPES[adjustment.dimension],
      actorId: adjustment.ideologyId,
      targetId: adjustment.regionId,
      causeIds: adjustment.causeIds,
      payload: {
        regionId: adjustment.regionId,
        ideologyId: adjustment.ideologyId,
        dimension: adjustment.dimension,
        previousValue: adjustmentResult.previousValue,
        nextValue: adjustmentResult.nextValue,
      },
      visibility: "world",
    });

    emittedEvents.push(event);
    knownEventIds.add(event.id);
    nextEventSequence += 1;
  }

  return {
    nextWorld: currentWorld,
    emittedEvents,
    nextEventSequence,
  };
}

/** Bind an immutable adjustment list to the T010 phase boundary. */
export function createIdeologyAdjustmentPhaseHook(
  adjustments: readonly IdeologyAdjustment[],
): SimulationPhaseHook {
  const capturedAdjustments = adjustments.map((adjustment) => ({
    ...adjustment,
    causeIds: [...adjustment.causeIds],
  }));

  return (context) => runIdeologyAdjustmentPhase(context, capturedAdjustments);
}
