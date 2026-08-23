import type { JsonValue } from "../core/serialization";
import { shouldRunPoliticalUpdate } from "../core/politicalCadence";
import { runSimulationStep } from "../core/tick";
import type { GameEvent } from "../events/event";
import { CONTACT_FIXTURE_REGION_IDS } from "../state/contactFixture";
import { IDEOLOGY_FIXTURE_IDS } from "../state/ideologyFixture";
import type { IdeologyId, RegionId } from "../state/ids";
import type { ScenarioDefinition } from "../state/scenario";
import { createInitialWorldState, type WorldState } from "../state/world";
import {
  createIdeologyDiffusionPhaseHook,
  DEFAULT_IDEOLOGY_DIFFUSION_FORMULA,
  DEFAULT_IDEOLOGY_DIFFUSION_RATE,
  type IdeologyDiffusionFormula,
  type PoliticalCadence,
} from "../systems/ideologyDiffusion";
import { createT015DiffusionInspectionScenario } from "./t015DiffusionInspection";

export const T015C_CHECKPOINTS = [
  { label: "Year 0", tick: 0 },
  { label: "6 months", tick: 180 },
  { label: "Year 1", tick: 360 },
  { label: "Year 2", tick: 720 },
  { label: "Year 3", tick: 1080 },
  { label: "Year 5", tick: 1800 },
  { label: "Year 10", tick: 3600 },
] as const;

export const T015C_CADENCES: readonly PoliticalCadence[] = [
  "daily",
  "weekly",
  "monthly",
];

export const T015C_EVENT_TICKS = [
  1, 7, 14, 30, 180, 360, 720, 1080, 1800, 3600,
] as const;
export const T015C_EVENT_DELTA_THRESHOLD = 0.001;

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

export interface T015CRegionObservation {
  readonly regionId: RegionId;
  readonly regionName: string;
  readonly republicanSupport: number;
  readonly monarchySupport: number;
}

export interface T015CCheckpoint {
  readonly label: string;
  readonly tick: number;
  readonly date: WorldState["date"];
  readonly regions: readonly T015CRegionObservation[];
}

export interface T015CEventObservation {
  readonly tick: number;
  readonly regionName: string;
  readonly ideologyName: string;
  readonly previousSupport: number;
  readonly nextSupport: number;
  readonly appliedDelta: number;
}

export interface T015CRun {
  readonly cadence: PoliticalCadence;
  readonly formula: IdeologyDiffusionFormula;
  readonly diffusionRate: number;
  readonly checkpoints: readonly T015CCheckpoint[];
  readonly politicalUpdateCount: number;
  readonly meaningfulEvents: readonly T015CEventObservation[];
}

export interface T015CPoliticalTimeScaleReport {
  readonly scenario: ScenarioDefinition;
  readonly runs: readonly T015CRun[];
}

function fixed(value: number): string {
  return value.toFixed(4);
}

function asObject(
  value: JsonValue,
): Readonly<Record<string, JsonValue>> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Readonly<Record<string, JsonValue>>;
}

