import { advanceSimDate } from "../core/clock";
import {
  shouldRunPoliticalUpdate,
  type PoliticalCadence,
} from "../core/politicalCadence";
import type {
  ActionProposal,
  DiplomacyActionPayload,
  DiplomacyActionType,
  ValidatedActionRecord,
} from "../state/action";
import {
  acceptActionProposal,
  decodeDiplomacyAction,
  DIPLOMACY_ACTION_SCHEMA_VERSION,
} from "../state/action";
import { createGameEvent, type GameEvent } from "../events/event";
import type { ContactEdgeRuntimeState } from "../state/contact";
import type { ConflictKind } from "../state/conflict";
import type { Country } from "../state/country";
import type {
  ContactEdgeId,
  ConflictId,
  CountryId,
  FactionId,
  RegionId,
} from "../state/ids";
import {
  deriveCountryContacts,
  type DerivedCountryContact,
} from "./contactGraph";
import {
  deriveForeignIdeologicalThreats,
  foreignIdeologicalThreatToJson,
  FOREIGN_IDEOLOGICAL_THREAT_CONFIG,
  type ForeignIdeologicalThreatSnapshot,
} from "./foreignIdeologicalThreat";
import { getFullyControlledRegionIds } from "../state/territorialControl";
import type { ScenarioDefinition } from "../state/scenario";
import type {
  SimulationPhaseContext,
  SimulationPhaseHook,
  SimulationPhaseResult,
} from "../core/step";
import type { WorldState } from "../state/world";

/** T019 owns this typed reason for a diplomatic contact closure. */
export const FOREIGN_POLICY_BORDER_CLOSURE_REASON =
  "foreignPolicyBorderClosure" as const;

/** T020 owns this direction-explicit incoming restriction reason. */
export const FOREIGN_IDEOLOGICAL_THREAT_BORDER_RESTRICTION_REASON =
  "foreignIdeologicalThreatBorderRestriction" as const;

/** T019 inspection thresholds; these are not final balance constants. */
export const FOREIGN_HEURISTIC_CONFIG = {
  highInstabilityAt: 60,
  lowLegitimacyAt: 40,
  lowStateCapacityAt: 40,
  stateWeaknessAt: 0.55,
  recoveredStateWeaknessAt: 0.35,
} as const;

/** T019 uses the existing monthly political checkpoint on a daily tick. */
export const DEFAULT_FOREIGN_POLITICAL_CADENCE: PoliticalCadence = "monthly";

export interface ForeignContactObservation {
  readonly edgeId: ContactEdgeId;
  readonly fromRegionId: RegionId;
  readonly toRegionId: RegionId;
  readonly fromCountryId: CountryId;
  readonly toCountryId: CountryId;
  readonly channel: DerivedCountryContact["channel"];
  readonly baseStrength: number;
  readonly effectiveStrength: number;
  readonly enabled: boolean;
  readonly blockedReason?: string;
  readonly blockedByCountryId?: CountryId;
}

export interface ForeignConflictObservation {
  readonly conflictId: ConflictId;
  readonly kind: ConflictKind;
  readonly participantCountryIds: readonly CountryId[];
  readonly participantFactionIds: readonly FactionId[];
  readonly affectedRegionIds: readonly RegionId[];
  readonly contestedRegionIds: readonly RegionId[];
}

export interface ForeignStateObservation {
  readonly actorCountryId: CountryId;
  readonly actionCapable: boolean;
  readonly ownState: {
    readonly treasury: number;
    readonly dailyIncome: number;
    readonly dailyExpenditure: number;
    readonly legitimacy: number;
    readonly stateCapacity: number;
    readonly instability: number;
    readonly stateContinuity: number;
    readonly currentGovernmentId: Country["currentGovernmentId"];
    readonly currentGovernment: {
      readonly id: NonNullable<Country["currentGovernmentId"]>;
      readonly authority: "central" | "contender" | "exile";
    } | null;
    readonly fullyControlledRegionIds: readonly RegionId[];
    readonly stateWeakness: number;
    readonly hasActiveConflict: boolean;
  };
  /** All current directed country projections involving this actor. */
  readonly contacts: readonly ForeignContactObservation[];
  /** Derived current foreign ideological exposure; never stored in WorldState. */
  readonly ideologicalThreats: readonly ForeignIdeologicalThreatSnapshot[];
  /** Incoming T020 closures that pass the restore-side hysteresis check. */
  readonly restorableIncomingTargetCountryIds: readonly CountryId[];
  readonly activeConflicts: readonly ForeignConflictObservation[];
  readonly availableActions: Readonly<Record<DiplomacyActionType, boolean>>;
}

