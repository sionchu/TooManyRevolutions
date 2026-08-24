import { describe, expect, it } from "vitest";
import { runF05Fix10StructuralRemedySelection } from "./f05Fix10StructuralRemedySelection";

describe("F05_FIX10 interaction coverage selection", () => {
  it("measures the actual late action reachability without changing production semantics", () => {
    const result = runF05Fix10StructuralRemedySelection();

    expect(result.sourceF05Fix9LateBranchCount).toBe(6);
    expect(result.exactLateSilencePopulation).toBe(6);
    expect(result.lateMonthlyBoundaryCount).toBe(372);
    expect(result.blockerMonthlyBoundaryCount).toBe(372);
    expect(result.actionFrequency).toMatchObject({
      LOBBY: 0,
      BARGAIN: 0,
      ORGANIZE: 0,
      FUND_MOVEMENT: 372,
      ACCEPT: 0,
      WAIT: 0,
    });
    expect(result.secondLobbySelectionCount).toBe(0);
    expect(result.fundMovementSelectionCount).toBe(372);
    expect(result.organizeSelectionCount).toBe(0);
    expect(result.secondLobbyReachability).toBe("NOT_REACHABLE");
    expect(result.fundMovementReachability).toBe("REACHABLE");
    expect(result.organizeReachability).toBe("NOT_REACHABLE");
    expect(result.targetObjectRequired).toBe("YES");
    expect(result.productionGameplayChange).toBe("NONE");
    expect(result.historicalF05Baseline).toBe("UNCHANGED");
    expect(result.f05Fix9Diagnosis).toBe("UNCHANGED");
    expect(result.gate1fRecommendation).toBe("NOT_READY");
    expect(result.v02).toBe("NOT_STARTED");
    expect(result.monthlyBoundaries.every((row) => row.blockerState)).toBe(
      true,
    );
    expect(result.actionSchemaChangeRequired).toBe("YES");
    expect(result.primaryClassification).toBe(
      "COVERAGE_REQUIRES_ACTION_SCHEMA_TARGETING",
    );
  }, 600_000);
});
