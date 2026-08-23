import { describe, expect, it } from "vitest";
import {
  formatT016BInterventionCapacityInspection,
  runT016BInterventionCapacityInspection,
} from "./t016bInterventionCapacityInspection";

describe("T016B headless intervention capacity inspection harness", () => {
  it("prints a reproducible capacity, feasibility, and release checkpoint", () => {
    const report = runT016BInterventionCapacityInspection();
    const output = formatT016BInterventionCapacityInspection(report);
    const repeatedOutput = formatT016BInterventionCapacityInspection(
      runT016BInterventionCapacityInspection(),
    );

    console.log(output);

    expect(repeatedOutput).toBe(output);
    expect(report.initial.stateCapacity).toBe(60);
    expect(report.initial.committedAdministrativeLoad).toBe(27);
    expect(report.initial.administrativeHeadroom).toBe(33);
    expect(report.afterLongStart.committedAdministrativeLoad).toBe(47);
    expect(report.afterLongStart.administrativeHeadroom).toBe(13);
    expect(report.afterRejectedRequest.committedAdministrativeLoad).toBe(47);
    expect(report.afterLongCompletion.committedAdministrativeLoad).toBe(27);
    expect(report.afterLongCompletion.administrativeHeadroom).toBe(33);
    expect(report.counterexample.metrics.administrativeOverload).toBe(10);
    expect(report.counterexample.feasibility.feasible).toBe(false);
    expect(output).toContain("## Capacity / treasury timeline");
    expect(output).toContain("INSUFFICIENT_ADMINISTRATIVE_HEADROOM");
  });
});
