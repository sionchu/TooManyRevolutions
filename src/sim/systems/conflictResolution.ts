import {
  DAYS_PER_POLITICAL_WEEK,
  shouldRunPoliticalUpdate,
} from "../core/politicalCadence";
import { createGameEvent, type GameEvent } from "../events/event";
import type { Conflict, ConflictOutcome } from "../state/conflict";
import type {
  ConflictId,
  CountryId,
  FactionId,
  IdeologyId,
  LandHexId,
  RegionId,
} from "../state/ids";
import type { Faction } from "../state/faction";
import type { Region, TerritorialController } from "../state/region";
import type { ScenarioDefinition } from "../state/scenario";
import {
  assertLandHexRuntimeStateInvariants,
  changeLandHexController,
  getCountryControlledLandHexIds,
  getFactionControlledLandHexIds,
} from "../state/territorialControl";
import {
  getLandHex,
  getLandHexesForRegion,
  getPhysicalNeighborIds,
} from "../state/territorialTopology";
import type { WorldState } from "../state/world";

/** Initial T021 calibration values; these are not final war balance. */
export const CONFLICT_RESOLUTION_CONFIG = {
  cadence: "weekly" as const,
  advantageMargin: 5,
  factionResourceReference: 0.5,
  /** Minimum 0-100 continuity unit lost per unresolved full-displacement boundary. */
  unresolvedInternalRebellionContinuityLoss: 1,
} as const;

export interface ConflictFrontEdge {
  readonly conflictId: ConflictId;
  readonly firstLandHexId: LandHexId;
  readonly secondLandHexId: LandHexId;
  readonly firstRegionId: RegionId;
  readonly secondRegionId: RegionId;
  readonly firstController: TerritorialController;
  readonly secondController: TerritorialController;
}

export interface FactionOperationalSignals {
  readonly factionId: FactionId;
  readonly organization: number;
  readonly resources: number;
  readonly resourceSignal: number;
  readonly localMobilization: number;
  readonly operationalStrength: number;
  readonly affectedRegionIds: readonly RegionId[];
}

export interface ConflictParticipantStrength {
  readonly controller: TerritorialController;
  readonly strength: number;
  readonly source:
    | "country.militaryPower"
    | "country.militaryPowerWithStateControl"
    | "faction.operationalCapacity";
  readonly factionSignals?: FactionOperationalSignals;
}

export type TerritorialIntentReason =
  | "rebellionInitialSeizure"
  | "rebellionExpansion"
  | "governmentRecapture"
  | "governmentRecovery"
  | "civilWarAdvance"
  | "countryWarAdvance";

/** Derived proposal; never stored in WorldState. */
export interface TerritorialControlIntent {
  readonly conflictId: ConflictId;
  readonly actingController: TerritorialController;
  readonly opposingController: TerritorialController;
  readonly sourceHexId?: LandHexId;
  readonly targetHexId: LandHexId;
  readonly actingStrength: ConflictParticipantStrength;
  readonly opposingStrength: ConflictParticipantStrength;
  readonly reason: TerritorialIntentReason;
}

export interface ConflictResolutionBatchResult {
  readonly nextWorld: WorldState;
  readonly emittedEvents: readonly GameEvent[];
  readonly nextEventSequence: number;
  readonly phaseStartIntents: readonly TerritorialControlIntent[];
  readonly acceptedIntents: readonly TerritorialControlIntent[];
  readonly rejectedIntents: readonly TerritorialControlIntent[];
}

export interface ConflictOutcomeApplicationInput {
  readonly conflictId: ConflictId;
  readonly outcome: ConflictOutcome;
  readonly tick?: number;
  readonly causeIds?: readonly GameEvent["id"][];
  readonly knownCauseIds?: readonly GameEvent["id"][];
}

export interface ConflictOutcomeApplicationResult {
  readonly nextWorld: WorldState;
  readonly emittedEvents: readonly GameEvent[];
  readonly nextEventSequence: number;
}

/**
 * Apply the existing stateContinuity consequence of an unresolved internal
 * rebellion only after territorial resolution has had an opportunity to
 * restore a Hex. The caller owns the weekly cadence boundary.
 *
 * This is not an occupation/annexation shortcut: foreign control, coups, and
 * a rebellion without physical faction control are insufficient. T023 remains
 * the sole terminal-defeat writer and evaluates the resulting continuity value.
 */
