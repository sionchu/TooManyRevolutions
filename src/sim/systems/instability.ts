import type { JsonValue } from "../core/serialization";
import type {
  SimulationPhaseContext,
  SimulationPhaseHook,
  SimulationPhaseResult,
} from "../core/step";
import { createGameEvent, type GameEvent } from "../events/event";
import { deriveAdministrativeOverload } from "../state/intervention";
import { isFactionRelevantToRegion } from "./factionPressure";
import type { Country } from "../state/country";
import type { Faction } from "../state/faction";
import type {
  CountryId,
  EventId,
  FactionId,
  IdeologyId,
  RegionId,
} from "../state/ids";
import type { Region } from "../state/region";
import type { ScenarioDefinition } from "../state/scenario";
import {
  getFullyControllingCountryId,
  getFullyControlledRegionIds,
} from "../state/territorialControl";
import type { WorldState } from "../state/world";

/** T017's three distinguishable regional pressure channels. */
export type RegionalPressureChannel =
  "material" | "political" | "administrative";

export type PressureCauseKind =
  | "scarcity"
  | "factionGrievance"
  | "factionOrganization"
  | "factionInfluence"
  | "ideologyRadicalism"
  | "ideologyOrganization"
  | "administrativeOverload"
  | "weakStateControl";

export type PressureCauseUnit = "ratio" | "absolute";

/** A concrete input explanation; it is not persisted in WorldState. */
export interface PressureCause {
  readonly kind: PressureCauseKind;
  readonly value: number;
  readonly unit: PressureCauseUnit;
  readonly sourceId?: string;
}

export interface PressureComponent {
  /** Always bounded to 0–1. */
  readonly severity: number;
  readonly causes: readonly PressureCause[];
}

/** Pure, derived regional stress view consumed by the instability writer. */
export interface RegionalPressureSnapshot {
  readonly regionId: RegionId;
  readonly material: PressureComponent;
  readonly political: PressureComponent;
  readonly administrative: PressureComponent;
  /** Saturating combination of the three channel severities, bounded 0–1. */
  readonly combinedPressure: number;
  readonly keyCauses: readonly PressureCause[];
  readonly involvedFactionIds: readonly FactionId[];
  readonly involvedIdeologyIds: readonly IdeologyId[];
}

export type InstabilitySeverityBand = "low" | "medium" | "high" | "critical";

export interface InstabilityConfig {
  /** Daily approach rate while unrest is below the current pressure target. */
  readonly riseRate?: number;
  /** Daily approach rate while unrest recovers toward a lower target. */
  readonly recoveryRate?: number;
  /** Absolute overload reference used for bounded normalization. */
  readonly administrativeOverloadReference?: number;
  readonly mediumBandAt?: number;
  readonly highBandAt?: number;
  readonly criticalBandAt?: number;
}

export const DEFAULT_INSTABILITY_CONFIG = {
  riseRate: 0.02,
  recoveryRate: 0.015,
  administrativeOverloadReference: 15,
  mediumBandAt: 0.25,
  highBandAt: 0.5,
  criticalBandAt: 0.75,
} as const satisfies Required<InstabilityConfig>;

interface ResolvedInstabilityConfig {
  readonly riseRate: number;
  readonly recoveryRate: number;
  readonly administrativeOverloadReference: number;
  readonly mediumBandAt: number;
  readonly highBandAt: number;
  readonly criticalBandAt: number;
}

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function assertRate(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(label + " must be between 0 and 1.");
  }
}

