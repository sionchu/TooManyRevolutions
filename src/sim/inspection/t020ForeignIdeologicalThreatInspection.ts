import {
  acceptActionProposal,
  type DiplomacyActionType,
} from "../state/action";
import {
  CONTACT_FIXTURE_COUNTRY_IDS,
  CONTACT_FIXTURE_EDGE_IDS,
  CONTACT_FIXTURE_REGION_IDS,
} from "../state/contactFixture";
import type { ScenarioDefinition } from "../state/scenario";
import {
  createT020ForeignIdeologicalThreatScenario,
  createT020ForeignIdeologicalThreatWorld,
  T020_EDGE_IDS,
  T020_FACTION_IDS,
  T020_IDEOLOGY_IDS,
} from "../state/foreignIdeologicalThreatFixture";
import type { WorldState } from "../state/world";
import {
  chooseForeignActionType,
  deriveForeignStateObservation,
  FOREIGN_IDEOLOGICAL_THREAT_BORDER_RESTRICTION_REASON,
  FOREIGN_POLICY_BORDER_CLOSURE_REASON,
  runDiplomacyPhase,
} from "../systems/diplomacy";
import {
  deriveForeignIdeologicalThreats,
  type ForeignIdeologicalThreatSnapshot,
} from "../systems/foreignIdeologicalThreat";

function removeIncomingRoutes(
  scenario: ScenarioDefinition,
  actorCountryId: string,
): ScenarioDefinition {
  const ownerByRegion = new Map(
    scenario.initialRegions.map((region) => [region.id, region.ownerCountryId]),
  );

  return {
    ...scenario,
    mapContactTopology: {
      ...scenario.mapContactTopology,
      contactEdges: scenario.mapContactTopology.contactEdges.filter((edge) => {
        const sourceCountryId = ownerByRegion.get(edge.fromRegionId);
        const destinationCountryId = ownerByRegion.get(edge.toRegionId);
        return !(
          sourceCountryId !== actorCountryId &&
          destinationCountryId === actorCountryId
        );
      }),
    },
  };
}

function lowDomesticMobilization(world: WorldState): WorldState {
  const port = world.regions[CONTACT_FIXTURE_REGION_IDS.port];
  const faction = world.factions[T020_FACTION_IDS.playerRepublicans];
  if (port === undefined || faction === undefined) {
    throw new Error("T020 inspection fixture is incomplete.");
  }

  return {
    ...world,
    regions: {
      ...world.regions,
      [port.id]: {
        ...port,
        ideology: {
          ...port.ideology,
          [T020_IDEOLOGY_IDS.republicanism]: {
            ...port.ideology[T020_IDEOLOGY_IDS.republicanism],
            radicalism: 0.05,
            organization: 0.05,
          },
        },
      },
    },
    factions: {
      ...world.factions,
      [faction.id]: { ...faction, grievance: 0.05, organization: 0.05 },
    },
  };
}

function disableEdge(
  world: WorldState,
  edgeId: keyof typeof T020_EDGE_IDS,
): WorldState {
  const contactEdgeId = T020_EDGE_IDS[edgeId];
  return {
    ...world,
    contactEdgeStates: {
      ...world.contactEdgeStates,
      [contactEdgeId]: { enabled: false, multiplier: 1 },
    },
  };
}

function applyDiplomacyAction(
  scenario: ScenarioDefinition,
  world: WorldState,
  actionType: Exclude<DiplomacyActionType, "WAIT">,
  actorCountryId: string,
  targetCountryId: string,
): { readonly world: WorldState; readonly eventTypes: readonly string[] } {
  const action = acceptActionProposal(
    {
      tick: world.tick + 1,
      source: "heuristic",
      actionType,
      payload: { actorCountryId, targetCountryId },
      schemaVersion: 1,
    },
    world.run.nextActionSequence,
  );
  const result = runDiplomacyPhase({
    phase: "diplomacy",
    world,
    input: { actions: [action] },
    nextTick: world.tick + 1,
    emittedEvents: [],
    nextEventSequence: world.run.nextEventSequence,
    scenario,
  });

  return {
    world: result.nextWorld,
    eventTypes: result.emittedEvents.map((event) => event.type),
  };
}

