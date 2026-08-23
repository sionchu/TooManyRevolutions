import type { GameEvent } from "../events/event";
import { runSimulationStep } from "../core/tick";
import type { SimulationStepResult } from "../core/step";
import {
  createIdeologyDiffusionPhaseHook,
  type IdeologyDiffusionConfig,
} from "../systems/ideologyDiffusion";
import {
  deriveNationalAgendas,
  type PrimaryAgenda,
} from "../readModels/agenda";
import { POLICY_FIXTURE_CATALOG } from "../state/policyFixture";
import type { IdeologyState } from "../state/ideology";
import {
  CONTACT_FIXTURE_COUNTRY_IDS,
  CONTACT_FIXTURE_EDGE_IDS,
  CONTACT_FIXTURE_REGION_IDS,
} from "../state/contactFixture";
import { IDEOLOGY_FIXTURE_IDS } from "../state/ideologyFixture";
import { asFactionId, asScenarioId, type FactionId } from "../state/ids";
import type { ScenarioDefinition } from "../state/scenario";
import { createInitialWorldState, type WorldState } from "../state/world";
import { createT015DiffusionInspectionScenario } from "./t015DiffusionInspection";

export const T016A_INSPECTION_FACTION_ID = asFactionId(
  "t016a.harbor-merchants",
);

export interface T016AAgendaInspectionReport {
  readonly scenario: ScenarioDefinition;
  readonly initialWorld: WorldState;
  readonly stepResult: SimulationStepResult;
  readonly recentEvents: readonly GameEvent[];
  readonly agendas: readonly PrimaryAgenda[];
  readonly resolvedAgendas: readonly PrimaryAgenda[];
}

function cloneIdeologyState(
  state: IdeologyState | undefined,
  organization: number,
) {
  if (state === undefined) {
    throw new Error("T016A inspection scenario is missing ideology state.");
  }

  return { ...state, organization };
}

/**
 * Extend the existing T015 route fixture with only state already supported by
 * T011/T016 and policy capability metadata. This is inspection content, not
 * a new gameplay system or production balance fixture.
 */
export function createT016AAgendaInspectionScenario(): ScenarioDefinition {
  const baseScenario = createT015DiffusionInspectionScenario();
  const playerCountryId = CONTACT_FIXTURE_COUNTRY_IDS.player;
  const portId = CONTACT_FIXTURE_REGION_IDS.port;

  return {
    ...baseScenario,
    id: asScenarioId("t016a-agenda-inspection"),
    policyCatalog: POLICY_FIXTURE_CATALOG,
    initialCountries: baseScenario.initialCountries.map((country) =>
      country.id === playerCountryId
        ? {
            ...country,
            name: "플레이어 왕국",
            treasury: -30,
            dailyExpenditure: 5,
          }
        : country,
    ),
    initialRegions: baseScenario.initialRegions.map((region) =>
      region.id === portId
        ? {
            ...region,
            resourceDemand: { food: 20 },
            ideology: {
              ...region.ideology,
              [IDEOLOGY_FIXTURE_IDS.republicanism]: cloneIdeologyState(
                region.ideology[IDEOLOGY_FIXTURE_IDS.republicanism],
                0.7,
              ),
            },
          }
        : region,
    ),
    initialFactions: [
      {
        id: T016A_INSPECTION_FACTION_ID,
        name: "항구 상인연합",
        countryId: playerCountryId,
        interests: ["trade"],
        resources: 0.65,
        organization: 0.75,
        influence: 0.7,
        grievance: 0.8,
        ideologyAffinity: {
          [IDEOLOGY_FIXTURE_IDS.republicanism]: 0.8,
        },
        foreignLinks: {
          [CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic]: 0.5,
        },
        currentStrategy: "wait",
      },
    ],
  };
}

function deriveResolvedWorld(report: T016AAgendaInspectionReport): WorldState {
  const playerCountryId = CONTACT_FIXTURE_COUNTRY_IDS.player;
  const factionId: FactionId = T016A_INSPECTION_FACTION_ID;

  return {
    ...report.stepResult.nextWorld,
    countries: {
      ...report.stepResult.nextWorld.countries,
      [playerCountryId]: {
        ...report.stepResult.nextWorld.countries[playerCountryId]!,
        treasury: 100,
        dailyIncome: 0,
        dailyExpenditure: 0,
      },
    },
    factions: {
      ...report.stepResult.nextWorld.factions,
      [factionId]: {
        ...report.stepResult.nextWorld.factions[factionId]!,
        resources: 0.1,
        organization: 0.1,
        influence: 0.1,
        grievance: 0.1,
        foreignLinks: {},
        currentStrategy: "wait",
      },
    },
    contactEdgeStates: {
      ...report.stepResult.nextWorld.contactEdgeStates,
      [CONTACT_FIXTURE_EDGE_IDS.merchantToPortInformation]: {
        enabled: false,
        multiplier: 1,
        blockedReason: "inspection-resolved",
      },
      [CONTACT_FIXTURE_EDGE_IDS.merchantToPortTrade]: {
        enabled: false,
        multiplier: 1,
        blockedReason: "inspection-resolved",
      },
      [CONTACT_FIXTURE_EDGE_IDS.monarchyToBorder]: {
        enabled: false,
        multiplier: 1,
        blockedReason: "inspection-resolved",
      },
    },
  };
}

