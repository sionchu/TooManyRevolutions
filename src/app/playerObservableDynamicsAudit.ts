import { derivePresentationState } from "../presentation/presentationState";
import { selectSignificantEvents } from "./gamePresentation";
import {
  deriveNationalAgendas,
  type PrimaryAgenda,
} from "../sim/readModels/agenda";
import { evaluateInterventionFeasibility } from "../sim/state/intervention";
import { evaluatePolicyAvailability } from "../sim/state/policy";
import type { CountryId } from "../sim/state/ids";
import { GAMEBUILDERS_DEMO_SCENARIO } from "../sim/state/gameBuildersDemoScenario";
import { deriveOrderConsolidationEligibility } from "../sim/systems/orderConsolidation";
import {
  advanceDemoRuntime,
  createDemoRuntimeState,
  type DemoRuntimeState,
} from "./demoGame";

export const PLAYER_OBSERVABLE_AUDIT_CHECKPOINTS = [
  0, 30, 90, 180, 360, 720, 1080,
] as const;

export type PlayerObservableClassification =
  | "INTERNAL_CHANGE_NOT_PRESENTED"
  | "PRESENTATION_ONLY_CHANGE"
  | "PLAYER_OBSERVABLE_SYSTEM_CHANGE"
  | "STRUCTURAL_STALL";

export interface PlayerObservableCheckpoint {
  readonly day: number;
  readonly meaningfulEventCount: number;
  readonly meaningfulEventSignature: string;
  readonly agendaSignature: string;
  readonly policyInstitutionSignature: string;
  readonly factionActionSignature: string;
  readonly foreignActionRouteSignature: string;
  readonly ideologySignature: string;
  readonly activeConflictSignature: string;
  readonly activeConflictCount: number;
  readonly landHexControllerSignature: string;
  readonly controllerChanges: number;
  readonly playerControlledLandHexCount: number;
  readonly mapSignature: string;
  readonly availableDecisionSignature: string;
  readonly consolidationSignature: string;
  readonly outcome: string;
  readonly classification: PlayerObservableClassification;
}

export interface PlayerObservableDynamicsAudit {
  readonly checkpoints: readonly PlayerObservableCheckpoint[];
  readonly finalRuntime: DemoRuntimeState;
}

function stableJson(value: unknown): string {
  return JSON.stringify(value);
}

function agendaSignature(agendas: readonly PrimaryAgenda[]): string {
  return stableJson(
    agendas.map((agenda) => ({
      id: agenda.id,
      severity: Math.round(agenda.severity * 1000) / 1000,
      trend: agenda.trend,
      regions: agenda.affectedRegionIds,
      factions: agenda.involvedFactionIds,
    })),
  );
}

function policyInstitutionSignature(state: DemoRuntimeState): string {
  const countryId = GAMEBUILDERS_DEMO_SCENARIO.playerCountryId as CountryId;
  const policy = state.world.policies[countryId];
  return stableJson({
    active: policy?.activePolicyIds ?? [],
    rules: policy?.institutionalRules ?? null,
  });
}

function factionActionSignature(state: DemoRuntimeState): string {
  const countryId = GAMEBUILDERS_DEMO_SCENARIO.playerCountryId as CountryId;
  return stableJson({
    states: Object.values(state.world.factions)
      .filter((faction) => faction.countryId === countryId)
      .sort((first, second) => first.id.localeCompare(second.id))
      .map((faction) => ({
        id: faction.id,
        strategy: faction.currentStrategy,
        grievance: faction.grievance,
        organization: faction.organization,
      })),
    actions: state.world.run.actionLog
      .filter(
        (action) =>
          action.actionType !== "ENACT_POLICY" && action.source !== "player",
      )
      .map((action) => `${action.tick}:${action.source}:${action.actionType}`),
  });
}

function foreignActionRouteSignature(state: DemoRuntimeState): string {
  const presentation = derivePresentationState(
    GAMEBUILDERS_DEMO_SCENARIO,
    state.world,
  );
  return stableJson({
    actions: state.world.run.actionLog
      .filter((action) =>
        [
          "CLOSE_BORDER",
          "REOPEN_BORDER",
          "RESTRICT_INCOMING_BORDER",
          "RESTORE_INCOMING_BORDER",
        ].includes(action.actionType),
      )
      .map((action) => `${action.tick}:${action.actionType}`),
    routes: presentation.contactRoutes.map((route) => ({
      id: route.routeId,
      active: route.active,
      enabled: route.enabled,
      multiplier: route.multiplier,
    })),
  });
}

