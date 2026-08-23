import { describe, expect, it } from "vitest";

import {
  formatT017BTerritorialAuthorityMigrationInspection,
  runT017BTerritorialAuthorityMigrationInspection,
} from "./t017bTerritorialAuthorityMigrationInspection";

describe("T017B territorial authority migration inspection", () => {
  it("passes the authoritative migration contract reproducibly", () => {
    const report = runT017BTerritorialAuthorityMigrationInspection();
    const output = formatT017BTerritorialAuthorityMigrationInspection(report);
    const repeatedOutput = formatT017BTerritorialAuthorityMigrationInspection(
      runT017BTerritorialAuthorityMigrationInspection(),
    );

    console.log(output);

    expect(repeatedOutput).toBe(output);
    expect(report.regionRows).toHaveLength(7);
    expect(report.regionRows.some((row) => row.landHexIds.length > 1)).toBe(
      true,
    );
    expect(report.checks.every((item) => item.passed)).toBe(true);
    expect(output).toContain(
      "LandHexRuntimeState.controller is the sole writable physical control",
    );
    expect(output).toContain("N mutation API: PASS");
    expect(output).toContain("P alternate cardinality: PASS");
  });
});
