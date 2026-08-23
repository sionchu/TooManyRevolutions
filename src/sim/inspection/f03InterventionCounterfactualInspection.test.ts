import { describe, expect, it } from "vitest";

import {
  formatF03Inspection,
  runF03Inspection,
} from "./f03InterventionCounterfactuals";

describe("F03 intervention counterfactual inspection", () => {
  it("prints the Gate 1F counterfactual evidence", () => {
    const report = runF03Inspection();
    const output = formatF03Inspection(report);

    console.log(report.output);
    expect(report.allPassed).toBe(true);
    expect(output).toContain("F03 Intervention Counterfactuals");
    expect(output).toContain("T021 fixture: UNSUITABLE");
    expect(output).toContain("Gate1F fixture: SUITABLE");
    expect(output).toContain("Balance changes: NONE");
  }, 240_000);
});