export interface ForeignActionProposal {
  readonly actorCountryId: CountryId;
  readonly decisionTick: number;
  readonly actionType: DiplomacyActionType;
  readonly payload: DiplomacyActionPayload;
  readonly schemaVersion: typeof DIPLOMACY_ACTION_SCHEMA_VERSION;
}

export interface DiplomacyConfig {
  readonly cadence?: PoliticalCadence;
}

export type ForeignActionRejectionReason =
  | "invalidPayload"
  | "unsupportedSchemaVersion"
  | "missingActorCountry"
  | "missingTargetCountry"
  | "sameCountry"
  | "actorNotActionCapable"
  | "noBorderRoute"
  | "borderAlreadyClosed"
  | "noOwnedClosure"
  | "noOwnedIncomingRestriction";

interface BorderRouteState {
  readonly contact: ForeignContactObservation;
  readonly runtimeState: ContactEdgeRuntimeState;
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
    scenario.id !== world.run.scenarioId ||
    scenario.version !== world.run.scenarioVersion
  ) {
    throw new Error("Diplomacy scenario does not match WorldState.");
  }
}

function sortedCountries(
  countries: Readonly<Record<CountryId, Country>>,
): readonly Country[] {
  return Object.values(countries).sort((first, second) =>
    compareStableText(first.id, second.id),
  );
}

function deriveStateWeakness(country: Country): number {
  return clamp01(
    ((100 - country.legitimacy) / 100 +
      (100 - country.stateCapacity) / 100 +
      country.instability / 100) /
      3,
  );
}

function isCountryActionCapable(world: WorldState, country: Country): boolean {
  if (world.run.outcome.status !== "active") {
    return false;
  }

  if (country.currentGovernmentId === null) {
    return false;
  }

  return (
    world.governments[country.currentGovernmentId]?.authority === "central"
  );
}

function createContactDefinitionMap(
  scenario: ScenarioDefinition,
): ReadonlyMap<
  ContactEdgeId,
  ScenarioDefinition["mapContactTopology"]["contactEdges"][number]
> {
  return new Map(
    scenario.mapContactTopology.contactEdges.map((edge) => [edge.id, edge]),
  );
}

function deriveContactObservations(
  scenario: ScenarioDefinition,
  world: WorldState,
  actorCountryId: CountryId,
): readonly ForeignContactObservation[] {
  const definitions = createContactDefinitionMap(scenario);

  return deriveCountryContacts(scenario, world)
    .filter(
      (contact) =>
        contact.fromCountryId === actorCountryId ||
        contact.toCountryId === actorCountryId,
    )
    .map((contact) => {
      const definition = definitions.get(contact.edgeId);
      if (definition === undefined) {
        throw new Error(`Contact ${contact.edgeId} is missing from topology.`);
      }

      const runtimeState = world.contactEdgeStates[contact.edgeId];
      const enabled = runtimeState?.enabled ?? true;

      return {
        edgeId: contact.edgeId,
        fromRegionId: contact.fromRegionId,
        toRegionId: contact.toRegionId,
        fromCountryId: contact.fromCountryId,
        toCountryId: contact.toCountryId,
        channel: contact.channel,
        baseStrength: definition.baseStrength,
        effectiveStrength: contact.effectiveStrength,
        enabled,
        ...(runtimeState?.blockedReason === undefined
          ? {}
          : { blockedReason: runtimeState.blockedReason }),
        ...(runtimeState?.blockedByCountryId === undefined
          ? {}
          : { blockedByCountryId: runtimeState.blockedByCountryId }),
      };
    });
}

function deriveActiveConflicts(
  world: WorldState,
  actorCountryId: CountryId,
): readonly ForeignConflictObservation[] {
  return Object.values(world.conflicts)
    .filter(
      (conflict) =>
        conflict.status === "active" &&
        conflict.participantCountryIds.includes(actorCountryId),
    )
    .sort((first, second) => compareStableText(first.id, second.id))
    .map((conflict) => ({
      conflictId: conflict.id,
      kind: conflict.kind,
      participantCountryIds: [...conflict.participantCountryIds],
      participantFactionIds: [...conflict.participantFactionIds],
      affectedRegionIds: [...(conflict.affectedRegionIds ?? [])],
      contestedRegionIds: [...conflict.contestedRegionIds],
    }));
}

function hasOpenOutgoingBorder(
  contacts: readonly ForeignContactObservation[],
  actorCountryId: CountryId,
): boolean {
  return contacts.some(
    (contact) =>
      contact.channel === "border" &&
      contact.fromCountryId === actorCountryId &&
      contact.toCountryId !== actorCountryId &&
      contact.enabled,
  );
}

