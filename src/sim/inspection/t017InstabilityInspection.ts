import { runSimulationStep } from "../core/tick";
import type { GameEvent } from "../events/event";
import {
  CONTACT_FIXTURE_COUNTRY_IDS,
  CONTACT_FIXTURE_REGION_IDS,
} from "../state/contactFixture";
import { createIdeologyDiffusionFixtureScenario } from "../state/ideologyDiffusionFixture";
import {
  asActionId,
  asFactionId,
  asInterventionCommitmentId,
  asInterventionId,
  asScenarioId,
  type CountryId,
  type IdeologyId,
  type RegionId,
} from "../state/ids";
import { IDEOLOGY_FIXTURE_IDS } from "../state/ideologyFixture";
import type { Faction } from "../state/faction";
import type { IdeologyState } from "../state/ideology";
import type {
  Region,
  ScenarioRegion,
  TerritorialController,
} from "../state/region";
import type { ScenarioDefinition } from "../state/scenario";
import type { InterventionCommitment } from "../state/intervention";
import { createInitialWorldState, type WorldState } from "../state/world";
import { getLandHexesForRegion } from "../state/territorialTopology";
import {
  createInstabilityPhaseHook,
  DEFAULT_INSTABILITY_CONFIG,
  deriveCountryInstability,
  deriveRegionalPressureSnapshot,
  type InstabilityConfig,
  type RegionalPressureSnapshot,
} from "../systems/instability";

export const T017_INSPECTION_CHECKPOINTS = [30, 90, 180, 360] as const;
export const T017_INSPECTION_SEED = 20260822;

const PLAYER_COUNTRY_ID = CONTACT_FIXTURE_COUNTRY_IDS.player;
const TARGET_REGION_ID = CONTACT_FIXTURE_REGION_IDS.port;
const ADMIN_LOW_REGION_ID = CONTACT_FIXTURE_REGION_IDS.capital;
const ADMIN_HIGH_REGION_ID = CONTACT_FIXTURE_REGION_IDS.port;
const AGGREGATE_REGION_IDS = [
  CONTACT_FIXTURE_REGION_IDS.capital,
  CONTACT_FIXTURE_REGION_IDS.port,
  CONTACT_FIXTURE_REGION_IDS.farmland,
] as const;
const POLITICAL_FACTION_ID = asFactionId("t017.inspection.faction");
const POLITICAL_IDEOLOGY_ID = IDEOLOGY_FIXTURE_IDS.republicanism;

type ScenarioKind =
  | "baseline"
  | "material"
  | "political"
  | "politicalLowOrganization"
  | "administrative";

export interface T017InstabilityCheckpoint {
  readonly day: number;
  readonly unrest: number;
  readonly countryInstability: number;
  readonly material: number;
  readonly political: number;
  readonly administrative: number;
  readonly combined: number;
}

export interface T017ScenarioInspection {
  readonly id: ScenarioKind | "recovery";
  readonly label: string;
  readonly targetRegionId: RegionId;
  readonly targetRegionName: string;
  /** Pressure is sampled after one settled simulation day. */
  readonly pressure: RegionalPressureSnapshot;
  readonly checkpoints: readonly T017InstabilityCheckpoint[];
  readonly bandEvents: readonly GameEvent[];
}

export interface T017CountryAggregateRow {
  readonly regionId: RegionId;
  readonly regionName: string;
  readonly population: number;
  readonly unrest: number;
  readonly weightedContribution: number;
}

export interface T017CountryAggregateInspection {
  readonly countryId: CountryId;
  readonly rows: readonly T017CountryAggregateRow[];
  readonly finalInstability: number;
}

