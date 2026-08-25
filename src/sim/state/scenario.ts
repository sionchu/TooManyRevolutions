import { createSimDate, type SimDate } from "../core/clock";
import type { Conflict } from "./conflict";
import type { Country } from "./country";
import {
  POLITICAL_CRISIS_CAPABILITIES,
  type Faction,
  type PoliticalCrisisCapability,
} from "./faction";
import type { IdeologyDefinition } from "./ideology";
import {
  asScenarioId,
  type CoupCoordinationNodeId,
  type ContactEdgeId,
  type CountryId,
  type FactionId,
  type IdeologyId,
  type InterventionId,
  type PolicyId,
  type RebellionOperationalChannelId,
  type RegionId,
  type ScenarioId,
} from "./ids";
import type {
  CoupCoordinationNodeDefinition,
  CoupCoordinationProfile,
} from "./coupCoordination";
export type {
  CoupCoordinationNodeDefinition,
  CoupCoordinationProfile,
} from "./coupCoordination";
import {
  REBELLION_OPERATIONAL_CHANNEL_KINDS,
  type RebellionOperationalChannelDefinition,
  type RebellionPersistenceProfile,
} from "./rebellionPersistence";
export { REBELLION_OPERATIONAL_CHANNEL_KINDS } from "./rebellionPersistence";
export type {
  RebellionOperationalChannelDefinition,
  RebellionOperationalChannelKind,
  RebellionPersistenceProfile,
} from "./rebellionPersistence";
import type { PolicyDefinition, PolicyState } from "./policy";
import type { ScenarioRegion } from "./region";
import type { SovereignFunction } from "./run";
import type { Government } from "./government";
import type { InterventionDefinition } from "./intervention";
import {
  assertScenarioTerritorialTopology,
  type TerritorialTopologyDefinition,
} from "./territorialTopology";

export type ContactChannel = "border" | "trade" | "migration" | "information";

export const CONTACT_CHANNELS: readonly ContactChannel[] = [
  "border",
  "trade",
  "migration",
  "information",
] as const;

export interface ContactEdgeDefinition {
  readonly id: ContactEdgeId;
  readonly fromRegionId: RegionId;
  readonly toRegionId: RegionId;
  readonly channel: ContactChannel;
  readonly baseStrength: number;
}

/** Static map nodes and possible causal-contact routes for one scenario. */
export interface MapContactTopologyDefinition {
  readonly regionIds: readonly RegionId[];
  readonly contactEdges: readonly ContactEdgeDefinition[];
}

export interface OrderConsolidationCriteria {
  readonly requiredStableRegionIds: readonly RegionId[];
  /** Optional scenario-owned upper bound for Region.unrest stability. */
  readonly maximumStableRegionUnrest?: number;
  readonly requiredControlledCoreRegionIds: readonly RegionId[];
  readonly requireCapitalControl: boolean;
  readonly minimumStateCapacity: number;
  readonly minimumTreasury: number;
  readonly requiresNoActiveCivilWar: boolean;
  readonly requiredConsecutiveTicks: number;
}

export interface DissolutionCriteria {
  readonly stateContinuityAtOrBelow: number;
  readonly fullAnnexationIsTerminal: boolean;
  readonly permanentFragmentationIsTerminal: boolean;
  /** Loss of every listed function is a dissolution condition. */
  readonly sovereignFunctionsRequiredForContinuity: readonly SovereignFunction[];
}

/** Explicit scenario-authored mapping; never inferred from faction interests. */
export interface FactionProposalTemplate {
  readonly factionId: FactionId;
  /** v1 opens only from an accepted faction LOBBY ActionRecord. */
  readonly triggerAction: "LOBBY";
  readonly interventionId: InterventionId;
}

/** Explicit scenario-owned FUND_MOVEMENT authoring; never inferred at runtime. */
export interface FactionFundMovementTemplate {
  readonly factionId: FactionId;
  readonly targetRegionId: RegionId;
  readonly resourceAmount: number;
}