function resolveConfig(config: InstabilityConfig): ResolvedInstabilityConfig {
  const resolved: ResolvedInstabilityConfig = {
    riseRate: config.riseRate ?? DEFAULT_INSTABILITY_CONFIG.riseRate,
    recoveryRate:
      config.recoveryRate ?? DEFAULT_INSTABILITY_CONFIG.recoveryRate,
    administrativeOverloadReference:
      config.administrativeOverloadReference ??
      DEFAULT_INSTABILITY_CONFIG.administrativeOverloadReference,
    mediumBandAt:
      config.mediumBandAt ?? DEFAULT_INSTABILITY_CONFIG.mediumBandAt,
    highBandAt: config.highBandAt ?? DEFAULT_INSTABILITY_CONFIG.highBandAt,
    criticalBandAt:
      config.criticalBandAt ?? DEFAULT_INSTABILITY_CONFIG.criticalBandAt,
  };

  assertRate(resolved.riseRate, "Instability riseRate");
  assertRate(resolved.recoveryRate, "Instability recoveryRate");

  if (
    !Number.isFinite(resolved.administrativeOverloadReference) ||
    resolved.administrativeOverloadReference <= 0
  ) {
    throw new Error(
      "Instability administrativeOverloadReference must be positive.",
    );
  }

  assertRate(resolved.mediumBandAt, "Instability mediumBandAt");
  assertRate(resolved.highBandAt, "Instability highBandAt");
  assertRate(resolved.criticalBandAt, "Instability criticalBandAt");

  if (!(
    resolved.mediumBandAt < resolved.highBandAt &&
    resolved.highBandAt < resolved.criticalBandAt
  )) {
    throw new Error("Instability severity bands must be strictly increasing.");
  }

  return resolved;
}

/**
 * Combine already-bounded components without an arbitrary additive score.
 * 1 - product(1 - component) keeps the result bounded while allowing
 * compound pressure when several independent channels are present.
 */
export function combinePressureComponents(
  components: readonly (number | PressureComponent)[],
): number {
  let remaining = 1;

  for (const component of components) {
    const severity =
      typeof component === "number" ? component : component.severity;
    remaining *= 1 - clamp01(severity);
  }

  return clamp01(1 - remaining);
}

function sortCauses(
  causes: readonly PressureCause[],
): readonly PressureCause[] {
  return [...causes].sort(
    (first, second) =>
      second.value - first.value ||
      compareStableText(first.kind, second.kind) ||
      compareStableText(first.sourceId ?? "", second.sourceId ?? ""),
  );
}

function component(
  severity: number,
  causes: readonly PressureCause[],
): PressureComponent {
  return {
    severity: clamp01(severity),
    causes: sortCauses(causes),
  };
}

function ratioCause(
  kind: PressureCauseKind,
  value: number,
  sourceId?: string,
): PressureCause | null {
  return value <= 0
    ? null
    : {
        kind,
        value: clamp01(value),
        unit: "ratio",
        ...(sourceId === undefined ? {} : { sourceId }),
      };
}

function absoluteCause(
  kind: PressureCauseKind,
  value: number,
  sourceId?: string,
): PressureCause | null {
  return value <= 0
    ? null
    : {
        kind,
        value,
        unit: "absolute",
        ...(sourceId === undefined ? {} : { sourceId }),
      };
}

function sortedFactions(world: WorldState): readonly Faction[] {
  return Object.values(world.factions).sort((first, second) =>
    compareStableText(first.id, second.id),
  );
}

interface FactionIdeologySignal {
  readonly radicalism: number;
  readonly organization: number;
  readonly ideologyIds: readonly IdeologyId[];
}

function deriveFactionIdeologySignal(
  region: Region,
  faction: Faction,
): FactionIdeologySignal {
  const affinityEntries = Object.entries(faction.ideologyAffinity)
    .filter(([, affinity]) => affinity > 0)
    .sort(([first], [second]) => compareStableText(first, second));
  let totalAffinity = 0;
  let radicalism = 0;
  let organization = 0;
  const ideologyIds: IdeologyId[] = [];

  for (const [ideologyId, affinity] of affinityEntries) {
    const ideologyState = region.ideology[ideologyId as IdeologyId];
    if (ideologyState === undefined) {
      continue;
    }

    totalAffinity += affinity;
    radicalism += ideologyState.radicalism * affinity;
    organization += ideologyState.organization * affinity;
    ideologyIds.push(ideologyId as IdeologyId);
  }

  if (totalAffinity <= 0) {
    return { radicalism: 0, organization: 0, ideologyIds: [] };
  }

  return {
    radicalism: clamp01(radicalism / totalAffinity),
    organization: clamp01(organization / totalAffinity),
    ideologyIds,
  };
}

