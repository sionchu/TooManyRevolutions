import { describe, expect, it } from "vitest";

import { createSimDate } from "../core/clock";
import type { SimulationPhaseHook, SimulationPhaseHooks } from "../core/step";
import { runSimulationStep } from "../core/tick";
import {
  acceptActionProposal,
  acceptActionProposals,
  type ActionProposal,
} from "../state/action";
import {
  CONTACT_FIXTURE_COUNTRY_IDS,
  CONTACT_FIXTURE_EDGE_IDS,
  CONTACT_FIXTURE_REGION_IDS,
  createContactFixtureScenario,
} from "../state/contactFixture";
import type { Country } from "../state/country";
import { asContactEdgeId, asEventId } from "../state/ids";
import { createInitialWorldState, type WorldState } from "../state/world";
import {
  acceptDiplomacyActionProposal,
  chooseForeignActionProposal,
  chooseForeignActionType,
  deriveForeignActionProposals,
  deriveForeignStateObservation,
  deriveForeignStateObservations,
  FOREIGN_POLICY_BORDER_CLOSURE_REASON,
  runDiplomacyPhase,
  toDiplomacyActionProposal,
} from "./diplomacy";

const NOOP_PHASE: SimulationPhaseHook = (context) => ({
  nextWorld: context.world,
  emittedEvents: [],
  nextEventSequence: context.nextEventSequence,
});

const DIPLOMACY_ONLY_HOOKS: SimulationPhaseHooks = {
  applyScheduledEffects: NOOP_PHASE,
  resolveValidatedActions: NOOP_PHASE,
  economy: NOOP_PHASE,
  resources: NOOP_PHASE,
  ideologyDiffusion: NOOP_PHASE,
  factionPressure: NOOP_PHASE,
  instability: NOOP_PHASE,
  diplomacy: runDiplomacyPhase,
  conflict: NOOP_PHASE,
  evaluateOrderConsolidationAndDissolution: NOOP_PHASE,
  eventFinalization: NOOP_PHASE,
  snapshotHook: NOOP_PHASE,
};

function createFixtureScenario() {
  return {
    ...createContactFixtureScenario(),
    initialDate: createSimDate(1, 1, 1),
  };
}

function createMonthlyFixtureScenario() {
  return {
    ...createFixtureScenario(),
    initialDate: createSimDate(1, 1, 30),
  };
}

function createFixtureWorld() {
  const scenario = createFixtureScenario();
  return { scenario, world: createInitialWorldState(scenario, 19019) };
}

function updateCountry(
  world: WorldState,
  countryId: Country["id"],
  patch: Partial<Country>,
): WorldState {
  const country = world.countries[countryId];
  if (country === undefined) {
    throw new Error(`T019 test country ${countryId} is missing.`);
  }

  return {
    ...world,
    countries: {
      ...world.countries,
      [countryId]: { ...country, ...patch },
    },
  };
}

function makeAction(
  tick: number,
  sequence: number,
  actionType: ActionProposal["actionType"],
  payload: ActionProposal["payload"],
) {
  return acceptActionProposal(
    {
      tick,
      source: "heuristic",
      actionType,
      payload,
      schemaVersion: 1,
    },
    sequence,
  );
}

function runDiplomacyStep(
  scenario: ReturnType<typeof createFixtureScenario>,
  world: WorldState,
  actions: readonly ReturnType<typeof makeAction>[] = [],
) {
  return runSimulationStep(world, { actions }, DIPLOMACY_ONLY_HOOKS, scenario);
}

function addMerchantToMonarchyBorder(
  scenario: ReturnType<typeof createFixtureScenario>,
) {
  return {
    ...scenario,
    mapContactTopology: {
      ...scenario.mapContactTopology,
      contactEdges: [
        ...scenario.mapContactTopology.contactEdges,
        {
          id: asContactEdgeId("t019.merchant-to-monarchy-border"),
          fromRegionId: CONTACT_FIXTURE_REGION_IDS.merchantPort,
          toRegionId: CONTACT_FIXTURE_REGION_IDS.monarchyBorder,
          channel: "border" as const,
          baseStrength: 0.5,
        },
      ],
    },
  };
}

