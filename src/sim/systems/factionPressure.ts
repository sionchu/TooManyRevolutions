import { advanceSimDate } from "../core/clock";
import {
  shouldRunPoliticalUpdate,
  type PoliticalCadence,
} from "../core/politicalCadence";
import type {
  ActionProposal,
  FactionActionPayload,
  FactionActionType,
  ValidatedActionRecord,
} from "../state/action";
import {
  acceptActionProposal,
  decodeFactionAction,
  FACTION_ACTION_SCHEMA_VERSION,
  FACTION_ACTION_TYPES,
} from "../state/action";
import { createGameEvent, type GameEvent } from "../events/event";
import type { InstitutionalRuleState } from "../state/policy";
import type { Faction, FactionStrategy } from "../state/faction";
import type { CountryId, FactionId, IdeologyId, RegionId } from "../state/ids";
import type { Region } from "../state/region";
import type { ScenarioDefinition } from "../state/scenario";
import { getRegionFactionIds } from "../state/territorialControl";
import type {
  SimulationPhaseContext,
  SimulationPhaseHook,
  SimulationPhaseResult,
} from "../core/step";
import type { WorldState } from "../state/world";

/** T016 uses the same monthly political boundary selected by T015C. */
export const DEFAULT_FACTION_POLITICAL_CADENCE: PoliticalCadence = "monthly";

/** Small bounded thresholds for the explainable baseline heuristic. */
export const FACTION_HEURISTIC_THRESHOLDS = {
  lowGrievance: 0.2,
  bargainGrievance: 0.25,
  lobbyGrievance: 0.3,
  organizeGrievance: 0.5,
  fundGrievance: 0.65,
  minimumLobbyInfluence: 0.45,
  minimumOrganizingCapacity: 0.45,
  minimumFundResources: 0.5,
} as const;

/**
 * F04A provisional endogenous faction-state cadence. These rates define the
 * bounded monthly structure for Gate 1F validation; they are not production
 * balance locks. The writer always moves toward a target derived from current
 * authoritative state and never regenerates a field unconditionally.
 */
export const FACTION_DYNAMICS_CONFIG = {
  grievanceStep: 0.02,
  organizationStep: 0.02,
} as const;

export type FactionDynamicsConfig = {
  readonly grievanceStep?: number;
  readonly organizationStep?: number;
};

const FACTION_ACTION_ORDER: readonly FactionActionType[] = [
  ...FACTION_ACTION_TYPES,
];

const ACTION_TO_STRATEGY: Readonly<Record<FactionActionType, FactionStrategy>> =
  {
    LOBBY: "lobby",
    BARGAIN: "bargain",
    ORGANIZE: "organize",
    FUND_MOVEMENT: "fundMovement",
    ACCEPT: "accept",
    WAIT: "wait",
  };

interface FactionRegionSignal {
  readonly regionId: RegionId;
  readonly scarcity: number;
  readonly unrest: number;
  readonly stateControl: number;
}

export interface FactionRegionalObservation {
  readonly regionIds: readonly RegionId[];
  readonly signals: readonly FactionRegionSignal[];
  readonly averageScarcity: number;
  readonly averageUnrest: number;
  readonly averageStateControl: number;
  /** Weighted support from the faction's ideological affinities. */
  readonly affinityWeightedSupport: number;
  /** Weighted radicalism from the faction's ideological affinities. */
  readonly affinityWeightedRadicalism: number;
  /**
   * Region ideology organization is an independent regional signal. It is
   * deliberately never copied into Faction.organization.
   */
  readonly affinityWeightedIdeologyOrganization: number;
}

export interface FactionObservation {
  readonly factionId: FactionId;
  readonly countryId: CountryId;
  readonly faction: Pick<
    Faction,
    | "resources"
    | "organization"
    | "influence"
    | "grievance"
    | "ideologyAffinity"
    | "foreignLinks"
    | "currentStrategy"
  >;
  readonly country: {
    readonly treasury: number;
    readonly legitimacy: number;
    readonly stateCapacity: number;
    readonly instability: number;
  };
  readonly regional: FactionRegionalObservation;
  readonly institutionalRules: InstitutionalRuleState | null;
  readonly strongestForeignLink: number;
  readonly stateWeakness: number;
  readonly availableActions: Readonly<Record<FactionActionType, boolean>>;
}