function hasOwnedClosedOutgoingBorder(
  contacts: readonly ForeignContactObservation[],
  actorCountryId: CountryId,
): boolean {
  return contacts.some(
    (contact) =>
      contact.channel === "border" &&
      contact.fromCountryId === actorCountryId &&
      contact.toCountryId !== actorCountryId &&
      !contact.enabled &&
      contact.blockedByCountryId === actorCountryId &&
      contact.blockedReason === FOREIGN_POLICY_BORDER_CLOSURE_REASON,
  );
}

function hasActionableIdeologicalThreat(
  threats: readonly ForeignIdeologicalThreatSnapshot[],
): boolean {
  return threats.some(
    (threat) =>
      threat.actionable &&
      threat.severity >= FOREIGN_IDEOLOGICAL_THREAT_CONFIG.restrictThreshold,
  );
}

function incomingRestrictionGroups(
  contacts: readonly ForeignContactObservation[],
  actorCountryId: CountryId,
): readonly (readonly [CountryId, readonly ForeignContactObservation[]])[] {
  const groups = new Map<CountryId, ForeignContactObservation[]>();

  for (const contact of contacts) {
    if (
      contact.channel !== "border" ||
      contact.fromCountryId === actorCountryId ||
      contact.toCountryId !== actorCountryId ||
      contact.enabled ||
      contact.blockedByCountryId !== actorCountryId ||
      contact.blockedReason !==
        FOREIGN_IDEOLOGICAL_THREAT_BORDER_RESTRICTION_REASON
    ) {
      continue;
    }

    const group = groups.get(contact.fromCountryId) ?? [];
    group.push(contact);
    groups.set(contact.fromCountryId, group);
  }

  return [...groups.entries()]
    .map(
      ([countryId, group]): readonly [
        CountryId,
        readonly ForeignContactObservation[],
      ] => [
        countryId,
        [...group].sort((first, second) =>
          compareStableText(first.edgeId, second.edgeId),
        ),
      ],
    )
    .sort((first, second) => compareStableText(first[0], second[0]));
}

function deriveRestorableIncomingTargets(
  scenario: ScenarioDefinition,
  world: WorldState,
  actorCountryId: CountryId,
  contacts: readonly ForeignContactObservation[],
): readonly CountryId[] {
  const restorable: CountryId[] = [];

  for (const [sourceCountryId, group] of incomingRestrictionGroups(
    contacts,
    actorCountryId,
  )) {
    const updates = {} as Record<ContactEdgeId, ContactEdgeRuntimeState>;
    for (const contact of group) {
      const runtimeState = runtimeStateForContact(world, contact);
      updates[contact.edgeId] = {
        enabled: true,
        multiplier: runtimeState.multiplier,
      };
    }

    const projectedWorld: WorldState = {
      ...world,
      contactEdgeStates: {
        ...world.contactEdgeStates,
        ...updates,
      },
    };
    const projectedThreat = deriveForeignIdeologicalThreats(
      scenario,
      projectedWorld,
      actorCountryId,
    )
      .filter((threat) => threat.sourceCountryId === sourceCountryId)
      .reduce((strongest, threat) => Math.max(strongest, threat.severity), 0);

    if (projectedThreat < FOREIGN_IDEOLOGICAL_THREAT_CONFIG.restoreThreshold) {
      restorable.push(sourceCountryId);
    }
  }

  return restorable;
}

function deriveAvailableActions(
  actorCountryId: CountryId,
  actionCapable: boolean,
  contacts: readonly ForeignContactObservation[],
  ideologicalThreats: readonly ForeignIdeologicalThreatSnapshot[],
  restorableIncomingTargetCountryIds: readonly CountryId[],
): Readonly<Record<DiplomacyActionType, boolean>> {
  return {
    CLOSE_BORDER:
      actionCapable && hasOpenOutgoingBorder(contacts, actorCountryId),
    REOPEN_BORDER:
      actionCapable && hasOwnedClosedOutgoingBorder(contacts, actorCountryId),
    RESTRICT_INCOMING_BORDER:
      actionCapable && hasActionableIdeologicalThreat(ideologicalThreats),
    RESTORE_INCOMING_BORDER:
      actionCapable && restorableIncomingTargetCountryIds.length > 0,
    WAIT: actionCapable,
  };
}