export interface T017InstabilityInspectionReport {
  readonly config: typeof DEFAULT_INSTABILITY_CONFIG;
  readonly baseline: T017ScenarioInspection;
  readonly material: T017ScenarioInspection;
  readonly political: T017ScenarioInspection;
  readonly politicalLowOrganization: T017ScenarioInspection;
  readonly administrative: T017ScenarioInspection;
  readonly administrativeComparison: {
    readonly lowControl: RegionalPressureSnapshot;
    readonly highControl: RegionalPressureSnapshot;
  };
  readonly recovery: T017ScenarioInspection;
  readonly countryAggregate: T017CountryAggregateInspection;
}

function cloneIdeology(
  ideology: Readonly<Record<IdeologyId, IdeologyState>>,
): Readonly<Record<IdeologyId, IdeologyState>> {
  return Object.fromEntries(
    Object.entries(ideology).map(([ideologyId, state]) => [
      ideologyId,
      { ...state },
    ]),
  ) as Readonly<Record<IdeologyId, IdeologyState>>;
}

function normalizedRegion(region: ScenarioRegion): ScenarioRegion {
  return {
    ...region,
    resources: {},
    resourceProductionCapacity: {},
    resourceProduction: {},
    resourceDemand: {},
    scarcity: 0,
    unrest: 0,
    stateControl: 0.8,
    ideology: cloneIdeology(region.ideology),
  };
}

function setRegion(
  regions: readonly ScenarioRegion[],
  regionId: RegionId,
  patch: Partial<Region>,
): ScenarioRegion[] {
  return regions.map((region) =>
    region.id === regionId ? { ...region, ...patch } : region,
  );
}

function setIdeology(
  regions: readonly ScenarioRegion[],
  regionId: RegionId,
  ideologyId: IdeologyId,
  state: IdeologyState,
): ScenarioRegion[] {
  return regions.map((region) =>
    region.id === regionId
      ? {
          ...region,
          ideology: {
            ...region.ideology,
            [ideologyId]: { ...state },
          },
        }
      : region,
  );
}

function createPoliticalFaction(): Faction {
  return {
    id: POLITICAL_FACTION_ID,
    name: "항구 정치조직",
    countryId: PLAYER_COUNTRY_ID,
    interests: ["trade"],
    resources: 0.4,
    organization: 0.85,
    influence: 0.2,
    grievance: 0.9,
    ideologyAffinity: { [POLITICAL_IDEOLOGY_ID]: 1 },
    foreignLinks: {},
    currentStrategy: "wait",
  };
}

/** Build fixture-only scenarios; this does not add production content. */
export function createT017InstabilityInspectionScenario(
  kind: ScenarioKind,
): ScenarioDefinition {
  const base = createIdeologyDiffusionFixtureScenario();
  let regions = base.initialRegions.map(normalizedRegion);
  let factions: readonly Faction[] = [];
  let countries = base.initialCountries;

  switch (kind) {
    case "baseline":
      break;
    case "material":
      regions = setRegion(regions, TARGET_REGION_ID, {
        resourceDemand: { food: 20 },
      });
      break;
    case "political":
    case "politicalLowOrganization":
      factions = [createPoliticalFaction()];
      regions = setIdeology(regions, TARGET_REGION_ID, POLITICAL_IDEOLOGY_ID, {
        support: 0.2,
        radicalism: kind === "political" ? 0.85 : 0.02,
        organization: kind === "political" ? 0.8 : 0.02,
      });
      break;
    case "administrative":
      countries = base.initialCountries.map((country) =>
        country.id === PLAYER_COUNTRY_ID
          ? { ...country, stateCapacity: 40 }
          : country,
      );
      regions = setRegion(regions, ADMIN_LOW_REGION_ID, {
        stateControl: 0.2,
      });
      regions = setRegion(regions, ADMIN_HIGH_REGION_ID, {
        stateControl: 0.9,
      });
      break;
  }

  return {
    ...base,
    id: asScenarioId(`t017-instability-${kind}`),
    initialCountries: countries,
    initialRegions: regions,
    initialFactions: factions,
  };
}

