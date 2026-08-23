import { createGameEvent, type GameEvent } from "../events/event";
import type {
  ActionId,
  ConflictId,
  CountryId,
  EventId,
  FactionId,
  LandHexId,
  RegionId,
} from "./ids";
import type { ScenarioDefinition } from "./scenario";
import { getLandHex, getLandHexesForRegion } from "./territorialTopology";
import type { TerritorialController } from "./region";
import type { WorldState } from "./world";

/** Mutable run-time fact for one static LandHex. */
export interface LandHexRuntimeState {
  readonly controller: TerritorialController;
}

export type RegionControlKind =
  | "fullyControlled"
  | "partial"
  | "contested"
  | "factionPresence"
  | "uncontrolled";

export interface RegionControllerCount {
  readonly controller: TerritorialController;
  readonly landHexCount: number;
  readonly share: number;
}

/** Pure read model of physical control; it is never stored in WorldState. */
export interface RegionControlSummary {
  readonly regionId: RegionId;
  readonly kind: RegionControlKind;
  readonly landHexCount: number;
  readonly uncontrolledLandHexCount: number;
  readonly countryIds: readonly CountryId[];
  readonly factionIds: readonly FactionId[];
  readonly controllerCounts: readonly RegionControllerCount[];
  readonly fullyControlledByCountryId: CountryId | null;
  readonly fullyControlledByFactionId: FactionId | null;
}

export interface CountryTerritorialProjection {
  readonly countryId: CountryId;
  readonly controlledLandHexIds: readonly LandHexId[];
  readonly fullyControlledRegionIds: readonly RegionId[];
  readonly partiallyControlledRegionIds: readonly RegionId[];
}

export interface LandHexControllerChangeInput {
  readonly landHexId: LandHexId;
  readonly nextController: TerritorialController;
  /** Phase callers pass SimulationPhaseContext.nextTick explicitly. */
  readonly tick?: number;
  /** These IDs must already exist in the committed/event buffer context. */
  readonly causeIds?: readonly EventId[];
  /** Explicit caller-supplied evidence set used to validate causeIds. */
  readonly knownCauseIds?: readonly EventId[];
  readonly sourceActionId?: ActionId;
  readonly conflictId?: ConflictId;
}

export interface LandHexControllerChangeResult {
  readonly nextWorld: WorldState;
  readonly emittedEvents: readonly GameEvent[];
  readonly nextEventSequence: number;
}

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
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

function sortedRegionIds(scenario: ScenarioDefinition): readonly RegionId[] {
  return scenario.initialRegions
    .map((region) => region.id)
    .sort(compareStableText);
}

function assertScenarioMatchesWorld(
  scenario: ScenarioDefinition,
  world: WorldState,
): void {
  if (
    scenario.id !== world.run.scenarioId ||
    scenario.version !== world.run.scenarioVersion
  ) {
    throw new Error("Territorial scenario does not match WorldState.");
  }
}

/** Validate the complete scenario/runtime territorial boundary. */
export function assertLandHexRuntimeStateInvariants(
  scenario: ScenarioDefinition,
  world: WorldState,
): void {
  assertScenarioMatchesWorld(scenario, world);
  const topologyIds = new Set(
    scenario.mapTerritorialTopology.landHexes.map((landHex) => landHex.id),
  );

  for (const landHexId of Object.keys(world.landHexStates)) {
    if (!topologyIds.has(landHexId as LandHexId)) {
      throw new Error(
        `WorldState contains runtime state for unknown LandHex ${landHexId}.`,
      );
    }
  }

  for (const landHex of scenario.mapTerritorialTopology.landHexes) {
    const state = world.landHexStates[landHex.id];
    if (state === undefined) {
      throw new Error(
        `WorldState is missing runtime state for LandHex ${landHex.id}.`,
      );
    }

    assertValidControllerShape(state.controller);
    assertControllerReference(world, state.controller);
  }
}

