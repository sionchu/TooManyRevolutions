import { describe, expect, it } from "vitest";
import { createGameEvent, type GameEvent } from "../events/event";
import {
  appendEventsIncremental,
  createEventStore,
  getNextEventSequence,
} from "../events/eventStore";
import * as canonicalApi from "./canonical";
import * as persistenceApi from "./persistence";
import * as tickApi from "./tick";
import { freezeCanonicalGraph } from "./canonicalFreeze";
import {
  SIMULATION_PHASE_ORDER,
  type SimulationPhaseHook,
  type SimulationPhaseHooks,
} from "./step";
import {
  commitSimulationStep,
  deserializeSimulationSnapshot,
  SIMULATION_SNAPSHOT_FORMAT_VERSION,
  serializeSimulationSnapshot,
  serializeSimulationSnapshotJson,
} from "./persistence";
import { runSimulationStep } from "./tick";
import {
  acceptActionProposal,
  createStartInterventionActionProposal,
} from "../state/action";
import { deriveStateDissolutionEligibility } from "../systems/stateDissolution";
import {
  asActionId,
  asConflictId,
  asFactionId,
  asGovernmentId,
  asEventId,
  asInterventionCommitmentId,
  asPolicyId,
  asRegionId,
} from "../state/ids";
import type { ValidatedActionRecord } from "../state/action";
import {
  CONTACT_FIXTURE_COUNTRY_IDS,
  CONTACT_FIXTURE_REGION_IDS,
  createContactFixtureScenario,
} from "../state/contactFixture";
import { createT021RebellionScenario } from "../state/conflictFixture";
import {
  createIdeologyFixtureScenario,
  IDEOLOGY_FIXTURE_IDS,
} from "../state/ideologyFixture";
import {
  createInterventionFixtureScenario,
  INTERVENTION_FIXTURE_IDS,
} from "../state/interventionFixture";
import { createPoliticalCrisisFixtureScenario } from "../state/politicalCrisisFixture";
import { createPolicyFixtureScenario } from "../state/policyFixture";
import { POLITICAL_COMPETITIONS } from "../state/policy";
import { createT022OrderConsolidationScenario } from "../state/orderConsolidationFixture";
import { createT023StateDissolutionScenario } from "../state/stateDissolutionFixture";
import { createInterventionPhaseHooks } from "../systems/interventionHooks";
import type { Conflict } from "../state/conflict";
import type { ScenarioDefinition } from "../state/scenario";
import type { WorldState } from "../state/world";
import { createInitialWorldState } from "../state/world";
import { advanceSimDate } from "./clock";
import { nextRandom } from "./rng";
import type { RunRecord } from "./step";
import {
  assertActionRecordDelta,
  assertInterventionCommitmentDelta,
} from "./runtimeClosure";

type MutableRecord = Record<string, unknown>;

type MutableSnapshot = {
  formatVersion: number;
  scenarioId: string;
  scenarioVersion: number;
  world: {
    countries: Record<string, MutableRecord>;
    regions: Record<string, MutableRecord>;
    landHexStates: Record<string, MutableRecord>;
    governments: Record<string, MutableRecord>;
    factions: Record<string, MutableRecord>;
    conflicts: Record<string, MutableRecord>;
    interventionCommitments: Record<string, MutableRecord>;
    contactEdgeStates: Record<string, MutableRecord>;
    policies: Record<string, MutableRecord>;
    rngState: MutableRecord;
    run: MutableRecord & {
      outcome: MutableRecord;
      actionLog: MutableRecord[];
    };
  };
  eventStore: { events: MutableRecord[] };
};

const noopPhase: SimulationPhaseHook = (context) => ({
  nextWorld: context.world,
  emittedEvents: [],
  nextEventSequence: context.nextEventSequence,
});

const NOOP_HOOKS: SimulationPhaseHooks = {
  applyScheduledEffects: noopPhase,
  resolveValidatedActions: noopPhase,
  economy: noopPhase,
  resources: noopPhase,
  ideologyDiffusion: noopPhase,
  factionPressure: noopPhase,
  instability: noopPhase,
  diplomacy: noopPhase,
  conflict: noopPhase,
  evaluateOrderConsolidationAndDissolution: noopPhase,
  closeDay: noopPhase,
  eventFinalization: noopPhase,
  snapshotHook: noopPhase,
};

const EVALUATION_HOOKS: SimulationPhaseHooks = {
  applyScheduledEffects: noopPhase,
  resolveValidatedActions: noopPhase,
  economy: noopPhase,
  resources: noopPhase,
  ideologyDiffusion: noopPhase,
  factionPressure: noopPhase,
  instability: noopPhase,
  diplomacy: noopPhase,
  conflict: noopPhase,
  closeDay: noopPhase,
  eventFinalization: noopPhase,
  snapshotHook: noopPhase,
};

function createRecord(scenario: ScenarioDefinition, seed = 24024): RunRecord {
  return {
    world: createInitialWorldState(scenario, seed),
    eventStore: createEventStore(),
  };
}

function stepRecord(
  scenario: ScenarioDefinition,
  record: RunRecord,
  hooks: SimulationPhaseHooks = NOOP_HOOKS,
): RunRecord {
  return commitSimulationStep(
    scenario,
    record,
    runSimulationStep(record.world, { actions: [] }, hooks, scenario),
  );
}

function stepRecordWithActions(
  scenario: ScenarioDefinition,
  record: RunRecord,
  actions: readonly ValidatedActionRecord[],
  hooks: SimulationPhaseHooks = NOOP_HOOKS,
): RunRecord {
  return commitSimulationStep(
    scenario,
    record,
    runSimulationStep(record.world, { actions }, hooks, scenario),
  );
}

function stepRecordWithProductionPhases(
  scenario: ScenarioDefinition,
  record: RunRecord,
): RunRecord {
  return commitSimulationStep(
    scenario,
    record,
    runSimulationStep(record.world, { actions: [] }, {}, scenario),
  );
}

function runProductionTicks(
  scenario: ScenarioDefinition,
  record: RunRecord,
  count: number,
): RunRecord {
  let current = record;
  for (let index = 0; index < count; index += 1) {
    current = stepRecordWithProductionPhases(scenario, current);
  }
  return current;
}

function acceptedReplayAction(
  sequence: number,
  tick: number,
): ValidatedActionRecord {
  return {
    id: asActionId(`action:${tick}:${sequence}:player:T024_REPLAY_MARKER`),
    tick,
    sequence,
    source: "player",
    actionType: "T024_REPLAY_MARKER",
    payload: { sequence, tick },
    schemaVersion: 1,
    validationOutcome: { kind: "accepted" },
  };
}

function createActiveInterventionRecord(): {
  readonly scenario: ScenarioDefinition;
  readonly record: RunRecord;
} {
  const scenario = createInterventionFixtureScenario();
  const initial = createRecord(scenario, 24025);
  const action = acceptActionProposal(
    createStartInterventionActionProposal(
      initial.world.tick + 1,
      "player",
      INTERVENTION_FIXTURE_IDS.long,
    ),
    initial.world.run.nextActionSequence,
  );

  return {
    scenario,
    record: stepRecordWithActions(
      scenario,
      initial,
      [action],
      createInterventionPhaseHooks(scenario),
    ),
  };
}

