import { createDeterministicActionId } from "../state/action";
import {
  createDeterministicFactionFundMovementCommitmentId,
  FACTION_FUND_MOVEMENT_COMMITMENT_STATUSES,
  FACTION_FUND_MOVEMENT_RESOLUTION_REASONS,
  type FactionFundMovementCommitment,
} from "../state/factionFundMovement";
import type { CountryId } from "../state/ids";
import {
  INSTITUTIONAL_RULE_KEYS,
  POLITICAL_COMPETITIONS,
} from "../state/policy";
import { RESOURCE_TYPES } from "../state/region";
import {
  POLITICAL_PROPOSAL_FAILURE_KINDS,
  POLITICAL_PROPOSAL_PREREQUISITE_KINDS,
  POLITICAL_PROPOSAL_RESOLUTION_REASONS,
  POLITICAL_PROPOSAL_STATUSES,
  POLITICAL_PROPOSAL_SUBJECT_KINDS,
} from "../state/politicalProposal";
import type { WorldState } from "../state/world";
import { COUP_COORDINATION_ALIGNMENTS } from "../state/coupCoordination";
import type { SimDate } from "./clock";
import type { SeedState } from "./rng";

function assertFiniteNumber(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be finite.`);
  }
}

function assertNonNegative(value: number, label: string): void {
  assertFiniteNumber(value, label);

  if (value < 0) {
    throw new Error(`${label} cannot be negative.`);
  }
}

function assertNormalized(value: number, label: string): void {
  assertFiniteNumber(value, label);

  if (value < 0 || value > 1) {
    throw new Error(`${label} must be between 0 and 1.`);
  }
}

function assertIndex(value: number, label: string): void {
  assertFiniteNumber(value, label);

  if (value < 0 || value > 100) {
    throw new Error(`${label} must be between 0 and 100.`);
  }
}

function assertStringEnum(
  value: unknown,
  allowed: readonly string[],
  label: string,
): void {
  if (typeof value !== "string" || !allowed.includes(value)) {
    throw new Error(`${label} has an invalid value.`);
  }
}

function assertPoliticalProposalReconsiderationBasis(
  value: unknown,
  label: string,
  targetGovernmentId: string,
): void {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  const basis = value as Readonly<Record<string, unknown>>;
  const keys = Object.keys(basis).sort();
  if (keys.join(",") !== "failureClasses,feasible,targetGovernmentId") {
    throw new Error(`${label} has non-canonical fields.`);
  }
  if (basis.targetGovernmentId !== targetGovernmentId) {
    throw new Error(`${label}.targetGovernmentId does not match proposal.`);
  }
  if (typeof basis.feasible !== "boolean") {
    throw new Error(`${label}.feasible must be boolean.`);
  }
  if (!Array.isArray(basis.failureClasses)) {
    throw new Error(`${label}.failureClasses must be an array.`);
  }

  const classKeys: string[] = [];
  for (const [index, entry] of basis.failureClasses.entries()) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      throw new Error(`${label}.failureClasses[${index}] must be an object.`);
    }
    const failure = entry as Readonly<Record<string, unknown>>;
    assertStringEnum(
      failure.kind,
      POLITICAL_PROPOSAL_FAILURE_KINDS,
      `${label}.failureClasses[${index}].kind`,
    );
    if (failure.kind === "PREREQUISITE_NOT_MET") {
      const prerequisiteKeys = Object.keys(failure).sort();
      assertStringEnum(
        failure.prerequisiteKind,
        POLITICAL_PROPOSAL_PREREQUISITE_KINDS,
        `${label}.failureClasses[${index}].prerequisiteKind`,
      );
      if (
        !Number.isInteger(failure.prerequisiteIndex) ||
        (failure.prerequisiteIndex as number) < 0
      ) {
        throw new Error(
          `${label}.failureClasses[${index}].prerequisiteIndex is invalid.`,
        );
      }
      const policyPrerequisite =
        failure.prerequisiteKind === "policyActive" ||
        failure.prerequisiteKind === "policyInactive";
      const expectedKeys = policyPrerequisite
        ? "kind,policyId,prerequisiteIndex,prerequisiteKind"
        : "kind,prerequisiteIndex,prerequisiteKind,rule";
      if (prerequisiteKeys.join(",") !== expectedKeys) {
        throw new Error(
          `${label}.failureClasses[${index}] has non-canonical prerequisite fields.`,
        );
      }
      if (policyPrerequisite) {
        if (
          typeof failure.policyId !== "string" ||
          failure.policyId.length === 0
        ) {
          throw new Error(
            `${label}.failureClasses[${index}].policyId is invalid.`,
          );
        }
      } else {
        assertStringEnum(
          failure.rule,
          INSTITUTIONAL_RULE_KEYS,
          `${label}.failureClasses[${index}].rule`,
        );
      }
      classKeys.push(
        [
          failure.kind,
          failure.prerequisiteIndex,
          failure.prerequisiteKind,
          policyPrerequisite ? failure.policyId : failure.rule,
        ].join(":"),
      );
      continue;
    }
    if (Object.keys(failure).join(",") !== "kind") {
      throw new Error(
        `${label}.failureClasses[${index}] has non-canonical fields.`,
      );
    }
    classKeys.push(String(failure.kind));
  }

  if (basis.feasible && basis.failureClasses.length !== 0) {
    throw new Error(`${label}.feasible cannot retain failure classes.`);
  }
  if (!basis.feasible && basis.failureClasses.length === 0) {
    throw new Error(`${label}.infeasible basis needs a failure class.`);
  }
  if (
    classKeys.some(
      (key, index) =>
        (index > 0 && key <= classKeys[index - 1]!) ||
        classKeys.indexOf(key) !== index,
    )
  ) {
    throw new Error(`${label}.failureClasses must be sorted and unique.`);
  }
}

function assertInstitutionalRules(value: unknown, label: string): void {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an institutional rule object.`);
  }

  const rules = value as Readonly<Record<string, unknown>>;

  for (const ruleKey of INSTITUTIONAL_RULE_KEYS) {
    if (!(ruleKey in rules)) {
      throw new Error(`${label}.${ruleKey} is missing.`);
    }
  }

  for (const ruleKey of Object.keys(rules)) {
    if (!INSTITUTIONAL_RULE_KEYS.some((knownKey) => knownKey === ruleKey)) {
      throw new Error(`${label}.${ruleKey} is not a canonical rule.`);
    }
  }

  if (typeof rules.rulerVeto !== "boolean") {
    throw new Error(`${label}.rulerVeto must be boolean.`);
  }

  if (typeof rules.legislatureRequired !== "boolean") {
    throw new Error(`${label}.legislatureRequired must be boolean.`);
  }

  assertStringEnum(
    rules.suffrage,
    ["none", "elite", "property", "broad", "universal"],
    `${label}.suffrage`,
  );
  assertStringEnum(
    rules.productiveProperty,
    ["privateAllowed", "mixed", "publicOnly"],
    `${label}.productiveProperty`,
  );
  assertStringEnum(
    rules.landOwnership,
    ["feudal", "private", "communal", "state"],
    `${label}.landOwnership`,
  );
  assertStringEnum(
    rules.laborOrganization,
    ["illegal", "restricted", "legal"],
    `${label}.laborOrganization`,
  );
  assertStringEnum(
    rules.pressFreedom,
    ["censored", "restricted", "free"],
    `${label}.pressFreedom`,
  );
  assertStringEnum(
    rules.politicalCompetition,
    POLITICAL_COMPETITIONS,
    `${label}.politicalCompetition`,
  );
}

