import { describe, expect, it } from "vitest";

import {
  acceptActionProposal,
  createCoupCoordinationResponseActionProposal,
  decodeCoupCoordinationResponseAction,
} from "../state/action";
import { createEventStore } from "../events/eventStore";
import {
  commitSimulationStep,
  deserializeSimulationSnapshot,
  serializeSimulationSnapshot,
  serializeSimulationSnapshotJson,
} from "../core/persistence";
import type { SimulationPhaseContext, SimulationPhaseHook } from "../core/step";
import { runSimulationStep } from "../core/tick";
import {
  asConflictId,
  asCoupCoordinationNodeId,
  asCountryId,
  asGovernmentId,
  type CoupCoordinationNodeId,
} from "../state/ids";
import {
  createPoliticalCrisisFixtureScenario,
  POLITICAL_CRISIS_FIXTURE_FACTION_IDS,
} from "../state/politicalCrisisFixture";
import type { ScenarioDefinition } from "../state/scenario";
import { createPolicyAndInterventionPhaseHook } from "./actionResolution";
import { createInitialWorldState, type WorldState } from "../state/world";

const NODE_A = asCoupCoordinationNodeId("f018.node.a");
const NODE_B = asCoupCoordinationNodeId("f018.node.b");
const CONFLICT_ID = asConflictId("f018.coup");

const NOOP_PHASE: SimulationPhaseHook = (context) => ({
  nextWorld: context.world,
  emittedEvents: [],
  nextEventSequence: context.nextEventSequence,
});

const RESPONSE_HOOKS = {
  applyScheduledEffects: NOOP_PHASE,
  resolveValidatedActions: (context: SimulationPhaseContext) => {
    const scenario = context.scenario;
    if (scenario === undefined) {
      throw new Error("F05_FIX18 test requires an injected scenario.");
    }
    return createPolicyAndInterventionPhaseHook(scenario)(context);
  },
  economy: NOOP_PHASE,
  resources: NOOP_PHASE,
  ideologyDiffusion: NOOP_PHASE,
  factionPressure: NOOP_PHASE,
  instability: NOOP_PHASE,
  diplomacy: NOOP_PHASE,
  conflict: NOOP_PHASE,
  evaluateOrderConsolidationAndDissolution: NOOP_PHASE,
} as const;

function createRuntimeScenario(
  options: {
    readonly reverseAuthoringOrder?: boolean;
    readonly includeAuthoring?: boolean;
  } = {},
): ScenarioDefinition {
  const base = createPoliticalCrisisFixtureScenario();
  const country = base.initialCountries[0];
  const coupFaction = base.initialFactions.find(
    (faction) => faction.id === POLITICAL_CRISIS_FIXTURE_FACTION_IDS.coup,
  );
  if (country === undefined || coupFaction === undefined) {
    throw new Error("F05_FIX18 fixture base is incomplete.");
  }

  const successorGovernmentId = asGovernmentId("f018.successor-government");
  const nodes = [
    { id: NODE_A, countryId: country.id, name: "Node A" },
    { id: NODE_B, countryId: country.id, name: "Node B" },
  ];
  const profile = {
    countryId: country.id,
    coupFactionId: coupFaction.id,
    requiredNodeIds: [NODE_A, NODE_B] as const,
    successorGovernmentId,
  };

  return {
    ...base,
    initialGovernments: [
      ...base.initialGovernments,
      {
        id: successorGovernmentId,
        countryId: country.id,
        name: "F018 successor government",
        authority: "contender",
        formedAtTick: 0,
      },
    ],
    initialConflicts: [
      {
        id: CONFLICT_ID,
        kind: "coup",
        status: "active",
        participantCountryIds: [country.id],
        participantFactionIds: [coupFaction.id],
        affectedRegionIds: [],
        contestedRegionIds: [],
        startedAtTick: 0,
      },
    ],
    ...(options.includeAuthoring === false
      ? {}
      : {
          coupCoordinationNodes: options.reverseAuthoringOrder
            ? [...nodes].reverse()
            : nodes,
          coupCoordinationProfiles: [
            {
              ...profile,
              requiredNodeIds: options.reverseAuthoringOrder
                ? [...profile.requiredNodeIds].reverse()
                : profile.requiredNodeIds,
            },
          ],
        }),
  };
}

function createAction(
  world: WorldState,
  nodeId: CoupCoordinationNodeId,
  alignment: "incumbent" | "coup",
  sequence = world.run.nextActionSequence,
) {
  return acceptActionProposal(
    createCoupCoordinationResponseActionProposal(
      world.tick + 1,
      "player",
      CONFLICT_ID,
      nodeId,
      alignment,
    ),
    sequence,
  );
}

