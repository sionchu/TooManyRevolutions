import { describe, expect, it } from "vitest";

import { createGameEvent, type GameEvent } from "../events/event";
import { POLITICAL_CRISIS_FIXTURE_FACTION_IDS } from "../state/politicalCrisisFixture";
import {
  GAMEBUILDERS_PRODUCTION_CONTEXTUAL_CATALOG,
  GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS,
  GAMEBUILDERS_PRODUCTION_POLICY_IDS,
} from "../state/gameBuildersDecisionCatalog";
import { GAMEBUILDERS_DEMO_SCENARIO } from "../state/gameBuildersDemoScenario";
import type { Country } from "../state/country";
import { asConflictId } from "../state/ids";
import type { Faction } from "../state/faction";
import type { PolicyState } from "../state/policy";
import type { Region } from "../state/region";
import type { Conflict } from "../state/conflict";
import { createInitialWorldState, type WorldState } from "../state/world";
import type {
  ContextualDecisionCatalog,
  ContextualDecisionCandidate,
  ContextualDecisionSurface,
} from "./contextualDecisions";
import { deriveContextualDecisionSurface } from "./contextualDecisions";

const scenario = GAMEBUILDERS_DEMO_SCENARIO;
const playerCountryId = scenario.playerCountryId!;
const capitalRegionId = scenario.initialRegions[0]!.id;
const industrialRegionId = scenario.initialRegions[1]!.id;
const laborFactionId = scenario.initialFactions.find((faction) =>
  faction.interests.includes("labor"),
)!.id;

function initialWorld(): WorldState {
  return createInitialWorldState(scenario, 18970401);
}

function select(
  world: WorldState,
  options: {
    readonly recentEvents?: readonly GameEvent[];
    readonly agendas?: ContextualDecisionSurface["agendas"];
    readonly selectedScenario?: typeof scenario;
    readonly selectedCatalog?: ContextualDecisionCatalog;
  } = {},
): ContextualDecisionSurface {
  const recentEvents = options.recentEvents;
  return deriveContextualDecisionSurface({
    scenario: options.selectedScenario ?? scenario,
    world,
    playerCountryId,
    catalog:
      options.selectedCatalog ?? GAMEBUILDERS_PRODUCTION_CONTEXTUAL_CATALOG,
    ...(options.agendas === undefined ? {} : { agendas: options.agendas }),
    ...(recentEvents === undefined ? {} : { recentEvents }),
  });
}

function withCountry(
  world: WorldState,
  countryId: typeof playerCountryId,
  changes: Partial<Country>,
): WorldState {
  const country = world.countries[countryId];
  if (country === undefined) {
    throw new Error(`Test country ${countryId} is missing.`);
  }
  return {
    ...world,
    countries: {
      ...world.countries,
      [countryId]: { ...country, ...changes },
    },
  };
}

function withRegion(
  world: WorldState,
  regionId: typeof industrialRegionId,
  changes: Partial<Region>,
): WorldState {
  const region = world.regions[regionId];
  if (region === undefined) {
    throw new Error(`Test Region ${regionId} is missing.`);
  }
  return {
    ...world,
    regions: {
      ...world.regions,
      [regionId]: { ...region, ...changes },
    },
  };
}

function withFaction(
  world: WorldState,
  factionId: typeof laborFactionId,
  changes: Partial<Faction>,
): WorldState {
  const faction = world.factions[factionId];
  if (faction === undefined) {
    throw new Error(`Test faction ${factionId} is missing.`);
  }
  return {
    ...world,
    factions: {
      ...world.factions,
      [factionId]: { ...faction, ...changes },
    },
  };
}

function withRules(
  world: WorldState,
  changes: Partial<PolicyState["institutionalRules"]>,
): WorldState {
  const policyState = world.policies[playerCountryId];
  if (policyState === undefined) {
    throw new Error("Test policy state is missing.");
  }
  return {
    ...world,
    policies: {
      ...world.policies,
      [playerCountryId]: {
        ...policyState,
        institutionalRules: {
          ...policyState.institutionalRules,
          ...changes,
        },
      },
    },
  };
}

