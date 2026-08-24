import {
  createDeterministicActionId,
  decodeFactionAction,
  decodeTargetedFactionFundMovementAction,
  decodeRespondPoliticalProposalAction,
  decodeStartInterventionAction,
  RESPOND_POLITICAL_PROPOSAL_ACTION_TYPE,
  START_INTERVENTION_ACTION_TYPE,
  type ActionRecord,
  type ValidatedActionRecord,
} from "../state/action";
import type { ConflictOutcome, ConflictWinner } from "../state/conflict";
import {
  createDeterministicInterventionCommitmentId,
  assertScenarioInterventionCatalog,
} from "../state/intervention";
import { asContactEdgeId, asGovernmentId, type CountryId } from "../state/ids";
import {
  createDeterministicFactionFundMovementCommitmentId,
  type FactionFundMovementCommitment,
} from "../state/factionFundMovement";
import type { PolicyState } from "../state/policy";
import type { InterventionCommitment } from "../state/intervention";
import {
  assertScenarioDefinition,
  type ScenarioDefinition,
} from "../state/scenario";
import { assertLandHexRuntimeStateInvariants } from "../state/territorialControl";
import type { WorldState } from "../state/world";
import {
  assertWorldStateInvariants,
  assertWorldStateInvariantsIncremental,
} from "./invariants";

type IdentityRecord = Readonly<Record<string, unknown>>;
type IdentifiedValue = { readonly id: string };

function assertExactIdentitySet(
  label: string,
  requiredIds: readonly string[],
  runtimeRecord: IdentityRecord,
): void {
  const requiredSet = new Set(requiredIds);
  if (requiredSet.size !== requiredIds.length) {
    throw new Error(`${label} contains duplicate required identities.`);
  }

  for (const requiredId of requiredSet) {
    if (!Object.prototype.hasOwnProperty.call(runtimeRecord, requiredId)) {
      throw new Error(`${label} is missing runtime identity ${requiredId}.`);
    }
  }

  for (const runtimeId of Object.keys(runtimeRecord)) {
    if (!requiredSet.has(runtimeId)) {
      throw new Error(
        `${label} contains unknown runtime identity ${runtimeId}.`,
      );
    }
  }
}

function assertRecordIdentityKeys(
  label: string,
  record: Readonly<Record<string, IdentifiedValue>>,
): void {
  for (const [key, value] of Object.entries(record)) {
    if (key !== value.id) {
      throw new Error(`${label} key ${key} does not match ${value.id}.`);
    }
  }
}

function assertCatalogIdentityKeys(
  label: string,
  catalog: Readonly<Record<string, IdentifiedValue>>,
): void {
  assertRecordIdentityKeys(label, catalog);
}

export function assertScenarioIdeologyCoverage(
  scenario: ScenarioDefinition,
): void {
  assertCatalogIdentityKeys(
    "Scenario ideology catalog",
    scenario.ideologyCatalog,
  );
  const ideologyIds = Object.keys(scenario.ideologyCatalog);

  for (const region of scenario.initialRegions) {
    for (const ideologyId of ideologyIds) {
      if (!Object.prototype.hasOwnProperty.call(region.ideology, ideologyId)) {
        throw new Error(
          `Initial Region ${region.id} is missing ideology state ${ideologyId}.`,
        );
      }
    }

    assertExactIdentitySet(
      `Initial Region ${region.id} ideology state`,
      ideologyIds,
      region.ideology,
    );
  }
}

function assertRegionIdeologyRuntimeCoverage(
  scenario: ScenarioDefinition,
  world: WorldState,
): void {
  const ideologyIds = Object.keys(scenario.ideologyCatalog);

  for (const region of Object.values(world.regions)) {
    for (const ideologyId of ideologyIds) {
      if (!Object.prototype.hasOwnProperty.call(region.ideology, ideologyId)) {
        throw new Error(
          `Runtime Region ${region.id} is missing ideology state ${ideologyId}.`,
        );
      }
    }

    assertExactIdentitySet(
      `Runtime Region ${region.id} ideology state`,
      ideologyIds,
      region.ideology,
    );
  }
}

