import { describe, expect, it } from "vitest";

import { assertWorldStateInvariants } from "../core/invariants";
import {
  cloneRunRecordViaSnapshot,
  commitSimulationStep,
  serializeSimulationSnapshotJson,
} from "../core/persistence";
import { runSimulationStep } from "../core/tick";
import { createDeterministicEventId, type GameEvent } from "../events/event";
import { createEventStore } from "../events/eventStore";
import type { Conflict } from "../state/conflict";
import {
  CONTACT_FIXTURE_COUNTRY_IDS,
  CONTACT_FIXTURE_LAND_HEX_IDS,
  CONTACT_FIXTURE_REGION_IDS,
  createContactFixtureScenario,
} from "../state/contactFixture";
import {
  POLITICAL_CRISIS_FIXTURE_FACTION_IDS,
  createPoliticalCrisisFixtureScenario,
} from "../state/politicalCrisisFixture";
import {
  asConflictId,
  asFactionId,
  asGovernmentId,
  type LandHexId,
} from "../state/ids";
import type { Faction } from "../state/faction";
import {
  createT021RebellionScenario,
  T021_CONFLICT_IDS,
} from "../state/conflictFixture";
import type { ScenarioDefinition } from "../state/scenario";
import {
  deriveRegionControlSummary,
  type LandHexRuntimeState,
} from "../state/territorialControl";
import { createInitialWorldState, type WorldState } from "../state/world";
import type { RunRecord } from "../core/step";
import {
  applyConflictOutcome,
  deriveActiveConflictFrontEdges,
  deriveConflictFrontEdges,
  deriveConflictIntents,
  isConflictResolutionBoundary,
} from "./conflictResolution";

function activeConflict(
  id: Conflict["id"],
  kind: Conflict["kind"],
  participantCountryIds: Conflict["participantCountryIds"],
  participantFactionIds: Conflict["participantFactionIds"] = [],
  affectedRegionIds: NonNullable<Conflict["affectedRegionIds"]> = [],
): Conflict {
  return {
    id,
    kind,
    status: "active",
    participantCountryIds: [...participantCountryIds],
    participantFactionIds: [...participantFactionIds],
    affectedRegionIds: [...affectedRegionIds],
    contestedRegionIds: [],
    startedAtTick: 0,
  };
}

function withConflicts(
  world: WorldState,
  conflicts: readonly Conflict[],
): WorldState {
  return {
    ...world,
    conflicts: Object.fromEntries(
      conflicts.map((conflict) => [conflict.id, conflict]),
    ),
  };
}

function withMilitaryPower(
  world: WorldState,
  values: Readonly<Record<string, number>>,
): WorldState {
  const countries = { ...world.countries };
  for (const [countryId, militaryPower] of Object.entries(values)) {
    const country = countries[countryId as keyof typeof countries];
    if (country === undefined) {
      throw new Error(`Test country ${countryId} is missing.`);
    }
    countries[country.id] = { ...country, militaryPower };
  }
  return { ...world, countries };
}

function withFaction(world: WorldState, faction: Faction): WorldState {
  return {
    ...world,
    factions: { ...world.factions, [faction.id]: faction },
  };
}

function runDays(
  scenario: ScenarioDefinition,
  startingWorld: WorldState,
  count: number,
): { readonly world: WorldState; readonly events: readonly GameEvent[] } {
  let world = startingWorld;
  const events: GameEvent[] = [];
  for (let index = 0; index < count; index += 1) {
    const result = runSimulationStep(world, { actions: [] }, {}, scenario);
    world = result.nextWorld;
    events.push(...result.emittedEvents);
  }
  return { world, events };
}

function runRecordDays(
  scenario: ScenarioDefinition,
  startingRecord: RunRecord,
  count: number,
): RunRecord {
  let record = startingRecord;
  for (let index = 0; index < count; index += 1) {
    const result = runSimulationStep(
      record.world,
      { actions: [] },
      {},
      scenario,
    );
    record = commitSimulationStep(scenario, record, result);
  }
  return record;
}

function rebellionWorldAtDayZero(): {
  readonly scenario: ReturnType<typeof createT021RebellionScenario>;
  readonly world: WorldState;
} {
  const scenario = createT021RebellionScenario();
  return { scenario, world: createInitialWorldState(scenario, 21021) };
}

