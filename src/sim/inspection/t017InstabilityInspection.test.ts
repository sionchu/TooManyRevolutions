import { describe, expect, it } from "vitest";

import {
  formatT017InstabilityInspection,
  runT017InstabilityInspection,
} from "./t017InstabilityInspection";

describe("T017 headless instability inspection harness", () => {
  it("prints reproducible channel, accumulation, recovery, and aggregate checks", () => {
    const report = runT017InstabilityInspection();
    const output = formatT017InstabilityInspection(report);
    const repeatedOutput = formatT017InstabilityInspection(
      runT017InstabilityInspection(),
    );

    console.log(output);

    expect(repeatedOutput).toBe(output);
    expect(report.baseline.pressure.combinedPressure).toBe(0);
    expect(report.material.pressure.material.severity).toBe(1);
    expect(report.political.pressure.political.severity).toBeGreaterThan(
      report.politicalLowOrganization.pressure.political.severity,
    );
    expect(
      report.administrativeComparison.lowControl.administrative.severity,
    ).toBeGreaterThan(
      report.administrativeComparison.highControl.administrative.severity,
    );
    expect(report.recovery.checkpoints[0]?.unrest).toBeGreaterThan(0);
    expect(report.recovery.checkpoints.at(-1)?.unrest).toBeLessThan(
      report.recovery.checkpoints[0]?.unrest ?? 1,
    );
    expect(report.countryAggregate.finalInstability).toBe(65);
    expect(output).toContain("## Scenario comparison");
    expect(output).toContain("## Country aggregation check");
  });
});