export function applyUnresolvedInternalRebellionContinuityPressure(
  scenario: ScenarioDefinition,
  world: WorldState,
): WorldState {
  const countryId = scenario.playerCountryId;
  if (countryId === null || world.run.outcome.status !== "active") {
    return world;
  }

  const country = world.countries[countryId];
  if (
    country === undefined ||
    getCountryControlledLandHexIds(scenario, world, countryId).length > 0
  ) {
    return world;
  }

  const activeInternalRebellionFactionIds = new Set<FactionId>();
  for (const conflict of Object.values(world.conflicts)) {
    if (
      conflict.kind !== "rebellion" ||
      conflict.status !== "active" ||
      !conflict.participantCountryIds.includes(countryId)
    ) {
      continue;
    }

    for (const factionId of conflict.participantFactionIds) {
      if (world.factions[factionId]?.countryId === countryId) {
        activeInternalRebellionFactionIds.add(factionId);
      }
    }
  }

  const hasPhysicalRebellionControl = [
    ...activeInternalRebellionFactionIds,
  ].some(
    (factionId) =>
      getFactionControlledLandHexIds(scenario, world, factionId).length > 0,
  );
  if (!hasPhysicalRebellionControl) {
    return world;
  }

  const stateContinuity = Math.max(
    0,
    country.stateContinuity -
      CONFLICT_RESOLUTION_CONFIG.unresolvedInternalRebellionContinuityLoss,
  );
  if (stateContinuity === country.stateContinuity) {
    return world;
  }

  return {
    ...world,
    countries: {
      ...world.countries,
      [countryId]: { ...country, stateContinuity },
    },
  };
}

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
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

function controllerKey(controller: TerritorialController): string {
  switch (controller.kind) {
    case "country":
      return `country:${controller.countryId}`;
    case "faction":
      return `faction:${controller.factionId}`;
    case "uncontrolled":
      return "uncontrolled";
  }
}

function controllersEqual(
  first: TerritorialController,
  second: TerritorialController,
): boolean {
  return controllerKey(first) === controllerKey(second);
}

function isArmedConflict(conflict: Conflict): boolean {
  return (
    conflict.status === "active" &&
    (conflict.kind === "rebellion" ||
      conflict.kind === "civilWar" ||
      conflict.kind === "war")
  );
}

function getConflict(world: WorldState, conflictId: ConflictId): Conflict {
  const conflict = world.conflicts[conflictId];
  if (conflict === undefined) {
    throw new Error(`Conflict ${conflictId} does not exist in WorldState.`);
  }

  return conflict;
}

function isParticipantController(
  conflict: Conflict,
  controller: TerritorialController,
): boolean {
  switch (controller.kind) {
    case "country":
      return conflict.participantCountryIds.includes(controller.countryId);
    case "faction":
      return conflict.participantFactionIds.includes(controller.factionId);
    case "uncontrolled":
      return false;
  }
}

function sortedLandHexIds(world: WorldState): readonly LandHexId[] {
  return Object.keys(world.landHexStates)
    .map((landHexId) => landHexId as LandHexId)
    .sort(compareStableText);
}

function createFrontEdge(
  conflict: Conflict,
  firstLandHexId: LandHexId,
  secondLandHexId: LandHexId,
  scenario: ScenarioDefinition,
  world: WorldState,
): ConflictFrontEdge {
  const firstLandHex = getLandHex(scenario, firstLandHexId);
  const secondLandHex = getLandHex(scenario, secondLandHexId);
  const firstController = cloneController(
    world.landHexStates[firstLandHexId]!.controller,
  );
  const secondController = cloneController(
    world.landHexStates[secondLandHexId]!.controller,
  );

  return {
    conflictId: conflict.id,
    firstLandHexId,
    secondLandHexId,
    firstRegionId: firstLandHex.regionId,
    secondRegionId: secondLandHex.regionId,
    firstController,
    secondController,
  };
}

/**
 * Derive active front edges from current LandHex controllers. Peaceful borders
 * are deliberately absent because a Conflict record is required.
 */
export function deriveConflictFrontEdges(
  scenario: ScenarioDefinition,
  world: WorldState,
  conflictId: ConflictId,
): readonly ConflictFrontEdge[] {
  const conflict = getConflict(world, conflictId);
  if (!isArmedConflict(conflict)) {
    return [];
  }

  assertLandHexRuntimeStateInvariants(scenario, world);
  const edges: ConflictFrontEdge[] = [];

  for (const firstLandHexId of sortedLandHexIds(world)) {
    for (const secondLandHexId of getPhysicalNeighborIds(
      scenario,
      firstLandHexId,
    )) {
      if (compareStableText(firstLandHexId, secondLandHexId) >= 0) {
        continue;
      }

      const firstController = world.landHexStates[firstLandHexId]!.controller;
      const secondController = world.landHexStates[secondLandHexId]!.controller;
      if (
        controllersEqual(firstController, secondController) ||
        !isParticipantController(conflict, firstController) ||
        !isParticipantController(conflict, secondController)
      ) {
        continue;
      }

      edges.push(
        createFrontEdge(
          conflict,
          firstLandHexId,
          secondLandHexId,
          scenario,
          world,
        ),
      );
    }
  }

  return edges.sort((first, second) => {
    const firstOrder = compareStableText(
      first.firstLandHexId,
      second.firstLandHexId,
    );
    return firstOrder !== 0
      ? firstOrder
      : compareStableText(first.secondLandHexId, second.secondLandHexId);
  });
}

