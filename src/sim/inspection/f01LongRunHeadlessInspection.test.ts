import { describe, expect, it } from "vitest";

import { runF01LongRunInspectionAsync } from "./f01LongRunHeadless";

describe("F01 long-run headless inspection", () => {
  it("runs the developer-only 5/10/20/40-year WAIT benchmark", async () => {
    const report = await runF01LongRunInspectionAsync();

    console.log(report.output);
    expect(report.allPassed).toBe(true);
    expect(
      report.summaries.map((summary) => summary.performance.requestedYears),
    ).toEqual([5, 10, 20, 40]);
    expect(report.output).toContain("F01 Long-run Headless Validation");
    expect(report.output).toContain("Policy: WAIT");
    expect(report.output).toContain(
      "F02 multi-seed diversity: COMPLETE / PASS (inspect:f02)",
    );
    expect(report.output).toContain("V02 renderer: NOT STARTED");
  }, 180_000);
});
