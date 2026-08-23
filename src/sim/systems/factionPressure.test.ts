import { describe, expect, it } from "vitest";

import { createSimDate } from "../core/clock";
import type { SimulationPhaseHook } from "../core/step";
import { runSimulationStep } from "../core/tick";
import { asEventId, asFactionId, asIdeologyId } from "../state/ids";
import { createDefaultInstitutionalRuleState } from "../state/policy";
import { createIdeologyFixtureScenario } from "../state/ideologyFixture";
import type { Region } from "../state/region";
import { createInitialWorldState, type WorldState } from "../state/world";
import { acceptActionProposals, FACTION_ACTION_TYPES } from "../state/action";
import {
  applyFactionDynamics,
  acceptFactionActionProposal,
  chooseFactionActionProposal,
  deriveFactionActionProposals,
  deriveFactionDynamicsSnapshot,
  deriveFactionObservation,
  createFactionPressurePhaseHook,
  runFactionPressurePhase,
} from "./factionPressure";

const FACTION_IDS = {
  merchant: asFactionId("t016.merchant"),
  nobility: asFactionId("t016.nobility"),
  workers: asFactionId("t016.workers"),
} as const;

function createFactionPressureScenario() {
  const base = createIdeologyFixtureScenario();
  const country = base.initialCountries[0];

  if (country === undefined) {
    throw new Error("Faction fixture country is missing.");
  }

  return {
    ...base,
    initialDate: createSimDate(1, 1, 30),
    initialFactions: [
      {
        id: FACTION_IDS.merchant,
        name: "상인 길드",
        countryId: country.id,
        interests: ["trade" as const],
        resources: 0.8,
        organization: 0.6,
        influence: 0.4,
        grievance: 0.7,
        ideologyAffinity: { "fixture.republicanism": 0.8 },
        foreignLinks: {},
        currentStrategy: "wait" as const,
      },
      {
        id: FACTION_IDS.nobility,
        name: "귀족원",
        countryId: country.id,
        interests: ["land" as const, "authority" as const],
        resources: 0.2,
        organization: 0.4,
        influence: 0.8,
        grievance: 0.35,
        ideologyAffinity: { "fixture.monarchy": 0.8 },
        foreignLinks: {},
        currentStrategy: "wait" as const,
      },
      {
        id: FACTION_IDS.workers,
        name: "공업 노동자회",
        countryId: country.id,
        interests: ["labor" as const],
        resources: 0.2,
        organization: 0.7,
        influence: 0.2,
        grievance: 0.75,
        ideologyAffinity: { "fixture.communism": 0.9 },
        foreignLinks: {},
        currentStrategy: "wait" as const,
      },
    ],
  };
}

function createFixtureWorld(): WorldState {
  return createInitialWorldState(createFactionPressureScenario(), 16016);
}

function factionStrategy(
  world: WorldState,
  factionId: (typeof FACTION_IDS)[keyof typeof FACTION_IDS],
) {
  const faction = world.factions[factionId];
  if (faction === undefined) {
    throw new Error(`Missing faction ${factionId}.`);
  }

  return faction.currentStrategy;
}

function mapRegions(
  world: WorldState,
  transform: (region: Region) => Region,
): WorldState["regions"] {
  const regions = { ...world.regions };
  for (const region of Object.values(world.regions)) {
    regions[region.id] = transform(region);
  }
  return regions;
}

function hostileWorld(world: WorldState): WorldState {
  const countryId = world.factions[FACTION_IDS.merchant]!.countryId;
  return {
    ...world,
    countries: {
      ...world.countries,
      [countryId]: {
        ...world.countries[countryId]!,
        legitimacy: 20,
        stateCapacity: 20,
        instability: 80,
      },
    },
    regions: mapRegions(world, (region) => ({
      ...region,
      scarcity: 0.9,
      unrest: 0.9,
      stateControl: 0.1,
    })),
  };
}