/** Static coup-coordination identities; no runtime state is created from this field. */
export type CoupCoordinationNodeDefinitions =
  readonly CoupCoordinationNodeDefinition[];

/**
 * Immutable scenario input. It owns definitions and initial snapshots;
 * WorldState contains only the mutable state of a particular run.
 */
export interface ScenarioDefinition {
  readonly id: ScenarioId;
  readonly version: number;
  /** Null is permitted only for the non-playable Gate 0 foundation scenario. */
  readonly playerCountryId: CountryId | null;
  readonly initialDate: SimDate;
  readonly initialCountries: readonly Country[];
  /** Static regional inputs; initialController is consumed only at run creation. */
  readonly initialRegions: readonly ScenarioRegion[];
  readonly initialGovernments: readonly Government[];
  readonly initialFactions: readonly Faction[];
  readonly initialConflicts: readonly Conflict[];
  /** Static actor capabilities; never copied into mutable WorldState. */
  readonly factionCapabilities?: Readonly<
    Record<FactionId, readonly PoliticalCrisisCapability[]>
  >;
  readonly factionProposalTemplates?: readonly FactionProposalTemplate[];
  readonly factionFundMovementTemplates?: readonly FactionFundMovementTemplate[];
  readonly rebellionOperationalChannels?: readonly RebellionOperationalChannelDefinition[];
  readonly rebellionPersistenceProfiles?: readonly RebellionPersistenceProfile[];
  readonly coupCoordinationNodes?: CoupCoordinationNodeDefinitions;
  readonly coupCoordinationProfiles?: readonly CoupCoordinationProfile[];
  readonly initialCountryPolicies: Readonly<Record<CountryId, PolicyState>>;
  readonly ideologyCatalog: Readonly<Record<IdeologyId, IdeologyDefinition>>;
  readonly policyCatalog: Readonly<Record<PolicyId, PolicyDefinition>>;
  readonly interventionCatalog: Readonly<
    Record<InterventionId, InterventionDefinition>
  >;
  readonly mapContactTopology: MapContactTopologyDefinition;
  readonly mapTerritorialTopology: TerritorialTopologyDefinition;
  readonly orderConsolidationCriteria: OrderConsolidationCriteria;
  readonly dissolutionCriteria: DissolutionCriteria;
}

/** Validate the static contact topology before it becomes a run. */
export function assertScenarioContactTopology(
  scenario: ScenarioDefinition,
): void {
  const initialRegionIds = new Set<RegionId>(
    scenario.initialRegions.map((region) => region.id),
  );
  const topologyRegionIds = new Set<RegionId>();

  for (const regionId of scenario.mapContactTopology.regionIds) {
    if (topologyRegionIds.has(regionId)) {
      throw new Error(`Contact topology repeats region ${regionId}.`);
    }

    if (!initialRegionIds.has(regionId)) {
      throw new Error(
        `Contact topology references missing region ${regionId}.`,
      );
    }

    topologyRegionIds.add(regionId);
  }

  const edgeIds = new Set<ContactEdgeId>();

  for (const edge of scenario.mapContactTopology.contactEdges) {
    if (edgeIds.has(edge.id)) {
      throw new Error(`Contact topology repeats edge ${edge.id}.`);
    }

    if (!initialRegionIds.has(edge.fromRegionId)) {
      throw new Error(
        `Contact edge ${edge.id} references missing source region ${edge.fromRegionId}.`,
      );
    }

    if (!initialRegionIds.has(edge.toRegionId)) {
      throw new Error(
        `Contact edge ${edge.id} references missing target region ${edge.toRegionId}.`,
      );
    }

    if (
      !topologyRegionIds.has(edge.fromRegionId) ||
      !topologyRegionIds.has(edge.toRegionId)
    ) {
      throw new Error(
        `Contact edge ${edge.id} endpoints must be listed in mapContactTopology.regionIds.`,
      );
    }

    if (!CONTACT_CHANNELS.includes(edge.channel)) {
      throw new Error(`Contact edge ${edge.id} has an invalid channel.`);
    }

    if (
      !Number.isFinite(edge.baseStrength) ||
      edge.baseStrength < 0 ||
      edge.baseStrength > 1
    ) {
      throw new Error(
        `Contact edge ${edge.id}.baseStrength must be between 0 and 1.`,
      );
    }

    edgeIds.add(edge.id);
  }
}