function assertResourceStock(
  stock: Readonly<Record<string, number>>,
  label: string,
): void {
  for (const [resourceType, amount] of Object.entries(stock)) {
    assertNonNegative(amount, `${label}.${resourceType}`);
  }
}

function assertDate(date: SimDate): void {
  if (
    !Number.isInteger(date.year) ||
    !Number.isInteger(date.month) ||
    !Number.isInteger(date.day) ||
    date.month < 1 ||
    date.month > 12 ||
    date.day < 1 ||
    date.day > 30
  ) {
    throw new Error("Simulation date is outside the foundation calendar.");
  }
}

function assertSeedState(seedState: SeedState): void {
  if (
    !Number.isInteger(seedState.seed) ||
    !Number.isInteger(seedState.state) ||
    !Number.isInteger(seedState.calls) ||
    seedState.calls < 0
  ) {
    throw new Error("Seed state is not serializable simulation state.");
  }
}

function assertContactEdgeRuntimeStates(world: WorldState): void {
  for (const [edgeId, runtimeState] of Object.entries(
    world.contactEdgeStates,
  )) {
    if (
      typeof runtimeState !== "object" ||
      runtimeState === null ||
      typeof runtimeState.enabled !== "boolean"
    ) {
      throw new Error(`Contact runtime state ${edgeId} is invalid.`);
    }

    if (
      !Number.isFinite(runtimeState.multiplier) ||
      runtimeState.multiplier < 0
    ) {
      throw new Error(
        `Contact runtime state ${edgeId}.multiplier must be finite and non-negative.`,
      );
    }

    if (
      runtimeState.blockedReason !== undefined &&
      (typeof runtimeState.blockedReason !== "string" ||
        runtimeState.blockedReason.length === 0)
    ) {
      throw new Error(
        `Contact runtime state ${edgeId}.blockedReason must be a non-empty string.`,
      );
    }

    if (
      runtimeState.blockedByCountryId !== undefined &&
      (typeof runtimeState.blockedByCountryId !== "string" ||
        runtimeState.blockedByCountryId.length === 0 ||
        world.countries[runtimeState.blockedByCountryId] === undefined)
    ) {
      throw new Error(
        `Contact runtime state ${edgeId}.blockedByCountryId must reference a known country.`,
      );
    }
  }
}