function assertPolicyRuntimeCoverage(
  scenario: ScenarioDefinition,
  world: WorldState,
  countryIds: readonly CountryId[],
): void {
  assertExactIdentitySet(
    "ScenarioDefinition.initialCountryPolicies",
    countryIds,
    scenario.initialCountryPolicies,
  );
  assertExactIdentitySet("WorldState.policies", countryIds, world.policies);

  assertCatalogIdentityKeys("Scenario policy catalog", scenario.policyCatalog);
  const policyIds = new Set(Object.keys(scenario.policyCatalog));

  for (const [countryId, policyState] of Object.entries(world.policies)) {
    assertPolicyStateCatalogMembership(countryId, policyState, policyIds);
  }
}

function assertPolicyStateCatalogMembership(
  countryId: string,
  policyState: PolicyState,
  policyIds: ReadonlySet<string>,
): void {
  const activeIds = new Set<string>();

  for (const policyId of policyState.activePolicyIds) {
    if (!policyIds.has(policyId)) {
      throw new Error(
        `Policy state ${countryId} references unknown policy ${policyId}.`,
      );
    }

    if (activeIds.has(policyId)) {
      throw new Error(
        `Policy state ${countryId} repeats active policy ${policyId}.`,
      );
    }

    activeIds.add(policyId);
    if (
      !Object.prototype.hasOwnProperty.call(policyState.enactedAtTick, policyId)
    ) {
      throw new Error(
        `Policy state ${countryId} is missing enactment tick for ${policyId}.`,
      );
    }
  }

  for (const policyId of Object.keys(policyState.enactedAtTick)) {
    if (!policyIds.has(policyId)) {
      throw new Error(
        `Policy state ${countryId} records unknown policy ${policyId}.`,
      );
    }

    if (!activeIds.has(policyId)) {
      throw new Error(
        `Policy state ${countryId} records inactive policy ${policyId}.`,
      );
    }
  }
}

function assertWinnerReference(
  world: WorldState,
  winner: ConflictWinner,
  label: string,
): void {
  if (
    winner.kind === "country" &&
    world.countries[winner.countryId] === undefined
  ) {
    throw new Error(`${label} references missing country ${winner.countryId}.`);
  }

  if (
    winner.kind === "faction" &&
    world.factions[winner.factionId] === undefined
  ) {
    throw new Error(`${label} references missing faction ${winner.factionId}.`);
  }
}

function assertGovernmentReference(
  world: WorldState,
  governmentId: string,
  label: string,
  expectedCountryId?: CountryId,
): void {
  const government = world.governments[asGovernmentId(governmentId)];
  if (government === undefined) {
    throw new Error(`${label} references missing government ${governmentId}.`);
  }

  if (
    expectedCountryId !== undefined &&
    government.countryId !== expectedCountryId
  ) {
    throw new Error(
      `${label} government ${governmentId} belongs to another country.`,
    );
  }
}

function assertConflictOutcomeReferences(world: WorldState): void {
  for (const conflict of Object.values(world.conflicts)) {
    const outcome: ConflictOutcome | undefined = conflict.outcome;
    if (outcome === undefined) {
      continue;
    }

    switch (outcome.kind) {
      case "statusQuo":
        if (outcome.winner !== undefined) {
          assertWinnerReference(world, outcome.winner, `${conflict.id}.winner`);
        }
        break;
      case "governmentTransition":
        if (world.countries[outcome.countryId] === undefined) {
          throw new Error(
            `${conflict.id}.outcome references missing country ${outcome.countryId}.`,
          );
        }

        if (outcome.previousGovernmentId !== null) {
          assertGovernmentReference(
            world,
            outcome.previousGovernmentId,
            `${conflict.id}.previousGovernmentId`,
            outcome.countryId,
          );
        }

        assertGovernmentReference(
          world,
          outcome.nextGovernmentId,
          `${conflict.id}.nextGovernmentId`,
          outcome.countryId,
        );
        assertWinnerReference(world, outcome.winner, `${conflict.id}.winner`);
        break;
      case "stateDissolved":
        if (world.countries[outcome.countryId] === undefined) {
          throw new Error(
            `${conflict.id}.outcome references missing country ${outcome.countryId}.`,
          );
        }

        if (outcome.winner !== undefined) {
          assertWinnerReference(world, outcome.winner, `${conflict.id}.winner`);
        }
        break;
    }
  }
}