/** Validate optional static political-crisis capabilities at the scenario boundary. */
function assertScenarioFactionCapabilities(scenario: ScenarioDefinition): void {
  const factionIds = new Set(
    scenario.initialFactions.map((faction) => faction.id),
  );

  for (const [factionId, capabilities] of Object.entries(
    scenario.factionCapabilities ?? {},
  )) {
    if (!factionIds.has(factionId as FactionId)) {
      throw new Error(
        `Faction capability metadata references missing faction ${factionId}.`,
      );
    }

    const seen = new Set<PoliticalCrisisCapability>();
    for (const capability of capabilities) {
      if (!POLITICAL_CRISIS_CAPABILITIES.includes(capability)) {
        throw new Error(
          `Faction ${factionId} has an invalid political-crisis capability.`,
        );
      }

      if (seen.has(capability)) {
        throw new Error(
          `Faction ${factionId} repeats political-crisis capability ${capability}.`,
        );
      }

      seen.add(capability);
    }
  }
}

/** Validate only explicit faction/action/intervention mappings authored by a scenario. */
function assertScenarioFactionProposalTemplates(
  scenario: ScenarioDefinition,
): void {
  const factionIds = new Set(
    scenario.initialFactions.map((faction) => faction.id),
  );
  const interventionIds = new Set(Object.keys(scenario.interventionCatalog));
  const seen = new Set<string>();

  for (const template of scenario.factionProposalTemplates ?? []) {
    if (!factionIds.has(template.factionId)) {
      throw new Error(
        `Faction proposal template references missing faction ${template.factionId}.`,
      );
    }

    if (!interventionIds.has(template.interventionId)) {
      throw new Error(
        `Faction proposal template references missing intervention ${template.interventionId}.`,
      );
    }

    if (template.triggerAction !== "LOBBY") {
      throw new Error(
        `Faction proposal template has invalid trigger action ${template.triggerAction}.`,
      );
    }

    const key = `${template.factionId}:${template.triggerAction}`;
    if (seen.has(key)) {
      throw new Error(`Faction proposal template repeats ${key}.`);
    }
    seen.add(key);
  }
}

/** Validate explicit, scenario-owned FUND_MOVEMENT profiles only. */
function assertScenarioFactionFundMovementTemplates(
  scenario: ScenarioDefinition,
): void {
  const factionsById = new Map(
    scenario.initialFactions.map((faction) => [faction.id, faction]),
  );
  const regionsById = new Map(
    scenario.initialRegions.map((region) => [region.id, region]),
  );
  const seenFactionIds = new Set<FactionId>();

  for (const template of scenario.factionFundMovementTemplates ?? []) {
    const faction = factionsById.get(template.factionId);
    if (faction === undefined) {
      throw new Error(
        `FUND_MOVEMENT template references missing faction ${template.factionId}.`,
      );
    }

    const targetRegion = regionsById.get(template.targetRegionId);
    if (targetRegion === undefined) {
      throw new Error(
        `FUND_MOVEMENT template references missing target Region ${template.targetRegionId}.`,
      );
    }

    if (targetRegion.ownerCountryId !== faction.countryId) {
      throw new Error(
        `FUND_MOVEMENT template for faction ${template.factionId} must target a Region owned by faction country ${faction.countryId}.`,
      );
    }

    if (
      !Number.isFinite(template.resourceAmount) ||
      template.resourceAmount <= 0
    ) {
      throw new Error(
        `FUND_MOVEMENT template for faction ${template.factionId} must have a finite positive resourceAmount.`,
      );
    }

    if (seenFactionIds.has(template.factionId)) {
      throw new Error(
        `FUND_MOVEMENT template repeats faction ${template.factionId}.`,
      );
    }
    seenFactionIds.add(template.factionId);
  }
}