function assertLandHexRuntimeStates(world: WorldState): void {
  for (const [landHexId, runtimeState] of Object.entries(world.landHexStates)) {
    if (landHexId.length === 0) {
      throw new Error("LandHex runtime state identity must not be empty.");
    }

    if (
      typeof runtimeState !== "object" ||
      runtimeState === null ||
      typeof runtimeState.controller !== "object" ||
      runtimeState.controller === null
    ) {
      throw new Error(`LandHex runtime state ${landHexId} is invalid.`);
    }

    switch (runtimeState.controller.kind) {
      case "country":
        if (world.countries[runtimeState.controller.countryId] === undefined) {
          throw new Error(
            `LandHex ${landHexId} references a missing controller country.`,
          );
        }
        break;
      case "faction":
        if (world.factions[runtimeState.controller.factionId] === undefined) {
          throw new Error(
            `LandHex ${landHexId} references a missing controller faction.`,
          );
        }
        break;
      case "uncontrolled":
        break;
      default:
        throw new Error(`LandHex ${landHexId} has an invalid controller.`);
    }
  }
}

function assertInterventionCommitments(world: WorldState): void {
  for (const [commitmentId, commitment] of Object.entries(
    world.interventionCommitments,
  )) {
    if (commitmentId !== commitment.id) {
      throw new Error(
        `Intervention commitment key ${commitmentId} does not match ${commitment.id}.`,
      );
    }

    if (commitment.interventionId.length === 0) {
      throw new Error(
        `Intervention commitment ${commitment.id} has no definition.`,
      );
    }

    if (world.countries[commitment.countryId] === undefined) {
      throw new Error(
        `Intervention commitment ${commitment.id} references a missing country.`,
      );
    }

    if (commitment.sourceActionId.length === 0) {
      throw new Error(
        `Intervention commitment ${commitment.id} has no source action.`,
      );
    }

    for (const [tick, label] of [
      [commitment.startedTick, "startedTick"],
      [commitment.firstOccupiedTick, "firstOccupiedTick"],
      [commitment.completionTick, "completionTick"],
    ] as const) {
      if (!Number.isInteger(tick) || tick < 0) {
        throw new Error(
          `Intervention commitment ${commitment.id}.${label} is invalid.`,
        );
      }
    }

    if (commitment.firstOccupiedTick < commitment.startedTick) {
      throw new Error(
        `Intervention commitment ${commitment.id} occupies before it starts.`,
      );
    }

    if (commitment.completionTick <= commitment.startedTick) {
      throw new Error(
        `Intervention commitment ${commitment.id} must complete after it starts.`,
      );
    }

    assertNonNegative(
      commitment.administrativeLoad,
      `Intervention commitment ${commitment.id}.administrativeLoad`,
    );

    if (commitment.startedTick > world.tick) {
      throw new Error(
        `Intervention commitment ${commitment.id} starts in the future.`,
      );
    }
  }
}

