import { createGameEvent, type GameEvent } from "../events/event";
import { advanceSimDate } from "../core/clock";
import {
  shouldRunPoliticalUpdate,
  type PoliticalCadence,
} from "../core/politicalCadence";
import type { JsonValue } from "../core/serialization";
import type {
  SimulationPhaseContext,
  SimulationPhaseHook,
  SimulationPhaseResult,
} from "../core/step";
import {
  applyIdeologyAdjustment,
  deriveIdeologySusceptibilityInputs,
  type IdeologyState,
} from "../state/ideology";
import type {
  ContactChannel,
  ContactEdgeDefinition,
  ScenarioDefinition,
} from "../state/scenario";
import type { IdeologyId, RegionId } from "../state/ids";
import type { Region } from "../state/region";
import type { WorldState } from "../state/world";
import { getEffectiveContactStrength } from "./contactGraph";
import {
  getFullyControllingCountryId,
  getRegionFactionIds,
} from "../state/territorialControl";

export const DEFAULT_IDEOLOGY_DIFFUSION_RATE = 0.05;

/** T015C selects monthly political updates on top of the daily simulation tick. */
export const DEFAULT_IDEOLOGY_POLITICAL_CADENCE: PoliticalCadence = "monthly";

export type IdeologyDiffusionFormula = "absoluteSource" | "supportGradient";

/** The stabilized T015B formula is the production default. */
export const DEFAULT_IDEOLOGY_DIFFUSION_FORMULA: IdeologyDiffusionFormula =
  "supportGradient";

/**
 * Initial transport weights. They describe provisional channel capacity, not
 * ideological affinity or a permanent balance rule.
 */
export const DEFAULT_IDEOLOGY_DIFFUSION_CHANNEL_WEIGHTS: Readonly<
  Record<ContactChannel, number>
> = {
  border: 0.8,
  trade: 1,
  migration: 1.1,
  information: 1.2,
};

export interface IdeologyDiffusionConfig {
  readonly diffusionRate?: number;
  readonly channelWeights?: Partial<Record<ContactChannel, number>>;
  /** `absoluteSource` remains available only for A/B diagnostics. */
  readonly formula?: IdeologyDiffusionFormula;
  /** Political cadence is simulation-time based, never renderer or wall-clock based. */
  readonly cadence?: PoliticalCadence;
}

export type { PoliticalCadence } from "../core/politicalCadence";

export interface IdeologyDiffusionContribution {
  readonly sourceRegionId: RegionId;
  readonly destinationRegionId: RegionId;
  readonly ideologyId: IdeologyId;
  readonly contactEdgeId: ContactEdgeDefinition["id"];
  readonly channel: ContactChannel;
  readonly sourceSupport: number;
  readonly ideologyGradient: number;
  readonly previousSupport: number;
  readonly nextSupport: number;
  readonly effectiveStrength: number;
  readonly channelWeight: number;
  readonly destinationSusceptibility: number;
  readonly pressure: number;
  readonly proposedDelta: number;
  readonly appliedDelta: number;
}

interface DiffusionContributionDraft {
  readonly sourceRegionId: RegionId;
  readonly destinationRegionId: RegionId;
  readonly ideologyId: IdeologyId;
  readonly contactEdgeId: ContactEdgeDefinition["id"];
  readonly channel: ContactChannel;
  readonly sourceSupport: number;
  readonly ideologyGradient: number;
  readonly previousSupport: number;
  readonly effectiveStrength: number;
  readonly channelWeight: number;
  readonly destinationSusceptibility: number;
  readonly pressure: number;
  readonly proposedDelta: number;
}

interface DiffusionGroup {
  readonly destinationRegionId: RegionId;
  readonly ideologyId: IdeologyId;
  readonly previousSupport: number;
  readonly contributions: readonly DiffusionContributionDraft[];
}

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function assertScenarioMatchesWorld(
  scenario: ScenarioDefinition,
  world: WorldState,
): void {
  if (
    world.run.scenarioId !== scenario.id ||
    world.run.scenarioVersion !== scenario.version
  ) {
    throw new Error("Ideology diffusion scenario does not match WorldState.");
  }
}

