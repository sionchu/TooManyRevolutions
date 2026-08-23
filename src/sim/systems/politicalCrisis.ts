import type { Faction, PoliticalCrisisCapability } from "../state/faction";
import type { CountryId, FactionId, IdeologyId, RegionId } from "../state/ids";
import type { ScenarioDefinition } from "../state/scenario";
import {
  getFullyControlledRegionIds,
  getRegionFactionIds,
} from "../state/territorialControl";
import type { IdeologyState } from "../state/ideology";
import type { Region } from "../state/region";
import type { WorldState } from "../state/world";
import { isFactionRelevantToRegion } from "./factionPressure";

export const COUP_PREREQUISITE_CONFIG = {
  minimumGrievance: 0.6,
  minimumOrganization: 0.6,
  minimumInfluence: 0.6,
  minimumResources: 0.25,
  minimumStateWeakness: 0.45,
} as const;

export const REBELLION_PREREQUISITE_CONFIG = {
  minimumGrievance: 0.55,
  minimumFactionOrganization: 0.55,
  minimumFactionResources: 0.25,
  minimumLocalRadicalism: 0.55,
  minimumLocalIdeologyOrganization: 0.55,
  minimumLocalUnrest: 0.45,
  minimumGeographicConcentration: 0.5,
  minimumStateWeakness: 0.35,
} as const;

export type CrisisGateStatus = "pass" | "fail";

export interface CrisisGate<TId extends string = string> {
  readonly id: TId;
  readonly status: CrisisGateStatus;
  readonly value: number | boolean;
  readonly threshold?: number;
  readonly reason: string;
}

export type FutureCrisisEvidenceId =
  "militarySympathy" | "foreignSupport" | "weapons" | "leadership";

export interface UnimplementedCrisisEvidence {
  readonly id: FutureCrisisEvidenceId;
  readonly status: "notImplemented";
}

export interface CrisisStateWeakness {
  readonly legitimacyWeakness: number;
  readonly stateCapacityWeakness: number;
  readonly nationalInstability: number;
  readonly controlledRegionUnrest: number;
  readonly territorialWeakness: number;
  readonly stateWeakness: number;
}

export type CoupGateId =
  | "capability"
  | "centralGovernment"
  | "grievance"
  | "organization"
  | "influence"
  | "resources"
  | "stateWeakness";

export type RebellionGateId =
  | "capability"
  | "grievance"
  | "factionOrganization"
  | "resources"
  | "localMobilization"
  | "localRadicalism"
  | "localIdeologyOrganization"
  | "localUnrest"
  | "geographicConcentration"
  | "stateWeakness";

export interface CoupSupportingSignals {
  readonly factionResources: number;
  readonly countryLegitimacy: number;
  readonly countryStateCapacity: number;
  readonly countryInstability: number;
  readonly currentStrategy: Faction["currentStrategy"];
}

export interface RebellionRegionalSignal {
  readonly regionId: RegionId;
  readonly regionName: string;
  readonly population: number;
  readonly factionPresence: boolean;
  readonly affinityWeightedSupport: number;
  readonly localRadicalism: number;
  readonly localIdeologyOrganization: number;
  readonly localUnrest: number;
  readonly mobilizationReadiness: number;
  readonly localMobilizationGate: boolean;
}

export interface RebellionSupportingSignals {
  readonly factionResources: number;
  readonly currentStrategy: Faction["currentStrategy"];
  readonly factionControlledRegionIds: readonly RegionId[];
  readonly maximumAffinityWeightedSupport: number;
}

export interface CoupPrerequisiteSnapshot {
  readonly kind: "coup";
  readonly factionId: FactionId;
  readonly countryId: CountryId;
  readonly affectedRegionIds: readonly RegionId[];
  readonly capabilities: readonly PoliticalCrisisCapability[];
  readonly stateWeakness: CrisisStateWeakness;
  readonly gates: readonly CrisisGate<CoupGateId>[];
  readonly supportingSignals: CoupSupportingSignals;
  readonly futureEvidence: readonly UnimplementedCrisisEvidence[];
  readonly eligible: boolean;
  readonly reasons: readonly string[];
}

