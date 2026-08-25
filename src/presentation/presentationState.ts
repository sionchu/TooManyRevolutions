import type { SimDate } from "../sim/core/clock";
import {
  deriveActiveConflictFrontEdges,
  type ConflictFrontEdge,
} from "../sim/systems/conflictResolution";
import {
  getOutgoingContacts,
  type ContactEdgeView,
} from "../sim/systems/contactGraph";
import {
  deriveRegionControlSummary,
  getFactionControlledLandHexIds,
  type RegionControlSummary,
} from "../sim/state/territorialControl";
import { getLandHex } from "../sim/state/territorialTopology";
import type { ContactEdgeRuntimeState } from "../sim/state/contact";
import type { ContactChannel } from "../sim/state/scenario";
import type { ConflictKind } from "../sim/state/conflict";
import type { Faction } from "../sim/state/faction";
import type {
  ConflictId,
  CountryId,
  FactionId,
  GovernmentId,
  IdeologyId,
  LandHexId,
  RegionId,
} from "../sim/state/ids";
import type { TerritorialController, Region } from "../sim/state/region";
import type { RunOutcome } from "../sim/state/run";
import type { ScenarioDefinition } from "../sim/state/scenario";
import { assertScenarioDefinition } from "../sim/state/scenario";
import type {
  LandHexCoordinate,
  LandHexTerrain,
} from "../sim/state/territorialTopology";
import type { WorldState } from "../sim/state/world";
import { assertLandHexRuntimeStateInvariants } from "../sim/state/territorialControl";

export interface PresentationLandHex {
  readonly landHexId: LandHexId;
  readonly regionId: RegionId;
  /** Static axial topology; renderer coordinates are deliberately absent. */
  readonly coordinate: LandHexCoordinate;
  readonly terrain: LandHexTerrain;
  /** Read-only projection of WorldState.landHexStates[landHexId].controller. */
  readonly controller: TerritorialController;
}

export interface PoliticalInfluencePresentation {
  readonly ideologyId: IdeologyId;
  /** Existing Region.ideology.support; no new influence formula is introduced. */
  readonly support: number;
  readonly radicalism: number;
  readonly organization: number;
}

export interface PresentationRegion {
  readonly regionId: RegionId;
  readonly name: string;
  /** Legal/historical ownership, separate from physical LandHex control. */
  readonly ownerCountryId: CountryId;
  readonly control: RegionControlSummary;
  readonly unrest: number;
  readonly scarcity: number;
  readonly politicalInfluence: readonly PoliticalInfluencePresentation[];
}

/** One actual Country, including its present government pointer for labels. */
export interface PresentationCountry {
  readonly countryId: CountryId;
  readonly name: string;
  readonly capitalRegionId: RegionId | null;
  readonly currentGovernmentId: GovernmentId | null;
  readonly isPlayer: boolean;
}

/** One actual Faction presence anchored by the LandHex controller projection. */
export interface OrganizationTokenPresentation {
  /** Stable identity derived from faction and Region IDs, not iteration order. */
  readonly tokenId: string;
  readonly factionId: FactionId;
  readonly countryId: CountryId;
  readonly regionId: RegionId;
  readonly controlledLandHexIds: readonly LandHexId[];
  readonly organization: number;
  readonly ideologyIds: readonly IdeologyId[];
}

export interface ContactRoutePresentation {
  readonly routeId: string;
  readonly sourceRegionId: RegionId;
  readonly targetRegionId: RegionId;
  readonly channel: ContactChannel;
  readonly baseStrength: number;
  readonly effectiveStrength: number;
  readonly active: boolean;
  readonly enabled: boolean;
  readonly multiplier: number;
  readonly blockedReason?: string;
  readonly blockedByCountryId?: CountryId;
}

export interface FrontEdgePresentation {
  /** Stable presentation identity; the front itself is not stored in WorldState. */
  readonly frontId: string;
  readonly conflictId: ConflictId;
  readonly conflictKind: ConflictKind;
  readonly firstLandHexId: LandHexId;
  readonly secondLandHexId: LandHexId;
  readonly firstRegionId: RegionId;
  readonly secondRegionId: RegionId;
  readonly firstController: TerritorialController;
  readonly secondController: TerritorialController;
}

export interface PresentationRunState {
  readonly outcome: RunOutcome;
  readonly consolidation: {
    readonly isCurrentlyEligible: boolean;
    readonly consecutiveEligibleTicks: number;
    readonly lastEvaluatedTick: number | null;
  };
}

/**
 * Renderer-neutral, derived state. It is never stored in WorldState or a
 * persistence snapshot and has no simulation write path.
 */