function withAdministrativeCommitment(world: WorldState): WorldState {
  const commitmentId = asInterventionCommitmentId(
    "commitment:t017.inspection.overload",
  );
  const commitment: InterventionCommitment = {
    id: commitmentId,
    interventionId: asInterventionId("t017.inspection.administrative-load"),
    countryId: PLAYER_COUNTRY_ID,
    sourceActionId: asActionId("t017.inspection.overload-source"),
    startedTick: 0,
    firstOccupiedTick: 0,
    completionTick: 1000,
    administrativeLoad: 55,
  };

  return {
    ...world,
    interventionCommitments: {
      [commitmentId]: commitment,
    },
  };
}

function runStep(
  world: WorldState,
  config: InstabilityConfig,
  scenario: ScenarioDefinition,
): WorldState {
  return runSimulationStep(
    world,
    { actions: [] },
    { instability: createInstabilityPhaseHook(config) },
    scenario,
  ).nextWorld;
}

function checkpoint(
  world: WorldState,
  scenario: ScenarioDefinition,
  regionId: RegionId,
  countryId: CountryId,
  config: InstabilityConfig,
  day: number,
): T017InstabilityCheckpoint {
  const region = world.regions[regionId];
  if (region === undefined) {
    throw new Error(`T017 inspection is missing Region ${regionId}.`);
  }

  const pressure = deriveRegionalPressureSnapshot(
    world,
    regionId,
    config,
    scenario,
  );
  return {
    day,
    unrest: region.unrest,
    countryInstability: deriveCountryInstability(world, countryId, scenario),
    material: pressure.material.severity,
    political: pressure.political.severity,
    administrative: pressure.administrative.severity,
    combined: pressure.combinedPressure,
  };
}

function runSeries(
  scenario: ScenarioDefinition,
  targetRegionId: RegionId,
  config: InstabilityConfig,
  buildWorld: (world: WorldState) => WorldState = (world) => world,
): T017ScenarioInspection {
  const countryId = PLAYER_COUNTRY_ID;
  const initialWorld = buildWorld(
    createInitialWorldState(scenario, T017_INSPECTION_SEED),
  );
  const probeWorld = runStep(initialWorld, config, scenario);
  const pressure = deriveRegionalPressureSnapshot(
    probeWorld,
    targetRegionId,
    config,
    scenario,
  );
  const checkpoints: T017InstabilityCheckpoint[] = [];
  const bandEvents: GameEvent[] = [];
  let world = initialWorld;
  let checkpointIndex = 0;
  const maxDay = T017_INSPECTION_CHECKPOINTS.at(-1) ?? 0;

  for (let day = 1; day <= maxDay; day += 1) {
    const result = runSimulationStep(
      world,
      { actions: [] },
      { instability: createInstabilityPhaseHook(config) },
      scenario,
    );
    world = result.nextWorld;
    bandEvents.push(
      ...result.emittedEvents.filter((event) =>
        event.type.endsWith("_BAND_CHANGED"),
      ),
    );

    if (day === T017_INSPECTION_CHECKPOINTS[checkpointIndex]) {
      checkpoints.push(
        checkpoint(world, scenario, targetRegionId, countryId, config, day),
      );
      checkpointIndex += 1;
    }
  }

  const targetRegion = scenario.initialRegions.find(
    (region) => region.id === targetRegionId,
  );
  if (targetRegion === undefined) {
    throw new Error(
      `T017 inspection is missing target Region ${targetRegionId}.`,
    );
  }

  return {
    id: scenario.id.endsWith("-recovery") ? "recovery" : "baseline",
    label: "검사",
    targetRegionId,
    targetRegionName: targetRegion.name,
    pressure,
    checkpoints,
    bandEvents,
  };
}

function withInspectionIdentity(
  inspection: T017ScenarioInspection,
  id: T017ScenarioInspection["id"],
  label: string,
): T017ScenarioInspection {
  return { ...inspection, id, label };
}