/** Validate the static, scenario-authored coup-coordination seam only. */
export function assertScenarioCoupCoordinationAuthoring(
  scenario: Pick<
    ScenarioDefinition,
    | "initialCountries"
    | "initialFactions"
    | "factionCapabilities"
    | "initialGovernments"
    | "coupCoordinationNodes"
    | "coupCoordinationProfiles"
  >,
): void {
  const countriesById = new Map(
    scenario.initialCountries.map((country) => [country.id, country]),
  );
  const factionsById = new Map(
    scenario.initialFactions.map((faction) => [faction.id, faction]),
  );
  const governmentsById = new Map(
    scenario.initialGovernments.map((government) => [
      government.id,
      government,
    ]),
  );
  const nodesById = new Map<
    CoupCoordinationNodeId,
    CoupCoordinationNodeDefinition
  >();

  for (const node of scenario.coupCoordinationNodes ?? []) {
    if (node.id.length === 0) {
      throw new Error("Coup coordination node identity must not be empty.");
    }

    if (nodesById.has(node.id)) {
      throw new Error(`Coup coordination nodes repeat ${node.id}.`);
    }

    if (!countriesById.has(node.countryId)) {
      throw new Error(
        `Coup coordination node ${node.id} references missing country ${node.countryId}.`,
      );
    }

    if (node.name.trim().length === 0) {
      throw new Error(
        `Coup coordination node ${node.id} must have a non-empty name.`,
      );
    }

    nodesById.set(node.id, node);
  }

  const seenProfileFactionIdsByCountry = new Map<CountryId, Set<FactionId>>();
  for (const profile of scenario.coupCoordinationProfiles ?? []) {
    const faction = factionsById.get(profile.coupFactionId);
    if (faction === undefined) {
      throw new Error(
        `Coup coordination profile references missing faction ${profile.coupFactionId}.`,
      );
    }

    const country = countriesById.get(profile.countryId);
    if (country === undefined) {
      throw new Error(
        `Coup coordination profile references missing country ${profile.countryId}.`,
      );
    }

    if (faction.countryId !== profile.countryId) {
      throw new Error(
        `Coup coordination profile faction ${profile.coupFactionId} must belong to country ${profile.countryId}.`,
      );
    }

    const factionCapabilities =
      scenario.factionCapabilities?.[profile.coupFactionId] ?? [];
    if (!factionCapabilities.includes("coup")) {
      throw new Error(
        `Coup coordination profile faction ${profile.coupFactionId} must have the coup capability.`,
      );
    }

    const profileLabel = `${profile.countryId}:${profile.coupFactionId}`;
    let seenFactionIds = seenProfileFactionIdsByCountry.get(profile.countryId);
    if (seenFactionIds === undefined) {
      seenFactionIds = new Set<FactionId>();
      seenProfileFactionIdsByCountry.set(profile.countryId, seenFactionIds);
    }

    if (seenFactionIds.has(profile.coupFactionId)) {
      throw new Error(`Coup coordination profile repeats ${profileLabel}.`);
    }
    seenFactionIds.add(profile.coupFactionId);

    if (profile.requiredNodeIds.length === 0) {
      throw new Error(
        `Coup coordination profile ${profileLabel} must require at least one node.`,
      );
    }

    const seenNodeIds = new Set<CoupCoordinationNodeId>();
    for (const nodeId of profile.requiredNodeIds) {
      if (seenNodeIds.has(nodeId)) {
        throw new Error(
          `Coup coordination profile ${profileLabel} repeats required node ${nodeId}.`,
        );
      }
      seenNodeIds.add(nodeId);

      const node = nodesById.get(nodeId);
      if (node === undefined) {
        throw new Error(
          `Coup coordination profile ${profileLabel} references missing node ${nodeId}.`,
        );
      }

      if (node.countryId !== profile.countryId) {
        throw new Error(
          `Coup coordination profile ${profileLabel} node ${nodeId} must belong to country ${profile.countryId}.`,
        );
      }
    }

    const successorGovernment = governmentsById.get(
      profile.successorGovernmentId,
    );
    if (successorGovernment === undefined) {
      throw new Error(
        `Coup coordination profile ${profileLabel} references missing successor Government ${profile.successorGovernmentId}.`,
      );
    }

    if (successorGovernment.countryId !== profile.countryId) {
      throw new Error(
        `Coup coordination profile ${profileLabel} successor Government must belong to country ${profile.countryId}.`,
      );
    }

    if (country.currentGovernmentId === profile.successorGovernmentId) {
      throw new Error(
        `Coup coordination profile ${profileLabel} successor Government must differ from the current Government.`,
      );
    }
  }
}