function resolveConfig(
  config: IdeologyDiffusionConfig,
): Required<IdeologyDiffusionConfig> & {
  readonly channelWeights: Readonly<Record<ContactChannel, number>>;
} {
  const diffusionRate = config.diffusionRate ?? DEFAULT_IDEOLOGY_DIFFUSION_RATE;
  if (
    !Number.isFinite(diffusionRate) ||
    diffusionRate < 0 ||
    diffusionRate > 1
  ) {
    throw new Error("Ideology diffusion rate must be between 0 and 1.");
  }

  const channelWeights = {
    ...DEFAULT_IDEOLOGY_DIFFUSION_CHANNEL_WEIGHTS,
    ...config.channelWeights,
  };

  for (const [channel, weight] of Object.entries(channelWeights)) {
    if (!Number.isFinite(weight) || weight < 0) {
      throw new Error(
        `Ideology diffusion channel weight ${channel} must be finite and non-negative.`,
      );
    }
  }

  return {
    diffusionRate,
    channelWeights,
    formula: config.formula ?? DEFAULT_IDEOLOGY_DIFFUSION_FORMULA,
    cadence: config.cadence ?? DEFAULT_IDEOLOGY_POLITICAL_CADENCE,
  };
}

function getDestinationInstitutionalRules(
  scenario: ScenarioDefinition,
  world: WorldState,
  region: Region,
): Parameters<typeof deriveIdeologySusceptibilityInputs>[1] {
  const countryId = getFullyControllingCountryId(scenario, world, region.id);
  if (countryId === null) {
    return undefined;
  }

  return world.policies[countryId]?.institutionalRules;
}

/**
 * Conservative, ideology-independent receptivity baseline. The T013 hook is
 * the source of the contextual inputs; only generic reach/receptivity fields
 * participate until later systems supply explicit modifiers.
 */
export function deriveIdeologyDiffusionSusceptibility(
  scenario: ScenarioDefinition,
  world: WorldState,
  region: Region,
): number {
  const inputs = deriveIdeologySusceptibilityInputs(
    region,
    getDestinationInstitutionalRules(scenario, world, region),
    getRegionFactionIds(scenario, world, region.id).length > 0,
  );

  return clamp01(
    0.5 +
      region.accessibility * 0.25 +
      inputs.urbanization * 0.15 -
      inputs.stateControl * 0.1,
  );
}

function sortedEdges(
  scenario: ScenarioDefinition,
): readonly ContactEdgeDefinition[] {
  return [...scenario.mapContactTopology.contactEdges].sort((first, second) =>
    compareStableText(first.id, second.id),
  );
}

function sortedIdeologyIds(region: Region): readonly IdeologyId[] {
  return (Object.keys(region.ideology) as IdeologyId[]).sort(compareStableText);
}

function groupKey(
  destinationRegionId: RegionId,
  ideologyId: IdeologyId,
): string {
  return `${destinationRegionId}\u0000${ideologyId}`;
}

function compareDrafts(
  first: DiffusionContributionDraft,
  second: DiffusionContributionDraft,
): number {
  return (
    compareStableText(first.sourceRegionId, second.sourceRegionId) ||
    compareStableText(first.contactEdgeId, second.contactEdgeId) ||
    compareStableText(first.channel, second.channel)
  );
}

function toJsonContribution(
  contribution: IdeologyDiffusionContribution,
): JsonValue {
  return {
    sourceRegionId: contribution.sourceRegionId,
    destinationRegionId: contribution.destinationRegionId,
    ideologyId: contribution.ideologyId,
    contactEdgeId: contribution.contactEdgeId,
    channel: contribution.channel,
    sourceSupport: contribution.sourceSupport,
    ideologyGradient: contribution.ideologyGradient,
    previousSupport: contribution.previousSupport,
    nextSupport: contribution.nextSupport,
    effectiveStrength: contribution.effectiveStrength,
    channelWeight: contribution.channelWeight,
    destinationSusceptibility: contribution.destinationSusceptibility,
    pressure: contribution.pressure,
    proposedDelta: contribution.proposedDelta,
    appliedDelta: contribution.appliedDelta,
  };
}