function deriveMaterialPressure(region: Region): PressureComponent {
  const scarcity = clamp01(region.scarcity);
  const cause = ratioCause("scarcity", scarcity, region.id);

  return component(scarcity, cause === null ? [] : [cause]);
}

function derivePoliticalPressure(
  scenario: ScenarioDefinition | undefined,
  world: WorldState,
  region: Region,
): {
  readonly component: PressureComponent;
  readonly involvedFactionIds: readonly FactionId[];
  readonly involvedIdeologyIds: readonly IdeologyId[];
} {
  const factionPressures: number[] = [];
  const causes: PressureCause[] = [];
  const involvedFactionIds: FactionId[] = [];
  const involvedIdeologyIds = new Set<IdeologyId>();

  for (const faction of sortedFactions(world)) {
    if (!isFactionRelevantToRegion(faction, region, scenario, world)) {
      continue;
    }

    const ideologySignal = deriveFactionIdeologySignal(region, faction);
    /*
     * Political mobilization is conjunctive: grievance, faction capacity,
     * local radicalism, and local ideological organization must all be
     * present. Influence is a separate supplemental leverage signal.
     */
    const mobilizationGate = Math.min(
      clamp01(faction.grievance),
      clamp01(faction.organization),
      ideologySignal.radicalism,
      ideologySignal.organization,
    );
    const factionPressure =
      mobilizationGate <= 0
        ? 0
        : combinePressureComponents([
            mobilizationGate,
            clamp01(faction.influence),
          ]);

    if (factionPressure > 0) {
      involvedFactionIds.push(faction.id);
      factionPressures.push(factionPressure);
    }

    const factionGrievance = ratioCause(
      "factionGrievance",
      faction.grievance,
      faction.id,
    );
    const factionOrganization = ratioCause(
      "factionOrganization",
      faction.organization,
      faction.id,
    );
    const factionInfluence = ratioCause(
      "factionInfluence",
      faction.influence,
      faction.id,
    );
    const ideologyRadicalism = ratioCause(
      "ideologyRadicalism",
      ideologySignal.radicalism,
      faction.id,
    );
    const ideologyOrganization = ratioCause(
      "ideologyOrganization",
      ideologySignal.organization,
      faction.id,
    );

    for (const cause of [
      factionGrievance,
      factionOrganization,
      factionInfluence,
      ideologyRadicalism,
      ideologyOrganization,
    ]) {
      if (cause !== null) {
        causes.push(cause);
      }
    }

    for (const ideologyId of ideologySignal.ideologyIds) {
      const ideologyState = region.ideology[ideologyId];
      if (
        ideologyState !== undefined &&
        (ideologyState.radicalism > 0 || ideologyState.organization > 0)
      ) {
        involvedIdeologyIds.add(ideologyId);
      }
    }
  }

  return {
    component: component(combinePressureComponents(factionPressures), causes),
    involvedFactionIds,
    involvedIdeologyIds: [...involvedIdeologyIds].sort(compareStableText),
  };
}

function controllerCountryId(
  scenario: ScenarioDefinition | undefined,
  world: WorldState,
  region: Region,
): CountryId | null {
  return scenario === undefined
    ? null
    : getFullyControllingCountryId(scenario, world, region.id);
}

function deriveAdministrativePressure(
  scenario: ScenarioDefinition | undefined,
  world: WorldState,
  region: Region,
  config: ResolvedInstabilityConfig,
): PressureComponent {
  const countryId = controllerCountryId(scenario, world, region);
  if (countryId === null) {
    return component(0, []);
  }

  const overload = deriveAdministrativeOverload(world, countryId);
  if (overload <= 0) {
    return component(0, []);
  }

  const overloadSignal =
    overload / (overload + config.administrativeOverloadReference);
  const weakStateControl = 1 - clamp01(region.stateControl);
  const causes = [
    absoluteCause("administrativeOverload", overload, countryId),
    ratioCause("weakStateControl", weakStateControl, region.id),
  ].filter((cause): cause is PressureCause => cause !== null);

  return component(overloadSignal * weakStateControl, causes);
}

