import { createDeterministicEventId, type GameEvent } from "./event";
import type { EventId } from "../state/ids";

export interface EventStore {
  readonly events: readonly GameEvent[];
}

export function createEventStore(
  initialEvents: readonly GameEvent[] = [],
): EventStore {
  return initialEvents.reduce<EventStore>(
    (store, event) => appendEvent(store, event),
    { events: [] },
  );
}

export function getNextEventSequence(store: EventStore): number {
  return (store.events.at(-1)?.sequence ?? -1) + 1;
}

function sequenceFromEventId(eventId: EventId): number | null {
  const parts = eventId.split(":");
  if (parts.length !== 4 || parts[0] !== "event") {
    return null;
  }

  const sequence = Number(parts[2]);
  return Number.isInteger(sequence) && sequence >= 0 ? sequence : null;
}

/**
 * Find an event in the canonical ordered history without rebuilding an ID
 * index. Event IDs contain the global sequence, and the history is already
 * ordered by that sequence. The events array remains the sole authority.
 */
export function findEventById(
  store: EventStore,
  eventId: EventId,
): GameEvent | undefined {
  const targetSequence = sequenceFromEventId(eventId);
  if (targetSequence === null) {
    return undefined;
  }

  let low = 0;
  let high = store.events.length - 1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const event = store.events[middle];
    if (event === undefined) {
      return undefined;
    }

    if (event.sequence === targetSequence) {
      return event.id === eventId ? event : undefined;
    }

    if (event.sequence < targetSequence) {
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return undefined;
}

export function appendEvents(
  store: EventStore,
  events: readonly GameEvent[],
): EventStore {
  return events.reduce<EventStore>(
    (currentStore, event) => appendEvent(currentStore, event),
    store,
  );
}

/**
 * Append a canonical step's event delta without rescanning prior history.
 * The caller must have established the previous store as canonical. This
 * function still validates every new event and every new causal edge.
 */
export function appendEventsIncremental(
  store: EventStore,
  events: readonly GameEvent[],
): EventStore {
  if (events.length === 0) {
    return store;
  }

  let previousEvent = store.events.at(-1);
  let expectedSequence = getNextEventSequence(store);
  const newEventIds = new Set<EventId>();

  for (const event of events) {
    if (
      event.id !==
      createDeterministicEventId(event.tick, event.sequence, event.type)
    ) {
      throw new Error(
        `Event ${event.id} does not use the deterministic ID rule.`,
      );
    }

    if (event.sequence !== expectedSequence) {
      throw new Error(
        `Event ${event.id} is not the next global event sequence.`,
      );
    }

    if (
      previousEvent !== undefined &&
      event.sequence <= previousEvent.sequence
    ) {
      throw new Error(`Event ${event.id} is not in global emission order.`);
    }

    if (previousEvent !== undefined && event.tick < previousEvent.tick) {
      throw new Error(`Event ${event.id} cannot precede an emitted tick.`);
    }

    if (newEventIds.has(event.id) || findEventById(store, event.id)) {
      throw new Error(`Event ${event.id} already exists.`);
    }

    for (const causeId of event.causeIds) {
      if (
        !newEventIds.has(causeId) &&
        findEventById(store, causeId) === undefined
      ) {
        throw new Error(
          `Event ${event.id} references missing cause ${causeId}.`,
        );
      }
    }

    newEventIds.add(event.id);
    previousEvent = event;
    expectedSequence += 1;
  }

  return {
    events: [...store.events, ...events],
  };
}

/** Validate one complete ordered history without rebuilding or mutating it. */
export function assertEventStoreInvariants(store: EventStore): void {
  const knownEventIds = new Set<EventId>();
  let previousEvent: GameEvent | undefined;

  for (const [index, event] of store.events.entries()) {
    if (
      event.id !==
      createDeterministicEventId(event.tick, event.sequence, event.type)
    ) {
      throw new Error(
        `Event ${event.id} does not use the deterministic ID rule.`,
      );
    }

    if (knownEventIds.has(event.id)) {
      throw new Error(`Event ${event.id} already exists.`);
    }

    if (index === 0 && event.sequence !== 0) {
      throw new Error("EventStore history must begin at sequence zero.");
    }

    if (previousEvent !== undefined) {
      if (event.sequence <= previousEvent.sequence) {
        throw new Error(`Event ${event.id} is not in global emission order.`);
      }

      if (event.tick < previousEvent.tick) {
        throw new Error(`Event ${event.id} cannot precede an emitted tick.`);
      }
    }

    for (const causeId of event.causeIds) {
      if (!knownEventIds.has(causeId)) {
        throw new Error(
          `Event ${event.id} references missing cause ${causeId}.`,
        );
      }
    }

    knownEventIds.add(event.id);
    previousEvent = event;
  }
}

export function appendEvent(store: EventStore, event: GameEvent): EventStore {
  if (
    event.id !==
    createDeterministicEventId(event.tick, event.sequence, event.type)
  ) {
    throw new Error(
      `Event ${event.id} does not use the deterministic ID rule.`,
    );
  }

  if (store.events.some((existingEvent) => existingEvent.id === event.id)) {
    throw new Error(`Event ${event.id} already exists.`);
  }

  const latestEvent = store.events[store.events.length - 1];

  if (latestEvent !== undefined) {
    if (event.sequence <= latestEvent.sequence) {
      throw new Error(`Event ${event.id} is not in global emission order.`);
    }

    if (event.tick < latestEvent.tick) {
      throw new Error(`Event ${event.id} cannot precede an emitted tick.`);
    }
  }

  const knownEventIds = new Set<EventId>(
    store.events.map((existingEvent) => existingEvent.id),
  );

  for (const causeId of event.causeIds) {
    if (!knownEventIds.has(causeId)) {
      throw new Error(`Event ${event.id} references missing cause ${causeId}.`);
    }
  }

  return {
    events: [...store.events, event],
  };
}
