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
  type ContactEdgeId,
  type CountryId,
  type FactionId,
  type IdeologyId,
  type InterventionId,
  type PolicyId,
  type RegionId,
  type ScenarioId,
} from "./ids";
import type { PolicyDefinition, PolicyState } from "./policy";
import type { ScenarioRegion } from "./region";
import type { SovereignFunction } from "./run";
import type { Government } from "./government";
import type { InterventionDefinition } from "./intervention";
import { FACTION_ACTION_TYPES, type FactionActionType } from "./action";
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
  readonly triggerAction: FactionActionType;
  readonly interventionId: InterventionId;
}

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

    if (!FACTION_ACTION_TYPES.includes(template.triggerAction)) {
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

/** Validate the static topology owned by one ScenarioDefinition. */
export function assertScenarioDefinition(scenario: ScenarioDefinition): void {
  assertScenarioContactTopology(scenario);
  assertScenarioTerritorialTopology(scenario);
  assertScenarioFactionCapabilities(scenario);
  assertScenarioFactionProposalTemplates(scenario);
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
