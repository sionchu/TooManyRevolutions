import { runSimulationStep } from "../core/tick";
import type { Faction } from "../state/faction";
import {
  asFactionId,
  asLandHexId,
  type LandHexId,
  type RegionId,
} from "../state/ids";
import {
  CONTACT_FIXTURE_COUNTRY_IDS,
  CONTACT_FIXTURE_LAND_HEX_IDS,
  CONTACT_FIXTURE_REGION_IDS,
  createContactFixtureScenario,
} from "../state/contactFixture";
import { deriveCountryIdeology } from "../state/ideology";
import { createIdeologyFixtureScenario } from "../state/ideologyFixture";
import type { TerritorialController } from "../state/region";
import type { ScenarioDefinition } from "../state/scenario";
import {
  deriveCountryTerritorialProjection,
  deriveRegionControlSummary,
  getFullyControlledRegionIds,
  assertLandHexRuntimeStateInvariants,
  changeLandHexController,
  getPartiallyControlledRegionIds,
} from "../state/territorialControl";
import { getLandHexesForRegion as getScenarioLandHexesForRegion } from "../state/territorialTopology";
import { deriveCountryContacts } from "../systems/contactGraph";
import { deriveCountryInstability } from "../systems/instability";
import { createInitialWorldState, type WorldState } from "../state/world";

export interface T017BInspectionCheck {
  readonly id: string;
  readonly passed: boolean;
  readonly detail: string;
}

export interface T017BRegionRow {
  readonly regionId: RegionId;
  readonly regionName: string;
  readonly landHexIds: readonly LandHexId[];
  readonly initialController: TerritorialController;
  readonly summaryKind: string;
  readonly controllerCounts: readonly string[];
}

export interface T017BTerritorialAuthorityMigrationReport {
  readonly scenarioId: string;
  readonly regionRows: readonly T017BRegionRow[];
  readonly economyProduction: {
    readonly fullCountryProduction: number;
    readonly partialCountryProduction: number;
  };
  readonly ideologyAggregation: {
    readonly fullRegionCount: number;
    readonly partialRegionCount: number;
    readonly fullAggregateSupport: number;
    readonly partialAggregateSupport: number;
  };
  readonly contactProjection: {
    readonly fullContactCount: number;
    readonly partialContactCount: number;
  };
  readonly instabilityAggregation: {
    readonly fullValue: number;
    readonly partialValue: number;
  };
  readonly mutationEvents: readonly string[];
  readonly checks: readonly T017BInspectionCheck[];
}

const PLAYER_COUNTRY_ID = CONTACT_FIXTURE_COUNTRY_IDS.player;
const MERCHANT_COUNTRY_ID = CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic;
const MIGRATION_FACTION_ID = asFactionId("t017b.inspection.faction");

function controllerLabel(controller: TerritorialController): string {
  switch (controller.kind) {
    case "country":
      return `country:${controller.countryId}`;
    case "faction":
      return `faction:${controller.factionId}`;
    case "uncontrolled":
      return "uncontrolled";
  }
}

function withLandHexController(
  world: WorldState,
  landHexId: LandHexId,
  controller: TerritorialController,
): WorldState {
  return {
    ...world,
    landHexStates: {
      ...world.landHexStates,
      [landHexId]: { controller: { ...controller } },
    },
  };
}

function withRegionController(
  scenario: ScenarioDefinition,
  world: WorldState,
  regionId: RegionId,
  controller: TerritorialController,
): WorldState {
  return getScenarioLandHexesForRegion(scenario, regionId).reduce(
    (currentWorld, landHex) =>
      withLandHexController(currentWorld, landHex.id, controller),
    world,
  );
}

function withOneRegionHexController(
  scenario: ScenarioDefinition,
  world: WorldState,
  regionId: RegionId,
  landHexId: LandHexId,
  controller: TerritorialController,
): WorldState {
  const memberIds = getScenarioLandHexesForRegion(scenario, regionId).map(
    (landHex) => landHex.id,
  );
  if (!memberIds.includes(landHexId)) {
    throw new Error(
      `Inspection LandHex ${landHexId} is not in Region ${regionId}.`,
    );
  }

  return withLandHexController(world, landHexId, controller);
}