describe("T019 diplomacy / foreign state baseline", () => {
  it("derives a bounded observation from Country, directed contacts, conflicts, and territorial projection", () => {
    const { scenario, world } = createFixtureWorld();
    const before = JSON.parse(JSON.stringify(world));
    const observation = deriveForeignStateObservation(
      scenario,
      world,
      CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
    );

    expect(observation.actorCountryId).toBe(
      CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
    );
    expect(observation.ownState.currentGovernmentId).not.toBeNull();
    expect(observation.ownState.fullyControlledRegionIds).toEqual([
      CONTACT_FIXTURE_REGION_IDS.monarchyBorder,
    ]);
    expect(observation.contacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          edgeId: CONTACT_FIXTURE_EDGE_IDS.monarchyToBorder,
          fromCountryId: CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
          toCountryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
          channel: "border",
          enabled: true,
          effectiveStrength: 0.7,
        }),
      ]),
    );
    expect(observation.availableActions).toEqual({
      CLOSE_BORDER: true,
      REOPEN_BORDER: false,
      RESTRICT_INCOMING_BORDER: false,
      RESTORE_INCOMING_BORDER: false,
      WAIT: true,
    });
    expect(world).toEqual(before);
  });

  it("returns all surviving non-player Countries in stable CountryId order", () => {
    const scenario = createFixtureScenario();
    const world = createInitialWorldState(scenario, 19019);
    const observations = deriveForeignStateObservations(scenario, world);

    expect(
      observations.map((observation) => observation.actorCountryId),
    ).toEqual([
      CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
      CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
    ]);
    expect(
      observations.every(
        (observation) =>
          observation.actorCountryId !== scenario.playerCountryId,
      ),
    ).toBe(true);
  });

  it("uses WAIT for a stable country with an open border", () => {
    const { scenario, world } = createFixtureWorld();
    const observation = deriveForeignStateObservation(
      scenario,
      world,
      CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
    );

    expect(chooseForeignActionType(observation)).toBe("WAIT");
    expect(
      chooseForeignActionProposal(
        scenario,
        world,
        CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
        1,
      ),
    ).toMatchObject({
      actionType: "WAIT",
      payload: {
        actorCountryId: CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
      },
    });
  });

  it("selects CLOSE_BORDER for domestic weakness and the strongest directed border target", () => {
    const { scenario, world: initialWorld } = createFixtureWorld();
    const world = updateCountry(
      initialWorld,
      CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
      { instability: 80 },
    );
    const proposal = chooseForeignActionProposal(
      scenario,
      world,
      CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
      1,
    );

    expect(proposal).toMatchObject({
      actionType: "CLOSE_BORDER",
      payload: {
        actorCountryId: CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
        targetCountryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
      },
    });
  });

  it("does not use ideology or regime names as a T020 motive", () => {
    const { scenario, world } = createFixtureWorld();
    const proposal = chooseForeignActionProposal(
      scenario,
      world,
      CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
      1,
    );

    expect(proposal.actionType).toBe("WAIT");
    expect(
      deriveForeignStateObservation(scenario, world, proposal.actorCountryId),
    ).not.toHaveProperty("ideology");
  });

  it("generates at most one proposal per foreign Country only at the monthly boundary", () => {
    const scenario = createMonthlyFixtureScenario();
    const world = createInitialWorldState(scenario, 19019);
    const boundary = deriveForeignActionProposals(scenario, world, 1);
    const nonBoundary = deriveForeignActionProposals(
      scenario,
      { ...world, date: createSimDate(1, 1, 1) },
      1,
    );

    expect(boundary).toHaveLength(2);
    expect(boundary.map((proposal) => proposal.actorCountryId)).toEqual([
      CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
      CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
    ]);
    expect(nonBoundary).toEqual([]);
  });

  it("uses the common ActionProposal to ActionRecord path with heuristic source and global sequence", () => {
    const scenario = createMonthlyFixtureScenario();
    const world = createInitialWorldState(scenario, 19019);
    const proposals = deriveForeignActionProposals(scenario, world, 1);
    const actions = acceptActionProposals(
      proposals.map((proposal) => toDiplomacyActionProposal(proposal, 1)),
      world.run.nextActionSequence,
    );

    expect(actions.map((action) => action.sequence)).toEqual([0, 1]);
    expect(actions.every((action) => action.source === "heuristic")).toBe(true);
    expect(
      actions.every((action) => action.validationOutcome.kind === "accepted"),
    ).toBe(true);
  });

  it("closes only actor-to-target directed border edges and leaves topology/reverse edge/territory unchanged", () => {
    const { scenario, world: initialWorld } = createFixtureWorld();
    const world = updateCountry(
      initialWorld,
      CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
      { instability: 80 },
    );
    const proposal = chooseForeignActionProposal(
      scenario,
      world,
      CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
      1,
    );
    const action = acceptDiplomacyActionProposal(proposal, 1, 0);
    const topologyBefore = JSON.stringify(scenario.mapContactTopology);
    const landHexBefore = JSON.stringify(world.landHexStates);
    const regionsBefore = JSON.stringify(world.regions);
    const result = runDiplomacyStep(scenario, world, [action]);

    expect(
      result.nextWorld.contactEdgeStates[
        CONTACT_FIXTURE_EDGE_IDS.monarchyToBorder
      ],
    ).toEqual({
      enabled: false,
      multiplier: 1,
      blockedReason: FOREIGN_POLICY_BORDER_CLOSURE_REASON,
      blockedByCountryId: CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
    });
    expect(
      result.nextWorld.contactEdgeStates[
        CONTACT_FIXTURE_EDGE_IDS.borderToMonarchy
      ],
    ).toBeUndefined();
    expect(JSON.stringify(scenario.mapContactTopology)).toBe(topologyBefore);
    expect(JSON.stringify(result.nextWorld.landHexStates)).toBe(landHexBefore);
    expect(JSON.stringify(result.nextWorld.regions)).toBe(regionsBefore);
    expect(result.emittedEvents.map((event) => event.type)).toEqual([
      "BORDER_CLOSED",
      "TICK_ADVANCED",
    ]);
    expect(result.emittedEvents[0]?.payload).toMatchObject({
      actionId: action.id,
      actorCountryId: CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
      targetCountryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
      affectedContactEdgeIds: [CONTACT_FIXTURE_EDGE_IDS.monarchyToBorder],
    });
  });

  it("does not create a duplicate close mutation or state-change event", () => {
    const { scenario, world: initialWorld } = createFixtureWorld();
    const weakWorld = updateCountry(
      initialWorld,
      CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
      { instability: 80 },
    );
    const firstAction = acceptActionProposal(
      {
        tick: 1,
        source: "heuristic",
        actionType: "CLOSE_BORDER",
        payload: {
          actorCountryId: CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
          targetCountryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
        },
        schemaVersion: 1,
      },
      0,
    );
    const first = runDiplomacyStep(scenario, weakWorld, [firstAction]);
    const secondAction = acceptActionProposal(
      {
        tick: 2,
        source: "heuristic",
        actionType: "CLOSE_BORDER",
        payload: {
          actorCountryId: CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
          targetCountryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
        },
        schemaVersion: 1,
      },
      1,
    );
    const second = runDiplomacyStep(scenario, first.nextWorld, [secondAction]);

    expect(
      second.emittedEvents.some((event) => event.type === "BORDER_CLOSED"),
    ).toBe(false);
    expect(
      second.emittedEvents.some(
        (event) => event.type === "FOREIGN_ACTION_REJECTED",
      ),
    ).toBe(true);
    expect(second.nextWorld.contactEdgeStates).toEqual(
      first.nextWorld.contactEdgeStates,
    );
  });

  it("reopens only a closure owned by the acting Country and preserves multiplier", () => {
    const { scenario, world: initialWorld } = createFixtureWorld();
    const weakWorld = updateCountry(
      initialWorld,
      CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
      { instability: 80 },
    );
    const closeAction = makeAction(1, 0, "CLOSE_BORDER", {
      actorCountryId: CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
      targetCountryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
    });
    const closed = runDiplomacyStep(scenario, weakWorld, [closeAction]);
    const recovered = updateCountry(
      closed.nextWorld,
      CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
      { instability: 0, legitimacy: 80, stateCapacity: 80 },
    );
    const proposal = chooseForeignActionProposal(
      scenario,
      recovered,
      CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
      2,
    );
    const reopenAction = acceptDiplomacyActionProposal(proposal, 2, 1);
    const reopened = runDiplomacyStep(scenario, recovered, [reopenAction]);

    expect(proposal.actionType).toBe("REOPEN_BORDER");
    expect(
      reopened.nextWorld.contactEdgeStates[
        CONTACT_FIXTURE_EDGE_IDS.monarchyToBorder
      ],
    ).toEqual({ enabled: true, multiplier: 1 });
    expect(
      reopened.emittedEvents.some((event) => event.type === "BORDER_REOPENED"),
    ).toBe(true);
  });

  it("supports foreign-to-foreign directed targets without hardcoding the player", () => {
    const scenario = addMerchantToMonarchyBorder(createFixtureScenario());
    const initialWorld = createInitialWorldState(scenario, 19019);
    const world = updateCountry(
      initialWorld,
      CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
      { instability: 80 },
    );
    const proposal = chooseForeignActionProposal(
      scenario,
      world,
      CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
      1,
    );
    const action = acceptDiplomacyActionProposal(proposal, 1, 0);
    const result = runDiplomacyStep(scenario, world, [action]);

    expect(proposal).toMatchObject({
      actionType: "CLOSE_BORDER",
      payload: {
        actorCountryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
        targetCountryId: CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
      },
    });
    expect(
      result.nextWorld.contactEdgeStates[
        asContactEdgeId("t019.merchant-to-monarchy-border")
      ]?.enabled,
    ).toBe(false);
  });

  it("does not propose CLOSE_BORDER without a relevant border route", () => {
    const { scenario, world: initialWorld } = createFixtureWorld();
    const world = updateCountry(
      initialWorld,
      CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
      { instability: 80 },
    );

    expect(
      chooseForeignActionProposal(
        scenario,
        world,
        CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
        1,
      ).actionType,
    ).toBe("WAIT");
  });

  it("rejects malformed or impossible actions deterministically", () => {
    const { scenario, world } = createFixtureWorld();
    const invalid = makeAction(1, 0, "CLOSE_BORDER", {
      actorCountryId: CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
      targetCountryId: CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
    });
    const result = runDiplomacyStep(scenario, world, [invalid]);

    expect(result.emittedEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "FOREIGN_ACTION_REJECTED",
          payload: expect.objectContaining({
            reason: "sameCountry",
            actionId: invalid.id,
          }),
        }),
      ]),
    );
  });

  it("keeps WAIT as a no-op without event spam while preserving accepted action logging", () => {
    const { scenario, world } = createFixtureWorld();
    const waitAction = makeAction(1, 0, "WAIT", {
      actorCountryId: CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
    });
    const result = runDiplomacyStep(scenario, world, [waitAction]);

    expect(result.nextWorld.run.actionLog).toEqual([waitAction]);
    expect(result.emittedEvents.map((event) => event.type)).toEqual([
      "TICK_ADVANCED",
    ]);
    expect(result.nextWorld.contactEdgeStates).toEqual(world.contactEdgeStates);
  });

  it("keeps terminal runs inert for observation proposals and resolution", () => {
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
    const result = runDiplomacyStep(scenario, terminalWorld);

    expect(deriveForeignActionProposals(scenario, terminalWorld, 1)).toEqual(
      [],
    );
    expect(result.nextWorld).toBe(terminalWorld);
    expect(result.emittedEvents).toEqual([]);
    expect(result.actionProposals).toEqual([]);
  });
});
