import {
  decodeEnactPolicyAction,
  ENACT_POLICY_ACTION_SCHEMA_VERSION,
  ENACT_POLICY_ACTION_TYPE,
  type ValidatedActionRecord,
} from "../state/action";
import type { CreateGameEventInput, GameEvent } from "../events/event";
import { createGameEvent } from "../events/event";
import {
  INSTITUTIONAL_RULE_KEYS,
  type PolicyDefinition,
  type PolicyPrerequisite,
  type PolicyState,
} from "../state/policy";
import type { PolicyId, CountryId } from "../state/ids";
import type { ScenarioDefinition } from "../state/scenario";
import type {
  SimulationPhaseContext,
  SimulationPhaseHook,
  SimulationPhaseResult,
} from "../core/step";
import type { WorldState } from "../state/world";

export type PolicyRejectionReason =
  | "invalidPayload"
  | "unsupportedSchemaVersion"
  | "missingPlayerCountry"
  | "missingCountry"
  | "missingPolicyState"
  | "unknownPolicy"
  | "alreadyActive"
  | "prerequisiteNotMet"
  | "incompatiblePolicy";

function assertScenarioMatchesWorld(
  world: WorldState,
  scenario: ScenarioDefinition,
): void {
  if (
    world.run.scenarioId !== scenario.id ||
    world.run.scenarioVersion !== scenario.version
  ) {
    throw new Error(
      "Policy phase scenario does not match the WorldState run identity.",
    );
  }
}

function prerequisitesAreMet(
  policyState: PolicyState,
  prerequisites: readonly PolicyPrerequisite[] | undefined,
): boolean {
  for (const prerequisite of prerequisites ?? []) {
    switch (prerequisite.kind) {
      case "policyActive":
        if (!policyState.activePolicyIds.includes(prerequisite.policyId)) {
          return false;
        }
        break;
      case "policyInactive":
        if (policyState.activePolicyIds.includes(prerequisite.policyId)) {
          return false;
        }
        break;
      case "ruleEquals":
        if (
          policyState.institutionalRules[prerequisite.rule] !==
          prerequisite.value
        ) {
          return false;
        }
        break;
    }
  }

  return true;
}

function findIncompatiblePolicy(
  activePolicyIds: readonly PolicyId[],
  definition: PolicyDefinition,
  catalog: Readonly<Record<PolicyId, PolicyDefinition>>,
): PolicyId | undefined {
  const declaredIncompatibilities = new Set(
    definition.incompatiblePolicyIds ?? [],
  );

  for (const activePolicyId of activePolicyIds) {
    if (declaredIncompatibilities.has(activePolicyId)) {
      return activePolicyId;
    }
  }

  for (const activePolicyId of activePolicyIds) {
    const activeDefinition = catalog[activePolicyId];
    if (activeDefinition?.incompatiblePolicyIds?.includes(definition.id)) {
      return activePolicyId;
    }
  }

  return undefined;
}

function rejectionPayload(
  action: ValidatedActionRecord,
  reason: PolicyRejectionReason,
  policyId?: PolicyId,
  countryId?: CountryId,
): { readonly [key: string]: string } {
  return {
    actionId: action.id,
    ...(policyId === undefined ? {} : { policyId }),
    ...(countryId === undefined ? {} : { countryId }),
    reason,
  };
}

/**
 * Resolve T012 policy actions in the authoritative action phase. Static
 * definitions are captured explicitly from ScenarioDefinition; they never
 * become part of WorldState.
 */