function zeroTerritoryRebellionWorld(
  options: {
    readonly countryMilitaryPower?: number;
    readonly stateControl?: number;
  } = {},
): {
  readonly scenario: ReturnType<typeof createT021RebellionScenario>;
  readonly world: WorldState;
  readonly factionId: Faction["id"];
  readonly countryId: NonNullable<ScenarioDefinition["playerCountryId"]>;
  readonly affectedRegionId: ScenarioDefinition["initialRegions"][number]["id"];
} {
  const scenario = createT021RebellionScenario();
  const baseWorld = createInitialWorldState(scenario, 21021);
  const country = scenario.initialCountries[0];
  const affectedRegion = scenario.initialRegions[1];
  const faction =
    baseWorld.factions[POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion];
  if (
    country === undefined ||
    affectedRegion === undefined ||
    faction === undefined
  ) {
    throw new Error("T021 recovery fixture is incomplete.");
  }

  const conflicts = [
    activeConflict(
      T021_CONFLICT_IDS.rebellion,
      "rebellion",
      [country.id],
      [faction.id],
      [affectedRegion.id],
    ),
  ];
  const factionControlledLandHexStates = Object.fromEntries(
    Object.keys(baseWorld.landHexStates).map((landHexId) => [
      landHexId,
      { controller: { kind: "faction", factionId: faction.id } },
    ]),
  ) as Readonly<Record<LandHexId, LandHexRuntimeState>>;

  const world: WorldState = {
    ...withConflicts(baseWorld, conflicts),
    countries: {
      ...baseWorld.countries,
      [country.id]: {
        ...baseWorld.countries[country.id]!,
        militaryPower: options.countryMilitaryPower ?? 100,
      },
    },
    regions: {
      ...baseWorld.regions,
      [affectedRegion.id]: {
        ...baseWorld.regions[affectedRegion.id]!,
        stateControl: options.stateControl ?? 0.8,
      },
    },
    landHexStates: factionControlledLandHexStates,
  };

  return {
    scenario,
    world,
    factionId: faction.id,
    countryId: country.id,
    affectedRegionId: affectedRegion.id,
  };
}

function collisionWorldAtDayZero(): {
  readonly scenario: ReturnType<typeof createT021RebellionScenario>;
  readonly world: WorldState;
} {
  const { scenario, world: baseWorld } = rebellionWorldAtDayZero();
  const firstFaction =
    baseWorld.factions[POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion];
  if (firstFaction === undefined) {
    throw new Error("T021 collision fixture is missing its first faction.");
  }

  const secondFactionId = asFactionId("t021.collision-second-faction");
  const secondFaction: Faction = {
    ...firstFaction,
    id: secondFactionId,
    name: "두 번째 반란 세력",
  };
  const secondScenario: ScenarioDefinition = {
    ...scenario,
    factionCapabilities: {
      ...(scenario.factionCapabilities ?? {}),
      [secondFactionId]: ["rebellion"],
    },
  };
  const world = withConflicts(withFaction(baseWorld, secondFaction), [
    activeConflict(
      T021_CONFLICT_IDS.collisionFirst,
      "rebellion",
      [firstFaction.countryId],
      [firstFaction.id],
      [secondScenario.initialRegions[1]!.id],
    ),
    activeConflict(
      T021_CONFLICT_IDS.collisionSecond,
      "rebellion",
      [firstFaction.countryId],
      [secondFactionId],
      [secondScenario.initialRegions[1]!.id],
    ),
  ]);
  return { scenario: secondScenario, world };
}

