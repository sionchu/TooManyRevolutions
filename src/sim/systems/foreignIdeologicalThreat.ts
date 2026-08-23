import type { JsonValue } from "../core/serialization";
import type { Country } from "../state/country";
import type { Faction } from "../state/faction";
import type {
  ContactEdgeId,
  CountryId,
  FactionId,
  IdeologyId,
  RegionId,
} from "../state/ids";
import type { Region } from "../state/region";
import type { ContactChannel, ScenarioDefinition } from "../state/scenario";
import type { WorldState } from "../state/world";
import { isFactionRelevantToRegion } from "./factionPressure";
import { deriveCountryContacts } from "./contactGraph";
import { DEFAULT_IDEOLOGY_DIFFUSION_CHANNEL_WEIGHTS } from "./ideologyDiffusion";

/**
 * T020's derived-only thresholds. These are classification gates, not a
 * second ideology balance formula and not a stored meter.
 */
export const FOREIGN_IDEOLOGICAL_THREAT_CONFIG = {
  minimumExternalExposure: 0.05,
  minimumDomesticMobilization: 0.25,
  minimumThreatSeverity: 0.05,
  restrictThreshold: 0.2,
  restoreThreshold: 0.08,
  vulnerabilityFloor: 0.5,
  channelWeights: DEFAULT_IDEOLOGY_DIFFUSION_CHANNEL_WEIGHTS,
} as const;

export interface StateVulnerabilityComponents {
  readonly legitimacyWeakness: number;
  readonly stateCapacityWeakness: number;
  readonly instability: number;
  readonly combined: number;
}

export interface ForeignIdeologicalThreatFactionEvidence {
  readonly factionId: FactionId;
  readonly affinity: number;
  readonly grievance: number;
  readonly organization: number;
  readonly influence: number;
  readonly resources: number;
  readonly mobilization: number;
}

/** One live directed contact + ideology route, retained as causal evidence. */
export interface ForeignIdeologicalThreatRoute {
  readonly actorCountryId: CountryId;
  readonly sourceCountryId: CountryId;
  readonly ideologyId: IdeologyId;
  readonly sourceRegionId: RegionId;
  readonly destinationRegionId: RegionId;
  readonly contactEdgeId: ContactEdgeId;
  readonly channel: ContactChannel;
  readonly effectiveStrength: number;
  readonly channelWeight: number;
  readonly sourceSupport: number;
  readonly destinationSupport: number;
  readonly ideologyGradient: number;
  readonly destinationRadicalism: number;
  readonly destinationOrganization: number;
  readonly domesticFactionIds: readonly FactionId[];
  readonly factionEvidence: readonly ForeignIdeologicalThreatFactionEvidence[];
  readonly externalExposure: number;
  readonly domesticMobilization: number;
  readonly stateVulnerability: StateVulnerabilityComponents;
  readonly severity: number;
  readonly eligible: boolean;
}

/** Grouped threat snapshot. Every group retains its route-level evidence. */
export interface ForeignIdeologicalThreatSnapshot {
  readonly actorCountryId: CountryId;
  readonly sourceCountryId: CountryId;
  readonly ideologyId: IdeologyId;
  readonly severity: number;
  readonly actionable: boolean;
  readonly actionableRouteIds: readonly ContactEdgeId[];
  readonly routes: readonly ForeignIdeologicalThreatRoute[];
}

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function sortedById<T extends { readonly id: string }>(
  values: readonly T[],
): readonly T[] {
  return [...values].sort((first, second) =>
    compareStableText(first.id, second.id),
  );
}

function assertScenarioMatchesWorld(
  scenario: ScenarioDefinition,
  world: WorldState,
): void {
  if (
    scenario.id !== world.run.scenarioId ||
    scenario.version !== world.run.scenarioVersion
  ) {
    throw new Error(
      "Foreign ideological threat scenario does not match WorldState.",
    );
  }
}

export function deriveStateVulnerability(
  country: Pick<Country, "legitimacy" | "stateCapacity" | "instability">,
): StateVulnerabilityComponents {
  const legitimacyWeakness = clamp01((100 - country.legitimacy) / 100);
  const stateCapacityWeakness = clamp01((100 - country.stateCapacity) / 100);
  const instability = clamp01(country.instability / 100);

  return {
    legitimacyWeakness,
    stateCapacityWeakness,
    instability,
    combined: clamp01(
      (legitimacyWeakness + stateCapacityWeakness + instability) / 3,
    ),
  };
}