function runRecovery(
  scenario: ScenarioDefinition,
  config: InstabilityConfig,
): T017ScenarioInspection {
  let world = createInitialWorldState(scenario, T017_INSPECTION_SEED);
  const bandEvents: GameEvent[] = [];

  for (let day = 1; day <= 180; day += 1) {
    const result = runSimulationStep(
      world,
      { actions: [] },
      { instability: createInstabilityPhaseHook(config) },
      scenario,
    );
    world = result.nextWorld;
    bandEvents.push(
      ...result.emittedEvents.filter((event) =>
        event.type.endsWith("_BAND_CHANGED"),
      ),
    );
  }

  const pressureBeforeRemoval = deriveRegionalPressureSnapshot(
    world,
    TARGET_REGION_ID,
    config,
    scenario,
  );
  world = {
    ...world,
    regions: {
      ...world.regions,
      [TARGET_REGION_ID]: {
        ...world.regions[TARGET_REGION_ID]!,
        resourceDemand: {},
        resources: {},
        resourceProduction: {},
      },
    },
  };

  const checkpoints: T017InstabilityCheckpoint[] = [];
  let checkpointIndex = 0;
  for (let recoveryDay = 1; recoveryDay <= 360; recoveryDay += 1) {
    const result = runSimulationStep(
      world,
      { actions: [] },
      { instability: createInstabilityPhaseHook(config) },
      scenario,
    );
    world = result.nextWorld;
    bandEvents.push(
      ...result.emittedEvents.filter((event) =>
        event.type.endsWith("_BAND_CHANGED"),
      ),
    );

    if (recoveryDay === T017_INSPECTION_CHECKPOINTS[checkpointIndex]) {
      checkpoints.push(
        checkpoint(
          world,
          scenario,
          TARGET_REGION_ID,
          PLAYER_COUNTRY_ID,
          config,
          recoveryDay,
        ),
      );
      checkpointIndex += 1;
    }
  }

  return {
    id: "recovery",
    label: "압력 제거 후 회복",
    targetRegionId: TARGET_REGION_ID,
    targetRegionName:
      scenario.initialRegions.find((region) => region.id === TARGET_REGION_ID)
        ?.name ?? TARGET_REGION_ID,
    pressure: pressureBeforeRemoval,
    checkpoints,
    bandEvents,
  };
}

function withRegionController(
  scenario: ScenarioDefinition,
  world: WorldState,
  regionId: RegionId,
  controller: TerritorialController,
): WorldState {
  const nextLandHexStates = { ...world.landHexStates };
  for (const landHex of getLandHexesForRegion(scenario, regionId)) {
    nextLandHexStates[landHex.id] = { controller: { ...controller } };
  }

  return { ...world, landHexStates: nextLandHexStates };
}

function aggregateInspection(
  scenario: ScenarioDefinition,
): T017CountryAggregateInspection {
  let world = createInitialWorldState(scenario, T017_INSPECTION_SEED);
  const unrestByRegion = [0.2, 0.5, 0.8];
  const populations = [100, 300, 600];
  const regions = { ...world.regions };

  AGGREGATE_REGION_IDS.forEach((regionId, index) => {
    const region = regions[regionId];
    if (region === undefined) {
      throw new Error(`T017 aggregate is missing Region ${regionId}.`);
    }

    regions[regionId] = {
      ...region,
      population: populations[index]!,
      unrest: unrestByRegion[index]!,
    };
  });

  for (const regionId of [
    CONTACT_FIXTURE_REGION_IDS.mine,
    CONTACT_FIXTURE_REGION_IDS.border,
  ]) {
    world = withRegionController(scenario, world, regionId, {
      kind: "uncontrolled",
    });
  }

  world = { ...world, regions };
  const rows = AGGREGATE_REGION_IDS.map((regionId) => {
    const region = world.regions[regionId]!;
    return {
      regionId,
      regionName: region.name,
      population: region.population,
      unrest: region.unrest,
      weightedContribution: region.population * region.unrest,
    };
  });

  return {
    countryId: PLAYER_COUNTRY_ID,
    rows,
    finalInstability: deriveCountryInstability(
      world,
      PLAYER_COUNTRY_ID,
      scenario,
    ),
  };
}

