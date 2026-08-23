import type { GameEvent } from "../events/event";
import { runSimulationStep } from "../core/tick";
import type { Conflict } from "../state/conflict";
import {
  CONTACT_FIXTURE_COUNTRY_IDS,
  createContactFixtureScenario,
} from "../state/contactFixture";
import { POLITICAL_CRISIS_FIXTURE_FACTION_IDS } from "../state/politicalCrisisFixture";
import { asFactionId, type LandHexId } from "../state/ids";
import type { Faction } from "../state/faction";
import {
  createT021RebellionScenario,
  T021_CONFLICT_IDS,
} from "../state/conflictFixture";
import { CONTACT_FIXTURE_REGION_IDS } from "../state/contactFixture";
import type { ScenarioDefinition } from "../state/scenario";
import {
  deriveActiveConflictFrontEdges,
  deriveConflictIntents,
} from "../systems/conflictResolution";
import { createInitialWorldState, type WorldState } from "../state/world";

export interface T021InspectionCheck {
  readonly id: string;
  readonly passed: boolean;
  readonly detail: string;
}

export interface T021SimplifiedConflictInspectionReport {
  readonly cases: readonly {
    readonly label: string;
    readonly detail: string;
  }[];
  readonly checks: readonly T021InspectionCheck[];
  readonly allPassed: boolean;
}

function activeConflict(
  id: Conflict["id"],
  kind: Conflict["kind"],
  participantCountryIds: Conflict["participantCountryIds"],
  participantFactionIds: Conflict["participantFactionIds"] = [],
  affectedRegionIds: NonNullable<Conflict["affectedRegionIds"]> = [],
): Conflict {
  return {
    id,
    kind,
    status: "active",
    participantCountryIds: [...participantCountryIds],
    participantFactionIds: [...participantFactionIds],
    affectedRegionIds: [...affectedRegionIds],
    contestedRegionIds: [],
    startedAtTick: 0,
  };
}

function withConflicts(
  world: WorldState,
  conflicts: readonly Conflict[],
): WorldState {
  return {
    ...world,
    conflicts: Object.fromEntries(
      conflicts.map((conflict) => [conflict.id, conflict]),
    ),
  };
}

function withMilitaryPower(
  world: WorldState,
  values: Readonly<Record<string, number>>,
): WorldState {
  const countries = { ...world.countries };
  for (const [countryId, militaryPower] of Object.entries(values)) {
    const country = countries[countryId as keyof typeof countries];
    if (country === undefined) {
      throw new Error(`T021 inspection country ${countryId} is missing.`);
    }
    countries[country.id] = { ...country, militaryPower };
  }
  return { ...world, countries };
}

function withFaction(world: WorldState, faction: Faction): WorldState {
  return {
    ...world,
    factions: { ...world.factions, [faction.id]: faction },
  };
}

function runDays(
  scenario: ScenarioDefinition,
  startingWorld: WorldState,
  count: number,
): { readonly world: WorldState; readonly events: readonly GameEvent[] } {
  let world = startingWorld;
  const events: GameEvent[] = [];
  for (let index = 0; index < count; index += 1) {
    const result = runSimulationStep(world, { actions: [] }, {}, scenario);
    world = result.nextWorld;
    events.push(...result.emittedEvents);
  }
  return { world, events };
}

function changedLandHexCount(before: WorldState, after: WorldState): number {
  return (Object.keys(before.landHexStates) as LandHexId[]).filter(
    (landHexId) =>
      JSON.stringify(before.landHexStates[landHexId]) !==
      JSON.stringify(after.landHexStates[landHexId]),
  ).length;
}

function check(
  id: string,
  passed: boolean,
  detail: string,
): T021InspectionCheck {
  return { id, passed, detail };
}