export interface FactionActionProposal {
  readonly factionId: FactionId;
  readonly decisionTick: number;
  readonly actionType: FactionActionType;
  readonly payload: FactionActionPayload;
  readonly schemaVersion: typeof FACTION_ACTION_SCHEMA_VERSION;
}

export interface FactionPressureConfig {
  readonly cadence?: PoliticalCadence;
  readonly dynamics?: FactionDynamicsConfig;
}

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function resolveFactionDynamicsConfig(
  config: FactionDynamicsConfig = {},
): Required<FactionDynamicsConfig> {
  const grievanceStep =
    config.grievanceStep ?? FACTION_DYNAMICS_CONFIG.grievanceStep;
  const organizationStep =
    config.organizationStep ?? FACTION_DYNAMICS_CONFIG.organizationStep;

  if (
    !Number.isFinite(grievanceStep) ||
    grievanceStep <= 0 ||
    !Number.isFinite(organizationStep) ||
    organizationStep <= 0
  ) {
    throw new Error("Faction dynamics steps must be finite positive numbers.");
  }

  return { grievanceStep, organizationStep };
}

function moveTowardBoundedTarget(
  current: number,
  target: number,
  step: number,
): number {
  const boundedCurrent = clamp01(current);
  const boundedTarget = clamp01(target);
  const distance = boundedTarget - boundedCurrent;

  if (distance === 0) {
    return 0;
  }

  return Math.sign(distance) * Math.min(Math.abs(distance), step);
}

/** Shared projection-aware relevance rule for faction regional observations. */
export function isFactionRelevantToRegion(
  faction: Pick<Faction, "id" | "countryId">,
  region: Pick<Region, "ownerCountryId" | "id">,
  scenario?: ScenarioDefinition,
  world?: WorldState,
): boolean {
  if (region.ownerCountryId === faction.countryId) {
    return true;
  }

  return (
    scenario !== undefined &&
    world !== undefined &&
    getRegionFactionIds(scenario, world, region.id).includes(faction.id)
  );
}

function sortedFactions(world: WorldState): readonly Faction[] {
  return Object.values(world.factions).sort((first, second) =>
    compareStableText(first.id, second.id),
  );
}

function sortedRegions(
  world: WorldState,
  faction: Faction,
  scenario?: ScenarioDefinition,
): readonly Region[] {
  return Object.values(world.regions)
    .filter((region) =>
      isFactionRelevantToRegion(faction, region, scenario, world),
    )
    .sort((first, second) => compareStableText(first.id, second.id));
}

function populationWeight(region: Region): number {
  return region.population > 0 ? region.population : 1;
}

function deriveAffinityWeightedDimension(
  regions: readonly Region[],
  faction: Faction,
  dimension: "support" | "radicalism" | "organization",
): number {
  let numerator = 0;
  let denominator = 0;

  for (const region of regions) {
    const weight = populationWeight(region);
    const ideologyIds = Object.keys(faction.ideologyAffinity).sort(
      compareStableText,
    );

    for (const ideologyId of ideologyIds) {
      const affinity = faction.ideologyAffinity[ideologyId as IdeologyId] ?? 0;
      const ideologyState = region.ideology[ideologyId as IdeologyId];
      if (ideologyState === undefined || affinity <= 0) {
        continue;
      }

      numerator += ideologyState[dimension] * affinity * weight;
      denominator += affinity * weight;
    }
  }

  return denominator <= 0 ? 0 : clamp01(numerator / denominator);
}