export interface RebellionPrerequisiteSnapshot {
  readonly kind: "rebellion";
  readonly factionId: FactionId;
  readonly countryId: CountryId;
  readonly affectedRegionIds: readonly RegionId[];
  readonly capabilities: readonly PoliticalCrisisCapability[];
  readonly stateWeakness: CrisisStateWeakness;
  readonly gates: readonly CrisisGate<RebellionGateId>[];
  readonly regionalSignals: readonly RebellionRegionalSignal[];
  readonly supportingSignals: RebellionSupportingSignals;
  readonly futureEvidence: readonly UnimplementedCrisisEvidence[];
  readonly geographicConcentration: number;
  readonly qualifiedRegionIds: readonly RegionId[];
  readonly eligible: boolean;
  readonly reasons: readonly string[];
}

export interface PoliticalCrisisPrerequisiteSnapshots {
  readonly coups: readonly CoupPrerequisiteSnapshot[];
  readonly rebellions: readonly RebellionPrerequisiteSnapshot[];
}

const UNIMPLEMENTED_FUTURE_EVIDENCE: readonly UnimplementedCrisisEvidence[] = [
  { id: "foreignSupport", status: "notImplemented" },
  { id: "leadership", status: "notImplemented" },
  { id: "militarySympathy", status: "notImplemented" },
  { id: "weapons", status: "notImplemented" },
];

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function capabilitiesFor(
  scenario: ScenarioDefinition,
  factionId: FactionId,
): readonly PoliticalCrisisCapability[] {
  return scenario.factionCapabilities?.[factionId] ?? [];
}

function numericGate<TId extends string>(
  id: TId,
  value: number,
  threshold: number,
  label: string,
): CrisisGate<TId> {
  const passed = value >= threshold;
  return {
    id,
    status: passed ? "pass" : "fail",
    value,
    threshold,
    reason: passed
      ? `${label} 기준을 충족함.`
      : `${label}이(가) ${threshold} 이상이어야 함.`,
  };
}

function booleanGate<TId extends string>(
  id: TId,
  value: boolean,
  passReason: string,
  failReason: string,
): CrisisGate<TId> {
  return {
    id,
    status: value ? "pass" : "fail",
    value,
    reason: value ? passReason : failReason,
  };
}

function deriveReasons(gates: readonly CrisisGate[]): readonly string[] {
  const failed = gates
    .filter((gate) => gate.status === "fail")
    .map((gate) => `${gate.id}: ${gate.reason}`);
  return failed.length > 0 ? failed : ["모든 필수 gate를 충족함."];
}

function deriveCentralGovernment(
  world: WorldState,
  countryId: CountryId,
): boolean {
  const country = world.countries[countryId];
  if (country === undefined || country.currentGovernmentId === null) {
    return false;
  }

  const government = world.governments[country.currentGovernmentId];
  return (
    government !== undefined &&
    government.countryId === countryId &&
    government.authority === "central"
  );
}

/**
 * Pure baseline state weakness. It is intentionally a read model, not a
 * WorldState field or a crisis progress meter.
 */
export function deriveCrisisStateWeakness(
  scenario: ScenarioDefinition,
  world: WorldState,
  countryId: CountryId,
): CrisisStateWeakness {
  const country = world.countries[countryId];
  if (country === undefined) {
    throw new Error(`Country ${countryId} does not exist in WorldState.`);
  }

  const fullyControlledRegionIds = getFullyControlledRegionIds(
    scenario,
    world,
    countryId,
  );
  const fullyControlledRegions = fullyControlledRegionIds
    .map((regionId) => world.regions[regionId])
    .filter((region): region is Region => region !== undefined);
  const controlledPopulation = fullyControlledRegions.reduce(
    (total, region) => total + region.population,
    0,
  );
  const controlledRegionUnrest =
    controlledPopulation > 0
      ? fullyControlledRegions.reduce(
          (total, region) => total + region.unrest * region.population,
          0,
        ) / controlledPopulation
      : 0;

  const legalLandHexes = scenario.mapTerritorialTopology.landHexes.filter(
    (landHex) => world.regions[landHex.regionId]?.ownerCountryId === countryId,
  );
  const controlledLegalLandHexes = legalLandHexes.filter((landHex) => {
    const controller = world.landHexStates[landHex.id]?.controller;
    return controller?.kind === "country" && controller.countryId === countryId;
  });
  const territorialWeakness =
    legalLandHexes.length === 0
      ? 0
      : 1 - controlledLegalLandHexes.length / legalLandHexes.length;

  const legitimacyWeakness = clamp01((100 - country.legitimacy) / 100);
  const stateCapacityWeakness = clamp01((100 - country.stateCapacity) / 100);
  const nationalInstability = clamp01(country.instability / 100);
  const stateWeakness = Math.max(
    legitimacyWeakness,
    stateCapacityWeakness,
    nationalInstability,
    controlledRegionUnrest,
    territorialWeakness,
  );

  return {
    legitimacyWeakness,
    stateCapacityWeakness,
    nationalInstability,
    controlledRegionUnrest,
    territorialWeakness,
    stateWeakness,
  };
}

