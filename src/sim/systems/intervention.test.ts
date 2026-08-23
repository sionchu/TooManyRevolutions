import { describe, expect, it } from "vitest";

import { appendEvent, createEventStore } from "../events/eventStore";
import { assertWorldStateInvariants } from "../core/invariants";
import { runSimulationStep } from "../core/tick";
import {
  acceptActionProposal,
  createStartInterventionActionProposal,
} from "../state/action";
import {
  deriveAdministrativeHeadroom,
  deriveAdministrativeOverload,
  deriveCommittedAdministrativeLoad,
  evaluateInterventionFeasibility,
  type InterventionCommitment,
} from "../state/intervention";
import {
  INTERVENTION_FIXTURE_IDS,
  createInterventionFixtureScenario,
} from "../state/interventionFixture";
import {
  asActionId,
  asEventId,
  asInterventionCommitmentId,
  asInterventionId,
  type CountryId,
  type InterventionId,
} from "../state/ids";
import type { SimulationPhaseContext } from "../core/step";
import { createPolicyAndInterventionPhaseHook } from "./actionResolution";
import { runInterventionResolutionPhase } from "./intervention";
import { createInterventionPhaseHooks } from "./interventionHooks";
import { deriveNationalAgendas } from "../readModels/agenda";
import { createInitialWorldState, type WorldState } from "../state/world";

function createFixtureWorld(): {
  readonly scenario: ReturnType<typeof createInterventionFixtureScenario>;
  readonly world: WorldState;
  readonly countryId: CountryId;
} {
  const scenario = createInterventionFixtureScenario();
  const countryId = scenario.playerCountryId;

  if (countryId === null) {
    throw new Error("T016B fixture must have a player country.");
  }

  return {
    scenario,
    world: createInitialWorldState(scenario, 160),
    countryId,
  };
}

function createStartAction(
  world: WorldState,
  interventionId: InterventionId,
  source: "player" | "heuristic" | "llm" = "player",
) {
  return acceptActionProposal(
    createStartInterventionActionProposal(
      world.tick + 1,
      source,
      interventionId,
    ),
    world.run.nextActionSequence,
  );
}

function createStartActions(
  world: WorldState,
  interventionIds: readonly InterventionId[],
) {
  return interventionIds.map((interventionId, index) =>
    acceptActionProposal(
      createStartInterventionActionProposal(
        world.tick + 1,
        "player",
        interventionId,
      ),
      world.run.nextActionSequence + index,
    ),
  );
}

function runInterventionStep(
  scenario: ReturnType<typeof createInterventionFixtureScenario>,
  world: WorldState,
  actions: readonly ReturnType<typeof createStartAction>[] = [],
) {
  return runSimulationStep(
    world,
    { actions },
    createInterventionPhaseHooks(scenario),
  );
}

function withLegislatureRequired(world: WorldState): WorldState {
  const countryId = Object.keys(world.countries)[0] as CountryId;
  const policyState = world.policies[countryId];

  if (policyState === undefined) {
    throw new Error("T016B fixture policy state is missing.");
  }

  return {
    ...world,
    policies: {
      ...world.policies,
      [countryId]: {
        ...policyState,
        institutionalRules: {
          ...policyState.institutionalRules,
          legislatureRequired: true,
        },
      },
    },
  };
}

function withCommitments(
  world: WorldState,
  commitments: readonly InterventionCommitment[],
): WorldState {
  return {
    ...world,
    interventionCommitments: Object.fromEntries(
      commitments.map((commitment) => [commitment.id, commitment]),
    ),
  } as WorldState;
}

function activeCommitment(
  countryId: CountryId,
  id: string,
  interventionId: InterventionId,
  administrativeLoad: number,
  completionTick = 100,
): InterventionCommitment {
  const commitmentId = asInterventionCommitmentId(id);
  return {
    id: commitmentId,
    interventionId,
    countryId,
    sourceActionId: asActionId(`fixture-source:${id}`),
    startedTick: 0,
    firstOccupiedTick: 0,
    completionTick,
    administrativeLoad,
  };
}

