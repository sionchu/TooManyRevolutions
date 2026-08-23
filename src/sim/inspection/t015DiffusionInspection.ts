import type { JsonValue } from "../core/serialization";
import type { GameEvent } from "../events/event";
import { runSimulationStep } from "../core/tick";
import {
  getIncomingContacts,
  type ContactEdgeView,
} from "../systems/contactGraph";
import {
  createIdeologyDiffusionPhaseHook,
  DEFAULT_IDEOLOGY_DIFFUSION_RATE,
  type IdeologyDiffusionConfig,
} from "../systems/ideologyDiffusion";
import {
  CONTACT_FIXTURE_COUNTRY_IDS,
  CONTACT_FIXTURE_REGION_IDS,
} from "../state/contactFixture";
import { IDEOLOGY_FIXTURE_IDS } from "../state/ideologyFixture";
import { createIdeologyDiffusionFixtureScenario } from "../state/ideologyDiffusionFixture";
import {
  asScenarioId,
  type ContactEdgeId,
  type IdeologyId,
  type RegionId,
} from "../state/ids";
import type { ScenarioDefinition } from "../state/scenario";
import { createInitialWorldState, type WorldState } from "../state/world";

export const T015_INSPECTION_CHECKPOINTS = [0, 10, 30, 60, 120, 240] as const;
export const T015_INSPECTION_EVENT_DAYS = [1, 10, 30, 60, 120, 240] as const;
export const T015_INSPECTION_SENSITIVITY_RATES = [0.05, 0.1, 0.15] as const;
/** Output-only filter; it does not alter the simulation or event log. */
export const T015_INSPECTION_EVENT_DELTA_THRESHOLD = 0.001;

const REPUBLICANISM = IDEOLOGY_FIXTURE_IDS.republicanism;
const MONARCHY = IDEOLOGY_FIXTURE_IDS.monarchy;

const REGION_ORDER = [
  CONTACT_FIXTURE_REGION_IDS.merchantPort,
  CONTACT_FIXTURE_REGION_IDS.port,
  CONTACT_FIXTURE_REGION_IDS.capital,
  CONTACT_FIXTURE_REGION_IDS.farmland,
  CONTACT_FIXTURE_REGION_IDS.mine,
  CONTACT_FIXTURE_REGION_IDS.monarchyBorder,
  CONTACT_FIXTURE_REGION_IDS.border,
] as const;

const CHANNEL_LABELS = {
  border: "접경",
  trade: "교역",
  migration: "이주",
  information: "정보",
} as const;

export interface InspectionContactRow {
  readonly edgeId: ContactEdgeId;
  readonly fromRegionId: RegionId;
  readonly fromRegionName: string;
  readonly channel: ContactEdgeView["channel"];
  readonly effectiveStrength: number;
}

export interface InspectionContribution {
  readonly sourceRegionId: RegionId;
  readonly sourceRegionName: string;
  readonly destinationRegionId: RegionId;
  readonly ideologyId: IdeologyId;
  readonly ideologyName: string;
  readonly contactEdgeId: ContactEdgeId;
  readonly channel: ContactEdgeView["channel"];
  readonly sourceSupport: number;
  readonly effectiveStrength: number;
  readonly appliedDelta: number;
}

export interface InspectionEvent {
  readonly tick: number;
  readonly destinationRegionId: RegionId;
  readonly destinationRegionName: string;
  readonly ideologyId: IdeologyId;
  readonly ideologyName: string;
  readonly previousSupport: number;
  readonly nextSupport: number;
  readonly appliedDelta: number;
  readonly contributions: readonly InspectionContribution[];
}

export interface InspectionRegionRow {
  readonly regionId: RegionId;
  readonly regionName: string;
  readonly republicanSupport: number;
  readonly monarchySupport: number;
  readonly incomingContacts: readonly InspectionContactRow[];
  readonly topContribution: InspectionContribution | null;
}

export interface InspectionCheckpoint {
  readonly day: number;
  readonly rows: readonly InspectionRegionRow[];
}

export interface InspectionSensitivityRow {
  readonly diffusionRate: number;
  readonly day60: InspectionCheckpoint;
  readonly day240: InspectionCheckpoint;
}