function deriveRegionalObservation(
  regions: readonly Region[],
  faction: Faction,
): FactionRegionalObservation {
  const signals = regions.map<FactionRegionSignal>((region) => ({
    regionId: region.id,
    scarcity: region.scarcity,
    unrest: region.unrest,
    stateControl: region.stateControl,
  }));

  if (regions.length === 0) {
    return {
      regionIds: [],
      signals,
      averageScarcity: 0,
      averageUnrest: 0,
      averageStateControl: 0,
      affinityWeightedSupport: 0,
      affinityWeightedRadicalism: 0,
      affinityWeightedIdeologyOrganization: 0,
    };
  }

  let totalWeight = 0;
  let scarcity = 0;
  let unrest = 0;
  let stateControl = 0;

  for (const region of regions) {
    const weight = populationWeight(region);
    totalWeight += weight;
    scarcity += region.scarcity * weight;
    unrest += region.unrest * weight;
    stateControl += region.stateControl * weight;
  }

  return {
    regionIds: regions.map((region) => region.id),
    signals,
    averageScarcity: scarcity / totalWeight,
    averageUnrest: unrest / totalWeight,
    averageStateControl: stateControl / totalWeight,
    affinityWeightedSupport: deriveAffinityWeightedDimension(
      regions,
      faction,
      "support",
    ),
    affinityWeightedRadicalism: deriveAffinityWeightedDimension(
      regions,
      faction,
      "radicalism",
    ),
    affinityWeightedIdeologyOrganization: deriveAffinityWeightedDimension(
      regions,
      faction,
      "organization",
    ),
  };
}

function deriveStrongestForeignLink(faction: Faction): number {
  return Object.values(faction.foreignLinks).reduce(
    (strongest, value) => Math.max(strongest, value),
    0,
  );
}

function deriveAvailableActions(
  faction: Faction,
  institutionalRules: InstitutionalRuleState | null,
): Readonly<Record<FactionActionType, boolean>> {
  return {
    LOBBY:
      institutionalRules === null ||
      institutionalRules.pressFreedom !== "censored",
    BARGAIN: true,
    ORGANIZE:
      institutionalRules === null ||
      institutionalRules.laborOrganization !== "illegal",
    FUND_MOVEMENT:
      faction.resources >= FACTION_HEURISTIC_THRESHOLDS.minimumFundResources,
    ACCEPT: true,
    WAIT: true,
  };
}

function deriveStateWeakness(
  legitimacy: number,
  stateCapacity: number,
  instability: number,
): number {
  return clamp01(
    ((100 - legitimacy) / 100 +
      (100 - stateCapacity) / 100 +
      instability / 100) /
      3,
  );
}

/** Derive a compact, read-only observation from current mutable state. */
export function deriveFactionObservation(
  world: WorldState,
  factionId: FactionId,
  scenario?: ScenarioDefinition,
): FactionObservation {
  const faction = world.factions[factionId];
  if (faction === undefined) {
    throw new Error(`Faction ${factionId} does not exist in WorldState.`);
  }

  const country = world.countries[faction.countryId];
  if (country === undefined) {
    throw new Error(`Faction ${factionId} references a missing country.`);
  }

  const policyState = world.policies[faction.countryId];
  const institutionalRules = policyState?.institutionalRules ?? null;
  const regions = sortedRegions(world, faction, scenario);
  const regional = deriveRegionalObservation(regions, faction);

  return {
    factionId,
    countryId: faction.countryId,
    faction: {
      resources: faction.resources,
      organization: faction.organization,
      influence: faction.influence,
      grievance: faction.grievance,
      ideologyAffinity: { ...faction.ideologyAffinity },
      foreignLinks: { ...faction.foreignLinks },
      currentStrategy: faction.currentStrategy,
    },
    country: {
      treasury: country.treasury,
      legitimacy: country.legitimacy,
      stateCapacity: country.stateCapacity,
      instability: country.instability,
    },
    regional,
    institutionalRules,
    strongestForeignLink: deriveStrongestForeignLink(faction),
    stateWeakness: deriveStateWeakness(
      country.legitimacy,
      country.stateCapacity,
      country.instability,
    ),
    availableActions: deriveAvailableActions(faction, institutionalRules),
  };
}

export interface FactionDynamicsDrivers {
  readonly materialPressure: number;
  readonly localUnrest: number;
  readonly weakStateControl: number;
  readonly legitimacyWeakness: number;
  readonly stateCapacityWeakness: number;
  readonly nationalInstability: number;
  readonly factionResources: number;
  readonly factionInfluence: number;
  readonly localActivation: number;
}

/**
 * Compact, pure diagnostic projection for the F04A writer. It is deliberately
 * not stored in WorldState and contains no intervention identity or hidden
 * political score.
 */
export interface FactionDynamicsSnapshot {
  readonly factionId: FactionId;
  readonly regionIds: readonly RegionId[];
  readonly drivers: FactionDynamicsDrivers;
  readonly grievanceTarget: number;
  readonly organizationTarget: number;
  readonly grievanceDelta: number;
  readonly organizationDelta: number;
}