function deriveFactionEvidence(
  faction: Faction,
  destinationRegion: Region,
  ideologyId: IdeologyId,
  scenario: ScenarioDefinition,
  world: WorldState,
): ForeignIdeologicalThreatFactionEvidence | null {
  const affinity = clamp01(faction.ideologyAffinity[ideologyId] ?? 0);
  if (
    affinity <= 0 ||
    !isFactionRelevantToRegion(faction, destinationRegion, scenario, world)
  ) {
    return null;
  }

  const grievance = clamp01(faction.grievance);
  const organization = clamp01(faction.organization);
  const mobilization = Math.min(
    affinity,
    grievance,
    organization,
    clamp01(destinationRegion.ideology[ideologyId]?.radicalism ?? 0),
    clamp01(destinationRegion.ideology[ideologyId]?.organization ?? 0),
  );

  return {
    factionId: faction.id,
    affinity,
    grievance,
    organization,
    influence: clamp01(faction.influence),
    resources: clamp01(faction.resources),
    mobilization,
  };
}

function deriveRouteSeverity(
  externalExposure: number,
  domesticMobilization: number,
  stateVulnerability: StateVulnerabilityComponents,
): number {
  const vulnerabilityAmplifier =
    FOREIGN_IDEOLOGICAL_THREAT_CONFIG.vulnerabilityFloor +
    (1 - FOREIGN_IDEOLOGICAL_THREAT_CONFIG.vulnerabilityFloor) *
      stateVulnerability.combined;

  return clamp01(
    externalExposure * domesticMobilization * vulnerabilityAmplifier,
  );
}

/**
 * Derive route-level candidates from the same live directed contact and
 * support-gradient semantics used by T015. Disabled routes never produce a
 * candidate. Ineligible candidates are retained for diagnostics; grouped
 * threat snapshots expose only eligible candidates.
 */
export function deriveForeignIdeologicalThreatRoutes(
  scenario: ScenarioDefinition,
  world: WorldState,
  actorCountryId: CountryId,
): readonly ForeignIdeologicalThreatRoute[] {
  assertScenarioMatchesWorld(scenario, world);

  const actorCountry = world.countries[actorCountryId];
  if (actorCountry === undefined) {
    throw new Error(
      `Foreign ideological threat actor ${actorCountryId} is missing.`,
    );
  }

  const stateVulnerability = deriveStateVulnerability(actorCountry);
  const factions = sortedById(Object.values(world.factions)).filter(
    (faction) => faction.countryId === actorCountryId,
  );
  const routes: ForeignIdeologicalThreatRoute[] = [];

  for (const contact of deriveCountryContacts(scenario, world)) {
    if (
      contact.toCountryId !== actorCountryId ||
      contact.fromCountryId === actorCountryId ||
      contact.effectiveStrength <= 0
    ) {
      continue;
    }

    const sourceRegion = world.regions[contact.fromRegionId];
    const destinationRegion = world.regions[contact.toRegionId];
    if (sourceRegion === undefined || destinationRegion === undefined) {
      throw new Error(
        `Foreign ideological threat contact ${contact.edgeId} references a missing Region.`,
      );
    }

    const channelWeight =
      FOREIGN_IDEOLOGICAL_THREAT_CONFIG.channelWeights[contact.channel];
    const ideologyIds = Object.keys(sourceRegion.ideology).sort(
      compareStableText,
    ) as IdeologyId[];

    for (const ideologyId of ideologyIds) {
      const sourceState = sourceRegion.ideology[ideologyId];
      const destinationState = destinationRegion.ideology[ideologyId];
      if (sourceState === undefined || destinationState === undefined) {
        continue;
      }

      const ideologyGradient = Math.max(
        0,
        clamp01(sourceState.support) - clamp01(destinationState.support),
      );
      const externalExposure = clamp01(
        ideologyGradient * contact.effectiveStrength * channelWeight,
      );
      if (externalExposure <= 0) {
        continue;
      }

      const factionEvidence = factions
        .map((faction) =>
          deriveFactionEvidence(
            faction,
            destinationRegion,
            ideologyId,
            scenario,
            world,
          ),
        )
        .filter(
          (evidence): evidence is ForeignIdeologicalThreatFactionEvidence =>
            evidence !== null,
        )
        .sort((first, second) =>
          compareStableText(first.factionId, second.factionId),
        );
      const domesticMobilization = factionEvidence.reduce(
        (strongest, evidence) => Math.max(strongest, evidence.mobilization),
        0,
      );
      const severity = deriveRouteSeverity(
        externalExposure,
        domesticMobilization,
        stateVulnerability,
      );
      const eligible =
        externalExposure >=
          FOREIGN_IDEOLOGICAL_THREAT_CONFIG.minimumExternalExposure &&
        domesticMobilization >=
          FOREIGN_IDEOLOGICAL_THREAT_CONFIG.minimumDomesticMobilization &&
        severity >= FOREIGN_IDEOLOGICAL_THREAT_CONFIG.minimumThreatSeverity;

      routes.push({
        actorCountryId,
        sourceCountryId: contact.fromCountryId,
        ideologyId,
        sourceRegionId: contact.fromRegionId,
        destinationRegionId: contact.toRegionId,
        contactEdgeId: contact.edgeId,
        channel: contact.channel,
        effectiveStrength: contact.effectiveStrength,
        channelWeight,
        sourceSupport: clamp01(sourceState.support),
        destinationSupport: clamp01(destinationState.support),
        ideologyGradient,
        destinationRadicalism: clamp01(destinationState.radicalism),
        destinationOrganization: clamp01(destinationState.organization),
        domesticFactionIds: factionEvidence.map(
          (evidence) => evidence.factionId,
        ),
        factionEvidence,
        externalExposure,
        domesticMobilization,
        stateVulnerability,
        severity,
        eligible,
      });
    }
  }

  return routes.sort(
    (first, second) =>
      compareStableText(first.contactEdgeId, second.contactEdgeId) ||
      compareStableText(first.ideologyId, second.ideologyId) ||
      compareStableText(first.destinationRegionId, second.destinationRegionId),
  );
}

