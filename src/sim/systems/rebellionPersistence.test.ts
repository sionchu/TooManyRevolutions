import { describe, expect, it } from "vitest";

import {
  commitSimulationStep,
  deserializeSimulationSnapshot,
  serializeSimulationSnapshot,
  serializeSimulationSnapshotJson,
  SIMULATION_SNAPSHOT_FORMAT_VERSION,
} from "../core/persistence";
import { runSimulationStep } from "../core/tick";
import { createGameEvent, GAME_EVENT_TYPES } from "../events/event";
import { appendEvent, createEventStore } from "../events/eventStore";
import type { Conflict } from "../state/conflict";
import {
  asConflictId,
  asRebellionOperationalChannelId,
  asRebellionPersistenceProfileId,
} from "../state/ids";
import { createT021RebellionScenario } from "../state/conflictFixture";
import { createPoliticalCrisisFixtureScenario } from "../state/politicalCrisisFixture";
import type { ScenarioDefinition } from "../state/scenario";
import { suppressIneligibleRebellions } from "./conflictResolution";
import { createInitialWorldState } from "../state/world";
import type { RunRecord } from "../core/step";

const CHANNEL_ID = asRebellionOperationalChannelId(
  "f023.rebellion.organizational-continuity",
);
const PROFILE_ID = asRebellionPersistenceProfileId(
  "f023.rebellion.persistence-profile",
);

function withRebellionProfile(
  scenario: ScenarioDefinition,
): ScenarioDefinition {
  const country = scenario.initialCountries[0];
  const faction = scenario.initialFactions.find((candidate) =>
    (scenario.factionCapabilities?.[candidate.id] ?? []).includes("rebellion"),
  );
  if (country === undefined || faction === undefined) {
    throw new Error("F023 fixture is missing a rebellion country/faction.");
  }

  return {
    ...scenario,
    rebellionOperationalChannels: [
      {
        id: CHANNEL_ID,
        countryId: country.id,
        kind: "organizationalContinuity",
        name: "F023 authored channel",
      },
    ],
    rebellionPersistenceProfiles: [
      {
        id: PROFILE_ID,
        countryId: country.id,
        factionId: faction.id,
        channelIds: [CHANNEL_ID],
      },
    ],
  };
}

function createRecord(scenario: ScenarioDefinition): RunRecord {
  return {
    world: createInitialWorldState(scenario, 23023),
    eventStore: createEventStore(),
  };
}

function stepRecord(
  scenario: ScenarioDefinition,
  record: RunRecord,
): RunRecord {
  return commitSimulationStep(
    scenario,
    record,
    runSimulationStep(record.world, { actions: [] }, {}, scenario),
  );
}

function firstRecord(scenario: ScenarioDefinition): RunRecord {
  return stepRecord(scenario, createRecord(scenario));
}

function startEvents(record: RunRecord) {
  return record.eventStore.events.filter(
    (event) => event.type === "REBELLION_STARTED",
  );
}

function payloadValue(
  event: RunRecord["eventStore"]["events"][number],
  key: string,
): unknown {
  if (
    typeof event.payload !== "object" ||
    event.payload === null ||
    Array.isArray(event.payload)
  ) {
    return undefined;
  }
  return (event.payload as Readonly<Record<string, unknown>>)[key];
}

type SnapshotObject = {
  formatVersion: number;
  world: Record<string, unknown>;
  eventStore: { events: unknown[] };
};

function snapshotObject(
  scenario: ScenarioDefinition,
  record: RunRecord,
): SnapshotObject {
  return JSON.parse(
    serializeSimulationSnapshotJson(scenario, record),
  ) as SnapshotObject;
}

function cloneSnapshot(snapshot: SnapshotObject): SnapshotObject {
  return JSON.parse(JSON.stringify(snapshot)) as SnapshotObject;
}

function episodeMap(
  snapshot: SnapshotObject,
): Record<string, Record<string, unknown>> {
  return snapshot.world.rebellionPersistenceEpisodes as Record<
    string,
    Record<string, unknown>
  >;
}