function assertFactionFundMovementCommitments(world: WorldState): void {
  const activeActorTargets = new Set<string>();

  for (const [commitmentId, commitment] of Object.entries(
    world.factionFundMovementCommitments,
  )) {
    const typedCommitment = commitment as FactionFundMovementCommitment;
    if (commitmentId !== typedCommitment.id) {
      throw new Error(
        `FUND_MOVEMENT commitment key ${commitmentId} does not match ${typedCommitment.id}.`,
      );
    }

    if (
      typedCommitment.id !==
      createDeterministicFactionFundMovementCommitmentId(
        typedCommitment.sourceActionId,
      )
    ) {
      throw new Error(
        `FUND_MOVEMENT commitment ${typedCommitment.id} does not match its source action.`,
      );
    }

    if (world.factions[typedCommitment.factionId] === undefined) {
      throw new Error(
        `FUND_MOVEMENT commitment ${typedCommitment.id} references a missing faction.`,
      );
    }

    const targetRegion = world.regions[typedCommitment.targetRegionId];
    const faction = world.factions[typedCommitment.factionId];
    if (targetRegion === undefined || faction === undefined) {
      throw new Error(
        `FUND_MOVEMENT commitment ${typedCommitment.id} references a missing target.`,
      );
    }
    if (targetRegion.ownerCountryId !== faction.countryId) {
      throw new Error(
        `FUND_MOVEMENT commitment ${typedCommitment.id} crosses its faction country boundary.`,
      );
    }

    assertStringEnum(
      typedCommitment.status,
      FACTION_FUND_MOVEMENT_COMMITMENT_STATUSES,
      `${typedCommitment.id}.status`,
    );
    assertNonNegative(
      typedCommitment.resourceAmount,
      `${typedCommitment.id}.resourceAmount`,
    );
    if (typedCommitment.resourceAmount <= 0) {
      throw new Error(
        `FUND_MOVEMENT commitment ${typedCommitment.id}.resourceAmount must be positive.`,
      );
    }
    if (
      typedCommitment.sourceActionId.length === 0 ||
      !Number.isInteger(typedCommitment.createdAtTick) ||
      typedCommitment.createdAtTick < 0 ||
      typedCommitment.createdAtTick > world.tick
    ) {
      throw new Error(
        `FUND_MOVEMENT commitment ${typedCommitment.id} has invalid creation provenance.`,
      );
    }

    if (typedCommitment.status === "active") {
      if (
        "resolvedAtTick" in typedCommitment ||
        "resolutionReason" in typedCommitment
      ) {
        throw new Error(
          `Active FUND_MOVEMENT commitment ${typedCommitment.id} has resolution provenance.`,
        );
      }
      const actorTarget = `${typedCommitment.factionId}:${typedCommitment.targetRegionId}`;
      if (activeActorTargets.has(actorTarget)) {
        throw new Error(
          `FUND_MOVEMENT commitment ${typedCommitment.id} duplicates an active actor/target pair.`,
        );
      }
      activeActorTargets.add(actorTarget);
    } else {
      assertStringEnum(
        typedCommitment.resolutionReason,
        FACTION_FUND_MOVEMENT_RESOLUTION_REASONS,
        `${typedCommitment.id}.resolutionReason`,
      );
      if (
        !Number.isInteger(typedCommitment.resolvedAtTick) ||
        typedCommitment.resolvedAtTick <= typedCommitment.createdAtTick ||
        typedCommitment.resolvedAtTick > world.tick
      ) {
        throw new Error(
          `Resolved FUND_MOVEMENT commitment ${typedCommitment.id} has invalid resolution provenance.`,
        );
      }
    }
  }
}