function withFaction(world: WorldState): WorldState {
  const faction: Faction = {
    id: MIGRATION_FACTION_ID,
    name: "영토 검사 세력",
    countryId: PLAYER_COUNTRY_ID,
    interests: [],
    resources: 0,
    organization: 0.5,
    influence: 0.5,
    grievance: 0.5,
    ideologyAffinity: {},
    foreignLinks: {},
    currentStrategy: "wait",
  };

  return {
    ...world,
    factions: { ...world.factions, [faction.id]: faction },
  };
}

function withRegionProduction(
  scenario: ScenarioDefinition,
  entries: Readonly<Record<RegionId, number>>,
): ScenarioDefinition {
  return {
    ...scenario,
    initialRegions: scenario.initialRegions.map((region) => ({
      ...region,
      resourceProductionCapacity:
        entries[region.id] === undefined
          ? region.resourceProductionCapacity
          : { food: entries[region.id] },
    })),
  };
}

function createAlternateCardinalityScenario(
  scenario: ScenarioDefinition,
): ScenarioDefinition {
  return {
    ...scenario,
    id: `${scenario.id}-alternate` as ScenarioDefinition["id"],
    mapTerritorialTopology: {
      landHexes: [
        ...scenario.mapTerritorialTopology.landHexes,
        {
          id: asLandHexId("t017b.alternate.extra-hex"),
          regionId: CONTACT_FIXTURE_REGION_IDS.capital,
          coordinate: { q: 3, r: 0 },
          terrain: "plains",
        },
      ],
    },
  };
}

function check(
  id: string,
  passed: boolean,
  detail: string,
): T017BInspectionCheck {
  return { id, passed, detail };
}