function runResponseStep(
  scenario: ScenarioDefinition,
  world: WorldState,
  actions: readonly ReturnType<typeof createAction>[] = [],
) {
  return runSimulationStep(world, { actions }, RESPONSE_HOOKS, scenario);
}

function createRecord(scenario: ScenarioDefinition) {
  return {
    world: createInitialWorldState(scenario, 18018),
    eventStore: createEventStore(),
  };
}

function commitResponseStep(
  scenario: ScenarioDefinition,
  record: ReturnType<typeof createRecord>,
  actions: readonly ReturnType<typeof createAction>[] = [],
) {
  return commitSimulationStep(
    scenario,
    record,
    runResponseStep(scenario, record.world, actions),
  );
}

function responseEventTypes(
  result: ReturnType<typeof runResponseStep>,
): readonly string[] {
  return result.emittedEvents.map((event) => event.type);
}

function responseRejectionEvents(result: ReturnType<typeof runResponseStep>) {
  return result.emittedEvents.filter(
    (event) => event.type === "COUP_COORDINATION_RESPONSE_REJECTED",
  );
}

function responseRejectionReasons(
  result: ReturnType<typeof runResponseStep>,
): readonly unknown[] {
  return responseRejectionEvents(result).map((event) => {
    if (
      typeof event.payload !== "object" ||
      event.payload === null ||
      Array.isArray(event.payload)
    ) {
      throw new Error("F05_FIX18 rejection event payload is not an object.");
    }
    return (event.payload as Readonly<Record<string, unknown>>).reason;
  });
}

