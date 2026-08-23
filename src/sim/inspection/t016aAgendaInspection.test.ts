import { describe, expect, it } from "vitest";
import {
  formatT016AAgendaInspection,
  runT016AAgendaInspection,
} from "./t016aAgendaInspection";

describe("T016A headless agenda inspection harness", () => {
  it("prints a reproducible current-pressure table and counterexample", () => {
    const report = runT016AAgendaInspection();
    const output = formatT016AAgendaInspection(report);
    const repeatedOutput = formatT016AAgendaInspection(
      runT016AAgendaInspection(),
    );

    console.log(output);

    expect(repeatedOutput).toBe(output);
    expect(report.agendas.length).toBeGreaterThanOrEqual(2);
    expect(report.agendas.length).toBeLessThanOrEqual(4);
    expect(output).toContain("## Current primary agendas");
    expect(output).toContain("## Counterexample after pressure removal");
    expect(report.resolvedAgendas).toEqual([]);
  });
});
