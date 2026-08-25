import { describe, expect, it } from "vitest";

import { createInitialWorldState } from "./world";
import {
  asCoupCoordinationNodeId,
  asCountryId,
  asFactionId,
  asGovernmentId,
} from "./ids";
import { assertScenarioDefinition, type ScenarioDefinition } from "./scenario";
import {
  createPoliticalCrisisFixtureScenario,
  POLITICAL_CRISIS_FIXTURE_FACTION_IDS,
} from "./politicalCrisisFixture";

function createAuthoringScenario(): ScenarioDefinition {
  const baseScenario = createPoliticalCrisisFixtureScenario();
  const country = baseScenario.initialCountries[0];
  const coupFaction = baseScenario.initialFactions[0];

  if (country === undefined || coupFaction === undefined) {
    throw new Error("Coup coordination fixture base is incomplete.");
  }

  const successorGovernmentId = asGovernmentId(
    "coup-coordination.fixture.successor-government",
  );

  return {
    ...baseScenario,
    initialGovernments: [
      ...baseScenario.initialGovernments,
      {
        id: successorGovernmentId,
        countryId: country.id,
        name: "조정 후계 정부",
        authority: "contender",
        formedAtTick: 0,
      },
    ],
    coupCoordinationNodes: [
      {
        id: asCoupCoordinationNodeId("coup-coordination.fixture.node-a"),
        countryId: country.id,
        name: "수도 수비대",
      },
      {
        id: asCoupCoordinationNodeId("coup-coordination.fixture.node-b"),
        countryId: country.id,
        name: "국경 사령부",
      },
    ],
    coupCoordinationProfiles: [
      {
        countryId: country.id,
        coupFactionId: coupFaction.id,
        requiredNodeIds: [
          asCoupCoordinationNodeId("coup-coordination.fixture.node-a"),
          asCoupCoordinationNodeId("coup-coordination.fixture.node-b"),
        ],
        successorGovernmentId,
      },
    ],
  };
}