function assertFactionCatalogReferences(
  scenario: ScenarioDefinition,
  world: WorldState,
): void {
  const ideologyIds = new Set(Object.keys(scenario.ideologyCatalog));

  for (const faction of Object.values(world.factions)) {
    for (const ideologyId of Object.keys(faction.ideologyAffinity)) {
      if (!ideologyIds.has(ideologyId)) {
        throw new Error(
          `Faction ${faction.id} references unknown ideology ${ideologyId}.`,
        );
      }
    }
  }
}

function assertContactRuntimeCoverage(
  scenario: ScenarioDefinition,
  world: WorldState,
): void {
  const edgeIds = new Set(
    scenario.mapContactTopology.contactEdges.map((edge) => edge.id),
  );

  for (const edgeId of Object.keys(world.contactEdgeStates)) {
    if (!edgeIds.has(asContactEdgeId(edgeId))) {
      throw new Error(
        `Contact runtime state references unknown edge ${edgeId}.`,
      );
    }
  }
}

function assertActionCommitmentProvenance(
  scenario: ScenarioDefinition,
  world: WorldState,
  commitments: readonly InterventionCommitment[] = Object.values(
    world.interventionCommitments,
  ),
): void {
  const actionsById = new Map<string, ActionRecord>();
  for (const action of world.run.actionLog) {
    actionsById.set(action.id, action);
  }

  const interventionIds = new Set(Object.keys(scenario.interventionCatalog));

  for (const commitment of commitments) {
    if (!interventionIds.has(commitment.interventionId)) {
      throw new Error(
        `Intervention commitment ${commitment.id} references unknown intervention ${commitment.interventionId}.`,
      );
    }

    if (
      commitment.id !==
      createDeterministicInterventionCommitmentId(commitment.sourceActionId)
    ) {
      throw new Error(
        `Intervention commitment ${commitment.id} does not match its source action.`,
      );
    }

    const sourceAction = actionsById.get(commitment.sourceActionId);
    if (sourceAction === undefined) {
      throw new Error(
        `Intervention commitment ${commitment.id} references missing source action ${commitment.sourceActionId}.`,
      );
    }

    if (sourceAction.validationOutcome.kind !== "accepted") {
      throw new Error(
        `Intervention commitment ${commitment.id} references a rejected source action.`,
      );
    }

    const startAction = sourceAction as ValidatedActionRecord;
    if (startAction.actionType === START_INTERVENTION_ACTION_TYPE) {
      const payload = decodeStartInterventionAction(startAction);
      if (payload === null) {
        throw new Error(
          `Intervention commitment ${commitment.id} has an invalid source action payload.`,
        );
      }

      const sourceCountryId = payload.countryId ?? scenario.playerCountryId;
      if (sourceCountryId === null || sourceCountryId === undefined) {
        throw new Error(
          `Intervention commitment ${commitment.id} cannot resolve its source country.`,
        );
      }

      if (sourceCountryId !== commitment.countryId) {
        throw new Error(
          `Intervention commitment ${commitment.id} source country does not match the commitment.`,
        );
      }

      if (sourceAction.tick !== commitment.startedTick) {
        throw new Error(
          `Intervention commitment ${commitment.id} does not start on its source action tick.`,
        );
      }

      if (payload.interventionId !== commitment.interventionId) {
        throw new Error(
          `Intervention commitment ${commitment.id} does not match its source intervention.`,
        );
      }
      continue;
    }

    if (startAction.actionType !== RESPOND_POLITICAL_PROPOSAL_ACTION_TYPE) {
      throw new Error(
        `Intervention commitment ${commitment.id} has a non-intervention source action.`,
      );
    }

    const response = decodeRespondPoliticalProposalAction(startAction);
    const proposal =
      response === null
        ? undefined
        : world.politicalProposals?.[response.proposalId];
    if (
      response === null ||
      proposal === undefined ||
      response.response !== "accept" ||
      proposal.status !== "accepted" ||
      proposal.responseActionId !== sourceAction.id ||
      proposal.resolvedAtTick !== sourceAction.tick ||
      proposal.interventionId !== commitment.interventionId ||
      proposal.countryId !== commitment.countryId
    ) {
      throw new Error(
        `Intervention commitment ${commitment.id} has invalid proposal response provenance.`,
      );
    }

    if (sourceAction.tick !== commitment.startedTick) {
      throw new Error(
        `Intervention commitment ${commitment.id} does not start on its source action tick.`,
      );
    }
  }
}

