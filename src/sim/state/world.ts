import type { SimDate } from "../core/clock";
import { createSeedState, type SeedState } from "../core/rng";
import type { Conflict } from "./conflict";
import type { ContactEdgeRuntimeStateMap } from "./contact";
import type { Country } from "./country";
import type { Faction } from "./faction";
import type { Government } from "./government";
import {
  assertScenarioInterventionCatalog,
  type InterventionCommitment,
} from "./intervention";
import type { PolicyState } from "./policy";
import type { Region } from "./region";
import type { ScenarioRegion, TerritorialController } from "./region";
import type { RunState } from "./run";
import { assertScenarioDefinition, type ScenarioDefinition } from "./scenario";
import {
  assertScenarioIdeologyCoverage,
  assertScenarioRuntimeClosure,
} from "../core/runtimeClosure";
import type {
  ConflictId,
  CountryId,
  FactionId,
  GovernmentId,
  InterventionCommitmentId,
  LandHexId,
  RegionId,
} from "./ids";
import type { LandHexRuntimeState } from "./territorialControl";

export interface WorldState {
  readonly tick: number;
  readonly date: SimDate;
  readonly countries: Readonly<Record<CountryId, Country>>;
  readonly regions: Readonly<Record<RegionId, Region>>;
  /** Sole mutable physical territorial authority; topology remains scenario-owned. */
  readonly landHexStates: Readonly<Record<LandHexId, LandHexRuntimeState>>;
  readonly governments: Readonly<Record<GovernmentId, Government>>;
  readonly factions: Readonly<Record<FactionId, Faction>>;
  readonly conflicts: Readonly<Record<ConflictId, Conflict>>;
  readonly interventionCommitments: Readonly<
    Record<InterventionCommitmentId, InterventionCommitment>
  >;
  readonly contactEdgeStates: ContactEdgeRuntimeStateMap;
  readonly policies: Readonly<Record<CountryId, PolicyState>>;
  readonly rngState: SeedState;
  readonly run: RunState;
}

function indexCountries(
  countries: readonly Country[],
): Readonly<Record<CountryId, Country>> {
  const indexed = {} as Record<CountryId, Country>;

  for (const country of countries) {
    indexed[country.id] = {
      ...country,
      diplomacy: { ...country.diplomacy },
    };
  }

  return indexed;
}