function assertPoliticalProposals(world: WorldState): void {
  for (const [proposalId, proposal] of Object.entries(
    world.politicalProposals ?? {},
  )) {
    if (proposalId !== proposal.id) {
      throw new Error(
        `Political proposal key ${proposalId} does not match ${proposal.id}.`,
      );
    }

    assertStringEnum(
      proposal.subjectKind,
      POLITICAL_PROPOSAL_SUBJECT_KINDS,
      `${proposal.id}.subjectKind`,
    );
    assertStringEnum(
      proposal.status,
      POLITICAL_PROPOSAL_STATUSES,
      `${proposal.id}.status`,
    );

    if (world.factions[proposal.proposerFactionId] === undefined) {
      throw new Error(`${proposal.id} references a missing proposer faction.`);
    }
    if (world.countries[proposal.countryId] === undefined) {
      throw new Error(`${proposal.id} references a missing country.`);
    }
    const targetGovernment = world.governments[proposal.targetGovernmentId];
    if (targetGovernment === undefined) {
      throw new Error(`${proposal.id} references a missing target government.`);
    }
    if (targetGovernment.countryId !== proposal.countryId) {
      throw new Error(
        `${proposal.id} target government belongs to another country.`,
      );
    }

    for (const [tick, label] of [
      [proposal.createdAtTick, "createdAtTick"],
      [proposal.resolvedAtTick, "resolvedAtTick"],
    ] as const) {
      if (
        tick !== undefined &&
        (!Number.isInteger(tick) || tick < 0 || tick > world.tick)
      ) {
        throw new Error(`${proposal.id}.${label} is invalid.`);
      }
    }
    if (
      !Number.isInteger(proposal.createdAtTick) ||
      proposal.createdAtTick < 0 ||
      proposal.createdAtTick > world.tick
    ) {
      throw new Error(`${proposal.id}.createdAtTick is invalid.`);
    }
    if (
      proposal.openingActionId.length === 0 ||
      proposal.openingEventId.length === 0
    ) {
      throw new Error(`${proposal.id} must retain opening provenance.`);
    }

    if (proposal.status === "open") {
      if (
        proposal.resolvedAtTick !== undefined ||
        proposal.responseActionId !== undefined ||
        proposal.resolutionReason !== undefined ||
        proposal.reconsiderationBasis !== undefined
      ) {
        throw new Error(`${proposal.id} open status has resolution data.`);
      }
      continue;
    }

    if (
      proposal.resolvedAtTick === undefined ||
      proposal.resolvedAtTick <= proposal.createdAtTick ||
      proposal.responseActionId === undefined ||
      proposal.resolutionReason === undefined
    ) {
      throw new Error(`${proposal.id} resolved status is incomplete.`);
    }
    assertStringEnum(
      proposal.resolutionReason,
      POLITICAL_PROPOSAL_RESOLUTION_REASONS,
      `${proposal.id}.resolutionReason`,
    );
    if (
      proposal.status === "accepted" &&
      proposal.resolutionReason !== "accepted"
    ) {
      throw new Error(`${proposal.id} accepted status has a wrong reason.`);
    }
    if (
      proposal.status === "rejected" &&
      proposal.resolutionReason === "accepted"
    ) {
      throw new Error(`${proposal.id} rejected status has an accepted reason.`);
    }
    if (
      proposal.status === "accepted" &&
      proposal.reconsiderationBasis !== undefined
    ) {
      throw new Error(
        `${proposal.id} accepted status has a reconsideration basis.`,
      );
    }
    if (
      proposal.status === "rejected" &&
      proposal.resolutionReason === "explicitReject"
    ) {
      if (proposal.reconsiderationBasis === undefined) {
        throw new Error(
          `${proposal.id} explicit rejection needs a reconsideration basis.`,
        );
      }
      assertPoliticalProposalReconsiderationBasis(
        proposal.reconsiderationBasis,
        `${proposal.id}.reconsiderationBasis`,
        proposal.targetGovernmentId,
      );
    } else if (proposal.reconsiderationBasis !== undefined) {
      throw new Error(
        `${proposal.id} non-explicit resolution cannot have a reconsideration basis.`,
      );
    }
  }
}

function assertCoupCoordinationResponses(world: WorldState): void {
  for (const [conflictId, responsesByNode] of Object.entries(
    world.coupCoordinationResponses ?? {},
  )) {
    if (conflictId.length === 0) {
      throw new Error(
        "Coup Coordination response map cannot use an empty Conflict ID.",
      );
    }

    for (const [nodeId, response] of Object.entries(responsesByNode)) {
      if (
        nodeId.length === 0 ||
        response.conflictId !== conflictId ||
        response.nodeId !== nodeId ||
        !COUP_COORDINATION_ALIGNMENTS.includes(response.alignment) ||
        response.actionId.length === 0 ||
        response.eventId.length === 0 ||
        !Number.isInteger(response.respondedAtTick) ||
        response.respondedAtTick < 0 ||
        response.respondedAtTick > world.tick
      ) {
        throw new Error(
          `Coup Coordination response ${conflictId}/${nodeId} is invalid.`,
        );
      }
    }
  }
}