function assertFactionFundMovementCommitmentProvenance(
  scenario: ScenarioDefinition,
  world: WorldState,
  commitments: readonly FactionFundMovementCommitment[] = Object.values(
    world.factionFundMovementCommitments,
  ),
): void {
  const actionsById = new Map<string, ActionRecord>();
  for (const action of world.run.actionLog) {
    actionsById.set(action.id, action);
  }

  for (const commitment of commitments) {
    const sourceAction = actionsById.get(commitment.sourceActionId);
    const template = scenario.factionFundMovementTemplates?.find(
      (candidate) => candidate.factionId === commitment.factionId,
    );
    const payload =
      sourceAction?.validationOutcome.kind === "accepted" &&
      sourceAction.actionType === "FUND_MOVEMENT"
        ? decodeTargetedFactionFundMovementAction(
            sourceAction as ValidatedActionRecord,
          )
        : null;
    const faction = world.factions[commitment.factionId];
    const region = world.regions[commitment.targetRegionId];

    if (
      commitment.id !==
        createDeterministicFactionFundMovementCommitmentId(
          commitment.sourceActionId,
        ) ||
      sourceAction === undefined ||
      sourceAction.validationOutcome.kind !== "accepted" ||
      sourceAction.actionType !== "FUND_MOVEMENT" ||
      payload === null ||
      template === undefined ||
      faction === undefined ||
      region === undefined ||
      faction.countryId !== region.ownerCountryId ||
      payload.factionId !== commitment.factionId ||
      payload.targetRegionId !== commitment.targetRegionId ||
      payload.resourceAmount !== commitment.resourceAmount ||
      template.targetRegionId !== commitment.targetRegionId ||
      template.resourceAmount !== commitment.resourceAmount ||
      sourceAction.tick !== commitment.createdAtTick
    ) {
      throw new Error(
        `FUND_MOVEMENT commitment ${commitment.id} has invalid source provenance.`,
      );
    }
  }
}