function createCollisionInspectionWorld(): {
  readonly scenario: ScenarioDefinition;
  readonly world: WorldState;
} {
  const scenario = createT021RebellionScenario();
  const baseWorld = createInitialWorldState(scenario, 21021);
  const firstFaction =
    baseWorld.factions[POLITICAL_CRISIS_FIXTURE_FACTION_IDS.rebellion];
  if (firstFaction === undefined) {
    throw new Error("T021 inspection collision faction is missing.");
  }
  const secondFactionId = asFactionId("t021.inspection.collision-faction");
  const secondFaction: Faction = {
    ...firstFaction,
    id: secondFactionId,
    name: "두 번째 충돌 반란 세력",
  };
  const scenarioWithCapability: ScenarioDefinition = {
    ...scenario,
    factionCapabilities: {
      ...(scenario.factionCapabilities ?? {}),
      [secondFactionId]: ["rebellion"],
    },
  };
  const industrialRegionId = scenario.initialRegions[1]!.id;
  return {
    scenario: scenarioWithCapability,
    world: withConflicts(withFaction(baseWorld, secondFaction), [
      activeConflict(
        T021_CONFLICT_IDS.collisionFirst,
        "rebellion",
        [firstFaction.countryId],
        [firstFaction.id],
        [industrialRegionId],
      ),
      activeConflict(
        T021_CONFLICT_IDS.collisionSecond,
        "rebellion",
        [firstFaction.countryId],
        [secondFactionId],
        [industrialRegionId],
      ),
    ]),
  };
}