/** Pure, renderer-independent observation of one current Country actor. */
export function deriveForeignStateObservation(
  scenario: ScenarioDefinition,
  world: WorldState,
  actorCountryId: CountryId,
): ForeignStateObservation {
  assertScenarioMatchesWorld(scenario, world);

  const country = world.countries[actorCountryId];
  if (country === undefined) {
    throw new Error(
      `Foreign observation country ${actorCountryId} is missing.`,
    );
  }

  const contacts = deriveContactObservations(scenario, world, actorCountryId);
  const ideologicalThreats = deriveForeignIdeologicalThreats(
    scenario,
    world,
    actorCountryId,
  );
  const restorableIncomingTargetCountryIds = deriveRestorableIncomingTargets(
    scenario,
    world,
    actorCountryId,
    contacts,
  );
  const activeConflicts = deriveActiveConflicts(world, actorCountryId);
  const actionCapable = isCountryActionCapable(world, country);
  const currentGovernment =
    country.currentGovernmentId === null
      ? null
      : (() => {
          const government = world.governments[country.currentGovernmentId];
          return government === undefined
            ? null
            : { id: government.id, authority: government.authority };
        })();

  return {
    actorCountryId,
    actionCapable,
    ownState: {
      treasury: country.treasury,
      dailyIncome: country.dailyIncome,
      dailyExpenditure: country.dailyExpenditure,
      legitimacy: country.legitimacy,
      stateCapacity: country.stateCapacity,
      instability: country.instability,
      stateContinuity: country.stateContinuity,
      currentGovernmentId: country.currentGovernmentId,
      currentGovernment,
      fullyControlledRegionIds: getFullyControlledRegionIds(
        scenario,
        world,
        actorCountryId,
      ),
      stateWeakness: deriveStateWeakness(country),
      hasActiveConflict: activeConflicts.length > 0,
    },
    contacts,
    ideologicalThreats,
    restorableIncomingTargetCountryIds,
    activeConflicts,
    availableActions: deriveAvailableActions(
      actorCountryId,
      actionCapable,
      contacts,
      ideologicalThreats,
      restorableIncomingTargetCountryIds,
    ),
  };
}

/** Stable CountryId order; no scenario country count is assumed. */
export function deriveForeignStateObservations(
  scenario: ScenarioDefinition,
  world: WorldState,
): readonly ForeignStateObservation[] {
  assertScenarioMatchesWorld(scenario, world);

  return sortedCountries(world.countries)
    .filter((country) => country.id !== scenario.playerCountryId)
    .map((country) =>
      deriveForeignStateObservation(scenario, world, country.id),
    );
}

function isForeignActionRecord(action: ValidatedActionRecord): boolean {
  if (
    action.actionType === "CLOSE_BORDER" ||
    action.actionType === "REOPEN_BORDER" ||
    action.actionType === "RESTRICT_INCOMING_BORDER" ||
    action.actionType === "RESTORE_INCOMING_BORDER"
  ) {
    return true;
  }

  // WAIT is shared with T016's faction vocabulary. Its typed payload keeps
  // the two phase resolvers from treating each other's records as actions.
  return (
    action.actionType === "WAIT" &&
    typeof action.payload === "object" &&
    action.payload !== null &&
    !Array.isArray(action.payload) &&
    "actorCountryId" in action.payload
  );
}

function compareBorderRoutes(
  first: ForeignContactObservation,
  second: ForeignContactObservation,
  actionType: Exclude<DiplomacyActionType, "WAIT">,
): number {
  const firstStrength =
    actionType === "CLOSE_BORDER" || actionType === "RESTRICT_INCOMING_BORDER"
      ? first.effectiveStrength
      : first.baseStrength;
  const secondStrength =
    actionType === "CLOSE_BORDER" || actionType === "RESTRICT_INCOMING_BORDER"
      ? second.effectiveStrength
      : second.baseStrength;

  if (firstStrength !== secondStrength) {
    return secondStrength - firstStrength;
  }

  const incoming =
    actionType === "RESTRICT_INCOMING_BORDER" ||
    actionType === "RESTORE_INCOMING_BORDER";
  const targetOrder = compareStableText(
    incoming ? first.fromCountryId : first.toCountryId,
    incoming ? second.fromCountryId : second.toCountryId,
  );
  return targetOrder !== 0
    ? targetOrder
    : compareStableText(first.edgeId, second.edgeId);
}

