import { describe, expect, it } from "vitest";

import {
  formatT018PoliticalCrisisInspection,
  runT018PoliticalCrisisInspection,
} from "./t018PoliticalCrisisInspection";

describe("T018 political crisis inspection", () => {
  it("prints a reproducible prerequisite boundary report", () => {
    const report = runT018PoliticalCrisisInspection();
    const output = formatT018PoliticalCrisisInspection(report);
    const repeatedOutput = formatT018PoliticalCrisisInspection(
      runT018PoliticalCrisisInspection(),
    );

    console.log(output);

    expect(repeatedOutput).toBe(output);
    expect(report.cases).toHaveLength(5);
    expect(report.checks.every((currentCheck) => currentCheck.passed)).toBe(
      true,
    );
    expect(output).toContain("Case B — Organized military elite");
    expect(output).toContain("Coup eligible | Rebellion eligible");
    expect(output).toContain("Region.controller usage: NO");
    expect(output).toContain("foreign support invented: NO");
    expect(output).toContain("Duplicate detection:");
  });
});
