import {
  decodeRespondPoliticalProposalAction,
  decodeStartInterventionAction,
  RESPOND_POLITICAL_PROPOSAL_ACTION_SCHEMA_VERSION,
  RESPOND_POLITICAL_PROPOSAL_ACTION_TYPE,
  START_INTERVENTION_ACTION_SCHEMA_VERSION,
  START_INTERVENTION_ACTION_TYPE,
  type ValidatedActionRecord,
} from "../state/action";
import { createGameEvent, type GameEvent } from "../events/event";
import type {
  SimulationPhaseContext,
  SimulationPhaseHook,
  SimulationPhaseResult,
} from "../core/step";
import type { JsonValue } from "../core/serialization";
import {
  asInterventionId,
  type ActionId,
  type CountryId,
  type EventId,
  type InterventionId,
  type PoliticalProposalId,
} from "../state/ids";
import {
  assertScenarioInterventionCatalog,
  createDeterministicInterventionCommitmentId,
  evaluateInterventionFeasibility,
  interventionFailureToJson,
  type InterventionCommitment,
  type InterventionDefinition,
  type InterventionEffect,
} from "../state/intervention";
import type { PoliticalProposal } from "../state/politicalProposal";
import type { ScenarioDefinition } from "../state/scenario";
import type { WorldState } from "../state/world";

export type InterventionRejectionReason =
  | "invalidPayload"
  | "unsupportedSchemaVersion"
  | "missingPlayerCountry"
  | "notFeasible";

type PoliticalProposalResponseRejectionReason =
  | "invalidPayload"
  | "unsupportedSchemaVersion"
  | "nonPlayerSource"
  | "missingProposal"
  | "proposalNotOpen"
  | "staleTargetGovernment"
  | "notFeasible";

function assertScenarioMatchesWorld(
  world: WorldState,
  scenario: ScenarioDefinition,
): void {
  if (
    world.run.scenarioId !== scenario.id ||
    world.run.scenarioVersion !== scenario.version
  ) {
    throw new Error(
      "Intervention phase scenario does not match the WorldState run identity.",
    );
  }
}