function eligibleBorderRoutes(
  observation: ForeignStateObservation,
  actionType: Exclude<DiplomacyActionType, "WAIT">,
): readonly ForeignContactObservation[] {
  const incoming =
    actionType === "RESTRICT_INCOMING_BORDER" ||
    actionType === "RESTORE_INCOMING_BORDER";
  const closureReason = incoming
    ? FOREIGN_IDEOLOGICAL_THREAT_BORDER_RESTRICTION_REASON
    : FOREIGN_POLICY_BORDER_CLOSURE_REASON;

  return observation.contacts
    .filter(
      (contact) =>
        contact.channel === "border" &&
        (incoming
          ? contact.toCountryId === observation.actorCountryId &&
            contact.fromCountryId !== observation.actorCountryId
          : contact.fromCountryId === observation.actorCountryId &&
            contact.toCountryId !== observation.actorCountryId) &&
        (actionType === "CLOSE_BORDER" ||
        actionType === "RESTRICT_INCOMING_BORDER"
          ? contact.enabled
          : !contact.enabled &&
            contact.blockedByCountryId === observation.actorCountryId &&
            contact.blockedReason === closureReason),
    )
    .sort((first, second) => compareBorderRoutes(first, second, actionType));
}

function chooseTargetCountry(
  observation: ForeignStateObservation,
  actionType: DiplomacyActionType,
): CountryId | undefined {
  if (actionType === "WAIT") {
    return undefined;
  }

  if (actionType === "RESTRICT_INCOMING_BORDER") {
    const threatRoute = observation.ideologicalThreats
      .filter(
        (threat) =>
          threat.actionable &&
          threat.severity >=
            FOREIGN_IDEOLOGICAL_THREAT_CONFIG.restrictThreshold,
      )
      .flatMap((threat) =>
        threat.routes
          .filter(
            (route) =>
              route.channel === "border" && route.effectiveStrength > 0,
          )
          .map((route) => ({ threat, route })),
      )
      .sort(
        (first, second) =>
          second.route.severity - first.route.severity ||
          second.route.effectiveStrength - first.route.effectiveStrength ||
          compareStableText(
            first.route.sourceCountryId,
            second.route.sourceCountryId,
          ) ||
          compareStableText(first.route.ideologyId, second.route.ideologyId) ||
          compareStableText(
            first.route.contactEdgeId,
            second.route.contactEdgeId,
          ),
      )[0];

    return threatRoute?.route.sourceCountryId;
  }

  const route = eligibleBorderRoutes(observation, actionType).find(
    (candidate) =>
      actionType === "RESTORE_INCOMING_BORDER"
        ? observation.restorableIncomingTargetCountryIds.includes(
            candidate.fromCountryId,
          )
        : true,
  );
  if (route === undefined) {
    return undefined;
  }

  return actionType === "RESTORE_INCOMING_BORDER"
    ? route.fromCountryId
    : route.toCountryId;
}

/** Select a conservative deterministic macro action from current state only. */
export function chooseForeignActionType(
  observation: ForeignStateObservation,
): DiplomacyActionType {
  if (!observation.actionCapable) {
    return "WAIT";
  }

  const country = observation.ownState;
  const config = FOREIGN_HEURISTIC_CONFIG;
  const severeDomesticWeakness =
    country.hasActiveConflict ||
    country.instability >= config.highInstabilityAt ||
    country.legitimacy <= config.lowLegitimacyAt ||
    country.stateCapacity <= config.lowStateCapacityAt ||
    country.stateWeakness >= config.stateWeaknessAt;

  if (
    observation.availableActions.RESTRICT_INCOMING_BORDER &&
    observation.ideologicalThreats.some(
      (threat) =>
        threat.actionable &&
        threat.severity >= FOREIGN_IDEOLOGICAL_THREAT_CONFIG.restrictThreshold,
    )
  ) {
    return "RESTRICT_INCOMING_BORDER";
  }

  if (severeDomesticWeakness && observation.availableActions.CLOSE_BORDER) {
    return "CLOSE_BORDER";
  }

  if (observation.availableActions.RESTORE_INCOMING_BORDER) {
    return "RESTORE_INCOMING_BORDER";
  }

  if (
    !severeDomesticWeakness &&
    country.stateWeakness <= config.recoveredStateWeaknessAt &&
    observation.availableActions.REOPEN_BORDER
  ) {
    return "REOPEN_BORDER";
  }

  return "WAIT";
}