function assertControllerReference(
  world: WorldState,
  controller: TerritorialController,
): void {
  switch (controller.kind) {
    case "country":
      if (world.countries[controller.countryId] === undefined) {
        throw new Error(
          `LandHex controller references missing country ${controller.countryId}.`,
        );
      }
      return;
    case "faction":
      if (world.factions[controller.factionId] === undefined) {
        throw new Error(
          `LandHex controller references missing faction ${controller.factionId}.`,
        );
      }
      return;
    case "uncontrolled":
      return;
  }
}

function assertRuntimeState(
  world: WorldState,
  landHexId: LandHexId,
): LandHexRuntimeState {
  const state = world.landHexStates[landHexId];
  if (state === undefined) {
    throw new Error(`LandHex ${landHexId} has no runtime territorial state.`);
  }

  assertControllerReference(world, state.controller);
  return state;
}

function countControllers(
  controllers: readonly TerritorialController[],
): readonly RegionControllerCount[] {
  const counts = new Map<
    string,
    { controller: TerritorialController; count: number }
  >();

  for (const controller of controllers) {
    const key = controllerKey(controller);
    const current = counts.get(key);
    if (current === undefined) {
      counts.set(key, { controller: cloneController(controller), count: 1 });
    } else {
      current.count += 1;
    }
  }

  const total = controllers.length;
  return [...counts.entries()]
    .sort(([first], [second]) => compareStableText(first, second))
    .map(([, value]) => ({
      controller: value.controller,
      landHexCount: value.count,
      share: total === 0 ? 0 : value.count / total,
    }));
}

/** Derive a Region's physical control status from its member LandHex states. */
export function deriveRegionControlSummary(
  scenario: ScenarioDefinition,
  world: WorldState,
  regionId: RegionId,
): RegionControlSummary {
  assertScenarioMatchesWorld(scenario, world);
  assertLandHexRuntimeStateInvariants(scenario, world);
  const region = world.regions[regionId];
  if (region === undefined) {
    throw new Error(`Region ${regionId} does not exist in WorldState.`);
  }

  const landHexes = getLandHexesForRegion(scenario, regionId);
  const controllers = landHexes.map((landHex) =>
    cloneController(assertRuntimeState(world, landHex.id).controller),
  );
  const controllerCounts = countControllers(controllers);
  const countryIds = controllerCounts
    .flatMap((entry) =>
      entry.controller.kind === "country" ? [entry.controller.countryId] : [],
    )
    .sort(compareStableText);
  const factionIds = controllerCounts
    .flatMap((entry) =>
      entry.controller.kind === "faction" ? [entry.controller.factionId] : [],
    )
    .sort(compareStableText);
  const uncontrolledLandHexCount =
    controllerCounts.find((entry) => entry.controller.kind === "uncontrolled")
      ?.landHexCount ?? 0;
  const concreteControllerCount = controllerCounts.filter(
    (entry) => entry.controller.kind !== "uncontrolled",
  ).length;
  const firstController = controllerCounts[0]?.controller;
  const soleController =
    controllerCounts.length === 1 ? firstController : undefined;
  const fullyControlledByCountryId =
    landHexes.length > 0 && soleController?.kind === "country"
      ? soleController.countryId
      : null;
  const fullyControlledByFactionId =
    landHexes.length > 0 && soleController?.kind === "faction"
      ? soleController.factionId
      : null;

  let kind: RegionControlKind;
  if (landHexes.length === 0 || controllerCounts.length === 0) {
    kind = "uncontrolled";
  } else if (uncontrolledLandHexCount === landHexes.length) {
    kind = "uncontrolled";
  } else if (fullyControlledByCountryId !== null) {
    kind = "fullyControlled";
  } else if (fullyControlledByFactionId !== null) {
    kind = "factionPresence";
  } else if (concreteControllerCount > 1) {
    kind = "contested";
  } else if (factionIds.length > 0) {
    kind = "factionPresence";
  } else {
    kind = "partial";
  }

  return {
    regionId,
    kind,
    landHexCount: landHexes.length,
    uncontrolledLandHexCount,
    countryIds: [...new Set(countryIds)],
    factionIds: [...new Set(factionIds)],
    controllerCounts,
    fullyControlledByCountryId,
    fullyControlledByFactionId,
  };
}