describe("Coup Coordination static authoring seam", () => {
  it("accepts a valid authored node set and profile without creating runtime state", () => {
    const scenario = createAuthoringScenario();

    expect(() => assertScenarioDefinition(scenario)).not.toThrow();

    const world = createInitialWorldState(scenario, 17);
    expect(world).not.toHaveProperty("coupCoordinationNodes");
    expect(world).not.toHaveProperty("coupCoordinationProfiles");
    expect(world).not.toHaveProperty("coupCoordinationAlignments");
  });

  it("keeps absent and empty authoring runtime-equivalent", () => {
    const scenario = createPoliticalCrisisFixtureScenario();
    const absentWorld = createInitialWorldState(scenario, 17);
    const emptyWorld = createInitialWorldState(
      {
        ...scenario,
        coupCoordinationNodes: [],
        coupCoordinationProfiles: [],
      },
      17,
    );

    expect(emptyWorld).toEqual(absentWorld);
  });

  it("accepts insertion-order changes because required nodes are an unordered set", () => {
    const scenario = createAuthoringScenario();
    const profile = scenario.coupCoordinationProfiles![0]!;

    expect(() =>
      assertScenarioDefinition({
        ...scenario,
        coupCoordinationNodes: [...scenario.coupCoordinationNodes!].reverse(),
        coupCoordinationProfiles: [
          {
            ...profile,
            requiredNodeIds: [...profile.requiredNodeIds].reverse(),
          },
        ].reverse(),
      }),
    ).not.toThrow();
  });

  it("rejects an empty required node set", () => {
    const scenario = createAuthoringScenario();

    expect(() =>
      assertScenarioDefinition({
        ...scenario,
        coupCoordinationProfiles: [
          { ...scenario.coupCoordinationProfiles![0]!, requiredNodeIds: [] },
        ],
      }),
    ).toThrow("must require at least one node");
  });

  it("rejects duplicate required node IDs but assigns no order semantics", () => {
    const scenario = createAuthoringScenario();
    const nodeIds = scenario.coupCoordinationProfiles![0]!.requiredNodeIds;

    expect(() =>
      assertScenarioDefinition({
        ...scenario,
        coupCoordinationProfiles: [
          {
            ...scenario.coupCoordinationProfiles![0]!,
            requiredNodeIds: [nodeIds[0]!, nodeIds[0]!],
          },
        ],
      }),
    ).toThrow("repeats required node");

    expect(() =>
      assertScenarioDefinition({
        ...scenario,
        coupCoordinationProfiles: [
          {
            ...scenario.coupCoordinationProfiles![0]!,
            requiredNodeIds: [...nodeIds].reverse(),
          },
        ],
      }),
    ).not.toThrow();
  });

  it("rejects missing or foreign node references", () => {
    const scenario = createAuthoringScenario();
    const country = scenario.initialCountries[0]!;

    expect(() =>
      assertScenarioDefinition({
        ...scenario,
        coupCoordinationProfiles: [
          {
            ...scenario.coupCoordinationProfiles![0]!,
            requiredNodeIds: [
              asCoupCoordinationNodeId("missing-coup-coordination-node"),
            ],
          },
        ],
      }),
    ).toThrow("references missing node");

    const foreignCountryId = asCountryId("coup-coordination.fixture.foreign");
    const foreignNodeId = asCoupCoordinationNodeId(
      "coup-coordination.fixture.foreign-node",
    );
    expect(() =>
      assertScenarioDefinition({
        ...scenario,
        initialCountries: [
          ...scenario.initialCountries,
          {
            ...country,
            id: foreignCountryId,
            name: "외국",
            currentGovernmentId: null,
            capitalRegionId: scenario.initialRegions[0]!.id,
          },
        ],
        coupCoordinationNodes: [
          ...scenario.coupCoordinationNodes!,
          {
            id: foreignNodeId,
            countryId: foreignCountryId,
            name: "외국 노드",
          },
        ],
        coupCoordinationProfiles: [
          {
            ...scenario.coupCoordinationProfiles![0]!,
            requiredNodeIds: [foreignNodeId],
          },
        ],
      }),
    ).toThrow("must belong to country");
  });

  it("rejects duplicate nodes, empty labels, and unknown node countries", () => {
    const scenario = createAuthoringScenario();
    const node = scenario.coupCoordinationNodes![0]!;

    expect(() =>
      assertScenarioDefinition({
        ...scenario,
        coupCoordinationNodes: [node, { ...node }],
      }),
    ).toThrow("nodes repeat");

    expect(() =>
      assertScenarioDefinition({
        ...scenario,
        coupCoordinationNodes: [{ ...node, name: "   " }],
      }),
    ).toThrow("must have a non-empty name");

    expect(() =>
      assertScenarioDefinition({
        ...scenario,
        coupCoordinationNodes: [
          { ...node, countryId: asCountryId("missing-node-country") },
        ],
      }),
    ).toThrow("references missing country");
  });

  it("rejects invalid faction, country, and successor Government references", () => {
    const scenario = createAuthoringScenario();
    const profile = scenario.coupCoordinationProfiles![0]!;
    const country = scenario.initialCountries[0]!;

    expect(() =>
      assertScenarioDefinition({
        ...scenario,
        coupCoordinationProfiles: [
          { ...profile, coupFactionId: asFactionId("missing-coup-faction") },
        ],
      }),
    ).toThrow("references missing faction");

    expect(() =>
      assertScenarioDefinition({
        ...scenario,
        coupCoordinationProfiles: [
          { ...profile, countryId: asCountryId("missing-coup-country") },
        ],
      }),
    ).toThrow("references missing country");

    expect(() =>
      assertScenarioDefinition({
        ...scenario,
        coupCoordinationProfiles: [
          {
            ...profile,
            successorGovernmentId: country.currentGovernmentId!,
          },
        ],
      }),
    ).toThrow("must differ from the current Government");

    expect(() =>
      assertScenarioDefinition({
        ...scenario,
        coupCoordinationProfiles: [
          {
            ...profile,
            successorGovernmentId: asGovernmentId(
              "missing-successor-government",
            ),
          },
        ],
      }),
    ).toThrow("references missing successor Government");
  });

  it("rejects a faction without the coup capability", () => {
    const scenario = createAuthoringScenario();
    const profile = scenario.coupCoordinationProfiles![0]!;

    expect(() =>
      assertScenarioDefinition({
        ...scenario,
        coupCoordinationProfiles: [
          {
            ...profile,
            coupFactionId: POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion,
          },
        ],
      }),
    ).toThrow("must have the coup capability");
  });

  it("rejects duplicate profiles for one country and coup faction", () => {
    const scenario = createAuthoringScenario();
    const profile = scenario.coupCoordinationProfiles![0]!;

    expect(() =>
      assertScenarioDefinition({
        ...scenario,
        coupCoordinationProfiles: [profile, { ...profile }],
      }),
    ).toThrow("profile repeats");
  });

  it("rejects a faction or successor Government from another country", () => {
    const scenario = createAuthoringScenario();
    const profile = scenario.coupCoordinationProfiles![0]!;
    const country = scenario.initialCountries[0]!;
    const foreignCountryId = asCountryId("coup-coordination.fixture.foreign");
    const foreignFactionId = asFactionId(
      "coup-coordination.fixture.foreign-faction",
    );
    const foreignGovernmentId = asGovernmentId(
      "coup-coordination.fixture.foreign-government",
    );

    const withForeignReferences: ScenarioDefinition = {
      ...scenario,
      initialCountries: [
        ...scenario.initialCountries,
        {
          ...country,
          id: foreignCountryId,
          name: "외국",
          currentGovernmentId: foreignGovernmentId,
        },
      ],
      initialFactions: [
        ...scenario.initialFactions,
        {
          ...scenario.initialFactions[0]!,
          id: foreignFactionId,
          countryId: foreignCountryId,
        },
      ],
      initialGovernments: [
        ...scenario.initialGovernments,
        {
          id: foreignGovernmentId,
          countryId: foreignCountryId,
          name: "외국 정부",
          authority: "central",
          formedAtTick: 0,
        },
      ],
    };

    expect(() =>
      assertScenarioDefinition({
        ...withForeignReferences,
        coupCoordinationProfiles: [
          { ...profile, coupFactionId: foreignFactionId },
        ],
      }),
    ).toThrow("must belong to country");

    expect(() =>
      assertScenarioDefinition({
        ...withForeignReferences,
        coupCoordinationProfiles: [
          { ...profile, successorGovernmentId: foreignGovernmentId },
        ],
      }),
    ).toThrow("successor Government must belong to country");
  });
});