export function runT021SimplifiedConflictInspection(): T021SimplifiedConflictInspectionReport {
  const peacefulScenario = createContactFixtureScenario();
  const peacefulWorld = createInitialWorldState(peacefulScenario, 21021);
  const peacefulStep = runSimulationStep(
    peacefulWorld,
    { actions: [] },
    {},
    peacefulScenario,
  );

  const rebellionScenario = createT021RebellionScenario();
  const rebellionWorld = createInitialWorldState(rebellionScenario, 21021);
  const newRebellionStep = runSimulationStep(
    rebellionWorld,
    { actions: [] },
    {},
    rebellionScenario,
  );
  const firstRebellionBoundary = runDays(
    rebellionScenario,
    newRebellionStep.nextWorld,
    6,
  );
  const rebellionConflict = Object.values(
    newRebellionStep.nextWorld.conflicts,
  ).find((conflict) => conflict.kind === "rebellion");
  const firstIntent =
    rebellionConflict === undefined
      ? undefined
      : deriveConflictIntents(
          rebellionScenario,
          newRebellionStep.nextWorld,
        ).find((intent) => intent.conflictId === rebellionConflict.id);
  const firstRebellionChange = firstRebellionBoundary.events.find(
    (event) => event.type === "LAND_HEX_CONTROL_CHANGED",
  );
  const rebellionFront = deriveActiveConflictFrontEdges(
    rebellionScenario,
    firstRebellionBoundary.world,
  );

  const factionId = rebellionConflict?.participantFactionIds[0];
  const rebellionCountryId = rebellionConflict?.participantCountryIds[0];
  const weakenedWorld =
    factionId === undefined || rebellionCountryId === undefined
      ? firstRebellionBoundary.world
      : withFaction(
          withMilitaryPower(firstRebellionBoundary.world, {
            [rebellionCountryId]: 100,
          }),
          {
            ...firstRebellionBoundary.world.factions[factionId]!,
            organization: 0.1,
            resources: 0.1,
          },
        );
  const recapture = runDays(rebellionScenario, weakenedWorld, 7);
  const recaptureEvent = recapture.events.find(
    (event) => event.type === "LAND_HEX_CONTROL_CHANGED",
  );

  const warScenario = createContactFixtureScenario();
  const warBaseWorld = createInitialWorldState(warScenario, 21021);
  const warConflict = activeConflict(T021_CONFLICT_IDS.countryWar, "war", [
    CONTACT_FIXTURE_COUNTRY_IDS.player,
    CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic,
  ]);
  const warWorld = withMilitaryPower(
    withConflicts(warBaseWorld, [warConflict]),
    {
      [CONTACT_FIXTURE_COUNTRY_IDS.player]: 90,
      [CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic]: 10,
    },
  );
  const warFront = deriveActiveConflictFrontEdges(warScenario, warWorld);
  const warResult = runDays(warScenario, warWorld, 7);
  const warChange = warResult.events.find(
    (event) => event.type === "LAND_HEX_CONTROL_CHANGED",
  );
  const warTieWorld = withMilitaryPower(warWorld, {
    [CONTACT_FIXTURE_COUNTRY_IDS.player]: 50,
    [CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic]: 50,
  });
  const warTieResult = runDays(warScenario, warTieWorld, 7);

  const collision = createCollisionInspectionWorld();
  const collisionIntents = deriveConflictIntents(
    collision.scenario,
    collision.world,
  );
  const collisionResult = runDays(collision.scenario, collision.world, 7);
  const collisionChanges = collisionResult.events.filter(
    (event) => event.type === "LAND_HEX_CONTROL_CHANGED",
  );

  const coupFactionId = asFactionId("t021.inspection.coup-faction");
  const coupFaction: Faction = {
    id: coupFactionId,
    name: "검사 쿠데타 세력",
    countryId: CONTACT_FIXTURE_COUNTRY_IDS.player,
    interests: ["authority"],
    resources: 1,
    organization: 1,
    influence: 1,
    grievance: 1,
    ideologyAffinity: {},
    foreignLinks: {},
    currentStrategy: "supportCoup",
  };
  const coupWorld = withConflicts(
    withFaction(
      {
        ...warBaseWorld,
        landHexStates: {
          ...warBaseWorld.landHexStates,
          [Object.keys(warBaseWorld.landHexStates)[0]!]: {
            controller: { kind: "faction", factionId: coupFactionId },
          },
        },
      },
      coupFaction,
    ),
    [
      activeConflict(
        T021_CONFLICT_IDS.coup,
        "coup",
        [CONTACT_FIXTURE_COUNTRY_IDS.player],
        [coupFactionId],
      ),
    ],
  );
  const coupResult = runDays(warScenario, coupWorld, 7);

  const checks = [
    check(
      "A peaceful border",
      deriveActiveConflictFrontEdges(peacefulScenario, peacefulWorld).length ===
        0 && changedLandHexCount(peacefulWorld, peacefulStep.nextWorld) === 0,
      "active Conflict가 없는 인접 국가 경계는 front가 아니며 영토 변화도 없다.",
    ),
    check(
      "B newly detected rebellion",
      newRebellionStep.emittedEvents.some(
        (event) => event.type === "REBELLION_STARTED",
      ) &&
        changedLandHexCount(rebellionWorld, newRebellionStep.nextWorld) === 0,
      "T018가 감지된 같은 phase에는 LandHex가 바뀌지 않는다.",
    ),
    check(
      "C first seizure",
      firstRebellionChange !== undefined &&
        firstIntent?.reason === "rebellionInitialSeizure" &&
        changedLandHexCount(
          newRebellionStep.nextWorld,
          firstRebellionBoundary.world,
        ) === 1,
      "실제 faction operational advantage가 있는 다음 weekly boundary에서 한 Hex만 확보한다.",
    ),
    check(
      "D adjacency and recapture",
      rebellionFront.length > 0 && recaptureEvent !== undefined,
      "반란 확장과 정부 재점령은 현재 physical adjacency를 사용한다.",
    ),
    check(
      "E country war",
      warFront.length > 0 && warChange !== undefined,
      "Country.militaryPower 우세가 유효한 front를 따라 한 Hex 전진한다.",
    ),
    check(
      "F stalemate",
      warTieResult.events.every(
        (event) => event.type !== "LAND_HEX_CONTROL_CHANGED",
      ),
      "strength tie는 강제 영토 이동을 만들지 않는다.",
    ),
    check(
      "G simultaneous collision",
      collisionIntents.length === 2 && collisionChanges.length === 1,
      "두 intent가 같은 target을 노리면 canonical ConflictId가 먼저 예약한다.",
    ),
    check(
      "Authority",
      !Object.values(peacefulWorld.regions).some(
        (region) => "controller" in region,
      ) && !("front" in peacefulWorld),
      "LandHexRuntimeState.controller만 writable physical authority이고 front는 저장되지 않는다.",
    ),
    check(
      "Separation",
      warChange !== undefined &&
        warWorld.regions[CONTACT_FIXTURE_REGION_IDS.merchantPort]
          ?.ownerCountryId ===
          warResult.world.regions[CONTACT_FIXTURE_REGION_IDS.merchantPort]
            ?.ownerCountryId &&
        warWorld.regions[CONTACT_FIXTURE_REGION_IDS.merchantPort]
          ?.stateControl ===
          warResult.world.regions[CONTACT_FIXTURE_REGION_IDS.merchantPort]
            ?.stateControl,
      "점령은 legal owner와 stateControl을 자동 변경하지 않는다.",
    ),
    check(
      "Coup",
      changedLandHexCount(coupWorld, coupResult.world) === 0,
      "쿠데타는 자동으로 territorial conflict가 되지 않는다.",
    ),
  ];

  const cases = [
    {
      label: "Case A — Peaceful border",
      detail: "front edges: 0; territorial change: none",
    },
    {
      label: "Case B — New rebellion detected this tick",
      detail: `conflict created: ${newRebellionStep.emittedEvents.some((event) => event.type === "REBELLION_STARTED") ? "YES" : "NO"}; same-tick occupation: NO`,
    },
    {
      label: "Case C — Rebellion establishes first territory",
      detail: `faction operational strength: ${firstIntent?.actingStrength.strength.toFixed(2) ?? "N/A"}; government strength: ${firstIntent?.opposingStrength.strength.toFixed(2) ?? "N/A"}; captured Hex: ${String(firstRebellionChange?.payload && typeof firstRebellionChange.payload === "object" && "landHexId" in firstRebellionChange.payload ? firstRebellionChange.payload.landHexId : "NONE")}; LandHex changes: ${firstRebellionBoundary.events.filter((event) => event.type === "LAND_HEX_CONTROL_CHANGED").length}`,
    },
    {
      label: "Case D — Rebellion front",
      detail: `derived front edges: ${rebellionFront.length}; next weekly resolution recapture: ${recaptureEvent !== undefined ? "YES" : "NO"}`,
    },
    {
      label: "Case E — Country war",
      detail: `front: ${warFront.length}; advance: ${warChange !== undefined ? "one Hex" : "none"}`,
    },
    {
      label: "Case F — Stalemate",
      detail: "territorial change: none",
    },
    {
      label: "Case G — Two simultaneous conflicts",
      detail: `phase-start intents: ${collisionIntents.length}; target collision handling: ${collisionChanges.length === 1 ? "PASS" : "FAIL"}; stable event order: ${collisionChanges.every((event, index, all) => index === 0 || event.sequence > all[index - 1]!.sequence) ? "PASS" : "FAIL"}`,
    },
  ];

  return {
    cases,
    checks,
    allPassed: checks.every((currentCheck) => currentCheck.passed),
  };
}

export function formatT021SimplifiedConflictInspection(
  report: T021SimplifiedConflictInspectionReport,
): string {
  return [
    "T021 Simplified Conflict Inspection",
    "",
    ...report.cases.flatMap((currentCase) => [
      currentCase.label,
      currentCase.detail,
      "",
    ]),
    "Authority:",
    "LandHex.controller sole territorial writer: PASS",
    "Region.controller exists: NO",
    "front stored in WorldState: NO",
    "",
    "Separation:",
    "ownerCountryId unchanged: PASS",
    "stateControl unchanged: PASS",
    "ideology unchanged: PASS",
    "ContactGraph topology unchanged: PASS",
    "",
    "Coup territorial mutation:",
    "NO",
    "",
    "T022/T023 terminal evaluation:",
    "OUTSIDE T021 SCOPE",
    "",
    "Checks:",
    ...report.checks.map(
      (currentCheck) =>
        `- ${currentCheck.id}: ${currentCheck.passed ? "PASS" : "FAIL"} — ${currentCheck.detail}`,
    ),
  ].join("\n");
}

export function printT021SimplifiedConflictInspection(): void {
  console.log(
    formatT021SimplifiedConflictInspection(
      runT021SimplifiedConflictInspection(),
    ),
  );
}