describe("F05_FIX18 Coup Coordination runtime vertical slice", () => {
  it("accepts the exact v1 action schema and rejects extra, missing, and uncommitted payloads", () => {
    const scenario = createRuntimeScenario();
    const world = createInitialWorldState(scenario, 18018);
    const valid = createAction(world, NODE_A, "coup");
    expect(decodeCoupCoordinationResponseAction(valid)).toEqual({
      conflictId: CONFLICT_ID,
      nodeId: NODE_A,
      alignment: "coup",
    });

    expect(
      decodeCoupCoordinationResponseAction(
        acceptActionProposal(
          {
            ...createCoupCoordinationResponseActionProposal(
              1,
              "player",
              CONFLICT_ID,
              NODE_A,
              "coup",
            ),
            payload: {
              conflictId: CONFLICT_ID,
              nodeId: NODE_A,
              alignment: "coup",
              extra: "reject",
            },
          },
          0,
        ),
      ),
    ).toBeNull();

    expect(
      decodeCoupCoordinationResponseAction(
        acceptActionProposal(
          {
            ...createCoupCoordinationResponseActionProposal(
              1,
              "player",
              CONFLICT_ID,
              NODE_A,
              "coup",
            ),
            payload: { conflictId: CONFLICT_ID, nodeId: NODE_A },
          },
          0,
        ),
      ),
    ).toBeNull();

    expect(
      decodeCoupCoordinationResponseAction(
        acceptActionProposal(
          {
            ...createCoupCoordinationResponseActionProposal(
              1,
              "player",
              CONFLICT_ID,
              NODE_A,
              "coup",
            ),
            payload: {
              conflictId: CONFLICT_ID,
              nodeId: NODE_A,
              alignment: "uncommitted",
            },
          },
          0,
        ),
      ),
    ).toBeNull();
  });

  it("emits bounded schema rejection provenance and preserves same-tick event order", () => {
    const scenario = createRuntimeScenario();
    const world = createInitialWorldState(scenario, 18018);
    const malformed = acceptActionProposal(
      {
        ...createCoupCoordinationResponseActionProposal(
          1,
          "player",
          CONFLICT_ID,
          NODE_A,
          "coup",
        ),
        payload: {
          conflictId: CONFLICT_ID,
          nodeId: NODE_A,
          alignment: "coup",
          extra: "reject",
        },
      },
      0,
    );
    const valid = createAction(world, NODE_A, "coup", 1);
    const result = runResponseStep(scenario, world, [malformed, valid]);
    const rejection = responseRejectionEvents(result)[0];
    const response = result.emittedEvents.find(
      (event) => event.type === "COUP_COORDINATION_NODE_RESPONDED",
    );

    expect(responseRejectionReasons(result)).toEqual(["invalidPayload"]);
    expect(rejection?.payload).toEqual({
      actionId: malformed.id,
      reason: "invalidPayload",
    });
    expect(rejection?.sequence).toBe(0);
    expect(response?.sequence).toBe(1);
    expect(result.nextWorld.coupCoordinationResponses).toEqual({
      [CONFLICT_ID]: {
        [NODE_A]: expect.objectContaining({ actionId: valid.id }),
      },
    });
  });

  it("rejects missing, resolved, and non-coup conflicts without mutating response state", () => {
    const scenario = createRuntimeScenario();
    const world = createInitialWorldState(scenario, 18018);
    const missing = acceptActionProposal(
      {
        ...createCoupCoordinationResponseActionProposal(
          1,
          "player",
          asConflictId("missing"),
          NODE_A,
          "coup",
        ),
      },
      0,
    );
    const missingResult = runResponseStep(scenario, world, [missing]);
    expect(missingResult.nextWorld.coupCoordinationResponses).toEqual({});
    expect(responseRejectionReasons(missingResult)).toEqual([
      "missingConflict",
    ]);
    expect(responseEventTypes(missingResult)).not.toContain(
      "COUP_COORDINATION_NODE_RESPONDED",
    );

    const resolvedWorld: WorldState = {
      ...world,
      conflicts: {
        [CONFLICT_ID]: {
          ...world.conflicts[CONFLICT_ID]!,
          status: "resolved",
          resolvedAtTick: 0,
          outcome: { kind: "statusQuo" },
        },
      },
    };
    const resolvedResult = runResponseStep(scenario, resolvedWorld, [
      createAction(resolvedWorld, NODE_A, "coup"),
    ]);
    expect(resolvedResult.nextWorld.coupCoordinationResponses).toEqual({});
    expect(responseRejectionReasons(resolvedResult)).toEqual([
      "conflictResolved",
    ]);

    const nonCoupScenario = {
      ...scenario,
      initialConflicts: [
        { ...scenario.initialConflicts[0]!, kind: "war" as const },
      ],
    };
    const nonCoupWorld = createInitialWorldState(nonCoupScenario, 18018);
    const nonCoupResult = runResponseStep(nonCoupScenario, nonCoupWorld, [
      createAction(nonCoupWorld, NODE_A, "coup"),
    ]);
    expect(nonCoupResult.nextWorld.coupCoordinationResponses).toEqual({});
    expect(responseRejectionReasons(nonCoupResult)).toEqual([
      "nonCoupConflict",
    ]);
  });

  it("rejects missing/ambiguous profiles and non-required or foreign nodes", () => {
    const authored = createRuntimeScenario();
    const world = createInitialWorldState(authored, 18018);
    const noProfileScenario = createRuntimeScenario({
      includeAuthoring: false,
    });
    const noProfileWorld = createInitialWorldState(noProfileScenario, 18018);
    const noProfileResult = runResponseStep(noProfileScenario, noProfileWorld, [
      createAction(noProfileWorld, NODE_A, "coup"),
    ]);
    expect(noProfileResult.nextWorld.coupCoordinationResponses).toEqual({});
    expect(responseRejectionReasons(noProfileResult)).toEqual([
      "missingOrAmbiguousProfile",
    ]);

    const ambiguousScenario = {
      ...authored,
      coupCoordinationProfiles: [
        ...authored.coupCoordinationProfiles!,
        { ...authored.coupCoordinationProfiles![0]! },
      ],
    };
    const ambiguousResult = runResponseStep(ambiguousScenario, world, [
      createAction(world, NODE_A, "coup"),
    ]);
    expect(ambiguousResult.nextWorld.coupCoordinationResponses).toEqual({});
    expect(responseRejectionReasons(ambiguousResult)).toEqual([
      "missingOrAmbiguousProfile",
    ]);

    const unknownNode = asCoupCoordinationNodeId("f018.unknown-node");
    const unknownNodeResult = runResponseStep(authored, world, [
      createAction(world, unknownNode, "coup"),
    ]);
    expect(unknownNodeResult.nextWorld.coupCoordinationResponses).toEqual({});
    expect(responseRejectionReasons(unknownNodeResult)).toEqual([
      "nonRequiredNode",
    ]);

    const foreignNodeScenario = {
      ...authored,
      coupCoordinationNodes: authored.coupCoordinationNodes!.map((node) =>
        node.id === NODE_B
          ? { ...node, countryId: asCountryId("f018.foreign-country") }
          : node,
      ),
    };
    const foreignNodeResult = runResponseStep(foreignNodeScenario, world, [
      createAction(world, NODE_B, "coup"),
    ]);
    expect(foreignNodeResult.nextWorld.coupCoordinationResponses).toEqual({});
    expect(responseRejectionReasons(foreignNodeResult)).toEqual([
      "invalidProfileReferences",
    ]);
  });

  it("keeps a partial coup active and records only decisive accepted responses", () => {
    const scenario = createRuntimeScenario();
    const world = createInitialWorldState(scenario, 18018);
    const result = runResponseStep(scenario, world, [
      createAction(world, NODE_A, "coup"),
    ]);

    expect(result.nextWorld.conflicts[CONFLICT_ID]!.status).toBe("active");
    expect(
      result.nextWorld.coupCoordinationResponses?.[CONFLICT_ID]?.[NODE_A],
    ).toMatchObject({
      conflictId: CONFLICT_ID,
      nodeId: NODE_A,
      alignment: "coup",
    });
    expect(responseEventTypes(result)).toContain(
      "COUP_COORDINATION_NODE_RESPONDED",
    );
    expect(responseEventTypes(result)).not.toContain("GOVERNMENT_TRANSITIONED");
  });

  it("rejects duplicate same-node and opposite-node reopen attempts", () => {
    const scenario = createRuntimeScenario();
    const world = createInitialWorldState(scenario, 18018);
    const first = runResponseStep(scenario, world, [
      createAction(world, NODE_A, "coup"),
    ]);
    const second = runResponseStep(scenario, first.nextWorld, [
      createAction(first.nextWorld, NODE_A, "incumbent"),
    ]);

    expect(
      second.nextWorld.coupCoordinationResponses?.[CONFLICT_ID]?.[NODE_A]
        ?.alignment,
    ).toBe("coup");
    expect(responseEventTypes(second)).not.toContain(
      "COUP_COORDINATION_NODE_RESPONDED",
    );
    expect(responseRejectionReasons(second)).toEqual(["duplicateResponse"]);
  });

  it("resolves all-coup through applyConflictOutcome with Country continuity and no LandHex mutation", () => {
    const scenario = createRuntimeScenario();
    const world = createInitialWorldState(scenario, 18018);
    const landHexBefore = world.landHexStates;
    const actions = [
      createAction(world, NODE_A, "coup", world.run.nextActionSequence),
      createAction(world, NODE_B, "coup", world.run.nextActionSequence + 1),
    ];
    const result = runResponseStep(scenario, world, actions);
    const country = Object.values(world.countries)[0]!;
    const outcome = result.nextWorld.conflicts[CONFLICT_ID]!.outcome;

    expect(outcome?.kind).toBe("governmentTransition");
    expect(result.nextWorld.conflicts[CONFLICT_ID]!.status).toBe("resolved");
    expect(result.nextWorld.countries[country.id]!.id).toBe(country.id);
    expect(result.nextWorld.countries[country.id]!.currentGovernmentId).toBe(
      asGovernmentId("f018.successor-government"),
    );
    expect(result.nextWorld.landHexStates).toEqual(landHexBefore);
    expect(responseEventTypes(result)).toContain("GOVERNMENT_TRANSITIONED");
    expect(
      result.emittedEvents.find(
        (event) => event.type === "GOVERNMENT_TRANSITIONED",
      )?.causeIds,
    ).toEqual(
      expect.arrayContaining([
        result.nextWorld.coupCoordinationResponses![CONFLICT_ID]![NODE_A]!
          .eventId,
        result.nextWorld.coupCoordinationResponses![CONFLICT_ID]![NODE_B]!
          .eventId,
      ]),
    );
  });

  it("resolves any incumbent through the same sink as status quo without government or territory change", () => {
    const scenario = createRuntimeScenario();
    const world = createInitialWorldState(scenario, 18018);
    const countryBefore = Object.values(world.countries)[0]!;
    const result = runResponseStep(scenario, world, [
      createAction(world, NODE_A, "incumbent"),
    ]);

    expect(result.nextWorld.conflicts[CONFLICT_ID]!.outcome).toEqual({
      kind: "statusQuo",
      winner: { kind: "country", countryId: countryBefore.id },
    });
    expect(result.nextWorld.countries[countryBefore.id]).toEqual(countryBefore);
    expect(result.nextWorld.landHexStates).toEqual(world.landHexStates);
  });

  it("rejects a final response atomically when the authored successor is stale or missing", () => {
    const scenario = createRuntimeScenario();
    const world = createInitialWorldState(scenario, 18018);
    const country = Object.values(world.countries)[0]!;
    const successorId = asGovernmentId("f018.successor-government");
    const successor = world.governments[successorId]!;
    const currentGovernmentId = country.currentGovernmentId;
    const equalWorld: WorldState = {
      ...world,
      countries: {
        ...world.countries,
        [country.id]: { ...country, currentGovernmentId: successorId },
      },
      governments: {
        ...world.governments,
        [currentGovernmentId!]: {
          ...world.governments[currentGovernmentId!]!,
          authority: "contender",
        },
        [successorId]: { ...successor, authority: "central" },
      },
    };
    const equalResult = runResponseStep(scenario, equalWorld, [
      createAction(
        equalWorld,
        NODE_A,
        "coup",
        equalWorld.run.nextActionSequence,
      ),
      createAction(
        equalWorld,
        NODE_B,
        "coup",
        equalWorld.run.nextActionSequence + 1,
      ),
    ]);
    expect(equalResult.nextWorld.coupCoordinationResponses).toEqual({
      [CONFLICT_ID]: {
        [NODE_A]: expect.objectContaining({ alignment: "coup" }),
      },
    });
    expect(equalResult.nextWorld.conflicts[CONFLICT_ID]!.status).toBe("active");
    expect(responseRejectionReasons(equalResult)).toEqual([
      "staleSuccessorGovernment",
    ]);

    const missingWorld: WorldState = {
      ...world,
      governments: Object.fromEntries(
        Object.entries(world.governments).filter(
          ([governmentId]) => governmentId !== successorId,
        ),
      ),
    };
    const missingResult = runResponseStep(scenario, missingWorld, [
      createAction(missingWorld, NODE_A, "coup"),
      createAction(
        missingWorld,
        NODE_B,
        "coup",
        missingWorld.run.nextActionSequence + 1,
      ),
    ]);
    expect(missingResult.nextWorld.coupCoordinationResponses).toEqual({
      [CONFLICT_ID]: {
        [NODE_A]: expect.objectContaining({ alignment: "coup" }),
      },
    });
    expect(missingResult.nextWorld.conflicts[CONFLICT_ID]!.status).toBe(
      "active",
    );
    expect(responseRejectionReasons(missingResult)).toEqual([
      "staleSuccessorGovernment",
    ]);
  });

  it("is deterministic under required-set insertion order and same-tick action replay", () => {
    const scenario = createRuntimeScenario();
    const reversed = createRuntimeScenario({ reverseAuthoringOrder: true });
    const firstWorld = createInitialWorldState(scenario, 18018);
    const reversedWorld = createInitialWorldState(reversed, 18018);
    const firstActions = [
      createAction(firstWorld, NODE_A, "coup", 0),
      createAction(firstWorld, NODE_B, "coup", 1),
    ];
    const reversedActions = [
      createAction(reversedWorld, NODE_A, "coup", 0),
      createAction(reversedWorld, NODE_B, "coup", 1),
    ];

    const first = runResponseStep(scenario, firstWorld, firstActions);
    const replay = runResponseStep(scenario, firstWorld, firstActions);
    const reorderedAuthoring = runResponseStep(
      reversed,
      reversedWorld,
      reversedActions,
    );

    expect(
      serializeSimulationSnapshotJson(scenario, {
        world: first.nextWorld,
        eventStore: createEventStore(first.emittedEvents),
      }),
    ).toBe(
      serializeSimulationSnapshotJson(scenario, {
        world: replay.nextWorld,
        eventStore: createEventStore(replay.emittedEvents),
      }),
    );
    expect(
      serializeSimulationSnapshotJson(scenario, {
        world: first.nextWorld,
        eventStore: createEventStore(first.emittedEvents),
      }),
    ).toBe(
      serializeSimulationSnapshotJson(reversed, {
        world: reorderedAuthoring.nextWorld,
        eventStore: createEventStore(reorderedAuthoring.emittedEvents),
      }),
    );
  });

  it("preserves uninterrupted versus save/load replay equality for partial then decisive responses", () => {
    const scenario = createRuntimeScenario();
    const initial = createRecord(scenario);
    const firstAction = createAction(initial.world, NODE_A, "coup");
    const uninterruptedPartial = commitResponseStep(scenario, initial, [
      firstAction,
    ]);
    const uninterrupted = commitResponseStep(scenario, uninterruptedPartial, [
      createAction(uninterruptedPartial.world, NODE_B, "coup"),
    ]);

    const loadedPartial = deserializeSimulationSnapshot(
      scenario,
      serializeSimulationSnapshot(scenario, uninterruptedPartial),
    );
    const resumed = commitResponseStep(scenario, loadedPartial, [
      createAction(loadedPartial.world, NODE_B, "coup"),
    ]);

    expect(serializeSimulationSnapshotJson(scenario, uninterrupted)).toBe(
      serializeSimulationSnapshotJson(scenario, resumed),
    );
  });

  it("retains exact action-to-event-to-state provenance and rejects corrupted references", () => {
    const scenario = createRuntimeScenario();
    const initial = createRecord(scenario);
    const committed = commitResponseStep(scenario, initial, [
      createAction(initial.world, NODE_A, "coup"),
    ]);
    const response =
      committed.world.coupCoordinationResponses![CONFLICT_ID]![NODE_A]!;
    const action = committed.world.run.actionLog.find(
      (candidate) => candidate.id === response.actionId,
    );
    const event = committed.eventStore.events.find(
      (candidate) => candidate.id === response.eventId,
    );
    expect(action?.id).toBe(response.actionId);
    expect(event?.type).toBe("COUP_COORDINATION_NODE_RESPONDED");
    expect(event?.payload).toEqual({
      actionId: response.actionId,
      alignment: response.alignment,
      conflictId: response.conflictId,
      nodeId: response.nodeId,
    });

    const corruptedState = JSON.parse(
      serializeSimulationSnapshotJson(scenario, committed),
    ) as {
      world: {
        coupCoordinationResponses: Record<
          string,
          Record<string, Record<string, unknown>>
        >;
      };
    };
    corruptedState.world.coupCoordinationResponses[CONFLICT_ID]![
      NODE_A
    ]!.actionId = "action:corrupted";
    expect(() =>
      deserializeSimulationSnapshot(scenario, corruptedState),
    ).toThrow("missing or mismatched ActionRecord provenance");

    const corruptedEvent = JSON.parse(
      serializeSimulationSnapshotJson(scenario, committed),
    ) as {
      eventStore: {
        events: Array<{ type: string; payload: Record<string, unknown> }>;
      };
    };
    const responseEvent = corruptedEvent.eventStore.events.find(
      (candidate) => candidate.type === "COUP_COORDINATION_NODE_RESPONDED",
    );
    if (responseEvent === undefined) {
      throw new Error("F05_FIX18 response event fixture is missing.");
    }
    responseEvent.payload.nodeId = "f018.corrupted-node";
    expect(() =>
      deserializeSimulationSnapshot(scenario, corruptedEvent),
    ).toThrow("payload does not match state");
  });

  it("keeps no-response authoring behavior unchanged and has no autonomous response producer", () => {
    const authored = createRuntimeScenario();
    const legacy = createRuntimeScenario({ includeAuthoring: false });
    const authoredWorld = createInitialWorldState(authored, 18018);
    const legacyWorld = createInitialWorldState(legacy, 18018);
    const authoredStep = runResponseStep(authored, authoredWorld);
    const legacyStep = runResponseStep(legacy, legacyWorld);

    expect(authoredWorld.coupCoordinationResponses).toEqual({});
    expect(authoredStep.nextWorld.coupCoordinationResponses).toEqual({});
    expect(responseEventTypes(authoredStep)).not.toContain(
      "COUP_COORDINATION_NODE_RESPONDED",
    );
    expect(authoredStep.nextWorld.conflicts).toEqual(
      legacyStep.nextWorld.conflicts,
    );
    expect(authoredStep.nextWorld.landHexStates).toEqual(
      legacyStep.nextWorld.landHexStates,
    );
  });

  it("uses V7 snapshots for empty and partial response state", () => {
    const scenario = createRuntimeScenario();
    const initial = createRecord(scenario);
    const emptySnapshot = serializeSimulationSnapshot(scenario, initial);
    expect(emptySnapshot.formatVersion).toBe(7);
    expect(emptySnapshot.world.coupCoordinationResponses).toEqual({});

    const partial = commitResponseStep(scenario, initial, [
      createAction(initial.world, NODE_A, "coup"),
    ]);
    const partialSnapshot = serializeSimulationSnapshot(scenario, partial);
    expect(partialSnapshot.world.coupCoordinationResponses).toEqual(
      partial.world.coupCoordinationResponses,
    );
    expect(
      deserializeSimulationSnapshot(scenario, partialSnapshot).world
        .coupCoordinationResponses,
    ).toEqual(partial.world.coupCoordinationResponses);
  });

  it("round-trips rejection evidence and rejects forged rejection provenance", () => {
    const scenario = createRuntimeScenario();
    const initial = createRecord(scenario);
    const malformed = acceptActionProposal(
      {
        ...createCoupCoordinationResponseActionProposal(
          1,
          "player",
          CONFLICT_ID,
          NODE_A,
          "coup",
        ),
        payload: {
          conflictId: CONFLICT_ID,
          nodeId: NODE_A,
          alignment: "coup",
          extra: "reject",
        },
      },
      0,
    );
    const record = commitResponseStep(scenario, initial, [malformed]);
    const rejection = record.eventStore.events.find(
      (event) => event.type === "COUP_COORDINATION_RESPONSE_REJECTED",
    );
    expect(rejection?.payload).toEqual({
      actionId: malformed.id,
      reason: "invalidPayload",
    });
    expect(
      serializeSimulationSnapshotJson(
        scenario,
        deserializeSimulationSnapshot(
          scenario,
          serializeSimulationSnapshot(scenario, record),
        ),
      ),
    ).toBe(serializeSimulationSnapshotJson(scenario, record));

    const corrupted = JSON.parse(
      serializeSimulationSnapshotJson(scenario, record),
    ) as {
      eventStore: {
        events: Array<{ type: string; payload: Record<string, unknown> }>;
      };
    };
    const corruptedRejection = corrupted.eventStore.events.find(
      (event) => event.type === "COUP_COORDINATION_RESPONSE_REJECTED",
    );
    if (corruptedRejection === undefined) {
      throw new Error("F05_FIX18 rejection event fixture is missing.");
    }
    corruptedRejection.payload.reason = "missingConflict";
    expect(() => deserializeSimulationSnapshot(scenario, corrupted)).toThrow(
      "does not match invalid ActionRecord provenance",
    );
  });

  it("rejects unsupported action schema versions before runtime resolution", () => {
    const scenario = createRuntimeScenario();
    const world = createInitialWorldState(scenario, 18018);
    const action = acceptActionProposal(
      {
        ...createCoupCoordinationResponseActionProposal(
          1,
          "player",
          CONFLICT_ID,
          NODE_A,
          "coup",
        ),
        schemaVersion: 2,
      },
      0,
    );
    expect(decodeCoupCoordinationResponseAction(action)).toBeNull();
    const result = runResponseStep(scenario, world, [action]);
    expect(result.nextWorld.coupCoordinationResponses).toEqual({});
    expect(responseRejectionReasons(result)).toEqual([
      "unsupportedSchemaVersion",
    ]);
  });

  it("rejects an authored node whose runtime country no longer matches the profile", () => {
    const scenario = createRuntimeScenario();
    const world = createInitialWorldState(scenario, 18018);
    const inconsistentScenario = {
      ...scenario,
      coupCoordinationNodes: scenario.coupCoordinationNodes!.map((node) =>
        node.id === NODE_B
          ? { ...node, countryId: asCountryId("f018.foreign-country") }
          : node,
      ),
    };
    expect(
      runResponseStep(inconsistentScenario, world, [
        createAction(world, NODE_B, "coup"),
      ]).nextWorld.coupCoordinationResponses,
    ).toEqual({});
  });

  it("does not infer a majority or quorum from one coup response", () => {
    const scenario = createRuntimeScenario();
    const world = createInitialWorldState(scenario, 18018);
    const result = runResponseStep(scenario, world, [
      createAction(world, NODE_B, "coup"),
    ]);
    expect(result.nextWorld.conflicts[CONFLICT_ID]!.status).toBe("active");
    expect(result.nextWorld.conflicts[CONFLICT_ID]!.outcome).toBeUndefined();
    expect(
      result.nextWorld.coupCoordinationResponses![CONFLICT_ID]![NODE_A],
    ).toBeUndefined();
  });

  it("rejects a same-tick duplicate before creating a second response event", () => {
    const scenario = createRuntimeScenario();
    const world = createInitialWorldState(scenario, 18018);
    const result = runResponseStep(scenario, world, [
      createAction(world, NODE_A, "coup", 0),
      createAction(world, NODE_A, "incumbent", 1),
    ]);
    expect(
      result.emittedEvents.filter(
        (event) => event.type === "COUP_COORDINATION_NODE_RESPONDED",
      ),
    ).toHaveLength(1);
    expect(
      result.nextWorld.coupCoordinationResponses![CONFLICT_ID]![NODE_A]!
        .alignment,
    ).toBe("coup");
    expect(responseRejectionReasons(result)).toEqual(["duplicateResponse"]);
  });

  it("includes the incumbent response event as the deterministic status-quo cause", () => {
    const scenario = createRuntimeScenario();
    const world = createInitialWorldState(scenario, 18018);
    const result = runResponseStep(scenario, world, [
      createAction(world, NODE_A, "incumbent"),
    ]);
    const response =
      result.nextWorld.coupCoordinationResponses![CONFLICT_ID]![NODE_A]!;
    const outcomeEvent = result.emittedEvents.find(
      (event) => event.type === "CONFLICT_RESOLVED",
    );
    expect(outcomeEvent?.causeIds).toEqual([response.eventId]);
  });

  it("preserves Government authority continuity through the existing outcome sink", () => {
    const scenario = createRuntimeScenario();
    const world = createInitialWorldState(scenario, 18018);
    const currentGovernmentId = Object.values(world.countries)[0]!
      .currentGovernmentId!;
    const result = runResponseStep(scenario, world, [
      createAction(world, NODE_A, "coup", 0),
      createAction(world, NODE_B, "coup", 1),
    ]);
    expect(result.nextWorld.governments[currentGovernmentId]!.authority).toBe(
      "contender",
    );
    expect(
      result.nextWorld.governments[asGovernmentId("f018.successor-government")]!
        .authority,
    ).toBe("central");
  });

  it("does not reopen a resolved conflict or emit a second response event", () => {
    const scenario = createRuntimeScenario();
    const initial = createRecord(scenario);
    const resolved = commitResponseStep(scenario, initial, [
      createAction(initial.world, NODE_A, "incumbent"),
    ]);
    const followUp = commitResponseStep(scenario, resolved, [
      createAction(resolved.world, NODE_B, "coup"),
    ]);
    expect(followUp.world.conflicts[CONFLICT_ID]!.status).toBe("resolved");
    expect(
      followUp.eventStore.events.filter(
        (event) => event.type === "COUP_COORDINATION_NODE_RESPONDED",
      ),
    ).toHaveLength(1);
  });

  it("stores the accepted response tick consistently across action, state, and event", () => {
    const scenario = createRuntimeScenario();
    const initial = createRecord(scenario);
    const record = commitResponseStep(scenario, initial, [
      createAction(initial.world, NODE_A, "coup"),
    ]);
    const response =
      record.world.coupCoordinationResponses![CONFLICT_ID]![NODE_A]!;
    const action = record.world.run.actionLog.find(
      (candidate) => candidate.id === response.actionId,
    )!;
    const event = record.eventStore.events.find(
      (candidate) => candidate.id === response.eventId,
    )!;
    expect(response.respondedAtTick).toBe(action.tick);
    expect(response.respondedAtTick).toBe(event.tick);
  });

  it("canonicalizes nested response-map insertion order on V7 load", () => {
    const scenario = createRuntimeScenario();
    const initial = createRecord(scenario);
    const record = commitResponseStep(scenario, initial, [
      createAction(initial.world, NODE_A, "coup"),
    ]);
    const snapshot = JSON.parse(
      serializeSimulationSnapshotJson(scenario, record),
    ) as {
      world: {
        coupCoordinationResponses: Record<string, Record<string, unknown>>;
      };
    };
    const byNode = snapshot.world.coupCoordinationResponses[CONFLICT_ID]!;
    snapshot.world.coupCoordinationResponses[CONFLICT_ID] = Object.fromEntries(
      Object.entries(byNode).reverse(),
    );
    expect(
      serializeSimulationSnapshotJson(
        scenario,
        deserializeSimulationSnapshot(scenario, snapshot),
      ),
    ).toBe(serializeSimulationSnapshotJson(scenario, record));
  });

  it("rejects V6 and missing response fields instead of silently migrating them", () => {
    const scenario = createRuntimeScenario();
    const record = createRecord(scenario);
    const snapshot = JSON.parse(
      serializeSimulationSnapshotJson(scenario, record),
    ) as {
      formatVersion: number;
      world: { coupCoordinationResponses?: unknown };
    };
    expect(() =>
      deserializeSimulationSnapshot(scenario, {
        ...snapshot,
        formatVersion: 6,
      }),
    ).toThrow("Unsupported simulation snapshot version 6");
    delete snapshot.world.coupCoordinationResponses;
    expect(() => deserializeSimulationSnapshot(scenario, snapshot)).toThrow(
      "snapshot.world.coupCoordinationResponses is missing",
    );
  });

  it("keeps a long no-response horizon free of autonomous response writes", () => {
    const scenario = createRuntimeScenario();
    let record = createRecord(scenario);
    for (let index = 0; index < 30; index += 1) {
      record = commitResponseStep(scenario, record);
    }
    expect(record.world.tick).toBe(30);
    expect(record.world.conflicts[CONFLICT_ID]!.status).toBe("active");
    expect(record.world.coupCoordinationResponses).toEqual({});
    expect(
      record.eventStore.events.some(
        (event) => event.type === "COUP_COORDINATION_NODE_RESPONDED",
      ),
    ).toBe(false);
  });

  it("rejects a mismatched ActionRecord payload at the V7 trust boundary", () => {
    const scenario = createRuntimeScenario();
    const initial = createRecord(scenario);
    const record = commitResponseStep(scenario, initial, [
      createAction(initial.world, NODE_A, "coup"),
    ]);
    const snapshot = JSON.parse(
      serializeSimulationSnapshotJson(scenario, record),
    ) as {
      world: {
        run: {
          actionLog: Array<{
            actionType: string;
            payload: Record<string, unknown>;
          }>;
        };
      };
    };
    snapshot.world.run.actionLog[0]!.payload.alignment = "incumbent";
    expect(() => deserializeSimulationSnapshot(scenario, snapshot)).toThrow(
      "does not match its ActionRecord payload",
    );
  });
});