function deriveRegionalPressureSnapshotWithConfig(
  scenario: ScenarioDefinition | undefined,
  world: WorldState,
  region: Region,
  config: ResolvedInstabilityConfig,
): RegionalPressureSnapshot {
  const material = deriveMaterialPressure(region);
  const political = derivePoliticalPressure(scenario, world, region);
  const administrative = deriveAdministrativePressure(
    scenario,
    world,
    region,
    config,
  );
  const components = [material, political.component, administrative];

  return {
    regionId: region.id,
    material,
    political: political.component,
    administrative,
    combinedPressure: combinePressureComponents(components),
    keyCauses: sortCauses(
      components.flatMap((pressureComponent) => pressureComponent.causes),
    ),
    involvedFactionIds: [...political.involvedFactionIds].sort(
      compareStableText,
    ),
    involvedIdeologyIds: [...political.involvedIdeologyIds].sort(
      compareStableText,
    ),
  };
}

/** Derive one region's pressure without changing WorldState. */
export function deriveRegionalPressureSnapshot(
  world: WorldState,
  regionId: RegionId,
  config: InstabilityConfig = {},
  scenario?: ScenarioDefinition,
): RegionalPressureSnapshot {
  const region = world.regions[regionId];
  if (region === undefined) {
    throw new Error("Region " + regionId + " does not exist in WorldState.");
  }

  return deriveRegionalPressureSnapshotWithConfig(
    scenario,
    world,
    region,
    resolveConfig(config),
  );
}

/** Stable RegionId ordering makes the derived read model input-order independent. */
export function deriveRegionalPressureSnapshots(
  world: WorldState,
  config: InstabilityConfig = {},
  scenario?: ScenarioDefinition,
): readonly RegionalPressureSnapshot[] {
  const resolvedConfig = resolveConfig(config);

  return Object.values(world.regions)
    .sort((first, second) => compareStableText(first.id, second.id))
    .map((region) =>
      deriveRegionalPressureSnapshotWithConfig(
        scenario,
        world,
        region,
        resolvedConfig,
      ),
    );
}

/** Central presentation/event band mapping; it is not a rebellion trigger. */
export function deriveInstabilitySeverityBand(
  value: number,
  config: InstabilityConfig = {},
): InstabilitySeverityBand {
  const resolvedConfig = resolveConfig(config);
  const normalized = clamp01(value);

  if (normalized < resolvedConfig.mediumBandAt) {
    return "low";
  }

  if (normalized < resolvedConfig.highBandAt) {
    return "medium";
  }

  if (normalized < resolvedConfig.criticalBandAt) {
    return "high";
  }

  return "critical";
}

/**
 * Population-weighted instability uses only currently country-controlled
 * Regions. No ownerCountryId, faction-controlled Region, or overload bonus is
 * included at national level.
 */
export function deriveCountryInstability(
  world: WorldState,
  countryId: CountryId,
  scenario?: ScenarioDefinition,
): number {
  const controlledRegionIds =
    scenario === undefined
      ? new Set<RegionId>()
      : new Set(getFullyControlledRegionIds(scenario, world, countryId));
  const regions = Object.values(world.regions)
    .filter((region) => controlledRegionIds.has(region.id))
    .sort((first, second) => compareStableText(first.id, second.id));
  let totalPopulation = 0;
  let weightedUnrest = 0;

  for (const region of regions) {
    if (region.population <= 0) {
      continue;
    }

    totalPopulation += region.population;
    weightedUnrest += clamp01(region.unrest) * region.population;
  }

  if (totalPopulation <= 0) {
    return 0;
  }

  return clamp01(weightedUnrest / totalPopulation) * 100;
}

/** Explicit alias for callers that want the aggregation semantics in the name. */
export const derivePopulationWeightedCountryInstability =
  deriveCountryInstability;

function approachUnrest(
  currentUnrest: number,
  pressureTarget: number,
  config: ResolvedInstabilityConfig,
): number {
  const current = clamp01(currentUnrest);
  const target = clamp01(pressureTarget);

  if (target === current) {
    return current;
  }

  const rate = target > current ? config.riseRate : config.recoveryRate;
  return clamp01(current + (target - current) * rate);
}

function isObject(
  value: JsonValue,
): value is Readonly<Record<string, JsonValue>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function payloadString(event: GameEvent, key: string): string | null {
  if (!isObject(event.payload)) {
    return null;
  }

  const value = event.payload[key];
  return typeof value === "string" ? value : null;
}