/** Derive all active-conflict fronts in canonical ConflictId/Hex order. */
export function deriveActiveConflictFrontEdges(
  scenario: ScenarioDefinition,
  world: WorldState,
): readonly ConflictFrontEdge[] {
  return Object.values(world.conflicts)
    .filter(isArmedConflict)
    .sort((first, second) => compareStableText(first.id, second.id))
    .flatMap((conflict) =>
      deriveConflictFrontEdges(scenario, world, conflict.id),
    );
}

function deriveFactionPoliticalMobilization(
  faction: Pick<Faction, "ideologyAffinity">,
  region: Pick<Region, "ideology" | "unrest">,
): number {
  let totalAffinity = 0;
  let radicalism = 0;
  let organization = 0;

  for (const [ideologyId, affinity] of Object.entries(
    faction.ideologyAffinity,
  ).sort(([first], [second]) => compareStableText(first, second))) {
    if (affinity <= 0) {
      continue;
    }

    const ideologyState = region.ideology[ideologyId as IdeologyId];
    if (ideologyState === undefined) {
      continue;
    }

    totalAffinity += affinity;
    radicalism += ideologyState.radicalism * affinity;
    organization += ideologyState.organization * affinity;
  }

  if (totalAffinity === 0) {
    return 0;
  }

  return Math.min(
    clamp01(radicalism / totalAffinity),
    clamp01(organization / totalAffinity),
    clamp01(region.unrest),
  );
}

function deriveFactionSignals(
  world: WorldState,
  conflict: Conflict,
  factionId: FactionId,
): FactionOperationalSignals | null {
  const faction = world.factions[factionId];
  if (faction === undefined) {
    return null;
  }

  const affectedRegionIdSet = new Set(conflict.affectedRegionIds ?? []);
  const regions = Object.values(world.regions)
    .filter((region) =>
      affectedRegionIdSet.size > 0
        ? affectedRegionIdSet.has(region.id)
        : region.ownerCountryId === faction.countryId,
    )
    .sort((first, second) => compareStableText(first.id, second.id));
  const localMobilization = regions.reduce(
    (maximum, region) =>
      Math.max(maximum, deriveFactionPoliticalMobilization(faction, region)),
    0,
  );
  const resourceSignal =
    faction.resources /
    (faction.resources + CONFLICT_RESOLUTION_CONFIG.factionResourceReference);
  const operationalStrength =
    100 *
    Math.min(
      clamp01(faction.organization),
      clamp01(resourceSignal),
      clamp01(localMobilization),
    );

  return {
    factionId,
    organization: faction.organization,
    resources: faction.resources,
    resourceSignal: clamp01(resourceSignal),
    localMobilization,
    operationalStrength,
    affectedRegionIds: regions.map((region) => region.id),
  };
}

function deriveParticipantStrength(
  world: WorldState,
  conflict: Conflict,
  controller: TerritorialController,
): ConflictParticipantStrength | null {
  switch (controller.kind) {
    case "country": {
      const country = world.countries[controller.countryId];
      return country === undefined
        ? null
        : {
            controller: cloneController(controller),
            strength: country.militaryPower,
            source: "country.militaryPower",
          };
    }
    case "faction": {
      const signals = deriveFactionSignals(
        world,
        conflict,
        controller.factionId,
      );
      return signals === null
        ? null
        : {
            controller: cloneController(controller),
            strength: signals.operationalStrength,
            source: "faction.operationalCapacity",
            factionSignals: signals,
          };
    }
    case "uncontrolled":
      return null;
  }
}

function hasMeaningfulAdvantage(
  stronger: ConflictParticipantStrength,
  weaker: ConflictParticipantStrength,
): boolean {
  return (
    stronger.strength >=
    weaker.strength + CONFLICT_RESOLUTION_CONFIG.advantageMargin
  );
}

