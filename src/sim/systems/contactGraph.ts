import type { WorldState } from "../state/world";
import type { ContactEdgeRuntimeState } from "../state/contact";
import {
  assertScenarioContactTopology,
  CONTACT_CHANNELS,
  type ContactChannel,
  type ContactEdgeDefinition,
  type ScenarioDefinition,
} from "../state/scenario";
import type { ContactEdgeId, CountryId, RegionId } from "../state/ids";
import { getFullyControllingCountryId } from "../state/territorialControl";

export interface ContactEdgeView extends ContactEdgeDefinition {
  readonly runtimeState: ContactEdgeRuntimeState | null;
  readonly effectiveStrength: number;
}

/** One directed route projected onto the countries currently controlling it. */
export interface DerivedCountryContact {
  readonly edgeId: ContactEdgeId;
  readonly fromRegionId: RegionId;
  readonly toRegionId: RegionId;
  readonly fromCountryId: CountryId;
  readonly toCountryId: CountryId;
  readonly channel: ContactChannel;
  readonly effectiveStrength: number;
}

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function assertRuntimeState(
  scenario: ScenarioDefinition,
  world: WorldState,
): void {
  const edgeIds = new Set(
    scenario.mapContactTopology.contactEdges.map((edge) => edge.id),
  );

  for (const [edgeId, runtimeState] of Object.entries(
    world.contactEdgeStates,
  )) {
    if (!edgeIds.has(edgeId as ContactEdgeId)) {
      throw new Error(
        `Contact runtime state references unknown edge ${edgeId}.`,
      );
    }

    if (
      typeof runtimeState !== "object" ||
      runtimeState === null ||
      typeof runtimeState.enabled !== "boolean"
    ) {
      throw new Error(`Contact runtime state ${edgeId} is invalid.`);
    }

    if (
      !Number.isFinite(runtimeState.multiplier) ||
      runtimeState.multiplier < 0
    ) {
      throw new Error(
        `Contact runtime state ${edgeId}.multiplier must be finite and non-negative.`,
      );
    }

    if (
      runtimeState.blockedReason !== undefined &&
      (typeof runtimeState.blockedReason !== "string" ||
        runtimeState.blockedReason.length === 0)
    ) {
      throw new Error(
        `Contact runtime state ${edgeId}.blockedReason must be a non-empty string.`,
      );
    }

    if (
      runtimeState.blockedByCountryId !== undefined &&
      (typeof runtimeState.blockedByCountryId !== "string" ||
        runtimeState.blockedByCountryId.length === 0 ||
        world.countries[runtimeState.blockedByCountryId] === undefined)
    ) {
      throw new Error(
        `Contact runtime state ${edgeId}.blockedByCountryId must reference a known country.`,
      );
    }
  }
}

function assertContactGraphState(
  scenario: ScenarioDefinition,
  world: WorldState,
): void {
  assertScenarioContactTopology(scenario);
  assertRuntimeState(scenario, world);
}

function assertChannel(channel: ContactChannel): void {
  if (!CONTACT_CHANNELS.includes(channel)) {
    throw new Error(`Invalid contact channel ${channel}.`);
  }
}

function assertRegionExists(
  scenario: ScenarioDefinition,
  world: WorldState,
  regionId: RegionId,
): void {
  if (!scenario.mapContactTopology.regionIds.includes(regionId)) {
    throw new Error(`Region ${regionId} is not in the contact topology.`);
  }

  if (world.regions[regionId] === undefined) {
    throw new Error(`Contact query references missing region ${regionId}.`);
  }
}

function getEdgeById(
  scenario: ScenarioDefinition,
  edgeId: ContactEdgeId,
): ContactEdgeDefinition {
  const edge = scenario.mapContactTopology.contactEdges.find(
    (candidate) => candidate.id === edgeId,
  );

  if (edge === undefined) {
    throw new Error(`Contact edge ${edgeId} does not exist in the scenario.`);
  }

  return edge;
}