function groupKey(sourceCountryId: CountryId, ideologyId: IdeologyId): string {
  return `${sourceCountryId}\u0000${ideologyId}`;
}

function combineIndependentSignals(values: readonly number[]): number {
  return clamp01(
    1 - values.reduce((remaining, value) => remaining * (1 - value), 1),
  );
}

/** Derive bounded, grouped threat snapshots without mutating WorldState. */
export function deriveForeignIdeologicalThreats(
  scenario: ScenarioDefinition,
  world: WorldState,
  actorCountryId: CountryId,
): readonly ForeignIdeologicalThreatSnapshot[] {
  const groups = new Map<string, ForeignIdeologicalThreatRoute[]>();

  for (const route of deriveForeignIdeologicalThreatRoutes(
    scenario,
    world,
    actorCountryId,
  )) {
    if (!route.eligible) {
      continue;
    }

    const key = groupKey(route.sourceCountryId, route.ideologyId);
    const group = groups.get(key) ?? [];
    group.push(route);
    groups.set(key, group);
  }

  return [...groups.values()]
    .map((routes) => {
      const orderedRoutes = [...routes].sort(
        (first, second) =>
          compareStableText(first.contactEdgeId, second.contactEdgeId) ||
          compareStableText(
            first.destinationRegionId,
            second.destinationRegionId,
          ),
      );
      const first = orderedRoutes[0];
      if (first === undefined) {
        throw new Error("Foreign ideological threat group cannot be empty.");
      }

      const actionableRouteIds = orderedRoutes
        .filter(
          (route) => route.channel === "border" && route.effectiveStrength > 0,
        )
        .map((route) => route.contactEdgeId);

      return {
        actorCountryId,
        sourceCountryId: first.sourceCountryId,
        ideologyId: first.ideologyId,
        severity: combineIndependentSignals(
          orderedRoutes.map((route) => route.severity),
        ),
        actionable: actionableRouteIds.length > 0,
        actionableRouteIds,
        routes: orderedRoutes,
      } satisfies ForeignIdeologicalThreatSnapshot;
    })
    .sort(
      (first, second) =>
        compareStableText(first.sourceCountryId, second.sourceCountryId) ||
        compareStableText(first.ideologyId, second.ideologyId),
    );
}

/** Compact event/debug serialization retaining the route evidence. */
export function foreignIdeologicalThreatToJson(
  snapshot: ForeignIdeologicalThreatSnapshot,
): JsonValue {
  return {
    actorCountryId: snapshot.actorCountryId,
    sourceCountryId: snapshot.sourceCountryId,
    ideologyId: snapshot.ideologyId,
    severity: snapshot.severity,
    actionable: snapshot.actionable,
    actionableRouteIds: [...snapshot.actionableRouteIds],
    routes: snapshot.routes.map((route) => ({
      sourceRegionId: route.sourceRegionId,
      destinationRegionId: route.destinationRegionId,
      contactEdgeId: route.contactEdgeId,
      channel: route.channel,
      effectiveStrength: route.effectiveStrength,
      sourceSupport: route.sourceSupport,
      destinationSupport: route.destinationSupport,
      ideologyGradient: route.ideologyGradient,
      destinationRadicalism: route.destinationRadicalism,
      destinationOrganization: route.destinationOrganization,
      domesticFactionIds: [...route.domesticFactionIds],
      externalExposure: route.externalExposure,
      domesticMobilization: route.domesticMobilization,
      stateVulnerability: {
        legitimacyWeakness: route.stateVulnerability.legitimacyWeakness,
        stateCapacityWeakness: route.stateVulnerability.stateCapacityWeakness,
        instability: route.stateVulnerability.instability,
        combined: route.stateVulnerability.combined,
      },
      severity: route.severity,
    })),
  };
}
