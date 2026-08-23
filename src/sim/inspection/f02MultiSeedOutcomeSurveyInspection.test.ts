import { describe, expect, it } from "vitest";

import { runF02SurveyInspectionAsync } from "./f02MultiSeedOutcomeSurvey";

describe("F02 multi-seed outcome survey inspection", () => {
  it("runs the developer-only 24-seed 40-year WAIT survey", async () => {
    const report = await runF02SurveyInspectionAsync();

    console.log(report.output);
    expect(report.allPassed).toBe(true);
    expect(report.result.seeds).toHaveLength(24);
    expect(report.result.horizonYears).toBe(40);
    expect(report.output).toContain("F02 Multi-seed Outcome Survey");
    expect(report.output).toContain("Policy: WAIT");
    expect(report.output).toContain(
      "F03 intervention counterfactual: COMPLETE / PLAYER_AGENCY_WEAK (inspect:f03)",
    );
    expect(report.output).toContain("V02 renderer: NOT STARTED");

    const baseline = report.result.seedResults.find(
      (result) => result.summary.seed === 40101,
    );
    expect(baseline?.summary.terminal.outcome).toBe("active");
    expect(baseline?.summary.events.rebellionDetections).toBe(1);
    expect(baseline?.summary.events.coupAttempts).toBe(1);
    expect(baseline?.summary.events.civilWarsStarted).toBe(0);
    expect(baseline?.summary.events.governmentTransitions).toBe(0);
    expect(baseline?.summary.events.landHexControlChanges).toBe(3);
    expect(baseline?.summary.state.startingControlledLandHexes).toBe(3);
    expect(baseline?.summary.state.minimumControlledLandHexes).toBe(0);
    expect(baseline?.summary.state.finalControlledLandHexes).toBe(0);
  }, 600_000);
});