function orderIntentCandidates(
  candidates: readonly TerritorialControlIntent[],
): readonly TerritorialControlIntent[] {
  return [...candidates].sort((first, second) => {
    const targetOrder = compareStableText(
      first.targetHexId,
      second.targetHexId,
    );
    if (targetOrder !== 0) {
      return targetOrder;
    }

    const conflictOrder = compareStableText(
      first.conflictId,
      second.conflictId,
    );
    if (conflictOrder !== 0) {
      return conflictOrder;
    }

    return compareStableText(first.sourceHexId ?? "", second.sourceHexId ?? "");
  });
}

function deriveFrontIntent(
  conflict: Conflict,
  edges: readonly ConflictFrontEdge[],
  stronger: ConflictParticipantStrength,
  weaker: ConflictParticipantStrength,
  reason: TerritorialIntentReason,
): TerritorialControlIntent | null {
  const candidates: TerritorialControlIntent[] = [];

  for (const edge of edges) {
    const strongerIsFirst = controllersEqual(
      edge.firstController,
      stronger.controller,
    );
    const weakerIsFirst = controllersEqual(
      edge.firstController,
      weaker.controller,
    );

    if (
      strongerIsFirst &&
      controllersEqual(edge.secondController, weaker.controller)
    ) {
      candidates.push({
        conflictId: conflict.id,
        actingController: cloneController(stronger.controller),
        opposingController: cloneController(weaker.controller),
        sourceHexId: edge.firstLandHexId,
        targetHexId: edge.secondLandHexId,
        actingStrength: stronger,
        opposingStrength: weaker,
        reason,
      });
    } else if (
      weakerIsFirst &&
      controllersEqual(edge.secondController, stronger.controller)
    ) {
      candidates.push({
        conflictId: conflict.id,
        actingController: cloneController(stronger.controller),
        opposingController: cloneController(weaker.controller),
        sourceHexId: edge.secondLandHexId,
        targetHexId: edge.firstLandHexId,
        actingStrength: stronger,
        opposingStrength: weaker,
        reason,
      });
    }
  }

  return orderIntentCandidates(candidates)[0] ?? null;
}

function hasValidCurrentGovernment(
  world: WorldState,
  countryId: CountryId,
): boolean {
  const country = world.countries[countryId];
  if (country === undefined || country.currentGovernmentId === null) {
    return false;
  }

  const government = world.governments[country.currentGovernmentId];
  return government?.countryId === countryId;
}

/**
 * Derive the bounded zero-territory government recovery intent used only by
 * an active internal rebellion. StateControl is residual administrative
 * penetration, not a physical controller and never grants a free Hex.
 */
function deriveZeroTerritoryGovernmentRecoveryIntent(
  scenario: ScenarioDefinition,
  world: WorldState,
  conflict: Conflict,
  factionStrength: ConflictParticipantStrength,
  countryId: CountryId,
): TerritorialControlIntent | null {
  if (
    conflict.kind !== "rebellion" ||
    conflict.status !== "active" ||
    factionStrength.controller.kind !== "faction" ||
    world.run.outcome.status !== "active" ||
    !hasValidCurrentGovernment(world, countryId)
  ) {
    return null;
  }

  const faction = world.factions[factionStrength.controller.factionId];
  if (faction === undefined || faction.countryId !== countryId) {
    return null;
  }

  const affectedRegionIds = new Set(conflict.affectedRegionIds ?? []);
  if (affectedRegionIds.size === 0) {
    return null;
  }

  const candidateRegions = Object.values(world.regions)
    .filter(
      (region) =>
        affectedRegionIds.has(region.id) &&
        region.ownerCountryId === countryId &&
        region.stateControl > 0,
    )
    .sort(
      (first, second) =>
        second.stateControl - first.stateControl ||
        compareStableText(first.id, second.id),
    );

  for (const region of candidateRegions) {
    const governmentStrength: ConflictParticipantStrength = {
      controller: { kind: "country", countryId },
      strength: countryMilitaryPowerWithStateControl(world, countryId, region),
      source: "country.militaryPowerWithStateControl",
    };

    if (!hasMeaningfulAdvantage(governmentStrength, factionStrength)) {
      continue;
    }

    const targetHex = getLandHexesForRegion(scenario, region.id)
      .slice()
      .sort((first, second) => compareStableText(first.id, second.id))
      .find((landHex) => {
        const controller = world.landHexStates[landHex.id]?.controller;
        return (
          controller?.kind === "faction" && controller.factionId === faction.id
        );
      });

    if (targetHex === undefined) {
      continue;
    }

    return {
      conflictId: conflict.id,
      actingController: { kind: "country", countryId },
      opposingController: { kind: "faction", factionId: faction.id },
      targetHexId: targetHex.id,
      actingStrength: governmentStrength,
      opposingStrength: factionStrength,
      reason: "governmentRecovery",
    };
  }

  return null;
}