/** Derive one faction's endogenous monthly targets from current world state. */
export function deriveFactionDynamicsSnapshot(
  world: WorldState,
  factionId: FactionId,
  scenario?: ScenarioDefinition,
  config: FactionDynamicsConfig = {},
): FactionDynamicsSnapshot {
  const faction = world.factions[factionId];
  if (faction === undefined) {
    throw new Error(`Faction ${factionId} does not exist in WorldState.`);
  }

  const country = world.countries[faction.countryId];
  if (country === undefined) {
    throw new Error(`Faction ${factionId} references a missing country.`);
  }

  const resolvedConfig = resolveFactionDynamicsConfig(config);
  const regional = deriveRegionalObservation(
    sortedRegions(world, faction, scenario),
    faction,
  );
  const legitimacyWeakness = clamp01((100 - country.legitimacy) / 100);
  const stateCapacityWeakness = clamp01((100 - country.stateCapacity) / 100);
  const nationalInstability = clamp01(country.instability / 100);
  const weakStateControl = clamp01(1 - regional.averageStateControl);
  const materialPressure = clamp01(regional.averageScarcity);
  const localUnrest = clamp01(regional.averageUnrest);

  /*
   * Grievance uses the strongest current hostile condition. This preserves
   * the existing T017/T018 meaning of scarcity, unrest, weak administration,
   * and national weakness without inventing a weighted political score.
   */
  const grievanceTarget = Math.max(
    materialPressure,
    localUnrest,
    weakStateControl,
    legitimacyWeakness,
    stateCapacityWeakness,
    nationalInstability,
  );

  /*
   * Organization is capped by the faction's actual resources. Its sustaining
   * base can come from faction influence or from a relevant local political
   * signal. The latter reuses the same ideology radicalism / organization and
   * unrest inputs already consumed by T018/T021. A weak resource base cannot
   * regenerate organization on its own, and support/currentStrategy are
   * intentionally not used.
   */
  const localActivation = Math.max(
    clamp01(regional.affinityWeightedRadicalism),
    clamp01(regional.affinityWeightedIdeologyOrganization),
    localUnrest,
  );
  const factionResources = clamp01(faction.resources);
  const factionInfluence = clamp01(faction.influence);
  const organizationTarget = Math.min(
    factionResources,
    Math.max(factionInfluence, localActivation),
  );

  return {
    factionId,
    regionIds: regional.regionIds,
    drivers: {
      materialPressure,
      localUnrest,
      weakStateControl,
      legitimacyWeakness,
      stateCapacityWeakness,
      nationalInstability,
      factionResources,
      factionInfluence,
      localActivation,
    },
    grievanceTarget: clamp01(grievanceTarget),
    organizationTarget: clamp01(organizationTarget),
    grievanceDelta: moveTowardBoundedTarget(
      faction.grievance,
      grievanceTarget,
      resolvedConfig.grievanceStep,
    ),
    organizationDelta: moveTowardBoundedTarget(
      faction.organization,
      organizationTarget,
      resolvedConfig.organizationStep,
    ),
  };
}

/**
 * Select an intention with explicit rule ordering. No RNG, story state, or
 * future crisis scheduling participates in this decision.
 */
export function chooseFactionActionType(
  observation: FactionObservation,
): FactionActionType {
  const { faction, regional, availableActions } = observation;
  const thresholds = FACTION_HEURISTIC_THRESHOLDS;
  const regionalPressure = Math.max(
    regional.averageScarcity,
    regional.averageUnrest,
    observation.country.instability / 100,
  );
  const organizingCapacity = Math.max(
    faction.organization,
    regional.affinityWeightedIdeologyOrganization,
  );

  if (
    faction.grievance >= thresholds.fundGrievance &&
    faction.resources >= thresholds.minimumFundResources &&
    faction.organization >= thresholds.minimumOrganizingCapacity &&
    availableActions.FUND_MOVEMENT
  ) {
    return "FUND_MOVEMENT";
  }

  if (
    faction.grievance >= thresholds.organizeGrievance &&
    organizingCapacity >= thresholds.minimumOrganizingCapacity &&
    availableActions.ORGANIZE
  ) {
    return "ORGANIZE";
  }

  if (
    faction.grievance >= thresholds.lobbyGrievance &&
    faction.influence >= thresholds.minimumLobbyInfluence &&
    availableActions.LOBBY
  ) {
    return "LOBBY";
  }

  if (
    faction.grievance >= thresholds.bargainGrievance &&
    (faction.influence >= 0.2 ||
      faction.resources >= 0.2 ||
      observation.stateWeakness >= 0.5) &&
    availableActions.BARGAIN
  ) {
    return "BARGAIN";
  }

  if (
    faction.grievance <= thresholds.lowGrievance &&
    regionalPressure <= 0.25 &&
    availableActions.ACCEPT
  ) {
    return "ACCEPT";
  }

  return "WAIT";
}

