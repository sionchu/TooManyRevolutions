import { describe, expect, it } from "vitest";
import {
  getF03BDiagnosisDeterministicSignature,
  runF03BDiagnosis,
} from "./f03bAgencyLeverageDiagnosis";
import { createGate1FValidationScenario } from "../state/gate1fValidationFixture";
import { F03_BRANCH_IDS } from "./f03InterventionCounterfactuals";

describe("F03B agency leverage diagnosis", () => {
  it("is deterministic and keeps the measurement boundary read-only", () => {
    const scenario = createGate1FValidationScenario();
    const before = JSON.stringify(scenario);
    const first = runF03BDiagnosis(scenario, 40103, 1);
    const second = runF03BDiagnosis(scenario, 40103, 1);

    expect(getF03BDiagnosisDeterministicSignature(first)).toBe(
      getF03BDiagnosisDeterministicSignature(second),
    );
    expect(first.f03.startingStates).toHaveLength(3);
    expect(
      first.checkpoints.flatMap((checkpoint) => checkpoint.branches),
    ).toHaveLength(9);
    expect(
      first.checkpoints
        .flatMap((checkpoint) => checkpoint.branches)
        .every((branch) => branch.branchId !== F03_BRANCH_IDS.wait),
    ).toBe(true);
    expect(JSON.stringify(scenario)).toBe(before);
  }, 15_000);

  it("records actual T018 margins and cadence counts", () => {
    const result = runF03BDiagnosis(createGate1FValidationScenario(), 40103, 1);
    const short = result.checkpoints[0]?.branches.find(
      (branch) => branch.branchId === F03_BRANCH_IDS.short,
    );

    expect(short).toBeDefined();
    expect(short!.t018EvaluationCount).toBeGreaterThan(0);
    expect(short!.monthlyFactionBoundaryCount).toBeGreaterThan(0);
    expect(short!.t021WeeklyBoundaryCount).toBeGreaterThan(0);
    expect(short!.eligibilityWindows).toEqual([]);
    const long = result.checkpoints[0]?.branches.find(
      (branch) => branch.branchId === F03_BRANCH_IDS.long,
    );
    expect(long!.eligibilityWindows.length).toBeGreaterThan(0);
    expect(short!.prerequisiteCheckpoints[0]?.candidates[0]?.gates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ margin: expect.any(Number) }),
      ]),
    );
  }, 15_000);
});
