import { describe, expect, it } from "vitest";

import { runSimulationStep } from "../core/tick";
import type { Conflict } from "../state/conflict";
import {
  CONTACT_FIXTURE_COUNTRY_IDS,
  CONTACT_FIXTURE_LAND_HEX_IDS,
  CONTACT_FIXTURE_REGION_IDS,
} from "../state/contactFixture";
import { asConflictId, asGovernmentId } from "../state/ids";
import { deriveRegimeClassification } from "../state/government";
import type {
  OrderConsolidationCriteria,
  ScenarioDefinition,
} from "../state/scenario";
import {
  T022_ORDER_CONSOLIDATION_CRITERIA,
  createT022OrderConsolidationScenario,
} from "../state/orderConsolidationFixture";
import { createInitialWorldState, type WorldState } from "../state/world";
import {
  deriveOrderConsolidationEligibility,
  runOrderConsolidationPhase,
} from "./orderConsolidation";

function scenarioWithCriteria(
  criteria: Partial<OrderConsolidationCriteria>,
): ScenarioDefinition {
  const scenario = createT022OrderConsolidationScenario();
  return {
    ...scenario,
    orderConsolidationCriteria: {
      ...T022_ORDER_CONSOLIDATION_CRITERIA,
      ...criteria,
    },
  };
}

function withCountry(
  world: WorldState,
  countryId: keyof WorldState["countries"],
  changes: Partial<WorldState["countries"][typeof countryId]>,
): WorldState {
  const country = world.countries[countryId];
  if (country === undefined) {
    throw new Error(`Missing test country ${countryId}.`);
  }

  return {
    ...world,
    countries: {
      ...world.countries,
      [countryId]: { ...country, ...changes },
    },
  };
}

