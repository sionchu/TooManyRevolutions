import { describe, expect, it } from "vitest";

import { appendEvent, createEventStore } from "../events/eventStore";
import { assertWorldStateInvariants } from "../core/invariants";
import { runSimulationStep } from "../core/tick";
import { createDeterministicActionId } from "../state/action";
import {
  asEventId,
  asIdeologyId,
  asPolicyId,
  type CountryId,
  type PolicyId,
} from "../state/ids";
import type { ValidatedActionRecord } from "../state/action";
import {
  createPolicyFixtureScenario,
  POLICY_FIXTURE_IDS,
} from "../state/policyFixture";
import { createInitialWorldState, type WorldState } from "../state/world";
import { deriveRegimeClassification } from "../state/government";
import { createPolicyPhaseHook } from "./policy";

function createFixtureWorld(): {
  readonly scenario: ReturnType<typeof createPolicyFixtureScenario>;
  readonly world: WorldState;
  readonly countryId: CountryId;
} {
  const scenario = createPolicyFixtureScenario();
  const countryId = scenario.playerCountryId;

  if (countryId === null) {
    throw new Error("Policy fixture must have a player country.");
  }

  return {
    scenario,
    world: createInitialWorldState(scenario, 77),
    countryId,
  };
}

function enactPolicyAction(
  sequence: number,
  tick: number,
  policyId: PolicyId,
  countryId?: CountryId,
): ValidatedActionRecord {
  return {
    id: createDeterministicActionId(tick, sequence, "player", "ENACT_POLICY"),
    tick,
    sequence,
    source: "player",
    actionType: "ENACT_POLICY",
    payload: countryId === undefined ? { policyId } : { policyId, countryId },
    schemaVersion: 1,
    validationOutcome: { kind: "accepted" },
  };
}

function runPolicyStep(
  scenario: ReturnType<typeof createPolicyFixtureScenario>,
  world: WorldState,
  actions: readonly ValidatedActionRecord[],
) {
  return runSimulationStep(
    world,
    { actions },
    { resolveValidatedActions: createPolicyPhaseHook(scenario) },
  );
}