/** Pure foreign decision; no RNG, event, or WorldState mutation occurs here. */
export function chooseForeignActionProposal(
  scenario: ScenarioDefinition,
  world: WorldState,
  actorCountryId: CountryId,
  decisionTick = world.tick + 1,
): ForeignActionProposal {
  if (!Number.isInteger(decisionTick) || decisionTick <= 0) {
    throw new Error("Foreign decision tick must be a positive integer.");
  }

  const observation = deriveForeignStateObservation(
    scenario,
    world,
    actorCountryId,
  );
  const actionType = chooseForeignActionType(observation);
  const targetCountryId = chooseTargetCountry(observation, actionType);

  if (actionType !== "WAIT" && targetCountryId === undefined) {
    throw new Error(
      `Foreign action ${actionType} has no deterministic target route.`,
    );
  }

  return {
    actorCountryId,
    decisionTick,
    actionType,
    payload: {
      actorCountryId,
      ...(targetCountryId === undefined ? {} : { targetCountryId }),
    },
    schemaVersion: DIPLOMACY_ACTION_SCHEMA_VERSION,
  };
}

function isPoliticalBoundary(
  world: WorldState,
  nextTick: number,
  cadence: PoliticalCadence,
): boolean {
  return shouldRunPoliticalUpdate(
    nextTick,
    advanceSimDate(world.date),
    cadence,
  );
}

/** Stable non-player Country order at one political checkpoint. */
export function deriveForeignActionProposals(
  scenario: ScenarioDefinition,
  world: WorldState,
  nextTick = world.tick + 1,
  cadence: PoliticalCadence = DEFAULT_FOREIGN_POLITICAL_CADENCE,
): readonly ForeignActionProposal[] {
  if (!Number.isInteger(nextTick) || nextTick <= 0) {
    throw new Error(
      "Foreign proposal generation requires a positive next tick.",
    );
  }

  if (
    world.run.outcome.status !== "active" ||
    !isPoliticalBoundary(world, nextTick, cadence)
  ) {
    return [];
  }

  return deriveForeignStateObservations(scenario, world).map((observation) =>
    chooseForeignActionProposal(
      scenario,
      world,
      observation.actorCountryId,
      nextTick,
    ),
  );
}

/** Convert a typed foreign proposal to the common ActionProposal envelope. */
export function toDiplomacyActionProposal(
  proposal: ForeignActionProposal,
  targetTick: number,
): ActionProposal {
  if (
    proposal.actionType !== "WAIT" &&
    proposal.payload.targetCountryId === undefined
  ) {
    throw new Error(
      `Foreign action ${proposal.actionType} requires a target country.`,
    );
  }

  return {
    tick: targetTick,
    source: "heuristic",
    actionType: proposal.actionType,
    payload:
      proposal.actionType === "WAIT"
        ? { actorCountryId: proposal.payload.actorCountryId }
        : {
            actorCountryId: proposal.payload.actorCountryId,
            targetCountryId: proposal.payload.targetCountryId as CountryId,
          },
    schemaVersion: proposal.schemaVersion,
  };
}

/** Typed convenience wrapper around the shared ActionRecord intake. */
export function acceptDiplomacyActionProposal(
  proposal: ForeignActionProposal,
  targetTick: number,
  sequence: number,
): ValidatedActionRecord {
  return acceptActionProposal(
    toDiplomacyActionProposal(proposal, targetTick),
    sequence,
  );
}

