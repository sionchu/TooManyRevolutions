import type { GameEvent } from "../events/event";
import type { JsonValue } from "../core/serialization";
import { calculateTreasuryPressure } from "../systems/economy";
import {
  deriveFactionObservation,
  type FactionObservation,
} from "../systems/factionPressure";
import { getEffectiveContactStrength } from "../systems/contactGraph";
import type { Faction } from "../state/faction";
import type {
  ContactEdgeId,
  CountryId,
  EventId,
  FactionId,
  IdeologyId,
  RegionId,
} from "../state/ids";
import type { ScenarioDefinition } from "../state/scenario";
import {
  getFullyControllingCountryId,
  getRegionFactionIds,
} from "../state/territorialControl";
import type { WorldState } from "../state/world";

export type AgendaTrend = "rising" | "falling" | "stable" | "unknown";

export type AgendaKind =
  "fiscalPressure" | "factionPressure" | "foreignIdeologicalPressure";

export type AgendaSeverityBand = "low" | "medium" | "high" | "critical";

/** Categories are extensible, but this task only returns implemented ones. */
export type InterventionCategory =
  | "policy"
  | "treasury"
  | "diplomacy"
  | "military"
  | "repression"
  | "concession"
  | "noAction";

export type AgendaCauseUnit = "ratio" | "currency" | "dailyFlow" | "count";

/** A current structural explanation, deliberately separate from event IDs. */
export interface AgendaCause {
  readonly key: string;
  readonly label: string;
  readonly value?: number;
  readonly unit?: AgendaCauseUnit;
}

export interface PrimaryAgenda {
  readonly id: string;
  readonly kind: AgendaKind;
  readonly title: string;
  readonly affectedRegionIds: readonly RegionId[];
  readonly severity: number;
  readonly severityBand?: AgendaSeverityBand;
  readonly trend: AgendaTrend;
  readonly keyCauses: readonly AgendaCause[];
  readonly involvedFactionIds: readonly FactionId[];
  readonly interventionCategories: readonly InterventionCategory[];
  /** Every ID comes from the supplied recentEvents input. */
  readonly causeEventIds: readonly EventId[];
}

export interface AgendaDerivationInput {
  readonly scenario: ScenarioDefinition;
  readonly world: WorldState;
  /** Bounded event evidence supplied by the caller; EventStore is not in WorldState. */
  readonly recentEvents?: readonly GameEvent[];
}

export type AgendaCandidate = PrimaryAgenda;

/**
 * T016A's centralized, provisional detector inputs. These values bound the
 * read model; they are not economy, faction, or ideology balance constants.
 */
export const AGENDA_DETECTOR_CONFIG = {
  minimumSeverity: 0.25,
  maximumRecentEvents: 128,
  fiscal: {
    treasuryDebtReference: 100,
    dailyDeficitReference: 10,
    minimumDebt: 0.01,
    minimumDeficit: 0.01,
  },
  faction: {
    minimumGrievance: 0.4,
    minimumOrganization: 0.35,
    grievanceWeight: 0.45,
    organizationWeight: 0.25,
    regionalStressWeight: 0.15,
    leverageWeight: 0.15,
  },
  foreign: {
    minimumDiffusionDelta: 0.0001,
    sourceSupportWeight: 0.35,
    sourceRadicalismWeight: 0.2,
    sourceOrganizationWeight: 0.2,
    destinationGapWeight: 0.25,
  },
} as const;

export const MAX_PRIMARY_AGENDAS = 4 as const;

const AGENDA_KIND_ORDER: Readonly<Record<AgendaKind, number>> = {
  fiscalPressure: 0,
  factionPressure: 1,
  foreignIdeologicalPressure: 2,
};

const INTERVENTION_CATEGORY_ORDER: readonly InterventionCategory[] = [
  "policy",
  "treasury",
  "diplomacy",
  "military",
  "repression",
  "concession",
  "noAction",
] as const;

const CONTACT_CHANNEL_LABELS = {
  border: "접경",
  trade: "교역",
  migration: "이주",
  information: "정보",
} as const;

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

function saturatingPositive(value: number, reference: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return value / (value + reference);
}

function severityBand(severity: number): AgendaSeverityBand {
  if (severity < 0.4) {
    return "low";
  }

  if (severity < 0.6) {
    return "medium";
  }

  if (severity < 0.8) {
    return "high";
  }

  return "critical";
}

