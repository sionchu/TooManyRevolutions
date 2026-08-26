import type { GameEvent } from "../events/event";
import { derivePrimaryAgendas, type PrimaryAgenda } from "./agenda";
import {
  evaluateInterventionFeasibility,
  type InterventionDefinition,
  type InterventionFeasibilityResult,
} from "../state/intervention";
import type {
  ConflictId,
  CountryId,
  EventId,
  FactionId,
  InterventionId,
  PolicyId,
  RegionId,
} from "../state/ids";
import type { Faction } from "../state/faction";
import {
  evaluatePolicyAvailability,
  INSTITUTIONAL_RULE_KEYS,
  type InstitutionalRuleKey,
  type PolicyAvailabilityResult,
  type PolicyDefinition,
} from "../state/policy";
import type { ScenarioDefinition } from "../state/scenario";
import {
  RESOURCE_TYPES,
  type Region,
  type ResourceType,
} from "../state/region";
import type { WorldState } from "../state/world";
import {
  deriveFactionObservation,
  type FactionObservation,
} from "../systems/factionPressure";

/**
 * Context labels are authored content channels, not a hidden utility score.
 * The selector only checks whether a channel is grounded in current state.
 */
export type ContextualDecisionChannel =
  | "material"
  | "labor"
  | "representation"
  | "opposition"
  | "coercive"
  | "authority"
  | "property"
  | "land"
  | "recovery";

export const CONTEXTUAL_DECISION_CHANNELS: readonly ContextualDecisionChannel[] =
  [
    "material",
    "labor",
    "representation",
    "opposition",
    "coercive",
    "authority",
    "property",
    "land",
    "recovery",
  ] as const;

export interface ContextualDecisionMetadata {
  /** Explicit author priority. Higher values are preferred after tier order. */
  readonly priority: number;
  readonly channels: readonly ContextualDecisionChannel[];
  /** Eligible as a quiet structural option when no acute context is present. */
  readonly backgroundEligible?: boolean;
}

export interface ContextualDecisionCatalog {
  readonly policies: Readonly<Record<PolicyId, ContextualDecisionMetadata>>;
  readonly interventions: Readonly<
    Record<InterventionId, ContextualDecisionMetadata>
  >;
}

export type ContextualDecisionReasonCode =
  | "MATERIAL_SCARCITY"
  | "LABOR_ORGANIZATION_PRESSURE"
  | "POLITICAL_OPPOSITION_PRESSURE"
  | "ACTIVE_REBELLION_RECOVERY"
  | "INSTITUTIONAL_CONTRADICTION"
  | "PROPERTY_LAND_ORDER"
  | "COERCIVE_RESPONSE_WINDOW"
  | "FISCAL_PRESSURE"
  | "BACKGROUND_STRUCTURAL_OPTION";

export interface ContextualDecisionEvidence {
  readonly regionIds: readonly RegionId[];
  readonly factionIds: readonly FactionId[];
  readonly conflictIds: readonly ConflictId[];
  readonly eventIds: readonly EventId[];
}

export interface ContextualDecisionReason {
  readonly code: ContextualDecisionReasonCode;
  readonly evidence: ContextualDecisionEvidence;
}

export type ContextualDecisionTier =
  "crisis" | "pressure" | "reform" | "background";

export type ContextualDecisionAvailability =
  "AVAILABLE" | "BLOCKED_BUT_RELEVANT";

export interface ContextualDecisionCandidateBase {
  readonly kind: "policy" | "intervention";
  readonly priority: number;
  readonly tier: ContextualDecisionTier;
  readonly relevanceReasons: readonly ContextualDecisionReason[];
  readonly affectedRegionIds: readonly RegionId[];
  readonly affectedFactionIds: readonly FactionId[];
  readonly sourceEventIds: readonly EventId[];
  readonly availability: ContextualDecisionAvailability;
}

export interface ContextualPolicyCandidate extends ContextualDecisionCandidateBase {
  readonly kind: "policy";
  readonly id: PolicyId;
  readonly definition: PolicyDefinition;
  /** Normal policy eligibility at the current institutional state. */
  readonly feasibility: PolicyAvailabilityResult;
}

export interface ContextualInterventionCandidate extends ContextualDecisionCandidateBase {
  readonly kind: "intervention";
  readonly id: InterventionId;
  readonly definition: InterventionDefinition;
  /** Normal treasury/headroom/prerequisite eligibility at the current state. */
  readonly feasibility: InterventionFeasibilityResult;
}

export type ContextualDecisionCandidate =
  ContextualPolicyCandidate | ContextualInterventionCandidate;

export interface ContextualDecisionSelectorInput {
  readonly scenario: ScenarioDefinition;
  readonly world: WorldState;
  readonly playerCountryId: CountryId;
  readonly catalog: ContextualDecisionCatalog;
  /** When omitted, the selector derives the existing agenda read model. */
  readonly agendas?: readonly PrimaryAgenda[];
  /** Bounded causal evidence supplied by the caller; never read from storage. */
  readonly recentEvents?: readonly GameEvent[];
}

export interface ContextualDecisionSurface {
  /** Mixed primary decision surface, capped at the normal five-card limit. */
  readonly primaryShortlist: readonly ContextualDecisionCandidate[];
  /** All relevant candidates, including relevant but currently blocked items. */
  readonly relevantCandidates: readonly ContextualDecisionCandidate[];
  readonly primaryPolicyCandidates: readonly ContextualPolicyCandidate[];
  readonly primaryInterventionCandidates: readonly ContextualInterventionCandidate[];
  /** Full structural route, intentionally separate from the primary surface. */
  readonly roadmapPolicyIds: readonly PolicyId[];
  readonly agendas: readonly PrimaryAgenda[];
  readonly factionObservations: Readonly<Record<FactionId, FactionObservation>>;
  readonly activeConflictIds: readonly ConflictId[];
}