function countryMilitaryPowerWithStateControl(
  world: WorldState,
  countryId: CountryId,
  region: Pick<Region, "stateControl">,
): number {
  const country = world.countries[countryId];
  if (country === undefined) {
    return 0;
  }

  return country.militaryPower * clamp01(region.stateControl);
}

function deriveInitialRebellionIntent(
  scenario: ScenarioDefinition,
  world: WorldState,
  conflict: Conflict,
  factionStrength: ConflictParticipantStrength,
  countryStrength: ConflictParticipantStrength,
): TerritorialControlIntent | null {
  if (
    factionStrength.controller.kind !== "faction" ||
    countryStrength.controller.kind !== "country"
  ) {
    return null;
  }

  const faction = world.factions[factionStrength.controller.factionId];
  if (faction === undefined) {
    return null;
  }

  const affectedRegionIds = [...(conflict.affectedRegionIds ?? [])];
  const rankedRegions = affectedRegionIds
    .map((regionId) => {
      const region = world.regions[regionId];
      if (region === undefined) {
        return null;
      }

      const localMobilization = deriveFactionPoliticalMobilization(
        faction,
        region,
      );
      return { regionId, localMobilization, unrest: region.unrest };
    })
    .filter(
      (
        value,
      ): value is {
        readonly regionId: RegionId;
        readonly localMobilization: number;
        readonly unrest: number;
      } => value !== null,
    )
    .sort((first, second) => {
      if (first.localMobilization !== second.localMobilization) {
        return second.localMobilization - first.localMobilization;
      }

      if (first.unrest !== second.unrest) {
        return second.unrest - first.unrest;
      }

      return compareStableText(first.regionId, second.regionId);
    });

  for (const { regionId } of rankedRegions) {
    for (const landHex of getLandHexesForRegion(scenario, regionId)) {
      const controller = world.landHexStates[landHex.id]?.controller;
      if (
        controller?.kind === "country" &&
        controller.countryId === countryStrength.controller.countryId
      ) {
        return {
          conflictId: conflict.id,
          actingController: cloneController(factionStrength.controller),
          opposingController: cloneController(countryStrength.controller),
          targetHexId: landHex.id,
          actingStrength: factionStrength,
          opposingStrength: countryStrength,
          reason: "rebellionInitialSeizure",
        };
      }
    }
  }

  return null;
}

function deriveRebellionIntent(
  scenario: ScenarioDefinition,
  world: WorldState,
  conflict: Conflict,
): TerritorialControlIntent | null {
  const countryId = conflict.participantCountryIds[0];
  const factionId = conflict.participantFactionIds[0];
  if (countryId === undefined || factionId === undefined) {
    return null;
  }

  const faction = world.factions[factionId];
  if (faction === undefined || faction.countryId !== countryId) {
    return null;
  }

  const factionController: TerritorialController = {
    kind: "faction",
    factionId,
  };
  const countryController: TerritorialController = {
    kind: "country",
    countryId,
  };
  const factionStrength = deriveParticipantStrength(
    world,
    conflict,
    factionController,
  );
  const countryStrength = deriveParticipantStrength(
    world,
    conflict,
    countryController,
  );
  if (factionStrength === null || countryStrength === null) {
    return null;
  }

  const factionLandHexes = getFactionControlledLandHexIds(
    scenario,
    world,
    factionId,
  );
  if (hasMeaningfulAdvantage(factionStrength, countryStrength)) {
    if (factionLandHexes.length === 0) {
      return deriveInitialRebellionIntent(
        scenario,
        world,
        conflict,
        factionStrength,
        countryStrength,
      );
    }

    return deriveFrontIntent(
      conflict,
      deriveConflictFrontEdges(scenario, world, conflict.id),
      factionStrength,
      countryStrength,
      "rebellionExpansion",
    );
  }

  if (hasMeaningfulAdvantage(countryStrength, factionStrength)) {
    const countryLandHexes = getCountryControlledLandHexIds(
      scenario,
      world,
      countryId,
    );
    if (countryLandHexes.length === 0) {
      return deriveZeroTerritoryGovernmentRecoveryIntent(
        scenario,
        world,
        conflict,
        factionStrength,
        countryId,
      );
    }

    if (factionLandHexes.length === 0) {
      return null;
    }

    return deriveFrontIntent(
      conflict,
      deriveConflictFrontEdges(scenario, world, conflict.id),
      countryStrength,
      factionStrength,
      "governmentRecapture",
    );
  }

  return null;
}