function formatNumber(value: number, digits = 3): string {
  return value.toFixed(digits);
}

function formatScenarioRow(inspection: T017ScenarioInspection): string {
  const checkpoints = new Map(
    inspection.checkpoints.map((entry) => [entry.day, entry]),
  );
  const valueAt = (day: number, key: keyof T017InstabilityCheckpoint) =>
    formatNumber((checkpoints.get(day)?.[key] as number | undefined) ?? 0, 3);
  const pressure = inspection.pressure;

  return `| ${inspection.label} | ${formatNumber(pressure.material.severity)} | ${formatNumber(pressure.political.severity)} | ${formatNumber(pressure.administrative.severity)} | ${formatNumber(pressure.combinedPressure)} | ${valueAt(30, "unrest")} | ${valueAt(90, "unrest")} | ${valueAt(180, "unrest")} | ${valueAt(360, "unrest")} |`;
}

function formatCheckpointTable(
  inspection: T017ScenarioInspection,
): readonly string[] {
  return inspection.checkpoints.map(
    (entry) =>
      `| ${entry.day} | ${formatNumber(entry.material)} | ${formatNumber(entry.political)} | ${formatNumber(entry.administrative)} | ${formatNumber(entry.combined)} | ${formatNumber(entry.unrest)} | ${formatNumber(entry.countryInstability, 1)} |`,
  );
}

/** Compact Korean output consumed by docs/T017_INSTABILITY_CHECK.md. */
export function formatT017InstabilityInspection(
  report: T017InstabilityInspectionReport,
): string {
  const lines = [
    "# T017 Instability Inspection Output",
    "",
    `- seed: ${T017_INSPECTION_SEED}`,
    "- authoritative tick: 1 day; calendar: 360 days/year",
    `- baseline riseRate: ${report.config.riseRate}; recoveryRate: ${report.config.recoveryRate}`,
    "- pressure 표본은 각 scenario의 첫 simulation day가 자원/행정 상태를 확정한 뒤 읽었다.",
    "",
    "## Scenario comparison",
    "",
    "| Scenario | Material | Political | Administrative | Combined | Day 30 Unrest | Day 90 | Day 180 | Day 360 |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|",
    formatScenarioRow(report.baseline),
    formatScenarioRow(report.material),
    formatScenarioRow(report.political),
    formatScenarioRow(report.administrative),
    formatScenarioRow(report.recovery),
    "",
    "## Political support comparison",
    "",
    "| variant | support | radicalism | ideology organization | political pressure |",
    "|---|---:|---:|---:|---:|",
    `| 조직화된 급진 소수 | 0.200 | 0.850 | 0.800 | ${formatNumber(report.political.pressure.political.severity)} |`,
    `| 같은 support, 낮은 radicalism/organization | 0.200 | 0.020 | 0.020 | ${formatNumber(report.politicalLowOrganization.pressure.political.severity)} |`,
    "",
    "## Administrative control comparison",
    "",
    "| region | stateControl | overload | administrative pressure |",
    "|---|---:|---:|---:|",
    `| ${report.administrativeComparison.lowControl.regionId} | 0.200 | 15.000 | ${formatNumber(report.administrativeComparison.lowControl.administrative.severity)} |`,
    `| ${report.administrativeComparison.highControl.regionId} | 0.900 | 15.000 | ${formatNumber(report.administrativeComparison.highControl.administrative.severity)} |`,
    "",
    "## Country aggregation check",
    "",
    "| Region | population | unrest | weighted contribution |",
    "|---|---:|---:|---:|",
  ];

  for (const row of report.countryAggregate.rows) {
    lines.push(
      `| ${row.regionName} | ${row.population} | ${formatNumber(row.unrest)} | ${formatNumber(row.weightedContribution, 1)} |`,
    );
  }

  lines.push(
    `| 합계/국가 불안 | ${report.countryAggregate.rows.reduce((total, row) => total + row.population, 0)} | — | ${formatNumber(
      report.countryAggregate.rows.reduce(
        (total, row) => total + row.weightedContribution,
        0,
      ),
      1,
    )} |`,
    `- final Country.instability: ${formatNumber(report.countryAggregate.finalInstability, 1)} / 100`,
    "",
    "## Detailed checkpoints",
    "",
  );

  for (const inspection of [
    report.baseline,
    report.material,
    report.political,
    report.administrative,
    report.recovery,
  ]) {
    lines.push(
      `### ${inspection.label}`,
      "",
      "| day | material | political | administrative | combined | unrest | country instability |",
      "|---:|---:|---:|---:|---:|---:|---:|",
      ...formatCheckpointTable(inspection),
      `- band events: ${inspection.bandEvents.map((event) => `${event.type}@${event.tick}`).join(", ") || "없음"}`,
      "",
    );
  }

  lines.push(
    "## Interpretation hooks",
    "",
    "- baseline은 모든 channel이 0인 제어군이다.",
    "- material은 scarcity만 지속시키며 treasury를 지역 pressure로 변환하지 않는다.",
    "- political 비교는 support를 고정하고 radicalism/organization만 바꾼다.",
    "- administrative 비교는 같은 overload에서 stateControl만 바꾼다.",
    "- recovery의 pressure source는 180일 뒤 제거되며 unrest는 즉시 0이 되지 않는다.",
  );

  return lines.join("\n");
}