function eventCauseIdsForRegion(
  events: readonly GameEvent[],
  snapshot: RegionalPressureSnapshot,
  countryId: CountryId | null,
): readonly EventId[] {
  const involvedFactionIds = new Set(snapshot.involvedFactionIds);
  const result: EventId[] = [];

  for (const event of events) {
    if (
      (event.type === "RESOURCE_SHORTAGE_CHANGED" ||
        event.type === "IDEOLOGY_RADICALISM_CHANGED" ||
        event.type === "IDEOLOGY_ORGANIZATION_CHANGED") &&
      payloadString(event, "regionId") === snapshot.regionId
    ) {
      result.push(event.id);
      continue;
    }

    if (
      (event.type === "INTERVENTION_STARTED" ||
        event.type === "INTERVENTION_COMPLETED") &&
      countryId !== null &&
      (payloadString(event, "countryId") ?? event.actorId) === countryId
    ) {
      result.push(event.id);
      continue;
    }

    const eventFactionId = payloadString(event, "factionId") ?? event.actorId;
    if (
      event.type === "FACTION_STRATEGY_CHANGED" &&
      eventFactionId !== undefined &&
      eventFactionId !== null &&
      involvedFactionIds.has(eventFactionId as FactionId)
    ) {
      result.push(event.id);
    }
  }

  return result;
}

function causesToJson(causes: readonly PressureCause[]): JsonValue {
  return causes.map((cause) => ({
    kind: cause.kind,
    value: cause.value,
    unit: cause.unit,
    ...(cause.sourceId === undefined ? {} : { sourceId: cause.sourceId }),
  }));
}

function createRegionUnrestEvent(
  context: SimulationPhaseContext,
  sequence: number,
  region: Region,
  nextUnrest: number,
  snapshot: RegionalPressureSnapshot,
  previousBand: InstabilitySeverityBand,
  nextBand: InstabilitySeverityBand,
  causeIds: readonly EventId[],
): GameEvent {
  return createGameEvent({
    tick: context.nextTick,
    sequence,
    type: "REGION_UNREST_BAND_CHANGED",
    targetId: region.id,
    causeIds,
    payload: {
      regionId: region.id,
      previousUnrest: region.unrest,
      nextUnrest,
      previousBand,
      nextBand,
      pressure: snapshot.combinedPressure,
      materialPressure: snapshot.material.severity,
      politicalPressure: snapshot.political.severity,
      administrativePressure: snapshot.administrative.severity,
      keyCauses: causesToJson(snapshot.keyCauses),
    },
    visibility: "important",
  });
}

function createNationalInstabilityEvent(
  context: SimulationPhaseContext,
  sequence: number,
  country: Country,
  nextInstability: number,
  previousBand: InstabilitySeverityBand,
  nextBand: InstabilitySeverityBand,
  controlledRegionIds: readonly RegionId[],
  causeIds: readonly EventId[],
): GameEvent {
  return createGameEvent({
    tick: context.nextTick,
    sequence,
    type: "NATIONAL_INSTABILITY_BAND_CHANGED",
    actorId: country.id,
    causeIds,
    payload: {
      countryId: country.id,
      previousInstability: country.instability,
      nextInstability,
      previousBand,
      nextBand,
      controlledRegionIds: [...controlledRegionIds],
    },
    visibility: "important",
  });
}

/**
 * Authoritative daily instability writer. It reads the phase-start state,
 * moves Region.unrest toward the derived pressure target, then aggregates the
 * resulting regional values into Country.instability.
 */
