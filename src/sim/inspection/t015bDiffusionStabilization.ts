import type { JsonValue } from "../core/serialization";
import { runSimulationStep } from "../core/tick";
import type { GameEvent } from "../events/event";
import { CONTACT_FIXTURE_REGION_IDS } from "../state/contactFixture";
import { IDEOLOGY_FIXTURE_IDS } from "../state/ideologyFixture";
import type { IdeologyDiffusionFormula } from "../systems/ideologyDiffusion";
import { createIdeologyDiffusionPhaseHook } from "../systems/ideologyDiffusion";
import { createInitialWorldState, type WorldState } from "../state/world";
import { createT015DiffusionInspectionScenario } from "./t015DiffusionInspection";
import type { ScenarioDefinition } from "../state/scenario";
import type { IdeologyId, RegionId } from "../state/ids";

export const T015B_CHECKPOINTS = [0, 10, 30, 60, 120, 240] as const;
export const T015B_GRADIENT_RATES = [0.05, 0.1, 0.15] as const;
export const T015B_EVENT_DAYS = [1, 10, 30, 60, 120, 240] as const;
export const T015B_EVENT_DELTA_THRESHOLD = 0.001;
export const T015B_ABSOLUTE_COMPARISON_RATE = 0.1;

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

export interface T015BRegionObservation {
  readonly regionId: RegionId;
  readonly regionName: string;
  readonly republicanSupport: number;
  readonly monarchySupport: number;
}

export interface T015BCheckpoint {
  readonly day: number;
  readonly regions: readonly T015BRegionObservation[];
}

export interface T015BEventObservation {
  readonly day: number;
  readonly regionName: string;
  readonly ideologyName: string;
  readonly previousSupport: number;
  readonly nextSupport: number;
  readonly appliedDelta: number;
}

export interface T015BRun {
  readonly formula: IdeologyDiffusionFormula;
  readonly diffusionRate: number;
  readonly checkpoints: readonly T015BCheckpoint[];
  readonly meaningfulEvents: readonly T015BEventObservation[];
}

export interface T015BDiffusionStabilizationReport {
  readonly scenario: ScenarioDefinition;
  readonly absoluteSource: T015BRun;
  readonly gradientRuns: readonly T015BRun[];
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
): T015BEventObservation | null {
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
    appliedDelta < T015B_EVENT_DELTA_THRESHOLD
  ) {
    return null;
  }

  return {
    day: event.tick,
    regionName: world.regions[regionId]?.name ?? regionId,
    ideologyName: ideologyName(scenario, ideologyId),
    previousSupport,
    nextSupport,
    appliedDelta,
  };
}