export interface T015DiffusionInspectionReport {
  readonly scenario: ScenarioDefinition;
  readonly diffusionRate: number;
  readonly topology: readonly ContactEdgeView[];
  readonly checkpoints: readonly InspectionCheckpoint[];
  readonly eventHighlights: readonly InspectionEvent[];
  readonly sensitivity: readonly InspectionSensitivityRow[];
}

function cloneIdeologyState(
  state: Readonly<
    Record<
      IdeologyId,
      { support: number; radicalism: number; organization: number }
    >
  >[IdeologyId],
  support: number,
) {
  if (state === undefined) {
    throw new Error(
      "Inspection scenario is missing a required ideology state.",
    );
  }

  return { ...state, support };
}

/**
 * Build inspection-only content from the completed T015 fixture. This does
 * not change the production fixture or any simulation balance constant.
 */
export function createT015DiffusionInspectionScenario(): ScenarioDefinition {
  const baseScenario = createIdeologyDiffusionFixtureScenario();

  return {
    ...baseScenario,
    id: asScenarioId("t015-diffusion-inspection"),
    initialCountries: baseScenario.initialCountries.map((country) =>
      country.id === CONTACT_FIXTURE_COUNTRY_IDS.player
        ? { ...country, name: "플레이어 왕국" }
        : country,
    ),
    initialRegions: baseScenario.initialRegions.map((region) => ({
      ...region,
      ideology: {
        ...region.ideology,
        [REPUBLICANISM]: cloneIdeologyState(
          region.ideology[REPUBLICANISM],
          region.id === CONTACT_FIXTURE_REGION_IDS.merchantPort
            ? 0.9
            : (region.ideology[REPUBLICANISM]?.support ?? 0),
        ),
        [MONARCHY]: cloneIdeologyState(
          region.ideology[MONARCHY],
          region.id === CONTACT_FIXTURE_REGION_IDS.monarchyBorder ? 0.85 : 0.01,
        ),
      },
    })),
  };
}

function asObject(
  value: JsonValue,
): Readonly<Record<string, JsonValue>> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Readonly<Record<string, JsonValue>>;
}

function stringValue(
  object: Readonly<Record<string, JsonValue>>,
  key: string,
): string | null {
  const value = object[key];
  return typeof value === "string" ? value : null;
}