function deriveCivilWarIntent(
  scenario: ScenarioDefinition,
  world: WorldState,
  conflict: Conflict,
): TerritorialControlIntent | null {
  const factionIds = [...new Set(conflict.participantFactionIds)].sort(
    compareStableText,
  );
  if (factionIds.length !== 2) {
    return null;
  }

  const strengths = factionIds
    .map((factionId) =>
      deriveParticipantStrength(world, conflict, {
        kind: "faction",
        factionId,
      }),
    )
    .filter((value): value is ConflictParticipantStrength => value !== null);
  if (strengths.length !== 2) {
    return null;
  }

  const [first, second] = strengths;
  const stronger = first.strength >= second.strength ? first : second;
  const weaker = stronger === first ? second : first;
  if (!hasMeaningfulAdvantage(stronger, weaker)) {
    return null;
  }

  return deriveFrontIntent(
    conflict,
    deriveConflictFrontEdges(scenario, world, conflict.id),
    stronger,
    weaker,
    "civilWarAdvance",
  );
}

function deriveCountryWarIntent(
  scenario: ScenarioDefinition,
  world: WorldState,
  conflict: Conflict,
): TerritorialControlIntent | null {
  const countryIds = [...new Set(conflict.participantCountryIds)].sort(
    compareStableText,
  );
  if (countryIds.length !== 2) {
    return null;
  }

  const strengths = countryIds
    .map((countryId) =>
      deriveParticipantStrength(world, conflict, {
        kind: "country",
        countryId,
      }),
    )
    .filter((value): value is ConflictParticipantStrength => value !== null);
  if (strengths.length !== 2) {
    return null;
  }

  const [first, second] = strengths;
  const stronger = first.strength >= second.strength ? first : second;
  const weaker = stronger === first ? second : first;
  if (!hasMeaningfulAdvantage(stronger, weaker)) {
    return null;
  }

  return deriveFrontIntent(
    conflict,
    deriveConflictFrontEdges(scenario, world, conflict.id),
    stronger,
    weaker,
    "countryWarAdvance",
  );
}

function deriveOneConflictIntent(
  scenario: ScenarioDefinition,
  world: WorldState,
  conflict: Conflict,
): TerritorialControlIntent | null {
  switch (conflict.kind) {
    case "rebellion":
      return deriveRebellionIntent(scenario, world, conflict);
    case "civilWar":
      return deriveCivilWarIntent(scenario, world, conflict);
    case "war":
      return deriveCountryWarIntent(scenario, world, conflict);
    case "coup":
      return null;
  }
}

/** Derive at most one phase-start territorial intent per active armed Conflict. */
export function deriveConflictIntents(
  scenario: ScenarioDefinition,
  world: WorldState,
): readonly TerritorialControlIntent[] {
  return Object.values(world.conflicts)
    .filter(isArmedConflict)
    .sort((first, second) => compareStableText(first.id, second.id))
    .map((conflict) => deriveOneConflictIntent(scenario, world, conflict))
    .filter((intent): intent is TerritorialControlIntent => intent !== null);
}

function createConflictResolvedEvent(
  conflict: Conflict,
  tick: number,
  sequence: number,
  causeIds: readonly GameEvent["id"][],
  reason = "rebellionPrerequisitesNoLongerEligible",
): GameEvent {
  return createGameEvent({
    tick,
    sequence,
    type: "CONFLICT_RESOLVED",
    actorId: conflict.participantCountryIds[0],
    targetId: conflict.id,
    causeIds: [...causeIds],
    payload: {
      conflictId: conflict.id,
      kind: conflict.kind,
      outcome: "statusQuo",
      reason,
    },
    visibility: "important",
  });
}

/**
 * Resolve an eligible no-territory rebellion suppression before deriving
 * territorial intents. Existing political conditions keep the conflict active.
 */