function createCheckpoint(world: WorldState, day: number): T015BCheckpoint {
  return {
    day,
    regions: REGION_ORDER.map((regionId) => {
      const region = world.regions[regionId];
      if (region === undefined) {
        throw new Error(`T015B scenario is missing region ${regionId}.`);
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

function runAtRate(
  scenario: ScenarioDefinition,
  formula: IdeologyDiffusionFormula,
  diffusionRate: number,
): T015BRun {
  const checkpointSet = new Set<number>(T015B_CHECKPOINTS);
  const eventDaySet = new Set<number>(T015B_EVENT_DAYS);
  let world = createInitialWorldState(scenario, 20260821);
  const checkpoints: T015BCheckpoint[] = [];
  const meaningfulEvents: T015BEventObservation[] = [];

  checkpoints.push(createCheckpoint(world, 0));

  for (let day = 1; day <= 240; day += 1) {
    const result = runSimulationStep(
      world,
      { actions: [] },
      {
        ideologyDiffusion: createIdeologyDiffusionPhaseHook(scenario, {
          formula,
          diffusionRate,
          cadence: "daily",
        }),
      },
    );
    world = result.nextWorld;

    if (eventDaySet.has(day)) {
      meaningfulEvents.push(
        ...result.emittedEvents
          .map((event) => parseMeaningfulEvent(scenario, world, event))
          .filter((event): event is T015BEventObservation => event !== null),
      );
    }

    if (day !== 0 && checkpointSet.has(day)) {
      checkpoints.push(createCheckpoint(world, day));
    }
  }

  return { formula, diffusionRate, checkpoints, meaningfulEvents };
}

/** Compare the current T015 formula with the candidate T015B gradient. */
export function runT015BDiffusionStabilization(): T015BDiffusionStabilizationReport {
  const scenario = createT015DiffusionInspectionScenario();

  return {
    scenario,
    absoluteSource: runAtRate(
      scenario,
      "absoluteSource",
      T015B_ABSOLUTE_COMPARISON_RATE,
    ),
    gradientRuns: T015B_GRADIENT_RATES.map((diffusionRate) =>
      runAtRate(scenario, "supportGradient", diffusionRate),
    ),
  };
}

function formatRunTitle(run: T015BRun): string {
  return run.formula === "absoluteSource"
    ? `A. absolute-source formula (diffusionRate ${run.diffusionRate.toFixed(2)})`
    : `B. gradient formula (diffusionRate ${run.diffusionRate.toFixed(2)})`;
}

function formatRun(run: T015BRun): string[] {
  const lines = [
    `## ${formatRunTitle(run)}`,
    "",
    "값은 `공화주의 / 왕정`이다.",
    "",
    "| 지역 | Day 0 | Day 10 | Day 30 | Day 60 | Day 120 | Day 240 |",
    "|---|---:|---:|---:|---:|---:|---:|",
  ];

  for (const region of REGION_ORDER) {
    const observations = run.checkpoints.map((checkpoint) =>
      checkpoint.regions.find((candidate) => candidate.regionId === region)!,
    );
    lines.push(
      `| ${observations[0].regionName} | ${fixed(observations[0].republicanSupport)} / ${fixed(observations[0].monarchySupport)} | ${fixed(observations[1].republicanSupport)} / ${fixed(observations[1].monarchySupport)} | ${fixed(observations[2].republicanSupport)} / ${fixed(observations[2].monarchySupport)} | ${fixed(observations[3].republicanSupport)} / ${fixed(observations[3].monarchySupport)} | ${fixed(observations[4].republicanSupport)} / ${fixed(observations[4].monarchySupport)} | ${fixed(observations[5].republicanSupport)} / ${fixed(observations[5].monarchySupport)} |`,
    );
  }

  return lines;
}

export function formatT015BDiffusionStabilization(
  report: T015BDiffusionStabilizationReport,
): string {
  const lines: string[] = [
    "# T015B Diffusion Stabilization Output",
    "",
    "동일한 T015 inspection scenario를 새 WorldState로 반복 실행했다.",
    `- A: absolute-source formula, diffusionRate ${report.absoluteSource.diffusionRate.toFixed(2)}`,
    "- B: support-gradient formula, diffusionRate 0.05 / 0.10 / 0.15",
    "- support는 비배타적이며, 이 출력은 production 상수를 변경하지 않고 비교할 때도 같은 topology/seed를 사용한다.",
    "",
  ];

  lines.push(...formatRun(report.absoluteSource));
  for (const run of report.gradientRuns) {
    lines.push("", ...formatRun(run));
  }

  lines.push("", "## Meaningful gradient events", "");
  for (const run of report.gradientRuns) {
    lines.push(`### diffusionRate ${run.diffusionRate.toFixed(2)}`);
    if (run.meaningfulEvents.length === 0) {
      lines.push("- 없음");
      continue;
    }

    for (const event of run.meaningfulEvents) {
      lines.push(
        `- Day ${event.day}: ${event.regionName} ${event.ideologyName} ${fixed(event.previousSupport)} → ${fixed(event.nextSupport)} (+${fixed(event.appliedDelta)})`,
      );
    }
  }

  return lines.join("\n");
}