function sortedIds<T extends string>(ids: readonly T[]): readonly T[] {
  return [...new Set(ids)].sort(compareStableText) as readonly T[];
}

function sortedRecentEvents(
  events: readonly GameEvent[] | undefined,
): readonly GameEvent[] {
  if (events === undefined || events.length === 0) {
    return [];
  }

  const ordered = [...events].sort(
    (first, second) =>
      first.sequence - second.sequence ||
      compareStableText(first.id, second.id),
  );
  const unique: GameEvent[] = [];
  const seen = new Set<EventId>();

  for (const event of ordered) {
    if (seen.has(event.id)) {
      continue;
    }

    seen.add(event.id);
    unique.push(event);
  }

  return unique.slice(-AGENDA_DETECTOR_CONFIG.maximumRecentEvents);
}

function asObject(
  value: JsonValue,
): Readonly<Record<string, JsonValue>> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Readonly<Record<string, JsonValue>>;
}

function stringField(
  object: Readonly<Record<string, JsonValue>>,
  key: string,
): string | null {
  const value = object[key];
  return typeof value === "string" ? value : null;
}

function numberField(
  object: Readonly<Record<string, JsonValue>>,
  key: string,
): number | null {
  const value = object[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function arrayField(
  object: Readonly<Record<string, JsonValue>>,
  key: string,
): readonly JsonValue[] | null {
  const value = object[key];
  return Array.isArray(value) ? value : null;
}

function eventCountryId(event: GameEvent): CountryId | null {
  const payload = asObject(event.payload);
  const countryId = payload === null ? null : stringField(payload, "countryId");
  return (countryId ?? event.actorId ?? null) as CountryId | null;
}

function eventRegionId(event: GameEvent): RegionId | null {
  const payload = asObject(event.payload);
  const regionId = payload === null ? null : stringField(payload, "regionId");
  return (regionId ?? event.targetId ?? null) as RegionId | null;
}

function pressureDirection(event: GameEvent): number | null {
  const payload = asObject(event.payload);
  if (payload === null) {
    return null;
  }

  switch (event.type) {
    case "TREASURY_CHANGED": {
      const delta = numberField(payload, "delta");
      return delta === null ? null : -delta;
    }
    case "RESOURCE_SHORTAGE_CHANGED": {
      const previous = numberField(payload, "previousScarcity");
      const next = numberField(payload, "scarcity");
      return previous === null || next === null ? null : next - previous;
    }
    case "IDEOLOGY_DIFFUSED": {
      return numberField(payload, "appliedDelta");
    }
    case "IDEOLOGY_SUPPORT_CHANGED":
    case "IDEOLOGY_RADICALISM_CHANGED":
    case "IDEOLOGY_ORGANIZATION_CHANGED": {
      const delta = numberField(payload, "appliedDelta");
      if (delta !== null) {
        return delta;
      }

      const previous =
        numberField(payload, "previousValue") ??
        numberField(payload, "previousSupport");
      const next =
        numberField(payload, "nextValue") ??
        numberField(payload, "nextSupport");
      return previous === null || next === null ? null : next - previous;
    }
    default:
      return null;
  }
}

function deriveTrend(directions: readonly (number | null)[]): AgendaTrend {
  const meaningful = directions.filter(
    (direction): direction is number =>
      direction !== null && Math.abs(direction) > 0.000001,
  );

  if (meaningful.length === 0) {
    return "unknown";
  }

  const hasRising = meaningful.some((direction) => direction > 0);
  const hasFalling = meaningful.some((direction) => direction < 0);

  if (hasRising && hasFalling) {
    return "stable";
  }

  return hasRising ? "rising" : "falling";
}

function sortCauseEventIds(events: readonly GameEvent[]): readonly EventId[] {
  return [...events]
    .sort(
      (first, second) =>
        first.sequence - second.sequence ||
        compareStableText(first.id, second.id),
    )
    .map((event) => event.id);
}

function policyCapability(scenario: ScenarioDefinition): boolean {
  return Object.keys(scenario.policyCatalog).length > 0;
}

function directionParticle(name: string): "으로" | "로" {
  const lastCharacter = name.at(-1);
  if (lastCharacter === undefined) {
    return "으로";
  }

  const codePoint = lastCharacter.codePointAt(0);
  if (codePoint === undefined || codePoint < 0xac00 || codePoint > 0xd7a3) {
    return "으로";
  }

  const finalConsonant = (codePoint - 0xac00) % 28;
  return finalConsonant === 0 || finalConsonant === 8 ? "로" : "으로";
}

function interventionCategories(
  categories: readonly InterventionCategory[],
): readonly InterventionCategory[] {
  const categorySet = new Set(categories);
  return INTERVENTION_CATEGORY_ORDER.filter((category) =>
    categorySet.has(category),
  );
}

function compareAgendaCandidates(
  first: AgendaCandidate,
  second: AgendaCandidate,
): number {
  return (
    second.severity - first.severity ||
    AGENDA_KIND_ORDER[first.kind] - AGENDA_KIND_ORDER[second.kind] ||
    compareStableText(
      first.affectedRegionIds[0] ?? "",
      second.affectedRegionIds[0] ?? "",
    ) ||
    compareStableText(
      first.involvedFactionIds[0] ?? "",
      second.involvedFactionIds[0] ?? "",
    ) ||
    compareStableText(first.id, second.id)
  );
}

function controllingCountryId(
  scenario: ScenarioDefinition,
  world: WorldState,
  regionId: RegionId,
): CountryId | null {
  const region = world.regions[regionId];
  if (region === undefined) {
    return null;
  }

  return getFullyControllingCountryId(scenario, world, region.id);
}

function candidate(
  value: Omit<AgendaCandidate, "severityBand">,
): AgendaCandidate {
  const severity = clamp01(value.severity);
  return {
    ...value,
    severity,
    severityBand: severityBand(severity),
  };
}

function fiscalEvidence(
  events: readonly GameEvent[],
  countryId: CountryId,
): readonly GameEvent[] {
  return events.filter(
    (event) =>
      event.type === "TREASURY_CHANGED" && eventCountryId(event) === countryId,
  );
}

/** Detect national fiscal pressure from the actual T011 stock/flow fields. */
export function detectFiscalPressureAgenda(
  input: AgendaDerivationInput,
): AgendaCandidate | null {
  const playerCountryId = input.scenario.playerCountryId;
  if (playerCountryId === null) {
    return null;
  }

  const country = input.world.countries[playerCountryId];
  if (country === undefined) {
    return null;
  }

  const debt = Math.max(0, -country.treasury);
  const deficit = calculateTreasuryPressure(country);
  const config = AGENDA_DETECTOR_CONFIG.fiscal;

  if (debt < config.minimumDebt && deficit < config.minimumDeficit) {
    return null;
  }

  const debtSignal = saturatingPositive(debt, config.treasuryDebtReference);
  const deficitSignal = saturatingPositive(
    deficit,
    config.dailyDeficitReference,
  );
  // Stock and flow are independent fiscal-pressure routes. Weighting them
  // together capped a severe debt-only or deficit-only crisis below its honest
  // severity band, so use the stronger observed pressure rather than requiring
  // both signals to be present.
  const severity = Math.max(debtSignal, deficitSignal);

  if (severity < AGENDA_DETECTOR_CONFIG.minimumSeverity) {
    return null;
  }

  const evidence = fiscalEvidence(
    sortedRecentEvents(input.recentEvents),
    playerCountryId,
  );
  const keyCauses: AgendaCause[] = [];

  if (debt > 0) {
    keyCauses.push({
      key: "negativeTreasury",
      label: "국고가 마이너스입니다",
      value: country.treasury,
      unit: "currency",
    });
  }

  if (deficit > 0) {
    keyCauses.push({
      key: "dailyDeficit",
      label: "일일 지출이 수입을 초과합니다",
      value: deficit,
      unit: "dailyFlow",
    });
  }

  return candidate({
    id: `agenda:fiscal:${playerCountryId}`,
    kind: "fiscalPressure",
    title: `${country.name}의 재정 압박`,
    affectedRegionIds: [],
    severity,
    trend: deriveTrend(evidence.map(pressureDirection)),
    keyCauses,
    involvedFactionIds: [],
    interventionCategories: interventionCategories(["noAction"]),
    causeEventIds: sortCauseEventIds([...evidence]),
  });
}

function factionEvidence(
  events: readonly GameEvent[],
  faction: Faction,
  observation: FactionObservation,
): readonly GameEvent[] {
  const regionIds = new Set(observation.regional.regionIds);

  return events.filter((event) => {
    if (
      event.type === "FACTION_STRATEGY_CHANGED" &&
      event.actorId === faction.id
    ) {
      return true;
    }

    if (
      event.type === "TREASURY_CHANGED" &&
      eventCountryId(event) === faction.countryId
    ) {
      return true;
    }

    const regionId = eventRegionId(event);
    return (
      regionId !== null &&
      regionIds.has(regionId) &&
      (event.type === "RESOURCE_SHORTAGE_CHANGED" ||
        event.type === "IDEOLOGY_ORGANIZATION_CHANGED" ||
        event.type === "IDEOLOGY_RADICALISM_CHANGED")
    );
  });
}

function factionRelevantRegionIds(
  observation: FactionObservation,
): readonly RegionId[] {
  return sortedIds(observation.regional.regionIds);
}

/** Detect faction pressure from T016's actual observation projection. */
export function detectFactionPressureAgendas(
  input: AgendaDerivationInput,
): readonly AgendaCandidate[] {
  const playerCountryId = input.scenario.playerCountryId;
  if (playerCountryId === null) {
    return [];
  }

  const events = sortedRecentEvents(input.recentEvents);
  const agendas: AgendaCandidate[] = [];
  const policyAvailable = policyCapability(input.scenario);
  const config = AGENDA_DETECTOR_CONFIG.faction;

  const factions = Object.values(input.world.factions)
    .filter((faction) => faction.countryId === playerCountryId)
    .sort((first, second) => compareStableText(first.id, second.id));

  for (const faction of factions) {
    const observation = deriveFactionObservation(
      input.world,
      faction.id,
      input.scenario,
    );
    const organizedSignal = Math.max(
      observation.faction.organization,
      observation.regional.affinityWeightedIdeologyOrganization,
    );

    // Current strategy is intentionally not part of this trigger condition.
    if (
      observation.faction.grievance < config.minimumGrievance ||
      organizedSignal < config.minimumOrganization
    ) {
      continue;
    }

    const regionalStress = Math.max(
      observation.regional.averageScarcity,
      observation.regional.averageUnrest,
      observation.country.instability / 100,
    );
    const leverage = Math.max(
      observation.faction.influence,
      observation.faction.resources,
      observation.strongestForeignLink,
    );
    const severity = clamp01(
      observation.faction.grievance * config.grievanceWeight +
        organizedSignal * config.organizationWeight +
        regionalStress * config.regionalStressWeight +
        leverage * config.leverageWeight,
    );

    if (severity < AGENDA_DETECTOR_CONFIG.minimumSeverity) {
      continue;
    }

    const evidence = factionEvidence(events, faction, observation);
    const keyCauses: AgendaCause[] = [
      {
        key: "factionGrievance",
        label: `${faction.name}의 불만이 높습니다`,
        value: observation.faction.grievance,
        unit: "ratio",
      },
      {
        key: "factionOrganization",
        label: `${faction.name}의 조직 역량이 존재합니다`,
        value: observation.faction.organization,
        unit: "ratio",
      },
    ];

    if (regionalStress > 0) {
      keyCauses.push({
        key: "regionalStress",
        label: "관련 지역에 물질·행정 압력이 있습니다",
        value: regionalStress,
        unit: "ratio",
      });
    }

    if (observation.faction.currentStrategy !== "wait") {
      keyCauses.push({
        key: "currentStrategy",
        label: `현재 전략: ${observation.faction.currentStrategy}`,
      });
    }

    agendas.push(
      candidate({
        id: `agenda:faction:${faction.id}`,
        kind: "factionPressure",
        title: `${faction.name}의 정치 압력`,
        affectedRegionIds: factionRelevantRegionIds(observation),
        severity,
        trend: deriveTrend(evidence.map(pressureDirection)),
        keyCauses,
        involvedFactionIds: [faction.id],
        interventionCategories: interventionCategories([
          ...(policyAvailable ? (["policy"] as const) : []),
          "noAction",
        ]),
        causeEventIds: sortCauseEventIds([...evidence]),
      }),
    );
  }

  return agendas.sort(compareAgendaCandidates);
}

interface ForeignEvidence {
  readonly event: GameEvent;
  readonly sourceRegionId: RegionId;
  readonly destinationRegionId: RegionId;
  readonly ideologyId: IdeologyId;
  readonly contactEdgeId: ContactEdgeId;
  readonly pressureDelta: number | null;
}

function contributionEvidence(
  event: GameEvent,
): readonly Omit<ForeignEvidence, "event" | "pressureDelta">[] {
  const payload = asObject(event.payload);
  if (payload === null) {
    return [];
  }

  const direct = [payload];
  const sourceContributions = arrayField(payload, "sourceContributions");
  const values = sourceContributions === null ? direct : sourceContributions;
  const result: Omit<ForeignEvidence, "event" | "pressureDelta">[] = [];

  for (const value of values) {
    const object = asObject(value);
    if (object === null) {
      continue;
    }

    const sourceRegionId = stringField(
      object,
      "sourceRegionId",
    ) as RegionId | null;
    const destinationRegionId = stringField(
      object,
      "destinationRegionId",
    ) as RegionId | null;
    const ideologyId = stringField(object, "ideologyId") as IdeologyId | null;
    const contactEdgeId = stringField(
      object,
      "contactEdgeId",
    ) as ContactEdgeId | null;

    if (
      sourceRegionId === null ||
      destinationRegionId === null ||
      ideologyId === null ||
      contactEdgeId === null
    ) {
      continue;
    }

    result.push({
      sourceRegionId,
      destinationRegionId,
      ideologyId,
      contactEdgeId,
    });
  }

  return result;
}

function collectForeignEvidence(
  events: readonly GameEvent[],
): readonly ForeignEvidence[] {
  const evidence: ForeignEvidence[] = [];

  for (const event of events) {
    if (
      event.type !== "IDEOLOGY_DIFFUSED" &&
      event.type !== "IDEOLOGY_SUPPORT_CHANGED"
    ) {
      continue;
    }

    const pressureDelta = pressureDirection(event);
    for (const contribution of contributionEvidence(event)) {
      evidence.push({ ...contribution, event, pressureDelta });
    }
  }

  return evidence;
}

function foreignEvidenceKey(
  evidence: Pick<ForeignEvidence, "contactEdgeId" | "ideologyId">,
): string {
  return `${evidence.contactEdgeId}\u0000${evidence.ideologyId}`;
}

/**
 * Detect only foreign ideological pressure that has a live directed route and
 * actual diffusion evidence. Support values without either are insufficient.
 */
export function detectForeignIdeologicalPressureAgendas(
  input: AgendaDerivationInput,
): readonly AgendaCandidate[] {
  const playerCountryId = input.scenario.playerCountryId;
  if (playerCountryId === null) {
    return [];
  }

  const edgeById = new Map(
    input.scenario.mapContactTopology.contactEdges.map((edge) => [
      edge.id,
      edge,
    ]),
  );
  const evidenceByKey = new Map<string, ForeignEvidence[]>();

  for (const evidence of collectForeignEvidence(
    sortedRecentEvents(input.recentEvents),
  )) {
    const edge = edgeById.get(evidence.contactEdgeId);
    if (
      edge === undefined ||
      edge.fromRegionId !== evidence.sourceRegionId ||
      edge.toRegionId !== evidence.destinationRegionId
    ) {
      continue;
    }

    const key = foreignEvidenceKey(evidence);
    const current = evidenceByKey.get(key) ?? [];
    evidenceByKey.set(key, [...current, evidence]);
  }

  const agendas: AgendaCandidate[] = [];
  const orderedKeys = [...evidenceByKey.keys()].sort(compareStableText);
  const config = AGENDA_DETECTOR_CONFIG.foreign;

  for (const key of orderedKeys) {
    const evidence = evidenceByKey.get(key) ?? [];
    const firstEvidence = evidence[0];
    if (firstEvidence === undefined) {
      continue;
    }

    const edge = edgeById.get(firstEvidence.contactEdgeId);
    if (edge === undefined) {
      continue;
    }

    const sourceRegion = input.world.regions[edge.fromRegionId];
    const destinationRegion = input.world.regions[edge.toRegionId];
    if (sourceRegion === undefined || destinationRegion === undefined) {
      continue;
    }

    const sourceCountryId = controllingCountryId(
      input.scenario,
      input.world,
      sourceRegion.id,
    );
    const destinationCountryId = controllingCountryId(
      input.scenario,
      input.world,
      destinationRegion.id,
    );
    if (
      sourceCountryId === null ||
      destinationCountryId !== playerCountryId ||
      sourceCountryId === playerCountryId
    ) {
      continue;
    }

    const effectiveStrength = getEffectiveContactStrength(
      input.scenario,
      input.world,
      edge.id,
    );
    if (effectiveStrength <= 0) {
      continue;
    }

    const ideologyId = firstEvidence.ideologyId;
    const sourceState = sourceRegion.ideology[ideologyId];
    const destinationState = destinationRegion.ideology[ideologyId];
    const sourceIdeology = input.scenario.ideologyCatalog[ideologyId];
    if (sourceState === undefined || destinationState === undefined) {
      continue;
    }

    const positiveEvidence = evidence.filter(
      (item) =>
        item.pressureDelta !== null &&
        item.pressureDelta >=
          AGENDA_DETECTOR_CONFIG.foreign.minimumDiffusionDelta,
    );
    if (positiveEvidence.length === 0) {
      continue;
    }

    const destinationGap = Math.max(
      0,
      sourceState.support - destinationState.support,
    );
    const severity = clamp01(
      effectiveStrength *
        (sourceState.support * config.sourceSupportWeight +
          sourceState.radicalism * config.sourceRadicalismWeight +
          sourceState.organization * config.sourceOrganizationWeight +
          destinationGap * config.destinationGapWeight),
    );

    if (severity < AGENDA_DETECTOR_CONFIG.minimumSeverity) {
      continue;
    }

    const involvedFactionIds = getRegionFactionIds(
      input.scenario,
      input.world,
      destinationRegion.id,
    ).filter(
      (factionId) =>
        input.world.factions[factionId]?.countryId === playerCountryId,
    );
    const sourceCountry = input.world.countries[sourceCountryId];
    const ideologyName = sourceIdeology?.name ?? ideologyId;
    const causeEvents = evidence.map((item) => item.event);

    agendas.push(
      candidate({
        id: `agenda:foreign:${edge.id}:${ideologyId}`,
        kind: "foreignIdeologicalPressure",
        title: `${sourceCountry?.name ?? sourceCountryId}의 ${ideologyName} 영향이 ${destinationRegion.name}${directionParticle(destinationRegion.name)} 유입`,
        affectedRegionIds: [destinationRegion.id],
        severity,
        trend: deriveTrend(evidence.map((item) => item.pressureDelta)),
        keyCauses: [
          {
            key: "directedContact",
            label: `${sourceRegion.name} → ${destinationRegion.name} ${CONTACT_CHANNEL_LABELS[edge.channel]} 접촉`,
            value: effectiveStrength,
            unit: "ratio",
          },
          {
            key: "sourceIdeologySupport",
            label: `${ideologyName}의 출발 지역 지지`,
            value: sourceState.support,
            unit: "ratio",
          },
          {
            key: "destinationIdeologySupport",
            label: `${ideologyName}의 도착 지역 지지`,
            value: destinationState.support,
            unit: "ratio",
          },
          {
            key: "diffusionEvidence",
            label: "실제 확산 event가 관측되었습니다",
            value: positiveEvidence.length,
            unit: "count",
          },
        ],
        involvedFactionIds,
        interventionCategories: interventionCategories(["noAction"]),
        causeEventIds: sortCauseEventIds([...causeEvents]),
      }),
    );
  }

  return agendas.sort(compareAgendaCandidates);
}

/** Derive bounded presentation-ready agenda candidates without writing state. */
export function deriveNationalAgendas(
  input: AgendaDerivationInput,
): readonly PrimaryAgenda[] {
  const candidates: AgendaCandidate[] = [];
  const fiscal = detectFiscalPressureAgenda(input);
  if (fiscal !== null) {
    candidates.push(fiscal);
  }

  candidates.push(...detectFactionPressureAgendas(input));
  candidates.push(...detectForeignIdeologicalPressureAgendas(input));

  return candidates
    .filter(
      (agenda) => agenda.severity >= AGENDA_DETECTOR_CONFIG.minimumSeverity,
    )
    .sort(compareAgendaCandidates)
    .slice(0, MAX_PRIMARY_AGENDAS);
}

/** Explicit alias for callers that use the read-model vocabulary. */
export const derivePrimaryAgendas = deriveNationalAgendas;
