import { describe, expect, it } from "vitest";

import {
  deserializeSimulationSnapshot,
  serializeSimulationSnapshotJson,
} from "../sim/core/persistence";
import type { Conflict } from "../sim/state/conflict";
import {
  CONTACT_FIXTURE_COUNTRY_IDS,
  CONTACT_FIXTURE_EDGE_IDS,
  CONTACT_FIXTURE_LAND_HEX_IDS,
  CONTACT_FIXTURE_REGION_IDS,
  createContactFixtureScenario,
} from "../sim/state/contactFixture";
import {
  POLITICAL_CRISIS_FIXTURE_FACTION_IDS,
  createPoliticalCrisisFixtureScenario,
} from "../sim/state/politicalCrisisFixture";
import { createT021RebellionScenario } from "../sim/state/conflictFixture";
import { asConflictId, asFactionId } from "../sim/state/ids";
import { createIdeologyFixtureScenario } from "../sim/state/ideologyFixture";
import { FOUNDATION_SCENARIO } from "../sim/state/scenario";
import { createInitialWorldState, type WorldState } from "../sim/state/world";
import { derivePresentationState } from "./presentationState";

function activeConflict(
  id: Conflict["id"],
  kind: Conflict["kind"],
  participantCountryIds: readonly Conflict["participantCountryIds"][number][],
  participantFactionIds: readonly Conflict["participantFactionIds"][number][] = [],
): Conflict {
  return {
    id,
    kind,
    status: "active",
    participantCountryIds: [...participantCountryIds],
    participantFactionIds: [...participantFactionIds],
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

function reverseRecord<T>(
  record: Readonly<Record<string, T>>,
): Record<string, T> {
  return Object.fromEntries(Object.entries(record).reverse());
}

describe("V01 presentation state", () => {
  it("is a pure semantic projection with no renderer state", () => {
    const scenario = createContactFixtureScenario();
    const world = createInitialWorldState(scenario, 101);
    const scenarioBefore = JSON.stringify(scenario);
    const worldBefore = JSON.stringify(world);

    const presentation = derivePresentationState(scenario, world);

    expect(JSON.stringify(scenario)).toBe(scenarioBefore);
    expect(JSON.stringify(world)).toBe(worldBefore);
    expect(presentation).not.toHaveProperty("mapState");
    expect(presentation).not.toHaveProperty("camera");
    expect(presentation).not.toHaveProperty("armies");
    expect(presentation.landHexes[0]).not.toHaveProperty("x");
    expect(presentation.landHexes[0]).not.toHaveProperty("y");
    expect(presentation.landHexes[0]).not.toHaveProperty("z");
  });

  it("projects every LandHex from static topology and preserves partial Region control", () => {
    const scenario = createT021RebellionScenario();
    const baseWorld = createInitialWorldState(scenario, 102);
    const rebellionFactionId = POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion;
    const industrialRegionId = scenario.initialRegions[1]!.id;
    const industrialHexes = scenario.mapTerritorialTopology.landHexes.filter(
      (landHex) => landHex.regionId === industrialRegionId,
    );
    const firstIndustrialHex = industrialHexes[0]!;
    const world: WorldState = {
      ...baseWorld,
      landHexStates: {
        ...baseWorld.landHexStates,
        [firstIndustrialHex.id]: {
          controller: { kind: "faction", factionId: rebellionFactionId },
        },
      },
    };

    const presentation = derivePresentationState(scenario, world);
    const region = presentation.regions.find(
      (candidate) => candidate.regionId === industrialRegionId,
    );
    const regionHexes = presentation.landHexes.filter(
      (landHex) => landHex.regionId === industrialRegionId,
    );

    expect(regionHexes).toHaveLength(2);
    expect(regionHexes.map((landHex) => landHex.landHexId)).toEqual(
      [...regionHexes].map((landHex) => landHex.landHexId).sort(),
    );
    expect(region?.control.kind).toBe("contested");
    expect(region?.control.fullyControlledByCountryId).toBeNull();
    expect(region?.control.factionIds).toEqual([rebellionFactionId]);
    expect(region?.control.controllerCounts).toHaveLength(2);
    expect(
      regionHexes.find((landHex) => landHex.landHexId === firstIndustrialHex.id)
        ?.controller,
    ).toEqual({ kind: "faction", factionId: rebellionFactionId });
  });

  it("keeps political influence at Region level and uses current ideology state", () => {
    const scenario = createIdeologyFixtureScenario();
    const world = createInitialWorldState(scenario, 103);
    const presentation = derivePresentationState(scenario, world);
    const capital = presentation.regions.find(
      (region) => region.regionId === scenario.initialRegions[0]!.id,
    );

    expect(
      capital?.politicalInfluence.map((entry) => entry.ideologyId),
    ).toEqual(
      [...(capital?.politicalInfluence ?? [])]
        .map((entry) => entry.ideologyId)
        .sort(),
    );
    expect(
      capital?.politicalInfluence.find(
        (entry) => entry.ideologyId === "fixture.republicanism",
      ),
    ).toMatchObject({ support: 0.8, radicalism: 0.1, organization: 0.1 });
    expect(
      presentation.landHexes.every((landHex) => !("ideology" in landHex)),
    ).toBe(true);
  });

  it("creates organization tokens only for actual faction-controlled presence", () => {
    const scenario = createT021RebellionScenario();
    const baseWorld = createInitialWorldState(scenario, 104);
    const factionId = POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion;
    const industrialHex = scenario.mapTerritorialTopology.landHexes.find(
      (landHex) => landHex.regionId === scenario.initialRegions[1]!.id,
    )!;
    const occupiedWorld: WorldState = {
      ...baseWorld,
      landHexStates: {
        ...baseWorld.landHexStates,
        [industrialHex.id]: {
          controller: { kind: "faction", factionId },
        },
      },
    };

    const occupiedPresentation = derivePresentationState(
      scenario,
      occupiedWorld,
    );
    const unanchoredPresentation = derivePresentationState(scenario, baseWorld);
    const token = occupiedPresentation.organizationTokens[0];

    expect(token).toMatchObject({
      factionId,
      regionId: industrialHex.regionId,
      organization: occupiedWorld.factions[factionId]!.organization,
      controlledLandHexIds: [industrialHex.id],
    });
    expect(token?.tokenId).toContain(encodeURIComponent(String(factionId)));
    expect(unanchoredPresentation.organizationTokens).toEqual([]);
  });

  it("keeps ContactGraph routes directed and exposes inactive runtime overlays", () => {
    const scenario = createContactFixtureScenario();
    const baseWorld = createInitialWorldState(scenario, 105);
    const world: WorldState = {
      ...baseWorld,
      contactEdgeStates: {
        [CONTACT_FIXTURE_EDGE_IDS.merchantToPortInformation]: {
          enabled: false,
          multiplier: 1,
          blockedReason: "검문소 폐쇄",
          blockedByCountryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
        },
      },
    };
    const presentation = derivePresentationState(scenario, world);
    const merchantToPort = presentation.contactRoutes.find(
      (route) =>
        route.routeId === CONTACT_FIXTURE_EDGE_IDS.merchantToPortInformation,
    );
    const portToMerchant = presentation.contactRoutes.find(
      (route) => route.routeId === CONTACT_FIXTURE_EDGE_IDS.portToMerchantTrade,
    );

    expect(merchantToPort).toMatchObject({
      sourceRegionId: CONTACT_FIXTURE_REGION_IDS.merchantPort,
      targetRegionId: CONTACT_FIXTURE_REGION_IDS.port,
      channel: "information",
      enabled: false,
      active: false,
      effectiveStrength: 0,
      blockedReason: "검문소 폐쇄",
    });
    expect(portToMerchant).toMatchObject({
      sourceRegionId: CONTACT_FIXTURE_REGION_IDS.port,
      targetRegionId: CONTACT_FIXTURE_REGION_IDS.merchantPort,
      active: true,
    });
    expect(presentation.contactRoutes.map((route) => route.routeId)).toEqual(
      [...presentation.contactRoutes].map((route) => route.routeId).sort(),
    );
  });

  it("derives armed fronts but never fronts for peaceful borders or coups", () => {
    const scenario = createContactFixtureScenario();
    const baseWorld = createInitialWorldState(scenario, 106);
    const war = activeConflict(asConflictId("v01.war"), "war", [
      CONTACT_FIXTURE_COUNTRY_IDS.player,
      CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
    ]);
    const warPresentation = derivePresentationState(
      scenario,
      withConflicts(baseWorld, [war]),
    );

    expect(warPresentation.fronts.length).toBeGreaterThan(0);
    expect(
      warPresentation.fronts.every((front) => front.conflictKind === "war"),
    ).toBe(true);
    expect(derivePresentationState(scenario, baseWorld).fronts).toEqual([]);

    const coupFactionId = asFactionId("v01.coup-faction");
    const coupWorld: WorldState = {
      ...baseWorld,
      factions: {
        ...baseWorld.factions,
        [coupFactionId]: {
          id: coupFactionId,
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
        },
      },
      landHexStates: {
        ...baseWorld.landHexStates,
        [CONTACT_FIXTURE_LAND_HEX_IDS.capitalWest]: {
          controller: { kind: "faction", factionId: coupFactionId },
        },
      },
    };
    const coup = activeConflict(
      asConflictId("v01.coup"),
      "coup",
      [CONTACT_FIXTURE_COUNTRY_IDS.player],
      [coupFactionId],
    );

    expect(
      derivePresentationState(scenario, withConflicts(coupWorld, [coup]))
        .fronts,
    ).toEqual([]);
  });

  it("re-derives the same semantic state after a JSON-safe T024 snapshot roundtrip", () => {
    const scenario = createContactFixtureScenario();
    const world = createInitialWorldState(scenario, 107);
    const record = { world, eventStore: { events: [] } };
    const before = derivePresentationState(scenario, world);
    const loaded = deserializeSimulationSnapshot(
      scenario,
      serializeSimulationSnapshotJson(scenario, record),
    );

    expect(derivePresentationState(scenario, loaded.world)).toEqual(before);
    expect(loaded.world).not.toHaveProperty("presentationState");
  });

  it("is independent of runtime record insertion order and handles empty scenarios", () => {
    const scenario = createContactFixtureScenario();
    const world = createInitialWorldState(scenario, 108);
    const ordered = derivePresentationState(scenario, world);
    const reversed: WorldState = {
      ...world,
      countries: reverseRecord(world.countries),
      regions: reverseRecord(world.regions),
      landHexStates: reverseRecord(world.landHexStates),
      governments: reverseRecord(world.governments),
      factions: reverseRecord(world.factions),
      conflicts: reverseRecord(world.conflicts),
      interventionCommitments: reverseRecord(world.interventionCommitments),
      contactEdgeStates: reverseRecord(world.contactEdgeStates),
      policies: reverseRecord(world.policies),
    };

    expect(derivePresentationState(scenario, reversed)).toEqual(ordered);

    const emptyWorld = createInitialWorldState(FOUNDATION_SCENARIO, 109);
    expect(
      derivePresentationState(FOUNDATION_SCENARIO, emptyWorld),
    ).toMatchObject({
      landHexes: [],
      regions: [],
      organizationTokens: [],
      contactRoutes: [],
      fronts: [],
    });
  });

  it("keeps the structural selection linkage without adding UI selection state", () => {
    const scenario = createPoliticalCrisisFixtureScenario();
    const world = createInitialWorldState(scenario, 110);
    const presentation = derivePresentationState(scenario, world);

    expect(
      presentation.landHexes.every((landHex) =>
        presentation.regions.some(
          (region) => region.regionId === landHex.regionId,
        ),
      ),
    ).toBe(true);
    expect(presentation).not.toHaveProperty("selectedRegionId");
    expect(presentation).not.toHaveProperty("hoveredLandHexId");
  });
});