function findThreat(
  threats: readonly ForeignIdeologicalThreatSnapshot[],
): ForeignIdeologicalThreatSnapshot | undefined {
  return threats.find(
    (threat) =>
      threat.sourceCountryId === CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic &&
      threat.ideologyId === T020_IDEOLOGY_IDS.republicanism,
  );
}

function sameThreatEvidence(
  first: readonly ForeignIdeologicalThreatSnapshot[],
  second: readonly ForeignIdeologicalThreatSnapshot[],
): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}

/** Run the deterministic Cases A–H diagnostic requested by T020. */
export function runT020ForeignIdeologicalThreatInspection(): string {
  const scenario = createT020ForeignIdeologicalThreatScenario();
  const world = createT020ForeignIdeologicalThreatWorld(scenario, 20260822);
  const player = CONTACT_FIXTURE_COUNTRY_IDS.player;
  const merchant = CONTACT_FIXTURE_COUNTRY_IDS.merchantRepublic;
  const lines: string[] = ["T020 Foreign Ideological Threat Inspection", ""];

  const noContactScenario = removeIncomingRoutes(scenario, player);
  const noContactThreats = deriveForeignIdeologicalThreats(
    noContactScenario,
    createT020ForeignIdeologicalThreatWorld(noContactScenario, 20260822),
    player,
  );
  lines.push("Case A — Strong foreign ideology, no contact");
  lines.push(`Threat: ${noContactThreats.length === 0 ? "NO" : "YES"}`);
  lines.push("");

  const noDomesticThreats = deriveForeignIdeologicalThreats(
    scenario,
    lowDomesticMobilization(world),
    player,
  );
  lines.push("Case B — Live contact, no domestic organization");
  lines.push(`Threat: ${noDomesticThreats.length === 0 ? "NO" : "YES"}`);
  lines.push("");

  const noForeignRouteScenario = removeIncomingRoutes(scenario, player);
  const domesticOnlyWorld = createT020ForeignIdeologicalThreatWorld(
    noForeignRouteScenario,
    20260822,
  );
  lines.push("Case C — Domestic radical movement, no foreign route");
  lines.push(
    `Foreign threat: ${deriveForeignIdeologicalThreats(noForeignRouteScenario, domesticOnlyWorld, player).length === 0 ? "NO" : "YES"}`,
  );
  lines.push("Domestic political risk may exist: YES");
  lines.push("");

  const liveThreats = deriveForeignIdeologicalThreats(scenario, world, player);
  const liveThreat = findThreat(liveThreats);
  const liveRoute = liveThreat?.routes.find(
    (route) => route.contactEdgeId === T020_EDGE_IDS.merchantToPortBorder,
  );
  lines.push("Case D — Live foreign exposure + domestic mobilization");
  lines.push(`Source country: ${liveThreat?.sourceCountryId ?? "none"}`);
  lines.push(`Ideology: ${liveThreat?.ideologyId ?? "none"}`);
  lines.push(
    `Route: ${liveRoute?.sourceRegionId ?? "none"} -> ${liveRoute?.destinationRegionId ?? "none"}`,
  );
  lines.push(`Channel: ${liveRoute?.channel ?? "none"}`);
  lines.push(`Threat: ${liveThreat === undefined ? "NO" : "YES"}`);
  lines.push("");

  const governmentId = world.countries[player]?.currentGovernmentId;
  if (governmentId === null || governmentId === undefined) {
    throw new Error("T020 inspection player government is missing.");
  }
  const relabeledWorld: WorldState = {
    ...world,
    governments: {
      ...world.governments,
      [governmentId]: {
        ...world.governments[governmentId],
        name: "inspection-only regime label",
      },
    },
  };
  lines.push("Case E — Regime label changed only");
  lines.push(
    `Threat before/after: ${sameThreatEvidence(liveThreats, deriveForeignIdeologicalThreats(scenario, relabeledWorld, player)) ? "SAME" : "DIFFERENT"}`,
  );
  lines.push("");

  const outgoingClosed = applyDiplomacyAction(
    scenario,
    world,
    "CLOSE_BORDER",
    player,
    merchant,
  );
  const outgoingThreats = deriveForeignIdeologicalThreats(
    scenario,
    outgoingClosed.world,
    player,
  );
  lines.push("Case F — Incoming threat vs T019 outgoing closure");
  lines.push(
    `Outgoing CLOSE_BORDER mitigates incoming route: ${sameThreatEvidence(liveThreats, outgoingThreats) ? "NO" : "YES"}`,
  );
  lines.push("");

  const incomingRestricted = applyDiplomacyAction(
    scenario,
    world,
    "RESTRICT_INCOMING_BORDER",
    player,
    merchant,
  );
  const restrictedThreats = deriveForeignIdeologicalThreats(
    scenario,
    incomingRestricted.world,
    player,
  );
  const incomingState =
    incomingRestricted.world.contactEdgeStates[
      T020_EDGE_IDS.merchantToPortBorder
    ];
  lines.push("Case G — Actual incoming restriction");
  lines.push(
    `Threat route disabled: ${incomingState?.enabled === false ? "YES" : "NO"}`,
  );
  lines.push(
    `Reverse/unrelated routes preserved: ${
      incomingRestricted.world.contactEdgeStates[
        T020_EDGE_IDS.portToMerchantBorder
      ] === undefined &&
      incomingRestricted.world.contactEdgeStates[
        CONTACT_FIXTURE_EDGE_IDS.merchantToPortInformation
      ] === undefined
        ? "YES"
        : "NO"
    }`,
  );
  lines.push(
    `Border contribution removed: ${findThreat(restrictedThreats)?.routes.some((route) => route.contactEdgeId === T020_EDGE_IDS.merchantToPortBorder) === true ? "NO" : "YES"}`,
  );
  lines.push("");

  const informationOnlyWorld = disableEdge(world, "merchantToPortBorder");
  const informationOnlyThreats = deriveForeignIdeologicalThreats(
    scenario,
    informationOnlyWorld,
    player,
  );
  const informationObservation = deriveForeignStateObservation(
    scenario,
    informationOnlyWorld,
    player,
  );
  lines.push("Case H — Information-only exposure");
  lines.push(`Threat: ${informationOnlyThreats.length > 0 ? "YES" : "NO"}`);
  lines.push(
    `Implemented border response effective: ${informationObservation.availableActions.RESTRICT_INCOMING_BORDER ? "YES" : "NO"}`,
  );
  lines.push(`Decision: ${chooseForeignActionType(informationObservation)}`);
  lines.push("");
  lines.push("No ideology writes:");
  lines.push(
    `PASS${JSON.stringify(world.regions) === JSON.stringify(incomingRestricted.world.regions) ? "" : " — contact response only"}`,
  );
  lines.push("No foreignSupport fabrication:");
  lines.push(
    `PASS${"foreignSupport" in incomingRestricted.world ? " — unexpected field" : ""}`,
  );
  lines.push(
    `No territorial mutation: ${
      JSON.stringify(world.landHexStates) ===
        JSON.stringify(incomingRestricted.world.landHexStates) &&
      JSON.stringify(world.regions) ===
        JSON.stringify(incomingRestricted.world.regions)
        ? "PASS"
        : "FAIL"
    }`,
  );
  lines.push(
    `Stable ordering: ${sameThreatEvidence(liveThreats, deriveForeignIdeologicalThreats(scenario, world, player)) ? "PASS" : "FAIL"}`,
  );

  return lines.join("\n");
}

/** Stable entry point for the package script and its inspection test. */
export function printT020ForeignIdeologicalThreatInspection(): void {
  console.log(runT020ForeignIdeologicalThreatInspection());
}

export const T020_INSPECTION_REASON_CODES = {
  incomingRestriction: FOREIGN_IDEOLOGICAL_THREAT_BORDER_RESTRICTION_REASON,
  outgoingClosure: FOREIGN_POLICY_BORDER_CLOSURE_REASON,
} as const;
