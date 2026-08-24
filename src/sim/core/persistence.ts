import {
  GAME_EVENT_TYPES,
  type GameEvent,
  type GameEventType,
} from "../events/event";
import {
  appendEvents,
  appendEventsIncremental,
  assertEventStoreInvariants,
  createEventStore,
  findEventById,
  getNextEventSequence,
  type EventStore,
} from "../events/eventStore";
import type { ActionRecord, ActionSource } from "../state/action";
import type {
  Conflict,
  ConflictOutcome,
  ConflictWinner,
} from "../state/conflict";
import type {
  ContactEdgeRuntimeState,
  ContactEdgeRuntimeStateMap,
} from "../state/contact";
import type { Country, DiplomaticRelation } from "../state/country";
import type {
  Faction,
  FactionInterest,
  FactionStrategy,
} from "../state/faction";
import type { Government } from "../state/government";
import type { IdeologyState } from "../state/ideology";
import type { InterventionCommitment } from "../state/intervention";
import type { PoliticalProposal } from "../state/politicalProposal";
import {
  POLITICAL_PROPOSAL_RESOLUTION_REASONS,
  POLITICAL_PROPOSAL_STATUSES,
  POLITICAL_PROPOSAL_SUBJECT_KINDS,
} from "../state/politicalProposal";
import {
  asActionId,
  asConflictId,
  asCountryId,
  asEventId,
  asFactionId,
  asGovernmentId,
  asInterventionCommitmentId,
  asInterventionId,
  asPolicyId,
  asPoliticalProposalId,
  asRegionId,
  asScenarioId,
  type CountryId,
  type IdeologyId,
  type LandHexId,
} from "../state/ids";
import {
  POLITICAL_COMPETITIONS,
  type InstitutionalRuleState,
  type PolicyState,
} from "../state/policy";
import type {
  Region,
  ResourceStock,
  TerritorialController,
} from "../state/region";
import type {
  OrderConsolidationProgress,
  RunOutcome,
  RunState,
} from "../state/run";
import { assertScenarioDefinition } from "../state/scenario";
import type { ScenarioDefinition } from "../state/scenario";
import type { LandHexRuntimeState } from "../state/territorialControl";
import type { WorldState } from "../state/world";
import type { SimDate } from "./clock";
import type { SeedState } from "./rng";
import type { RunRecord, SimulationStepResult } from "./step";
import type { JsonValue } from "./serialization";
import {
  assertScenarioRuntimeClosure,
  assertScenarioRuntimeClosureIncremental,
} from "./runtimeClosure";
import { freezeCanonicalGraph } from "./canonicalFreeze";
import { claimCanonicalSimulationStepResult } from "./tick";

export const SIMULATION_SNAPSHOT_FORMAT_VERSION = 3 as const;

const canonicalRunRecords = new WeakMap<RunRecord, ScenarioDefinition>();

function isCanonicalRunRecordForScenario(
  record: RunRecord,
  scenario: ScenarioDefinition,
): boolean {
  return canonicalRunRecords.get(record) === scenario;
}

/** Register only after this module has completed the relevant validation. */
function registerCanonicalRunRecord<T extends RunRecord>(
  record: T,
  scenario: ScenarioDefinition,
): T {
  freezeCanonicalGraph(record);
  canonicalRunRecords.set(record, scenario);
  return record;
}

export interface SerializedWorldStateV3 {
  readonly tick: number;
  readonly date: SimDate;
  readonly countries: Readonly<Record<string, Country>>;
  readonly regions: Readonly<Record<string, Region>>;
  readonly landHexStates: Readonly<Record<string, LandHexRuntimeState>>;
  readonly governments: Readonly<Record<string, Government>>;
  readonly factions: Readonly<Record<string, Faction>>;
  readonly conflicts: Readonly<Record<string, Conflict>>;
  readonly interventionCommitments: Readonly<
    Record<string, InterventionCommitment>
  >;
  readonly politicalProposals: Readonly<Record<string, PoliticalProposal>>;
  readonly contactEdgeStates: Readonly<Record<string, ContactEdgeRuntimeState>>;
  readonly policies: Readonly<Record<string, PolicyState>>;
  readonly rngState: SeedState;
  readonly run: RunState;
}

export interface SerializedEventStoreV2 {
  readonly events: readonly GameEvent[];
}

/** Versioned runtime snapshot. Static ScenarioDefinition content is excluded. */
export interface SerializedSimulationSnapshotV3 {
  readonly formatVersion: typeof SIMULATION_SNAPSHOT_FORMAT_VERSION;
  readonly scenarioId: string;
  readonly scenarioVersion: number;
  readonly world: SerializedWorldStateV3;
  readonly eventStore: SerializedEventStoreV2;
}

type UnknownRecord = { readonly [key: string]: unknown };

const ACTION_SOURCES = ["player", "heuristic", "llm"] as const;
const AUTHORITIES = ["central", "contender", "exile"] as const;
const CONFLICT_KINDS = ["rebellion", "coup", "civilWar", "war"] as const;
const CONFLICT_STATUSES = ["active", "resolved"] as const;
const FACTION_INTERESTS = [
  "land",
  "trade",
  "labor",
  "taxation",
  "authority",
  "religion",
  "security",
] as const;
const FACTION_STRATEGIES = [
  "wait",
  "accept",
  "protest",
  "strike",
  "bargain",
  "lobby",
  "organize",
  "hoard",
  "fundMovement",
  "supportCoup",
  "compromise",
  "defect",
] as const;
const VISIBILITIES = ["hidden", "world", "important"] as const;
const SUFFRAGES = ["none", "elite", "property", "broad", "universal"] as const;
const PRODUCTIVE_PROPERTIES = [
  "privateAllowed",
  "mixed",
  "publicOnly",
] as const;
const LAND_OWNERSHIPS = ["feudal", "private", "communal", "state"] as const;
const LABOR_ORGANIZATIONS = ["illegal", "restricted", "legal"] as const;
const PRESS_FREEDOMS = ["censored", "restricted", "free"] as const;
function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function cloneJsonValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map((entry) => cloneJsonValue(entry));
  }

  if (value !== null && typeof value === "object") {
    const object = value as Readonly<Record<string, JsonValue>>;
    const cloned = Object.create(null) as Record<string, JsonValue>;

    for (const key of Object.keys(object).sort(compareStableText)) {
      cloned[key] = cloneJsonValue(object[key]!);
    }

    return cloned;
  }

  return value;
}

function cloneRecord<T>(
  record: Readonly<Record<string, T>>,
  clone: (value: T) => T,
): Readonly<Record<string, T>> {
  const cloned = Object.create(null) as Record<string, T>;

  for (const key of Object.keys(record).sort(compareStableText)) {
    cloned[key] = clone(record[key]!);
  }

  return cloned;
}