function withSecondSyntheticEpisode(record: RunRecord): RunRecord {
  const firstEpisode = Object.values(
    record.world.rebellionPersistenceEpisodes ?? {},
  )[0];
  const firstConflict = firstEpisode
    ? record.world.conflicts[firstEpisode.conflictId]
    : undefined;
  if (firstEpisode === undefined || firstConflict === undefined) {
    throw new Error(
      "F023 insertion-order fixture is missing the first episode.",
    );
  }

  const secondConflictId = asConflictId(`${firstConflict.id}:second`);
  const secondConflict: Conflict = {
    ...firstConflict,
    id: secondConflictId,
    startedAtTick: record.world.tick,
  };
  const secondEvent = createGameEvent({
    tick: record.world.tick,
    sequence: record.world.run.nextEventSequence,
    type: "REBELLION_STARTED",
    actorId: firstEpisode.factionId,
    targetId: firstEpisode.countryId,
    causeIds: [],
    payload: {
      conflictId: secondConflictId,
      kind: "rebellion",
      countryId: firstEpisode.countryId,
      factionId: firstEpisode.factionId,
    },
    visibility: "important",
  });

  return {
    world: {
      ...record.world,
      conflicts: {
        ...record.world.conflicts,
        [secondConflictId]: secondConflict,
      },
      rebellionPersistenceEpisodes: {
        ...(record.world.rebellionPersistenceEpisodes ?? {}),
        [secondConflictId]: {
          ...firstEpisode,
          conflictId: secondConflictId,
          sourceEventId: secondEvent.id,
        },
      },
      run: {
        ...record.world.run,
        nextEventSequence: secondEvent.sequence + 1,
      },
    },
    eventStore: appendEvent(record.eventStore, secondEvent),
  };
}