function numberValue(
  object: Readonly<Record<string, JsonValue>>,
  key: string,
): number | null {
  const value = object[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringValue(
  object: Readonly<Record<string, JsonValue>>,
  key: string,
): string | null {
  const value = object[key];
  return typeof value === "string" ? value : null;
}

function ideologyName(
  scenario: ScenarioDefinition,
  ideologyId: string,
): string {
  return scenario.ideologyCatalog[ideologyId as IdeologyId]?.name ?? ideologyId;
}

function parseMeaningfulEvent(
  scenario: ScenarioDefinition,
  world: WorldState,
  event: GameEvent,
): T015CEventObservation | null {
  if (event.type !== "IDEOLOGY_SUPPORT_CHANGED") {
    return null;
  }

  const payload = asObject(event.payload);
  if (payload === null) {
    return null;
  }

  const regionId = stringValue(payload, "regionId") as RegionId | null;
  const ideologyId = stringValue(payload, "ideologyId");
  const previousSupport =
    numberValue(payload, "previousSupport") ??
    numberValue(payload, "previousValue");
  const nextSupport =
    numberValue(payload, "nextSupport") ?? numberValue(payload, "nextValue");
  const appliedDelta = numberValue(payload, "appliedDelta");

  if (
    regionId === null ||
    ideologyId === null ||
    previousSupport === null ||
    nextSupport === null ||
    appliedDelta === null ||
    appliedDelta < T015C_EVENT_DELTA_THRESHOLD
  ) {
    return null;
  }

  return {
    tick: event.tick,
    regionName: world.regions[regionId]?.name ?? regionId,
    ideologyName: ideologyName(scenario, ideologyId),
    previousSupport,
    nextSupport,
    appliedDelta,
  };
}

function createCheckpoint(
  world: WorldState,
  label: string,
  tick: number,
): T015CCheckpoint {
  return {
    label,
    tick,
    date: { ...world.date },
    regions: REGION_ORDER.map((regionId) => {
      const region = world.regions[regionId];
      if (region === undefined) {
        throw new Error(`T015C scenario is missing region ${regionId}.`);
      }

      return {
        regionId,
        regionName: region.name,
        republicanSupport: region.ideology[REPUBLICANISM]?.support ?? 0,
        monarchySupport: region.ideology[MONARCHY]?.support ?? 0,
      };
    }),
  };
}

function runAtCadence(
  scenario: ScenarioDefinition,
  cadence: PoliticalCadence,
): T015CRun {
  const checkpointByTick = new Map<number, (typeof T015C_CHECKPOINTS)[number]>(
    T015C_CHECKPOINTS.map((checkpoint) => [checkpoint.tick, checkpoint]),
  );
  const eventTickSet = new Set<number>(T015C_EVENT_TICKS);
  let world = createInitialWorldState(scenario, 20260821);
  const checkpoints: T015CCheckpoint[] = [];
  const meaningfulEvents: T015CEventObservation[] = [];
  let politicalUpdateCount = 0;

  const initialCheckpoint = checkpointByTick.get(0);
  if (initialCheckpoint !== undefined) {
    checkpoints.push(createCheckpoint(world, initialCheckpoint.label, 0));
  }

  for (let tick = 1; tick <= T015C_CHECKPOINTS.at(-1)!.tick; tick += 1) {
    const result = runSimulationStep(
      world,
      { actions: [] },
      {
        ideologyDiffusion: createIdeologyDiffusionPhaseHook(scenario, {
          cadence,
          diffusionRate: DEFAULT_IDEOLOGY_DIFFUSION_RATE,
          formula: DEFAULT_IDEOLOGY_DIFFUSION_FORMULA,
        }),
      },
    );
    world = result.nextWorld;

    const eventObservations = result.emittedEvents
      .map((event) => parseMeaningfulEvent(scenario, world, event))
      .filter((event): event is T015CEventObservation => event !== null);

    if (shouldRunPoliticalUpdate(tick, world.date, cadence)) {
      politicalUpdateCount += 1;
    }

    if (eventTickSet.has(tick)) {
      meaningfulEvents.push(...eventObservations);
    }

    const checkpoint = checkpointByTick.get(tick);
    if (checkpoint !== undefined) {
      checkpoints.push(createCheckpoint(world, checkpoint.label, tick));
    }
  }

  return {
    cadence,
    formula: DEFAULT_IDEOLOGY_DIFFUSION_FORMULA,
    diffusionRate: DEFAULT_IDEOLOGY_DIFFUSION_RATE,
    checkpoints,
    politicalUpdateCount,
    meaningfulEvents,
  };
}

/** Run the T015B scenario for ten simulated years under each political cadence. */
export function runT015CPoliticalTimeScaleCalibration(): T015CPoliticalTimeScaleReport {
  const scenario = createT015DiffusionInspectionScenario();

  return {
    scenario,
    runs: T015C_CADENCES.map((cadence) => runAtCadence(scenario, cadence)),
  };
}

function findRegion(
  checkpoint: T015CCheckpoint,
  regionId: RegionId,
): T015CRegionObservation {
  const region = checkpoint.regions.find(
    (candidate) => candidate.regionId === regionId,
  );
  if (region === undefined) {
    throw new Error(`T015C checkpoint is missing region ${regionId}.`);
  }

  return region;
}

function formatCheckpointValue(
  checkpoint: T015CCheckpoint,
  regionId: RegionId,
): string {
  const region = findRegion(checkpoint, regionId);
  return `${fixed(region.republicanSupport)} / ${fixed(region.monarchySupport)}`;
}

function formatRun(run: T015CRun): string[] {
  const checkpointHeaders = run.checkpoints
    .map((checkpoint) => `${checkpoint.label} (${formatT015CDate(checkpoint)})`)
    .join(" | ");
  const lines = [
    `## ${run.cadence}`,
    "",
    `- political update count: ${run.politicalUpdateCount}`,
    "- 각 값은 `공화주의 / 왕정`이다.",
    "",
    `| 지역 | ${checkpointHeaders} |`,
    "|---|---:|---:|---:|---:|---:|---:|---:|",
  ];

  for (const regionId of REGION_ORDER) {
    const observations = run.checkpoints.map((checkpoint) =>
      formatCheckpointValue(checkpoint, regionId),
    );
    lines.push(
      `| ${findRegion(run.checkpoints[0]!, regionId).regionName} | ${observations.join(" | ")} |`,
    );
  }

  return lines;
}

/** Format all cadence runs as a reproducible Korean diagnostic report. */
export function formatT015CPoliticalTimeScaleCalibration(
  report: T015CPoliticalTimeScaleReport,
): string {
  const lines: string[] = [
    "# T015C Political Time-Scale Calibration Output",
    "",
    "동일한 T015B inspection scenario, seed, support-gradient formula, diffusionRate 0.05를 daily/weekly/monthly cadence로 비교했다.",
    "- authoritative simulation tick: 1일",
    "- calendar: 360일/년, 30일/월, 12개월/년",
    "- cadence는 wall clock나 renderer가 아니라 simulated date/tick 경계로만 판단한다.",
    "- 각 표의 값은 `공화주의 / 왕정`이며, Mine은 의도적으로 접촉 edge가 없는 control이다.",
    "",
  ];

  for (const run of report.runs) {
    lines.push(...formatRun(run), "");
  }

  lines.push("## Meaningful diffusion events", "");
  for (const run of report.runs) {
    lines.push(`### ${run.cadence}`);
    if (run.meaningfulEvents.length === 0) {
      lines.push("- 없음");
      continue;
    }

    for (const event of run.meaningfulEvents) {
      lines.push(
        `- tick ${event.tick}: ${event.regionName} ${event.ideologyName} ${fixed(event.previousSupport)} → ${fixed(event.nextSupport)} (+${fixed(event.appliedDelta)})`,
      );
    }
  }

  lines.push("", "## Recommendation prompts", "");
  lines.push(
    "이 출력은 cadence를 선택하기 위한 관찰 자료이며, faction·propaganda·repression·instability·ideology competition을 추가하지 않는다.",
  );

  return lines.join("\n");
}

export function formatT015CDate(checkpoint: T015CCheckpoint): string {
  return `왕력 ${checkpoint.date.year}년 ${checkpoint.date.month}월 ${checkpoint.date.day}일`;
}