function createInterventionEvent(
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

function isJsonObject(
  value: JsonValue,
): value is { readonly [key: string]: JsonValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function payloadString(payload: JsonValue, key: string): string | null {
  if (!isJsonObject(payload)) {
    return null;
  }

  const value = payload[key];
  return typeof value === "string" ? value : null;
}

function rejectionPayload(
  action: ValidatedActionRecord,
  reason: InterventionRejectionReason,
  reasons: readonly JsonValue[],
  interventionId?: string,
  countryId?: string,
): { readonly [key: string]: JsonValue } {
  return {
    actionId: action.id,
    reason,
    reasons,
    ...(interventionId === undefined ? {} : { interventionId }),
    ...(countryId === undefined ? {} : { countryId }),
  };
}

function proposalResponseRejectionPayload(
  action: ValidatedActionRecord,
  reason: PoliticalProposalResponseRejectionReason,
  reasons: readonly JsonValue[] = [],
  proposalId?: PoliticalProposalId,
): { readonly [key: string]: JsonValue } {
  return {
    actionId: action.id,
    reason,
    reasons,
    ...(proposalId === undefined ? {} : { proposalId }),
  };
}

interface InterventionEffectApplication {
  readonly effect: InterventionEffect;
  readonly previousValue: JsonValue;
  readonly nextValue: JsonValue;
  readonly changed: boolean;
}

function clampNormalized(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function applyInterventionCompletionEffects(
  world: WorldState,
  definition: InterventionDefinition,
  countryId: CountryId,
): {
  readonly world: WorldState;
  readonly applications: readonly InterventionEffectApplication[];
} {
  let currentWorld = world;
  const applications: InterventionEffectApplication[] = [];

  for (const effect of definition.completionEffects ?? []) {
    switch (effect.kind) {
      case "regionResourceProductionCapacityDelta": {
        const region = currentWorld.regions[effect.regionId];
        if (region === undefined) {
          throw new Error(
            `Intervention ${definition.id} completion effect references missing Region ${effect.regionId}.`,
          );
        }

        const previousValue =
          region.resourceProductionCapacity[effect.resourceType] ?? 0;
        const nextValue = Math.max(0, previousValue + effect.delta);
        applications.push({
          effect,
          previousValue,
          nextValue,
          changed: nextValue !== previousValue,
        });

        if (nextValue !== previousValue) {
          currentWorld = {
            ...currentWorld,
            regions: {
              ...currentWorld.regions,
              [region.id]: {
                ...region,
                resourceProductionCapacity: {
                  ...region.resourceProductionCapacity,
                  [effect.resourceType]: nextValue,
                },
              },
            },
          };
        }
        break;
      }
      case "factionGrievanceDelta":
      case "factionOrganizationDelta": {
        const faction = currentWorld.factions[effect.factionId];
        if (faction === undefined) {
          throw new Error(
            `Intervention ${definition.id} completion effect references missing Faction ${effect.factionId}.`,
          );
        }

        const previousValue =
          effect.kind === "factionGrievanceDelta"
            ? faction.grievance
            : faction.organization;
        const nextValue = clampNormalized(previousValue + effect.delta);
        applications.push({
          effect,
          previousValue,
          nextValue,
          changed: nextValue !== previousValue,
        });

        if (nextValue !== previousValue) {
          const nextFaction =
            effect.kind === "factionGrievanceDelta"
              ? { ...faction, grievance: nextValue }
              : { ...faction, organization: nextValue };
          currentWorld = {
            ...currentWorld,
            factions: {
              ...currentWorld.factions,
              [faction.id]: nextFaction,
            },
          };
        }
        break;
      }
      case "institutionalRuleSet": {
        const policyState = currentWorld.policies[countryId];
        if (policyState === undefined) {
          throw new Error(
            `Intervention ${definition.id} completion effect references missing PolicyState ${countryId}.`,
          );
        }

        const previousValue = policyState.institutionalRules[effect.rule];
        const nextValue = effect.value;
        applications.push({
          effect,
          previousValue,
          nextValue,
          changed: nextValue !== previousValue,
        });

        if (nextValue !== previousValue) {
          currentWorld = {
            ...currentWorld,
            policies: {
              ...currentWorld.policies,
              [countryId]: {
                ...policyState,
                institutionalRules: {
                  ...policyState.institutionalRules,
                  [effect.rule]: nextValue,
                },
              },
            },
          };
        }
        break;
      }
    }
  }

  return { world: currentWorld, applications };
}

function interventionEffectToJson(
  application: InterventionEffectApplication,
): JsonValue {
  return {
    ...application.effect,
    previousValue: application.previousValue,
    nextValue: application.nextValue,
    changed: application.changed,
  };
}

/** Resolve direct interventions and proposal responses at the action phase. */
export function runInterventionResolutionPhase(
  context: SimulationPhaseContext,
  scenario: ScenarioDefinition,
): SimulationPhaseResult {
  if (context.phase !== "resolveValidatedActions") {
    throw new Error(
      "Intervention resolution must run during resolveValidatedActions.",
    );
  }

  assertScenarioMatchesWorld(context.world, scenario);
  assertScenarioInterventionCatalog(scenario);

  let currentWorld = context.world;
  let nextEventSequence = context.nextEventSequence;
  const emittedEvents: GameEvent[] = [];
  const projectedTreasury = new Map<CountryId, number>();

  const emit = (
    eventInput: Omit<
      Parameters<typeof createGameEvent>[0],
      "tick" | "sequence"
    >,
  ): GameEvent => {
    const event = createInterventionEvent(
      context,
      nextEventSequence,
      eventInput,
    );
    emittedEvents.push(event);
    nextEventSequence += 1;
    return event;
  };

  const reject = (
    action: ValidatedActionRecord,
    reason: InterventionRejectionReason,
    reasons: readonly JsonValue[] = [],
    interventionId?: string,
    countryId?: string,
  ): void => {
    emit({
      type: "INTERVENTION_REJECTED",
      ...(countryId === undefined ? {} : { actorId: countryId as CountryId }),
      ...(interventionId === undefined
        ? {}
        : { targetId: asInterventionId(interventionId) }),
      causeIds: [],
      payload: rejectionPayload(
        action,
        reason,
        reasons,
        interventionId,
        countryId,
      ),
      visibility: "important",
    });
  };

  const rejectProposalResponse = (
    action: ValidatedActionRecord,
    reason: PoliticalProposalResponseRejectionReason,
    reasons: readonly JsonValue[] = [],
    proposal?: PoliticalProposal,
    proposalId?: PoliticalProposalId,
  ): void => {
    emit({
      type: "POLITICAL_PROPOSAL_RESPONSE_REJECTED",
      ...(proposal === undefined
        ? {}
        : { actorId: proposal.proposerFactionId }),
      ...(proposalId === undefined ? {} : { targetId: proposalId }),
      causeIds: proposal === undefined ? [] : [proposal.openingEventId],
      payload: proposalResponseRejectionPayload(
        action,
        reason,
        reasons,
        proposalId,
      ),
      visibility: "important",
    });
  };

  const setProposal = (
    proposal: PoliticalProposal,
    updates: Partial<PoliticalProposal>,
  ): PoliticalProposal => {
    const nextProposal = { ...proposal, ...updates };
    currentWorld = {
      ...currentWorld,
      politicalProposals: {
        ...(currentWorld.politicalProposals ?? {}),
        [proposal.id]: nextProposal,
      },
    };
    return nextProposal;
  };

  const startIntervention = (
    action: ValidatedActionRecord,
    interventionId: InterventionId,
    countryId: CountryId,
    causeIds: readonly EventId[],
  ): {
    readonly started: boolean;
    readonly feasibility: ReturnType<typeof evaluateInterventionFeasibility>;
  } => {
    const availableTreasury =
      projectedTreasury.get(countryId) ??
      currentWorld.countries[countryId]?.treasury;
    const feasibility = evaluateInterventionFeasibility({
      scenario,
      world: currentWorld,
      interventionId,
      countryId,
      options:
        availableTreasury === undefined
          ? undefined
          : { treasuryAvailable: availableTreasury },
    });

    if (!feasibility.feasible || feasibility.definition === undefined) {
      return { started: false, feasibility };
    }

    const definition = feasibility.definition;
    const commitmentId = createDeterministicInterventionCommitmentId(action.id);
    const commitment: InterventionCommitment = {
      id: commitmentId,
      interventionId: definition.id,
      countryId,
      sourceActionId: action.id,
      startedTick: context.nextTick,
      firstOccupiedTick: context.nextTick,
      completionTick: context.nextTick + definition.durationDays,
      administrativeLoad: definition.administrativeLoad,
    };

    currentWorld = {
      ...currentWorld,
      interventionCommitments: {
        ...currentWorld.interventionCommitments,
        [commitmentId]: commitment,
      },
    };
    projectedTreasury.set(
      countryId,
      (availableTreasury ?? 0) - definition.treasuryCost,
    );

    emit({
      type: "INTERVENTION_STARTED",
      actorId: countryId,
      targetId: definition.id,
      causeIds,
      payload: {
        actionId: action.id,
        commitmentId,
        interventionId: definition.id,
        countryId,
        startedTick: commitment.startedTick,
        firstOccupiedTick: commitment.firstOccupiedTick,
        completionTick: commitment.completionTick,
        administrativeLoad: commitment.administrativeLoad,
        treasuryCost: definition.treasuryCost,
        durationDays: definition.durationDays,
      },
      visibility: "world",
    });

    return { started: true, feasibility };
  };

  for (const action of context.input.actions) {
    if (
      action.actionType !== START_INTERVENTION_ACTION_TYPE &&
      action.actionType !== RESPOND_POLITICAL_PROPOSAL_ACTION_TYPE
    ) {
      continue;
    }

    if (action.actionType === RESPOND_POLITICAL_PROPOSAL_ACTION_TYPE) {
      const response = decodeRespondPoliticalProposalAction(action);
      if (response === null) {
        rejectProposalResponse(
          action,
          action.schemaVersion ===
            RESPOND_POLITICAL_PROPOSAL_ACTION_SCHEMA_VERSION
            ? "invalidPayload"
            : "unsupportedSchemaVersion",
        );
        continue;
      }

      const proposal = currentWorld.politicalProposals?.[response.proposalId];
      if (action.source !== "player") {
        rejectProposalResponse(
          action,
          "nonPlayerSource",
          [],
          proposal,
          response.proposalId,
        );
        continue;
      }
      if (proposal === undefined) {
        rejectProposalResponse(
          action,
          "missingProposal",
          [],
          undefined,
          response.proposalId,
        );
        continue;
      }
      if (proposal.status !== "open") {
        rejectProposalResponse(
          action,
          "proposalNotOpen",
          [],
          proposal,
          proposal.id,
        );
        continue;
      }

      const currentGovernmentId =
        currentWorld.countries[proposal.countryId]?.currentGovernmentId;
      if (currentGovernmentId !== proposal.targetGovernmentId) {
        setProposal(proposal, {
          status: "rejected",
          resolvedAtTick: context.nextTick,
          responseActionId: action.id,
          resolutionReason: "staleTargetGovernment",
        });
        emit({
          type: "POLITICAL_PROPOSAL_REJECTED",
          actorId: proposal.proposerFactionId,
          targetId: proposal.id,
          causeIds: [proposal.openingEventId],
          payload: {
            actionId: action.id,
            proposalId: proposal.id,
            response: response.response,
            reason: "staleTargetGovernment",
            targetGovernmentId: proposal.targetGovernmentId,
            currentGovernmentId: currentGovernmentId ?? null,
          },
          visibility: "important",
        });
        continue;
      }

      if (response.response === "reject") {
        setProposal(proposal, {
          status: "rejected",
          resolvedAtTick: context.nextTick,
          responseActionId: action.id,
          resolutionReason: "explicitReject",
        });
        emit({
          type: "POLITICAL_PROPOSAL_REJECTED",
          actorId: proposal.proposerFactionId,
          targetId: proposal.id,
          causeIds: [proposal.openingEventId],
          payload: {
            actionId: action.id,
            proposalId: proposal.id,
            response: response.response,
            reason: "explicitReject",
          },
          visibility: "world",
        });
        continue;
      }

      const feasibility = evaluateInterventionFeasibility({
        scenario,
        world: currentWorld,
        interventionId: proposal.interventionId,
        countryId: proposal.countryId,
        options: {
          treasuryAvailable:
            projectedTreasury.get(proposal.countryId) ??
            currentWorld.countries[proposal.countryId]?.treasury,
        },
      });
      if (!feasibility.feasible || feasibility.definition === undefined) {
        rejectProposalResponse(
          action,
          "notFeasible",
          feasibility.reasons.map(interventionFailureToJson),
          proposal,
          proposal.id,
        );
        continue;
      }

      const acceptedEvent = emit({
        type: "POLITICAL_PROPOSAL_ACCEPTED",
        actorId: proposal.proposerFactionId,
        targetId: proposal.id,
        causeIds: [proposal.openingEventId],
        payload: {
          actionId: action.id,
          proposalId: proposal.id,
          response: response.response,
          interventionId: proposal.interventionId,
          countryId: proposal.countryId,
          targetGovernmentId: proposal.targetGovernmentId,
        },
        visibility: "world",
      });
      setProposal(proposal, {
        status: "accepted",
        resolvedAtTick: context.nextTick,
        responseActionId: action.id,
        resolutionReason: "accepted",
      });
      const started = startIntervention(
        action,
        proposal.interventionId,
        proposal.countryId,
        [acceptedEvent.id],
      );
      if (!started.started) {
        throw new Error(
          "Political proposal feasibility changed while accepting the proposal.",
        );
      }
      continue;
    }

    const payload = decodeStartInterventionAction(action);
    if (payload === null) {
      reject(
        action,
        action.schemaVersion === START_INTERVENTION_ACTION_SCHEMA_VERSION
          ? "invalidPayload"
          : "unsupportedSchemaVersion",
      );
      continue;
    }

    const countryId = payload.countryId ?? scenario.playerCountryId;
    if (countryId === null || countryId === undefined) {
      reject(action, "missingPlayerCountry", [], payload.interventionId);
      continue;
    }

    const started = startIntervention(
      action,
      payload.interventionId,
      countryId,
      [],
    );
    if (!started.started) {
      reject(
        action,
        "notFeasible",
        started.feasibility.reasons.map(interventionFailureToJson),
        payload.interventionId,
        countryId,
      );
    }
  }

  return {
    nextWorld: currentWorld,
    emittedEvents,
    nextEventSequence,
  };
}

/** Complete commitments before same-day action feasibility is evaluated. */
export function runInterventionCompletionPhase(
  context: SimulationPhaseContext,
  scenario: ScenarioDefinition,
): SimulationPhaseResult {
  if (context.phase !== "applyScheduledEffects") {
    throw new Error(
      "Intervention completion must run during applyScheduledEffects.",
    );
  }

  assertScenarioMatchesWorld(context.world, scenario);
  assertScenarioInterventionCatalog(scenario);

  const completed = Object.values(context.world.interventionCommitments)
    .filter((commitment) => commitment.completionTick <= context.nextTick)
    .sort((first, second) =>
      first.id < second.id ? -1 : first.id > second.id ? 1 : 0,
    );

  if (completed.length === 0) {
    return {
      nextWorld: context.world,
      emittedEvents: [],
      nextEventSequence: context.nextEventSequence,
    };
  }

  const nextCommitments = { ...context.world.interventionCommitments };
  const emittedEvents: GameEvent[] = [];
  let nextEventSequence = context.nextEventSequence;
  let currentWorld = context.world;

  for (const commitment of completed) {
    delete nextCommitments[commitment.id];

    const definition = scenario.interventionCatalog[commitment.interventionId];
    if (definition === undefined) {
      throw new Error(
        `Intervention commitment ${commitment.id} references unknown definition.`,
      );
    }

    const applied = applyInterventionCompletionEffects(
      currentWorld,
      definition,
      commitment.countryId,
    );
    currentWorld = applied.world;

    const completionEvent = createInterventionEvent(
      context,
      nextEventSequence,
      {
        type: "INTERVENTION_COMPLETED",
        actorId: commitment.countryId,
        targetId: commitment.id,
        causeIds: [],
        payload: {
          commitmentId: commitment.id,
          interventionId: commitment.interventionId,
          countryId: commitment.countryId,
          sourceActionId: commitment.sourceActionId,
          startedTick: commitment.startedTick,
          completionTick: commitment.completionTick,
          administrativeLoad: commitment.administrativeLoad,
          effects: applied.applications.map(interventionEffectToJson),
        },
        visibility: "world",
      },
    );
    emittedEvents.push(completionEvent);
    nextEventSequence += 1;

    for (const application of applied.applications) {
      if (
        application.effect.kind !== "institutionalRuleSet" ||
        !application.changed
      ) {
        continue;
      }

      emittedEvents.push(
        createInterventionEvent(context, nextEventSequence, {
          type: "INSTITUTION_RULE_CHANGED",
          actorId: commitment.countryId,
          targetId: definition.id,
          causeIds: [completionEvent.id],
          payload: {
            countryId: commitment.countryId,
            interventionId: definition.id,
            commitmentId: commitment.id,
            rule: application.effect.rule,
            previousValue: application.previousValue,
            value: application.nextValue,
          },
          visibility: "world",
        }),
      );
      nextEventSequence += 1;
    }
  }

  return {
    nextWorld: {
      ...currentWorld,
      interventionCommitments: nextCommitments,
    },
    emittedEvents,
    nextEventSequence,
  };
}

export function createInterventionResolutionPhaseHook(
  scenario: ScenarioDefinition,
): SimulationPhaseHook {
  return (context) => runInterventionResolutionPhase(context, scenario);
}

export function createInterventionCompletionPhaseHook(
  scenario: ScenarioDefinition,
): SimulationPhaseHook {
  return (context) => runInterventionCompletionPhase(context, scenario);
}

export interface InterventionTreasuryCharge {
  readonly countryId: CountryId;
  readonly amount: number;
  readonly commitmentIds: readonly string[];
  readonly causeEventIds: readonly EventId[];
}

/**
 * Derive same-step costs from accepted commitments. This is a read-only
 * bridge so economy remains the sole writer of Country.treasury.
 */
export function deriveInterventionTreasuryCharges(
  context: SimulationPhaseContext,
  scenario: ScenarioDefinition,
): readonly InterventionTreasuryCharge[] {
  assertScenarioMatchesWorld(context.world, scenario);
  assertScenarioInterventionCatalog(scenario);

  const actionIds = new Set<ActionId>(
    context.input.actions.map((action) => action.id),
  );
  const startEventIdsByActionId = new Map<ActionId, EventId>();

  for (const event of context.emittedEvents) {
    if (event.type !== "INTERVENTION_STARTED") {
      continue;
    }

    const actionId = payloadString(
      event.payload,
      "actionId",
    ) as ActionId | null;
    if (actionId !== null && !startEventIdsByActionId.has(actionId)) {
      startEventIdsByActionId.set(actionId, event.id);
    }
  }

  const charges = new Map<
    CountryId,
    { amount: number; commitmentIds: string[]; causeEventIds: EventId[] }
  >();

  const commitments = Object.values(context.world.interventionCommitments).sort(
    (first, second) =>
      first.id < second.id ? -1 : first.id > second.id ? 1 : 0,
  );

  for (const commitment of commitments) {
    if (
      commitment.startedTick !== context.nextTick ||
      !actionIds.has(commitment.sourceActionId)
    ) {
      continue;
    }

    const definition = scenario.interventionCatalog[commitment.interventionId];
    if (definition === undefined) {
      throw new Error(
        `Intervention commitment ${commitment.id} references unknown definition.`,
      );
    }

    const current = charges.get(commitment.countryId) ?? {
      amount: 0,
      commitmentIds: [],
      causeEventIds: [],
    };
    current.amount += definition.treasuryCost;
    current.commitmentIds.push(commitment.id);

    const startEventId = startEventIdsByActionId.get(commitment.sourceActionId);
    if (startEventId !== undefined) {
      current.causeEventIds.push(startEventId);
    }

    charges.set(commitment.countryId, current);
  }

  return [...charges.entries()]
    .sort(([first], [second]) => (first < second ? -1 : first > second ? 1 : 0))
    .map(([countryId, charge]) => ({
      countryId,
      amount: charge.amount,
      commitmentIds: [...charge.commitmentIds],
      causeEventIds: [...charge.causeEventIds],
    }));
}