export function runPolicyPhase(
  context: SimulationPhaseContext,
  scenario: ScenarioDefinition,
): SimulationPhaseResult {
  if (context.phase !== "resolveValidatedActions") {
    throw new Error("Policy phase must run during resolveValidatedActions.");
  }

  assertScenarioMatchesWorld(context.world, scenario);

  let currentWorld = context.world;
  let nextEventSequence = context.nextEventSequence;
  const emittedEvents: GameEvent[] = [];

  const emit = (
    eventInput: Omit<CreateGameEventInput, "tick" | "sequence">,
  ): GameEvent => {
    const event = createGameEvent({
      ...eventInput,
      tick: context.nextTick,
      sequence: nextEventSequence,
    });
    emittedEvents.push(event);
    nextEventSequence += 1;
    return event;
  };

  const reject = (
    action: ValidatedActionRecord,
    reason: PolicyRejectionReason,
    policyId?: PolicyId,
    countryId?: CountryId,
  ): void => {
    emit({
      type: "POLICY_REJECTED",
      ...(countryId === undefined ? {} : { actorId: countryId }),
      ...(policyId === undefined ? {} : { targetId: policyId }),
      causeIds: [],
      payload: rejectionPayload(action, reason, policyId, countryId),
      visibility: "important",
    });
  };

  for (const action of context.input.actions) {
    if (action.actionType !== ENACT_POLICY_ACTION_TYPE) {
      continue;
    }

    const payload = decodeEnactPolicyAction(action);
    if (payload === null) {
      reject(
        action,
        action.schemaVersion === ENACT_POLICY_ACTION_SCHEMA_VERSION
          ? "invalidPayload"
          : "unsupportedSchemaVersion",
      );
      continue;
    }

    const countryId = payload.countryId ?? scenario.playerCountryId;
    if (countryId === null || countryId === undefined) {
      reject(action, "missingPlayerCountry", payload.policyId);
      continue;
    }

    if (currentWorld.countries[countryId] === undefined) {
      reject(action, "missingCountry", payload.policyId, countryId);
      continue;
    }

    const policyState = currentWorld.policies[countryId];
    if (policyState === undefined) {
      reject(action, "missingPolicyState", payload.policyId, countryId);
      continue;
    }

    const definition = scenario.policyCatalog[payload.policyId];
    if (definition === undefined) {
      reject(action, "unknownPolicy", payload.policyId, countryId);
      continue;
    }

    if (policyState.activePolicyIds.includes(definition.id)) {
      reject(action, "alreadyActive", definition.id, countryId);
      continue;
    }

    if (!prerequisitesAreMet(policyState, definition.prerequisites)) {
      reject(action, "prerequisiteNotMet", definition.id, countryId);
      continue;
    }

    const incompatiblePolicyId = findIncompatiblePolicy(
      policyState.activePolicyIds,
      definition,
      scenario.policyCatalog,
    );
    if (incompatiblePolicyId !== undefined) {
      reject(action, "incompatiblePolicy", definition.id, countryId);
      continue;
    }

    const policyEvent = emit({
      type: "POLICY_ENACTED",
      actorId: countryId,
      targetId: definition.id,
      causeIds: [],
      payload: {
        actionId: action.id,
        countryId,
        policyId: definition.id,
      },
      visibility: "world",
    });

    let nextInstitutionalRules = policyState.institutionalRules;
    for (const rule of INSTITUTIONAL_RULE_KEYS) {
      const nextValue = definition.ruleMutations[rule];
      const previousValue = nextInstitutionalRules[rule];

      if (nextValue === undefined || nextValue === previousValue) {
        continue;
      }

      nextInstitutionalRules = {
        ...nextInstitutionalRules,
        [rule]: nextValue,
      };

      emit({
        type: "INSTITUTION_RULE_CHANGED",
        actorId: countryId,
        targetId: definition.id,
        causeIds: [policyEvent.id],
        payload: {
          countryId,
          policyId: definition.id,
          rule,
          previousValue,
          value: nextValue,
        },
        visibility: "world",
      });
    }

    currentWorld = {
      ...currentWorld,
      policies: {
        ...currentWorld.policies,
        [countryId]: {
          activePolicyIds: [...policyState.activePolicyIds, definition.id],
          enactedAtTick: {
            ...policyState.enactedAtTick,
            [definition.id]: context.nextTick,
          },
          institutionalRules: nextInstitutionalRules,
        },
      },
    };
  }

  return {
    nextWorld: currentWorld,
    emittedEvents,
    nextEventSequence,
  };
}

/** Bind static scenario content to the existing T010 phase-hook boundary. */
export function createPolicyPhaseHook(
  scenario: ScenarioDefinition,
): SimulationPhaseHook {
  return (context) => runPolicyPhase(context, scenario);
}