/** Validate the static, scenario-authored rebellion-persistence seam only. */
export function assertScenarioRebellionPersistenceAuthoring(
  scenario: Pick<
    ScenarioDefinition,
    | "initialCountries"
    | "initialFactions"
    | "factionCapabilities"
    | "rebellionOperationalChannels"
    | "rebellionPersistenceProfiles"
  >,
): void {
  const countriesById = new Map(
    scenario.initialCountries.map((country) => [country.id, country]),
  );
  const factionsById = new Map(
    scenario.initialFactions.map((faction) => [faction.id, faction]),
  );
  const channelsById = new Map<
    RebellionOperationalChannelId,
    RebellionOperationalChannelDefinition
  >();

  for (const channel of scenario.rebellionOperationalChannels ?? []) {
    if (channel.id.length === 0) {
      throw new Error(
        "Rebellion operational channel identity must not be empty.",
      );
    }

    if (channelsById.has(channel.id)) {
      throw new Error(
        "Rebellion operational channels repeat " + channel.id + ".",
      );
    }

    if (!countriesById.has(channel.countryId)) {
      throw new Error(
        "Rebellion operational channel " +
          channel.id +
          " references missing country " +
          channel.countryId +
          ".",
      );
    }

    if (!REBELLION_OPERATIONAL_CHANNEL_KINDS.includes(channel.kind)) {
      throw new Error(
        "Rebellion operational channel " +
          channel.id +
          " has an invalid kind " +
          channel.kind +
          ".",
      );
    }

    if (channel.name.trim().length === 0) {
      throw new Error(
        "Rebellion operational channel " +
          channel.id +
          " must have a non-empty name.",
      );
    }

    channelsById.set(channel.id, channel);
  }

  const profileIds = new Set<string>();
  const profileFactionIdsByCountry = new Map<CountryId, Set<FactionId>>();

  for (const profile of scenario.rebellionPersistenceProfiles ?? []) {
    if (profile.id.length === 0) {
      throw new Error(
        "Rebellion persistence profile identity must not be empty.",
      );
    }

    if (profileIds.has(profile.id)) {
      throw new Error(
        "Rebellion persistence profiles repeat " + profile.id + ".",
      );
    }
    profileIds.add(profile.id);

    if (!countriesById.has(profile.countryId)) {
      throw new Error(
        "Rebellion persistence profile " +
          profile.id +
          " references missing country " +
          profile.countryId +
          ".",
      );
    }

    const faction = factionsById.get(profile.factionId);
    if (faction === undefined) {
      throw new Error(
        "Rebellion persistence profile " +
          profile.id +
          " references missing faction " +
          profile.factionId +
          ".",
      );
    }

    if (faction.countryId !== profile.countryId) {
      throw new Error(
        "Rebellion persistence profile " +
          profile.id +
          " faction " +
          profile.factionId +
          " must belong to country " +
          profile.countryId +
          ".",
      );
    }

    const capabilities =
      scenario.factionCapabilities?.[profile.factionId] ?? [];
    if (!capabilities.includes("rebellion")) {
      throw new Error(
        "Rebellion persistence profile " +
          profile.id +
          " faction " +
          profile.factionId +
          " must have the rebellion capability.",
      );
    }

    let profileFactionIds = profileFactionIdsByCountry.get(profile.countryId);
    if (profileFactionIds === undefined) {
      profileFactionIds = new Set<FactionId>();
      profileFactionIdsByCountry.set(profile.countryId, profileFactionIds);
    }

    if (profileFactionIds.has(profile.factionId)) {
      throw new Error(
        "Rebellion persistence profile repeats Country/Faction pair " +
          profile.countryId +
          "/" +
          profile.factionId +
          ".",
      );
    }
    profileFactionIds.add(profile.factionId);

    if (profile.channelIds.length === 0) {
      throw new Error(
        "Rebellion persistence profile " +
          profile.id +
          " must reference at least one channel.",
      );
    }

    const channelIds = new Set<RebellionOperationalChannelId>();
    for (const channelId of profile.channelIds) {
      if (channelIds.has(channelId)) {
        throw new Error(
          "Rebellion persistence profile " +
            profile.id +
            " repeats channel " +
            channelId +
            ".",
        );
      }
      channelIds.add(channelId);

      const channel = channelsById.get(channelId);
      if (channel === undefined) {
        throw new Error(
          "Rebellion persistence profile " +
            profile.id +
            " references missing channel " +
            channelId +
            ".",
        );
      }

      if (channel.countryId !== profile.countryId) {
        throw new Error(
          "Rebellion persistence profile " +
            profile.id +
            " channel " +
            channelId +
            " must belong to country " +
            profile.countryId +
            ".",
        );
      }
    }
  }
}