describe("F05_FIX23 rebellion persistence runtime bootstrap", () => {
  it("creates exactly one profile-bound episode from the existing start event", () => {
    const scenario = withRebellionProfile(createT021RebellionScenario());
    const initial = createRecord(scenario);
    const result = runSimulationStep(
      initial.world,
      { actions: [] },
      {},
      scenario,
    );
    const starts = result.emittedEvents.filter(
      (event) => event.type === "REBELLION_STARTED",
    );
    const record = commitSimulationStep(scenario, initial, result);
    const start = starts[0];
    const conflictId = payloadValue(start!, "conflictId");

    expect(starts).toHaveLength(1);
    expect(conflictId).toEqual(expect.any(String));
    expect(
      Object.keys(record.world.rebellionPersistenceEpisodes ?? {}),
    ).toEqual([conflictId]);
    expect(
      Object.values(record.world.rebellionPersistenceEpisodes ?? {})[0],
    ).toEqual({
      conflictId,
      profileId: PROFILE_ID,
      countryId: start?.targetId,
      factionId: start?.actorId,
      bootstrappedAtTick: start?.tick,
      sourceEventId: start?.id,
    });
    expect(
      record.eventStore.events.filter(
        (event) =>
          event.type === "REBELLION_STARTED" &&
          payloadValue(event, "conflictId") === conflictId,
      ),
    ).toHaveLength(1);
    expect(record.world.run.outcome).toEqual({ status: "active" });
  });

  it("keeps T021 territory and Conflict outcome writers untouched at bootstrap", () => {
    const scenario = withRebellionProfile(createT021RebellionScenario());
    const initial = createRecord(scenario);
    const beforeLandHexes = initial.world.landHexStates;
    const record = firstRecord(scenario);
    const rebellion = Object.values(record.world.conflicts).find(
      (conflict) => conflict.kind === "rebellion",
    );

    expect(record.world.landHexStates).toEqual(beforeLandHexes);
    expect(rebellion?.outcome).toBeUndefined();
    expect(rebellion?.contestedRegionIds).toEqual([]);
    expect(record.world.run.outcome).toEqual({ status: "active" });
  });

  it("does not create an episode without an exact profile, including absent and empty authoring", () => {
    const base = createT021RebellionScenario();
    const absent = firstRecord(base);
    const empty = firstRecord({
      ...base,
      rebellionOperationalChannels: [],
      rebellionPersistenceProfiles: [],
    });

    expect(absent.world.rebellionPersistenceEpisodes).toEqual({});
    expect(empty.world.rebellionPersistenceEpisodes).toEqual({});
    expect(serializeSimulationSnapshotJson(base, absent)).toBe(
      serializeSimulationSnapshotJson(base, empty),
    );
  });

  it("does not bootstrap from authored initial rebellions", () => {
    const base = withRebellionProfile(createT021RebellionScenario());
    const country = base.initialCountries[0]!;
    const faction = base.initialFactions.find((candidate) =>
      (base.factionCapabilities?.[candidate.id] ?? []).includes("rebellion"),
    )!;
    const initialConflict: Conflict = {
      id: asConflictId("f023.initial-rebellion"),
      kind: "rebellion",
      status: "active",
      participantCountryIds: [country.id],
      participantFactionIds: [faction.id],
      affectedRegionIds: [base.initialRegions[1]!.id],
      contestedRegionIds: [],
      startedAtTick: 0,
    };
    const scenario = { ...base, initialConflicts: [initialConflict] };
    const record = createRecord(scenario);

    expect(record.world.rebellionPersistenceEpisodes).toEqual({});
    expect(startEvents(record)).toEqual([]);
  });

  it("never creates a rebellion episode for a coup and deduplicates repeated T018 eligibility", () => {
    const scenario = withRebellionProfile(
      createPoliticalCrisisFixtureScenario(),
    );
    const initial = createRecord(scenario);
    const first = stepRecord(scenario, initial);
    const coupStarts = first.eventStore.events.filter(
      (event) => event.type === "COUP_ATTEMPT_STARTED",
    );
    const second = stepRecord(scenario, first);

    expect(coupStarts.length).toBeGreaterThan(0);
    expect(
      Object.keys(second.world.rebellionPersistenceEpisodes ?? {}).every(
        (conflictId) =>
          second.world.conflicts[conflictId as Conflict["id"]]?.kind ===
          "rebellion",
      ),
    ).toBe(true);
    expect(startEvents(second)).toHaveLength(1);
    expect(
      Object.keys(second.world.rebellionPersistenceEpisodes ?? {}),
    ).toHaveLength(1);
  });

  it("retains provenance when existing suppression resolves the rebellion", () => {
    const scenario = withRebellionProfile(createT021RebellionScenario());
    const started = firstRecord(scenario);
    const conflict = Object.values(started.world.conflicts).find(
      (candidate) => candidate.kind === "rebellion",
    );
    if (conflict === undefined) {
      throw new Error("F023 suppression fixture is missing a rebellion.");
    }
    const factionId = conflict.participantFactionIds[0]!;
    const countryId = conflict.participantCountryIds[0]!;
    const suppressed = suppressIneligibleRebellions(
      scenario,
      started.world,
      started.world.tick + 1,
      started.world.run.nextEventSequence,
      [{ factionId, countryId, eligible: false }],
    );

    expect(suppressed.nextWorld.conflicts[conflict.id]?.status).toBe(
      "resolved",
    );
    expect(suppressed.nextWorld.rebellionPersistenceEpisodes).toEqual(
      started.world.rebellionPersistenceEpisodes,
    );
    expect(suppressed.nextWorld.conflicts[conflict.id]?.outcome).toEqual({
      kind: "statusQuo",
      winner: { kind: "country", countryId },
    });
  });

  it("uses no front, LandHex, zero-territory, or operational-evidence meaning", () => {
    const scenario = withRebellionProfile(createT021RebellionScenario());
    const record = firstRecord(scenario);
    const rebellion = Object.values(record.world.conflicts).find(
      (conflict) => conflict.kind === "rebellion",
    );

    expect(rebellion?.contestedRegionIds).toEqual([]);
    expect(
      Object.values(record.world.landHexStates).some(
        (state) => state.controller.kind === "faction",
      ),
    ).toBe(false);
    expect(
      GAME_EVENT_TYPES.includes(
        "REBELLION_OPERATIONAL_EVIDENCE_RECORDED" as never,
      ),
    ).toBe(false);
    expect(record.eventStore.events.map((event) => event.type)).not.toContain(
      "REBELLION_OPERATIONAL_EVIDENCE_RECORDED",
    );
  });

  it("round-trips empty and bootstrapped V8 episode maps with event provenance", () => {
    const emptyScenario = createT021RebellionScenario();
    const empty = createRecord(emptyScenario);
    const emptySnapshot = serializeSimulationSnapshot(emptyScenario, empty);
    const loadedEmpty = deserializeSimulationSnapshot(
      emptyScenario,
      emptySnapshot,
    );
    expect(emptySnapshot.formatVersion).toBe(
      SIMULATION_SNAPSHOT_FORMAT_VERSION,
    );
    expect(emptySnapshot.formatVersion).toBe(8);
    expect(loadedEmpty.world.rebellionPersistenceEpisodes).toEqual({});

    const scenario = withRebellionProfile(createT021RebellionScenario());
    const started = firstRecord(scenario);
    const snapshot = serializeSimulationSnapshot(scenario, started);
    const loaded = deserializeSimulationSnapshot(scenario, snapshot);
    const episode = Object.values(
      loaded.world.rebellionPersistenceEpisodes ?? {},
    )[0];
    const source = episode
      ? loaded.eventStore.events.find(
          (event) => event.id === episode.sourceEventId,
        )
      : undefined;

    expect(serializeSimulationSnapshotJson(scenario, loaded)).toBe(
      serializeSimulationSnapshotJson(scenario, started),
    );
    expect(source?.type).toBe("REBELLION_STARTED");
    expect(source?.tick).toBe(episode?.bootstrappedAtTick);
  });

  it("rejects V7, missing/malformed maps, and corrupt episode identities", () => {
    const scenario = withRebellionProfile(createT021RebellionScenario());
    const started = firstRecord(scenario);

    const oldVersion = cloneSnapshot(snapshotObject(scenario, started));
    oldVersion.formatVersion = 7;
    expect(() => deserializeSimulationSnapshot(scenario, oldVersion)).toThrow(
      "Unsupported simulation snapshot version 7",
    );

    const missingMap = cloneSnapshot(snapshotObject(scenario, started));
    delete missingMap.world.rebellionPersistenceEpisodes;
    expect(() => deserializeSimulationSnapshot(scenario, missingMap)).toThrow(
      "snapshot.world.rebellionPersistenceEpisodes is missing",
    );

    const malformedMap = cloneSnapshot(snapshotObject(scenario, started));
    malformedMap.world.rebellionPersistenceEpisodes = null;
    expect(() => deserializeSimulationSnapshot(scenario, malformedMap)).toThrow(
      "must be an object",
    );

    const wrongKey = cloneSnapshot(snapshotObject(scenario, started));
    const firstEntry = Object.values(episodeMap(wrongKey))[0]!;
    wrongKey.world.rebellionPersistenceEpisodes = { wrong: firstEntry };
    expect(() => deserializeSimulationSnapshot(scenario, wrongKey)).toThrow(
      "key does not match episode Conflict identity",
    );

    const unknownProfile = cloneSnapshot(snapshotObject(scenario, started));
    const profileEntry = Object.values(episodeMap(unknownProfile))[0]!;
    profileEntry.profileId = "f023.unknown-profile";
    expect(() =>
      deserializeSimulationSnapshot(scenario, unknownProfile),
    ).toThrow("missing or mismatched authored profile provenance");

    const mismatchedCountry = cloneSnapshot(snapshotObject(scenario, started));
    const countryEntry = Object.values(episodeMap(mismatchedCountry))[0]!;
    countryEntry.countryId = "f023.unknown-country";
    expect(() =>
      deserializeSimulationSnapshot(scenario, mismatchedCountry),
    ).toThrow();

    const mismatchedFaction = cloneSnapshot(snapshotObject(scenario, started));
    const factionEntry = Object.values(episodeMap(mismatchedFaction))[0]!;
    factionEntry.factionId = "f023.unknown-faction";
    expect(() =>
      deserializeSimulationSnapshot(scenario, mismatchedFaction),
    ).toThrow();

    const unknownConflict = cloneSnapshot(snapshotObject(scenario, started));
    const unknownConflictMap = episodeMap(unknownConflict);
    const [knownConflictId, knownEpisode] =
      Object.entries(unknownConflictMap)[0]!;
    const unknownConflictId = "f023.unknown-conflict";
    unknownConflict.world.rebellionPersistenceEpisodes = {
      [unknownConflictId]: { ...knownEpisode, conflictId: unknownConflictId },
    };
    expect(knownConflictId).not.toBe(unknownConflictId);
    expect(() =>
      deserializeSimulationSnapshot(scenario, unknownConflict),
    ).toThrow("missing or non-rebellion Conflict");
  });

  it("rejects corrupt bootstrap ticks and missing/mismatched source events", () => {
    const scenario = withRebellionProfile(createT021RebellionScenario());
    const started = firstRecord(scenario);

    const futureTick = cloneSnapshot(snapshotObject(scenario, started));
    const futureEpisode = Object.values(episodeMap(futureTick))[0]!;
    futureEpisode.bootstrappedAtTick = (futureTick.world.tick as number) + 1;
    expect(() => deserializeSimulationSnapshot(scenario, futureTick)).toThrow();

    const missingEvent = cloneSnapshot(snapshotObject(scenario, started));
    missingEvent.eventStore.events = missingEvent.eventStore.events.filter(
      (event) => (event as { type?: string }).type !== "REBELLION_STARTED",
    );
    expect(() => deserializeSimulationSnapshot(scenario, missingEvent)).toThrow(
      "missing or mismatched REBELLION_STARTED provenance",
    );

    const mismatchedEvent = cloneSnapshot(snapshotObject(scenario, started));
    const event = mismatchedEvent.eventStore.events.find(
      (candidate) =>
        (candidate as { type?: string }).type === "REBELLION_STARTED",
    ) as { payload: Record<string, unknown> };
    event.payload = { ...event.payload, factionId: "f023.other-faction" };
    expect(() =>
      deserializeSimulationSnapshot(scenario, mismatchedEvent),
    ).toThrow("missing or mismatched REBELLION_STARTED provenance");

    const missingSourceId = cloneSnapshot(snapshotObject(scenario, started));
    const sourceEpisode = Object.values(episodeMap(missingSourceId))[0]!;
    sourceEpisode.sourceEventId = "event:999:999:REBELLION_STARTED";
    expect(() =>
      deserializeSimulationSnapshot(scenario, missingSourceId),
    ).toThrow("missing or mismatched REBELLION_STARTED provenance");
  });

  it("keeps uninterrupted and save/load replay equal", () => {
    const scenario = withRebellionProfile(createT021RebellionScenario());
    let continuous = createRecord(scenario);
    for (let index = 0; index < 6; index += 1) {
      continuous = stepRecord(scenario, continuous);
    }

    const checkpoint = firstRecord(scenario);
    let resumed = deserializeSimulationSnapshot(
      scenario,
      serializeSimulationSnapshot(scenario, checkpoint),
    );
    for (let index = 0; index < 5; index += 1) {
      resumed = stepRecord(scenario, resumed);
    }

    expect(serializeSimulationSnapshotJson(scenario, resumed)).toBe(
      serializeSimulationSnapshotJson(scenario, continuous),
    );
  });

  it("canonicalizes episode insertion order and preserves historical resolved provenance", () => {
    const scenario = withRebellionProfile(createT021RebellionScenario());
    const started = firstRecord(scenario);
    const expanded = withSecondSyntheticEpisode(started);
    const canonical = serializeSimulationSnapshotJson(scenario, expanded);
    const reordered = snapshotObject(scenario, expanded);
    const map = episodeMap(reordered);
    reordered.world.rebellionPersistenceEpisodes = Object.fromEntries(
      Object.entries(map).reverse(),
    );

    expect(
      serializeSimulationSnapshotJson(
        scenario,
        deserializeSimulationSnapshot(scenario, reordered),
      ),
    ).toBe(canonical);

    const firstEpisode = Object.values(
      started.world.rebellionPersistenceEpisodes ?? {},
    )[0]!;
    const resolvedWorld = {
      ...started.world,
      conflicts: {
        ...started.world.conflicts,
        [firstEpisode.conflictId]: {
          ...started.world.conflicts[firstEpisode.conflictId]!,
          status: "resolved" as const,
          resolvedAtTick: started.world.tick,
          outcome: {
            kind: "statusQuo" as const,
            winner: {
              kind: "country" as const,
              countryId: firstEpisode.countryId,
            },
          },
        },
      },
    };
    expect(
      serializeSimulationSnapshot(scenario, {
        ...started,
        world: resolvedWorld,
      }).world.rebellionPersistenceEpisodes,
    ).toHaveProperty(firstEpisode.conflictId);
  });
});
