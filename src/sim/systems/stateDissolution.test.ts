import { describe, expect, it } from "vitest";

import { runSimulationStep } from "../core/tick";
import type { Conflict } from "../state/conflict";
import {
  CONTACT_FIXTURE_COUNTRY_IDS,
  CONTACT_FIXTURE_LAND_HEX_IDS,
} from "../state/contactFixture";
import { asConflictId, asGovernmentId } from "../state/ids";
import { deriveRegimeClassification } from "../state/government";
import type {
  DissolutionCriteria,
  ScenarioDefinition,
} from "../state/scenario";
import { createT022OrderConsolidationScenario } from "../state/orderConsolidationFixture";
import { createT023StateDissolutionScenario } from "../state/stateDissolutionFixture";
import { createInitialWorldState, type WorldState } from "../state/world";
import {
  deriveStateDissolutionEligibility,
  runOrderConsolidationAndDissolutionPhase,
} from "./stateDissolution";

function scenarioWithCriteria(
  changes: Partial<DissolutionCriteria>,
): ScenarioDefinition {
  const scenario = createT023StateDissolutionScenario();
  return {
    ...scenario,
    dissolutionCriteria: {
      ...scenario.dissolutionCriteria,
      ...changes,
    },
  };
}

function withPlayerCountry(
  world: WorldState,
  changes: Partial<
    WorldState["countries"][typeof CONTACT_FIXTURE_COUNTRY_IDS.player]
  >,
): WorldState {
  const player = CONTACT_FIXTURE_COUNTRY_IDS.player;
  return {
    ...world,
    countries: {
      ...world.countries,
      [player]: { ...world.countries[player]!, ...changes },
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

function withAllLandHexesControlledByForeignCountry(
  world: WorldState,
): WorldState {
  const foreignController = {
    kind: "country" as const,
    countryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
  };

  return {
    ...world,
    landHexStates: Object.fromEntries(
      Object.keys(world.landHexStates).map((landHexId) => [
        landHexId,
        { controller: foreignController },
      ]),
    ) as WorldState["landHexStates"],
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

function activeCivilWar(): Conflict {
  return {
    id: asConflictId("t023.active-civil-war"),
    kind: "civilWar",
    status: "active",
    participantCountryIds: [
      CONTACT_FIXTURE_COUNTRY_IDS.player,
      CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
    ],
    participantFactionIds: [],
    affectedRegionIds: [],
    contestedRegionIds: [],
    startedAtTick: 0,
  };
}

function withGovernmentTransition(world: WorldState): WorldState {
  const player = CONTACT_FIXTURE_COUNTRY_IDS.player;
  const country = world.countries[player]!;
  const previousGovernmentId = country.currentGovernmentId!;
  const nextGovernmentId = asGovernmentId("t023.transition-government");

  return {
    ...world,
    governments: {
      ...world.governments,
      [previousGovernmentId]: {
        ...world.governments[previousGovernmentId]!,
        authority: "contender",
      },
      [nextGovernmentId]: {
        id: nextGovernmentId,
        countryId: player,
        name: "T023 전환 정부",
        authority: "central",
        formedAtTick: world.tick,
      },
    },
    countries: {
      ...world.countries,
      [player]: { ...country, currentGovernmentId: nextGovernmentId },
    },
  };
}

function withNoCurrentGovernment(world: WorldState): WorldState {
  const player = CONTACT_FIXTURE_COUNTRY_IDS.player;
  const country = world.countries[player]!;
  const currentGovernmentId = country.currentGovernmentId!;

  return {
    ...world,
    governments: {
      ...world.governments,
      [currentGovernmentId]: {
        ...world.governments[currentGovernmentId]!,
        authority: "contender",
      },
    },
    countries: {
      ...world.countries,
      [player]: { ...country, currentGovernmentId: null },
    },
  };
}

function step(
  scenario: ScenarioDefinition,
  world: WorldState,
): ReturnType<typeof runSimulationStep> {
  return runSimulationStep(world, { actions: [] }, {}, scenario);
}

describe("T023 state dissolution", () => {
  it("uses inclusive stateContinuity threshold semantics", () => {
    const scenario = scenarioWithCriteria({ stateContinuityAtOrBelow: 50 });
    const initial = createInitialWorldState(scenario, 23023);

    const above = withPlayerCountry(initial, { stateContinuity: 51 });
    const exact = withPlayerCountry(initial, { stateContinuity: 50 });
    const below = withPlayerCountry(initial, { stateContinuity: 49 });

    expect(
      deriveStateDissolutionEligibility(scenario, above).stateContinuity,
    ).toMatchObject({
      actual: 51,
      threshold: 50,
      satisfied: false,
      status: "notSatisfied",
    });
    expect(deriveStateDissolutionEligibility(scenario, above).dissolved).toBe(
      false,
    );
    expect(deriveStateDissolutionEligibility(scenario, exact)).toMatchObject({
      dissolved: true,
      reason: "stateContinuityThreshold",
      satisfiedCriteria: ["stateContinuityThreshold"],
    });
    expect(deriveStateDissolutionEligibility(scenario, below).dissolved).toBe(
      true,
    );
  });

  it("is a deterministic pure read model and ignores insertion order", () => {
    const scenario = createT023StateDissolutionScenario();
    const world = createInitialWorldState(scenario, 23023);
    const before = JSON.stringify(world);
    const reversed: WorldState = {
      ...world,
      countries: Object.fromEntries(Object.entries(world.countries).reverse()),
      regions: Object.fromEntries(Object.entries(world.regions).reverse()),
      landHexStates: Object.fromEntries(
        Object.entries(world.landHexStates).reverse(),
      ),
      conflicts: Object.fromEntries(Object.entries(world.conflicts).reverse()),
    };

    const first = deriveStateDissolutionEligibility(scenario, world);
    const second = deriveStateDissolutionEligibility(scenario, reversed);

    expect(first).toEqual(second);
    expect(deriveStateDissolutionEligibility(scenario, world)).toEqual(first);
    expect(JSON.stringify(world)).toBe(before);
  });

  it("defers unsupported annexation, fragmentation, and sovereign-function evidence", () => {
    const scenario = scenarioWithCriteria({
      fullAnnexationIsTerminal: true,
      permanentFragmentationIsTerminal: true,
      sovereignFunctionsRequiredForContinuity: [
        "civilAdministration",
        "fiscalAuthority",
      ],
    });
    const world = createInitialWorldState(scenario, 23023);
    const snapshot = deriveStateDissolutionEligibility(scenario, world);

    expect(snapshot.dissolved).toBe(false);
    expect(snapshot.deferredCriteria).toEqual([
      "fullAnnexation",
      "permanentFragmentation",
      "lossOfSovereignFunctions",
    ]);
    expect(snapshot.fullAnnexation).toMatchObject({
      configured: true,
      supported: false,
      status: "deferred",
      evidence: "notImplemented",
    });
    expect(snapshot.sovereignFunctions.requiredFunctions).toEqual([
      "civilAdministration",
      "fiscalAuthority",
    ]);
  });

  it("does not treat negative treasury, instability, state capacity, capital loss, or occupation as dissolution", () => {
    const scenario = createT023StateDissolutionScenario();
    const initial = createInitialWorldState(scenario, 23023);
    const stressed = withPlayerCountry(initial, {
      treasury: -5000,
      instability: 100,
      stateCapacity: 0,
    });
    const capitalLost = withLandHexController(
      stressed,
      CONTACT_FIXTURE_LAND_HEX_IDS.capitalWest,
      {
        kind: "country",
        countryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
      },
    );
    const fullyOccupied =
      withAllLandHexesControlledByForeignCountry(capitalLost);
    const snapshot = deriveStateDissolutionEligibility(scenario, fullyOccupied);
    const result = step(scenario, fullyOccupied);

    expect(snapshot.dissolved).toBe(false);
    expect(snapshot.reason).toBeNull();
    expect(result.nextWorld.run.outcome).toEqual({ status: "active" });
    expect(
      result.emittedEvents.some((event) => event.type === "STATE_DISSOLVED"),
    ).toBe(false);
  });

  it("keeps CountryId continuity across government transition and government absence", () => {
    const scenario = createT023StateDissolutionScenario();
    const world = createInitialWorldState(scenario, 23023);
    const transitioned = withGovernmentTransition(world);
    const absent = withNoCurrentGovernment(world);

    expect(transitioned.countries[CONTACT_FIXTURE_COUNTRY_IDS.player]?.id).toBe(
      CONTACT_FIXTURE_COUNTRY_IDS.player,
    );
    expect(
      deriveStateDissolutionEligibility(scenario, transitioned).dissolved,
    ).toBe(false);
    expect(deriveStateDissolutionEligibility(scenario, absent).dissolved).toBe(
      false,
    );
    expect(step(scenario, transitioned).nextWorld.run.outcome).toEqual({
      status: "active",
    });
  });

  it("does not treat regime or ideology state as defeat evidence", () => {
    const scenario = createT023StateDissolutionScenario();
    const world = createInitialWorldState(scenario, 23023);
    const player = CONTACT_FIXTURE_COUNTRY_IDS.player;
    const policy = world.policies[player]!;
    const changedPolicy = {
      ...policy,
      institutionalRules: {
        ...policy.institutionalRules,
        rulerVeto: false,
        legislatureRequired: true,
        suffrage: "universal" as const,
      },
    };
    const firstRegionId = Object.keys(
      world.regions,
    )[0] as keyof WorldState["regions"];
    const firstRegion = world.regions[firstRegionId]!;
    const regimeChanged: WorldState = {
      ...world,
      policies: { ...world.policies, [player]: changedPolicy },
      regions: {
        ...world.regions,
        [firstRegionId]: {
          ...firstRegion,
          ideology: Object.fromEntries(
            Object.entries(firstRegion.ideology).map(([ideologyId, state]) => [
              ideologyId,
              { ...state, support: 1, radicalism: 1, organization: 1 },
            ]),
          ),
        },
      },
    };

    expect(deriveRegimeClassification(policy).classification).not.toBe(
      deriveRegimeClassification(changedPolicy).classification,
    );
    expect(deriveStateDissolutionEligibility(scenario, regimeChanged)).toEqual(
      deriveStateDissolutionEligibility(scenario, world),
    );
  });

  it("does not treat an active civil war as dissolution", () => {
    const scenario = createT023StateDissolutionScenario();
    const world = createInitialWorldState(scenario, 23023);
    const civilWarWorld = withConflicts(world, [activeCivilWar()]);

    expect(
      deriveStateDissolutionEligibility(scenario, civilWarWorld).dissolved,
    ).toBe(false);
    expect(step(scenario, civilWarWorld).nextWorld.run.outcome).toEqual({
      status: "active",
    });
  });

  it("emits one deterministic STATE_DISSOLVED event and records its cause event", () => {
    const scenario = createT023StateDissolutionScenario();
    const initial = createInitialWorldState(scenario, 23023);
    const dissolved = withPlayerCountry(initial, { stateContinuity: 0 });
    const first = step(scenario, dissolved);
    const second = step(scenario, dissolved);

    expect(first.emittedEvents.map((event) => event.type)).toEqual([
      "STATE_DISSOLVED",
      "TICK_ADVANCED",
    ]);
    expect(first.emittedEvents[0]?.causeIds).toEqual([]);
    expect(first.emittedEvents[0]?.payload).toMatchObject({
      countryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
      reason: "stateContinuityThreshold",
      evaluatedAtTick: 1,
      sourceState: {
        stateContinuity: 0,
        stateContinuityThreshold: 0,
      },
    });
    expect(first.emittedEvents[0]?.sequence).toBe(0);
    expect(first.emittedEvents[1]?.sequence).toBe(1);
    expect(first.nextWorld.run.outcome).toMatchObject({
      status: "defeated",
      kind: "stateDissolved",
      countryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
      reason: "stateContinuityThreshold",
      atTick: 1,
      causeEventId: first.emittedEvents[0]?.id,
    });
    expect(first.nextWorld.countries).toBe(dissolved.countries);
    expect(first.nextWorld.rngState).toBe(dissolved.rngState);
    expect(first.emittedEvents).toEqual(second.emittedEvents);
    expect(first.nextWorld).toEqual(second.nextWorld);

    const terminal = step(scenario, first.nextWorld);
    expect(terminal.nextWorld).toBe(first.nextWorld);
    expect(terminal.emittedEvents).toEqual([]);
    expect(terminal.actionProposals).toEqual([]);
  });

  it("gives dissolution precedence over a final consolidation tick", () => {
    const scenario = createT022OrderConsolidationScenario();
    const initial = createInitialWorldState(scenario, 23023);
    const simultaneous: WorldState = {
      ...withPlayerCountry(initial, { stateContinuity: 0 }),
      run: {
        ...initial.run,
        consolidation: {
          isCurrentlyEligible: true,
          consecutiveEligibleTicks: 2,
          lastEvaluatedTick: 0,
        },
      },
    };

    expect(
      deriveStateDissolutionEligibility(scenario, simultaneous).dissolved,
    ).toBe(true);
    expect(
      runOrderConsolidationAndDissolutionPhase({
        phase: "evaluateOrderConsolidationAndDissolution",
        world: simultaneous,
        input: { actions: [] },
        nextTick: 1,
        emittedEvents: [],
        nextEventSequence: simultaneous.run.nextEventSequence,
        scenario,
      }).emittedEvents.map((event) => event.type),
    ).toEqual(["STATE_DISSOLVED"]);

    const result = step(scenario, simultaneous);
    expect(result.emittedEvents.map((event) => event.type)).toEqual([
      "STATE_DISSOLVED",
      "TICK_ADVANCED",
    ]);
    expect(
      result.emittedEvents.some((event) => event.type === "ORDER_CONSOLIDATED"),
    ).toBe(false);
    expect(result.nextWorld.run.consolidation).toEqual(
      simultaneous.run.consolidation,
    );
    expect(result.nextWorld.run.outcome).toMatchObject({
      status: "defeated",
      kind: "stateDissolved",
    });
  });

  it("does not replace an already-won outcome with dissolution", () => {
    const scenario = createT022OrderConsolidationScenario();
    const initial = createInitialWorldState(scenario, 23023);
    const first = step(scenario, initial);
    const second = step(scenario, first.nextWorld);
    const won = step(scenario, second.nextWorld).nextWorld;
    const changedAfterWin = withPlayerCountry(won, { stateContinuity: 0 });
    const result = step(scenario, changedAfterWin);

    expect(result.nextWorld).toBe(changedAfterWin);
    expect(result.nextWorld.run.outcome).toEqual(won.run.outcome);
    expect(result.emittedEvents).toEqual([]);
  });

  it("preserves the ordinary T022 path when dissolution is false", () => {
    const scenario = createT022OrderConsolidationScenario();
    const initial = createInitialWorldState(scenario, 23023);
    const first = step(scenario, initial);
    const second = step(scenario, first.nextWorld);
    const third = step(scenario, second.nextWorld);

    expect(first.emittedEvents.map((event) => event.type)).toEqual([
      "ORDER_CONSOLIDATION_STARTED",
      "TICK_ADVANCED",
    ]);
    expect(third.emittedEvents.map((event) => event.type)).toEqual([
      "ORDER_CONSOLIDATED",
      "TICK_ADVANCED",
    ]);
    expect(third.nextWorld.run.outcome).toMatchObject({
      status: "won",
      kind: "orderConsolidated",
    });
    expect(
      third.emittedEvents.some((event) => event.type === "STATE_DISSOLVED"),
    ).toBe(false);
  });
});