/** Return all physical cells controlled by one country in stable ID order. */
export function getCountryControlledLandHexIds(
  scenario: ScenarioDefinition,
  world: WorldState,
  countryId: CountryId,
): readonly LandHexId[] {
  assertScenarioMatchesWorld(scenario, world);
  assertLandHexRuntimeStateInvariants(scenario, world);
  if (world.countries[countryId] === undefined) {
    throw new Error(`Country ${countryId} does not exist in WorldState.`);
  }

  return Object.keys(world.landHexStates)
    .map((landHexId) => landHexId as LandHexId)
    .filter((landHexId) => {
      getLandHex(scenario, landHexId);
      return (
        world.landHexStates[landHexId]?.controller.kind === "country" &&
        world.landHexStates[landHexId]?.controller.countryId === countryId
      );
    })
    .sort(compareStableText);
}

/** Return all physical cells controlled by one faction in stable ID order. */
export function getFactionControlledLandHexIds(
  scenario: ScenarioDefinition,
  world: WorldState,
  factionId: FactionId,
): readonly LandHexId[] {
  assertScenarioMatchesWorld(scenario, world);
  assertLandHexRuntimeStateInvariants(scenario, world);
  if (world.factions[factionId] === undefined) {
    throw new Error(`Faction ${factionId} does not exist in WorldState.`);
  }

  return Object.keys(world.landHexStates)
    .map((landHexId) => landHexId as LandHexId)
    .filter((landHexId) => {
      getLandHex(scenario, landHexId);
      return (
        world.landHexStates[landHexId]?.controller.kind === "faction" &&
        world.landHexStates[landHexId]?.controller.factionId === factionId
      );
    })
    .sort(compareStableText);
}

/** Return true only when every member LandHex is controlled by this country. */
export function isRegionFullyControlledByCountry(
  scenario: ScenarioDefinition,
  world: WorldState,
  regionId: RegionId,
  countryId: CountryId,
): boolean {
  return (
    deriveRegionControlSummary(scenario, world, regionId)
      .fullyControlledByCountryId === countryId
  );
}

export function isRegionFullyControlledByFaction(
  scenario: ScenarioDefinition,
  world: WorldState,
  regionId: RegionId,
  factionId: FactionId,
): boolean {
  return (
    deriveRegionControlSummary(scenario, world, regionId)
      .fullyControlledByFactionId === factionId
  );
}

export function getRegionFactionIds(
  scenario: ScenarioDefinition,
  world: WorldState,
  regionId: RegionId,
): readonly FactionId[] {
  return deriveRegionControlSummary(scenario, world, regionId).factionIds;
}

/** Country-level aggregates include only fully controlled Regions. */
export function getFullyControlledRegionIds(
  scenario: ScenarioDefinition,
  world: WorldState,
  countryId: CountryId,
): readonly RegionId[] {
  return sortedRegionIds(scenario).filter((regionId) =>
    isRegionFullyControlledByCountry(scenario, world, regionId, countryId),
  );
}

/** Regions with at least one country-controlled cell but not full control. */
export function getPartiallyControlledRegionIds(
  scenario: ScenarioDefinition,
  world: WorldState,
  countryId: CountryId,
): readonly RegionId[] {
  return sortedRegionIds(scenario).filter((regionId) => {
    const summary = deriveRegionControlSummary(scenario, world, regionId);
    return (
      summary.countryIds.includes(countryId) &&
      summary.fullyControlledByCountryId !== countryId
    );
  });
}