function deriveAffinityWeightedIdeologyState(
  faction: Pick<Faction, "ideologyAffinity">,
  region: Pick<Region, "ideology">,
): IdeologyState {
  let totalAffinity = 0;
  let support = 0;
  let radicalism = 0;
  let organization = 0;

  for (const [ideologyId, affinity] of Object.entries(
    faction.ideologyAffinity,
  ).sort(([firstId], [secondId]) => compareStableText(firstId, secondId))) {
    if (affinity <= 0) {
      continue;
    }

    const ideologyState = region.ideology[ideologyId as IdeologyId];
    if (ideologyState === undefined) {
      continue;
    }

    totalAffinity += affinity;
    support += ideologyState.support * affinity;
    radicalism += ideologyState.radicalism * affinity;
    organization += ideologyState.organization * affinity;
  }

  if (totalAffinity === 0) {
    return { support: 0, radicalism: 0, organization: 0 };
  }

  return {
    support: clamp01(support / totalAffinity),
    radicalism: clamp01(radicalism / totalAffinity),
    organization: clamp01(organization / totalAffinity),
  };
}

function deriveCoupSnapshot(
  scenario: ScenarioDefinition,
  world: WorldState,
  faction: Faction,
): CoupPrerequisiteSnapshot {
  const country = world.countries[faction.countryId];
  if (country === undefined) {
    throw new Error(`Faction ${faction.id} references a missing country.`);
  }

  const capabilities = capabilitiesFor(scenario, faction.id);
  const stateWeakness = deriveCrisisStateWeakness(
    scenario,
    world,
    faction.countryId,
  );
  const gates: readonly CrisisGate<CoupGateId>[] = [
    booleanGate(
      "capability",
      capabilities.includes("coup"),
      "ScenarioDefinition이 쿠데타 capability를 선언함.",
      "ScenarioDefinition에 쿠데타 capability가 없음.",
    ),
    booleanGate(
      "centralGovernment",
      deriveCentralGovernment(world, faction.countryId),
      "현재 중앙 정부가 존재함.",
      "현재 중앙 정부가 없음.",
    ),
    numericGate(
      "grievance",
      faction.grievance,
      COUP_PREREQUISITE_CONFIG.minimumGrievance,
      "Faction grievance",
    ),
    numericGate(
      "organization",
      faction.organization,
      COUP_PREREQUISITE_CONFIG.minimumOrganization,
      "Faction.organization",
    ),
    numericGate(
      "influence",
      faction.influence,
      COUP_PREREQUISITE_CONFIG.minimumInfluence,
      "Faction influence",
    ),
    numericGate(
      "resources",
      faction.resources,
      COUP_PREREQUISITE_CONFIG.minimumResources,
      "Faction resources",
    ),
    numericGate(
      "stateWeakness",
      stateWeakness.stateWeakness,
      COUP_PREREQUISITE_CONFIG.minimumStateWeakness,
      "국가 약화",
    ),
  ];

  return {
    kind: "coup",
    factionId: faction.id,
    countryId: faction.countryId,
    affectedRegionIds:
      country.capitalRegionId === null ? [] : [country.capitalRegionId],
    capabilities: [...capabilities],
    stateWeakness,
    gates,
    supportingSignals: {
      factionResources: faction.resources,
      countryLegitimacy: country.legitimacy,
      countryStateCapacity: country.stateCapacity,
      countryInstability: country.instability,
      currentStrategy: faction.currentStrategy,
    },
    futureEvidence: UNIMPLEMENTED_FUTURE_EVIDENCE,
    eligible: gates.every((gate) => gate.status === "pass"),
    reasons: deriveReasons(gates),
  };
}

