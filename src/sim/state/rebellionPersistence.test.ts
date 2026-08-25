import { describe, expect, it } from "vitest";

import { createInitialWorldState } from "./world";
import {
  asCountryId,
  asFactionId,
  asRebellionOperationalChannelId,
  asRebellionPersistenceProfileId,
} from "./ids";
import {
  REBELLION_OPERATIONAL_CHANNEL_KINDS,
  type RebellionOperationalChannelDefinition,
} from "./rebellionPersistence";
import { assertScenarioDefinition, type ScenarioDefinition } from "./scenario";
import { createF05Fix7PoliticalInteractionScenario } from "./politicalInteractionFixture";
import {
  createPoliticalCrisisFixtureScenario,
  POLITICAL_CRISIS_FIXTURE_FACTION_IDS,
} from "./politicalCrisisFixture";
import { createT021RebellionScenario } from "./conflictFixture";

const CHANNEL_IDS = [
  asRebellionOperationalChannelId("f022.channel.organization"),
  asRebellionOperationalChannelId("f022.channel.command"),
  asRebellionOperationalChannelId("f022.channel.logistics"),
  asRebellionOperationalChannelId("f022.channel.external"),
] as const;

function createAuthoringScenario(): ScenarioDefinition {
  const baseScenario = createPoliticalCrisisFixtureScenario();
  const country = baseScenario.initialCountries[0];
  const rebellionFaction = baseScenario.initialFactions.find(
    (faction) => faction.id === POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion,
  );

  if (country === undefined || rebellionFaction === undefined) {
    throw new Error("Rebellion persistence fixture base is incomplete.");
  }

  const channels: readonly RebellionOperationalChannelDefinition[] =
    REBELLION_OPERATIONAL_CHANNEL_KINDS.map((kind, index) => ({
      id: CHANNEL_IDS[index]!,
      countryId: country.id,
      kind,
      name: "F022 " + kind,
    }));

  return {
    ...baseScenario,
    rebellionOperationalChannels: channels,
    rebellionPersistenceProfiles: [
      {
        id: asRebellionPersistenceProfileId("f022.profile.rebellion"),
        countryId: country.id,
        factionId: rebellionFaction.id,
        channelIds: [...CHANNEL_IDS],
      },
    ],
  };
}

function addForeignCountry(
  scenario: ScenarioDefinition,
  countryId: ReturnType<typeof asCountryId>,
): ScenarioDefinition {
  const sourceCountry = scenario.initialCountries[0];
  if (sourceCountry === undefined) {
    throw new Error("Rebellion persistence fixture country is missing.");
  }

  return {
    ...scenario,
    initialCountries: [
      ...scenario.initialCountries,
      {
        ...sourceCountry,
        id: countryId,
        name: "Foreign F022 Country",
        currentGovernmentId: null,
        capitalRegionId: null,
      },
    ],
  };
}

function expectScenarioToReject(
  scenario: ScenarioDefinition,
  message: string,
): void {
  expect(() => assertScenarioDefinition(scenario)).toThrow(message);
}