export interface PresentationState {
  readonly scenarioId: ScenarioDefinition["id"];
  readonly scenarioVersion: number;
  readonly tick: number;
  readonly date: SimDate;
  readonly countries: readonly PresentationCountry[];
  readonly landHexes: readonly PresentationLandHex[];
  readonly regions: readonly PresentationRegion[];
  readonly organizationTokens: readonly OrganizationTokenPresentation[];
  readonly contactRoutes: readonly ContactRoutePresentation[];
  readonly fronts: readonly FrontEdgePresentation[];
  readonly run: PresentationRunState;
}

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function encodeIdentityPart(value: string): string {
  return encodeURIComponent(value);
}

function makeStablePresentationId(
  prefix: string,
  parts: readonly string[],
): string {
  return [prefix, ...parts.map(encodeIdentityPart)].join(":");
}

function cloneController(
  controller: TerritorialController,
): TerritorialController {
  switch (controller.kind) {
    case "country":
      return { kind: "country", countryId: controller.countryId };
    case "faction":
      return { kind: "faction", factionId: controller.factionId };
    case "uncontrolled":
      return { kind: "uncontrolled" };
  }
}

function cloneDate(date: SimDate): SimDate {
  return { year: date.year, month: date.month, day: date.day };
}

function cloneOutcome(outcome: RunOutcome): RunOutcome {
  return { ...outcome };
}

function sortedWorldRegions(world: WorldState): readonly Region[] {
  return Object.values(world.regions).sort((first, second) =>
    compareStableText(first.id, second.id),
  );
}

function sortedWorldFactions(world: WorldState): readonly Faction[] {
  return Object.values(world.factions).sort((first, second) =>
    compareStableText(first.id, second.id),
  );
}

function derivePresentationLandHexes(
  scenario: ScenarioDefinition,
  world: WorldState,
): readonly PresentationLandHex[] {
  return [...scenario.mapTerritorialTopology.landHexes]
    .sort((first, second) => compareStableText(first.id, second.id))
    .map((landHex) => {
      const runtimeState = world.landHexStates[landHex.id];
      if (runtimeState === undefined) {
        throw new Error(`LandHex ${landHex.id} has no runtime state.`);
      }

      return {
        landHexId: landHex.id,
        regionId: landHex.regionId,
        coordinate: { ...landHex.coordinate },
        terrain: landHex.terrain,
        controller: cloneController(runtimeState.controller),
      };
    });
}

function derivePresentationCountries(
  scenario: ScenarioDefinition,
  world: WorldState,
): readonly PresentationCountry[] {
  return Object.values(world.countries)
    .sort((first, second) => compareStableText(first.id, second.id))
    .map((country) => ({
      countryId: country.id,
      name: country.name,
      capitalRegionId: country.capitalRegionId,
      currentGovernmentId: country.currentGovernmentId,
      isPlayer: country.id === scenario.playerCountryId,
    }));
}

function derivePoliticalInfluence(
  region: Region,
): readonly PoliticalInfluencePresentation[] {
  return Object.entries(region.ideology)
    .filter(([, state]) => state.support > 0)
    .sort(([first], [second]) => compareStableText(first, second))
    .map(([ideologyId, state]) => ({
      ideologyId: ideologyId as IdeologyId,
      support: state.support,
      radicalism: state.radicalism,
      organization: state.organization,
    }));
}

function derivePresentationRegions(
  scenario: ScenarioDefinition,
  world: WorldState,
): readonly PresentationRegion[] {
  return sortedWorldRegions(world).map((region) => ({
    regionId: region.id,
    name: region.name,
    ownerCountryId: region.ownerCountryId,
    control: deriveRegionControlSummary(scenario, world, region.id),
    unrest: region.unrest,
    scarcity: region.scarcity,
    politicalInfluence: derivePoliticalInfluence(region),
  }));
}

function deriveOrganizationTokenForRegion(
  faction: Faction,
  regionId: RegionId,
  landHexIds: readonly LandHexId[],
): OrganizationTokenPresentation {
  return {
    tokenId: makeStablePresentationId("organization", [faction.id, regionId]),
    factionId: faction.id,
    countryId: faction.countryId,
    regionId,
    controlledLandHexIds: [...landHexIds].sort(compareStableText),
    organization: faction.organization,
    ideologyIds: Object.entries(faction.ideologyAffinity)
      .filter(([, affinity]) => affinity > 0)
      .map(([ideologyId]) => ideologyId as IdeologyId)
      .sort(compareStableText),
  };
}