function deriveRebellionRegionalSignals(
  scenario: ScenarioDefinition,
  world: WorldState,
  faction: Faction,
): readonly RebellionRegionalSignal[] {
  return Object.values(world.regions)
    .filter((region) =>
      isFactionRelevantToRegion(faction, region, scenario, world),
    )
    .sort((first, second) => compareStableText(first.id, second.id))
    .map((region) => {
      const ideology = deriveAffinityWeightedIdeologyState(faction, region);
      const localMobilizationGate =
        ideology.radicalism >=
          REBELLION_PREREQUISITE_CONFIG.minimumLocalRadicalism &&
        ideology.organization >=
          REBELLION_PREREQUISITE_CONFIG.minimumLocalIdeologyOrganization &&
        region.unrest >= REBELLION_PREREQUISITE_CONFIG.minimumLocalUnrest;
      const mobilizationReadiness = Math.min(
        clamp01(
          ideology.radicalism /
            REBELLION_PREREQUISITE_CONFIG.minimumLocalRadicalism,
        ),
        clamp01(
          ideology.organization /
            REBELLION_PREREQUISITE_CONFIG.minimumLocalIdeologyOrganization,
        ),
        clamp01(
          region.unrest / REBELLION_PREREQUISITE_CONFIG.minimumLocalUnrest,
        ),
      );

      return {
        regionId: region.id,
        regionName: region.name,
        population: region.population,
        factionPresence: getRegionFactionIds(
          scenario,
          world,
          region.id,
        ).includes(faction.id),
        affinityWeightedSupport: ideology.support,
        localRadicalism: ideology.radicalism,
        localIdeologyOrganization: ideology.organization,
        localUnrest: region.unrest,
        mobilizationReadiness,
        localMobilizationGate,
      };
    });
}

function deriveGeographicConcentration(
  regionalSignals: readonly RebellionRegionalSignal[],
): number {
  const weightedReadiness = regionalSignals.map(
    (signal) => signal.mobilizationReadiness * Math.max(signal.population, 1),
  );
  const totalReadiness = weightedReadiness.reduce(
    (total, value) => total + value,
    0,
  );
  return totalReadiness === 0
    ? 0
    : Math.max(...weightedReadiness) / totalReadiness;
}