/** Validate the static topology owned by one ScenarioDefinition. */
export function assertScenarioDefinition(scenario: ScenarioDefinition): void {
  assertScenarioContactTopology(scenario);
  assertScenarioTerritorialTopology(scenario);
  assertScenarioFactionCapabilities(scenario);
  assertScenarioFactionProposalTemplates(scenario);
  assertScenarioFactionFundMovementTemplates(scenario);
  assertScenarioRebellionPersistenceAuthoring(scenario);
  assertScenarioCoupCoordinationAuthoring(scenario);
}

/** A non-playable bootstrap scenario; T025 supplies the first playable data. */
export const FOUNDATION_SCENARIO: ScenarioDefinition = {
  id: asScenarioId("foundation"),
  version: 1,
  playerCountryId: null,
  initialDate: createSimDate(),
  initialCountries: [],
  initialRegions: [],
  initialGovernments: [],
  initialFactions: [],
  initialConflicts: [],
  initialCountryPolicies: {},
  ideologyCatalog: {},
  policyCatalog: {},
  interventionCatalog: {},
  mapContactTopology: {
    regionIds: [],
    contactEdges: [],
  },
  mapTerritorialTopology: {
    landHexes: [],
  },
  orderConsolidationCriteria: {
    requiredStableRegionIds: [],
    requiredControlledCoreRegionIds: [],
    requireCapitalControl: false,
    minimumStateCapacity: 0,
    minimumTreasury: 0,
    requiresNoActiveCivilWar: true,
    requiredConsecutiveTicks: 0,
  },
  dissolutionCriteria: {
    stateContinuityAtOrBelow: 0,
    fullAnnexationIsTerminal: true,
    permanentFragmentationIsTerminal: true,
    sovereignFunctionsRequiredForContinuity: [],
  },
};