function indexRegions(
  regions: readonly ScenarioRegion[],
): Readonly<Record<RegionId, Region>> {
  const indexed = {} as Record<RegionId, Region>;

  for (const region of regions) {
    const runtimeRegion = { ...region } as Region & {
      initialController?: TerritorialController;
    };
    delete runtimeRegion.initialController;
    indexed[region.id] = {
      ...runtimeRegion,
      resources: { ...region.resources },
      resourceProductionCapacity: { ...region.resourceProductionCapacity },
      resourceProduction: { ...region.resourceProduction },
      resourceDemand: { ...region.resourceDemand },
      ideology: { ...region.ideology },
    };
  }

  return indexed;
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

function indexLandHexStates(
  scenario: ScenarioDefinition,
): Readonly<Record<LandHexId, LandHexRuntimeState>> {
  const indexed = {} as Record<LandHexId, LandHexRuntimeState>;
  const regionsById = new Map(
    scenario.initialRegions.map((region) => [region.id, region]),
  );

  for (const landHex of [...scenario.mapTerritorialTopology.landHexes].sort(
    (first, second) =>
      first.id < second.id ? -1 : first.id > second.id ? 1 : 0,
  )) {
    const region = regionsById.get(landHex.regionId);
    if (region === undefined) {
      throw new Error(
        `LandHex ${landHex.id} cannot inherit a missing Region controller seed.`,
      );
    }

    indexed[landHex.id] = {
      controller: cloneController(region.initialController),
    };
  }

  return indexed;
}

function assertInitialControllerReferences(scenario: ScenarioDefinition): void {
  const countryIds = new Set(
    scenario.initialCountries.map((country) => country.id),
  );
  const factionIds = new Set(
    scenario.initialFactions.map((faction) => faction.id),
  );

  for (const region of scenario.initialRegions) {
    switch (region.initialController.kind) {
      case "country":
        if (!countryIds.has(region.initialController.countryId)) {
          throw new Error(
            `Initial Region ${region.id} references a missing controller country.`,
          );
        }
        break;
      case "faction":
        if (!factionIds.has(region.initialController.factionId)) {
          throw new Error(
            `Initial Region ${region.id} references a missing controller faction.`,
          );
        }
        break;
      case "uncontrolled":
        break;
    }
  }
}

function indexGovernments(
  governments: readonly Government[],
): Readonly<Record<GovernmentId, Government>> {
  const indexed = {} as Record<GovernmentId, Government>;

  for (const government of governments) {
    indexed[government.id] = { ...government };
  }

  return indexed;
}

function indexFactions(
  factions: readonly Faction[],
): Readonly<Record<FactionId, Faction>> {
  const indexed = {} as Record<FactionId, Faction>;

  for (const faction of factions) {
    indexed[faction.id] = {
      ...faction,
      interests: [...faction.interests],
      ideologyAffinity: { ...faction.ideologyAffinity },
      foreignLinks: { ...faction.foreignLinks },
    };
  }

  return indexed;
}

function indexConflicts(
  conflicts: readonly Conflict[],
): Readonly<Record<ConflictId, Conflict>> {
  const indexed = {} as Record<ConflictId, Conflict>;

  for (const conflict of conflicts) {
    indexed[conflict.id] = {
      ...conflict,
      participantCountryIds: [...conflict.participantCountryIds],
      participantFactionIds: [...conflict.participantFactionIds],
      ...(conflict.affectedRegionIds === undefined
        ? {}
        : { affectedRegionIds: [...conflict.affectedRegionIds] }),
      contestedRegionIds: [...conflict.contestedRegionIds],
    };
  }

  return indexed;
}

function copyPolicyStates(
  policies: Readonly<Record<CountryId, PolicyState>>,
): Readonly<Record<CountryId, PolicyState>> {
  const copied = {} as Record<CountryId, PolicyState>;

  for (const [countryId, policyState] of Object.entries(policies)) {
    copied[countryId as CountryId] = {
      activePolicyIds: [...policyState.activePolicyIds],
      enactedAtTick: { ...policyState.enactedAtTick },
      institutionalRules: { ...policyState.institutionalRules },
    };
  }

  return copied;
}

/** Create one mutable run state from an immutable scenario definition. */
export function createInitialWorldState(
  scenario: ScenarioDefinition,
  seed: number,
): WorldState {
  assertScenarioDefinition(scenario);
  assertScenarioInterventionCatalog(scenario);
  assertScenarioIdeologyCoverage(scenario);
  assertInitialControllerReferences(scenario);
  const rngState = createSeedState(seed);

  const world: WorldState = {
    tick: 0,
    date: { ...scenario.initialDate },
    countries: indexCountries(scenario.initialCountries),
    regions: indexRegions(scenario.initialRegions),
    landHexStates: indexLandHexStates(scenario),
    governments: indexGovernments(scenario.initialGovernments),
    factions: indexFactions(scenario.initialFactions),
    conflicts: indexConflicts(scenario.initialConflicts),
    interventionCommitments: {},
    contactEdgeStates: {},
    policies: copyPolicyStates(scenario.initialCountryPolicies),
    rngState,
    run: {
      scenarioId: scenario.id,
      scenarioVersion: scenario.version,
      simulationVersion: 1,
      seed: rngState.seed,
      outcome: { status: "active" },
      consolidation: {
        isCurrentlyEligible: false,
        consecutiveEligibleTicks: 0,
        lastEvaluatedTick: null,
      },
      actionLog: [],
      nextActionSequence: 0,
      nextEventSequence: 0,
    },
  };

  assertScenarioRuntimeClosure(scenario, world);
  return world;
}
