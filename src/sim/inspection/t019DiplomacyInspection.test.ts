import { describe, expect, it } from "vitest";

import {
  formatT019DiplomacyInspection,
  runT019DiplomacyInspection,
} from "./t019DiplomacyInspection";

describe("T019 diplomacy inspection", () => {
  it("prints a reproducible foreign-state boundary report", () => {
    const report = runT019DiplomacyInspection();
    const output = formatT019DiplomacyInspection(report);
    const repeatedOutput = formatT019DiplomacyInspection(
      runT019DiplomacyInspection(),
    );

    console.log(output);

    expect(repeatedOutput).toBe(output);
    expect(report.foreignCountryIds).toHaveLength(2);
    expect(report.cases).toHaveLength(4);
    expect(report.checks.every((currentCheck) => currentCheck.passed)).toBe(
      true,
    );
    expect(output).toContain("Case B — Domestic instability + open border");
    expect(output).toContain(
      "ActionProposal → heuristic ActionRecord → diplomacy resolution: PASS",
    );
    expect(output).toContain("Foreign-to-foreign action: PASS");
    expect(output).toContain("reverse edge changed: NO");
    expect(output).toContain("T020 ideology motive used: NO");
  });
});