function assertRunState(
  world: WorldState,
  options: { readonly validateActionHistory?: boolean } = {},
): void {
  const { run } = world;
  const validateActionHistory = options.validateActionHistory ?? true;

  if (
    !Number.isInteger(run.scenarioVersion) ||
    run.scenarioVersion < 1 ||
    !Number.isInteger(run.simulationVersion) ||
    run.simulationVersion < 1
  ) {
    throw new Error("Run versions must be positive integers.");
  }

  if (
    !Number.isInteger(run.consolidation.consecutiveEligibleTicks) ||
    run.consolidation.consecutiveEligibleTicks < 0
  ) {
    throw new Error("Consolidation progress must be a non-negative integer.");
  }

  const lastEvaluatedTick = run.consolidation.lastEvaluatedTick;
  if (
    lastEvaluatedTick !== null &&
    (!Number.isInteger(lastEvaluatedTick) ||
      lastEvaluatedTick < 0 ||
      lastEvaluatedTick > world.tick)
  ) {
    throw new Error("Consolidation evaluation tick must be within the run.");
  }

  if (validateActionHistory) {
    let expectedActionSequence = 0;
    let previousActionTick = 0;
    const actionIds = new Set<string>();

    for (const action of run.actionLog) {
      if (
        !Number.isInteger(action.tick) ||
        action.tick < 0 ||
        action.tick > world.tick
      ) {
        throw new Error(`Action ${action.id} has an invalid tick.`);
      }

      if (action.tick < previousActionTick) {
        throw new Error(`Action ${action.id} is out of tick order.`);
      }

      if (action.sequence !== expectedActionSequence) {
        throw new Error(`Action ${action.id} is out of global sequence order.`);
      }

      const expectedActionId = createDeterministicActionId(
        action.tick,
        action.sequence,
        action.source,
        action.actionType,
      );
      if (action.id !== expectedActionId) {
        throw new Error(
          `Action ${action.id} does not use its deterministic ID.`,
        );
      }

      if (actionIds.has(action.id)) {
        throw new Error(`Action ${action.id} appears more than once.`);
      }
      actionIds.add(action.id);

      if (!Number.isInteger(action.schemaVersion) || action.schemaVersion < 1) {
        throw new Error(`Action ${action.id} has an invalid schema version.`);
      }

      previousActionTick = action.tick;
      expectedActionSequence += 1;
    }

    if (run.nextActionSequence !== expectedActionSequence) {
      throw new Error(
        "Next action sequence must follow the append-only action log.",
      );
    }
  } else if (
    !Number.isInteger(run.nextActionSequence) ||
    run.nextActionSequence < 0
  ) {
    throw new Error("Next action sequence must be a non-negative integer.");
  }

  if (!Number.isInteger(run.nextEventSequence) || run.nextEventSequence < 0) {
    throw new Error("Next event sequence must be a non-negative integer.");
  }

  if (run.outcome.status !== "active") {
    if (
      !Number.isInteger(run.outcome.atTick) ||
      run.outcome.atTick < 0 ||
      run.outcome.atTick > world.tick
    ) {
      throw new Error("Terminal run outcome must point to a valid tick.");
    }

    if (
      run.outcome.status === "defeated" &&
      world.countries[run.outcome.countryId] === undefined
    ) {
      throw new Error("A dissolution outcome must reference a known country.");
    }
  }
}

