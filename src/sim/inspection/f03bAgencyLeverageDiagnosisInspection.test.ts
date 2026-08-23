import { describe, expect, it } from "vitest";
import { runF03BInspection } from "./f03bAgencyLeverageDiagnosis";

describe("F03B inspection", () => {
  it("prints a passing deterministic diagnosis", () => {
    const report = runF03BInspection();
    console.log(report.output);
    expect(report.allPassed).toBe(true);
    expect(report.output).toContain(
      "F03B Agency Leverage / Threshold Sensitivity Diagnosis",
    );
    expect(report.output).toContain(
      "Threshold/effect/cost/duration/cadence changes: NONE",
    );
  }, 240_000);
});