function deriveRebellionSnapshot(
  scenario: ScenarioDefinition,
  world: WorldState,
  faction: Faction,
): RebellionPrerequisiteSnapshot {
  const regionalSignals = deriveRebellionRegionalSignals(
    scenario,
    world,
    faction,
  );
  const country = world.countries[faction.countryId];
  if (country === undefined) {
    throw new Error(`Faction ${faction.id} references a missing country.`);
  }

  const stateWeakness = deriveCrisisStateWeakness(
    scenario,
    world,
    faction.countryId,
  );
  const maximumLocalRadicalism = Math.max(
    0,
    ...regionalSignals.map((signal) => signal.localRadicalism),
  );
  const maximumLocalIdeologyOrganization = Math.max(
    0,
    ...regionalSignals.map((signal) => signal.localIdeologyOrganization),
  );
  const maximumLocalUnrest = Math.max(
    0,
    ...regionalSignals.map((signal) => signal.localUnrest),
  );
  const qualifiedRegionIds = regionalSignals
    .filter((signal) => signal.localMobilizationGate)
    .map((signal) => signal.regionId);
  const geographicConcentration =
    deriveGeographicConcentration(regionalSignals);
  const capabilities = capabilitiesFor(scenario, faction.id);
  const gates: readonly CrisisGate<RebellionGateId>[] = [
    booleanGate(
      "capability",
      capabilities.includes("rebellion"),
      "ScenarioDefinition이 반란 capability를 선언함.",
      "ScenarioDefinition에 반란 capability가 없음.",
    ),
    numericGate(
      "grievance",
      faction.grievance,
      REBELLION_PREREQUISITE_CONFIG.minimumGrievance,
      "Faction grievance",
    ),
    numericGate(
      "factionOrganization",
      faction.organization,
      REBELLION_PREREQUISITE_CONFIG.minimumFactionOrganization,
      "Faction.organization",
    ),
    numericGate(
      "resources",
      faction.resources,
      REBELLION_PREREQUISITE_CONFIG.minimumFactionResources,
      "Faction resources",
    ),
    booleanGate(
      "localMobilization",
      qualifiedRegionIds.length > 0,
      "한 Region에서 radicalism·ideology organization·unrest가 함께 기준을 충족함.",
      "같은 Region에서 radicalism·ideology organization·unrest가 함께 기준을 충족하지 않음.",
    ),
    numericGate(
      "localRadicalism",
      maximumLocalRadicalism,
      REBELLION_PREREQUISITE_CONFIG.minimumLocalRadicalism,
      "지역 ideology radicalism",
    ),
    numericGate(
      "localIdeologyOrganization",
      maximumLocalIdeologyOrganization,
      REBELLION_PREREQUISITE_CONFIG.minimumLocalIdeologyOrganization,
      "지역 ideology organization",
    ),
    numericGate(
      "localUnrest",
      maximumLocalUnrest,
      REBELLION_PREREQUISITE_CONFIG.minimumLocalUnrest,
      "지역 unrest",
    ),
    numericGate(
      "geographicConcentration",
      geographicConcentration,
      REBELLION_PREREQUISITE_CONFIG.minimumGeographicConcentration,
      "지리적 집중도",
    ),
    numericGate(
      "stateWeakness",
      stateWeakness.stateWeakness,
      REBELLION_PREREQUISITE_CONFIG.minimumStateWeakness,
      "국가 약화",
    ),
  ];

  return {
    kind: "rebellion",
    factionId: faction.id,
    countryId: faction.countryId,
    affectedRegionIds: qualifiedRegionIds,
    capabilities: [...capabilities],
    stateWeakness,
    gates,
    regionalSignals,
    supportingSignals: {
      factionResources: faction.resources,
      currentStrategy: faction.currentStrategy,
      factionControlledRegionIds: regionalSignals
        .filter((signal) => signal.factionPresence)
        .map((signal) => signal.regionId),
      maximumAffinityWeightedSupport: Math.max(
        0,
        ...regionalSignals.map((signal) => signal.affinityWeightedSupport),
      ),
    },
    futureEvidence: UNIMPLEMENTED_FUTURE_EVIDENCE,
    geographicConcentration,
    qualifiedRegionIds,
    eligible: gates.every((gate) => gate.status === "pass"),
    reasons: deriveReasons(gates),
  };
}

function sortedFactions(world: WorldState): readonly Faction[] {
  return Object.values(world.factions).sort((first, second) =>
    compareStableText(first.id, second.id),
  );
}

/** Derive all scenario-declared coup candidates in canonical faction order. */
export function deriveCoupPrerequisites(
  scenario: ScenarioDefinition,
  world: WorldState,
): readonly CoupPrerequisiteSnapshot[] {
  return sortedFactions(world)
    .filter((faction) => capabilitiesFor(scenario, faction.id).includes("coup"))
    .map((faction) => deriveCoupSnapshot(scenario, world, faction));
}

/** Derive all scenario-declared rebellion candidates in canonical faction order. */
export function deriveRebellionPrerequisites(
  scenario: ScenarioDefinition,
  world: WorldState,
): readonly RebellionPrerequisiteSnapshot[] {
  return sortedFactions(world)
    .filter((faction) =>
      capabilitiesFor(scenario, faction.id).includes("rebellion"),
    )
    .map((faction) => deriveRebellionSnapshot(scenario, world, faction));
}

/** Derive both distinct political-crisis read models from one phase-start state. */
export function derivePoliticalCrisisPrerequisites(
  scenario: ScenarioDefinition,
  world: WorldState,
): PoliticalCrisisPrerequisiteSnapshots {
  return {
    coups: deriveCoupPrerequisites(scenario, world),
    rebellions: deriveRebellionPrerequisites(scenario, world),
  };
}