function ideologySignature(state: DemoRuntimeState): string {
  return stableJson(
    Object.values(state.world.regions)
      .sort((first, second) => first.id.localeCompare(second.id))
      .map((region) => ({
        id: region.id,
        ideology: Object.entries(region.ideology)
          .sort(([first], [second]) => first.localeCompare(second))
          .map(([id, value]) => [
            id,
            Math.round(value.support * 10000) / 10000,
            Math.round(value.radicalism * 10000) / 10000,
            Math.round(value.organization * 10000) / 10000,
          ]),
      })),
  );
}

function conflictSignature(state: DemoRuntimeState): string {
  return stableJson(
    Object.values(state.world.conflicts)
      .filter((conflict) => conflict.status === "active")
      .sort((first, second) => first.id.localeCompare(second.id))
      .map((conflict) => ({
        id: conflict.id,
        kind: conflict.kind,
        affected: conflict.affectedRegionIds ?? [],
        contested: conflict.contestedRegionIds,
      })),
  );
}

function controllerSignature(state: DemoRuntimeState): string {
  return stableJson(
    Object.entries(state.world.landHexStates)
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([landHexId, runtime]) => [landHexId, runtime.controller]),
  );
}

function controllerChangeCount(
  state: DemoRuntimeState,
  previousSignature: string | undefined,
): number {
  if (previousSignature === undefined) return 0;

  const previousEntries = JSON.parse(previousSignature) as readonly (readonly [
    string,
    unknown,
  ])[];
  const previousByLandHex = new Map(previousEntries);

  return Object.entries(state.world.landHexStates).reduce(
    (count, [landHexId, runtime]) =>
      count +
      (JSON.stringify(previousByLandHex.get(landHexId)) ===
      JSON.stringify(runtime.controller)
        ? 0
        : 1),
    0,
  );
}

function mapSignature(state: DemoRuntimeState): string {
  const presentation = derivePresentationState(
    GAMEBUILDERS_DEMO_SCENARIO,
    state.world,
  );
  return stableJson(
    presentation.landHexes.map((hex) => [
      hex.landHexId,
      hex.regionId,
      hex.controller,
    ]),
  );
}

function availableDecisionSignature(state: DemoRuntimeState): string {
  const countryId = GAMEBUILDERS_DEMO_SCENARIO.playerCountryId as CountryId;
  const policyState = state.world.policies[countryId];
  const policies = Object.values(GAMEBUILDERS_DEMO_SCENARIO.policyCatalog)
    .filter(
      (definition) =>
        policyState !== undefined &&
        evaluatePolicyAvailability(
          policyState,
          definition,
          GAMEBUILDERS_DEMO_SCENARIO.policyCatalog,
        ).feasible,
    )
    .map((definition) => definition.id)
    .sort();
  const interventions = Object.values(
    GAMEBUILDERS_DEMO_SCENARIO.interventionCatalog,
  )
    .filter(
      (definition) =>
        evaluateInterventionFeasibility({
          scenario: GAMEBUILDERS_DEMO_SCENARIO,
          world: state.world,
          interventionId: definition.id,
          countryId,
        }).feasible,
    )
    .map((definition) => definition.id)
    .sort();
  return stableJson({ policies, interventions });
}

function meaningfulEventSignature(state: DemoRuntimeState): string {
  return stableJson(
    selectSignificantEvents(state.eventStore.events, 10).map((event) => [
      event.id,
      event.type,
      event.tick,
    ]),
  );
}