function cloneNumberRecord(
  record: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> {
  return cloneRecord(record, (value) => value);
}

function cloneController(
  controller: TerritorialController,
): TerritorialController {
  switch (controller.kind) {
    case "country":
      return { kind: "country", countryId: controller.countryId };
    case "faction":
      return { kind: "faction", factionId: controller.factionId };
    case "uncontrolled":
      return { kind: "uncontrolled" };
  }
}

function cloneIdeologyState(state: IdeologyState): IdeologyState {
  return { ...state };
}

function cloneDiplomaticRelation(
  relation: DiplomaticRelation,
): DiplomaticRelation {
  return { ...relation };
}

function cloneCountry(country: Country): Country {
  return {
    ...country,
    diplomacy: cloneRecord(country.diplomacy, cloneDiplomaticRelation),
  };
}

function cloneRegion(region: Region): Region {
  return {
    ...region,
    resources: cloneNumberRecord(region.resources),
    resourceProductionCapacity: cloneNumberRecord(
      region.resourceProductionCapacity,
    ),
    resourceProduction: cloneNumberRecord(region.resourceProduction),
    resourceDemand: cloneNumberRecord(region.resourceDemand),
    ideology: cloneRecord(region.ideology, cloneIdeologyState),
  };
}

function cloneFaction(faction: Faction): Faction {
  return {
    ...faction,
    // Interest priority is part of the faction's authored/read state. Keep
    // its order stable across a round trip instead of treating it as a set.
    interests: [...faction.interests],
    ideologyAffinity: cloneNumberRecord(faction.ideologyAffinity),
    foreignLinks: cloneNumberRecord(faction.foreignLinks),
  };
}

function cloneGovernment(government: Government): Government {
  return { ...government };
}

function cloneConflictWinner(winner: ConflictWinner): ConflictWinner {
  return winner.kind === "country"
    ? { kind: "country", countryId: winner.countryId }
    : { kind: "faction", factionId: winner.factionId };
}

function cloneConflictOutcome(outcome: ConflictOutcome): ConflictOutcome {
  switch (outcome.kind) {
    case "statusQuo":
      return {
        kind: "statusQuo",
        ...(outcome.winner === undefined
          ? {}
          : { winner: cloneConflictWinner(outcome.winner) }),
      };
    case "governmentTransition":
      return { ...outcome, winner: cloneConflictWinner(outcome.winner) };
    case "stateDissolved":
      return {
        ...outcome,
        ...(outcome.winner === undefined
          ? {}
          : { winner: cloneConflictWinner(outcome.winner) }),
      };
  }
}

function cloneConflict(conflict: Conflict): Conflict {
  return {
    ...conflict,
    // These arrays are ordered domain data. Conflict resolution uses the
    // first participant as an actor in several paths, so persistence must
    // preserve their semantic order rather than treating them as sets.
    participantCountryIds: [...conflict.participantCountryIds],
    participantFactionIds: [...conflict.participantFactionIds],
    ...(conflict.affectedRegionIds === undefined
      ? {}
      : { affectedRegionIds: [...conflict.affectedRegionIds] }),
    contestedRegionIds: [...conflict.contestedRegionIds],
    ...(conflict.outcome === undefined
      ? {}
      : { outcome: cloneConflictOutcome(conflict.outcome) }),
  };
}

function cloneInterventionCommitment(
  commitment: InterventionCommitment,
): InterventionCommitment {
  return { ...commitment };
}

function clonePoliticalProposal(
  proposal: PoliticalProposal,
): PoliticalProposal {
  return { ...proposal };
}

function cloneContactEdgeRuntimeState(
  state: ContactEdgeRuntimeState,
): ContactEdgeRuntimeState {
  return { ...state };
}

function clonePolicyState(policyState: PolicyState): PolicyState {
  return {
    activePolicyIds: [...policyState.activePolicyIds],
    enactedAtTick: cloneNumberRecord(policyState.enactedAtTick),
    institutionalRules: { ...policyState.institutionalRules },
  };
}

function cloneActionRecord(action: ActionRecord): ActionRecord {
  return {
    // Keep action-log JSON canonical across encode/decode.  Action proposals
    // are authored in proposal-field order, while the strict decoder rebuilds
    // records in identity/order-field order; spelling that order here avoids
    // semantically identical snapshots differing only by object key order.
    id: action.id,
    tick: action.tick,
    sequence: action.sequence,
    source: action.source,
    actionType: action.actionType,
    payload: cloneJsonValue(action.payload),
    schemaVersion: action.schemaVersion,
    validationOutcome:
      action.validationOutcome.kind === "accepted"
        ? { kind: "accepted" }
        : { kind: "rejected", reason: action.validationOutcome.reason },
  };
}

function cloneRunOutcome(outcome: RunOutcome): RunOutcome {
  switch (outcome.status) {
    case "active":
      return { status: "active" };
    case "won":
      return { ...outcome };
    case "defeated":
      return { ...outcome };
  }
}

function cloneRunState(run: RunState): RunState {
  const consolidation: OrderConsolidationProgress = {
    ...run.consolidation,
  };

  return {
    ...run,
    outcome: cloneRunOutcome(run.outcome),
    consolidation,
    actionLog: run.actionLog.map(cloneActionRecord),
  };
}

function cloneEvent(event: GameEvent): GameEvent {
  return {
    id: event.id,
    tick: event.tick,
    sequence: event.sequence,
    type: event.type,
    ...(event.actorId === undefined ? {} : { actorId: event.actorId }),
    ...(event.targetId === undefined ? {} : { targetId: event.targetId }),
    causeIds: [...event.causeIds],
    payload: cloneJsonValue(event.payload),
    visibility: event.visibility,
  };
}

function cloneWorldState(world: WorldState): SerializedWorldStateV3 {
  return {
    tick: world.tick,
    date: { ...world.date },
    countries: cloneRecord(world.countries, cloneCountry),
    regions: cloneRecord(world.regions, cloneRegion),
    landHexStates: cloneRecord(world.landHexStates, (state) => ({
      controller: cloneController(state.controller),
    })),
    governments: cloneRecord(world.governments, cloneGovernment),
    factions: cloneRecord(world.factions, cloneFaction),
    conflicts: cloneRecord(world.conflicts, cloneConflict),
    interventionCommitments: cloneRecord(
      world.interventionCommitments,
      cloneInterventionCommitment,
    ),
    politicalProposals: cloneRecord(
      world.politicalProposals ?? {},
      clonePoliticalProposal,
    ),
    contactEdgeStates: cloneRecord(
      world.contactEdgeStates,
      cloneContactEdgeRuntimeState,
    ),
    policies: cloneRecord(world.policies, clonePolicyState),
    rngState: { ...world.rngState },
    run: cloneRunState(world.run),
  };
}

function assertKnownKeys(
  record: UnknownRecord,
  keys: readonly string[],
  label: string,
): void {
  const allowed = new Set(keys);

  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) {
      throw new Error(`${label} contains unknown field ${key}.`);
    }
  }
}

function expectRecord(value: unknown, label: string): UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }

  return value as UnknownRecord;
}

function expectArray(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }

  return value;
}

function required(record: UnknownRecord, key: string, label: string): unknown {
  if (!Object.prototype.hasOwnProperty.call(record, key)) {
    throw new Error(`${label}.${key} is missing.`);
  }

  const value = record[key];
  if (value === undefined) {
    throw new Error(`${label}.${key} cannot be undefined.`);
  }

  return value;
}

function optional(record: UnknownRecord, key: string, label: string): unknown {
  if (!Object.prototype.hasOwnProperty.call(record, key)) {
    return undefined;
  }

  const value = record[key];
  if (value === undefined) {
    throw new Error(`${label}.${key} cannot be undefined.`);
  }

  return value;
}

function expectString(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new Error(`${label} must be a string.`);
  }

  return value;
}

function expectNonEmptyString(value: unknown, label: string): string {
  const stringValue = expectString(value, label);
  if (stringValue.length === 0) {
    throw new Error(`${label} must not be empty.`);
  }

  return stringValue;
}

function expectBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean.`);
  }

  return value;
}

function expectFiniteNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }

  return value;
}

function expectInteger(value: unknown, label: string): number {
  const numberValue = expectFiniteNumber(value, label);
  if (!Number.isInteger(numberValue)) {
    throw new Error(`${label} must be an integer.`);
  }

  return numberValue;
}

function expectNonNegativeInteger(value: unknown, label: string): number {
  const integerValue = expectInteger(value, label);
  if (integerValue < 0) {
    throw new Error(`${label} must be non-negative.`);
  }

  return integerValue;
}

function expectUint32(value: unknown, label: string): number {
  const integerValue = expectNonNegativeInteger(value, label);
  if (integerValue > 4_294_967_295) {
    throw new Error(`${label} must fit in an unsigned 32-bit integer.`);
  }

  return integerValue;
}

function expectEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string,
): T {
  const stringValue = expectString(value, label);
  if (!allowed.includes(stringValue as T)) {
    throw new Error(`${label} has an invalid value.`);
  }

  return stringValue as T;
}

function decodeJsonValue(value: unknown, label: string): JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "number") {
    return expectFiniteNumber(value, label);
  }

  if (Array.isArray(value)) {
    return value.map((entry, index) =>
      decodeJsonValue(entry, `${label}[${index}]`),
    );
  }

  const record = expectRecord(value, label);
  const decoded = Object.create(null) as Record<string, JsonValue>;

  for (const key of Object.keys(record).sort(compareStableText)) {
    decoded[key] = decodeJsonValue(record[key], `${label}.${key}`);
  }

  return decoded;
}

function decodeStringArray(value: unknown, label: string): readonly string[] {
  return expectArray(value, label).map((entry, index) =>
    expectNonEmptyString(entry, `${label}[${index}]`),
  );
}

function decodeNumberRecord(
  value: unknown,
  label: string,
): Readonly<Record<string, number>> {
  const record = expectRecord(value, label);
  const decoded = Object.create(null) as Record<string, number>;

  for (const key of Object.keys(record).sort(compareStableText)) {
    decoded[key] = expectFiniteNumber(record[key], `${label}.${key}`);
  }

  return decoded;
}

function decodeEntityRecord<T extends { readonly id: string }>(
  value: unknown,
  label: string,
  decode: (value: unknown, label: string) => T,
): Readonly<Record<string, T>> {
  const record = expectRecord(value, label);
  const decoded = Object.create(null) as Record<string, T>;

  for (const key of Object.keys(record).sort(compareStableText)) {
    const entity = decode(record[key], `${label}.${key}`);
    if (entity.id !== key) {
      throw new Error(
        `${label}.${key} identity does not match its record key.`,
      );
    }

    decoded[key] = entity;
  }

  return decoded;
}

function decodeSimDate(value: unknown, label: string): SimDate {
  const record = expectRecord(value, label);
  assertKnownKeys(record, ["year", "month", "day"], label);

  return {
    year: expectNonNegativeInteger(
      required(record, "year", label),
      `${label}.year`,
    ),
    month: expectNonNegativeInteger(
      required(record, "month", label),
      `${label}.month`,
    ),
    day: expectNonNegativeInteger(
      required(record, "day", label),
      `${label}.day`,
    ),
  };
}

function decodeDiplomaticRelation(
  value: unknown,
  label: string,
): DiplomaticRelation {
  const record = expectRecord(value, label);
  assertKnownKeys(
    record,
    ["opinion", "tradeDependence", "borderThreat", "ideologicalThreat"],
    label,
  );

  return {
    opinion: expectFiniteNumber(
      required(record, "opinion", label),
      `${label}.opinion`,
    ),
    tradeDependence: expectFiniteNumber(
      required(record, "tradeDependence", label),
      `${label}.tradeDependence`,
    ),
    borderThreat: expectFiniteNumber(
      required(record, "borderThreat", label),
      `${label}.borderThreat`,
    ),
    ideologicalThreat: expectFiniteNumber(
      required(record, "ideologicalThreat", label),
      `${label}.ideologicalThreat`,
    ),
  };
}

function decodeCountry(value: unknown, label: string): Country {
  const record = expectRecord(value, label);
  assertKnownKeys(
    record,
    [
      "id",
      "name",
      "currentGovernmentId",
      "treasury",
      "dailyIncome",
      "dailyExpenditure",
      "legitimacy",
      "stateCapacity",
      "production",
      "militaryPower",
      "instability",
      "stateContinuity",
      "capitalRegionId",
      "diplomacy",
    ],
    label,
  );

  const diplomacy = expectRecord(
    required(record, "diplomacy", label),
    `${label}.diplomacy`,
  );

  return {
    id: asCountryId(
      expectNonEmptyString(required(record, "id", label), `${label}.id`),
    ),
    name: expectString(required(record, "name", label), `${label}.name`),
    currentGovernmentId:
      required(record, "currentGovernmentId", label) === null
        ? null
        : asGovernmentId(
            expectNonEmptyString(
              required(record, "currentGovernmentId", label),
              `${label}.currentGovernmentId`,
            ),
          ),
    treasury: expectFiniteNumber(
      required(record, "treasury", label),
      `${label}.treasury`,
    ),
    dailyIncome: expectFiniteNumber(
      required(record, "dailyIncome", label),
      `${label}.dailyIncome`,
    ),
    dailyExpenditure: expectFiniteNumber(
      required(record, "dailyExpenditure", label),
      `${label}.dailyExpenditure`,
    ),
    legitimacy: expectFiniteNumber(
      required(record, "legitimacy", label),
      `${label}.legitimacy`,
    ),
    stateCapacity: expectFiniteNumber(
      required(record, "stateCapacity", label),
      `${label}.stateCapacity`,
    ),
    production: expectFiniteNumber(
      required(record, "production", label),
      `${label}.production`,
    ),
    militaryPower: expectFiniteNumber(
      required(record, "militaryPower", label),
      `${label}.militaryPower`,
    ),
    instability: expectFiniteNumber(
      required(record, "instability", label),
      `${label}.instability`,
    ),
    stateContinuity: expectFiniteNumber(
      required(record, "stateContinuity", label),
      `${label}.stateContinuity`,
    ),
    capitalRegionId:
      required(record, "capitalRegionId", label) === null
        ? null
        : asRegionId(
            expectNonEmptyString(
              required(record, "capitalRegionId", label),
              `${label}.capitalRegionId`,
            ),
          ),
    diplomacy: decodeEntityMap(
      diplomacy,
      `${label}.diplomacy`,
      decodeDiplomaticRelation,
    ) as Readonly<Record<CountryId, DiplomaticRelation>>,
  };
}

function decodeIdeologyState(value: unknown, label: string): IdeologyState {
  const record = expectRecord(value, label);
  assertKnownKeys(record, ["support", "radicalism", "organization"], label);

  return {
    support: expectFiniteNumber(
      required(record, "support", label),
      `${label}.support`,
    ),
    radicalism: expectFiniteNumber(
      required(record, "radicalism", label),
      `${label}.radicalism`,
    ),
    organization: expectFiniteNumber(
      required(record, "organization", label),
      `${label}.organization`,
    ),
  };
}

function decodeRegion(value: unknown, label: string): Region {
  const record = expectRecord(value, label);
  assertKnownKeys(
    record,
    [
      "id",
      "name",
      "ownerCountryId",
      "population",
      "urbanization",
      "accessibility",
      "resources",
      "resourceProductionCapacity",
      "resourceProduction",
      "resourceDemand",
      "production",
      "stateControl",
      "infrastructure",
      "scarcity",
      "unrest",
      "ideology",
    ],
    label,
  );

  return {
    id: asRegionId(
      expectNonEmptyString(required(record, "id", label), `${label}.id`),
    ),
    name: expectString(required(record, "name", label), `${label}.name`),
    ownerCountryId: asCountryId(
      expectNonEmptyString(
        required(record, "ownerCountryId", label),
        `${label}.ownerCountryId`,
      ),
    ),
    population: expectFiniteNumber(
      required(record, "population", label),
      `${label}.population`,
    ),
    urbanization: expectFiniteNumber(
      required(record, "urbanization", label),
      `${label}.urbanization`,
    ),
    accessibility: expectFiniteNumber(
      required(record, "accessibility", label),
      `${label}.accessibility`,
    ),
    resources: decodeNumberRecord(
      required(record, "resources", label),
      `${label}.resources`,
    ) as ResourceStock,
    resourceProductionCapacity: decodeNumberRecord(
      required(record, "resourceProductionCapacity", label),
      `${label}.resourceProductionCapacity`,
    ) as ResourceStock,
    resourceProduction: decodeNumberRecord(
      required(record, "resourceProduction", label),
      `${label}.resourceProduction`,
    ) as ResourceStock,
    resourceDemand: decodeNumberRecord(
      required(record, "resourceDemand", label),
      `${label}.resourceDemand`,
    ) as ResourceStock,
    production: expectFiniteNumber(
      required(record, "production", label),
      `${label}.production`,
    ),
    stateControl: expectFiniteNumber(
      required(record, "stateControl", label),
      `${label}.stateControl`,
    ),
    infrastructure: expectFiniteNumber(
      required(record, "infrastructure", label),
      `${label}.infrastructure`,
    ),
    scarcity: expectFiniteNumber(
      required(record, "scarcity", label),
      `${label}.scarcity`,
    ),
    unrest: expectFiniteNumber(
      required(record, "unrest", label),
      `${label}.unrest`,
    ),
    ideology: decodeEntityMap(
      expectRecord(required(record, "ideology", label), `${label}.ideology`),
      `${label}.ideology`,
      decodeIdeologyState,
    ) as Readonly<Record<IdeologyId, IdeologyState>>,
  };
}

function decodeController(
  value: unknown,
  label: string,
): TerritorialController {
  const record = expectRecord(value, label);
  const kind = expectEnum(
    required(record, "kind", label),
    ["country", "faction", "uncontrolled"] as const,
    `${label}.kind`,
  );

  switch (kind) {
    case "country":
      assertKnownKeys(record, ["kind", "countryId"], label);
      return {
        kind,
        countryId: asCountryId(
          expectNonEmptyString(
            required(record, "countryId", label),
            `${label}.countryId`,
          ),
        ),
      };
    case "faction":
      assertKnownKeys(record, ["kind", "factionId"], label);
      return {
        kind,
        factionId: asFactionId(
          expectNonEmptyString(
            required(record, "factionId", label),
            `${label}.factionId`,
          ),
        ),
      };
    case "uncontrolled":
      assertKnownKeys(record, ["kind"], label);
      return { kind };
  }
}

function decodeLandHexRuntimeState(
  value: unknown,
  label: string,
): LandHexRuntimeState {
  const record = expectRecord(value, label);
  assertKnownKeys(record, ["controller"], label);
  return {
    controller: decodeController(
      required(record, "controller", label),
      `${label}.controller`,
    ),
  };
}

function decodeGovernment(value: unknown, label: string): Government {
  const record = expectRecord(value, label);
  assertKnownKeys(
    record,
    ["id", "countryId", "name", "authority", "formedAtTick"],
    label,
  );

  return {
    id: asGovernmentId(
      expectNonEmptyString(required(record, "id", label), `${label}.id`),
    ),
    countryId: asCountryId(
      expectNonEmptyString(
        required(record, "countryId", label),
        `${label}.countryId`,
      ),
    ),
    name: expectString(required(record, "name", label), `${label}.name`),
    authority: expectEnum(
      required(record, "authority", label),
      AUTHORITIES,
      `${label}.authority`,
    ),
    formedAtTick: expectNonNegativeInteger(
      required(record, "formedAtTick", label),
      `${label}.formedAtTick`,
    ),
  };
}

function decodeFaction(value: unknown, label: string): Faction {
  const record = expectRecord(value, label);
  assertKnownKeys(
    record,
    [
      "id",
      "name",
      "countryId",
      "interests",
      "resources",
      "organization",
      "influence",
      "grievance",
      "ideologyAffinity",
      "foreignLinks",
      "currentStrategy",
    ],
    label,
  );

  return {
    id: asFactionId(
      expectNonEmptyString(required(record, "id", label), `${label}.id`),
    ),
    name: expectString(required(record, "name", label), `${label}.name`),
    countryId: asCountryId(
      expectNonEmptyString(
        required(record, "countryId", label),
        `${label}.countryId`,
      ),
    ),
    interests: expectArray(
      required(record, "interests", label),
      `${label}.interests`,
    ).map((entry, index) =>
      expectEnum(entry, FACTION_INTERESTS, `${label}.interests[${index}]`),
    ) as readonly FactionInterest[],
    resources: expectFiniteNumber(
      required(record, "resources", label),
      `${label}.resources`,
    ),
    organization: expectFiniteNumber(
      required(record, "organization", label),
      `${label}.organization`,
    ),
    influence: expectFiniteNumber(
      required(record, "influence", label),
      `${label}.influence`,
    ),
    grievance: expectFiniteNumber(
      required(record, "grievance", label),
      `${label}.grievance`,
    ),
    ideologyAffinity: decodeNumberRecord(
      required(record, "ideologyAffinity", label),
      `${label}.ideologyAffinity`,
    ) as Readonly<Record<IdeologyId, number>>,
    foreignLinks: decodeNumberRecord(
      required(record, "foreignLinks", label),
      `${label}.foreignLinks`,
    ) as Readonly<Record<CountryId, number>>,
    currentStrategy: expectEnum(
      required(record, "currentStrategy", label),
      FACTION_STRATEGIES,
      `${label}.currentStrategy`,
    ) as FactionStrategy,
  };
}

function decodeConflictWinner(value: unknown, label: string): ConflictWinner {
  const record = expectRecord(value, label);
  const kind = expectEnum(
    required(record, "kind", label),
    ["country", "faction"] as const,
    `${label}.kind`,
  );

  if (kind === "country") {
    assertKnownKeys(record, ["kind", "countryId"], label);
    return {
      kind,
      countryId: asCountryId(
        expectNonEmptyString(
          required(record, "countryId", label),
          `${label}.countryId`,
        ),
      ),
    };
  }

  assertKnownKeys(record, ["kind", "factionId"], label);
  return {
    kind,
    factionId: asFactionId(
      expectNonEmptyString(
        required(record, "factionId", label),
        `${label}.factionId`,
      ),
    ),
  };
}

function decodeConflictOutcome(value: unknown, label: string): ConflictOutcome {
  const record = expectRecord(value, label);
  const kind = expectEnum(
    required(record, "kind", label),
    ["statusQuo", "governmentTransition", "stateDissolved"] as const,
    `${label}.kind`,
  );

  if (kind === "statusQuo") {
    assertKnownKeys(record, ["kind", "winner"], label);
    const winner = optional(record, "winner", label);
    return {
      kind,
      ...(winner === undefined
        ? {}
        : { winner: decodeConflictWinner(winner, `${label}.winner`) }),
    };
  }

  if (kind === "governmentTransition") {
    assertKnownKeys(
      record,
      [
        "kind",
        "countryId",
        "previousGovernmentId",
        "nextGovernmentId",
        "winner",
      ],
      label,
    );
    return {
      kind,
      countryId: asCountryId(
        expectNonEmptyString(
          required(record, "countryId", label),
          `${label}.countryId`,
        ),
      ),
      previousGovernmentId:
        required(record, "previousGovernmentId", label) === null
          ? null
          : asGovernmentId(
              expectNonEmptyString(
                required(record, "previousGovernmentId", label),
                `${label}.previousGovernmentId`,
              ),
            ),
      nextGovernmentId: asGovernmentId(
        expectNonEmptyString(
          required(record, "nextGovernmentId", label),
          `${label}.nextGovernmentId`,
        ),
      ),
      winner: decodeConflictWinner(
        required(record, "winner", label),
        `${label}.winner`,
      ),
    };
  }

  assertKnownKeys(record, ["kind", "countryId", "reason", "winner"], label);
  const winner = optional(record, "winner", label);
  return {
    kind,
    countryId: asCountryId(
      expectNonEmptyString(
        required(record, "countryId", label),
        `${label}.countryId`,
      ),
    ),
    reason: expectEnum(
      required(record, "reason", label),
      [
        "fullAnnexation",
        "permanentFragmentation",
        "lossOfSovereignFunctions",
        "stateContinuityThreshold",
      ] as const,
      `${label}.reason`,
    ),
    ...(winner === undefined
      ? {}
      : { winner: decodeConflictWinner(winner, `${label}.winner`) }),
  };
}

function decodeConflict(value: unknown, label: string): Conflict {
  const record = expectRecord(value, label);
  assertKnownKeys(
    record,
    [
      "id",
      "kind",
      "status",
      "participantCountryIds",
      "participantFactionIds",
      "affectedRegionIds",
      "contestedRegionIds",
      "startedAtTick",
      "resolvedAtTick",
      "outcome",
    ],
    label,
  );

  const affectedRegionIds = optional(record, "affectedRegionIds", label);
  const resolvedAtTick = optional(record, "resolvedAtTick", label);
  const outcome = optional(record, "outcome", label);

  return {
    id: asConflictId(
      expectNonEmptyString(required(record, "id", label), `${label}.id`),
    ),
    kind: expectEnum(
      required(record, "kind", label),
      CONFLICT_KINDS,
      `${label}.kind`,
    ),
    status: expectEnum(
      required(record, "status", label),
      CONFLICT_STATUSES,
      `${label}.status`,
    ),
    participantCountryIds: decodeStringArray(
      required(record, "participantCountryIds", label),
      `${label}.participantCountryIds`,
    ).map(asCountryId),
    participantFactionIds: decodeStringArray(
      required(record, "participantFactionIds", label),
      `${label}.participantFactionIds`,
    ).map(asFactionId),
    ...(affectedRegionIds === undefined
      ? {}
      : {
          affectedRegionIds: decodeStringArray(
            affectedRegionIds,
            `${label}.affectedRegionIds`,
          ).map(asRegionId),
        }),
    contestedRegionIds: decodeStringArray(
      required(record, "contestedRegionIds", label),
      `${label}.contestedRegionIds`,
    ).map(asRegionId),
    startedAtTick: expectNonNegativeInteger(
      required(record, "startedAtTick", label),
      `${label}.startedAtTick`,
    ),
    ...(resolvedAtTick === undefined
      ? {}
      : {
          resolvedAtTick: expectNonNegativeInteger(
            resolvedAtTick,
            `${label}.resolvedAtTick`,
          ),
        }),
    ...(outcome === undefined
      ? {}
      : { outcome: decodeConflictOutcome(outcome, `${label}.outcome`) }),
  };
}

function decodeInterventionCommitment(
  value: unknown,
  label: string,
): InterventionCommitment {
  const record = expectRecord(value, label);
  assertKnownKeys(
    record,
    [
      "id",
      "interventionId",
      "countryId",
      "sourceActionId",
      "startedTick",
      "firstOccupiedTick",
      "completionTick",
      "administrativeLoad",
    ],
    label,
  );

  return {
    id: asInterventionCommitmentId(
      expectNonEmptyString(required(record, "id", label), `${label}.id`),
    ),
    interventionId: asInterventionId(
      expectNonEmptyString(
        required(record, "interventionId", label),
        `${label}.interventionId`,
      ),
    ),
    countryId: asCountryId(
      expectNonEmptyString(
        required(record, "countryId", label),
        `${label}.countryId`,
      ),
    ),
    sourceActionId: asActionId(
      expectNonEmptyString(
        required(record, "sourceActionId", label),
        `${label}.sourceActionId`,
      ),
    ),
    startedTick: expectNonNegativeInteger(
      required(record, "startedTick", label),
      `${label}.startedTick`,
    ),
    firstOccupiedTick: expectNonNegativeInteger(
      required(record, "firstOccupiedTick", label),
      `${label}.firstOccupiedTick`,
    ),
    completionTick: expectNonNegativeInteger(
      required(record, "completionTick", label),
      `${label}.completionTick`,
    ),
    administrativeLoad: expectFiniteNumber(
      required(record, "administrativeLoad", label),
      `${label}.administrativeLoad`,
    ),
  };
}

function decodePoliticalProposal(
  value: unknown,
  label: string,
): PoliticalProposal {
  const record = expectRecord(value, label);
  assertKnownKeys(
    record,
    [
      "id",
      "proposerFactionId",
      "countryId",
      "targetGovernmentId",
      "subjectKind",
      "interventionId",
      "status",
      "createdAtTick",
      "openingActionId",
      "openingEventId",
      "resolvedAtTick",
      "responseActionId",
      "resolutionReason",
    ],
    label,
  );
  const resolvedAtTick = optional(record, "resolvedAtTick", label);
  const responseActionId = optional(record, "responseActionId", label);
  const resolutionReason = optional(record, "resolutionReason", label);

  return {
    id: asPoliticalProposalId(
      expectNonEmptyString(required(record, "id", label), `${label}.id`),
    ),
    proposerFactionId: asFactionId(
      expectNonEmptyString(
        required(record, "proposerFactionId", label),
        `${label}.proposerFactionId`,
      ),
    ),
    countryId: asCountryId(
      expectNonEmptyString(
        required(record, "countryId", label),
        `${label}.countryId`,
      ),
    ),
    targetGovernmentId: asGovernmentId(
      expectNonEmptyString(
        required(record, "targetGovernmentId", label),
        `${label}.targetGovernmentId`,
      ),
    ),
    subjectKind: expectEnum(
      required(record, "subjectKind", label),
      POLITICAL_PROPOSAL_SUBJECT_KINDS,
      `${label}.subjectKind`,
    ),
    interventionId: asInterventionId(
      expectNonEmptyString(
        required(record, "interventionId", label),
        `${label}.interventionId`,
      ),
    ),
    status: expectEnum(
      required(record, "status", label),
      POLITICAL_PROPOSAL_STATUSES,
      `${label}.status`,
    ),
    createdAtTick: expectNonNegativeInteger(
      required(record, "createdAtTick", label),
      `${label}.createdAtTick`,
    ),
    openingActionId: asActionId(
      expectNonEmptyString(
        required(record, "openingActionId", label),
        `${label}.openingActionId`,
      ),
    ),
    openingEventId: asEventId(
      expectNonEmptyString(
        required(record, "openingEventId", label),
        `${label}.openingEventId`,
      ),
    ),
    ...(resolvedAtTick === undefined
      ? {}
      : {
          resolvedAtTick: expectNonNegativeInteger(
            resolvedAtTick,
            `${label}.resolvedAtTick`,
          ),
        }),
    ...(responseActionId === undefined
      ? {}
      : {
          responseActionId: asActionId(
            expectNonEmptyString(responseActionId, `${label}.responseActionId`),
          ),
        }),
    ...(resolutionReason === undefined
      ? {}
      : {
          resolutionReason: expectEnum(
            resolutionReason,
            POLITICAL_PROPOSAL_RESOLUTION_REASONS,
            `${label}.resolutionReason`,
          ),
        }),
  };
}

function decodeContactEdgeRuntimeState(
  value: unknown,
  label: string,
): ContactEdgeRuntimeState {
  const record = expectRecord(value, label);
  assertKnownKeys(
    record,
    ["enabled", "multiplier", "blockedReason", "blockedByCountryId"],
    label,
  );
  const blockedReason = optional(record, "blockedReason", label);
  const blockedByCountryId = optional(record, "blockedByCountryId", label);

  return {
    enabled: expectBoolean(
      required(record, "enabled", label),
      `${label}.enabled`,
    ),
    multiplier: expectFiniteNumber(
      required(record, "multiplier", label),
      `${label}.multiplier`,
    ),
    ...(blockedReason === undefined
      ? {}
      : {
          blockedReason: expectNonEmptyString(
            blockedReason,
            `${label}.blockedReason`,
          ),
        }),
    ...(blockedByCountryId === undefined
      ? {}
      : {
          blockedByCountryId: asCountryId(
            expectNonEmptyString(
              blockedByCountryId,
              `${label}.blockedByCountryId`,
            ),
          ),
        }),
  };
}

function decodeInstitutionalRules(
  value: unknown,
  label: string,
): InstitutionalRuleState {
  const record = expectRecord(value, label);
  assertKnownKeys(
    record,
    [
      "rulerVeto",
      "legislatureRequired",
      "suffrage",
      "productiveProperty",
      "landOwnership",
      "laborOrganization",
      "pressFreedom",
      "politicalCompetition",
    ],
    label,
  );

  return {
    rulerVeto: expectBoolean(
      required(record, "rulerVeto", label),
      `${label}.rulerVeto`,
    ),
    legislatureRequired: expectBoolean(
      required(record, "legislatureRequired", label),
      `${label}.legislatureRequired`,
    ),
    suffrage: expectEnum(
      required(record, "suffrage", label),
      SUFFRAGES,
      `${label}.suffrage`,
    ),
    productiveProperty: expectEnum(
      required(record, "productiveProperty", label),
      PRODUCTIVE_PROPERTIES,
      `${label}.productiveProperty`,
    ),
    landOwnership: expectEnum(
      required(record, "landOwnership", label),
      LAND_OWNERSHIPS,
      `${label}.landOwnership`,
    ),
    laborOrganization: expectEnum(
      required(record, "laborOrganization", label),
      LABOR_ORGANIZATIONS,
      `${label}.laborOrganization`,
    ),
    pressFreedom: expectEnum(
      required(record, "pressFreedom", label),
      PRESS_FREEDOMS,
      `${label}.pressFreedom`,
    ),
    politicalCompetition: expectEnum(
      required(record, "politicalCompetition", label),
      POLITICAL_COMPETITIONS,
      `${label}.politicalCompetition`,
    ),
  };
}

function decodePolicyState(value: unknown, label: string): PolicyState {
  const record = expectRecord(value, label);
  assertKnownKeys(
    record,
    ["activePolicyIds", "enactedAtTick", "institutionalRules"],
    label,
  );

  return {
    activePolicyIds: decodeStringArray(
      required(record, "activePolicyIds", label),
      `${label}.activePolicyIds`,
    ).map(asPolicyId),
    enactedAtTick: decodeNumberRecord(
      required(record, "enactedAtTick", label),
      `${label}.enactedAtTick`,
    ),
    institutionalRules: decodeInstitutionalRules(
      required(record, "institutionalRules", label),
      `${label}.institutionalRules`,
    ),
  };
}

function decodeActionRecord(value: unknown, label: string): ActionRecord {
  const record = expectRecord(value, label);
  assertKnownKeys(
    record,
    [
      "id",
      "tick",
      "sequence",
      "source",
      "actionType",
      "payload",
      "schemaVersion",
      "validationOutcome",
    ],
    label,
  );
  const validationOutcome = expectRecord(
    required(record, "validationOutcome", label),
    `${label}.validationOutcome`,
  );
  const validationKind = expectEnum(
    required(validationOutcome, "kind", `${label}.validationOutcome`),
    ["accepted", "rejected"] as const,
    `${label}.validationOutcome.kind`,
  );

  if (validationKind === "accepted") {
    assertKnownKeys(validationOutcome, ["kind"], `${label}.validationOutcome`);
  } else {
    assertKnownKeys(
      validationOutcome,
      ["kind", "reason"],
      `${label}.validationOutcome`,
    );
  }

  return {
    id: asActionId(
      expectNonEmptyString(required(record, "id", label), `${label}.id`),
    ),
    tick: expectNonNegativeInteger(
      required(record, "tick", label),
      `${label}.tick`,
    ),
    sequence: expectNonNegativeInteger(
      required(record, "sequence", label),
      `${label}.sequence`,
    ),
    source: expectEnum(
      required(record, "source", label),
      ACTION_SOURCES,
      `${label}.source`,
    ) as ActionSource,
    actionType: expectNonEmptyString(
      required(record, "actionType", label),
      `${label}.actionType`,
    ),
    payload: decodeJsonValue(
      required(record, "payload", label),
      `${label}.payload`,
    ),
    schemaVersion: expectInteger(
      required(record, "schemaVersion", label),
      `${label}.schemaVersion`,
    ),
    validationOutcome:
      validationKind === "accepted"
        ? { kind: "accepted" }
        : {
            kind: "rejected",
            reason: expectNonEmptyString(
              required(
                validationOutcome,
                "reason",
                `${label}.validationOutcome`,
              ),
              `${label}.validationOutcome.reason`,
            ),
          },
  };
}

function decodeRunOutcome(value: unknown, label: string): RunOutcome {
  const record = expectRecord(value, label);
  const status = expectEnum(
    required(record, "status", label),
    ["active", "won", "defeated"] as const,
    `${label}.status`,
  );

  if (status === "active") {
    assertKnownKeys(record, ["status"], label);
    return { status };
  }

  if (status === "won") {
    assertKnownKeys(
      record,
      ["status", "kind", "atTick", "causeEventId"],
      label,
    );
    if (required(record, "kind", label) !== "orderConsolidated") {
      throw new Error(`${label}.kind is invalid for a won outcome.`);
    }
    return {
      status,
      kind: "orderConsolidated",
      atTick: expectNonNegativeInteger(
        required(record, "atTick", label),
        `${label}.atTick`,
      ),
      causeEventId: asEventId(
        expectNonEmptyString(
          required(record, "causeEventId", label),
          `${label}.causeEventId`,
        ),
      ),
    };
  }

  assertKnownKeys(
    record,
    ["status", "kind", "countryId", "reason", "atTick", "causeEventId"],
    label,
  );
  if (required(record, "kind", label) !== "stateDissolved") {
    throw new Error(`${label}.kind is invalid for a defeated outcome.`);
  }

  return {
    status,
    kind: "stateDissolved",
    countryId: asCountryId(
      expectNonEmptyString(
        required(record, "countryId", label),
        `${label}.countryId`,
      ),
    ),
    reason: expectEnum(
      required(record, "reason", label),
      [
        "fullAnnexation",
        "permanentFragmentation",
        "lossOfSovereignFunctions",
        "stateContinuityThreshold",
      ] as const,
      `${label}.reason`,
    ),
    atTick: expectNonNegativeInteger(
      required(record, "atTick", label),
      `${label}.atTick`,
    ),
    causeEventId: asEventId(
      expectNonEmptyString(
        required(record, "causeEventId", label),
        `${label}.causeEventId`,
      ),
    ),
  };
}

function decodeRunState(value: unknown, label: string): RunState {
  const record = expectRecord(value, label);
  assertKnownKeys(
    record,
    [
      "scenarioId",
      "scenarioVersion",
      "simulationVersion",
      "seed",
      "outcome",
      "consolidation",
      "actionLog",
      "nextActionSequence",
      "nextEventSequence",
    ],
    label,
  );
  const consolidation = expectRecord(
    required(record, "consolidation", label),
    `${label}.consolidation`,
  );
  assertKnownKeys(
    consolidation,
    ["isCurrentlyEligible", "consecutiveEligibleTicks", "lastEvaluatedTick"],
    `${label}.consolidation`,
  );
  const lastEvaluatedTick = required(
    consolidation,
    "lastEvaluatedTick",
    `${label}.consolidation`,
  );

  return {
    scenarioId: asScenarioId(
      expectNonEmptyString(
        required(record, "scenarioId", label),
        `${label}.scenarioId`,
      ),
    ),
    scenarioVersion: expectInteger(
      required(record, "scenarioVersion", label),
      `${label}.scenarioVersion`,
    ),
    simulationVersion: expectInteger(
      required(record, "simulationVersion", label),
      `${label}.simulationVersion`,
    ),
    seed: expectUint32(required(record, "seed", label), `${label}.seed`),
    outcome: decodeRunOutcome(
      required(record, "outcome", label),
      `${label}.outcome`,
    ),
    consolidation: {
      isCurrentlyEligible: expectBoolean(
        required(
          consolidation,
          "isCurrentlyEligible",
          `${label}.consolidation`,
        ),
        `${label}.consolidation.isCurrentlyEligible`,
      ),
      consecutiveEligibleTicks: expectNonNegativeInteger(
        required(
          consolidation,
          "consecutiveEligibleTicks",
          `${label}.consolidation`,
        ),
        `${label}.consolidation.consecutiveEligibleTicks`,
      ),
      lastEvaluatedTick:
        lastEvaluatedTick === null
          ? null
          : expectNonNegativeInteger(
              lastEvaluatedTick,
              `${label}.consolidation.lastEvaluatedTick`,
            ),
    },
    actionLog: expectArray(
      required(record, "actionLog", label),
      `${label}.actionLog`,
    ).map((entry, index) =>
      decodeActionRecord(entry, `${label}.actionLog[${index}]`),
    ),
    nextActionSequence: expectNonNegativeInteger(
      required(record, "nextActionSequence", label),
      `${label}.nextActionSequence`,
    ),
    nextEventSequence: expectNonNegativeInteger(
      required(record, "nextEventSequence", label),
      `${label}.nextEventSequence`,
    ),
  };
}

function decodeSeedState(value: unknown, label: string): SeedState {
  const record = expectRecord(value, label);
  assertKnownKeys(record, ["seed", "state", "calls"], label);

  return {
    seed: expectUint32(required(record, "seed", label), `${label}.seed`),
    state: expectUint32(required(record, "state", label), `${label}.state`),
    calls: expectNonNegativeInteger(
      required(record, "calls", label),
      `${label}.calls`,
    ),
  };
}

function decodeWorldState(value: unknown, label: string): WorldState {
  const record = expectRecord(value, label);
  assertKnownKeys(
    record,
    [
      "tick",
      "date",
      "countries",
      "regions",
      "landHexStates",
      "governments",
      "factions",
      "conflicts",
      "interventionCommitments",
      "politicalProposals",
      "contactEdgeStates",
      "policies",
      "rngState",
      "run",
    ],
    label,
  );

  return {
    tick: expectNonNegativeInteger(
      required(record, "tick", label),
      `${label}.tick`,
    ),
    date: decodeSimDate(required(record, "date", label), `${label}.date`),
    countries: decodeEntityRecord(
      required(record, "countries", label),
      `${label}.countries`,
      decodeCountry,
    ),
    regions: decodeEntityRecord(
      required(record, "regions", label),
      `${label}.regions`,
      decodeRegion,
    ),
    landHexStates: decodeEntityMap(
      expectRecord(
        required(record, "landHexStates", label),
        `${label}.landHexStates`,
      ),
      `${label}.landHexStates`,
      decodeLandHexRuntimeState,
    ) as Readonly<Record<LandHexId, LandHexRuntimeState>>,
    governments: decodeEntityRecord(
      required(record, "governments", label),
      `${label}.governments`,
      decodeGovernment,
    ),
    factions: decodeEntityRecord(
      required(record, "factions", label),
      `${label}.factions`,
      decodeFaction,
    ),
    conflicts: decodeEntityRecord(
      required(record, "conflicts", label),
      `${label}.conflicts`,
      decodeConflict,
    ),
    interventionCommitments: decodeEntityRecord(
      required(record, "interventionCommitments", label),
      `${label}.interventionCommitments`,
      decodeInterventionCommitment,
    ),
    politicalProposals: decodeEntityRecord(
      required(record, "politicalProposals", label),
      `${label}.politicalProposals`,
      decodePoliticalProposal,
    ),
    contactEdgeStates: decodeEntityMap(
      expectRecord(
        required(record, "contactEdgeStates", label),
        `${label}.contactEdgeStates`,
      ),
      `${label}.contactEdgeStates`,
      decodeContactEdgeRuntimeState,
    ) as ContactEdgeRuntimeStateMap,
    policies: decodeEntityMap(
      expectRecord(required(record, "policies", label), `${label}.policies`),
      `${label}.policies`,
      decodePolicyState,
    ),
    rngState: decodeSeedState(
      required(record, "rngState", label),
      `${label}.rngState`,
    ),
    run: decodeRunState(required(record, "run", label), `${label}.run`),
  };
}

function decodeEntityMap<T>(
  record: UnknownRecord,
  label: string,
  decode: (value: unknown, label: string) => T,
): Readonly<Record<string, T>> {
  const decoded = Object.create(null) as Record<string, T>;

  for (const key of Object.keys(record).sort(compareStableText)) {
    decoded[key] = decode(record[key], `${label}.${key}`);
  }

  return decoded;
}

function decodeGameEvent(value: unknown, label: string): GameEvent {
  const record = expectRecord(value, label);
  assertKnownKeys(
    record,
    [
      "id",
      "tick",
      "sequence",
      "type",
      "actorId",
      "targetId",
      "causeIds",
      "payload",
      "visibility",
    ],
    label,
  );
  const actorId = optional(record, "actorId", label);
  const targetId = optional(record, "targetId", label);

  return {
    id: asEventId(
      expectNonEmptyString(required(record, "id", label), `${label}.id`),
    ),
    tick: expectNonNegativeInteger(
      required(record, "tick", label),
      `${label}.tick`,
    ),
    sequence: expectNonNegativeInteger(
      required(record, "sequence", label),
      `${label}.sequence`,
    ),
    type: expectEnum(
      required(record, "type", label),
      GAME_EVENT_TYPES,
      `${label}.type`,
    ) as GameEventType,
    ...(actorId === undefined
      ? {}
      : {
          actorId: expectNonEmptyString(
            actorId,
            `${label}.actorId`,
          ) as GameEvent["actorId"],
        }),
    ...(targetId === undefined
      ? {}
      : {
          targetId: expectNonEmptyString(
            targetId,
            `${label}.targetId`,
          ) as GameEvent["targetId"],
        }),
    causeIds: decodeStringArray(
      required(record, "causeIds", label),
      `${label}.causeIds`,
    ).map(asEventId),
    payload: decodeJsonValue(
      required(record, "payload", label),
      `${label}.payload`,
    ),
    visibility: expectEnum(
      required(record, "visibility", label),
      VISIBILITIES,
      `${label}.visibility`,
    ),
  };
}

function decodeEventStore(value: unknown, label: string): EventStore {
  const record = expectRecord(value, label);
  assertKnownKeys(record, ["events"], label);
  const events = expectArray(
    required(record, "events", label),
    `${label}.events`,
  ).map((entry, index) => decodeGameEvent(entry, `${label}.events[${index}]`));
  return createEventStore(events);
}

function eventPayloadValue(event: GameEvent, key: string): unknown {
  if (
    typeof event.payload !== "object" ||
    event.payload === null ||
    Array.isArray(event.payload)
  ) {
    return undefined;
  }
  return (event.payload as Readonly<Record<string, unknown>>)[key];
}

function assertPoliticalProposalEventProvenance(
  world: WorldState,
  eventStore: EventStore,
): void {
  const eventsById = new Map(
    eventStore.events.map((event) => [event.id, event]),
  );
  for (const proposal of Object.values(world.politicalProposals ?? {})) {
    const openingEvent = eventsById.get(proposal.openingEventId);
    if (
      openingEvent === undefined ||
      openingEvent.type !== "POLITICAL_PROPOSAL_OPENED" ||
      openingEvent.tick !== proposal.createdAtTick ||
      eventPayloadValue(openingEvent, "proposalId") !== proposal.id ||
      eventPayloadValue(openingEvent, "openingActionId") !==
        proposal.openingActionId
    ) {
      throw new Error(
        `Political proposal ${proposal.id} has invalid opening event provenance.`,
      );
    }

    if (proposal.status === "open") {
      continue;
    }

    const responseEvent = eventStore.events.find(
      (event) =>
        (event.type === "POLITICAL_PROPOSAL_ACCEPTED" ||
          event.type === "POLITICAL_PROPOSAL_REJECTED") &&
        event.tick === proposal.resolvedAtTick &&
        eventPayloadValue(event, "proposalId") === proposal.id &&
        eventPayloadValue(event, "actionId") === proposal.responseActionId,
    );
    if (responseEvent === undefined) {
      throw new Error(
        `Political proposal ${proposal.id} has no matching response event.`,
      );
    }

    if (
      (proposal.status === "accepted" &&
        responseEvent.type !== "POLITICAL_PROPOSAL_ACCEPTED") ||
      (proposal.status === "rejected" &&
        responseEvent.type !== "POLITICAL_PROPOSAL_REJECTED")
    ) {
      throw new Error(
        `Political proposal ${proposal.id} response event type does not match status.`,
      );
    }
  }
}

function assertEventStoreMatchesWorld(
  world: WorldState,
  eventStore: EventStore,
): void {
  assertEventStoreInvariants(eventStore);

  for (const event of eventStore.events) {
    if (event.tick > world.tick) {
      throw new Error(`Event ${event.id} points beyond the saved world tick.`);
    }
  }

  if (world.run.nextEventSequence !== getNextEventSequence(eventStore)) {
    throw new Error(
      "World nextEventSequence does not match the persisted EventStore cursor.",
    );
  }

  assertPoliticalProposalEventProvenance(world, eventStore);

  const outcome = world.run.outcome;
  if (outcome.status === "active") {
    return;
  }

  const causeEvent = eventStore.events.find(
    (event) => event.id === outcome.causeEventId,
  );
  if (causeEvent === undefined) {
    throw new Error("Terminal outcome references a missing cause event.");
  }

  if (causeEvent.tick !== outcome.atTick) {
    throw new Error("Terminal outcome and cause event ticks do not agree.");
  }

  if (
    (outcome.status === "won" && causeEvent.type !== "ORDER_CONSOLIDATED") ||
    (outcome.status === "defeated" && causeEvent.type !== "STATE_DISSOLVED")
  ) {
    throw new Error("Terminal outcome cause event has an incompatible type.");
  }
}

function assertRunRecordForPersistence(
  scenario: ScenarioDefinition,
  record: RunRecord,
): void {
  assertScenarioDefinition(scenario);
  assertScenarioRuntimeClosure(scenario, record.world);

  const rebuiltStore = createEventStore(record.eventStore.events);
  assertEventStoreMatchesWorld(record.world, rebuiltStore);
}

/** Create a canonical, detached snapshot of one authoritative run record. */
export function serializeSimulationSnapshot(
  scenario: ScenarioDefinition,
  record: RunRecord,
): SerializedSimulationSnapshotV3 {
  assertRunRecordForPersistence(scenario, record);

  return {
    formatVersion: SIMULATION_SNAPSHOT_FORMAT_VERSION,
    scenarioId: scenario.id,
    scenarioVersion: scenario.version,
    world: cloneWorldState(record.world),
    eventStore: {
      events: record.eventStore.events.map(cloneEvent),
    },
  };
}

export function serializeSimulationSnapshotJson(
  scenario: ScenarioDefinition,
  record: RunRecord,
): string {
  return JSON.stringify(serializeSimulationSnapshot(scenario, record));
}

function parseSnapshotInput(input: unknown): unknown {
  if (typeof input !== "string") {
    return input;
  }

  try {
    return JSON.parse(input) as unknown;
  } catch {
    throw new Error("Simulation snapshot is not valid JSON.");
  }
}

/** Validate and reconstruct a detached authoritative run record. */
export function deserializeSimulationSnapshot(
  scenario: ScenarioDefinition,
  input: unknown,
): RunRecord {
  assertScenarioDefinition(scenario);
  const record = expectRecord(parseSnapshotInput(input), "snapshot");
  assertKnownKeys(
    record,
    ["formatVersion", "scenarioId", "scenarioVersion", "world", "eventStore"],
    "snapshot",
  );

  const formatVersion = expectInteger(
    required(record, "formatVersion", "snapshot"),
    "snapshot.formatVersion",
  );
  if (formatVersion !== SIMULATION_SNAPSHOT_FORMAT_VERSION) {
    throw new Error(
      `Unsupported simulation snapshot version ${formatVersion}.`,
    );
  }

  const scenarioId = expectNonEmptyString(
    required(record, "scenarioId", "snapshot"),
    "snapshot.scenarioId",
  );
  const scenarioVersion = expectInteger(
    required(record, "scenarioVersion", "snapshot"),
    "snapshot.scenarioVersion",
  );
  if (scenarioId !== scenario.id || scenarioVersion !== scenario.version) {
    throw new Error("Simulation snapshot scenario identity does not match.");
  }

  const world = decodeWorldState(
    required(record, "world", "snapshot"),
    "snapshot.world",
  );
  const eventStore = decodeEventStore(
    required(record, "eventStore", "snapshot"),
    "snapshot.eventStore",
  );

  assertScenarioRuntimeClosure(scenario, world);

  assertEventStoreMatchesWorld(world, eventStore);
  return registerCanonicalRunRecord({ world, eventStore }, scenario);
}

function assertIncrementalEventStoreMatchesWorld(
  world: WorldState,
  eventStore: EventStore,
  appendedEvents: readonly GameEvent[],
): void {
  for (const event of appendedEvents) {
    if (event.tick > world.tick) {
      throw new Error(`Event ${event.id} points beyond the next world tick.`);
    }
  }

  if (world.run.nextEventSequence !== getNextEventSequence(eventStore)) {
    throw new Error(
      "World nextEventSequence does not match the committed EventStore cursor.",
    );
  }

  assertPoliticalProposalEventProvenance(world, eventStore);

  const outcome = world.run.outcome;
  if (outcome.status === "active") {
    return;
  }

  const causeEvent = findEventById(eventStore, outcome.causeEventId);
  if (causeEvent === undefined) {
    throw new Error("Terminal outcome references a missing cause event.");
  }

  if (causeEvent.tick !== outcome.atTick) {
    throw new Error("Terminal outcome and cause event ticks do not agree.");
  }

  if (
    (outcome.status === "won" && causeEvent.type !== "ORDER_CONSOLIDATED") ||
    (outcome.status === "defeated" && causeEvent.type !== "STATE_DISSOLVED")
  ) {
    throw new Error("Terminal outcome cause event has an incompatible type.");
  }
}

/** Commit one pure simulation result and its events as one immutable run record. */
export function commitSimulationStep(
  scenario: ScenarioDefinition,
  record: RunRecord,
  result: SimulationStepResult,
): RunRecord {
  const hasTrustedStepResult = claimCanonicalSimulationStepResult(
    result,
    scenario,
    record.world,
  );

  if (
    hasTrustedStepResult &&
    isCanonicalRunRecordForScenario(record, scenario)
  ) {
    const nextEventStore = appendEventsIncremental(
      record.eventStore,
      result.emittedEvents,
    );
    assertScenarioRuntimeClosureIncremental(
      scenario,
      record.world,
      result.nextWorld,
    );
    assertIncrementalEventStoreMatchesWorld(
      result.nextWorld,
      nextEventStore,
      result.emittedEvents,
    );

    return registerCanonicalRunRecord(
      {
        world: result.nextWorld,
        eventStore: nextEventStore,
      },
      scenario,
    );
  }

  assertScenarioRuntimeClosure(scenario, record.world);
  assertEventStoreMatchesWorld(record.world, record.eventStore);

  const nextEventStore = appendEvents(record.eventStore, result.emittedEvents);
  assertScenarioRuntimeClosure(scenario, result.nextWorld);
  assertEventStoreMatchesWorld(result.nextWorld, nextEventStore);

  return registerCanonicalRunRecord(
    {
      world: result.nextWorld,
      eventStore: nextEventStore,
    },
    scenario,
  );
}

/** Detached clone helper used by replay/counterfactual tests and tooling. */
export function cloneRunRecordViaSnapshot(
  scenario: ScenarioDefinition,
  record: RunRecord,
): RunRecord {
  return deserializeSimulationSnapshot(
    scenario,
    serializeSimulationSnapshot(scenario, record),
  );
}