function eventTypes(result: ReturnType<typeof runInterventionStep>) {
  return result.emittedEvents.map((event) => event.type);
}

describe("T016B intervention capacity and feasibility", () => {
  it("keeps static definitions in ScenarioDefinition and runtime commitments in WorldState", () => {
    const { scenario, world } = createFixtureWorld();

    expect(
      scenario.interventionCatalog[INTERVENTION_FIXTURE_IDS.short],
    ).toBeDefined();
    expect(world.interventionCommitments).toEqual({});
    expect(world).not.toHaveProperty("interventionCatalog");
  });

  it("does not subtract stateCapacity when an intervention starts", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const result = runInterventionStep(scenario, world, [
      createStartAction(world, INTERVENTION_FIXTURE_IDS.short),
    ]);

    expect(result.nextWorld.countries[countryId]?.stateCapacity).toBe(60);
  });

  it("sums active administrative load by country", () => {
    const { world, countryId } = createFixtureWorld();
    const committedWorld = withCommitments(world, [
      activeCommitment(countryId, "load-a", INTERVENTION_FIXTURE_IDS.short, 12),
      activeCommitment(countryId, "load-b", INTERVENTION_FIXTURE_IDS.long, 15),
    ]);

    expect(deriveCommittedAdministrativeLoad(committedWorld, countryId)).toBe(
      27,
    );
  });

  it("derives headroom as max(0, stateCapacity - committedLoad)", () => {
    const { world, countryId } = createFixtureWorld();
    const committedWorld = withCommitments(world, [
      activeCommitment(countryId, "load-a", INTERVENTION_FIXTURE_IDS.short, 27),
    ]);

    expect(deriveAdministrativeHeadroom(committedWorld, countryId)).toBe(33);
  });

  it("derives overload without clamping away the diagnostic", () => {
    const { world, countryId } = createFixtureWorld();
    const overloadedWorld = withCommitments(world, [
      activeCommitment(countryId, "load-a", INTERVENTION_FIXTURE_IDS.short, 70),
    ]);

    expect(deriveAdministrativeHeadroom(overloadedWorld, countryId)).toBe(0);
    expect(deriveAdministrativeOverload(overloadedWorld, countryId)).toBe(10);
  });

  it("uses full state capacity as headroom when no commitment is active", () => {
    const { world, countryId } = createFixtureWorld();

    expect(deriveAdministrativeHeadroom(world, countryId)).toBe(60);
  });

  it("starts when treasury, headroom, and institutional prerequisites are sufficient", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const eligibleWorld = withLegislatureRequired(world);
    const feasibility = evaluateInterventionFeasibility({
      scenario,
      world: eligibleWorld,
      interventionId: INTERVENTION_FIXTURE_IDS.prerequisite,
      countryId,
    });

    expect(feasibility.feasible).toBe(true);
    expect(
      runInterventionStep(scenario, eligibleWorld, [
        createStartAction(eligibleWorld, INTERVENTION_FIXTURE_IDS.prerequisite),
      ]).nextWorld.interventionCommitments,
    ).toHaveProperty("commitment:action:1:0:player:START_INTERVENTION");
  });

  it("rejects insufficient treasury deterministically", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const poorWorld: WorldState = {
      ...world,
      countries: {
        ...world.countries,
        [countryId]: { ...world.countries[countryId]!, treasury: 7 },
      },
    };
    const feasibility = evaluateInterventionFeasibility({
      scenario,
      world: poorWorld,
      interventionId: INTERVENTION_FIXTURE_IDS.short,
      countryId,
    });

    expect(feasibility.reasons[0]?.kind).toBe("INSUFFICIENT_TREASURY");
  });

  it("rejects insufficient headroom", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const committedWorld = withCommitments(world, [
      activeCommitment(countryId, "load-a", INTERVENTION_FIXTURE_IDS.long, 50),
    ]);
    const feasibility = evaluateInterventionFeasibility({
      scenario,
      world: committedWorld,
      interventionId: INTERVENTION_FIXTURE_IDS.short,
      countryId,
    });

    expect(feasibility.reasons[0]?.kind).toBe(
      "INSUFFICIENT_ADMINISTRATIVE_HEADROOM",
    );
  });

  it("rejects an unmet institutional prerequisite", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const feasibility = evaluateInterventionFeasibility({
      scenario,
      world,
      interventionId: INTERVENTION_FIXTURE_IDS.prerequisite,
      countryId,
    });

    expect(feasibility.feasible).toBe(false);
    expect(feasibility.reasons.at(-1)?.kind).toBe("PREREQUISITE_NOT_MET");
  });

  it("does not create a commitment for a rejected request", () => {
    const { scenario, world } = createFixtureWorld();
    const result = runInterventionStep(scenario, world, [
      createStartAction(world, INTERVENTION_FIXTURE_IDS.prerequisite),
    ]);

    expect(result.nextWorld.interventionCommitments).toEqual({});
    expect(eventTypes(result)).toContain("INTERVENTION_REJECTED");
  });

  it("does not charge treasury for a rejected request", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const result = runInterventionStep(scenario, world, [
      createStartAction(world, INTERVENTION_FIXTURE_IDS.prerequisite),
    ]);

    expect(result.nextWorld.countries[countryId]?.treasury).toBe(100);
    expect(
      result.emittedEvents.some(
        (event) =>
          event.type === "TREASURY_CHANGED" &&
          (event.payload as { readonly delta?: number }).delta !== 0,
      ),
    ).toBe(false);
  });

  it("creates an active commitment and started event for an accepted action", () => {
    const { scenario, world } = createFixtureWorld();
    const result = runInterventionStep(scenario, world, [
      createStartAction(world, INTERVENTION_FIXTURE_IDS.short),
    ]);

    expect(Object.keys(result.nextWorld.interventionCommitments)).toHaveLength(
      1,
    );
    expect(eventTypes(result).slice(0, 2)).toEqual([
      "INTERVENTION_STARTED",
      "TREASURY_CHANGED",
    ]);
  });

  it("keeps accepted administrative load occupied in the resulting state", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const result = runInterventionStep(scenario, world, [
      createStartAction(world, INTERVENTION_FIXTURE_IDS.short),
    ]);

    expect(deriveCommittedAdministrativeLoad(result.nextWorld, countryId)).toBe(
      12,
    );
  });

  it("keeps a long commitment occupied until its completion tick", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const result = runInterventionStep(scenario, world, [
      createStartAction(world, INTERVENTION_FIXTURE_IDS.long),
    ]);
    const commitment = Object.values(
      result.nextWorld.interventionCommitments,
    )[0];

    expect(commitment?.startedTick).toBe(1);
    expect(commitment?.firstOccupiedTick).toBe(1);
    expect(commitment?.completionTick).toBe(181);
    expect(deriveCommittedAdministrativeLoad(result.nextWorld, countryId)).toBe(
      15,
    );
  });

  it("releases load exactly at the next tick after a one-day intervention starts", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const started = runInterventionStep(scenario, world, [
      createStartAction(world, INTERVENTION_FIXTURE_IDS.short),
    ]).nextWorld;
    const completedResult = runInterventionStep(scenario, started);

    expect(completedResult.nextWorld.tick).toBe(2);
    expect(
      deriveCommittedAdministrativeLoad(completedResult.nextWorld, countryId),
    ).toBe(0);
    expect(eventTypes(completedResult)).toContain("INTERVENTION_COMPLETED");
  });

  it("releases a completed commitment before same-tick feasibility checks", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const expiringWorld = withCommitments(world, [
      activeCommitment(
        countryId,
        "expires-at-one",
        INTERVENTION_FIXTURE_IDS.long,
        50,
        1,
      ),
    ]);
    const result = runInterventionStep(scenario, expiringWorld, [
      createStartAction(expiringWorld, INTERVENTION_FIXTURE_IDS.long),
    ]);

    expect(eventTypes(result).slice(0, 2)).toEqual([
      "INTERVENTION_COMPLETED",
      "INTERVENTION_STARTED",
    ]);
    expect(deriveCommittedAdministrativeLoad(result.nextWorld, countryId)).toBe(
      15,
    );
  });

  it("has no off-by-one daily progress event", () => {
    const { scenario, world } = createFixtureWorld();
    const started = runInterventionStep(scenario, world, [
      createStartAction(world, INTERVENTION_FIXTURE_IDS.long),
    ]).nextWorld;
    const nextDay = runInterventionStep(scenario, started);

    expect(nextDay.emittedEvents.map((event) => event.type)).not.toContain(
      "INTERVENTION_PROGRESS",
    );
    expect(nextDay.emittedEvents.map((event) => event.type)).not.toContain(
      "INTERVENTION_COMPLETED",
    );
  });

  it("preserves commitments if stateCapacity later drops below their load", () => {
    const { world, countryId } = createFixtureWorld();
    const committedWorld = withCommitments(world, [
      activeCommitment(countryId, "load-a", INTERVENTION_FIXTURE_IDS.long, 50),
    ]);
    const reducedCapacity: WorldState = {
      ...committedWorld,
      countries: {
        ...committedWorld.countries,
        [countryId]: {
          ...committedWorld.countries[countryId]!,
          stateCapacity: 40,
        },
      },
    };

    expect(reducedCapacity.interventionCommitments).toEqual(
      committedWorld.interventionCommitments,
    );
    expect(deriveAdministrativeOverload(reducedCapacity, countryId)).toBe(10);
  });

  it("blocks an additional start while the country is overloaded", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const overloaded = withCommitments(
      {
        ...world,
        countries: {
          ...world.countries,
          [countryId]: { ...world.countries[countryId]!, stateCapacity: 40 },
        },
      },
      [
        activeCommitment(
          countryId,
          "load-a",
          INTERVENTION_FIXTURE_IDS.long,
          50,
        ),
      ],
    );
    const result = runInterventionStep(scenario, overloaded, [
      createStartAction(overloaded, INTERVENTION_FIXTURE_IDS.short),
    ]);

    expect(result.nextWorld.interventionCommitments).toEqual(
      overloaded.interventionCommitments,
    );
  });

  it("uses global ActionRecord sequence for same-tick competition", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const eligibleWorld = withLegislatureRequired(
      withCommitments(world, [
        activeCommitment(
          countryId,
          "load-a",
          INTERVENTION_FIXTURE_IDS.long,
          40,
        ),
      ]),
    );
    const actions = createStartActions(eligibleWorld, [
      INTERVENTION_FIXTURE_IDS.prerequisite,
      INTERVENTION_FIXTURE_IDS.prerequisite,
    ]);
    const result = runInterventionStep(scenario, eligibleWorld, actions);

    expect(
      result.emittedEvents.filter(
        (event) => event.type === "INTERVENTION_STARTED",
      ),
    ).toHaveLength(1);
    expect(
      result.emittedEvents.filter(
        (event) => event.type === "INTERVENTION_REJECTED",
      ),
    ).toHaveLength(1);
  });

  it("lets an earlier accepted action cause a later same-tick rejection", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const eligibleWorld = withLegislatureRequired(
      withCommitments(world, [
        activeCommitment(
          countryId,
          "load-a",
          INTERVENTION_FIXTURE_IDS.long,
          40,
        ),
      ]),
    );
    const [first, second] = createStartActions(eligibleWorld, [
      INTERVENTION_FIXTURE_IDS.prerequisite,
      INTERVENTION_FIXTURE_IDS.prerequisite,
    ]);
    const result = runInterventionStep(scenario, eligibleWorld, [
      first!,
      second!,
    ]);

    expect(result.emittedEvents[0]?.type).toBe("INTERVENTION_STARTED");
    expect(result.emittedEvents[1]?.type).toBe("INTERVENTION_REJECTED");
    expect(
      (
        result.emittedEvents[1]?.payload as {
          readonly reasons?: readonly { readonly kind: string }[];
        }
      ).reasons?.[0]?.kind,
    ).toBe("INSUFFICIENT_ADMINISTRATIVE_HEADROOM");
  });

  it("is independent of proposal object insertion order after sequence sorting", () => {
    const first = createFixtureWorld();
    const second = createFixtureWorld();
    const firstActions = createStartActions(first.world, [
      INTERVENTION_FIXTURE_IDS.short,
      INTERVENTION_FIXTURE_IDS.long,
    ]);
    const secondActions = [...firstActions].sort(
      (left, right) => right.sequence - left.sequence,
    );
    const firstResult = runInterventionStep(
      first.scenario,
      first.world,
      firstActions,
    );
    const secondResult = runInterventionStep(
      second.scenario,
      second.world,
      [...secondActions].sort((left, right) => left.sequence - right.sequence),
    );

    expect(secondResult).toEqual(firstResult);
  });

  it("leaves treasury mutation to the canonical economy writer", () => {
    const { scenario, world } = createFixtureWorld();
    const action = createStartAction(world, INTERVENTION_FIXTURE_IDS.short);
    const context: SimulationPhaseContext = {
      phase: "resolveValidatedActions",
      world,
      input: { actions: [action] },
      nextTick: 1,
      emittedEvents: [],
      nextEventSequence: 0,
    };
    const result = runInterventionResolutionPhase(context, scenario);

    expect(
      result.nextWorld.countries[scenario.playerCountryId!]?.treasury,
    ).toBe(100);
  });

  it("settles multiple same-tick accepted costs once", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const result = runInterventionStep(
      scenario,
      world,
      createStartActions(world, [
        INTERVENTION_FIXTURE_IDS.short,
        INTERVENTION_FIXTURE_IDS.short,
      ]),
    );
    const treasuryEvent = result.emittedEvents.find(
      (event) => event.type === "TREASURY_CHANGED",
    );

    expect(result.nextWorld.countries[countryId]?.treasury).toBe(84);
    expect(treasuryEvent?.payload).toMatchObject({
      interventionCost: 16,
    });
  });

  it("emits treasury cost only for accepted commitments", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const actions = [
      createStartAction(world, INTERVENTION_FIXTURE_IDS.short),
      acceptActionProposal(
        createStartInterventionActionProposal(
          world.tick + 1,
          "player",
          asInterventionIdForTest("missing"),
        ),
        world.run.nextActionSequence + 1,
      ),
    ];
    const result = runInterventionStep(scenario, world, actions);
    const treasuryEvent = result.emittedEvents.find(
      (event) => event.type === "TREASURY_CHANGED",
    );

    expect(result.nextWorld.countries[countryId]?.treasury).toBe(92);
    expect(treasuryEvent?.payload).toMatchObject({ interventionCost: 8 });
    expect(eventTypes(result)).toEqual([
      "INTERVENTION_STARTED",
      "INTERVENTION_REJECTED",
      "TREASURY_CHANGED",
      "TICK_ADVANCED",
    ]);
  });

  it("keeps started/rejected/completed event order deterministic", () => {
    const { scenario, world } = createFixtureWorld();
    const started = runInterventionStep(scenario, world, [
      createStartAction(world, INTERVENTION_FIXTURE_IDS.short),
    ]).nextWorld;
    const completed = runInterventionStep(scenario, started);

    expect(completed.emittedEvents.map((event) => event.sequence)).toEqual([
      3, 4,
    ]);
    expect(completed.emittedEvents[0]?.type).toBe("INTERVENTION_COMPLETED");
    expect(completed.emittedEvents[1]?.type).toBe("TICK_ADVANCED");
  });

  it("does not emit daily progress spam", () => {
    const { scenario, world } = createFixtureWorld();
    let current = runInterventionStep(scenario, world, [
      createStartAction(world, INTERVENTION_FIXTURE_IDS.long),
    ]).nextWorld;
    const emittedTypes: string[] = [];

    for (let day = 0; day < 5; day += 1) {
      const result = runInterventionStep(scenario, current);
      current = result.nextWorld;
      emittedTypes.push(...eventTypes(result));
    }

    expect(emittedTypes).not.toContain("INTERVENTION_PROGRESS");
    expect(emittedTypes).not.toContain("INTERVENTION_COMPLETED");
  });

  it("keeps the input WorldState immutable", () => {
    const { scenario, world } = createFixtureWorld();
    const before = JSON.parse(JSON.stringify(world));

    runInterventionStep(scenario, world, [
      createStartAction(world, INTERVENTION_FIXTURE_IDS.short),
    ]);

    expect(world).toEqual(before);
  });

  it("does not create an intervention for a terminal run", () => {
    const { scenario, world } = createFixtureWorld();
    const terminalWorld: WorldState = {
      ...world,
      run: {
        ...world.run,
        outcome: {
          status: "won",
          kind: "orderConsolidated",
          atTick: 0,
          causeEventId: asEventId("event:0:0:ORDER_CONSOLIDATED"),
        },
      },
    };
    const result = runInterventionStep(scenario, terminalWorld, [
      createStartAction(terminalWorld, INTERVENTION_FIXTURE_IDS.short),
    ]);

    expect(result.nextWorld).toBe(terminalWorld);
    expect(result.emittedEvents).toEqual([]);
  });

  it("does not consume RNG or wall-clock state", () => {
    const { scenario, world } = createFixtureWorld();
    const first = runInterventionStep(scenario, world, [
      createStartAction(world, INTERVENTION_FIXTURE_IDS.short),
    ]);
    const second = runInterventionStep(scenario, world, [
      createStartAction(world, INTERVENTION_FIXTURE_IDS.short),
    ]);

    expect(first.nextWorld.rngState).toEqual(world.rngState);
    expect(first).toEqual(second);
  });

  it("does not add politicalPower or policyPoint fields", () => {
    const { scenario, world } = createFixtureWorld();
    const result = runInterventionStep(scenario, world, [
      createStartAction(world, INTERVENTION_FIXTURE_IDS.short),
    ]);
    const serialized = JSON.stringify(result.nextWorld);

    expect(serialized).not.toContain("politicalPower");
    expect(serialized).not.toContain("policyPoints");
    expect(serialized).not.toContain("interventionMana");
  });

  it("keeps the existing T016A agenda category contract honest", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const pressuredWorld: WorldState = {
      ...world,
      countries: {
        ...world.countries,
        [countryId]: { ...world.countries[countryId]!, treasury: -100 },
      },
    };
    const agendas = deriveNationalAgendas({
      scenario,
      world: pressuredWorld,
    });

    expect(
      agendas.flatMap((agenda) => agenda.interventionCategories),
    ).not.toContain("administrative");
  });

  it("accepts event causes because start is emitted before economy settlement", () => {
    const { scenario, world } = createFixtureWorld();
    const result = runInterventionStep(scenario, world, [
      createStartAction(world, INTERVENTION_FIXTURE_IDS.short),
    ]);
    const store = result.emittedEvents.reduce(
      (currentStore, event) => appendEvent(currentStore, event),
      createEventStore(),
    );
    const started = store.events.find(
      (event) => event.type === "INTERVENTION_STARTED",
    );
    const treasury = store.events.find(
      (event) => event.type === "TREASURY_CHANGED",
    );

    expect(started).toBeDefined();
    expect(treasury?.causeIds).toContain(started?.id);
  });

  it("serializes active commitments as runtime JSON state", () => {
    const { scenario, world } = createFixtureWorld();
    const result = runInterventionStep(scenario, world, [
      createStartAction(world, INTERVENTION_FIXTURE_IDS.long),
    ]);

    expect(JSON.parse(JSON.stringify(result.nextWorld))).toEqual(
      result.nextWorld,
    );
    expect(() => assertWorldStateInvariants(result.nextWorld)).not.toThrow();
  });

  it("keeps the country continuity and current policy state unchanged on start", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const result = runInterventionStep(scenario, world, [
      createStartAction(world, INTERVENTION_FIXTURE_IDS.short),
    ]);

    expect(result.nextWorld.countries[countryId]?.id).toBe(countryId);
    expect(result.nextWorld.policies[countryId]).toEqual(
      world.policies[countryId],
    );
  });

  it("uses actual institutional rule data rather than a political score", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const eligible = withLegislatureRequired(world);
    const result = evaluateInterventionFeasibility({
      scenario,
      world: eligible,
      interventionId: INTERVENTION_FIXTURE_IDS.prerequisite,
      countryId,
    });

    expect(result.feasible).toBe(true);
    expect(result).not.toHaveProperty("politicalPower");
  });

  it("keeps feasibility pure and does not write events", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const before = JSON.parse(JSON.stringify(world));
    const result = evaluateInterventionFeasibility({
      scenario,
      world,
      interventionId: INTERVENTION_FIXTURE_IDS.short,
      countryId,
    });

    expect(result.feasible).toBe(true);
    expect(world).toEqual(before);
  });

  it("preserves the phase boundary when policy and intervention actions share a tick", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const policyAndInterventionResult = runSimulationStep(
      world,
      {
        actions: [createStartAction(world, INTERVENTION_FIXTURE_IDS.short)],
      },
      {
        resolveValidatedActions: createPolicyAndInterventionPhaseHook(scenario),
      },
    );

    expect(
      policyAndInterventionResult.nextWorld.interventionCommitments,
    ).not.toEqual({});
    expect(
      policyAndInterventionResult.nextWorld.countries[countryId]?.treasury,
    ).toBe(100);
  });

  it("keeps the action log globally ordered for player and heuristic sources", () => {
    const { scenario, world } = createFixtureWorld();
    const playerAction = createStartAction(
      world,
      INTERVENTION_FIXTURE_IDS.short,
    );
    const heuristicAction = acceptActionProposal(
      createStartInterventionActionProposal(
        world.tick + 1,
        "heuristic",
        INTERVENTION_FIXTURE_IDS.long,
      ),
      1,
    );
    const result = runInterventionStep(scenario, world, [
      playerAction,
      heuristicAction,
    ]);

    expect(
      result.nextWorld.run.actionLog.map((action) => action.sequence),
    ).toEqual([0, 1]);
    expect(
      result.nextWorld.run.actionLog.map((action) => action.source),
    ).toEqual(["player", "heuristic"]);
  });

  it("validates the final result with the shared invariants", () => {
    const { scenario, world } = createFixtureWorld();
    const result = runInterventionStep(scenario, world, [
      createStartAction(world, INTERVENTION_FIXTURE_IDS.short),
    ]);

    expect(() => assertWorldStateInvariants(result.nextWorld)).not.toThrow();
  });

  it("keeps the input action's tick authoritative", () => {
    const { scenario, world } = createFixtureWorld();
    const wrongTickAction = acceptActionProposal(
      createStartInterventionActionProposal(
        world.tick + 2,
        "player",
        INTERVENTION_FIXTURE_IDS.short,
      ),
      0,
    );

    expect(() =>
      runInterventionStep(scenario, world, [wrongTickAction]),
    ).toThrow("must target the next simulation tick");
  });

  it("does not treat a negative baseline treasury as a new loan", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const negativeWorld: WorldState = {
      ...world,
      countries: {
        ...world.countries,
        [countryId]: { ...world.countries[countryId]!, treasury: -1 },
      },
    };
    const result = runInterventionStep(scenario, negativeWorld, [
      createStartAction(negativeWorld, INTERVENTION_FIXTURE_IDS.short),
    ]);

    expect(result.nextWorld.interventionCommitments).toEqual({});
    expect(result.nextWorld.countries[countryId]?.treasury).toBe(-1);
  });
});

function asInterventionIdForTest(value: string): InterventionId {
  return asInterventionId(value);
}