function numberValue(
  object: Readonly<Record<string, JsonValue>>,
  key: string,
): number | null {
  const value = object[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function ideologyName(
  scenario: ScenarioDefinition,
  ideologyId: IdeologyId,
): string {
  return scenario.ideologyCatalog[ideologyId]?.name ?? ideologyId;
}

function parseContribution(
  scenario: ScenarioDefinition,
  world: WorldState,
  value: JsonValue,
): InspectionContribution | null {
  const object = asObject(value);
  if (object === null) {
    return null;
  }

  const sourceRegionId = stringValue(
    object,
    "sourceRegionId",
  ) as RegionId | null;
  const destinationRegionId = stringValue(
    object,
    "destinationRegionId",
  ) as RegionId | null;
  const ideologyId = stringValue(object, "ideologyId") as IdeologyId | null;
  const contactEdgeId = stringValue(
    object,
    "contactEdgeId",
  ) as ContactEdgeId | null;
  const channel = stringValue(object, "channel") as
    InspectionContactRow["channel"] | null;
  const sourceSupport = numberValue(object, "sourceSupport");
  const effectiveStrength = numberValue(object, "effectiveStrength");
  const appliedDelta = numberValue(object, "appliedDelta");

  if (
    sourceRegionId === null ||
    destinationRegionId === null ||
    ideologyId === null ||
    contactEdgeId === null ||
    channel === null ||
    sourceSupport === null ||
    effectiveStrength === null ||
    appliedDelta === null
  ) {
    return null;
  }

  return {
    sourceRegionId,
    sourceRegionName: world.regions[sourceRegionId]?.name ?? sourceRegionId,
    destinationRegionId,
    ideologyId,
    ideologyName: ideologyName(scenario, ideologyId),
    contactEdgeId,
    channel,
    sourceSupport,
    effectiveStrength,
    appliedDelta,
  };
}

function parseSupportEvent(
  scenario: ScenarioDefinition,
  world: WorldState,
  event: GameEvent,
): InspectionEvent | null {
  if (event.type !== "IDEOLOGY_SUPPORT_CHANGED") {
    return null;
  }

  const object = asObject(event.payload);
  if (object === null) {
    return null;
  }

  const destinationRegionId = stringValue(
    object,
    "regionId",
  ) as RegionId | null;
  const ideologyId = stringValue(object, "ideologyId") as IdeologyId | null;
  const previousSupport =
    numberValue(object, "previousSupport") ??
    numberValue(object, "previousValue");
  const nextSupport =
    numberValue(object, "nextSupport") ?? numberValue(object, "nextValue");
  const appliedDelta = numberValue(object, "appliedDelta");
  const rawContributions = object.sourceContributions;

  if (
    destinationRegionId === null ||
    ideologyId === null ||
    previousSupport === null ||
    nextSupport === null ||
    appliedDelta === null ||
    !Array.isArray(rawContributions)
  ) {
    return null;
  }

  return {
    tick: event.tick,
    destinationRegionId,
    destinationRegionName:
      world.regions[destinationRegionId]?.name ?? destinationRegionId,
    ideologyId,
    ideologyName: ideologyName(scenario, ideologyId),
    previousSupport,
    nextSupport,
    appliedDelta,
    contributions: rawContributions
      .map((value) => parseContribution(scenario, world, value))
      .filter((value): value is InspectionContribution => value !== null),
  };
}

function inspectIncomingContacts(
  scenario: ScenarioDefinition,
  world: WorldState,
  regionId: RegionId,
): readonly InspectionContactRow[] {
  return getIncomingContacts(scenario, world, regionId).map((edge) => ({
    edgeId: edge.id,
    fromRegionId: edge.fromRegionId,
    fromRegionName: world.regions[edge.fromRegionId]?.name ?? edge.fromRegionId,
    channel: edge.channel,
    effectiveStrength: edge.effectiveStrength,
  }));
}

function createCheckpoint(
  scenario: ScenarioDefinition,
  world: WorldState,
  day: number,
  dayEvents: readonly InspectionEvent[],
): InspectionCheckpoint {
  const rows = REGION_ORDER.map((regionId) => {
    const region = world.regions[regionId];
    if (region === undefined) {
      throw new Error(`Inspection scenario is missing region ${regionId}.`);
    }

    const topContribution = dayEvents
      .flatMap((event) => event.contributions)
      .filter((contribution) => contribution.destinationRegionId === regionId)
      .sort(
        (first, second) =>
          second.appliedDelta - first.appliedDelta ||
          (first.contactEdgeId < second.contactEdgeId ? -1 : 1),
      )[0];

    return {
      regionId,
      regionName: region.name,
      republicanSupport: region.ideology[REPUBLICANISM]?.support ?? 0,
      monarchySupport: region.ideology[MONARCHY]?.support ?? 0,
      incomingContacts: inspectIncomingContacts(scenario, world, regionId),
      topContribution: topContribution ?? null,
    };
  });

  return { day, rows };
}

function runAtRate(
  scenario: ScenarioDefinition,
  diffusionRate: number,
  maxDay: number,
): {
  readonly checkpoints: readonly InspectionCheckpoint[];
  readonly eventHighlights: readonly InspectionEvent[];
} {
  const checkpointSet = new Set<number>(T015_INSPECTION_CHECKPOINTS);
  const eventDaySet = new Set<number>(T015_INSPECTION_EVENT_DAYS);
  let world = createInitialWorldState(scenario, 20260821);
  const checkpoints: InspectionCheckpoint[] = [];
  const eventHighlights: InspectionEvent[] = [];

  if (checkpointSet.has(0)) {
    checkpoints.push(createCheckpoint(scenario, world, 0, []));
  }

  for (let day = 1; day <= maxDay; day += 1) {
    const result = runSimulationStep(
      world,
      { actions: [] },
      {
        ideologyDiffusion: createIdeologyDiffusionPhaseHook(scenario, {
          diffusionRate,
          cadence: "daily",
        } satisfies IdeologyDiffusionConfig),
      },
    );
    world = result.nextWorld;

    const dayEvents = result.emittedEvents
      .map((event) => parseSupportEvent(scenario, world, event))
      .filter((event): event is InspectionEvent => event !== null);

    if (eventDaySet.has(day)) {
      eventHighlights.push(
        ...dayEvents.filter(
          (event) =>
            Math.abs(event.appliedDelta) >=
            T015_INSPECTION_EVENT_DELTA_THRESHOLD,
        ),
      );
    }

    if (checkpointSet.has(day)) {
      checkpoints.push(createCheckpoint(scenario, world, day, dayEvents));
    }
  }

  return { checkpoints, eventHighlights };
}

function findCheckpoint(
  checkpoints: readonly InspectionCheckpoint[],
  day: number,
): InspectionCheckpoint {
  const checkpoint = checkpoints.find((candidate) => candidate.day === day);
  if (checkpoint === undefined) {
    throw new Error(`Missing inspection checkpoint day ${day}.`);
  }

  return checkpoint;
}

/** Run the same T015 scenario at the requested checkpoint days and rates. */
export function runT015DiffusionInspection(): T015DiffusionInspectionReport {
  const scenario = createT015DiffusionInspectionScenario();
  const baseline = runAtRate(
    scenario,
    DEFAULT_IDEOLOGY_DIFFUSION_RATE,
    T015_INSPECTION_CHECKPOINTS.at(-1) ?? 240,
  );
  const sensitivity = T015_INSPECTION_SENSITIVITY_RATES.map((diffusionRate) => {
    const result = runAtRate(scenario, diffusionRate, 240);
    return {
      diffusionRate,
      day60: findCheckpoint(result.checkpoints, 60),
      day240: findCheckpoint(result.checkpoints, 240),
    };
  });

  const topologyWorld = createInitialWorldState(scenario, 20260821);

  return {
    scenario,
    diffusionRate: DEFAULT_IDEOLOGY_DIFFUSION_RATE,
    topology: scenario.mapContactTopology.contactEdges
      .map((edge) =>
        getIncomingContacts(scenario, topologyWorld, edge.toRegionId).find(
          (candidate) => candidate.id === edge.id,
        ),
      )
      .filter((edge): edge is ContactEdgeView => edge !== undefined)
      .sort((first, second) => (first.id < second.id ? -1 : 1)),
    checkpoints: baseline.checkpoints,
    eventHighlights: baseline.eventHighlights,
    sensitivity,
  };
}

function fixed(value: number): string {
  return value.toFixed(4);
}

function formatIncomingContacts(
  contacts: readonly InspectionContactRow[],
): string {
  if (contacts.length === 0) {
    return "없음";
  }

  return contacts
    .map(
      (contact) =>
        `${contact.fromRegionName} ${CHANNEL_LABELS[contact.channel]} ${fixed(contact.effectiveStrength)}`,
    )
    .join("<br>");
}

function formatTopContribution(
  contribution: InspectionContribution | null,
): string {
  if (contribution === null) {
    return "—";
  }

  return `${contribution.sourceRegionName} → ${CHANNEL_LABELS[contribution.channel]} +${fixed(contribution.appliedDelta)} (${contribution.contactEdgeId})`;
}

/** Format the harness output as a compact Korean diagnostic document. */
export function formatT015DiffusionInspection(
  report: T015DiffusionInspectionReport,
): string {
  const lines: string[] = [
    "# T015 Headless Diffusion Inspection Output",
    "",
    `- 기본 diffusionRate: ${report.diffusionRate.toFixed(2)}`,
    `- 관찰 tick: ${T015_INSPECTION_CHECKPOINTS.join(", ")}`,
    "- top contributing source edge는 해당 checkpoint day에 실제로 적용된 contribution 중 최대값이다.",
    "",
    "## Topology",
    "",
    "| 출발 지역 | 도착 지역 | channel | base strength |",
    "|---|---|---|---:|",
  ];

  for (const edge of report.topology) {
    lines.push(
      `| ${report.scenario.initialRegions.find((region) => region.id === edge.fromRegionId)?.name ?? edge.fromRegionId} | ${report.scenario.initialRegions.find((region) => region.id === edge.toRegionId)?.name ?? edge.toRegionId} | ${CHANNEL_LABELS[edge.channel]} | ${fixed(edge.baseStrength)} |`,
    );
  }

  for (const checkpoint of report.checkpoints) {
    lines.push(
      "",
      `## Day ${checkpoint.day}`,
      "",
      "| 지역 | 공화주의 지지 | 왕정 지지 | 유입 effective contacts | 해당 날 top source edge |",
      "|---|---:|---:|---|---|",
    );
    for (const row of checkpoint.rows) {
      lines.push(
        `| ${row.regionName} | ${fixed(row.republicanSupport)} | ${fixed(row.monarchySupport)} | ${formatIncomingContacts(row.incomingContacts)} | ${formatTopContribution(row.topContribution)} |`,
      );
    }
  }

  lines.push("", "## Meaningful diffusion events", "");
  if (report.eventHighlights.length === 0) {
    lines.push("(none)");
  } else {
    for (const event of report.eventHighlights) {
      const contributions = event.contributions
        .map(
          (contribution) =>
            `${contribution.sourceRegionName}→${CHANNEL_LABELS[contribution.channel]} +${fixed(contribution.appliedDelta)}`,
        )
        .join(", ");
      lines.push(
        `- Day ${event.tick}: ${event.destinationRegionName} ${event.ideologyName} ${fixed(event.previousSupport)}→${fixed(event.nextSupport)} (+${fixed(event.appliedDelta)}); ${contributions || "기여 정보 없음"}`,
      );
    }
  }

  lines.push(
    "",
    "## Rate sensitivity",
    "",
    "| diffusionRate | Day 60 항구 공화주의 | Day 60 수도 공화주의 | Day 60 농지 공화주의 | Day 60 플레이어 국경 왕정 | Day 240 항구 공화주의 | Day 240 수도 공화주의 | Day 240 농지 공화주의 | Day 240 플레이어 국경 왕정 | Day 240 광산 공화주의 |",
    "|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
  );

  for (const row of report.sensitivity) {
    const day60Port = row.day60.rows.find(
      (candidate) => candidate.regionId === CONTACT_FIXTURE_REGION_IDS.port,
    )!;
    const day60Capital = row.day60.rows.find(
      (candidate) => candidate.regionId === CONTACT_FIXTURE_REGION_IDS.capital,
    )!;
    const day60Farmland = row.day60.rows.find(
      (candidate) => candidate.regionId === CONTACT_FIXTURE_REGION_IDS.farmland,
    )!;
    const day60Border = row.day60.rows.find(
      (candidate) => candidate.regionId === CONTACT_FIXTURE_REGION_IDS.border,
    )!;
    const day240Port = row.day240.rows.find(
      (candidate) => candidate.regionId === CONTACT_FIXTURE_REGION_IDS.port,
    )!;
    const day240Capital = row.day240.rows.find(
      (candidate) => candidate.regionId === CONTACT_FIXTURE_REGION_IDS.capital,
    )!;
    const day240Farmland = row.day240.rows.find(
      (candidate) => candidate.regionId === CONTACT_FIXTURE_REGION_IDS.farmland,
    )!;
    const day240Border = row.day240.rows.find(
      (candidate) => candidate.regionId === CONTACT_FIXTURE_REGION_IDS.border,
    )!;
    const day240Mine = row.day240.rows.find(
      (candidate) => candidate.regionId === CONTACT_FIXTURE_REGION_IDS.mine,
    )!;
    lines.push(
      `| ${row.diffusionRate.toFixed(2)} | ${fixed(day60Port.republicanSupport)} | ${fixed(day60Capital.republicanSupport)} | ${fixed(day60Farmland.republicanSupport)} | ${fixed(day60Border.monarchySupport)} | ${fixed(day240Port.republicanSupport)} | ${fixed(day240Capital.republicanSupport)} | ${fixed(day240Farmland.republicanSupport)} | ${fixed(day240Border.monarchySupport)} | ${fixed(day240Mine.republicanSupport)} |`,
    );
  }

  return lines.join("\n");
}