function withActivePolicies(
  world: WorldState,
  activePolicyIds: PolicyState["activePolicyIds"],
): WorldState {
  const policyState = world.policies[playerCountryId];
  if (policyState === undefined) {
    throw new Error("Test policy state is missing.");
  }
  return {
    ...world,
    policies: {
      ...world.policies,
      [playerCountryId]: {
        ...policyState,
        activePolicyIds: [...activePolicyIds],
        enactedAtTick: Object.fromEntries(
          activePolicyIds.map((policyId, index) => [policyId, index + 1]),
        ),
      },
    },
  };
}

function withConflict(world: WorldState, conflict: Conflict): WorldState {
  return {
    ...world,
    conflicts: {
      ...world.conflicts,
      [conflict.id]: conflict,
    },
  };
}

function calmWorld(): WorldState {
  let world = initialWorld();
  world = withCountry(world, playerCountryId, {
    treasury: 500,
    dailyIncome: 12,
    dailyExpenditure: 1,
  });
  for (const region of Object.values(world.regions)) {
    world = withRegion(world, region.id as typeof industrialRegionId, {
      resourceDemand: { food: 0, material: 0 },
      scarcity: 0.05,
      unrest: 0.05,
    });
  }
  for (const faction of Object.values(world.factions)) {
    if (faction.countryId !== playerCountryId) {
      continue;
    }
    world = withFaction(world, faction.id as typeof laborFactionId, {
      grievance: 0.1,
      organization: 0.1,
      influence: 0.1,
      resources: 0.1,
    });
  }
  return world;
}

function openingRulesWorld(): WorldState {
  return withActivePolicies(
    withRules(calmWorld(), {
      rulerVeto: false,
      legislatureRequired: true,
      suffrage: "universal",
      productiveProperty: "mixed",
      landOwnership: "private",
      laborOrganization: "legal",
      pressFreedom: "free",
      politicalCompetition: "plural",
    }),
    [
      GAMEBUILDERS_PRODUCTION_POLICY_IDS.legislativeOversight,
      GAMEBUILDERS_PRODUCTION_POLICY_IDS.propertySuffrage,
      GAMEBUILDERS_PRODUCTION_POLICY_IDS.broadSuffrage,
      GAMEBUILDERS_PRODUCTION_POLICY_IDS.universalSuffrage,
      GAMEBUILDERS_PRODUCTION_POLICY_IDS.productivePropertyMixed,
      GAMEBUILDERS_PRODUCTION_POLICY_IDS.privateLandOwnership,
      GAMEBUILDERS_PRODUCTION_POLICY_IDS.laborOrganizationOpening,
      GAMEBUILDERS_PRODUCTION_POLICY_IDS.pressFreedomOpening,
      GAMEBUILDERS_PRODUCTION_POLICY_IDS.oppositionPluralism,
    ],
  );
}

function highScarcityWorld(): WorldState {
  return withRegion(calmWorld(), industrialRegionId, {
    scarcity: 0.9,
    unrest: 0.25,
    resourceProductionCapacity: { food: 1, material: 5 },
    resourceDemand: { food: 20, material: 2 },
  });
}

function highLaborWorld(): WorldState {
  return withRules(
    withFaction(calmWorld(), laborFactionId, {
      grievance: 0.9,
      organization: 0.9,
      influence: 0.7,
      resources: 0.7,
    }),
    { laborOrganization: "legal" },
  );
}

function rebellionWorld(): WorldState {
  return withConflict(initialWorld(), {
    id: asConflictId("test.active-rebellion"),
    kind: "rebellion",
    status: "active",
    participantCountryIds: [playerCountryId],
    participantFactionIds: [laborFactionId],
    affectedRegionIds: [industrialRegionId],
    contestedRegionIds: [industrialRegionId],
    startedAtTick: 1,
  });
}

function coerciveWorld(): WorldState {
  return withActivePolicies(
    withRules(
      withFaction(calmWorld(), laborFactionId, {
        grievance: 0.9,
        organization: 0.9,
        influence: 0.8,
        resources: 0.8,
      }),
      {
        laborOrganization: "illegal",
        pressFreedom: "censored",
        politicalCompetition: "banned",
      },
    ),
    [
      GAMEBUILDERS_PRODUCTION_POLICY_IDS.laborOrganizationBan,
      GAMEBUILDERS_PRODUCTION_POLICY_IDS.pressCensorship,
      GAMEBUILDERS_PRODUCTION_POLICY_IDS.oppositionBan,
    ],
  );
}

