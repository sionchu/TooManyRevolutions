import { describe, expect, it } from "vitest";

import {
  formatT017ATerritorialTopologyInspection,
  runT017ATerritorialTopologyInspection,
} from "./t017aTerritorialTopologyInspection";

describe("T017A headless territorial topology inspection harness", () => {
  it("prints reproducible static topology and authority checks", () => {
    const report = runT017ATerritorialTopologyInspection();
    const output = formatT017ATerritorialTopologyInspection(report);
    const repeatedOutput = formatT017ATerritorialTopologyInspection(
      runT017ATerritorialTopologyInspection(),
    );

    console.log(output);

    expect(repeatedOutput).toBe(output);
    expect(report.regionCount).toBe(7);
    expect(report.landHexCount).toBe(9);
    expect(report.regionRows.some((row) => row.landHexIds.length > 1)).toBe(
      true,
    );
    expect(report.crossRegionBorders.length).toBeGreaterThan(0);
    expect(report.checks.every((check) => check.passed)).toBe(true);
    expect(output).toContain(
      "LandHex.controller is the physical authority: YES",
    );
    expect(output).toContain("Region.controller is not stored: YES");
    expect(output).toContain(
      "ContactGraph independent from TerritorialTopology: YES",
    );
  });
});
