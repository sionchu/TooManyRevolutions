import { createGameEvent, type GameEvent } from "../events/event";
import type {
  SimulationPhaseContext,
  SimulationPhaseResult,
} from "../core/step";
import type { Country } from "../state/country";
import type { CountryId, RegionId } from "../state/ids";
import { RESOURCE_TYPES, type Region } from "../state/region";
import type { ScenarioDefinition } from "../state/scenario";
import { getFullyControlledRegionIds } from "../state/territorialControl";
import type { WorldState } from "../state/world";
import {
  deriveInterventionTreasuryCharges,
  type InterventionTreasuryCharge,
} from "./intervention";

/** T011 uses an abstract one-to-one production-to-currency conversion. */
export const PRODUCTION_TO_TREASURY_RATE = 1;

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

/** Derived current-flow pressure; this is not stored as another metric. */
export function calculateTreasuryPressure(
  country: Pick<Country, "dailyIncome" | "dailyExpenditure">,
): number {
  return Math.max(0, country.dailyExpenditure - country.dailyIncome);
}

/** Solvency is observable from treasury and is not a terminal rule in T011. */
export function isTreasurySolvent(country: Pick<Country, "treasury">): boolean {
  return country.treasury >= 0;
}

function calculateRegionalProduction(region: Region): number {
  const production = RESOURCE_TYPES.reduce(
    (total, resourceType) =>
      total + (region.resourceProductionCapacity[resourceType] ?? 0),
    0,
  );

  if (!Number.isFinite(production)) {
    throw new Error(`${region.id}.production overflowed the finite range.`);
  }

  return production;
}

function sortedRegions(regions: Readonly<Record<RegionId, Region>>): Region[] {
  return Object.values(regions).sort((first, second) =>
    compareStableText(first.id, second.id),
  );
}

function sortedCountries(
  countries: Readonly<Record<CountryId, Country>>,
): Country[] {
  return Object.values(countries).sort((first, second) =>
    compareStableText(first.id, second.id),
  );
}

function createEconomyEvent(
  context: SimulationPhaseContext,
  sequence: number,
  event: Omit<Parameters<typeof createGameEvent>[0], "tick" | "sequence">,
): GameEvent {
  return createGameEvent({
    ...event,
    tick: context.nextTick,
    sequence,
  });
}

/**
 * Aggregate current regional output into countries and settle one daily
 * treasury flow. T011 deliberately has no policy, price, tax, or randomness
 * modifier; controlled-region membership is the only aggregation boundary.
 */
export function runEconomyPhase(
  context: SimulationPhaseContext,
  scenario?: ScenarioDefinition,
): SimulationPhaseResult {
  const resolvedScenario = scenario ?? context.scenario;
  const nextRegions = {} as Record<RegionId, Region>;
  let regionsChanged = false;

  for (const region of sortedRegions(context.world.regions)) {
    const production = calculateRegionalProduction(region);
    nextRegions[region.id] = {
      ...region,
      production,
    };
    regionsChanged ||= production !== region.production;
  }

  const productionByCountry = new Map<CountryId, number>();

  for (const country of sortedCountries(context.world.countries)) {
    productionByCountry.set(country.id, 0);
  }

  if (resolvedScenario !== undefined) {
    const aggregationWorld: WorldState = regionsChanged
      ? { ...context.world, regions: nextRegions }
      : context.world;

    for (const country of sortedCountries(context.world.countries)) {
      const currentProduction = productionByCountry.get(country.id) ?? 0;
      const fullyControlledProduction = getFullyControlledRegionIds(
        resolvedScenario,
        aggregationWorld,
        country.id,
      ).reduce(
        (total, regionId) => total + (nextRegions[regionId]?.production ?? 0),
        0,
      );
      productionByCountry.set(
        country.id,
        currentProduction + fullyControlledProduction,
      );
    }
  }

  const nextCountries = {} as Record<CountryId, Country>;
  const emittedEvents: GameEvent[] = [];
  const productionEventIds = new Map<CountryId, GameEvent["id"]>();
  const interventionCharges = new Map<CountryId, InterventionTreasuryCharge>(
    (scenario === undefined
      ? []
      : deriveInterventionTreasuryCharges(context, scenario).map((charge) => [
          charge.countryId,
          charge,
        ])) as Iterable<[CountryId, InterventionTreasuryCharge]>,
  );
  let nextEventSequence = context.nextEventSequence;
  let countriesChanged = false;

  for (const country of sortedCountries(context.world.countries)) {
    const production = productionByCountry.get(country.id) ?? 0;
    const dailyIncome = production * PRODUCTION_TO_TREASURY_RATE;
    const interventionCharge = interventionCharges.get(country.id);
    const interventionCost = interventionCharge?.amount ?? 0;
    const treasury =
      country.treasury +
      dailyIncome -
      country.dailyExpenditure -
      interventionCost;

    if (!Number.isFinite(treasury)) {
      throw new Error(`${country.id}.treasury overflowed the finite range.`);
    }

    const nextCountry: Country = {
      ...country,
      treasury,
      dailyIncome,
      production,
    };
    nextCountries[country.id] = nextCountry;

    countriesChanged ||=
      country.treasury !== treasury ||
      country.dailyIncome !== dailyIncome ||
      country.production !== production;

    if (country.production !== production) {
      const event = createEconomyEvent(context, nextEventSequence, {
        type: "NATIONAL_PRODUCTION_CHANGED",
        actorId: country.id,
        causeIds: [],
        payload: {
          countryId: country.id,
          previousProduction: country.production,
          production,
          delta: production - country.production,
        },
        visibility: "world",
      });
      emittedEvents.push(event);
      productionEventIds.set(country.id, event.id);
      nextEventSequence += 1;
    }

    if (country.treasury !== treasury) {
      const productionEventId = productionEventIds.get(country.id);
      const causeIds = [
        ...(interventionCharge?.causeEventIds ?? []),
        ...(productionEventId === undefined ? [] : [productionEventId]),
      ];
      const event = createEconomyEvent(context, nextEventSequence, {
        type: "TREASURY_CHANGED",
        actorId: country.id,
        causeIds,
        payload: {
          countryId: country.id,
          previousTreasury: country.treasury,
          treasury,
          delta: treasury - country.treasury,
          dailyIncome,
          dailyExpenditure: country.dailyExpenditure,
          ...(interventionCost === 0
            ? {}
            : {
                interventionCost,
                interventionCommitmentIds:
                  interventionCharge?.commitmentIds ?? [],
              }),
        },
        visibility: "world",
      });
      emittedEvents.push(event);
      nextEventSequence += 1;
    }
  }

  if (!regionsChanged && !countriesChanged) {
    return {
      nextWorld: context.world,
      emittedEvents,
      nextEventSequence,
    };
  }

  return {
    nextWorld: {
      ...context.world,
      countries: countriesChanged ? nextCountries : context.world.countries,
      regions: regionsChanged ? nextRegions : context.world.regions,
    },
    emittedEvents,
    nextEventSequence,
  };
}

/** Bind scenario-owned intervention costs without moving treasury ownership. */
export function createEconomyPhaseHook(
  scenario: ScenarioDefinition,
): (context: SimulationPhaseContext) => SimulationPhaseResult {
  return (context) => runEconomyPhase(context, scenario);
}