function assertPoliticalProposalProvenance(
  scenario: ScenarioDefinition,
  world: WorldState,
): void {
  const actionsById = new Map<string, ActionRecord>();
  for (const action of world.run.actionLog) {
    actionsById.set(action.id, action);
  }

  const templates = scenario.factionProposalTemplates ?? [];
  const proposals = world.politicalProposals ?? {};
  for (const proposal of Object.values(proposals)) {
    const faction = world.factions[proposal.proposerFactionId];
    if (faction === undefined || faction.countryId !== proposal.countryId) {
      throw new Error(
        `Political proposal ${proposal.id} has invalid faction/country provenance.`,
      );
    }

    const template = templates.find(
      (candidate) =>
        candidate.factionId === proposal.proposerFactionId &&
        candidate.triggerAction === "LOBBY" &&
        candidate.interventionId === proposal.interventionId,
    );
    if (template === undefined) {
      throw new Error(
        `Political proposal ${proposal.id} has no authored LOBBY template.`,
      );
    }

    const openingAction = actionsById.get(proposal.openingActionId);
    if (
      openingAction === undefined ||
      openingAction.validationOutcome.kind !== "accepted" ||
      openingAction.actionType !== "LOBBY" ||
      openingAction.tick !== proposal.createdAtTick
    ) {
      throw new Error(
        `Political proposal ${proposal.id} has invalid opening action provenance.`,
      );
    }
    const openingPayload = decodeFactionAction(
      openingAction as ValidatedActionRecord,
    );
    if (openingPayload?.factionId !== proposal.proposerFactionId) {
      throw new Error(
        `Political proposal ${proposal.id} opening faction does not match.`,
      );
    }

    if (proposal.status === "open") {
      continue;
    }

    if (
      proposal.resolutionReason === "explicitReject" &&
      (proposal.reconsiderationBasis === undefined ||
        proposal.reconsiderationBasis.targetGovernmentId !==
          proposal.targetGovernmentId)
    ) {
      throw new Error(
        `Political proposal ${proposal.id} explicit rejection basis is incomplete.`,
      );
    }
    if (
      proposal.resolutionReason !== "explicitReject" &&
      proposal.reconsiderationBasis !== undefined
    ) {
      throw new Error(
        `Political proposal ${proposal.id} has a basis on a non-explicit resolution.`,
      );
    }

    const responseAction =
      proposal.responseActionId === undefined
        ? undefined
        : actionsById.get(proposal.responseActionId);
    const response =
      responseAction === undefined ||
      responseAction.validationOutcome.kind !== "accepted"
        ? null
        : decodeRespondPoliticalProposalAction(
            responseAction as ValidatedActionRecord,
          );
    if (
      responseAction === undefined ||
      responseAction.source !== "player" ||
      responseAction.tick !== proposal.resolvedAtTick ||
      response === null ||
      response.proposalId !== proposal.id
    ) {
      throw new Error(
        `Political proposal ${proposal.id} has invalid response provenance.`,
      );
    }
    if (
      proposal.status === "accepted" &&
      (response.response !== "accept" ||
        proposal.resolutionReason !== "accepted")
    ) {
      throw new Error(
        `Political proposal ${proposal.id} accepted status is not backed by ACCEPT.`,
      );
    }
    if (
      proposal.status === "rejected" &&
      proposal.resolutionReason === "explicitReject" &&
      response.response !== "reject"
    ) {
      throw new Error(
        `Political proposal ${proposal.id} explicit rejection is not backed by REJECT.`,
      );
    }
  }
}

/** Validate only the append-only ActionRecord suffix at a trusted step. */
export function assertActionRecordDelta(
  previousWorld: WorldState,
  nextWorld: WorldState,
): void {
  const previousActions = previousWorld.run.actionLog;
  const nextActions = nextWorld.run.actionLog;

  if (nextActions.length < previousActions.length) {
    throw new Error("Action history cannot remove canonical records.");
  }

  for (const [index, previousAction] of previousActions.entries()) {
    const nextAction = nextActions[index];
    if (nextAction !== previousAction || nextAction.id !== previousAction.id) {
      throw new Error("Action history canonical prefix changed.");
    }
  }

  let expectedSequence = previousWorld.run.nextActionSequence;
  let previousActionTick = previousActions.at(-1)?.tick ?? 0;

  for (const action of nextActions.slice(previousActions.length)) {
    if (action.validationOutcome.kind !== "accepted") {
      throw new Error(
        `Incremental commit received a non-accepted new action ${action.id}.`,
      );
    }

    if (action.sequence !== expectedSequence) {
      throw new Error(`Action ${action.id} is out of global sequence order.`);
    }

    if (
      !Number.isInteger(action.tick) ||
      action.tick < previousActionTick ||
      action.tick > nextWorld.tick
    ) {
      throw new Error(`Action ${action.id} has an invalid tick.`);
    }

    const expectedActionId = createDeterministicActionId(
      action.tick,
      action.sequence,
      action.source,
      action.actionType,
    );
    if (action.id !== expectedActionId) {
      throw new Error(`Action ${action.id} does not use its deterministic ID.`);
    }

    if (!Number.isInteger(action.schemaVersion) || action.schemaVersion < 1) {
      throw new Error(`Action ${action.id} has an invalid schema version.`);
    }

    previousActionTick = action.tick;
    expectedSequence += 1;
  }

  if (nextWorld.run.nextActionSequence !== expectedSequence) {
    throw new Error(
      "Next action sequence must follow the incremental action delta.",
    );
  }
}