function getEffectiveStrength(
  edge: ContactEdgeDefinition,
  runtimeState: ContactEdgeRuntimeState | undefined,
): number {
  if (runtimeState?.enabled === false) {
    return 0;
  }

  const multiplier = runtimeState?.multiplier ?? 1;
  return Math.min(1, Math.max(0, edge.baseStrength * multiplier));
}

function createEdgeView(
  edge: ContactEdgeDefinition,
  world: WorldState,
): ContactEdgeView {
  const runtimeState = world.contactEdgeStates[edge.id] ?? null;

  return {
    ...edge,
    runtimeState,
    effectiveStrength: getEffectiveStrength(edge, runtimeState ?? undefined),
  };
}

function sortViews(views: ContactEdgeView[]): readonly ContactEdgeView[] {
  return views.sort((first, second) => compareStableText(first.id, second.id));
}

/** Return directed edges leaving one current Region; disabled edges remain visible with strength 0. */
export function getOutgoingContacts(
  scenario: ScenarioDefinition,
  world: WorldState,
  regionId: RegionId,
): readonly ContactEdgeView[] {
  assertContactGraphState(scenario, world);
  assertRegionExists(scenario, world, regionId);

  return sortViews(
    scenario.mapContactTopology.contactEdges
      .filter((edge) => edge.fromRegionId === regionId)
      .map((edge) => createEdgeView(edge, world)),
  );
}

/** Return directed edges entering one current Region; disabled edges remain visible with strength 0. */
export function getIncomingContacts(
  scenario: ScenarioDefinition,
  world: WorldState,
  regionId: RegionId,
): readonly ContactEdgeView[] {
  assertContactGraphState(scenario, world);
  assertRegionExists(scenario, world, regionId);

  return sortViews(
    scenario.mapContactTopology.contactEdges
      .filter((edge) => edge.toRegionId === regionId)
      .map((edge) => createEdgeView(edge, world)),
  );
}

/** Return all directed edges for one explicit channel in stable edge-ID order. */
export function getContactsByChannel(
  scenario: ScenarioDefinition,
  world: WorldState,
  channel: ContactChannel,
): readonly ContactEdgeView[] {
  assertContactGraphState(scenario, world);
  assertChannel(channel);

  return sortViews(
    scenario.mapContactTopology.contactEdges
      .filter((edge) => edge.channel === channel)
      .map((edge) => createEdgeView(edge, world)),
  );
}

/** Return the current effective strength for one scenario-owned edge. */
export function getEffectiveContactStrength(
  scenario: ScenarioDefinition,
  world: WorldState,
  edgeId: ContactEdgeId,
): number {
  assertContactGraphState(scenario, world);
  const edge = getEdgeById(scenario, edgeId);
  return getEffectiveStrength(edge, world.contactEdgeStates[edge.id]);
}

/**
 * Derive foreign country contacts from fully controlled Region projections.
 * Internal same-country routes remain available through Region queries.
 */
export function deriveCountryContacts(
  scenario: ScenarioDefinition,
  world: WorldState,
): readonly DerivedCountryContact[] {
  assertContactGraphState(scenario, world);

  const contacts: DerivedCountryContact[] = [];

  for (const edge of scenario.mapContactTopology.contactEdges) {
    const fromRegion = world.regions[edge.fromRegionId];
    const toRegion = world.regions[edge.toRegionId];

    if (fromRegion === undefined || toRegion === undefined) {
      throw new Error(`Contact edge ${edge.id} references a missing Region.`);
    }

    const fromCountryId = getFullyControllingCountryId(
      scenario,
      world,
      fromRegion.id,
    );
    const toCountryId = getFullyControllingCountryId(
      scenario,
      world,
      toRegion.id,
    );

    if (
      fromCountryId === null ||
      toCountryId === null ||
      fromCountryId === toCountryId
    ) {
      continue;
    }

    contacts.push({
      edgeId: edge.id,
      fromRegionId: edge.fromRegionId,
      toRegionId: edge.toRegionId,
      fromCountryId,
      toCountryId,
      channel: edge.channel,
      effectiveStrength: getEffectiveStrength(
        edge,
        world.contactEdgeStates[edge.id],
      ),
    });
  }

  return contacts.sort((first, second) =>
    compareStableText(first.edgeId, second.edgeId),
  );
}