export function suppressIneligibleRebellions(
  scenario: ScenarioDefinition,
  world: WorldState,
  nextTick: number,
  nextEventSequence: number,
  rebellionPrerequisites: readonly {
    readonly factionId: FactionId;
    readonly countryId: CountryId;
    readonly eligible: boolean;
  }[],
): {
  readonly nextWorld: WorldState;
  readonly emittedEvents: readonly GameEvent[];
  readonly nextEventSequence: number;
} {
  let nextWorld = world;
  let sequence = nextEventSequence;
  const emittedEvents: GameEvent[] = [];

  const candidates = Object.values(world.conflicts)
    .filter(
      (conflict) =>
        conflict.status === "active" && conflict.kind === "rebellion",
    )
    .sort((first, second) => compareStableText(first.id, second.id));

  for (const conflict of candidates) {
    const factionId = conflict.participantFactionIds[0];
    const countryId = conflict.participantCountryIds[0];
    if (factionId === undefined || countryId === undefined) {
      continue;
    }

    const prerequisite = rebellionPrerequisites.find(
      (snapshot) =>
        snapshot.factionId === factionId && snapshot.countryId === countryId,
    );
    if (prerequisite === undefined || prerequisite.eligible) {
      continue;
    }

    if (getFactionControlledLandHexIds(scenario, world, factionId).length > 0) {
      continue;
    }

    const resolvedConflict: Conflict = {
      ...conflict,
      status: "resolved",
      resolvedAtTick: nextTick,
      outcome: {
        kind: "statusQuo",
        winner: { kind: "country", countryId },
      },
    };
    nextWorld = {
      ...nextWorld,
      conflicts: {
        ...nextWorld.conflicts,
        [conflict.id]: resolvedConflict,
      },
      run: {
        ...nextWorld.run,
        nextEventSequence: sequence + 1,
      },
    };

    const event = createConflictResolvedEvent(conflict, nextTick, sequence, []);
    emittedEvents.push(event);
    sequence += 1;
  }

  if (emittedEvents.length === 0) {
    return {
      nextWorld: world,
      emittedEvents,
      nextEventSequence,
    };
  }

  return { nextWorld, emittedEvents, nextEventSequence: sequence };
}

function collisionAcceptedIntents(
  phaseStartWorld: WorldState,
  currentWorld: WorldState,
  intents: readonly TerritorialControlIntent[],
): {
  readonly accepted: readonly TerritorialControlIntent[];
  readonly rejected: readonly TerritorialControlIntent[];
} {
  const reservedTargets = new Set<LandHexId>();
  const accepted: TerritorialControlIntent[] = [];
  const rejected: TerritorialControlIntent[] = [];

  for (const intent of [...intents].sort((first, second) =>
    compareStableText(first.conflictId, second.conflictId),
  )) {
    if (currentWorld.conflicts[intent.conflictId]?.status !== "active") {
      rejected.push(intent);
      continue;
    }

    if (reservedTargets.has(intent.targetHexId)) {
      rejected.push(intent);
      continue;
    }

    const phaseStartController =
      phaseStartWorld.landHexStates[intent.targetHexId]?.controller;
    if (
      phaseStartController === undefined ||
      !controllersEqual(phaseStartController, intent.opposingController)
    ) {
      rejected.push(intent);
      continue;
    }

    reservedTargets.add(intent.targetHexId);
    accepted.push(intent);
  }

  return { accepted, rejected };
}

/**
 * Apply accepted phase-start intents in stable target order. The mutation seam
 * receives the current event buffer's known IDs and the next WorldState so no
 * cause/event sequence is guessed between multiple LandHex changes.
 */
export function resolveTerritorialConflictIntents(
  scenario: ScenarioDefinition,
  phaseStartWorld: WorldState,
  currentWorld: WorldState,
  intents: readonly TerritorialControlIntent[],
  nextTick: number,
  nextEventSequence: number,
  knownEventIds: readonly GameEvent["id"][] = [],
): ConflictResolutionBatchResult {
  const collision = collisionAcceptedIntents(
    phaseStartWorld,
    currentWorld,
    intents,
  );
  const acceptedIntents = orderIntentCandidates(collision.accepted);
  let nextWorld = currentWorld;
  let sequence = nextEventSequence;
  const emittedEvents: GameEvent[] = [];
  const knownCauseIds = new Set<GameEvent["id"]>(knownEventIds);
  const appliedIntents: TerritorialControlIntent[] = [];

  for (const intent of acceptedIntents) {
    const targetController =
      nextWorld.landHexStates[intent.targetHexId]?.controller;
    if (
      targetController === undefined ||
      !controllersEqual(targetController, intent.opposingController)
    ) {
      continue;
    }

    const change = changeLandHexController(scenario, nextWorld, {
      landHexId: intent.targetHexId,
      nextController: intent.actingController,
      tick: nextTick,
      causeIds: [],
      knownCauseIds: [...knownCauseIds],
      conflictId: intent.conflictId,
    });
    nextWorld = change.nextWorld;
    sequence = change.nextEventSequence;
    for (const event of change.emittedEvents) {
      emittedEvents.push(event);
      knownCauseIds.add(event.id);
    }
    if (change.emittedEvents.length > 0) {
      appliedIntents.push(intent);
    }
  }

  return {
    nextWorld,
    emittedEvents,
    nextEventSequence: sequence,
    phaseStartIntents: intents,
    acceptedIntents: appliedIntents,
    rejectedIntents: collision.rejected,
  };
}