/** Validate provenance only for newly created or changed commitments. */
export function assertInterventionCommitmentDelta(
  scenario: ScenarioDefinition,
  previousWorld: WorldState,
  nextWorld: WorldState,
): void {
  const changedCommitments = Object.values(
    nextWorld.interventionCommitments,
  ).filter(
    (commitment) =>
      previousWorld.interventionCommitments[commitment.id] !== commitment,
  );

  if (changedCommitments.length > 0) {
    assertActionCommitmentProvenance(scenario, nextWorld, changedCommitments);
  }
}

/** Validate provenance only for newly created or changed FUND_MOVEMENT commitments. */
export function assertFactionFundMovementCommitmentDelta(
  scenario: ScenarioDefinition,
  previousWorld: WorldState,
  nextWorld: WorldState,
): void {
  const changedCommitments = Object.values(
    nextWorld.factionFundMovementCommitments,
  ).filter(
    (commitment) =>
      previousWorld.factionFundMovementCommitments[commitment.id] !==
      commitment,
  );

  if (changedCommitments.length > 0) {
    assertFactionFundMovementCommitmentProvenance(
      scenario,
      nextWorld,
      changedCommitments,
    );
  }
}

/**
 * Validate the complete V1 ScenarioDefinition/WorldState runtime closure.
 * V1 has no runtime Country/Region/Faction identity lifecycle, while
 * conflicts, governments, and intervention commitments may evolve within
 * the existing runtime model.
 */
export function assertScenarioRuntimeClosure(
  scenario: ScenarioDefinition,
  world: WorldState,
): void {
  assertWorldStateInvariants(world);
  assertScenarioDefinition(scenario);
  assertScenarioInterventionCatalog(scenario);

  if (
    world.run.scenarioId !== scenario.id ||
    world.run.scenarioVersion !== scenario.version
  ) {
    throw new Error("Scenario does not match the WorldState runtime identity.");
  }

  assertScenarioIdeologyCoverage(scenario);
  assertCatalogIdentityKeys(
    "Scenario intervention catalog",
    scenario.interventionCatalog,
  );

  const countryIds = scenario.initialCountries.map((country) => country.id);
  const regionIds = scenario.initialRegions.map((region) => region.id);
  const factionIds = scenario.initialFactions.map((faction) => faction.id);

  assertExactIdentitySet("WorldState.countries", countryIds, world.countries);
  assertExactIdentitySet("WorldState.regions", regionIds, world.regions);
  assertExactIdentitySet("WorldState.factions", factionIds, world.factions);
  assertRecordIdentityKeys("WorldState.countries", world.countries);
  assertRecordIdentityKeys("WorldState.regions", world.regions);
  assertRecordIdentityKeys("WorldState.factions", world.factions);
  assertRecordIdentityKeys("WorldState.governments", world.governments);
  assertRecordIdentityKeys("WorldState.conflicts", world.conflicts);
  assertRecordIdentityKeys(
    "WorldState.interventionCommitments",
    world.interventionCommitments,
  );
  assertRecordIdentityKeys(
    "WorldState.factionFundMovementCommitments",
    world.factionFundMovementCommitments,
  );
  assertRecordIdentityKeys(
    "WorldState.politicalProposals",
    world.politicalProposals ?? {},
  );

  assertPolicyRuntimeCoverage(scenario, world, countryIds);
  assertRegionIdeologyRuntimeCoverage(scenario, world);
  assertFactionCatalogReferences(scenario, world);
  assertContactRuntimeCoverage(scenario, world);

  for (const landHex of scenario.mapTerritorialTopology.landHexes) {
    if (world.regions[landHex.regionId] === undefined) {
      throw new Error(
        `LandHex ${landHex.id} references missing runtime Region ${landHex.regionId}.`,
      );
    }
  }

  assertLandHexRuntimeStateInvariants(scenario, world);
  assertActionCommitmentProvenance(scenario, world);
  assertFactionFundMovementCommitmentProvenance(scenario, world);
  assertPoliticalProposalProvenance(scenario, world);
  assertConflictOutcomeReferences(world);
}