export const CONTEXTUAL_DECISION_LIMITS = {
  normalPrimaryShortlist: 5,
  maximumPrimaryShortlist: 6,
} as const;

const MATERIAL_SCARCITY_THRESHOLD = 0.3;
const UNREST_PRESSURE_THRESHOLD = 0.6;
const FACTION_GRIEVANCE_THRESHOLD = 0.4;
const FACTION_ORGANIZATION_THRESHOLD = 0.35;

const TIER_ORDER: Readonly<Record<ContextualDecisionTier, number>> = {
  crisis: 0,
  pressure: 1,
  reform: 2,
  background: 3,
};

const REASON_ORDER: Readonly<Record<ContextualDecisionReasonCode, number>> = {
  ACTIVE_REBELLION_RECOVERY: 0,
  MATERIAL_SCARCITY: 1,
  LABOR_ORGANIZATION_PRESSURE: 2,
  POLITICAL_OPPOSITION_PRESSURE: 3,
  COERCIVE_RESPONSE_WINDOW: 4,
  INSTITUTIONAL_CONTRADICTION: 5,
  PROPERTY_LAND_ORDER: 6,
  FISCAL_PRESSURE: 7,
  BACKGROUND_STRUCTURAL_OPTION: 8,
};

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function sortedUnique<T extends string>(values: readonly T[]): readonly T[] {
  return [...new Set(values)].sort(compareStableText) as readonly T[];
}

function sortedIdsFromRecord<T extends string>(
  record: Readonly<Record<T, unknown>>,
): readonly T[] {
  return Object.keys(record).sort(compareStableText) as T[];
}