/** Run one real simulation step and inspect its actual state/event evidence. */
export function runT016AAgendaInspection(): T016AAgendaInspectionReport {
  const scenario = createT016AAgendaInspectionScenario();
  const initialWorld = createInitialWorldState(scenario, 20260822);
  const diffusionConfig = {
    cadence: "daily",
  } satisfies IdeologyDiffusionConfig;
  const stepResult = runSimulationStep(
    initialWorld,
    { actions: [] },
    {
      ideologyDiffusion: createIdeologyDiffusionPhaseHook(
        scenario,
        diffusionConfig,
      ),
    },
  );
  const recentEvents = stepResult.emittedEvents;
  const agendas = deriveNationalAgendas({
    scenario,
    world: stepResult.nextWorld,
    recentEvents,
  });
  const resolvedWorld = deriveResolvedWorld({
    scenario,
    initialWorld,
    stepResult,
    recentEvents,
    agendas,
    resolvedAgendas: [],
  });

  return {
    scenario,
    initialWorld,
    stepResult,
    recentEvents,
    agendas,
    resolvedAgendas: deriveNationalAgendas({
      scenario,
      world: resolvedWorld,
      recentEvents,
    }),
  };
}

const AGENDA_KIND_LABELS: Readonly<Record<PrimaryAgenda["kind"], string>> = {
  fiscalPressure: "재정",
  factionPressure: "세력",
  foreignIdeologicalPressure: "외국 이념 압력",
};

const TREND_LABELS: Readonly<Record<PrimaryAgenda["trend"], string>> = {
  rising: "상승",
  falling: "하락",
  stable: "정체",
  unknown: "알 수 없음",
};

function formatCause(cause: PrimaryAgenda["keyCauses"][number]): string {
  if (cause.value === undefined) {
    return cause.label;
  }

  return `${cause.label} (${cause.value.toFixed(3)})`;
}

function formatRegionNames(
  report: T016AAgendaInspectionReport,
  regionIds: readonly string[],
): string {
  return (
    regionIds
      .map(
        (regionId) =>
          report.scenario.initialRegions.find(
            (region) => region.id === regionId,
          )?.name ?? regionId,
      )
      .join(", ") || "없음"
  );
}

function formatFactionNames(
  report: T016AAgendaInspectionReport,
  factionIds: readonly string[],
): string {
  return (
    factionIds
      .map(
        (factionId) =>
          report.scenario.initialFactions.find(
            (faction) => faction.id === factionId,
          )?.name ?? factionId,
      )
      .join(", ") || "없음"
  );
}

/** Compact Korean table output for the headless T016A checkpoint. */
export function formatT016AAgendaInspection(
  report: T016AAgendaInspectionReport,
): string {
  const lines: string[] = [
    "# T016A Headless Agenda Inspection Output",
    "",
    `- simulation step: Day ${report.stepResult.nextWorld.tick}`,
    `- recent event count: ${report.recentEvents.length}`,
    "- selector input: current WorldState + bounded events emitted by the same step",
    "",
    "## Topology",
    "",
    "| 출발 | 도착 | channel | base strength |",
    "|---|---|---|---:|",
  ];

  for (const edge of report.scenario.mapContactTopology.contactEdges
    .slice()
    .sort((first, second) => (first.id < second.id ? -1 : 1))) {
    const from = report.scenario.initialRegions.find(
      (region) => region.id === edge.fromRegionId,
    );
    const to = report.scenario.initialRegions.find(
      (region) => region.id === edge.toRegionId,
    );
    lines.push(
      `| ${from?.name ?? edge.fromRegionId} | ${to?.name ?? edge.toRegionId} | ${edge.channel} | ${edge.baseStrength.toFixed(2)} |`,
    );
  }

  lines.push(
    "",
    "## Current primary agendas",
    "",
    "| rank | kind | title | severity | trend | regions | factions | key causes | intervention | causeEventIds |",
    "|---:|---|---|---:|---|---|---|---|---|---|",
  );

  report.agendas.forEach((agenda, index) => {
    lines.push(
      `| ${index + 1} | ${AGENDA_KIND_LABELS[agenda.kind]} | ${agenda.title} | ${agenda.severity.toFixed(3)} (${agenda.severityBand ?? "—"}) | ${TREND_LABELS[agenda.trend]} | ${formatRegionNames(report, agenda.affectedRegionIds)} | ${formatFactionNames(report, agenda.involvedFactionIds)} | ${agenda.keyCauses.map(formatCause).join("; ")} | ${agenda.interventionCategories.join(", ")} | ${agenda.causeEventIds.join(", ") || "없음"} |`,
    );
  });

  if (report.agendas.length === 0) {
    lines.push("| — | — | 없음 | — | — | — | — | — | — | — |");
  }

  lines.push(
    "",
    "## Counterexample after pressure removal",
    "",
    `- remaining agenda count: ${report.resolvedAgendas.length}`,
    `- remaining agenda IDs: ${report.resolvedAgendas.map((agenda) => agenda.id).join(", ") || "없음"}`,
    "- removed inputs: positive treasury, zero daily deficit, low faction grievance/organization, disabled foreign inbound routes",
    "",
    "## Event evidence",
  );

  for (const event of report.recentEvents) {
    lines.push(`- ${event.id}: ${event.type}`);
  }

  return lines.join("\n");
}
