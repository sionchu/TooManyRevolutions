import { describe, expect, it } from "vitest";
import { runF05Fix9Inspection } from "./f05Fix9LateSteadyStateAudit";

describe("F05_FIX9 late steady-state audit", () => {
  it("audits the complete proposal matrix without authorizing a repair", () => {
    const report = runF05Fix9Inspection();

    expect(report.allPassed).toBe(true);
    expect(report.result.proposalBranchCount).toBe(108);
    expect(report.result.allProposalBranchesPresent).toBe(true);
    expect(report.result.exactLateSilencePopulation).toBeGreaterThan(0);
    expect(report.result.historicalF05Regression).toBe("UNCHANGED");
    expect(report.result.nonAcceptDivergences).toBe(0);
    expect(report.result.identicalReopenChurn).toBe(0);
    expect(report.result.implementation).toBe("NONE");
    expect(report.result.gate1fRecommendation).toBe("NOT_READY");
    expect(report.result.v02).toBe("NOT_STARTED");
  }, 600_000);
});