function objectValue(value: unknown): Readonly<Record<string, unknown>> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Readonly<Record<string, unknown>>;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function stringArrayValue(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function eventEntityIds(event: GameEvent): readonly string[] {
  const values: string[] = [];
  if (event.actorId !== undefined) {
    values.push(event.actorId);
  }
  if (event.targetId !== undefined) {
    values.push(event.targetId);
  }

  const payload = objectValue(event.payload);
  if (payload === null) {
    return values;
  }

  for (const key of [
    "countryId",
    "regionId",
    "targetRegionId",
    "factionId",
    "conflictId",
    "policyId",
    "interventionId",
  ]) {
    const value = stringValue(payload[key]);
    if (value !== null) {
      values.push(value);
    }
  }

  for (const key of [
    "affectedRegionIds",
    "contestedRegionIds",
    "participantCountryIds",
    "participantFactionIds",
  ]) {
    values.push(...stringArrayValue(payload[key]));
  }

  return values;
}

function eventCountryId(event: GameEvent): string | null {
  const payload = objectValue(event.payload);
  return (
    (payload === null ? null : stringValue(payload.countryId)) ??
    stringValue(event.actorId)
  );
}

function eventTouchesContext(
  event: GameEvent,
  countryId: CountryId,
  regionIds: ReadonlySet<RegionId>,
  factionIds: ReadonlySet<FactionId>,
  conflictIds: ReadonlySet<ConflictId>,
  includeCountryLevel: boolean,
): boolean {
  if (
    includeCountryLevel &&
    (event.type === "TREASURY_CHANGED" ||
      event.type === "POLICY_ENACTED" ||
      event.type === "POLICY_REJECTED" ||
      event.type === "INTERVENTION_STARTED" ||
      event.type === "INTERVENTION_REJECTED") &&
    eventCountryId(event) === countryId
  ) {
    return true;
  }

  const entities = new Set(eventEntityIds(event));
  return (
    [...regionIds].some((id) => entities.has(id)) ||
    [...factionIds].some((id) => entities.has(id)) ||
    [...conflictIds].some((id) => entities.has(id))
  );
}

function eventIdsForContext(input: {
  readonly events: readonly GameEvent[];
  readonly countryId: CountryId;
  readonly regionIds: readonly RegionId[];
  readonly factionIds: readonly FactionId[];
  readonly conflictIds: readonly ConflictId[];
  readonly agendaEventIds: readonly EventId[];
  readonly includeCountryLevel: boolean;
}): readonly EventId[] {
  const regionIds = new Set(input.regionIds);
  const factionIds = new Set(input.factionIds);
  const conflictIds = new Set(input.conflictIds);
  const agendaEventIds = new Set(input.agendaEventIds);
  const selected = input.events.filter(
    (event) =>
      agendaEventIds.has(event.id) ||
      eventTouchesContext(
        event,
        input.countryId,
        regionIds,
        factionIds,
        conflictIds,
        input.includeCountryLevel,
      ),
  );

  return [...selected]
    .sort(
      (first, second) =>
        first.sequence - second.sequence ||
        compareStableText(first.id, second.id),
    )
    .map((event) => event.id);
}

function emptyEvidence(): ContextualDecisionEvidence {
  return { regionIds: [], factionIds: [], conflictIds: [], eventIds: [] };
}

function mergeEvidence(
  first: ContextualDecisionEvidence,
  second: ContextualDecisionEvidence,
): ContextualDecisionEvidence {
  return {
    regionIds: sortedUnique([...first.regionIds, ...second.regionIds]),
    factionIds: sortedUnique([...first.factionIds, ...second.factionIds]),
    conflictIds: sortedUnique([...first.conflictIds, ...second.conflictIds]),
    eventIds: sortedUnique([...first.eventIds, ...second.eventIds]),
  };
}

function reasonEvidence(
  signals: ContextSignals,
  regionIds: readonly RegionId[] = [],
  factionIds: readonly FactionId[] = [],
  conflictIds: readonly ConflictId[] = [],
  options: { readonly includeCountryLevel?: boolean } = {},
): ContextualDecisionEvidence {
  const selectedFactionIds =
    factionIds.length === 0 ? signals.playerFactionIds : factionIds;
  const selectedRegionIds =
    regionIds.length > 0
      ? regionIds
      : factionIds.length > 0
        ? sortedUnique(
            factionIds.flatMap(
              (factionId) => signals.factionRegionIds[factionId] ?? [],
            ),
          )
        : signals.playerRegionIds;
  const selectedConflictIds =
    conflictIds.length === 0 ? signals.activeConflictIds : conflictIds;

  return {
    regionIds: sortedUnique(selectedRegionIds),
    factionIds: sortedUnique(selectedFactionIds),
    conflictIds: sortedUnique(selectedConflictIds),
    eventIds: eventIdsForContext({
      events: signals.events,
      countryId: signals.playerCountryId,
      regionIds: selectedRegionIds,
      factionIds: selectedFactionIds,
      conflictIds: selectedConflictIds,
      agendaEventIds: signals.agendaEventIds,
      includeCountryLevel: options.includeCountryLevel === true,
    }),
  };
}

interface InstitutionalContradiction {
  readonly key: InstitutionalRuleKey;
  readonly regionIds: readonly RegionId[];
  readonly factionIds: readonly FactionId[];
}

interface ContextSignals {
  readonly playerCountryId: CountryId;
  readonly playerRegionIds: readonly RegionId[];
  readonly playerFactionIds: readonly FactionId[];
  readonly materialRegionIds: readonly RegionId[];
  readonly laborFactionIds: readonly FactionId[];
  readonly politicalFactionIds: readonly FactionId[];
  readonly factionRegionIds: Readonly<Record<FactionId, readonly RegionId[]>>;
  readonly activeConflictIds: readonly ConflictId[];
  readonly activeRebellionIds: readonly ConflictId[];
  readonly rebellionRegionIds: readonly RegionId[];
  readonly rebellionFactionIds: readonly FactionId[];
  readonly fiscalPressure: boolean;
  readonly politicalPressure: boolean;
  readonly laborPressure: boolean;
  readonly materialPressure: boolean;
  readonly materialResourcePressureKeys: readonly string[];
  readonly activeRebellion: boolean;
  readonly contradictions: readonly InstitutionalContradiction[];
  readonly events: readonly GameEvent[];
  readonly agendaEventIds: readonly EventId[];
}

function playerRegions(
  world: WorldState,
  playerCountryId: CountryId,
): readonly Region[] {
  return Object.values(world.regions)
    .filter((region) => region.ownerCountryId === playerCountryId)
    .sort((first, second) => compareStableText(first.id, second.id));
}

function playerFactions(
  world: WorldState,
  playerCountryId: CountryId,
): readonly Faction[] {
  return Object.values(world.factions)
    .filter((faction) => faction.countryId === playerCountryId)
    .sort((first, second) => compareStableText(first.id, second.id));
}

function regionHasMaterialPressure(region: Region): boolean {
  if (
    region.scarcity >= MATERIAL_SCARCITY_THRESHOLD ||
    region.unrest >= UNREST_PRESSURE_THRESHOLD
  ) {
    return true;
  }

  return (Object.keys(region.resourceDemand) as ResourceType[]).some(
    (resourceType) =>
      (region.resourceDemand[resourceType] ?? 0) >
      (region.resourceProductionCapacity[resourceType] ?? 0),
  );
}

function resourcePressureKey(
  regionId: RegionId,
  resourceType: ResourceType,
): string {
  return `${regionId}\u0000${resourceType}`;
}

function regionHasResourceMaterialPressure(
  region: Region,
  resourceType: ResourceType,
): boolean {
  // Aggregate scarcity/unrest is intentionally not copied onto every
  // resource target. A food shortage must not manufacture a material
  // allocation card when the target Region's material demand is covered.
  return (
    (region.resourceDemand[resourceType] ?? 0) >
    (region.resourceProductionCapacity[resourceType] ?? 0)
  );
}

function deriveInstitutionalContradictions(
  rules: WorldState["policies"][CountryId]["institutionalRules"],
  playerRegionIds: readonly RegionId[],
  playerFactionIds: readonly FactionId[],
): readonly InstitutionalContradiction[] {
  const contradictions: InstitutionalContradiction[] = [];
  const add = (key: InstitutionalRuleKey): void => {
    contradictions.push({
      key,
      regionIds: playerRegionIds,
      factionIds: playerFactionIds,
    });
  };

  if (!rules.rulerVeto && !rules.legislatureRequired) {
    add("legislatureRequired");
  }
  if (
    rules.politicalCompetition === "plural" &&
    rules.pressFreedom === "censored"
  ) {
    add("pressFreedom");
    add("politicalCompetition");
  }
  if (rules.politicalCompetition === "plural" && rules.suffrage === "none") {
    add("suffrage");
  }
  if (
    rules.politicalCompetition === "plural" &&
    rules.laborOrganization === "illegal"
  ) {
    add("laborOrganization");
  }
  if (
    rules.productiveProperty === "publicOnly" &&
    rules.landOwnership === "feudal"
  ) {
    add("productiveProperty");
    add("landOwnership");
  }

  return contradictions;
}

function deriveContextSignals(input: {
  readonly world: WorldState;
  readonly playerCountryId: CountryId;
  readonly agendas: readonly PrimaryAgenda[];
  readonly recentEvents: readonly GameEvent[];
  readonly factionObservations: Readonly<Record<FactionId, FactionObservation>>;
}): ContextSignals {
  const regions = playerRegions(input.world, input.playerCountryId);
  const factions = playerFactions(input.world, input.playerCountryId);
  const playerRegionIds = regions.map((region) => region.id);
  const playerFactionIds = factions.map((faction) => faction.id);
  const materialRegionIds = regions
    .filter(regionHasMaterialPressure)
    .map((region) => region.id);
  const materialResourcePressureKeys = regions.flatMap((region) =>
    RESOURCE_TYPES.filter((resourceType) =>
      regionHasResourceMaterialPressure(region, resourceType),
    ).map((resourceType) => resourcePressureKey(region.id, resourceType)),
  );

  const playerFactionIdSet = new Set(playerFactionIds);
  const agendaFactionIds = sortedUnique(
    input.agendas
      .flatMap((agenda) => agenda.involvedFactionIds)
      .filter((factionId) => playerFactionIdSet.has(factionId)),
  );
  const laborFactionIds = factions
    .filter((faction) => {
      const observation = input.factionObservations[faction.id];
      if (observation === undefined) {
        return false;
      }

      const organizedSignal = Math.max(
        observation.faction.organization,
        observation.regional.affinityWeightedIdeologyOrganization,
      );
      const isLaborFaction = faction.interests.includes("labor");
      const hasOrganizedLeverage =
        organizedSignal >= FACTION_ORGANIZATION_THRESHOLD ||
        observation.faction.resources >= 0.5;
      const hasPressure =
        (observation.faction.grievance >= FACTION_GRIEVANCE_THRESHOLD &&
          hasOrganizedLeverage) ||
        observation.regional.averageScarcity >= MATERIAL_SCARCITY_THRESHOLD ||
        observation.regional.averageUnrest >= UNREST_PRESSURE_THRESHOLD;
      return isLaborFaction && hasPressure;
    })
    .map((faction) => faction.id);
  const politicalFactionIds = factions
    .filter((faction) => {
      const observation = input.factionObservations[faction.id];
      if (observation === undefined) {
        return false;
      }

      const organizedSignal = Math.max(
        observation.faction.organization,
        observation.regional.affinityWeightedIdeologyOrganization,
      );
      const hasPoliticalLeverage =
        organizedSignal >= FACTION_ORGANIZATION_THRESHOLD ||
        observation.faction.influence >= 0.45 ||
        observation.faction.resources >= 0.5;
      return (
        agendaFactionIds.includes(faction.id) ||
        (observation.faction.grievance >= FACTION_GRIEVANCE_THRESHOLD &&
          hasPoliticalLeverage)
      );
    })
    .map((faction) => faction.id);

  const activeConflicts = Object.values(input.world.conflicts)
    .filter(
      (conflict) =>
        conflict.status === "active" &&
        (conflict.participantCountryIds.includes(input.playerCountryId) ||
          conflict.participantFactionIds.some((factionId) =>
            playerFactionIds.includes(factionId),
          )),
    )
    .sort((first, second) => compareStableText(first.id, second.id));
  const activeRebellions = activeConflicts.filter(
    (conflict) => conflict.kind === "rebellion",
  );
  const activeConflictIds = activeConflicts.map((conflict) => conflict.id);
  const activeRebellionIds = activeRebellions.map((conflict) => conflict.id);
  const rebellionRegionIds = sortedUnique(
    activeRebellions.flatMap((conflict) => [
      ...(conflict.affectedRegionIds ?? []),
      ...conflict.contestedRegionIds,
    ]),
  );
  const rebellionFactionIds = sortedUnique(
    activeRebellions.flatMap((conflict) => conflict.participantFactionIds),
  );
  const country = input.world.countries[input.playerCountryId];
  if (country === undefined) {
    throw new Error(
      `Contextual decision selector cannot find country ${input.playerCountryId}.`,
    );
  }
  const fiscalPressure =
    country.treasury < 0 || country.dailyExpenditure > country.dailyIncome;
  const agendaEventIds = input.agendas.flatMap(
    (agenda) => agenda.causeEventIds,
  );
  const policyState = input.world.policies[input.playerCountryId];
  if (policyState === undefined) {
    throw new Error(
      `Contextual decision selector cannot find policy state for ${input.playerCountryId}.`,
    );
  }
  const contradictions = deriveInstitutionalContradictions(
    policyState.institutionalRules,
    playerRegionIds,
    playerFactionIds,
  );
  const agendaHasFactionPressure = input.agendas.some(
    (agenda) => agenda.kind === "factionPressure",
  );
  const agendaHasFiscalPressure = input.agendas.some(
    (agenda) => agenda.kind === "fiscalPressure",
  );
  const factionRegionIds = Object.fromEntries(
    factions.map((faction) => [
      faction.id,
      input.factionObservations[faction.id]?.regional.regionIds ?? [],
    ]),
  ) as Readonly<Record<FactionId, readonly RegionId[]>>;

  return {
    playerCountryId: input.playerCountryId,
    playerRegionIds,
    playerFactionIds,
    materialRegionIds: sortedUnique(materialRegionIds),
    laborFactionIds: sortedUnique(laborFactionIds),
    politicalFactionIds: sortedUnique([
      ...politicalFactionIds,
      ...agendaFactionIds,
    ]),
    factionRegionIds,
    activeConflictIds,
    activeRebellionIds,
    rebellionRegionIds,
    rebellionFactionIds,
    fiscalPressure: fiscalPressure || agendaHasFiscalPressure,
    politicalPressure:
      politicalFactionIds.length > 0 || agendaHasFactionPressure,
    laborPressure: laborFactionIds.length > 0,
    materialPressure: materialRegionIds.length > 0,
    materialResourcePressureKeys: sortedUnique(materialResourcePressureKeys),
    activeRebellion: activeRebellions.length > 0,
    contradictions,
    events: input.recentEvents,
    agendaEventIds,
  };
}

function policyMutationKeys(
  definition: PolicyDefinition,
): readonly InstitutionalRuleKey[] {
  return INSTITUTIONAL_RULE_KEYS.filter(
    (key) => definition.ruleMutations[key] !== undefined,
  );
}

function policyMutationTouches(
  definition: PolicyDefinition,
  keys: readonly InstitutionalRuleKey[],
): boolean {
  const mutationKeys = policyMutationKeys(definition);
  return mutationKeys.some((key) => keys.includes(key));
}

function policyWouldChange(
  definition: PolicyDefinition,
  policyState: WorldState["policies"][CountryId],
): boolean {
  return policyMutationKeys(definition).some(
    (key) =>
      definition.ruleMutations[key] !== policyState.institutionalRules[key],
  );
}

interface InterventionTargets {
  readonly regionIds: readonly RegionId[];
  readonly resourceTargets: readonly {
    readonly regionId: RegionId;
    readonly resourceType: ResourceType;
  }[];
  readonly factionIds: readonly FactionId[];
  readonly ruleKeys: readonly InstitutionalRuleKey[];
}

function interventionTargets(
  definition: InterventionDefinition,
): InterventionTargets {
  const regionIds: RegionId[] = [];
  const resourceTargets: {
    readonly regionId: RegionId;
    readonly resourceType: ResourceType;
  }[] = [];
  const factionIds: FactionId[] = [];
  const ruleKeys: InstitutionalRuleKey[] = [];

  for (const effect of definition.completionEffects ?? []) {
    switch (effect.kind) {
      case "regionResourceProductionCapacityDelta":
        regionIds.push(effect.regionId);
        resourceTargets.push({
          regionId: effect.regionId,
          resourceType: effect.resourceType,
        });
        break;
      case "factionGrievanceDelta":
      case "factionOrganizationDelta":
        factionIds.push(effect.factionId);
        break;
      case "institutionalRuleSet":
        ruleKeys.push(effect.rule);
        break;
    }
  }

  return {
    regionIds: sortedUnique(regionIds),
    resourceTargets: resourceTargets
      .sort(
        (first, second) =>
          compareStableText(first.regionId, second.regionId) ||
          compareStableText(first.resourceType, second.resourceType),
      )
      .filter(
        (target, index, targets) =>
          index === 0 ||
          targets[index - 1]?.regionId !== target.regionId ||
          targets[index - 1]?.resourceType !== target.resourceType,
      ),
    factionIds: sortedUnique(factionIds),
    ruleKeys: sortedUnique(ruleKeys),
  };
}

function hasIntersection<T extends string>(
  first: readonly T[],
  second: readonly T[],
): boolean {
  const secondSet = new Set(second);
  return first.some((value) => secondSet.has(value));
}

function addReason(
  reasons: Map<ContextualDecisionReasonCode, ContextualDecisionEvidence>,
  code: ContextualDecisionReasonCode,
  evidence: ContextualDecisionEvidence,
): void {
  reasons.set(
    code,
    mergeEvidence(reasons.get(code) ?? emptyEvidence(), evidence),
  );
}

function sortedReasons(
  reasons: ReadonlyMap<
    ContextualDecisionReasonCode,
    ContextualDecisionEvidence
  >,
): readonly ContextualDecisionReason[] {
  return [...reasons.entries()]
    .sort(([first], [second]) => REASON_ORDER[first] - REASON_ORDER[second])
    .map(([code, evidence]) => ({ code, evidence }));
}

function derivePolicyReasons(
  definition: PolicyDefinition,
  metadata: ContextualDecisionMetadata,
  signals: ContextSignals,
): readonly ContextualDecisionReason[] {
  const reasons = new Map<
    ContextualDecisionReasonCode,
    ContextualDecisionEvidence
  >();
  const mutationKeys = policyMutationKeys(definition);
  const contradictionKeys = signals.contradictions.map(
    (contradiction) => contradiction.key,
  );

  for (const channel of metadata.channels) {
    switch (channel) {
      case "material": {
        if (
          signals.materialPressure &&
          mutationKeys.includes("productiveProperty")
        ) {
          addReason(
            reasons,
            "MATERIAL_SCARCITY",
            reasonEvidence(signals, signals.materialRegionIds),
          );
        }
        break;
      }
      case "labor":
        if (
          signals.laborPressure &&
          mutationKeys.includes("laborOrganization")
        ) {
          addReason(
            reasons,
            "LABOR_ORGANIZATION_PRESSURE",
            reasonEvidence(signals, [], signals.laborFactionIds),
          );
        }
        break;
      case "representation":
        if (
          signals.politicalPressure &&
          policyMutationTouches(definition, [
            "suffrage",
            "politicalCompetition",
            "pressFreedom",
          ])
        ) {
          addReason(
            reasons,
            "POLITICAL_OPPOSITION_PRESSURE",
            reasonEvidence(signals, [], signals.politicalFactionIds),
          );
        }
        break;
      case "opposition":
        if (
          signals.politicalPressure &&
          policyMutationTouches(definition, [
            "suffrage",
            "politicalCompetition",
            "pressFreedom",
          ])
        ) {
          addReason(
            reasons,
            "POLITICAL_OPPOSITION_PRESSURE",
            reasonEvidence(signals, [], signals.politicalFactionIds),
          );
        }
        break;
      case "coercive":
        if (
          (signals.politicalPressure ||
            signals.laborPressure ||
            signals.activeConflictIds.length > 0) &&
          policyMutationTouches(definition, [
            "pressFreedom",
            "politicalCompetition",
            "laborOrganization",
          ])
        ) {
          addReason(
            reasons,
            "COERCIVE_RESPONSE_WINDOW",
            reasonEvidence(signals, [], signals.politicalFactionIds),
          );
        }
        break;
      case "authority":
        if (
          signals.politicalPressure &&
          policyMutationTouches(definition, [
            "rulerVeto",
            "legislatureRequired",
            "suffrage",
          ])
        ) {
          addReason(
            reasons,
            "POLITICAL_OPPOSITION_PRESSURE",
            reasonEvidence(signals, [], signals.politicalFactionIds),
          );
        }
        break;
      case "property":
      case "land":
        if (
          signals.materialPressure &&
          policyMutationTouches(definition, [
            "productiveProperty",
            "landOwnership",
          ])
        ) {
          addReason(
            reasons,
            "PROPERTY_LAND_ORDER",
            reasonEvidence(signals, signals.materialRegionIds),
          );
        }
        break;
      case "recovery":
        if (
          signals.activeRebellion &&
          (policyMutationTouches(definition, [
            "laborOrganization",
            "politicalCompetition",
            "pressFreedom",
          ]) ||
            hasIntersection(
              signals.politicalFactionIds,
              signals.rebellionFactionIds,
            ))
        ) {
          addReason(
            reasons,
            "ACTIVE_REBELLION_RECOVERY",
            reasonEvidence(
              signals,
              signals.rebellionRegionIds,
              signals.rebellionFactionIds,
              signals.activeRebellionIds,
            ),
          );
        }
        break;
    }
  }

  if (hasIntersection(mutationKeys, contradictionKeys)) {
    const contradictionEvidence = signals.contradictions
      .filter((contradiction) => mutationKeys.includes(contradiction.key))
      .reduce(
        (evidence, contradiction) =>
          mergeEvidence(
            evidence,
            reasonEvidence(
              signals,
              contradiction.regionIds,
              contradiction.factionIds,
            ),
          ),
        emptyEvidence(),
      );
    addReason(reasons, "INSTITUTIONAL_CONTRADICTION", contradictionEvidence);
  }

  if (reasons.size === 0 && metadata.backgroundEligible === true) {
    addReason(reasons, "BACKGROUND_STRUCTURAL_OPTION", reasonEvidence(signals));
  }

  return sortedReasons(reasons);
}

function deriveInterventionReasons(
  definition: InterventionDefinition,
  targets: InterventionTargets,
  metadata: ContextualDecisionMetadata,
  signals: ContextSignals,
): readonly ContextualDecisionReason[] {
  const reasons = new Map<
    ContextualDecisionReasonCode,
    ContextualDecisionEvidence
  >();

  for (const channel of metadata.channels) {
    switch (channel) {
      case "material": {
        const materialTargetRegionIds =
          targets.resourceTargets.length > 0
            ? targets.resourceTargets
                .filter((target) =>
                  signals.materialResourcePressureKeys.includes(
                    resourcePressureKey(target.regionId, target.resourceType),
                  ),
                )
                .map((target) => target.regionId)
            : targets.regionIds.filter((regionId) =>
                signals.materialRegionIds.includes(regionId),
              );
        if (materialTargetRegionIds.length > 0) {
          addReason(
            reasons,
            "MATERIAL_SCARCITY",
            reasonEvidence(signals, materialTargetRegionIds),
          );
        }
        break;
      }
      case "labor":
        if (
          signals.laborPressure &&
          (hasIntersection(targets.factionIds, signals.laborFactionIds) ||
            targets.ruleKeys.includes("laborOrganization"))
        ) {
          addReason(
            reasons,
            "LABOR_ORGANIZATION_PRESSURE",
            reasonEvidence(signals, [], signals.laborFactionIds),
          );
        }
        break;
      case "representation":
      case "opposition":
        if (
          signals.politicalPressure &&
          (hasIntersection(targets.factionIds, signals.politicalFactionIds) ||
            targets.ruleKeys.some((key) =>
              ["politicalCompetition", "pressFreedom", "suffrage"].includes(
                key,
              ),
            ))
        ) {
          addReason(
            reasons,
            "POLITICAL_OPPOSITION_PRESSURE",
            reasonEvidence(signals, targets.regionIds, targets.factionIds),
          );
        }
        break;
      case "coercive":
        if (
          signals.politicalPressure ||
          signals.laborPressure ||
          signals.activeConflictIds.length > 0
        ) {
          addReason(
            reasons,
            "COERCIVE_RESPONSE_WINDOW",
            reasonEvidence(signals, targets.regionIds, targets.factionIds),
          );
        }
        break;
      case "authority":
        if (
          signals.politicalPressure &&
          targets.ruleKeys.some((key) =>
            ["rulerVeto", "legislatureRequired", "suffrage"].includes(key),
          )
        ) {
          addReason(
            reasons,
            "POLITICAL_OPPOSITION_PRESSURE",
            reasonEvidence(signals, targets.regionIds, targets.factionIds),
          );
        }
        break;
      case "property":
      case "land":
        if (signals.materialPressure) {
          addReason(
            reasons,
            "PROPERTY_LAND_ORDER",
            reasonEvidence(signals, targets.regionIds),
          );
        }
        break;
      case "recovery":
        if (
          signals.activeRebellion &&
          (hasIntersection(targets.regionIds, signals.rebellionRegionIds) ||
            hasIntersection(targets.factionIds, signals.rebellionFactionIds))
        ) {
          addReason(
            reasons,
            "ACTIVE_REBELLION_RECOVERY",
            reasonEvidence(
              signals,
              targets.regionIds,
              targets.factionIds,
              signals.activeRebellionIds,
            ),
          );
        }
        break;
    }
  }

  if (
    signals.fiscalPressure &&
    definition.treasuryCost > 0 &&
    metadata.channels.includes("material")
  ) {
    // Fiscal pressure is surfaced as evidence only for otherwise relevant
    // candidates. It never creates a cost-optimizing utility score.
    if (reasons.size > 0) {
      addReason(
        reasons,
        "FISCAL_PRESSURE",
        reasonEvidence(signals, [], [], [], { includeCountryLevel: true }),
      );
    }
  }

  if (reasons.size === 0 && metadata.backgroundEligible === true) {
    addReason(
      reasons,
      "BACKGROUND_STRUCTURAL_OPTION",
      reasonEvidence(signals, targets.regionIds, targets.factionIds),
    );
  }

  return sortedReasons(reasons);
}

function tierForCandidate(
  kind: "policy" | "intervention",
  reasons: readonly ContextualDecisionReason[],
): ContextualDecisionTier {
  if (
    kind === "intervention" &&
    reasons.some((reason) => reason.code === "ACTIVE_REBELLION_RECOVERY")
  ) {
    return "crisis";
  }

  if (
    reasons.some((reason) =>
      [
        "MATERIAL_SCARCITY",
        "LABOR_ORGANIZATION_PRESSURE",
        "POLITICAL_OPPOSITION_PRESSURE",
        "COERCIVE_RESPONSE_WINDOW",
        "FISCAL_PRESSURE",
      ].includes(reason.code),
    )
  ) {
    return "pressure";
  }

  if (
    kind === "policy" &&
    reasons.some((reason) =>
      ["INSTITUTIONAL_CONTRADICTION", "PROPERTY_LAND_ORDER"].includes(
        reason.code,
      ),
    )
  ) {
    return "reform";
  }

  return "background";
}

function compareCandidates(
  first: ContextualDecisionCandidate,
  second: ContextualDecisionCandidate,
): number {
  return (
    TIER_ORDER[first.tier] - TIER_ORDER[second.tier] ||
    second.priority - first.priority ||
    compareStableText(first.id, second.id)
  );
}

function validateMetadata(
  definitions: Readonly<Record<string, { readonly id: string }>>,
  metadata: Readonly<Record<string, ContextualDecisionMetadata>>,
  kind: "policy" | "intervention",
): void {
  const definitionIds = new Set(Object.keys(definitions));
  const metadataIds = new Set(Object.keys(metadata));
  for (const id of definitionIds) {
    if (!metadataIds.has(id)) {
      throw new Error(`Contextual ${kind} ${id} has no authored metadata.`);
    }
  }
  for (const id of metadataIds) {
    if (!definitionIds.has(id)) {
      throw new Error(`Contextual ${kind} metadata ${id} has no definition.`);
    }
    const entry = metadata[id];
    if (
      entry === undefined ||
      !Number.isInteger(entry.priority) ||
      entry.priority < 0 ||
      entry.channels.length === 0
    ) {
      throw new Error(`Contextual ${kind} ${id} has invalid metadata.`);
    }

    if (
      entry.channels.some(
        (channel) =>
          !CONTEXTUAL_DECISION_CHANNELS.includes(
            channel as ContextualDecisionChannel,
          ),
      )
    ) {
      throw new Error(`Contextual ${kind} ${id} has an invalid channel.`);
    }
  }
}

/** Validate that contextual metadata covers the scenario's production catalog. */
export function assertContextualDecisionCatalog(input: {
  readonly scenario: ScenarioDefinition;
  readonly catalog: ContextualDecisionCatalog;
}): void {
  validateMetadata(
    input.scenario.policyCatalog,
    input.catalog.policies,
    "policy",
  );
  validateMetadata(
    input.scenario.interventionCatalog,
    input.catalog.interventions,
    "intervention",
  );
}

/**
 * Pure, deterministic contextual chooser. It reads current institutional
 * rules, WorldState pressure, agendas, conflicts, and bounded event evidence;
 * it never writes state, emits events, schedules work, or consumes RNG.
 */
export function deriveContextualDecisionSurface(
  input: ContextualDecisionSelectorInput,
): ContextualDecisionSurface {
  const { scenario, world, playerCountryId, catalog } = input;
  if (scenario.playerCountryId !== playerCountryId) {
    throw new Error(
      "Contextual decision selector country must match ScenarioDefinition.playerCountryId.",
    );
  }
  if (world.countries[playerCountryId] === undefined) {
    throw new Error(
      `Contextual decision selector cannot find country ${playerCountryId}.`,
    );
  }
  if (world.policies[playerCountryId] === undefined) {
    throw new Error(
      `Contextual decision selector cannot find policy state for ${playerCountryId}.`,
    );
  }

  assertContextualDecisionCatalog({ scenario, catalog });

  const recentEvents = [...(input.recentEvents ?? [])].sort(
    (first, second) =>
      first.sequence - second.sequence ||
      compareStableText(first.id, second.id),
  );
  const agendas = [
    ...(input.agendas ??
      derivePrimaryAgendas({
        scenario,
        world,
        recentEvents,
      })),
  ].sort((first, second) => compareStableText(first.id, second.id));
  const factions = playerFactions(world, playerCountryId);
  const factionObservations = Object.fromEntries(
    factions.map((faction) => [
      faction.id,
      deriveFactionObservation(world, faction.id, scenario),
    ]),
  ) as Readonly<Record<FactionId, FactionObservation>>;
  const signals = deriveContextSignals({
    world,
    playerCountryId,
    agendas,
    recentEvents,
    factionObservations,
  });
  const policyState = world.policies[playerCountryId];
  if (policyState === undefined) {
    throw new Error(
      `Contextual decision selector cannot find policy state for ${playerCountryId}.`,
    );
  }

  const candidates: ContextualDecisionCandidate[] = [];
  for (const id of sortedIdsFromRecord(scenario.policyCatalog)) {
    const policyId = id as PolicyId;
    const definition = scenario.policyCatalog[policyId];
    const metadata = catalog.policies[policyId];
    if (definition === undefined || metadata === undefined) {
      throw new Error(`Contextual policy ${id} could not be resolved.`);
    }
    if (!policyWouldChange(definition, policyState)) {
      continue;
    }

    const relevanceReasons = derivePolicyReasons(definition, metadata, signals);
    if (relevanceReasons.length === 0) {
      continue;
    }

    const feasibility = evaluatePolicyAvailability(
      policyState,
      definition,
      scenario.policyCatalog,
    );
    const evidence = relevanceReasons.reduce(
      (merged, reason) => mergeEvidence(merged, reason.evidence),
      emptyEvidence(),
    );
    const tier = tierForCandidate("policy", relevanceReasons);
    candidates.push({
      kind: "policy",
      id: policyId,
      definition,
      feasibility,
      priority: metadata.priority,
      tier,
      relevanceReasons,
      affectedRegionIds: evidence.regionIds,
      affectedFactionIds: evidence.factionIds,
      sourceEventIds: evidence.eventIds,
      availability: feasibility.feasible ? "AVAILABLE" : "BLOCKED_BUT_RELEVANT",
    });
  }

  for (const id of sortedIdsFromRecord(scenario.interventionCatalog)) {
    const interventionId = id as InterventionId;
    const definition = scenario.interventionCatalog[interventionId];
    const metadata = catalog.interventions[interventionId];
    if (definition === undefined || metadata === undefined) {
      throw new Error(`Contextual intervention ${id} could not be resolved.`);
    }

    const targets = interventionTargets(definition);
    const relevanceReasons = deriveInterventionReasons(
      definition,
      targets,
      metadata,
      signals,
    );
    if (relevanceReasons.length === 0) {
      continue;
    }

    const feasibility = evaluateInterventionFeasibility({
      scenario,
      world,
      interventionId,
      countryId: playerCountryId,
    });
    const evidence = relevanceReasons.reduce(
      (merged, reason) => mergeEvidence(merged, reason.evidence),
      emptyEvidence(),
    );
    const tier = tierForCandidate("intervention", relevanceReasons);
    candidates.push({
      kind: "intervention",
      id: interventionId,
      definition,
      feasibility,
      priority: metadata.priority,
      tier,
      relevanceReasons,
      affectedRegionIds: sortedUnique([
        ...evidence.regionIds,
        ...targets.regionIds,
      ]),
      affectedFactionIds: sortedUnique([
        ...evidence.factionIds,
        ...targets.factionIds,
      ]),
      sourceEventIds: evidence.eventIds,
      availability: feasibility.feasible ? "AVAILABLE" : "BLOCKED_BUT_RELEVANT",
    });
  }

  const relevantCandidates = candidates.sort(compareCandidates);
  const hasAcuteContext =
    signals.activeRebellion ||
    signals.materialPressure ||
    signals.laborPressure ||
    signals.politicalPressure ||
    signals.fiscalPressure;
  const primaryCandidates = relevantCandidates
    .filter((candidate) => {
      if (candidate.tier !== "background") {
        return true;
      }
      // Background cards are quiet structural choices, so a blocked card
      // belongs in the separate roadmap/relevant surface until its authored
      // prerequisite becomes actionable. Acute responses remain visible as
      // blocked because their current pressure is the reason they matter.
      return !hasAcuteContext && candidate.availability === "AVAILABLE";
    })
    .slice(0, CONTEXTUAL_DECISION_LIMITS.normalPrimaryShortlist);
  const boundedPrimary = primaryCandidates.slice(
    0,
    CONTEXTUAL_DECISION_LIMITS.maximumPrimaryShortlist,
  );

  return {
    primaryShortlist: boundedPrimary,
    relevantCandidates,
    primaryPolicyCandidates: boundedPrimary.filter(
      (candidate): candidate is ContextualPolicyCandidate =>
        candidate.kind === "policy",
    ),
    primaryInterventionCandidates: boundedPrimary.filter(
      (candidate): candidate is ContextualInterventionCandidate =>
        candidate.kind === "intervention",
    ),
    roadmapPolicyIds: sortedIdsFromRecord(scenario.policyCatalog),
    agendas,
    factionObservations,
    activeConflictIds: signals.activeConflictIds,
  };
}