describe("Rebellion Persistence static authoring seam", () => {
  it("accepts valid channel and profile authoring", () => {
    expect(() =>
      assertScenarioDefinition(createAuthoringScenario()),
    ).not.toThrow();
  });

  it("accepts all four closed operational channel kinds", () => {
    const scenario = createAuthoringScenario();

    expect(
      scenario.rebellionOperationalChannels?.map((channel) => channel.kind),
    ).toEqual([...REBELLION_OPERATIONAL_CHANNEL_KINDS]);
    expect(() => assertScenarioDefinition(scenario)).not.toThrow();
  });

  it("accepts absent authoring", () => {
    expect(() =>
      assertScenarioDefinition(createPoliticalCrisisFixtureScenario()),
    ).not.toThrow();
  });

  it("accepts explicitly empty authoring arrays", () => {
    const scenario = createPoliticalCrisisFixtureScenario();

    expect(() =>
      assertScenarioDefinition({
        ...scenario,
        rebellionOperationalChannels: [],
        rebellionPersistenceProfiles: [],
      }),
    ).not.toThrow();
  });

  it("keeps absent and empty authoring initial WorldState identical", () => {
    const scenario = createPoliticalCrisisFixtureScenario();
    const absentWorld = createInitialWorldState(scenario, 22022);
    const emptyWorld = createInitialWorldState(
      {
        ...scenario,
        rebellionOperationalChannels: [],
        rebellionPersistenceProfiles: [],
      },
      22022,
    );

    expect(emptyWorld).toEqual(absentWorld);
  });

  it("rejects an empty operational channel ID", () => {
    const scenario = createAuthoringScenario();

    expectScenarioToReject(
      {
        ...scenario,
        rebellionOperationalChannels: [
          {
            ...scenario.rebellionOperationalChannels![0]!,
            id: asRebellionOperationalChannelId(""),
          },
        ],
      },
      "identity must not be empty",
    );
  });

  it("rejects duplicate operational channel IDs", () => {
    const scenario = createAuthoringScenario();
    const channel = scenario.rebellionOperationalChannels![0]!;

    expectScenarioToReject(
      {
        ...scenario,
        rebellionOperationalChannels: [
          channel,
          { ...channel, name: "Duplicate" },
        ],
      },
      "operational channels repeat",
    );
  });

  it("rejects an unknown operational channel Country", () => {
    const scenario = createAuthoringScenario();

    expectScenarioToReject(
      {
        ...scenario,
        rebellionOperationalChannels: [
          {
            ...scenario.rebellionOperationalChannels![0]!,
            countryId: asCountryId("f022.missing-country"),
          },
        ],
      },
      "references missing country",
    );
  });

  it("rejects an unsupported operational channel kind", () => {
    const scenario = createAuthoringScenario();

    expectScenarioToReject(
      {
        ...scenario,
        rebellionOperationalChannels: [
          {
            ...scenario.rebellionOperationalChannels![0]!,
            kind: "unsupportedKind" as never,
          },
        ],
      },
      "has an invalid kind",
    );
  });

  it("rejects a blank operational channel name", () => {
    const scenario = createAuthoringScenario();

    expectScenarioToReject(
      {
        ...scenario,
        rebellionOperationalChannels: [
          {
            ...scenario.rebellionOperationalChannels![0]!,
            name: " \t ",
          },
        ],
      },
      "must have a non-empty name",
    );
  });

  it("rejects an empty persistence profile ID", () => {
    const scenario = createAuthoringScenario();

    expectScenarioToReject(
      {
        ...scenario,
        rebellionPersistenceProfiles: [
          {
            ...scenario.rebellionPersistenceProfiles![0]!,
            id: asRebellionPersistenceProfileId(""),
          },
        ],
      },
      "profile identity must not be empty",
    );
  });

  it("rejects duplicate persistence profile IDs", () => {
    const scenario = createAuthoringScenario();
    const profile = scenario.rebellionPersistenceProfiles![0]!;

    expectScenarioToReject(
      {
        ...scenario,
        rebellionPersistenceProfiles: [profile, { ...profile }],
      },
      "persistence profiles repeat",
    );
  });

  it("rejects an unknown profile Country", () => {
    const scenario = createAuthoringScenario();

    expectScenarioToReject(
      {
        ...scenario,
        rebellionPersistenceProfiles: [
          {
            ...scenario.rebellionPersistenceProfiles![0]!,
            countryId: asCountryId("f022.missing-profile-country"),
          },
        ],
      },
      "references missing country",
    );
  });

  it("rejects an unknown profile Faction", () => {
    const scenario = createAuthoringScenario();

    expectScenarioToReject(
      {
        ...scenario,
        rebellionPersistenceProfiles: [
          {
            ...scenario.rebellionPersistenceProfiles![0]!,
            factionId: asFactionId("f022.missing-profile-faction"),
          },
        ],
      },
      "references missing faction",
    );
  });

  it("rejects a Faction/Country mismatch", () => {
    const scenario = createAuthoringScenario();
    const foreignCountryId = asCountryId("f022.foreign-mismatch-country");

    expectScenarioToReject(
      {
        ...addForeignCountry(scenario, foreignCountryId),
        rebellionPersistenceProfiles: [
          {
            ...scenario.rebellionPersistenceProfiles![0]!,
            countryId: foreignCountryId,
          },
        ],
      },
      "must belong to country",
    );
  });

  it("rejects a Faction without authored rebellion capability", () => {
    const scenario = createAuthoringScenario();

    expectScenarioToReject(
      {
        ...scenario,
        rebellionPersistenceProfiles: [
          {
            ...scenario.rebellionPersistenceProfiles![0]!,
            factionId: POLITICAL_CRISIS_FIXTURE_FACTION_IDS.coup,
          },
        ],
      },
      "must have the rebellion capability",
    );
  });

  it("rejects a duplicate exact Country/Faction profile pair", () => {
    const scenario = createAuthoringScenario();
    const profile = scenario.rebellionPersistenceProfiles![0]!;

    expectScenarioToReject(
      {
        ...scenario,
        rebellionPersistenceProfiles: [
          profile,
          {
            ...profile,
            id: asRebellionPersistenceProfileId("f022.profile.duplicate-pair"),
          },
        ],
      },
      "repeats Country/Faction pair",
    );
  });

  it("keeps delimiter-collision lookalike Country/Faction pairs distinct", () => {
    const baseScenario = createPoliticalCrisisFixtureScenario();
    const sourceCountry = baseScenario.initialCountries[0];
    const sourceFaction = baseScenario.initialFactions.find(
      (faction) =>
        faction.id === POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion,
    );

    if (sourceCountry === undefined || sourceFaction === undefined) {
      throw new Error("Delimiter collision fixture base is incomplete.");
    }

    const firstCountryId = asCountryId("f022:collision");
    const firstFactionId = asFactionId("country:faction");
    const secondCountryId = asCountryId("f022");
    const secondFactionId = asFactionId("collision:country:faction");
    const firstChannelId = asRebellionOperationalChannelId(
      "f022.collision.first-channel",
    );
    const secondChannelId = asRebellionOperationalChannelId(
      "f022.collision.second-channel",
    );

    const scenario: ScenarioDefinition = {
      ...baseScenario,
      initialCountries: [
        ...baseScenario.initialCountries,
        {
          ...sourceCountry,
          id: firstCountryId,
          name: "F022 Collision Country 1",
          currentGovernmentId: null,
          capitalRegionId: null,
        },
        {
          ...sourceCountry,
          id: secondCountryId,
          name: "F022 Collision Country 2",
          currentGovernmentId: null,
          capitalRegionId: null,
        },
      ],
      initialFactions: [
        ...baseScenario.initialFactions,
        {
          ...sourceFaction,
          id: firstFactionId,
          countryId: firstCountryId,
          name: "F022 Collision Faction 1",
        },
        {
          ...sourceFaction,
          id: secondFactionId,
          countryId: secondCountryId,
          name: "F022 Collision Faction 2",
        },
      ],
      factionCapabilities: {
        ...baseScenario.factionCapabilities,
        [firstFactionId]: ["rebellion"],
        [secondFactionId]: ["rebellion"],
      },
      rebellionOperationalChannels: [
        {
          id: firstChannelId,
          countryId: firstCountryId,
          kind: "organizationalContinuity",
          name: "F022 Collision Channel 1",
        },
        {
          id: secondChannelId,
          countryId: secondCountryId,
          kind: "commandContinuity",
          name: "F022 Collision Channel 2",
        },
      ],
      rebellionPersistenceProfiles: [
        {
          id: asRebellionPersistenceProfileId("f022.collision.profile.1"),
          countryId: firstCountryId,
          factionId: firstFactionId,
          channelIds: [firstChannelId],
        },
        {
          id: asRebellionPersistenceProfileId("f022.collision.profile.2"),
          countryId: secondCountryId,
          factionId: secondFactionId,
          channelIds: [secondChannelId],
        },
      ],
    };

    expect(() => assertScenarioDefinition(scenario)).not.toThrow();
  });

  it("rejects an empty profile channel set", () => {
    const scenario = createAuthoringScenario();

    expectScenarioToReject(
      {
        ...scenario,
        rebellionPersistenceProfiles: [
          {
            ...scenario.rebellionPersistenceProfiles![0]!,
            channelIds: [],
          },
        ],
      },
      "must reference at least one channel",
    );
  });

  it("rejects duplicate channel references inside a profile", () => {
    const scenario = createAuthoringScenario();
    const channelId = scenario.rebellionOperationalChannels![0]!.id;

    expectScenarioToReject(
      {
        ...scenario,
        rebellionPersistenceProfiles: [
          {
            ...scenario.rebellionPersistenceProfiles![0]!,
            channelIds: [channelId, channelId],
          },
        ],
      },
      "repeats channel",
    );
  });

  it("rejects an unknown profile channel reference", () => {
    const scenario = createAuthoringScenario();

    expectScenarioToReject(
      {
        ...scenario,
        rebellionPersistenceProfiles: [
          {
            ...scenario.rebellionPersistenceProfiles![0]!,
            channelIds: [
              asRebellionOperationalChannelId("f022.missing-channel"),
            ],
          },
        ],
      },
      "references missing channel",
    );
  });

  it("rejects a channel referenced from a foreign Country", () => {
    const scenario = createAuthoringScenario();
    const foreignCountryId = asCountryId("f022.foreign-channel-country");
    const foreignChannelId = asRebellionOperationalChannelId(
      "f022.foreign-channel",
    );

    expectScenarioToReject(
      {
        ...addForeignCountry(scenario, foreignCountryId),
        rebellionOperationalChannels: [
          ...scenario.rebellionOperationalChannels!,
          {
            id: foreignChannelId,
            countryId: foreignCountryId,
            kind: "externalSupport",
            name: "Foreign F022 Channel",
          },
        ],
        rebellionPersistenceProfiles: [
          {
            ...scenario.rebellionPersistenceProfiles![0]!,
            channelIds: [foreignChannelId],
          },
        ],
      },
      "must belong to country",
    );
  });

  it("keeps channel and profile insertion order from changing initial WorldState", () => {
    const scenario = createAuthoringScenario();
    const firstFaction = scenario.initialFactions[0];
    const firstProfile = scenario.rebellionPersistenceProfiles![0]!;

    if (firstFaction === undefined) {
      throw new Error("Insertion-order fixture faction is missing.");
    }

    const secondFactionId = asFactionId("f022.insertion.second-faction");
    const secondChannelId = asRebellionOperationalChannelId(
      "f022.insertion.second-channel",
    );
    const secondProfileId = asRebellionPersistenceProfileId(
      "f022.insertion.second-profile",
    );
    const secondChannel: RebellionOperationalChannelDefinition = {
      id: secondChannelId,
      countryId: firstFaction.countryId,
      kind: "commandContinuity",
      name: "F022 Insertion Second Channel",
    };
    const expanded: ScenarioDefinition = {
      ...scenario,
      initialFactions: [
        ...scenario.initialFactions,
        { ...firstFaction, id: secondFactionId, name: "F022 Second Faction" },
      ],
      factionCapabilities: {
        ...scenario.factionCapabilities,
        [secondFactionId]: ["rebellion"],
      },
      rebellionOperationalChannels: [
        ...scenario.rebellionOperationalChannels!,
        secondChannel,
      ],
      rebellionPersistenceProfiles: [
        ...scenario.rebellionPersistenceProfiles!,
        {
          id: secondProfileId,
          countryId: firstFaction.countryId,
          factionId: secondFactionId,
          channelIds: [secondChannelId],
        },
      ],
    };
    const reversed: ScenarioDefinition = {
      ...expanded,
      rebellionOperationalChannels: [
        ...expanded.rebellionOperationalChannels!,
      ].reverse(),
      rebellionPersistenceProfiles: [
        ...expanded.rebellionPersistenceProfiles!,
      ].reverse(),
    };

    expect(createInitialWorldState(reversed, 22022)).toEqual(
      createInitialWorldState(expanded, 22022),
    );
    expect(firstProfile.channelIds).toEqual([...CHANNEL_IDS]);
  });

  it("creates only the deliberate empty V8 episode map", () => {
    const world = createInitialWorldState(createAuthoringScenario(), 22022);

    expect(world.rebellionPersistenceEpisodes).toEqual({});
    expect(world).not.toHaveProperty("rebellionOperationalEvidence");
    expect(world).not.toHaveProperty("rebellionPersistenceState");
    expect(world.run.actionLog).toEqual([]);
    expect(world.run.nextEventSequence).toBe(0);
  });

  it("keeps no-authoring T018, T021, and F05 historical initial behavior", () => {
    const scenarios = [
      createPoliticalCrisisFixtureScenario(),
      createT021RebellionScenario(),
      createF05Fix7PoliticalInteractionScenario(),
    ];

    for (const scenario of scenarios) {
      const absentWorld = createInitialWorldState(scenario, 22022);
      const emptyWorld = createInitialWorldState(
        {
          ...scenario,
          rebellionOperationalChannels: [],
          rebellionPersistenceProfiles: [],
        },
        22022,
      );

      expect(emptyWorld).toEqual(absentWorld);
    }
  });
});