function classifyCheckpoint(
  previous: PlayerObservableCheckpoint | undefined,
  current: Omit<PlayerObservableCheckpoint, "classification">,
): PlayerObservableClassification {
  if (previous === undefined) return "PLAYER_OBSERVABLE_SYSTEM_CHANGE";

  const worldChanged = [
    current.agendaSignature !== previous.agendaSignature,
    current.policyInstitutionSignature !== previous.policyInstitutionSignature,
    current.factionActionSignature !== previous.factionActionSignature,
    current.foreignActionRouteSignature !==
      previous.foreignActionRouteSignature,
    current.ideologySignature !== previous.ideologySignature,
    current.activeConflictSignature !== previous.activeConflictSignature,
    current.landHexControllerSignature !== previous.landHexControllerSignature,
    current.playerControlledLandHexCount !==
      previous.playerControlledLandHexCount,
    current.mapSignature !== previous.mapSignature,
    current.availableDecisionSignature !== previous.availableDecisionSignature,
    current.outcome !== previous.outcome,
  ].some(Boolean);
  const visibleChanged =
    current.meaningfulEventCount !== previous.meaningfulEventCount ||
    current.meaningfulEventSignature !== previous.meaningfulEventSignature ||
    current.agendaSignature !== previous.agendaSignature ||
    current.mapSignature !== previous.mapSignature ||
    current.activeConflictSignature !== previous.activeConflictSignature ||
    current.availableDecisionSignature !== previous.availableDecisionSignature;

  if (!worldChanged && !visibleChanged) return "STRUCTURAL_STALL";
  if (worldChanged && !visibleChanged) return "INTERNAL_CHANGE_NOT_PRESENTED";
  if (!worldChanged && visibleChanged) return "PRESENTATION_ONLY_CHANGE";
  return "PLAYER_OBSERVABLE_SYSTEM_CHANGE";
}

function deriveCheckpoint(
  state: DemoRuntimeState,
  previous: PlayerObservableCheckpoint | undefined,
): PlayerObservableCheckpoint {
  const presentation = derivePresentationState(
    GAMEBUILDERS_DEMO_SCENARIO,
    state.world,
  );
  const agendas = deriveNationalAgendas({
    scenario: GAMEBUILDERS_DEMO_SCENARIO,
    world: state.world,
    recentEvents: state.eventStore.events,
  });
  const conflicts = presentation.activeConflicts;
  const raw = {
    day: state.world.tick,
    meaningfulEventCount: selectSignificantEvents(
      state.eventStore.events,
      Number.MAX_SAFE_INTEGER,
    ).length,
    meaningfulEventSignature: meaningfulEventSignature(state),
    agendaSignature: agendaSignature(agendas),
    policyInstitutionSignature: policyInstitutionSignature(state),
    factionActionSignature: factionActionSignature(state),
    foreignActionRouteSignature: foreignActionRouteSignature(state),
    ideologySignature: ideologySignature(state),
    activeConflictSignature: conflictSignature(state),
    activeConflictCount: conflicts.length,
    landHexControllerSignature: controllerSignature(state),
    controllerChanges: controllerChangeCount(
      state,
      previous?.landHexControllerSignature,
    ),
    playerControlledLandHexCount: presentation.landHexes.filter(
      (hex) =>
        hex.controller.kind === "country" &&
        hex.controller.countryId === GAMEBUILDERS_DEMO_SCENARIO.playerCountryId,
    ).length,
    mapSignature: mapSignature(state),
    availableDecisionSignature: availableDecisionSignature(state),
    consolidationSignature: stableJson(
      deriveOrderConsolidationEligibility(
        GAMEBUILDERS_DEMO_SCENARIO,
        state.world,
      ),
    ),
    outcome: state.world.run.outcome.status,
  } as const;

  return { ...raw, classification: classifyCheckpoint(previous, raw) };
}

/** Run the unmodified demo rules at deterministic observable checkpoints. */
export function runPlayerObservableDynamicsAudit(): PlayerObservableDynamicsAudit {
  let runtime = createDemoRuntimeState();
  let previous: PlayerObservableCheckpoint | undefined;
  const checkpoints: PlayerObservableCheckpoint[] = [];

  for (const day of PLAYER_OBSERVABLE_AUDIT_CHECKPOINTS) {
    runtime = advanceDemoRuntime(runtime, day - runtime.world.tick);
    const checkpoint = deriveCheckpoint(runtime, previous);
    checkpoints.push(checkpoint);
    previous = checkpoint;
  }

  return { checkpoints, finalRuntime: runtime };
}