export function runInstabilityPhase(
  context: SimulationPhaseContext,
  config: InstabilityConfig = {},
  scenario?: ScenarioDefinition,
): SimulationPhaseResult {
  if (context.phase !== "instability") {
    throw new Error("Instability must run during instability.");
  }

  const resolvedConfig = resolveConfig(config);
  const snapshots = deriveRegionalPressureSnapshots(
    context.world,
    resolvedConfig,
    scenario ?? context.scenario,
  );
  let nextRegions = context.world.regions;
  let regionsChanged = false;
  let nextEventSequence = context.nextEventSequence;
  const emittedEvents: GameEvent[] = [];
  const regionalTransitionEventsByCountry = new Map<CountryId, EventId[]>();

  for (const snapshot of snapshots) {
    const region = context.world.regions[snapshot.regionId];
    if (region === undefined) {
      continue;
    }

    const nextUnrest = approachUnrest(
      region.unrest,
      snapshot.combinedPressure,
      resolvedConfig,
    );
    const previousBand = deriveInstabilitySeverityBand(
      region.unrest,
      resolvedConfig,
    );
    const nextBand = deriveInstabilitySeverityBand(nextUnrest, resolvedConfig);

    if (nextUnrest !== region.unrest) {
      if (!regionsChanged) {
        nextRegions = { ...context.world.regions };
      }

      nextRegions = {
        ...nextRegions,
        [region.id]: { ...region, unrest: nextUnrest },
      };
      regionsChanged = true;
    }

    if (previousBand === nextBand) {
      continue;
    }

    const countryId = controllerCountryId(
      scenario ?? context.scenario,
      context.world,
      region,
    );
    const event = createRegionUnrestEvent(
      context,
      nextEventSequence,
      region,
      nextUnrest,
      snapshot,
      previousBand,
      nextBand,
      eventCauseIdsForRegion(context.emittedEvents, snapshot, countryId),
    );
    emittedEvents.push(event);
    nextEventSequence += 1;

    if (countryId !== null) {
      const countryEvents =
        regionalTransitionEventsByCountry.get(countryId) ?? [];
      regionalTransitionEventsByCountry.set(countryId, [
        ...countryEvents,
        event.id,
      ]);
    }
  }

  const worldAfterRegionalUpdate: WorldState = regionsChanged
    ? { ...context.world, regions: nextRegions }
    : context.world;
  let nextCountries = context.world.countries;
  let countriesChanged = false;

  for (const country of Object.values(context.world.countries).sort(
    (first, second) => compareStableText(first.id, second.id),
  )) {
    const nextInstability = deriveCountryInstability(
      worldAfterRegionalUpdate,
      country.id,
      scenario ?? context.scenario,
    );
    if (nextInstability !== country.instability) {
      if (!countriesChanged) {
        nextCountries = { ...context.world.countries };
      }

      nextCountries = {
        ...nextCountries,
        [country.id]: { ...country, instability: nextInstability },
      };
      countriesChanged = true;
    }

    const previousBand = deriveInstabilitySeverityBand(
      country.instability / 100,
      resolvedConfig,
    );
    const nextBand = deriveInstabilitySeverityBand(
      nextInstability / 100,
      resolvedConfig,
    );

    if (previousBand === nextBand) {
      continue;
    }

    emittedEvents.push(
      createNationalInstabilityEvent(
        context,
        nextEventSequence,
        country,
        nextInstability,
        previousBand,
        nextBand,
        Object.values(worldAfterRegionalUpdate.regions)
          .filter(
            (region) =>
              (scenario ?? context.scenario) !== undefined &&
              getFullyControlledRegionIds(
                scenario ?? context.scenario!,
                worldAfterRegionalUpdate,
                country.id,
              ).includes(region.id),
          )
          .sort((first, second) => compareStableText(first.id, second.id))
          .map((region) => region.id),
        regionalTransitionEventsByCountry.get(country.id) ?? [],
      ),
    );
    nextEventSequence += 1;
  }

  if (!regionsChanged && !countriesChanged && emittedEvents.length === 0) {
    return {
      nextWorld: context.world,
      emittedEvents: [],
      nextEventSequence: context.nextEventSequence,
    };
  }

  return {
    nextWorld: {
      ...context.world,
      regions: regionsChanged ? nextRegions : context.world.regions,
      countries: countriesChanged ? nextCountries : context.world.countries,
    },
    emittedEvents,
    nextEventSequence,
  };
}

/** Bind T017 to T010's daily instability phase boundary. */
export function createInstabilityPhaseHook(
  config: InstabilityConfig = {},
): SimulationPhaseHook {
  const capturedConfig = { ...config };
  return (context) => runInstabilityPhase(context, capturedConfig);
}
