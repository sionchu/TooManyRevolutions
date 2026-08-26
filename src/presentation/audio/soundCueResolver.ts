import type { GameEvent } from "../../sim/events/event";
import type { EventStore } from "../../sim/events/eventStore";
import type { WorldState } from "../../sim/state/world";
import type { WorldVisualDelta } from "../../app/worldVisualDelta";
import {
  SOUND_CUE_REGISTRY,
  getSoundCueDefinition,
  type SoundCueId,
  type SoundCueRegistry,
} from "./soundCueRegistry";

export type InteractionSoundCueId = Extract<SoundCueId, `ui.${string}`>;

export interface InteractionSoundCueRequest {
  readonly cueId: InteractionSoundCueId;
  readonly tick?: number;
  /** Provide a stable action ID when the same interaction can be retried. */
  readonly dedupeKey?: string;
  readonly sourceId?: string;
}

export interface SoundCueResolverInput {
  /** Prefer this bounded step delta when available. */
  readonly events?: readonly GameEvent[];
  /** Full EventStore is supported for replay and catch-up callers. */
  readonly eventStore?: Pick<EventStore, "events">;
  /** Read-only world projection used for current tick and known capitals. */
  readonly world?: Pick<WorldState, "tick" | "countries">;
  readonly visualDeltas?: readonly WorldVisualDelta[];
  readonly interactionCues?: readonly InteractionSoundCueRequest[];
  /** Current presentation tick used only when a visual delta has no source event. */
  readonly currentTick?: number;
  /** A capital region is factual only when supplied by the presentation caller. */
  readonly capitalRegionIds?: readonly string[];
}

export interface SoundCueResolverState {
  readonly seenDedupeKeys: readonly string[];
  readonly lastAcceptedTickByCue: Readonly<Partial<Record<SoundCueId, number>>>;
  /** Presentation-only suppression memory; never persisted in WorldState. */
  readonly territorySuppressionUntil: Readonly<Record<string, number>>;
}

export interface ResolvedSoundCue {
  readonly cueId: SoundCueId;
  readonly label: string;
  readonly tick: number;
  readonly priority: number;
  readonly dedupeKey: string;
  readonly source: "event" | "visual-delta" | "interaction";
  readonly sourceEventIds: readonly string[];
  readonly regionIds: readonly string[];
}

export interface SoundCueResolution {
  readonly cues: readonly ResolvedSoundCue[];
  readonly nextState: SoundCueResolverState;
  readonly suppressedDedupeKeys: readonly string[];
}

export const CRISIS_TERRITORY_SUPPRESSION_TICKS = 14;

const TERRITORIAL_CUE_IDS = new Set<SoundCueId>([
  "territory.controllerChanged",
  "capital.threatened",
]);

const CRISIS_CUE_IDS = new Set<SoundCueId>([
  "crisis.rebellion",
  "crisis.coup",
  "crisis.civilWar",
]);

const CHRONICLE_EVENT_TYPES = new Set<GameEvent["type"]>([
  "CONFLICT_RESOLVED",
  "GOVERNMENT_TRANSITIONED",
  "ORDER_CONSOLIDATION_STARTED",
  "ORDER_CONSOLIDATED",
  "STATE_DISSOLVED",
]);

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function asRecord(value: unknown): Readonly<Record<string, unknown>> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : null;
}