function coupWorld(): WorldState {
  return withConflict(initialWorld(), {
    id: asConflictId("test.active-coup"),
    kind: "coup",
    status: "active",
    participantCountryIds: [playerCountryId],
    participantFactionIds: [POLITICAL_CRISIS_FIXTURE_FACTION_IDS.coup],
    affectedRegionIds: [capitalRegionId],
    contestedRegionIds: [],
    startedAtTick: 1,
  });
}

function ids(surface: ContextualDecisionSurface): readonly string[] {
  return surface.primaryShortlist.map((candidate) => candidate.id);
}

function signature(surface: ContextualDecisionSurface) {
  return surface.primaryShortlist.map((entry) => ({
    id: entry.id,
    kind: entry.kind,
    tier: entry.tier,
    reasons: entry.relevanceReasons.map((reason) => reason.code),
    availability: entry.availability,
  }));
}

function candidate(
  surface: ContextualDecisionSurface,
  id: string,
): ContextualDecisionCandidate | undefined {
  return surface.relevantCandidates.find((entry) => entry.id === id);
}

function reverseRecord<T>(
  record: Readonly<Record<string, T>>,
): Readonly<Record<string, T>> {
  return Object.fromEntries(Object.entries(record).reverse());
}

describe("contextual decision selector", () => {
  it("matches the canonical state shortlist identities and reasons", () => {
    const canonicalCases = [
      {
        name: "day0",
        surface: select(initialWorld()),
        expected: [
          [
            "gamebuilders.intervention.emergency-food-distribution",
            "intervention",
            "pressure",
            "MATERIAL_SCARCITY,FISCAL_PRESSURE",
            "AVAILABLE",
          ],
          [
            "gamebuilders.intervention.political-accommodation",
            "intervention",
            "pressure",
            "POLITICAL_OPPOSITION_PRESSURE",
            "AVAILABLE",
          ],
          [
            "gamebuilders.intervention.opposition-legalization",
            "intervention",
            "pressure",
            "POLITICAL_OPPOSITION_PRESSURE",
            "AVAILABLE",
          ],
          [
            "gamebuilders.intervention.labor-organization-opening",
            "intervention",
            "pressure",
            "LABOR_ORGANIZATION_PRESSURE,POLITICAL_OPPOSITION_PRESSURE",
            "AVAILABLE",
          ],
          [
            "gamebuilders.policy.legislative-oversight",
            "policy",
            "pressure",
            "POLITICAL_OPPOSITION_PRESSURE",
            "AVAILABLE",
          ],
        ],
      },
      {
        name: "scarcity",
        surface: select(highScarcityWorld()),
        expected: [
          [
            "gamebuilders.intervention.emergency-food-distribution",
            "intervention",
            "pressure",
            "MATERIAL_SCARCITY",
            "AVAILABLE",
          ],
          [
            "gamebuilders.intervention.labor-organization-opening",
            "intervention",
            "pressure",
            "LABOR_ORGANIZATION_PRESSURE",
            "AVAILABLE",
          ],
          [
            "gamebuilders.policy.labor-organization-opening",
            "policy",
            "pressure",
            "LABOR_ORGANIZATION_PRESSURE",
            "AVAILABLE",
          ],
          [
            "gamebuilders.policy.productive-property-mixed",
            "policy",
            "pressure",
            "MATERIAL_SCARCITY,PROPERTY_LAND_ORDER",
            "AVAILABLE",
          ],
          [
            "gamebuilders.intervention.labor-organization-restriction",
            "intervention",
            "pressure",
            "LABOR_ORGANIZATION_PRESSURE,COERCIVE_RESPONSE_WINDOW",
            "BLOCKED_BUT_RELEVANT",
          ],
        ],
      },
      {
        name: "labor",
        surface: select(highLaborWorld()),
        expected: [
          [
            "gamebuilders.policy.labor-organization-supervised-opening",
            "policy",
            "pressure",
            "LABOR_ORGANIZATION_PRESSURE",
            "BLOCKED_BUT_RELEVANT",
          ],
          [
            "gamebuilders.intervention.political-accommodation",
            "intervention",
            "pressure",
            "POLITICAL_OPPOSITION_PRESSURE",
            "AVAILABLE",
          ],
          [
            "gamebuilders.intervention.opposition-legalization",
            "intervention",
            "pressure",
            "POLITICAL_OPPOSITION_PRESSURE",
            "AVAILABLE",
          ],
          [
            "gamebuilders.intervention.labor-organization-opening",
            "intervention",
            "pressure",
            "LABOR_ORGANIZATION_PRESSURE,POLITICAL_OPPOSITION_PRESSURE",
            "BLOCKED_BUT_RELEVANT",
          ],
          [
            "gamebuilders.policy.legislative-oversight",
            "policy",
            "pressure",
            "POLITICAL_OPPOSITION_PRESSURE",
            "AVAILABLE",
          ],
        ],
      },
      {
        name: "rebellion",
        surface: select(rebellionWorld()),
        expected: [
          [
            "gamebuilders.intervention.emergency-food-distribution",
            "intervention",
            "crisis",
            "ACTIVE_REBELLION_RECOVERY,MATERIAL_SCARCITY,FISCAL_PRESSURE",
            "AVAILABLE",
          ],
          [
            "gamebuilders.intervention.industrial-material-allocation",
            "intervention",
            "crisis",
            "ACTIVE_REBELLION_RECOVERY,FISCAL_PRESSURE",
            "AVAILABLE",
          ],
          [
            "gamebuilders.intervention.political-accommodation",
            "intervention",
            "crisis",
            "ACTIVE_REBELLION_RECOVERY,POLITICAL_OPPOSITION_PRESSURE",
            "AVAILABLE",
          ],
          [
            "gamebuilders.intervention.opposition-legalization",
            "intervention",
            "crisis",
            "ACTIVE_REBELLION_RECOVERY,POLITICAL_OPPOSITION_PRESSURE",
            "AVAILABLE",
          ],
          [
            "gamebuilders.intervention.labor-organization-opening",
            "intervention",
            "crisis",
            "ACTIVE_REBELLION_RECOVERY,LABOR_ORGANIZATION_PRESSURE,POLITICAL_OPPOSITION_PRESSURE",
            "AVAILABLE",
          ],
        ],
      },
      {
        name: "opening",
        surface: select(openingRulesWorld()),
        expected: [
          [
            "gamebuilders.policy.public-productive-property",
            "policy",
            "background",
            "BACKGROUND_STRUCTURAL_OPTION",
            "AVAILABLE",
          ],
          [
            "gamebuilders.policy.communal-land-ownership",
            "policy",
            "background",
            "BACKGROUND_STRUCTURAL_OPTION",
            "AVAILABLE",
          ],
          [
            "gamebuilders.policy.labor-organization-restriction",
            "policy",
            "background",
            "BACKGROUND_STRUCTURAL_OPTION",
            "AVAILABLE",
          ],
          [
            "gamebuilders.policy.opposition-restriction",
            "policy",
            "background",
            "BACKGROUND_STRUCTURAL_OPTION",
            "AVAILABLE",
          ],
          [
            "gamebuilders.policy.press-restriction-restoration",
            "policy",
            "background",
            "BACKGROUND_STRUCTURAL_OPTION",
            "AVAILABLE",
          ],
        ],
      },
      {
        name: "coercive",
        surface: select(coerciveWorld()),
        expected: [
          [
            "gamebuilders.policy.labor-organization-supervised-opening",
            "policy",
            "pressure",
            "LABOR_ORGANIZATION_PRESSURE",
            "AVAILABLE",
          ],
          [
            "gamebuilders.policy.press-censorship-rollback",
            "policy",
            "pressure",
            "POLITICAL_OPPOSITION_PRESSURE",
            "AVAILABLE",
          ],
          [
            "gamebuilders.policy.opposition-restriction-restoration",
            "policy",
            "pressure",
            "POLITICAL_OPPOSITION_PRESSURE",
            "AVAILABLE",
          ],
          [
            "gamebuilders.intervention.political-accommodation",
            "intervention",
            "pressure",
            "POLITICAL_OPPOSITION_PRESSURE",
            "AVAILABLE",
          ],
          [
            "gamebuilders.intervention.opposition-legalization",
            "intervention",
            "pressure",
            "POLITICAL_OPPOSITION_PRESSURE",
            "AVAILABLE",
          ],
        ],
      },
      {
        name: "coup",
        surface: select(coupWorld()),
        expected: [
          [
            "gamebuilders.intervention.emergency-food-distribution",
            "intervention",
            "pressure",
            "MATERIAL_SCARCITY,FISCAL_PRESSURE",
            "AVAILABLE",
          ],
          [
            "gamebuilders.intervention.political-accommodation",
            "intervention",
            "pressure",
            "POLITICAL_OPPOSITION_PRESSURE",
            "AVAILABLE",
          ],
          [
            "gamebuilders.intervention.opposition-legalization",
            "intervention",
            "pressure",
            "POLITICAL_OPPOSITION_PRESSURE",
            "AVAILABLE",
          ],
          [
            "gamebuilders.intervention.labor-organization-opening",
            "intervention",
            "pressure",
            "LABOR_ORGANIZATION_PRESSURE,POLITICAL_OPPOSITION_PRESSURE",
            "AVAILABLE",
          ],
          [
            "gamebuilders.policy.legislative-oversight",
            "policy",
            "pressure",
            "POLITICAL_OPPOSITION_PRESSURE",
            "AVAILABLE",
          ],
        ],
      },
    ] as const;

    for (const canonicalCase of canonicalCases) {
      expect(
        signature(canonicalCase.surface).map((entry) => [
          entry.id,
          entry.kind,
          entry.tier,
          entry.reasons.join(","),
          entry.availability,
        ]),
        canonicalCase.name,
      ).toEqual(canonicalCase.expected);
    }
  });

  it("returns a bounded Day0 surface with separate relevance and feasibility", () => {
    const surface = select(initialWorld());

    expect(surface.primaryShortlist.length).toBeGreaterThanOrEqual(2);
    expect(surface.primaryShortlist.length).toBeLessThanOrEqual(5);
    expect(surface.relevantCandidates.length).toBeGreaterThanOrEqual(
      surface.primaryShortlist.length,
    );
    expect(
      surface.primaryShortlist.every(
        (entry) => entry.relevanceReasons.length > 0,
      ),
    ).toBe(true);
    expect(
      surface.primaryShortlist.every(
        (entry) =>
          entry.availability === "AVAILABLE" ||
          entry.availability === "BLOCKED_BUT_RELEVANT",
      ),
    ).toBe(true);
  });

  it("changes the primary mechanisms under scarcity, labor pressure, and opening rules", () => {
    const defaultIds = ids(select(initialWorld()));
    const scarcity = select(highScarcityWorld());
    const labor = select(highLaborWorld());
    const opening = select(openingRulesWorld());

    expect(ids(scarcity)).not.toEqual(ids(opening));
    expect(ids(labor)).not.toEqual(ids(scarcity));
    expect(
      scarcity.primaryShortlist.some(
        (entry) =>
          entry.id ===
          GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS.emergencyFoodDistribution,
      ),
    ).toBe(true);
    expect(
      scarcity.primaryShortlist.some((entry) =>
        entry.relevanceReasons.some(
          (reason) => reason.code === "MATERIAL_SCARCITY",
        ),
      ),
    ).toBe(true);
    expect(
      candidate(
        scarcity,
        GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS.industrialMaterialAllocation,
      ),
    ).toBeUndefined();
    expect(
      labor.relevantCandidates.some((entry) =>
        entry.relevanceReasons.some(
          (reason) => reason.code === "LABOR_ORGANIZATION_PRESSURE",
        ),
      ),
    ).toBe(true);
    expect(
      opening.primaryShortlist.every((entry) => entry.tier === "background"),
    ).toBe(true);
    expect(defaultIds.length).toBeGreaterThanOrEqual(2);
  });

  it("uses agenda event evidence without inventing a second event source", () => {
    const event = createGameEvent({
      tick: 4,
      sequence: 9,
      type: "RESOURCE_SHORTAGE_CHANGED",
      targetId: industrialRegionId,
      causeIds: [],
      payload: {
        regionId: industrialRegionId,
        resourceType: "food",
        previousScarcity: 0.2,
        scarcity: 0.9,
      },
      visibility: "world",
    });
    const surface = select(highScarcityWorld(), { recentEvents: [event] });
    const material = candidate(
      surface,
      GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS.emergencyFoodDistribution,
    );

    expect(material?.sourceEventIds).toContain(event.id);
    expect(
      material?.relevanceReasons.some((reason) =>
        reason.evidence.eventIds.includes(event.id),
      ),
    ).toBe(true);
    expect(
      surface.agendas.every((agenda) =>
        agenda.causeEventIds.every((eventId) => eventId === event.id),
      ),
    ).toBe(true);
  });

  it("marks relevant actions as blocked when normal treasury/headroom feasibility fails", () => {
    const blockedWorld = withCountry(highScarcityWorld(), playerCountryId, {
      treasury: 0,
      stateCapacity: 0,
    });
    const surface = select(blockedWorld);
    const material = candidate(
      surface,
      GAMEBUILDERS_PRODUCTION_INTERVENTION_IDS.emergencyFoodDistribution,
    );

    expect(material?.availability).toBe("BLOCKED_BUT_RELEVANT");
    expect(material?.kind).toBe("intervention");
    if (material?.kind !== "intervention") {
      throw new Error("Expected a production intervention candidate.");
    }
    expect(material.feasibility.feasible).toBe(false);
    expect(
      material.feasibility.reasons.some(
        (reason) => reason.kind === "INSUFFICIENT_TREASURY",
      ),
    ).toBe(true);
    expect(material.relevanceReasons.length).toBeGreaterThan(0);
  });

  it("prioritizes rebellion recovery but does not manufacture military or coup actions", () => {
    const rebellion = select(rebellionWorld());
    const coup = select(coupWorld());
    const rebellionRecovery = rebellion.relevantCandidates.filter((entry) =>
      entry.relevanceReasons.some(
        (reason) => reason.code === "ACTIVE_REBELLION_RECOVERY",
      ),
    );
    const coupText = coup.relevantCandidates
      .map((entry) => `${entry.id}:${entry.definition.name}`)
      .join("\n");

    expect(rebellion.activeConflictIds).toContain(
      asConflictId("test.active-rebellion"),
    );
    expect(rebellionRecovery.length).toBeGreaterThan(0);
    expect(rebellion.primaryShortlist[0]?.tier).toBe("crisis");
    expect(coup.activeConflictIds).toContain(asConflictId("test.active-coup"));
    expect(coupText).not.toMatch(/military|war|coup|쿠데타|전쟁|군사/i);
    expect(
      coup.relevantCandidates.some((entry) =>
        entry.relevanceReasons.some(
          (reason) => reason.code === "ACTIVE_REBELLION_RECOVERY",
        ),
      ),
    ).toBe(false);
  });

  it("is independent of catalog insertion order and does not mutate WorldState", () => {
    const world = highScarcityWorld();
    const before = JSON.stringify(world);
    const baseline = select(world);
    const reversedScenario = {
      ...scenario,
      policyCatalog: reverseRecord(scenario.policyCatalog),
      interventionCatalog: reverseRecord(scenario.interventionCatalog),
    } as typeof scenario;
    const reversedCatalog: ContextualDecisionCatalog = {
      policies: reverseRecord(
        GAMEBUILDERS_PRODUCTION_CONTEXTUAL_CATALOG.policies,
      ),
      interventions: reverseRecord(
        GAMEBUILDERS_PRODUCTION_CONTEXTUAL_CATALOG.interventions,
      ),
    };
    const reversed = select(world, {
      selectedScenario: reversedScenario,
      selectedCatalog: reversedCatalog,
    });

    expect(reversed).toEqual(baseline);
    expect(JSON.stringify(world)).toBe(before);
  });

  it("keeps the primary surface within the explicit maximum", () => {
    const surfaces = [
      select(initialWorld()),
      select(highScarcityWorld()),
      select(highLaborWorld()),
      select(rebellionWorld()),
      select(openingRulesWorld()),
      select(coerciveWorld()),
      select(coupWorld()),
    ];

    expect(
      surfaces.every((surface) => surface.primaryShortlist.length <= 6),
    ).toBe(true);
    expect(
      surfaces.every((surface) =>
        surface.primaryShortlist.every(
          (entry) => entry.kind === "policy" || entry.kind === "intervention",
        ),
      ),
    ).toBe(true);
    expect(
      surfaces.some((surface) =>
        surface.relevantCandidates.some(
          (entry) =>
            entry.id === GAMEBUILDERS_PRODUCTION_POLICY_IDS.oppositionPluralism,
        ),
      ),
    ).toBe(true);
  });
});