describe("T012 policy rule engine", () => {
  it("keeps static definitions in ScenarioDefinition and mutable rules in WorldState", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const abolition =
      scenario.policyCatalog[POLICY_FIXTURE_IDS.abolishRoyalVeto];

    expect(abolition?.ruleMutations).toEqual({
      rulerVeto: false,
      legislatureRequired: true,
    });
    expect(world.policies[countryId]?.institutionalRules.rulerVeto).toBe(true);
    expect(world).not.toHaveProperty("policyCatalog");
  });

  it("enacts a valid policy and changes only its declared institutional rules", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const result = runPolicyStep(scenario, world, [
      enactPolicyAction(0, 1, POLICY_FIXTURE_IDS.abolishRoyalVeto),
    ]);
    const policyState = result.nextWorld.policies[countryId];

    expect(policyState?.activePolicyIds).toEqual([
      POLICY_FIXTURE_IDS.abolishRoyalVeto,
    ]);
    expect(policyState?.enactedAtTick).toEqual({
      [POLICY_FIXTURE_IDS.abolishRoyalVeto]: 1,
    });
    expect(policyState?.institutionalRules).toMatchObject({
      rulerVeto: false,
      legislatureRequired: true,
      suffrage: "elite",
    });
    expect(result.emittedEvents.map((event) => event.type)).toEqual([
      "POLICY_ENACTED",
      "INSTITUTION_RULE_CHANGED",
      "INSTITUTION_RULE_CHANGED",
      "TICK_ADVANCED",
    ]);
  });

  it("rejects an unknown policy ID without changing policy state", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const result = runPolicyStep(scenario, world, [
      enactPolicyAction(0, 1, asPolicyId("fixture.unknown-policy")),
    ]);

    expect(result.nextWorld.policies).toBe(world.policies);
    expect(result.emittedEvents[0]).toMatchObject({
      type: "POLICY_REJECTED",
      payload: { reason: "unknownPolicy", countryId },
    });
  });

  it("enforces declarative prerequisites", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const result = runPolicyStep(scenario, world, [
      enactPolicyAction(0, 1, POLICY_FIXTURE_IDS.universalSuffrage),
    ]);

    expect(result.nextWorld.policies).toBe(world.policies);
    expect(result.emittedEvents[0]).toMatchObject({
      type: "POLICY_REJECTED",
      payload: {
        reason: "prerequisiteNotMet",
        policyId: POLICY_FIXTURE_IDS.universalSuffrage,
        countryId,
      },
    });
  });

  it("handles incompatibilities deterministically and suppresses unchanged rule events", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const actions = [
      enactPolicyAction(0, 1, POLICY_FIXTURE_IDS.abolishRoyalVeto),
      enactPolicyAction(1, 1, POLICY_FIXTURE_IDS.aristocraticSuffrage),
      enactPolicyAction(2, 1, POLICY_FIXTURE_IDS.universalSuffrage),
    ];
    const result = runPolicyStep(scenario, world, actions);
    const policyState = result.nextWorld.policies[countryId];

    expect(policyState?.activePolicyIds).toEqual([
      POLICY_FIXTURE_IDS.abolishRoyalVeto,
      POLICY_FIXTURE_IDS.aristocraticSuffrage,
    ]);
    expect(policyState?.institutionalRules.suffrage).toBe("elite");
    expect(
      result.emittedEvents.filter(
        (event) => event.type === "INSTITUTION_RULE_CHANGED",
      ),
    ).toHaveLength(2);
    expect(
      result.emittedEvents.find((event) => event.type === "POLICY_REJECTED"),
    ).toMatchObject({
      type: "POLICY_REJECTED",
      payload: { reason: "incompatiblePolicy" },
    });
  });

  it("applies same-tick actions in their validated global order", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const result = runPolicyStep(scenario, world, [
      enactPolicyAction(0, 1, POLICY_FIXTURE_IDS.abolishRoyalVeto),
      enactPolicyAction(1, 1, POLICY_FIXTURE_IDS.universalSuffrage),
    ]);
    const policyState = result.nextWorld.policies[countryId];

    expect(policyState?.activePolicyIds).toEqual([
      POLICY_FIXTURE_IDS.abolishRoyalVeto,
      POLICY_FIXTURE_IDS.universalSuffrage,
    ]);
    expect(policyState?.institutionalRules).toMatchObject({
      rulerVeto: false,
      legislatureRequired: true,
      suffrage: "universal",
    });
  });

  it("produces the same policy result for the same world and actions", () => {
    const first = createFixtureWorld();
    const second = createFixtureWorld();
    const actions = [
      enactPolicyAction(0, 1, POLICY_FIXTURE_IDS.abolishRoyalVeto),
      enactPolicyAction(1, 1, POLICY_FIXTURE_IDS.universalSuffrage),
    ];

    expect(runPolicyStep(first.scenario, first.world, actions)).toEqual(
      runPolicyStep(second.scenario, second.world, actions),
    );
  });

  it("keeps policy mutation inside the authoritative step and does not mutate input WorldState", () => {
    const { scenario, world } = createFixtureWorld();
    const before = JSON.parse(JSON.stringify(world));

    runPolicyStep(scenario, world, [
      enactPolicyAction(0, 1, POLICY_FIXTURE_IDS.abolishRoyalVeto),
    ]);

    expect(world).toEqual(before);
  });

  it("emits deterministic policy events with existing-only causal references", () => {
    const { scenario, world } = createFixtureWorld();
    const result = runPolicyStep(scenario, world, [
      enactPolicyAction(0, 1, POLICY_FIXTURE_IDS.abolishRoyalVeto),
    ]);
    const store = result.emittedEvents.reduce(
      (currentStore, event) => appendEvent(currentStore, event),
      createEventStore(),
    );
    const enacted = store.events.find(
      (event) => event.type === "POLICY_ENACTED",
    );
    const ruleChanges = store.events.filter(
      (event) => event.type === "INSTITUTION_RULE_CHANGED",
    );

    expect(enacted).toBeDefined();
    expect(ruleChanges).toHaveLength(2);
    expect(
      ruleChanges.every((event) => event.causeIds[0] === enacted?.id),
    ).toBe(true);
    expect(result.emittedEvents.map((event) => event.id)).toEqual([
      "event:1:0:POLICY_ENACTED",
      "event:1:1:INSTITUTION_RULE_CHANGED",
      "event:1:2:INSTITUTION_RULE_CHANGED",
      "event:1:3:TICK_ADVANCED",
    ]);
  });

  it("derives a regime label without storing it or ending the run", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const result = runPolicyStep(scenario, world, [
      enactPolicyAction(0, 1, POLICY_FIXTURE_IDS.abolishRoyalVeto),
      enactPolicyAction(1, 1, POLICY_FIXTURE_IDS.universalSuffrage),
    ]);
    const country = result.nextWorld.countries[countryId];
    const policyState = result.nextWorld.policies[countryId];

    if (country === undefined || policyState === undefined) {
      throw new Error("Policy fixture state is missing.");
    }

    expect(deriveRegimeClassification(policyState).classification).toBe(
      "democracy",
    );
    expect(country.id).toBe(countryId);
    expect(country.currentGovernmentId).toBe(
      world.countries[countryId]?.currentGovernmentId,
    );
    expect(result.nextWorld.run.outcome.status).toBe("active");
    expect(country).not.toHaveProperty("regime");
    expect(result.nextWorld.governments).not.toHaveProperty("regime");
  });

  it("does not change ideology support, radicalism, organization, or core metrics", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const regionId = Object.keys(world.regions)[0];
    const region = world.regions[regionId as keyof typeof world.regions];
    const ideologyId = asIdeologyId("fixture.ideology");
    const country = world.countries[countryId];

    if (region === undefined || country === undefined) {
      throw new Error("Policy fixture state is missing.");
    }

    const ideologicWorld: WorldState = {
      ...world,
      regions: {
        ...world.regions,
        [region.id]: {
          ...region,
          ideology: {
            [ideologyId]: {
              support: 0.4,
              radicalism: 0.2,
              organization: 0.1,
            },
          },
        },
      },
    };
    const result = runPolicyStep(scenario, ideologicWorld, [
      enactPolicyAction(0, 1, POLICY_FIXTURE_IDS.abolishRoyalVeto),
    ]);
    const nextCountry = result.nextWorld.countries[countryId];

    expect(result.nextWorld.regions[region.id]?.ideology).toEqual(
      ideologicWorld.regions[region.id]?.ideology,
    );
    expect(nextCountry).toMatchObject({
      treasury: country.treasury,
      legitimacy: country.legitimacy,
      stateCapacity: country.stateCapacity,
      production: country.production,
      militaryPower: country.militaryPower,
      instability: country.instability,
      stateContinuity: country.stateContinuity,
    });
  });

  it("does not execute a policy action for a terminal run", () => {
    const { scenario, world, countryId } = createFixtureWorld();
    const terminalWorld: WorldState = {
      ...world,
      run: {
        ...world.run,
        outcome: {
          status: "won",
          kind: "orderConsolidated",
          atTick: 0,
          causeEventId: asEventId("event:0:0:ORDER_CONSOLIDATED"),
        },
      },
    };

    const result = runPolicyStep(scenario, terminalWorld, [
      enactPolicyAction(0, 1, POLICY_FIXTURE_IDS.abolishRoyalVeto),
    ]);

    expect(result.nextWorld).toBe(terminalWorld);
    expect(result.emittedEvents).toEqual([]);
    expect(result.nextWorld.policies[countryId]).toEqual(
      terminalWorld.policies[countryId],
    );
  });

  it("validates the resulting state with the shared invariants", () => {
    const { scenario, world } = createFixtureWorld();
    const result = runPolicyStep(scenario, world, [
      enactPolicyAction(0, 1, POLICY_FIXTURE_IDS.abolishRoyalVeto),
    ]);

    expect(() => assertWorldStateInvariants(result.nextWorld)).not.toThrow();
  });
});