/**
 * Canonical continuation closure. Static scenario content and the prior
 * action/event history are trusted from the validated in-process boundary;
 * runtime identity, state invariants, new actions, and changed commitments
 * are still checked against the candidate next WorldState.
 */
export function assertScenarioRuntimeClosureIncremental(
  scenario: ScenarioDefinition,
  previousWorld: WorldState,
  nextWorld: WorldState,
): void {
  assertWorldStateInvariantsIncremental(nextWorld);

  if (
    nextWorld.run.scenarioId !== scenario.id ||
    nextWorld.run.scenarioVersion !== scenario.version
  ) {
    throw new Error("Scenario does not match the WorldState runtime identity.");
  }

  const countryIds = scenario.initialCountries.map((country) => country.id);
  const regionIds = scenario.initialRegions.map((region) => region.id);
  const factionIds = scenario.initialFactions.map((faction) => faction.id);

  assertExactIdentitySet(
    "WorldState.countries",
    countryIds,
    nextWorld.countries,
  );
  assertExactIdentitySet("WorldState.regions", regionIds, nextWorld.regions);
  assertExactIdentitySet("WorldState.factions", factionIds, nextWorld.factions);
  assertRecordIdentityKeys("WorldState.countries", nextWorld.countries);
  assertRecordIdentityKeys("WorldState.regions", nextWorld.regions);
  assertRecordIdentityKeys("WorldState.factions", nextWorld.factions);
  assertRecordIdentityKeys("WorldState.governments", nextWorld.governments);
  assertRecordIdentityKeys("WorldState.conflicts", nextWorld.conflicts);
  assertRecordIdentityKeys(
    "WorldState.interventionCommitments",
    nextWorld.interventionCommitments,
  );
  assertRecordIdentityKeys(
    "WorldState.factionFundMovementCommitments",
    nextWorld.factionFundMovementCommitments,
  );
  assertRecordIdentityKeys(
    "WorldState.politicalProposals",
    nextWorld.politicalProposals ?? {},
  );

  assertPolicyRuntimeCoverage(scenario, nextWorld, countryIds);
  assertRegionIdeologyRuntimeCoverage(scenario, nextWorld);
  assertFactionCatalogReferences(scenario, nextWorld);
  assertContactRuntimeCoverage(scenario, nextWorld);

  for (const landHex of scenario.mapTerritorialTopology.landHexes) {
    if (nextWorld.regions[landHex.regionId] === undefined) {
      throw new Error(
        `LandHex ${landHex.id} references missing runtime Region ${landHex.regionId}.`,
      );
    }
  }

  assertLandHexRuntimeStateInvariants(scenario, nextWorld);
  assertActionRecordDelta(previousWorld, nextWorld);
  assertInterventionCommitmentDelta(scenario, previousWorld, nextWorld);
  assertFactionFundMovementCommitmentDelta(scenario, previousWorld, nextWorld);
  assertPoliticalProposalProvenance(scenario, nextWorld);
  assertConflictOutcomeReferences(nextWorld);
}