function stableWorld(world: WorldState): WorldState {
  const countryId = world.factions[FACTION_IDS.merchant]!.countryId;
  return {
    ...world,
    countries: {
      ...world.countries,
      [countryId]: {
        ...world.countries[countryId]!,
        legitimacy: 100,
        stateCapacity: 100,
        instability: 0,
      },
    },
    regions: mapRegions(world, (region) => ({
      ...region,
      scarcity: 0,
      unrest: 0.05,
      stateControl: 0.95,
    })),
  };
}

function activeOrganizationBaseWorld(world: WorldState): WorldState {
  const faction = world.factions[FACTION_IDS.merchant]!;
  const ideologyId = asIdeologyId(Object.keys(faction.ideologyAffinity)[0]!);
  return {
    ...world,
    factions: {
      ...world.factions,
      [faction.id]: {
        ...faction,
        resources: 0.9,
        influence: 0.9,
        organization: 0.3,
      },
    },
    regions: mapRegions(world, (region) => ({
      ...region,
      unrest: 0.8,
      ideology: {
        ...region.ideology,
        ...(region.ideology[ideologyId] === undefined
          ? {}
          : {
              [ideologyId]: {
                ...region.ideology[ideologyId]!,
                radicalism: 0.9,
                organization: 0.9,
              },
            }),
      },
    })),
  };
}

function weakOrganizationBaseWorld(world: WorldState): WorldState {
  const faction = world.factions[FACTION_IDS.merchant]!;
  const ideologyId = asIdeologyId(Object.keys(faction.ideologyAffinity)[0]!);
  return {
    ...world,
    factions: {
      ...world.factions,
      [faction.id]: {
        ...faction,
        resources: 0.1,
        influence: 0.1,
        organization: 0.3,
      },
    },
    regions: mapRegions(world, (region) => ({
      ...region,
      unrest: 0.05,
      ideology: {
        ...region.ideology,
        ...(region.ideology[ideologyId] === undefined
          ? {}
          : {
              [ideologyId]: {
                ...region.ideology[ideologyId]!,
                radicalism: 0.05,
                organization: 0.05,
              },
            }),
      },
    })),
  };
}

function applyMonthlyDynamics(
  world: WorldState,
  scenario: ReturnType<typeof createFactionPressureScenario>,
  months: number,
): WorldState {
  let current = world;
  for (let month = 1; month <= months; month += 1) {
    current = {
      ...current,
      date: createSimDate(
        1 + Math.floor((month - 1) / 12),
        ((month - 1) % 12) + 1,
        30,
      ),
    };
    current = applyFactionDynamics(current, month, "monthly", scenario).world;
  }
  return current;
}

const noInstabilityPhase: SimulationPhaseHook = (context) => ({
  nextWorld: context.world,
  emittedEvents: [],
  nextEventSequence: context.nextEventSequence,
});