function createDiplomacyEvent(
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

function rejectionPayload(
  action: ValidatedActionRecord,
  reason: ForeignActionRejectionReason,
  payload: DiplomacyActionPayload | null,
): { readonly [key: string]: string } {
  return {
    actionId: action.id,
    actionType: action.actionType,
    reason,
    ...(payload?.actorCountryId === undefined
      ? {}
      : { actorCountryId: payload.actorCountryId }),
    ...(payload?.targetCountryId === undefined
      ? {}
      : { targetCountryId: payload.targetCountryId }),
  };
}

function runtimeStateForContact(
  world: WorldState,
  contact: ForeignContactObservation,
): ContactEdgeRuntimeState {
  return (
    world.contactEdgeStates[contact.edgeId] ?? {
      enabled: true,
      multiplier: 1,
    }
  );
}

function routeStates(
  world: WorldState,
  contacts: readonly ForeignContactObservation[],
): readonly BorderRouteState[] {
  return contacts.map((contact) => ({
    contact,
    runtimeState: runtimeStateForContact(world, contact),
  }));
}

function updateContactRuntimeStates(
  world: WorldState,
  updates: Readonly<Record<ContactEdgeId, ContactEdgeRuntimeState>>,
): WorldState {
  return {
    ...world,
    contactEdgeStates: {
      ...world.contactEdgeStates,
      ...updates,
    },
  };
}

function previousStatePayload(route: BorderRouteState): {
  readonly contactEdgeId: ContactEdgeId;
  readonly enabled: boolean;
  readonly multiplier: number;
  readonly blockedReason?: string;
  readonly blockedByCountryId?: CountryId;
} {
  return {
    contactEdgeId: route.contact.edgeId,
    enabled: route.runtimeState.enabled,
    multiplier: route.runtimeState.multiplier,
    ...(route.runtimeState.blockedReason === undefined
      ? {}
      : { blockedReason: route.runtimeState.blockedReason }),
    ...(route.runtimeState.blockedByCountryId === undefined
      ? {}
      : { blockedByCountryId: route.runtimeState.blockedByCountryId }),
  };
}

function applyAcceptedDiplomacyActions(
  context: SimulationPhaseContext,
  scenario: ScenarioDefinition,
): SimulationPhaseResult {
  let currentWorld = context.world;
  let nextEventSequence = context.nextEventSequence;
  const emittedEvents: GameEvent[] = [];

  const emit = (
    event: Omit<Parameters<typeof createGameEvent>[0], "tick" | "sequence">,
  ): GameEvent => {
    const created = createDiplomacyEvent(context, nextEventSequence, event);
    emittedEvents.push(created);
    nextEventSequence += 1;
    return created;
  };

  const reject = (
    action: ValidatedActionRecord,
    reason: ForeignActionRejectionReason,
    payload: DiplomacyActionPayload | null,
  ): void => {
    emit({
      type: "FOREIGN_ACTION_REJECTED",
      ...(payload?.actorCountryId === undefined
        ? {}
        : { actorId: payload.actorCountryId }),
      ...(payload?.targetCountryId === undefined
        ? {}
        : { targetId: payload.targetCountryId }),
      causeIds: [],
      payload: rejectionPayload(action, reason, payload),
      visibility: "important",
    });
  };

  for (const action of context.input.actions) {
    if (!isForeignActionRecord(action)) {
      continue;
    }

    const payload = decodeDiplomacyAction(action);
    if (payload === null) {
      reject(
        action,
        action.schemaVersion === DIPLOMACY_ACTION_SCHEMA_VERSION
          ? "invalidPayload"
          : "unsupportedSchemaVersion",
        null,
      );
      continue;
    }

    const actionType = action.actionType as DiplomacyActionType;

    const actor = currentWorld.countries[payload.actorCountryId];
    if (actor === undefined) {
      reject(action, "missingActorCountry", payload);
      continue;
    }

    if (!isCountryActionCapable(currentWorld, actor)) {
      reject(action, "actorNotActionCapable", payload);
      continue;
    }

    if (actionType === "WAIT") {
      continue;
    }

    const directionalActionType = actionType as Exclude<
      DiplomacyActionType,
      "WAIT"
    >;

    const targetCountryId = payload.targetCountryId;
    if (targetCountryId === undefined) {
      reject(action, "missingTargetCountry", payload);
      continue;
    }

    if (currentWorld.countries[targetCountryId] === undefined) {
      reject(action, "missingTargetCountry", payload);
      continue;
    }

    if (payload.actorCountryId === targetCountryId) {
      reject(action, "sameCountry", payload);
      continue;
    }

    const observation = deriveForeignStateObservation(
      scenario,
      currentWorld,
      payload.actorCountryId,
    );
    const incoming =
      directionalActionType === "RESTRICT_INCOMING_BORDER" ||
      directionalActionType === "RESTORE_INCOMING_BORDER";
    const allBorderRoutes = observation.contacts.filter(
      (contact) =>
        contact.channel === "border" &&
        (incoming
          ? contact.fromCountryId === targetCountryId &&
            contact.toCountryId === payload.actorCountryId
          : contact.fromCountryId === payload.actorCountryId &&
            contact.toCountryId === targetCountryId),
    );

    if (allBorderRoutes.length === 0) {
      reject(action, "noBorderRoute", payload);
      continue;
    }

    const eligibleRoutes = eligibleBorderRoutes(
      observation,
      directionalActionType,
    ).filter((contact) =>
      incoming
        ? contact.fromCountryId === targetCountryId
        : contact.toCountryId === targetCountryId,
    );

    if (eligibleRoutes.length === 0) {
      reject(
        action,
        directionalActionType === "CLOSE_BORDER" ||
          directionalActionType === "RESTRICT_INCOMING_BORDER"
          ? "borderAlreadyClosed"
          : directionalActionType === "RESTORE_INCOMING_BORDER"
            ? "noOwnedIncomingRestriction"
            : "noOwnedClosure",
        payload,
      );
      continue;
    }

    const routes = routeStates(currentWorld, eligibleRoutes);
    const affectedContactEdgeIds = routes.map((route) => route.contact.edgeId);
    const previousStates = routes.map(previousStatePayload);
    const updates = {} as Record<ContactEdgeId, ContactEdgeRuntimeState>;

    const closesBorder =
      directionalActionType === "CLOSE_BORDER" ||
      directionalActionType === "RESTRICT_INCOMING_BORDER";
    const closureReason =
      directionalActionType === "RESTRICT_INCOMING_BORDER"
        ? FOREIGN_IDEOLOGICAL_THREAT_BORDER_RESTRICTION_REASON
        : FOREIGN_POLICY_BORDER_CLOSURE_REASON;

    for (const route of routes) {
      if (closesBorder) {
        updates[route.contact.edgeId] = {
          enabled: false,
          multiplier: route.runtimeState.multiplier,
          blockedReason: closureReason,
          blockedByCountryId: payload.actorCountryId,
        };
      } else {
        updates[route.contact.edgeId] = {
          enabled: true,
          multiplier: route.runtimeState.multiplier,
        };
      }
    }

    currentWorld = updateContactRuntimeStates(currentWorld, updates);

    const threatEvidence =
      directionalActionType === "RESTRICT_INCOMING_BORDER"
        ? observation.ideologicalThreats.find(
            (threat) =>
              threat.sourceCountryId === targetCountryId &&
              threat.actionable &&
              threat.severity >=
                FOREIGN_IDEOLOGICAL_THREAT_CONFIG.restrictThreshold,
          )
        : undefined;

    emit({
      type: closesBorder ? "BORDER_CLOSED" : "BORDER_REOPENED",
      actorId: payload.actorCountryId,
      targetId: targetCountryId,
      causeIds: [],
      payload: {
        actionId: action.id,
        actorCountryId: payload.actorCountryId,
        targetCountryId,
        direction: incoming ? "incoming" : "outgoing",
        actionType: directionalActionType,
        affectedContactEdgeIds,
        previousStates,
        ...(threatEvidence === undefined
          ? {}
          : {
              ideologicalThreat: foreignIdeologicalThreatToJson(threatEvidence),
            }),
        nextStates: routes.map((route) => ({
          contactEdgeId: route.contact.edgeId,
          enabled: !closesBorder,
          multiplier: route.runtimeState.multiplier,
          ...(closesBorder
            ? {
                blockedReason: closureReason,
                blockedByCountryId: payload.actorCountryId,
              }
            : {}),
        })),
        nextState: closesBorder
          ? {
              enabled: false,
              blockedReason: closureReason,
              blockedByCountryId: payload.actorCountryId,
            }
          : { enabled: true },
      },
      visibility: "world",
    });
  }

  return {
    nextWorld: currentWorld,
    emittedEvents,
    nextEventSequence,
  };
}

/** T019 canonical writer for accepted diplomatic contact mutations. */
export function runDiplomacyPhase(
  context: SimulationPhaseContext,
  config: DiplomacyConfig = {},
): SimulationPhaseResult {
  if (context.phase !== "diplomacy") {
    throw new Error("Diplomacy must run during diplomacy phase.");
  }

  const scenario = context.scenario;
  if (scenario === undefined) {
    return {
      nextWorld: context.world,
      emittedEvents: [],
      nextEventSequence: context.nextEventSequence,
    };
  }

  assertScenarioMatchesWorld(scenario, context.world);
  const applied = applyAcceptedDiplomacyActions(context, scenario);
  const cadence = config.cadence ?? DEFAULT_FOREIGN_POLITICAL_CADENCE;
  const proposals = deriveForeignActionProposals(
    scenario,
    applied.nextWorld,
    context.nextTick,
    cadence,
  );

  return {
    nextWorld: applied.nextWorld,
    emittedEvents: applied.emittedEvents,
    nextEventSequence: applied.nextEventSequence,
    actionProposals: proposals.map((proposal) =>
      toDiplomacyActionProposal(proposal, context.nextTick + 1),
    ),
  };
}

/** Bind T019 to the existing daily phase boundary. */
export function createDiplomacyPhaseHook(
  config: DiplomacyConfig = {},
): SimulationPhaseHook {
  const capturedConfig: DiplomacyConfig = { ...config };
  return (context) => runDiplomacyPhase(context, capturedConfig);
}

/** Exposed for tests and inspection without creating a second mutation path. */
export const T019_DIPLOMACY_ACTION_TYPES = [
  "CLOSE_BORDER",
  "REOPEN_BORDER",
  "WAIT",
] as const;

/** T020's explicitly incoming extension to the T019 action vocabulary. */
export const T020_FOREIGN_IDEOLOGICAL_THREAT_ACTION_TYPES = [
  "RESTRICT_INCOMING_BORDER",
  "RESTORE_INCOMING_BORDER",
] as const;