function runTicks(
  scenario: ScenarioDefinition,
  record: RunRecord,
  count: number,
  hooks: SimulationPhaseHooks = NOOP_HOOKS,
): RunRecord {
  let current = record;
  for (let index = 0; index < count; index += 1) {
    current = stepRecord(scenario, current, hooks);
  }
  return current;
}

function reverseRecordEntries(
  value: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).reverse());
}

describe("T024 persistence and replay", () => {
  it("round-trips JSON without static scenario or derived territorial data", () => {
    const scenario = createContactFixtureScenario();
    const record = runTicks(scenario, createRecord(scenario), 3);
    const json = serializeSimulationSnapshotJson(scenario, record);
    const loaded = deserializeSimulationSnapshot(scenario, json);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const parsedWorld = parsed.world as {
      regions: Record<string, Record<string, unknown>>;
      landHexStates: Record<string, Record<string, unknown>>;
    };

    expect(loaded).toEqual(record);
    expect(parsed).not.toHaveProperty("scenario");
    expect(parsed.world).not.toHaveProperty("regionControlSummary");
    expect(parsed.world).not.toHaveProperty("front");
    expect(
      parsedWorld.regions[CONTACT_FIXTURE_REGION_IDS.capital],
    ).not.toHaveProperty("controller");
    expect(
      parsedWorld.landHexStates["contact.landhex.port"],
    ).not.toHaveProperty("q");

    const changedLoaded: WorldState = {
      ...loaded.world,
      countries: {
        ...loaded.world.countries,
        [CONTACT_FIXTURE_COUNTRY_IDS.player]: {
          ...loaded.world.countries[CONTACT_FIXTURE_COUNTRY_IDS.player]!,
          treasury: 999,
        },
      },
    };
    expect(
      changedLoaded.countries[CONTACT_FIXTURE_COUNTRY_IDS.player]?.treasury,
    ).toBe(999);
    expect(
      record.world.countries[CONTACT_FIXTURE_COUNTRY_IDS.player]?.treasury,
    ).toBe(0);
  });

  it.each(POLITICAL_COMPETITIONS)(
    "round-trips politicalCompetition=%s in the strict v2 snapshot",
    (politicalCompetition) => {
      const baseScenario = createPolicyFixtureScenario();
      const countryId = baseScenario.playerCountryId;
      if (countryId === null) {
        throw new Error("Policy fixture requires a player country.");
      }
      const scenario: ScenarioDefinition = {
        ...baseScenario,
        initialCountryPolicies: {
          ...baseScenario.initialCountryPolicies,
          [countryId]: {
            ...baseScenario.initialCountryPolicies[countryId]!,
            institutionalRules: {
              ...baseScenario.initialCountryPolicies[countryId]!
                .institutionalRules,
              politicalCompetition,
            },
          },
        },
      };
      const record = createRecord(scenario);
      const snapshot = serializeSimulationSnapshot(scenario, record);
      const loaded = deserializeSimulationSnapshot(scenario, snapshot);

      expect(snapshot.formatVersion).toBe(SIMULATION_SNAPSHOT_FORMAT_VERSION);
      expect(
        loaded.world.policies[countryId]?.institutionalRules
          .politicalCompetition,
      ).toBe(politicalCompetition);
    },
  );

  it("rejects legacy, missing, and invalid politicalCompetition snapshot data", () => {
    const scenario = createPolicyFixtureScenario();
    const countryId = scenario.playerCountryId;
    if (countryId === null) {
      throw new Error("Policy fixture requires a player country.");
    }
    const json = serializeSimulationSnapshotJson(
      scenario,
      createRecord(scenario),
    );

    const legacy = JSON.parse(json) as MutableSnapshot;
    legacy.formatVersion = 1;
    expect(() => deserializeSimulationSnapshot(scenario, legacy)).toThrow(
      "Unsupported simulation snapshot version 1",
    );

    const missing = JSON.parse(json) as MutableSnapshot;
    const missingRules = missing.world.policies[countryId]?.institutionalRules;
    if (typeof missingRules !== "object" || missingRules === null) {
      throw new Error("Policy fixture institutional rules are missing.");
    }
    delete (missingRules as MutableRecord).politicalCompetition;
    expect(() => deserializeSimulationSnapshot(scenario, missing)).toThrow(
      "politicalCompetition is missing",
    );

    const invalid = JSON.parse(json) as MutableSnapshot;
    const invalidRules = invalid.world.policies[countryId]?.institutionalRules;
    if (typeof invalidRules !== "object" || invalidRules === null) {
      throw new Error("Policy fixture institutional rules are missing.");
    }
    (invalidRules as MutableRecord).politicalCompetition = "open";
    expect(() => deserializeSimulationSnapshot(scenario, invalid)).toThrow(
      "politicalCompetition has an invalid value",
    );
  });

  it("canonicalizes runtime record insertion order without changing replay", () => {
    const scenario = createContactFixtureScenario();
    const record = runTicks(scenario, createRecord(scenario), 4);
    const originalJson = serializeSimulationSnapshotJson(scenario, record);
    const reordered = JSON.parse(originalJson) as {
      world: Record<string, unknown>;
    };

    const world = reordered.world as Record<string, unknown>;
    for (const key of [
      "countries",
      "regions",
      "landHexStates",
      "governments",
      "factions",
      "conflicts",
      "interventionCommitments",
      "contactEdgeStates",
      "policies",
    ]) {
      world[key] = reverseRecordEntries(world[key] as Record<string, unknown>);
    }

    const loaded = deserializeSimulationSnapshot(scenario, reordered);
    expect(serializeSimulationSnapshotJson(scenario, loaded)).toBe(
      originalJson,
    );
  });

  it("does not expose a raw canonical marker registration API", () => {
    for (const api of [canonicalApi, persistenceApi, tickApi]) {
      expect(api).not.toHaveProperty("markCanonicalRunRecord");
      expect(api).not.toHaveProperty("markCanonicalSimulationStepResult");
      expect(api).not.toHaveProperty("registerCanonicalRunRecord");
      expect(api).not.toHaveProperty("registerProducedSimulationStepResult");
    }
  });

  it.each(["Map", "Set"] as const)(
    "rejects a nested %s again after the first freeze attempt fails",
    (collectionKind) => {
      const unsupported =
        collectionKind === "Map"
          ? new Map<string, string>()
          : new Set<string>();
      const root = {
        nested: {
          unsupported,
        },
      };

      expect(() => freezeCanonicalGraph(root)).toThrow(
        "Map or Set collections",
      );
      expect(() => freezeCanonicalGraph(root)).toThrow(
        "Map or Set collections",
      );
      expect(Object.isFrozen(root)).toBe(false);
    },
  );

  it("does not retain a completed freeze marker after a failed traversal", () => {
    const root = {
      safe: { value: 1 },
      unsupported: new Map<string, string>(),
    };

    expect(() => freezeCanonicalGraph(root)).toThrow("Map or Set collections");
    expect(Object.isFrozen(root)).toBe(false);
    expect(Object.isFrozen(root.safe)).toBe(true);

    expect(() => freezeCanonicalGraph(root)).toThrow("Map or Set collections");
  });

  it("binds step results to their exact parent and consumes failed results", () => {
    const scenario = createContactFixtureScenario();
    const recordA = stepRecord(scenario, createRecord(scenario));
    const recordB = stepRecord(scenario, createRecord(scenario));

    // Same scenario and same values are not enough; the parent object is the
    // identity that establishes the trusted transition lineage.
    expect(recordA.world).not.toBe(recordB.world);
    expect(recordA.world).toEqual(recordB.world);

    const resultA = runSimulationStep(
      recordA.world,
      { actions: [] },
      NOOP_HOOKS,
      scenario,
    );

    expect(() => commitSimulationStep(scenario, recordB, resultA)).toThrow(
      "source WorldState",
    );
    expect(() => commitSimulationStep(scenario, recordA, resultA)).toThrow(
      "already been consumed",
    );
  });

  it("allows one trusted result transition exactly once", () => {
    const scenario = createContactFixtureScenario();
    const record = stepRecord(scenario, createRecord(scenario));
    const result = runSimulationStep(
      record.world,
      { actions: [] },
      NOOP_HOOKS,
      scenario,
    );

    const next = commitSimulationStep(scenario, record, result);
    expect(next.world).toBe(result.nextWorld);
    expect(() => commitSimulationStep(scenario, next, result)).toThrow(
      "already been consumed",
    );
  });

  it("protects canonical records and trusted step results from in-place mutation", () => {
    const scenario = createContactFixtureScenario();
    const record = stepRecord(scenario, createRecord(scenario));
    const recordBefore = structuredClone(record);
    const event = record.eventStore.events[0];
    if (event === undefined) {
      throw new Error("Expected a canonical tick event.");
    }

    expect(Object.isFrozen(record)).toBe(true);
    expect(Object.isFrozen(record.world)).toBe(true);
    expect(Object.isFrozen(record.eventStore)).toBe(true);
    expect(() => {
      (record.world.run.actionLog as unknown as ValidatedActionRecord[]).push(
        acceptedReplayAction(0, record.world.tick),
      );
    }).toThrow();
    expect(() => {
      (record.eventStore.events as unknown as GameEvent[]).push(event);
    }).toThrow();
    expect(() => {
      (event as unknown as { id: typeof event.id }).id =
        asEventId("event:forged");
    }).toThrow();
    expect(() => {
      (event.causeIds as unknown as Array<typeof event.id>).push(event.id);
    }).toThrow();
    expect(record).toEqual(recordBefore);

    const result = runSimulationStep(
      record.world,
      { actions: [] },
      NOOP_HOOKS,
      scenario,
    );
    const resultBefore = structuredClone(result);

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.nextWorld)).toBe(true);
    expect(() => {
      (result as unknown as { nextWorld: WorldState }).nextWorld = record.world;
    }).toThrow();
    expect(() => {
      (result.emittedEvents as unknown as GameEvent[]).pop();
    }).toThrow();
    expect(result).toEqual(resultBefore);
  });

  it("protects canonical intervention commitments from in-place mutation", () => {
    const { record } = createActiveInterventionRecord();
    const commitment = Object.values(record.world.interventionCommitments)[0];
    if (commitment === undefined) {
      throw new Error("Expected a canonical intervention commitment.");
    }
    const before = structuredClone(record);

    expect(() => {
      (
        commitment as unknown as {
          sourceActionId: typeof commitment.sourceActionId;
        }
      ).sourceActionId = asActionId("action:999:0:player:FORGED");
    }).toThrow();
    expect(record).toEqual(before);
  });

  it("returns a runtime-immutable canonical record after deserialization", () => {
    const scenario = createContactFixtureScenario();
    const record = stepRecord(scenario, createRecord(scenario));
    const loaded = deserializeSimulationSnapshot(
      scenario,
      JSON.parse(serializeSimulationSnapshotJson(scenario, record)),
    );
    const before = structuredClone(loaded);
    const country = loaded.world.countries[CONTACT_FIXTURE_COUNTRY_IDS.player];
    if (country === undefined) {
      throw new Error("Expected the contact fixture player country.");
    }

    expect(Object.isFrozen(loaded)).toBe(true);
    expect(() => {
      (country as unknown as { treasury: number }).treasury = 999;
    }).toThrow();
    expect(() => {
      (loaded.eventStore.events as unknown as GameEvent[]).pop();
    }).toThrow();
    expect(loaded).toEqual(before);
  });

  it("preserves causal provenance across two JSON save/load boundaries", () => {
    const scenario = createContactFixtureScenario();
    const initial = createRecord(scenario);
    const e100 = createGameEvent({
      tick: 0,
      sequence: 0,
      type: "POLICY_ENACTED",
      causeIds: [],
      payload: { policyId: "t024.policy" },
      visibility: "world",
    });
    const preSave: RunRecord = {
      world: {
        ...initial.world,
        run: { ...initial.world.run, nextEventSequence: 1 },
      },
      eventStore: createEventStore([e100]),
    };

    const firstSerialized = serializeSimulationSnapshotJson(scenario, preSave);
    const loaded = deserializeSimulationSnapshot(
      scenario,
      JSON.parse(firstSerialized),
    );
    expect(loaded.world.run.nextEventSequence).toBe(1);
    expect(getNextEventSequence(loaded.eventStore)).toBe(1);
    const e101 = createGameEvent({
      tick: 1,
      sequence: 1,
      type: "TREASURY_CHANGED",
      // This is an explicit persistence/provenance fixture relation. Gameplay
      // phases do not invent cross-tick causes here.
      causeIds: [e100.id],
      payload: { source: "t024-post-load" },
      visibility: "world",
    });
    const postLoad: RunRecord = commitSimulationStep(scenario, loaded, {
      nextWorld: {
        ...loaded.world,
        tick: loaded.world.tick + 1,
        date: advanceSimDate(loaded.world.date),
        run: { ...loaded.world.run, nextEventSequence: 2 },
      },
      emittedEvents: [e101],
      actionProposals: [],
    });
    expect(postLoad.world.run.nextEventSequence).toBe(2);
    expect(getNextEventSequence(postLoad.eventStore)).toBe(2);

    const secondSerialized = serializeSimulationSnapshotJson(
      scenario,
      postLoad,
    );
    const restored = deserializeSimulationSnapshot(
      scenario,
      JSON.parse(secondSerialized),
    );

    expect(restored.eventStore.events).toEqual([e100, e101]);
    expect(restored.eventStore.events[0]?.id).toBe(e100.id);
    expect(restored.eventStore.events[1]?.id).toBe(e101.id);
    expect(restored.eventStore.events[1]?.causeIds).toEqual([e100.id]);
    expect(restored.eventStore.events[0]?.sequence).toBe(0);
    expect(restored.eventStore.events[1]?.sequence).toBe(1);
    expect(restored.eventStore.events[0]!.sequence).toBeLessThan(
      restored.eventStore.events[1]!.sequence,
    );
    expect(restored.world.run.nextEventSequence).toBe(
      postLoad.world.run.nextEventSequence,
    );
    expect(restored.world.run.nextEventSequence).toBe(
      getNextEventSequence(restored.eventStore),
    );
    expect(restored.eventStore.events.map((event) => event.id)).toEqual(
      postLoad.eventStore.events.map((event) => event.id),
    );
    expect(restored.eventStore.events.map((event) => event.sequence)).toEqual(
      postLoad.eventStore.events.map((event) => event.sequence),
    );
  });

  it("matches uninterrupted and resumed runs across multiple save boundaries", () => {
    const scenario = createContactFixtureScenario();
    const continuous = runTicks(scenario, createRecord(scenario), 120);

    let resumed = runTicks(scenario, createRecord(scenario), 40);
    resumed = deserializeSimulationSnapshot(
      scenario,
      serializeSimulationSnapshotJson(scenario, resumed),
    );
    resumed = runTicks(scenario, resumed, 80);

    let multiBoundary = runTicks(scenario, createRecord(scenario), 30);
    multiBoundary = deserializeSimulationSnapshot(
      scenario,
      serializeSimulationSnapshotJson(scenario, multiBoundary),
    );
    multiBoundary = runTicks(scenario, multiBoundary, 30);
    multiBoundary = deserializeSimulationSnapshot(
      scenario,
      serializeSimulationSnapshotJson(scenario, multiBoundary),
    );
    multiBoundary = runTicks(scenario, multiBoundary, 60);

    expect(resumed).toEqual(continuous);
    expect(multiBoundary).toEqual(continuous);
    expect(resumed.world.rngState).toEqual(continuous.world.rngState);
    expect(resumed.eventStore.events.map((event) => event.id)).toEqual(
      continuous.eventStore.events.map((event) => event.id),
    );
  });

  it("preserves ActionRecord history and applies the same subsequent inputs after load", () => {
    const scenario = createContactFixtureScenario();
    const firstAction = acceptedReplayAction(0, 1);
    const subsequentAction = acceptedReplayAction(1, 21);

    let continuous = stepRecordWithActions(scenario, createRecord(scenario), [
      firstAction,
    ]);
    continuous = runTicks(scenario, continuous, 19);
    continuous = stepRecordWithActions(scenario, continuous, [
      subsequentAction,
    ]);
    continuous = runTicks(scenario, continuous, 20);

    let resumed = stepRecordWithActions(scenario, createRecord(scenario), [
      firstAction,
    ]);
    resumed = runTicks(scenario, resumed, 19);
    resumed = deserializeSimulationSnapshot(
      scenario,
      serializeSimulationSnapshotJson(scenario, resumed),
    );
    resumed = stepRecordWithActions(scenario, resumed, [subsequentAction]);
    resumed = runTicks(scenario, resumed, 20);

    expect(resumed).toEqual(continuous);
    expect(resumed.world.run.actionLog).toEqual([
      firstAction,
      subsequentAction,
    ]);
  });

  it("rejects incomplete or extra ScenarioDefinition runtime identities", () => {
    const scenario = createContactFixtureScenario();
    const record = runTicks(scenario, createRecord(scenario), 1);
    const json = serializeSimulationSnapshotJson(scenario, record);

    const missingRegion = JSON.parse(json) as MutableSnapshot;
    delete missingRegion.world.regions[CONTACT_FIXTURE_REGION_IDS.farmland];
    expect(() =>
      deserializeSimulationSnapshot(scenario, missingRegion),
    ).toThrow("WorldState.regions is missing runtime identity");

    const unknownRegion = JSON.parse(json) as MutableSnapshot;
    const capital =
      unknownRegion.world.regions[CONTACT_FIXTURE_REGION_IDS.capital];
    if (capital === undefined) {
      throw new Error("Contact fixture capital runtime state is missing.");
    }
    unknownRegion.world.regions["t024.unknown-region"] = {
      ...capital,
      id: "t024.unknown-region",
    };
    expect(() =>
      deserializeSimulationSnapshot(scenario, unknownRegion),
    ).toThrow("WorldState.regions contains unknown runtime identity");

    const missingPolicyState = JSON.parse(json) as MutableSnapshot;
    delete missingPolicyState.world.policies[
      CONTACT_FIXTURE_COUNTRY_IDS.player
    ];
    expect(() =>
      deserializeSimulationSnapshot(scenario, missingPolicyState),
    ).toThrow("WorldState.policies is missing runtime identity");

    const unknownPolicyState = JSON.parse(json) as MutableSnapshot;
    const playerPolicy =
      unknownPolicyState.world.policies[CONTACT_FIXTURE_COUNTRY_IDS.player];
    if (playerPolicy === undefined) {
      throw new Error("Contact fixture player policy state is missing.");
    }
    unknownPolicyState.world.policies["t024.unknown-country"] = {
      ...playerPolicy,
    };
    expect(() =>
      deserializeSimulationSnapshot(scenario, unknownPolicyState),
    ).toThrow(/unknown runtime identity|missing country/);

    const ideologyScenario = createIdeologyFixtureScenario();
    const ideologyRecord = createRecord(ideologyScenario);
    const ideologyJson = serializeSimulationSnapshotJson(
      ideologyScenario,
      ideologyRecord,
    );
    const missingIdeology = JSON.parse(ideologyJson) as MutableSnapshot;
    const ideologyRegion =
      missingIdeology.world.regions["ideology-fixture.capital"];
    if (ideologyRegion === undefined) {
      throw new Error("Ideology fixture capital runtime state is missing.");
    }
    const ideologyState = ideologyRegion.ideology as MutableRecord;
    delete ideologyState[IDEOLOGY_FIXTURE_IDS.monarchy];
    expect(() =>
      deserializeSimulationSnapshot(ideologyScenario, missingIdeology),
    ).toThrow("missing ideology state");

    const unknownIdeology = JSON.parse(ideologyJson) as MutableSnapshot;
    const unknownIdeologyRegion =
      unknownIdeology.world.regions["ideology-fixture.capital"];
    if (unknownIdeologyRegion === undefined) {
      throw new Error("Ideology fixture capital runtime state is missing.");
    }
    (unknownIdeologyRegion.ideology as MutableRecord)["t024.unknown-ideology"] =
      {
        support: 0,
        radicalism: 0,
        organization: 0,
      };
    expect(() =>
      deserializeSimulationSnapshot(ideologyScenario, unknownIdeology),
    ).toThrow("contains unknown runtime identity");
  });

  it("rejects missing or unknown Country and Faction runtime identities", () => {
    const scenario = createContactFixtureScenario();
    const record = createRecord(scenario);
    const json = serializeSimulationSnapshotJson(scenario, record);

    const missingCountry = JSON.parse(json) as MutableSnapshot;
    delete missingCountry.world.countries[CONTACT_FIXTURE_COUNTRY_IDS.player];
    expect(() =>
      deserializeSimulationSnapshot(scenario, missingCountry),
    ).toThrow(/missing (?:runtime identity|.*country)/i);

    const unknownCountry = JSON.parse(json) as MutableSnapshot;
    const playerCountry =
      unknownCountry.world.countries[CONTACT_FIXTURE_COUNTRY_IDS.player];
    if (playerCountry === undefined) {
      throw new Error("Contact fixture player country is missing.");
    }
    unknownCountry.world.countries["t024.unknown-country"] = {
      ...playerCountry,
      id: "t024.unknown-country",
      currentGovernmentId: null,
      capitalRegionId: null,
    };
    expect(() =>
      deserializeSimulationSnapshot(scenario, unknownCountry),
    ).toThrow("WorldState.countries contains unknown runtime identity");

    const factionScenario = createPoliticalCrisisFixtureScenario();
    const factionRecord = createRecord(factionScenario);
    const factionJson = serializeSimulationSnapshotJson(
      factionScenario,
      factionRecord,
    );
    const factionId = Object.keys(factionRecord.world.factions)[0];
    if (factionId === undefined) {
      throw new Error("Political crisis fixture faction is missing.");
    }

    const missingFaction = JSON.parse(factionJson) as MutableSnapshot;
    delete missingFaction.world.factions[factionId];
    expect(() =>
      deserializeSimulationSnapshot(factionScenario, missingFaction),
    ).toThrow(/missing (?:runtime identity|.*faction)/i);

    const unknownFaction = JSON.parse(factionJson) as MutableSnapshot;
    const knownFaction = unknownFaction.world.factions[factionId];
    if (knownFaction === undefined) {
      throw new Error("Political crisis fixture faction state is missing.");
    }
    unknownFaction.world.factions["t024.unknown-faction"] = {
      ...knownFaction,
      id: "t024.unknown-faction",
    };
    expect(() =>
      deserializeSimulationSnapshot(factionScenario, unknownFaction),
    ).toThrow("WorldState.factions contains unknown runtime identity");
  });

  it("rejects unknown policy, faction ideology, and LandHex Region references", () => {
    const policyScenario = createPolicyFixtureScenario();
    const policyRecord = createRecord(policyScenario);
    const policyWorld: WorldState = {
      ...policyRecord.world,
      policies: {
        ...policyRecord.world.policies,
        [policyScenario.initialCountries[0]!.id]: {
          ...policyRecord.world.policies[
            policyScenario.initialCountries[0]!.id
          ]!,
          activePolicyIds: [asPolicyId("t024.unknown-policy")],
          enactedAtTick: { [asPolicyId("t024.unknown-policy")]: 0 },
        },
      },
    };
    expect(() =>
      serializeSimulationSnapshot(policyScenario, {
        ...policyRecord,
        world: policyWorld,
      }),
    ).toThrow("references unknown policy");

    const factionScenario = createPoliticalCrisisFixtureScenario();
    const factionRecord = createRecord(factionScenario);
    const factionIdValue = Object.keys(factionRecord.world.factions)[0];
    if (factionIdValue === undefined) {
      throw new Error("Political crisis fixture faction is missing.");
    }
    const factionId = asFactionId(factionIdValue);
    const faction = factionRecord.world.factions[factionId]!;
    const factionWorld: WorldState = {
      ...factionRecord.world,
      factions: {
        ...factionRecord.world.factions,
        [factionId]: {
          ...faction,
          ideologyAffinity: {
            ...faction.ideologyAffinity,
            "t024.unknown-ideology": 0.5,
          },
        },
      },
    };
    expect(() =>
      serializeSimulationSnapshot(factionScenario, {
        ...factionRecord,
        world: factionWorld,
      }),
    ).toThrow("references unknown ideology");

    const contactScenario = createContactFixtureScenario();
    const contactRecord = createRecord(contactScenario);
    const brokenScenario: ScenarioDefinition = {
      ...contactScenario,
      mapTerritorialTopology: {
        ...contactScenario.mapTerritorialTopology,
        landHexes: contactScenario.mapTerritorialTopology.landHexes.map(
          (landHex, index) =>
            index === 0
              ? { ...landHex, regionId: asRegionId("t024.missing-region") }
              : landHex,
        ),
      },
    };
    expect(() =>
      deserializeSimulationSnapshot(
        brokenScenario,
        serializeSimulationSnapshotJson(contactScenario, contactRecord),
      ),
    ).toThrow(/LandHex.*Region|region/i);
  });

  it("validates deterministic and unique ActionRecord IDs at the snapshot boundary", () => {
    const scenario = createContactFixtureScenario();
    const record = stepRecordWithActions(scenario, createRecord(scenario), [
      acceptedReplayAction(0, 1),
      acceptedReplayAction(1, 1),
    ]);
    const serialized = serializeSimulationSnapshotJson(scenario, record);

    const forgedId = JSON.parse(serialized) as MutableSnapshot;
    forgedId.world.run.actionLog[0]!.id = "action:forged";
    expect(() => deserializeSimulationSnapshot(scenario, forgedId)).toThrow(
      "deterministic ID",
    );

    const duplicateId = JSON.parse(serialized) as MutableSnapshot;
    duplicateId.world.run.actionLog[1]!.id =
      duplicateId.world.run.actionLog[0]!.id;
    expect(() => deserializeSimulationSnapshot(scenario, duplicateId)).toThrow(
      /deterministic ID|appears more than once|global sequence order/,
    );
  });

  it("validates intervention commitment provenance and conflict outcome references", () => {
    const { scenario, record } = createActiveInterventionRecord();
    const serialized = serializeSimulationSnapshotJson(scenario, record);
    const commitmentId = Object.keys(record.world.interventionCommitments)[0];
    if (commitmentId === undefined) {
      throw new Error("Intervention commitment fixture is missing.");
    }

    const danglingAction = JSON.parse(serialized) as MutableSnapshot;
    const danglingSourceActionId = "action:999:0:player:START_INTERVENTION";
    const danglingCommitment =
      danglingAction.world.interventionCommitments[commitmentId]!;
    delete danglingAction.world.interventionCommitments[commitmentId];
    danglingAction.world.interventionCommitments[
      `commitment:${danglingSourceActionId}`
    ] = {
      ...danglingCommitment,
      id: `commitment:${danglingSourceActionId}`,
      sourceActionId: danglingSourceActionId,
    };
    expect(() =>
      deserializeSimulationSnapshot(scenario, danglingAction),
    ).toThrow("missing source action");

    const rejectedAction = JSON.parse(serialized) as MutableSnapshot;
    rejectedAction.world.run.actionLog[0]!.validationOutcome = {
      kind: "rejected",
      reason: "T024 forged rejection",
    };
    expect(() =>
      deserializeSimulationSnapshot(scenario, rejectedAction),
    ).toThrow("rejected source action");

    const forgedCommitment = JSON.parse(serialized) as MutableSnapshot;
    const originalCommitment =
      forgedCommitment.world.interventionCommitments[commitmentId]!;
    delete forgedCommitment.world.interventionCommitments[commitmentId];
    forgedCommitment.world.interventionCommitments["commitment:t024.forged"] = {
      ...originalCommitment,
      id: "commitment:t024.forged",
    };
    expect(() =>
      deserializeSimulationSnapshot(scenario, forgedCommitment),
    ).toThrow("does not match its source action");

    const mismatchedIntervention = JSON.parse(serialized) as MutableSnapshot;
    mismatchedIntervention.world.interventionCommitments[
      commitmentId
    ]!.interventionId = INTERVENTION_FIXTURE_IDS.short;
    expect(() =>
      deserializeSimulationSnapshot(scenario, mismatchedIntervention),
    ).toThrow("does not match its source intervention");

    const unknownIntervention = JSON.parse(serialized) as MutableSnapshot;
    unknownIntervention.world.interventionCommitments[
      commitmentId
    ]!.interventionId = "t024.unknown-intervention";
    expect(() =>
      deserializeSimulationSnapshot(scenario, unknownIntervention),
    ).toThrow("unknown intervention");

    const conflictScenario = createContactFixtureScenario();
    const conflictInitial = createRecord(conflictScenario);
    const player = CONTACT_FIXTURE_COUNTRY_IDS.player;
    const playerGovernment =
      conflictInitial.world.countries[player]!.currentGovernmentId;
    const brokenConflict: Conflict = {
      id: asConflictId("t024.broken-outcome"),
      kind: "coup",
      status: "resolved",
      participantCountryIds: [player],
      participantFactionIds: [],
      affectedRegionIds: [CONTACT_FIXTURE_REGION_IDS.capital],
      contestedRegionIds: [],
      startedAtTick: 0,
      resolvedAtTick: 0,
      outcome: {
        kind: "governmentTransition",
        countryId: player,
        previousGovernmentId: playerGovernment,
        nextGovernmentId: asGovernmentId("t024.missing-government"),
        winner: { kind: "country", countryId: player },
      },
    };
    expect(() =>
      serializeSimulationSnapshot(conflictScenario, {
        ...conflictInitial,
        world: {
          ...conflictInitial.world,
          conflicts: { [brokenConflict.id]: brokenConflict },
        },
      }),
    ).toThrow("missing government");
  });

  it("preserves a nonzero RNG stream and rejects invalid live or next state atomically", () => {
    const scenario = createContactFixtureScenario();
    const initial = createRecord(scenario, 24026);
    let rngState = initial.world.rngState;
    for (let index = 0; index < 3; index += 1) {
      [, rngState] = nextRandom(rngState);
    }
    const advancedRngRecord: RunRecord = {
      ...initial,
      world: { ...initial.world, rngState },
    };
    const loaded = deserializeSimulationSnapshot(
      scenario,
      serializeSimulationSnapshotJson(scenario, advancedRngRecord),
    );
    expect(loaded.world.rngState.calls).toBe(3);

    let expectedState = rngState;
    let loadedState = loaded.world.rngState;
    for (let index = 0; index < 5; index += 1) {
      const [expectedValue, nextExpected] = nextRandom(expectedState);
      const [loadedValue, nextLoaded] = nextRandom(loadedState);
      expect(loadedValue).toBe(expectedValue);
      expect(nextLoaded).toEqual(nextExpected);
      expectedState = nextExpected;
      loadedState = nextLoaded;
    }

    const invalidLiveWorld = {
      ...initial.world,
      regions: { ...initial.world.regions },
    };
    delete invalidLiveWorld.regions[CONTACT_FIXTURE_REGION_IDS.farmland];
    expect(() =>
      serializeSimulationSnapshot(scenario, {
        ...initial,
        world: invalidLiveWorld,
      }),
    ).toThrow("WorldState.regions is missing runtime identity");

    const beforeCommit = JSON.stringify(initial);
    const invalidNextWorld = {
      ...initial.world,
      regions: { ...initial.world.regions },
    };
    delete invalidNextWorld.regions[CONTACT_FIXTURE_REGION_IDS.farmland];
    expect(() =>
      commitSimulationStep(scenario, initial, {
        nextWorld: invalidNextWorld,
        emittedEvents: [],
        actionProposals: [],
      }),
    ).toThrow("WorldState.regions is missing runtime identity");
    expect(JSON.stringify(initial)).toBe(beforeCommit);
  });

  it("preserves an active conflict through the next weekly territorial resolution", () => {
    const scenario = createT021RebellionScenario();
    const continuousAfterDetection = stepRecordWithProductionPhases(
      scenario,
      createRecord(scenario, 21024),
    );
    const continuous = runProductionTicks(
      scenario,
      continuousAfterDetection,
      6,
    );

    const savedAfterDetection = stepRecordWithProductionPhases(
      scenario,
      createRecord(scenario, 21024),
    );
    const resumed = runProductionTicks(
      scenario,
      deserializeSimulationSnapshot(
        scenario,
        serializeSimulationSnapshotJson(scenario, savedAfterDetection),
      ),
      6,
    );

    expect(continuous.world.tick).toBe(7);
    expect(
      continuous.eventStore.events.some(
        (event) => event.type === "LAND_HEX_CONTROL_CHANGED",
      ),
    ).toBe(true);
    expect(resumed).toEqual(continuous);
  });

  it("rejects wrong scenarios, missing or unknown LandHexes, and bad references", () => {
    const scenario = createContactFixtureScenario();
    const record = runTicks(scenario, createRecord(scenario), 1);
    const snapshot = JSON.parse(
      serializeSimulationSnapshotJson(scenario, record),
    ) as MutableSnapshot;

    const missingHex = structuredClone(snapshot);
    delete missingHex.world.landHexStates["contact.landhex.port"];
    expect(() => deserializeSimulationSnapshot(scenario, missingHex)).toThrow(
      "missing runtime state",
    );

    const unknownHex = structuredClone(snapshot);
    unknownHex.world.landHexStates["t024.unknown-hex"] = {
      controller: { kind: "uncontrolled" },
    };
    expect(() => deserializeSimulationSnapshot(scenario, unknownHex)).toThrow(
      "unknown LandHex",
    );

    const badGovernment = structuredClone(snapshot);
    badGovernment.world.countries[
      CONTACT_FIXTURE_COUNTRY_IDS.player
    ].currentGovernmentId = "t024.missing-government";
    expect(() =>
      deserializeSimulationSnapshot(scenario, badGovernment),
    ).toThrow(/current government/);

    const wrongScenario = structuredClone(snapshot);
    wrongScenario.scenarioId = "t024.other-scenario";
    expect(() =>
      deserializeSimulationSnapshot(scenario, wrongScenario),
    ).toThrow("scenario identity");
  });

  it("rejects broken event provenance and forward references", () => {
    const scenario = createContactFixtureScenario();
    const root = createGameEvent({
      tick: 0,
      sequence: 0,
      type: "POLICY_ENACTED",
      causeIds: [],
      payload: {},
      visibility: "world",
    });
    const consequence = createGameEvent({
      tick: 0,
      sequence: 1,
      type: "INSTITUTION_RULE_CHANGED",
      causeIds: [root.id],
      payload: {},
      visibility: "world",
    });
    const initial = createRecord(scenario);
    const record: RunRecord = {
      world: {
        ...initial.world,
        run: { ...initial.world.run, nextEventSequence: 2 },
      },
      eventStore: createEventStore([root, consequence]),
    };
    const snapshot = JSON.parse(
      serializeSimulationSnapshotJson(scenario, record),
    ) as MutableSnapshot;

    const missingCause = structuredClone(snapshot);
    missingCause.eventStore.events[1].causeIds = ["event:0:99:TICK_ADVANCED"];
    expect(() => deserializeSimulationSnapshot(scenario, missingCause)).toThrow(
      "missing cause",
    );

    const forwardCause = structuredClone(snapshot);
    forwardCause.eventStore.events[0].causeIds = [consequence.id];
    expect(() => deserializeSimulationSnapshot(scenario, forwardCause)).toThrow(
      "missing cause",
    );

    const consolidationScenario = createT022OrderConsolidationScenario();
    const wonRecord = runTicks(
      consolidationScenario,
      createRecord(consolidationScenario),
      3,
      EVALUATION_HOOKS,
    );
    const brokenOutcome = JSON.parse(
      serializeSimulationSnapshotJson(consolidationScenario, wonRecord),
    ) as MutableSnapshot;
    brokenOutcome.world.run.outcome.causeEventId =
      "event:3:999:ORDER_CONSOLIDATED";
    expect(() =>
      deserializeSimulationSnapshot(consolidationScenario, brokenOutcome),
    ).toThrow("Terminal outcome references a missing cause event");
  });

  it("persists consolidation progress and terminal outcomes without reopening runs", () => {
    const consolidationScenario = createT022OrderConsolidationScenario();
    const continuous = runTicks(
      consolidationScenario,
      createRecord(consolidationScenario),
      3,
      EVALUATION_HOOKS,
    );
    expect(continuous.world.run.outcome.status).toBe("won");

    let resumed = runTicks(
      consolidationScenario,
      createRecord(consolidationScenario),
      1,
      EVALUATION_HOOKS,
    );
    resumed = deserializeSimulationSnapshot(
      consolidationScenario,
      serializeSimulationSnapshotJson(consolidationScenario, resumed),
    );
    resumed = runTicks(consolidationScenario, resumed, 2, EVALUATION_HOOKS);
    expect(resumed).toEqual(continuous);

    const terminalWonStep = runTicks(
      consolidationScenario,
      createRecord(consolidationScenario),
      3,
      EVALUATION_HOOKS,
    );
    const loadedWon = deserializeSimulationSnapshot(
      consolidationScenario,
      serializeSimulationSnapshotJson(consolidationScenario, terminalWonStep),
    );
    const wonFollowUp = stepRecord(
      consolidationScenario,
      loadedWon,
      EVALUATION_HOOKS,
    );
    expect(wonFollowUp.world).toBe(loadedWon.world);
    expect(wonFollowUp.eventStore).toBe(loadedWon.eventStore);

    const dissolutionScenario = createT023StateDissolutionScenario();
    const dissolutionInitial = createRecord(dissolutionScenario);
    const dissolutionWorld: WorldState = {
      ...dissolutionInitial.world,
      countries: {
        ...dissolutionInitial.world.countries,
        [CONTACT_FIXTURE_COUNTRY_IDS.player]: {
          ...dissolutionInitial.world.countries[
            CONTACT_FIXTURE_COUNTRY_IDS.player
          ]!,
          stateContinuity: 0,
        },
      },
    };
    const defeated = stepRecord(
      dissolutionScenario,
      { ...dissolutionInitial, world: dissolutionWorld },
      EVALUATION_HOOKS,
    );
    expect(defeated.world.run.outcome.status).toBe("defeated");

    const loadedDefeated = deserializeSimulationSnapshot(
      dissolutionScenario,
      serializeSimulationSnapshotJson(dissolutionScenario, defeated),
    );
    const defeatedFollowUp = stepRecord(
      dissolutionScenario,
      loadedDefeated,
      EVALUATION_HOOKS,
    );
    expect(defeatedFollowUp.world).toBe(loadedDefeated.world);
    expect(defeatedFollowUp.eventStore).toBe(loadedDefeated.eventStore);
  });

  it("preserves multi-Hex control, contact runtime state, active conflicts, and T023 occupation semantics", () => {
    const scenario = createContactFixtureScenario();
    const initial = createRecord(scenario);
    const edgeId = scenario.mapContactTopology.contactEdges[0]!.id;
    const activeConflict: Conflict = {
      id: asConflictId("t024.active-war"),
      kind: "war",
      status: "active",
      participantCountryIds: [
        CONTACT_FIXTURE_COUNTRY_IDS.player,
        CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
      ],
      participantFactionIds: [],
      affectedRegionIds: [CONTACT_FIXTURE_REGION_IDS.border],
      contestedRegionIds: [CONTACT_FIXTURE_REGION_IDS.border],
      startedAtTick: 0,
    };
    const world: WorldState = {
      ...initial.world,
      conflicts: { [activeConflict.id]: activeConflict },
      contactEdgeStates: {
        [edgeId]: {
          enabled: false,
          multiplier: 0,
          blockedReason: "t024-test",
          blockedByCountryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
        },
      },
    };
    const loaded = deserializeSimulationSnapshot(
      scenario,
      serializeSimulationSnapshotJson(scenario, { ...initial, world }),
    );

    expect(loaded.world.conflicts[activeConflict.id]).toEqual(activeConflict);
    expect(loaded.world.contactEdgeStates[edgeId]).toEqual(
      world.contactEdgeStates[edgeId],
    );
    expect(Object.keys(loaded.world.landHexStates)).toHaveLength(9);
    expect(
      loaded.world.regions[CONTACT_FIXTURE_REGION_IDS.capital],
    ).not.toHaveProperty("controller");

    const occupiedWorld: WorldState = {
      ...loaded.world,
      landHexStates: Object.fromEntries(
        Object.keys(loaded.world.landHexStates).map((landHexId) => [
          landHexId,
          {
            controller: {
              kind: "country",
              countryId: CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
            },
          },
        ]),
      ),
    };
    const occupiedRecord = { ...loaded, world: occupiedWorld };
    const occupiedLoaded = deserializeSimulationSnapshot(
      scenario,
      serializeSimulationSnapshotJson(scenario, occupiedRecord),
    );
    expect(
      deriveStateDissolutionEligibility(scenario, occupiedLoaded.world)
        .dissolved,
    ).toBe(false);

    const t021Scenario = createT021RebellionScenario();
    const t021Record = runTicks(t021Scenario, createRecord(t021Scenario), 8);
    const t021Loaded = deserializeSimulationSnapshot(
      t021Scenario,
      serializeSimulationSnapshotJson(t021Scenario, t021Record),
    );
    expect(t021Loaded).toEqual(t021Record);
    expect(SIMULATION_PHASE_ORDER).toContain("conflict");
  });

  it("does not mutate the source record while serializing or loading", () => {
    const scenario = createContactFixtureScenario();
    const record = runTicks(scenario, createRecord(scenario), 2);
    const before = JSON.stringify(record);
    const snapshot = JSON.parse(
      serializeSimulationSnapshotJson(scenario, record),
    ) as MutableSnapshot;

    snapshot.world.regions[CONTACT_FIXTURE_REGION_IDS.capital].population = 1;
    snapshot.world.rngState.calls = 999;

    expect(JSON.stringify(record)).toBe(before);
  });

  it("validates only the new event delta on canonical continuation", () => {
    const scenario = createContactFixtureScenario();
    const record = stepRecord(scenario, createRecord(scenario));
    const previous = structuredClone(record);
    const nextTick = record.world.tick + 1;
    const nextSequence = record.world.run.nextEventSequence;

    const cases: readonly {
      readonly label: string;
      readonly events: readonly GameEvent[];
      readonly message: string;
    }[] = [
      {
        label: "wrong sequence",
        events: [
          createGameEvent({
            tick: nextTick,
            sequence: nextSequence - 1,
            type: "TICK_ADVANCED",
            causeIds: [],
            payload: {},
            visibility: "hidden",
          }),
        ],
        message: "next global event sequence",
      },
      {
        label: "forged ID",
        events: [
          {
            ...createGameEvent({
              tick: nextTick,
              sequence: nextSequence,
              type: "TICK_ADVANCED",
              causeIds: [],
              payload: {},
              visibility: "hidden",
            }),
            id: asEventId("event:forged"),
          },
        ],
        message: "deterministic ID",
      },
      {
        label: "missing cause",
        events: [
          createGameEvent({
            tick: nextTick,
            sequence: nextSequence,
            type: "TICK_ADVANCED",
            causeIds: [asEventId("event:0:999:TICK_ADVANCED")],
            payload: {},
            visibility: "hidden",
          }),
        ],
        message: "missing cause",
      },
    ];

    for (const testCase of cases) {
      expect(
        () => appendEventsIncremental(record.eventStore, testCase.events),
        testCase.label,
      ).toThrow(testCase.message);
      expect(record).toEqual(previous);
    }

    const first = createGameEvent({
      tick: nextTick,
      sequence: nextSequence,
      type: "POLICY_ENACTED",
      causeIds: [],
      payload: {},
      visibility: "world",
    });
    const second = createGameEvent({
      tick: nextTick,
      sequence: nextSequence + 1,
      type: "INSTITUTION_RULE_CHANGED",
      causeIds: [],
      payload: {},
      visibility: "world",
    });

    expect(() =>
      appendEventsIncremental(record.eventStore, [
        { ...first, causeIds: [second.id] },
        second,
      ]),
    ).toThrow("missing cause");
    expect(record).toEqual(previous);
  });

  it("rejects invalid ActionRecord deltas without changing the previous record", () => {
    const scenario = createContactFixtureScenario();
    const record = stepRecord(scenario, createRecord(scenario));
    const previous = structuredClone(record);
    const nextResult = runSimulationStep(
      record.world,
      { actions: [] },
      {},
      scenario,
    );
    const wrongSequenceAction = acceptedReplayAction(
      1,
      nextResult.nextWorld.tick,
    );
    const invalidWorld: WorldState = {
      ...nextResult.nextWorld,
      run: {
        ...nextResult.nextWorld.run,
        actionLog: [wrongSequenceAction],
        nextActionSequence: 2,
      },
    };

    expect(() => assertActionRecordDelta(record.world, invalidWorld)).toThrow(
      "global sequence",
    );
    expect(record).toEqual(previous);

    const forgedResult = runSimulationStep(
      record.world,
      { actions: [] },
      {},
      scenario,
    );
    const forgedAction = {
      ...acceptedReplayAction(0, forgedResult.nextWorld.tick),
      id: asActionId("action:forged"),
    };
    const forgedWorld: WorldState = {
      ...forgedResult.nextWorld,
      run: {
        ...forgedResult.nextWorld.run,
        actionLog: [forgedAction],
        nextActionSequence: 1,
      },
    };

    expect(() => assertActionRecordDelta(record.world, forgedWorld)).toThrow(
      "deterministic ID",
    );
    expect(record).toEqual(previous);

    const action = acceptedReplayAction(0, 1);
    const actionRecord = stepRecordWithActions(
      scenario,
      createRecord(scenario),
      [action],
    );
    const duplicateResult = runSimulationStep(
      actionRecord.world,
      { actions: [] },
      {},
      scenario,
    );
    const duplicateWorld: WorldState = {
      ...duplicateResult.nextWorld,
      run: {
        ...duplicateResult.nextWorld.run,
        actionLog: [...duplicateResult.nextWorld.run.actionLog, action],
        nextActionSequence: 2,
      },
    };

    expect(() =>
      assertActionRecordDelta(actionRecord.world, duplicateWorld),
    ).toThrow("global sequence");
  });

  it("rejects a forged intervention commitment delta and preserves the source", () => {
    const { scenario, record } = createActiveInterventionRecord();
    const previous = structuredClone(record);
    const result = runSimulationStep(
      record.world,
      { actions: [] },
      createInterventionPhaseHooks(scenario),
      scenario,
    );
    const existing = Object.values(result.nextWorld.interventionCommitments)[0];
    if (existing === undefined) {
      throw new Error("Expected an active intervention commitment.");
    }

    const danglingActionId = asActionId(
      "action:999:0:player:START_INTERVENTION",
    );
    const forgedCommitment = {
      ...existing,
      id: asInterventionCommitmentId(`commitment:${danglingActionId}`),
      sourceActionId: danglingActionId,
    };
    const forgedWorld: WorldState = {
      ...result.nextWorld,
      interventionCommitments: {
        ...result.nextWorld.interventionCommitments,
        [forgedCommitment.id]: forgedCommitment,
      },
    };

    expect(() =>
      assertInterventionCommitmentDelta(scenario, record.world, forgedWorld),
    ).toThrow("missing source action");
    expect(record).toEqual(previous);
  });

  it("keeps incremental commits inside the full persistence validator language", () => {
    const scenario = createContactFixtureScenario();
    let record = createRecord(scenario);

    for (let tick = 0; tick < 24; tick += 1) {
      record = stepRecord(scenario, record);
      if (record.world.tick % 6 === 0) {
        expect(() =>
          serializeSimulationSnapshot(scenario, record),
        ).not.toThrow();
      }
    }
  });

  it("matches the untrusted full-commit path for the same deterministic run", () => {
    const scenario = createContactFixtureScenario();
    let incremental = createRecord(scenario, 24027);
    let full = createRecord(scenario, 24027);

    for (let tick = 0; tick < 18; tick += 1) {
      const incrementalResult = runSimulationStep(
        incremental.world,
        { actions: [] },
        {},
        scenario,
      );
      incremental = commitSimulationStep(
        scenario,
        incremental,
        incrementalResult,
      );

      const fullResult = runSimulationStep(
        full.world,
        { actions: [] },
        {},
        scenario,
      );
      full = commitSimulationStep(
        scenario,
        {
          world: structuredClone(full.world),
          eventStore: { events: structuredClone(full.eventStore.events) },
        },
        {
          nextWorld: structuredClone(fullResult.nextWorld),
          emittedEvents: structuredClone(fullResult.emittedEvents),
          actionProposals: structuredClone(fullResult.actionProposals),
        },
      );
    }

    expect(incremental).toEqual(full);
  });
});