function validateCauseIds(
  causeIds: readonly GameEvent["id"][],
  knownCauseIds: readonly GameEvent["id"][],
): void {
  const known = new Set(knownCauseIds);
  for (const causeId of causeIds) {
    if (!known.has(causeId)) {
      throw new Error(
        `Conflict outcome references a cause event that is not already known: ${causeId}.`,
      );
    }
  }
}

function createOutcomeEvent(
  conflict: Conflict,
  outcome: ConflictOutcome,
  tick: number,
  sequence: number,
  causeIds: readonly GameEvent["id"][],
): GameEvent {
  if (outcome.kind === "governmentTransition") {
    return createGameEvent({
      tick,
      sequence,
      type: "GOVERNMENT_TRANSITIONED",
      actorId: conflict.id,
      targetId: outcome.countryId,
      causeIds: [...causeIds],
      payload: {
        conflictId: conflict.id,
        countryId: outcome.countryId,
        previousGovernmentId: outcome.previousGovernmentId,
        nextGovernmentId: outcome.nextGovernmentId,
        winner: outcome.winner,
      },
      visibility: "important",
    });
  }

  return createConflictResolvedEvent(
    conflict,
    tick,
    sequence,
    causeIds,
    "explicitStatusQuo",
  );
}

/** Apply an explicitly supplied typed outcome without creating a new Government. */
export function applyConflictOutcome(
  world: WorldState,
  input: ConflictOutcomeApplicationInput,
): ConflictOutcomeApplicationResult {
  const conflict = getConflict(world, input.conflictId);
  if (conflict.status !== "active") {
    throw new Error(`Conflict ${conflict.id} is not active.`);
  }

  if (input.outcome.kind === "stateDissolved") {
    throw new Error("State dissolution is owned by T023, not T021.");
  }

  const tick = input.tick ?? world.tick;
  if (!Number.isInteger(tick) || tick < world.tick) {
    throw new Error("Conflict outcome tick must be at or after world.tick.");
  }
  const causeIds = [...(input.causeIds ?? [])];
  validateCauseIds(causeIds, input.knownCauseIds ?? []);

  let nextWorld = world;
  if (input.outcome.kind === "governmentTransition") {
    const country = world.countries[input.outcome.countryId];
    const nextGovernment = world.governments[input.outcome.nextGovernmentId];
    if (country === undefined) {
      throw new Error(
        `Government transition references missing country ${input.outcome.countryId}.`,
      );
    }
    if (
      !conflict.participantCountryIds.includes(input.outcome.countryId) ||
      country.currentGovernmentId !== input.outcome.previousGovernmentId
    ) {
      throw new Error(
        `Government transition does not match the current conflict continuity state.`,
      );
    }
    if (
      nextGovernment === undefined ||
      nextGovernment.countryId !== input.outcome.countryId ||
      nextGovernment.id === country.currentGovernmentId
    ) {
      throw new Error(
        `Government transition target must be an existing different government of the same country.`,
      );
    }

    const governments = { ...world.governments };
    if (country.currentGovernmentId !== null) {
      const previousGovernment = governments[country.currentGovernmentId];
      if (previousGovernment !== undefined) {
        governments[country.currentGovernmentId] = {
          ...previousGovernment,
          authority: "contender",
        };
      }
    }
    governments[nextGovernment.id] = {
      ...nextGovernment,
      authority: "central",
    };
    nextWorld = {
      ...world,
      countries: {
        ...world.countries,
        [country.id]: {
          ...country,
          currentGovernmentId: nextGovernment.id,
        },
      },
      governments,
    };
  }

  const resolvedConflict: Conflict = {
    ...conflict,
    status: "resolved",
    resolvedAtTick: tick,
    outcome: input.outcome,
  };
  const event = createOutcomeEvent(
    conflict,
    input.outcome,
    tick,
    world.run.nextEventSequence,
    causeIds,
  );

  nextWorld = {
    ...nextWorld,
    conflicts: {
      ...nextWorld.conflicts,
      [conflict.id]: resolvedConflict,
    },
    run: {
      ...nextWorld.run,
      nextEventSequence: world.run.nextEventSequence + 1,
    },
  };

  return {
    nextWorld,
    emittedEvents: [event],
    nextEventSequence: world.run.nextEventSequence + 1,
  };
}

/** Shared cadence predicate for the authoritative conflict phase. */
export function isConflictResolutionBoundary(
  nextTick: number,
  nextDate: WorldState["date"],
): boolean {
  return (
    CONFLICT_RESOLUTION_CONFIG.cadence === "weekly" &&
    shouldRunPoliticalUpdate(
      nextTick,
      nextDate,
      CONFLICT_RESOLUTION_CONFIG.cadence,
    )
  );
}

export { DAYS_PER_POLITICAL_WEEK };