describe("T016 faction pressure", () => {
  it("selects the same proposal for the same world and faction", () => {
    const world = createFixtureWorld();

    expect(chooseFactionActionProposal(world, FACTION_IDS.merchant, 1)).toEqual(
      chooseFactionActionProposal(world, FACTION_IDS.merchant, 1),
    );
  });

  it("processes factions in stable FactionId order", () => {
    const world = createFixtureWorld();
    const proposals = deriveFactionActionProposals(world, 1);

    expect(proposals.map((proposal) => proposal.factionId)).toEqual([
      FACTION_IDS.merchant,
      FACTION_IDS.nobility,
      FACTION_IDS.workers,
    ]);
    expect(proposals.map((proposal) => proposal.actionType)).toEqual([
      "FUND_MOVEMENT",
      "LOBBY",
      "ORGANIZE",
    ]);
  });

  it("is a deterministic no-op on non-monthly days", () => {
    const initial = createFixtureWorld();
    const world = {
      ...initial,
      date: createSimDate(1, 1, 1),
    };
    const result = runSimulationStep(world, { actions: [] });

    expect(result.actionProposals).toEqual([]);
    expect(result.nextWorld.factions).toBe(world.factions);
    expect(result.emittedEvents.map((event) => event.type)).toEqual([
      "TICK_ADVANCED",
    ]);
  });

  it("can produce proposals at the monthly boundary after the ideology phase slot", () => {
    const world = createFixtureWorld();
    const result = runSimulationStep(world, { actions: [] });

    expect(result.nextWorld.tick).toBe(1);
    expect(result.actionProposals).toHaveLength(3);
    expect(result.actionProposals.map((proposal) => proposal.source)).toEqual([
      "heuristic",
      "heuristic",
      "heuristic",
    ]);
    expect(result.actionProposals.map((proposal) => proposal.tick)).toEqual([
      2, 2, 2,
    ]);
  });

  it("keeps the authoritative daily tick independent of faction cadence", () => {
    const world = createFixtureWorld();
    const result = runSimulationStep(
      { ...world, date: createSimDate(1, 1, 1) },
      { actions: [] },
      { factionPressure: createFactionPressurePhaseHook() },
    );

    expect(result.nextWorld.tick).toBe(world.tick + 1);
    expect(result.nextWorld.date).toEqual({ year: 1, month: 1, day: 2 });
  });

  it("does not mutate WorldState while deriving a proposal", () => {
    const world = createFixtureWorld();
    const before = JSON.parse(JSON.stringify(world));

    chooseFactionActionProposal(world, FACTION_IDS.workers, 1);

    expect(world).toEqual(before);
  });

  it("uses the common ActionRecord intake and preserves heuristic source", () => {
    const world = createFixtureWorld();
    const proposal = chooseFactionActionProposal(
      world,
      FACTION_IDS.merchant,
      1,
    );
    const action = acceptFactionActionProposal(proposal, 1, 0);
    const result = runSimulationStep(world, { actions: [action] });

    expect(result.nextWorld.run.actionLog).toEqual([action]);
    expect(action.source).toBe("heuristic");
    expect(
      result.emittedEvents.some(
        (event) => event.type === "FACTION_STRATEGY_CHANGED",
      ),
    ).toBe(true);
  });

  it("keeps multiple heuristic records globally ordered", () => {
    const world = createFixtureWorld();
    const first = runSimulationStep(world, { actions: [] });
    const actions = acceptActionProposals(
      first.actionProposals,
      first.nextWorld.run.nextActionSequence,
    );
    const second = runSimulationStep(first.nextWorld, { actions });

    expect(actions.map((action) => action.sequence)).toEqual([0, 1, 2]);
    expect(
      second.nextWorld.run.actionLog.map((action) => action.sequence),
    ).toEqual([0, 1, 2]);
    expect(
      second.nextWorld.run.actionLog.every(
        (action) => action.source === "heuristic",
      ),
    ).toBe(true);
  });

  it("does not update factions in a terminal run", () => {
    const world = createFixtureWorld();
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

    const result = runSimulationStep(terminalWorld, { actions: [] });

    expect(result.nextWorld).toBe(terminalWorld);
    expect(result.actionProposals).toEqual([]);
    expect(result.emittedEvents).toEqual([]);
  });

  it("keeps regional ideology organization independent from Faction.organization", () => {
    const world = createFixtureWorld();
    const observation = deriveFactionObservation(world, FACTION_IDS.workers);
    const faction = world.factions[FACTION_IDS.workers];

    if (faction === undefined) {
      throw new Error("Worker faction is missing.");
    }

    expect(observation.regional.affinityWeightedIdeologyOrganization).not.toBe(
      faction.organization,
    );
  });

  it("lets institutional rules alter available heuristic actions without scheduling an event", () => {
    const world = createFixtureWorld();
    const countryId = world.factions[FACTION_IDS.workers]?.countryId;

    if (countryId === undefined) {
      throw new Error("Worker country is missing.");
    }

    const illegalLaborWorld: WorldState = {
      ...world,
      policies: {
        ...world.policies,
        [countryId]: {
          ...world.policies[countryId]!,
          institutionalRules: {
            ...createDefaultInstitutionalRuleState(),
            laborOrganization: "illegal",
          },
        },
      },
    };
    const legalObservation = deriveFactionObservation(
      world,
      FACTION_IDS.workers,
    );
    const illegalObservation = deriveFactionObservation(
      illegalLaborWorld,
      FACTION_IDS.workers,
    );
    const legalProposal = chooseFactionActionProposal(
      world,
      FACTION_IDS.workers,
      1,
    );
    const illegalProposal = chooseFactionActionProposal(
      illegalLaborWorld,
      FACTION_IDS.workers,
      1,
    );

    expect(legalObservation.availableActions.ORGANIZE).toBe(true);
    expect(illegalObservation.availableActions.ORGANIZE).toBe(false);
    expect(legalProposal.actionType).toBe("ORGANIZE");
    expect(illegalProposal.actionType).not.toBe("ORGANIZE");
    expect(illegalLaborWorld.run.actionLog).toEqual([]);
  });

  it("changes action when relevant faction capacity changes", () => {
    const world = createFixtureWorld();
    const poorerMerchant: WorldState = {
      ...world,
      factions: {
        ...world.factions,
        [FACTION_IDS.merchant]: {
          ...world.factions[FACTION_IDS.merchant]!,
          resources: 0.1,
        },
      },
    };

    expect(
      chooseFactionActionProposal(world, FACTION_IDS.merchant, 1).actionType,
    ).toBe("FUND_MOVEMENT");
    expect(
      chooseFactionActionProposal(poorerMerchant, FACTION_IDS.merchant, 1)
        .actionType,
    ).toBe("ORGANIZE");
  });

  it("only changes currentStrategy and emits no duplicate event for an unchanged strategy", () => {
    const world = createFixtureWorld();
    const proposal = chooseFactionActionProposal(
      world,
      FACTION_IDS.merchant,
      1,
    );
    const action = acceptFactionActionProposal(proposal, 1, 0);
    const changed = runSimulationStep(
      world,
      { actions: [action] },
      { instability: noInstabilityPhase },
    );
    const repeated = runSimulationStep(
      changed.nextWorld,
      {
        actions: [acceptFactionActionProposal(proposal, 2, 1)],
      },
      { instability: noInstabilityPhase },
    );

    expect(factionStrategy(changed.nextWorld, FACTION_IDS.merchant)).toBe(
      "fundMovement",
    );
    expect(
      repeated.emittedEvents.some(
        (event) => event.type === "FACTION_STRATEGY_CHANGED",
      ),
    ).toBe(false);
    expect(repeated.nextWorld.countries).toBe(changed.nextWorld.countries);
    expect(repeated.nextWorld.regions).toBe(changed.nextWorld.regions);
  });

  it("does not mutate country instability, region unrest, or ideology", () => {
    const world = createFixtureWorld();
    const before = JSON.parse(
      JSON.stringify({
        countries: world.countries,
        regions: world.regions,
      }),
    );
    const result = runSimulationStep(
      world,
      { actions: [] },
      { instability: noInstabilityPhase },
    );

    expect(
      JSON.parse(
        JSON.stringify({
          countries: result.nextWorld.countries,
          regions: result.nextWorld.regions,
        }),
      ),
    ).toEqual(before);
  });

  it("emits no coup, revolution, rebellion, or crisis event", () => {
    const result = runSimulationStep(createFixtureWorld(), { actions: [] });
    const forbidden = new Set([
      "COUP",
      "REVOLUTION",
      "REBELLION",
      "CIVIL_WAR_STARTED",
      "STRIKE_STARTED",
    ]);

    expect(
      result.emittedEvents.some((event) => forbidden.has(event.type)),
    ).toBe(false);
    expect(FACTION_ACTION_TYPES).not.toContain("REVOLUTION");
    expect(FACTION_ACTION_TYPES).not.toContain("START_CIVIL_WAR");
  });

  it("keeps the faction hook bound to its phase", () => {
    const world = createFixtureWorld();
    const context = {
      phase: "factionPressure" as const,
      world,
      input: { actions: [] },
      nextTick: 1,
      emittedEvents: [],
      nextEventSequence: 0,
    };

    expect(runFactionPressurePhase(context).actionProposals).toHaveLength(3);
  });

  it("raises grievance again only when current hostile drivers remain", () => {
    const scenario = createFactionPressureScenario();
    const initial = createFixtureWorld();
    const reduced = hostileWorld({
      ...initial,
      factions: {
        ...initial.factions,
        [FACTION_IDS.merchant]: {
          ...initial.factions[FACTION_IDS.merchant]!,
          grievance: 0.5,
        },
      },
    });
    const snapshot = deriveFactionDynamicsSnapshot(
      reduced,
      FACTION_IDS.merchant,
      scenario,
    );
    const result = applyFactionDynamics(reduced, 1, "monthly", scenario);

    expect(snapshot.grievanceDelta).toBeGreaterThan(0);
    expect(
      result.world.factions[FACTION_IDS.merchant]!.grievance,
    ).toBeGreaterThan(0.5);
  });

  it("does not force grievance rebound in a stable low-pressure world", () => {
    const scenario = createFactionPressureScenario();
    const initial = createFixtureWorld();
    const stable = stableWorld({
      ...initial,
      factions: {
        ...initial.factions,
        [FACTION_IDS.merchant]: {
          ...initial.factions[FACTION_IDS.merchant]!,
          grievance: 0.5,
        },
      },
    });
    const result = applyFactionDynamics(stable, 1, "monthly", scenario);

    expect(result.world.factions[FACTION_IDS.merchant]!.grievance).toBeLessThan(
      0.5,
    );
  });

  it("rebuilds organization from strong current local and faction drivers", () => {
    const scenario = createFactionPressureScenario();
    const activeBase = activeOrganizationBaseWorld(createFixtureWorld());
    const result = applyMonthlyDynamics(activeBase, scenario, 30);

    expect(result.factions[FACTION_IDS.merchant]!.organization).toBeGreaterThan(
      0.3,
    );
  });

  it("does not rebuild organization when the current base is weak", () => {
    const scenario = createFactionPressureScenario();
    const weakBase = weakOrganizationBaseWorld(createFixtureWorld());
    const result = applyMonthlyDynamics(weakBase, scenario, 30);

    expect(result.factions[FACTION_IDS.merchant]!.organization).toBeLessThan(
      0.3,
    );
  });

  it("keeps endogenous faction fields bounded and input-order independent", () => {
    const scenario = createFactionPressureScenario();
    const initial = createFixtureWorld();
    const bounded: WorldState = {
      ...hostileWorld(initial),
      factions: Object.fromEntries(
        Object.values(initial.factions).map((faction) => [
          faction.id,
          { ...faction, grievance: 1, organization: 0 },
        ]),
      ),
    };
    const reversedFactions = Object.fromEntries(
      Object.values(initial.factions)
        .reverse()
        .map((faction) => [faction.id, faction]),
    );
    const reordered: WorldState = { ...initial, factions: reversedFactions };
    const boundedResult = applyFactionDynamics(
      bounded,
      1,
      "monthly",
      scenario,
    ).world;
    const first = applyFactionDynamics(initial, 1, "monthly", scenario).world;
    const second = applyFactionDynamics(
      reordered,
      1,
      "monthly",
      scenario,
    ).world;

    for (const faction of Object.values(boundedResult.factions)) {
      expect(faction.grievance).toBeGreaterThanOrEqual(0);
      expect(faction.grievance).toBeLessThanOrEqual(1);
      expect(faction.organization).toBeGreaterThanOrEqual(0);
      expect(faction.organization).toBeLessThanOrEqual(1);
    }

    const projection = (candidate: WorldState) =>
      Object.values(candidate.factions)
        .sort((firstFaction, secondFaction) =>
          firstFaction.id < secondFaction.id
            ? -1
            : firstFaction.id > secondFaction.id
              ? 1
              : 0,
        )
        .map((faction) => [
          faction.id,
          faction.grievance,
          faction.organization,
        ]);

    expect(projection(first)).toEqual(projection(second));
  });
});
