import { describe, expect, it } from "vitest";

import {
  F03_BRANCH_IDS,
  getF03SurveyDeterministicSignature,
  runF03Survey,
} from "./f03InterventionCounterfactuals";
import { createGate1FValidationScenario } from "../state/gate1fValidationFixture";

describe("F03 intervention counterfactuals", () => {
  it("branches from the same snapshot and keeps the result deterministic", () => {
    const scenario = createGate1FValidationScenario();
    const first = runF03Survey(scenario, 40103, 2, {
      startingCheckpointTicks: [0],
    });
    const second = runF03Survey(scenario, 40103, 2, {
      startingCheckpointTicks: [0],
    });

    expect(getF03SurveyDeterministicSignature(first)).toBe(
      getF03SurveyDeterministicSignature(second),
    );
    expect(first.startingStates).toHaveLength(1);
    expect(
      first.startingStates[0]?.branches.map((branch) => branch.branchId),
    ).toEqual([
      F03_BRANCH_IDS.long,
      F03_BRANCH_IDS.prerequisite,
      F03_BRANCH_IDS.short,
      F03_BRANCH_IDS.wait,
    ]);
  }, 15_000);

  it("is independent of branch order and does not mutate the fixture", () => {
    const scenario = createGate1FValidationScenario();
    const before = JSON.stringify(scenario);
    const ordered = runF03Survey(scenario, 40104, 1, {
      startingCheckpointTicks: [0],
    });
    const reversed = runF03Survey(scenario, 40104, 1, {
      startingCheckpointTicks: [0],
      branchOrder: [
        F03_BRANCH_IDS.prerequisite,
        F03_BRANCH_IDS.long,
        F03_BRANCH_IDS.short,
        F03_BRANCH_IDS.wait,
      ],
    });

    expect(getF03SurveyDeterministicSignature(ordered)).toBe(
      getF03SurveyDeterministicSignature(reversed),
    );
    expect(JSON.stringify(scenario)).toBe(before);
  });

  it("uses the legal action seam and exposes immediate intervention deltas", () => {
    const result = runF03Survey(createGate1FValidationScenario(), 40105, 1, {
      startingCheckpointTicks: [0],
    });
    const state = result.startingStates[0]!;
    const wait = state.branches.find(
      (branch) => branch.branchId === F03_BRANCH_IDS.wait,
    )!;
    const short = state.branches.find(
      (branch) => branch.branchId === F03_BRANCH_IDS.short,
    )!;
    const comparison = result.comparisons.find(
      (candidate) =>
        candidate.startingStateId === state.id &&
        candidate.interventionBranchId === F03_BRANCH_IDS.short,
    )!;

    expect(wait.actionId).toBeNull();
    expect(short.accepted).toBe(true);
    expect(short.actionId).not.toBeNull();
    expect(short.events.interventionStarted).toBe(1);
    expect(short.events.interventionEffectsApplied).toBe(1);
    expect(comparison.immediateStateDivergence).toBe(true);
    expect(comparison.deltas.day1.treasury).toBeLessThan(0);
    expect(
      result.causalAudits.find(
        (audit) =>
          audit.startingStateId === state.id &&
          audit.branchId === F03_BRANCH_IDS.short,
      ),
    ).toMatchObject({
      completionEffectKinds: ["regionResourceProductionCapacityDelta"],
      existingDownstreamConsumerObserved: true,
      t017DownstreamDifference: true,
      deadEnd: false,
    });
  });

  it("observes faction prerequisite consumers for political completion effects", () => {
    const result = runF03Survey(createGate1FValidationScenario(), 40107, 1, {
      startingCheckpointTicks: [0],
    });

    expect(
      result.causalAudits.filter(
        (audit) =>
          audit.branchId === F03_BRANCH_IDS.long ||
          audit.branchId === F03_BRANCH_IDS.prerequisite,
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          t018DownstreamDifference: true,
          existingDownstreamConsumerObserved: true,
          deadEnd: false,
        }),
      ]),
    );
  });

  it("reports infeasible intervention branches without forcing state changes", () => {
    const base = createGate1FValidationScenario();
    const playerId = base.playerCountryId!;
    const scenario = {
      ...base,
      initialCountries: base.initialCountries.map((country) =>
        country.id === playerId ? { ...country, treasury: 0 } : country,
      ),
    };
    const result = runF03Survey(scenario, 40106, 1, {
      startingCheckpointTicks: [0],
    });
    const state = result.startingStates[0]!;
    const short = state.branches.find(
      (branch) => branch.branchId === F03_BRANCH_IDS.short,
    )!;

    expect(short.accepted).toBe(false);
    expect(short.feasibility?.reasons[0]?.kind).toBe("INSUFFICIENT_TREASURY");
    expect(short.executedTicks).toBe(0);
    expect(short.events.interventionStarted).toBe(0);
  });
});
