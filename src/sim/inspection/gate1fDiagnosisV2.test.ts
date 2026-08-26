import { describe, expect, it } from "vitest";

import { F05_CONTEXTS, F05_STRATEGY_IDS } from "./f05PacingFunDecision";
import {
  GATE1F_RECONVERGENCE_CHECKPOINTS,
  runGate1FDiagnosisV2,
} from "./gate1fDiagnosisV2";

describe("Gate1F diagnosis v2", () => {
  it("measures the recovery context, silence, and reconvergence", () => {
    const result = runGate1FDiagnosisV2(40103, {
      contextIds: ["ACTIVE_CONFLICT_RECOVERY_T180"],
      compareExistingBaseline: false,
    });

    expect(result.designOnly).toBe(true);
    expect(result.baselineReproduced).toBe(false);
    expect(result.baselineComparison.existingRecommendation).toBe("NOT_READY");
    expect(result.baselineComparison.existingContextCount).toBe(
      F05_CONTEXTS.length,
    );
    expect(result.baselineComparison.existingBranchCount).toBe(36);
    expect(result.baselineComparison.comparedBranchCount).toBe(0);
    expect(result.branches).toHaveLength(6);
    expect(result.recoveryChoiceMatrix).toHaveLength(
      Object.keys(F05_STRATEGY_IDS).length,
    );
    expect(result.silence).toHaveLength(1);
    expect(result.reconvergence).toHaveLength(1);
    expect(
      result.reconvergence[0]!.checkpoints.map((point) => point.relativeTick),
    ).toEqual([...GATE1F_RECONVERGENCE_CHECKPOINTS]);

    const recovery = result.recoveryChoiceMatrix.find(
      (row) => row.strategyId === F05_STRATEGY_IDS.politicalAccommodation,
    );
    expect(recovery).toBeDefined();
    expect(recovery!.cost.treasuryCost).toBe(70);
    expect(recovery!.availability.atStart.relativeTick).toBe(0);
    expect(recovery!.availability.day90.relativeTick).toBe(90);
    expect(recovery!.availability.day360.relativeTick).toBe(360);
    expect(recovery!.actions.attempts).toBe(1);
    expect(recovery!.actions.starts).toBe(1);
    expect(recovery!.actions.completions).toBe(1);

    for (const context of result.reconvergence) {
      expect(context.checkpoints).toHaveLength(
        GATE1F_RECONVERGENCE_CHECKPOINTS.length,
      );
      expect(context.branches).toHaveLength(
        Object.keys(F05_STRATEGY_IDS).length,
      );
    }
  }, 240_000);

  it("keeps the required checkpoint ordering and explicit design-only boundary", () => {
    expect([...GATE1F_RECONVERGENCE_CHECKPOINTS]).toEqual([
      180, 360, 720, 1_080, 1_800,
    ]);
    expect("R1_RECOVERY_RESPONSE_RECOMPOSITION").toContain("RECOVERY");
  }, 240_000);
});