function createDiffusionEvent(
  context: SimulationPhaseContext,
  sequence: number,
  contribution: IdeologyDiffusionContribution,
): GameEvent {
  return createGameEvent({
    tick: context.nextTick,
    sequence,
    type: "IDEOLOGY_DIFFUSED",
    actorId: contribution.ideologyId,
    targetId: contribution.destinationRegionId,
    causeIds: [],
    payload: toJsonContribution(contribution),
    visibility: "world",
  });
}

/** Resolve all region-to-region support changes from the start-of-phase snapshot. */
export function runIdeologyDiffusionPhase(
  context: SimulationPhaseContext,
  scenario: ScenarioDefinition,
  config: IdeologyDiffusionConfig = {},
): SimulationPhaseResult {
  if (context.phase !== "ideologyDiffusion") {
    throw new Error("Ideology diffusion must run during ideologyDiffusion.");
  }

  assertScenarioMatchesWorld(scenario, context.world);
  const resolvedConfig = resolveConfig(config);

  const nextDate = advanceSimDate(context.world.date);
  if (
    !shouldRunPoliticalUpdate(
      context.nextTick,
      nextDate,
      resolvedConfig.cadence,
    )
  ) {
    return {
      nextWorld: context.world,
      emittedEvents: [],
      nextEventSequence: context.nextEventSequence,
    };
  }

  const susceptibilityByRegion = new Map<RegionId, number>();
  const groups = new Map<string, DiffusionGroup>();

  for (const edge of sortedEdges(scenario)) {
    if (edge.fromRegionId === edge.toRegionId) {
      continue;
    }

    const sourceRegion = context.world.regions[edge.fromRegionId];
    const destinationRegion = context.world.regions[edge.toRegionId];

    if (sourceRegion === undefined || destinationRegion === undefined) {
      throw new Error(`Contact edge ${edge.id} references a missing Region.`);
    }

    const effectiveStrength = getEffectiveContactStrength(
      scenario,
      context.world,
      edge.id,
    );
    const channelWeight = resolvedConfig.channelWeights[edge.channel];

    if (effectiveStrength <= 0 || channelWeight <= 0) {
      continue;
    }

    let destinationSusceptibility = susceptibilityByRegion.get(
      destinationRegion.id,
    );
    if (destinationSusceptibility === undefined) {
      destinationSusceptibility = deriveIdeologyDiffusionSusceptibility(
        scenario,
        context.world,
        destinationRegion,
      );
      susceptibilityByRegion.set(
        destinationRegion.id,
        destinationSusceptibility,
      );
    }

    if (destinationSusceptibility <= 0) {
      continue;
    }

    for (const ideologyId of sortedIdeologyIds(sourceRegion)) {
      const sourceState: IdeologyState | undefined =
        sourceRegion.ideology[ideologyId];
      const destinationState = destinationRegion.ideology[ideologyId];

      if (sourceState === undefined || destinationState === undefined) {
        throw new Error(
          `Ideology state ${ideologyId} is missing on contact edge ${edge.id}.`,
        );
      }

      const remainingSupport = 1 - destinationState.support;
      const ideologyGradient =
        resolvedConfig.formula === "supportGradient"
          ? Math.max(0, sourceState.support - destinationState.support)
          : sourceState.support;
      const pressure =
        ideologyGradient *
        effectiveStrength *
        channelWeight *
        destinationSusceptibility;
      const proposedDelta =
        resolvedConfig.diffusionRate * pressure * remainingSupport;

      if (
        ideologyGradient <= 0 ||
        remainingSupport <= 0 ||
        pressure <= 0 ||
        proposedDelta <= 0
      ) {
        continue;
      }

      const key = groupKey(destinationRegion.id, ideologyId);
      const existingGroup = groups.get(key);
      const contribution: DiffusionContributionDraft = {
        sourceRegionId: sourceRegion.id,
        destinationRegionId: destinationRegion.id,
        ideologyId,
        contactEdgeId: edge.id,
        channel: edge.channel,
        sourceSupport: sourceState.support,
        ideologyGradient,
        previousSupport: destinationState.support,
        effectiveStrength,
        channelWeight,
        destinationSusceptibility,
        pressure,
        proposedDelta,
      };

      if (existingGroup === undefined) {
        groups.set(key, {
          destinationRegionId: destinationRegion.id,
          ideologyId,
          previousSupport: destinationState.support,
          contributions: [contribution],
        });
      } else {
        groups.set(key, {
          ...existingGroup,
          contributions: [...existingGroup.contributions, contribution],
        });
      }
    }
  }

  const orderedGroups = [...groups.values()].sort(
    (first, second) =>
      compareStableText(
        first.destinationRegionId,
        second.destinationRegionId,
      ) || compareStableText(first.ideologyId, second.ideologyId),
  );

  let currentWorld = context.world;
  let nextEventSequence = context.nextEventSequence;
  const emittedEvents: GameEvent[] = [];

  for (const group of orderedGroups) {
    const orderedDrafts = [...group.contributions].sort(compareDrafts);
    const totalProposedDelta = orderedDrafts.reduce(
      (total, contribution) => total + contribution.proposedDelta,
      0,
    );
    const nextSupport = clamp01(group.previousSupport + totalProposedDelta);
    const appliedDelta = nextSupport - group.previousSupport;

    if (appliedDelta <= 0 || totalProposedDelta <= 0) {
      continue;
    }

    const contributions = orderedDrafts.map<IdeologyDiffusionContribution>(
      (draft) => ({
        ...draft,
        nextSupport,
        appliedDelta: (appliedDelta * draft.proposedDelta) / totalProposedDelta,
      }),
    );
    const diffusionEventIds = contributions.map((contribution) => {
      const event = createDiffusionEvent(
        context,
        nextEventSequence,
        contribution,
      );
      emittedEvents.push(event);
      nextEventSequence += 1;
      return event.id;
    });

    const region = currentWorld.regions[group.destinationRegionId];
    if (region === undefined) {
      throw new Error(
        `Ideology diffusion references missing destination ${group.destinationRegionId}.`,
      );
    }

    const adjustmentResult = applyIdeologyAdjustment(region, {
      regionId: group.destinationRegionId,
      ideologyId: group.ideologyId,
      dimension: "support",
      delta: appliedDelta,
      causeIds: diffusionEventIds,
    });

    if (!adjustmentResult.changed) {
      continue;
    }

    currentWorld = {
      ...currentWorld,
      regions: {
        ...currentWorld.regions,
        [group.destinationRegionId]: adjustmentResult.nextRegion,
      },
    };

    const supportEvent = createGameEvent({
      tick: context.nextTick,
      sequence: nextEventSequence,
      type: "IDEOLOGY_SUPPORT_CHANGED",
      actorId: group.ideologyId,
      targetId: group.destinationRegionId,
      causeIds: diffusionEventIds,
      payload: {
        regionId: group.destinationRegionId,
        ideologyId: group.ideologyId,
        dimension: "support",
        previousValue: group.previousSupport,
        nextValue: nextSupport,
        previousSupport: group.previousSupport,
        nextSupport,
        appliedDelta,
        sourceContributions: contributions.map(toJsonContribution),
      },
      visibility: "world",
    });
    emittedEvents.push(supportEvent);
    nextEventSequence += 1;
  }

  return {
    nextWorld: currentWorld,
    emittedEvents,
    nextEventSequence,
  };
}

/** Bind a scenario and immutable configuration to the T010 phase boundary. */
export function createIdeologyDiffusionPhaseHook(
  scenario: ScenarioDefinition,
  config: IdeologyDiffusionConfig = {},
): SimulationPhaseHook {
  const capturedConfig: IdeologyDiffusionConfig = {
    ...config,
    channelWeights: config.channelWeights
      ? { ...config.channelWeights }
      : undefined,
  };

  return (context) =>
    runIdeologyDiffusionPhase(context, scenario, capturedConfig);
}
