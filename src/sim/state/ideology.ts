import type {
  PressFreedom,
  LaborOrganization,
  InstitutionalRuleState,
} from "./policy";
import type { EventId, CountryId, IdeologyId, RegionId } from "./ids";
import type { Region } from "./region";
import type { ScenarioDefinition } from "./scenario";
import { getFullyControlledRegionIds } from "./territorialControl";
import type { WorldState } from "./world";

export type IdeologyCategory = "regime" | "economic" | "social" | "religious";

/** Static scenario-owned identity and presentation metadata. */
export interface IdeologyDefinition {
  readonly id: IdeologyId;
  readonly name: string;
  readonly category: IdeologyCategory;
  readonly description?: string;
  readonly tags?: readonly string[];
}

/** Compatibility name for callers that use the shorter domain term. */
export type Ideology = IdeologyDefinition;

export interface IdeologyState {
  readonly support: number;
  readonly radicalism: number;
  readonly organization: number;
}

export const IDEOLOGY_DIMENSIONS = [
  "support",
  "radicalism",
  "organization",
] as const;

export type IdeologyDimension = (typeof IDEOLOGY_DIMENSIONS)[number];

/** A read-only context for later causal susceptibility calculations. */
export interface IdeologySusceptibilityInputs {
  readonly scarcity: number;
  readonly stateControl: number;
  readonly urbanization: number;
  /** Null means that no country-level institutional context was supplied. */
  readonly pressFreedom: PressFreedom | null;
  /** Null means that no country-level institutional context was supplied. */
  readonly laborOrganization: LaborOrganization | null;
  readonly factionPresence: boolean;
}

export function deriveIdeologySusceptibilityInputs(
  region: Region,
  institutionalRules?: Pick<
    InstitutionalRuleState,
    "pressFreedom" | "laborOrganization"
  >,
  factionPresence = false,
): IdeologySusceptibilityInputs {
  return {
    scarcity: region.scarcity,
    stateControl: region.stateControl,
    urbanization: region.urbanization,
    pressFreedom: institutionalRules?.pressFreedom ?? null,
    laborOrganization: institutionalRules?.laborOrganization ?? null,
    factionPresence,
  };
}

export type CountryIdeology = Readonly<Record<IdeologyId, IdeologyState>>;

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

/**
 * Derive political tendencies from Regions fully controlled by the Country.
 * The aggregate is intentionally not stored in WorldState.
 */
export function deriveCountryIdeology(
  scenario: ScenarioDefinition,
  world: WorldState,
  countryId: CountryId,
): CountryIdeology {
  const controlledRegionIds = new Set(
    getFullyControlledRegionIds(scenario, world, countryId),
  );
  const controlledRegions = Object.values(world.regions)
    .filter(
      (region) => controlledRegionIds.has(region.id) && region.population > 0,
    )
    .sort((first, second) => compareStableText(first.id, second.id));

  const totalPopulation = controlledRegions.reduce(
    (total, region) => total + region.population,
    0,
  );

  if (totalPopulation <= 0) {
    return {};
  }

  const ideologyIds = Array.from(
    new Set(
      controlledRegions.flatMap((region) => Object.keys(region.ideology)),
    ),
  ).sort(compareStableText) as IdeologyId[];

  const aggregate = {} as Record<IdeologyId, IdeologyState>;

  for (const ideologyId of ideologyIds) {
    const weighted = {
      support: 0,
      radicalism: 0,
      organization: 0,
    };

    for (const region of controlledRegions) {
      const ideologyState = region.ideology[ideologyId];
      if (ideologyState === undefined) {
        continue;
      }

      weighted.support += ideologyState.support * region.population;
      weighted.radicalism += ideologyState.radicalism * region.population;
      weighted.organization += ideologyState.organization * region.population;
    }

    aggregate[ideologyId] = {
      support: weighted.support / totalPopulation,
      radicalism: weighted.radicalism / totalPopulation,
      organization: weighted.organization / totalPopulation,
    };
  }

  return aggregate;
}

/** Return all tendencies ordered by support, with a stable ID tie-breaker. */
export function deriveDominantTendencies(
  aggregate: CountryIdeology,
): readonly IdeologyId[] {
  return Object.entries(aggregate)
    .sort(
      ([firstId, firstState], [secondId, secondState]) =>
        secondState.support - firstState.support ||
        compareStableText(firstId, secondId),
    )
    .map(([ideologyId]) => ideologyId as IdeologyId);
}

export interface IdeologyAdjustment {
  readonly regionId: RegionId;
  readonly ideologyId: IdeologyId;
  readonly dimension: IdeologyDimension;
  readonly delta: number;
  /** Causes must already exist in the event stream when resolved. */
  readonly causeIds: readonly EventId[];
}

export interface IdeologyAdjustmentResult {
  readonly nextRegion: Region;
  readonly changed: boolean;
  readonly previousValue: number;
  readonly nextValue: number;
}

function assertIdeologyAdjustmentShape(adjustment: IdeologyAdjustment): void {
  if (adjustment.causeIds.length === 0) {
    throw new Error("Ideology adjustments require at least one cause event.");
  }

  if (!Number.isFinite(adjustment.delta)) {
    throw new Error("Ideology adjustment delta must be finite.");
  }

  if (!IDEOLOGY_DIMENSIONS.includes(adjustment.dimension)) {
    throw new Error("Ideology adjustment dimension is invalid.");
  }
}

function clampIdeologyValue(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Apply one bounded, immutable adjustment to one Region ideology state. */
export function applyIdeologyAdjustment(
  region: Region,
  adjustment: IdeologyAdjustment,
): IdeologyAdjustmentResult {
  assertIdeologyAdjustmentShape(adjustment);

  if (adjustment.regionId !== region.id) {
    throw new Error("Ideology adjustment region does not match the target.");
  }

  const ideologyState = region.ideology[adjustment.ideologyId];
  if (ideologyState === undefined) {
    throw new Error(
      `Region ${region.id} has no ideology state for ${adjustment.ideologyId}.`,
    );
  }

  const previousValue = ideologyState[adjustment.dimension];
  if (
    !Number.isFinite(previousValue) ||
    previousValue < 0 ||
    previousValue > 1
  ) {
    throw new Error(
      "Existing ideology state must be a finite value from 0 to 1.",
    );
  }

  const nextValue = clampIdeologyValue(previousValue + adjustment.delta);
  if (nextValue === previousValue) {
    return {
      nextRegion: region,
      changed: false,
      previousValue,
      nextValue,
    };
  }

  return {
    nextRegion: {
      ...region,
      ideology: {
        ...region.ideology,
        [adjustment.ideologyId]: {
          ...ideologyState,
          [adjustment.dimension]: nextValue,
        },
      },
    },
    changed: true,
    previousValue,
    nextValue,
  };
}