function payloadString(event: GameEvent, key: string): string | null {
  const value = asRecord(event.payload)?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function payloadStrings(event: GameEvent, key: string): readonly string[] {
  const value = asRecord(event.payload)?.[key];
  return Array.isArray(value)
    ? value.filter(
        (entry): entry is string =>
          typeof entry === "string" && entry.length > 0,
      )
    : [];
}

function eventRegionIds(event: GameEvent): readonly string[] {
  const regionIds = new Set<string>();
  for (const key of ["regionId", "sourceRegionId", "targetRegionId"]) {
    const value = payloadString(event, key);
    if (value !== null) regionIds.add(value);
  }
  for (const key of ["regionIds", "affectedRegionIds", "qualifiedRegionIds"]) {
    for (const value of payloadStrings(event, key)) regionIds.add(value);
  }
  return [...regionIds].sort(compareStableText);
}

function eventScopeKeys(event: GameEvent): readonly string[] {
  const conflictId = payloadString(event, "conflictId");
  return conflictId === null ? [] : [`conflict:${conflictId}`];
}

function eventInterventionId(event: GameEvent): string | null {
  return (
    payloadString(event, "interventionId") ??
    payloadString(event, "commitmentId") ??
    event.targetId ??
    null
  );
}

function relevantCause(
  event: GameEvent,
  eventsById: ReadonlyMap<string, GameEvent>,
): GameEvent | undefined {
  return event.causeIds
    .map((causeId) => eventsById.get(causeId))
    .find(
      (cause): cause is GameEvent =>
        cause?.type === "POLICY_ENACTED" ||
        cause?.type === "INTERVENTION_COMPLETED",
    );
}

function eventCueId(
  event: GameEvent,
  capitalRegionIds: ReadonlySet<string>,
  eventsById: ReadonlyMap<string, GameEvent>,
): SoundCueId | null {
  if (event.visibility === "hidden") return null;

  switch (event.type) {
    case "POLICY_ENACTED":
      return "policy.enacted";
    case "INSTITUTION_RULE_CHANGED":
      // The parent policy/project cue already represents this derived rule
      // write; standalone rule events still receive an institution cue.
      return relevantCause(event, eventsById) === undefined
        ? "institution.changed"
        : null;
    case "INTERVENTION_STARTED":
      return "project.started";
    case "INTERVENTION_COMPLETED":
      return "project.completed";
    case "COUP_ATTEMPT_STARTED":
      return "crisis.coup";
    case "REBELLION_STARTED":
      return "crisis.rebellion";
    case "CIVIL_WAR_STARTED":
      return "crisis.civilWar";
    case "LAND_HEX_CONTROL_CHANGED":
      return eventRegionIds(event).some((regionId) =>
        capitalRegionIds.has(regionId),
      )
        ? "capital.threatened"
        : "territory.controllerChanged";
    case "BORDER_CLOSED":
      return "border.closed";
    case "BORDER_REOPENED":
      return "border.reopened";
    default:
      return CHRONICLE_EVENT_TYPES.has(event.type)
        ? "chronicle.majorEvent"
        : null;
  }
}

interface Candidate {
  readonly cueId: SoundCueId;
  readonly tick: number;
  readonly priority: number;
  readonly dedupeKey: string;
  readonly source: ResolvedSoundCue["source"];
  readonly sourceEventIds: readonly string[];
  readonly regionIds: readonly string[];
  readonly scopeKeys: readonly string[];
  readonly eventSequence: number;
}

function candidate(
  cueId: SoundCueId,
  tick: number,
  dedupeKey: string,
  source: Candidate["source"],
  sourceEventIds: readonly string[],
  regionIds: readonly string[],
  scopeKeys: readonly string[],
  eventSequence: number,
  registry: SoundCueRegistry,
): Candidate | null {
  const definition = getSoundCueDefinition(cueId, registry);
  if (definition === undefined) return null;

  return {
    cueId,
    tick,
    priority: definition.priority,
    dedupeKey,
    source,
    sourceEventIds: [...new Set(sourceEventIds)].sort(compareStableText),
    regionIds: [...new Set(regionIds)].sort(compareStableText),
    scopeKeys: [...new Set(scopeKeys)].sort(compareStableText),
    eventSequence,
  };
}

function eventCandidate(
  event: GameEvent,
  capitalRegionIds: ReadonlySet<string>,
  eventsById: ReadonlyMap<string, GameEvent>,
  registry: SoundCueRegistry,
): Candidate | null {
  const cueId = eventCueId(event, capitalRegionIds, eventsById);
  if (cueId === null) return null;

  const cause = relevantCause(event, eventsById);
  const interventionId = eventInterventionId(event);
  let dedupeKey = `${cueId}:${event.id}`;
  if (cueId === "policy.enacted") {
    dedupeKey = `policy.enacted:${payloadString(event, "policyId") ?? event.id}`;
  } else if (cueId === "institution.changed") {
    dedupeKey = `institution.changed:${cause?.id ?? event.id}`;
  } else if (cueId === "project.started") {
    dedupeKey = `project.started:${interventionId ?? event.id}`;
  } else if (cueId === "project.completed") {
    // CommitmentId makes the lifecycle identity stable while allowing a
    // future re-run of the same intervention definition to sound again.
    dedupeKey = `project.completed:${payloadString(event, "commitmentId") ?? event.id}`;
  } else if (CRISIS_CUE_IDS.has(cueId)) {
    dedupeKey = `crisis:${event.type}:${payloadString(event, "conflictId") ?? event.id}`;
  }

  return candidate(
    cueId,
    event.tick,
    dedupeKey,
    "event",
    cause === undefined ? [event.id] : [cause.id, event.id],
    eventRegionIds(event),
    eventScopeKeys(event),
    event.sequence,
    registry,
  );
}

function visualDeltaCandidate(
  delta: WorldVisualDelta,
  currentTick: number,
  capitalRegionIds: ReadonlySet<string>,
  registry: SoundCueRegistry,
): Candidate | null {
  let cueId: SoundCueId | null = null;
  switch (delta.kind) {
    case "controller":
      cueId = delta.regionIds.some((regionId) => capitalRegionIds.has(regionId))
        ? "capital.threatened"
        : "territory.controllerChanged";
      break;
    case "institution":
      cueId = "institution.changed";
      break;
    case "ideology":
      // Routine ideology drift is intentionally silent.
      return null;
    case "conflict":
    case "project":
    case "route":
      // These deltas are directionally ambiguous without their source event.
      return null;
  }

  return candidate(
    cueId,
    currentTick,
    `${cueId}:visual:${delta.id}`,
    "visual-delta",
    delta.sourceEventIds,
    delta.regionIds,
    [],
    Number.MAX_SAFE_INTEGER,
    registry,
  );
}

function interactionCandidate(
  request: InteractionSoundCueRequest,
  index: number,
  currentTick: number,
  registry: SoundCueRegistry,
): Candidate | null {
  const tick = Number.isFinite(request.tick)
    ? Math.floor(request.tick!)
    : currentTick;
  const dedupeKey =
    request.dedupeKey ??
    `interaction:${request.cueId}:${request.sourceId ?? `${tick}:${index}`}`;
  return candidate(
    request.cueId,
    tick,
    dedupeKey,
    "interaction",
    [],
    [],
    [],
    Number.MAX_SAFE_INTEGER - index,
    registry,
  );
}

function mergeCandidates(first: Candidate, second: Candidate): Candidate {
  const preferred =
    second.priority > first.priority ||
    (second.priority === first.priority &&
      second.eventSequence < first.eventSequence)
      ? second
      : first;
  return {
    ...preferred,
    tick: Math.min(first.tick, second.tick),
    sourceEventIds: [
      ...new Set([...first.sourceEventIds, ...second.sourceEventIds]),
    ].sort(compareStableText),
    regionIds: [...new Set([...first.regionIds, ...second.regionIds])].sort(
      compareStableText,
    ),
    scopeKeys: [...new Set([...first.scopeKeys, ...second.scopeKeys])].sort(
      compareStableText,
    ),
    eventSequence: Math.min(first.eventSequence, second.eventSequence),
  };
}

function mergeDuplicateCandidates(
  candidates: readonly Candidate[],
): Candidate[] {
  const byKey = new Map<string, Candidate>();
  for (const item of candidates) {
    const previous = byKey.get(item.dedupeKey);
    byKey.set(
      item.dedupeKey,
      previous === undefined ? item : mergeCandidates(previous, item),
    );
  }
  return [...byKey.values()];
}

function groupTerritoryCandidates(
  candidates: readonly Candidate[],
): Candidate[] {
  const grouped = new Map<string, Candidate>();
  const result: Candidate[] = [];
  for (const item of candidates) {
    if (
      !TERRITORIAL_CUE_IDS.has(item.cueId) ||
      item.cueId === "capital.threatened"
    ) {
      result.push(item);
      continue;
    }
    const key = `territory.controllerChanged:tick:${item.tick}`;
    const previous = grouped.get(key);
    grouped.set(
      key,
      previous === undefined
        ? { ...item, dedupeKey: key }
        : mergeCandidates(
            { ...previous, dedupeKey: key },
            { ...item, dedupeKey: key },
          ),
    );
  }
  result.push(...grouped.values());
  return result;
}

function hasIntersection(
  first: readonly string[],
  second: readonly string[],
): boolean {
  const secondSet = new Set(second);
  return first.some((value) => secondSet.has(value));
}

function crisisDominatesTerritory(
  territory: Candidate,
  crises: readonly Candidate[],
): boolean {
  return crises.some((crisis) => {
    if (crisis.tick !== territory.tick) return false;
    if (hasIntersection(territory.scopeKeys, crisis.scopeKeys)) return true;
    if (hasIntersection(territory.regionIds, crisis.regionIds)) return true;
    if (crisis.scopeKeys.length === 0 && crisis.regionIds.length === 0) {
      return true;
    }
    return (
      territory.scopeKeys.length === 0 &&
      territory.regionIds.length === 0 &&
      crisis.scopeKeys.length === 0
    );
  });
}

function suppressedByRememberedCrisis(
  territory: Candidate,
  suppressionUntil: ReadonlyMap<string, number>,
): boolean {
  return [
    ...territory.scopeKeys,
    ...territory.regionIds.map((id) => `region:${id}`),
  ].some((key) => (suppressionUntil.get(key) ?? -1) >= territory.tick);
}

function rememberCrisis(
  candidateItem: Candidate,
  suppressionUntil: Map<string, number>,
): void {
  const until = candidateItem.tick + CRISIS_TERRITORY_SUPPRESSION_TICKS;
  for (const key of candidateItem.scopeKeys) {
    suppressionUntil.set(key, Math.max(suppressionUntil.get(key) ?? -1, until));
  }
  for (const regionId of candidateItem.regionIds) {
    const key = `region:${regionId}`;
    suppressionUntil.set(key, Math.max(suppressionUntil.get(key) ?? -1, until));
  }
}

function safeCurrentTick(value: number | undefined): number {
  return Number.isFinite(value) ? Math.floor(value!) : 0;
}

export function createSoundCueResolverState(): SoundCueResolverState {
  return {
    seenDedupeKeys: [],
    lastAcceptedTickByCue: {},
    territorySuppressionUntil: {},
  };
}

export function resolveAmbientCue(
  surface: "map" | "capital" | "industrial",
): SoundCueId {
  switch (surface) {
    case "map":
      return "map.ambient";
    case "capital":
      return "capital.ambient";
    case "industrial":
      return "industrial.ambient";
  }
}

/**
 * Resolve only presentation cues from a bounded event delta/read model.
 * Nothing returned here is simulation state, and the supplied state is never
 * mutated. Callers should retain nextState outside WorldState when they want
 * idempotence across repeated renders or replay batches.
 */
export function resolveSoundCues(
  input: SoundCueResolverInput,
  state: SoundCueResolverState = createSoundCueResolverState(),
  registry: SoundCueRegistry = SOUND_CUE_REGISTRY,
): SoundCueResolution {
  const events = [...(input.events ?? input.eventStore?.events ?? [])].sort(
    (first, second) =>
      first.tick - second.tick ||
      first.sequence - second.sequence ||
      compareStableText(first.id, second.id),
  );
  const eventsById = new Map(events.map((event) => [event.id, event]));
  const capitalRegionIds = new Set(input.capitalRegionIds ?? []);
  if (input.world !== undefined) {
    for (const country of Object.values(input.world.countries)) {
      if (country.capitalRegionId !== null) {
        capitalRegionIds.add(country.capitalRegionId);
      }
    }
  }
  const currentTick = safeCurrentTick(input.currentTick ?? input.world?.tick);

  const eventCandidates = events.flatMap((event) => {
    const item = eventCandidate(event, capitalRegionIds, eventsById, registry);
    return item === null ? [] : [item];
  });
  const coveredEventIds = new Set(
    eventCandidates.flatMap((item) => item.sourceEventIds),
  );
  const visualCandidates = (input.visualDeltas ?? []).flatMap((delta) => {
    if (delta.sourceEventIds.some((eventId) => coveredEventIds.has(eventId))) {
      return [];
    }
    const item = visualDeltaCandidate(
      delta,
      currentTick,
      capitalRegionIds,
      registry,
    );
    return item === null ? [] : [item];
  });
  const interactionCandidates = (input.interactionCues ?? []).flatMap(
    (request, index) => {
      const item = interactionCandidate(request, index, currentTick, registry);
      return item === null ? [] : [item];
    },
  );

  const crises = [...eventCandidates, ...visualCandidates].filter((item) =>
    CRISIS_CUE_IDS.has(item.cueId),
  );
  const suppressionUntil = new Map(
    Object.entries(state.territorySuppressionUntil),
  );
  const initialCandidates = mergeDuplicateCandidates([
    ...eventCandidates,
    ...visualCandidates,
    ...interactionCandidates,
  ]);
  const suppressedDedupeKeys = new Set<string>();
  const suppressedSourceEventIds = new Set<string>();
  const filteredCandidates = initialCandidates.filter((item) => {
    if (!TERRITORIAL_CUE_IDS.has(item.cueId)) return true;
    if (crisisDominatesTerritory(item, crises)) {
      suppressedDedupeKeys.add(item.dedupeKey);
      for (const eventId of item.sourceEventIds) {
        suppressedSourceEventIds.add(eventId);
      }
      return false;
    }
    if (suppressedByRememberedCrisis(item, suppressionUntil)) {
      suppressedDedupeKeys.add(item.dedupeKey);
      for (const eventId of item.sourceEventIds) {
        suppressedSourceEventIds.add(eventId);
      }
      return false;
    }
    return true;
  });
  const candidates = mergeDuplicateCandidates(
    groupTerritoryCandidates(filteredCandidates),
  ).sort(
    (first, second) =>
      first.tick - second.tick ||
      second.priority - first.priority ||
      first.eventSequence - second.eventSequence ||
      compareStableText(first.dedupeKey, second.dedupeKey),
  );

  const seenDedupeKeys = new Set(state.seenDedupeKeys);
  for (const key of suppressedDedupeKeys) seenDedupeKeys.add(key);
  for (const eventId of suppressedSourceEventIds) {
    seenDedupeKeys.add(`source:${eventId}`);
  }
  const lastAcceptedTickByCue = {
    ...state.lastAcceptedTickByCue,
  } as Partial<Record<SoundCueId, number>>;
  const cues: ResolvedSoundCue[] = [];

  for (const item of candidates) {
    if (
      seenDedupeKeys.has(item.dedupeKey) ||
      item.sourceEventIds.some((eventId) =>
        seenDedupeKeys.has(`source:${eventId}`),
      )
    ) {
      continue;
    }
    const definition = getSoundCueDefinition(item.cueId, registry);
    if (definition === undefined) continue;
    const lastTick = lastAcceptedTickByCue[item.cueId];
    if (
      lastTick !== undefined &&
      item.tick - lastTick <= definition.cooldownTicks
    ) {
      seenDedupeKeys.add(item.dedupeKey);
      for (const eventId of item.sourceEventIds) {
        seenDedupeKeys.add(`source:${eventId}`);
      }
      suppressedDedupeKeys.add(item.dedupeKey);
      continue;
    }

    seenDedupeKeys.add(item.dedupeKey);
    for (const eventId of item.sourceEventIds) {
      seenDedupeKeys.add(`source:${eventId}`);
    }
    lastAcceptedTickByCue[item.cueId] = item.tick;
    if (CRISIS_CUE_IDS.has(item.cueId)) rememberCrisis(item, suppressionUntil);
    cues.push({
      cueId: item.cueId,
      label: definition.label,
      tick: item.tick,
      priority: item.priority,
      dedupeKey: item.dedupeKey,
      source: item.source,
      sourceEventIds: [...item.sourceEventIds],
      regionIds: [...item.regionIds],
    });
  }

  return {
    cues,
    nextState: {
      seenDedupeKeys: [...seenDedupeKeys],
      lastAcceptedTickByCue,
      territorySuppressionUntil: Object.fromEntries(
        [...suppressionUntil.entries()].sort(([first], [second]) =>
          compareStableText(first, second),
        ),
      ),
    },
    suppressedDedupeKeys: [...suppressedDedupeKeys].sort(compareStableText),
  };
}