export function deriveCountryTerritorialProjection(
  scenario: ScenarioDefinition,
  world: WorldState,
  countryId: CountryId,
): CountryTerritorialProjection {
  return {
    countryId,
    controlledLandHexIds: getCountryControlledLandHexIds(
      scenario,
      world,
      countryId,
    ),
    fullyControlledRegionIds: getFullyControlledRegionIds(
      scenario,
      world,
      countryId,
    ),
    partiallyControlledRegionIds: getPartiallyControlledRegionIds(
      scenario,
      world,
      countryId,
    ),
  };
}

/** Country endpoint projection used by country-level contact and administration queries. */
export function getFullyControllingCountryId(
  scenario: ScenarioDefinition,
  world: WorldState,
  regionId: RegionId,
): CountryId | null {
  return deriveRegionControlSummary(scenario, world, regionId)
    .fullyControlledByCountryId;
}

function assertValidControllerShape(controller: TerritorialController): void {
  if (
    typeof controller !== "object" ||
    controller === null ||
    (controller.kind !== "country" &&
      controller.kind !== "faction" &&
      controller.kind !== "uncontrolled")
  ) {
    throw new Error("LandHex controller has an invalid discriminant.");
  }

  if (
    (controller.kind === "country" && controller.countryId.length === 0) ||
    (controller.kind === "faction" && controller.factionId.length === 0)
  ) {
    throw new Error("LandHex controller reference must not be empty.");
  }
}

/**
 * The sole physical-controller mutation seam. It is intended for an
 * authoritative action/conflict phase; presentation and agents submit
 * records instead of calling this function directly.
 */
export function changeLandHexController(
  scenario: ScenarioDefinition,
  world: WorldState,
  input: LandHexControllerChangeInput,
): LandHexControllerChangeResult {
  assertScenarioMatchesWorld(scenario, world);
  assertValidControllerShape(input.nextController);
  const landHex = getLandHex(scenario, input.landHexId);
  const previousState = assertRuntimeState(world, input.landHexId);
  assertControllerReference(world, input.nextController);

  if (input.sourceActionId !== undefined && input.sourceActionId.length === 0) {
    throw new Error("LandHex controller sourceActionId must not be empty.");
  }

  if (
    input.conflictId !== undefined &&
    world.conflicts[input.conflictId] === undefined
  ) {
    throw new Error(
      `LandHex controller references missing conflict ${input.conflictId}.`,
    );
  }

  const causeIds = [...(input.causeIds ?? [])];
  const knownCauseIds = new Set(input.knownCauseIds ?? []);
  for (const causeId of causeIds) {
    if (!knownCauseIds.has(causeId)) {
      throw new Error(
        `LandHex controller change references a cause event that is not already known: ${causeId}.`,
      );
    }
  }

  if (controllersEqual(previousState.controller, input.nextController)) {
    return {
      nextWorld: world,
      emittedEvents: [],
      nextEventSequence: world.run.nextEventSequence,
    };
  }

  const tick = input.tick ?? world.tick;
  if (!Number.isInteger(tick) || tick < world.tick) {
    throw new Error(
      "LandHex controller change tick must be at or after world.tick.",
    );
  }

  const sequence = world.run.nextEventSequence;
  const event = createGameEvent({
    tick,
    sequence,
    type: "LAND_HEX_CONTROL_CHANGED",
    targetId: input.landHexId,
    causeIds,
    payload: {
      landHexId: input.landHexId,
      regionId: landHex.regionId,
      previousController: cloneController(previousState.controller),
      nextController: cloneController(input.nextController),
      ...(input.sourceActionId === undefined
        ? {}
        : { sourceActionId: input.sourceActionId }),
      ...(input.conflictId === undefined
        ? {}
        : { conflictId: input.conflictId }),
    },
    visibility: "world",
  });

  const nextWorld: WorldState = {
    ...world,
    landHexStates: {
      ...world.landHexStates,
      [input.landHexId]: {
        controller: cloneController(input.nextController),
      },
    },
    run: {
      ...world.run,
      nextEventSequence: sequence + 1,
    },
  };

  return {
    nextWorld,
    emittedEvents: [event],
    nextEventSequence: sequence + 1,
  };
}