export function runT017BTerritorialAuthorityMigrationInspection(): T017BTerritorialAuthorityMigrationReport {
  const scenario = createContactFixtureScenario();
  const world = createInitialWorldState(scenario, 17017);
  const capitalHexes = getScenarioLandHexesForRegion(
    scenario,
    CONTACT_FIXTURE_REGION_IDS.capital,
  );
  const capitalEast = capitalHexes.find(
    (landHex) => landHex.id === CONTACT_FIXTURE_LAND_HEX_IDS.capitalEast,
  );
  const capitalWest = capitalHexes.find(
    (landHex) => landHex.id === CONTACT_FIXTURE_LAND_HEX_IDS.capitalWest,
  );
  if (capitalEast === undefined || capitalWest === undefined) {
    throw new Error("T017B inspection capital must have two LandHexes.");
  }

  const partialWorld = withOneRegionHexController(
    scenario,
    world,
    CONTACT_FIXTURE_REGION_IDS.capital,
    capitalEast.id,
    { kind: "uncontrolled" },
  );
  const contestedWorld = withOneRegionHexController(
    scenario,
    world,
    CONTACT_FIXTURE_REGION_IDS.capital,
    capitalEast.id,
    { kind: "country", countryId: MERCHANT_COUNTRY_ID },
  );
  const factionWorld = withOneRegionHexController(
    scenario,
    withFaction(world),
    CONTACT_FIXTURE_REGION_IDS.capital,
    capitalEast.id,
    { kind: "faction", factionId: MIGRATION_FACTION_ID },
  );
  const uncontrolledWorld = withRegionController(
    scenario,
    world,
    CONTACT_FIXTURE_REGION_IDS.capital,
    { kind: "uncontrolled" },
  );
  const partialContactWorld = withRegionController(
    scenario,
    world,
    CONTACT_FIXTURE_REGION_IDS.port,
    { kind: "uncontrolled" },
  );

  const economyScenario = withRegionProduction(scenario, {
    [CONTACT_FIXTURE_REGION_IDS.capital]: 10,
    [CONTACT_FIXTURE_REGION_IDS.port]: 5,
  });
  const economyWorld = createInitialWorldState(economyScenario, 17017);
  const partialEconomyWorld = withOneRegionHexController(
    economyScenario,
    economyWorld,
    CONTACT_FIXTURE_REGION_IDS.capital,
    capitalEast.id,
    { kind: "uncontrolled" },
  );
  const fullEconomyResult = runSimulationStep(
    economyWorld,
    { actions: [] },
    {},
    economyScenario,
  );
  const partialEconomyResult = runSimulationStep(
    partialEconomyWorld,
    { actions: [] },
    {},
    economyScenario,
  );

  const ideologyScenario = createIdeologyFixtureScenario();
  const ideologyWorld = createInitialWorldState(ideologyScenario, 17017);
  const ideologyPlayer = ideologyScenario.playerCountryId;
  if (ideologyPlayer === null) {
    throw new Error("T017B ideology inspection needs a player country.");
  }
  const ideologyPartialWorld = withOneRegionHexController(
    ideologyScenario,
    ideologyWorld,
    ideologyScenario.initialRegions[1]!.id,
    ideologyScenario.mapTerritorialTopology.landHexes[1]!.id,
    { kind: "uncontrolled" },
  );
  const fullIdeology = deriveCountryIdeology(
    ideologyScenario,
    ideologyWorld,
    ideologyPlayer,
  );
  const partialIdeology = deriveCountryIdeology(
    ideologyScenario,
    ideologyPartialWorld,
    ideologyPlayer,
  );

  const unrestWorld: WorldState = {
    ...world,
    regions: {
      ...world.regions,
      [CONTACT_FIXTURE_REGION_IDS.capital]: {
        ...world.regions[CONTACT_FIXTURE_REGION_IDS.capital]!,
        unrest: 1,
      },
    },
  };
  const fullInstability = deriveCountryInstability(
    unrestWorld,
    PLAYER_COUNTRY_ID,
    scenario,
  );
  const partialInstability = deriveCountryInstability(
    partialWorld,
    PLAYER_COUNTRY_ID,
    scenario,
  );

  const mutation = changeLandHexController(scenario, world, {
    landHexId: CONTACT_FIXTURE_LAND_HEX_IDS.port,
    nextController: { kind: "country", countryId: MERCHANT_COUNTRY_ID },
    tick: 1,
  });
  const secondMutation = changeLandHexController(scenario, mutation.nextWorld, {
    landHexId: CONTACT_FIXTURE_LAND_HEX_IDS.capitalWest,
    nextController: { kind: "uncontrolled" },
    tick: 1,
  });
  const noOpMutation = changeLandHexController(scenario, world, {
    landHexId: CONTACT_FIXTURE_LAND_HEX_IDS.port,
    nextController: { kind: "country", countryId: PLAYER_COUNTRY_ID },
    tick: 1,
  });

  const alternateScenario = createAlternateCardinalityScenario(scenario);
  const alternateWorld = createInitialWorldState(alternateScenario, 17017);
  const baselineProjection = deriveCountryTerritorialProjection(
    scenario,
    world,
    PLAYER_COUNTRY_ID,
  );
  const alternateProjection = deriveCountryTerritorialProjection(
    alternateScenario,
    alternateWorld,
    PLAYER_COUNTRY_ID,
  );

  const regionRows = [...scenario.initialRegions]
    .sort((first, second) => (first.id < second.id ? -1 : 1))
    .map<T017BRegionRow>((region) => {
      const summary = deriveRegionControlSummary(scenario, world, region.id);
      return {
        regionId: region.id,
        regionName: region.name,
        landHexIds: getScenarioLandHexesForRegion(scenario, region.id).map(
          (landHex) => landHex.id,
        ),
        initialController: region.initialController,
        summaryKind: summary.kind,
        controllerCounts: summary.controllerCounts.map(
          (entry) =>
            `${controllerLabel(entry.controller)}=${entry.landHexCount}`,
        ),
      };
    });

  const checks: T017BInspectionCheck[] = [];
  checks.push(
    check(
      "A initial migration",
      scenario.mapTerritorialTopology.landHexes.every((landHex) => {
        const region = scenario.initialRegions.find(
          (candidate) => candidate.id === landHex.regionId,
        );
        return (
          region !== undefined &&
          world.landHexStates[landHex.id]?.controller.kind ===
            region.initialController.kind &&
          !Object.prototype.hasOwnProperty.call(
            world.regions[landHex.regionId] ?? {},
            "controller",
          )
        );
      }),
      "모든 초기 LandHex가 static initialController를 상속하고 runtime Region에는 controller가 없다.",
    ),
    check(
      "B sole physical authority",
      mutation.nextWorld.landHexStates[CONTACT_FIXTURE_LAND_HEX_IDS.port]
        ?.controller.kind === "country" &&
        mutation.nextWorld.regions[CONTACT_FIXTURE_REGION_IDS.port] !==
          undefined,
      "물리적 변경은 LandHexRuntimeState에만 기록된다.",
    ),
    check(
      "C full multi-Hex control",
      deriveRegionControlSummary(
        scenario,
        world,
        CONTACT_FIXTURE_REGION_IDS.capital,
      ).kind === "fullyControlled" &&
        getFullyControlledRegionIds(
          scenario,
          world,
          PLAYER_COUNTRY_ID,
        ).includes(CONTACT_FIXTURE_REGION_IDS.capital),
      "두 LandHex를 같은 국가가 제어하면 Region은 fullyControlled projection이다.",
    ),
    check(
      "D partial occupation",
      deriveRegionControlSummary(
        scenario,
        partialWorld,
        CONTACT_FIXTURE_REGION_IDS.capital,
      ).kind === "partial",
      "국가 제어 + uncontrolled LandHex 혼합은 partial이다.",
    ),
    check(
      "D2 contested control",
      deriveRegionControlSummary(
        scenario,
        contestedWorld,
        CONTACT_FIXTURE_REGION_IDS.capital,
      ).kind === "contested",
      "서로 다른 국가가 같은 Region의 LandHex를 나누면 contested projection이다.",
    ),
    check(
      "E faction presence",
      deriveRegionControlSummary(
        scenario,
        factionWorld,
        CONTACT_FIXTURE_REGION_IDS.capital,
      ).factionIds.includes(MIGRATION_FACTION_ID),
      "faction-controlled LandHex는 faction presence projection에 남는다.",
    ),
    check(
      "F uncontrolled",
      deriveRegionControlSummary(
        scenario,
        uncontrolledWorld,
        CONTACT_FIXTURE_REGION_IDS.capital,
      ).kind === "uncontrolled",
      "모든 member LandHex가 uncontrolled이면 Region도 uncontrolled projection이다.",
    ),
    check(
      "G economy boundary",
      fullEconomyResult.nextWorld.countries[PLAYER_COUNTRY_ID]?.production ===
        15 &&
        partialEconomyResult.nextWorld.countries[PLAYER_COUNTRY_ID]
          ?.production === 5,
      "경제는 fully controlled Region만 국가 생산에 포함하고 partial Region은 제외한다.",
    ),
    check(
      "H ideology boundary",
      Object.keys(fullIdeology).length > 0 &&
        Object.keys(partialIdeology).length > 0 &&
        (partialIdeology[
          Object.keys(partialIdeology)[0] as keyof typeof partialIdeology
        ]?.support ?? 0) !==
          (fullIdeology[
            Object.keys(fullIdeology)[0] as keyof typeof fullIdeology
          ]?.support ?? 0),
      "이념 국가는 LandHex 단위 population split 없이 fully controlled Region만 집계한다.",
    ),
    check(
      "I contact boundary",
      deriveCountryContacts(scenario, world).length > 0 &&
        deriveCountryContacts(scenario, partialContactWorld).length <
          deriveCountryContacts(scenario, world).length &&
        deriveCountryContacts(scenario, partialContactWorld).every(
          (contact) =>
            contact.fromRegionId !== CONTACT_FIXTURE_REGION_IDS.port &&
            contact.toRegionId !== CONTACT_FIXTURE_REGION_IDS.port,
        ),
      "ContactGraph는 Region edge를 유지하지만 partial endpoint의 국가 projection은 제외한다.",
    ),
    check(
      "J instability boundary",
      fullInstability > partialInstability,
      "국가 불안 집계는 fully controlled Region만 포함한다.",
    ),
    check(
      "K stateControl independence",
      deriveRegionControlSummary(
        scenario,
        {
          ...world,
          regions: {
            ...world.regions,
            [CONTACT_FIXTURE_REGION_IDS.capital]: {
              ...world.regions[CONTACT_FIXTURE_REGION_IDS.capital]!,
              stateControl: 0.1,
            },
          },
        },
        CONTACT_FIXTURE_REGION_IDS.capital,
      ).kind === "fullyControlled",
      "stateControl은 행정 reach이며 physical controller projection과 독립이다.",
    ),
    check(
      "L legal owner independence",
      deriveRegionControlSummary(
        scenario,
        {
          ...world,
          regions: {
            ...world.regions,
            [CONTACT_FIXTURE_REGION_IDS.capital]: {
              ...world.regions[CONTACT_FIXTURE_REGION_IDS.capital]!,
              ownerCountryId: MERCHANT_COUNTRY_ID,
            },
          },
        },
        CONTACT_FIXTURE_REGION_IDS.capital,
      ).fullyControlledByCountryId === PLAYER_COUNTRY_ID,
      "법적 소유권 변경은 physical control projection을 바꾸지 않는다.",
    ),
    check(
      "M ContactGraph independence",
      deriveCountryContacts(scenario, world)
        .map((contact) => contact.edgeId)
        .join(",") ===
        deriveCountryContacts(
          {
            ...scenario,
            mapTerritorialTopology: {
              landHexes: scenario.mapTerritorialTopology.landHexes.map(
                (landHex) => ({
                  ...landHex,
                  coordinate: {
                    q: landHex.coordinate.q + 100,
                    r: landHex.coordinate.r + 100,
                  },
                }),
              ),
            },
          },
          createInitialWorldState(
            {
              ...scenario,
              mapTerritorialTopology: {
                landHexes: scenario.mapTerritorialTopology.landHexes.map(
                  (landHex) => ({
                    ...landHex,
                    coordinate: {
                      q: landHex.coordinate.q + 100,
                      r: landHex.coordinate.r + 100,
                    },
                  }),
                ),
              },
            },
            17017,
          ),
        )
          .map((contact) => contact.edgeId)
          .join(","),
      "TerritorialTopology 위치 변경은 ContactGraph edge를 생성·삭제하지 않는다.",
    ),
    check(
      "N mutation API",
      mutation.emittedEvents.length === 1 &&
        secondMutation.emittedEvents.length === 1 &&
        noOpMutation.emittedEvents.length === 0 &&
        noOpMutation.nextWorld === world &&
        world.landHexStates[CONTACT_FIXTURE_LAND_HEX_IDS.port]?.controller
          .kind === "country",
      "typed mutation은 immutable하고 no-op event를 만들지 않는다.",
    ),
    check(
      "O deterministic event order",
      secondMutation.emittedEvents[0]?.sequence === 1 &&
        secondMutation.emittedEvents[0]?.id ===
          "event:1:1:LAND_HEX_CONTROL_CHANGED" &&
        mutation.emittedEvents[0]?.causeIds.length === 0,
      "LandHex control events는 global sequence와 deterministic ID를 따른다.",
    ),
    check(
      "P alternate cardinality",
      alternateWorld.landHexStates[asLandHexId("t017b.alternate.extra-hex")] !==
        undefined &&
        alternateProjection.controlledLandHexIds.length ===
          baselineProjection.controlledLandHexIds.length + 1,
      "추가 LandHex cardinality가 engine hardcode 없이 초기화된다.",
    ),
    check(
      "Q baseline projection semantics",
      baselineProjection.fullyControlledRegionIds.length === 5 &&
        getPartiallyControlledRegionIds(scenario, world, PLAYER_COUNTRY_ID)
          .length === 0,
      "기존 fully controlled baseline semantics가 projection으로 유지된다.",
    ),
  );

  // Keep the imported helper exercised as the inspection's explicit full-boundary assertion.
  assertLandHexRuntimeStateInvariants(scenario, world);

  return {
    scenarioId: scenario.id,
    regionRows,
    economyProduction: {
      fullCountryProduction:
        fullEconomyResult.nextWorld.countries[PLAYER_COUNTRY_ID]?.production ??
        0,
      partialCountryProduction:
        partialEconomyResult.nextWorld.countries[PLAYER_COUNTRY_ID]
          ?.production ?? 0,
    },
    ideologyAggregation: {
      fullRegionCount: getFullyControlledRegionIds(
        ideologyScenario,
        ideologyWorld,
        ideologyPlayer,
      ).length,
      partialRegionCount: getPartiallyControlledRegionIds(
        ideologyScenario,
        ideologyPartialWorld,
        ideologyPlayer,
      ).length,
      fullAggregateSupport:
        fullIdeology[Object.keys(fullIdeology)[0] as keyof typeof fullIdeology]
          ?.support ?? 0,
      partialAggregateSupport:
        partialIdeology[
          Object.keys(partialIdeology)[0] as keyof typeof partialIdeology
        ]?.support ?? 0,
    },
    contactProjection: {
      fullContactCount: deriveCountryContacts(scenario, world).length,
      partialContactCount: deriveCountryContacts(scenario, partialContactWorld)
        .length,
    },
    instabilityAggregation: {
      fullValue: fullInstability,
      partialValue: partialInstability,
    },
    mutationEvents: [
      ...mutation.emittedEvents,
      ...secondMutation.emittedEvents,
    ].map((event) => {
      const payload =
        typeof event.payload === "object" &&
        event.payload !== null &&
        !Array.isArray(event.payload)
          ? (event.payload as Readonly<Record<string, unknown>>)
          : ({} as Readonly<Record<string, unknown>>);
      const landHexId =
        typeof payload.landHexId === "string" ? payload.landHexId : "?";
      return `${event.sequence}:${event.type}:${event.id}:${landHexId}`;
    }),
    checks,
  };
}

