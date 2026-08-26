import type { GameEvent } from "../sim/events/event";
import type { InterventionDefinition } from "../sim/state/intervention";
import { F04D_VALIDATION_INTERVENTION_IDS } from "../sim/state/gate1fValidationFixture";
import type { CountryId, InterventionId, RegionId } from "../sim/state/ids";
import type { ScenarioDefinition } from "../sim/state/scenario";
import type { WorldState } from "../sim/state/world";

export type StateProjectStatus = "not-started" | "implementing" | "completed";

export interface StateProjectDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly sourceInterventionId: InterventionId;
  readonly landmarkKind: "food" | "civic" | "industrial";
}

export interface StateProjectPresentation extends StateProjectDefinition {
  readonly sourceDefinition: InterventionDefinition;
  readonly anchorRegionId: RegionId;
  readonly status: StateProjectStatus;
  readonly progress: number;
  readonly startedTick: number | null;
  readonly completionTick: number | null;
  readonly sourceEventIds: readonly string[];
}

export const STATE_PROJECT_CATALOG: readonly StateProjectDefinition[] = [
  {
    id: "tmr.project.arken.granary-network",
    name: "왕실 배급망",
    description: "실제 식량 공급 개입이 남기는 공업·배급 거점입니다.",
    sourceInterventionId: F04D_VALIDATION_INTERVENTION_IDS.materialRelief,
    landmarkKind: "food",
  },
  {
    id: "tmr.project.arken.industrial-council",
    name: "산업 협의회",
    description: "실제 정치 타협 개입이 남기는 산업 지역의 제도 흔적입니다.",
    sourceInterventionId:
      F04D_VALIDATION_INTERVENTION_IDS.politicalAccommodation,
    landmarkKind: "industrial",
  },
  {
    id: "tmr.project.arken.constitutional-assembly",
    name: "헌정 회의소",
    description: "실제 야권 합법화 개입이 남기는 수도의 제도 흔적입니다.",
    sourceInterventionId:
      F04D_VALIDATION_INTERVENTION_IDS.oppositionLegalization,
    landmarkKind: "civic",
  },
] as const;

function asObject(value: unknown): Readonly<Record<string, unknown>> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : null;
}

function payloadString(event: GameEvent, key: string): string | null {
  const value = asObject(event.payload)?.[key];
  return typeof value === "string" ? value : null;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function anchorRegionId(
  scenario: ScenarioDefinition,
  definition: InterventionDefinition,
): RegionId {
  const effectRegion = definition.completionEffects?.find(
    (effect) => effect.kind === "regionResourceProductionCapacityDelta",
  );
  if (effectRegion?.kind === "regionResourceProductionCapacityDelta") {
    return effectRegion.regionId;
  }
  const player = scenario.initialCountries.find(
    (country) => country.id === scenario.playerCountryId,
  );
  if (
    player?.capitalRegionId !== null &&
    player?.capitalRegionId !== undefined
  ) {
    return player.capitalRegionId;
  }
  return scenario.initialRegions[0]!.id;
}

function matchingEvents(
  events: readonly GameEvent[],
  interventionId: InterventionId,
  countryId: CountryId,
): readonly GameEvent[] {
  return events.filter(
    (event) =>
      payloadString(event, "interventionId") === interventionId &&
      (payloadString(event, "countryId") === null ||
        payloadString(event, "countryId") === countryId),
  );
}

/** Presentation projection of existing intervention commitment/completion facts. */
export function deriveStateProjectPresentations(
  scenario: ScenarioDefinition,
  world: WorldState,
  events: readonly GameEvent[],
): readonly StateProjectPresentation[] {
  const playerCountryId = scenario.playerCountryId;
  if (playerCountryId === null) return [];

  return STATE_PROJECT_CATALOG.flatMap((project) => {
    const sourceDefinition =
      scenario.interventionCatalog[project.sourceInterventionId];
    if (sourceDefinition === undefined) return [];
    const sourceEvents = [
      ...matchingEvents(events, project.sourceInterventionId, playerCountryId),
    ].sort(
      (first, second) =>
        first.tick - second.tick || first.sequence - second.sequence,
    );
    const active = Object.values(world.interventionCommitments)
      .filter(
        (commitment) =>
          commitment.countryId === playerCountryId &&
          commitment.interventionId === project.sourceInterventionId,
      )
      .sort((first, second) => second.startedTick - first.startedTick)[0];
    const completed = sourceEvents
      .filter((event) => event.type === "INTERVENTION_COMPLETED")
      .at(-1);
    const start = sourceEvents
      .filter((event) => event.type === "INTERVENTION_STARTED")
      .at(-1);
    const startedTick = active?.startedTick ?? start?.tick ?? null;
    const completionTick = completed?.tick ?? null;
    const status: StateProjectStatus =
      completed !== undefined
        ? "completed"
        : active !== undefined
          ? "implementing"
          : "not-started";
    const progress =
      status === "completed"
        ? 1
        : active === undefined || sourceDefinition.durationDays <= 0
          ? 0
          : clamp01(
              (world.tick - active.startedTick + 1) /
                sourceDefinition.durationDays,
            );

    return [
      {
        ...project,
        sourceDefinition,
        anchorRegionId: anchorRegionId(scenario, sourceDefinition),
        status,
        progress,
        startedTick,
        completionTick,
        sourceEventIds: sourceEvents.map((event) => event.id),
      },
    ];
  });
}