describe("T021 simplified conflict / war", () => {
  it("derives fronts only from active armed conflicts and current opposing controllers", () => {
    const scenario = createContactFixtureScenario();
    const world = createInitialWorldState(scenario, 21021);

    expect(deriveActiveConflictFrontEdges(scenario, world)).toEqual([]);

    const conflict = activeConflict(T021_CONFLICT_IDS.countryWar, "war", [
      CONTACT_FIXTURE_COUNTRY_IDS.player,
      CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
    ]);
    const conflicted = withConflicts(world, [conflict]);
    const edges = deriveConflictFrontEdges(scenario, conflicted, conflict.id);

    expect(edges.length).toBeGreaterThan(0);
    expect(
      edges.every(
        (edge) =>
          edge.firstController.kind !== "uncontrolled" &&
          edge.secondController.kind !== "uncontrolled",
      ),
    ).toBe(true);
  });

  it("keeps coup conflicts non-territorial even when a faction controls a LandHex", () => {
    const scenario = createContactFixtureScenario();
    const factionId = asFactionId("t021.coup-faction");
    const faction: Faction = {
      id: factionId,
      name: "쿠데타 세력",
      countryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
      interests: ["authority"],
      resources: 1,
      organization: 1,
      influence: 1,
      grievance: 1,
      ideologyAffinity: {},
      foreignLinks: {},
      currentStrategy: "supportCoup",
    };
    const baseWorld = withFaction(
      createInitialWorldState(scenario, 21021),
      faction,
    );
    const world = withConflicts(
      {
        ...baseWorld,
        landHexStates: {
          ...baseWorld.landHexStates,
          [CONTACT_FIXTURE_LAND_HEX_IDS.capitalWest]: {
            controller: { kind: "faction", factionId },
          },
        },
      },
      [
        activeConflict(
          T021_CONFLICT_IDS.coup,
          "coup",
          [CONTACT_FIXTURE_COUNTRY_IDS.player],
          [factionId],
        ),
      ],
    );

    const before = JSON.stringify(world.landHexStates);
    const result = runDays(scenario, world, 7);

    expect(JSON.stringify(result.world.landHexStates)).toBe(before);
    expect(
      deriveConflictFrontEdges(scenario, world, T021_CONFLICT_IDS.coup),
    ).toEqual([]);
  });

  it("does not occupy territory in the same phase that T018 detects a rebellion", () => {
    const { scenario, world } = rebellionWorldAtDayZero();
    const before = JSON.stringify(world.landHexStates);
    const first = runSimulationStep(world, { actions: [] }, {}, scenario);

    expect(
      first.emittedEvents.some((event) => event.type === "REBELLION_STARTED"),
    ).toBe(true);
    expect(JSON.stringify(first.nextWorld.landHexStates)).toBe(before);
    expect(
      Object.values(first.nextWorld.conflicts).some(
        (conflict) =>
          conflict.kind === "rebellion" && conflict.status === "active",
      ),
    ).toBe(true);
  });

  it("resolves a rebellion at the next weekly boundary with at most one initial LandHex", () => {
    const { scenario, world } = rebellionWorldAtDayZero();
    const result = runDays(scenario, world, 7);
    const changedEvents = result.events.filter(
      (event) => event.type === "LAND_HEX_CONTROL_CHANGED",
    );

    expect(changedEvents).toHaveLength(1);
    expect(changedEvents[0]?.payload).toMatchObject({
      conflictId: expect.any(String),
    });

    const changedLandHexIds = (
      Object.keys(world.landHexStates) as LandHexId[]
    ).filter(
      (landHexId) =>
        JSON.stringify(world.landHexStates[landHexId]) !==
        JSON.stringify(result.world.landHexStates[landHexId]),
    );
    expect(changedLandHexIds).toHaveLength(1);
    expect(
      deriveRegionControlSummary(
        scenario,
        result.world,
        scenario.initialRegions[1]!.id,
      ).kind,
    ).toBe("contested");
  });

  it("uses adjacency for expansion and government recapture", () => {
    const { scenario, world } = rebellionWorldAtDayZero();
    const firstBoundary = runDays(scenario, world, 7).world;
    const rebellion = Object.values(firstBoundary.conflicts).find(
      (conflict) => conflict.kind === "rebellion",
    );
    if (rebellion === undefined) {
      throw new Error("T021 rebellion was not created.");
    }

    const factionId = rebellion.participantFactionIds[0]!;
    const factionHexIds = (
      Object.keys(firstBoundary.landHexStates) as LandHexId[]
    ).filter(
      (landHexId) =>
        firstBoundary.landHexStates[landHexId]?.controller.kind === "faction",
    );
    expect(factionHexIds).toHaveLength(1);

    const expansion = runDays(scenario, firstBoundary, 7);
    const expansionEvents = expansion.events.filter(
      (event) => event.type === "LAND_HEX_CONTROL_CHANGED",
    );
    expect(expansionEvents).toHaveLength(1);
    expect(
      expansion.world.landHexStates[factionHexIds[0]!]!.controller,
    ).toEqual({ kind: "faction", factionId });

    const weakenedFaction = {
      ...expansion.world.factions[factionId]!,
      organization: 0.1,
      resources: 0.1,
    };
    const weakenedWorld = withFaction(
      withMilitaryPower(expansion.world, {
        [weakenedFaction.countryId]: 100,
      }),
      weakenedFaction,
    );
    const recapture = runDays(scenario, weakenedWorld, 7);
    const recaptureEvents = recapture.events.filter(
      (event) => event.type === "LAND_HEX_CONTROL_CHANGED",
    );

    expect(recaptureEvents).toHaveLength(1);
    expect(
      Object.values(recapture.world.landHexStates).some(
        (state) =>
          state.controller.kind === "faction" &&
          state.controller.factionId === factionId,
      ),
    ).toBe(true);
  });

  it("re-reads current faction organization/resources during an active rebellion", () => {
    const { scenario, world } = rebellionWorldAtDayZero();
    const firstBoundary = runDays(scenario, world, 7).world;
    const rebellion = Object.values(firstBoundary.conflicts).find(
      (conflict) => conflict.kind === "rebellion",
    );
    if (rebellion === undefined) {
      throw new Error("T021 current-state rebellion is missing.");
    }

    const factionId = rebellion.participantFactionIds[0]!;
    const faction = firstBoundary.factions[factionId]!;
    const strongIntents = deriveConflictIntents(scenario, firstBoundary);
    const weakWorld = withFaction(firstBoundary, {
      ...faction,
      organization: 0.1,
      resources: 0.1,
    });
    const weakIntents = deriveConflictIntents(scenario, weakWorld);

    expect(strongIntents).toHaveLength(1);
    expect(weakIntents).toHaveLength(1);
    expect(strongIntents[0]?.actingController).toEqual({
      kind: "faction",
      factionId,
    });
    expect(weakIntents[0]?.actingController).toEqual({
      kind: "country",
      countryId: faction.countryId,
    });
    expect(weakIntents[0]?.reason).toBe("governmentRecapture");
  });

  it("does not delete an occupied rebellion when grievance falls", () => {
    const { scenario, world } = rebellionWorldAtDayZero();
    const firstBoundary = runDays(scenario, world, 7).world;
    const rebellion = Object.values(firstBoundary.conflicts).find(
      (conflict) =>
        conflict.kind === "rebellion" && conflict.status === "active",
    );
    const factionId = rebellion?.participantFactionIds[0];
    if (factionId === undefined) {
      throw new Error("T021 occupied rebellion faction is missing.");
    }
    const occupiedWorld: WorldState = {
      ...firstBoundary,
      factions: {
        ...firstBoundary.factions,
        [factionId]: {
          ...firstBoundary.factions[factionId]!,
          grievance: 0,
        },
      },
    };

    const result = runSimulationStep(
      occupiedWorld,
      { actions: [] },
      {},
      scenario,
    );
    const resultRebellion = Object.values(result.nextWorld.conflicts).find(
      (conflict) =>
        conflict.kind === "rebellion" &&
        conflict.participantFactionIds.includes(factionId),
    );

    expect(resultRebellion?.status).toBe("active");
    expect(
      Object.values(result.nextWorld.landHexStates).some(
        (state) =>
          state.controller.kind === "faction" &&
          state.controller.factionId === factionId,
      ),
    ).toBe(true);
  });

  it("restores exactly one Hex for a strong zero-territory government", () => {
    const { scenario, world, countryId, factionId, affectedRegionId } =
      zeroTerritoryRebellionWorld();
    const intents = deriveConflictIntents(scenario, world);

    expect(intents).toHaveLength(1);
    expect(intents[0]).toMatchObject({
      actingController: { kind: "country", countryId },
      opposingController: { kind: "faction", factionId },
      reason: "governmentRecovery",
    });
    const targetHexId = intents[0]!.targetHexId;
    expect(
      scenario.mapTerritorialTopology.landHexes.find(
        (landHex) => landHex.id === targetHexId,
      )?.regionId,
    ).toBe(affectedRegionId);

    const result = runDays(scenario, world, 7);
    const changes = result.events.filter(
      (event) => event.type === "LAND_HEX_CONTROL_CHANGED",
    );

    expect(changes).toHaveLength(1);
    expect(result.world.landHexStates[targetHexId]?.controller).toEqual({
      kind: "country",
      countryId,
    });
    expect(
      Object.values(result.world.landHexStates).filter(
        (state) =>
          state.controller.kind === "country" &&
          state.controller.countryId === countryId,
      ),
    ).toHaveLength(1);
    expect(result.world.conflicts[T021_CONFLICT_IDS.rebellion]?.status).toBe(
      "active",
    );
    expect(result.world.countries[countryId]?.stateContinuity).toBe(100);
  });

  it("applies one continuity point only at the weekly boundary when a displaced government cannot recover", () => {
    const { scenario, world, countryId } = zeroTerritoryRebellionWorld({
      stateControl: 0.1,
    });
    const intents = deriveConflictIntents(scenario, world);
    expect(intents).toEqual([]);

    const beforeBoundary = runDays(scenario, world, 6);
    expect(beforeBoundary.world.countries[countryId]?.stateContinuity).toBe(
      100,
    );

    const result = runDays(scenario, beforeBoundary.world, 1);
    expect(
      Object.values(result.world.landHexStates).filter(
        (state) =>
          state.controller.kind === "country" &&
          state.controller.countryId === countryId,
      ),
    ).toHaveLength(0);
    expect(
      result.events.filter(
        (event) => event.type === "LAND_HEX_CONTROL_CHANGED",
      ),
    ).toHaveLength(0);
    expect(result.world.countries[countryId]?.stateContinuity).toBe(99);
    expect(result.world.run.outcome).toEqual({ status: "active" });
  });

  it("clamps unresolved rebellion pressure at zero and lets T023 own dissolution", () => {
    const { scenario, world, countryId } = zeroTerritoryRebellionWorld({
      stateControl: 0.1,
    });
    const threatened: WorldState = {
      ...world,
      countries: {
        ...world.countries,
        [countryId]: {
          ...world.countries[countryId]!,
          stateContinuity: 1,
        },
      },
    };

    const result = runDays(scenario, threatened, 7);

    expect(result.world.countries[countryId]?.stateContinuity).toBe(0);
    expect(result.world.run.outcome).toMatchObject({
      status: "defeated",
      kind: "stateDissolved",
      reason: "stateContinuityThreshold",
    });
    expect(
      result.events.filter((event) => event.type === "STATE_DISSOLVED"),
    ).toHaveLength(1);
  });

  it("keeps zero-territory recovery equivalent across a save/load boundary", () => {
    const { scenario, world } = zeroTerritoryRebellionWorld();
    const initialRecord = cloneRunRecordViaSnapshot(scenario, {
      world,
      eventStore: createEventStore(),
    });
    const continuous = runRecordDays(scenario, initialRecord, 7);
    const firstHalf = runRecordDays(scenario, initialRecord, 3);
    const resumed = runRecordDays(
      scenario,
      cloneRunRecordViaSnapshot(scenario, firstHalf),
      4,
    );

    expect(serializeSimulationSnapshotJson(scenario, resumed)).toBe(
      serializeSimulationSnapshotJson(scenario, continuous),
    );
    expect(
      continuous.eventStore.events.filter(
        (event) => event.type === "LAND_HEX_CONTROL_CHANGED",
      ),
    ).toHaveLength(1);
  });

  it("keeps unresolved continuity pressure equivalent across a save/load boundary", () => {
    const { scenario, world, countryId } = zeroTerritoryRebellionWorld({
      stateControl: 0.1,
    });
    const initialRecord = cloneRunRecordViaSnapshot(scenario, {
      world,
      eventStore: createEventStore(),
    });
    const continuous = runRecordDays(scenario, initialRecord, 14);
    const firstHalf = runRecordDays(scenario, initialRecord, 5);
    const resumed = runRecordDays(
      scenario,
      cloneRunRecordViaSnapshot(scenario, firstHalf),
      9,
    );

    expect(serializeSimulationSnapshotJson(scenario, resumed)).toBe(
      serializeSimulationSnapshotJson(scenario, continuous),
    );
    expect(continuous.world.countries[countryId]?.stateContinuity).toBe(98);
  });

  it("keeps recovery insertion-order independent and excludes coups", () => {
    const { scenario, world } = zeroTerritoryRebellionWorld();
    const reversedWorld: WorldState = {
      ...world,
      conflicts: Object.fromEntries(Object.entries(world.conflicts).reverse()),
      regions: Object.fromEntries(Object.entries(world.regions).reverse()),
      landHexStates: Object.fromEntries(
        Object.entries(world.landHexStates).reverse(),
      ),
    };

    expect(deriveConflictIntents(scenario, world)).toEqual(
      deriveConflictIntents(scenario, reversedWorld),
    );

    const coupWorld = withConflicts(world, [
      activeConflict(
        T021_CONFLICT_IDS.coup,
        "coup",
        [scenario.initialCountries[0]!.id],
        [POLITICAL_CRISIS_FIXTURE_FACTION_IDS.coup],
        [scenario.initialRegions[1]!.id],
      ),
    ]);
    expect(deriveConflictIntents(scenario, coupWorld)).toEqual([]);
  });

  it("does not apply recovery without affected-region evidence", () => {
    const { scenario, world } = zeroTerritoryRebellionWorld();
    const noAffectedRegionWorld = withConflicts(world, [
      activeConflict(
        T021_CONFLICT_IDS.rebellion,
        "rebellion",
        [scenario.initialCountries[0]!.id],
        [POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion],
      ),
    ]);

    expect(deriveConflictIntents(scenario, noAffectedRegionWorld)).toEqual([]);
  });

  it("does not apply internal recovery to a zero-territory foreign war", () => {
    const scenario = createContactFixtureScenario();
    const baseWorld = createInitialWorldState(scenario, 21021);
    const conflict = activeConflict(
      asConflictId("t021.foreign-zero-territory"),
      "war",
      [
        CONTACT_FIXTURE_COUNTRY_IDS.player,
        CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
      ],
    );
    const merchantControlledLandHexStates = Object.fromEntries(
      Object.keys(baseWorld.landHexStates).map((landHexId) => [
        landHexId,
        {
          controller: {
            kind: "country",
            countryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
          },
        },
      ]),
    ) as Readonly<Record<LandHexId, LandHexRuntimeState>>;
    const world = withMilitaryPower(
      withConflicts(
        {
          ...baseWorld,
          landHexStates: merchantControlledLandHexStates,
        },
        [conflict],
      ),
      {
        [CONTACT_FIXTURE_COUNTRY_IDS.player]: 100,
        [CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic]: 10,
      },
    );

    expect(deriveConflictIntents(scenario, world)).toEqual([]);
    expect(
      runDays(scenario, world, 7).world.countries[
        CONTACT_FIXTURE_COUNTRY_IDS.player
      ]?.stateContinuity,
    ).toBe(100);
  });

  it("uses Country.militaryPower for country war and stalemates on a tie", () => {
    const scenario = createContactFixtureScenario();
    const baseWorld = createInitialWorldState(scenario, 21021);
    const conflict = activeConflict(T021_CONFLICT_IDS.countryWar, "war", [
      CONTACT_FIXTURE_COUNTRY_IDS.player,
      CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
    ]);
    const strongWorld = withMilitaryPower(
      withConflicts(baseWorld, [conflict]),
      {
        [CONTACT_FIXTURE_COUNTRY_IDS.player]: 90,
        [CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic]: 10,
      },
    );
    expect(deriveConflictIntents(scenario, strongWorld)).toHaveLength(1);
    const strongResult = runDays(scenario, strongWorld, 7);
    expect(
      strongResult.events.filter(
        (event) => event.type === "LAND_HEX_CONTROL_CHANGED",
      ),
    ).toHaveLength(1);

    const tieWorld = withMilitaryPower(strongWorld, {
      [CONTACT_FIXTURE_COUNTRY_IDS.player]: 50,
      [CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic]: 50,
    });
    const tieResult = runDays(scenario, tieWorld, 7);
    expect(
      tieResult.events.filter(
        (event) => event.type === "LAND_HEX_CONTROL_CHANGED",
      ),
    ).toEqual([]);
  });

  it("resolves same-target collisions by ConflictId and is insertion-order independent", () => {
    const first = collisionWorldAtDayZero();
    const firstResult = runDays(first.scenario, first.world, 7);
    const reversedWorld: WorldState = {
      ...first.world,
      conflicts: Object.fromEntries(
        Object.entries(first.world.conflicts).reverse(),
      ),
      factions: Object.fromEntries(
        Object.entries(first.world.factions).reverse(),
      ),
    };
    const reversedResult = runDays(first.scenario, reversedWorld, 7);

    const firstChanged = firstResult.events.filter(
      (event) => event.type === "LAND_HEX_CONTROL_CHANGED",
    );
    const reversedChanged = reversedResult.events.filter(
      (event) => event.type === "LAND_HEX_CONTROL_CHANGED",
    );
    expect(firstChanged).toHaveLength(1);
    expect(reversedChanged).toEqual(firstChanged);
    expect(firstResult.world.landHexStates).toEqual(
      reversedResult.world.landHexStates,
    );
    expect(
      firstResult.world.landHexStates[
        "ideology-fixture.industrial-hex" as keyof typeof firstResult.world.landHexStates
      ]?.controller,
    ).toEqual({
      kind: "faction",
      factionId: POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion,
    });
  });

  it("applies two accepted intents with one shared event buffer and strict order", () => {
    const scenario = createContactFixtureScenario();
    const baseWorld = createInitialWorldState(scenario, 21021);
    const firstConflict = activeConflict(T021_CONFLICT_IDS.countryWar, "war", [
      CONTACT_FIXTURE_COUNTRY_IDS.player,
      CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
    ]);
    const secondConflict = activeConflict(
      T021_CONFLICT_IDS.countryWarSecond,
      "war",
      [
        CONTACT_FIXTURE_COUNTRY_IDS.player,
        CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
      ],
    );
    const world = withMilitaryPower(
      withConflicts(baseWorld, [firstConflict, secondConflict]),
      {
        [CONTACT_FIXTURE_COUNTRY_IDS.player]: 90,
        [CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic]: 10,
        [CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy]: 10,
      },
    );
    const result = runDays(scenario, world, 7);
    const changes = result.events.filter(
      (event) => event.type === "LAND_HEX_CONTROL_CHANGED",
    );

    expect(changes).toHaveLength(2);
    expect(changes.map((event) => event.sequence)).toEqual(
      [...changes]
        .sort((first, second) => first.sequence - second.sequence)
        .map((event) => event.sequence),
    );
    expect(changes.every((event) => event.causeIds.length === 0)).toBe(true);
    expect(new Set(changes.map((event) => event.id)).size).toBe(2);
  });

  it("keeps independent rebellion suppressions causally unlinked and order-stable", () => {
    const baseScenario = createT021RebellionScenario();
    const firstFaction = baseScenario.initialFactions.find(
      (faction) =>
        faction.id === POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion,
    );
    const country = baseScenario.initialCountries[0];
    const affectedRegion = baseScenario.initialRegions[1];
    if (
      firstFaction === undefined ||
      country === undefined ||
      affectedRegion === undefined
    ) {
      throw new Error("T021 suppression fixture is incomplete.");
    }

    const secondFactionId = asFactionId("t021.suppression-second-faction");
    const secondFaction: Faction = {
      ...firstFaction,
      id: secondFactionId,
      name: "두 번째 비조직 반란 세력",
      organization: 0.1,
    };
    const firstIneligibleFaction: Faction = {
      ...firstFaction,
      organization: 0.1,
    };
    const scenario: ScenarioDefinition = {
      ...baseScenario,
      initialFactions: [
        ...baseScenario.initialFactions.map((faction) =>
          faction.id === firstFaction.id ? firstIneligibleFaction : faction,
        ),
        secondFaction,
      ],
      factionCapabilities: {
        ...(baseScenario.factionCapabilities ?? {}),
        [POLITICAL_CRISIS_FIXTURE_FACTION_IDS.coup]: [],
        [secondFactionId]: ["rebellion"],
      },
    };
    const firstConflict = activeConflict(
      asConflictId("t021.suppression-first"),
      "rebellion",
      [country.id],
      [firstFaction.id],
      [affectedRegion.id],
    );
    const secondConflict = activeConflict(
      asConflictId("t021.suppression-second"),
      "rebellion",
      [country.id],
      [secondFactionId],
      [affectedRegion.id],
    );
    const baseWorld = withConflicts(createInitialWorldState(scenario, 21021), [
      firstConflict,
      secondConflict,
    ]);
    const reversedWorld: WorldState = {
      ...baseWorld,
      conflicts: Object.fromEntries(
        Object.entries(baseWorld.conflicts).reverse(),
      ),
    };

    const firstResult = runSimulationStep(
      baseWorld,
      { actions: [] },
      {},
      scenario,
    );
    const reversedResult = runSimulationStep(
      reversedWorld,
      { actions: [] },
      {},
      scenario,
    );
    const suppressionEvents = firstResult.emittedEvents.filter(
      (event) => event.type === "CONFLICT_RESOLVED",
    );
    const reversedSuppressionEvents = reversedResult.emittedEvents.filter(
      (event) => event.type === "CONFLICT_RESOLVED",
    );

    expect(Object.values(firstResult.nextWorld.conflicts)).toHaveLength(2);
    expect(
      Object.values(firstResult.nextWorld.conflicts).every(
        (conflict) => conflict.status === "resolved",
      ),
    ).toBe(true);
    expect(suppressionEvents).toHaveLength(2);
    expect(suppressionEvents.map((event) => event.targetId)).toEqual([
      firstConflict.id,
      secondConflict.id,
    ]);
    expect(suppressionEvents.map((event) => event.causeIds)).toEqual([[], []]);
    const suppressionSequences = suppressionEvents.map(
      (event) => event.sequence,
    );
    expect(
      suppressionSequences.every(
        (sequence, index) =>
          index === 0 || sequence > suppressionSequences[index - 1]!,
      ),
    ).toBe(true);
    expect(
      suppressionEvents.every(
        (event) =>
          event.id ===
          createDeterministicEventId(event.tick, event.sequence, event.type),
      ),
    ).toBe(true);
    expect(reversedSuppressionEvents).toEqual(suppressionEvents);
    expect(reversedResult.nextWorld.conflicts).toEqual(
      firstResult.nextWorld.conflicts,
    );
  });

  it("applies governmentTransition without changing CountryId, territory, or RunOutcome", () => {
    const scenario = createPoliticalCrisisFixtureScenario();
    const baseWorld = createInitialWorldState(scenario, 21021);
    const country = Object.values(baseWorld.countries)[0]!;
    const oldGovernment = baseWorld.governments[country.currentGovernmentId!]!;
    const nextGovernmentId = asGovernmentId("t021.successor-government");
    const factionId = POLITICAL_CRISIS_FIXTURE_FACTION_IDS.coup;
    const conflict = activeConflict(
      asConflictId("t021.government-transition"),
      "coup",
      [country.id],
      [factionId],
    );
    const world = {
      ...withConflicts(baseWorld, [conflict]),
      governments: {
        ...baseWorld.governments,
        [nextGovernmentId]: {
          id: nextGovernmentId,
          countryId: country.id,
          name: "새 중앙 정부",
          authority: "contender" as const,
          formedAtTick: 0,
        },
      },
    };
    const beforeLandHexStates = world.landHexStates;
    const result = applyConflictOutcome(world, {
      conflictId: conflict.id,
      outcome: {
        kind: "governmentTransition",
        countryId: country.id,
        previousGovernmentId: oldGovernment.id,
        nextGovernmentId,
        winner: { kind: "faction", factionId },
      },
    });

    assertWorldStateInvariants(result.nextWorld);
    expect(result.nextWorld.countries[country.id]?.currentGovernmentId).toBe(
      nextGovernmentId,
    );
    expect(result.nextWorld.countries[country.id]?.id).toBe(country.id);
    expect(result.nextWorld.governments[oldGovernment.id]?.authority).toBe(
      "contender",
    );
    expect(result.nextWorld.governments[nextGovernmentId]?.authority).toBe(
      "central",
    );
    expect(result.nextWorld.landHexStates).toEqual(beforeLandHexStates);
    expect(result.nextWorld.run.outcome).toEqual({ status: "active" });
    expect(result.emittedEvents[0]?.type).toBe("GOVERNMENT_TRANSITIONED");
  });

  it("keeps occupation separate from owner, stateControl, ideology, and ContactGraph topology", () => {
    const scenario = createContactFixtureScenario();
    const baseWorld = createInitialWorldState(scenario, 21021);
    const conflict = activeConflict(T021_CONFLICT_IDS.countryWar, "war", [
      CONTACT_FIXTURE_COUNTRY_IDS.player,
      CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
    ]);
    const world = withMilitaryPower(withConflicts(baseWorld, [conflict]), {
      [CONTACT_FIXTURE_COUNTRY_IDS.player]: 90,
      [CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic]: 10,
    });
    const contactTopologyBefore = JSON.stringify(scenario.mapContactTopology);
    const result = runDays(scenario, world, 7);
    const changedRegionId = CONTACT_FIXTURE_REGION_IDS.merchantPort;
    const beforeRegion = world.regions[changedRegionId]!;
    const afterRegion = result.world.regions[changedRegionId]!;

    expect(afterRegion.ownerCountryId).toBe(beforeRegion.ownerCountryId);
    expect(afterRegion.stateControl).toBe(beforeRegion.stateControl);
    expect(afterRegion.ideology).toEqual(beforeRegion.ideology);
    expect(JSON.stringify(scenario.mapContactTopology)).toBe(
      contactTopologyBefore,
    );
  });

  it("uses a centralized weekly boundary and does not consume RNG", () => {
    const scenario = createContactFixtureScenario();
    const world = createInitialWorldState(scenario, 21021);
    expect(isConflictResolutionBoundary(6, world.date)).toBe(false);
    expect(isConflictResolutionBoundary(7, world.date)).toBe(true);

    const conflict = activeConflict(T021_CONFLICT_IDS.countryWar, "war", [
      CONTACT_FIXTURE_COUNTRY_IDS.player,
      CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
    ]);
    const prepared = withMilitaryPower(withConflicts(world, [conflict]), {
      [CONTACT_FIXTURE_COUNTRY_IDS.player]: 90,
      [CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic]: 10,
    });
    const result = runDays(scenario, prepared, 7);
    expect(result.world.rngState).toEqual(prepared.rngState);
  });
});