export function assertWorldStateInvariants(
  world: WorldState,
  options: { readonly validateActionHistory?: boolean } = {},
): void {
  if (!Number.isInteger(world.tick) || world.tick < 0) {
    throw new Error("World tick must be a non-negative integer.");
  }

  assertDate(world.date);
  assertSeedState(world.rngState);

  if (world.run.seed !== world.rngState.seed) {
    throw new Error("Run seed and RNG seed must agree.");
  }

  assertRunState(world, options);
  assertContactEdgeRuntimeStates(world);
  assertLandHexRuntimeStates(world);

  for (const country of Object.values(world.countries)) {
    assertFiniteNumber(country.treasury, `${country.id}.treasury`);
    assertNonNegative(country.dailyIncome, `${country.id}.dailyIncome`);
    assertNonNegative(
      country.dailyExpenditure,
      `${country.id}.dailyExpenditure`,
    );
    assertIndex(country.legitimacy, `${country.id}.legitimacy`);
    assertIndex(country.stateCapacity, `${country.id}.stateCapacity`);
    assertNonNegative(country.production, `${country.id}.production`);
    assertIndex(country.militaryPower, `${country.id}.militaryPower`);
    assertIndex(country.instability, `${country.id}.instability`);
    assertIndex(country.stateContinuity, `${country.id}.stateContinuity`);

    for (const [targetCountryId, relation] of Object.entries(
      country.diplomacy,
    )) {
      if (world.countries[targetCountryId as CountryId] === undefined) {
        throw new Error(
          `${country.id}.diplomacy references missing country ${targetCountryId}.`,
        );
      }

      assertFiniteNumber(
        relation.opinion,
        `${country.id}.${targetCountryId}.opinion`,
      );
      assertFiniteNumber(
        relation.tradeDependence,
        `${country.id}.${targetCountryId}.tradeDependence`,
      );
      assertFiniteNumber(
        relation.borderThreat,
        `${country.id}.${targetCountryId}.borderThreat`,
      );
      assertFiniteNumber(
        relation.ideologicalThreat,
        `${country.id}.${targetCountryId}.ideologicalThreat`,
      );
    }
  }

  assertInterventionCommitments(world);
  assertFactionFundMovementCommitments(world);
  assertPoliticalProposals(world);
  assertCoupCoordinationResponses(world);

  for (const government of Object.values(world.governments)) {
    if (world.countries[government.countryId] === undefined) {
      throw new Error(`${government.id} references a missing country.`);
    }

    if (
      !Number.isInteger(government.formedAtTick) ||
      government.formedAtTick < 0 ||
      government.formedAtTick > world.tick
    ) {
      throw new Error(`${government.id}.formedAtTick must be within the run.`);
    }

    if (
      government.authority === "central" &&
      world.countries[government.countryId]?.currentGovernmentId !==
        government.id
    ) {
      throw new Error(
        `${government.id} is central but is not the country's current government.`,
      );
    }
  }

  for (const country of Object.values(world.countries)) {
    if (country.currentGovernmentId !== null) {
      const government = world.governments[country.currentGovernmentId];

      if (government === undefined) {
        throw new Error(
          `${country.id} references a missing current government.`,
        );
      }

      if (government.countryId !== country.id) {
        throw new Error(
          `${country.id} current government belongs to another country.`,
        );
      }

      if (government.authority !== "central") {
        throw new Error(`${country.id} current government must be central.`);
      }
    }
  }

  for (const region of Object.values(world.regions)) {
    assertNonNegative(region.population, `${region.id}.population`);
    assertNormalized(region.urbanization, `${region.id}.urbanization`);
    assertNormalized(region.accessibility, `${region.id}.accessibility`);
    assertNonNegative(region.production, `${region.id}.production`);
    assertNormalized(region.stateControl, `${region.id}.stateControl`);
    assertNormalized(region.infrastructure, `${region.id}.infrastructure`);
    assertNormalized(region.scarcity, `${region.id}.scarcity`);
    assertNormalized(region.unrest, `${region.id}.unrest`);

    assertResourceStock(region.resources, `${region.id}.resources`);
    assertResourceStock(
      region.resourceProductionCapacity,
      `${region.id}.resourceProductionCapacity`,
    );
    assertResourceStock(
      region.resourceProduction,
      `${region.id}.resourceProduction`,
    );
    assertResourceStock(region.resourceDemand, `${region.id}.resourceDemand`);

    for (const resourceType of RESOURCE_TYPES) {
      const capacity = region.resourceProductionCapacity[resourceType] ?? 0;
      const actualProduction = region.resourceProduction[resourceType] ?? 0;

      if (actualProduction > capacity) {
        throw new Error(
          `${region.id}.resourceProduction.${resourceType} exceeds capacity.`,
        );
      }
    }

    for (const [ideologyId, ideologyState] of Object.entries(region.ideology)) {
      assertNormalized(ideologyState.support, `${ideologyId}.support`);
      assertNormalized(ideologyState.radicalism, `${ideologyId}.radicalism`);
      assertNormalized(
        ideologyState.organization,
        `${ideologyId}.organization`,
      );
    }

    if (world.countries[region.ownerCountryId] === undefined) {
      throw new Error(`${region.id} references a missing owner country.`);
    }
  }

  for (const country of Object.values(world.countries)) {
    if (country.capitalRegionId !== null) {
      const capital = world.regions[country.capitalRegionId];

      if (capital === undefined) {
        throw new Error(`${country.id} references a missing capital region.`);
      }

      if (capital.ownerCountryId !== country.id) {
        throw new Error(`${country.id} capital must be owned by that country.`);
      }
    }
  }

  for (const faction of Object.values(world.factions)) {
    if (world.countries[faction.countryId] === undefined) {
      throw new Error(`${faction.id} references a missing country.`);
    }

    assertNonNegative(faction.resources, `${faction.id}.resources`);
    assertNormalized(faction.organization, `${faction.id}.organization`);
    assertNormalized(faction.influence, `${faction.id}.influence`);
    assertNormalized(faction.grievance, `${faction.id}.grievance`);

    for (const [ideologyId, affinity] of Object.entries(
      faction.ideologyAffinity,
    )) {
      assertNormalized(affinity, `${faction.id}.${ideologyId}.affinity`);
    }

    for (const [countryId, linkStrength] of Object.entries(
      faction.foreignLinks,
    )) {
      if (world.countries[countryId as CountryId] === undefined) {
        throw new Error(
          `${faction.id}.foreignLinks references missing country ${countryId}.`,
        );
      }
      assertNormalized(linkStrength, `${faction.id}.${countryId}.foreignLink`);
    }
  }

  for (const [countryId, policyState] of Object.entries(world.policies)) {
    if (world.countries[countryId as CountryId] === undefined) {
      throw new Error(`Policy state references missing country ${countryId}.`);
    }

    assertInstitutionalRules(
      policyState.institutionalRules,
      `${countryId}.institutionalRules`,
    );

    const activePolicyIds = new Set<string>();
    for (const policyId of policyState.activePolicyIds) {
      if (activePolicyIds.has(policyId)) {
        throw new Error(
          `${countryId} lists policy ${policyId} more than once.`,
        );
      }

      activePolicyIds.add(policyId);
      const enactedAtTick = policyState.enactedAtTick[policyId];
      if (
        !Number.isInteger(enactedAtTick) ||
        enactedAtTick < 0 ||
        enactedAtTick > world.tick
      ) {
        throw new Error(
          `${countryId}.${policyId} has an invalid enactment tick.`,
        );
      }
    }

    for (const [policyId, enactedAtTick] of Object.entries(
      policyState.enactedAtTick,
    )) {
      if (
        !Number.isInteger(enactedAtTick) ||
        enactedAtTick < 0 ||
        enactedAtTick > world.tick
      ) {
        throw new Error(
          `${countryId}.${policyId} has an invalid enactment tick.`,
        );
      }
    }
  }

  for (const conflict of Object.values(world.conflicts)) {
    if (
      !Number.isInteger(conflict.startedAtTick) ||
      conflict.startedAtTick < 0 ||
      conflict.startedAtTick > world.tick
    ) {
      throw new Error(`${conflict.id}.startedAtTick must be valid.`);
    }

    if (
      conflict.resolvedAtTick !== undefined &&
      (!Number.isInteger(conflict.resolvedAtTick) ||
        conflict.resolvedAtTick < conflict.startedAtTick ||
        conflict.resolvedAtTick > world.tick)
    ) {
      throw new Error(`${conflict.id}.resolvedAtTick must follow its start.`);
    }

    if (
      (conflict.status === "resolved") !==
      (conflict.resolvedAtTick !== undefined)
    ) {
      throw new Error(`${conflict.id} status and resolution tick must agree.`);
    }

    for (const countryId of conflict.participantCountryIds) {
      if (world.countries[countryId] === undefined) {
        throw new Error(
          `${conflict.id} references a missing participant country.`,
        );
      }
    }

    for (const factionId of conflict.participantFactionIds) {
      if (world.factions[factionId] === undefined) {
        throw new Error(
          `${conflict.id} references a missing participant faction.`,
        );
      }
    }

    for (const regionId of conflict.affectedRegionIds ?? []) {
      if (world.regions[regionId] === undefined) {
        throw new Error(`${conflict.id} references a missing affected region.`);
      }
    }

    for (const regionId of conflict.contestedRegionIds) {
      if (world.regions[regionId] === undefined) {
        throw new Error(
          `${conflict.id} references a missing contested region.`,
        );
      }
    }

    if (conflict.outcome !== undefined && conflict.status !== "resolved") {
      throw new Error(
        `${conflict.id} cannot have an outcome before resolution.`,
      );
    }
  }
}

/** Validate a candidate state while the canonical action prefix is trusted. */
export function assertWorldStateInvariantsIncremental(world: WorldState): void {
  assertWorldStateInvariants(world, { validateActionHistory: false });
}