function deriveOrganizationTokens(
  scenario: ScenarioDefinition,
  world: WorldState,
): readonly OrganizationTokenPresentation[] {
  const tokens: OrganizationTokenPresentation[] = [];

  for (const faction of sortedWorldFactions(world)) {
    const controlledLandHexIds = getFactionControlledLandHexIds(
      scenario,
      world,
      faction.id,
    );
    const landHexIdsByRegion = new Map<RegionId, LandHexId[]>();

    for (const landHexId of controlledLandHexIds) {
      const regionId = getLandHex(scenario, landHexId).regionId;
      const regionLandHexIds = landHexIdsByRegion.get(regionId) ?? [];
      regionLandHexIds.push(landHexId);
      landHexIdsByRegion.set(regionId, regionLandHexIds);
    }

    for (const regionId of [...landHexIdsByRegion.keys()].sort(
      compareStableText,
    )) {
      tokens.push(
        deriveOrganizationTokenForRegion(
          faction,
          regionId,
          landHexIdsByRegion.get(regionId) ?? [],
        ),
      );
    }
  }

  return tokens.sort((first, second) =>
    compareStableText(first.tokenId, second.tokenId),
  );
}

function deriveContactRoute(view: ContactEdgeView): ContactRoutePresentation {
  const runtimeState: ContactEdgeRuntimeState | null = view.runtimeState;
  return {
    routeId: view.id,
    sourceRegionId: view.fromRegionId,
    targetRegionId: view.toRegionId,
    channel: view.channel,
    baseStrength: view.baseStrength,
    effectiveStrength: view.effectiveStrength,
    active: view.effectiveStrength > 0,
    enabled: runtimeState?.enabled ?? true,
    multiplier: runtimeState?.multiplier ?? 1,
    ...(runtimeState?.blockedReason === undefined
      ? {}
      : { blockedReason: runtimeState.blockedReason }),
    ...(runtimeState?.blockedByCountryId === undefined
      ? {}
      : { blockedByCountryId: runtimeState.blockedByCountryId }),
  };
}

function deriveContactRoutes(
  scenario: ScenarioDefinition,
  world: WorldState,
): readonly ContactRoutePresentation[] {
  const regionIds = [...scenario.mapContactTopology.regionIds].sort(
    compareStableText,
  );

  return regionIds
    .flatMap((regionId) => getOutgoingContacts(scenario, world, regionId))
    .map(deriveContactRoute)
    .sort((first, second) => compareStableText(first.routeId, second.routeId));
}

function deriveFront(
  edge: ConflictFrontEdge,
  world: WorldState,
): FrontEdgePresentation {
  const conflict = world.conflicts[edge.conflictId];
  if (conflict === undefined) {
    throw new Error(`Front references missing Conflict ${edge.conflictId}.`);
  }

  return {
    frontId: makeStablePresentationId("front", [
      edge.conflictId,
      edge.firstLandHexId,
      edge.secondLandHexId,
    ]),
    conflictId: edge.conflictId,
    conflictKind: conflict.kind,
    firstLandHexId: edge.firstLandHexId,
    secondLandHexId: edge.secondLandHexId,
    firstRegionId: edge.firstRegionId,
    secondRegionId: edge.secondRegionId,
    firstController: cloneController(edge.firstController),
    secondController: cloneController(edge.secondController),
  };
}

function deriveFronts(
  scenario: ScenarioDefinition,
  world: WorldState,
): readonly FrontEdgePresentation[] {
  return deriveActiveConflictFrontEdges(scenario, world)
    .map((edge) => deriveFront(edge, world))
    .sort((first, second) => compareStableText(first.frontId, second.frontId));
}

function deriveRunState(world: WorldState): PresentationRunState {
  return {
    outcome: cloneOutcome(world.run.outcome),
    consolidation: { ...world.run.consolidation },
  };
}

/**
 * Compose the minimal map-semantic read model for a future renderer.
 * Scenario content and mutable WorldState are read only; no simulation phase,
 * RNG, event, action, or presentation writer participates here.
 */
export function derivePresentationState(
  scenario: ScenarioDefinition,
  world: WorldState,
): PresentationState {
  assertScenarioDefinition(scenario);
  assertLandHexRuntimeStateInvariants(scenario, world);

  return {
    scenarioId: scenario.id,
    scenarioVersion: scenario.version,
    tick: world.tick,
    date: cloneDate(world.date),
    countries: derivePresentationCountries(scenario, world),
    landHexes: derivePresentationLandHexes(scenario, world),
    regions: derivePresentationRegions(scenario, world),
    organizationTokens: deriveOrganizationTokens(scenario, world),
    contactRoutes: deriveContactRoutes(scenario, world),
    fronts: deriveFronts(scenario, world),
    run: deriveRunState(world),
  };
}