/** Run the five T017 diagnostic scenarios through the authoritative step. */
export function runT017InstabilityInspection(): T017InstabilityInspectionReport {
  const config = DEFAULT_INSTABILITY_CONFIG;
  const baselineScenario = createT017InstabilityInspectionScenario("baseline");
  const materialScenario = createT017InstabilityInspectionScenario("material");
  const politicalScenario =
    createT017InstabilityInspectionScenario("political");
  const politicalLowScenario = createT017InstabilityInspectionScenario(
    "politicalLowOrganization",
  );
  const administrativeScenario =
    createT017InstabilityInspectionScenario("administrative");

  const baseline = withInspectionIdentity(
    runSeries(baselineScenario, TARGET_REGION_ID, config),
    "baseline",
    "Baseline calm",
  );
  const material = withInspectionIdentity(
    runSeries(materialScenario, TARGET_REGION_ID, config),
    "material",
    "Material pressure",
  );
  const political = withInspectionIdentity(
    runSeries(politicalScenario, TARGET_REGION_ID, config),
    "political",
    "Political mobilization",
  );
  const politicalLowOrganization = withInspectionIdentity(
    runSeries(politicalLowScenario, TARGET_REGION_ID, config),
    "politicalLowOrganization",
    "Political low radicalism/organization",
  );

  const administrativeWorld = withAdministrativeCommitment(
    createInitialWorldState(administrativeScenario, T017_INSPECTION_SEED),
  );
  const administrativeProbe = runStep(
    administrativeWorld,
    config,
    administrativeScenario,
  );
  const administrativeComparison = {
    lowControl: deriveRegionalPressureSnapshot(
      administrativeProbe,
      ADMIN_LOW_REGION_ID,
      config,
      administrativeScenario,
    ),
    highControl: deriveRegionalPressureSnapshot(
      administrativeProbe,
      ADMIN_HIGH_REGION_ID,
      config,
      administrativeScenario,
    ),
  };
  const administrative = withInspectionIdentity(
    runSeries(
      administrativeScenario,
      ADMIN_LOW_REGION_ID,
      config,
      withAdministrativeCommitment,
    ),
    "administrative",
    "Administrative overload",
  );

  const recovery = runRecovery(materialScenario, config);

  return {
    config,
    baseline,
    material,
    political,
    politicalLowOrganization,
    administrative,
    administrativeComparison,
    recovery,
    countryAggregate: aggregateInspection(baselineScenario),
  };
}