/** Pure faction decision; the returned proposal does not mutate WorldState. */
export function chooseFactionActionProposal(
  world: WorldState,
  factionId: FactionId,
  decisionTick = world.tick + 1,
  scenario?: ScenarioDefinition,
): FactionActionProposal {
  if (!Number.isInteger(decisionTick) || decisionTick <= 0) {
    throw new Error("Faction decision tick must be a positive integer.");
  }

  const observation = deriveFactionObservation(world, factionId, scenario);
  const actionType = chooseFactionActionType(observation);

  return {
    factionId,
    decisionTick,
    actionType,
    payload: { factionId },
    schemaVersion: FACTION_ACTION_SCHEMA_VERSION,
  };
}

function isPoliticalBoundary(
  world: WorldState,
  nextTick: number,
  cadence: PoliticalCadence,
): boolean {
  return shouldRunPoliticalUpdate(
    nextTick,
    advanceSimDate(world.date),
    cadence,
  );
}

export interface FactionDynamicsApplication {
  readonly world: WorldState;
  readonly snapshots: readonly FactionDynamicsSnapshot[];
}

/**
 * Apply the bounded endogenous faction-state writer at the existing T016
 * political boundary. Every snapshot is derived from the same phase-start
 * world and factions are replaced in canonical FactionId order.
 */
export function applyFactionDynamics(
  world: WorldState,
  nextTick: number,
  cadence: PoliticalCadence = DEFAULT_FACTION_POLITICAL_CADENCE,
  scenario?: ScenarioDefinition,
  config: FactionDynamicsConfig = {},
): FactionDynamicsApplication {
  if (!isPoliticalBoundary(world, nextTick, cadence)) {
    return { world, snapshots: [] };
  }

  const snapshots = sortedFactions(world).map((faction) =>
    deriveFactionDynamicsSnapshot(world, faction.id, scenario, config),
  );
  let nextFactions: Record<FactionId, Faction> | null = null;

  for (const snapshot of snapshots) {
    const faction = world.factions[snapshot.factionId];
    if (faction === undefined) {
      throw new Error(
        `Faction ${snapshot.factionId} disappeared during dynamics derivation.`,
      );
    }

    const nextFaction: Faction = {
      ...faction,
      grievance: clamp01(faction.grievance + snapshot.grievanceDelta),
      organization: clamp01(faction.organization + snapshot.organizationDelta),
    };

    if (
      nextFaction.grievance === faction.grievance &&
      nextFaction.organization === faction.organization
    ) {
      continue;
    }

    if (nextFactions === null) {
      nextFactions = { ...world.factions };
    }
    nextFactions[faction.id] = nextFaction;
  }

  return {
    world: nextFactions === null ? world : { ...world, factions: nextFactions },
    snapshots,
  };
}

/** Stable faction-ID ordering for one political checkpoint. */
export function deriveFactionActionProposals(
  world: WorldState,
  nextTick = world.tick + 1,
  cadence: PoliticalCadence = DEFAULT_FACTION_POLITICAL_CADENCE,
  scenario?: ScenarioDefinition,
): readonly FactionActionProposal[] {
  if (!Number.isInteger(nextTick) || nextTick <= 0) {
    throw new Error(
      "Faction proposal generation requires a positive next tick.",
    );
  }

  if (!isPoliticalBoundary(world, nextTick, cadence)) {
    return [];
  }

  return sortedFactions(world).map((faction) =>
    chooseFactionActionProposal(world, faction.id, nextTick, scenario),
  );
}

