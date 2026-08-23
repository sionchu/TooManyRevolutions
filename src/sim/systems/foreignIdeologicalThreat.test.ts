import { describe, expect, it } from "vitest";

import { createSimDate } from "../core/clock";
import type { SimulationPhaseHook, SimulationPhaseHooks } from "../core/step";
import { runSimulationStep } from "../core/tick";
import { acceptActionProposal, type ActionProposal } from "../state/action";
import {
  CONTACT_FIXTURE_COUNTRY_IDS,
  CONTACT_FIXTURE_EDGE_IDS,
  CONTACT_FIXTURE_REGION_IDS,
} from "../state/contactFixture";
import type { Country } from "../state/country";
import type { Faction } from "../state/faction";
import { asIdeologyId, asEventId, type IdeologyId } from "../state/ids";
import type { Region } from "../state/region";
import { createPoliticalCrisisFixtureScenario } from "../state/politicalCrisisFixture";
import type { ScenarioDefinition } from "../state/scenario";
import {
  createT020ForeignIdeologicalThreatScenario,
  createT020ForeignIdeologicalThreatWorld,
  T020_EDGE_IDS,
  T020_FACTION_IDS,
  T020_IDEOLOGY_IDS,
} from "../state/foreignIdeologicalThreatFixture";
import { createInitialWorldState, type WorldState } from "../state/world";
import {
  chooseForeignActionProposal,
  chooseForeignActionType,
  deriveForeignActionProposals,
  deriveForeignStateObservation,
  FOREIGN_IDEOLOGICAL_THREAT_BORDER_RESTRICTION_REASON,
  FOREIGN_POLICY_BORDER_CLOSURE_REASON,
  runDiplomacyPhase,
} from "./diplomacy";
import {
  deriveForeignIdeologicalThreatRoutes,
  deriveForeignIdeologicalThreats,
  type ForeignIdeologicalThreatSnapshot,
} from "./foreignIdeologicalThreat";
import { derivePoliticalCrisisPrerequisites } from "./politicalCrisis";

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

function createFixtureScenario(): ScenarioDefinition {
  return createT020ForeignIdeologicalThreatScenario();
}

function createFixtureWorld(scenario = createFixtureScenario()): WorldState {
  return createT020ForeignIdeologicalThreatWorld(scenario);
}

function updateFaction(
  world: WorldState,
  factionId: Faction["id"],
  patch: Partial<Faction>,
): WorldState {
  const faction = world.factions[factionId];
  if (faction === undefined) {
    throw new Error(`T020 test faction ${factionId} is missing.`);
  }

  return {
    ...world,
    factions: {
      ...world.factions,
      [factionId]: { ...faction, ...patch },
    },
  };
}

function updateRegion(
  world: WorldState,
  regionId: Region["id"],
  patch: Partial<Region>,
): WorldState {
  const region = world.regions[regionId];
  if (region === undefined) {
    throw new Error(`T020 test region ${regionId} is missing.`);
  }

  return {
    ...world,
    regions: {
      ...world.regions,
      [regionId]: { ...region, ...patch },
    },
  };
}

function withoutForeignRoutesTo(
  scenario: ScenarioDefinition,
  countryId: Country["id"],
): ScenarioDefinition {
  const regionCountry = new Map(
    scenario.initialRegions.map((region) => [region.id, region.ownerCountryId]),
  );

  return {
    ...scenario,
    mapContactTopology: {
      ...scenario.mapContactTopology,
      contactEdges: scenario.mapContactTopology.contactEdges.filter((edge) => {
        const sourceCountryId = regionCountry.get(edge.fromRegionId);
        const destinationCountryId = regionCountry.get(edge.toRegionId);
        return !(
          sourceCountryId !== countryId && destinationCountryId === countryId
        );
      }),
    },
  };
}

function replaceRecordKey<T>(
  record: Readonly<Record<string, T>>,
  fromId: string,
  toId: string,
): Readonly<Record<string, T>> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key === fromId ? toId : key,
      value,
    ]),
  );
}