function withLandHexController(
  world: WorldState,
  landHexId: keyof WorldState["landHexStates"],
  controller: WorldState["landHexStates"][typeof landHexId]["controller"],
): WorldState {
  return {
    ...world,
    landHexStates: {
      ...world.landHexStates,
      [landHexId]: { controller },
    },
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

function activeCivilWar(
  id: Conflict["id"],
  participantCountryIds: Conflict["participantCountryIds"],
): Conflict {
  return {
    id,
    kind: "civilWar",
    status: "active",
    participantCountryIds: [...participantCountryIds],
    participantFactionIds: [],
    affectedRegionIds: [],
    contestedRegionIds: [],
    startedAtTick: 0,
  };
}

function step(
  scenario: ScenarioDefinition,
  world: WorldState,
): ReturnType<typeof runSimulationStep> {
  return runSimulationStep(world, { actions: [] }, {}, scenario);
}

describe("T022 order consolidation", () => {
  it("derives explainable eligibility from criteria and does not mutate input", () => {
    const scenario = createT022OrderConsolidationScenario();
    const world = createInitialWorldState(scenario, 22022);
    const before = JSON.stringify(world);

    const snapshot = deriveOrderConsolidationEligibility(scenario, world);

    expect(snapshot.eligible).toBe(true);
    expect(snapshot.failedCriteria).toEqual([]);
    expect(snapshot.stableRegions.satisfiedRegionIds).toEqual([
      CONTACT_FIXTURE_REGION_IDS.border,
      CONTACT_FIXTURE_REGION_IDS.capital,
      CONTACT_FIXTURE_REGION_IDS.farmland,
      CONTACT_FIXTURE_REGION_IDS.mine,
      CONTACT_FIXTURE_REGION_IDS.port,
    ]);
    expect(snapshot.coreTerritory.missingRegionIds).toEqual([]);
    expect(snapshot.capitalControl.fullyControlled).toBe(true);
    expect(snapshot.stateCapacity.actual).toBe(50);
    expect(snapshot.treasury.actual).toBe(0);
    expect(world).toEqual(JSON.parse(before));
  });

  it("requires the exact configured consecutive period and emits victory once", () => {
    const scenario = createT022OrderConsolidationScenario();
    const initial = createInitialWorldState(scenario, 22022);

    const first = step(scenario, initial);
    const second = step(scenario, first.nextWorld);
    const third = step(scenario, second.nextWorld);

    expect(first.nextWorld.run.consolidation).toEqual({
      isCurrentlyEligible: true,
      consecutiveEligibleTicks: 1,
      lastEvaluatedTick: 1,
    });
    expect(first.nextWorld.run.outcome).toEqual({ status: "active" });
    expect(first.emittedEvents.map((event) => event.type)).toEqual([
      "ORDER_CONSOLIDATION_STARTED",
      "TICK_ADVANCED",
    ]);
    expect(first.emittedEvents[0]?.causeIds).toEqual([]);

    expect(second.nextWorld.run.consolidation.consecutiveEligibleTicks).toBe(2);
    expect(second.nextWorld.run.outcome).toEqual({ status: "active" });
    expect(
      second.emittedEvents.some(
        (event) => event.type === "ORDER_CONSOLIDATION_STARTED",
      ),
    ).toBe(false);

    expect(third.nextWorld.run.consolidation.consecutiveEligibleTicks).toBe(3);
    expect(third.nextWorld.run.outcome).toMatchObject({
      status: "won",
      kind: "orderConsolidated",
      atTick: 3,
    });
    expect(third.emittedEvents.map((event) => event.type)).toEqual([
      "ORDER_CONSOLIDATED",
      "TICK_ADVANCED",
    ]);
    expect(third.emittedEvents[0]?.causeIds).toEqual([]);
    expect(third.nextWorld.run.outcome).toMatchObject({
      causeEventId: third.emittedEvents[0]?.id,
    });

    const repeatedFirst = step(
      scenario,
      createInitialWorldState(scenario, 22022),
    );
    expect(repeatedFirst.emittedEvents).toEqual(first.emittedEvents);

    const terminal = step(scenario, third.nextWorld);
    expect(terminal.nextWorld).toBe(third.nextWorld);
    expect(terminal.emittedEvents).toEqual([]);
  });

  it("resets and restarts the streak when current criteria fail", () => {
    const scenario = createT022OrderConsolidationScenario();
    const initial = createInitialWorldState(scenario, 22022);
    const first = step(scenario, initial).nextWorld;
    const second = step(scenario, first).nextWorld;
    const lostCapital = withLandHexController(
      second,
      CONTACT_FIXTURE_LAND_HEX_IDS.capitalEast,
      {
        kind: "country",
        countryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
      },
    );

    const interrupted = step(scenario, lostCapital);
    expect(interrupted.nextWorld.run.consolidation).toEqual({
      isCurrentlyEligible: false,
      consecutiveEligibleTicks: 0,
      lastEvaluatedTick: 3,
    });
    expect(interrupted.nextWorld.run.outcome).toEqual({ status: "active" });
    expect(
      interrupted.emittedEvents.some(
        (event) => event.type === "ORDER_CONSOLIDATED",
      ),
    ).toBe(false);

    const restored = withLandHexController(
      interrupted.nextWorld,
      CONTACT_FIXTURE_LAND_HEX_IDS.capitalEast,
      { kind: "country", countryId: CONTACT_FIXTURE_COUNTRY_IDS.player },
    );
    const restarted = step(scenario, restored);
    expect(restarted.nextWorld.run.consolidation.consecutiveEligibleTicks).toBe(
      1,
    );
    expect(
      restarted.emittedEvents.some(
        (event) => event.type === "ORDER_CONSOLIDATION_STARTED",
      ),
    ).toBe(true);
  });

  it("uses inclusive metric boundaries and no hidden metric blockers", () => {
    const scenario = scenarioWithCriteria({
      minimumStateCapacity: 50,
      minimumTreasury: 0,
    });
    const world = createInitialWorldState(scenario, 22022);

    expect(deriveOrderConsolidationEligibility(scenario, world).eligible).toBe(
      true,
    );
    expect(
      deriveOrderConsolidationEligibility(
        scenario,
        withCountry(world, CONTACT_FIXTURE_COUNTRY_IDS.player, {
          stateCapacity: 49,
        }),
      ).eligible,
    ).toBe(false);
    expect(
      deriveOrderConsolidationEligibility(
        scenario,
        withCountry(world, CONTACT_FIXTURE_COUNTRY_IDS.player, {
          treasury: -1,
        }),
      ).eligible,
    ).toBe(false);
    expect(
      deriveOrderConsolidationEligibility(
        scenario,
        withCountry(world, CONTACT_FIXTURE_COUNTRY_IDS.player, {
          legitimacy: 0,
          production: 0,
          militaryPower: 0,
        }),
      ).eligible,
    ).toBe(true);
  });

  it("uses current LandHex control for stable regions, core, and capital", () => {
    const scenario = createT022OrderConsolidationScenario();
    const world = createInitialWorldState(scenario, 22022);
    const partialCapital = withLandHexController(
      world,
      CONTACT_FIXTURE_LAND_HEX_IDS.capitalEast,
      {
        kind: "country",
        countryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
      },
    );

    const snapshot = deriveOrderConsolidationEligibility(
      scenario,
      partialCapital,
    );

    expect(
      partialCapital.regions[CONTACT_FIXTURE_REGION_IDS.capital]
        ?.ownerCountryId,
    ).toBe(CONTACT_FIXTURE_COUNTRY_IDS.player);
    expect(snapshot.capitalControl.fullyControlled).toBe(false);
    expect(snapshot.capitalControl.passes).toBe(false);
    expect(snapshot.stableRegions.missingRegionIds).toContain(
      CONTACT_FIXTURE_REGION_IDS.capital,
    );
    expect(snapshot.coreTerritory.missingRegionIds).toContain(
      CONTACT_FIXTURE_REGION_IDS.capital,
    );
    expect(snapshot.eligible).toBe(false);
  });

  it("uses only an explicitly configured scenario unrest threshold", () => {
    const scenario = createT022OrderConsolidationScenario();
    const world = createInitialWorldState(scenario, 22022);
    const boundary: WorldState = {
      ...world,
      regions: {
        ...world.regions,
        [CONTACT_FIXTURE_REGION_IDS.port]: {
          ...world.regions[CONTACT_FIXTURE_REGION_IDS.port]!,
          unrest: 0.25,
        },
      },
    };
    const above: WorldState = {
      ...boundary,
      regions: {
        ...boundary.regions,
        [CONTACT_FIXTURE_REGION_IDS.port]: {
          ...boundary.regions[CONTACT_FIXTURE_REGION_IDS.port]!,
          unrest: 0.250001,
        },
      },
    };

    expect(
      deriveOrderConsolidationEligibility(scenario, boundary).eligible,
    ).toBe(true);
    expect(deriveOrderConsolidationEligibility(scenario, above).eligible).toBe(
      false,
    );

    const noThresholdScenario = scenarioWithCriteria({
      maximumStableRegionUnrest: undefined,
    });
    expect(
      deriveOrderConsolidationEligibility(noThresholdScenario, above).eligible,
    ).toBe(true);
  });

  it("blocks only relevant active civil war and not other conflict kinds", () => {
    const scenario = createT022OrderConsolidationScenario();
    const world = createInitialWorldState(scenario, 22022);
    const player = CONTACT_FIXTURE_COUNTRY_IDS.player;
    const merchant = CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic;

    const civilWarWorld = withConflicts(world, [
      activeCivilWar(asConflictId("t022.player-civil-war"), [player, merchant]),
    ]);
    expect(
      deriveOrderConsolidationEligibility(scenario, civilWarWorld)
        .activeCivilWar,
    ).toMatchObject({
      passes: false,
      activeConflictIds: [asConflictId("t022.player-civil-war")],
    });
    expect(
      deriveOrderConsolidationEligibility(scenario, civilWarWorld).eligible,
    ).toBe(false);

    const foreignCivilWarWorld = withConflicts(world, [
      activeCivilWar(asConflictId("t022.foreign-civil-war"), [
        merchant,
        CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
      ]),
    ]);
    expect(
      deriveOrderConsolidationEligibility(scenario, foreignCivilWarWorld)
        .eligible,
    ).toBe(true);

    const relaxedScenario = scenarioWithCriteria({
      requiresNoActiveCivilWar: false,
    });
    expect(
      deriveOrderConsolidationEligibility(relaxedScenario, civilWarWorld)
        .eligible,
    ).toBe(true);
  });

  it("keeps Government and derived regime changes out of the streak", () => {
    const scenario = createT022OrderConsolidationScenario();
    const initial = createInitialWorldState(scenario, 22022);
    const first = step(scenario, initial).nextWorld;
    const transitionGovernmentId = asGovernmentId("t022.transition-government");
    const transitioned: WorldState = {
      ...first,
      governments: {
        ...first.governments,
        [first.countries[CONTACT_FIXTURE_COUNTRY_IDS.player]!
          .currentGovernmentId!]: {
          ...first.governments[
            first.countries[CONTACT_FIXTURE_COUNTRY_IDS.player]!
              .currentGovernmentId!
          ]!,
          authority: "contender",
        },
        [transitionGovernmentId]: {
          id: transitionGovernmentId,
          countryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
          name: "T022 전환 정부",
          authority: "central",
          formedAtTick: first.tick,
        },
      },
      countries: {
        ...first.countries,
        [CONTACT_FIXTURE_COUNTRY_IDS.player]: {
          ...first.countries[CONTACT_FIXTURE_COUNTRY_IDS.player]!,
          currentGovernmentId: transitionGovernmentId,
        },
      },
    };
    const second = step(scenario, transitioned);
    const democraticPolicyState = {
      ...second.nextWorld.policies[CONTACT_FIXTURE_COUNTRY_IDS.player]!,
      institutionalRules: {
        ...second.nextWorld.policies[CONTACT_FIXTURE_COUNTRY_IDS.player]!
          .institutionalRules,
        rulerVeto: false,
        legislatureRequired: true,
        suffrage: "universal" as const,
      },
    };
    const regimeChanged: WorldState = {
      ...second.nextWorld,
      policies: {
        ...second.nextWorld.policies,
        [CONTACT_FIXTURE_COUNTRY_IDS.player]: democraticPolicyState,
      },
    };

    expect(second.nextWorld.run.consolidation.consecutiveEligibleTicks).toBe(2);
    expect(second.nextWorld.run.outcome).toEqual({ status: "active" });
    expect(
      deriveRegimeClassification(
        second.nextWorld.policies[CONTACT_FIXTURE_COUNTRY_IDS.player]!,
      ).classification,
    ).toBe("monarchy");
    expect(
      deriveRegimeClassification(
        regimeChanged.policies[CONTACT_FIXTURE_COUNTRY_IDS.player]!,
      ).classification,
    ).toBe("democracy");
    expect(
      deriveOrderConsolidationEligibility(scenario, regimeChanged).eligible,
    ).toBe(true);
  });

  it("is deterministic under insertion-order changes", () => {
    const scenario = createT022OrderConsolidationScenario();
    const world = createInitialWorldState(scenario, 22022);
    const reversedWorld: WorldState = {
      ...world,
      regions: Object.fromEntries(Object.entries(world.regions).reverse()),
      conflicts: Object.fromEntries(Object.entries(world.conflicts).reverse()),
    };

    expect(deriveOrderConsolidationEligibility(scenario, world)).toEqual(
      deriveOrderConsolidationEligibility(scenario, reversedWorld),
    );
    expect(step(scenario, world)).toEqual(step(scenario, world));
  });

  it("does not change unrelated domain state or consume RNG", () => {
    const scenario = createT022OrderConsolidationScenario();
    const world = createInitialWorldState(scenario, 22022);
    const result = step(scenario, world);

    expect(result.nextWorld.rngState).toBe(world.rngState);
    expect(result.nextWorld.countries).toBe(world.countries);
    expect(result.nextWorld.regions).toBe(world.regions);
    expect(result.nextWorld.landHexStates).toBe(world.landHexStates);
    expect(result.nextWorld.governments).toBe(world.governments);
    expect(result.nextWorld.factions).toBe(world.factions);
    expect(result.nextWorld.conflicts).toBe(world.conflicts);
    expect(result.nextWorld.policies).toBe(world.policies);
  });

  it("returns an immutable no-op when T022 duration is not configured", () => {
    const scenario = scenarioWithCriteria({ requiredConsecutiveTicks: 0 });
    const world = createInitialWorldState(scenario, 22022);
    const context = {
      phase: "evaluateOrderConsolidationAndDissolution" as const,
      world,
      input: { actions: [] },
      nextTick: 1,
      emittedEvents: [],
      nextEventSequence: world.run.nextEventSequence,
      scenario,
    };

    const result = runOrderConsolidationPhase(context);
    expect(result.nextWorld).toBe(world);
    expect(result.emittedEvents).toEqual([]);
    expect(result.nextEventSequence).toBe(world.run.nextEventSequence);
  });
});