/** Convert a faction proposal to the common intake shape for a target tick. */
export function toFactionActionProposal(
  proposal: FactionActionProposal,
  targetTick: number,
): ActionProposal {
  return {
    tick: targetTick,
    source: "heuristic",
    actionType: proposal.actionType,
    payload: { factionId: proposal.payload.factionId },
    schemaVersion: proposal.schemaVersion,
  };
}

/** Typed convenience wrapper around the shared ActionRecord intake. */
export function acceptFactionActionProposal(
  proposal: FactionActionProposal,
  targetTick: number,
  sequence: number,
): ValidatedActionRecord {
  return acceptActionProposal(
    toFactionActionProposal(proposal, targetTick),
    sequence,
  );
}

function strategyForActionType(actionType: FactionActionType): FactionStrategy {
  return ACTION_TO_STRATEGY[actionType];
}

function isFactionActionType(
  actionType: string,
): actionType is FactionActionType {
  return FACTION_ACTION_ACTION_TYPES_SET.has(actionType as FactionActionType);
}

const FACTION_ACTION_ACTION_TYPES_SET = new Set<FactionActionType>(
  FACTION_ACTION_ORDER,
);

function applyAcceptedFactionActions(context: SimulationPhaseContext): {
  readonly world: WorldState;
  readonly emittedEvents: readonly GameEvent[];
  readonly nextEventSequence: number;
} {
  let currentWorld = context.world;
  let nextEventSequence = context.nextEventSequence;
  const emittedEvents: GameEvent[] = [];

  for (const action of context.input.actions) {
    if (!isFactionActionType(action.actionType)) {
      continue;
    }

    const payload = decodeFactionAction(action);
    if (payload === null) {
      continue;
    }

    const faction = currentWorld.factions[payload.factionId];
    if (faction === undefined) {
      continue;
    }

    const nextStrategy = strategyForActionType(action.actionType);
    if (faction.currentStrategy === nextStrategy) {
      continue;
    }

    const event = createGameEvent({
      tick: context.nextTick,
      sequence: nextEventSequence,
      type: "FACTION_STRATEGY_CHANGED",
      actorId: faction.id,
      targetId: faction.countryId,
      causeIds: [],
      payload: {
        actionId: action.id,
        factionId: faction.id,
        actionType: action.actionType,
        previousStrategy: faction.currentStrategy,
        strategy: nextStrategy,
      },
      visibility: "world",
    });

    emittedEvents.push(event);
    nextEventSequence += 1;
    currentWorld = {
      ...currentWorld,
      factions: {
        ...currentWorld.factions,
        [faction.id]: {
          ...faction,
          currentStrategy: nextStrategy,
        },
      },
    };
  }

  return { world: currentWorld, emittedEvents, nextEventSequence };
}

/**
 * T016 phase boundary. It resolves already accepted faction actions, applies
 * the F04A bounded endogenous faction-state update at the same political
 * cadence, then emits new monthly heuristic proposals for the next intake
 * boundary. It does not create instability, ideology, conflict, or
 * foreign-support outcomes.
 */
export function runFactionPressurePhase(
  context: SimulationPhaseContext,
  config: FactionPressureConfig = {},
): SimulationPhaseResult {
  if (context.phase !== "factionPressure") {
    throw new Error("Faction pressure must run during factionPressure.");
  }

  const applied = applyAcceptedFactionActions(context);
  const cadence = config.cadence ?? DEFAULT_FACTION_POLITICAL_CADENCE;
  const dynamics = applyFactionDynamics(
    applied.world,
    context.nextTick,
    cadence,
    context.scenario,
    config.dynamics,
  );
  const factionProposals = deriveFactionActionProposals(
    dynamics.world,
    context.nextTick,
    cadence,
    context.scenario,
  );

  return {
    nextWorld: dynamics.world,
    emittedEvents: applied.emittedEvents,
    nextEventSequence: applied.nextEventSequence,
    actionProposals: factionProposals.map((proposal) =>
      toFactionActionProposal(proposal, context.nextTick + 1),
    ),
  };
}

/** Bind the deterministic faction phase to T010's existing hook boundary. */
export function createFactionPressurePhaseHook(
  config: FactionPressureConfig = {},
): SimulationPhaseHook {
  const capturedConfig: FactionPressureConfig = { ...config };
  return (context) => runFactionPressurePhase(context, capturedConfig);
}