export function formatT017BTerritorialAuthorityMigrationInspection(
  report: T017BTerritorialAuthorityMigrationReport,
): string {
  const lines = [
    "T017B Territorial Authority Migration Inspection",
    "",
    `Scenario: ${report.scenarioId}`,
    "Authority: LandHexRuntimeState.controller is the sole writable physical control",
    "",
    "Region projection:",
    "| Region | LandHexes | initial controller | summary | controller counts |",
    "|---|---|---|---|---|",
  ];

  for (const row of report.regionRows) {
    lines.push(
      `| ${row.regionName} | ${row.landHexIds.join(", ")} | ${controllerLabel(row.initialController)} | ${row.summaryKind} | ${row.controllerCounts.join(", ")} |`,
    );
  }

  lines.push(
    "",
    "Consumer boundaries:",
    `- economy full / partial country production: ${report.economyProduction.fullCountryProduction} / ${report.economyProduction.partialCountryProduction}`,
    `- ideology full / partial aggregate support: ${report.ideologyAggregation.fullAggregateSupport.toFixed(3)} / ${report.ideologyAggregation.partialAggregateSupport.toFixed(3)}`,
    `- contacts full / partial endpoint count: ${report.contactProjection.fullContactCount} / ${report.contactProjection.partialContactCount}`,
    `- instability full / partial: ${report.instabilityAggregation.fullValue.toFixed(3)} / ${report.instabilityAggregation.partialValue.toFixed(3)}`,
    "",
    "Mutation events:",
    ...report.mutationEvents.map((event) => `- ${event}`),
    "",
    "Checks:",
  );

  for (const item of report.checks) {
    lines.push(
      `- ${item.id}: ${item.passed ? "PASS" : "FAIL"} — ${item.detail}`,
    );
  }

  return lines.join("\n");
}