function renameIdeology(
  scenario: ScenarioDefinition,
  fromId: IdeologyId,
  toId: IdeologyId,
  name: string,
): ScenarioDefinition {
  const catalog = scenario.ideologyCatalog[fromId];
  if (catalog === undefined) {
    throw new Error(`T020 test ideology ${fromId} is missing.`);
  }

  return {
    ...scenario,
    initialRegions: scenario.initialRegions.map((region) => {
      const state = region.ideology[fromId];
      if (state === undefined) {
        throw new Error(`T020 region ${region.id} lacks ${fromId}.`);
      }

      return {
        ...region,
        ideology: replaceRecordKey(region.ideology, fromId, toId),
      };
    }),
    initialFactions: scenario.initialFactions.map((faction) => {
      return {
        ...faction,
        ideologyAffinity: replaceRecordKey(
          faction.ideologyAffinity,
          fromId,
          toId,
        ),
      };
    }),
    ideologyCatalog: {
      ...replaceRecordKey(scenario.ideologyCatalog, fromId, toId),
      [toId]: { ...catalog, id: toId, name },
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
  scenario: ScenarioDefinition,
  world: WorldState,
  actions: readonly ReturnType<typeof makeAction>[] = [],
) {
  return runSimulationStep(world, { actions }, DIPLOMACY_ONLY_HOOKS, scenario);
}

function merchantThreat(
  scenario: ScenarioDefinition,
  world: WorldState,
  actorCountryId = CONTACT_FIXTURE_COUNTRY_IDS.player,
): ForeignIdeologicalThreatSnapshot {
  const threat = deriveForeignIdeologicalThreats(
    scenario,
    world,
    actorCountryId,
  ).find(
    (candidate) =>
      candidate.sourceCountryId ===
        CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic &&
      candidate.ideologyId === T020_IDEOLOGY_IDS.republicanism,
  );
  if (threat === undefined) {
    throw new Error("T020 fixture merchant threat is missing.");
  }

  return threat;
}

describe("T020 foreign ideological threat", () => {
  it("requires an actual directed contact route", () => {
    const scenario = withoutForeignRoutesTo(
      createFixtureScenario(),
      CONTACT_FIXTURE_COUNTRY_IDS.player,
    );
    const world = createFixtureWorld(scenario);

    expect(
      deriveForeignIdeologicalThreats(
        scenario,
        world,
        CONTACT_FIXTURE_COUNTRY_IDS.player,
      ),
    ).toEqual([]);
  });

  it("does not classify source support without domestic mobilization as threat", () => {
    const scenario = createFixtureScenario();
    let world = createFixtureWorld(scenario);
    world = updateFaction(world, T020_FACTION_IDS.playerRepublicans, {
      grievance: 0.05,
      organization: 0.05,
    });
    world = updateRegion(world, CONTACT_FIXTURE_REGION_IDS.port, {
      ideology: {
        ...world.regions[CONTACT_FIXTURE_REGION_IDS.port].ideology,
        [T020_IDEOLOGY_IDS.republicanism]: {
          support: 0.05,
          radicalism: 0.05,
          organization: 0.05,
        },
      },
    });

    expect(
      deriveForeignIdeologicalThreatRoutes(
        scenario,
        world,
        CONTACT_FIXTURE_COUNTRY_IDS.player,
      ).some((route) => route.externalExposure > 0 && !route.eligible),
    ).toBe(true);
    expect(
      deriveForeignIdeologicalThreats(
        scenario,
        world,
        CONTACT_FIXTURE_COUNTRY_IDS.player,
      ),
    ).toEqual([]);
  });

  it("does not classify domestic mobilization without a foreign route as foreign threat", () => {
    const scenario = withoutForeignRoutesTo(
      createFixtureScenario(),
      CONTACT_FIXTURE_COUNTRY_IDS.player,
    );
    const world = createFixtureWorld(scenario);

    expect(world.factions[T020_FACTION_IDS.playerRepublicans]?.grievance).toBe(
      0.8,
    );
    expect(
      deriveForeignIdeologicalThreats(
        scenario,
        world,
        CONTACT_FIXTURE_COUNTRY_IDS.player,
      ),
    ).toEqual([]);
  });

  it("retains causal route evidence for live foreign exposure plus domestic mobilization", () => {
    const scenario = createFixtureScenario();
    const world = createFixtureWorld(scenario);
    const threat = merchantThreat(scenario, world);

    expect(threat.severity).toBeGreaterThan(0);
    expect(threat.actionable).toBe(true);
    expect(threat.routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceCountryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
          sourceRegionId: CONTACT_FIXTURE_REGION_IDS.merchantPort,
          destinationRegionId: CONTACT_FIXTURE_REGION_IDS.port,
          contactEdgeId: T020_EDGE_IDS.merchantToPortBorder,
          channel: "border",
          sourceSupport: 0.9,
          destinationSupport: 0.05,
          domesticFactionIds: [T020_FACTION_IDS.playerRepublicans],
        }),
      ]),
    );
  });

  it("supports foreign-to-foreign threat detection and targeting", () => {
    const scenario = createFixtureScenario();
    const world = createFixtureWorld(scenario);
    const proposal = chooseForeignActionProposal(
      scenario,
      world,
      CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
      1,
    );

    expect(proposal).toMatchObject({
      actionType: "RESTRICT_INCOMING_BORDER",
      payload: {
        actorCountryId: CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
        targetCountryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
      },
    });
    if (proposal.payload.targetCountryId === undefined) {
      throw new Error("T020 foreign-to-foreign proposal lacks target.");
    }
    const result = runDiplomacyStep(scenario, world, [
      makeAction(1, 0, proposal.actionType, {
        actorCountryId: proposal.payload.actorCountryId,
        targetCountryId: proposal.payload.targetCountryId,
      }),
    ]);
    expect(
      result.nextWorld.contactEdgeStates[
        T020_EDGE_IDS.merchantToMonarchyBorder
      ],
    ).toMatchObject({
      enabled: false,
      blockedByCountryId: CONTACT_FIXTURE_COUNTRY_IDS.absoluteMonarchy,
    });
  });

  it("keeps monthly proposal cadence and stable insertion-order output without RNG", () => {
    const scenario: ScenarioDefinition = {
      ...createFixtureScenario(),
      initialDate: createSimDate(1, 1, 30),
    };
    const reorderedScenario: ScenarioDefinition = {
      ...scenario,
      initialCountries: [...scenario.initialCountries].reverse(),
      initialRegions: [...scenario.initialRegions].reverse(),
      initialFactions: [...scenario.initialFactions].reverse(),
      mapContactTopology: {
        ...scenario.mapContactTopology,
        contactEdges: [...scenario.mapContactTopology.contactEdges].reverse(),
      },
    };
    const world = createFixtureWorld(scenario);
    const reorderedWorld = createFixtureWorld(reorderedScenario);
    const boundaryProposals = deriveForeignActionProposals(scenario, world, 1);
    const reorderedProposals = deriveForeignActionProposals(
      reorderedScenario,
      reorderedWorld,
      1,
    );
    const nonBoundaryScenario: ScenarioDefinition = {
      ...scenario,
      initialDate: createSimDate(1, 1, 1),
    };
    const nonBoundaryWorld = createFixtureWorld(nonBoundaryScenario);

    expect(boundaryProposals.length).toBeGreaterThan(0);
    expect(reorderedProposals).toEqual(boundaryProposals);
    expect(
      deriveForeignActionProposals(nonBoundaryScenario, nonBoundaryWorld, 1),
    ).toEqual([]);
    expect(world.rngState).toEqual(reorderedWorld.rngState);
    expect(
      deriveForeignIdeologicalThreats(
        scenario,
        world,
        CONTACT_FIXTURE_COUNTRY_IDS.player,
      ),
    ).toEqual(
      deriveForeignIdeologicalThreats(
        reorderedScenario,
        reorderedWorld,
        CONTACT_FIXTURE_COUNTRY_IDS.player,
      ),
    );
  });

  it("removes a disabled edge contribution without inventing another route", () => {
    const scenario = createFixtureScenario();
    const world = createFixtureWorld(scenario);
    const disabledWorld: WorldState = {
      ...world,
      contactEdgeStates: {
        ...world.contactEdgeStates,
        [T020_EDGE_IDS.merchantToPortBorder]: {
          enabled: false,
          multiplier: 0.73,
        },
      },
    };
    const routes = deriveForeignIdeologicalThreatRoutes(
      scenario,
      disabledWorld,
      CONTACT_FIXTURE_COUNTRY_IDS.player,
    );

    expect(
      routes.some(
        (route) => route.contactEdgeId === T020_EDGE_IDS.merchantToPortBorder,
      ),
    ).toBe(false);
    expect(
      routes.some(
        (route) =>
          route.contactEdgeId ===
          CONTACT_FIXTURE_EDGE_IDS.merchantToPortInformation,
      ),
    ).toBe(true);
  });

  it("is unchanged when only the government label changes", () => {
    const scenario = createFixtureScenario();
    const world = createFixtureWorld(scenario);
    const governmentId =
      world.countries[CONTACT_FIXTURE_COUNTRY_IDS.player]?.currentGovernmentId;
    if (governmentId === null || governmentId === undefined) {
      throw new Error("T020 fixture government is missing.");
    }

    const renamedWorld: WorldState = {
      ...world,
      governments: {
        ...world.governments,
        [governmentId]: {
          ...world.governments[governmentId],
          name: "완전히 다른 regime label",
        },
      },
    };

    expect(
      deriveForeignIdeologicalThreats(
        scenario,
        renamedWorld,
        CONTACT_FIXTURE_COUNTRY_IDS.player,
      ),
    ).toEqual(
      deriveForeignIdeologicalThreats(
        scenario,
        world,
        CONTACT_FIXTURE_COUNTRY_IDS.player,
      ),
    );
  });

  it("is unchanged in numeric evidence when ideology ID and label are renamed", () => {
    const scenario = createFixtureScenario();
    const renamedScenario = renameIdeology(
      scenario,
      T020_IDEOLOGY_IDS.republicanism,
      asIdeologyId("t020.republicanism-renamed"),
      "시민공화주의의 다른 이름",
    );
    const world = createFixtureWorld(scenario);
    const renamedWorld = createFixtureWorld(renamedScenario);
    const normalize = (threats: readonly ForeignIdeologicalThreatSnapshot[]) =>
      threats.map((threat) => ({
        sourceCountryId: threat.sourceCountryId,
        severity: threat.severity,
        actionable: threat.actionable,
        routes: threat.routes.map((route) => ({
          sourceRegionId: route.sourceRegionId,
          destinationRegionId: route.destinationRegionId,
          channel: route.channel,
          effectiveStrength: route.effectiveStrength,
          sourceSupport: route.sourceSupport,
          destinationSupport: route.destinationSupport,
          ideologyGradient: route.ideologyGradient,
          domesticMobilization: route.domesticMobilization,
        })),
      }));

    expect(
      normalize(
        deriveForeignIdeologicalThreats(
          scenario,
          world,
          CONTACT_FIXTURE_COUNTRY_IDS.player,
        ),
      ),
    ).toEqual(
      normalize(
        deriveForeignIdeologicalThreats(
          renamedScenario,
          renamedWorld,
          CONTACT_FIXTURE_COUNTRY_IDS.player,
        ),
      ),
    );
  });

  it("does not let T019 outgoing CLOSE_BORDER claim to mitigate an incoming route", () => {
    const scenario = createFixtureScenario();
    const world = createFixtureWorld(scenario);
    const before = merchantThreat(scenario, world);
    const action = makeAction(1, 0, "CLOSE_BORDER", {
      actorCountryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
      targetCountryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
    });
    const result = runDiplomacyStep(scenario, world, [action]);
    const after = merchantThreat(scenario, result.nextWorld);

    expect(
      result.nextWorld.contactEdgeStates[T020_EDGE_IDS.portToMerchantBorder],
    ).toEqual({
      enabled: false,
      multiplier: 1,
      blockedReason: FOREIGN_POLICY_BORDER_CLOSURE_REASON,
      blockedByCountryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
    });
    expect(after).toEqual(before);
    expect(
      result.nextWorld.contactEdgeStates[T020_EDGE_IDS.merchantToPortBorder],
    ).toBeUndefined();
  });

  it("restricts only actual incoming border routes and preserves reverse routes, topology, and multiplier", () => {
    const scenario = createFixtureScenario();
    const world = createFixtureWorld(scenario);
    const topologyBefore = JSON.stringify(scenario.mapContactTopology);
    const landHexBefore = JSON.stringify(world.landHexStates);
    const regionsBefore = JSON.stringify(world.regions);
    const action = makeAction(1, 0, "RESTRICT_INCOMING_BORDER", {
      actorCountryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
      targetCountryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
    });
    const result = runDiplomacyStep(scenario, world, [action]);
    const observation = deriveForeignIdeologicalThreats(
      scenario,
      result.nextWorld,
      CONTACT_FIXTURE_COUNTRY_IDS.player,
    );

    expect(
      result.nextWorld.contactEdgeStates[T020_EDGE_IDS.merchantToPortBorder],
    ).toEqual({
      enabled: false,
      multiplier: 1,
      blockedReason: FOREIGN_IDEOLOGICAL_THREAT_BORDER_RESTRICTION_REASON,
      blockedByCountryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
    });
    expect(
      result.nextWorld.contactEdgeStates[T020_EDGE_IDS.portToMerchantBorder],
    ).toBeUndefined();
    expect(
      observation.some((threat) =>
        threat.routes.some(
          (route) => route.contactEdgeId === T020_EDGE_IDS.merchantToPortBorder,
        ),
      ),
    ).toBe(false);
    expect(JSON.stringify(scenario.mapContactTopology)).toBe(topologyBefore);
    expect(JSON.stringify(result.nextWorld.landHexStates)).toBe(landHexBefore);
    expect(JSON.stringify(result.nextWorld.regions)).toBe(regionsBefore);
    expect(result.emittedEvents[0]?.payload).toMatchObject({
      direction: "incoming",
      actionType: "RESTRICT_INCOMING_BORDER",
      ideologicalThreat: expect.objectContaining({
        sourceCountryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
      }),
    });
  });

  it("detects information-only exposure but has no border response and chooses WAIT", () => {
    const scenario = createFixtureScenario();
    const world = createFixtureWorld(scenario);
    const informationOnlyWorld: WorldState = {
      ...world,
      contactEdgeStates: {
        ...world.contactEdgeStates,
        [T020_EDGE_IDS.merchantToPortBorder]: {
          enabled: false,
          multiplier: 1,
        },
      },
    };
    const threats = deriveForeignIdeologicalThreats(
      scenario,
      informationOnlyWorld,
      CONTACT_FIXTURE_COUNTRY_IDS.player,
    );

    expect(threats.length).toBeGreaterThan(0);
    expect(threats.every((threat) => !threat.actionable)).toBe(true);
    const proposal = chooseForeignActionProposal(
      scenario,
      informationOnlyWorld,
      CONTACT_FIXTURE_COUNTRY_IDS.player,
      1,
    );
    expect(proposal.actionType).toBe("WAIT");
  });

  it("uses separate restrict/restore thresholds and avoids close-open oscillation", () => {
    const scenario = createFixtureScenario();
    const world = createFixtureWorld(scenario);
    const close = runDiplomacyStep(scenario, world, [
      makeAction(1, 0, "RESTRICT_INCOMING_BORDER", {
        actorCountryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
        targetCountryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
      }),
    ]);
    const closedObservation = deriveForeignStateObservation(
      scenario,
      close.nextWorld,
      CONTACT_FIXTURE_COUNTRY_IDS.player,
    );

    expect(closedObservation.restorableIncomingTargetCountryIds).toEqual([]);
    expect(closedObservation.availableActions.RESTORE_INCOMING_BORDER).toBe(
      false,
    );

    const lowerSourceWorld = updateRegion(
      close.nextWorld,
      CONTACT_FIXTURE_REGION_IDS.merchantPort,
      {
        ideology: {
          ...close.nextWorld.regions[CONTACT_FIXTURE_REGION_IDS.merchantPort]
            .ideology,
          [T020_IDEOLOGY_IDS.republicanism]: {
            support: 0.07,
            radicalism: 0.05,
            organization: 0.05,
          },
        },
      },
    );
    const restorableObservation = deriveForeignStateObservation(
      scenario,
      lowerSourceWorld,
      CONTACT_FIXTURE_COUNTRY_IDS.player,
    );
    expect(restorableObservation.restorableIncomingTargetCountryIds).toEqual([
      CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
    ]);
    expect(chooseForeignActionType(restorableObservation)).toBe(
      "RESTORE_INCOMING_BORDER",
    );

    const reopened = runDiplomacyStep(scenario, lowerSourceWorld, [
      makeAction(2, 1, "RESTORE_INCOMING_BORDER", {
        actorCountryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
        targetCountryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
      }),
    ]);
    expect(
      reopened.nextWorld.contactEdgeStates[T020_EDGE_IDS.merchantToPortBorder],
    ).toEqual({ enabled: true, multiplier: 1 });
  });

  it("does not write ideology, foreign support, faction dimensions, or territory", () => {
    const scenario = createFixtureScenario();
    const world = createFixtureWorld(scenario);
    const before = JSON.parse(JSON.stringify(world));
    const result = runDiplomacyStep(scenario, world, [
      makeAction(1, 0, "RESTRICT_INCOMING_BORDER", {
        actorCountryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
        targetCountryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
      }),
    ]);

    expect(result.nextWorld.regions).toEqual(before.regions);
    expect(result.nextWorld.landHexStates).toEqual(before.landHexStates);
    expect(result.nextWorld.factions).toEqual(before.factions);
    expect(result.nextWorld.countries).toEqual(before.countries);
    expect(result.nextWorld).not.toHaveProperty("foreignSupport");
    expect(result.nextWorld).not.toHaveProperty("foreignIdeologicalThreat");
  });

  it("keeps T018 foreign support and military evidence explicitly notImplemented", () => {
    const scenario = createPoliticalCrisisFixtureScenario();
    const world = createInitialWorldState(scenario, 20260822);
    const snapshots = derivePoliticalCrisisPrerequisites(scenario, world);
    const evidence = [
      ...snapshots.coups.flatMap((snapshot) => snapshot.futureEvidence),
      ...snapshots.rebellions.flatMap((snapshot) => snapshot.futureEvidence),
    ];

    expect(evidence).toEqual(
      expect.arrayContaining([
        { id: "foreignSupport", status: "notImplemented" },
        { id: "militarySympathy", status: "notImplemented" },
        { id: "weapons", status: "notImplemented" },
        { id: "leadership", status: "notImplemented" },
      ]),
    );
  });

  it("keeps route, ideology, proposal, event, cadence, RNG, and terminal ordering deterministic", () => {
    const scenario = createFixtureScenario();
    const world = createFixtureWorld(scenario);
    const action = makeAction(1, 0, "RESTRICT_INCOMING_BORDER", {
      actorCountryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
      targetCountryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
    });
    const first = runDiplomacyStep(scenario, world, [action]);
    const second = runDiplomacyStep(scenario, world, [action]);

    expect(first.nextWorld).toEqual(second.nextWorld);
    expect(first.emittedEvents).toEqual(second.emittedEvents);
    expect(first.emittedEvents.map((event) => event.sequence)).toEqual([0, 1]);
    expect(first.emittedEvents[0]?.id).toBe("event:1:0:BORDER_CLOSED");
    expect(first.nextWorld.rngState).toEqual(world.rngState);
    expect(
      deriveForeignIdeologicalThreats(
        scenario,
        world,
        CONTACT_FIXTURE_COUNTRY_IDS.player,
      ),
    ).toEqual(
      deriveForeignIdeologicalThreats(
        scenario,
        world,
        CONTACT_FIXTURE_COUNTRY_IDS.player,
      ),
    );

    const terminalWorld: WorldState = {
      ...world,
      run: {
        ...world.run,
        outcome: {
          status: "defeated",
          kind: "stateDissolved",
          countryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
          reason: "stateContinuityThreshold",
          atTick: world.tick,
          causeEventId: asEventId("event:0:0:STATE_DISSOLVED"),
        },
      },
    };
    const terminal = runDiplomacyStep(scenario, terminalWorld, [action]);
    expect(terminal.nextWorld).toBe(terminalWorld);
    expect(terminal.emittedEvents).toEqual([]);
  });

  it("respects globally ordered input actions", () => {
    const scenario = createFixtureScenario();
    const world = createFixtureWorld(scenario);
    const close = makeAction(1, 0, "RESTRICT_INCOMING_BORDER", {
      actorCountryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
      targetCountryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
    });
    const restore = makeAction(1, 1, "RESTORE_INCOMING_BORDER", {
      actorCountryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
      targetCountryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
    });
    const result = runDiplomacyStep(scenario, world, [close, restore]);

    expect(result.emittedEvents.map((event) => event.type)).toEqual([
      "BORDER_CLOSED",
      "BORDER_REOPENED",
      "TICK_ADVANCED",
    ]);
    expect(
      result.nextWorld.contactEdgeStates[T020_EDGE_IDS.merchantToPortBorder],
    ).toEqual({ enabled: true, multiplier: 1 });
  });
});
