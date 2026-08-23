import { createGameEvent, type GameEvent } from "../events/event";
import type {
  SimulationPhaseContext,
  SimulationPhaseResult,
} from "../core/step";
import {
  RESOURCE_TYPES,
  type Region,
  type ResourceStock,
  type ResourceType,
} from "../state/region";
import type { RegionId } from "../state/ids";
import type { JsonValue } from "../core/serialization";

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function getResourceValue(
  stock: ResourceStock,
  resourceType: ResourceType,
): number {
  return stock[resourceType] ?? 0;
}

function resourceMapsEqual(
  first: ResourceStock,
  second: ResourceStock,
): boolean {
  return RESOURCE_TYPES.every(
    (resourceType) =>
      getResourceValue(first, resourceType) ===
      getResourceValue(second, resourceType),
  );
}

function sortedRegions(regions: Readonly<Record<RegionId, Region>>): Region[] {
  return Object.values(regions).sort((first, second) =>
    compareStableText(first.id, second.id),
  );
}

function createResourceEvent(
  context: SimulationPhaseContext,
  sequence: number,
  event: Omit<Parameters<typeof createGameEvent>[0], "tick" | "sequence">,
): GameEvent {
  return createGameEvent({
    ...event,
    tick: context.nextTick,
    sequence,
  });
}

function isJsonObject(
  value: JsonValue,
): value is { readonly [key: string]: JsonValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function interventionCompletionCauseIdsForResource(
  events: readonly GameEvent[],
  regionId: RegionId,
  resourceType: ResourceType,
): readonly GameEvent["id"][] {
  return events
    .filter((event) => event.type === "INTERVENTION_COMPLETED")
    .filter((event) => {
      if (!isJsonObject(event.payload)) {
        return false;
      }

      const effects = event.payload.effects;
      if (!Array.isArray(effects)) {
        return false;
      }

      return effects.some(
        (effect) =>
          isJsonObject(effect) &&
          effect.kind === "regionResourceProductionCapacityDelta" &&
          effect.regionId === regionId &&
          effect.resourceType === resourceType &&
          effect.changed === true,
      );
    })
    .map((event) => event.id);
}

/**
 * Materialize one day of local resource output, consumption, stock, and
 * scarcity. T011 uses capacity as actual output: no policy, market, or RNG
 * modifier is applied here.
 */
export function runResourcesPhase(
  context: SimulationPhaseContext,
): SimulationPhaseResult {
  const nextRegions = {} as Record<RegionId, Region>;
  const emittedEvents: GameEvent[] = [];
  let nextEventSequence = context.nextEventSequence;
  let regionsChanged = false;

  for (const region of sortedRegions(context.world.regions)) {
    const nextProduction: ResourceStock = {};
    const nextResources: ResourceStock = {};
    const productionEventIds: GameEvent["id"][] = [];
    const completionCauseIdsByResource = new Map<
      ResourceType,
      readonly GameEvent["id"][]
    >();
    let totalDemand = 0;
    let totalShortage = 0;

    for (const resourceType of RESOURCE_TYPES) {
      const capacity = getResourceValue(
        region.resourceProductionCapacity,
        resourceType,
      );
      const previousProduction = getResourceValue(
        region.resourceProduction,
        resourceType,
      );
      const stockBefore = getResourceValue(region.resources, resourceType);
      const demand = getResourceValue(region.resourceDemand, resourceType);
      const availableSupply = stockBefore + capacity;
      const stockAfter = Math.max(0, availableSupply - demand);
      const shortage = Math.max(0, demand - availableSupply);
      const completionCauseIds = interventionCompletionCauseIdsForResource(
        context.emittedEvents,
        region.id,
        resourceType,
      );
      completionCauseIdsByResource.set(resourceType, completionCauseIds);

      if (!Number.isFinite(availableSupply) || !Number.isFinite(stockAfter)) {
        throw new Error(
          `${region.id}.${resourceType} exceeded the finite resource range.`,
        );
      }

      if (capacity > 0) {
        nextProduction[resourceType] = capacity;
      }

      if (stockAfter > 0) {
        nextResources[resourceType] = stockAfter;
      }

      totalDemand += demand;
      totalShortage += shortage;

      if (capacity !== previousProduction && capacity > 0) {
        const event = createResourceEvent(context, nextEventSequence, {
          type: "RESOURCE_PRODUCED",
          targetId: region.id,
          causeIds: completionCauseIds,
          payload: {
            regionId: region.id,
            resourceType,
            previousAmount: previousProduction,
            amount: capacity,
          },
          visibility: "world",
        });
        emittedEvents.push(event);
        productionEventIds.push(event.id);
        nextEventSequence += 1;
      }
    }

    if (!Number.isFinite(totalDemand) || !Number.isFinite(totalShortage)) {
      throw new Error(
        `${region.id}.resourceDemand overflowed the finite range.`,
      );
    }

    const scarcity =
      totalDemand === 0 ? 0 : Math.min(1, totalShortage / totalDemand);

    if (!Number.isFinite(scarcity)) {
      throw new Error(`${region.id}.scarcity is not finite.`);
    }

    nextRegions[region.id] = {
      ...region,
      resources: nextResources,
      resourceProduction: nextProduction,
      scarcity,
    };

    const resourceStateChanged =
      !resourceMapsEqual(region.resources, nextResources) ||
      !resourceMapsEqual(region.resourceProduction, nextProduction) ||
      region.scarcity !== scarcity;
    regionsChanged ||= resourceStateChanged;

    if (region.scarcity !== scarcity) {
      const shortageCauseIds = new Set<GameEvent["id"]>(productionEventIds);
      for (const causeId of completionCauseIdsByResource.values()) {
        for (const eventId of causeId) {
          shortageCauseIds.add(eventId);
        }
      }
      const event = createResourceEvent(context, nextEventSequence, {
        type: "RESOURCE_SHORTAGE_CHANGED",
        targetId: region.id,
        causeIds: [...shortageCauseIds],
        payload: {
          regionId: region.id,
          previousScarcity: region.scarcity,
          scarcity,
          totalDemand,
          totalShortage,
        },
        visibility: "world",
      });
      emittedEvents.push(event);
      nextEventSequence += 1;
    }
  }

  if (!regionsChanged) {
    return {
      nextWorld: context.world,
      emittedEvents,
      nextEventSequence,
    };
  }

  return {
    nextWorld: {
      ...context.world,
      regions: nextRegions,
    },
    emittedEvents,
    nextEventSequence,
  };
}
